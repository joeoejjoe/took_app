import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { ThemeColors } from './colors';

export const TookDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: ThemeColors.dark.primary,
    background: ThemeColors.dark.background,
    card: ThemeColors.dark.surface,
    text: ThemeColors.dark.textPrimary,
    border: ThemeColors.dark.border,
    notification: ThemeColors.dark.primary,
  },
};

export const TookLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: ThemeColors.light.primary,
    background: ThemeColors.light.background,
    card: ThemeColors.light.surface,
    text: ThemeColors.light.textPrimary,
    border: ThemeColors.light.border,
    notification: ThemeColors.light.primary,
  },
};
