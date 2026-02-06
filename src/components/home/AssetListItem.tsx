import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontWeight, Spacing } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { formatUSD, formatPercentage } from '../../utils/format';

export interface AssetData {
  id: string;
  symbol: string;
  balance: number;
  currency: string;
  estimatedYield: number;
  yieldRate: number;
  iconColor: string;
}

interface AssetListItemProps {
  asset: AssetData;
  onPress: (asset: AssetData) => void;
}

export default function AssetListItem({ asset, onPress }: AssetListItemProps) {
  const colors = useColors();
  const isPositive = asset.yieldRate >= 0;

  return (
    <TouchableOpacity
      style={[styles.container, { borderBottomColor: colors.border }]}
      onPress={() => onPress(asset)}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        <View style={[styles.iconContainer, { backgroundColor: asset.iconColor }]}>
          <Text style={styles.iconText}>{asset.symbol.charAt(0)}</Text>
        </View>
        <Text style={[styles.symbol, { color: colors.textPrimary }]}>{asset.symbol}</Text>
        <Ionicons name="add-circle" size={14} color={colors.primary} style={styles.addIcon} />
      </View>

      <View style={styles.rightSection}>
        <Text style={[styles.balance, { color: colors.textPrimary }]}>
          {formatUSD(asset.balance)} <Text style={[styles.currency, { color: colors.textSecondary }]}>{asset.currency}</Text>
        </Text>
        <Text style={[styles.yieldLabel, { color: colors.textMuted }]}>예상 1년 수익금</Text>
        <Text style={[styles.yieldAmount, { color: isPositive ? colors.textGreen : colors.textRed }]}>
          {formatUSD(asset.estimatedYield)} ({formatPercentage(asset.yieldRate)})
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: FontWeight.bold,
  },
  symbol: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
  },
  addIcon: {
    marginLeft: 2,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  balance: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
  },
  currency: {
    fontSize: 13,
    fontWeight: FontWeight.regular,
  },
  yieldLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  yieldAmount: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
  },
});
