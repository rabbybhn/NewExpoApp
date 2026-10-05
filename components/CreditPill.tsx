import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, font, radius, spacing } from '@/constants/theme';
import { useCredits } from '@/context/CreditsContext';

interface Props {
  onPress?: () => void;
}

export function CreditPill({ onPress }: Props) {
  const { credits } = useCredits();
  const empty = credits === 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={credits === null ? 'Loading scans' : `${credits} scans remaining`}
      hitSlop={8}
      style={({ pressed }) => [styles.pill, empty && styles.pillEmpty, pressed && { opacity: 0.8 }]}
    >
      <Feather name="zap" size={14} color={empty ? colors.danger : colors.sun} />
      {credits === null ? (
        <ActivityIndicator size="small" color={colors.text} />
      ) : (
        <Text style={styles.text}>
          {credits} {credits === 1 ? 'scan' : 'scans'}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.overlay,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  pillEmpty: { borderColor: colors.danger },
  text: { ...font.label, color: colors.text },
});
