import type { ReactNode } from 'react'
import { cn } from './utils'

export type NumberChipProps = {
  /** Rank / index. Numbers are zero-padded to two digits ("01", "02", …). */
  value: number | string
  className?: string
}

/**
 * Orange-pale chip for rankings and numbered wayfinding (01, 02, …).
 * Pure presentational span — pairs with headings on /best pages.
 */
export function NumberChip({ value, className }: NumberChipProps): ReactNode {
  const label = typeof value === 'number' ? String(value).padStart(2, '0') : value
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-sm bg-accent-pale px-2 py-0.5',
        'text-sm font-extrabold tabular-nums text-accent-dark',
        className,
      )}
    >
      {label}
    </span>
  )
}
