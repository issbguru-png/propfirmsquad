import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllActivePromos, getFirms } from './_lib/data'
import { CURRENT_YEAR, FIRM_TYPE_LABELS, PROGRAM_LABELS, compactMoney } from './_lib/format'
import { EmptyNote, FirmCard, FirmMark, Score } from './_lib/ui'
import { JsonLd } from '@/lib/seo/json-ld'
import { personLd } from '@/lib/seo/jsonld'

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

/* Top-10 table is the primary info section — larger type + roomier rows than the shared th/td. */
const thTop = 'px-4 py-3 text-left text-xs font-bold tracking-wide text-ink-2 uppercase'
const tdTop = 'px-4 py-4 align-middle'

export default async function HomePage() {
  const [firms, promos] = await Promise.all([getFirms(), getAllActivePromos()])
  const top = firms.slice(0, 10)
  const topThree = firms.slice(0, 3)

  return (
    <div className="space-y-12">
      {/* Hero: direct answer for "best prop firms" */}
      <section className="flex flex-wrap items-start justify-between gap-x-10 gap-y-6">
        <div className="min-w-0 flex-1 basis-[36rem]">
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

        {/* Trust strip: core mantra + author signature */}
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
          <p className="flex items-center gap-2.5 rounded-full border border-line bg-card py-2 pr-4 pl-3 text-sm font-semibold">
            <span
              aria-hidden
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-pale text-accent-dark"
            >
              {/* shield-check */}
              <svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2l8 3.5v5.2c0 5-3.4 9.4-8 11.3-4.6-1.9-8-6.3-8-11.3V5.5L12 2z" />
                <path d="M8.5 12l2.5 2.5 4.5-5" />
              </svg>
            </span>
            Quality over quantity — the top firms reviewed deeply, not 500 listed shallowly.
          </p>
        </div>
        </div>

        {/* Author card beside the headline */}
        <a
          href="#author-h"
          className="group relative w-52 shrink-0 overflow-hidden rounded-lg border border-line bg-card text-center shadow-sm transition-shadow hover:shadow-md"
        >
          {/* Portrait stage: warm backdrop, cutout sits flush on its bottom edge */}
          <span className="block bg-gradient-to-b from-accent-pale to-accent-light/40 px-6 pt-5">
            <img
              src="/ayub-rana.png"
              alt="Ayub Rana, Chartered Accountant and forex trader"
              width={144}
              height={144}
              className="mx-auto block h-36 w-36 object-contain object-bottom drop-shadow-[0_6px_12px_rgba(31,30,28,0.25)]"
            />
          </span>
          {/* Verified badge pinned over the stage */}
          <span className="absolute top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-card/95 py-1 pr-2.5 pl-1.5 text-[10px] font-bold tracking-wide whitespace-nowrap text-accent-dark uppercase shadow-sm">
            <svg
              aria-hidden
              width={12}
              height={12}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2l8 3.5v5.2c0 5-3.4 9.4-8 11.3-4.6-1.9-8-6.3-8-11.3V5.5L12 2z" />
              <path d="M8.5 12l2.5 2.5 4.5-5" />
            </svg>
            Verified reviewer
          </span>
          {/* Signature block */}
          <span className="block border-t-2 border-accent px-4 pt-3 pb-4">
            <span className="block font-serif text-2xl italic group-hover:text-accent-dark">
              Ayub Rana
            </span>
            <svg
              aria-hidden
              width={110}
              height={8}
              viewBox="0 0 110 8"
              fill="none"
              className="mx-auto mt-0.5 text-accent"
            >
              <path
                d="M2 5.5C22 1.5 44 6.5 62 3.5c16-2.6 30 1.5 46 .5"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
              />
            </svg>
            <span className="mt-1.5 block text-xs leading-snug text-ink-3">
              Chartered Accountant &amp; Forex Trader
            </span>
            <span className="mt-0.5 block text-[11px] font-semibold text-ink-2">
              Every review personally verified
            </span>
          </span>
        </a>
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
            <table className="w-full min-w-[720px] border-collapse text-base">
              <caption className="sr-only">
                Top prop trading firms of {CURRENT_YEAR} ranked by review score
              </caption>
              <thead className="border-b border-line bg-page">
                <tr>
                  <th scope="col" className={thTop}>#</th>
                  <th scope="col" className={thTop}>Firm</th>
                  <th scope="col" className={thTop}>Score</th>
                  <th scope="col" className={thTop}>Reviews</th>
                  <th scope="col" className={thTop}>Max funding</th>
                  <th scope="col" className={thTop}>Programs</th>
                  <th scope="col" className={thTop}>Market</th>
                </tr>
              </thead>
              <tbody>
                {top.map((firm, i) => (
                  <tr key={firm.id} className="border-b border-line last:border-0">
                    <td className={`${tdTop} font-bold text-ink-3`}>{i + 1}</td>
                    <th scope="row" className={`${tdTop} text-left`}>
                      <Link
                        href={`/prop-firms/${firm.slug}`}
                        className="flex items-center gap-3 font-bold text-accent-dark hover:underline"
                      >
                        <FirmMark firm={firm} />
                        {firm.name}
                      </Link>
                    </th>
                    <td className={tdTop}>
                      <Score value={firm.reviewScore} />
                    </td>
                    <td className={tdTop}>{firm.reviewsCount?.toLocaleString('en-US') ?? '—'}</td>
                    <td className={`${tdTop} font-semibold`}>{compactMoney(firm.maxAllocation)}</td>
                    <td className={`${tdTop} text-ink-2`}>
                      {(firm.programTypes ?? []).map((p) => PROGRAM_LABELS[p]).join(', ') || '—'}
                    </td>
                    <td className={`${tdTop} text-ink-2`}>
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
        <p className="mt-4 max-w-(--container-prose) text-sm text-ink-2">
          <strong className="text-ink">Real trader sentiment, collected in-house.</strong> Our
          review scores aggregate what traders actually report on Trustpilot, Reddit, X, and
          Facebook — gathered and verified by us, not copied from press releases. Affiliate
          commissions never move a ranking.
        </p>
        <p className="mt-2 text-sm text-ink-2">
          Every data point on this site shows when it was last verified. Read the full{' '}
          <Link href="/methodology" className="font-semibold text-accent-dark underline">
            methodology
          </Link>
          .
        </p>
      </section>

      {/* Author / E-E-A-T */}
      <section
        aria-labelledby="author-h"
        className="rounded-lg border border-line bg-card p-6 sm:p-8"
      >
        <JsonLd data={personLd()} />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <img
            src="/ayub-rana.png"
            alt="Ayub Rana, Chartered Accountant and forex trader — PropFirmSquad reviewer"
            width={112}
            height={112}
            className="h-28 w-28 shrink-0 rounded-lg bg-accent-pale object-cover"
          />
          <div>
            <h2 id="author-h" className="mb-1 text-2xl font-extrabold tracking-tight">
              Reviewed by a real trader — not a content team
            </h2>
            <p className="mb-3 text-sm font-semibold text-ink-2">
              Ayub Rana · Chartered Accountant &amp; full-time forex trader
            </p>
            <div className="max-w-(--container-prose) space-y-3 text-ink-2">
              <p>
                <strong className="text-ink">Quality over quantity.</strong> Other sites list 500+
                prop firms nobody has actually tested. PropFirmSquad reviews the top firms deeply —
                every ranked firm is personally reviewed by Ayub, a qualified CA who audits challenge
                rules, pricing, and payout terms the way an accountant reads a balance sheet, and
                trades funded accounts himself.
              </p>
            </div>
          </div>
        </div>
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
    body: 'Rankings lead with real trader sentiment we collect in-house from Trustpilot, Reddit, X, and Facebook — not marketing claims.',
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
