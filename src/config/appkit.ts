import { createAppKit, defaultWagmiConfig } from '@reown/appkit-wagmi-react-native';
import { mainnet, sepolia } from 'viem/chains';

const projectId = process.env.EXPO_PUBLIC_REOWN_PROJECT_ID || '';

if (!projectId) {
  console.warn(
    '[AppKit] EXPO_PUBLIC_REOWN_PROJECT_ID is not set. Get one at https://cloud.reown.com'
  );
}

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

export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
});

createAppKit({
  projectId,
  wagmiConfig,
  defaultChain: sepolia,
  enableAnalytics: false,
  features: {
    email: true,              // 이메일 지갑 생성 활성화
    emailShowWallets: true,   // 외부 지갑 연결 옵션도 표시
    socials: ['apple'],       // Apple 로그인 지원
  },
});
