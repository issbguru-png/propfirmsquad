/**
 * Shared helpers for the component library.
 * Server-safe, dependency-free.
 */

/** Join conditional class names. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

/** "2026-08-07" | ISO datetime -> "Aug 7, 2026". Returns null for missing/invalid input. */
export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d)
}

/** 100000 -> "$100,000" (whole dollars), 87.99 -> "$87.99". */
export function formatMoney(amount: number, currency: string | null | undefined = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/** 1234 -> "1,234". */
export function formatCount(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}

/** Labels for challenge / program step counts. */
export const STEPS_LABELS: Record<'instant' | '1-step' | '2-step' | '3-step', string> = {
  instant: 'Instant',
  '1-step': '1-Step',
  '2-step': '2-Step',
  '3-step': '3-Step',
}

/** Labels for drawdown calculation types. */
export const DRAWDOWN_LABELS: Record<
  'static' | 'trailing-eod' | 'trailing-intraday' | 'hybrid',
  string
> = {
  static: 'Static',
  'trailing-eod': 'Trailing (EOD)',
  'trailing-intraday': 'Trailing (intraday)',
  hybrid: 'Hybrid',
}
