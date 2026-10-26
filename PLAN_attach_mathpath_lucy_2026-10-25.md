# Step 1: hooking up Lucy to the Math Fluency Path (the plan, before anything writes)

This is the exact plan the new **🔗 Hook up Lucy** button on the Math Fluency Path will carry out. It was made from a
fresh **read-only** look at Lucy's live data on Sunday, Oct 25, 18:57 UTC (GETs of `mastery/lucy`, `lucy_custom_items`,
`lucy_settings`, `lucy_bank_order`, `lucy_sessions`, `unitStudies/math_fluency_path`, `curriculum/subjects/lucy`; nothing
was written). The code goes on branch `fable/attach-mathpath-lucy`. Nothing is deployed. Her order: step 1 of
`PLAN_units_switchover_order_2026-10-25.md`.

**Your taps, after it ships:** open the app with `?dryrun=1` → Units → 🧮 Math Fluency Path → **🔗 Hook up Lucy**. The
plan shows on screen (this page, shorter). **✓ Yes** writes nothing in the dry run and says so. Then the same without
`dryrun`: Yes rebuilds the plan from live data, refuses if her data changed since the plan was shown, otherwise writes
once.

## What Lucy will notice

- **Nothing on day one.** Her 13 Math Facts cards stay exactly as they are — 1+1 … 2+4 (8 bi-weekly), 3+1 (weekly),
  3+2 (every other day), and 3+3, 3+4, 4+1 learning. Same rungs, same due days, same dots. **Not one of her cards is
  written.**
- **Her next new cards don't change.** The auto-pull reads her list in order and skips what she has, so the next ten
  stay **4+2, 4+3, 4+4, 5+1, 5+2, 5+3, 5+4, 5+5, 6+1, 6+2** — before and after.
- **Later, as room opens:** once her own 49 facts are all started, the rest of the + and − facts follow in the path's
  order (the 0 family, then 1, 2 … 18 — 0+0, 0−0, 0+1, 1+0, 1−0, 1−1 …), still 3 learning at a time. That is the one
  thing that changes for her: her list grows from 49 to 200 facts.
- The deck keeps its card style (quiz), how many start at a time (3), its answers, her Mom-drill. No sprint prompts (starter
  paths never prompt sprints — her rule 10/4). No notebook page (`nbInsert` is false on this unit and is not written).

## What you will see

On the Math Fluency Path, her row changes from **+ Lucy** to **🔗 Hook up Lucy**; after Yes it reads
**Lucy · Stage 6 · + and − facts · 10 of 200 on the ladder · learning + − · 5 family** (4+1 is the first learning card in the path's order), with the usual ➡ Start Stage 7
button and the 🩺 check-up start. (Please don't tap ➡ Start Stage 7 until that is its own planned step — it still uses
the stock enroll.)

## Everything it writes (153 targeted changes, sent together in one save)

| Where | How many | What |
|---|---|---|
| `unitStudies/math_fluency_path/enrolled/lucy` | 1 | `true` — puts her in the unit |
| `unitStudies/math_fluency_path/kidStage/lucy` | 1 | `{stage:6, subject:"", knows:"", map:"", ts, via:"attach"}` — her marker: + and − facts |
| `mastery/lucy_custom_items/60 … 210` | **151** | `{cat:"Math Facts", name}` for each stage-6 fact she doesn't have — appended after her 60 saved entries, in the path's order. No `def` (a def makes a recite card), no `ch` (no book gate). |

By family, the 151: 0 (2) · 1 (4) · 2 (4) · 3 (5) · 4 (6) · 5 (6) · 6 (9) · 7 (10) · 8 (12) · 9 (13) · 10 (8) · 11 (16) ·
12 (14) · 13 (12) · 14 (10) · 15 (8) · 16 (6) · 17 (4) · 18 (2).

## Checked against her data

- All 13 of her Math Facts cards are stage-6 cards, matched by deck + exact fact. **Every answer matches** the unit's
  (`1+1` → 2 … `4+1` → 5). Nothing to reconcile.
- All 49 facts on her built-in list are stage-6 facts; none is a duplicate.
- Her saved list (`lucy_custom_items`, 60 entries) has **no** Math Facts entries — Frogs 28, Spelling 18, Logic of
  English 14 — so the 151 start at index 60.
- `lucy_bank_order` and `lucy_sessions` are empty. No `cat_gate`, no `cat_hold`. `cat_modes` has no Math Facts entry
  (the deck runs on the built-in default for her, quiz); `cat_intro_max` has no Math Facts entry (default 3).
- The unit record in the database is starter version 1, nobody enrolled, no `kidStage`, `nbInsert:false`; its stage-6
  deck is 200 cards in 19 families, same as the code's starter.
- Her math subjects (Dimensions Math 1A, Math Reasoning B, Mathseeds) are **not linked**: the only book map in the app is
  Abeka Arithmetic 2 (DeWalt's). No gate is written, so no fact waits on a lesson — exactly as today.

## Not touched

- Her cards (`mastery/lucy`): not one is written. The array is not re-sorted, nothing removed.
- `cat_modes`, `cat_intro_max`, `definitions`, `cat_gate`, `cat_hold`, her bank order, her sessions.
- Her notebook (`notebookSettings/*`), her curriculum and schedule. No test print.
- Julian, Ellis, Lincoln — their rows on this unit keep the stock **+ Kid** button; nothing changes for them.
- The Math Fluency Path record itself (cards, stages, `nbInsert`) — only `enrolled/lucy` and `kidStage/lucy` are added.

## Safety

- **Refuses** if the unit isn't in the database, if she is already hooked up, or if a Math Facts card of hers doesn't match
  a stage-6 fact (none today — then it would list the card and stop).
- **Rebuilt when you tap Yes:** if her data changed since the plan was shown, nothing is written and the new plan shows.
- In `?dryrun=1`, Yes writes nothing and says "Dry run — nothing was written."
- The stock **+ Lucy** enroll on this unit is closed while her hook-up waits (it would have minted placed cards and
  overwritten the deck's settings). Her hook-up opens it again as the normal stage row.
- Tapping a second time says she's already hooked up.

## The engine this step carries (UNITATTACH)

The Word Roots hook-up made general: one table says which kid attaches to which unit at which stage (today: Lucy →
Math Fluency Path, stage 6, fill the stage). The plan is pure (reads memory, changes nothing); it matches unit cards to
her cards by **kid + deck key + exact fact**; it writes only `enrolled`, `kidStage` and appended bank entries; it never
writes a card, `cat_modes`, `cat_intro_max` or a back. Units whose words are bank-held with backs on the bank (AAS) are
refused by the engine — they get their own step. Later steps add a row to the table and, where your decisions call for
it, their own extras.

## Your two answers this step assumed

1. **Fill the rest of stage 6 now** (151 facts into her list) — your yes to the order said "with the hook-up engine"
   and the order recommended filling; if you'd rather enroll only, the table's `fill` switches to false and the plan
   becomes 2 writes.
2. **The snapshot fixture stays local** (`test_fixtures/mathpath_lucy_2026-10-25.json`, her 13 arithmetic cards and the
   unit's stage-6 list) until you say it may be pushed; the test uses it when present and a made-up Lucy otherwise.

## Proof

- `test_attach_mathpath_lucy.js` replays the snapshot: her 13 cards byte-identical; exactly the 153 paths above; 200
  stage-6 facts in her list once each afterward; next ten new cards identical before and after; dry run, non-Mom,
  "data changed", no-unit and already-hooked refusals write nothing; the stock enroll is closed for her and open for the
  others; the Word Roots tests still pass.
- After your real Yes: a GET of `unitStudies/math_fluency_path/enrolled/lucy`, `kidStage/lucy`, `lucy_custom_items`
  (211 entries, 60–210 = the 151 facts) and `mastery/lucy` (87 cards, byte-identical to the snapshot).
