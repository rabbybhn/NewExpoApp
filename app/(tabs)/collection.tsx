import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { CyanotypePrint } from '@/components/Cyanotype';
import { colors, radius, spacing, type } from '@/constants/theme';
import { useCollection } from '@/context/CollectionContext';
import type { CollectionItem } from '@/services/types';
import type { PressState } from '@/utils/pressable';

export default function CollectionScreen() {
  const { items, isLoaded } = useCollection();

  if (!isLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.paper} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={[styles.center, styles.empty]}>
        <Text style={styles.emptyTitle}>No plants saved yet</Text>
        <Text style={styles.emptyBody}>
          After identifying a plant, tap Save to collection. It’s kept here as a blue print with its care notes.
        </Text>
        <Button label="Identify a plant" icon="aperture" onPress={() => router.navigate('/')} style={styles.emptyCta} />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      numColumns={2}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      columnWrapperStyle={styles.column}
      ListHeaderComponent={
        <Text style={styles.count}>
          {items.length} {items.length === 1 ? 'plate' : 'plates'}, numbered in the order you saved them
        </Text>
      }
      // Items are stored newest first; plate 1 is the first plant ever saved.
      renderItem={({ item, index }) => <Plate item={item} number={items.length - index} />}
    />
  );
}

function Plate({ item, number }: { item: CollectionItem; number: number }) {
  const { result } = item;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/result', params: { id: item.id } })}
      accessibilityRole="button"
      accessibilityLabel={`Plate ${number}: ${result.common_name}`}
      style={({ pressed, focused }: PressState) => [styles.plate, pressed && { opacity: 0.85 }, focused && styles.focused]}
    >
      <CyanotypePrint uri={item.imageUri} style={styles.print} />
      <Text style={styles.plateNo}>Pl. {number}</Text>
      <Text style={styles.latin} numberOfLines={2}>
        {result.scientific_name || result.common_name}
      </Text>
      {!!result.scientific_name && (
        <Text style={styles.common} numberOfLines={1}>
          {result.common_name}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', backgroundColor: colors.prussian },
  empty: { paddingHorizontal: spacing.xl },
  emptyTitle: { ...type.title, color: colors.paper },
  emptyBody: { ...type.body, color: colors.wash, marginTop: spacing.sm },
  emptyCta: { marginTop: spacing.xl },

  list: { backgroundColor: colors.prussian },
  listContent: { padding: spacing.lg, paddingTop: spacing.xs, gap: spacing.lg },
  column: { gap: spacing.md },
  count: { ...type.small, color: colors.wash },

  plate: {
    flex: 1,
    maxWidth: '50%',
    backgroundColor: colors.paper,
    borderRadius: radius.sheet,
    padding: spacing.sm,
    paddingBottom: spacing.md,
  },
  focused: { outlineColor: colors.citrate, outlineWidth: 2, outlineOffset: 2, outlineStyle: 'solid' },
  print: { width: '100%', aspectRatio: 4 / 5 },
  plateNo: { ...type.monoCaps, fontSize: 10, color: colors.inkMuted, marginTop: spacing.sm },
  latin: { ...type.latin, fontSize: 16, lineHeight: 20, color: colors.ink, marginTop: 2 },
  common: { ...type.small, color: colors.inkMuted, marginTop: 2 },
});
