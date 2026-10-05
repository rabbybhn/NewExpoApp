import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { GradientButton } from '@/components/GradientButton';
import { colors, font, radius, shadow, spacing } from '@/constants/theme';
import { useCollection } from '@/context/CollectionContext';
import type { CollectionItem } from '@/services/types';
import { difficultyColor, formatDate } from '@/utils/format';

export default function CollectionScreen() {
  const { items, isLoaded } = useCollection();

  if (!isLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.leaf} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={[styles.center, styles.empty]}>
        <View style={styles.emptyIcon}>
          <Feather name="book-open" size={32} color={colors.leaf} />
        </View>
        <Text style={styles.emptyTitle}>Your garden journal is empty</Text>
        <Text style={styles.emptyBody}>
          Identify a plant and tap “Save to Collection” to keep its care guide here.
        </Text>
        <GradientButton label="Scan a plant" icon="aperture" onPress={() => router.navigate('/')} style={styles.emptyCta} />
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
          {items.length} {items.length === 1 ? 'plant' : 'plants'} identified
        </Text>
      }
      renderItem={({ item }) => <PlantTile item={item} />}
    />
  );
}

function PlantTile({ item }: { item: CollectionItem }) {
  const { result } = item;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/result', params: { id: item.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${result.common_name}, saved ${formatDate(item.createdAt)}`}
      style={({ pressed }) => [styles.tile, pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 }]}
    >
      <Image source={{ uri: item.imageUri }} style={styles.tileImage} resizeMode="cover" />
      <View style={[styles.badge, { borderColor: difficultyColor[result.care.difficulty] }]}>
        <Text style={[styles.badgeText, { color: difficultyColor[result.care.difficulty] }]}>
          {result.care.difficulty}
        </Text>
      </View>
      <View style={styles.tileBody}>
        <Text style={styles.tileName} numberOfLines={1}>
          {result.common_name}
        </Text>
        <Text style={styles.tileSci} numberOfLines={1}>
          {result.scientific_name || result.family}
        </Text>
        <Text style={styles.tileDate}>{formatDate(item.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  empty: { paddingHorizontal: spacing.xxl },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.leafSoft,
    marginBottom: spacing.xl,
  },
  emptyTitle: { ...font.title, color: colors.text, textAlign: 'center' },
  emptyBody: { ...font.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  emptyCta: { marginTop: spacing.xl, alignSelf: 'stretch' },

  list: { backgroundColor: colors.background },
  listContent: { padding: spacing.lg, gap: spacing.md },
  column: { gap: spacing.md },
  count: { ...font.overline, color: colors.textMuted, marginBottom: spacing.xs },

  tile: {
    flex: 1,
    maxWidth: '50%',
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow('#000', 6),
  },
  tileImage: { width: '100%', aspectRatio: 1, backgroundColor: colors.surfaceRaised },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: colors.overlay,
  },
  badgeText: { ...font.caption, fontSize: 11, fontWeight: '700' },
  tileBody: { padding: spacing.md },
  tileName: { ...font.heading, fontSize: 15, color: colors.text },
  tileSci: { ...font.caption, fontStyle: 'italic', color: colors.textSecondary, marginTop: 2 },
  tileDate: { ...font.caption, fontSize: 11, color: colors.textMuted, marginTop: spacing.sm },
});
