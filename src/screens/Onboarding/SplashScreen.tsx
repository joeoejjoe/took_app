import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { FontWeight } from '../../constants';

interface SplashScreenProps {
  onFinish: () => void;
}

// TOOK 로고 컴포넌트 (둥근 사각형 + 노치)
function TookLogo({ size = 120, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* 둥근 사각형 외곽 + 왼쪽 위 노치 */}
      <Path
        d="M35 8
           L75 8
           C88 8 92 12 92 25
           L92 75
           C92 88 88 92 75 92
           L25 92
           C12 92 8 88 8 75
           L8 35
           C8 28 10 25 15 22
           L22 15
           C25 10 28 8 35 8
           Z"
        fill={color}
      />
      {/* 내부 구멍 (도넛 모양) */}
      <Path
        d="M50 30
           C39 30 30 39 30 50
           C30 61 39 70 50 70
           C61 70 70 61 70 50
           C70 39 61 30 50 30
           Z"
        fill="#4ADE80"
      />
    </Svg>
  );
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo fade in + scale
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      // Text fade in
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Hold
      Animated.delay(1000),
      // Fade out all
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onFinish();
    });
  }, [logoOpacity, logoScale, textOpacity, onFinish]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <TookLogo size={140} color="#FFFFFF" />
        </Animated.View>

        <Animated.Text style={[styles.logoText, { opacity: textOpacity }]}>
          took
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4ADE80',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoText: {
    fontSize: 48,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
});
