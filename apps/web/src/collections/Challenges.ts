import type { CollectionConfig } from 'payload'
import { firmRelatedRevalidation } from '../payload/revalidate'

export const Challenges: CollectionConfig = {
  slug: 'challenges',
  admin: {
    useAsTitle: 'name',
    group: 'Catalog',
    defaultColumns: ['name', 'firm', 'steps', 'accountSize', 'price', 'isActive'],
  },
  access: {
    read: () => true,
  },
  hooks: firmRelatedRevalidation(),
  fields: [
    { name: 'firm', type: 'relationship', relationTo: 'firms', required: true, index: true },
    { name: 'name', type: 'text', required: true, admin: { description: 'e.g. "Stellar 2-Step 100K"' } },
    {
      name: 'steps',
      type: 'select',
      required: true,
      options: ['instant', '1-step', '2-step', '3-step'],
    },
    { name: 'accountSize', type: 'number', required: true },
    { name: 'price', type: 'number', required: true },
    { name: 'currency', type: 'text', defaultValue: 'USD' },
    {
      name: 'profitTargets',
      type: 'array',
      fields: [
        { name: 'phase', type: 'number', required: true },
        { name: 'targetPct', type: 'number', required: true },
      ],
    },
    { name: 'maxDailyLossPct', type: 'number' },
    { name: 'maxTotalDrawdownPct', type: 'number' },
    {
      name: 'drawdownType',
      type: 'select',
      options: ['static', 'trailing-eod', 'trailing-intraday', 'hybrid'],
    },
    { name: 'profitSplitPct', type: 'number' },
    {
      name: 'timeLimitDays',
      type: 'number',
      admin: {
        description:
          'Calendar days allowed to complete this challenge. LEAVE EMPTY (null) when the firm advertises NO time limit / unlimited — empty is rendered as "No time limit", so only leave it empty once verified.',
      },
    },
    { name: 'refundableFee', type: 'checkbox', defaultValue: false },
    {
      name: 'feeNote',
      type: 'text',
      localized: true,
      admin: {
        description:
          'Fine-print note rendered as a footnote on the pricing table, e.g. staged fees where total cost differs from the entry price',
      },
    },
    { name: 'isActive', type: 'checkbox', defaultValue: true },
  ],
}
