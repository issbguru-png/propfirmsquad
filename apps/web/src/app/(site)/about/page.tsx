import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About PropFirmSquad',
  description:
    'PropFirmSquad is an independent prop-firm comparison platform: verified data on rules, pricing, and payouts for every major prop trading firm.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <article className="max-w-(--container-prose)">
      <h1 className="mb-4 text-4xl font-black tracking-tight">About PropFirmSquad</h1>
      <p className="mb-8 text-lg text-ink-2">
        We compare prop trading firms with data you can check, so you don&apos;t buy a challenge on
        marketing alone.
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="mb-2 text-2xl font-extrabold">Why this exists</h2>
          <p className="text-ink-2">
            The prop-firm industry moves fast: rules change quietly, firms launch and collapse, and
            most &quot;review&quot; sites are coupon pages ranked by commission. PropFirmSquad was
            built by traders to fix that: one dense, honest profile per firm covering pricing,
            rules, payouts, and trust signals, with a visible date on every claim.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-2xl font-extrabold">What you&apos;ll find here</h2>
          <ul className="list-disc space-y-2 pl-5 text-ink-2">
            <li>
              A{' '}
              <Link href="/prop-firms" className="font-semibold text-accent-dark underline">
                directory of prop firms
              </Link>{' '}
              ranked by verified review data
            </li>
            <li>Full per-firm reviews: challenge pricing, rules explained, payout data, trust facts</li>
            <li>
              A per-firm <strong className="text-ink">rule-change log</strong>: we track edits firms
              hope you won&apos;t notice
            </li>
            <li>
              <Link href="/deals" className="font-semibold text-accent-dark underline">
                Verified promo codes
              </Link>{' '}
              that are removed the moment they stop working
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-2xl font-extrabold">How we make money</h2>
          <p className="text-ink-2">
            Affiliate commissions on some challenge purchases, disclosed everywhere they apply and
            firewalled from rankings. The full process is in our{' '}
            <Link href="/methodology" className="font-semibold text-accent-dark underline">
              methodology
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-2xl font-extrabold">Get in touch</h2>
          <p className="text-ink-2">
            Corrections, payout proofs, or a firm we should cover: a contact page is coming soon;
            until then, reach us through our community channels.
          </p>
        </section>
      </div>
    </article>
  )
}
