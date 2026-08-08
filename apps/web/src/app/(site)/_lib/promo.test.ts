import { describe, expect, it } from 'vitest'
import type { Firm, Promo } from '@/payload-types'
import {
  bestDiscountPct,
  countDealsByMarket,
  discountLabel,
  discountedPrice,
  filterDealsByMarket,
  isAffiliateLink,
  isDealMarket,
  outboundUrl,
  promoFirm,
  rankPromos,
} from './promo'

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

describe('discountLabel', () => {
  it('renders a percentage when we have one', () => {
    expect(discountLabel({ discountPct: 45 })).toBe('45% off')
  })

  it('never invents a number when the promo has no percentage', () => {
    expect(discountLabel({ discountPct: null })).toBe('Special offer')
    expect(discountLabel({ discountPct: undefined })).toBe('Special offer')
  })
})

describe('promoFirm', () => {
  const firm = { id: 7, name: 'FTMO' } as unknown as Firm

  it('returns the populated firm doc', () => {
    expect(promoFirm({ firm })).toBe(firm)
  })

  it('returns null for an unpopulated (depth-0) relation', () => {
    expect(promoFirm({ firm: 7 })).toBeNull()
    expect(promoFirm({ firm: null as unknown as number })).toBeNull()
  })
})

describe('discountedPrice', () => {
  it('applies the percentage and rounds to whole units', () => {
    expect(discountedPrice(299, 45)).toBe(164)
    expect(discountedPrice(100, 50)).toBe(50)
  })

  it('returns null rather than a made-up number when an input is missing', () => {
    expect(discountedPrice(null, 45)).toBeNull()
    expect(discountedPrice(299, null)).toBeNull()
    expect(discountedPrice(undefined, undefined)).toBeNull()
  })

  it('refuses nonsense percentages instead of showing a free or negative price', () => {
    expect(discountedPrice(299, 0)).toBeNull()
    expect(discountedPrice(299, 100)).toBeNull()
    expect(discountedPrice(299, 140)).toBeNull()
  })
})

describe('bestDiscountPct', () => {
  it('returns the largest percentage', () => {
    expect(bestDiscountPct([{ discountPct: 10 }, { discountPct: 50 }, { discountPct: 25 }])).toBe(50)
  })

  it('ignores promos with no percentage', () => {
    expect(bestDiscountPct([{ discountPct: null }, { discountPct: 20 }])).toBe(20)
  })

  it('returns null when nothing carries a percentage', () => {
    expect(bestDiscountPct([{ discountPct: null }])).toBeNull()
    expect(bestDiscountPct([])).toBeNull()
  })
})

describe('isDealMarket', () => {
  it('accepts only the three chips we render', () => {
    expect(isDealMarket('cfd')).toBe(true)
    expect(isDealMarket('futures')).toBe(true)
    expect(isDealMarket('crypto')).toBe(true)
    expect(isDealMarket('stocks')).toBe(false)
    expect(isDealMarket('../../etc')).toBe(false)
    expect(isDealMarket(undefined)).toBe(false)
  })
})

describe('filterDealsByMarket / countDealsByMarket', () => {
  const deal = (...firmTypes: NonNullable<Firm['firmTypes']>) => ({
    firm: { firmTypes } as Pick<Firm, 'firmTypes'>,
  })
  const deals = [deal('cfd'), deal('cfd', 'crypto'), deal('futures'), deal()]

  it('keeps every deal when no market is selected', () => {
    expect(filterDealsByMarket(deals, null)).toHaveLength(4)
  })

  it('keeps deals whose firm trades that market', () => {
    expect(filterDealsByMarket(deals, 'cfd')).toHaveLength(2)
    expect(filterDealsByMarket(deals, 'crypto')).toHaveLength(1)
    expect(filterDealsByMarket(deals, 'futures')).toHaveLength(1)
  })

  it('drops firms with no declared market rather than guessing one', () => {
    expect(filterDealsByMarket([deal()], 'cfd')).toEqual([])
  })

  it('counts each market independently, so multi-market firms count twice', () => {
    expect(countDealsByMarket(deals)).toEqual({ cfd: 2, futures: 1, crypto: 1 })
    expect(countDealsByMarket([])).toEqual({ cfd: 0, futures: 0, crypto: 0 })
  })

  it('counts match what the filter returns', () => {
    const counts = countDealsByMarket(deals)
    expect(filterDealsByMarket(deals, 'cfd')).toHaveLength(counts.cfd)
    expect(filterDealsByMarket(deals, 'crypto')).toHaveLength(counts.crypto)
  })
})

// Type-only guard: Promo is the real input shape for the promo helpers.
const _typeCheck = (p: Promo) => [discountLabel(p), promoFirm(p), bestDiscountPct([p])]
void _typeCheck
