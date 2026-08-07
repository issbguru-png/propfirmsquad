import React from 'react'
import { serializeJsonLd, type JsonLdObject } from './jsonld'

/**
 * Renders a JSON-LD script tag safely (all `<`/`>` in the payload are
 * unicode-escaped by `serializeJsonLd`, so `</script>` breakout is impossible).
 *
 * Usage (server component):
 *   <JsonLd data={firmLd(firm)} />
 */
export function JsonLd({ data }: { data: JsonLdObject }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />
  )
}
