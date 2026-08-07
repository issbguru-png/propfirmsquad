import { describe, expect, it } from 'vitest'
import {
  inlineToText,
  parseDocument,
  parseFrontmatter,
  parseInline,
  parseMarkdown,
  type Block,
} from './mdlite'

type Paragraph = Extract<Block, { type: 'paragraph' }>
type List = Extract<Block, { type: 'list' }>

describe('parseFrontmatter', () => {
  it('parses key: value pairs and returns the body', () => {
    const src = '---\ntitle: Hello World\ndescription: "A quoted value: with colon"\nupdated: 2026-08-08\n---\n\n# Body\n'
    const { data, content } = parseFrontmatter(src)
    expect(data).toEqual({
      title: 'Hello World',
      description: 'A quoted value: with colon',
      updated: '2026-08-08',
    })
    expect(content.trim()).toBe('# Body')
  })

  it('returns empty data when there is no frontmatter', () => {
    const { data, content } = parseFrontmatter('# Just markdown\n')
    expect(data).toEqual({})
    expect(content).toBe('# Just markdown\n')
  })

  it('ignores malformed lines', () => {
    const { data } = parseFrontmatter('---\ntitle: ok\nnot-a-pair\n---\nbody')
    expect(data).toEqual({ title: 'ok' })
  })
})

describe('parseMarkdown blocks', () => {
  it('parses headings with levels', () => {
    const blocks = parseMarkdown('## Section\n\n### Sub')
    expect(blocks).toMatchObject([
      { type: 'heading', level: 2 },
      { type: 'heading', level: 3 },
    ])
  })

  it('parses paragraphs, joining wrapped lines', () => {
    const blocks = parseMarkdown('line one\nline two\n\nsecond para')
    expect(blocks).toHaveLength(2)
    expect(blocks[0]).toMatchObject({ type: 'paragraph' })
    expect(inlineToText((blocks[0] as Paragraph).children)).toBe('line one line two')
  })

  it('parses unordered and ordered lists', () => {
    const blocks = parseMarkdown('- a\n- b\n\n1. one\n2. two')
    expect(blocks[0]).toMatchObject({ type: 'list', ordered: false })
    expect(blocks[1]).toMatchObject({ type: 'list', ordered: true })
    expect((blocks[0] as List).items).toHaveLength(2)
  })

  it('a heading directly after a paragraph line starts a new block', () => {
    const blocks = parseMarkdown('para text\n## Heading')
    expect(blocks.map((b) => b.type)).toEqual(['paragraph', 'heading'])
  })
})

describe('parseInline', () => {
  it('parses bold, italic, code and links', () => {
    const nodes = parseInline('a **bold** and *em* and `code` and [link](/learn)')
    expect(nodes).toMatchObject([
      { type: 'text', value: 'a ' },
      { type: 'strong' },
      { type: 'text', value: ' and ' },
      { type: 'em' },
      { type: 'text', value: ' and ' },
      { type: 'code', value: 'code' },
      { type: 'text', value: ' and ' },
      { type: 'link', href: '/learn' },
    ])
  })

  it('allows http(s), relative and anchor hrefs', () => {
    expect(parseInline('[x](https://example.com)')[0]).toMatchObject({ type: 'link' })
    expect(parseInline('[x](/tools)')[0]).toMatchObject({ type: 'link' })
    expect(parseInline('[x](#faq)')[0]).toMatchObject({ type: 'link' })
  })

  it('downgrades unsafe hrefs (javascript:) to literal text', () => {
    const nodes = parseInline('[x](javascript:alert(1))')
    expect(nodes.every((n) => n.type !== 'link')).toBe(true)
  })

  it('keeps raw HTML as literal text (no injection surface)', () => {
    const nodes = parseInline('<script>alert(1)</script> hi')
    expect(nodes).toEqual([{ type: 'text', value: '<script>alert(1)</script> hi' }])
  })
})

describe('parseDocument', () => {
  it('combines frontmatter and blocks', () => {
    const { data, blocks } = parseDocument('---\ntitle: T\n---\n## H\n\np')
    expect(data.title).toBe('T')
    expect(blocks.map((b) => b.type)).toEqual(['heading', 'paragraph'])
  })
})
