import { describe, expect, it } from 'vitest'
import { computeChallengeRoi } from './challengeRoi'

describe('computeChallengeRoi', () => {
  it('computes cost per $1k of buying power', () => {
    const r = computeChallengeRoi({
      challengePrice: 500,
      accountSize: 100_000,
      profitSplitPct: 80,
      passRatePct: 10,
      avgMonthlyProfitPct: 4,
    })
    expect(r.costPer1k).toBe(5)
  })

  it('computes funded payout and EV over the default 1-month horizon', () => {
    const r = computeChallengeRoi({
      challengePrice: 500,
      accountSize: 100_000,
      profitSplitPct: 80,
      passRatePct: 10,
      avgMonthlyProfitPct: 4,
    })
    // monthly payout = 100k × 4% × 80% = 3200
    expect(r.monthlyPayoutIfFunded).toBe(3_200)
    expect(r.payoutIfFunded).toBe(3_200)
    // EV = 0.10 × 3200 − 500 = −180
    expect(r.expectedValue).toBe(-180)
    // break-even = 500 / 3200 = 15.63%
    expect(r.breakEvenPassRatePct).toBe(15.63)
  })

  it('scales the horizon with months', () => {
    const r = computeChallengeRoi({
      challengePrice: 500,
      accountSize: 100_000,
      profitSplitPct: 80,
      passRatePct: 10,
      avgMonthlyProfitPct: 4,
      months: 6,
    })
    expect(r.payoutIfFunded).toBe(19_200)
    expect(r.expectedValue).toBe(1_420)
    expect(r.breakEvenPassRatePct).toBe(2.6)
  })

  it('break-even can exceed 100% when the payout never covers the price', () => {
    const r = computeChallengeRoi({
      challengePrice: 1_000,
      accountSize: 10_000,
      profitSplitPct: 50,
      passRatePct: 100,
      avgMonthlyProfitPct: 2,
    })
    // payout = 10k × 2% × 50% = 100 → break-even 1000%
    expect(r.breakEvenPassRatePct).toBe(1_000)
    expect(r.expectedValue).toBe(-900)
  })

  it('returns null break-even when the funded payout is zero or negative', () => {
    const zeroSplit = computeChallengeRoi({
      challengePrice: 100,
      accountSize: 50_000,
      profitSplitPct: 0,
      passRatePct: 50,
      avgMonthlyProfitPct: 5,
    })
    expect(zeroSplit.breakEvenPassRatePct).toBeNull()
    expect(zeroSplit.expectedValue).toBe(-100)

    const losing = computeChallengeRoi({
      challengePrice: 100,
      accountSize: 50_000,
      profitSplitPct: 80,
      passRatePct: 50,
      avgMonthlyProfitPct: -2,
    })
    expect(losing.breakEvenPassRatePct).toBeNull()
    // EV = 0.5 × (50k × −2% × 80%) − 100 = −500
    expect(losing.expectedValue).toBe(-500)
  })

  it('handles a free challenge', () => {
    const r = computeChallengeRoi({
      challengePrice: 0,
      accountSize: 25_000,
      profitSplitPct: 90,
      passRatePct: 20,
      avgMonthlyProfitPct: 3,
    })
    expect(r.costPer1k).toBe(0)
    expect(r.breakEvenPassRatePct).toBe(0)
    expect(r.expectedValue).toBe(135) // 0.2 × (25k × 3% × 90%) = 135
  })

  it('handles a 0% pass rate', () => {
    const r = computeChallengeRoi({
      challengePrice: 250,
      accountSize: 50_000,
      profitSplitPct: 80,
      passRatePct: 0,
      avgMonthlyProfitPct: 5,
    })
    expect(r.expectedValue).toBe(-250)
  })

  it('rounds money to cents', () => {
    const r = computeChallengeRoi({
      challengePrice: 99.99,
      accountSize: 33_333,
      profitSplitPct: 77.7,
      passRatePct: 12.5,
      avgMonthlyProfitPct: 3.33,
    })
    // costPer1k = 99.99 / 33.333 = 2.99997 → 3
    expect(r.costPer1k).toBe(3)
    // monthly = 33333 × 0.0333 × 0.777 = 862.4614...
    expect(r.monthlyPayoutIfFunded).toBe(862.46)
  })

  it('rejects invalid inputs', () => {
    const valid = {
      challengePrice: 100,
      accountSize: 10_000,
      profitSplitPct: 80,
      passRatePct: 50,
      avgMonthlyProfitPct: 5,
    }
    expect(() => computeChallengeRoi({ ...valid, challengePrice: -1 })).toThrow()
    expect(() => computeChallengeRoi({ ...valid, accountSize: 0 })).toThrow()
    expect(() => computeChallengeRoi({ ...valid, accountSize: -100 })).toThrow()
    expect(() => computeChallengeRoi({ ...valid, profitSplitPct: -1 })).toThrow()
    expect(() => computeChallengeRoi({ ...valid, profitSplitPct: 101 })).toThrow()
    expect(() => computeChallengeRoi({ ...valid, passRatePct: -1 })).toThrow()
    expect(() => computeChallengeRoi({ ...valid, passRatePct: 100.5 })).toThrow()
    expect(() => computeChallengeRoi({ ...valid, months: 0 })).toThrow()
    expect(() => computeChallengeRoi({ ...valid, months: -3 })).toThrow()
  })
})
