/*
 * Node tests for 📅 Curriculum heads-up, step 1 (RMX_START…RMX_END, her yes 2026-10-25):
 * automatic items computed from the lesson lists — runout / empty / handoff / nolist — shown
 * in the Mom HQ ▸ Curriculum strip under "From the curriculum". Never stored, never written.
 *   · rmxCfg: no config/rules/headsUp node → exactly RMX_DEFAULTS (warn 3 weeks, red at 5 left or 7 days);
 *     family ← kid ← subject layering; subject `off` → on:false; out-of-range / junk values clamp or fall back
 *   · runout: red by lessons (≤5) or by date (≤7 days); amber by date (≤21 days) or warnLeft; else nothing
 *   · empty: a live list at 0 → red with the last done day; stays red; paused → nothing
 *   · lanes: up unit + later unit with lessons → grey handoff FYI; later unit at 0 / retired → runout;
 *     waiting member → nothing; every unit closed → empty for the last live one
 *   · AB card: one letter at 0, other open → named by the live letter; both at 0 → empty
 *   · daily tracking / paused / unstamped → nothing; a real subject with no list → nolist (red)
 *   · stamped but not plan-backed → counted from done-by-id, "~" estimate; cbRemainingContent never called
 *   · the projection runs only for candidates; {err} falls back to the dealt dates; memo honours the key
 *   · strip HTML: no items → "" (rmStripHTML byte-identical to before); rows open the Builder only
 *   · step 2 (2026-10-25): a fixed-date class ends on its real class dates — never a pace estimate, never the
 *     projection; "no class dates left" / "only N class dates" when the dates can't hold the lessons
 *   · step 2: 🏡 Family-time items with a lesson track → the same rows, owner "_family", in every member kid's
 *     strip, opening the block's sheet; a date only when the calendar holds every remaining sitting/week
 *   · ZERO Firebase writes anywhere; no kid names / Howe subject keys in the block
 *
 *   run:  node test_rmx_derive.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }

const a = src.indexOf("// RMX_START"), z = src.indexOf("// RMX_END");
ok("RMX block present, after ROADMAP_END", a > 0 && z > a && src.indexOf("// ROADMAP_END") < a);
const block = src.slice(a, z);
const ra = src.indexOf("// ROADMAP_START"), rz = src.indexOf("// ROADMAP_END");
const rblock = src.slice(ra, rz);

console.log("\n# block hygiene");
const code = block.split("\n").filter(l => !/^\s*\/\//.test(l)).map(l => l.replace(/\s+\/\/ .*$/, "")).join("\n");   // comments may cite the live incident; code may not name a kid or a book
ok("no kid names / Howe subject keys in the code (comments excepted)", !/lincoln|ellis|lucy|julian|eggspress|hwt|singapore|read_detect/i.test(code));
ok("no Firebase writes in the block", !/db\.ref|\.set\(|\.update\(|\.remove\(|rmWrite\(/.test(block));
ok("never cbRemainingContent (it writes cbBacklogStash), never ceQuickPause", /Never cbRemainingContent/.test(block) && !/cbRemainingContent\(|ceQuickPause/.test(block));
ok("rmStripHTML hooks the group guarded by typeof (test_roadmap's vm has no RMX)", /if\(typeof rmxStripHTML==="function"\)\{ try\{ h\+=rmxStripHTML\(kid\); \}catch\(e\)\{\} \}/.test(rblock));
ok("hook sits between the strip header and the inline form", rblock.indexOf('rmxStripHTML(kid)') > rblock.indexOf("➕ Add") && rblock.indexOf('rmxStripHTML(kid)') < rblock.indexOf("if(rmEdit&&rmEdit.kid===kid&&!rmEdit.id) h+=rmFormHTML(kid)"));

// ── context: the real helpers' shapes, stubbed ──
const writes = [], opened = []; let projCalls = [], famCalls = [];
const db = { ref(p) { return { set(v) { writes.push({ op: "set", path: p, val: v }); }, update(v) { writes.push({ op: "update", path: p, val: v }); }, remove() { writes.push({ op: "remove", path: p }); } }; } };
function gwParseDate(iso) { const m = iso.split("-"); return new Date(+m[0], +m[1] - 1, +m[2]); }
function _cbISO(d) { const p = n => String(n).padStart(2, "0"); return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); }
const TODAY = "2026-10-24";   // a Saturday
const ctx = {
  console, Date, JSON, Math, Object, Array, String, parseInt, isFinite, window: {}, db,
  gwParseDate, _cbISO, _todayStr: () => TODAY,
  esc: s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
  cap: s => s.charAt(0).toUpperCase() + s.slice(1),
  currData: { subjects: {}, done: {}, lanes: {}, lastEdit: 0 }, rulesData: null, checked: {}, _dryRun: () => false,
  proj: {}, dealt: {},
  // the real lane / lesson-id helpers, in miniature
  lidStamped(kid, sk) { const s = ctx.currData.subjects[kid][sk]; return !!(s && s.doneImportedAt && Array.isArray(s.lessonIds) && Array.isArray(s.lessonSeq) && s.lessonIds.length === s.lessonSeq.length); },
  lidDoneIdx(kid, sk) { if (!ctx.lidStamped(kid, sk)) return null; const s = ctx.currData.subjects[kid][sk]; const node = ((ctx.currData.done[kid] || {})[sk]) || {}; const out = new Set(); s.lessonIds.forEach((id, i) => { if (node[id]) out.add(i); }); return out; },
  planBacked(kid, sk) { const s = ctx.currData.subjects[kid][sk]; return !!(s && s.planId && ctx.lidStamped(kid, sk)); },
  lnOpenCount(kid, sk) { const s = ctx.currData.subjects[kid][sk]; if (!s || s.paused) return 0; if (!ctx.planBacked(kid, sk)) return 0; return Math.max(0, s.lessonSeq.length - ctx.lidDoneIdx(kid, sk).size); },
  lnLanes(kid) { return ctx.currData.lanes[kid] || {}; },
  lnUnits(kid, id) { return ((ctx.lnLanes(kid)[id] || {}).units) || []; },
  lnUnitSubs(u) { if (!u) return []; if (u.subs) return u.subs.map(String); return u.sk ? [String(u.sk)] : []; },
  lnUnitOpen(kid, u) { if (u && u.retired) return false; return ctx.lnUnitSubs(u).some(x => ctx.lnOpenCount(kid, x) > 0); },
  lnUp(kid, id) { const us = ctx.lnUnits(kid, id); for (let i = 0; i < us.length; i++) if (ctx.lnUnitOpen(kid, us[i])) return i; return -1; },
  lnRhythm(kid, id, idx) { const u = ctx.lnUnits(kid, id)[idx]; return u && u.rhythmStub ? u.rhythmStub : { tpw: 2, allowedDays: ["Tue", "Thu"] }; },
  cbDefaultForm(kid, sk) { const s = ctx.currData.subjects[kid][sk] || {}; return { tpw: s.timesPerWeek || 3, allowedDays: (s.allowedDays || []).slice() }; },
  gvDerivedColumn(kid, sk) { projCalls.push(sk); const p = ctx.proj[sk]; return p === undefined ? null : p; },
  gvFilled: v => !!(v && v !== "—" && v !== "nan" && String(v).trim()),
  gvDealtDates(kid, sk) { return ctx.dealt[sk] || {}; },
  cbRemainingContent() { throw new Error("cbRemainingContent must never be called — it writes cbBacklogStash"); },
  ceQuickPause() { throw new Error("never"); },
  ceOpenEdit(kid, sk) { opened.push(kid + "/" + sk); },
  // step 2: fixed-date classes + 🏡 Family time, in miniature
  fxIsClass(s) { return !!(s && s.fixedTime); },
  fxDateList(s) { return (s && Array.isArray(s.fixedDates) && s.fixedDates.length) ? s.fixedDates : null; },
  famProgress: {}, famBlocks: {}, famMaps: {},
  famDefs() { return ctx.famBlocks; },
  famList(v) { return Array.isArray(v) ? v.filter(Boolean) : (v ? Object.keys(v).map(k => v[k]) : []); },
  famTrack(it) { return (it && it.track && (it.track.mode === "week" || it.track.mode === "seq")) ? it.track : null; },
  famLessonMap(b, id, it) { famCalls.push(id + "/" + it.key); return ctx.famMaps[it.key] || { byDate: {}, ends: null, now: "", none: true }; },
  famSheetOpen(id) { opened.push("fam:" + id); },
};
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(block, ctx);
const T = name => vm.runInContext(name, ctx);
const K = "kidx";
function sub(n, o) { const seq = [], ids = []; for (let i = 1; i <= n; i++) { seq.push("Lesson " + i); ids.push("L" + String(i).padStart(4, "0")); } return Object.assign({ display: "Sub", lessonSeq: seq, lessonIds: ids, doneImportedAt: "2026-09-01", planId: "p1", timesPerWeek: 2, allowedDays: ["Tue", "Thu"] }, o || {}); }
function doneN(sk, n, day) { const node = {}; for (let i = 1; i <= n; i++) node["L" + String(i).padStart(4, "0")] = { day: day || "2026-10-01", ts: (day || "2026-10-01") + "T10:00:00Z", src: "manual" }; (ctx.currData.done[K] = ctx.currData.done[K] || {})[sk] = node; }
let edit = 0;
function reset(subjects, lanes) { ctx.currData = { subjects: { [K]: subjects || {} }, done: {}, lanes: { [K]: lanes || {} }, lastEdit: ++edit }; ctx.proj = {}; ctx.dealt = {}; projCalls = []; famCalls = []; ctx.rulesData = null; ctx.famBlocks = {}; ctx.famMaps = {}; ctx.famProgress = {}; }
function derive() { return T("rmxDerive")(K); }
function plus(n) { const d = gwParseDate(TODAY); d.setDate(d.getDate() + n); return _cbISO(d); }
function projTo(iso) { const bd = {}; bd[iso] = { text: "Lesson", src: "plan" }; bd[plus(1)] = { text: "Lesson", src: "plan" }; return { byDate: bd, stats: null, warnings: [] }; }

console.log("\n# rmxCfg — her starting values, layering, clamping");
{
  reset({});
  const d = T("RMX_DEFAULTS");
  ok("defaults: warn 3 weeks, red at 5 left or 7 days, book endings 2 weeks (strip only)", d.warnWeeks === 3 && d.redLeft === 5 && d.redDays === 7 && d.warnLeft === 0 && d.endWeeks === 2 && d.endOnDay === false && d.on === true, d);
  ok("every kind on, family on, noteDays 0, autoDone on", d.kinds.runout && d.kinds.empty && d.kinds.handoff && d.kinds.nolist && d.family === true && d.noteDays === 0 && d.autoDone === true);
  ok("no headsUp node → exactly RMX_DEFAULTS", JSON.stringify(T("rmxCfg")(K, "x")) === JSON.stringify(d));
  ok("rulesData null → defaults too", (ctx.rulesData = null, JSON.stringify(T("rmxCfg")()) === JSON.stringify(d)));
  ctx.rulesData = { headsUp: { warnWeeks: 4, kinds: { handoff: false }, kid: { [K]: { redLeft: 2, kinds: { nolist: false } } }, subj: { [K]: { x: { off: true, warnWeeks: 6 } } } } };
  const fam = T("rmxCfg")("other", "y"), kidc = T("rmxCfg")(K, "y"), subc = T("rmxCfg")(K, "x");
  ok("family layer: warnWeeks 4, handoff off, rest default", fam.warnWeeks === 4 && fam.kinds.handoff === false && fam.redLeft === 5 && fam.kinds.nolist === true, fam);
  ok("kid layer over family: redLeft 2, nolist off, warnWeeks still 4", kidc.redLeft === 2 && kidc.kinds.nolist === false && kidc.warnWeeks === 4, kidc);
  ok("subject layer over kid: off → on:false, warnWeeks 6, redLeft 2 kept", subc.on === false && subc.warnWeeks === 6 && subc.redLeft === 2, subc);
  ctx.rulesData = { headsUp: { warnWeeks: 99, redDays: 0, redLeft: "abc", endWeeks: -3, on: "false", autoDone: "junk", kinds: "nope" } };
  const cl = T("rmxCfg")(K, "x");
  ok("clamps: warnWeeks 8, redDays 1, endWeeks 0; junk → default; 'false' string → false; junk bool → default", cl.warnWeeks === 8 && cl.redDays === 1 && cl.redLeft === 5 && cl.endWeeks === 0 && cl.on === false && cl.autoDone === true && cl.kinds.runout === true, cl);
  ok("a changed setting changes the memo key", (ctx.rulesData = null, T("_rmxMemoKey")()) !== (ctx.rulesData = { headsUp: { warnWeeks: 4 } }, T("_rmxMemoKey")()));
  ctx.rulesData = null;
}

console.log("\n# dates");
{
  reset({});
  ok("inside a week → weekday + date; after → month day", T("rmxDateTxt")("2026-10-26") === "Mon Oct 26" && T("rmxDateTxt")("2026-11-05") === "Nov 5" && T("rmxDateTxt")("2027-01-04") === "Jan 4 2027", [T("rmxDateTxt")("2026-10-26"), T("rmxDateTxt")("2026-11-05")]);
  ok("estimate: 4 left, Tue/Thu 2×/wk from Sat Oct 24 → Nov 5", T("_rmxEstimate")(4, { tpw: 2, days: ["Tue", "Thu"] }) === "2026-11-05", T("_rmxEstimate")(4, { tpw: 2, days: ["Tue", "Thu"] }));
  ok("estimate: 1 left, Mon–Fri 5×/wk → Mon Oct 26; 0 left → null", T("_rmxEstimate")(1, { tpw: 5, days: ["Mon", "Tue", "Wed", "Thu", "Fri"] }) === "2026-10-26" && T("_rmxEstimate")(0, { tpw: 2, days: ["Tue"] }) === null);
  ok("estimate: tpw caps the week (3×/wk over 5 days: 7 left → Mon 26/Tue/Wed, Nov 2/3/4, Mon Nov 9)", T("_rmxEstimate")(7, { tpw: 3, days: ["Mon", "Tue", "Wed", "Thu", "Fri"] }) === "2026-11-09", T("_rmxEstimate")(7, { tpw: 3, days: ["Mon", "Tue", "Wed", "Thu", "Fri"] }));
}

console.log("\n# runout — red by lessons or by date, amber by date, else nothing");
{
  reset({ s1: sub(10, { display: "Book One" }) }); doneN("s1", 5); ctx.proj.s1 = projTo(plus(30));
  let it = derive();
  ok("5 left, ends in 30 days → red by lessons (her rule: red at 5 left)", it.length === 1 && it[0].type === "runout" && it[0].level === "red" && it[0].left === 5, it);
  ok("text names the book, the count, the date", it[0].text === "Book One runs out · 5 left · Nov 23", it[0].text);
  reset({ s1: sub(10, { display: "Book One" }) }); doneN("s1", 4); ctx.proj.s1 = projTo(plus(20));
  it = derive();
  ok("6 left, ends in 20 days → amber (within 3 weeks)", it.length === 1 && it[0].level === "amber" && it[0].left === 6, it);
  reset({ s1: sub(10, { display: "Book One" }) }); doneN("s1", 4); ctx.proj.s1 = projTo(plus(22));
  ok("6 left, ends in 22 days → nothing (past the 3-week warn)", derive().length === 0, derive());
  reset({ s1: sub(10, { display: "Book One" }) }); doneN("s1", 4); ctx.proj.s1 = projTo(plus(7));
  it = derive();
  ok("6 left, ends in 7 days → red by date (the last week)", it.length === 1 && it[0].level === "red", it);
  reset({ s1: sub(10, { display: "Book One" }) }); doneN("s1", 4); ctx.proj.s1 = projTo(plus(2));
  ok("date inside the week reads 'Mon Oct 26'", /· Mon Oct 26$/.test(derive()[0].text), derive()[0].text);
  reset({ s1: sub(10, { display: "Book One" }) }); doneN("s1", 4); ctx.proj.s1 = projTo(plus(30)); ctx.rulesData = { headsUp: { warnLeft: 6 } };
  ok("warnLeft 6 → 6 left is amber even 30 days out", derive()[0] && derive()[0].level === "amber", derive());
  reset({ s1: sub(10, { display: "Book One" }) }); doneN("s1", 4); ctx.proj.s1 = projTo(plus(20)); ctx.rulesData = { headsUp: { warnWeeks: 2 } };
  ok("warnWeeks 2 → 20 days out is nothing", derive().length === 0, derive());
  reset({ s1: sub(10, { display: "Book One" }) }); doneN("s1", 5); ctx.proj.s1 = projTo(plus(30)); ctx.rulesData = { headsUp: { redLeft: 3 } };
  ok("redLeft 3 → 5 left, 30 days out is nothing", derive().length === 0, derive());
  reset({ s1: sub(10, { display: "Book One" }) }); doneN("s1", 5); ctx.proj.s1 = projTo(plus(3)); ctx.rulesData = { headsUp: { kinds: { runout: false } } };
  ok("kinds.runout off → nothing", derive().length === 0);
  reset({ s1: sub(10, { display: "Book One" }) }); doneN("s1", 5); ctx.proj.s1 = projTo(plus(3)); ctx.rulesData = { headsUp: { kid: { [K]: { on: false } } } };
  ok("kid on:false → nothing for that kid", derive().length === 0);
  reset({ s1: sub(10, { display: "Book One" }) }); doneN("s1", 5); ctx.proj.s1 = projTo(plus(3)); ctx.rulesData = { headsUp: { subj: { [K]: { s1: { off: true } } } } };
  ok("subject off → nothing for that subject", derive().length === 0);
}

console.log("\n# candidates only get the projection; fallbacks");
{
  reset({ big: sub(60, { display: "Long Book" }) }); doneN("big", 10);
  ok("50 left at 2×/wk → not a candidate: nothing, and gvDerivedColumn never called", derive().length === 0 && projCalls.length === 0, projCalls);
  reset({ s1: sub(10, { display: "Book One" }) }); doneN("s1", 4); ctx.proj.s1 = projTo(plus(10));
  derive();
  ok("6 left → candidate: projection called once", projCalls.join() === "s1", projCalls);
  reset({ np: sub(10, { display: "Pages Book", planId: null }) }); doneN("np", 6);
  let it = derive();
  ok("stamped, not plan-backed: counted from done-by-id (4 left), '~' estimate from its own Tue/Thu pace → ~Nov 5, red", it.length === 1 && it[0].left === 4 && it[0].est === true && it[0].text === "Pages Book runs out · 4 left · ~Nov 5", it);
  ok("…and cbRemainingContent was never called (its stub throws)", it.length === 1);
  reset({ s1: sub(10, { display: "Book One" }) }); doneN("s1", 6); ctx.proj.s1 = { err: "every remaining lesson is already on a card", byDate: {} }; ctx.dealt.s1 = { [plus(1)]: { text: "L7" }, [plus(3)]: { text: "L8" } };
  it = derive();
  ok("{err} → latest dealt date, not an estimate", it.length === 1 && it[0].date === plus(3) && it[0].est === false, it);
  reset({ s1: sub(10, { display: "Book One" }) }); doneN("s1", 6); ctx.proj.s1 = null;
  it = derive();
  ok("projection null → estimate with '~'", it.length === 1 && it[0].est === true && /~/.test(it[0].text), it);
  reset({ s1: sub(10, { display: "Book One" }) }); doneN("s1", 6); ctx.proj.s1 = { byDate: { [plus(2)]: { text: "" }, [plus(5)]: { text: "—" }, [plus(1)]: { text: "L7" } } };
  ok("only filled cells count as the last day", derive()[0].date === plus(1), derive()[0]);
}

console.log("\n# empty — a live list at 0 stays red");
{
  reset({ s1: sub(26, { display: "Reading Program" }) }); doneN("s1", 26, "2026-10-14");
  let it = derive();
  ok("listed, 0 open, no later unit → red 'list is empty … since Oct 14'", it.length === 1 && it[0].type === "empty" && it[0].level === "red" && it[0].text === "Reading Program list is empty — nothing on Kidx's schedule for it since Oct 14", it);
  ok("no projection needed for empty", projCalls.length === 0);
  reset({ s1: sub(26, { display: "Reading Program" }) }); doneN("s1", 26, "2026-08-01");
  ok("still red 84 days later (no fade — her rule)", derive()[0].level === "red" && /since Aug 1/.test(derive()[0].text));
  reset({ s1: sub(26, { display: "Reading Program", paused: true, pausedSince: "2026-10-20" }) }); doneN("s1", 26, "2026-10-14");
  ok("paused → nothing (⏸ is the one-tap 'this book is done')", derive().length === 0);
  reset({ s1: sub(26, { display: "Reading Program" }) }); doneN("s1", 26, "2026-10-14"); ctx.rulesData = { headsUp: { kinds: { empty: false } } };
  ok("kinds.empty off → nothing", derive().length === 0);
  reset({ s1: sub(3, { display: "Fresh" }) });
  const n = derive();
  ok("done node missing entirely → 3 left (not empty)", n.length === 1 && n[0].type === "runout" && n[0].left === 3, n);
}

console.log("\n# excluded: daily tracking, paused, unstamped, waiting; nolist");
{
  reset({ d: sub(0, { display: "Notebook", tracking: "daily", lessonSeq: [], lessonIds: [] }), p: sub(10, { display: "Paused Book", paused: true }), u: sub(10, { display: "Unstamped", doneImportedAt: null }) });
  ok("daily / paused / unstamped → nothing", derive().length === 0, derive());
  reset({ e: { display: "Empty Pause", paused: true, lessonSeq: [] } });
  ok("paused with no list → nothing", derive().length === 0);
  reset({ g: { display: "Gen Subject", lessonSeq: [], lessonIds: [] } });
  const it = derive();
  ok("a real subject with no lessons → red 'has no lessons yet'", it.length === 1 && it[0].type === "nolist" && it[0].level === "red" && it[0].text === "Gen Subject has no lessons yet", it);
  reset({ g: { display: "Gen Subject" } }); ctx.rulesData = { headsUp: { kinds: { nolist: false } } };
  ok("kinds.nolist off → nothing", derive().length === 0);
  reset({ u: sub(10, { display: "Unstamped", lessonIds: ["only-one"] }) });
  ok("ids/seq length mismatch (unstamped by lidsFor's rule) → nothing", derive().length === 0);
}

console.log("\n# lanes — handoff FYI vs runout; waiting; ran dry");
{
  const lane = { units: [{ sk: "a" }, { sk: "b" }] };
  reset({ a: sub(10, { display: "Book A" }), b: sub(20, { display: "Book B" }) }, { L1: lane }); doneN("a", 8); ctx.proj.a = projTo(plus(4));
  let it = derive();
  ok("up unit 2 left ends in 4 days, later unit has lessons → ONE grey handoff, not a runout", it.length === 1 && it[0].type === "handoff" && it[0].level === "grey" && it[0].text === "Book A ends Wed Oct 28 → Book B takes over", it);
  ok("the waiting member itself produces nothing", it.every(x => x.sk === "a"));
  ok("the lane's rhythm, not the subject's, paces the estimate (lnRhythm stub was offered)", projCalls.join() === "a");
  reset({ a: sub(10, { display: "Book A" }), b: sub(20, { display: "Book B" }) }, { L1: lane }); doneN("a", 8); ctx.proj.a = projTo(plus(20));
  ok("ends in 20 days with a next book → nothing (endWeeks 2 = 14 days)", derive().length === 0, derive());
  reset({ a: sub(10, { display: "Book A" }), b: sub(20, { display: "Book B" }) }, { L1: lane }); doneN("a", 8); ctx.proj.a = projTo(plus(4)); ctx.rulesData = { headsUp: { endWeeks: 0 } };
  ok("endWeeks 0 → never a handoff row", derive().length === 0);
  reset({ a: sub(10, { display: "Book A" }), b: sub(20, { display: "Book B" }) }, { L1: lane }); doneN("a", 8); ctx.proj.a = projTo(plus(4)); ctx.rulesData = { headsUp: { kinds: { handoff: false } } };
  ok("kinds.handoff off → nothing", derive().length === 0);
  reset({ a: sub(10, { display: "Book A" }), b: sub(20, { display: "Book B" }) }, { L1: lane }); doneN("a", 8); doneN("b", 20); ctx.proj.a = projTo(plus(4));
  it = derive();
  ok("later unit at 0 → the up unit is a red runout (nothing lined up)", it.length === 1 && it[0].type === "runout" && it[0].level === "red" && it[0].left === 2, it);
  reset({ a: sub(10, { display: "Book A" }), b: sub(20, { display: "Book B" }) }, { L1: { units: [{ sk: "a" }, { sk: "b", retired: true }] } }); doneN("a", 8); ctx.proj.a = projTo(plus(4));
  ok("later unit retired → runout", derive()[0] && derive()[0].type === "runout");
  reset({ a: sub(10, { display: "Book A" }), b: sub(20, { display: "Book B" }) }, { L1: lane }); doneN("a", 10, "2026-09-30"); doneN("b", 20, "2026-10-14");
  it = derive();
  ok("every unit closed → ONE empty for the last live unit, dated by its last done day", it.length === 1 && it[0].type === "empty" && it[0].sk === "b" && /since Oct 14/.test(it[0].text), it);
  reset({ a: sub(10, { display: "Book A" }), b: sub(20, { display: "Book B", paused: true }) }, { L1: lane }); doneN("a", 10, "2026-09-30");
  ok("every unit closed, last one paused → nothing (her choice)", derive().length === 0, derive());
  reset({ a: sub(10, { display: "Book A" }), b: sub(20, { display: "Book B" }) }, { L1: { units: [{ sk: "a" }, { sk: "b", retired: true }] } }); doneN("a", 10, "2026-09-30"); doneN("b", 20, "2026-10-14");
  it = derive();
  ok("every unit closed, last one retired → the one before it is the empty one", it.length === 1 && it[0].type === "empty" && it[0].sk === "a", it);
  reset({ a: sub(10, { display: "Book A" }), b: sub(20, { display: "Book B" }), ghost: undefined }, { L1: { units: [{ sk: "a" }, { sk: "ghost" }, { sk: "b" }] } }); doneN("a", 8); ctx.proj.a = projTo(plus(4));
  delete ctx.currData.subjects[K].ghost;
  ok("a lane member the kid doesn't have is ignored as absent", derive().length === 1 && derive()[0].next === "Book B", derive());
}

console.log("\n# AB card (multiple)");
{
  const lane = { units: [{ subs: ["x", "y"], pattern: "AB" }] };
  reset({ x: sub(10, { display: "Letter X" }), y: sub(40, { display: "Letter Y" }) }, { L2: lane }); doneN("x", 10, "2026-10-16"); doneN("y", 5);
  ok("one letter finished, the other has 35 → nothing (it closes ranks)", derive().length === 0, derive());
  reset({ x: sub(10, { display: "Letter X" }), y: sub(40, { display: "Letter Y" }) }, { L2: lane }); doneN("x", 10, "2026-10-16"); doneN("y", 37); ctx.proj.y = projTo(plus(5));
  let it = derive();
  ok("one letter finished, the other at 3 → runout named by the live letter only", it.length === 1 && it[0].type === "runout" && it[0].label === "Letter Y" && it[0].left === 3 && it[0].sk === "y", it);
  reset({ x: sub(10, { display: "Letter X" }), y: sub(40, { display: "Letter Y" }) }, { L2: lane }); doneN("x", 10, "2026-10-16"); doneN("y", 40, "2026-10-21");
  it = derive();
  ok("both letters at 0 → ONE empty naming both, since the later day", it.length === 1 && it[0].type === "empty" && it[0].label === "Letter X / Letter Y" && /since Oct 21/.test(it[0].text), it);
  reset({ x: sub(10, { display: "Letter X" }), y: sub(10, { display: "Letter Y" }) }, { L2: lane }); doneN("x", 8); doneN("y", 7); ctx.proj.x = projTo(plus(3)); ctx.proj.y = projTo(plus(6));
  it = derive();
  ok("both letters running out → one row, counts summed (5), latest end wins", it.length === 1 && it[0].left === 5 && it[0].date === plus(6) && it[0].label === "Letter X / Letter Y", it);
}

console.log("\n# order and memo");
{
  reset({ r: sub(10, { display: "Red Book" }), am: sub(10, { display: "Amber Book" }), e: sub(5, { display: "Empty Book" }) }, { L3: { units: [{ sk: "h" }, { sk: "h2" }] } });
  ctx.currData.subjects[K].h = sub(10, { display: "Handoff Book" }); ctx.currData.subjects[K].h2 = sub(10, { display: "Next Book" });
  doneN("r", 5); doneN("am", 4); doneN("e", 5, "2026-10-01"); doneN("h", 8);
  ctx.proj.r = projTo(plus(30)); ctx.proj.am = projTo(plus(20)); ctx.proj.h = projTo(plus(4));
  const it = derive();
  ok("four rows: reds first (empty by its old date, then runout), amber, grey", it.map(x => x.level).join() === "red,red,amber,grey" && it[0].type === "empty" && it[1].type === "runout" && it[3].type === "handoff", it.map(x => x.type + ":" + x.level + ":" + x.date));
  const calls = projCalls.length;
  derive(); derive();
  ok("memo: same key → the projection is not run again", projCalls.length === calls, [calls, projCalls.length]);
  ctx.currData.lastEdit = ++edit; derive();
  ok("memo: a curriculum edit changes the key → recomputed", projCalls.length > calls);
  const c2 = projCalls.length; ctx.rulesData = { headsUp: { warnWeeks: 5 } }; derive();
  ok("memo: a settings change changes the key → recomputed", projCalls.length > c2);
  ctx.rulesData = null;
  ok("rmxDerive never throws: a broken helper → [] (and the error is logged, not raised)", (() => { const keep = ctx.lnLanes; ctx.lnLanes = () => { throw new Error("boom"); }; ctx.currData.lastEdit = ++edit; const orig = console.error; console.error = () => {}; let r; try { r = derive(); } finally { console.error = orig; ctx.lnLanes = keep; } return Array.isArray(r) && r.length === 0; })());
}

console.log("\n# strip HTML");
{
  reset({ big: sub(60, { display: "Long Book" }) }); doneN("big", 10);
  ok("nothing to say → empty string (the strip is byte-identical to before)", T("rmxStripHTML")(K) === "");
  reset({ s1: sub(10, { display: "Book <One>" }) }); doneN("s1", 5); ctx.proj.s1 = projTo(plus(30));
  const h = T("rmxStripHTML")(K);
  ok("group heading + a red row with the escaped text", /From the curriculum/.test(h) && /\u{1F534}/u.test(h) && /Book &lt;One&gt; runs out · 5 left · Nov 23/.test(h), h);
  ok("row opens the Builder (rmxOpen → ceOpenEdit), nothing else", /onclick="rmxOpen\('kidx','s1'\)"/.test(h) && !/rmDone|rmEdit|ceQuickPause|rmWrite/.test(h));
  T("rmxOpen")(K, "s1");
  ok("rmxOpen calls ceOpenEdit(kid, sk)", opened.join() === "kidx/s1", opened);
  reset({ a: sub(10, { display: "Book A" }), b: sub(20, { display: "Book B" }) }, { L1: { units: [{ sk: "a" }, { sk: "b" }] } }); doneN("a", 8); ctx.proj.a = projTo(plus(4));
  ok("a handoff row is grey (⚪) and regular weight", /⚪/.test(T("rmxStripHTML")(K)) && /font-weight:500/.test(T("rmxStripHTML")(K)));
}

console.log("\n# fixed-date classes — real dates, never a pace estimate");
{
  const cls = o => sub(4, Object.assign({ display: "Voice Class", fixedTime: "3:00 PM", allowedDays: ["Fri"], timesPerWeek: 1 }, o || {}));
  const term = (fd, o) => sub(8, Object.assign({ display: "Term Class", fixedTime: "3:00 PM", fixedDates: fd }, o || {}));
  reset({ c: cls({ fixedDates: ["2026-10-02", "2026-10-09", "2026-10-16", "2026-10-23"] }) }); doneN("c", 3);
  let it = derive();
  ok("1 left, all four dates past → red 'no class dates left', no date, projection never called", it.length === 1 && it[0].level === "red" && it[0].fixed === true && it[0].date === null && it[0].text === "Voice Class · 1 left · no class dates left" && projCalls.length === 0, it);
  ok("…and no '~' estimate in the text", !/~/.test(it[0].text));
  reset({ c: cls({ fixedDates: ["2026-10-23", "2026-10-30", "2026-11-06"] }) }); doneN("c", 3);
  it = derive();
  ok("1 left, 2 upcoming dates → ends on the first upcoming (Fri Oct 30), red by lessons", it.length === 1 && it[0].date === "2026-10-30" && it[0].text === "Voice Class runs out · 1 left · Fri Oct 30", it);
  reset({ c: cls({ fixedDates: ["2026-10-30", "2026-11-06"] }) }); doneN("c", 1);
  it = derive();
  ok("3 left, only 2 dates → red 'only 2 class dates', dated by the last", it.length === 1 && it[0].level === "red" && it[0].date === "2026-11-06" && it[0].text === "Voice Class runs out · 3 left · only 2 class dates (Nov 6)", it);
  reset({ c: term([plus(5), plus(12), plus(19), plus(26), plus(33), plus(40), plus(47), plus(54)]) }); doneN("c", 2);
  ok("6 left, 8 dates → ends on the 6th date (40 days out) → nothing yet; projection never called", derive().length === 0 && projCalls.length === 0, derive());
  reset({ c: term([plus(5), plus(12), plus(19), plus(26), plus(33), plus(40), plus(47), plus(54)]) }); doneN("c", 5);
  it = derive();
  ok("3 left, 8 dates → ends on the 3rd date (19 days), red by lessons", it.length === 1 && it[0].date === plus(19) && it[0].level === "red" && it[0].fixed === true, it);
  reset({ c: term([plus(5), plus(8), plus(12), plus(15), plus(19), plus(22), plus(47), plus(54)]) }); doneN("c", 2);
  ok("6 left, 6th date in 22 days → nothing", derive().length === 0, derive());
  reset({ c: term([plus(5), plus(8), plus(12), plus(15), plus(19), plus(20), plus(47), plus(54)]) }); doneN("c", 2);
  it = derive();
  ok("6 left, 6th date in 20 days → amber (within 3 weeks)", it.length === 1 && it[0].level === "amber" && it[0].date === plus(20), it);
  reset({ c: term([plus(1), plus(3), plus(5), plus(8), plus(10), plus(12), plus(47), plus(54)]) }); doneN("c", 2);
  ok("6 left, 6th date in 12 days → still amber by date (red needs ≤ 7 days or ≤ 5 left)", derive()[0] && derive()[0].level === "amber");
  reset({ c: cls({ fixedDates: ["2026-10-02"] }) }); doneN("c", 4, "2026-10-23");
  it = derive();
  ok("a class at 0 → the same red 'list is empty' row as a book", it.length === 1 && it[0].type === "empty" && /since Oct 23/.test(it[0].text), it);
  reset({ c: sub(4, { display: "Weekly Class", fixedTime: "3:00 PM", allowedDays: ["Fri"], timesPerWeek: 1 }) }); doneN("c", 3); ctx.proj.c = projTo(plus(6));
  it = derive();
  ok("a fixed-TIME class with no date list is paced like a book (projection asked)", it.length === 1 && it[0].fixed === false && it[0].date === plus(6) && projCalls.join() === "c", it);
  reset({ a: cls({ fixedDates: [plus(3)] }), b: sub(20, { display: "Book B" }) }, { L1: { units: [{ sk: "a" }, { sk: "b" }] } }); doneN("a", 3);
  it = derive();
  ok("a class up in a lane with a next book → grey handoff dated by its class date", it.length === 1 && it[0].type === "handoff" && it[0].date === plus(3), it);
}

console.log("\n# 🏡 Family time — tracked items, member kids' strips");
{
  const fam = T("rmxFamilyItems");
  function famSetup(items, maps, blockExtra) { ctx.famBlocks = { sci: Object.assign({ name: "Science", kids: [K, "kidy"], items: items }, blockExtra || {}) }; ctx.famMaps = maps; ctx.currData.lastEdit = ++edit; }
  const seqItem = { key: "space", name: "Space Science", track: { mode: "seq", list: [] } };
  const bd = n => { const o = {}; for (let i = 1; i <= n; i++) o[plus(i * 2)] = "Sitting " + i; return o; };
  const M3 = () => ({ space: { byDate: bd(3), ends: plus(6), left: 3, total: 40 } });
  reset({}); famSetup([seqItem], M3());
  let it = fam();
  ok("seq item 3 left, 3 future sittings on the calendar → red runout dated by the last sitting, 🏡 label", it.length === 1 && it[0].type === "runout" && it[0].level === "red" && it[0].kid === "_family" && it[0].fam === "sci" && it[0].date === plus(6) && it[0].text === "🏡 Science · Space Science runs out · 3 left · " + T("rmxDateTxt")(plus(6)), it);
  ok("…kids = the block's members", it[0].kids.join() === K + ",kidy", it[0].kids);
  reset({}); famSetup([seqItem], { space: { byDate: bd(2), ends: plus(4), left: 3, total: 40 } });
  it = fam();
  ok("future sittings fewer than left → no date (calendar not built that far), count rule only", it.length === 1 && it[0].date === null && it[0].text === "🏡 Science · Space Science runs out · 3 left", it);
  reset({}); famSetup([seqItem], { space: { byDate: bd(12), ends: plus(24), left: 12, total: 40 } });
  ok("12 left ending in 24 days → nothing", fam().length === 0, fam());
  reset({}); famSetup([seqItem], { space: { byDate: bd(8), ends: plus(16), left: 8, total: 40 } });
  ok("8 left ending in 16 days → amber", fam()[0] && fam()[0].level === "amber", fam());
  reset({}); famSetup([seqItem], { space: { byDate: { "2026-10-20": "L9", "2026-10-22": "L10" }, ends: "2026-10-22", left: 0, total: 10 } });
  it = fam();
  ok("0 left → red empty since the latest past day", it.length === 1 && it[0].type === "empty" && it[0].text === "🏡 Science · Space Science list is empty — nothing on the family schedule for it since Oct 22", it);
  const wk = { key: "hist", name: "History", track: { mode: "week", total: 36 } };
  const wbd = {}; [1, 2, 3, 8, 9, 10].forEach(i => { wbd[plus(i)] = "Wk"; });   // two calendar weeks' worth of days
  reset({}); famSetup([wk], { hist: { byDate: wbd, ends: plus(10), left: 2, total: 36 } });
  it = fam();
  ok("week mode: 2 weeks left, both on the calendar → '2 weeks left', dated", it.length === 1 && it[0].text === "🏡 Science · History runs out · 2 weeks left · " + T("rmxDateTxt")(plus(10)), it);
  reset({}); famSetup([wk], { hist: { byDate: wbd, ends: plus(10), left: 4, total: 36 } });
  ok("week mode: 4 weeks left but only 2 on the calendar → no date", fam()[0] && fam()[0].date === null, fam());
  reset({}); famSetup([wk], { hist: { byDate: wbd, ends: plus(10), left: null, total: 0 } });
  ok("week mode without a total (left null) → nothing", fam().length === 0);
  reset({}); famSetup([{ key: "ra", name: "Read Aloud" }], { ra: { byDate: {}, ends: null, now: "", none: true } });
  ok("item without a track → nothing (famLessonMap not even asked)", fam().length === 0 && famCalls.length === 0, famCalls);
  reset({}); famSetup([seqItem], M3(), { off: true });
  ok("block off → nothing", fam().length === 0);
  reset({}); famSetup([seqItem], M3()); ctx.rulesData = { headsUp: { family: false } };
  ok("family switch off → nothing", fam().length === 0);
  reset({}); famSetup([seqItem], M3()); ctx.rulesData = { headsUp: { subj: { _family: { space: { off: true } } } } };
  ok("subj/_family/<key>/off → nothing", fam().length === 0);
  reset({}); famSetup([seqItem], M3()); ctx.rulesData = { headsUp: { kinds: { runout: false } } };
  ok("kinds.runout off → nothing", fam().length === 0);
  reset({}); famSetup([seqItem], M3()); ctx.rulesData = { headsUp: { kid: { [K]: { on: false } } } };
  ok("a kid's own switch does not touch family rows", fam().length === 1);
  // strips
  reset({ big: sub(60, { display: "Long Book" }) }); doneN("big", 10); famSetup([seqItem], M3());
  const h = T("rmxStripHTML")(K);
  ok("member kid's strip carries the 🏡 row (own rows empty), opening the block sheet", /From the curriculum/.test(h) && /🏡 Science · Space Science runs out/.test(h) && /onclick="rmxOpen\('_family','space','sci'\)"/.test(h) && !/in the Builder/.test(h), h);
  ok("a kid not in the block sees nothing", T("rmxStripHTML")("kidz") === "");
  ok("item kids narrow the block: only kidy", (() => { ctx.famBlocks.sci.items = [Object.assign({}, seqItem, { kids: ["kidy"] })]; ctx.currData.lastEdit = ++edit; return T("rmxStripHTML")(K) === "" && /Space Science/.test(T("rmxStripHTML")("kidy")); })());
  reset({ s1: sub(10, { display: "Book One" }) }); doneN("s1", 5); ctx.proj.s1 = projTo(plus(30)); famSetup([seqItem], M3());
  const h2 = T("rmxStripHTML")(K);
  ok("own rows first, then the 🏡 row; kid rows still open the Builder with two args", h2.indexOf("Book One runs out") < h2.indexOf("🏡 Science") && /onclick="rmxOpen\('kidx','s1'\)"/.test(h2), h2);
  T("rmxOpen")("_family", "space", "sci");
  ok("rmxOpen with a block id → famSheetOpen(id), not ceOpenEdit", opened[opened.length - 1] === "fam:sci", opened);
  reset({}); famSetup([seqItem], M3()); fam(); const n = famCalls.length; fam();
  ok("memo: same key → famLessonMap not asked again", famCalls.length === n && n === 1, [n, famCalls.length]);
  ctx.famProgress = { sci: { space: { done: 38 } } }; fam();
  ok("memo: a family check-off (famProgress) changes the key → recomputed", famCalls.length > n);
  ctx.famProgress = {};
  ok("a broken famLessonMap → [] (logged, not raised)", (() => { const keep = ctx.famLessonMap; ctx.famLessonMap = () => { throw new Error("boom"); }; ctx.currData.lastEdit = ++edit; let r; try { r = fam(); } finally { ctx.famLessonMap = keep; } return Array.isArray(r) && r.length === 0; })());
}

console.log("\n# writes");
ok("ZERO Firebase writes across every derive and render", writes.length === 0, writes);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
