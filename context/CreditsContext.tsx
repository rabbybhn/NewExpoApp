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

import { loadCredits, saveCredits } from '@/services/storage';

interface CreditsContextValue {
  /** `null` until the balance has been read from storage. */
  credits: number | null;
  /** Deducts one credit. Resolves `false` (and changes nothing) if the balance is empty. */
  consumeCredit: () => Promise<boolean>;
  addCredits: (amount: number) => Promise<void>;
  isPaywallVisible: boolean;
  showPaywall: () => void;
  hidePaywall: () => void;
}

const CreditsContext = createContext<CreditsContextValue | null>(null);

export function CreditsProvider({ children }: PropsWithChildren) {
  const [credits, setCredits] = useState<number | null>(null);
  const [isPaywallVisible, setPaywallVisible] = useState(false);
  // Mirror of `credits` so rapid successive calls never read a stale value.
  const balance = useRef(0);

  useEffect(() => {
    let mounted = true;
    loadCredits()
      .catch(() => 0)
      .then((value) => {
        if (!mounted) return;
        balance.current = value;
        setCredits(value);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const commit = useCallback(async (next: number) => {
    balance.current = next;
    setCredits(next);
    await saveCredits(next);
  }, []);

  const consumeCredit = useCallback(async () => {
    if (balance.current <= 0) return false;
    await commit(balance.current - 1);
    return true;
  }, [commit]);

  const addCredits = useCallback((amount: number) => commit(balance.current + amount), [commit]);
  const showPaywall = useCallback(() => setPaywallVisible(true), []);
  const hidePaywall = useCallback(() => setPaywallVisible(false), []);

  const value = useMemo(
    () => ({ credits, consumeCredit, addCredits, isPaywallVisible, showPaywall, hidePaywall }),
    [credits, consumeCredit, addCredits, isPaywallVisible, showPaywall, hidePaywall],
  );

  return <CreditsContext.Provider value={value}>{children}</CreditsContext.Provider>;
}

export function useCredits(): CreditsContextValue {
  const ctx = useContext(CreditsContext);
  if (!ctx) throw new Error('useCredits must be used inside <CreditsProvider>');
  return ctx;
}
