import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { SectionKicker } from '@/components'
import { JsonLd } from '@/lib/seo/json-ld'
import { breadcrumbLd, personLd } from '@/lib/seo/jsonld'
import { staticPageMeta } from '@/lib/seo/metadata'

export const dynamic = 'force-dynamic'

export function generateMetadata(): Metadata {
  return staticPageMeta(
    'About PropFirmSquad: Who Reviews These Firms and Why',
    '/about',
    'PropFirmSquad is an independent prop firm comparison site. Every firm is reviewed by Ayub Rana, a Chartered Accountant and forex trader, against a published methodology.',
  )
}

/** Live counts, so this page describes the database as it actually is today. */
async function getStats() {
  try {
    const payload = await getPayload({ config })
    const [firms, challenges, countries, risk, promos] = await Promise.all([
      payload.count({ collection: 'firms', where: { listingType: { equals: 'listed' } } }),
      payload.count({ collection: 'challenges', where: { isActive: { equals: true } } }),
      payload.count({ collection: 'countries' }),
      payload.count({ collection: 'firms', where: { listingType: { equals: 'delisted' } } }),
      payload.count({ collection: 'promos', where: { active: { equals: true } } }),
    ])
    return {
      firms: firms.totalDocs,
      challenges: challenges.totalDocs,
      countries: countries.totalDocs,
      risk: risk.totalDocs,
      promos: promos.totalDocs,
    }
  } catch {
    return null
  }
}

const SECTIONS = [
  'Who reviews these firms',
  'Why this site exists',
  'What we do differently',
  'How we make money',
  'Get in touch',
] as const

export default async function AboutPage() {
  const stats = await getStats()

  return (
    <div>
      <JsonLd data={personLd()} />
      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', path: '/' },
          { name: 'About', path: '/about' },
        ])}
      />

      {/* Hero */}
      <div className="max-w-(--container-prose)">
        <h1 className="mb-4 text-4xl font-black tracking-tight sm:text-5xl">
          One trader, reading the fine print so you do not have to
        </h1>
        <p className="text-lg text-ink-2">
          PropFirmSquad compares prop trading firms using data you can check yourself. Every number
          on this site has a date on it, and most have a source link next to it.
        </p>
      </div>

      {/* Live stats */}
      {stats ? (
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: 'Firms reviewed', value: stats.firms },
            { label: 'Challenges priced', value: stats.challenges },
            { label: 'Countries tracked', value: stats.countries },
            { label: 'Codes verified', value: stats.promos },
            { label: 'Firms on the risk list', value: stats.risk },
          ].map((s) => (
            <li key={s.label} className="rounded-lg border border-line bg-card px-4 py-3">
              <span className="block text-2xl font-black tabular-nums">{s.value}</span>
              <span className="mt-0.5 block text-[11px] font-bold tracking-wide text-ink-3 uppercase">
                {s.label}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-12 max-w-(--container-prose) space-y-12">
        {/* 01 Who reviews */}
        <section id="who" className="scroll-mt-24">
          <SectionKicker number={1} className="mb-2">
            {SECTIONS[0]}
          </SectionKicker>
          <h2 className="mb-4 text-2xl font-extrabold tracking-tight">
            Every firm here is reviewed by one named person
          </h2>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <img
              src="/ayub-rana.png"
              alt="Ayub Rana, Chartered Accountant and forex trader"
              width={104}
              height={104}
              className="h-26 w-26 shrink-0 rounded-lg bg-accent-pale object-cover"
            />
            <div className="space-y-3 text-ink-2">
              <p>
                <strong className="text-ink">Ayub Rana</strong> is a Chartered Accountant and has
                traded forex since 2018, specialising in ICT and smart money concepts. He has
                published over 100 trading guides read by more than 300,000 traders.
              </p>
              <p>
                That combination is the whole point of this site. Reading a prop firm&apos;s terms
                is an audit problem before it is a trading problem: the payout clause, the
                consistency cap and the drawdown definition decide whether you keep your money, and
                they are written to be skimmed past. Ayub reads them the way he was trained to read
                a balance sheet, then trades the accounts himself.
              </p>
              <p>
                No content team, no ghostwriters, no firm-supplied copy.{' '}
                <a
                  href="https://ayubrana.com/"
                  target="_blank"
                  rel="noopener"
                  className="font-semibold text-accent-dark underline"
                >
                  More about Ayub
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        {/* 02 Why */}
        <section id="why" className="scroll-mt-24">
          <SectionKicker number={2} className="mb-2">
            {SECTIONS[1]}
          </SectionKicker>
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight">
            Most prop firm &ldquo;reviews&rdquo; are coupon pages
          </h2>
          <div className="space-y-3 text-ink-2">
            <p>
              The pattern is easy to spot once you know it. A site lists five hundred firms nobody
              has tested, ranks them by whoever pays the largest commission, and calls the result a
              review. Rules change quietly, firms close, and the page never updates because nobody
              was ever checking.
            </p>
            <p>
              We went the other way: fewer firms, reviewed properly. {stats?.firms ?? 16} firms with
              real pricing, audited rules and payout terms, plus a short list of firms that closed
              or drew regulatory action, each linked to the actual filing.
            </p>
          </div>
        </section>

        {/* 03 Differently */}
        <section id="different" className="scroll-mt-24">
          <SectionKicker number={3} className="mb-2">
            {SECTIONS[2]}
          </SectionKicker>
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight">
            Claims you can check, not claims you have to trust
          </h2>
          <p className="mb-4 text-ink-2">
            Anyone can write &ldquo;independent and unbiased&rdquo; on a page. These are the things
            on this site you can actually verify for yourself right now.
          </p>
          <ul className="space-y-3">
            {[
              {
                title: 'A date on every firm',
                body: 'Each profile shows when we last worked on it, and we explain exactly what that timestamp does and does not mean.',
                href: '/methodology',
                cta: 'Read the methodology',
              },
              {
                title: 'Sources on the risk list',
                body: 'Firms that closed or faced regulatory action link to the regulator filing or the firm announcement itself. No source, no entry.',
                href: '/',
                cta: 'See the risk table',
              },
              {
                title: 'Published subscores',
                body: 'Five scores per firm with the arithmetic shown, so you can average them yourself and check our number matches.',
                href: '/prop-firms',
                cta: 'Browse the firms',
              },
              {
                title: 'The fine print, surfaced',
                body: 'Where a challenge advertises one price but costs another after passing, the pricing table carries a footnote with the real total.',
                href: '/prop-firms/the-5-ers',
                cta: 'See an example',
              },
              {
                title: 'Gaps left visible',
                body: 'When we cannot confirm something on a firm’s own site, the page says "Being verified" instead of guessing.',
                href: '/methodology',
                cta: 'How we source data',
              },
            ].map((item) => (
              <li key={item.title} className="rounded-lg border border-line bg-card p-4">
                <h3 className="font-bold">{item.title}</h3>
                <p className="mt-1 text-sm text-ink-2">{item.body}</p>
                <Link
                  href={item.href}
                  className="mt-2 inline-block text-sm font-semibold text-accent-dark hover:underline"
                >
                  {item.cta} →
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* 04 Money */}
        <section id="money" className="scroll-mt-24">
          <SectionKicker number={4} className="mb-2">
            {SECTIONS[3]}
          </SectionKicker>
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight">
            Affiliate commissions, and nothing else
          </h2>
          <div className="space-y-3 text-ink-2">
            <p>
              When you buy a challenge through one of our links, the firm may pay us a commission.
              That is how the research gets funded, and it is disclosed on every page where it
              applies.
            </p>
            <p>
              What it does not do is move anything. List order comes from the trader rating, review
              count and Trustpilot score, and there is no commercial field anywhere in that sort. If
              a firm offered to pay for a higher position, the answer would be no, and we would
              publish the request.
            </p>
            <p>
              The clearest proof is the risk list on our home page: some of those firms would have
              earned us money.{' '}
              <Link href="/methodology" className="font-semibold text-accent-dark underline">
                The full process is published
              </Link>
              .
            </p>
          </div>
        </section>

        {/* 05 Contact */}
        <section id="contact" className="scroll-mt-24">
          <SectionKicker number={5} className="mb-2">
            {SECTIONS[4]}
          </SectionKicker>
          <h2 className="mb-3 text-2xl font-extrabold tracking-tight">
            Corrections, payout proofs, and firms we have missed
          </h2>
          <div className="space-y-3 text-ink-2">
            <p>
              If something here is wrong, we want to know, and that includes firms writing in about
              their own entry. Send corrections with a source and we will check them against the
              firm&apos;s own materials and update the page.
            </p>
            <p>
              A dedicated contact form is not live yet, so being straight about it: for now the
              reliable route is{' '}
              <a
                href="https://ayubrana.com/"
                target="_blank"
                rel="noopener"
                className="font-semibold text-accent-dark underline"
              >
                ayubrana.com
              </a>
              , where Ayub&apos;s contact and social links are published.
            </p>
            <p className="text-sm">
              Payout proofs are especially welcome. Dated screenshots of real payouts are what turn
              a firm&apos;s advertised payout terms into something we can actually verify.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
