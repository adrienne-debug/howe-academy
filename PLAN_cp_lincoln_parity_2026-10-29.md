# Lincoln does everything his class sets for him, in Howe: the parity table (2026-10-29)

Her words 2026-10-29: "yes to lincolns stalled cards i basically want him doing everything she wants hi to be but just in our app"
· "q21 yes" · "q23 yeah id like to know how he does".

Code: `// CPLINCOLNPARITY_START … _END` in `index.html` (right after CPLINCOLNL3_END). Tests: `test_cp_lincoln_parity.js`.
Everything here runs only while L1 is on for him (`cplnOn`: this family mirrors him, the mirror is signed in, his class reads
arrived, not the class site). It touches only his 🌿 Envirothon: his 15 decks, his 🌿 session and his check-ins and finals.

## The table: every class-side setting or action that changes what a site student studies

| Class side | What it does for a site student | Lincoln in Howe |
|---|---|---|
| New cards a day · Cards a sitting (Auto) · How cards are learned · Passes · Decks introducing at once · Core cards first · Reviews a sitting | his 🌿 sitting | **Followed already** (L1) |
| Mix in at · Hand off at | when cards leave the sitting | **Followed already, in effect**: L1 reviews every card below graduated in his own sitting |
| How each deck shows · New at once per deck · New per deck in a drill · Days a card is learned | per-deck drill fields | **Followed already** (L1, his 15 decks only) |
| Section plan: final at, pass mark, retake wait, check-in on/off, learned at | check-ins and finals | **Followed already** (L1) |
| Teacher opens a final (`release/<cid>/final`) | the final opens | **Followed already** (ENVTEST's listener) |
| Section / deck send-out, now (`release/<cid>/all`, `…/students/<sid>`) | the deck opens | **Followed already** (ENVMIRROR) |
| Teacher drills (`drills/<cid>/<sid>`) | grades move his cards | **Followed already** (L3) |
| An empty deck gives up its seat (the stall) | — (an engine fix) | **Built here, step 1** |
| Card layer `classCards/<cid>`: edited backs, hidden cards, her added cards, cards made optional | bank, sitting, drill, games, ID Flash, core | **Built here, step 2** (L2) |
| Adrienne's unit trims `units/nc_envirothon/trim` (hide, make optional) | the same | **Built here, step 2** |
| Test layer `classTests/<cid>`: edited, removed, added questions | check-ins and finals | **Built here, step 2** (L2; an attempt on a class form keeps `ans` + `formVer`) |
| Section On · Review only · Off (class plan `state`, and `students/<sid>/sections`) | no new cards / cards paused, check-in waits | **Built here, step 4** |
| Specialist (`students/<sid>/specialist`, class `features`, `specialistShare / NonCore / Others`) | share of new cards, non-core too, others review only | **Built here, step 4** |
| Where new cards come from (`newFrom`, `catchUp`, `mix`; his override) | the split across open sections | **Built here, step 4** (his 🌿 session only) |
| Core only (plan `coreOnly`) | non-core waits for the final | **Built here, step 4** |
| Send-out by Key Concept (`<section>~k<n>`) and scheduled send-outs (`release/<cid>/scheduled`) | only those cards; lands on its moment | **Built here, step 4** (her Q52: through CPSEND's own apply) |
| The teacher's per-student overrides (`students/<sid>/settings`, `…/sections`, `…/specialist`, `release/<cid>/students/<sid>`) | his own values over the class's | **Followed** (L1 + here) |
| Right in a row · What a miss does · the ladder · Learning cards / Overdue reviews per drill | the ladder | **Not built: stays Mom's** (§12.1, her open Q22). Plan A below |
| Skills before the final (plan `skillsForFinal`) and the skill exercises (CPSKILL, CPITEM*) | skill items; the final waits for them | **Not built** (a whole new screen). Plan B |
| The team mock (CPMOCK) | a timed team run | **Not built** (a whole new screen). Plan C |
| The class's photos on cards (CPPHOTOS) | pictures on ID cards | **Not built** (what he sees, not what he studies). Plan D |
| Study days / "Our study days" options (CPCAL, Q33) | the family picks days to meet her target | **Not built** (a family-side card). Plan E |
| Weekly target, the drill watch's warnings (CPWEEK, CPWATCH) | reports to the teacher | Not a study setting (his reviews are in his sitting) |

## Plans for what isn't built

**A. The class's ladder for his 15 decks (Q22).** `mastApplyScores` reads one `ladder_streak`, `tier_streaks` and `miss_drop`
for the whole kid. It would need per-deck values (like `cat_intro_dots`), looked up by the card's deck, for his 15 decks only,
plus a replay test showing his other decks climb exactly as now. About one PR. Needs her answer to Q22 first.

**B. Skills in Howe.** A Howe screen for the skill items (gear, biotic factors, triangle, label, ID rounds, scale), saving to
`mastery/lincoln_skills/<unit>/<skill>`, and the classSkills layer read through his mirror. Then `cpskFinalMissing` can take his
`skillsForFinal`. Until then his final opens without skills even when the class asks for them. Two or three PRs.

**C. The team mock.** A Howe screen for CPMOCK's timed run and its result going to the class. One PR after B.

**D. Class photos.** Read `units/nc_envirothon/photos` (and the class's picks) through his mirror and hand the picture to his
ID cards in memory. Small, but it changes what he sees, so it is its own PR with her yes.

**E. Study days.** The site's "Our study days" options card for a family. In Howe, Adrienne's schedule decides his days. A Mom
card on Units ▸ NC Envirothon showing Brittany's target and the options would be one PR.
