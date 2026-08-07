/**
 * Payout split calculator.
 *
 * Splits a gross payout between trader and firm, with optional challenge-fee
 * refund and optional scaling tiers that improve the split after a number of
 * completed payouts.
 *
 * Tier semantics: `{ afterPayouts: 3, splitPct: 90 }` means "once 3 payouts
 * are completed, subsequent payouts use a 90% split" — i.e. it applies from
 * payout #4 onward. `payoutNumber` (1-based, default 1) identifies which
 * payout is being computed; the tier with the highest `afterPayouts` that is
 * <= `payoutNumber − 1` wins, falling back to the base `splitPct`.
 *
 * Assumptions:
 * - If gross profit is <= 0 there is no payout: every output is 0 and the fee
 *   refund is not paid (firms only refund fees alongside a real payout).
 * - The fee refund is paid on top of the trader's share and never reduces the
 *   firm's share of the profit itself.
 *
 * Money is rounded to cents; firmTake is computed as the exact remainder
 * (grossProfit − traderShare) so the two shares always sum to the gross.
 */
export type ScalingTier = {
  /** Number of completed payouts after which this split applies, integer >= 0 */
  afterPayouts: number
  /** Split percentage for the trader, in [0, 100] */
  splitPct: number
}

export type PayoutSplitInput = {
  /** Gross profit being paid out */
  grossProfit: number
  /** Base trader split, in [0, 100] */
  splitPct: number
  /** Challenge-fee refund paid with this payout, >= 0 */
  feeRefund?: number
  /** Scaling tiers, any order */
  scalingTiers?: ScalingTier[]
  /** Which payout this is (1-based), integer >= 1; defaults to 1 */
  payoutNumber?: number
}

export type PayoutSplitResult = {
  /** Split actually applied to this payout after scaling tiers */
  effectiveSplitPct: number
  /** Trader's share of the profit (excluding refund) */
  traderShare: number
  /** traderShare + feeRefund */
  traderTake: number
  /** Firm's share of the profit */
  firmTake: number
}

export function computePayoutSplit(input: PayoutSplitInput): PayoutSplitResult {
  const { grossProfit, splitPct, scalingTiers = [] } = input
  const feeRefund = input.feeRefund ?? 0
  const payoutNumber = input.payoutNumber ?? 1

  if (splitPct < 0 || splitPct > 100) {
    throw new Error('splitPct must be in [0, 100]')
  }
  if (feeRefund < 0 || !Number.isFinite(feeRefund)) {
    throw new Error('feeRefund must be >= 0')
  }
  if (!Number.isInteger(payoutNumber) || payoutNumber < 1) {
    throw new Error('payoutNumber must be an integer >= 1')
  }
  for (const tier of scalingTiers) {
    if (!Number.isInteger(tier.afterPayouts) || tier.afterPayouts < 0) {
      throw new Error('tier.afterPayouts must be an integer >= 0')
    }
    if (tier.splitPct < 0 || tier.splitPct > 100) {
      throw new Error('tier.splitPct must be in [0, 100]')
    }
  }

  const effectiveSplitPct = effectiveSplitAfterPayouts(splitPct, scalingTiers, payoutNumber - 1)

  if (grossProfit <= 0 || !Number.isFinite(grossProfit)) {
    return { effectiveSplitPct, traderShare: 0, traderTake: 0, firmTake: 0 }
  }

  const traderShare = round2((grossProfit * effectiveSplitPct) / 100)
  const firmTake = round2(grossProfit - traderShare)
  const traderTake = round2(traderShare + feeRefund)

  return { effectiveSplitPct, traderShare, traderTake, firmTake }
}

/**
 * The split in force once `completedPayouts` payouts are done: the tier with
 * the highest `afterPayouts <= completedPayouts`, else the base split.
 */
export function effectiveSplitAfterPayouts(
  baseSplitPct: number,
  scalingTiers: ScalingTier[],
  completedPayouts: number,
): number {
  let split = baseSplitPct
  let bestThreshold = -1
  for (const tier of scalingTiers) {
    if (tier.afterPayouts <= completedPayouts && tier.afterPayouts > bestThreshold) {
      bestThreshold = tier.afterPayouts
      split = tier.splitPct
    }
  }
  return split
}

const round2 = (n: number) => Math.round(n * 100) / 100
