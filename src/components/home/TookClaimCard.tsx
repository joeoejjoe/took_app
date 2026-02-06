import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { FontWeight, Spacing, BorderRadius } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { SecondaryButton } from '../common';
import { formatKRW } from '../../utils/format';

interface TookClaimCardProps {
  dailyInterest: number;
  onClaim: () => void;
}

export default function TookClaimCard({ dailyInterest, onClaim }: TookClaimCardProps) {
  const colors = useColors();
  const [claimed, setClaimed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const buttonScale = useRef(new Animated.Value(1)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0.3)).current;
  const amountTranslateY = useRef(new Animated.Value(0)).current;
  const amountOpacity = useRef(new Animated.Value(1)).current;
  const floatOpacity = useRef(new Animated.Value(0)).current;
  const floatTranslateY = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  const handleClaim = () => {
    if (claimed || isAnimating) return;
    setIsAnimating(true);

    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.timing(glowOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(glowOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    floatOpacity.setValue(1);
    floatTranslateY.setValue(0);
    Animated.parallel([
      Animated.timing(floatTranslateY, {
        toValue: -40,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(floatOpacity, {
        toValue: 0,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(amountTranslateY, {
          toValue: -8,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(amountOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(checkScale, {
          toValue: 1,
          tension: 60,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(checkOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setClaimed(true);
      setIsAnimating(false);
      onClaim();
    });
  };

  const handleReset = () => {
    setClaimed(false);
    amountTranslateY.setValue(0);
    amountOpacity.setValue(1);
    checkOpacity.setValue(0);
    checkScale.setValue(0.3);
    floatOpacity.setValue(0);
    floatTranslateY.setValue(0);
    glowOpacity.setValue(0);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Animated.View
        style={[
          styles.glow,
          { opacity: glowOpacity, backgroundColor: colors.primaryBg },
        ]}
      />

      <View style={styles.content}>
        <Text style={[styles.label, { color: colors.textMuted }]}>매일 받는 이자</Text>

        <View style={styles.amountContainer}>
          <Animated.Text
            style={[
              styles.amount,
              {
                color: colors.textPrimary,
                opacity: amountOpacity,
                transform: [{ translateY: amountTranslateY }],
              },
            ]}
          >
            {formatKRW(dailyInterest)} <Text style={[styles.unit, { color: colors.textSecondary }]}>원</Text>
          </Animated.Text>

          <Animated.Text
            style={[
              styles.floatText,
              {
                color: colors.primary,
                opacity: floatOpacity,
                transform: [{ translateY: floatTranslateY }],
              },
            ]}
          >
            +{formatKRW(dailyInterest)}원
          </Animated.Text>

          <Animated.View
            style={[
              styles.checkContainer,
              {
                opacity: checkOpacity,
                transform: [{ scale: checkScale }],
              },
            ]}
          >
            <Text style={[styles.checkText, { color: colors.primary }]}>TOOK!</Text>
            <Text style={[styles.claimedSubtext, { color: colors.textMuted }]}>이자가 수령되었어요</Text>
          </Animated.View>
        </View>
      </View>

      <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
        {claimed ? (
          <SecondaryButton
            title="확인"
            onPress={handleReset}
            style={{ ...styles.button, backgroundColor: colors.surfaceLight }}
          />
        ) : (
          <SecondaryButton
            title="TOOK"
            onPress={handleClaim}
            disabled={isAnimating}
            style={styles.button}
            textStyle={styles.buttonText}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BorderRadius.md,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: FontWeight.medium,
  },
  amountContainer: {
    height: 32,
    justifyContent: 'center',
  },
  amount: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
  },
  unit: {
    fontSize: 16,
    fontWeight: FontWeight.medium,
  },
  floatText: {
    position: 'absolute',
    fontSize: 16,
    fontWeight: FontWeight.bold,
  },
  checkContainer: {
    position: 'absolute',
    gap: 2,
  },
  checkText: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
  },
  claimedSubtext: {
    fontSize: 11,
  },
  button: {
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: FontWeight.bold,
  },
});
