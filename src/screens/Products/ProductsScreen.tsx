import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontWeight, Spacing } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { CategoryButton } from '../../components/common';
import ProductCard from '../../components/products/ProductCard';
import RecommendSection from '../../components/products/RecommendSection';
import ProductDetailScreen from './ProductDetailScreen';
import DepositScreen from './DepositScreen';
import DepositCompleteScreen from './DepositCompleteScreen';
import { Product, ProductSortType } from '../../types/product';
import { formatKRW } from '../../utils/format';

const SORT_OPTIONS: { key: ProductSortType; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'latest', label: '최신순' },
  { key: 'apy', label: '수익률순' },
  { key: 'favorites', label: '즐겨찾기' },
];

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: '미국 달러 이자 상품',
    totalDeposit: 123456789,
    maxApy: 5.42,
    type: 'flexible',
    isFavorite: true,
    asset: 'USDT',
  },
  {
    id: '2',
    name: '미국 달러 이자 상품',
    totalDeposit: 123456789,
    maxApy: 4.80,
    type: 'flexible',
    isFavorite: false,
    asset: 'USDC',
  },
  {
    id: '3',
    name: '미국 달러 이자 상품',
    totalDeposit: 123456789,
    maxApy: 6.12,
    type: 'locked',
    lockupDays: 30,
    isFavorite: false,
    asset: 'USDT',
  },
  {
    id: '4',
    name: '미국 달러 이자 상품',
    totalDeposit: 123456789,
    maxApy: 7.25,
    type: 'locked',
    lockupDays: 90,
    isFavorite: false,
    asset: 'USDC',
  },
];

const MOCK_RECOMMENDED: Product[] = [
  {
    id: 'rec1',
    name: '중국 위안 이자 상품',
    totalDeposit: 123456789,
    maxApy: 5.80,
    type: 'flexible',
    isFavorite: false,
    asset: 'USDT',
  },
  {
    id: 'rec2',
    name: '유럽 유로 이자 상품',
    totalDeposit: 98765432,
    maxApy: 4.50,
    type: 'locked',
    lockupDays: 60,
    isFavorite: false,
    asset: 'USDC',
  },
];

export default function ProductsScreen() {
  const navigation = useNavigation<any>();
  const colors = useColors();
  const [activeSort, setActiveSort] = useState<ProductSortType>('all');
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [showAll, setShowAll] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [depositProduct, setDepositProduct] = useState<Product | null>(null);
  const [completeData, setCompleteData] = useState<{
    product: Product;
    amount: number;
    asset: string;
    txHash: string;
  } | null>(null);

  const handleFavoriteToggle = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, isFavorite: !p.isFavorite } : p
      )
    );
  };

  const getSortedProducts = () => {
    let sorted = [...products];
    switch (activeSort) {
      case 'apy':
        sorted.sort((a, b) => b.maxApy - a.maxApy);
        break;
      case 'favorites':
        sorted = sorted.filter((p) => p.isFavorite);
        break;
      default:
        break;
    }
    return showAll ? sorted : sorted.slice(0, 4);
  };

  const displayedProducts = getSortedProducts();
  const totalCount = activeSort === 'favorites'
    ? products.filter((p) => p.isFavorite).length
    : products.length;

  if (completeData) {
    return (
      <DepositCompleteScreen
        product={completeData.product}
        amount={completeData.amount}
        asset={completeData.asset}
        txHash={completeData.txHash}
        onGoHome={() => {
          setCompleteData(null);
          setDepositProduct(null);
          setSelectedProduct(null);
          navigation.navigate('Home');
        }}
        onViewProducts={() => {
          setCompleteData(null);
          setDepositProduct(null);
          setSelectedProduct(null);
        }}
      />
    );
  }

  if (depositProduct) {
    return (
      <DepositScreen
        product={depositProduct}
        onBack={() => setDepositProduct(null)}
        onComplete={(data) => {
          setCompleteData(data);
        }}
      />
    );
  }

  if (selectedProduct) {
    return (
      <ProductDetailScreen
        product={selectedProduct}
        onBack={() => setSelectedProduct(null)}
        onDeposit={(product) => setDepositProduct(product)}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.headerLabel, { color: colors.textSecondary }]}>예치 가능한 나의 자산은</Text>
          <Text style={[styles.headerAmount, { color: colors.primary }]}>
            {formatKRW(88000)}<Text style={[styles.headerUnit, { color: colors.primary }]}>원</Text>
          </Text>
        </View>

        <View style={styles.sortContainer}>
          <Text style={[styles.productCount, { color: colors.textMuted }]}>상품 수 {totalCount}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortScroll}>
            <View style={styles.sortButtons}>
              {SORT_OPTIONS.map((option) => (
                <CategoryButton
                  key={option.key}
                  title={option.label}
                  active={activeSort === option.key}
                  onPress={() => setActiveSort(option.key)}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.listContainer}>
          {displayedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onPress={setSelectedProduct}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}

          {!showAll && displayedProducts.length < totalCount && (
            <Text
              style={[styles.moreText, { color: colors.textMuted }]}
              onPress={() => setShowAll(true)}
            >
              + More
            </Text>
          )}
        </View>

        <RecommendSection
          userName="000"
          products={MOCK_RECOMMENDED}
          onProductPress={setSelectedProduct}
          onMorePress={() => {}}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.lg,
  },
  headerLabel: {
    fontSize: 15,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
  },
  headerAmount: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
  },
  headerUnit: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
  },
  sortContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.base,
  },
  productCount: {
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  sortScroll: {
    flexGrow: 0,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  listContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  moreText: {
    fontSize: 13,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
});
