import { useEffect } from 'react';
import { Animated, Easing, StyleSheet, View, type DimensionValue } from 'react-native';

import { colors, spacing } from '@/constants/theme';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/** Placeholder lines on the paper sheet while the label is being "typed". */
export function SheetSkeleton() {
  const reducedMotion = useReducedMotion();
  const pulse = useAnimatedValue(0.5);

  useEffect(() => {
    if (reducedMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reducedMotion]);

  const line = (width: DimensionValue, height: number, marginTop = 0) => (
    <View style={[styles.line, { width, height, marginTop }]} />
  );

  return (
    <Animated.View style={{ opacity: pulse }} accessible accessibilityLabel="Identifying plant">
      {line('72%', 30)}
      {line('48%', 16, spacing.sm)}
      <View style={styles.label}>
        {line('34%', 10)}
        {line('90%', 12, spacing.md)}
        {line('80%', 12, spacing.sm)}
        {line('86%', 12, spacing.sm)}
        {line('60%', 12, spacing.sm)}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  line: { backgroundColor: colors.inkLine, borderRadius: 2 },
  label: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.inkLine,
  },
});
