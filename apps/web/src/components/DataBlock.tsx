import type { ReactNode } from 'react'
import { SectionKicker } from './SectionKicker'
import { cn, formatDate } from './utils'

export type DataBlockProps = {
  /** Section heading, e.g. "Payout rules". */
  title: string
  children: ReactNode
  /** Optional section number for numbered wayfinding ("§ 03 — PAYOUT RULES"). */
  number?: number | string
  /** ISO date for the "Last verified {date}" footer. */
  lastVerifiedAt?: string | null
  /** Anchor id for in-page navigation / TOC links. */
  id?: string
  className?: string
}

/**
 * Labeled data section wrapper: kicker + heading, content slot, and a
 * "Last verified {date}" trust-metadata footer (CRT "Last updated" pattern).
 */
export function DataBlock({
  title,
  children,
  number,
  lastVerifiedAt,
  id,
  className,
}: DataBlockProps): ReactNode {
  const verified = formatDate(lastVerifiedAt)

  return (
    <section
      id={id}
      className={cn('scroll-mt-24 rounded-lg border border-line bg-card p-5', className)}
    >
      <header className="mb-3">
        {number != null && (
          <div aria-hidden="true">
            <SectionKicker number={number}>{title}</SectionKicker>
          </div>
        )}
        <h2 className="mt-1 text-xl font-extrabold text-ink">{title}</h2>
      </header>

      <div className="text-base leading-[1.65] text-ink-2">{children}</div>

      {verified && (
        <footer className="mt-4 flex items-center gap-1.5 border-t border-line pt-3 text-xs text-ink-3">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="shrink-0 fill-none stroke-positive"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <span>
            Last verified <time dateTime={lastVerifiedAt ?? undefined}>{verified}</time>
          </span>
        </footer>
      )}
    </section>
  )
}
