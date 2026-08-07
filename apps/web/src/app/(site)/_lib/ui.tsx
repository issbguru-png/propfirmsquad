/**
 * Minimal inline UI primitives for (site) pages, styled with design tokens.
 * Placeholder for lane B's UI kit — keep these dumb and swappable.
 */
import Link from 'next/link'
import React from 'react'
import type { Firm } from '@/payload-types'
import { SectionKicker } from '@/components'

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'accent' | 'positive' | 'negative'
}) {
  const tones: Record<string, string> = {
    neutral: 'border-line bg-page text-ink-2',
    accent: 'border-accent/30 bg-accent-pale text-accent-dark',
    positive: 'border-positive/30 bg-positive/10 text-positive',
    negative: 'border-negative/30 bg-negative/10 text-negative',
  }
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

export function Score({ value, max = 5 }: { value: number | null | undefined; max?: number }) {
  if (value == null) return <span className="text-ink-3">—</span>
  return (
    <span className="inline-flex items-baseline gap-1 font-bold">
      <span className="text-accent-dark">{value}</span>
      <span aria-hidden className="text-accent">
        ★
      </span>
      <span className="sr-only">out of {max}</span>
    </span>
  )
}

/** Resolve a populated Media relation to its URL (null when unpopulated or unset). */
export function firmLogoUrl(logo: Firm['logo']): string | null {
  return logo && typeof logo === 'object' && typeof logo.url === 'string' ? logo.url : null
}

/** Firm logo in a colored box; falls back to an initial-letter avatar when no logo is set. */
export function FirmMark({
  firm,
  size = 'md',
}: {
  firm: Pick<Firm, 'name' | 'logoBackgroundColor'> & { logo?: Firm['logo'] }
  size?: 'sm' | 'md' | 'lg'
}) {
  const dims =
    size === 'lg' ? 'h-14 w-14 text-2xl' : size === 'sm' ? 'h-7 w-7 text-xs' : 'h-10 w-10 text-lg'
  const logoUrl = firmLogoUrl(firm.logo)
  return (
    <span
      aria-hidden
      className={`flex ${dims} shrink-0 items-center justify-center overflow-hidden rounded-sm font-black text-on-dark`}
      style={{ backgroundColor: firm.logoBackgroundColor || '#2d2520' }}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="h-full w-full object-contain p-[15%]" />
      ) : (
        firm.name.charAt(0)
      )}
    </span>
  )
}

export function SectionCard({
  id,
  title,
  intro,
  number,
  kicker,
  children,
}: {
  id: string
  title: string
  intro?: string
  /** Section number for "§ 01 — LABEL" wayfinding above the title. */
  number?: number
  /** Short kicker label (defaults to `title` when only `number` is set). */
  kicker?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24 rounded-lg border border-line bg-card p-5 sm:p-7">
      {number != null ? (
        <SectionKicker number={number} className="mb-1.5">
          {kicker ?? title}
        </SectionKicker>
      ) : null}
      <h2 id={`${id}-h`} className="mb-2 text-2xl font-extrabold tracking-tight">
        {title}
      </h2>
      {intro ? <p className="mb-4 max-w-(--container-prose) text-ink-2">{intro}</p> : null}
      {children}
    </section>
  )
}

export function FirmCard({ firm, rank }: { firm: Firm; rank?: number }) {
  return (
    <Link
      href={`/prop-firms/${firm.slug}`}
      className="flex items-center gap-3 rounded-sm border border-line bg-card p-4 transition-colors hover:border-accent"
    >
      {rank != null && (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-accent-pale text-sm font-bold text-accent-dark">
          {String(rank).padStart(2, '0')}
        </span>
      )}
      <FirmMark firm={firm} />
      <span className="min-w-0">
        <span className="block truncate font-bold">{firm.name}</span>
        <span className="block text-sm text-ink-2">
          <Score value={firm.reviewScore} />
          {firm.reviewsCount ? <span> · {firm.reviewsCount} reviews</span> : null}
        </span>
      </span>
    </Link>
  )
}

/** Empty-state panel used when the DB has no rows for a section. */
export function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-dashed border-line bg-page p-4 text-sm text-ink-2">
      {children}
    </div>
  )
}

export const th = 'px-3 py-2 text-left text-xs font-bold tracking-wide text-ink-2 uppercase'
export const td = 'px-3 py-2.5 align-middle'
