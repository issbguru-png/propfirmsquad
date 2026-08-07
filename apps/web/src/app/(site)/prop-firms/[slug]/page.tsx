import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Challenge, Platform } from '@/payload-types'
import { getFixtureChallenges, type FixtureChallenge } from '@/fixtures/challenges'
import { buildFirmFaqs } from '@/fixtures/faqs'
import {
  getAlternatives,
  getChallengesForFirm,
  getFirmBySlug,
  getPromosForFirm,
  getRuleChangesForFirm,
} from '../../_lib/data'
import {
  ASSET_LABELS,
  CURRENT_YEAR,
  DRAWDOWN_LABELS,
  FIRM_TYPE_LABELS,
  PAYOUT_METHOD_LABELS,
  PROGRAM_LABELS,
  compactMoney,
  countryName,
  formatDate,
  money,
  richTextToParagraphs,
  yearOf,
} from '../../_lib/format'
import { Badge, EmptyNote, FirmCard, FirmMark, SectionCard, td, th } from '../../_lib/ui'

export const dynamic = 'force-dynamic'

type Params = Promise<{ slug: string }>

const SECTIONS = [
  { id: 'verdict', label: 'Verdict' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'rules', label: 'Rules' },
  { id: 'payouts', label: 'Payouts' },
  { id: 'trust', label: 'Trust & Company' },
  { id: 'platforms', label: 'Platforms & Assets' },
  { id: 'faq', label: 'FAQ' },
  { id: 'alternatives', label: 'Alternatives' },
] as const

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const firm = await getFirmBySlug(slug)
  if (!firm) return { title: 'Firm not found' }

  const score = firm.reviewScore != null ? ` (${firm.reviewScore}★)` : ''
  const est = yearOf(firm.dateEstablished)
  return {
    title:
      firm.seo?.metaTitle ||
      `${firm.name} Review ${CURRENT_YEAR}: Rules, Payouts & Real Trader Data${score}`,
    description:
      firm.seo?.metaDescription ||
      `Is ${firm.name} legit? ${firm.reviewsCount ? `${firm.reviewsCount.toLocaleString('en-US')} trader reviews, ` : ''}challenge pricing, drawdown rules, payout data${est ? `, and company facts since ${est}` : ' and company facts'} — verified and updated.`,
    alternates: { canonical: `/prop-firms/${firm.slug}` },
    robots: firm.seo?.indexable === false ? { index: false, follow: true } : undefined,
  }
}

const isDbChallenge = (c: Challenge | FixtureChallenge): c is Challenge => 'id' in c

export default async function FirmProfilePage({ params }: { params: Params }) {
  const { slug } = await params
  const firm = await getFirmBySlug(slug)
  if (!firm) notFound()

  const [dbChallenges, promos, ruleChanges, alternatives] = await Promise.all([
    getChallengesForFirm(firm.id),
    getPromosForFirm(firm.id),
    getRuleChangesForFirm(firm.id),
    getAlternatives(firm),
  ])

  const usingFixturePricing = dbChallenges.length === 0
  const challenges: (Challenge | FixtureChallenge)[] = usingFixturePricing
    ? getFixtureChallenges(firm)
    : dbChallenges

  const platformNames = (firm.platforms ?? [])
    .filter((p): p is Platform => typeof p === 'object' && p !== null)
    .map((p) => p.name)

  const cheapest = challenges.length
    ? Math.min(...challenges.map((c) => c.price ?? Infinity))
    : null
  const faqs = buildFirmFaqs({
    firm,
    promos,
    cheapestPrice: Number.isFinite(cheapest) ? cheapest : null,
    platformNames,
  })

  const verdictParas = richTextToParagraphs(firm.verdict)
  const est = yearOf(firm.dateEstablished)
  const rules = firm.rulesSummary
  const payout = firm.payout
  const bestPromo = promos[0]

  return (
    <div>
      {/* ————— Header ————— */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <FirmMark firm={firm} size="lg" />
        <div className="min-w-0">
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            {firm.name} Review {CURRENT_YEAR}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-2">
            {(firm.firmTypes ?? []).map((t) => (
              <Badge key={t} tone="accent">
                {FIRM_TYPE_LABELS[t]}
              </Badge>
            ))}
            {est ? <span>Est. {est}</span> : null}
            <span>{countryName(firm.country)}</span>
            {firm.lastVerifiedAt ? (
              <span>· data verified {formatDate(firm.lastVerifiedAt)}</span>
            ) : null}
          </p>
        </div>
      </div>

      {firm.underReview ? (
        <div role="alert" className="mb-6 rounded-sm border border-negative/40 bg-negative/10 p-4 text-sm font-semibold text-negative">
          {firm.name} is currently under review{firm.underReviewNote ? `: ${firm.underReviewNote}` : ' — we are investigating recent reports. Hold off on purchases until this clears.'}
        </div>
      ) : null}

      {/* ————— Sticky section nav ————— */}
      <nav
        aria-label="On this page"
        className="sticky top-0 z-10 -mx-4 mb-8 border-y border-line bg-page/95 px-4 backdrop-blur"
      >
        <ul className="flex gap-x-5 overflow-x-auto py-3 text-sm font-semibold whitespace-nowrap">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-ink-2 transition-colors hover:text-accent-dark">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-10">
        {/* ————— 1. Verdict ————— */}
        <SectionCard id="verdict" title={`Our verdict on ${firm.name}`}>
          <div className="mb-5 flex flex-wrap items-center gap-x-8 gap-y-3">
            <div>
              <div className="text-5xl font-black text-accent-dark">
                {firm.reviewScore != null ? firm.reviewScore : '—'}
                <span className="text-2xl text-accent">★</span>
              </div>
              <div className="text-xs text-ink-3">
                {firm.reviewsCount
                  ? `${firm.reviewsCount.toLocaleString('en-US')} trader reviews`
                  : 'not yet rated'}
              </div>
            </div>
            {firm.trustPilotScore != null ? (
              <div>
                <div className="text-2xl font-extrabold">{firm.trustPilotScore}/5</div>
                <div className="text-xs text-ink-3">Trustpilot</div>
              </div>
            ) : null}
            {firm.maxAllocation != null ? (
              <div>
                <div className="text-2xl font-extrabold">{compactMoney(firm.maxAllocation)}</div>
                <div className="text-xs text-ink-3">max funding</div>
              </div>
            ) : null}
            {payout?.profitSplitPct != null ? (
              <div>
                <div className="text-2xl font-extrabold">{payout.profitSplitPct}%</div>
                <div className="text-xs text-ink-3">profit split</div>
              </div>
            ) : null}
          </div>
          {verdictParas.length > 0 ? (
            verdictParas.map((p, i) => (
              <p key={i} className="mb-3 max-w-(--container-prose) leading-relaxed">
                {p}
              </p>
            ))
          ) : (
            <p className="max-w-(--container-prose) leading-relaxed">
              {firm.name} is a {(firm.firmTypes ?? []).map((t) => FIRM_TYPE_LABELS[t]).join(' and ')}{' '}
              prop firm{est ? ` operating since ${est}` : ''}
              {firm.country ? `, based in ${countryName(firm.country)}` : ''}.{' '}
              {firm.reviewScore != null && firm.reviewsCount
                ? `It scores ${firm.reviewScore}/5 from ${firm.reviewsCount.toLocaleString('en-US')} trader reviews`
                : 'It has not yet accumulated enough reviews for a rating'}
              {firm.trustPilotScore != null ? ` and holds ${firm.trustPilotScore}/5 on Trustpilot` : ''}
              . Our full editorial verdict is in progress — the data below is what we have verified
              so far.
            </p>
          )}
          {bestPromo?.code ? (
            <p className="mt-4">
              <Link
                href={`/prop-firms/${firm.slug}/promo-code`}
                className="inline-block rounded-sm bg-accent px-4 py-2 text-sm font-bold text-nav transition-colors hover:bg-accent-light"
              >
                Get {bestPromo.discountPct != null ? `${bestPromo.discountPct}% off` : 'promo code'}{' '}
                with code {bestPromo.code} →
              </Link>
            </p>
          ) : null}
        </SectionCard>

        {/* ————— 2. Challenge pricing ————— */}
        <SectionCard
          id="pricing"
          title={`${firm.name} challenge pricing`}
          intro={`Every account size and step count ${firm.name} sells, with targets and drawdown limits in one table.`}
        >
          {usingFixturePricing && challenges.length > 0 ? (
            <p className="mb-3 rounded-sm border border-accent/30 bg-accent-pale p-3 text-sm text-accent-dark">
              Live prices for {firm.name} are being verified — the table shows the typical structure
              of its programs, not confirmed quotes.
            </p>
          ) : null}
          {challenges.length === 0 ? (
            <EmptyNote>Challenge data for {firm.name} is being collected.</EmptyNote>
          ) : (
            <div className="overflow-x-auto rounded-sm border border-line">
              <table className="w-full min-w-[820px] border-collapse text-sm">
                <caption className="sr-only">
                  {firm.name} challenge pricing by account size
                </caption>
                <thead className="border-b border-line bg-page">
                  <tr>
                    <th scope="col" className={th}>Program</th>
                    <th scope="col" className={th}>Account size</th>
                    <th scope="col" className={th}>Price</th>
                    <th scope="col" className={th}>Profit target(s)</th>
                    <th scope="col" className={th}>Max daily loss</th>
                    <th scope="col" className={th}>Max drawdown</th>
                    <th scope="col" className={th}>Drawdown type</th>
                    <th scope="col" className={th}>Split</th>
                    <th scope="col" className={th}>Refundable</th>
                  </tr>
                </thead>
                <tbody>
                  {challenges.map((c, i) => (
                    <tr key={isDbChallenge(c) ? c.id : i} className="border-b border-line last:border-0">
                      <th scope="row" className={`${td} text-left font-bold`}>{c.name}</th>
                      <td className={td}>{money(c.accountSize)}</td>
                      <td className={`${td} font-bold text-accent-dark`}>{money(c.price)}</td>
                      <td className={td}>
                        {(c.profitTargets ?? []).length > 0
                          ? (c.profitTargets ?? []).map((t) => `${t.targetPct}%`).join(' / ')
                          : 'None'}
                      </td>
                      <td className={td}>{c.maxDailyLossPct != null ? `${c.maxDailyLossPct}%` : '—'}</td>
                      <td className={td}>
                        {c.maxTotalDrawdownPct != null ? `${c.maxTotalDrawdownPct}%` : '—'}
                      </td>
                      <td className={td}>{c.drawdownType ? DRAWDOWN_LABELS[c.drawdownType] : '—'}</td>
                      <td className={td}>{c.profitSplitPct != null ? `${c.profitSplitPct}%` : '—'}</td>
                      <td className={td}>
                        {c.refundableFee == null ? '—' : c.refundableFee ? 'Yes' : 'No'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* ————— 3. Rules ————— */}
        <SectionCard
          id="rules"
          title={`${firm.name} rules, explained`}
          intro="The rules that actually get traders breached — what they are and how this firm sets them."
        >
          <div className="overflow-x-auto rounded-sm border border-line">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <caption className="sr-only">{firm.name} trading rules summary</caption>
              <thead className="border-b border-line bg-page">
                <tr>
                  <th scope="col" className={th}>Rule</th>
                  <th scope="col" className={th}>{firm.name}</th>
                  <th scope="col" className={th}>Why it matters</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    rule: 'Drawdown type',
                    value: rules?.drawdownType ? DRAWDOWN_LABELS[rules.drawdownType] : 'Being verified',
                    why: 'Trailing drawdown follows your equity peak and is the #1 cause of surprise breaches; static drawdown is fixed from starting balance and far more forgiving.',
                  },
                  {
                    rule: 'Consistency rule',
                    value:
                      rules?.consistencyRulePct != null
                        ? `${rules.consistencyRulePct}% cap per day`
                        : rules && rules.consistencyRulePct === null && rules.drawdownType
                          ? 'None'
                          : 'Being verified',
                    why: 'Caps how much of your total profit can come from a single day. A strict cap can delay or void payouts for traders with a few big wins.',
                  },
                  {
                    rule: 'News trading',
                    value:
                      rules?.newsTradingAllowed == null
                        ? 'Being verified'
                        : rules.newsTradingAllowed
                          ? 'Allowed'
                          : 'Restricted',
                    why: 'Some firms void trades placed around high-impact news releases — critical if you trade NFP, CPI, or rate decisions.',
                  },
                  {
                    rule: 'Expert advisors (EAs)',
                    value:
                      rules?.eaAllowed == null ? 'Being verified' : rules.eaAllowed ? 'Allowed' : 'Not allowed',
                    why: 'Determines whether automated strategies and copiers are permitted, and whether an EA can get your account flagged.',
                  },
                  {
                    rule: 'Minimum trading days',
                    value:
                      rules?.minTradingDays != null ? `${rules.minTradingDays} days` : 'Being verified',
                    why: 'The floor on how fast you can pass a phase — matters if you trade infrequently or want to pass quickly.',
                  },
                ].map((row) => (
                  <tr key={row.rule} className="border-b border-line last:border-0">
                    <th scope="row" className={`${td} text-left font-bold`}>{row.rule}</th>
                    <td className={`${td} font-semibold ${row.value === 'Being verified' ? 'text-ink-3' : ''}`}>
                      {row.value}
                    </td>
                    <td className={`${td} text-ink-2`}>{row.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {ruleChanges.length > 0 ? (
            <div className="mt-6">
              <h3 className="mb-3 text-lg font-extrabold">Rule-change log</h3>
              <ol className="space-y-3 border-l-2 border-accent pl-4">
                {ruleChanges.map((rc) => (
                  <li key={rc.id}>
                    <time dateTime={rc.date} className="block text-xs font-bold text-ink-3">
                      {formatDate(rc.date)}
                    </time>
                    <p className="font-semibold">{rc.summary}</p>
                    {rc.details ? <p className="text-sm text-ink-2">{rc.details}</p> : null}
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-2">
              We track every rule change {firm.name} makes and log it here with dates and sources —
              no changes recorded yet.
            </p>
          )}
        </SectionCard>

        {/* ————— 4. Payouts ————— */}
        <SectionCard
          id="payouts"
          title={`${firm.name} payout data`}
          intro="Advertised terms plus what we can verify from dated community payout proofs."
        >
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: 'Profit split',
                value: payout?.profitSplitPct != null ? `${payout.profitSplitPct}%` : 'Being verified',
              },
              {
                label: 'Payout frequency',
                value: payout?.frequency || 'Being verified',
              },
              {
                label: 'Avg. payout time (tracked)',
                value: payout?.avgPayoutDays != null ? `${payout.avgPayoutDays} days` : 'Collecting proofs',
              },
              {
                label: 'Payout methods',
                value:
                  (payout?.methods ?? []).length > 0
                    ? (payout?.methods ?? []).map((m) => PAYOUT_METHOD_LABELS[m]).join(', ')
                    : 'Being verified',
              },
            ].map((item) => (
              <div key={item.label} className="rounded-sm border border-line bg-page p-4">
                <dt className="text-xs font-bold tracking-wide text-ink-3 uppercase">{item.label}</dt>
                <dd className="mt-1 font-bold">{item.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 max-w-(--container-prose) text-sm text-ink-2">
            We publish payout-speed distributions from dated community proofs rather than trusting
            advertised numbers. {firm.name}&apos;s tracker goes live once we have enough verified
            data points.
          </p>
        </SectionCard>

        {/* ————— 5. Trust & company ————— */}
        <SectionCard
          id="trust"
          title={`Is ${firm.name} legit? Trust & company facts`}
        >
          <div className="overflow-x-auto rounded-sm border border-line">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <caption className="sr-only">{firm.name} company facts</caption>
              <tbody>
                {[
                  { label: 'Established', value: firm.dateEstablished ? formatDate(firm.dateEstablished) : '—' },
                  { label: 'Headquarters', value: countryName(firm.country) },
                  {
                    label: 'Trustpilot score',
                    value:
                      firm.trustPilotScore != null
                        ? `${firm.trustPilotScore}/5`
                        : 'Not tracked yet',
                  },
                  {
                    label: 'Trader review score',
                    value:
                      firm.reviewScore != null
                        ? `${firm.reviewScore}/5 (${(firm.reviewsCount ?? 0).toLocaleString('en-US')} reviews)`
                        : 'No reviews yet',
                  },
                  { label: 'Max allocation', value: compactMoney(firm.maxAllocation) },
                  {
                    label: 'Status',
                    value: firm.underReview ? 'Under review — see notice above' : 'Listed in good standing',
                  },
                  { label: 'Data last verified', value: formatDate(firm.lastVerifiedAt) },
                ].map((row) => (
                  <tr key={row.label} className="border-b border-line last:border-0">
                    <th scope="row" className={`${td} w-56 text-left font-bold`}>{row.label}</th>
                    <td className={td}>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(firm.trustpilotHistory ?? []).length > 0 ? (
            <div className="mt-6">
              <h3 className="mb-3 text-lg font-extrabold">Trustpilot trend (tracked weekly)</h3>
              <div className="overflow-x-auto rounded-sm border border-line">
                <table className="w-full min-w-[320px] border-collapse text-sm">
                  <thead className="border-b border-line bg-page">
                    <tr>
                      <th scope="col" className={th}>Date</th>
                      <th scope="col" className={th}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(firm.trustpilotHistory ?? []).map((h) => (
                      <tr key={h.id ?? h.date} className="border-b border-line last:border-0">
                        <td className={td}>{formatDate(h.date)}</td>
                        <td className={td}>{h.score}/5</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
          <p className="mt-4 flex flex-wrap gap-4 text-sm font-semibold">
            {firm.websiteUrl ? (
              <a href={firm.websiteUrl} rel="nofollow noopener" className="text-accent-dark underline">
                Official website
              </a>
            ) : null}
            {firm.trustpilotUrl ? (
              <a href={firm.trustpilotUrl} rel="nofollow noopener" className="text-accent-dark underline">
                Trustpilot profile
              </a>
            ) : null}
            {firm.discordUrl ? (
              <a href={firm.discordUrl} rel="nofollow noopener" className="text-accent-dark underline">
                Community Discord
              </a>
            ) : null}
          </p>
        </SectionCard>

        {/* ————— 6. Platforms & assets ————— */}
        <SectionCard
          id="platforms"
          title="Platforms & tradable assets"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-bold tracking-wide text-ink-3 uppercase">Platforms</h3>
              {platformNames.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {platformNames.map((name) => (
                    <li key={name}>
                      <Badge tone="accent">{name}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-2">Platform list being verified.</p>
              )}
            </div>
            <div>
              <h3 className="mb-2 text-sm font-bold tracking-wide text-ink-3 uppercase">Assets</h3>
              {(firm.assets ?? []).length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {(firm.assets ?? []).map((a) => (
                    <li key={a}>
                      <Badge>{ASSET_LABELS[a]}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-2">Asset list being verified.</p>
              )}
            </div>
          </div>
          {(firm.programTypes ?? []).length > 0 ? (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-bold tracking-wide text-ink-3 uppercase">Program types</h3>
              <ul className="flex flex-wrap gap-2">
                {(firm.programTypes ?? []).map((p) => (
                  <li key={p}>
                    <Badge>{PROGRAM_LABELS[p]}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </SectionCard>

        {/* ————— 7. FAQ ————— */}
        <SectionCard id="faq" title={`${firm.name} — frequently asked questions`}>
          <div className="max-w-(--container-prose) divide-y divide-line">
            {faqs.map((f) => (
              <div key={f.question} className="py-4 first:pt-0 last:pb-0">
                <h3 className="mb-1.5 font-bold">{f.question}</h3>
                <p className="text-ink-2">{f.answer}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ————— 8. Alternatives ————— */}
        <SectionCard
          id="alternatives"
          title={`Alternatives to ${firm.name}`}
          intro="Top-rated firms traders compare against this one."
        >
          {alternatives.length === 0 ? (
            <EmptyNote>No alternatives to show yet.</EmptyNote>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-3">
              {alternatives.map((alt) => (
                <li key={alt.id}>
                  <FirmCard firm={alt} />
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-sm">
            <Link href="/prop-firms" className="font-semibold text-accent-dark hover:underline">
              Compare all firms in the directory →
            </Link>
          </p>
        </SectionCard>
      </div>
    </div>
  )
}
