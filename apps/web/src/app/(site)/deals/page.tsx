import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllActivePromos } from '../_lib/data'
import { formatDate, monthYear } from '../_lib/format'
import { Badge, EmptyNote, td, th } from '../_lib/ui'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const promos = await getAllActivePromos()
  const best = Math.max(0, ...promos.map((p) => p.discountPct ?? 0))
  return {
    title:
      promos.length > 0
        ? `Prop Firm Deals ${monthYear()}: ${promos.length} Verified Promo Codes${best > 0 ? ` (Up to ${best}% Off)` : ''}`
        : `Prop Firm Deals ${monthYear()}: Verified Promo Codes`,
    description: `Every working prop firm discount in one place: verified codes${best > 0 ? ` up to ${best}% off` : ''}, with expiry dates. No dead coupons.`,
    alternates: { canonical: '/deals' },
  }
}

export default async function DealsPage() {
  const promos = await getAllActivePromos()

  return (
    <div>
      <p className="mb-2 text-xs font-bold tracking-widest text-accent uppercase">
        Verified {monthYear()}
      </p>
      <h1 className="mb-3 text-4xl font-black tracking-tight">Prop firm deals & promo codes</h1>
      <p className="mb-8 max-w-(--container-prose) text-lg text-ink-2">
        Every active discount across the firms we track, in one table. Codes are verified before
        listing and removed when they die. No copy-paste coupon graveyard.
      </p>

      {promos.length === 0 ? (
        <EmptyNote>No verified deals live right now. Check back soon; this page updates continuously.</EmptyNote>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-card">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <caption className="sr-only">Active prop firm promo codes, best discount first</caption>
            <thead className="border-b border-line bg-page">
              <tr>
                <th scope="col" className={th}>Firm</th>
                <th scope="col" className={th}>Discount</th>
                <th scope="col" className={th}>Code</th>
                <th scope="col" className={th}>Details</th>
                <th scope="col" className={th}>Ends</th>
                <th scope="col" className={th}><span className="sr-only">Link</span></th>
              </tr>
            </thead>
            <tbody>
              {promos.map((promo) => {
                const firm = typeof promo.firm === 'object' && promo.firm !== null ? promo.firm : null
                return (
                  <tr key={promo.id} className="border-b border-line last:border-0">
                    <th scope="row" className={`${td} text-left`}>
                      {firm ? (
                        <Link
                          href={`/prop-firms/${firm.slug}`}
                          className="font-bold text-accent-dark hover:underline"
                        >
                          {firm.name}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </th>
                    <td className={`${td} text-lg font-black text-accent-dark`}>
                      {promo.discountPct != null ? `${promo.discountPct}%` : 'Offer'}
                    </td>
                    <td className={td}>
                      <code className="rounded-sm border border-dashed border-accent bg-accent-pale px-2 py-1 font-bold tracking-wider">
                        {promo.code}
                      </code>
                    </td>
                    <td className={`${td} max-w-64 text-ink-2`}>
                      <span className="flex flex-wrap items-center gap-1.5">
                        {promo.exclusive ? <Badge tone="accent">Exclusive</Badge> : null}
                        {promo.extraPerks ? <span>{promo.extraPerks}</span> : null}
                        {!promo.exclusive && !promo.extraPerks ? '—' : null}
                      </span>
                    </td>
                    <td className={`${td} whitespace-nowrap text-ink-2`}>
                      {promo.endDate ? formatDate(promo.endDate) : 'No expiry listed'}
                    </td>
                    <td className={td}>
                      {firm ? (
                        <Link
                          href={`/prop-firms/${firm.slug}/promo-code`}
                          className="font-semibold whitespace-nowrap text-accent-dark hover:underline"
                        >
                          Get code →
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 max-w-(--container-prose) text-sm text-ink-2">
        PropFirmSquad may earn a commission when you use these codes; it never affects which deals
        are listed or how firms are ranked. See our{' '}
        <Link href="/methodology" className="font-semibold text-accent-dark underline">
          methodology
        </Link>
        .
      </p>
    </div>
  )
}
