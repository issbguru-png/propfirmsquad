import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllActivePromos, getFirms } from './_lib/data'
import { CURRENT_YEAR, FIRM_TYPE_LABELS, PROGRAM_LABELS, compactMoney } from './_lib/format'
import { EmptyNote, FirmCard, Score, td, th } from './_lib/ui'

export const dynamic = 'force-dynamic'

export function generateMetadata(): Metadata {
  return {
    // Root segment doesn't inherit the layout title template — brand manually.
    title: `Best Prop Trading Firms ${CURRENT_YEAR}: Ranked by Real Trader Data | PropFirmSquad`,
    description: `The best prop firms of ${CURRENT_YEAR}, ranked by verified trader reviews, Trustpilot trend, rules, and payout data — not by who pays the biggest affiliate commission.`,
    alternates: { canonical: '/' },
  }
}

/* /best/{list} hubs shipped — link them directly (config: best/_lib/lists.ts). */
const CATEGORY_LINKS = [
  { href: '/best/cfd-prop-firms', label: 'CFD / Forex prop firms' },
  { href: '/best/futures-prop-firms', label: 'Futures prop firms' },
  { href: '/best/crypto-prop-firms', label: 'Crypto prop firms' },
  { href: '/deals', label: 'Active promo codes' },
] as const

export default async function HomePage() {
  const [firms, promos] = await Promise.all([getFirms(), getAllActivePromos()])
  const top = firms.slice(0, 10)
  const topThree = firms.slice(0, 3)

  return (
    <div className="space-y-12">
      {/* Hero: direct answer for "best prop firms" */}
      <section>
        <p className="mb-2 text-xs font-bold tracking-widest text-accent uppercase">
          Updated{' '}
          {new Date().toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
          })}
        </p>
        <h1 className="mb-4 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
          The Best Prop Trading Firms of {CURRENT_YEAR}, Ranked by Real Data
        </h1>
        {topThree.length > 0 ? (
          <p className="max-w-(--container-prose) text-lg text-ink-2">
            Based on {firms.reduce((n, f) => n + (f.reviewsCount ?? 0), 0).toLocaleString('en-US')}{' '}
            verified trader reviews and tracked payout data, the best prop firms right now are{' '}
            {topThree.map((f, i) => (
              <span key={f.id}>
                {i > 0 ? (i === topThree.length - 1 ? ' and ' : ', ') : ''}
                <Link href={`/prop-firms/${f.slug}`} className="font-semibold text-accent-dark underline">
                  {f.name}
                </Link>
                {f.reviewScore != null ? ` (${f.reviewScore}★)` : ''}
              </span>
            ))}
            . We rank on verified reviews, rule fairness, and real payout speed — never on
            commission size.
          </p>
        ) : (
          <p className="max-w-(--container-prose) text-lg text-ink-2">
            We rank prop firms on verified reviews, rule fairness, and real payout speed — never on
            commission size.
          </p>
        )}
      </section>

      {/* Ranked data table near the top — AI-Overview / featured-snippet target */}
      <section aria-labelledby="ranking-h">
        <h2 id="ranking-h" className="mb-4 text-2xl font-extrabold tracking-tight">
          Top {top.length || 10} prop firms compared
        </h2>
        {top.length === 0 ? (
          <EmptyNote>
            No firms in the database yet — run <code className="rounded bg-accent-pale px-1 text-accent-dark">pnpm seed</code>.
          </EmptyNote>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line bg-card">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <caption className="sr-only">
                Top prop trading firms of {CURRENT_YEAR} ranked by review score
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
                  <th scope="col" className={th}>Market</th>
                </tr>
              </thead>
              <tbody>
                {top.map((firm, i) => (
                  <tr key={firm.id} className="border-b border-line last:border-0">
                    <td className={`${td} font-bold text-ink-3`}>{i + 1}</td>
                    <th scope="row" className={`${td} text-left`}>
                      <Link
                        href={`/prop-firms/${firm.slug}`}
                        className="font-bold text-accent-dark hover:underline"
                      >
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
                    <td className={`${td} text-ink-2`}>
                      {(firm.firmTypes ?? []).map((t) => FIRM_TYPE_LABELS[t]).join(', ') || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-sm text-ink-2">
          <Link href="/prop-firms" className="font-semibold text-accent-dark hover:underline">
            See all {firms.length} firms in the directory →
          </Link>
        </p>
      </section>

      {/* Category hubs */}
      <section aria-labelledby="browse-h">
        <h2 id="browse-h" className="mb-4 text-2xl font-extrabold tracking-tight">
          Browse by what matters to you
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORY_LINKS.map((c) => (
            <li key={c.href}>
              <Link
                href={c.href}
                className="block rounded-sm border border-line bg-card p-4 font-semibold transition-colors hover:border-accent"
              >
                {c.label} <span aria-hidden className="text-accent">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Deals teaser */}
      {promos.length > 0 ? (
        <section aria-labelledby="deals-h" className="rounded-lg bg-dark-section p-6 text-on-dark sm:p-8">
          <h2 id="deals-h" className="mb-2 text-2xl font-extrabold tracking-tight">
            {promos.length} verified promo codes live right now
          </h2>
          <p className="mb-4 max-w-(--container-prose) text-on-dark-2">
            Up to {Math.max(...promos.map((p) => p.discountPct ?? 0))}% off challenges — every code
            checked before listing.
          </p>
          <Link
            href="/deals"
            className="inline-block rounded-sm bg-accent px-5 py-2.5 font-bold text-nav transition-colors hover:bg-accent-light"
          >
            See all deals
          </Link>
        </section>
      ) : null}

      {/* All firms grid */}
      {firms.length > 0 ? (
        <section aria-labelledby="all-firms-h">
          <h2 id="all-firms-h" className="mb-4 text-2xl font-extrabold tracking-tight">
            Every firm we track
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {firms.map((firm, i) => (
              <li key={firm.id}>
                <FirmCard firm={firm} rank={i + 1} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Trust note */}
      <section className="max-w-(--container-prose) text-sm text-ink-2">
        <h2 className="mb-2 text-lg font-extrabold text-ink">How this ranking works</h2>
        <p>
          Scores combine verified trader reviews, Trustpilot trend tracking, rule fairness, and
          payout evidence we collect continuously. Affiliate commissions never influence position —
          read the full <Link href="/methodology" className="font-semibold text-accent-dark underline">methodology</Link>.
        </p>
      </section>
    </div>
  )
}
