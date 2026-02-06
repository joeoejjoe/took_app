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
