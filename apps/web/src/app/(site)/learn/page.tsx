import type { Metadata } from 'next'
import Link from 'next/link'
import { listLearnArticles } from '@/lib/seo/learn-content'
import { staticPageMeta } from '@/lib/seo/metadata'
import { JsonLd } from '@/lib/seo/json-ld'
import { breadcrumbLd } from '@/lib/seo/jsonld'

export const metadata: Metadata = staticPageMeta(
  'Learn Prop Trading — Rules, Drawdown & Payouts Explained',
  '/learn',
  'Plain-English guides to how prop firms actually work: evaluation rules, consistency rules, trailing drawdown, and payouts — written from verified firm data.',
)

export default function LearnIndexPage() {
  const articles = listLearnArticles()

  return (
    <div>
      <JsonLd data={breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Learn', path: '/learn' }])} />
      <p className="mb-2 text-xs font-bold tracking-widest text-accent uppercase">— Learn —</p>
      <h1 className="mb-6 text-4xl font-black tracking-tight">Prop trading, explained properly</h1>
      <ul className="grid gap-3 sm:grid-cols-2">
        {articles.map((article) => (
          <li key={article.frontmatter.slug}>
            <Link
              href={`/learn/${article.frontmatter.slug}`}
              className="block h-full rounded-sm border border-line bg-card p-5 hover:border-accent"
            >
              <div className="mb-1 font-bold">{article.frontmatter.title}</div>
              <div className="text-sm text-ink-2">{article.frontmatter.description}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
