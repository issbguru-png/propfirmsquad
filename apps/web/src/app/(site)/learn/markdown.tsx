import React from 'react'
import Link from 'next/link'
import type { Block, Inline } from '@/lib/seo/mdlite'

/**
 * Renders the mdlite AST as JSX. Everything textual passes through React's
 * escaping (no dangerouslySetInnerHTML anywhere in the /learn pipeline).
 */

function renderInline(nodes: Inline[]): React.ReactNode {
  return nodes.map((node, i) => {
    switch (node.type) {
      case 'text':
        return <React.Fragment key={i}>{node.value}</React.Fragment>
      case 'code':
        return (
          <code key={i} className="rounded bg-accent-pale px-1 text-accent-dark">
            {node.value}
          </code>
        )
      case 'strong':
        return <strong key={i}>{renderInline(node.children)}</strong>
      case 'em':
        return <em key={i}>{renderInline(node.children)}</em>
      case 'link': {
        const external = node.href.startsWith('http')
        return external ? (
          <a
            key={i}
            href={node.href}
            className="text-accent underline"
            rel="noopener noreferrer"
            target="_blank"
          >
            {renderInline(node.children)}
          </a>
        ) : (
          <Link key={i} href={node.href} className="text-accent underline">
            {renderInline(node.children)}
          </Link>
        )
      }
    }
  })
}

const HEADING_CLASSES: Record<number, string> = {
  1: 'mt-8 mb-4 text-3xl font-black tracking-tight',
  2: 'mt-8 mb-3 text-2xl font-bold tracking-tight',
  3: 'mt-6 mb-2 text-xl font-bold',
  4: 'mt-4 mb-2 text-lg font-semibold',
  5: 'mt-4 mb-2 font-semibold',
  6: 'mt-4 mb-2 text-sm font-semibold',
}

export function Markdown({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'heading': {
            const Tag = `h${block.level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
            return (
              <Tag key={i} className={HEADING_CLASSES[block.level]}>
                {renderInline(block.children)}
              </Tag>
            )
          }
          case 'paragraph':
            return (
              <p key={i} className="mb-4 leading-relaxed text-ink-2">
                {renderInline(block.children)}
              </p>
            )
          case 'list': {
            const items = block.items.map((item, j) => <li key={j}>{renderInline(item)}</li>)
            return block.ordered ? (
              <ol key={i} className="mb-4 list-decimal space-y-1 pl-6 text-ink-2">
                {items}
              </ol>
            ) : (
              <ul key={i} className="mb-4 list-disc space-y-1 pl-6 text-ink-2">
                {items}
              </ul>
            )
          }
        }
      })}
    </>
  )
}
