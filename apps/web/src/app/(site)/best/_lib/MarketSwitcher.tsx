'use client'

/**
 * Market switcher — rendered as its own darker strip under the main header
 * row (bg set by the layout). Tab-style links with an accent underline for
 * the active market; plain links, usePathname only drives active state.
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
    <nav
      aria-label="Markets"
      className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex w-max items-center gap-x-6 text-sm font-semibold">
        <li
          aria-hidden
          className="py-2.5 text-[11px] font-bold tracking-widest text-on-dark-2/60 uppercase"
        >
          Markets
        </li>
        {MARKETS.map((m) => {
          const active = pathname === m.href
          return (
            <li key={m.href}>
              <Link
                href={m.href}
                aria-current={active ? 'page' : undefined}
                className={`inline-block border-b-2 py-2.5 whitespace-nowrap transition-colors ${
                  active
                    ? 'border-accent text-accent'
                    : 'border-transparent text-on-dark-2 hover:border-line-dark hover:text-on-dark'
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
