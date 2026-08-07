import type { Metadata } from 'next'
import React from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'PropFirmSquad — Compare Prop Trading Firms with Real Data',
    template: '%s | PropFirmSquad',
  },
  description:
    'Compare prop trading firms with verified data: rules, payouts, rule-change history, and real trader reviews.',
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="bg-nav text-on-dark">
          <div className="mx-auto flex max-w-(--container-page) items-center justify-between px-4 py-4">
            <span className="text-lg font-extrabold tracking-tight">
              PropFirm<span className="text-accent">Squad</span>
            </span>
            <nav className="text-sm text-on-dark-2">Phase 0 scaffold</nav>
          </div>
        </header>
        <main className="mx-auto max-w-(--container-page) px-4 py-10">{children}</main>
        <footer className="bg-footer mt-16 py-8 text-center text-sm text-on-dark-2">
          © {new Date().getFullYear()} PropFirmSquad
        </footer>
      </body>
    </html>
  )
}
