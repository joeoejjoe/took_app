import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../hooks/useColors';

interface CardButtonProps {
  onPress: () => void;
  style?: ViewStyle;
}

export default function CardButton({
  onPress,
  style,
}: CardButtonProps) {
  const colors = useColors();

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.primary }, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name="trending-up" size={18} color={colors.buttonPrimaryText} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
