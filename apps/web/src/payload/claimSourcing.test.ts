/**
 * These assert the sourcing gate is structural. The point of the hook is that
 * an unsourced reputational claim cannot reach the database at all, so the
 * tests that matter are the rejections.
 */
import { describe, expect, it } from 'vitest'
import { enforceClaimSourcing } from './claimSourcing'

type Args = Parameters<typeof enforceClaimSourcing>[0]

/** The hook only reads `data` and `originalDoc`; the rest of the Payload arg
 *  object is irrelevant to it, so it is cast rather than reconstructed. */
const run = (data: Record<string, unknown>, originalDoc?: Record<string, unknown>) =>
  enforceClaimSourcing({ data, originalDoc, operation: 'update' } as unknown as Args)

const SOURCED_WARNING = {
  active: true,
  checkedAt: '2026-08-08T00:00:00.000Z',
  profileUrl: 'https://www.trustpilot.com/review/example.com',
}

describe('trustpilotWarning', () => {
  it('accepts an active warning with a date and a profile URL', () => {
    expect(() => run({ trustpilotWarning: SOURCED_WARNING })).not.toThrow()
  })

  it('rejects an active warning with no checkedAt', () => {
    expect(() => run({ trustpilotWarning: { ...SOURCED_WARNING, checkedAt: null } })).toThrow(
      /checkedAt/,
    )
  })

  it('rejects an active warning with no profileUrl', () => {
    expect(() => run({ trustpilotWarning: { ...SOURCED_WARNING, profileUrl: '' } })).toThrow(
      /profileUrl/,
    )
  })

  it('names both missing fields at once', () => {
    expect(() => run({ trustpilotWarning: { active: true } })).toThrow(/checkedAt and profileUrl/)
  })

  it('allows an inactive warning to carry no sourcing', () => {
    // Recording that we checked and found nothing is not a claim about anyone.
    expect(() => run({ trustpilotWarning: { active: false } })).not.toThrow()
  })

  it('catches a patch that flips active on while the stored doc lacks sourcing', () => {
    // The realistic failure: an editor ticks the box in admin and saves. The
    // patch alone looks harmless, so the hook has to merge against the doc.
    expect(() => run({ trustpilotWarning: { active: true } }, { trustpilotWarning: {} })).toThrow()
  })

  it('accepts a patch flipping active on when the stored doc is already sourced', () => {
    expect(() =>
      run(
        { trustpilotWarning: { ...SOURCED_WARNING } },
        { trustpilotWarning: { ...SOURCED_WARNING, active: false } },
      ),
    ).not.toThrow()
  })
})

describe('payout.totalPaidClaimed', () => {
  it('rejects a payout total with no date or source', () => {
    expect(() => run({ payout: { totalPaidClaimed: 650_000_000 } })).toThrow(
      /totalPaidClaimedAt and totalPaidSourceUrl/,
    )
  })

  it('accepts a fully sourced payout total', () => {
    expect(() =>
      run({
        payout: {
          totalPaidClaimed: 650_000_000,
          totalPaidClaimedAt: '2026-08-08T00:00:00.000Z',
          totalPaidSourceUrl: 'https://ftmo.com/',
        },
      }),
    ).not.toThrow()
  })

  it('ignores a payout group that makes no claim', () => {
    expect(() => run({ payout: { profitSplitPct: 80 } })).not.toThrow()
  })

  it('does not treat a zero total as absent', () => {
    // 0 is falsy but is still a published claim, so it needs sourcing too.
    expect(() => run({ payout: { totalPaidClaimed: 0 } })).toThrow(/totalPaidClaimedAt/)
  })
})

describe('legalEntity', () => {
  it('rejects a registration number with no registry source', () => {
    expect(() => run({ legalEntity: { registrationNumber: '12553363' } })).toThrow(/sourceUrl/)
  })

  it('accepts a sourced registration', () => {
    expect(() =>
      run({
        legalEntity: {
          name: 'The5ers Ltd',
          registrationNumber: '12553363',
          sourceUrl: 'https://find-and-update.company-information.service.gov.uk/company/12553363',
        },
      }),
    ).not.toThrow()
  })

  it('allows an entity name with no number', () => {
    expect(() => run({ legalEntity: { name: 'Some Firm Ltd' } })).not.toThrow()
  })
})

it('passes through an unrelated edit untouched', () => {
  const data = { name: 'FTMO', reviewScore: 4.8 }
  expect(run(data)).toBe(data)
})
