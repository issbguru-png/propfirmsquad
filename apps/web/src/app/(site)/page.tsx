import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllActivePromos, getFirms } from './_lib/data'
import { CURRENT_YEAR, FIRM_TYPE_LABELS, PROGRAM_LABELS, compactMoney } from './_lib/format'
import { EmptyNote, FirmCard, FirmMark, Score, td, th } from './_lib/ui'

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

      {/* How this ranking works */}
      <section aria-labelledby="ranking-how-h">
        <p className="mb-2 text-xs font-bold tracking-widest text-accent uppercase">
          — Our methodology —
        </p>
        <h2 id="ranking-how-h" className="mb-5 text-2xl font-extrabold tracking-tight">
          How this ranking works
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RANKING_PILLARS.map((pillar) => (
            <li
              key={pillar.title}
              className="rounded-lg border border-line bg-card p-5"
            >
              <span
                aria-hidden
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-sm bg-accent-pale text-accent-dark"
              >
                {pillar.icon}
              </span>
              <h3 className="mb-1 font-bold">{pillar.title}</h3>
              <p className="text-sm text-ink-2">{pillar.body}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-ink-2">
          Every data point on this site shows when it was last verified. Read the full{' '}
          <Link href="/methodology" className="font-semibold text-accent-dark underline">
            methodology
          </Link>
          .
        </p>
      </section>
    </div>
  )
}

/* Hand-rolled stroke icons (currentColor) — no icon libraries, per design system. */
const iconProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

const RANKING_PILLARS = [
  {
    title: 'Verified reviews first',
    body: 'Rankings lead with real trader review scores and continuously tracked Trustpilot trends — not marketing claims.',
    icon: (
      <svg {...iconProps}>
        {/* check inside a badge */}
        <path d="M12 2l2.4 2.4 3.4-.4 1 3.2 3 1.6-1.6 3 1.6 3-3 1.6-1 3.2-3.4-.4L12 22l-2.4-2.7-3.4.4-1-3.2-3-1.6 1.6-3-1.6-3 3-1.6 1-3.2 3.4.4z" />
        <path d="M8.5 12l2.5 2.5 4.5-5" />
      </svg>
    ),
  },
  {
    title: 'Payout evidence',
    body: 'We collect dated payout proofs and publish what firms actually pay, not just what they advertise.',
    icon: (
      <svg {...iconProps}>
        {/* banknote */}
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2.5" />
        <path d="M5.5 9.5h.01M18.5 14.5h.01" />
      </svg>
    ),
  },
  {
    title: 'Rules audited',
    body: 'Drawdown types, consistency caps, and news restrictions are read from the fine print and logged when they change.',
    icon: (
      <svg {...iconProps}>
        {/* balance scale */}
        <path d="M12 3v18M5 21h14" />
        <path d="M12 5l-6 2 6-2 6 2-6-2z" />
        <path d="M6 7l-2.5 6a3 3 0 005 0L6 7zM18 7l-2.5 6a3 3 0 005 0L18 7z" />
      </svg>
    ),
  },
  {
    title: 'Never pay-to-rank',
    body: 'Affiliate commissions never move a firm up or down. Position comes from data — the same math for every firm.',
    icon: (
      <svg {...iconProps}>
        {/* struck-through coin */}
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v9M9.8 9.5c.5-.8 1.3-1.2 2.2-1.2 1.4 0 2.4.8 2.4 1.9 0 2.4-4.8 1.4-4.8 3.8 0 1.1 1 1.9 2.4 1.9.9 0 1.7-.4 2.2-1.2" />
        <path d="M5 19L19 5" />
      </svg>
    ),
  },
] as const
