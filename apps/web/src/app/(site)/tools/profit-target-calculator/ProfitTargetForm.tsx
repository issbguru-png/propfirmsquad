'use client'

import { useMemo, useState } from 'react'
import { computeProfitTarget } from '@propfirmsquad/calc'
import {
  InvalidHint,
  NumberField,
  ResultRow,
  ResultsPanel,
  fmtPct,
  fmtUSD,
  parseNum,
} from '../_components/ui'

type PhaseRow = { targetPct: string; currentBalance: string }

export function ProfitTargetForm() {
  const [accountSize, setAccountSize] = useState('100000')
  const [phases, setPhases] = useState<PhaseRow[]>([
    { targetPct: '8', currentBalance: '103500' },
    { targetPct: '5', currentBalance: '100000' },
  ])

  const result = useMemo(() => {
    const size = parseNum(accountSize)
    if (!Number.isFinite(size)) return null
    const phaseInputs = phases.map((p, i) => ({
      phase: `Phase ${i + 1}`,
      targetPct: parseNum(p.targetPct),
      currentBalance: parseNum(p.currentBalance),
    }))
    if (phaseInputs.some((p) => !Number.isFinite(p.targetPct) || !Number.isFinite(p.currentBalance))) {
      return null
    }
    try {
      return computeProfitTarget({ accountSize: size, phases: phaseInputs })
    } catch {
      return null
    }
  }, [accountSize, phases])

  const updatePhase = (i: number, patch: Partial<PhaseRow>) =>
    setPhases((prev) => prev.map((p, j) => (j === i ? { ...p, ...patch } : p)))

  return (
    <div className="grid gap-6 rounded-lg border border-line bg-card p-6 md:grid-cols-2">
      <div className="grid content-start gap-4">
        <NumberField label="Account size" value={accountSize} onChange={setAccountSize} suffix="$" />
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink-2">Evaluation phases</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPhases((prev) => [...prev, { targetPct: '', currentBalance: accountSize }])}
                className="rounded-sm bg-accent-pale px-2 py-1 text-xs font-bold text-accent-dark hover:bg-accent hover:text-white"
              >
                + Add phase
              </button>
              {phases.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setPhases((prev) => prev.slice(0, -1))}
                  className="rounded-sm border border-line px-2 py-1 text-xs font-bold text-ink-2 hover:border-negative hover:text-negative"
                >
                  − Remove last
                </button>
              ) : null}
            </div>
          </div>
          <div className="space-y-3">
            {phases.map((p, i) => (
              <div key={i} className="grid gap-3 rounded-sm border border-line p-3 sm:grid-cols-2">
                <NumberField
                  label={`Phase ${i + 1} target`}
                  value={p.targetPct}
                  onChange={(v) => updatePhase(i, { targetPct: v })}
                  suffix="%"
                />
                <NumberField
                  label="Current balance"
                  value={p.currentBalance}
                  onChange={(v) => updatePhase(i, { currentBalance: v })}
                  suffix="$"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div>
        <h2 className="mb-2 text-sm font-bold tracking-widest text-ink-3 uppercase">Result</h2>
        {result == null ? (
          <InvalidHint text="Enter your account size and each phase's target and balance to see progress." />
        ) : (
          <div className="space-y-4">
            <ResultsPanel>
              <ResultRow label="Total profit required" value={fmtUSD(result.totalTargetAmount)} />
              <ResultRow label="Total remaining" value={fmtUSD(result.totalRemaining)} tone="accent" />
              <ResultRow
                label="Overall progress"
                value={fmtPct(result.overallProgressPct)}
                tone={result.overallProgressPct >= 100 ? 'positive' : 'default'}
              />
              <div className="py-2">
                <div className="h-2 overflow-hidden rounded-sm bg-line">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${Math.min(100, result.overallProgressPct)}%` }}
                  />
                </div>
              </div>
            </ResultsPanel>
            {result.phases.map((phase) => (
              <ResultsPanel key={phase.phase}>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-bold">{phase.phase}</span>
                  <span
                    className={`text-xs font-bold uppercase ${phase.complete ? 'text-positive' : 'text-ink-3'}`}
                  >
                    {phase.complete ? 'Complete' : `${phase.progressPct}%`}
                  </span>
                </div>
                <ResultRow label="Profit required" value={fmtUSD(phase.targetAmount)} />
                <ResultRow label="Pass balance" value={fmtUSD(phase.targetBalance)} />
                <ResultRow
                  label="Remaining"
                  value={fmtUSD(phase.remaining)}
                  tone={phase.complete ? 'positive' : 'accent'}
                />
              </ResultsPanel>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
