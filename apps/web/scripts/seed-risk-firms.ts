/**
 * Seed the risk register behind /firms-to-avoid.
 *
 * ── LEGAL CONTRACT (read before editing) ─────────────────────────────────────
 * Publishing a status claim about a named company is only defensible when it
 * rests on a documented, dated, publicly verifiable event. Therefore:
 *
 *   1. Every entry MUST carry >= 1 riskEvent with a real date and a public
 *      sourceUrl (regulator, court, or the firm's own announcement).
 *      `getRiskFirms()` drops any record that fails this, so an unsourced entry
 *      silently disappears from the page rather than being published.
 *   2. Neutral, factual voice. State what happened and when. Never assert
 *      "scam" / "fraud" / "steals money" in our own voice — where an allegation
 *      is being described, it is attributed ("the CFTC alleged…") and, where the
 *      matter later resolved, the resolution is recorded in the SAME entry.
 *   3. Status labels are categories, not verdicts: ceased / regulatory /
 *      rebranded / watch.
 *   4. Records are created with listingType 'delisted' and seo.indexable false,
 *      so they never enter a ranking (getFirms allow-lists 'listed') and never
 *      enter the sitemap (firmEntries requires seo.indexable).
 *
 * Rerunnable: upserts by slug and replaces riskEvents wholesale.
 *
 * Run: corepack pnpm --filter web exec payload run scripts/seed-risk-firms.ts
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Firm } from '../src/payload-types'

type RiskEntry = {
  name: string
  slug: string
  firmTypes: Firm['firmTypes']
  country?: string
  websiteUrl?: string
  riskStatus: NonNullable<Firm['riskStatus']>
  riskSummary: string
  riskEvents: { date: string; event: string; sourceUrl: string }[]
}

/**
 * Each entry below was verified against the cited source. Where a matter was
 * later dismissed or the firm resumed operating, that fact is recorded as its
 * own event — an entry is a timeline, not an accusation.
 */
const ENTRIES: RiskEntry[] = [
  {
    name: 'My Forex Funds',
    slug: 'my-forex-funds',
    firmTypes: ['cfd'],
    country: 'CA',
    riskStatus: 'regulatory',
    riskSummary:
      'The CFTC filed a civil complaint against operator Traders Global Group in August 2023 and the firm stopped selling challenges; in May 2025 the court dismissed the complaint with prejudice and sanctioned the CFTC.',
    riskEvents: [
      {
        date: '2023-09-02T00:00:00.000Z',
        event:
          'The CFTC announced a civil enforcement complaint against Traders Global Group Inc. (doing business as My Forex Funds) and its CEO Murtuza Kazmi. A statutory restraining order signed on 29 August 2023 froze the defendants’ assets, and the firm stopped selling new challenges.',
        sourceUrl: 'https://www.cftc.gov/PressRoom/PressReleases/8771-23',
      },
      {
        date: '2025-05-13T00:00:00.000Z',
        event:
          'The US District Court for the District of New Jersey dismissed the CFTC’s complaint with prejudice, meaning it cannot be refiled, and granted the defendants’ sanctions motion, ordering the CFTC to pay legal fees. The dismissal followed a special master’s finding that the agency had misled the court.',
        sourceUrl:
          'https://www.financemagnates.com/forex/my-forex-funds-parent-defeats-cftc-in-court-as-judge-imposes-sanctions/',
      },
      {
        date: '2025-10-06T00:00:00.000Z',
        event:
          'My Forex Funds signalled on social media that it was preparing a return to the market, saying updates would come only from the firm or the court system.',
        sourceUrl:
          'https://www.financemagnates.com/forex/myforexfunds-hints-at-comeback-after-winning-legal-battle-against-cftc/',
      },
    ],
  },
  {
    name: 'The Traders Domain',
    slug: 'the-traders-domain',
    firmTypes: ['cfd'],
    country: 'VC',
    riskStatus: 'regulatory',
    riskSummary:
      'The CFTC filed a civil fraud action in 2024 naming Traders Domain FX Ltd and 15 other defendants; a court-appointed receivership has since run a customer claims process. The allegations have not been proven in court.',
    riskEvents: [
      {
        date: '2024-10-15T00:00:00.000Z',
        event:
          'The CFTC announced a civil enforcement action in the Southern District of Florida against Traders Domain FX Ltd (doing business as The Traders Domain), its two co-founders and related entities. The CFTC alleged the defendants made material fraudulent representations and misappropriated customer funds in a scheme involving more than $283 million in customer deposits. These are allegations; they have not been proven in court.',
        sourceUrl: 'https://www.cftc.gov/PressRoom/PressReleases/8997-24',
      },
      {
        date: '2025-06-03T00:00:00.000Z',
        event:
          'The CFTC alerted Traders Domain customers that claims to the court-appointed receivership had to be filed by 28 July 2025 to remain eligible for recovery, and that responding to its earlier voluntary survey did not count as filing a claim.',
        sourceUrl: 'https://www.cftc.gov/PressRoom/PressReleases/9083-25',
      },
    ],
  },
  {
    name: 'FundingTicks',
    slug: 'fundingticks',
    firmTypes: ['futures'],
    riskStatus: 'ceased',
    riskSummary:
      'FundingTicks, the futures brand operated by FundingPips, announced on 18 January 2026 that it was winding down, publishing a tiered refund and payout plan for existing traders.',
    riskEvents: [
      {
        date: '2025-12-01T00:00:00.000Z',
        event:
          'In December 2025 FundingTicks introduced rule changes including a one-minute minimum holding time, higher profit targets and a reduced profit split. Traders reported the changes affected accounts already in progress, and the firm’s Trustpilot score fell from 4.1 to 3.2.',
        sourceUrl:
          'https://www.financemagnates.com/forex/following-profit-cuts-and-trading-limits-prop-firm-fundingticks-begins-winding-down/',
      },
      {
        date: '2026-01-18T00:00:00.000Z',
        event:
          'FundingTicks announced it was winding down operations, describing it as a strategic decision to concentrate resources elsewhere. It set out full refunds for evaluation accounts, a reward split for master accounts, and payouts of realised profits for funded accounts. Only the FundingTicks futures brand was wound down.',
        sourceUrl: 'https://tradeinformer.com/broker-news/fundingpips-shuts-futures-prop-firm-fundingticks',
      },
    ],
  },
  {
    name: 'Smart Prop Trader',
    slug: 'smart-prop-trader',
    firmTypes: ['cfd'],
    riskStatus: 'ceased',
    riskSummary:
      'Smart Prop Trader announced in November 2024 that it would close on 29 December 2024, publishing a payout and refund plan for existing traders ahead of the date.',
    riskEvents: [
      {
        date: '2024-11-28T00:00:00.000Z',
        event:
          'Smart Prop Trader announced it would cease operations on 29 December 2024. It said existing traders would keep regular payout schedules until then, that November 2024 account holders at break-even or above would receive full refunds, and that accounts in good standing would be given individual resolution plans.',
        sourceUrl:
          'https://www.financemagnates.com/forex/another-prop-firm-announces-closure-in-year-that-saw-50-companies-shutter/',
      },
    ],
  },
  {
    name: 'Skilled Funded Traders',
    slug: 'skilled-funded-traders',
    firmTypes: ['cfd'],
    riskStatus: 'ceased',
    riskSummary:
      'Skilled Funded Traders, operated by Easton Consulting Technologies, posted a notice suspending all operations in late March 2024 and has not resumed trading.',
    riskEvents: [
      {
        date: '2024-03-29T00:00:00.000Z',
        event:
          'Skilled Funded Traders posted a website notice suspending operations effective immediately, saying it would follow up with traders individually while it explored alternatives to resume operations. It was the second Easton-managed prop firm to suspend operations that month, after The Funded Trader.',
        sourceUrl:
          'https://www.financemagnates.com/forex/easton-controlled-skilled-funded-trader-suspends-prop-trading-operations/',
      },
    ],
  },
  {
    name: 'The Funded Trader',
    slug: 'the-funded-trader',
    firmTypes: ['cfd'],
    riskStatus: 'watch',
    riskSummary:
      'The Funded Trader paused all operations and payouts in March 2024 following a platform migration, relaunched later that year, and has since reported clearing the payout backlog in tranches.',
    riskEvents: [
      {
        date: '2024-03-28T00:00:00.000Z',
        event:
          'The Funded Trader announced it was temporarily pausing all operations and would relaunch the brand. It had earlier suspended payouts, citing what it called a self-imposed internal audit.',
        sourceUrl:
          'https://www.financemagnates.com/forex/breaking-prop-trading-firm-the-funded-trader-pauses-all-operations/',
      },
      {
        date: '2024-08-21T00:00:00.000Z',
        event:
          'Five months after the pause the firm published a progress update, saying it had sent out 30% of the payouts owed to traders, processed 55% of affiliate payouts, and distributed 70% of the accounts owed, while relaunching its products.',
        sourceUrl:
          'https://www.financemagnates.com/forex/prop-trading-the-funded-trader-resurfaces-five-months-after-pausing-operations/',
      },
    ],
  },
  {
    name: 'OANDA Prop Trader',
    slug: 'oanda-prop-trader',
    firmTypes: ['cfd'],
    riskStatus: 'rebranded',
    riskSummary:
      'OANDA announced that its prop-trading business would transition into FTMO Group, with client migration beginning 2 March 2026; OANDA no longer directly operates a proprietary trading programme after the transition period.',
    riskEvents: [
      {
        date: '2026-03-02T00:00:00.000Z',
        event:
          'OANDA announced the transition of OANDA Prop Trader into FTMO Group, which had acquired OANDA. Client migration was scheduled to begin on 2 March 2026, and OANDA said clients who chose not to migrate would receive full refunds where applicable.',
        sourceUrl:
          'https://www.financemagnates.com/forex/oanda-transitions-prop-trading-clients-to-ftmo-as-brokerage-refocuses/',
      },
      {
        date: '2026-03-31T00:00:00.000Z',
        event:
          'OANDA stated the transition period would conclude on 31 March 2026, after which it would refocus on its regulated brokerage business and no longer directly operate a proprietary trading programme.',
        sourceUrl: 'https://www.oanda.com/group/press-release/oanda-prop-trader-transition-ftmo-group/',
      },
    ],
  },
  {
    name: 'TopTier Trader',
    slug: 'toptier-trader',
    firmTypes: ['cfd', 'futures'],
    riskStatus: 'rebranded',
    riskSummary:
      'TopTier Trader rebranded to TX3 Funding in September 2025, moving to a broker-backed model under TX3 Markets; the firm said existing accounts and challenge stages carried over unchanged.',
    riskEvents: [
      {
        date: '2025-09-25T00:00:00.000Z',
        event:
          'TopTier Trader announced it had rebranded to TX3 Funding, consolidating its forex and futures programmes on one platform with backing from the broker TX3 Markets. The firm said all existing accounts, terms and challenge stages would continue under the new brand and that traders did not need to take any action.',
        sourceUrl: 'https://www.tx3funding.com/en/ttt-to-tx3',
      },
    ],
  },
]

const payload = await getPayload({ config })

for (const entry of ENTRIES) {
  // Guard the legal contract at write time too, not just at read time.
  const unsourced = entry.riskEvents.filter((e) => !e.date || !e.sourceUrl)
  if (entry.riskEvents.length === 0 || unsourced.length > 0) {
    throw new Error(`${entry.name}: every risk event needs a date and a sourceUrl — refusing to seed.`)
  }

  const data = {
    name: entry.name,
    slug: entry.slug,
    // Never a ranked firm: delisted keeps it out of getFirms/getAlternatives,
    // indexable:false keeps it out of the sitemap.
    listingType: 'delisted' as const,
    firmTypes: entry.firmTypes,
    ...(entry.country ? { country: entry.country } : {}),
    ...(entry.websiteUrl ? { websiteUrl: entry.websiteUrl } : {}),
    riskStatus: entry.riskStatus,
    riskSummary: entry.riskSummary,
    riskEvents: entry.riskEvents,
    seo: { indexable: false },
    _status: 'published' as const,
  }

  const existing = await payload.find({
    collection: 'firms',
    where: { slug: { equals: entry.slug } },
    limit: 1,
    depth: 0,
  })

  if (existing.docs[0]) {
    await payload.update({ collection: 'firms', id: existing.docs[0].id, data })
    console.log(`updated  ${entry.name} (${entry.riskStatus}, ${entry.riskEvents.length} events)`)
  } else {
    await payload.create({ collection: 'firms', data })
    console.log(`created  ${entry.name} (${entry.riskStatus}, ${entry.riskEvents.length} events)`)
  }
}

console.log(`\nDone: ${ENTRIES.length} risk-register entries seeded.`)
