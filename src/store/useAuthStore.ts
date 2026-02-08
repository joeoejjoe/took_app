import { create } from 'zustand';
import { User } from 'firebase/auth';
import {
  signUpWithEmail,
  signInWithEmail,
  logOut,
  getUserProfile,
  updateUserProfile,
  subscribeToAuthState,
  initializeUserAssets,
  getStoredWallet,
  connectWallet,
  deleteWallet,
  clearPrivyUser,
  getStoredWalletAddress,
} from '../services';
import type { UserProfile } from '../services';

type AppScreen = 'onboarding' | 'auth' | 'main';

interface AuthState {
  // UI 상태
  currentScreen: AppScreen;
  isLoading: boolean;
  error: string | null;

  // 인증 상태
  user: User | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  walletAddress: string | null;

  // 액션
  goToAuth: () => void;
  goToMain: () => void;
  goToOnboarding: () => void;
  setError: (error: string | null) => void;
  setWalletAddress: (address: string | null) => void;

  // Firebase 인증 액션
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initializeAuth: () => () => void;
  loadUserProfile: () => Promise<void>;
  updateNickname: (nickname: string) => Promise<void>;

  reset: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // 초기 상태
  currentScreen: 'onboarding',
  isLoading: false,
  error: null,
  user: null,
  userProfile: null,
  isAuthenticated: false,
  walletAddress: null,

  // UI 액션
  goToAuth: () => set({ currentScreen: 'auth' }),
  goToMain: () => set({ currentScreen: 'main' }),
  goToOnboarding: () => set({ currentScreen: 'onboarding' }),
  setError: (error) => set({ error }),
  setWalletAddress: (address) => set({ walletAddress: address }),

  // 회원가입
  signUp: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await signUpWithEmail(email, password);
      // 초기 자산 생성
      await initializeUserAssets(user.uid);
      // currentScreen은 변경하지 않음 - AuthNavigator에서 지갑 연결 후 이동
      set({ user, isAuthenticated: true });
      await get().loadUserProfile();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '회원가입에 실패했습니다.';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // 로그인
  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await signInWithEmail(email, password);
      set({ user, isAuthenticated: true });

      // 프로필 로드 및 지갑 주소 확인
      const profile = await getUserProfile(user.uid);
      set({ userProfile: profile });

      // 기존 지갑 주소가 있으면 설정
      if (profile?.walletAddress) {
        set({ walletAddress: profile.walletAddress });
      } else {
        // Privy 지갑 확인
        const privyWalletAddress = await getStoredWalletAddress();
        if (privyWalletAddress) {
          try {
            await connectWallet(user.uid, privyWalletAddress);
          } catch (e) {
            console.log('Failed to sync Privy wallet to Firebase');
          }
          set({ walletAddress: privyWalletAddress });
        } else {
          // 레거시 로컬 지갑 확인
          const storedWallet = await getStoredWallet();
          if (storedWallet) {
            try {
              await connectWallet(user.uid, storedWallet.address);
            } catch (e) {
              console.log('Failed to sync wallet to Firebase');
            }
            set({ walletAddress: storedWallet.address });
          }
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '로그인에 실패했습니다.';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // 로그아웃
  signOut: async () => {
    set({ isLoading: true });
    try {
      // Privy 로컬 데이터 삭제
      try {
        await clearPrivyUser();
      } catch (e) {
        console.log('Privy data clear skipped');
      }

      // 로컬 지갑 데이터 삭제 (다른 유저 로그인 시 혼동 방지)
      try {
        await deleteWallet();
      } catch (e) {
        console.log('Local wallet delete skipped');
      }

      await logOut();
      set({
        user: null,
        userProfile: null,
        isAuthenticated: false,
        walletAddress: null,
        currentScreen: 'onboarding',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '로그아웃에 실패했습니다.';
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },

  // 인증 상태 초기화 (앱 시작 시 호출)
  initializeAuth: () => {
    const unsubscribe = subscribeToAuthState(async (user) => {
      if (user) {
        set({ user, isAuthenticated: true });
        // 프로필 로드 후 지갑 주소 유무에 따라 화면 결정
        try {
          const profile = await getUserProfile(user.uid);
          set({ userProfile: profile });

          // 1. Firebase 프로필에 지갑 주소가 있으면 사용
          if (profile?.walletAddress) {
            set({ walletAddress: profile.walletAddress, currentScreen: 'main' });
            return;
          }

          // 2. Privy에서 저장된 지갑 주소 확인
          const privyWalletAddress = await getStoredWalletAddress();
          if (privyWalletAddress) {
            try {
              await connectWallet(user.uid, privyWalletAddress);
            } catch (e) {
              console.log('Failed to sync Privy wallet to Firebase');
            }
            set({ walletAddress: privyWalletAddress, currentScreen: 'main' });
            return;
          }

          // 3. 레거시 로컬 지갑 확인 & Firebase에 동기화
          const storedWallet = await getStoredWallet();
          if (storedWallet) {
            try {
              await connectWallet(user.uid, storedWallet.address);
            } catch (e) {
              console.log('Failed to sync wallet to Firebase');
            }
            set({ walletAddress: storedWallet.address, currentScreen: 'main' });
            return;
          }

          // 4. 지갑이 없으면 지갑 연결 화면으로
          set({ currentScreen: 'auth' });
        } catch (error) {
          console.error('Failed to load user profile:', error);
          set({ currentScreen: 'auth' });
        }
      } else {
        set({ user: null, userProfile: null, isAuthenticated: false });
      }
    });
    return unsubscribe;
  },

  // 사용자 프로필 로드
  loadUserProfile: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const profile = await getUserProfile(user.uid);
      set({ userProfile: profile });
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  },

  // 닉네임 업데이트
  updateNickname: async (nickname: string) => {
    const { user, userProfile } = get();
    if (!user) throw new Error('로그인이 필요합니다.');

    await updateUserProfile(user.uid, { displayName: nickname });
    set({
      userProfile: userProfile
        ? { ...userProfile, displayName: nickname }
        : null,
    });
  },

  // 리셋
  reset: () =>
    set({
      currentScreen: 'onboarding',
      isLoading: false,
      error: null,
      user: null,
      userProfile: null,
      isAuthenticated: false,
      walletAddress: null,
    }),
}));
