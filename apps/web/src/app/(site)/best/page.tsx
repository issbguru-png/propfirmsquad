import type { Metadata } from 'next'
import Link from 'next/link'
import { CURRENT_YEAR } from '../_lib/format'
import { staticPageMeta } from '@/lib/seo/metadata'
import { BEST_LISTS } from './_lib/lists'

export const metadata: Metadata = staticPageMeta(
  `Best Prop Firms ${CURRENT_YEAR}: Rankings by Market`,
  '/best',
  `Curated prop firm rankings by market (CFD/forex, futures, and crypto), built from verified trader reviews, Trustpilot trends, and tracked payout data.`,
)

export default function BestIndexPage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="mb-4 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
          Best prop firms of {CURRENT_YEAR}, by market
        </h1>
        <p className="max-w-(--container-prose) text-lg text-ink-2">
          Every ranking below is built the same way: verified trader reviews, weekly Trustpilot
          trend tracking, rule-fairness audits, and dated payout evidence, never affiliate
          commission. Pick your market.
        </p>
      </section>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {BEST_LISTS.map((l) => (
          <li key={l.slug}>
            <Link
              href={`/best/${l.slug}`}
              className="block h-full rounded-sm border border-line bg-card p-5 transition-colors hover:border-accent"
            >
              <span className="mb-1 block font-bold">
                {l.title} <span aria-hidden className="text-accent">→</span>
              </span>
              <span className="block text-sm text-ink-2">{l.intro}</span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="max-w-(--container-prose) text-sm text-ink-2">
        Not sure where to start? The overall ranking on the{' '}
        <Link href="/" className="font-semibold text-accent-dark underline">
          homepage
        </Link>{' '}
        compares every firm we track, and the{' '}
        <Link href="/methodology" className="font-semibold text-accent-dark underline">
          methodology
        </Link>{' '}
        explains exactly how scores are built.
      </p>
    </div>
  )
}
