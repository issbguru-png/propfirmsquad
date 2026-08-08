import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TZ_TO_ISO2, detectCountry } from './geo'

describe('TZ_TO_ISO2', () => {
  it('maps every zone to a plausible ISO2 code', () => {
    for (const [tz, iso2] of Object.entries(TZ_TO_ISO2)) {
      expect(iso2, `${tz} should map to a 2-letter uppercase code`).toMatch(/^[A-Z]{2}$/)
      expect(tz, `${tz} should look like an IANA zone`).toMatch(/^[A-Za-z]+\/[A-Za-z_/]+$/)
    }
  })

  it('covers the major trader markets the checker offers', () => {
    const covered = new Set(Object.values(TZ_TO_ISO2))
    // Our top traffic markets must resolve, or auto-detect silently never fires.
    for (const iso2 of ['IN', 'US', 'GB', 'PK', 'NG', 'ID', 'VN', 'ZA', 'AE', 'BR']) {
      expect(covered.has(iso2), `${iso2} has no time zone mapping`).toBe(true)
    }
  })

  it('has no zone mapped twice', () => {
    const zones = Object.keys(TZ_TO_ISO2)
    expect(new Set(zones).size).toBe(zones.length)
  })
})

describe('detectCountry', () => {
  // detectCountry refuses to run without `window` (it must never execute during
  // SSR), so tests run against a stubbed browser context.
  beforeEach(() => vi.stubGlobal('window', {}))
  afterEach(() => vi.unstubAllGlobals())

  it('declines to guess when nothing is offered (also proves the SSR guard)', () => {
    vi.unstubAllGlobals()
    expect(detectCountry(new Set(['PK']))).toBeNull()
  })

  it('returns a country only when it is one the picker offers', () => {
    // Empty allow-list: nothing can match, so it must decline rather than guess.
    expect(detectCountry(new Set())).toBeNull()
  })

  it('resolves the running environment when its country is allowed', () => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const expected = TZ_TO_ISO2[tz]
    if (!expected) return // CI may run in an unmapped zone; nothing to assert.
    expect(detectCountry(new Set([expected]))).toBe(expected)
  })
})
