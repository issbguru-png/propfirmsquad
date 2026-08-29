import Script from 'next/script'

/**
 * Google Analytics 4, mounted from the `(site)` layout only so admin sessions
 * in `(payload)` never register as traffic.
 *
 * `next/script` rather than `@next/third-parties`: the component below stays a
 * server component (the third-parties `GoogleAnalytics` is client-side), and it
 * needs no new dependency for what amounts to two script tags. `afterInteractive`
 * lets hydration finish first; analytics is never on the critical path.
 *
 * Both guards below read statically inlined values, so when the ID is unset or
 * the build is not production the tags are absent from the HTML entirely.
 * Hardcoding the ID would make every preview deployment and local run report
 * into the production property, which would corrupt the numbers before the site
 * has real traffic to measure.
 */
export function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID

  if (process.env.NODE_ENV !== 'production' || !gaId) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      {/* `id` is required: it is how next/script dedupes an inline script across navigations. */}
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`}
      </Script>
    </>
  )
}
