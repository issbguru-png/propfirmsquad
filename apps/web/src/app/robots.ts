import type { MetadataRoute } from 'next'
import { SITEMAP_SEGMENTS } from '@/lib/seo/sitemap-helpers'
import { siteUrl } from '@/lib/seo/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api'],
      },
    ],
    sitemap: SITEMAP_SEGMENTS.map((segment) => `${siteUrl()}/sitemap/${segment}.xml`),
  }
}
