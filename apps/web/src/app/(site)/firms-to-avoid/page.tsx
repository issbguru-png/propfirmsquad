/**
 * /firms-to-avoid — the sourced register of prop firms that closed, changed
 * hands, or drew a regulator's attention.
 *
 * ── LEGAL FRAME (do not soften the guardrails below) ─────────────────────────
 * The query intent here is "firms to avoid", but the page we publish is
 * informational, not accusatory. Three rules hold it together:
 *
 *   1. Nothing renders without a source. `getRiskFirms()` drops any firm with
 *      no dated + sourced event, and `sourcedRiskEvents()` drops any individual
 *      event missing a date or URL. An unsourced claim cannot reach the page.
 *   2. We describe, we don't characterise. Statuses are categories tied to a
 *      documented event; allegations are attributed to the body that made them;
 *      resolutions (dismissals, relaunches, refund plans) sit in the same
 *      timeline as the original event, not buried.
 *   3. The intro states plainly what inclusion does NOT mean, and every entry
 *      carries a right-of-reply route.
 *
 * Outbound source links are rel="nofollow noopener" — we're citing them, not
 * endorsing them.
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { getRiskFirms } from '../_lib/data'
import { formatDate, monthYear } from '../_lib/format'
import { Badge, EmptyNote, FirmMark } from '../_lib/ui'
import {
  RISK_STATUS,
  RISK_STATUS_ORDER,
  type RiskStatus,
  riskStatusOf,
  sourceHost,
  sourcedRiskEvents,
} from '../_lib/risk'
import { JsonLd } from '@/lib/seo/json-ld'
import { breadcrumbLd, faqLd, type FaqItem } from '@/lib/seo/jsonld'
import { staticPageMeta } from '@/lib/seo/metadata'

export const dynamic = 'force-dynamic'

const PATH = '/firms-to-avoid'
const H1 = 'Prop Firms That Closed, Rebranded, or Faced Regulatory Action'

export function generateMetadata(): Metadata {
  return staticPageMeta(
    H1,
    PATH,
    'A sourced record of prop trading firms that shut down, wound down, changed hands, or were named in a regulator’s action — every entry dated and linked to a public source.',
  )
}

/** Genuinely useful answers — this is what earns the FAQ schema, not the other way round. */
const FAQ: FaqItem[] = [
  {
    question: 'What happens to my account if a prop firm shuts down?',
    answer:
      'It depends entirely on how the firm winds down, because a challenge fee is a payment for a service, not a deposit held in a segregated client account. In an orderly wind-down the firm publishes a plan: FundingTicks offered full refunds on evaluation accounts and paid realised profits on funded accounts, and Smart Prop Trader kept regular payout schedules running until its closing date. In a disorderly one, traders are left as unsecured creditors with no regulator to appeal to. If a firm is subject to a court-appointed receivership, there is usually a formal claims process with a hard deadline, and missing that deadline forfeits eligibility.',
  },
  {
    question: 'How can I tell if a prop firm is in trouble before it collapses?',
    answer:
      'The warning signs are behavioural and they usually appear in this order: payouts start taking longer than the advertised schedule, then support response times slip, then the firm changes rules in a way that applies to accounts already in progress — retroactive profit-split cuts, new minimum holding times, or raised targets. A sharp Trustpilot decline over weeks rather than a few angry reviews is a real signal. A messy platform migration is another: several 2024 failures traced back to a broken migration that destroyed account reconciliation. Treat any firm that pauses payouts pending an "internal audit" as a firm to stop adding money to.',
  },
  {
    question: 'Does a regulator suing a prop firm mean the firm did something wrong?',
    answer:
      'No. A complaint is an allegation, and it has to be proven. The clearest example in this industry is My Forex Funds: the CFTC filed a fraud complaint in August 2023 and froze the firm’s assets, but in May 2025 the court dismissed the case with prejudice, meaning it cannot be refiled, and sanctioned the CFTC over its conduct. The regulatory action was real and worth knowing about; the alleged wrongdoing was never established. That is why entries on this page record how a matter ended, not just how it started.',
  },
  {
    question: 'Is a prop firm rebranding or being acquired a bad sign?',
    answer:
      'Usually not. Rebrands and acquisitions are listed here so traders searching an old brand name can find out where it went, not as a warning. TopTier Trader became TX3 Funding in September 2025 and said existing accounts and challenge stages carried over unchanged, and OANDA moved its prop business into FTMO Group with refunds offered to clients who chose not to migrate. What matters in an acquisition is whether your existing account terms travel with you and whether you can opt out for a refund — both should be stated in writing by the firm.',
  },
]

export default async function FirmsToAvoidPage() {
  const firms = await getRiskFirms()

  // Group by status so the page reads top-down by severity.
  const groups = RISK_STATUS_ORDER.map((status) => ({
    status,
    meta: RISK_STATUS[status],
    firms: firms.filter((f) => riskStatusOf(f) === status),
  })).filter((g) => g.firms.length > 0)

  return (
    <div className="space-y-12">
      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Firms that closed or faced regulatory action', path: PATH },
        ])}
      />
      <JsonLd data={faqLd(FAQ)} />

      {/* Hero — states the intent AND the limits of the page in the same breath */}
      <section>
        <p className="mb-2 text-xs font-bold tracking-widest text-ink-3 uppercase">
          Updated {monthYear()}
        </p>
        <h1 className="mb-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">{H1}</h1>
        <p className="max-w-(--container-prose) text-lg text-ink-2">
          {firms.length > 0 ? (
            <>
              {firms.length} firms on this page each have a documented, dated public record: a
              regulator&apos;s filing, a court order, or the firm&apos;s own shutdown or
              acquisition announcement. Every claim below links to its source so you can check it
              yourself.
            </>
          ) : (
            <>
              This page records prop firms with a documented, dated public event: a regulator&apos;s
              filing, a court order, or the firm&apos;s own shutdown or acquisition announcement.
            </>
          )}
        </p>
      </section>

      {/* Inclusion criteria — and, load-bearing, what inclusion does NOT mean */}
      <section
        aria-labelledby="criteria-h"
        className="grid gap-4 md:grid-cols-2"
      >
        <div className="rounded-lg border border-line bg-card p-5 sm:p-6">
          <h2 id="criteria-h" className="mb-3 text-xl font-extrabold tracking-tight">
            What gets a firm listed here
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-ink-2">
            <li>A regulator or court filed a documented action naming the firm.</li>
            <li>The firm announced it had ceased trading or was winding down.</li>
            <li>The firm was acquired, absorbed, or relaunched under a different name.</li>
            <li>
              A documented disruption to trading or payouts that was reported at the time and can
              be linked to.
            </li>
          </ul>
          <p className="mt-3 text-sm text-ink-2">
            One thing is non-negotiable: <strong className="text-ink">no source, no entry.</strong>{' '}
            Complaints, rumours, and Discord screenshots do not qualify on their own.
          </p>
        </div>

        <div className="rounded-lg border border-line bg-card p-5 sm:p-6">
          <h2 className="mb-3 text-xl font-extrabold tracking-tight">
            What being listed does <em>not</em> mean
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-ink-2">
            <li>
              It is <strong className="text-ink">not</strong> an allegation of wrongdoing by us. We
              report what a regulator, court, or the firm itself said, and we attribute it.
            </li>
            <li>
              It is <strong className="text-ink">not</strong> a finding of guilt. A complaint is an
              allegation until a court decides otherwise, and sometimes the court decides the other
              way: one entry here was dismissed with prejudice.
            </li>
            <li>
              It is <strong className="text-ink">not</strong> a claim the firm is defunct.
              Acquired and rebranded firms are still trading, and some entries describe a
              disruption that has since been resolved.
            </li>
            <li>
              It is <strong className="text-ink">not</strong> permanent. Entries are updated as
              situations change.
            </li>
          </ul>
        </div>
      </section>

      {/* The register itself */}
      {firms.length === 0 ? (
        <EmptyNote>
          No entries are currently published. Entries appear here only once a dated, publicly
          verifiable source is on file.
        </EmptyNote>
      ) : (
        groups.map((group) => (
          <section key={group.status} aria-labelledby={`${group.status}-h`}>
            <div className="mb-4">
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <h2
                  id={`${group.status}-h`}
                  className="text-2xl font-extrabold tracking-tight"
                >
                  {group.meta.label}
                </h2>
                <Badge tone={group.meta.tone}>{group.firms.length}</Badge>
              </div>
              <p className="max-w-(--container-prose) text-sm text-ink-2">{group.meta.meaning}</p>
            </div>

            <ul className="grid gap-4 lg:grid-cols-2">
              {group.firms.map((firm) => (
                <li key={firm.id}>
                  <RiskCard
                    firm={firm}
                    status={group.status}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      {/* How we decide + right of reply */}
      <section
        aria-labelledby="how-h"
        className="rounded-lg border border-line bg-card p-6 sm:p-8"
      >
        <h2 id="how-h" className="mb-3 text-2xl font-extrabold tracking-tight">
          How we decide what goes on this page
        </h2>
        <div className="max-w-(--container-prose) space-y-3 text-ink-2">
          <p>
            An entry starts with a document, not an opinion. We need a regulator&apos;s press
            release or filing, a court order, or a dated announcement from the firm itself. We then
            write down what that document says, when it was published, and where to read it. If a
            matter later resolves — a case dismissed, a payout backlog cleared, a refund plan
            honoured — that update goes into the same timeline rather than a footnote, because the
            resolution is as much a part of the record as the original event.
          </p>
          <p>
            We do not list firms on the strength of complaint volume alone. Angry reviews are a
            signal worth tracking, and we track them on every firm profile as a Trustpilot trend,
            but they are not a documented event and they do not get a firm listed here. The same
            evidence standard that governs our rankings governs this page. Read the full{' '}
            <Link href="/methodology" className="font-semibold text-accent-dark underline">
              methodology
            </Link>
            .
          </p>
          <p className="rounded-sm border border-line bg-page p-4 text-sm">
            <strong className="text-ink">Right of reply.</strong> If you represent a firm listed
            here and something is inaccurate, out of date, or has since been resolved, write to{' '}
            <a
              href="mailto:corrections@propfirmsquad.com"
              className="font-semibold text-accent-dark underline"
            >
              corrections@propfirmsquad.com
            </a>{' '}
            with the supporting document. We re-verify within 48 hours and correct or remove the
            entry where the record supports it. Entries are updated whenever a situation changes.
          </p>
        </div>
      </section>

      {/* Where to go instead */}
      <section
        aria-labelledby="instead-h"
        className="rounded-lg bg-dark-section p-6 text-on-dark sm:p-8"
      >
        <h2 id="instead-h" className="mb-2 text-2xl font-extrabold tracking-tight">
          The firms we do recommend
        </h2>
        <p className="mb-5 max-w-(--container-prose) text-on-dark-2">
          The useful half of this question is not which firms to avoid but which ones have a track
          record worth trusting. Every firm we rank is scored on verified trader reviews, weekly
          Trustpilot trend tracking, audited rules, and dated payout evidence — never on
          commission.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/best/cfd-prop-firms"
            className="inline-block rounded-sm bg-accent px-5 py-2.5 font-bold text-nav transition-colors hover:bg-accent-light"
          >
            Best CFD / forex prop firms
          </Link>
          <Link
            href="/prop-firms"
            className="inline-block rounded-sm border border-on-dark-2/40 px-5 py-2.5 font-bold text-on-dark transition-colors hover:border-on-dark"
          >
            Browse the full directory
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-h">
        <h2 id="faq-h" className="mb-5 text-2xl font-extrabold tracking-tight">
          Questions traders ask
        </h2>
        <dl className="space-y-4">
          {FAQ.map((item) => (
            <div key={item.question} className="rounded-lg border border-line bg-card p-5">
              <dt className="mb-2 font-bold">{item.question}</dt>
              <dd className="max-w-(--container-prose) text-ink-2">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}

/* ── Entry card ───────────────────────────────────────────────────────────── */

function RiskCard({
  firm,
  status,
}: {
  firm: Awaited<ReturnType<typeof getRiskFirms>>[number]
  status: RiskStatus
}) {
  const meta = RISK_STATUS[status]
  const events = sourcedRiskEvents(firm)

  return (
    <article className="flex h-full flex-col rounded-lg border border-line bg-card p-5 sm:p-6">
      <header className="mb-3 flex items-start gap-3">
        <FirmMark firm={firm} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold">{firm.name}</h3>
          <div className="mt-1">
            <Badge tone={meta.tone}>{meta.label}</Badge>
          </div>
        </div>
      </header>

      {firm.riskSummary ? (
        <p className="mb-4 text-sm text-ink-2">{firm.riskSummary}</p>
      ) : null}

      {/* Dated timeline — every row carries its own source link */}
      <ol className="mb-4 space-y-3 border-l border-line pl-4">
        {events.map((e) => (
          <li key={`${e.date}-${e.sourceUrl}`} className="relative">
            <span
              aria-hidden
              className="absolute top-1.5 -left-[1.3125rem] h-2 w-2 rounded-full bg-ink-3"
            />
            <p className="text-xs font-bold tracking-wide text-ink-3 uppercase">
              <time dateTime={e.date}>{formatDate(e.date)}</time>
            </p>
            <p className="mt-0.5 text-sm text-ink-2">{e.event}</p>
            <a
              href={e.sourceUrl}
              target="_blank"
              rel="nofollow noopener"
              className="mt-1 inline-block text-xs font-semibold text-accent-dark underline"
            >
              Source: {sourceHost(e.sourceUrl)}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ol>

      <p className="mt-auto border-t border-line pt-3 text-xs text-ink-3">
        Last verified {formatDate(firm.lastVerifiedAt)}
      </p>
    </article>
  )
}
