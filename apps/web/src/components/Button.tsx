import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from './utils'

export type ButtonProps = {
  children: ReactNode
  /** primary = solid orange CTA; secondary = outline on card/page. */
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md'
  /** Renders an anchor when set (internal paths use next/link; http(s) URLs get rel="noopener"). */
  href?: string
  /** Button type when rendered as a <button> (default "button"). */
  type?: 'button' | 'submit' | 'reset'
  /** rel override for external anchors (default "noopener"). */
  rel?: string
  /** Open external anchors in a new tab. */
  newTab?: boolean
  disabled?: boolean
  className?: string
}

// No `whitespace-nowrap`: a long CTA label ("Use code FUNDEDNEXT10 at
// FundedNext ↗") is wider than a 320px Android screen, and a button that
// cannot fit must wrap rather than pan the whole page sideways. Labels that
// do fit are unaffected, so desktop is unchanged.
const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50'

const VARIANTS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-accent text-white hover:bg-accent-dark',
  secondary: 'border border-line bg-card text-ink hover:border-accent hover:text-accent-dark',
}

// Taller on phones so every CTA clears the ~44px touch-target floor; the
// `sm:` half restores the original desktop padding exactly.
const SIZES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-2.5 text-sm sm:py-1.5',
  md: 'px-4 py-3 text-base sm:py-2',
}

/**
 * CTA button. Orange is the single accent — reserve `primary` for the one
 * action that matters per view; use `secondary` everywhere else.
 * Server component: renders a link when `href` is provided, else a <button>.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  type = 'button',
  rel,
  newTab,
  disabled,
  className,
}: ButtonProps): ReactNode {
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], className)

  if (href && !disabled) {
    const external = /^https?:\/\//.test(href)
    if (external) {
      return (
        <a
          href={href}
          rel={rel ?? 'noopener'}
          target={newTab ? '_blank' : undefined}
          className={classes}
        >
          {children}
        </a>
      )
    }
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} disabled={disabled} className={classes}>
      {children}
    </button>
  )
}
