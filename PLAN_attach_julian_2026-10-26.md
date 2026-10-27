# Steps 4–6: hooking up Julian — Letters Path stage 1 · Shapes Path stage 2 · Math Fluency Path stage 2 (the plan, before anything writes)

Three **🔗 Hook up Julian** buttons, one per unit, each its own commit on `fable/running-now`, from one fresh **read-only**
look at his live data on Monday morning, Oct 26 (12:56 UTC) — GETs of `mastery/julian`, `julian_custom_items`,
`julian_settings`, `julian_bank_order` (empty), `julian_sessions` (empty), `unitStudies/letters_path`, `unitStudies/shapes_path`,
`unitStudies/math_fluency_path`, `notebookSettings/julian`; nothing was written. Her order: steps 4, 5, 6 of
`PLAN_units_switchover_order_2026-10-25.md`. Her go-ahead 2026-10-26 ("get this all done") covers building them; each Yes
in the app is hers, one unit at a time.

**The one thing all three share: ZERO card writes and ZERO bank writes.** Each writes exactly two leaves —
`unitStudies/<unit>/enrolled/julian = true` and `unitStudies/<unit>/kidStage/julian = {stage, via:"attach", ts}`. His
cards, his saved list, his settings, his notebook cursors are not touched, so **his notebook cannot change**: the Letter
of the Day, the numbers front and the Shape of the Day read his decks (`mastery/julian`) and `notebookSettings/julian`
(`letterCursor {week 27, idx 1}`, `numberCursor {from 14}`), and `notebooks.js` never reads a unit's enrolment or stage
(checked: no `kidStage` / `enrolled` / `unitStudies` read anywhere in it). The order doc asked for an iframe build of next
week's notebook before and after; the tests prove the inputs that build is made from are byte-identical, which is the same
thing without a browser. `nbInsert:false` on all three units is not written (contract point 8).

**Your taps, after it ships (after Lucy, Ellis, Lincoln):** `?dryrun=1` → Units → the unit → 🔗 Hook up Julian → read the
plan → ✓ Yes (writes nothing, says so) → the same without `dryrun`. Letters first, then Shapes, then Math.

---

## Step 4 — 🔤 Letters Path, stage 1 (Big letters)

- **His cards:** 16 Letters cards, A–P — 13 on the ladder (A, F, G, H monthly · B, C, D, E, I, J bi-weekly · K, L, M
  weekly), 3 learning (N, O, P). Every one is a stage-1 card. No stray, no earlier stage.
- **His list:** the built-in 26 capitals = the unit's 26. Nothing to add.
- **Writes (2):** `enrolled/julian`, `kidStage/julian {stage:1}`. **Not touched:** `mastery/julian` (so `letterCursor
  {week 27, idx 1}` keeps meaning the same card), `nbInsert`, Lowercase / Letter Sounds decks (stages 2–3 have no cards of
  his; the stock "move up" is acceptable there later — not this step).
- **He will notice:** nothing. Letter of the Day keeps its rotation.
- **You will see:** his row on Letters Path reads **Julian · Stage 1 · Big letters · 13 of 26 on the ladder · 3 learning**,
  with ➡ Start Stage 2 (don't tap it until that is its own step) and the 🩺 check-up start.

## Step 5 — 🔷 Shapes Path, stage 2 (More flat shapes)

- **His cards:** 15 Shapes cards. 4 are stage-1 basics (Circle, Square, Triangle, Rectangle — all monthly) → **kept, counted
  as "from earlier stages"**, never stray. 11 are stage-2 shapes (Star, Heart, Oval monthly · Diamond bi-weekly · Pentagon
  weekly · Hexagon, Octagon, Heptagon every other day · Nonagon, Decagon, Trapezoid learning). None is a stage-3 solid.
- **His list:** built-in 8 + 18 saved (Pentagon … Pyramid) = all 26 unit shapes, the 5 solids among them (in the bank, waiting).
  Nothing to add.
- **Engine addition this step:** a card from an *earlier* stage of the same deck is kept and counted separately instead of
  being called stray (the stage-6/7/8 rows never met one). Lucy's, Ellis's and Lincoln's plans are unchanged by it.
- **Writes (2):** `enrolled/julian`, `kidStage/julian {stage:2}`. **Not touched:** the deck key `Shapes`, the array order
  (so the Shape-of-the-day rotation `((wk−1)×5) % n` lands on the same shape), `nbInsert`.
- **Your call, assumed:** stage **2** as his marker (the order doc's recommendation), not 3.
- **You will see:** **Julian · Stage 2 · More flat shapes · 8 of 17 on the ladder · 3 learning**, 4 earlier-stage cards noted.

## Step 6 — 🧮 Math Fluency Path, stage 2 (Numbers 11–20)

- **His cards:** Numbers 1–17 and Counting one–ten. Stage 2 = Numbers 11–20 + Counting eleven–twenty. 7 of his Numbers
  cards (11–17: 11 bi-weekly · 12, 14 every other day · 13 weekly · 15, 16, 17 learning) are stage-2 cards; his Numbers
  1–10 and Counting one–ten (20 cards) are stage-1 → **kept, counted as earlier**. No stray.
- **His list:** Numbers 1–20 built-in = the unit's 20. Counting built-in one–ten = the unit's stage 1; the stage-2 words
  eleven–twenty (10) and stage-4 tens (8) are not on his list.
- **Your call, assumed: enroll only (`fill:false`)** — the order doc said "18 Counting bank entries — only if you say so".
  Say the word and the row's `fill` flips to true (then Yes would append the 10 stage-2 Counting words, 2 + 10 writes).
- **Writes (2):** `enrolled/julian`, `kidStage/julian {stage:2}`. **Not touched:** deck key `Numbers`, numeric prompts,
  statuses — so the numbers front and `numberCursor {from 14}` read the same cards; Counting is not on his notebook.
- **You will see:** **Julian · Stage 2 · Numbers 11–20 · 4 of 20 on the ladder · 3 learning**, 20 earlier-stage cards noted.

---

## Checked against his data (all three)

- `julian_settings`: no Letters / Shapes / Numbers / Counting entry in `cat_modes` or `cat_intro_max`; no `cat_gate`, no
  `cat_hold`; `max_intro_per_cat` 3. `julian_bank_order` and `julian_sessions` are empty. His saved list is 71 long, no nulls
  (Shapes 18, Dinosaurs 7, NC Snakes 38, Snake Facts 8).
- The three unit records: starter v1, nobody enrolled, no `kidStage`, `nbInsert:false`; their decks match the code starters
  (Letters 26 · Shapes 4/17/5 · Numbers 10/10 · Counting 10/10/8) — names, stages, order.

## Not touched (all three)

His 113 cards, his saved list, `cat_modes`, `cat_intro_max`, `definitions`, `cat_gate`, bank order, sessions,
`notebookSettings/julian`, the unit records beyond `enrolled/julian` + `kidStage/julian`, every other kid.

## Safety (all three)

Refuses if the unit isn't in the database or he is already hooked up; rebuilt at Yes and refused if his data changed;
`?dryrun=1` → "Dry run — nothing was written"; the stock **+ Julian** enroll on each unit is closed while its hook-up waits
(Caleb's and every other family's stock buttons are unchanged).

## Proof

`test_attach_letters_julian.js`, `test_attach_shapes_julian.js`, `test_attach_mathpath_julian.js` replay the shared snapshot
`test_fixtures/attach_julian_2026-10-26.json` (and a made-up Julian when it is absent): cards, saved list, settings and
notebook cursors byte-identical after; exactly 2 paths; earlier-stage cards counted, never stray; refusals write nothing;
stock enroll closed for him, open for a kid without a row; `notebooks.js` and the notebook context code read no unit
enrolment or stage. `test_unit_stages.js` and `test_shapes_path.js` keep their stock-path checks with Caleb as the sample kid.
After each real Yes: read-back of `enrolled/julian`, `kidStage/julian`, `mastery/julian` (113, byte-identical),
`julian_custom_items` (71, byte-identical).
