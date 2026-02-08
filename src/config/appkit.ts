import { defaultWagmiConfig } from '@reown/appkit-wagmi-react-native';
import { mainnet, sepolia } from 'viem/chains';

const projectId = process.env.EXPO_PUBLIC_REOWN_PROJECT_ID || '';

const metadata = {
  name: 'TOOK',
  description: 'TOOK - Stablecoin Deposit Platform',
  url: 'https://took.app',
  icons: ['https://took.app/icon.png'],
  redirect: {
    native: 'took://',
  },
};

const chains = [mainnet, sepolia] as const;

// Wagmi 설정 (viem 연동용)
export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
});
