import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'
import { JsonLd } from '@/lib/seo/json-ld'
import { organizationLd } from '@/lib/seo/jsonld'
import { MarketSwitcher } from './best/_lib/MarketSwitcher'
import { Analytics } from './_lib/Analytics'
import { Logomark } from '@/components/Logo'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'PropFirmSquad: Compare Prop Trading Firms with Real Data',
    template: '%s | PropFirmSquad',
  },
  description:
    'Compare prop trading firms with verified data: rules, payouts, rule-change history, and real trader reviews.',
}

/** Footer sitemap. Every href must be a route that exists (no dead links). */
const FOOTER_COLUMNS = [
  {
    heading: 'Prop firms',
    links: [
      { href: '/prop-firms', label: 'All prop firms' },
      { href: '/best/cfd-prop-firms', label: 'Best CFD / Forex firms' },
      { href: '/best/futures-prop-firms', label: 'Best futures firms' },
      { href: '/best/crypto-prop-firms', label: 'Best crypto firms' },
      { href: '/deals', label: 'Promo codes & deals' },
    ],
  },
  {
    heading: 'Free tools',
    links: [
      { href: '/tools/consistency-calculator', label: 'Consistency calculator' },
      { href: '/tools/drawdown-calculator', label: 'Drawdown calculator' },
      { href: '/tools/challenge-roi-calculator', label: 'Challenge ROI calculator' },
      { href: '/tools/payout-split-calculator', label: 'Payout split calculator' },
      { href: '/tools', label: 'All calculators' },
    ],
  },
  {
    heading: 'Learn',
    links: [
      { href: '/learn/what-is-a-prop-firm', label: 'What is a prop firm?' },
      { href: '/learn/consistency-rule-explained', label: 'Consistency rule explained' },
      { href: '/learn/trailing-drawdown-explained', label: 'Trailing drawdown explained' },
      { href: '/learn', label: 'All guides' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { href: '/about', label: 'About us' },
      { href: '/methodology', label: 'How we rank' },
      { href: '/best', label: 'All rankings' },
    ],
  },
] as const

const NAV = [
  { href: '/prop-firms', label: 'Prop Firms' },
  { href: '/deals', label: 'Deals' },
  { href: '/methodology', label: 'Methodology' },
  { href: '/about', label: 'About' },
] as const

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <JsonLd data={organizationLd()} />
        <Analytics />
        <header className="bg-nav text-on-dark">
          <div className="mx-auto flex max-w-(--container-page) flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4">
            <Link href="/" className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight">
              <Logomark />
              <span>
                PropFirm<span className="text-accent">Squad</span>
              </span>
            </Link>
            <nav aria-label="Main">
              <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-semibold">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="inline-block py-3 text-on-dark transition-colors hover:text-accent-light sm:py-0"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <div className="border-t border-line-dark bg-dark-section">
            <div className="mx-auto max-w-(--container-page) px-4">
              <MarketSwitcher />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-(--container-page) px-4 py-6 sm:py-10">{children}</main>
        <footer className="bg-footer mt-16 text-on-dark-2">
          <div className="mx-auto max-w-(--container-page) px-4 py-12">
            {/* Brand + link columns */}
            <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-6">
              <div className="lg:col-span-2">
                <Link
                  href="/"
                  className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-on-dark"
                >
                  <Logomark />
                  <span>
                    PropFirm<span className="text-accent">Squad</span>
                  </span>
                </Link>
                <p className="mt-3 max-w-sm text-sm">
                  The top prop firms reviewed deeply, not five hundred listed shallowly. Verified
                  rules, real payout data, and rankings that are never for sale.
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <img
                    src="/ayub-rana.png"
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full bg-accent-pale object-cover"
                  />
                  <p className="text-sm leading-tight">
                    <span className="block font-semibold text-on-dark">
                      Reviewed by Ayub Rana
                    </span>
                    <span className="text-xs">Chartered Accountant &amp; Forex Trader</span>
                  </p>
                </div>
              </div>

              {FOOTER_COLUMNS.map((col) => (
                <nav key={col.heading} aria-label={col.heading}>
                  <h2 className="mb-3 text-xs font-bold tracking-widest text-on-dark uppercase">
                    {col.heading}
                  </h2>
                  {/*
                    Footer links are the densest tap targets on the site (374 of
                    them across the sweep, 17px tall each). Padding on the anchor
                    plus a tighter list gap gives ~36px targets on a ~40px pitch
                    without doubling the footer's height on a phone. Desktop keeps
                    the original 17px/space-y-2 rhythm.
                  */}
                  <ul className="space-y-1 text-sm sm:space-y-2">
                    {col.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="inline-block py-2 transition-colors hover:text-accent-light sm:py-0"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>

            {/* Disclosures */}
            <div className="mt-10 border-t border-line-dark pt-6 text-xs leading-relaxed">
              <p className="max-w-(--container-prose)">
                <strong className="text-on-dark">Risk warning.</strong> Trading leveraged
                instruments carries a high risk of loss and is not suitable for everyone. Evaluation
                fees are generally non-refundable unless a firm states otherwise. Nothing on this
                site is financial advice; always read a firm&apos;s terms before buying a challenge.
              </p>
              <p className="mt-3 max-w-(--container-prose)">
                <strong className="text-on-dark">Affiliate disclosure.</strong> PropFirmSquad may
                earn a commission when you buy a challenge through our links. Commissions never
                influence scores, rankings, or what we publish. Read our{' '}
                <Link href="/methodology" className="underline hover:text-on-dark">
                  ranking methodology
                </Link>
                .
              </p>
            </div>

            {/* Bottom bar */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line-dark pt-6 text-xs">
              <p>© {new Date().getFullYear()} PropFirmSquad. All rights reserved.</p>
              <p>
                Data verified continuously. Every page shows its own last-checked date.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
