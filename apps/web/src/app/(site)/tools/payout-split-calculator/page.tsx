import type { Metadata } from 'next'
import { PayoutSplitForm } from './PayoutSplitForm'

export function generateMetadata(): Metadata {
  return {
    title: 'Free Prop Firm Payout Split Calculator (2026)',
    description:
      'Split a prop firm payout between you and the firm: profit split, fee refunds, and scaling tiers that improve your split after a number of payouts.',
  }
}

export default function PayoutSplitCalculatorPage() {
  return (
    <article>
      <p className="mb-2 text-xs font-bold tracking-widest text-accent uppercase">Free tool</p>
      <h1 className="mb-2 text-3xl font-black tracking-tight">Payout Split Calculator</h1>
      <p className="mb-6 max-w-(--container-prose) text-ink-2">
        See exactly how a payout divides between you and the firm, including fee refunds and
        scaling tiers that raise your split as you take more payouts.
      </p>

      <PayoutSplitForm />

      <section className="mt-10 max-w-(--container-prose)">
        <h2 className="mb-3 text-xl font-bold">How payout splits work</h2>
        <div className="space-y-3 text-ink-2">
          <p>
            When you withdraw profit from a funded account, the firm keeps a percentage and you
            keep the rest (the &ldquo;profit split&rdquo;). Advertised splits of 80% or 90% are the trader&rsquo;s
            share: on a $5,000 payout at 80%, you receive $4,000 and the firm keeps $1,000. Many
            firms also refund your original challenge fee, usually paid on top of your first
            payout, which this calculator adds to your take without touching the firm&rsquo;s share.
          </p>
          <p>
            Scaling matters more than most traders realize. A firm offering &ldquo;up to 100%&rdquo; typically
            starts you at 80%, then bumps the split after a set number of completed payouts: for
            example 90% after your third payout and 100% after your fifth. The tier applies to
            payouts that come <em>after</em> the threshold, so enter which payout number you&rsquo;re on
            and the calculator picks the split actually in force. Comparing firms on their
            first-payout split alone can flip the ranking once scaling is included.
          </p>
        </div>
      </section>

      <section className="mt-10 max-w-(--container-prose)">
        <h2 className="mb-3 text-xl font-bold">Frequently asked questions</h2>
        <div className="space-y-4">
          <div className="rounded-lg border border-line bg-card p-5">
            <h3 className="mb-1 font-bold">Is the profit split calculated before or after fees?</h3>
            <p className="text-ink-2">
              The split applies to the gross profit you&rsquo;re withdrawing. Fee refunds are paid on top
              of your share and don&rsquo;t reduce the firm&rsquo;s portion, so enter the refund separately and
              the calculator keeps the two amounts distinct.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-card p-5">
            <h3 className="mb-1 font-bold">When does a scaling tier actually kick in?</h3>
            <p className="text-ink-2">
              A tier like &ldquo;90% after 3 payouts&rdquo; applies from your fourth payout onward; the first
              three complete at the base split. That off-by-one is a common source of payout
              disputes, so this calculator uses the completed-payouts convention firms use.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-card p-5">
            <h3 className="mb-1 font-bold">Do I get my fee refund if I have no profit?</h3>
            <p className="text-ink-2">
              Generally no. Refunds are paid alongside a real payout, and a payout requires
              positive profit. If your gross profit is zero or negative, the calculator shows no
              payout and no refund, matching how firms actually process withdrawals.
            </p>
          </div>
        </div>
      </section>
    </article>
  )
}
