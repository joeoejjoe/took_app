import { createPublicClient, createWalletClient, http, formatEther, formatUnits, parseUnits } from 'viem';
import { mainnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { getStoredWallet } from './walletService';

// Ethereum Mainnet RPC (공개 RPC)
const MAINNET_RPC = 'https://ethereum-rpc.publicnode.com';

// Public Client (읽기 전용)
export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(MAINNET_RPC),
});

// Mainnet 스테이블코인 주소
export const TOKEN_ADDRESSES = {
  // USDC (Circle)
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as `0x${string}`,
  // USDT (Tether)
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7' as `0x${string}`,
  // DAI
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F' as `0x${string}`,
  // GHO (Aave)
  GHO: '0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f' as `0x${string}`,
} as const;

// ERC-20 ABI (필요한 함수만)
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
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
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

export interface TokenBalance {
  symbol: string;
  balance: string;
  balanceFormatted: string;
  decimals: number;
  address: string;
}

export interface WalletBalances {
  eth: string;
  ethFormatted: string;
  tokens: TokenBalance[];
}

/**
 * ETH 잔액 조회
 */
export const getEthBalance = async (address: string): Promise<string> => {
  try {
    const balance = await publicClient.getBalance({
      address: address as `0x${string}`,
    });
    return formatEther(balance);
  } catch (error) {
    console.error('Failed to get ETH balance:', error);
    return '0';
  }
};

/**
 * ERC-20 토큰 잔액 조회
 */
export const getTokenBalance = async (
  walletAddress: string,
  tokenAddress: string
): Promise<TokenBalance | null> => {
  try {
    const [balance, decimals, symbol] = await Promise.all([
      publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [walletAddress as `0x${string}`],
      }),
      publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'decimals',
      }),
      publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'symbol',
      }),
    ]);

    return {
      symbol: symbol as string,
      balance: (balance as bigint).toString(),
      balanceFormatted: formatUnits(balance as bigint, decimals as number),
      decimals: decimals as number,
      address: tokenAddress,
    };
  } catch (error) {
    console.error(`Failed to get token balance for ${tokenAddress}:`, error);
    return null;
  }
};

/**
 * 모든 스테이블코인 잔액 조회
 */
export const getAllBalances = async (walletAddress: string): Promise<WalletBalances> => {
  const [ethBalance, usdcBalance, usdtBalance, daiBalance, ghoBalance] = await Promise.all([
    getEthBalance(walletAddress), // 가스비 확인용으로 유지
    getTokenBalance(walletAddress, TOKEN_ADDRESSES.USDC),
    getTokenBalance(walletAddress, TOKEN_ADDRESSES.USDT),
    getTokenBalance(walletAddress, TOKEN_ADDRESSES.DAI),
    getTokenBalance(walletAddress, TOKEN_ADDRESSES.GHO),
  ]);

  const tokens: TokenBalance[] = [];
  if (usdcBalance) tokens.push(usdcBalance);
  if (usdtBalance) tokens.push(usdtBalance);
  if (daiBalance) tokens.push(daiBalance);
  if (ghoBalance) tokens.push(ghoBalance);

  return {
    eth: ethBalance, // 가스비 확인용
    ethFormatted: `${parseFloat(ethBalance).toFixed(6)} ETH`,
    tokens,
  };
};

/**
 * Wallet Client 생성 (트랜잭션 전송용)
 */
const getWalletClient = async () => {
  const wallet = await getStoredWallet();
  if (!wallet) {
    throw new Error('Wallet not found');
  }

  const account = privateKeyToAccount(wallet.privateKey as `0x${string}`);

  return createWalletClient({
    account,
    chain: mainnet,
    transport: http(MAINNET_RPC),
  });
};

/**
 * ETH 전송
 */
export const sendEth = async (
  toAddress: string,
  amount: string
): Promise<string> => {
  const walletClient = await getWalletClient();

  const hash = await walletClient.sendTransaction({
    to: toAddress as `0x${string}`,
    value: parseUnits(amount, 18),
  });

  return hash;
};

/**
 * ERC-20 토큰 전송
 */
export const sendToken = async (
  tokenAddress: string,
  toAddress: string,
  amount: string,
  decimals: number = 6
): Promise<string> => {
  const walletClient = await getWalletClient();
  const wallet = await getStoredWallet();

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  const hash = await walletClient.writeContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [toAddress as `0x${string}`, parseUnits(amount, decimals)],
  });

  return hash;
};

/**
 * 트랜잭션 확인 대기
 */
export const waitForTransaction = async (hash: string) => {
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: hash as `0x${string}`,
  });
  return receipt;
};

/**
 * 네트워크 정보
 */
export const getNetworkInfo = () => ({
  name: 'Ethereum Mainnet',
  chainId: mainnet.id,
  currency: 'ETH',
  explorer: 'https://etherscan.io',
});

/**
 * 트랜잭션 탐색기 URL
 */
export const getExplorerTxUrl = (hash: string) =>
  `https://etherscan.io/tx/${hash}`;

/**
 * 주소 탐색기 URL
 */
export const getExplorerAddressUrl = (address: string) =>
  `https://etherscan.io/address/${address}`;
