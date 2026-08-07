import type { Metadata } from 'next'
import Link from 'next/link'
import type { Firm } from '@/payload-types'
import { getFirms } from '../_lib/data'
import {
  CURRENT_YEAR,
  FIRM_TYPE_LABELS,
  PROGRAM_LABELS,
  compactMoney,
  countryName,
  yearOf,
} from '../_lib/format'
import { Badge, EmptyNote, FirmMark, Score } from '../_lib/ui'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ type?: string }>

const TYPE_FILTERS = [
  { value: undefined, label: 'All firms' },
  { value: 'cfd', label: 'CFD / Forex' },
  { value: 'futures', label: 'Futures' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'options', label: 'Options' },
  { value: 'stocks', label: 'Stocks' },
] as const

const validType = (t?: string): t is NonNullable<Firm['firmTypes']>[number] =>
  t != null && t in FIRM_TYPE_LABELS

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams
}): Promise<Metadata> {
  const { type } = await searchParams
  const label = validType(type) ? FIRM_TYPE_LABELS[type] : null
  return {
    title: label
      ? `${label} Prop Firms ${CURRENT_YEAR}: Full Directory`
      : `Prop Firm Directory ${CURRENT_YEAR}: Every Firm, Compared`,
    description: label
      ? `All ${label} prop trading firms compared by review score, max funding, programs, and payout data.`
      : `The full directory of prop trading firms — compare review scores, funding, programs, rules, and payouts side by side.`,
    // One filterable URL; filtered views canonical to the base directory.
    alternates: { canonical: '/prop-firms' },
  }
}

export default async function PropFirmsPage({ searchParams }: { searchParams: SearchParams }) {
  const { type } = await searchParams
  const firmType = validType(type) ? type : undefined
  const firms = await getFirms({ firmType })

  return (
    <div>
      <h1 className="mb-3 text-4xl font-black tracking-tight">
        {firmType ? `${FIRM_TYPE_LABELS[firmType]} prop firms` : 'Prop firm directory'}
      </h1>
      <p className="mb-6 max-w-(--container-prose) text-lg text-ink-2">
        {firms.length > 0
          ? `${firms.length} ${firmType ? FIRM_TYPE_LABELS[firmType] + ' ' : ''}firms tracked, ranked by verified review score.`
          : 'Every firm we track, ranked by verified review score.'}{' '}
        Click any firm for its full profile: rules, live pricing, payout data, and promo codes.
      </p>

      {/* Filter shell — server-rendered links on one URL (searchParams-based) */}
      <nav aria-label="Filter by market" className="mb-8 flex flex-wrap gap-2">
        {TYPE_FILTERS.map((f) => {
          const active = f.value === firmType
          return (
            <Link
              key={f.label}
              href={f.value ? `/prop-firms?type=${f.value}` : '/prop-firms'}
              aria-current={active ? 'page' : undefined}
              className={`rounded-sm border px-3 py-1.5 text-sm font-semibold transition-colors ${
                active
                  ? 'border-accent bg-accent-pale text-accent-dark'
                  : 'border-line bg-card text-ink-2 hover:border-accent hover:text-ink'
              }`}
            >
              {f.label}
            </Link>
          )
        })}
      </nav>

      {firms.length === 0 ? (
        <EmptyNote>
          No firms match this filter yet.{' '}
          <Link href="/prop-firms" className="font-semibold text-accent-dark underline">
            View all firms
          </Link>
        </EmptyNote>
      ) : (
        <ul className="space-y-3">
          {firms.map((firm, i) => (
            <li key={firm.id}>
              <Link
                href={`/prop-firms/${firm.slug}`}
                className="flex flex-wrap items-center gap-4 rounded-lg border border-line bg-card p-4 transition-colors hover:border-accent sm:p-5"
              >
                <span className="w-8 shrink-0 text-lg font-black text-ink-3">{i + 1}</span>
                <FirmMark firm={firm} />
                <span className="min-w-40 flex-1">
                  <span className="block text-lg font-bold">{firm.name}</span>
                  <span className="block text-sm text-ink-2">
                    {countryName(firm.country)}
                    {yearOf(firm.dateEstablished) ? ` · est. ${yearOf(firm.dateEstablished)}` : ''}
                    {firm.maxAllocation != null
                      ? ` · up to ${compactMoney(firm.maxAllocation)}`
                      : ''}
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-1.5">
                  {(firm.firmTypes ?? []).map((t) => (
                    <Badge key={t} tone="accent">
                      {FIRM_TYPE_LABELS[t]}
                    </Badge>
                  ))}
                  {(firm.programTypes ?? []).map((p) => (
                    <Badge key={p}>{PROGRAM_LABELS[p]}</Badge>
                  ))}
                  {firm.underReview ? <Badge tone="negative">Under review</Badge> : null}
                </span>
                <span className="ml-auto text-right">
                  <span className="block text-lg">
                    <Score value={firm.reviewScore} />
                  </span>
                  <span className="block text-xs text-ink-3">
                    {firm.reviewsCount ? `${firm.reviewsCount.toLocaleString('en-US')} reviews` : 'no reviews yet'}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
