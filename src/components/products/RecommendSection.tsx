import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontWeight, Spacing, BorderRadius } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { Product } from '../../types/product';
import { formatKRW } from '../../utils/format';

const CARD_WIDTH = Dimensions.get('window').width * 0.65;

interface RecommendSectionProps {
  userName: string;
  products: Product[];
  onProductPress: (product: Product) => void;
  onMorePress: () => void;
}

export default function RecommendSection({
  userName,
  products,
  onProductPress,
  onMorePress,
}: RecommendSectionProps) {
  const colors = useColors();

  if (products.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            <Text style={{ color: colors.primary }}>{userName}</Text>님을 위한 추천
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>고객님에 딱 맞는 상품들만 골랐어요</Text>
        </View>
        <TouchableOpacity onPress={onMorePress}>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {products.map((product) => (
          <TouchableOpacity
            key={product.id}
            style={[styles.card, { backgroundColor: colors.card }]}
            onPress={() => onProductPress(product)}
            activeOpacity={0.7}
          >
            <Text style={[styles.cardName, { color: colors.textPrimary }]}>{product.name}</Text>
            <Text style={[styles.cardDeposit, { color: colors.textMuted }]}>
              상품 예치량 {formatKRW(product.totalDeposit)}원
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.base,
  },
  title: {
    fontSize: 16,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    justifyContent: 'flex-end',
    minHeight: 90,
  },
  cardName: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
    marginBottom: 4,
  },
  cardDeposit: {
    fontSize: 12,
  },
});
