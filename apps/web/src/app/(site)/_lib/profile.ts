/** Pure helpers for firm profile pages (rank, subscores, cheapest-challenge grouping). */
import type { Challenge, Firm } from '@/payload-types'

/**
 * Rank of a firm among firms sharing its primary type (firmTypes[0]).
 * `firms` must already be in ranking order (getFirms() handles that).
 * Returns null when the firm has no primary type or isn't in the list.
 */
export function computeTypeRank(
  firm: Pick<Firm, 'id' | 'firmTypes'>,
  firms: Pick<Firm, 'id' | 'firmTypes'>[],
): { rank: number; total: number; type: NonNullable<Firm['firmTypes']>[number] } | null {
  const type = firm.firmTypes?.[0]
  if (!type) return null
  const peers = firms.filter((f) => (f.firmTypes ?? []).includes(type))
  const idx = peers.findIndex((f) => f.id === firm.id)
  if (idx === -1) return null
  return { rank: idx + 1, total: peers.length, type }
}

export type CheapestEntry = { price: number; currency: string; accountSize?: number | null }

/**
 * Group challenges by firm id, keeping only the cheapest row per firm.
 * Handles both depth-0 (number) and populated (object) firm relations.
 */
export function cheapestByFirm(
  challenges: (Pick<Challenge, 'firm' | 'price' | 'currency'> & {
    accountSize?: number | null
  })[],
): Map<number, CheapestEntry> {
  const map = new Map<number, CheapestEntry>()
  for (const c of challenges) {
    const firmId = typeof c.firm === 'object' && c.firm !== null ? c.firm.id : c.firm
    if (firmId == null || c.price == null) continue
    const prev = map.get(firmId)
    if (!prev || c.price < prev.price) {
      map.set(firmId, {
        price: c.price,
        currency: c.currency ?? 'USD',
        accountSize: c.accountSize ?? null,
      })
    }
  }
  return map
}

export const SCORE_LABELS = {
  pricingValue: 'Pricing & value',
  rulesFairness: 'Rules fairness',
  payoutReliability: 'Payout reliability',
  support: 'Support',
  platforms: 'Platforms',
} as const

export type ScoreKey = keyof typeof SCORE_LABELS

/**
 * Extract the present editorial subscores in display order, plus their
 * average (1dp). Returns null when no subscore is set.
 */
export function scoreBreakdown(
  scores: Firm['scores'],
): { rows: { key: ScoreKey; label: string; value: number }[]; overall: number } | null {
  if (!scores) return null
  const rows: { key: ScoreKey; label: string; value: number }[] = []
  for (const key of Object.keys(SCORE_LABELS) as ScoreKey[]) {
    const value = scores[key]
    if (value != null) rows.push({ key, label: SCORE_LABELS[key], value })
  }
  if (rows.length === 0) return null
  const overall =
    Math.round((rows.reduce((sum, r) => sum + r.value, 0) / rows.length) * 10) / 10
  return { rows, overall }
}
