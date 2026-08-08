/**
 * Segment builders for the sitemap (app/sitemap.ts uses generateSitemaps, so
 * each segment is served at /sitemap/{segment}.xml). Adding a segment later
 * (news, best, countries…) = add an id to SITEMAP_SEGMENTS and a case in
 * buildSitemapSegment. robots.ts lists every segment automatically.
 */

import type { MetadataRoute } from 'next'
import { absoluteUrl } from './site'
import { listLearnArticles } from './learn-content'

export const SITEMAP_SEGMENTS = ['static', 'firms', 'tools', 'learn'] as const
export type SitemapSegment = (typeof SITEMAP_SEGMENTS)[number]

type Entry = MetadataRoute.Sitemap[number]

/** Hand-maintained static routes (lane C pages). */
const STATIC_PATHS = [
  '/',
  '/prop-firms',
  '/deals',
  '/firms-to-avoid',
  '/methodology',
  '/about',
  '/contact',
]

/** The 5 calculators (lane D routes; slugs frozen in ROUTES.md/packages/calc). */
export const TOOL_SLUGS = [
  'consistency-calculator',
  'drawdown-calculator',
  'challenge-roi-calculator',
  'payout-split-calculator',
  'profit-target-calculator',
]

export function staticEntries(): Entry[] {
  return STATIC_PATHS.map((p) => ({
    url: absoluteUrl(p),
    changeFrequency: p === '/' ? 'daily' : 'weekly',
    priority: p === '/' ? 1 : 0.7,
  }))
}

export function toolEntries(): Entry[] {
  return TOOL_SLUGS.map((slug) => ({
    url: absoluteUrl(`/tools/${slug}`),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))
}

/**
 * Published + indexable firms with real lastmod from updatedAt.
 * Degrades to [] if the DB is unreachable (e.g. static build without Postgres).
 */
export async function firmEntries(): Promise<Entry[]> {
  try {
    const [{ getPayload }, { default: config }] = await Promise.all([
      import('payload'),
      import('@payload-config'),
    ])
    const payload = await getPayload({ config })
    const firms = await payload.find({
      collection: 'firms',
      where: {
        and: [{ _status: { equals: 'published' } }, { 'seo.indexable': { equals: true } }],
      },
      limit: 1000,
      depth: 0,
      select: { slug: true, updatedAt: true },
    })
    return firms.docs.flatMap((firm) => [
      {
        url: absoluteUrl(`/prop-firms/${firm.slug}`),
        lastModified: new Date(firm.updatedAt),
        changeFrequency: 'daily' as const,
        priority: 0.9,
      },
      {
        url: absoluteUrl(`/prop-firms/${firm.slug}/promo-code`),
        lastModified: new Date(firm.updatedAt),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      },
    ])
  } catch {
    // DB unavailable at build time — firms segment ships empty, static survives.
    return []
  }
}

export function learnEntries(): Entry[] {
  const entries: Entry[] = [
    { url: absoluteUrl('/learn'), changeFrequency: 'weekly', priority: 0.6 },
  ]
  for (const article of listLearnArticles()) {
    entries.push({
      url: absoluteUrl(`/learn/${article.frontmatter.slug}`),
      ...(article.frontmatter.updated
        ? { lastModified: new Date(article.frontmatter.updated) }
        : {}),
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  }
  return entries
}

export async function buildSitemapSegment(id: string): Promise<MetadataRoute.Sitemap> {
  switch (id as SitemapSegment) {
    case 'static':
      return staticEntries()
    case 'firms':
      return firmEntries()
    case 'tools':
      return toolEntries()
    case 'learn':
      return learnEntries()
    default:
      return []
  }
}
