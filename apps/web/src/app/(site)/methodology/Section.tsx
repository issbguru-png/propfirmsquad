import type { ReactNode } from 'react'
import { SectionKicker } from '@/components'

export type MethodologySectionProps = {
  /** Anchor id, used by the on-page contents list. */
  id: string
  /** Section number rendered as the kicker chip ("01"). */
  number: number
  /** Kicker label beside the number chip. */
  kicker: string
  /** The visible <h2>. */
  title: string
  children: ReactNode
}

/**
 * One numbered section of /methodology.
 *
 * Deliberately plain: a numbered kicker chip, an h2, then prose. The page
 * carries a lot of small print, so the only job of the chrome is to make the
 * eleven sections countable and linkable from the contents list at the top.
 */
export function MethodologySection({
  id,
  number,
  kicker,
  title,
  children,
}: MethodologySectionProps): ReactNode {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24">
      <SectionKicker number={number} className="mb-2">
        {kicker}
      </SectionKicker>
      <h2 id={`${id}-h`} className="mb-3 text-2xl font-extrabold tracking-tight">
        {title}
      </h2>
      <div className="space-y-4 text-ink-2">{children}</div>
    </section>
  )
}

/** A bordered aside for a rule that readers should be able to quote back at us. */
export function Commitment({ children }: { children: ReactNode }): ReactNode {
  return (
    <p className="rounded-sm border-l-2 border-accent bg-accent-pale/50 py-3 pr-4 pl-4 text-ink">
      {children}
    </p>
  )
}
