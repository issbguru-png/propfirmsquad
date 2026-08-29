/**
 * Route-level loading UI.
 *
 * Without a loading.tsx, an App Router navigation is a silent RSC fetch: the
 * browser shows no spinner because there is no document request, and the old
 * page stays fully interactive until the new one arrives. Every link on this
 * site therefore felt broken on a slow connection, because a tap produced no
 * feedback at all. This is what turns that dead time into an obvious response.
 *
 * Deliberately a skeleton rather than a spinner: it holds roughly the shape of
 * the page underneath, so arrival is a fill-in rather than a layout jump.
 */
export default function Loading() {
  return (
    <div className="animate-pulse space-y-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <div className="rounded-lg border border-line bg-card p-5 sm:p-8">
        <div className="h-3 w-32 rounded bg-line" />
        <div className="mt-4 h-9 w-4/5 rounded bg-line" />
        <div className="mt-2 h-9 w-3/5 rounded bg-line" />
        <div className="mt-5 space-y-2">
          <div className="h-4 w-full rounded bg-line" />
          <div className="h-4 w-11/12 rounded bg-line" />
          <div className="h-4 w-2/3 rounded bg-line" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-6 w-56 rounded bg-line" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg border border-line bg-card" />
        ))}
      </div>
    </div>
  )
}
