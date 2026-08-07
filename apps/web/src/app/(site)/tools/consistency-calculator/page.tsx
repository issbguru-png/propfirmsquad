import type { Metadata } from 'next'
import { ConsistencyForm } from './ConsistencyForm'

export function generateMetadata(): Metadata {
  return {
    title: 'Free Prop Firm Consistency Rule Calculator (2026)',
    description:
      'Check whether your trading days pass a prop firm consistency rule and see exactly how much more profit you need to bring your best day under the limit.',
  }
}

export default function ConsistencyCalculatorPage() {
  return (
    <article>
      <p className="mb-2 text-xs font-bold tracking-widest text-accent uppercase">Free tool</p>
      <h1 className="mb-2 text-3xl font-black tracking-tight">Consistency Rule Calculator</h1>
      <p className="mb-6 max-w-(--container-prose) text-ink-2">
        Paste your daily profits, set the firm&rsquo;s limit, and instantly see whether your best day
        breaks the consistency rule — and how much more you need to make to fix it.
      </p>

      <ConsistencyForm />

      <section className="mt-10 max-w-(--container-prose)">
        <h2 className="mb-3 text-xl font-bold">How the consistency rule works</h2>
        <div className="space-y-3 text-ink-2">
          <p>
            Most prop firms define consistency the same way: no single trading day&rsquo;s profit may
            account for more than a fixed percentage — commonly 20%, 30%, or 40% — of your total
            profit at the time you request a payout or attempt to pass an evaluation. The rule
            exists to filter out traders who hit their target with one oversized, lucky trade
            rather than a repeatable process.
          </p>
          <p>
            The math is simple: divide your best day by your total profit. If a $900 day sits
            inside $1,000 of total profit, that day is 90% of the total and fails a 30% rule badly.
            Importantly, you usually don&rsquo;t need to lose the &ldquo;bad&rdquo; day — you need to keep trading
            until the total grows enough that the big day shrinks below the limit. This calculator
            solves that equation for you: it reports the exact additional profit required, spread
            across other days, to bring your best day under the firm&rsquo;s threshold.
          </p>
        </div>
      </section>

      <section className="mt-10 max-w-(--container-prose)">
        <h2 className="mb-3 text-xl font-bold">Frequently asked questions</h2>
        <div className="space-y-4">
          <div className="rounded-lg border border-line bg-card p-5">
            <h3 className="mb-1 font-bold">Do losing days count toward the consistency rule?</h3>
            <p className="text-ink-2">
              Losing days reduce your total profit, which makes your best day a larger share of the
              total — so losses actually make the rule harder to pass. Enter losses as negative
              numbers and the calculator handles them correctly.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-card p-5">
            <h3 className="mb-1 font-bold">What happens if I break the consistency rule?</h3>
            <p className="text-ink-2">
              At most firms nothing is lost permanently: your payout or pass is simply delayed
              until your profit distribution evens out. A minority of firms treat it as a hard
              breach, so always check the specific firm&rsquo;s rules on our profile pages.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-card p-5">
            <h3 className="mb-1 font-bold">Is exactly hitting the limit a pass or a fail?</h3>
            <p className="text-ink-2">
              A best day exactly at the limit (say 30.00% under a 30% rule) passes. Firms enforce
              the rule as &ldquo;no day may exceed X%&rdquo;, and this calculator uses the same convention.
            </p>
          </div>
        </div>
      </section>
    </article>
  )
}
