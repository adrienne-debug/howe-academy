# Units switch-over — the steps PARKED on 2026-10-26, with the questions each one waits on

Her go-ahead 2026-10-26 ("get this all done") built every step the order doc and the existing designs specified fully enough
to test: steps 1–6 (Lucy, Ellis, Lincoln, Julian ×3), step 9 (LA Irregulars) and step 14 (GRADKEEP). These are the rest.
None of them has code on the branch; each is parked, not guessed. One answer per question is enough to start it.

## Steps 7 + 8 — Ellis: fold 10 old cards into RS4K Book 4; fold 7 Grammar cards into FLL 4 (her §12)

**What they would do.** Change `subject` (and, for FLL, `prompt`) on existing cards by index so the card *is* the unit's card;
null the matching saved bank entries; retire the old built-in names for him so the auto-pull never re-mints them. That is a
third kind of engine — a **fold** (card field writes by index + a per-kid retire list) — not the attach engine, and the one
place in the switch-over that rewrites card text (FLL: noun → Noun).

**Questions (your call before any code):**
1. Step 7's open call in the order doc: the **11 Science and 10 Grammar bank words** that are also book words but not cards yet —
   retire them from the old lists so they come in through the book (chapter-gated), or leave them to start twice? (Recommended:
   retire.) The same retire list is what steps 7 and 8 need, so this answer shapes the engine.
2. Step 8 renames 7 cards' prompts (noun → Noun …). OK to change card text for Ellis (nothing of his reads cards by text), or
   keep his lowercase prompts and let FLL 4 keep its own "Noun" cards (a second card each)?
3. Order: 7 before 8, or 8 alone first (smaller, no bank nulls)?

**Snapshot needed:** `mastery/ellis` (card indexes for the 17), `ellis_custom_items` (the 2 Geography entries), `ellis_settings/
definitions`, `unitStudies/rs4k_book4`, `unitStudies/fll_4`.

## Step 10 — the LOE phonogram master list (a unit record), then 11 (Ellis) and 12 (Lincoln) attach (her §8)

**Questions:**
1. **The unit id and name** — `loe_foundations`? It should be the id your LOE A–D build from the photos will keep, so the two land
   in one record.
2. The deck: one **Phonograms** deck = `SPRINT_LOE_B` + the boys' 59 names, LOE wording on the backs, one "In AAS: …" line where
   the marks differ (9), the 4 AAS-only sounds as extra steps — confirm, or list the phonograms you want instead.
3. Do lessons (A–D) come later from the photos (assumed yes), and is "＋ Add to our family" your tap for this record?
Steps 11 and 12 are plain attaches (the engine exists) and follow the day step 10's record exists: Ellis 59 cards (43 parked stay
parked), Lincoln 56; bank entries only for missing names; no `definitions` writes.

## Step 13 — Lincoln's Spelling Rules backs (her §11) — no code, your edits

Five rules worded differently from the AAS book (Never-Ending, Add ES, Long Vowel, Floss, Add S). When you want them, I give you
the AAS wording side by side and you retype each in 📖 Flip Definitions (a `definitions/<rule>` edit by you in the app). Step 15
then attaches the 9 rule cards by exact name.

## Step 15 — Lincoln · All About Spelling (her §7) — after 13 and 14

GRADKEEP (step 14) is now on the branch, so the gate is open. Still waits on:
1. Step 13 (your 5 edits) — or say the 5 rules may attach under his wording and be re-worded later.
2. **The notebook Spelling page**: the shared page turns on when `all_about_spelling` has a `kidStage` for him (contract point 11).
   Keep it (`nbWords` / `nbPractice` on the kidStage) or switch it off before the real Yes? The before/after notebook build will
   show it either way.
3. `testRight` for him: **monthly** (the default, recommended in the design) or graduated?
4. Confirm the shape: attach his AAS Words cards through L2-19 and the 9 rule cards; re-deck 7 cards (keep, three, been, whale,
   while, of, with) to `AAS Words` by index with their 7 saved Spelling entries nulled; **append 268 graduated cards** for AAS words
   through L2-19 with no card; held bank entries L2-20 → Level 4 with `ch` and the back on the entry; `cat_gate` on the three
   decks, `cat_hold/AAS Words`; `_lincolnAASMigrated` left alone; his 54 dictation cards left alone.
**Snapshot needed** the day it starts: `mastery/lincoln`, `lincoln_custom_items`, `lincoln_settings`, `unitStudies/all_about_spelling`.

## Step 16 — Lincoln · Language Arts Irregulars by check-up (her §9) — after 9 and 14

Both gates are now on the branch (the Irregulars are unit cards once you tap step 9's Yes; GRADKEEP decides what a check-up ✓ does).
**Question:** append his 40 bank entries and run the placement check-up the same day, or let the 40 sit in his bank until you have
time? Nothing else is open; the code is one bank append (40 `{cat,name}` entries, like the math hook-ups) plus the existing check-up.

---

## Her in-app taps, in order (everything on the branch after it is deployed)

1. 🧮 Math Fluency Path → 🔗 Hook up **Lucy** (`?dryrun=1` first, then real) — step 1.
2. 🔗 Hook up **Ellis** — step 2.   3. 🔗 Hook up **Lincoln** — step 3.
4. 🔤 Letters Path → 🔗 Hook up **Julian** — step 4.   5. 🔷 Shapes Path → 🔗 Hook up Julian — step 5.   6. 🧮 Math → 🔗 Hook up Julian — step 6.
7. 📝 Language Arts — Editor in Chief → ＋ Add Irregulars (40) — step 9 (independent of 1–6).
8. Mom's Day → ⚙ on the heads-up card: look at the defaults; ✏️ a roadmap row and pick a "Shows up…" choice (steps 4–6 of the heads-up).
After each real Yes: the read-back named in that step's PLAN file. "➡ Start Stage N" buttons stay untapped until they are their own step.
