/**
 * Payload Local API access for (site) pages.
 * Every helper degrades gracefully: DB/collection missing → empty result,
 * so pages render (with honest empty states) even without seeded data.
 */
import { getPayload, type Where } from 'payload'
import config from '@payload-config'
import type { Challenge, Firm, Promo, RuleChange } from '@/payload-types'

async function db() {
  return getPayload({ config })
}

/**
 * Ranking order for firm listings: reviewScore desc with null (unrated) LAST —
 * Postgres `sort: '-reviewScore'` puts nulls first, which ranked unrated firms
 * #1 sitewide. Ties break on reviewsCount desc, then trustPilotScore desc.
 */
export function compareFirmsByRating(a: Firm, b: Firm): number {
  if (a.reviewScore != null || b.reviewScore != null) {
    if (a.reviewScore == null) return 1
    if (b.reviewScore == null) return -1
    if (b.reviewScore !== a.reviewScore) return b.reviewScore - a.reviewScore
  }
  const byReviews = (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0)
  if (byReviews !== 0) return byReviews
  return (b.trustPilotScore ?? 0) - (a.trustPilotScore ?? 0)
}

/**
 * Ranked firms for every public listing surface (homepage top-10, /best hubs,
 * /prop-firms directory).
 *
 * The `listingType: 'listed'` filter is load-bearing: the firms collection also
 * holds `delisted` records that exist ONLY as the sourced risk register on the
 * homepage (closed, rebranded, or regulator-charged firms). Those must
 * never appear in a ranking — an allow-list (`equals: 'listed'`) rather than a
 * deny-list, so a future listingType value can't silently leak into rankings.
 */
export async function getFirms(opts?: { firmType?: string }): Promise<Firm[]> {
  try {
    const payload = await db()
    const where: Where = { listingType: { equals: 'listed' } }
    if (opts?.firmType) where.firmTypes = { contains: opts.firmType }
    const res = await payload.find({
      collection: 'firms',
      where,
      sort: '-reviewScore',
      limit: 200,
      depth: 1, // populate `logo` media for listing cards
    })
    // Re-sort in JS: Postgres puts null reviewScore first; we want unrated last.
    return res.docs.slice().sort(compareFirmsByRating)
  } catch {
    return []
  }
}

/**
 * The risk register shown on the homepage: firms with a non-`none` riskStatus.
 *
 * LEGAL GATE (see Firms.ts): a record is only returned when it carries at least
 * one riskEvent that has BOTH a date and a source URL. An unsourced entry is
 * dropped rather than rendered — we never publish a status claim about a named
 * company that a reader cannot verify from the page. Newest event first.
 */
export async function getRiskFirms(): Promise<Firm[]> {
  try {
    const payload = await db()
    const res = await payload.find({
      collection: 'firms',
      where: { riskStatus: { not_in: ['none'] } },
      limit: 100,
      depth: 1, // populate `logo` media for the entry cards
    })
    return res.docs
      .filter((f) => (f.riskEvents ?? []).some((e) => e?.date && e?.sourceUrl))
      .sort((a, b) => latestRiskEventTime(b) - latestRiskEventTime(a))
  } catch {
    return []
  }
}

/** Epoch ms of a firm's most recent dated risk event (0 when it has none). */
export function latestRiskEventTime(firm: Firm): number {
  return (firm.riskEvents ?? []).reduce((max, e) => {
    const t = e?.date ? new Date(e.date).getTime() : NaN
    return Number.isFinite(t) && t > max ? t : max
  }, 0)
}

export async function getFirmBySlug(slug: string): Promise<Firm | null> {
  try {
    const payload = await db()
    const res = await payload.find({
      collection: 'firms',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 1,
    })
    return res.docs[0] ?? null
  } catch {
    return null
  }
}

export async function getChallengesForFirm(firmId: number): Promise<Challenge[]> {
  try {
    const payload = await db()
    const res = await payload.find({
      collection: 'challenges',
      where: {
        and: [{ firm: { equals: firmId } }, { isActive: { not_equals: false } }],
      },
      sort: 'accountSize',
      limit: 100,
      depth: 0,
    })
    return res.docs
  } catch {
    return []
  }
}

/** Active challenges for several firms in ONE query (mini comparison table). */
export async function getChallengesForFirms(firmIds: number[]): Promise<Challenge[]> {
  if (firmIds.length === 0) return []
  try {
    const payload = await db()
    const res = await payload.find({
      collection: 'challenges',
      where: {
        and: [{ firm: { in: firmIds } }, { isActive: { not_equals: false } }],
      },
      limit: 300,
      depth: 0,
    })
    return res.docs
  } catch {
    return []
  }
}

const promoIsLive = (p: Promo) =>
  p.active !== false && (!p.endDate || new Date(p.endDate).getTime() >= Date.now())

/** Active promos for one firm (depth 0). */
export async function getPromosForFirm(firmId: number): Promise<Promo[]> {
  try {
    const payload = await db()
    const res = await payload.find({
      collection: 'promos',
      where: { and: [{ firm: { equals: firmId } }, { active: { equals: true } }] },
      limit: 20,
      depth: 0,
    })
    return res.docs.filter(promoIsLive)
  } catch {
    return []
  }
}

/** All live promos across firms, firm relation populated, best discount first. */
export async function getAllActivePromos(): Promise<Promo[]> {
  try {
    const payload = await db()
    const res = await payload.find({
      collection: 'promos',
      where: { active: { equals: true } },
      limit: 200,
      depth: 1,
    })
    return res.docs
      .filter(promoIsLive)
      .sort((a, b) => (b.discountPct ?? 0) - (a.discountPct ?? 0))
  } catch {
    return []
  }
}

export async function getRuleChangesForFirm(firmId: number): Promise<RuleChange[]> {
  try {
    const payload = await db()
    const res = await payload.find({
      collection: 'rule-changes',
      where: { firm: { equals: firmId } },
      sort: '-date',
      limit: 20,
      depth: 0,
    })
    return res.docs
  } catch {
    return []
  }
}

/** Top-scored alternatives to a firm (same directory, different slug). */
export async function getAlternatives(firm: Firm, limit = 3): Promise<Firm[]> {
  try {
    const payload = await db()
    const res = await payload.find({
      collection: 'firms',
      where: {
        // Same allow-list as getFirms: never suggest a delisted/risk-register firm.
        and: [{ slug: { not_equals: firm.slug } }, { listingType: { equals: 'listed' } }],
      },
      sort: '-reviewScore',
      limit: limit + 5,
      depth: 1, // populate `logo` media for alternative-firm cards
    })
    // Re-sort in JS (nulls last), then prefer firms sharing a firm type with the current one.
    const ranked = res.docs.slice().sort(compareFirmsByRating)
    const types = new Set(firm.firmTypes ?? [])
    const shared = ranked.filter((f) => (f.firmTypes ?? []).some((t) => types.has(t)))
    const rest = ranked.filter((f) => !shared.includes(f))
    return [...shared, ...rest].slice(0, limit)
  } catch {
    return []
  }
}
