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

export async function getFirms(opts?: { firmType?: string }): Promise<Firm[]> {
  try {
    const payload = await db()
    const where: Where = { listingType: { not_equals: 'delisted' } }
    if (opts?.firmType) where.firmTypes = { contains: opts.firmType }
    const res = await payload.find({
      collection: 'firms',
      where,
      sort: '-reviewScore',
      limit: 200,
      depth: 1, // populate `logo` media for listing cards
    })
    return res.docs
  } catch {
    return []
  }
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
        and: [{ slug: { not_equals: firm.slug } }, { listingType: { not_equals: 'delisted' } }],
      },
      sort: '-reviewScore',
      limit: limit + 5,
      depth: 1, // populate `logo` media for alternative-firm cards
    })
    // Prefer firms sharing a firm type with the current one.
    const types = new Set(firm.firmTypes ?? [])
    const shared = res.docs.filter((f) => (f.firmTypes ?? []).some((t) => types.has(t)))
    const rest = res.docs.filter((f) => !shared.includes(f))
    return [...shared, ...rest].slice(0, limit)
  } catch {
    return []
  }
}
