import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FontWeight, Spacing, BorderRadius } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { Card } from '../../components/common';
import { formatUSD } from '../../utils/format';
import { useAuthStore } from '../../store/useAuthStore';
import { getUserBlockchainDeposits, getBlockchainProductById, calculateEstimatedYield, getPlatformStats } from '../../services';

export default function RankingScreen() {
  const colors = useColors();
  const walletAddress = useAuthStore((s) => s.walletAddress);
  const [refreshing, setRefreshing] = useState(false);

  // 내 실제 예치 데이터
  const [myDeposited, setMyDeposited] = useState(0);
  const [myDailyYield, setMyDailyYield] = useState(0);
  const [myEarned, setMyEarned] = useState(0);

  // 전체 플랫폼 통계 (추후 Cloud Functions로 집계)
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalYieldEarned, setTotalYieldEarned] = useState(0);
  const [totalDailyYield, setTotalDailyYield] = useState(0);

  // 내 데이터 로드
  const loadMyData = useCallback(async () => {
    if (!walletAddress) return;

    try {
      const deposits = await getUserBlockchainDeposits(walletAddress);
      let totalDeposit = 0;
      let dailyYield = 0;

      deposits.forEach((deposit) => {
        totalDeposit += deposit.amount;
        const product = getBlockchainProductById(deposit.productId);
        if (product) {
          dailyYield += calculateEstimatedYield(deposit.amount, product.apy, 1);
        }
      });

      setMyDeposited(totalDeposit);
      setMyDailyYield(dailyYield);

      // 예치 기간에 따른 예상 누적 수익 계산
      const oldestDeposit = deposits.reduce((oldest, d) => {
        return d.depositedAt < oldest ? d.depositedAt : oldest;
      }, new Date());
      const daysSinceFirst = Math.floor((Date.now() - oldestDeposit.getTime()) / (1000 * 60 * 60 * 24));
      setMyEarned(dailyYield * Math.max(daysSinceFirst, 1));
    } catch (error) {
      console.error('Failed to load my ranking data:', error);
    }
  }, [walletAddress]);

  // 플랫폼 통계 로드
  const loadPlatformStats = useCallback(async () => {
    try {
      const stats = await getPlatformStats('mHYPER');
      if (stats) {
        setTotalUsers(stats.depositCount || 0);
        // 총 예치금 기반 예상 일일 이자 (평균 APY 8% 가정)
        const estimatedDailyYield = (stats.totalDeposited || 0) * 0.08 / 365;
        setTotalDailyYield(estimatedDailyYield);
        // 서비스 시작 이후 총 수익 (예상)
        setTotalYieldEarned(estimatedDailyYield * 30); // 약 1개월 기준
      }
    } catch (error) {
      console.error('Failed to load platform stats:', error);
    }
  }, []);

  useEffect(() => {
    loadMyData();
    loadPlatformStats();
  }, [loadMyData, loadPlatformStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadMyData(), loadPlatformStats()]);
    setRefreshing(false);
  }, [loadMyData, loadPlatformStats]);

  // 내 닉네임
  const myNickname = useAuthStore((s) => s.userProfile?.displayName);

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
        {/* Header */}
        <Text style={[styles.title, { color: colors.textPrimary }]}>리더보드</Text>

        {/* Yield Highlight Card */}
        <Card variant="dark" style={styles.yieldHighlightCard}>
          <View style={[styles.yieldIconContainer, { backgroundColor: colors.primaryBg }]}>
            <Ionicons name="trending-up" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.yieldHighlightLabel, { color: colors.textMuted }]}>
            TOOK 사용자들이 받은 총 이자
          </Text>
          <Text style={[styles.yieldHighlightValue, { color: colors.primary }]}>
            +${formatUSD(totalYieldEarned)}
          </Text>
          <View style={styles.yieldSubStats}>
            <View style={styles.yieldSubStatItem}>
              <Text style={[styles.yieldSubStatLabel, { color: colors.textMuted }]}>오늘 발생 이자</Text>
              <Text style={[styles.yieldSubStatValue, { color: colors.textPrimary }]}>
                +${formatUSD(totalDailyYield)}
              </Text>
            </View>
            <View style={[styles.yieldSubStatDivider, { backgroundColor: colors.border }]} />
            <View style={styles.yieldSubStatItem}>
              <Text style={[styles.yieldSubStatLabel, { color: colors.textMuted }]}>참여자 수</Text>
              <Text style={[styles.yieldSubStatValue, { color: colors.textPrimary }]}>
                {totalUsers > 0 ? totalUsers.toLocaleString() : '-'}명
              </Text>
            </View>
          </View>
        </Card>

        {/* My Ranking Card */}
        {walletAddress && myDeposited > 0 && (
          <Card variant="dark" style={styles.myRankCard}>
            <View style={styles.myRankHeader}>
              <View style={styles.myRankBadge}>
                <Ionicons name="person" size={16} color={colors.primary} />
                <Text style={[styles.myRankBadgeText, { color: colors.primary }]}>
                  {myNickname || '닉네임 미설정'}
                </Text>
              </View>
            </View>

            {/* 내 수익 강조 */}
            <View style={[styles.myYieldBox, { backgroundColor: colors.primaryBg }]}>
              <View style={styles.myYieldMain}>
                <Text style={[styles.myYieldLabel, { color: colors.textSecondary }]}>예상 누적 수익</Text>
                <Text style={[styles.myYieldValue, { color: colors.primary }]}>
                  +${formatUSD(myEarned)}
                </Text>
              </View>
              <View style={[styles.myYieldDivider, { backgroundColor: colors.border }]} />
              <View style={styles.myYieldSub}>
                <Text style={[styles.myYieldSubLabel, { color: colors.textMuted }]}>일일 이자</Text>
                <Text style={[styles.myYieldSubValue, { color: colors.primary }]}>
                  +${formatUSD(myDailyYield)}
                </Text>
              </View>
            </View>

            <View style={styles.myRankStats}>
              <View style={styles.myRankStatItem}>
                <Text style={[styles.myRankStatLabel, { color: colors.textMuted }]}>총 예치금</Text>
                <Text style={[styles.myRankStatValue, { color: colors.textSecondary }]}>
                  ${formatUSD(myDeposited)}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>수익 TOP 10</Text>
          <View style={[styles.liveBadge, { backgroundColor: colors.textMuted + '20' }]}>
            <Text style={[styles.liveText, { color: colors.textMuted }]}>준비 중</Text>
          </View>
        </View>

        {/* Coming Soon Card */}
        <Card variant="dark" style={styles.comingSoonCard}>
          <Ionicons name="trophy-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.comingSoonTitle, { color: colors.textSecondary }]}>
            리더보드 준비 중
          </Text>
          <Text style={[styles.comingSoonText, { color: colors.textMuted }]}>
            더 많은 사용자가 참여하면{'\n'}실시간 순위를 확인할 수 있어요!
          </Text>
        </Card>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.primaryBg }]}>
          <Ionicons name="sparkles" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            더 많이 예치할수록 더 많은 이자를 받아요!{'\n'}
            상위 랭커에게는 특별한 보너스가 제공될 예정입니다.
          </Text>
        </View>

        <View style={{ height: 40 }} />
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
    paddingHorizontal: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  // Yield Highlight Card
  yieldHighlightCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.md,
  },
  yieldIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  yieldHighlightLabel: {
    fontSize: 13,
    marginBottom: Spacing.xs,
  },
  yieldHighlightValue: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.lg,
  },
  yieldSubStats: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  yieldSubStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  yieldSubStatDivider: {
    width: 1,
    height: 32,
  },
  yieldSubStatLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  yieldSubStatValue: {
    fontSize: 16,
    fontWeight: FontWeight.semibold,
  },
  // My Rank Card
  myRankCard: {
    marginBottom: Spacing.lg,
  },
  myRankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  myRankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  myRankBadgeText: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
  },
  myRankNumber: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
  },
  myYieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  myYieldMain: {
    flex: 1,
  },
  myYieldLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  myYieldValue: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
  },
  myYieldDivider: {
    width: 1,
    height: 36,
    marginHorizontal: Spacing.md,
  },
  myYieldSub: {
    alignItems: 'flex-end',
  },
  myYieldSubLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  myYieldSubValue: {
    fontSize: 16,
    fontWeight: FontWeight.semibold,
  },
  myRankStats: {
    flexDirection: 'row',
  },
  myRankStatItem: {
    gap: 2,
  },
  myRankStatLabel: {
    fontSize: 12,
  },
  myRankStatValue: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
  },
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: FontWeight.medium,
  },
  // Coming Soon Card
  comingSoonCard: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    marginBottom: Spacing.md,
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  comingSoonText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
});
