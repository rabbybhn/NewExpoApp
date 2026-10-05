import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { credits as creditConfig } from '@/constants/config';
import { colors, ferricOnPaper, radius, spacing, type } from '@/constants/theme';
import { useCredits } from '@/context/CreditsContext';

const RULES = [
  `New installs start with ${creditConfig.freeStarter} free scans.`,
  'A scan is used only when a plant is identified.',
  'Failed scans and photos without a plant are free.',
  'Scans you buy don’t expire.',
];

export default function ScansScreen() {
  const { credits, showPaywall, addCredits } = useCredits();
  const perScan = Math.round((creditConfig.packPriceUsd / creditConfig.packSize) * 100);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* A typed ledger slip rather than a hero number: the balance is a record, not a sales stat. */}
      <View style={styles.ledger}>
        <Text style={styles.ledgerHeading}>Balance</Text>
        <View style={styles.ledgerRow}>
          <Text style={styles.ledgerKey}>Scans left</Text>
          <View style={styles.leader} />
          {credits === null ? (
            <ActivityIndicator size="small" color={colors.ink} />
          ) : (
            <Text style={[styles.ledgerValue, credits === 0 && { color: ferricOnPaper }]}>{credits}</Text>
          )}
        </View>
        {credits === 0 && <Text style={styles.ledgerNote}>Buy more scans to keep identifying plants.</Text>}
      </View>

      <Text style={styles.sectionTitle}>{creditConfig.packName}</Text>
      <Text style={styles.offer}>
        {creditConfig.packSize} scans for {creditConfig.packPrice}
      </Text>
      <Text style={styles.offerSub}>About {perScan}¢ per plant.</Text>
      <Button
        label={`Buy ${creditConfig.packSize} scans`}
        onPress={showPaywall}
        style={styles.buy}
      />

      <Text style={[styles.sectionTitle, styles.rulesTitle]}>How scans work</Text>
      {RULES.map((rule, i) => (
        <Text key={rule} style={[styles.rule, i < RULES.length - 1 && styles.ruleBorder]}>
          {rule}
        </Text>
      ))}

      {__DEV__ && (
        <Pressable onPress={() => addCredits(-(credits ?? 0))} style={styles.devReset} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.devText}>Dev only: set scans to 0</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.prussian },
  content: { padding: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.xxl },

  ledger: { backgroundColor: colors.paper, borderRadius: radius.sheet, padding: spacing.lg },
  ledgerHeading: { ...type.monoCaps, color: colors.inkMuted },
  ledgerRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.md, gap: spacing.sm },
  ledgerKey: { ...type.mono, fontSize: 17, color: colors.ink },
  leader: {
    flex: 1,
    borderBottomWidth: 2,
    borderStyle: 'dotted',
    borderColor: colors.inkMuted,
    marginBottom: 6,
  },
  ledgerValue: { fontFamily: type.mono.fontFamily, fontSize: 34, lineHeight: 36, color: colors.ink },
  ledgerNote: { ...type.small, color: ferricOnPaper, marginTop: spacing.sm },

  sectionTitle: { ...type.monoCaps, color: colors.wash, marginTop: spacing.xxl },
  offer: { ...type.title, color: colors.paper, marginTop: spacing.sm },
  offerSub: { ...type.body, color: colors.wash, marginTop: 2 },
  buy: { marginTop: spacing.lg },

  rulesTitle: { marginBottom: spacing.xs },
  rule: { ...type.body, color: colors.paper, paddingVertical: spacing.md },
  ruleBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },

  devReset: { alignSelf: 'center', marginTop: spacing.xl },
  devText: { ...type.small, color: colors.washDim },
});
