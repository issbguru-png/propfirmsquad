/**
 * FAQ fixtures — data-driven question/answer pairs for firm profiles.
 * Answers are generated from real firm data where available and stay
 * deliberately hedged ("being verified") where the DB has no value yet.
 * Swap for CMS-managed FAQs once lane A adds a faqs field/collection.
 */
import type { Firm, Promo } from '@/payload-types'

export type Faq = { question: string; answer: string }

type BuildArgs = {
  firm: Firm
  promos?: Promo[]
  cheapestPrice?: number | null
  platformNames?: string[]
}

const year = (iso?: string | null) => (iso ? new Date(iso).getUTCFullYear() : null)

export function buildFirmFaqs({ firm, promos = [], cheapestPrice, platformNames = [] }: BuildArgs): Faq[] {
  const faqs: Faq[] = []
  const est = year(firm.dateEstablished)
  const promo = promos[0]

  // "is {firm} legit" — the AI-Overview target question
  const legitBits: string[] = []
  if (est) legitBits.push(`${firm.name} has operated since ${est}`)
  if (firm.trustPilotScore != null)
    legitBits.push(`holds a ${firm.trustPilotScore}/5 Trustpilot rating`)
  if (firm.reviewScore != null && firm.reviewsCount)
    legitBits.push(`scores ${firm.reviewScore}/5 across ${firm.reviewsCount} trader reviews on our platform`)
  faqs.push({
    question: `Is ${firm.name} legit?`,
    answer:
      (legitBits.length > 0
        ? `${legitBits.join(', ')}. `
        : `We are still compiling verified trust data for ${firm.name}. `) +
      (firm.underReview
        ? `Note: ${firm.name} is currently flagged as under review — check the trust section before purchasing.`
        : `We track its rules, payouts and Trustpilot trend continuously and flag any firm that stops paying traders.`),
  })

  faqs.push({
    question: `How much does a ${firm.name} challenge cost?`,
    answer:
      cheapestPrice != null
        ? `Challenges start around $${cheapestPrice} for the smallest account size. See the pricing table above for every size and step count.`
        : `We are currently verifying live challenge prices for ${firm.name}. The pricing table above shows the account sizes offered.`,
  })

  const split = firm.payout?.profitSplitPct
  faqs.push({
    question: `What profit split does ${firm.name} offer?`,
    answer:
      split != null
        ? `${firm.name} pays funded traders up to ${split}% of profits.`
        : `${firm.name}'s exact profit split is being verified. Most firms in our directory pay 80–90% on funded accounts; check the payout section above for the latest confirmed figure.`,
  })

  const freq = firm.payout?.frequency
  const avgDays = firm.payout?.avgPayoutDays
  faqs.push({
    question: `How fast does ${firm.name} pay out?`,
    answer:
      freq || avgDays != null
        ? `${firm.name} pays ${freq ?? 'on its published schedule'}${avgDays != null ? `, and community payout proofs we track average ${avgDays} days from request to receipt` : ''}.`
        : `We are collecting dated payout proofs for ${firm.name} to publish a real average payout time. Until then, treat advertised payout speeds as unverified.`,
  })

  if (promo?.code) {
    faqs.push({
      question: `Does ${firm.name} have a promo code?`,
      answer: `Yes — code ${promo.code}${promo.discountPct != null ? ` gives ${promo.discountPct}% off` : ''}${promo.exclusive ? ' (exclusive to PropFirmSquad)' : ''}. See the promo page for terms and expiry.`,
    })
  }

  if (platformNames.length > 0) {
    faqs.push({
      question: `What trading platforms does ${firm.name} support?`,
      answer: `${firm.name} supports ${platformNames.join(', ')}.`,
    })
  }

  if (firm.maxAllocation != null) {
    faqs.push({
      question: `What is the maximum funding at ${firm.name}?`,
      answer: `${firm.name} advertises up to $${firm.maxAllocation.toLocaleString('en-US')} in trading capital through account scaling.`,
    })
  }

  return faqs
}
