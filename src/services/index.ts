// Auth Service
export {
  signUpWithEmail,
  signInWithEmail,
  logOut,
  getUserProfile,
  updateUserProfile,
  connectWallet,
  subscribeToAuthState,
  getCurrentUser,
} from './authService';
export type { UserProfile } from './authService';

// Asset Service
export {
  getUserAssets,
  subscribeToUserAssets,
  getTotalBalance,
  getDailyInterest,
  claimInterest,
  getInterestClaimHistory,
  initializeUserAssets,
} from './assetService';
export type { Asset, InterestClaim } from './assetService';

// Product Service
export {
  getProducts,
  getProductById,
  getRecommendedProducts,
  createDeposit,
  getUserDeposits,
  toggleFavoriteProduct,
  getFavoriteProducts,
  initializeProducts,
} from './productService';
export type { Product, Deposit } from './productService';

// Transfer Service
export {
  createWithdrawRequest,
  updateWithdrawStatus,
  getWithdrawHistory,
  getRecipients,
  getFavoriteRecipients,
  addRecipient,
  toggleRecipientFavorite,
  updateRecipientLastUsed,
} from './transferService';
export type { WithdrawRequest, Recipient } from './transferService';

// Exchange Service
export {
  getExchangeRate,
  getExchangeRateHistory,
  executeExchange,
  getExchangeHistory,
  getSupportedCurrencies,
  updateExchangeRate,
} from './exchangeService';
export type { ExchangeTransaction, ExchangeRate, RateHistory } from './exchangeService';

// Wallet Service
export {
  createWallet,
  getStoredWallet,
  getStoredWalletAddress,
  deleteWallet,
  hasStoredWallet,
} from './walletService';
export type { WalletInfo } from './walletService';
