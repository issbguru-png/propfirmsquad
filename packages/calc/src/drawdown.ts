/**
 * Drawdown calculator.
 *
 * Computes the account's loss limits ("floors") under the three drawdown
 * models prop firms use:
 *
 * - `static`: the total-drawdown floor is fixed at
 *   `accountSize − accountSize × maxTotalDrawdownPct/100` and never moves.
 * - `trailing-eod`: the floor trails the highest *end-of-day balance*
 *   (the high-water mark): `floor = highWaterMark − drawdownAmount`.
 * - `trailing-intraday`: identical formula, but the high-water mark is the
 *   highest *equity* ever reached, including unrealized profit on open trades.
 *
 * Lock-at-initial-balance assumption (common firm rule, e.g. most futures
 * firms): a trailing floor stops trailing once it reaches the initial account
 * balance — i.e. `floor = min(accountSize, highWaterMark − drawdownAmount)`.
 * Once locked, further highs never raise the floor above the starting balance.
 *
 * Daily loss assumption: the daily loss limit is sized off the *account size*
 * (`accountSize × maxDailyLossPct/100`) and anchored to the start-of-day
 * balance: `dailyFloor = startOfDayBalance − dailyLossAmount`. Pass
 * `startOfDayBalance` if today's balance differs from `currentBalance`
 * (defaults to `currentBalance`).
 *
 * Breach convention: touching a floor counts as a breach (`equity <= floor`),
 * matching how most firms liquidate the moment the limit is hit.
 */
export type DrawdownType = 'static' | 'trailing-eod' | 'trailing-intraday'

export type DrawdownInput = {
  /** Initial account balance, > 0 */
  accountSize: number
  drawdownType: DrawdownType
  /** Max total drawdown as a percentage of account size, in (0, 100] */
  maxTotalDrawdownPct: number
  /** Max daily loss as a percentage of account size; omit or 0 to disable the daily rule */
  maxDailyLossPct?: number
  /** Current closed (realized) balance */
  currentBalance: number
  /**
   * High-water mark. For `trailing-eod` this is the highest end-of-day
   * balance; for `trailing-intraday` the highest equity ever reached.
   * Defaults to the highest of accountSize / currentBalance (/ equity for
   * intraday). Never treated as lower than accountSize.
   */
  highWaterMark?: number
  /** Current equity (balance + unrealized P/L) */
  equity: number
  /** Balance at the start of the current trading day; defaults to currentBalance */
  startOfDayBalance?: number
}

export type DrawdownResult = {
  /** Equity level at which the total-drawdown rule is breached */
  drawdownFloor: number
  /** Equity level at which the daily-loss rule is breached; null if no daily rule */
  dailyLossFloor: number | null
  /** Equity cushion above the total-drawdown floor (negative if below it) */
  remainingTotalDrawdown: number
  /** Equity cushion above the daily-loss floor; null if no daily rule */
  remainingDailyLoss: number | null
  breached: boolean
  /** Which rule was hit first (the higher floor wins a tie beyond 'total') */
  breachedBy: 'daily' | 'total' | null
  /** True when a trailing floor has locked at the initial balance */
  lockedAtInitial: boolean
}

export function computeDrawdown(input: DrawdownInput): DrawdownResult {
  const {
    accountSize,
    drawdownType,
    maxTotalDrawdownPct,
    maxDailyLossPct,
    currentBalance,
    equity,
  } = input

  if (!Number.isFinite(accountSize) || accountSize <= 0) {
    throw new Error('accountSize must be > 0')
  }
  if (maxTotalDrawdownPct <= 0 || maxTotalDrawdownPct > 100) {
    throw new Error('maxTotalDrawdownPct must be in (0, 100]')
  }
  if (maxDailyLossPct != null && (maxDailyLossPct < 0 || maxDailyLossPct > 100)) {
    throw new Error('maxDailyLossPct must be in [0, 100]')
  }

  const drawdownAmount = (accountSize * maxTotalDrawdownPct) / 100

  // High-water mark can never be below the starting balance.
  const impliedHigh =
    drawdownType === 'trailing-intraday'
      ? Math.max(currentBalance, equity)
      : currentBalance
  const highWaterMark = Math.max(accountSize, input.highWaterMark ?? impliedHigh, impliedHigh)

  let drawdownFloor: number
  let lockedAtInitial = false
  if (drawdownType === 'static') {
    drawdownFloor = accountSize - drawdownAmount
  } else {
    const trailingFloor = highWaterMark - drawdownAmount
    lockedAtInitial = trailingFloor >= accountSize
    drawdownFloor = Math.min(accountSize, trailingFloor)
  }

  const startOfDayBalance = input.startOfDayBalance ?? currentBalance
  const hasDailyRule = maxDailyLossPct != null && maxDailyLossPct > 0
  const dailyLossFloor = hasDailyRule
    ? startOfDayBalance - (accountSize * maxDailyLossPct) / 100
    : null

  const totalBreached = equity <= drawdownFloor
  const dailyBreached = dailyLossFloor != null && equity <= dailyLossFloor

  let breachedBy: DrawdownResult['breachedBy'] = null
  if (totalBreached && dailyBreached) {
    // The higher floor is hit first.
    breachedBy = (dailyLossFloor as number) > drawdownFloor ? 'daily' : 'total'
  } else if (totalBreached) {
    breachedBy = 'total'
  } else if (dailyBreached) {
    breachedBy = 'daily'
  }

  return {
    drawdownFloor: round2(drawdownFloor),
    dailyLossFloor: dailyLossFloor == null ? null : round2(dailyLossFloor),
    remainingTotalDrawdown: round2(equity - drawdownFloor),
    remainingDailyLoss: dailyLossFloor == null ? null : round2(equity - dailyLossFloor),
    breached: breachedBy != null,
    breachedBy,
    lockedAtInitial,
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100
