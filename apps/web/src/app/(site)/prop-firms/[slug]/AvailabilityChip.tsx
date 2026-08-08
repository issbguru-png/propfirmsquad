'use client'

/**
 * Availability key-fact card. Sits alongside the server-rendered key facts and
 * answers "can I even use this firm?" before the reader scrolls.
 *
 * Renders nothing until the country is detected: no country means no honest
 * answer, and an empty slot beats a placeholder that implies one.
 */
import { useEffect, useState } from 'react'
import { detectCountry } from './geo'
import { COUNTRY_NAMES, flagEmoji } from './countries'

export function AvailabilityChip({ restrictedIso2 }: { restrictedIso2: string[] }) {
  const [iso2, setIso2] = useState<string | null>(null)

  useEffect(() => {
    setIso2(detectCountry(new Set(Object.keys(COUNTRY_NAMES))))
  }, [])

  if (!iso2) return null

  const restricted = new Set(restrictedIso2.map((c) => c.toUpperCase())).has(iso2)
  const name = COUNTRY_NAMES[iso2] ?? iso2

  return (
    <li className="sm:min-w-40">
      <a
        href="#trust"
        className={`group block h-full rounded-lg border px-4 py-3 transition-colors ${
          restricted
            ? 'border-negative/30 bg-negative-pale hover:border-negative'
            : 'border-line bg-card hover:border-accent'
        }`}
      >
        <span className="block text-[11px] font-bold tracking-wide text-ink-3 uppercase">
          In {name}
        </span>
        <span
          className={`mt-0.5 flex items-center gap-1.5 text-xl leading-tight font-black ${
            restricted ? 'text-negative' : 'text-ink group-hover:text-accent-dark'
          }`}
        >
          <span aria-hidden>{flagEmoji(iso2)}</span>
          {restricted ? 'Not available' : 'Available'}
        </span>
      </a>
    </li>
  )
}
