# 🇺🇸 United States Path — design (2026-11-16)

A staged starter unit built like **Geography Path**, **Math Fluency Path** and **Shapes Path**. It runs from the flag and
the Liberty Bell (Pre-K) to the citizenship civics test (middle school): symbols, holidays, famous Americans, how the
government works, the founding, all 27 amendments, every president in order, the wars and battles, and America in the
world. Kids climb it for years. It **adopts the `U.S. History` cards a kid may already drill** without rewriting any of
them. Every card gets a picture from a public-domain source, with a credit.

Her words, 2026-11-16: *"id also like to make a us unit so, presidents, american battles admendments governments etc do
research etc"*

**Nothing here is built.** This file is the design only. No app file changed and nothing was read from or written to
Firebase. Everything about "what kids already have" comes from code and repo files. Line numbers are from `main` at
5195e53c.

---

## 0. The short version

| Decision | Choice | Why (one line) |
|---|---|---|
| Starter unit or imported record? | **Starter unit in the code**, `STARTER_UNITS.us_path`, like `geography_path` | The hook-up, How-to notes and code-held pictures exist only for code units, and the beta families get it in one tap. |
| Where do the card lists live? | **In a lazy file `us.js`** (names, backs, families, drawn pictures, credits). ＋ Add loads it, builds the record and writes it once. | The lists and backs total about 55 KB. If they lived in `index.html` they would use up the 60 KB performance slack across the slices. `test_perf_budget.js` says data belongs in a lazy file. |
| Where do the photos live? | **In two lazy files, `us_pics_1.js` (Stages 1–3) and `us_pics_2.js` (Stages 5–9)**, small JPEG data URIs put on the record *in memory* as `{svg, credit}`, the GEOPATH way. Never in the database. | Works offline (the service worker caches lazy files), ships to every family, and is never stamped into a kid's `mastery/<kid>` item (`_mastVisNorm` never stamps `.svg`). |
| How are existing cards adopted? | **Same deck key `U.S. History`**, the built-in 20 names and backs byte for byte (read from `MAST_VOCAB_DEFS` at build time). Uses a **data-driven hook-up** like `geoAdoptSpec`. | Zero card writes. The built-in deck is in a middle-school kid's catalog today (`MAST_LINCOLN_BANK["U.S. History"]`, index.html 63349). |
| Stages | **10 stages, 370 cards in 11 decks** | Symbols → people → how government works → the founding → amendments → presidents → the 1800s → the 1900s → the citizen's test. Concrete before abstract, home before world, people before dates. |
| Presidents | **All 47 in order** (Stage 7, card = "16th President", back = name · years · one fact). The five every little kid knows come in Stage 2. | Order is what an older kid is asked for. A face plus a number is how it sticks. Cleveland and Trump each have two numbers, so a name can't be the card front. |
| First Ladies / Vice Presidents | **Neither as a deck.** Abigail Adams and Eleanor Roosevelt are in Famous Americans. The Vice President's job is in Civics and the Civics Test. | 47 VPs and 50-odd First Ladies would double the size for little standards payoff. Neither NC nor Core Knowledge asks for them. |
| Amendments | **All 27, in kid words, year first**, like the built-in backs (`"1865 — abolished slavery…"`). The 13th, 14th, 15th and 19th stay in `U.S. History`, where the built-ins already are, so no kid gets a duplicate. | One back shape everywhere. Zero collisions with the adopted deck. |
| Battles | **25 battles** across three stages: 8 Revolution (2 in NC), 2 War of 1812, 7 Civil War (1 in NC), 8 twentieth century. **Picture = a pin on the map**, not a battle painting. | Factual, never graphic. The map pin reuses `geo.js`'s US and world maps. |
| The older-kid target | **The 2025 USCIS civics test** (128 questions; the 2008 list of 100 is the older form). Stage 10 has 124 question cards; the 4 "your state's…" ones go on a notebook page to fill in with Mom. | A recognised "knows the basics" bar. Adults must answer 12 of 20 aloud to pass. |
| Book gate | **None by default.** The unit runs on its own like Geography Path. Linking to a history book is a later, optional slice once she names the books. | No US-history book is known to the code for the Howe kids (§4.3). Today the staged-unit book map only knows Math Facts. |
| Overlap with Geography Path | **Linked, not duplicated.** States, capitals and Washington DC stay in Geography. This unit's 13 Colonies cards *draw* from `geo.js`. Geography's not-yet-built Stage 10 Landmarks should drop Statue of Liberty, Mount Rushmore and Washington Monument, because they are Stage 1 symbols here (Q10). | One place per fact. |
| First usable slice | **Stages 1–4** (symbols, holidays and the first presidents, famous Americans, civics words) | The Pre-K and 1st-grade kids can start. Presidents come next, then the adopting history slice. |

The ladder (details in §5; every card list is in the appendices):

| # | Stage | Grades | Deck(s) · mode · cards | Cards | Picture |
|---|---|---|---|---|---|
| 1 | 🇺🇸 Symbols of America | Pre-K–K | American Symbols · flash · 11 | **11** | Photo (NPS, USFWS, Architect of the Capitol) or a drawn flag |
| 2 | 🎆 Holidays & presidents to know | K–1 | American Holidays · flash · 11 — Famous Presidents · flash · 5 | **16** | Drawn holiday picture; portrait |
| 3 | ⭐ Famous Americans | 1–3 | Famous Americans · flip · 24 | **24** | Portrait (LOC, NARA); a drawn badge when no true likeness exists |
| 4 | 🏛 How our government works | 2–4 | Civics · flip · 30 | **30** | Drawn diagram (the three-branch tree, a ballot box) or a building photo |
| 5 | 📜 Colonies, Revolution & Constitution | 3–5 | 13 Colonies · flash · 13 — **U.S. History** · flip · 10 — Famous Americans · 6 — American Battles · flip · 8 | **37** | Colony lit on the East-coast map (`geo.js`); document scans (NARA); battle pin |
| 6 | ⚖️ The Bill of Rights & all 27 amendments | 4–6 | Amendments · flip · 23 — **U.S. History** · 4 — Civics · 3 | **30** | Drawn icon per amendment; the NARA Bill of Rights scan |
| 7 | 🎩 Presidents in order | 3–8 | Presidents · flip · 47 | **47** | Official or public-domain portrait |
| 8 | 🗺 A growing nation & the Civil War | 4–7 | **U.S. History** · 16 — American Battles · 9 | **25** | PD painting or photo; battle pin |
| 9 | 🌎 America in the world, 1865–today | 6–8 | **U.S. History** · 18 — American Battles · 8 | **26** | PD photo (LOC, NARA, NASA); battle pin on the world map |
| 10 | 🗳 The citizen's test | 6+ | Civics Test · flip · 124 | **124** | none (🗳) — question cards |
| | | | **11 decks** | **370** | |

`U.S. History` holds 48 cards spread over Stages 5, 6, 8 and 9 (Geography's `Geography` words deck works the same way).
20 of them are the built-in cards, marked **(B)** in Appendix E.

---

## 1. How the machinery works today (what I read)

All in `index.html` at 5195e53c unless noted. The design leans on these and adds as little as possible.

- **Starter units**: `STARTER_UNITS` (50816), a map of `id → () => record`. `starterUnitAdd` (51580) writes the record
  **once** to `unitStudies/<id>` in a create-only transaction. After that it is the family's own copy. `starterVer`
  exists on every record, but **nothing re-ships a newer version**. A family that tapped ＋ Add before a later slice
  merged never gets the later stages. This is the Geography Path's open issue #1 (slice-2 and slice-3 notes) and it
  shapes §9.
- **Staged units**: `stages:[{n,label,readyAt?,weeklyFrom?}]`. Decks carry cards `{name, family, stage, order, def?}`.
  `_ustCards(u,n)` collects a stage's cards across *all* decks, which is how one deck can span several stages.
  `_ustApply` (51627) seeds ONE stage per kid. It sets `cat_modes` and `cat_intro_max` for the stage's decks, writes
  `definitions[name]=def` **only when no back is saved** (the GEOADOPT guard, 51660), and adds `{cat,name}` bank entries
  plus `introCap` learning cards for the first unknown family. `unitStageStatus` (51729) gives on, learn, need and
  ready. ➡ `unitStageMoveUp` starts the next stage.
- **Hook-up (UNITATTACH, 50673)**: `uaSpec(u,kid)` reads `UA_ATTACH[unit][kid]` and falls back to
  `geoAdoptSpec(u,kid)` (51106). That fallback builds a row from the kid's own live cards, names no kid, and supports
  `fill`, `strayOk`, `alsoDecks`, `keepLater`, `backs`, `reorder` and `noCards`. While a kid's hook-up waits, the stock
  "+ Kid" is closed for that kid (`uaLocked`). `uaPlanAttach` is pure, and Yes writes one multi-path update: `enrolled`,
  `kidStage` and the appended `{cat,name}`. It never writes a card, a `cat_modes` entry or (except under `backs`) a
  definition.
- **Code-held pictures (GEOPATH, 50857)**: `picsInCode:"geo"` plus `geoHydrate(u)` (50956) fill
  `u.visuals[deck+"_"+name] = {svg, credit}` **in memory**. `_unitPortrait` (49785) and `_mastVisNorm` (67856) read
  `.svg` as an image source and never stamp it onto an item. `geoHydrateAll()` runs first in `envHydrateAll`. Lazy files
  are listed in `HA_LAZY_FILES` (7361) and loaded by `haLazyLoad`. The `.svg` field is just an image `src`, so a JPEG data
  URI works there as well as an SVG.
- **Book gates**: `cat_gate/<deck> = {subject}` (book lessons) or `{fam,item}` (a Family Time unit day, PUTSCHED 41376).
  For a *staged* unit the only book link is `UNIT_BOOK_MAPS` (51600). Its `_ustBookCh` is math-shaped (family number ×
  add/sub), and UNITBOOK (51617, merged today) shows the picker only where a map exists. `cardLessons` is AAS-only, so
  there is no history gate today.
- **Built-in catalogs** (63342–63445): `MAST_LINCOLN_BANK["U.S. History"]` has 20 events, Jamestown → 19th Amendment.
  Their backs are in `MAST_VOCAB_DEFS` (lower-case keys, `"1607 — first permanent English settlement in North America"`
  and so on). Default mode is `flip`, the emoji 🏛, and the intro hint is "say when and what happened". That is the only US
  history or civics deck in the code. No other bank, starter unit or vocab list has presidents, amendments, branches or
  battles (searched `index.html`, `library.js`, `eic.js`, `play.js`, `family-config.js`).
- **Notebooks** (`notebooks.js`): `enPageMemoryCivics` (3423) is the **"Memory Work & Civics"** page in the 4th- and
  6th-grade notebooks (Extra Pages toggle `memoryCivics`, 3760 and 4475). It prints the Pledge, the Preamble, the three
  branches, 5 states and capitals a week, and a **"President of the Week"** that cycles through
  `LN_EXTRA.enrich.presidents` (47 rows: number, name, years, one kid-safe fact) by week number. So the older kids already
  see a president a week, but not as cards. The unit's Presidents deck uses **the same 47 names and years** (a test pins
  them) so the page and the cards never disagree (§7).
- **Rulers in order, already done once**: the British Monarchy unit (`unitStudies.british_monarchy`, deck
  `British Monarchs`) has a "Royal Line" tile page with tap-for-bio (`showMonarchBio`, 49926) and its own notebook insert
  (`unitMonarchyPages`, notebooks.js 3477). It is the model for a later "Presidents' Line" page (slice USLINE, §9).
- **Performance budget**: `perf_budget.json` measures `index.html` (60 KB slack per branch) and each lazy file. `geo.js`
  is 514 KB and `envirothon.js` 1.47 MB.

---

## 2. What US kids are taught, by grade band (research)

### 2.1 North Carolina Standard Course of Study, Social Studies (adopted 2021)

The family is in NC. A home school in NC is **not required to follow the SCOS** (state law asks home schools for an
annual nationally standardized test in English grammar, reading, spelling and math). The SCOS is still the clearest
local yardstick, and the beta families' public-school neighbours learn to it. Standards were approved 2021-02-04. Each
grade has strands for behavioral sciences, civics and government (C&G), economics, geography, history and inquiry. From
NCDPI's grade guides:

| Grade | Course focus | The US / civics standards that shape this unit |
|---|---|---|
| K | Self, family and the world around them | Rules, being a good citizen, national symbols and holidays (taught through the K parent guide; K guide not retrieved, see §12) |
| 1 | Community | 1.C&G.1: how people take part in the community, make rules and laws, rights *vs* responsibilities. 1.H.1: people who changed society. |
| 2 | **"America: Our Nation"** | **2.C&G.1.3: compare the structure and function of the three branches of government.** 2.C&G.1.1: principles of democracy. 2.H.1.1: contributions of women, Indigenous, religious and racial groups. 2.H.1.2: events that shaped America. |
| 3 | "Our Community and State" | **3.C&G.1.1–1.2: state and local government, and leaders' roles** (governor, mayor, county). 3.H.1: people and events in local history. |
| 4 | North Carolina | 4.C&G.1.1: state elected leaders. 4.C&G.1.3: rights in the NC Constitution. **4.H.1.4: NC's role in major conflicts** (so the Revolution's Moores Creek Bridge and Guilford Courthouse, and the Civil War's Bentonville). **4.H.1.6: NC symbols.** |
| 5 | The United States | **5.C&G.1.1–1.2: the three branches and how they work together (checks and balances).** **5.C&G.2.2: rights protected by the Constitution** (Bill of Rights, amendments). **5.H.1.4: major conflicts and the nation's development.** **5.H.1.6: national symbols and traditions.** |
| 6–7 | World Studies I and II | Ancient through modern world. US civics carries on through the founding documents' roots (Greece, Rome, Magna Carta). |
| 8 | **North Carolina and United States History** | **8.C&G.1.1: democratic ideals in the founding documents.** 8.C&G.1.4: state, national and tribal governments. 8.C&G.2: reforms. **8.H.1.1: causes and effects of conflict.** 8.H.1.2: compromise. 8.H.2: innovation. |
| HS | Founding Principles / Civic Literacy (required for graduation) | The deep civics. The 2025 USCIS list is a fair bridge to it. |

### 2.2 Core Knowledge Sequence, History & Geography K–8 (American strand)

| Grade | American topics (headings from the Sequence) |
|---|---|
| K | Native American peoples · Columbus 1492 · the Pilgrims · July 4 · **Presidents, past and present** · **Symbols and figures** |
| 1 | Earliest people · early American civilizations · Columbus, conquistadors, English settlers · **from colonies to independence: the American Revolution** · early exploration of the West · symbols and figures |
| 2 | **American government: the Constitution** · **the War of 1812** · westward expansion · **the Civil War** · immigration and citizenship · **"Fighting for a cause"** (civil-rights and reform figures) · symbols and figures |
| 3 | Earliest Americans · early exploration · **the thirteen colonies** (Southern, New England, Middle Atlantic) |
| 4 | **The American Revolution** (French and Indian War, causes, the war) · **making a constitutional government** (Declaration, Articles, the Constitution, **levels of government: national, state, local**) · **early presidents and politics** · reformers · symbols and figures |
| 5 | Westward expansion · **the Civil War: causes, conflicts, consequences, Reconstruction** · Native Americans: cultures and conflicts · US geography |
| 6 | Immigration, industrialization, urbanization · reform |
| 7 | America becomes a world power · **World War I** · the Twenties to the New Deal · **World War II** (Europe, at home, the Pacific) |
| 8 | **The Cold War** (incl. **the Korean War**) · **the Civil Rights Movement** · **the Vietnam War** · the Middle East · end of the Cold War · **Civics: the Constitution, principles and structure of American democracy** |

### 2.3 The USCIS civics test (the "knows the basics" bar)

- **2008 version: 100 questions.** An officer asks 10 and the applicant must answer 6. Sections: American Government
  (principles, system, rights and responsibilities), American History (colonial and independence, the 1800s, recent),
  Integrated Civics (geography, symbols, holidays). It is still used for applications filed before 2025-10-20.
- **2020 version: 128 questions.** In use from December 2020, rescinded in spring 2021.
- **2025 version: 128 questions** (form M-1778, 09/25), for N-400s filed **on or after 2025-10-20**. An officer asks up
  to 20 and the applicant must answer **12**. Sections: *American Government* (A. Principles of American Government,
  B. System of Government, C. Rights and Responsibilities; Q1–72), *American History* (A. Colonial Period and
  Independence, B. 1800s, C. Recent American History and Other Important Historical Information; Q73–118), and
  *Symbols and Holidays* (Q119–128). Starred questions (★) are the short list for applicants 65+ with 20 years'
  residency. Several answers change with officeholders (the President, Vice President, Speaker, Chief Justice, your
  senators, representative and governor). USCIS keeps a "test updates" page for these.
- **Use here:** the 2025 list is Stage 10, rewritten in kid words (Appendix H). It is also the **check on coverage**:
  the build maps each 2025 question to the earlier stage's card that teaches its answer and reports the ones no card
  teaches (expected: the economic system, the Cabinet, the Electoral College, the Federalist Papers, the Oath, taxes,
  Selective Service, an American innovation). Stage 10 itself teaches those. Most answers are met earlier.

### 2.4 What the bands mean for this unit

| Band | NC + Core Knowledge agree on | Stages |
|---|---|---|
| **Pre-K–K** | Flag, eagle, Liberty Bell, Statue of Liberty, White House, the Pledge, July 4 and Thanksgiving, Washington and Lincoln | 1, 2 |
| **1st–2nd** | Holidays and why, presidents "past and present," people who changed things (Franklin, Tubman, King, Parks…), rules and laws, **the three branches by name (NC 2nd)**, the Constitution as "our rules" (CK 2nd) | 2, 3, 4 |
| **3rd–5th** | State and local government (NC 3rd), the 13 colonies (CK 3rd), **the Revolution and its battles, the founding documents, levels of government (CK 4th)**, **the three branches working together and the Bill of Rights (NC 5th)**, **early presidents (CK 4th)**, **the Civil War (CK 5th, NC 5th)**, NC's part in the wars (NC 4th) | 4, 5, 6, 7, 8 |
| **6th–8th** | Immigration and industry (CK 6th), **WWI, the Depression, WWII (CK 7th)**, **the Cold War, Korea, civil rights, Vietnam, the Constitution in depth (CK 8th, NC 8th)**, all the presidents, all the amendments | 6, 7, 8, 9, 10 |

The order inside the path follows three ideas that agree. **Symbols and people before ideas**: a 4-year-old can name the
Liberty Bell long before she can say what a "branch" is. **How it works before how it happened**: the three branches
(NC 2nd) come before the Constitutional Convention (CK 4th), so the convention is about *something*. **Story before
list**: the founding (Stage 5) comes before the first five presidents (Stage 7), and the 1800s (Stage 8) before the
presidents of the 1800s are reviewed. Presidents (Stage 7) sits between the founding and the 1800s, because 3rd–5th
graders love the order and faces, and every later stage hangs dates on "who was president then."

---

## 3. Architecture

### 3.1 A code starter unit, with its data in a lazy `us.js`

The same five reasons as Geography Path §2.1: the hook-up needs code, it ships to every family in one tap,
`STARTER_HOWTO` notes, lazy pictures, and versioning. One difference: the **card lists live in `us.js`, not in
`index.html`.** With 370 cards and longer backs (presidents' facts, amendments, 124 civics questions), the lists come to
about 55 KB. Kept in `index.html`, that would eat the per-branch 60 KB slack over the slices and stay forever in the
7.7 MB file every device parses at boot.

- `us.js` (≈ 170 KB raw / ≈ 50 KB gzipped) exposes `window.HoweUS = { decks, stages, credits, svg(kind,name),
  pin(name) }`. It contains the card lists (name, back, family, stage, order), the drawn pictures (flag, holiday icons,
  civics diagrams, amendment icons) and the battle coordinates. A build script writes it from one source file of lists
  (Appendices A–H), the way `geo.js` is built.
- `STARTER_UNITS.us_path = () => usUnitRecord()` reads `window.HoweUS`. **One small, general change**: a
  `STARTER_LAZY = {us_path:"us"}` map that `starterUnitAdd` awaits (`haLazyLoad("us")`) before calling the maker. The Add
  card shows "Getting the unit ready…" and, offline, says "Needs the internet once — try again." Every other starter is
  unchanged, because they have no row.
- **The cards still sit on the record** (≈ 55 KB in `unitStudies/us_path`, Geography's is 28 KB), so Mom's Units-tab card
  editor works on every card, including the "changes with time" backs (the current President, Speaker…). Only pictures
  are code-held.

### 3.2 Pictures: hydrated into `visuals` in memory

- `picsInCode:"us"` on the record. `usHydrate(u)` does what `geoHydrate` does: `u.visuals[deck+"_"+name] = {svg:<data
  URI>, credit}` **in memory only**, memoised so a picture used by two decks (Washington in Famous Presidents and
  Presidents; the 13 Colonies outlines and Geography's state outlines) is one string. `geoHydrateAll` becomes
  `codePicsHydrateAll` with a two-row table (`geo`, `us`), a rename plus one row, and it runs from `envHydrateAll` as
  today.
- **Three lazy files**, loaded only for a family that has the unit:

  | File | Holds | Size (estimate) | Loaded when |
  |---|---|---|---|
  | `us.js` | card lists, drawn SVGs (flag, 11 holidays, ~10 civics diagrams, 27 amendment icons), battle pins, credits | ≈ 170 KB raw / 50 KB gz | the unit is on the family (and before ＋ Add) |
  | `us_pics_1.js` | Stages 1–3 photos: 8 symbols, 5 famous presidents, ~22 famous Americans | ≈ 35 photos × 9 KB × 1.33 (base64) ≈ **0.45 MB** | any kid enrolled |
  | `us_pics_2.js` | Stages 5–9 photos: 45 presidents (47 numbers, two men twice), ~30 history scenes, ~6 founders, 4 documents | ≈ 85 × 9 KB × 1.33 ≈ **1.0 MB** | any enrolled kid's stage ≥ 5 |
  | `geo.js` (exists) | the maps the 13 Colonies cards and the battle pins are drawn on | 514 KB | the US unit asks for it too, if not already loaded |

  Compare: `envirothon.js` 1.47 MB, `classes.js` 1.37 MB. Photos are 200×250 px JPEGs at about quality 60. gzip saves
  little on JPEG, so the raw size is the real cost, once per device, then cached by the service worker.
- **Memory**: when everything is loaded, about 1.5 MB of data-URI strings plus the Geography strings. That is fine on
  the family's tablets. Hydration is a loop over 370 cards with a memo, about 5 ms.
- **Mom's own picture wins**: a card she gives a photo through the card sheet (`mastery/<kid>_visuals` or the unit's
  visuals as `{imageUrl}`) is never replaced (same check as `geoHydrate`). More pictures per card (UNITMULTIPIC, 67626) work
  unchanged; that is where battle paintings can go if she wants them (§6).
- A kid who already drills `U.S. History` **gains pictures on those cards the day the unit is added** (UNITPIC reads the
  unit's visuals by deck key and prompt).

### 3.3 Size

| Thing | Estimate |
|---|---|
| Record `unitStudies/us_path` | ≈ 55 KB (10 stages, 11 decks, 370 cards; the 124 civics questions are ≈ 18 KB of it) |
| `us.js` + `us_pics_1.js` + `us_pics_2.js` | ≈ 1.6 MB raw in total, lazy, cached |
| `index.html` growth | code only: ≈ 6–12 KB per slice (record builder, hydrate, adopt spec, Add wait) |
| Card names | must be legal keys and pass `mastDefKeyOk` (no `. # $ [ ] /`). So: "Martin Luther King Jr", "Susan B Anthony", "Brown v Board of Education", "US Capitol" → **"the Capitol"**, "Washington DC". **Backs keep their periods.** The deck key `U.S. History` already works (`haKey`). |

---

## 4. What kids may already have, and the adoption rule

### 4.1 From the code (no live read; the brief forbids it)

| Where | What | Who has it in their catalog |
|---|---|---|
| `MAST_LINCOLN_BANK["U.S. History"]` | 20 events (Appendix E, **(B)**), flip, backs in `MAST_VOCAB_DEFS` | the 6th grader (built-in list; how many are **live cards** is unknown from code) |
| `notebooks.js LN_EXTRA.enrich` | `pledge`, `preamble`, `branches`, `states_capitals`, `presidents` (47) | printed on the 4th- and 6th-grade "Memory Work & Civics" page; **not cards** |
| A social-studies book deck `Discover! Social Studies 6A` (named in tests `test_mst_twin_mode.js` and `test_study_alerts.js`) | ancient-world vocabulary (archaeology, cuneiform…) | the 6th grader; **not US history**, untouched |
| `State Capitals`, `World Geography`, `Geography` | places and words | belong to Geography Path; this unit never uses those keys |
| The 1st grader and the Pre-K kid | nothing US-related in their built-in banks (Science, Vocabulary, Letters…) | — |

A scan of all four built-in banks and `MAST_VOCAB_DEFS` for president, amendment, congress, constitution, branch, vote,
pledge, flag, eagle, liberty, battle and war found only the 20 `U.S. History` cards. The 4th grader's built-in list has "government" as a
**Spelling** word and "boundary"/"region" as Vocabulary, all different decks, so no collision.

### 4.2 The rule (same as Geography's §4)

A stage that drills what a kid already drills uses the **very deck key** (`U.S. History`) and the **built-in names and
backs byte for byte**. Hooking a kid up matches live cards by deck key + exact prompt and keeps every matched card exactly
as it is (tier, due date, answer, picture). It only appends missing *non-built-in* names to the kid's list. Never a card,
a mode or a back.

**`usAdoptSpec(u,kid)`**, the twin of `geoAdoptSpec`:
- `null` for a kid with no live `U.S. History` card. That kid takes the stock "+ Kid" enroll.
- Otherwise `{stage, fill:true, strayOk:true, keepLater:true, backs:true, reorder:true, noCards}` where **stage = the
  *lowest* stage holding one of the kid's live `U.S. History` cards**. This differs from Geography's "highest". The
  built-in order starts at Jamestown, so a kid whose cards run Jamestown → Trail of Tears lands at **Stage 5**, not
  Stage 8. Nothing is skipped, and the later cards are *kept* (`keepLater`) and count when he reaches their stage.
- `strayOk`: any `U.S. History` card Mom added herself that isn't on the path stays the kid's own, uncounted.
- `backs`: an appended name with no saved back gets the path's back unless the code's back is identical. For the 20
  built-ins it is identical, so **no definitions write**.
- **One general change:** `uaSpec`'s fallback becomes a list, `UA_SPEC_FNS = [geoAdoptSpec, usAdoptSpec]` (first
  non-null wins). That is one line, and Geography's behaviour is byte-identical.

**The amendments split.** The built-in deck already holds the 13th, 14th, 15th and 19th Amendments. If the Amendments
deck also had them, a kid would get a second "13th Amendment" card in another deck, and `definitions` is keyed by the
card front across *all* decks. So those four live in `U.S. History` at **Stage 6**, beside the 23 `Amendments` cards.
The stage still drills all 27 (a stage spans decks, `_ustCards`). In the drill those four show the 🏛 U.S. History label.
The other 23 backs use the **same "year — what it does" shape**, so the deck reads as one.

**Edge cases:**

| Case | What happens | Default |
|---|---|---|
| Kid has the 20 in the **built-in list but none live** | Stock enroll at Stage 5. `_ustApply` would append `{cat:"U.S. History",name:"Jamestown"}` although the built-in list already names it. **Must check in USHIST:** does `mastFullBank` de-duplicate? If not, `_ustApply` skips names in the kid's built-in list (the `_builtIn` test it already runs for `defsOnBank` decks, widened). | Tested both ways in `test_us_adopt.js`. |
| Kid has `U.S. History` cards Mom added under the same names with **different backs** | Matched by prompt. The kid's back wins (`backDiffers`, existing). | — |
| A beta kid has a **differently named** deck ("American History", "History") | No match, so fresh cards would sit beside the old deck. | The plan shows a notice (Geography's rule). No deck merge. |
| A kid drills Geography's **Washington DC** (My Country) | Different deck and front from the Civics Test's "What is the capital of the United States?". No collision. | — |
| The unit's **Famous Presidents** (Stage 2) vs **Presidents** (Stage 7) | Different decks and fronts ("George Washington" vs "1st President"). Same portrait, shared from the memo. | — |

### 4.3 Book gating: should a stage wait for a history book's lessons?

What the code knows: no US-history book is attached to any Howe kid in repo files. The 6th grader's book deck is
ancient-world (*Discover! Social Studies 6A*). A **beta family** runs **BiblioPlan** in Family Time (week by week, with
a **Friday "Presidents" role**; `test_family_lessons.js`, `test_fam_makeup_roles.js`), so at least one family studies
presidents weekly alongside a history spine.

What the engine can do: a staged unit's only book link is `UNIT_BOOK_MAPS` (`{subject}` gate + `ch` per bank entry), and
`_ustBookCh` computes `ch` from a *math* family number. A `{fam,item}` Family-Time gate exists (PUTSCHED) but not for
staged units.

**Default: no gate.** The US Path is self-paced like Geography Path, Mom moves a kid up, and the notebook carries it. If
she names a spine (BiblioPlan, Notgrass, Story of the World vol. 3–4, Abeka…), an optional slice **USBOOK** adds a
`UNIT_BOOK_MAPS` row with a per-card week list (`byName:{"16th President":14, …}`) plus a one-line `_ustBookCh` branch
for `byName`. Cards then open as the book reaches them. This is the same "fails open" gate RS4K uses. **Q9.**

---

## 5. The stages: order, decks, cards, pictures, readiness, placement

Per stage: grade band · decks and mode · families (the groupings, in order) · picture · "ready to move up" · how Mom places
a kid. All card lists, with backs, are in the appendices.

**Stage 1 · 🇺🇸 Symbols of America**, Pre-K and K.
Deck `American Symbols`, **flash** (picture → say it; Mom marks), `introCap:2`. 11 cards in 4 families: *Our flag and our
bird* (American flag, bald eagle) → *Famous places* (Statue of Liberty, Liberty Bell, White House, the Capitol) →
*Monuments* (Mount Rushmore, Washington Monument, Lincoln Memorial) → *Say it with your hand on your heart* (Pledge of
Allegiance, national anthem). Pledge and anthem are Mom-marked "say it" cards: the front shows the flag and a hand on a
heart, and the card is right when the kid says or sings it through. **Picture:** the flag is drawn in code (to the
4 U.S.C. §1–2 design: 13 stripes, 50 stars). The rest are NPS, USFWS and Architect of the Capitol photos (public
domain). **Ready:** all 11. **Placement:** Pre-K "start at the beginning"; K–1 a one-sitting check-up. **How-to:**
*Mom:* "Show the picture; she says what it is. Two at a time." *Kid:* "What is this?"

**Stage 2 · 🎆 Holidays & presidents to know**, K and 1st.
`American Holidays`, **flash**, `introCap:2`. The 11 federal holidays (5 U.S.C. §6103) in calendar order, in three
families: *Winter* (New Year's Day, Martin Luther King Jr Day, Presidents' Day) · *Summer* (Memorial Day, Juneteenth,
Independence Day, Labor Day) · *Fall and December* (Columbus Day, Veterans Day, Thanksgiving, Christmas Day). The picture
is a simple drawing (fireworks, a turkey, a flag at half-staff, a wreath…), and the back says what we remember (Appendix
B). Which holidays to include is Q5. — `Famous Presidents`, **flash** (portrait → say the name), 5 cards, family
*Presidents every kid knows*: George Washington · Thomas Jefferson · Abraham Lincoln · Theodore Roosevelt · **the
president now** (a card whose name Mom edits when it changes; today "Donald Trump"). These are Core Knowledge K's
"presidents, past and present", and four of them are Mount Rushmore, so the Stage 1 card has faces to point at. **Ready:**
14 of 16. **Placement:** stage pick or check-up.

**Stage 3 · ⭐ Famous Americans**, 1st–3rd.
`Famous Americans`, **flip** (portrait + name on the front → "what did they do?" on the back, one kid sentence),
`introCap:2`. 24 cards in 4 families (Appendix C): *Long ago* (Pocahontas, Squanto, Benjamin Franklin, Betsy Ross, Paul
Revere, Sacagawea) · *Freedom and fairness* (Harriet Tubman, Frederick Douglass, Susan B Anthony, Martin Luther King Jr,
Rosa Parks, Ruby Bridges) · *Inventors and explorers* (Thomas Edison, the Wright Brothers, George Washington Carver,
Amelia Earhart, Neil Armstrong) · *Helpers and heroes* (Clara Barton, Helen Keller, Jackie Robinson, Eleanor Roosevelt,
Mary McLeod Bethune, Sequoyah, Daniel Boone). Sequoyah (Cherokee) and Daniel Boone (Yadkin Valley) have NC ties.
**Picture:** a period portrait or photo (LOC, NARA, NASA, all PD). **Squanto and Sacagawea have no authentic likeness**,
so they get a drawn badge (initial plus a symbol), never an invented face (§6.2). **Ready:** 21 of 24.

**Stage 4 · 🏛 How our government works**, 2nd–4th (NC 2nd: three branches; NC 3rd: state and local; CK 4th: levels).
`Civics`, **flip** (word + picture → kid meaning), `introCap:3`. 30 words in 5 families (Appendix D): *Our country's
rules* (Constitution, law, citizen, rights, responsibilities, democracy, republic) · *Three branches* (legislative branch,
executive branch, judicial branch, Congress, President, Supreme Court, checks and balances, veto) · *Congress* (Senate,
House of Representatives, senator, representative, bill; the "bill" back is how a bill becomes a law in one line) ·
*Levels of government* (federal government, state government, local government, governor, mayor, capitol) · *Voting*
(vote, election, ballot, jury). **Picture:** a drawn three-branch tree with the right branch lit, the Capitol, White House
and Supreme Court building photos, a drawn ballot box, gavel and so on. **Ready:** 27 of 30. **Placement:** the 4th
grader's notebook already prints the three branches, so a check-up likely passes *Three branches* quickly.

**Stage 5 · 📜 Colonies, Revolution & Constitution**, 3rd–5th (CK 3rd–4th; NC 4th–5th).
Four decks, 37 cards:
- `13 Colonies`, **flash** (the colony lit on the East-coast map → say it), 13, families *New England* (4) · *Middle* (4) ·
  *Southern* (5), with North Carolina first in Southern. **Picture:** drawn from `geo.js`'s state outlines, labelled
  "today's state lines" (colonial borders differ: Massachusetts held Maine, Georgia ran west). Q12 if she wants a
  period map instead.
- **`U.S. History`**, **flip**, 10 (6 built-in): Jamestown (B) · Plymouth Colony (B) · French and Indian War · Stamp Act ·
  Boston Tea Party (B) · Revolutionary War · Declaration of Independence (B) · Articles of Confederation · Constitutional
  Convention (B) · Bill of Rights (B). Families: *Colonies* · *Road to revolution* · *A new nation*.
- `Famous Americans`, 6 founders, family *Founders*: Alexander Hamilton, John Hancock, Patrick Henry, Thomas Paine,
  Abigail Adams, Marquis de Lafayette. (Washington, Jefferson, Madison, Adams and Franklin appear as presidents or in
  Stage 3.)
- `American Battles`, **flip** (name + map pin → year · war · where · what it decided), 8, family *The Revolution*: Lexington
  and Concord · Bunker Hill · Moores Creek Bridge (NC) · Trenton · Saratoga · Kings Mountain · Guilford Courthouse (NC) ·
  Yorktown.

**Ready:** 33 of 37. **Placement:** stage pick, check-up, or **🔗 Hook up** for a kid with live `U.S. History` cards (§4.2).

**Stage 6 · ⚖️ The Bill of Rights & all 27 amendments**, 4th–6th (NC 5.C&G.2.2; CK 8th civics).
`Amendments`, **flip** ("1st Amendment" + icon → "1791 — freedom of religion, speech, the press…"), `introCap:3`, 23 cards
\+ **`U.S. History`** 13th, 14th, 15th, 19th (B) + `Civics` 3 words (amendment · ratify · Preamble). 30 cards in 5
families (Appendix F): *The Bill of Rights* (1st–10th) · *Freedom after the Civil War* (13th–15th) · *More people vote*
(17th, 19th, 23rd, 24th, 26th) · *How the government runs* (11th, 12th, 16th, 20th, 22nd, 25th, 27th) · *Prohibition, on and
off* (18th, 21st) · plus the 3 words in *Changing the Constitution*. **Picture:** a drawn icon per amendment (speech bubble
and newspaper for the 1st, ballot for the voting ones, scales, a calendar for the 20th…), and the NARA Bill of Rights scan
as the shared picture for the 10. **Ready:** 26 of 30.

**Stage 7 · 🎩 Presidents in order**, 3rd–8th (CK 4th early presidents; a lifelong list).
`Presidents`, **flip**, `introCap:3`, 47 cards named **"1st President" … "47th President"**. **Front:** the number and the
portrait. **Back:** `"George Washington · 1789–1797 · <one fact>"`. The kid says the name and Mom checks; older kids say
the fact too. Names and years match `notebooks.js`'s list exactly. The fact column is graded by band (Appendix G gives a
3rd–5th fact and a 6th–8th addition per president; Q3 decides whether the card shows one or both). Families = 8 eras:
*Founders* 1–5 · *A growing nation* 6–12 · *Toward war* 13–17 · *Rebuilding and the Gilded Age* 18–25 · *A new century*
26–31 · *Depression, war and the Cold War* 32–37 · *Into a new century* 38–43 · *Today* 44–47. **Picture:** the official
portrait or a period photo (LOC, NARA, the White House; §6). The reverse direction (name → number) is the existing
"restart the deck reversed" option, Mom's choice. In Study the **say** step fits and the typed step is off by default
(names are long). **Ready:** 42 of 47. **Placement:** stage pick by era ("knows through the Founders") or check-up; the
6th grader's President-of-the-Week exposure may pass the first families quickly.

**Stage 8 · 🗺 A growing nation & the Civil War**, 4th–7th (CK 2nd and 5th; NC 5th, 8th).
**`U.S. History`** 16 (7 built-in), in 3 families: *Westward* (Louisiana Purchase (B), Lewis and Clark Expedition, War of 1812
(B), Monroe Doctrine, Trail of Tears (B), Oregon Trail, Mexican-American War, Gold Rush (B), Alaska Purchase) ·
*Freedom* (Seneca Falls Convention, Underground Railroad) · *The Civil War and after* (Civil War (B), Emancipation
Proclamation (B), Gettysburg Address, Reconstruction (B), Transcontinental Railroad). — `American Battles` 9: *War of 1812*
(Fort McHenry, New Orleans) · *Civil War* (Fort Sumter, First Bull Run, Antietam, Gettysburg, Vicksburg, Bentonville (NC),
Appomattox Court House). **Ready:** 22 of 25.

**Stage 9 · 🌎 America in the world, 1865–today**, 6th–8th (CK 6th–8th; NC 8th).
**`U.S. History`** 18 (3 built-in), in 3 families: *A new century* (Industrial Revolution (B), Ellis Island (B),
Spanish-American War (B), World War I, Great Depression, New Deal, World War II) · *The Cold War years* (Cold War, Korean
War, Brown v Board of Education, Civil Rights Movement, Moon landing, Vietnam War, Fall of the Berlin Wall) · *Our times*
(Persian Gulf War, September 11 attacks, War in Afghanistan, Iraq War). — `American Battles` 8: *World War I* (Meuse-Argonne)
· *World War II* (Pearl Harbor, Midway, D-Day, Battle of the Bulge, Iwo Jima) · *Korea and Vietnam* (Inchon, Tet
Offensive). **Ready:** 23 of 26. Pearl Harbor is a battle card only (not also a history card) so there is no double.

**Stage 10 · 🗳 The citizen's test**, 6th and up (and a family goal).
`Civics Test`, **flip** (the question → the answer or answers USCIS accepts, in kid words; Mom judges), `introCap:3`. 124
cards = the 2025 list's 128 minus the four "your state" questions (your senators, your representative, your governor,
your state's capital). Those four go on the Stage-10 notebook page as "find out with Mom" lines, because they differ by
family and change with elections. Families follow USCIS's sections, **★ first**: *The ★ twenty* → *Principles* → *System
of government* → *Rights and responsibilities* → *Colonies and independence* → *The 1800s* → *Recent history* → *Symbols
and holidays*. Each card's back may hold more than one accepted answer ("Name one…": the back lists 2–3). Four answers
change with officeholders (President, Vice President, Speaker, Chief Justice) and carry **"(as of November 2026)"** plus a
`changes:true` flag (§10 R4). **Picture:** none by default (🗳), because a question card gives its answer away with a
picture. **Ready:** 110 of 124. Typed judging is off: answers are free-form, so the judge is Mom or "say".

None of Stages 5–10 needs a later stage to be "ready". Mom can place a kid at any stage (enroll), move up one (➡), and run
a check-up on any earlier stage at any time (CHECKUP, existing). **Stage 10 can be started straight from Stage 4 or 6** by
an older kid. It reviews everything in question form.

### 5.1 Where a kid starts

**New family (the Add card's hint and the enroll form; the roster has no grade field today, so this is a hint table, not
an automatic pick):**

| Grade | Start | How |
|---|---|---|
| Pre-K–K | Stage 1 | "Start at the beginning", 2 at a time |
| 1st | Stage 1, check-up | 11 cards, one sitting; then Stage 2 |
| 2nd | Stage 3, check-up of 1–2 first | |
| 3rd | Stage 4 | |
| 4th–5th | Stage 4 check-up → Stage 5 | |
| 6th–8th | Stage 5 (or 🔗 Hook up), then check-ups of 4 and 7 | Stage 10 is the 8th-grade goal |
| 9th+ | Stage 10, check-ups downward | |

**This family (defaults; Mom decides, Q11):**

| Kid | Start | How |
|---|---|---|
| Pre-K | Stage 1 | 2 symbols at a time. A "Symbol of the Day" box on the Pre-K daily page is optional (Q8). |
| 1st grade | Stage 1 check-up → Stage 2 | |
| 4th grade | Stage 4 check-up → Stage 5 | His Memory Work page already drills the three branches. |
| 6th grade | **🔗 Hook up at Stage 5** if he has live `U.S. History` cards; else stock enroll at Stage 5 | Then check-ups of Stages 4 and 7 at her pace; Stage 10 by 8th grade. |

---

## 6. Pictures and credits

### 6.1 Sources and licences

| Set | Source | Licence | Credit line (stored per picture in `HoweUS.credits`) |
|---|---|---|---|
| Presidents 1–31 (to 1933) | **Library of Congress Prints & Photographs** (Brady-Handy, Harris & Ewing, etc. marked "No known restrictions"), **National Archives**, period paintings on **Wikimedia Commons** tagged PD-old / PD-US | Public domain (published before 1931, or no known restrictions) | "Portrait: <artist or studio>, <year> · Library of Congress (public domain)" |
| Presidents 32–47 | **Official White House photographs** (NARA presidential libraries, whitehouse.gov) | **Public domain**: work of the US federal government (17 U.S.C. §105) | "Official White House photo, <year> · public domain" |
| — *not used* | Official **painted** portraits from the last ~90 years and National Portrait Gallery commissions (for example the 2018 Obama portrait); AP, Getty and Corbis news photos | **Copyrighted** | — |
| Famous Americans | LOC (incl. *U.S. News & World Report* collection, PD by dedication), NARA, **NASA** (PD), Smithsonian Open Access (**CC0** items only) | PD / CC0 | per picture |
| Symbols and places | **National Park Service** (Statue of Liberty, Liberty Bell, Mount Rushmore, the Mall), **US Fish & Wildlife Service** (bald eagle), **Architect of the Capitol** | PD (federal) | "Photo: National Park Service (public domain)" |
| Documents | **National Archives "America's Founding Documents"** scans: Declaration, Constitution, Bill of Rights, Articles of Confederation | PD | "National Archives (public domain)" |
| History scenes (Stage 5, 8, 9) | LOC, NARA, NASA; Trumbull's *Declaration of Independence* (Architect of the Capitol); Commons PD-old | PD | per picture |
| Flag, holiday icons, civics diagrams, amendment icons, drawn badges | **Drawn in the build** | own work, no licence needed | "Drawing: Howe Academy" |
| 13 Colonies maps, battle pins | `geo.js` (**Natural Earth**, public domain) + a pin at the battle's latitude and longitude | PD | "Map data: Natural Earth (public domain)" |

**The licence rule, in one place** (same as Geography and the sharks file): **PD, CC0 or CC BY only.** PD and CC0 are
credited anyway. CC BY needs author, licence and link on the credit. **No CC BY-SA, no "fair use", no unknown-rights
images.** Each picture's credit is stored beside it and shown wherever the unit shows credits (UNITPICS_CREDIT).

### 6.2 Picture rules for this unit

1. **No invented likenesses.** No AI images and no "artist's impression" of a real person presented as their face. If no
   authentic portrait exists (Squanto, Sacagawea; Pocahontas has the 1616 van de Passe engraving), the card gets a
   **drawn badge** (initial + a symbol: a canoe, a corn plant) and a back that says so for older kids.
2. **Battles show a map, not a fight.** Default picture = the battle's place pinned on the US map (or the world map for
   Meuse-Argonne, D-Day, Midway, Inchon…). Paintings of battles often show wounded or dead soldiers, so they are **not**
   the main picture. Mom can add one as a "more" picture per card if she wants (UNITMULTIPIC).
3. **History scenes are chosen for a 3rd-grade eye**: documents, buildings, maps, portraits, ships, trains, the Moon. No
   photos of injured people, bodies, lynching, or the attacks of September 11 themselves. The 9/11 card uses the
   memorial's two pools (NPS / Commons PD) or a drawn badge.
4. **Mom sees every photo before it ships.** USDATA's build writes a contact sheet (`us_pics_review.html`, all photos with
   credits, kept in the scratchpad, not the repo) for her yes/no. The test then pins the approved list.
5. **Size**: about 200×250 px, JPEG quality around 60, at most 14 KB each. The test fails a bigger one.

### 6.3 What the cards look like (so she can say "not that")

- **Symbol card:** a big photo, no label. Pre-K sized (≥ 220 px tall on the drill card).
- **Holiday card:** a flat drawing in one or two colours (fireworks, turkey). The back names the holiday and its month.
- **Famous American / president card:** the portrait in an oval frame. Stage 3: name under it. Stage 7: "16th" in a
  ribbon, with the name on the back.
- **Civics card:** a drawing (the three-branch tree with the asked branch lit). The word is on the front.
- **Colony card:** the East coast, the colony lit in its region colour (New England blue, Middle green, Southern orange),
  the others pale.
- **Battle card:** a US or world map with a red star at the place, the battle name on the front, and a small war badge
  (⭐ 1776, 🚢 1812, ⚔ 1861, 🌍 1918/1941, 🇰🇷, 🇻🇳).
- **Amendment card:** a number badge ("1st") and a simple icon.

---

## 7. Tracking and notebooks

**Tracking:** exactly as Geography Path §7. The Units page shows each kid as "Stage n · label · x of y on the ladder ·
learning <family>" with ➡ when ready, 🩺 check-ups for any earlier stage, and 🔗 Hook up for a kid with live
`U.S. History` cards. The kid's Units card shows the same plus rung chips. Mastery shows the decks like any deck. Scores
needs no change.

**Notebook: the unit ships with `nbInsert` on** (like Geography; it is half a notebook unit). The generic insert pages
(*This Week* with the learning cards' pictures, *Your Journey*) print at once. Slice **USNB** adds:

| Stage | Page (drawn from the same `us.js` pictures) |
|---|---|
| 1 | **Colour the flag**: an outline flag (13 stripes, the star field) and the Liberty Bell to colour. Pre-K: trace "USA". |
| 2 | **My holiday calendar**: this week's holidays to draw a line to their month. 1st grade: trace the Pledge's first line. |
| 3 | **Who am I?** This week's learning Americans' portraits with "What did they do?" lines (a drawing box for K–1). |
| 4 | **The three branches tree** to fill in from a word bank, plus **How a bill becomes a law** in 4 boxes. |
| 5 | **The 13 colonies map** to colour by region, plus a 1754–1791 timeline strip with this week's events to place. |
| 6 | **Bill of Rights match-up**: amendment numbers ↔ icons, and "Which amendment protects…?" with lines. |
| 7 | **Presidents timeline strip**: this week's family's portraits with blank name lines and years printed. |
| 8 / 9 | **Timeline**: years printed, events to write in. **Battle map**: the week's battle pins numbered, names to write. |
| 10 | **Citizen's quiz**: 10 of the kid's learning and review questions with lines, plus the four "find out with Mom" lines (my governor, my two senators, my representative, my state's capital). |

**The existing "Memory Work & Civics" page** (4th and 6th grade, `enPageMemoryCivics`). When the kid is enrolled in the US
Path:
- **President of the Week** becomes the kid's current learning `Presidents` card (or, before Stage 7, the page's own
  week cycle as today).
- **"I Can Recite These"** gains the stage's say-it items (the Bill of Rights by number at Stage 6).

Nothing changes for a kid who isn't enrolled. A snapshot test pins the other kids' pages. Both read the same 47 names and
years, pinned by a test (§9 USDATA).

---

## 8. Where she helps: her decisions, each with a default so nothing waits

| # | Hers to decide | Default if she says nothing |
|---|---|---|
| 1 | **The unit's name** on the Units tab. | **"United States Path"** 🇺🇸 (id `us_path`). |
| 2 | **First Ladies and Vice Presidents**: a deck of either? | **Neither.** Two First Ladies (Abigail Adams, Eleanor Roosevelt) in Famous Americans; the VP's job in Civics and the Civics Test. A "First Ladies" stage can be added later as Stage 11. |
| 3 | **How much each president card says**: name only, name + one fact (3rd–5th), or name + both facts (6th–8th)? | **Name · years · the 3rd–5th fact** on the card. The 6th–8th fact goes in a tap-for-more line on the Presidents' Line page (USLINE). Recent presidents get the same neutral one-line facts the notebook already prints. |
| 4 | **Which battles, and how many** (25 by default, 3 in NC: Moores Creek Bridge, Guilford Courthouse, Bentonville; plus Kings Mountain, fought just over the line by NC and other militia). Any to add (the Alamo, Little Bighorn, Chosin Reservoir) or drop? | Appendix A as written. Map pins, not paintings. |
| 5 | **Holidays**: all 11 federal ones, including Columbus Day and Christmas Day? Add Flag Day, Constitution Day, Earth Day? | **All 11 federal holidays, nothing else.** |
| 6 | **The Civics Test stage**: all 124 questions, or only the ★ twenty plus the ones the earlier stages don't already teach? | **All 124**, ★ twenty first, readyAt 110. |
| 7 | **Hard history in kid words**: slavery, the Trail of Tears, Native American wars, assassinations, 9/11. Wording and grade band per card (Appendix E). | Factual, one line, no graphic detail. Stage 8–9 cards are for 4th grade and up. "Was killed" (not how) for Lincoln, Garfield, McKinley and Kennedy, on the 6th–8th line only. |
| 8 | **Pre-K daily page**: a "Symbol of the Day" box like Shape of the Day? | **Off.** It can be added in USNB. |
| 9 | **History books**: which history curriculum each kid uses this year, and whether any stage should wait for it. | **No gate.** USBOOK is built only if she names a book and wants it. |
| 10 | **Geography overlap**: move Statue of Liberty, Mount Rushmore and Washington Monument out of Geography Path's (unbuilt) Stage 10 Landmarks, since they are Stage 1 symbols here? | **Yes, move them.** Geography Landmarks keeps the natural and world landmarks. |
| 11 | **Where each kid starts** and check-up sizes. | §5.1. Check-up per day by grade (existing): K–1 3 · 2–3 5 · 4–5 8 · 6+ 10. |
| 12 | **13 Colonies map**: today's state lines (from `geo.js`) or a period map? | **Today's lines**, labelled so. |
| 13 | **The Pledge wording**: the official text (4 U.S.C. §4, "one Nation under God") as the notebook page already prints it. | **Official text**, as the notebook has it. |
| 14 | **Order of the stages**: Presidents (7) before or after the 1800s? Famous Americans before or after Civics? | §5 order. A kid can be placed anywhere, so the order only sets the ➡. |

She can answer any of these in a sentence. The build reads the lists from this file's appendices, so a change is a list
edit, not a redesign.

---

## 9. Build plan: slices, one branch and one test each

Order: **a Pre-K kid can start after slice 2**. **The adopting `U.S. History` deck and its hook-up land in one slice**, so
the stock enroll is closed for a kid with live cards the moment the deck exists. **Nothing gets ＋ Added before STARTERUP**
(or before slice 6). Otherwise a family that adds the unit early is frozen at its first stages, which is Geography's open
issue.

| # | Slice (block name) | What lands | Test | Notes |
|---|---|---|---|---|
| 0 | **STARTERUP** (shared with Geography) | A Mom-only "＋ Add the new stages (n new cards)" row on a starter unit whose code record has stages or cards the family copy lacks. Pure plan, create-only per new deck or card index, one multi-path update, never touching an existing card, back or kid. | `test_starter_update.js`: a v1 record + v3 code → only the new stages appended; the family's edits are kept; dry run inert | **Her call** whether this or "hold ＋ Add until slice 6" (Q-default: build it, since it unblocks Geography's Stages 4–7 for families who already added it). |
| 1 | **USDATA** | `tools/build_us_js.py` + `us.js` (lists A–H, drawn SVGs, pins, credits) + `us_pics_1.js` / `us_pics_2.js` + `perf_budget.json` lazy entries. The photo contact sheet for her yes. | `test_us_data.js`: every name passes `mastDefKeyOk`; no front repeats across the unit's decks; **the 20 (B) names and backs byte-identical to `MAST_LINCOLN_BANK` / `MAST_VOCAB_DEFS`**; **the 47 presidents' names and years identical to `notebooks.js` `LN_EXTRA.enrich.presidents`**; every card has a picture + credit (Civics Test excepted); licences ∈ {PD, CC0, CC BY}; photo ≤ 14 KB; file caps; **a report of which 2025 USCIS questions no earlier card teaches** (pinned, so a change is seen); no kid or family name in any file | No app behaviour change. Internet once (LOC, NARA, Commons, NPS downloads). |
| 2 | **USPATH** | `STARTER_UNITS.us_path` (Stages 1–4); `STARTER_LAZY` + the Add wait; `picsInCode:"us"`, `usHydrate`, `codePicsHydrateAll`; `HA_LAZY_FILES.us/us_pics_1/us_pics_2`; `STARTER_HOWTO` for the 5 decks; `nbInsert` on | `test_us_path.js`: Add waits for `us.js` and writes one create-only record; enroll a Pre-K kid at Stage 1 → 2 learning, 11 in the bank; pictures resolve through `_unitPortrait` and `_mastVisNorm`; no picture data in the record or any item; ➡ Stage 2 seeds only Stage 2; dry run writes nothing; `geoHydrate` output byte-identical | **The Pre-K and 1st-grade kids can start.** |
| 3 | **USPRES** | Stage 7 (`Presidents`, 47) + the "president now" note on Famous Presidents | extends `test_us_path.js`: 47 cards once each, eras in order, Cleveland and Trump as two numbers each with the same portrait string (memo) | Pure content. ➡ after Stage 4 goes to Stage 7 until slice 4 adds 5–6. |
| 4 | **USHIST** ⚠️ | Stages 5, 6, 8, 9: `U.S. History` (48, 20 built-in), `13 Colonies`, `American Battles`, `Amendments`, the Famous Americans and Civics shares. `usAdoptSpec`; `UA_SPEC_FNS`; the built-in-list duplicate check in `_ustApply` if needed | `test_us_adopt.js`: fixture kids shaped like a built-in `U.S. History` deck (0, 6, 13 and 20 live cards) → **zero card writes**, only `enrolled` + `kidStage` (+ non-built-in appends); stage = lowest live; later cards kept; strays kept; no definitions write for the 20; stock "+ Kid" closed; dry run inert. A kid with the built-in list and **no** live cards → stock enroll with **no duplicate bank names**. `test_geo_adopt*` unchanged. | **Riskiest slice**: it touches a live kid's existing deck. The plan is pure and shown before Yes. Ship outside school hours. |
| 5 | **USCIVTEST** | Stage 10 (`Civics Test`, 124) | extends `test_us_data.js`: 124 = 128 − 4; ★ family = USCIS's starred list; every `changes:true` card listed | Pure content. |
| 6 | **USNB** | `notebooks.js` stage pages (§7) and the Memory Work page swap for an enrolled kid | `test_us_notebook.js`: pages render with no `.page` overflow (measured in the in-app browser per the notebook rule); a non-enrolled kid's notebook is byte-identical | Notebook-only. |
| 7 | **USLINE** (optional) | A "Presidents' Line" page like the Royal Line (`showMonarchBio`): every portrait in order, tap → the 3rd–5th and 6th–8th facts | `test_us_line.js` | Hers to want. |
| 8 | **USBOOK** (optional) | `UNIT_BOOK_MAPS` row(s) with `byName` week lists for her named history book | `test_unit_stages.js` gains a `byName` case | Only if she names the book (Q9). |
| 9 | **USCHECK** (optional) | `hard` hints for check-up quick picks (the 1840s–1850s presidents, the 11th, 12th, 20th and 27th amendments) | `test_checkup_us.js` | Can ride with GEOCHECK. |

Each slice: one branch off `main`, its block marked `// US…_START — <her words + date> … // US…_END`, every write targeted
and through `db` only when `db && !_dryRun()`, the full test suite green, and `test_perf_budget.js` green (data in the
lazy files, not `index.html`).

---

## 10. Risks

| # | Risk | What the design does |
|---|---|---|
| R1 | **The 6th grader's live `U.S. History` cards are unknown** (no database read allowed). | The hook-up is data-driven: any live shape gets a plan she reads before Yes. The test replays 0, 6, 13 and 20 live cards. USHIST's builder may take one read-only look **only if she asks**. |
| R2 | **Built-in list but no live cards** may make the stock enroll append duplicate bank names. | Checked and fixed in USHIST (`_builtIn` widened), with a test. |
| R3 | **`definitions` is keyed by card front across all decks.** | Fronts are unique across the unit (test). The four overlapping amendments stay in `U.S. History`. The GEOADOPT guard keeps any saved back. |
| R4 | **Answers that change**: the President (Stage 2, Civics Test), Vice President, Speaker (may change 2027-01-03 after the November 2026 midterms), Chief Justice. | Backs say "(as of November 2026)", cards carry `changes:true`, and Mom edits on the card sheet. `test_us_data.js` lists them so a future session knows where to look. The notebook's own "now" lines are hers. |
| R5 | **Hard history and recent politics.** | One factual line per card, no graphic detail, no casualty numbers below Stage 9, and the same neutral one-line facts for every recent president the notebook already uses. Mom reviews Appendices E–G before USDATA. |
| R6 | **Picture rights.** | PD / CC0 / CC BY whitelist enforced by test. No modern painted portraits, no news-agency photos (the Iwo Jima flag-raising photo is AP, so a map pin is used), no AI faces. |
| R7 | **Page weight.** | 1.5 MB of photos, lazy and split so a Pre-K-only family loads 0.45 MB. Memoised hydrate. Never in the database. |
| R8 | **Create-only records.** | STARTERUP (slice 0) or hold ＋ Add until slice 6. |
| R9 | **Long civics answers vs typed judging.** | Typed is off for `Civics Test` and `Presidents`; say/Mom judge. |
| R10 | **Card names with periods** (U.S., Jr., v.). | Names avoid them (test); backs keep them. |

---

## 11. Open questions (each with a default; the full list is §8)

| # | Question | Default |
|---|---|---|
| Q1 | Unit name | **United States Path** |
| Q2 | First Ladies / VPs | **Neither as decks** |
| Q3 | Presidents' card back | **Name · years · one 3rd–5th fact** |
| Q4 | Battles list | **Appendix A's 25** (3 in NC + Kings Mountain), map pins |
| Q5 | Holidays | **The 11 federal holidays** |
| Q6 | Civics Test size | **All 124**, ★ twenty first |
| Q9 | History book gate | **None** until she names the book |
| Q10 | Geography Landmarks overlap | **Move the three monuments here** |
| Q11 | Starting stages | §5.1 |
| — | STARTERUP vs "hold ＋ Add" | **Build STARTERUP** (it also fixes Geography) |

---

## Appendix A — American Battles (25; flip; back = year · war · where · what it decided)

**The Revolution (Stage 5):** Lexington and Concord — 1775 · Revolution · Massachusetts · the first shots of the war ·
Bunker Hill — 1775 · Massachusetts · the British took the hill but learned the colonists would stand and fight · Moores
Creek Bridge — 1776 · North Carolina · Patriots stopped Loyalists marching to the coast · Trenton — 1776 · New Jersey ·
Washington crossed the icy Delaware on Christmas night and won · Saratoga — 1777 · New York · an American win that
brought France in as an ally · Kings Mountain — 1780 · South Carolina · frontier Patriots, many from North Carolina,
beat a Loyalist army · Guilford Courthouse — 1781 · North Carolina · the British held the field but were worn down and
left for Virginia · Yorktown — 1781 · Virginia · the British army surrendered; the war's last big battle.

**The War of 1812 and the Civil War (Stage 8):** Fort McHenry — 1814 · War of 1812 · Maryland · the fort held, and Francis
Scott Key wrote "The Star-Spangled Banner" · New Orleans — 1815 · Louisiana · Andrew Jackson's big win, fought just after
the peace treaty was signed · Fort Sumter — 1861 · Civil War · South Carolina · the first shots of the Civil War · First
Bull Run — 1861 · Virginia · a Confederate win that showed the war would be long · Antietam — 1862 · Maryland · stopped
Lee's push north and led to the Emancipation Proclamation · Gettysburg — 1863 · Pennsylvania · a Union win and the war's
turning point · Vicksburg — 1863 · Mississippi · the Union won control of the Mississippi River · Bentonville — 1865 ·
North Carolina · the largest battle ever fought in North Carolina · Appomattox Court House — 1865 · Virginia · Lee
surrendered to Grant, ending the war's main fighting.

**The twentieth century (Stage 9):** Meuse-Argonne — 1918 · World War I · France · the biggest American battle of the war;
it helped end it · Pearl Harbor — 1941 · World War II · Hawaii · a surprise attack that brought the US into the war ·
Midway — 1942 · the Pacific · a US Navy win that turned the war in the Pacific · D-Day — 1944 · France · the Allies landed
in Normandy to free Europe · Battle of the Bulge — 1944–1945 · Belgium · Germany's last big attack in the west failed ·
Iwo Jima — 1945 · Japan · US Marines took the island; the famous flag-raising · Inchon — 1950 · Korean War · Korea · a
landing behind enemy lines that turned the war · Tet Offensive — 1968 · Vietnam War · Vietnam · a surprise attack that
turned many Americans against the war.

## Appendix B — Symbols (Stage 1) and holidays and presidents to know (Stage 2)

**American Symbols (11, flash):** American flag · bald eagle · Statue of Liberty · Liberty Bell · White House · the Capitol
· Mount Rushmore · Washington Monument · Lincoln Memorial · Pledge of Allegiance · national anthem. (Backs for a later
flip pass, kid words: "our flag — 13 stripes for the first 13 colonies, 50 stars for the 50 states"; "our national bird";
"a gift from France, in New York Harbor"; "rang in Philadelphia for freedom; it has a crack"; "where the President lives
and works"; "where Congress makes the laws"; "four presidents carved in a mountain"; "a tall stone tower for George
Washington"; "a giant statue of Abraham Lincoln"; "a promise to be loyal to our flag and country"; "'The Star-Spangled
Banner'".)

**American Holidays (11, flash; back = what we remember · month):** New Year's Day — the start of a new year · January ·
Martin Luther King Jr Day — a leader who worked for fair laws for everyone · January · Presidents' Day — George Washington's
birthday and all our presidents · February · Memorial Day — remembering soldiers who died for our country · May ·
Juneteenth — the day in 1865 the last enslaved people in Texas learned they were free · June · Independence Day — our
country's birthday, July 4, 1776 · July · Labor Day — honoring workers · September · Columbus Day — Columbus reached the
Americas in 1492 · October · Veterans Day — thanking everyone who served in our military · November · Thanksgiving —
giving thanks; remembering the Pilgrims' harvest feast · November · Christmas Day — a holiday celebrating the birth of
Jesus · December.

**Famous Presidents (5, flash):** George Washington · Thomas Jefferson · Abraham Lincoln · Theodore Roosevelt · Donald Trump
(the president now; Mom edits when it changes).

## Appendix C — Famous Americans (30, flip; back = what they did)

**Stage 3 · Long ago:** Pocahontas — a Powhatan girl who helped the Jamestown settlers and their people make peace for a
time · Squanto — showed the Pilgrims how to plant corn and where to fish in their first year · Benjamin Franklin — inventor, writer and
founder; he flew a kite to study lightning · Betsy Ross — a Philadelphia flag maker; a famous story says she sewed the
first flag · Paul Revere — rode at night to warn "the British are coming" · Sacagawea — a Shoshone woman who helped guide
Lewis and Clark. **Freedom and fairness:** Harriet Tubman — escaped slavery, then led others to freedom on the Underground
Railroad · Frederick Douglass — escaped slavery and spoke and wrote against it · Susan B Anthony — worked for women's right
to vote · Martin Luther King Jr — led peaceful marches for equal rights · Rosa Parks — would not give up her bus seat, and
helped start the bus boycott · Ruby Bridges — at six, the first Black child at her New Orleans elementary school.
**Inventors and explorers:** Thomas Edison — invented the phonograph and a long-lasting light bulb · Wright Brothers — flew
the first airplane, at Kitty Hawk, North Carolina, 1903 · George Washington Carver — a scientist who found hundreds of
uses for peanuts · Amelia Earhart — the first woman to fly alone across the Atlantic · Neil Armstrong — the first person to
walk on the Moon. **Helpers and heroes:** Clara Barton — a Civil War nurse who started the American Red Cross · Helen
Keller — blind and deaf, she learned to read, write and speak, and helped others · Jackie Robinson — the first Black player
in modern Major League Baseball · Eleanor Roosevelt — First Lady who spoke up for human rights · Mary McLeod Bethune — a
teacher who started a school and a college for Black students · Sequoyah — made a writing system for the Cherokee language
· Daniel Boone — explored and blazed a trail west from North Carolina into Kentucky.

**Stage 5 · Founders:** Alexander Hamilton — wrote most of the Federalist Papers; first Treasury Secretary · John Hancock —
signed the Declaration first and biggest · Patrick Henry — "Give me liberty, or give me death!" · Thomas Paine — wrote
*Common Sense*, urging independence · Abigail Adams — wrote to her husband John to "remember the ladies" · Marquis de
Lafayette — a young French officer who fought beside Washington.

## Appendix D — Civics words (33, flip)

**Stage 4 · Our country's rules:** Constitution — the supreme law: the plan for our government · law — a rule everyone must
follow · citizen — a member of a country, with rights and duties · rights — freedoms that belong to you · responsibilities —
things a good citizen should do · democracy — the people rule, by voting · republic — people choose leaders to make laws for
them. **Three branches:** legislative branch — makes the laws (Congress) · executive branch — carries out the laws (the
President) · judicial branch — decides what the laws mean (the courts) · Congress — the Senate and the House together ·
President — leads the executive branch and the military · Supreme Court — the highest court in the country · checks and
balances — each branch can stop the others from getting too much power · veto — the President says no to a bill.
**Congress:** Senate — 100 senators, 2 from every state · House of Representatives — 435 members; bigger states have more ·
senator — elected for 6 years to the Senate · representative — elected for 2 years to the House · bill — an idea for a law:
both houses vote yes, then the President signs it (or vetoes it). **Levels of government:** federal government — the
national government in Washington DC · state government — runs each state, led by a governor · local government — runs a
town, city or county · governor — the leader of a state · mayor — the leader of a city or town · capitol — the building
where lawmakers meet. **Voting:** vote — choose by marking a ballot · election — when people vote for leaders · ballot — the
paper or screen you vote on · jury — citizens who decide a trial.

**Stage 6 · Changing the Constitution:** amendment — a change or addition to the Constitution · ratify — to officially
approve · Preamble — the opening "We the People…" that says why the Constitution was written.

## Appendix E — `U.S. History` (48, flip; (B) = built-in card, back byte-identical to `MAST_VOCAB_DEFS`)

**Stage 5 (10):** Jamestown (B) · Plymouth Colony (B) · French and Indian War — 1754–1763 — Britain and the colonists fought
France; Britain's war debts led to new taxes · Stamp Act — 1765 — a British tax on paper; colonists cried "no taxation
without representation" · Boston Tea Party (B) · Revolutionary War — 1775–1783 — the 13 colonies won independence from
Britain · Declaration of Independence (B) · Articles of Confederation — 1781 — the first plan of government; it was too
weak · Constitutional Convention (B) · Bill of Rights (B).
**Stage 6 (4):** 13th Amendment (B) · 14th Amendment (B) · 15th Amendment (B) · 19th Amendment (B).
**Stage 8 (16):** Louisiana Purchase (B) · Lewis and Clark Expedition — 1804–1806 — explored the West to the Pacific ·
War of 1812 (B) · Monroe Doctrine — 1823 — told Europe not to start new colonies in the Americas · Trail of Tears (B) ·
Oregon Trail — 1840s — wagon trains carried families 2,000 miles west · Mexican-American War — 1846–1848 — the US gained
California and the Southwest · Gold Rush (B) · Alaska Purchase — 1867 — the US bought Alaska from Russia · Seneca Falls
Convention — 1848 — the first big meeting for women's rights · Underground Railroad — 1800s — secret routes and helpers
leading enslaved people to freedom · Civil War (B) · Emancipation Proclamation (B) · Gettysburg Address — 1863 —
Lincoln's short speech about "government of the people, by the people, for the people" · Reconstruction (B) ·
Transcontinental Railroad — 1869 — railroad tracks joined the East and the West.
**Stage 9 (18):** Industrial Revolution (B) · Ellis Island (B) · Spanish-American War (B) · World War I — 1914–1918 — the US
joined in 1917 and helped the Allies win · Great Depression — 1929–1930s — banks failed and millions lost jobs · New Deal —
1930s — Franklin Roosevelt's programs to put people back to work · World War II — 1939–1945 — the US joined after Pearl
Harbor; the Allies won · Cold War — 1947–1991 — a long standoff between the US and the Soviet Union, without a war
between them · Korean War — 1950–1953 — the US helped South Korea stay free · Brown v Board of Education — 1954 — the
Supreme Court ruled that segregated public schools were unconstitutional · Civil Rights Movement — 1950s–1960s — Americans
worked peacefully for equal rights for Black Americans · Moon landing — 1969 — Apollo 11; Neil Armstrong walked on the
Moon · Vietnam War — 1960s–1973 — the US fought to stop communism in South Vietnam · Fall of the Berlin Wall — 1989 — the
wall dividing Berlin came down; the Cold War was ending · Persian Gulf War — 1991 — the US led a coalition to free Kuwait
from Iraq · September 11 attacks — 2001 — terrorists attacked New York and Washington; the country came together · War in
Afghanistan — 2001–2021 — the US fought the group behind the 9/11 attacks · Iraq War — 2003–2011 — the US-led war that
removed Iraq's dictator.

## Appendix F — Amendments (27; `Amendments` deck = 23, the four (B) are `U.S. History`)

**The Bill of Rights (1791):** 1st — freedom of religion, speech and the press, to gather peacefully, and to ask the
government to fix things · 2nd — the right to keep and bear arms · 3rd — soldiers can't be made to live in your home in
peacetime · 4th — no unreasonable searches; police usually need a warrant · 5th — rights when accused: no trial twice for
the same crime, and you don't have to speak against yourself · 6th — a speedy, public trial with a jury and a lawyer · 7th
— a jury trial in many money disagreements · 8th — no cruel and unusual punishment or unfair bail · 9th — people have
more rights than the ones listed · 10th — powers not given to the national government belong to the states or the people.
**Freedom after the Civil War:** 13th (B) · 14th (B) · 15th (B).
**More people vote:** 17th — 1913 — people vote directly for their senators · 19th (B) · 23rd — 1961 — people in Washington
DC can vote for president · 24th — 1964 — no paying a tax to vote in federal elections · 26th — 1971 — citizens 18 and
older can vote.
**How the government runs:** 11th — 1795 — limits lawsuits against a state in federal court · 12th — 1804 — electors vote
for president and vice president separately · 16th — 1913 — Congress can collect an income tax · 20th — 1933 — a new
president starts January 20, Congress January 3 · 22nd — 1951 — a president can be elected only twice · 25th — 1967 — who
takes over if the president can't serve · 27th — 1992 — a pay raise Congress gives itself waits until after the next
election.
**Prohibition, on and off:** 18th — 1919 — banned making and selling alcohol · 21st — 1933 — ended the 18th Amendment.

## Appendix G — Presidents (47; card back = name · years · the 3rd–5th fact; 6th–8th adds the second fact)

Names and years are exactly `notebooks.js` `LN_EXTRA.enrich.presidents`. The 3rd–5th fact is that list's one line (kid-safe,
already printed for the 6th grader), shortened where needed.

| # | President · years | 6th–8th adds |
|---|---|---|
| *Founders* 1 | George Washington · 1789–1797 | Presided over the Constitutional Convention; warned against political parties in his Farewell Address |
| 2 | John Adams · 1797–1801 | A lawyer and diplomat; kept the country out of a war with France |
| 3 | Thomas Jefferson · 1801–1809 | Sent Lewis and Clark west |
| 4 | James Madison · 1809–1817 | Wrote the Bill of Rights; the British burned Washington in 1814 |
| 5 | James Monroe · 1817–1825 | The "Era of Good Feelings"; the Missouri Compromise |
| *A growing nation* 6 | John Quincy Adams · 1825–1829 | Earlier wrote much of the Monroe Doctrine as Secretary of State |
| 7 | Andrew Jackson · 1829–1837 | Signed the Indian Removal Act, which led to the Trail of Tears |
| 8 | Martin Van Buren · 1837–1841 | The Panic of 1837, a hard economic time |
| 9 | William Henry Harrison · 1841 | Died of illness a month into his term |
| 10 | John Tyler · 1841–1845 | Texas joined the Union |
| 11 | James K. Polk · 1845–1849 | The Mexican-American War; the Oregon Territory |
| 12 | Zachary Taylor · 1849–1850 | Died in office; the fight over slavery in the new lands grew |
| *Toward war* 13 | Millard Fillmore · 1850–1853 | Signed the Compromise of 1850 |
| 14 | Franklin Pierce · 1853–1857 | The Kansas-Nebraska Act deepened the split over slavery |
| 15 | James Buchanan · 1857–1861 | Southern states began to leave the Union |
| 16 | Abraham Lincoln · 1861–1865 | The Emancipation Proclamation and the Gettysburg Address; was killed in 1865, days after the war's end |
| 17 | Andrew Johnson · 1865–1869 | Fought with Congress over Reconstruction; Alaska was bought |
| *Rebuilding and the Gilded Age* 18 | Ulysses S. Grant · 1869–1877 | Reconstruction; the Transcontinental Railroad was finished |
| 19 | Rutherford B. Hayes · 1877–1881 | Reconstruction ended |
| 20 | James A. Garfield · 1881 | Was killed months after taking office |
| 21 | Chester A. Arthur · 1881–1885 | The Pendleton Act: government jobs by test, not favours |
| 22 | Grover Cleveland · 1885–1889 | The Statue of Liberty was dedicated |
| 23 | Benjamin Harrison · 1889–1893 | Six states joined, more than under any other president |
| 24 | Grover Cleveland · 1893–1897 | The Panic of 1893 |
| 25 | William McKinley · 1897–1901 | Hawaii became a US territory; was killed in 1901 |
| *A new century* 26 | Theodore Roosevelt · 1901–1909 | Started the Panama Canal; won the Nobel Peace Prize |
| 27 | William Howard Taft · 1909–1913 | "Trust-busting": broke up giant companies |
| 28 | Woodrow Wilson · 1913–1921 | Planned the League of Nations; women won the vote (19th Amendment) |
| 29 | Warren G. Harding · 1921–1923 | Died in office; his staff's scandals came out after |
| 30 | Calvin Coolidge · 1923–1929 | The Roaring Twenties |
| 31 | Herbert Hoover · 1929–1933 | The stock market crash of 1929 |
| *Depression, war and the Cold War* 32 | Franklin D. Roosevelt · 1933–1945 | The New Deal; led until his death in 1945. The 22nd Amendment came after him. |
| 33 | Harry S. Truman · 1945–1953 | The Marshall Plan rebuilt Europe; the Korean War began |
| 34 | Dwight D. Eisenhower · 1953–1961 | Sent troops so Black students could attend Little Rock Central High |
| 35 | John F. Kennedy · 1961–1963 | The Cuban Missile Crisis; was killed in 1963 |
| 36 | Lyndon B. Johnson · 1963–1969 | The Voting Rights Act; the Vietnam War grew |
| 37 | Richard Nixon · 1969–1974 | The Moon landing happened on his watch; resigned over Watergate |
| *Into a new century* 38 | Gerald Ford · 1974–1977 | Became president when Nixon resigned |
| 39 | Jimmy Carter · 1977–1981 | The Camp David Accords between Egypt and Israel |
| 40 | Ronald Reagan · 1981–1989 | Worked with the Soviet leader to cut nuclear weapons |
| 41 | George H. W. Bush · 1989–1993 | The Persian Gulf War |
| 42 | Bill Clinton · 1993–2001 | The federal budget was balanced for the first time in about 30 years |
| 43 | George W. Bush · 2001–2009 | The War in Afghanistan and the Iraq War |
| *Today* 44 | Barack Obama · 2009–2017 | The Affordable Care Act |
| 45 | Donald Trump · 2017–2021 | Appointed three Supreme Court justices |
| 46 | Joe Biden · 2021–2025 | Brought the last US troops home from Afghanistan in 2021 |
| 47 | Donald Trump · 2025– | The second president to serve two terms that were not back-to-back (after Grover Cleveland) |

The 6th–8th column is the column most worth her read (Q3, Q7). Recent presidents get one neutral, checkable fact each.

## Appendix H — Civics Test (124 of the 2025 USCIS 128; flip)

Built from USCIS form M-1778 (09/25), a public-domain US government work, with the question kept and the answer rewritten
in kid words, 1–3 accepted answers per back. Left out (they go on the notebook page): "Who is one of your state's U.S.
senators now?", "Name your U.S. representative.", "Who is the governor of your state now?", "What is the capital of your
state?" Families and counts: *The ★ twenty* (USCIS's starred questions, pulled out first) · *Principles of American
Government* · *System of Government* · *Rights and Responsibilities* · *Colonial Period and Independence* · *1800s* ·
*Recent American History* · *Symbols and Holidays*. The build script pulls the 128 from the USCIS PDF, the kid-word
answers are written in USDATA, and she reviews them in the same contact sheet as the photos. `changes:true`: the President,
Vice President, Speaker of the House and Chief Justice questions.

---

## 12. Sources

**Standards and what's taught**
- NC DPI, *North Carolina Standard Course of Study, Social Studies* (approved 2021-02-04), grade-level *Quick Reference
  Guides* (2025 edition), grades 1, 2, 3, 4, 5, 8: https://www.dpi.nc.gov/documents/publications/catalog/is184-quick-reference-guide-1st/open
  (and `is185…2nd`, `is186…3rd`, `is187…4th`, `is188…5th`, `is191…8th`). Grade 6–7 titles from `is189`/`is190`. The K
  guide link did not return a PDF; K content is from the NCDPI K–8 parent guide description.
- NC DPI Social Studies standards and crosswalks: https://www.dpi.nc.gov/social-studies-strand-maps-fall-2021-implementation/open
- NC Division of Non-Public Education, home school requirements: https://www.doa.nc.gov/divisions/non-public-education/home-schools
- Core Knowledge Foundation, *Core Knowledge Sequence: History and Geography K–8* (copy hosted by UTC):
  https://utc.edu/sites/default/files/2021-01/coreknowledgehistoryandgeographyk8sequence.pdf ·
  https://www.coreknowledge.org/k-8-sequence/

**Civics test**
- USCIS, *2025 Civics Test — 128 Civics Questions and Answers* (M-1778, 09/25):
  https://www.uscis.gov/sites/default/files/document/questions-and-answers/2025-Civics-Test-128-Questions-and-Answers.pdf
- USCIS, 2025 civics test page and test updates: https://www.uscis.gov/citizenship-resource-center/naturalization-test-and-study-resources/2025-civics-test ·
  https://www.uscis.gov/citizenship/testupdates
- USCIS, *2008 Civics Test — 100 Questions*: https://www.uscis.gov/sites/default/files/document/questions-and-answers/100q.pdf
- Explainer on the 2025 change (filing on/after 2025-10-20; 20 asked, 12 to pass):
  https://cilawgroup.com/news/2025/10/09/explainer-changes-to-the-u-s-naturalization-civics-test-implements-new-2025-standards/ ·
  https://www.proliteracy.org/news/what-to-know-about-the-2025-updates-to-the-us-citizenship-civics-test/

**Law and documents cited on cards**
- 4 U.S.C. §§1–4 (flag design; the Pledge): https://www.law.cornell.edu/uscode/text/4/chapter-1
- 5 U.S.C. §6103 (federal holidays): https://www.law.cornell.edu/uscode/text/5/6103
- National Archives, *America's Founding Documents* (Declaration, Constitution, Bill of Rights, Amendments 11–27):
  https://www.archives.gov/founding-docs
- 17 U.S.C. §105 (US government works are not copyrighted): https://www.law.cornell.edu/uscode/text/17/105

**Pictures**
- Library of Congress Prints & Photographs, rights and restrictions: https://www.loc.gov/pictures/ ·
  https://www.loc.gov/rr/print/195_copr.html
- National Archives catalog: https://catalog.archives.gov/
- National Park Service media: https://www.nps.gov/media/ · US Fish & Wildlife Service National Digital Library:
  https://digitalmedia.fws.gov/
- NASA image use guidelines: https://www.nasa.gov/nasa-brand-center/images-and-media/
- Architect of the Capitol: https://www.aoc.gov/
- Smithsonian Open Access (CC0 items only): https://www.si.edu/openaccess
- Wikimedia Commons licensing (PD-US, PD-USGov, PD-old, CC0, CC BY): https://commons.wikimedia.org/wiki/Commons:Licensing
- Natural Earth (map data, public domain, via `geo.js`): https://www.naturalearthdata.com/about/terms-of-use/

**In the repo**
- `PLAN_geography_path_2026-11-10.md` (branch `claude/geo-path-design-5e84e8`), the model for this file.
- `index.html` at 5195e53c: STARTER_UNITS, UNIT_STAGES, UNITATTACH, GEOPATH, GEOSTATES, GEOADOPT, PUTSCHED, UNITBOOK,
  `MAST_LINCOLN_BANK`, `MAST_VOCAB_DEFS`. `notebooks.js`: `enPageMemoryCivics`, `LN_EXTRA.enrich`, `unitMonarchyPages`.
  `test_family_lessons.js` and `test_fam_makeup_roles.js` (a beta family's BiblioPlan "Presidents" day).

*No app file was changed for this document. No live data was read or written.*
