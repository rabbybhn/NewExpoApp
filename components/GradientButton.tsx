import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, font, gradients, radius, shadow, spacing } from '@/constants/theme';

type Variant = 'leaf' | 'forest' | 'bloom' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  icon?: ComponentProps<typeof Feather>['name'];
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function GradientButton({
  label,
  onPress,
  icon,
  variant = 'leaf',
  loading = false,
  disabled = false,
  style,
}: Props) {
  const inactive = disabled || loading;
  const content = loading ? (
    <ActivityIndicator color={variant === 'leaf' ? colors.background : colors.white} />
  ) : (
    <>
      {icon && <Feather name={icon} size={18} color={variant === 'leaf' ? colors.background : colors.white} />}
      <Text style={[styles.label, variant === 'leaf' && { color: colors.background }]}>{label}</Text>
    </>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.wrapper,
        variant !== 'ghost' && shadow(variant === 'bloom' ? colors.bloom : colors.leaf, 10),
        { opacity: disabled ? 0.45 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        style,
      ]}
    >
      {variant === 'ghost' ? (
        <View style={[styles.inner, styles.ghost]}>{content}</View>
      ) : (
        <LinearGradient
          colors={gradients[variant]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.inner}
        >
          {content}
        </LinearGradient>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderRadius: radius.lg },
  inner: {
    minHeight: 54,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  ghost: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  label: { ...font.heading, color: colors.white },
});
