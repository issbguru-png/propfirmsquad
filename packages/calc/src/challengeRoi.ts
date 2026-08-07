/**
 * Challenge ROI calculator.
 *
 * Frames a prop-firm challenge purchase as a bet: you pay the challenge price
 * up front, and with probability `passRatePct` you reach a funded account that
 * pays `accountSize × avgMonthlyProfitPct% × profitSplitPct%` per month for
 * `months` months (default 1).
 *
 * Assumptions (documented, deliberately simple):
 * - Expected value ignores reset discounts, fee refunds, and the risk of
 *   blowing the funded account early — `months` is the horizon you expect the
 *   funded account to survive while hitting the average monthly return.
 * - Break-even pass rate is the pass probability at which the expected funded
 *   payout exactly covers the challenge price. It can exceed 100% (meaning
 *   the challenge can never break even under these assumptions) and is null
 *   when the expected funded payout is not positive.
 *
 * Money is rounded to cents; percentages to two decimals.
 */
export type ChallengeRoiInput = {
  /** Up-front cost of the challenge, >= 0 */
  challengePrice: number
  /** Account size (buying power) in dollars, > 0 */
  accountSize: number
  /** Trader's profit split, in [0, 100] */
  profitSplitPct: number
  /** Assumed probability of passing the challenge, in [0, 100] */
  passRatePct: number
  /** Average monthly profit on the funded account, as % of account size (may be negative) */
  avgMonthlyProfitPct: number
  /** Funded months the EV is computed over, > 0; defaults to 1 */
  months?: number
}

export type ChallengeRoiResult = {
  /** Challenge cost per $1,000 of buying power */
  costPer1k: number
  /** Trader's expected monthly payout once funded */
  monthlyPayoutIfFunded: number
  /** Total expected trader payout over `months`, conditional on passing */
  payoutIfFunded: number
  /** passRate × payoutIfFunded − challengePrice */
  expectedValue: number
  /** Pass rate (%) at which EV is zero; null when payoutIfFunded <= 0 */
  breakEvenPassRatePct: number | null
}

export function computeChallengeRoi(input: ChallengeRoiInput): ChallengeRoiResult {
  const { challengePrice, accountSize, profitSplitPct, passRatePct, avgMonthlyProfitPct } = input
  const months = input.months ?? 1

  if (!Number.isFinite(challengePrice) || challengePrice < 0) {
    throw new Error('challengePrice must be >= 0')
  }
  if (!Number.isFinite(accountSize) || accountSize <= 0) {
    throw new Error('accountSize must be > 0')
  }
  if (profitSplitPct < 0 || profitSplitPct > 100) {
    throw new Error('profitSplitPct must be in [0, 100]')
  }
  if (passRatePct < 0 || passRatePct > 100) {
    throw new Error('passRatePct must be in [0, 100]')
  }
  if (!Number.isFinite(months) || months <= 0) {
    throw new Error('months must be > 0')
  }

  const costPer1k = challengePrice / (accountSize / 1000)
  const monthlyPayoutIfFunded =
    ((accountSize * avgMonthlyProfitPct) / 100) * (profitSplitPct / 100)
  const payoutIfFunded = monthlyPayoutIfFunded * months
  const expectedValue = (passRatePct / 100) * payoutIfFunded - challengePrice

  const breakEvenPassRatePct =
    payoutIfFunded > 0 ? roundPct((challengePrice / payoutIfFunded) * 100) : null

  return {
    costPer1k: roundMoney(costPer1k),
    monthlyPayoutIfFunded: roundMoney(monthlyPayoutIfFunded),
    payoutIfFunded: roundMoney(payoutIfFunded),
    expectedValue: roundMoney(expectedValue),
    breakEvenPassRatePct,
  }
}

const roundMoney = (n: number) => Math.round(n * 100) / 100
const roundPct = (n: number) => Math.round(n * 100) / 100
