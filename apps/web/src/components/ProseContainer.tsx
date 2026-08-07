import type { ElementType, ReactNode } from 'react'
import { cn } from './utils'

export type ProseContainerProps = {
  children: ReactNode
  /** Wrapper element (default "div"; use "article" for editorial bodies). */
  as?: ElementType
  className?: string
}

/**
 * 820px article-measure container for editorial prose
 * (verdicts, guides, review bodies). Nest inside PageShell.
 */
export function ProseContainer({
  children,
  as: Tag = 'div',
  className,
}: ProseContainerProps): ReactNode {
  return <Tag className={cn('mx-auto w-full max-w-prose', className)}>{children}</Tag>
}
