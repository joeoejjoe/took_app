import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TookDarkTheme, TookLightTheme } from '../constants';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import TabNavigator from './TabNavigator';
import AuthNavigator from './AuthNavigator';
import OnboardingScreen from '../screens/Onboarding/OnboardingScreen';
import SplashScreen from '../screens/Onboarding/SplashScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { currentScreen, goToAuth, goToOnboarding, goToMain, initializeAuth } = useAuthStore();
  const themeMode = useThemeStore((s) => s.mode);
  const [showSplash, setShowSplash] = useState(true);

  // Firebase Auth 상태 리스너 초기화
  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, [initializeAuth]);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (currentScreen === 'onboarding') {
    return (
      <OnboardingScreen onComplete={goToAuth} />
    );
  }

  if (currentScreen === 'auth') {
    return (
      <AuthNavigator onBack={goToOnboarding} onComplete={goToMain} />
    );
  }

  return (
    <NavigationContainer theme={themeMode === 'dark' ? TookDarkTheme : TookLightTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
