# Streamlining the Curriculum page — design (2026-11-10)

Written for Adrienne before any code. **Nothing built, nothing written to Firebase, no app file touched.** Read from
`origin/main` b4e8689 (PR #320) in a worktree; every line number below is from that checkout of `index.html`.

Your words (2026-11-10): *"looks at the curriculum page and really evaluates all buttons and options etc and how can we
streamline all the things. i like the grid format i like the lanes but its not easily navigateable for a new family. i dont
want to take away any features and i like the grid look but i do want to make sure this is not so complex and is simple
enough another mom could figure this out and set it up for her kid etc and i dont want things repeating in multiple areas.
except setup of a new subject etc all the options could be in one spot etc."*

The four constraints this plan holds to: keep the grid and the lanes · remove no feature · every per-subject option in ONE
spot, with new-subject setup as the one guided flow apart from it · nothing reachable from two places unless one is a plain
shortcut that opens the same panel.

**Amended the same day with her answers to questions 1 and 2** (relayed 2026-11-10): *"i like the rules table better than
the builder i want to get away from builder except for the initial setup."* So: every per-subject setting **writes and
re-lays on the tap**, Rules-table style; the **⚙ Rules table stays a live editor**; the Builder form survives **only inside the
guided Add**. And a bug she reported in the same breath — tapping a Rules-table pill "takes me back to the top" — is diagnosed
in §4.0 as a pre-slice fix, **RULESCROLL**.

---

## The short version

| | Today | Proposed |
|---|---|---|
| Controls a Mom can reach on the page | **≈330** (331 counted; see §1) | the same set, moved — none removed |
| Places that hold per-subject settings | **5**: Add sheet · subject card · ⚙ Rules table · 🧱 Builder form · Family-time editor | **1 editor, drawn in 2 places** — the card and the ⚙ Rules table draw the same pill through one function (+ the Add flow, which is setup) |
| Per-subject settings writable from 2+ editors | **18 groups** (§1.4) | **0** — one function writes each field; the Builder form no longer edits anything after setup |
| When a change takes effect | Rules table: on the tap · Builder: staged until Build · card: mixed | **always on the tap**, the week re-lays, ↩ Undo one tap (her answer to question 1) |
| Housekeeping / migration / audit banners above the grid | **14** different banners, each its own colour | one collapsed **🔍 Checks (n)** drawer, shown only when n > 0; in Simple the tidy-ups fold to "n more under Show everything", never out of the count |
| Toolbar buttons and toggles above the table | **11** | **5** (kid chips · 🏡 Family · ＋ Add subject · 📅 *Kid*'s year · ⋯ More) |
| First subject from a book, until it is on the week | **21 taps · 5 screens · 20 Howe words, 5 of them decisions you must get right** | **16 taps · 3 screens · 2 Howe words (lane, card), 0 forced decisions** |
| Lesson Map editor controls nobody can reach | 41 (the Subjects tab it lived on redirects to the Grid on every render) | **audited, then removed** (slice 3b LMCLEANUP, her answer to question 4): ≈95 KB less `index.html` for the LG |

The tap count barely moves. The real cost today is not taps, it is the **20 words a first-year mom has to already know**,
spread over **5 editors that each hold part of one subject**, with **14 coloured banners** that are really maintenance
tools for a 7-year-old curriculum sitting between her and the grid. The plan moves things; it deletes nothing.

---

## 1 · Inventory — what is on the page today

Method: every `onclick`/`onchange`/`oninput` in `renderCurriculumView` (29241) → `renderCurrGrid` (57382–58055), the
subject card `ceRenderEditSheet` (32626–33103), the Add sheet `ceRenderAddSheet` (34662–34888), ⚙ Rules `cbRenderRules`
(53550) with 🛤 Lanes `lnRenderSection` (53316), the 🧱 Builder `cbRenderForm` (54538) and its gate, the plan bar
`planBarHTML` (28549), the cell menu / editor / select tools (54736–57381), the 🏡 Family view (37208–37330, 37943), and
the Lesson Map `lm*` (58673–59450) — each traced to the function that does the write. The full row-by-row tables, with
label, place, action, Firebase path, who, "also reachable from" and code line, are **Appendices A–D** at the end of this
file (one row per control; a group of identical chips such as Mon–Fri counts once).

### 1.1 Counts

| Area of the page | Controls | Notes |
|---|---|---|
| Grid top row + kid tools (`↻ Rebuild all`, `⚙ Rules & day cap`, `🏁 Target · Mom Check · Sessions`, result banner) | 8 | App. A #1–8 |
| 🏁 panel: Finish Line Target · Mom Check · School Sessions (name, dates, kids, days, points, song, goals, soft/hard, delete, new) | 14 | App. A #9–18 + App. C E1 |
| Housekeeping / migration / audit banners (lesson ids, import completions, out-of-order, skiplog, fold caps, fold days, make plan-backed, orphans, capture list, restore point, pace leftovers, 🔍 audit with 5 fix buttons, ⚖ Evening out, 🗓 Daily cards missed) | 25 | App. A #19–43 — **all Mom-only, all conditional** |
| Grid toolbar (past days, select cells, sort by end date, undo last) + select-mode bar + gestures | 11 | App. A #44–54 |
| Calendar / move banners (Align weeks, Add missing school days, ✕ cancel park, ↩ Undo move) | 4 | App. A #55–58 |
| Column headers (subject, lane active member, lane queued book) + 3 strips that open a card (🗂 no lessons, ⏸ paused, 📊 card-only) | 6 | App. A #59–61 + §A-strips |
| Cell tap · move-target tap · cell menu (✎ ✓ ↩ ➡ ✕ 🗑 ↩put-back ✕make-up 📎 ×) · inline editor (Enter, ✓, 🗑, ➕) | 19 | App. A #62–80 |
| 📎 Lesson resources panel | 8 | App. A #81–88 |
| ↪ Keep / Dismiss gate sheet | 5 | App. A #89–93 |
| ⚙ Rules panel: day cap (2) · 🛤 Lanes list + editor (21) · per-subject placement table (19 columns of pills) · Settings door | 44 | App. A #94–137 |
| 🧱 Builder form (mode chips, start on, days, finish by, times/week, stop after, 📸 scan, units, pages, label, minutes text, generate, preview, copy to kid, build, cancel) | 24 | App. A #138–161 |
| Retired Builder tab (still reached by `⤒ Delete & shift up` and `Add it back…`) | 7 | App. A #162–168 |
| 🗂 Plan bar: Roadmap (21) · Test scores (1) · Plan notes (8) | 30 | App. A #169–198 |
| Subject card (everything not already counted in the Builder form it embeds): rename, tracking, practice-for, Mom's part, timed card, study session, out-of-order, cap, re-lay remaining, ⏰ set time (5), 🔗 lesson link (5), when behind, Mom check, reading log (2), workbook, record score (2), carryover cap, progress / hand counts (3), walk back check-offs (6), pace keyword, starts week, lesson list editors (per-line, list editor + sort/trim/×N, textarea), ✓ mark done panel (7), completion reward (3), book milestones (2), status toggle, Done, Delete | 74 | App. B #1–3, #33–103 |
| Add sheet: who, name, device, Mom, minutes, times/week, days, rules (+ sticky 2), ⏰ set time (4), tracking, study session, lessons (auto: prefix/total/start · manual), days per lesson, priority, carryover cap, Cancel, Add | 29 | App. B #104–132 |
| 🏡 Family view: ⚙ Family time panel, ＋ Add family time, band tap, column tap, Family-time sheet (name · kids · days · start · items + ✕ ▲▼ day kid minutes · 🧩 Do together · ↩ Move back · lessons track · per-day start · min minutes) | ≈22 | estimated from `famBlockEditorHTML` 36830 (App. D row 45); not walked row by row |
| **Reachable controls on the page** | **≈330** | 331 by the rows above |
| Lesson Map editor UI (`lmRenderSubjectGrid`, By-Week view, `lmRenderSubjectView`) | 41 | **unreachable by tap** — App. C A2/A3 |
| Load dial | 4 | on the Scores page, not here (App. A #199–202) |

For comparison, the whole Add sheet a new mom fills in is 29 of the 330, and the five pieces that actually make a subject
schedule (name · how lessons are counted · which days · how many a week · minutes) are 7 of the 29.

### 1.2 Who can use it

Everything on the page is Mom-only: `renderCurriculumView` 29241 shows "Curriculum Locked" + a PIN box unless
`momHere()`. Since MOMSWITCH (2026-11-02) the header **Mom** switch turns that on once per device. Many functions
re-check `momModeActive||adminPinUnlocked` inside (marked in the appendices); none of that changes here.

### 1.3 Where the page is reached from

- Mom's Day ▸ 🎓 School ▸ **📖 Curriculum** (`mpSchoolRow` 25257 → `mpSchoolOpen` 25266, lands on the grid). School
  reopens the **last chip used**, default 📓 Notebooks — a brand-new family lands on Notebooks first.
- Schedule ▸ Admin ▸ Curriculum (`adminSubTab==="curriculum"`, 9077); Mom HQ row 📚 Curriculum (8430).
- Doors in from elsewhere: Units "📚 On the schedule … Open it" (`psOpenPointer` 40463), Mom's Day roadmap row
  (`rmxOpen` 28283), Settings ▸ Family rules ▸ "Family time — edit it on the Grid →" (`famHomeGo` 37954), Rules →
  `rulesGoGrid` 79722, School Room ▸ Books ▸ "Add to *Kid*" (`lbAddTo`, library.js 606 → the Add sheet).

### 1.4 Duplicates — the same per-subject setting with two or more editors

"Editor" = a control that writes the field itself (not a shortcut that opens another editor). Create-vs-edit pairs (the Add
sheet sets a field the card later edits) are listed separately; your rule allows those.

| # | Field / data | Editor 1 | Editor 2 | Editor 3+ |
|---|---|---|---|---|
| 1 | `allowedDays` — the days it runs | ⚙ Rules table **Days** pins `cbPinDay` 53397 (writes at once, re-lays) | 🧱 Builder **Days it can land on** `cbToggleDay` 54434 (staged, written by Build) | Add sheet **Days** (create) |
| 2 | `timesPerWeek` + `pacing/tpw` | Rules **×/wk** `rlSet('tpw')` 53418 (at once, re-lays) | Builder **Times per week** `cbStepTpw` (staged) | Add sheet **Times Per Week** (create) |
| 3 | `minutes` | Rules **Min** `rlSet('minutes')` | Card ⏰ Set time ▸ **Runs for** (32717) | Add sheet **Duration** (create) |
| 4 | `cap` — sittings a day | Rules **Cap** `rlSet('cap')` | Card **Cap** stepper `ceSetCap` 34511 | 🧢 Fold into Cap (migration) |
| 5 | `paused` / `pausedSince` / `planAnchor` | Card **Status** toggle `ceTogglePause` 33357 | Family-time **🧩 Do together / ↩ Move back** `_famSubjWrite` 37130 | (card ⏸ button 29634 is on the retired Subjects page) |
| 6 | `planAnchor` = today | Card **↻ Re-lay remaining** 34519 | Status resume 33357 | Build `cbApply` 54100 |
| 7 | `noCarry` | Rules **No-carry** pill | Card 📚 Study session chip (sets it as a side effect, 32676) | |
| 8 | `noCoopDays` | Rules **🏫 no co-op wk** pins `cwdPinDay` 41812 | Rules **Use Mon–Thu for every 4×/wk subject** `cwdUseMonThu` 41821 (bulk) | |
| 9 | one grid cell's text `lessons/<kid>/<dn>/<sk>` | cell editor `gvCommitCell` 57033 | `✎ Fill…` / `🗑 Clear` (select mode) | card per-line rename 34528/34544 · audit **Delete the 2nd** / **Make consistent** · Build |
| 10 | the lesson list `lessonSeq`/`lessonIds`/`nextLid`/`total` | card **Save list** 34361 / textarea 34310 / per-line 34528 | grid `🗑` 57107 · **Capture from the grid** 55038 · **Add it back…** 55729 · **Match the list to the grid** 55837 · select Clear/Fill resync | **Assign lesson ids** 33587 · **📅 Fold into Days** 33962 · Build / Undo · Regenerate & Sunday build (outside, `pgAutoApply` 52573) |
| 11 | a lesson's done record `done/<kid>/<sk>/<lid>` | cell **✓ Mark done** `gvMarkThrough` 56968 | card **✓ / ↓ through here** 33204 | cell **✓ done** `gvMenuDone` 56840 · **Import completions** 33734 · day view **✓ Approve all up to** 10310 (outside) |
| 12 | un-doing a done record | cell **↩ Not done** 56983 | card **↩** chips / **↩ Make done contiguous** / **×** hand-mark 34106/34117/33301 | day-view un-check `lidDoneRemove` 33635 (outside) |
| 13 | the whole Build (`cbApply` 53930) | **✓ Build into map** | **↻ Rebuild all** on the grid (#4) and on the Builder tab (#167) | every re-lay door: 🗑, ✕ off day, ➡ park, ✓ done, Mark done, Not done, Days pins, every `rlSet(…,true)` pill, Save list, Cap, Re-lay remaining, Walk back |
| 14 | the build **↩ Undo** banner (`cbUndo` 54358) | grid 57419 | card 32652 | Builder tab 54463 (+ Subjects page 29620, unreachable) |
| 15 | `scheduleOverrides/<date>/<kid>/removed/<sk>` | cell **✕ off day** 56141 | ➡ park (the in-between days) 56804 | cleared by **↩ put back** 56778 |
| 16 | `scheduleOverrides/<date>/<kid>/added/<sk>` | editor **➕** make-up 57008 | removed by **✕ make-up** 57002 | |
| 17 | `curriculum/dayCap/<kid>` and the whole ⚙ Rules panel | grid **⚙ Rules & day cap** (#5) | Builder tab **⚙ Rules & day cap for *Kid*** (#166) | |
| 18 | the Family-time block editor (`famBlockEditorHTML` 36830) | grid 🏡 **⚙ Family time** panel 37943 | Family-time **sheet** (band tap / column tap) 37311 | Settings door · Mom's Day roadmap row · Units **⚙ Edit on the Grid** — these three are shortcuts to the same editor (allowed) |

After her answers to questions 1 and 2, rows 1–4 resolve as *one function, drawn in the table and on the card* (the Builder's
staged copy goes); rows 13–14 shrink to the guided Add plus "Lay it out again" and its one ↩ Undo.

**Create-vs-edit pairs** (Add sheet field → the card/Rules editor that changes it later; allowed by your rule, but they are
why a new mom meets `device`, `priority`, `carryover cap`, `sticky`, `first/last` *before* she has a subject): device, Mom
requirement, priority, scheduling-rule tokens, sticky with/order, ⏰ set time (4 fields), tracking, study session, days per
lesson, carryover cap — **11 fields** asked twice, once at birth and once in the card.

**Five ways to create a subject record** (`curriculum/subjects/<kid>/<key>` whole-record `set`): the Add sheet
(`ceAddSave` 34931), Builder **Copy to another kid** (`cbCopyTo` 53455), Units **🗓 Put it on** (`psApply` 40424), Mastery HQ
Sessions **🗓 Put it on** (`spApply` 72739), Admin **Upload Curriculum** (`uploadCurriculum` 35083, the whole `curriculum`
node). Two of them (Units, Mastery HQ) are their own small Add sheets with their own field names.

**Drawn twice, one reachable:** `ceSetTargetEnd`, `ceToggleMomVerifyKid`, `ceRenderSessions`, `alignPlanApply`, `cbUndo`,
`cbRenderRules` are each rendered by both `renderCurriculumView` (the retired Subjects branch, 29330–29416) and the live
grid. Harmless today; it is why the same button text appears in two render functions when you grep.

### 1.5 Outside the page — where else the same data is edited

51 places outside the Curriculum page write curriculum / pace / plan / schedule-shaping data (**Appendix D**, table 1).
45 are controls a Mom can tap; **11 of those duplicate a control on the page**:

| Outside control (nav) | Duplicates on the page |
|---|---|
| Day view ▸ Mom card dialog ▸ **Skip for good** / **↩ Undo** (`momDismiss` 58164, `undoMomMove` 58214) | the pace cursor the card's **Schedule next-lesson** box edits (`ceSetCount('adjust')` 32394) |
| Day view ▸ **✓ Approve all up to …** (`orderBlockApproveThrough` 10310); card un-check **↩ Unmark** (`lidDoneRemove`) | the card's / cell menu's **✓ Mark done** / **↩ Not done** (`curriculum/done`) |
| Day view ▸ **🔄 Regenerate** (`schedRegenerateNow` 8551 → `pgAutoApplyAll`) — and the Sunday self-build | rewrites page-book subjects' lesson lists (the card's list editor, grid cells, Build) |
| Settings ▸ **Workflow Orders** (`wfSubjMove` 79133 …) | the page rewrites those entries on rename/delete; "first / last" tokens are the page's own order field |
| Mom's Day ▸ roadmap row **✓** (`rmDone` 27900) | the plan bar's Roadmap strip, same function |
| Mastery HQ ▸ Sessions ▸ **🗓 Put it on** (`spApply` 72739) | the Add sheet (whole-record subject create) |
| Units ▸ **🗓 Put on the schedule** (`psApply` 40424) | the Add sheet (+ its family row) |
| **Family Time sheet** from Mom's Day roadmap row (`famSheetRender` 37311) | the grid's 🏡 panel — identical editor; also pauses per-kid subjects |
| Admin panel ▸ **Upload Curriculum** (`uploadCurriculum` 35083) | everything — whole `curriculum` node |

The other 34 outside controls edit things the page has **no editor for** (per-date school hours ×3 places, 📅 This week,
👩 Mom loop, Settings cards, heads-up rules, co-ops, kid off, mastery sessions/gates, load dial, book scans). Appendix D
table 3 lists the **29 setting groups that shape a subject's scheduling but live only outside the page** — school-day
hours, workflow tiers, stack gap, Saturday, catch-up mode, Sunday catch-up, devices, sitter, car school, co-ops, kid off,
`fixedTimeByDate` (a class moved for one date — written **only** from the day-view ⏰ dialogs, never from here), and so on.
This plan leaves every one of them where it is: they are family-wide or week-level, not per-subject, and the ⚙ Rules
footer already says so. The two outside-to-outside duplicates worth a later look (not this plan): Sunday catch-up and
with-sitter are each in Settings *and* 📅 This week; per-date school hours have three doors.

### 1.6 Two findings you should know about

1. **The Lesson Map editor is unreachable.** `renderCurriculumView` 29260 rewrites `currInnerTab==="subjects"` to
   `"grid"` on every render, and that Subjects branch is the only place `lmRenderSubjectGrid` (59258), the By-Week day
   cards (29422–29589) and the Move picker are drawn. `lmSetView` 58994 and `lmRenderSubjectView` 59131 have no callers;
   `gvMenuMove` 56133 (◀▶ move a day) is never drawn, so the grid's "Moved … ↩ Undo" banner (57737) has no live trigger.
   What survived into the grid is the cell menu's ✕ off day / ➡ move / ➕ make-up / ↩ put back and the Align banner,
   all reusing `lm*` write functions. 41 controls of UI, 0 reachable. (Question 4 — answered: audit, then remove; §4.3.)
2. **"Shared curriculum (paused)" has no code.** No block, door or flag exists in this checkout; the only "shared" on the
   page is Units' "Shared units · by kid" (two kids enrolled). Nothing to move.

---

## 2 · A first-year mom's walkthrough today

Melanie has one kid on the roster, the Mom switch on, the app open on Schedule. Her first subject: a physical math book,
120 numbered lessons, Monday / Wednesday / Friday, about 30 minutes, she sits with him. Taps are counted; typing into a
field counts as one tap on it. **Howe words** = a label she cannot act on without already knowing what the app means by it.

### 2.1 Add the first subject from a book, set its days and times a week, map the lessons, assign it, see it on the week

| # | Tap / screen | Howe words she meets |
|---|---|---|
| 1 | **Mom's Day** tab | |
| 2 | **🎓 School** — lands on 📓 Notebooks (School remembers the last chip; a new family has none) | |
| 3 | **📖 Curriculum** → the grid, "*Kid* has no lesson grid yet — build a subject in the Builder or upload Excel." | Builder · Excel · lesson grid |
| 4 | **＋ Add Subject** → sheet "Add Subject for *Kid*" | |
| 5 | **Subject Name** — type it | |
| 6 | **Device**: 📖 Book (default is 📄 Paper) | Device |
| 7 | **Mom Requirement**: Required (default None) | Mom Requirement · Maybe |
| 8 | **Duration (minutes)** + once (25 → 30) | |
| 9–10 | **Times Per Week** − twice (5 → 3) | |
| 11–12 | **Days**: un-tap Tue, Thu (Mon–Fri are pre-lit) | |
| — | **Scheduling Rules** — `sequential` is pre-lit; `sticky`, `first`, `last of day`, `last of own work` sit beside it | sequential · sticky · first · last of day · last of own work |
| — | **⏰ Set time** — "Off — packed into the day" | packed into the day |
| — | **Lesson Tracking** — Sequenced / Daily (no lesson #) — default Sequenced | Sequenced · Daily · tracking |
| — | **Lessons** — Auto-number / Type lesson list; **Prefix** Lesson · pg · Ch. · Unit · Module · Week · Ex. | Auto-number · Prefix |
| 13 | **Total** — tap the number, type 120 (default 50); **start at** 1 | start at |
| — | **Days per lesson** (1) · **Priority** (Normal) · **Carryover Cap** (2) — left alone, but each is a decision | Days per lesson · sittings · Priority · Carryover Cap |
| 14 | **Add Subject** → the sheet closes and the **subject card re-opens by itself** with 🧱 expanded; toast "📚 … added — now pace and build it below." | pace · build |
| — | Card: "Device, mom, minutes, days, ×/wk, cap, priority, first/last, sticky, carry, rules and max/day live in ⚙ Rules above the Grid" | ⚙ Rules · ×/wk · cap · carry · max/day |
| — | **🧱 Pacing & build ▸ How should it be paced?** 🎯 Done by a date · 📅 Days per week (pre-lit) · ⏳ Until a date · 📖 Pages · ⏱ Just minutes | paced · Done by a date · Until a date |
| — | **Start on** (blank = today) · **Days it can land on** (Mon Wed Fri already lit — the same days she picked in step 11, shown again) · **Times per week** 3 (again) · "120 lessons remaining of 120 — laid from where *Kid* actually is" | land on · laid |
| 15 | **Preview build** → "Preview — nothing written yet", tiles: days scheduled · 3× per week · first day · finishes | Preview build |
| 16 | **✓ Build into map** — writes the cells, re-lays this week | Build into map |
| 17 | **Done** (closes the card). The column is in the grid. | |
| 18–19 | To see it on the week: **Mom's Day ▸ 🗓 Schedule** (or the Schedule tab) → today's cards | |

**19 taps + the Mom switch and code (1 tap + 4 digits) = 21 · 5 screens** (Mom's Day, School row, grid, Add sheet, card) **·
20 Howe words**, of which **5 are decisions that change the result** if guessed wrong: Scheduling Rules, Lesson Tracking,
Lessons (Auto-number vs list), Carryover Cap, the pacing mode. **Three things are asked twice**: days (Add ▸ Days, then
Builder ▸ Days it can land on), times a week (Add, then Builder), and "where this subject's settings live" (the card
immediately tells her they are somewhere else). **One hidden mechanic**: the card re-opening itself after Add, with a
second "build" step she did not ask for — if she closes it, the subject is on the card but **not in the grid** (the 📊
"On their cards, not in the grid yet" strip appears).

If the book is a workbook she wants paced by pages, step 14 must be followed by 📖 Pages ▸ **📸 Scan the book**, which
needs an AI key from Settings (`cbScanBook` 53809 — "⚠ No AI key set") — or **Total pages / Start at page / Pages per day
pattern / Label**. The library's own "Add to *Kid*" from a table-of-contents scan lives on **School Room ▸ 📚 Books**, not
on this page.

### 2.2 Change how many days a week a subject runs (3 → 4)

Today there are **three doors** and the card points at the wrong one:

| Door | Taps | Howe words |
|---|---|---|
| grid ▸ **⚙ Rules & day cap ▾** ▸ find the row ▸ **×/wk +** (re-lays at once) | 2 | Rules · day cap · ×/wk · the 19-column table (Cap · Co-op day · First/last · Sticky · No-carry · seq) |
| grid ▸ **⚙ Rules** ▸ **Days** pins: light Thu (re-lays) | 2 | — but ×/wk stays 3: the pins say *may land on*, ×/wk says *how many* |
| column name ▸ card ▸ **🧱 Pacing & build** ▸ **Times per week +** ▸ **Preview build** ▸ **✓ Build into map** | 5 | Pacing · build · land on · Preview |

She has to know that **days** and **times a week** are two settings (`allowedDays` and `tpw`) and that the table re-lays on
the spot while the Builder stages until Build.

### 2.3 Pause a subject · 2.4 Delete one · 2.5 Reorder lanes

| Task | Today | Taps | Howe words / hidden |
|---|---|---|---|
| **Pause** | column name ▸ card ▸ scroll to **Status** ▸ toggle *Active / Paused*. Resume: the **⏸ Paused** strip ▸ name ▸ toggle | 2 (+2) | the toggle is the 27th section of the card; "its future spots are empty; resume it on its card and it re-lays from the next open day" |
| **Delete** | column name ▸ card ▸ scroll to the bottom ▸ **Delete Subject** ▸ confirm | 3 | "removed from the Grid, Calendar, Lesson Map and Rules workflow" |
| **Reorder the books inside a lane** | grid ▸ **⚙ Rules & day cap ▾** ▸ 🛤 Lanes ▸ **✎ edit** on the lane ▸ **▲ / ▼** per unit ▸ **Save lane** | 4+ | lane · unit · single card · multiple card · pattern AAB · rhythm "↑ same as the one before" · retire |
| **Reorder the columns** | **not possible** — columns are alphabetical by display name (`gvSubjectCols` 55981); the only order control is **Sort by end date** (this device only) | — | |
| **Make a lane** | ⚙ Rules ▸ 🛤 Lanes ▸ **＋ New lane** (or a "*Name* ＋" chip) ▸ name ▸ **+ single card** ▸ pick ▸ repeat ▸ **Save lane** | 6+ | as above; "Not stacked yet — every one of these is a lane of one" |

---

## 3 · The proposal

### 3.1 The shape

```
┌ 📖 Curriculum ─────────────────────────────────────────────────────────┐
│ [Lincoln] [Ellis] [Lucy] [Julian] [🏡 Family]      [＋ Add subject]    │
│ [📅 Lincoln's year ▾]  [⋯ More ▾]                                      │
│ 🗂 Lincoln's plan · 📅 3 to do · 📊 2 reports · 📝 1 note   [Show]    │   ← plan bar, unchanged, collapsed
│ 🔍 Checks (2) ▸                                                        │   ← one drawer, only when n > 0
│ ┌──────┬─────┬──────────┬──────────┬────────────────┬──────────┐        │
│ │      │     │ 🛤 Math  │          │ 🛤 Grammar     │          │        │   ← lane bands, unchanged (tap = edit the lane)
│ │ Day  │ Min │ Dim. 4A  │ Spelling │ EIC │ ▸ Purple │ History  │        │   ← column name = open the card
│ │ Mon  │ 180 │ L12      │ List 9   │ Ch3 │          │ pp. 40–3 │        │   ← cell tap = ✎ ✓ ➡ ✕ 🗑 📎 (unchanged)
└────────────────────────────────────────────────────────────────────────┘
```

Three panels instead of five: **the subject card** (every per-subject option), **📅 *Kid*'s year** (every per-kid option,
including lanes **and the live ⚙ Rules table**), and **Settings** (family-wide, already there, one door). The **＋ Add subject**
flow is the one guided path apart from them, and it is the **only place the 🧱 Builder form is drawn** after this plan.

**How "one spot" and "the Rules table stays" fit together (her answer to question 2).** The card's *When it runs* section
and the Rules table's row for that subject are **one control drawn twice**: one function, `rlPillHTML(kid, sk, field)`,
returns the pill for a field (Days pins, times a week, most in one day, minutes, Mom, device, priority, order in the day,
right after, if missed, co-op day, Mom days, new-lesson day) and every place that shows that field calls it. There is one
editor per field in the code; the table is where she edits twenty subjects at once, the card is where she edits one. No
"shortcut cells", no second implementation, no staged copy.

### 3.2 The one subject card — sections and what moves in

Opened by: the column name, a lane header name, the three strips, an out-of-order chip, the roadmap row, the Units pointer
chip — all **shortcuts to the same card** (allowed). Sections, top to bottom; **bold** = moves in from somewhere else;
*italic* = renamed (§3.5). In **Simple** view (§3.6) only sections 1–4 and the header show; **Everything** shows all.

| § | Section (new label) | What is in it | Comes from | Writes (unchanged) |
|---|---|---|---|---|
| hdr | *name* · *where it happens* emoji · **⏸ Pause / ▶ Resume** · **Delete** (⋯) | rename; pause toggle moves up from section 27 to the header; delete behind ⋯ with the same confirm | card Display Name; card Status (33085); card Delete (33094) | `display`, `paused`/`pausedSince`/`planAnchor`, delete path |
| 1 | **The basics** | *Where it happens* (paper/computer/iPad/book/keyboard) · *How long* (minutes) · *Needs you?* (No / Sometimes / Yes) · *Who does it* (this kid; "do it together" → opens the Family-time editor) | **⚙ Rules table** Device · Min · Mom (53550) and the Add sheet's copies | `device`, `minutes`, `mom` via `rlSet` 53418 |
| 2 | **When it runs** | *Days of the week* (Mon–Fri pins) · *How many times a week* · *Most in one day* (cap) · *Order in the day*: First thing / Last thing / Last of their own work / Right after ___ (sticky + before/after) · *If it's missed* (carries / skip it) · *Co-op days* (keep / shorter / skip; the no-co-op-week days) · *Lesson day* (📌 new lesson stays on …, if missed …, missed practice …) · *Mom on which days* (multi-day lessons) · *A class at a set time* (⏰ time · meeting dates · join link) — **every pill is `rlPillHTML`, the same pill the Rules table draws; every one writes and re-lays on the tap** | **⚙ Rules table** Days, ×/wk, Cap, Co-op day, Mom days, 📌 new lesson, First/last, Sticky, No-carry, seq (the table keeps drawing them too); **🧱 Builder** Days it can land on, Times per week — the Builder's staged copies go away, these are the only Days / times controls; card ⏰ Set time | `allowedDays` (`cbPinDay`), `pacing/tpw`+`timesPerWeek`, `cap`, `coopDay`, `noCoopDays`, `momDays`, `momDayMin`, `lessonDay*`, `rules` tokens, `stickyWith/Order`, `noCarry`, `fixedTime/fixedDates/joinUrl` — all through `rlSet` 53418 / `cbPinDay` 53397, re-lay as today |
| 3 | **The lessons** | the list (per-line rename · ✎ edit as a list with sort / trim / ×N days) · *Mark one done* (✓, ↓ through here, day it was done) · *Not done* (↩ chips, make contiguous, hand-marks ×) · *Lessons in order?* (Sequenced / Same every day — tracking) · *Days per lesson* · 📎 *Links & supplies for this subject* (the resources panel's subject defaults) | card Lesson list, ✓ Mark a lesson done, Lesson Tracking; the cell menu's 📎 subject-default half (`lrSetSubjectDefault` 39671) | `lessonSeq`/`lessonIds`/`nextLid`/`total`, `done/…`, `manualDone`, `tracking`, `curriculum/resources/<kid>/<sk>/_subject` |
| 4 | **Pace** (*was 🧱 Pacing & build*) | *How to pace it*: Finish by a date / So many a week / Until a date / By pages / Just minutes · mode fields (finish by, stop after, total pages · start page · pages a day · label · chapters · cell text) — **each writes its `pacing/*` leaf on the tap and re-lays through the same door the Rules table's ×/wk uses** (`rlSet(…, relay=true)` → `_gvRelaySubject`), so the grid's derived column IS the preview · *Where they are* (N of M done · ahead/behind · finishes ~date — the Progress block) · *Lay it out again* (= ↻ Rebuild this one subject, with the Keep/Dismiss gate when a legacy subject has leftovers, as today) · ↩ Undo the last lay-out · *Catch up now* (↻ Re-lay remaining) · *When behind* (extras on other days) · 📸 *Photo of the table of contents* (the scan, writes `pacing/pages/units` when she keeps the result) | 🧱 Builder form's mode + mode fields (now saved fields, not a staged form); card Progress, When behind, Re-lay remaining. **Not here:** *Start on* and *Preview* — those exist only inside the guided Add (initial setup), per her answer | `pacing/mode`, `pacing/targetDate`, `pacing/windowEnd`, `pacing/pages/*`, `pacing/minutesText` (new `rlSet` fields, same path `cbApply` writes today), then `cbApply`'s multi-path update via `_gvRelaySubject`; `planAnchor`, `overflowExtras` |
| 5 | **Lane** | "In lane *Math* · 2 of 3 · up now / waiting" · *Edit this lane* (opens the lane editor in 📅 *Kid*'s year) · *Stack a book after this one* (= `lnEditStart(null,sk)`) | ⚙ Rules ▸ 🛤 Lanes chips (53316) | none here (shortcuts) |
| 6 | **Checking off** | *You approve check-offs* (Mom check) · *Allow out-of-order check-offs* · *Timed card* (minimum minutes, show countdown) · *Mom's part* (whole / part · minutes · at the beginning) · *Record a score* (+ format) · *Reading log* (+ who logs) · *Opens a workbook* · *Opens a study session* · *Practice for* (dailies) | card sections 6–9, 14–17 | `momVerify`, `allowOutOfOrder`, `minMin`, `minShow`, `momPartMins/Start`, `scored`, `scoreType`, `readingLog(By)`, `workbook`, `study`, `practiceFor`, `practiceDayFrom` |
| 7 | **Links & supplies** | 🔗 lesson link template · button label · per-lesson overrides · **📋 the whole subject's 📎 links, supplies, books and notes in one table** (`lrpBuilderHTML` — today drawn only on the retired Builder tab) | card 🔗 Lesson link; **Builder tab 📋 Plan resources** (54560) | `lessonUrl`, `linkLabel`, `lessonUrls/<id>`, `curriculum/resources/<kid>/<sk>/…` |
| 8 | **Rewards** | 🏆 completion points · 📖 book milestones (+ points) | card sections 25–26 | `completionPoints`, `bookMilestones`, `bookPoints` |
| 9 | **Fix-ups** (Everything view only) | *Fix false check-offs* (walk back) · *Hand counts* (Completed / Schedule next-lesson / Clear them) · *Pace keyword · Starts week* · *Carry-over cap* · *Copy to another kid* · *Priority* | card sections 20–22, Carryover Cap; Builder Copy to another kid; Rules Priority | `pace/subjects/<kid>/<sk>`, `carryoverCap`, `priority`, `cbCopyTo` |

Every control keeps its function and its write. The **⚙ Rules table** stays exactly where it is and stays live (§3.3) —
it and the card call the same `rlPillHTML`. **The Builder as an editor goes away after setup**: the card's Pace section
holds the saved pacing fields (writing on the tap), the guided Add holds the Builder form for the first lay-out, and the
**Builder tab** (`renderCurrBuilder`) loses its two remaining doors — `⤒ Delete & shift up` (55006) and `Add it back…`
(55759) today jump to it to show a preview; after slice 3 each shows its one-time preview inside the card's Pace section
("Lay it out again?" with the same Preview card → Build / Cancel) and the tab is no longer reachable from any `onclick`.
It is then removed — after an audit — in slice 3b (her answer to question 4). One thing on that tab is a real feature with
no other door today: **📋 Plan resources** (`lrpBuilderHTML` 39922, the whole subject's 📎 links / supplies / books in one
table). It moves into the card's **Links** section (§3.2 row 7) in slice 3, before the tab goes.

### 3.3 The 📅 *Kid*'s year panel — every per-kid option

Replaces the two kid-tool buttons (`⚙ Rules & day cap`, `🏁 Target · Mom Check · Sessions`). One panel, four tabs:

| Tab | Holds | From |
|---|---|---|
| **Hours & load** | *Longest school day* (the day cap − / + · reset to school hours) · *Finish the year by* (target date · clear) · *You approve check-offs for this kid* (the Mom-check master) · door: *Family-wide hours, sitter, devices, order of the day → Settings* | ⚙ Rules day cap (53563); 🏁 panel target + Mom Check (57426–57428); Rules footer door (53644) |
| **School terms** (*was School Sessions*) | the sessions list and editor exactly as today (name, dates, kids, school days, points, song, goals, soft/hard, delete, new) | 🏁 panel `ceRenderSessions` 29725 |
| **Lanes** | the lane list and editor exactly as today (+ New lane, ✎ edit, ✕ remove, retire, ↩ Undo, "not stacked yet" chips) | ⚙ Rules ▸ 🛤 Lanes `lnRenderSection` 53316 — also opened by tapping a **🛤 lane band** in the grid |
| **All subjects** (*the ⚙ Rules table, live*) | the per-subject table exactly as today — one row per subject, every pill editable, writes and re-lays on the tap — drawn by the same `rlPillHTML` the card uses, so a change made here and a change made on the card are the same code path. Scrolls cleanly after RULESCROLL (§4.0). In Simple view the advanced columns (Co-op day, Mom days, 📌 new lesson, Sticky, If missed, Priority) are hidden, not removed. Above it, **Column order** (slice 7): the grid's columns in order, a lane as one entry, ▲ ▼ per entry, **Back to A–Z** | ⚙ Rules table `cbRenderRules` 53550 (her answer to question 2: "i like the rules table better than the builder"); Column order is new (question 6) |

### 3.4 What the grid itself keeps

Unchanged: lane bands, column headers (name · owed chip · ⏸ chip · "ends … · N behind"), the Day and Min columns,
week bands, Saturday overflow row, past rows, the done/moved/skipped/co-op/2nd/make-up badges, today's blue row. The
**cell** keeps exactly its per-lesson tools, because they are about *this lesson on this day*, not about the subject:
tap → **✎** edit text · **✓ done / ✓ Mark done (day it was done) / ↩ Not done** · **➡ move** (then tap the landing day) ·
**✕ off this day** · **🗑** · **↩ put back** · **✕ make-up** · **📎** (per-lesson links/supplies/notes) · **×**; empty cell →
type, **➕** make-up. Select mode (tap cells / a column / a day / two cells for a range; Clear · Delete & shift up · Fill ·
Deselect · Undo last) stays, entered from **⋯ More**. There is no drag today; none is added.

### 3.5 The words — before → after

The rule: a label names what a mom sees happen, in her words; a Howe term appears only where there is no plainer one
(**lane** stays — you like it — with a one-line explainer the first time a kid has none: "A lane is one column that books
take turns in: when one finishes, the next starts."). Internal names (`planBacked`, `plan-backed`, `one truth`, `lid`,
`skiplog`, `rebaseline`, `anchor`, `cursor`) never appear on screen outside the Checks drawer.

| Before (on screen today) | After |
|---|---|
| ⚙ Rules & day cap · Per-subject placement rules — the scheduler reads these; the grid follows | 📅 *Kid*'s year ▸ All subjects |
| 🏁 Target · Mom Check · Sessions | 📅 *Kid*'s year |
| Daily cap — no day over · min/day | Longest school day · minutes |
| 🏁 Finish Line Target | Finish the year by |
| School Sessions · Session dates anchor the week numbering… | School terms · "Term dates set which week is week 1." |
| Mom Check — require my approval for *Kid*'s checked-off work | You approve *Kid*'s check-offs |
| Mom Requirement · None / Maybe / Required | Needs you? · No / Sometimes / Yes |
| Device · Paper / Computer / iPad/Phone / Book / Keyboard | Where it happens (same five) |
| Duration (minutes) · Min | How long |
| Times Per Week · ×/wk · Times per week | How many times a week |
| Days · Days it can land on (none selected = any school day) | Days of the week (none lit = any school day) |
| Cap — most sittings of this subject in one day | Most in one day |
| sitting / sittings / 2nd sitting | a day's work / "twice in one day" ("2nd" badge → "again") |
| Lesson Tracking · Sequenced / Daily (no lesson #) | Lessons in order? · In order / The same every day |
| Scheduling Rules · sequential · sticky · first · last of day · last of own work · seq | Order in the day · in order · right after ___ · First thing · Last thing · Last of their own work |
| Stick with: · Before / After | Right after ___ / Right before ___ |
| No-carry · carries / day-bound | If it's missed · comes back tomorrow / skip it |
| Carryover Cap | How many missed ones can pile up |
| Priority · Low / Normal / High | If the day is tight · do it last / normal / do it first |
| ⏰ Set time — a class that happens at a fixed clock time · Off — packed into the day | A class at a set time · Off — the app picks the time |
| Meeting dates — optional, but exact | The dates it meets |
| 🧱 Pacing & build — days per week, allowed days, re-lay the plan | Pace |
| How should it be paced? · 🎯 Done by a date / 📅 Days per week / ⏳ Until a date / 📖 Pages / ⏱ Just minutes | How to pace it · Finish by a date / So many a week / Until a date / By pages / Just minutes |
| Preview build · ✓ Build into map · Build | Preview · Put it on the schedule (first time) · Lay it out again |
| ↻ Rebuild all (N) | Lay everything out again (N) |
| ↻ Re-lay remaining | Catch up — spread what's left from today |
| re-lay / re-lays / re-laid (in every tooltip) | "the week updates" / "moves the rest" |
| laid from where *Kid* actually is | starting from where *Kid* is |
| Start on (optional — nothing lands before this day; a kid with no grid yet gets one built from here) | Start on (optional — nothing before this day) |
| Units (one per day, real boundaries — overrides the pattern below) | Chapters (one a day — replaces the pages-per-day pattern) |
| 📸 Scan the book — Photograph the table of contents | 📸 Photo of the table of contents |
| plan-backed · 🧭 One truth — make a subject plan-backed · Builder-paced · master list | (never shown; Checks drawer: "uses its lesson list as the record") |
| owed N | behind by N |
| When behind · ✓ Extras can use other days / Only its own days | When it's behind · catch up on any school day / only on its own days |
| Fix false check-offs · 🧹 Walk back check-offs… | Undo check-offs that weren't really done |
| Completed (progress) · Schedule next-lesson · Pace keyword · Starts week | Hand counts (Everything view) · unchanged words inside, with one line each |
| Mark a lesson done · ↓ through here · ↩ Make done contiguous | Mark done · this and everything before it · put the skipped ones back |
| 📝 Practice for — the weekly lesson this daily card practices | Practice for |
| ⏱ Timed card — a minimum before it can be checked | Can't be checked off before (minutes) |
| 👩 Mom's part — how much of the N min needs you | Your part of it |
| 📊 Not in the Grid/Map yet · On their cards, not in the grid yet · No lessons to pace | Not on the schedule yet · Runs every day (no lessons to lay out) |
| 🛤 Lanes — a category: units run in order; when one finishes, the next takes its place in the grid · unit · single card / multiple card (pattern) · Rhythm: ↑ same as the one before / own | Lanes — books that take turns in one column · book · one book / several books taking turns (pattern) · Days & times: same as the book before / its own |
| ⤓ retire | File it away |
| Lesson Map · map · Build into map · Extends the map by N new days | the grid · adds N school days to the grid |
| Keep / Dismiss · ↪ Leftover lessons — keep or dismiss? · skipped earlier | Leftover lessons — do them later, or skip them for good? · Do later / Skip for good · skipped before |
| 🔍 N things to check · ⚖ Evening out · 🗓 Daily cards missed · 🆔 Assign lesson ids · 📥 Import completions · 🧹 Clear leftovers · 🧢 Fold into Cap · 📅 Fold into Days · Clear pace leftovers · Capture from the grid · Remove N from grid · Align weeks with calendar… · Add missing school days… | all inside **🔍 Checks (n)** — two groups: *Worth a look* (audit, evening out, daily missed, align, missing days) and *Tidy-up — one-time fixes for an older curriculum* (the rest) |
| ☑︎ Select cells · ✕ Done selecting · Sort by end date · Show N past days | ⋯ More ▸ Edit many cells at once · Order columns by end date · Show past days |
| tap a column name for the Builder | tap a subject's name to open it |
| 🏠 Family-wide day rules are in Settings — school hours · sitter · devices · workflow order · overlap · carry-over & Saturday | Family-wide: school hours, sitter, devices, order of the day → Settings |
| Workflow Orders (Settings) | Order of the day (Settings) — same card |

### 3.6 Progressive disclosure — Simple and Everything

One family-wide switch, `config/ui/curriculum/view` = `"simple"` | `"everything"`, in ⋯ More as **Show everything /
Keep it simple**. **Every family starts on Simple — hers included** (her answer to question 3: *"3 per family"*, then
*"lets put us on simple as well"*). There is no start rule by grid size: the owner with the biggest grid chose Simple, so
Simple is the page, and Everything is one tap away in ⋯ More ▸ **Show everything**, remembered per family (one value for every
device, not per device). The slice ships with the switch absent from the database, which reads as Simple.

**Simple hides and never deletes.** Every control on the page today is still reachable after the flip; the hidden ones are
rendered, with the same handlers and the same writes, the moment the switch is on, and the slice tests assert that the
Everything view is byte-identical to the end of slice 5. What Simple hides: card §5–9 and the Lane section until the kid has
2+ subjects with lessons; the advanced columns of the All-subjects table (the table itself stays); the plan bar's three
strips; ⋯ More ▸ Edit many cells / Order by end date; the Checks drawer's *Tidy-up* group; on the Add flow, everything behind
*More options*. A one-line footer on the card says "More options are under **Show everything** (⋯ More)".

**A hidden check is never silently invisible.** The 🔍 Checks drawer's badge counts **every** true condition, Tidy-up
included, in both views. In Simple the drawer shows the *Worth a look* rows in full and, under them, one line per hidden
group: "**n more under Show everything** — one-time tidy-ups for an older curriculum", which is itself the tap that flips the
switch. So a migration banner she needs (Assign lesson ids, Import completions, Fold into Cap, Remove N from grid …) still
counts, still names itself, and is one tap away — it is folded, not gone.

### 3.7 The first-subject guided flow (＋ Add subject)

The same sheet, in four short steps, ending **on the schedule** — the Add sheet and the Builder become one path. Every
field the Add sheet has today is still there, under **More options** on step 3; the saved record and the build writes are
identical to today's Add → 🧱 → Preview → Build.

| Step | Screen | Fields (defaults in brackets) | Behind *More options* |
|---|---|---|---|
| 1 · **What is it?** | name · *Who does it* (this kid; two or more → it becomes family time, as today) · *What kind*: 📖 **A book or course with lessons in order** [default] · 🔁 **Something they do every school day** · ⏰ **A class at a set time** | maps to tracking sequenced / daily / fixedTime | — |
| *(the Builder form lives here and only here — steps 2–4 are `cbRenderForm`'s fields re-chunked; **Start on** is the one field that stays staged, because it only means anything at the first lay-out)* | | | |
| 2 · **The lessons** (books only) | **How many lessons?** [50] with *they're called* Lesson / pg / Ch. / Unit… and *start at* [1] · or **Type the list** · or 📸 **Photo of the table of contents** (when the family has an AI key — the Builder's scan) · or **It's a workbook — go by pages** (total pages, start page, pages a day) | lessonSource auto / manual; pacing mode pages | Days per lesson |
| 3 · **When** | **Days of the week** [Mon–Fri] · **How many times a week** [= days lit; tap to make it fewer] · **How long** [25 min] · **Needs you?** [No] · **Finish by** [blank → "so many a week" pacing; a date → "finish by a date"] | allowedDays, tpw, minutes, mom, pacing mode | Where it happens · Order in the day · Right after ___ · If it's missed · Most in one day · How many missed can pile up · If the day is tight · set-time dates & join link · Study session |
| 4 · **Here's the plan** | the Builder's preview card (first weeks, finishes ~date, "starts from where *Kid* is") · **Put it on the schedule** · *Back* | `ceAddSave` → `cbRunPreview` → `cbApply` in one tap (the sequence today's Add runs across two sheets) | — |

After step 4 she is back on the grid with the new column highlighted and a toast: "On the schedule. Tap its name any time
to change it." No sheet re-opens itself. A **Show all options at once** link on step 1 opens today's single-page sheet, so
nothing is lost for you.

### 3.8 Before / after tap counts

| Task | Today | After | What actually changed |
|---|---|---|---|
| First subject from a book → on the week (§2.1) | 21 taps · 5 screens · 20 Howe words · 5 forced decisions · 3 things asked twice | **16 taps · 3 screens · 2 Howe words · 0 forced decisions · 0 asked twice** (Mom switch + code 1 · Mom's Day 1 · School 1 · Curriculum 1 · ＋ Add 1 · name 1 · Next 1 · how many 1 · Next 1 · days 2 · minutes 1 · needs you 1 · Next 1 · Put it on 1 · Schedule 1) | one path, defaults that are the common case, plain words |
| Change days a week 3 → 4 (§2.2) | 2 taps if she knows it is under ⚙ Rules; 5 via the card and the Builder | **2** either way — 📅 *Kid*'s year ▸ All subjects ▸ + (the table), or name ▸ How many times a week + (the card); the same pill, the same write, on the tap | one editor drawn twice; the Builder path (stage, preview, build) is gone |
| Pause / resume (§2.3) | 2 / 2 | **2 / 2** (name ▸ ⏸ in the header; ⏸ strip ▸ name ▸ ▶) | pause is at the top, not section 27 |
| Delete (§2.4) | 3 | **3** (name ▸ ⋯ ▸ Delete ▸ confirm) | same |
| Reorder books in a lane (§2.5) | 4+ via ⚙ Rules ▸ Lanes ▸ ✎ edit | **3** (tap the 🛤 band ▸ ▲▼ ▸ Save) | the band is the door |
| Reorder columns | not possible (alphabetical only) | **3** (📅 *Kid*'s year ▸ All subjects ▸ Column order ▸ ▲ or ▼; Back to A–Z is 1) | new in slice 7, her answer to question 6 |

---

## 4 · Build plan — a pre-slice fix, seven slices, and a two-part cleanup after slice 3

Each slice is one branch off `origin/main`, one PR, its own `test_<feature>.js` that slices the block by its
`// NAME_START … NAME_END` markers, replays the affected doors on stubs and asserts (a) every pre-existing control is still
rendered somewhere in the Everything view and (b) every Firebase write path is unchanged for the same inputs. The page
works fully after every slice; nothing is removed at any point — a control only moves once its new home renders.

### 4.0 · RULESCROLL — the Rules table jumps to its top on every tap (ships before slice 1)

**Her report (2026-11-10):** *"if i click something [in the Rules table] it takes me back to the top instead of allowing me to
edit cleanly without movement."*

**What the code does on a Rules-table tap, in order** (verified by reading, not run):

1. The pill's `onclick` is `rlSet(kid,sk,field,val,relay)` 53418 (or `cbPinDay` 53397 for a Days pin, `lsdToggleDay` 34260 /
   `cwdPinDay` 41812 which call `rlSet`). Both save **only the panel's inner vertical scroll**:
   `cbDayPinScroll = document.getElementById("cb-daypin-scroll").scrollTop` (53400, 53422). `scrollLeft` is never saved.
2. The write happens, then `renderAll()` (53452). For a Days / ×/wk / Cap / Min / Co-op / Priority pill on a plan-backed
   subject, `_gvRelaySubject` (56770) runs first → `cbBuildGate` → `cbApply` → its own `renderAll()` (54146) → `relayWeek("build")`,
   whose chain calls `renderAll()` again ~2 s later (43699 / 43773).
3. Every `renderAll` goes through `_preserveUI` (4975): it snapshots `window.scrollX/Y`, rebuilds `#content`, and **restores the
   window scroll when the view signature is unchanged** (`_viewSig` 4962 = tab · admin flags · adminSubTab · histTab · mastView ·
   day · kid). `rlSet` changes none of those, so **the page's own scroll position is kept** — on Mom's Day ▸ School ▸ Curriculum
   as on Schedule ▸ Admin.
4. The rebuild redraws the Rules panel from scratch: `renderCurrGrid` 57421 → `cbRenderRules` 53550 → a fresh
   `<div id="cb-daypin-scroll" style="max-height:340px;overflow:auto">` (53583) with its scroll at **0, 0**. The only line that
   puts `cbDayPinScroll` back is **54507, inside `renderCurrBuilder` — the retired Builder tab**. `renderCurrGrid`'s post-render
   restore (58049–58054) restores `.gv-wrap` (the lesson grid) and focuses the cell editor; it never touches the Rules box.

**So the diagnosis is:** the window does not move; the **340-px table box snaps back to its first row and its first column**
on every tap — and Lincoln's table is 20+ rows tall and 19 columns wide, so the row she was editing scrolls out of view and
the column she was in slides off the right. Twice when the tap re-lays (the relay's own render, ~2 s later, resets it again
even if she has scrolled back). On a phone the horizontal snap is the bigger half: `scrollLeft` was never saved anywhere.
If she means the **whole page** goes to the top, the only candidates are a navigation call (`mpGoto` 25331, `mpSchoolOpen`
25272 — neither runs here) or the Keep/Dismiss gate opening for a legacy subject (a modal, which reads as "movement") — worth
one look on her device, but the box snap is certain from the code.

**The fix (one block, `// RULESCROLL_START … RULESCROLL_END`, ~15 lines):**

- `rsGrab()`: read `#cb-daypin-scroll`'s `scrollTop` **and** `scrollLeft` into `cbDayPinScroll = {top,left}`; called at the
  **top of `renderCurrGrid`** (and `renderCurrBuilder`) while the old box is still in the DOM — so it also covers the renders
  that are *not* a tap (the relay chain's `renderAll`, a Firebase-triggered `renderAllSoon`), which the two existing
  per-tap saves in `rlSet`/`cbPinDay` miss. Those two saves stay (harmless) or call `rsGrab()`.
- `rsRestore()`: put both back; called in `renderCurrGrid`'s existing post-render `setTimeout` (58049) next to the `.gv-wrap`
  restore, and in place of 54507 on the Builder tab. Clamped by the browser if the table got shorter.
- Nothing written to Firebase; no behaviour change beyond the box staying put.

**`test_rules_scroll.js`:** slices the block; a fake `document` whose `getElementById("cb-daypin-scroll")` returns an object
with `scrollTop`/`scrollLeft`; asserts `rsGrab` captures both axes, `rsRestore` writes both back, `renderCurrGrid`'s source
calls `rsGrab` before `el.innerHTML` is assigned and `rsRestore` inside its `setTimeout`, `renderCurrBuilder` still restores,
`rlSet`/`cbPinDay` still save before their write; mutation check: with the block removed, the grid path has no restore.
Also pins that `_preserveUI` still restores window scroll for an unchanged `_viewSig` (the half that already works, so a
later change cannot quietly break it). Risk: very low — display state only.

| # | Slice (block) | What moves | Test asserts | Risk |
|---|---|---|---|---|
| 1 | **CURRWORDS** — the words | One label map (`CW` = {old key → plain label}) used by the grid, card, Add sheet, Rules panel, Builder, gate, banners; tooltips rewritten per §3.5. No logic. | every "before" string of §3.5 is absent from `index.html`'s on-screen strings (allow-list for code comments); every existing `test_*.js` that pins a label updated in the same PR; byte-identical DOM apart from text nodes | low — but it touches ~60 tests' string pins; do it first so every later slice is written in the new words |
| 2 | **CURRCARD** — one subject card, one pill function | (a) `rlPillHTML(kid,sk,field)` is lifted out of `cbRenderRules` 53550 — the table's cells become calls to it, byte-identical output. (b) `ceRenderEditSheet` is re-sectioned per §3.2; **Basics / When it runs** are `rlPillHTML` calls for the same fields, so every setting **writes and re-lays on the tap** (her answer to question 1) — `rlSet` 53418 / `cbPinDay` 53397 unchanged. (c) `rlSet` learns the **pacing fields** (`mode`, `targetDate`, `windowEnd`, `pages/*`, `minutesText`) with `relay=true`, writing the same `pacing/*` leaves `cbApply` writes today, then `_gvRelaySubject`; the card's **Pace** section draws them as pills, and the Builder form (`cbRenderForm`) is **no longer drawn in the card** — `ceOpenBuild` / `_ceMaybeBuilder` / the 🧱 button go, "Lay it out again" (= `_gvRelaySubject` for this subject) and ↩ Undo stay. (d) Progress, When behind, Re-lay remaining fold into Pace; pause to the header | for each of the 20 `rlSet` fields + `allowedDays` + the 5 pacing fields: exactly ONE function writes it, and the table's pill and the card's pill are the same string for the same subject; `cbRenderRules` output is byte-identical to before the slice; for a given subject the `pacing/*` leaves a card tap writes equal what `cbApply` wrote from the equivalent form; the derived column (`gvDerivedColumn`) after a card tap equals the preview the Builder would have shown for the same fields; section visibility (daily vs sequenced × plan-backed vs legacy × paused × class) matches today one for one; `cbRenderForm` is referenced only from the Add flow / Builder tab | **highest — see below** |
| 3 | **KIDYEAR** — 📅 *Kid*'s year | The two kid-tool buttons become one panel with Hours & load / School terms / Lanes / **All subjects (the live ⚙ Rules table, unchanged)**; the Builder tab's two doors (`gvSelShiftUp` 55006, `gvAuditFixGap` 55759) show their one-time preview in the card's Pace section instead; a 🛤 band tap opens the Lanes tab on that lane | `curriculum/dayCap`, `targetEnd`, `momVerifyKid`, `pace/plans`, `curriculum/lanes` writes unchanged; the table renders inside the panel with the same `rlPillHTML` output and keeps its scroll (RULESCROLL); every lane control present; `renderCurrBuilder` no longer reachable from any `onclick` | medium — the lane editor keeps its state (`lnEdit`) across a panel re-render |
| 3a | **LMCLEANUP-audit** — prove the dead code is dead (no deletion) | A read-only pass that produces `AUDIT_lessonmap_dead_2026-11-xx.md` (committed on its own, before any deletion): for every name in §4.3 below, its definition line, every reference in `index.html` with the line's purpose (live code · dead branch · comment · its own body), every `test_*.js` that pins it, and for the state variables which live code reads them. Backed by a Node harness `audit_lessonmap_dead.js` that loads `index.html` in a vm with the dead branch forced unreachable and asserts no reachable `onclick`/`onchange`/caller names them. Plus one **data** check on her device, read-only: whether any `scheduleOverrides/<date>/<kid>/added` entries still carry the old Extend make-ups (`flExtendMakeupCount`), because the only "Clear make-ups" button is in the dead branch | the audit file lists every name with a verdict: **keep** (reachable), **move** (a feature with no other door), **go** (dead); the harness passes; no file in the repo other than the audit doc and the harness changes | low — it writes nothing |
| 3b | **LMCLEANUP** — the deletion | Removes exactly the **go** list from the audit; re-points the three live callers of the dead names (§4.3); updates the tests that pin them; simplifies the router (`case "curriculum": currInnerTab="subjects"` 6942 → `"grid"`) and drops the one-chip "Grid" bar (`_cvBar`, 29266–29274) that only existed as the way back from the Builder tab | `test_lessonmap_cleanup.js`: every **go** name is absent from `index.html`; every **keep** writer is present and its body byte-identical to before; `_normOrderArr` still reads a stored `order` override (the generator's 44629 / 84103 read is unchanged); the grid's ➡ move, ✕ off day, ➕ make-up, ↩ put back and Align still call the kept functions; `renderCurriculumView` has one branch; the whole `test_*.js` suite is green; `index.html` is smaller by at least 90 KB | medium — a wrong "go" removes a live door; the audit commit is the protection |
| 4 | **CURRTOOLS** — toolbar and the Checks drawer | Toolbar = kid chips · 🏡 · ＋ Add · 📅 · ⋯ More (Show past days · Edit many cells · Order columns by end date · Lay everything out again · Show everything/Keep it simple); the 14 banners + audit + evening-out + daily-missed render inside one `🔍 Checks (n)` drawer in two groups, collapsed, drawn only when n > 0 | with each banner's condition forced true, its buttons render inside the drawer with the same `onclick`; the count badge equals the number of true conditions; with all false the drawer is absent and the grid is byte-identical | low |
| 5 | **ADDFLOW** — the guided Add | `ceRenderAddSheet` gets a `step` (1–4) and a *More options* expander; step 4 runs `ceAddSave` → `cbDefaultForm` → `cbRunPreview` and its button runs `cbBuildGate`; "Show all options at once" renders today's sheet; after the build, no card re-opens (today's `ceOpenEdit` at 34988 is skipped only when the flow built) | for the same answers, the subject record written by step 4 equals today's `ceAddSave` record and the build writes equal today's Add → Build; a brand-new kid with no grid builds from the synthetic Wk 1 (`cbExtendInfo` 53003); a daily subject skips steps 2 and 4; two kids → `famWhoSave` as today | medium — chains two write doors in one tap; the gate (`cbBuildGate`) must still be able to appear for a legacy subject copied in |
| 6 | **CURRSIMPLE** — Simple / Everything | the `config/ui/curriculum/view` switch (absent = Simple, for every family, hers included); hiding per §3.6; the Checks badge counts hidden Tidy-up conditions and the drawer's "n more under Show everything" line | in Everything the page is byte-identical to the end of slice 5; in Simple every hidden control is absent and nothing else changes; with the switch flipped every hidden control renders with the same `onclick` and write as in Everything; with a Tidy-up condition forced true in Simple the badge count includes it and the drawer carries the "n more" line; no start rule by grid size exists in the code | low |
| 7 | **COLORDER** — a custom column order (her answer to question 6) | Columns stay **alphabetical by default** (`lnFoldColumns` 52917 sorts the folded column keys by label today). A **Column order** list in 📅 *Kid*'s year ▸ All subjects shows the grid's columns in their current order — a lane is one entry (🛤 name), as it is one column — each with **▲ ▼**, plus **Back to A–Z**. One pure function `gvColOrder(cols, saved, labelOf)` sits between `lnFoldColumns` and the grid: no saved order → alphabetical (today's result, byte-identical); a saved order → that order for the keys that still exist, **deleted columns dropped, new columns appended alphabetically at the end**; cleared → A–Z. The saved order is `curriculum/colOrder/<kid>` = an array of column keys (`<sk>` or `lane:<id>`), written by one targeted `set` on each ▲/▼ tap and `remove` on Back to A–Z, Mom only, display only — **no re-lay, no card moves**. **Sort by end date coexists** as it is: a per-device view toggle that writes nothing; **a custom order wins while one is set** — the end-date button then reads *Order by end date · off while a custom order is set — Back to A–Z first*, so the two never fight over the same columns. The 🏡 Family grid has its own grouping and is not touched. | `test_col_order.js`: the pure function — alphabetical when `saved` is null; the saved order kept for existing keys; a new subject appears at the end in alphabetical position among the appended; a deleted subject is dropped; a lane key moves as one column; clearing restores A–Z exactly; ▲ on the first and ▼ on the last are no-ops; the write is `curriculum/colOrder/<kid>` `set` of the whole small array (targeted to the kid) and `remove` on clear, nothing else written; with end-date sort on and no custom order the end-date order applies, with a custom order set it does not; the grid header markup is byte-identical apart from order | low — display only; the only new write is one small per-kid array |

**Slice 7 — arrows, not drag (her addendum: "or arrows to change if that's better").** Recommendation: **arrows, and no drag
on the column headers at all.** The grid is 19 columns wide on a tablet and lives inside its own sideways-scrolling box
(`.gv-wrap`), so a horizontal drag on a header fights the scroll gesture the kids and she already use; the header's one tap
opens the card, so a drag would need a long-press or a grip handle and an explanation a new mom has to be given; the LG
StanbyME is driven by remote-style taps where a drag is awkward at best; and lanes fold several subjects into one column, so
a header drag would have to move the band and its members as one. An ordered list with ▲ ▼ is unambiguous, needs no gesture
or hint text, works on every device the family uses, and shows the whole order at a glance — the same pattern the lane
editor already uses for its books (`lnEditMove` 53201). The saved order and the pure function are identical either way, so if
she later wants a drag on a big screen it can be added without touching the data.

**The riskiest slice is 2 (CURRCARD)**, for two reasons. First, it is the slice that changes *when* a write happens for the
**pacing fields**: today "finish by", "pages a day", the mode itself are **staged** in `cbForm` until Build, while the Rules
table's pins and ×/wk write **at once and re-lay the week** (`cbPinDay` 53397, `rlSet(…,true)` → `_gvRelaySubject`). Her
answer makes them all write on the tap; that means a tap on "By pages" re-paces a whole column with no preview step —
the grid's derived column is the preview, and ↩ Undo is the safety (the same safety every Rules-table tap relies on today).
The subject-by-subject risk is a legacy (not plan-backed) subject, where `_gvRelaySubject` can open the Keep/Dismiss gate
mid-tap — that is today's Rules-table behaviour too, so nothing new, but the card has to render the gate above itself as it
already does for the Builder (z-index 320). Second, it rewrites the ~2,000-line card that eleven other features render into
(`cePracticeSectionHTML`, `ceMomPartSectionHTML`, `mmEditorSectionHTML`, `fxDoor*`, `llSet*`, `_ceMarkDoneUI`, the walk-back
panel, LESSONRES, the Builder, the gate, the restore-point banner), each gated by its own condition — the test has to replay
every condition pair (daily / sequenced × plan-backed / legacy × paused × class) and prove the same sections appear. The
shared `rlPillHTML` is no longer a stop-gap but the design: one function, two drawings (card and table), zero staged copies.

### 4.3 · LMCLEANUP — what the audit has to rule on (pre-audit by reference count, 2026-11-10)

Her words: *"lets remove and clean up but def audit to make sure it causes no issues before you do it."* Below is the
candidate list from a word-match count over `index.html` and `test_*.js` on b4e8689 — the **starting list for 3a, not its
result**. Counts include the definition line. "Dead branch" = the Subjects branch of `renderCurriculumView` (29291–29597).

**Keep — reachable from the live grid or the generator (named explicitly; 3b must not touch their bodies):**

| Name | Why it stays | Live callers |
|---|---|---|
| `lmDropSlot` 58686 → `lmRemoveSubj` 58679 | ✕ off day · ✕ make-up | `gvMenuOff` 56145, `gvMenuOffAdded` 57005 |
| `lmRestoreSubj` 58697 | ↩ put back | `gvMenuRestore` 56782 |
| `lmAddSubj` 58701 | ➕ make-up | `gvMenuAddMakeup` 57012 |
| `alignPlanPreview` 58793 · `alignPlanApply` 58847 · `lmWeekAnchor` 58778 · `lmWeekNumOfDate` 58783 | the Align banner and its preview | grid 57701 / 57707; pinned by `test_lanes_grid.js`, `test_lanes_nothing_drops.js` |
| `_lmKidOff` 59032 | kid-off check inside the cell tap and the move target | `gvOpenCell` 56128, `gvPickMoveTarget` 56811 / 56818 |
| `_normOrderArr` 58717 | the **generator reads** a stored per-day `order` override | 44629, 84103 (+ 15 tests). Its only *writers* (`lmNudgeSubj`, `lmResetOrder`) are dead — existing stored orders keep working, nothing new can write one; say so in the audit |
| `lmMovePick`, `lmMoveWeek` (state) | the grid's own ➡ move is armed on `lmMovePick` and cleared with `lmMoveWeek` | `gvMenuStartMove` 56788–56795, `gvPickMoveTarget` 56805–56814, the banner 57726–57730, the row class 57898 |
| `currViewKid` 2967 | the grid falls back to it for its first kid | `renderCurrGrid` 57387 (2 tests) |
| `ceRenderSessions` 29725, `ceSessToggle` 29724, `ceSetTargetEnd`, `ceToggleMomVerifyKid`, `downloadCurrTemplate` 35262, `ceWorkflowTier` 27756 | drawn by the live 🏁 panel / Admin panel / Settings matcher (79083) — only their dead-branch *buttons* go | — |

**Move — a feature whose only door is the dead code (3 names, moved in slice 3 before 3b runs):**
`lrpBuilderHTML` 39922 (📋 Plan resources → the card's Links & supplies); the two Builder-tab doors `gvSelShiftUp` 55007 and
`gvAuditFixGap` 55760 (`cbOpenSubj` + `cbRunPreview` → their one-time preview in the card's Pace section); and `cbCopyTo`
53487–53488, which lands in the target kid's Builder tab (`cbSetKid`, `cbOpenSubj`) → lands on the copy's card instead.

**Go — defined, never reached (the deletion list, pending the audit):**

| Group | Names | Lines · bytes | Tests that pin a name |
|---|---|---|---|
| The dead Subjects branch of `renderCurriculumView` | everything after the grid `return` (29291–29597): kid chips, Template, Generate, Scheduling Setup, the Finish Line Target / Sessions / Mom Check copies, tier groups, `ceBuildCard` cards, Lesson Map (N weeks), the By-Week day cards, Make-up suggestions, Whole-week-off note; `setCurrViewKid`, `setCurrViewWeek`, `currViewWeek` 2968 | ≈24.5 KB | — |
| The Subjects-page card and its embedded Builder | `ceOpenBuild` 29604, `_ceMaybeBuilder` 29610, `ceBuildCard` 29626 (after slice 2 removes the 🧱 from the card sheet, `ceOpenBuild`'s last live caller at 32648 / 32862 / 54551 is gone) | 29604–29723 · ≈7.9 KB | — |
| Lesson Map UI and its state | `lmToggleDayOff`, `lmOpenAdd`, `lmLessonByDate`, `lmDayRunOrder`, `lmNudgeSubj`, `lmResetOrder`, `lmWeekMonday`, `lmRenderOffWeek`, `lmSchedCheckState`, `lmRenderMovePicker`, `lmSetView`, `lmCalData`, `_lmWeekMon`, `lmCalDayChips`, `_lmDayKind`, `lmSelSubj`, `lmEditSlotOpen`, `lmEditSlotCancel`, `lmEditAddedOpen`, `lmSaveAddedText`, `lmSaveSlotText`, `lmOpenMove`, `lmPickMoveWeek`, `lmMoveSlot`, `lmRenderSubjectView`, `_lmSnapMove`, `_lmRestoreOverride`, `_lmLessonEntry`, `_lmMovingVal`, `lmMoveDay`, `lmSubjJumpWk`, `lmSubjStepWk`, `lmRenderSubjectGrid`, `lmComputeSuggestions`; state `lmViewMode`, `lmEditSlot` (one dead read inside `lmDropSlot` 58694 goes with it), `lmAddOpen`, `lmSubjKey`, `lmSubjWk` | inside 58673–59450 · ≈45 KB of its 49.7 KB | `test_relay_curriculum_doors.js` (`lmSaveSlotText`, `lmEditSlot`), `test_coop_week_days.js` (`lmComputeSuggestions`), `test_one_calendar.js` (`lmCalData`, `lmCalDayChips`, `_lmDayKind`), `test_cleaning_day.js` (`_lmDayKind`) — the audit says per test whether it only stubs the global or asserts behaviour |
| The ◀▶ move and its Undo banner | `gvMenuMove` 56133 (never drawn), `lmMoveDay`, `lmUndoMove` 59229, `lmLastMove` 58992 and the grid banner 57733–57738 | — | `test_lanes_grid.js`, `test_lanes_nothing_drops.js` (`lmLastMove` as a stubbed global) |
| The Builder tab | `renderCurrBuilder` 54440, `cbSetKid` 54392, `cbSummaryToggle` 53492, `cbRenderSummary` 53495, `cbCloseSubj` 54430, `cbOpenSubj` 54393 (after the three moves), `cbJumpTo` 54425, `gvJumpBuilder` 57082, `cbFamilyRulesToggle` 53156, `cbFamilyRulesOpen`; the router case 6943 (`"builder"`), the HQ comment rows 8426–8427, the `_cvBar` one-chip bar | 54440–54537 ≈7.9 KB + 53492–53549 ≈3.3 KB | `test_relay_curriculum_doors.js` (`cbSetKid`, `cbOpenSubj`), `test_grid_audit_gapfix.js` (`cbOpenSubj`), `test_lr_planner.js` (`lrpBuilderHTML` — moves, so the test re-points) |
| Finish Line Extend | `renderFinishLine` 60135 (never called), `flExtendSubject` 60073, `flExtendMakeupCount` 60170, `flUndoExtend` 60181 — **after** the device data check shows no leftover Extend make-ups (if there are some, the one-time "Clear make-ups" runs first, by her tap) | 60073–60203 · ≈7.7 KB | — |

**The one decision in the list — the "Moved … ↩ Undo" banner at 57737.** Options: keep it and give it a live trigger, or
let it go with `lmMoveDay` / `lmMoveSlot`. **Recommendation: go.** The grid's own ➡ move (`gvPickMoveTarget` 56804) does not
use that path; it parks through `scheduleOverrides` + `cbApply` and has its own Undo (`_gvDelUndo` folded into the build's
↩ Undo, and a cancelled gate rolls the park back — 54201). A second Undo banner for a move nobody can make would only confuse.

**Size.** The go list is ≈95 KB of a 7.37 MB `index.html` (≈1.3 %) — small, but every byte is parsed on the LG StanbyME at each
boot and each reload, and this is dead weight with zero risk once the audit confirms it. `test_lessonmap_cleanup.js` pins the
byte win so it cannot creep back.

Not in any slice (unchanged on purpose): the generator/scheduler, every re-lay door (RELAY4), `cbApply`, `relayWeek`, the
cell menu's actions, lanes' data model, Settings, 📅 This week, the Family-time editor's internals.

---

## 5 · Open questions for you (each with my default)

Status 2026-11-10: **all six answered**, each folded into the section it touches. Nothing in this plan waits on a decision.

1. ~~**Days and times-a-week: write at once, or stage until "Lay it out again"?**~~ **Answered 2026-11-10: write at once.**
   *"i like the rules table better than the builder i want to get away from builder except for the initial setup."* Every
   per-subject setting — days, times a week, most in one day, minutes, and now the pacing fields too — writes and re-lays
   on the tap, Rules-table style. The Builder form is drawn only inside the guided Add (initial setup); "Start on" is the
   one field that stays staged there. Folded into §3.1, §3.2 (sections 2 and 4), slices 2 and 3.
2. ~~**The ⚙ Rules table: keep its cells editable or make them shortcuts into the card?**~~ **Answered 2026-11-10: it stays a
   live editor** — it is how she works. Reconciled with the "one spot" rule by making the table and the card's *When it
   runs* section **one control drawn twice** through `rlPillHTML` (§3.1): one function writes each field, drawn in the
   table for twenty subjects at once and on the card for one. The "cells become shortcuts" step is dropped from slice 3.
3. ~~**Simple / Everything: per family or per device? And where does your family start?**~~ **Answered 2026-11-10: per
   family, and everyone starts on Simple** (*"3 per family"*, then *"lets put us on simple as well"*). `config/ui/curriculum/view`
   is one value for every device; the lane-or-8-subjects start rule is dropped — hers, both beta families and every new
   family start on Simple, and Everything is one tap away in ⋯ More ▸ Show everything, remembered per family. Simple hides and
   never deletes; the Checks badge still counts hidden Tidy-up items. Folded into §3.6 and slice 6.
4. ~~**The 41 unreachable Lesson Map controls and the Builder tab** — leave or remove?~~ **Answered 2026-11-10: remove and
   clean up, audit first.** *"lets remove and clean up but def audit to make sure it causes no issues before you do it."*
   Now slices 3a (audit only, its own committed `AUDIT_lessonmap_dead_2026-11-xx.md` + harness, nothing deleted) and 3b
   (the deletion, with `test_lessonmap_cleanup.js`), after slice 3 has moved the three features whose only door is the dead
   code. The keep / move / go lists and the one decision (the ↩ Undo banner at 57737 — recommendation: go) are in §4.3.
5. ~~**The words "Build" and "Rebuild".**~~ **Answered 2026-11-10: the plan's pick** (*"i like the plan's pick"*). **Put it
   on the schedule** for a subject's first lay-out (the guided Add's last button), **Lay it out again** for every later one
   (the card's Pace section), and **Lay everything out again (N)** for the kid-tools button that was ↻ Rebuild all. Already in
   the §3.5 word list; slice 1 (CURRWORDS) carries them.
6. ~~**Column order.**~~ **Answered 2026-11-10: yes.** *"i think alphabetical order but draggable to be in a customizable order
   as well"* — then *"or arrows to change if that's better."* Now **slice 7 COLORDER**: alphabetical by default, a per-kid
   custom order saved to `curriculum/colOrder/<kid>`, **▲ ▼ arrows** in 📅 *Kid*'s year ▸ All subjects ▸ Column order and a
   one-tap **Back to A–Z**; no drag on the headers (the reasons are under slice 7). The per-device Sort by end date stays a
   view toggle that writes nothing; a custom order wins while one is set.

---

## Appendices — the row-by-row inventory

Every control on the page, as read from the code on 2026-11-10. Columns: label as shown on screen · where it sits · what it
does · what it writes (Firebase path pattern; "re-lays week" = `_rlwCurrDoor`/`relayWeek`/`_gvRelaySubject`) · who · also
reachable from · code (function + line). Produced by four read-only passes over `index.html`; opinions kept out.

### Appendix A — the grid, its toolbar and banners, ⚙ Rules & Lanes, the 🧱 Builder, the plan bar (198 controls)

Conventions for this appendix:
Conventions used below:
- **Who** — the whole Curriculum page is behind `momHere()` (`renderCurriculumView` 29241). "Mom (page)" = no extra guard inside the function; "Mom (fn: momModeActive‖adminPinUnlocked)" = the function also checks `momModeActive||adminPinUnlocked`; "Mom (momHere)" = the function checks `momHere()`; "rmCanWrite" = `adminPinUnlocked || momPinUnlocked` (27785).
- **Writes** — Firebase paths. "curriculum update: a, b" = one multi-path `db.ref("curriculum").update({...})` touching those relative paths. "re-lays week" = the write is followed by `_rlwCurrDoor` / `relayWeek` (the one re-lay door, 43951 / 43575) or by `_gvRelaySubject` → `cbBuildGate` → `cbApply` (a full Builder re-lay of the subject with the Keep/Dismiss gate when leftovers exist). `scheduleOverrides` writes go through `setSchedOverride` → `saveScheduleOverrides` 58506, which diffs and does `db.ref("scheduleOverrides").update(diff)`.
- Groups of identical pills (Mon–Fri, five mode chips, kid chips) are ONE row each; the count at the end says how it was counted.

| # | Label as shown on screen | Where it sits | What it does | Writes | Who | Also reachable from | Code |
|---|---|---|---|---|---|---|---|
| **Grid — top row and kid tools** |||||||||
| 1 | `<Kid name>` (one chip per roster kid, e.g. `Lincoln`) | Grid top row | Switches the grid to that kid; clears edit / select / undo state | none (UI state) | Mom (page) | Builder tab kid chips `cbSetKid` 54452 (different state var) | `gvSetKid` 56028; markup 57396 |
| 2 | `🏡 Family` (`FAM_ICON+" Family"`) | Grid top row | Shows the family-subjects grid instead of a kid (no kid tools, no lesson table) | none | Mom (page) | — | `gvSetKid('__fam')` 57398; `famGridHTML` / `famHomePanelHTML` (out of scope) |
| 3 | `+ Add Subject` | Grid top row (hidden in Family view) | Opens the global add-subject sheet | none here (the sheet's writes are the subject card's) | Mom (page) | Subjects page (retired) | `ceOpenAdd` 34654; markup 57399 |
| 4 | `↻ Rebuild all (N)` | Kid tools row | Re-lays every Builder-paced or plan-backed subject of the kid from where they are; legacy subjects with leftovers go through the Keep/Dismiss sheet first; otherwise a confirm. One combined Undo | per subject (cbApply) one `curriculum` update: `lessons/<kid>/<dn>/<sk>` (clears + new cells), `lessons/<kid>/<dn>` = `{week,date}` for new rows (+ trailing-row prune), `weekDays/<kid>/<wk>`, `subjects/<kid>/<sk>/{pacing, allowedDays, days(null), timesPerWeek, total, planAnchor, pjExtras, lessonSeq/lessonIds/nextLid (rechunk)}`, `skiplog/<kid>/<sk>`, `rebaseline/<kid>/<sk>`, `lastEdit`; `pace/subjects/<kid>/<sk>/adjust`; re-lays week (`relayWeek("build")`) | Mom (fn) | Builder tab `↻ Rebuild all <Kid>'s subjects` 54497 (same `cbRebuildAll`) | `gvRebuildAll` 54736 → `cbRebuildAll` 54305 → `_cbRebuildAllRunInner` 54331 → `cbApply` 53930; markup 57413 |
| 5 | `⚙ Rules & day cap ▾` / `▴` | Kid tools row | Opens/closes the Rules panel under the row (closes any lane editor) | none | Mom (page) | Builder tab `⚙ Rules & day cap for <Kid>` 54478 | `gvRulesToggle` 54737 → `cbRulesToggle` 53155; markup 57415 |
| 6 | `🏁 Target · Mom Check · Sessions ▾` / `▴` | Kid tools row | Opens/closes the kid config panel | none | Mom (page) | — | `gvKidCfgToggle` 54738; markup 57416 |
| 7 | `↩ Undo` (green result banner, when `cbLastBuild` exists) | Under the kid tools row | Undoes the last build / delete / mark / park: restores every snapshotted path, pace `adjust`, park ✕ marks; re-projects this week's cards | `curriculum` update of the snapshotted paths; `pace/subjects/<kid>/<sk>/adjust` set; `scheduleOverrides` (via `saveScheduleOverrides`); `reprojectSubjectWeek` (targeted `week<n>/tasks` update) | Mom (page) | Builder tab banner 54463; subject card sheet 32652; `renderCurriculumView` 29620 | `cbUndo` 54358; markup 57419 |
| 8 | `×` (result banner) | Same banner | Clears the message | none | Mom (page) | — | inline `cbMsg='';renderAll()` 57419 |
| **🏁 Target · Mom Check · Sessions panel** |||||||||
| 9 | date input under `🏁 Finish Line Target` | 🏁 panel | Sets the kid's finish-line date; every subject of the kid re-lays this week | `curriculum/targetEnd/<kid>` set; re-lays week (`_rlwCurrDoor`, all the kid's pairs) | Mom (page) | `renderCurriculumView` 29334 | `ceSetTargetEnd` 33335; markup 57426 |
| 10 | `clear` | 🏁 panel (when a date is set) | Removes the target date; re-lays | `curriculum/targetEnd/<kid>` remove; re-lays week | Mom (page) | `renderCurriculumView` 29335 | `ceSetTargetEnd(kid,'')` |
| 11 | `ON` / `OFF` — **Mom Check** "require my approval for <Kid>'s checked-off work" | 🏁 panel | Toggles Mom verification for the kid | `curriculum/momVerifyKid/<kid>` set | Mom (page) | `renderCurriculumView` 29350 | `ceToggleMomVerifyKid` 32383; markup 57428 |
| 12 | `Edit` / `Done` (per School Session) | 🏁 panel ▸ School Sessions | Opens/closes that session's editor | none | Mom (page) | `renderCurriculumView` 29343 (same `ceRenderSessions`) | `ceSessToggle` 29724; `ceRenderSessions` 29725 |
| 13 | `Name` / `Start` / `End` inputs (session editor) | 🏁 panel ▸ Sessions | Edits the session's label and dates (week numbering anchor) | `pace/plans/<key>` set (whole plan record) | Mom (page) | 29343 | `updatePlanField` 51918 → `savePacePlan` |
| 14 | kid toggles (session editor) | 🏁 panel ▸ Sessions | Adds/removes a kid from the session | `pace/plans/<key>` set | Mom (page) | 29343 | `togglePlanKid` 51923 |
| 15 | school-day toggles (session editor) | 🏁 panel ▸ Sessions | Which weekdays the session runs | `pace/plans/<key>` set | Mom (page) | 29343 | `togglePlanSchoolDay` 51931 |
| 16 | `−` / `+` / number (session points) | 🏁 panel ▸ Sessions | Celebration points for finishing the session | `pace/plans/<key>` set | Mom (page) | 29343 | `ceSetSessionPoints` 29894 |
| 17 | song select (session) | 🏁 panel ▸ Sessions | Celebration song | `pace/plans/<key>` set | Mom (page) | 29343 | `ceSetSessionSong` 29901 |
| 18 | `▶` (session) | 🏁 panel ▸ Sessions | Previews the celebration | none | Mom (page) | 29343 | `celebSessionPreview` 29909 |
| **Grid — tidy-up / migration banners** (all Mom: drawn only when `momModeActive‖adminPinUnlocked`) |||||||||
| 19 | `Clear pace leftovers` | banner "N deleted subject(s) still ha(ve) pace records" | Removes pace records of subjects that no longer exist (confirm) | `pace/subjects/<kid>/<sk>` remove (per key) | Mom (fn) | — | `gvPurgePaceGhosts` 56002; markup 57498 |
| 20 | `Assign lesson ids` | 🆔 banner "N subjects (M lessons) don't have lesson ids yet" | Gives every lesson on each master list a permanent id, all kids (confirm) | `curriculum` update: `subjects/<kid>/<sk>/lessonIds`, `…/nextLid`, `lastEdit` | Mom (banner) | — | `gvAssignLids` 33587; markup 57512 |
| 21 | `↩ Undo` (✓ Lesson ids assigned …) | same banner slot | Removes the ids just assigned | `curriculum` update (ids back) | Mom (banner) | — | `gvAssignLidsUndo` 33606; markup 57585 |
| 22 | `Import completions` | 📥 banner | Turns existing check-offs / hand-marks into a done record per lesson (confirm lists the writes) | `curriculum` update: `done/<kid>/<sk>/<lid>`, `subjects/<kid>/<sk>/doneImportedAt`, `lastEdit` | Mom (banner) | — | `gvImportDone` 33734; markup 57518 |
| 23 | `↩ Undo` (✓ Imported N completions …) | same slot | Removes the imported records | `curriculum` update | Mom (banner) | — | `gvImportDoneUndo` 33756; markup 57521 |
| 24 | `<Subject> · N` (⚠ Finished out of order) | amber banner | Opens that subject's card to settle out-of-order check-offs | none here | Mom (banner) | column header tap (#59) | `ceOpenEdit` 32219; markup 57531 |
| 25 | `🧹 Clear leftovers` | 🧹 banner "N dismissed-lesson leftover(s) on M plan-backed subject(s)" | Clears inert skiplog entries on plan-backed subjects (confirm) | `curriculum` update: `skiplog/<kid>/<sk>` = null, `lastEdit` | Mom (banner) | — | `gvClearSkiplog` 33934; markup 57542 |
| 26 | `↩ Undo` (🧹 Cleared N leftover(s) …) | same slot | Puts the skiplog entries back | `curriculum` update | Mom (banner) | — | `gvClearSkiplogUndo` 34040; markup 57545 |
| 27 | `🧢 Fold into Cap` | 🧢 banner "N subject(s) still carry an old per-day cap (max1 word or Max/day list)" | Folds old max1 word + `config/rules/maxPerDay` list into one `cap` per subject, every kid (confirm) | `curriculum` update: `subjects/<kid>/<sk>/cap`, `…/rules`, `lastEdit`; `config/rules/maxPerDay` set null | Mom (banner) | — | `gvMigrateCaps` 34009; markup 57554 |
| 28 | `↩ Undo` (🧢 Folded caps onto N subject(s)) | same slot | Restores caps / rules / the old list | `curriculum` update; `config/rules/maxPerDay` set (previous) | Mom (banner) | — | `gvMigrateCapsUndo` 34029; markup 57557 |
| 29 | `📅 Fold into Days` | 📅 banner "N subject(s) still carry an old day rule (…)" | Folds no-fri / mon-thu rule words into Days pins (confirm) | `curriculum` update: `subjects/<kid>/<sk>/rules`, `…/allowedDays`, `lastEdit` | Mom (banner) | — | `gvMigrateDayTokens` 33962; markup 57566 |
| 30 | `↩ Undo` (📅 Folded N day rule(s) into Days pins) | same slot | Restores rules / pins | `curriculum` update | Mom (banner) | — | `gvMigrateDayTokensUndo` 33979; markup 57569 |
| 31 | `🧭 Make all N plan-backed` | 🧭 "One truth — make a subject plan-backed" banner (when >1 pending) | Marks every pending subject of the kid plan-backed (confirm lists each "next") | `curriculum` update: `subjects/<kid>/<sk>/planId`, `…/planAnchor` (= today), `lastEdit` | Mom (banner) | — | `gvMakePlanAll` 33894; markup 57579 |
| 32 | `🧭 <Subject>` | same banner, one chip per pending subject | Makes that one subject plan-backed (confirm) | same paths for one subject | Mom (banner) | — | `gvMakePlan` 33865; markup 57580 |
| 33 | `↩ Undo` (✓ <Subject> is plan-backed / 🧭 <Subject> is plan-backed) | same slot | Removes planId / planAnchor just written | `curriculum` update: `…/planId` null, `…/planAnchor` null, `lastEdit` | Mom (banner) | — | `gvMakePlanUndo` 33911; markup 57577 / 57583 |
| 34 | `Remove N from grid` | orphan banner "N deleted subject(s) still ha(ve) grid cells" | Clears grid cells, calendar and map overrides and pace records of subjects whose card was deleted (confirm; "This can't be undone") | `curriculum/lessons/<kid>` update (cells → null), `scheduleOverrides/<date>/<kid>` set (override entry rewritten), `pace/subjects/<kid>/<sk>` remove, `curriculum/lastEdit` | Mom (fn) | — | `gvPurgeOrphans` 56016 → `_gvPurgeSubject` 34563; markup 57601 |
| 35 | `Capture from the grid` | banner "N subject(s) ha(ve) no master lesson list" | Writes a master lesson list copied from the grid cells, exactly as they stand (confirm) | `curriculum` update: `subjects/<kid>/<sk>/lessonSeq`, `…/lessonIds`, `…/nextLid`, `…/total` (via `setLessonSeq`), `lastEdit` | Mom (fn) | — | `gvCaptureSeqs` 55038; markup 57612 |
| 36 | `↩ Put them back` (restore-point banner after an "Edit as a list" Save) | banner | Restores the planned cells a list Save cleared (confirm) | `curriculum` update (restored cells) | Mom (banner) | the subject card's own banner (`ceConvUndoBanner(kid,"card")`) | `ceConvUndoApply` 34442; `ceConvUndoBanner` 34481; markup 57625 |
| 37 | `Dismiss` (restore-point banner) | banner | Drops the restore point (confirm "can't be put back afterwards") | none (clears `HA_LS ha_convUndo`) | Mom (banner) | subject card banner | `ceConvUndoDismiss` 34426 |
| 38 | `Show` / `Hide` (🔍 N things to check in <Kid>'s plan) | audit strip | Opens/closes the audit list | none | Mom (banner) | — | `gvAuditToggle` 55876; `gvAuditRender` 55878 |
| 39 | `Show me` (per finding) | audit strip | Jumps to that cell and opens it for editing (shows past days if needed) | none | Mom (banner) | — | `gvAuditGoto` 55765 |
| 40 | `Delete the 2nd` (dup finding) | audit strip | Deletes the later duplicate cell (confirm; past copies refused) | `curriculum` update: `lessons/<kid>/<dn>/<sk>` null, `lastEdit`; `subjects/<kid>/<sk>/total` set (recount; re-lays week on change) | Mom (fn) | `🗑` (#72) and `🗑 Clear` (#48) also null a cell | `gvAuditFixDup` 55707 |
| 41 | `Make consistent` (mixed dashes finding) | audit strip | Rewrites the dash character in every future cell (and the list for plan-backed) | `curriculum` update: `lessons/<kid>/<dn>/<sk>` (texts), `subjects/<kid>/<sk>/lessonSeq` (+ids restored) when plan-backed, `lastEdit` | Mom (fn) | — | `gvAuditFixDash` 55668 |
| 42 | `Add it back…` (gap finding) | audit strip | Prompt for the missing lesson's text, confirm, inserts it into the master list, then opens a Builder PREVIEW (no grid change until Apply) | `curriculum` update: `subjects/<kid>/<sk>/{lessonSeq, lessonIds, nextLid, total}`, `lastEdit`; then preview only | Mom (fn) | — | `gvAuditFixGap` 55729 → `cbOpenSubj` + `cbRunPreview` |
| 43 | `Match the list to the grid` / `Take the grid's names` (list-vs-grid section) | audit strip (never offered for plan-backed) | Rewrites the card's list from the grid cells; refuses (alert) for plan-backed subjects | `curriculum` update: `subjects/<kid>/<sk>/lessonSeq…` (legacy only) | Mom (fn) | — | `gvReconcileAdopt` 55837 |
| **Grid — toolbar** |||||||||
| 44 | `Show N past days` / `Hide N past days` | toolbar above the table | Shows/hides rows before today | none | Mom (page) | — | `gvTogglePast` 56029; markup 57676 |
| 45 | `☑︎ Select cells` / `✕ Done selecting` | toolbar | Enters/leaves multi-cell selection mode | none | Mom (page) | — | `gvToggleSelMode` 54943; markup 57677 |
| 46 | `Sort by end date` / `✓ Sort by end date` | toolbar (Mom only) | Orders columns earliest-ending first, this device only | none (`HA_LS ha_gv_endsort`) | Mom (momHere) | — | `gvEndSortToggle` 56038; markup 57679 |
| 47 | `↩ Undo last` | toolbar (after a bulk Clear / Fill, outside select mode) | Restores the cells and master lists the bulk action changed | `curriculum` update: `lessons/<kid>/<dn>/<sk>`, `subjects/<kid>/<sk>/{lessonSeq, lessonIds, nextLid}`, `lastEdit`; `subjects/<kid>/<sk>/total` set (recount → re-lays week on change) | Mom (page) | — | `gvSelUndoApply` 55128; markup 57680 |
| **Grid — selection bar (select mode)** |||||||||
| 48 | `🗑 Clear N` | sticky selection bar | Deletes every selected filled cell in one write ("leave the days blank"); one-level undo | `curriculum` update: `lessons/<kid>/<dn>/<sk>` null, list resync `subjects/<kid>/<sk>/{lessonSeq, lessonIds, nextLid}` (non plan-backed only), `lastEdit`; `curriculum/subjects/<kid>/<sk>/total` set; re-lays week (`_rlwCurrDoor`, on count change) | Mom (page) | Enter-with-blank in a cell (#79); `Delete the 2nd` (#40) | `gvSelClear` 55079; markup 57690 |
| 49 | `⤒ Delete & shift up` | selection bar (enabled for one subject) | Clears the cells (as #48), then opens the Builder PREVIEW with the subject compacted up; nothing more until Apply | same as #48; preview is pure | Mom (page) | — | `gvSelShiftUp` 55000 → `cbOpenSubj` + `cbRunPreview` |
| 50 | `✎ Fill…` | selection bar | `prompt("Set all N selected cell(s) to:")`; sets every selected cell to that text (blank = Clear) | `curriculum` update: `lessons/<kid>/<dn>/<sk>` = text, list resync, `lastEdit`; `…/total` set; re-lays week on count change | Mom (page) | single-cell edit (#79) | `gvSelFill` 55103; markup 57692 |
| 51 | `Deselect` | selection bar | Empties the selection | none | Mom (page) | — | `gvSelDeselect` 54944 |
| 52 | tap a cell (select mode) | gesture | Toggles the cell; a second tap in the SAME column selects the filled run between the two (Excel shift-click); queued plan cells are skipped | none | Mom (page) | — | `gvSelCell` 54949; markup 58028 |
| 53 | tap a column header (select mode) | gesture | Toggles every filled cell of that subject (lane header: the member that is up) | none | Mom (page) | — | `gvSelCol` 54967; markup 57802 / 57777 |
| 54 | tap a `Day` cell (select mode, future rows) | gesture | Toggles every filled cell of that day | none | Mom (page) | — | `gvSelRow` 54976; markup 57919 |
| **Grid — calendar banners** |||||||||
| 55 | `Align weeks with calendar…` | purple banner "N lesson(s) sit on holiday/vacation days (all kids)" | Slides stranded lessons to the next school days and renumbers weeks for every kid (confirm lists each kid) | `curriculum` update: `lessons/<kid>/<dn>/date`, `lessons/<kid>/<dn>/week`, `weekDays/<kid>`, `lastEdit` | Mom (page) | `renderCurriculumView` 29416 | `alignPlanApply` 58847; markup 57707 |
| 56 | `Add missing school days…` | amber banner "<Kid>'s map skips N school day(s) the calendar has" | Inserts rows for the skipped days, renumbers, pulls every subject forward on its own weekday cadence, rebuilds weekDays (confirm; one-level undo kept in `HA_LS ha_addDaysUndo` only) | `curriculum/lessons/<kid>` **set (whole kid node)**, `curriculum/weekDays/<kid>` **set**, `curriculum/lastEdit`; re-lays week (`_rlwCurrDoor` all pairs, sweep) | Mom (page) | — | `gvAddMissingDays` 57347; markup 57720 |
| **Grid — move banners** |||||||||
| 57 | `✕ cancel` (➡ Parking <Subject> from <day> — tap the day it should resume) | blue move banner | Disarms the pending move | none | Mom (page) | — | `gvCancelMove` 56795; markup 57730 |
| 58 | `↩ Undo` (Moved <Subject> to <day> (make-up)) | indigo banner after a Lesson-Map-style day move | Restores both days' override entries | `scheduleOverrides` update (via `saveScheduleOverrides`) | Mom (page) | Lesson Map subject grid 59277 | `lmUndoMove` 59229; markup 57737 |
| **Grid — column headers** |||||||||
| 59 | `<Subject name>` column header | thead | Opens the subject card sheet ("the global ✎ sheet — with 🧱 pacing inside") | none here | Mom (page) | ⚠ out-of-order chips (#24); lane headers (#60–61) | `ceOpenEdit` 32219; markup 57802 |
| 60 | lane header: `<Active member>` (one or more, separated by `\|`) | thead, lane column | Opens that member's card | none | Mom (page) | — | `ceOpenEdit`; markup 57777 |
| 61 | lane header: `▸ <queued book>` | thead, lane column | Opens the waiting book's card ("the ONLY route to a waiting book's card") | none | Mom (page) | — | `ceOpenEdit`; markup 57781 |
| — | (display only, no action) `owed N` chip, `⏸ paused` chip, `ends <date> · N behind/ahead` line, `🛤 <Lane>` band, `all done` | thead | — | none | — | — | `planOwed`, `gvEndLine` 56070, `gvLaneEndSk` 56076 |
| **Grid — cell taps** |||||||||
| 62 | tap a cell (normal mode) | tbody | Filled future cell, make-up cell or removed cell → action menu; past filled lesson square (stamped subject, Mom) → menu; empty cell → inline editor; paused plan-backed cell → toast "⏸ … is paused — resume it on its card"; queued lane cell → toast "🛤 … is waiting its turn" | none | Mom (page) | — | `gvOpenCell` 56090; markup 58028 |
| 63 | tap a blue row while ➡ move is armed | tbody gesture | Parks the subject until that day: sticky ✕ marks on every school day from the source up to (not including) the target, then the column re-lays (Keep/Dismiss gate if leftovers; cancel rolls the marks back); one Undo. Refuses earlier days ("Later days only — … ➕ a make-up"), today or earlier, kid-off days | `scheduleOverrides/<date>/<kid>/removed/<sk>` = true per in-between day (via `saveScheduleOverrides`); then `cbApply` writes (#4 list) | Mom (fn, on arming) | — | `gvPickMoveTarget` 56804 (via `gvOpenCell`) |
| **Grid — cell action menu** (opened by #62) |||||||||
| 64 | `✎` (title "Edit the text") | cell menu (past and future) | Opens the inline text editor for the cell | none | Mom (page) | — | `gvMenuEdit` 56115; markup 57957 |
| 65 | `Day it was done` + date input (max today) | cell menu, stamped subject, open lesson | Picks the completion date used by ✓ Mark done (today = blank default) | none until ✓ | Mom (momHere) | subject sheet's "✓ Mark a lesson done" date field | `gvMarkMenuHTML` 56955 |
| 66 | `✓ Mark done` (title "Mark this lesson done — and every earlier unfinished one, in order. The subject re-lays from the next one.") | cell menu, stamped subject, open lesson | Confirm; marks this lesson AND every earlier unfinished one done by id, then re-lays the subject | `curriculum` update: `done/<kid>/<sk>/<lid>` (via `lidMarkDone`), `subjects/<kid>/<sk>/manualDone` (legacy subjects), `lessons/<kid>/<dn>/<sk>` cleared / moved to the chosen day, `lastEdit`; `curriculum/lastEdit` set; re-lays (`_gvRelaySubject` → `cbApply`, else `_rlwCurrDoor`) | Mom (momHere) | subject card sheet "✓ Mark a lesson done" 33246 (same `_ceMarkDoneApply`) | `gvMarkThrough` 56968 → `_ceMarkDoneApply` 33256 → `_ceRelayAfterMark` |
| 67 | `↩ Not done` (title "Mark it not done — it goes back into the plan and the subject re-lays") | cell menu, stamped subject, LATEST done lesson | Confirm; removes the done record (and manualDone twin for legacy hand-marks); subject re-lays | `curriculum` update: `done/<kid>/<sk>/<lid>` null (+ `subjects/<kid>/<sk>/manualDone` for legacy), `lastEdit`; re-lays | Mom (momHere) | subject sheet ↩ (`ceUnfinishLesson` 33186) / ✕ chip (`ceUnmarkLessonDone`) | `gvMarkNotDone` 56983 → `ceUnfinishLesson` 34106 or `ceUnmarkLessonDone` 33301 |
| 68 | `Undo the newer ones first` (text, title "Lessons stay in order — un-mark the later ones first") | cell menu, stamped subject, older done lesson | No action | none | — | — | `gvMarkMenuHTML` 56966 |
| 69 | `✓ done` (title "They finished this — take it out of the plan and move the rest up") | cell menu, future filled cell, NOT a stamped subject | Confirm "Mark “…” done? It comes out of the plan and the lessons after it move up…"; records done (by lid for plan cells; by text in manualDone for legacy), clears the cell, re-lays if Builder-paced; past cells: dated to the cell's day, cell kept, no re-lay | `curriculum` update: `done/<kid>/<sk>/<lid>` or `subjects/<kid>/<sk>/manualDone`, `lessons/<kid>/<dn>/<sk>` null (future), `curriculum/lastEdit` set; `lnHandoff` (lane) → `reprojectSubjectWeek`; re-lay via `cbApply` | Mom (fn) | editor's `✓` on a past cell (#78) | `gvMenuDone` 56840; markup 57961 |
| 70 | `➡ move` (title "Move it — then tap the day in the grid it should land on") | cell menu, future filled cell | Arms move mode (`lmMovePick`); the next row tap is the destination (#63) | none until the pick | Mom (fn) | — | `gvMenuStartMove` 56788; markup 57966 |
| 71 | `✕ off day` (title "Take it off this day — the column re-lays around it (reversible)") | cell menu, future filled cell | Marks the subject removed on that date (cell shows `moved`, ↩ restores) and re-lays the column in the same tap | `scheduleOverrides/<date>/<kid>/removed/<sk>` = true; then `cbApply` writes via `_gvRelaySubject` | Mom (fn) | Lesson Map ✕ `lmDropSlot` 58686 / `lmRemoveSubj` 58679 (callers 29541, 29554, 59327) | `gvMenuOff` 56141; markup 57967 |
| 72 | `🗑` (title "Delete this lesson and re-lay the subject") | cell menu, future filled cell | Confirm; copy → only this cell dies; only copy → off the card's list and the map; finished → blocked (or offers to drop the duplicate LIST line); plan-backed future cell → deletes the DISPLAYED lesson by lid. Then re-lays the subject (gate if leftovers); one combined Undo | `curriculum` update: `lessons/<kid>/<dn>/<sk>` null, `subjects/<kid>/<sk>/{lessonSeq, lessonIds, nextLid}` (via `setLessonSeq`), `lastEdit`; `curriculum/subjects/<kid>/<sk>/total` set; `week<n>/momMoves/<id>` (mom-skip of a live open card, `_saveMomMove`); `curriculum/lastEdit`; then `cbApply` | Mom (fn) | editor's `🗑` (#79) | `gvDeleteLesson` 57107; markup 57968 |
| 73 | `↩ put back` (title "Un-move: it runs on this day again") | cell menu, removed (`moved`) cell | Clears the removed mark for that date | `scheduleOverrides/<date>/<kid>/removed/<sk>` deleted | Mom (fn) | Lesson Map `lmRestoreSubj` 58697 (callers 29564, 59186, 59364) | `gvMenuRestore` 56778; markup 57959 |
| 74 | `✕ make-up` (title "Remove this make-up sitting") | cell menu, cell with an `added` override | Deletes the make-up slot outright | `scheduleOverrides/<date>/<kid>/added/<sk>` deleted | Mom (fn inside `lmDropSlot`) | Lesson Map `lmDropSlot(…,true)` 59327 | `gvMenuOffAdded` 57002; markup 57971 |
| 75 | `📎` (title "Links, supplies, books, orders and notes for this lesson") | cell menu, filled cell, Mom | Opens the lesson resources panel (#81–88) | none | Mom (momHere) | — | `lrGridBtnHTML` 39596 → `lrOpenPanel` 39585 |
| 76 | `×` (title "Close") | cell menu | Closes the menu | none | Mom (page) | — | `gvCancelEdit` 56114 |
| **Grid — inline cell editor** |||||||||
| 77 | text input (`Enter` saves, blank + `Enter` clears, `Escape` / blur cancels) | cell editor | Writes the cell's text; keeps the card's master list in step (non plan-backed); recounts the subject total; re-lays the subject this week. Plan-backed future cell → toast "This cell shows the plan…" and no write | `curriculum/lessons/<kid>/<dn>/<sk>` set or remove; `curriculum` update `subjects/<kid>/<sk>/{lessonSeq, lessonIds, nextLid}` (resync); `curriculum/subjects/<kid>/<sk>/total` set; `curriculum/lastEdit` set; re-lays week (`_rlwCurrDoor` "lesson text" / "lesson count") | Mom (page) | `✎ Fill…` (#50), `🗑 Clear` (#48) | `gvCommitCell` 57033, `gvEditKey` 57014, `gvRecountTotal` 57019; markup 57989 |
| 78 | `✓` (title "They did this on this day — record it as done") | cell editor, past filled cell | Same as #69, past branch | as #69 (past) | Mom (fn) | #69 | `gvMenuDone`; markup 57987 |
| 79 | `🗑` (title "Delete this lesson and re-lay the subject") | cell editor, filled cell | Same as #72 | as #72 | Mom (fn) | #72 | `gvDeleteLesson`; markup 57990 |
| 80 | `➕` (title "Add a make-up sitting of this subject on this day (or type content instead)") | cell editor, empty cell | Adds a make-up slot for the subject on that date (cell shows the green `+ make-up` chip) | `scheduleOverrides/<date>/<kid>/added/<sk>` = true | Mom (fn) | Lesson Map `lmAddSubj` 58701 (callers 29459, 29520, 29577, 59190, 59209) | `gvMenuAddMakeup` 57008; markup 57991 |
| **📎 Lesson resources panel** (`lrPanelHTML` 39606, opened by #75) |||||||||
| 81 | `×` | 📎 panel | Closes the panel | none | Mom | — | `lrClosePanel` 39595 |
| 82 | `use default` (title "Clear this lesson's own list — it uses the subject default again") | 📎 panel, per part | Removes this lesson's own list for that part | `curriculum/resources/<kid>/<sk>/<lessonKey>/<part>` set null | Mom (lrMom) | — | `lrUseDefault` 39669 → `lrWrite` 39280 |
| 83 | `Set for every <Subject> lesson` (title "Every <Subject> lesson that says nothing here gets this list") | 📎 panel, per part and notes | Copies the list to the subject default | `curriculum/resources/<kid>/<sk>/_subject/<part>` set | Mom | — | `lrSetSubjectDefault` 39671 |
| 84 | `✎` (title "Edit") | 📎 panel, per item | Opens the item for editing | none | Mom | — | `lrEditItem` 39663 |
| 85 | `✕` (title "Remove") | 📎 panel, per item | Removes the item | `curriculum/resources/<kid>/<sk>/<key>/<part>` set | Mom | — | `lrRemoveItem` 39664 |
| 86 | `+ Add` / `Save` | 📎 panel, per part | Adds or saves the typed item | `curriculum/resources/<kid>/<sk>/<key>/<part>` set | Mom | — | `lrAddItem` 39656 |
| 87 | `Cancel` | 📎 panel (while editing) | Drops the edit | none | Mom | — | inline `lrPanel.edit=null` |
| 88 | `Save notes` | 📎 panel | Saves the notes text | `curriculum/resources/<kid>/<sk>/<key>/notes` set | Mom | — | `lrSaveNotes` 39668 |
| **↪ Leftover lessons — keep or dismiss? sheet** (`cbRenderGate` 54255; opened by `cbBuildGate` from ✓ Build, 🗑, ✕ off day, ➡ park, Rebuild all) |||||||||
| 89 | `Keep all` | gate sheet, per subject (when >1 row) | Marks every unlocked leftover as Keep | none until Build | Mom (page) | — | `cbGateAll(ii,false)` 54197 |
| 90 | `Dismiss all` | gate sheet | Marks every unlocked leftover as Dismiss | none until Build | Mom (page) | — | `cbGateAll(ii,true)` |
| 91 | `↪ Keep` / `✕ Dismiss` (per leftover row; `skipped earlier` rows are locked) | gate sheet | Toggles that lesson | none until Build | Mom (page) | — | `cbGateToggle` 54193 |
| 92 | `✓ Build — keep N, dismiss M` | gate sheet | Records the decisions and applies the build (one subject) or the whole Rebuild-all batch | `cbApply` writes (#4) incl. `skiplog/<kid>/<sk>` (dismissed texts) | Mom (page) | — | `cbGateConfirm` 54238 |
| 93 | `Cancel` / tap outside the box | gate sheet | Closes without building; a cancelled ➡ park rolls its ✕ marks back; a cancelled list-save re-lay rolls the list back; a 🗑 already done keeps its own Undo | park: `scheduleOverrides` restored; list-save: `curriculum` update (list back) | Mom (page) | — | `cbGateCancel` 54201 |
| **⚙ Rules & day cap panel** (`cbRenderRules` 53550; drawn under the Grid's kid tools row with `cbKid=gvKid`, and on the Builder tab) |||||||||
| 94 | `−` / `+` under **Daily cap — no day over** (15-minute steps; shown `N min/day · default from school hours` / `custom`) | Rules panel | Sets the kid's per-day minute cap; every subject re-lays this week | `curriculum/dayCap/<kid>` set; `curriculum/lastEdit`; re-lays week (`_rlwCurrDoor` all pairs, "max per day") | Mom (page) | Builder tab Rules panel 54478 (same renderer) | `cbCapStep` 53151 → `cbSetCap` 53138 |
| 95 | `Reset to school hours` | Rules panel (when a custom cap is set) | Removes the custom cap (default = school hours minus lunch) | `curriculum/dayCap/<kid>` remove; `lastEdit`; re-lays week | Mom (page) | Builder tab | `cbSetCap(kid,0)` |
| 96 | `↩ Undo` (🛤 <created/updated/retired/brought back/removed> lane “…”) | Rules panel ▸ 🛤 Lanes | Puts the lane record back as it was before the last lane write; members re-lay | `curriculum/lanes/<kid>/<id>` set or remove; `curriculum/lastEdit`; re-lays week (`_rlwCurrDoor` lane pairs) | Mom (page) | — | `lnUndoLast` 53298 |
| 97 | `⤓ retire` (title "Retire it — file it away here. Its lessons and history are untouched, and it never comes back as its own column.") | Rules panel ▸ Lanes, on a `done` unit | Files a FINISHED unit away (refused with a toast if lessons are left) | `curriculum/lanes/<kid>/<id>` set (unit gets `retired:true`); `lastEdit`; re-lays week | Mom (page) | — | `lnRetire(id,i,true)` 53265 |
| 98 | `↩` (title "Bring it back into the lane") after `retired: …` | Rules panel ▸ Lanes | Un-retires the unit | `curriculum/lanes/<kid>/<id>` set; `lastEdit`; re-lays week | Mom (page) | — | `lnRetire(id,i,false)` |
| 99 | `✎ edit` | Rules panel ▸ Lanes, per lane | Opens the lane editor loaded with that lane | none | Mom (page) | — | `lnEditStart(id)` 53182 |
| 100 | `✕ remove` | Rules panel ▸ Lanes, per lane | Confirm "Remove lane “…”? Its subjects go back to their own settings — no lessons or history change."; deletes the lane | `curriculum/lanes/<kid>/<id>` remove; `lastEdit`; re-lays week | Mom (page) | — | `lnDelete` 53285 |
| 101 | `<Auto lane name> ＋` chips under "Not stacked yet — every one of these is a lane of one. Tap to name it and add the next book after it:" | Rules panel ▸ Lanes | Opens the editor seeded with that subject as unit 1 | none | Mom (page) | — | `lnEditStart(null,sk)` |
| 102 | `+ New lane` | Rules panel ▸ Lanes | Opens an empty lane editor | none | Mom (page) | — | `lnEditStart(null)` |
| 103 | `Lane name (e.g. Math)` input | lane editor | Sets the lane's name (also seeds its id) | none until Save | Mom (page) | — | `lnEditName` 53193 |
| 104 | `▲` / `▼` (per unit) | lane editor | Reorders the unit | none | Mom (page) | — | `lnEditMove` 53201 |
| 105 | `✕` (per unit) | lane editor | Removes the unit from the lane | none | Mom (page) | — | `lnEditDel` 53200 |
| 106 | subject chips (`A <Subject>`, `B <Subject>`, …) | lane editor, **multiple card** unit | Picks the card's members; the letter is the pattern slot | none | Mom (page) | — | `lnEditSet(i,'sub',sk)` 53202 |
| 107 | `Pattern` input (placeholder `AAB`; "A = first picked, B = second… repeats over the sittings") | lane editor, multiple card | Sets the sitting pattern | none | Mom (page) | — | `lnEditSet(i,'pattern',…)` |
| 108 | `— pick a subject —` select | lane editor, **single card** unit | Picks the unit's subject (only plan-backed, not-yet-taken subjects listed) | none | Mom (page) | — | `lnEditSet(i,'sk',…)` |
| 109 | `Rhythm:` pill — `↑ same as the one before` / `own (set below)` / `own (this subject's days · ×/wk · cap)` | lane editor, per unit | Toggles between borrowing the prior unit's rhythm and its own | none | Mom (page) | — | `lnEditSet(i,'rhythm')` |
| 110 | `M` `T` `W` `T` `F` pills ("(none = any day)") | lane editor, multiple card with own rhythm | Allowed days of the multiple card | none | Mom (page) | — | `lnEditSet(i,'day',d)` |
| 111 | `×/wk` `−` / `+` | lane editor, multiple card, own rhythm | Times per week (1–7) | none | Mom (page) | — | `lnEditSet(i,'tpw',n)` |
| 112 | `Cap` `−` / `+` | lane editor, multiple card, own rhythm | Sittings per day (1–4) | none | Mom (page) | — | `lnEditSet(i,'cap',n)` |
| 113 | `+ single card` | lane editor | Adds a single-subject unit | none | Mom (page) | — | `lnEditAdd('single')` 53194 |
| 114 | `+ multiple card (pattern)` | lane editor | Adds a multi-subject unit (pattern AB, 3×/wk, cap 1) | none | Mom (page) | — | `lnEditAdd('multi')` |
| 115 | `Save lane` (disabled while problems are listed) | lane editor | Writes the lane; members before and after re-lay this week | `curriculum/lanes/<kid>/<id>` set `{name, units[]}`; `curriculum/lastEdit`; re-lays week (`_rlwCurrDoor`, `_rlwLanePairs`) | Mom (page) | — | `lnEditSave` 53236 |
| 116 | `Cancel` | lane editor | Closes without saving | none | Mom (page) | — | `lnEditCancel` 53192 |
| 117 | `Use Mon–Thu for every 4×/wk subject` (link in "🏫 Weeks without co-op:" note) | Rules panel (kid in any co-op) | Sets `noCoopDays` = Mon–Thu on every unpaused 4×/wk subject not already set; re-lays | `curriculum/subjects/<kid>` update (`<sk>/noCoopDays` per subject); `curriculum/lastEdit`; re-lays week | Mom (momHere) | — | `cwdUseMonThu` 41821 |
| 118 | **Days** pills `M` `T` `W` `T` `F` (per subject) | Rules panel table | Pins the days the subject may land on (none lit = any school day); drops the legacy `days` string; plan-backed paced subjects re-lay at once (Builder path, gate); dailies re-lay through the door | `curriculum/subjects/<kid>/<sk>/allowedDays` set; `…/days` remove; re-lay (`_gvRelaySubject` → `cbApply`, or `relayWeek`) | Mom (page) | Builder form "Days it can land on" (#142, written by `cbApply`); 📅 Fold into Days (#29) | `cbPinDay` 53397 |
| 119 | `🏫 no co-op wk:` pills `M`…`F` (per subject, kid in a co-op) | Rules panel table ▸ Days | Days for weeks with NO co-op (none lit = same as above) | `curriculum/subjects/<kid>/<sk>/noCoopDays` set/null (via `rlSet` relay=true); `lastEdit`; re-lay | Mom (page) | #117 | `cwdPinDay` 41812 → `rlSet` |
| 120 | **×/wk** `−` / `+` (shows `all` when 0) | Rules panel table | Times per week (1–7); re-lays | `curriculum/subjects/<kid>/<sk>` update `{pacing/tpw, timesPerWeek}`; `lastEdit`; re-lay (Builder path for plan-backed paced; door for dailies) | Mom (page) | Builder form "Times per week" (#144; `cbApply` writes pacing + timesPerWeek) | `rlSet(…,'tpw',…,true)` 53418 |
| 121 | **Cap** `−` / `+` (1–4; dimmed in a lane with borrowed/shared rhythm) | Rules panel table | Sittings of the subject allowed on one day; re-lays | `curriculum/subjects/<kid>/<sk>/cap` set; `lastEdit`; re-lay | Mom (page) | 🧢 Fold into Cap (#27) | `rlSet(…,'cap',…,true)` |
| 122 | **Min** `−` / `+` (5-minute steps, 5–90) | Rules panel table | The card's minutes; re-lays | `curriculum/subjects/<kid>/<sk>/minutes` set; `lastEdit`; re-lay | Mom (page) | — (footer: subject cards no longer hold it) | `rlSet(…,'minutes',…,true)` |
| 123 | **Co-op day** pill `keep` / `shorten` / `skip` + `−` / `+` minutes (kid in a timed co-op) | Rules panel table | On a co-op day: keep the full card, shorten it to N min, or skip it | `curriculum/subjects/<kid>/<sk>/coopDay` set (null / number / `"skip"`); `lastEdit`; re-lay | Mom (page) | — | `rlSet(…,'coopDay',…,true)` |
| 124 | **Mom** pill `None` / `Maybe` / `Required` (cycle; dimmed "Set by the Mom days below" when 👩 days are ticked) | Rules panel table | Whether Mom is needed for the subject; this week's cards restamp at once | `curriculum/subjects/<kid>/<sk>/mom` set; `lastEdit`; re-lays week (`relayWeek`) for plan-backed; `reprojectSubjectWeek` fallback | Mom (page) | — | `rlSet(…,'mom',…,false)` |
| 125 | `👩 days:` `1` … `n` pills (subjects whose lessons span >1 day) | Rules panel table ▸ Mom | Which day of each lesson needs Mom | `curriculum/subjects/<kid>/<sk>/momDays` set/null; `lastEdit`; re-lays week | Mom (page) | — | `lsdToggleDay` 34260 → `rlSet(…,'momDays',…)` |
| 126 | `−` / `+` … `min` after 👩 days | Rules panel table ▸ Mom | Minutes of a Mom day (5–90) | `curriculum/subjects/<kid>/<sk>/momDayMin` set; re-lays week | Mom (page) | — | `rlSet(…,'momDayMin',…)` |
| 127 | `📌 new lesson:` pill `any day` / `Mon` … `Fri` (cycle) | Rules panel table ▸ Mom | The weekday every NEW lesson stays on | `curriculum/subjects/<kid>/<sk>/lessonDay` set/null; re-lays week | Mom (page) | — | `rlSet(…,'lessonDay',…)` |
| 128 | `if missed:` pill `waits for the next one` / `next school day` | Rules panel table ▸ Mom (lesson day set) | What a missed lesson day does | `curriculum/subjects/<kid>/<sk>/lessonDayMissed` set; re-lays week | Mom (page) | — | `rlSet(…,'lessonDayMissed',…)` |
| 129 | `missed practice:` pill `drops` / `push the lesson up to 2 days` | Rules panel table ▸ Mom (multi-day lesson, lesson day set) | What missed practice days do | `curriculum/subjects/<kid>/<sk>/lessonDayPractice` set; re-lays week | Mom (page) | — | `rlSet(…,'lessonDayPractice',…)` |
| 130 | **Device** pill (cycle `paper` → `computer` → `ipad/phone` → `book` → `keyboard`, with emoji) | Rules panel table | The device/material the card needs | `curriculum/subjects/<kid>/<sk>/device` set; `lastEdit` | Mom (page) | — | `rlSet(…,'device',…,false)` |
| 131 | **Priority** pill `Low` / `Normal` / `High` (cycle) | Rules panel table | Placement priority; re-lays | `curriculum/subjects/<kid>/<sk>/priority` set; re-lay | Mom (page) | — | `rlSet(…,'priority',…,true)` |
| 132 | **First/last** pills `First` / `Last of day` (title "after everything, family time included") / `Last of own work` (title "right after their own lessons — a Mom-required one ends their Mom turn") | Rules panel table | Order-of-day token (mutually exclusive) | `curriculum/subjects/<kid>/<sk>/rules` set (comma list) | Mom (page) | — | `rlSet(…,'rulesTok','first'\|'last'\|'lastOwn')` |
| 133 | **Sticky** select `—` / `<other subject>` | Rules panel table | The subject this one sticks to | `curriculum/subjects/<kid>/<sk>/stickyWith` set/null | Mom (page) | — | `rlSet(…,'stickyWith',…)` |
| 134 | `after` / `before` pill (when sticky is set) | Rules panel table ▸ Sticky | Which side of the sticky partner | `curriculum/subjects/<kid>/<sk>/stickyOrder` set | Mom (page) | — | `rlSet(…,'stickyOrder',…)` |
| 135 | **No-carry** pill `carries` / `day-bound` | Rules panel table | Whether an unfinished card carries to the next day | `curriculum/subjects/<kid>/<sk>/noCarry` set | Mom (page) | — | `rlSet(…,'noCarry',…)` |
| 136 | **Rules** pill `seq` | Rules panel table | The `sequential` order token | `curriculum/subjects/<kid>/<sk>/rules` set | Mom (page) | — | `rlSet(…,'rulesTok','sequential')` |
| 137 | `🏠 Family-wide day rules are in Settings — school hours · sitter · devices · workflow order · overlap · carry-over & Saturday ›` | Rules panel footer | Jumps to Settings | none | Mom (page) | — | `setAdminSub('settings')` 6919 |
| **Builder form** (`cbRenderForm` 54538 — on the Builder tab, embedded in the subject card sheet (`ceOpenBuild` 29604, 32654), and loaded silently by every re-lay) |||||||||
| 138 | `‹ Back` | Builder form header (tab) | Closes the subject, back to the list | none | Mom (page) | — | `cbCloseSubj` 54430 |
| 139 | `×` (next to `🧱 Pacing & build`) | Builder form header (embedded in the subject card) | Closes the embedded form | none | Mom (page) | — | `ceOpenBuild` 29604 |
| 140 | `🎯 Done by a date` / `📅 Days per week` / `⏳ Until a date` / `📖 Pages` / `⏱ Just minutes` chips under **How should it be paced?** | Builder form | Picks the pacing mode (form state; preview cleared) | none until Build | Mom (page) | — | `cbSetMode` 54431 |
| 141 | `Start on` date ("optional — nothing lands before this day; a kid with no grid yet gets one built from here") | Builder form | Start date | none until Build (→ `pacing/startDate`) | Mom (page) | — | `cbSetField('startDate')` 54432 |
| 142 | `Days it can land on` chips `Mon` `Tue` `Wed` `Thu` `Fri` ("none selected = any school day") | Builder form | Allowed days | none until Build (→ `subjects/<kid>/<sk>/allowedDays`) | Mom (page) | Rules panel Days pills (#118) | `cbToggleDay` 54434 |
| 143 | `Finish by` date (🎯 mode) | Builder form | Target date; "The app computes how many days a week it needs." | none until Build (→ `pacing/targetDate`) | Mom (page) | — | `cbSetField('targetDate')` |
| 144 | `Times per week` `−` / `+` stepper (📅, ⏳, 📖, ⏱ modes) | Builder form | 1–7 | none until Build (→ `pacing/tpw`, `timesPerWeek`) | Mom (page) | Rules panel ×/wk (#120) | `cbStepTpw` 54433 |
| 145 | `Stop after` date (⏳ mode; ⏱ mode "optional — blank fills to the end of the map") | Builder form | Window end | none until Build (→ `pacing/windowEnd`) | Mom (page) | — | `cbSetField('windowEnd')` |
| 146 | `📸 Scan the book` (file input, images, multiple) | Builder form ▸ 📖 Pages | Shrinks the photos and asks the Anthropic API to map the book into units (needs the AI key) | none in Firebase (network call to the Claude API); fills `cbForm.units` | Mom (page) | — | `cbScanBook` 53809 |
| 147 | Units list rows: `Label` input, start page, `–`, end page ("one per day, real boundaries — overrides the pattern below") | Builder form ▸ 📖 Pages (units present) | Edits a unit | none until Build (→ `pacing/pages/units`) | Mom (page) | — | `cbUnitField` 53875 |
| 148 | `✕` (per unit) | Builder form ▸ Units | Removes the unit | none | Mom (page) | — | `cbUnitRemove` 53880 |
| 149 | `+ Add unit` | Builder form ▸ Units | Appends a unit starting after the last | none | Mom (page) | — | `cbUnitAdd` 53881 |
| 150 | `Clear — use the pattern instead` | Builder form ▸ Units | Drops the unit list, back to the page pattern | none | Mom (page) | — | `cbUnitsClear` 53888 |
| 151 | `Total pages` number | Builder form ▸ 📖 Pages (no units) | | none until Build (→ `pacing/pages/totalPages`) | Mom (page) | — | `cbSetField('totalPages')` |
| 152 | `Start at page` number | Builder form ▸ Pages | | none until Build (→ `pacing/pages/startPage`) | Mom (page) | — | `cbSetField('startPage')` |
| 153 | `Pages per day pattern` ("one number, or a cycle like 3, 4, 5, 3"; placeholder `e.g. 3, 4, 5, 3`) | Builder form ▸ Pages | | none until Build (→ `pacing/pages/pattern`) | Mom (page) | — | `cbSetField('patternStr')` |
| 154 | `Finish by` date (Pages; "pages per sitting are re-averaged toward this date on every build and every week; the pattern above is ignored while it is set") | Builder form ▸ Pages | | none until Build (→ `pacing/targetDate`) | Mom (page) | — | `cbSetField('targetDate')` |
| 155 | `Label` chips `pp. 12–15` / `Lesson 12–15` / `Day 12–15` | Builder form ▸ Pages | Cell text style | none until Build (→ `pacing/pages/unitLabel`) | Mom (page) | — | `cbSetField('unitLabel')` |
| 156 | `What the day's cell says` text (⏱ mode) | Builder form ▸ Just minutes | The cell text (default "<N> min") | none until Build (→ `pacing/minutesText`) | Mom (page) | — | `cbSetField('minutesText')` |
| 157 | `Prefix` / `How many` (box "No lessons left in the sequence. Generate new ones:") | Builder form (sequenced modes, nothing remaining) | Generates lesson names on Build | none until Build (→ list) | Mom (page) | — | `cbSetField('genPrefix'/'genCount')` |
| 158 | `Preview build` | Builder form | Runs the materializer and shows the preview card ("Preview — nothing written yet") | none | Mom (page) | `⤒ Delete & shift up` (#49) and `Add it back…` (#42) land here | `cbRunPreview` 53766 → `_cbEngine` 53730 |
| 159 | `Copy to another kid` chips `<Kid>` (`<Kid> ✓` dimmed when they already have it) | Builder form (tab only) | Creates the subject for the other kid (settings + pacing + full lesson list, fresh ids, no grid rows), then opens it in their Builder | `curriculum/subjects/<toKid>/<sk>` set (whole new record); `curriculum/lastEdit` set; re-lays week (`_rlwCurrDoor`) | Mom (page) | — | `cbCopyTo` 53455 |
| 160 | `✓ Build into map` | Preview card | Applies the previewed build (Keep/Dismiss sheet first when a legacy subject has leftovers); one Undo | `cbApply` writes (#4); re-lays week (`relayWeek("build")`) | Mom (page) | every re-lay door (`_gvRelaySubject` 56770 runs the same gate + apply) | `cbBuildGate` 54182 → `cbApply` 53930 |
| 161 | `Cancel` (preview card) | Preview card | Drops the preview | none | Mom (page) | — | inline `cbPreviewRes=null` 54722 |
| — | (display only) `🔁 Today's <Subject> card isn't checked off yet (…)` note on the preview | Preview card | Warns that the build moves today's open lesson | none | — | — | `cbTodayMoveHTML` 54529 |
| **Retired Builder tab** (`renderCurrBuilder` 54440 — not in the nav; reached by `⤒ Delete & shift up`, `Add it back…`, `gvJumpBuilder` (no callers), list-save re-lay) |||||||||
| 162 | `<Kid name>` chips | Builder tab | Switches the Builder's kid | none | Mom (page) | Grid kid chips (#1) | `cbSetKid` 54392 |
| 163 | `↩ Undo` (result banner) | Builder tab | As #7 | as #7 | Mom (page) | #7 | `cbUndo` 54358; markup 54463 |
| 164 | `📋 <Kid>'s year at a glance ▾/▴` | Builder tab | Opens the per-subject summary table (Subject · Pacing · ×/wk · days left · finishes) | none | Mom (page) | — | `cbSummaryToggle` 53492; `cbRenderSummary` 53495 |
| 165 | summary table row (tap) | Builder tab ▸ year at a glance | Opens that subject in the Builder | none | Mom (page) | — | `cbOpenSubj` 54393; markup 53536 |
| 166 | `⚙ Rules & day cap for <Kid> ▾/▴` | Builder tab | Opens the same Rules panel (#94–137) | none | Mom (page) | Grid `⚙ Rules & day cap` (#5) | `cbRulesToggle` 53155; markup 54478 |
| 167 | `↻ Rebuild all <Kid>'s subjects` — `N paced · from where they are` | Builder tab (Mom/PIN) | As #4 | as #4 | Mom (fn) | #4 | `cbRebuildAll` 54305; markup 54497 |
| 168 | subject row `<emoji> <Subject> · N min · N future days on the map … ›` | Builder tab | Opens that subject's Builder form | none | Mom (page) | — | `cbOpenSubj` 54393; markup 54507 |
| **🗂 Plan bar** (`planBarHTML` 28549, drawn above the Grid by `renderCurriculumView` 29286) |||||||||
| 169 | `Show` / `Hide` | 🗂 `<Kid>'s plan` bar (`📅 N to do · N overdue · N this week · N heads-up` · `📊 N reports` · `📝 N notes`) | Opens/closes the three strips below (session memory per kid) | none | Mom (page) | — | inline `planOpen[kid]=!planOpen[kid]` 28557 |
| 170 | `➕ Add` | 📅 Roadmap · <Kid> strip | Opens the inline add form (toast "Enter the Mom code first" if not unlocked) | none | rmCanWrite | — | `rmNew` 27878 |
| 171 | row under **From the curriculum** (🔴/🟠/grey dot + text; tap; title "Open <subject> in the Builder") | Roadmap strip | Opens that subject's card (or the family block's sheet) | none | Mom (page) | Mom's Day heads-up card `rmWeekHTML` 27854 | `rmxOpen` 28283 → `ceOpenEdit` / `famSheetOpen`; `rmxRowHTML` 28284 |
| 172 | `⋯` (title "Mute this subject or change its warning") | Roadmap strip, From-the-curriculum row (Mom) | Opens the row's mini menu | none | Mom (momHere) | — | `rmxMenuToggle` 28373 |
| 173 | `🔕 Mute this subject` / `🔔 Unmute` | ⋯ menu | Mutes/unmutes the subject's heads-up (stays greyed in the strip, off Mom's Day and the count) | `config/rules/headsUp/subj/<kid>/<sk>/off` set true / remove | Mom (momHere) | Mom's Day ⚙ panel per-subject `↺` (`rmxPanelHTML` 28420, not reachable from here) | `rmxMute` 28367 → `rmxRuleSet` 28346 / `rmxRuleClear` 28355 |
| 174 | `Warn earlier (+1 wk)` / `Warn later (−1 wk)` ("warns N wk(s) ahead") | ⋯ menu | Shifts the subject's own warn-weeks | `config/rules/headsUp/subj/<kid>/<sk>/warnWeeks` set | Mom (momHere) | — | `rmxWarnShift` 28368 |
| 175 | `✓` box (title `Done` / `Reopen` / `Not yet — keep it open`) | Roadmap strip, per dated row | Ticks / reopens the item; on an auto-done linked row records "not yet" (`keepOpen`) | `plans/<kid>/roadmap/<id>` update `{done}` / `{done,keepOpen:null}` / `{keepOpen:true}` | rmCanWrite | Mom's Day heads-up card compact rows (`rmRowHTML(kid,r,iso,true)` in `rmWeekHTML` 27872) | `rmDone` 27900 |
| 176 | `📚 book` | Roadmap strip row (item with a book id) | Jumps to School Room ▸ Books and opens that book | none | Mom (page) | Mom's Day compact rows | `rmOpenBook` 27925 |
| 177 | `✏️` (title "Edit") | Roadmap strip row | Opens the row in the inline form | none | rmCanWrite | — | `rmEditStart` 27879 |
| 178 | `Show N done` / `Hide N done` | Roadmap strip | Folds/unfolds finished items | none | Mom (page) | — | inline `rmShowDone[kid]` toggle 27845 |
| 179 | date input (form) | Roadmap inline form | Due date | none until Save | rmCanWrite | — | `rmSet('due')` 27881 |
| 180 | kind select `➕ add` / `📝 append` / `⏸ pause` / `🔁 swap` / `✏️ edit` / `📌 note` | Roadmap form | The item's kind (redraws the form) | none until Save | rmCanWrite | — | `rmPick('kind')` 27882 |
| 181 | subject select `(no subject)` / `<Subject>` | Roadmap form | Links the item to a subject | none until Save | rmCanWrite | — | `rmPick('subject')` |
| 182 | text input (placeholder `What to do — e.g. Printing Power ends → add Cursive Tue/Thu 10`) | Roadmap form | The item text | none until Save | rmCanWrite | — | `rmSet('text')` |
| 183 | input (placeholder `book id from 📚 Books (optional)`) | Roadmap form | Book link | none until Save | rmCanWrite | — | `rmSet('book')` |
| 184 | **Shows up…** select: `📆 On the date` / `📆 On the date · ticks itself when done` / `⏳ When <Subject> is running out` / `✅ When a lesson of <Subject> is done` | Roadmap form | How the row's date / auto-tick follows the curriculum | none until Save (→ `link`) | rmCanWrite | — | `rmPick('when')` |
| 185 | `(which lesson?)` select (or note "(this list has no lesson ids yet — pick On the date)") | Roadmap form (when = lesson) | Which lesson id triggers it | none until Save | rmCanWrite | — | `rmSet('lid')` |
| 186 | input (placeholder `new subject's name contains… (then it ticks itself)`) | Roadmap form (kind add / swap) | Auto-tick match text | none until Save | rmCanWrite | — | `rmSet('match')` |
| 187 | `Save` | Roadmap form | Validates date + text; writes the whole item (toast "📅 Saved for <date>") | `plans/<kid>/roadmap/<id>` set `{due,text,kind,done,at,subject?,book?,keepOpen?,link?}` | rmCanWrite | — | `rmSave` 27884 |
| 188 | `Cancel` | Roadmap form | Closes the form | none | rmCanWrite | — | `rmCancel` 27883 |
| 189 | `Delete` | Roadmap form (editing) | Confirm "Delete this roadmap item?"; removes it | `plans/<kid>/roadmap/<id>` remove | rmCanWrite | — | `rmDelete` 27919 |
| 190 | `Show` / `Hide` (link) | 📊 Test scores · <Kid> strip | Expands the Iowa / CogAT tables (collapsed line shows the latest composite · reading · math · conventions) | none (scores are "Typed from the report PDFs — a new report is added by Claude on your ask") | Mom (page) | — | inline `scOpen[kid]` toggle 28474; `scStripHTML` 28469 |
| 191 | `➕ Note` | 📝 Plan notes · <Kid> strip | Opens the new-note form | none | rmCanWrite | — | `ntNew` 28532 |
| 192 | `▸ <title>` / `▾ <title>` (link) | Notes strip, per note | Expands/collapses the rendered markdown | none | Mom (page) | — | inline `ntOpen[...]` toggle 28519 |
| 193 | `✏️` (title "Edit") | Notes strip, per note | Opens the note in the form | none | rmCanWrite | — | `ntEditStart` 28533 |
| 194 | `Title` input | Note form | | none until Save | rmCanWrite | — | `ntSet('title')` 28534 |
| 195 | textarea (placeholder `Markdown — # headings, - bullets, **bold**, \| tables \|`) | Note form | | none until Save | rmCanWrite | — | `ntSet('md')` |
| 196 | `Save` | Note form | Writes the note (toast "📝 Saved") | `plans/<kid>/notes/<id>` set `{title, md, updated}` | rmCanWrite | — | `ntSave` 28536 |
| 197 | `Cancel` | Note form | Closes the form | none | rmCanWrite | — | `ntCancel` 28535 |
| 198 | `Delete` | Note form (editing) | Confirm "Delete this note?"; removes it | `plans/<kid>/notes/<id>` remove | rmCanWrite | — | `ntDelete` 28544 |

Rows #199–202 of this pass (the 🎚 Load dial) sit on the Scores page, not on the Curriculum page, and are left out here.

**A-strips (not in the table above):** three strips above the table each hold one chip per subject that opens its card — `🗂 No lessons to pace — tap to open the card` (57461), `⏸ Paused — tap to open the card and resume` (57469), `📊 On their cards, not in the grid yet` (57475); and the 🏡 `Together — family time, done with siblings` strip (`famGridStripHTML` 37208) whose chips open the Family-time editor (`famGoEdit`).

#### A.2 — `rlSet` (53418): every field the ⚙ Rules table writes

`rlSet` writes the SAME subject field the card used to ("one record"), then re-lays. Mechanics: it snapshots the old value for Undo, then:
- `field === "tpw"` → clamps 1–7, writes ONE `curriculum/subjects/<kid>/<sk>` update of `{ "pacing/tpw": v, timesPerWeek: v }` (creates `pacing` as `{mode:"timesPerWeek"}` if absent).
- `field === "rulesTok"` → toggles a token in the comma list `subjects/<kid>/<sk>/rules`; `first` clears `last`/`lastOwn`; `last` or `lastOwn` clears `first` and the other one.
- any other field → `curriculum/subjects/<kid>/<sk>/<field>` set to `val` (null/undefined deletes).
- always `curriculum/lastEdit` set.
- Then: a Mom-type field (`mom`, `momDays`, `momDayMin`, `lessonDay`, `lessonDayMissed`, `lessonDayPractice`) on a plan-backed subject → `relayWeek("curriculum", …)` with Undo (fallback `reprojectSubjectWeek`). A daily's laying field (in `RLW_LAY_FIELDS` 43810) → `relayWeek` with Undo. A non-plan-backed, non-daily laying field → toast "✎ Saved — … isn't paced by the Builder, so this week's cards re-lay on the next week build or 🔄 Regenerate". `relay === true` on a plan-backed Builder-paced subject → `_gvRelaySubject` (full Builder re-lay with the Keep/Dismiss gate).

| Field (as passed) | Values | Plain words | On-screen column |
|---|---|---|---|
| `tpw` | 1–7 | How many times a week the subject runs (writes both `pacing/tpw` and `timesPerWeek`) | **×/wk** |
| `cap` | 1–4 | How many sittings of the subject may land on one day | **Cap** |
| `minutes` | 5–90, step 5 | How long the card is | **Min** |
| `noCoopDays` | array of `Mon…Fri` or null | The days the subject may land on in a week with no co-op (via `cwdPinDay`) | **Days** ▸ `🏫 no co-op wk:` |
| `coopDay` | null / number of minutes / `"skip"` | On the kid's co-op day: keep the full card, shorten it to N min, or skip it | **Co-op day** |
| `mom` | `none` / `maybe` / `required` | Whether Mom is needed for the card | **Mom** |
| `momDays` | array of day numbers 1…n or null | Which day(s) of a multi-day lesson need Mom (via `lsdToggleDay`) | **Mom** ▸ `👩 days:` |
| `momDayMin` | 5–90 | Minutes of a Mom day (a Mom day can run longer) | **Mom** ▸ `… min` |
| `lessonDay` | `Mon…Fri` or null | The weekday every NEW lesson stays on | **Mom** ▸ `📌 new lesson:` |
| `lessonDayMissed` | `wait` / `next` | If the lesson day is missed: wait for the next one, or next school day | `if missed:` |
| `lessonDayPractice` | `drop` / `push` | Missed practice days drop, or push the lesson up to 2 days | `missed practice:` |
| `device` | `paper` / `computer` / `ipad/phone` / `book` / `keyboard` | What the kid needs in hand | **Device** |
| `priority` | `low` / `normal` / `high` | Placement priority | **Priority** |
| `rulesTok` = `first` | toggle | Card goes first in the day | **First/last** `First` |
| `rulesTok` = `last` | toggle | Last of the day, after everything incl. family time | `Last of day` |
| `rulesTok` = `lastOwn` | toggle | Right after their own lessons | `Last of own work` |
| `rulesTok` = `sequential` | toggle | Lessons must be served in order | **Rules** `seq` |
| `stickyWith` | subject key or null | The subject this one is placed next to | **Sticky** select |
| `stickyOrder` | `after` / `before` | Which side of the sticky partner | **Sticky** pill |
| `noCarry` | true / false | `day-bound` (never carries to the next day) vs `carries` | **No-carry** |

(`allowedDays` is NOT written by `rlSet`; the Days pills use `cbPinDay` 53397, which also removes the legacy `days` string.)

#### A.3 — the 🧱 Builder form, fields in order, and what Build writes

1. Header: `🧱 Pacing & build` (embedded) or `‹ Back` · `<emoji> <Subject>` · `<N> min/day` (tab). `📋 Plan resources` block (`lrpBuilderHTML`, tab only).
2. **How should it be paced?** — mode chips: `🎯 Done by a date` (`targetDate`), `📅 Days per week` (`timesPerWeek`), `⏳ Until a date` (`window`), `📖 Pages` (`pages`), `⏱ Just minutes` (`minutes`).
3. **Start on** (optional — nothing lands before this day; a kid with no grid yet gets one built from here) — date.
4. **Days it can land on** (none selected = any school day) — `Mon` `Tue` `Wed` `Thu` `Fri` chips. Note line `🏫 Weeks without co-op land on <days> (placement rules) — the preview follows it.` when set.
5. Per mode:
   - 🎯: **Finish by** date · "N lesson(s) remaining of M — laid from where <Kid> actually is" · "The app computes how many days a week it needs."
   - 📅: **Times per week** stepper · remaining line.
   - ⏳: **Stop after** date · **Times per week** · remaining line.
   - 📖: `📸 Scan the book` ("Photograph the table of contents (or a few pages) — AI maps it page by page.") · scan status · either **Units** (one per day, real boundaries — overrides the pattern below) list with `Label`, start–end pages, `✕`, `+ Add unit`, `Clear — use the pattern instead`, **Times per week**; or **Total pages**, **Start at page**, **Pages per day pattern** (one number, or a cycle like 3, 4, 5, 3), **Finish by** (optional — pages per sitting are re-averaged toward this date on every build and every week; the pattern above is ignored while it is set), **Label** (`pp. 12–15` / `Lesson 12–15` / `Day 12–15`), **Times per week**.
   - ⏱: **What the day's cell says** text · **Times per week** · **Stop after** (optional — blank fills to the end of the map).
6. "No lessons left in the sequence. Generate new ones:" — **Prefix**, **How many** (sequenced modes, nothing remaining).
7. Red note "<Kid> has no day grid yet (no dated school days), so there's nowhere to build. Upload an Excel plan for <Kid> first." when no rows.
8. `Preview build`.
9. **Copy to another kid** (brings settings, pacing & lesson list — then Build for them) — kid chips.
10. Preview card: `Preview — nothing written yet` · tiles `days scheduled`, `N× (computed)` `per week`, `first day`, `finishes` · `➕ Extends the map by N new day(s) past its current end.` · `♻ N old future placement(s) of this subject will be replaced. Past days are untouched.` · ⚠ warnings · 🔁 today's-card note · sample weeks · `✓ Build into map` · `Cancel`.

What `cbApply` 53930 writes from the form (one `curriculum` update + pace): `lessons/<kid>/<dn>/<sk>` (old future placements → null, new texts), new rows `lessons/<kid>/<dn>` = `{week, date}` (and trailing empty rows pruned), `weekDays/<kid>/<wk>`, `subjects/<kid>/<sk>/pacing` = `{mode, startDate?, tpw?, targetDate?, windowEnd?, minutesText?, pages?{totalPages,startPage,pattern,unitLabel,units?}, builtThrough, builtAt}`, `subjects/<kid>/<sk>/allowedDays`, `…/days` = null, `…/timesPerWeek` (tpw used), `…/total`, `…/planAnchor` (plan-backed), `…/pjExtras`, `…/lessonSeq|lessonIds|nextLid` (rechunk / first build from card), `skiplog/<kid>/<sk>` (dismissed), `rebaseline/<kid>/<sk>`, `lastEdit`; `pace/subjects/<kid>/<sk>/adjust`; then `relayWeek("build")`.

### Appendix B — the subject card (edit sheet) and the Add sheet (132 controls; #4–#32 are the embedded Builder form and gate, the same controls as Appendix A #89–93 and #138–161)

Gating that applies to EVERY row: the whole Curriculum view renders only when `momHere()` (Mom mode or Admin PIN) — `renderCurriculumView` 29241 shows "Curriculum Locked" otherwise. So "Who" = Mom for all controls; rows marked **Mom (fn checks)** additionally re-check `momHere()` inside the handler.

Conventions in the Writes column:
- `ceSaveField(f)` (32242) = `curriculum/subjects/<kid>/<sk>/<f>` set **and** `curriculum/lastEdit` set; for a **daily, non-plan-backed** subject and a field in `RLW_LAY_FIELDS` (43810: mom, momDays, momDayMin, lessonDay*, tpw, cap, minutes, allowedDays, noCoopDays, coopDay, rulesTok, fixedTime, device) it also calls `relayWeek("curriculum")` → **re-lays week**.
- `savePaceSubject` (51822) = `pace/subjects/<kid>/<sk>` set (whole pace record for that one subject) + localStorage `ha_pace`.
- `_gvRelaySubject` (56770) = re-runs the Builder engine for the subject and opens `cbBuildGate` → `cbApply` (53930): one multi-path `curriculum` update (lessons cells, weekDays, subjects/…/pacing, planAnchor, allowedDays, days=null, timesPerWeek, total, pjExtras, skiplog, rebaseline, lastEdit) + `pace/subjects/<kid>/<sk>/adjust` + `relayWeek("build")` → **re-lays week**. Rows that call it say "Builder re-lay".
- `_rlwCurrDoor` (43951) / `relayWeek` (43575) = **re-lays week** (this week's cards, with Undo).


## 1. Control table

### 1A. EDIT sheet (`ceRenderEditSheet`, 32626)

| # | Label as shown on screen | Section of the sheet | What it does | Writes | Who | Also reachable from | Code |
|---|---|---|---|---|---|---|---|
| 1 | *(tap the dark backdrop outside the box)* | Sheet frame | Closes the sheet, re-renders app | none (UI state) | Mom | "Done" button (#102) | `ceCloseSheet` 32225 (onclick on `.ce-sheet`, 32633) |
| 2 | Display Name *(text input)* | Display Name | Renames the subject; also rewrites exact-match names in this kid's Rules ▸ workflow steps | `curriculum/subjects/<kid>/<sk>/display` + `curriculum/lastEdit`; `saveRules` (78983) when a workflow step named it | Mom | — | `ceRenameSubject` 32355 |
| 3 | 🧱 Pacing & build — days per week, allowed days, re-lay the plan ▾/▴ | 🧱 Pacing & build *(only tracking≠daily)* | Expands/collapses the embedded Builder form for this subject | none (UI state: `ceBuildOpen`, `cbForm`) | Mom | 🧱 button on the subject list card `ceBuildCard` 29633; "🧱 Pace & build it below" (#64); × in the embedded form (#4) | `ceOpenBuild` 29604 |
| 4 | × *(close, top-right of the embedded form)* | 🧱 Pacing & build (open) | Collapses the embedded Builder | none (UI state) | Mom | #3 | `ceOpenBuild` 29604 (54551) |
| 5 | ↩ Undo *(green banner, after a build)* | 🧱 Pacing & build (open; only when `cbLastBuild` is this subject and `cbMsg`) | Restores every path the last build changed | multi-path `curriculum` update (restore), `pace/subjects/<kid>/<sk>/adjust` set, `scheduleOverrides` save; reprojectSubjectWeek → re-lays this subject's week | Mom | Builder tab banner `renderCurrBuilder` 54464; card `_ceMaybeBuilder` 29621 | `cbUndo` 54358 |
| 6 | 🎯 Done by a date / 📅 Days per week / ⏳ Until a date / 📖 Pages / ⏱ Just minutes *(chips)* | 🧱 ▸ How should it be paced? | Picks the pacing mode of the form (nothing saved until Build) | none (UI state `cbForm.mode`) | Mom | Builder tab (same form, `renderCurrBuilder` 54484) | `cbSetMode` 54431 |
| 7 | Start on *(date input)* | 🧱 ▸ Start on (optional — nothing lands before this day…) | Sets the earliest build date | none (UI state) | Mom | Builder tab | `cbSetField('startDate')` 54432 |
| 8 | Mon Tue Wed Thu Fri *(chips)* | 🧱 ▸ Days it can land on (none selected = any school day) | Toggles allowed weekdays for the build | none (UI state) — written as `subjects/<kid>/<sk>/allowedDays` only by Build (#30) | Mom | Builder tab; Grid ▸ ⚙ Rules day pins `cbPinDay` 53397 (that one writes at once) | `cbToggleDay` 54434 |
| 9 | Finish by *(date)* | 🧱 ▸ mode 🎯 Done by a date | Target end date | none (UI state) | Mom | Builder tab | `cbSetField('targetDate')` |
| 10 | − / + *(Times per week stepper)* | 🧱 ▸ Times per week *(modes 📅, ⏳, 📖, ⏱)* | Steps 1–7 per week | none (UI state) — written as `timesPerWeek`/`pacing` by Build | Mom | Builder tab; Grid ▸ ⚙ Rules ×/wk `rlSet(…,'tpw')` 53418 (writes at once) | `cbStepTpw` 54433 |
| 11 | Stop after *(date)* | 🧱 ▸ mode ⏳ Until a date, and mode ⏱ Just minutes | Last date to lay | none (UI state) | Mom | Builder tab | `cbSetField('windowEnd')` |
| 12 | 📸 Scan the book *(file picker, images)* | 🧱 ▸ mode 📖 Pages | Sends photos of the TOC to the AI and fills the Units list | none to Firebase (UI state `cbForm.units`); outbound AI call using the saved key | Mom | Builder tab | `cbScanBook` 53809 |
| 13 | Label / start page / end page *(3 inputs per unit row)* | 🧱 ▸ Units (one per day, real boundaries — overrides the pattern below) | Edits a scanned/hand unit | none (UI state) | Mom | Builder tab | `cbUnitField` 53875 |
| 14 | ✕ *(per unit row)* | 🧱 ▸ Units | Removes that unit | none (UI state) | Mom | Builder tab | `cbUnitRemove` 53880 |
| 15 | + Add unit | 🧱 ▸ Units | Appends a unit row | none (UI state) | Mom | Builder tab | `cbUnitAdd` 53881 |
| 16 | Clear — use the pattern instead | 🧱 ▸ Units | Drops the unit list, back to pages-per-day pattern | none (UI state) | Mom | Builder tab | `cbUnitsClear` 53888 |
| 17 | Total pages *(number)* | 🧱 ▸ mode 📖 Pages (no units) | Total pages in the book | none (UI state) | Mom | Builder tab | `cbSetField('totalPages')` |
| 18 | Start at page *(number)* | 🧱 ▸ mode 📖 Pages (no units) | First page | none (UI state) | Mom | Builder tab | `cbSetField('startPage')` |
| 19 | Pages per day pattern (one number, or a cycle like 3, 4, 5, 3) *(text)* | 🧱 ▸ mode 📖 Pages (no units) | Pages per sitting cycle | none (UI state) | Mom | Builder tab | `cbSetField('patternStr')` |
| 20 | Finish by (optional — pages per sitting are re-averaged…) *(date)* | 🧱 ▸ mode 📖 Pages (no units) | Target end for the pages mode | none (UI state) | Mom | Builder tab | `cbSetField('targetDate')` |
| 21 | pp. 12–15 / Lesson 12–15 / Day 12–15 *(chips)* | 🧱 ▸ Label | How the day's cell is worded | none (UI state) | Mom | Builder tab | `cbSetField('unitLabel')` |
| 22 | What the day's cell says *(text)* | 🧱 ▸ mode ⏱ Just minutes | Cell text for a minutes-only subject | none (UI state) | Mom | Builder tab | `cbSetField('minutesText')` |
| 23 | Prefix *(text)* | 🧱 ▸ "No lessons left in the sequence. Generate new ones:" *(only when 0 remaining in 🎯/📅/⏳)* | Prefix for generated lesson names | none (UI state) | Mom | Builder tab | `cbSetField('genPrefix')` |
| 24 | How many *(number)* | 🧱 ▸ same box | Count of lessons to generate | none (UI state) | Mom | Builder tab | `cbSetField('genCount')` |
| 25 | Preview build | 🧱 ▸ bottom of form | Runs the pacing engine, shows "Preview — nothing written yet" | none (UI state `cbPreviewRes`) | Mom | Builder tab | `cbRunPreview` 53766 |
| 26 | *(kid name chips, e.g.* Ellis *,* Lucy ✓*)* | 🧱 ▸ Copy to another kid (brings settings, pacing & lesson list — then Build for them) | Creates the same subject (settings + pacing + lesson list, fresh ids) for another kid and jumps to their Builder | `curriculum/subjects/<toKid>/<sk>` set (whole new subject), `curriculum/lastEdit`; `_rlwCurrDoor` → re-lays week (daily) | Mom | Builder tab (same chips) | `cbCopyTo` 53455 |
| 27 | ✓ Build into map | 🧱 ▸ Preview card | Applies the preview (or opens the leftover gate first) | see `cbApply` in conventions: multi-path `curriculum` update + `pace/subjects/<kid>/<sk>/adjust` + **re-lays week**; localStorage `ha_cbUndo` | Mom | Builder tab; Grid column ↻ via `_gvRelaySubject` | `cbBuildGate` 54182 → `cbApply` 53930 |
| 28 | Cancel *(Preview card)* | 🧱 ▸ Preview card | Drops the preview | none (UI state) | Mom | Builder tab | inline `cbPreviewRes=null;renderAll()` 54700 |
| 29 | ↪ Keep / ✕ Dismiss *(per leftover row)* | Gate sheet "leftover lessons" *(opens over the sheet only when a legacy, non-plan-backed subject has stale/duplicate future cells)* | Toggles whether a leftover lesson moves ahead or is skipped for good | none until confirm | Mom | Grid ↻ paths that reach `cbBuildGate` | `cbGateToggle` 54193 |
| 30 | Keep all / Dismiss all | Gate sheet | Sets all rows | none until confirm | Mom | same | `cbGateAll` 54197 |
| 31 | ✓ Build — keep N, dismiss M | Gate sheet | Records decisions and applies the build | `cbDecisions` then `cbApply` (as #27) | Mom | same | `cbGateConfirm` 54238 |
| 32 | Cancel *(gate; also tap outside)* | Gate sheet | Aborts; if the gate was opened by "Save list" it ROLLS THE LIST BACK; after a delete it keeps the delete | may write `curriculum` update (restore lessonSeq/lessonIds/nextLid/total + lastEdit) when cancelling a list save; `saveScheduleOverrides` when cancelling a park | Mom | same | `cbGateCancel` 54201 |
| 33 | Sequenced | Lesson Tracking | Sets tracking to sequenced | `ceSaveField('tracking')` | Mom | — | `ceSetTracking('sequenced')` 34323 |
| 34 | Daily (no lesson #) | Lesson Tracking | Makes it a daily; if it has lessons: confirm, clear FUTURE grid cells, lesson list, ids, total, set Mon–Fri days, drop pace record | multi-path `curriculum` update (`lessons/<kid>/<dn>/<sk>`=null future, `subjects/<kid>/<sk>/tracking`, `lessonSeq`, `lessonIds`, `nextLid`, `total`, `allowedDays`, `lastEdit`); `pace/subjects/<kid>/<sk>` remove | Mom | — | `ceSetTracking('daily')` 34323 |
| 35 | None / *(sequenced subject names)* *(chips)* | 📝 Practice for — the weekly lesson this daily card practices *(only tracking=daily, and only when another sequenced unpaused subject exists or practiceFor is set)* | Links the daily card to the lesson it practices (display only) | `curriculum` update `subjects/<kid>/<sk>/practiceFor` + `lastEdit` | Mom (fn checks) | — | `cePracticeSet('practiceFor')` 3097 |
| 36 | − / + *(Day stepper)* | 📝 Practice for ▸ "Practice days start at Day N" *(only when practiceFor set)* | Day number the practice cards start at (1–9) | `curriculum` update `subjects/<kid>/<sk>/practiceDayFrom` + `lastEdit` | Mom (fn checks) | — | `cePracticeSet('practiceDayFrom')` 3097 |
| 37 | Whole lesson / Part of it *(chips)* | 👩 Mom's part — how much of the N min needs you *(only when mom==="required" and minutes≥10, or momPartMins already set)* | Whether Mom is needed for only part of the lesson | `curriculum` update `subjects/<kid>/<sk>/momPartMins` (number or null) + `lastEdit` | Mom (fn checks) | — | `ceMomPartSet('momPartMins')` 3131 |
| 38 | − / + *(With Mom N min stepper)* | 👩 Mom's part *(only when Part of it)* | Steps Mom's minutes by 5 | same path as #37 | Mom (fn checks) | — | `ceMomPartSet('momPartMins')` |
| 39 | ☐ Mom at the beginning (off = the kid starts alone and Mom joins for the last N min) | 👩 Mom's part *(only when Part of it)* | Mom at start vs end | `curriculum` update `subjects/<kid>/<sk>/momPartStart` (true/null) + `lastEdit` | Mom (fn checks) | — | `ceMomPartSet('momPartStart')` |
| 40 | Minimum time before it can be checked *(number, placeholder "off")* | ⏱ Timed card — a minimum before it can be checked | Minutes before the card can be checked (0/blank = off) | `ceSaveField('minMin')` | Mom (fn checks) | Settings ▸ Family rules ▸ ⏱ Timed cards sets the family default (`mmRuleSet` 11603, `config/rules/minMinutes`) — not the same path | `mmEditorSet('minMin')` 11582 |
| 41 | ☐ Show the countdown to the kid | ⏱ Timed card | Shows/hides the countdown on the kid's card | `ceSaveField('minShow')` | Mom (fn checks) | — | `mmEditorSet('minShow')` 11582 |
| 42 | None / *(📚 study session names)* *(chips)* | 📚 Study session *(only when `mstSessions(kid)` has sessions or s.study set)* | Makes the card open a memory-study sitting; picking one also sets noCarry | `ceSaveField('study')`; picking a session also `ceSaveField('noCarry',true)` | Mom | Add sheet 📚 Study session (#122, form only) | inline onclick 32674–32675 |
| 43 | ☐ Allow out-of-order check-offs (off = a card can't be checked while an earlier lesson is still open) | *(after Study session; only sequenced + lesson-id-stamped)* | Lets later cards be checked before earlier ones | `ceSaveField('allowOutOfOrder')` | Mom | — | inline onchange 32680 |
| 44 | − / + *(Cap stepper)* "Cap — most sittings of this subject in one day" | *(same block; only plan-backed with pacing mode timesPerWeek/targetDate)* | Max sittings per day 1–4; Builder re-lay | `ceSaveField('cap')` then `_gvRelaySubject` → Builder re-lay (**re-lays week**) | Mom | Grid ▸ ⚙ Rules cap − / + `rlSet(…,'cap',…,true)` 53418 (~53612) | `ceSetCap` 34511 |
| 45 | ↻ Re-lay remaining | *(same block)* | Confirm; moves the plan anchor to today and re-lays every unfinished lesson evenly | `ceSaveField('planAnchor')` then `_gvRelaySubject` → Builder re-lay (**re-lays week**); sets `_gvDelUndo` | Mom (fn checks) | Builder ✓ Build (cbApply also writes planAnchor=today for plan-backed, 54100) | `ceRelayRemaining` 34519 |
| 46 | ✓ Fixed time / Off — packed into the day *(chip)* | ⏰ Set time — a class that happens at a fixed clock time | Turns the subject into a fixed-time class (default 10:00 AM) or back off (clears dates too) | `ceSaveField('fixedTime')` (+ `fixedDates`=null when turning off); fixedTime ∈ RLW_LAY_FIELDS → **re-lays week** for dailies | Mom | Add sheet ⏰ Set time (#117, form only); SETTIME_TODAY (`fixedTimeByDate/<date>`, a different per-day leaf) | `fxDoorToggle` 32303 |
| 47 | Starts at *(time input)* | ⏰ Set time *(only when on)* | Class start time (stored 12h) | `ceSaveField('fixedTime')` → re-lays week for dailies | Mom | — | `fxDoorSetTime` 32314 |
| 48 | Runs for *(number)* minutes | ⏰ Set time *(only when on)* | Class length (min 5) | `ceSaveField('minutes')` → re-lays week for dailies | Mom | Grid ▸ ⚙ Rules minutes − / + `rlSet(…,'minutes',…,true)` 53418 | inline onchange 32717 |
| 49 | Meeting dates — optional, but exact *(textarea, YYYY-MM-DD per line)* | ⏰ Set time *(only when on)* | Exact meeting dates; unreadable ones are reported | `ceSaveField('fixedDates')` (array or null) | Mom | Add sheet Meeting dates (#119, form only) | `fxDoorSetDates` 32323 |
| 50 | Join link — optional *(text, https://…)* | ⏰ Set time *(only when on)* | Link the class card opens | `ceSaveField('joinUrl')` | Mom | Add sheet Join link (#120, form only) | `fxDoorSetUrl` 32330 |
| 51 | *(template input, placeholder https://example.com/{book}/chapter-{chapter}/lesson-{lesson})* | 🔗 Lesson link — optional; each card opens its own lesson page or video *(only when momHere)* | Per-subject URL template filled from the lesson ref | `ceSaveField('lessonUrl')` | Mom (fn checks) | — | `llSetTemplate` 39159 |
| 52 | Button says *(text, placeholder "Nicole the Math Lady")* | 🔗 Lesson link | Label on the card's link button | `ceSaveField('linkLabel')` | Mom (fn checks) | — | `llSetLabel` 39164 |
| 53 | 🔗 Set link for this lesson — wins over the template *(select of lessons, ✓ = done)* | 🔗 Lesson link *(only when the subject has a lesson list)* | Picks which lesson the override input edits | none (UI state `llPickKey`) | Mom | — | `llPick` 39170 |
| 54 | *(override input, placeholder "https://… (empty = use the template)")* | 🔗 Lesson link | Per-lesson link (https only); clears when empty | `curriculum/subjects/<kid>/<sk>/lessonUrls/<lessonId>` set/null + `curriculum/lastEdit`; `_rlwCurrDoor` → **re-lays week** | Mom (fn checks) | — | `llSetOverride` 39172 |
| 55 | ✕ *(per listed override, title "Back to the template")* | 🔗 Lesson link ▸ "N lessons with its own link:" | Removes that lesson's own link | same as #54 (null) | Mom (fn checks) | — | `llSetOverride(k,'')` 39172 |
| 56 | ✓ Extras can use other days / Only its own days *(chip)* | When behind | Whether catch-up sittings may land on non-pattern days | `ceSaveField('overflowExtras')` (false or true) | Mom | — | `ceToggleOverflow` 32336 |
| 57 | ✓ Required / Off *(chip)* | Mom Check | Kid's check-off waits for Mom's approval (needs the kid's master switch) | `ceSaveField('momVerify')` | Mom | Kid master switch "Mom Check ON/OFF" is `curriculum/momVerifyKid/<kid>` — Subjects header 29350 and Grid 🏁 panel 57428 (`ceToggleMomVerifyKid` 32383), a different path | `ceToggleField('momVerify')` 32341 |
| 58 | *(toggle switch)* On — the check-off asks "what page did you stop at?" / Off | 📚 Reading Log — check-offs log this reading on their bookshelf | Check-offs of this subject reach the kid's Reading Log | `ceSaveField('readingLog')` | Mom | — | inline onclick 32789 |
| 59 | Kid logs the page / Kid logs it · Mom logs it *(chips)* | 📚 Reading Log *(only when on)* | Who answers the reading-log prompt | `ceSaveField('readingLogBy')` ('kid'/'mom') | Mom | — | inline onclick 32802–32803 |
| 60 | None / *(workbook names)* *(chips)* | 📕 Workbook — cards open the exercise on the iPad *(section shown when `wbList` exists; chips only when workbooks are uploaded)* | Links the subject to an uploaded workbook PDF | `ceSaveField('workbook')` (id or null) | Mom | Workbooks are added under 🏡 HQ ▸ 📕 Workbooks (different data) | inline onclick 32815–32816 |
| 61 | ✓ On / Off *(chip)* | Record Score | Mom records a score when approving | `ceSaveField('scored')` | Mom | — | `ceToggleField('scored')` 32341 |
| 62 | Points (18/20) / Percent (90%) / Rating (★) *(chips)* | Record Score *(only when on)* | Score format | `ceSaveField('scoreType')` | Mom | — | inline onclick 32833 |
| 63 | − / + *(stepper)* | Carryover Cap *(sequenced only)* | Max extra lessons carried from missed weeks (0–5) | `ceSaveField('carryoverCap')` | Mom | Add sheet Carryover Cap (#130, form only); upload default 40390 | inline onclick 32845/32847 |
| 64 | 🧱 Pace & build it below | 📊 Not in the Grid/Map yet *(blue box; only when a sequenced subject has a lessonSeq but no Excel/grid lessons and no first/last rule)* | Expands the embedded Builder (same as #3) | none (UI state) | Mom | #3 | `ceOpenBuild` 29604 (32862) |
| 65 | Clear them | Progress ▸ "⚠ Old hand-count corrections on this subject…" *(plan-backed only, and only if offset/adjust/paceAdjust ≠ 0)* | Confirm; zeroes legacy offset/adjust/paceAdjust on the pace record | `savePaceSubject` → `pace/subjects/<kid>/<sk>` set | Mom (fn checks) | — | `cePaceClearHand` 32423 |
| 66 | *(number)* of *(number)* — "Completed (progress)" | Completed (progress) *(legacy, NOT plan-backed, sequenced)* | First box = done count for progress bars (stores paceAdjust offset); second = total (denominator) | `savePaceSubject` → `pace/subjects/<kid>/<sk>` set (`paceAdjust` / `total`) | Mom | — | `ceSetCount('paceAdjust')` 32394; `ceSetTotal` 32409 |
| 67 | *(number)* done · next: … — "Schedule next-lesson" | Schedule next-lesson *(legacy, NOT plan-backed)* | Generator cursor position (stores `adjust`) | `savePaceSubject` → `pace/subjects/<kid>/<sk>` set (`adjust`) | Mom | Builder ✓ Build folds adjust into the map (cbApply 54035) | `ceSetCount('adjust')` 32394 |
| 68 | 🧹 Walk back check-offs… | Fix false check-offs *(sequenced only)* | Opens the walk-back panel; loads `walkbacks` once | none to Firebase (reads `walkbacks`) | Mom | — | `ceWalkToggle` 32477 |
| 69 | ☐ *(one per found check-off: title — detail · week day · time)* | Fix false check-offs *(open)* | Selects check-offs to retract; updates the summary line in place | none (UI state `ceWalkSel`) | Mom | — | `ceWalkToggleItem` 32486 |
| 70 | ☑ Also remove them from this week's schedule — the lesson comes back via the cursor… | Fix false check-offs *(open)* | Whether the retracted task rows also leave this week | none until apply | Mom | — | checkbox `#ce-walk-remove` 32922 (read by `ceWalkApply`) |
| 71 | Note — why? (e.g. said done, couldn't show me — struggling) *(text)* | Fix false check-offs *(open)* | Note saved into the snapshot | none until apply | Mom | — | input `#ce-walk-note` 32923 |
| 72 | Walk back selected | Fix false check-offs *(open)* | Confirm; un-checks the selected items across this week and archived weeks, removes done-by-id records, optionally deletes the task rows, saves a snapshot, re-lays | `curriculum` update (done-by-id removes + lastEdit); `<WK>/checked` update (ids→null); `<WK>/history/<id>` remove; `<WK>/tasks/<id>` remove (when #70 ticked); `archive/<wk>/checked/<id>` and `archive/<wk>/history/<id>` remove; `walkback_excl/<baseId>` set true; `walkbacks/<kid>/wb_<ts>` set; `obRemove(<WK>/claimed/<id>)`; localStorage mirrors; `schedCascade()`; `_gvRelaySubject` per touched Builder-paced subject → **re-lays week** | Mom | — | `ceWalkApply` 32499 |
| 73 | Cancel *(walk-back)* | Fix false check-offs *(open)* | Closes the panel | none (UI state) | Mom | — | `ceWalkToggle` 32477 |
| 74 | Pace keyword — matches task titles for the auto-count *(text)* | Pace keyword *(only when a `pace/subjects/<kid>/<sk>` record exists)* | Keyword the legacy auto-count matches | `savePaceSubject` → `pace/subjects/<kid>/<sk>` set (`keyword`) | Mom | — | `updatePaceField(…,'keyword')` 59930 |
| 75 | Starts week *(number)* | Starts week *(same condition)* | Week the pace tracking starts | `savePaceSubject` → `pace/subjects/<kid>/<sk>` set (`startWeek`) | Mom | — | `updatePaceField(…,'startWeek')` 59930 |
| 76 | *(text input, one per lesson line; ▶ = current, ✓ = done)* | Lesson list (N lessons · M done) *(stamped subjects)* | Renames one lesson by list index (id kept) and rewrites any grid cell carrying the old text | `curriculum` update (`subjects/<kid>/<sk>/lessonSeq`, `lessonIds`, `nextLid` via setLessonSeq; `lessons/<kid>/<dn>/<sk>` for matching cells; `lastEdit`) | Mom | Grid cell edit `gvSave*` (writes `lessons/…` cells; separate path) | `ceEditListLesson` 34528 |
| 77 | *(text input, one per lesson line)* | Lesson list (N entries · cursor at K) *(Excel/grid-backed, not stamped)* | Renames one grid lesson cell in place; re-lays | `curriculum/lessons/<kid>/<dayNum>/<sk>` set + `curriculum/lastEdit`; `_rlwCurrDoor` → **re-lays week** | Mom | Grid cell editor (same `lessons/…` path) | `ceEditLesson` 34544 |
| 78 | ↩ Put them back | Lesson list ▸ "↩ <Subject> — N cells were cleared … This puts those cells back…" *(blue banner; only when a `ha_convUndo` restore point ≤72 h exists for this subject)* | Confirm; restores cleared grid cells and the previous lesson list | `curriculum` update (`lessons/<kid>/<dn>/<sk>` cells, `subjects/<kid>/<sk>/lessonSeq`/`lessonIds`/`nextLid`/`total`, `lastEdit`); `pace/subjects/<kid>/<sk>` set (total); localStorage `ha_convUndo` removed | Mom (fn checks) | Grid banner `ceConvUndoBanner(gvKid,"grid")` 57619 | `ceConvUndoApply` 34442 |
| 79 | Dismiss *(banner)* | same banner | Confirm; forgets the restore point | none to Firebase (localStorage `ha_convUndo` removed) | Mom | Grid banner 57619 | `ceConvUndoDismiss` 34426 |
| 80 | ✎ Edit as a list — insert / remove / reorder… | Lesson list *(stamped or grid-backed; when the list editor is closed)* | Opens the textarea list editor | none (UI state `ceConvOpen`) | Mom | — | inline onclick 33002 |
| 81 | *(textarea, one lesson per line)* | Lesson list ▸ list editor *(open)* | Edit the whole list (stamped) or everything from the cursor (legacy); survives re-renders | none until Save | Mom | — | textarea `#ce-conv-lines` 33027 |
| 82 | Save list | Lesson list ▸ list editor | Confirm; writes the list (ids aligned, total), closes the sheet, re-lays via the Builder gate; Undo folded into the relay | `curriculum` update (`subjects/<kid>/<sk>/lessonSeq`, `lessonIds`, `nextLid`, `total`, `lastEdit`); `pace/subjects/<kid>/<sk>` set (total); `_gvRelaySubject` → Builder re-lay (**re-lays week**); sets `_gvDelUndo` (rollback on gate cancel) | Mom | — | `ceConvApply` 34361 |
| 83 | ↕ Sort in book order | Lesson list ▸ list editor | Natural-sorts the textarea lines (nothing saved) | none (UI state) | Mom | — | `ceConvSortLines` 34279 |
| 84 | ✂ Trim descriptions | Lesson list ▸ list editor | Keeps just the lesson code on each line (nothing saved) | none (UI state) | Mom | — | `ceConvTrimLines` 34272 |
| 85 | Days per lesson: ×1 ×2 ×3 ×4 ×5 | Lesson list ▸ list editor | Expands each line into "· day k of N" sittings in the textarea (nothing saved) | none (UI state) | Mom | Add sheet Days per lesson (#128) | `ceConvDaysPerLesson` 34265 |
| 86 | Cancel *(list editor)* | Lesson list ▸ list editor | Closes the editor | none (UI state) | Mom | — | inline onclick 33035 |
| 87 | *(textarea, one lesson per line)* | Lesson list *(subject has a lessonSeq but no grid cells and is not stamped)* | Saves the lesson list on blur/change | `curriculum` update (`subjects/<kid>/<sk>/lessonSeq`, `lessonIds`, `nextLid`, `total`, `lastEdit`) | Mom | — | `ceSaveLessonSeq` 34310 (textarea `#ce-edit-lessons` 33040) |
| 88 | *(textarea, placeholder "pg 1-3 / pg 4-6 / pg 7-9")* | "No lessons defined. This subject won't appear in generated weeks until lessons are added." | Same as #87 for a subject with no lessons yet | same as #87 | Mom | — | `ceSaveLessonSeq` 34310 (33050) |
| 89 | Day it was done (optional): *(date input)* | ✓ Mark a lesson done *(panel under the lesson list; sequenced)* | Optional date recorded with the mark; moves the lesson's cell to that day | none until a mark | Mom | Grid cell menu "Day it was done" `gvMarkMenuHTML` 56963 | input `#ce-md-day` 33166 |
| 90 | clear *(underlined)* | ✓ Mark a lesson done | Empties the date box | none (UI state) | Mom | — | inline onclick 33167 |
| 91 | ✓ *(one per upcoming lesson, title "Mark just this one done")* | ✓ Mark a lesson done | Confirm; marks that lesson done off-app and re-lays from the next unfinished | `curriculum` update: `subjects/<kid>/<sk>/manualDone` (legacy only), `done/<kid>/<sk>/<lid>` (lidMarkDone), `lessons/<kid>/<dn>/<sk>` cell moves when a day is given, `lastEdit`; `lnHandoff`; `_ceRelayAfterMark` → `_gvRelaySubject` Builder re-lay or `_rlwCurrDoor` (**re-lays week**) | Mom (fn checks) | Grid cell menu "✓ Mark done" `gvMarkThrough` 56970 → same `_ceMarkDoneApply` | `ceMarkLessonDone(…,false)` 33204 → `_ceMarkDoneApply` 33256 |
| 92 | ↓ through here *(one per upcoming lesson, title "Mark this and every lesson above it done")* | ✓ Mark a lesson done | Confirm; marks this and every unfinished lesson above it | same as #91 | Mom (fn checks) | Grid "✓ Mark done" (always "through") 56970 | `ceMarkLessonDone(…,true)` 33204 |
| 93 | ↩ *(per chip, title "Mark not done")* | ✓ Mark a lesson done ▸ "⚠ N finished out of order" *(stamped subjects with a gap)* | Confirm; removes that lesson's done record so it is owed again; re-lays | `curriculum` update (`done/<kid>/<sk>/<lid>`=null, `lastEdit`); `_ceRelayAfterMark` → **re-lays week**; sets `_gvDelUndo` | Mom (fn checks) | Grid cell menu "↩ Not done" `gvMarkNotDone` 56986; Grid out-of-order buttons open this sheet 57531 | `ceUnfinishLesson` 34106 |
| 94 | ↩ Make done contiguous (N) | same "finished out of order" box | Confirm; un-finishes every out-of-order lesson at once | same as #93 for each | Mom (fn checks) | — | `ceMakeContiguous` 34117 |
| 95 | × *(per green chip)* "Hand-marked done (N) — tap ✕ to undo" | ✓ Mark a lesson done | Removes a hand-mark (by lesson id or legacy text) and re-lays | `curriculum` update (`done/<kid>/<sk>/<lid>`=null) or `curriculum/subjects/<kid>/<sk>/manualDone` set (+ lid twin removed); `curriculum/lastEdit`; `_ceRelayAfterMark` → **re-lays week** | Mom (fn checks) | Grid "↩ Not done" on a legacy hand-mark `gvMarkNotDone` 56995 | `ceUnmarkLessonDone` 33301 |
| 96 | − *(−25)* | 🏆 Completion reward — points + a trophy when this subject finishes *(sequenced)* | Lowers the completion points | `ceSaveField('completionPoints')` | Mom | — | inline onclick 33060 |
| 97 | + *(+25)* | 🏆 Completion reward | Raises the completion points | `ceSaveField('completionPoints')` | Mom | — | inline onclick 33062 |
| 98 | *(number input, step 5)* | 🏆 Completion reward | Sets the points directly | `ceSaveField('completionPoints')` | Mom | — | inline onchange 33063 |
| 99 | *(toggle switch)* Books: … (last one → 🏆 above) / Off — turn on to auto-detect books | 📖 Book milestones — points + a badge when a book inside this subject finishes *(only when the detector finds books, or the flag is explicitly false)* | Turns mid-sequence book celebrations on/off | `ceSaveField('bookMilestones')` (false or null) | Mom | — | inline onclick 33074 |
| 100 | − *(−5)* / + *(+5)* / *(number input)* | 📖 Book milestones *(only when on and books found)* | Points per finished book | `ceSaveField('bookPoints')` | Mom | — | inline 33080–33083 |
| 101 | *(toggle switch)* Active / Paused · since … | Status | Pauses or resumes the subject; resume of a plan-backed subject moves the anchor to today; this week's open cards leave/return (lane partners follow) | `ceSaveField('paused')`, `ceSaveField('pausedSince')`, `ceSaveField('planAnchor')` (plan-backed resume); `lnPauseRelay` → `reprojectSubjectWeek` (re-lays this subject's and lane partners' cards); `relayWeek` for dailies → **re-lays week** | Mom | ⏸/▶ button on the subject list card `ceQuickPause` 33379 (same three paths + relays, written directly) | `ceTogglePause` 33357 |
| 102 | Done | Actions | Closes the sheet | none (UI state) | Mom | backdrop tap (#1) | `ceCloseSheet` 32225 |
| 103 | Delete Subject | Actions (full-width red) | Confirm; removes the subject, its grid cells, Lesson-Map overrides, pace record, this week's open tasks, skip/rebaseline records and workflow entries; past history kept; other subjects re-lay into the freed time | `curriculum/subjects/<kid>/<sk>` remove; `curriculum/lessons/<kid>` update (cells→null); `scheduleOverrides/<date>/<kid>` set; `pace/subjects/<kid>/<sk>` remove; `<WK>/tasks` update (open ids→null); `curriculum/skiplog/<kid>/<sk>` and `curriculum/rebaseline/<kid>/<sk>` remove; `saveRules` (workflow); `curriculum/lastEdit`; `_rlwCurrDoor(…,{sweep:true})` → **re-lays week** | Mom | Grid "Remove N deleted subjects" `gvPurgeOrphans` 56015 shares `_gvPurgeSubject` (cells/overrides/pace only) | `ceDeleteSubject` 34579, `_gvPurgeSubject` 34563 |

Read-only elements in the edit sheet (no control): the "Device, mom, minutes, days, ×/wk, cap, priority, first/last, sticky, carry, rules and max/day live in ⚙ Rules above the Grid" note (32642); the pacing-mode helper lines; "Pinned to: <days> — set the weekday with the Days control above." (32722); the 🛤 Lane standing line "(edit in Grid ▸ ⚙ Rules ▸ 🛤 Lanes)" (32886); Progress "N of M done · next: …" (32880); the "Previous walk-backs" list (32937); the Preview card tiles and sample weeks (54682–54697).

### 1B. ADD sheet (`ceRenderAddSheet`, 34662)

All controls below edit the in-memory form `ceAddForm` only, until "Add Subject" — except #114 (rule conflicts) which writes other subjects at once, and #132 (Add Subject).

| # | Label as shown on screen | Section of the sheet | What it does | Writes | Who | Also reachable from | Code |
|---|---|---|---|---|---|---|---|
| 104 | *(tap backdrop)* | Sheet frame "Add Subject for <Kid>" | Closes the sheet | none (UI state) | Mom | Cancel (#131) | `ceCloseSheet` 32225 |
| 105 | *(kid name chips: Lincoln · Ellis · Lucy · Julian)* | Who does this? | Picks who does it; 2+ kids turns the save into a Family Time item | none (UI state `ceAddForm.who`) | Mom | — | `famWhoToggle` 37967 |
| 106 | Right after lunch / At a set time / Scheduler picks *(chips)* | Who does this? ▸ Starts *(only 2+ kids and no existing block for exactly those kids)* | When the new family time starts | none (UI state `famAt`) | Mom | — | `famWhoSetStart` 37974 |
| 107 | Starts at *(time input)* | Who does this? ▸ Starts *(only "At a set time")* | Clock time for the family block | none (UI state `famTime`) | Mom | — | `famWhoSetTime` 37975 |
| 108 | Subject Name *(text, placeholder "e.g. Piano Practice")* | Subject Name | The display name; its slug becomes the subject key | none until save | Mom | — | inline onchange 34673 (`#ce-add-name`) |
| 109 | 📄 Paper / 💻 Computer / 📱 iPad/Phone / 📖 Book / 🎹 Keyboard *(chips)* | Device | Device the subject uses | none until save (→ `device`) | Mom | Grid ▸ ⚙ Rules device chips `rlSet(…,'device')` (edits later) | inline onclick 34679 |
| 110 | None / Maybe / Required *(chips)* | Mom Requirement | How much Mom is needed | none until save (→ `mom`) | Mom | Grid ▸ ⚙ Rules Mom chips `rlSet(…,'mom')` | inline onclick 34687 |
| 111 | − / + | Duration (minutes) | Steps 5–60 min in place (no re-render) | none until save (→ `minutes`) | Mom | Edit sheet "Runs for" (#48); Rules minutes | `ceAddStepMin` 32574 |
| 112 | − / + | Times Per Week | Steps 1–7 | none until save (→ `timesPerWeek`) | Mom | Rules ×/wk `rlSet('tpw')`; Builder | inline onclick 34701/34703 |
| 113 | Mon Tue Wed Thu Fri Sat *(chips)* | Days | Toggles the day set (kept in order) | none until save (→ `days` string and `allowedDays`) | Mom | Rules day pins `cbPinDay`; Builder days | `ceAddToggleDay` 34890 |
| 114 | sequential / sticky / first / last of day / last of own work *(chips)* | Scheduling Rules | Toggles a rule token; **first / last / last of own work**: if another subject already owns that slot, confirm and strip it from that subject NOW | none for the new subject until save; **first/last/lastOwn conflict path writes `curriculum/subjects/<kid>/<other>/rules` set immediately and `_rlwCurrDoor` → re-lays week** | Mom | Rules panel order chips `rlSet(…,'rulesTok')` 53418 | `ceAddToggleRule` 34900 |
| 115 | Stick with: — pick a subject — *(select)* | Scheduling Rules ▸ sticky box *(only when "sticky" chosen)* | Subject to schedule next to | none until save (→ `stickyWith`) | Mom | Rules `rlSet(…,'stickyWith')` 53418 | inline onchange 34733 |
| 116 | Before / After *(chips)* | Scheduling Rules ▸ sticky box ▸ Order | Side of the partner | none until save (→ `stickyOrder`) | Mom | Rules `rlSet(…,'stickyOrder')` | inline onclick 34741–34742 |
| 117 | ✓ Fixed time / Off — packed into the day *(chip)* | ⏰ Set time — a class at a fixed clock time | Toggles class mode (default 10:00 AM); off clears dates | none until save (→ `fixedTime`, `fixedDates`) | Mom | Edit sheet #46 | `ceAddToggleClass` 32283 |
| 118 | Starts at *(time)* | ⏰ Set time *(on)* | Class start | none until save | Mom | Edit sheet #47 | `ceAddSetClassTime` 32288 |
| 119 | Meeting dates — optional, but exact *(textarea)* | ⏰ Set time *(on)* | Exact dates, parsed/validated; message shown | none until save (→ `fixedDates`) | Mom | Edit sheet #49 | `ceAddSetClassDates` 32292 |
| 120 | Join link — optional *(text)* | ⏰ Set time *(on)* | Class link (validated by `fxSafeUrl` on save) | none until save (→ `joinUrl`) | Mom | Edit sheet #50 | inline oninput 34784 |
| 121 | Sequenced / Daily (no lesson #) *(chips)* | Lesson Tracking | Tracking mode; hides the lesson/priority/carryover block when daily | none until save (→ `tracking`) | Mom | Edit sheet #33/#34 | inline onclick 34791–34792 |
| 122 | None / *(study session names)* *(chips)* | 📚 Study session *(only when `mstSessions(kid)` has sessions)* | Card opens a study sitting (saved with `noCarry:true`) | none until save (→ `study`, `noCarry`) | Mom | Edit sheet #42 | inline onclick 34800–34801 |
| 123 | Auto-number / Type lesson list *(chips)* | Lessons *(sequenced only)* | How the lesson list is produced | none until save | Mom | — | inline onclick 34810–34811 |
| 124 | Lesson / pg / Ch. / Unit / Module / Week / Ex. *(chips)* | Lessons ▸ Prefix *(Auto-number)* | Prefix for generated names | none until save | Mom | Builder "Prefix" (#23) for an existing subject | inline onclick 34818 |
| 125 | −10 / *(number 1–500)* / +10 | Lessons ▸ Total *(Auto-number)* | Last lesson number | none until save (→ list length / `total`) | Mom | — | inline 34825/34827; `ceAddSetTotal` 32279 |
| 126 | start at *(number)* | Lessons ▸ Total row | First lesson this kid sees (earlier ones simply not in the list) | none until save (`startAt`) | Mom | — | inline onchange 34830 |
| 127 | Lessons (one per line) *(textarea)* | Lessons *(Type lesson list)* | Each line becomes a lesson | none until save (`manualLessons`) | Mom | Edit sheet list editors (#81, #87) | inline onchange/oninput 34836 (`#ce-add-lessons`) |
| 128 | − / + | Days per lesson *(sequenced only)* | Each lesson becomes N "· day k of N" sittings (1–10) | none until save (list expanded by `lessonExpandDays`) | Mom | Edit sheet ×1–×5 (#85) | inline onclick 34843/34845 |
| 129 | Low / Normal / High *(chips)* | Priority *(sequenced only)* | Scheduling priority | none until save (→ `priority`) | Mom | Rules panel priority chips `rlSet(…,'priority')` | inline onclick 34854 |
| 130 | − / + | Carryover Cap *(sequenced only)* | 0–5 | none until save (→ `carryoverCap`) | Mom | Edit sheet #63 | inline onclick 34861/34863 |
| 131 | Cancel | Actions | Closes the sheet, form discarded | none (UI state) | Mom | backdrop (#104) | `ceCloseSheet` 32225 |
| 132 | Add Subject | Actions | Validates name/lessons; **1 kid**: creates the subject (sequenced ones are born plan-backed with lesson ids, `planId`, `doneImportedAt`; class fields ride along), re-lays, then reopens the EDIT sheet with 🧱 expanded. **2+ kids**: creates/joins a Family Time block instead (Mom mode required) and jumps to the Family editor | 1 kid: `curriculum/subjects/<kid>/<key>` set (whole new record), `curriculum/lastEdit`; `_rlwCurrDoor` → **re-lays week**. 2+ kids: `famWrite` (36755) → `rulesData.familyBlocks/<id>` or `<id>/items` (config rules) | Mom (famWhoSave checks momHere) | `cbCopyTo` (#26) also creates a whole subject record; upload `uploadCurriculum` 35083 writes `curriculum/subjects` | `ceAddSave` 34931; `famWhoSave` 38013 |

**Control count: 132 rows** (103 on the edit sheet incl. embedded Builder and gate; 29 on the add sheet). Several rows are "one per item" (#13, #14, #29, #69, #76, #77, #91, #92, #93, #95, #55) — counted once each.

#### B.2 — order of sections in the card today (29) and in the Add sheet (17)

1. **Title "<device emoji> Edit Subject"** — always.
2. **Display Name** — always.
3. *(grey note)* "Device, mom, minutes, days, ×/wk, cap, priority, first/last, sticky, carry, rules and max/day live in ⚙ Rules above the Grid" — always; text only.
4. **🧱 Pacing & build** — only `tracking !== "daily"`. Collapsed by default (button); expands to the embedded Builder form (`cbRenderForm(col,true)`), with the ↩ Undo banner when the last build was this subject. The Builder's own leftover gate (`cbRenderGate`) opens as a dialog over the sheet when a legacy subject has stale/duplicate future cells.
5. **Lesson Tracking** — always (Sequenced / Daily).
6. **📝 Practice for** — only `tracking === "daily"` AND (another unpaused sequenced subject exists OR `practiceFor` already set). Day stepper only when a practice target is set.
7. **👩 Mom's part** — only when `mom === "required"` and `minutes ≥ 10`, OR `momPartMins` already set. Stepper + "Mom at the beginning" only when "Part of it".
8. **⏱ Timed card** — always.
9. **📚 Study session** — only when the kid has memory-study sessions (`mstSessions`) or `study` is set.
10. **Allow out-of-order check-offs / Cap / ↻ Re-lay remaining** (unlabelled block) — only sequenced AND lesson-id-stamped; Cap and Re-lay only when plan-backed with pacing mode timesPerWeek or targetDate.
11. **⏰ Set time** — always; Starts at / Runs for / Meeting dates / Join link only when on.
12. **🔗 Lesson link** — only `momHere()` (always true here since the view is PIN-gated); per-lesson override block only when the subject has a lesson list.
13. **When behind** — always.
14. **Mom Check** — always; warning line when the kid's master switch is off.
15. **📚 Reading Log** — always; Kid/Mom chips only when on.
16. **📕 Workbook** — when `wbList` exists (always in this build); chips only when workbooks are uploaded, else a hint.
17. **Record Score** — always; format chips only when on.
18. **Carryover Cap** — sequenced only (start of the sequenced-only block).
19. **📊 Not in the Grid/Map yet** (blue box) — only a sequenced subject with a `lessonSeq`, no Excel/grid lessons, and no first/last rule.
20. **Progress** (plan-backed: read-only count, 🛤 Lane standing line, "Clear them" if legacy hand-counts) **or Completed (progress) + Schedule next-lesson** (legacy inputs) — sequenced only.
21. **Fix false check-offs** — sequenced only; collapsed (one button) by default; opens the walk-back panel with the "Previous walk-backs" list.
22. **Pace keyword / Starts week** — sequenced only, and only when a `pace/subjects/<kid>/<sk>` record exists.
23. **Lesson list (N lessons · M done)** / **(N entries · cursor at K)** — sequenced only. Per-line inputs; then the ↩ restore banner (only when a ≤72 h `ha_convUndo` restore point for this subject exists); then "✎ Edit as a list…" (collapsed) or the open list editor; or a plain textarea when there are no grid cells; or "No lessons defined…" + textarea.
24. **✓ Mark a lesson done** panel — sequenced only, shown whenever the list editor is closed (inside #23's branches); includes "finished out of order" repair chips and "Hand-marked done" chips when present.
25. **🏆 Completion reward** — sequenced only; always within the block.
26. **📖 Book milestones** — sequenced only, and only when the detector finds books in the list or the flag is explicitly false.
27. **Status** (Active/Paused toggle) — always (end of sequenced-only block precedes it).
28. **Actions: Done** — always.
29. **Delete Subject** — always.

### Order of sections in the ADD sheet
1. Title "Add Subject for <Kid>" · 2. Who does this? (Starts chips/time only with 2+ kids and no existing block) · 3. Subject Name · 4. Device · 5. Mom Requirement · 6. Duration (minutes) · 7. Times Per Week (+ "N lessons ÷ T×/week = W weeks" line when sequenced) · 8. Days · 9. Scheduling Rules (sticky box only when sticky) · 10. ⏰ Set time (fields only when on) · 11. Lesson Tracking · 12. 📚 Study session (only when sessions exist) · 13. Lessons (sequenced only: Auto-number → Prefix, Total, start at; Type lesson list → textarea) · 14. Days per lesson (sequenced only) · 15. Priority (sequenced only) · 16. Carryover Cap (sequenced only) · 17. Actions: Cancel / Add Subject.

### Appendix C — the Lesson Map code (8 reachable through the grid, 41 unreachable) and the School Sessions editor

**How it is reached today.** The Lesson Map UI is drawn only inside the retired **Subjects** branch of `renderCurriculumView` (29300–29590: "Lesson Map (N weeks)" header at 29407, `lmRenderSubjectGrid` at 29420, the By-Week branch at 29422–29589). Because line 29260 rewrites `currInnerTab==="subjects"` to `"grid"` on every render, that branch cannot be reached — not by tapping and not even programmatically (the router case `"curriculum"` at 6942 sets `"subjects"` and lands on the Grid). Confirmed by reference counts: `lmSetView` (58994) has no caller (1 reference = its definition); `lmRenderSubjectView` (59131) has no caller (1 reference); `lmRenderSubjectGrid` has exactly one caller, 29420, inside the unreachable branch; `lmViewMode` is `"subject"` by default with no setter reachable, so the By-Week branch is unreachable twice over. **The Lesson Map UI is not reachable by tap.** What IS reachable is a handful of its write functions, reused by the live Grid's cell menu (`renderCurrGrid` 57382) and the Grid's calendar-drift banner — table A1. The Lesson Map's own controls are table A2 (all "unreachable by tap"). The never-called `lmRenderSubjectView` is table A3.

Write helper behind most rows: `setSchedOverride(dateStr,kid,mut)` 58515 → `saveScheduleOverrides()` 58506 → `HA_LS ha_sched_overrides` + `db.ref("scheduleOverrides").update(<diffed paths>)` — i.e. `scheduleOverrides/<date>/<kid>/{added|removed|order|dayOff}`. "re-lays week" below = `_rlwCurrDoor` (43951).

### A1 — Grid taps that run Lesson Map code (reachable, Mom; the page is PIN-locked)

| # | Label as shown on screen | Where it sits | What it does | Writes | Who | Also reachable from | Code |
|---|---|---|---|---|---|---|---|
| 1 | `↩ put back` (title "Un-move: it runs on this day again") | Grid ▸ a cell's tap menu, on a cell marked moved/off | Un-removes the subject on that date | `scheduleOverrides/<date>/<kid>/removed/<sk>` (delete) | Mom (`momModeActive||adminPinUnlocked`) | — | `gvMenuRestore` 56778 → `lmRestoreSubj` 58697 |
| 2 | `➡ move` (title "Move it — then tap the day in the grid it should land on") | Grid ▸ cell menu | Arms a move: sets `lmMovePick={date,sk,added:false,kid}`; the next grid tap picks the day via `gvPickMoveTarget` 56804 (not an lm function) | none (UI state); the completing tap writes via the Grid's own code | Mom | — | `gvMenuStartMove` 56788 |
| 3 | `✕ off day` (title "Take it off this day — the column re-lays around it (reversible)") | Grid ▸ cell menu | Marks the subject removed on that date, then re-lays the subject's column | `scheduleOverrides/<date>/<kid>/removed/<sk>=true`; then `_gvRelaySubject` → re-lays week | Mom | — | `gvMenuOff` 56141 → `lmDropSlot` 58686 → `lmRemoveSubj` 58679 |
| 4 | `✕ make-up` (title "Remove this make-up sitting") | Grid ▸ cell menu on a make-up cell | Deletes the added (make-up) slot outright | `scheduleOverrides/<date>/<kid>/added/<sk>` (delete) | Mom (gate inside `lmDropSlot`) | — | `gvMenuOffAdded` 57002 → `lmDropSlot` 58686 |
| 5 | `➕` (title "Add a make-up sitting of this subject on this day (or type content instead)") | Grid ▸ empty cell | Toggles an added slot for the subject on that date | `scheduleOverrides/<date>/<kid>/added/<sk>=true` | Mom | — | `gvMenuAddMakeup` 57008 → `lmAddSubj` 58701 |
| 6 | `Cancel`-style button in the "➡ Parking <Subject> from <day> — tap the day it should resume" banner (57730) | Grid, above the table while a move is armed | Clears the armed move | none (UI state) | Mom | — | `gvCancelMove` 56795 |
| 7 | `Align weeks with calendar…` | Grid, purple banner "N lesson(s) sit on holiday/vacation days (all kids)…" (57700–57709), shown when `alignPlanPreview()` finds lessons on break days | `confirm()` listing every kid's shift, then slides lessons off break days and renumbers weeks for ALL kids | `db.ref("curriculum").update({lessons/<kid>/<dn>/date, lessons/<kid>/<dn>/week, weekDays/<kid>, lastEdit})`; then `buildCurrPaceCum()` | Mom | Subjects-tab banner 29416 (unreachable) | `alignPlanApply` 58847 |
| 8 | `↩ Undo` in "Moved <Subject> to <day> (make-up)" banner (57737) | Grid, above the table when `lmLastMove` is set | Restores the two override entries snapshotted before the last move | `scheduleOverrides` (via `saveScheduleOverrides`) | Mom | Subject-grid banner 59277 (unreachable) | `lmUndoMove` 59229 |

Note on #8: `lmLastMove` is set only by `_lmSnapMove`, called from `lmMoveSlot` 59113 and `lmMoveDay` 59245. `lmMoveDay`'s one caller `gvMenuMove` 56133 is itself not drawn anywhere (grep: definition only), and `lmMoveSlot`'s callers are the unreachable move picker. So the Grid's Undo banner has no live path that sets it today.

### A2 — Lesson Map UI controls (all **unreachable by tap**; drawn only in the redirected Subjects branch)

Subject-grid view (`lmRenderSubjectGrid` 59258; the default `lmViewMode==="subject"`):

| # | Label as shown on screen | Where it sits | What it does | Writes | Who | Also reachable from | Code |
|---|---|---|---|---|---|---|---|
| 9 | `‹` (aria-label "Scroll subjects left") | Subject scrubber, top row | Scrolls the subject chip strip | none (UI state) | Mom | — | inline `scrollBy` 59266 |
| 10 | `All` | Subject scrubber | Shows the whole week for the kid, every subject | none (UI state: `lmSubjKey="__all__"`) | Mom | — | `lmSelSubj` 59067 |
| 11 | `<Subject display name>` chips | Subject scrubber | Selects one subject for the Mon–Fri row | none (UI state) | Mom | A3 #43 | `lmSelSubj` 59067 |
| 12 | `›` (aria-label "Scroll subjects right") | Subject scrubber | Scrolls the strip | none | Mom | — | inline 59270 |
| 13 | `↩ Undo` in "Moved <Subject> to <day> (make-up)" | Under the scrubber when `lmLastMove` set | Reverts the last move | `scheduleOverrides` | Mom | A1 #8 | `lmUndoMove` 59229 |
| 14 | Lesson text in a day cell (title "Tap to edit") | Week row, Mon–Fri cells | Opens the inline editor for that slot | none (UI state `lmEditSlot`) | Mom | A3 #44 | `lmEditSlotOpen` 59068 |
| 15 | `<input id="lm-edit-inp">` (Enter saves, Escape cancels) + `Save` | Open cell editor | Saves new lesson text for the slot; the subject re-lays this week | `curriculum/lessons/<kid>/<dn>/<sk>` set, `curriculum/lastEdit` set; re-lays week (`_rlwCurrDoor`) | Mom | A3 #45 | `lmSaveSlotText` 59089 |
| 16 | `cancel` | Open cell editor | Closes the editor | none | Mom | A3 #46 | `lmEditSlotCancel` 59074 |
| 17 | `◀` (title "Move to <Mon…Fri>") | Under a lesson cell | Moves the slot one school day earlier | `scheduleOverrides/<toDate>/<kid>/added/<sk>=<lesson text or true>` (or deletes `removed`), `scheduleOverrides/<fromDate>/<kid>/removed/<sk>=true` (or deletes `added`) | Mom | `gvMenuMove` 56133 (not drawn) | `lmMoveDay` 59245 |
| 18 | `▶` (title "Move to <Tue…Fri>") | Under a lesson cell | Moves the slot one school day later | same as #17 | Mom | — | `lmMoveDay` 59245 |
| 19 | `Move…` / `close` | Under a lesson cell | Opens/closes the week→day Move picker | none (UI state `lmMovePick`) | Mom | By-Week #33, A3 #47 | `lmOpenMove` 59104 |
| 20 | `×` (title "Delete this lesson from the map") | Under a lesson cell | Grid slot → marked removed (cell shows ↩ Undo); make-up → deleted | `scheduleOverrides/<date>/<kid>/removed/<sk>` or `added/<sk>` | Mom (`momModeActive||adminPinUnlocked`) | A1 #3, #4 | `lmDropSlot` 58686 |
| 21 | Make-up text + `make-up` chip (title "Tap to edit (moved-in lesson)") | A cell holding an added slot | Opens the editor for the added slot's text | none (UI state) | Mom | — | `lmEditAddedOpen` 59080 |
| 22 | `<input id="lm-edit-inp" placeholder="lesson">` + `Save` | Open make-up editor | Saves the added slot's text | `scheduleOverrides/<date>/<kid>/added/<sk>=<text or true>` | Mom | — | `lmSaveAddedText` 59084 |
| 23 | `↩ Undo` (dropped cell, struck text) | A cell whose grid slot is removed | Un-removes it | `scheduleOverrides/<date>/<kid>/removed/<sk>` (delete) | Mom | A1 #1, By-Week #37, A3 #49 | `lmRestoreSubj` 58697 |
| 24 | `<Short subject> <lesson>` line (title "Edit") | Cells in `All` mode | Switches to that subject's row | none | Mom | — | `lmSelSubj` 59067 |
| 25 | Move picker week chips `Wk N` | `Move to…` panel under the grid | Picks the target week | none (UI `lmMoveWeek`) | Mom | By-Week picker | `lmPickMoveWeek` 59109 |
| 26 | Move picker day buttons `<Wd Mon d>` (`⚠` = "already has this subject that day") | `Move to…` panel | Moves the slot to that date | same two-path override write as #17 | Mom | By-Week picker | `lmMoveSlot` 59113 (`lmRenderMovePicker` 58954) |
| 27 | `‹` (aria-label "Previous week") | Week scrubber, bottom | Steps the focus week −1 | none (UI `lmSubjWk`) | Mom | — | `lmSubjStepWk` 59254 |
| 28 | Week numbers `N` (title "Week N") | Week scrubber | Jumps to that week | none | Mom | — | `lmSubjJumpWk` 59253 |
| 29 | `›` (aria-label "Next week") | Week scrubber | Steps +1 | none | Mom | — | `lmSubjStepWk` 59254 |

By-Week view (29422–29589; needs `lmViewMode!=="subject"`, which nothing sets — unreachable twice):

| # | Label as shown on screen | Where it sits | What it does | Writes | Who | Also reachable from | Code |
|---|---|---|---|---|---|---|---|
| 30 | `Wk N (5d)` / `Wk N (off)` pills | Under "Tap a week to edit days; ▲▼ set a day's run order, Move sends a subject to another day…" | Selects/deselects the week shown | none (UI `currViewWeek`) | Mom | — | `setCurrViewWeek` 27752 |
| 31 | `Add` in "Make-up suggestions" (`+1 <Subject> → <day>`, "(2nd that day)") | Purple box above the day cards | Adds the suggested make-up slot | `scheduleOverrides/<date>/<kid>/added/<sk>=true` | Mom | — | `lmAddSubj` 58701 (`lmComputeSuggestions` 59391) |
| 32 | `reset order` | Day card header when "CUSTOM ORDER" | Drops the saved run order for that day | `scheduleOverrides/<date>/<kid>/order` (delete) | Mom | — | `lmResetOrder` 58767 |
| 33 | `day off` / `restore day` | Day card header | Toggles a manual day off | `scheduleOverrides/<date>/<kid>/dayOff` | Mom | — | `lmToggleDayOff` 58675 |
| 34 | `▲` / `▼` | Each subject row | Moves the subject up/down in the day's run order | `scheduleOverrides/<date>/<kid>/order=[…]` | Mom | — | `lmNudgeSubj` 58759 (`lmDayRunOrder` 58733) |
| 35 | `Move` / `close` | Each subject row | Opens the Move picker (#25–26) | none | Mom | A2 #19 | `lmOpenMove` 59104 |
| 36 | `×` on an `ADDED` row | Subject row | Removes the added slot (toggle) | `scheduleOverrides/<date>/<kid>/added/<sk>` (delete) | Mom | — | `lmAddSubj` 58701 |
| 37 | `×` on a grid row (also on "—"/"nan" rows) | Subject row | Marks the subject removed that day | `scheduleOverrides/<date>/<kid>/removed/<sk>=true` | Mom | A1 #3 | `lmRemoveSubj` 58679 |
| 38 | `undo` (struck removed row) | Subject row | Un-removes | `scheduleOverrides/<date>/<kid>/removed/<sk>` (delete) | Mom | A1 #1 | `lmRestoreSubj` 58697 |
| 39 | `+ <Subject>` (`⚠` when not an allowed day) | Add picker under the day | Adds the subject that day | `scheduleOverrides/<date>/<kid>/added/<sk>=true` | Mom | — | `lmAddSubj` 58701 |
| 40 | `+ add subject` / `close` | Bottom of the day card | Opens/closes the add picker | none (UI `lmAddOpen`) | Mom | — | `lmOpenAdd` 58709 |
| 41 | `Align weeks with calendar…` | Purple banner "N lesson(s) sit on holiday/vacation days…" (29413–29418) | As A1 #7 | as A1 #7 | Mom | A1 #7 | `alignPlanApply` 58847 |
| 42 | (no controls) "Wk N — no school" day cards | `lmRenderOffWeek` 58884, when a selected week label has no slots | Read-only break-week view | none | — | — | `lmRenderOffWeek` 58884 |

### A3 — `lmRenderSubjectView` 59131 (dead code: no caller anywhere)

| # | Label as shown on screen | Where it sits | What it does | Writes | Who | Also reachable from | Code |
|---|---|---|---|---|---|---|---|
| 43 | `<Subject display>` chips | Top of the view | Selects a subject | none | — | A2 #11 | `lmSelSubj` 59067 |
| 44 | `✎` (title "Edit lesson text / page numbers") | Slot row | Opens inline editor | none | — | A2 #14 | `lmEditSlotOpen` 59068 |
| 45 | `<input id="lm-edit-inp">` + `Save` | Slot row | Saves lesson text | `curriculum/lessons/<kid>/<dn>/<sk>`, `curriculum/lastEdit`; re-lays week | — | A2 #15 | `lmSaveSlotText` 59089 |
| 46 | `cancel` | Slot row | Closes editor | none | — | A2 #16 | `lmEditSlotCancel` 59074 |
| 47 | `Move` / `close` | Slot row | Opens Move picker | none | — | A2 #19 | `lmOpenMove` 59104 |
| 48 | `×` on a `MAKE-UP` row and on `EXTENDED` rows ("Extended days" card) | Slot row | Toggles the added slot off | `scheduleOverrides/<date>/<kid>/added/<sk>` | — | — | `lmAddSubj` 58701 |
| 49 | `undo` | Removed slot row | Un-removes | `scheduleOverrides/<date>/<kid>/removed/<sk>` | — | A2 #23 | `lmRestoreSubj` 58697 |

Also in scope A but no on-screen control of their own: `lmSchedCheckState` 58918 (draws the `✓ on schedule` chip), `lmCalData` 59000 / `lmCalDayChips` 59036 (data for the month calendar; its own UI "went with" the retired Breaks page per the comment at 58996–58998), `alignPlanPreview` 58793, `lmWeekAnchor/lmWeekNumOfDate/lmWeekMonday` 58778–58792.

---

#### C.2 — Pace / sessions / 🗓 Put on the schedule

**How it is reached today.** From the Grid, Mom taps `🏁 Target · Mom Check · Sessions ▾` (57417, `gvKidCfgToggle` 54738) to open a panel that holds the Finish Line Target date (`ceSetTargetEnd` 33335), the per-kid Mom Check switch (`ceToggleMomVerifyKid` 32383) and the School Sessions editor (`ceRenderSessions` 29725) — these are the reachable pace controls. "Session goals" are the `Goals this session for <Kid>` selects inside a session's `Edit` panel (`ceSetSessionGoal` 29835; stored on `pace/plans/<key>/goals`). `paceGoal` does not exist as an identifier. **"ps" = Put on the Schedule** (PUTSCHED): `psOpen` 40396 / `psApply` 40424 is the sheet that puts a *unit* onto the schedule as a family-time item or as one kid's subject; it is reached only from the Units page (a unit's `📅 Days` section, `utDaysSectionHTML` 40229 → `psButtonHTML` 40474; and the Family tab's `✚ Put a unit on the schedule` 41262) — not from Curriculum, though its single-kid branch writes `curriculum/subjects/<kid>/<key>` and re-lays the week, and its pointer chip's `Open it` jumps into the Curriculum page (`psOpenPointer` 40463 → `setAdminSub("curriculum")` + `ceOpenEdit`). **Sprints** have no control on the Curriculum page: the only mention inside `renderCurrGrid` is a load-calculation comment (57910, retrieval slots "🎯 Daily Drill / 🏃 Sprint / 🎯 Match"); sprint buttons live on a unit's page (B3 #45 → Mastery tab). The retired Subjects branch also drew the target date and sessions (29330–29343) — unreachable, same functions.

### E1 — On the Grid (reachable, Mom)

| # | Label as shown on screen | Where it sits | What it does | Writes | Who | Also reachable from | Code |
|---|---|---|---|---|---|---|---|
| 1 | `🏁 Target · Mom Check · Sessions ▾` / `▴` | Grid toolbar under the kid chips | Opens/closes the kid-config panel | none (UI `gvKidCfgOpen`) | anyone (panel content Mom-only in effect) | — | `gvKidCfgToggle` 54738 (57417) |
| 2 | `🏁 Finish Line Target` date input | Kid-config panel | Sets the kid's target end date; every subject re-lays this week | `curriculum/targetEnd/<kid>` set; re-lays week (`_rlwCurrDoor`, Undo kept) | Mom | Subjects tab 29334 (unreachable) | `ceSetTargetEnd` 33335 |
| 3 | `clear` (next to the date) | Kid-config panel | Removes the target | `curriculum/targetEnd/<kid>` remove; re-lays week | Mom | 29335 (unreachable) | `ceSetTargetEnd` 33335 |
| 4 | `Mom Check — require my approval for <Kid>'s checked-off work` → `ON` / `OFF` | Kid-config panel | Master switch for per-subject Mom checks | `curriculum/momVerifyKid/<kid>` set | Mom | 29355 (unreachable) | `ceToggleMomVerifyKid` 32383 |
| 5 | `School Sessions` → `Edit` / `Done` per session (`<label>` `<start> – <end> · kids`) | Kid-config panel | Opens/closes a session's editor | none (UI `ceSessEdit`) | Mom | 29343 (unreachable) | `ceSessToggle` 29724 (`ceRenderSessions` 29725) |
| 6 | `Name`, `Start`, `End` inputs | Session editor | Edits the session | `pace/plans/<key>` set (whole plan record) | Mom | — | `updatePlanField` 51918 → `savePacePlan` 51904 |
| 7 | `Kids` chips (kid names) | Session editor | Toggles a kid in the session | `pace/plans/<key>` set | Mom | — | `togglePlanKid` 51923 |
| 8 | `School days` chips `Mon`…`Sat` | Session editor | Toggles a school day | `pace/plans/<key>` set | Mom | — | `togglePlanSchoolDay` 51931 |
| 9 | `Completion reward — points when the session is finished`: `−` · `N ⭐` · `+` · number input | Session editor | Sets session completion points (default 100) | `pace/plans/<key>` set `{points}` | Mom | — | `ceSetSessionPoints` 29894 |
| 10 | `Completion song` select (`🎲 Kid's random session song` / song names) · `▶` | Session editor | Picks the victory track; previews it | `pace/plans/<key>` set `{song}`; preview none | Mom | — | `ceSetSessionSong` 29901, `celebSessionPreview` 29910 |
| 11 | `Goals this session for <Kid> — where each subject should reach`: per-subject select (`No goal this session` / lesson list with ` ◀ now`) | Session editor | Sets the session goal (soft by default) | `pace/plans/<key>` set `{goals[kid][sk]={idx,label,mode}}` | Mom | — | `ceSetSessionGoal` 29835 |
| 12 | `🛑 Cutoff` / `🎯 Soft` (title "Hard cutoff: stops scheduling at the mark" / "Soft goal: measures only, keeps scheduling") | Session editor, per goal | Flips the goal between hard (caps generation, `_sessionHardCap` 29861) and soft | `pace/plans/<key>` set `{goals…mode}` | Mom | — | `ceSetSessionGoalMode` 29849 |
| 13 | `Delete session` (confirm "Delete this session?") | Session editor | Deletes the session | `pace/plans/<key>` remove | Mom | — | `deletePacePlan` 51911 |
| 14 | `New session`: `Name`, start date, end date, `+ Add` | Below the sessions | Creates a session (kids empty, Mon–Fri) | `pace/plans/<key>` set | Mom | — | `addPacePlan` 59450 → `savePacePlan` 51904 |

### E2 — 🗓 Put on the schedule (`psOpen` 40396 / `psApply` 40424) — reached from Units, not Curriculum

| # | Label as shown on screen | Where it sits | What it does | Writes | Who | Also reachable from | Code |
|---|---|---|---|---|---|---|---|
| 15 | `🗓 Put on the schedule` / `🗓 Put on the schedule ×` | Unit page ▸ 📅 Days (`psButtonHTML` 40474) | Opens/closes the sheet | none (UI `psForm`) | Mom (`psMom`) | Units ▸ 🏡 Family `✚ Put a unit on the schedule: <unit>` 41262 | `psOpen` 40396 |
| 16 | `📚 On the schedule: <Kid>'s <subject>` / `🏡 On the schedule: <block> · <item>` chip → `Open it` | Unit page ▸ 📅 Days when already scheduled | Jumps to the subject's Edit sheet on the Curriculum page, or to the family block on the Grid | none (navigation) | Mom | — | `psOpenPointer` 40463 (`psPointerChipHTML` 40468) |
| 17 | `Who does this?` kid chips | Sheet | Toggles kids (all = family time; one = that kid's subject) | none (UI) | Mom | — | `psSet('kid')` 40404 |
| 18 | `How often` chips `Mon`…`Fri` | Sheet | Toggles weekdays | none | Mom | — | `psSet('day')` |
| 19 | `In order or week by week?`: `In order — N days, one per sitting` · `Week by week — by the calendar, each weekday its role` | Sheet | Sets the track mode | none | Mom | — | `psSet('mode')` |
| 20 | `Minutes` · `First day` | Sheet | Sets duration and start | none | Mom | — | `psSet('minutes'/'start')` |
| 21 | `Starts`: (≥2 kids) `Right after lunch` · `At a set time` · `Scheduler picks`; (1 kid) `Its own slot in the day` · `At a set time`; `Starts at` time input | Sheet | Sets the placement rule | none | Mom | — | `psSet('at'/'time')` |
| 22 | `🗓 Put it on` | Sheet footer | Writes the unit onto the schedule, gates and enrolls each kid | ≥2 kids: `config/rules/familyBlocks/<id>` set or `…/<id>/items` set (`famWrite` 36755), `mastery/<kid>_settings/cat_gate/<deck>` set per kid, plus `unitEnroll` writes (B3 #36). 1 kid: `curriculum/subjects/<kid>/<key>` set, `curriculum/lastEdit` set, re-lays week (`_rlwCurrDoor`, Undo = the subject gone), `mastery/<kid>_settings/cat_gate/<deck>` set, plus `unitEnroll` writes. Refuses while Builder cards are unchecked. | Mom | — | `psApply` 40424, `psGateAndEnroll` 40417 |
| 23 | `Cancel` | Sheet footer | Closes the sheet | none | Mom | — | `psClose` 40402 |


Units (56 controls), the library (54) and 🗓 Put on the schedule are their own pages, reached from the School row or the Units tab, not from inside the Curriculum page; their tables were produced but are left out of this file. There is no shared-curriculum code in this checkout.

### Appendix D — outside the page: every other editor of the same data (51 rows), the per-field writer map, and the 29 setting groups that live only outside

Source: `index.html` (87,147 lines) in the `scores-card-seconds-b9c31d` worktree, read only. Method: every
Firebase write (`db.ref(...).set/update/remove`, multi-path `update` keys) to `curriculum/*`, `pace/*`, `plans/*`,
`scheduleOverrides`, `config/rules/*`, `config/momLoop`, `calendar/coops|coopMomDays|kidOverrides`,
`weekConfig`, `week*/momMoves`, `mastery/<kid>_sessions`, `mastery/<kid>_settings` (where tied to a subject),
`library/scans`, then each writer traced to the render function that draws the control that calls it.

"On the page" = anything drawn by `renderCurriculumView` 29241 (incl. `ceBuildCard` 29626, `ceRenderSessions` 29725,
`_ceMaybeBuilder` 29610), `renderCurrGrid` 57382–58060 (incl. `gvAuditRender` 55878, `famHomePanelHTML` 37943,
`famGridHTML` 37254, `gvMarkMenuHTML` 56955), `ceRenderEditSheet` 32626–34653 (incl. `cePracticeSectionHTML` 3107,
`ceMomPartSectionHTML` 3142, `mmEditorSectionHTML` 11589, `_ceMarkDoneUI` 33121), `ceRenderAddSheet` 34662+,
`lnRenderSection` 53316, `renderCurrBuilder` 54440 / `cbRenderForm` 54538 / `cbRenderRules` 53550 / `cbRenderGate` 54255,
`planBarHTML` 28549 (with `rmStripHTML` 27831, `ntStripHTML` 28510, `scStripHTML`), grid cell actions 54736–57381,
lesson map `lm*` 58673–59450. Everything else is "outside".

Nav shorthand (from `_renderAllInner` 5028, `renderSchedule` 9048, `renderMomsPlanView` 12091, `renderMPSchool` 25287,
`mpSubnav` 25210): **Day view** = Schedule tab (also Mom's Day ▸ 🗓 Schedule ▸ Today). **Settings** = Mom's Day ▸ 🎓 School ▸
Settings, or Schedule ▸ Admin ▸ Settings (`renderSettings` 6563). **Mastery HQ** = Mom's Day ▸ 🎓 School ▸ Mastery ▸ Settings,
or Schedule ▸ Admin ▸ 🧠 Mastery (`renderMasteryHQ` 72246). **Units** = Units tab / Mom's Day ▸ 🎓 School ▸ Units
(`renderUnits` 49684). **Scores** = Mom's Day ▸ 🎓 School ▸ 📊 Scores (`renderMPScores` 28771). **Mom's Day home** =
Mom's Day ▸ 🏡 Home Base (`renderMomsDay` 18191). **Calendar month** = Mom's Day ▸ 🗓 Schedule ▸ Month
(`renderMPCalendar` 24868 → `calRenderMonthPreview` 42017 → `calDaySheetHTML` 42249). **Admin Panel** = header ⚙️ button
`#admin-btn` 1579 → `toggleAdmin` 43360 (static `#admin-panel` 1585).

## 1. Outside controls that edit subject / curriculum / pace / plan / schedule-shaping data

| # | Page / sheet (nav path) | Control label as shown | What it edits | Writes (path pattern) | Who | Same data editable on the Curriculum page at | Code (function + line) |
|---|---|---|---|---|---|---|---|
| 1 | Day view ▸ a fixed-time class card ▸ ⏰ clock → "Set a time just for this day" sheet | ⏰ (card badge) · time picker · "Back to normal" | That class's start time for ONE date; any clashing class / Family Time / lunch it bumps | `curriculum/subjects/<kid>/<sk>/fixedTimeByDate/<iso>`; clashes: other subjects' `fixedTimeByDate/<iso>`, `config/rules/familyBlocks/<id>/atByDate/<iso>`, `config/rules/schoolDay/lunchByDate/<iso>/all` (one root multi-path `update`) | Mom (`momHereCards`) | The DEFAULT fixed time only: `ceRenderEditSheet` 32706–32713 (`fxDoorToggle` 32303, `fxDoorSetTime` 32314). Per-date time: **no — only here (and #2/#3 dialogs)** | `stClockHTML` 38125 → `sttOpen` → `sttRender` 38250 → `stMove` 38167 → `stCommit` 38177 (`stMainPath` 38207) → `stWrite` 38217; clear `stClear` |
| 2 | Day view ▸ any subject card ▸ ⏰ "pin a day-time" sheet | ⏰ badge · time/day pick · "Back to normal" | Pins this week's card to a time (and day); bumps clashing fixed classes / Family Time / lunch for that date | `week<n>/tasks/<id>/{fixedAt,time,day}`, `week<n>/momMoves/<id>`; clashes: `curriculum/subjects/<kid>/<sk>/fixedTimeByDate/<iso>`, `config/rules/familyBlocks/<id>/atByDate/<iso>`, `config/rules/schoolDay/lunchByDate/<iso>/all` | Mom | Card pin: no (week data). Clash-moved subject `fixedTimeByDate`: **no — only via these day dialogs** | `fdtClockHTML` 38618 → `fdtOpen` → `fdtRender` 38745 → `fdtMove` 38682 → `fdtCommit` 38703 → `stWrite` 38217; `fdtClear` 38732 |
| 3 | Day view ▸ day banner ▸ "⏰ Day times" / "⏰ hh:mm–hh:mm" | Start · End · Lunch start · Lunch end · "Back to normal" | School-day hours for ONE date (kids' cards re-lay) | `config/rules/schoolDay/byDate/<iso>`, `config/rules/schoolDay/lunchByDate/<iso>/all` | Mom | **no** (default hours are in Settings, #13) | `dtBtnHTML` 38891 → `dtOpenDay` 38837 → `dtRender` 38872 → `dtSave` 38854 / `dtUpd` 38841 / `dtClear` 38864 → `stWrite` 38217 |
| 4 | Calendar month ▸ tap a day ▸ day sheet row | ⏰ (per date) · "Back to normal" | Same per-date school hours as #3 | `config/rules/schoolDay/byDate/<iso>`, `.../lunchByDate/<iso>/all` | Mom (`onecalMom`) | **no** | `dtCalRowHTML` 38899 (in `calDaySheetHTML` 42249) → `dtOpen` / `dtClear` |
| 5 | Day view ▸ 📅 "This week" strip ▸ ⏰ on a day | ⏰ | Same per-date hours as #3 | as #3 | Mom | **no** | `twsHTML` 85566 → `twsTimes` 85556 → `dtOpen` |
| 6 | Day view ▸ Mom card dialog (tap a kid's card) | "➡️ Push to <day>" | Moves this card to the next school day (counts the skipped day as unfinished) | `week<n>/momMoves/<id>` {mode:push} | Mom | no (week data; the lesson order itself is on the page) | `tapTask` 11628 → `pushTaskForward` 58130 → `_saveMomMove` 58124 |
| 7 | Day view ▸ Mom card dialog | "Skip for now" (`momDismiss(id,"now")`) | Ends this subject for the week; later lessons of it also marked skip | `week<n>/momMoves/<id>` {mode:skip} (+ one per later lesson) | Mom | no (week data) | `tapTask` 11715 → `momDismiss` 58164 → `_saveMomMove` |
| 8 | Day view ▸ Mom card dialog | "Skip for good — move past this lesson" (`momDismiss(id,"good")`) | Advances the subject's lesson cursor by one (hand-count) and drops the card | `pace/subjects/<kid>/<sk>` (whole pace record `set`, `adjust`+1) via `savePaceSubject` 51822; `week<n>/momMoves/<id>` {mode:drop, adjusted} | Mom (blocked for plan-backed subjects) | **yes** — cursor "done" count: `ceRenderEditSheet` 32900 `ceSetCount('adjust')`; hand-count clear `cePaceClearHand` 32889 | `tapTask` 11724 → `momDismiss` 58164 |
| 9 | Day view ▸ Mom card dialog | "↩ Undo" (on a pushed/skipped card) | Removes the move; puts the pace cursor back if it was bumped | `week<n>/momMoves/<id>` remove; `pace/subjects/<kid>/<sk>` set (adjust−by) | Mom | **yes** (same cursor as #8) | `tapTask` 11693 → `undoMomMove` 58214 |
| 10 | Day view ▸ Mom card dialog | "📅 Move to today" | Pulls a later-day card onto today, re-lays today | `week<n>/momMoves/<id>` {pulledFrom}, `week<n>/tasks/<id>/{day,time}` + re-lay paths | Mom | no (week data) | `tapTask` 11708 → `momMoveToToday` 58416 |
| 11 | Day view ▸ Mom approval dialog when a check-off is out of lesson order | "✓ Approve all up to …" | Marks the earlier lessons done in the plan (lesson-id done records) | `curriculum/done/<kid>/<sk>/<lid>` (+ `curriculum/lastEdit`) | Mom | **yes** — the page writes the same `done/` node from its mark-done controls: `_ceMarkDoneApply` 33256 (`up["done/…`), `gvMenuDone` 56840, `gvImportDone` 33734; un-mark `ceUnmarkLessonDone` 33301 | `openOrderBlockDialog` 10279 → `orderBlockApproveThrough` 10310 |
| 12 | Day view ▸ card un-check (Mom "↩ Unmark" / kid undo) | "↩ Undo my check" / "↩ Unmark" | Removes that card's lesson-done record from the plan | `curriculum/done/<kid>/<sk>/<lid>` remove | anyone who can un-check (Mom; kid on own device) | **yes** (as #11) | `tapTask` 11805–11810 → `lidDoneRemove` 33635 |
| 13 | Day view ▸ subject card ▸ small ✗ | "✗ Not today" (and "undo") | Pushes a lesson card to the next school day, or waives a daily for today | `week<n>/momMoves/<id>` {push \| waive}; undo removes | Mom | no (week data) | `mntXHTML` 58291 → `momNotToday` 58311 → `_mntSave` 58275; `mntCardHTML` 58296 → `momNotTodayUndo` 58334 |
| 14 | Day view ▸ top buttons (Mom) | "🔄 Regenerate" | Rebuilds the week; re-averages page-book subjects' lesson chunks (rewrites their lesson sequence); syncs day overrides | `curriculum/subjects/<kid>/<sk>/{lessonSeq,lessonIds,total…}` via `setLessonSeq` + `curriculum/lastEdit`; `scheduleOverrides/*` via `gwSyncConfigOverrides`; week nodes | Mom | **yes** — lesson sequence: `ceSaveLessonSeq` 34310 (edit sheet), grid cells `gvCommitCell` 57033, `gvCaptureSeqs` 55038, Builder `cbApply` 53930 | `renderSchedule` 9148 → `schedRegenerateNow` 8551 → `pgAutoApplyAll` 52585 → `pgAutoApply` 52573; `gwCommit` 86781 → `gwSyncConfigOverrides` 58538 → `saveScheduleOverrides` 58506 |
| 15 | Day view ▸ top buttons (co-op day, Mom) | "👩 Mom is available today …" / co-op Mom-day toggle | Marks a co-op date as a day Mom is here (Mom-required work allowed) | `calendar/coopMomDays/<date>` | Mom | **no** | `renderSchedule` 9150 → `coopToggleMomDay` 41728 |
| 16 | Day view ▸ top buttons (Mom) | "🙈 Hide Carryover" / "👁 Show Carryover" | Hides carried-over cards for this kid | `config/rules` **whole node set** (`hideCarryoverKids.<kid>`) via `saveRules` | Mom | **no** | `renderSchedule` 9152 → `toggleHideCarryover` 9556 → `saveRules` 78983 |
| 17 | Day view ▸ day-off picker | kid chips (😷 off / on) | Marks a kid off (sick/away) for a date | `calendar/kidOverrides/<kid>/<date>` set/remove | Mom | **no** | `schedRenderDayOffPicker` 8609 → `schedToggleKidOff` 8627 |
| 18 | Day view ▸ 📅 "This week" strip (Mom, today only) | kid off/on chips · 🌸 sitter day/time · "With the sitter" kids · 🚗 Car school · Saturday · "🔁 catch-up" per kid on Sunday | This week's day shape: kid off, sitter days, who is with the sitter, car-school days, Saturday on/off, Sunday catch-up per kid | `calendar/kidOverrides/<kid>/<date>`; `weekConfig/<wn>/babysitter`, `weekConfig/<wn>/withSitter`, `week<n>/babysitter`; `weekConfig/<wn>/carSchool/<dn>`; `weekConfig/<wn>/saturday`; `config/rules/sundayCatchup/<kid>` (one root multi-path `update`) | Mom | **no** on the page. Duplicates Settings: Sunday catch-up (#23) and With-sitter (#21) | `twsHTML` 85566 → `twsToggleKid` 85444, `twsToggleSitter` 85462, `twsSitterTime` 85468, `twsToggleWithSitter` 85490, `twsToggleCar` 85476, `twsCarSet` 85482, `twsToggleSaturday` 85495, `twsToggleSunday` 85551 → `_twsDoor` 85429 → `_twsWrite` 85422 |
| 19 | Day view ▸ 👩 Mom-loop strip (today, Mom) | "👩 Mom ✓ available / ✕ not available" · kid "✓ on / ✕ off" · kid name (set next) · behind-scope chips | Which kid Mom goes to next, who is skipped, how far behind counts | `config/momLoop/momOff`, `config/momLoop/off/<kid>`, `config/momLoop/offFor/<kid>`, `config/momLoop/cursor`, `config/momLoop/cursorSetOn`, `config/momLoop/behindScope` | Mom | **no** | `mlStripHTML` 77023 → `mlSetMomOff` 76821, `mlSetOff` 76805 → `_mlWriteOff` 76793, `mlSetCursor` 77011, `mlSetBehindScope` 76953; also `mnChoiceHTML` 77780 → `mnNextInRotation` 77806 / `mnNextWithWork` 77798 |
| 20 | Settings ▸ "School Day Times" card | School starts · School ends · Lunch starts · Lunch ends · per-weekday override Start/End/Lunch · "Remove" · stack-gap chips · "Use Saturday for overflow" On/Off · Catch-up "is offered first / comes back on its own" · Saturday cutoff · Devices counts | Default school-day hours, weekday overrides, stack gap, Saturday overflow, catch-up mode, Saturday cutoff, device counts | `config/rules` **whole node set** via `saveRules` (`schoolDay.defaultStart/defaultEnd/lunchStart/lunchEnd`, `schoolDay.overrides.<day>`, `stackGap`, `saturdayOverflow`, `catchupMode`, `saturday.cutoff`, `devices.<field>`) | Mom | **no** | `rulesSchoolDayCardHTML` 79327 → `rulesUpdateTime` 79015, `rulesUpdateDayOverride` 79046, `rulesRemoveDayOverride` 79057, `rulesUpdateStackGap` 79021, `rulesUpdateSaturdayOverflow` 79034, `rulesUpdateCatchupMode` 79040, `rulesUpdateSatCutoff` 79214, `rulesUpdateDevice` 79027 → `saveRules` 78983 |
| 21 | Settings ▸ "Babysitter" card | kid chips (with the sitter) · sitter name | Which kids are with the sitter on sitter days | `config/rules` whole set (`withSitter[]`, sitter name) | Mom | **no** (per-week copy in #18) | `rulesFamilyCardsHTML` 79445 → `rulesToggleWithSitter` 79006, `rulesUpdateSitterName` 79000 |
| 22 | Settings ▸ "Workflow Orders" card | step ▲ ▼ · subject ◀ ▶ · ✕ · add-subject select · "🧹 Sweep N dead names" | Per-kid order tiers (normal + babysitter day) that decide which subject comes first | `config/rules` whole set (`workflow.<kid>.normal|babysitter[step].subjects`) | Mom | **partly** — the page rewrites these entries on rename (`ceRenameSubject` 32355) and delete (`ceDeleteSubject` 34579 → `saveRules`); ordering by `first/last` tokens is a different field: `rlSet('rulesTok')` 53418 / `ceAddToggleRule` 34900 | `rulesFamilyCardsHTML` 79445 (o@79453) → `rulesSwapWf` 79066, `wfSubjMove` 79133, `wfSubjRemove` 79140, `wfSubjAdd` 79146, `wfSweepDead` 79178 |
| 23 | Settings ▸ "School Day Times" card ▸ Sunday catch-up chips | "✓ <Kid>" chips | Sunday catch-up on/off per kid | `config/rules/sundayCatchup/<kid>` | Mom | **no** (duplicate of #18 Sunday chips) | `sucSettingsHTML` 39015 (at 79383) → `sucToggle` 39010 → `stWrite` |
| 24 | Settings ▸ "Devices" card | Computer — always first · iPad — priority when shared (numbers) | Device queue priorities | `config/rules` whole set (`devices.queue.<device>`) | Mom | **no** (subject `device` field is on the page: `ceRenderEditSheet`) | `rulesUpdateDeviceQueue` 79199 |
| 25 | Settings ▸ "Saturday Rules" card | Reflex max etc. (numbers) | Saturday limits | `config/rules` whole set (`saturday.<field>`) | Mom | **no** | `rulesUpdateSaturday` 79207 |
| 26 | Settings ▸ "Cleaning Day" card | Cleaning starts/ends · Lunch starts/ends · minutes per person | Cleaning-day shape (takes school time) | `config/rules/cleaningDay/<field>`, `config/rules/cleaningDay/minutes/<who>` | Mom | **no** | `hhCleanSettingsHTML` 13711 (at 79482) → `hhCleanRuleSet` 13698, `hhCleanMinSet` 13705 |
| 27 | Settings ▸ "Minimum minutes" card | Grace (number) · early radio (tell/wait) · "over" checkbox | Family-wide minimum-minutes rule | `config/rules/minMinutes/<grace|early|over>` | Mom | **no** for the family rule; the per-subject minimum lives on the page: `mmEditorSectionHTML` 11589 in `ceRenderEditSheet` → `ceSaveField('minMin'|'minShow')` | `mmRulesCardHTML` 11615 → `mmRuleSet` 11603 |
| 28 | Settings ▸ "Mom's loop" card | "🔁 Whoever the loop stopped on yesterday" / "1️⃣ <kid> first, every day" · kid order ▲▼ | Mom-loop start mode and kid order | `config/momLoop/startMode`, `config/momLoop/order` | Mom | **no** | `renderMomLoopCard` 76925 → `mlSetStartMode` 76918; `mlMove` 77003 → `mlSetOrder` 76997 |
| 29 | Settings ▸ "Family rules" ▸ Family time | door button only (opens the Grid's 🏡 Family chip) | — (no write) | — | Mom | points at the page: `famHomePanelHTML` 37943 | `famHomeDoorHTML` 37949 → `famHomeGo` |
| 30 | Mom's Day home ▸ week roadmap strip ▸ ⚙ heads-up panel | "Heads-up for <kid>" toggle · "Linked rows tick themselves" · numbers · ↺ · "↺ Same as family for everything" · "↺ all" | Heads-up rules per family / per kid / per subject (on, autoDone, warnWeeks, noteDays, off) | `config/rules/headsUp/<scope…>/<field>` set / remove | Mom | **no** | `rmWeekHTML` 27854 → `rmxPanelHTML` 28420 → `_rmxCtl` 28400 → `rmxRuleSet` 28346 / `rmxRuleClear` 28355 |
| 31 | Mom's Day home ▸ roadmap row ▸ ⋯ | "🔕 Mute this subject / 🔔 Unmute" · "Warn earlier (+1 wk)" · "Warn later (−1 wk)" | Per-subject heads-up mute / warn weeks | `config/rules/headsUp/<kid>/<sk>/off|warnWeeks` | Mom | **no** | b@28381 → `rmxMute` 28367, `rmxWarnShift` 28368 |
| 32 | Mom's Day home ▸ roadmap row | ✓ (done / reopen) | Marks a roadmap item done | `plans/<kid>/roadmap/<id>` update | Mom (`rmCanWrite`) | **yes** — same rows in the plan bar: `rmStripHTML` 27831 → `rmRowHTML` 27789 (in `planBarHTML` 28549), form `rmSave`/`rmDelete` 27884/27919 | `rmWeekHTML` 27854 (auto@27856) → `rmRowHTML` 27789 → `rmDone` 27900 → `rmWrite` 27786 |
| 33 | Mom's Day home ▸ roadmap row tap | row (opens the subject) | — opens the Curriculum edit sheet or Family sheet from outside | — | Mom | entry into `ceRenderEditSheet` / `famSheetRender` | `rmxRowHTML` 28284 → `rmxOpen` 28283 → `ceOpenEdit` / `famSheetOpen` |
| 34 | Mom's Day home ▸ Mastery load suggestion card | "Not now" | Snoozes the load suggestion | `mastery/<kid>_settings/load/snooze` | Mom | **no** | `mlsNowHTML` 29213 (at 18296) → `mlsSnooze` 29200 → `_mldSave` 29035 |
| 35 | Scores page ▸ per-kid card ▸ 🎚 Load dial | − / + minutes · − / + sittings · "↩ Undo" · "Suggest / Off" | Mastery load knobs (mastery decks, not subjects) | `mastery/<kid>_settings/load/last`, `load/mode`, plus the knob paths `mldBatch` computes (root multi-path) | Mom | **no** | `scpCardHtml` 28735 → `mldDialHtml` 29079 → `mldStep` 29066 → `mldSet` 29057 → `_mldSave` 29035; `mldUndo` 29067; `mlsModeHtml` 29233 → `mlsSetMode` 29206 |
| 36 | Mastery HQ ▸ "Sessions" pill ▸ session form | "Save" · delete | A mastery session record (name, kind, decks, passes, who, audio…) | `mastery/<kid>_sessions/<sid>` set / remove | Mom | **no** — the page only PICKS a session for a subject: `ceRenderEditSheet` 32675–32676 `ceSaveField('study', sid)` | `_mhqRenderSessions` 72942 → `_mhqRenderSessForm` 72827 → `mhqSessSave` 72648; `mhqSessDelete` 72786 |
| 37 | Mastery HQ ▸ Sessions ▸ a session row ▸ "🗓 Put it on" sheet | name · minutes · day chips · Mom · device · "🗓 Put it on" | Creates a NEW daily subject on the kid's curriculum tied to that session | `curriculum/subjects/<kid>/<key>` **whole record set** (display, device, mom, minutes, days, allowedDays, rules "sequential", tracking "daily", priority, timesPerWeek, study, noCarry) + `curriculum/lastEdit` | Mom | **yes** — `ceRenderAddSheet` 34662 → `ceAddSave` 34931 (whole-record set at 34979) then Study chip on the edit sheet 32676 | `spRowHTML` 72758 → `spSheetHTML` 72765 → `spApply` 72739 (`spRecord` 72718) |
| 38 | Units ▸ a unit ▸ Days section ▸ "🗓 Put on the schedule" sheet | kid chips · day chips · minutes · start · at (lunch/auto/time) · "🗓 Put it on" | 1 kid: creates a NEW sequenced subject from the unit's days; 2+ kids: creates/extends a Family Time block; gates the unit's decks by that subject | `curriculum/subjects/<kid>/<key>` **whole record set** (`psSubjectRec` 40388: display, device paper, mom none, minutes, days, allowedDays, rules sequential, total, priority, carryoverCap 2, lessonSeq, lessonIds, nextLid, timesPerWeek, unit, fixedTime) + `lastEdit`; or `config/rules/familyBlocks/<id>` / `…/items` via `famWrite` 36755; then `mastery/<kid>_settings/cat_gate/<deck>` {subject} (`psGateAndEnroll` 40416) and `unitEnroll` | Mom | **yes** — `ceAddSave` 34931 (incl. its "Who does this?" family row → `famWhoSave` 38013); fixed time: edit sheet 32706 | `utDaysSectionHTML` 40229 → `psButtonHTML` 40474 → `psSheetHTML` 40484 → `psApply` 40424 |
| 39 | Units ▸ unit card ▸ pointer chip "<kid>'s subject" | chip | — opens the Curriculum edit sheet / Family sheet from outside | — | Mom | entry into `ceRenderEditSheet` | `psPointerChipHTML` 40468 → `psOpenPointer` 40463 → `ceOpenEdit` |
| 40 | Units ▸ kid tab / unit detail | "+ <Kid>" (enroll) | Enrolls a kid: seeds decks; gates decks by a subject; modes, intro max, definitions | `mastery/<kid>_settings/cat_gate/<deck>` {subject}, `_settings/cat_modes`, `_settings/cat_intro_max`, `_settings/definitions`, `mastery/<kid>` items, `mastery/<kid>_custom_items`, `unitStudies/<id>/enrolled/<kid>` | Mom | **no** | `utsKidHTML` 41200 (41238) / `renderUnitDetail` 49756 (49772) → `unitEnroll` 49937 |
| 41 | Units ▸ staged unit rows | "Start <Kid>" · "➡ Start Stage n: …" | Stage enroll / move up: deck gates by subject, modes, hold, instructions; Envirothon session | `mastery/<kid>_settings/cat_gate/<deck>`, `cat_modes`, `cat_intro_max`, `definitions`, `cat_hold`, `cat_instructions`; `mastery/<kid>_sessions/<ENV_SESSION_SID>` | Mom | **no** | `_unitStageRowsHtml` 49617 → `unitStageEnroll` 49586 / `unitStageMoveUp` 49607 → `_ustWrite` 49556; `envEnrollSession` 49105 |
| 42 | Units ▸ staged unit rows / check-up box | "🩺 Start check-up for <Kid>" · "Start check-up" | Creates a check-up session; sets deck modes | `mastery/<kid>_sessions/<sid>`, `_settings/cat_modes`, `_settings/cat_intro_max`, `unitStudies/<id>/kidStage/<kid>[/checkup]` | Mom | **no** | `_unitStageRowsHtml` 49657 → `unitStageCheckup` 67776; `ckStartHtml` 70550 → `ckStartCreate` 70523 |
| 43 | Calendar month ▸ Co-ops section ▸ "+ Add Co-op / Custom Day" / ✎ | co-op form "Save" · delete · "no Mom" base | Co-op days (kids, dates, times, whether Mom is away) — the days subjects' `coopDay` / `noCoopDays` rules react to; saving re-lays affected subjects | `calendar/coops/<id>` set / `noMomBase` set / remove | Mom | **no** (the per-subject co-op REACTION — keep/shorten/skip, Mon–Thu pins — is on the page: `cbRenderRules` 53550 `rlSet('coopDay')`, `cwdPinDay` 41812, `cwdUseMonThu` 41821) | `calCoopsSectionHTML` 43251 → `renderCoopForm` 41958 → `coopSave` 41918 / `coopDelete` 41948 → `cwdRelayKids` 41845 |
| 44 | Calendar month ▸ Overrides section | "+ Add Override for <Kid>" | Kid off / override per date | `calendar/kidOverrides/<kid>/<date>` | Mom | **no** | `calOverridesSectionHTML` 43271 |
| 45 | Family Time sheet (overlay) — opened from the Grid's 🏡 chip (on page) AND from Mom's Day roadmap row (#33) | name · kid chips · day chips · start (lunch/auto/time) · items (+ / ✕ / ▲▼ / day / kid / minutes) · "🧩 Do together (pick each kid's subject)" → "🧩 Make it one" · "↩ Move back to their own" · lessons track · per-day start · min minutes | The Family Time block; "Do together" PAUSES each picked per-kid subject and folds it in; "Move back" un-pauses them | `config/rules/familyBlocks/<id>/…` (`famWrite` 36755, one leaf or `items` array); `curriculum/subjects/<kid>/<sk>/{paused,pausedSince,pausedFor}` and on move-back `{paused:false,pausedSince:null,pausedFor:null,planAnchor}` (`_famSubjWrite` 37130) | Mom | **yes** — identical editor is drawn on the page by `famHomePanelHTML` 37943 → `famSettingsCardHTML` 36900 → `famBlockEditorHTML` 36830; pause/resume also at `ceTogglePause` 33357 (edit sheet 33085) and `ceQuickPause` 33379 (card ⏸/▶ 29634) | `famSheetRender` 37311 → `famBlockEditorHTML` 36830 → `famBlkSet` 36773, `famToggle` 36774, `famSetStart` 36780, `famItem*` 36782–36807, `famTogetherOpen` 37163 → `famTogetherRender` 37171 → `famTgSave` 37170 → `famDoTogether` 37136; `famMoveBack` 37150; `famTrack*` 37634–37668; `famDsSet` 37828; `frSetMin` 38445 |
| 46 | Admin Panel (header ⚙️) | "Upload Curriculum" (xlsx) | Replaces the ENTIRE curriculum node for every kid (subjects, lessons, weekDays) | `curriculum` **whole node set** | Mom (PIN) | **yes** — everything the page edits (subjects, lessons grid, weekDays via `gvAddMissingDays` 57347) | `#admin-panel` 1597 → `uploadCurriculum` 35083 (`_norm` 35118, set at 35247) |
| 47 | Admin Panel | "Download Template" | read-only export | — | Mom | also on the page: `renderCurriculumView` 29315 | `downloadCurrTemplate` 35262 |
| 48 | Mastery tab ▸ sprint ▸ book list editor | "Save list" | A scanned book's lesson list (library scan used by page-book subjects) | `library/scans/<bookId>` update {lessons, editedAt, source} | Mom | **no** | `buildSprintBookHtml` 81574 → `msBookSaveFromForm` 81571 → `msBookSave` 81555 |
| 49 | Pace / 🌟 Wins page (Schedule ▸ Pace, or Mom's Day ▸ 🎓 School ▸ Wins) — AUTOMATIC on render, no control | — | Re-syncs pace records to the curriculum (adds/removes/relabels), seeds default plans | `pace/subjects/<kid>/<key>` set/remove, `pace/plans/<key>` set | anyone who opens the page (writes if `db`) | **yes** — pace totals/offset/adjust/keyword/startWeek: `ceRenderEditSheet` 32889–32955 (`ceSetCount`, `ceSetTotal`, `cePaceClearHand`, `updatePaceField`); plans: `ceRenderSessions` 29725 | `renderPace` 60723 → `syncPaceData` 51839 → `savePaceSubject` 51822 / `deletePaceSubject` 51830 / `savePacePlan` 51904 |
| 50 | Sunday auto-build — AUTOMATIC, no control | — | Re-averages page-book subjects' lesson chunks; commits the new week's day overrides | `curriculum/subjects/<kid>/<sk>/{lessonSeq,lessonIds,total}` + `lastEdit`; `scheduleOverrides/*` | system | **yes** (lesson sequence, as #14) | `_abBuild` 85198 → `pgAutoApplyAll("weekly")` 52585; `gwCommit` 86781 |
| 51 | Finish Line "Extend" — UNREACHABLE (`renderFinishLine` 60135 is never called; comment 29339 "standalone list is retired") | "Extend" | would add make-up days for a red/amber subject | `scheduleOverrides/<date>/<kid>/added/<sk>` | Mom | the matching "Clear make-ups" IS on the page: `renderCurriculumView` 29366 → `flUndoExtend` 60181 | `renderFinishLine` 60135 → `flExtendSubject` 60073 |

Not listed (write only week cards, never curriculum/pace/plan/rules): get-ahead "Start ▶ / Pull next ▶" (`gaRender` 9910 → `bwPullTap` 10062 / `mpPullTap` 10130 → `week<n>/tasks`), Mom "✓ Mark done today", review/close-out actions (`coSendBack` 10444 → `pushTaskForward` on "tomorrow"), `relayWeek` 43575 (writes `week<n>/tasks`, `week<n>/relayLog` only). Kids' Corner (`renderKidsCorner` 5057, `kcTodayHTML` 42776) draws no curriculum control (`dtCalRowHTML` returns nothing in kidMode). Scores page itself (`SCORESPAGE` 28565–28784) has no `db.ref` of its own; its only writer is the load dial (#35). HQ (`renderMomHQ` 8411) draws alert/pending strips only. `renderAdminGenerate` 79928 has no curriculum writer (notebook picker, JSON download). Other files: `library.js` writes `library/*` only; `family-config.js`, `esa.js`, `play.js`, `eic.js`, `notebooks.js` write none of the covered paths. Unit attach/grow plans (`wrApplyAttach` 48794, `uaApplyAttach` 48928, `laIrrApply` 81892, `laGrowApply` 82124) carry no `curriculum/` keys.

## 2. Duplicate map — `curriculum/subjects/<kid>/<sk>/<field>` and every writer

(P) = on the Curriculum page · (O) = outside

| Field | Writers |
|---|---|
| whole record (`set`) | (P) `ceAddSave` 34979 (Add sheet); (P) `cbCopyTo` 53481 (Builder "copy to <kid>" 54680); (O) `psApply` 40453 (Units "Put it on"); (O) `spApply` 72752 (Mastery HQ "Put it on"); (O) `uploadCurriculum` 35247 (whole `curriculum`) |
| delete | (P) `ceDeleteSubject` 34585 (edit sheet "Delete Subject" 33094) — also removes `curriculum/lessons` cells, `skiplog`, `rebaseline`, `pace/subjects`, `scheduleOverrides` entries, open week cards, and the subject's `config/rules/workflow` entries |
| any field (generic setter) | (P) `ceSaveField` 32242 (edit sheet) — display, study, noCarry, allowOutOfOrder, minutes, readingLog, readingLogBy, workbook, scoreType, carryoverCap, completionPoints, bookMilestones, bookPoints, paused, pausedSince, planAnchor, tracking, cap, lessonUrl, linkLabel, fixedTime, fixedDates, joinUrl, overflowExtras, momVerify, scored, minMin, minShow |
| `display` | (P) `ceRenameSubject` 32355 → `ceSaveField` (+ rewrites `config/rules/workflow` names) |
| `minutes` | (P) edit sheet 32715 `ceSaveField`; (P) Rules panel `rlSet('minutes')` 53602 |
| `cap` | (P) edit sheet `ceSetCap` 34511 (32686); (P) Rules panel `rlSet('cap')` 53601 |
| `noCarry` | (P) edit sheet (set with Study chip 32676); (P) Rules panel `rlSet('noCarry')` 53628 |
| `rules` (tokens first/last/sequential…) | (P) Add sheet `ceAddToggleRule` 34900 (`_same` 34918 writes partner subjects' `rules` too); (P) Rules panel `rlSet('rulesTok')` 53426 |
| `pacing/tpw` + `timesPerWeek` | (P) Rules panel `rlSet('tpw')` 53424; whole-record writers above |
| `allowedDays` (+ removes legacy `days`) | (P) Rules panel `cbPinDay` 53405/53409; (P) `ceSetTracking` 34323 (daily default Mon–Fri) |
| `noCoopDays` | (P) Rules panel `cwdPinDay` 41812 → `rlSet`; (P) Rules panel bulk "Use Mon–Thu for every 4×/wk subject" `cwdUseMonThu` 41831 |
| `momDays`, `momDayMin` | (P) Rules panel `lsdToggleDay` 34260 → `rlSet`; `rlSet('momDayMin')` 53612 |
| `coopDay`, `lessonDay`, `lessonDayMissed`, practice-missed, `stickyWith`, `stickyOrder` | (P) Rules panel `rlSet` 53605–53626 |
| `paused`, `pausedSince`, `planAnchor` | (P) edit sheet `ceTogglePause` 33357; (P) card ⏸/▶ `ceQuickPause` 33386–33388; (P+O) Family sheet / panel `famDoTogether` 37145 and `famMoveBack` 37157 via `_famSubjWrite` 37133 (also `pausedFor`) |
| `fixedTime`, `fixedDates`, `joinUrl` | (P) edit sheet `fxDoorToggle` 32303, `fxDoorSetTime` 32314, `fxDoorSetDates` 32323, `fxDoorSetUrl` 32330; (O) `psApply` sets `fixedTime` on create |
| `fixedTimeByDate/<iso>` | (O) **only** day view ⏰ dialogs: `stCommit` 38183 / `stMainPath` 38207, `fdtCommit` 38713 |
| `lessonUrls/<k>` | (P) edit sheet `llSetOverride` 39181 |
| `lessonUrl`, `linkLabel` | (P) `llSetTemplate` 39159, `llSetLabel` 39164 |
| `tracking` | (P) `ceSetTracking` 34323 (edit sheet 32662–32663) |
| `lessonSeq`, `lessonIds`, `nextLid`, `total` (via `setLessonSeq`) | (P) `ceSaveLessonSeq` 34310, `ceEditListLesson` 34528, `ceConvApply` 34361 / `ceConvUndoApply` 34442, `ceSetTracking` 34323, grid `gvCommitCell` 57072 (`gvSyncSeqInto`), `gvDeleteLesson` 57107, `gvCaptureSeqs` 55038, `gvSelClear/Fill/Undo` 55079–55128, `gvAuditFixDash/Dup/Gap` 55668–55729, `gvReconcileAdopt` 55837, `gvAssignLids` 33587, `gvMigrateDayTokens` 33962, Builder `cbApply` 53930 / `cbUndo` 54358; (O) `pgAutoApply` 52573 (Regenerate button, Sunday build) |
| `total` (direct) | (P) `gvRecountTotal` 57026 |
| `manualDone` | (P) `ceUnmarkLessonDone` 33318 |
| `practiceFor`, `practiceDayFrom` … | (P) `cePracticeSet` 3104 (edit sheet section) |
| `momPartMins` … | (P) `ceMomPartSet` 3139 (edit sheet section) |
| `minMin`, `minShow` | (P) `mmEditorSet` 11582 → `ceSaveField` (edit sheet section) |
| `unit`, `study` | (O) `psApply` sets `unit`; (O) `spApply` sets `study`; (P) edit sheet Study chip `ceSaveField('study')` 32676 |

Other curriculum / pace / plan nodes

| Node | Writers |
|---|---|
| `curriculum/lessons/<kid>/<dn>/<sk>` | (P) `ceEditLesson` 34552, `gvCommitCell` 57058/57062, `lmSaveSlotText` 59096, `_gvPurgeSubject` 34567, `ceSetTracking`, `cbApply`, `gvAuditFix*`; (P) `gvAddMissingDays` 57371 (**whole `lessons/<kid>` set**); (O) `uploadCurriculum` |
| `curriculum/weekDays/<kid>` | (P) `gvAddMissingDays` 57372 (whole set); (O) `uploadCurriculum` |
| `curriculum/lanes/<kid>/<id>` | (P) `lnEditSave` 53254, `lnRetire` 53278, `lnDelete` 53290, `lnUndoLast` 53302 |
| `curriculum/targetEnd/<kid>` | (P) `ceSetTargetEnd` 33338 — drawn twice on the page: `renderCurriculumView` 29334 and `renderCurrGrid` 57426 |
| `curriculum/momVerifyKid/<kid>` | (P) `ceToggleMomVerifyKid` 32387 — drawn twice: 29350 and 57428 |
| `curriculum/dayCap/<kid>` | (P) `cbSetCap` 53143 (Rules panel `cbCapStep` 53564 / "Reset to school hours" 53565) |
| `curriculum/done/<kid>/<sk>/<lid>` | (P) `_ceMarkDoneApply` 33256, `gvMenuDone` 56840, `gvImportDone` 33734, `ceUnmarkLessonDone` 33301; (O) `orderBlockApproveThrough` 10310, `lidDoneRemove` 33648 (card un-check) |
| `curriculum/skiplog`, `curriculum/rebaseline` | (P) `ceDeleteSubject` 34608–34609, `gvClearSkiplog` 33934 |
| `config/rules/maxPerDay` | (P) `gvMigrateCaps` 34022 ("🧢 Fold into Cap") |
| `pace/subjects/<kid>/<key>` | (P) `ceSetCount` 32394, `ceSetTotal` 32409, `cePaceClearHand` 32423, `updatePaceField` 59930, `ceConvApply`/`ceConvUndoApply`, Builder `cbApply` snap 54050 (`adjust`) / `cbUndo` 54370, `gvPurgePaceGhosts` 56010, `ceSetTracking` 34348, `_gvPurgeSubject` 34576; (O) `momDismiss` 58180 ("Skip for good"), `undoMomMove` 58220, `syncPaceData` 51839 (Pace page render) |
| `pace/plans/<key>` | (P) `ceRenderSessions` 29725 → `updatePlanField` 51918, `togglePlanKid` 51923, `togglePlanSchoolDay` 51931, `addPacePlan` 59451, `deletePacePlan` 51911, `ceSetSessionGoal*` 29835/29849, `ceSetSessionPoints` 29894, `ceSetSessionSong` 29901; (O) `syncPaceData` 51843 seeds defaults |
| `plans/<kid>/roadmap/<id>`, `plans/<kid>/notes/<id>` | (P) plan bar `rmSave` 27884, `rmDone` 27900, `rmDelete` 27919, `ntSave` 28536, `ntDelete` 28544; (O) Mom's Day week strip `rmRowHTML` → `rmDone` |
| `scheduleOverrides/<date>/<kid>` | (P) lesson map `lmToggleDayOff` 58675, `lmRemoveSubj` 58679, `lmDropSlot` 58686, `lmRestoreSubj` 58697, `lmAddSubj` 58701, `lmNudgeSubj` 58759, `lmResetOrder` 58767, `lmSaveAddedText` 59084, `lmMoveSlot` 59113, `lmMoveDay` 59245, `lmUndoMove` 59229; grid `gvPickMoveTarget` 56804; Builder `cbApply` snap 53994, `cbGateCancel` 54214, `cbUndo` 54379; `_gvPurgeSubject` 34572; (O) `gwSyncConfigOverrides` 58538 (Regenerate / Sunday build / `wkHandoverTo` 86720); dead: `flExtendSubject` 60073 |
| `config/rules/familyBlocks/<id>/…` | (P) Grid 🏡 panel `famHomePanelHTML` → `famBlockEditorHTML` writers; (P) Add sheet `famWhoSave` 38013 (2+ kids); (P+O) Family sheet `famSheetRender`; (O) `psApply` 40443/40445 (Units); (O) day view clash moves `atByDate/<iso>` (`stCommit`, `fdtCommit`) |


## 3. Settings that shape how a subject schedules but live ONLY outside the Curriculum page

| Setting | Path | Where (nav) | Code |
|---|---|---|---|
| Default school day start / end / lunch | `config/rules/schoolDay.defaultStart/defaultEnd/lunchStart/lunchEnd` | Settings ▸ School Day Times | `rulesUpdateTime` 79015 |
| Per-weekday school hours | `config/rules/schoolDay.overrides.<day>` | Settings ▸ School Day Times ▸ day chips | `rulesUpdateDayOverride` 79046, `rulesRemoveDayOverride` 79057 |
| Per-DATE school hours / lunch | `config/rules/schoolDay/byDate/<iso>`, `lunchByDate/<iso>/all` | Day view ⏰ Day times; 📅 This week ⏰; Calendar month day sheet ⏰ | `dtSave` 38854 / `dtClear` 38864; clash moves in `stCommit` 38185 / `fdtCommit` 38715 |
| Workflow order tiers per kid (normal + babysitter) | `config/rules/workflow/<kid>/<mode>[].subjects` | Settings ▸ Workflow Orders | `rulesSwapWf` 79066, `wfSubjMove` 79133, `wfSubjRemove` 79140, `wfSubjAdd` 79146, `wfSweepDead` 79178 |
| Stack gap between cards | `config/rules/stackGap` | Settings ▸ School Day Times | `rulesUpdateStackGap` 79021 |
| Saturday overflow on/off, Saturday cutoff, Saturday limits | `config/rules/saturdayOverflow`, `saturday.cutoff`, `saturday.<field>` | Settings ▸ School Day Times / Saturday Rules | `rulesUpdateSaturdayOverflow` 79034, `rulesUpdateSatCutoff` 79214, `rulesUpdateSaturday` 79207 |
| This week's Saturday on/off | `weekConfig/<wn>/saturday` | Day view ▸ 📅 This week | `twsToggleSaturday` 85495 |
| Catch-up mode (offered first / comes back on its own) | `config/rules/catchupMode` | Settings ▸ School Day Times | `rulesUpdateCatchupMode` 79040 |
| Sunday catch-up per kid | `config/rules/sundayCatchup/<kid>` | Settings ▸ School Day Times chips; Day view ▸ 📅 This week (Sunday) | `sucToggle` 39010; `twsToggleSunday` 85551 |
| Device counts and device queue priority | `config/rules/devices.<field>`, `devices.queue.<device>` | Settings ▸ School Day Times / Devices | `rulesUpdateDevice` 79027, `rulesUpdateDeviceQueue` 79199 |
| Kids with the sitter; sitter name | `config/rules/withSitter[]`, sitter name | Settings ▸ Babysitter | `rulesToggleWithSitter` 79006, `rulesUpdateSitterName` 79000 |
| This week's sitter days / times / who is with the sitter | `weekConfig/<wn>/babysitter`, `weekConfig/<wn>/withSitter`, `week<n>/babysitter` | Day view ▸ 📅 This week | `twsToggleSitter` 85462, `twsSitterTime` 85468, `twsToggleWithSitter` 85490 |
| Car-school days | `weekConfig/<wn>/carSchool/<dn>` | Day view ▸ 📅 This week | `twsToggleCar` 85476, `twsCarSet` 85482 |
| Co-op days (dates, kids, times, Mom away) | `calendar/coops/<id>` | Mom's Day ▸ 🗓 Schedule ▸ Month ▸ Co-ops ("+ Add Co-op / Custom Day", ✎) | `coopSave` 41918, `coopDelete` 41948 |
| Co-op date where Mom is here | `calendar/coopMomDays/<date>` | Day view top button (co-op day) | `coopToggleMomDay` 41728 |
| Kid off / override per date | `calendar/kidOverrides/<kid>/<date>` | Day view 😷 picker; 📅 This week; Calendar month ▸ Overrides | `schedToggleKidOff` 8627; `twsToggleKid` 85444; `calOverridesSectionHTML` 43271 |
| Fixed-time class moved for one date | `curriculum/subjects/<kid>/<sk>/fixedTimeByDate/<iso>` | Day view ⏰ clock on the class card (and clash moves from other ⏰ dialogs) | `stCommit` 38177, `fdtCommit` 38703 |
| Family Time start for one date | `config/rules/familyBlocks/<id>/atByDate/<iso>` | Day view ⏰ clock on the Family Time card / clash moves | `stCommit` / `fdtCommit` (`stMainPath` 38207) |
| Heads-up rules (on, autoDone, warnWeeks, noteDays, off) per family / kid / subject | `config/rules/headsUp/<scope…>/<field>` | Mom's Day home ▸ roadmap ⚙ panel and row ⋯ | `rmxRuleSet` 28346, `rmxRuleClear` 28355, `rmxMute` 28367, `rmxWarnShift` 28368 |
| Family minimum-minutes rule (grace, early, over) | `config/rules/minMinutes/<field>` | Settings ▸ Minimum minutes | `mmRuleSet` 11603 |
| Hide carryover per kid | `config/rules/hideCarryoverKids.<kid>` | Day view "🙈 Hide / 👁 Show Carryover" | `toggleHideCarryover` 9556 |
| Cleaning day hours / minutes per person | `config/rules/cleaningDay/*` | Settings ▸ Cleaning Day | `hhCleanRuleSet` 13698, `hhCleanMinSet` 13705 |
| Mom loop: order, start mode, cursor, kid off, Mom off, behind scope | `config/momLoop/*` | Settings ▸ Mom's loop; Day view 👩 strip | `mlSetOrder` 76997, `mlSetStartMode` 76918, `mlSetCursor` 77011, `mlSetOff` 76805, `mlSetMomOff` 76821, `mlSetBehindScope` 76953 |
| Per-card Mom moves this week (push, skip, drop, not today, move to today, pinned day-time) | `week<n>/momMoves/<id>` | Day view Mom card dialog / ✗ / ⏰ | `pushTaskForward` 58130, `momDismiss` 58164, `momNotToday` 58311, `momMoveToToday` 58416, `fdtCommit` 38709, `undoMomMove` 58214 |
| Deck gated by a subject (mastery) | `mastery/<kid>_settings/cat_gate/<deck>/subject` | Units ▸ enroll / Start stage / Put on the schedule | `unitEnroll` 49975, `_ustWrite` 49563–49564, `psGateAndEnroll` 40418 |
| Mastery session records (what a `study` subject runs) | `mastery/<kid>_sessions/<sid>` | Mastery HQ ▸ Sessions; Units check-ups / Envirothon | `mhqSessSave` 72648, `mhqSessDelete` 72786, `ckStartCreate` 70523, `unitStageCheckup` 67776, `envEnrollSession` 49105 |
| Mastery load knobs / suggestion mode | `mastery/<kid>_settings/load/*` | Scores page 🎚 dial; Mom's Day "Not now" | `mldSet` 29057, `mldUndo` 29067, `mlsSetMode` 29206, `mlsSnooze` 29200 |
| Scanned book lesson lists (page-book subjects) | `library/scans/<bookId>/lessons` | Mastery tab ▸ sprint book "Save list" | `msBookSave` 81555 |

## 4. Counts

- Outside rows in table 1: **51** (rows 1–51; 49–51 are automatic / unreachable rather than tapped controls; 29, 33, 39, 47 are doors or read-only).
- Outside **controls a Mom can tap** that write data: **45** (51 minus rows 29, 33, 39, 47 [no write] and 49, 50 [automatic]; row 51 is unreachable code and excluded).
- Of those 45, **duplicate a control on the Curriculum page** (column "Same data…" = yes or partly): **11** — rows 8, 9, 11, 12, 14, 22 (partly), 32, 37, 38, 45, 46. The automatic rows 49 and 50 also rewrite page-editable data (pace records; lesson sequences) but are not tapped controls.
- The other 34 tappable outside controls write data that has **no editor on the Curriculum page** (rows 1–7, 10, 13, 15–21, 23–28, 30, 31, 34–36, 40–44, 48).
- Outside settings that shape a subject's scheduling and live ONLY outside the page (table 3): **29** setting groups.
- Outside-to-outside duplicates (same setting in two outside places): per-date school hours (day view ⏰ / This week ⏰ / Calendar ⏰), Sunday catch-up (Settings / This week), with-sitter kids (Settings / This week), kid off (day view / This week / Calendar), Mom-loop off/cursor (Settings card / day strip), whole-record "Put it on" subject creation (Units / Mastery HQ), Family Time editor (Grid panel / sheet).
- Within-page duplicates noted in passing: `ceSetTargetEnd` and `ceToggleMomVerifyKid` and `alignPlanApply` and `cbUndo` each drawn in both `renderCurriculumView` and `renderCurrGrid`; `cbRenderRules` drawn by both `renderCurrBuilder` and `renderCurrGrid`; `lmSaveSlotText` in both `lmRenderSubjectView` 59131 and `lmRenderSubjectGrid` 59258.
