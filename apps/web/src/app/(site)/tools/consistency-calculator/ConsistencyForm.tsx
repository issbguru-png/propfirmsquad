'use client'

import { useMemo, useState } from 'react'
import { checkConsistency } from '@propfirmsquad/calc'
import {
  InvalidHint,
  NumberField,
  ResultRow,
  ResultsPanel,
  StatusBadge,
  fmtPct,
  fmtUSD,
  parseNum,
} from '../_components/ui'

export function ConsistencyForm() {
  const [profitsText, setProfitsText] = useState('450, 320, 980, 150, 600')
  const [maxDayPct, setMaxDayPct] = useState('30')

  const result = useMemo(() => {
    const dailyProfits = profitsText
      .split(/[,\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => Number.parseFloat(s))
    if (dailyProfits.length === 0 || dailyProfits.some((n) => !Number.isFinite(n))) return null
    const pct = parseNum(maxDayPct)
    if (!Number.isFinite(pct)) return null
    try {
      return checkConsistency({ dailyProfits, maxDayPct: pct })
    } catch {
      return null
    }
  }, [profitsText, maxDayPct])

  return (
    <div className="grid gap-6 rounded-lg border border-line bg-card p-6 md:grid-cols-2">
      <div className="grid content-start gap-4">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-ink-2">
            Daily profits ($, comma or line separated)
          </span>
          <textarea
            value={profitsText}
            onChange={(e) => setProfitsText(e.target.value)}
            rows={4}
            className="w-full rounded-sm border border-line bg-card px-3 py-2 text-ink focus:border-accent focus:ring-2 focus:ring-accent-pale focus:outline-none"
          />
          <span className="mt-1 block text-xs text-ink-3">Losses are fine. Enter them as negatives.</span>
        </label>
        <NumberField
          label="Firm's consistency limit"
          value={maxDayPct}
          onChange={setMaxDayPct}
          suffix="%"
          hint="No single day may exceed this share of total profit."
        />
      </div>
      <div>
        <h2 className="mb-2 text-sm font-bold tracking-widest text-ink-3 uppercase">Result</h2>
        {result == null ? (
          <InvalidHint text="Enter your daily profits and a limit between 0 and 100 to see results." />
        ) : (
          <ResultsPanel>
            <div className="py-2">
              <StatusBadge ok={result.passes} okText="Passes consistency" failText="Fails consistency" />
            </div>
            <ResultRow label="Total profit" value={fmtUSD(result.totalProfit)} />
            <ResultRow label="Best day" value={fmtUSD(result.bestDay)} />
            <ResultRow
              label="Best day share of total"
              value={fmtPct(result.bestDayPct)}
              tone={result.passes ? 'positive' : 'negative'}
            />
            <ResultRow
              label="Extra profit needed to pass"
              value={fmtUSD(result.additionalProfitNeeded)}
              tone="accent"
            />
          </ResultsPanel>
        )}
      </div>
    </div>
  )
}
