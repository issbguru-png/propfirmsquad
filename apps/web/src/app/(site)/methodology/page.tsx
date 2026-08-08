import Link from 'next/link'
import type { Metadata } from 'next'
import { staticPageMeta } from '@/lib/seo/metadata'
import { breadcrumbLd, faqLd, personLd, type FaqItem } from '@/lib/seo/jsonld'
import { JsonLd } from '@/lib/seo/json-ld'
import { SCORE_LABELS, type ScoreKey } from '../_lib/profile'
import { Commitment, MethodologySection } from './Section'

export const metadata: Metadata = staticPageMeta(
  'How We Rate Prop Firms: Our Review Methodology',
  '/methodology',
  'The full PropFirmSquad review methodology: who scores each prop firm, the five subscores and how they average, the exact ranking sort, where the data comes from, and what affiliate commissions do and do not change.',
)

/** Sections, in order. Drives both the contents list and the numbered kickers. */
const SECTIONS = [
  { id: 'reviewer', kicker: 'Who reviews', title: 'One named person scores every firm' },
  { id: 'scoring', kicker: 'The scoring model', title: 'Five subscores, and the arithmetic between them' },
  { id: 'ranking', kicker: 'Ranking', title: 'How firms are ordered in a list' },
  { id: 'sources', kicker: 'Sources', title: 'Where the data comes from' },
  { id: 'freshness', kicker: 'Freshness', title: 'How often it is re-checked' },
  { id: 'money', kicker: 'How we are paid', title: 'Commercial relationships, in plain English' },
  { id: 'gate', kicker: 'Publishing gate', title: 'Thin pages do not go to search engines' },
  { id: 'corrections', kicker: 'Corrections', title: 'Corrections and right of reply' },
  { id: 'never', kicker: 'Hard limits', title: 'What we will not do' },
  { id: 'audit', kicker: 'Audit us', title: 'How to check any of this yourself' },
  { id: 'faq', kicker: 'FAQ', title: 'Questions about how we rate firms' },
] as const

/** What evidence feeds each editorial subscore. Keyed to the code that renders them. */
const SUBSCORE_EVIDENCE: Record<ScoreKey, string> = {
  pricingValue:
    'Published challenge prices at every account size, what the fee actually buys, refund terms, and any staged or conditional fee (recorded as a numbered footnote under the price table).',
  rulesFairness:
    'Drawdown type, consistency rule, news-trading and EA policy, minimum trading days, and time limits, read from the firm’s own rulebook and help centre rather than its landing page.',
  payoutReliability:
    'Stated profit split, payout frequency and methods, plus what traders report about how long a payout actually took and whether requests were refused.',
  support:
    'Which channels exist, what the firm publicly commits to on response time, and what reviewers say happened when something went wrong.',
  platforms:
    'Which trading platforms and broker or liquidity arrangements the firm genuinely runs on, and what that means for spreads, execution, and tooling.',
}

const FAQS: FaqItem[] = [
  {
    question: 'Do you use secret weights in your prop firm scoring?',
    answer:
      'No. The overall editorial score is the plain arithmetic mean of the subscores set for that firm, rounded to one decimal place. There are no weights, no multipliers and no hidden adjustments. Every subscore is printed next to the total on the firm profile, so you can average them yourself and check that our number matches.',
  },
  {
    question: 'Can a prop firm pay to rank higher on PropFirmSquad?',
    answer:
      'No. List order is decided by the trader rating first, then by the number of reviews, then by Trustpilot score, with unrated firms always placed last. There is no commercial field anywhere in that sort. Affiliate commissions pay for the research time and change nothing about scores, order, or what we publish about a firm.',
  },
  {
    question: 'What is the difference between the trader rating and the editorial score?',
    answer:
      'They are two separate numbers, both on a 0 to 5 scale, and they are shown side by side rather than blended. The trader rating reflects what traders report about a firm. The editorial score is our own assessment across pricing and value, rules fairness, payout reliability, support, and platforms. A firm can score well on one and badly on the other, and that gap is usually the most useful thing on the page.',
  },
  {
    question: 'What happens when you cannot verify a piece of prop firm data?',
    answer:
      'The field is left empty and the page prints "Being verified" instead of a number. We do not estimate, and we do not copy an unconfirmed figure from another comparison site. For the risk register the rule is stricter: an entry with no dated, publicly linkable source is dropped before it can render, and the script that seeds those entries throws an error rather than writing one.',
  },
  {
    question: 'Who actually writes and scores the reviews?',
    answer:
      'Ayub Rana, a Chartered Accountant and full-time forex trader since 2018. He sets every subscore and writes every verdict, and his name is printed on the score panel of each scored firm profile alongside a link to this page.',
  },
]

const NEVER_LIST = [
  'Sell placement in a ranking, a "best of" list, or a comparison table, in any form, at any price.',
  'Buy, incentivise, or write trader reviews. Reviews submitted here sit at pending until a human approves them, and only approved ones are readable through the public API.',
  'Fabricate a number. An unconfirmed field stays empty and renders "Being verified" rather than being filled with a plausible guess.',
  'Manufacture urgency on a coupon page. No invented countdowns, no "only three left" counters. Where a firm states a real end date, we print that date and nothing more.',
  'Hide a promo code behind an email signup. Codes are in the page HTML on first paint, selectable by hand, with the copy button as a convenience rather than the only way through.',
  'Publish a status claim about a named company without a dated source a reader can open.',
  'Delete a sourced fact or an unflattering review because the firm asked us to.',
]

export default function MethodologyPage() {
  const n = (id: (typeof SECTIONS)[number]['id']) => SECTIONS.findIndex((s) => s.id === id) + 1
  const meta = (id: (typeof SECTIONS)[number]['id']) => {
    const s = SECTIONS.find((x) => x.id === id)!
    return { id: s.id, number: n(id), kicker: s.kicker, title: s.title }
  }

  return (
    <article className="max-w-(--container-prose)">
      <JsonLd data={faqLd(FAQS)} />
      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'Methodology', path: '/methodology' },
        ])}
      />
      {/* organizationLd is already emitted site-wide by the (site) layout. */}
      <JsonLd data={personLd()} />

      <header>
        <p className="mb-2 text-xs font-bold tracking-[0.14em] text-accent uppercase">
          Review methodology
        </p>
        <h1 className="mb-4 text-4xl font-black tracking-tight sm:text-5xl">
          How we rate prop firms
        </h1>
        <p className="text-lg leading-relaxed text-ink-2">
          One named person scores every firm on this site. The score is a published piece of
          arithmetic you can redo in your head. The order of a list is decided by a sort with no
          commercial input in it. This page sets out the whole process, including the parts that are
          still done by hand and the parts we cannot yet prove to you.
        </p>
      </header>

      {/* At-a-glance facts. Every row is something the reader can go and check. */}
      <dl className="mt-8 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
        {[
          ['Who scores', 'Ayub Rana, Chartered Accountant and forex trader since 2018'],
          ['Scale', '0 to 5, on both the trader rating and the editorial score'],
          ['Formula', 'Plain average of five subscores, no weights, all published'],
          ['Paid placement', 'Not sold, at any price'],
        ].map(([label, value]) => (
          <div key={label} className="bg-card px-5 py-4">
            <dt className="mb-1 text-[11px] font-bold tracking-wide text-ink-3 uppercase">
              {label}
            </dt>
            <dd className="text-sm leading-snug font-semibold text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      {/* On-page contents: eleven sections is too many to scroll blind. */}
      <nav aria-labelledby="contents-h" className="mt-8 rounded-lg border border-line bg-card p-5">
        <h2 id="contents-h" className="mb-3 text-xs font-bold tracking-wide text-ink-3 uppercase">
          On this page
        </h2>
        <ol className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          {SECTIONS.map((s, i) => (
            <li key={s.id} className="flex gap-2">
              <span aria-hidden className="tabular-nums text-ink-3">
                {String(i + 1).padStart(2, '0')}
              </span>
              <a href={`#${s.id}`} className="font-semibold text-accent-dark hover:underline">
                {s.kicker}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-12 space-y-12 leading-relaxed">
        {/* ————— 01 Who reviews ————— */}
        <MethodologySection {...meta('reviewer')}>
          <p>
            Every verdict, every subscore, and every rule audit on this site is the work of{' '}
            <a href="/#author-h" className="font-semibold text-accent-dark underline">
              Ayub Rana
            </a>
            , a Chartered Accountant and full-time forex trader since 2018. The accountancy training
            is the reason the pricing sections on this site read the way they do: a challenge fee is
            a contract with a refund clause, and it deserves to be read like one.
          </p>
          <p>
            His name is printed on the score panel of every profile we have scored, next to a link
            back to this page. That is deliberate. If you think a score is wrong, there is a
            specific person to say so to, rather than a brand.
          </p>
          <Commitment>
            No review on this site is anonymous, syndicated, or assembled from a firm&apos;s own
            press material.
          </Commitment>
        </MethodologySection>

        {/* ————— 02 Scoring model ————— */}
        <MethodologySection {...meta('scoring')}>
          <p>
            Two different numbers appear on a firm profile, both on a 0 to 5 scale. They are never
            merged, because they answer different questions.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">
                The two 0 to 5 scores shown on a firm profile and what each one measures
              </caption>
              <tbody>
                <tr className="border-b border-line align-top">
                  <th scope="row" className="w-40 py-3 pr-4 text-left font-bold text-ink">
                    Trader rating
                  </th>
                  <td className="py-3">
                    What traders report about the firm, shown with the review count beside it.
                    Reviews submitted on this site are held at pending until a human approves them,
                    and the public API only ever returns approved ones.
                  </td>
                </tr>
                <tr className="align-top">
                  <th scope="row" className="w-40 py-3 pr-4 text-left font-bold text-ink">
                    Editorial score
                  </th>
                  <td className="py-3">
                    Our own assessment, built from the five subscores below. This is the number this
                    section is about.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="pt-2 text-lg font-bold text-ink">The five subscores</h3>
          <p>Each is set on the same 0 to 5 scale, against this evidence:</p>
          <dl className="space-y-4">
            {(Object.keys(SCORE_LABELS) as ScoreKey[]).map((key) => (
              <div key={key} className="border-l-2 border-line pl-4">
                <dt className="font-bold text-ink">{SCORE_LABELS[key]}</dt>
                <dd className="mt-1 text-sm">{SUBSCORE_EVIDENCE[key]}</dd>
              </div>
            ))}
          </dl>

          <h3 className="pt-2 text-lg font-bold text-ink">How they combine</h3>
          <Commitment>
            The overall editorial score is the plain arithmetic mean of the subscores set for that
            firm, rounded to one decimal place. There are no weights.
          </Commitment>
          <p>
            That is the entire formula. It is worth saying plainly, because the convention in this
            niche is to imply a proprietary model and then decline to publish it. There is nothing
            here to withhold: a firm on 4.5, 4.0, 4.0, 3.5 and 4.5 scores 4.1, and you can check
            that on the page.
          </p>
          <p>
            Two honest caveats. First, a subscore that has not been set yet is left out of the
            average rather than counted as zero, so a firm with three subscores is averaged over
            three. The profile prints exactly which subscores exist, so you can always see what the
            average was taken over. Second, the arithmetic is transparent but the inputs are
            judgements. A person reads the rulebook and decides that a trailing intraday drawdown
            with a 40 percent consistency rule is a 2.5 rather than a 3. We publish the reasoning in
            the verdict so you can disagree with it specifically.
          </p>
        </MethodologySection>

        {/* ————— 03 Ranking ————— */}
        <MethodologySection {...meta('ranking')}>
          <p>
            The order of firms on the{' '}
            <Link href="/" className="font-semibold text-accent-dark underline">
              homepage
            </Link>
            , in the{' '}
            <Link href="/prop-firms" className="font-semibold text-accent-dark underline">
              directory
            </Link>
            , and on the{' '}
            <Link href="/best" className="font-semibold text-accent-dark underline">
              best-of lists
            </Link>{' '}
            is not the editorial score. It is a fixed four-step sort:
          </p>
          <ol className="space-y-3 border-l-2 border-accent/30 pl-5">
            {[
              ['Trader rating, highest first.', 'The firm traders rate best goes to the top.'],
              [
                'Firms with no trader rating yet sort last, always.',
                'A new or thinly reviewed firm never floats to the top of a list on the strength of missing data. It sits at the bottom until traders have rated it, however good its pricing looks.',
              ],
              ['Ties broken by review count, highest first.', 'A 4.6 from 900 traders outranks a 4.6 from nine.'],
              [
                'Still tied, broken by Trustpilot score.',
                'The last resort, so the order is deterministic rather than arbitrary.',
              ],
            ].map(([head, body], i) => (
              <li key={head} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-accent-pale text-[11px] font-bold tabular-nums text-accent-dark"
                >
                  {i + 1}
                </span>
                <span>
                  <strong className="text-ink">{head}</strong> {body}
                </span>
              </li>
            ))}
          </ol>
          <p>
            That is the whole sort. There is no promotion slot, no manual pinning, no boost for a
            firm that pays us more, and no field in the sort that has anything to do with money.
          </p>
          <p>
            One exclusion worth naming: firms recorded on the{' '}
            <Link href="/#risk-h" className="font-semibold text-accent-dark underline">
              risk register
            </Link>{' '}
            never enter a ranking. The listing query is an allow-list rather than a block-list, so a
            firm has to be explicitly marked as listed to appear at all. A closed or rebranded firm
            cannot leak back into a top-ten by accident.
          </p>
        </MethodologySection>

        {/* ————— 04 Sources ————— */}
        <MethodologySection {...meta('sources')}>
          <p>Data is taken in this order of preference:</p>
          <ol className="ml-5 list-decimal space-y-2 marker:font-bold marker:text-accent-dark">
            <li>
              <strong className="text-ink">The firm&apos;s own site, help centre, and terms.</strong>{' '}
              Not the landing page: the rules article, the withdrawal article, the FAQ entry that
              contradicts the landing page.
            </li>
            <li>
              <strong className="text-ink">Primary documents.</strong> Regulator filings, court
              records, and the firm&apos;s own announcements, for anything about a firm&apos;s
              status or history.
            </li>
            <li>
              <strong className="text-ink">Third-party reporting, with corroboration.</strong> Used
              only when the firm has published nothing, and flagged as unconfirmed until it is
              matched at source.
            </li>
          </ol>
          <p>
            The source URLs used for each firm are recorded alongside its data, and a field that
            came only from a third party is tagged as needing verification at source before it is
            treated as settled.
          </p>
          <Commitment>
            A field we cannot confirm stays empty. Empty fields render as &quot;Being
            verified&quot; on the profile, never as a guess and never as a dash you might read as a
            zero.
          </Commitment>
          <p>
            You will see &quot;Being verified&quot; on live pages. It is not an oversight, it is the
            rule working. A comparison table with no gaps in it, covering an industry where firms
            routinely leave their own rules undocumented, is a table with invented numbers in it.
          </p>

          <h3 className="pt-2 text-lg font-bold text-ink">The risk register is stricter still</h3>
          <p>
            The register of firms that closed, changed hands, or drew regulatory action carries a
            harder rule, because naming a company in that context is a serious thing to do. Every
            entry needs at least one event with both a date and a public source URL. The code drops
            any firm and any individual event that lacks either before the page renders, and the
            script that seeds the register throws an error rather than writing an unsourced entry.
            The wording states what happened and when, without characterising it, and where a case
            was later dismissed that goes in the same timeline.
          </p>
        </MethodologySection>

        {/* ————— 05 Freshness ————— */}
        <MethodologySection {...meta('freshness')}>
          <p>
            Every firm record carries a last-verified date, and it is printed on the firm&apos;s own
            page rather than buried here. Prop firm rules change quietly and often, so a comparison
            without a date on it is not much use.
          </p>
          <p>
            Being precise about what that date means: it is stamped automatically every time we save
            the record. So it tells you when we last worked on that firm, not that every individual
            field on the page was independently re-confirmed at that moment. We would rather explain
            that than let you assume something stronger.
          </p>
          <p>A record gets re-checked when any of these happen:</p>
          <ul className="ml-5 list-disc space-y-1.5">
            <li>A firm announces a pricing or rule change.</li>
            <li>A reader or a firm reports a discrepancy.</li>
            <li>We work through the directory on our own sweep.</li>
            <li>A firm appears in reporting that suggests its situation has changed.</li>
          </ul>
          <p>
            Rule changes are not silently overwritten. Each one is logged with its own date on the
            firm&apos;s profile, so the previous position stays visible and you can see what moved.
          </p>
        </MethodologySection>

        {/* ————— 06 Money ————— */}
        <MethodologySection {...meta('money')}>
          <p>
            Some outbound links on this site are affiliate links. If you buy a challenge after
            following one, the firm may pay us a commission, at no extra cost to you. That is how
            the research is funded. There is no paywall and no subscription.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">
                What affiliate commission funds and what it has no influence over
              </caption>
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="w-1/2 py-2 pr-4 text-left font-bold text-ink">
                    Commission pays for
                  </th>
                  <th scope="col" className="py-2 text-left font-bold text-ink">
                    Commission does not touch
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="align-top">
                  <td className="py-3 pr-4">
                    <ul className="ml-4 list-disc space-y-1.5">
                      <li>The hours spent reading rulebooks and help centres</li>
                      <li>Tracking price and rule changes across firms</li>
                      <li>Hosting, and keeping the whole site free to read</li>
                    </ul>
                  </td>
                  <td className="py-3">
                    <ul className="ml-4 list-disc space-y-1.5">
                      <li>Any subscore, or the editorial score built from them</li>
                      <li>The position of a firm in any list (see section 03)</li>
                      <li>Which firms get covered at all</li>
                      <li>What we publish about a firm, including what it would rather we did not</li>
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Not every firm on this site has a commercial relationship with us, and the ones that do
            not are sorted by exactly the same four steps as the ones that do. There is no field in
            that sort for commission, so the separation is structural rather than a promise about
            our own restraint.
          </p>
          <Commitment>
            If a firm offered to pay for a higher position, a softer verdict, or the removal of a
            fact, the answer would be no, and the request itself would go on that firm&apos;s
            profile as something worth knowing about it.
          </Commitment>
        </MethodologySection>

        {/* ————— 07 Publishing gate ————— */}
        <MethodologySection {...meta('gate')}>
          <p>
            A firm page does not go to search engines until it is worth reading. Concretely: a
            profile is forced to noindex unless it carries a written verdict and at least one live
            challenge with pricing, and we require a rules summary on top of that before opting a
            page in.
          </p>
          <p>
            This runs as a check in the publishing pipeline rather than as a good intention. It can
            only ever turn indexing off, never on, so no automated process can promote a thin page
            into search. Turning it on is a deliberate act by a person once the page clears the bar.
            If the check itself errors, it fails closed and the page stays noindex.
          </p>
          <p>
            The practical effect is that we cover fewer firms than the directories that list several
            hundred. Most of those listings are a logo, a price, and an affiliate button. We would
            rather have a smaller directory that is worth the click.
          </p>
        </MethodologySection>

        {/* ————— 08 Corrections ————— */}
        <MethodologySection {...meta('corrections')}>
          <p>
            If something here is wrong, we want to know, whether you are a trader who just checked a
            price at the firm&apos;s own checkout or the firm itself. Tell us what is wrong and
            where we should look to confirm it. For now the route is the contact details on the{' '}
            <Link href="/about" className="font-semibold text-accent-dark underline">
              about page
            </Link>
            ; a dedicated contact form is in progress and this line will change when it lands.
          </p>
          <p>What happens next:</p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong className="text-ink">If the source shows we are wrong</strong>, we correct it
              and the record&apos;s verified date moves with the edit.
            </li>
            <li>
              <strong className="text-ink">If a firm has changed a rule</strong>, the change is
              logged with its date on the profile rather than quietly swapped in, so the old
              position stays on the record.
            </li>
            <li>
              <strong className="text-ink">If a firm disputes a risk-register entry</strong>, send
              us the dated public document and we will add it to the same timeline. We do not delete
              a sourced entry because a firm objects to it. We publish what happened next, including
              a dismissal, a settlement, or a resumption of payouts.
            </li>
            <li>
              <strong className="text-ink">If a situation has moved on</strong>, the entry is
              updated rather than left to rot. A firm that closed and reopened, or was acquired,
              gets that recorded too.
            </li>
          </ul>
        </MethodologySection>

        {/* ————— 09 Never ————— */}
        <MethodologySection {...meta('never')}>
          <p>
            A short list, so you can hold us to it. These are not aspirations, they are the things
            we have decided in advance that we do not do.
          </p>
          <ul className="space-y-2.5">
            {NEVER_LIST.map((item) => (
              <li key={item} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-3"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </MethodologySection>

        {/* ————— 10 Audit ————— */}
        <MethodologySection {...meta('audit')}>
          <p>
            A methodology you cannot check is marketing. Everything above is written so that you can
            test it against the pages themselves. Six specific things to try:
          </p>
          <ol className="ml-5 list-decimal space-y-3 marker:font-bold marker:text-accent-dark">
            <li>
              <strong className="text-ink">Redo our arithmetic.</strong> Open any{' '}
              <Link href="/prop-firms" className="font-semibold text-accent-dark underline">
                firm profile
              </Link>
              . The subscores are printed beside the overall editorial score. Average them. You
              should get the number we printed.
            </li>
            <li>
              <strong className="text-ink">Check the dates.</strong> Every profile shows its own
              last-verified date. If a page looks stale, the date will say so rather than hide it.
            </li>
            <li>
              <strong className="text-ink">Click the risk-register sources.</strong> Every entry on
              the{' '}
              <Link href="/#risk-h" className="font-semibold text-accent-dark underline">
                register
              </Link>{' '}
              links the primary document, with the source host shown next to it. If a link does not
              support the claim, that is a correction and we want it.
            </li>
            <li>
              <strong className="text-ink">Read the fine print under a price table.</strong> Where a
              fee is staged or conditional, there is a numbered footnote under the table explaining
              the catch. Compare it against the firm&apos;s checkout.
            </li>
            <li>
              <strong className="text-ink">Look for the gaps.</strong> Find a &quot;Being
              verified&quot; cell on a profile. A comparison table with no gaps in this industry is a
              table with guesses in it.
            </li>
            <li>
              <strong className="text-ink">Test a coupon page.</strong> Go to{' '}
              <Link href="/deals" className="font-semibold text-accent-dark underline">
                deals
              </Link>{' '}
              and check for a countdown timer or an email gate on a code. There should not be one.
            </li>
          </ol>
          <p>
            Claims that can be checked are worth more than claims that are asserted. If one of these
            checks fails, that is a real error on our side, and section 08 is how you tell us.
          </p>
        </MethodologySection>

        {/* ————— 11 FAQ ————— */}
        <MethodologySection {...meta('faq')}>
          <dl className="space-y-6">
            {FAQS.map((f) => (
              <div key={f.question}>
                <dt className="mb-1.5 font-bold text-ink">{f.question}</dt>
                <dd className="text-ink-2">{f.answer}</dd>
              </div>
            ))}
          </dl>
        </MethodologySection>
      </div>

      <footer className="mt-12 rounded-lg border border-line bg-card p-6">
        <p className="text-ink-2">
          This page describes what the site actually does today, and it will change as the process
          does. For who is behind it, see{' '}
          <Link href="/about" className="font-semibold text-accent-dark underline">
            about PropFirmSquad
          </Link>
          . To see the method applied, start with the{' '}
          <Link href="/prop-firms" className="font-semibold text-accent-dark underline">
            firm directory
          </Link>
          .
        </p>
      </footer>
    </article>
  )
}
