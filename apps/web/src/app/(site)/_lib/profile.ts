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

// ── Leverage matrix ────────────────────────────────────────────────
// Firms publish leverage either as one account-wide figure or per asset,
// and sometimes per program on top of that. The renderer wants a plain
// grid, so collapse whatever shape we stored into rows × columns.

type LeverageRow = NonNullable<NonNullable<Firm['trading']>['leverage']>[number]

export type LeverageMatrix = {
  /** Program columns in canonical order. `all` collapses to a single column. */
  programs: string[]
  /** One row per asset, in the order the firm's rows were stored. */
  rows: { asset: string; ratios: (string | null)[] }[]
}

const PROGRAM_ORDER = ['all', 'instant', '1-step', '2-step', '3-step']

/**
 * Group leverage rows into an asset × program grid.
 * Returns null when there is nothing to show, so callers can skip the block
 * entirely rather than render an empty table.
 */
export function leverageMatrix(rows: LeverageRow[] | null | undefined): LeverageMatrix | null {
  const usable = (rows ?? []).filter((r) => r?.asset && r?.ratio)
  if (usable.length === 0) return null

  const programs = PROGRAM_ORDER.filter((p) =>
    usable.some((r) => (r.programType ?? 'all') === p),
  )
  // A firm that only ever publishes "all" needs no program column at all.
  const assets: string[] = []
  for (const r of usable) if (!assets.includes(r.asset)) assets.push(r.asset)

  return {
    programs,
    rows: assets.map((asset) => ({
      asset,
      ratios: programs.map(
        (p) =>
          usable.find((r) => r.asset === asset && (r.programType ?? 'all') === p)?.ratio ?? null,
      ),
    })),
  }
}

/**
 * Firm-level challenge time-limit summary, or null when we have not verified
 * time limits for this firm. `null` on a challenge means "no time limit", so
 * it is only ever trusted behind the firm's timeLimitsVerified flag.
 */
export function timeLimitSummary(
  rulesSummary: Firm['rulesSummary'],
  challenges: { timeLimitDays?: number | null }[],
): { label: string; unlimited: boolean } | null {
  if (!rulesSummary?.timeLimitsVerified) return null
  const limits = challenges.map((c) => c.timeLimitDays ?? null)
  const withLimit = limits.filter((d): d is number => d != null)
  if (withLimit.length === 0) return { label: 'No time limit', unlimited: true }
  if (withLimit.length === limits.length && new Set(withLimit).size === 1) {
    return { label: `${withLimit[0]} days`, unlimited: false }
  }
  return { label: 'Varies by program (see pricing)', unlimited: false }
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
