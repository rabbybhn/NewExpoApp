import type { PressableStateCallbackType } from 'react-native';

/**
 * react-native-web also reports keyboard focus to Pressable's style callback, which the
 * native typings omit. Used to draw a visible focus ring for keyboard users on web.
 */
export type PressState = PressableStateCallbackType & { focused?: boolean };
