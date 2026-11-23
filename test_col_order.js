/* test_col_order.js — COLORDER (Curriculum streamline slice 7, PLAN_curriculum_streamline_2026-11-10.md §3.3 · §4 row 7 ·
 * §5 question 6). Her answer 2026-11-10: "i think alphabetical order but draggable to be in a customizable order as well" —
 * then "or arrows to change if that's better". Built on her "Yes, build them" 2026-11-23.
 *
 *   1  the pure gvColOrder: no saved order → the same array (A–Z untouched); a saved order kept; a subject added later
 *      appended A–Z; a stale key ignored; a lane key moves as one column; the database's {0:…} shape; clearing → A–Z
 *   2  the grid: with no saved order it is byte-identical to this tree minus the block (end-date view off and on, Mom and
 *      not Mom); with an order set the headers follow it and are the same cells, only reordered; the custom order wins over
 *      the end-date view; the ⋯ More end-date item says so, and is unchanged when no order is set
 *   3  📅 Kid's year ▸ All subjects: the panel minus the Column order list is byte-identical to this tree minus the block;
 *      the list is the grid's columns in the grid's order, a lane as ONE entry; ▲ first / ▼ last disabled; Back to A–Z only
 *      when an order is set; not Mom → no list
 *   4  the writes: ▲ ▼ = one set of curriculum/colOrder/<kid> (the whole small array), Back to A–Z = one remove of it,
 *      ▲ on the first / ▼ on the last = nothing; not Mom and dry run write nothing; another kid's order is untouched; the
 *      end-date toggle still writes nothing to the database
 *   5  the source: markers, one ref() pattern, guarded writes, no relay / scheduler call, nothing outside the block reads
 *      colOrder, no new ids, no 🔀, the three call sites
 *
 * Baseline = this tree with the COLORDER block cut out (the call sites fall back through their typeof guards), never a
 * pinned old commit — so it still holds after the branch is merged.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra).slice(0, 700) + ")" : "")); } }

function _block(S, a, b) { const i = S.indexOf(a), j = S.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return S.slice(i, j); }
function _optBlock(S, a, b) { const i = S.indexOf(a), j = S.indexOf(b, i); return i < 0 || j < 0 ? "" : S.slice(i, j); }
function _braceSlice(S, name) {
  const sig = "function " + name + "("; const i = S.indexOf(sig); if (i < 0) throw new Error("fn " + name);
  let d = 0, j = S.indexOf("{", i);
  for (let k = j; k < S.length; k++) { if (S[k] === "{") d++; else if (S[k] === "}") { d--; if (d === 0) return S.slice(i, k + 1); } }
  throw new Error("unbalanced " + name);
}
const BLOCK = _block(src, "// COLORDER_START", "// COLORDER_END");
// this tree minus the feature: the block cut out (its call sites keep a typeof fallback to the old expression)
const STRIP = src.slice(0, src.indexOf("// COLORDER_START")) + src.slice(src.indexOf("// COLORDER_END") + "// COLORDER_END".length);

// ── the world: the grid harness test_currtools.js uses (real renderCurrGrid + lanes + derived columns) + KIDYEAR ──
const TODAY = "2026-09-13";
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function subj(display, n, days, tpw) {
  const seq = Array.from({ length: n }, (_, i) => display + " L" + (i + 1));
  return { display, lessonSeq: seq, lessonIds: seq.map((_, i) => "L" + String(i + 1).padStart(4, "0")), doneImportedAt: 1, planId: "kid__" + display,
    allowedDays: days, timesPerWeek: tpw, pacing: { mode: "timesPerWeek", tpw }, minutes: 15, mom: "none", device: "paper", rules: "" };
}
function lessonsRows(weeks) {
  const L = {}; const t0 = Date.UTC(2026, 8, 7); let dn = 100;
  for (let d = 0; d < weeks * 7; d++) { const dt = new Date(t0 + d * 86400000); const dow = dt.getUTCDay(); if (dow === 0 || dow === 6) continue;
    L[++dn] = { date: dt.toISOString().slice(0, 10), week: "Wk " + (1 + Math.floor(d / 7)) }; }
  return L;
}
function world(S, over) {
  const block = (x, y) => _block(S, x, y), braceSlice = n => _braceSlice(S, n);
  const subjects = { s3b: subj("Singapore 3B", 3, ["Mon", "Wed", "Fri"], 3), s4a: subj("DM 4A", 4, ["Tue"], 1), plain: subj("Plain", 3, ["Thu"], 1),
    art: subj("Art", 3, ["Mon"], 1), zoo: subj("Zoology", 3, ["Fri"], 1) };
  // end dates so the end-date view has an order of its own: Zoology ends first, then Art, then Plain
  subjects.zoo.pacing.builtThrough = "2026-12-01"; subjects.art.pacing.builtThrough = "2027-01-15"; subjects.plain.pacing.builtThrough = "2027-03-01";
  const lessons = lessonsRows(4);
  const dns = Object.keys(lessons).map(Number);
  lessons[dns[0]].s3b = "Singapore 3B L1"; lessons[dns[5]].s3b = "Singapore 3B L2";
  lessons[dns[3]].plain = "Plain L1"; lessons[dns[8]].plain = "Plain L2"; lessons[dns[13]].plain = "Plain L3";
  lessons[dns[1]].art = "Art L1"; lessons[dns[6]].art = "Art L2";
  lessons[dns[4]].zoo = "Zoology L1"; lessons[dns[9]].zoo = "Zoology L2";
  const done = { s3b: { L0001: { ts: 1, day: "2026-09-07" } } };
  const lanes = { math: { name: "Math", units: [{ sk: "s3b", rhythm: "own" }, { sk: "s4a", rhythm: "prior" }] } };
  const ctx = {
    console, Set, Map, Math, Object, Array, String, Number, JSON, parseInt, Date, RegExp, Error,
    currData: { subjects: { kid: subjects }, done: { kid: done }, lessons: { kid: lessons }, lanes: { kid: lanes }, skiplog: {} },
    scheduleOverrides: {}, checked: {}, weekData: { tasks: [] }, paceData: { subjects: {} },
    gvKid: "kid", gvShowPast: false, gvSelMode: false, gvSel: new Set(), gvSelAnchor: null, gvEdit: null, gvMenu: null, gvSelUndo: null, lmMovePick: null, lmMoveWeek: null,
    cbRulesOpen: false, cbKid: "kid", cbGate: null, KID_COLOR: { kid: "#123456" }, DAY_DT: {}, momModeActive: true, adminPinUnlocked: false,
    dbg: () => {}, cbTodayISO: () => TODAY, gwParseDate: s => { const p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); },
    cbExtendInfo: () => null, cbBlockedDates: () => [], cbDayCap: () => 0, cbOverCapDays: () => 0, cbAltGroups: () => ({}), cbGroupOf: () => null,
    smapIsKidOff: () => false, schedOvKidOff: () => false, schedOv: () => null, coopBlocksBase: () => false, coopNoMomBaseFor: () => "", coopsOnDate: () => [],
    computeFutureSlots: () => ({}), retrTracks: () => [], formatPlanDate: d => d, cap: s => s, cbRenderRules: (c, part) => "<RULES " + (part || "all") + ">", cbRenderGate: () => "",
    document: { getElementById: () => null, querySelector: () => null }, setTimeout: () => 0,
    ROSTER: ["kid"], currViewKid: "kid", gvKidCfgOpen: false, cbMsg: "", cbLastBuild: null, momVerifyKid: null, lmLastMove: null, gvScrollTop: 0, gvScrollLeft: 0, RETR_SLOT_TITLE: {},
    ceRenderSessions: () => "", lnRenderSection: () => "", ceConvUndoGet: () => null, fbRender: () => "", dmRender: () => "", gvAuditRender: () => "", alignPlanPreview: () => ({ kids: {} }),
    pacePhantomKeys: () => [], lidUnassigned: () => [], lidImportPending: () => [], lidOutOfOrderAll: () => [], skiplogLeftovers: () => [], dayTokenLeftovers: () => [],
    capLeftovers: () => ({ items: [], orphans: [], node: null }), planPending: () => [], gvNoSeqSubjects: () => [], gvMissingDays: () => [], gvSelFilledCount: () => 0, gvSelSingleSubject: () => null,
    retrDayKinds: () => [], retrSlotMinutes: () => 15, famGridHTML: () => "", FAM_ICON: "🏡", cbRebuildable: () => true,
    planPace: () => ({ behind: 0, ahead: 0 }),
    gvFilled: v => !!(v && v !== "—" && v !== "nan" && String(v).trim()),
    cbDoneCellSet: (k, sk, cells) => { const di = ctx.lidDoneIdx(k, sk); if (!di) return null; const seq = subjects[sk].lessonSeq; const out = new Set(); cells.forEach((c, i) => { const idx = seq.indexOf(c.text); if (idx >= 0 && di.has(idx)) out.add(i); }); return out; },
    _lidNorm: s => String(s == null ? "" : s).replace(/[–—−]/g, "-").replace(/\s+/g, " ").trim().toLowerCase(),
    // the writers' world: a database that logs every call, the dry-run switch, the device store
    _w: [], _dry: false, HA_LS: { _m: {}, getItem(k) { return this._m[k] == null ? null : this._m[k]; }, setItem(k, v) { this._m[k] = String(v); } },
  };
  ctx.momHere = () => !!(ctx.momModeActive || ctx.adminPinUnlocked);
  ctx.renderAll = () => { ctx._renders = (ctx._renders || 0) + 1; };
  ctx._dryRun = () => ctx._dry;
  ctx.db = { ref(p) { const r = {}; ["set", "update", "remove", "push", "transaction"].forEach(m => { r[m] = function (v) { ctx._w.push([p, m, v === undefined ? null : JSON.parse(JSON.stringify(v))]); return Promise.resolve(); }; }); r.once = () => Promise.resolve({ val: () => null }); r.on = () => {}; return r; } };
  ctx.lidsFor = (k, sk) => (subjects[sk] || {}).lessonIds || null;
  ctx.lidStamped = (k, sk) => !!(subjects[sk] && subjects[sk].doneImportedAt && subjects[sk].lessonIds);
  ctx.planBacked = (k, sk) => !!(subjects[sk] && subjects[sk].planId && ctx.lidStamped(k, sk));
  ctx.lidDoneIdx = (k, sk) => { if (!ctx.lidStamped(k, sk)) return null; const d = new Set(Object.keys(done[sk] || {})); const out = new Set(); (subjects[sk].lessonIds || []).forEach((id, i) => { if (d.has(id)) out.add(i); }); return out; };
  ctx.cbRemainingContent = (k, sk) => { const di = ctx.lidDoneIdx(k, sk) || new Set(); return (subjects[sk].lessonSeq || []).filter((_, i) => !di.has(i)); };
  ctx.cbFutureRows = (kid, sk) => Object.keys(lessons).map(Number).sort((a, b) => a - b).filter(dn => lessons[dn].date > TODAY).map(dn => ({ dayNum: dn, date: lessons[dn].date, week: lessons[dn].week, dow: DOW[new Date(lessons[dn].date + "T12:00:00").getDay()], off: false, usedMin: 0, hadMine: ctx.gvFilled(lessons[dn][sk]) }));
  Object.assign(ctx, over || {});
  const CODE = [
    braceSlice("esc"), braceSlice("_cbSpread"), braceSlice("_cbParseDate"), braceSlice("_cbISO"), braceSlice("_cbMonday"), braceSlice("cbDefaultForm"), braceSlice("planIdFor"),
    braceSlice("gvSubjectCols"), braceSlice("cbHasGridCells"), braceSlice("cbCardOnlySubjects"), braceSlice("cbOtherSubjects"), braceSlice("ceConvUndoBanner"),
    block("// PROJ_START", "// PROJ_END"), block("// PLANDROP_START", "// PLANDROP_END"),
    block("function planMaterialize", "// Owed only (for chips)"), block("function planOwed", "// PLANMAT_END"),
    block("// LANE_START", "// LANE_END"), block("// GRIDEND_START", "// GRIDEND_END"), _optBlock(S, "// COLORDER_START", "// COLORDER_END"),
    block("// GVDER_START", "// GVDER_END"), block("// KIDYEAR_START", "// KIDYEAR_END"),
    braceSlice("renderCurrGrid"),
  ].join("\n");
  vm.createContext(ctx);
  new vm.Script(_optBlock(S, "// CURRWORDS_START", "// CURRWORDS_END") + "\n" + _optBlock(S, "// CURRTOOLS_START", "// CURRTOOLS_END") + "\n" + CODE).runInContext(ctx);
  ctx.run = e => vm.runInContext(e, ctx);
  ctx.grid = pre => { if (pre) ctx.run(pre); const el = { innerHTML: "" }; ctx.renderCurrGrid(el); return el.innerHTML; };
  ctx.panel = () => { ctx.run('kyTab="all"'); return ctx.run('kyPanelHTML("kid","#123456")'); };
  return ctx;
}
// the grid's column header row: each <th> after Day and Min, in order
function headCells(h) {
  const i = h.indexOf('<tr class="gv-subrow">'); const j = h.indexOf("</tr>", i); const row = h.slice(i, j);
  const out = []; const re = /<th\b[\s\S]*?<\/th>/g; let m; while ((m = re.exec(row))) out.push(m[0]);
  return out.slice(2);
}
const NAMES = { "Art": "art", "Plain": "plain", "Zoology": "zoo" };
function headOrder(h) {
  return headCells(h).map(c => { if (/🛤|Singapore|DM 4A/.test(c)) return "lane:math"; for (const n in NAMES) if (c.indexOf(">" + n) >= 0 || c.indexOf("'" + NAMES[n] + "'") >= 0) return NAMES[n]; return "?"; });
}
const listOf = h => { const i = h.indexOf('<div class="co-order"'); if (i < 0) return ""; let d = 0; const re = /<div\b|<\/div>/g; re.lastIndex = i; let m;
  while ((m = re.exec(h))) { d += m[0] === "</div>" ? -1 : 1; if (d === 0) return h.slice(i, m.index + 6); } return ""; };
const AZ = ["art", "lane:math", "plain", "zoo"];

// ── 1 · the pure function ───────────────────────────────────────────────────────────────
console.log("── 1 · gvColOrder, pure ──");
{
  const c = { currData: {}, console, Object, Array, String, JSON };
  vm.createContext(c); vm.runInContext(BLOCK, c);
  const L = { a: "Art", b: "Bible", "lane:m": "Math", p: "Plain", z: "Zoology", n: "Nature", aa: "Aardvarks" };
  const lab = k => L[k] || k;
  const cols = ["a", "b", "lane:m", "p", "z"];
  for (const s of [null, undefined, [], {}, "x", 7]) ok("no saved order (" + JSON.stringify(s) + ") → the very same array, A–Z untouched", c.gvColOrder(cols, s, lab) === cols);
  ok("a saved order: those keys first, in that order, the rest after A–Z", JSON.stringify(c.gvColOrder(cols, ["z", "b"], lab)) === JSON.stringify(["z", "b", "a", "lane:m", "p"]));
  ok("a full saved order is followed exactly", JSON.stringify(c.gvColOrder(cols, ["p", "z", "lane:m", "b", "a"], lab)) === JSON.stringify(["p", "z", "lane:m", "b", "a"]));
  ok("a subject added later joins at the end, A–Z among the added", JSON.stringify(c.gvColOrder(["a", "aa", "b", "lane:m", "n", "p", "z"], ["z", "p", "lane:m", "b", "a"], lab)) === JSON.stringify(["z", "p", "lane:m", "b", "a", "aa", "n"]));
  ok("the added ones are put A–Z by their label even if handed in another order", JSON.stringify(c.gvColOrder(["n", "a", "aa"], ["a"], lab)) === JSON.stringify(["a", "aa", "n"]));
  ok("a saved key that no longer exists is ignored (deleted subject dropped)", JSON.stringify(c.gvColOrder(cols, ["gone", "p", "lane:old", "a"], lab)) === JSON.stringify(["p", "a", "b", "lane:m", "z"]));
  ok("only stale keys → A–Z", JSON.stringify(c.gvColOrder(cols, ["gone"], lab)) === JSON.stringify(cols));
  ok("a lane key moves as one column", JSON.stringify(c.gvColOrder(cols, ["lane:m"], lab)) === JSON.stringify(["lane:m", "a", "b", "p", "z"]));
  ok("the database's {0:…,1:…} shape reads as the list", JSON.stringify(c.gvColOrder(cols, { 1: "a", 0: "z" }, lab)) === JSON.stringify(["z", "a", "b", "lane:m", "p"]));
  ok("a key saved twice counts once; blanks and non-strings are skipped", JSON.stringify(c.gvColOrder(cols, ["p", "", null, 3, "p", "a"], lab)) === JSON.stringify(["p", "a", "b", "lane:m", "z"]));
  ok("clearing (saved gone) restores A–Z exactly", c.gvColOrder(cols, null, lab) === cols && JSON.stringify(cols) === JSON.stringify(["a", "b", "lane:m", "p", "z"]));
  ok("no labelOf: the rest keep A–Z by key", JSON.stringify(c.gvColOrder(["c", "a", "b"], ["b"])) === JSON.stringify(["b", "a", "c"]));
  ok("the input array is never changed", JSON.stringify(cols) === JSON.stringify(["a", "b", "lane:m", "p", "z"]));
}

// ── 2 · the grid ────────────────────────────────────────────────────────────────────────
console.log("── 2 · the grid ──");
{
  const cases = [["Mom, A–Z", ""], ["Mom, end-date view on", "gvEndSort=true;"], ["not Mom", "momModeActive=false;"], ["not Mom, end-date flag on", "momModeActive=false;gvEndSort=true;"], ["⋯ More open", "ctMoreOpen=true;"], ["⋯ More open, end date on", "ctMoreOpen=true;gvEndSort=true;"]];
  cases.forEach(([nm, pre]) => {
    const a = world(src).grid(pre), b = world(STRIP).grid(pre);
    ok("no saved order — " + nm + ": the grid is byte-identical to this tree minus the block (" + a.length + " bytes)", a === b && a.length > 3000, { a: a.length, b: b.length });
  });
  const W = world(src);
  ok("A–Z by default: Art · 🛤 Math · Plain · Zoology", JSON.stringify(headOrder(W.grid())) === JSON.stringify(AZ), headOrder(W.grid()));
  ok("the end-date view (no custom order): Zoology · Art · Plain · then Math (no end date)", JSON.stringify(headOrder(world(src).grid("gvEndSort=true;"))) === JSON.stringify(["zoo", "art", "plain", "lane:math"]));
  const SET = 'currData.colOrder={kid:["plain","lane:math","zoo","art"]};';
  const g1 = world(src).grid(SET);
  ok("an order set: the headers follow it", JSON.stringify(headOrder(g1)) === JSON.stringify(["plain", "lane:math", "zoo", "art"]), headOrder(g1));
  const az = world(src).grid();
  ok("…and they are the same header cells as A–Z, only reordered", JSON.stringify(headCells(g1).slice().sort()) === JSON.stringify(headCells(az).slice().sort()) && headCells(g1).length === 4);
  ok("…the lane band row follows the same order", (() => { const i = g1.indexOf("gv-lnband"); const band = g1.slice(g1.lastIndexOf("<tr", i), g1.indexOf("</tr>", i)); const ths = band.match(/<th\b[\s\S]*?<\/th>/g) || []; return ths.length >= 4 && /🛤 Math/.test(ths[ths.length - 3]); })());
  ok("…every row has the same cells as A–Z, only reordered (no cell gained or lost)", g1.length === az.length && g1.split("<td").length === az.split("<td").length);
  const g2 = world(src).grid(SET + "gvEndSort=true;");
  ok("the custom order wins over the end-date view", JSON.stringify(headOrder(g2)) === JSON.stringify(["plain", "lane:math", "zoo", "art"]));
  ok("a subject not in the saved order (added later) comes last", JSON.stringify(headOrder(world(src).grid('currData.colOrder={kid:["zoo","plain"]};'))) === JSON.stringify(["zoo", "plain", "art", "lane:math"]));
  ok("another kid's saved order does not touch this kid's grid", world(src).grid('currData.colOrder={other:["zoo","plain"]};') === world(STRIP).grid());
  ok("a paused subject stays off the grid with an order set", (() => { const w = world(src); w.currData.subjects.kid.zoo.paused = true; return JSON.stringify(headOrder(w.grid(SET))) === JSON.stringify(["plain", "lane:math", "art"]); })());
  // the ⋯ More end-date item
  const more = world(src).grid(SET + "ctMoreOpen=true;gvEndSort=true;");
  ok("⋯ More, order set: the end-date item reads the plan's words", more.indexOf("Order by end date · off while a custom order is set — Back to A–Z first") >= 0 && more.indexOf("✓ Order columns by end date") < 0);
  ok("…same handler (it still only flips the per-device view)", /onclick="ctMoreOpen=false;gvEndSortToggle\(\)"[^>]*>Order by end date · off while/.test(more));
  ok("…and is not drawn as on", !/background:var\(--bg\)[^>]*>Order by end date · off/.test(more));
  ok("⋯ More, no order: the item is the same as before", world(src).grid("ctMoreOpen=true;gvEndSort=true;").indexOf("✓ Order columns by end date") >= 0);
}

// ── 3 · 📅 Kid's year ▸ All subjects ─────────────────────────────────────────────────────
console.log("── 3 · the Column order list ──");
{
  const W = world(src), P = W.panel(), L = listOf(P), PS = world(STRIP).panel();
  ok("the list sits right above the All subjects table", L.length > 200 && P.indexOf(L + "<RULES table>") >= 0);
  ok("the panel minus the list is byte-identical to this tree minus the block", P.replace(L, "") === PS && PS.indexOf("<RULES table>") >= 0, { p: P.length, ps: PS.length });
  ok("other tabs: byte-identical", ["hours", "terms", "lanes"].every(t => { const a = world(src); a.run('kyTab="' + t + '"'); const b = world(STRIP); b.run('kyTab="' + t + '"'); return a.run('kyPanelHTML("kid","#123456")') === b.run('kyPanelHTML("kid","#123456")'); }));
  const rows = L.split('border-top:1px solid var(--border)">').slice(1).map(r => r.replace(/<[^>]+>/g, "|").split("|").filter(Boolean)[0]);
  ok("the list = the grid's columns in the grid's order; the lane is ONE entry, 🛤 Math", JSON.stringify(rows) === JSON.stringify(["Art", "🛤 Math", "Plain", "Zoology"]), rows);
  ok("no lane member is listed on its own", L.indexOf("Singapore") < 0 && L.indexOf("DM 4A") < 0);
  ok("▲ ▼ per entry, with the entry's index", ["gvColMove('kid',0,-1)", "gvColMove('kid',0,1)", "gvColMove('kid',3,-1)", "gvColMove('kid',3,1)"].every(f => L.indexOf('onclick="' + f + '"') >= 0) && (L.match(/onclick="gvColMove/g) || []).length === 8);
  ok("▲ on the first and ▼ on the last are disabled", /gvColMove\('kid',0,-1\)" disabled/.test(L) && /gvColMove\('kid',3,1\)" disabled/.test(L) && (L.match(/" disabled/g) || []).length === 2);
  ok("finger-sized arrows (44 × 40)", (L.match(/min-width:44px;min-height:40px/g) || []).length === 8);
  ok("no order yet: no Back to A–Z, and the line says A–Z", L.indexOf("gvColOrderReset") < 0 && L.indexOf("A–Z. Tap ▲ or ▼ to set your own order.") >= 0);
  ok("the line says it changes only how the grid looks", L.indexOf("nothing moves on anyone’s week") >= 0);
  const W2 = world(src); W2.run('currData.colOrder={kid:["zoo","lane:math"]};'); const L2 = listOf(W2.panel());
  const rows2 = L2.split('border-top:1px solid var(--border)">').slice(1).map(r => r.replace(/<[^>]+>/g, "|").split("|").filter(Boolean)[0]);
  ok("an order set: the list shows it", JSON.stringify(rows2) === JSON.stringify(["Zoology", "🛤 Math", "Art", "Plain"]), rows2);
  ok("…with one Back to A–Z for this kid", (L2.match(/onclick="gvColOrderReset\('kid'\)"/g) || []).length === 1 && L2.indexOf(">Back to A–Z<") >= 0);
  const W3 = world(src); W3.run("gvEndSort=true;"); const L3 = listOf(W3.panel());
  ok("end-date view on, no order: the list shows the order the grid shows, and says so", L3.indexOf("By end date right now") >= 0 && L3.indexOf(">Zoology<") < L3.indexOf(">Art<") && L3.indexOf(">Plain<") < L3.indexOf("🛤 Math"));
  const W4 = world(src); W4.momModeActive = false; ok("not Mom: no list", listOf(W4.panel()) === "" && W4.panel() === (() => { const s = world(STRIP); s.momModeActive = false; return s.panel(); })());
  ok("a kid with no grid columns: no list", (() => { const w = world(src); w.currData.lessons.kid = {}; w.currData.lanes = {}; return listOf(w.panel()) === ""; })());
  ok("no new element ids (Node stubs would hide a duplicate)", !/\bid=/.test(L2) && !/\bid=/.test(BLOCK.replace(/\bkid\b/g, "")));
}

// ── 4 · the writes ──────────────────────────────────────────────────────────────────────
console.log("── 4 · the writes ──");
{
  let W = world(src);
  W.gvColMove("kid", 1, -1);
  ok("▲ on entry 2 (🛤 Math): exactly one write — set curriculum/colOrder/kid", W._w.length === 1 && W._w[0][0] === "curriculum/colOrder/kid" && W._w[0][1] === "set", W._w);
  ok("…the whole small array, the lane as one key", JSON.stringify(W._w[0][2]) === JSON.stringify(["lane:math", "art", "plain", "zoo"]));
  ok("…memory matches, and the grid follows", JSON.stringify(W.currData.colOrder.kid) === JSON.stringify(["lane:math", "art", "plain", "zoo"]) && JSON.stringify(headOrder(W.grid())) === JSON.stringify(["lane:math", "art", "plain", "zoo"]));
  ok("…one re-draw", W._renders === 1, W._renders);
  W._w.length = 0; W.gvColMove("kid", 2, 1);
  ok("▼ on entry 3 next: set again with Plain and Zoology swapped", W._w.length === 1 && JSON.stringify(W._w[0][2]) === JSON.stringify(["lane:math", "art", "zoo", "plain"]));
  W._w.length = 0; W.gvColMove("kid", 0, -1); W.gvColMove("kid", 3, 1); W.gvColMove("kid", 9, -1); W.gvColMove("kid", -1, 1);
  ok("▲ on the first, ▼ on the last, an index off the list: nothing written, order unchanged", W._w.length === 0 && JSON.stringify(W.currData.colOrder.kid) === JSON.stringify(["lane:math", "art", "zoo", "plain"]));
  W.gvColOrderReset("kid");
  ok("Back to A–Z: exactly one remove of curriculum/colOrder/kid", W._w.length === 1 && W._w[0][0] === "curriculum/colOrder/kid" && W._w[0][1] === "remove");
  ok("…and the grid is A–Z again, byte-identical to this tree minus the block", JSON.stringify(headOrder(W.grid())) === JSON.stringify(AZ) && W.grid() === world(STRIP).grid());
  // another kid's order
  W = world(src); W.currData.colOrder = { other: ["x", "y"] }; W.gvColMove("kid", 0, 1);
  ok("another kid's saved order is untouched (memory) and never written", JSON.stringify(W.currData.colOrder.other) === JSON.stringify(["x", "y"]) && W._w.every(x => x[0] === "curriculum/colOrder/kid"));
  W._w.length = 0; W.gvColOrderReset("kid");
  ok("Back to A–Z for one kid leaves the other kid's order", JSON.stringify(W.currData.colOrder.other) === JSON.stringify(["x", "y"]) && W._w.length === 1 && W._w[0][0] === "curriculum/colOrder/kid");
  // not Mom
  W = world(src); W.momModeActive = false; W.gvColMove("kid", 1, -1); W.gvColOrderReset("kid");
  ok("not Mom: ▲ ▼ and Back to A–Z write nothing and change nothing", W._w.length === 0 && !W.currData.colOrder && !W._renders);
  // dry run
  W = world(src); W._dry = true; W.gvColMove("kid", 1, -1); W.gvColOrderReset("kid");
  ok("dry run: nothing reaches the database", W._w.length === 0);
  // no database at all
  W = world(src); W.db = null; let threw = false; try { W.gvColMove("kid", 1, -1); W.gvColOrderReset("kid"); } catch (e) { threw = true; }
  ok("no database: no throw", !threw);
  // the end-date toggle
  W = world(src); W.gvEndSortToggle(); W.gvEndSortToggle(); W.run('currData.colOrder={kid:["zoo"]};'); W.gvEndSortToggle();
  ok("the end-date toggle still writes nothing to the database (with or without a custom order)", W._w.length === 0 && W.HA_LS._m.ha_gv_endsort === "1");
}

// ── 5 · the source ──────────────────────────────────────────────────────────────────────
console.log("── 5 · the source ──");
{
  ok("one COLORDER block, with its markers", (src.match(/\/\/ COLORDER_START/g) || []).length === 1 && (src.match(/\/\/ COLORDER_END/g) || []).length === 1);
  ok("it cites her words and the plan", BLOCK.indexOf("i think alphabetical") >= 0 && BLOCK.indexOf("or arrows to change if that's better") >= 0 && BLOCK.indexOf("PLAN_curriculum_streamline_2026-11-10.md") >= 0);
  const refs = BLOCK.match(/\bref\([^)]*\)/g) || [];
  ok("the only ref() in the block is curriculum/colOrder/<kid>", refs.length === 2 && refs.every(r => r === 'ref("curriculum/colOrder/"+kid)'), refs);
  ok("one set and one remove, each behind db && !_dryRun() and momHere()", /if\(db&&!_dryRun\(\)\) db\.ref\("curriculum\/colOrder\/"\+kid\)\.set\(arr\);/.test(BLOCK) && /if\(db&&!_dryRun\(\)\) db\.ref\("curriculum\/colOrder\/"\+kid\)\.remove\(\);/.test(BLOCK)
    && /function gvColMove\(kid,i,d\)\{\n  if\(!momHere\(\)\) return;/.test(BLOCK) && /function gvColOrderReset\(kid\)\{\n  if\(!momHere\(\)\) return;/.test(BLOCK));
  ok("no update / push / transaction, no subjects or lessons path", !/ref\([^)]*\)\.(update|push|transaction)\(/.test(BLOCK) && !/curriculum\/(subjects|lessons)/.test(BLOCK.replace(/^\/\/.*$/gm, "")));
  ok("display only: no re-lay, no week, no scheduler call", !/_rlw|_gvRelay|relayWeek|generate|cbApply|cbBuild|weekData|checked\[|schedCascade|runDisplacement/.test(BLOCK.replace(/^\/\/.*$/gm, "")));
  const outside = STRIP;
  ok("nothing outside the block reads currData.colOrder (the scheduler never sees it)", outside.indexOf("colOrder") < 0, (outside.match(/.{60}colOrder.{40}/g) || []).slice(0, 3));
  ok("no 🔀 anywhere", src.indexOf("🔀") < 0);
  const grid = _braceSlice(src, "renderCurrGrid");
  ok("call site 1 — the grid: gvColPick, with the old end-date expression as the fallback", grid.indexOf('const cols=(typeof gvColPick==="function")?gvColPick(gvKid,_lnFold.cols,_lnCols):((typeof gvEndSortOn==="function"&&gvEndSortOn())?gvEndSortCols(gvKid,_lnFold.cols,_lnCols):_lnFold.cols);   // COLORDER') >= 0);
  ok("call site 2 — 📅 All subjects: the list above the Rules table", _block(src, "// KIDYEAR_START", "// KIDYEAR_END").indexOf('else h+=((typeof gvColOrderHTML==="function")?gvColOrderHTML(kid,col):"")+cbRenderRules(col,"table");') >= 0);
  ok("call site 3 — ⋯ More: the end-date label only (same handler, same Mom gate)", /_ctItems\.push\(\{fn:"gvEndSortToggle\(\)",title:"[^"]*",label:\(\(typeof gvColOrderSet==="function"&&gvColOrderSet\(gvKid\)\)\?'Order by end date · off while a custom order is set — Back to A–Z first':/.test(grid));
  ok("the grid's columns are read once (every display loop walks `cols`)", (grid.match(/lnFoldColumns\(/g) || []).length === 1 && (grid.match(/const cols=/g) || []).length === 1);
  ok("left alone on purpose: gvPurgeOrphans (a tidy-up list, not the grid) and the 🏡 Family grid", _braceSlice(src, "gvPurgeOrphans").indexOf("gvCol") < 0 && _braceSlice(src, "gvSubjectCols").indexOf("gvCol") < 0 && _braceSlice(src, "lnFoldColumns").indexOf("gvCol") < 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
