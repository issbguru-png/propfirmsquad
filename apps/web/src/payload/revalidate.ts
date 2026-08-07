/**
 * Shared on-demand revalidation helpers (lane A).
 *
 * Route map (docs/ROUTES.md): firm data feeds the profile page
 * `/prop-firms/[slug]`, its `/promo-code` child, the home page `/`,
 * the `/prop-firms` directory and the `/best/[list]` hub pages.
 *
 * Hooks must no-op outside the Next.js runtime (e.g. `payload run` scripts,
 * seeds, CSV imports) — so both the `next/cache` import and every
 * `revalidatePath` call are wrapped in try/catch.
 */
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  PayloadRequest,
} from 'payload'

/** Revalidate a list of paths; silently no-ops outside the Next runtime. */
export const revalidatePaths = async (
  paths: (string | null | undefined)[],
): Promise<void> => {
  let revalidatePath: (path: string, type?: 'page' | 'layout') => void
  try {
    ;({ revalidatePath } = await import('next/cache'))
  } catch {
    return // next/cache unavailable (standalone script) — nothing to do
  }
  for (const path of new Set(paths.filter((p): p is string => Boolean(p)))) {
    try {
      // Dynamic-route patterns like `/best/[list]` revalidate every page
      // rendered by that route.
      revalidatePath(path, path.includes('[') ? 'page' : undefined)
    } catch {
      // Called outside a request scope (payload run / seed) — ignore.
    }
  }
}

/** Routes affected by any firm-level data change. */
export const firmRoutes = (slug?: string | null): string[] => [
  ...(slug ? [`/prop-firms/${slug}`, `/prop-firms/${slug}/promo-code`] : []),
  '/',
  '/prop-firms',
  '/best/[list]',
]

/** Resolve a firm relationship value (id or populated doc) to its slug. */
const resolveFirmSlug = async (
  req: PayloadRequest,
  firm: unknown,
): Promise<string | null> => {
  if (!firm) return null
  if (typeof firm === 'object' && 'slug' in (firm as Record<string, unknown>)) {
    return ((firm as { slug?: unknown }).slug as string) ?? null
  }
  if (typeof firm === 'number' || typeof firm === 'string') {
    try {
      const doc = await req.payload.findByID({
        collection: 'firms',
        id: firm,
        depth: 0,
      })
      return doc?.slug ?? null
    } catch {
      return null
    }
  }
  return null
}

// ── Firms ────────────────────────────────────────────────────────────

export const revalidateFirmAfterChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
}) => {
  await revalidatePaths([
    ...firmRoutes(doc?.slug),
    // If the slug was renamed, flush the old URLs too.
    ...(previousDoc?.slug && previousDoc.slug !== doc?.slug
      ? firmRoutes(previousDoc.slug)
      : []),
  ])
  return doc
}

export const revalidateFirmAfterDelete: CollectionAfterDeleteHook = async ({
  doc,
}) => {
  await revalidatePaths(firmRoutes(doc?.slug))
  return doc
}

// ── Firm-related collections (challenges, promos, reviews, rule-changes) ──

/**
 * Hook factory for collections that hang off a firm via a `firm`
 * relationship. Revalidates the owning firm's routes plus any
 * collection-specific extras (e.g. `/deals` for promos).
 */
export const firmRelatedRevalidation = (
  extraPaths: string[] = [],
): {
  afterChange: CollectionAfterChangeHook[]
  afterDelete: CollectionAfterDeleteHook[]
} => {
  const collect = async (req: PayloadRequest, docs: unknown[]) => {
    const paths: (string | null)[] = [...extraPaths]
    const seen = new Set<string>()
    for (const d of docs) {
      const firm = (d as { firm?: unknown } | null | undefined)?.firm
      const slug = await resolveFirmSlug(req, firm)
      if (slug && !seen.has(slug)) {
        seen.add(slug)
        paths.push(...firmRoutes(slug))
      }
    }
    if (paths.length > 0) await revalidatePaths(paths)
  }

  const afterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
    await collect(req, [doc, previousDoc])
    return doc
  }
  const afterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
    await collect(req, [doc])
    return doc
  }
  return { afterChange: [afterChange], afterDelete: [afterDelete] }
}

// ── News posts (slug-addressed content, optional firm relationship) ──

export const revalidateNewsAfterChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  const paths: (string | null)[] = ['/', '/news']
  if (doc?.slug) paths.push(`/news/${doc.slug}`)
  if (previousDoc?.slug && previousDoc.slug !== doc?.slug) {
    paths.push(`/news/${previousDoc.slug}`)
  }
  const firmSlug = await resolveFirmSlug(req, doc?.firm ?? previousDoc?.firm)
  if (firmSlug) paths.push(...firmRoutes(firmSlug))
  await revalidatePaths(paths)
  return doc
}

export const revalidateNewsAfterDelete: CollectionAfterDeleteHook = async ({
  doc,
  req,
}) => {
  const paths: (string | null)[] = ['/', '/news']
  if (doc?.slug) paths.push(`/news/${doc.slug}`)
  const firmSlug = await resolveFirmSlug(req, doc?.firm)
  if (firmSlug) paths.push(...firmRoutes(firmSlug))
  await revalidatePaths(paths)
  return doc
}
