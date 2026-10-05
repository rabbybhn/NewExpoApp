import { colors } from '@/constants/theme';
import type { ToxicityLevel } from '@/services/types';

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Toxicity colour on the blue ground: citrate is safe, ferric is any level of harm. */
export const toxicityColor: Record<ToxicityLevel, string> = {
  'Non-toxic': colors.citrate,
  'Mildly toxic': colors.ferric,
  Toxic: colors.ferric,
  'Highly toxic': colors.ferric,
  Unknown: colors.wash,
};
