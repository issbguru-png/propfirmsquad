import type { ReactNode } from 'react'
import { cn } from './utils'

export type SectionKickerProps = {
  children: ReactNode
  /** Optional section number, rendered as a small "01" chip before the label. */
  number?: number | string
  className?: string
}

/**
 * Small orange uppercase letterspaced label above headings. With `number` it
 * renders a zero-padded chip ("01 VERDICT"). No section sign: the § convention
 * reads as a stray "s" to most readers outside legal/academic writing.
 */
export function SectionKicker({ children, number, className }: SectionKickerProps): ReactNode {
  const nn = typeof number === 'number' ? String(number).padStart(2, '0') : number
  return (
    <p
      className={cn(
        'flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-accent uppercase',
        className,
      )}
    >
      {nn != null && (
        <span
          aria-hidden="true"
          className="rounded-sm bg-accent-pale px-1.5 py-0.5 tabular-nums text-accent-dark"
        >
          {nn}
        </span>
      )}
      <span>{children}</span>
    </p>
  )
}
