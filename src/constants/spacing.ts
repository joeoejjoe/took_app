export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 10,   // Card default radius (디자인 Radius → 10)
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

// Card specific dimensions from design reference
export const CardSpec = {
  borderRadius: 10,
  paddingHorizontal: 16,  // 16px 고정
  paddingVertical: 12,    // 10px 이상
  minPadding: 10,
} as const;

// Screen layout
export const Layout = {
  screenPaddingHorizontal: 20,
  screenPaddingTop: 16,
  sectionGap: 24,
  cardGap: 12,
  tabBarHeight: 85,
  tabBarPaddingBottom: 25,
} as const;
