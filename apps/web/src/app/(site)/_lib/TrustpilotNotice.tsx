/**
 * The Trustpilot guidelines-warning notice.
 *
 * Editorial contract, which is why the copy below is not a placeholder:
 *
 *   We report what Trustpilot displayed, on the date we looked, with a link so
 *   the reader can check it themselves. We quote Trustpilot's label rather than
 *   paraphrasing it, and we state plainly that we do not know why it was
 *   applied. "Trustpilot flagged this profile" is a fact about a public page.
 *   "This firm fakes reviews" is an accusation we cannot support, so it does
 *   not appear here in any wording.
 *
 * The hidden underlying score is shown because it is the actually useful part:
 * a visitor to the profile cannot see it, so a firm carrying a suppressed 2.3
 * looks the same to them as one carrying a suppressed 4.7.
 */
import { formatDate } from './format'
import { publishableWarning, TRUSTPILOT_LABEL, type TrustpilotWarning } from './trustpilot'
import type { Firm } from '@/payload-types'

function Shield() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5 shrink-0 text-negative"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="13" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

/** Full notice for the profile page. Renders nothing when there is no
 *  publishable warning, so callers do not need their own guard. */
export function TrustpilotNotice({ firm }: { firm: Pick<Firm, 'name' | 'trustpilotWarning'> }) {
  const warning = publishableWarning(firm)
  if (!warning) return null
  return <TrustpilotNoticeBody name={firm.name} warning={warning} />
}

function TrustpilotNoticeBody({ name, warning }: { name: string; warning: TrustpilotWarning }) {
  const { underlyingScore, underlyingReviews, reviewsLast12m, checkedAt, profileUrl } = warning
  return (
    <aside className="rounded-lg border border-negative/40 bg-negative-pale p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <Shield />
        <div className="min-w-0">
          <h3 className="text-base font-extrabold">
            Trustpilot has restricted this firm&apos;s rating
          </h3>
          <p className="mt-2 text-sm text-ink-2">
            As of {formatDate(checkedAt)}, {name}&apos;s Trustpilot profile carried the notice{' '}
            <q className="font-semibold text-ink">{TRUSTPILOT_LABEL}</q> Trustpilot applies this
            label when its systems detect a breach of its business guidelines, and it hides the
            star rating from visitors while it is in place.
          </p>

          {underlyingScore != null ? (
            <p className="mt-3 text-sm text-ink-2">
              The score itself is still in the page data, and it is{' '}
              <strong className="text-ink tabular-nums">{underlyingScore}/5</strong>
              {underlyingReviews != null
                ? ` across ${underlyingReviews.toLocaleString('en-US')} reviews`
                : ''}
              {reviewsLast12m != null
                ? `, ${reviewsLast12m.toLocaleString('en-US')} of them in the last twelve months`
                : ''}
              . A visitor to the profile cannot see that number, which is why we publish it.
            </p>
          ) : null}

          <p className="mt-3 text-sm text-ink-2">
            We are reporting what the page showed on the date above, not why. Trustpilot does not
            publish its reasons, and we make no claim about how the reviews were gathered.
          </p>

          <p className="mt-3 text-sm font-semibold">
            <a
              href={profileUrl}
              rel="nofollow noopener"
              target="_blank"
              className="text-accent-dark underline"
            >
              Check the profile yourself
            </a>
          </p>
        </div>
      </div>
    </aside>
  )
}

/**
 * Compact inline flag for ranked lists.
 *
 * Kept deliberately terse and unlinked: in a table the job is to make the
 * reader stop, not to argue the case. The profile carries the full notice.
 */
export function TrustpilotFlag({
  firm,
  className = '',
}: {
  firm: Pick<Firm, 'trustpilotWarning'>
  className?: string
}) {
  if (!publishableWarning(firm)) return null
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm bg-negative-pale px-1.5 py-0.5 text-[11px] font-bold text-negative ${className}`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3 w-3" fill="currentColor">
        <path d="M12 2 1 21h22L12 2zm1 14h-2v2h2v-2zm0-7h-2v5h2V9z" />
      </svg>
      Trustpilot rating restricted
    </span>
  )
}
