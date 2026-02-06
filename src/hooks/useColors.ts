import { ThemeColors } from '../constants/colors';
import { useThemeStore } from '../store/useThemeStore';

export function useColors() {
  const mode = useThemeStore((s) => s.mode);
  return ThemeColors[mode];
}
