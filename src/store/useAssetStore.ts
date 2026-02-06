import { create } from 'zustand';
import {
  getUserAssets,
  subscribeToUserAssets,
  getTotalBalance,
  getDailyInterest,
  claimInterest,
  getInterestClaimHistory,
} from '../services';
import type { Asset, InterestClaim } from '../services';

interface AssetState {
  // 상태
  assets: Asset[];
  totalBalance: number;
  dailyInterest: number;
  claimHistory: InterestClaim[];
  isLoading: boolean;
  error: string | null;
  lastClaimedAt: Date | null;

  // 액션
  loadAssets: (userId: string) => Promise<void>;
  subscribeAssets: (userId: string) => () => void;
  loadClaimHistory: (userId: string) => Promise<void>;
  claim: (userId: string) => Promise<void>;
  reset: () => void;
}

export const useAssetStore = create<AssetState>((set, get) => ({
  // 초기 상태
  assets: [],
  totalBalance: 0,
  dailyInterest: 0,
  claimHistory: [],
  isLoading: false,
  error: null,
  lastClaimedAt: null,

  // 자산 로드
  loadAssets: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const [assets, totalBalance, dailyInterest] = await Promise.all([
        getUserAssets(userId),
        getTotalBalance(userId),
        getDailyInterest(userId),
      ]);
      set({ assets, totalBalance, dailyInterest });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '자산 로드에 실패했습니다.';
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },

  // 자산 실시간 구독
  subscribeAssets: (userId: string) => {
    const unsubscribe = subscribeToUserAssets(userId, (assets) => {
      const totalBalance = assets.reduce((sum, a) => sum + a.balance, 0);
      const dailyInterest = assets.reduce((sum, a) => {
        const dailyRate = a.yieldRate / 365 / 100;
        return sum + a.balance * dailyRate;
      }, 0);
      set({ assets, totalBalance, dailyInterest });
    });
    return unsubscribe;
  },

  // 이자 수령 내역 로드
  loadClaimHistory: async (userId: string) => {
    try {
      const history = await getInterestClaimHistory(userId);
      set({ claimHistory: history });

      // 마지막 수령 시간 업데이트
      if (history.length > 0) {
        set({ lastClaimedAt: history[0].claimedAt });
      }
    } catch (error) {
      console.error('Failed to load claim history:', error);
    }
  },

  // 이자 수령 (TOOK)
  claim: async (userId: string) => {
    const { dailyInterest } = get();
    if (dailyInterest <= 0) return;

    set({ isLoading: true, error: null });
    try {
      await claimInterest(userId, dailyInterest);
      set({ lastClaimedAt: new Date() });

      // 자산 및 내역 새로고침
      await get().loadAssets(userId);
      await get().loadClaimHistory(userId);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '이자 수령에 실패했습니다.';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // 리셋
  reset: () =>
    set({
      assets: [],
      totalBalance: 0,
      dailyInterest: 0,
      claimHistory: [],
      isLoading: false,
      error: null,
      lastClaimedAt: null,
    }),
}));
