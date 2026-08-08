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

/**
 * The site's headline rating: the average of Ayub's five published subscores.
 *
 * This is THE score. It is deliberately not `firm.reviewScore`, which was
 * seeded from propfirmmatch's API and describes reviews left on their site by
 * their users. Ranking our own listings by a competitor's number, while
 * /methodology promised "no commercial field anywhere in that sort", was the
 * single biggest credibility hole in the build.
 *
 * Every input to this number is published on the firm's profile, so a reader
 * can add up the five bars and check we arrived at the same figure. Returns
 * null when a firm has no subscores yet, and null sorts last.
 */
export function squadScore(firm: Pick<Firm, 'scores'>): number | null {
  return scoreBreakdown(firm.scores)?.overall ?? null
}

/**
 * Ranking order for firm listings: squad score desc, unscored LAST.
 *
 * The squad score is the average of Ayub's five published subscores, so the
 * sort key is something we authored and a reader can recheck from the bars on
 * the profile page. It replaced `reviewScore`, which had been seeded from
 * propfirmmatch's API: ranking our listings by a commission-earning
 * competitor's number contradicted the promise on /methodology that there is
 * no commercial field anywhere in this sort.
 *
 * Ties break on Trustpilot score, then on review volume, both of which are
 * third-party signals and so are only ever tiebreakers, never the key.
 * Unscored firms sort last: `sort: '-...'` in Postgres puts nulls first, which
 * once ranked an unrated FTMO #1 sitewide, hence the explicit JS sort.
 */
export function compareFirmsByRating(a: Firm, b: Firm): number {
  const sa = squadScore(a)
  const sb = squadScore(b)
  if (sa != null || sb != null) {
    if (sa == null) return 1
    if (sb == null) return -1
    if (sb !== sa) return sb - sa
  }
  const byTrustpilot = effectiveTrustpilot(b) - effectiveTrustpilot(a)
  if (byTrustpilot !== 0) return byTrustpilot
  return (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0)
}

/**
 * Trustpilot score for tiebreak purposes, falling back to the score Trustpilot
 * is currently hiding.
 *
 * When a profile carries a guidelines warning the public star rating is
 * suppressed, so `trustPilotScore` scraped as null. Treating that null as 0
 * would push every flagged firm to the bottom of any tie, which is an
 * automatic rank penalty for carrying a warning. We deliberately do not apply
 * one: the warning is published as evidence and readers weigh it themselves.
 * Using the underlying score keeps the tiebreak measuring what it claims to.
 */
function effectiveTrustpilot(firm: Firm): number {
  return firm.trustPilotScore ?? firm.trustpilotWarning?.underlyingScore ?? 0
}
