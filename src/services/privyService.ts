import * as SecureStore from 'expo-secure-store';

const WALLET_ADDRESS_KEY = 'took_wallet_address';
const PRIVY_USER_KEY = 'took_privy_user';

export interface PrivyWallet {
  address: string;
  chainId?: number;
}

export interface PrivyUserInfo {
  id: string;
  email?: string;
  wallet?: PrivyWallet;
  createdAt?: Date;
}

/**
 * Privy에서 가져온 지갑 주소 저장
 */
export const savePrivyWallet = async (address: string): Promise<void> => {
  await SecureStore.setItemAsync(WALLET_ADDRESS_KEY, address);
};

/**
 * 저장된 지갑 주소 가져오기
 */
export const getStoredWalletAddress = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(WALLET_ADDRESS_KEY);
};

/**
 * 지갑 주소 삭제 (로그아웃 시)
 */
export const clearWalletAddress = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(WALLET_ADDRESS_KEY);
};

/**
 * Privy 유저 정보 저장
 */
export const savePrivyUser = async (user: PrivyUserInfo): Promise<void> => {
  await SecureStore.setItemAsync(PRIVY_USER_KEY, JSON.stringify(user));
};

/**
 * 저장된 Privy 유저 정보 가져오기
 */
export const getStoredPrivyUser = async (): Promise<PrivyUserInfo | null> => {
  const data = await SecureStore.getItemAsync(PRIVY_USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

/**
 * Privy 유저 정보 삭제
 */
export const clearPrivyUser = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(PRIVY_USER_KEY);
  await SecureStore.deleteItemAsync(WALLET_ADDRESS_KEY);
};
