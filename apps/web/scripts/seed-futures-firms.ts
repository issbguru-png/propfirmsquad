/**
 * Seed the futures vertical from the researched dataset.
 *
 * ── WHY ONLY THREE OF FIVE ───────────────────────────────────────────────────
 * The research covered Topstep, Apex, MyFundedFutures, Take Profit Trader and
 * Tradeify. Two are deliberately withheld pending a human check:
 *
 *   - **Apex Trader Funding**: its own risk disclosure limits services to US
 *     users and the site returns a hard 403 to everyone else. Our largest
 *     markets are India, Pakistan and Indonesia, so most of our readers cannot
 *     load it. Everything we hold is from archived pages and must be re-read
 *     from a US connection before publishing.
 *   - **MyFundedFutures**: its Disclaimer states "All accounts (including
 *     evaluation and funded accounts) operate in a simulated, non-executing
 *     environment. No real capital is deployed at any stage" (verified verbatim
 *     2026-08-08), while the Pro plan page was reported to sell "a real
 *     brokerage account at Blue Row Capital, real money". That second quote
 *     could not be reproduced the same day: /pro redirects to a challenge page
 *     without it. Publishing a self-contradiction claim requires both halves
 *     to be re-confirmed, and Blue Row Capital returns no NFA BASIC record.
 *
 * ── WHAT IS NOT SET, AND WHY ─────────────────────────────────────────────────
 * `scores` are left null on purpose. The squad score is Ayub's editorial
 * judgement and drives ranking; seeding an invented score would put these
 * firms in a ranked position nobody authored. Unscored firms sort last by
 * design until he rates them.
 *
 * `verdict` is likewise empty, so `enforceDataDensityGate` keeps every one of
 * these profiles noindex until there is a real review on it.
 *
 * Values come from `futures-firms-data.json` rather than being retyped here,
 * so there is one copy of each number and no transcription drift. Fields the
 * researcher could not confirm are null in that file and stay null here.
 *
 * Rerunnable: upserts firms by slug and replaces their challenges wholesale.
 *
 * Run: corepack pnpm --filter web exec payload run scripts/seed-futures-firms.ts
 */
import { readFileSync } from 'node:fs'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Firm } from '../src/payload-types'

const DATA_PATH =
  '/Users/warissalmanshah/Desktop/PF/propfirmmatch-seo-data/futures-firms-data.json'

/** Only these three publish. See the header for why the other two are held. */
const SEED_SLUGS = ['topstep', 'take-profit-trader', 'tradeify'] as const

type Json = Record<string, any>

/** ISO2 for our `country` / `legalEntity.jurisdiction` fields. The dataset
 *  carries human-readable jurisdictions like "Florida, United States". */
const iso2 = (v: string | null | undefined): string | null => {
  if (!v) return null
  if (/^[A-Z]{2}$/.test(v)) return v
  return /united states|florida|illinois|texas/i.test(v) ? 'US' : null
}

/** Payload date fields must be pinned UTC: a bare 'YYYY-MM-DD' is read in the
 *  session timezone and has shifted established years on us before. */
const utcDate = (v: string | null | undefined): string | null =>
  v ? (v.includes('T') ? v : `${v}T00:00:00.000Z`) : null

const raw: Json = JSON.parse(readFileSync(DATA_PATH, 'utf8'))
const payload = await getPayload({ config })

let firmCount = 0
let challengeCount = 0

try {
  for (const slug of SEED_SLUGS) {
    const f: Json | undefined = raw[slug]
    if (!f) {
      console.warn(`  SKIP ${slug}: not present in ${DATA_PATH}`)
      continue
    }

    const id = f.identity ?? {}
    const entity = f.legalEntity ?? {}
    const lead = f.leadership ?? {}
    const tp = f.trustpilot ?? {}
    const pay = f.payout ?? {}
    const rules = f.rules ?? {}

    // A payout total is only publishable with the date we read it and where.
    // `enforceClaimSourcing` rejects the save otherwise, so pick the first
    // claim that is fully sourced rather than the first that mentions money.
    const payoutClaim = (f.claims ?? []).find(
      (c: Json) => c?.claimedBy === 'firm' && c?.asOf && c?.sourceUrl && /\$/.test(c?.claim ?? ''),
    )
    const claimedTotal = payoutClaim ? parseClaimAmount(payoutClaim.claim) : null

    // Registry fields move together: a number with no source is worse than no
    // number, because it looks verified.
    const hasVerifiedEntity = Boolean(
      entity.registryVerified && entity.registrationNumber && entity.sourceUrl,
    )

    // Deliberately NOT annotated `: Json`. Firms has drafts enabled, so
    // Payload's create() types are a discriminated union: a widened
    // Record<string, any> matches neither branch and demands `draft: true`.
    // Letting the literal infer keeps the required fields visible to TS.
    const data = {
      name: id.name,
      slug: id.slug ?? slug,
      // `as const` / cast: values arriving from JSON widen to `string`, which
      // does not satisfy Payload's generated enum unions.
      listingType: 'listed' as const,
      firmTypes: (id.firmTypes ?? ['futures']) as Firm['firmTypes'],
      country: iso2(id.country),
      currency: id.currency ?? 'USD',
      dateEstablished: utcDate(id.dateEstablished),
      websiteUrl: id.websiteUrl ?? null,
      trustpilotUrl: tp.url ?? id.trustpilotUrl ?? null,
      trustPilotScore: tp.guidelineBreachWarning ? null : (tp.score ?? null),
      // Recording a checked-and-clean profile is what makes the absence of a
      // warning meaningful rather than merely unknown.
      trustpilotWarning: {
        active: Boolean(tp.guidelineBreachWarning),
        checkedAt: utcDate(tp.checkedAt),
        profileUrl: tp.url ?? null,
        underlyingScore: tp.score ?? null,
        underlyingReviews: tp.reviewCount ?? null,
        reviewsLast12m: tp.reviewsLast12Months ?? null,
      },
      leadership: {
        ceoName: lead.ceoName ?? null,
        ceoRole: lead.ceoRole ?? null,
        ceoLinkedinUrl: lead.ceoLinkedinUrl ?? null,
      },
      ...(hasVerifiedEntity
        ? {
            legalEntity: {
              name: entity.registeredName,
              registrationNumber: entity.registrationNumber,
              registry: entity.registry,
              jurisdiction: iso2(entity.jurisdiction),
              sourceUrl: entity.sourceUrl,
            },
          }
        : entity.registeredName
          ? { legalEntity: { name: entity.registeredName, jurisdiction: iso2(entity.jurisdiction) } }
          : {}),
      rulesSummary: {
        drawdownType: rules.drawdownType ?? null,
        consistencyRulePct: rules.consistencyRulePct ?? null,
        minTradingDays: rules.minTradingDays ?? null,
        newsTradingAllowed: rules.newsTradingAllowed ?? null,
        eaAllowed: rules.eaAllowed ?? null,
        copyTradingAllowed: rules.copyTradingAllowed ?? null,
        hftAllowed: rules.hftAllowed ?? null,
        weekendHolding: rules.weekendHolding ?? null,
        // Every challenge below carries an explicit timeLimitNote, so the
        // "no time limit" rendering is safe to enable for these firms.
        timeLimitsVerified: true,
      },
      payout: {
        profitSplitPct: pay.profitSplitPct ?? null,
        frequency: pay.frequency ?? null,
        firstPayoutDays: pay.firstPayoutDays ?? null,
        minPayoutAmount: pay.minPayoutAmount ?? null,
        methods: pay.methods ?? null,
        splitScaling: pay.splitScaling ?? null,
        ...(claimedTotal != null && payoutClaim
          ? {
              totalPaidClaimed: claimedTotal,
              totalPaidClaimedAt: utcDate(payoutClaim.asOf),
              totalPaidSourceUrl: payoutClaim.sourceUrl,
            }
          : {}),
      },
      prosCons: {
        pros: (f.pros ?? []).map((text: string) => ({ text })),
        cons: (f.cons ?? []).map((text: string) => ({ text })),
      },
      // No scores and no verdict: both are Ayub's to write. The data-density
      // gate keeps these noindex until the verdict exists.
      seo: { indexable: false },
    }

    const existing = await payload.find({
      collection: 'firms',
      where: { slug: { equals: data.slug } },
      limit: 1,
      depth: 0,
    })

    const firm = existing.docs[0]
      ? await payload.update({ collection: 'firms', id: existing.docs[0].id, data })
      : await payload.create({ collection: 'firms', data })

    firmCount += 1

    // Replace challenges wholesale so a rerun cannot leave stale rows behind.
    const old = await payload.find({
      collection: 'challenges',
      where: { firm: { equals: firm.id } },
      limit: 200,
      depth: 0,
    })
    for (const c of old.docs) {
      await payload.delete({ collection: 'challenges', id: c.id })
    }

    for (const c of (f.challenges ?? []) as Json[]) {
      await payload.create({
        collection: 'challenges',
        data: {
          firm: firm.id,
          name: c.name,
          steps: c.steps ?? '1-step',
          accountSize: c.accountSize,
          price: c.price,
          currency: c.currency ?? 'USD',
          profitTargets: (c.profitTargets ?? []).map((t: Json) => ({
            phase: t.phase,
            targetPct: t.targetPct ?? null,
            targetAmount: t.targetAmount ?? null,
          })),
          maxDailyLossPct: c.maxDailyLossPct ?? null,
          maxDailyLossAmount: c.maxDailyLossAmount ?? null,
          maxTotalDrawdownPct: c.maxTotalDrawdownPct ?? null,
          maxTotalDrawdownAmount: c.maxTotalDrawdownAmount ?? null,
          drawdownType: c.drawdownType ?? null,
          profitSplitPct: c.profitSplitPct ?? null,
          timeLimitDays: c.timeLimitDays ?? null,
          feeNote: c.priceNote ?? null,
          isActive: true,
        },
      })
      challengeCount += 1
    }

    const gaps = (f.needsVerification ?? []).length
    console.log(
      `  ${data.slug.padEnd(20)} ${(f.challenges ?? []).length} challenges, ` +
        `TP ${tp.score ?? '?'}/${tp.reviewCount ?? '?'}, ${gaps} fields need verification`,
    )
  }

  console.log(`\nSeeded ${firmCount} firms and ${challengeCount} challenges.`)
  console.log('All are noindex and unscored until Ayub writes a verdict and rates them.')
} catch (err) {
  console.error('seed-futures-firms failed:', err)
  process.exit(1)
}

/** "$1.4B+ paid out..." / "Over $250 million in verified payouts" → a number.
 *  Returns null when the shape is not recognised, so an unparsed claim is
 *  simply not published rather than published wrong. */
function parseClaimAmount(claim: string): number | null {
  const m = claim.match(/\$\s?([\d.,]+)\s*(billion|million|B\b|M\b)?/i)
  if (!m) return null
  const n = Number(m[1].replace(/,/g, ''))
  if (!Number.isFinite(n)) return null
  const unit = (m[2] ?? '').toLowerCase()
  if (unit.startsWith('b')) return Math.round(n * 1_000_000_000)
  if (unit.startsWith('m')) return Math.round(n * 1_000_000)
  return Math.round(n)
}

process.exit(0)
