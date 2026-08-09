import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Country, Promo } from '@/payload-types'
import { getChallengesForFirms, getFirmBySlug, getPromosForFirm } from '../../../_lib/data'
import { cheapestByFirm } from '../../../_lib/profile'
import { discountLabel, isAffiliateLink, outboundUrl, rankPromos } from '../../../_lib/promo'
import { DRAWDOWN_LABELS, compactMoney, formatDate, money, monthYear } from '../../../_lib/format'
import { Badge, EmptyNote, FirmMark, SectionCard } from '../../../_lib/ui'
import { Button, SectionKicker } from '@/components'
import { AvailabilityChip } from '../AvailabilityChip'
import { CopyCode } from '@/components/CopyCode'
import { JsonLd } from '@/lib/seo/json-ld'
import { breadcrumbLd, offerLd } from '@/lib/seo/jsonld'
import { promoPageMeta } from '@/lib/seo/metadata'

export const dynamic = 'force-dynamic'

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const firm = await getFirmBySlug(slug)
  if (!firm) return { title: 'Firm not found' }

  const [best] = rankPromos(await getPromosForFirm(firm.id))
  if (best) return promoPageMeta(firm, best)
  return {
    // No active promo at all, so there is nothing to call verified.
    title: `${firm.name} Promo Code ${monthYear()}`,
    description: `Looking for a ${firm.name} promo code? We track every active discount; see current status for ${monthYear()}.`,
    alternates: { canonical: `/prop-firms/${firm.slug}/promo-code` },
    robots: { index: false, follow: true },
  }
}

/** Expiry / exclusivity badges. Never invents a countdown; states the plain date. */
function PromoBadges({ promo }: { promo: Promo }) {
  return (
    <>
      {promo.exclusive ? <Badge tone="accent">Exclusive to our readers</Badge> : null}
      {promo.endDate ? (
        <Badge tone="neutral">Expires {formatDate(promo.endDate)}</Badge>
      ) : (
        <Badge tone="neutral">No stated expiry</Badge>
      )}
    </>
  )
}

export default async function PromoCodePage({ params }: { params: Params }) {
  const { slug } = await params
  const firm = await getFirmBySlug(slug)
  if (!firm) notFound()

  const promos = rankPromos(await getPromosForFirm(firm.id))
  const [best, ...others] = promos

  const challenges = await getChallengesForFirms([firm.id])
  const cheapest = cheapestByFirm(challenges).get(firm.id) ?? null

  const ctaUrl = outboundUrl(firm)
  const monetised = isAffiliateLink(firm)
  const reviewHref = `/prop-firms/${firm.slug}`
  const restrictedIso2 = (firm.restrictedCountries ?? [])
    .filter((c): c is Country => typeof c === 'object' && c !== null)
    .map((c) => c.iso2)

  const drawdown = firm.rulesSummary?.drawdownType
  const profitSplit = firm.payout?.profitSplitPct

  // Sequential section numbers: the "other codes" section only exists sometimes,
  // so the chips are numbered at render time rather than hard-coded.
  let n = 0
  const next = () => ++n

  const ctaLabel = best
    ? `Use code ${best.code} at ${firm.name} ↗`
    : `Go to ${firm.name} ↗`

  const PrimaryCta = ctaUrl ? (
    <Button href={ctaUrl} rel="nofollow noopener sponsored" newTab>
      {ctaLabel}
    </Button>
  ) : null

  return (
    <div>
      {promos.map((p) => (
        <JsonLd key={p.id} data={offerLd(p, firm)} />
      ))}
      <JsonLd
        data={breadcrumbLd([
          { name: 'Prop Firms', path: '/prop-firms' },
          { name: firm.name, path: reviewHref },
          { name: 'Promo code', path: `/prop-firms/${firm.slug}/promo-code` },
        ])}
      />

      {/* ————— Hero ————— */}
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-ink-2">
        <Link href="/prop-firms" className="hover:text-accent-dark hover:underline">
          Prop firms
        </Link>
        <span aria-hidden> / </span>
        <Link href={reviewHref} className="hover:text-accent-dark hover:underline">
          {firm.name}
        </Link>
        <span aria-hidden> / </span>
        <span className="text-ink-3">Promo code</span>
      </nav>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <FirmMark firm={firm} size="lg" />
        <div className="min-w-0">
          <SectionKicker className="mb-1">
            {firm.lastVerifiedAt
              ? `Verified ${formatDate(firm.lastVerifiedAt)}`
              : `Checked ${monthYear()}`}
          </SectionKicker>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            {firm.name} promo code {monthYear()}
          </h1>
        </div>
      </div>

      {best ? (
        <>
          <p className="mb-6 max-w-(--container-prose) text-lg text-ink-2">
            {promos.length > 1
              ? `${promos.length} verified ${firm.name} codes are live right now. The best one is below; the rest are further down.`
              : `One verified ${firm.name} code is live right now. It is written out in full below, no email or signup needed.`}
          </p>

          {/* ————— Featured promo ————— */}
          <div className="mb-8 rounded-lg border border-accent/40 bg-card p-5 sm:p-7">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="text-3xl font-black text-accent-dark sm:text-4xl">
                {discountLabel(best)}
              </span>
              <PromoBadges promo={best} />
            </div>

            <CopyCode code={best.code} />

            {best.description ? (
              <p className="mt-4 max-w-(--container-prose) text-ink-2">{best.description}</p>
            ) : null}
            {best.extraPerks ? (
              <p className="mt-2 max-w-(--container-prose) text-sm font-semibold text-positive">
                Plus: {best.extraPerks}
              </p>
            ) : null}

            {PrimaryCta ? <div className="mt-5">{PrimaryCta}</div> : null}
          </div>
        </>
      ) : (
        <>
          <p className="mb-6 max-w-(--container-prose) text-lg text-ink-2">
            No verified {firm.name} discount is live right now, so this page does not show one.
            We re-check continuously and publish the moment a code works.
          </p>
          <EmptyNote>
            <p className="mb-2 font-semibold text-ink">No verified code right now</p>
            <p>
              We would rather show you nothing than an expired code that fails at checkout.
              {cheapest
                ? ` ${firm.name} challenges currently start at ${money(cheapest.price, cheapest.currency)} at full price.`
                : ''}{' '}
              Read the{' '}
              <Link href={reviewHref} className="font-semibold text-accent-dark underline">
                full {firm.name} review
              </Link>{' '}
              for pricing and rules, or check{' '}
              <Link href="/deals" className="font-semibold text-accent-dark underline">
                every code we have verified
              </Link>{' '}
              across all firms.
            </p>
          </EmptyNote>
        </>
      )}

      {/* ————— Key facts ————— */}
      <ul className="mb-10 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
        {cheapest ? (
          <li className="sm:min-w-40">
            <Link
              href={`${reviewHref}#pricing`}
              className="group block h-full rounded-lg border border-line bg-card px-4 py-3 transition-colors hover:border-accent"
            >
              <span className="block text-[11px] font-bold tracking-wide text-ink-3 uppercase">
                Cheapest challenge
              </span>
              <span className="mt-0.5 block text-xl leading-tight font-black tabular-nums text-ink group-hover:text-accent-dark">
                {money(cheapest.price, cheapest.currency)}
              </span>
              {cheapest.accountSize != null ? (
                <span className="mt-0.5 block text-xs text-ink-3">
                  {compactMoney(cheapest.accountSize)} account
                </span>
              ) : null}
            </Link>
          </li>
        ) : null}
        {profitSplit != null ? (
          <li className="sm:min-w-40">
            <Link
              href={`${reviewHref}#payouts`}
              className="group block h-full rounded-lg border border-line bg-card px-4 py-3 transition-colors hover:border-accent"
            >
              <span className="block text-[11px] font-bold tracking-wide text-ink-3 uppercase">
                Profit split
              </span>
              <span className="mt-0.5 block text-xl leading-tight font-black tabular-nums text-ink group-hover:text-accent-dark">
                {profitSplit}%
              </span>
            </Link>
          </li>
        ) : null}
        {drawdown ? (
          <li className="sm:min-w-40">
            <Link
              href={`${reviewHref}#rules`}
              className="group block h-full rounded-lg border border-line bg-card px-4 py-3 transition-colors hover:border-accent"
            >
              <span className="block text-[11px] font-bold tracking-wide text-ink-3 uppercase">
                Drawdown
              </span>
              <span className="mt-0.5 block text-xl leading-tight font-black text-ink group-hover:text-accent-dark">
                {DRAWDOWN_LABELS[drawdown] ?? drawdown}
              </span>
            </Link>
          </li>
        ) : null}
        <AvailabilityChip restrictedIso2={restrictedIso2} href={`${reviewHref}#trust`} />
      </ul>

      <div className="space-y-6">
        {/* ————— What you get ————— */}
        {best ? (
          <SectionCard
            id="what-you-get"
            number={next()}
            kicker="The offer"
            title={`What the ${firm.name} code gets you`}
          >
            <dl className="grid gap-px overflow-hidden rounded-sm border border-line bg-line sm:grid-cols-2">
              <div className="bg-card px-4 py-3">
                <dt className="text-[11px] font-bold tracking-wide text-ink-3 uppercase">
                  Discount
                </dt>
                <dd className="mt-0.5 text-lg font-bold text-ink">{discountLabel(best)}</dd>
              </div>
              <div className="bg-card px-4 py-3">
                <dt className="text-[11px] font-bold tracking-wide text-ink-3 uppercase">Code</dt>
                <dd className="mt-0.5 text-lg font-bold tracking-wider text-ink select-all">
                  {best.code}
                </dd>
              </div>
              <div className="bg-card px-4 py-3">
                <dt className="text-[11px] font-bold tracking-wide text-ink-3 uppercase">
                  Expires
                </dt>
                <dd className="mt-0.5 text-lg font-bold text-ink">
                  {best.endDate ? formatDate(best.endDate) : 'No stated expiry'}
                </dd>
              </div>
              <div className="bg-card px-4 py-3">
                <dt className="text-[11px] font-bold tracking-wide text-ink-3 uppercase">
                  Availability
                </dt>
                <dd className="mt-0.5 text-lg font-bold text-ink">
                  {best.exclusive ? 'Exclusive to our readers' : 'Open to everyone'}
                </dd>
              </div>
              {best.extraPerks ? (
                <div className="bg-card px-4 py-3 sm:col-span-2">
                  <dt className="text-[11px] font-bold tracking-wide text-ink-3 uppercase">
                    Extra perks
                  </dt>
                  <dd className="mt-0.5 font-semibold text-positive">{best.extraPerks}</dd>
                </div>
              ) : null}
            </dl>
            {cheapest ? (
              <p className="mt-4 text-sm text-ink-2">
                Applied to the cheapest {firm.name} challenge (
                {money(cheapest.price, cheapest.currency)}
                {cheapest.accountSize != null
                  ? `, ${compactMoney(cheapest.accountSize)} account`
                  : ''}
                )
                {best.discountPct != null
                  ? `, that is about ${money(
                      Math.round(cheapest.price * (1 - best.discountPct / 100)),
                      cheapest.currency,
                    )}.`
                  : '.'}{' '}
                Firms sometimes exclude sizes or account types, so check the total before you pay.
              </p>
            ) : null}
          </SectionCard>
        ) : null}

        {/* ————— How to use it ————— */}
        {best ? (
          <SectionCard
            id="how-to-use"
            number={next()}
            kicker="How to use it"
            title={`Applying ${best.code} at checkout`}
            intro="Four steps, about a minute. The discount is applied by the firm, not by us, so always confirm it on the order total before paying."
          >
            <ol className="space-y-3">
              {[
                <>
                  Copy <code className="font-bold tracking-wider select-all">{best.code}</code> with
                  the button above, or select it and copy by hand.
                </>,
                <>
                  Open{' '}
                  {ctaUrl ? (
                    <a
                      href={ctaUrl}
                      target="_blank"
                      rel="nofollow noopener sponsored"
                      className="font-semibold text-accent-dark underline"
                    >
                      the {firm.name} site
                    </a>
                  ) : (
                    `the ${firm.name} site`
                  )}{' '}
                  in a new tab.
                </>,
                <>Pick your challenge type and account size, then go to checkout.</>,
                <>
                  Paste the code into the promo or coupon field and confirm the total has dropped
                  before you pay.
                </>,
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-accent-pale text-xs font-bold tabular-nums text-accent-dark"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-ink-2">{step}</span>
                </li>
              ))}
            </ol>
          </SectionCard>
        ) : null}

        {/* ————— Other active codes ————— */}
        {others.length > 0 ? (
          <SectionCard
            id="other-codes"
            number={next()}
            kicker="Other codes"
            title={`Other active ${firm.name} codes`}
            intro={`${discountLabel(best)} is the best ${firm.name} discount we have verified. These also work, and may suit a different account type.`}
          >
            <ul className="space-y-4">
              {others.map((promo) => (
                <li key={promo.id} className="rounded-sm border border-line bg-page p-4">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="text-xl font-black text-accent-dark">
                      {discountLabel(promo)}
                    </span>
                    <PromoBadges promo={promo} />
                  </div>
                  <CopyCode code={promo.code} size="sm" />
                  {promo.description ? (
                    <p className="mt-2 text-sm text-ink-2">{promo.description}</p>
                  ) : null}
                  {promo.extraPerks ? (
                    <p className="mt-1 text-sm font-semibold text-positive">
                      Plus: {promo.extraPerks}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </SectionCard>
        ) : null}

        {/* ————— Deal context ————— */}
        <SectionCard
          id="worth-it"
          number={next()}
          kicker="Is it worth it"
          title={`What you are actually buying at ${firm.name}`}
          intro="A discount only matters if the firm behind it is worth trading with. The short version, with the full working in our review."
        >
          <dl className="grid gap-px overflow-hidden rounded-sm border border-line bg-line sm:grid-cols-3">
            <div className="bg-card px-4 py-3">
              <dt className="text-[11px] font-bold tracking-wide text-ink-3 uppercase">
                Entry price
              </dt>
              <dd className="mt-0.5 text-lg font-bold tabular-nums text-ink">
                {cheapest ? money(cheapest.price, cheapest.currency) : 'Not published'}
              </dd>
            </div>
            <div className="bg-card px-4 py-3">
              <dt className="text-[11px] font-bold tracking-wide text-ink-3 uppercase">
                Profit split
              </dt>
              <dd className="mt-0.5 text-lg font-bold tabular-nums text-ink">
                {profitSplit != null ? `${profitSplit}%` : 'Not published'}
              </dd>
            </div>
            <div className="bg-card px-4 py-3">
              <dt className="text-[11px] font-bold tracking-wide text-ink-3 uppercase">
                Drawdown type
              </dt>
              <dd className="mt-0.5 text-lg font-bold text-ink">
                {drawdown ? (DRAWDOWN_LABELS[drawdown] ?? drawdown) : 'Not published'}
              </dd>
            </div>
          </dl>
          <p className="mt-4 max-w-(--container-prose) text-ink-2">
            Whether you can open an account at all depends on where you live. The availability card
            above answers that for your country, and the{' '}
            <Link
              href={`${reviewHref}#trust`}
              className="font-semibold text-accent-dark underline"
            >
              restricted countries list
            </Link>{' '}
            has the full picture.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button href={reviewHref} variant="secondary">
              Read the full {firm.name} review
            </Button>
            {PrimaryCta}
          </div>
        </SectionCard>
      </div>

      {/* ————— Honesty block ————— */}
      <aside
        aria-label="Affiliate disclosure"
        className="mt-8 rounded-lg border border-line bg-page p-5 text-sm text-ink-2"
      >
        <p className="mb-1 font-bold text-ink">How we make money, and what it does not buy</p>
        <p>
          {monetised
            ? `We may earn a commission if you buy a challenge after clicking through to ${firm.name}.`
            : `We may earn a commission on some firms we link to.`}{' '}
          It never affects rankings, scores, or which codes we list. A code appears here only after
          we have checked that it works, and it comes down the moment it stops.
        </p>
        <p className="mt-2">
          {firm.lastVerifiedAt
            ? `${firm.name} data verified ${formatDate(firm.lastVerifiedAt)}.`
            : `${firm.name} data is re-checked continuously.`}{' '}
          Found a code that does not work?{' '}
          <Link href="/methodology" className="font-semibold text-accent-dark underline">
            See how we verify
          </Link>
          .
        </p>
      </aside>
    </div>
  )
}
