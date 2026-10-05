import { useEffect } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

/** A shimmering placeholder block. */
export function Skeleton({ width = '100%', height = 14, borderRadius = radius.sm, style }: SkeletonProps) {
  const pulse = useAnimatedValue(0.35);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.8, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: colors.surfaceMuted, opacity: pulse }, style]}
    />
  );
}

/** Mirrors the layout of the result card while the analysis runs. */
export function ResultSkeleton() {
  return (
    <View style={styles.card} accessibilityLabel="Loading analysis" accessible>
      <Skeleton width="35%" height={11} />
      <Skeleton width="70%" height={28} style={styles.gapSm} />
      <View style={[styles.row, styles.gapLg]}>
        <Skeleton width={96} height={28} borderRadius={radius.pill} />
        <Skeleton width={110} height={28} borderRadius={radius.pill} />
      </View>
      <View style={[styles.row, styles.gapLg]}>
        <Skeleton height={64} borderRadius={radius.md} style={styles.flex} />
        <Skeleton height={64} borderRadius={radius.md} style={styles.flex} />
      </View>
      <Skeleton width="45%" height={11} style={styles.gapXl} />
      <Skeleton height={12} style={styles.gapSm} />
      <Skeleton height={12} style={styles.gapSm} />
      <Skeleton width="80%" height={12} style={styles.gapSm} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  gapSm: { marginTop: spacing.sm },
  gapLg: { marginTop: spacing.lg },
  gapXl: { marginTop: spacing.xl },
});
