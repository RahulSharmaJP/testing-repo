import { getVariantIndex, source } from '@/lib/source';
import { baseOptions } from '@/lib/layout.shared';
import { AdaptiveDocsLayout } from '@/components/variants/adaptive-layout';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  // Both of these are computed at build time and serialised into the RSC payload,
  // so the docs pages stay statically generated.
  return (
    <AdaptiveDocsLayout
      tree={source.getPageTree()}
      variantIndex={getVariantIndex()}
      {...baseOptions()}
    >
      {children}
    </AdaptiveDocsLayout>
  );
}
