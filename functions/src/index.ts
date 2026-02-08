import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { Resend } from 'resend';

// Firebase Admin 초기화
admin.initializeApp();
const db = admin.firestore();

// Resend API 키 Secret 정의
const resendApiKey = defineSecret('RESEND_API_KEY');

// Resend 클라이언트 생성
const getResendClient = () => {
  const apiKey = resendApiKey.value();
  if (!apiKey) {
    throw new HttpsError('failed-precondition', 'Email service not configured');
  }
  return new Resend(apiKey);
};

// 6자리 OTP 생성
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// OTP 발송 함수
export const sendOTP = onCall({
  secrets: [resendApiKey],
  invoker: 'public',  // 인증 없이 호출 허용
}, async (request) => {
  const { email } = request.data;

  if (!email || typeof email !== 'string') {
    throw new HttpsError('invalid-argument', '이메일 주소가 필요합니다.');
  }

  // 이메일 형식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new HttpsError('invalid-argument', '올바른 이메일 형식이 아닙니다.');
  }

  // Rate limiting: 1분에 1번만 발송 가능
  const otpRef = db.collection('otpCodes').doc(email);
  const existingOtp = await otpRef.get();

  if (existingOtp.exists) {
    const data = existingOtp.data();
    const lastSent = data?.createdAt?.toDate();
    if (lastSent && Date.now() - lastSent.getTime() < 60000) {
      throw new HttpsError('resource-exhausted', '1분 후에 다시 시도해주세요.');
    }
  }

  // OTP 생성
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5분 후 만료

  // Firestore에 OTP 저장
  await otpRef.set({
    code: otp,
    email: email,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
    attempts: 0,
    verified: false,
  });

  // 이메일 발송
  try {
    const resend = getResendClient();
    await resend.emails.send({
      from: 'TOOK <noreply@took.best>',
      to: email,
      subject: '[TOOK] 이메일 인증 코드',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #6366F1; margin: 0; font-size: 32px;">TOOK</h1>
            <p style="color: #6B7280; margin-top: 8px;">스테이블코인 예치 플랫폼</p>
          </div>

          <div style="background: #F3F4F6; border-radius: 12px; padding: 32px; text-align: center;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 24px;">
              아래 인증 코드를 입력해주세요.
            </p>
            <div style="background: white; border-radius: 8px; padding: 24px; display: inline-block;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #111827;">
                ${otp}
              </span>
            </div>
            <p style="color: #6B7280; font-size: 14px; margin-top: 24px;">
              이 코드는 5분 동안 유효합니다.
            </p>
          </div>

          <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin-top: 32px;">
            본인이 요청하지 않은 경우 이 이메일을 무시해주세요.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Email send error:', error);
    throw new HttpsError('internal', '이메일 발송에 실패했습니다.');
  }

  return { success: true, message: '인증 코드가 발송되었습니다.' };
});

// OTP 검증 함수
export const verifyOTP = onCall({
  invoker: 'public',  // 인증 없이 호출 허용
}, async (request) => {
  const { email, code } = request.data;

  if (!email || !code) {
    throw new HttpsError('invalid-argument', '이메일과 인증 코드가 필요합니다.');
  }

  const otpRef = db.collection('otpCodes').doc(email);
  const otpDoc = await otpRef.get();

  if (!otpDoc.exists) {
    throw new HttpsError('not-found', '인증 코드를 찾을 수 없습니다. 다시 요청해주세요.');
  }

  const otpData = otpDoc.data()!;

  // 만료 확인
  const expiresAt = otpData.expiresAt?.toDate();
  if (!expiresAt || Date.now() > expiresAt.getTime()) {
    await otpRef.delete();
    throw new HttpsError('deadline-exceeded', '인증 코드가 만료되었습니다. 다시 요청해주세요.');
  }

  // 시도 횟수 확인 (5회 초과 시 차단)
  if (otpData.attempts >= 5) {
    await otpRef.delete();
    throw new HttpsError('resource-exhausted', '시도 횟수를 초과했습니다. 다시 요청해주세요.');
  }

  // 코드 검증
  if (otpData.code !== code) {
    await otpRef.update({
      attempts: admin.firestore.FieldValue.increment(1),
    });
    throw new HttpsError('permission-denied', '인증 코드가 일치하지 않습니다.');
  }

  // 검증 성공 - OTP 삭제 및 인증 토큰 생성
  await otpRef.delete();

  try {
    let uid: string;

    // 이메일로 기존 사용자 찾기
    try {
      const existingUser = await admin.auth().getUserByEmail(email);
      uid = existingUser.uid;

      // 이메일 인증 상태 업데이트
      await admin.auth().updateUser(uid, {
        emailVerified: true,
      });
    } catch {
      // 사용자가 없으면 새로 생성
      uid = email.replace(/[^a-zA-Z0-9]/g, '_');

      await admin.auth().createUser({
        uid: uid,
        email: email,
        emailVerified: true,
      });

      // Firestore에 프로필 생성
      await db.collection('users').doc(uid).set({
        uid: uid,
        email: email,
        kycStatus: 'none',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Custom Token 생성
    const customToken = await admin.auth().createCustomToken(uid);

    return {
      success: true,
      token: customToken,
      message: '인증이 완료되었습니다.'
    };
  } catch (error) {
    console.error('Token creation error:', error);
    throw new HttpsError('internal', '인증 처리 중 오류가 발생했습니다.');
  }
});
