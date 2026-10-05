import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { Animated, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientButton } from '@/components/GradientButton';
import { credits as creditConfig } from '@/constants/config';
import { colors, font, gradients, radius, shadow, spacing } from '@/constants/theme';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { useCredits } from '@/context/CreditsContext';

type Phase = 'offer' | 'processing' | 'success';

const PERKS: { icon: ComponentProps<typeof Feather>['name']; title: string; body: string }[] = [
  { icon: 'aperture', title: `${creditConfig.packSize} AI identifications`, body: 'Houseplants, flowers, trees & weeds' },
  { icon: 'droplet', title: 'Personal care guides', body: 'Light, water, soil & temperature' },
  { icon: 'shield', title: 'Pet & kid safety checks', body: 'Toxicity info for every plant' },
];

/** Simulated purchase delay so the flow feels like a real store sheet. */
const MOCK_PURCHASE_MS = 1600;

/**
 * Global paywall, driven by `useCredits().isPaywallVisible`. Mounted once in the root layout.
 *
 * This is a simulation: no payment is taken. Swap `purchase()` for a real IAP library
 * (e.g. RevenueCat or expo-iap) before shipping.
 */
export function PaywallModal() {
  const { isPaywallVisible, hidePaywall, addCredits, credits } = useCredits();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>('offer');
  const pop = useAnimatedValue(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );


  const purchase = () => {
    setPhase('processing');
    timer.current = setTimeout(async () => {
      await addCredits(creditConfig.packSize);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      setPhase('success');
      pop.setValue(0);
      Animated.spring(pop, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
    }, MOCK_PURCHASE_MS);
  };

  const close = () => {
    if (phase === 'processing') return;
    hidePaywall();
  };

  return (
    <Modal
      visible={isPaywallVisible}
      transparent
      animationType="slide"
      onRequestClose={close}
      onShow={() => setPhase('offer')}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Dismiss" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.md }]}>
          <View style={styles.handle} />

          {phase === 'success' ? (
            <View style={styles.successBody}>
              <Animated.View
                style={[
                  styles.successBadge,
                  { transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] },
                ]}
              >
                <LinearGradient colors={gradients.forest} style={styles.successGradient}>
                  <Feather name="check" size={40} color={colors.white} />
                </LinearGradient>
              </Animated.View>
              <Text style={styles.title}>You’re all set to grow!</Text>
              <Text style={styles.subtitle}>
                {creditConfig.packSize} scans added. You now have{' '}
                <Text style={styles.highlight}>{credits ?? 0} scans</Text> ready to go.
              </Text>
              <GradientButton label="Start scanning" icon="aperture" onPress={hidePaywall} style={styles.cta} />
            </View>
          ) : (
            <>
              <Pressable onPress={close} style={styles.close} hitSlop={12} accessibilityLabel="Close">
                <Feather name="x" size={20} color={colors.textSecondary} />
              </Pressable>

              <LinearGradient colors={gradients.leaf} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
                <Feather name="feather" size={34} color={colors.background} />
              </LinearGradient>

              <Text style={styles.overline}>{creditConfig.packName}</Text>
              <Text style={styles.title}>
                Unlock {creditConfig.packSize} Plant Scans for {creditConfig.packPrice}
              </Text>
              <Text style={styles.subtitle}>
                {credits === 0 ? 'You’ve used all your free scans. ' : ''}Identify every leaf, bloom and
                mystery weed you find.
              </Text>

              <View style={styles.perks}>
                {PERKS.map((perk) => (
                  <View key={perk.title} style={styles.perk}>
                    <View style={styles.perkIcon}>
                      <Feather name={perk.icon} size={18} color={colors.leaf} />
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.perkTitle}>{perk.title}</Text>
                      <Text style={styles.perkBody}>{perk.body}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.priceCard}>
                <View>
                  <Text style={styles.priceLabel}>{creditConfig.packSize} scans</Text>
                  <Text style={styles.perScan}>
                    ≈ ${(creditConfig.packPriceUsd / creditConfig.packSize).toFixed(2)} per identification
                  </Text>
                </View>
                <Text style={styles.price}>{creditConfig.packPrice}</Text>
              </View>

              <GradientButton
                label={phase === 'processing' ? 'Processing…' : `Buy for ${creditConfig.packPrice}`}
                icon="lock"
                loading={phase === 'processing'}
                onPress={purchase}
                style={styles.cta}
              />
              <Text style={styles.disclaimer}>Demo checkout — no real payment is taken.</Text>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow(colors.leaf, 16),
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.lg,
  },
  close: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.lg,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    zIndex: 1,
  },
  hero: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  overline: { ...font.overline, color: colors.leaf, textAlign: 'center' },
  title: { ...font.title, color: colors.text, textAlign: 'center', marginTop: spacing.xs },
  subtitle: { ...font.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  highlight: { color: colors.leaf, fontWeight: '700' },
  perks: { marginTop: spacing.xl, gap: spacing.md },
  perk: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  perkIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.leafSoft,
  },
  perkTitle: { ...font.label, fontSize: 15, color: colors.text },
  perkBody: { ...font.caption, color: colors.textMuted, marginTop: 2 },
  flex: { flex: 1 },
  priceCard: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.leaf,
    backgroundColor: colors.leafSoft,
  },
  priceLabel: { ...font.heading, color: colors.text },
  perScan: { ...font.caption, color: colors.textSecondary, marginTop: 2 },
  price: { ...font.title, color: colors.text },
  cta: { marginTop: spacing.lg, alignSelf: 'stretch' },
  disclaimer: { ...font.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
  successBody: { alignItems: 'center', paddingVertical: spacing.lg },
  successBadge: { marginBottom: spacing.lg, borderRadius: 48, ...shadow(colors.leaf, 14) },
  successGradient: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
});
