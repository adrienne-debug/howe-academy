/*
 * Node tests — ⏸ pause / ▶ resume keep THIS week in step (her ask 2026-09-14).
 *
 *   · the re-lay diff's ONE gated exception to NOTHING-drops: `dropUnwanted` (pause only) removes
 *     unlocked, unfinished cards; checked / claimed / started cards still never move
 *   · without the flag the old rule holds exactly (unwanted undone cards are kept)
 *   · lnPauseRelay re-lays the subject, then its lane partners (multiple card / next unit up)
 *   · the two pause doors (editor toggle + quick ⏸) call it, plan-backed only
 *
 *   run:  node test_pause_relay.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function block(a, b) { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); }
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); } }
const eq = (x, y) => JSON.stringify(x) === JSON.stringify(y);

// ── A. the pure diff ─────────────────────────────────────────────────────────────────────
const toMin = s => { if (!s) return 0; const m = String(s).match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return 0; let h = +m[1] % 12; if (/PM/i.test(m[3])) h += 12; return h * 60 + +m[2]; };
const fromMin = m => { const h = Math.floor(m / 60), mm = m % 60; const ap = h >= 12 ? "PM" : "AM"; const hh = ((h + 11) % 12) + 1; return hh + ":" + String(mm).padStart(2, "0") + " " + ap; };
const packAround = (fixed, news, ctx) => { const cur = {}; fixed.forEach(t => { cur[t.who] = Math.max(cur[t.who] || ctx.start, toMin(t.time) + (t.dur || 20)); }); news.forEach(t => { const c = Math.max(cur[t.who] || ctx.start, ctx.start); t.time = fromMin(c); cur[t.who] = c + (t.dur || 20); }); return []; };
const dayCtx = () => ({ start: 600, end: 975, lunchStart: 780, lunchEnd: 840 });
function mkEnv() { const env = { console, JSON, Object, Array, String, Number, Math, parseInt, Date, RegExp }; vm.createContext(env); new vm.Script(block("// REPROJ_START", "// REPROJ_END")).runInContext(env); return env; }
const T = (id, day, time, title, extra) => Object.assign({ id, who: "lincoln", subjectKey: "conv", day, time, dur: 20, title, lid: id.split("_").pop() }, extra || {});
const O = (id, who, day, time) => ({ id, who, subjectKey: "other", day, time, dur: 20, title: "other" });
const OPTS = o => Object.assign({ todayDay: "tuesday", nowMin: 660, checked: {}, claimed: {}, dayCtx, packAround, toMin, fromMin, dayCap: 1, allowedDays: ["Mon", "Tue", "Wed", "Thu", "Fri"], lidOrder: ["L0016", "L0017", "L0018", "L0019"] }, o || {});
const L16 = "lincoln_lincoln__conv_L0016", L17 = "lincoln_lincoln__conv_L0017", L18 = "lincoln_lincoln__conv_L0018", L19 = "lincoln_lincoln__conv_L0019";
const kidWeek = ["monday", "tuesday", "wednesday", "thursday", "friday"].map(d => O("o_" + d, "lincoln", d, "9:00 AM"));
const clone = a => a.map(t => Object.assign({}, t));
// the live shape 2026-09-14: Editor in Chief paused on Monday evening, week23 still holds Wed pg 32 / Thu pg 33 / Fri pg 34
const live = kidWeek.concat([T(L16, "monday", "10:00 AM", "EIC pg 31"), T(L17, "wednesday", "11:10 AM", "EIC pg 32"), T(L18, "thursday", "11:25 AM", "EIC pg 33"), T(L19, "friday", "11:15 AM", "EIC pg 34")]);

console.log("── the diff: pause drops unlocked open cards; nothing else changes ──");
{
  const e = mkEnv();
  const r = e._reprojectPlan("lincoln", "conv", clone(live), [], OPTS({ checked: { [L16]: 1 }, dropUnwanted: true }));
  ok("Wed / Thu / Fri open cards are removed", eq(r.summary.removed.slice().sort(), [L17, L18, L19].sort()), r.summary.removed);
  ok("…as explicit null writes on their ids", [L17, L18, L19].every(id => r.upd[id] === null), Object.keys(r.upd));
  ok("the checked Monday card stays (locked)", r.tasksAfter.some(t => t.id === L16) && r.upd[L16] === undefined);
  ok("nothing is 'kept' — the pause is the intent", r.summary.kept.length === 0, r.summary.kept);
  ok("other subjects' cards untouched", kidWeek.every(o => r.tasksAfter.some(t => t.id === o.id) && r.upd[o.id] === undefined));
}
{
  const e = mkEnv();
  const r = e._reprojectPlan("lincoln", "conv", clone(live), [], OPTS({ checked: { [L16]: 1 } }));
  ok("WITHOUT the flag the old rule holds: unwanted undone cards are KEPT, none removed", r.summary.removed.length === 0 && eq(r.summary.kept.slice().sort(), [L17, L18, L19].sort()), r.summary);
}
{
  const e = mkEnv();
  // today Wednesday 11:30: the Wed 11:10 card has STARTED → locked; Thu/Fri go
  const r = e._reprojectPlan("lincoln", "conv", clone(live), [], OPTS({ todayDay: "wednesday", nowMin: 690, checked: { [L16]: 1 }, dropUnwanted: true }));
  ok("a card already started today stays even on pause", r.tasksAfter.some(t => t.id === L17) && r.upd[L17] === undefined, r.summary.removed);
  ok("…the later ones still go", eq(r.summary.removed.slice().sort(), [L18, L19].sort()), r.summary.removed);
}
{
  const e = mkEnv();
  const r = e._reprojectPlan("lincoln", "conv", clone(live), [], OPTS({ claimed: { [L18]: 1 }, dropUnwanted: true }));
  ok("a claimed card stays even on pause", r.tasksAfter.some(t => t.id === L18) && r.upd[L18] === undefined);
}
{
  const e = mkEnv();
  const r = e._reprojectPlan("lincoln", "conv", clone(live), [], OPTS({ dropUnwanted: true }));
  ok("the freed slots are recorded for the next lay to take", r.summary.removed.length === 4 || r.summary.removed.length === 3, r.summary.removed);
}

// ── B. lnPauseRelay: the subject, then its lane partners ──────────────────────────────────
function subj(display, n, extra) { const seq = Array.from({ length: n }, (_, i) => display + " L" + (i + 1)); return Object.assign({ display, lessonSeq: seq, lessonIds: seq.map((_, i) => "L" + String(i + 1).padStart(4, "0")), doneImportedAt: 1, planId: "kid__" + display, allowedDays: ["Mon"], timesPerWeek: 1, pacing: { mode: "timesPerWeek", tpw: 1 } }, extra || {}); }
const doneN = n => { const o = {}; for (let i = 0; i < n; i++) o["L" + String(i + 1).padStart(4, "0")] = { ts: 1, day: "2026-09-01" }; return o; };
function world(done, lanes, pausedKeys) {
  const subjects = { conv: subj("Editor in Chief", 5), gwtm: subj("GWTM Purple", 5), s3b: subj("3B", 2), s4a: subj("4A", 3), s4b: subj("4B", 3), solo: subj("Solo", 3) };
  (pausedKeys || []).forEach(k => { subjects[k].paused = true; });
  const calls = [], toasts = [];
  const ctx = { console, Object, Array, String, Number, Math, JSON, Set, parseInt, Date, calls, toasts,
    currData: { subjects: { kid: subjects }, done: { kid: done || {} }, lanes: lanes ? { kid: lanes } : undefined },
    reprojectSubjectWeek: (k, sk, why, opts) => { const o = opts ? Object.assign({}, opts) : null; if (o) delete o.then; calls.push([k, sk, why, (o && Object.keys(o).length) ? o : null]); if (opts && typeof opts.then === "function") { if (ctx.deferThen) ctx.pendingThen = opts.then; else opts.then({ added: [] }); } return { added: [] }; }, gwShowToast: m => toasts.push(m), dbg: () => {},
    cbDefaultForm: (k, sk) => ({ mode: "timesPerWeek", tpw: 1, targetDate: "", allowedDays: ["Mon"] }) };
  ctx.lidsFor = (k, sk) => (subjects[sk] || {}).lessonIds || null;
  ctx.lidStamped = (k, sk) => !!(subjects[sk] && subjects[sk].doneImportedAt);
  ctx.planBacked = (k, sk) => !!(subjects[sk] && subjects[sk].planId);
  ctx.lidDoneIdx = (k, sk) => { const d = new Set(Object.keys((done || {})[sk] || {})); const out = new Set(); (subjects[sk].lessonIds || []).forEach((id, i) => { if (d.has(id)) out.add(i); }); return out; };
  vm.createContext(ctx); vm.runInContext(block("// LANE_START", "// LANE_END") + "\n" + block("// PAUSE_RELAY_START", "// PAUSE_RELAY_END"), ctx);
  return ctx;
}
const GRAMMAR = { grammar: { name: "Grammar", units: [{ subs: ["conv", "gwtm"], pattern: "AB", rhythm: "own", timesPerWeek: 5, cap: 1 }] } };
const MATH = { math: { name: "Math", units: [{ sk: "s3b" }, { sk: "s4a", rhythm: "prior" }, { sk: "s4b", rhythm: "prior" }] } };

console.log("\n── lnPauseRelay ──");
{
  const c = world({}, null);
  const r = c.lnPauseRelay("kid", "solo", true);
  ok("no lane → re-lay only the subject, with the drop flag", eq(c.calls, [["kid", "solo", "pause", { dropUnwanted: true }]]) && eq(r.partners, []), c.calls);
  ok("toast says the week's open cards cleared", /Solo — this week's open cards cleared/.test(c.toasts[0]) && !/takes the days/.test(c.toasts[0]), c.toasts);
}
{
  // the live case: Editor in Chief paused inside the Grammar AB card with GWTM Purple
  const c = world({}, GRAMMAR, ["conv"]);
  const r = c.lnPauseRelay("kid", "conv", true);
  ok("EIC re-laid first with the drop flag, then GWTM Purple (the other letter) without it", eq(c.calls.map(x => [x[1], x[2], x[3]]), [["conv", "pause", { dropUnwanted: true }], ["gwtm", "pause:partner", null]]), c.calls);
  ok("partners reported", eq(r.partners, ["gwtm"]));
  ok("toast names who takes the days", /Editor in Chief — this week's open cards cleared; GWTM Purple takes the days/.test(c.toasts[0]), c.toasts);
}
{
  const c = world({}, GRAMMAR, []);
  const r = c.lnPauseRelay("kid", "conv", false);
  ok("resume: EIC re-laid WITHOUT the drop flag, then the partner", eq(c.calls.map(x => [x[1], x[2], x[3]]), [["conv", "resume", null], ["gwtm", "resume:partner", null]]), c.calls);
  ok("resume toast", /Editor in Chief is back — laid from the next open day; GWTM Purple re-laid around it/.test(c.toasts[0]), c.toasts);
}
{
  // a stack: pausing 3B makes 4A the unit up → it is re-laid so it steps in this week
  const c = world({}, MATH, ["s3b"]);
  const r = c.lnPauseRelay("kid", "s3b", true);
  ok("stack: the next unit (4A) is re-laid, not 4B", eq(c.calls.map(x => x[1]), ["s3b", "s4a"]), c.calls);
}
{
  // a partner that is itself paused takes nothing
  const c = world({}, GRAMMAR, ["conv", "gwtm"]);
  c.lnPauseRelay("kid", "conv", true);
  ok("a paused partner is not re-laid", eq(c.calls.map(x => x[1]), ["conv"]), c.calls);
}
{
  const c = world({}, GRAMMAR, ["conv"]); c.reprojectSubjectWeek = (k, sk) => { if (sk === "conv") throw new Error("boom"); c.calls.push([k, sk]); return {}; };
  const r = c.lnPauseRelay("kid", "conv", true);
  ok("a throw on the subject is caught; the partner still re-lays", !!r && eq(c.calls.map(x => x[1]), ["gwtm"]), c.calls);
}

{
  // the ORDER: partners re-lay only after the subject's re-lay has completed (the lock is async)
  const c8 = world({}, GRAMMAR, ["conv"]); c8.deferThen = true;
  c8.lnPauseRelay("kid", "conv", true);
  ok("partner is NOT re-laid while the subject's re-lay is still running", eq(c8.calls.map(x => x[1]), ["conv"]) && typeof c8.pendingThen === "function", c8.calls);
  c8.pendingThen({ added: [] });
  ok("…it re-lays once the subject's re-lay reports done", eq(c8.calls.map(x => x[1]), ["conv", "gwtm"]), c8.calls);
}

console.log("\n── the doors (source checks) ──");
{
  ok("the editor toggle calls the re-lay with the NEW state, plan-backed only", /const wasPaused=!!s\.paused;[\s\S]{0,900}lnPauseRelay\(ceEditKid,ceEditKey,!wasPaused\)/.test(src));
  ok("the quick ⏸ calls it with the new state, plan-backed only", /planBacked\(kid,key\)\) lnPauseRelay\(kid,key,now\)/.test(src));
  ok("reprojectSubjectWeek forwards the flag into the diff", /dropUnwanted:!!\(opts&&opts\.dropUnwanted\)/.test(src));
  ok("the flag is set in exactly ONE place: the pause re-lay", (src.match(/\{dropUnwanted:true\}/g) || []).length === 1);
  ok("reprojectSubjectWeek reports completion on every path (early returns, lock refused, done)", (src.match(/_then\(null\)/g) || []).length >= 6 && /finally\{ release\(\); _then\(out\); \}/.test(src));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
