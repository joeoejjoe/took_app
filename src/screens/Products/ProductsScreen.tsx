import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { FontWeight, Spacing, BorderRadius } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { Card, CategoryButton } from '../../components/common';
import ProductDetailScreen from './ProductDetailScreen';
import DepositScreen from './DepositScreen';
import DepositCompleteScreen from './DepositCompleteScreen';
import WithdrawScreen from './WithdrawScreen';
import WithdrawCompleteScreen from './WithdrawCompleteScreen';
import { useAuthStore } from '../../store/useAuthStore';
import { useBlockchainStore } from '../../store/useBlockchainStore';
import {
  BLOCKCHAIN_PRODUCTS,
  BlockchainProduct,
  BlockchainDeposit,
  getMHyperInfo,
  getSGhoInfo,
  getAllPlatformStats,
  recordBlockchainDeposit,
  recordBlockchainWithdrawal,
  getUserBlockchainDeposits,
  getBlockchainProductById,
  calculateEstimatedYield,
} from '../../services';
import { formatUSD, formatPercentage } from '../../utils/format';

type TabType = 'products' | 'myDeposits';
type SortType = 'all' | 'apy' | 'favorites';

const TAB_OPTIONS: { key: TabType; label: string }[] = [
  { key: 'products', label: '상품' },
  { key: 'myDeposits', label: '내 예치' },
];

const SORT_OPTIONS: { key: SortType; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'apy', label: '수익률순' },
  { key: 'favorites', label: '즐겨찾기' },
];

type ProductsScreenParams = {
  tab?: TabType;
};

export default function ProductsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ Products: ProductsScreenParams }, 'Products'>>();
  const colors = useColors();
  const { walletAddress } = useAuthStore();
  const { balances } = useBlockchainStore();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>(route.params?.tab || 'products');
  const [activeSort, setActiveSort] = useState<SortType>('all');
  const [products, setProducts] = useState<BlockchainProduct[]>(BLOCKCHAIN_PRODUCTS);
  const [vaultInfoMap, setVaultInfoMap] = useState<Record<string, { totalAssets: string }>>({});
  const [platformStats, setPlatformStats] = useState<Record<string, { totalDeposited: number; depositCount: number }>>({});
  const [myDeposits, setMyDeposits] = useState<BlockchainDeposit[]>([]);

  // 화면 상태
  const [selectedProduct, setSelectedProduct] = useState<BlockchainProduct | null>(null);
  const [depositProduct, setDepositProduct] = useState<BlockchainProduct | null>(null);
  const [completeData, setCompleteData] = useState<{
    product: BlockchainProduct;
    amount: number;
    asset: string;
    txHash: string;
  } | null>(null);

  // 출금 관련 상태
  const [withdrawDeposit, setWithdrawDeposit] = useState<BlockchainDeposit | null>(null);
  const [withdrawProduct, setWithdrawProduct] = useState<BlockchainProduct | null>(null);
  const [withdrawCompleteData, setWithdrawCompleteData] = useState<{
    product: BlockchainProduct;
    amount: number;
    asset: string;
    txHash: string;
  } | null>(null);

  // route params 변경 시 탭 업데이트
  useEffect(() => {
    if (route.params?.tab) {
      setActiveTab(route.params.tab);
    }
  }, [route.params?.tab]);

  // USDC 잔액
  const usdcBalance = balances?.tokens?.find(t => t.symbol === 'USDC');
  const availableUsdc = usdcBalance ? parseFloat(usdcBalance.balanceFormatted) : 0;

  // 내 예치 내역 로드
  const loadMyDeposits = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const deposits = await getUserBlockchainDeposits(walletAddress);
      // 출금 완료된 것 제외
      setMyDeposits(deposits.filter(d => d.status !== 'withdrawn' && d.amount > 0));
    } catch (error) {
      console.error('Failed to load my deposits:', error);
    }
  }, [walletAddress]);

  // 화면 포커스 시 예치 내역 새로고침
  useFocusEffect(
    useCallback(() => {
      if (walletAddress) {
        loadMyDeposits();
      }
    }, [walletAddress, loadMyDeposits])
  );

  // 데이터 로드
  const loadData = async () => {
    // 모든 vault 정보 및 플랫폼 통계 병렬 로드
    const [mhyperInfo, sghoInfo, stats] = await Promise.all([
      getMHyperInfo(),
      getSGhoInfo(),
      getAllPlatformStats(),
    ]);

    const newVaultInfo: Record<string, { totalAssets: string }> = {};

    if (mhyperInfo) {
      newVaultInfo.mhyper = { totalAssets: mhyperInfo.totalAssets };
    }
    if (sghoInfo) {
      newVaultInfo.sgho = { totalAssets: sghoInfo.totalAssets };
    }

    setVaultInfoMap(prev => ({ ...prev, ...newVaultInfo }));
    setPlatformStats(stats);
  };

  useEffect(() => {
    loadData();
  }, [walletAddress]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(), loadMyDeposits()]);
    setRefreshing(false);
  };

  // 즐겨찾기 토글
  const handleFavoriteToggle = (productId: string) => {
    setProducts(prev =>
      prev.map(p =>
        p.id === productId ? { ...p, isFavorite: !p.isFavorite } : p
      )
    );
  };

  // 정렬된 상품 목록
  const getSortedProducts = () => {
    let sorted = [...products];
    switch (activeSort) {
      case 'apy':
        sorted.sort((a, b) => b.apy - a.apy);
        break;
      case 'favorites':
        sorted = sorted.filter(p => p.isFavorite);
        break;
      default:
        break;
    }
    return sorted;
  };

  const displayedProducts = getSortedProducts();

  // 출금 완료 화면
  if (withdrawCompleteData) {
    return (
      <WithdrawCompleteScreen
        product={withdrawCompleteData.product}
        amount={withdrawCompleteData.amount}
        asset={withdrawCompleteData.asset}
        txHash={withdrawCompleteData.txHash}
        onGoHome={() => {
          setWithdrawCompleteData(null);
          setWithdrawDeposit(null);
          setWithdrawProduct(null);
          navigation.navigate('Home', { refresh: Date.now() });
        }}
        onViewProducts={() => {
          setWithdrawCompleteData(null);
          setWithdrawDeposit(null);
          setWithdrawProduct(null);
          loadMyDeposits();
        }}
      />
    );
  }

  // 예치 완료 화면
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
          navigation.navigate('Home', { refresh: Date.now() });
        }}
        onViewProducts={() => {
          setCompleteData(null);
          setDepositProduct(null);
          setSelectedProduct(null);
          loadMyDeposits();
        }}
      />
    );
  }

  // 예치 완료 핸들러 (Firebase에 기록)
  const handleDepositComplete = async (data: { amount: number; asset: string; txHash: string }) => {
    // Firebase에 예치 기록
    if (depositProduct && walletAddress) {
      try {
        await recordBlockchainDeposit(
          walletAddress, // userId로 지갑 주소 사용
          walletAddress,
          depositProduct.id,
          data.amount,
          data.asset,
          data.txHash
        );
        // 통계 새로고침
        const stats = await getAllPlatformStats();
        setPlatformStats(stats);
      } catch (error) {
        console.error('Failed to record deposit:', error);
      }
    }
    setCompleteData({ ...data, product: depositProduct! });
  };

  // 출금 완료 핸들러 (Firebase 업데이트)
  const handleWithdrawComplete = async (data: { amount: number; asset: string; txHash: string }) => {
    if (withdrawDeposit && withdrawProduct) {
      try {
        await recordBlockchainWithdrawal(
          withdrawDeposit.id,
          data.amount,
          data.txHash
        );
        // 통계 새로고침
        const stats = await getAllPlatformStats();
        setPlatformStats(stats);
      } catch (error) {
        console.error('Failed to record withdrawal:', error);
      }
    }
    setWithdrawCompleteData({ ...data, product: withdrawProduct! });
  };

  // 출금 화면
  if (withdrawDeposit && withdrawProduct) {
    return (
      <WithdrawScreen
        product={withdrawProduct}
        deposit={withdrawDeposit}
        onBack={() => {
          setWithdrawDeposit(null);
          setWithdrawProduct(null);
        }}
        onComplete={handleWithdrawComplete}
      />
    );
  }

  // 예치 화면
  if (depositProduct) {
    return (
      <DepositScreen
        product={depositProduct}
        availableBalance={availableUsdc}
        onBack={() => setDepositProduct(null)}
        onComplete={handleDepositComplete}
      />
    );
  }

  // 상품 상세 화면
  if (selectedProduct) {
    return (
      <ProductDetailScreen
        product={selectedProduct}
        onBack={() => setSelectedProduct(null)}
        onDeposit={() => setDepositProduct(selectedProduct)}
      />
    );
  }

  // 메인 상품 목록 화면
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* 헤더 - 예치 가능 자산 */}
        <View style={styles.header}>
          <Text style={[styles.headerLabel, { color: colors.textSecondary }]}>예치 가능한 나의 자산</Text>
          <Text style={[styles.headerAmount, { color: colors.primary }]}>
            {formatUSD(availableUsdc)}
            <Text style={[styles.headerUnit, { color: colors.textMuted }]}> USDC</Text>
          </Text>
        </View>

        {/* 탭 버튼 */}
        <View style={styles.tabContainer}>
          {TAB_OPTIONS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                activeTab === tab.key && [styles.tabButtonActive, { borderBottomColor: colors.primary }],
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  { color: colors.textMuted },
                  activeTab === tab.key && { color: colors.primary },
                ]}
              >
                {tab.label}
                {tab.key === 'myDeposits' && myDeposits.length > 0 && (
                  <Text style={styles.tabBadge}> ({myDeposits.length})</Text>
                )}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 상품 탭 */}
        {activeTab === 'products' && (
          <>
            {/* 정렬 버튼 */}
            <View style={styles.sortContainer}>
              <Text style={[styles.productCount, { color: colors.textMuted }]}>
                상품 수 {displayedProducts.length}
              </Text>
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

        {/* 상품 목록 */}
        <View style={styles.listContainer}>
          {displayedProducts.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
              <Ionicons name="search-outline" size={40} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {activeSort === 'favorites' ? '즐겨찾기한 상품이 없습니다' : '상품이 없습니다'}
              </Text>
            </View>
          ) : (
            displayedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                totalAssets={vaultInfoMap[product.id]?.totalAssets}
                platformDeposited={platformStats[product.id]?.totalDeposited}
                depositCount={platformStats[product.id]?.depositCount}
                onPress={() => setSelectedProduct(product)}
                onFavoriteToggle={() => handleFavoriteToggle(product.id)}
              />
            ))
          )}
        </View>

            {/* 안내 메시지 */}
            <View style={styles.infoSection}>
              <View style={[styles.infoBox, { backgroundColor: colors.surfaceLight }]}>
                <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  모든 상품은 실제 블록체인 스마트 컨트랙트와 연동되어 있습니다. 예치 전 상품 상세 정보를 꼭 확인해 주세요.
                </Text>
              </View>
            </View>
          </>
        )}

        {/* 내 예치 탭 */}
        {activeTab === 'myDeposits' && (
          <View style={styles.listContainer}>
            {myDeposits.length === 0 ? (
              <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
                <Ionicons name="wallet-outline" size={40} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  예치된 상품이 없습니다
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                  상품 탭에서 예치를 시작해보세요
                </Text>
                <TouchableOpacity
                  style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                  onPress={() => setActiveTab('products')}
                >
                  <Text style={[styles.emptyButtonText, { color: colors.buttonPrimaryText }]}>
                    상품 보기
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              myDeposits.map((deposit) => (
                <MyDepositCard
                  key={deposit.id}
                  deposit={deposit}
                  onWithdraw={() => {
                    const product = getBlockchainProductById(deposit.productId);
                    if (product) {
                      setWithdrawProduct(product);
                      setWithdrawDeposit(deposit);
                    }
                  }}
                />
              ))
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// 내 예치 카드 컴포넌트
function MyDepositCard({
  deposit,
  onWithdraw,
}: {
  deposit: BlockchainDeposit;
  onWithdraw: () => void;
}) {
  const colors = useColors();
  const product = getBlockchainProductById(deposit.productId);

  if (!product) return null;

  const dailyYield = calculateEstimatedYield(deposit.amount, product.apy, 1);
  const monthlyYield = calculateEstimatedYield(deposit.amount, product.apy, 30);

  // 예치 기간 계산
  const daysSinceDeposit = Math.floor(
    (Date.now() - deposit.depositedAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const estimatedEarnings = calculateEstimatedYield(deposit.amount, product.apy, daysSinceDeposit);

  return (
    <Card variant="dark" style={myDepositStyles.card}>
      {/* 헤더 */}
      <View style={myDepositStyles.header}>
        <View style={myDepositStyles.titleRow}>
          <View style={[myDepositStyles.icon, { backgroundColor: colors.primaryBg }]}>
            <Text style={[myDepositStyles.iconText, { color: colors.primary }]}>
              {product.name.charAt(0)}
            </Text>
          </View>
          <View style={myDepositStyles.titleContainer}>
            <Text style={[myDepositStyles.productName, { color: colors.textPrimary }]}>
              {product.displayName}
            </Text>
            <Text style={[myDepositStyles.productSubname, { color: colors.textMuted }]}>
              {product.name} · APY {product.apy}%
            </Text>
          </View>
        </View>
      </View>

      {/* 금액 정보 */}
      <View style={[myDepositStyles.amountSection, { backgroundColor: colors.surfaceLight }]}>
        <View style={myDepositStyles.amountRow}>
          <Text style={[myDepositStyles.amountLabel, { color: colors.textMuted }]}>예치 금액</Text>
          <Text style={[myDepositStyles.amountValue, { color: colors.textPrimary }]}>
            ${formatUSD(deposit.amount)} {deposit.currency}
          </Text>
        </View>
        <View style={myDepositStyles.amountRow}>
          <Text style={[myDepositStyles.amountLabel, { color: colors.textMuted }]}>예상 수익 ({daysSinceDeposit}일)</Text>
          <Text style={[myDepositStyles.amountValue, { color: colors.primary }]}>
            +${formatUSD(estimatedEarnings)} {deposit.currency}
          </Text>
        </View>
      </View>

      {/* 하단 정보 */}
      <View style={myDepositStyles.footer}>
        <View style={myDepositStyles.footerInfo}>
          <Text style={[myDepositStyles.footerLabel, { color: colors.textMuted }]}>
            예치일: {deposit.depositedAt.toLocaleDateString('ko-KR')}
          </Text>
          <Text style={[myDepositStyles.footerLabel, { color: colors.textMuted }]}>
            일 수익: +${formatUSD(dailyYield)}
          </Text>
        </View>
        <TouchableOpacity
          style={[myDepositStyles.withdrawButton, { borderColor: colors.primary }]}
          onPress={onWithdraw}
        >
          <Text style={[myDepositStyles.withdrawButtonText, { color: colors.primary }]}>
            해지하기
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const myDepositStyles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  header: {
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
  },
  titleContainer: {
    flex: 1,
    gap: 2,
  },
  productName: {
    fontSize: 16,
    fontWeight: FontWeight.bold,
  },
  productSubname: {
    fontSize: 13,
  },
  amountSection: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 13,
  },
  amountValue: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerInfo: {
    gap: 2,
  },
  footerLabel: {
    fontSize: 12,
  },
  withdrawButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  withdrawButtonText: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
  },
});

// 상품 카드 컴포넌트
function ProductCard({
  product,
  totalAssets,
  platformDeposited,
  depositCount,
  onPress,
  onFavoriteToggle,
}: {
  product: BlockchainProduct;
  totalAssets?: string;
  platformDeposited?: number;
  depositCount?: number;
  onPress: () => void;
  onFavoriteToggle: () => void;
}) {
  const colors = useColors();

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <Card variant="dark" style={styles.productCard}>
        {/* 상품 헤더 */}
        <View style={styles.productHeader}>
          <View style={styles.productTitleRow}>
            <View style={[styles.productIcon, { backgroundColor: colors.primaryBg }]}>
              <Text style={[styles.productIconText, { color: colors.primary }]}>
                {product.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.productTitleContainer}>
              <Text style={[styles.productName, { color: colors.textPrimary }]}>
                {product.displayName}
              </Text>
              <Text style={[styles.productSubname, { color: colors.textMuted }]}>
                {product.name}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onFavoriteToggle();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={product.isFavorite ? 'star' : 'star-outline'}
                size={20}
                color={product.isFavorite ? colors.warning : colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 간단한 설명 */}
        <Text style={[styles.productDescription, { color: colors.textSecondary }]}>
          {product.description}
        </Text>

        {/* 핵심 정보 */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>연 수익률</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {formatPercentage(product.apy)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>예치 자산</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {product.depositToken}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>유형</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {product.type === 'flexible' ? '자유 출금' : `${product.lockupDays}일 락업`}
            </Text>
          </View>
        </View>

        {/* 하단 정보 */}
        <View style={[styles.productFooter, { borderTopColor: colors.border }]}>
          <View style={styles.footerLeft}>
            <Text style={[styles.footerLabel, { color: colors.textMuted }]}>전체 예치액</Text>
            <Text style={[styles.footerValue, { color: colors.textSecondary }]}>
              {totalAssets ? `$${formatUSD(parseFloat(totalAssets))}` : '-'}
            </Text>
          </View>
          <View style={styles.footerCenter}>
            <Text style={[styles.footerLabel, { color: colors.textMuted }]}>TOOK 예치</Text>
            <Text style={[styles.footerValue, { color: colors.primary }]}>
              {platformDeposited ? `$${formatUSD(platformDeposited)}` : '$0'}
              {depositCount ? ` (${depositCount}건)` : ''}
            </Text>
          </View>
          <View style={styles.footerRight}>
            <Text style={[styles.footerLabel, { color: colors.textMuted }]}>네트워크</Text>
            <Text style={[styles.footerValue, { color: colors.textSecondary }]}>
              {product.networks.join(', ')}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
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
    fontSize: 14,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
  },
  headerAmount: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
  },
  headerUnit: {
    fontSize: 18,
    fontWeight: FontWeight.medium,
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
    gap: Spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
  },
  productCard: {
    marginBottom: Spacing.sm,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  productTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  productIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productIconText: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
  },
  productTitleContainer: {
    flex: 1,
    gap: 2,
  },
  productName: {
    fontSize: 16,
    fontWeight: FontWeight.bold,
  },
  productSubname: {
    fontSize: 13,
  },
  headerRight: {
    paddingTop: 4,
  },
  productDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  statItem: {
    flex: 1,
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
  },
  statValue: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  footerLeft: {
    flex: 1,
    gap: 2,
  },
  footerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  footerRight: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  footerLabel: {
    fontSize: 11,
  },
  footerValue: {
    fontSize: 13,
    fontWeight: FontWeight.medium,
  },
  infoSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  infoBox: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  // 탭 스타일
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tabButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginRight: Spacing.md,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    marginBottom: -1,
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: FontWeight.medium,
  },
  tabBadge: {
    fontWeight: FontWeight.bold,
  },
  // 빈 상태 스타일
  emptySubtext: {
    fontSize: 13,
    marginTop: Spacing.xs,
  },
  emptyButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
  },
});
