import { create } from 'zustand';
import {
  getProducts,
  getProductById,
  getRecommendedProducts,
  createDeposit,
  getUserDeposits,
  toggleFavoriteProduct,
  getFavoriteProducts,
} from '../services';
import type { Product, Deposit } from '../services';

type SortBy = 'latest' | 'apy' | 'popular';

interface ProductState {
  // 상태
  products: Product[];
  recommendedProducts: Product[];
  selectedProduct: Product | null;
  favoriteIds: string[];
  userDeposits: Deposit[];
  sortBy: SortBy;
  isLoading: boolean;
  error: string | null;

  // 액션
  loadProducts: (sortBy?: SortBy) => Promise<void>;
  loadRecommendedProducts: (userId: string) => Promise<void>;
  selectProduct: (productId: string) => Promise<void>;
  clearSelectedProduct: () => void;
  loadFavorites: (userId: string) => Promise<void>;
  toggleFavorite: (userId: string, productId: string) => Promise<void>;
  deposit: (userId: string, productId: string, amount: number) => Promise<Deposit>;
  loadUserDeposits: (userId: string) => Promise<void>;
  setSortBy: (sortBy: SortBy) => void;
  reset: () => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  // 초기 상태
  products: [],
  recommendedProducts: [],
  selectedProduct: null,
  favoriteIds: [],
  userDeposits: [],
  sortBy: 'latest',
  isLoading: false,
  error: null,

  // 상품 목록 로드
  loadProducts: async (sortBy?: SortBy) => {
    const sort = sortBy || get().sortBy;
    set({ isLoading: true, error: null, sortBy: sort });
    try {
      const products = await getProducts(sort);
      set({ products });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '상품 로드에 실패했습니다.';
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },

  // 추천 상품 로드
  loadRecommendedProducts: async (userId: string) => {
    try {
      const products = await getRecommendedProducts(userId);
      set({ recommendedProducts: products });
    } catch (error) {
      console.error('Failed to load recommended products:', error);
    }
  },

  // 상품 선택
  selectProduct: async (productId: string) => {
    set({ isLoading: true, error: null });
    try {
      const product = await getProductById(productId);
      set({ selectedProduct: product });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '상품 정보를 불러올 수 없습니다.';
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },

  // 상품 선택 해제
  clearSelectedProduct: () => set({ selectedProduct: null }),

  // 즐겨찾기 로드
  loadFavorites: async (userId: string) => {
    try {
      const favoriteIds = await getFavoriteProducts(userId);
      set({ favoriteIds });
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  },

  // 즐겨찾기 토글
  toggleFavorite: async (userId: string, productId: string) => {
    try {
      const isFavorite = await toggleFavoriteProduct(userId, productId);
      const { favoriteIds } = get();

      if (isFavorite) {
        set({ favoriteIds: [...favoriteIds, productId] });
      } else {
        set({ favoriteIds: favoriteIds.filter((id) => id !== productId) });
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  },

  // 예치 실행
  deposit: async (userId: string, productId: string, amount: number) => {
    set({ isLoading: true, error: null });
    try {
      const deposit = await createDeposit(userId, productId, amount);
      // 예치 내역 새로고침
      await get().loadUserDeposits(userId);
      return deposit;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '예치에 실패했습니다.';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // 사용자 예치 내역 로드
  loadUserDeposits: async (userId: string) => {
    try {
      const deposits = await getUserDeposits(userId);
      set({ userDeposits: deposits });
    } catch (error) {
      console.error('Failed to load user deposits:', error);
    }
  },

  // 정렬 방식 변경
  setSortBy: (sortBy: SortBy) => {
    set({ sortBy });
    get().loadProducts(sortBy);
  },

  // 리셋
  reset: () =>
    set({
      products: [],
      recommendedProducts: [],
      selectedProduct: null,
      favoriteIds: [],
      userDeposits: [],
      sortBy: 'latest',
      isLoading: false,
      error: null,
    }),
}));
