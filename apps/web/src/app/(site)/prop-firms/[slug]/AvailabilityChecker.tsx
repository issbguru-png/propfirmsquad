'use client'

/**
 * Country availability checker for firm profiles.
 * Server passes the firm's restricted-country ISO2 list; the trader picks
 * their country and gets an instant available / restricted answer.
 */
import { useEffect, useState } from 'react'
import { detectCountry } from './geo'
import { COUNTRIES, flagEmoji } from './countries'

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

  const isRestricted = Boolean(selected) && restricted.has(selected)
  const answered = Boolean(selected && name)

  return (
    <div className="mt-6 rounded-lg border border-line bg-page p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        {/* Picker */}
        <div className="min-w-0 flex-1 basis-64">
          <label htmlFor="availability-country" className="mb-2 block text-sm font-bold">
            Can you trade with {firmName} from your country?
          </label>
          {/*
            16px text on phones: anything smaller makes mobile Safari zoom the
            page on focus, and this select has ~200 options to scroll. Full
            width below sm so the tap area spans the card.
          */}
          <select
            id="availability-country"
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value)
              setAutoDetected(false)
            }}
            className="w-full rounded-sm border border-line bg-card px-3 py-2.5 text-base font-semibold transition-colors hover:border-accent focus:border-accent focus:outline-none sm:max-w-xs sm:py-2 sm:text-sm"
          >
            <option value="">Select your country…</option>
            {COUNTRIES.map(([iso2, label]) => (
              <option key={iso2} value={iso2}>
                {label}
              </option>
            ))}
          </select>
          {autoDetected ? (
            <p className="mt-2 max-w-sm text-xs leading-snug text-ink-3">
              Detected from your device&apos;s time zone. Change it above if that is wrong. We do
              not look up your IP address, and nothing leaves your browser.
            </p>
          ) : null}
        </div>

        {/* Verdict card with flag */}
        {answered ? (
          <div
            role="status"
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
              isRestricted
                ? 'border-negative/30 bg-negative-pale'
                : 'border-positive/30 bg-positive-pale'
            }`}
          >
            <span aria-hidden className="text-4xl leading-none">
              {flagEmoji(selected)}
            </span>
            <span className="leading-tight">
              <span
                className={`block text-sm font-extrabold ${
                  isRestricted ? 'text-negative' : 'text-positive'
                }`}
              >
                {isRestricted ? 'Not available' : 'Available'}
              </span>
              <span className="block text-xs font-semibold text-ink-2">{name}</span>
            </span>
          </div>
        ) : null}
      </div>

      {/* Detail line under both columns */}
      {answered ? (
        <p className="mt-4 border-t border-line pt-3 text-sm text-ink-2">
          {isRestricted ? (
            <>
              <span className="font-bold text-ink">{firmName} does not accept traders from {name}.</span>{' '}
              Buying a challenge from a restricted country usually voids payouts, so check the
              alternatives below instead.
            </>
          ) : (
            <>
              <span className="font-bold text-ink">
                {firmName} accepts traders from {name}.
              </span>{' '}
              {noneRecorded
                ? 'No restricted-country list is on record for this firm yet, so confirm eligibility at signup.'
                : 'Residency and KYC requirements still apply at payout.'}
            </>
          )}
        </p>
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
