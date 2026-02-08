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
  // 블록체인 상품 통계
  recordBlockchainDeposit,
  recordBlockchainWithdrawal,
  deleteBlockchainDeposit,
  getPlatformStats,
  getAllPlatformStats,
  getUserBlockchainDeposits,
} from './productService';
export type { Product, Deposit, BlockchainDeposit } from './productService';

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

// Privy Service (MPC Wallet)
export {
  savePrivyWallet,
  getStoredWalletAddress,
  clearWalletAddress,
  savePrivyUser,
  getStoredPrivyUser,
  clearPrivyUser,
} from './privyService';
export type { PrivyWallet, PrivyUserInfo } from './privyService';

// Wallet Service (Secure Storage) - Legacy, can be removed later
export {
  getStoredWallet,
  deleteWallet,
  hasStoredWallet,
} from './walletService';
export type { WalletInfo } from './walletService';

// Blockchain Service
export {
  publicClient,
  TOKEN_ADDRESSES,
  getEthBalance,
  getTokenBalance,
  getAllBalances,
  sendEth,
  sendToken,
  waitForTransaction,
  getNetworkInfo,
  getExplorerTxUrl,
  getExplorerAddressUrl,
} from './blockchainService';
export type { TokenBalance, WalletBalances } from './blockchainService';

// Midas mHYPER Service
export {
  MHYPER_ADDRESS,
  MHYPER_PRODUCT,
  BLOCKCHAIN_PRODUCTS,
  getBlockchainProductById,
  getMHyperBalance,
  getMHyperInfo,
  getUsdcAllowance,
  approveUsdc,
  depositToMHyper,
  withdrawFromMHyper,
  calculateEstimatedYield,
  previewDeposit,
  // Aave sGHO
  SGHO_ADDRESS,
  GHO_ADDRESS,
  SGHO_PRODUCT,
  getSGhoBalance,
  getSGhoInfo,
  depositToSGho,
  withdrawFromSGho,
} from './midasService';
export type { BlockchainProduct, MHyperBalance, MHyperInfo, SGhoBalance, SGhoInfo } from './midasService';

// OTP Service
export { sendOTP, verifyOTPAndLogin } from './otpService';
