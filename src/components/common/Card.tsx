import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { CardSpec } from '../../constants';
import { useColors } from '../../hooks/useColors';

interface CardProps {
  children: React.ReactNode;
  variant?: 'dark' | 'light';
  style?: ViewStyle;
}

export default function Card({
  children,
  variant = 'dark',
  style,
}: CardProps) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: variant === 'light' ? colors.cardLight : colors.card },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: CardSpec.borderRadius,
    paddingHorizontal: CardSpec.paddingHorizontal,
    paddingVertical: CardSpec.paddingVertical,
  },
});
