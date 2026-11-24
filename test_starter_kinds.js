/*
 * 🧪 STARTERKINDS — the starter units' activities carry their kind (slice 9 of PLAN_unit_activity_types_2026-11-19 §4 row 9,
 * §1.6, §2(e), §5 Q6; her go 2026-11-22/23: "build the unit plans out … go with the plans' recommended answers"). Data only.
 *
 * The WHOLE app (index.html's main script) runs in the vm sandbox of test_demo_week.js on the synthetic demo family, twice:
 *   NOW    = this tree;
 *   BEFORE = this tree with the slice taken out (every line marked STARTERKINDS removed, the one closing line put back, the
 *            comment header out) — its starters are checked against a frozen copy of origin/main's records (PRE, below).
 * What is proved:
 *   1. the data: only the three starters with activities carry any; each record is valid (kinds from UAK_TYPES, supplies in
 *      LESSONRES's shape = what the day editor's 🧪 + Add writes for the same lines, steps plain strings, no address, no name);
 *      nothing but type / mom / supplies was added; a 📓 activity has no field at all; starterVer unchanged.
 *   2. the notebook page: every starter activity prints byte-identical (the record itself, uapSpec, haBuildUnitInsight).
 *   3. a family that adds the starter now: the record written carries the kinds; the Units page shows the chips; once the
 *      unit has days on Family Time, the supplies reach the 🧺 Sunday list for the week each day is laid (utResOf).
 *   4. §5 Q6 — a family that already added the starter (a copy made from today's origin/main starter, with days, a queue,
 *      a claim, a log): every render and every write path is byte-identical NOW vs BEFORE; ＋ Add the new stages writes
 *      exactly what it writes today and never an activity field.
 * No kid or family names: the fixture is synthetic.   run: node test_starter_kinds.js
 */
"use strict";
process.env.TZ = "America/New_York";
const fs = require("fs"), path = require("path"), os = require("os");
const S = require(path.join(__dirname, "test_fixtures", "demo_week_sandbox.js"));
const FX = JSON.parse(fs.readFileSync(path.join(__dirname, "test_fixtures", "living_demo_family.json"), "utf8"));
const INDEX = path.join(__dirname, "index.html");
const SRC = fs.readFileSync(INDEX, "utf8"), NBSRC = fs.readFileSync(path.join(__dirname, "notebooks.js"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + (typeof x === "string" ? x : JSON.stringify(x)).slice(0, 900) + ")" : "")); } };
const J = x => JSON.stringify(x);
const fnIn = (s, name) => { const i = s.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < s.length; j++) { const c = s[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return s.slice(i, j + 1); };
const NAMES = /\b(adrienne|andrew|julian|lincoln|ellis|lucy|sara|sarah|caleb|taylor|makenzie|kenzie|dewalt|burris|melanie|howe)\b/i;
const IDS = ["construction_machines", "cats_house_and_wild", "rocks_gems_minerals"];
const RG = "rocks_gems_minerals";

// ── today's origin/main records (69c516b2), frozen: the copy a family that tapped ＋ Add before this slice holds ──
const PRE = {
  construction_machines: [
    {"key":"draw_machine","title":"Draw a machine at work","emoji":"🖍️","kind":"sheet","lines":2,"points":5,"desc":"Pick one machine you learned this week. Draw it doing its job. Tell Mom its name and what it does."},
    {"key":"build_it","title":"Build a machine","emoji":"🧱","kind":"sheet","points":5,"desc":"Build a machine out of blocks, LEGO or boxes. Then draw what you built.","steps":["Pick a machine.","Build it.","Show how it moves: dig, lift, push or dump.","Draw it in the box."]},
    {"key":"count_wheels","title":"Count the wheels","emoji":"🔢","kind":"sheet","lines":3,"points":5,"desc":"Find machines in a book or outside. Count the wheels (or tracks) on each one and write the number."}
  ],
  cats_house_and_wild: [
    {"key":"cat_report","title":"Cat report","emoji":"📝","kind":"bio","lines":10,"points":10,"desc":"Pick one cat you have learned. Where does it live? What does it eat? What makes it special?"},
    {"key":"compare_cats","title":"House cat vs. wild cat","emoji":"🔍","kind":"compare","lines":8,"points":10,"desc":"Pick one house cat and one wild cat. How are they alike? How are they different?"},
    {"key":"design_coat","title":"Design a coat","emoji":"🎨","kind":"sheet","lines":2,"points":5,"desc":"Spots, rosettes, stripes, points or plain? Draw a cat and give it a coat that hides it where it lives. Write where it lives below."}
  ],
  rocks_gems_minerals: [
    {"key":"rock_hunt","title":"Rock hunt","emoji":"🔎","kind":"sheet","points":5,"desc":"Go on a rock hunt outside with Mom. Pick up five rocks you like. Draw your favorite one in the box.","steps":["Find 5 rocks.","Look close. What colors do you see?","Draw your favorite."]},
    {"key":"sort_rocks","title":"Sort your rocks","emoji":"🗂️","kind":"sheet","points":5,"desc":"Make piles: by color, then shiny or not shiny, then smooth or bumpy. Count each pile and tell Mom.","steps":["Sort by color.","Sort shiny and not shiny.","Sort smooth and bumpy.","Draw your piles."]},
    {"key":"scratch_test","title":"Scratch test","emoji":"🪙","kind":"sheet","points":5,"desc":"Hard or soft? Try to scratch each rock with your fingernail, then with a penny. A soft rock gets a scratch mark.","steps":["Try your fingernail.","Try a penny.","Put the soft ones in one pile.","Draw a soft rock and a hard rock."]},
    {"key":"magnet_test","title":"Does a magnet stick?","emoji":"🧲","kind":"sheet","points":5,"desc":"Hold a magnet next to each rock. Does it stick? Make a stick pile and a no-stick pile.","steps":["Test each rock.","Make two piles.","Draw a rock from each pile."]},
    {"key":"grow_crystals","title":"Grow salt crystals","emoji":"🧂","kind":"sheet","points":5,"desc":"With Mom: stir salt into warm water until no more will melt. Pour a little into a dish and set it in a sunny window. Look every day.","steps":["Mom gets warm water.","Stir in the salt.","Pour it in a dish.","Draw the crystals you see."]},
    {"key":"pet_rock","title":"Make a pet rock","emoji":"🪨","kind":"sheet","points":5,"desc":"Find a smooth rock. Paint or draw a face on it and give it a name. Draw your pet rock in the box."},
    {"key":"gem_dig","title":"Gem dig","emoji":"💎","kind":"sheet","points":5,"desc":"Like the Oat and gem treasure bin: Mom hides gems in oats or sand. Dig them out with a spoon or a brush, then sort them by color.","steps":["Dig for gems.","Sort them by color.","Count each color.","Draw your treasure."]}
  ]
};
// What each activity became, and the lines Mom would type into the day editor's 🧪 box for the same supplies (null = 📓, no field)
const EXPECT = {
  draw_machine: null, count_wheels: null, cat_report: null, compare_cats: null, design_coat: null,
  build_it:      { mom: false, sup: "blocks, LEGO or boxes" },
  rock_hunt:     { mom: true,  sup: "" },
  sort_rocks:    { mom: false, sup: "rocks" },
  scratch_test:  { mom: false, sup: "rocks\n1 penny" },
  magnet_test:   { mom: false, sup: "1 magnet\nrocks" },
  grow_crystals: { mom: true,  sup: "salt | mom\nwarm water | mom\n1 dish | mom" },
  pet_rock:      { mom: false, sup: "1 smooth rock\npaint" },
  gem_dig:       { mom: false, sup: "gems | mom\noats or sand | mom\nspoon or brush" }
};
const ADDED = ["type", "mom", "supplies"];
const strip = a => { const o = {}; Object.keys(a).forEach(k => { if (ADDED.indexOf(k) < 0) o[k] = a[k]; }); return o; };

// ── the tree before the slice ──
const MARK = "   // STARTERKINDS";
function beforeOf(src) {
  const L = src.split("\n"), out = [];
  const h0 = L.findIndex(l => l.indexOf("// STARTERKINDS — ") === 0), f = L.indexOf("function _cmActs(){ return [");
  for (let i = 0; i < L.length; i++) {
    if (i >= h0 && i < f) continue;                                   // the comment header
    if (L[i].endsWith(MARK)) { if (/\] \},   \/\/ STARTERKINDS$/.test(L[i])) out[out.length - 1] = out[out.length - 1].replace(/",$/, '" },'); continue; }
    out.push(L[i]);
  }
  return out.join("\n");
}
const BSRC = beforeOf(SRC);
const BPATH = path.join(os.tmpdir(), "starterkinds_before_" + process.pid + ".html");
fs.writeFileSync(BPATH, BSRC);
process.on("exit", () => { try { fs.unlinkSync(BPATH); } catch (e) {} });

// ── a world: the whole app on the demo family (+ a Family Time block that lays a unit's days, + unit records) ──
const BLOCK_DAYS = ["Rocks out", "Sort", "Scratch", "Magnet", "Crystals", "Pet rocks", "Dig"];
const BLOCK = () => ({ name: "Together", kids: ["kid_a", "kid_b"], days: ["Mon", "Tue", "Wed", "Thu", "Fri"], at: "1:00 PM",
  items: [{ key: "un", name: "Rocks, Gems & Minerals", minutes: 30, track: { mode: "seq", startDate: "2026-11-09", list: BLOCK_DAYS.map((t, i) => ({ t: "Day " + (i + 1) + " — " + t, n: 1, u: { id: RG, d: "d" + (i + 1) } })) } }] });
const TRACK = () => ({ mode: "seq", perWeek: 5, days: BLOCK_DAYS.map((t, i) => ({ id: "d" + (i + 1), n: i + 1, t, nb: { activity: PRE[RG][i].key } })) });
async function world(indexPath, units, o) {
  o = o || {};
  const clock = S.makeClock(new Date(2026, 10, 8, 0, 0, 30).getTime()); clock.boot = clock.now;
  const sched = S.makeScheduler(clock);
  const tree = JSON.parse(J(FX.db)); if (o.block) tree.config.rules.familyBlocks = { ft: BLOCK() }; if (units) tree.unitStudies = JSON.parse(J(units));
  const db = S.makeDb(tree, clock, sched);
  let seed = 12345; const M = Object.create(Math); M.random = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const A = S.bootDevice({ name: indexPath === INDEX ? "now" : "before", dev: "dev_a", db, clock, sched, family: FX.family, indexPath, globals: { Math: M } });
  const flush = async ms => { await sched.run(clock.now + (ms == null ? 500 : ms)); };
  A.momOn(); await flush();
  return { A, db, clock, flush, us: () => A.get("unitStudies") };
}
const acts = u => { const a = u && u.activities; return a ? (Array.isArray(a) ? a : Object.values(a)).filter(Boolean) : []; };
const G = (W, uid, dayId) => { const f = W.A.fn; const u = f("utUnits")()[uid]; return { day: f("utRef")(uid, f("utDay")(u, dayId)), u, first: null, present: [] }; };
const load = s => { const w = {}; (new Function("window", "document", s))(w, {}); return w.HoweNotebooks; };
const NB = load(NBSRC);

(async () => {
console.log("── wiring ──");
{
  const L = SRC.split("\n"), marked = L.filter(l => l.endsWith(MARK));
  const hdr = SRC.slice(SRC.indexOf("// STARTERKINDS — "), SRC.indexOf("function _cmActs(){ return ["));
  ok("one STARTERKINDS comment header, directly above _cmActs, comment lines only", SRC.split("// STARTERKINDS — ").length === 2 && hdr.length > 200 && hdr.split("\n").filter(Boolean).every(l => /^\/\//.test(l)));
  ok("8 marked data lines: 1 in _cmActs, 0 in _catsActs, 7 in _rgActs — nowhere else", marked.length === 8 && fnIn(SRC, "_cmActs").split(MARK).length === 2 && fnIn(SRC, "_catsActs").indexOf(MARK) < 0 && fnIn(SRC, "_rgActs").split(MARK).length === 8 && SRC.split(MARK).length === 9, marked.length);
  ok("each marked line only adds type:\"hands\" (+ mom:true, + supplies) — no url, kidOpen, pdf, address", marked.every(l => /^    type:"hands", (mom:true,? ?)?(supplies:\[[^\]]*\])?,?( \},)?   \/\/ STARTERKINDS$/.test(l)) && !marked.some(l => /url|kidOpen|pdf|https?:|www\./i.test(l)), marked);
  ok("no kid or family name, no 🔀 in the header or the marked lines", !NAMES.test(hdr + marked.join("\n")) && (hdr + marked.join("")).indexOf("\u{1F500}") < 0, ((hdr + marked.join("\n")).match(NAMES) || [])[0]);
  const testTxt = fs.readFileSync(__filename, "utf8").split("\n").filter(l => !/^const NAMES =/.test(l)).join("\n");
  ok("this test file names no real kid or family", !NAMES.test(testTxt), (testTxt.match(NAMES) || [])[0]);
  ok("the BEFORE tree: no trace of the slice, and only the slice's lines differ (8 marked + the header; pet rock's line closed again)",
    BSRC.indexOf("STARTERKINDS") < 0 && SRC.split("\n").length - BSRC.split("\n").length === 8 + hdr.split("\n").length - 1 && BSRC.indexOf('in the box." },\n  { key:"gem_dig"') > 0);
  ok("starterVer of the three units untouched in the source (so ＋ Add the new stages has nothing to offer)", ["construction_machines", "cats_house_and_wild", "rocks_gems_minerals"].every(id => SRC.indexOf("  " + id + ":()=>({ id:\"" + id + "\", starter:\"" + id + "\", starterVer:1,") > 0));
}

const N0 = await world(INDEX, null), B0 = await world(BPATH, null);
const SU = N0.A.get("STARTER_UNITS"), SB = B0.A.get("STARTER_UNITS");
const mk = (SUx, id) => { try { return SUx[id](); } catch (e) { return null; } };

console.log("\n── the data ──");
{
  const withActs = Object.keys(SU).filter(id => { const u = mk(SU, id); return u && u.activities; });
  ok("only the three interest units ship activities (every other starter builds with none)", J(withActs.sort()) === J(IDS.slice().sort()), withActs);
  ok("BEFORE's starter activities are origin/main's records exactly (the frozen PRE)", IDS.every(id => J(mk(SB, id).activities) === J(PRE[id])), IDS.map(id => J(mk(SB, id).activities).slice(0, 120)));
  ok("NOW minus type / mom / supplies = PRE, field for field and in order — no title, line, step, points, kind or key changed", IDS.every(id => J(mk(SU, id).activities.map(strip)) === J(PRE[id])));
  ok("the rest of each unit record is the same NOW and BEFORE (decks, visuals, desc, starterVer)", IDS.every(id => { const a = mk(SU, id), b = mk(SB, id); delete a.activities; delete b.activities; return J(a) === J(b); }));
  const all = [].concat(...IDS.map(id => mk(SU, id).activities));
  ok("13 activities, every one in the EXPECT table", all.length === 13 && all.every(a => a.key in EXPECT) && Object.keys(EXPECT).length === 13);
  const f = N0.A.fn, kinds = N0.A.get("UAK_TYPES").map(x => x[0]);
  all.forEach(a => {
    const E = EXPECT[a.key];
    if (!E) { ok(a.key + ": 📓 Notebook activity — no type, mom or supplies field at all (absent = notebook)", !("type" in a) && !("mom" in a) && !("supplies" in a) && f("uakType")(a) === "notebook"); return; }
    const dom = N0.A.ctx.document, kk = "sk-" + a.key;
    dom.getElementById("utaa-" + kk + "-supplies").value = E.sup; dom.getElementById("utaa-" + kk + "-steps").value = (a.steps || []).join("\n"); dom.getElementById("utaa-" + kk + "-mom").checked = E.mom;
    const typed = {}; f("uakPick")(kk, "hands"); const added = f("uakAddFields")(kk, typed);   // the day editor's 🧪 chip, then + Add's own field step
    const mine = {}; ["mom", "supplies", "steps", "type"].forEach(k => { if (k in a) mine[k] = a[k]; });
    const ed = {}; ["mom", "supplies", "steps", "type"].forEach(k => { if (k in typed) ed[k] = typed[k]; });
    ok(a.key + ": 🧪 — mom / supplies / steps / type are exactly what the day editor's 🧪 + Add writes for the same lines" + (E.mom ? " (👩 Mom leads it)" : "") + (E.sup ? "" : " (no supplies named)"),
      added === true && a.type === "hands" && kinds.indexOf(a.type) >= 0 && J(mine) === J(ed), [mine, ed]);
    ok(a.key + ": supplies are already clean LESSONRES shape {name, kids, qty?} (uahSup reads them back unchanged); steps are plain strings",
      J(f("uahSup")(a)) === J(a.supplies || []) && (a.supplies || []).every(s => Object.keys(s).every(k => ["name", "kids", "qty"].indexOf(k) >= 0) && typeof s.kids === "boolean") && J(f("uahSteps")(a)) === J(a.steps || []) && (a.steps || []).every(s => typeof s === "string"));
  });
  const allTxt = J(all);
  ok("no kid or family name, no web address anywhere in the starters' activities", !NAMES.test(allTxt) && !/https?:|www\.|"url"|"kidOpen"|"pdf"/.test(allTxt), (allTxt.match(NAMES) || [])[0]);
  ok("every field is one the app knows (key, title, emoji, kind, lines, points, desc, steps, type, mom, supplies)", all.every(a => Object.keys(a).every(k => ["key", "title", "emoji", "kind", "lines", "points", "desc", "steps", "type", "mom", "supplies"].indexOf(k) >= 0)));
}

console.log("\n── the notebook page: every starter activity prints byte-identical ──");
{
  const f = N0.A.fn, fb = B0.A.fn, th = NB.unitActivityPage ? null : 1;
  ok("notebooks.js exports the one activity page (UNITACTPG)", typeof NB.unitActivityPage === "function" && !th);
  let same = true; const bad = [];
  IDS.forEach(id => {
    const un = mk(SU, id), ub = mk(SB, id);
    un.activities.forEach((a, i) => {
      const b = ub.activities[i];
      ["little", "early", "middle", "upper"].forEach(band => {
        const o = { title: un.title, emoji: un.emoji, weekNum: 12, pool: [{ name: "Ruby", portrait: { emoji: "💎" } }] };
        if (NB.unitActivityPage(Object.assign({}, a, { band }), o) !== NB.unitActivityPage(Object.assign({}, b, { band }), o)) { same = false; bad.push(a.key + " raw " + band); }
      });
      ["kid_a", "kid_d"].forEach(kid => {
        const sn = f("uapSpec")(un, a, kid), sb = fb("uapSpec")(ub, b, kid);
        if (J(sn) !== J(sb) || NB.unitActivityPage(sn, { title: un.title, emoji: un.emoji, weekNum: 12 }) !== NB.unitActivityPage(sb, { title: ub.title, emoji: ub.emoji, weekNum: 12 })) { same = false; bad.push(a.key + " spec " + kid); }
      });
    });
  });
  ok("all 13: the record itself (4 bands) and uapSpec (two kids) give the same page NOW and BEFORE — the steps still print as ☐", same, bad);
  const gc = mk(SU, RG).activities.find(a => a.key === "grow_crystals"), pg = NB.unitActivityPage(f("uapSpec")(mk(SU, RG), gc, "kid_a"), { title: "Rocks", emoji: "💎" });
  ok("…the page draws no 🎒 supplies line and no 👩 with Mom (those are Today's card's, not the paper's)", pg.indexOf("Stir in the salt.") > 0 && pg.indexOf("\u{1F392}") < 0 && pg.indexOf("\u{1F469}") < 0 && pg.indexOf("data-uah") < 0 && pg.indexOf("| mom") < 0);
}

console.log("\n── a family that adds the starter now ──");
{
  const N = await world(INDEX, null, { block: true }), B = await world(BPATH, null, { block: true });
  for (const W of [N, B]) { IDS.forEach(id => W.A.fn("starterUnitAdd")(id)); await W.flush(); }
  const dn = N.db.get("unitStudies"), dbb = B.db.get("unitStudies");
  ok("＋ Add to our family writes each record once (create-only transaction) — with the kinds, mom and supplies on the activities",
    IDS.every(id => dn[id] && J(acts(dn[id])) === J(mk(SU, id).activities)) && N.db.log.filter(l => /^unitStudies/.test(l.path)).every(l => l.op === "tx"), IDS.map(id => !!dn[id]));
  ok("…and the same record BEFORE minus exactly those fields (addedTs aside)", IDS.every(id => { const a = JSON.parse(J(dn[id])), b = JSON.parse(J(dbb[id])); a.activities = acts(a).map(strip); return J(a) === J(b); }));
  // enrolled kids → the 🎨 section shows
  for (const W of [N, B]) { IDS.forEach(id => W.db.api("x").ref("unitStudies/" + id + "/enrolled").set({ kid_a: true, kid_b: true })); await W.flush(); }
  const page = (W, id) => W.A.fn("renderUnitDetail")(W.us()[id]);
  const rn = page(N, RG), cn = page(N, "construction_machines"), kn = page(N, "cats_house_and_wild");
  ok("rocks: the section reads \"🎨 Activities\" and all seven rows carry the 🧪 Hands-on chip", rn.indexOf("🎨 Activities") > 0 && rn.indexOf("📓 Notebook activities") < 0 && rn.split('data-uak-chip="hands"').length === 8, rn.split('data-uak-chip="hands"').length - 1);
  ok("construction: \"🎨 Activities\", one 🧪 chip (Build a machine); the two drawing / writing pages carry none", cn.indexOf("🎨 Activities") > 0 && cn.split('data-uak-chip="hands"').length === 2 && cn.split("data-uak-chip=").length === 2);
  ok("cats: all three stay 📓 — \"📓 Notebook activities\", no chip, the page byte-identical to BEFORE", kn.indexOf("📓 Notebook activities") > 0 && kn.indexOf("data-uak-chip") < 0 && kn === page(B, "cats_house_and_wild"));
  ok("🧪 keeps 🖨 Print and 📓 Notebook on every row (only 📱 / 🔗 hide them): the same buttons NOW and BEFORE",
    rn.split("unitPrintActivity(").length === page(B, RG).split("unitPrintActivity(").length && rn.split("unitToggleNbActivity(").length === page(B, RG).split("unitToggleNbActivity(").length && rn.split("unitPrintActivity(").length > 7);
  // Mom gives the unit days (the day editor / Builder write track; here the same shape, set directly) — Family Time lays them
  for (const W of [N, B]) { W.db.api("x").ref("unitStudies/" + RG + "/track").set(TRACK()); await W.flush(); }
  const res = (W, d) => W.A.fn("utResOf")([G(W, RG, d).day]).supplies;
  ok("utResOf, Day 5 (Grow salt crystals): salt, warm water, 1 dish — Mom's (kids:false), tagged act:true",
    J(res(N, "d5")) === J([{ name: "salt", kids: false, act: true }, { name: "warm water", kids: false, act: true }, { name: "dish", kids: false, qty: "1", act: true }]), res(N, "d5"));
  ok("utResOf, Day 1 (Rock hunt, none named): nothing; BEFORE: nothing on any day", res(N, "d1").length === 0 && BLOCK_DAYS.every((t, i) => res(B, "d" + (i + 1)).length === 0));
  const m0 = N.db.log.length, L = N.A.fn("lrBuildList")(), fam = L.kids.find(k => k.kid === "_family"), sup = fam ? (fam.kinds.find(k => k.kind === "supplies") || { items: [] }).items : [];
  const wk = w => sup.filter(it => it.weeks.indexOf(w) >= 0).map(it => it.name);
  ok("🧺 Sunday list, 🏡 Family, this week (Days 1–5, Mon 11/9–Fri 11/13): rocks, penny, magnet, salt, warm water, dish — rocks once", J(wk(0)) === J(["rocks", "penny", "magnet", "salt", "warm water", "dish"]), [L.w0, wk(0)]);
  ok("…next week (Days 6–7, Mon 11/16–Tue 11/17): smooth rock, paint, gems, oats or sand, spoon or brush", J(wk(1)) === J(["smooth rock", "paint", "gems", "oats or sand", "spoon or brush"]), [L.w1, wk(1)]);
  const LB = B.A.fn("lrBuildList")();
  ok("BEFORE (no supplies on the starter): no 🏡 Family supplies at all", !LB.kids.some(k => k.kid === "_family"));
  ok("building the list wrote nothing", N.db.log.slice(m0).filter(l => !/^_debug/.test(l.path)).length === 0);
  const card = d => N.A.fn("dcDayHTML")(G(N, RG, d));
  const c5 = card("d5"), c3 = card("d3");
  ok("Today's card, Day 5: the steps as a list, \"👩 with Mom\", no 🎒 line (every supply is Mom's)", /data-uah-steps="1"[^]*Stir in the salt\./.test(c5) && c5.indexOf('data-uah-mom="1"') > 0 && c5.indexOf("data-uah-sup") < 0);
  ok("Today's card, Day 3 (Scratch test): \"🎒 rocks · 1 penny\", no \"with Mom\"", c3.indexOf("🎒 rocks · 1 penny<") > 0 && c3.indexOf("data-uah-mom") < 0, (c3.match(/data-uah-sup[^<]*</) || [])[0]);
  const ed = N.A.fn("utaaEditorHTML")(N.us()[RG], N.A.fn("utDay")(N.A.fn("utUnits")()[RG], "d5"));
  ok("the day editor's ✎ on Day 5 reads it back as Mom would have typed it: 🧪 pressed, \"salt | mom …\", the steps, Mom leads it ticked",
    /id="uak-rocks_gems_minerals-d5-hands" aria-pressed="true"/.test(ed) && ed.indexOf(">salt | mom\nwarm water | mom\n1 dish | mom</textarea>") > 0 && ed.indexOf(">Mom gets warm water.\nStir in the salt.\nPour it in a dish.\nDraw the crystals you see.</textarea>") > 0 && /id="utaa-rocks_gems_minerals-d5-mom" type="checkbox" checked/.test(ed));
}

console.log("\n── a family that already added the starter (§5 Q6: left alone) ──");
{
  // the copy: made from origin/main's starter (BEFORE), with days, two kids, a queue, a claim, a log
  const copy = {};
  IDS.forEach(id => { const u = mk(SB, id); u.addedTs = 1762000000000; u.enrolled = { kid_a: true, kid_b: true }; copy[id] = u; });
  copy[RG].track = TRACK(); copy[RG].nbActivity = { kid_a: { grow_crystals: true, pet_rock: true }, kid_b: { magnet_test: true } };
  copy[RG].activityClaims = { kid_a: { pet_rock: { ts: 1762100000000 } } }; copy[RG].activityLog = { kid_b: { rock_hunt: { ts: 1762200000000, points: 5 } } };
  copy.cats_house_and_wild.nbActivity = { kid_a: { cat_report: true } };
  const N = await world(INDEX, copy, { block: true }), B = await world(BPATH, copy, { block: true });
  const both = fn => [fn(N), fn(B)];
  const same = (lbl, fn) => { const r = both(fn); ok(lbl, J(r[0]) === J(r[1]) && r[0] !== undefined, [String(J(r[0])).slice(0, 200), String(J(r[1])).slice(0, 200)]); return r[0]; };
  ok("the copy in memory NOW is the copy BEFORE (nothing hydrated from the code)", J(N.us()) === J(B.us()));
  IDS.forEach(id => same(id + ": the Units page (Mom) byte-identical", W => W.A.fn("renderUnitDetail")(W.us()[id])));
  same("rocks: no kind chip on the family's copy (all 📓, \"📓 Notebook activities\")", W => { const h = W.A.fn("renderUnitDetail")(W.us()[RG]); return [h.indexOf("data-uak-chip") < 0, h.indexOf("📓 Notebook activities") > 0]; });
  same("the Units tab (renderUnits) byte-identical, starter Add cards included", W => { const el = S.makeEl("div"); W.A.fn("renderUnits")(el); return el.innerHTML; });
  same("the ＋ Add cards for a family with none of the three: byte-identical (an Add card shows no activity)", W => { const keep = W.A.get("unitStudies"); W.A.set("unitStudies", {}); const h = W.A.fn("_starterUnitsHtml")(); W.A.set("unitStudies", keep); return h; });
  same("the notebook insert for each enrolled kid (haBuildUnitInsight) byte-identical — and its pages", W => [].concat(...["kid_a", "kid_b"].map(k => IDS.map(id => { const ins = W.A.fn("haBuildUnitInsight")(k, W.us()[id]); return [J(ins), (ins.activities || []).map(a => NB.unitActivityPage(a, { title: ins.title, emoji: ins.emoji, weekNum: 12 })).join("")]; }))));
  same("every rocks day: utResOf, the Days 🎒 cell, Today's card, the day editor — byte-identical", W => BLOCK_DAYS.map((t, i) => { const g = G(W, RG, "d" + (i + 1)); return [J(W.A.fn("utResOf")([g.day])), J(W.A.fn("uahSupplyCells")(g.u, g.day)), W.A.fn("dcDayHTML")(g), W.A.fn("utaaEditorHTML")(W.us()[RG], W.A.fn("utDay")(g.u, "d" + (i + 1)))]; }));
  same("the 🧺 Sunday list (lrBuildList + its HTML) byte-identical", W => { const L = W.A.fn("lrBuildList")(); return [J(L), W.A.fn("lrSundayHTML")(L)]; });
  same("＋ Add the new stages: nothing pending, the row empty, the plan says the copy is current — NOW as BEFORE", W => IDS.map(id => { const P = W.A.fn("suPlan")(id, 1); return [W.A.fn("suPending")(W.us()[id]), W.A.fn("suRowHtml")(W.us()[id]), P.ok, P.why, J(P.writes)]; }));
  // the write paths, the same taps in both worlds
  const mark = both(W => W.db.log.length);
  for (const W of [N, B]) {
    const f = W.A.fn;
    f("unitToggleNbActivity")(RG, "kid_b", "gem_dig");          // 📓 queue one more
    f("unitActivityApprove")(RG, "kid_a", "pet_rock");          // ✓ Approve the claim (+5)
    f("unitActivityDone")(RG, "kid_b", "magnet_test");          // ✓ Done straight (+5)
    f("unitActivityDone")(RG, "kid_b", "rock_hunt");            // ↩︎ Not done
    f("unitActivityClaim")(RG, "kid_a", "grow_crystals");       // 🙋 a queued one
    f("unitActivityDone")("construction_machines", "kid_a", "build_it");
    await W.flush();
  }
  const logOf = (W, m) => W.db.log.slice(m).filter(l => !/^_debug/.test(l.path)).map(l => [l.op, l.path, l.keys || null, l.n, l.at]);
  ok("the taps (queue, approve, done, undo, claim) write the same paths, in the same order, NOW and BEFORE", logOf(N, mark[0]).length >= 6 && J(logOf(N, mark[0])) === J(logOf(B, mark[1])), [logOf(N, mark[0]).length, logOf(B, mark[1]).length]);
  ok("…and leave the same database behind (the copy unchanged but for those taps; no activity field written)", J(N.db.get("")) === J(B.db.get("")) && !logOf(N, mark[0]).some(l => /\/activities/.test(l[1])));
  // an OLDER copy (starterVer 0, one card short) — ＋ Add the new stages has something to add: the same writes, never an activity
  const old = JSON.parse(J(copy)); old[RG].starterVer = 0; old[RG].decks[0].cards.pop();
  const N2 = await world(INDEX, old), B2 = await world(BPATH, old);
  const P = [N2, B2].map(W => W.A.fn("suPlan")(RG, 7));
  ok("an older copy: ＋ Add the new stages plans the same writes NOW and BEFORE (the missing card, starterVer) — no activity path",
    P[0].ok && P[0].writes.length > 0 && J(P[0].writes) === J(P[1].writes) && !P[0].writes.some(w => /activities/.test(w.path)) && J(P[0].sum) === J(P[1].sum), P[0].writes.map(w => w.path));
  const m2 = [N2.db.log.length, B2.db.log.length];
  N2.A.fn("suApply")(P[0]); B2.A.fn("suApply")(P[1]); await N2.flush(); await B2.flush();
  ok("…Yes writes one update with exactly those paths in both, and the database after is the same", J(logOf(N2, m2[0])) === J(logOf(B2, m2[1])) && logOf(N2, m2[0]).length === 1 && J(N2.db.get("unitStudies")) === J(B2.db.get("unitStudies")) && J(acts(N2.db.get("unitStudies/" + RG))) === J(PRE[RG]), logOf(N2, m2[0]));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})().catch(e => { console.log("CRASH " + (e && e.stack || e)); process.exit(1); });
