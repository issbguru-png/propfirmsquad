/**
 * Sourcing gates for claims that carry legal or credibility exposure.
 *
 * The pattern is the same one the risk register uses: make the rule structural
 * rather than editorial, so an unsourced claim cannot be saved at all rather
 * than relying on whoever is editing to remember. Three claims qualify:
 *
 * 1. `trustpilotWarning` — stating that Trustpilot flagged a firm for a
 *    guidelines breach is a reputational claim about a named company. It is
 *    defensible only as a dated observation of what the profile displayed, so
 *    an active warning without `checkedAt` AND `profileUrl` is rejected.
 * 2. `payout.totalPaidClaimed` — no firm in this sector publishes an audited
 *    payout total, so the figure is only ever reportable as "the firm claims
 *    X, as of this date, here". Without the date and source it would render as
 *    though we had verified it.
 * 3. `legalEntity` — a registration number with no registry record behind it
 *    is worse than no number at all, because it looks verified.
 */
import { APIError, type CollectionBeforeChangeHook } from 'payload'

/** Field present on the incoming patch, else falling back to the stored doc. */
const merged = <T>(key: string, data: Record<string, unknown>, original: unknown): T | undefined =>
  (key in data ? data[key] : (original as Record<string, unknown> | undefined)?.[key]) as T

const isBlank = (v: unknown): boolean => v == null || (typeof v === 'string' && v.trim() === '')

export const enforceClaimSourcing: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if (!data) return data

  const warning = merged<Record<string, unknown>>('trustpilotWarning', data, originalDoc)
  if (warning?.active === true) {
    const missing = (['checkedAt', 'profileUrl'] as const).filter((f) => isBlank(warning[f]))
    if (missing.length > 0) {
      throw new APIError(
        `An active Trustpilot guidelines warning is a reputational claim and needs ${missing.join(
          ' and ',
        )}. Record what the profile showed and when you looked.`,
        400,
      )
    }
  }

  const payout = merged<Record<string, unknown>>('payout', data, originalDoc)
  if (payout && !isBlank(payout.totalPaidClaimed)) {
    const missing = (['totalPaidClaimedAt', 'totalPaidSourceUrl'] as const).filter((f) =>
      isBlank(payout[f]),
    )
    if (missing.length > 0) {
      throw new APIError(
        `A claimed payout total is a marketing figure, not a verified one, so it needs ${missing.join(
          ' and ',
        )} before it can be published.`,
        400,
      )
    }
  }

  const entity = merged<Record<string, unknown>>('legalEntity', data, originalDoc)
  if (entity && !isBlank(entity.registrationNumber) && isBlank(entity.sourceUrl)) {
    throw new APIError(
      'A company registration number needs a sourceUrl pointing at the public registry record.',
      400,
    )
  }

  return data
}
