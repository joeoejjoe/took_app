import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// 출금 요청 타입
export interface WithdrawRequest {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  recipientName: string;
  bankName: string;
  accountNumber: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fee: number;
  createdAt: Date;
  completedAt?: Date;
  txHash?: string;
}

// 수신자 타입
export interface Recipient {
  id: string;
  userId: string;
  name: string;
  bankName: string;
  accountNumber: string;
  isFavorite: boolean;
  lastUsedAt?: Date;
}

// 출금 요청 생성
export const createWithdrawRequest = async (
  userId: string,
  amount: number,
  currency: string,
  recipientName: string,
  bankName: string,
  accountNumber: string
): Promise<WithdrawRequest> => {
  // 수수료 계산 (0.1% 또는 최소 1 USD)
  const fee = Math.max(amount * 0.001, 1);

  const withdrawRef = doc(collection(db, 'withdrawals'));
  const withdraw: Omit<WithdrawRequest, 'id' | 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> } = {
    userId,
    amount,
    currency,
    recipientName,
    bankName,
    accountNumber,
    status: 'pending',
    fee,
    createdAt: serverTimestamp(),
  };

  await setDoc(withdrawRef, withdraw);

  // 사용자 자산에서 차감
  const assetsQuery = query(
    collection(db, 'assets'),
    where('userId', '==', userId),
    where('symbol', '==', 'USD+')
  );
  const assetsSnapshot = await getDocs(assetsQuery);

  if (!assetsSnapshot.empty) {
    const assetDoc = assetsSnapshot.docs[0];
    await updateDoc(assetDoc.ref, {
      balance: increment(-(amount + fee)),
      updatedAt: serverTimestamp(),
    });
  }

  return {
    id: withdrawRef.id,
    ...withdraw,
    createdAt: new Date(),
  } as WithdrawRequest;
};

// 출금 상태 업데이트
export const updateWithdrawStatus = async (
  withdrawId: string,
  status: WithdrawRequest['status'],
  txHash?: string
): Promise<void> => {
  const withdrawRef = doc(db, 'withdrawals', withdrawId);
  const updateData: Record<string, unknown> = { status };

  if (status === 'completed') {
    updateData.completedAt = serverTimestamp();
    if (txHash) updateData.txHash = txHash;
  }

  await updateDoc(withdrawRef, updateData);
};

// 출금 내역 조회
export const getWithdrawHistory = async (userId: string): Promise<WithdrawRequest[]> => {
  const q = query(
    collection(db, 'withdrawals'),
    where('userId', '==', userId)
  );
  const querySnapshot = await getDocs(q);
  return (querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : undefined,
    };
  }) as WithdrawRequest[])
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

// 수신자 목록 조회
export const getRecipients = async (userId: string): Promise<Recipient[]> => {
  const q = query(
    collection(db, 'recipients'),
    where('userId', '==', userId)
  );
  const querySnapshot = await getDocs(q);
  return (querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      lastUsedAt: data.lastUsedAt ? (data.lastUsedAt as Timestamp).toDate() : undefined,
    };
  }) as Recipient[])
    .sort((a, b) => (b.lastUsedAt?.getTime() ?? 0) - (a.lastUsedAt?.getTime() ?? 0));
};

// 즐겨찾기 수신자 조회
export const getFavoriteRecipients = async (userId: string): Promise<Recipient[]> => {
  const q = query(
    collection(db, 'recipients'),
    where('userId', '==', userId),
    where('isFavorite', '==', true)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Recipient[];
};

// 수신자 추가
export const addRecipient = async (
  userId: string,
  name: string,
  bankName: string,
  accountNumber: string,
  isFavorite: boolean = false
): Promise<Recipient> => {
  const recipientRef = doc(collection(db, 'recipients'));
  const recipient = {
    userId,
    name,
    bankName,
    accountNumber,
    isFavorite,
    lastUsedAt: serverTimestamp(),
  };

  await setDoc(recipientRef, recipient);

  return {
    id: recipientRef.id,
    ...recipient,
    lastUsedAt: new Date(),
  } as Recipient;
};

// 수신자 즐겨찾기 토글
export const toggleRecipientFavorite = async (recipientId: string): Promise<boolean> => {
  const recipientRef = doc(db, 'recipients', recipientId);
  const recipientSnap = await getDoc(recipientRef);

  if (recipientSnap.exists()) {
    const isFavorite = !recipientSnap.data().isFavorite;
    await updateDoc(recipientRef, { isFavorite });
    return isFavorite;
  }
  return false;
};

// 수신자 사용 기록 업데이트
export const updateRecipientLastUsed = async (recipientId: string): Promise<void> => {
  const recipientRef = doc(db, 'recipients', recipientId);
  await updateDoc(recipientRef, { lastUsedAt: serverTimestamp() });
};
