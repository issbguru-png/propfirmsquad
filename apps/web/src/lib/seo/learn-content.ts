/**
 * Filesystem loader for /learn articles.
 *
 * Articles live in apps/web/content/learn/*.md with frontmatter
 * (title, description, updated). Slug = filename without extension.
 * Server-only (uses node:fs) — import from server components exclusively.
 */

import fs from 'node:fs'
import path from 'node:path'
import type { LearnFrontmatter } from './metadata'
import { parseDocument, type Block } from './mdlite'

const CONTENT_DIR = path.join(process.cwd(), 'content', 'learn')

export type LearnArticle = {
  frontmatter: LearnFrontmatter
  blocks: Block[]
}

export function listLearnSlugs(): string[] {
  let files: string[]
  try {
    files = fs.readdirSync(CONTENT_DIR)
  } catch {
    return []
  }
  return files
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''))
    .sort()
}

export function getLearnArticle(slug: string): LearnArticle | null {
  // Slugs come from URLs — never let them traverse out of the content dir.
  if (!/^[a-z0-9-]+$/.test(slug)) return null
  let raw: string
  try {
    raw = fs.readFileSync(path.join(CONTENT_DIR, `${slug}.md`), 'utf8')
  } catch {
    return null
  }
  const { data, blocks } = parseDocument(raw)
  return {
    frontmatter: {
      slug,
      title: data.title || slug,
      description: data.description || '',
      updated: data.updated || undefined,
    },
    blocks,
  }
}

export function listLearnArticles(): LearnArticle[] {
  return listLearnSlugs()
    .map(getLearnArticle)
    .filter((a): a is LearnArticle => a !== null)
}
