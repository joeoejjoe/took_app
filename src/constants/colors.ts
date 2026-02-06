const DarkColors = {
  // Background
  background: '#0D0F1A',
  surface: '#1A1D2E',
  surfaceLight: '#242738',
  surfaceElevated: '#2A2D3E',

  // Card
  card: '#1E2132',
  cardDark: '#1A1D2E',
  cardLight: '#FFFFFF',

  // Primary (Green accent)
  primary: '#4ADE80',
  primaryDark: '#22C55E',
  primaryMuted: '#166534',
  primaryBg: 'rgba(74, 222, 128, 0.1)',
  primaryBgStrong: 'rgba(74, 222, 128, 0.15)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textDark: '#1F2937',
  textGreen: '#4ADE80',
  textRed: '#EF4444',

  // Status
  success: '#4ADE80',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Border
  border: '#2D3044',
  borderLight: '#E5E7EB',
  borderMuted: '#374151',

  // Button
  buttonPrimary: '#4ADE80',
  buttonPrimaryText: '#0D0F1A',
  buttonSecondary: '#1A1D2E',
  buttonSecondaryText: '#4ADE80',
  buttonEnabled: '#6B7280',
  buttonDisabled: '#4B5563',
  buttonDisabledText: '#9CA3AF',

  // Alert banner
  alertBg: 'rgba(74, 222, 128, 0.08)',
  alertBorder: 'rgba(74, 222, 128, 0.2)',

  // Tab bar
  tabBarBg: '#1A1D2E',
  tabBarActive: '#4ADE80',
  tabBarInactive: '#6B7280',

  // Misc
  overlay: 'rgba(0, 0, 0, 0.5)',
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',

  // Chart
  chartLine: '#4ADE80',
  chartGrid: '#2D3044',
} as const;

type ColorScheme = { [K in keyof typeof DarkColors]: string };

const LightColors: ColorScheme = {
  // Background
  background: '#F5F5F7',
  surface: '#FFFFFF',
  surfaceLight: '#F0F0F2',
  surfaceElevated: '#FFFFFF',

  // Card
  card: '#FFFFFF',
  cardDark: '#F5F5F7',
  cardLight: '#FFFFFF',

  // Primary (Green accent)
  primary: '#22C55E',
  primaryDark: '#16A34A',
  primaryMuted: '#BBF7D0',
  primaryBg: 'rgba(34, 197, 94, 0.08)',
  primaryBgStrong: 'rgba(34, 197, 94, 0.12)',

  // Text
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textDark: '#1F2937',
  textGreen: '#22C55E',
  textRed: '#DC2626',

  // Status
  success: '#22C55E',
  error: '#DC2626',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Border
  border: '#E5E7EB',
  borderLight: '#E5E7EB',
  borderMuted: '#D1D5DB',

  // Button
  buttonPrimary: '#22C55E',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondary: '#F0F0F2',
  buttonSecondaryText: '#22C55E',
  buttonEnabled: '#9CA3AF',
  buttonDisabled: '#E5E7EB',
  buttonDisabledText: '#9CA3AF',

  // Alert banner
  alertBg: 'rgba(34, 197, 94, 0.06)',
  alertBorder: 'rgba(34, 197, 94, 0.15)',

  // Tab bar
  tabBarBg: '#FFFFFF',
  tabBarActive: '#22C55E',
  tabBarInactive: '#9CA3AF',

  // Misc
  overlay: 'rgba(0, 0, 0, 0.3)',
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',

  // Chart
  chartLine: '#22C55E',
  chartGrid: '#E5E7EB',
} as const;

// Default export (dark) for static usage
export const Colors = DarkColors;

export const ThemeColors = {
  dark: DarkColors,
  light: LightColors,
} as const;

export type ColorKeys = keyof typeof Colors;
