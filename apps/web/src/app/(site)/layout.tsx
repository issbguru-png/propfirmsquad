import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'
import { JsonLd } from '@/lib/seo/json-ld'
import { organizationLd } from '@/lib/seo/jsonld'
import { MarketSwitcher } from './best/_lib/MarketSwitcher'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'PropFirmSquad — Compare Prop Trading Firms with Real Data',
    template: '%s | PropFirmSquad',
  },
  description:
    'Compare prop trading firms with verified data: rules, payouts, rule-change history, and real trader reviews.',
}

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
        <header className="bg-nav text-on-dark">
          <div className="mx-auto flex max-w-(--container-page) flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4">
            <Link href="/" className="text-lg font-extrabold tracking-tight">
              PropFirm<span className="text-accent">Squad</span>
            </Link>
            <nav aria-label="Main">
              <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-semibold">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-on-dark transition-colors hover:text-accent-light"
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
        <main className="mx-auto max-w-(--container-page) px-4 py-10">{children}</main>
        <footer className="bg-footer mt-16 py-10 text-on-dark-2">
          <div className="mx-auto flex max-w-(--container-page) flex-col gap-6 px-4 text-sm">
            <nav aria-label="Footer">
              <ul className="flex flex-wrap gap-x-6 gap-y-2">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="transition-colors hover:text-on-dark">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <p className="max-w-(--container-prose)">
              Trading funded accounts involves risk, and evaluation fees are generally
              non-refundable unless stated. PropFirmSquad may earn a commission when you buy a
              challenge through our links — it never affects scores or rankings. See our{' '}
              <Link href="/methodology" className="underline hover:text-on-dark">
                methodology
              </Link>
              .
            </p>
            <p>© {new Date().getFullYear()} PropFirmSquad</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
