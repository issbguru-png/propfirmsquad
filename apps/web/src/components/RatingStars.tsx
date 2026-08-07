import type { ReactNode } from 'react'
import { cn } from './utils'

export type RatingStarsProps = {
  /** 0–5; fractional values (e.g. 4.5) render partially filled stars. */
  rating: number
  /** Number of stars (default 5). */
  max?: number
  /** Star glyph size in px (default 16). */
  size?: number
  /** Render the numeric value next to the stars. */
  showValue?: boolean
  className?: string
}

const STAR_PATH =
  'M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z'

function StarRow({ max, size, filled }: { max: number; size: number; filled: boolean }): ReactNode {
  return (
    <span className="flex shrink-0">
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={filled ? 'fill-accent' : 'fill-line'}
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  )
}

/**
 * 0–5 star rating with half/fractional-star support.
 * Implemented as a clipped overlay (no gradients, no ids), so any fraction works.
 * Exposes an accessible label; the glyphs themselves are aria-hidden.
 */
export function RatingStars({
  rating,
  max = 5,
  size = 16,
  showValue = false,
  className,
}: RatingStarsProps): ReactNode {
  const clamped = Math.max(0, Math.min(rating, max))
  const pct = max > 0 ? (clamped / max) * 100 : 0
  const label = `Rated ${clamped.toFixed(1)} out of ${max}`

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span role="img" aria-label={label} className="relative inline-block leading-none">
        <StarRow max={max} size={size} filled={false} />
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${pct}%` }}
        >
          <StarRow max={max} size={size} filled />
        </span>
      </span>
      {showValue && (
        <span className="text-sm font-bold tabular-nums text-ink" aria-hidden="true">
          {clamped.toFixed(1)}
        </span>
      )}
    </span>
  )
}
