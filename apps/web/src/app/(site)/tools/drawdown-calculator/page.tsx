import type { Metadata } from 'next'
import { DrawdownForm } from './DrawdownForm'

export function generateMetadata(): Metadata {
  return {
    title: 'Free Prop Firm Drawdown Calculator (2026)',
    description:
      'Calculate your prop firm drawdown floor for static, trailing end-of-day, and trailing intraday drawdown, plus remaining daily loss and whether your account is breached.',
  }
}

export default function DrawdownCalculatorPage() {
  return (
    <article>
      <p className="mb-2 text-xs font-bold tracking-widest text-accent uppercase">Free tool</p>
      <h1 className="mb-2 text-3xl font-black tracking-tight">Drawdown Calculator</h1>
      <p className="mb-6 max-w-(--container-prose) text-ink-2">
        Enter your account details and drawdown type to see the exact equity level that breaches
        your account, how much room you have left today, and whether a trailing floor has locked.
      </p>

      <DrawdownForm />

      <section className="mt-10 max-w-(--container-prose)">
        <h2 className="mb-3 text-xl font-bold">How prop firm drawdown works</h2>
        <div className="space-y-3 text-ink-2">
          <p>
            Every prop firm sets a maximum loss limit: a &ldquo;floor&rdquo; your equity must stay above. With
            <strong> static drawdown</strong>, the floor is fixed: a $100,000 account with a 10%
            limit breaches at $90,000, no matter how much profit you make first. With
            <strong> trailing drawdown</strong>, the floor follows your high-water mark upward.
            End-of-day trailing moves the floor only on your highest closing balance; intraday
            trailing is stricter, following your peak equity even during open trades, so a winner
            you let retrace can still raise your floor.
          </p>
          <p>
            Most trailing programs also apply a lock rule: once the floor climbs to your initial
            balance, it stops trailing permanently. From that point you are effectively trading a
            static account that breaches at breakeven. This calculator models that lock, plus the
            daily loss limit, which is sized off your account and anchored to your start-of-day
            balance. Touching either floor counts as a breach at most firms.
          </p>
        </div>
      </section>

      <section className="mt-10 max-w-(--container-prose)">
        <h2 className="mb-3 text-xl font-bold">Frequently asked questions</h2>
        <div className="space-y-4">
          <div className="rounded-lg border border-line bg-card p-5">
            <h3 className="mb-1 font-bold">
              What is the difference between end-of-day and intraday trailing drawdown?
            </h3>
            <p className="text-ink-2">
              End-of-day trailing recalculates your floor only from your best closing balance, so
              unrealized profit during the day never moves it. Intraday trailing follows your peak
              equity in real time (including open trades), which makes it the least forgiving
              drawdown type.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-card p-5">
            <h3 className="mb-1 font-bold">Does the trailing floor ever stop moving?</h3>
            <p className="text-ink-2">
              At most firms, yes. Once the floor trails up to your initial account balance it locks
              there permanently. After the lock, new equity highs no longer raise the floor, and
              your worst case is ending back at your starting balance.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-card p-5">
            <h3 className="mb-1 font-bold">Is hitting the floor exactly a breach?</h3>
            <p className="text-ink-2">
              At most firms, touching the floor is enough: accounts are liquidated the moment
              equity reaches the limit, not only when it drops below. This calculator uses the same
              convention, so treat &ldquo;$0 remaining&rdquo; as breached, not as safe.
            </p>
          </div>
        </div>
      </section>
    </article>
  )
}
