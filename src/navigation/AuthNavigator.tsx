import React, { useState, useEffect } from 'react';
import { Alert, View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import EmailLoginScreen from '../screens/Auth/EmailLoginScreen';
import VerifyCodeScreen from '../screens/Auth/VerifyCodeScreen';
import WalletConnectScreen from '../screens/Auth/WalletConnectScreen';
import { useAuthStore } from '../store/useAuthStore';
import { useColors } from '../hooks/useColors';
import { sendOTP, verifyOTPAndLogin, initializeUserAssets } from '../services';
import { auth } from '../config/firebase';

type AuthStep = 'email' | 'sending' | 'verify' | 'wallet' | 'checking';

interface AuthNavigatorProps {
  onBack: () => void;
  onComplete: () => void;
}

export default function AuthNavigator({ onBack, onComplete }: AuthNavigatorProps) {
  const { loadUserProfile, isAuthenticated, walletAddress } = useAuthStore();
  const colors = useColors();

  // 이미 로그인되어 있고 지갑 주소가 없으면 바로 wallet 단계로
  const initialStep: AuthStep = isAuthenticated && !walletAddress ? 'wallet' : 'email';
  const [step, setStep] = useState<AuthStep>(initialStep);
  const [email, setEmail] = useState('');

  // 인증 상태 변경 시 step 업데이트
  useEffect(() => {
    if (isAuthenticated && !walletAddress && step !== 'wallet' && step !== 'checking') {
      setStep('wallet');
    }
  }, [isAuthenticated, walletAddress, step]);

  const handleEmailSubmit = async (submittedEmail: string) => {
    setEmail(submittedEmail);
    setStep('sending');

    try {
      // 실제 OTP 발송
      await sendOTP(submittedEmail);
      setStep('verify');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '인증 코드 발송에 실패했습니다.';
      setStep('email');
      Alert.alert('오류', message);
    }
  };

  const handleVerify = async (code: string) => {
    setStep('checking'); // 로딩 화면 표시

    try {
      // OTP 검증 및 로그인
      await verifyOTPAndLogin(email, code);

      // 신규 사용자를 위한 자산 초기화
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          await initializeUserAssets(currentUser.uid);
        } catch {
          // 이미 존재하면 무시
        }
      }

      // 프로필 로드
      await loadUserProfile();

      // 지갑 주소가 이미 있으면 바로 완료
      const { walletAddress: existingWallet } = useAuthStore.getState();
      if (existingWallet) {
        onComplete();
      } else {
        setStep('wallet');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '인증에 실패했습니다.';
      setStep('verify'); // 에러 시 verify 화면으로 복귀
      Alert.alert('오류', message);
    }
  };

  const handleResend = async () => {
    try {
      await sendOTP(email);
      Alert.alert('안내', '인증 코드가 재전송되었습니다.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '재전송에 실패했습니다.';
      Alert.alert('오류', message);
    }
  };

  // OTP 발송 중 화면
  if (step === 'sending') {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          인증 코드 발송 중...
        </Text>
      </View>
    );
  }

  // 로딩/확인 중 화면
  if (step === 'checking') {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          계정 확인 중...
        </Text>
      </View>
    );
  }

  if (step === 'wallet') {
    return (
      <WalletConnectScreen
        onComplete={onComplete}
        onSkip={onComplete}
      />
    );
  }

  if (step === 'verify') {
    return (
      <VerifyCodeScreen
        email={email}
        onVerify={handleVerify}
        onBack={() => setStep('email')}
        onResend={handleResend}
      />
    );
  }

  return (
    <EmailLoginScreen
      onSubmit={handleEmailSubmit}
      onBack={onBack}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
});
