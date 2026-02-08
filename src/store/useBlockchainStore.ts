import { create } from 'zustand';
import { getAllBalances, sendEth, sendToken, waitForTransaction, TOKEN_ADDRESSES } from '../services';
import type { WalletBalances, TokenBalance } from '../services';

// 라이브 모드 - 실제 블록체인 잔액 조회
const TEST_MODE = false;
const MOCK_BALANCES: WalletBalances = {
  eth: '0.05',
  ethFormatted: '0.05 ETH',
  tokens: [
    {
      symbol: 'USDC',
      balance: '10000000000', // 10,000 USDC (6 decimals)
      balanceFormatted: '10000',
      decimals: 6,
      address: TOKEN_ADDRESSES.USDC,
    },
    {
      symbol: 'USDT',
      balance: '5000000000', // 5,000 USDT (6 decimals)
      balanceFormatted: '5000',
      decimals: 6,
      address: TOKEN_ADDRESSES.USDT,
    },
  ],
};

interface BlockchainState {
  // 잔액 상태
  balances: WalletBalances | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // 트랜잭션 상태
  pendingTx: string | null;
  txStatus: 'idle' | 'pending' | 'confirming' | 'success' | 'error';
  txError: string | null;

  // 액션
  fetchBalances: (walletAddress: string) => Promise<void>;
  sendEthTransaction: (toAddress: string, amount: string) => Promise<string>;
  sendTokenTransaction: (
    tokenAddress: string,
    toAddress: string,
    amount: string,
    decimals?: number
  ) => Promise<string>;
  resetTxStatus: () => void;
  reset: () => void;
}

export const useBlockchainStore = create<BlockchainState>((set, get) => ({
  // 초기 상태
  balances: null,
  isLoading: false,
  error: null,
  lastUpdated: null,

  pendingTx: null,
  txStatus: 'idle',
  txError: null,

  // 잔액 조회
  fetchBalances: async (walletAddress: string) => {
    set({ isLoading: true, error: null });
    try {
      // 테스트 모드에서는 목업 데이터 사용
      if (TEST_MODE) {
        // 약간의 딜레이 추가 (실제 API 호출처럼 보이도록)
        await new Promise(resolve => setTimeout(resolve, 500));
        set({
          balances: MOCK_BALANCES,
          isLoading: false,
          lastUpdated: new Date(),
        });
        return;
      }

      const balances = await getAllBalances(walletAddress);
      set({
        balances,
        isLoading: false,
        lastUpdated: new Date(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '잔액 조회 실패';
      // 테스트 모드에서 에러 발생해도 목업 데이터 사용
      if (TEST_MODE) {
        set({
          balances: MOCK_BALANCES,
          isLoading: false,
          lastUpdated: new Date(),
        });
        return;
      }
      set({ error: message, isLoading: false });
    }
  },

  // ETH 전송
  sendEthTransaction: async (toAddress: string, amount: string) => {
    set({ txStatus: 'pending', txError: null, pendingTx: null });
    try {
      const hash = await sendEth(toAddress, amount);
      set({ pendingTx: hash, txStatus: 'confirming' });

      // 트랜잭션 확인 대기
      await waitForTransaction(hash);
      set({ txStatus: 'success' });

      return hash;
    } catch (error) {
      const message = error instanceof Error ? error.message : '전송 실패';
      set({ txStatus: 'error', txError: message });
      throw error;
    }
  },

  // 토큰 전송
  sendTokenTransaction: async (
    tokenAddress: string,
    toAddress: string,
    amount: string,
    decimals: number = 6
  ) => {
    set({ txStatus: 'pending', txError: null, pendingTx: null });
    try {
      const hash = await sendToken(tokenAddress, toAddress, amount, decimals);
      set({ pendingTx: hash, txStatus: 'confirming' });

      // 트랜잭션 확인 대기
      await waitForTransaction(hash);
      set({ txStatus: 'success' });

      return hash;
    } catch (error) {
      const message = error instanceof Error ? error.message : '전송 실패';
      set({ txStatus: 'error', txError: message });
      throw error;
    }
  },

  // 트랜잭션 상태 초기화
  resetTxStatus: () => {
    set({
      pendingTx: null,
      txStatus: 'idle',
      txError: null,
    });
  },

  // 전체 초기화
  reset: () => {
    set({
      balances: null,
      isLoading: false,
      error: null,
      lastUpdated: null,
      pendingTx: null,
      txStatus: 'idle',
      txError: null,
    });
  },
}));
