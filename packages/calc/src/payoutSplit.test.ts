import { describe, expect, it } from 'vitest'
import { computePayoutSplit, effectiveSplitAfterPayouts } from './payoutSplit'

describe('computePayoutSplit', () => {
  it('splits gross profit at the base split', () => {
    const r = computePayoutSplit({ grossProfit: 10_000, splitPct: 80 })
    expect(r.effectiveSplitPct).toBe(80)
    expect(r.traderShare).toBe(8_000)
    expect(r.traderTake).toBe(8_000)
    expect(r.firmTake).toBe(2_000)
  })

  it('adds the fee refund on top of the trader share', () => {
    const r = computePayoutSplit({ grossProfit: 5_000, splitPct: 80, feeRefund: 499 })
    expect(r.traderShare).toBe(4_000)
    expect(r.traderTake).toBe(4_499)
    expect(r.firmTake).toBe(1_000)
  })

  it('trader and firm shares always sum to the gross', () => {
    const r = computePayoutSplit({ grossProfit: 1_000.01, splitPct: 33.33 })
    expect(r.traderShare + r.firmTake).toBeCloseTo(1_000.01, 2)
    expect(r.traderShare).toBe(333.3) // 333.3033 → 333.3
    expect(r.firmTake).toBe(666.71)
  })

  it('zero or negative gross profit produces no payout and no refund', () => {
    const zero = computePayoutSplit({ grossProfit: 0, splitPct: 80, feeRefund: 499 })
    expect(zero).toEqual({ effectiveSplitPct: 80, traderShare: 0, traderTake: 0, firmTake: 0 })

    const neg = computePayoutSplit({ grossProfit: -2_500, splitPct: 80, feeRefund: 499 })
    expect(neg.traderTake).toBe(0)
    expect(neg.firmTake).toBe(0)
  })

  it('handles 0% and 100% splits', () => {
    const none = computePayoutSplit({ grossProfit: 1_000, splitPct: 0 })
    expect(none.traderShare).toBe(0)
    expect(none.firmTake).toBe(1_000)

    const all = computePayoutSplit({ grossProfit: 1_000, splitPct: 100 })
    expect(all.traderShare).toBe(1_000)
    expect(all.firmTake).toBe(0)
  })

  it('applies scaling tiers based on completed payouts', () => {
    const tiers = [
      { afterPayouts: 2, splitPct: 90 },
      { afterPayouts: 4, splitPct: 100 },
    ]
    const base = { grossProfit: 1_000, splitPct: 80, scalingTiers: tiers }

    expect(computePayoutSplit({ ...base, payoutNumber: 1 }).effectiveSplitPct).toBe(80)
    expect(computePayoutSplit({ ...base, payoutNumber: 2 }).effectiveSplitPct).toBe(80)
    // after 2 completed payouts → payout #3 uses 90%
    expect(computePayoutSplit({ ...base, payoutNumber: 3 }).effectiveSplitPct).toBe(90)
    expect(computePayoutSplit({ ...base, payoutNumber: 4 }).effectiveSplitPct).toBe(90)
    expect(computePayoutSplit({ ...base, payoutNumber: 5 }).effectiveSplitPct).toBe(100)
    expect(computePayoutSplit({ ...base, payoutNumber: 50 }).effectiveSplitPct).toBe(100)
  })

  it('tier order in the input array does not matter', () => {
    const r = computePayoutSplit({
      grossProfit: 1_000,
      splitPct: 80,
      scalingTiers: [
        { afterPayouts: 4, splitPct: 100 },
        { afterPayouts: 2, splitPct: 90 },
      ],
      payoutNumber: 3,
    })
    expect(r.effectiveSplitPct).toBe(90)
  })

  it('an afterPayouts: 0 tier overrides the base split from the first payout', () => {
    const r = computePayoutSplit({
      grossProfit: 1_000,
      splitPct: 50,
      scalingTiers: [{ afterPayouts: 0, splitPct: 75 }],
    })
    expect(r.effectiveSplitPct).toBe(75)
    expect(r.traderShare).toBe(750)
  })

  it('rounds shares to cents', () => {
    const r = computePayoutSplit({ grossProfit: 333.33, splitPct: 85 })
    expect(r.traderShare).toBe(283.33) // 283.3305
    expect(r.firmTake).toBe(50)
  })

  it('rejects invalid inputs', () => {
    expect(() => computePayoutSplit({ grossProfit: 100, splitPct: -1 })).toThrow()
    expect(() => computePayoutSplit({ grossProfit: 100, splitPct: 101 })).toThrow()
    expect(() => computePayoutSplit({ grossProfit: 100, splitPct: 80, feeRefund: -5 })).toThrow()
    expect(() => computePayoutSplit({ grossProfit: 100, splitPct: 80, payoutNumber: 0 })).toThrow()
    expect(() => computePayoutSplit({ grossProfit: 100, splitPct: 80, payoutNumber: 1.5 })).toThrow()
    expect(() =>
      computePayoutSplit({
        grossProfit: 100,
        splitPct: 80,
        scalingTiers: [{ afterPayouts: -1, splitPct: 90 }],
      }),
    ).toThrow()
    expect(() =>
      computePayoutSplit({
        grossProfit: 100,
        splitPct: 80,
        scalingTiers: [{ afterPayouts: 2, splitPct: 120 }],
      }),
    ).toThrow()
  })
})

describe('effectiveSplitAfterPayouts', () => {
  it('returns the base split with no tiers', () => {
    expect(effectiveSplitAfterPayouts(80, [], 10)).toBe(80)
  })

  it('picks the highest qualifying tier', () => {
    const tiers = [
      { afterPayouts: 1, splitPct: 85 },
      { afterPayouts: 3, splitPct: 90 },
      { afterPayouts: 6, splitPct: 95 },
    ]
    expect(effectiveSplitAfterPayouts(80, tiers, 0)).toBe(80)
    expect(effectiveSplitAfterPayouts(80, tiers, 1)).toBe(85)
    expect(effectiveSplitAfterPayouts(80, tiers, 3)).toBe(90)
    expect(effectiveSplitAfterPayouts(80, tiers, 5)).toBe(90)
    expect(effectiveSplitAfterPayouts(80, tiers, 6)).toBe(95)
  })
})
