# Step 9: the Irregulars join the Language Arts unit (the plan, before anything writes)

The exact plan the new **＋ Add Irregulars (40)** button on the Language Arts — Editor in Chief unit will carry out. Made from a
fresh **read-only** look on Monday, Oct 26 (13:14 UTC) — GETs of `unitStudies/language_arts`, `ellis_custom_items`,
`lincoln_custom_items`; nothing was written. Her order: step 9 of `PLAN_units_switchover_order_2026-10-25.md` (her §9 in
`MAP_units_switchover_2026-10-24.md`). Her go-ahead 2026-10-26 ("get this all done") covers building it; the Yes is hers.

**Your taps, after it ships:** `?dryrun=1` → Units → 📝 Language Arts — Editor in Chief → (Mom panel) **＋ Add Irregulars (40)** →
read the plan → ✓ Yes (writes nothing, says so) → the same without `dryrun`. Independent of the Math/Letters/Shapes hook-ups.

## What it is

The Language Arts unit is a **database record** (not a code starter). Today its **Plural Nouns** deck holds 6 cards and
**Verb Tenses** 5 — the rule cards. Ellis's saved list already holds **40 irregular question cards** in those two decks:
15 "What is the plural of ‹man›?" → men … and 25 "What is the past tense of ‹go›?" → went …, each with its answer. They
are his cards and bank entries, but not unit cards, so the unit's sprints, notebook inserts and "where does this card
stand" dots don't know them. This step appends those 40 to the unit record, **spelled exactly as his saved entries**, so
his cards match by deck + name the moment the unit has them.

## Everything it writes (40 targeted changes, sent together in one save)

| Where | How many | What |
|---|---|---|
| `unitStudies/language_arts/decks/4/cards/6 … 20` | **15** | `{name:"What is the plural of <u>man</u>?", def:"men", family:"Irregulars", order:7 … 21}` — man, woman, child, tooth, foot, mouse, goose, person, ox, leaf, knife, wolf, half, sheep, deer |
| `unitStudies/language_arts/decks/5/cards/5 … 29` | **25** | `{name:"What is the past tense of <u>go</u>?", def:"went", family:"Irregulars", order:6 … 30}` — go, eat, take, write, become, see, run, come, give, sing, swim, drink, bring, think, buy, catch, teach, fly, know, grow, throw, break, speak, ride, sleep |

Create-only: each write lands on a free index right after the deck's last card. The plan is rebuilt when you tap Yes and
refused if either deck changed since it was shown. **No `stages` field** (that would flip LA to a staged unit and lock plain
enroll). The `family:"Irregulars"` tag gives the grouping without that.

## Who it touches

- **Ellis:** nothing is written. His 21 Plural Nouns and 30 Verb Tenses entries already carry these exact names; once the unit
  has them, they are unit cards (his drill progress, dots and history unchanged). His 6 + 5 rule-card entries match the unit's
  own cards already.
- **Lincoln:** nothing. His 6 + 5 entries are the unit's rule cards; his Irregulars come in **step 16** (by check-up), after
  GRADKEEP.
- **DeWalt / Burris:** untouched — this is Howe's record. The button code is generic (no kid name); if another family ever
  adds a `language_arts` record with these two decks, the same button would offer the same 40 (create-only).

## Not touched

The unit's other five decks, its enrolment (`ellis`, `lincoln`), `nbInsert`, every kid's cards and lists, every other unit.

## Safety

Mom only (`momHere()`); refuses if the unit isn't in the database, has stages, or lacks either deck; cards already present are
skipped (a re-tap says "✓ Irregulars are in"); `?dryrun=1` → "Dry run — nothing was written"; one root-level `update`.

## Proof

`test_la_irregulars.js` (replaying `test_fixtures/la_irregulars_2026-10-26.json`): the 40 constants are byte-for-byte Ellis's
saved entries beyond the unit's cards (name and answer, in his order); the plan's 40 paths and values; create-only indexes
(also for a sparse deck); after Yes the decks hold 21 and 30 with every Irregular once and nothing else changed; partial
presence skips; dry run / non-Mom / no db / changed unit / missing unit / staged unit / missing deck write nothing; the button
only on the Language Arts unit, only for Mom. After your real Yes: a GET of `unitStudies/language_arts/decks/4/cards` (21) and
`decks/5/cards` (30); `mastery/ellis` unchanged.
