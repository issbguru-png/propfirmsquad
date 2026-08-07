/**
 * Config for /best/[list] ranking hubs. Adding a new hub = adding one entry
 * here — the route, static params, metadata, JSON-LD and cross-links all
 * derive from this array. No other file needs to change.
 */
import type { Firm } from '@/payload-types'
import type { FaqItem } from '@/lib/seo/jsonld'
import { CURRENT_YEAR } from '../../_lib/format'

export type FirmType = Firm['firmTypes'][number]

export type BestList = {
  /** URL segment: /best/{slug} */
  slug: string
  /** Page H1 (may differ from the <title>). */
  h1: string
  /** Passed verbatim to bestListMeta. */
  title: string
  /** Meta description, passed to bestListMeta. */
  description: string
  /** Lead-in sentence rendered before the top-3 direct answer. */
  intro: string
  /** firm.firmTypes value the hub filters on ('cfd' covers CFD/forex). */
  filter: FirmType
  /** 3–5 Q&As rendered as plain HTML and emitted as FAQPage JSON-LD. */
  faq: FaqItem[]
}

export const BEST_LISTS: BestList[] = [
  {
    slug: 'cfd-prop-firms',
    h1: `Best CFD / Forex Prop Firms of ${CURRENT_YEAR}`,
    title: `Best CFD / Forex Prop Firms ${CURRENT_YEAR}`,
    description: `The best CFD and forex prop firms of ${CURRENT_YEAR}, ranked by verified trader reviews, Trustpilot trend, rule fairness, and tracked payout data — never by affiliate commission.`,
    intro:
      'CFD prop firms fund forex, indices, metals, and commodities traders through simulated challenge accounts — pass the evaluation, keep a share of the profits.',
    filter: 'cfd',
    faq: [
      {
        question: 'What is a CFD prop firm?',
        answer:
          'A CFD prop firm gives traders access to a funded account for trading contracts for difference — typically forex pairs, indices, metals, and energies. You pay a one-time evaluation fee, prove you can trade profitably within the firm’s drawdown and target rules, and then split profits from a funded account, usually keeping 80–90%.',
      },
      {
        question: 'How do CFD prop firm challenges work?',
        answer:
          'Most CFD firms run a 1-step or 2-step evaluation: hit a profit target (commonly 8–10% in phase one) without breaching daily or overall drawdown limits. Pass every phase and you receive a funded account. Some firms also sell instant-funding accounts that skip the evaluation for a higher fee and a lower initial profit split.',
      },
      {
        question: 'Are CFD prop firms legit?',
        answer:
          'The established ones pay out reliably, but quality varies widely — which is why we track verified trader reviews, weekly Trustpilot trends, and dated payout proofs for every firm we list. Check a firm’s payout evidence and rule-change history on its profile before buying a challenge, and treat any firm with credible non-payment reports as under review.',
      },
      {
        question: 'How much funding can I get from a CFD prop firm?',
        answer:
          'Standard challenge accounts run from $5,000 to $200,000, and most firms let consistent traders scale a single account to $1–4 million through scaling plans. The comparison table above lists each firm’s maximum allocation.',
      },
      {
        question: 'How do we pick the best CFD prop firms?',
        answer:
          'Rankings combine verified trader reviews submitted on our platform, weekly Trustpilot trend tracking, rule-fairness audits of drawdown and consistency rules, and dated payout evidence. Affiliate commissions never influence position — the full methodology is public.',
      },
    ],
  },
  {
    slug: 'futures-prop-firms',
    h1: `Best Futures Prop Firms of ${CURRENT_YEAR}`,
    title: `Best Futures Prop Firms ${CURRENT_YEAR}`,
    description: `The best futures prop firms of ${CURRENT_YEAR}, ranked by verified trader reviews, Trustpilot trend, rule fairness, and tracked payout data — never by affiliate commission.`,
    intro:
      'Futures prop firms fund traders on real exchange-traded contracts — ES, NQ, crude, gold — with transparent, exchange-regulated pricing instead of broker spreads.',
    filter: 'futures',
    faq: [
      {
        question: 'What is a futures prop firm?',
        answer:
          'A futures prop firm funds traders on exchange-listed futures contracts like the E-mini S&P 500 (ES), Nasdaq (NQ), crude oil, and gold. Because futures trade on centralized exchanges with public pricing, fills and data feeds are more transparent than CFD trading, and evaluations are usually measured in fixed dollar targets rather than percentages.',
      },
      {
        question: 'How are futures evaluations different from CFD challenges?',
        answer:
          'Futures firms typically run a single-phase evaluation with a fixed profit target and a trailing drawdown measured in dollars, and many bill the evaluation as a monthly subscription rather than a one-time fee. Contract limits scale as your balance grows, and most firms enforce consistency rules on daily profits.',
      },
      {
        question: 'What is a trailing drawdown?',
        answer:
          'A trailing drawdown moves up with your account high-water mark: if the limit is $2,500 and you make $1,000, your liquidation level rises by $1,000 too. Some firms trail on end-of-day balance (more forgiving) while others trail intraday on unrealized profit — each firm’s drawdown type is audited on its profile.',
      },
      {
        question: 'How do futures prop firm payouts work?',
        answer:
          'Most futures firms let you withdraw once you clear a safety buffer above the drawdown level, with profit splits of 80–100% and payout cycles from on-demand to bi-weekly. We aggregate dated community payout proofs into real payout-speed data on each firm’s profile instead of trusting advertised claims.',
      },
    ],
  },
  {
    slug: 'crypto-prop-firms',
    h1: `Best Crypto Prop Firms of ${CURRENT_YEAR}`,
    title: `Best Crypto Prop Firms ${CURRENT_YEAR}`,
    description: `The best crypto prop firms of ${CURRENT_YEAR}, ranked by verified trader reviews, Trustpilot trend, rule fairness, and tracked payout data — never by affiliate commission.`,
    intro:
      'Crypto prop firms fund traders on Bitcoin, Ethereum, and altcoin pairs — often with 24/7 markets, crypto-native payouts, and deeper coin coverage than CFD firms offer.',
    filter: 'crypto',
    faq: [
      {
        question: 'What is a crypto prop firm?',
        answer:
          'A crypto prop firm funds traders to speculate on cryptocurrency pairs — BTC, ETH, and a range of altcoins — through an evaluation model similar to forex prop firms: pass a challenge within drawdown rules, then trade a funded account for a profit split. Dedicated crypto firms usually list far more coins than the handful of crypto CFDs a forex firm offers.',
      },
      {
        question: 'Can I trade crypto 24/7 on a funded account?',
        answer:
          'Usually yes — crypto markets never close, and most crypto prop firms allow weekend trading and holding. Rules still vary by firm on leverage, position sizing, and holding over high-volatility events, so check the audited rules on each firm’s profile before buying a challenge.',
      },
      {
        question: 'How do crypto prop firms pay out?',
        answer:
          'Most pay in stablecoins or major cryptocurrencies via on-chain transfer, which is typically faster than bank wires — some settle payouts within hours. Profit splits generally run 70–90%. We track dated payout proofs for each firm so you can see real payout speed, not marketing claims.',
      },
      {
        question: 'Are crypto prop firms riskier than forex prop firms?',
        answer:
          'The evaluation fee you risk is the same kind of sunk cost, but crypto’s volatility makes drawdown rules easier to breach, and the sector is younger with fewer long-established firms. That makes verified reviews, Trustpilot trend, and payout evidence — the data this ranking is built on — even more important before you pay for a challenge.',
      },
    ],
  },
]

export function getList(slug: string): BestList | undefined {
  return BEST_LISTS.find((l) => l.slug === slug)
}
