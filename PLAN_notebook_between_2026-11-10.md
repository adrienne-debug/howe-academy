# PLAN — a notebook *between* Julian's and Ellis's (2026-11-10)

Her ask (2026-11-10): "deep dive and look at julian and ellis's notebooks. and i want something in between these two!"

Design only. Nothing here is built; no `index.html` / `notebooks.js` change rides with this file. Everything below was read
from `origin/main` 65b1af3 (`notebooks.js` 5,912 lines; the ctx builder `haNbContext` at `index.html:35523`).

**What was measured** (both notebooks rendered from `notebooks.js` with a neutral stub week — Nov 9–13, week 12, no real
family data — into an iframe harness, every `.page` checked for overflow and for any `overflow:hidden` child whose content
is taller than its box):

| notebook | student pages | parent pages | clipped / overflowing pages |
|---|---|---|---|
| Julian (Pre-K, dinosaurs) — 3 extra pages on, 1 unit insert | 10 | 1 | none |
| Ellis (4th, robots) — 4 enrichment pages on, 1 unit insert, Spelling page | 18 | 2 | none |
| Lucy (1st, unicorns) — for reference, 3 extra pages on | 15 | 1 | none |
| Starter (`generateGeneric`, a kid with no notebook), 1 unit insert | 1 | 1 | none |

Every page is 816×1056 px (8.5×11 in). One cosmetic thing seen on the way (not fixed, not part of this): the 📝 Spelling page
header prints **"Week week12"** — `spellNbPages` prints `ctx.weekNum` raw and the app passes the `"week12"` string
(`weekNum:tgtWk`). Every kid with the Spelling page on gets it. A one-liner for a later PR.

---

## 1. Julian's notebook, page by page (Pre-K, age 4)

Built by `generateJulian` = `generatePreK(ctx, JU_THEME, JU_LEVEL, "julian")` (PREKTHEME block, `notebooks.js:1499`).
The engine is **one daily-page layout driven by five Mastery decks** (Letters · Numbers · Shapes · Colors · Animals). Every
"what prints today" decision is a rotation over those decks, with review folding for things he missed in drills.

| # | page | what it is | ctx data that drives it | skill | stage |
|---|---|---|---|---|---|
| 1 | **Cover** (`juPageCover`) | "Hi, Julian! 🦕", *This week I am learning…* four cards (letters · numbers · shapes · colors) + animal friends row + a big "Draw YOU as a dinosaur" box | `masteryItems` → `pkCurriculum` (the five decks); `numberCursor`/`letterCursor` (which five of each this week); `juPicks` (Mom's planner overrides); `weekNum`, `weekDates` | orientation; Mom reads it with him | Pre-K |
| 2 | **ABC Sing-Along** (`juPageAbc`, extra page `abc`, on by default) | the 26 letters as big cards, ⭐ on the ones in his deck | `extraPages.abc`, `masteryItems` Letters | letter recognition, alphabet song | Pre-K |
| 3 | **My Calendar** (`juPageDaysSeasons`, extra `daysSeasons`) | days of the week as cards + a caterpillar, four seasons, weather words | `extraPages.daysSeasons` only (static) | days/seasons/weather vocabulary | Pre-K |
| 4 | **This Month** (`juPageMonth`, extra `thisMonth`) | a real month grid, this week's row lit, "find today, count up to it, X it" | `weekData.dates`, year from `weekDates` | number hunt 1–31, calendar sense | Pre-K / K |
| 5–9 | **Daily Page** ×5 (`juPageDaily`) | one page per school day, see below | per-day pick from `juWeekPicks` | the whole Pre-K skill set | Pre-K |
| 10 | **Unit Study insert** (`unitInsertPages`, shared) | the unit's learning/learned/next cards in the dinosaur palette | `units[]` (from `haKidUnits` → `haBuildUnitInsight`) | unit vocabulary | any |
| – | **Spelling** (`spellNbPages`, shared) | prints only when Mom turned the AAS notebook page on | `spelling` (`nbSpellCtx`) | — | not used for a Pre-K kid |
| P1 | **Grown-Up Guide** (`juPageParent`) | this week's targets per deck, 🔁 review focus, how to help with each card, "no pressure on the pencil" | same `cur` + `teachNotes` | Mom's script | — |

**The daily page** (fixed layout, measured to the pixel — comments in `juPageDaily` record every fit fight):

- *Morning Notebook* bookend → "pages today" strip (`xpStrip`: which extra/unit pages are assigned to this day) → calendar
  card (day chips, yesterday/today/tomorrow, a date tile + month + season) → weather & "I feel" faces → five to-do chips.
- Left column: **Letter of the Day** — capital + lowercase shown, "K is for Kite 🪁", four dotted capitals to trace (`juTrace`,
  the No Tears font), HWT stroke words ("big line down · jump to the top…"), one *Now you try* line. **Trace My Name** —
  JULIAN in dotted capitals.
- Right column: **Number of the Day** — the numeral, a ten-frame of today's animal (`juCountVisual`: 1–10 one frame, 11–20 two
  frames, 21–100 tens-and-ones tiles with the hundred-chart row), three dotted copies to trace, a *Now you try* line.
  **Shape & Color** — dashed shape to trace, plain shape to color in today's color, a swatch.
- **Trace the path** — the animal walks a dotted line to the egg (pencil control).
- *Closing Notebook* bookend: four faces, "Look what I learned today" chips (letter · number · shape · color), high five, a
  "my favorite part" draw box.

Data in: `masteryItems` (with `recentMiss` from the drill history and `drop_count`/`tier` → `cur.flag` review flags),
`reviewCap` (0–5, default 2), `letterCursor` and `numberCursor` (so no letter or number repeats week to week — saved by the app
after each print at `notebookSettings/<kid>/letterCursor|numberCursor`), `juPicks` (Mom's planner), `countEmoji`,
`letterSounds`, `extraPages`, `units`, `weekData.dates` (a day without a date gets no page), `kidName`/`nbKidName`/`nbGrade`
(for a themed look), `notebookTheme` + `nbLevel` (PREKLEVEL switches: little letters, find it & match, teen numbers, shapes
path, skip no-school days).

What he is asked to *produce*: traced strokes, a count, a circled face, a drawing. Nothing on the page needs reading.

## 2. Ellis's notebook, page by page (4th grade, age 9–10)

Built by `generateEllis` (`notebooks.js:4430`). Built around **test prep + a word a day**, with the page content coming from
four Mom-maintained banks (`notebookSettings/ellis/{wordBank,cogatBank,convBank,quantBank}`) and falling back to built-in
Transformers-themed banks (`ELLIS_DATA`) when a bank is empty.

| # | page | what it is | ctx data | skill | stage |
|---|---|---|---|---|---|
| 1 | **Mission Briefing** (`ellWeeklyPage`) | last week's stats, an Iowa score table (hard-coded Aug 2026 results), this week's schedule grid, pace bars, "Command Notes" lines | `prevSummary`, `weekData.tasks` (his cards by day), `pace` | self-management, seeing the week | 3rd–5th |
| 2 | **Brain Break #1** (`ellBrainBreakPage`) | word search, scrambled words, a riddle (answer printed small), would-you-rather + write why, doodle zone | `weekNum` (rotation) | puzzles, a line of writing | 2nd–5th |
| 3 | **All About Me** (`enPageAllAboutMe`, extra `allAboutMe`) | safety page: name, address, phones (from the Notebook tab) with practice lines | `personal` | memorising personal info | K–5 |
| 4 | **Money & Life Skills** (`enPageMoneyLife`, extra) | coins, making change, a budget box | static | money math | 2nd–5th |
| 5 | **Memory & Civics** (`enPageMemoryCivics`, extra) | pledge/preamble lines, a quiz | static | memory work | 3rd–5th |
| 6 | **Notes** (`enPageNotes`, extra) | lined page | static | — | any |
| 7 | **Unit Study insert** (shared) | as Julian's, robot palette | `units[]` | | any |
| 8 | **Spelling** (`spellNbPages`, shared) | this week's AAS words with three lines each, review-day chips, practice words | `spelling` | spelling | 1st–5th |
| 9,11,13,15,17 | **Daily Page** ×5 (`ellDailyPage`) | see below | per-day bank items | reading, conventions, math reasoning, vocabulary | 4th |
| – | **Daily Grams** page behind each day (`dgStudentPage`) | only when `notebookSettings/ellis/dailyGrams.on` | `dailyGrams` | grammar | 3rd–5th |
| 10,12,14,16 | **Brain Break #2–#5** | between the days | rotation | | |
| 18 | **Creative Launch** (`ellCreativePage`) | a story prompt + 22 writing lines, "final debrief" boxes, design-your-transformer, code name, favorite | `weekNum` | sustained writing (a page) | 3rd–5th |
| P1 | **Answer Keys** (`ellParentPage1`) | per-day answers (word · CogAT/reading · conventions · number), full word-of-the-day reference | `dayAssignments` | | |
| P2 | **Full Keys** (`ellParentPage2`) | every item with all choices and the rule, Iowa focus areas, running record, carry-forward notes | | | |
| P3+ | **Daily Grams answer pages** | when on | `dailyGrams` | | |

**The daily page:** *Boot Up* bookend → "pages today" strip → Morning System Check (five faces) → **box 1** Iowa Reading
(a ~90-word passage + a 4-choice inference question; or a CogAT verbal item from the bank) → **box 2** Language Fix-It (a
wrong sentence, "which version fixes ALL the errors?", 4 choices; or a conventions item) → **box 3** Iowa Math problem
solving (word problem, 4–5 choices; or a number-reasoning item) → **box 4** Word of the Day (word, part of speech,
definition, synonyms, example, *write your own sentence*) → *Power Down* bookend: end-of-day power level, "how hard was
each mission" (one row per card that day), Mission Debrief (two lines), Gratitude Log (three lines).

Data in: `weekData.tasks` (filtered `who==="ellis"`), `pace`, `prevSummary`, the four banks (+ their cursors, written back as
`wordBankCursor` etc.), `dailyGrams`, `spelling`, `units`, `personal`, `extraPages`, `weekNotes`. Theme, name, grade and
the Iowa table are **hard-coded** ("Howe Academy · 4th Grade · Samuel Ellis Howe") — his notebook is not family-neutral.

What he is asked to produce: 3 multiple-choice picks, a sentence of his own, two reflection lines, three gratitude lines,
and (Friday) a page-long story. The reading is silent and alone.

## 3. The gap — concretely

| | Julian's assumes | Ellis's assumes |
|---|---|---|
| **Reading** | none — "a grown-up reads". The page is pictures + one word cue. | reads a 90-word passage silently and answers an inference question; reads instructions. |
| **Writing** | traces 4 capitals, 3 numerals, his name; one blank "now you try" line per card. | writes a sentence from his own head daily; 22 lines of story on Friday; two reflection lines. |
| **Letters/words** | one capital letter a day (lowercase as a K-level switch); letter sounds optional. | 10-word spelling list (AAS), vocabulary word with definition and synonyms, fix a sentence's errors. |
| **Numbers** | one number a day 1–100, count the pictures, trace the numeral. No operations. | multi-step word problems, number reasoning (series, analogies); no counting support at all. |
| **Independence** | side-by-side with Mom, 10 minutes. | alone, self-rates every card, answer key is for Mom only. |
| **Calendar** | points at day chips; Mom reads the date. | none — assumed. |
| **Fine motor** | a dotted path, big 52–58px tracing glyphs. | ordinary 10px writing lines. |
| **Closing** | circle a face, draw the favorite part. | rate each task, write what clicked, gratitude ×3. |
| **Page count / day** | one page a day (10 total). | two pages a day — day + brain break (18 total). |

Lucy's 1st-grade notebook (the third reference point) sits in this gap *for Lucy only*: a phonogram card driven by her LOE
link, three subtraction facts with a 0–10 number line, "trace today's date", a per-task "how did I do" table, four picture
activities uploaded by Mom (dot-to-dot, coloring, symmetry, maze) and paper dolls. It is hard-coded to Lucy and to those
uploads, so it can't be given to another family's kid; but several of its page ideas are the right size and are reused below.

**The child this is for:** past tracing single letters (knows most letters and sounds), can read a CVC word with help or
alone, counts to 20–50 and can write numerals, can copy a word, cannot yet read a paragraph or a 10-word list — i.e. **K to
early 1st**. That is Julian next year, the DeWalt 2nd grader on no template, and the Burris 2nd grader whose roster record
already says `notebook:{template:"first", gradeLabel:"2nd"}` (on-paper 2nd, working at 1st).

## 4. Proposal — the "First Steps" notebook (K–1 level, template key `first`)

Plain name on the page: **"<Name>'s Notebook"** with the eyebrow = the kid's grade word (`nbGrade`: "Kindergarten", "1st",
"2nd"…), exactly as the themed Pre-K looks already do. Internal name: **FIRSTNB** block, `generateFirst(ctx, T, lv, kidId)`.

Principles (same as the Pre-K fold): one engine, data-driven name/grade/content, a **look** chosen apart from the
**level**, every page a fixed 8.5×11 layout measured once, nothing printed that the child must produce.

### Page order (a 5-day week, defaults on)

| # | page | purpose (one line) | built from |
|---|---|---|---|
| 1 | **Cover — "This week I am learning"** | the week's 5 words, 5 numbers, the math range and the phonics pattern; draw box | `juPageCover` layout reused with four new cards (words · numbers · math · sounds); the look's `coverRow`/`drawCap` |
| 2 | **Handwriting Chart** *(extra, default on)* | all 26 letters capital+lowercase with HWT stroke words, ⭐ on this week's | `juPageAbc` as-is with `P.lowerFirst:true` (the chart is the K reference, not a sing-along) |
| 3 | **This Month** *(extra, default on)* | calendar math: days in the month, which week, trace the date | `luPageMonth`'s grid (the 1st-grade one, with fill-in blanks) generalised: it only needs `dates`, `year`, a header |
| 4–13 | **Daily Page** + **Practice Page** ×5 | front = the day's work with Mom; back = read · write · count alone | new `fsPageDaily`, new `fsPagePractice` (see below) |
| 14 | **End of Week** | read all five words, write the one you liked, circle the numbers you know, draw the best thing | new `fsPageEndOfWeek`, shaped like `luPageEndOfWeek` (table of fixed rows, not per task) |
| + | **Unit Study insert**, **Spelling** | as every notebook | `unitInsertPages(ins, wk, UNIT_INSERT_THEMES[T.unitTheme])`, `spellNbPages` as-is |
| P1 | **Grown-Up Guide** | targets, 🔁 review focus, answers to the practice pages (math facts, the reading question), how to help each card | new `fsPageParent`, same skeleton as `pkPageParent` |

≈ **14 student pages + 1 parent page** with the two extras on (12 with them off); the practice page can be turned off per day
through the existing extra-pages days picker (`extraPages.practice.days`), which drops the week to 7–9.

### Daily Page (front) — "Morning Notebook" side, 10–15 minutes with a grown-up

Keeps the Pre-K skeleton (`juHeader`, bookends, `cal-card`, to-do chips, `grid2` two columns, `juFooter`) so it fits the same
way and wears the same looks; swaps the cards:

| card | Julian's version | First Steps version | data |
|---|---|---|---|
| Calendar | day chips, Mom reads the date | day chips + **trace today's date** in the No Tears font (Lucy's `dateBlock`), "today is day __ of November" | `weekData.dates` |
| Letter of the Day | one capital, 4 traces | **Word of the Day**: the word big, its sounds boxed (c-a-t), trace it ×3 (`juTrace`, 40px), write it alone, "read it to me" | the Words source (below) + the week's cursor |
| Trace My Name | JULIAN in capitals | **Write My Name**: traced once (mixed case, `pkKidName`), then written alone; level `fsSentence` adds "I like ___." | `kidName`, `nbGrade` |
| Number of the Day | numeral + ten frame + 3 traces | same numeral + `juCountVisual` (tens-and-ones past 20) + **before / after** boxes (`__ 13 __`) + one trace + write it | `masteryItems` Numbers + `numberCursor` (as-is) |
| Shape & Color + Trace the path | shape to color, dotted path | **Math Practice**: 3 facts (addition within 10; level `fsSumsTo20` → within 20 with subtraction mixed in) + a 0–10 / 0–20 number line (`luNumberLine` generalised to take a max) | `weekNum` seed → `fsFactsWeek` (same idea as `luSubWeek`, deterministic, answers only in the guide) |
| Closing | faces, "look what I learned" chips, draw | faces, chips (word · number · fact), **"Something I learned — write or draw"** (one line + a small box) | — |

### Practice Page (back of each day) — "I can do it myself", the Ellis side reduced

One layout every day (so it is measured once), three bands, content rotating by day:

1. **Read it** — a 2–3 sentence decodable mini-story in 16px type, built from this week's phonics pattern and sight words
   ("Sam has a cat. The cat sat on a mat. Sam and the cat nap."), then **draw what happened** and *one* question with two
   picture/word choices ("Who napped? ○ the cat ○ the dog"). Level `fsReadAlone` off = "a grown-up reads it with you" (no
   question); on = the question prints and the answer goes on the guide. (The Ellis passage, shrunk from 90 words and a
   4-way inference question to 25 words and a 2-way recall question.)
2. **Write it** — **copywork**: one short sentence traced (dotted, 30px) then written on an HWT line; the sentence comes
   from the story or, when a unit insert is on that day, from the unit ("A shark has fins."). (Ellis's "write your own
   sentence" one step earlier: copy before compose.)
3. **Count it** — a ten-frame to fill to today's number, "10 more is __", and four facts with pictures (dots), or on Friday
   a number-bonds-of-10 house. (Ellis's problem solving two steps earlier.)

Friday's back page is instead a **Brain Break** (extra page `brainBreak`, default on): a small maze (`lnMakeMaze`/`lnMazeHtml`
exist for Lincoln and only need a size), a 1→12 dot-to-dot (Lucy's built-in placeholder polygon), a draw box. No uploads.

### Where the words come from (the one new data decision)

Order of precedence, all already in `ctx.masteryItems` or trivially so:

1. Mastery decks named **"Sight Words"**, **"Word Families"** or **"AAS Words"** (items with `status` introduction/parked
   first, then learned ones for review; `recentMiss`/`drop_count` → 🔁 review folding exactly as `juCurriculumFromMastery`
   does for letters — reuse its flag maths by mapping the deck onto the `letters` slot).
2. `ctx.loe` (the LOE phonogram link Lucy already gets): the newest phonogram sets the week's **pattern** card
   (`LU_PHONO` has pattern → words/tip for 20 phonograms; it is family-neutral data).
3. Built-in fallback: the Dolch pre-primer + primer list (public domain, 92 words) in a fixed order, walked by a
   **`wordCursor`** = `{week, idx, adv}` saved at `notebookSettings/<kid>/wordCursor` after each print — the same shape and
   the same `juLetterStart` arithmetic as `letterCursor`, so nothing repeats or rewinds.

### Levels (`notebookSettings/<kid>/nbLevel/<key>`, same store and UI as PREKLEVEL)

| key | off | on |
|---|---|---|
| `fsSumsTo20` | addition within 10 | addition and subtraction within 20 |
| `fsSentence` | write my name | write "I like ___." under the name |
| `fsReadAlone` | grown-up reads the story | child reads; the recall question prints |
| `nbSkipNoSchoolDays` | (reused as-is) | no pages on a day with no school cards |

Defaults off = Kindergarten. A 1st grader flips all three. No per-kid code: `fsLevel(ctx)` is `pkLevel` with a different table.

### Look / theme

The look is a theme object exactly like `NB_THEMES` (css, cover words, badges, footer, `unitTheme`, `pathHtml`). The three
Pre-K looks (dinosaurs / construction / sharks) work unchanged because the page uses the same CSS classes; a **fourth look,
neutral and a step older** (e.g. 🚀 "Rockets": navy + sky, or 🌿 "Garden"), is the default for a kid with no `notebookTheme`
so a 2nd grader isn't handed dinosaurs. `notebookOptions(kid)` lists all four for a `first` kid.

### ctx fields (all existing unless marked)

`kidName`/`nbKidName`, `nbGrade`, `notebookTheme`, `nbLevel`, `weekNum`, `weekDates`, `weekData.{dates,tasks}`, `masteryItems`
(+`recentMiss`), `reviewCap`, `numberCursor`, `letterSounds`, `loe`, `spelling`, `units`, `extraPages`, `teachNotes`,
`countEmoji`, `bindingMargin`. **New:** `wordCursor` (read from `notebookSettings/<kid>/wordCursor`, written back from
`out.wordCursor` by the same code that saves `numberCursor`, `index.html:35613`, with its kid gate widened from
`kid==="julian"||kid==="caleb"||out.prekTheme` to also accept `out.nbTemplate==="first"`). **New (selection):**
`nbTemplate` = `notebookSettings/<kid>/nbTemplate` else the roster record's `notebook.template` (today inert; the Burris
comment says it is meant for exactly this). No new Firebase node, only new keys under `notebookSettings/<kid>` (Mom-only,
targeted, `?dryrun=1` inert — as `nbSetLevel`).

### How a kid gets it

`generate(kid, ctx)` today: Pre-K spec → `generatePreK`; else `GENERATORS[kid]`; else `generateGeneric`. Add one step between
the first two: `fsSpec(kid, ctx)` returns a spec when `nbTemplate==="first"` **and** the kid has no notebook of their own in
`GENERATORS` (so Lucy, Ellis, Lincoln are untouched until Adrienne points one of them at it by hand). Julian keeps Pre-K
until his `nbTemplate` is set.

## 5. Open questions for Adrienne (each with the default this plan assumes)

1. **Who gets it first, and how?** The Burris roster already says `template:"first"` for their 2nd grader, so the slice-1
   deploy would switch her from the starter notebook to this one by itself. — *Default:* read the roster field **and** let
   the Notebook tab override it (`nbTemplate`), tell the Burris family in the PR; Julian/Lucy only when you flip them.
2. **Print or cursive?** The No Tears font in the repo is print only; cursive means a second embedded font. — *Default:*
   print (HWT order), cursive later as a level switch if a 2nd grader needs it.
3. **Word of the Day source:** the kid's Mastery decks (Sight Words / Word Families / AAS Words, review-folded) with the
   Dolch list as fallback — or a weekly list you type on the Notebook tab? — *Default:* decks + Dolch fallback; the
   Spelling page keeps coming from AAS as today.
4. **Math on the daily page:** fixed facts by level switch (within 10 / within 20) — or follow the kid's Math Fluency Path
   front automatically the way numbers do? — *Default:* the switch, off = within 10; the path link is a later slice.
5. **One page a day or two?** Two (front with you, back alone, double-sided) matches Ellis's and Lucy's rhythm but doubles
   the printing. — *Default:* two, with the Practice page toggleable per day on the Notebook tab.
6. **Reading on the Practice page:** our own built-in decodable mini-stories (family-neutral, ~40 keyed to patterns) — or
   nothing until you upload readers (as Lucy's activities work)? — *Default:* built-in stories; "read alone" is a switch.

## 6. Build plan — slices, one branch each

Every slice: a marked block (`FIRSTNB_START … FIRSTNB_END`, then `FIRSTNB_PRACTICE`, …), a `test_<feature>.js` that slices the
block out of `notebooks.js` and checks it in Node (`global.window={}; eval(src)`), hash snapshots proving every existing
notebook (Julian, Caleb, shark kid, Lincoln, Ellis, Lucy, starter) is byte-identical (the pattern in
`test_prek_notebook_levels.js`), no kid or family names in the new code, and the Playwright page-fit measurement when it
is installed (SKIPPED otherwise — as `test_notebook_shark.js`).

| slice | branch | what ships | test |
|---|---|---|---|
| **1** | `claude/first-notebook-skeleton` | `generateFirst` with the Cover, the Daily Page (front) and the Grown-Up Guide; template selection (`fsSpec`, `nbTemplate`); default 🚀 look + the three Pre-K looks; Dolch fallback words + `wordCursor`; Numbers as-is; app wire = `generate()` picks it, the cursor save gate, `nbTemplate` read. No Notebook-tab UI yet beyond the look row (`notebookOptions` already draws it). | `test_first_notebook.js` |
| **2** | `claude/first-notebook-practice` | the Practice Page (read · write · count) behind each day, the built-in story bank, answers on the guide, the per-day toggle via `extraPages.practice`. | `test_first_practice.js` |
| **3** | `claude/first-notebook-levels` | `FS_LEVELS` + Notebook-tab switches (reusing the PREKLEVEL rows for a `first` kid), Mastery-deck words with 🔁 review folding, `loe` pattern card, `fsSumsTo20` facts. | `test_first_levels.js` |
| **4** | `claude/first-notebook-week` | End of Week page, Friday Brain Break (maze + dot-to-dot), Handwriting Chart + This Month extras in the catalog (`EXTRA_PAGE_CATALOG` keyed by template, not kid). | `test_first_week.js` |
| **5** *(optional)* | `claude/first-notebook-planner` | the 🚀 "This week's plan" card (words + numbers picks) through `planOnly`, as CBPLAN does for Pre-K. | `test_first_planner.js` |

### Slice 1, spelled out

`notebooks.js` (one block, after `CBPLAN_END`, before the Lincoln section):

- `FS_LEVELS` (the three switches above + `nbSkipNoSchoolDays`), `FS_LEVEL_OFF`, `fsLevel(ctx)`.
- `FS_DOLCH` (pre-primer + primer, one array), `fsWordStart(cursor, wk, n)` = `juLetterStart` (call it, don't copy it),
  `fsWordsWeek(words, start, dayCount)` → the five words + `_words:{start, adv}` for the cursor.
- `fsFactsWeek(wk, dayCount, lv)` — 3 facts a day, `lnRng` seeded by week, within 10 (sums) by default.
- `nbRocketTheme(ctx)` — the fourth look: name/grade from `pkKidName`, `JU_CSS` + a colour override block exactly like `SH_CSS`,
  `unitTheme:"rocket"` (+ one `UNIT_INSERT_THEMES.rocket` row), `P` for the extra pages, `guide` words.
- `fsPageCover`, `fsPageDaily`, `fsPageParent` — built from `juHeader`/`juFooter`/`juTrace`/`juCountVisual`/`juNumberStart`/
  `juNumbersWeek`/`xpStrip`/`pagesForDay`, with the card changes in §4.
- `generateFirst(ctx, T, lv, kidId)` → `{student, parent, numberCursor, wordCursor, nbTemplate:"first"}`; `fsSpec(kid, ctx)`;
  `generate()` gains the one `fsSpec` step; `notebookOptions` lists the four looks for a `first` kid; `_internal` exports
  `generateFirst`, `fsSpec`, `fsWordsWeek`, `fsFactsWeek`, `FS_DOLCH`.

`index.html` (FIRSTNB_WIRE, three small touches): `nbTemplateOf(kid)` (notebookSettings → roster `notebook.template`) passed
as `ctx.nbTemplate` from `haNbContext`; the two cursor-save lines accept `out.nbTemplate==="first"` and save
`out.wordCursor` to `notebookSettings/<kid>/wordCursor` (targeted `set`, `db&&!_dryRun()`); `nbLookOpts` passes
`nbTemplate` so the look row shows the four looks. No schedule, no `settings/*`, no `settings/family` write.

`test_first_notebook.js` checks: (a) the 8 existing snapshots unchanged; (b) a kid `"kid7"` with `nbTemplate:"first"`,
`kidName:"Ada"`, `nbGrade:"1st"` gets 7 student pages on a 5-day week (cover + 5 days + unit insert) and 1 guide; (c) every
page carries `Ada` and `1st`, never a Howe/DeWalt/Burris name; (d) the five words are five distinct Dolch words, week 2
continues where week 1's `wordCursor` left off, re-printing week 1 reuses it, a Sight Words deck replaces the list;
(e) numbers follow `numberCursor` exactly as Julian's (`juNumberStart` shared); (f) `fsFactsWeek(12,5)` is deterministic,
15 facts, every sum ≤ 10, and no answer string appears in the student HTML; (g) `nbTemplate:"first"` on `lucy`/`ellis` changes
nothing (own notebook wins); (h) the look row offers rocket/dino/construction/shark; (i) Playwright fit of every page
across the four looks × 3 name lengths × numbers 1–100, or SKIPPED; (j) the `index.html` wire: `wordCursor` save present,
gated, targeted path, no `settings/` path in the block.

Done = PR with the plain-language description (what prints, what it writes: `notebookSettings/<kid>/wordCursor` only, tests
run), Adrienne's eyes on a real print, nothing merged by the session.
