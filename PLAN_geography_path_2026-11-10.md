# 🌍 Geography Path — design (2026-11-10)

A staged starter unit, the way **Math Fluency Path** and **Shapes Path** are staged: from the seven continents
(Pre-K) up through world capitals (middle school), one path a kid walks for years. It **adopts the capitals cards
Lincoln and Ellis already drill** instead of starting them over, holds pictures on every card, and gives Adrienne
real places to shape it (order, groupings, which maps, mnemonics) before anything is built.

Her words, 2026-11-10: *"kind of like the math fluency path, shapes path, how there are different levels, I would
like to make a geography one that would also pull in the country capitals and the state capitals that Lincoln and
Ellis have. I would like this unit also to be able to hold pictures and different types of cards. I would like the
first level to be the seven continents, for like the pre-K kindergarten first grade age. I would like being able to
look at a picture of the shape of a state just like that continent. I would like the oceans. I would like you to
really think through the order in which a child should learn these, and build this massive unit, and then we could
figure out how the kids could go on it, and keep track of where my kids are with their cards. You have to know that
I care. And I wanted to help."*

Her addendum, same day: *"You could also pull in the geography vocabulary to help create this unit. I think Ellis
has, maybe Lincoln as well."* — Ellis does (24 terms in a `Geography` deck); Lincoln does not. The vocabulary is a
words deck that runs through Stages 2, 3, 4 and 6 and adopts Ellis's cards (§3, §4, §5.2, Appendix C).

**Nothing here is built.** This file is the design; no app file changed, nothing was written to Firebase (the live
database was read once, read-only, to see what Lincoln and Ellis have). Line numbers are from `main` at bb0f93c.

---

## 0. The short version

| Decision | Choice | Why (one line) |
|---|---|---|
| Starter unit or imported record? | **Starter unit in the code** (`STARTER_UNITS.geography_path`), like the other paths | The adoption machinery (`UA_ATTACH`), the How-to notes, and lazy-loaded pictures only exist for code units; it ships to the beta families with one tap. |
| Where do the pictures live? | **In a lazy code file `geo.js`** (SVG outlines, ~250 KB), put on the record *in memory* at load — never in the database | 1–3 KB per outline vs 20–80 KB per photo; the record stays ~40 KB; every picture surface already works from `visuals[deck_name]`. |
| How are existing cards adopted? | **Same deck keys** — `"State Capitals"`, `"World Geography"` and `"Geography"` (Ellis's vocabulary deck) — and the existing Hook-up engine | Zero card writes; Ellis's 16 capitals + 13 words and Lincoln's 7 cards keep their tiers, due days and answers. |
| Vocabulary (her addendum 11/10: "pull in the geography vocabulary … Ellis has, maybe Lincoln as well") | **One words deck, `Geography`, running through Stages 2, 3, 4 and 6** — globe and map words early, landforms beside the US and world stages, a picture per term | Ellis's 24 terms land in it with his own backs; Lincoln has no geography vocabulary deck (his map and earth terms are science cards, left alone). |
| Stages | **10 stages**, ≈ 480 cards (≈ 290 places + ≈ 60 words + ≈ 130 flags, rivers, mountains and landmarks) — her call 2026-11-10: "def do the optionals" | Shape before name, name before capital, capital before fact; home outward, familiar first. |
| Home state | **North Carolina** for the Howe family (her answer 2026-11-10: "our state is nc"); other families pick theirs once at Add | Stage 3's "My state" card and Stage 4's region order start from it. |
| First usable slice | Stages 1–3 (continents, oceans and globe words, my country) with pictures — Julian can start | Then shapes and countries, then the two capitals stages with the hook-up in the same slice. |

Stage list (details in §5):

| # | Stage | Ages | Deck(s) · mode | Cards | Picture |
|---|---|---|---|---|---|
| 1 | 🌍 The seven continents | Pre-K–1 | Continents · flash (say it) | 7 | Continent silhouette in its colour + a small globe showing where |
| 2 | 🌊 Oceans & globe words | K–2 | Oceans · flash · 5 — **Geography** · flip · 13 globe words (adopts Ellis's deck) | 18 | World map with the ocean lit; a globe diagram per word |
| 3 | 🇺🇸 My country | K–2 | My Country · flash · 14 — **Geography** · 10 land-and-water words | 24 | North America map with the thing lit; a landform silhouette per word |
| 4 | 🧩 State shapes by region | 1–4 | State Shapes · flash · 50 — **Geography** · 14 map-skills and landform words | 64 | The state's outline in its region colour + a tiny US inset; a labelled map snippet per word |
| 5 | 🏛 State capitals | 3–6 | **State Capitals** · flip (adopts Ellis's deck) | 50 | The same state outline rides on the front; capital on the back |
| 6 | 🗺 Countries by continent | 3–7 | Countries · flash · ≈ 87 — **Geography** · 22 world-landform and earth words | ≈ 109 | The country lit on its continent; a real-world example lit on a map per word |
| 7 | 🌐 World capitals | 5+ | **World Geography** · flip (adopts Lincoln's deck) | ≈ 60 | The same country picture; capital on the back |
| 8 | 🏳️ Flags | 3+ | Flags · flash | ≈ 87 | Flag → say the country |
| 9 | 🏔 Rivers & mountains | 4+ | Rivers & Mountains · flash | 24 | Map with the feature lit |
| 10 | 🗽 Landmarks | 2+ | Landmarks · flip | 24 | Photo (Commons, credited) → name + country |

Stages 8–10 are enrichment by nature (facts on places already known) but **planned and built like the others** — her
2026-11-10 "def do the optionals". Each is its own stage so Mom still chooses when a kid starts it.

---

## 1. How the machinery works today (what I read)

All in `index.html` unless noted. The design leans on this and adds as little as possible.

- **Starter units** — `STARTER_UNITS` (48997) is a map of `id → () => record`. Units tab ▸ 📚 Starter units ▸ *＋ Add to
  our family* (`starterUnitAdd`, 49493) writes the record **once** to `unitStudies/<id>` with a create-only transaction;
  after that it is the family's own copy. `haUnitOut` codes any visual key the database refuses.
- **A staged unit** has `stages:[{n,label,weeklyFrom,readyAt?}]` and decks whose cards carry `stage` and `family` and
  `order`. `_ustCards(u,n)` (49508) = the stage's cards across all decks; `_ustFamilies` = the families in order.
- **Enroll per kid** (`unitStageFormOpen` → `unitStageEnroll` → `_ustApply`, 49525): Mom picks the stage, "already
  knows through the <family>" (those cards go straight to the ladder as review), or **🩺 Check-up first**. `_ustApply`
  seeds ONLY the chosen stage: every stage card goes into the kid's bank (`mastery/<kid>_custom_items` `{cat,name}`),
  `introCap` of the first unknown family start as `introduction`, the deck's `mode` and `introCap` are written to
  `cat_modes` / `cat_intro_max`, a card's `def` becomes its back (`definitions[name]`, or `answer` on the item). A
  deck with `bankOnly:true` is held (`cat_hold`) — nothing minted until something releases it (AAS, Envirothon).
- **Where a kid stands** — `unitStageStatus` (49579): of the stage's cards, how many are on the ladder (`on`), learning
  (`learn`), which family is being learned, and `ready` when `on ≥ need` (`need` = `readyAt` if set, else all). The
  Units page row says "Stage n · label · x of y on the ladder · learning <family>" or "✓ ready to move up", with the
  **➡ Start Stage n+1** button (`unitStageMoveUp`, 49588; an early tap asks first). The kid's own Units tab card shows
  the same line (41215) plus rung chips.
- **kidStage** — `unitStudies/<id>/kidStage/<kid> = {stage, knows, subject, map, ts, via?, checkup?}` is the whole
  per-kid tracking record; `enrolled/<kid>=true`. The cards themselves live in Mastery as always.
- **Check-up** (CHECKUP 67561, CKSTART 70635): a Mom-graded study session over a stage's cards, family by family —
  the quickest few first, any miss pulls the rest of the family; ✓ → graduated, 〰 → monthly, ✗ → learning. Can start
  at enroll ("Check-up first") or any time later for any earlier stage. State in `mastery/<kid>_checkup/<sid>`.
- **Hook-up / adoption** (UNITATTACH 48857): `UA_ATTACH[unitId][kid] = {stage, fill, strayOk}`. For such a kid the
  stock "+ Kid" is closed; Mom taps **🔗 Hook up <Kid>**, sees the plan (`uaPlanAttach`, pure), taps Yes → ONE multi-path
  update: `enrolled`, `kidStage` (`via:"attach"`), and bank entries `{cat,name}` for stage words the kid's list lacks.
  Cards are matched by **deck key + exact prompt**. Never a card write, never `cat_modes`/`definitions`. A card in the
  deck that isn't a stage card is "stray" (stops the plan unless `strayOk`); a card from an earlier stage is kept.
- **Pictures** — `visuals[deckKey+"_"+name] = "🦈" | {imageUrl, credit}` on the unit record (or the kid's own
  `mastery/<kid>_visuals`). `_unitPortrait` (47998) serves the Units tab and notebook; `mastGetVisual` → `mastLiveVisual`
  (UNITPIC, 65246) serves the drill, Study, games and Match — **live first**, so a changed unit picture reaches every
  card at once. `mastItemVis` (66401) falls back to code drawings for `Shapes` (`mastShapeVis`), `Counting`, `Colors`.
  The sharks draft carries JPEG data URIs in the record (1.7 MB for 18); the cats unit hot-links Commons thumbnails;
  construction machines ships emoji in `visuals`. An `<img src="data:image/svg+xml;…">` works everywhere a JPEG does.
- **Code-held cards** — the Envirothon (ENVUNIT 49029) keeps a THIN record (`cardsInCode:true`) and puts the cards on
  it in memory from a lazily loaded `envirothon.js` (`envHydrate`, `envHydrateAll`); `HA_LAZY_FILES` (7123) is the
  general lazy-load list. This is the pattern for the geography pictures.
- **Notebook** — `haBuildUnitInsight` (48000) builds `learning / learned / next` with portraits for every enrolled
  unit with `nbInsert !== false`; `notebooks.js unitInsertPages` (3584) prints "This Week" + "Your Journey" + any
  queued activity page. The paths set `nbInsert:false` (drills); interest units leave it on.
- **Deck modes** — `flash` (front only, the kid says it, Mom marks), `flip` (front → back), `quiz` (the kid gives the
  answer; typed in Study), `spell`. A Study session's pattern steps are `rec / say / type` (`MST_PATTERN_MODES`, 67520);
  the games' judge is `pick / type / mom` (`GJ_MODES`, 70283; typed from 3rd grade by default, `gameJudgeDefault`).
- **Built-in catalogs** — `MAST_LINCOLN_BANK["World Geography"]` (30 countries) and `MAST_ELLIS_BANK["State Capitals"]`
  (50 states) at 60921/60927 are code lists; their answers are in `MAST_VOCAB_DEFS` (60976, 60986). Default deck mode for
  both is `flip` (`MAST_DEFAULT_CAT_MODES`, 61015). So **the unit's card names and backs for these two decks must be the
  built-in spellings, byte for byte** — then no Howe kid can ever get a duplicate.
- **Performance budget** — `test_perf_budget.js` fails a branch that grows `index.html` more than 60 KB; data belongs
  in a lazy file (`perf_budget.json` lists them).

---

## 2. Architecture: a code starter unit, pictures in `geo.js`

### 2.1 Starter unit, not an imported record — because

1. **Adoption needs code.** `UA_ATTACH` rows, `uaLocked` (closing the stock enroll for Ellis and Lincoln so nothing
   mints a duplicate capital), and the plan preview are code paths keyed by the starter id. An imported record could be
   enrolled, but a kid with live cards would have to go through the stock `_ustApply`, which the units-overlap audit
   found unsafe for existing cards (it rewrites `cat_modes`, `cat_intro_max`, `definitions`).
2. **Ships to every family.** The DeWalt and Burris kids get it with one tap; a record would be a Firebase-console
   import per family (the sharks README shows how clumsy that is).
3. **How-to notes.** `STARTER_HOWTO` fills Mom's note and the kid's one-liner per deck at enroll — only for code decks.
4. **Pictures.** An imported record must carry its pictures (the sharks file: 1.7 MB). A code unit can draw them from a
   lazy file and keep the database thin (below).
5. **Versioning.** `starterVer` lets a later fix re-ship; an imported record is frozen the day it is loaded.

What an imported record does better — Mom can edit cards in place — is kept: the **cards** (names, backs, families,
order) stay **on the record** (≈ 290 cards × ~90 bytes ≈ 30–40 KB), not `cardsInCode`, so her Units-tab card editor
works on them as on any unit. Only the pictures are code-held.

### 2.2 Pictures: `geo.js`, hydrated into `visuals` in memory

- New lazy file **`geo.js`** (built by a script from one open dataset, §6) exposing
  `window.HoweGeo = { paths:{continent:{…}, ocean:{…}, state:{…}, country:{…}}, svg(kind,name,opts) → "data:image/svg+xml;utf8,…", credits }`.
- The starter record carries `picsInCode:"geo"` (the geography twin of `cardsInCode`). `geoHydrate(u)` — called from
  `envHydrateAll` — fills `u.visuals[deck+"_"+name] = {imageUrl: HoweGeo.svg(...), credit}` **in memory only**, deck by
  deck. The record in the database never holds a picture.
- `HA_LAZY_FILES.geo = "geo.js"`; loaded when the family has the unit and a kid is enrolled (same trigger as
  `envirothon.js`). Until it loads, cards show the unit emoji (today's fallback) — a second or two on first boot.
- **No change to any picture surface**: `_unitPortrait`, `mastLiveVisual`, `mastItemVis`, the Match game, the Units
  tab tiles and the notebook's `face()` all read `visuals` already. Alternative considered: a `mastGeoVis` dispatch by
  deck key like `mastShapeVis` — fewer bytes per draw, but it would miss the notebook insert and Match, which read
  `visuals`, so hydrating `visuals` wins.
- **Mom's overrides still win**: `mastery/<kid>_visuals` is merged over the unit's visuals in `_unitPortrait` and read
  first in `mastGetVisual`, so a photo she adds to one card replaces the drawn outline for that kid.
- The capitals cards Ellis and Lincoln already have gain a picture **for free**: UNITPIC reads the unit's visual for
  `"State Capitals_Alabama"` before the item's own `imageUrl`, so the day the unit is added, his Alabama card shows the
  state outline.

### 2.3 Size

| Thing | Estimate |
|---|---|
| Record in `unitStudies/geography_path` | ≈ 35–45 KB (stages, 10 decks, ≈ 290 core cards; enrichment decks add ≈ 15 KB) |
| `geo.js` | ≈ 250–350 KB raw / ≈ 70–100 KB gzip (7 continents ≈ 20 KB, 5 ocean maps ≈ 25 KB, 50 states ≈ 100 KB, ≈ 90 countries ≈ 130 KB, insets) — lazy, cached by the service worker like the other lazy files |
| Compared with | sharks draft 1.7 MB for 18 photos; `envirothon.js` 1.47 MB |
| Firebase limits | Realtime Database: 16 MB per write from the SDK, 256 MB via REST, 32 levels deep, 768-byte keys. Nothing here comes near them. The real constraint is that `unitStudies` is downloaded whole at boot on every device — which is why the pictures stay out of it. |

Card names must be legal keys (no `. # $ [ ] /`): write **"Washington DC"**, **"St Paul"** only as a *back*
(backs may hold periods; `St. Paul` is the built-in answer and is kept as is).

---

## 3. What Lincoln and Ellis already have (read-only, 2026-11-10 evening)

Field names on a card (`mastery/<kid>` array items): `id, subject, type, prompt, answer, status, tier, cycle,
review_mode, consecutive_correct, tally_dots, next_due, drop_count` (+ `imageUrl`, `placed`, `cameBack` on some).
Bank entries (`mastery/<kid>_custom_items`): `{cat, name, def?, order?, ch?}`.

| Kid | Deck (`subject`) | Cards live | Shape | Learned (monthly+) | Learning / in progress | Still waiting in the built-in list |
|---|---|---|---|---|---|---|
| **Ellis** | `State Capitals` | **16** — Alabama → Kansas, alphabetical | prompt = state, answer = capital, `review_mode:"flash"`, `type:"state capitals"`, deck mode flip (default) | 6 monthly (AL, AK, AZ, AR, CA, CO) | 5 bi-weekly (CT, DE, FL, GA, HI) · 1 weekly (ID) · 2 every other day (IL, IN) · **2 learning** (IA, KS) | 34 of 50 (Kentucky onward, alphabetical — no `ellis_bank_order` for this deck) |
| **Ellis** | `Geography` **(adopted too — her addendum)** | **13** live, 24 in his list | prompt = term, answer = his one-line meaning; `review_mode` flash on the older six, recite on the newer; deck mode **flip** (saved in his `cat_modes`); backs also saved in his `definitions` | 6 monthly (lines of latitude, lines of longitude, atmosphere, cardinal directions, intermediate directions, carbon footprint) | 3 bi-weekly (glacier, peak, elevation) · 1 weekly (contour lines) · 1 every other day (irrigation) · **2 learning** (barge, fertilizer) | 11 (tributaries, caldera, fumarole, geyser, tectonic plates, precipitation, evaporation, biome, tundra, taiga, industry) |
| **Ellis** | `Science`, `Vocabulary` | erosion, weathering (Science); climate (Vocabulary) | science/vocab decks | | | not adopted — they belong to those decks; the unit's own *climate* card would be a different deck, so no duplicate is possible |
| **Lincoln** | `World Geography` | **7** — UK, France, Germany, Spain, Italy, Japan, China (the built-in order) | prompt = country, answer = capital, `review_mode:"flash"`, `type:"world geography"`, deck mode flip (default) | 4 monthly (France, Spain, Italy, UK) | 1 bi-weekly (Germany) · 1 weekly (Japan) · **1 learning** (China) | 23 of 30 (India onward, built-in order) |
| **Lincoln** | `Discover! Social Studies 6A` | 25 live, 132 in the list | vocabulary of his social-studies text (archaeology, cuneiform…; also *mountain range, river valleys, Indus River Valley*) — history, not places | — | — | not geography; untouched |
| **Lincoln** | `Real Science-4-Kids`, `RS4K Quiz`, `General Concepts · Terms` (Envirothon) | compass, topographic map, climate map, tectonic plate, earthquake, magma, atmosphere, precipitation, evaporation | science decks, gated by his science book / the Envirothon release | | | **no geography vocabulary deck** — these stay where they are; the unit's words deck never uses their prompts |
| Lucy, Julian | — | no geography or vocabulary decks that touch this | | | | |

A scan of every kid's cards and lists for ≈ 80 geography terms (peninsula, isthmus, plateau, delta, archipelago,
hemisphere, latitude, tributary…) found nothing else. Neither kid has a saved `cat_modes` for the two capitals decks,
so both run on the default `flip`; Ellis's `Geography` deck is saved as `flip`, and his 24 backs are in his
`definitions`. No `definitions` entries for the capitals — those backs come from the code's `MAST_VOCAB_DEFS`.

The unit's Stage 5 and Stage 7 decks therefore use **exactly** `"State Capitals"` and `"World Geography"`, the
built-in 50 and 30 names and backs byte for byte (including `"Pretoria (executive), Cape Town (legislative)"` for
South Africa and `"St. Paul"`), and `mode:"flip"` so the hook-up (which never writes `cat_modes`) and a fresh enroll
(which does) agree. The words deck uses **exactly** `"Geography"`, `mode:"flip"`, and for Ellis's 24 terms his own
prompts and backs word for word (Appendix C marks them **(E)**) — so a check-up or a move-up that reaches those cards
finds them already there and writes nothing new for them.

---

## 4. The adoption rule

**Rule (two sentences).** A stage that drills what a kid already drills uses the very deck key the kid already has
(`State Capitals`, `World Geography`, `Geography`), and hooking a kid up matches each live card by deck key + exact
prompt, keeps every matched card exactly as it is (tier, due day, answer, picture), and only appends the stage's
missing names to the kid's list — never a card, never a mode or a back. A kid is placed at that stage with
`kidStage.via = "attach"`, and the stock "+ Kid" enroll stays closed for them so nothing can mint a duplicate.

Concretely: `UA_ATTACH.geography_path = { ellis:{stage:5, fill:true, strayOk:true}, lincoln:{stage:7, fill:true,
strayOk:true} }` — the existing engine, two new rows. Ellis's plan would read: *"16 State Capitals cards stay exactly
as they are · Marker: Stage 5 · State capitals — 14 of 50 on the ladder, 2 learning · Adds 0 names to the list (every
stage word is already there, in his built-in list) · Next new cards: Kentucky, Louisiana, Maine…"* and, because his
`Geography` words sit in Stages 2–6 of the same unit: *"13 Geography cards stay exactly as they are (earlier-stage
words, kept); 5 of them aren't path words and stay his own."* Lincoln's: *"7 World Geography cards stay · 6 of ≈ 60
on the ladder, 1 learning · Adds ≈ 30 names (Ireland, Portugal, Netherlands… the capitals beyond his built-in 30) ·
Next: India, Brazil, Australia…"*

**One guard the words deck needs (GEOADOPT slice).** A later ➡ move-up into a stage that holds `Geography` words
runs the stock `_ustApply`, which today writes `definitions[name] = card.def` for every stage card — it would
overwrite Ellis's own back with the unit's. Two belts: the unit's backs for his 24 terms are *his* wording, so even
an overwrite changes nothing; and `_ustApply` gets the same rule `STARTER_HOWTO` already follows — **a back that is
already saved is never replaced** (one `if(!st.definitions[c.name])` on the `st.definitions[c.name]=c.def` line
inside `_ustApply`'s card loop). The same line protects
every family's Mom-edited backs on every path, so it is a general fix, tested in `test_unit_stages.js`.

**Edge cases and what happens:**

| Case | What the plan does | Default |
|---|---|---|
| **Kid has the deck under a different name** (a beta kid's "US Capitals") | No match by key → the plan would mint fresh cards beside his old deck. There is no deck-rename in the app today. | The hook-up row gains a one-line notice: *"X also has N cards in 'US Capitals' whose backs match this stage — this unit uses 'State Capitals'."* Mom decides: let the old deck finish on its own (default — nothing written), or ask for a one-time deck merge (a later, separate change: rewrite `subject` on those cards; not in this plan). |
| **Spelling differs** ("Saint Paul" vs "St. Paul", "United Kingdom" vs "UK", "Czech Republic" vs "Czechia") | Prompt match is exact, so the card would count as **stray**. For Howe kids there are zero: the unit copies the built-in spellings. | `strayOk:true` on both rows → strays stay as the kid's own cards, not counted in the stage's ladder. A `respell` map (like WRATTACH's `bmap`) can be added per known variant if a beta family hits one. Backs that differ are reported and the **kid's wording wins** (`backDiffers`, existing). |
| **Kid has extra cards the unit lacks** (Puerto Rico, Wales, Scotland) | Stray → kept, uncounted, never touched. | `strayOk:true`. |
| **Kid has cards from an earlier stage of the same deck** | Not applicable here — each capitals deck is one stage. | — |
| **Ellis's `Geography` words are spread over Stages 2, 3, 4 and 6, but he attaches at Stage 5** | The engine marks one stage per kid. His words in Stages 2–4 are "earlier-stage cards" (kept, counted separately, never stray); his Stage-6 words (*tectonic plates, biome, tundra, taiga, caldera, geyser, tributaries, precipitation, evaporation* — all still in his list, none live) are plain bank entries the unit already names, so `fill` adds nothing for them. His five non-path words (*carbon footprint, irrigation, fertilizer, barge, industry*) are strays → `strayOk:true` keeps them as his own. | `strayOk:true` on Ellis's row. When Mom moves him up to Stage 6, those nine words start as the stage's words deck, with his backs. |
| **A word Ellis has that the unit spells differently** (his *tributaries*; a K-level card would say *tributary*) | Exact prompt match → the unit uses **his** form for every term he has, and his back word for word. | Appendix C marks each **(E)** and keeps his spelling and wording. |
| **Order of the new cards for Ellis** — his list is alphabetical (built-in order, no `bank_order`); the unit's Stage 5 is grouped by region | The engine appends missing names *after* his list and never writes `bank_order`, so Kentucky, Louisiana… keep coming alphabetically. | Keep alphabetical (default, as the math hook-up did). Option on the plan (one checkbox): *"Switch to regions from here"* → writes `mastery/ellis_bank_order/State Capitals` once = his 16 live first, then the regional order. **Her call (Q4).** |
| **A beta kid with live capitals cards** (not in the table) | `uaSpec` is null → stock enroll. It skips prompts the kid already has (`haveItem`) so no duplicates, but it rewrites the deck's mode/cap/backs. | Acceptable for a kid with a handful of cards; if a beta family reports a bigger deck, add a row. **(Q6: data-driven rows instead?)** |

---

## 5. The stages — order, reasons, cards, pictures, readiness, placement

### 5.1 The order and why

Three ideas from how children actually learn geography, all three agreeing:

1. **The Montessori sequence (3–6)** starts at the *whole*: the land-and-water globe, then the coloured-continents
   globe, then the continent puzzle maps, then the map of one's own country and its states. Three-year-olds learn
   continent shapes as *shapes* long before they can read a name — the same skill Shapes Path drills.
2. **The "expanding horizons" spine of elementary social studies** (self → home → community → state → nation →
   world) is right about the *middle*: a child cares about the place she lives, so "my country" and "my state" come
   before the other 49 and the other 190.
3. **Paired-associate recall** (state → capital, country → capital) is a reading-age, verbal-memory task that is far
   easier once the *place* already means something — a shape the kid can see, a neighbourhood of states she has
   traced. Capitals without places are a list; capitals after shapes are labels on a map she knows. Facts
   (rivers, landmarks, flags) attach best to places already known, so they come last — Stages 8–10.

So: **shape before name, name before capital, capital before fact; whole globe first, then home outward.** Stage 2
(oceans and globe words) sits between the continents and "my country" because the words — equator, north, poles,
hemisphere — are what a kid needs to *talk about* a map, and the oceans are the other half of the globe she just
learned. Stage 4 (state shapes) comes before Stage 5 (capitals) for the paired-associate reason, and is grouped by
**region, home first**, so a kid learns one neighbourhood of 10–12 shapes at a time and the "which one is this?" game
only ever confuses her with neighbours — which is also where she needs to tell them apart.

Lincoln and Ellis arrive from the top: they already drill capitals. They are placed at Stages 7 and 5 and Mom can run
quick check-ups downward (Stage 4 shapes, Stage 6 countries) whenever she likes — a check-up never re-enrolls.

### 5.2 Stage by stage

Each stage: age band · deck(s) and mode · the picture on the card · families (the groupings) · "ready to move up" ·
how Mom places a kid.

**Stage 1 · 🌍 The seven continents** — Pre-K, K, 1st.
Deck `Continents`, **flash** (picture front, no back; the kid says the name, Mom marks), `introCap:2` (two at a time,
like Shapes). 7 cards. **Picture:** the continent's silhouette, filled in one colour, with a small globe in the corner
showing where it sits (one SVG). Default order and families, built so the first three shapes can't be confused and
the hardest two come last:

| Family | Cards | Why here |
|---|---|---|
| Where we live | North America | Home first. |
| Big, easy shapes | Africa · Antarctica · Australia | Distinct outlines, each with a kid hook (lions, penguins, kangaroos). |
| The rest | South America · Europe · Asia | South America looks like North America (teach it after the easy three, next to its twin); Europe's ragged edge and Asia's size are the hardest. |

**Ready:** all 7 on the ladder. **Placement:** "Start at the beginning" for Pre-K; "Check-up first" for a K/1st kid
who already knows some (7 cards — a one-day check-up). **Notebook:** this week's continent to colour and its name to
trace (§7). **How-to (STARTER_HOWTO):** *Mom:* "Show the shape; he says the continent. Point to the little globe:
'that's where it is.' Two at a time, no backs." *Kid:* "What continent is this?"

**Stage 2 · 🌊 Oceans and globe words** — K, 1st, 2nd.
Two decks. `Oceans`, **flash**, 5 cards (Pacific, Atlantic, Indian, Arctic, Southern — **Q1: four or five**; default
five, the count National Geographic adopted in 2021 and most current US primary materials use). **Picture:** the
world map with the ocean filled blue and the rest pale. Families: "The two big ones" (Pacific, Atlantic), "The other
three". **`Geography`** — the words deck that runs through the whole path (her addendum: *"pull in the geography
vocabulary"*; it is Ellis's deck key, so his 24 terms are adopted) — **flip** (word + picture front → one-line kid
meaning on the back; the kid says the meaning, flips to check), `introCap:2`. Its Stage-2 share is 13 globe words in
two families:

| Family | Cards (back in kid words; full list Appendix C) |
|---|---|
| The globe | globe · map · equator · North Pole · South Pole · Northern Hemisphere · Southern Hemisphere · compass rose · map key |
| Directions | north · south · east · west |

Pictures: a globe/map diagram per word (equator drawn, the pole marked, the compass rose) — simple SVGs from the same
build. **Ready:** 5 oceans + 11 of 13 words (`readyAt`), so one stubborn word doesn't hold a kid back. **Placement:**
stage pick with "knows through The globe", or check-up. (Ellis's own *cardinal directions* and *intermediate
directions* cards are the 3rd–4th-grade versions of this family and sit in Stage 4's share of the same deck.)

**Stage 3 · 🇺🇸 My country** — K, 1st, 2nd.
Deck `My Country`, **flash**, `introCap:2`, 14 cards. **Picture:** North America (or the US on Albers with Alaska and
Hawaii insets) with the thing lit. Families:

| Family | Cards |
|---|---|
| Our country | United States · Washington DC (our country's capital) · My state (the family's own, lit on the map — **Q2**) |
| Our neighbours | Canada · Mexico |
| Water around us | Pacific Ocean · Atlantic Ocean · Gulf of Mexico · Great Lakes · Mississippi River |
| Land and far-away states | Rocky Mountains · Appalachian Mountains · Alaska · Hawaii |

"My state" reads a small unit field `unitStudies/geography_path/home = "North Carolina"` that Mom sets when she adds
the unit (the Add card asks once; default the Howe family's state; a family that skips it simply has 13 cards). This
is the only new stored field in the whole design.

**Words (the `Geography` deck's Stage-3 share, 10):** the land-and-water words a K–2 kid meets on the My Country map,
each with a **landform silhouette** (a drawn cross-section or bird's-eye shape, own-made in the build) and, where a
real example is on the card's map, that example lit: continent · ocean · island (Hawaii) · lake (the Great Lakes) ·
river (the Mississippi) · mountain (the Rockies) · desert · coast · bay · peninsula (Florida). Family "Land and water
words". **Ready:** all 14 places + 8 of 10 words. **Placement:** stage pick or check-up.

**Stage 4 · 🧩 State shapes by region** — 1st–4th.
Deck `State Shapes`, **flash** (the outline → say the state), `introCap:3`, 50 cards. **Picture:** the state's
outline filled in its region's colour, with a tiny grey US inset showing where it sits — the picture Adrienne asked
for: *"look at a picture of the shape of a state just like that continent."* Families = regions, **the home region
first and ordered outward from home**; then the neighbouring regions. Default (five classroom regions; her call, Q3):

| Region (family) | Default order within (for a North Carolina family) |
|---|---|
| Southeast (12) | North Carolina · South Carolina · Virginia · Georgia · Tennessee · Florida · Alabama · Kentucky · West Virginia · Mississippi · Louisiana · Arkansas |
| Northeast (11) | Pennsylvania · New York · New Jersey · Maryland · Delaware · Connecticut · Massachusetts · Rhode Island · Vermont · New Hampshire · Maine |
| Midwest (12) | Ohio · Michigan · Indiana · Illinois · Wisconsin · Minnesota · Iowa · Missouri · Kansas · Nebraska · South Dakota · North Dakota |
| Southwest (4) | Texas · Oklahoma · New Mexico · Arizona |
| West (11) | Colorado · Utah · Nevada · California · Oregon · Washington · Idaho · Montana · Wyoming · Alaska · Hawaii |

The build orders the regions from the family's `home` state (its region first, then the regions that touch it), so a
DeWalt or Burris family gets *their* neighbourhood first with no extra data.

**Words (the `Geography` deck's Stage-4 share, 14 — the map-skills words a 3rd–4th grader needs to read the state
map, in Ellis's wording where he has them):** family "Reading a map" — cardinal directions (E) · intermediate
directions (E) · lines of latitude (E) · lines of longitude (E) · prime meridian · map scale · elevation (E) · contour
lines (E) · sea level · time zone; family "Land near home" — peak (E) · valley · plain · plateau. **Picture per
term:** a labelled map snippet from the same build (a US map with latitude lines drawn; a compass rose with NE/SE/SW/NW;
a contour-line hill; the Appalachians with a peak marked). **Ready:** 45 of 50 shapes + 12 of 14 words (`readyAt`; the
tiny Northeast states are the usual hold-outs and shouldn't block the capitals). **Placement:** "knows through the
<region>" or a check-up — a check-up here is 5 regions + 2 word families × quick 3–5, about a week at 10 a day. **Later idea (not in
the slices):** a tap-the-map "find it" step, like the tap-each-side drill for shapes — the blank US map, tap where the
named state is. Adrienne's to want or not.

**Stage 5 · 🏛 State capitals** — 3rd–6th. **Adopts Ellis's deck.**
Deck **`State Capitals`**, **flip**, `introCap:3`, 50 cards; name = the state (built-in spelling), back = the capital
(built-in `MAST_VOCAB_DEFS` wording). **Picture:** the Stage-4 outline rides on the front (the same visual key, so
Ellis's existing cards gain it the day the unit is added). Families = the same regions as Stage 4 in the same order,
so the kid learns the capitals of the neighbourhood whose shapes she just learned. Card types that fit: flip in the
Mom drill (say the capital, flip to check); in a Study session the `say` and **`type`** pattern steps (the kid types
the capital — this is where "type-it" belongs; the Study type box takes periods and spaces); in the games the typed
judge from 3rd grade. Reverse (capital → state) is the existing "restart the deck reversed" option, Mom's choice, not
a stage. **Ready:** 45 of 50. **Placement:** Ellis — **🔗 Hook up** (§4). Anyone else — stage pick or check-up.
**Notebook:** a capitals review sheet from the kid's learning + review cards (state → ______).

**Stage 6 · 🗺 Countries by continent** — 3rd–7th.
Deck `Countries`, **flash** (the country lit on its continent → say the country), `introCap:3`, ≈ 87 cards (Appendix
B; her trims and adds, Q5). Families = continents, **most familiar first**: North America (10) → South America (10)
→ Europe (23) → Asia (24) → Africa (16) → Oceania (4). Within a continent, the biggest and most-in-the-news first
(Canada, Mexico, Cuba…; Brazil, Argentina, Chile…; United Kingdom, France, Spain, Italy, Germany…). Every one of
Lincoln's 30 built-in countries is in it. **Picture:** the continent in pale grey with the country filled and a dot
for its capital (the dot is the hook for Stage 7). Flags are **not** on these cards by default (Q5) — a second picture
per card is what the unmerged UNITMULTIPIC branch offers; until then, flags are Stage 8.

**Words (the `Geography` deck's Stage-6 share, 22 — world landforms and earth words, 4th–7th):** family "World
landforms" — isthmus (Panama) · archipelago (the Philippines) · delta (the Nile) · strait (Gibraltar) · gulf (the
Gulf of Mexico) · canyon · tributaries (E) · glacier (E) · fjord (Norway) · oasis · savanna · rainforest; family
"Earth words" — atmosphere (E) · tectonic plates (E) · volcano · caldera (E) · geyser (E) · precipitation (E) ·
evaporation (E) · biome (E) · tundra (E) · taiga (E). **Picture per term:** the real example lit on its continent map
where there is one (the isthmus of Panama, the Nile delta, the Strait of Gibraltar, Norway's coast), a drawn
silhouette where there isn't (canyon, oasis, savanna), and for the earth words a drawn diagram (plates, a volcano
cross-section, the water cycle) — all own-made from the same build, so no licence to track. Nine of Ellis's eleven
waiting words land here with his backs. **Ready:** 78 of 87 places + 18 of 22 words. **Placement:** "knows through
<continent>" or check-up (6 continent families + 2 word families; a kid who knows the Americas and Europe passes
three quick checks in one sitting).

**Stage 7 · 🌐 World capitals** — 5th and up. **Adopts Lincoln's deck.**
Deck **`World Geography`**, **flip**, `introCap:3`, ≈ 60 cards: his 30 built-in countries with their built-in backs
(first, in the built-in order inside each continent family) + ≈ 30 more capitals a middle-schooler should know
(Appendix B marks them). **Picture:** the Stage-6 country picture (same visual key → his 7 live cards gain it).
Families = continents in Stage 6's order. Types: flip / say / **type**, as Stage 5. **Ready:** 54 of 60. **Placement:**
Lincoln — **🔗 Hook up**; others — stage pick or check-up.

**Stage 8 · 🏳️ Flags** — 3rd and up (any kid who knows the Stage-6 countries). Deck `Flags`, **flash** (flag → say
the country), `introCap:3`, the same ≈ 87 countries as Stage 6, families = continents in Stage 6's order (the flag is
a second face of a place the kid already knows). **Picture:** the flag alone, 3:2, flat (the one set that can't be
drawn from map data — Commons *Flag of X.svg* per flag, PD-only, rendered to a small PNG or kept as SVG, per-file
credit, §6). Look-alikes are placed in the same family on purpose so the drill tells them apart (Chad/Romania,
Ireland/Côte d'Ivoire are not both in; Norway/Iceland, Australia/New Zealand, Indonesia/Monaco-type pairs are noted
in Appendix B for her). **Ready:** 78 of 87. **Placement:** check-up (6 families of quick 5) or "knows through".

**Stage 9 · 🏔 Rivers & mountains** — 4th and up. Deck `Rivers & Mountains`, **flash** (the feature lit on its
continent → say its name), `introCap:3`, 24 cards (Appendix E): families "Rivers of the world" (12) and "Mountains
of the world" (12), home continent first. **Picture:** Natural Earth's rivers and the mountain ranges' extent drawn on
the continent map — all public domain. **Ready:** 22 of 24.

**Stage 10 · 🗽 Landmarks** — 2nd and up (a picture deck a younger kid can enjoy early; Mom can move a kid here
straight from Stage 3). Deck `Landmarks`, **flip** with `flipFace:"name"` (photo front → name + country on the back,
the sharks pattern), `introCap:3`, 24 cards (Appendix E), families = continents, the US first. **Picture:** a Commons
photo per landmark, PD / CC0 / CC BY only, each credited in `credits` like the sharks file; loaded as data URIs in
`geo.js` (≈ 24 × 40 KB ≈ 1 MB — the one heavy set, so it is the last thing in the lazy file) or moved to Storage
through the Pictures card. **Ready:** 22 of 24.

None of Stages 8–10 is needed for "ready" of any earlier stage, and a kid can be moved into any of them from any
stage (the ➡ button always offers the next stage; Mom's "Start a check-up" or the enroll stage pick reaches the
others).

**Not for this unit:** the ABC-Train-style ordering game (there is no natural order to drill); Math-Fact Dash /
sprints (the `Math Facts` special case). The Match and Memory games already work on any deck with pictures, so
"match the shape to its name" comes free with Stages 1, 4 and 6.

### 5.3 Where each Howe kid would start (defaults; Adrienne decides)

| Kid | Start | How |
|---|---|---|
| Julian (Pre-K) | Stage 1 | "Start at the beginning", 2 continents at a time. |
| Lucy (1st) | Stage 1, quick check-up | 7 cards; whatever she knows graduates, the rest learns; Stage 2 next. |
| Ellis (4th) | **Stage 5 by Hook up** (his 16 capitals and 13 words kept) | Then, if Mom wants, a Stage-4 check-up (shapes + map words — his latitude/longitude/directions cards already pass) in parallel — a check-up never changes his stage. His nine waiting earth words start when he reaches Stage 6. |
| Lincoln (middle) | **Stage 7 by Hook up** (his 7 cards kept) | Then Stage-6 and Stage-4 check-ups at her pace. |

---

## 6. Pictures and data

### 6.1 Generate, don't collect

Every map picture in Stages 1–7 and 9 is generated from **one open dataset** by one build script, the way
`envirothon.js` is built from a JSON file: ≈ 160 outlines + ≈ 25 lit-feature maps as small SVGs, the same look, the
same colours, one credit line per set. No photo hunting, no per-picture licence.

| Set | Source | Licence | Credit line (on every picture of the set) |
|---|---|---|---|
| Continents, oceans, countries, rivers, mountains, the globe insets | **Natural Earth** 1:50m *Admin 0 – Countries* (its `CONTINENT` field dissolves to the 7 continents), *Physical: Land / Ocean / Rivers + lake centerlines / Geographic regions (polygons)* | **Public domain** — "no permission is needed to use Natural Earth; crediting the authors is unnecessary" | "Map data: Natural Earth (public domain) · naturalearthdata.com" |
| US state outlines (and the US inset) | **US Census Bureau cartographic boundary files** (`cb_20xx_us_state_20m`) | **Public domain** (US federal government work) | "Map data: U.S. Census Bureau (public domain)" |
| Fallback / cross-check for shapes | Wikimedia Commons *Blank US Map (states only).svg*, *BlankMap-World.svg* | Public domain / CC0 as listed on each file page | per file page |
| Landform silhouettes and earth diagrams (the `Geography` words: island, peninsula, isthmus, delta, plateau, canyon, volcano, water cycle…) | **Drawn in the build** (simple cross-sections and bird's-eye shapes), or the real example lit on a Natural Earth map (Panama, the Nile delta, Gibraltar) | Own work → no licence; Natural Earth public domain | "Drawing: Howe Academy" / the Natural Earth line |
| Photos for a few landform words where a drawing is weak (canyon, geyser, glacier, caldera, fjord) — optional | **US National Park Service and USGS photos** (Grand Canyon, Old Faithful, Crater Lake…) on Commons or nps.gov | **Public domain** (US federal government work) | "Photo: National Park Service (public domain)" per picture |
| Flags (Stage 8) | Wikimedia Commons *Flag of <Country>.svg* | **Varies per file** — most national flags are public domain (official insignia or simple geometry); each file page states it | per flag: "Flag of X.svg · <author or 'public domain'> · <licence> · Wikimedia Commons", kept in `credits` like the sharks file |
| Landmark photos (Stage 10) | Wikimedia Commons, chosen by hand | PD / CC0 / CC BY only (skip CC BY-SA, as the sharks test allows but we don't need) | per photo, like the sharks README |

**The licence rule, in one place:** public domain and CC0 need nothing (we credit anyway); CC BY needs author +
licence + link on the credit; CC BY-SA additionally requires that anything derived be shared alike — so the
*generated* pictures use only public-domain data, and CC BY-SA files are used only as untouched photos, never traced.

### 6.2 The build (`tools/build_geo_js.py` → `geo.js`)

- Read the shapefiles (pyshp + shapely, or mapshaper on the command line), **simplify** each outline (Visvalingam,
  ~1 % of the bounding box) so a state is 1–3 KB of path, a country 0.8–2 KB, a continent 2–4 KB.
- Projections: continents and oceans on an **orthographic globe** centred on each continent (the Montessori globe
  look) plus a flat Robinson world map for the ocean cards; states on **Albers USA** with Alaska and Hawaii insets
  (the shape every US kid sees in a classroom); countries on an equal-area projection per continent.
- Emit one path string per feature plus the inset frames; `HoweGeo.svg(kind, name, {px, fill, inset})` composes the
  SVG at draw time (colour by family: region colours for states, Montessori-ish continent colours), so one path serves
  the drill card, the Units tile, the notebook's colouring page (stroke only) and the tracing page (dotted stroke).
- Also emit `credits` and a `names` check so `test_geo_data.js` can assert: every card name in the unit has a path;
  every SVG parses; no path over 6 KB; the whole file under 400 KB raw; the credit strings present; no family or kid
  name anywhere in the file (the sharks test's rule).
- The build needs the internet once (to download the two datasets); it runs on Adrienne's Mac or in a cloud session
  and the result (`geo.js`) is committed. The datasets themselves are not committed.

### 6.3 What the pictures look like (so Adrienne can say "not that")

- **Continent card:** solid silhouette in the continent colour, no labels, a 1-cm globe inset bottom-right with the
  continent lit. Pre-K sized (≥ 220 px tall on the drill card, like the big shape).
- **Ocean card:** flat world map, land pale grey, the ocean deep blue, the rest light blue.
- **State card:** the outline in the region colour with a soft darker stroke; a tiny grey US inset top-right with the
  state lit. No name on the picture (the card is "say the name").
- **Capital card (Stages 5/7):** the same picture, smaller, beside the name — the name is on the front already.
- **Country card:** the continent light grey, the country lit, a small dot where the capital is.
- Colours come from a 7-colour palette chosen for colour-blind safety (the Montessori set has red/green neighbours;
  the build swaps to a blue/orange-safe set and Adrienne can pick either — Q7 if she cares).

---

## 7. Tracking — where Mom sees where each kid is

No new storage beyond `kidStage` (existing) and the one `home` field (§5, Stage 3). Everything below already exists
and lights up the day the unit is added; the notebook pages are the one place new drawing is proposed.

**Units page ▸ Geography Path ▸ the kid rows** (existing `_unitStageRowsHtml`): "Lincoln · Stage 7 · World
capitals · 6 of 60 on the ladder · learning Europe" / "✓ ready to move up" / **➡ Start Stage 8: Flags** (white
until ready, green when ready). Under it the **🩺 check-up row** when one is running ("Check-up: 3 of 5 families
· about 2 days left") and **🩺 Start a check-up…** for any earlier stage at any time. For Ellis and Lincoln the row
first shows **🔗 Hook up** with the plan; after Yes it is the normal row.

**The kid's Units tab card** (41215): "Stage 5 · 14 of 50 on the ladder · 2 learning" + the rung chips (how many of
the unit's cards sit on each rung) + "📓 notebook on".

**Mastery** — the decks appear as any deck: ladder, Learning, drill, Study sessions. Nothing geography-specific.

**Notebook insert pages** (`unitInsertPages`, generic today: *This Week* with the learning cards' pictures, *Your
Journey* with learned + coming-up tiles, an activity page). The unit ships with `nbInsert` **on** (unlike the drill
paths — this one is half a notebook unit) so the generic pages print at once; a later slice (§9, GEONB) adds
stage-specific pages drawn from the same `geo.js` paths:

| Stage | Page |
|---|---|
| 1 | **Colour this week's continent** — big outline to colour, its name in dotted tracing letters, the little globe to find it on. (Pre-K: optionally a "Continent of the Day" box on Julian's daily page, read from the `Continents` deck the way Shape of the Day reads `Shapes` — Adrienne's call.) |
| 2 | **Ocean map to colour** (five oceans, a key to fill in) + **a compass rose to label**. |
| 3 | **Our country** — US map: colour your state, circle the capital, label Canada and Mexico. |
| 4 | **Trace this week's states** — the learning states as dotted outlines to trace, then the same shapes blank with a word bank ("which one is this?"). |
| 5 / 7 | **Capitals review** — the learning + review cards as "North Carolina → ________" lines; answers on the back of the page for Mom. |
| 6 | **Find them** — the continent outline with the week's countries numbered; a word bank to match. |

**Scores page** (SCORESPAGE, Mom's Day ▸ School ▸ 📊 Scores): the four numbers already include these cards (Right %,
Ladder rung average) — nothing unit-specific exists on it today and this plan adds nothing there. **There is no page
named "Reassurance" in this checkout**; the closest things are the Scores "where things are at" card and the
notebook's "Your Journey" insert, both of which will show the geography cards as they do every other deck.

---

## 8. Where Adrienne helps — her decisions, each with a default so nothing waits

| # | Hers to decide | Default if she says nothing |
|---|---|---|
| 1 | **Order of the seven continents** and the "hook" for each (animal, landmark, a song the kids know). | §5.2 Stage 1 table: North America → Africa, Antarctica, Australia → South America, Europe, Asia. |
| 2 | **Four or five oceans.** | Five (Southern Ocean in). |
| 3 | **The geography words, and which belong to which grade band** — Appendix C sorts ≈ 59 terms into Stage 2 (K–2 globe words), Stage 3 (K–2 land and water), Stage 4 (3rd–4th map skills), Stage 6 (4th–7th world landforms and earth words). She may move any term up or down a stage, drop one, add one (isthmus for a 2nd grader? *fumarole* at all?), and reword any back. Ellis's 24 keep his wording unless she changes it. | Appendix C as written. |
| 4 | ~~Home state~~ **Answered 2026-11-10: North Carolina.** Still hers: what belongs in "My country" (14 default cards; add the Outer Banks? the Smokies?). | The 14 in §5.2 Stage 3. |
| 5 | **The regions of the states, which states go where** (Delaware and Maryland: Northeast or Southeast?), and the **order inside each region** — she knows which neighbours her kids already talk about. Any **mnemonics or songs** ("Fifty Nifty United States" is alphabetical — if the kids know it, an alphabetical option for Stage 4 is a one-line switch). | Five regions, Appendix A order, home outward. |
| 6 | **Ellis's capitals order from here:** keep alphabetical (his list today) or switch to regions. | Keep alphabetical; the hook-up offers the switch as a checkbox. |
| 7 | **Which countries, how many, first ones per continent**; names ("Czechia" or "Czech Republic", "Burma" or "Myanmar"). | Appendix B, ≈ 87, US-classroom names; Lincoln's 30 spelled the built-in way. |
| 8 | **Flags with the countries (Stage 6) or later (Stage 8).** | Later, Stage 8 — one picture per card until the multi-picture branch is merged. |
| 9 | **Native nations / Indigenous lands** — whether a "whose land" card or notebook page belongs in Stage 3, and the names she wants used. | Not in the card decks; offered as a Stage-3 notebook page only if she asks. |
| 10 | **Where each kid starts** and check-up sizes (per day). | §5.3; check-up per day from grade: K–1 3 · 2–3 5 · 4–5 8 · 6+ 10 (the existing suggestion). |
| 11 | **Notebook pages:** which stages print which page, colour vs trace, on which day. | §7 table; print on the unit's notebook days as any unit. |
| 12 | **The look:** continent colours (Montessori set or the colour-blind-safe set), whether the capital dot shows on Stage-6 cards. | Colour-blind-safe set; dot on. |

She can answer any of these in a sentence; the build reads the answers from this file's appendices, so a change is a
list edit, not a redesign.

---

## 9. Build plan — slices, one branch and one test each

In an order where **a Pre-K kid can use Stage 1 first** and **the hook-up lands in the same slice as the capitals
decks** (so the stock enroll is closed for Ellis and Lincoln the moment those decks exist — nothing can mint a
duplicate capital in between).

| # | Slice (block name) | What lands | Test | Notes |
|---|---|---|---|---|
| 0 | **GEODATA** | `tools/build_geo_js.py` + the generated `geo.js` (`HoweGeo`: paths, `svg()`, credits) + `perf_budget.json` lazy-file entry | `test_geo_data.js`: every name in Appendices A–D has a path; every SVG parses; size caps; credits; no kid names | No app behaviour change. Needs one internet fetch of the two datasets. |
| 1 | **GEOPATH** | `STARTER_UNITS.geography_path` with Stages 1–3 (Continents, Oceans, My Country, and the `Geography` words deck's Stage-2 and Stage-3 shares), `picsInCode:"geo"`, `geoHydrate` from `envHydrateAll`, `HA_LAZY_FILES.geo`, the Add card's "your state" pick → `home` (pre-filled "North Carolina" for the Howe family), `STARTER_HOWTO` lines, `nbInsert` on | `test_geography_path.js`: enroll a Pre-K kid at Stage 1 → 2 continents learning, 7 in the bank; pictures resolve through `_unitPortrait` and `mastLiveVisual` for places AND words; move-up to Stage 2 seeds only Stage 2 (oceans + 13 words, deck `Geography` set to flip); dry run writes nothing; the record has no picture data | **Julian can start after this.** The words deck is born here under its final key so no later rename is ever needed. |
| 2 | **GEOSTATES** | Stage 4 (State Shapes, regions ordered from `home`, + 14 map-skills words) and Stage 6 (Countries + 22 world-landform and earth words) | extends the test: 50 states once each, region order from three different home states; 87 countries, every Lincoln built-in present; the 24 **(E)** words spelled and worded exactly as Ellis's (byte-compare against a fixture copied from his list) | Pure content + ordering. |
| 3 | **GEOADOPT** ⚠️ | Stage 5 (`State Capitals`) and Stage 7 (`World Geography`) decks with the built-in names/backs; `UA_ATTACH.geography_path` rows for Ellis (5, `strayOk`) and Lincoln (7, `strayOk`); the optional "switch to regions" bank-order checkbox; the **never-replace-a-saved-back guard** in `_ustApply` (§4) | `test_attach_geo_ellis.js` / `test_attach_geo_lincoln.js`: fixtures shaped exactly like their live cards (16 capitals + 13 words, and 7) → **zero card writes**, `enrolled` + `kidStage` + the right bank appends only, Ellis's 13 words counted as earlier-stage/kept and his 5 non-path words as strays, next-10 as expected, backs identical to the built-ins (a byte-compare of the 80 names and 80 backs against `MAST_*_BANK` / `MAST_VOCAB_DEFS`), stock "+ Kid" closed for both, dry run inert; `test_unit_stages.js` gains the guard case (a saved back survives a move-up) | **Riskiest slice** — it touches two live kids' decks (three decks). Safety: the plan is pure and shown first, nothing is written until Yes, and the test replays their real card shapes. Ship outside school hours. |
| 4 | **GEONB** | `notebooks.js` stage pages (§7 table), fed from `ctx.units[].learning[].portrait` plus an `outline`/`trace` variant from `HoweGeo`; optional Pre-K "Continent of the Day" | `test_geo_notebook.js`: pages render, no `.page` overflow (measured in the in-app browser per the notebook rule), snapshot hashes of the other kids' notebooks unchanged | Notebook-only; the generic insert already prints before this. |
| 5 | **GEOEXTRA** | Stages 8–10 (Flags from Commons with per-file credits; Rivers & Mountains from Natural Earth; Landmarks photos, Appendix E) | extends `test_geo_data.js` (credits, licences PD/CC0/CC BY only; every flag PD) and the unit test (stages 8–10 never count toward an earlier stage's ready; Stage 10 reachable from Stage 3) | **Planned, not optional** (her "def do the optionals"). Stage 10's photos go through the Pictures card to Storage the sharks way. |
| 6 | **GEOCHECK** | Check-up quick-picks for picture decks: a `hard` hint on cards (the small Northeast states, the look-alike countries and flags) so `ckQuickPicks` asks the hard ones first, as it does for × ÷ | `test_checkup_geo.js` | **Planned** (same answer). Small; can ride with GEOEXTRA if it stays under 60 KB. |

Each slice: one branch off `main`, its block marked `// GEO…_START — <her words + date> … // GEO…_END`, every write
a targeted path through `db` only when `db && !_dryRun()`, the full test suite green, `test_perf_budget.js` green
(data in `geo.js`, not `index.html`).

---

## 10. Open questions (six, each with a default)

| # | Question | Default |
|---|---|---|
| Q1 | Four oceans or five? | **Five** (Southern Ocean). |
| Q2 | ~~The family's home state~~ **Answered 2026-11-10: "our state is nc."** The Howe record gets `home:"North Carolina"`; other families are asked once at Add. | Done; absent (a family that skips it) → 13 cards and the Appendix-A region order. |
| Q3 | Which region scheme: the five classroom regions (default), the Census Bureau's four, or her own? Where do Delaware and Maryland go? | **Five regions**, Delaware and Maryland in the Northeast. |
| Q4 | Ellis's new capitals: keep coming alphabetically (nothing written) or switch to the regional order (one `bank_order` write at hook-up)? | **Keep alphabetical**; the checkbox is there. |
| Q5 | Flags on the Stage-6 country cards (needs the multi-picture branch merged) or as Stage 8? | **Stage 8.** |
| Q6 | Hook-up rows hard-coded for Ellis and Lincoln only (today's pattern), or data-driven — any kid with a live card in `State Capitals` / `World Geography` gets the Hook-up button? | **Hard-coded rows** for Howe now; data-driven is a one-line change in GEOADOPT if a beta family turns out to have such a deck. |

---

## Appendix A — states by region, default order (home = North Carolina)

Order inside a region = outward from home; the build re-orders from any `home` state by adjacency.

- **Southeast (12):** North Carolina, South Carolina, Virginia, Georgia, Tennessee, Florida, Alabama, Kentucky,
  West Virginia, Mississippi, Louisiana, Arkansas
- **Northeast (11):** Pennsylvania, New York, New Jersey, Maryland, Delaware, Connecticut, Massachusetts,
  Rhode Island, Vermont, New Hampshire, Maine
- **Midwest (12):** Ohio, Michigan, Indiana, Illinois, Wisconsin, Minnesota, Iowa, Missouri, Kansas, Nebraska,
  South Dakota, North Dakota
- **Southwest (4):** Texas, Oklahoma, New Mexico, Arizona
- **West (11):** Colorado, Utah, Nevada, California, Oregon, Washington, Idaho, Montana, Wyoming, Alaska, Hawaii

Capitals (Stage 5) use the built-in backs from `MAST_VOCAB_DEFS` unchanged (e.g. "St. Paul", "Jefferson City",
"Oklahoma City", "Salt Lake City", "Carson City").

## Appendix B — countries by continent, default (≈ 87); ★ = also a Stage-7 capital card

Lincoln's 30 built-in countries are marked **(L)**; their Stage-7 backs are the built-in ones. The other ★ backs:

- **North America (10):** Canada (L) ★, Mexico (L) ★, Cuba ★ Havana, Guatemala, Panama ★ Panama City, Costa Rica,
  Jamaica, Haiti, Dominican Republic, Honduras
- **South America (10):** Brazil (L) ★, Argentina (L) ★, Chile ★ Santiago, Peru (L) ★, Colombia (L) ★, Venezuela ★
  Caracas, Ecuador ★ Quito, Bolivia, Uruguay, Paraguay
- **Europe (23):** United Kingdom (L) ★, Ireland ★ Dublin, France (L) ★, Spain (L) ★, Portugal ★ Lisbon, Italy (L) ★,
  Germany (L) ★, Netherlands ★ Amsterdam, Belgium ★ Brussels, Switzerland ★ Bern, Austria ★ Vienna, Poland ★ Warsaw,
  Czechia ★ Prague, Hungary ★ Budapest, Greece (L) ★, Norway (L) ★, Sweden ★ Stockholm, Finland ★ Helsinki,
  Denmark ★ Copenhagen, Iceland ★ Reykjavík, Ukraine ★ Kyiv, Russia (L) ★, Romania
- **Asia (24):** China (L) ★, Japan (L) ★, South Korea (L) ★, North Korea, India (L) ★, Pakistan (L) ★, Bangladesh,
  Nepal, Sri Lanka, Vietnam (L) ★, Thailand (L) ★, Indonesia (L) ★, Philippines ★ Manila, Malaysia ★ Kuala Lumpur,
  Singapore, Mongolia, Kazakhstan, Afghanistan ★ Kabul, Iran ★ Tehran, Iraq ★ Baghdad, Saudi Arabia (L) ★, Israel ★
  Jerusalem, Turkey (L) ★, United Arab Emirates
- **Africa (16):** Egypt (L) ★, Morocco ★ Rabat, Algeria, Libya, Nigeria (L) ★, Ghana ★ Accra, Ethiopia ★ Addis Ababa,
  Kenya (L) ★, Tanzania ★ Dodoma, Uganda ★ Kampala, Democratic Republic of the Congo, South Africa (L) ★, Madagascar,
  Sudan, Somalia, Senegal
- **Oceania (4):** Australia (L) ★, New Zealand (L) ★, Papua New Guinea, Fiji

Stage 7 total: 30 (L) + 30 ★ = 60. Israel's capital and "Czechia" are the two names most worth her look.

## Appendix C — the `Geography` words deck by stage (≈ 59 terms; **(E)** = Ellis's card, his prompt and back kept)

Every term gets a picture (§6: a globe diagram, a landform silhouette, a labelled map snippet, or the real example
lit). Backs are kid wording; Adrienne may move, drop, add or reword any of them (§8 row 3).

**Stage 2 · The globe (9) · Directions (4) — K–2**
globe — "a round model of the Earth" · map — "a flat drawing of a place from above" · equator — "the imaginary line
around the middle of the Earth" · North Pole — "the very top of the Earth" · South Pole — "the very bottom of the
Earth" · Northern Hemisphere — "the top half of the Earth, above the equator" · Southern Hemisphere — "the bottom
half of the Earth, below the equator" · compass rose — "the picture on a map that shows north, south, east and west"
· map key — "the little box that tells what the map's colours and marks mean" · north — "toward the top of the map,
toward the North Pole" · south — "toward the bottom of the map, toward the South Pole" · east — "toward the right side
of the map, where the sun comes up" · west — "toward the left side of the map, where the sun goes down".

**Stage 3 · Land and water words (10) — K–2**
continent — "one of the seven huge pieces of land" · ocean — "a huge body of salt water" · island — "land with water
all around it" · lake — "water with land all around it" · river — "a long stream of water that flows to a lake or the
sea" · mountain — "land that rises very high, with a peak" · desert — "very dry land where almost no rain falls" ·
coast — "the land along the edge of the sea" · bay — "a part of the sea that curves into the land" · peninsula —
"land with water on three sides".

**Stage 4 · Reading a map (10) · Land near home (4) — 3rd–4th**
cardinal directions (E) — "the four main directions: north, south, east, and west" · intermediate directions (E) —
"the in-between directions: northeast, southeast, southwest, and northwest" · lines of latitude (E) — "imaginary lines
that run east–west and measure distance north or south of the equator" · lines of longitude (E) — "imaginary lines
that run north–south from pole to pole and measure distance east or west" · prime meridian — "the line of longitude
marked 0°, through Greenwich, England" · map scale — "the bar that tells how far a map inch is in real miles" ·
elevation (E) — "how high the land is above sea level" · contour lines (E) — "lines on a map that connect points of
equal elevation" · sea level — "the height of the ocean's surface, where elevation starts at zero" · time zone — "a
strip of the Earth where every clock shows the same time" · peak (E) — "the pointed top of a mountain" · valley — "the
low land between hills or mountains" · plain — "a wide, flat stretch of land" · plateau — "high, flat land, like a
table".

**Stage 6 · World landforms (12) · Earth words (10) — 4th–7th**
isthmus — "a narrow strip of land joining two bigger pieces of land" · archipelago — "a group of many islands" · delta
— "the fan of land a river builds where it meets the sea" · strait — "a narrow channel of water between two pieces of
land" · gulf — "a large part of the sea reaching into the land" · canyon — "a deep, steep valley cut by a river" ·
tributaries (E) — "smaller rivers or streams that flow into a larger river" · glacier (E) — "a huge, slow-moving sheet
of ice" · fjord — "a long, narrow sea inlet between high cliffs" · oasis — "a green spot in a desert where water comes
up" · savanna — "a grassy plain with few trees, in a warm place" · rainforest — "a thick, wet forest where it rains
almost every day" · atmosphere (E) — "the layer of gases that surrounds the Earth" · tectonic plates (E) — "the giant
slabs of Earth's crust that slowly move" · volcano — "a mountain that can throw out melted rock, ash and gas" ·
caldera (E) — "a large bowl-shaped crater left when a volcano collapses" · geyser (E) — "a hot spring that shoots water
and steam into the air" · precipitation (E) — "water falling from clouds as rain, snow, sleet, or hail" · evaporation
(E) — "when liquid water heats up and becomes water vapor" · biome (E) — "a large region with its own climate, plants,
and animals" · tundra (E) — "a cold, treeless biome with frozen ground" · taiga (E) — "a cold northern forest biome of
evergreen trees".

**Ellis's five words that are not path words** (kept as his own, uncounted, never touched): carbon footprint ·
irrigation · fertilizer · barge · industry. His *fumarole* is a sixth — add it to Earth words if she wants it (default
left as his own).

## Appendix E — Stages 9 and 10, default lists (her "def do the optionals")

**Rivers of the world (12):** Mississippi (USA) · Amazon (South America) · Nile (Africa) · Congo (Africa) · Danube
(Europe) · Rhine (Europe) · Thames (England) · Volga (Russia) · Ganges (India) · Yangtze (China) · Mekong (Southeast
Asia) · Murray (Australia). **Mountains of the world (12):** Appalachians (USA) · Rockies (North America) · Sierra
Nevada (USA) · Andes (South America) · Alps (Europe) · Pyrenees (Europe) · Urals (Russia) · Caucasus · Himalayas
(Asia) · Atlas (Africa) · Drakensberg (South Africa) · Great Dividing Range (Australia). Each lit on its continent
from Natural Earth's rivers and the range's extent; the back (for a flip-reversed pass) names the continent or
country.

**Landmarks (24), US first then by continent:** Statue of Liberty (New York) · Golden Gate Bridge (San Francisco) ·
Grand Canyon (Arizona) · Mount Rushmore (South Dakota) · Washington Monument (Washington DC) · Niagara Falls (US/
Canada) · Chichén Itzá (Mexico) · Machu Picchu (Peru) · Christ the Redeemer (Brazil) · Eiffel Tower (France) · Big Ben
(England) · Colosseum (Italy) · Leaning Tower of Pisa (Italy) · Parthenon (Greece) · Neuschwanstein Castle (Germany) ·
Sagrada Família (Spain) · Pyramids of Giza (Egypt) · Victoria Falls (Zambia/Zimbabwe) · Table Mountain (South Africa)
· Taj Mahal (India) · Great Wall of China · Mount Fuji (Japan) · Petra (Jordan) · Sydney Opera House (Australia).
Photos: Wikimedia Commons, PD / CC0 / CC BY only, one credit each (the sharks README's table shape); US ones prefer
National Park Service photos (public domain).

**Flags (Stage 8):** the Appendix-B country list, one flag each; a flag whose Commons file is not public domain is
left out and the country stays in Stage 6 only (the test asserts every flag's licence is PD).

## Appendix D — my country, default 14 (home = North Carolina — her answer 2026-11-10)

United States · Washington DC · My state (North Carolina) · Canada · Mexico · Pacific Ocean · Atlantic Ocean ·
Gulf of Mexico · Great Lakes · Mississippi River · Rocky Mountains · Appalachian Mountains · Alaska · Hawaii.

---

*Read-only sources for §3: `mastery/lincoln`, `mastery/ellis`, their `_custom_items`, `_settings`, `_bank_order`
and `unitStudies` on 2026-11-10; nothing was written. No app file was changed for this document.*
