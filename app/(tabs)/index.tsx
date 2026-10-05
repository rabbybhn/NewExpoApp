import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, type FlashMode } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useIsFocused } from 'expo-router';
import { useCallback, useRef, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { ScanTag } from '@/components/ScanTag';
import { colors, fonts, spacing, type } from '@/constants/theme';
import { useCredits } from '@/context/CreditsContext';
import type { PressState } from '@/utils/pressable';

const FLASH_CYCLE: FlashMode[] = ['off', 'on', 'auto'];
const FLASH_LABEL: Record<string, string> = { off: 'Flash off', on: 'Flash on', auto: 'Flash auto' };

export default function IdentifyScreen() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState<FlashMode>('off');
  const [cameraReady, setCameraReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const { credits, showPaywall } = useCredits();

  // The camera unmounts when the tab loses focus; wait for it to report ready again.
  useFocusEffect(useCallback(() => () => setCameraReady(false), []));

  const ensureCredits = () => {
    if (credits === null) return false;
    if (credits <= 0) {
      showPaywall();
      return false;
    }
    return true;
  };

  const openResult = (uri: string) => router.push({ pathname: '/result', params: { uri } });

  const capture = async () => {
    if (busy || !cameraReady || !ensureCredits()) return;
    setBusy(true);
    try {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const photo = await camera.current?.takePictureAsync({ quality: 0.85 });
      if (!photo?.uri) throw new Error('No photo returned');
      openResult(photo.uri);
    } catch {
      Alert.alert('Photo not taken', 'The camera didn’t return a photo. Try again, or choose one from your library.');
    } finally {
      setBusy(false);
    }
  };

  const pickFromLibrary = async () => {
    if (busy || !ensureCredits()) return;
    setBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 1 });
      const asset = result.canceled ? undefined : result.assets[0];
      if (asset) openResult(asset.uri);
    } catch {
      Alert.alert('Library unavailable', 'PlantID can’t open your photos. Allow photo access in Settings.');
    } finally {
      setBusy(false);
    }
  };

  const cycleFlash = () => setFlash((f) => FLASH_CYCLE[(FLASH_CYCLE.indexOf(f) + 1) % FLASH_CYCLE.length]);

  if (!permission) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.paper} />
      </View>
    );
  }

  if (!permission.granted) {
    const blocked = !permission.canAskAgain;
    return (
      <View style={[styles.center, styles.permission, { paddingTop: insets.top }]}>
        <Text style={styles.permissionTitle}>Point your camera at a plant</Text>
        <Text style={styles.permissionBody}>
          {blocked
            ? 'Camera access is off for PlantID. Turn it on in Settings, or choose a photo from your library.'
            : 'PlantID needs the camera to photograph leaves and flowers. A photo is only sent for analysis when you tap Identify.'}
        </Text>
        <Button
          label={blocked ? 'Open Settings' : 'Allow camera'}
          icon={blocked ? 'settings' : 'camera'}
          onPress={blocked ? () => Linking.openSettings() : requestPermission}
          style={styles.permissionButton}
        />
        <Button
          label="Choose from library"
          icon="image"
          variant="outline"
          onPress={pickFromLibrary}
          style={styles.permissionButton}
        />
      </View>
    );
  }

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
            Alert.alert('Camera unavailable', 'The camera didn’t start. Choose a photo from your library instead.')
          }
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.prussian }]} />
      )}

      <LinearGradient
        colors={['rgba(15, 39, 66, 0.85)', 'transparent']}
        style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}
      >
        <Text style={styles.brand}>PlantID</Text>
        <ScanTag onPress={() => router.push('/store')} />
      </LinearGradient>

      <View style={styles.frameWrap} pointerEvents="none">
        <View style={styles.frame}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
        <Text style={styles.hint}>Fill the frame with one leaf or flower</Text>
      </View>

      <LinearGradient colors={['transparent', 'rgba(15, 39, 66, 0.92)']} style={styles.bottomBar}>
        <SideButton icon="image" label="Library" onPress={pickFromLibrary} disabled={busy} />

        <View style={styles.shutterColumn}>
          <Pressable
            onPress={capture}
            disabled={busy || !cameraReady}
            accessibilityRole="button"
            accessibilityLabel="Identify plant"
            style={({ pressed, focused }: PressState) => [
              styles.shutter,
              pressed && { transform: [{ scale: 0.95 }] },
              focused && styles.focused,
            ]}
          >
            {busy ? (
              <ActivityIndicator color={colors.ink} />
            ) : (
              <Feather name="aperture" size={30} color={colors.ink} />
            )}
          </Pressable>
          <Text style={styles.shutterLabel}>Identify</Text>
        </View>

        <SideButton
          icon={flash === 'off' ? 'zap-off' : 'zap'}
          label={FLASH_LABEL[flash]}
          onPress={cycleFlash}
          active={flash !== 'off'}
        />
      </LinearGradient>
    </View>
  );
}

function SideButton({
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
      style={({ pressed }) => [styles.side, { opacity: disabled ? 0.5 : pressed ? 0.7 : 1 }]}
    >
      <View style={[styles.sideCircle, active && styles.sideActive]}>
        <Feather name={icon} size={20} color={active ? colors.ink : colors.paper} />
      </View>
      <Text style={styles.sideLabel}>{label}</Text>
    </Pressable>
  );
}

const FRAME = 264;
const CORNER = 28;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.prussian },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.prussian },

  permission: { paddingHorizontal: spacing.xl, alignItems: 'stretch' },
  permissionTitle: { ...type.title, fontSize: 32, lineHeight: 38, color: colors.paper },
  permissionBody: { ...type.body, color: colors.wash, marginTop: spacing.md, marginBottom: spacing.xl },
  permissionButton: { marginTop: spacing.sm },

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
  brand: { fontFamily: fonts.displayItalic, fontSize: 26, color: colors.paper },

  frameWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  frame: { width: FRAME, height: FRAME * 1.2 },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: colors.paper },
  tl: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 },
  tr: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 },
  br: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },
  hint: {
    ...type.mono,
    fontSize: 13,
    color: colors.paper,
    marginTop: spacing.lg,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.scrim,
  },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingTop: spacing.xxl * 2,
    paddingBottom: spacing.xl,
  },
  shutterColumn: { alignItems: 'center', gap: spacing.sm },
  shutter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
    borderWidth: 5,
    borderColor: colors.wash,
  },
  shutterLabel: { ...type.button, fontSize: 14, color: colors.paper },
  focused: { outlineColor: colors.citrate, outlineWidth: 2, outlineOffset: 3, outlineStyle: 'solid' },
  side: { alignItems: 'center', gap: spacing.sm, width: 84, paddingTop: 14 },
  sideCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.scrim,
    borderWidth: 1,
    borderColor: 'rgba(238, 242, 239, 0.3)',
  },
  sideActive: { backgroundColor: colors.paper },
  sideLabel: { ...type.small, color: colors.wash },
});
