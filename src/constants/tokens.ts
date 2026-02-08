import { ImageSourcePropType } from 'react-native';

// 토큰 로고 URL (CoinGecko CDN)
export const TOKEN_LOGO_URLS: Record<string, string> = {
  ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  USDC: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  USDT: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  DAI: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png',
  GHO: 'https://assets.coingecko.com/coins/images/30663/small/gho-token-logo.png',
};

// 토큰 로고 이미지 (CDN URL 기반)
export const TOKEN_LOGOS: Record<string, ImageSourcePropType> = {
  ETH: { uri: TOKEN_LOGO_URLS.ETH },
  USDC: { uri: TOKEN_LOGO_URLS.USDC },
  USDT: { uri: TOKEN_LOGO_URLS.USDT },
  DAI: { uri: TOKEN_LOGO_URLS.DAI },
  GHO: { uri: TOKEN_LOGO_URLS.GHO },
};

// 토큰 색상 (폴백용)
export const TOKEN_COLORS: Record<string, string> = {
  ETH: '#627EEA',
  USDC: '#2775CA',
  USDT: '#26A17B',
  DAI: '#F5AC37',
  GHO: '#8B5CF6',
};

// 토큰 이름
export const TOKEN_NAMES: Record<string, string> = {
  USDC: 'USD Coin',
  USDT: 'Tether',
  DAI: 'Dai Stablecoin',
  GHO: 'GHO',
};

// 지원되는 스테이블코인 목록
export const STABLECOINS: string[] = ['USDC', 'USDT', 'DAI', 'GHO'];
export type StablecoinSymbol = 'USDC' | 'USDT' | 'DAI' | 'GHO';

// 토큰 로고 가져오기 (없으면 undefined)
export const getTokenLogo = (symbol: string): ImageSourcePropType | undefined => {
  return TOKEN_LOGOS[symbol];
};

// 토큰 색상 가져오기 (기본값 제공)
export const getTokenColor = (symbol: string): string => {
  return TOKEN_COLORS[symbol] || '#4ADE80';
};
