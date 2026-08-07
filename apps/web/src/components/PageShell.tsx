import type { ElementType, ReactNode } from 'react'
import { cn } from './utils'

export type PageShellProps = {
  children: ReactNode
  /** Wrapper element (default "div"; use "main" for the page root). */
  as?: ElementType
  className?: string
}

/**
 * 1160px max-width page container with horizontal padding.
 * The outer layout wrapper for listing and profile pages.
 */
export function PageShell({ children, as: Tag = 'div', className }: PageShellProps): ReactNode {
  return <Tag className={cn('mx-auto w-full max-w-page px-4 sm:px-6', className)}>{children}</Tag>
}
