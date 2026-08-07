import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getLearnArticle, listLearnSlugs } from '@/lib/seo/learn-content'
import { learnMeta } from '@/lib/seo/metadata'
import { JsonLd } from '@/lib/seo/json-ld'
import { breadcrumbLd } from '@/lib/seo/jsonld'
import { Markdown } from '../markdown'

type Params = { slug: string }

export function generateStaticParams(): Params[] {
  return listLearnSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const article = getLearnArticle(slug)
  if (!article) return {}
  return learnMeta(article.frontmatter)
}

export default async function LearnArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const article = getLearnArticle(slug)
  if (!article) notFound()

  const { frontmatter, blocks } = article

  return (
    <article className="mx-auto max-w-3xl">
      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Learn', path: '/learn' },
          { name: frontmatter.title, path: `/learn/${slug}` },
        ])}
      />
      <nav className="mb-4 text-sm text-ink-2">
        <Link href="/learn" className="text-accent underline">
          ← All guides
        </Link>
      </nav>
      <h1 className="mb-2 text-4xl font-black tracking-tight">{frontmatter.title}</h1>
      {frontmatter.updated ? (
        <p className="mb-8 text-sm text-ink-2">
          Last updated{' '}
          <time dateTime={frontmatter.updated}>
            {new Date(frontmatter.updated).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        </p>
      ) : null}
      <Markdown blocks={blocks} />
    </article>
  )
}
