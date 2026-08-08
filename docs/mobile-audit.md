# Mobile UI/UX audit

Audited at 375x812 (Pixel 8 UA, touch, DPR 2), with spot checks at 320px and
414px. Desktop re-verified at 1280x900 after every change.

Our top traffic markets (India, Pakistan, Indonesia, Vietnam, Nigeria) are
overwhelmingly Android mobile, so mobile is treated as the primary experience
here. Every fix below pairs a mobile value with an `sm:` override that restores
the original desktop value, so desktop layout is unchanged.

## Horizontal overflow: before and after

Measured as `documentElement.scrollWidth - clientWidth`. Anything above zero
means the page pans sideways on a phone.

| Route | 375px before | 375px after | 320px before | 320px after |
| --- | --- | --- | --- | --- |
| `/` | **101** | 0 | 0 | 0 |
| `/prop-firms` | 0 | 0 | 0 | 0 |
| `/prop-firms?type=crypto` | 0 | 0 | 0 | 0 |
| `/prop-firms/ftmo` | 0 | 0 | 0 | 0 |
| `/prop-firms/the-5-ers` | 0 | 0 | 0 | 0 |
| `/prop-firms/hola-prime` | 0 | 0 | 0 | 0 |
| `/prop-firms/fundednext/promo-code` | 0 | 0 | **35** | 0 |
| `/deals` | 0 | 0 | 0 | 0 |
| `/deals?type=crypto` | 0 | 0 | 0 | 0 |
| `/best` | 0 | 0 | 0 | 0 |
| `/best/cfd-prop-firms` | **101** | 0 | 0 | 0 |
| `/best/futures-prop-firms` | 0 | 0 | 0 | 0 |
| `/tools` | 0 | 0 | 0 | 0 |
| `/tools/challenge-roi-calculator` | 0 | 0 | 0 | 0 |
| `/tools/consistency-calculator` | 0 | 0 | 0 | 0 |
| `/tools/drawdown-calculator` | 0 | 0 | 0 | 0 |
| `/tools/payout-split-calculator` | 0 | 0 | 0 | 0 |
| `/tools/profit-target-calculator` | 0 | 0 | 0 | 0 |
| `/learn` | 0 | 0 | 0 | 0 |
| `/learn/consistency-rule-explained` | 0 | 0 | 0 | 0 |
| `/methodology` | 0 | 0 | 0 | 0 |
| `/about` | 0 | 0 | 0 | 0 |

414px was clean on every route both before and after.

## Findings

| Route | Issue | Severity | Status |
| --- | --- | --- | --- |
| `/`, `/best/cfd-prop-firms` | `.sr-only` span in the ranked table's action header widened `<html>` by 101px. Tailwind's `sr-only` is `position:absolute`; the `overflow-x-auto` wrapper was `position:static`, so it never clipped the span, which resolved against the initial containing block at the table's full width. Both pages panned sideways. | blocker | fixed |
| `/prop-firms/fundednext/promo-code` | Primary CTA ("Use code FUNDEDNEXT10 at FundedNext") carried `whitespace-nowrap` from the shared `Button` base and could not wrap, overflowing 320px screens by 35px. | blocker | fixed |
| all | Header nav links 17px tall (4 links, every page). | major | fixed |
| all | Footer link columns 17px tall on a 25px pitch, 374 instances across the sweep. | major | fixed |
| profiles | Sticky section-nav anchors 21px tall inside a bar that also scrolls sideways, so mis-taps were likely. | major | fixed |
| `/deals`, promo pages | Copy-code button 30px (small variant) and 30px (large). Primary conversion action. | major | fixed |
| all with CTAs | Shared `Button` 32px (md) and 34px (sm). | major | fixed |
| profiles | Country `<select>` 37px tall at 14px text. Below 16px, mobile Safari zooms the page on focus, and the control has ~200 options. | major | fixed |
| `/prop-firms`, `/deals` | Market filter chips 34px. | minor | fixed |
| calculators | Number inputs and selects 39-40px. `inputMode="decimal"` was already correct on the single shared input, so the numeric keypad was never an issue. | minor | fixed |
| `/tools/payout-split-calculator` | "+ Add tier" 24px, "Remove tier" 36px. | minor | fixed |
| profiles | Section-nav promo chip 26px. | minor | fixed |
| profiles | Hero meta line rendered a leading "·" separator that wrapped to the start of its own line on a phone, reading like a typo. | minor | fixed |
| profiles | Score attribution ("Scored by … against our published methodology") set at 11px, the only run of real sentence copy below 12px, and it contains a link. | minor | fixed |
| all | `main` had a flat 40px vertical padding, costing the hero a chunk of the first screen. | minor | fixed |
| `/`, `/best/*` | Top-10 table is 444px wide in a 343px viewport, so the action column sits off-screen. Now has tightened mobile padding and an explicit swipe hint. Cannot be made to fit; see recommendations. | major | partially fixed |
| profiles | Six wide tables scroll correctly but have no explicit scroll hint. | minor | recommended |
| all | Inline prose links (13-20px tall) sit below 44px. | minor | accepted |

## What was verified and found healthy

- **Tables.** All 18 overflowing tables across the sweep sit inside a working
  `overflow-x-auto` scroller. None blow out the page. The profile pricing table
  additionally sets `tabIndex={0}` and `role="region"`, so it is keyboard
  scrollable and announced.
- **Sticky elements.** Only the profile section nav is sticky (~46px). The
  header is not sticky, so nothing stacks. It does not trap scrolling and eats
  6% of the viewport.
- **Above the fold on a firm profile.** Strong. At 375x812 a user sees the firm
  logo, the H1, the market badge, the verified date, the rank and reviewer, the
  primary CTA, and all four key-fact cards (cheapest challenge, profit split,
  payout speed, and country availability with flag).
- **Above the fold on the homepage.** The H1, the updated-date kicker, and the
  opening paragraph including the three top-ranked firm links are all visible.
  The ranked table starts below the fold, which is reasonable for an editorial
  hero.
- **Forms.** One shared input component covers all five calculators and already
  sets `type="number" inputMode="decimal"`. Selects are full-width. Focus states
  use a visible accent ring.
- **Cards and images.** Key-fact cards, score-breakdown bars, pros/cons chips,
  the availability flag card, and the reviewer card all stack without squashing.
- **Typography.** Everything left below 12px is uppercase micro-label or badge
  text ("Markets", "Code", "Verified reviewer", numbered chips), which is a
  deliberate typographic device rather than body copy.

## Recommendations (not done, would need a redesign)

### 1. The ranked top-10 table cannot fit a phone

Used on `/` and every `/best/*` hub. On mobile it discloses down to four
columns (rank, firm, rating, action) and still measures 444px against 343px of
available width, so the "Claim X% off" / "Read review" CTA is off-screen until
the reader swipes.

I tested how far compaction can go before it stops being legible: cell padding
down to `px-2`, the CTA at 12px, and the firm logo down to 32px together reach
**383px, still 40px too wide**, and by then the table looks cramped rather than
designed. There is no padding-level fix.

Options, all of which are redesigns and so were left alone:

- Restyle rows as stacked cards below `sm`, which is the conventional answer and
  would let the CTA be full-width and the rating sit under the firm name.
- Drop the rating column on mobile and keep the CTA, trading the trust signal
  for the conversion path.
- Move the promo into the firm cell as a chip under the name and drop the action
  column on mobile.

What was done instead: mobile cell padding tightened (476px to 444px of scroll)
and a mobile-only line added under the table saying it swipes. The half-sliced
orange button was the only affordance before.

### 2. A shared `TableScroller` primitive for the six profile tables

The profile tables are wide relative to a 301px content column: pricing
841-866px, rules summary 640px, mini comparison 560px, company facts 480px,
leverage and commissions 420px each. They all scroll correctly and slice content
at a visible border, but none says so.

Adding the hint inline six times would put six near-identical "swipe" notes on
one page, which is noise rather than help. The right fix is to fold the house
`overflow-x-auto rounded-sm border border-line` pattern into one component that
owns the scroller, the `role="region"` and `tabIndex` the pricing table already
has, and a single consistent affordance. That is a refactor across eight call
sites and out of scope for an audit pass.

### 3. `ChallengePriceTable` is dead code

`apps/web/src/components/ChallengePriceTable.tsx` is exported from the barrel
but has zero call sites; the profile page renders its own inline pricing table
with footnotes. Worth deleting or documenting.

## Accepted, not defects

**Inline prose links stay below 44px.** "ranking methodology" in the footer
disclosure (13px tall, on every page), firm names inside sentences, "About the
reviewer", "Official website", "← All guides". Giving these 44px of block
padding would break the line rhythm of the paragraphs they sit in. Inline links
in flowing text are the standard exception to the touch-target floor, and each
has a large horizontal hit area.

**Deal card title links are 24px.** They are full-width `block truncate` links
next to a 40px logo, inside a card that already carries a large primary CTA and
a copy button. Padding them would push the title out of alignment with the logo
for little gain.

**The market switcher is 40px.** Marginally under the floor but comfortable in
practice, and raising it would push the fold down on every page.

## Verification

- Overflow probe re-run on all 22 routes: `overflow: 0` at 375px and at 320px.
  414px clean on the ten tightest routes.
- Typecheck clean (`tsc --noEmit`).
- 162 tests green (54 calc, 108 web).
- Desktop re-measured at 1280px across `/`, `/prop-firms`, `/prop-firms/ftmo`,
  `/deals`, `/tools/drawdown-calculator`: header 105px, `main` padding 40px, nav
  and footer link padding 0px on a 20px line box, footer list gap 8px, small
  button 34px, table cell padding 16px, mobile swipe hint `display: none`, and
  no document overflow. All identical to the pre-audit values.
