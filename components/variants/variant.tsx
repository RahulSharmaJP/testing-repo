'use client';

import type { ReactNode } from 'react';
import { blockApplies, type Dimension } from '@/lib/variants';
import { useVariant } from './context';

type VariantProps = {
  children: ReactNode;
} & Partial<Record<Dimension, string | string[]>>;

/**
 * Show a block only for certain variant values.
 *
 *   <Variant region="sea">SEA-only guidance.</Variant>
 *   <Variant region={['in', 'sea']} platform="android">…</Variant>
 *
 * Omitted dimensions are unconstrained. Note the content is present in the HTML
 * either way — this hides, it does not withhold.
 */
export function Variant({ children, ...constraints }: VariantProps) {
  const { variant } = useVariant();
  if (!blockApplies(constraints, variant)) return null;
  return <>{children}</>;
}

/**
 * Inline counterpart, for swapping a value mid-sentence without breaking the
 * paragraph. Renders nothing when it does not apply.
 */
export function VariantText({ children, ...constraints }: VariantProps) {
  const { variant } = useVariant();
  if (!blockApplies(constraints, variant)) return null;
  return <span>{children}</span>;
}

/**
 * Renders the reader's current value for a dimension, so prose can refer to it
 * without hardcoding: "Base URL for <CurrentVariant of="region" />".
 */
export function CurrentVariant({ of }: { of: Dimension }) {
  const { variant } = useVariant();
  return <span>{variant[of]}</span>;
}
