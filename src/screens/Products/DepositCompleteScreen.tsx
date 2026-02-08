import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform, Linking, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FontWeight, Spacing, BorderRadius } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { PrimaryButton, Card } from '../../components/common';
import { BlockchainProduct, getExplorerTxUrl } from '../../services';
import { formatUSD, formatPercentage } from '../../utils/format';

interface DepositCompleteScreenProps {
  product: BlockchainProduct;
  amount: number;
  asset: string;
  txHash: string;
  onGoHome: () => void;
  onViewProducts: () => void;
}

export default function DepositCompleteScreen({
  product,
  amount,
  asset,
  txHash,
  onGoHome,
  onViewProducts,
}: DepositCompleteScreenProps) {
  const colors = useColors();
  const checkScale = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(checkScale, {
        toValue: 1,
        tension: 50,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [checkScale, contentOpacity]);

  const estimatedYearly = amount * (product.apy / 100);
  const shortHash = `${txHash.slice(0, 10)}...${txHash.slice(-8)}`;
  const isSimulated = txHash.length === 66 && !txHash.startsWith('0x0'); // 시뮬레이션 여부 확인

  const handleCopyTxHash = async () => {
    try {
      const Clipboard = await import('expo-clipboard');
      await Clipboard.setStringAsync(txHash);
      Alert.alert('복사됨', '트랜잭션 해시가 클립보드에 복사되었습니다.');
    } catch {
      // Clipboard not available, show the full hash in an alert
      Alert.alert('트랜잭션 해시', txHash);
    }
  };

  const handleViewOnExplorer = () => {
    if (!isSimulated) {
      Linking.openURL(getExplorerTxUrl(txHash));
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <Animated.View style={[styles.checkContainer, { backgroundColor: colors.primary, transform: [{ scale: checkScale }] }]}>
          <Ionicons name="checkmark" size={48} color={colors.buttonPrimaryText} />
        </Animated.View>

        <Animated.View style={[styles.infoContainer, { opacity: contentOpacity }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>예치 완료!</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            성공적으로 예치가 완료되었습니다.{'\n'}토큰 가치 상승으로 수익이 발생합니다!
          </Text>

          {/* Deposit Summary */}
          <Card variant="dark" style={styles.summaryCard}>
            <SummaryRow label="상품" value={product.displayName} />
            <SummaryRow label="예치 금액" value={`${formatUSD(amount)} ${asset}`} highlight />
            <SummaryRow label="연 수익률 (APY)" value={formatPercentage(product.apy)} highlight />
            <SummaryRow label="예상 연간 수익" value={`~${formatUSD(estimatedYearly)} ${asset}`} />
            <SummaryRow label="수령 토큰" value={product.receiveToken} />
            <SummaryRow label="수익 방식" value="토큰 가격 상승" isLast />
          </Card>

          {/* Transaction Hash */}
          <TouchableOpacity
            style={[styles.txRow, { backgroundColor: colors.surface }]}
            activeOpacity={0.7}
            onPress={handleCopyTxHash}
          >
            <Text style={[styles.txLabel, { color: colors.textMuted }]}>Tx Hash</Text>
            <View style={styles.txValueRow}>
              <Text style={[styles.txHash, { color: colors.textSecondary }]}>{shortHash}</Text>
              <Ionicons name="copy-outline" size={14} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          {/* Explorer Link */}
          {!isSimulated && (
            <TouchableOpacity
              style={styles.explorerLink}
              onPress={handleViewOnExplorer}
            >
              <Text style={[styles.explorerLinkText, { color: colors.primary }]}>
                Etherscan에서 확인 →
              </Text>
            </TouchableOpacity>
          )}

          {/* Simulated Notice */}
          {isSimulated && (
            <View style={[styles.noticeBox, { backgroundColor: colors.surfaceLight }]}>
              <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
              <Text style={[styles.noticeText, { color: colors.textMuted }]}>
                시뮬레이션 모드로 예치가 진행되었습니다
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Bottom Buttons */}
        <Animated.View style={[styles.bottomContainer, { opacity: contentOpacity }]}>
          <PrimaryButton title="홈으로 돌아가기" onPress={onGoHome} />
          <TouchableOpacity style={styles.secondaryAction} onPress={onViewProducts}>
            <Text style={[styles.secondaryActionText, { color: colors.textSecondary }]}>상품 화면으로</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
  isLast,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  isLast?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={[summaryStyles.row, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Text style={[summaryStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[
        summaryStyles.value,
        { color: colors.textPrimary },
        highlight && { color: colors.primary, fontWeight: FontWeight.semibold },
      ]}>{value}</Text>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  label: {
    fontSize: 13,
  },
  value: {
    fontSize: 13,
    fontWeight: FontWeight.medium,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
  },
  checkContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  infoContainer: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  summaryCard: {
    width: '100%',
    marginBottom: Spacing.base,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  txLabel: {
    fontSize: 13,
  },
  txValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txHash: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  explorerLink: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  explorerLinkText: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  noticeText: {
    fontSize: 12,
  },
  bottomContainer: {
    width: '100%',
    marginTop: 'auto',
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing['2xl'],
    gap: Spacing.md,
  },
  secondaryAction: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
  },
});
