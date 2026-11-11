# PLAN — Lucy's notebook, enriched: the one between Julian's and Ellis's (2026-11-10)

Her ask (2026-11-10): "deep dive and look at julian and ellis's notebooks. and i want something in between these two!" —
then: "this notebook would be for lucy and id like to keep her activity pages but really feel her notebook is lacking a bit."

Design only. No `index.html` / `notebooks.js` change rides with this file. Everything was read from `origin/main` 65b1af3
(`notebooks.js` 5,912 lines; the ctx builder `haNbContext` at `index.html:35523`). It builds on the October plan
(`PLAN_lucy_notebook_2026-10-14.md`, on her Mac, not in git): its step 1 — the phonogram card following LOE Foundations B —
shipped as `LU_PHONO` (commit 5fd435e); its steps 2–6 were never built. This doc is the next version of that plan, after
seeing all three notebooks side by side.

**What was measured** — all three notebooks rendered from `notebooks.js` with a neutral stub week (Nov 9–13, week 12, no
real family data: 5 school days, 5–7 cards a day, an LOE link at lessons 10/12/20/44, one unit insert) into an iframe
harness; every `.page` checked for overflow and for any `overflow:hidden` child whose content is taller than its box:

| notebook | student pages | parent pages | clipped |
|---|---|---|---|
| Julian (Pre-K, dinosaurs) — 3 extra pages on, 1 unit insert | 10 | 1 | none |
| **Lucy (1st, unicorns) — 3 extra pages on, no uploads, LOE link on** | **15** | **1** | none |
| Ellis (4th, robots) — 4 enrichment pages on, 1 unit insert, Spelling page | 18 | 2 | none |

Every page is 816×1056 px (8.5×11 in). One cosmetic thing seen on the way, not fixed: the 📝 Spelling page header prints
**"Week week12"** (`spellNbPages` prints `ctx.weekNum` raw; the app passes the `"week12"` string). Every kid with the page on.

---

## 1. Julian's notebook, page by page (Pre-K, age 4) — the floor

`generateJulian` = `generatePreK(ctx, JU_THEME, JU_LEVEL, "julian")` (PREKTHEME block, `notebooks.js:1499`): one daily layout
driven by five Mastery decks (Letters · Numbers · Shapes · Colors · Animals), rotated week to week with review folding.

| # | page | what it is | ctx data | skill |
|---|---|---|---|---|
| 1 | **Cover** (`juPageCover`) | "Hi, Julian!", *This week I am learning…* (letters · numbers · shapes · colors), animal friends, a big draw box | `masteryItems` → `pkCurriculum`; `letterCursor`/`numberCursor`; `juPicks` | orientation, Mom reads it with him |
| 2 | **ABC Sing-Along** (extra `abc`) | the 26 letters as cards, ⭐ on this week's | `extraPages.abc` | alphabet, recognition |
| 3 | **My Calendar** (extra `daysSeasons`) | days of the week, four seasons, weather words | static | calendar vocabulary |
| 4 | **This Month** (extra `thisMonth`) | month grid: find today, count up to it, X it | `weekData.dates` | numbers 1–31 |
| 5–9 | **Daily Page** ×5 (`juPageDaily`) | Morning bookend → day chips + date tile → weather / feelings → 5 to-do chips → **Letter of the Day** (capital + 4 dotted traces, HWT stroke words, a "now you try" line) · **Trace My Name** · **Number of the Day** (numeral, ten-frame of today's animal, tens-and-ones past 20, 3 traces) · **Shape & Color** · **Trace the path** → Closing: 4 faces, "look what I learned" chips, draw the favorite part | `juWeekPicks` per day; `reviewCap`; `countEmoji`; `letterSounds` | the whole Pre-K set, side by side with Mom |
| 10 | **Unit Study insert** (shared) | the unit's cards in the dinosaur palette | `units[]` | unit words |
| P1 | **Grown-Up Guide** (`juPageParent`) | targets per deck, 🔁 review focus, how to help each card | same `cur` + `teachNotes` | Mom's script |

He produces: traced strokes, a count, a circled face, a drawing. Nothing on the page needs reading.

## 2. Ellis's notebook, page by page (4th grade, age 9–10) — the ceiling

`generateEllis` (`notebooks.js:4430`): test prep plus a word a day; the daily boxes come from four Mom banks
(`notebookSettings/ellis/{wordBank,cogatBank,convBank,quantBank}`) and fall back to built-in Transformers banks.

| # | page | what it is | ctx data | skill |
|---|---|---|---|---|
| 1 | **Mission Briefing** (`ellWeeklyPage`) | last week's stats, a hard-coded Iowa score table, this week's schedule grid, pace bars, notes lines | `prevSummary`, `weekData.tasks`, `pace` | seeing the week |
| 2, 10, 12, 14, 16 | **Brain Break #1–#5** | word search, scrambles, a riddle, would-you-rather + *write why*, doodle | rotation | puzzles, a line of writing |
| 3–6 | **All About Me · Money & Life · Memory & Civics · Notes** (extras) | safety page from `personal`; coins and change; pledge/preamble; lined page | `personal`, static | memory work, money |
| 7, 8 | **Unit insert · Spelling** (shared) | unit cards; AAS words ×3 lines, review chips, practice words | `units`, `spelling` | spelling |
| 9, 11, 13, 15, 17 | **Daily Page** ×5 (`ellDailyPage`) | Boot Up bookend → 5 faces → **Iowa Reading** (~90-word passage + 4-choice inference question, or a CogAT verbal item) → **Language Fix-It** (a wrong sentence, "which version fixes ALL the errors?") → **Iowa Math** word problem → **Word of the Day** (definition, synonyms, example, *write your own sentence*) → Power Down: power level, *how hard was each mission* (one row per card), debrief (2 lines), gratitude ×3 | the four banks + cursors, `weekData.tasks` | reading alone, conventions, reasoning, vocabulary |
| – | **Daily Grams** behind each day | when on | `dailyGrams` | grammar |
| 18 | **Creative Launch** | story prompt + 22 lines, debrief boxes, design/code-name/favorite | `weekNum` | a page of writing |
| P1–P2 | **Answer Keys · Full Keys** | every item with answer and rule, Iowa focus, running record, carry-forward | | |

He produces daily: 3 multiple-choice picks, a sentence of his own, 2 reflection lines, 3 gratitude lines; Friday a story.
Reading is silent and alone. Name, grade, theme and the Iowa table are hard-coded ("Howe Academy · 4th Grade · Samuel Ellis
Howe"); this notebook is not family-neutral either.

## 3. Lucy's notebook today, page by page (1st grade)

`generateLucy` (`notebooks.js:5390`). Ported from `lucy_notebook_generator.py`; unicorn look (`LUCY_CSS`, Fredoka + Fraunces),
No Tears tracing, the shared calendar helpers. Page order on a 5-day week:

| # | page | what it is | ctx data | skill | kept? |
|---|---|---|---|---|---|
| 1 | **Weekly Review** (`luPageWeeklyReview`) | last week's stats (days, apps, completion, carried, highlight pills), *This week we're working on* (two focus cards), schedule grid (her cards by day, screen vs paper), pace bars, notes lines | `prevStats` (live), `weekData.tasks`, `pace` (live) — **but the two focus cards are the static `LUCY_DATA.focus`** ("sh · ch · th · wh digraphs · Fast Phonics Peak 9 → 10", "Subtracting within 10 · Brand new — daily practice") | seeing the week | kept; focus cards need live data (§5) |
| 2 | **Months of the Year** (extra `months`) | 12 month cards in 4 season bands, ⭐ this month, "circle your birthday month" | `dates` | months, seasons | kept as-is |
| 3 | **This Month** (extra `thisMonth`) | real month grid with week rows, days-in-month, "the 1st is a ___", "today is the 3rd Tuesday", count Saturdays, school days left — fill-in blanks, no answers printed | `dates`, year | calendar math | kept as-is |
| 4 | **All About Me** (extra `allAboutMe`) | name, address, Mom/Dad phones — model line + trace + write | `personal` | safety memory work | kept as-is |
| – | **Unit insert · Spelling** (shared) | as every kid; Spelling prints only for an AAS-enrolled kid (Lucy isn't, so today: nothing) | `units`, `spelling` | | kept |
| 5, 7, 9, 11, 13 | **Daily Page** ×5 (`luPageDaily`) | see below | | | kept, enriched |
| 6 | **Brain Break 1 — back of Monday** (`luPageBb1`) | dot-to-dot upload (else a 1→12 star placeholder) + "draw your favorite animal" | `dotdot` (`nbActCurUrl`) | fine motor, counting | **kept, activity unchanged** |
| 8 | **Brain Break 2 — back of Tuesday** (`luPageBb2Coloring`) | coloring upload (unicorn / fairy / mermaid rotating by week; placeholder text if none) + name it · magic power · thought bubble · favorite color · star rating | `coloring`, `weekNum` | coloring, 2 short writes | **kept, activity unchanged** |
| 10 | **Brain Break 3 — back of Wednesday** (`luPageBb3`) | symmetry upload (else mirror-draw box) + four "what comes next" shape patterns (answers printed small on the page) + patterns upload | `symmetry`, `pattern` | symmetry, patterns | **kept, activity unchanged** |
| 12 | **Brain Break 4 — back of Thursday** (`luPageBb4`) | maze upload (else placeholder) + "draw what's at the end" + "draw 3 things you'd bring" | `maze` | mazes, drawing | **kept, activity unchanged** |
| 14 | **Creative Page — back of Friday** (`luPageCreative`) | "You finished Week N!", a big free-draw box, family / favorite food / dream house boxes | `weekNum` | free drawing | **kept, activity unchanged** |
| 15 | **End of Week** (`luPageEndOfWeek`) | *How did I do this week* (every subject + Blending + Subtraction, Easy/Getting it/Need help, two-up past 8 rows), *Blends I practiced* (chips + "my favorite blend word"), **Subtraction answers — circle any that were tricky** (the week's 15 answers printed for self-check), draw the best thing, "my best moment" (write one sentence, 3 lines), "next week I want to work on", Mom's notes | `blends`, `subtraction`, `tasks` | self-assessment, one written sentence | kept; the answers block is a question (§6) |
| 16–19 | **Paper dolls** (when uploaded) | the doll, then this week's outfit, each on its own sheet with a blank back so they cut out clean | `dolls` | scissors | **kept, unchanged** |
| P1 | **Teaching Companion** (`luPageTeachingCompanion`) | subtraction answers by day, "watch for", app lessons this week, closing-page coaching, phonogram tips (per rung, new/review), quick wins, carry-forward | `blends`, `subtraction`, `tasks`, `teachNotes` | Mom's page | kept, grows with each slice |

**The daily page** (`luPageDaily`, see the screenshot in this session): Morning bookend → "pages today" strip → day chips,
**"Today is Monday — trace today's date"** (the date dotted in No Tears, 25px), "today is day __ of November · week __ · tomorrow
is __" → weather + 4 feelings → two columns: **Today's apps and work** (one pill per card, mostly empty space) beside the
**Phonogram of the day** card (`LU_PHONO`: `s + ee → see`, "says /ē/", "LOE B · Lesson 44", five words to say aloud, trace
the word then write it, a review row of the taught phonograms) → **Subtraction practice** (three facts within 10, a 0–10 number
line) → Closing bookend: *How did school feel* (4 faces), **How did I do?** (one row per card, three bubbles), *Something I
learned — write or draw one thing* (one line), *3 things I'm thankful for*.

**Data it consumes:** `weekData.tasks` (filtered `who==="lucy"` — the id is literal in `luTasksForDay`), `weekData.dates`,
`loe` (the LOE phonograms taught, from `loeTaught(kid)`), `pace`, `prevStats`, `personal`, the five activity URLs + `dolls`
(`nbActCurUrl`, Storage links), `units`, `spelling`, `extraPages`, `teachNotes`. **It does not read `masteryItems`,
`reviewCap`, `nbGrade`, `nbLevel`, `kidName` or any cursor** — none of her decks (Sight Words 12, Spelling 20, Math Facts,
Science, Vocabulary, Frogs, per the 10/14 live read) reach the page, and nothing carries week to week except the LOE lesson.

**Where it is hard-coded to Lucy** (so a later lift to another family is a separate step, as the October plan's step F): the
name "Lucy" in 20 places (headers, footers, "Amazing job, Lucy!", "not for Lucy", the Companion's pronouns), "1st Grade" in
9 header strings, `who==="lucy"` in `luTasksForDay`, the unicorn/fairy/mermaid category labels, and `LUCY_DATA` (static
blends, focus cards, pace fallback, badges). `nbGradeOf("lucy")` is **null** today (the Howe roster has no `notebook` record),
so the ctx does not even report her grade; the generator asserts it.

## 4. The gap — and where Lucy's is lacking, concretely

| | Julian's | **Lucy's today** | Ellis's |
|---|---|---|---|
| **Reading** | none; a grown-up reads | five words to say aloud, one phonogram | a 90-word passage + an inference question, alone |
| **Writing** | traces letters and his name | traces one word, writes it once; "write or draw one thing"; Friday: one sentence | a sentence of his own daily; Friday a page |
| **Words / spelling** | one capital a day | the phonogram's five words; **her Sight Words and Spelling decks never print** | 10-word AAS list, vocabulary word, fix the sentence |
| **Numbers** | one number a day 1–100, count it | **three subtraction facts within 10, every week, forever**; a 0–10 line | multi-step word problems, number reasoning |
| **Thinking / test prep** | — | — | three multiple-choice boxes a day |
| **Independence** | side by side, 10 min | front page with Mom, activity back alone | alone, answer key for Mom |
| **Calendar** | points at chips | traces the date, calendar math | assumed |
| **Review of missed items** | 🔁 folding from drills, `reviewCap` | **none** | bank cursors |
| **Pages / day** | 1 | 2 (daily + activity) | 2 (daily + brain break) |

In my judgment Lucy's notebook is lacking in five concrete ways:

1. **Nothing to read.** Between Julian's "a grown-up reads" and Ellis's passage there should be a few sentences she reads
   herself. Her page has five isolated words. A 1st grader at LOE lesson 44+ with 12 sight words can read a three-sentence
   decodable story built from exactly those pieces.
2. **Almost nothing to write.** One traced word, written once; the closing "write or draw one thing" line is a single line
   and the companion says "scribe for her". Ellis writes a sentence a day. The 1st-grade step is **copywork**: a sentence
   traced, then written alone — every day, not only Friday.
3. **Math is frozen and blind.** `luSubWeek` reshuffles subtraction within 10 forever; it does not know she was hooked to the
   Math Fluency Path on 10/25 (13 Math Facts cards, + and −, 3 learning at a time) or that she "has a hard time keeping
   track past 5" (her note 2026-10-19: counting beyond 5, ten frames, tally 5s). Julian's page already reads a deck and
   folds misses back in; hers reads nothing.
4. **Her word decks never print.** Sight Words 12 and Spelling 20 are drilled in the app and never appear on paper. Ellis
   gets a spelling page and a word a day; she gets neither (she isn't AAS-enrolled, so `spellNbPages` is empty for her).
5. **The weekly pages tell her last year's story.** The Weekly Review's two focus cards are static text ("Fast Phonics Peak
   9 → 10", "Brand new — daily practice"); the End of Week rates "Blending" and "Subtraction" as fixed rows. `ctx.pace` is
   live, the focus is not.

Not lacking, and kept exactly: the morning calendar block (it is the best K–1 calendar page of the three), the phonogram
card, the per-card "how did I do" table she rates every day (her 2026-08-30 call: every row prints), the five activity
backs, the creative page, the dolls, All About Me, the two calendar extras.

## 5. Proposal — Lucy's notebook, enriched (additive changes to `generateLucy`)

Principles: every page she has today stays, in the same order, same count (15 + dolls); the **activity backs are unchanged**;
new work comes from **her data** (decks, LOE link, the Math Facts deck) through the same review-folding Julian's uses; nothing
printed that she must produce (answers only on the Companion); each change is one `LU_*_START/END` block with a test that
proves the no-data output is byte-identical to today.

### 5a. Daily page (front) — three cards grow, the layout does not

| card | today | enriched | data |
|---|---|---|---|
| **Today's apps and work** (left column, mostly empty) | pills | pills shrink to one wrapped row of chips; underneath, **Sight Word of the Day**: the word big (Fraunces 28px), its sounds boxed, trace it ×2 (No Tears 26px), write it on one line, "find it in today's story ✏️" | Mastery **Sight Words** deck (status introduction/parked first, then review; `recentMiss`/`drop_count` → 🔁 as `juCurriculumFromMastery` flags letters), walked by a new **`wordCursor`** `{week, idx, adv}` at `notebookSettings/lucy/wordCursor` (same arithmetic as `juLetterStart`); no deck → the Dolch primer list |
| **Phonogram of the day** | as `LU_PHONO` | unchanged card; the review-row phonograms also feed the story | `loe` |
| **Math practice** (was *Subtraction practice*) | 3 subtraction facts within 10, 0–10 line | **3 facts from her Math Facts deck** (the ones she is learning, + and − mixed, a missed one back as 🔁), range = the biggest number in her learning cards → the number line runs to 10 or 20; **one ? puzzle** (`7 + ? = 10`, number bonds); a **count-it strip** under the line on Mon/Wed/Fri: a ten-frame to fill to a number past 5, "count by 5s" tally marks to circle (her 10/19 ask) | Mastery **Math Facts** deck; no deck → today's `luSubWeek` exactly |
| closing | unchanged | unchanged (faces, how-did-I-do table, write-or-draw, thankful) | |

Fit: the apps column is 229px tall beside the phonogram card and today holds 5–9 pills; chips in one row (~36px) leave ~190px
for the sight-word block (big word 34px, trace 30px, line 24px, caption 14px ≈ 110px) — measured in slice 1 before a PR,
like every daily-page change before it. The math card gains ~40px for the puzzle and strip, which comes out of the
closing block's `flex:3.2` only if measurement says so; otherwise the strip is Mon/Wed/Fri only (as proposed).

### 5b. The activity backs — a Practice strip on top, the activity kept whole

Each back page (dot-to-dot, coloring, symmetry/patterns, maze, creative) gets a **~150px "Practice" strip** between the
`bb-top` title and the activity, the activity below it unchanged (uploads use `object-fit:contain`, so the picture prints
whole, slightly smaller). This is the October plan's "Puzzle Lab strip, top third" — question 2 there, question 1 here.

| day | strip = **Read it** (left, 60%) | strip = **Think it** (right, 40%) |
|---|---|---|
| every day | a **three-sentence decodable story** in 15px type built from this week's phonograms and sight words ("Jen has a sheep. The sheep can see the tree. Jen and the sheep sit and eat."), then **copywork**: one sentence from it, dotted (28px), written on an HWT line | **one pictorial reasoning item** with three choices, the CogAT Level 7 formats in rotation: Mon picture analogy (emoji 2×2), Tue figure matrix (inline SVG: size / fill / rotation, one change), Wed number series (bead strings of CSS dots), Thu figure classification, Fri sentence completion (Mom reads the sentence from the Companion; the page shows three pictures). "Does yours go the SAME way?" style check line. |

Stories come from a **built-in bank keyed by phonogram** (3 per rung × the 20 rungs in `LU_PHONO`, our own text, kid-safe,
family-neutral; the sight word of the day is substituted in where the template has a slot) — no uploads, no typing. Figure
items are **generated** from a small shape grammar seeded by week and day (as `luSubWeek` seeds facts), so they never repeat.
The story question ("Who sat? ○ Jen ○ the tree ○ the sheep"), the figure answer and the Friday sentence go on the Companion.

### 5c. End of Week and Weekly Review — from live data

- Weekly Review **focus cards** become: this week's phonogram(s) with their lesson numbers, the math range and the three
  learning facts, this week's five sight words. `LUCY_DATA.focus` stays only as the no-data fallback.
- End of Week adds a **"Words I can read"** row of the five sight words (circle the ones you read alone) and a **"Puzzles I
  tried"** row; the **subtraction answers block** either stays as self-check or moves to the Companion (question 3).
- A **"My Words" page** (extra page `myWords`, default on): the week's sight words + any Spelling-deck words being learned,
  three lines each — printed through the shared `spellNbPages` by shaping a `spelling` object from her decks inside
  `generateLucy` when `ctx.spelling` is null. One page, reuses the fitted layout, and gives her what Ellis's Spelling page
  gives him. (Page count 15 → 16.)

### 5d. Name and grade from the data (family-neutral, byte-identical by default)

`luName = ctx.kidName || "Lucy"`, `luGrade = ctx.nbGrade || "1st Grade"`, `luWho = kidId` — the 20 + 9 + 1 literals read
those; with the Howe ctx as it is today (no `notebook` record, `kidName:"Lucy"`) the output does not change by a byte. Adding
`notebook:{gradeLabel:"1st"}` to her roster record is a later one-line data change she can make on the Family page. The
full lift to `generatePrimary(kid, ctx, theme)` for another family stays the October plan's step F, after this.

### ctx fields

Existing and already passed for every kid: `masteryItems` (+`recentMiss`), `reviewCap`, `loe`, `pace`, `prevStats`,
`weekData`, `kidName`, `nbGrade`, `units`, `spelling`, `extraPages`, `teachNotes`. **New:** `wordCursor` read from
`notebookSettings/lucy/wordCursor` and written back from `out.wordCursor` by the cursor-save code at `index.html:35613`
(its gate widened from `kid==="julian"||kid==="caleb"||out.prekTheme` to also accept `out.wordCursor`), targeted `set`,
`db&&!_dryRun()`. No other write. `EXTRA_PAGE_CATALOG.lucy` gains `myWords`.

## 6. Open questions for Adrienne (each with the default this plan assumes)

1. **Practice strip on the activity backs (picture prints a little smaller) — or a third page per day?** A third page breaks
   the "back of Monday" double-sided pairing and adds 5 sheets. — *Default:* the strip; measured so no upload is clipped.
2. **Math from her Math Facts deck (hooked to the Math Fluency Path on 10/25), or from a Dimensions 1A chapter map** (the
   October plan's step B)? — *Default:* the deck — it already carries what she is learning and what she missed; the
   number line follows the deck's range.
3. **The End of Week "Subtraction answers — circle any that were tricky" block:** keep the self-check on her page, or move
   the answers to the Companion (your tablet rule 11/3: "don't allow to change answer — leave it for Mom to talk about")?
   — *Default:* move them; the block becomes "circle the ones you found tricky" with the facts only.
4. **Sight words from her Sight Words + Spelling decks, or enrol her in All About Spelling and use the Spelling page as
   Ellis does?** — *Default:* her decks now (no new enrolment); the AAS page joins automatically if you enrol her later.
5. **Reasoning items: one picture item a day starting with slice 4, or hold until the spring-2027 ramp the October plan
   laid out?** — *Default:* one a day from slice 4, verbal/nonverbal heavy, quantitative Wednesday only (Math Reasoning B
   covers that side).
6. **The Friday sentence-completion item needs you to read a sentence aloud from the Companion — fine, or make Friday a
   second figure item so every back page works alone?** — *Default:* read-aloud Friday (it is the one subtest where
   listening is the skill), with the figure item as the no-Mom fallback in the code.

## 7. Build plan — slices, one branch each, every one additive to `generateLucy`

Every slice: a marked block (`LU_WORDS_START … LU_WORDS_END` etc.), its `test_lucy_<feature>.js` slicing the block out of
`notebooks.js` and running the generator in Node (`global.window={}; eval(src)`), a hash proving **Lucy's no-data output is
byte-identical** to today (as `test_lucy_phono.js` checked against HEAD), hashes for Julian/Caleb/shark/Lincoln/Ellis/starter
unchanged (the `test_prek_notebook_levels.js` pattern), no answer string in the student HTML, and the Playwright page-fit
measurement when installed (SKIPPED otherwise). Deploy = her tap; printing double-sided is unchanged.

| slice | branch | what ships | test |
|---|---|---|---|
| **1 LU_WORDS** | `claude/lucy-words` | Sight Word of the Day in the apps column from the Sight Words deck with 🔁 folding + `wordCursor`; the My Words page via `spellNbPages`; words on the Companion; `index.html` cursor save (2 lines). | `test_lucy_words.js` |
| **2 LU_MATH** | `claude/lucy-math` | facts from the Math Facts deck (+ and −, 🔁), range-driven number line (10 / 20), the ? puzzle, the count-it strip (ten frame, tally 5s); answers on the Companion; End of Week answers per question 3. | `test_lucy_math.js` |
| **3 LU_READ** | `claude/lucy-read` | the decodable story bank (60 stories keyed to `LU_PHONO` rungs, sight-word slot), the Practice strip on all five backs with Read it + copywork; story question on the Companion. | `test_lucy_read.js` |
| **4 LU_THINK** | `claude/lucy-think` | the Think it item: emoji picture analogies / classification bank, SVG figure generator, bead-string series, Friday read-aloud; answers + sentences on the Companion. | `test_lucy_think.js` |
| **5 LU_WEEKLY** | `claude/lucy-weekly` | Weekly Review focus cards from live data, End of Week words + puzzles rows, name/grade from ctx with today's strings as defaults. | `test_lucy_weekly.js` |

### Slice 1, spelled out (LU_WORDS)

`notebooks.js`, one block after `LU_PHONO_END`:

- `LU_DOLCH` — the Dolch pre-primer + primer list (92 words) as the no-deck fallback.
- `luWordsFromMastery(items)` — the Sight Words deck (`subject` "Sight Words"; also "Spelling" items when a switch asks)
  mapped onto the shape `juCurriculumFromMastery` builds for letters: `{list, flag, flagScore}` with the same
  `recentMiss*3 + drop_count*2` scoring. Call `juWeekPicks`'s letter path by passing `{letters:list, flag:{letters:…}}`
  — don't copy the fold logic.
- `luWordStart(cursor, wk, n)` = `juLetterStart` (call it). `luWordsWeek(ctx, dayCount)` → the five words + `_words`
  bookkeeping for `out.wordCursor = {week, idx, adv}`.
- `luWordCard(w, review)` — the card HTML in the apps column (chips row + word + trace ×2 + write line + "find it in
  today's story" caption only once slice 3 exists; until then "read it to a grown-up").
- `luSpellingFromDecks(ctx, words)` — a `{title:"My Words", sections:[{label:"This week's sight words", words}], practice:[…]}`
  object for `spellNbPages(…, UNIT_INSERT_THEMES.lucy)` when `ctx.spelling` is null and `xpOn(ctx,"myWords")`.
- `generateLucy`: build the words first (they are needed by the daily page, the My Words page, the Companion's new
  "Sight words this week" rows and later the story); return `wordCursor` on `out`. `EXTRA_PAGE_CATALOG.lucy` +
  `{key:"myWords", label:"My Words", emoji:"🔤"}`. `_internal` exports `luWordsWeek`, `luWordsFromMastery`, `LU_DOLCH`.

`index.html` (LU_WORDS_WIRE, two touches): `wordCursor:(((notebookSettings||{})[kid])||{}).wordCursor||null` in
`haNbContext`; the cursor-save lines at 35608–35641 gain `if(out&&out.wordCursor){ … db.ref("notebookSettings/"+kid+"/wordCursor").set(nc) }`
under the same change-check and `db&&!_dryRun()` gate.

`test_lucy_words.js` checks: (a) Lucy with no decks and no cursor → student and parent HTML byte-identical to origin/main
except the My Words page is absent (`extraPages.myWords.on=false` fixture) — and with it on, exactly one more page;
(b) a Sight Words deck of 12 with two `recentMiss` items → the five words are those two first (🔁 badge) then the next
three in deck order; week 13 continues from `wordCursor`; re-printing week 12 reuses it; `reviewCap:0` → no 🔁;
(c) every daily page carries its word in the dotted font and no answer-like text; (d) the My Words page lists the five
words with three lines each; (e) the Companion lists the five with "new / review"; (f) Julian/Caleb/shark/Ellis/Lincoln/
starter hashes unchanged; (g) the `index.html` wire: `wordCursor` read + save present, targeted path, gated, inside the
block; (h) Playwright fit of Mon–Fri with 5, 7 and 9 cards a day and a 10-letter word, or SKIPPED.

Done = a PR with the plain-language description (what prints, the one write: `notebookSettings/lucy/wordCursor`, tests
run), her eyes on a real print, nothing merged by the session.
