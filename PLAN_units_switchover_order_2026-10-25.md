# The units switch-over — the order, one kid and one unit at a time (2026-10-25)

Written for Adrienne before any code. Sources: `MAP_units_switchover_2026-10-24.md` (your decisions §7–12),
`HANDOFF_units_2026-10-24.md`, `AUDIT_units_overlap_2026-10-24.md`, `AUDIT_notebook_hookup_2026-10-24.md` (the 15-point
contract), the Word Roots hook-up code on `origin/main` (`WRATTACH_START/END`, lines 41961–42150) and its two attach plans.
Code read from the `fable/units-switchover` worktree at `origin/main` 090073c. **Nothing written anywhere. No Firebase
reads were made for this document** — every count below is from the 10/24 audit and gets re-read, read-only, when each
step's own plan is made.

## 0 · The shape every step takes (the Word Roots pattern)

Word Roots is the pattern because it is the only hook-up in the app that **attaches** instead of **enrolling**. The two
stock paths (`unitEnroll`, and `_ustApply`/`_ustWrite` for staged units) are not safe for a kid who already has cards:

- `_ustApply` mints a **fresh "placed" card** for every word up to "knows through" and new learning cards up to the
  intro cap — on day one, not as room opens.
- Both overwrite the deck's **`cat_modes`**, **`cat_intro_max`** and every card's **`definitions`** back (and
  `cat_gate`, `cat_hold`, `cat_instructions` for staged units). That is how Ellis's book unit rewrote 10 old backs (C4).
- Both match an existing card only by **exact** deck + prompt, so a spelling difference ("uni" vs "uni-", "noun" vs
  "Noun") makes a second card.

So each step below is a **🔗 Hook up <Kid>** button on that unit (Mom only), and it goes like this, in this order:

1. **Read-only snapshot.** One GET each of `mastery/<kid>`, `<kid>_custom_items`, `<kid>_settings`, `<kid>_bank_order`,
   `unitStudies/<unit>`, and that kid's `curriculum/subjects` + `curriculum/done` when the unit is book-gated. Saved as
   `test_fixtures/<unit>_<kid>_<date>.json` (you decide per step whether that file is pushed — the repo is public).
2. **The plan on paper first**: `PLAN_attach_<unit>_<kid>_<date>.md`, made from the snapshot — what the kid will notice,
   every write path with its value, counts, what is not touched, refusals. You read it before any code is written for
   that step.
3. **One branch per step** off `origin/main` (`fable/attach-<unit>-<kid>`), with a `test_attach_<unit>_<kid>.js` that
   replays the snapshot and asserts: the kid's existing cards are byte-identical after; only the listed paths are written;
   one root-level multi-path `update`; dry run, non-Mom, "data changed", unit-missing and already-hooked refusals all
   write nothing. Opened as a PR. I never merge or push `main`.
4. **Your taps, in this order:** open the app with `?dryrun=1` → Units → the unit → 🔗 Hook up → the plan shows on
   screen → ✓ Yes writes nothing (it says so). Then the same without `dryrun`: Yes rebuilds the plan from live data,
   refuses if anything changed since the plan was shown, otherwise one targeted `update`.
5. **Read-back.** A GET of every touched path, compared to the plan. For a kid whose notebook reads cards (Julian), the
   next week's notebook is built into an iframe **before and after** and every word compared — never printed (a print
   saves the place even in test mode, contract point 13). Drill replay before/after: same cards due, same progress.

**What a hook-up writes, and only this** (the engine's defaults — a step can add to them only where your decision says):

| Path | Rule |
|---|---|
| `unitStudies/<unit>/enrolled/<kid>` | `true` |
| `unitStudies/<unit>/kidStage/<kid>` | `{stage, subject?, via:"attach", ts}` — staged units only |
| `mastery/<kid>_custom_items/<next>` | **append-only**, one `{cat, name, ch?}` per unit word the kid's list does not already have (by deck + exact name); no `def` unless the deck is bank-held with backs on the bank (AAS Words) |
| `mastery/<kid>_settings/cat_gate/<deck>` | only for a book-gated deck, `{subject}` |
| `mastery/<kid>/<i>/<field>` | **by index path, one field, never the array** — and only where a step below names the card and the field |

**Never:** a whole-node `set`, a re-sort or delete in `mastery/<kid>`, a rename of any deck key or unit id, `cat_modes`,
`cat_intro_max`, `definitions` of a word that already has one, anything under `notebookSettings/*`, any card id.

**The engine** (`UNITATTACH_START/END`) is `wrPlanAttach`/`wrApplyAttach` made general: plan from in-memory data, match on
(kid, unit, deck key, exact prompt), the refusal list, the rebuild-and-compare on Yes, the `_dryRun()` gate, one
`update`, the same local apply. Each step adds a small data table for its (unit, kid): which decks, which cards to
re-deck, which built-in names to retire for that kid, which words come in graduated. It lands **with step 1** so it has
a button that can be tapped and tested; an engine with no button cannot be verified in the app. Once a kid is hooked up
the stock enroll for that kid on that unit is locked (like `_wrEnrollLocked`, but per kid, so another family's stock
enroll keeps working).

**The 15-point contract holds on every step** (notebook audit §5): dense array, append only, same deck names, same card
text, same ids, same status/tier meaning; same unit ids; `enrolled` and `nbInsert` unchanged; main deck first;
no `notebookSettings` writes; no test prints.

---

## 1 · The order

Easiest and most reversible first; each step adds one new idea the step before did not have. Lincoln's AAS is last on
purpose: it is the only step that both appends cards and moves cards between decks, and it needs one piece of code
(GRADKEEP) that is designed but not built.

| # | Kid | Unit | New idea this step adds | Writes to his/her cards? | Branch |
|---|---|---|---|---|---|
| 1 | Lucy | Math Fluency Path · stage 6 | the engine; enrolled + kidStage; bank fill | no | `fable/attach-mathpath-lucy` |
| 2 | Ellis | Math Fluency Path · stage 7 | keeps his own `bank_order` | no | `fable/attach-mathpath-ellis` |
| 3 | Lincoln | Math Fluency Path · stage 8 | unmatched cards stay put (14 extras) | no | `fable/attach-mathpath-lincoln` |
| 4 | Julian | Letters Path · stage 1 | notebook before/after build is the proof | no | `fable/attach-letters-julian` |
| 5 | Julian | Shapes Path · stage 2 | — | no | `fable/attach-shapes-julian` |
| 6 | Julian | Math Fluency Path · stage 2 (Numbers + Counting) | two decks in one unit | no | `fable/attach-mathpath-julian` |
| 7 | Ellis | RS4K Book 4 ← old Science/Geography/Vocabulary (10 cards) | **re-deck** a card (`subject` by index path) + retire names from his old lists | yes: `subject` on 10 cards | `fable/fold-rs4k4-ellis` |
| 8 | Ellis | FLL 4 ← old Grammar (7 cards) | re-deck + **case fix** (`noun` → `Noun`) | yes: `subject` + `prompt` on 7 cards | `fable/fold-fll4-ellis` |
| 9 | (unit) | Language Arts ← Irregulars (15 + 25) | append cards to a **unit record**; Ellis attaches by himself | no | `fable/la-irregulars` |
| 10 | (unit) | LOE phonogram master list — new unit record | a new unit (like Word Roots step 1) | no | `fable/loe-phonograms-unit` |
| 11 | Ellis | LOE Phonograms | parked cards stay parked (43) | no | `fable/attach-loe-ellis` |
| 12 | Lincoln | LOE Phonograms | — (44 parked) | no | `fable/attach-loe-lincoln` |
| 13 | Lincoln | Spelling Rules → AAS wording on 5 backs | **no code** — your 5 edits in 📖 Flip Definitions from a list I give you | no (you edit `definitions`) | — |
| 14 | — | GRADKEEP (a miss brings back THAT card; ✓ never moves a card down) | code only, from `DESIGN_aas_lesson_spelling_test` §3.4 | no | `fable/gradkeep` |
| 15 | Lincoln | All About Spelling | **append graduated cards** (268) + re-deck 7 Spelling cards + held bank | yes: `subject` on 7 cards; 268 appended | `fable/attach-aas-lincoln` |
| 16 | Lincoln | Language Arts Irregulars · by check-up | placement check-up: right → graduated, miss → learning | 40 appended, after the check-up | `fable/attach-la-irregulars-lincoln` |

After 16, the **Our words** PRs (design only today, 6 PRs) adopt what the steps above deliberately left alone: Lincoln's 54
AAS dictation words (already cards — records only), his 14 math extras (need your Singapore-lesson answers), Ellis's 9
waiting roots. None of steps 1–16 waits on Our words.

---

## 2 · Each step, what it changes

Counts are from the 10/24 audit; each step's own plan re-reads them.

### Step 1 — Lucy · Math Fluency Path, stage 6 (+ the engine)
- **Matches:** her 13 Math Facts cards = stage-6 cards, same answers; all 49 of her code words are stage-6 words.
- **Writes:** `enrolled/lucy`, `kidStage/lucy {stage:6}`. Bank: stage 6 has 200 words, she has 49 → **151 bank entries**
  appended to `lucy_custom_items` (`{cat:"Math Facts", name}`), in the unit's order after her own 49. No gate (her Dimensions
  1A has no book map today; the `abeka_arith_2` map is DeWalt's).
- **Not touched:** her cards, `cat_modes` (her Math Facts stays a flash deck — the stock enroll would have made it "quiz"),
  `cat_intro_max`, definitions (`MAST_MATH_ANS` already answers them).
- **She will notice:** nothing on day one. As her current facts graduate and room opens, new + − facts beyond families
  2–7 start, in the path's order.
- **Your call in this step:** bring all 151 remaining stage-6 words into her list now (my recommendation — that is what
  "on the path" means), or only enroll and leave her list at 49.
- **Proof:** fixture replay; her notebook reads no drill cards, so no notebook diff is needed; `?dryrun=1` tap.

### Step 2 — Ellis · Math Fluency Path, stage 7
- **Matches:** 13 cards; all 47 words (39 code + 8 saved 3s/4s) are stage-7 words, same answers.
- **Writes:** `enrolled/ellis`, `kidStage/ellis {stage:7}`; **266 bank entries** (313 − 47) appended, after his own
  order — `ellis_bank_order/Math Facts` (starts at the 6s) is **kept, not rewritten**; new names go after it.
- **Not touched:** cards, `cat_modes`, `cat_intro_max`, his bank order.
- **He will notice:** nothing until room opens; then × ÷ facts he has not had yet, 0s → 12s order after his own.
- **Your call:** same as step 1 (fill the rest of stage 7 now, or enroll only).

### Step 3 — Lincoln · Math Fluency Path, stage 8
- **Matches:** 4 cards (1 learning, 3 on the ladder); 21 of his 35 code words are stage-8 words.
- **Stays as is, on purpose (your §10):** the **14 extras** (9 percent-of, 5 order-of-operations) — not unit words, so
  they are not matched; they keep living in his Math Facts deck/list until Our words takes them (needs your answer on which
  Singapore lesson opens each group). The **2 backs that differ** ("0.333… (3 repeating)" vs "0.333…") keep his wording:
  no `definitions` write.
- **Writes:** `enrolled/lincoln`, `kidStage/lincoln {stage:8}`; **190 bank entries** (211 − 21) appended.
- **He will notice:** fractions/decimals/powers facts begin as room opens in Daily Study / the Mix.
- **Your call:** fill stage 8 now or enroll only; and whether the 14 extras should be held back from auto-pull until Our
  words (they can be today; the design's PR 2 is what would hold them).

### Step 4 — Julian · Letters Path, stage 1
- **Matches:** 16 Letters cards (A–P, array positions 0…103) = the unit's capital letters; his code list 26 = unit 26.
- **Writes:** `enrolled/julian`, `kidStage/julian {stage:1}`. **Zero bank writes, zero card writes.**
- **Contract check, by name:** deck key stays `Letters`; `mastery/julian` untouched, so `letterCursor {week 27, idx 1}`
  keeps meaning the same card; `nbInsert:false` on `letters_path` is not written (point 8); "Letter of the Day" reads the
  decks, not the unit.
- **Proof:** week-29 notebook built in an iframe before and after → expected both times `D🔁 E🔁 J K🔁 L🔁` (the audit's
  expected print), every word equal; no print.
- **Later (not this step):** stage 2 Lowercase and 3 Letter Sounds are new decks for him with no cards, so the stock
  "move up" is acceptable there — I will still show you what it writes first.

### Step 5 — Julian · Shapes Path, stage 2
- **Matches:** 15 Shapes cards; 8 code + 18 saved = all 26 unit shapes (his live cards reach stage 2; solids wait in the bank).
- **Writes:** `enrolled/julian`, `kidStage/julian {stage:2}`. Zero bank, zero card writes.
- **Contract:** deck key `Shapes`, array order unchanged → the Shape-of-the-day rotation `((wk−1)×5) % n` lands on the same shape.
- **Your call:** stage 2 ("more flat") or 3 ("solids", already in his bank) as his marker — I recommend 2.

### Step 6 — Julian · Math Fluency Path, stage 2 (Numbers + Counting)
- **Matches:** Numbers 17 cards (1–14 learned, 15 16 17 learning) = stages 1–2 (1–10, 11–20); code 20 = unit 20.
  Counting 10 cards = unit Counting stage 1 (unit has 28).
- **Writes:** `enrolled/julian`, `kidStage/julian {stage:2}`; **18 Counting bank entries** (28 − 10) — only if you say so.
- **Contract:** deck key `Numbers`, numeric prompts, `status` untouched → the numbers front and `numberCursor {from 14}`
  read the same cards. Counting is not on his notebook.
- **Your call:** bring the other 18 counting cards into his list now, or leave Counting at his 10.
- **Proof:** same iframe before/after build as step 4 (numbers expected `12🔁 23–26`).

### Step 7 — Ellis · fold 10 old cards into RS4K Book 4 (your §12)
- **Cards:** Science igneous, sedimentary, metamorphic rock, ecosystem, food chain, producer, decomposer (7); Geography
  atmosphere, peak (2); Vocabulary climate (1).
- **Writes:** `mastery/ellis/<i>/subject` = `"Real Science-4-Kids"` on those 10 (one field each, by index; id, tier, dots,
  history untouched). The 2 saved Geography bank entries for atmosphere/peak → `null` by index (they are now book
  words). **Code:** a per-kid retire list (the `WR_RETIRE_BUILTIN` idea) that drops those 8 code-list names from his
  Science and Vocabulary lists — without it, the auto-pull (`mastBankEligible` minus "names already a card in this
  deck", line 55218) would **re-mint** igneous etc. as new Science cards the next time Science has room.
- **Backs:** already the book's text in `definitions` (C4); nothing to write.
- **He will notice:** these 10 move from Mom's drill into his 📚 Science session (it owns the RS4K deck) and appear on
  his RS4K notebook insert as learned. The book's chapter gate only affects bank words, not these live cards.
- **Your call:** the **11 Science and 10 Grammar bank words** that are also book words but are not cards yet — retire
  them from the old lists so they come in through the book (chapter-gated), or leave them to start twice. I recommend retire.

### Step 8 — Ellis · fold 7 Grammar cards into FLL 4 (your §12)
- **Cards:** noun, verb, adjective, adverb, pronoun, preposition, conjunction.
- **Writes:** `subject` = `"First Language Lessons 4"` **and** `prompt` = the capitalised FLL name (`Noun`…) on each of
  the 7, by index — so the card *is* the unit's card and FLL 4 never makes a second "Noun". Code: retire the 7 names from his
  Grammar code list for him.
- **Backs:** `definitions` is keyed by prompt, so the card now shows the FLL wording already written at his 9/19 enroll
  (book wins — your §12). The old `definitions/noun` entries are left alone (nothing else reads them; removing is optional).
- **He will notice:** FLL 4 goes from 0 cards to 7 on-ladder cards (the "stuck deck" from AUDIT_mastery_flow §4 then has
  cards; GATESTART starts its first learning cards on the next drill save); the FLL notebook insert shows the 7 as learned.
- **Contract note:** card text changes on 7 cards — allowed here because nothing of Ellis's reads his cards by text
  (his notebook pages read the banks, not drill cards); it would **not** be allowed for Julian.

### Step 9 — Language Arts unit ← Irregulars (your §9)
- `language_arts` is a **database record only** (not a code starter; `LA_UNIT_ID` at line 70224). Adding the words is a
  unit-record write in Howe's DB, by a Mom button on the unit ("＋ Add Irregulars"), create-only per card index.
- **Writes:** 15 cards appended to the `Plural Nouns` deck's cards, 25 to `Verb Tenses` (names spelled **exactly as
  Ellis's saved bank entries**, `family:"Irregulars"`, `order` after the existing). **No `stages` field** — adding
  `stages` would flip LA to a staged unit and lock plain enroll (`_unitStagedEnrollPending`); a `family` tag gives you the
  "Irregulars" grouping without that.
- **Ellis:** nothing to write — his 40 are already cards/bank entries in those two decks with those names; the moment
  the unit has them, they are unit cards.
- **Lincoln:** nothing yet (step 16).
- **Other families:** Howe-only until the record is copied to DeWalt/Burris — a separate ask, not this step.

### Step 10 — the LOE phonogram master list (your §8)
- There is no LOE unit yet. The boys' Phonograms decks need a home before they can attach, so this step is a starter
  record like Word Roots step 1: `unitStudies/loe_foundations` (id to confirm — it should be the id your LOE A–D build
  from the photos will keep) with one **Phonograms** deck: the LOE list the app already carries for the sprint ladder
  (`SPRINT_LOE_B`) plus the boys' 59 names; LOE wording on the backs with one "In AAS: …" line where the marks differ
  (9); the 4 AAS-only sounds (o /ŭ/, ie /ī/, ou /ŭ/, or=/er/ after w) as extra steps on the existing card; either
  notation counts right. Stock enroll blocked for this unit (as Word Roots). "＋ Add to our family" is your tap.
- **Your call:** the unit id and name now (so your photo build lands in the same record), and whether lessons (A–D)
  come later from the photos — I assume yes.

### Step 11 — Ellis · LOE Phonograms
- **Matches:** all 59 cards by exact name (12 learning, 4 on the ladder, **43 parked stay parked**); his backs already
  carry LOE wording → no `definitions` writes.
- **Writes:** `enrolled/ellis`, `kidStage/ellis`; bank entries only for LOE phonograms he has no card for (about 15 — count
  from the snapshot). No gate until the lessons exist.
- **AAS pointer:** his AAS Level 1 subject keeps pointing at these same cards; no AAS Phonograms deck for him, ever.

### Step 12 — Lincoln · LOE Phonograms
- Same as step 11: 56 cards (3 learning, 9 ladder, 44 parked), 12 LOE-only already his; backs kept; bank only for missing names.

### Step 13 — Lincoln · Spelling Rules backs (your §11) — no code
- The 5 rules worded differently from the AAS book (Never-Ending, Add ES, Long Vowel, Floss, Add S): I give you the
  AAS wording side by side; you retype them in 📖 Flip Definitions. That is a `definitions/<rule>` edit by you in the app,
  which is the rule for data changes. The 9 cards then attach by exact name in step 15.

### Step 14 — GRADKEEP (code only; gate for step 15)
- From `DESIGN_aas_lesson_spelling_test_2026-10-24.md` §3.4: a ✓ never moves a card down; on a graduated card 〰 → monthly
  and ✗ → learning **on the same card** with a comeback mark; the before-state saved so a re-grade stays right; check-ups
  follow the same rule. The design says the graduated import must wait for it. Nothing of it exists on `main` today
  (`SPELLTEST` and the "✓ goes to" picker do).

### Step 15 — Lincoln · All About Spelling (your §7) — last, biggest
- **Attaches (no card writes):** his AAS Words cards that are AAS words through L2-19 (50–56; the snapshot decides),
  all 9 Spelling Rules cards.
- **Re-decks 7 cards, no merge, no delete:** keep, three, been, whale, while, of, with have **no** AAS Words card today,
  so there is nothing to merge into — `mastery/lincoln/<i>/subject` = `"AAS Words"` makes each existing card the AAS card
  with its 🚩 / Word Workout / history intact. Their 7 saved `Spelling` bank entries → `null` by index. began, swings,
  fifteen stay in Spelling. (`pwLookup` already prefers AAS Words, so Problem Words keeps finding them.)
- **Appends 268 graduated cards** (AAS words through L2-19 with no card, per your "he took the L2-19 test"):
  `{id:"lin_aas_<slug>", subject:"AAS Words", prompt, status:"active", tier:"graduated", placed:true, tally_dots:5,
  imported:{src:"aas-grad", lesson}}`, appended at the end of the array, no `next_due`. These are the one place a step
  makes cards — by your decision, for words with no card, so a check-up can draw on them and a miss brings back that card.
- **Bank:** AAS Words L2-20 onward (through Level 4, the unit's last filled level) as **held** entries with `ch` =
  stage×100+lesson and the back riding on the entry (the unit's `defsOnBank`/`bankOnly` rules) — they wait for the
  lesson test / check-up / problem word, never auto-pull. Spelling Rules' other 12 and Sound Spellings' 13 as gated bank
  entries (no `def`; definitions only where he has none).
- **Settings:** `cat_gate` = `{subject: aas}` on AAS Words, Spelling Rules, Sound Spellings; `cat_hold/AAS Words = true`;
  `kidStage/lincoln {stage:2, subject, testRight:"graduated"}` (the "✓ → graduated now" setting you asked for, with the
  "monthly first" switch later). **Not** the Phonograms deck — that points at LOE (steps 10–12). `cat_modes`,
  `cat_intro_max` untouched; `_lincolnAASMigrated` left alone.
- **Left alone, on purpose:** his **54 dictation/phrase cards** (not unit words — listed in the plan as "his words",
  for Our words PR 6); the 4 SpellingYouSee cards that happen to be AAS words.
- **He will notice:** possibly a **Spelling page in his notebook** — the shared Spelling page turns on when `all_about_spelling`
  has a `kidStage` for him (contract point 11). The before/after notebook build will show whether it appears; if it does,
  that is your choice to keep (`nbWords`/`nbPractice` on the kidStage) or switch off before the real Yes.
- **Proof:** fixture replay (every existing card byte-identical, the 7 re-decked differ in `subject` only, 268 appended
  with the exact shape); before/after notebook build; drill replay (same cards due in Mix / Mom / Daily Study).

### Step 16 — Lincoln · Language Arts Irregulars by check-up (your §9)
- **Writes:** 40 bank entries for him (`Plural Nouns` 15, `Verb Tenses` 25), then a **placement check-up** on those 40:
  right → appended graduated card (same shape as step 15's), miss → learning card. Needs the check-up to graduate on ✓
  (GRADKEEP, step 14, which is why this sits after it).
- **Your call:** run the check-up the same day, or let the 40 sit in his bank until you have time.

---

## 3 · Not moved, and why

- **27 old-way decks with no unit** (MAP §1 row 4) — keep working as they are: Lincoln German, SpellingYouSee, Grammar,
  Vocabulary, Science, U.S. History, World Geography; Ellis Geography, State Capitals, Science (the non-book words),
  Vocabulary, Grammar (the rest), Measurements, Mathematical Reasoning, Reading Detective, empty Spelling; Lucy Science,
  Vocabulary; Julian Animals, Colors, Dinosaurs, Food. Each waits for its unit (catalog plan).
- **Lucy's Sight Words, Spelling, Logic of English** — your direction is the LOE unit built from the photographed lists;
  until that unit exists they stay as is (handoff: "keep running for now"). Her "and" keeps both cards (§11).
- **Lincoln's 10 lab instruments** — both cards stay (§11). Nothing to do.
- **Lucy on AAS** — no (common words, not the course).
- **Greek & Latin Roots** — done (Word Roots PRs 128/130/131); the 9 + 1 waiting roots wait for Our words.
- **DeWalt / Burris** — untouched by every step; the engine code ships to them with the next sync but renders no button
  for their kids.

## 4 · What I need from you before step 1

1. A yes to the order above, or the changes you want.
2. The one answer step 1 asks: fill the rest of Lucy's stage 6 (151 words) now, or enroll only.
3. Whether a snapshot fixture (one kid's cards, math facts only for step 1) may be pushed to the public repo, or should
   stay local and the test use a made-up kid instead (the Lincoln Word Roots test already does both).
4. For steps 2–3, 6, 7, 10, 15 the questions listed under each step — one at a time, as each step comes up.

## 5 · What the Sunday proof is, step by step (MAP §5)

Per step: snapshot → plan → test replays the snapshot → PR → your `?dryrun=1` tap shows the same plan on screen → real
Yes → read-back of every touched path → for Julian (and Lincoln at step 15) the next-week notebook built before and after
with every word compared, never printed → drill replay before/after. If one word or one card differs, stop before the
next step.
