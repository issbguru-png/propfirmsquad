import type { CollectionConfig } from 'payload'

export const RuleChanges: CollectionConfig = {
  slug: 'rule-changes',
  admin: {
    useAsTitle: 'summary',
    defaultColumns: ['firm', 'date', 'summary'],
    description: 'Per-firm rule-change timeline — unique content moat, renders on profiles',
  },
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
