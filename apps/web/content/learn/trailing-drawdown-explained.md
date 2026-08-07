---
title: Trailing Drawdown Explained: EOD vs Intraday (And Why It Fails Traders)
description: How trailing drawdown actually moves, the difference between end-of-day and intraday calculation, and the unrealized-profit trap that closes funded accounts.
updated: 2026-08-08
---

Drawdown is the loss limit that ends your prop firm account. Every firm has one; what separates them is whether the limit stays put or follows your equity upward. Misreading which type you're trading under is one of the most common ways funded accounts die — often while the trader is in profit overall.

## The four drawdown types

Prop firms use four calculation methods, and we tag every firm in our directory with one of them:

- **Static**: the limit is fixed relative to your starting balance. A 50K account with a 10% static drawdown fails below $45,000, no matter how high the account climbed first. This is the most forgiving type.
- **Trailing, end-of-day (EOD)**: the limit ratchets up with your closed balance, recalculated once per day at session close. Intraday swings don't move it.
- **Trailing, intraday**: the limit follows your equity peak in real time — including **unrealized** profit while a trade is still open. This is the strictest type, common at futures firms.
- **Hybrid**: the limit trails until a threshold (usually your starting balance plus a buffer), then locks and behaves like a static limit from there.

## How a trailing drawdown actually moves

Take a 50K futures account with a $2,500 trailing drawdown:

1. You start at $50,000. Your loss limit is $47,500.
2. You make $1,000. Your balance peak is $51,000 — the limit trails up to $48,500.
3. You give back $1,200, to $49,800. The limit **stays** at $48,500. It only moves up, never down.

Notice what happened: you're up $800 on your original deposit-equivalent, but you're now only $1,300 above failure. The drawdown "consumes" your early profit cushion. With a static limit, that same trader would still have $2,300 of room plus the full original buffer.

## The unrealized-profit trap

The intraday variant has a failure mode that catches even experienced traders. Because the limit trails your **equity peak** — not just closed balance — an open trade that runs up and comes back can raise your loss limit without you ever banking a cent.

Example: your open position goes +$1,500 unrealized, then reverses and you close flat. Under intraday trailing, your equity peaked $1,500 higher, so your loss limit rose $1,500 — permanently. You made nothing, and your room for error shrank by $1,500. Under EOD trailing, that same round trip changes nothing, because only the end-of-day balance is measured.

This is why the same "$2,500 trailing drawdown" number can describe two very different risk propositions. Always confirm which one you're getting.

## The three questions to ask any firm

- **When is it calculated?** End-of-day or tick-by-tick? Intraday trailing punishes letting winners breathe; EOD gives you room to manage trades.
- **Does it include unrealized profit?** If yes, partial-profit-taking becomes a survival skill, not a style choice.
- **Does it ever lock?** Many firms stop trailing once the limit reaches your starting balance — from then on you're effectively trading a static limit. Firms that never lock keep you permanently one bad streak from failure.

## Practical adjustments

Under a trailing drawdown, especially intraday: take partial profits earlier than your backtest says, since banked profit that raises the floor is better than unrealized profit that raises it anyway; keep position size flat until you've built a locked buffer; and treat the days right after a big winner as your highest-risk period — your cushion is at its thinnest relative to your recent peak.

Every firm profile in our [directory](/prop-firms) lists the drawdown type, the exact percentages per challenge size, and any lock threshold — plus a log of when the firm last changed those rules.
