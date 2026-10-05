import type { TextStyle } from 'react-native';

/**
 * "Cyanotype herbarium" — after Anna Atkins' 1843 cyanotype plates of botanical specimens:
 * Prussian-blue ground, cool herbarium paper, typed determination labels.
 */
export const colors = {
  /** Prussian blue — the app's ground. */
  prussian: '#0F2742',
  prussianRaised: '#163556',
  /** Cyanotype print blue — the wash laid over photos. */
  print: '#1F4F8F',
  /** Herbarium paper — cool white sheets and primary actions. */
  paper: '#EEF2EF',
  paperShade: '#DCE3E0',
  /** Pale wash — secondary text on blue. */
  wash: '#9DB8D6',
  washDim: '#6F8DB0',
  /** Ink on paper. */
  ink: '#0F2742',
  inkMuted: '#4A6280',
  /** Ferricyanide red — warnings and toxicity only. */
  ferric: '#E2643F',
  /** Ammonium citrate yellow-green — "safe" states only. */
  citrate: '#D4E28A',

  line: 'rgba(238, 242, 239, 0.14)',
  inkLine: 'rgba(15, 39, 66, 0.18)',
  tape: 'rgba(238, 242, 239, 0.72)',
  scrim: 'rgba(15, 39, 66, 0.78)',
} as const;

/** Ferric reads poorly as text on paper; this darker variant passes contrast there. */
export const ferricOnPaper = '#B8431F';
/** Citrate is invisible on paper; use this deeper green for "safe" text on paper. */
export const citrateOnPaper = '#4F6B12';

export const fonts = {
  display: 'BodoniModa_500Medium',
  displayItalic: 'BodoniModa_500Medium_Italic',
  body: 'AtkinsonHyperlegible_400Regular',
  bodyBold: 'AtkinsonHyperlegible_700Bold',
  mono: 'CourierPrime_400Regular',
  monoBold: 'CourierPrime_700Bold',
} as const;

/**
 * Type scale. Custom faces carry their own weight, so never combine these with `fontWeight`.
 * Bodoni is reserved for plant names and screen titles.
 */
export const type = {
  plantName: { fontFamily: fonts.display, fontSize: 36, lineHeight: 40, letterSpacing: -0.4 },
  latin: { fontFamily: fonts.displayItalic, fontSize: 19, lineHeight: 24 },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 33, letterSpacing: -0.2 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 24 },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  button: { fontFamily: fonts.bodyBold, fontSize: 16, letterSpacing: 0.2 },
  mono: { fontFamily: fonts.mono, fontSize: 14, lineHeight: 20 },
  monoCaps: { fontFamily: fonts.monoBold, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase' },
} satisfies Record<string, TextStyle>;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Paper is cut, not moulded: corners stay tight. */
export const radius = {
  sheet: 3,
  control: 6,
  round: 999,
} as const;
