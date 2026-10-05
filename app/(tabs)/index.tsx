import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, type FlashMode } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useIsFocused } from 'expo-router';
import { useCallback, useRef, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CreditPill } from '@/components/CreditPill';
import { GradientButton } from '@/components/GradientButton';
import { colors, font, gradients, radius, spacing } from '@/constants/theme';
import { useCredits } from '@/context/CreditsContext';

const FLASH_CYCLE: FlashMode[] = ['off', 'on', 'auto'];
const FLASH_ICON: Record<string, ComponentProps<typeof Feather>['name']> = {
  off: 'zap-off',
  on: 'zap',
  auto: 'zap',
};

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState<FlashMode>('off');
  const [cameraReady, setCameraReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const { credits, showPaywall } = useCredits();

  // The camera unmounts when the tab loses focus; wait for it to report ready again.
  useFocusEffect(
    useCallback(() => () => setCameraReady(false), []),
  );

  const ensureCredits = () => {
    if (credits === null) return false;
    if (credits <= 0) {
      showPaywall();
      return false;
    }
    return true;
  };

  const openResult = (uri: string, width?: number, height?: number) => {
    router.push({
      pathname: '/result',
      params: { uri, width: width ? String(width) : '', height: height ? String(height) : '' },
    });
  };

  const capture = async () => {
    if (busy || !cameraReady || !ensureCredits()) return;
    setBusy(true);
    try {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const photo = await camera.current?.takePictureAsync({ quality: 0.85 });
      if (!photo?.uri) throw new Error('No photo returned');
      openResult(photo.uri, photo.width, photo.height);
    } catch {
      Alert.alert('Capture failed', 'We couldn’t take that photo. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const pickFromLibrary = async () => {
    if (busy || !ensureCredits()) return;
    setBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
      });
      const asset = result.canceled ? undefined : result.assets[0];
      if (asset) openResult(asset.uri, asset.width, asset.height);
    } catch {
      Alert.alert('Photo library unavailable', 'We couldn’t open your photo library. Check app permissions.');
    } finally {
      setBusy(false);
    }
  };

  const cycleFlash = () => {
    setFlash((f) => FLASH_CYCLE[(FLASH_CYCLE.indexOf(f) + 1) % FLASH_CYCLE.length]);
  };

  // --- Permission states -------------------------------------------------------------------

  if (!permission) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.leaf} />
      </View>
    );
  }

  if (!permission.granted) {
    const blocked = !permission.canAskAgain;
    return (
      <View style={[styles.center, styles.permission, { paddingTop: insets.top }]}>
        <LinearGradient colors={gradients.leaf} style={styles.permissionIcon}>
          <Feather name="camera" size={34} color={colors.background} />
        </LinearGradient>
        <Text style={styles.permissionTitle}>Let’s meet your plants</Text>
        <Text style={styles.permissionBody}>
          PlantID needs camera access to photograph leaves, flowers and trees.
          {blocked ? ' Camera access is turned off — enable it in Settings to continue.' : ''}
        </Text>
        <GradientButton
          label={blocked ? 'Open Settings' : 'Allow camera'}
          icon={blocked ? 'settings' : 'camera'}
          onPress={blocked ? () => Linking.openSettings() : requestPermission}
          style={styles.permissionButton}
        />
        <Pressable onPress={pickFromLibrary} style={styles.linkButton} hitSlop={8}>
          <Feather name="image" size={16} color={colors.textSecondary} />
          <Text style={styles.linkText}>Choose from library instead</Text>
        </Pressable>
      </View>
    );
  }

  // --- Camera ------------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      {isFocused ? (
        <CameraView
          ref={camera}
          style={StyleSheet.absoluteFill}
          facing="back"
          flash={flash}
          onCameraReady={() => setCameraReady(true)}
          onMountError={() =>
            Alert.alert('Camera unavailable', 'The camera could not start. You can still pick a photo from your library.')
          }
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
      )}

      <LinearGradient colors={gradients.fadeTop} style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.brand}>
          <Feather name="feather" size={20} color={colors.leaf} />
          <Text style={styles.brandText}>PlantID</Text>
        </View>
        <CreditPill onPress={() => router.push('/store')} />
      </LinearGradient>

      <View style={styles.frameWrap} pointerEvents="none">
        <View style={styles.frame}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
        <Text style={styles.hint}>Center a leaf, flower or whole plant in the frame</Text>
      </View>

      <LinearGradient colors={gradients.fadeBottom} style={[styles.bottomBar, { paddingBottom: spacing.xl }]}>
        <RoundButton icon="image" label="Library" onPress={pickFromLibrary} disabled={busy} />

        <Pressable
          onPress={capture}
          disabled={busy || !cameraReady}
          accessibilityRole="button"
          accessibilityLabel="Scan plant"
          style={({ pressed }) => [styles.shutterOuter, pressed && { transform: [{ scale: 0.94 }] }]}
        >
          <LinearGradient colors={gradients.leaf} style={styles.shutterInner}>
            {busy ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Feather name="aperture" size={30} color={colors.background} />
            )}
          </LinearGradient>
        </Pressable>

        <RoundButton
          icon={FLASH_ICON[flash]}
          label={flash === 'auto' ? 'Auto' : flash === 'on' ? 'On' : 'Off'}
          onPress={cycleFlash}
          active={flash !== 'off'}
        />
      </LinearGradient>
      <Text style={styles.shutterLabel} pointerEvents="none">
        Scan Plant
      </Text>
    </View>
  );
}

function RoundButton({
  icon,
  label,
  onPress,
  disabled,
  active,
}: {
  icon: ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.roundWrap, { opacity: disabled ? 0.5 : pressed ? 0.7 : 1 }]}
    >
      <View style={[styles.round, active && styles.roundActive]}>
        <Feather name={icon} size={22} color={active ? colors.sun : colors.text} />
      </View>
      <Text style={styles.roundLabel}>{label}</Text>
    </Pressable>
  );
}

const FRAME = 260;
const CORNER = 34;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },

  permission: { paddingHorizontal: spacing.xxl },
  permissionIcon: {
    width: 84,
    height: 84,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  permissionTitle: { ...font.title, color: colors.text, textAlign: 'center' },
  permissionBody: { ...font.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  permissionButton: { marginTop: spacing.xl, alignSelf: 'stretch' },
  linkButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  linkText: { ...font.label, color: colors.textSecondary },

  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  brandText: { ...font.heading, fontSize: 20, color: colors.text },

  frameWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  frame: { width: FRAME, height: FRAME },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: colors.leaf },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: radius.lg },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: radius.lg },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: radius.lg },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: radius.lg },
  hint: {
    ...font.label,
    color: colors.text,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.overlay,
    overflow: 'hidden',
  },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: spacing.xxl + spacing.lg,
  },
  shutterOuter: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.85)',
    padding: 4,
    marginBottom: spacing.xl,
  },
  shutterInner: { flex: 1, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  shutterLabel: {
    ...font.overline,
    position: 'absolute',
    bottom: spacing.md,
    alignSelf: 'center',
    color: colors.text,
  },
  roundWrap: { alignItems: 'center', gap: 6, marginBottom: spacing.xl },
  round: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  roundActive: { borderColor: colors.sun },
  roundLabel: { ...font.caption, color: colors.textSecondary },
});
