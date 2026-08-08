/**
 * Shared vocabulary for the risk register, which is now a single compact table
 * on the homepage. Server-side only.
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

/* ── Primary document ──────────────────────────────────────────────────────
 * The homepage table gives each firm exactly one link, so that link has to be
 * the most authoritative thing we hold. Everything below derives the answer
 * from the URL alone: there is no extra schema field to fall out of sync with
 * the source list, and a wrong link is visible as a wrong label.
 */

/** Publisher classes, ordered: a lower rank is a better primary document. */
export const DOCUMENT_KINDS = [
  'regulator-filing',
  'regulator-release',
  'firm',
  'press',
] as const
export type DocumentKind = (typeof DOCUMENT_KINDS)[number]

export type PrimaryDocument = {
  url: string
  /** What the reader is about to open, e.g. "CFTC court filing (PDF)". */
  label: string
  kind: DocumentKind
  /** Bare host, shown as subtext so the destination is legible before clicking. */
  host: string
}

/**
 * Regulators whose domain does not contain a `gov` label. Anything with one
 * (cftc.gov, sec.gov, asic.gov.au) is detected structurally instead, so a new
 * agency needs no code change.
 */
const REGULATOR_HOSTS: Record<string, string> = {
  'fca.org.uk': 'FCA',
  'nfa.futures.org': 'NFA',
  'esma.europa.eu': 'ESMA',
}

/**
 * Trade press we cite. Explicit rather than inferred: the alternative is
 * treating every unknown host as journalism, which would silently mislabel a
 * firm's own blog post as independent reporting.
 */
const PRESS_HOSTS = new Set([
  'financemagnates.com',
  'tradeinformer.com',
  'fxnewsgroup.com',
  'reuters.com',
  'bloomberg.com',
])

/** The agency behind a host, or null when the host is not a regulator. */
function regulatorOf(host: string): string | null {
  if (host in REGULATOR_HOSTS) return REGULATOR_HOSTS[host]
  const labels = host.split('.')
  return labels.includes('gov') && labels[0] ? labels[0].toUpperCase() : null
}

/**
 * True for a PDF. Covers the plain `.pdf` extension and the CFTC's own pattern
 * (`/media/<id>/<name>/download`), which serves application/pdf from an
 * extensionless path — labelling those "press release" would misdescribe a
 * 41-page court filing.
 */
export function isPdfUrl(url: string): boolean {
  try {
    const { pathname } = new URL(url)
    return /\.pdf$/i.test(pathname) || /^\/media\/\d+\/[^/]+\/download$/.test(pathname)
  } catch {
    return false
  }
}

/** Classify a source URL by publisher, which is also its preference rank. */
export function documentKind(url: string): DocumentKind {
  const host = sourceHost(url)
  if (regulatorOf(host)) return isPdfUrl(url) ? 'regulator-filing' : 'regulator-release'
  return PRESS_HOSTS.has(host) ? 'press' : 'firm'
}

/** Human label for a source URL, e.g. "CFTC court filing (PDF)". */
export function documentLabel(url: string): string {
  const host = sourceHost(url)
  const agency = regulatorOf(host)
  switch (documentKind(url)) {
    case 'regulator-filing':
      return `${agency} court filing (PDF)`
    case 'regulator-release':
      return `${agency} press release`
    case 'firm':
      return 'Firm announcement'
    case 'press':
      return 'Trade press report'
  }
}

/**
 * The one document the table links for a firm: best publisher class first, and
 * within a class the most recent event.
 *
 * Recency-within-class is the load-bearing half. My Forex Funds carries two
 * CFTC-hosted filings — the 2023 restraining order and the 2025 report
 * recommending dismissal with prejudice — and linking the older one would point
 * a reader at a freeze order for a case that no longer exists.
 *
 * Returns null when the firm has no sourced event, matching the read-time gate:
 * no source, no entry.
 */
export function pickPrimaryDocument(firm: Firm): PrimaryDocument | null {
  const best = sourcedRiskEvents(firm) // already newest-first
    .map((e) => ({ url: e.sourceUrl, rank: DOCUMENT_KINDS.indexOf(documentKind(e.sourceUrl)) }))
    .reduce<{ url: string; rank: number } | null>(
      (acc, cur) => (acc === null || cur.rank < acc.rank ? cur : acc),
      null,
    )
  if (!best) return null
  return {
    url: best.url,
    label: documentLabel(best.url),
    kind: DOCUMENT_KINDS[best.rank],
    host: sourceHost(best.url),
  }
}

/**
 * The n highest-signal entries for the homepage table: regulatory action and
 * closures ahead of rebrands (RISK_STATUS_ORDER), then most recent first.
 * Firms with no linkable document are dropped rather than shown bare.
 */
export function topRiskEntries(firms: Firm[], n: number): Firm[] {
  return firms
    .filter((f) => riskStatusOf(f) !== null && pickPrimaryDocument(f) !== null)
    .sort((a, b) => {
      const byStatus =
        RISK_STATUS_ORDER.indexOf(riskStatusOf(a)!) - RISK_STATUS_ORDER.indexOf(riskStatusOf(b)!)
      return byStatus !== 0 ? byStatus : latestEventTime(b) - latestEventTime(a)
    })
    .slice(0, n)
}

function latestEventTime(firm: Firm): number {
  const newest = sourcedRiskEvents(firm)[0]
  return newest ? new Date(newest.date).getTime() : 0
}
