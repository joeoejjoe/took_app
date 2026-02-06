import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  limit,
  serverTimestamp,
  Timestamp,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// 환전 거래 타입
export interface ExchangeTransaction {
  id: string;
  userId: string;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  exchangeRate: number;
  fee: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

// 환율 정보 타입
export interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  change24h: number;
  updatedAt: Date;
}

// 환율 히스토리 타입
export interface RateHistory {
  date: Date;
  rate: number;
}

// 현재 환율 조회
export const getExchangeRate = async (
  fromCurrency: string,
  toCurrency: string
): Promise<ExchangeRate | null> => {
  const q = query(
    collection(db, 'exchangeRates'),
    where('fromCurrency', '==', fromCurrency),
    where('toCurrency', '==', toCurrency),
    limit(1)
  );
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    } as ExchangeRate;
  }

  // 기본 환율 반환 (실제로는 외부 API에서 가져와야 함)
  return {
    id: 'default',
    fromCurrency,
    toCurrency,
    rate: fromCurrency === 'USD' && toCurrency === 'KRW' ? 1320.5 : 1,
    change24h: 0.5,
    updatedAt: new Date(),
  };
};

// 환율 히스토리 조회 (차트용)
export const getExchangeRateHistory = async (
  fromCurrency: string,
  toCurrency: string,
  days: number = 30
): Promise<RateHistory[]> => {
  const q = query(
    collection(db, 'exchangeRateHistory'),
    where('fromCurrency', '==', fromCurrency),
    where('toCurrency', '==', toCurrency)
  );
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        date: (data.date as Timestamp)?.toDate() || new Date(),
        rate: data.rate,
      };
    })
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, days)
      .reverse();
  }

  // Mock 데이터 반환 (실제로는 외부 API에서 가져와야 함)
  return generateMockRateHistory(fromCurrency, toCurrency, days);
};

// Mock 환율 히스토리 생성
const generateMockRateHistory = (
  fromCurrency: string,
  toCurrency: string,
  days: number
): RateHistory[] => {
  const baseRate = fromCurrency === 'USD' && toCurrency === 'KRW' ? 1320 : 1;
  const history: RateHistory[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    // 랜덤 변동 추가
    const variation = (Math.random() - 0.5) * 20;
    history.push({
      date,
      rate: baseRate + variation,
    });
  }

  return history;
};

// 환전 실행
export const executeExchange = async (
  userId: string,
  fromCurrency: string,
  toCurrency: string,
  fromAmount: number
): Promise<ExchangeTransaction> => {
  // 현재 환율 조회
  const rateInfo = await getExchangeRate(fromCurrency, toCurrency);
  if (!rateInfo) throw new Error('환율 정보를 가져올 수 없습니다.');

  // 수수료 계산 (0.3%)
  const fee = fromAmount * 0.003;
  const netAmount = fromAmount - fee;
  const toAmount = netAmount * rateInfo.rate;

  // 거래 기록 생성
  const txRef = doc(collection(db, 'exchangeTransactions'));
  const transaction: Omit<ExchangeTransaction, 'id' | 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> } = {
    userId,
    fromCurrency,
    toCurrency,
    fromAmount,
    toAmount,
    exchangeRate: rateInfo.rate,
    fee,
    status: 'completed',
    createdAt: serverTimestamp(),
  };

  await setDoc(txRef, transaction);

  // 자산 업데이트 (from 자산 차감, to 자산 증가)
  // USD -> KRW의 경우 USD+ 자산에서 차감
  if (fromCurrency === 'USD') {
    const assetsQuery = query(
      collection(db, 'assets'),
      where('userId', '==', userId),
      where('symbol', '==', 'USD+')
    );
    const assetsSnapshot = await getDocs(assetsQuery);

    if (!assetsSnapshot.empty) {
      const assetDoc = assetsSnapshot.docs[0];
      await updateDoc(assetDoc.ref, {
        balance: increment(-fromAmount),
        updatedAt: serverTimestamp(),
      });
    }
  }

  return {
    id: txRef.id,
    ...transaction,
    createdAt: new Date(),
  } as ExchangeTransaction;
};

// 환전 내역 조회
export const getExchangeHistory = async (userId: string): Promise<ExchangeTransaction[]> => {
  const q = query(
    collection(db, 'exchangeTransactions'),
    where('userId', '==', userId)
  );
  const querySnapshot = await getDocs(q);
  return (querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    };
  }) as ExchangeTransaction[])
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

// 지원 통화 목록
export const getSupportedCurrencies = (): string[] => {
  return ['USD', 'KRW', 'USDT', 'USDC'];
};

// 환율 업데이트 (관리자용 또는 cron job)
export const updateExchangeRate = async (
  fromCurrency: string,
  toCurrency: string,
  rate: number,
  change24h: number
): Promise<void> => {
  const q = query(
    collection(db, 'exchangeRates'),
    where('fromCurrency', '==', fromCurrency),
    where('toCurrency', '==', toCurrency)
  );
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const docRef = querySnapshot.docs[0].ref;
    await updateDoc(docRef, {
      rate,
      change24h,
      updatedAt: serverTimestamp(),
    });
  } else {
    const rateRef = doc(collection(db, 'exchangeRates'));
    await setDoc(rateRef, {
      fromCurrency,
      toCurrency,
      rate,
      change24h,
      updatedAt: serverTimestamp(),
    });
  }

  // 히스토리 추가
  const historyRef = doc(collection(db, 'exchangeRateHistory'));
  await setDoc(historyRef, {
    fromCurrency,
    toCurrency,
    rate,
    date: serverTimestamp(),
  });
};
