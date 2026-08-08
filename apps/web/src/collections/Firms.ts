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
    // ── Trading conditions ────────────────────────────────────
    // Execution + recurring cost. These decide position sizing and the real
    // cost of a strategy, so they only ever hold values published by the firm.
    {
      name: 'trading',
      type: 'group',
      admin: { description: 'Execution and cost conditions. Firm-published values only.' },
      fields: [
        {
          name: 'broker',
          type: 'text',
          admin: {
            description:
              'Broker / liquidity provider that executes fills, e.g. "Purple Trading Seychelles"',
          },
        },
        {
          name: 'leverage',
          type: 'array',
          admin: {
            description:
              'Max leverage per asset class. Set programType when the firm publishes different leverage per program.',
          },
          fields: [
            {
              name: 'asset',
              type: 'select',
              required: true,
              options: ['fx', 'indices', 'metals', 'energy', 'crypto', 'stocks', 'other-commodities'],
            },
            {
              name: 'programType',
              type: 'select',
              defaultValue: 'all',
              options: ['all', 'instant', '1-step', '2-step', '3-step'],
              admin: { description: '"all" = same leverage across every program' },
            },
            { name: 'ratio', type: 'text', required: true, admin: { description: 'e.g. "1:100"' } },
          ],
        },
        {
          name: 'commissions',
          type: 'array',
          admin: { description: 'Round-turn commission per asset class, as the firm states it' },
          fields: [
            {
              name: 'asset',
              type: 'select',
              required: true,
              options: ['fx', 'indices', 'metals', 'energy', 'crypto', 'stocks', 'other-commodities'],
            },
            {
              name: 'cost',
              type: 'text',
              required: true,
              admin: { description: 'e.g. "$3 per lot per side", "0.05% of volume", "None"' },
            },
          ],
        },
      ],
    },
    // How the trader PAYS for a challenge — distinct from payout.methods
    {
      name: 'paymentMethods',
      type: 'select',
      hasMany: true,
      options: ['card', 'apple-pay', 'google-pay', 'paypal', 'crypto', 'bank-transfer', 'other'],
      admin: {
        description:
          'Accepted checkout methods (how the trader pays the firm). Not the same as payout.methods.',
      },
    },
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
        {
          name: 'weekendHolding',
          type: 'select',
          options: [
            { label: 'Allowed', value: 'allowed' },
            { label: 'Not allowed', value: 'not-allowed' },
            { label: 'Swing / add-on accounts only', value: 'swing-only' },
          ],
          admin: {
            description:
              'Holding positions through the weekend close on the firm\'s standard program. Leave empty when unverified.',
          },
        },
        {
          name: 'timeLimitsVerified',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description:
              'Tick ONLY after checking every challenge time limit against the firm\'s own site. This enables the "Time limit" column, where an empty challenges.timeLimitDays renders as "No time limit" — leaving it off keeps us from claiming "unlimited" for a firm we have not researched.',
          },
        },
        {
          name: 'copyTradingAllowed',
          type: 'checkbox',
          admin: { description: 'Copying your own or a third party\'s trades across accounts' },
        },
        {
          name: 'hftAllowed',
          type: 'checkbox',
          admin: { description: 'High-frequency / latency-arbitrage style strategies' },
        },
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
        {
          name: 'firstPayoutDays',
          type: 'number',
          admin: {
            description:
              'Days from funding until the FIRST withdrawal can be requested (the cycle after that is `frequency`).',
          },
        },
        {
          name: 'minPayoutAmount',
          type: 'number',
          admin: { description: 'Minimum withdrawable amount, in the firm currency. null = none stated.' },
        },
        {
          name: 'splitScaling',
          type: 'text',
          localized: true,
          admin: {
            description:
              'How the split grows, e.g. "80% base, 90% after 3 consecutive payouts". Leave empty when the split is flat.',
          },
        },
      ],
    },
    // ── Leadership (named accountable humans = trust signal) ──
    {
      name: 'leadership',
      type: 'group',
      admin: { description: 'Only publicly named, firm-confirmed people.' },
      fields: [
        { name: 'ceoName', type: 'text' },
        { name: 'ceoRole', type: 'text', admin: { description: 'Defaults to "CEO" when empty' } },
        { name: 'ceoLinkedinUrl', type: 'text' },
      ],
    },
    {
      name: 'prosCons',
      type: 'group',
      admin: { description: 'Editorial pros & cons shown on the profile page' },
      fields: [
        {
          name: 'pros',
          type: 'array',
          fields: [{ name: 'text', type: 'text', required: true, localized: true }],
        },
        {
          name: 'cons',
          type: 'array',
          fields: [{ name: 'text', type: 'text', required: true, localized: true }],
        },
      ],
    },
    {
      name: 'scores',
      type: 'group',
      admin: { description: 'Editorial subscores powering the profile breakdown (0–5)' },
      fields: (
        ['pricingValue', 'rulesFairness', 'payoutReliability', 'support', 'platforms'] as const
      ).map((name) => ({
        name,
        type: 'number' as const,
        min: 0,
        max: 5,
        admin: { step: 0.1 },
      })),
    },
    // ── Restrictions ──────────────────────────────────────────
    { name: 'restrictedCountries', type: 'relationship', relationTo: 'countries', hasMany: true },
    // ── Trust & workflow ──────────────────────────────────────
    { name: 'underReview', type: 'checkbox', defaultValue: false },
    { name: 'underReviewNote', type: 'text' },
    // ── Risk register (powers /firms-to-avoid) ────────────────
    // LEGAL: every non-`none` riskStatus MUST be backed by ≥1 riskEvents row
    // with a working public sourceUrl. Neutral, factual wording only — state
    // what happened and when; never characterise in our own voice.
    {
      name: 'riskStatus',
      type: 'select',
      defaultValue: 'none',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Under review', value: 'watch' },
        { label: 'Ceased operations', value: 'ceased' },
        { label: 'Regulatory action', value: 'regulatory' },
        { label: 'Acquired / rebranded', value: 'rebranded' },
      ],
      admin: {
        description:
          'Only set above "none" when a dated, publicly verifiable source exists in riskEvents.',
      },
    },
    {
      name: 'riskSummary',
      type: 'text',
      localized: true,
      admin: { description: 'One factual sentence: what happened and when. No characterisation.' },
    },
    {
      name: 'riskEvents',
      type: 'array',
      admin: { description: 'Dated public record. Each row REQUIRES a source URL.' },
      fields: [
        { name: 'date', type: 'date', required: true },
        { name: 'event', type: 'text', required: true, localized: true },
        {
          name: 'sourceUrl',
          type: 'text',
          required: true,
          admin: { description: 'Public, verifiable URL (regulator, court, or firm announcement).' },
        },
      ],
    },
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
