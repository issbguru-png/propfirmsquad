/**
 * The ranked comparison table. Shared by the homepage and every /best hub, so
 * the primary info surface is defined once.
 *
 * Column strategy: answer what a buyer actually asks, in order — can I trust
 * them (rating), what does it cost to start (from), what do I keep (split),
 * what will breach me (drawdown), where do I click (action). Deliberately NOT
 * max-allocation/market/programs: those were near-identical across rows
 * (8 of 16 firms share the same max allocation), so they carried no signal.
 *
 * Responsive: columns disclose progressively, so a phone shows
 * rank / firm / rating / action and never scrolls sideways.
 */
import Link from 'next/link'
import type { Firm, Promo } from '@/payload-types'
import type { CheapestEntry } from './profile'
import { DRAWDOWN_LABELS, money } from './format'
import { FirmMark } from './ui'

const th = 'px-4 py-3 text-left text-xs font-bold tracking-wide text-ink-2 uppercase'
const td = 'px-4 py-4 align-middle'

export type FirmTableProps = {
  firms: Firm[]
  /** firm id → cheapest active challenge */
  cheapest: Map<number, CheapestEntry>
  /** firm id → best active promo */
  promos: Map<number, Promo>
  caption: string
}

/** Compact account size for the price subtext: 25000 → "25K". */
function shortSize(n: number | null | undefined): string | null {
  if (n == null) return null
  return n >= 1000 ? `${Math.round(n / 1000)}K` : String(n)
}

export function FirmTable({ firms, cheapest, promos, caption }: FirmTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-card">
      <table className="w-full border-collapse text-base">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-line bg-page">
          <tr>
            <th scope="col" className={th}>
              #
            </th>
            <th scope="col" className={th}>
              Firm
            </th>
            <th scope="col" className={th}>
              Rating
            </th>
            <th scope="col" className={`${th} hidden sm:table-cell`}>
              From
            </th>
            <th scope="col" className={`${th} hidden md:table-cell`}>
              Split
            </th>
            <th scope="col" className={`${th} hidden lg:table-cell`}>
              Drawdown
            </th>
            <th scope="col" className={`${th} text-right`}>
              <span className="sr-only">Action</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {firms.map((firm, i) => {
            const price = cheapest.get(firm.id)
            const promo = promos.get(firm.id)
            const size = shortSize(price?.accountSize)
            const split = firm.payout?.profitSplitPct
            const dd = firm.rulesSummary?.drawdownType
            return (
              <tr key={firm.id} className="border-b border-line last:border-0">
                <td className={`${td} font-bold text-ink-3`}>{i + 1}</td>

                <th scope="row" className={`${td} text-left`}>
                  <Link
                    href={`/prop-firms/${firm.slug}`}
                    className="flex items-center gap-3 font-bold text-accent-dark hover:underline"
                  >
                    <FirmMark firm={firm} />
                    {firm.name}
                  </Link>
                </th>

                <td className={td}>
                  {firm.reviewScore != null ? (
                    <>
                      <span className="font-bold tabular-nums">
                        {firm.reviewScore}
                        <span className="text-accent"> ★</span>
                      </span>
                      <span className="block text-xs text-ink-3">
                        {firm.reviewsCount
                          ? `${firm.reviewsCount.toLocaleString('en-US')} reviews`
                          : 'no reviews yet'}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-ink-3">Not rated</span>
                  )}
                </td>

                <td className={`${td} hidden sm:table-cell`}>
                  {price ? (
                    <>
                      <span className="font-bold tabular-nums">
                        {money(price.price, price.currency)}
                      </span>
                      {size ? (
                        <span className="block text-xs text-ink-3">{size} account</span>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-ink-3">—</span>
                  )}
                </td>

                <td className={`${td} hidden tabular-nums md:table-cell`}>
                  {split != null ? `${split}%` : <span className="text-ink-3">—</span>}
                </td>

                <td className={`${td} hidden text-ink-2 lg:table-cell`}>
                  {dd ? DRAWDOWN_LABELS[dd] : <span className="text-ink-3">—</span>}
                </td>

                <td className={`${td} text-right whitespace-nowrap`}>
                  {promo?.discountPct ? (
                    <Link
                      href={`/prop-firms/${firm.slug}/promo-code`}
                      className="inline-block rounded-sm bg-accent px-3 py-2 text-sm font-bold text-nav transition-colors hover:bg-accent-light"
                    >
                      Claim {promo.discountPct}% off
                    </Link>
                  ) : (
                    <Link
                      href={`/prop-firms/${firm.slug}`}
                      className="inline-block rounded-sm border border-line px-3 py-2 text-sm font-bold text-accent-dark transition-colors hover:border-accent"
                    >
                      Read review
                    </Link>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/** Build the firm id → best (highest discount) active promo map. */
export function bestPromoByFirm(promos: Promo[]): Map<number, Promo> {
  const map = new Map<number, Promo>()
  for (const p of promos) {
    const firmId = typeof p.firm === 'object' && p.firm !== null ? p.firm.id : p.firm
    if (firmId == null) continue
    const prev = map.get(firmId)
    if (!prev || (p.discountPct ?? 0) > (prev.discountPct ?? 0)) map.set(firmId, p)
  }
  return map
}
