import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontWeight, Spacing, BorderRadius } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { Card } from '../common';
import { formatUSD, formatPercentage } from '../../utils/format';

interface AutoCompoundCardProps {
  dailyYield: number;        // 일일 예상 수익 (USD)
  totalDeposited: number;    // 총 예치 금액
  averageApy: number;        // 평균 APY
}

export default function AutoCompoundCard({
  dailyYield,
  totalDeposited,
  averageApy,
}: AutoCompoundCardProps) {
  const colors = useColors();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 수익 증가 표시 애니메이션
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const monthlyYield = dailyYield * 30;
  const yearlyYield = dailyYield * 365;

  return (
    <View style={styles.container}>
      <Card variant="dark" style={styles.card}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              자동 복리 수익 발생 중
            </Text>
          </View>
          <View style={[styles.apyBadge, { backgroundColor: colors.primaryBg }]}>
            <Text style={[styles.apyText, { color: colors.primary }]}>
              평균 APY {formatPercentage(averageApy, false)}
            </Text>
          </View>
        </View>

        {/* 일일 수익 */}
        <View style={styles.mainSection}>
          <Text style={[styles.label, { color: colors.textMuted }]}>
            매일 받고 있는 이자
          </Text>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Text style={[styles.dailyAmount, { color: colors.primary }]}>
              +${formatUSD(dailyYield)}
              <Text style={[styles.perDay, { color: colors.textSecondary }]}> /일</Text>
            </Text>
          </Animated.View>
        </View>

        {/* 수익 상세 */}
        <View style={[styles.detailsSection, { borderTopColor: colors.border }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>예상 월 수익</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
              +${formatUSD(monthlyYield)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>예상 연 수익</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
              +${formatUSD(yearlyYield)}
            </Text>
          </View>
        </View>

        {/* 안내 */}
        <View style={[styles.infoBox, { backgroundColor: colors.surfaceLight }]}>
          <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            예치하신 상품은 자동 복리가 적용되어, 별도의 수령 없이 자산이 자동으로 증가합니다
          </Text>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  card: {
    gap: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
  },
  apyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  apyText: {
    fontSize: 12,
    fontWeight: FontWeight.semibold,
  },
  mainSection: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  label: {
    fontSize: 13,
    marginBottom: Spacing.xs,
  },
  dailyAmount: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
  },
  perDay: {
    fontSize: 16,
    fontWeight: FontWeight.medium,
  },
  detailsSection: {
    borderTopWidth: 1,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});
