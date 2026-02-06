export interface Product {
  id: string;
  name: string;
  totalDeposit: number;
  maxApy: number;
  type: 'flexible' | 'locked';
  lockupDays?: number;
  isFavorite: boolean;
  description?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  asset: 'USDT' | 'USDC';
}

export type ProductSortType = 'all' | 'latest' | 'apy' | 'favorites';
