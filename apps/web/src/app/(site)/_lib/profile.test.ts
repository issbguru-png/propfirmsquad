import { describe, expect, it } from 'vitest'
import {
  cheapestByFirm,
  computeTypeRank,
  leverageMatrix,
  scoreBreakdown,
  timeLimitSummary,
} from './profile'

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

describe('leverageMatrix', () => {
  it('returns null when there is nothing publishable', () => {
    expect(leverageMatrix(null)).toBeNull()
    expect(leverageMatrix([])).toBeNull()
    expect(leverageMatrix([{ asset: 'fx', ratio: null } as never])).toBeNull()
  })

  it('collapses account-wide figures to a single column', () => {
    const m = leverageMatrix([
      { asset: 'fx', programType: 'all', ratio: '1:100' },
      { asset: 'crypto', programType: 'all', ratio: '1:2' },
    ] as never)
    expect(m).toEqual({
      programs: ['all'],
      rows: [
        { asset: 'fx', ratios: ['1:100'] },
        { asset: 'crypto', ratios: ['1:2'] },
      ],
    })
  })

  it('orders program columns canonically and gaps missing cells', () => {
    const m = leverageMatrix([
      { asset: 'all', programType: '3-step', ratio: '1:30' },
      { asset: 'all', programType: '2-step', ratio: '1:100' },
      { asset: 'fx', programType: 'instant', ratio: '1:30' },
    ] as never)
    expect(m?.programs).toEqual(['instant', '2-step', '3-step'])
    expect(m?.rows).toEqual([
      { asset: 'all', ratios: [null, '1:100', '1:30'] },
      { asset: 'fx', ratios: ['1:30', null, null] },
    ])
  })

  it('treats a missing programType as account-wide', () => {
    const m = leverageMatrix([{ asset: 'fx', ratio: '1:50' }] as never)
    expect(m?.programs).toEqual(['all'])
    expect(m?.rows[0].ratios).toEqual(['1:50'])
  })
})

describe('timeLimitSummary', () => {
  it('stays null until the firm is flagged as verified', () => {
    expect(timeLimitSummary(undefined, [{ timeLimitDays: null }])).toBeNull()
    expect(timeLimitSummary({ timeLimitsVerified: false }, [{ timeLimitDays: 30 }])).toBeNull()
  })

  it('reads all-null challenges as unlimited once verified', () => {
    expect(
      timeLimitSummary({ timeLimitsVerified: true }, [{ timeLimitDays: null }, {}]),
    ).toEqual({ label: 'No time limit', unlimited: true })
  })

  it('reports a single shared limit, and flags mixed ones', () => {
    expect(
      timeLimitSummary({ timeLimitsVerified: true }, [
        { timeLimitDays: 30 },
        { timeLimitDays: 30 },
      ]),
    ).toEqual({ label: '30 days', unlimited: false })
    expect(
      timeLimitSummary({ timeLimitsVerified: true }, [
        { timeLimitDays: 30 },
        { timeLimitDays: null },
      ])?.label,
    ).toBe('Varies by program (see pricing)')
  })
})
