import type { CollectionConfig } from 'payload'

export const Challenges: CollectionConfig = {
  slug: 'challenges',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'firm', 'accountSize', 'price', 'isActive'],
  },
  access: {
    read: () => true,
  },
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
    { name: 'refundableFee', type: 'checkbox', defaultValue: false },
    { name: 'isActive', type: 'checkbox', defaultValue: true },
  ],
}
