import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getFirmBySlug, getPromosForFirm } from '../../../_lib/data'
import { formatDate, monthYear } from '../../../_lib/format'
import { Badge, EmptyNote, FirmMark } from '../../../_lib/ui'
import { JsonLd } from '@/lib/seo/json-ld'
import { breadcrumbLd, offerLd } from '@/lib/seo/jsonld'
import { promoPageMeta } from '@/lib/seo/metadata'

export const dynamic = 'force-dynamic'

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const firm = await getFirmBySlug(slug)
  if (!firm) return { title: 'Firm not found' }

  const promos = await getPromosForFirm(firm.id)
  const best = promos.slice().sort((a, b) => (b.discountPct ?? 0) - (a.discountPct ?? 0))[0]
  if (best) return promoPageMeta(firm, best)
  return {
    title: `${firm.name} Promo Code ${monthYear()} (Verified)`,
    description: `Looking for a ${firm.name} promo code? We track and verify every active discount; see current status for ${monthYear()}.`,
    alternates: { canonical: `/prop-firms/${firm.slug}/promo-code` },
    robots: { index: false, follow: true },
  }
}

export default async function PromoCodePage({ params }: { params: Params }) {
  const { slug } = await params
  const firm = await getFirmBySlug(slug)
  if (!firm) notFound()

  const promos = await getPromosForFirm(firm.id)

  return (
    <div className="max-w-(--container-prose)">
      {promos.map((p) => (
        <JsonLd key={p.id} data={offerLd(p, firm)} />
      ))}
      <JsonLd
        data={breadcrumbLd([
          { name: 'Prop Firms', path: '/prop-firms' },
          { name: firm.name, path: `/prop-firms/${firm.slug}` },
          { name: 'Promo code', path: `/prop-firms/${firm.slug}/promo-code` },
        ])}
      />
      <p className="mb-2 text-xs font-bold tracking-widest text-accent uppercase">
        Verified {monthYear()}
      </p>
      <div className="mb-4 flex items-center gap-3">
        <FirmMark firm={firm} />
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          {firm.name} promo code{promos.length > 1 ? 's' : ''}
        </h1>
      </div>
      <p className="mb-8 text-lg text-ink-2">
        {promos.length > 0
          ? `${promos.length} active, verified discount${promos.length > 1 ? 's' : ''} for ${firm.name} challenges. Codes are checked before listing and removed the moment they stop working.`
          : `No verified ${firm.name} discount is live right now. We check codes continuously; this page updates the moment one works.`}
      </p>

      {promos.length === 0 ? (
        <EmptyNote>
          No active promo. See the{' '}
          <Link href={`/prop-firms/${firm.slug}`} className="font-semibold text-accent-dark underline">
            full {firm.name} review
          </Link>{' '}
          or{' '}
          <Link href="/deals" className="font-semibold text-accent-dark underline">
            all current deals
          </Link>
          .
        </EmptyNote>
      ) : (
        <ul className="space-y-4">
          {promos.map((promo) => (
            <li
              key={promo.id}
              className="rounded-lg border border-line bg-card p-5 sm:p-6"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {promo.discountPct != null ? (
                  <span className="text-3xl font-black text-accent-dark">
                    {promo.discountPct}% off
                  </span>
                ) : (
                  <span className="text-2xl font-black text-accent-dark">Special offer</span>
                )}
                {promo.exclusive ? <Badge tone="accent">Exclusive</Badge> : null}
                {promo.endDate ? (
                  <Badge tone="negative">Ends {formatDate(promo.endDate)}</Badge>
                ) : (
                  <Badge tone="positive">No listed expiry</Badge>
                )}
              </div>
              <div className="mb-3 inline-flex items-center gap-3 rounded-sm border-2 border-dashed border-accent bg-accent-pale px-5 py-3">
                <span className="text-xs font-bold tracking-widest text-accent-dark uppercase">
                  Code
                </span>
                <code className="text-2xl font-black tracking-wider text-ink">{promo.code}</code>
              </div>
              {promo.description ? <p className="text-ink-2">{promo.description}</p> : null}
              {promo.extraPerks ? (
                <p className="mt-1 text-sm font-semibold text-positive">+ {promo.extraPerks}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-10 mb-2 text-xl font-extrabold">How to use the code</h2>
      <ol className="list-decimal space-y-1 pl-5 text-ink-2">
        <li>
          Go to{' '}
          {firm.websiteUrl ? (
            <a href={firm.websiteUrl} rel="nofollow noopener" className="font-semibold text-accent-dark underline">
              the official {firm.name} website
            </a>
          ) : (
            `the official ${firm.name} website`
          )}{' '}
          and pick your challenge size.
        </li>
        <li>Paste the code into the promo/coupon field at checkout.</li>
        <li>Confirm the discount is applied to the total before paying.</li>
      </ol>

      <p className="mt-8 text-sm text-ink-2">
        Read the{' '}
        <Link href={`/prop-firms/${firm.slug}`} className="font-semibold text-accent-dark underline">
          full {firm.name} review
        </Link>{' '}
        (rules, live pricing, and payout data) before you buy.
      </p>
    </div>
  )
}
