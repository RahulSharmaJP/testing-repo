/**
 * Variant dimensions.
 *
 * These mirror the GitBook adaptive-content visitor claims (`region`, `platform`,
 * `integrationPath`) so the two systems can be compared like for like.
 *
 * Unlike GitBook, nothing here is server-enforced. The selected variant is held in
 * the URL and in localStorage, and all variants ship to the browser. See
 * docs/ADAPTIVE-CONTENT.md for what that means and when it is not good enough.
 */

export const dimensions = {
  region: {
    label: 'Region',
    values: ['in', 'sea', 'mena', 'br', 'pe', 'eu'],
    labels: {
      in: 'India',
      sea: 'Southeast Asia',
      mena: 'MENA',
      br: 'Brazil',
      pe: 'Peru',
      eu: 'Europe',
    },
    fallback: 'in',
  },
  platform: {
    label: 'Platform',
    values: ['web', 'android', 'ios'],
    labels: { web: 'Web', android: 'Android', ios: 'iOS' },
    fallback: 'web',
  },
  integrationPath: {
    label: 'Integration',
    values: ['hypercheckout', 'ec-sdk', 'ec-api'],
    labels: {
      hypercheckout: 'HyperCheckout',
      'ec-sdk': 'Express Checkout SDK',
      'ec-api': 'Express Checkout API',
    },
    fallback: 'hypercheckout',
  },
} as const;

export type Dimension = keyof typeof dimensions;

export type VariantState = {
  [K in Dimension]: (typeof dimensions)[K]['values'][number];
};

export const dimensionKeys = Object.keys(dimensions) as Dimension[];

export const defaultVariant: VariantState = {
  region: 'in',
  platform: 'web',
  integrationPath: 'hypercheckout',
};

/** Narrow an untrusted string to a valid value for a dimension, else fall back. */
export function coerce<K extends Dimension>(dimension: K, value: unknown): VariantState[K] {
  const values = dimensions[dimension].values as readonly string[];
  return (
    typeof value === 'string' && values.includes(value)
      ? value
      : dimensions[dimension].fallback
  ) as VariantState[K];
}

export function labelFor<K extends Dimension>(dimension: K, value: string): string {
  return (dimensions[dimension].labels as Record<string, string>)[value] ?? value;
}

/**
 * Per-page applicability, read from frontmatter. An omitted dimension means
 * "applies to every value" — the CORE case in the CORE/VARIANT/REGION-ONLY model.
 */
export type PageVariants = Partial<Record<Dimension, string[]>>;

/** Does this page apply to the reader's current variant selection? */
export function pageApplies(pageVariants: PageVariants, state: VariantState): boolean {
  return dimensionKeys.every((key) => {
    const allowed = pageVariants[key];
    if (!allowed || allowed.length === 0) return true;
    return allowed.includes(state[key]);
  });
}

/**
 * Does a `<Variant>` block apply? Same rule, but expressed per block rather than
 * per page.
 */
export function blockApplies(
  constraints: Partial<Record<Dimension, string | string[]>>,
  state: VariantState,
): boolean {
  return dimensionKeys.every((key) => {
    const allowed = constraints[key];
    if (allowed === undefined) return true;
    const list = Array.isArray(allowed) ? allowed : [allowed];
    if (list.length === 0) return true;
    return list.includes(state[key]);
  });
}
