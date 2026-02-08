import { useState, useCallback } from 'react';
import { usePrivy } from '@privy-io/expo';
import { useSmartWallets } from '@privy-io/expo/smart-wallets';
import { parseUnits, parseEther, encodeFunctionData } from 'viem';
import { mainnet } from 'viem/chains';
import { publicClient, TOKEN_ADDRESSES, waitForTransaction as waitForTxReceipt } from '../services/blockchainService';

// ERC-20 transfer ABI
const ERC20_TRANSFER_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

export type TransactionStatus = 'idle' | 'preparing' | 'signing' | 'pending' | 'confirming' | 'success' | 'error';

interface TransactionResult {
  hash: string;
  status: 'success' | 'reverted';
}

interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  estimatedCostWei: bigint;
  estimatedCostEth: string;
}

interface UsePrivyTransactionReturn {
  // 상태
  status: TransactionStatus;
  txHash: string | null;
  error: string | null;

  // 액션
  sendEth: (toAddress: string, amount: string) => Promise<TransactionResult>;
  sendToken: (
    tokenSymbol: 'USDC' | 'USDT' | 'DAI' | 'GHO',
    toAddress: string,
    amount: string
  ) => Promise<TransactionResult>;
  estimateGas: (
    toAddress: string,
    amount: string,
    tokenSymbol?: 'USDC' | 'USDT' | 'DAI' | 'GHO'
  ) => Promise<GasEstimate | null>;
  reset: () => void;

  // 지갑 상태
  isWalletReady: boolean;
  walletAddress: string | null;
  isSmartWallet: boolean;
}

const TOKEN_DECIMALS: Record<string, number> = {
  USDC: 6,
  USDT: 6,
  DAI: 18,
  GHO: 18,
};

export function usePrivyTransaction(): UsePrivyTransactionReturn {
  const { user } = usePrivy();
  const { client: smartWalletClient } = useSmartWallets();

  const [status, setStatus] = useState<TransactionStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Smart Wallet 주소 가져오기
  const smartWallet = user?.linked_accounts?.find(
    (account) => account.type === 'smart_wallet'
  ) as { type: 'smart_wallet'; address: string } | undefined;

  // Embedded Wallet (EOA) 주소 - fallback용
  const embeddedWallet = user?.linked_accounts?.find(
    (account) => account.type === 'wallet' && (account as any).wallet_client_type === 'privy'
  ) as { type: 'wallet'; address: string } | undefined;

  const walletAddress = smartWallet?.address || embeddedWallet?.address || null;
  const isSmartWallet = !!smartWallet;
  const isWalletReady = !!walletAddress && !!smartWalletClient;

  const reset = useCallback(() => {
    setStatus('idle');
    setTxHash(null);
    setError(null);
  }, []);

  // 가스 추정 (Smart Wallet은 가스비 무료이지만 참고용으로 표시)
  const estimateGas = useCallback(async (
    toAddress: string,
    amount: string,
    tokenSymbol?: 'USDC' | 'USDT' | 'DAI' | 'GHO'
  ): Promise<GasEstimate | null> => {
    if (!walletAddress) return null;

    try {
      let gasLimit: bigint;

      if (tokenSymbol) {
        const tokenAddress = TOKEN_ADDRESSES[tokenSymbol];
        const decimals = TOKEN_DECIMALS[tokenSymbol];
        const amountWei = parseUnits(amount, decimals);

        const data = encodeFunctionData({
          abi: ERC20_TRANSFER_ABI,
          functionName: 'transfer',
          args: [toAddress as `0x${string}`, amountWei],
        });

        gasLimit = await publicClient.estimateGas({
          account: walletAddress as `0x${string}`,
          to: tokenAddress,
          data,
        });
      } else {
        gasLimit = await publicClient.estimateGas({
          account: walletAddress as `0x${string}`,
          to: toAddress as `0x${string}`,
          value: parseEther(amount),
        });
      }

      const feeData = await publicClient.estimateFeesPerGas();
      const gasPrice = await publicClient.getGasPrice();

      const maxFeePerGas = feeData.maxFeePerGas || gasPrice;
      const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || BigInt(0);

      const estimatedCostWei = gasLimit * maxFeePerGas;
      const estimatedCostEth = (Number(estimatedCostWei) / 1e18).toFixed(6);

      return {
        gasLimit,
        gasPrice,
        maxFeePerGas,
        maxPriorityFeePerGas,
        estimatedCostWei,
        estimatedCostEth,
      };
    } catch (err) {
      console.error('Gas estimation failed:', err);
      return null;
    }
  }, [walletAddress]);

  // ETH 전송 (Smart Wallet - Gas Sponsored)
  const sendEth = useCallback(async (
    toAddress: string,
    amount: string
  ): Promise<TransactionResult> => {
    reset();
    setStatus('preparing');

    try {
      if (!smartWalletClient || !walletAddress) {
        throw new Error('Smart Wallet이 연결되지 않았습니다.');
      }

      setStatus('signing');

      // Smart Wallet을 통해 트랜잭션 전송 (Paymaster가 가스비 대납)
      const hash = await smartWalletClient.sendTransaction({
        account: smartWalletClient.account,
        chain: mainnet,
        to: toAddress as `0x${string}`,
        value: parseEther(amount),
        data: '0x',
      });

      setTxHash(hash);
      setStatus('pending');

      setStatus('confirming');
      const receipt = await waitForTxReceipt(hash);

      if (receipt.status === 'success') {
        setStatus('success');
        return { hash, status: 'success' };
      } else {
        throw new Error('트랜잭션이 실패했습니다.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '전송에 실패했습니다.';
      setError(message);
      setStatus('error');
      throw err;
    }
  }, [smartWalletClient, walletAddress, reset]);

  // 토큰 전송 (Smart Wallet - Gas Sponsored)
  const sendToken = useCallback(async (
    tokenSymbol: 'USDC' | 'USDT' | 'DAI' | 'GHO',
    toAddress: string,
    amount: string
  ): Promise<TransactionResult> => {
    reset();
    setStatus('preparing');

    try {
      if (!smartWalletClient || !walletAddress) {
        throw new Error('Smart Wallet이 연결되지 않았습니다.');
      }

      const tokenAddress = TOKEN_ADDRESSES[tokenSymbol];
      const decimals = TOKEN_DECIMALS[tokenSymbol];
      const amountWei = parseUnits(amount, decimals);

      // ERC-20 transfer 데이터 인코딩
      const data = encodeFunctionData({
        abi: ERC20_TRANSFER_ABI,
        functionName: 'transfer',
        args: [toAddress as `0x${string}`, amountWei],
      });

      setStatus('signing');

      // Smart Wallet을 통해 컨트랙트 호출 (Paymaster가 가스비 대납)
      const hash = await smartWalletClient.sendTransaction({
        account: smartWalletClient.account,
        chain: mainnet,
        to: tokenAddress,
        data,
        value: BigInt(0),
      });

      setTxHash(hash);
      setStatus('pending');

      setStatus('confirming');
      const receipt = await waitForTxReceipt(hash);

      if (receipt.status === 'success') {
        setStatus('success');
        return { hash, status: 'success' };
      } else {
        throw new Error('트랜잭션이 실패했습니다.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '전송에 실패했습니다.';
      setError(message);
      setStatus('error');
      throw err;
    }
  }, [smartWalletClient, walletAddress, reset]);

  return {
    status,
    txHash,
    error,
    sendEth,
    sendToken,
    estimateGas,
    reset,
    isWalletReady,
    walletAddress,
    isSmartWallet,
  };
}
