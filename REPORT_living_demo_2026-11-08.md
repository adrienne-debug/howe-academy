# Living schedule — slice E: the demo run (2026-11-08, Fable)

Her words (11/8): "run demo runs and find any issues … really study how it should work and make sure that we have no small issues
and to make sure that no subjects get skipped or deleted or anything along those lines."

Branch `claude/living-slice-e-13af3f` off `main` 2953ec5. Nothing merged, nothing deployed, nothing written to Firebase.
Compare: https://github.com/adrienne-debug/howe-academy/compare/main...claude/living-slice-e-13af3f?expand=1

| commit | what |
|---|---|
| 2a0e2a5 | the harness: `test_demo_week.js`, `test_fixtures/demo_week_sandbox.js`, `test_fixtures/living_demo_family.json` |
| 4c94e04 | **BUMPCLOSE** — the early check-off rotation keeps the Closing Notebook last (step S3) · `test_bump_closing.js` |
| 0dcdec4 | **RELAYGUARD** — the re-lay door runs the school-end guard even when nothing sweeps (S6) · `test_relay_guard.js` |
| 03019b8 | **RPPAT_TEXT** — a held card still takes the list's text on a re-lay (S7) · `test_rppat_retitle.js` |
| 55bbf53 | **RELAYWIRE** — the 8 PM sweep's own moves never trip the "held card changed" wire (S9) · `test_relay_sweep_wire.js` |
| 594f540 | harness: S10 expects no what-moved line; F4's premise from the board history |

**Update 2026-11-09 — F1–F4 built** on `claude/living-f1-f4-faceee` (cut from slice E; one commit each, each proven by its own
harness scenario). Compare: https://github.com/adrienne-debug/howe-academy/compare/claude/living-slice-e-13af3f...claude/living-f1-f4-faceee?expand=1

| commit | what |
|---|---|
| 90567f9 | **ABFIRST** (F1) — a brand-new family's first week builds itself; the harness no longer sets a flag by hand |
| 35953cc | **ADDPB** (F2) — a sequenced subject added on the Add sheet is born plan-backed and lays this week |
| 894d081 | **TWSSAT** (F3) — Saturday on mid-week adds the Saturday tab and lays the dailies that name Saturday · `test_this_week_strip` updated |
| ac31e23 | **SUCPB** (F4) — Sunday catch-up shows plan-backed subjects (the archive now records what a week deferred) |
| e9ab5d1 | TWSSAT words — Saturday off says "· 2 off Saturday", not "to next week" |

## 1. What the harness is

`node test_demo_week.js` (~4 s). The WHOLE app — index.html's main script, unedited except two string patches that make
`renderAll` / `renderAllSoon` return at once — runs inside a Node vm sandbox (`test_fixtures/demo_week_sandbox.js`):

- a fake DOM that swallows every paint;
- ONE in-memory Firebase tree shared by two devices — `ref().on / once / set / update / remove / transaction / push`, value listeners
  that fire the way the SDK does (asynchronously; for a path and for every listener above and below it), multi-path updates that
  refuse an ancestor-and-child pair like the real server, and a write log naming every write (op, path, device, whole-node flag);
- ONE virtual clock and timer queue shared by the devices, advanced by the test — the relay's 2 s wait, the 3 s echo guards, the
  claim's 2 minutes and the 45 s chain guard all run on the same clock. Intervals are registered but never fire on their own: the
  test calls `dayRollCheck` and `mlEveningSweep` itself, as the minute tick would.
- Device **A** is Mom's (Mom mode on; every door is tapped here). Device **B** is a kid's tablet: it only listens, and checks cards off.

The family is SYNTHETIC (`test_fixtures/living_demo_family.json`, 44 KB, no real names or data): kid_a / kid_b / kid_c (school) and
kid_d (Pre-K, bookends + one daily); 8 / 8 / 7 subjects — Builder-paced (plan-backed) lessons with lists and ids, dailies with
pattern days, a fixed-time class (Wednesdays 10:00, real dates), a Mom-required subject per kid, a timed co-op (kid_b, Thursdays
9:00–1:00, "no Mom-required lessons"), Sunday catch-up on for kid_a, a sitter Tuesday 10:00–1:00 with kid_c in `weekConfig/2`.
School 9:00–3:30, lunch 12:00–12:45. A 6-week grid (Mon–Fri rows; no Saturday rows, so the grid never "plans" Saturday). Two dailies
name Saturday (kid_a Piano Mon–Sat, kid_b Baking Saturday only — added 11/9 for F3); they run only in a week with Saturday on.

The replay: week 1 builds ITSELF on Sunday 11/08 00:00 from an empty database (no `ha_active_wk`, no week node — F1) and is played out (the kid's tablet boots Monday, cards are checked at their times, two
lessons a day are left undone on Wed/Fri, the 8 PM sweep runs daily) so week 2 has history to carry. Then the week under test:

| step | when | the door |
|---|---|---|
| S1 | Sun 11/15 00:00 | both devices awake → `dayRollCheck` → the self-build (claim) |
| S2 | Mon 9:40 | the Grid's ✕ "off this day": kid_b Spelling off Wednesday (`gvMenuOff`) |
| S3 | Mon 10:05 | kid_a's Piano (laid 10:00) checked early on the kid's tablet (`finalizeDone` → the rotation) |
| S4 | Tue 9:15 | add a subject: a daily (Music Tue/Thu, kid_c) and a sequenced one (Geography Mon/Wed/Fri, kid_b) + Build |
| S5 | Tue 3:00 PM | 📅 This week: kid_b off Wednesday (`twsToggleKid`) → **Undo** → redo |
| S6 | Wed 8:30 | ⏰ Thursday 11:00 AM–2:30 PM (`dtOpen`/`dtSave`) → **Undo** → redo |
| S7 | Wed 10:30 | lesson-text edit on today's open card: kid_a Math "Math 5" → "Math 5 (review)" (✎ Save list, `ceConvApply`) |
| S8 | Thu 9:30 | delete a subject: kid_a History (`ceDeleteSubject`) |
| S9 | Thu 8:00 PM | the sweep (`mlEveningSweep`) |
| S10 | Fri 9:00 | 📅 This week: Saturday on (`twsToggleSaturday`) → **Undo** → redo → Saturday off → on again |
| S11 | Sat 00:00 | the day rolls (no build) |
| S12 | Sun 11/22 00:00 | both devices awake → week 3 builds; carries |

After EVERY step the same checks run on the database tree (not on a device's memory):

- **C1 pattern** — every active subject has a card on each remaining day its pattern names (plan days, class dates, kid off, the
  co-op's no-Mom rule, a ✕'d day — read through the app's own functions). A card the sweep carried OFF a day to a later one, or a
  plan-backed lesson the guard deferred off the week (day too short), is a NOTE, not a failure (C3 and the week-turn check prove it
  is not lost).
- **C2 no-double** — never more open cards of a subject on a day than its cap; never the same lesson twice on the board.
- **C3 no-lost (list order)** — a plan-backed subject's open cards are exactly the earliest undone lessons, in list order, no gap.
- **C4** — no open lesson left on a day already over (dailies and boxed cards may: a missed day is just missed).
- **C5** — a checked card keeps its day, time and text from the moment it was checked.
- **C6** — the class sits at 10:00 on each of its dates.
- **C7** — Morning Notebook first (a class is the only thing ahead of it), Closing Notebook last.
- **C8** — every open card inside its date's own start/finish (⏰) and off lunch.
- **C9** — no two of a kid's open cards overlap.
- **C10** — the what-moved line lists exactly the open cards whose day/time changed in the step (held cards excepted), the cards
  removed and the cards added.
- **C12** — the kid's device shows the same week as the tree and Mom's device; no re-lay ever ran on it.
- **C14** — the relayLog is coherent (key = at, label + why, n = moves + removed + added + boxed, ≤ 10 entries).
- **C15** — every write is counted; a whole-node `week*/tasks|checked|history` write is flagged (a failure only from the kid's device).
- Plus per step: the self-build ran ONCE (one committed `meta/building` claim, one whole-node tasks write), Mom's note names the
  sitter and the Sunday catch-up, every lesson left open in week 1 is on week 2's board, the sitter Tuesday / the co-op Thursday /
  the ⏰ Thursday hold, Undo puts the trigger path AND every listed card back exactly (one multi-path update) and the week still
  checks clean, the deleted subject's open cards are gone and its checked cards stay, the sweep's marker, week 3 serves every lesson
  left open in week 2, week 2 is archived with its checks.

## 2. Steps × checks (after the four fixes)

| step | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | C12 | C14 | C15 | writes | whole-node | what-moved line |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| S0 week 1 built itself (Sun 11/08, empty database) | · | · | · | · | · | · | · | · | · | · | · | · | · | 15 | 3 (commit) | 🗓 Week 1 built itself — 99 cards |
| S0b week 1 played (Fri 8 PM) | · | · | · | · | · | · | · | · | · | · | · | · | · | 491 | 6 (commit + 5 sweeps) | — |
| S1 Sun 00:00 self-build | · | · | · | · | · | · | · | · | · | · | · | · | · | 18 | 3 (commit) | 🗓 Week 2 built itself (Sun 00:00) — 99 cards, sitter Tue, Sunday catch-up for Kid A |
| S2 Mon 9:40 Grid ✕ | · | · | · | · | · | · | · | · | · | · | · | · | · | 11 | 0 | 🧱 Spelling re-paced → 1 moved · 1 to next week |
| S3 Mon 10:05 early check | · | · | · | · | · | · | **·** | · | · | · | · | · | · | 6 | 0 | (a check, no re-lay) |
| S4 Tue 9:15 add a subject | · | · | · | · | · | · | · | · | · | · | · | · | · | 26 | 0 | 📚 Music added → 1 moved · 2 added · 📚 Geography added → 2 moved · 2 added (F2) |
| S5 Tue 3 PM kid off Wed | · | · | · | · | · | · | · | · | · | · | · | · | 1 ⚑ | 7 | 1 (sweep) | 😷 Kid B off Wed, Nov 18 → 12 moved (Kid B 7, Kid C 5) |
| S5 Undo → S5b redo | · | · | · | · | · | · | · | · | · | · | · | · | 1 ⚑ | 7 | 1 (sweep) | same line, same 12 cards |
| S6 Wed 8:30 ⏰ Thu 11–2:30 | · | · | · | · | · | · | · | **·** | · | · | · | · | · | 8 | 0 | ⏰ Thu, Nov 19 11:00 AM–2:30 PM → 19 moved · 1 to next week |
| S6 Undo → S6b redo | · | · | · | · | · | · | · | · | · | · | · | · | · | 8 | 0 | same |
| S7 Wed 10:30 lesson text | · | · | · | · | · | · | · | · | · | · | · | · | · | 11 | 0 | 🧱 Math re-paced → 0 moved · 1 to next week (today's card retitled ✎1) |
| S8 Thu 9:30 delete subject | · | · | · | · | · | · | · | · | · | · | · | · | · | 29 | 0 | 🗑 History deleted → 1 moved · 1 to next week |
| S9 Thu 8 PM sweep | · | · | · | · | · | · | · | · | · | · | · | · | 1 ⚑ | 8 | 1 (sweep) | 🌙 8 PM sweep → 15 moved (no ⚠ any more) |
| S10 Fri 9:00 Saturday on | · | · | · | · | · | · | · | · | · | · | · | · | · | 17 | 0 | 📅 Saturday on (Week 2) · Sat: Piano (Kid A), Baking (Kid B) → 0 moved · 2 added (F3) |
| S10 Undo → S10b redo | · | · | · | · | · | · | · | · | · | · | · | · | · | 17 | 0 | same line, same 2 cards |
| S10c Fri 9:10 Saturday off | · | · | · | · | · | · | · | · | · | · | · | · | · | 13 | 0 | 📅 Saturday off (Week 2) — the Saturday tab stays (1 card on it) → 0 moved · 2 off Saturday |
| S10d Fri 9:15 Saturday on | · | · | · | · | · | · | · | · | · | · | · | · | · | 13 | 0 | the Saturday-on line again (the tab was kept, so only the cards are written) |
| S11 Sat roll | · | · | · | · | · | · | · | · | · | · | · | · | · | 0 | 0 | — |
| S12 Sun 00:00 week 3 | · | · | · | · | · | · | · | · | · | · | · | · | · | 17 | 3 (commit) | 🗓 Week 3 built itself (Sun 00:00) — 102 cards, Sunday catch-up for Kid A; Sunday's tab: Kid A Math L0008, Reading L0006 (F4) |

`·` = clear. ⚑ = flagged (not a failure): the cascade's own whole-node `set week2/tasks` from Mom's device — see note N1.
Before the fixes the table had: S3 C7×1, S6/S6b/S7 C8×2, S7 title not updated, S9 "⚠ 2 held cards changed". 52 checks pass, 0 fail.
After F1–F4 (11/9): 69 checks pass, 0 fail. S5/S6/S9 move one to four more cards than on 11/8 — kid_b's new Geography cards (F2) and
Saturday's dailies now sit in the week and move with it. C10 now judges a step that writes two what-moved lines (S4: two adds) against both.

## 3. Findings

### Fixed here (each a small change, one commit, its own test; the replay proves it)

**B1 · S3 · BUMPCLOSE — the early check-off rotation left the Closing Notebook inside a lesson.**
Cards: kid_a Monday — Morning 9:00, Reading 9:35 (25 min), Piano 10:00 (20 min), Closing 10:20. Piano checked at 10:05 →
`bumpSkippedInTier`: Piano took 9:35, Reading slid to 10:00 and ran to **10:25, under the 10:20 Closing**. Rule broken: Closing
Notebook last / no two cards stacked (the comment "the group's total end never exceeds the original last end" is false when a longer
card slides into a later slot). Fix: an open Closing on that day that would start inside the rotated group moves to the group's new
end in the same targeted update; a checked or claimed Closing never moves. Real bug (every early check-off of a card shorter than the
one it passes).

**B2 · S6 · RELAYGUARD — ⏰ a shorter day set from the banner was not respected.**
Cards: kid_b Thursday (co-op until 1:00) with Thursday set to 11:00–2:30 on Wednesday: Typing **2:20–2:35** and Closing **2:35**
stayed past the 2:30 finish. Rule broken: "the school day's end is respected". Cause: the relay's pass A is the cascade; its quiet
path (nothing from a past day to move) heals and re-packs but never calls `seGuardWeek` — only the sweeping path does, inside
`safeWriteTasks`; the scar re-pack keeps a card that doesn't fit in its old slot. Fix: `_rlwGuard` runs the same guard with the app's
context after `runCascade` on every relay run and writes its paths as one targeted update; after a sweep it finds nothing to do. Its
moves land in the same what-moved line and Undo. In the replay the guard then deferred kid_b's Science off the week (Thursday 1:00–2:30
holds 90 min, the cards were 100) — Mom's line says "· 1 to next week", and week 3 serves it first (S12 proves nothing is lost).

**B3 · S7 · RPPAT_TEXT — a lesson-text edit on today's open card showed tomorrow, not today.**
Cards: kid_a Wednesday Math 9:05, list text "Math 5" → "Math 5 (review)" at 10:30; the card kept "Math 5" (`reproject …
+0 ↔0 −1 ✎0`). Cause: mid-day the re-lay runs "from tomorrow" and today's card is frozen; its lesson is `taken`, so `_rpPatternWant`
minted no want for it and `_reprojectPlan` left it alone. Fix: a held card whose title no longer ends with its list text joins the
wanted set with the same id, day and time and the list's text (`gwTaskTitle`), so the diff retitles it in place (one `<id>/title`
write, never a move; checked cards stay records). Her ask: "if I change something in the grid … it all reflects in the week".

**B4 · S9 · RELAYWIRE — the 8 PM sweep's line cried wolf every evening.**
"🌙 8 PM sweep → 14 cards moved · **⚠ 2 held cards changed**" about kid_c's Math L0009 and Phonics L0008 — today's unfinished
cards the sweep had just carried to Friday, which is its job. Cause: `_rlwRun`'s snapshot marks every card at or before now as
started/held; the wire exists for OTHER doors. Fix: a run whose why is "sweep" (the 8 PM sweep, ⏩ push) snapshots with no clock;
every other door keeps the wire (a started or claimed card that changes day is logged and listed).

### Fixed on `claude/living-f1-f4-faceee` (11/9) — the four proposals, each one commit + its harness scenario

**F1 · ABFIRST — a brand-new family's first week builds itself.** Was: with no week node, the tasks listener never sets
`fbTasksLoaded` (`if(!s.val()) return;` — deliberate, a wiped live week must not look empty), so `autoGenerateWeekIfNeeded` waited
for ever and Generate Week (the old bootstrap) is gone. Now, for the self-build ONLY, the week counts as loaded when ALL hold: the server
answered `ha_active_wk` = nothing, this device never wrote it, the active week has no cards, and the server answered that week's tasks
node = nothing (`_abFirstWeek`). `fbTasksLoaded` is untouched — the sweep, cascade, heals and re-lay doors wait exactly as before.
Harness S0: an empty database + a curriculum → Sunday 00:00 builds week 1 (one committed claim, the tasks, Mom's note,
`ha_active_wk = week1`), nothing touched a week node before the build, and a second run writes nothing.

**F2 · ADDPB — a sequenced subject added mid-week lays this week.** `ceAddSave` stamps `planId` + `doneImportedAt` on a new sequenced
subject (it is born with ids and has no history for done-by-id to disagree with), so it is plan-backed from birth: the add itself and
its Build re-lay through the door ("📚 Geography added → 2 moved · 2 added"), and the week turn never applies the legacy catch-up
doubling to its never-dealt cells. A new daily lays as before. Harness S4: Geography L0001 Wed, L0002 Fri (L0001 later follows kid_b's
day off to Thursday and is checked there); S12: week 3 deals ONE per pattern day — Mon L0003, Wed L0004, Fri L0005 (was two on Monday).
Note for Adrienne: the new subject lays by its days the moment it is saved, before she paces it; a Build then re-lays it as paced.

**F3 · TWSSAT — Saturday on mid-week adds the Saturday tab and its dailies.** For the week on the board, Saturday on writes
`week<N>/meta/dates/saturday` (one targeted leaf, the build's own "November 21" words) and sends the DAILIES that name Saturday
(`allowedDays` has "Sat", or no `allowedDays` and "Sat" in `days`) through the one door — pass B's daily shell, with `_rlwDailyWant`
wanting a Saturday card for them (the generator lays only the grid's days, so Saturday is asked for like a dropped day). Lessons stay
Mon–Fri (her rule): a sequenced subject is never sent and never wanted there. The line names them: "📅 Saturday on (Week 2) · Sat:
Piano (Kid A), Baking (Kid B) → 0 moved · 2 added". Saturday off takes those dailies' open Saturday cards off and removes the date
unless a card still sits on Saturday — a checked one, or the sweep's overflow — then the tab stays and the line says so ("— the Saturday
tab stays (1 card on it) → 0 moved · 2 off Saturday"). Undo = the setting, the date and the cards back. Harness S10–S10d: the tab on
both devices, both dailies laid, targeted writes only, Undo removes all of it, redo, off (kid_c's overflow Math keeps the tab), on.
A week not built yet is unchanged: the Sunday build reads `weekConfig` as before and lays only the grid's days — see §4.

**F4 · SUCPB — Sunday catch-up shows plan-backed subjects.** A plan-backed subject never makes a "(Carried from …)" twin or a
`catchup:true` card, so Sunday's tab was empty for exactly the subjects Howe runs. `sucPick` now also takes, per plan-backed subject of a
kid with Sunday catch-up, its earliest N cards of the new week, N = the lessons the closed week still OWED that the new week serves.
"Owed" is read from the archive: a lesson card open on the archived board, **or a lesson a re-lay sent "to next week"**. The second half
is new — the proposal's "open on the archived board" alone finds nothing here: every kid_a lesson on week 2's board was checked at the
close; L0006 had been taken OFF the board by S8's re-lay. So `gwCommit` now adds `deferred` ({kid:{sk:[lid]}}, from the closing week's
relayLog, undone runs skipped) to the archive entry it already writes. N is counted on the new board, not from `done`, so checking a
Sunday card off never shifts the rest. Harness S12: `archive/week2.deferred` names kid_a Reading L0006 (and Math L0008, kid_b Math
L0008); Sunday shows kid_a Math L0008 and Reading L0006 and nothing else (kid_b has no Sunday catch-up; kid_a's History L0004 is not
served — the subject was deleted); checking Reading off on Sunday leaves the Sunday set as it was.

### Notes — by design, worth knowing

**N1 · every sweeping re-lay rewrites the whole tasks node.** A kid-off (S5), the 8 PM sweep (S9) and each of week 1's daily sweeps
end in the cascade's `safeWriteTasks`: one `set week<N>/tasks` of every card (99–100 cards), the legacy write the RELAY design
knowingly kept ("the SAME sweep the app already trusts"). In week 1 the kid's tablet did one of them itself (a listener-triggered
cascade that won the lock). Targeted writes exist for every other door. Proposal (bigger): the cascade's sweep writes a diff.

**N2 · two "today" rules.** A "curriculum" door (a cell, lesson text via `lmSaveSlotText`, add/delete) re-lays today's open cards
(`RLW_CURR_TODAY`), while a "build" door (✎ Save list, the Grid ✕, the Builder's Apply) keeps today and starts tomorrow. Same Mom,
same mid-morning edit, two behaviours. After B3 a text edit shows today either way; a day change still differs.

**N3 · deleting a subject re-lays every other subject of that kid.** S8: "🗑 History deleted → 1 moved · 1 to next week" — kid_a's
Reading L0006 left the week because the pattern-forward re-lay of Reading (Fri the only pattern day left) had one slot for two open
lessons. Nothing lost (week 3 serves it), but Mom deleted History and a Reading lesson moved to next week.

**N4 · a shorter ⏰ day can send a lesson to next week.** S6: Thursday 1:00–2:30 could not hold Science; the guard deferred it,
the line says "· 1 to next week", week 3 serves it first. That is the SCHOOLEND rule working; worth knowing when she shortens a day.

**N5 · the week turn.** Both devices awake at 00:00: one takes the scheduler lock, the other logs "skipped: another device holds the
scheduler lock" and never builds; the `meta/building` claim is the second guard. Every lesson left open in week 1 was on week 2's board
(re-served, no `_c` twins for plan-backed subjects); every lesson left open in week 2 is on week 3's; week 2 is archived with its checks.
Mom's note: "🗓 Week 2 built itself (Sun 00:00) — 99 cards, sitter Tue, Sunday catch-up for Kid A".

## 4. What the harness cannot cover

- Real devices and screens: nothing is painted; the living-day display lay (`mlQueueLay`, `dsRetime`) and the Day page are not
  judged — the checks read the stored week. A device going to sleep, waking, reloading (WKRELOAD), or losing the connection.
- The real Sunday: the roll is the test calling `dayRollCheck` at 00:00:30 on both devices; on a real device it is the minute
  interval or a wake. `AUTOBUILD_SUNDAY_AT="start"` is not replayed (test_autobuild_settings covers it).
- Firebase itself: the fake delivers a write to every listener at +0 ms, never reorders, never drops, has no auth or rules; the
  real SDK's latency is what the 3 s echo guards are for. `?dryrun=1` is not the mode run.
- The kids never tap a screen: check-offs call `finalizeDone` the way a tap does; nothing else on the tablet (Mastery drills,
  retrieval, points, chores, brain breaks, family time, lanes, car school, late start, helpers) is in the fixture.
- F3, a week not built yet: Saturday on for NEXT week (the strip's "Next week ›") writes only `weekConfig`; the Sunday build lays the
  grid's days, so a Saturday-only daily gets no Saturday card in a week whose grid has no Saturday rows until the board-week toggle (or
  any re-lay of that daily) runs. Unchanged from before; not replayed.
- F4: `archive.deferred` comes from the closing week's relayLog, which keeps the newest 10 runs — a deferral older than that in a busy
  week is not counted (that lesson is still served first; it only would not show on Sunday). Archives written before this branch have no
  `deferred`; for them only lessons open at the close count. The other archive writer (the Plan Next Week / upload path at ~27580) does
  not add it.
- One family shape. The checks read patterns through the app's own functions, so a different fixture (more kids, Saturday rows,
  a lane, a page book) would run — but was not.

## 5. For Adrienne — plain words

**What you'll see this week (with this branch merged).**
Sunday at midnight the new week appears on every device that is awake, with one line on the day banner saying what it built
("Week N built itself — 112 cards, sitter Tue …"). Every edit you make — a cell on the Grid, ✎ Save list, add or delete a subject,
😷 a kid off, ⏰ a day's times, Saturday on, the 8 PM sweep — re-lays the week by itself within two seconds and writes one line on the
banner: "⏰ Thu 11:00 AM–2:30 PM → 15 cards moved · 1 to next week", with **↩ Undo** for 15 minutes. Checked cards never move and
never change their words. A fixed-time class stays at its time. Morning Notebook first, Closing Notebook last. If a day is too short
for everything, the lesson furthest ahead goes to next week and the line says so — nothing is dropped from the plan; next week's
build serves it first. The 8 PM line no longer says "⚠ held cards changed" about its own moves.

With F1–F4 (11/9): a subject you add mid-week — a daily or a sequenced one — shows on the rest of this week's days at once, and next
week deals it one lesson per day (no doubled Monday). Turning Saturday on in 📅 This week adds a Saturday tab with the dailies that
run on Saturdays (a Saturday daily, or one like Piano set to Mon–Sat) — never lessons — and the line names them; Saturday off takes them
off again (the tab stays if something is still on Saturday, and the line says so). On Sunday, a kid with Sunday catch-up sees the lessons
that fell behind last week — including ones a re-lay pushed to next week — at the top of Sunday's tab. A new family's first week builds
itself on Sunday night like every other week.

**What to do if a card looks wrong.**
1. Look at the line on the day banner: it says what moved and why. **↩ Undo** (15 minutes) puts the setting and the cards back.
2. If the line is gone or the day still looks wrong: **🔄 Regenerate** on the day banner lays the week again from now — checked cards
   keep their check, nothing before today changes.
3. If a card is past the day's end or sits on lunch: that is the bug fixed here (B2) — until this is merged, 🔄 Regenerate fixes it.
4. If a kid's device shows a different week than yours, wait a moment (it follows the tree) or pull to reload.

## 6. The suite

`for t in test_*.js; do node "$t"; done` on the rebased tree (origin/main f99b1f5): 732 files, 1 failure — `test_sunday_catchup.js`
(date-bound, always fails). The perf budget passes (the sandbox lives under `test_fixtures/` so its timer stubs are not scanned). New: `test_demo_week.js` (52 checks), `test_bump_closing.js` (8), `test_relay_guard.js` (12),
`test_rppat_retitle.js` (8), `test_relay_sweep_wire.js` (5).

**11/9, after F1–F4** (`claude/living-f1-f4-faceee`): 732 files, 1 failure — `test_sunday_catchup.js` (date-bound; the same 4 date checks
fail with and without these commits). The perf budget passes. `test_demo_week.js` 69 checks (was 52); `test_this_week_strip.js` 79 (the
Saturday-on path list now includes the board week's Saturday tab leaf, and the Undo holds it).
