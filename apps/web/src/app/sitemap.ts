import type { MetadataRoute } from 'next'
import { SITEMAP_SEGMENTS, buildSitemapSegment } from '@/lib/seo/sitemap-helpers'

/**
 * Segmented sitemaps (Next 15 generateSitemaps convention).
 * Served at /sitemap/static.xml, /sitemap/firms.xml, /sitemap/tools.xml,
 * /sitemap/learn.xml — robots.ts references each one. To add a segment
 * (news, best…), extend SITEMAP_SEGMENTS in lib/seo/sitemap-helpers.ts.
 */

export async function generateSitemaps(): Promise<{ id: string }[]> {
  return SITEMAP_SEGMENTS.map((id) => ({ id }))
}

export default async function sitemap({ id }: { id: string }): Promise<MetadataRoute.Sitemap> {
  return buildSitemapSegment(id)
}
