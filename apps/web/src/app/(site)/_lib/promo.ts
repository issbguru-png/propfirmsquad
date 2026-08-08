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

/** Discount headline for a promo card, e.g. "45% off" or "Special offer". */
export function discountLabel(promo: Pick<Promo, 'discountPct'>): string {
  return promo.discountPct != null ? `${promo.discountPct}% off` : 'Special offer'
}

/**
 * Resolve a promo's `firm` relation to the populated doc, or null when the
 * query ran at depth 0 (relation is an id) or the firm was deleted.
 * A deal we cannot name is a deal we do not render.
 */
export function promoFirm(promo: Pick<Promo, 'firm'>): Firm | null {
  return typeof promo.firm === 'object' && promo.firm !== null ? promo.firm : null
}

/**
 * Price after a percentage discount, rounded to whole units.
 * Returns null when either input is missing, so callers show the list price
 * rather than inventing a number.
 */
export function discountedPrice(
  price: number | null | undefined,
  discountPct: number | null | undefined,
): number | null {
  if (price == null || discountPct == null) return null
  if (discountPct <= 0 || discountPct >= 100) return null
  return Math.round(price * (1 - discountPct / 100))
}

/** Largest discount in a set, or null when nothing carries a percentage. */
export function bestDiscountPct(promos: Pick<Promo, 'discountPct'>[]): number | null {
  const pcts = promos.map((p) => p.discountPct).filter((n): n is number => n != null)
  return pcts.length > 0 ? Math.max(...pcts) : null
}

/** The subset of a firm's markets we expose as filter chips on /deals. */
export const DEAL_MARKETS = ['cfd', 'futures', 'crypto'] as const
export type DealMarket = (typeof DEAL_MARKETS)[number]

export function isDealMarket(value: string | undefined): value is DealMarket {
  return value != null && (DEAL_MARKETS as readonly string[]).includes(value)
}

/** A promo paired with its populated firm, the shape every deal card needs. */
export type DealLike = { firm: Pick<Firm, 'firmTypes'> }

/** Deals whose firm trades the given market; unfiltered when market is null. */
export function filterDealsByMarket<T extends DealLike>(deals: T[], market: DealMarket | null): T[] {
  if (!market) return deals
  return deals.filter((d) => (d.firm.firmTypes ?? []).includes(market))
}

/** How many deals each filter chip would show, so empty chips can be hidden. */
export function countDealsByMarket<T extends DealLike>(deals: T[]): Record<DealMarket, number> {
  const counts = { cfd: 0, futures: 0, crypto: 0 }
  for (const deal of deals) {
    for (const market of DEAL_MARKETS) {
      if ((deal.firm.firmTypes ?? []).includes(market)) counts[market] += 1
    }
  }
  return counts
}
