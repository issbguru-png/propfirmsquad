import type { ReactNode } from 'react'
import { cn, formatDate } from './utils'

export type VerdictBoxProps = {
  /** One-paragraph answer — the verdict copy itself. */
  children: ReactNode
  /** Overall score, e.g. 4.6. */
  score?: number | null
  /** Score denominator (default 5). */
  scoreOutOf?: number
  /** ISO date the verdict was last updated. */
  updatedAt?: string | null
  /** Heading text (default "Our verdict"). */
  title?: string
  /** Anchor id for in-page navigation / TOC links. */
  id?: string
  /** Slot rendered above the header (e.g. a SectionKicker). */
  kicker?: ReactNode
  /** Small badge rendered beside the title (e.g. draft status). */
  badge?: ReactNode
  className?: string
}

/**
 * Highlighted verdict card: orange top rule, big 900-weight score,
 * "Updated {date}" metadata, and a one-paragraph answer slot.
 * Designed to sit above the fold on firm profiles (answer-first SEO pattern).
 */
export function VerdictBox({
  children,
  score,
  scoreOutOf = 5,
  updatedAt,
  title = 'Our verdict',
  id,
  kicker,
  badge,
  className,
}: VerdictBoxProps): ReactNode {
  const updated = formatDate(updatedAt)

  return (
    <section
      id={id}
      aria-label={title}
      className={cn(
        'rounded-lg border border-line border-t-4 border-t-accent bg-card p-5',
        className,
      )}
    >
      {kicker}
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-lg font-extrabold text-ink">{title}</h2>
          {badge}
          {score != null && (
            <p className="text-ink" aria-label={`Score ${score} out of ${scoreOutOf}`}>
              <span className="text-2xl font-black tabular-nums text-accent-dark">
                {score.toFixed(1)}
              </span>
              <span className="text-sm font-semibold text-ink-3">/{scoreOutOf}</span>
            </p>
          )}
        </div>
        {updated && (
          <p className="text-xs text-ink-3">
            Updated <time dateTime={updatedAt ?? undefined}>{updated}</time>
          </p>
        )}
      </header>
      <div className="mt-3 text-base leading-[1.65] text-ink-2">{children}</div>
    </section>
  )
}
