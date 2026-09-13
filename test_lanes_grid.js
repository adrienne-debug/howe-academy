/*
 * Node tests for 🛤 LANES, Stage 3 — the Grid column.
 *
 * One column per lane, members folded in; a successor with no cells gets a column on day
 * one; each row resolves to the member it belongs to, so every existing gesture keeps its
 * (kid, dayNum, memberKey) contract. Runs the helpers (LANE + LANE_GRID blocks) and a SMOKE
 * RENDER of the real renderCurrGrid over a synthetic curriculum with the rest of the app
 * stubbed, then checks the HTML.
 *
 *   run:  node test_lanes_grid.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

function block(a, b) { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); }
function braceSlice(name) {
  const sig = "function " + name + "("; const i = src.indexOf(sig); if (i < 0) throw new Error("fn " + name);
  let d = 0, j = src.indexOf("{", i);
  for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); } }
  throw new Error("unbalanced " + name);
}
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); } }
const eq = (x, y) => JSON.stringify(x) === JSON.stringify(y);

// ── synthetic curriculum: 3B (2 cells, 1 left) → 4A (NO cells) ; Geo+Sci multiple card ──
const TODAY = "2026-09-13";     // Sunday; rows Mon 9/14 …
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function subj(display, n, days, tpw, extra) {
  const seq = Array.from({ length: n }, (_, i) => display + " L" + (i + 1));
  return Object.assign({ display, lessonSeq: seq, lessonIds: seq.map((_, i) => "L" + String(i + 1).padStart(4, "0")), doneImportedAt: 1, planId: "kid__" + display,
    allowedDays: days, timesPerWeek: tpw, pacing: { mode: "timesPerWeek", tpw }, minutes: 15, mom: "none", device: "paper", rules: "" }, extra || {});
}
function lessonsRows(weeks) {
  const L = {}; const t0 = Date.UTC(2026, 8, 7); let dn = 100;   // start a week BEFORE today so there are past rows
  for (let d = 0; d < weeks * 7; d++) { const dt = new Date(t0 + d * 86400000); const dow = dt.getUTCDay(); if (dow === 0 || dow === 6) continue;
    L[++dn] = { date: dt.toISOString().slice(0, 10), week: "Wk " + (1 + Math.floor(d / 7)) }; }
  return L;
}
function world(o) {
  o = o || {};
  const subjects = { s3b: subj("Singapore 3B", 3, ["Mon", "Wed", "Fri"], 3), s4a: subj("DM 4A", 4, ["Tue"], 1), geo: subj("Daily Geo", 6, ["Mon"], 1), sci: subj("Daily Sci", 6, ["Mon"], 1), plain: subj("Plain", 3, ["Thu"], 1) };
  const lessons = lessonsRows(4);
  // stored cells: 3B has a PAST cell (done) and a future cell; plain has one; 4A has NONE
  const dns = Object.keys(lessons).map(Number);
  lessons[dns[0]].s3b = "Singapore 3B L1";          // Mon 9/7 — past, done
  lessons[dns[5]].s3b = "Singapore 3B L2";          // Mon 9/14 — future (stale text; derived will decide)
  lessons[dns[3]].plain = "Plain L1"; lessons[dns[8]].plain = "Plain L2"; lessons[dns[13]].plain = "Plain L3";   // keeps the grid drawn through week 3
  lessons[dns[1]].geo = "Daily Geo L1"; lessons[dns[1]].sci = "Daily Sci L1";   // Tue 9/8 — both ran, before the lane existed
  const done = { s3b: { L0001: { ts: 1, day: "2026-09-07" } }, geo: { L0001: { ts: 1, day: "2026-09-08" } }, sci: { L0001: { ts: 1, day: "2026-09-08" } } };
  if (o.finish3b) { done.s3b.L0002 = { ts: 1, day: "2026-09-09" }; done.s3b.L0003 = { ts: 1, day: "2026-09-10" }; }
  const lanes = o.lanes === undefined ? { math: { name: "Math", units: [{ sk: "s3b", rhythm: "own" }, { sk: "s4a", rhythm: "prior" }] },
    gs: { name: "Geo/Sci", units: [{ subs: ["geo", "sci"], pattern: "AB", rhythm: "own", allowedDays: ["Mon", "Wed", "Fri"], timesPerWeek: 3, cap: 1 }] } } : o.lanes;
  const ctx = {
    console, Set, Map, Math, Object, Array, String, Number, JSON, parseInt, Date, RegExp, Error,
    currData: { subjects: { kid: subjects }, done: { kid: done }, lessons: { kid: lessons }, lanes: lanes ? { kid: lanes } : undefined, skiplog: {} },
    scheduleOverrides: {}, checked: {}, weekData: { tasks: [] }, paceData: { subjects: {} },
    gvKid: "kid", gvShowPast: true, gvSelMode: false, gvSel: new Set(), gvSelAnchor: null, gvEdit: null, gvMenu: null, gvSelUndo: null, lmMovePick: null, lmMoveWeek: null,
    cbRulesOpen: false, cbKid: "kid", cbGate: null, KID_COLOR: { kid: "#123456" }, DAY_DT: {}, momModeActive: true, adminPinUnlocked: false,
    dbg: () => {}, cbTodayISO: () => TODAY, gwParseDate: s => { const p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); },
    cbExtendInfo: () => null, cbBlockedDates: () => [], cbDayCap: () => 0, cbOverCapDays: () => 0, cbAltGroups: () => ({}), cbGroupOf: () => null,
    smapIsKidOff: () => false, schedOvKidOff: () => false, schedOv: () => null, coopBlocksBase: () => false, coopNoMomBaseFor: () => "", coopsOnDate: () => [],
    computeFutureSlots: () => ({}), retrTracks: () => [], formatPlanDate: d => d, cap: s => s, cbRenderRules: () => "", cbRenderGate: () => "",
    document: { getElementById: () => null, querySelector: () => null }, setTimeout: () => 0,
    ROSTER: ["kid"], currViewKid: "kid", gvKidCfgOpen: false, cbMsg: "", cbLastBuild: null, momVerifyKid: null, lmLastMove: null, gvScrollTop: 0, gvScrollLeft: 0, RETR_SLOT_TITLE: {},
    ceRenderSessions: () => "", ceConvUndoBanner: () => "", fbRender: () => "", gvAuditRender: () => "", alignPlanPreview: () => null,
    pacePhantomKeys: () => [], lidUnassigned: () => [], lidImportPending: () => [], lidOutOfOrderAll: () => [], skiplogLeftovers: () => [], dayTokenLeftovers: () => [],
    capLeftovers: () => ({ items: [], orphans: [], node: null }), planPending: () => [], gvNoSeqSubjects: () => [], gvMissingDays: () => [], gvSelFilledCount: () => 0, gvSelSingleSubject: () => null,
    retrDayKinds: () => [], retrSlotMinutes: () => 15,
    gvFilled: v => !!(v && v !== "—" && v !== "nan" && String(v).trim()),
    cbDoneCellSet: (k, sk, cells) => { const di = ctx.lidDoneIdx(k, sk); if (!di) return null; const seq = subjects[sk].lessonSeq; const out = new Set(); cells.forEach((c, i) => { const idx = seq.indexOf(c.text); if (idx >= 0 && di.has(idx)) out.add(i); }); return out; },
    _lidNorm: s => String(s == null ? "" : s).replace(/[–—−]/g, "-").replace(/\s+/g, " ").trim().toLowerCase(),
  };
  ctx.lidsFor = (k, sk) => (subjects[sk] || {}).lessonIds || null;
  ctx.lidStamped = (k, sk) => !!(subjects[sk] && subjects[sk].doneImportedAt && subjects[sk].lessonIds);
  ctx.planBacked = (k, sk) => !!(subjects[sk] && subjects[sk].planId && ctx.lidStamped(k, sk));
  ctx.lidDoneIdx = (k, sk) => { if (!ctx.lidStamped(k, sk)) return null; const d = new Set(Object.keys(done[sk] || {})); const out = new Set(); (subjects[sk].lessonIds || []).forEach((id, i) => { if (d.has(id)) out.add(i); }); return out; };
  ctx.cbRemainingContent = (k, sk) => { const di = ctx.lidDoneIdx(k, sk) || new Set(); return (subjects[sk].lessonSeq || []).filter((_, i) => !di.has(i)); };
  // real cbFutureRows needs a few more readers; a faithful stub over the same lessons object
  ctx.cbFutureRows = (kid, sk) => Object.keys(lessons).map(Number).sort((a, b) => a - b).filter(dn => lessons[dn].date > TODAY).map(dn => ({ dayNum: dn, date: lessons[dn].date, week: lessons[dn].week, dow: DOW[new Date(lessons[dn].date + "T12:00:00").getDay()], off: false, usedMin: 0, hadMine: ctx.gvFilled(lessons[dn][sk]) }));
  const CODE = [
    braceSlice("esc"), braceSlice("_cbSpread"), braceSlice("_cbParseDate"), braceSlice("_cbISO"), braceSlice("_cbMonday"), braceSlice("cbDefaultForm"), braceSlice("planIdFor"),
    braceSlice("gvSubjectCols"), braceSlice("cbHasGridCells"), braceSlice("cbCardOnlySubjects"), braceSlice("cbOtherSubjects"),
    block("// PROJ_START", "// PROJ_END"), block("// PLANDROP_START", "// PLANDROP_END"),
    block("function planMaterialize", "// Owed only (for chips)"), block("function planOwed", "// PLANMAT_END"),
    block("// LANE_START", "// LANE_END"), block("// GVDER_START", "// GVDER_END"),
    braceSlice("renderCurrGrid"),
  ].join("\n");
  vm.createContext(ctx);
  new vm.Script(CODE).runInContext(ctx);
  ctx._lessons = lessons; ctx._dns = dns;
  return ctx;
}
function render(c) { const el = { innerHTML: "" }; c.renderCurrGrid(el); return el.innerHTML; }
const cellRe = (dn, sk) => new RegExp('id="gv-c-' + dn + '-' + sk + '"[^>]*>([\\s\\S]*?)</td>');
const cell = (h, dn, sk) => { const m = cellRe(dn, sk).exec(h); return m ? m[1] : null; };

// ── 1. helpers ───────────────────────────────────────────────────────────────
console.log("── helpers ──");
{
  const c = world();
  const f = c.lnFoldColumns("kid", c.gvSubjectCols("kid"));
  ok("cell-driven columns fold: members out, one lane column each, sorted by label", eq(f.cols, ["lane:gs", "lane:math", "plain"]), f.cols);
  ok("a successor with NO cells is in its lane's member list", eq(f.lanes["lane:math"].members, ["s3b", "s4a"]));
  ok("lane meta carries the name", f.lanes["lane:gs"].name === "Geo/Sci");
  const st = c.lnColumnStatus("kid", "math");
  ok("status: 3B up, 4A next, 4A queued", eq(st, { up: ["s3b"], next: ["s4a"], queued: ["s4a"], upIdx: 0 }), st);
  ok("multiple card: both up, nothing queued", eq(c.lnColumnStatus("kid", "gs"), { up: ["geo", "sci"], next: [], queued: [], upIdx: 0 }));
  ok("lnShort trims a long name", c.lnShort("Singapore Math 3B Workbook") === "Singapore Mat…" && c.lnShort("DM 4A") === "DM 4A" && c.lnShort("HWT (Printing)") === "HWT");
  const c2 = world({ finish3b: true });
  ok("3B finished → 4A up, nothing queued (3B is simply gone from the status)", eq(c2.lnColumnStatus("kid", "math"), { up: ["s4a"], next: [], queued: [], upIdx: 1 }));
  const c3 = world({ lanes: null });
  const f3 = c3.lnFoldColumns("kid", c3.gvSubjectCols("kid"));
  ok("no lanes → columns unchanged, no lane entries", eq(f3.cols, c3.gvSubjectCols("kid")) && eq(f3.lanes, {}));
}
{
  // lnPickMember — pure over the maps the render builds
  const c = world();
  const lc = { id: "math", name: "Math", members: ["s3b", "s4a"] };
  const der = { s3b: { byDate: { "2026-09-16": { text: "Singapore 3B L2" } } }, s4a: { byDate: { "2026-09-18": { text: "DM 4A L1" } } } };
  ok("future row → the member the projection laid there", c.lnPickMember("kid", lc, 1, { date: "2026-09-18" }, false, der, {}) === "s4a" && c.lnPickMember("kid", lc, 1, { date: "2026-09-16" }, false, der, {}) === "s3b");
  ok("past row → the member holding the stored cell", c.lnPickMember("kid", lc, 1, { date: "2026-09-07", s4a: "x" }, true, der, {}) === "s4a");
  ok("a projected lesson wins the row over another member's done cell (never hide a lesson; the done cell is drawn under it)", c.lnPickMember("kid", lc, 7, { date: "2026-09-18", s3b: "Singapore 3B L1" }, false, der, { "7|s3b": 1 }) === "s4a");
  ok("with nothing projected, a done cell's member keeps the row", c.lnPickMember("kid", lc, 7, { date: "2026-09-22", s3b: "Singapore 3B L1" }, false, der, { "7|s3b": 1 }) === "s3b");
  ok("empty row → the member that is up (so typing lands on the running subject)", c.lnPickMember("kid", lc, 1, { date: "2026-09-22" }, false, der, {}) === "s3b");
  const c2 = world({ finish3b: true });
  ok("— and after 3B finishes, the empty row belongs to 4A", c2.lnPickMember("kid", lc, 1, { date: "2026-09-22" }, false, {}, {}) === "s4a");
}

// ── 2. smoke render ──────────────────────────────────────────────────────────
console.log("\n── render ──");
{
  const c = world(); let h = "";
  try { h = render(c); } catch (e) { ok("renderCurrGrid renders with lanes", false, String(e && e.stack).slice(0, 400)); }
  if (h) {
    ok("renders", h.length > 2000);
    ok("ONE header for the Math lane, none for 3B or 4A on their own", (h.match(/🛤 Math/g) || []).length === 1 && !/<th[^>]*>Singapore 3B</.test(h) && !/<th[^>]*>DM 4A</.test(h));
    // her design 2026-09-12: lane name in a BAND above; active subject in the header; queued
    // book underneath and TAPPABLE (the only route to a waiting book's card); costs no day row.
    ok("a band row carries the lane name above the columns", /<tr class="gv-bandrow">[\s\S]*?🛤 Math[\s\S]*?<\/tr>/.test(h));
    ok("the lane name is NOT in the subject header any more", !/<th[^>]*>🛤 Math/.test(h));
    ok("the ACTIVE subject is its own tap target", /onclick="ceOpenEdit\('kid','s3b'\)"[^>]*>Singapore 3B</.test(h));
    ok("THE FIX: the QUEUED book is tappable too — a waiting book is reachable", /class="gv-lnq" onclick="ceOpenEdit\('kid','s4a'\)"[^>]*>▸ DM 4A</.test(h), "a waiting book would have no route to its card");
    ok("two active subjects each get their own tap target", /ceOpenEdit\('kid','geo'\)/.test(h) && /ceOpenEdit\('kid','sci'\)/.test(h));
    // Her rule CHANGED 2026-09-12 ("put the next book in the grid after, according to its rules"):
    // a queued book now SHOWS on the days it will land once the book ahead runs out — faded,
    // display-only — and still never shares a day with, or lands before, the book that is up.
    ok("a queued book is previewed in day rows, faded (gv-queued)", /id="gv-c-\d+-s4a"[^>]*>[\s\S]{0,160}class="gv-queued"/.test(h));
    ok("4A is NOT in the 'on their cards, not in the grid yet' strip", !/not in the grid yet[\s\S]{0,400}DM 4A/.test(h));
    ok("the plain subject still has its own header", /<th[^>]*>Plain</.test(h));
    ok("column count = lanes + plain (3)", /× 3 subjects/.test(h));
    // rows: the lane column's future cells are 3B's projected lessons, keyed to s3b
    const dns = c._dns; const L = c._lessons;
    const mon = dns.find(dn => L[dn].date === "2026-09-14"), wed = dns.find(dn => L[dn].date === "2026-09-16"), fri = dns.find(dn => L[dn].date === "2026-09-18");
    ok("Mon 9/14 cell is 3B's L2, keyed to s3b", /Singapore 3B L2/.test(cell(h, mon, "s3b") || ""), cell(h, mon, "s3b"));
    ok("Wed 9/16 cell is 3B's L3 (its last), keyed to s3b", /Singapore 3B L3/.test(cell(h, wed, "s3b") || ""));
    ok("Fri 9/18 (3B has run out): 4A's first lesson is previewed there on its borrowed M/W/F rhythm, keyed to s4a, faded", /gv-queued[\s\S]*DM 4A L1/.test(cell(h, fri, "s4a") || "") && cell(h, fri, "s3b") === null, cell(h, fri, "s4a"));
    ok("the preview never lands on or before 3B's last lesson (Wed 9/16)", dns.filter(dn => L[dn].date <= "2026-09-16").every(dn => cell(h, dn, "s4a") === null));
    ok("no cell in the lane column carries the lane key itself", !/id="gv-c-\d+-lane:/.test(h));
    ok("cell tap keeps the (dayNum, memberKey) contract", new RegExp('gvOpenCell\\(' + mon + ",'s3b'\\)").test(h));
    // past row: 3B's done cell shows as done, in the lane column
    const past = dns[0];
    ok("past done cell keeps its stored text + done badge", /Singapore 3B L1/.test(cell(h, past, "s3b") || "") && /done/.test(cell(h, past, "s3b") || ""));
    // multiple card: Geo+Sci both ran Tue 9/8 before the lane existed → both drawn
    const tue = dns[1];
    ok("a past day where two members both have cells draws both (record never hidden)", /Daily Geo L1/.test(cell(h, tue, "geo") || "") && /Daily Sci · Daily Sci L1/.test(cell(h, tue, "geo") || ""), cell(h, tue, "geo"));
    ok("multiple-card future cells carry the member's short name", /Daily Geo · <\/span>Daily Geo L2/.test(h) && /Daily Sci · <\/span>Daily Sci L2/.test(h));
    ok("a stack lane's cells carry the member's short name too (3B vs 4A in one column)", /Singapore 3B · <\/span>Singapore 3B L2/.test(h));
  }
}
{
  const c = world({ finish3b: true }); let h = "";
  try { h = render(c); } catch (e) { ok("renders after 3B finishes", false, String(e)); }
  if (h) {
    ok("4A is now the ACTIVE subject in the header", /onclick="ceOpenEdit\('kid','s4a'\)"[^>]*>DM 4A</.test(h));
    ok("finished 3B DROPS OFF the header entirely (it waits in ⚙ Rules until retired)", !/>Singapore 3B</.test(h.slice(h.indexOf('<tr class="gv-subrow">'), h.indexOf("</thead>"))));
    ok("the band still names the lane", /<tr class="gv-bandrow">[\s\S]*?🛤 Math/.test(h));
    const dns = c._dns; const L = c._lessons;
    const mon = dns.find(dn => L[dn].date === "2026-09-14");
    ok("4A's lessons appear in the lane column on 3B's rhythm, keyed to s4a — with NO cells of its own", /DM 4A L1/.test(cell(h, mon, "s4a") || ""), cell(h, mon, "s4a"));
    const monCell = cell(h, mon, "s4a") || "";
    ok("3B's stored Mon 9/14 cell is not the row's lesson any more — 4A's is; 3B's DONE record is drawn under it, read-only (the app's done-cell rule)", /DM 4A L1/.test(monCell) && /Singapore 3B · Singapore 3B L2/.test(monCell) && monCell.indexOf("DM 4A L1") < monCell.indexOf("Singapore 3B L2"), monCell);
  }
}
{
  // with no lanes, the render is byte-identical to a render that never heard of lanes
  const c = world({ lanes: null }); let h = "";
  try { h = render(c); } catch (e) { ok("renders without lanes", false, String(e)); }
  ok("no lanes → every subject keeps its own header", /<th[^>]*>Singapore 3B</.test(h) && /<th[^>]*>DM 4A</.test(h) === false && /× 4 subjects/.test(h));
  ok("no lanes → NO band row at all, so the Grid is unchanged for a kid with no lanes", !/gv-bandrow/.test(h));
  ok("— and 4A (no cells) sits in the card-only strip as before", /not in the grid yet[\s\S]{0,400}DM 4A/.test(h));
}

// ── 3. wiring ────────────────────────────────────────────────────────────────
console.log("\n── a ONE-UNIT lane changes no placement (her safe first lane) ──");
{
  const plain = world({ lanes: null });
  const oneUnit = world({ lanes: { m: { name: "Math", units: [{ sk: "s3b", rhythm: "own" }] } } });
  let hp = "", ho = "";
  try { hp = render(plain); ho = render(oneUnit); } catch (e) { ok("renders", false, String(e)); }
  const cells = h => (h.match(/id="gv-c-(\d+)-(\w+)"[^>]*>([\s\S]*?)<\/td>/g) || [])
    .map(x => x.replace(/<[^>]+>/g, "").trim()).filter(Boolean);
  const cellsFor = (h, sk) => (h.match(new RegExp('id="gv-c-\\d+-' + sk + '"[^>]*>([\\s\\S]*?)</td>', "g")) || [])
    .map(x => x.replace(/<[^>]+>/g, "").trim());
  ok("every 3B cell is IDENTICAL with and without the one-unit lane",
    JSON.stringify(cellsFor(hp, "s3b")) === JSON.stringify(cellsFor(ho, "s3b")), { without: cellsFor(hp, "s3b"), with: cellsFor(ho, "s3b") });
  ok("the other subjects' cells are identical too",
    JSON.stringify(cellsFor(hp, "plain")) === JSON.stringify(cellsFor(ho, "plain")) &&
    JSON.stringify(cellsFor(hp, "geo")) === JSON.stringify(cellsFor(ho, "geo")));
  ok("cell ids still key to the SUBJECT, so every gesture is unchanged", /id="gv-c-\d+-s3b"/.test(ho));
  ok("no short-name prefix on a single-member lane", !/Singapore 3B · <\/span>/.test(ho));
  ok("the band row now names the lane so she can SEE it", /<tr class="gv-bandrow">[\s\S]*?🛤 Math/.test(ho) && /ceOpenEdit\('kid','s3b'\)"[^>]*>Singapore 3B</.test(ho));
  ok("— and without the lane there is no band and no 🛤 at all", /<th[^>]*>Singapore 3B</.test(hp) && !/🛤/.test(hp) && !/gv-bandrow/.test(hp));
  ok("tapping the subject in the header still opens its card", /onclick="ceOpenEdit\('kid','s3b'\)"/.test(ho));
  ok("the two sticky header rows are pinned at different offsets (or they stack on scroll)", /\.gv thead tr\.gv-bandrow th\{top:0/.test(src) && /\.gv thead tr\.gv-subrow th\{top:17px[;}]/.test(src));
}

console.log("\n── a lane must never be mistaken for a deleted subject ──");
{
  // live 2026-09-12: she opened the Grid after making 8 one-unit lanes and the orphan banner
  // offered to purge all 8 as "deleted subjects" — the banner was reading the FOLDED column
  // list, which carries synthetic lane:<id> keys.
  const c = world(); let h = "";
  try { h = render(c); } catch (e) { ok("renders", false, String(e)); }
  ok("NO orphan banner for a kid whose only 'missing subjects' are lane keys", !/deleted subject/.test(h), (h.match(/deleted subject[\s\S]{0,120}/) || [""])[0]);
  ok("no lane:<id> key is ever offered for purge", !/lane:/.test((h.match(/deleted subject[\s\S]{0,300}/) || [""])[0]));
  ok("the banner reads the real subject keys", /const _orphans=_allSks\.filter/.test(src));
  // and a GENUINE orphan (cells, no subject record) must still be caught
  const g = world({ lanes: null });
  g.currData.lessons.kid[Object.keys(g.currData.lessons.kid)[0]].ghost_subj = "leftover";
  let hg = ""; try { hg = render(g); } catch (e) {}
  ok("a REAL orphan is still reported", /deleted subject/.test(hg) && /ghost_subj/.test(hg), (hg.match(/deleted subject[\s\S]{0,140}/) || [""])[0]);
}

console.log("\n── wiring ──");
{
  const g = src.indexOf("function renderCurrGrid"); const grid = src.slice(g, g + 70000);
  ok("columns are folded through lnFoldColumns", /const _lnFold=\(typeof lnFoldColumns==="function"\)\?lnFoldColumns\(gvKid,_colsRaw\)/.test(grid));
  ok("done-cell scan, grid end and 'other subjects' walk the MEMBERS, not the lane keys", /for\(const sk of _allSks\)\{   \/\/ 🛤 members of a lane column too/.test(grid) && /for\(const sk of _allSks\)\{   \/\/ 🛤 lane members count individually/.test(grid) && /cbOtherSubjects\(gvKid,_allSks,_cardOnly\)/.test(grid));
  ok("the cell loop resolves the member once per row", /const sk=_lc\?lnPickMember\(gvKid,_lc,dn,l,past,_gvDer,_doneAt\):ck;/.test(grid));
  ok("the derived read for a plain column is untouched (test_derived_col pins it)", /_gvDer\[sk\]=\(typeof gvDerivedColumn==="function"\)\?gvDerivedColumn\(gvKid,sk\):null;/.test(grid));
  ok("gvSubjectCols itself is untouched (gvPurgeOrphans still sees real orphans)", /return Object\.keys\(seen\)\.filter\(sk=>!subs\[sk\]\|\|subs\[sk\]\.tracking!=="daily"\)/.test(braceSlice("gvSubjectCols")));
  ok("no writes in the grid block", !/db\.ref|\.set\(|\.update\(|\.remove\(/.test(block("// LANE_GRID_START", "// LANE_GRID_END")));
}

// ── ⏸ paused subject (her ask 2026-09-12: pull its grid spots when paused, re-lay on resume) ──
console.log("\n── paused ──");
{
  const c = world(); const dns = c._dns; const L = c._lessons;
  const thu17 = dns.find(dn => L[dn].date === "2026-09-17"), thu10 = dns.find(dn => L[dn].date === "2026-09-10");
  let h = render(c);
  ok("active: Plain's future Thursday shows its lesson", /Plain L\d/.test(cell(h, thu17, "plain") || ""), cell(h, thu17, "plain"));
  c.currData.subjects.kid.plain.paused = true;
  h = render(c);
  // her follow-up 2026-09-12: "could pause come off the grid like it used to … and just rest somewhere"
  ok("paused: its column is OFF the grid (no header, no cells)", !/id="gv-c-\d+-plain"/.test(h) && !/<th[^>]*>Plain</.test(h));
  ok("paused: it rests in the ⏸ Paused strip, one tap from its card", /gv-paused-strip[\s\S]*?onclick="ceOpenEdit\('kid','plain'\)"[^>]*>Plain</.test(h));
  ok("paused: NOT listed under 'No lessons to pace'", !/No lessons to pace[\s\S]{0,600}>Plain</.test(h));
  ok("paused: its stored cells are untouched", /Plain L1/.test(L[thu10].plain) && /Plain L2/.test(L[thu17].plain));
  ok("paused: other columns untouched (3B still laid Mon 9/14)", /Singapore 3B L2/.test(cell(h, dns.find(dn => L[dn].date === "2026-09-14"), "s3b") || ""));
  c.currData.subjects.kid.plain.paused = false;
  h = render(c);
  ok("resumed: it lays again on its own (nothing was deleted)", /Plain L\d/.test(cell(h, thu17, "plain") || ""));
  ok("resumed: column back, Paused strip gone", /<th[^>]*>Plain</.test(h) && !/gv-paused-strip/.test(h));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
