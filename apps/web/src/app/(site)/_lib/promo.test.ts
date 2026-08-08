import { describe, expect, it } from 'vitest'
import { isAffiliateLink, outboundUrl, rankPromos } from './promo'

type P = Parameters<typeof rankPromos>[0][number]
const promo = (code: string, extra: Partial<P> = {}): P => ({
  code,
  discountPct: null,
  exclusive: null,
  extraPerks: null,
  ...extra,
})

const codes = (list: P[]) => rankPromos(list).map((p) => p.code)

describe('rankPromos', () => {
  it('puts the biggest discount first', () => {
    expect(
      codes([
        promo('SMALL', { discountPct: 10 }),
        promo('BIG', { discountPct: 45 }),
        promo('MID', { discountPct: 25 }),
      ]),
    ).toEqual(['BIG', 'MID', 'SMALL'])
  })

  it('treats a missing discount as 0 rather than dropping it', () => {
    const ranked = rankPromos([promo('NODISCOUNT'), promo('TEN', { discountPct: 10 })])
    expect(ranked.map((p) => p.code)).toEqual(['TEN', 'NODISCOUNT'])
    expect(ranked).toHaveLength(2)
  })

  it('breaks equal discounts on exclusivity, then perks, then code', () => {
    expect(
      codes([
        promo('PLAIN', { discountPct: 20 }),
        promo('PERKS', { discountPct: 20, extraPerks: 'free account on payout' }),
        promo('EXCL', { discountPct: 20, exclusive: true }),
      ]),
    ).toEqual(['EXCL', 'PERKS', 'PLAIN'])

    expect(codes([promo('ZULU', { discountPct: 5 }), promo('ALPHA', { discountPct: 5 })])).toEqual([
      'ALPHA',
      'ZULU',
    ])
  })

  it('does not mutate the input array', () => {
    const input = [promo('A', { discountPct: 1 }), promo('B', { discountPct: 99 })]
    rankPromos(input)
    expect(input.map((p) => p.code)).toEqual(['A', 'B'])
  })
})

describe('outboundUrl', () => {
  it('prefers the affiliate link', () => {
    expect(
      outboundUrl({ affiliateUrl: 'https://firm.com/?ref=pfs', websiteUrl: 'https://firm.com' }),
    ).toBe('https://firm.com/?ref=pfs')
  })

  it('falls back to the website when there is no affiliate link', () => {
    expect(outboundUrl({ affiliateUrl: null, websiteUrl: 'https://firm.com' })).toBe(
      'https://firm.com',
    )
    expect(outboundUrl({ affiliateUrl: '   ', websiteUrl: 'https://firm.com' })).toBe(
      'https://firm.com',
    )
  })

  it('returns null when there is no usable link', () => {
    expect(outboundUrl({ affiliateUrl: null, websiteUrl: null })).toBeNull()
    expect(outboundUrl({ affiliateUrl: '', websiteUrl: '  ' })).toBeNull()
  })
})

describe('isAffiliateLink', () => {
  it('only reports true for a real affiliate URL', () => {
    expect(isAffiliateLink({ affiliateUrl: 'https://firm.com/?ref=pfs' })).toBe(true)
    expect(isAffiliateLink({ affiliateUrl: null })).toBe(false)
    expect(isAffiliateLink({ affiliateUrl: '  ' })).toBe(false)
  })
})
