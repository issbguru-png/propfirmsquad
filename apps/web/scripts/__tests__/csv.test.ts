import { describe, expect, it } from 'vitest'
import { parseCsv, parseCsvRecords, parseFirmRow, toCsv } from '../lib/csv'

describe('parseCsv', () => {
  it('parses simple rows', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ])
  })

  it('handles quoted fields with commas, escaped quotes and newlines', () => {
    const text = 'name,desc\n"Acme, Inc","She said ""hi""\nsecond line"'
    expect(parseCsv(text)).toEqual([
      ['name', 'desc'],
      ['Acme, Inc', 'She said "hi"\nsecond line'],
    ])
  })

  it('handles CRLF line endings and trailing newline', () => {
    expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })
})

describe('parseCsvRecords', () => {
  it('keys rows by header and pads missing cells', () => {
    const { header, records } = parseCsvRecords('a,b,c\n1,2')
    expect(header).toEqual(['a', 'b', 'c'])
    expect(records).toEqual([{ a: '1', b: '2', c: '' }])
  })
})

describe('toCsv', () => {
  it('round-trips fields that need escaping', () => {
    const rows = [
      ['a', 'b'],
      ['comma, here', 'quote " and\nnewline'],
    ]
    expect(parseCsv(toCsv(rows))).toEqual(rows)
  })
})

describe('parseFirmRow', () => {
  const validRecord = {
    name: 'FundedNext',
    slug: 'fundednext',
    country: 'AE',
    dateEstablished: '2022-03-31',
    listingType: 'listed',
    reviewScore: '4.3',
    reviewsCount: '853',
    trustPilotScore: '4.5',
    likesCount: '75549',
    maxAllocation: '300000',
    currency: 'USD',
    programType: '1 Step|2_Steps|Instant',
    assets: 'fx|indices|otherCommodities|crypto',
    platforms: 'cTrader|MT4|MT5|Match Trader',
    isForexCategory: 'True',
    isFuturesCategory: 'False',
    isCryptoCategory: 'False',
    promoCode: 'MATCH',
    promoDiscount: '25',
    promoDesc: '25% off',
  }

  it('parses a valid pfm-firms row', () => {
    const result = parseFirmRow(validRecord)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.firm).toMatchObject({
      name: 'FundedNext',
      slug: 'fundednext',
      listingType: 'listed',
      firmTypes: ['cfd'],
      country: 'AE',
      currency: 'USD',
      maxAllocation: 300000,
      programTypes: ['1-step', '2-step', 'instant'],
      assets: ['fx', 'indices', 'other-commodities', 'crypto'],
      platformNames: ['cTrader', 'MT4', 'MT5', 'Match Trader'],
      reviewScore: 4.3,
      reviewsCount: 853,
      promo: { code: 'MATCH', discountPct: 25, description: '25% off' },
    })
    expect(result.firm.dateEstablished).toMatch(/^2022-03-31T/)
  })

  it('collapses crypto sub-assets into crypto without duplicates', () => {
    const result = parseFirmRow({ ...validRecord, assets: 'majors|altcoins|btcEth|defi|meme|fx' })
    expect(result.ok && result.firm.assets).toEqual(['crypto', 'fx'])
  })

  it('rejects missing name/slug and bad slug casing', () => {
    const missing = parseFirmRow({ ...validRecord, name: '', slug: '' })
    expect(missing.ok).toBe(false)
    if (!missing.ok) {
      expect(missing.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('name'), expect.stringContaining('slug')]),
      )
    }
    const badSlug = parseFirmRow({ ...validRecord, slug: 'Funded Next' })
    expect(badSlug.ok).toBe(false)
  })

  it('reports non-numeric and out-of-range numbers per field', () => {
    const result = parseFirmRow({ ...validRecord, reviewScore: '9', maxAllocation: 'lots' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.join(' ')).toContain('reviewScore')
    expect(result.errors.join(' ')).toContain('maxAllocation')
  })

  it('rejects invalid dates and listing types', () => {
    expect(parseFirmRow({ ...validRecord, dateEstablished: 'not-a-date' }).ok).toBe(false)
    expect(parseFirmRow({ ...validRecord, listingType: 'hidden' }).ok).toBe(false)
  })

  it('defaults firmTypes to cfd with a warning, omits promo when no code', () => {
    const result = parseFirmRow({
      ...validRecord,
      isForexCategory: 'False',
      promoCode: '',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.firm.firmTypes).toEqual(['cfd'])
    expect(result.warnings.some((w) => w.includes('firmTypes'))).toBe(true)
    expect(result.firm.promo).toBeUndefined()
  })

  it('warns on unknown program types and assets but still imports', () => {
    const result = parseFirmRow({ ...validRecord, programType: '5 Step|Instant', assets: 'fx|bonds' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.firm.programTypes).toEqual(['instant'])
    expect(result.firm.assets).toEqual(['fx'])
    expect(result.warnings.length).toBeGreaterThanOrEqual(2)
  })
})
