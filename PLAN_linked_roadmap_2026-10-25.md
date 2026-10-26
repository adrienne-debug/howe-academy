# PLAN — linked roadmap ("Curriculum heads-up"), built in small steps (2026-10-25)

**From:** `DESIGN_linked_roadmap_2026-10-24.md` (main checkout) + Adrienne's answers in its §10.
**Branch:** `fable/linked-roadmap` (worktree `~/Desktop/howe-academy/.claude/worktrees/linked-roadmap`, from `origin/main` 090073c). No pushes to `main`,
no live database writes, one step per PR, her yes before each step. Marker names re-checked against this
checkout on 2026-10-25 (`ROADMAP_START` :26383, `lnOpenCount` :45159, `gvDerivedColumn` :47155, `gvEndInfo` :48348,
`famLessonMap` :34465, `LANE_HANDOFF_START` :48996, `_hhRulesWrite` :13367, `config/rules` listener :4434,
Mom's Day card insert :17856). Line numbers drift; markers don't.

## Her decisions, locked in (§10)
| Setting | Starting value | Where it lands in code |
|---|---|---|
| Warn ahead | **3 weeks** (`warnWeeks: 3`) | amber when the list's last projected day ≤ today + 21 |
| Red | **5 lessons left** (`redLeft: 5`) **or** the last week (`redDays: 7`) | red when left ≤ 5 or last day ≤ today + 7 |
| Finished book, nothing after it | **stays red** until she adds lessons, queues the next book, or pauses it | the `empty` item has no fade; no `emptyDays` setting |
| Timing editable | **⚙ on the Mom's Day card** (Mom only) | step 4 |
| Math Reasoning E | Ellis IS on MR E → the auto-done of that row is correct | no code; confirms the `swap` rule |

All other defaults as the design's §3.7: `warnLeft 0`, `endWeeks 2`, `endOnDay false`, all kinds on, `family true`,
`noteDays 0`, `autoDone true`.

## Steps (one PR each; smallest first)

| # | Step | On screen | Writes | Test |
|---|---|---|---|---|
| **1** | **Automatic items in the Mom HQ strip** — `RMX_START…RMX_END` block beside ROADMAP: `RMX_DEFAULTS`, `rmxCfg(kid,sk)` (reads `rulesData.headsUp`; no node exists yet → defaults), `rmxDerive(kid)` for plain subjects and lanes (runout / empty / handoff / nolist), memo, and a "From the curriculum" group at the top of `rmStripHTML`. | Mom HQ ▸ Curriculum, each kid's 📅 Roadmap strip only. Mom's Day untouched. | **none** | `test_rmx_derive.js` |
| 2 | **Fixed-date subjects + 🏡 Family time** join the derive — `fixedDates` ("1 left · no class dates left"), `famDefs()`/`famLessonMap` items with a `track` as "🏡 Family" rows. | same strip (+ a 🏡 Family group) | none | extend `test_rmx_derive.js` |
| 3 | **Mom's Day card** — `rmWeekHTML` becomes "📅 Curriculum heads-up": 🔴/🟠 automatic rows per kid join her overdue/this-week rows; `handoff` stays strip-only; tapping a row opens the subject card (`ceOpenEdit`); `planBarHTML` counts red items in "overdue". Measure render time (budget < 5 ms). | Mom's Day card, same spot | none | Mom's Day cases in `test_rmx_derive.js`; title string in `test_roadmap.js` |
| 4 | **⚙ settings** — panel under the card header (Mom only), slim "all clear · ⚙" line when empty in Mom mode, per-kid rows, per-subject ↺; strip rows get "⋯ → Mute / Warn earlier-later". Writes `config/rules/headsUp/<field>`, `…/kid/<kid>/<field>`, `…/subj/<kid>/<sk>/<field>`, one field per tap, clamped, `momHere()` + dry-run guarded (copy `_hhRulesWrite`). | Mom's Day card header; strip rows | **first step that writes** — one targeted `set`/`remove` per tap under `config/rules/headsUp` only | `test_rmx_settings.js` |
| 5 | **Status chips on her existing rows** — a typed row with a `subject` shows "Word Roots · 14 left · ~Nov 25" / "paused" / "list empty" (read from step 1's derive). No link yet. | strip + Mom's Day rows | none | extend `test_rmx_derive.js` |
| 6a | **Links: dates** — `link {sk, when, lid, n, match}` + `keepOpen` carried through `rmSave`'s `rec`; form gets "Shows up…" (On the date / When ‹subject› is running out / When a lesson is done) + "New subject's name contains…"; `when:"ends"` row replaces that subject's automatic row (one row per subject); `when:"lesson"` dated by the projection, due on the done day. | strip form + both lists | her Save (`set` of one item, as today) now carries `link` | `test_rmx_link.js` |
| 6b | **Links: auto-done** — `rmxAuto(kid,r)` → `{met, why}` per kind (append / pause / add / swap; edit & note never); "✓ auto · why" display; untick → `update {keepOpen:true}`; re-tick → `{done, keepOpen:null}`; honours `autoDone`. | both lists | one `update` on her untick/tick (as today's `rmDone`) | extend `test_rmx_link.js` |
| 7 | *(only if she asks)* calendar day sheet by effective date; 📅 count on 🧒 Kids today. | | | |

After each "push": the usual DeWalt cherry-pick (no family-specific code anywhere — labels from `cap(kid)`, `s.display`).

## Guardrails that hold for every step
- Automatic items are computed on draw, **never stored**. Never call `cbRemainingContent` (writes `cbBacklogStash`),
  never wire a row to `ceQuickPause` (no dry-run check). Rows navigate only.
- Full suite green before each PR: `for f in test_*.js; do node "$f" >/dev/null 2>&1 || echo "FAIL $f"; done`
  (512 tests today; no known failures).
- Every write (steps 4, 6) is one targeted `set`/`update`/`remove`, Mom/Admin code required, inert under `?dryrun=1`.
- Nothing on kids' tablets, notebooks, or the Grid. No new nags.

## Step 1 in detail (what I'd build on a yes)

**What she sees.** In Mom HQ ▸ Curriculum, when a kid's plan is open, the 📅 Roadmap strip gets a short group
above her typed rows, headed "From the curriculum", with rows like:
- 🔴 `Reading Detective runs out · 1 left · Mon Oct 26`
- 🟠 `HWT Printing Power runs out · 4 left · ~Nov 5`
- 🔴 `Reading Eggspress list is empty — nothing on Ellis's schedule for it since Oct 14` (date = last done record's `day`)
- ⚪ `Daily Geography ends ~Wed Oct 28 → Skill Sharpeners Geography 4 takes over` (FYI; LANE_HANDOFF does the swap)
- 🔴 `<subject> has no lessons yet` (not tracking-only, not paused, empty list — none exist at Howe today)

A kid with nothing to say shows no group (strip looks exactly as today). Tapping a row opens that subject's
card in the Builder (`ceOpenEdit(kid,sk)`) — navigation only. The strip header counts are unchanged in step 1.

**Rules (design §3.1 with her §10 numbers).** Walk the kid's slots: each lane (`lnUp` picks the up unit) and
each subject in no lane. Skip: `tracking:"daily"`, paused, unstamped (`!lidStamped`), a lane member waiting its
turn, a multiple card while any letter still has lessons. Lessons left = `lnOpenCount` when plan-backed, else
`lessonSeq.length − lidDoneIdx.size`. Candidates only (left ≤ max(redLeft, warnLeft, per-week × max(warnWeeks,
endWeeks)) + 3, or 0) get a date: latest `gvFilled` entry in `gvDerivedColumn(kid,sk).byDate` (dealt cards
included, so `{err}` still answers); fallback estimate walks allowed days at `lnRhythm`/`cbDefaultForm` pace, shown
with "~". runout = up unit open, nothing later in the slot open, and (left ≤ 5 or last day ≤ today+7 → red; else
last day ≤ today+21 → amber). empty = listed, 0 open, nothing later open → red, stays red. handoff = up unit ends
within 14 days and a later unit has open lessons → grey FYI. Thresholds come from `rmxCfg(kid,sk)`, which merges
`RMX_DEFAULTS` ← `rulesData.headsUp` ← `.kid[kid]` ← `.subj[kid][sk]` — with no node yet, that is exactly the
defaults, so step 4 later needs no change here.

**Not in step 1:** fixed-date subjects and 🏡 Family (step 2), Mom's Day (step 3), any setting UI or write (step 4),
anything on her typed rows (steps 5–6).

**Writes:** none. **Reads:** `currData.subjects/done/lanes`, `rulesData.headsUp` (absent today).

**Performance:** cheap count pass over every listed subject (Set walks), `gvDerivedColumn` only for candidates
(3–5 subjects across all kids today), memoised per kid on `gvEndInfo`'s key (today + `currData.lastEdit` +
check-off count, 20 s) + `JSON.stringify(rulesData.headsUp||null)`.

**`test_rmx_derive.js`** (slices `RMX_START…RMX_END` like `test_roadmap.js`, stubs `gvDerivedColumn`, `lnOpenCount`
etc.): runout amber/red by lessons and by date (5 left → red; 6 left, 20 days out → amber; 6 left, 30 days → nothing);
empty red with the last done day, paused → nothing; lane handoff FYI vs runout when the later unit is at 0 or
retired; AB card one letter 0 → nothing, both 0 → empty; waiting / paused / daily / unstamped → nothing;
stamped-not-plan-backed → counted from `lidDoneIdx` with a "~" date and `cbRemainingContent` never called (stub
throws); `{err}` → latest dealt date; memo (second call doesn't re-run the projection); `rmxCfg` with no node ===
`RMX_DEFAULTS` (warnWeeks 3, redLeft 5, redDays 7); the block contains no kid names or Howe subject keys; `rmStripHTML`
with no items is byte-identical to today's output; **zero writes** across derive + render.

**How she checks it:** after her "push", open Mom HQ ▸ Curriculum and compare the rows against the books. Expected
today (from the design's read-only proof): Ellis — Reading Detective 🔴 (1 left, Mon), HWT Printing Power 🟠 (4 left,
~Nov 5), Daily Geography ⚪ FYI; Lincoln — nothing yet in step 1 (Voice Lessons is a fixed-date subject → step 2);
Lucy, Julian — nothing.

**Size:** ~120 lines in `index.html` (one new block + ~6 lines in `rmStripHTML`), one new test file.

---

## Step 1 — shipped as PR #137 (2026-10-25, not merged yet)
Commit 0220e4f on `fable/linked-roadmap`. `test_rmx_derive.js` (76), suite green.
**Correction to what I told her:** a fixed-date class with lessons left is counted like any other list in step 1, so
Lincoln's Outschool Voice Lessons (1 left, all four class dates past) will most likely show as a 🔴 runout with a
"~" estimated date walked over its allowed weekday — misleading. Step 2 replaces that with the honest wording.

## Step 2 in detail — fixed-date classes + 🏡 Family time (describe → her yes → build)

**A. Fixed-date classes** (`fxIsClass(s)` = has `fixedTime`; `fxDateList(s)` = its real `fixedDates`, authoritative).
- Never estimate for one: a class meets on its dates, not on a pace. `_rmxUnitEnd` takes a fixed-date branch first.
- Upcoming dates = `fixedDates ≥ today`. With `left` lessons:
  - no upcoming dates → 🔴 `"<class> · 1 left · no class dates left"` (red regardless of thresholds — it can't happen)
  - fewer dates than lessons → the last date, 🔴 `"<class> runs out · 3 left · only 1 class date (Fri Nov 6)"`
  - enough dates → the `left`-th upcoming date is the end; normal red/amber thresholds apply
    (`"<class> runs out · 2 left · Fri Nov 13"` — the last booked session; amber ≤ 3 weeks, red ≤ 1 week or ≤ 5 left)
- `empty` for a class: list at 0 → same red row as a book (she pauses it or adds the next session's lessons).
- Projection not called for a fixed-date class (saves the `{err}` path); `lnOpenCount` still gives `left`.

**B. 🏡 Family time** (`famDefs()` blocks; items with `famTrack(it)` — `track.mode` "week" or "seq"; others excluded).
- New `rmxFamilyItems()` (memoised with the same key + `famProgress` is already inside `famLessonMap`'s own memo):
  for each block not `off`, each tracked item → `famLessonMap(b,id,it)` → `left`, `ends`, `byDate`.
  - seq mode: `left` = sittings − `famDoneN`; week mode: `left` = weeks left (`null` when the track has no total → no item).
  - end date = `ends` only when the calendar holds all `left` future sittings (count of future `byDate` days ≥ `left`);
    otherwise no date (the family calendar isn't built that far) → lesson-count rules only, text without a date.
  - `left === 0` with `total > 0` → 🔴 empty (since the latest past `byDate` day); runout thresholds as for a book.
  - owner is `_family`: `rmxCfg("_family", it.key)` (so `subj/_family/<key>` overrides work in step 4), skipped when
    `cfg.family` is false or the item/block is muted. Label `"🏡 <block name> · <item name>"`.
  - Tapping a family row opens that block's sheet (`famSheetOpen(id)`) — navigation only.
- **Where it shows (strip only, this step):** in the strip of every kid who is a member of the block (`b.kids`, narrowed
  by `it.kids` when set), after that kid's own rows. The same family row therefore appears in each member's strip — on
  Mom's Day (step 3) it shows once under 🏡 Family. `rmxDerive(kid)` stays per-kid; `rmxStripHTML` appends
  `rmxFamilyItems().filter(member)`.
- Howe today: no tracked family items in the design's read-only proof → nothing new appears for us; DeWalt's Family
  Science (Space Science, 10 lessons × 4 sittings, 13 done, ~27 left) would be the first, well outside 3 weeks.

**Writes:** none. **Reads added:** `fixedDates`, `fixedTime`, `rulesData.familyBlocks`, `famProgress` (via `famLessonMap`).

**Tests (extend `test_rmx_derive.js`):** class with all dates past → red "no class dates left" and `_rmxEstimate` not
reached (stub `gvDerivedColumn` must not be called for it); 2 dates / 1 lesson → first upcoming date; 1 date / 3 lessons →
red "only 1 class date"; 6 dates / 6 lessons spanning 5 weeks → amber only once within 3 weeks; class at 0 → empty.
Family: seq item 10 sittings / 7 done with dates → runout dated by the 3rd future sitting; future dates fewer than left →
no date, count rule only; 0 left → empty with the last past day; week mode with total; item without `track` → nothing;
block `off` → nothing; `cfg.family:false` → nothing; `subj/_family/<key>/off` → nothing; row appears only in member
kids' strips and carries the 🏡 label and `famSheetOpen`; zero writes still.

**Size:** ~70 lines in the RMX block + ~6 in `rmxStripHTML`; ~20 new checks.

---

## Step 2 — on PR #137 with step 1 (2026-10-25, not merged yet)
Commit 0b04424. `test_rmx_derive.js` 76 → 111, suite green. PR title + description updated to cover both steps.

## Step 3 in detail — the Mom's Day card (describe → her yes → build)

**Where.** `rmWeekHTML(iso)` in the ROADMAP block, drawn by `renderMomsDay` at `h+=rmWeekHTML(iso)` (behind the
MOMGATE: Mom code once, or Dad's kiosk). Same spot, same card id `rm-week-card`, same purple header.

**What changes on screen.**
- Header reads **"📅 Curriculum heads-up"** (was "Curriculum roadmap · this week"); the count on the right counts every
  row shown. The STICKYSTACK jump label `_ss('roadmap','📅 Roadmap')` becomes `'📅 Heads-up'` — same section id, so her
  saved section order is untouched.
- Per kid (ROSTER order, as today): first that kid's **automatic 🔴/🟠 rows** (`rmxDerive(kid)`, red and amber only; grey
  hand-offs stay in the Mom HQ strip unless `rmxCfg(kid).endOnDay` — a step 4 setting, default off), drawn with
  `rmxRowHTML` (tap → the Builder card); then **her typed rows** overdue / this week, exactly as today (`rmRowHTML`
  compact: ✓ only, no ✏️).
- Then one **"🏡 Family"** group (`lrCap("_family")`, KID_COLOR-less) with `rmxFamilyItems()` red/amber rows, once —
  not repeated per kid as the strips do. Tap → the block's sheet.
- Nothing to show → `""` as today (kids' devices and an empty day draw nothing; the Mom-mode slim "all clear · ⚙" line
  is step 4, with the ⚙).
- Automatic rows have no ✓ (nothing to tick — they clear themselves when she fixes the list).

**Plan bar (Mom HQ ▸ Curriculum header line).** The design said "count red automatic items in overdue"; I'd rather not
mix them with her overdue notes. Proposal: a separate chip `· <b red>N heads-up</b>` where N = that kid's red + amber
automatic rows (family rows for blocks the kid is in included). Say if you'd prefer the design's wording.

**Guards.** `rmWeekHTML` calls `rmxDerive` / `rmxFamilyItems` only `if(typeof … === "function")`, so
`test_roadmap.js` (which runs the ROADMAP block alone) keeps passing with no change beyond the header-string check if
it had one (it checks "2 items", "Ellis" and ✓ — unchanged). Redraws: the `plans` listener already redraws Mom's Day;
curriculum/check-off changes already `renderAllSoon()`; the RMX memo (20 s, keyed on lastEdit + check-offs +
settings + famProgress) keeps repeated draws free.

**Writes:** none. **Reads:** nothing new.

**Performance.** Per draw: ROSTER kids × `rmxDerive` + `rmxFamilyItems`, all memoised; the projection runs only for
candidates (3–5 subjects today) and only once per 20 s / per data change. Design budget < 5 ms per Mom's Day render. I
can't time the live app from here; after her merge I can time `rmWeekHTML(_todayStr())` in her Chrome's console on the
deployed app (read-only), or she can skip that.

**Tests.** `test_rmx_derive.js` gains a "Mom's Day card" section that loads the ROADMAP block too (both blocks in one
vm): automatic red/amber rows sit above the kid's typed rows; grey hand-off absent by default, present with
`endOnDay:true`; the 🏡 group appears once with the family rows; typed-row behaviour byte-identical (overdue + this
week, ✓ only, `rmDone` handlers); the header says "Curriculum heads-up" and the count = rows; nothing to show → `""`;
kid order = ROSTER; a kid with only automatic rows still gets a heading; plan bar chip counts red + amber (family
included for members) and is absent at 0; zero writes. `test_roadmap.js` unchanged.

**Size:** ~25 lines changed in `rmWeekHTML` + ~3 in `planBarHTML` + 1 label; ~15 new checks.

---

## Step 3 — on PR #137 with steps 1–2 (2026-10-25, not merged yet)
Commit 9c025ac. `test_rmx_derive.js` 111 → 131. PR title + description cover steps 1–3.

## Step 4 in detail — ⚙ settings on Mom's Day (describe → her yes → build). **The first step that writes.**

**Where she edits.** A ⚙ button in the "📅 Curriculum heads-up" card header, drawn only when `momHere()` (Mom mode is
on inside Mom's Day; Dad's kiosk passes the gate without Mom mode → no ⚙ for him). Tap → an inline panel under the
header, string-built like the card, open/closed per device (a plain variable, nothing stored). When there is nothing
to show and `momHere()`, the card still draws as one slim line — "📅 Curriculum heads-up · all clear · ⚙" — so the
settings stay reachable; kids' devices and non-Mom views draw nothing, as today.

**What the panel holds** (family defaults; the app's `rules-row` / `rules-label` look from Settings ▸ Family rules):
| Field | Control | Range | Label |
|---|---|---|---|
| `on` | on/off | | Curriculum heads-up (master switch for the automatic rows; her typed rows always show) |
| `warnWeeks` | number | 1–8 | Warn when a list runs out within … weeks |
| `warnLeft` | number | 0–20 | …or when only … lessons are left (0 = don't use) |
| `redDays` | number | 1–21 | Make it urgent (red) … days before |
| `redLeft` | number | 0–10 | …or at … lessons left |
| `endWeeks` | number | 0–8 | Show a book ending with the next one lined up … weeks ahead (0 = never) |
| `endOnDay` | on/off | | Show those on Mom's Day too |
| `kinds.runout / empty / handoff / nolist` | on/off ×4 | | Running out · List empty · Next book takes over · Subject has no lessons |
| `family` | on/off | | Include 🏡 Family time subjects |
| `noteDays` | number | 0–30 | Show my own dated reminders … days before they're due (0 = the week they're due, today's rule) |
`autoDone` is **left out of the panel until step 6** (a switch that does nothing yet would mislead).

Below the defaults: **Per kid** — one row per ROSTER kid with `on`, `warnWeeks`, `warnLeft`, `redDays`, `redLeft`,
`endWeeks`, `kinds.*`; every field reads "same as family" until changed, each with ↺ back to family. Then **Per
subject** — every existing `subj/<kid>/<sk>` record (and `subj/_family/<key>`), labelled with the subject's name,
its fields, and ↺ (removes that subject's whole override node — one `remove`).

**In the strip** (Mom only): each automatic row gets a small "⋯" → *Mute this subject* / *Unmute*, *Warn earlier
(+1 wk)* / *Warn later (−1 wk)*. These write the same per-subject records. Family rows → `subj/_family/<key>`.

**Mute semantics (the design's risk mitigation).** A per-subject mute does not hide: the strip draws that row
greyed with "🔕 muted" (still computed, so she can see what she silenced); Mom's Day and the plan-bar chip skip it.
A kid's `on:false` removes that kid's automatic rows everywhere (her typed rows still show); family `on:false` removes
all automatic rows everywhere. Implementation: `rmxCfg` returns `muted:true` for a subject `off` instead of
`on:false`; the item carries `muted:true`; strip renders grey, card/chip filter. **This changes three step-1/2 test
expectations** ("subject off → nothing" becomes "→ muted row in the strip, absent on Mom's Day"); noted here so
the diff in `test_rmx_derive.js` is expected.

**`noteDays` wired into Mom's Day.** Typed date rows show when `due ≤ today + noteDays` (family/kid level), or this
week when 0 — byte-identical to today at the default. The strip and the plan bar's "this week" count are unchanged.

**Writes — every one targeted, one field per tap, copied from `hhCleanRuleSet`:**
```
rmxRuleSet(scope, field, value)   scope = "" | "kid/<kid>" | "subj/<kid>/<sk>"
  · momHere() required; field name must be one of the fixed names (kinds.<k> → "kinds/<k>")
  · value clamped by RMX_RANGE / coerced to boolean; junk → no write
  · rulesData.headsUp[...] updated locally first (cloned along the path) → renderAll() → the panel redraws at once
  · if(_hhRulesWrite()) db.ref("config/rules/headsUp/"+path).set(v)         // never config/rules, never config/rules/headsUp
rmxRuleClear(scope, field|null)  → db.ref(same path).remove()               // ↺ back to family / remove a subject's node
```
Subject keys and `_family` are Firebase keys already → path segments unchanged. `?dryrun=1` inert. Nothing is written
until she changes a setting; no node = defaults (Howe today, DeWalt, Burris). The `config/rules` listener re-runs
`runDisplacement()` on each change — checked: 540 lines, zero writes, in-memory — and redraws only the schedule tab;
Mom's Day redraws from our own `renderAll()`. No listener change needed.

**Not in step 4:** `autoDone` (step 6), anything on her typed rows beyond `noteDays`.

**Tests — `test_rmx_settings.js`** (slices RMX + ROADMAP, stubs `db` to record writes, `momHere`):
`rmxCfg` layering unchanged + `muted`; the panel: hidden without `momHere`, ⚙ present with it, slim "all clear · ⚙"
line only in Mom mode with nothing to show, non-Mom empty → `""`; every control writes exactly one `set` at
`config/rules/headsUp/<…>/<field>` with the clamped value (99 weeks → 8; "abc" → no write); kinds → `kinds/<k>`;
per-kid and per-subject paths; `_family` lands as a segment; ↺ writes one `remove` at that path; never a write to
`config/rules` or `config/rules/headsUp` itself; no Mom code → no writes and no ⚙; dry-run → zero writes; local
`rulesData.headsUp` updated before the write; strip "⋯" mute → `subj/<kid>/<sk>/off=true`, unmute → remove; muted
row greyed in the strip and absent from Mom's Day and the chip; kid `on:false` → no automatic rows, typed rows
still drawn; `noteDays:10` shows a typed row due in 10 days on Mom's Day, 0 = this week; derive reads a changed
setting at once (memo key). `test_rmx_derive.js`: the three mute expectations updated. Whole suite green.

**Size:** ~170 lines (panel + setters + ⋯ menu + mute + noteDays) in the RMX block, ~6 in `rmWeekHTML`; ~45 checks.

---

## Step 4 — built on `fable/running-now` (2026-10-25 night; the group branch — one runner session from here on)
`RMXS_START…RMXS_END` after the RMX block holds every write; the RMX block still writes nothing. `test_rmx_settings.js`
(76 checks), `test_rmx_derive.js` 131 with the three mute expectations updated as noted above. As built: `rmxRuleClear`
also accepts `field null` for a kid's whole node (one remove of `…/kid/<kid>`) — the family node itself is refused.
`noteDays` is read at family/kid level through `rmxCfg(kid)`; the strip and the plan bar's "this week" count are unchanged.
Known edge (not fixed): on an AB card whose first letter has finished, the ⋯ writes `subj/<kid>/<live letter>` while the
slot's thresholds read the first letter's record — mute works (read on the row's own key); a warn-shift there would not
move the threshold. Steps 5–6 unchanged.
