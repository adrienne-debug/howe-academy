/*
 * test_new_family_clean.js — the NEW-FAMILY RENDER CHECK (slice 0 of DESIGN_new_family_walkthrough_2026-11-24, Part 4).
 *
 * A brand-new family must not be shown the Howe family's own things. This test boots the WHOLE app (the repo's sandbox,
 * test_fixtures/demo_week_sandbox.js: fake page, in-memory pretend database, no network) as a MADE-UP family (Nora, Teo)
 * with an EMPTY database and Mom mode on, draws the pages of the design's sweep (1.2), taps the set-up buttons (Mom's first
 * chore, 📥 Bring in, 🏡 Take over, the first room) and searches every page and every saved value for Howe's words:
 * Howe's kids, Howe's 8 Mom chores, Howe's rooms, Howe's pets, Howe's Up for Grabs jobs, the built-in cycle date, the
 * built-in Mom / Dad codes, and the "Morning routine not done" alarm for kids who have no morning list (1.2 #11).
 *
 * Howe's words are READ FROM THE APP at run time (a second boot as Howe): the code roster (FAMILY_DEFAULT), MC_DEFAULT,
 * HH_ROOMS, GRAB_DEFAULT, the Howe-only routine lists (RT_DEFAULT), wellnessCycle, APP_PIN / DAD_PIN. Only two pet names
 * are typed here — they live only inside the Bring-in guessing rules (1.2 #10), in no default list.
 *
 * KNOWN: what a new family still sees today, item by item (design 1.2 numbers). Each known item must STILL be found (so the
 * test proves it can see it) — when a slice fixes one, this test fails until that slice takes it off the list. Anything
 * found that is NOT on the list fails as a new leak. The Howe boot checks Howe still gets its own things.
 *
 * Not drawn (cannot be drawn in Node, or off for a new family): the lazy side pages (School Room play.js, notebooks.js, eic.js,
 * library.js, classes.js), Kids' Corner drills and games, and anything that only appears after a tap sequence other than the
 * ones below. Pages are read as text, not pixels.
 *   node test_new_family_clean.js            (NEWFAM_INDEX / NEWFAM_HOUSE: another copy of index.html / house.js, for a fault run)
 */
"use strict";
process.env.TZ = "America/New_York";
const fs = require("fs"), path = require("path"), vm = require("vm");
const S = require(path.join(__dirname, "test_fixtures", "demo_week_sandbox.js"));
const INDEX = process.env.NEWFAM_INDEX || path.join(__dirname, "index.html");
const HOUSE = process.env.NEWFAM_HOUSE || path.join(__dirname, "house.js");
const LAZY = ["house.js", "seasons.js", "gifts.js", "wishes.js", "bigmeal.js", "esa.js", "seasonkid.js"];   // run in the page the way their <script> tag would
const VERBOSE = process.argv.includes("-v");

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; if (VERBOSE) console.log("  ✓ " + m); } else { fail++; console.log("  ✗ " + m); } };

// ── KNOWN: what a new family is still shown today ──────────────────────────────────────────────────────────────────────
// {item: design 1.2 #, what, cat (which Howe words), pages (each must still show it), near (optional: the words around the hit)}
// A later slice that fixes an item takes its line off this list.
// Off the list: #1 Howe's 8 Mom chores (slice 1, MCNEWFAM — test_newfam_mom_list_empty.js); with them went the rows Bring in
// copied, so the "give to Lucy" hint and the room pickers on those rows went too. #3 the cycle date was already clean (CYCLEOWN).
const AB = v => "After Bring in · Household ▸ " + v, AT = v => "After Take over · " + v;
const KNOWN = [
  { item: "1k", what: "Kitchen tab hint names Howe's chore: \"when you tick your 🌙 Kitchen close-down\" (fixed wording, shown with no such chore)", cat: "momChore", pages: ["Household ▸ kitchen"], near: /when you tick your/ },
  { item: "2", what: "Howe's room layout in every Room picker and filter", cat: "room",
    pages: ["Household ▸ person", "Household ▸ laundry", "Household ▸ + Add a chore", "By person", AB("person"), AB("laundry"), AT("By person ▸ Mom"), AT("By person ▸ kid")] },
  { item: "2", what: "Howe's 12 rooms + 2 floors saved with her first room of her own (_hhRoomSeed)", cat: "room", pages: ["Saved after her first room"] },
  { item: "4", what: "the built-in Mom code on Settings (\"Current PIN\")", cat: "pin", pages: ["Admin ▸ settings", "Admin ▸ rules", "Mom's Day ▸ sset"], near: /Current PIN/ },
  { item: "4", what: "the built-in Dad code in Settings' Dad code box", cat: "pin", pages: ["Admin ▸ settings", "Admin ▸ rules", "Mom's Day ▸ sset"], near: /Dad code . lets Dad give stars/ },
  { item: "4", what: "the built-in Dad code printed on Mom HQ ▸ Screens & links (\"Star code\")", cat: "pin", pages: ["Mom's Day ▸ hq", "Admin ▸ hq"], near: /Star code/ },
  { item: "5", what: "\"Lucy's iPad runs independently of the boys'\" in the Family rules audit checklist", cat: "kid", pages: ["Admin ▸ settings", "Admin ▸ rules", "Mom's Day ▸ sset"], near: /iPad runs independently/ },
  { item: "6", what: "\"Julian first; more kids coming.\" on Generate Week", cat: "kid", pages: ["Mom's Day ▸ gen", "Admin ▸ generate"], near: /first; more kids coming/ },
  { item: "7", what: "printed flash cards headed \"🦕 Julian\"", cat: "kid", pages: ["Mastery ▸ 🖨 Print flash cards"] },
  { item: "8", what: "note-box hint \"Note (move to Tue, give to Lucy, …)\" on a Review row", cat: "kid", pages: ["Household ▸ review row"], near: /give to/ },
  { item: "8", what: "star-box hint \"e.g. helped Lucy without being asked\"", cat: "kid", pages: ["Mom's Day ⭐ give stars box"], near: /helped .* without being asked/ },
  { item: "11", what: "\"Morning routine not done\" on 🔴 Now for kids who have no morning list", cat: "morningAlarm", pages: ["Home Base", "Home Base ▸ afternoon", "Home Base ▸ night", AT("Home Base")] },
];

// ── boot ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const FAMILY = { familyId: "ridge", familyName: "Ridge Family", windowText: "School day",
  firebase: { apiKey: "x", authDomain: "x.local", databaseURL: "https://x.local", projectId: "x" },
  roster: [{ id: "nora", name: "Nora", color: "#1e3a5f", badge: "#dbeafe", schoolAge: true }, { id: "teo", name: "Teo", color: "#c45e1a", badge: "#ffedd5", schoolAge: false }] };
const START = new Date(2026, 10, 24, 10, 0, 0).getTime();   // Tuesday 24 Nov 2026, 10:00 — a school day
async function boot(family, o) {
  o = o || {};
  const clock = S.makeClock(START); clock.boot = clock.now; const sched = S.makeScheduler(clock);
  const db = S.makeDb(o.tree || {}, clock, sched);
  const A = S.bootDevice({ name: family ? "newfam" : "howe", dev: "dev_a", db, clock, sched, family, indexPath: INDEX });
  await sched.run(clock.now + 3000);
  A.momOn(); if (o.dry) A.run("_dryRun=function(){ return true; }");
  await sched.run(clock.now + 3000);
  LAZY.forEach(f => { const p = f === "house.js" ? HOUSE : path.join(__dirname, f); if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, "utf8"), A.ctx, { filename: f }); });
  try { A.run("rlHistReady()"); } catch (e) {}
  await sched.run(clock.now + 3000);
  return { A, db, clock, sched, flush: (ms) => sched.run(clock.now + (ms || 1500)) };
}

// ── text ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const textOf = h => String(h || "").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<script[\s\S]*?<\/script>/g, " ")
  .replace(/<[^>]*\splaceholder="([^"]*)"[^>]*>/g, " $1 ").replace(/<[^>]+>/g, " ")   // a box's hint text is what she reads in it
  .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&#39;|&rsquo;|&#x27;|’/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&hellip;/g, "…")
  .replace(/\s+/g, " ").trim();
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const word = s => new RegExp("(?<![A-Za-z])" + reEsc(s) + "(?![A-Za-z])", "g");

function draw(B, name, setup, expr) {
  const c = B.A.ctx.document.getElementById("content");
  try { c.innerHTML = ""; if (setup) B.A.run(setup); const r = B.A.run(expr); const h = (typeof r === "string" && r.length > String(c.innerHTML).length) ? r : c.innerHTML; return { name, text: textOf(h) }; }
  catch (e) { return { name, err: String(e && e.message || e).slice(0, 200) }; }
}
const MOM = (v) => 'tab="moms-plan"; momDayIn=true; schedShowAdmin=false; mpSubView="' + v + '";';
const HH = (v) => MOM("house") + ' hhView="' + v + '";';
const RENDER = 'renderMomsPlan(document.getElementById("content"))';

async function pagesOf(B, kids) {
  const P = [];
  P.push(draw(B, "Home Base", MOM("plan"), RENDER));
  ["afternoon", "night"].forEach(sl => P.push(draw(B, "Home Base ▸ " + sl, MOM("plan") + ' mpSlot="' + sl + '";', RENDER)));   // My day at each time of day
  B.A.run("mpSlot=null");
  P.push(draw(B, "Home Base ▸ ✎ Edit my chores", MOM("plan") + " mcManage=true;", "mcPopHTML(_todayStr(),mdTodayName())"));
  B.A.run("mcManage=false");
  P.push(draw(B, "Dad's Day ▸ ✎ Edit his chores", MOM("dad") + " ddManage=true;", "ddPopHTML(_todayStr(),mdTodayName())"));
  B.A.run("ddManage=false");
  ["cal", "chores", "hq", "gen", "meals", "grocery", "prep", "weigh", "budget", "gifts", "seasons", "esa", "dad", "dadall", "dadcal", "curr", "sset", "hist", "mhq"].forEach(v => P.push(draw(B, "Mom's Day ▸ " + v, MOM(v), RENDER)));
  ["grabs", "store", "points", "rooms", "log"].forEach(t => P.push(draw(B, "Chores & Stars ▸ " + t, MOM("chores") + ' cpTab="' + t + '";', RENDER)));
  ["rooms", "person", "review", "habits", "week", "area", "room", "levels", "rot", "laundry", "kitchen", "once", "proj", "today"].forEach(v => P.push(draw(B, "Household ▸ " + v, HH(v), RENDER)));
  P.push(draw(B, "Household ▸ Edit rooms", HH("rooms") + ' if(typeof hhRmEdit!=="undefined") hhRmEdit=true;', RENDER));
  P.push(draw(B, "Household ▸ + Add a chore", HH("review") + ' if(typeof hhAddOpen!=="undefined") hhAddOpen=true;', RENDER));
  P.push(draw(B, "By person", HH("person"), "hpPersonHTML()"));
  P.push(draw(B, "Person settings ▸ kid", "", "hpSettingsHTML(ROSTER[0])"));
  P.push(draw(B, "Household ▸ review row", "", 'hhRowHTML("x_row",{label:"Sweep the porch",who:"mom",cad:"daily",area:"cleaning",status:"active",src:{kind:"new"},verdict:"",note:""})'));   // one row, not saved
  [["Schedule", "schedule", "renderSchedule"], ["Kids' Corner", "kids", "renderKidsCorner"], ["Supplies", "supplies", "renderSupplies"], ["History", "history", "renderHistory"],
   ["Pace", "pace", "renderPace"], ["Mastery", "mastery", "renderMastery"], ["Notebook", "notebook", "renderNotebook"], ["Units", "units", "renderUnits"], ["Sitter", "babysitter", "renderSitter"]]
    .forEach(p => P.push(draw(B, p[0], 'tab="' + p[1] + '"; schedShowAdmin=false;', p[2] + '(document.getElementById("content"))')));
  ["chores", "curriculum", "generate", "hq", "mastery", "purchases", "rules", "settings"].forEach(v => P.push(draw(B, "Admin ▸ " + v, 'tab="schedule"; schedShowAdmin=true; adminPinUnlocked=true; adminSubTab="' + v + '";', 'renderSchedule(document.getElementById("content"))')));
  kids.forEach(k => P.push(draw(B, "Kids' Corner ▸ " + k, 'tab="kids"; kcKid="' + k + '";', 'renderKidsCorner(document.getElementById("content"))')));
  P.push(draw(B, "Ledger", "", '(typeof lgHTML==="function")?lgHTML():""'));
  P.push(draw(B, "Ledger rules", "", '(typeof lgRulesHTML==="function")?lgRulesHTML():""'));
  // ⭐ the give-stars box (Mom's Day): it goes on the page with insertAdjacentHTML — caught here
  P.push(draw(B, "Mom's Day ⭐ give stars box", 'var __bx=""; document.body.insertAdjacentHTML=function(w,h){ __bx+=h; }; document.getElementById("mpbank-"+ROSTER[0]).value="3"; mpBankAsk(ROSTER[0],1);', "__bx"));
  // 🖨 Mastery flash cards for the Pre-K kid: one card in memory (not saved), the print page caught at haPrintDoc
  const pk = B.A.run("ROSTER.filter(function(k){ return isPreK(k); })[0]||ROSTER[ROSTER.length-1]");
  P.push(draw(B, "Mastery ▸ 🖨 Print flash cards", 'var __pr=""; masteryKid="' + pk + '"; masteryData["' + pk + '"]=[{id:"m1",prompt:"A",subject:"Letters",status:"introduction"}]; haPrintDoc=function(t,h){ __pr=t+" "+h; }; mastPrintCards();', "__pr"));
  return P;
}

// ── Howe's words, read from the app ────────────────────────────────────────────────────────────────────────────────────
function howeWords(H, N) {
  const g = (B, e) => JSON.parse(B.A.run("JSON.stringify(" + e + ")"));
  const kids = g(H, "FAMILY_DEFAULT.map(function(k){ return k.name; })");
  const mc = g(H, "MC_DEFAULT"), core = l => String(l).replace(/^[^A-Za-z]+/, "").replace(/\s*\(.*\)\s*$/, "").trim();
  const momChores = Object.keys(mc).map(id => core(mc[id].label));
  const zones = g(N, "ZONE_DEFAULT.map(function(z){ return z.name; })");   // the six generic chore zones every family gets (1.2 #15) are not Howe's
  const rooms = Array.from(new Set(g(H, "HH_ROOMS").concat(g(N, "HH_ROOMS")).filter(r => r[0] !== "any").map(r => r[1]))).filter(n => zones.indexOf(n) < 0);   // Howe's names + the renamed code layout a new family gets
  const grabs = g(H, "GRAB_DEFAULT.map(function(x){ return x.label; })");
  const routine = g(H, "(function(){ var o=[]; Object.keys(RT_DEFAULT).forEach(function(s){ Object.keys(RT_DEFAULT[s]||{}).forEach(function(k){ (RT_DEFAULT[s][k]||[]).forEach(function(x){ o.push(x.label); }); }); }); return o; })()");
  // pets / people named inside Howe's own lists: a capital word that is not the first word (Let Chloe out, Bella's chair)
  const pets = new Set(["Sunny", "Greg"]);   // these two live only in the Bring-in guessing rules (hhGuessArea), in no default list
  routine.concat(grabs).forEach(l => String(l).split(/\s+/).slice(1).forEach(w => { const m = w.match(/^[A-Z][a-z]{2,}/); if (m && kids.indexOf(m[0]) < 0 && !/^(Teeth|Pjs)$/.test(m[0])) { pets.add(m[0]); if (/s$/.test(m[0])) pets.add(m[0].slice(0, -1)); } }));   // "Bellas chair" → Bella too
  // Mom's own starters behind "✨ Start with the … basics" (MC_SEEDS): the longer ones, not already a Mom chore
  const seeds = [].concat(...Object.values(g(H, "MC_SEEDS"))).map(core).filter(l => l.length >= 12 && momChores.indexOf(l) < 0);
  const cycle = g(H, "wellnessCycle");
  const pins = [g(H, "APP_PIN"), g(H, "DAD_PIN")].filter(Boolean);
  return { kids, momChores, rooms, grabs, pets: Array.from(pets), cycle, pins, seeds };
}
function scanner(W) {
  const T = [];
  W.kids.forEach(s => T.push(["kid", word(s)]));
  W.momChores.forEach(s => T.push(["momChore", word(s)]));
  W.rooms.forEach(s => T.push(["room", word(s)]));
  W.grabs.forEach(s => T.push(["grab", word(s)]));
  W.pets.forEach(s => T.push(["pet", word(s)]));
  W.seeds.forEach(s => T.push(["seed", word(s)]));
  T.push(["seed", /Start with the [a-z]+ basics/g]);   // the ✨ button itself (gone for a new family: MCSEEDNF)
  W.pins.forEach(s => T.push(["pin", new RegExp("(?<!\\d)" + s + "(?!\\d)", "g")]));
  T.push(["cycle", /cycle day \d+|Next period expected/g]);   // a cycle day shown with nothing logged = the built-in date
  T.push(["morningAlarm", /Morning routine not done/g]);      // every kid here has no morning list
  T.push(["momCount", new RegExp("\\(" + W.momChores.length + " rows\\)", "g")]);   // Bring in counting the 8 when nothing of hers exists
  return function scan(name, text) {
    const hits = [];
    T.forEach(([cat, re]) => { const g = new RegExp(re.source, re.flags.indexOf("g") < 0 ? re.flags + "g" : re.flags); let m;
      while ((m = g.exec(text))) { hits.push({ cat, page: name, term: m[0], ctx: text.slice(Math.max(0, m.index - 60), m.index + m[0].length + 60) }); if (hits.length > 400) break; } });
    return hits;
  };
}

(async () => {
  console.log("test_new_family_clean.js — a brand-new family (Nora, Teo; empty database) sees none of Howe's own things");
  // ── 1. Howe, booted with no family file (HA_IS_HOWE), and the made-up family ─────────────────────────────────────────
  const H = await boot(undefined), N = await boot(FAMILY);
  ok(H.A.run("HA_IS_HOWE") === true && N.A.run("HA_IS_HOWE") === false, "the two boots: Howe (HA_IS_HOWE) and a made-up family (not Howe)");
  ok(N.A.run("momHere()") === true, "Mom mode is on for the made-up family");
  const W = howeWords(H, N), scan = scanner(W);
  ok(W.kids.length === 4 && W.momChores.length === 8 && W.rooms.length >= 11 && W.grabs.length > 0 && W.pets.length >= 3 && W.pins.length === 2 && W.seeds.length >= 5,
    "Howe's words read from the app: " + W.kids.length + " kids, " + W.momChores.length + " Mom chores, " + W.rooms.length + " room names, " + W.grabs.length + " Up for Grabs jobs, pets " + W.pets.join("/") + ", 2 codes, " + W.seeds.length + " starter items");
  ok(Object.keys(N.db.tree.root).every(k => /^(connDiary|settings)$/.test(k)), "the made-up family's database is empty after boot (only the app's own connection notes): " + Object.keys(N.db.tree.root).join(","));

  // ── 2. the pages, untouched ─────────────────────────────────────────────────────────────────────────────────────────
  const hits = [], drawn = [], errs = [];
  const lens = {};
  const take = (P) => P.forEach(p => { if (p.err) errs.push(p); else { drawn.push(p.name); lens[p.name] = p.text.length; scan(p.name, p.text).forEach(h => hits.push(h)); } });
  take(await pagesOf(N, ["nora", "teo"]));
  const dbHits = (B, name) => { const t = JSON.stringify(B.db.tree.root).replace(/\\u0027|’/g, "'"); drawn.push(name); scan(name, t).forEach(h => hits.push(h)); };

  // ── 3. the set-up taps, each on its own fresh empty family ──────────────────────────────────────────────────────────
  // her first chore of her own (✎ Edit ▸ add): mcEnsure runs first
  const E = await boot(FAMILY);
  E.A.run('document.getElementById("mc-new").value="Water the plants"; mcAdd();'); await E.flush();
  dbHits(E, "Saved after her first chore");
  // 📥 Bring in → the Household views → 🏡 Take over → the first room of her own
  const B = await boot(FAMILY);
  B.A.run("hhImport()"); await B.flush(); dbHits(B, "Saved after Bring in");
  ["rooms", "person", "review", "habits", "week", "area", "room", "levels", "rot", "laundry", "once", "proj", "today"].forEach(v => take([draw(B, "After Bring in · Household ▸ " + v, HH(v) + ' hhOpenWho="mom"; hhSortNeed=true;', RENDER)]));   // Mom's rows open, flat
  B.A.run("hhTakeover(true)"); await B.flush(); dbHits(B, "Saved after Take over");
  take([draw(B, "After Take over · Home Base", MOM("plan"), RENDER),
    draw(B, "After Take over · chore card", 'hcId=Object.keys(hhJobs()).sort()[0]; hcScr=0;', 'hcId?hcCardHTML():"(no chore to open)"'),
    draw(B, "After Take over · By person ▸ Mom", HH("person") + ' hpSel="mom";', "hpPersonHTML()"),
    draw(B, "After Take over · By person ▸ kid", HH("person") + ' hpSel=ROSTER[0];', "hpPersonHTML()"),
    draw(B, "After Take over · Rooms ▸ Parents' room", HH("rooms") + ' hhRmSel="ours";', RENDER),
    draw(B, "After Take over · room rules", "", '(function(){ var J=hhJobs(), ids=Object.keys(J).filter(function(i){ return hhRoomOf(J[i])==="ours"; }); return ids.length?hcRulesHTML("ours",ids):"(no chore in this room)"; })()')]);
  // her first room of her own (🚪 Edit rooms ▸ add "Garage")
  const Rm = await boot(FAMILY); Rm.A.run('hhRoomAdd("Garage","down")'); await Rm.flush(); dbHits(Rm, "Saved after her first room");

  // ── 4. compare with the known list ──────────────────────────────────────────────────────────────────────────────────
  if (VERBOSE) console.log("  page sizes: " + Object.keys(lens).map(k => k + " " + lens[k]).join(" | "));
  const blank = Object.keys(lens).filter(k => lens[k] < 15);   // the Sitter tab says only "No days this week"
  ok(blank.length === 0, "every page drew something to read (a blank page would hide a leak)" + (blank.length ? ": " + blank.join(", ") : ""));
  ok(errs.length === 0, "every page drew without an error" + (errs.length ? ": " + errs.map(e => e.name + " (" + e.err + ")").join("; ") : ""));
  KNOWN.forEach(k => k.pages.forEach(p => ok(drawn.indexOf(p) >= 0, "known #" + k.item + " names a page this test draws: " + p)));
  const covers = (k, h) => k.cat === h.cat && k.pages.indexOf(h.page) >= 0 && (!k.near || k.near.test(h.ctx));
  const fresh = hits.filter(h => !KNOWN.some(k => covers(k, h)));
  const byKey = {}; fresh.forEach(h => { const key = h.cat + " · " + h.page; (byKey[key] = byKey[key] || []).push(h); });
  Object.keys(byKey).forEach(key => ok(false, "NEW leak, not on the known list — " + key + ": \"" + byKey[key][0].term + "\" in …" + byKey[key][0].ctx + "…" + (byKey[key].length > 1 ? " (+" + (byKey[key].length - 1) + " more)" : "")));
  ok(fresh.length === 0, "no Howe word on any page or in any saved value beyond the known list (" + hits.length + " known hits on " + drawn.length + " pages / saves)");
  KNOWN.forEach(k => k.pages.forEach(p => ok(hits.some(h => covers(k, { cat: h.cat, page: h.page, ctx: h.ctx }) && h.page === p),
    "known #" + k.item + " still found on \"" + p + "\" — " + k.what + " (fixed? take it off the KNOWN list)")));
  if (VERBOSE) { const n = {}; hits.forEach(h => { const k = h.cat + " · " + h.page; if (!n[k]) n[k] = [0, h]; n[k][0]++; });
    Object.keys(n).sort().forEach(k => console.log("  · " + k + " ×" + n[k][0] + "  …" + n[k][1].ctx.slice(30, 130) + "…")); }

  // ── 5. Howe still gets its own things ──────────────────────────────────────────────────────────────────────────────
  const hj = e => JSON.parse(H.A.run("JSON.stringify(" + e + ")"));
  ok(JSON.stringify(hj("mcAll()")) === JSON.stringify(hj("MC_DEFAULT")), "Howe: Mom's list is its 8 chores (mcAll() = MC_DEFAULT)");
  const hb = draw(H, "Howe · Home Base", MOM("plan"), RENDER).text || "";
  const dueH = hj("mcDueToday(mdTodayName())").map(id => W.momChores[Object.keys(hj("MC_DEFAULT")).indexOf(id)]);
  ok(dueH.length > 0 && dueH.every(l => hb.indexOf(l) >= 0), "Howe: Home Base ▸ My day shows today's chores of the 8 (" + dueH.join(", ") + ")");
  ok(/✨ Start with the morning basics/.test(hb), "Howe: an empty time of day still offers \"✨ Start with the morning basics\"");
  const ht = draw(H, "Howe · Household ▸ today", HH("today"), RENDER).text || "";
  ok(dueH.every(l => ht.indexOf(l) >= 0), "Howe: Household ▸ Today lists them under Mom");
  ok(JSON.stringify(hj("hhRoomList()")) === JSON.stringify(hj("HH_ROOMS")) && hj("hhRoomList()").some(r => r[1] === "Boys' room"), "Howe: its 12 rooms with its own names (Boys' room …)");
  const hp = draw(H, "Howe · + Add a chore", HH("review") + ' hhAddOpen=true;', RENDER).text || "";
  ok(hj("HH_ROOMS").filter(r => r[0] !== "any").every(r => hp.indexOf(r[1]) >= 0), "Howe: the room picker lists all its rooms");
  ok(hj("gbList().length") === W.grabs.length && W.grabs.length > 0, "Howe: Up for Grabs is its own " + W.grabs.length + " jobs");
  const HB = await boot(undefined); HB.A.run("hhImport()"); await HB.flush();
  const mcRows = Object.keys((HB.db.get("household/jobs") || {})).filter(k => /^mc_mc_/.test(k));
  ok(mcRows.length === 8, "Howe: 📥 Bring in still brings in its 8 Mom chores (" + mcRows.length + " mc_ rows)");
  const HE = await boot(undefined); HE.A.run('document.getElementById("mc-new").value="Water the plants"; mcAdd();'); await HE.flush();
  const mcs = HE.db.get("momChores") || {};
  ok(Object.keys(hj("MC_DEFAULT")).every(id => mcs[id]) && mcs._seeded === true, "Howe: the first edit still saves its 8 chores + _seeded (mcEnsure)");

  const errsAll = [H, N, E, B, Rm, HB, HE].reduce((n, x) => n + x.sched.errors.length, 0);
  ok(errsAll === 0, "no timer threw in any boot (" + errsAll + ")");
  console.log((fail ? "FAIL" : "PASS") + " — " + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error("CRASH", e); process.exit(1); });
