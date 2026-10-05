import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { credits as creditConfig } from '@/constants/config';
import { colors, radius, spacing, type } from '@/constants/theme';
import { useCredits } from '@/context/CreditsContext';

type Phase = 'offer' | 'buying' | 'done';

const INCLUDED = [
  'Name and botanical family',
  'Light, water, soil and temperature care',
  'Toxicity for pets and people',
  'A health check from the photo',
];

/** Simulated purchase delay so the flow feels like a real store sheet. */
const MOCK_PURCHASE_MS = 1600;

/**
 * Global paywall, driven by `useCredits().isPaywallVisible`. Mounted once in the root layout.
 *
 * This is a simulation: no payment is taken. Swap `buy()` for a real IAP library
 * (e.g. RevenueCat or expo-iap) before shipping.
 */
export function PaywallModal() {
  const { isPaywallVisible, hidePaywall, addCredits, credits } = useCredits();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>('offer');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const buy = () => {
    setPhase('buying');
    timer.current = setTimeout(async () => {
      await addCredits(creditConfig.packSize);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      setPhase('done');
    }, MOCK_PURCHASE_MS);
  };

  const close = () => {
    if (phase === 'buying') return;
    hidePaywall();
  };

  const perScan = Math.round((creditConfig.packPriceUsd / creditConfig.packSize) * 100);

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
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.md }]}>
          {phase === 'done' ? (
            <View style={styles.doneBody}>
              <Text style={styles.eyebrow}>{creditConfig.packName}</Text>
              <Text style={styles.title}>{creditConfig.packSize} scans added</Text>
              <Text style={styles.body}>
                You have {credits ?? 0} scans left. A scan is used only when a plant is identified.
              </Text>
              <Button label="Identify a plant" icon="aperture" variant="ink" onPress={hidePaywall} style={styles.doneCta} />
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.eyebrow}>{creditConfig.packName}</Text>
                <Pressable onPress={close} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
                  <Feather name="x" size={22} color={colors.inkMuted} />
                </Pressable>
              </View>

              <Text style={styles.title}>
                {credits === 0 ? 'You’ve used your free scans' : `${creditConfig.packSize} more scans`}
              </Text>
              <Text style={styles.body}>
                {creditConfig.packSize} scans for {creditConfig.packPrice}, about {perScan}¢ per plant. Scans don’t
                expire.
              </Text>

              <View style={styles.rule} />
              <Text style={styles.listHeading}>Every scan includes</Text>
              {INCLUDED.map((item) => (
                <View key={item} style={styles.listRow}>
                  <Feather name="check" size={16} color={colors.ink} />
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
              <View style={styles.rule} />

              <Button
                label={phase === 'buying' ? 'Buying…' : `Buy ${creditConfig.packSize} scans for ${creditConfig.packPrice}`}
                variant="ink"
                loading={phase === 'buying'}
                onPress={buy}
                style={styles.cta}
              />
              <Text style={styles.footnote}>Demo checkout. No payment is taken.</Text>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.scrim },
  sheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { ...type.monoCaps, color: colors.inkMuted },
  title: { ...type.title, color: colors.ink, marginTop: spacing.sm },
  body: { ...type.body, color: colors.inkMuted, marginTop: spacing.sm },
  rule: { height: 1, backgroundColor: colors.inkLine, marginVertical: spacing.lg },
  listHeading: { ...type.bodyStrong, color: colors.ink, marginBottom: spacing.xs },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 6 },
  listText: { ...type.body, color: colors.ink, flex: 1 },
  cta: { alignSelf: 'stretch' },
  footnote: { ...type.small, color: colors.inkMuted, textAlign: 'center', marginTop: spacing.md },
  doneBody: { paddingBottom: spacing.sm },
  doneCta: { alignSelf: 'stretch', marginTop: spacing.xl },
});
