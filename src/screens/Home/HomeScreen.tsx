import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useColors } from '../../hooks/useColors';
import { useAuthStore } from '../../store/useAuthStore';
import { useAssetStore } from '../../store/useAssetStore';
import AssetSummary from '../../components/home/AssetSummary';
import IdleAssetBanner from '../../components/home/IdleAssetBanner';
import TookClaimCard from '../../components/home/TookClaimCard';
import AssetList from '../../components/home/AssetList';
import InterestManagement from '../../components/home/InterestManagement';
import EventBanner, { EventData } from '../../components/home/EventBanner';
import { AssetData } from '../../components/home/AssetListItem';

// Fallback mock data (Firebase 연결 전 또는 데이터 없을 때)
const FALLBACK_ASSETS: AssetData[] = [
  { id: '1', symbol: 'USD+', balance: 5200, currency: 'USD', estimatedYield: 270, yieldRate: 5.2, iconColor: '#4ADE80' },
  { id: '2', symbol: 'USDT', balance: 3100, currency: 'USD', estimatedYield: 149, yieldRate: 4.8, iconColor: '#26A17B' },
  { id: '3', symbol: 'USDC', balance: 1800, currency: 'USD', estimatedYield: 81, yieldRate: 4.5, iconColor: '#2775CA' },
];

const MOCK_EVENTS: EventData[] = [
  { id: '1', title: 'EVENT! 신규 가입 보너스 지급', endDate: '~3/31' },
  { id: '2', title: 'EVENT! 첫 예치 수수료 0%', endDate: '~4/30' },
];

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const colors = useColors();
  const { user } = useAuthStore();
  const { assets, totalBalance, dailyInterest, loadAssets, subscribeAssets, claim } = useAssetStore();

  const [showIdleBanner, setShowIdleBanner] = useState(true);
  const [autoCompound, setAutoCompound] = useState(true);
  const [totalClaimed, setTotalClaimed] = useState(0);
  const [compoundedAmount, setCompoundedAmount] = useState(0);
  const [separateAmount, setSeparateAmount] = useState(0);
  const [localDailyInterest, setLocalDailyInterest] = useState(0);

  // Firebase에서 자산 로드
  useEffect(() => {
    if (user?.uid) {
      loadAssets(user.uid);
      const unsubscribe = subscribeAssets(user.uid);
      return () => unsubscribe();
    }
  }, [user?.uid, loadAssets, subscribeAssets]);

  // 일일 이자 동기화
  useEffect(() => {
    setLocalDailyInterest(dailyInterest);
  }, [dailyInterest]);

  // 표시용 자산 데이터 (Firebase 데이터 또는 fallback)
  const displayAssets: AssetData[] = assets.length > 0
    ? assets.map((a) => ({
        id: a.id,
        symbol: a.symbol,
        balance: a.balance,
        currency: a.currency,
        estimatedYield: a.estimatedYield || a.balance * (a.yieldRate / 100),
        yieldRate: a.yieldRate / 100, // 퍼센트 -> 소수점
        iconColor: a.iconColor || '#4ADE80',
      }))
    : FALLBACK_ASSETS;

  const displayTotalBalance = assets.length > 0 ? totalBalance : 10100;
  const displayDailyInterest = assets.length > 0 ? localDailyInterest : 1.38;

  const handleClaim = async () => {
    if (user?.uid) {
      try {
        await claim(user.uid);
      } catch {
        // 에러는 store에서 처리
      }
    }

    const claimed = displayDailyInterest;
    setTotalClaimed((prev) => prev + claimed);

    if (autoCompound) {
      setCompoundedAmount((prev) => prev + claimed);
    } else {
      setSeparateAmount((prev) => prev + claimed);
    }

    setLocalDailyInterest(0);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <AssetSummary totalAssetKRW={displayTotalBalance} />

        {showIdleBanner && (
          <IdleAssetBanner
            idleAmount={Math.round(displayTotalBalance * 0.1)}
            onClose={() => setShowIdleBanner(false)}
            onPress={() => navigation.navigate('Products')}
          />
        )}

        <TookClaimCard
          dailyInterest={displayDailyInterest}
          onClaim={handleClaim}
        />

        <InterestManagement
          autoCompound={autoCompound}
          onToggleAutoCompound={setAutoCompound}
          totalClaimed={totalClaimed}
          compoundedAmount={compoundedAmount}
          separateAmount={separateAmount}
        />

        <AssetList
          assets={displayAssets}
          onAssetPress={() => navigation.navigate('Products')}
          onSeeAll={() => navigation.navigate('Products')}
        />

        <EventBanner
          events={MOCK_EVENTS}
          onEventPress={() => {}}
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
});
