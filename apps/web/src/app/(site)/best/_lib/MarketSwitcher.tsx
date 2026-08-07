'use client'

/**
 * Compact market switcher for the site header — All (home) plus the three
 * /best hubs. Plain links; usePathname only drives the active state.
 */
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const MARKETS = [
  { href: '/', label: 'All markets' },
  { href: '/best/cfd-prop-firms', label: 'CFD / Forex' },
  { href: '/best/futures-prop-firms', label: 'Futures' },
  { href: '/best/crypto-prop-firms', label: 'Crypto' },
] as const

export function MarketSwitcher() {
  const pathname = usePathname()
  return (
    <nav aria-label="Markets" className="overflow-x-auto">
      <ul className="flex w-max items-center gap-1.5 rounded-full border border-line-dark bg-dark-section p-1 text-xs font-semibold">
        {MARKETS.map((m) => {
          const active = pathname === m.href
          return (
            <li key={m.href}>
              <Link
                href={m.href}
                aria-current={active ? 'page' : undefined}
                className={`inline-block rounded-full px-3 py-1 whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-accent text-nav'
                    : 'text-on-dark-2 hover:bg-nav hover:text-on-dark'
                }`}
              >
                {m.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
