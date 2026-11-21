# LMCLEANUP audit — which Lesson Map / Builder-tab code is dead (slice 3a, 2026-11-21)

Slice 3a of `PLAN_curriculum_streamline_2026-11-10.md` (§1.6, §4 rows 3a/3b, §4.3, Appendix C). Her words 2026-11-10:
*"lets remove and clean up but def audit to make sure it causes no issues before you do it."* **This slice deletes nothing
and changes no app file.** It adds this write-up and the harness `audit_lessonmap_dead.js` (passes: `node audit_lessonmap_dead.js`).

Audited on `origin/main` **abb03281** (`index.html` 7,938,080 bytes, 92,603 lines) plus every lazy app file beside it
(`classes.js eic.js env.js envirothon.js esa.js family-config.js games.js geo.js gifts.js house.js library.js notebooks.js
perf_budget_measure.js play.js seasons.js sw.js us.js us_pics_1.js us_pics_2.js wishes.js`). The plan's line numbers were
from 11/10; every line below is re-found today.

## 0 · The short version

| | Count | What it means for 3b |
|---|---|---|
| **keep** (reachable) | 23 | bodies untouched |
| **keep — reserved for ADDFLOW** | 5 | `cbRenderForm` + its four field setters: unreached today, but the plan's guided Add (slice 5, being built now) draws them. Not proven removable → keep |
| **move** | 2 | `flExtendMakeupCount`, `flUndoExtend` — the data check found **55 leftover Extend make-ups**; the only "Clear make-ups" button is in the dead branch |
| **go** (dead) | 68 | 60 from the plan's list + **8 more** the closure found (incl. `ceWorkflowTier`, which the plan had on *keep*) |
| **Bytes 3b frees** | **92,084 B (89.9 KB)** of code; **96,967 B (94.7 KB)** with the comment headers above each function | 1.2 % of `index.html`. The plan's own list alone is 87,689 B |
| **Live sites 3b re-points** | 3 | `lmDropSlot`'s `lmEditSlot=null`, `lmAddSubj`'s `lmAddOpen=null`, the grid's "Moved … ↩ Undo" banner |
| **Open decision** | 1 | the ↩ Undo banner → **recommend go** (§9) |

Nothing found that I could not prove either way, except the ADDFLOW-reserved five (kept on intent, §3.2).

## 1 · How it was proved

`audit_lessonmap_dead.js` does two independent things:

1. **Static, every byte.** A small JS lexer splits each inline `<script>` and each lazy file into code / comments / strings /
   regexes (sanity: every script's code braces balance to 0, every one of the 7,613 `function NAME(` bodies found its closing
   brace, every block parses in `vm.Script`). Every occurrence of every audited name is classed: *comment · definition ·
   own body · inside a GO body · inside a structurally dead span · LIVE* (live code, live handler text inside a string, or
   static markup). It asserts: **no GO name has a LIVE occurrence** except the three re-point sites (§8), every KEEP name
   has one, **no lazy file names any audited name**, and the MOVE / reserved names have no live door.
   A **transitive closure** then adds every function or top-level variable that is referenced at least once and *only*
   from GO bodies, dead spans or comments (iterated to a fixed point; a `typeof X` probe or a name in any string counts as live).
2. **Runtime, in a vm.** All five inline scripts of `index.html` run to the end in one vm context on inert stubs (no
   network, no Firebase — `firebase` is undefined so `db` is null; `?dryrun=1`). Then **every GO function (63) and the 5
   reserved ones are replaced by tripwires** and the live page is driven: `renderCurriculumView` with `currInnerTab` =
   grid / subjects / plans, the router (`momHQGo('curriculum'|'grid')`), the 📅 Kid's year panel on all four tabs, a future
   cell's action menu, an empty cell's ➕, the ➡ move armed (Parking banner), the subject card, ⤒ Delete & shift up's new
   door (`kyPaceDoor`) and Copy-to-another-kid's landing (`kyCopyLand`). Result: 184,558 bytes of HTML, 489 handler
   attributes, every live control it set out to reach was drawn (`gvOpenCell gvMenuOff gvMenuStartMove gvMenuAddMakeup
   gvCancelMove kySetTab ceSetTargetEnd ceToggleMomVerifyKid ceSessToggle gvRulesToggle setCurrInnerTab`), **no tripwire
   fired, and no drawn onclick/onchange/oninput names a GO function.** `currInnerTab` ends on `"grid"` after every router target.

## 2 · The structurally dead spans (each with its proof)

| Span (today) | Bytes | Why it can't run |
|---|---|---|
| `momHQGo` L7265 — `case "builder"` | 75 | No live `momHQGo(...)` call passes `"builder"`; the only computed caller is `_hqRow(target)`, and `_hqRow("builder",…)` exists only inside a comment (L8928). |
| `renderCurriculumView` L30801–30805 — the Builder-tab branch | 92 | `currInnerTab` is assigned only literal `grid/builder/subjects/plans` or by `setCurrInnerTab(tab)`; that one is called only by the one-chip bar, which iterates `["grid"]`. `"builder"` is assigned only in `cbJumpTo`, `gvJumpBuilder` (both GO, zero callers) and the dead router case above. |
| `renderCurriculumView` L30816–31123 — the Subjects branch (everything after the Grid's `return`) | 24,492 | L30785 rewrites `subjects`/`plans` to `grid` before any branch; the Grid branch returns; so this needs a `currInnerTab` outside {grid, builder, subjects, plans}, which nothing assigns. |
| `renderCurrGrid` L62007–62012 — the "Moved … ↩ Undo" banner | 862 | Guard `if(typeof lmLastMove!=="undefined"&&lmLastMove){`. `lmLastMove` is set non-null only by `_lmSnapMove` (GO), whose callers `lmMoveSlot` / `lmMoveDay` are GO; every other assignment is `null`. |

The vm confirms the first three by running them; the fourth by the tripwire on `_lmSnapMove`.

## 3 · Every name, every reference

Columns: definition line · bytes of its declaration · each reference as *line enclosing-function* (⟨… dead branch⟩ = inside a
§2 span) · tests that name it · verdict. Comment lines are listed by line only. "state" = a top-level `let`.

### 3.1 KEEP — reachable (23)

| Name | Def | Bytes | Live code / handler text / markup | Dead branch / GO body | Own body | Comments | Tests naming it | Verdict |
|---|---|---|---|---|---|---|---|---|
| `lmDropSlot` | 63002 | 350 | 60236 gvMenuOff · 61123 gvMenuOffAdded | 63644 lmRenderSubjectGrid | — | — | — | **keep** — ✕ off day · ✕ make-up (grid cell menu) |
| `lmRemoveSubj` | 62995 | 143 | 63007 lmDropSlot | 31066 ⟨renderCurriculumView dead branch⟩ · 31079 ⟨renderCurriculumView dead branch⟩ | — | 63008 | — | **keep** — ✕ off day, via lmDropSlot |
| `lmRestoreSubj` | 63013 | 132 | 60900 gvMenuRestore | 31089 ⟨renderCurriculumView dead branch⟩ · 63503 lmRenderSubjectView · 63681 lmRenderSubjectGrid | — | — | — | **keep** — ↩ put back |
| `lmAddSubj` | 63017 | 377 | 61130 gvMenuAddMakeup | 30984 ⟨renderCurriculumView dead branch⟩ · 31045 ⟨renderCurriculumView dead branch⟩ · 31102 ⟨renderCurriculumView dead branch⟩ · 63507 lmRenderSubjectView · 63526 lmRenderSubjectView | — | 46576 | test_rebuild_today_gaps | **keep** — ➕ make-up |
| `alignPlanPreview` | 63110 | 2429 | 61897 renderCurrGrid · 63165 alignPlanApply | 30933 ⟨renderCurriculumView dead branch⟩ | — | — | test_currtools, test_currwords, test_lanes_grid, test_lanes_nothing_drops | **keep** — the Align banner's count + preview |
| `alignPlanApply` | 63164 | 1615 | 61903 renderCurrGrid | 30941 ⟨renderCurriculumView dead branch⟩ | — | — | test_currtools | **keep** — Align weeks with calendar… |
| `lmWeekAnchor` | 63095 | 143 | 63101 lmWeekNumOfDate | 63106 lmWeekMonday | — | — | — | **keep** — Align, via lmWeekNumOfDate |
| `lmWeekNumOfDate` | 63100 | 178 | 63148 alignPlanPreview | — | — | — | — | **keep** — Align, via alignPlanPreview |
| `_lmKidOff` | 63349 | 141 | 60929 gvPickMoveTarget · 60936 gvPickMoveTarget | 60219 _gvAdjSchoolDate · 63356 lmCalDayChips · 63606 lmRenderSubjectGrid · 63612 lmRenderSubjectGrid | — | — | test_one_calendar | **keep** — ➡ move target check |
| `_normOrderArr` | 63034 | 209 | 47241 _orderDayMerged · 89411 gwBuildDayTasks | 31006 ⟨renderCurriculumView dead branch⟩ · 63061 lmDayRunOrder | — | — | test_cascade_offdays, test_cascade_sat_off, test_coop_start, test_day_goal, test_family_harness, test_fixed_class_retime, test_lesson_day_pin, test_master_pull, test_mom_not_today, test_nb_stays_put, test_practice_solo, test_relay_settings_calendar, test_relay_week, test_sweep_keeps_dailies, test_walkback_regen | **keep** — the generator reads a stored per-day order |
| `lmMovePick` | 63307 | state | 60183 gvOpenCell · 60910 gvMenuStartMove · 60913 gvCancelMove · 60923 gvPickMoveTarget · 60932 gvPickMoveTarget · 62000 renderCurrGrid · 62002 renderCurrGrid · 62003 renderCurrGrid · 62004 renderCurrGrid · 62172 renderCurrGrid · 62303 renderCurrGrid · 63010 lmDropSlot | 31037 ⟨renderCurriculumView dead branch⟩ · 31038 ⟨renderCurriculumView dead branch⟩ · 63311 lmSetView · 63384 lmSelSubj · 63387 lmEditSlotOpen · 63398 lmEditAddedOpen · 63422 lmOpenMove · 63431 lmMoveSlot · 63432 lmMoveSlot · 63445 lmMoveSlot · 63506 lmRenderSubjectView · 63510 lmRenderSubjectView · 63641 lmRenderSubjectGrid · 63689 lmRenderSubjectGrid | — | 60903 | test_currtools, test_currwords, test_lanes_grid, test_lanes_nothing_drops | **keep** — the grid's ➡ move is armed on it |
| `lmMoveWeek` | 63308 | state | 60910 gvMenuStartMove · 60913 gvCancelMove · 60932 gvPickMoveTarget | 63281 lmRenderMovePicker · 63285 lmRenderMovePicker · 63287 lmRenderMovePicker · 63311 lmSetView · 63384 lmSelSubj · 63387 lmEditSlotOpen · 63423 lmOpenMove · 63426 lmPickMoveWeek · 63445 lmMoveSlot | — | — | test_currtools, test_currwords, test_lanes_grid, test_lanes_nothing_drops | **keep** — cleared by the grid's move/cancel |
| `currViewKid` | 3282 | state | 30811 renderCurriculumView · 61643 renderCurrGrid | 29276 setCurrViewKid · 30828 ⟨renderCurriculumView dead branch⟩ · 58468 renderCurrBuilder | — | — | test_currtools, test_currwords, test_lanes_grid, test_lanes_nothing_drops | **keep** — the grid's first-kid fallback + plan bar |
| `ceRenderSessions` | 31250 | 9319 | 58813 kyPanelHTML | 30868 ⟨renderCurriculumView dead branch⟩ | — | 58773 | test_currtools, test_currwords, test_kidyear, test_lanes_grid, test_lanes_nothing_drops | **keep** — 📅 Kid's year ▸ School terms |
| `ceSessToggle` | 31249 | 80 | 31262 ceRenderSessions | — | — | — | test_kidyear | **keep** — School terms ▸ Edit / Done |
| `ceSetTargetEnd` | 35065 | 692 | 58809 kyPanelHTML | 30859 ⟨renderCurriculumView dead branch⟩ · 30860 ⟨renderCurriculumView dead branch⟩ | — | 46422 · 58771 | test_kidyear, test_relay_curriculum_doors | **keep** — Kid's year ▸ Finish the year by |
| `ceToggleMomVerifyKid` | 33935 | 260 | 58811 kyPanelHTML | 30875 ⟨renderCurriculumView dead branch⟩ | — | 58771 | test_kidyear | **keep** — Kid's year ▸ You approve check-offs |
| `downloadCurrTemplate` | 36992 | 3430 | 1603 <top level> | 30840 ⟨renderCurriculumView dead branch⟩ | 1× | — | test_xlsx_lazy | **keep** — static markup button (line 1603) |
| `lrpBuilderHTML` | 41643 | 615 | 34683 ceRenderEditSheet | — | — | 58580 | test_kidyear, test_lr_planner | **keep** — moved by KIDYEAR → card ▸ Links & supplies |
| `gvSelShiftUp` | 59094 | 608 | 61992 renderCurrGrid | — | — | — | test_currwords, test_kidyear | **keep** — moved by KIDYEAR → card Pace preview |
| `gvAuditFixGap` | 59821 | 2470 | 60015 gvAuditRender | — | — | 60011 | test_currwords, test_grid_audit, test_grid_audit_gapfix, test_kidyear | **keep** — moved by KIDYEAR → card Pace preview |
| `cbCopyTo` | 57380 | 2445 | 34816 ceRenderEditSheet | 58700 cbRenderForm | — | 46421 | test_currcard, test_kidyear, test_relay_curriculum_doors | **keep** — moved by KIDYEAR → lands on the copy's card |
| `setCurrInnerTab` | 55730 | 63 | 30795 renderCurriculumView | — | — | — | test_kidyear | **keep** — (added) the one-chip bar's handler — goes with the bar in 3b, not before |

### 3.2 KEEP, reserved for ADDFLOW — unreached today (5)

| Name | Def | Bytes | Live code / handler text / markup | Dead branch / GO body | Own body | Comments | Tests naming it | Verdict |
|---|---|---|---|---|---|---|---|---|
| `cbRenderForm` | 58558 | 12086 | — | 31147 _ceMaybeBuilder · 58491 renderCurrBuilder | — | 31127 · 41641 · 58710 | test_currcard, test_currwords, test_kidyear, test_lr_planner | **keep (reserved)** — ADDFLOW: the guided Add draws it (PLAN §3.7) |
| `cbSetMode` | 58451 | 71 | — | 58585 cbRenderForm | — | — | test_currcard | **keep (reserved)** — ADDFLOW form field |
| `cbSetField` | 58452 | 84 | — | 58591 cbRenderForm · 58606 cbRenderForm · 58615 cbRenderForm · 58650 cbRenderForm · 58652 cbRenderForm · 58654 cbRenderForm · 58658 cbRenderForm · 58661 cbRenderForm · 58669 cbRenderForm · 58672 cbRenderForm · 58680 cbRenderForm · 58682 cbRenderForm | — | — | test_currcard, test_pages_auto | **keep (reserved)** — ADDFLOW form field (incl. Start on) |
| `cbStepTpw` | 58453 | 110 | — | 58600 cbRenderForm | — | — | test_currcard | **keep (reserved)** — ADDFLOW form field |
| `cbToggleDay` | 58454 | 177 | — | 58594 cbRenderForm | — | — | test_currcard | **keep (reserved)** — ADDFLOW form field |

### 3.3 MOVE (2)

| Name | Def | Bytes | Live code / handler text / markup | Dead branch / GO body | Own body | Comments | Tests naming it | Verdict |
|---|---|---|---|---|---|---|---|---|
| `flExtendMakeupCount` | 64487 | 250 | 64500 flUndoExtend | 30887 ⟨renderCurriculumView dead branch⟩ | — | — | — | **move** — 55 leftover make-ups found (§6) — needs a live Clear door |
| `flUndoExtend` | 64498 | 1126 | — | 30891 ⟨renderCurriculumView dead branch⟩ | — | — | — | **move** — the only Clear make-ups button is in the dead branch |

### 3.4 GO — dead (68)

| Name | Def | Bytes | Live code / handler text / markup | Dead branch / GO body | Own body | Comments | Tests naming it | Verdict |
|---|---|---|---|---|---|---|---|---|
| `setCurrViewKid` | 29276 | 76 | — | 30838 ⟨renderCurriculumView dead branch⟩ | — | — | — | **go** — Subjects branch |
| `setCurrViewWeek` | 29277 | 81 | — | 30958 ⟨renderCurriculumView dead branch⟩ | — | — | — | **go** — Subjects branch |
| `ceOpenBuild` | 31129 | 265 | — | 31158 ceBuildCard · 58571 cbRenderForm | — | — | test_currcard | **go** — Subjects-page card |
| `_ceMaybeBuilder` | 31135 | 1111 | — | 30911 ⟨renderCurriculumView dead branch⟩ · 30919 ⟨renderCurriculumView dead branch⟩ | — | — | test_currcard | **go** — Subjects-page card |
| `ceBuildCard` | 31151 | 6289 | — | 30911 ⟨renderCurriculumView dead branch⟩ · 30919 ⟨renderCurriculumView dead branch⟩ | — | — | test_currwords | **go** — Subjects-page card |
| `lmToggleDayOff` | 62991 | 114 | — | 31024 ⟨renderCurriculumView dead branch⟩ | — | — | — | **go** — Lesson Map UI |
| `lmOpenAdd` | 63026 | 118 | — | 31106 ⟨renderCurriculumView dead branch⟩ | — | — | — | **go** — Lesson Map UI |
| `lmLessonByDate` | 63040 | 207 | — | 63051 lmDayRunOrder | — | — | — | **go** — Lesson Map UI |
| `lmDayRunOrder` | 63050 | 1243 | — | 31029 ⟨renderCurriculumView dead branch⟩ · 63077 lmNudgeSubj | — | — | — | **go** — Lesson Map UI |
| `lmNudgeSubj` | 63076 | 253 | — | 31033 ⟨renderCurriculumView dead branch⟩ · 31034 ⟨renderCurriculumView dead branch⟩ | — | — | — | **go** — Lesson Map UI |
| `lmResetOrder` | 63084 | 108 | — | 31022 ⟨renderCurriculumView dead branch⟩ | — | — | — | **go** — Lesson Map UI |
| `lmWeekMonday` | 63105 | 140 | — | 63202 lmRenderOffWeek | — | — | — | **go** — Lesson Map UI |
| `lmRenderOffWeek` | 63201 | 1738 | — | 31113 ⟨renderCurriculumView dead branch⟩ | — | — | — | **go** — Lesson Map UI |
| `lmSchedCheckState` | 63235 | 1519 | — | 31060 ⟨renderCurriculumView dead branch⟩ · 63499 lmRenderSubjectView | 4× | — | — | **go** — Lesson Map UI |
| `lmRenderMovePicker` | 63271 | 2135 | — | 31038 ⟨renderCurriculumView dead branch⟩ · 63510 lmRenderSubjectView · 63689 lmRenderSubjectGrid | — | — | — | **go** — Lesson Map UI |
| `lmSetView` | 63311 | 102 | — | — | — | — | — | **go** — Lesson Map UI |
| `lmCalData` | 63317 | 867 | — | — | — | 63314 | test_one_calendar | **go** — Lesson Map UI |
| `_lmWeekMon` | 63338 | 411 | — | 63600 lmRenderSubjectGrid | — | — | — | **go** — Lesson Map UI |
| `lmCalDayChips` | 63353 | 1016 | — | — | — | — | test_one_calendar | **go** — Lesson Map UI |
| `_lmDayKind` | 63378 | 423 | — | — | — | — | test_cleaning_day, test_one_calendar | **go** — Lesson Map UI |
| `lmSelSubj` | 63384 | 103 | — | 63454 lmRenderSubjectView · 63584 lmRenderSubjectGrid · 63585 lmRenderSubjectGrid · 63624 lmRenderSubjectGrid | — | — | — | **go** — Lesson Map UI |
| `lmEditSlotOpen` | 63385 | 234 | — | 63505 lmRenderSubjectView · 63655 lmRenderSubjectGrid | — | — | — | **go** — Lesson Map UI |
| `lmEditSlotCancel` | 63391 | 60 | — | 63488 lmRenderSubjectView · 63490 lmRenderSubjectView · 63648 lmRenderSubjectGrid · 63652 lmRenderSubjectGrid · 63664 lmRenderSubjectGrid | — | — | — | **go** — Lesson Map UI |
| `lmEditAddedOpen` | 63397 | 223 | — | 63667 lmRenderSubjectGrid | — | — | — | **go** — Lesson Map UI |
| `lmSaveAddedText` | 63401 | 198 | — | 63664 lmRenderSubjectGrid · 63665 lmRenderSubjectGrid | — | — | — | **go** — Lesson Map UI |
| `lmSaveSlotText` | 63406 | 888 | — | 63488 lmRenderSubjectView · 63489 lmRenderSubjectView · 63652 lmRenderSubjectGrid · 63653 lmRenderSubjectGrid | — | 46420 | test_relay_curriculum_doors | **go** — Lesson Map UI |
| `lmOpenMove` | 63421 | 183 | — | 31037 ⟨renderCurriculumView dead branch⟩ · 63506 lmRenderSubjectView · 63643 lmRenderSubjectGrid | — | — | — | **go** — Lesson Map UI |
| `lmPickMoveWeek` | 63426 | 58 | — | 63282 lmRenderMovePicker | — | — | — | **go** — Lesson Map UI |
| `lmMoveSlot` | 63430 | 621 | — | 63294 lmRenderMovePicker | — | 60903 · 63561 | — | **go** — Lesson Map UI |
| `lmRenderSubjectView` | 63448 | 7259 | — | — | — | — | — | **go** — Lesson Map UI |
| `_lmSnapMove` | 63537 | 247 | — | 63434 lmMoveSlot · 63564 lmMoveDay | — | — | — | **go** — Lesson Map UI |
| `_lmRestoreOverride` | 63541 | 328 | — | 63548 lmUndoMove · 63549 lmUndoMove | — | — | — | **go** — Lesson Map UI |
| `_lmLessonEntry` | 63554 | 166 | — | 63558 _lmMovingVal | — | — | — | **go** — Lesson Map UI |
| `_lmMovingVal` | 63555 | 286 | — | 63435 lmMoveSlot · 63565 lmMoveDay | — | — | — | **go** — Lesson Map UI |
| `lmMoveDay` | 63562 | 506 | — | 60230 gvMenuMove · 63638 lmRenderSubjectGrid · 63639 lmRenderSubjectGrid | — | — | — | **go** — Lesson Map UI |
| `lmSubjJumpWk` | 63570 | 54 | — | 63697 lmRenderSubjectGrid | — | — | — | **go** — Lesson Map UI |
| `lmSubjStepWk` | 63571 | 102 | — | 63691 lmRenderSubjectGrid · 63700 lmRenderSubjectGrid | — | — | — | **go** — Lesson Map UI |
| `lmRenderSubjectGrid` | 63575 | 13943 | — | 30945 ⟨renderCurriculumView dead branch⟩ | — | — | — | **go** — Lesson Map UI |
| `lmComputeSuggestions` | 63708 | 2841 | — | 30975 ⟨renderCurriculumView dead branch⟩ | — | — | test_coop_week_days | **go** — Lesson Map UI |
| `gvMenuMove` | 60224 | 429 | — | — | — | — | — | **go** — ◀▶ move + Undo |
| `lmUndoMove` | 63546 | 225 | — | 62011 ⟨renderCurrGrid dead branch⟩ · 63594 lmRenderSubjectGrid | — | — | — | **go** — ◀▶ move + Undo |
| `renderCurrBuilder` | 58460 | 5298 | — | 30803 ⟨renderCurriculumView dead branch⟩ | — | 58780 | test_currcard, test_currwords, test_kidyear, test_rules_scroll | **go** — Builder tab |
| `cbSetKid` | 58412 | 93 | — | 58476 renderCurrBuilder | — | — | test_kidyear, test_relay_curriculum_doors | **go** — Builder tab |
| `cbSummaryToggle` | 57416 | 72 | — | 58494 renderCurrBuilder | — | — | — | **go** — Builder tab |
| `cbRenderSummary` | 57419 | 3196 | — | 58495 renderCurrBuilder | — | — | test_currwords | **go** — Builder tab |
| `cbCloseSubj` | 58450 | 86 | — | 58575 cbRenderForm | — | — | — | **go** — Builder tab |
| `cbOpenSubj` | 58413 | 104 | — | 57459 cbRenderSummary · 58448 cbJumpTo · 58511 renderCurrBuilder · 61200 gvJumpBuilder | — | — | test_grid_audit_gapfix, test_kidyear, test_relay_curriculum_doors | **go** — Builder tab |
| `cbJumpTo` | 58445 | 141 | — | — | — | 30782 | test_kidyear | **go** — Builder tab |
| `gvJumpBuilder` | 61200 | 82 | — | — | — | — | test_kidyear | **go** — Builder tab |
| `cbFamilyRulesToggle` | 57059 | 84 | — | — | — | — | — | **go** — Builder tab |
| `renderFinishLine` | 64452 | 2799 | — | — | — | 30864 | — | **go** — Finish Line Extend |
| `flExtendSubject` | 64390 | 3043 | — | 64477 renderFinishLine | — | — | — | **go** — Finish Line Extend |
| `cbFamilyRulesOpen` | 57056 | state | — | 57059 cbFamilyRulesToggle | — | — | test_currcard, test_kidyear, test_lanes_door, test_rules_panel | **go** — Builder tab |
| `currViewWeek` | 3283 | state | — | 29276 setCurrViewKid · 29277 setCurrViewWeek · 30957 ⟨renderCurriculumView dead branch⟩ · 30963 ⟨renderCurriculumView dead branch⟩ · 30964 ⟨renderCurriculumView dead branch⟩ · 30974 ⟨renderCurriculumView dead branch⟩ · 30975 ⟨renderCurriculumView dead branch⟩ · 31111 ⟨renderCurriculumView dead branch⟩ · 31112 ⟨renderCurriculumView dead branch⟩ | — | — | — | **go** — Subjects branch |
| `lmViewMode` | 63304 | state | — | 30944 ⟨renderCurriculumView dead branch⟩ · 63311 lmSetView | — | — | — | **go** — Lesson Map UI |
| `lmEditSlot` | 63310 | state | 63010 lmDropSlot | 63311 lmSetView · 63384 lmSelSubj · 63386 lmEditSlotOpen · 63391 lmEditSlotCancel · 63398 lmEditAddedOpen · 63404 lmSaveAddedText · 63409 lmSaveSlotText · 63418 lmSaveSlotText · 63487 lmRenderSubjectView · 63651 lmRenderSubjectGrid · 63663 lmRenderSubjectGrid | — | — | test_relay_curriculum_doors | **go** — Lesson Map UI |
| `lmAddOpen` | 62990 | state | 63022 lmAddSubj | 31093 ⟨renderCurriculumView dead branch⟩ · 31106 ⟨renderCurriculumView dead branch⟩ · 63028 lmOpenAdd | — | — | — | **go** — Lesson Map UI |
| `lmSubjKey` | 63305 | state | — | 63384 lmSelSubj · 63450 lmRenderSubjectView · 63453 lmRenderSubjectView · 63457 lmRenderSubjectView · 63458 lmRenderSubjectView · 63577 lmRenderSubjectGrid · 63578 lmRenderSubjectGrid · 63585 lmRenderSubjectGrid · 63589 lmRenderSubjectGrid · 63590 lmRenderSubjectGrid | — | — | — | **go** — Lesson Map UI |
| `lmSubjWk` | 63306 | state | — | 63570 lmSubjJumpWk · 63571 lmSubjStepWk · 63599 lmRenderSubjectGrid | — | — | — | **go** — Lesson Map UI |
| `lmLastMove` | 63309 | state | — | 62007 ⟨renderCurrGrid dead branch⟩ · 62008 ⟨renderCurrGrid dead branch⟩ · 63539 _lmSnapMove · 63547 lmUndoMove · 63550 lmUndoMove · 63591 lmRenderSubjectGrid · 63592 lmRenderSubjectGrid | — | — | test_currtools, test_currwords, test_lanes_grid, test_lanes_nothing_drops | **go** — ◀▶ move + Undo |
| `ceWorkflowTier` | 29281 | 1059 | — | 30901 ⟨renderCurriculumView dead branch⟩ | — | 30898 · 84327 | test_wf_editor | **go** — **closure** (not on the plan's list) |
| `ceSessionGoal` | 33742 | 623 | — | 31229 ceBuildCard | — | — | — | **go** — **closure** (not on the plan's list) |
| `ceQuickPause` | 35109 | 1599 | — | 31159 ceBuildCard | — | 38825 | test_relay_curriculum, test_rmx_derive, test_rmx_link, test_rmx_settings | **go** — **closure** (not on the plan's list) |
| `paceStatusLabel` | 55700 | 125 | — | 31198 ceBuildCard | — | — | — | **go** — **closure** (not on the plan's list) |
| `cbPacingLabel` | 57645 | 496 | — | 57461 cbRenderSummary · 58509 renderCurrBuilder | — | — | test_currcard, test_kidyear | **go** — **closure** (not on the plan's list) |
| `_gvAdjSchoolDate` | 60209 | 493 | — | 60227 gvMenuMove | — | — | — | **go** — **closure** (not on the plan's list) |
| `_ceFinishMap` | 33769 | state | — | 30883 ⟨renderCurriculumView dead branch⟩ · 31205 ceBuildCard | — | — | — | **go** — **closure** (not on the plan's list) |
| `cbSummaryOpen` | 57415 | state | — | 57416 cbSummaryToggle · 58494 renderCurrBuilder · 58495 renderCurrBuilder | — | — | — | **go** — **closure** (not on the plan's list) |

## 4 · State variables — which live code reads them

| Variable | Live readers / writers today | Verdict |
|---|---|---|
| `lmMovePick` | `gvOpenCell` 60183 (a tap picks the target while armed), `gvMenuStartMove` 60910 (sets), `gvCancelMove` 60913, `gvPickMoveTarget` 60923–60936, the Parking banner + row class in `renderCurrGrid` | **keep** |
| `lmMoveWeek` | cleared by `gvMenuStartMove` 60910, `gvCancelMove` 60913, `gvPickMoveTarget` 60932 (only GO code reads it) | **keep** (3b may drop the three clears later; harmless) |
| `currViewKid` | `renderCurriculumView` 30811 (plan bar fallback), `renderCurrGrid` 61643 | **keep** |
| `lmEditSlot` | **one live write**: `lmDropSlot` 63010 `lmEditSlot=null`. Set non-null only by `lmEditSlotOpen` / `lmEditAddedOpen` (GO) | **go** — re-point site 1 |
| `lmAddOpen` | **one live write**: `lmAddSubj` 63022 `lmAddOpen=null`. Set non-null only by `lmOpenAdd` (GO) | **go** — re-point site 2 |
| `lmLastMove` | read only by the dead banner in `renderCurrGrid` 62007; set only by `_lmSnapMove` (GO) | **go** — re-point site 3 (the banner) |
| `currViewWeek`, `lmViewMode`, `lmSubjKey`, `lmSubjWk`, `cbFamilyRulesOpen`, `_ceFinishMap`, `cbSummaryOpen` | none — every read and write is in GO code or the dead Subjects branch | **go** |
| `ceBuildOpen` (not on the plan's list) | **written** live by `ceAddSave` 36721; **read** only by `_ceMaybeBuilder` (GO) | not ruled on: it belongs to ADDFLOW (§11 note) |
| `scheduleOverrides/<date>/<kid>/order` (data, read by `_normOrderArr`) | The generator reads it (`_orderDayMerged` 47241, `gwBuildDayTasks` 89411 → `_normOrderArr`). Its only writers, `lmNudgeSubj` / `lmResetOrder`, are GO. **Live data has 0 stored orders** (§6), so nothing changes for any day. | reader **keep**, writers **go** |

## 5 · Tests that name a GO name — stub only, or a real assertion

| Test | GO names | How | 3b must |
|---|---|---|---|
| `test_currtools`, `test_lanes_grid`, `test_lanes_nothing_drops`, `test_currwords` (L94) | `lmLastMove` | a `null` field on the stub world | nothing (stale field, harmless) |
| `test_lanes_door`, `test_rules_panel`, `test_currcard` L110 | `cbFamilyRulesOpen` | stub field | nothing |
| `test_kidyear` L348, `test_relay_curriculum_doors` L200 | `cbSetKid`, `cbOpenSubj` | stub functions that record "BUILDER" if called | nothing |
| `test_grid_audit_gapfix` L43 | `cbOpenSubj` | a comment | nothing |
| `test_rmx_derive`, `test_rmx_link`, `test_rmx_settings` | `ceQuickPause` | "never called" stubs and absence checks | nothing |
| `test_currcard` L207–217, L223–237 | `ceOpenBuild`, `cbSetMode`… | the OLD card's handler fixtures (from main 6a36a97) and their mapping | nothing |
| `test_currcard` L253 | `renderCurrBuilder`, `cbRenderForm` | **asserts** `renderCurrBuilder` draws `cbRenderForm(col)` | re-point to ADDFLOW's form (or drop) |
| `test_currcard` L400 | `renderCurrBuilder` | slices `ceOpenEdit(` … `renderCurrBuilder(` as "the card region" | pick a new end marker |
| `test_currcard` L64, `test_kidyear` renderCard | `cbPacingLabel` | sliced only if present (`if (f)`) | nothing |
| `test_currwords` L229–258 | `ceBuildCard`, `cbRenderSummary`, `renderCurrBuilder` | **asserts** every name in `PAGE_FNS` exists | drop them from `PAGE_FNS` |
| `test_kidyear` L273–282 | `cbJumpTo`, `gvJumpBuilder`, `renderCurrBuilder`, `cbOpenSubj` | **asserts** the Builder-tab openers are exactly `[cbJumpTo, gvJumpBuilder, momHQGo, renderCurriculumView]` and that `renderCurrBuilder` "is still defined (it goes in slice 3b)" | flip to "none remain" |
| `test_rules_scroll` L85–86 | `renderCurrBuilder` | **asserts** it restores the Rules scroll | drop that check |
| `test_relay_curriculum_doors` L43, L179–182 | `lmSaveSlotText`, `lmEditSlot` | **replays** `lmSaveSlotText` as a re-lay door | drop it from `DOORS` |
| `test_relay_curriculum` L36, L248–255 | `ceQuickPause` | **asserts** quick pause sends a daily through the door, and replays it | keep the `ceTogglePause` half (the card's live ⏸, same writes) |
| `test_coop_week_days` L212 | `lmComputeSuggestions` | **asserts** its body asks `subjDaysFor` per week | drop the check — its other half (`subjDaysFor(kid,s,range.start)`, 64428) is in `flExtendSubject`, also GO |
| `test_one_calendar` L40, L178 | `lmCalData`, `lmCalDayChips`, `_lmDayKind` | sliced into its world; L178 **asserts they "stay"** (written when the Breaks page retired) | drop the three from the "stay" list |
| `test_cleaning_day` L28 | `_lmDayKind` | **asserts** its source has no cleaning reference | drop that half |
| `test_wf_editor` L203 | `ceWorkflowTier` | **asserts** `index.html` contains `wfMatch(subs[j],sk,disp)` — that text exists only in `ceWorkflowTier` (29287) | point it at `gwWorkflowRank`'s call or drop |

No test pins a KEEP body in a way 3b would break.

## 6 · The data check — leftover Extend make-ups (read-only)

One `GET` of `scheduleOverrides` and one of `curriculum/lessons` (token from `~/.howe/fbtoken.js`, 2026-11-21 12:30 ET).
No writes. Counts only:

- `scheduleOverrides`: 22 dates (2026-07-20 → 2027-10-08).
- **`added[sk] === true` entries — what `flExtendMakeupCount` counts: 55.** All for **one kid (Lincoln)**, 8 subjects, on 15
  school days **2027-09-20 → 2027-10-08** (Mon–Fri × 3 weeks, 3 of each weekday); 0 in the past.
- Moved-in make-ups (string value): 1. `removed`: 6. `order`: **0**. `dayOff`: **0**.

Reading: a dense Mon–Fri block 10 months out, 8 subjects at once, is the shape `flExtendSubject` writes (it appends after
the kid's last planned week); hand ➕ make-ups land near today. **But the value is the same `true` the live ➕ make-up
writes**, so the count can't tell them apart — and `flUndoExtend` would also strip any ➕ make-up a future day carries.
Today every `true` entry is in that one block, so a Clear now would remove exactly these 55. Lincoln's lessons now run to
2028-03-31, so in September 2027 these would add up to 55 extra make-up sittings on top of his plan.

So `flExtendMakeupCount` / `flUndoExtend` are **move**, not go: before 3b, she either clears them from a live door or says
"leave them" (each one also shows on the grid in Sept 2027 as a make-up cell with **✕ make-up** — 55 taps).

## 7 · Where this differs from the plan's pre-audit (§4.3)

1. **`ceWorkflowTier` → go** (plan: keep). Its only caller is the dead Subjects branch (30901); the "Settings matcher"
   reference is a comment (84327, inside WFEDIT). The generator ranks with `gwWorkflowRank`, untouched.
2. **8 names added by the closure** (all go): `ceWorkflowTier`, `ceSessionGoal` 33742, `ceQuickPause` 35109,
   `paceStatusLabel` 55700 (all only from `ceBuildCard` / the Subjects branch); `cbPacingLabel` 57645 (only `cbRenderSummary` /
   `renderCurrBuilder`); `_gvAdjSchoolDate` 60209 (only `gvMenuMove`); state `_ceFinishMap` 33769, `cbSummaryOpen` 57415.
   `ceQuickPause`'s writes are the same as the live card's ⏸ toggle (`ceTogglePause` 35087, drawn at 34210).
3. **5 names the closure also reached are kept, reserved for ADDFLOW**: `cbRenderForm` 58558, `cbSetMode` 58451,
   `cbSetField` 58452, `cbStepTpw` 58453, `cbToggleDay` 58454. PLAN §3.7: "steps 2–4 are `cbRenderForm`'s fields re-chunked".
   Two of `cbRenderForm`'s own header buttons name GO functions (`ceOpenBuild` × at 58571, `cbCloseSubj` ‹ Back at 58575);
   whichever of ADDFLOW / 3b lands second must not leave those drawn.
4. **The finish-line pair is move, not go** — §6.
5. **The plan's three "move first" doors are done** (KIDYEAR, merged): `lrpBuilderHTML` is drawn by `ceRenderEditSheet`
   34683 (Links & supplies); `gvSelShiftUp` (drawn 61992) and `gvAuditFixGap` (drawn by `gvAuditRender` 60015) no longer
   touch `cbOpenSubj` / `cbSetKid` / `currInnerTab` and go through `kyPaceDoor`; `cbCopyTo` (drawn 34816) lands through
   `kyCopyLand`. The vm ran both new doors with every GO function tripwired — none fired. So they are **keep** now.
6. Already orphaned before this list (0 references besides the definition): `lmSetView`, `lmRenderSubjectView`, `lmCalData`,
   `lmCalDayChips`, `_lmDayKind`, `gvMenuMove`, `cbJumpTo`, `gvJumpBuilder`, `cbFamilyRulesToggle`, `renderFinishLine`.
7. `setCurrInnerTab` added as **keep** — the one-chip bar calls it; 3b drops both together (§8).

## 8 · What 3b must re-point (live code that names a GO name today)

The plan's "three live callers" were the three moved doors — KIDYEAR already re-pointed them (§7.5). What still names a GO
name from live code today is exactly three sites (the harness pins this list):

1. `lmDropSlot` 63010 — delete `lmEditSlot=null` (keep `lmMovePick=null`). The body is otherwise byte-identical.
2. `lmAddSubj` 63022 — delete `lmAddOpen=null`.
3. `renderCurrGrid` 62007–62012 — delete the "Moved … ↩ Undo" banner (§9).

Plus the plan's own 3b items, which name no GO function but go with them: the router's `case "builder"` (7265, and
`"builder"` in the `momHQGo` include-list at 7257); `case "curriculum": currInnerTab="subjects"` → `"grid"` (7264); the
`"plans"||"subjects"` rewrite (30785) and the one-chip bar `_cvBar` + `setCurrInnerTab` (30788–30798, 55730); the HQ
comment rows 8927–8928.

## 9 · The one decision — the "Moved … ↩ Undo" banner (renderCurrGrid 62007)

It shows only when `lmLastMove` is set, and only `_lmSnapMove` sets it — called by the ◀▶ day-move (`lmMoveDay`, whose
only caller `gvMenuMove` is never drawn) and the old Move picker (`lmMoveSlot`). Nobody can make that move today, so the
banner can never appear. The grid's own ➡ move parks through `scheduleOverrides` + `cbApply` and has its own Undo.
**Recommendation: go** (with `lmMoveDay`, `lmMoveSlot`, `lmUndoMove`, `_lmSnapMove`, `_lmRestoreOverride`). Keeping it would
mean building a second move just to give it a trigger.

## 10 · Nothing else changed

`git diff origin/main --stat` on this branch: the two new files only. Whole `test_*.js` suite run once on this branch:
see the result line below.

**888 test files, 884 pass; 4 fail — exactly the four already failing on main today**: `test_kidyear` (its drift check: ref() path patterns vs main 59b0b15), `test_missplay_meaning`, `test_study_nowone`, `test_sunday_catchup`. None reads the new files.

## 11 · Questions for Adrienne (each with my default)

1. **The 55 old make-ups on Lincoln's Sept 20 – Oct 8, 2027.** Default: before 3b, add a one-time "Clear the 55 old
   make-ups" row in 📅 Lincoln's year that shows only while there are any, and you tap it (it removes `added:true`
   entries — today exactly those 55). Other choices: leave them and ✕ them on the grid next September, or leave them on purpose.
2. **The ↩ Undo banner for a move nobody can make** — default: remove it with the move (§9).
3. **`ceQuickPause` / the quick ⏸ on the old Subjects cards** — default: remove; the card's own ⏸ toggle does the same thing.

**Note for the hub (not a question for her):** on main today, ➕ Add of a sequenced subject sets `ceBuildOpen`, opens the
card and toasts "now pace and build it below" — but since CURRCARD the card no longer draws the Builder form, so nothing
appears below. ADDFLOW (§3.7) is the fix; `ceBuildOpen` should go with it.
