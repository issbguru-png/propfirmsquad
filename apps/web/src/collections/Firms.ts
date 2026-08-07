import type { CollectionConfig } from 'payload'
import { enforceDataDensityGate } from '../payload/dataDensity'
import { revalidateFirmAfterChange, revalidateFirmAfterDelete } from '../payload/revalidate'

export const Firms: CollectionConfig = {
  slug: 'firms',
  admin: {
    useAsTitle: 'name',
    group: 'Catalog',
    defaultColumns: ['name', 'listingType', 'reviewScore', 'lastVerifiedAt', '_status'],
  },
  versions: {
    drafts: true,
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Every firm-data edit refreshes the verification timestamp (CONTRACTS.md rule)
        data.lastVerifiedAt = new Date().toISOString()
        return data
      },
      // noindex until data-density threshold met (CONTRACTS.md publishing gate)
      enforceDataDensityGate,
    ],
    afterChange: [revalidateFirmAfterChange],
    afterDelete: [revalidateFirmAfterDelete],
  },
  fields: [
    // ── Identity ──────────────────────────────────────────────
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    {
      name: 'listingType',
      type: 'select',
      required: true,
      defaultValue: 'listed',
      options: ['listed', 'unlisted', 'delisted'],
    },
    {
      name: 'firmTypes',
      type: 'select',
      hasMany: true,
      required: true,
      options: ['cfd', 'futures', 'crypto', 'options', 'stocks'],
    },
    // ── Company facts ─────────────────────────────────────────
    { name: 'country', type: 'text', admin: { description: 'ISO2 of HQ/jurisdiction' } },
    { name: 'currency', type: 'text', defaultValue: 'USD' },
    { name: 'dateEstablished', type: 'date' },
    // ── Links ─────────────────────────────────────────────────
    { name: 'websiteUrl', type: 'text' },
    { name: 'affiliateUrl', type: 'text' },
    { name: 'trustpilotUrl', type: 'text' },
    { name: 'discordUrl', type: 'text' },
    // ── Media ─────────────────────────────────────────────────
    { name: 'logo', type: 'upload', relationTo: 'media' },
    { name: 'logoBackgroundColor', type: 'text', admin: { description: 'CSS color, e.g. #121355' } },
    // ── Offering ──────────────────────────────────────────────
    { name: 'maxAllocation', type: 'number' },
    {
      name: 'programTypes',
      type: 'select',
      hasMany: true,
      options: ['instant', '1-step', '2-step', '3-step'],
    },
    {
      name: 'assets',
      type: 'select',
      hasMany: true,
      options: ['fx', 'indices', 'metals', 'energy', 'crypto', 'stocks', 'other-commodities'],
    },
    { name: 'platforms', type: 'relationship', relationTo: 'platforms', hasMany: true },
    // ── Social proof ──────────────────────────────────────────
    { name: 'reviewScore', type: 'number', min: 0, max: 5 },
    { name: 'reviewsCount', type: 'number', defaultValue: 0 },
    { name: 'trustPilotScore', type: 'number', min: 0, max: 5 },
    {
      name: 'trustpilotHistory',
      type: 'array',
      admin: { description: 'Weekly tracked scores — powers the trend chart (our moat)' },
      fields: [
        { name: 'date', type: 'date', required: true },
        { name: 'score', type: 'number', required: true, min: 0, max: 5 },
      ],
    },
    { name: 'likesCount', type: 'number', defaultValue: 0 },
    // ── Editorial (localized) ─────────────────────────────────
    { name: 'verdict', type: 'richText', localized: true },
    {
      name: 'rulesSummary',
      type: 'group',
      fields: [
        {
          name: 'drawdownType',
          type: 'select',
          options: ['static', 'trailing-eod', 'trailing-intraday', 'hybrid'],
        },
        { name: 'consistencyRulePct', type: 'number', admin: { description: 'null = no consistency rule' } },
        { name: 'newsTradingAllowed', type: 'checkbox' },
        { name: 'eaAllowed', type: 'checkbox' },
        { name: 'minTradingDays', type: 'number' },
      ],
    },
    {
      name: 'payout',
      type: 'group',
      fields: [
        {
          name: 'methods',
          type: 'select',
          hasMany: true,
          options: ['crypto', 'bank-transfer', 'wise', 'paypal', 'other'],
        },
        { name: 'frequency', type: 'text', admin: { description: 'e.g. "bi-weekly", "on-demand after 14d"' } },
        { name: 'profitSplitPct', type: 'number', min: 0, max: 100 },
        { name: 'avgPayoutDays', type: 'number', admin: { description: 'Tracked from community proofs' } },
      ],
    },
    // ── Restrictions ──────────────────────────────────────────
    { name: 'restrictedCountries', type: 'relationship', relationTo: 'countries', hasMany: true },
    // ── Trust & workflow ──────────────────────────────────────
    { name: 'underReview', type: 'checkbox', defaultValue: false },
    { name: 'underReviewNote', type: 'text' },
    {
      name: 'lastVerifiedAt',
      type: 'date',
      admin: { readOnly: true, description: 'Auto-set on every save' },
    },
    // ── SEO ───────────────────────────────────────────────────
    {
      name: 'seo',
      type: 'group',
      fields: [
        { name: 'metaTitle', type: 'text', localized: true },
        { name: 'metaDescription', type: 'textarea', localized: true },
        {
          name: 'indexable',
          type: 'checkbox',
          defaultValue: false,
          admin: { description: 'Only enable once data-density threshold met (verdict + challenges + rules)' },
        },
      ],
    },
  ],
}
