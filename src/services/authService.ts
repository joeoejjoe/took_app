import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  User,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  walletAddress?: string;
  kycStatus: 'none' | 'pending' | 'verified' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

// 이메일로 회원가입
export const signUpWithEmail = async (email: string, password: string): Promise<User> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Firestore에 사용자 프로필 생성
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    kycStatus: 'none',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // 이메일 인증 발송
  await sendEmailVerification(user);

  return user;
};

// 이메일로 로그인
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

// 로그아웃
export const logOut = async (): Promise<void> => {
  await signOut(auth);
};

// 사용자 프로필 조회
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

// 사용자 프로필 업데이트
export const updateUserProfile = async (
  uid: string,
  data: Partial<UserProfile>
): Promise<void> => {
  const docRef = doc(db, 'users', uid);
  await setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
};

// 지갑 주소 연결
export const connectWallet = async (uid: string, walletAddress: string): Promise<void> => {
  await updateUserProfile(uid, { walletAddress });
};

// 인증 상태 리스너
export const subscribeToAuthState = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// 현재 사용자 가져오기
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};
