/**
 * Metadata factory — the ONLY place page titles/descriptions are built
 * (docs/ROUTES.md, "SEO conventions"). All lanes call these builders; no
 * hand-rolled <title> strings in route files.
 *
 * Title templates (frozen, founder-approved):
 *   Profile:    {Firm} Review {Year}: Rules, Payouts & Real Trader Data ({squad score}★)
 *   Promo page: {Firm} Promo Code {Month} {Year}: {X}% Off (Verified)
 */

import type { Metadata } from 'next'
import type { Firm, Promo } from '@/payload-types'
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from './site'
import { squadScore } from '@/app/(site)/_lib/profile'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

/** Rating for titles — always 1 decimal place ("4.5"). */
export function formatRating(score: number): string {
  return score.toFixed(1)
}

const NOINDEX: Metadata['robots'] = { index: false, follow: true }

/**
 * Per ROUTES.md, thin/new pages default to noindex until the data-density
 * threshold is met — so anything but an explicit `indexable: true` is noindex.
 */
function firmIsIndexable(firm: Firm): boolean {
  return firm.seo?.indexable === true
}

type BuildArgs = {
  title: string
  description: string
  path: string
  index: boolean
  ogType?: 'website' | 'article'
}

function build({ title, description, path, index, ogType = 'website' }: BuildArgs): Metadata {
  const url = absoluteUrl(path)
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: ogType,
      locale: 'en_US',
    },
    ...(index ? {} : { robots: NOINDEX }),
  }
}

/** /prop-firms/[slug] — the mega-profile. */
export function firmProfileMeta(firm: Firm, now: Date = new Date()): Metadata {
  const year = now.getFullYear()
  // The squad score, not firm.reviewScore: the latter was seeded from
  // propfirmmatch's API, so putting it in our title advertised their rating.
  const score = squadScore(firm)
  const rating = score != null ? ` (${formatRating(score)}★)` : ''
  const title =
    firm.seo?.metaTitle || `${firm.name} Review ${year}: Rules, Payouts & Real Trader Data${rating}`
  const description =
    firm.seo?.metaDescription ||
    `${firm.name} rules, payouts, challenge pricing and rule-change history: verified data, scored against a published methodology, updated ${MONTHS[now.getMonth()]} ${year}.`
  return build({
    title,
    description,
    path: `/prop-firms/${firm.slug}`,
    index: firmIsIndexable(firm),
  })
}

/** /prop-firms/[slug]/promo-code — the only child page (coupon intent). */
export function promoPageMeta(firm: Firm, promo: Promo, now: Date = new Date()): Metadata {
  const month = MONTHS[now.getMonth()]
  const year = now.getFullYear()
  const off = promo.discountPct != null ? `: ${promo.discountPct}% Off (Verified)` : ' (Verified)'
  const title = `${firm.name} Promo Code ${month} ${year}${off}`
  const description = `Working ${firm.name} promo code for ${month} ${year}: code "${promo.code}"${
    promo.discountPct != null ? ` for ${promo.discountPct}% off` : ''
  }. Verified by ${SITE_NAME}${promo.exclusive ? ', exclusive to our readers' : ''}.`
  return build({
    title,
    description,
    path: `/prop-firms/${firm.slug}/promo-code`,
    // Promo page inherits the firm's indexability gate.
    index: firmIsIndexable(firm) && promo.active === true,
  })
}

/** /best/[list] — curated ranking pages. Title comes from CMS/config, verbatim. */
export function bestListMeta(slug: string, title: string, description?: string): Metadata {
  return build({
    title,
    description:
      description ||
      `${title}, ranked with verified data on rules, pricing, payouts and real trader reviews.`,
    path: `/best/${slug}`,
    index: true,
  })
}

/** /tools/[tool] — calculators. `name` is the human name, e.g. "Consistency Calculator". */
export function toolMeta(name: string, slug?: string): Metadata {
  const toolSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return build({
    title: `${name}: Free Prop Firm Tool`,
    description: `Free ${name.toLowerCase()} for prop firm traders. Instant results, no signup, built on the same verified rule data as our firm profiles.`,
    path: `/tools/${toolSlug}`,
    index: true,
  })
}

export type LearnFrontmatter = {
  slug: string
  title: string
  description: string
  /** ISO date the article was last updated, from frontmatter. */
  updated?: string
}

/** /learn/[slug] — evergreen educational articles. */
export function learnMeta(frontmatter: LearnFrontmatter): Metadata {
  const meta = build({
    title: frontmatter.title,
    description: frontmatter.description,
    path: `/learn/${frontmatter.slug}`,
    index: true,
    ogType: 'article',
  })
  if (frontmatter.updated) {
    meta.openGraph = { ...meta.openGraph, type: 'article', modifiedTime: frontmatter.updated }
  }
  return meta
}

/** Fallback for static pages (/methodology, /about, …). */
export function staticPageMeta(title: string, path: string, description?: string): Metadata {
  return build({ title, description: description || SITE_DESCRIPTION, path, index: true })
}
