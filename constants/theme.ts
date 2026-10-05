import { Platform, type ViewStyle } from 'react-native';

/**
 * "Greenhouse at night" palette — deep forest-charcoal surfaces with leaf-green and bloom accents.
 */
export const colors = {
  background: '#0B100D',
  surface: '#131A15',
  surfaceRaised: '#1A231D',
  surfaceMuted: '#233027',
  border: '#25322A',
  borderStrong: '#34453A',

  text: '#F1F7F2',
  textSecondary: '#AFC0B4',
  textMuted: '#738578',

  leaf: '#4ADE80',
  leafDeep: '#15803D',
  leafSoft: 'rgba(74, 222, 128, 0.15)',
  teal: '#2DD4BF',
  bloom: '#F472B6',
  bloomSoft: 'rgba(244, 114, 182, 0.15)',
  sun: '#FBBF24',
  sunSoft: 'rgba(251, 191, 36, 0.15)',
  water: '#60A5FA',
  waterSoft: 'rgba(96, 165, 250, 0.15)',
  danger: '#F87171',
  dangerSoft: 'rgba(248, 113, 113, 0.15)',

  overlay: 'rgba(6, 10, 8, 0.72)',
  white: '#FFFFFF',
} as const;

export const gradients = {
  leaf: [colors.leaf, colors.teal] as const,
  forest: ['#22C55E', colors.leafDeep] as const,
  bloom: [colors.bloom, '#C026D3'] as const,
  fadeBottom: ['transparent', 'rgba(11, 16, 13, 0.92)'] as const,
  fadeTop: ['rgba(11, 16, 13, 0.75)', 'transparent'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const font = {
  display: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  heading: { fontSize: 17, fontWeight: '700' },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  label: { fontSize: 13, fontWeight: '600' },
  caption: { fontSize: 12, fontWeight: '500' },
  overline: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
} as const;

export function shadow(color: string = '#000', elevation = 8): ViewStyle {
  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: color,
      shadowOpacity: 0.35,
      shadowRadius: elevation * 1.5,
      shadowOffset: { width: 0, height: elevation / 2 },
    },
    android: { elevation },
    default: { boxShadow: `0px ${elevation / 2}px ${elevation * 1.5}px ${color}59` },
  }) as ViewStyle;
}
