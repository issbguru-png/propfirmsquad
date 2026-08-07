import { describe, expect, it } from 'vitest'
import { computeDrawdown } from './drawdown'

const base = {
  accountSize: 100_000,
  maxTotalDrawdownPct: 10,
  maxDailyLossPct: 5,
} as const

describe('computeDrawdown — static', () => {
  it('fixed floor at accountSize minus drawdown amount', () => {
    const r = computeDrawdown({
      ...base,
      drawdownType: 'static',
      currentBalance: 104_000,
      equity: 104_000,
    })
    expect(r.drawdownFloor).toBe(90_000)
    expect(r.remainingTotalDrawdown).toBe(14_000)
    expect(r.breached).toBe(false)
    expect(r.lockedAtInitial).toBe(false)
  })

  it('floor does not move up with profits (ignores high-water mark)', () => {
    const r = computeDrawdown({
      ...base,
      drawdownType: 'static',
      currentBalance: 120_000,
      highWaterMark: 120_000,
      startOfDayBalance: 98_000,
      equity: 95_000,
    })
    expect(r.drawdownFloor).toBe(90_000)
    expect(r.breached).toBe(false)
  })

  it('breaches when equity touches the floor exactly', () => {
    const r = computeDrawdown({
      ...base,
      drawdownType: 'static',
      currentBalance: 90_000,
      equity: 90_000,
    })
    expect(r.breached).toBe(true)
    expect(r.breachedBy).toBe('total')
    expect(r.remainingTotalDrawdown).toBe(0)
  })

  it('100% drawdown puts the floor at zero', () => {
    const r = computeDrawdown({
      accountSize: 50_000,
      drawdownType: 'static',
      maxTotalDrawdownPct: 100,
      currentBalance: 10,
      equity: 10,
    })
    expect(r.drawdownFloor).toBe(0)
    expect(r.breached).toBe(false)
  })
})

describe('computeDrawdown — trailing', () => {
  it('trailing-eod floor trails the high-water mark', () => {
    const r = computeDrawdown({
      ...base,
      drawdownType: 'trailing-eod',
      currentBalance: 103_000,
      highWaterMark: 105_000,
      equity: 102_000,
    })
    expect(r.drawdownFloor).toBe(95_000)
    expect(r.remainingTotalDrawdown).toBe(7_000)
    expect(r.lockedAtInitial).toBe(false)
  })

  it('locks at initial balance once the floor catches up (lock rule)', () => {
    const r = computeDrawdown({
      ...base,
      drawdownType: 'trailing-eod',
      currentBalance: 112_000,
      highWaterMark: 115_000,
      equity: 111_000,
    })
    // 115k − 10k = 105k, capped at initial 100k
    expect(r.drawdownFloor).toBe(100_000)
    expect(r.lockedAtInitial).toBe(true)
    expect(r.breached).toBe(false)
  })

  it('lock triggers exactly when hwm − dd equals initial balance', () => {
    const r = computeDrawdown({
      ...base,
      drawdownType: 'trailing-eod',
      currentBalance: 110_000,
      highWaterMark: 110_000,
      equity: 108_000,
    })
    expect(r.drawdownFloor).toBe(100_000)
    expect(r.lockedAtInitial).toBe(true)
  })

  it('high-water mark never drops below the initial balance', () => {
    const r = computeDrawdown({
      ...base,
      drawdownType: 'trailing-eod',
      currentBalance: 97_000,
      highWaterMark: 95_000, // invalid — below initial; clamped up
      equity: 97_000,
    })
    expect(r.drawdownFloor).toBe(90_000)
  })

  it('defaults the hwm from currentBalance when not provided', () => {
    const r = computeDrawdown({
      ...base,
      drawdownType: 'trailing-eod',
      currentBalance: 104_000,
      equity: 104_000,
    })
    expect(r.drawdownFloor).toBe(94_000)
  })

  it('trailing-intraday counts open equity highs in the default hwm', () => {
    const r = computeDrawdown({
      ...base,
      drawdownType: 'trailing-intraday',
      currentBalance: 100_000,
      equity: 106_000, // open profit sets a new intraday high
    })
    expect(r.drawdownFloor).toBe(96_000)
  })

  it('trailing-eod ignores open equity when defaulting the hwm', () => {
    const r = computeDrawdown({
      ...base,
      drawdownType: 'trailing-eod',
      currentBalance: 100_000,
      equity: 106_000,
    })
    expect(r.drawdownFloor).toBe(90_000)
  })

  it('the lock caps the floor at the initial balance, and dropping to it breaches', () => {
    const r = computeDrawdown({
      accountSize: 50_000,
      drawdownType: 'trailing-intraday',
      maxTotalDrawdownPct: 4,
      currentBalance: 51_000,
      highWaterMark: 52_500,
      equity: 49_900,
    })
    // raw floor = 52.5k − 2k = 50.5k, locked at initial 50k
    expect(r.drawdownFloor).toBe(50_000)
    expect(r.lockedAtInitial).toBe(true)
    expect(r.breached).toBe(true)
    expect(r.breachedBy).toBe('total')
    expect(r.remainingTotalDrawdown).toBe(-100)
  })
})

describe('computeDrawdown — daily loss', () => {
  it('daily floor anchors to start-of-day balance', () => {
    const r = computeDrawdown({
      ...base,
      drawdownType: 'static',
      currentBalance: 101_000,
      startOfDayBalance: 104_000,
      equity: 100_500,
    })
    expect(r.dailyLossFloor).toBe(99_000) // 104k − 5k
    expect(r.remainingDailyLoss).toBe(1_500)
    expect(r.breached).toBe(false)
  })

  it('defaults start-of-day to current balance', () => {
    const r = computeDrawdown({
      ...base,
      drawdownType: 'static',
      currentBalance: 102_000,
      equity: 101_000,
    })
    expect(r.dailyLossFloor).toBe(97_000)
    expect(r.remainingDailyLoss).toBe(4_000)
  })

  it('reports a daily breach when only the daily floor is hit', () => {
    const r = computeDrawdown({
      ...base,
      drawdownType: 'static',
      currentBalance: 100_000,
      startOfDayBalance: 100_000,
      equity: 95_000,
    })
    expect(r.breached).toBe(true)
    expect(r.breachedBy).toBe('daily')
    expect(r.remainingDailyLoss).toBe(0)
    expect(r.remainingTotalDrawdown).toBe(5_000)
  })

  it('attributes a double breach to the higher (first-hit) floor', () => {
    const r = computeDrawdown({
      ...base,
      drawdownType: 'static',
      currentBalance: 100_000,
      startOfDayBalance: 100_000,
      equity: 88_000, // below both 95k daily and 90k total floors
    })
    expect(r.breached).toBe(true)
    expect(r.breachedBy).toBe('daily') // 95k floor was hit before 90k
  })

  it('omitting maxDailyLossPct disables the daily rule', () => {
    const r = computeDrawdown({
      accountSize: 100_000,
      drawdownType: 'static',
      maxTotalDrawdownPct: 10,
      currentBalance: 96_000,
      equity: 94_000,
    })
    expect(r.dailyLossFloor).toBeNull()
    expect(r.remainingDailyLoss).toBeNull()
    expect(r.breached).toBe(false)
  })

  it('maxDailyLossPct of 0 disables the daily rule', () => {
    const r = computeDrawdown({
      ...base,
      maxDailyLossPct: 0,
      drawdownType: 'static',
      currentBalance: 95_000,
      equity: 95_000,
    })
    expect(r.dailyLossFloor).toBeNull()
  })
})

describe('computeDrawdown — validation', () => {
  const valid = {
    accountSize: 100_000,
    drawdownType: 'static',
    maxTotalDrawdownPct: 10,
    currentBalance: 100_000,
    equity: 100_000,
  } as const

  it('rejects non-positive account size', () => {
    expect(() => computeDrawdown({ ...valid, accountSize: 0 })).toThrow()
    expect(() => computeDrawdown({ ...valid, accountSize: -5_000 })).toThrow()
  })

  it('rejects out-of-range drawdown percentages', () => {
    expect(() => computeDrawdown({ ...valid, maxTotalDrawdownPct: 0 })).toThrow()
    expect(() => computeDrawdown({ ...valid, maxTotalDrawdownPct: 101 })).toThrow()
  })

  it('rejects out-of-range daily percentages', () => {
    expect(() => computeDrawdown({ ...valid, maxDailyLossPct: -1 })).toThrow()
    expect(() => computeDrawdown({ ...valid, maxDailyLossPct: 101 })).toThrow()
  })
})
