import type { ReactNode } from 'react'
import { cn } from './utils'

export type SectionKickerProps = {
  children: ReactNode
  /** Optional section number for "§ 01 — LABEL" wayfinding. */
  number?: number | string
  className?: string
}

/**
 * Small orange uppercase letterspaced label above headings.
 * With `number` it renders the crttrading-style "§ 01 — FOUNDATION" marker.
 */
export function SectionKicker({ children, number, className }: SectionKickerProps): ReactNode {
  const nn = typeof number === 'number' ? String(number).padStart(2, '0') : number
  return (
    <p
      className={cn(
        'text-xs font-bold uppercase tracking-[0.14em] text-accent',
        className,
      )}
    >
      {nn != null && <span aria-hidden="true">{'§'} {nn} — </span>}
      {children}
    </p>
  )
}
