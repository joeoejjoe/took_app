import * as SecureStore from 'expo-secure-store';

const WALLET_PRIVATE_KEY = 'TOOK_WALLET_PRIVATE_KEY';
const WALLET_ADDRESS_KEY = 'TOOK_WALLET_ADDRESS';

export interface WalletInfo {
  address: string;
  privateKey: string;
}

/**
 * Web3Auth 지갑 저장 (SecureStore 사용)
 * - Web3Auth에서 받은 프라이빗 키와 주소 저장
 * - 같은 이메일로 로그인하면 항상 같은 키 반환 (MPC 기반)
 */
export const saveWeb3AuthWallet = async (privateKey: string, address: string): Promise<WalletInfo> => {
  await SecureStore.setItemAsync(WALLET_PRIVATE_KEY, privateKey);
  await SecureStore.setItemAsync(WALLET_ADDRESS_KEY, address);

  return {
    address,
    privateKey,
  };
};

/**
 * 저장된 지갑 불러오기
 */
export const getStoredWallet = async (): Promise<WalletInfo | null> => {
  const privateKey = await SecureStore.getItemAsync(WALLET_PRIVATE_KEY);
  const address = await SecureStore.getItemAsync(WALLET_ADDRESS_KEY);

  if (privateKey && address) {
    return { address, privateKey };
  }

  return null;
};

/**
 * 지갑 주소만 불러오기
 */
export const getStoredWalletAddress = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(WALLET_ADDRESS_KEY);
};

/**
 * 지갑 삭제 (로그아웃 시 호출)
 */
export const deleteWallet = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(WALLET_PRIVATE_KEY);
  await SecureStore.deleteItemAsync(WALLET_ADDRESS_KEY);
};

/**
 * 지갑 존재 여부 확인
 */
export const hasStoredWallet = async (): Promise<boolean> => {
  const address = await SecureStore.getItemAsync(WALLET_ADDRESS_KEY);
  return !!address;
};
