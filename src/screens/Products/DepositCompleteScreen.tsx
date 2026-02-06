import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FontWeight, Spacing, BorderRadius } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { PrimaryButton, Card } from '../../components/common';
import { Product } from '../../types/product';
import { formatUSD, formatPercentage } from '../../utils/format';

interface DepositCompleteScreenProps {
  product: Product;
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

  const estimatedYearly = amount * (product.maxApy / 100);
  const shortHash = `${txHash.slice(0, 10)}...${txHash.slice(-8)}`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Success Icon */}
        <Animated.View style={[styles.checkContainer, { backgroundColor: colors.primary, transform: [{ scale: checkScale }] }]}>
          <Ionicons name="checkmark" size={48} color={colors.buttonPrimaryText} />
        </Animated.View>

        <Animated.View style={[styles.infoContainer, { opacity: contentOpacity }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>예치 완료!</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            성공적으로 예치가 완료되었습니다.{'\n'}이제 매일 이자를 받아보세요!
          </Text>

          {/* Deposit Summary */}
          <Card variant="dark" style={styles.summaryCard}>
            <SummaryRow label="상품" value={product.name} />
            <SummaryRow label="예치 금액" value={`${formatUSD(amount)} ${asset}`} highlight />
            <SummaryRow label="연 수익률 (APY)" value={formatPercentage(product.maxApy)} highlight />
            <SummaryRow label="예상 연간 수익" value={`~${formatUSD(estimatedYearly)} ${asset}`} />
            <SummaryRow label="상품 유형" value={product.type === 'flexible' ? '자유 입출금' : `락업 ${product.lockupDays}일`} />
            <SummaryRow label="Tx Fee" value="무료" highlight isLast />
          </Card>

          {/* Transaction Hash */}
          <TouchableOpacity style={[styles.txRow, { backgroundColor: colors.surface }]} activeOpacity={0.7}>
            <Text style={[styles.txLabel, { color: colors.textMuted }]}>Tx Hash</Text>
            <View style={styles.txValueRow}>
              <Text style={[styles.txHash, { color: colors.textSecondary }]}>{shortHash}</Text>
              <Ionicons name="copy-outline" size={14} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Bottom Buttons */}
      <Animated.View style={[styles.bottomContainer, { opacity: contentOpacity }]}>
        <PrimaryButton title="홈으로 돌아가기" onPress={onGoHome} />
        <TouchableOpacity style={styles.secondaryAction} onPress={onViewProducts}>
          <Text style={[styles.secondaryActionText, { color: colors.textSecondary }]}>다른 상품 둘러보기</Text>
        </TouchableOpacity>
      </Animated.View>
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
  content: {
    flex: 1,
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
  bottomContainer: {
    paddingHorizontal: Spacing.lg,
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
