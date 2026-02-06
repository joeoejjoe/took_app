import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontWeight, Spacing, BorderRadius } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { ToggleButton, Card } from '../common';
import { formatKRW } from '../../utils/format';

interface InterestManagementProps {
  autoCompound: boolean;
  onToggleAutoCompound: (value: boolean) => void;
  totalClaimed: number;
  compoundedAmount: number;
  separateAmount: number;
}

export default function InterestManagement({
  autoCompound,
  onToggleAutoCompound,
  totalClaimed,
  compoundedAmount,
  separateAmount,
}: InterestManagementProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>이자 관리</Text>

      <Card variant="dark" style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>원금 자동 합산</Text>
            <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>
              {autoCompound
                ? '수령한 이자가 원금에 합산되어 복리 효과를 받습니다'
                : '수령한 이자를 별도로 관리합니다'}
            </Text>
          </View>
          <ToggleButton value={autoCompound} onToggle={onToggleAutoCompound} />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>총 수령 이자</Text>
          <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{formatKRW(totalClaimed)}원</Text>
        </View>

        {autoCompound ? (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>복리 누적 금액</Text>
            <Text style={[styles.summaryValueHighlight, { color: colors.primary }]}>{formatKRW(compoundedAmount)}원</Text>
          </View>
        ) : (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>별도 관리 금액</Text>
            <Text style={[styles.summaryValueHighlight, { color: colors.primary }]}>{formatKRW(separateAmount)}원</Text>
          </View>
        )}

        <View style={[styles.infoBadge, { backgroundColor: colors.primaryBg }]}>
          <Text style={[styles.infoBadgeText, { color: colors.primary }]}>
            {autoCompound
              ? '복리 적용 중 - 이자가 원금에 자동 합산됩니다'
              : '단리 적용 중 - 이자를 별도로 관리합니다'}
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  card: {
    gap: 0,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
  },
  toggleInfo: {
    flex: 1,
    marginRight: Spacing.md,
    gap: 2,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
  },
  toggleDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: FontWeight.medium,
  },
  summaryValueHighlight: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
  },
  infoBadge: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  infoBadgeText: {
    fontSize: 12,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
});
