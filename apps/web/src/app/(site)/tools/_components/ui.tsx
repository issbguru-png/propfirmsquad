'use client'

import React from 'react'

/** Shared controlled-input primitives for the calculator forms. */

export function NumberField({
  label,
  value,
  onChange,
  suffix,
  placeholder,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  suffix?: string
  placeholder?: string
  hint?: string
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-ink-2">{label}</span>
      <span className="relative block">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-sm border border-line bg-card px-3 py-2 text-ink focus:border-accent focus:ring-2 focus:ring-accent-pale focus:outline-none"
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-ink-3">
            {suffix}
          </span>
        ) : null}
      </span>
      {hint ? <span className="mt-1 block text-xs text-ink-3">{hint}</span> : null}
    </label>
  )
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-ink-2">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-sm border border-line bg-card px-3 py-2 text-ink focus:border-accent focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function ResultRow({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'positive' | 'negative' | 'accent'
}) {
  const toneClass =
    tone === 'positive'
      ? 'text-positive'
      : tone === 'negative'
        ? 'text-negative'
        : tone === 'accent'
          ? 'text-accent-dark'
          : 'text-ink'
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2 last:border-b-0">
      <span className="text-sm text-ink-2">{label}</span>
      <span className={`font-bold tabular-nums ${toneClass}`}>{value}</span>
    </div>
  )
}

export function ResultsPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-line bg-accent-pale/40 px-4 py-2">{children}</div>
  )
}

export function StatusBadge({ ok, okText, failText }: { ok: boolean; okText: string; failText: string }) {
  return (
    <span
      className={`inline-block rounded-sm px-2 py-1 text-xs font-bold tracking-wide uppercase ${
        ok ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'
      }`}
    >
      {ok ? okText : failText}
    </span>
  )
}

export function InvalidHint({ text }: { text: string }) {
  return <p className="py-2 text-sm text-ink-3">{text}</p>
}

export const parseNum = (s: string): number => {
  const n = Number.parseFloat(s)
  return Number.isFinite(n) ? n : NaN
}

export const fmtUSD = (n: number): string =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

export const fmtPct = (n: number): string => `${n.toLocaleString('en-US')}%`
