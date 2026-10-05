import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, ferricOnPaper, radius, spacing, type } from '@/constants/theme';
import { useCredits } from '@/context/CreditsContext';

interface Props {
  onPress?: () => void;
}

/** Typed paper tag showing the scan balance. */
export function ScanTag({ onPress }: Props) {
  const { credits } = useCredits();
  const empty = credits === 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={credits === null ? 'Loading scans' : `${credits} scans left. Get more scans`}
      hitSlop={8}
      style={({ pressed }) => [styles.tag, pressed && { opacity: 0.8 }]}
    >
      {credits === null ? (
        <ActivityIndicator size="small" color={colors.ink} />
      ) : (
        <Text style={[styles.text, empty && { color: ferricOnPaper }]}>
          {credits} {credits === 1 ? 'scan' : 'scans'} left
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sheet,
    backgroundColor: colors.paper,
  },
  text: { ...type.monoCaps, fontSize: 12, color: colors.ink },
});
