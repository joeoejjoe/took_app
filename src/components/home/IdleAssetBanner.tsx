import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontWeight, Spacing, BorderRadius } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import { formatUSD, formatKRW } from '../../utils/format';

interface IdleAssetBannerProps {
  idleAmount: number; // USD 금액
  onClose: () => void;
  onPress: () => void;
}

export default function IdleAssetBanner({ idleAmount, onClose, onPress }: IdleAssetBannerProps) {
  const colors = useColors();
  const { rate } = useExchangeRate();
  const krwAmount = idleAmount * rate;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.alertBg, borderColor: colors.alertBorder },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <Ionicons name="information-circle" size={18} color={colors.primary} />
        <View style={styles.textContainer}>
          <Text style={[styles.text, { color: colors.textSecondary }]}>
            현재 쉬고 있는 자산이 <Text style={[styles.highlight, { color: colors.primary }]}>${formatUSD(idleAmount)}</Text> 있어요
          </Text>
          <Text style={[styles.subText, { color: colors.textMuted }]}>
            약 {formatKRW(krwAmount)}원
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: Spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  text: {
    fontSize: 13,
  },
  subText: {
    fontSize: 11,
    marginTop: 2,
  },
  highlight: {
    fontWeight: FontWeight.semibold,
  },
});
