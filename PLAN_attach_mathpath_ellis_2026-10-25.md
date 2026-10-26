# Step 2: hooking up Ellis to the Math Fluency Path (the plan, before anything writes)

This is the exact plan the **🔗 Hook up Ellis** button on the Math Fluency Path will carry out. It was made from a fresh
**read-only** look at Ellis's live data on Sunday night, Oct 25 (03:03 UTC Oct 26) — GETs of `mastery/ellis`,
`ellis_custom_items`, `ellis_settings`, `ellis_bank_order`, `ellis_sessions`, `unitStudies/math_fluency_path`; nothing was
written. The code is one row in the step-1 engine's table, on the group branch `fable/running-now`. Nothing is deployed.
Her order: step 2 of `PLAN_units_switchover_order_2026-10-25.md`.

**Your taps, after it ships and after Lucy's step 1 has had its own Yes:** open the app with `?dryrun=1` → Units →
🧮 Math Fluency Path → **🔗 Hook up Ellis**. The plan shows on screen (this page, shorter). **✓ Yes** writes nothing in the
dry run and says so. Then the same without `dryrun`: Yes rebuilds the plan from live data, refuses if his data changed
since the plan was shown, otherwise writes once.

## What Ellis will notice

- **Nothing on day one.** His 13 Math Facts cards stay exactly as they are — 6×7, 7×8, 8×9, 9×6, 6×8, 7×9 (monthly),
  8×6, 9×7, 6×9 (bi-weekly), 12×11 (weekly), 12×9 (every other day), and 12×7, 12×6 learning. Same rungs, same due
  days, same dots. **Not one of his cards is written.**
- **His next new cards don't change.** The auto-pull reads his list in his own order and skips what he has, so the next
  ten stay **12×8, 3×9, 9×3, 3×4, 4×3, 9×4, 4×9, 4×8, 8×4, 7×7** — before and after.
- **Later, as room opens:** once his own 47 facts are all started, the rest of the × and ÷ facts follow in the path's
  order (the 0s, then 1s, 2s … 12s — 0×0, 0×1 … 144÷12), still 2 learning at a time (his `max_intro_per_cat`). That is
  the one thing that changes for him: his list grows from 47 to 313 facts, and division facts arrive for the first time.
- The deck keeps its card style (flash on his cards; the unit's quiz default is not written), how many start at a time,
  its answers (his 47 backs under `definitions` stay), his bank order. No notebook page (`nbInsert` is false on this unit
  and is not written).

## What you will see

On the Math Fluency Path, his row changes from **+ Ellis** to **🔗 Hook up Ellis**; after Yes it reads
**Ellis · Stage 7 · × and ÷ facts · 11 of 313 on the ladder · learning × ÷ · 12s**, with the usual ➡ Start Stage 8
button and the 🩺 check-up start. (Please don't tap ➡ Start Stage 8 until that is its own planned step — it still uses
the stock enroll; step 3 is Lincoln on stage 8 anyway.)

## Everything it writes (268 targeted changes, sent together in one save)

| Where | How many | What |
|---|---|---|
| `unitStudies/math_fluency_path/enrolled/ellis` | 1 | `true` — puts him in the unit |
| `unitStudies/math_fluency_path/kidStage/ellis` | 1 | `{stage:7, subject:"", knows:"", map:"", ts, via:"attach"}` — his marker: × and ÷ facts |
| `mastery/ellis_custom_items/889 … 1154` | **266** | `{cat:"Math Facts", name}` for each stage-7 fact he doesn't have — appended after his 889 saved entries, in the path's order. No `def` (a def makes a recite card), no `ch` (no book gate). |

By family, the 266: 0s (25) · 1s (24) · 2s (24) · 3s (22) · 4s (21) · 5s (24) · 6s (17) · 7s (17) · 8s (17) · 9s (16) ·
10s (24) · 11s (19) · 12s (16).

## Checked against his data

- All 13 of his Math Facts cards are stage-7 cards (all ×; no ÷ card yet), matched by deck + exact fact. **Every answer
  matches** the unit's (`6×7` → 42 … `12×6` → 72). Nothing to reconcile. No stray card.
- All 39 facts on his built-in list and the **8 saved 3s/4s** (`ellis_custom_items` 310–317: 9×4, 8×4, 4×8, 4×9, 4×3,
  3×4, 9×3, 3×9) are stage-7 facts; none is a duplicate.
- `ellis_bank_order/Math Facts` lists exactly those 47, starting at the 6s. It is **kept, not written**: his 47 stay
  first in his order; the 266 new names come after them (that is how the bank reads an order list).
- His saved list is 889 long with one empty slot (index 22, left alone); the 266 start at 889.
- `ellis_settings`: no Math Facts entry in `cat_modes`, `cat_intro_max`, `cat_gate`, `cat_caps`; no `cat_hold`;
  `max_intro_per_cat` 2; `definitions` holds his 47 backs (untouched). `ellis_sessions` has only a science session.
- The unit record in the database is starter version 1, nobody enrolled, no `kidStage`, `nbInsert:false`; its stage-7
  deck is 313 cards in 13 families, same as the code's starter (names, answers, order).
- His math subjects (Dimensions Math 4A, Singapore E, Math Reasoning) are **not linked** — no book map, no gate written,
  so no fact waits on a lesson; exactly as today.

## Not touched

- His cards (`mastery/ellis`, 256): not one is written. The array is not re-sorted, nothing removed.
- `cat_modes`, `cat_intro_max`, `definitions`, `cat_gate`, `cat_hold`, `cat_caps`, his bank order, his sessions.
- His notebook (`notebookSettings/*`), his curriculum and schedule. No test print.
- Lucy (her own step-1 hook-up, independent of this one), Julian, Lincoln — their rows on this unit are unchanged.
- The Math Fluency Path record itself (cards, stages, `nbInsert`) — only `enrolled/ellis` and `kidStage/ellis` are added.

## Safety

- **Refuses** if the unit isn't in the database, if he is already hooked up, or if a Math Facts card of his doesn't match
  a stage-7 fact (none today — then it would list the card and stop). A back that differs is reported and kept, never
  written (none today).
- **Rebuilt when you tap Yes:** if his data changed since the plan was shown, nothing is written and the new plan shows.
- In `?dryrun=1`, Yes writes nothing and says "Dry run — nothing was written."
- The stock **+ Ellis** enroll on this unit is closed while his hook-up waits (it would have minted placed cards and
  overwritten the deck's settings). His hook-up opens it again as the normal stage row. Julian's and Lincoln's stock
  buttons are unchanged.

## The code this step adds

One row: `UA_ATTACH.math_fluency_path.ellis = {stage:7, fill:true}` (and a comment). Everything else is the step-1
engine (`UNITATTACH_START…END`), unchanged.

## Your two answers this step assumed

1. **Fill the rest of stage 7 now** (266 facts into his list) — the same call as Lucy's step; `fill:false` would make
   the plan 2 writes.
2. **The snapshot fixture stays local** (`test_fixtures/mathpath_ellis_2026-10-25.json`: his 13 cards, the 8 saved
   facts, his bank order, the settings keys the attach reads, the unit's stage-7 list) until you say it may be pushed —
   as with Lucy's. The test uses it when present and a made-up Ellis of the same shape otherwise.

## Proof

- `test_attach_mathpath_ellis.js` (57 checks) replays the snapshot: his 13 cards, his bank order and his settings
  byte-identical after; exactly the 268 paths above; 313 stage-7 facts in his list once each afterward, his 47 first in
  his order; next ten new cards identical before and after; dry run, non-Mom, "data changed", no-unit, already-hooked and
  stray-card refusals write nothing; the stock enroll is closed for him and open for Julian and Lincoln.
- `test_attach_mathpath_lucy.js` (50) still passes — five of its "only Lucy has a row" expectations now read
  "Lucy and Ellis"; Julian/Lincoln stand in as the kids without a row.
- After your real Yes: a GET of `unitStudies/math_fluency_path/enrolled/ellis`, `kidStage/ellis`, `ellis_custom_items`
  (1155 entries, 889–1154 = the 266 facts), `ellis_bank_order/Math Facts` (unchanged, 47) and `mastery/ellis` (256
  cards, byte-identical to the snapshot).
