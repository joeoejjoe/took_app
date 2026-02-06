import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { useColors } from '../../hooks/useColors';

interface ToggleButtonProps {
  value: boolean;
  onToggle: (value: boolean) => void;
  style?: ViewStyle;
}

export default function ToggleButton({
  value,
  onToggle,
  style,
}: ToggleButtonProps) {
  const colors = useColors();
  const translateX = React.useRef(new Animated.Value(value ? 20 : 0)).current;

  React.useEffect(() => {
    Animated.spring(translateX, {
      toValue: value ? 20 : 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  }, [value, translateX]);

  return (
    <TouchableOpacity
      style={[
        styles.track,
        { backgroundColor: value ? colors.primaryMuted : colors.buttonDisabled },
        style,
      ]}
      onPress={() => onToggle(!value)}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.thumb,
          {
            backgroundColor: value ? colors.primary : colors.textMuted,
            transform: [{ translateX }],
          },
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
});
