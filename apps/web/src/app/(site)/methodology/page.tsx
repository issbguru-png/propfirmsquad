import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'How We Rate Prop Firms — Methodology',
  description:
    'How PropFirmSquad scores prop trading firms: verified reviews, tracked Trustpilot trends, rule audits, and dated payout proofs — and how affiliate links are handled.',
  alternates: { canonical: '/methodology' },
}

export default function MethodologyPage() {
  return (
    <article className="max-w-(--container-prose)">
      <h1 className="mb-4 text-4xl font-black tracking-tight">How we rate prop firms</h1>
      <p className="mb-8 text-lg text-ink-2">
        Short version: we rank on evidence, we publish the data we rank on, and commissions never
        touch the score.
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="mb-2 text-2xl font-extrabold">What goes into a score</h2>
          <ul className="list-disc space-y-2 pl-5 text-ink-2">
            <li>
              <strong className="text-ink">Trader reviews</strong> — submitted on our platform,
              moderated for authenticity before they count.
            </li>
            <li>
              <strong className="text-ink">Trustpilot trend</strong> — we record each firm&apos;s
              Trustpilot score weekly, so a firm coasting on old ratings can&apos;t hide a decline.
            </li>
            <li>
              <strong className="text-ink">Rule fairness</strong> — drawdown type, consistency
              rules, news-trading and EA policy, audited from the firm&apos;s own documents and
              re-checked when they change. Every change lands in the firm&apos;s rule-change log.
            </li>
            <li>
              <strong className="text-ink">Payout evidence</strong> — dated community payout proofs,
              which we aggregate into real payout-speed data instead of trusting advertised claims.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-2xl font-extrabold">What we do differently</h2>
          <p className="mb-3 text-ink-2">
            Data on a profile carries a <em>last verified</em> date. If we can&apos;t verify
            something, the page says &quot;being verified&quot; instead of guessing. Firms with
            credible non-payment reports get flagged <strong className="text-ink">under review</strong>{' '}
            at the top of their profile until resolved.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-2xl font-extrabold">Affiliate disclosure</h2>
          <p className="text-ink-2">
            Some links are affiliate links and may earn us a commission at no cost to you. Rankings,
            scores, and under-review flags are produced independently of commercial relationships —
            a firm cannot pay to move up, and we list firms that pay us nothing.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-2xl font-extrabold">Corrections</h2>
          <p className="text-ink-2">
            Spotted an outdated price or a wrong rule? Tell us and we&apos;ll re-verify within 48
            hours. This page and our process will keep evolving as the site grows — see{' '}
            <Link href="/about" className="font-semibold text-accent-dark underline">
              about us
            </Link>{' '}
            for who runs this.
          </p>
        </section>
      </div>
    </article>
  )
}
