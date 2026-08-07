'use client'

import { useMemo, useState } from 'react'
import { computeChallengeRoi } from '@propfirmsquad/calc'
import {
  InvalidHint,
  NumberField,
  ResultRow,
  ResultsPanel,
  fmtPct,
  fmtUSD,
  parseNum,
} from '../_components/ui'

export function ChallengeRoiForm() {
  const [challengePrice, setChallengePrice] = useState('499')
  const [accountSize, setAccountSize] = useState('100000')
  const [profitSplitPct, setProfitSplitPct] = useState('80')
  const [passRatePct, setPassRatePct] = useState('15')
  const [avgMonthlyProfitPct, setAvgMonthlyProfitPct] = useState('3')
  const [months, setMonths] = useState('3')

  const result = useMemo(() => {
    const input = {
      challengePrice: parseNum(challengePrice),
      accountSize: parseNum(accountSize),
      profitSplitPct: parseNum(profitSplitPct),
      passRatePct: parseNum(passRatePct),
      avgMonthlyProfitPct: parseNum(avgMonthlyProfitPct),
      months: parseNum(months),
    }
    if (Object.values(input).some((n) => !Number.isFinite(n))) return null
    try {
      return computeChallengeRoi(input)
    } catch {
      return null
    }
  }, [challengePrice, accountSize, profitSplitPct, passRatePct, avgMonthlyProfitPct, months])

  return (
    <div className="grid gap-6 rounded-lg border border-line bg-card p-6 md:grid-cols-2">
      <div className="grid content-start gap-4 sm:grid-cols-2">
        <NumberField label="Challenge price" value={challengePrice} onChange={setChallengePrice} suffix="$" />
        <NumberField label="Account size" value={accountSize} onChange={setAccountSize} suffix="$" />
        <NumberField label="Profit split" value={profitSplitPct} onChange={setProfitSplitPct} suffix="%" />
        <NumberField
          label="Assumed pass rate"
          value={passRatePct}
          onChange={setPassRatePct}
          suffix="%"
          hint="Your honest odds of passing — industry-wide it's often under 20%."
        />
        <NumberField
          label="Avg funded profit per month"
          value={avgMonthlyProfitPct}
          onChange={setAvgMonthlyProfitPct}
          suffix="%"
          hint="As % of account size. Negative values are allowed."
        />
        <NumberField
          label="Funded months"
          value={months}
          onChange={setMonths}
          hint="How long you expect the funded account to last."
        />
      </div>
      <div>
        <h2 className="mb-2 text-sm font-bold tracking-widest text-ink-3 uppercase">Result</h2>
        {result == null ? (
          <InvalidHint text="Enter the challenge details and your assumptions to see the expected value." />
        ) : (
          <ResultsPanel>
            <ResultRow label="Cost per $1,000 of buying power" value={fmtUSD(result.costPer1k)} />
            <ResultRow label="Monthly payout if funded" value={fmtUSD(result.monthlyPayoutIfFunded)} />
            <ResultRow label="Total payout if funded" value={fmtUSD(result.payoutIfFunded)} />
            <ResultRow
              label="Expected value of this attempt"
              value={fmtUSD(result.expectedValue)}
              tone={result.expectedValue >= 0 ? 'positive' : 'negative'}
            />
            <ResultRow
              label="Break-even pass rate"
              value={
                result.breakEvenPassRatePct == null ? '—' : fmtPct(result.breakEvenPassRatePct)
              }
              tone="accent"
            />
            {result.breakEvenPassRatePct != null && result.breakEvenPassRatePct > 100 ? (
              <p className="py-2 text-xs text-ink-3">
                A break-even pass rate above 100% means this challenge cannot pay for itself under
                your assumptions, even if you always pass.
              </p>
            ) : null}
          </ResultsPanel>
        )}
      </div>
    </div>
  )
}
