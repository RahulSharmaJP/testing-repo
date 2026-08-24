'use client';

import { useMemo, type ReactNode } from 'react';
import { DocsLayout, type DocsLayoutProps } from 'fumadocs-ui/layouts/docs';
import type * as PageTree from 'fumadocs-core/page-tree';
import { pageApplies, type PageVariants, type VariantState } from '@/lib/variants';
import { useVariant } from './context';
import { VariantSwitcher } from './switcher';

/** url -> frontmatter variant constraints, built on the server in the layout. */
export type VariantIndex = Record<string, PageVariants>;

function filterNodes(
  nodes: PageTree.Node[],
  index: VariantIndex,
  state: VariantState,
): PageTree.Node[] {
  const result: PageTree.Node[] = [];

  for (const node of nodes) {
    if (node.type === 'page') {
      if (pageApplies(index[node.url] ?? {}, state)) result.push(node);
      continue;
    }

    if (node.type === 'folder') {
      const children = filterNodes(node.children, index, state);
      const index_ = node.index;
      const indexApplies = index_ ? pageApplies(index[index_.url] ?? {}, state) : false;

      // Drop a folder once nothing inside it survives, so the reader never sees
      // an empty section for a region they are not in.
      if (children.length === 0 && !indexApplies) continue;

      result.push({
        ...node,
        index: indexApplies ? index_ : undefined,
        children,
      });
      continue;
    }

    result.push(node);
  }

  // A separator with nothing after it is visual noise; drop trailing ones.
  while (result.length > 0 && result[result.length - 1].type === 'separator') {
    result.pop();
  }

  return result;
}

type Props = Omit<DocsLayoutProps, 'children' | 'sidebar'> & {
  tree: PageTree.Root;
  variantIndex: VariantIndex;
  children: ReactNode;
};

export function AdaptiveDocsLayout({ tree, variantIndex, children, ...props }: Props) {
  const { variant, ready } = useVariant();

  const filtered = useMemo<PageTree.Root>(() => {
    // Before hydration settles, show the unfiltered tree rather than flashing a
    // nav built from the default region.
    if (!ready) return tree;
    return { ...tree, children: filterNodes(tree.children, variantIndex, variant) };
  }, [tree, variantIndex, variant, ready]);

  return (
    <DocsLayout
      {...props}
      tree={filtered}
      sidebar={{ banner: <VariantSwitcher /> }}
    >
      {children}
    </DocsLayout>
  );
}
