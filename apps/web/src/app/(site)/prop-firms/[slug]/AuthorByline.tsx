/**
 * Compact reviewer byline for firm profiles. Sits directly under the sticky
 * section nav, above the Verdict section. Server component, no client JS.
 */

export function AuthorByline({ verifiedAt }: { verifiedAt?: string | null }) {
  return (
    <aside
      aria-label="About the reviewer"
      className="mb-8 flex flex-wrap items-start gap-x-4 gap-y-2 rounded-lg border border-line bg-card px-4 py-3.5 sm:items-center"
    >
      <img
        src="/ayub-rana.png"
        alt="Ayub Rana"
        width={48}
        height={48}
        className="h-12 w-12 shrink-0 rounded-full bg-accent-pale object-cover"
      />
      {/* A floor, not min-w-0. With min-w-0 this column was free to shrink to
          whatever was left after the avatar and the link, which on a 375px
          screen was about 110px: every line broke after two or three words and
          the card became a tall ladder of fragments. Giving it a real minimum
          makes flex-wrap do its job and drop the link to its own line instead. */}
      <div className="min-w-[15rem] flex-1 text-sm leading-snug">
        <p className="font-bold">
          Reviewed by Ayub Rana{' '}
          <span className="font-semibold text-ink-2">
            · Chartered Accountant &amp; Forex Trader, trading since 2018
          </span>
        </p>
        <p className="text-ink-2">
          Every rule, price, and payout term on this page is personally audited and re-verified
          {verifiedAt ? (
            <>
              {' '}
              (last checked{' '}
              <time dateTime={verifiedAt}>
                {new Date(verifiedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  timeZone: 'UTC',
                })}
              </time>
              )
            </>
          ) : null}
          .
        </p>
      </div>
      <a
        href="/#author-h"
        className="shrink-0 text-sm font-semibold text-accent-dark hover:underline"
      >
        About the reviewer →
      </a>
    </aside>
  )
}
