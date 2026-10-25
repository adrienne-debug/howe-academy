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
const writes = [], opened = []; let projCalls = [];
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
};
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(block, ctx);
const T = name => vm.runInContext(name, ctx);
const K = "kidx";
function sub(n, o) { const seq = [], ids = []; for (let i = 1; i <= n; i++) { seq.push("Lesson " + i); ids.push("L" + String(i).padStart(4, "0")); } return Object.assign({ display: "Sub", lessonSeq: seq, lessonIds: ids, doneImportedAt: "2026-09-01", planId: "p1", timesPerWeek: 2, allowedDays: ["Tue", "Thu"] }, o || {}); }
function doneN(sk, n, day) { const node = {}; for (let i = 1; i <= n; i++) node["L" + String(i).padStart(4, "0")] = { day: day || "2026-10-01", ts: (day || "2026-10-01") + "T10:00:00Z", src: "manual" }; (ctx.currData.done[K] = ctx.currData.done[K] || {})[sk] = node; }
let edit = 0;
function reset(subjects, lanes) { ctx.currData = { subjects: { [K]: subjects || {} }, done: {}, lanes: { [K]: lanes || {} }, lastEdit: ++edit }; ctx.proj = {}; ctx.dealt = {}; projCalls = []; ctx.rulesData = null; }
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

console.log("\n# writes");
ok("ZERO Firebase writes across every derive and render", writes.length === 0, writes);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
