import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../hooks/useColors';

interface AlertButtonProps {
  onPress: () => void;
  hasNotification?: boolean;
  style?: ViewStyle;
}

export default function AlertButton({
  onPress,
  hasNotification = false,
  style,
}: AlertButtonProps) {
  const colors = useColors();

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.surfaceLight }, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name="notifications-outline" size={22} color={colors.textSecondary} />
      {hasNotification && <View style={[styles.badge, { backgroundColor: colors.primary }]} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
