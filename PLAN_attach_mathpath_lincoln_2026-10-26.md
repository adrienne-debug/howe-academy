# Step 3: hooking up Lincoln to the Math Fluency Path (the plan, before anything writes)

The exact plan the **🔗 Hook up Lincoln** button on the Math Fluency Path will carry out. Made from a fresh **read-only**
look at his live data on Monday morning, Oct 26 (12:47 UTC) — GETs of `mastery/lincoln`, `lincoln_custom_items`,
`lincoln_settings`, `lincoln_bank_order`, `lincoln_sessions`, `unitStudies/math_fluency_path`; nothing was written. The
code is one row in the step-1 engine's table, on the group branch `fable/running-now`. Nothing is deployed. Her order:
step 3 of `PLAN_units_switchover_order_2026-10-25.md`. Her go-ahead 2026-10-26 ("get this all done") covers building it;
the Yes in the app is still hers, after Lucy's and Ellis's.

**Your taps, after it ships, in order:** Lucy (step 1) → Ellis (step 2) → `?dryrun=1` → Units → 🧮 Math Fluency Path →
**🔗 Hook up Lincoln** → read the plan → ✓ Yes (writes nothing, says so) → the same without `dryrun`.

## What Lincoln will notice

- **Nothing on day one.** His 4 Math Facts cards stay exactly as they are — ⅓, ⅔, ¼ as decimal (every other day) and
  ¾ as decimal (learning). Same rungs, same due days, same dots. **Not one of his cards is written.**
- **His two backs keep his wording.** ⅓ → "0.333… (3 repeating)" and ⅔ → "0.666… (6 repeating)" differ from the path's
  "0.333…" / "0.666…". The plan reports them and leaves them (your §10). No `definitions` write.
- **His next new cards don't change:** ⅕, ⅛, ⅜, ⅝, ⅞ as decimal, then his own 25% of 80, 10% of 250, 50% of 136, 15% of
  60, 33% of 90 — before and after.
- **His 14 extras stay his.** 9 percent-of and 5 order-of-operations facts on his built-in list are not unit words. They
  keep living in his Math Facts deck and list until Our words takes them (needs your Singapore-lesson answers). The row's
  `strayOk:true` means that if one of them has become a card by the time you tap Yes, the plan lists it as "left as it
  is" instead of refusing.
- **Later, as room opens:** once his own 35 are all started, the rest of stage 8 follows in the path's order — halves &
  fourths, fifths & tenths, eighths, thirds & sixths, percent shortcuts, squares to 15², cubes, powers of 10 & 2, prime or
  not, customary units, metric, integer signs — still 2 learning at a time. His list grows from 35 to 225 facts.

## What you will see

On the Math Fluency Path, his row changes from **+ Lincoln** to **🔗 Hook up Lincoln**; after Yes it reads
**Lincoln · Stage 8 · Fractions, decimals & beyond · 3 of 211 on the ladder · learning Halves & fourths**. Stage 8 is the
path's last stage, so there is no ➡ Start Stage 9.

## Everything it writes (192 targeted changes, sent together in one save)

| Where | How many | What |
|---|---|---|
| `unitStudies/math_fluency_path/enrolled/lincoln` | 1 | `true` |
| `unitStudies/math_fluency_path/kidStage/lincoln` | 1 | `{stage:8, subject:"", knows:"", map:"", ts, via:"attach"}` |
| `mastery/lincoln_custom_items/1281 … 1470` | **190** | `{cat:"Math Facts", name}` for each stage-8 card he doesn't have — appended after his 1281 saved entries, in the path's order. No `def`, no `ch`. |

By family, the 190: Halves & fourths 10 · Fifths & tenths 31 · Eighths 12 · Thirds & sixths 14 · Percent shortcuts 13 ·
Squares to 15² 29 · Cubes to 5³ 7 · Powers of 10 & 2 14 · Prime or not? 26 · Customary units 12 · Metric 8 · Integer signs 14.

## Checked against his data

- His 4 Math Facts cards are all stage-8 cards (matched by deck + exact prompt). No stray card today.
- 21 of his 35 built-in words are stage-8 words; the 14 extras are listed above. No duplicates. No saved Math Facts
  entries (`lincoln_custom_items` is 1281 long, none null); no Math Facts bank order (only Greek & Latin Roots), so his
  list reads built-in order then saved — the 190 land after his 35.
- `lincoln_settings`: no Math Facts entry in `cat_modes`, `cat_intro_max`, `cat_gate`, `cat_caps`; no `cat_hold`;
  `max_intro_per_cat` 2; no Math Facts `definitions` (his two backs live on the cards).
- The unit record: starter v1, nobody enrolled, no `kidStage`, `nbInsert:false`; its stage-8 deck = 211 cards in 12
  families, same as the code's starter.

## Not touched

His cards (461), his two backs, `cat_modes`, `cat_intro_max`, `definitions`, `cat_gate`, `cat_hold`, his bank order, his
sessions, his notebook, his curriculum, Lucy / Ellis / Julian, the unit record beyond `enrolled/lincoln` + `kidStage/lincoln`.

## Safety

Refuses if the unit isn't in the database or he is already hooked up; rebuilt at Yes and refused if his data changed;
`?dryrun=1` → "Dry run — nothing was written"; the stock **+ Lincoln** enroll is closed while the hook-up waits. A stray
extra is reported and kept (strayOk), never written.

## Your calls this step assumed

1. **Fill the rest of stage 8 now** (190 facts), as with Lucy and Ellis.
2. **The 14 extras are not held back** from the auto-pull — they start in his list's order as today (holding them is the
   Our words design's PR 2, not this step).
3. **The snapshot fixture is on the branch** (`test_fixtures/mathpath_lincoln_2026-10-26.json`), your standing yes.

## Proof

`test_attach_mathpath_lincoln.js` — 45 checks with the snapshot (43 without): 4 cards and settings byte-identical after;
the two backs reported and kept; exactly the 192 paths; 225 in his list afterwards, his 35 first; next ten identical;
strayOk lists an extra-turned-card and goes ahead while Lucy's row (no strayOk) still refuses; dry run / non-Mom /
data-changed / no-unit / already-hooked write nothing; stock enroll closed for him, open for Julian.
`test_attach_mathpath_lucy.js` (50) and `test_attach_mathpath_ellis.js` (57): "Julian / Lincoln have no row" expectations
now read "Julian". After your real Yes: read-back of `enrolled/lincoln`, `kidStage/lincoln`, `lincoln_custom_items`
(1471 entries) and `mastery/lincoln` (461, byte-identical).
