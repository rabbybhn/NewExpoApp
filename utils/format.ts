import { colors } from '@/constants/theme';
import type { CareDifficulty, ToxicityLevel } from '@/services/types';

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const difficultyColor: Record<CareDifficulty, string> = {
  Easy: colors.leaf,
  Moderate: colors.teal,
  Challenging: colors.sun,
  Expert: colors.bloom,
};

export const toxicityColor: Record<ToxicityLevel, string> = {
  'Non-toxic': colors.leaf,
  'Mildly toxic': colors.sun,
  Toxic: colors.danger,
  'Highly toxic': colors.danger,
  Unknown: colors.textMuted,
};

export function confidenceColor(confidence: number): string {
  if (confidence >= 75) return colors.leaf;
  if (confidence >= 45) return colors.sun;
  return colors.danger;
}
