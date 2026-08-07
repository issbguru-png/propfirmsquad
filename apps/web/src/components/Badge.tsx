import type { ReactNode } from 'react'
import { cn } from './utils'

export type BadgeVariant = 'neutral' | 'positive' | 'negative' | 'accent'

export type BadgeProps = {
  children: ReactNode
  /**
   * neutral — labels/taxonomy (program types, platforms).
   * positive/negative — data semantics ONLY (pass/fail, payout up/down).
   * accent — promos and highlights; use sparingly.
   */
  variant?: BadgeVariant
  className?: string
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: 'border border-line bg-page text-ink-2',
  positive: 'bg-positive-pale text-positive',
  negative: 'bg-negative-pale text-negative',
  accent: 'bg-accent-pale text-accent-dark',
}

/** Small semantic label chip. */
export function Badge({ children, variant = 'neutral', className }: BadgeProps): ReactNode {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
