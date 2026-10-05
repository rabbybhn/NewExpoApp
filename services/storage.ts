import AsyncStorage from '@react-native-async-storage/async-storage';

import { credits as creditConfig } from '@/constants/config';
import type { CollectionItem } from './types';

const KEYS = {
  credits: '@plantid/credits',
  collection: '@plantid/collection',
} as const;

export async function loadCredits(): Promise<number> {
  const raw = await AsyncStorage.getItem(KEYS.credits);
  if (raw === null) {
    // First launch — grant the starter credits.
    await saveCredits(creditConfig.freeStarter);
    return creditConfig.freeStarter;
  }
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export async function saveCredits(value: number): Promise<void> {
  await AsyncStorage.setItem(KEYS.credits, String(Math.max(0, Math.floor(value))));
}

export async function loadCollection(): Promise<CollectionItem[]> {
  const raw = await AsyncStorage.getItem(KEYS.collection);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as CollectionItem[]) : [];
  } catch {
    return [];
  }
}

export async function saveCollection(items: CollectionItem[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.collection, JSON.stringify(items));
}
