import AsyncStorage from '@react-native-async-storage/async-storage';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

const WALLET_PRIVATE_KEY = 'TOOK_WALLET_PRIVATE_KEY';
const WALLET_ADDRESS_KEY = 'TOOK_WALLET_ADDRESS';

export interface WalletInfo {
  address: string;
  privateKey: string;
}

/**
 * 새 지갑 생성
 * - viem을 사용하여 랜덤 프라이빗 키 생성
 * - AsyncStorage에 저장
 * - 프로덕션에서는 expo-secure-store 사용 권장
 */
export const createWallet = async (): Promise<WalletInfo> => {
  // 랜덤 프라이빗 키 생성
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);

  // AsyncStorage에 저장
  await AsyncStorage.setItem(WALLET_PRIVATE_KEY, privateKey);
  await AsyncStorage.setItem(WALLET_ADDRESS_KEY, account.address);

  return {
    address: account.address,
    privateKey,
  };
};

/**
 * 저장된 지갑 불러오기
 */
export const getStoredWallet = async (): Promise<WalletInfo | null> => {
  const privateKey = await AsyncStorage.getItem(WALLET_PRIVATE_KEY);
  const address = await AsyncStorage.getItem(WALLET_ADDRESS_KEY);

  if (privateKey && address) {
    return { address, privateKey };
  }

  return null;
};

/**
 * 지갑 주소만 불러오기
 */
export const getStoredWalletAddress = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(WALLET_ADDRESS_KEY);
};

/**
 * 지갑 삭제
 */
export const deleteWallet = async (): Promise<void> => {
  await AsyncStorage.removeItem(WALLET_PRIVATE_KEY);
  await AsyncStorage.removeItem(WALLET_ADDRESS_KEY);
};

/**
 * 지갑 존재 여부 확인
 */
export const hasStoredWallet = async (): Promise<boolean> => {
  const address = await AsyncStorage.getItem(WALLET_ADDRESS_KEY);
  return !!address;
};
