/**
 * Shared vocabulary for the risk register (/firms-to-avoid + the homepage
 * teaser). Server-side only.
 *
 * LEGAL: these are *status categories describing a documented event*, never
 * verdicts on a company. "Regulatory action" means a regulator filed something
 * on a date we can link to — it does not mean wrongdoing was established, and
 * the copy on the page says so. Keep the labels descriptive; if a label ever
 * starts reading like an accusation, it is the wrong label.
 *
 * Tone maps to the design system's semantic colors. `rebranded` is deliberately
 * neutral: a firm changing hands is news, not a warning. The orange accent is
 * never used here — it stays reserved for its normal duties.
 */
import type { Firm } from '@/payload-types'

export type RiskStatus = Exclude<NonNullable<Firm['riskStatus']>, 'none'>

export type RiskStatusMeta = {
  /** Badge text and group heading. */
  label: string
  tone: 'negative' | 'neutral'
  /** One line explaining what the category means, shown above each group. */
  meaning: string
}

export const RISK_STATUS: Record<RiskStatus, RiskStatusMeta> = {
  regulatory: {
    label: 'Regulatory action',
    tone: 'negative',
    meaning:
      'A regulator or court filed a documented action involving the firm. Allegations in a complaint are not findings of wrongdoing, and where a case was later dismissed or resolved we record that in the same timeline.',
  },
  ceased: {
    label: 'Ceased operations',
    tone: 'negative',
    meaning:
      'The firm announced it had stopped or was winding down operations. Where it published a refund or payout plan, the entry says so.',
  },
  watch: {
    label: 'Under review',
    tone: 'neutral',
    meaning:
      'A documented disruption to trading or payouts that has since changed. These entries stay listed because the history is relevant, not because the firm is currently down.',
  },
  rebranded: {
    label: 'Acquired / rebranded',
    tone: 'neutral',
    meaning:
      'The firm still operates, under a new name or a new owner. This is not a warning — it is here so traders searching the old brand name find out where it went.',
  },
}

/** Display order: most serious first, so the page reads top-down by severity. */
export const RISK_STATUS_ORDER: RiskStatus[] = ['regulatory', 'ceased', 'watch', 'rebranded']

/** The firm's status, or null when it carries none (i.e. a normally listed firm). */
export function riskStatusOf(firm: Firm): RiskStatus | null {
  const status = firm.riskStatus
  return status && status !== 'none' && status in RISK_STATUS ? (status as RiskStatus) : null
}

export type RiskEvent = { date: string; event: string; sourceUrl: string }

/**
 * A firm's dated, sourced events, newest first.
 *
 * Rows missing a date or a source URL are dropped: the page must never show a
 * claim a reader cannot click through and check.
 */
export function sourcedRiskEvents(firm: Firm): RiskEvent[] {
  return (firm.riskEvents ?? [])
    .flatMap((e) =>
      e?.date && e?.event && e?.sourceUrl
        ? [{ date: e.date, event: e.event, sourceUrl: e.sourceUrl }]
        : [],
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

/** Hostname of a source URL, for the visible "via cftc.gov" label. */
export function sourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'source'
  }
}
