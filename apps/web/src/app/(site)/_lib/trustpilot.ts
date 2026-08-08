/**
 * Read side of the Trustpilot guidelines warning.
 *
 * Mirrors the risk-register pattern deliberately: the write side enforces
 * sourcing via `enforceClaimSourcing`, and this read side refuses to surface
 * anything unsourced regardless. Two independent gates, because publishing an
 * undated reputational claim about a named company is the kind of mistake that
 * has to be impossible rather than merely discouraged.
 */
import type { Firm } from '@/payload-types'

export type TrustpilotWarning = {
  checkedAt: string
  profileUrl: string
  underlyingScore: number | null
  underlyingReviews: number | null
  reviewsLast12m: number | null
}

/**
 * The publishable warning for a firm, or null.
 *
 * Returns null unless the warning is active AND carries both a date and a
 * profile URL, so a caller cannot accidentally render a claim the reader has
 * no way to check.
 */
export function publishableWarning(firm: Pick<Firm, 'trustpilotWarning'>): TrustpilotWarning | null {
  const w = firm.trustpilotWarning
  if (!w?.active) return null
  if (!w.checkedAt || !w.profileUrl) return null
  return {
    checkedAt: w.checkedAt,
    profileUrl: w.profileUrl,
    underlyingScore: w.underlyingScore ?? null,
    underlyingReviews: w.underlyingReviews ?? null,
    reviewsLast12m: w.reviewsLast12m ?? null,
  }
}

/** True when we checked the profile and found no warning. Distinct from
 *  "never checked", which is what an absent group means. */
export function checkedAndClean(firm: Pick<Firm, 'trustpilotWarning'>): boolean {
  const w = firm.trustpilotWarning
  return Boolean(w && w.active === false && w.checkedAt)
}

/**
 * Trustpilot's own wording, quoted rather than paraphrased.
 *
 * Paraphrasing would put the characterisation in our voice. Quoting keeps it
 * a report of what a third party displayed, which is the only version of this
 * claim we can stand behind.
 */
export const TRUSTPILOT_LABEL =
  'This company’s rating is unavailable due to a breach of our guidelines.'
