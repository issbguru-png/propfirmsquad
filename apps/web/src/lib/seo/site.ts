/**
 * Site-level SEO constants shared by the metadata factory, JSON-LD builders,
 * robots, and sitemaps. Single source of truth for the canonical origin.
 */

export const SITE_NAME = 'PropFirmSquad'

export const SITE_DESCRIPTION =
  'Compare prop trading firms with verified data: rules, payouts, rule-change history, and real trader reviews.'

/** Canonical origin, no trailing slash. */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return raw.replace(/\/+$/, '')
}

/** Absolute canonical URL for a path ('/prop-firms/ftmo' → 'https://…/prop-firms/ftmo'). */
export function absoluteUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${siteUrl()}${p === '/' ? '' : p}` || siteUrl()
}
