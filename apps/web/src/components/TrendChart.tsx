import type { ReactNode } from 'react'
import type { Firm } from '@/payload-types'
import { cn } from './utils'

/** One tracked score point; `Firm['trustpilotHistory']` items are assignable to this. */
export type TrendPoint = Pick<NonNullable<Firm['trustpilotHistory']>[number], 'date' | 'score'>

export type TrendChartProps = {
  /** Time series, e.g. a firm's `trustpilotHistory`. Sorted by date internally. */
  history: TrendPoint[] | null | undefined
  /** SVG viewBox width (default 280). Rendered element is responsive up to this width. */
  width?: number
  /** SVG viewBox height (default 64). */
  height?: number
  /** Accessible label prefix (default "Trustpilot score"). */
  label?: string
  className?: string
}

/**
 * Simple inline-SVG sparkline for weekly tracked scores (no chart library).
 * Line + soft area fill + end dot. Colored by direction — green when the score
 * improved over the window, red when it declined, orange when flat (data
 * semantics only, per the design system). Renders nothing without >= 2 points.
 */
export function TrendChart({
  history,
  width = 280,
  height = 64,
  label = 'Trustpilot score',
  className,
}: TrendChartProps): ReactNode {
  const points = (history ?? [])
    .filter((p) => Number.isFinite(p.score))
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))

  if (points.length < 2) return null

  const pad = 6
  const min = Math.min(...points.map((p) => p.score))
  const max = Math.max(...points.map((p) => p.score))
  const span = max - min || 1

  const x = (i: number) => pad + (i / (points.length - 1)) * (width - pad * 2)
  const y = (score: number) => pad + (1 - (score - min) / span) * (height - pad * 2)

  const coords = points.map((p, i) => [x(i), y(p.score)] as const)
  const linePath = coords
    .map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${px.toFixed(1)} ${py.toFixed(1)}`)
    .join(' ')
  const areaPath = `${linePath} L${coords[coords.length - 1]![0].toFixed(1)} ${height - pad} L${pad} ${height - pad} Z`

  const first = points[0]!
  const last = points[points.length - 1]!
  const color =
    last.score > first.score
      ? 'var(--color-positive)'
      : last.score < first.score
        ? 'var(--color-negative)'
        : 'var(--color-accent)'

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${label} trend: ${first.score.toFixed(1)} to ${last.score.toFixed(1)} over ${points.length} data points`}
      className={cn('block h-auto w-full', className)}
      style={{ maxWidth: width }}
    >
      <path d={areaPath} fill={color} opacity="0.08" />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={coords[coords.length - 1]![0]}
        cy={coords[coords.length - 1]![1]}
        r="3"
        fill={color}
      />
    </svg>
  )
}
