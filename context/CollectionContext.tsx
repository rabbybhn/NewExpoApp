import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { deletePersistedImage, persistImage } from '@/services/image';
import { loadCollection, saveCollection } from '@/services/storage';
import type { CollectionItem, PlantIdentification } from '@/services/types';

interface CollectionContextValue {
  items: CollectionItem[];
  isLoaded: boolean;
  addItem: (imageUri: string, result: PlantIdentification) => Promise<CollectionItem>;
  removeItem: (id: string) => Promise<void>;
  getItem: (id: string) => CollectionItem | undefined;
}

const CollectionContext = createContext<CollectionContextValue | null>(null);

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function CollectionProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [isLoaded, setLoaded] = useState(false);
  const itemsRef = useRef<CollectionItem[]>([]);

  useEffect(() => {
    let mounted = true;
    loadCollection()
      .catch(() => [])
      .then((stored) => {
        if (!mounted) return;
        itemsRef.current = stored;
        setItems(stored);
        setLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const commit = useCallback(async (next: CollectionItem[]) => {
    itemsRef.current = next;
    setItems(next);
    await saveCollection(next);
  }, []);

  const addItem = useCallback(
    async (imageUri: string, result: PlantIdentification) => {
      const id = createId();
      const item: CollectionItem = {
        id,
        createdAt: Date.now(),
        imageUri: persistImage(imageUri, id),
        result,
      };
      await commit([item, ...itemsRef.current]);
      return item;
    },
    [commit],
  );

  const removeItem = useCallback(
    async (id: string) => {
      const target = itemsRef.current.find((i) => i.id === id);
      if (!target) return;
      await commit(itemsRef.current.filter((i) => i.id !== id));
      deletePersistedImage(target.imageUri);
    },
    [commit],
  );

  const getItem = useCallback((id: string) => items.find((i) => i.id === id), [items]);

  const value = useMemo(
    () => ({ items, isLoaded, addItem, removeItem, getItem }),
    [items, isLoaded, addItem, removeItem, getItem],
  );

  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>;
}

export function useCollection(): CollectionContextValue {
  const ctx = useContext(CollectionContext);
  if (!ctx) throw new Error('useCollection must be used inside <CollectionProvider>');
  return ctx;
}
