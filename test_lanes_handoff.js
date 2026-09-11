/*
 * Node tests for 🛤 LANES, Stage 5 — same-week handoff.
 * When a done record finishes a lane unit, the finished member and then each member of the
 * unit now up are re-projected for the active week (one targeted diff each). Runs the real
 * LANE + LANE_HANDOFF blocks with reprojectSubjectWeek stubbed to record its calls.
 *   run:  node test_lanes_handoff.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function block(a, b) { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); }
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); } }
const eq = (x, y) => JSON.stringify(x) === JSON.stringify(y);
function subj(display, n, extra) { const seq = Array.from({ length: n }, (_, i) => display + " L" + (i + 1)); return Object.assign({ display, lessonSeq: seq, lessonIds: seq.map((_, i) => "L" + String(i + 1).padStart(4, "0")), doneImportedAt: 1, planId: "kid__" + display, allowedDays: ["Mon"], timesPerWeek: 1, pacing: { mode: "timesPerWeek", tpw: 1 } }, extra || {}); }
const doneN = n => { const o = {}; for (let i = 0; i < n; i++) o["L" + String(i + 1).padStart(4, "0")] = { ts: 1, day: "2026-09-01" }; return o; };
function world(done, lanes) {
  const subjects = { s3b: subj("3B", 2), s4a: subj("4A", 3), s4b: subj("4B", 3), geo: subj("Geo", 2), sci: subj("Sci", 2) };
  const calls = [], toasts = [];
  const ctx = { console, Object, Array, String, Number, Math, JSON, Set, parseInt, Date, calls, toasts,
    currData: { subjects: { kid: subjects }, done: { kid: done || {} }, lanes: lanes ? { kid: lanes } : undefined },
    reprojectSubjectWeek: (k, sk, why) => { calls.push([k, sk, why]); return { added: [] }; }, gwShowToast: m => toasts.push(m), dbg: () => {},
    cbDefaultForm: (k, sk) => ({ mode: "timesPerWeek", tpw: 1, targetDate: "", allowedDays: ["Mon"] }) };
  ctx.lidsFor = (k, sk) => (subjects[sk] || {}).lessonIds || null;
  ctx.lidStamped = (k, sk) => !!(subjects[sk] && subjects[sk].doneImportedAt);
  ctx.planBacked = (k, sk) => !!(subjects[sk] && subjects[sk].planId);
  ctx.lidDoneIdx = (k, sk) => { const d = new Set(Object.keys((done || {})[sk] || {})); const out = new Set(); (subjects[sk].lessonIds || []).forEach((id, i) => { if (d.has(id)) out.add(i); }); return out; };
  vm.createContext(ctx); vm.runInContext(block("// LANE_START", "// LANE_END") + "\n" + block("// LANE_HANDOFF_START", "// LANE_HANDOFF_END"), ctx);
  return ctx;
}
const MATH = { math: { name: "Math", units: [{ sk: "s3b" }, { sk: "s4a", rhythm: "prior" }, { sk: "s4b", rhythm: "prior" }] } };
console.log("── lnHandoff ──");
{
  const c = world({}, null);
  ok("no lane → null, no re-project, no toast", c.lnHandoff("kid", "s3b", "check") === null && c.calls.length === 0 && c.toasts.length === 0);
  const c2 = world({ s3b: doneN(1) }, MATH);
  ok("unit still open (1 of 2 done) → nothing", c2.lnHandoff("kid", "s3b", "check") === null && c2.calls.length === 0);
  const c3 = world({ s3b: doneN(2) }, MATH);
  const r = c3.lnHandoff("kid", "s3b", "check");
  ok("3B finished → re-project 3B first, then 4A (the unit now up), not 4B", eq(c3.calls.map(x => x[1]), ["s3b", "s4a"]) && eq(r, { finished: "s3b", next: ["s4a"] }), c3.calls);
  ok("why is tagged as a handoff", c3.calls.every(x => x[2] === "check:handoff"));
  ok("toast names who takes over", c3.toasts.length === 1 && /3B is finished — 4A takes its place/.test(c3.toasts[0]), c3.toasts);
  const c4 = world({ s3b: doneN(2), s4a: doneN(3), s4b: doneN(3) }, MATH);
  const r4 = c4.lnHandoff("kid", "s4b", "check");
  ok("last unit finished → re-project only itself; lane complete", eq(c4.calls.map(x => x[1]), ["s4b"]) && eq(r4.next, []) && /lane “Math” is complete/.test(c4.toasts[0]), c4.toasts);
  const GS = { l: { name: "L", units: [{ subs: ["geo", "sci"], pattern: "AB", rhythm: "own", allowedDays: ["Mon", "Wed"], timesPerWeek: 2 }, { sk: "s4a", rhythm: "prior" }] } };
  const c5 = world({ geo: doneN(2) }, GS);
  ok("a multiple-card partner finishing EARLY hands nothing on (the card is still open — the pattern closes ranks on the next projection)", c5.lnHandoff("kid", "geo", "check") === null && c5.calls.length === 0);
  const c6 = world({ geo: doneN(2), sci: doneN(2) }, GS);
  c6.lnHandoff("kid", "sci", "mark");
  ok("the whole multiple card finished → next unit's member is re-projected", eq(c6.calls.map(x => x[1]), ["sci", "s4a"]));
  const c7 = world({ s3b: doneN(2) }, MATH); c7.reprojectSubjectWeek = () => { throw new Error("boom"); };
  ok("a throw inside one re-project is caught, the rest proceed", (() => { try { const r = c7.lnHandoff("kid", "s3b", "check"); return !!r && r.next[0] === "s4a"; } catch (e) { return false; } })());
}
console.log("\n── wiring ──");
{
  ok("finalizeDone hands off right after the subject-complete check", /checkSubjectComplete\(t\.who, t\.subjectKey\); \}catch\(e\)\{\}\n    try\{ if\(typeof lnHandoff==="function"\) lnHandoff\(t\.who,t\.subjectKey,"check"\); \}catch\(e\)\{\}/.test(src));
  ok("grid ✓ (gvMenuDone) hands off after its done write", /lnHandoff\(kid,sk,"mark"\); \}catch\(e\)\{\}[^\n]*\n\s*_gvDelUndo=\{kid,sk,paths:prevPaths,label:"marked “"\+_idn\.text/.test(src));
  ok("list-panel mark (ceMarkLessonDone) hands off after its done write", /lnHandoff\(kid,sk,"mark"\); \}catch\(e\)\{\}[^\n]*\n\s*_gvDelUndo=\{kid,sk,paths:prevPaths,label:"marked "\+list\.length/.test(src));
  const rp = block("function reprojectSubjectWeek", "// REPROJ_END");
  ok("the week diff judges a borrowing member by the borrowed days and cap", /dayCap:_rpCap/.test(rp) && /allowedDays:_rpDays/.test(rp) && /if\(_rh&&!_rh\.own\)\{ _rpDays=_rh\.allowedDays\|\|\[\]; _rpCap=_rh\.cap\|\|1; \}/.test(rp));
  ok("— and a subject on its own rhythm keeps its own values", /let _rpDays=_subj\.allowedDays\|\|\[\], _rpCap=_subj\.cap\|\|1;/.test(rp));
  ok("no un-finish hook (nothing ever drops: a successor's dealt cards stay)", !/lnHandoff\(kid,sk,"unfinish"\)/.test(src) && !/lnHandoff[^\n]*ceUnfinishLesson/.test(src));
  ok("handoff never writes on its own — reprojectSubjectWeek is the only door", !/db\.ref|\.set\(|\.update\(/.test(block("// LANE_HANDOFF_START", "// LANE_HANDOFF_END")));
}
console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
