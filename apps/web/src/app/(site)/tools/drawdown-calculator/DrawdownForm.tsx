'use client'

import { useMemo, useState } from 'react'
import { computeDrawdown, type DrawdownType } from '@propfirmsquad/calc'
import {
  InvalidHint,
  NumberField,
  ResultRow,
  ResultsPanel,
  SelectField,
  StatusBadge,
  fmtUSD,
  parseNum,
} from '../_components/ui'

export function DrawdownForm() {
  const [accountSize, setAccountSize] = useState('100000')
  const [drawdownType, setDrawdownType] = useState<DrawdownType>('trailing-eod')
  const [maxTotalPct, setMaxTotalPct] = useState('10')
  const [maxDailyPct, setMaxDailyPct] = useState('5')
  const [currentBalance, setCurrentBalance] = useState('103000')
  const [equity, setEquity] = useState('102500')
  const [highWaterMark, setHighWaterMark] = useState('')
  const [startOfDay, setStartOfDay] = useState('')

  const result = useMemo(() => {
    const input = {
      accountSize: parseNum(accountSize),
      drawdownType,
      maxTotalDrawdownPct: parseNum(maxTotalPct),
      maxDailyLossPct: maxDailyPct.trim() === '' ? undefined : parseNum(maxDailyPct),
      currentBalance: parseNum(currentBalance),
      equity: parseNum(equity),
      highWaterMark: highWaterMark.trim() === '' ? undefined : parseNum(highWaterMark),
      startOfDayBalance: startOfDay.trim() === '' ? undefined : parseNum(startOfDay),
    }
    if (
      !Number.isFinite(input.accountSize) ||
      !Number.isFinite(input.maxTotalDrawdownPct) ||
      !Number.isFinite(input.currentBalance) ||
      !Number.isFinite(input.equity) ||
      (input.maxDailyLossPct != null && !Number.isFinite(input.maxDailyLossPct)) ||
      (input.highWaterMark != null && !Number.isFinite(input.highWaterMark)) ||
      (input.startOfDayBalance != null && !Number.isFinite(input.startOfDayBalance))
    ) {
      return null
    }
    try {
      return computeDrawdown(input)
    } catch {
      return null
    }
  }, [accountSize, drawdownType, maxTotalPct, maxDailyPct, currentBalance, equity, highWaterMark, startOfDay])

  return (
    <div className="grid gap-6 rounded-lg border border-line bg-card p-6 md:grid-cols-2">
      <div className="grid content-start gap-4 sm:grid-cols-2">
        <NumberField label="Account size" value={accountSize} onChange={setAccountSize} suffix="$" />
        <SelectField
          label="Drawdown type"
          value={drawdownType}
          onChange={(v) => setDrawdownType(v as DrawdownType)}
          options={[
            { value: 'static', label: 'Static' },
            { value: 'trailing-eod', label: 'Trailing (end of day)' },
            { value: 'trailing-intraday', label: 'Trailing (intraday)' },
          ]}
        />
        <NumberField label="Max total drawdown" value={maxTotalPct} onChange={setMaxTotalPct} suffix="%" />
        <NumberField
          label="Max daily loss"
          value={maxDailyPct}
          onChange={setMaxDailyPct}
          suffix="%"
          hint="Leave blank if the firm has no daily loss rule."
        />
        <NumberField label="Current balance" value={currentBalance} onChange={setCurrentBalance} suffix="$" />
        <NumberField
          label="Current equity"
          value={equity}
          onChange={setEquity}
          suffix="$"
          hint="Balance plus unrealized P/L on open trades."
        />
        <NumberField
          label="High-water mark (optional)"
          value={highWaterMark}
          onChange={setHighWaterMark}
          suffix="$"
          hint="Highest balance (EOD) or equity (intraday) so far."
        />
        <NumberField
          label="Start-of-day balance (optional)"
          value={startOfDay}
          onChange={setStartOfDay}
          suffix="$"
          hint="Defaults to current balance."
        />
      </div>
      <div>
        <h2 className="mb-2 text-sm font-bold tracking-widest text-ink-3 uppercase">Result</h2>
        {result == null ? (
          <InvalidHint text="Fill in account size, drawdown %, balance and equity to see your floors." />
        ) : (
          <ResultsPanel>
            <div className="flex items-center gap-2 py-2">
              <StatusBadge ok={!result.breached} okText="Account safe" failText="Account breached" />
              {result.breached && result.breachedBy ? (
                <span className="text-xs text-ink-3">
                  ({result.breachedBy === 'daily' ? 'daily loss limit' : 'total drawdown'})
                </span>
              ) : null}
            </div>
            <ResultRow label="Total drawdown floor" value={fmtUSD(result.drawdownFloor)} />
            <ResultRow
              label="Remaining total drawdown"
              value={fmtUSD(result.remainingTotalDrawdown)}
              tone={result.remainingTotalDrawdown > 0 ? 'positive' : 'negative'}
            />
            {result.dailyLossFloor != null ? (
              <ResultRow label="Daily loss floor" value={fmtUSD(result.dailyLossFloor)} />
            ) : null}
            {result.remainingDailyLoss != null ? (
              <ResultRow
                label="Remaining daily loss"
                value={fmtUSD(result.remainingDailyLoss)}
                tone={result.remainingDailyLoss > 0 ? 'positive' : 'negative'}
              />
            ) : null}
            {result.lockedAtInitial ? (
              <p className="py-2 text-xs text-ink-3">
                Your trailing floor has locked at the initial balance — it will no longer rise with
                new highs.
              </p>
            ) : null}
          </ResultsPanel>
        )}
      </div>
    </div>
  )
}
