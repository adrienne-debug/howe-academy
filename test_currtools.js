/* test_currtools.js — CURRTOOLS (Curriculum streamline slice 4, PLAN_curriculum_streamline_2026-11-10.md §3.1 / §4 row 4).
 * Her words 2026-11-10: "i like the grid format i like the lanes but its not easily navigateable for a new family …
 * i dont want to take away any features".
 *
 * The toolbar above the grid = kid chips · 🏡 Family · ＋ Add subject · [📅 Kid's year — the two kid-tool buttons, untouched
 * until slice 3] · ⋯ More, and the housekeeping / migration / audit banners sit inside one collapsed "🔍 Checks (n)" drawer.
 *
 *   (a) each banner's condition forced true, one at a time: its markup and its onclick strings render INSIDE the drawer,
 *       in its group (Worth a look / Tidy-up), and nowhere else; the badge counts it
 *   (b) the badge = the number of true conditions (all at once; the three always-on panels count only when they flag);
 *       the three always-on panels' "needs a look" words are still in their render functions
 *   (c) every condition false: the drawer is absent, and the grid (.gv-wrap on) is the same with or without banners
 *   (d) every toolbar control (Appendix A #1–8, #44–47) is reachable by its handler string, on the toolbar or in ⋯ More;
 *       ↻ Lay everything out again = gvRebuildAll() with cbRebuildAll's confirm unchanged; select mode keeps its way out
 *   (e) the two kid-tool buttons are byte-identical to main 59b0b15 (slice 3 KIDYEAR replaces them — update the pin there)
 *   (f) open / closed is remembered per device, in try/catch; the block writes nothing; no new ref( pattern
 *   (g) CURRTOOLS_VS=<old index.html>: against the file before this slice — every banner's markup is byte-identical inside
 *       the drawer, every old onclick is still on the page, the grid render hashes equal, the whole file's ref( set is equal
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const OLD = process.env.CURRTOOLS_VS ? fs.readFileSync(process.env.CURRTOOLS_VS, "utf8") : null;

let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra).slice(0, 700) + ")" : "")); } }
const sha = s => crypto.createHash("sha256").update(s).digest("hex");

function _block(S, a, b) { const i = S.indexOf(a), j = S.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return S.slice(i, j); }
function _optBlock(S, a, b) { const i = S.indexOf(a), j = S.indexOf(b, i); return i < 0 || j < 0 ? "" : S.slice(i, j); }
function _braceSlice(S, name) {
  const sig = "function " + name + "("; const i = S.indexOf(sig); if (i < 0) throw new Error("fn " + name);
  let d = 0, j = S.indexOf("{", i);
  for (let k = j; k < S.length; k++) { if (S[k] === "{") d++; else if (S[k] === "}") { d--; if (d === 0) return S.slice(i, k + 1); } }
  throw new Error("unbalanced " + name);
}
function gridSrc(S) { const i = S.indexOf("function renderCurrGrid(el){"); return S.slice(i, S.indexOf("\n}\n", i)); }
const onclicks = h => { const o = []; const re = /onclick="([^"]*)"/g; let m; while ((m = re.exec(h))) o.push(m[1]); return o; };
const norm = f => f.replace(/^ctMoreOpen=false;/, "");   // a ⋯ More item closes the menu, then runs the old handler

// ── the world: test_currwords' grid harness (real renderCurrGrid + lanes + derived columns over a stub kid) ──
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
  const subjects = { s3b: subj("Singapore 3B", 3, ["Mon", "Wed", "Fri"], 3), s4a: subj("DM 4A", 4, ["Tue"], 1), plain: subj("Plain", 3, ["Thu"], 1) };
  const lessons = lessonsRows(4);
  const dns = Object.keys(lessons).map(Number);
  lessons[dns[0]].s3b = "Singapore 3B L1"; lessons[dns[5]].s3b = "Singapore 3B L2";
  lessons[dns[3]].plain = "Plain L1"; lessons[dns[8]].plain = "Plain L2"; lessons[dns[13]].plain = "Plain L3";
  const done = { s3b: { L0001: { ts: 1, day: "2026-09-07" } } };
  const lanes = { math: { name: "Math", units: [{ sk: "s3b", rhythm: "own" }, { sk: "s4a", rhythm: "prior" }] } };
  const ctx = {
    console, Set, Map, Math, Object, Array, String, Number, JSON, parseInt, Date, RegExp, Error,
    currData: { subjects: { kid: subjects }, done: { kid: done }, lessons: { kid: lessons }, lanes: { kid: lanes }, skiplog: {} },
    scheduleOverrides: {}, checked: {}, weekData: { tasks: [] }, paceData: { subjects: {} },
    gvKid: "kid", gvShowPast: false, gvSelMode: false, gvSel: new Set(), gvSelAnchor: null, gvEdit: null, gvMenu: null, gvSelUndo: null, lmMovePick: null, lmMoveWeek: null,
    cbRulesOpen: false, cbKid: "kid", cbGate: null, KID_COLOR: { kid: "#123456" }, DAY_DT: {}, momModeActive: true, adminPinUnlocked: false, gvEndSort: false,
    dbg: () => {}, cbTodayISO: () => TODAY, gwParseDate: s => { const p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); },
    cbExtendInfo: () => null, cbBlockedDates: () => [], cbDayCap: () => 0, cbOverCapDays: () => 0, cbAltGroups: () => ({}), cbGroupOf: () => null,
    smapIsKidOff: () => false, schedOvKidOff: () => false, schedOv: () => null, coopBlocksBase: () => false, coopNoMomBaseFor: () => "", coopsOnDate: () => [],
    computeFutureSlots: () => ({}), retrTracks: () => [], formatPlanDate: d => d, cap: s => s, cbRenderRules: () => "", cbRenderGate: () => "",
    document: { getElementById: () => null, querySelector: () => null }, setTimeout: () => 0,
    ROSTER: ["kid"], currViewKid: "kid", gvKidCfgOpen: false, cbMsg: "", cbLastBuild: null, momVerifyKid: null, lmLastMove: null, gvScrollTop: 0, gvScrollLeft: 0, RETR_SLOT_TITLE: {},
    ceRenderSessions: () => "", ceConvUndoGet: () => null, fbRender: () => "", dmRender: () => "", gvAuditRender: () => "", alignPlanPreview: () => ({ kids: {} }),
    pacePhantomKeys: () => [], lidUnassigned: () => [], lidImportPending: () => [], lidOutOfOrderAll: () => [], skiplogLeftovers: () => [], dayTokenLeftovers: () => [],
    capLeftovers: () => ({ items: [], orphans: [], node: null }), planPending: () => [], gvNoSeqSubjects: () => [], gvMissingDays: () => [], gvSelFilledCount: () => 0, gvSelSingleSubject: () => null,
    retrDayKinds: () => [], retrSlotMinutes: () => 15, momHere: () => true, famGridHTML: () => "", FAM_ICON: "🏡", cbRebuildable: () => true,
    gvEndSortToggle: () => {}, renderAll: () => { ctx._renders = (ctx._renders || 0) + 1; },
    gvFilled: v => !!(v && v !== "—" && v !== "nan" && String(v).trim()),
    cbDoneCellSet: (k, sk, cells) => { const di = ctx.lidDoneIdx(k, sk); if (!di) return null; const seq = subjects[sk].lessonSeq; const out = new Set(); cells.forEach((c, i) => { const idx = seq.indexOf(c.text); if (idx >= 0 && di.has(idx)) out.add(i); }); return out; },
    _lidNorm: s => String(s == null ? "" : s).replace(/[–—−]/g, "-").replace(/\s+/g, " ").trim().toLowerCase(),
  };
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
    block("// LANE_START", "// LANE_END"), block("// GRIDEND_START", "// GRIDEND_END"), block("// GVDER_START", "// GVDER_END"),
    braceSlice("renderCurrGrid"),
  ].join("\n");
  vm.createContext(ctx);
  // the label map and this slice's block load with the code under test (an old file has no CURRTOOLS block: "")
  new vm.Script(_optBlock(S, "// CURRWORDS_START", "// CURRWORDS_END") + "\n" + _optBlock(S, "// CURRTOOLS_START", "// CURRTOOLS_END") + "\n" + CODE).runInContext(ctx);
  ctx._lessons = lessons; ctx._dns = dns;
  return ctx;
}
function render(S, over, pre) {
  const c = world(S, over);
  if (pre) vm.runInContext(pre, c);
  const el = { innerHTML: "" }; c.renderCurrGrid(el); return el.innerHTML;
}
const OPEN = "ctChecksOpen=true;ctMoreOpen=true;";
const drawerOf = h => { const i = h.indexOf('<div class="ct-checks"'); if (i < 0) return null; let d = 0, k = i;
  const re = /<div\b|<\/div>/g; re.lastIndex = i; let m; while ((m = re.exec(h))) { d += m[0] === "</div>" ? -1 : 1; if (d === 0) { k = m.index + 6; break; } } return h.slice(i, k); };
const groupOf = (h, cls) => { const i = h.indexOf('<div class="' + cls + '">'); if (i < 0) return ""; let d = 0; const re = /<div\b|<\/div>/g; re.lastIndex = i; let m;
  while ((m = re.exec(h))) { d += m[0] === "</div>" ? -1 : 1; if (d === 0) return h.slice(i, m.index + 6); } return ""; };
const gridOf = h => h.slice(h.indexOf('<div class="gv-wrap">'));
const badge = h => { const m = /🔍 Checks \((\d+)\)/.exec(h); return m ? +m[1] : (/🔍 Checks · /.test(h) ? 0 : null); };

// ── the always-on panels, in their real headline shapes (see (b) for the source pins) ──
const FB = alarm => '<div style="background:#eef2ff"><div><div style="font-size:12px;color:#3730a3"><b>&#9878; Evening out</b> — ' + (alarm ? '950 min of you asked this week <span style="color:#b91c1c;font-weight:700">(50 more than the mornings hold)</span>' : '600 min of you asked this week <span style="color:#15803d">(fits)</span>') + '</div><button onclick="fbToggle()">Show</button></div></div>';
const DM = alarm => '<div style="background:#fff7ed"><div style="display:flex"><div style="flex:1"><b>🗓 Daily cards missed</b> — ' + (alarm ? '2 daily cards missed this week or in a row' : 'every daily card done on its day ✓') + '</div><button onclick="dmToggle()">Show</button></div></div>';
const AU = alarm => '<div style="background:#fffbeb"><div><div style="font-size:12px;color:#92400e">' + (alarm ? '<b>🔍 3 things to check</b> in kid’s plan — skipped numbers.' : '<b>🔍 kid’s upcoming plan looks clean.</b> <span>2 older ones left as the record.</span>') + '</div><button onclick="gvAuditToggle()">Show</button></div></div>';

// every banner, its condition forced true, and the onclicks it must carry (Appendix A #19–43, #55–56)
const BANNERS = [
  { k: "order", g: "ct-worth", over: { lidOutOfOrderAll: () => [{ sk: "plain", disp: "Plain", n: 2, texts: ["Plain L3", "Plain L2"] }] }, fns: ["ceOpenEdit('kid','plain')"] },
  { k: "restore", g: "ct-worth", over: { ceConvUndoGet: () => ({ kid: "kid", sk: "plain", cells: { a: 1, b: 2 }, at: null }) }, fns: ["ceConvUndoApply()", "ceConvUndoDismiss()"] },
  { k: "evening", g: "ct-worth", over: { fbRender: () => FB(true) }, fns: ["fbToggle()"] },
  { k: "daily", g: "ct-worth", over: { dmRender: () => DM(true) }, fns: ["dmToggle()"] },
  { k: "audit", g: "ct-worth", over: { gvAuditRender: () => AU(true) }, fns: ["gvAuditToggle()"] },
  { k: "align", g: "ct-worth", over: { alignPlanPreview: () => ({ kids: { kid: { onBreak: 2 } } }) }, fns: ["alignPlanApply()"] },
  { k: "missing", g: "ct-worth", over: { gvMissingDays: () => ["2026-09-21", "2026-09-22"] }, fns: ["gvAddMissingDays()"] },
  { k: "pace", g: "ct-tidy", over: { pacePhantomKeys: () => ["oldsk"], paceData: { subjects: { kid: { oldsk: { label: "Old Math" } } } } }, fns: ["gvPurgePaceGhosts()"] },
  { k: "lids", g: "ct-tidy", over: { lidUnassigned: () => [{ n: 40 }, { n: 12 }] }, fns: ["gvAssignLids()"] },
  { k: "lids", g: "ct-tidy", name: "lids (import)", over: { lidImportPending: () => ["a", "b"] }, fns: ["gvImportDone()"] },
  { k: "lids", g: "ct-tidy", name: "lids (import undo)", over: { _lidImportUndo: { n: 9, subjects: 2 } }, fns: ["gvImportDoneUndo()"] },
  { k: "skiplog", g: "ct-tidy", over: { skiplogLeftovers: () => [{ n: 3 }, { n: 1 }] }, fns: ["gvClearSkiplog('kid')"] },
  { k: "skiplog", g: "ct-tidy", name: "skiplog (undo)", over: { _skiplogClearUndo: { kid: "kid", n: 4, subjects: 2 } }, fns: ["gvClearSkiplogUndo()"] },
  { k: "caps", g: "ct-tidy", over: { capLeftovers: () => ({ items: [1, 2], orphans: [1], node: null }) }, fns: ["gvMigrateCaps()"] },
  { k: "caps", g: "ct-tidy", name: "caps (undo)", over: { _capMigUndo: { n: 2 } }, fns: ["gvMigrateCapsUndo()"] },
  { k: "days", g: "ct-tidy", over: { dayTokenLeftovers: () => [{ disp: "Plain", tokens: ["no-fri"] }] }, fns: ["gvMigrateDayTokens('kid')"] },
  { k: "days", g: "ct-tidy", name: "days (undo)", over: { _dayTokUndo: { kid: "kid", n: 1 } }, fns: ["gvMigrateDayTokensUndo()"] },
  { k: "plan", g: "ct-tidy", over: { planPending: () => [{ kid: "kid", sk: "plain", disp: "Plain" }, { kid: "kid", sk: "s4a", disp: "DM 4A" }], _planMakeUndo: { disp: "Old" } }, fns: ["gvMakePlanAll('kid')", "gvMakePlan('kid','plain')", "gvMakePlan('kid','s4a')", "gvMakePlanUndo()"] },
  { k: "plan", g: "ct-tidy", name: "plan (undo alone)", over: { _planMakeUndo: { disp: "Plain" } }, fns: ["gvMakePlanUndo()"] },
  { k: "plan", g: "ct-tidy", name: "plan (lesson ids undo)", over: { _lidAssignUndo: { n: 3 } }, fns: ["gvAssignLidsUndo()"] },
  { k: "orphans", g: "ct-tidy", pre: "currData.lessons.kid[_dns[6]].ghost_subj='leftover';", fns: ["gvPurgeOrphans()"] },
  { k: "capture", g: "ct-tidy", over: { gvNoSeqSubjects: () => [{ disp: "Plain", n: 3 }] }, fns: ["gvCaptureSeqs()"] },
];
const ALL_TRUE_OVER = () => { const o = {}; ["order", "restore", "evening", "daily", "audit", "align", "missing", "pace", "lids", "skiplog", "caps", "days", "capture"].forEach(k => Object.assign(o, BANNERS.find(b => b.k === k && !b.name).over)); Object.assign(o, BANNERS.find(b => b.k === "plan" && !b.name).over); return o; };
const ALL_TRUE_PRE = "currData.lessons.kid[_dns[6]].ghost_subj='leftover';";
const SLOTS = ["order", "restore", "evening", "daily", "audit", "align", "missing", "pace", "lids", "skiplog", "caps", "days", "plan", "orphans", "capture"];

const BASE = render(src, {}, OPEN);
const BASE_OC = new Set(onclicks(BASE));

console.log("\n(a) each banner, its condition forced true, renders inside the drawer with its onclicks");
for (const b of BANNERS) {
  const name = b.name || b.k;
  const h = render(src, b.over, (b.pre || "") + OPEN);
  const d = drawerOf(h) || "";
  const g = groupOf(d, b.g);
  const outside = d ? h.replace(d, "") : h;
  const missingIn = b.fns.filter(f => onclicks(g).indexOf(f) < 0);
  const leaked = b.fns.filter(f => !BASE_OC.has(f) && onclicks(outside).indexOf(f) >= 0);   // a column header also opens 'plain'

  ok(name + ": its buttons render in the drawer's " + (b.g === "ct-worth" ? "Worth a look" : "Tidy-up") + " group, with the same onclick", d && missingIn.length === 0, { missingIn, drawer: !!d });
  ok(name + ": …and nowhere outside the drawer", leaked.length === 0, leaked);
  ok(name + ": the badge counts it — 🔍 Checks (1)", badge(h) === 1, badge(h));
  const newOc = onclicks(h).filter(f => !BASE_OC.has(f) && f !== "ctChecksToggle()");
  // (the orphan's own cells also draw a grid column — that is the grid, not the banner)
  ok(name + ": nothing else changed on the page (only its own onclicks are new)", newOc.every(f => b.fns.indexOf(f) >= 0 || /ghost_subj/.test(f)), newOc);
  // collapsed: the drawer line only — the banner is not drawn until she opens it
  const hc = render(src, b.over, (b.pre || "") + "ctChecksOpen=false;");
  ok(name + ": collapsed, only the 🔍 Checks (1) ▸ line shows", badge(hc) === 1 && /🔍 Checks \(1\) ▸/.test(hc) && b.fns.every(f => onclicks(hc).indexOf(f) < 0 || f === "ceOpenEdit('kid','plain')"));
}

console.log("\n(b) the badge = the number of true conditions");
{
  const h = render(src, ALL_TRUE_OVER(), ALL_TRUE_PRE + OPEN);
  ok("every slot forced true at once: 🔍 Checks (" + SLOTS.length + ")", badge(h) === SLOTS.length, badge(h));
  const d = drawerOf(h);
  const wantW = BANNERS.filter(b => b.g === "ct-worth" && !b.name).map(b => b.k), wantT = SLOTS.filter(k => wantW.indexOf(k) < 0);
  ok("Worth a look holds " + wantW.join(", ") + " — in that order", (() => { const g = groupOf(d, "ct-worth"); const pos = wantW.map(k => g.indexOf(onclicks(g).find(f => BANNERS.find(b => b.k === k).fns.indexOf(f) >= 0) || "§")); return pos.every((p, i) => p >= 0 && (i === 0 || p > pos[i - 1])); })());
  ok("Tidy-up holds the other " + wantT.length + " (" + wantT.join(", ") + ")", wantT.every(k => BANNERS.filter(b => b.k === k && !b.name).every(b => b.fns.every(f => onclicks(groupOf(d, "ct-tidy")).indexOf(f) >= 0))));
  ok("the groups are labelled Worth a look / Tidy-up", /Worth a look<\/div>/.test(d) && /Tidy-up — one-time fixes for an older curriculum<\/div>/.test(d));
  // the always-on panels draw when all is well: they sit in the drawer but do not count
  const calm = render(src, { fbRender: () => FB(false), dmRender: () => DM(false), gvAuditRender: () => AU(false) }, OPEN);
  ok("Evening out (fits), Daily cards (every one done) and a clean audit line: in the drawer, badge 0 — '🔍 Checks · nothing needs you'", badge(calm) === 0 && /🔍 Checks · nothing needs you/.test(calm) && ["fbToggle()", "dmToggle()", "gvAuditToggle()"].every(f => onclicks(groupOf(drawerOf(calm), "ct-worth")).indexOf(f) >= 0));
  const two = render(src, { fbRender: () => FB(true), dmRender: () => DM(false), gvAuditRender: () => AU(true), gvMissingDays: () => ["2026-09-21"] }, OPEN);
  ok("Evening out over + clean daily cards + 3 audit findings + missing days → 🔍 Checks (3)", badge(two) === 3, badge(two));
  // the headline words ctNeedsLook reads are still what the panels draw
  const fb = _braceSlice(src, "fbRender"), dm = _braceSlice(src, "dmRender"), au = _braceSlice(src, "gvAuditRender");
  ok("fbRender still says '… more than the mornings hold' / '… to look at</span>' when it flags", fb.indexOf("more than the mornings hold)</span>") >= 0 && fb.indexOf("to look at</span>") >= 0);
  ok("dmRender still says 'every daily card done on its day' when nothing is missed", dm.indexOf("'every daily card done on its day ✓'") >= 0);
  ok("gvAuditRender still says '… to check</b>' only when it found something", /_tot\s*\?'<b>🔍 '\+_tot\+' thing'\+\(_tot>1\?'s':''\)\+' to check<\/b>/.test(au));
}

console.log("\n(c) every condition false: no drawer, and the grid is the same");
{
  const off = render(src, {}, "ctChecksOpen=true;");
  ok("the drawer is absent (open on this device or not)", off.indexOf("ct-checks") < 0 && off.indexOf("🔍 Checks") < 0);
  const on = render(src, ALL_TRUE_OVER(), ALL_TRUE_PRE + "ctChecksOpen=true;");
  const onNoGhost = render(src, ALL_TRUE_OVER(), "ctChecksOpen=true;");
  ok("the grid (.gv-wrap on) is byte-identical with every banner on or off", sha(gridOf(off)) === sha(gridOf(onNoGhost)), [sha(gridOf(off)).slice(0, 12), sha(gridOf(onNoGhost)).slice(0, 12)]);
  ok("…and everything above the drawer too (toolbar, strips)", on.slice(0, on.indexOf('<div class="ct-checks"')) === off.slice(0, on.indexOf('<div class="ct-checks"')));
  ok("the drawer sits under the toolbar, above the grid's own how-to line", on.indexOf("ct-checks") > on.indexOf("gvKidCfgToggle()") && on.indexOf("ct-checks") < on.indexOf("tap a cell to edit"));
}

console.log("\n(d) every toolbar control is reachable — on the toolbar or in ⋯ More");
{
  const full = { gvShowPast: false, gvSelUndo: { x: 1 }, cbMsg: "Built.", cbLastBuild: { x: 1 } };
  const closed = render(src, full, "ctMoreOpen=false;");
  const open = render(src, full, "ctMoreOpen=true;");
  const menu = (() => { const i = open.indexOf('<div class="ct-more"'); return i < 0 ? "" : open.slice(i, open.indexOf("</div>", i)); })();
  const TOOLBAR = ["gvSetKid('kid')", "gvSetKid('__fam')", "ceOpenAdd('kid')", "gvRulesToggle()", "gvKidCfgToggle()", "ctMoreToggle()", "cbUndo()", "cbMsg='';renderAll()"];
  const MORE = ["gvTogglePast()", "gvToggleSelMode()", "gvEndSortToggle()", "gvSelUndoApply()", "gvRebuildAll()"];
  ok("on the toolbar: kid chips · 🏡 Family · ＋ Add subject · the two 📅 buttons · ⋯ More · the result banner's ↩ Undo / ×", TOOLBAR.every(f => onclicks(closed).indexOf(f) >= 0), TOOLBAR.filter(f => onclicks(closed).indexOf(f) < 0));
  ok("in ⋯ More (open): Show past days · Edit many cells · Order columns by end date · ↩ Undo last · Lay everything out again", MORE.every(f => onclicks(menu).map(norm).indexOf(f) >= 0), MORE.filter(f => onclicks(menu).map(norm).indexOf(f) < 0));
  ok("…each item's onclick is the old handler, after closing the menu", onclicks(menu).every(f => /^ctMoreOpen=false;/.test(f)));
  ok("⋯ More closed: none of them is on the page", MORE.every(f => onclicks(closed).map(norm).indexOf(f) < 0));
  ok("⋯ More menu order: past · select · end date · undo last · lay everything out again", (() => { const o = onclicks(menu).map(norm); return MORE.every((f, i) => i === 0 || o.indexOf(f) > o.indexOf(MORE[i - 1])); })());
  ok("the labels are cw() words: Show past days (N) · Edit many cells at once · Order columns by end date · ↻ Lay everything out again (N)", /Show past days \(\d+\)/.test(menu) && /☑︎ Edit many cells at once/.test(menu) && /Order columns by end date/.test(menu) && /↻ Lay everything out again \(3\)/.test(menu) && /↩ Undo last/.test(menu));
  ok("＋ Add subject is the toolbar's word (cw addSubject)", /'\+cw\("addSubject"\)\+'<\/button>/.test(gridSrc(src)) && open.indexOf("＋ Add subject</button>") >= 0);
  // gates kept: Lay everything out again only for Mom with paced subjects, end-date order only for Mom
  const notMom = render(src, { momModeActive: false, adminPinUnlocked: false, momHere: () => false }, "ctMoreOpen=true;");
  ok("without Mom: no Lay everything out again, no end-date order (the old gates)", onclicks(notMom).map(norm).indexOf("gvRebuildAll()") < 0 && onclicks(notMom).map(norm).indexOf("gvEndSortToggle()") < 0 && onclicks(notMom).map(norm).indexOf("gvToggleSelMode()") >= 0);
  const noPaced = render(src, { cbRebuildable: () => false }, "ctMoreOpen=true;");
  ok("no paced subject: no Lay everything out again (as before)", onclicks(noPaced).map(norm).indexOf("gvRebuildAll()") < 0);
  // no grid yet: ⋯ More still carries Lay everything out again (it sat in the kid-tools row before the grid existed)
  const empty = render(src, { currData: { subjects: { kid: { plain: subj("Plain", 3, ["Thu"], 1) } }, lessons: { kid: {} }, done: {}, skiplog: {} } }, "ctMoreOpen=true;");
  ok("a kid with no grid yet: ⋯ More holds Lay everything out again only, and no placeholder is left", onclicks(empty).map(norm).indexOf("gvRebuildAll()") >= 0 && onclicks(empty).map(norm).indexOf("gvToggleSelMode()") < 0 && empty.indexOf("__CT_MORE__") < 0);
  ok("no placeholder left on the full page either", open.indexOf("__CT_MORE__") < 0 && closed.indexOf("__CT_MORE__") < 0);
  // select mode: the way out stays in sight
  const sel = render(src, { gvSelMode: true }, "ctMoreOpen=false;");
  ok("in select mode the ✕ Done button stays on the row (gvToggleSelMode), with the selection bar", onclicks(sel).indexOf("gvToggleSelMode()") >= 0 && /✕ Done<\/button>/.test(sel) && onclicks(sel).indexOf("gvSelClear()") >= 0);
  ok("out of select mode the row has only the how-to line", onclicks(closed).indexOf("gvToggleSelMode()") < 0 && /tap a cell to edit/.test(closed));
  // ↻ Rebuild all → Lay everything out again: same handler, same confirm
  ok("gvRebuildAll is unchanged: cbKid=gvKid; cbRebuildAll();", /^function gvRebuildAll\(\)\{ cbKid=gvKid; cbRebuildAll\(\); \}$/m.test(src));
  ok("cbRebuildAll's confirm text is unchanged", _braceSlice(src, "cbRebuildAll").indexOf('if(!confirm(cw("layAll")+": all "+list.length+" of "+cap(kid)+"’s paced subjects, from where they are now—using each one’s current pacing and the latest calendar?\\n\\nCompleted work is kept, and you can Undo.")) return;') >= 0);
  ok("cbRebuildAll is byte-identical to main 59b0b15", sha(_braceSlice(src, "cbRebuildAll")) === "48e83df0ac9d24f764059c2ece5e28a41072ef82b934df04ee78513e7886ce4b", sha(_braceSlice(src, "cbRebuildAll")));
  // tapping: ctMoreToggle flips and re-renders; a menu item closes the menu
  const c = world(src, {}); vm.runInContext("ctMoreOpen=false;", c); c.ctMoreToggle();
  ok("ctMoreToggle opens the menu and re-renders", vm.runInContext("ctMoreOpen", c) === true && c._renders === 1);
}

console.log("\n(e) the two kid-tool buttons are untouched (slice 3 KIDYEAR replaces them — update this pin there)");
{
  const lines = gridSrc(src).split("\n").filter(l => /^  h\+='<button onclick="gv(RulesToggle|KidCfgToggle)\(\)"/.test(l));
  ok("both buttons drawn by the same two source lines as main 59b0b15", lines.length === 2 && sha(lines.join("\n") + "\n") === "b7dd90f47243e3378e892e613fa8186c1fa82d6698d72625622987ecef79906c", sha(lines.join("\n") + "\n"));
  const h = render(src, {}, "");
  const btns = (h.match(/<button onclick="gv(?:RulesToggle|KidCfgToggle)\(\)"[\s\S]*?<\/button>/g) || []);
  ok("…and they render side by side, then ⋯ More, in one row", btns.length === 2 && h.indexOf(btns[1]) + btns[1].length === h.indexOf('<button onclick="ctMoreToggle()"'));
}

console.log("\n(f) remembered per device; writes nothing; no new ref( pattern");
{
  const CT = _block(src, "// CURRTOOLS_START", "// CURRTOOLS_END");
  ok("the block cites her words and the date", /2026-11-10/.test(CT) && /i dont want to take away any features/.test(CT));
  const store = {}; const c = world(src, { HA_LS: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = v; } } });
  ok("closed by default on a new device", c.ctChecksIsOpen() === false);
  c.ctChecksToggle();
  ok("a tap opens it, saves 'ha_ct_checks'=1 on this device and re-renders", c.ctChecksIsOpen() === true && store.ha_ct_checks === "1" && c._renders === 1);
  const c2 = world(src, { HA_LS: { getItem: k => (k in store ? store[k] : null), setItem: () => {} } });
  ok("a reload on the same device reads it back open", c2.ctChecksIsOpen() === true);
  const c3 = world(src, { HA_LS: { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("full"); } } });
  ok("storage that throws: closed, and the tap still opens it (try/catch, in memory)", c3.ctChecksIsOpen() === false && (c3.ctChecksToggle(), c3.ctChecksIsOpen() === true));
  ok("the block never touches the database", !/\bdb\b|\.set\(|\.update\(|\.remove\(|\bref\(/.test(CT.replace(/HA_LS\.setItem/g, "")));
  ok("renderCurrGrid still has no ref( / db. at all", !/\bref\(|\bdb\./.test(gridSrc(src)));
  ok("one CURRTOOLS block", src.split("// CURRTOOLS_START").length === 2 && src.split("// CURRTOOLS_END").length === 2);
  ok("the banners' own source lines are kept (moved, not rewritten): every banner onclick is still in renderCurrGrid", BANNERS.every(b => b.fns.every(f => b.k === "restore" || b.k === "evening" || b.k === "daily" || b.k === "audit" || gridSrc(src).indexOf(f.replace(/'kid'/g, "\\''+gvKid+'\\'").replace(/'plain'|'s4a'/g, "")) >= 0 || /gvMakePlan|ceOpenEdit/.test(f))));
}

if (OLD) {
  console.log("\n(g) against CURRTOOLS_VS — the file before this slice");
  for (const b of BANNERS) {
    const name = b.name || b.k;
    const was = render(OLD, b.over, b.pre || ""), wasBase = render(OLD, {}, "");
    const now = render(src, b.over, (b.pre || "") + OPEN);
    const g = groupOf(drawerOf(now) || "", b.g);
    const inner = g.slice(g.indexOf("</div>") + 6, g.length - 6);   // past the group label, before the group's close
    ok(name + ": the banner's markup is byte-identical inside the drawer", inner.length > 0 && was.indexOf(inner) >= 0 && (b.k === "orphans" || was.length - wasBase.length === inner.length), { inner: inner.slice(0, 160), grew: was.length - wasBase.length, len: inner.length });
  }
  const wasAll = render(OLD, Object.assign(ALL_TRUE_OVER(), { gvSelUndo: { x: 1 }, cbMsg: "x", cbLastBuild: { x: 1 } }), ALL_TRUE_PRE);
  const nowAll = render(src, Object.assign(ALL_TRUE_OVER(), { gvSelUndo: { x: 1 }, cbMsg: "x", cbLastBuild: { x: 1 } }), ALL_TRUE_PRE + OPEN);
  const gone = [...new Set(onclicks(wasAll))].filter(f => onclicks(nowAll).map(norm).indexOf(f) < 0);
  ok("every onclick the old page drew (banners + toolbar, all on) is still on the page", gone.length === 0, gone);
  const wasOff = render(OLD, {}, ""), nowOff = render(src, {}, "ctChecksOpen=true;");
  ok("every condition false: the grid render hashes equal the old file's", sha(gridOf(wasOff)) === sha(gridOf(nowOff)), [sha(gridOf(wasOff)).slice(0, 12), sha(gridOf(nowOff)).slice(0, 12)]);
  const refs = S => { const o = new Set(); const re = /\bref\(((?:[^()]|\([^()]*\))*)\)/g; let m; while ((m = re.exec(S))) o.add(m[1].replace(/\s+/g, "")); return [...o].sort(); };
  ok("the whole file's set of ref( path patterns is unchanged", JSON.stringify(refs(OLD)) === JSON.stringify(refs(src)));
  const kt = S => gridSrc(S).split("\n").filter(l => /^  h\+='<button onclick="gv(RulesToggle|KidCfgToggle)\(\)"/.test(l)).join("\n");
  ok("the two kid-tool button lines equal the old file's", kt(OLD) === kt(src) && kt(src).length > 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
