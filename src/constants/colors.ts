// Primary Green 팔레트
const PrimaryGreen = {
  50: '#ECFDF5',
  100: '#D1FAE5',
  200: '#A7F3D0',
  300: '#6EE7B7',
  400: '#4ADE80', // Primary
  500: '#22C55E',
  600: '#16A34A',
  700: '#15803D',
  800: '#166534',
  900: '#14532D',
  950: '#052E16',
} as const;

// Dark 팔레트
const DarkGreen = {
  50: '#F3FAF8',
  100: '#D7F0EB',
  200: '#AFE0D6',
  300: '#7FC9BC',
  400: '#54ADA1',
  500: '#3B9187',
  600: '#2D746D',
  700: '#275E59',
  800: '#234C49',
  900: '#21403E',
  950: '#0D1F1E', // Primary Dark
} as const;

const DarkColors = {
  // Background
  background: DarkGreen[950],
  surface: '#1A2E2D',
  surfaceLight: '#243F3D',
  surfaceElevated: '#2A4745',

  // Card
  card: '#1E3836',
  cardDark: '#1A2E2D',
  cardLight: '#FFFFFF',

  // Primary (Green)
  primary: PrimaryGreen[400],
  primaryDark: PrimaryGreen[500],
  primaryMuted: PrimaryGreen[700],
  primaryBg: `${PrimaryGreen[400]}15`,
  primaryBgStrong: `${PrimaryGreen[400]}22`,

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textDark: DarkGreen[950],
  textGreen: PrimaryGreen[400],
  textRed: '#EF4444',

  // Status
  success: PrimaryGreen[400],
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Border
  border: '#2D4644',
  borderLight: '#E5E7EB',
  borderMuted: '#375553',

  // Button
  buttonPrimary: PrimaryGreen[400],
  buttonPrimaryText: DarkGreen[950],
  buttonSecondary: '#1A2E2D',
  buttonSecondaryText: PrimaryGreen[400],
  buttonEnabled: '#6B7280',
  buttonDisabled: '#4B5563',
  buttonDisabledText: '#9CA3AF',

  // Alert banner
  alertBg: `${PrimaryGreen[400]}12`,
  alertBorder: `${PrimaryGreen[400]}33`,

  // Tab bar
  tabBarBg: '#1A2E2D',
  tabBarActive: PrimaryGreen[400],
  tabBarInactive: '#6B7280',

  // Misc
  overlay: 'rgba(0, 0, 0, 0.5)',
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',

  // Chart
  chartLine: PrimaryGreen[400],
  chartGrid: '#2D4644',
} as const;

type ColorScheme = { [K in keyof typeof DarkColors]: string };

const LightColors: ColorScheme = {
  // Background
  background: '#F5F7F6',
  surface: '#FFFFFF',
  surfaceLight: PrimaryGreen[50],
  surfaceElevated: '#FFFFFF',

  // Card
  card: '#FFFFFF',
  cardDark: '#F5F7F6',
  cardLight: '#FFFFFF',

  // Primary (Green - 좀 더 진한 톤으로)
  primary: PrimaryGreen[500],
  primaryDark: PrimaryGreen[600],
  primaryMuted: PrimaryGreen[100],
  primaryBg: `${PrimaryGreen[500]}12`,
  primaryBgStrong: `${PrimaryGreen[500]}1A`,

  // Text
  textPrimary: DarkGreen[950],
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textDark: DarkGreen[950],
  textGreen: PrimaryGreen[500],
  textRed: '#DC2626',

  // Status
  success: PrimaryGreen[500],
  error: '#DC2626',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Border
  border: '#E5E7EB',
  borderLight: '#E5E7EB',
  borderMuted: '#D1D5DB',

  // Button
  buttonPrimary: PrimaryGreen[500],
  buttonPrimaryText: '#FFFFFF',
  buttonSecondary: PrimaryGreen[50],
  buttonSecondaryText: PrimaryGreen[600],
  buttonEnabled: '#9CA3AF',
  buttonDisabled: '#E5E7EB',
  buttonDisabledText: '#9CA3AF',

  // Alert banner
  alertBg: `${PrimaryGreen[500]}0F`,
  alertBorder: `${PrimaryGreen[500]}26`,

  // Tab bar
  tabBarBg: '#FFFFFF',
  tabBarActive: PrimaryGreen[500],
  tabBarInactive: '#9CA3AF',

  // Misc
  overlay: 'rgba(0, 0, 0, 0.3)',
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',

  // Chart
  chartLine: PrimaryGreen[500],
  chartGrid: '#E5E7EB',
} as const;

// Default export (dark) for static usage
export const Colors = DarkColors;

export const ThemeColors = {
  dark: DarkColors,
  light: LightColors,
} as const;

// 팔레트 export
export const Palette = {
  PrimaryGreen,
  DarkGreen,
} as const;

export type ColorKeys = keyof typeof Colors;
