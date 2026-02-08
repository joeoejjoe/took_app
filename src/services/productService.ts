import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  limit,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// 상품 타입
export interface Product {
  id: string;
  name: string;
  description: string;
  apy: number;
  minDeposit: number;
  maxDeposit: number;
  totalDeposited: number;
  lockPeriod: 'flexible' | '30days' | '90days' | '180days';
  riskLevel: 'low' | 'medium' | 'high';
  category: string;
  isActive: boolean;
  createdAt: Date;
}

// 예치 기록
export interface Deposit {
  id: string;
  userId: string;
  productId: string;
  amount: number;
  currency: string;
  apy: number;
  status: 'pending' | 'active' | 'completed' | 'withdrawn';
  depositedAt: Date;
  maturityDate?: Date;
  txHash?: string;
}

// 상품 목록 조회
export const getProducts = async (
  sortBy: 'latest' | 'apy' | 'popular' = 'latest'
): Promise<Product[]> => {
  const q = query(
    collection(db, 'products'),
    where('isActive', '==', true)
  );

  const querySnapshot = await getDocs(q);
  const products = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    };
  }) as Product[];

  switch (sortBy) {
    case 'apy':
      return products.sort((a, b) => b.apy - a.apy);
    case 'popular':
      return products.sort((a, b) => b.totalDeposited - a.totalDeposited);
    default:
      return products.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
};

// 상품 상세 조회
export const getProductById = async (productId: string): Promise<Product | null> => {
  const docRef = doc(db, 'products', productId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    } as Product;
  }
  return null;
};

// 추천 상품 조회
export const getRecommendedProducts = async (userId: string): Promise<Product[]> => {
  // 간단한 추천 로직: 높은 APY + 낮은 리스크
  const q = query(
    collection(db, 'products'),
    where('isActive', '==', true),
    where('riskLevel', '==', 'low')
  );
  const querySnapshot = await getDocs(q);
  return (querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    };
  }) as Product[])
    .sort((a, b) => b.apy - a.apy)
    .slice(0, 3);
};

// 예치 실행
export const createDeposit = async (
  userId: string,
  productId: string,
  amount: number,
  currency: string = 'USD'
): Promise<Deposit> => {
  const product = await getProductById(productId);
  if (!product) throw new Error('상품을 찾을 수 없습니다.');

  // 예치 기록 생성
  const depositRef = doc(collection(db, 'deposits'));
  const now = new Date();
  let maturityDate: Date | undefined;

  // 락업 기간에 따른 만기일 계산
  if (product.lockPeriod !== 'flexible') {
    const days = parseInt(product.lockPeriod);
    maturityDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  }

  const deposit: Omit<Deposit, 'id' | 'depositedAt'> & { depositedAt: ReturnType<typeof serverTimestamp> } = {
    userId,
    productId,
    amount,
    currency,
    apy: product.apy,
    status: 'active',
    depositedAt: serverTimestamp(),
    maturityDate,
  };

  await setDoc(depositRef, deposit);

  // 상품의 총 예치량 업데이트
  const productRef = doc(db, 'products', productId);
  await updateDoc(productRef, {
    totalDeposited: product.totalDeposited + amount,
  });

  return {
    id: depositRef.id,
    ...deposit,
    depositedAt: now,
  } as Deposit;
};

// 사용자 예치 내역 조회
export const getUserDeposits = async (userId: string): Promise<Deposit[]> => {
  const q = query(
    collection(db, 'deposits'),
    where('userId', '==', userId)
  );
  const querySnapshot = await getDocs(q);
  return (querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      depositedAt: (data.depositedAt as Timestamp)?.toDate() || new Date(),
      maturityDate: data.maturityDate ? (data.maturityDate as Timestamp).toDate() : undefined,
    };
  }) as Deposit[])
    .sort((a, b) => b.depositedAt.getTime() - a.depositedAt.getTime());
};

// 즐겨찾기 추가/제거
export const toggleFavoriteProduct = async (
  userId: string,
  productId: string
): Promise<boolean> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const favorites = userSnap.data().favoriteProducts || [];
    const isFavorite = favorites.includes(productId);

    await updateDoc(userRef, {
      favoriteProducts: isFavorite ? arrayRemove(productId) : arrayUnion(productId),
    });

    return !isFavorite;
  }
  return false;
};

// 즐겨찾기 상품 조회
export const getFavoriteProducts = async (userId: string): Promise<string[]> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data().favoriteProducts || [];
  }
  return [];
};

// ============================================
// 블록체인 상품 예치 기록 (플랫폼 통계용)
// ============================================

export interface BlockchainDeposit {
  id: string;
  userId: string;
  walletAddress: string;
  productId: string;  // 'mhyper', 'sgho' 등
  amount: number;
  currency: string;   // 'USDC'
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed' | 'withdrawn';
  depositedAt: Date;
  withdrawnAt?: Date;
  withdrawTxHash?: string;
}

/**
 * 블록체인 예치 기록 저장
 */
export const recordBlockchainDeposit = async (
  userId: string,
  walletAddress: string,
  productId: string,
  amount: number,
  currency: string,
  txHash: string
): Promise<BlockchainDeposit> => {
  const depositRef = doc(collection(db, 'blockchain_deposits'));
  const now = new Date();

  const deposit = {
    userId,
    walletAddress,
    productId,
    amount,
    currency,
    txHash,
    status: 'confirmed' as const,
    depositedAt: serverTimestamp(),
  };

  await setDoc(depositRef, deposit);

  // 플랫폼 전체 통계 업데이트
  const statsRef = doc(db, 'platform_stats', productId);
  const statsSnap = await getDoc(statsRef);

  if (statsSnap.exists()) {
    const currentTotal = statsSnap.data().totalDeposited || 0;
    const depositCount = statsSnap.data().depositCount || 0;
    await updateDoc(statsRef, {
      totalDeposited: currentTotal + amount,
      depositCount: depositCount + 1,
      lastUpdated: serverTimestamp(),
    });
  } else {
    await setDoc(statsRef, {
      productId,
      totalDeposited: amount,
      depositCount: 1,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
    });
  }

  return {
    id: depositRef.id,
    userId,
    walletAddress,
    productId,
    amount,
    currency,
    txHash,
    status: 'confirmed',
    depositedAt: now,
  };
};

/**
 * 플랫폼 전체 예치 통계 조회 (상품별)
 */
export const getPlatformStats = async (productId: string): Promise<{
  totalDeposited: number;
  depositCount: number;
} | null> => {
  try {
    const statsRef = doc(db, 'platform_stats', productId);
    const statsSnap = await getDoc(statsRef);

    if (statsSnap.exists()) {
      return {
        totalDeposited: statsSnap.data().totalDeposited || 0,
        depositCount: statsSnap.data().depositCount || 0,
      };
    }
    return { totalDeposited: 0, depositCount: 0 };
  } catch (error) {
    return null;
  }
};

/**
 * 모든 블록체인 상품의 플랫폼 통계 조회
 */
export const getAllPlatformStats = async (): Promise<Record<string, {
  totalDeposited: number;
  depositCount: number;
}>> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'platform_stats'));
    const stats: Record<string, { totalDeposited: number; depositCount: number }> = {};

    querySnapshot.docs.forEach((doc) => {
      const data = doc.data();
      stats[doc.id] = {
        totalDeposited: data.totalDeposited || 0,
        depositCount: data.depositCount || 0,
      };
    });

    return stats;
  } catch (error) {
    return {};
  }
};

/**
 * 사용자의 블록체인 예치 내역 조회
 * @param userIdOrWallet - userId 또는 walletAddress (둘 다 지원)
 */
export const getUserBlockchainDeposits = async (userIdOrWallet: string): Promise<BlockchainDeposit[]> => {
  try {
    // userId로 먼저 검색
    const q1 = query(
      collection(db, 'blockchain_deposits'),
      where('userId', '==', userIdOrWallet)
    );
    const snapshot1 = await getDocs(q1);

    // walletAddress로도 검색 (userId와 다를 경우 대비)
    const q2 = query(
      collection(db, 'blockchain_deposits'),
      where('walletAddress', '==', userIdOrWallet)
    );
    const snapshot2 = await getDocs(q2);

    // 중복 제거하며 합치기
    const depositsMap = new Map<string, BlockchainDeposit>();

    [...snapshot1.docs, ...snapshot2.docs].forEach((doc) => {
      if (!depositsMap.has(doc.id)) {
        const data = doc.data();
        depositsMap.set(doc.id, {
          id: doc.id,
          ...data,
          depositedAt: (data.depositedAt as Timestamp)?.toDate() || new Date(),
        } as BlockchainDeposit);
      }
    });

    // 해지된 예치(withdrawn 상태 또는 금액 0) 제외
    return Array.from(depositsMap.values())
      .filter(d => d.status !== 'withdrawn' && d.amount > 0)
      .sort((a, b) => b.depositedAt.getTime() - a.depositedAt.getTime());
  } catch (error) {
    console.error('Failed to get user blockchain deposits:', error);
    return [];
  }
};

/**
 * 블록체인 출금 기록 및 예치 상태 업데이트
 */
export const recordBlockchainWithdrawal = async (
  depositId: string,
  withdrawAmount: number,
  txHash: string
): Promise<void> => {
  try {
    const depositRef = doc(db, 'blockchain_deposits', depositId);
    const depositSnap = await getDoc(depositRef);

    if (!depositSnap.exists()) {
      throw new Error('예치 기록을 찾을 수 없습니다.');
    }

    const depositData = depositSnap.data();
    const currentAmount = depositData.amount || 0;
    const newAmount = currentAmount - withdrawAmount;

    if (newAmount <= 0) {
      // 전액 출금 시 상태를 withdrawn으로 변경
      await updateDoc(depositRef, {
        amount: 0,
        status: 'withdrawn',
        withdrawnAt: serverTimestamp(),
        withdrawTxHash: txHash,
      });
    } else {
      // 부분 출금 시 금액만 업데이트
      await updateDoc(depositRef, {
        amount: newAmount,
        lastWithdrawAt: serverTimestamp(),
        lastWithdrawTxHash: txHash,
      });
    }

    // 플랫폼 통계 업데이트 (예치액 감소)
    const productId = depositData.productId;
    const statsRef = doc(db, 'platform_stats', productId);
    const statsSnap = await getDoc(statsRef);

    if (statsSnap.exists()) {
      const currentTotal = statsSnap.data().totalDeposited || 0;
      await updateDoc(statsRef, {
        totalDeposited: Math.max(0, currentTotal - withdrawAmount),
        lastUpdated: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Failed to record withdrawal:', error);
    throw error;
  }
};

/**
 * 예치 기록 삭제 (전액 출금 시)
 */
export const deleteBlockchainDeposit = async (depositId: string): Promise<void> => {
  try {
    const depositRef = doc(db, 'blockchain_deposits', depositId);
    const depositSnap = await getDoc(depositRef);

    if (depositSnap.exists()) {
      const depositData = depositSnap.data();

      // 플랫폼 통계에서 해당 금액 차감
      const productId = depositData.productId;
      const amount = depositData.amount || 0;

      const statsRef = doc(db, 'platform_stats', productId);
      const statsSnap = await getDoc(statsRef);

      if (statsSnap.exists()) {
        const currentTotal = statsSnap.data().totalDeposited || 0;
        const depositCount = statsSnap.data().depositCount || 0;
        await updateDoc(statsRef, {
          totalDeposited: Math.max(0, currentTotal - amount),
          depositCount: Math.max(0, depositCount - 1),
          lastUpdated: serverTimestamp(),
        });
      }
    }

    // 예치 기록 상태를 withdrawn으로 변경 (삭제 대신)
    await updateDoc(depositRef, {
      status: 'withdrawn',
      withdrawnAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to delete deposit:', error);
    throw error;
  }
};

// 초기 상품 데이터 생성 (관리자용)
export const initializeProducts = async (): Promise<void> => {
  const products = [
    {
      name: 'USDT Flexible',
      description: '언제든지 출금 가능한 유연한 USDT 예치 상품',
      apy: 4.8,
      minDeposit: 10,
      maxDeposit: 100000,
      totalDeposited: 1250000,
      lockPeriod: 'flexible',
      riskLevel: 'low',
      category: 'stablecoin',
      isActive: true,
    },
    {
      name: 'USDC 30일 락업',
      description: '30일 락업으로 더 높은 수익을 제공하는 USDC 상품',
      apy: 5.5,
      minDeposit: 100,
      maxDeposit: 500000,
      totalDeposited: 890000,
      lockPeriod: '30days',
      riskLevel: 'low',
      category: 'stablecoin',
      isActive: true,
    },
    {
      name: 'USD+ High Yield',
      description: '90일 락업으로 최고 수익률을 제공하는 프리미엄 상품',
      apy: 7.2,
      minDeposit: 500,
      maxDeposit: 1000000,
      totalDeposited: 2100000,
      lockPeriod: '90days',
      riskLevel: 'medium',
      category: 'premium',
      isActive: true,
    },
  ];

  for (const product of products) {
    const productRef = doc(collection(db, 'products'));
    await setDoc(productRef, {
      ...product,
      createdAt: serverTimestamp(),
    });
  }
};
