import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontWeight, Spacing, BorderRadius, getTokenLogo } from '../../constants';
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
  const tokenLogo = getTokenLogo(asset.symbol);

  return (
    <TouchableOpacity
      style={[styles.container, { borderBottomColor: colors.border }]}
      onPress={() => onPress(asset)}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        <View style={[styles.iconContainer, { backgroundColor: asset.iconColor }]}>
          {tokenLogo ? (
            <Image source={tokenLogo} style={styles.tokenLogo} />
          ) : (
            <Text style={styles.iconText}>{asset.symbol.charAt(0)}</Text>
          )}
        </View>
        <View style={styles.assetInfo}>
          <Text style={[styles.symbol, { color: colors.textPrimary }]}>{asset.symbol}</Text>
          <Text style={[styles.balance, { color: colors.textSecondary }]}>
            ${formatUSD(asset.balance)}
          </Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <View style={[styles.yieldBadge, { backgroundColor: colors.primaryBg }]}>
          <Text style={[styles.yieldAmount, { color: colors.primary }]}>
            +${formatUSD(asset.estimatedYield)}
          </Text>
          <Text style={[styles.yieldRate, { color: colors.primary }]}>
            /년 ({formatPercentage(asset.yieldRate * 100, false)})
          </Text>
        </View>
        <View style={styles.depositHint}>
          <Ionicons name="arrow-forward" size={12} color={colors.primary} />
          <Text style={[styles.depositHintText, { color: colors.primary }]}>예치하기</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tokenLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  iconText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: FontWeight.bold,
  },
  assetInfo: {
    gap: 2,
  },
  symbol: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
  },
  balance: {
    fontSize: 13,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 4,
  },
  yieldBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  yieldAmount: {
    fontSize: 15,
    fontWeight: FontWeight.bold,
  },
  yieldRate: {
    fontSize: 11,
    fontWeight: FontWeight.medium,
  },
  depositHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  depositHintText: {
    fontSize: 11,
    fontWeight: FontWeight.medium,
  },
});
