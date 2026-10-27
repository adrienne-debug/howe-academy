// 📚 UNITSTAB — the Units tab becomes 📚 All units · 🧒 one tab per kid · 🏡 Family ("One shape" §4; BRIEF_units_build_2026-10-27.md
//   T3; her go 2026-10-27). Runs the REAL UNITSTAB + UNITTRACK + PUTSCHED blocks over a Howe-shaped and a DeWalt-shaped fixture.
//   · the three renders; schedule state strings; rung counts match a hand-computed fixture
//   · no write path in the block (no db.ref, no set/update, no famWrite) — only today's buttons by name
//   · renders with zero units, zero blocks, a kid with nothing; kids see no editor; no kid's name in the block
//   · renderUnits draws the page through the block (guarded) and still opens a unit's detail as today
//   run: node test_units_tab.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
const UTS = cut("// UNITSTAB_START", "// UNITSTAB_END");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

const HOWE = ["lincoln", "ellis", "lucy", "julian"], DEWALT = ["taylor", "makenzie", "andrew", "caleb"];
function fixture(roster) {
  const k0 = roster[0], k1 = roster[1], k3 = roster[3];
  const units = {
    thanksgiving: { id: "thanksgiving", title: "Thanksgiving", emoji: "🦃", enrolled: { [k0]: true, [k1]: true }, author: { family: "DeWalt", first: "Sara" }, version: 1, nbInsert: true,
      decks: [{ key: "Thanksgiving", cards: [{ name: "Wampanoag" }, { name: "Mayflower" }, { name: "Plymouth" }, { name: "Squanto" }] }], activities: [{ key: "turkey", title: "Hand turkey", points: 5 }],
      activityClaims: { [k1]: { turkey: { ts: 1 } } }, activityLog: {},
      track: { mode: "seq", perWeek: 4, days: [{ id: "d1", n: 1, t: "Who were the Wampanoag?" }, { id: "d2", n: 2, t: "The Mayflower" }, { id: "d3", n: 3, t: "Plymouth" }] } },
    math_fluency_path: { id: "math_fluency_path", starter: "math_fluency_path", title: "Math Fluency Path", emoji: "🧮", nbInsert: false, enrolled: { [k3]: true }, stages: [{ n: 1, label: "Numbers 1–10" }, { n: 2, label: "Numbers 11–20" }], kidStage: { [k3]: { stage: 1 } },
      decks: [{ key: "Numbers", cards: [{ name: "1", stage: 1, family: "a", order: 1 }, { name: "2", stage: 1, family: "a", order: 2 }, { name: "11", stage: 2, family: "b", order: 3 }] }] },
    rs4k_4: { id: "rs4k_4", title: "RS4K Book 4", emoji: "🔬", enrolled: {}, decks: [{ key: "RS4K Book 4", gate: { subject: "rs4k" }, cards: [{ name: "ecosystem", ch: 3 }] }] },
    nodays: { id: "nodays", title: "Zoology", emoji: "🦓", enrolled: {}, decks: [{ key: "Zoology", cards: [{ name: "mammal" }] }], track: { mode: "seq", days: [] } }
  };
  const blocks = { ft: { name: "Family Time", kids: roster.slice(), days: ["Mon", "Tue", "Wed", "Thu"], at: "lunch", items: [
    { key: "th", name: "Thanksgiving", minutes: 30, track: { mode: "seq", list: [{ t: "Day 1 — Who were the Wampanoag?", n: 1, u: { id: "thanksgiving", d: "d1" } }, { t: "Day 2 — The Mayflower", n: 1, u: { id: "thanksgiving", d: "d2" } }, { t: "Day 3 — Plymouth", n: 1, u: { id: "thanksgiving", d: "d3" } }] } },
    { key: "r", name: "Read Aloud", minutes: 20 }] } };
  const mastery = {};
  mastery[k0] = [{ id: "a1", subject: "Thanksgiving", prompt: "Wampanoag", status: "introduction", tier: "daily" }, { id: "a2", subject: "Thanksgiving", prompt: "Mayflower", status: "active", tier: "every_other_day" }, { id: "a3", subject: "Thanksgiving", prompt: "Plymouth", status: "active", tier: "weekly" }, { id: "a4", subject: "Thanksgiving", prompt: "Squanto", status: "active", tier: "graduated" }, { id: "a5", subject: "Thanksgiving", prompt: "Squanto", dir: "prod", twinOf: "a4", status: "active", tier: "weekly" }, { id: "a6", subject: "Other", prompt: "x", status: "active", tier: "weekly" }];
  mastery[k1] = [{ id: "b1", subject: "Thanksgiving", prompt: "Wampanoag", status: "active", tier: "bi_weekly" }, { id: "b2", subject: "Thanksgiving", prompt: "Mayflower", status: "active", tier: "monthly" }, { id: "b3", subject: "Thanksgiving", prompt: "Plymouth", status: "parked" }];
  mastery[k3] = [{ id: "c1", subject: "Numbers", prompt: "1", status: "active", tier: "weekly" }, { id: "c2", subject: "Numbers", prompt: "2", status: "introduction" }];
  mastery[k0 + "_ourwords"] = { ow1: { v: 1, kind: "add", unit: "thanksgiving", deck: "Thanksgiving", name: "cornucopia", src: "quick", order: 1, ts: 1 }, ow2: { v: 1, kind: "link", unit: null, deck: "Other", name: "x", cardId: "a6", linkDeck: "Other", src: "quick", order: 1, ts: 1 } };
  return { units, blocks, mastery };
}
function world(o) {
  o = o || {}; const roster = o.roster || DEWALT; const F = o.fixture || fixture(roster); const writes = [];
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, isFinite, WeakMap,
    unitStudies: F.units, ROSTER: roster.slice(), KID_COLOR: Object.fromEntries(roster.map((k, i) => [k, ["#1e3a5f", "#9a3412", "#7c3aed", "#15803d"][i]])),
    momHere: () => o.mom !== false, _dryRun: () => false, db: { ref: p => ({ set: v => writes.push([p, v]), update: v => writes.push([p, v]) }) },
    rulesData: { familyBlocks: F.blocks }, currData: { subjects: o.subjects || {}, resources: {} }, masteryData: F.mastery, notebookSettings: { [roster[0]]: { unitDays: { thanksgiving: { Wed: true } } } },
    cap: s => s ? s[0].toUpperCase() + s.slice(1) : s, famDefs: () => ctx.rulesData.familyBlocks, famList: x => Array.isArray(x) ? x.filter(v => v != null) : (x && typeof x === "object" ? Object.keys(x).sort().map(k => x[k]).filter(v => v != null) : []),
    famTrack: it => (it && it.track && (it.track.mode === "week" || it.track.mode === "seq")) ? it.track : null,
    famLessonMap: (b, id, it) => ({ byDate: { "2026-10-21": "Day 2 — The Mayflower", "2026-10-22": "Day 3 — Plymouth" }, now: "Day 2 — The Mayflower", total: 3, left: 2 }),
    famLessonFor: t => t.famItem === "th" ? "Day 2 — The Mayflower" : "", famCellState: (b, it, ds) => ({ runs: ds === "2026-10-21", kids: roster.slice() }), famHomeGo: () => {}, routineDateISO: () => "2026-10-21",
    cbTodayISO: () => "2026-10-21", _todayDay: "wednesday", effectiveDay: t => t.day, checked: o.checked || {}, claimed: o.claimed || {},
    weekData: { tasks: [{ id: "t1", who: roster[0], famBlock: "ft", famItem: "th", day: "wednesday", title: "🏡 Thanksgiving" }, { id: "t2", who: roster[0], famBlock: "ft", famItem: "r", day: "wednesday" }, { id: "t3", who: roster[1], famBlock: "ft", famItem: "th", day: "wednesday" }] },
    nbUnitDays: (kid, uid) => ((((ctx.notebookSettings || {})[kid] || {}).unitDays || {})[uid]) || {}, lidDoneIdx: () => new Set([0]),
    _unitMomLockHtml: () => '<span id="momlock"></span>', _starterUnitsHtml: () => '<div id="starters"></div>', openUnit: () => {}, unitOpenId: null, renderUnits: () => {}, document: { getElementById: () => null },
    unitStageStatus: (u, kid) => u.kidStage && u.kidStage[kid] ? { stage: 1, total: 2, on: 1, learn: 1, ready: false, next: { n: 2 } } : null, _unitStagedEnrollPending: u => !!(u && u.stages), _unitActs: u => u.activities || [] };
  if (o.noOw !== true) ctx.owList = (kid, opt) => { const recs = ctx.masteryData[kid + "_ourwords"] || {}; return Object.keys(recs).map(id => Object.assign({ owId: id }, recs[id], { state: "weekly" })).filter(r => !r.off && (opt.unit === undefined || (r.unit || null) === (opt.unit || null))); };
  vm.createContext(ctx);
  vm.runInContext(cut("// UNITTRACK_START", "// UNITTRACK_END") + "\n" + cut("// PUTSCHED_START", "// PUTSCHED_END") + "\n" + UTS + "\nObject.defineProperty(this,'utsTab',{get:()=>utsTab,set:v=>{utsTab=v;}});", ctx);
  return { ctx, writes };
}
const C = (h, re) => (h.match(new RegExp(re.source, "g")) || []).length;

console.log("── the block never writes ──");
{
  ok("no db.ref, no .set( / .update( / .transaction(, no famWrite / lrWrite / utWrite / psApply in the block", !/db\.ref\(|\.set\(|\.update\(|\.transaction\(|famWrite\(|lrWrite\(|utWrite\(|psApply\(|unitEnroll\(\s*[a-z]/.test(UTS.replace(/\/\/.*$/gm, "").replace(/onclick=\\?"[^"]*"/g, "")));
  ok("the only writers named are today's buttons (unitEnroll, unitToggleNbInsert, unitStageMoveUp, unitStageFormOpen) and the other steps' openers (ubOpen, psOpen) inside onclick strings", /unitToggleNbInsert\(/.test(UTS) && /unitEnroll\(/.test(UTS) && /unitStageMoveUp\(/.test(UTS) && /psOpen\(/.test(UTS) && /ubOpen\(\)/.test(UTS));
  ok("no kid's name in the block; no shuffle emoji in index.html", !/lincoln|ellis|lucy|julian/i.test(UTS.replace(/\/\/.*$/gm, "")) && src.indexOf("🔀") < 0);
  ok("renderUnits draws through the block (guarded) after the open-unit check (the Builder's own hook may sit between)", /if\(unitOpenId && unitStudies\[unitOpenId\]\)\{ con\.innerHTML=renderUnitDetail\(unitStudies\[unitOpenId\]\); return; \}\n(  if\(typeof ubOpenHTML==="function"\)[^\n]*\n)?  if\(typeof utsPageHTML==="function"\)\{ con\.innerHTML=utsPageHTML\(\); return; \}/.test(src));
}
console.log("\n── 📚 All units (DeWalt-shaped) ──");
{
  const w = world(), c = w.ctx; c.utsTab = "all"; const h = c.utsPageHTML();
  ok("the strip: All units · one chip per kid in their colour · Family", C(h, /data-uts-strip/) === 1 && /📚 All units/.test(h) && /Taylor/.test(h) && /Caleb/.test(h) && /🏡 Family/.test(h) && /#1e3a5f/.test(h));
  ok("three groups: Ours (Thanksgiving, Zoology) · Starter (Math Fluency) · Book companions (RS4K)", /Ours · 2/.test(h) && /Starter · 1/.test(h) && /Book companions · 1/.test(h));
  ok("a row: emoji, title, decks · counts, who is enrolled, the notebook switch (Mom), a source line", /🦃/.test(h) && /Thanksgiving · 4/.test(h) && /✓ Taylor, Makenzie/.test(h) && /unitToggleNbInsert\('thanksgiving'\)/.test(h) && /by Sara · v1/.test(h));
  ok("schedule state: 🏡 Family Time · Day 2 of 3 · today; Zoology 'no days yet'; RS4K 'no days yet'", /🏡 Family Time · Day 2 of 3 · today/.test(h) && C(h, /no days yet/) === 3);
  ok("the starter list rides under the library; Mom's lock chip is in the header", /id="starters"/.test(h) && /id="momlock"/.test(h));
  const k = world({ mom: false }).ctx; k.utsTab = "all"; const hk = k.utsPageHTML();
  ok("a kid sees the rows and states but no notebook switch and no Build", !/unitToggleNbInsert/.test(hk) && !/Build a unit/.test(hk) && /🏡 Family Time · Day 2 of 3/.test(hk) && /📓 off/.test(hk));
  ok("utsSchedState on a unit with days nobody scheduled: 'not on the schedule'", (() => { const c2 = world().ctx; c2.rulesData.familyBlocks.ft.items = [{ key: "r", name: "Read Aloud" }]; return c2.utsSchedState(c2.unitStudies.thanksgiving) === "not on the schedule"; })());
  ok("a kid's own subject pointing at the unit: '📚 Caleb’s subject · Day 2 of 3'", (() => { const c2 = world({ subjects: { caleb: { thanksgiving: { display: "Thanksgiving", lessonSeq: ["Day 1", "Day 2", "Day 3"], lessonIds: ["a", "b", "c"], unit: { id: "thanksgiving" } } } } }).ctx; return /📚 Caleb’s subject · Day 2 of 3/.test(c2.utsSchedState(c2.unitStudies.thanksgiving)); })());
}
console.log("\n── 🧒 one kid (Howe-shaped) ──");
{
  const w = world({ roster: HOWE, claimed: { t3: 1 } }), c = w.ctx; c.utsTab = "lincoln"; const h = c.utsPageHTML();
  ok("Today: Lincoln's family card → Thanksgiving · Day 2: The Mayflower · not yet · Open the card (the unit, since no board yet)", /📅 Today/.test(h) && /Day 2: The Mayflower/.test(h) && /not yet/.test(h) && /openUnit\('thanksgiving'\)/.test(h) && /Open the card/.test(h));
  const r = c.utsRungs("lincoln", c.unitStudies.thanksgiving);
  ok("rung counts from his own cards (the twin and the other deck left out): 1 learning · 1 every few days · 1 weekly · 1 kept", JSON.stringify(r) === JSON.stringify({ learning: 1, few: 1, weekly: 1, biweekly: 0, monthly: 0, kept: 1, parked: 0, total: 4 }), r);
  ok("…drawn as chips", /1 learning/.test(h) && /1 every few days/.test(h) && /1 weekly/.test(h) && /1 kept/.test(h));
  ok("📝 Our words 1 (his add record in this unit), notebook on · Wed", /📝 Our words 1/.test(h) && /📓 notebook on · Wed/.test(h));
  ok("Extra cards: both records, by deck, read only (the link marked ↪)", /Extra cards · 2/.test(h) && /cornucopia/.test(h) && /x ↪/.test(h));
  ok("Not enrolled yet: Math Fluency (staged → + Lincoln opens the stage form), RS4K and Zoology (+ Lincoln enrolls)", /Not enrolled yet · 3/.test(h) && /unitStageFormOpen\('math_fluency_path','lincoln'\)/.test(h) && /unitEnroll\('rs4k_4','lincoln'\)/.test(h));
  c.utsTab = "ellis"; const he = c.utsPageHTML();
  ok("Ellis: 1 bi-weekly · 1 monthly · 1 waiting; his claim waits for Mom; Today is 'waiting for Mom' (claimed)", /1 bi-weekly/.test(he) && /1 monthly/.test(he) && /1 waiting/.test(he) && /✋ 1 waiting for Mom/.test(he) && /waiting for Mom<\/span>/.test(he));
  c.utsTab = "julian"; const hj = c.utsPageHTML();
  ok("Julian: a staged unit shows Stage 1 · 1 of 2 on the ladder · 1 learning; no Today; no extra cards", /Stage 1 · 1 of 2 on the ladder · 1 learning/.test(hj) && /No unit day on today/.test(hj) && /No extra cards yet/.test(hj));
  c.utsTab = "lucy"; const hl = c.utsPageHTML();
  ok("Lucy, in nothing: Today empty, 'Not in any unit yet', every unit under Not enrolled", /Not in any unit yet/.test(hl) && /Not enrolled yet · 4/.test(hl));
  const kk = world({ roster: HOWE, mom: false }).ctx; kk.utsTab = "lincoln"; const hkk = kk.utsPageHTML();
  ok("a kid's view: progress yes, no + Kid buttons, no move-up", /1 learning/.test(hkk) && !/unitEnroll\(/.test(hkk) && !/unitStageMoveUp/.test(hkk) && !/unitStageFormOpen/.test(hkk));
  ok("a checked card today reads ✓ checked", (() => { const c2 = world({ roster: HOWE, checked: { t1: true } }).ctx; c2.utsTab = "lincoln"; return /✓ checked/.test(c2.utsPageHTML()); })());
  ok("with no Our words block loaded the kid tab still draws (no chip, no Extra cards)", (() => { const c2 = world({ roster: HOWE, noOw: true }).ctx; c2.utsTab = "lincoln"; const h2 = c2.utsPageHTML(); return !/Our words/.test(h2) && !/Extra cards/.test(h2) && /Their units · 1/.test(h2); })());
}
console.log("\n── 🏡 Family ──");
{
  const w = world(), c = w.ctx; c.utsTab = "fam"; const h = c.utsPageHTML();
  ok("Today's card for the block that runs today (opens the pointed unit until the board exists); ⚙ Edit on the Grid for Mom", /Today’s card · Family Time/.test(h) && /openUnit\('thanksgiving'\)/.test(h) && /Edit on the Grid/.test(h));
  ok("the block card: name, kids, days, start; items with track state — Thanksgiving 'Day 2' with the unit's emoji and link, Read Aloud 'daily'", /🏡 Family Time/.test(h) && /Taylor, Makenzie, Andrew, Caleb · Mon Tue Wed Thu · after lunch/.test(h) && /🦃 Thanksgiving/.test(h) && /Day 2 — The Mayflower|Day 2</.test(h) && /data-uts-item="r"[^>]*>.*Read Aloud.*daily/.test(h));
  ok("✚ Put a unit on the schedule lists only units with days that are not on it yet (none here: Zoology has no days)", !/Put a unit on the schedule/.test(h));
  ok("…and offers Zoology once it has a day", (() => { const c2 = world().ctx; c2.unitStudies.nodays.track.days = [{ id: "z1", n: 1, t: "Mammals" }]; c2.utsTab = "fam"; const h2 = c2.utsPageHTML(); return /Put a unit on the schedule/.test(h2) && /psOpen\('nodays'\)/.test(h2) && !/psOpen\('thanksgiving'\)/.test(h2); })());
  ok("Shared units · by kid: Thanksgiving with a rung line per enrolled kid", /Shared units · by kid/.test(h) && /1 bi-weekly/.test(h) && /1 kept/.test(h));
  const z = world().ctx; z.rulesData.familyBlocks = {}; z.utsTab = "fam"; const hz = z.utsPageHTML();
  ok("zero blocks: 'No family time yet' with Mom's ＋ Add family time", /No family time yet/.test(hz) && /Add family time/.test(hz));
  const k = world({ mom: false }).ctx; k.utsTab = "fam"; const hk = k.utsPageHTML();
  ok("a kid's Family view: the blocks and states, no Edit on the Grid, no Put a unit", /🏡 Family Time/.test(hk) && !/Edit on the Grid/.test(hk) && !/Put a unit on the schedule/.test(hk));
}
console.log("\n── empty worlds, the strip, phone width ──");
{
  const e = world().ctx; e.unitStudies = {}; e.rulesData.familyBlocks = {}; e.utsTab = "all";
  ok("zero units: 'No unit studies yet' and the starters; the kid tab and Family still draw", /No unit studies yet/.test(e.utsPageHTML()) && (e.utsTab = "caleb", /Not in any unit yet/.test(e.utsPageHTML())) && (e.utsTab = "fam", /No family time yet/.test(e.utsPageHTML())));
  const s = world().ctx; s.utsTab = "nobody"; const hs = s.utsPageHTML();
  ok("an unknown tab falls back to All units", s.utsTab === "all" && /Ours · 2/.test(hs));
  s.utsSet("caleb"); ok("utsSet switches the tab and closes an open unit", s.utsTab === "caleb" && s.unitOpenId === null);
  const all = [(() => { s.utsTab = "all"; return s.utsPageHTML(); })(), (() => { s.utsTab = "caleb"; return s.utsPageHTML(); })(), (() => { s.utsTab = "fam"; return s.utsPageHTML(); })()].join("");
  ok("phone width: no fixed widths past 560px, every row wraps (flex-wrap), nothing scrolls sideways", !/width:\s*[6-9]\d\d px|min-width:\s*[3-9]\d\d/.test(all) && /max-width:560px/.test(all) && C(all, /overflow-x/) === 0);
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
