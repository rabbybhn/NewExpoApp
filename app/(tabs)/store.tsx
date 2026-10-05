import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GradientButton } from '@/components/GradientButton';
import { credits as creditConfig } from '@/constants/config';
import { colors, font, gradients, radius, shadow, spacing } from '@/constants/theme';
import { useCredits } from '@/context/CreditsContext';

const HOW_IT_WORKS: { icon: ComponentProps<typeof Feather>['name']; text: string }[] = [
  { icon: 'gift', text: `Every new gardener gets ${creditConfig.freeStarter} free scans.` },
  { icon: 'aperture', text: 'One scan is used for each successful plant identification.' },
  { icon: 'shield', text: 'Failed scans or photos without a plant are never charged.' },
  { icon: 'clock', text: 'Purchased scans never expire.' },
];

export default function StoreScreen() {
  const { credits, showPaywall, addCredits } = useCredits();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <LinearGradient colors={gradients.forest} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.balance}>
        <View style={styles.balanceHeader}>
          <Feather name="zap" size={18} color={colors.sun} />
          <Text style={styles.balanceLabel}>Scan balance</Text>
        </View>
        {credits === null ? (
          <ActivityIndicator color={colors.white} style={styles.balanceLoading} />
        ) : (
          <Text style={styles.balanceValue} accessibilityLabel={`${credits} scans remaining`}>
            {credits}
          </Text>
        )}
        <Text style={styles.balanceHint}>
          {credits === 0 ? 'You’re out of scans — top up to keep identifying.' : 'scans remaining'}
        </Text>
      </LinearGradient>

      <Text style={styles.sectionTitle}>Top up</Text>
      <Pressable
        onPress={showPaywall}
        accessibilityRole="button"
        accessibilityLabel={`${creditConfig.packName}: ${creditConfig.packSize} scans for ${creditConfig.packPrice}`}
        style={({ pressed }) => [styles.pack, pressed && { opacity: 0.85 }]}
      >
        <LinearGradient colors={gradients.leaf} style={styles.packIcon}>
          <Feather name="feather" size={24} color={colors.background} />
        </LinearGradient>
        <View style={styles.flex}>
          <View style={styles.packTitleRow}>
            <Text style={styles.packName}>{creditConfig.packName}</Text>
            <View style={styles.bestValue}>
              <Text style={styles.bestValueText}>BEST VALUE</Text>
            </View>
          </View>
          <Text style={styles.packDetail}>{creditConfig.packSize} plant identifications</Text>
        </View>
        <Text style={styles.packPrice}>{creditConfig.packPrice}</Text>
      </Pressable>
      <GradientButton label={`Get ${creditConfig.packSize} scans`} icon="shopping-bag" onPress={showPaywall} />

      <Text style={styles.sectionTitle}>How credits work</Text>
      <View style={styles.card}>
        {HOW_IT_WORKS.map((row) => (
          <View key={row.text} style={styles.row}>
            <Feather name={row.icon} size={18} color={colors.leaf} />
            <Text style={styles.rowText}>{row.text}</Text>
          </View>
        ))}
      </View>

      {__DEV__ && (
        <Pressable
          onPress={() => addCredits(-(credits ?? 0))}
          style={styles.devReset}
          accessibilityRole="button"
          hitSlop={8}
        >
          <Feather name="tool" size={14} color={colors.textMuted} />
          <Text style={styles.devText}>Dev: reset balance to 0</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  flex: { flex: 1 },

  balance: { borderRadius: radius.xl, padding: spacing.xl, ...shadow(colors.leaf, 12) },
  balanceHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  balanceLabel: { ...font.overline, color: 'rgba(255,255,255,0.85)' },
  balanceValue: { fontSize: 64, fontWeight: '800', color: colors.white, letterSpacing: -2, marginTop: spacing.sm },
  balanceLoading: { alignSelf: 'flex-start', marginVertical: spacing.xl },
  balanceHint: { ...font.label, color: 'rgba(255,255,255,0.85)' },

  sectionTitle: { ...font.overline, color: colors.textMuted, marginTop: spacing.lg },

  pack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.leaf,
  },
  packIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  packTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  packName: { ...font.heading, color: colors.text },
  bestValue: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm, backgroundColor: colors.bloomSoft },
  bestValueText: { ...font.overline, fontSize: 9, color: colors.bloom },
  packDetail: { ...font.caption, color: colors.textSecondary, marginTop: 2 },
  packPrice: { ...font.title, color: colors.text },

  card: {
    padding: spacing.lg,
    gap: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  rowText: { ...font.body, color: colors.textSecondary, flex: 1 },

  devReset: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.lg },
  devText: { ...font.caption, color: colors.textMuted },
});
