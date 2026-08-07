import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Firm } from '@/payload-types'
import { Badge } from './Badge'
import { RatingStars } from './RatingStars'
import { cn, formatCount } from './utils'

/** The serializable slice of a Firm this card needs (resolve media server-side to `logoUrl`). */
export type FirmCardFirm = Pick<
  Firm,
  'name' | 'slug' | 'logoBackgroundColor' | 'reviewScore' | 'reviewsCount' | 'programTypes'
>

export type FirmCardProps = {
  firm: FirmCardFirm
  /** Resolved logo image URL; when absent a colored placeholder box with the firm initial renders. */
  logoUrl?: string | null
  /** One-line promo teaser, e.g. "20% off with code SQUAD". */
  promoTeaser?: string | null
  /** Link target for the firm name (defaults to /firms/{slug}). */
  href?: string
  /** Optional ranking shown as an orange-pale number chip. */
  rank?: number
  className?: string
}

const PROGRAM_TYPE_LABELS: Record<NonNullable<Firm['programTypes']>[number], string> = {
  instant: 'Instant',
  '1-step': '1-Step',
  '2-step': '2-Step',
  '3-step': '3-Step',
}

/**
 * Firm summary card: logo box (colored from `logoBackgroundColor`), name link,
 * star rating + review count, program-type badges, optional promo teaser.
 * White card, 1px warm border, 12px radius. Server component, no client JS.
 */
export function FirmCard({
  firm,
  logoUrl,
  promoTeaser,
  href,
  rank,
  className,
}: FirmCardProps): ReactNode {
  const target = href ?? `/firms/${firm.slug}`
  const initial = firm.name.trim().charAt(0).toUpperCase()

  return (
    <article
      className={cn(
        'relative flex flex-col gap-3 rounded-lg border border-line bg-card p-4',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {/* Logo box — colored background from CMS, initial as placeholder */}
        <span
          aria-hidden={logoUrl ? undefined : 'true'}
          className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-line"
          style={{ backgroundColor: firm.logoBackgroundColor || 'var(--color-accent-pale)' }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={`${firm.name} logo`}
              width={48}
              height={48}
              loading="lazy"
              className="size-full object-contain"
            />
          ) : (
            <span className="text-lg font-extrabold text-white">{initial}</span>
          )}
        </span>

        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-base font-extrabold text-ink">
            {rank != null && (
              <span className="inline-flex items-center justify-center rounded-sm bg-accent-pale px-1.5 py-0.5 text-xs font-extrabold tabular-nums text-accent-dark">
                {String(rank).padStart(2, '0')}
              </span>
            )}
            <Link
              href={target}
              className="truncate hover:text-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {firm.name}
            </Link>
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-3">
            <RatingStars rating={firm.reviewScore ?? 0} size={14} showValue />
            {firm.reviewsCount != null && (
              <span>({formatCount(firm.reviewsCount)} reviews)</span>
            )}
          </p>
        </div>
      </div>

      {firm.programTypes && firm.programTypes.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Program types">
          {firm.programTypes.map((pt) => (
            <li key={pt}>
              <Badge variant="neutral">{PROGRAM_TYPE_LABELS[pt]}</Badge>
            </li>
          ))}
        </ul>
      )}

      {promoTeaser && (
        <p className="flex items-center gap-1.5 border-t border-line pt-3 text-sm">
          <Badge variant="accent">Promo</Badge>
          <span className="truncate font-medium text-ink-2">{promoTeaser}</span>
        </p>
      )}
    </article>
  )
}
