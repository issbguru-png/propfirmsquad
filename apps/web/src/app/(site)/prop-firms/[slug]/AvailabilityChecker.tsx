'use client'

/**
 * Country availability checker for firm profiles.
 * Server passes the firm's restricted-country ISO2 list; the trader picks
 * their country and gets an instant available / restricted answer.
 */
import { useEffect, useState } from 'react'
import { detectCountry } from './geo'

/** ~40 common trader countries (ISO2 → display name). */
const COUNTRIES: [string, string][] = [
  ['US', 'United States'],
  ['GB', 'United Kingdom'],
  ['IN', 'India'],
  ['PK', 'Pakistan'],
  ['NG', 'Nigeria'],
  ['ID', 'Indonesia'],
  ['VN', 'Vietnam'],
  ['MY', 'Malaysia'],
  ['PH', 'Philippines'],
  ['BR', 'Brazil'],
  ['ZA', 'South Africa'],
  ['AE', 'United Arab Emirates'],
  ['EG', 'Egypt'],
  ['TR', 'Türkiye'],
  ['DE', 'Germany'],
  ['FR', 'France'],
  ['ES', 'Spain'],
  ['IT', 'Italy'],
  ['NL', 'Netherlands'],
  ['CA', 'Canada'],
  ['AU', 'Australia'],
  ['KE', 'Kenya'],
  ['GH', 'Ghana'],
  ['BD', 'Bangladesh'],
  ['LK', 'Sri Lanka'],
  ['TH', 'Thailand'],
  ['MX', 'Mexico'],
  ['CO', 'Colombia'],
  ['AR', 'Argentina'],
  ['SA', 'Saudi Arabia'],
  ['MA', 'Morocco'],
  ['DZ', 'Algeria'],
  ['UA', 'Ukraine'],
  ['PL', 'Poland'],
  ['RO', 'Romania'],
  ['CZ', 'Czechia'],
  ['PT', 'Portugal'],
  ['SE', 'Sweden'],
  ['SG', 'Singapore'],
  ['HK', 'Hong Kong'],
]

export function AvailabilityChecker({
  firmName,
  restrictedIso2,
}: {
  firmName: string
  /** ISO2 codes the firm does NOT accept. Empty = none recorded (yet). */
  restrictedIso2: string[]
}) {
  const [selected, setSelected] = useState('')
  const [autoDetected, setAutoDetected] = useState(false)

  // Detect after mount so server and client HTML match (no hydration mismatch).
  useEffect(() => {
    const guess = detectCountry(new Set(COUNTRIES.map(([iso2]) => iso2)))
    if (guess) {
      setSelected(guess)
      setAutoDetected(true)
    }
  }, [])

  const restricted = new Set(restrictedIso2.map((c) => c.toUpperCase()))
  const name = COUNTRIES.find(([iso2]) => iso2 === selected)?.[1]
  const noneRecorded = restricted.size === 0

  return (
    <div className="mt-6 rounded-sm border border-line bg-page p-4">
      <label htmlFor="availability-country" className="mb-2 block text-sm font-bold">
        Can you trade with {firmName} from your country?
      </label>
      <select
        id="availability-country"
        value={selected}
        onChange={(e) => {
          setSelected(e.target.value)
          setAutoDetected(false)
        }}
        className="w-full max-w-xs rounded-sm border border-line bg-card px-3 py-2 text-sm font-semibold"
      >
        <option value="">Select your country…</option>
        {COUNTRIES.map(([iso2, label]) => (
          <option key={iso2} value={iso2}>
            {label}
          </option>
        ))}
      </select>
      {autoDetected ? (
        <p className="mt-1.5 text-xs text-ink-3">
          Detected from your device&apos;s time zone. Change it above if that is wrong. We do not
          look up your IP address, and nothing leaves your browser.
        </p>
      ) : null}
      {selected && name ? (
        restricted.has(selected) ? (
          <p role="status" className="mt-3 text-sm font-bold text-negative">
            ✗ Restricted: {firmName} does not accept traders from {name}.
          </p>
        ) : (
          <p role="status" className="mt-3 text-sm font-bold text-positive">
            ✓ Available for traders in {name}
            {noneRecorded ? (
              <span className="font-semibold text-ink-2">
                {' '}
                (no restrictions recorded yet; verify with the firm)
              </span>
            ) : null}
          </p>
        )
      ) : null}
      <noscript>
        <p className="mt-3 text-sm text-ink-2">
          This checker needs JavaScript. Restricted countries on record:{' '}
          {restrictedIso2.length > 0 ? restrictedIso2.join(', ') : 'none yet'}. Always verify
          eligibility with {firmName} before purchasing.
        </p>
      </noscript>
    </div>
  )
}
