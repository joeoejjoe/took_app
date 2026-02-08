import { getFunctions, httpsCallable } from 'firebase/functions';
import { signInWithCustomToken } from 'firebase/auth';
import app, { auth } from '../config/firebase';

// Firebase Functions 인스턴스
const functions = getFunctions(app);

interface SendOTPResponse {
  success: boolean;
  message: string;
}

interface VerifyOTPResponse {
  success: boolean;
  token: string;
  message: string;
}

// OTP 발송
export const sendOTP = async (email: string): Promise<SendOTPResponse> => {
  const sendOTPFunction = httpsCallable<{ email: string }, SendOTPResponse>(
    functions,
    'sendOTP'
  );

  const result = await sendOTPFunction({ email });
  return result.data;
};

// OTP 검증 및 로그인
export const verifyOTPAndLogin = async (email: string, code: string): Promise<void> => {
  const verifyOTPFunction = httpsCallable<{ email: string; code: string }, VerifyOTPResponse>(
    functions,
    'verifyOTP'
  );

  const result = await verifyOTPFunction({ email, code });

  if (result.data.success && result.data.token) {
    // Custom Token으로 Firebase Auth 로그인
    await signInWithCustomToken(auth, result.data.token);
  } else {
    throw new Error('인증에 실패했습니다.');
  }
};
