import { describe, expect, it } from 'vitest'
import { computeProfitTarget } from './profitTarget'

describe('computeProfitTarget', () => {
  it('computes dollar targets and progress for a two-phase evaluation', () => {
    const r = computeProfitTarget({
      accountSize: 100_000,
      phases: [
        { phase: 'Phase 1', targetPct: 8, currentBalance: 104_000 },
        { phase: 'Phase 2', targetPct: 5, currentBalance: 100_000 },
      ],
    })
    const [p1, p2] = r.phases
    expect(p1.targetAmount).toBe(8_000)
    expect(p1.targetBalance).toBe(108_000)
    expect(p1.achieved).toBe(4_000)
    expect(p1.remaining).toBe(4_000)
    expect(p1.progressPct).toBe(50)
    expect(p1.complete).toBe(false)

    expect(p2.targetAmount).toBe(5_000)
    expect(p2.achieved).toBe(0)
    expect(p2.progressPct).toBe(0)

    expect(r.totalTargetAmount).toBe(13_000)
    expect(r.totalRemaining).toBe(9_000)
    // 4000 / 13000 = 30.77%
    expect(r.overallProgressPct).toBe(30.77)
  })

  it('marks a phase complete exactly at the target balance', () => {
    const r = computeProfitTarget({
      accountSize: 50_000,
      phases: [{ phase: 'Phase 1', targetPct: 10, currentBalance: 55_000 }],
    })
    expect(r.phases[0].complete).toBe(true)
    expect(r.phases[0].progressPct).toBe(100)
    expect(r.phases[0].remaining).toBe(0)
    expect(r.overallProgressPct).toBe(100)
  })

  it('clamps overshoot at 100% and losses at 0%', () => {
    const r = computeProfitTarget({
      accountSize: 10_000,
      phases: [
        { phase: 'Overshoot', targetPct: 8, currentBalance: 12_000 },
        { phase: 'Underwater', targetPct: 8, currentBalance: 9_500 },
      ],
    })
    expect(r.phases[0].achieved).toBe(800)
    expect(r.phases[0].progressPct).toBe(100)
    expect(r.phases[1].achieved).toBe(0)
    expect(r.phases[1].progressPct).toBe(0)
    expect(r.phases[1].remaining).toBe(800)
    expect(r.overallProgressPct).toBe(50)
  })

  it('a 0% target phase is trivially complete', () => {
    const r = computeProfitTarget({
      accountSize: 25_000,
      phases: [{ phase: 'Funded', targetPct: 0, currentBalance: 25_000 }],
    })
    expect(r.phases[0].targetAmount).toBe(0)
    expect(r.phases[0].progressPct).toBe(100)
    expect(r.phases[0].complete).toBe(true)
    expect(r.overallProgressPct).toBe(100)
  })

  it('handles an empty phase list', () => {
    const r = computeProfitTarget({ accountSize: 100_000, phases: [] })
    expect(r.phases).toEqual([])
    expect(r.totalTargetAmount).toBe(0)
    expect(r.totalRemaining).toBe(0)
    expect(r.overallProgressPct).toBe(0)
  })

  it('rounds to cents and two-decimal percentages', () => {
    const r = computeProfitTarget({
      accountSize: 33_333,
      phases: [{ phase: 'P1', targetPct: 7.5, currentBalance: 34_000 }],
    })
    // target = 33333 × 7.5% = 2499.975
    expect(r.phases[0].targetAmount).toBe(2_499.98)
    expect(r.phases[0].achieved).toBe(667)
    // 667 / 2499.975 = 26.68%
    expect(r.phases[0].progressPct).toBe(26.68)
  })

  it('rejects invalid inputs', () => {
    expect(() => computeProfitTarget({ accountSize: 0, phases: [] })).toThrow()
    expect(() => computeProfitTarget({ accountSize: -100, phases: [] })).toThrow()
    expect(() =>
      computeProfitTarget({
        accountSize: 100_000,
        phases: [{ phase: 'P1', targetPct: -1, currentBalance: 100_000 }],
      }),
    ).toThrow()
    expect(() =>
      computeProfitTarget({
        accountSize: 100_000,
        phases: [{ phase: 'P1', targetPct: 101, currentBalance: 100_000 }],
      }),
    ).toThrow()
  })
})
