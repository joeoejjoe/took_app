import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// 자산 타입
export interface Asset {
  id: string;
  userId: string;
  symbol: string;
  balance: number;
  currency: string;
  yieldRate: number;
  estimatedYield: number;
  iconColor: string;
  updatedAt: Date;
}

// 이자 수령 기록
export interface InterestClaim {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  claimedAt: Date;
}

// 사용자 자산 목록 조회
export const getUserAssets = async (userId: string): Promise<Asset[]> => {
  const q = query(
    collection(db, 'assets'),
    where('userId', '==', userId)
  );
  const querySnapshot = await getDocs(q);
  const assets = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Asset[];
  return assets.sort((a, b) => b.balance - a.balance);
};

// 자산 실시간 구독
export const subscribeToUserAssets = (
  userId: string,
  callback: (assets: Asset[]) => void
) => {
  const q = query(
    collection(db, 'assets'),
    where('userId', '==', userId)
  );
  return onSnapshot(q, (querySnapshot) => {
    const assets = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Asset[];
    callback(assets.sort((a, b) => b.balance - a.balance));
  });
};

// 총 자산 조회
export const getTotalBalance = async (userId: string): Promise<number> => {
  const assets = await getUserAssets(userId);
  return assets.reduce((sum, asset) => sum + asset.balance, 0);
};

// 일일 이자 조회
export const getDailyInterest = async (userId: string): Promise<number> => {
  const assets = await getUserAssets(userId);
  return assets.reduce((sum, asset) => {
    const dailyRate = asset.yieldRate / 365 / 100;
    return sum + asset.balance * dailyRate;
  }, 0);
};

// 이자 수령 (TOOK)
export const claimInterest = async (
  userId: string,
  amount: number,
  currency: string = 'USD'
): Promise<InterestClaim> => {
  // 이자 수령 기록 생성
  const claimRef = doc(collection(db, 'interestClaims'));
  const claim: Omit<InterestClaim, 'id' | 'claimedAt'> & { claimedAt: ReturnType<typeof serverTimestamp> } = {
    userId,
    amount,
    currency,
    claimedAt: serverTimestamp(),
  };
  await setDoc(claimRef, claim);

  // 기본 자산(USD+)에 이자 추가
  const assetsQuery = query(
    collection(db, 'assets'),
    where('userId', '==', userId),
    where('symbol', '==', 'USD+')
  );
  const assetsSnapshot = await getDocs(assetsQuery);

  if (!assetsSnapshot.empty) {
    const assetDoc = assetsSnapshot.docs[0];
    await updateDoc(assetDoc.ref, {
      balance: increment(amount),
      updatedAt: serverTimestamp(),
    });
  }

  return {
    id: claimRef.id,
    userId,
    amount,
    currency,
    claimedAt: new Date(),
  };
};

// 이자 수령 내역 조회
export const getInterestClaimHistory = async (userId: string): Promise<InterestClaim[]> => {
  const q = query(
    collection(db, 'interestClaims'),
    where('userId', '==', userId)
  );
  const querySnapshot = await getDocs(q);
  const claims = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      claimedAt: data.claimedAt ? (data.claimedAt as Timestamp).toDate() : new Date(),
    };
  }) as InterestClaim[];
  return claims.sort((a, b) => b.claimedAt.getTime() - a.claimedAt.getTime());
};

// 초기 자산 생성 (새 사용자용)
export const initializeUserAssets = async (userId: string): Promise<void> => {
  const defaultAssets = [
    { symbol: 'USD+', balance: 0, currency: 'USD', yieldRate: 5.2, iconColor: '#4ADE80' },
    { symbol: 'USDT', balance: 0, currency: 'USD', yieldRate: 4.8, iconColor: '#26A17B' },
    { symbol: 'USDC', balance: 0, currency: 'USD', yieldRate: 4.5, iconColor: '#2775CA' },
  ];

  for (const asset of defaultAssets) {
    const assetRef = doc(collection(db, 'assets'));
    await setDoc(assetRef, {
      ...asset,
      userId,
      estimatedYield: 0,
      updatedAt: serverTimestamp(),
    });
  }
};
