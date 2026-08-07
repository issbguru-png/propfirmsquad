import type { ReactNode } from 'react'
import type { Challenge } from '@/payload-types'
import { Badge } from './Badge'
import { cn, DRAWDOWN_LABELS, formatMoney, STEPS_LABELS } from './utils'

/** The serializable slice of a Challenge this table needs. */
export type ChallengeRow = Pick<
  Challenge,
  | 'id'
  | 'name'
  | 'steps'
  | 'accountSize'
  | 'price'
  | 'currency'
  | 'profitTargets'
  | 'maxDailyLossPct'
  | 'maxTotalDrawdownPct'
  | 'drawdownType'
  | 'profitSplitPct'
  | 'refundableFee'
>

export type ChallengePriceTableProps = {
  challenges: ChallengeRow[]
  /** Accessible table caption, e.g. "FTMO challenge pricing". Visually hidden. */
  caption?: string
  className?: string
}

function pct(value: number | null | undefined): string {
  return value != null ? `${value}%` : '—'
}

function targets(row: ChallengeRow): string {
  if (!row.profitTargets || row.profitTargets.length === 0) return '—'
  return row.profitTargets.map((t) => `P${t.phase} ${t.targetPct}%`).join(' · ')
}

/**
 * Responsive pricing table for a firm's challenges
 * (size, steps, price, profit targets, drawdown, split).
 * Wrapped in an overflow-x container so it scrolls horizontally on mobile.
 */
export function ChallengePriceTable({
  challenges,
  caption,
  className,
}: ChallengePriceTableProps): ReactNode {
  return (
    <div
      className={cn('overflow-x-auto rounded-lg border border-line bg-card', className)}
      tabIndex={0}
      role="region"
      aria-label={caption ?? 'Challenge pricing'}
    >
      <table className="w-full min-w-[720px] border-collapse text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-line text-left">
            {['Program', 'Account size', 'Steps', 'Price', 'Profit targets', 'Drawdown', 'Split'].map(
              (h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-3 py-2.5 text-xs font-bold tracking-wide text-ink-3 uppercase"
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {challenges.map((row) => (
            <tr key={row.id} className="border-b border-line last:border-b-0">
              <th scope="row" className="px-3 py-2.5 text-left font-semibold text-ink">
                {row.name}
              </th>
              <td className="px-3 py-2.5 font-bold tabular-nums text-ink">
                {formatMoney(row.accountSize, row.currency)}
              </td>
              <td className="px-3 py-2.5 text-ink-2">{STEPS_LABELS[row.steps]}</td>
              <td className="px-3 py-2.5">
                <span className="font-bold tabular-nums text-ink">
                  {formatMoney(row.price, row.currency)}
                </span>
                {row.refundableFee && (
                  <Badge variant="positive" className="ml-1.5">
                    Refundable
                  </Badge>
                )}
              </td>
              <td className="px-3 py-2.5 tabular-nums text-ink-2">{targets(row)}</td>
              <td className="px-3 py-2.5 text-ink-2">
                <span className="tabular-nums">
                  {pct(row.maxDailyLossPct)} daily / {pct(row.maxTotalDrawdownPct)} max
                </span>
                {row.drawdownType && (
                  <span className="ml-1 text-ink-3">· {DRAWDOWN_LABELS[row.drawdownType]}</span>
                )}
              </td>
              <td className="px-3 py-2.5 font-bold tabular-nums text-ink">
                {pct(row.profitSplitPct)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
