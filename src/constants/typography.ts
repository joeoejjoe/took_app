import { TextStyle } from 'react-native';
import { Colors } from './colors';

export const FontWeight = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
  extrabold: '800' as TextStyle['fontWeight'],
};

export const Typography = {
  // Headings
  h1: {
    fontSize: 36,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    lineHeight: 44,
  } as TextStyle,

  h2: {
    fontSize: 30,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    lineHeight: 38,
  } as TextStyle,

  h3: {
    fontSize: 24,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    lineHeight: 32,
  } as TextStyle,

  h4: {
    fontSize: 20,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    lineHeight: 28,
  } as TextStyle,

  // Body
  bodyLarge: {
    fontSize: 18,
    fontWeight: FontWeight.regular,
    color: Colors.textPrimary,
    lineHeight: 26,
  } as TextStyle,

  body: {
    fontSize: 16,
    fontWeight: FontWeight.regular,
    color: Colors.textPrimary,
    lineHeight: 24,
  } as TextStyle,

  bodySmall: {
    fontSize: 14,
    fontWeight: FontWeight.regular,
    color: Colors.textSecondary,
    lineHeight: 20,
  } as TextStyle,

  // Labels
  label: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    lineHeight: 20,
  } as TextStyle,

  labelSmall: {
    fontSize: 12,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    lineHeight: 16,
  } as TextStyle,

  // Special
  amount: {
    fontSize: 36,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    lineHeight: 44,
  } as TextStyle,

  amountMedium: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    lineHeight: 32,
  } as TextStyle,

  amountSmall: {
    fontSize: 18,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    lineHeight: 24,
  } as TextStyle,

  caption: {
    fontSize: 12,
    fontWeight: FontWeight.regular,
    color: Colors.textMuted,
    lineHeight: 16,
  } as TextStyle,

  percentage: {
    fontSize: 14,
    fontWeight: FontWeight.semibold,
    color: Colors.textGreen,
    lineHeight: 20,
  } as TextStyle,
} as const;
