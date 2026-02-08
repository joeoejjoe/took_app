import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  RefreshControl,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../hooks/useColors';
import { useAuthStore } from '../../store/useAuthStore';
import { useBlockchainStore } from '../../store/useBlockchainStore';
import AssetSummary from '../../components/home/AssetSummary';
import IdleAssetBanner from '../../components/home/IdleAssetBanner';
import AssetList from '../../components/home/AssetList';
import AutoCompoundCard from '../../components/home/AutoCompoundCard';
import EventBanner, { EventData } from '../../components/home/EventBanner';
import { Card, PrimaryButton } from '../../components/common';
import { AssetData } from '../../components/home/AssetListItem';
import { FontWeight, Spacing, BorderRadius, TOKEN_COLORS, STABLECOINS } from '../../constants';
import { getUserBlockchainDeposits, BlockchainDeposit, getBlockchainProductById, calculateEstimatedYield } from '../../services';
import { formatUSD } from '../../utils/format';

// 이벤트 데이터 (실제 서비스에서는 Firestore에서 가져오기)
const LIVE_EVENTS: EventData[] = [
  // 라이브 이벤트가 있을 때만 추가
];

type HomeScreenParams = {
  refresh?: number;
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ Home: HomeScreenParams }, 'Home'>>();
  const colors = useColors();
  const { walletAddress } = useAuthStore();
  const { balances, isLoading, fetchBalances } = useBlockchainStore();

  const [showIdleBanner, setShowIdleBanner] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deposits, setDeposits] = useState<BlockchainDeposit[]>([]);
  const [showDepositGuide, setShowDepositGuide] = useState(false);

  // 예치된 상품이 있는지 확인
  const hasDeposits = deposits.length > 0;
  const totalDeposited = deposits.reduce((sum, d) => sum + d.amount, 0);

  // 일일 수익 및 평균 APY 계산
  const { dailyYield, averageApy } = React.useMemo(() => {
    if (deposits.length === 0) return { dailyYield: 0, averageApy: 0 };

    let totalDailyYield = 0;
    let weightedApySum = 0;

    deposits.forEach((deposit) => {
      const product = getBlockchainProductById(deposit.productId);
      if (product) {
        const daily = calculateEstimatedYield(deposit.amount, product.apy, 1);
        totalDailyYield += daily;
        weightedApySum += product.apy * deposit.amount;
      }
    });

    const avgApy = totalDeposited > 0 ? weightedApySum / totalDeposited : 0;
    return { dailyYield: totalDailyYield, averageApy: avgApy };
  }, [deposits, totalDeposited]);

  // 블록체인 잔액 로드 (최초 1회)
  useEffect(() => {
    if (walletAddress) {
      fetchBalances(walletAddress);
    }
  }, [walletAddress, fetchBalances]);

  // 예치 내역 로드 함수
  const loadDeposits = useCallback(async () => {
    if (!walletAddress) return;
    try {
      console.log('Loading deposits for wallet:', walletAddress);
      const userDeposits = await getUserBlockchainDeposits(walletAddress);
      console.log('Loaded deposits:', userDeposits.length);
      setDeposits(userDeposits);
    } catch (error) {
      console.error('Failed to load deposits:', error);
    }
  }, [walletAddress]);

  // 화면에 포커스될 때마다 예치 내역 새로고침
  useFocusEffect(
    useCallback(() => {
      if (walletAddress) {
        loadDeposits();
      }
    }, [walletAddress, loadDeposits])
  );

  // 다른 화면에서 refresh 파라미터와 함께 돌아왔을 때 새로고침
  useEffect(() => {
    if (route.params?.refresh && walletAddress) {
      loadDeposits();
      fetchBalances(walletAddress);
    }
  }, [route.params?.refresh, walletAddress, loadDeposits, fetchBalances]);

  // 당겨서 새로고침
  const onRefresh = useCallback(async () => {
    if (walletAddress) {
      setRefreshing(true);
      await Promise.all([
        fetchBalances(walletAddress),
        loadDeposits(),
      ]);
      setRefreshing(false);
    }
  }, [walletAddress, fetchBalances, loadDeposits]);

  // 스테이블코인만 표시 (USDC, USDT, DAI, GHO 등)
  const BEST_APY = 8.93; // 최고 상품 APY (mHYPER)
  const displayAssets: AssetData[] = [];

  if (balances?.tokens) {
    balances.tokens
      .filter((token) => STABLECOINS.includes(token.symbol))
      .forEach((token) => {
        const balance = parseFloat(token.balanceFormatted);
        const estimatedYearlyYield = balance * (BEST_APY / 100);
        displayAssets.push({
          id: token.address,
          symbol: token.symbol,
          balance: balance,
          currency: 'USD',
          estimatedYield: estimatedYearlyYield, // 최고 APY 기준 예상 연 수익
          yieldRate: BEST_APY / 100,
          iconColor: TOKEN_COLORS[token.symbol] || '#4ADE80',
        });
      });
  }

  // 지갑 잔액 계산 (스테이블코인은 1:1 USD)
  const walletBalance = displayAssets.reduce((sum, asset) => sum + asset.balance, 0);

  // 총 자산 = 지갑 잔액 + 예치금
  const totalAssetUSD = walletBalance + totalDeposited;

  // 지갑 주소 복사
  const handleCopyAddress = async () => {
    if (!walletAddress) return;
    try {
      const Clipboard = await import('expo-clipboard');
      await Clipboard.setStringAsync(walletAddress);
      // 복사 완료 피드백 (간단한 alert 또는 toast)
      alert('지갑 주소가 복사되었습니다!');
    } catch {
      alert(walletAddress);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* 총 자산 요약 */}
        <AssetSummary totalAssetUSD={totalAssetUSD} />

        {/* 예치된 상품이 있을 때만 이자 관련 UI 표시 */}
        {hasDeposits ? (
          <>
            {/* 예치하지 않은 유휴 자산 알림 */}
            {showIdleBanner && walletBalance > 0 && (
              <IdleAssetBanner
                idleAmount={Math.round(walletBalance)}
                onClose={() => setShowIdleBanner(false)}
                onPress={() => navigation.navigate('Products')}
              />
            )}

            {/* 내 예치 현황 */}
            <View style={styles.depositSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  내 예치 현황
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Products', { tab: 'myDeposits' })}>
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>
                    더보기
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 예치 요약 카드 */}
              <Card variant="dark" style={styles.depositSummaryCard}>
                <View style={styles.depositSummaryRow}>
                  <View style={styles.depositSummaryItem}>
                    <Text style={[styles.depositSummaryLabel, { color: colors.textMuted }]}>
                      총 예치금
                    </Text>
                    <Text style={[styles.depositSummaryValue, { color: colors.primary }]}>
                      ${formatUSD(totalDeposited)}
                    </Text>
                  </View>
                  <View style={[styles.depositSummaryDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.depositSummaryItem}>
                    <Text style={[styles.depositSummaryLabel, { color: colors.textMuted }]}>
                      예치 상품
                    </Text>
                    <Text style={[styles.depositSummaryValue, { color: colors.textPrimary }]}>
                      {deposits.length}개
                    </Text>
                  </View>
                </View>
              </Card>

              {/* 예치 상품 목록 */}
              {deposits.slice(0, 3).map((deposit) => (
                <DepositedProductCard
                  key={deposit.id}
                  deposit={deposit}
                  onPress={() => navigation.navigate('Products', { tab: 'myDeposits' })}
                />
              ))}
            </View>

            {/* 자동 복리 수익 카드 */}
            <AutoCompoundCard
              dailyYield={dailyYield}
              totalDeposited={totalDeposited}
              averageApy={averageApy}
            />
          </>
        ) : (
          <>
            {/* 예치된 상품이 없을 때 안내 카드 */}
            <Card variant="dark" style={styles.noDepositCard}>
              <View style={styles.noDepositIconContainer}>
                <Ionicons name="sparkles" size={40} color={colors.primary} />
              </View>
              <Text style={[styles.noDepositTitle, { color: colors.textPrimary }]}>
                현재 예치된 상품이 없습니다
              </Text>
              <Text style={[styles.noDepositDescription, { color: colors.textSecondary }]}>
                자산을 예치하고{'\n'}매일 쌓이는 이자 수익을 받아보세요!
              </Text>
              <View style={styles.noDepositButtons}>
                <PrimaryButton
                  title="상품 둘러보기"
                  onPress={() => navigation.navigate('Products')}
                />
                <TouchableOpacity
                  style={styles.guideButton}
                  onPress={() => setShowDepositGuide(true)}
                >
                  <Ionicons name="help-circle-outline" size={18} color={colors.primary} />
                  <Text style={[styles.guideButtonText, { color: colors.primary }]}>
                    예치 방법 알아보기
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>

            {/* 자산 입금 방법 안내 (펼쳐지는 가이드) */}
            {showDepositGuide && (
              <Card variant="dark" style={styles.guideCard}>
                <View style={styles.guideHeader}>
                  <Text style={[styles.guideTitle, { color: colors.textPrimary }]}>
                    자산 입금 방법
                  </Text>
                  <TouchableOpacity onPress={() => setShowDepositGuide(false)}>
                    <Ionicons name="close" size={22} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* 내 지갑 주소 표시 */}
                {walletAddress && (
                  <TouchableOpacity
                    style={[styles.walletAddressBox, { backgroundColor: colors.surfaceLight }]}
                    onPress={handleCopyAddress}
                    activeOpacity={0.7}
                  >
                    <View style={styles.walletAddressContent}>
                      <Text style={[styles.walletAddressLabel, { color: colors.textMuted }]}>
                        내 지갑 주소
                      </Text>
                      <Text style={[styles.walletAddressText, { color: colors.textPrimary }]} numberOfLines={1}>
                        {walletAddress}
                      </Text>
                    </View>
                    <View style={[styles.copyButton, { backgroundColor: colors.primary }]}>
                      <Ionicons name="copy-outline" size={16} color="#000" />
                      <Text style={styles.copyButtonText}>복사</Text>
                    </View>
                  </TouchableOpacity>
                )}

                <View style={styles.guideStepsContainer}>
                  <DepositGuideStep
                    step={1}
                    title="지갑 주소 복사"
                    description="위의 지갑 주소를 복사하세요"
                    icon="copy-outline"
                  />
                  <DepositGuideStep
                    step={2}
                    title="거래소에서 출금"
                    description="바이낸스, 업비트 등 보유 중인 거래소에서 USDC 출금을 선택하세요"
                    icon="exit-outline"
                  />
                  <DepositGuideStep
                    step={3}
                    title="주소 입력 및 전송"
                    description="복사한 지갑 주소를 붙여넣고, 네트워크는 'Ethereum(ERC-20)'을 선택 후 전송하세요"
                    icon="send-outline"
                  />
                  <DepositGuideStep
                    step={4}
                    title="입금 확인 후 예치"
                    description="잔액이 반영되면 상품 탭에서 예치를 진행하세요"
                    icon="checkmark-circle-outline"
                    isLast
                  />
                </View>

                <View style={[styles.guideTip, { backgroundColor: colors.warning + '15' }]}>
                  <Ionicons name="warning-outline" size={18} color={colors.warning} />
                  <Text style={[styles.guideTipText, { color: colors.textSecondary }]}>
                    반드시 Ethereum 네트워크(ERC-20)로 전송하세요. 다른 네트워크로 전송 시 자산을 잃을 수 있습니다.
                  </Text>
                </View>

                <View style={[styles.guideTip, { backgroundColor: colors.primaryBg, marginTop: Spacing.sm }]}>
                  <Ionicons name="bulb-outline" size={18} color={colors.primary} />
                  <Text style={[styles.guideTipText, { color: colors.textSecondary }]}>
                    거래소 계정이 없으신가요? 환전 탭에서 원화로 직접 USDC를 구매할 수도 있어요!
                  </Text>
                </View>
              </Card>
            )}
          </>
        )}

        {/* 보유 스테이블코인 목록 */}
        {displayAssets.length > 0 ? (
          <AssetList
            assets={displayAssets}
            onAssetPress={() => navigation.navigate('Products')}
            onSeeAll={() => navigation.navigate('Products')}
          />
        ) : (
          <Card variant="dark" style={styles.emptyCard}>
            <Ionicons name="wallet-outline" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {isLoading ? '잔액 조회 중...' : '보유한 스테이블코인이 없습니다'}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
              USDC를 입금하거나 환전 탭에서 교환하세요
            </Text>
          </Card>
        )}

        {/* 이벤트 배너 - 이벤트가 있을 때만 표시 */}
        {LIVE_EVENTS.length > 0 && (
          <EventBanner
            events={LIVE_EVENTS}
            onEventPress={() => {}}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// 예치된 상품 카드 컴포넌트
function DepositedProductCard({
  deposit,
  onPress,
}: {
  deposit: BlockchainDeposit;
  onPress: () => void;
}) {
  const colors = useColors();
  const product = getBlockchainProductById(deposit.productId);

  if (!product) return null;

  const dailyYield = calculateEstimatedYield(deposit.amount, product.apy, 1);
  const monthlyYield = calculateEstimatedYield(deposit.amount, product.apy, 30);

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <Card variant="dark" style={depositCardStyles.container}>
        <View style={depositCardStyles.header}>
          <View style={[depositCardStyles.icon, { backgroundColor: colors.primaryBg }]}>
            <Text style={[depositCardStyles.iconText, { color: colors.primary }]}>
              {product.name.charAt(0)}
            </Text>
          </View>
          <View style={depositCardStyles.info}>
            <Text style={[depositCardStyles.productName, { color: colors.textPrimary }]}>
              {product.displayName}
            </Text>
            <Text style={[depositCardStyles.productSubname, { color: colors.textMuted }]}>
              {product.name} · APY {product.apy}%
            </Text>
          </View>
          <View style={depositCardStyles.amountContainer}>
            <Text style={[depositCardStyles.amount, { color: colors.textPrimary }]}>
              ${formatUSD(deposit.amount)}
            </Text>
            <Text style={[depositCardStyles.yield, { color: colors.primary }]}>
              +${formatUSD(dailyYield)}/일
            </Text>
          </View>
        </View>
        <View style={[depositCardStyles.footer, { borderTopColor: colors.border }]}>
          <Text style={[depositCardStyles.footerText, { color: colors.textMuted }]}>
            예치일: {deposit.depositedAt.toLocaleDateString('ko-KR')}
          </Text>
          <Text style={[depositCardStyles.footerText, { color: colors.textSecondary }]}>
            예상 월 수익: +${formatUSD(monthlyYield)}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const depositCardStyles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  info: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  productName: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
  },
  productSubname: {
    fontSize: 12,
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: FontWeight.bold,
  },
  yield: {
    fontSize: 13,
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 12,
  },
});

// 예치 가이드 스텝 컴포넌트
function DepositGuideStep({
  step,
  title,
  description,
  icon,
  isLast,
}: {
  step: number;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  isLast?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={[guideStepStyles.container, !isLast && guideStepStyles.withLine]}>
      <View style={[guideStepStyles.stepCircle, { backgroundColor: colors.primaryBg }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      {!isLast && <View style={[guideStepStyles.line, { backgroundColor: colors.border }]} />}
      <View style={guideStepStyles.content}>
        <Text style={[guideStepStyles.stepNumber, { color: colors.primary }]}>STEP {step}</Text>
        <Text style={[guideStepStyles.title, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[guideStepStyles.description, { color: colors.textMuted }]}>{description}</Text>
      </View>
    </View>
  );
}

const guideStepStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    position: 'relative',
  },
  withLine: {
    paddingBottom: Spacing.sm,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    zIndex: 1,
  },
  line: {
    position: 'absolute',
    left: 19,
    top: 40,
    width: 2,
    height: '100%',
  },
  content: {
    flex: 1,
    paddingTop: 2,
  },
  stepNumber: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    marginBottom: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: FontWeight.semibold,
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  emptyCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: FontWeight.medium,
  },
  emptySubtext: {
    fontSize: 13,
  },
  // 예치 없음 안내 카드
  noDepositCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  noDepositIconContainer: {
    marginBottom: Spacing.md,
  },
  noDepositTitle: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  noDepositDescription: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  noDepositButtons: {
    width: '100%',
    gap: Spacing.md,
  },
  guideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  guideButtonText: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
  },
  // 예치 가이드 카드
  guideCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  guideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: FontWeight.bold,
  },
  guideTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  guideTipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  // 지갑 주소 박스
  walletAddressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  walletAddressContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  walletAddressLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  walletAddressText: {
    fontSize: 13,
    fontFamily: 'monospace',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  copyButtonText: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
    color: '#000',
  },
  guideStepsContainer: {
    marginBottom: Spacing.sm,
  },
  // 예치 섹션
  depositSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: FontWeight.bold,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
  },
  depositSummaryCard: {
    marginBottom: Spacing.md,
  },
  depositSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  depositSummaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  depositSummaryDivider: {
    width: 1,
    height: 40,
  },
  depositSummaryLabel: {
    fontSize: 12,
  },
  depositSummaryValue: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
  },
});
