'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  coerce,
  defaultVariant,
  dimensionKeys,
  type Dimension,
  type VariantState,
} from '@/lib/variants';

const STORAGE_KEY = 'juspay-docs-variant';

type VariantContextValue = {
  variant: VariantState;
  setDimension: <K extends Dimension>(key: K, value: VariantState[K]) => void;
  /** False until the stored/URL value has been applied, to avoid hydration mismatch. */
  ready: boolean;
};

const VariantContext = createContext<VariantContextValue | null>(null);

function readInitial(): VariantState {
  if (typeof window === 'undefined') return defaultVariant;

  const params = new URLSearchParams(window.location.search);
  let stored: Partial<VariantState> = {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) stored = JSON.parse(raw) as Partial<VariantState>;
  } catch {
    // Corrupt or unavailable storage is not worth failing the page over.
  }

  const next = { ...defaultVariant };
  for (const key of dimensionKeys) {
    // A URL parameter is an explicit, shareable choice, so it wins over storage.
    // The cast is needed because TypeScript cannot correlate the key and value
    // types across a loop over the union of dimension keys.
    (next as Record<string, string>)[key] = coerce(key, params.get(key) ?? stored[key]);
  }
  return next;
}

export function VariantProvider({ children }: { children: ReactNode }) {
  // Always render the default on the server and on the first client paint, then
  // reconcile in an effect. Reading storage during render would desync hydration.
  const [variant, setVariant] = useState<VariantState>(defaultVariant);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setVariant(readInitial());
    setReady(true);
  }, []);

  const setDimension = useCallback<VariantContextValue['setDimension']>((key, value) => {
    setVariant((prev) => {
      const next = { ...prev, [key]: value };

      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Private mode or blocked storage: selection still works for this session.
      }

      // Keep the URL shareable without pushing a history entry per toggle.
      const url = new URL(window.location.href);
      for (const dimension of dimensionKeys) {
        url.searchParams.set(dimension, next[dimension]);
      }
      window.history.replaceState(null, '', url.toString());

      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ variant, setDimension, ready }),
    [variant, setDimension, ready],
  );

  return <VariantContext.Provider value={value}>{children}</VariantContext.Provider>;
}

export function useVariant(): VariantContextValue {
  const context = useContext(VariantContext);
  if (!context) {
    throw new Error('useVariant must be used inside <VariantProvider>.');
  }
  return context;
}
