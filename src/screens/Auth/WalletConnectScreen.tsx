import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppKit } from '@reown/appkit-wagmi-react-native';
import { useAccount } from 'wagmi';
import { FontWeight, Spacing } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { PrimaryButton, Card } from '../../components/common';
import { connectWallet, createWallet } from '../../services';
import { useAuthStore } from '../../store/useAuthStore';

interface WalletConnectScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function WalletConnectScreen({
  onComplete,
  onSkip,
}: WalletConnectScreenProps) {
  const colors = useColors();
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const user = useAuthStore((s) => s.user);
  const walletAddress = useAuthStore((s) => s.walletAddress);
  const setWalletAddress = useAuthStore((s) => s.setWalletAddress);
  const hasHandledConnection = useRef(false);
  const [isCreating, setIsCreating] = useState(false);

  // 외부 지갑 연결 처리 (Reown)
  useEffect(() => {
    if (isConnected && address && !hasHandledConnection.current) {
      hasHandledConnection.current = true;
      setWalletAddress(address);

      if (user?.uid) {
        connectWallet(user.uid, address).catch((err) =>
          console.error('Failed to save wallet address:', err)
        );
      }
    }
  }, [isConnected, address, user, setWalletAddress]);

  // 새 지갑 생성 (앱 내 직접 생성)
  const handleCreateWallet = async () => {
    setIsCreating(true);
    try {
      const wallet = await createWallet();
      setWalletAddress(wallet.address);

      if (user?.uid) {
        await connectWallet(user.uid, wallet.address);
      }

      Alert.alert(
        '지갑 생성 완료',
        `새 지갑이 생성되었습니다.\n\n주소: ${wallet.address.slice(0, 10)}...${wallet.address.slice(-8)}\n\n프라이빗 키는 기기에 안전하게 저장되었습니다.`,
        [{ text: '확인' }]
      );
    } catch (error) {
      console.error('Failed to create wallet:', error);
      Alert.alert('오류', '지갑 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsCreating(false);
    }
  };

  // 기존 지갑 연결 (Reown 모달)
  const handleConnectExisting = () => {
    open({ view: 'Connect' });
  };

  // 지갑 연결/생성 완료 상태
  const finalAddress = walletAddress || (isConnected ? address : null);

  if (finalAddress) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <View style={[styles.successIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="checkmark" size={48} color={colors.buttonPrimaryText} />
          </View>
          <Text style={[styles.successTitle, { color: colors.textPrimary }]}>지갑 연결 완료!</Text>
          <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
            이제 TOOK에서 스테이블코인을{'\n'}예치하고 수익을 받을 수 있습니다.
          </Text>
          <Text style={[styles.addressText, { color: colors.textTertiary }]}>
            {finalAddress.slice(0, 6)}...{finalAddress.slice(-4)}
          </Text>
        </View>
        <View style={styles.bottomContainer}>
          <PrimaryButton title="시작하기" onPress={onComplete} />
        </View>
      </SafeAreaView>
    );
  }

  // 지갑 생성 중
  if (isCreating) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.connectingTitle, { color: colors.textPrimary }]}>
            지갑 생성 중...
          </Text>
          <Text style={[styles.connectingSubtitle, { color: colors.textSecondary }]}>
            안전한 지갑을 생성하고 있습니다.{'\n'}잠시만 기다려주세요.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // 초기 화면
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.skipText, { color: colors.textSecondary }]} onPress={onSkip}>
          나중에 하기
        </Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.walletIcon, { backgroundColor: colors.primaryBg }]}>
          <Ionicons name="wallet-outline" size={64} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>지갑 연결하기</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          새 지갑을 만들거나{'\n'}
          기존 지갑을 연결할 수 있습니다.
        </Text>

        <View style={styles.featureList}>
          <FeatureItem
            icon="shield-checkmark-outline"
            title="Non-Custodial"
            description="프라이빗 키는 오직 내 기기에만 저장됩니다."
          />
          <FeatureItem
            icon="lock-closed-outline"
            title="안전한 보관"
            description="암호화된 보안 저장소에 안전하게 보관됩니다."
          />
          <FeatureItem
            icon="flash-outline"
            title="수수료 없음"
            description="플랫폼 내부 자금 이동 시 수수료가 없습니다."
          />
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <PrimaryButton title="새 지갑 만들기" onPress={handleCreateWallet} />
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.border }]}
          onPress={handleConnectExisting}
          activeOpacity={0.7}
        >
          <Ionicons name="link-outline" size={20} color={colors.textPrimary} />
          <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>
            기존 지갑 연결
          </Text>
        </TouchableOpacity>
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
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    height: 48,
    justifyContent: 'center',
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
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: FontWeight.semibold,
  },
  // Connecting state
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  connectingTitle: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  connectingSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
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
  },
  addressText: {
    fontSize: 14,
    marginTop: Spacing.md,
    fontFamily: 'monospace',
  },
});
