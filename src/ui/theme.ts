import { useColorScheme } from 'react-native';

export interface Palette {
  scheme: 'light' | 'dark';
  bg: string;
  bgElevated: string;
  surface: string;
  surfaceAlt: string;
  hairline: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentText: string;
  danger: string;
  /** タイル等に白グリフを乗せる上で安全なオーバーレイ。 */
  glyph: string;
  /** スクリム（モーダル背景）。 */
  scrim: string;
}

const dark: Palette = {
  scheme: 'dark',
  bg: '#0B0B0F',
  bgElevated: '#121218',
  surface: '#17171F',
  surfaceAlt: '#20202A',
  hairline: 'rgba(255,255,255,0.09)',
  textPrimary: '#F4F4F7',
  textSecondary: 'rgba(235,235,245,0.62)',
  textTertiary: 'rgba(235,235,245,0.32)',
  accent: '#FF6A1A',
  accentText: '#FFFFFF',
  danger: '#FF5A4E',
  glyph: '#FFFFFF',
  scrim: 'rgba(0,0,0,0.55)',
};

const light: Palette = {
  scheme: 'light',
  bg: '#F4F4F6',
  bgElevated: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#EEEEF1',
  hairline: 'rgba(0,0,0,0.08)',
  textPrimary: '#15151A',
  textSecondary: 'rgba(60,60,67,0.62)',
  textTertiary: 'rgba(60,60,67,0.32)',
  accent: '#FF6A1A',
  accentText: '#FFFFFF',
  danger: '#E5392C',
  glyph: '#FFFFFF',
  scrim: 'rgba(0,0,0,0.4)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  pill: 999,
} as const;

export const typography = {
  /** 大きな等幅数字（タイマー・ダイヤル中央）。 */
  display: {
    fontVariant: ['tabular-nums'] as const,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  mono: {
    fontVariant: ['tabular-nums'] as const,
    fontWeight: '600' as const,
  },
  title: { fontSize: 20, fontWeight: '700' as const, letterSpacing: 0.2 },
  body: { fontSize: 15, fontWeight: '500' as const },
  label: { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.3 },
  caption: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.4 },
} as const;

export interface Theme {
  c: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  isDark: boolean;
}

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const isDark = scheme !== 'light';
  return {
    c: isDark ? dark : light,
    spacing,
    radius,
    typography,
    isDark,
  };
}

export { dark as darkPalette, light as lightPalette };
