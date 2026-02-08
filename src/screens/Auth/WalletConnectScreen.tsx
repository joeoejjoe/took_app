import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePrivy, useLoginWithEmail, useEmbeddedWallet, isConnected } from '@privy-io/expo';
import { FontWeight, Spacing } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { PrimaryButton, Card } from '../../components/common';
import { connectWallet, savePrivyWallet } from '../../services';
import { useAuthStore } from '../../store/useAuthStore';

interface WalletConnectScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

type Step = 'initial' | 'otp' | 'creating' | 'success';

export default function WalletConnectScreen({
  onComplete,
  onSkip,
}: WalletConnectScreenProps) {
  const colors = useColors();
  const user = useAuthStore((s) => s.user);
  const userProfile = useAuthStore((s) => s.userProfile);
  const walletAddress = useAuthStore((s) => s.walletAddress);
  const setWalletAddress = useAuthStore((s) => s.setWalletAddress);

  const [step, setStep] = useState<Step>('initial');
  const [otpCode, setOtpCode] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');

  // Privy hooks
  const { isReady, user: privyUser } = usePrivy();
  const { sendCode, loginWithCode, state: loginState } = useLoginWithEmail();
  const wallet = useEmbeddedWallet();

  const email = userProfile?.email || user?.email || '';

  // Privy 지갑이 연결되면 주소 저장
  useEffect(() => {
    const handleWalletConnection = async () => {
      if (wallet && isConnected(wallet) && wallet.account?.address) {
        const address = wallet.account.address;

        // SecureStore에 저장
        await savePrivyWallet(address);

        // Zustand store에 저장
        setWalletAddress(address);

        // Firebase에 저장
        if (user?.uid) {
          await connectWallet(user.uid, address);
        }

        setStep('success');
      }
    };

    handleWalletConnection();
  }, [wallet, user?.uid, setWalletAddress]);

  // Privy 로그인 상태 변화 감지 - 이미 로그인된 경우 지갑 생성
  useEffect(() => {
    const handlePrivyUser = async () => {
      if (privyUser && step === 'initial') {
        // 이미 Privy에 로그인되어 있으면 지갑 생성 단계로
        setStep('creating');
        setLoadingMessage('지갑을 확인하는 중...');
      }

      // 지갑이 아직 없으면 생성
      if (privyUser && wallet && !isConnected(wallet) && wallet.status === 'not-created') {
        setLoadingMessage('지갑을 생성하는 중...');
        try {
          await wallet.create();
        } catch (error) {
          console.error('Failed to create wallet:', error);
        }
      }
    };

    handlePrivyUser();
  }, [privyUser, wallet, step]);

  // 이메일로 OTP 전송
  const handleSendOTP = async () => {
    if (!email) {
      Alert.alert('오류', '이메일 정보를 찾을 수 없습니다.');
      return;
    }

    if (!isReady) {
      Alert.alert('오류', 'Privy가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setStep('otp');
    setLoadingMessage('인증 코드를 전송하는 중...');

    try {
      await sendCode({ email });
      setLoadingMessage('');
    } catch (error) {
      console.error('Failed to send OTP:', error);
      Alert.alert('오류', '인증 코드 전송에 실패했습니다. 다시 시도해주세요.');
      setStep('initial');
    }
  };

  // OTP 인증 및 지갑 생성
  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length < 6) {
      Alert.alert('오류', '6자리 인증 코드를 입력해주세요.');
      return;
    }

    setStep('creating');
    setLoadingMessage('인증 중...');

    try {
      await loginWithCode({ code: otpCode, email });
      // 로그인 성공 후 useEffect에서 지갑 연결 처리
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      Alert.alert('인증 실패', '인증 코드가 올바르지 않습니다. 다시 시도해주세요.');
      setStep('otp');
      setLoadingMessage('');
    }
  };

  // 지갑 연결 완료 상태 (walletAddress가 이미 있거나 step이 success)
  if (walletAddress || step === 'success') {
    const displayAddress = walletAddress || wallet?.account?.address;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <View style={[styles.successIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="checkmark" size={48} color={colors.buttonPrimaryText} />
          </View>
          <Text style={[styles.successTitle, { color: colors.textPrimary }]}>지갑 생성 완료!</Text>
          <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
            이제 TOOK에서 스테이블코인을{'\n'}예치하고 수익을 받을 수 있습니다.
          </Text>
          {displayAddress && (
            <View style={[styles.addressBox, { backgroundColor: colors.surface }]}>
              <Ionicons name="wallet" size={20} color={colors.primary} />
              <Text style={[styles.addressText, { color: colors.textPrimary }]}>
                {displayAddress.slice(0, 10)}...{displayAddress.slice(-8)}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.bottomContainer}>
          <PrimaryButton title="시작하기" onPress={onComplete} />
        </View>
      </SafeAreaView>
    );
  }

  // OTP 입력 화면
  if (step === 'otp') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.backText, { color: colors.primary }]} onPress={() => setStep('initial')}>
            ← 뒤로
          </Text>
          <View />
        </View>

        <View style={styles.centerContent}>
          <View style={[styles.walletIcon, { backgroundColor: colors.primaryBg }]}>
            <Ionicons name="mail-outline" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>인증 코드 입력</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {email}로 전송된{'\n'}6자리 코드를 입력해주세요.
          </Text>

          <TextInput
            style={[styles.otpInput, {
              backgroundColor: colors.surface,
              color: colors.textPrimary,
              borderColor: colors.border,
            }]}
            value={otpCode}
            onChangeText={setOtpCode}
            placeholder="000000"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />
        </View>

        <View style={styles.bottomContainer}>
          <PrimaryButton
            title="인증하기"
            onPress={handleVerifyOTP}
            disabled={otpCode.length < 6}
          />
          <Text style={[styles.emailHint, { color: colors.textMuted }]} onPress={handleSendOTP}>
            코드 재전송
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // 생성 중 상태
  if (step === 'creating') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingTitle, { color: colors.textPrimary }]}>
            {loadingMessage}
          </Text>
          <Text style={[styles.loadingSubtitle, { color: colors.textSecondary }]}>
            MPC 지갑을 생성하고 있습니다.{'\n'}잠시만 기다려주세요.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // 초기 화면
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View />
        <Text style={[styles.skipText, { color: colors.textSecondary }]} onPress={onSkip}>
          나중에 하기
        </Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.walletIcon, { backgroundColor: colors.primaryBg }]}>
          <Ionicons name="wallet-outline" size={64} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>지갑 만들기</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          이메일로 안전한 지갑을 생성합니다.{'\n'}
          별도 설정 없이 바로 시작할 수 있어요.
        </Text>

        <View style={styles.featureList}>
          <FeatureItem
            icon="mail-outline"
            title="이메일 기반"
            description="가입한 이메일로 지갑이 자동 생성됩니다."
          />
          <FeatureItem
            icon="shield-checkmark-outline"
            title="MPC 보안"
            description="프라이빗 키가 분산 저장되어 더 안전합니다."
          />
          <FeatureItem
            icon="refresh-outline"
            title="언제든 복구"
            description="이메일 인증으로 다른 기기에서도 접근 가능합니다."
          />
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <PrimaryButton
          title="지갑 생성하기"
          onPress={handleSendOTP}
          disabled={!isReady || !email}
        />
        <Text style={[styles.emailHint, { color: colors.textMuted }]}>
          {email} 계정으로 생성됩니다
        </Text>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  const colors = useColors();
  return (
    <Card variant="dark" style={styles.featureCard}>
      <View style={styles.featureRow}>
        <View style={[styles.featureIconContainer, { backgroundColor: colors.primaryBg }]}>
          <Ionicons name={icon} size={22} color={colors.primary} />
        </View>
        <View style={styles.featureTextContainer}>
          <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    height: 48,
  },
  backText: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
  },
  skipText: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['2xl'],
    alignItems: 'center',
  },
  walletIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
  },
  featureList: {
    width: '100%',
    gap: Spacing.md,
  },
  featureCard: {
    paddingVertical: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
  },
  bottomContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
    alignItems: 'center',
  },
  emailHint: {
    fontSize: 13,
  },
  // Loading state
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  loadingSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  // OTP input
  otpInput: {
    width: 200,
    height: 56,
    fontSize: 32,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    borderRadius: 12,
    borderWidth: 1,
    letterSpacing: 8,
    marginTop: Spacing.lg,
  },
  // Success state
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  successSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    gap: Spacing.sm,
  },
  addressText: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
});
