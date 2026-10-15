# 🧺 Laundry flow audit — 2026-10-15

Her ask (2026-10-15, DeWalt, Taylor): *"Laundry put itself back in the schedule for the washer and dryer
correctly, but then it completely disappeared for fold and put away in her schedule yesterday. Also: take some
time and really evaluate the whole laundry thing. It's been amazing, but if there are holes you see to prevent
these things, take the time."*

This file is the evaluation. **Nothing in it is fixed** except hole 1, which is the commit before this one on
branch `claude/laundry-fold-disappearance-22c23f`. Everything else waits for Adrienne to pick one at a time.

## What was read (read-only, nothing written)

- DeWalt database (`howe-academy-dewalt-default-rtdb`, GET without a token): `laundry/` (empty now),
  `momBlocks/` (every day), `settings/laundryTimes` {wash 50, dry 60, grace 5}, `settings/laundryBlockMins`
  {move 5, fold 15}, `config/routines/morning/taylor`, `config/grabs`, `routineLog/taylor/week2`,
  `momday/2026-10-14`, `household/` (empty), `_debug` (4,027 lines, 10-01 → 10-15, no laundry lines — the
  laundry code never logs).
- Code: `laundryData` core (~13057), KIDLAUNDRY (~13395), MOMSCHED_LAUNDRY (~13156), LAUNDRY_WHEN / LAUNDRY_NOTYET
  inside it, WASHTODAY (~13412), HOUSECARDS (~12474), HH_LAUNDRY (~12918), `mdCardLaundry` (~13690), the
  NOW nudge in `renderMomsDay` (~14432), the Home Base badge (~14244), `dadSchedLaundry` (~18932), the Mom loop's
  block intervals (~56870), the `laundry` / `momBlocks` listeners (~4062, ~4183), the midnight code (~2618).
- Both laundry fixes already on DeWalt's live Pages build: LAUNDRY_WHEN (Not now → When?) and LAUNDRY_NOTYET
  (no question until the cycle is really over).

## Wednesday 10/14, reconstructed

| time | what happened | where it came from |
|---|---|---|
| 9:01 AM | Taylor checks "Start a load of laundry" (morning step 8, Mon/Wed/Fri) | `routineLog/taylor/week2/wednesday` |
| 9:01 | KIDLAUNDRY writes `laundry/lk_week2_wednesday_taylor_mstep8` {Taylor started laundry, washer, by taylor} | code path, id shape from the step key |
| 9:01 → 9:51 | Mom schedule: 🫧 marker at 9:01, ⏳ done ~9:51 (wash 50) | momSchedLaundry |
| 9:51 | ✅ "done in the washer. Block out time to move it to the dryer?" | momSchedLaundry |
| later | Sarah taps → Dryer, then → Fold, from Mom's Day — she never tapped Now / After / Later / skip | `momBlocks/2026-10-14` is empty |
| at → Fold | the load's stage becomes `fold`; **momSchedLaundry skipped stage fold entirely** → no row, no question, no block | the bug |
| at ✓ Put away | removed from `laundry/` on Mom's Day; the schedule never showed put away at all | by design before the fix |

So "the washer and dryer came back correctly" is the LAUNDRY_NOTYET / LAUNDRY_WHEN work doing its job, and
"fold and put away disappeared" is the fold stage having no presence on her schedule. One cause, one fix.

## The holes

Ordered by how much they bite. For each: the trigger, what Mom or the kid sees, the proposed fix, and its size.
"Write" lists any new Firebase path the fix would touch.

### 1. The fold pile had no row on Mom's schedule — **fixed on this branch (commit before this one)**
- **Trigger:** a load reaches stage `fold` (→ Fold from the schedule block, Mom's Day, or the NOW nudge).
- **Seen:** the load vanishes from the Mom-mode schedule. Put away is never on the schedule.
- **Fix (done, LAUNDRY_FOLD):** "🧺 <load> is in the fold pile. Block out time to put it away?" the minute it
  lands, How long · Now · After · Not now, a real block (step `putaway`, 10 min first time, remembered), ✓ Put away
  on the block, "✓ Put away: <load>" kept where it ended. Writes: the existing `momBlocks/<iso>/<load>_fold` and
  `settings/laundryBlockMins/putaway` paths only. `test_laundry_fold.js` (43) replays Taylor's day.
- **Needs:** cherry-pick to the DeWalt repo on her push (both families run the same code).

### 2. "Fold" means two things — the dryer block's button ends the fold time the moment she starts it
- **Trigger:** dryer done → she blocks 15 min "to fold it" → the block reads "🧺 Fold: <load> · 15 min [→ Fold]".
  Tapping → Fold marks the block done *and* moves the load to the fold pile at once (`laundryAdvance` →
  `laundryBlockDone`). The NOW nudge says the same: "time to fold it [→ Fold]".
- **Seen:** if she taps → Fold as she *starts* folding, her Mom cards come back immediately while she is still at
  the pile; the ✓ Folded row shows a time she had only begun. With hole 1 fixed, the pile then asks "block out
  time to put it away?" — two questions about the same basket, worded as two different jobs.
- **Fix (her pick of wording; small):** make the stages say what they are. Either (a) the dryer block becomes
  "Take it out: 5 min" with "→ Fold pile", and the pile block becomes "Fold & put away: 15 min" (one clear job each);
  or (b) keep the names and relabel the dryer block's button "Folded ✓" so it is tapped when folding is *done*.
  (a) changes defaults (`laundryBlockMins` fold → 5, putaway → 15); (b) is text only. No new write paths either way.

### 3. No NOW nudge for a fold pile, and none for a prewash
- **Trigger:** `renderMomsDay`'s nudge and the Home Base badge test `stage==="washer"||"dryer"` only. A 💦 wet load
  in its *prewash* is in the washer with the same clock, but never nudges — the exact sour-load case the nudge was
  built for. A fold pile can sit for days with nothing on Mom's Day but the Laundry card line.
- **Seen:** nothing in 🔴 NOW; no badge count. The schedule (after hole 1) still shows the pile, but only in Mom mode.
- **Fix (small):** prewash joins the washer nudge (same `laundryT("wash")+grace` test, "move it before it sours");
  the pile gets its own after N hours ("🧺 <load> has been in the fold pile since 11:15 — put it away" [✓ Put
  away]). Badge keys follow. Writes: none.

### 4. After midnight a long-open device listens to *yesterday's* Mom blocks
- **Trigger:** `db.ref("momBlocks/"+mwTodayIso()).on("value",…)` is bound once at boot. The app is built to outlive
  the day it booted on (the Fires stay open for days — see the `todayDay()` comment), and `dayRollCheck` moves the
  day but never re-binds this listener.
- **Seen:** Sarah blocks 10 min on her phone; the kitchen tablet (open since Tuesday) never receives it. Its Mom loop
  lays her Mom cards without the block, so the kids' timelines on that device disagree with her phone; its Mom-mode
  schedule shows no block. Its own taps still work (local write + local state), which is why it looks random.
- **Fix (small, scheduler-adjacent so a replay test):** in `dayRollCheck`, `off()` the old `momBlocks/<old>` and
  `on()` the new day's path; also drop the `ha_momblocks` cache when its iso is not today (already filtered on read).
  Writes: none.

### 5. Laundry taps ignore `?dryrun=1`
- **Trigger:** `laundryAdd`, `laundryAdvance`, `laundryDel`, `laundryKidHook`, `laundryTimesSave` write with
  `if(db)` alone. `laundryBlockSet` / `wtReport` use `_lbWrite()` / `_wtWrite()` (gated). The repo rule: writes go
  through `db` only when `db && !_dryRun()`.
- **Seen:** nothing on screen — a diagnostic session in dry run that taps → Dryer moves the family's real load.
- **Fix (small):** route the five through `_lbWrite()`. Writes: none new; fewer in dry run.

### 6. A kid can start a load but can't move one; the "Fold and put away" grab isn't linked to the pile
- **Trigger:** DeWalt `config/grabs/6` = "Fold and put away a load of laundry" (Up for Grabs). A kid claims it and
  folds Taylor's load; Mom's pile still says "in the fold pile" (and, after hole 1, keeps asking her to block time
  until she taps ✓ Put away herself). Likewise a chore like "Move the laundry to the dryer" can only *start* a new
  load (and `laundryStartGuess` rightly refuses it), never advance the one that is there.
- **Seen (kid):** nothing wrong — stars bank. **Seen (Mom):** a stale pile, a question about work already done.
- **Fix (medium):** widen the step field: `laundry: true | false | "dryer" | "fold" | "putaway"` (the 🧺 Tells Mom
  button already sets true/false). On check-off, "dryer"/"fold"/"putaway" advances the *newest* load sitting at the
  stage before it (targeted `laundry/<id>` set or remove, with `by` kept) and ends that stage's Mom block the way
  `laundryAdvance` does. Uncheck does nothing (Mom may have moved on). Writes: `laundry/<id>` (existing shape),
  `momBlocks/<iso>/<key>` done flag (existing).

### 7. A kid-started load's clock starts at the check-off, not at the washer
- **Trigger:** Taylor's Monday 10/12 log: seven morning steps checked within four seconds at 9:39 AM — a batch
  check at the end of the morning. The load's `ts` is the check time, so "done ~10:29" may be an hour late (or, if
  she checks before she really starts it, early).
- **Seen:** the ✅ question and the NOW nudge land at the wrong minute; the "started 9:39" marker is a fiction.
- **Fix (small, Mom-side):** an "✎ started at" time on the Laundry card line (sets `laundry/<id>/ts`, targeted).
  Optionally, the kid's step, when checked, asks "In the washer now?" [Yes] [Earlier…] — but that adds a tap to the
  kids' flow, which she has asked to keep tap-free. Writes: `laundry/<id>/ts`.

### 8. Dad's loads ask *Mom* to block time
- **Trigger:** `momSchedLaundry` never looks at `by`. A load Dad started (`by:"dad"`, his Day) draws on Mom's
  schedule with the full "Block out time?" question, and on Dad's schedule too.
- **Seen:** both schedules claim the same load; Mom is asked to plan Dad's basket.
- **Fix (small):** on Mom's agenda, a `by:"dad"` load is information only ("🫧 Dad's Towels — in the washer ·
  started 9:00", "✅ done in the washer" with no question and no button), unless Dad is away (no simple flag today —
  so: information only, and Mom's Day card keeps its buttons for the day she takes it over). Writes: none.

### 9. The wash-today bin never nags
- **Trigger:** 💦 Wet or soiled puts a load in stage `bin` with no clock. It shows only as a line on the Laundry
  card (Mom's and Dad's Day). No schedule row, no NOW nudge, no badge. "Runs that night or next morning" — if it is
  forgotten, nothing says so.
- **Seen:** a lidded bin of wet sheets for two days.
- **Fix (small):** a NOW nudge from the next morning on (`ts + 14 h`, say): "💦 Sheets (king) are still in the
  wash-today bin — start the prewash?" [🫧 Start prewash], on Mom's and Dad's Day. Writes: none.

### 10. A load removed with ✕ leaves its open block behind
- **Trigger:** `laundryDel` deletes the load but not its `momBlocks/<iso>/<load>_<stage>` record.
- **Seen:** the block stops holding time (momBlockOpen needs the load) and no ✓ row is drawn — it just vanishes;
  the record stays in the day's node.
- **Fix (tiny):** `laundryDel` also removes that stage's block (targeted `remove`). Writes: `momBlocks/<iso>/<key>` remove.

### 11. A kid-started load that was never a load has no way off the schedule
- **Trigger:** a kid checks "Start a load of laundry" with nothing in the machine (or Mom back-fills it).
  The washer row and its ✅ question re-draw every day at "now" (an earlier-day start is placed at now), with
  no ✕ on the schedule row — only Mom's Day's Laundry card has the ✕.
- **Seen:** a permanent "Taylor started laundry is done in the washer. Block out time?" at the top of every day.
- **Fix (tiny):** a small "✕ not a load" on the schedule's ✅ row for `by:<kid>` loads → `laundryDel`. Writes:
  the existing `laundry/<id>` remove.

### 12. "Done early" is impossible before the cycle time
- **Trigger:** LAUNDRY_NOTYET hides the question until `ts + wash` (per family, not per load). A 30-minute quick
  wash on a 50-minute setting waits 20 minutes for its question; the NOW nudge waits too.
- **Seen:** "⏳ done ~9:51" while the washer has been quiet since 9:31.
- **Fix (tiny):** a "Done early" tap on the ⏳ row that sets `ts` back so done = now (targeted `laundry/<id>/ts`).
  Writes: `laundry/<id>/ts`.

## Checked and sound (no change proposed)

- "After <card>" when that card leaves the day (sent to Mom, claimed, fell off): the Mom loop lays the block at her
  tap time or at the card's real check — handled (`_blkAfter` / `_mlFinished`).
- Kid uncheck after Mom moved the load on: the load stays (KIDLAUNDRY keeps a moved load); re-check never duplicates.
- Two devices tapping: every laundry write is `laundry/<id>` (one record), every block write `momBlocks/<iso>/<key>`;
  the `laundry` listener replaces the whole local map — no merge drift.
- Wet loads: bin → prewash → washer → dryer → fold, each wash runs the washer clock, prewash's block key is its own.
- Dry run: `laundryBlockSet`, `laundryBlockMinsEdit`, `laundryBlockDone`, `wtReport` write nothing (see hole 5 for the rest).
- No Mom block ever touches `week*/tasks`: the lay is in memory; the kids' cards move on their own write paths.

## Suggested order, if she wants one

1 (done) → 2 (words, so the new pile question reads right) → 3 (the sour-load nudge gap) → 4 (long-open devices) →
5 (dry run) → 6 (kids moving loads) → the rest as they itch.
