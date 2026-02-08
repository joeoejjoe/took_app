import '@walletconnect/react-native-compat';
import 'react-native-get-random-values';

import React, { useState, useCallback, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { PrivyProvider } from '@privy-io/expo';
import { SmartWalletsProvider } from '@privy-io/expo/smart-wallets';
import { wagmiConfig } from './src/config/appkit';
import RootNavigator from './src/navigation/RootNavigator';
import SplashScreen from './src/screens/Onboarding/SplashScreen';
import { useThemeStore } from './src/store/useThemeStore';

const PRIVY_APP_ID = process.env.EXPO_PUBLIC_PRIVY_APP_ID || '';
const PRIVY_CLIENT_ID = 'client-WY6VzbWGtcnYKhYtdbMqsK2hXHVtM6qbjjxVigVhUEuDf';

ExpoSplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const themeMode = useThemeStore((s) => s.mode);

  useEffect(() => {
    async function prepare() {
      await ExpoSplashScreen.hideAsync();
      setAppReady(true);
    }
    prepare();
  }, []);

  const handleSplashFinish = useCallback(() => {
    setSplashDone(true);
  }, []);

  if (!appReady) {
    return null;
  }

  return (
    <PrivyProvider appId={PRIVY_APP_ID} clientId={PRIVY_CLIENT_ID}>
      <SmartWalletsProvider>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <SafeAreaProvider>
                <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
                {splashDone ? <RootNavigator /> : <SplashScreen onFinish={handleSplashFinish} />}
              </SafeAreaProvider>
            </GestureHandlerRootView>
          </QueryClientProvider>
        </WagmiProvider>
      </SmartWalletsProvider>
    </PrivyProvider>
  );
}
