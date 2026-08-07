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

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function yearOf(iso: string | null | undefined): number | null {
  return iso ? new Date(iso).getUTCFullYear() : null
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
