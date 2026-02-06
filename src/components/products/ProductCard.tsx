import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontWeight, Spacing, BorderRadius } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { Product } from '../../types/product';
import { formatKRW, formatPercentage } from '../../utils/format';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  onFavoriteToggle: (productId: string) => void;
}

export default function ProductCard({ product, onPress, onFavoriteToggle }: ProductCardProps) {
  const colors = useColors();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card }]}
      onPress={() => onPress(product)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.textPrimary }]}>{product.name}</Text>
        <Text style={[styles.deposit, { color: colors.textMuted }]}>
          상품 예치량 {formatKRW(product.totalDeposit)}원
        </Text>
        <Text style={[styles.apy, { color: colors.textSecondary }]}>
          최고 연 <Text style={[styles.apyValue, { color: colors.primary }]}>{formatPercentage(product.maxApy)}</Text>
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => onFavoriteToggle(product.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name={product.isFavorite ? 'star' : 'star-outline'}
          size={20}
          color={product.isFavorite ? colors.primary : colors.textMuted}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    marginBottom: Spacing.md,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
    marginBottom: 2,
  },
  deposit: {
    fontSize: 12,
  },
  apy: {
    fontSize: 13,
    marginTop: 2,
  },
  apyValue: {
    fontWeight: FontWeight.semibold,
  },
});
