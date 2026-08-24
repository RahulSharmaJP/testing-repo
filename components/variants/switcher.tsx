'use client';

import { dimensions, dimensionKeys, type Dimension } from '@/lib/variants';
import { useVariant } from './context';

function DimensionSelect({ dimension }: { dimension: Dimension }) {
  const { variant, setDimension } = useVariant();
  const config = dimensions[dimension];
  const id = `variant-${dimension}`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-fd-muted-foreground">
        {config.label}
      </label>
      <select
        id={id}
        value={variant[dimension]}
        onChange={(event) =>
          setDimension(dimension, event.target.value as never)
        }
        className="w-full border border-fd-border bg-fd-background px-2 py-1.5 text-sm"
      >
        {config.values.map((value) => (
          <option key={value} value={value}>
            {(config.labels as Record<string, string>)[value]}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Sits above the sidebar nav. Changing a value re-filters the nav and every
 * <Variant> block on the page, with no navigation.
 */
export function VariantSwitcher() {
  return (
    <div className="flex flex-col gap-3 border-b border-fd-border pb-4 mb-2">
      {dimensionKeys.map((dimension) => (
        <DimensionSelect key={dimension} dimension={dimension} />
      ))}
    </div>
  );
}
