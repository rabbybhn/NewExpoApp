import { StyleSheet, Text, View } from 'react-native';

import { colors, ferricOnPaper, spacing, type } from '@/constants/theme';
import type { PlantIdentification } from '@/services/types';
import { formatDate } from '@/utils/format';

const SEGMENTS = 10;

/** Typewriter-style confidence meter: ■■■■■■■■■□ */
function confidenceBar(confidence: number): string {
  const filled = Math.round((confidence / 100) * SEGMENTS);
  return '■'.repeat(filled) + '□'.repeat(SEGMENTS - filled);
}

interface Props {
  result: PlantIdentification;
  determinedAt: number;
}

/** The typed determination slip pinned to the bottom of every herbarium sheet. */
export function HerbariumLabel({ result, determinedAt }: Props) {
  const low = result.confidence < 50;
  const rows: [string, string][] = [
    ['Fam.', result.family],
    ['Habit', result.plant_type],
    ['Native', result.native_region],
  ];

  return (
    <View style={styles.outer}>
      <View style={styles.inner}>
        <Text style={styles.heading}>Determination</Text>
        {rows.map(([key, value]) => (
          <View key={key} style={styles.row}>
            <Text style={styles.key}>{key}</Text>
            <Text style={styles.value}>{value}</Text>
          </View>
        ))}
        <View
          style={styles.row}
          accessible
          accessibilityLabel={`Confidence ${result.confidence} percent${low ? ', low' : ''}`}
        >
          <Text style={styles.key}>Conf.</Text>
          <Text style={[styles.value, low && { color: ferricOnPaper }]}>
            {confidenceBar(result.confidence)} {result.confidence}%
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.key}>Det.</Text>
          <Text style={styles.value}>PlantID, {formatDate(determinedAt)}</Text>
        </View>
        {low && (
          <Text style={styles.lowNote}>
            Low confidence. Photograph a single leaf or flower in good light for a closer match.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Double rule, as on printed herbarium labels.
  outer: { borderWidth: 1, borderColor: colors.ink, padding: 3 },
  inner: { borderWidth: 0.5, borderColor: colors.ink, padding: spacing.md, gap: 4 },
  heading: { ...type.monoCaps, color: colors.ink, marginBottom: 4 },
  row: { flexDirection: 'row', gap: spacing.sm },
  key: { ...type.mono, color: colors.inkMuted, width: 58 },
  value: { ...type.mono, color: colors.ink, flex: 1 },
  lowNote: { ...type.small, color: ferricOnPaper, marginTop: spacing.sm },
});
