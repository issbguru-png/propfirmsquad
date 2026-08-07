import { describe, expect, it } from 'vitest'
import { getLearnArticle, listLearnArticles, listLearnSlugs } from './learn-content'

describe('learn content pipeline (real files in content/learn)', () => {
  it('finds the starter articles', () => {
    const slugs = listLearnSlugs()
    expect(slugs).toContain('what-is-a-prop-firm')
    expect(slugs).toContain('consistency-rule-explained')
    expect(slugs).toContain('trailing-drawdown-explained')
  })

  it('every article has complete frontmatter and parsed blocks', () => {
    const articles = listLearnArticles()
    expect(articles.length).toBeGreaterThanOrEqual(3)
    for (const { frontmatter, blocks } of articles) {
      expect(frontmatter.title.length).toBeGreaterThan(10)
      expect(frontmatter.description.length).toBeGreaterThan(20)
      expect(frontmatter.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(blocks.length).toBeGreaterThan(5)
      expect(blocks.some((b) => b.type === 'heading')).toBe(true)
    }
  })

  it('rejects traversal-shaped slugs', () => {
    expect(getLearnArticle('../secrets')).toBeNull()
    expect(getLearnArticle('a/b')).toBeNull()
  })

  it('returns null for unknown slugs', () => {
    expect(getLearnArticle('does-not-exist')).toBeNull()
  })
})
