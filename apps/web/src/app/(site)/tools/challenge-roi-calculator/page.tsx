import type { Metadata } from 'next'
import { ChallengeRoiForm } from './ChallengeRoiForm'

export function generateMetadata(): Metadata {
  return {
    title: 'Free Prop Firm Challenge ROI Calculator (2026)',
    description:
      'Work out whether a prop firm challenge is worth buying: cost per $1K of buying power, expected value of an attempt, and the pass rate you need to break even.',
  }
}

export default function ChallengeRoiCalculatorPage() {
  return (
    <article>
      <p className="mb-2 text-xs font-bold tracking-widest text-accent uppercase">Free tool</p>
      <h1 className="mb-2 text-3xl font-black tracking-tight">Challenge ROI Calculator</h1>
      <p className="mb-6 max-w-(--container-prose) text-ink-2">
        Treat a challenge purchase like the bet it is. Enter the price, the account size, and your
        honest assumptions to see the expected value and the pass rate you need to break even.
      </p>

      <ChallengeRoiForm />

      <section className="mt-10 max-w-(--container-prose)">
        <h2 className="mb-3 text-xl font-bold">How challenge ROI works</h2>
        <div className="space-y-3 text-ink-2">
          <p>
            A prop firm challenge is a paid audition: you risk the fee for a chance at trading the
            firm&rsquo;s capital. Whether that trade-off makes sense comes down to three numbers — the
            price, your realistic probability of passing, and what the funded account actually pays
            you per month (account size × average monthly return × your profit split).
          </p>
          <p>
            The expected value multiplies your pass rate by the payout you&rsquo;d collect over your
            assumed funded horizon, then subtracts the fee. The break-even pass rate flips the
            equation around: it&rsquo;s the probability of passing at which the attempt exactly pays for
            itself. If that number is far above realistic industry pass rates — often well under
            20% — the challenge is priced against you. This model deliberately keeps things simple:
            it ignores fee refunds, reset discounts, and the risk of blowing the funded account
            early, so treat the result as an upper bound on how attractive an attempt really is.
          </p>
        </div>
      </section>

      <section className="mt-10 max-w-(--container-prose)">
        <h2 className="mb-3 text-xl font-bold">Frequently asked questions</h2>
        <div className="space-y-4">
          <div className="rounded-lg border border-line bg-card p-5">
            <h3 className="mb-1 font-bold">What is a realistic pass rate to assume?</h3>
            <p className="text-ink-2">
              Published and leaked figures across the industry generally put pass rates below 20%,
              and first-attempt rates lower still. If you have no track record on the firm&rsquo;s exact
              rules, assuming 10–15% is more honest than assuming you&rsquo;re the exception.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-card p-5">
            <h3 className="mb-1 font-bold">Why is cost per $1K of buying power useful?</h3>
            <p className="text-ink-2">
              It normalizes prices across account sizes and firms. A $499 fee on a $100K account is
              $4.99 per $1K; a $199 fee on a $25K account is $7.96 per $1K — the &ldquo;cheaper&rdquo;
              challenge is actually the more expensive capital.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-card p-5">
            <h3 className="mb-1 font-bold">Does the calculator account for fee refunds?</h3>
            <p className="text-ink-2">
              No — deliberately. Refunds usually arrive only with your first payout, which already
              requires passing and trading profitably. Leaving them out keeps the expected value
              conservative; if your firm refunds fees, your true EV is slightly better than shown.
            </p>
          </div>
        </div>
      </section>
    </article>
  )
}
