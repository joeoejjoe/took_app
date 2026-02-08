/**
 * Midas mHYPER Service
 * USDC 예치 → mHYPER 수령 (수익이 토큰 가격에 자동 반영)
 */

import { formatUnits, parseUnits } from 'viem';
import { publicClient, TOKEN_ADDRESSES } from './blockchainService';
import { getStoredWallet } from './walletService';
import { createWalletClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// mHYPER 컨트랙트 주소 (Ethereum Mainnet)
export const MHYPER_ADDRESS = '0x9b5528528656DBC094765E2abB79F293c21191B9' as `0x${string}`;

// Aave sGHO 컨트랙트 주소 (Ethereum Mainnet)
export const SGHO_ADDRESS = '0x00529C1D7Eb6a6CB5F124dCb28d08fDbcFe883E8' as `0x${string}`;
export const GHO_ADDRESS = '0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f' as `0x${string}`;

// 블록체인 상품 타입
export interface BlockchainProduct {
  id: string;
  name: string;
  displayName: string;
  description: string;
  longDescription: string;
  apy: number;
  depositToken: string;
  receiveToken: string;
  contractAddress: `0x${string}`;
  minDeposit: number;
  type: 'flexible' | 'locked';
  lockupDays?: number;
  features: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  networks: string[];
  riskManager?: string;
  custody?: string;
  priceUpdateFrequency?: string;
  instantLiquidity?: boolean;
  isFavorite?: boolean;
}

// mHYPER 상품 정보
export const MHYPER_PRODUCT: BlockchainProduct = {
  id: 'mhyper',
  name: 'mHYPER',
  displayName: 'USDC 수익상품',
  description: 'USDC를 예치하고 매일 수익을 받으세요',
  longDescription: '전문가가 운용하는 안전한 스테이블코인 투자 전략으로, 예치한 자산이 자동으로 불어납니다.',
  apy: 8.93,
  depositToken: 'USDC',
  receiveToken: 'mHYPER',
  contractAddress: MHYPER_ADDRESS,
  minDeposit: 1,
  type: 'flexible',
  features: [
    { icon: 'trending-up-outline', title: '연 8.93% 수익', description: '시장 중립 전략으로 안정적인 수익' },
    { icon: 'refresh-outline', title: '자동 복리', description: '수익이 자동으로 재투자됩니다' },
    { icon: 'shield-checkmark-outline', title: '전문가 운용', description: 'Hyperithm이 리스크 관리' },
    { icon: 'time-outline', title: '출금 3영업일', description: '언제든 출금 요청 가능' },
  ],
  networks: ['Ethereum'],
  riskManager: 'Hyperithm',
  custody: 'Fordefi',
  priceUpdateFrequency: '주 2회',
  instantLiquidity: true,
  isFavorite: false,
};

// Aave sGHO 상품 정보
export const SGHO_PRODUCT: BlockchainProduct = {
  id: 'sgho',
  name: 'sGHO',
  displayName: 'Aave 저축 상품',
  description: 'Aave의 GHO 스테이블코인으로 안정적인 수익을 받으세요',
  longDescription: 'USDC를 예치하면 자동으로 GHO로 변환되어 Aave 프로토콜에서 수익이 발생합니다. 출금 시 다시 USDC로 돌려받습니다.',
  apy: 5.28,
  depositToken: 'USDC',
  receiveToken: 'sGHO',
  contractAddress: SGHO_ADDRESS,
  minDeposit: 1,
  type: 'flexible',
  features: [
    { icon: 'trending-up-outline', title: '연 5.28% 수익', description: 'Aave 프로토콜 기반 안정 수익' },
    { icon: 'flash-outline', title: '즉시 출금', description: '락업 없이 언제든 출금 가능' },
    { icon: 'shield-checkmark-outline', title: 'Aave 보안', description: '검증된 DeFi 프로토콜' },
    { icon: 'swap-horizontal-outline', title: '자동 변환', description: 'USDC↔GHO 자동 변환' },
  ],
  networks: ['Ethereum'],
  riskManager: 'Aave DAO',
  priceUpdateFrequency: '실시간',
  instantLiquidity: true,
  isFavorite: false,
};

// 현재 지원하는 모든 블록체인 상품 목록
export const BLOCKCHAIN_PRODUCTS: BlockchainProduct[] = [
  MHYPER_PRODUCT,
  SGHO_PRODUCT,
];

/**
 * 상품 ID로 상품 정보 조회
 */
export const getBlockchainProductById = (productId: string): BlockchainProduct | undefined => {
  return BLOCKCHAIN_PRODUCTS.find(p => p.id === productId);
};

// ERC-20 + Vault ABI
const MHYPER_ABI = [
  // ERC-20 기본
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
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // Vault 기능
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'assets', type: 'uint256' },
      { name: 'receiver', type: 'address' },
    ],
    outputs: [{ name: 'shares', type: 'uint256' }],
  },
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'assets', type: 'uint256' },
      { name: 'receiver', type: 'address' },
      { name: 'owner', type: 'address' },
    ],
    outputs: [{ name: 'shares', type: 'uint256' }],
  },
  {
    name: 'redeem',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'shares', type: 'uint256' },
      { name: 'receiver', type: 'address' },
      { name: 'owner', type: 'address' },
    ],
    outputs: [{ name: 'assets', type: 'uint256' }],
  },
  {
    name: 'convertToAssets',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'shares', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'convertToShares',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'assets', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'asset',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'totalAssets',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// USDC Approve ABI
const ERC20_APPROVE_ABI = [
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
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export interface MHyperBalance {
  shares: string;           // mHYPER 토큰 수량
  sharesFormatted: string;
  assetsValue: string;      // USDC 환산 가치
  assetsValueFormatted: string;
}

export interface MHyperInfo {
  totalAssets: string;      // 총 예치 자산 (USDC)
  totalSupply: string;      // 총 mHYPER 발행량
  sharePrice: string;       // 1 mHYPER = ? USDC
}

/**
 * mHYPER 잔액 조회
 */
export const getMHyperBalance = async (walletAddress: string): Promise<MHyperBalance | null> => {
  try {
    const [shares, decimals] = await Promise.all([
      publicClient.readContract({
        address: MHYPER_ADDRESS,
        abi: MHYPER_ABI,
        functionName: 'balanceOf',
        args: [walletAddress as `0x${string}`],
      }),
      publicClient.readContract({
        address: MHYPER_ADDRESS,
        abi: MHYPER_ABI,
        functionName: 'decimals',
      }),
    ]);

    const sharesFormatted = formatUnits(shares as bigint, decimals as number);

    // mHYPER → USDC 환산
    let assetsValue = '0';
    let assetsValueFormatted = '0';

    if ((shares as bigint) > 0n) {
      try {
        const assets = await publicClient.readContract({
          address: MHYPER_ADDRESS,
          abi: MHYPER_ABI,
          functionName: 'convertToAssets',
          args: [shares as bigint],
        });
        assetsValue = (assets as bigint).toString();
        assetsValueFormatted = formatUnits(assets as bigint, 6); // USDC는 6 decimals
      } catch {
        // convertToAssets 미지원 시 1:1로 가정
        assetsValue = (shares as bigint).toString();
        assetsValueFormatted = sharesFormatted;
      }
    }

    return {
      shares: (shares as bigint).toString(),
      sharesFormatted,
      assetsValue,
      assetsValueFormatted,
    };
  } catch (error) {
    console.error('Failed to get mHYPER balance:', error);
    return null;
  }
};

/**
 * mHYPER Vault 정보 조회
 */
export const getMHyperInfo = async (): Promise<MHyperInfo | null> => {
  try {
    // totalSupply는 표준 ERC-20 함수이므로 먼저 시도
    let totalSupply: bigint = 0n;
    let totalAssets: bigint = 0n;

    try {
      totalSupply = await publicClient.readContract({
        address: MHYPER_ADDRESS,
        abi: MHYPER_ABI,
        functionName: 'totalSupply',
      }) as bigint;
    } catch {
      // totalSupply 조회 실패 시 기본값 사용
    }

    try {
      totalAssets = await publicClient.readContract({
        address: MHYPER_ADDRESS,
        abi: MHYPER_ABI,
        functionName: 'totalAssets',
      }) as bigint;
    } catch {
      // totalAssets 조회 실패 시 totalSupply 기반 추정 (1:1 비율 가정)
      // 또는 기본값 유지
    }

    // 둘 다 0이면 null 반환
    if (totalSupply === 0n && totalAssets === 0n) {
      return null;
    }

    const totalAssetsFormatted = formatUnits(totalAssets, 6);
    const totalSupplyFormatted = formatUnits(totalSupply, 18);

    // Share price 계산
    const sharePrice = totalSupply > 0n && totalAssets > 0n
      ? (totalAssets * BigInt(1e18)) / totalSupply
      : BigInt(1e6);

    return {
      totalAssets: totalAssetsFormatted,
      totalSupply: totalSupplyFormatted,
      sharePrice: formatUnits(sharePrice, 6),
    };
  } catch (error) {
    // 조용히 실패하고 null 반환
    return null;
  }
};

/**
 * USDC Allowance 확인
 */
export const getUsdcAllowance = async (walletAddress: string): Promise<bigint> => {
  try {
    const allowance = await publicClient.readContract({
      address: TOKEN_ADDRESSES.USDC,
      abi: ERC20_APPROVE_ABI,
      functionName: 'allowance',
      args: [walletAddress as `0x${string}`, MHYPER_ADDRESS],
    });
    return allowance as bigint;
  } catch (error) {
    console.error('Failed to get USDC allowance:', error);
    return 0n;
  }
};

/**
 * USDC Approve (mHYPER Vault에 사용 허가)
 */
export const approveUsdc = async (amount: string): Promise<string> => {
  const wallet = await getStoredWallet();
  if (!wallet) throw new Error('지갑을 찾을 수 없습니다');

  const account = privateKeyToAccount(wallet.privateKey as `0x${string}`);
  const walletClient = createWalletClient({
    account,
    chain: mainnet,
    transport: http('https://ethereum-rpc.publicnode.com'),
  });

  const amountWei = parseUnits(amount, 6); // USDC는 6 decimals

  const hash = await walletClient.writeContract({
    address: TOKEN_ADDRESSES.USDC,
    abi: ERC20_APPROVE_ABI,
    functionName: 'approve',
    args: [MHYPER_ADDRESS, amountWei],
  });

  return hash;
};

/**
 * USDC 예치 → mHYPER 수령
 */
export const depositToMHyper = async (
  amount: string,
  receiverAddress?: string
): Promise<string> => {
  const wallet = await getStoredWallet();
  if (!wallet) throw new Error('지갑을 찾을 수 없습니다');

  const account = privateKeyToAccount(wallet.privateKey as `0x${string}`);
  const walletClient = createWalletClient({
    account,
    chain: mainnet,
    transport: http('https://ethereum-rpc.publicnode.com'),
  });

  const amountWei = parseUnits(amount, 6); // USDC는 6 decimals
  const receiver = (receiverAddress || wallet.address) as `0x${string}`;

  const hash = await walletClient.writeContract({
    address: MHYPER_ADDRESS,
    abi: MHYPER_ABI,
    functionName: 'deposit',
    args: [amountWei, receiver],
  });

  return hash;
};

/**
 * mHYPER 출금 → USDC 수령
 */
export const withdrawFromMHyper = async (
  shares: string,
  receiverAddress?: string
): Promise<string> => {
  const wallet = await getStoredWallet();
  if (!wallet) throw new Error('지갑을 찾을 수 없습니다');

  const account = privateKeyToAccount(wallet.privateKey as `0x${string}`);
  const walletClient = createWalletClient({
    account,
    chain: mainnet,
    transport: http('https://ethereum-rpc.publicnode.com'),
  });

  const sharesWei = parseUnits(shares, 18);
  const receiver = (receiverAddress || wallet.address) as `0x${string}`;
  const owner = wallet.address as `0x${string}`;

  const hash = await walletClient.writeContract({
    address: MHYPER_ADDRESS,
    abi: MHYPER_ABI,
    functionName: 'redeem',
    args: [sharesWei, receiver, owner],
  });

  return hash;
};

/**
 * 예상 수익 계산 (단순 APY 기반)
 */
export const calculateEstimatedYield = (principal: number, apy: number, days: number = 365): number => {
  const apyDecimal = apy / 100;
  return principal * apyDecimal * (days / 365);
};

/**
 * 예치 시 받을 mHYPER 수량 미리보기
 */
export const previewDeposit = async (usdcAmount: string): Promise<string> => {
  try {
    const amountWei = parseUnits(usdcAmount, 6);
    const shares = await publicClient.readContract({
      address: MHYPER_ADDRESS,
      abi: MHYPER_ABI,
      functionName: 'convertToShares',
      args: [amountWei],
    });
    return formatUnits(shares as bigint, 18);
  } catch (error) {
    console.error('Failed to preview deposit:', error);
    return usdcAmount; // 실패 시 1:1로 가정
  }
};

// ============================================
// Aave sGHO 관련 함수
// ============================================

// sGHO ABI (ERC-4626 Vault)
const SGHO_ABI = [
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
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'totalAssets',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'assets', type: 'uint256' },
      { name: 'receiver', type: 'address' },
    ],
    outputs: [{ name: 'shares', type: 'uint256' }],
  },
  {
    name: 'redeem',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'shares', type: 'uint256' },
      { name: 'receiver', type: 'address' },
      { name: 'owner', type: 'address' },
    ],
    outputs: [{ name: 'assets', type: 'uint256' }],
  },
  {
    name: 'convertToAssets',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'shares', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'convertToShares',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'assets', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export interface SGhoBalance {
  shares: string;
  sharesFormatted: string;
  assetsValue: string;
  assetsValueFormatted: string;
}

export interface SGhoInfo {
  totalAssets: string;
  totalSupply: string;
  sharePrice: string;
}

/**
 * sGHO 잔액 조회
 */
export const getSGhoBalance = async (walletAddress: string): Promise<SGhoBalance | null> => {
  try {
    const shares = await publicClient.readContract({
      address: SGHO_ADDRESS,
      abi: SGHO_ABI,
      functionName: 'balanceOf',
      args: [walletAddress as `0x${string}`],
    });

    const sharesFormatted = formatUnits(shares as bigint, 18);

    // sGHO → GHO 환산
    let assetsValue = '0';
    let assetsValueFormatted = '0';

    if ((shares as bigint) > 0n) {
      try {
        const assets = await publicClient.readContract({
          address: SGHO_ADDRESS,
          abi: SGHO_ABI,
          functionName: 'convertToAssets',
          args: [shares as bigint],
        });
        assetsValue = (assets as bigint).toString();
        assetsValueFormatted = formatUnits(assets as bigint, 18); // GHO는 18 decimals
      } catch {
        assetsValue = (shares as bigint).toString();
        assetsValueFormatted = sharesFormatted;
      }
    }

    return {
      shares: (shares as bigint).toString(),
      sharesFormatted,
      assetsValue,
      assetsValueFormatted,
    };
  } catch (error) {
    return null;
  }
};

/**
 * sGHO Vault 정보 조회
 */
export const getSGhoInfo = async (): Promise<SGhoInfo | null> => {
  try {
    let totalSupply: bigint = 0n;
    let totalAssets: bigint = 0n;

    try {
      totalSupply = await publicClient.readContract({
        address: SGHO_ADDRESS,
        abi: SGHO_ABI,
        functionName: 'totalSupply',
      }) as bigint;
    } catch {
      // 조회 실패
    }

    try {
      totalAssets = await publicClient.readContract({
        address: SGHO_ADDRESS,
        abi: SGHO_ABI,
        functionName: 'totalAssets',
      }) as bigint;
    } catch {
      // 조회 실패
    }

    if (totalSupply === 0n && totalAssets === 0n) {
      return null;
    }

    const totalAssetsFormatted = formatUnits(totalAssets, 18); // GHO는 18 decimals
    const totalSupplyFormatted = formatUnits(totalSupply, 18);

    const sharePrice = totalSupply > 0n && totalAssets > 0n
      ? (totalAssets * BigInt(1e18)) / totalSupply
      : BigInt(1e18);

    return {
      totalAssets: totalAssetsFormatted,
      totalSupply: totalSupplyFormatted,
      sharePrice: formatUnits(sharePrice, 18),
    };
  } catch (error) {
    return null;
  }
};

/**
 * USDC → sGHO 예치 (USDC → GHO swap → sGHO deposit)
 * 참고: 실제 구현 시 DEX aggregator (1inch, Uniswap 등) 연동 필요
 */
export const depositToSGho = async (
  usdcAmount: string,
  receiverAddress?: string
): Promise<string> => {
  const wallet = await getStoredWallet();
  if (!wallet) throw new Error('지갑을 찾을 수 없습니다');

  // TODO: 실제 구현 시:
  // 1. USDC → GHO 스왑 (1inch 또는 Uniswap)
  // 2. GHO approve to sGHO contract
  // 3. sGHO deposit

  // 현재는 시뮬레이션 모드로 동작
  throw new Error('sGHO 예치 기능은 준비 중입니다. USDC↔GHO 스왑 연동이 필요합니다.');
};

/**
 * sGHO 출금 → USDC (sGHO redeem → GHO → USDC swap)
 */
export const withdrawFromSGho = async (
  shares: string,
  receiverAddress?: string
): Promise<string> => {
  const wallet = await getStoredWallet();
  if (!wallet) throw new Error('지갑을 찾을 수 없습니다');

  // TODO: 실제 구현 시:
  // 1. sGHO redeem → GHO
  // 2. GHO → USDC 스왑

  throw new Error('sGHO 출금 기능은 준비 중입니다. GHO↔USDC 스왑 연동이 필요합니다.');
};
