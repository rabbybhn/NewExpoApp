import { useEffect, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, spacing, type } from '@/constants/theme';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * The cyanotype wash: the photo keeps its light and shadow but takes on Prussian-blue hue,
 * the way Atkins' specimens printed. `mixBlendMode: 'color'` does the toning; the
 * multiply layer deepens the blacks into print blue.
 */
const MULTIPLY_STRENGTH = 0.28;

/**
 * `strength` fades the wash in and out. It's applied to each blend layer individually:
 * wrapping the layers in a faded group would isolate them from the photo and stop the blend.
 */
function Wash({ strength = 1 }: { strength?: number | Animated.Value }) {
  const multiply =
    typeof strength === 'number'
      ? strength * MULTIPLY_STRENGTH
      : strength.interpolate({ inputRange: [0, 1], outputRange: [0, MULTIPLY_STRENGTH] });
  return (
    <>
      <Animated.View style={[StyleSheet.absoluteFill, styles.washColor, { opacity: strength }]} pointerEvents="none" />
      <Animated.View style={[StyleSheet.absoluteFill, styles.washMultiply, { opacity: multiply }]} pointerEvents="none" />
    </>
  );
}

interface PrintProps {
  uri: string;
  style?: StyleProp<ViewStyle>;
}

/** A photo rendered permanently as a cyanotype print (collection plates). */
export function CyanotypePrint({ uri, style }: PrintProps) {
  return (
    <View style={[styles.frame, style]}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <Wash />
    </View>
  );
}

const EXPOSURE_NOTES = [
  'Exposing the print',
  'Reading leaf shape and margins',
  'Checking flowers and stems',
  'Comparing with known species',
  'Looking up care and toxicity',
];

interface DevelopingProps {
  uri: string;
  /** While false the photo sits under the wash; flipping to true develops it into full colour. */
  developed: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * The analysis moment: the photo waits as a blue print while an exposure line passes over it,
 * then develops into full colour when the identification arrives.
 */
export function DevelopingPhoto({ uri, developed, style }: DevelopingProps) {
  const reducedMotion = useReducedMotion();
  const wash = useAnimatedValue(1);
  const exposure = useAnimatedValue(0);
  const [height, setHeight] = useState(0);
  const [note, setNote] = useState(0);

  useEffect(() => {
    if (developed) {
      Animated.timing(wash, {
        toValue: 0,
        duration: reducedMotion ? 0 : 1400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }
    wash.setValue(1);
    if (reducedMotion) return;
    const loop = Animated.loop(
      Animated.timing(exposure, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [developed, reducedMotion, wash, exposure]);

  useEffect(() => {
    if (developed) return;
    const id = setInterval(() => setNote((n) => (n + 1) % EXPOSURE_NOTES.length), 2200);
    return () => clearInterval(id);
  }, [developed]);

  return (
    <View style={[styles.frame, style]} onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityIgnoresInvertColors />
      <Wash strength={wash} />
      {!developed && !reducedMotion && height > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.exposureLine,
            { transform: [{ translateY: exposure.interpolate({ inputRange: [0, 1], outputRange: [0, height] }) }] },
          ]}
        />
      )}
      {!developed && (
        <View style={styles.noteWrap} pointerEvents="none">
          <Text style={styles.note} accessibilityLiveRegion="polite">
            {EXPOSURE_NOTES[note]}…
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', backgroundColor: colors.print },
  washColor: { backgroundColor: colors.print, mixBlendMode: 'color' },
  washMultiply: { backgroundColor: colors.print, mixBlendMode: 'multiply' },
  exposureLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 2,
    backgroundColor: colors.paper,
    opacity: 0.85,
  },
  noteWrap: { position: 'absolute', left: spacing.md, bottom: spacing.md, right: spacing.md },
  note: {
    ...type.mono,
    fontSize: 13,
    color: colors.paper,
    alignSelf: 'flex-start',
    backgroundColor: colors.scrim,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
});
