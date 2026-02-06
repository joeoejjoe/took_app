import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { FontWeight } from '../../constants';
import { useColors } from '../../hooks/useColors';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const colors = useColors();
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo fade in + scale
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      // Tagline fade in
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Hold
      Animated.delay(800),
      // Fade out all
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(taglineOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onFinish();
    });
  }, [logoOpacity, logoScale, taglineOpacity, onFinish]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
          <Text style={[styles.logoIconText, { color: colors.background }]}>T</Text>
        </View>
        <Text style={[styles.logoText, { color: colors.textPrimary }]}>TOOK</Text>
      </Animated.View>

      <Animated.Text style={[styles.tagline, { color: colors.textSecondary, opacity: taglineOpacity }]}>
        이자를 툭! 받아가세요
      </Animated.Text>

      <View style={styles.bottomContainer}>
        <Text style={[styles.version, { color: colors.textMuted }]}>Stablecoin Yield Platform</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    gap: 16,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIconText: {
    fontSize: 40,
    fontWeight: FontWeight.bold,
  },
  logoText: {
    fontSize: 42,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 6,
  },
  tagline: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: FontWeight.medium,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  version: {
    fontSize: 12,
  },
});
