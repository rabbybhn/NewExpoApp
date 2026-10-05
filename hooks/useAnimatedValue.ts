import { useState } from 'react';
import { Animated } from 'react-native';

/**
 * Stable `Animated.Value` for the component's lifetime. React Native ships its own
 * `useAnimatedValue`, but react-native-web doesn't, so we use this cross-platform version.
 */
export function useAnimatedValue(initialValue: number): Animated.Value {
  const [value] = useState(() => new Animated.Value(initialValue));
  return value;
}
