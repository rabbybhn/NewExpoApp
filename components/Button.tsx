import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing, type } from '@/constants/theme';
import type { PressState } from '@/utils/pressable';

/**
 * - `paper`: primary action on the blue ground.
 * - `outline`: secondary action on the blue ground.
 * - `ink`: primary action on a paper sheet.
 * - `inkOutline`: secondary action on a paper sheet.
 */
type Variant = 'paper' | 'outline' | 'ink' | 'inkOutline';

const VARIANTS: Record<Variant, { bg: string; fg: string; border: string }> = {
  paper: { bg: colors.paper, fg: colors.ink, border: colors.paper },
  outline: { bg: 'transparent', fg: colors.paper, border: 'rgba(238, 242, 239, 0.4)' },
  ink: { bg: colors.ink, fg: colors.paper, border: colors.ink },
  inkOutline: { bg: 'transparent', fg: colors.ink, border: colors.inkLine },
};

interface Props {
  label: string;
  onPress: () => void;
  icon?: ComponentProps<typeof Feather>['name'];
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, onPress, icon, variant = 'paper', loading = false, disabled = false, style }: Props) {
  const v = VARIANTS[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed, focused }: PressState) => [
        styles.base,
        { backgroundColor: v.bg, borderColor: v.border, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 },
        focused && styles.focused,
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color={v.fg} />
        ) : (
          icon && <Feather name={icon} size={18} color={v.fg} />
        )}
        <Text style={[type.button, { color: v.fg }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.control,
    borderWidth: 1.5,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  focused: { outlineColor: colors.citrate, outlineWidth: 2, outlineOffset: 2, outlineStyle: 'solid' },
});
