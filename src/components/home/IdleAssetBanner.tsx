import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontWeight, Spacing, BorderRadius } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { formatKRW } from '../../utils/format';

interface IdleAssetBannerProps {
  idleAmount: number;
  onClose: () => void;
  onPress: () => void;
}

export default function IdleAssetBanner({ idleAmount, onClose, onPress }: IdleAssetBannerProps) {
  const colors = useColors();

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
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          현재 쉬고 있는 자산이 <Text style={[styles.highlight, { color: colors.primary }]}>{formatKRW(idleAmount)}원</Text>이 있어요
        </Text>
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
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  text: {
    fontSize: 13,
    flex: 1,
  },
  highlight: {
    fontWeight: FontWeight.semibold,
  },
});
