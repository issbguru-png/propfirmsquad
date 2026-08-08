/** Formatting + label helpers for (site) pages. Server-side only. */
import type { Firm } from '@/payload-types'

export const CURRENT_YEAR = new Date().getUTCFullYear()

export function monthYear(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export function money(n: number | null | undefined, currency = 'USD'): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(n)
}

/** $1,750,000 → "$1.75M" */
export function compactMoney(n: number | null | undefined): string {
  if (n == null) return '—'
  return `$${new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(n)}`
}

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Parse an ISO date input for display. Bare date-only strings ("2015-01-01")
 * are pinned to UTC midnight so they can never shift a day (or a year) when
 * formatted, regardless of the server's timezone.
 */
function parseIsoUTC(iso: string): Date {
  return new Date(DATE_ONLY_RE.test(iso) ? `${iso}T00:00:00.000Z` : iso)
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = parseIsoUTC(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function yearOf(iso: string | null | undefined): number | null {
  if (!iso) return null
  const d = parseIsoUTC(iso)
  return Number.isNaN(d.getTime()) ? null : d.getUTCFullYear()
}

/** Trailing editorial marker appended to seeded verdicts, e.g. "[Draft verdict — pending editorial review.]" */
const DRAFT_VERDICT_RE = /\[Draft verdict[^\]]*\]\s*$/

/**
 * Detect and strip a trailing "[Draft verdict …]" marker from verdict
 * paragraphs so it can render as a status badge instead of body copy.
 */
export function splitDraftMarker(paragraphs: string[]): {
  paragraphs: string[]
  isDraft: boolean
} {
  if (paragraphs.length === 0) return { paragraphs, isDraft: false }
  const last = paragraphs[paragraphs.length - 1]
  if (!DRAFT_VERDICT_RE.test(last)) return { paragraphs, isDraft: false }
  const stripped = last.replace(DRAFT_VERDICT_RE, '').trim()
  const rest = paragraphs.slice(0, -1)
  return { paragraphs: stripped ? [...rest, stripped] : rest, isDraft: true }
}

export const FIRM_TYPE_LABELS: Record<NonNullable<Firm['firmTypes']>[number], string> = {
  cfd: 'CFD / Forex',
  futures: 'Futures',
  crypto: 'Crypto',
  options: 'Options',
  stocks: 'Stocks',
}

export const PROGRAM_LABELS: Record<NonNullable<Firm['programTypes']>[number], string> = {
  instant: 'Instant funding',
  '1-step': '1-step',
  '2-step': '2-step',
  '3-step': '3-step',
}

export const ASSET_LABELS: Record<NonNullable<Firm['assets']>[number], string> = {
  fx: 'Forex',
  indices: 'Indices',
  metals: 'Metals',
  energy: 'Energy',
  crypto: 'Crypto',
  stocks: 'Stocks',
  'other-commodities': 'Commodities',
}

/** Asset labels for the leverage matrix, which also allows an account-wide row. */
export const LEVERAGE_ASSET_LABELS: Record<string, string> = {
  ...ASSET_LABELS,
  all: 'All assets',
}

export const LEVERAGE_PROGRAM_LABELS: Record<string, string> = {
  ...PROGRAM_LABELS,
  all: 'Max leverage',
}

/** How the trader pays the firm — distinct from PAYOUT_METHOD_LABELS. */
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: 'Credit / debit card',
  'apple-pay': 'Apple Pay',
  'google-pay': 'Google Pay',
  paypal: 'PayPal',
  crypto: 'Crypto',
  'bank-transfer': 'Bank transfer',
  other: 'Other local methods',
}

export const WEEKEND_HOLDING_LABELS: Record<string, string> = {
  allowed: 'Allowed',
  'not-allowed': 'Not allowed',
  'swing-only': 'Swing accounts only',
}

export const DRAWDOWN_LABELS: Record<string, string> = {
  static: 'Static',
  'trailing-eod': 'Trailing (end of day)',
  'trailing-intraday': 'Trailing (intraday)',
  hybrid: 'Hybrid',
}

export const PAYOUT_METHOD_LABELS: Record<string, string> = {
  crypto: 'Crypto',
  'bank-transfer': 'Bank transfer',
  wise: 'Wise',
  paypal: 'PayPal',
  other: 'Other',
}

/** Country ISO2 → display name (Intl-backed, falls back to the code). */
export function countryName(iso2: string | null | undefined): string {
  if (!iso2) return '—'
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(iso2.toUpperCase()) ?? iso2
  } catch {
    return iso2
  }
}

/**
 * Minimal Lexical rich-text → plain paragraphs extractor.
 * Enough to render the `verdict` field without a client-side editor renderer.
 */
export function richTextToParagraphs(value: Firm['verdict']): string[] {
  if (!value?.root?.children) return []
  const paragraphs: string[] = []
  const textOf = (node: unknown): string => {
    if (node == null || typeof node !== 'object') return ''
    const n = node as { text?: unknown; children?: unknown[] }
    if (typeof n.text === 'string') return n.text
    if (Array.isArray(n.children)) return n.children.map(textOf).join('')
    return ''
  }
  for (const child of value.root.children) {
    const text = textOf(child).trim()
    if (text) paragraphs.push(text)
  }
  return paragraphs
}

/**
 * A challenge target or loss limit, as the firm publishes it.
 *
 * CFD firms quote a percentage of account size, futures firms quote a flat
 * dollar figure. Prefer whichever we actually hold, absolute first: a futures
 * trader looking for Topstep's "$2,000" will not recognise "4%", and printing
 * a converted number invites the reader to check it against the firm's site
 * and find a mismatch.
 */
export function limitLabel(
  pct: number | null | undefined,
  amount: number | null | undefined,
  currency = 'USD',
): string | null {
  if (amount != null) return money(amount, currency)
  if (pct != null) return `${pct}%`
  return null
}
