/**
 * Data-density publishing gate (lane A).
 *
 * CONTRACTS.md: firms render noindex until `verdict`, ≥1 challenge and
 * rulesSummary are present. This hook enforces the machine-checkable part:
 * `seo.indexable` is forced to false whenever the verdict is empty OR the
 * firm has no active challenges. It never flips indexable on by itself —
 * editors opt in once the threshold is met.
 */
import type { CollectionBeforeChangeHook } from 'payload'

/** Recursively extract plain text from a Lexical richText value. */
const richTextToPlainText = (node: unknown): string => {
  if (!node || typeof node !== 'object') return ''
  const record = node as Record<string, unknown>
  let text = typeof record.text === 'string' ? record.text : ''
  const children = Array.isArray(record.children) ? record.children : []
  for (const child of children) text += richTextToPlainText(child)
  if ('root' in record) text += richTextToPlainText(record.root)
  return text
}

/** True when a localized richText verdict actually contains content. */
export const hasVerdictContent = (verdict: unknown): boolean =>
  richTextToPlainText(verdict).trim().length > 0

export const enforceDataDensityGate: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  if (!data) return data

  const wantsIndexable = (data.seo ?? originalDoc?.seo)?.indexable === true
  if (!wantsIndexable) return data // already noindex — nothing to enforce

  const verdict = 'verdict' in data ? data.verdict : originalDoc?.verdict
  let dense = hasVerdictContent(verdict)

  if (dense) {
    const firmId = originalDoc?.id ?? data.id
    if (!firmId) {
      dense = false // brand-new firm can't have challenges yet
    } else {
      try {
        const { totalDocs } = await req.payload.count({
          collection: 'challenges',
          where: {
            and: [{ firm: { equals: firmId } }, { isActive: { equals: true } }],
          },
        })
        dense = totalDocs > 0
      } catch {
        dense = false // fail closed: keep noindex if the check errors
      }
    }
  }

  if (!dense) {
    data.seo = { ...(originalDoc?.seo ?? {}), ...(data.seo ?? {}), indexable: false }
  }
  return data
}
