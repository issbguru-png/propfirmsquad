import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Challenge, Country, Firm, Platform } from '@/payload-types'
import { getFixtureChallenges, type FixtureChallenge } from '@/fixtures/challenges'
import { buildFirmFaqs } from '@/fixtures/faqs'
import {
  getAlternatives,
  getChallengesForFirm,
  getChallengesForFirms,
  getFirmBySlug,
  getFirms,
  getPromosForFirm,
  getRuleChangesForFirm,
} from '../../_lib/data'
import {
  cheapestByFirm,
  computeTypeRank,
  leverageMatrix,
  scoreBreakdown,
  squadScore,
  timeLimitSummary,
} from '../../_lib/profile'
import {
  ASSET_LABELS,
  CURRENT_YEAR,
  DRAWDOWN_LABELS,
  FIRM_TYPE_LABELS,
  LEVERAGE_ASSET_LABELS,
  LEVERAGE_PROGRAM_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYOUT_METHOD_LABELS,
  PROGRAM_LABELS,
  WEEKEND_HOLDING_LABELS,
  compactMoney,
  countryName,
  formatDate,
  limitLabel,
  money,
  richTextToParagraphs,
  splitDraftMarker,
  yearOf,
} from '../../_lib/format'
import { Badge, EmptyNote, FirmCard, FirmMark, SectionCard, td, th } from '../../_lib/ui'
import { TrustpilotNotice } from '../../_lib/TrustpilotNotice'
import { publishableWarning } from '../../_lib/trustpilot'
import { Button, RatingStars, SectionKicker, TrendChart, VerdictBox } from '@/components'
import { SectionNav } from './SectionNav'
import { AuthorByline } from './AuthorByline'
import { BackToTop } from './BackToTop'
import { AvailabilityChecker } from './AvailabilityChecker'
import { AvailabilityChip } from './AvailabilityChip'
import { JsonLd } from '@/lib/seo/json-ld'
import { breadcrumbLd, faqLd, firmLd } from '@/lib/seo/jsonld'
import { firmProfileMeta } from '@/lib/seo/metadata'

export const dynamic = 'force-dynamic'

type Params = Promise<{ slug: string }>

const SECTIONS = [
  { id: 'verdict', label: 'Verdict' },
  { id: 'pros-cons', label: 'Pros & Cons' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'rules', label: 'Rules' },
  { id: 'payouts', label: 'Payouts' },
  { id: 'trust', label: 'Trust & Company' },
  { id: 'platforms', label: 'Platforms & Assets' },
  { id: 'faq', label: 'FAQ' },
  { id: 'alternatives', label: 'Alternatives' },
] as const

/** § wayfinding number for a section id (1-based, follows SECTIONS order). */
const sectionNumber = (id: (typeof SECTIONS)[number]['id']) =>
  SECTIONS.findIndex((s) => s.id === id) + 1

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const firm = await getFirmBySlug(slug)
  if (!firm) return { title: 'Firm not found' }
  return firmProfileMeta(firm)
}

const isDbChallenge = (c: Challenge | FixtureChallenge): c is Challenge => 'id' in c

/** Fixtures carry no currency, so they are USD by construction. */
const challengeCurrency = (c: Challenge | FixtureChallenge): string =>
  isDbChallenge(c) ? (c.currency ?? 'USD') : 'USD'

/** Right-aligned variants for numeric table columns. */
const thNum = `${th} text-right`
const tdNum = `${td} text-right tabular-nums`

export default async function FirmProfilePage({ params }: { params: Params }) {
  const { slug } = await params
  const firm = await getFirmBySlug(slug)
  if (!firm) notFound()

  const [dbChallenges, promos, ruleChanges, alternatives, allFirms] = await Promise.all([
    getChallengesForFirm(firm.id),
    getPromosForFirm(firm.id),
    getRuleChangesForFirm(firm.id),
    getAlternatives(firm),
    getFirms(),
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
  const cheapestIdx = challenges.findIndex((c) => c.price != null && c.price === cheapest)
  const faqs = buildFirmFaqs({
    firm,
    promos,
    cheapestPrice: Number.isFinite(cheapest) ? cheapest : null,
    platformNames,
  })

  const { paragraphs: verdictParas, isDraft: verdictIsDraft } = splitDraftMarker(
    richTextToParagraphs(firm.verdict),
  )
  const est = yearOf(firm.dateEstablished)
  const rules = firm.rulesSummary
  const payout = firm.payout
  const bestPromo = promos
    .slice()
    .sort((a, b) => (b.discountPct ?? 0) - (a.discountPct ?? 0))[0]

  // ── Rank among firms sharing this firm's primary type ──
  const rankInfo = computeTypeRank(firm, allFirms)

  // ── Key-facts chips (omit chips with no data) ──
  const cheapestRow = cheapestIdx >= 0 ? challenges[cheapestIdx] : null
  const currentCheapest =
    cheapestRow && cheapestRow.price != null
      ? {
          price: cheapestRow.price,
          currency: isDbChallenge(cheapestRow) ? (cheapestRow.currency ?? 'USD') : 'USD',
        }
      : null
  const keyFacts: { label: string; value: string; href: string }[] = []
  if (currentCheapest) {
    keyFacts.push({
      label: 'Cheapest challenge',
      value: money(currentCheapest.price, currentCheapest.currency),
      href: '#pricing',
    })
  }
  if (firm.maxAllocation != null) {
    keyFacts.push({ label: 'Max funding', value: compactMoney(firm.maxAllocation), href: '#trust' })
  }
  if (payout?.profitSplitPct != null) {
    keyFacts.push({ label: 'Profit split', value: `${payout.profitSplitPct}%`, href: '#payouts' })
  }
  if (payout?.frequency) {
    keyFacts.push({ label: 'Payout', value: payout.frequency, href: '#payouts' })
  }

  // ── Pricing footnotes (challenge feeNote, e.g. staged fees) ──
  // Traditional footnote order, then the doubled forms. Three was enough for
  // CFD firms; futures firms price per account size with a distinct fee note
  // on each row (Tradeify alone needs nine), and the old `*4` fallback read
  // like a rendering bug.
  const FOOTNOTE_MARKS = [
    '†',
    '‡',
    '§',
    '‖',
    '¶',
    '#',
    '††',
    '‡‡',
    '§§',
    '‖‖',
    '¶¶',
    '##',
  ]
  const feeNotes: string[] = []
  const noteMarkFor = new Map<number, string>()
  challenges.forEach((c, i) => {
    if (isDbChallenge(c) && c.feeNote) {
      let idx = feeNotes.indexOf(c.feeNote)
      if (idx === -1) {
        feeNotes.push(c.feeNote)
        idx = feeNotes.length - 1
      }
      noteMarkFor.set(i, FOOTNOTE_MARKS[idx] ?? `*${idx + 1}`)
    }
  })

  // ── Trading conditions (rendered only where the firm publishes them) ──
  const leverage = leverageMatrix(firm.trading?.leverage)
  const commissions = (firm.trading?.commissions ?? []).filter((c) => c.asset && c.cost)
  const broker = firm.trading?.broker
  const hasTradingConditions = Boolean(leverage || commissions.length > 0 || broker)
  // The platforms section covers trading conditions too once we have them, so
  // its kicker and its sticky-nav label are driven from one place.
  const platformsLabel = hasTradingConditions ? 'Platforms & Conditions' : 'Platforms & Assets'

  // Challenge time limits are only trusted behind the firm's verified flag,
  // and never off fixture pricing (fixtures carry no time-limit data).
  const timeLimit = usingFixturePricing
    ? null
    : timeLimitSummary(firm.rulesSummary, dbChallenges)
  const showTimeLimitColumn =
    timeLimit != null && dbChallenges.some((c) => c.timeLimitDays != null)

  // ── Quick rule facts for the verdict pills ──
  // Check = trader-friendly, cross = a restriction. Only rendered where the
  // field is actually audited; unverified fields are omitted, never guessed.
  const ruleFacts: { label: string; ok: boolean }[] = []
  {
    const r = firm.rulesSummary
    const audited = Boolean(r?.drawdownType) // proxy for "we have reviewed this firm's rules"
    if (r?.newsTradingAllowed != null) {
      ruleFacts.push({
        label: r.newsTradingAllowed ? 'News trading allowed' : 'News trading restricted',
        ok: r.newsTradingAllowed,
      })
    }
    if (r?.eaAllowed != null) {
      ruleFacts.push({
        label: r.eaAllowed ? 'EAs allowed' : 'EAs not allowed',
        ok: r.eaAllowed,
      })
    }
    if (r?.consistencyRulePct != null) {
      ruleFacts.push({ label: `${r.consistencyRulePct}% consistency cap`, ok: false })
    } else if (audited) {
      ruleFacts.push({ label: 'No consistency rule', ok: true })
    }
    if (r?.minTradingDays != null) {
      ruleFacts.push({
        label:
          r.minTradingDays === 0
            ? 'No minimum trading days'
            : `${r.minTradingDays} minimum trading days`,
        ok: r.minTradingDays === 0,
      })
    }
    if (timeLimit) {
      ruleFacts.push({ label: timeLimit.label, ok: timeLimit.unlimited })
    }
    if (r?.weekendHolding) {
      ruleFacts.push({
        label:
          r.weekendHolding === 'allowed'
            ? 'Weekend holding allowed'
            : r.weekendHolding === 'not-allowed'
              ? 'No weekend holding'
              : 'Weekend holding on swing accounts only',
        ok: r.weekendHolding === 'allowed',
      })
    }
  }

  // ── Editorial pros/cons + score breakdown ──
  const pros = (firm.prosCons?.pros ?? []).map((p) => p.text).filter(Boolean)
  const cons = (firm.prosCons?.cons ?? []).map((c) => c.text).filter(Boolean)
  const breakdown = scoreBreakdown(firm.scores)
  const trustpilotWarning = publishableWarning(firm)

  // ── Availability (restrictedCountries populated at depth 1) ──
  const restrictedIso2 = (firm.restrictedCountries ?? [])
    .filter((c): c is Country => typeof c === 'object' && c !== null)
    .map((c) => c.iso2)

  // ── Mini comparison: firm vs top-2 alternatives (ONE extra query) ──
  const compareAlts = alternatives.slice(0, 2)
  const altCheapest = cheapestByFirm(await getChallengesForFirms(compareAlts.map((a) => a.id)))
  const compareFirms = [firm, ...compareAlts]
  const cheapestFor = (f: Firm) => (f.id === firm.id ? currentCheapest : altCheapest.get(f.id))
  const compareRows: { label: string; render: (f: Firm) => string }[] = [
    {
      label: 'Squad score',
      render: (f) => {
        const v = squadScore(f)
        return v != null ? `${v}/5` : '—'
      },
    },
    {
      label: 'Trustpilot',
      render: (f) => (f.trustPilotScore != null ? `${f.trustPilotScore}/5` : '—'),
    },
    { label: 'Max funding', render: (f) => compactMoney(f.maxAllocation) },
    {
      label: 'Profit split',
      render: (f) => (f.payout?.profitSplitPct != null ? `${f.payout.profitSplitPct}%` : '—'),
    },
    {
      label: 'Cheapest challenge',
      render: (f) => {
        const entry = cheapestFor(f)
        return entry ? money(entry.price, entry.currency) : '—'
      },
    },
  ]

  return (
    <div>
      <JsonLd data={firmLd(firm)} />
      <JsonLd data={faqLd(faqs)} />
      <JsonLd
        data={breadcrumbLd([
          { name: 'Prop Firms', path: '/prop-firms' },
          { name: firm.name, path: `/prop-firms/${firm.slug}` },
        ])}
      />
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
            {/*
              The leading "·" reads as a separator only while these flex items
              share a line. On a phone each item wraps onto its own line and the
              bullet lands at the start of it, which looks like a typo; the gap
              already separates them there. Desktop keeps the bullets.
            */}
            {firm.lastVerifiedAt ? (
              <span>
                <span aria-hidden className="max-sm:hidden">
                  ·{' '}
                </span>
                data verified {formatDate(firm.lastVerifiedAt)}
              </span>
            ) : null}
            {rankInfo ? (
              <span className="font-semibold text-ink">
                <span aria-hidden className="max-sm:hidden">
                  ·{' '}
                </span>
                #{rankInfo.rank} of {rankInfo.total} {FIRM_TYPE_LABELS[rankInfo.type]} firms ·
                Reviewed by{' '}
                <Link href="/#author-h" className="underline decoration-accent hover:text-accent-dark">
                  Ayub Rana, CA
                </Link>
              </span>
            ) : null}
          </p>
        </div>
        {firm.websiteUrl ? (
          <Button
            variant="secondary"
            size="sm"
            href={firm.websiteUrl}
            rel="nofollow noopener sponsored"
            newTab
            className="sm:ml-auto"
          >
            Visit {firm.name} ↗
          </Button>
        ) : null}
      </div>

      {/* ————— Key-facts chips ————— */}
      {keyFacts.length > 0 ? (
        <ul className="mb-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
          {keyFacts.map((f) => (
            <li key={f.label} className="sm:min-w-40">
              <a
                href={f.href}
                className="group block h-full rounded-lg border border-line bg-card px-4 py-3 transition-colors hover:border-accent"
              >
                <span className="block text-[11px] font-bold tracking-wide text-ink-3 uppercase">
                  {f.label}
                </span>
                <span className="mt-0.5 block text-xl leading-tight font-black tabular-nums text-ink group-hover:text-accent-dark">
                  {f.value}
                </span>
              </a>
            </li>
          ))}
          <AvailabilityChip restrictedIso2={restrictedIso2} />
        </ul>
      ) : null}

      {firm.underReview ? (
        <div role="alert" className="mb-6 rounded-sm border border-negative/40 bg-negative/10 p-4 text-sm font-semibold text-negative">
          {firm.name} is currently under review{firm.underReviewNote ? `: ${firm.underReviewNote}` : '. We are investigating recent reports. Hold off on purchases until this clears.'}
        </div>
      ) : null}

      {/* ————— Sticky section nav ————— */}
      <SectionNav
        sections={SECTIONS.map((s) => ({
          id: s.id,
          label: s.id === 'platforms' ? platformsLabel : s.label,
        }))}
        promo={
          bestPromo?.code
            ? {
                code: bestPromo.code,
                discountPct: bestPromo.discountPct,
                href: `/prop-firms/${firm.slug}/promo-code`,
              }
            : null
        }
      />

      <AuthorByline verifiedAt={firm.lastVerifiedAt} />

      <div className="space-y-10">
        {/* ————— 1. Verdict ————— */}
        <VerdictBox
          id="verdict"
          title={`Our verdict on ${firm.name}`}
          updatedAt={firm.lastVerifiedAt}
          kicker={<SectionKicker number={sectionNumber('verdict')} className="mb-1.5">Verdict</SectionKicker>}
          badge={verdictIsDraft ? <Badge>Draft: pending review</Badge> : undefined}
          className="scroll-mt-24 sm:p-7"
        >
          {/* Scorecard beside the narrative: the numbers on the left, what they
              mean on the right. Two different 5-point scores live here (trader
              reviews vs our editorial score), so each is labelled explicitly. */}
          <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
            {/* ── Scorecard ── */}
            <div className="lg:col-span-2">
              <div className="rounded-lg border border-line bg-page/60 p-4">
                <p className="text-[11px] font-bold tracking-wide text-ink-3 uppercase">
                  Squad score
                </p>
                {/* The headline number is ours: the average of the five
                    subscores broken down immediately below, so the reader can
                    check the arithmetic without leaving the card. */}
                {breakdown ? (
                  <div className="mt-1 flex items-end gap-3">
                    <span className="text-5xl leading-none font-black tabular-nums text-accent-dark">
                      {breakdown.overall.toFixed(1)}
                    </span>
                    <span className="pb-1">
                      <RatingStars rating={breakdown.overall} />
                      <span className="mt-0.5 block text-xs text-ink-3">
                        averaged from {breakdown.rows.length} scores
                      </span>
                    </span>
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-ink-3">Not yet scored</p>
                )}

                {/* Trustpilot is a third-party cross-check, kept visually
                    subordinate so it is never mistaken for our rating. */}
                <p className="mt-3 border-t border-line pt-3 text-sm text-ink-2">
                  Trustpilot:{' '}
                  {trustpilotWarning ? (
                    <a href="#trust" className="font-bold text-negative underline">
                      rating restricted
                    </a>
                  ) : firm.trustPilotScore != null ? (
                    <span className="font-bold tabular-nums text-ink">
                      {firm.trustPilotScore}/5
                    </span>
                  ) : (
                    <span className="text-ink-3">not tracked yet</span>
                  )}
                </p>

                {breakdown ? (
                  <div className="mt-4 border-t border-line pt-4">
                    {/* The overall is already the headline above, so repeating
                        it here read as two competing ratings. */}
                    <p className="mb-3 text-[11px] font-bold tracking-wide text-ink-3 uppercase">
                      What makes up that score
                    </p>
                    <dl className="space-y-2.5">
                      {breakdown.rows.map((r) => (
                        <div key={r.key} className="flex items-center gap-3">
                          <dt className="w-28 shrink-0 text-xs font-semibold text-ink-2">
                            {r.label}
                          </dt>
                          <dd className="flex min-w-0 flex-1 items-center gap-2.5">
                            <div
                              aria-hidden
                              className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"
                            >
                              <div
                                className="h-full rounded-full bg-accent"
                                style={{ width: `${Math.min(100, (r.value / 5) * 100)}%` }}
                              />
                            </div>
                            <span className="w-7 text-right text-sm font-bold tabular-nums">
                              {r.value.toFixed(1)}
                            </span>
                          </dd>
                        </div>
                      ))}
                    </dl>
                    {/*
                      The only run of real sentence copy on the site under 12px,
                      and it carries a link. 12px on phones, unchanged at 11px
                      from sm up where the eye is further from the text.
                    */}
                    <p className="mt-3 text-xs leading-snug text-ink-3 sm:text-[11px]">
                      Scored by {' '}
                      <a href="/#author-h" className="underline hover:text-accent-dark">
                        Ayub Rana
                      </a>{' '}
                      against our{' '}
                      <Link href="/methodology" className="underline hover:text-accent-dark">
                        published methodology
                      </Link>
                      .
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* ── Narrative ── */}
            <div className="lg:col-span-3">
              {verdictParas.length > 0 ? (
                verdictParas.map((p, i) => (
                  <p key={i} className="mb-3 leading-relaxed">
                    {p}
                  </p>
                ))
              ) : (
                <p className="leading-relaxed">
                  {firm.name} is a{' '}
                  {(firm.firmTypes ?? []).map((t) => FIRM_TYPE_LABELS[t]).join(' and ')} prop firm
                  {est ? ` operating since ${est}` : ''}
                  {firm.country ? `, based in ${countryName(firm.country)}` : ''}.{' '}
                  {breakdown
                    ? `It scores ${breakdown.overall.toFixed(1)}/5 across our ${breakdown.rows.length} scoring criteria`
                    : 'It has not yet been scored against our criteria'}
                  {firm.trustPilotScore != null
                    ? ` and holds ${firm.trustPilotScore}/5 on Trustpilot`
                    : ''}
                  . Our full editorial verdict is in progress; the data below is what we have
                  verified so far.
                </p>
              )}
              {bestPromo?.code ? (
                <p className="mt-5">
                  <Link
                    href={`/prop-firms/${firm.slug}/promo-code`}
                    className="inline-block rounded-sm bg-accent px-4 py-2.5 text-sm font-bold text-nav transition-colors hover:bg-accent-light"
                  >
                    Get{' '}
                    {bestPromo.discountPct != null
                      ? `${bestPromo.discountPct}% off`
                      : 'promo code'}{' '}
                    with code {bestPromo.code} →
                  </Link>
                </p>
              ) : null}

              {/* Rules at a glance: the constraints that decide whether you pass */}
              {ruleFacts.length > 0 ? (
                <ul className="mt-5 flex flex-wrap gap-2">
                  {ruleFacts.map((f) => (
                    <li
                      key={f.label}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                        f.ok
                          ? 'bg-positive-pale text-positive'
                          : 'bg-negative-pale text-negative'
                      }`}
                    >
                      <svg
                        aria-hidden
                        width={13}
                        height={13}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0"
                      >
                        {f.ok ? <path d="M5 13l4 4L19 7" /> : <path d="M6 6l12 12M18 6L6 18" />}
                      </svg>
                      {f.label}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </VerdictBox>

        {/* ————— Pros & Cons ————— */}
        <SectionCard
          id="pros-cons"
          number={sectionNumber('pros-cons')}
          kicker="Pros & Cons"
          title={`${firm.name} pros & cons`}
          intro="The strengths and trade-offs our editors weigh when scoring this firm."
        >
          {pros.length > 0 || cons.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-sm border border-positive/30 bg-positive/10 p-5">
                <h3 className="mb-3 text-sm font-bold tracking-wide text-positive uppercase">
                  What traders like
                </h3>
                <ul className="space-y-2.5">
                  {pros.map((p) => (
                    <li key={p} className="flex gap-2.5 text-sm leading-relaxed">
                      <svg
                        aria-hidden
                        viewBox="0 0 16 16"
                        className="mt-0.5 h-4 w-4 shrink-0 text-positive"
                      >
                        <path
                          d="M3 8.5 6.5 12 13 4.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-sm border border-negative/30 bg-negative/10 p-5">
                <h3 className="mb-3 text-sm font-bold tracking-wide text-negative uppercase">
                  What to watch
                </h3>
                <ul className="space-y-2.5">
                  {cons.map((c) => (
                    <li key={c} className="flex gap-2.5 text-sm leading-relaxed">
                      <svg
                        aria-hidden
                        viewBox="0 0 16 16"
                        className="mt-0.5 h-4 w-4 shrink-0 text-negative"
                      >
                        <path
                          d="M4 4l8 8M12 4l-8 8"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <EmptyNote>Pros &amp; cons pending editorial review.</EmptyNote>
          )}
        </SectionCard>

        {/* ————— Challenge pricing ————— */}
        <SectionCard
          id="pricing"
          number={sectionNumber('pricing')}
          kicker="Pricing"
          title={`${firm.name} challenge pricing`}
          intro={`Every account size and step count ${firm.name} sells, with targets and drawdown limits in one table.`}
        >
          {usingFixturePricing && challenges.length > 0 ? (
            <p className="mb-3 rounded-sm border border-accent/30 bg-accent-pale p-3 text-sm text-accent-dark">
              Live prices for {firm.name} are being verified; the table shows the typical structure
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
                    <th scope="col" className={thNum}>Account size</th>
                    <th scope="col" className={thNum}>Price</th>
                    <th scope="col" className={thNum}>Profit target(s)</th>
                    <th scope="col" className={thNum}>Max daily loss</th>
                    <th scope="col" className={thNum}>Max drawdown</th>
                    <th scope="col" className={th}>Drawdown type</th>
                    {showTimeLimitColumn ? (
                      <th scope="col" className={th}>Time limit</th>
                    ) : null}
                    <th scope="col" className={thNum}>Split</th>
                    <th scope="col" className={th}>Refundable</th>
                  </tr>
                </thead>
                <tbody>
                  {challenges.map((c, i) => (
                    <tr
                      key={isDbChallenge(c) ? c.id : i}
                      className={`border-b border-line last:border-0 ${
                        i === cheapestIdx ? 'bg-accent-pale/60' : 'odd:bg-page/40'
                      }`}
                    >
                      <th scope="row" className={`${td} text-left font-bold`}>
                        <span className="inline-flex items-center gap-2">
                          {c.name}
                          {i === cheapestIdx ? <Badge tone="accent">Cheapest</Badge> : null}
                        </span>
                      </th>
                      <td className={tdNum}>{money(c.accountSize)}</td>
                      <td className={`${tdNum} font-bold text-accent-dark`}>
                        {money(c.price)}
                        {noteMarkFor.has(i) ? (
                          <sup className="ml-0.5 font-semibold text-ink-2">{noteMarkFor.get(i)}</sup>
                        ) : null}
                      </td>
                      <td className={tdNum}>
                        {(c.profitTargets ?? []).length > 0
                          ? (c.profitTargets ?? [])
                              .map(
                                (t) =>
                                  limitLabel(
                                    t.targetPct,
                                    'targetAmount' in t ? t.targetAmount : null,
                                    challengeCurrency(c),
                                  ) ?? '—',
                              )
                              .join(' / ')
                          : 'None'}
                      </td>
                      <td className={tdNum}>
                        {limitLabel(
                          c.maxDailyLossPct,
                          'maxDailyLossAmount' in c ? c.maxDailyLossAmount : null,
                          challengeCurrency(c),
                        ) ?? '—'}
                      </td>
                      <td className={tdNum}>
                        {limitLabel(
                          c.maxTotalDrawdownPct,
                          'maxTotalDrawdownAmount' in c ? c.maxTotalDrawdownAmount : null,
                          challengeCurrency(c),
                        ) ?? '—'}
                      </td>
                      <td className={td}>{c.drawdownType ? DRAWDOWN_LABELS[c.drawdownType] : '—'}</td>
                      {showTimeLimitColumn ? (
                        <td className={td}>
                          {isDbChallenge(c) && c.timeLimitDays != null ? (
                            `${c.timeLimitDays} days`
                          ) : (
                            <span className="font-semibold text-positive">No time limit</span>
                          )}
                        </td>
                      ) : null}
                      <td className={tdNum}>{c.profitSplitPct != null ? `${c.profitSplitPct}%` : '—'}</td>
                      <td className={td}>
                        {c.refundableFee == null ? '—' : c.refundableFee ? 'Yes' : 'No'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {feeNotes.length > 0 ? (
            <div className="mt-4 rounded-sm border-l-2 border-accent bg-accent-pale/50 py-3 pr-4 pl-3.5">
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-accent-dark uppercase">
                <svg
                  aria-hidden
                  width={13}
                  height={13}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 16v-4.5M12 8h.01" />
                </svg>
                Read the fine print
              </p>
              <ul className="space-y-1 text-xs leading-relaxed text-ink-2">
                {feeNotes.map((note, idx) => (
                  <li key={note} className="flex gap-1.5">
                    <span className="font-bold text-accent-dark">
                      {FOOTNOTE_MARKS[idx] ?? `*${idx + 1}`}
                    </span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </SectionCard>

        {/* ————— Rules ————— */}
        <SectionCard
          id="rules"
          number={sectionNumber('rules')}
          kicker="Rules"
          title={`${firm.name} rules, explained`}
          intro="The rules that actually get traders breached: what they are and how this firm sets them."
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
                      // Three states, and the middle one is the common case:
                      // a single percentage, a per-program note, or nothing
                      // sayable yet. "None" is the narrowest claim and needs
                      // both the verified gate and the absence of a note.
                      rules?.consistencyRulePct != null
                        ? `${rules.consistencyRulePct}% cap per day`
                        : rules?.consistencyRuleNote
                          ? rules.consistencyRuleNote
                          : rules?.consistencyRuleVerified
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
                    why: 'Some firms void trades placed around high-impact news releases, which is critical if you trade NFP, CPI, or rate decisions.',
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
                    why: 'The floor on how fast you can pass a phase, which matters if you trade infrequently or want to pass quickly.',
                  },
                  // Rows below appear only once researched, so the table never
                  // grows a block of "Being verified" placeholders.
                  ...(timeLimit
                    ? [
                        {
                          rule: 'Challenge time limit',
                          value: timeLimit.label,
                          why: 'A deadline forces you to trade whether or not your setup appears. Firms with no time limit let you sit out bad conditions.',
                        },
                      ]
                    : []),
                  ...(rules?.weekendHolding
                    ? [
                        {
                          rule: 'Weekend / overnight holding',
                          value: WEEKEND_HOLDING_LABELS[rules.weekendHolding],
                          why: 'Swing traders need positions to survive the Friday close. Where holding is barred, open trades are closed for you and gaps cannot be traded.',
                        },
                      ]
                    : []),
                  ...(rules?.copyTradingAllowed != null
                    ? [
                        {
                          rule: 'Copy trading',
                          value: rules.copyTradingAllowed ? 'Allowed' : 'Not allowed',
                          why: 'Decides whether you can mirror one strategy across several accounts. Most firms that allow it restrict it to accounts you own yourself.',
                        },
                      ]
                    : []),
                  ...(rules?.hftAllowed != null
                    ? [
                        {
                          rule: 'High-frequency trading',
                          value: rules.hftAllowed ? 'Allowed' : 'Not allowed',
                          why: 'Firms police latency arbitrage and tick scalping hard, and an HFT breach is one of the most common reasons a passed account is voided.',
                        },
                      ]
                    : []),
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
              We track every rule change {firm.name} makes and log it here with dates and sources.
              No changes recorded yet.
            </p>
          )}
        </SectionCard>

        {/* ————— Payouts ————— */}
        <SectionCard
          id="payouts"
          number={sectionNumber('payouts')}
          kicker="Payouts"
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
              // Only shown once sourced, so the grid never fills with placeholders.
              ...(payout?.firstPayoutDays != null
                ? [
                    {
                      label: 'First payout after',
                      value:
                        payout.firstPayoutDays === 0
                          ? 'On demand'
                          : `${payout.firstPayoutDays} days`,
                    },
                  ]
                : []),
              ...(payout?.minPayoutAmount != null
                ? [
                    {
                      label: 'Minimum payout',
                      // Firms state withdrawal minimums in USD even when they
                      // price challenges in another currency, so this is not
                      // converted into firm.currency.
                      value:
                        payout.minPayoutAmount === 0
                          ? 'No minimum'
                          : money(payout.minPayoutAmount, 'USD'),
                    },
                  ]
                : []),
            ].map((item) => (
              <div key={item.label} className="rounded-sm border border-line bg-page p-4">
                <dt className="text-xs font-bold tracking-wide text-ink-3 uppercase">{item.label}</dt>
                <dd className="mt-1 font-bold">{item.value}</dd>
              </div>
            ))}
          </dl>
          {payout?.splitScaling ? (
            <div className="mt-4 rounded-sm border border-line bg-page p-4">
              <h3 className="text-xs font-bold tracking-wide text-ink-3 uppercase">
                How the split scales
              </h3>
              <p className="mt-1 max-w-(--container-prose) text-sm leading-relaxed">
                {payout.splitScaling}
              </p>
            </div>
          ) : null}
          <p className="mt-4 max-w-(--container-prose) text-sm text-ink-2">
            We publish payout-speed distributions from dated community proofs rather than trusting
            advertised numbers. {firm.name}&apos;s tracker goes live once we have enough verified
            data points.
          </p>
        </SectionCard>

        {/* ————— Trust & company ————— */}
        <SectionCard
          id="trust"
          number={sectionNumber('trust')}
          kicker="Trust & Company"
          title={`Is ${firm.name} legit? Trust & company facts`}
          intro={`Who runs ${firm.name}, how long they have operated, and what independent review platforms say. Check availability for your country below.`}
        >
          {/* Sits above the facts table: it changes how the scores in that
              table should be read, so it has to be seen first. */}
          <div className="mb-5 empty:mb-0">
            <TrustpilotNotice firm={firm} />
          </div>

          <div className="overflow-x-auto rounded-sm border border-line">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <caption className="sr-only">{firm.name} company facts</caption>
              <tbody>
                {[
                  { label: 'Established', value: firm.dateEstablished ? formatDate(firm.dateEstablished) : '—' },
                  { label: 'Headquarters', value: countryName(firm.country) },
                  // Named leadership and accepted payment methods are strong
                  // trust signals, but only when we actually have them.
                  ...(firm.leadership?.ceoName
                    ? [
                        {
                          label: firm.leadership.ceoRole || 'CEO',
                          value: firm.leadership.ceoName,
                        },
                      ]
                    : []),
                  ...((firm.paymentMethods ?? []).length > 0
                    ? [
                        {
                          label: 'Ways to pay',
                          value: (firm.paymentMethods ?? [])
                            .map((m) => PAYMENT_METHOD_LABELS[m] ?? m)
                            .join(', '),
                        },
                      ]
                    : []),
                  // Registry-verified entity. Answers "who am I actually
                  // contracting with", which the marketing site rarely does.
                  ...(firm.legalEntity?.name
                    ? [
                        {
                          label: 'Registered entity',
                          // The registry line links to the filing itself, so
                          // the claim is checkable in one click.
                          value: (
                            <>
                              <span className="font-semibold">{firm.legalEntity.name}</span>
                              {firm.legalEntity.registrationNumber ? (
                                <span className="block text-xs text-ink-3">
                                  {firm.legalEntity.sourceUrl ? (
                                    <a
                                      href={firm.legalEntity.sourceUrl}
                                      rel="nofollow noopener"
                                      target="_blank"
                                      className="text-accent-dark underline"
                                    >
                                      {firm.legalEntity.registry ?? 'Registry'}{' '}
                                      {firm.legalEntity.registrationNumber}
                                    </a>
                                  ) : (
                                    `${firm.legalEntity.registry ?? 'Registry'} ${firm.legalEntity.registrationNumber}`
                                  )}
                                </span>
                              ) : null}
                            </>
                          ),
                        },
                      ]
                    : []),
                  {
                    label: 'Trustpilot score',
                    // A suppressed rating is not a missing rating, and saying
                    // "not tracked" would hide the more interesting fact.
                    value: trustpilotWarning
                      ? 'Restricted by Trustpilot (see notice above)'
                      : firm.trustPilotScore != null
                        ? `${firm.trustPilotScore}/5`
                        : 'Not tracked yet',
                  },
                  {
                    label: 'Squad score',
                    value: breakdown
                      ? `${breakdown.overall.toFixed(1)}/5 across ${breakdown.rows.length} criteria`
                      : 'Not scored yet',
                  },
                  { label: 'Max allocation', value: compactMoney(firm.maxAllocation) },
                  {
                    label: 'Status',
                    // "Good standing" would sit oddly next to a Trustpilot
                    // restriction notice, and it is a claim we cannot support.
                    value: firm.underReview ? 'Under review (see notice above)' : 'Listed',
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
          {(firm.trustpilotHistory ?? []).length > 1 ? (
            <div className="mt-6">
              <h3 className="mb-3 text-lg font-extrabold">Trustpilot trend (tracked weekly)</h3>
              <TrendChart history={firm.trustpilotHistory} />
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
          <AvailabilityChecker firmName={firm.name} restrictedIso2={restrictedIso2} />
        </SectionCard>

        {/* ————— Platforms & assets ————— */}
        <SectionCard
          id="platforms"
          number={sectionNumber('platforms')}
          kicker={platformsLabel}
          title={
            hasTradingConditions
              ? 'Platforms, assets & trading conditions'
              : 'Platforms & tradable assets'
          }
          intro={
            hasTradingConditions
              ? `The platforms ${firm.name} supports, the markets you can trade, and the leverage and commissions that set the real cost of a strategy.`
              : `The trading platforms ${firm.name} supports and the markets you can trade on a funded account.`
          }
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

          {broker ? (
            <div className="mt-6 rounded-sm border border-line bg-page p-4">
              <h3 className="text-xs font-bold tracking-wide text-ink-3 uppercase">
                Broker / liquidity provider
              </h3>
              <p className="mt-1 max-w-(--container-prose) text-sm leading-relaxed font-semibold">
                {broker}
              </p>
              <p className="mt-1.5 max-w-(--container-prose) text-xs leading-relaxed text-ink-2">
                Who actually executes your fills sets your spreads, your slippage, and how closely
                the evaluation matches live conditions.
              </p>
            </div>
          ) : null}

          {leverage ? (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-bold tracking-wide text-ink-3 uppercase">
                Maximum leverage
              </h3>
              <div className="overflow-x-auto rounded-sm border border-line">
                <table className="w-full min-w-[420px] border-collapse text-sm">
                  <caption className="sr-only">
                    {firm.name} maximum leverage by asset class
                  </caption>
                  <thead className="border-b border-line bg-page">
                    <tr>
                      <th scope="col" className={th}>Asset</th>
                      {leverage.programs.map((p) => (
                        <th key={p} scope="col" className={thNum}>
                          {LEVERAGE_PROGRAM_LABELS[p] ?? p}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leverage.rows.map((row) => (
                      <tr key={row.asset} className="border-b border-line last:border-0 odd:bg-page/40">
                        <th scope="row" className={`${td} text-left font-bold`}>
                          {LEVERAGE_ASSET_LABELS[row.asset] ?? row.asset}
                        </th>
                        {row.ratios.map((ratio, i) => (
                          <td key={i} className={tdNum}>
                            {ratio ?? '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 max-w-(--container-prose) text-xs leading-relaxed text-ink-2">
                Leverage caps your position size, so it decides which strategies fit this firm at
                all. Some firms reduce it once you are funded.
              </p>
            </div>
          ) : null}

          {commissions.length > 0 ? (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-bold tracking-wide text-ink-3 uppercase">
                Commissions
              </h3>
              <div className="overflow-x-auto rounded-sm border border-line">
                <table className="w-full min-w-[420px] border-collapse text-sm">
                  <caption className="sr-only">{firm.name} commissions by asset class</caption>
                  <thead className="border-b border-line bg-page">
                    <tr>
                      <th scope="col" className={th}>Asset</th>
                      <th scope="col" className={thNum}>Cost per trade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((c) => (
                      <tr key={c.id ?? c.asset} className="border-b border-line last:border-0 odd:bg-page/40">
                        <th scope="row" className={`${td} text-left font-bold`}>
                          {LEVERAGE_ASSET_LABELS[c.asset] ?? c.asset}
                        </th>
                        <td className={tdNum}>{c.cost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 max-w-(--container-prose) text-xs leading-relaxed text-ink-2">
                Commission is the recurring cost of trading here, charged on every lot whether the
                trade wins or loses. It matters most if you scalp or trade high volume.
              </p>
            </div>
          ) : null}
        </SectionCard>

        {/* ————— FAQ ————— */}
        <SectionCard
          id="faq"
          number={sectionNumber('faq')}
          kicker="FAQ"
          title={`${firm.name}: frequently asked questions`}
          intro="Short, direct answers to what traders ask most before buying a challenge here."
        >
          <div className="max-w-(--container-prose) divide-y divide-line">
            {faqs.map((f) => (
              <div key={f.question} className="py-4 first:pt-0 last:pb-0">
                <h3 className="mb-1.5 font-bold">{f.question}</h3>
                <p className="text-ink-2">{f.answer}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ————— Alternatives ————— */}
        <SectionCard
          id="alternatives"
          number={sectionNumber('alternatives')}
          kicker="Alternatives"
          title={`Alternatives to ${firm.name}`}
          intro="Top-rated firms traders compare against this one."
        >
          {compareAlts.length > 0 ? (
            <div className="mb-6 overflow-x-auto rounded-sm border border-line">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <caption className="sr-only">
                  {firm.name} compared with its top alternatives
                </caption>
                <thead className="border-b border-line bg-page">
                  <tr>
                    <th scope="col" className={th}>
                      Metric
                    </th>
                    {compareFirms.map((f) => (
                      <th
                        key={f.id}
                        scope="col"
                        className={`${th} ${f.id === firm.id ? 'bg-accent-pale/60 text-accent-dark' : ''}`}
                      >
                        {f.id === firm.id ? (
                          f.name
                        ) : (
                          <Link
                            href={`/prop-firms/${f.slug}`}
                            className="hover:text-accent-dark hover:underline"
                          >
                            {f.name}
                          </Link>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((row) => (
                    <tr key={row.label} className="border-b border-line last:border-0">
                      <th scope="row" className={`${td} text-left font-bold`}>
                        {row.label}
                      </th>
                      {compareFirms.map((f) => (
                        <td
                          key={f.id}
                          className={`${td} tabular-nums ${
                            f.id === firm.id ? 'bg-accent-pale/60 font-bold' : ''
                          }`}
                        >
                          {row.render(f)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
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

      <BackToTop />
    </div>
  )
}
