import type { Metadata } from 'next'
import { ProfitTargetForm } from './ProfitTargetForm'

export function generateMetadata(): Metadata {
  return {
    title: 'Free Prop Firm Profit Target Calculator (2026)',
    description:
      'Convert prop firm evaluation targets into dollars: profit required per phase, the balance that passes each phase, and your overall progress toward funding.',
  }
}

export default function ProfitTargetCalculatorPage() {
  return (
    <article>
      <p className="mb-2 text-xs font-bold tracking-widest text-accent uppercase">Free tool</p>
      <h1 className="mb-2 text-3xl font-black tracking-tight">Profit Target Calculator</h1>
      <p className="mb-6 max-w-(--container-prose) text-ink-2">
        Turn percentage targets into concrete dollar amounts for every evaluation phase, and track
        exactly how far you are from a funded account.
      </p>

      <ProfitTargetForm />

      <section className="mt-10 max-w-(--container-prose)">
        <h2 className="mb-3 text-xl font-bold">How profit targets work</h2>
        <div className="space-y-3 text-ink-2">
          <p>
            Prop firm evaluations set a profit target per phase, expressed as a percentage of the
            account size. A classic two-step challenge asks for 8% in Phase 1 and 5% in Phase 2: on
            a $100,000 account that means growing the balance to $108,000, then — after the account
            resets to $100,000 for the next phase — reaching $105,000. Each phase starts fresh from
            the nominal account size, which is why the second target is calculated from $100,000,
            not from your Phase 1 finishing balance.
          </p>
          <p>
            Thinking in dollars instead of percentages changes how the target feels. An 8% target
            is $8,000 of profit, and with a typical 5% daily-loss rule you cannot simply swing for
            it in one trade without risking a breach. This calculator shows the profit required and
            remaining for each phase, plus an overall progress figure weighted by each phase&rsquo;s
            dollar target — losses count as zero progress rather than negative, since a drawn-down
            account still owes the full target.
          </p>
        </div>
      </section>

      <section className="mt-10 max-w-(--container-prose)">
        <h2 className="mb-3 text-xl font-bold">Frequently asked questions</h2>
        <div className="space-y-4">
          <div className="rounded-lg border border-line bg-card p-5">
            <h3 className="mb-1 font-bold">Is the Phase 2 target based on my Phase 1 profits?</h3>
            <p className="text-ink-2">
              No. Each phase resets to the nominal account size, so a 5% Phase 2 target on a $100K
              account is always $5,000 — regardless of how far past the Phase 1 target you finished.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-card p-5">
            <h3 className="mb-1 font-bold">Do funded accounts have profit targets?</h3>
            <p className="text-ink-2">
              Usually not — once funded, you trade for payouts rather than targets, though some
              firms set a small buffer you must build before your first withdrawal. You can model a
              funded account here by adding a phase with a 0% target.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-card p-5">
            <h3 className="mb-1 font-bold">What does the overall progress percentage mean?</h3>
            <p className="text-ink-2">
              It weights every phase by its dollar target and divides the profit you&rsquo;ve banked
              toward those targets by the combined total. Overshooting a phase caps at 100% for that
              phase, and losing phases count as 0%, so the figure never overstates your position.
            </p>
          </div>
        </div>
      </section>
    </article>
  )
}
