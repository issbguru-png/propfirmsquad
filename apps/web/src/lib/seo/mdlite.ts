/**
 * mdlite — deliberately tiny markdown subset for /learn, zero dependencies.
 *
 * Supported: frontmatter (--- key: value ---), # headings, paragraphs,
 * -/1. lists, **bold**, *italic*, `code`, [links](href).
 *
 * Safety model: the parser only ever produces text nodes — raw HTML in the
 * source stays literal text, and React escapes it at render time. Link hrefs
 * are whitelisted to http(s)/relative/anchor; anything else (javascript: etc.)
 * is downgraded to plain text.
 */

export type Inline =
  | { type: 'text'; value: string }
  | { type: 'code'; value: string }
  | { type: 'strong'; children: Inline[] }
  | { type: 'em'; children: Inline[] }
  | { type: 'link'; href: string; children: Inline[] }

export type Block =
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; children: Inline[] }
  | { type: 'paragraph'; children: Inline[] }
  | { type: 'list'; ordered: boolean; items: Inline[][] }

// ---------------------------------------------------------------- frontmatter

export type Frontmatter = Record<string, string>

/**
 * Parses a leading `---` block of `key: value` lines. Quotes around values are
 * stripped. Returns the remaining markdown body untouched.
 */
export function parseFrontmatter(src: string): { data: Frontmatter; content: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(src)
  if (!match) return { data: {}, content: src }

  const data: Frontmatter = {}
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (key) data[key] = value
  }
  return { data, content: src.slice(match[0].length) }
}

// -------------------------------------------------------------------- inline

function safeHref(href: string): string | null {
  if (/^https?:\/\//i.test(href)) return href
  if (href.startsWith('/') || href.startsWith('#')) return href
  return null
}

/** Earliest-match tokenizer for `code`, **strong**, *em*, [text](href). */
export function parseInline(text: string): Inline[] {
  const out: Inline[] = []
  let rest = text

  const patterns: { re: RegExp; make: (m: RegExpExecArray) => Inline | null }[] = [
    { re: /`([^`]+)`/, make: (m) => ({ type: 'code', value: m[1] }) },
    { re: /\*\*([^*]+(?:\*(?!\*)[^*]*)*)\*\*/, make: (m) => ({ type: 'strong', children: parseInline(m[1]) }) },
    { re: /\*([^*]+)\*/, make: (m) => ({ type: 'em', children: parseInline(m[1]) }) },
    {
      re: /\[([^\]]+)\]\(([^)\s]+)\)/,
      make: (m) => {
        const href = safeHref(m[2])
        return href ? { type: 'link', href, children: parseInline(m[1]) } : null
      },
    },
  ]

  while (rest.length > 0) {
    let best: { index: number; length: number; node: Inline | null } | null = null
    for (const { re, make } of patterns) {
      const m = re.exec(rest)
      if (m && (best === null || m.index < best.index)) {
        best = { index: m.index, length: m[0].length, node: make(m) }
      }
    }
    if (!best) {
      out.push({ type: 'text', value: rest })
      break
    }
    if (best.index > 0) out.push({ type: 'text', value: rest.slice(0, best.index) })
    // Unsafe link → keep the raw source as literal text.
    out.push(best.node ?? { type: 'text', value: rest.slice(best.index, best.index + best.length) })
    rest = rest.slice(best.index + best.length)
  }
  return out
}

// -------------------------------------------------------------------- blocks

const HEADING = /^(#{1,6})\s+(.*)$/
const UL_ITEM = /^[-*]\s+(.*)$/
const OL_ITEM = /^\d+[.)]\s+(.*)$/

/** Parses a markdown body (without frontmatter) into blocks. */
export function parseMarkdown(content: string): Block[] {
  const blocks: Block[] = []
  const lines = content.split(/\r?\n/)
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (line.trim() === '') {
      i++
      continue
    }

    const heading = HEADING.exec(line)
    if (heading) {
      blocks.push({
        type: 'heading',
        level: heading[1].length as 1 | 2 | 3 | 4 | 5 | 6,
        children: parseInline(heading[2].trim()),
      })
      i++
      continue
    }

    if (UL_ITEM.test(line) || OL_ITEM.test(line)) {
      const ordered = OL_ITEM.test(line)
      const re = ordered ? OL_ITEM : UL_ITEM
      const items: Inline[][] = []
      while (i < lines.length) {
        const m = re.exec(lines[i])
        if (!m) break
        items.push(parseInline(m[1].trim()))
        i++
      }
      blocks.push({ type: 'list', ordered, items })
      continue
    }

    // Paragraph: consume until blank line or a line that starts another block.
    const para: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !HEADING.test(lines[i]) &&
      !UL_ITEM.test(lines[i]) &&
      !OL_ITEM.test(lines[i])
    ) {
      para.push(lines[i].trim())
      i++
    }
    blocks.push({ type: 'paragraph', children: parseInline(para.join(' ')) })
  }

  return blocks
}

/** Convenience: full document → frontmatter + blocks. */
export function parseDocument(src: string): { data: Frontmatter; blocks: Block[] } {
  const { data, content } = parseFrontmatter(src)
  return { data, blocks: parseMarkdown(content) }
}

/** Plain-text projection of inline nodes (for FAQ JSON-LD, excerpts, tests). */
export function inlineToText(nodes: Inline[]): string {
  return nodes
    .map((n) => (n.type === 'text' || n.type === 'code' ? n.value : inlineToText(n.children)))
    .join('')
}
