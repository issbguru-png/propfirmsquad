import { describe, expect, it } from 'vitest'
import { cheapestByFirm, computeTypeRank, scoreBreakdown } from './profile'

const firm = (id: number, firmTypes: string[]) =>
  ({ id, firmTypes }) as Parameters<typeof computeTypeRank>[0]

describe('computeTypeRank', () => {
  const firms = [
    firm(1, ['cfd']),
    firm(2, ['futures']),
    firm(3, ['cfd', 'crypto']),
    firm(4, ['cfd']),
  ]

  it('ranks within firms sharing the primary type only', () => {
    expect(computeTypeRank(firm(3, ['cfd', 'crypto']), firms)).toEqual({
      rank: 2,
      total: 3,
      type: 'cfd',
    })
    expect(computeTypeRank(firm(2, ['futures']), firms)).toEqual({
      rank: 1,
      total: 1,
      type: 'futures',
    })
  })

  it('returns null without a primary type or when the firm is missing', () => {
    expect(computeTypeRank(firm(1, []), firms)).toBeNull()
    expect(computeTypeRank(firm(99, ['cfd']), firms)).toBeNull()
  })
})

describe('cheapestByFirm', () => {
  it('keeps the cheapest row per firm across number and object relations', () => {
    const map = cheapestByFirm([
      { firm: 1, price: 100, currency: 'USD' },
      { firm: 1, price: 47.2, currency: 'USD' },
      { firm: { id: 2 } as never, price: 79, currency: 'EUR' },
      { firm: 2, price: 999, currency: 'EUR' },
    ])
    expect(map.get(1)).toEqual({ price: 47.2, currency: 'USD', accountSize: null })
    expect(map.get(2)).toEqual({ price: 79, currency: 'EUR', accountSize: null })
  })

  it('defaults currency to USD and ignores null prices', () => {
    const map = cheapestByFirm([{ firm: 3, price: 50, currency: null }])
    expect(map.get(3)).toEqual({ price: 50, currency: 'USD', accountSize: null })
    expect(cheapestByFirm([]).size).toBe(0)
  })
})

describe('scoreBreakdown', () => {
  it('returns rows in display order with a 1dp overall average', () => {
    const result = scoreBreakdown({
      pricingValue: 3.5,
      rulesFairness: 3.8,
      payoutReliability: 4.8,
      support: 4.6,
      platforms: 4.5,
    })
    expect(result?.rows.map((r) => r.key)).toEqual([
      'pricingValue',
      'rulesFairness',
      'payoutReliability',
      'support',
      'platforms',
    ])
    expect(result?.overall).toBe(4.2)
  })

  it('skips missing subscores and averages the rest', () => {
    const result = scoreBreakdown({ pricingValue: 4, payoutReliability: 5 })
    expect(result?.rows).toHaveLength(2)
    expect(result?.overall).toBe(4.5)
  })

  it('returns null when nothing is set', () => {
    expect(scoreBreakdown(undefined)).toBeNull()
    expect(scoreBreakdown({})).toBeNull()
  })
})
