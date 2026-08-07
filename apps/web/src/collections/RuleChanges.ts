import type { CollectionConfig } from 'payload'
import { firmRelatedRevalidation } from '../payload/revalidate'

export const RuleChanges: CollectionConfig = {
  slug: 'rule-changes',
  admin: {
    useAsTitle: 'summary',
    group: 'Content',
    defaultColumns: ['summary', 'firm', 'date', 'source'],
    description: 'Per-firm rule-change timeline — unique content moat, renders on profiles',
  },
  hooks: firmRelatedRevalidation(['/rule-changes']),
  access: {
    read: () => true,
  },
  fields: [
    { name: 'firm', type: 'relationship', relationTo: 'firms', required: true, index: true },
    { name: 'date', type: 'date', required: true },
    { name: 'summary', type: 'text', required: true, localized: true },
    { name: 'details', type: 'textarea', localized: true },
    { name: 'source', type: 'text', admin: { description: 'URL or "official Discord" etc.' } },
  ],
}
