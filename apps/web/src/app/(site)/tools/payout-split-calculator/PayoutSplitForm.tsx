'use client'

import { useMemo, useState } from 'react'
import { computePayoutSplit, type ScalingTier } from '@propfirmsquad/calc'
import {
  InvalidHint,
  NumberField,
  ResultRow,
  ResultsPanel,
  fmtPct,
  fmtUSD,
  parseNum,
} from '../_components/ui'

type TierRow = { afterPayouts: string; splitPct: string }

export function PayoutSplitForm() {
  const [grossProfit, setGrossProfit] = useState('5000')
  const [splitPct, setSplitPct] = useState('80')
  const [feeRefund, setFeeRefund] = useState('')
  const [payoutNumber, setPayoutNumber] = useState('1')
  const [tiers, setTiers] = useState<TierRow[]>([])

  const result = useMemo(() => {
    const gross = parseNum(grossProfit)
    const split = parseNum(splitPct)
    const refund = feeRefund.trim() === '' ? undefined : parseNum(feeRefund)
    const payoutN = payoutNumber.trim() === '' ? undefined : parseNum(payoutNumber)
    if (!Number.isFinite(gross) || !Number.isFinite(split)) return null
    if (refund != null && !Number.isFinite(refund)) return null
    if (payoutN != null && !Number.isFinite(payoutN)) return null

    const scalingTiers: ScalingTier[] = []
    for (const t of tiers) {
      if (t.afterPayouts.trim() === '' && t.splitPct.trim() === '') continue
      const after = parseNum(t.afterPayouts)
      const pct = parseNum(t.splitPct)
      if (!Number.isFinite(after) || !Number.isFinite(pct)) return null
      scalingTiers.push({ afterPayouts: after, splitPct: pct })
    }

    try {
      return computePayoutSplit({
        grossProfit: gross,
        splitPct: split,
        feeRefund: refund,
        payoutNumber: payoutN,
        scalingTiers,
      })
    } catch {
      return null
    }
  }, [grossProfit, splitPct, feeRefund, payoutNumber, tiers])

  const updateTier = (i: number, patch: Partial<TierRow>) =>
    setTiers((prev) => prev.map((t, j) => (j === i ? { ...t, ...patch } : t)))

  return (
    <div className="grid gap-6 rounded-lg border border-line bg-card p-6 md:grid-cols-2">
      <div className="grid content-start gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label="Gross profit to pay out" value={grossProfit} onChange={setGrossProfit} suffix="$" />
          <NumberField label="Base profit split" value={splitPct} onChange={setSplitPct} suffix="%" />
          <NumberField
            label="Fee refund (optional)"
            value={feeRefund}
            onChange={setFeeRefund}
            suffix="$"
            hint="Challenge fee refunded with this payout."
          />
          <NumberField
            label="Payout number"
            value={payoutNumber}
            onChange={setPayoutNumber}
            hint="Which payout this is (1 = first)."
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink-2">Scaling tiers (optional)</span>
            <button
              type="button"
              onClick={() => setTiers((prev) => [...prev, { afterPayouts: '', splitPct: '' }])}
              className="rounded-sm bg-accent-pale px-2 py-1 text-xs font-bold text-accent-dark hover:bg-accent hover:text-white"
            >
              + Add tier
            </button>
          </div>
          {tiers.length === 0 ? (
            <p className="text-xs text-ink-3">
              Some firms improve your split after a number of payouts, e.g. 90% after 3 payouts.
            </p>
          ) : (
            <div className="space-y-2">
              {tiers.map((t, i) => (
                <div key={i} className="flex items-end gap-2">
                  <NumberField
                    label="After payouts"
                    value={t.afterPayouts}
                    onChange={(v) => updateTier(i, { afterPayouts: v })}
                  />
                  <NumberField
                    label="New split"
                    value={t.splitPct}
                    onChange={(v) => updateTier(i, { splitPct: v })}
                    suffix="%"
                  />
                  <button
                    type="button"
                    aria-label="Remove tier"
                    onClick={() => setTiers((prev) => prev.filter((_, j) => j !== i))}
                    className="mb-1 rounded-sm border border-line px-3 py-2 text-sm text-ink-2 hover:border-negative hover:text-negative"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div>
        <h2 className="mb-2 text-sm font-bold tracking-widest text-ink-3 uppercase">Result</h2>
        {result == null ? (
          <InvalidHint text="Enter your gross profit and split (tiers need whole numbers of payouts) to see the breakdown." />
        ) : (
          <ResultsPanel>
            <ResultRow label="Effective split for this payout" value={fmtPct(result.effectiveSplitPct)} tone="accent" />
            <ResultRow label="Your profit share" value={fmtUSD(result.traderShare)} />
            <ResultRow label="Your total take (incl. refund)" value={fmtUSD(result.traderTake)} tone="positive" />
            <ResultRow label="Firm's take" value={fmtUSD(result.firmTake)} />
          </ResultsPanel>
        )}
      </div>
    </div>
  )
}
