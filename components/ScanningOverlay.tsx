import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { colors, font, radius, spacing } from '@/constants/theme';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';

const MESSAGES = [
  'Analyzing leaf structure…',
  'Examining venation & margins…',
  'Reading flower & stem traits…',
  'Comparing against known species…',
  'Checking toxicity data…',
  'Preparing a care guide…',
];

interface Props {
  height: number;
}

/** Laser sweep + rotating status text drawn over the photo while it's analyzed. */
export function ScanningOverlay({ height }: Props) {
  const sweep = useAnimatedValue(0);
  const fade = useAnimatedValue(1);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(sweep, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [sweep]);

  useEffect(() => {
    const id = setInterval(() => {
      Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setIndex((i) => (i + 1) % MESSAGES.length);
        Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    }, 1900);
    return () => clearInterval(id);
  }, [fade]);

  const translateY = sweep.interpolate({ inputRange: [0, 1], outputRange: [0, height - 4] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, styles.tint]} />
      <Animated.View style={[styles.laserWrap, { transform: [{ translateY }] }]}>
        <LinearGradient
          colors={['transparent', 'rgba(74, 222, 128, 0.35)']}
          style={styles.trail}
        />
        <View style={styles.laser} />
      </Animated.View>
      <View style={styles.statusWrap}>
        <View style={styles.status}>
          <View style={styles.dot} />
          <Animated.Text style={[styles.statusText, { opacity: fade }]} accessibilityLiveRegion="polite">
            {MESSAGES[index]}
          </Animated.Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tint: { backgroundColor: 'rgba(11, 16, 13, 0.25)' },
  laserWrap: { position: 'absolute', left: 0, right: 0, top: -36 },
  trail: { height: 36 },
  laser: {
    height: 3,
    backgroundColor: colors.leaf,
    shadowColor: colors.leaf,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  statusWrap: { position: 'absolute', left: 0, right: 0, bottom: spacing.lg, alignItems: 'center' },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.overlay,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.leaf },
  statusText: { ...font.label, color: colors.text },
});
