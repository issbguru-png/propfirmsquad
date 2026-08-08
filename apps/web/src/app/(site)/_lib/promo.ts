/** Pure helpers for the promo-code pages (ranking, outbound link resolution). */
import type { Firm, Promo } from '@/payload-types'

/**
 * Order promos best-first so the featured one is unambiguous.
 *
 * Tie-breakers, in order: bigger discount, exclusive-to-us, has extra perks,
 * then code A→Z so the order is stable across renders (Postgres returns rows
 * in no guaranteed order, and an unstable "best deal" is a trust problem).
 */
export function rankPromos<T extends Pick<Promo, 'code' | 'discountPct' | 'exclusive' | 'extraPerks'>>(
  promos: T[],
): T[] {
  return promos.slice().sort((a, b) => {
    const byDiscount = (b.discountPct ?? 0) - (a.discountPct ?? 0)
    if (byDiscount !== 0) return byDiscount
    const byExclusive = Number(b.exclusive ?? false) - Number(a.exclusive ?? false)
    if (byExclusive !== 0) return byExclusive
    const byPerks = Number(Boolean(b.extraPerks)) - Number(Boolean(a.extraPerks))
    if (byPerks !== 0) return byPerks
    return a.code.localeCompare(b.code)
  })
}

/**
 * Where the "go to the firm" CTA points. Prefers the tracked affiliate link,
 * falls back to the plain website, and returns null when we have neither
 * (rendering no CTA beats rendering a dead one).
 */
export function outboundUrl(firm: Pick<Firm, 'affiliateUrl' | 'websiteUrl'>): string | null {
  const affiliate = firm.affiliateUrl?.trim()
  if (affiliate) return affiliate
  const website = firm.websiteUrl?.trim()
  return website ? website : null
}

/** True when the CTA is monetised, i.e. we must disclose a commission. */
export function isAffiliateLink(firm: Pick<Firm, 'affiliateUrl'>): boolean {
  return Boolean(firm.affiliateUrl?.trim())
}
