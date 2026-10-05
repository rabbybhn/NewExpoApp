import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientButton } from '@/components/GradientButton';
import { ScanningOverlay } from '@/components/ScanningOverlay';
import { ResultSkeleton } from '@/components/Skeleton';
import { colors, font, radius, spacing } from '@/constants/theme';
import { useCollection } from '@/context/CollectionContext';
import { useCredits } from '@/context/CreditsContext';
import { prepareImageForAnalysis } from '@/services/image';
import { identifyPlant, PlantIdError } from '@/services/openai';
import type { PlantIdentification } from '@/services/types';
import { confidenceColor, difficultyColor, formatDate, toxicityColor } from '@/utils/format';

type IconName = ComponentProps<typeof Feather>['name'];

type State =
  | { status: 'analyzing' }
  | { status: 'done'; result: PlantIdentification; imageUri: string }
  | { status: 'error'; message: string; retryable: boolean };

const HERO_HEIGHT = 340;

export default function ResultScreen() {
  const params = useLocalSearchParams<{ uri?: string; width?: string; height?: string; id?: string }>();
  const { getItem } = useCollection();
  const savedItem = params.id ? getItem(params.id) : undefined;

  if (params.id) {
    if (!savedItem) return <MissingItem />;
    return (
      <ResultLayout imageUri={savedItem.imageUri}>
        <Stack.Screen options={{ title: savedItem.result.common_name }} />
        <PlantCard result={savedItem.result} />
        <Text style={styles.savedOn}>Saved {formatDate(savedItem.createdAt)}</Text>
        <RemoveButton id={savedItem.id} />
      </ResultLayout>
    );
  }

  if (!params.uri) return <MissingItem />;
  return (
    <AnalyzeView
      uri={params.uri}
      width={Number(params.width) || undefined}
      height={Number(params.height) || undefined}
    />
  );
}

// --- Fresh analysis -----------------------------------------------------------------------------

function AnalyzeView({ uri, width, height }: { uri: string; width?: number; height?: number }) {
  const { credits, consumeCredit, showPaywall } = useCredits();
  const { addItem } = useCollection();
  const [state, setState] = useState<State>({ status: 'analyzing' });
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const charged = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const prepared = await prepareImageForAnalysis(uri, width, height);
        if (controller.signal.aborted) return;
        const result = await identifyPlant(prepared.base64, { signal: controller.signal });
        if (controller.signal.aborted) return;

        // Only charge for a successful identification of an actual plant.
        if (result.is_plant && !charged.current) {
          charged.current = true;
          await consumeCredit();
        }
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
        setState({ status: 'done', result, imageUri: prepared.uri });
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof PlantIdError) {
          if (err.kind === 'cancelled') return;
          setState({ status: 'error', message: err.message, retryable: err.kind !== 'config' && err.kind !== 'auth' });
        } else {
          setState({ status: 'error', message: 'We couldn’t read that image. Try another photo.', retryable: false });
        }
      }
    })();

    return () => controller.abort();
    // `attempt` re-runs the analysis on retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri, width, height, attempt]);

  const retry = () => {
    if ((credits ?? 0) <= 0) {
      showPaywall();
      return;
    }
    setState({ status: 'analyzing' });
    setAttempt((a) => a + 1);
  };

  const save = async () => {
    if (state.status !== 'done' || savedId) return;
    setSaving(true);
    try {
      const item = await addItem(state.imageUri, state.result);
      setSavedId(item.id);
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {
      Alert.alert('Couldn’t save', 'Something went wrong saving this plant. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ResultLayout imageUri={uri} scanning={state.status === 'analyzing'}>
      {state.status === 'analyzing' && <ResultSkeleton />}

      {state.status === 'error' && (
        <Notice
          icon="alert-triangle"
          tint={colors.danger}
          title="Analysis failed"
          body={state.message}
          footer="No scan credit was used."
        >
          {state.retryable && <GradientButton label="Try again" icon="refresh-cw" onPress={retry} />}
          <GradientButton label="Take another photo" icon="camera" variant="ghost" onPress={() => router.back()} />
        </Notice>
      )}

      {state.status === 'done' && !state.result.is_plant && (
        <Notice
          icon="search"
          tint={colors.sun}
          title="No plant detected"
          body="We couldn’t find a plant in this photo. Get closer to a leaf or flower, use good light, and try again."
          footer="No scan credit was used."
        >
          <GradientButton label="Take another photo" icon="camera" onPress={() => router.back()} />
        </Notice>
      )}

      {state.status === 'done' && state.result.is_plant && (
        <>
          <Stack.Screen options={{ title: state.result.common_name }} />
          <PlantCard result={state.result} />
          {savedId ? (
            <GradientButton
              label="Saved — view collection"
              icon="check"
              variant="forest"
              onPress={() => router.navigate('/collection')}
            />
          ) : (
            <GradientButton label="Save to Collection" icon="bookmark" loading={saving} onPress={save} />
          )}
          <GradientButton label="Scan another plant" icon="camera" variant="ghost" onPress={() => router.back()} />
        </>
      )}
    </ResultLayout>
  );
}

// --- Layout pieces --------------------------------------------------------------------------------

function ResultLayout({ imageUri, scanning, children }: { imageUri: string; scanning?: boolean; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
    >
      <View style={styles.hero}>
        <Image source={{ uri: imageUri }} style={styles.heroImage} resizeMode="cover" accessibilityIgnoresInvertColors />
        {scanning && <ScanningOverlay height={HERO_HEIGHT} />}
      </View>
      <View style={styles.body}>{children}</View>
    </ScrollView>
  );
}

function PlantCard({ result }: { result: PlantIdentification }) {
  const lowConfidence = result.confidence < 50;
  const difficulty = result.care.difficulty;

  return (
    <View style={styles.card}>
      <Text style={styles.overline}>
        {result.plant_type} · {result.family}
      </Text>
      <Text style={styles.name}>{result.common_name}</Text>
      {!!result.scientific_name && <Text style={styles.scientific}>{result.scientific_name}</Text>}

      <View style={styles.chips}>
        <Chip icon="target" color={confidenceColor(result.confidence)} label={`${result.confidence}% match`} />
        <Chip icon="feather" color={difficultyColor[difficulty]} label={`${difficulty} care`} />
        <Chip icon="globe" color={colors.textSecondary} label={result.native_region} />
      </View>

      <ConfidenceBar value={result.confidence} />

      {lowConfidence && (
        <View style={[styles.callout, { backgroundColor: colors.sunSoft }]}>
          <Feather name="info" size={16} color={colors.sun} />
          <Text style={styles.calloutText}>
            Low-confidence match. Try a sharper photo of a single leaf or flower for a better result.
          </Text>
        </View>
      )}

      {!!result.description && (
        <Section title="About">
          <Text style={styles.paragraph}>{result.description}</Text>
        </Section>
      )}

      {result.key_features.length > 0 && (
        <Section title="How we recognized it">
          {result.key_features.map((feature) => (
            <View key={feature} style={styles.bulletRow}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>{feature}</Text>
            </View>
          ))}
        </Section>
      )}

      <Section title="Care guide">
        <View style={styles.careGrid}>
          <CareTile icon="sun" color={colors.sun} label="Light" value={result.care.light} />
          <CareTile icon="droplet" color={colors.water} label="Water" value={result.care.water} />
          <CareTile icon="layers" color={colors.leaf} label="Soil" value={result.care.soil} />
          <CareTile icon="thermometer" color={colors.bloom} label="Temperature" value={result.care.temperature} />
        </View>
      </Section>

      <Section title="Safety">
        <View style={styles.toxRow}>
          <ToxicityTile icon="heart" label="Cats & dogs" level={result.toxicity.pets} />
          <ToxicityTile icon="user" label="People" level={result.toxicity.humans} />
        </View>
        {!!result.toxicity.notes && <Text style={[styles.paragraph, styles.gapSm]}>{result.toxicity.notes}</Text>}
        <Text style={styles.disclaimer}>
          AI identifications can be wrong. Never eat or use a plant medicinally based on this app.
        </Text>
      </Section>

      {!!result.health_assessment && (
        <Section title="Health check">
          <View style={[styles.callout, { backgroundColor: colors.leafSoft, marginTop: 0 }]}>
            <Feather name="activity" size={16} color={colors.leaf} />
            <Text style={styles.calloutText}>{result.health_assessment}</Text>
          </View>
        </Section>
      )}
    </View>
  );
}

function Chip({ icon, label, color }: { icon: IconName; label: string; color: string }) {
  return (
    <View style={[styles.chip, { borderColor: `${color}55` }]}>
      <Feather name={icon} size={13} color={color} />
      <Text style={[styles.chipText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  return (
    <View
      style={styles.barTrack}
      accessibilityRole="progressbar"
      accessibilityLabel="Identification confidence"
      accessibilityValue={{ min: 0, max: 100, now: value }}
    >
      <View style={[styles.barFill, { width: `${value}%`, backgroundColor: confidenceColor(value) }]} />
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function CareTile({ icon, color, label, value }: { icon: IconName; color: string; label: string; value: string }) {
  return (
    <View style={styles.careTile}>
      <View style={styles.careHeader}>
        <Feather name={icon} size={15} color={color} />
        <Text style={styles.careLabel}>{label}</Text>
      </View>
      <Text style={styles.careValue}>{value}</Text>
    </View>
  );
}

function ToxicityTile({ icon, label, level }: { icon: IconName; label: string; level: PlantIdentification['toxicity']['pets'] }) {
  const color = toxicityColor[level];
  return (
    <View style={[styles.toxTile, { borderColor: `${color}55` }]}>
      <Feather name={icon} size={16} color={colors.textSecondary} />
      <Text style={styles.careLabel}>{label}</Text>
      <Text style={[styles.toxLevel, { color }]}>{level}</Text>
    </View>
  );
}

function Notice({
  icon,
  tint,
  title,
  body,
  footer,
  children,
}: {
  icon: IconName;
  tint: string;
  title: string;
  body: string;
  footer?: string;
  children?: ReactNode;
}) {
  return (
    <View style={[styles.card, styles.notice]}>
      <View style={[styles.noticeIcon, { backgroundColor: `${tint}26` }]}>
        <Feather name={icon} size={26} color={tint} />
      </View>
      <Text style={styles.noticeTitle}>{title}</Text>
      <Text style={[styles.paragraph, styles.center]}>{body}</Text>
      {!!footer && <Text style={styles.disclaimer}>{footer}</Text>}
      <View style={styles.noticeActions}>{children}</View>
    </View>
  );
}

function RemoveButton({ id }: { id: string }) {
  const { removeItem } = useCollection();

  const remove = useCallback(() => {
    // Leave the screen first so it never renders the "missing" state mid-transition.
    router.back();
    removeItem(id).catch(() => Alert.alert('Couldn’t remove', 'Please try again.'));
  }, [id, removeItem]);

  const confirm = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Remove this plant from your collection?')) remove();
      return;
    }
    Alert.alert('Remove plant?', 'This removes it from your collection.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: remove },
    ]);
  };

  return <GradientButton label="Remove from collection" icon="trash-2" variant="ghost" onPress={confirm} />;
}

function MissingItem() {
  return (
    <View style={[styles.screen, styles.missing]}>
      <Notice icon="help-circle" tint={colors.textSecondary} title="Nothing to show" body="This plant isn’t available anymore.">
        <GradientButton label="Go back" icon="arrow-left" variant="ghost" onPress={() => router.back()} />
      </Notice>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1 },
  hero: { height: HERO_HEIGHT, backgroundColor: colors.surface, overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },
  body: { padding: spacing.lg, marginTop: -spacing.xxl, gap: spacing.md },

  card: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  overline: { ...font.overline, color: colors.leaf },
  name: { ...font.display, color: colors.text, marginTop: spacing.xs },
  scientific: { ...font.body, fontStyle: 'italic', color: colors.textSecondary, marginTop: 2 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: colors.surfaceRaised,
    maxWidth: '100%',
  },
  chipText: { ...font.label, flexShrink: 1 },

  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceMuted,
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },

  callout: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.lg,
  },
  calloutText: { ...font.label, fontWeight: '500', lineHeight: 19, color: colors.text, flex: 1 },

  section: { marginTop: spacing.xl },
  sectionTitle: { ...font.overline, color: colors.textMuted, marginBottom: spacing.sm },
  paragraph: { ...font.body, color: colors.textSecondary },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginTop: 6 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.leaf, marginTop: 8 },
  bulletText: { ...font.body, color: colors.textSecondary, flex: 1 },

  careGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  careTile: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
  },
  careHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  careLabel: { ...font.caption, color: colors.textMuted },
  careValue: { ...font.label, fontWeight: '500', lineHeight: 18, color: colors.text, marginTop: 6 },

  toxRow: { flexDirection: 'row', gap: spacing.sm },
  toxTile: {
    flex: 1,
    gap: 4,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: colors.surfaceRaised,
  },
  toxLevel: { ...font.heading, fontSize: 15 },
  disclaimer: { ...font.caption, color: colors.textMuted, marginTop: spacing.md, textAlign: 'center' },
  gapSm: { marginTop: spacing.sm },

  savedOn: { ...font.caption, color: colors.textMuted, textAlign: 'center' },

  notice: { alignItems: 'center' },
  noticeIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  noticeTitle: { ...font.title, color: colors.text, marginBottom: spacing.sm },
  noticeActions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.xl },
  center: { textAlign: 'center' },
  missing: { justifyContent: 'center', padding: spacing.lg },
});
