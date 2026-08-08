import type { Metadata } from 'next'
import Link from 'next/link'
import type { Firm, Promo } from '@/payload-types'
import { getAllActivePromos, getChallengesForFirms, getFirms } from '../_lib/data'
import { cheapestByFirm, type CheapestEntry } from '../_lib/profile'
import { FIRM_TYPE_LABELS, compactMoney, formatDate, money, monthYear } from '../_lib/format'
import {
  DEAL_MARKETS,
  bestDiscountPct,
  countDealsByMarket,
  discountLabel,
  discountedPrice,
  filterDealsByMarket,
  isAffiliateLink,
  isDealMarket,
  outboundUrl,
  promoFirm,
  rankPromos,
  type DealMarket,
} from '../_lib/promo'
import { Badge, EmptyNote, FirmMark, SectionCard } from '../_lib/ui'
import { Button, SectionKicker } from '@/components'
import { CopyCode } from '@/components/CopyCode'
import { JsonLd } from '@/lib/seo/json-ld'
import { breadcrumbLd, faqLd, itemListLd, type FaqItem } from '@/lib/seo/jsonld'
import { staticPageMeta } from '@/lib/seo/metadata'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ type?: string }>

/** A live promo with everything a card needs: the firm, and what it costs. */
type Deal = { promo: Promo; firm: Firm; cheapest: CheapestEntry | null }

const MARKET_CHIPS: { value: DealMarket; label: string }[] = DEAL_MARKETS.map((value) => ({
  value,
  label: FIRM_TYPE_LABELS[value],
}))

/**
 * Every live code, best discount first, joined to its firm and that firm's
 * cheapest challenge. Promos whose firm relation did not populate are dropped:
 * a code we cannot attribute to a named firm is not a deal we will publish.
 */
async function getDeals(): Promise<Deal[]> {
  const promos = rankPromos(await getAllActivePromos())
  const withFirm = promos.flatMap((promo) => {
    const firm = promoFirm(promo)
    return firm ? [{ promo, firm }] : []
  })
  const cheapest = cheapestByFirm(await getChallengesForFirms(withFirm.map((d) => d.firm.id)))
  return withFirm.map((d) => ({ ...d, cheapest: cheapest.get(d.firm.id) ?? null }))
}

/** Most recent time we touched any of these promo records. */
function lastCheckedIso(deals: Deal[]): string | null {
  let latest = 0
  for (const { promo } of deals) {
    const t = new Date(promo.updatedAt).getTime()
    if (Number.isFinite(t) && t > latest) latest = t
  }
  return latest > 0 ? new Date(latest).toISOString() : null
}

export async function generateMetadata(): Promise<Metadata> {
  const deals = await getDeals()
  const best = bestDiscountPct(deals.map((d) => d.promo))

  if (deals.length === 0) {
    return staticPageMeta(
      `Prop Firm Promo Codes ${monthYear()}: Verified Discounts`,
      '/deals',
      'Verified prop firm promo codes and discounts, checked before they are listed and removed the moment they stop working.',
    )
  }

  return staticPageMeta(
    `Prop Firm Promo Codes ${monthYear()}: ${deals.length} Verified Discounts${
      best != null ? ` (Up To ${best}% Off)` : ''
    }`,
    '/deals',
    `${deals.length} working prop firm discount codes for ${monthYear()}${
      best != null ? `, up to ${best}% off` : ''
    }. Every code is checked before it is listed and pulled the moment it stops working, with the challenge price it applies to.`,
  )
}

const FAQS: FaqItem[] = [
  {
    question: 'Do these prop firm promo codes actually work?',
    answer:
      'Every code on this page was applied at the firm checkout and confirmed to reduce the total before it was published. We re-check the list regularly and remove a code the same day it stops working, rather than leaving it up to pad the count. If one fails for you, tell us and we will re-test it.',
  },
  {
    question: 'How do I apply a promo code at checkout?',
    answer:
      'Copy the code from its card, open the firm site, pick your challenge type and account size, then paste the code into the promo or coupon field at checkout. Confirm the order total has actually dropped before you pay. The discount is applied by the firm, not by us, and some firms exclude certain account sizes or program types.',
  },
  {
    question: 'Why are these codes free? What do you get out of it?',
    answer:
      'Some of the links on this page are affiliate links, which means we may earn a commission if you buy a challenge after clicking through. That is how the site pays for itself. It costs you nothing extra, and in most cases the code makes the challenge cheaper than the public price.',
  },
  {
    question: 'Do promo codes affect how you rank firms?',
    answer:
      'No. Rankings and review scores come from verified data on rules, pricing, payouts and rule-change history. Whether a firm pays a commission, and how large a discount it offers, has no input into that score. Firms that pay us nothing are ranked and listed exactly the same way.',
  },
  {
    question: 'What happens if a code stops working?',
    answer:
      'It comes off this page. We would rather show fewer codes than a list of expired ones that fail at checkout, so a code that no longer applies a discount is removed rather than archived. If you hit a dead code before we do, report it and we will re-test and update the page.',
  },
]

/** One deal card. Self-contained so the grid stays dumb. */
function DealCard({ deal }: { deal: Deal }) {
  const { promo, firm, cheapest } = deal
  const ctaUrl = outboundUrl(firm)
  const promoHref = `/prop-firms/${firm.slug}/promo-code`
  const afterDiscount = cheapest ? discountedPrice(cheapest.price, promo.discountPct) : null

  return (
    <li className="flex flex-col rounded-lg border border-line bg-card p-5">
      {/* Firm identity */}
      <div className="mb-4 flex items-center gap-3">
        <FirmMark firm={firm} />
        <div className="min-w-0">
          <Link
            href={`/prop-firms/${firm.slug}`}
            className="block truncate font-bold text-ink hover:text-accent-dark hover:underline"
          >
            {firm.name}
          </Link>
          <span className="block truncate text-xs text-ink-3">
            {(firm.firmTypes ?? []).map((t) => FIRM_TYPE_LABELS[t]).join(' · ') || 'Prop firm'}
          </span>
        </div>
      </div>

      {/* Discount headline */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-3xl leading-none font-black text-accent-dark">
          {discountLabel(promo)}
        </span>
        {promo.exclusive ? <Badge tone="accent">Exclusive to our readers</Badge> : null}
      </div>

      <CopyCode code={promo.code} size="sm" />

      {/* What the discount is worth, in money */}
      {cheapest ? (
        <p className="mt-3 text-sm text-ink-2">
          Cheapest {firm.name} challenge{' '}
          {cheapest.accountSize != null ? (
            <span className="text-ink-3">({compactMoney(cheapest.accountSize)} account) </span>
          ) : null}
          {afterDiscount != null ? (
            <>
              <s className="text-ink-3">{money(cheapest.price, cheapest.currency)}</s>{' '}
              <span className="font-bold text-positive">
                {money(afterDiscount, cheapest.currency)}
              </span>{' '}
              with this code
            </>
          ) : (
            <span className="font-bold text-ink">{money(cheapest.price, cheapest.currency)}</span>
          )}
        </p>
      ) : (
        <p className="mt-3 text-sm text-ink-3">Challenge pricing not published yet.</p>
      )}

      {promo.description ? <p className="mt-2 text-sm text-ink-2">{promo.description}</p> : null}
      {promo.extraPerks ? (
        <p className="mt-2 text-sm font-semibold text-positive">Plus: {promo.extraPerks}</p>
      ) : null}

      <p className="mt-3 text-xs text-ink-3">
        {promo.endDate ? `Expires ${formatDate(promo.endDate)}` : 'No stated expiry'}
      </p>

      {/* Actions pinned to the bottom so cards line up across the row */}
      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        {ctaUrl ? (
          <Button href={ctaUrl} size="sm" rel="nofollow noopener sponsored" newTab>
            Use code at {firm.name} ↗
          </Button>
        ) : null}
        <Button href={promoHref} size="sm" variant="secondary">
          Code details
        </Button>
      </div>
    </li>
  )
}

export default async function DealsPage({ searchParams }: { searchParams: SearchParams }) {
  const { type } = await searchParams
  const market = isDealMarket(type) ? type : null

  const allDeals = await getDeals()
  const deals = filterDealsByMarket(allDeals, market)
  const counts = countDealsByMarket(allDeals)

  const best = bestDiscountPct(allDeals.map((d) => d.promo))
  const firmCount = new Set(allDeals.map((d) => d.firm.id)).size
  const checked = lastCheckedIso(allDeals)
  const monetised = allDeals.some((d) => isAffiliateLink(d.firm))

  // Only reached when nothing is live at all: we point at real firms instead of
  // inventing an offer to fill the space.
  const fallbackFirms = allDeals.length === 0 ? await getFirms() : []
  const fallbackCheapest =
    fallbackFirms.length > 0
      ? cheapestByFirm(await getChallengesForFirms(fallbackFirms.map((f) => f.id)))
      : new Map<number, CheapestEntry>()
  const fallbackPicks = fallbackFirms
    .flatMap((firm) => {
      const entry = fallbackCheapest.get(firm.id)
      return entry ? [{ firm, entry }] : []
    })
    .sort((a, b) => a.entry.price - b.entry.price)
    .slice(0, 3)

  return (
    <div>
      <JsonLd data={breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Deals', path: '/deals' }])} />
      <JsonLd data={faqLd(FAQS)} />
      {allDeals.length > 0 ? (
        <JsonLd
          data={itemListLd(
            allDeals.map(({ promo, firm }) => ({
              name: `${firm.name} promo code: ${discountLabel(promo)}`,
              path: `/prop-firms/${firm.slug}/promo-code`,
            })),
          )}
        />
      ) : null}

      {/* ————— Hero ————— */}
      <SectionKicker className="mb-2">
        {checked ? `Last checked ${formatDate(checked)}` : `Verified ${monthYear()}`}
      </SectionKicker>
      <h1 className="mb-3 text-4xl font-black tracking-tight">
        Prop firm promo codes and deals
      </h1>
      <p className="mb-6 max-w-(--container-prose) text-lg text-ink-2">
        {allDeals.length > 0 ? (
          <>
            {allDeals.length} verified {allDeals.length === 1 ? 'code is' : 'codes are'} live right
            now across {firmCount} {firmCount === 1 ? 'firm' : 'firms'}
            {best != null ? `, the largest is ${best}% off` : ''}. Every one was applied at
            checkout before it went on this page, and comes down the day it stops working. Short
            list, no dead coupons.
          </>
        ) : (
          <>
            We list a prop firm code only after it has been applied at checkout and confirmed to
            work. Right now none pass that test, so this page shows none.
          </>
        )}
      </p>

      {/* ————— Live numbers ————— */}
      {allDeals.length > 0 ? (
        <dl className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
          {[
            { label: 'Verified codes live', value: String(allDeals.length) },
            { label: 'Best discount', value: best != null ? `${best}% off` : 'Varies' },
            { label: 'Firms covered', value: String(firmCount) },
            {
              label: 'Last checked',
              value: checked ? formatDate(checked) : monthYear(),
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-card px-4 py-3">
              <dt className="text-[11px] font-bold tracking-wide text-ink-3 uppercase">
                {stat.label}
              </dt>
              <dd className="mt-0.5 text-xl leading-tight font-black tabular-nums text-ink">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {/* ————— Market filter: plain links, works with JS off ————— */}
      {allDeals.length > 0 ? (
        <nav aria-label="Filter deals by market" className="mb-6 flex flex-wrap gap-2">
          {[{ value: null, label: 'All deals', count: allDeals.length }, ...MARKET_CHIPS.map((c) => ({ ...c, count: counts[c.value] }))]
            .filter((chip) => chip.value === null || chip.count > 0)
            .map((chip) => {
              const active = chip.value === market
              return (
                <Link
                  key={chip.label}
                  href={chip.value ? `/deals?type=${chip.value}` : '/deals'}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-sm border px-3 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:py-1.5 ${
                    active
                      ? 'border-accent bg-accent-pale text-accent-dark'
                      : 'border-line bg-card text-ink-2 hover:border-accent hover:text-ink'
                  }`}
                >
                  {chip.label}{' '}
                  <span className="tabular-nums text-ink-3">{chip.count}</span>
                </Link>
              )
            })}
        </nav>
      ) : null}

      {/* ————— The deals ————— */}
      {allDeals.length === 0 ? (
        <EmptyNote>
          <p className="mb-2 font-semibold text-ink">No verified codes right now</p>
          <p className="mb-3">
            Codes come and go, and we would rather show you an empty page than an expired coupon
            that fails at checkout. This page updates as soon as one passes.
          </p>
          {fallbackPicks.length > 0 ? (
            <>
              <p className="mb-2">
                In the meantime, these are the cheapest challenges we track at full price:
              </p>
              <ul className="mb-3 space-y-1">
                {fallbackPicks.map(({ firm, entry }) => (
                  <li key={firm.id}>
                    <Link
                      href={`/prop-firms/${firm.slug}`}
                      className="font-semibold text-accent-dark underline"
                    >
                      {firm.name}
                    </Link>{' '}
                    from {money(entry.price, entry.currency)}
                    {entry.accountSize != null
                      ? ` (${compactMoney(entry.accountSize)} account)`
                      : ''}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          <p>
            Or browse the{' '}
            <Link href="/prop-firms" className="font-semibold text-accent-dark underline">
              full firm directory
            </Link>{' '}
            and compare rules, pricing and payouts.
          </p>
        </EmptyNote>
      ) : deals.length === 0 ? (
        <EmptyNote>
          No verified codes for {market ? FIRM_TYPE_LABELS[market] : 'this market'} right now.{' '}
          <Link href="/deals" className="font-semibold text-accent-dark underline">
            See all {allDeals.length} live codes
          </Link>
        </EmptyNote>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {deals.map((deal) => (
            <DealCard key={deal.promo.id} deal={deal} />
          ))}
        </ul>
      )}

      <div className="mt-10 space-y-6">
        {/* ————— Trust ————— */}
        <SectionCard
          id="how-we-verify"
          number={1}
          kicker="How this list is built"
          title="Why this is not a coupon dump"
          intro="Most prop firm coupon pages are a scrape of every code that ever existed, sorted by whatever pays best. This one is built the other way round."
        >
          <ul className="space-y-3 text-ink-2">
            {[
              <>
                <strong className="font-bold text-ink">Checked before it is listed.</strong> A code
                reaches this page only after it has been entered at the firm checkout and confirmed
                to reduce the total. If it does not apply, it does not go up.
              </>,
              <>
                <strong className="font-bold text-ink">Removed when it dies.</strong> We re-check
                the list and pull codes that stop working rather than leaving them to inflate the
                count.{' '}
                {checked
                  ? `Last full check: ${formatDate(checked)}.`
                  : 'The list is re-checked continuously.'}
              </>,
              <>
                <strong className="font-bold text-ink">Priced, not just advertised.</strong> Each
                card shows the firm&rsquo;s cheapest challenge and what the code brings it down to,
                so a big percentage cannot hide a high price.
              </>,
              <>
                <strong className="font-bold text-ink">No countdowns.</strong> Where a firm states
                an expiry date we print it. Where it does not, we say so. We never manufacture
                urgency to make you click.
              </>,
            ].map((point, i) => (
              <li key={i} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-accent-pale text-xs font-bold tabular-nums text-accent-dark"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded-sm border border-line bg-page p-4 text-sm text-ink-2">
            <p className="mb-1 font-bold text-ink">How we make money, and what it does not buy</p>
            <p>
              {monetised
                ? 'Some links on this page are affiliate links: we may earn a commission if you buy a challenge after clicking through, at no extra cost to you.'
                : 'We may earn a commission on some of the firms we link to, at no extra cost to you.'}{' '}
              A commission never buys a listing, a ranking position, or a better review score. The
              order of this page is set by discount size, not by what a firm pays, and firms that
              pay us nothing appear here on exactly the same terms.
            </p>
            <p className="mt-2">
              The full working is in our{' '}
              <Link href="/methodology" className="font-semibold text-accent-dark underline">
                methodology
              </Link>
              .
            </p>
          </div>
        </SectionCard>

        {/* ————— FAQ ————— */}
        <SectionCard
          id="faq"
          number={2}
          kicker="Questions"
          title="Prop firm promo codes: common questions"
        >
          <dl className="divide-y divide-line">
            {FAQS.map((faq) => (
              <div key={faq.question} className="py-4 first:pt-0 last:pb-0">
                <dt className="mb-1.5 font-bold text-ink">{faq.question}</dt>
                <dd className="max-w-(--container-prose) text-ink-2">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>
      </div>
    </div>
  )
}
