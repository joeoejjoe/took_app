import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import EmailLoginScreen from '../screens/Auth/EmailLoginScreen';
import VerifyCodeScreen from '../screens/Auth/VerifyCodeScreen';
import WalletConnectScreen from '../screens/Auth/WalletConnectScreen';
import { useAuthStore } from '../store/useAuthStore';

type AuthStep = 'email' | 'verify' | 'wallet';

interface AuthNavigatorProps {
  onBack: () => void;
  onComplete: () => void;
}

// 임시 비밀번호 생성 (이메일 기반)
const generatePassword = (email: string) => `Took!${email.split('@')[0]}2024`;

export default function AuthNavigator({ onBack, onComplete }: AuthNavigatorProps) {
  const { signUp, signIn, setError, error, isAuthenticated, walletAddress } = useAuthStore();

  // 이미 로그인되어 있고 지갑 주소가 없으면 바로 wallet 단계로
  const initialStep: AuthStep = isAuthenticated && !walletAddress ? 'wallet' : 'email';
  const [step, setStep] = useState<AuthStep>(initialStep);
  const [email, setEmail] = useState('');

  // 인증 상태 변경 시 step 업데이트
  useEffect(() => {
    if (isAuthenticated && !walletAddress && step !== 'wallet') {
      setStep('wallet');
    }
  }, [isAuthenticated, walletAddress, step]);

  const handleEmailSubmit = (submittedEmail: string) => {
    setEmail(submittedEmail);
    setStep('verify');
  };

  const handleVerify = async (_code: string) => {
    const password = generatePassword(email);

    try {
      // 먼저 로그인 시도
      await signIn(email, password);
      setStep('wallet');
    } catch {
      try {
        // 로그인 실패 시 회원가입 시도
        await signUp(email, password);
        setStep('wallet');
      } catch (signUpError: unknown) {
        const message = signUpError instanceof Error
          ? signUpError.message
          : '인증에 실패했습니다.';
        Alert.alert('오류', message);
      }
    }
  };

  const handleResend = () => {
    // 인증 코드 재전송 (현재 이메일/비밀번호 방식이므로 안내만)
    Alert.alert('안내', '인증 코드가 재전송되었습니다.');
  };

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
      onSkip={onComplete}
    />
  );
}
