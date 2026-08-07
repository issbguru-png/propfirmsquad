import { describe, expect, it } from 'vitest'
import { checkConsistency } from './consistency'

describe('checkConsistency', () => {
  it('passes when best day is under the limit', () => {
    const r = checkConsistency({ dailyProfits: [100, 200, 300, 400], maxDayPct: 45 })
    expect(r.totalProfit).toBe(1000)
    expect(r.bestDay).toBe(400)
    expect(r.bestDayPct).toBe(40)
    expect(r.passes).toBe(true)
    expect(r.additionalProfitNeeded).toBe(0)
  })

  it('fails when one day dominates and computes profit needed', () => {
    const r = checkConsistency({ dailyProfits: [900, 100], maxDayPct: 30 })
    expect(r.passes).toBe(false)
    expect(r.bestDayPct).toBe(90)
    // 900 / (1000 + x) = 0.30 → x = 2000
    expect(r.additionalProfitNeeded).toBe(2000)
  })

  it('exactly at the limit passes', () => {
    const r = checkConsistency({ dailyProfits: [30, 70], maxDayPct: 70 })
    expect(r.bestDayPct).toBe(70)
    expect(r.passes).toBe(true)
  })

  it('handles losing/zero totals without dividing by zero', () => {
    const r = checkConsistency({ dailyProfits: [-50, 20], maxDayPct: 30 })
    expect(r.passes).toBe(false)
    expect(r.bestDayPct).toBe(0)
  })

  it('rejects invalid limits', () => {
    expect(() => checkConsistency({ dailyProfits: [1], maxDayPct: 0 })).toThrow()
    expect(() => checkConsistency({ dailyProfits: [1], maxDayPct: 101 })).toThrow()
  })
})
