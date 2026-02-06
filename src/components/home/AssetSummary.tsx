import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontWeight, Spacing } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { formatKRW } from '../../utils/format';

interface AssetSummaryProps {
  totalAssetKRW: number;
}

export default function AssetSummary({ totalAssetKRW }: AssetSummaryProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>나의 총 자산은</Text>
      <Text style={[styles.amount, { color: colors.primary }]}>
        {formatKRW(totalAssetKRW)}<Text style={[styles.unit, { color: colors.primary }]}>원</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
  },
  label: {
    fontSize: 15,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
  },
  amount: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
  },
  unit: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
  },
});
