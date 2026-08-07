/**
 * JSON-LD builders — the ONLY place structured data is assembled
 * (docs/ROUTES.md: "JSON-LD via builders in src/lib/seo/ only").
 *
 * Each builder returns a plain object. Render with the <JsonLd /> server
 * component (./JsonLd.tsx), which serializes safely via `serializeJsonLd`.
 */

import type { Firm, Promo } from '@/payload-types'
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl, siteUrl } from './site'

export type JsonLdObject = Record<string, unknown>

const CONTEXT = 'https://schema.org'

/**
 * Serialize for a <script type="application/ld+json"> tag. Escapes `<`/`>`
 * so the payload can never break out of the script element (`</script>`
 * injection), plus the JS line separators U+2028/U+2029.
 */
export function serializeJsonLd(data: JsonLdObject): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

/** PropFirmSquad itself — for the root layout / home page. */
export function organizationLd(): JsonLdObject {
  return {
    '@context': CONTEXT,
    '@type': 'Organization',
    '@id': `${siteUrl()}/#organization`,
    name: SITE_NAME,
    url: siteUrl(),
    description: SITE_DESCRIPTION,
  }
}

/**
 * A prop firm as FinancialService. AggregateRating is attached only when we
 * actually have reviews (reviewsCount > 0) — never emit an empty rating.
 */
export function firmLd(firm: Firm): JsonLdObject {
  const url = absoluteUrl(`/prop-firms/${firm.slug}`)
  const sameAs = [firm.websiteUrl, firm.trustpilotUrl].filter(
    (u): u is string => typeof u === 'string' && u.length > 0,
  )

  const ld: JsonLdObject = {
    '@context': CONTEXT,
    '@type': 'FinancialService',
    '@id': `${url}/#firm`,
    name: firm.name,
    url,
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(firm.country
      ? { address: { '@type': 'PostalAddress', addressCountry: firm.country } }
      : {}),
    ...(firm.dateEstablished ? { foundingDate: firm.dateEstablished } : {}),
  }

  if (firm.reviewScore != null && typeof firm.reviewsCount === 'number' && firm.reviewsCount > 0) {
    ld.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: firm.reviewScore,
      ratingCount: firm.reviewsCount,
      bestRating: 5,
      worstRating: 1,
    }
  }

  return ld
}

export type FaqItem = { question: string; answer: string }

/** FAQPage — answers must be plain text (already rendered, no markup). */
export function faqLd(questions: FaqItem[]): JsonLdObject {
  return {
    '@context': CONTEXT,
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answer },
    })),
  }
}

/** A promo as an Offer, attached to the firm's promo-code page. */
export function offerLd(promo: Promo, firm: Firm): JsonLdObject {
  const url = absoluteUrl(`/prop-firms/${firm.slug}/promo-code`)
  return {
    '@context': CONTEXT,
    '@type': 'Offer',
    url,
    name:
      promo.discountPct != null
        ? `${firm.name} promo code — ${promo.discountPct}% off`
        : `${firm.name} promo code`,
    ...(promo.description ? { description: promo.description } : {}),
    ...(promo.endDate ? { availabilityEnds: promo.endDate } : {}),
    availability: promo.active ? 'https://schema.org/InStock' : 'https://schema.org/Discontinued',
    seller: {
      '@type': 'Organization',
      name: firm.name,
      ...(firm.websiteUrl ? { url: firm.websiteUrl } : {}),
    },
  }
}

export type BreadcrumbItem = { name: string; path: string }

/** BreadcrumbList — `path` is site-relative ('/prop-firms/ftmo'). */
export function breadcrumbLd(items: BreadcrumbItem[]): JsonLdObject {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}
