import { loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { docsContentRoute, docsImageRoute, docsRoute } from './shared';
import { defineDocs } from 'fumadocs-mdx/macro';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { z } from 'zod';
import { dimensionKeys, type PageVariants } from './variants';

// Extend the stock page frontmatter with the three variant dimensions. Every
// field is optional: an absent field means the page is CORE and applies to all
// readers, which keeps existing pages valid without a migration.
const juspayPageSchema = pageSchema.extend({
  regions: z.array(z.string()).optional(),
  platforms: z.array(z.string()).optional(),
  integrationPaths: z.array(z.string()).optional(),
});

const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: juspayPageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

export function getPageImageUrl(page: (typeof source)['$inferPage']) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: '/' + [page.locale, ...docsImageRoute.split('/'), ...segments].filter(Boolean).join('/'),
  };
}

export function getPageMarkdownUrl(page: (typeof source)['$inferPage']) {
  const segments = [...page.slugs, 'content.md'];

  return {
    segments,
    url: '/' + [page.locale, ...docsContentRoute.split('/'), ...segments].filter(Boolean).join('/'),
  };
}

export async function getLLMText(page: (typeof source)['$inferPage']) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title} (${page.url})

${processed}`;
}

/** Frontmatter key backing each variant dimension. */
const frontmatterKey = {
  region: 'regions',
  platform: 'platforms',
  integrationPath: 'integrationPaths',
} as const;

/**
 * Build the url -> constraints map the sidebar filters against. Done once on the
 * server so the client only receives the small index, not the page contents.
 */
export function getVariantIndex(): Record<string, PageVariants> {
  const index: Record<string, PageVariants> = {};

  for (const page of source.getPages()) {
    const data = page.data as unknown as Record<string, unknown>;
    const entry: PageVariants = {};

    for (const dimension of dimensionKeys) {
      const value = data[frontmatterKey[dimension]];
      if (Array.isArray(value) && value.length > 0) {
        entry[dimension] = value as string[];
      }
    }

    if (Object.keys(entry).length > 0) index[page.url] = entry;
  }

  return index;
}
