import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getFirms } from '../../_lib/data'
import { CURRENT_YEAR, FIRM_TYPE_LABELS, PROGRAM_LABELS, compactMoney } from '../../_lib/format'
import { EmptyNote, FirmMark, Score, td, th } from '../../_lib/ui'
import { JsonLd } from '@/lib/seo/json-ld'
import { breadcrumbLd, faqLd, itemListLd } from '@/lib/seo/jsonld'
import { bestListMeta } from '@/lib/seo/metadata'
import { BEST_LISTS, getList } from '../_lib/lists'

export const dynamic = 'force-dynamic'

type Params = Promise<{ list: string }>

export function generateStaticParams() {
  return BEST_LISTS.map((l) => ({ list: l.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { list } = await params
  const cfg = getList(list)
  if (!cfg) return {}
  return bestListMeta(cfg.slug, cfg.title, cfg.description)
}

export default async function BestListPage({ params }: { params: Params }) {
  const { list } = await params
  const cfg = getList(list)
  if (!cfg) notFound()

  const firms = await getFirms({ firmType: cfg.filter })
  const topThree = firms.slice(0, 3)
  const otherLists = BEST_LISTS.filter((l) => l.slug !== cfg.slug)
  const totalReviews = firms.reduce((n, f) => n + (f.reviewsCount ?? 0), 0)

  return (
    <div className="space-y-12">
      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Best Prop Firms', path: '/best' },
          { name: cfg.h1, path: `/best/${cfg.slug}` },
        ])}
      />
      <JsonLd data={faqLd(cfg.faq)} />
      <JsonLd
        data={itemListLd(firms.map((f) => ({ name: f.name, path: `/prop-firms/${f.slug}` })))}
      />

      {/* Hero: direct answer for "best {market} prop firms" */}
      <section>
        <p className="mb-2 text-xs font-bold tracking-widest text-accent uppercase">
          Updated{' '}
          {new Date().toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
          })}
        </p>
        <h1 className="mb-4 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">{cfg.h1}</h1>
        {topThree.length > 0 ? (
          <p className="max-w-(--container-prose) text-lg text-ink-2">
            {cfg.intro} Based on {totalReviews.toLocaleString('en-US')} verified trader reviews and
            tracked payout data, the best right now are{' '}
            {topThree.map((f, i) => (
              <span key={f.id}>
                {i > 0 ? (i === topThree.length - 1 ? ' and ' : ', ') : ''}
                <Link href={`/prop-firms/${f.slug}`} className="font-semibold text-accent-dark underline">
                  {f.name}
                </Link>
                {f.reviewScore != null ? ` (${f.reviewScore}★)` : ''}
              </span>
            ))}
            . We rank on verified reviews, rule fairness, and real payout speed, never on
            commission size.
          </p>
        ) : (
          <p className="max-w-(--container-prose) text-lg text-ink-2">
            {cfg.intro} We rank on verified reviews, rule fairness, and real payout speed, never on
            commission size.
          </p>
        )}
      </section>

      {/* Ranked comparison table of every firm in this market */}
      <section aria-labelledby="ranking-h">
        <h2 id="ranking-h" className="mb-4 text-2xl font-extrabold tracking-tight">
          {firms.length > 0 ? `All ${firms.length} ` : ''}
          {FIRM_TYPE_LABELS[cfg.filter]} prop firms compared
        </h2>
        {firms.length === 0 ? (
          <EmptyNote>No firms in this category yet. Check back soon.</EmptyNote>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line bg-card">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <caption className="sr-only">
                {cfg.h1} ranked by review score
              </caption>
              <thead className="border-b border-line bg-page">
                <tr>
                  <th scope="col" className={th}>#</th>
                  <th scope="col" className={th}>Firm</th>
                  <th scope="col" className={th}>Score</th>
                  <th scope="col" className={th}>Reviews</th>
                  <th scope="col" className={th}>Trustpilot</th>
                  <th scope="col" className={th}>Max funding</th>
                  <th scope="col" className={th}>Programs</th>
                </tr>
              </thead>
              <tbody>
                {firms.map((firm, i) => (
                  <tr key={firm.id} className="border-b border-line last:border-0">
                    <td className={`${td} font-bold text-ink-3`}>{i + 1}</td>
                    <th scope="row" className={`${td} text-left`}>
                      <Link
                        href={`/prop-firms/${firm.slug}`}
                        className="flex items-center gap-2.5 font-bold text-accent-dark hover:underline"
                      >
                        <FirmMark firm={firm} size="sm" />
                        {firm.name}
                      </Link>
                    </th>
                    <td className={td}>
                      <Score value={firm.reviewScore} />
                    </td>
                    <td className={td}>{firm.reviewsCount?.toLocaleString('en-US') ?? '—'}</td>
                    <td className={td}>{firm.trustPilotScore ?? '—'}</td>
                    <td className={td}>{compactMoney(firm.maxAllocation)}</td>
                    <td className={`${td} text-ink-2`}>
                      {(firm.programTypes ?? []).map((p) => PROGRAM_LABELS[p]).join(', ') || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-sm text-ink-2">
          Scores combine verified trader reviews, Trustpilot trend tracking, rule fairness, and
          payout evidence; commissions never influence position. Read the full{' '}
          <Link href="/methodology" className="font-semibold text-accent-dark underline">
            methodology
          </Link>
          .
        </p>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-h" className="max-w-(--container-prose)">
        <h2 id="faq-h" className="mb-4 text-2xl font-extrabold tracking-tight">
          Frequently asked questions
        </h2>
        <div className="space-y-6">
          {cfg.faq.map((item) => (
            <div key={item.question}>
              <h3 className="mb-1 text-lg font-bold">{item.question}</h3>
              <p className="text-ink-2">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cross-links to the other market hubs */}
      <section aria-labelledby="more-h">
        <h2 id="more-h" className="mb-4 text-2xl font-extrabold tracking-tight">
          More {CURRENT_YEAR} rankings
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {otherLists.map((l) => (
            <li key={l.slug}>
              <Link
                href={`/best/${l.slug}`}
                className="block rounded-sm border border-line bg-card p-4 font-semibold transition-colors hover:border-accent"
              >
                {l.title} <span aria-hidden className="text-accent">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
