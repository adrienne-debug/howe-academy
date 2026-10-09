# Handoff: Howe house cleaning system — plan, app research, and what to build

**Written 2026-10-09 by a cloud Claude session for a LOCAL Claude session on Adrienne's Mac.**
The cloud session could not read the family's Firebase (no token). You can, read-only, with
`node ~/.howe/fbtoken.js`. Read CLAUDE.md first; every rule there applies. Then read this whole
file. It holds (1) what the local session should do next, (2) the house plan Adrienne built by
voice memo, (3) what the app's code does today for chores, (4) the app design she approved in
principle, and (5) open questions.

The living version of the plan is a Claude Doc, "Downstairs House Plan":
https://claude.ai/code/artifact/70e32254-ad81-4ea0-a147-37cdaf5b591a
Everything in it is repeated here so you do not need that tool.

---

## 1. What to do next (local session)

### 1a. Pull the live chore data, read-only
Same pattern as CLOCK_DEPLOY_RUNBOOK.md. Writes nothing.

```
T=$(node ~/.howe/fbtoken.js); DB=https://howeacademy-default-rtdb.firebaseio.com; D=~/Desktop/chores_$(date +%Y%m%d); mkdir -p $D
for p in config momChores dadChores routineLog momday dadday calendar; do curl -s "$DB/$p.json?auth=$T" -o "$D/$p.json"; done
ls -la $D
```

What each holds (paths confirmed in code, see section 3):
- `config/routines` = `{slot:{kid:[steps]}}`, slots morning/afternoon/chores/evening, kids lincoln/ellis/lucy/julian. Falls back to code defaults `RT_DEFAULT` (index.html ~1906) if absent.
- `config/rotationPeriod/{tag}`, `config/zonePlan`, `config/zoneBonus`, `config/routineBonus`, `config/choreVerify`, `config/routineTimes`, `config/routineRules`, Up for Grabs pins (store editor).
- `momChores/{id} = {label,cad,slot?,ts}` (defaults `MC_DEFAULT` ~11171). `dadChores/{id}` same shape (no defaults).
- `routineLog/{kid}/{wk}/{day}/{key} = {label,slot,act,ts,at,pts,flagged?,penalty?}` — every check-off and uncheck. This is the evidence.
- `momday/{iso}/chores/{id}`, `momday/{iso}/todos`, `dadday/{iso}/chores`.
- `calendar/coops`, `calendar/holidays`, `calendar/vacations`, `calendar/kidOverrides`, `calendar/coopMomDays` — which days chores were even expected.

### 1b. Evaluate, then write findings into the doc / a REVIEW md
Adrienne's words: "I want all the chores that are currently in app saved and remembered and
evaluated and kept any systems that work we can discuss." Compute, per chore per kid:
- due count vs checked count over the last 4 and 8 weeks (use `cad` + calendar to know "due");
- by weekday, so the one-main-chore-per-day pattern is visible;
- how the `rot:"downstairs"` pickup rotation actually cycled;
- Mom's and Dad's done stamps;
- upstairs chores vs downstairs chores (she says downstairs works, upstairs doesn't — show it).
Keep every chore. Mark each Keep / Change / Retire as a proposal for her, with the number beside it.

### 1c. Then discuss the re-plan with her (section 2.6 and 4.4), and only after her yes, build PR 1.

---

## 2. The house plan (from her room-by-room voice memos, 2026-10-09)

People: Mom = Adrienne (runs the house and the app). Dad = Andrew. Kids: Lincoln (5th/6th
grade, ~11), Ellis (4th, ~10), Lucy (1st, ~7), Julian (Pre-K, 4). App kid colors: Lincoln blue
#1e3a5f, Ellis green #2d5a3d, Lucy purple #5b3a8c, Julian orange #c45e1a. Dogs (incl. Chloe),
a rabbit, a reptile ("Sunny"). House ~3,000 sq ft; downstairs mapped, upstairs NOT yet mapped
(she will do the same walk later; upstairs chores already exist in the app).

### 2.1 The game plan (priority order, one big project open at a time)
1. This week: laundry triage — ten unfolded loads, kids can't find clothes. Two afternoons, sort by person (Lucy and Julian sort), each kid folds own pile.
2. This week, 5 min: request a Chip Drop (free wood chips, weeks of lead time) for the garden; the packaging-paper pile in the school room corner waits for the chips.
3. This week, Dad: his business hallway (off the entryway) — push cabinet back, rehang curtains, put up shelves, move his stuff off the living room coffee table. Unblocks the GraviTrax station.
4. This weekend: pantry inventory photos into the app (Mom pulls, Ellis photographs); fridge + kitchen freezer + school room freezer in the same session. App grocery list already has pantry/fridge/freezer zones (GROCERY_LIST_START ~13293).
5. Next two weeks: finish the school room setup project already tracked in the app (Mom ▸ Room setup, `play/todos`): last labels, put up microscopes, clear the table.
6. Right after: log the two big curriculum boxes (Mom + Lincoln). Was blocked behind 5.
7. Kitchen, one cabinet per 20-min slot after 4:15 PM: medicine cabinet first, spices (4 stacked drawers + wall rack + cabinet → one place), pantry cabinets, seven uppers + four small ones over fridge/microwave, buffet (baking below, batteries/cords drawer), dresser (charcuterie boards, cookbooks), island drawers (kids' plates, bento, cups, cookie cutters, koozies, lids, snack spinners, aprons, hats).
8. Big project: the universal art cabinet — two big boxes + school room overflow into the three china-cabinet bases in the dining area.
9. Electronics: Dad buys/builds 2–3 short IKEA Billy bookcases with doors; Lincoln loads; the two carts go. Crunch Labs box backlog becomes a scheduled Saturday build (Lincoln + Ellis).
10. Living room finish: cord stations, GraviTrax station on the coffee table, photo wall, sewing basket items.
11. When chips arrive: garden paper + chips (Dad, Lincoln, Ellis).
12. Bokashi bins (4) restart now that it's cooling; Lincoln pours the tea every few days.
Rules: Mom's project time is after 4:15 PM or during kids' independent work, 20 min at a time, blocked in Mom's Day. Big projects are weekend jobs. No new big project until the previous is closed in the app.

### 2.2 Laundry system
- One load a day on school days, kids fold their own. Mon Lincoln, Tue Ellis, Wed Lucy+Julian, Thu Mom+Dad, Fri towels/sheets (hot) + the downstairs kitchen-and-dog load (hot, its own load). Sunday off. Missed day rolls forward, never stacks to a weekend.
- The app already supports it: a kid chore that starts a load tells Mom's laundry card (KIDLAUNDRY_START ~11759); Mom's Day can block fold time (MOMSCHED_LAUNDRY_START ~11569, 90-min "move it" nudge).
- Today: ONE shared basket in the parents' upstairs bathroom + ONE downstairs in front of the downstairs bathroom (by the laundry room). Kids are used to those two spots. Transition keeps both spots and changes what's there:
  - Upstairs spot → a hamper bank of five: Lincoln (blue), Ellis (green), Lucy+Julian (one hamper, purple/orange), Mom+Dad (the old basket), linen hamper (towels/sheets).
  - Downstairs spot → lidded kitchen-and-dog hamper (dish towels, dog accident towels, couch seat covers, rags) + the old basket kept as a "downstairs clothes" basket (washed Sat or when full; it's the gauge — when it's empty two Saturdays running, the habit took).
  - Next to the washer → lidded "wash-today" bin with a 13-gal bag liner: anything WET (accident sheets, soaked towel, wet dog blanket). Runs that night/next morning as an extra load. Wet never goes in a hamper. Accident sheets wait here a day at most; bed gets its spare set.
  - By the dryer (school room) → clean baskets, one per kid + one grown-ups/linens, white = clean/fold me; colored = dirty/mine.
  - Three weeks: (1) clear the ten loads first; (2) week 1 label + place, tell kids once "same place, pick your color"; (3) weeks 1–2 Mom silently moves wrong-color drops; (4) week 3 if mostly right, it's natural, leave the bank where it is (no need for bedroom hampers).
- Shopping (Walmart, approx 2026-10-09, ~$90 total): 3× Mainstays 1.5-bushel colored baskets ~$14 (kid dirty hampers); 3× Mainstays 24" hinged-lid hamper ~$11 (linen, kitchen-and-dog, wash-today); 5× Mainstays small 1.5-bushel white ~$3.50 (clean baskets); colored duct tape for labels.
- "Base blankets" = waterproof couch seat covers (two sets rotate weekly). "Maze boxes" = GraviTrax.

### 2.3 Who does what (routine; the daily column is what goes in the app's afternoon chores)
- Julian (4): shoes in his bin; dogs' water with Lucy; swap the art in the three dining frames with Lucy; carry seat covers/blankets to laundry; wipe low baseboards; match socks.
- Lucy (7): shoes; dogs' water; art frames; clear little kids' plates/cups to the island; koozies on cans; light switches weekly (living, entry, bath); wipe stools; bathroom trash; toilet paper restock; paper towel roll; baseboards monthly; fold blankets; sort spices by name; wash vases with Mom.
- Ellis (10): sweep kitchen/dining daily; empty robot vacuum daily; trash (alternating with Lincoln, 2–3×/day); clear buffet; shoes/bags tidy in school room; weekly: vacuum living/entry/hall, mirrors, bathroom sink, microwave outside, kitchen walls behind counters (no backsplash), dog/cat food cabinet, under the dog crates, spot-clean couch, swap seat covers; monthly: dust bookcases, toiletry cabinet, pull books for Mom to sort; pantry photographer.
- Lincoln (11): trash (alternating); Bokashi tea; weekly: mop everything downstairs, toilet, glass doors, microwave inside, air fryer, Instant Pot/waffle/juicer after use, dog crates out and wiped, wash seat covers/blankets end to end; monthly: all windows, door-frame tops, walls, columns, pictures, china cabinet glass, open kitchen shelves (empty/wash/refill), trash can wash, wooden door, package cabinet, clock (reset at time change); curtains with Mom; GraviTrax station; Alexa bulbs with Dad; cord stations with Dad; Crunch Labs; Ragtime poster.
- Mom: fridge clean-out weekly (Lincoln hauls); coffee/vitamin station; rotate sensory bins (6) and dough bins (5) for Lucy/Julian weekly; freezers monthly; curtains twice a year; deep clean bathroom sink/faucet; upholstery-clean couch; cleaning closet (unused downstairs shower stall) each season; all decisions and sewing (baby doll, Lucy's dress).
- Dad: tops of cabinets, light fixtures, exhaust fan, air filter + purifier filter monthly, outlets, fireplace in season; all fix/build items (handle under TV, second robot vacuum, hang picture/photo wall/station by Mom's side of couch, Billys, cleaning-supply station install, kettle warranty, Dyson battery decision, ice cream maker unboxing, package cabinet, garden chips).
- Capacity budget (school-day min / Saturday min): Lincoln 30/60, Ellis 25/50, Lucy 15/30, Julian 8/15, Mom routine 20/projects, Dad 15/120 ≈ 14 h/week total, enough for 3,000 sq ft incl. upstairs; downstairs uses about half.

### 2.4 Weekly calendar (Level 2) and levels
- Mon Kitchen · Tue Living room · Wed Bathroom + entry/hall · Thu School room · Fri floors everywhere + laundry (towels/sheets, seat covers) · Sat project time + one monthly-rotation group · Sun off.
- Monthly rotation, one group per Saturday: wk1 glass (windows, china glass, mirrors deep, glass doors); wk2 surfaces (walls, baseboards, door-frame tops, doors, columns, wooden door, package cabinet); wk3 shelves and dust (open kitchen shelves, bookcases, pictures, toiletry cabinet, clock, vases); wk4 machines and bins (air filter, purifier filter, outlets, fixtures, exhaust fan, trash can wash, freezers, school room towers check).
- Twice a year at time change: curtains, clock, Bokashi season check.
- Levels: L1 now = dailies only + one Friday cleaning day together; L2 = the room-a-day jobs; L3 = monthly rotation + each older kid owns one room's weekly job end to end. Move up when checked ~4 in 5 for three weeks (measurable from routineLog). Moving up is Mom's tap, never automatic.

### 2.5 Rooms (downstairs, left to right from the front door)
LIVING ROOM projects: yard-sale boxes up; sew baby doll; fix+sew Lucy's dress (sewing basket on TV stand); Lincoln's Ragtime poster; buy pillow for "the pillow thing"; fix handle under TV; fix 2nd robot vacuum; maybe paint older table; tools up (Dad shows, Ellis keeps); books to let go (Ellis pulls, Mom decides); go through games; clean under furniture; organize TV cabinet; shelves by the couch; cord stations; order 2 GraviTrax boxes → station on coffee table by fireplace; back-office shelves systems for Dad's business + the app business; hang the picture; kids' photo wall; hang "little station" beside Mom's side of couch; decorate mantel; sync lamp bulbs to Alexa. Upkeep: daily tidy; robot vacuum emptied; table cleared; weekly vacuum/mop/couch spray/seat-cover swap/mirror/bookcases/switches; monthly pictures, door frames+baseboards, columns, outlets (Dad), walls, windows, doors, fireplace, clock, throw blankets, filters; upholstery clean every few months; curtains twice a year.
ENTRY + HALLWAY (incl. Dad's business hallway): projects = Dad's hallway (cabinet back, curtains, shelves, his stuff off the coffee table), organize package cabinet. Upkeep: shoes daily (Lucy+Julian); switches; vacuum; mop; mirror; glass door; baseboards; wooden door; package cabinet; back of hallway walls.
DOWNSTAIRS BATHROOM (has an unused shower = cleaning closet): projects = organize the household maintenance cabinet top+bottom (batteries, tools, cleaning supplies, chemicals; Mom+Dad); clean out the cleaning closet. Upkeep: dogs' water daily; baby gate up (dog pees); trash; toilet paper; switches; sink; mirror; sweep; toilet; mop; window; deep-clean faucet/bowl/cracked spot monthly; toiletry cabinet; light fixture + exhaust fan (Dad).
KITCHEN + DINING (one long room): projects in order = pantry photos; medicine cabinet; spices; kid-reachable cleaning-supply station off the counter (Mom designs, Dad installs); pantry cabinets (birthday supplies, liquor, broth/rice, grocery bags); 7 uppers + 4 small; buffet (baking, batteries/cords); dresser; island drawers; universal art cabinet (big); gathering box for the app's family-teaching; blender decision; Billys for electronics; Crunch Labs schedule; Dyson (dead battery: model → price battery vs new); kettle (leaks, past return window → warranty or replace); hide the piano keyboard; restart Bokashi. Upkeep: trash 2–3×/day; sweep daily; buffet cleared; plates/cups to island; art frames; koozies; weekly mop, microwave in/out, air fryer, walls, stools, pet-food cabinet, dog crates, fridge, coffee station; monthly open shelves, trash can, dining windows, china glass, freezers; cabinet tops every few months (Dad); vases; curtains.
SCHOOL ROOM (old garage; two glass doors, two windows, curtains; the room where the systems are working): projects = finish the Room setup project in the app; log the two curriculum boxes; unbox ice cream maker; Chip Drop + garden paper; enter the rest into the app; laundry system. Upkeep: shoes into each kid's own bin + bags; baby gate; sweep daily; mop weekly; rotate sensory/dough bins; rain suits/hats on hooks; glass doors, windows monthly; towers/bin systems check monthly (play.js stations + Check the room); freezer; curtains.

### 2.6 Buy list and open decisions
Buy: 2 GraviTrax boxes (standard Starter ~$60–81 at Walmart; PRO ~$75; one Starter + one expansion goes further than two Starters — ask which two she meant); pillow; kids' photo prints; 2–3 short Billy with doors (IKEA ~$80–100 ea); third-party Vitamix Classic 64 oz container $50–65 (CLASSIC profile, not Low Profile); Dyson battery or new unit; kettle if warranty fails; hallway shelves; Chip Drop (free); laundry baskets (2.2); paper towels, rice.
Decided: keep the Vitamix TurboBlend 3-Speed (buy a good container, test it), sell the Ninja Kitchen System; Creami stays. Chipped-blade container = never run; crack at the bottom near the blade is usually the drive socket/blade assembly (replaceable); auction purchase = no Vitamix warranty.
Open: Dyson model number; paint the table or not; where Lucy/Julian's folded clothes live until upstairs drawers are sorted; where the gathering box lives; whether a cleaning day pays normal points or a bonus; which two GraviTrax boxes.

---

## 3. What the app's code does today (research 2026-10-09; line numbers = index.html)

- Kid chores = steps in four slots `SL_SLOTS=["morning","afternoon","chores","evening"]` (1703). Step: `{label,emoji,pts,cad,time?,from?,to?,cycW?,cycN?,cycStart?,rot?,free?,zone?,meal?,since?,laundry?}`. Cadence grammar `cadDueOn` (2214–2229): `daily`, `wk:0,2,4` (Mon=0), `Nd`, `2w`, `sat`, `sun`, `asneeded`, `none`. 4-week cycle via cycW/cycStart (1747); date windows from/to (1755). Missed weekday chores carry over "late" (2320). New chores start `cad:"none"` (cpAddChore 26055).
- Defaults (Howe only): `MORNING_STEPS_DEFAULT` ~1797; `RT_DEFAULT` 1906–1929; `GRAB_DEFAULT` (Up for Grabs, 20 items from Skylight) 1955; `MC_DEFAULT` (Mom) 11171; Dad none (`dadChoresData={}` 10590). Lookup `rtStepsFor` 1989: `config/routines` else defaults. Pickups carry `rot:"downstairs"` and cycle daily among the three big kids (`rtApplyRot` 2018; period at `config/rotationPeriod/{tag}`) — Adrienne's rule, working, KEEP.
- Storage: definitions `config/routines` — NOTE the editor saves with a whole-node `set()` (`rtCfgSave` 56273); new code must use targeted writes. Check-offs `{wk}/sl` keys `wk_day_kid_{a|c|e}step{i}` (`toggleRtStep` 2167). Log `routineLog/{kid}/{wk}/{day}` (56320).
- Afternoon list opens when schoolwork done (`rtSchoolworkDone` 2070) OR at `routineTimes.afternoonHour` (default 16) OR always-open days (Sat/Sun). Chores list always open. Evening at `eveningHour` (18). Empty list counts as done (CHORESEMPTY 2047). Chores are list panels (`rtSlotHTML` 2383, `renderSkylight` 4280–4337), Kids' Corner, calendar (`_calChoresFor` 28244) — NOT timeline cards; the generator ignores them. Day-end gate `choresGateDone` 20676.
- Editor: Mom HQ ▸ 🧹 Chores & Stars (7628) → `renderChorePlan` 26187 (weekday grid; tabs Lists, Up for Grabs, Store, Points, Rooms & times, Log).
- Points: `bankDirect(kid,pts,note,hold)` 5211 → `bank/{kid}/adjustments/{id}`; pay = pts + `zoneBonusFor` (25939); uncheck removes that entry (5221); `config/choreVerify/{kid}` holds pay for Mom; list/day bonuses 25904/25926; false-check dock −100 (12283).
- Day types: co-ops `calendar/coops/{id}` (timed/fullDay; `coopApplyStart` 27834; no Mom-required lessons by default); "Mom's here today" = `calendar/coopMomDays/{iso}` (banner button 8313, `coopToggleMomDay` 27869); holidays/vacations `{name,start,end,pause:"school"|"chores"|"all"}` (`scheduleBreakToday` 7656; `activeSlots` 1708 decides which lists show); per-kid off `calendar/kidOverrides/{kid}/{iso}` (😷 Kid Off, 7814). No cleaning day, no dayType field. Mom HQ ▸ 🏖 Breaks & vacations (7639 → 26349).
- Mom's Day: `renderMomsPlan` 10767 → `renderMomsDay` 12650 (I need Mom; Now; My day strip `momDayStripHTML` 11373; Kids today KIDBAR 12051; check-off log CKLOG 12247; Together 12107; Dinner; Bills; Laundry). Her chores `momChores/{id}` (`mcAdd` 11209); to-dos `momday/{iso}/todos`; timed blocks `momBlocks/{iso}/{key}` (laundry 11569, meal prep 11675; Mom loop treats blocks like lunch `_blkIv` 54001). Dad's Day `renderDadsDay` 10717, `?kiosk=dad` (`_kioskD` 2889), `dadChores/{id}`, `dadday/{iso}/chores`.
- School Room (play.js): `PL_CATALOG` 95 (bins: id, cat, loc, photo); locations `PL_FDESC` 224 (T1/T2 = the two TALL towers; F1–F3 low frames; W1–W3 wall bins; Kallax; CART-…; STATION; OUTBOX; RETIRED); `play/binMeta/{id}` {loc, kids, rot, cull}; stations `play/stations/{frame}` with "one frame flips per week, >21 days = DUE" (`plStationsHtml` 489–524); "🧭 Check the room" `plRoomCheckRun` ~1008 compares every bin to `library/rules`; Room to-dos ROOMTODO_START ~865 `play/todos/{id}` (Mom ▸ Room setup) = the "school room project tracked in the app".
- Grocery/pantry: GROCERY_LIST_START 13293, sections with pantry zones (produce/pantry/fridge/freezer), `putaway`.

### 3.1 Code-default lists (what I evaluated; live lists may differ — check 1a)
Lincoln: morning teeth, vitamins, feed rabbit, hay, rabbit water, rabbit litter · afternoon pickup school room 20 (rot), shower 50 wk:1,3,5, take dogs out 20 · chores bunny bedding 0, make bed w/ new sheets 25 (6 AM), vacuum stairs & upstairs 25, vacuum kitchen 30 (no cad → daily) · evening teeth, feed dogs 0, water dogs 0, sleep meds, reptile lights, mouthwash, pjs, pickup hallway 20.
Ellis: morning teeth, vitamins, feed Sunny, water Sunny, underwear/socks, clothes · afternoon pickup living room 20 (rot) · chores ONE PER WEEKDAY: Mon king bed new sheets 20, Tue vacuum bathroom 20, Wed dust school room 20, Thu vacuum hallways 20, Fri vacuum my room 20, Sat wipe game shelf+bookcases 25, Sun wipe table under TV 20 · evening feed dogs 25, water dogs 25, reptile lights, take dogs out, mouthwash, pjs, pickup boys' room 20, teeth.
Lucy: morning teeth, vitamins, let Chloe out, underwear/socks, clothes, brush hair · afternoon Chloe out 0, pickup kitchen 20 (rot) · chores door windows 15, take sheets off beds 15, books back on shelf 15, dust dining 15, bathroom mirrors 15 (no cad) · evening teeth, Chloe, mouthwash, pjs, pickup playroom 20.
Julian: morning teeth, vitamins, clothes, underwear/socks · afternoon shower 50 wk:0,3,5 · chores shoes by door 10, Duplo in bin 10, bathroom doors 10, side door window 10, dust entryway 10, animals in bin 10 (no cad) · evening pjs, teeth.
Mom (MC_DEFAULT): kitchen close-down daily; sheets Mon; tubs & showers Tue; bathroom sinks & counters Tue; mop kitchen+bathrooms Fri; fridge clean-out Sun; master bedroom reset Sun; handles & switches 2w. Dad: nothing.
Up for Grabs (all "daily"): 3 toilets (downstairs, Mom's, top of stairs) 40 ea; baseboards 40; china cabinets, island, kitchen table 25; glass doors (bunny room, school room, front) 15–25; under furniture; coffee table, desk, side tables (Bella's chair, by bookcases, between chairs, behind couch) 5–15; columns, corner cabinet 15; organize school books 5.

### 3.2 Her corrections to my first read (IMPORTANT)
- Animal chores are a MUST and are NOT house chores — their own area. Health routine (teeth, vitamins, meds, clothes, pjs) is a MUST and its own area. Two separate areas, unchanged.
- The pickup rotation "has maintained the house … nice it rotates and been good." KEEP as is.
- The real structure today is: health routine AM/PM + animals + rotating pickup + ONE main house chore per kid per day. "Downstairs has been working, upstairs hadn't." So the re-plan is mostly the upstairs plus the weekly/monthly layer, not the downstairs daily layer.
- The "no cad → daily" findings (Lincoln/Lucy/Julian) are probably artifacts of the code defaults; her live lists likely already set one main chore per weekday. Verify from `config/routines`.
- Findings that still stand regardless: dogs fed/watered on both Lincoln's (0 pts) and Ellis's (25 pts) evening lists; toilets/baseboards/columns/glass doors live only in Up for Grabs; three kid-sized jobs on Mom's list (mop, switches, sinks); Dad's list empty; points uneven (shower 50, toilet 40, pickup 20) — proposal: 10 pts per 5 min, grabs ×1.5; upstairs jobs already exist in the app (vacuum stairs & upstairs, beds, boys' room, playroom, king bed, master reset, two upstairs toilets) = seed rows for the upstairs.

---

## 4. The app design she approved in principle (build only after her explicit yes, one PR each)

Her words: "everything moves to Mom's Day for a whole cleaning tab with areas for the different sections and types of things … all checklists stay in their spots, pull in Mom and Dad as well because it's kinda already separate systems"; "kinda like the schedule grid"; "different levels of expectations … grow that when one level gets natural"; "cleaning days where I can say okay everyone go do and it sits in their schedule like a school day".

Constraints from CLAUDE.md: marked blocks `// NAME_START … // NAME_END`; every write targeted (`ref(path/id).set/update/remove` or multi-path update, never whole-node set); `db && !_dryRun()`; Mom-only actions check `momHere()`; kid device = `kcKid`; points via `bankDirect`; no 🔀; plain kid-safe text; each feature ships `test_<feature>.js`; generator changes need a replay test; pre-existing failing tests: test_cell_identity.js, test_derived_col.js.

### 4.1 PR 1 — Wash-today button (`WASHTODAY_START`)
One button "Wet or soiled" on every kid's Day page (kcKid) and on Mom's and Dad's Day; choices Towels / Sheets / Dog stuff (maybe Seat covers — ask). A tap: (a) adds a line to Mom's laundry card "Lucy, sheets, 7:40 AM. Wash today." which then uses the existing Start/Done + 90-min nudge; (b) for Sheets, adds a one-off chore to that kid's afternoon list "Put the spare sheets on your bed" (normal pts; Julian's lands on Lucy's or Mom's list, a setting); (c) appears in the check-off log. One targeted write per tap under the laundry node. Test: test_wash_today.js. Open: pay the reporting kid a point or two?

### 4.2 PR 2 — Cleaning tab on Mom's Day: import + review (read-only on lists)
New tab "Cleaning" on Mom's Day = the single editor/overview for every job (kids' four lists, momChores, dadChores, Up for Grabs). First open imports every existing chore as a row marked with source list, keeping label/emoji/pts/cad/rot/zone/laundry/time; saves a snapshot of the originals. Each imported row shows last 4 weeks from routineLog: due, checked, by whom. Each row: Keep / Change / Retire (retired = hidden, never deleted, one tap back). Views: by AREA (Health routine | Animals | House → Downstairs | Upstairs, each with rotating pickup, one main chore/day, weekly room-day, monthly rotation, laundry, projects, Up for Grabs), by ROOM, by PERSON (everyone's today in one column). Row fields: label, room, area/type, who, cad, day, minutes, points, level, status, source. Projects are rows with owner + done date. Until Take over, read-only on the lists. Import never writes. Test: test_cleaning_tab.js.

### 4.3 PR 3 — Take over + levels
Flip "Take over": tab becomes the source; regenerates per-person lists (config/routines slots, momChores, dadChores) with TARGETED writes; flip back restores the snapshot. Level column (1/2/3) + current level; only rows ≤ current level go out; "Level N is ready" card on Mom's Day when checked ~4 in 5 for 3 weeks; moving up/down is her tap. Test: test_cleaning_takeover.js.

### 4.4 PR 4 — Cleaning day
Day-banner button like Co-op / Kid Off → `calendar/cleaningDays/{iso}` (or similar). School paused that day (as vacation pause:"school"); every Day page incl. Mom's and Dad's shows a Cleaning Day panel: that person's rows by room in walking order with minutes + running total, checked like chores, normal points (or bonus — ask), normal end-of-day celebration. Also openable on a normal day with one tap ("okay everyone go do") without pausing school. Test: test_cleaning_day.js.

### 4.5 PR 5 — Cleaning cards on the timeline (later)
Rows laid as timed cards (e.g. Monday kitchen job at 4:20 PM between school end and supper). Touches the generator (MOMLOOP/DAYSTART/SCHOOLEND/REPROJ) → replay test required; only after PRs 3–4 have run a few weeks.

School room towers/systems check: nothing new — a Mom row "Room check" every 4 weeks (wk4 Saturday) pointing at the play.js station panel (red after 21 days) and "Check the room"; a kid does the physical shelf-by-shelf match.

---

## 5. Questions still open for Adrienne
1. Yes/changes on the design (4.1–4.5)?
2. Cleaning day: normal points or bonus?
3. Wash-today: add "Seat covers"? pay the reporter?
4. Which two GraviTrax boxes? Dyson model number?
5. Pickups rotate, weekly room job owned at Level 3 — does that split sit right?
6. Points standard 10 pts / 5 min, grabs ×1.5 — yes?
7. The upstairs walk (same voice-memo method) whenever she's ready; rows land in the same tab.

## 6. Deliverables from the cloud session
- The Claude Doc linked at the top (sections, tables, checklists).
- This file, on branch `claude/relaxed-noether-fgimkw`. No app code was changed.
