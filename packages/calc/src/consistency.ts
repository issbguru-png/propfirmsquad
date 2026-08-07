/**
 * Consistency-rule calculator.
 *
 * Most prop firms define consistency as: no single trading day's profit may
 * exceed X% of total profit. Given daily profits and the firm's limit, report
 * whether the account passes and how much more total profit is needed to
 * bring the best day under the limit.
 */
export type ConsistencyInput = {
  dailyProfits: number[]
  /** Firm limit as a percentage, e.g. 30 for "no day > 30% of total profit" */
  maxDayPct: number
}

export type ConsistencyResult = {
  totalProfit: number
  bestDay: number
  bestDayPct: number
  passes: boolean
  /** Additional profit required (spread across other days) to pass; 0 if passing */
  additionalProfitNeeded: number
}

export function checkConsistency({ dailyProfits, maxDayPct }: ConsistencyInput): ConsistencyResult {
  if (maxDayPct <= 0 || maxDayPct > 100) {
    throw new Error('maxDayPct must be in (0, 100]')
  }
  const totalProfit = dailyProfits.reduce((a, b) => a + b, 0)
  const bestDay = dailyProfits.length ? Math.max(...dailyProfits) : 0

  if (totalProfit <= 0 || bestDay <= 0) {
    return { totalProfit, bestDay, bestDayPct: 0, passes: totalProfit > 0, additionalProfitNeeded: 0 }
  }

  const bestDayPct = (bestDay / totalProfit) * 100
  const passes = bestDayPct <= maxDayPct
  // bestDay / (totalProfit + x) = maxDayPct/100  →  x = bestDay*100/maxDayPct − totalProfit
  const additionalProfitNeeded = passes
    ? 0
    : Math.max(0, (bestDay * 100) / maxDayPct - totalProfit)

  return {
    totalProfit,
    bestDay,
    bestDayPct: round2(bestDayPct),
    passes,
    additionalProfitNeeded: round2(additionalProfitNeeded),
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100
