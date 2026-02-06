import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { BorderRadius, FontWeight } from '../../constants';
import { useColors } from '../../hooks/useColors';

interface CategoryButtonProps {
  title: string;
  active?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export default function CategoryButton({
  title,
  active = false,
  onPress,
  style,
}: CategoryButtonProps) {
  const colors = useColors();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        active
          ? { backgroundColor: colors.primary }
          : { backgroundColor: colors.transparent, borderWidth: 1, borderColor: colors.borderMuted },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.text,
          { color: active ? colors.buttonPrimaryText : colors.textSecondary },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.full,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 13,
    fontWeight: FontWeight.medium,
  },
});
