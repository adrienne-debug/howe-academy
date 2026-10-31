# 🐷 Star Savings — design (2026-10-31)

**Ellis's ask:** "When I reach 5,000 points I can put them in a savings account and earn interest like a real bank."

Status: **Adrienne said yes to all four recommended answers (2026-10-31). Built on branch `claude/star-savings`, not deployed.** Mom's savings settings sit in the PIN-locked store editor, and her yes/no for taking stars out shows under a 🐷 Savings heading in the same list as Star Store asks.

---

## 1. What Ellis sees

Savings lives **on his Star Bank card** (the 🏦 view in the Wins tab and the kid pop-up), right under the vault balance. It is not a Star Store item, because a store buy is a spend and savings is not.

**Before 5,000 ⭐** — a locked piggy bank with a progress bar:

> 🐷 Savings opens at 5,000 ⭐ · you have 3,840 · **1,160 to go**

**After 5,000 ⭐** — a second vault next to his spending balance:

```
🪙 Spending   1,200 ⭐        🐷 Savings   5,202 ⭐
                              earning 1% every Sunday
                              next interest: +52 ⭐ on Sun Nov 8
[ 🐷 Move to savings ]       [ ↩ Move to spending ]
```

- **Move to savings**: he types an amount (or taps "All of it"). It uses the same "Is this Ellis?" confirm the store already uses on shared tablets.
- **Savings statement**: its own short list, newest first, like a real passbook:
  - `Oct 31  🐷 Deposit            +5,000   5,000`
  - `Nov  1  💰 Interest (1%)        +50    5,050`
  - `Nov  8  💰 Interest (1%)        +50    5,100`
- His spending statement shows the move as one line: `🐷 To savings  −5,000`.
- **The "real bank" lesson**: one line under the vault shows what waiting does. Example: "Leave it 10 weeks → about 5,520 ⭐. A whole year → about 8,356 ⭐."

## 2. How interest works

- **Paid every Sunday** on whatever was in savings at the end of Saturday. **Compound**: last week's interest earns interest too. That is the part that makes it feel like a real bank.
- **Whole stars, rounded down.** 1% of 5,050 = 50.
- Money moved in mid-week starts earning the next Sunday. Money moved out before Sunday doesn't earn that week.

**What different rates look like on 5,000 ⭐:**

| Rate | After 1 week | After 10 weeks | After 1 year |
|---|---|---|---|
| Real bank, about 4% a year | +4 | about 5,038 | about 5,200 |
| ✅ 1% a week | +50 | 5,520 | 8,356 |
| 5% a month | none until month end | about 5,500 | 8,971 |
| 2% a week | +100 | 6,092 | 13,962 |

A real bank's rate is too small for him to notice: 4 stars a week. 1% a week gives 50 stars a week, about a candy-and-a-half, and lets him watch the balance grow.

## 3. What Mom sees and controls

In 🔒 PIN Settings ▸ Star Store, a new **🐷 Savings** row:
- On/off, per kid.
- Interest rate and how often (weekly or monthly).
- The unlock amount (5,000).
- Withdrawal rule (see question 3).

On Mom's view of the Star Bank card she can also:
- Delete a savings move, the same 🗑 she has on withdrawals today.
- Approve a held withdrawal, if that's the rule picked. It shows in the same 🙋 queue as held store buys.

Changing the rate only affects **future** Sundays. Interest already earned never changes.

## 4. How it fits the app (for the build)

- **One economy, no parallel ledger.** Spending balance stays `bankLedger()`. It gets one new kind of line: money moved into or out of savings.
- **New records only**, one per move: `bank/{kid}/savings/{pushId}` = `{amount, dir:"in"|"out", ts, iso, status?}`. These are written by the app when Ellis taps. Each one is a single targeted push, never a whole-node set.
- **Interest is calculated, never written.** On every render the app walks Sunday by Sunday from his first deposit, adds interest on each Saturday-night balance, and shows the result. That's the same way the Star Bank balance already works (built from claims + withdrawals + adjustments). This means:
  - No nightly job, nothing has to "run" on Sunday.
  - Two tablets can never pay the same week twice.
  - It can't drift or get out of sync.
- Rate settings live in `config/savingsCfg/{kid}` with an "effective from" date per rate, so a rate change doesn't rewrite past weeks.
- **Docks never touch savings.** A −100 dock comes out of spending, even if spending goes negative (today's rule).
- **The store can't spend savings.** He moves it back to spending first.

## 5. Build steps (one at a time, each verified before the next)

All code sits in one marked block, `// SAVINGS_START` … `// SAVINGS_END`, and every write is guarded by `db && !_dryRun()`.

1. **Savings ledger + interest math** as pure functions, plus `test_star_savings.js`. Tests cover: compound weekly, round-down, mid-week deposit, withdraw before Sunday, a rate change keeping old weeks, a declined withdrawal refunding.
2. **Ellis's view**: the locked progress bar, the two vaults, move in/out with the confirm, and the savings statement.
3. **Mom's settings row** and the 🗑 / approve controls.
4. Drive the whole flow in the `?dryrun=1` copy and measure on phone width. Then hand it to you to deploy.

Howe repo only. DeWalt and Burris get a port later if you want it.

---

## ❓ Four answers needed

1. **Interest rate**: ✅ 1% every week · 2% every week · 5% every month · a real-bank rate.
2. **What "5,000" means**:
   - ✅ The account opens once his Star Bank reaches 5,000, then any amount can go in.
   - The first deposit must be 5,000 or more.
   - Savings only earns interest while it holds 5,000 or more (a real-bank "minimum balance").
3. **Taking money out**:
   - ✅ Anytime, but it's held until Mom says yes, like big store buys.
   - Anytime, no approval.
   - Locked for a set number of weeks, like a CD. Early withdrawal loses that week's interest.
4. **Which kids**: ✅ every Howe kid, each unlocking at their own amount (Ellis 5,000) · Ellis only.
