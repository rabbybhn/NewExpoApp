import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { DevelopingPhoto } from '@/components/Cyanotype';
import { HerbariumLabel } from '@/components/HerbariumLabel';
import { SheetSkeleton } from '@/components/Skeleton';
import { colors, radius, spacing, type } from '@/constants/theme';
import { useCollection } from '@/context/CollectionContext';
import { useCredits } from '@/context/CreditsContext';
import { prepareImageForAnalysis } from '@/services/image';
import { identifyPlant, PlantIdError } from '@/services/openai';
import type { PlantIdentification } from '@/services/types';
import { toxicityColor } from '@/utils/format';

type State =
  | { status: 'analyzing' }
  | { status: 'done'; result: PlantIdentification; imageUri: string; determinedAt: number }
  | { status: 'error'; message: string; retryable: boolean };

export default function ResultScreen() {
  const params = useLocalSearchParams<{ uri?: string; id?: string }>();
  const { getItem } = useCollection();

  if (params.id) {
    const item = getItem(params.id);
    if (!item) return <Missing />;
    return (
      <Page
        photo={<Image source={{ uri: item.imageUri }} style={styles.photo} resizeMode="cover" />}
        sheet={<Determination result={item.result} determinedAt={item.createdAt} />}
      >
        <Details result={item.result} />
        <RemoveButton id={item.id} />
      </Page>
    );
  }

  if (!params.uri) return <Missing />;
  return <AnalyzeView uri={params.uri} />;
}

// --- Fresh analysis -----------------------------------------------------------------------------

function AnalyzeView({ uri }: { uri: string }) {
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
        const prepared = await prepareImageForAnalysis(uri);
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
        // On web the prepared file is a short-lived blob: URL; keep a data URI so saved plates survive reloads.
        const imageUri = Platform.OS === 'web' ? `data:image/jpeg;base64,${prepared.base64}` : prepared.uri;
        setState({ status: 'done', result, imageUri, determinedAt: Date.now() });
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof PlantIdError) {
          if (err.kind === 'cancelled') return;
          setState({ status: 'error', message: err.message, retryable: err.kind !== 'config' && err.kind !== 'auth' });
        } else {
          setState({ status: 'error', message: 'This image couldn’t be read. Choose a different photo.', retryable: false });
        }
      }
    })();

    return () => controller.abort();
    // `attempt` re-runs the analysis on retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri, attempt]);

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
      Alert.alert('Not saved', 'The plant couldn’t be saved to your collection. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const identified = state.status === 'done' && state.result.is_plant;

  let sheet: ReactNode;
  if (state.status === 'analyzing') {
    sheet = <SheetSkeleton />;
  } else if (state.status === 'error') {
    sheet = (
      <Notice title="Not identified" body={`${state.message} No scan was used.`}>
        {state.retryable && <Button label="Try again" icon="refresh-cw" variant="ink" onPress={retry} />}
        <Button label="Take another photo" icon="camera" variant="inkOutline" onPress={() => router.back()} />
      </Notice>
    );
  } else if (!state.result.is_plant) {
    sheet = (
      <Notice
        title="No plant in this photo"
        body="Move closer so one leaf or flower fills the frame, in daylight if you can. No scan was used."
      >
        <Button label="Take another photo" icon="camera" variant="ink" onPress={() => router.back()} />
      </Notice>
    );
  } else {
    sheet = <Determination result={state.result} determinedAt={state.determinedAt} />;
  }

  return (
    <Page photo={<DevelopingPhoto uri={uri} developed={state.status !== 'analyzing'} style={styles.photo} />} sheet={sheet}>
      {identified && (
        <>
          <Details result={state.result} />
          <View style={styles.actions}>
            {savedId ? (
              <Button label="Saved. Open collection" icon="check" onPress={() => router.navigate('/collection')} />
            ) : (
              <Button label="Save to collection" icon="bookmark" loading={saving} onPress={save} />
            )}
            <Button label="Identify another plant" icon="camera" variant="outline" onPress={() => router.back()} />
          </View>
        </>
      )}
    </Page>
  );
}

// --- Layout -------------------------------------------------------------------------------------

/** A herbarium sheet: the photo mounted with tape, the determination typed beneath it. */
function Page({ photo, sheet, children }: { photo: ReactNode; sheet: ReactNode; children?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}>
      <View style={styles.sheet}>
        <View style={styles.mount}>
          {photo}
          <View style={[styles.tape, styles.tapeLeft]} />
          <View style={[styles.tape, styles.tapeRight]} />
        </View>
        <View style={styles.sheetBody}>{sheet}</View>
      </View>
      {children}
    </ScrollView>
  );
}

function Determination({ result, determinedAt }: { result: PlantIdentification; determinedAt: number }) {
  return (
    <>
      <Text style={styles.commonName} accessibilityRole="header">
        {result.common_name}
      </Text>
      {!!result.scientific_name && <Text style={styles.latin}>{result.scientific_name}</Text>}
      <View style={styles.labelWrap}>
        <HerbariumLabel result={result} determinedAt={determinedAt} />
      </View>
    </>
  );
}

function Details({ result }: { result: PlantIdentification }) {
  const { care, toxicity } = result;
  return (
    <View style={styles.details}>
      {!!result.description && (
        <Section title="About">
          <Text style={styles.paragraph}>{result.description}</Text>
        </Section>
      )}

      {result.key_features.length > 0 && (
        <Section title="Identified by">
          {result.key_features.map((feature) => (
            <Text key={feature} style={styles.paragraph}>
              — {feature}
            </Text>
          ))}
        </Section>
      )}

      <Section title={`Care · ${care.difficulty}`}>
        <Row label="Light" value={care.light} />
        <Row label="Water" value={care.water} />
        <Row label="Soil" value={care.soil} />
        <Row label="Temperature" value={care.temperature} last />
      </Section>

      <Section title="Safety">
        <Row label="Cats and dogs" value={toxicity.pets} valueColor={toxicityColor[toxicity.pets]} />
        <Row label="People" value={toxicity.humans} valueColor={toxicityColor[toxicity.humans]} last />
        {!!toxicity.notes && <Text style={[styles.paragraph, styles.gap]}>{toxicity.notes}</Text>}
        <Text style={styles.disclaimer}>
          Identifications can be wrong. Don’t eat or use a plant as medicine based on this app.
        </Text>
      </Section>

      {!!result.health_assessment && (
        <Section title="Health">
          <Text style={styles.paragraph}>{result.health_assessment}</Text>
        </Section>
      )}
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

function Row({ label, value, valueColor, last }: { label: string; value: string; valueColor?: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowRule]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueColor ? { color: valueColor, fontFamily: type.bodyStrong.fontFamily } : null]}>
        {value}
      </Text>
    </View>
  );
}

function Notice({ title, body, children }: { title: string; body: string; children?: ReactNode }) {
  return (
    <View>
      <Text style={styles.noticeTitle}>{title}</Text>
      <Text style={styles.noticeBody}>{body}</Text>
      <View style={styles.noticeActions}>{children}</View>
    </View>
  );
}

function RemoveButton({ id }: { id: string }) {
  const { removeItem } = useCollection();

  const remove = useCallback(() => {
    // Leave the screen first so it never renders the "missing" state mid-transition.
    router.back();
    removeItem(id).catch(() => Alert.alert('Not removed', 'The plant couldn’t be removed. Try again.'));
  }, [id, removeItem]);

  const confirm = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Remove this plant from your collection?')) remove();
      return;
    }
    Alert.alert('Remove this plant?', 'Its photo and notes will be deleted from your collection.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: remove },
    ]);
  };

  return (
    <View style={styles.actions}>
      <Button label="Remove from collection" icon="trash-2" variant="outline" onPress={confirm} />
    </View>
  );
}

function Missing() {
  return (
    <View style={[styles.screen, styles.missing]}>
      <View style={[styles.sheet, styles.sheetBody]}>
        <Notice title="Plant not found" body="This plant was removed from your collection.">
          <Button label="Go back" icon="arrow-left" variant="ink" onPress={() => router.back()} />
        </Notice>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.prussian },

  sheet: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    backgroundColor: colors.paper,
    borderRadius: radius.sheet,
  },
  mount: { alignSelf: 'center', width: '88%' },
  photo: { width: '100%', aspectRatio: 4 / 5, backgroundColor: colors.paperShade },
  tape: {
    position: 'absolute',
    top: -10,
    width: 70,
    height: 22,
    backgroundColor: 'rgba(220, 227, 224, 0.82)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15, 39, 66, 0.12)',
  },
  tapeLeft: { left: -22, transform: [{ rotate: '-32deg' }] },
  tapeRight: { right: -22, transform: [{ rotate: '32deg' }] },
  sheetBody: { paddingTop: spacing.xl },

  commonName: { ...type.plantName, color: colors.ink },
  latin: { ...type.latin, color: colors.inkMuted, marginTop: 2 },
  labelWrap: { marginTop: spacing.xl, alignSelf: 'stretch' },

  details: { paddingHorizontal: spacing.lg + spacing.xs, paddingTop: spacing.sm },
  section: { marginTop: spacing.xl },
  sectionTitle: { ...type.monoCaps, color: colors.wash, marginBottom: spacing.sm },
  paragraph: { ...type.body, color: colors.paper },
  gap: { marginTop: spacing.md },
  disclaimer: { ...type.small, color: colors.wash, marginTop: spacing.md },

  row: { paddingVertical: spacing.md },
  rowRule: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  rowLabel: { ...type.small, color: colors.wash },
  rowValue: { ...type.body, color: colors.paper, marginTop: 2 },

  actions: { paddingHorizontal: spacing.lg, marginTop: spacing.xxl, gap: spacing.sm },

  noticeTitle: { ...type.title, color: colors.ink },
  noticeBody: { ...type.body, color: colors.inkMuted, marginTop: spacing.sm },
  noticeActions: { gap: spacing.sm, marginTop: spacing.xl },
  missing: { justifyContent: 'center' },
});
