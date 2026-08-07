/**
 * Profit-target calculator.
 *
 * Given the account size and the profit target of each evaluation phase (with
 * the current balance reached in that phase), computes the dollars required
 * per phase, per-phase and overall progress, and the remaining amount.
 *
 * Assumptions:
 * - Every phase trades the same nominal account size and starts from it, so a
 *   phase's target in dollars is `accountSize × targetPct/100` and its profit
 *   so far is `currentBalance − accountSize`.
 * - Progress is clamped to [0, 100]: losses count as 0% progress and profit
 *   beyond the target does not overshoot past 100%.
 * - Overall progress weights phases by their dollar targets
 *   (`Σ achieved / Σ target`). A phase with a 0% target is trivially complete.
 *
 * Money is rounded to cents; percentages to two decimals.
 */
export type PhaseInput = {
  /** Phase label, e.g. "Phase 1" */
  phase: string
  /** Profit target as % of account size, in [0, 100] */
  targetPct: number
  /** Current balance reached in this phase */
  currentBalance: number
}

export type ProfitTargetInput = {
  /** Starting balance of each phase, > 0 */
  accountSize: number
  phases: PhaseInput[]
}

export type PhaseResult = {
  phase: string
  /** Profit required to pass the phase, in dollars */
  targetAmount: number
  /** Balance that passes the phase (accountSize + targetAmount) */
  targetBalance: number
  /** Profit counted toward the target, clamped to [0, targetAmount] */
  achieved: number
  /** Dollars still needed to pass the phase */
  remaining: number
  /** Progress toward the phase target, clamped to [0, 100] */
  progressPct: number
  complete: boolean
}

export type ProfitTargetResult = {
  phases: PhaseResult[]
  totalTargetAmount: number
  totalRemaining: number
  /** Dollar-weighted progress across all phases, in [0, 100] */
  overallProgressPct: number
}

export function computeProfitTarget({ accountSize, phases }: ProfitTargetInput): ProfitTargetResult {
  if (!Number.isFinite(accountSize) || accountSize <= 0) {
    throw new Error('accountSize must be > 0')
  }
  for (const p of phases) {
    if (p.targetPct < 0 || p.targetPct > 100) {
      throw new Error('targetPct must be in [0, 100]')
    }
  }

  let totalTarget = 0
  let totalAchieved = 0

  const phaseResults: PhaseResult[] = phases.map((p) => {
    const targetAmount = (accountSize * p.targetPct) / 100
    const targetBalance = accountSize + targetAmount
    const profit = p.currentBalance - accountSize
    const achieved = clamp(profit, 0, targetAmount)
    const remaining = targetAmount - achieved
    const progressPct = targetAmount > 0 ? (achieved / targetAmount) * 100 : 100

    totalTarget += targetAmount
    totalAchieved += achieved

    return {
      phase: p.phase,
      targetAmount: round2(targetAmount),
      targetBalance: round2(targetBalance),
      achieved: round2(achieved),
      remaining: round2(remaining),
      progressPct: round2(progressPct),
      complete: remaining <= 0,
    }
  })

  const overallProgressPct =
    totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : phases.length > 0 ? 100 : 0

  return {
    phases: phaseResults,
    totalTargetAmount: round2(totalTarget),
    totalRemaining: round2(totalTarget - totalAchieved),
    overallProgressPct: round2(overallProgressPct),
  }
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const round2 = (n: number) => Math.round(n * 100) / 100
