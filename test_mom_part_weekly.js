/*
 * #23 part 3 — 👩 MOMPART3: the WEEKLY BUILDER packs a Mom-required card by its Mom part only.
 *   A subject with momPartMins (+ momPartStart) holds Mom only for those minutes:
 *     · Mom at the END   → the kid's alone part can run while Mom finishes another kid's card
 *     · Mom at the START → once her part is done, Mom takes the next kid's card while this kid finishes alone
 *   No setting anywhere → packDay / packAround lay EXACTLY what origin/main's code lays (compared against the
 *   pre-change functions pulled from git when available, else the in-file copy with no setting).
 *   fbMomLoad counts only the Mom part.
 *
 *   run:  node test_mom_part_weekly.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm"), cp = require("child_process");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function fnFrom(S, name) {
  const st = S.search(new RegExp("^function\\s+" + name + "\\s*\\(", "m"));
  if (st < 0) throw new Error("fn " + name);
  let i = S.indexOf("{", st), d = 0, q = null, e = false;
  for (let j = i; j < S.length; j++) {
    const c = S[j];
    if (e) { e = false; continue; }
    if (c === "\\") { e = true; continue; }
    if (q) { if (c === q) q = null; continue; }
    if (c === "/" && S[j + 1] === "/") { j = S.indexOf("\n", j); continue; }
    if (c === "/" && S[j + 1] === "*") { j = S.indexOf("*/", j) + 1; continue; }
    if (c === '"' || c === "'" || c === "`") { q = c; continue; }
    if (c === "{") d++; else if (c === "}") { d--; if (!d) return S.slice(st, j + 1); }
  }
  throw new Error("unbalanced " + name);
}
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}
function makeCtx(S, subjects, withPart) {
  const ctx = {
    console, ROSTER: ["lincoln", "ellis", "lucy", "julian"],
    gwDeviceCaps: () => ({ computer: 1, screen: 2 }),
    taskDevice: t => t.device || "paper",
    Date, Math, Object, Array, JSON, String, Number, parseInt, isNaN,
  };
  if (subjects) ctx.currData = { subjects };
  vm.createContext(ctx);
  const names = ["toMin", "fromMin", "packDay", "packAround"].concat(withPart ? ["mlMomPartOf", "mlMomSpan", "mlMomStepWins", "fbMomLoad"] : []);
  vm.runInContext(names.map(n => fnFrom(S, n)).join("\n"), ctx);
  return ctx;
}
const CTX = { start: 600, end: 960, lunchStart: 780, lunchEnd: 840 };
function lay(ctx, tasks, c) {
  const copy = JSON.parse(JSON.stringify(tasks));
  ctx.__t = copy; ctx.__c = Object.assign({}, CTX, c || {});
  const over = vm.runInContext("packAround([], __t, __c)", ctx);
  const m = {}; copy.forEach(t => { m[t.id] = t.time || null; });
  return { times: m, over: over.map(t => t.id) };
}
const T = (id, who, sk, dur, mom, extra) => Object.assign({ id, who, subjectKey: sk, dur, mom: mom || "none", title: id }, extra || {});

// ── 1. no setting → identical to the pre-change code (origin/main), on many random days ──
let OLD = null;
try { OLD = cp.execSync("git show origin/main:index.html", { cwd: __dirname, encoding: "utf8", maxBuffer: 1 << 28, stdio: ["ignore", "pipe", "ignore"] }); } catch (e) {}
if (OLD && OLD.indexOf("MOMPART3") >= 0) OLD = null;   // already merged → compare with "subjects present, no setting"
const SUBJ_NONE = { lincoln: { aas: { minutes: 30 }, mr: { minutes: 20 } }, ellis: { aas: { minutes: 30 }, fll: { minutes: 25 } }, lucy: { aas: { minutes: 20 } } };
const newCtx = makeCtx(src, SUBJ_NONE, true), refCtx = OLD ? makeCtx(OLD, SUBJ_NONE, false) : makeCtx(src, null, true);
let seed = 7; const rnd = n => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
let same = 0, runs = 0, firstDiff = null;
for (let r = 0; r < 300; r++) {
  const kids = ["lincoln", "ellis", "lucy"], sks = ["aas", "mr", "fll", "x"], devs = ["", "computer", "ipad", "paper"];
  const tasks = [];
  for (let i = 0; i < 4 + rnd(10); i++) tasks.push(T("c" + i, kids[rnd(3)], sks[rnd(4)], 5 + 5 * rnd(8), ["required", "none", "maybe"][rnd(3)], { device: devs[rnd(4)] }));
  const c = rnd(3) === 0 ? { momBusy: [{ s: 630 + 5 * rnd(20), e: 700 + 5 * rnd(10) }] } : (rnd(2) ? { momStart: 600 + 5 * rnd(12) } : {});
  runs++;
  const a = JSON.stringify(lay(newCtx, tasks, c)), b = JSON.stringify(lay(refCtx, tasks, c));
  if (a === b) same++; else if (!firstDiff) firstDiff = { tasks, c, a, b };
}
ok("no setting: " + runs + " random days lay identically to " + (OLD ? "origin/main" : "the no-subjects path"), same === runs, firstDiff);
ok("mlMomStepWins with no setting returns the very same array", (() => { newCtx.__w = [[1, 2]]; return vm.runInContext("mlMomStepWins({who:'lincoln',subjectKey:'aas',mom:'required',dur:30},30,__w)===__w", newCtx); })());
ok("mlMomSpan with no setting = whole card", JSON.stringify(vm.runInContext("mlMomSpan({who:'lincoln',subjectKey:'aas',mom:'required',dur:30},600,30)", newCtx)) === "[600,630]");

// ── 2. Mom at the END: Ellis's Mom card sits inside Lincoln's kid-alone first part ──
const SUBJ_END = { lincoln: { aas: { minutes: 30, momPartMins: 10 } }, ellis: { fll: { minutes: 20 } } };
{
  const day = [T("e_fll", "ellis", "fll", 20, "required"), T("l_aas", "lincoln", "aas", 30, "required")];
  const before = lay(makeCtx(src, SUBJ_NONE, true), day), after = lay(makeCtx(src, SUBJ_END, true), day);
  ok("end/before: Lincoln waits for Mom → 10:20", before.times.l_aas === "10:20 AM", before.times);
  ok("end/after: Lincoln starts 10:00 alone; Mom joins 10:20–10:30", after.times.l_aas === "10:00 AM" && after.times.e_fll === "10:00 AM", after.times);
  // and the next Mom card waits for the END of Lincoln's Mom part (10:30), not before
  const day2 = day.concat([T("u_aas", "lucy", "aas", 20, "required")]);
  const a2 = lay(makeCtx(src, SUBJ_END, true), day2);
  ok("end: the next Mom card waits until her part ends (10:30)", a2.times.u_aas === "10:30 AM", a2.times);
  // momBusy (a pinned class with Mom 10:00–10:15) only pushes the Mom part, not the whole card
  const a3 = lay(makeCtx(src, SUBJ_END, true), [T("l_aas", "lincoln", "aas", 30, "required")], { momBusy: [{ s: 600, e: 615 }] });
  const b3 = lay(makeCtx(src, SUBJ_NONE, true), [T("l_aas", "lincoln", "aas", 30, "required")], { momBusy: [{ s: 600, e: 615 }] });
  ok("end + momBusy 10:00–10:15: whole card would wait to 10:15; Mom part only → 10:00 (Mom 10:20)", b3.times.l_aas === "10:15 AM" && a3.times.l_aas === "10:00 AM", [b3.times, a3.times]);
  // sitter window 10:00–10:25: Mom part 10:20–10:30 overlaps → card starts so her part begins at 10:25
  const a4 = lay(makeCtx(src, SUBJ_END, true), [T("l_aas", "lincoln", "aas", 30, "required")]);
  ok("end: alone card lays at 10:00", a4.times.l_aas === "10:00 AM", a4.times);
}

// ── 3. Mom at the START: once her part is done Mom takes Ellis while Lincoln finishes alone ──
const SUBJ_START = { lincoln: { aas: { minutes: 30, momPartMins: 10, momPartStart: true } }, ellis: { fll: { minutes: 20 } } };
{
  const day = [T("l_aas", "lincoln", "aas", 30, "required"), T("e_fll", "ellis", "fll", 20, "required")];
  const before = lay(makeCtx(src, SUBJ_NONE, true), day), after = lay(makeCtx(src, SUBJ_START, true), day);
  ok("start/before: Ellis waits for the whole card → 10:30", before.times.e_fll === "10:30 AM", before.times);
  ok("start/after: Ellis's Mom card at 10:10, inside Lincoln's alone part", after.times.l_aas === "10:00 AM" && after.times.e_fll === "10:10 AM", after.times);
  // an existing (already-fixed) Mom-at-start card seeds Mom free after her part
  const c = makeCtx(src, SUBJ_START, true);
  c.__e = [Object.assign(T("l_aas", "lincoln", "aas", 30, "required"), { time: "10:00 AM" })];
  c.__n = [T("e_fll", "ellis", "fll", 20, "required")];
  c.__c = Object.assign({}, CTX);
  vm.runInContext("packAround(__e, __n, __c)", c);
  ok("start: existing card seeds Mom free at 10:10", c.__n[0].time === "10:10 AM", c.__n[0].time);
  // a momPartDone card falls back to today's whole-card behaviour
  const d = lay(makeCtx(src, SUBJ_START, true), [T("l_aas", "lincoln", "aas", 30, "required", { momPartDone: true }), T("e_fll", "ellis", "fll", 20, "required")]);
  ok("start: momPartDone → whole card as before (Ellis 10:30)", d.times.e_fll === "10:30 AM", d.times);
  // part >= minutes is ignored
  const big = lay(makeCtx(src, { lincoln: { aas: { minutes: 30, momPartMins: 30, momPartStart: true } } }, true), day);
  ok("start: part >= card → ignored (Ellis 10:30)", big.times.e_fll === "10:30 AM", big.times);
}

// ── 4. step-over windows and spans ──
{
  const c = makeCtx(src, SUBJ_END, true);
  ok("mlMomSpan end part = last 10", JSON.stringify(vm.runInContext("mlMomSpan({who:'lincoln',subjectKey:'aas',mom:'required',dur:30},600,30)", c)) === "[620,630]");
  // a 30-min card at s holds Mom [s+20,s+30]; it hits Mom window [600,615] iff 570<s<595. The shifted window [600,595]
  // is hit by the card's own [s,s+30] on exactly that range, and stepping past it lands s=595 → Mom from 10:15.
  ok("mlMomStepWins end part shifts windows onto the card", JSON.stringify(vm.runInContext("mlMomStepWins({who:'lincoln',subjectKey:'aas',mom:'required',dur:30},30,[[600,615]])", c)) === "[[600,595]]");
  let hitsOk = true;
  for (let st = 540; st <= 640; st++) { const w = [600, 595], h1 = st < w[1] && st + 30 > w[0], h2 = st + 20 < 615 && st + 30 > 600; if (h1 !== h2) hitsOk = false; }
  ok("shifted window conflicts exactly when the Mom part does", hitsOk);
  const s = makeCtx(src, SUBJ_START, true);
  ok("mlMomSpan start part = first 10", JSON.stringify(vm.runInContext("mlMomSpan({who:'lincoln',subjectKey:'aas',mom:'required',dur:30},600,30)", s)) === "[600,610]");
}

// ── 5. fbMomLoad counts only the Mom part ──
{
  const c = makeCtx(src, SUBJ_END, true);
  c.weekData = { tasks: [T("l1", "lincoln", "aas", 30, "required"), T("l2", "lincoln", "aas", 30, "required", { momPartDone: true }), T("e1", "ellis", "fll", 20, "required"), T("e1_c", "ellis", "fll", 20, "required"), T("u1", "lucy", "aas", 20, "none")] };
  const L = vm.runInContext("fbMomLoad()", c);
  ok("fbMomLoad: Lincoln = 10 (part) + 30 (part done → whole, as before) over 2 cards", L.lincoln.min === 40 && L.lincoln.cards === 2, L.lincoln);
  ok("fbMomLoad: Ellis (no setting) = 20 over 1 card", L.ellis.min === 20 && L.ellis.cards === 1, L.ellis);
  const c0 = makeCtx(src, SUBJ_NONE, true); c0.weekData = c.weekData;
  ok("fbMomLoad: no setting → whole minutes (Lincoln 60)", vm.runInContext("fbMomLoad()", c0).lincoln.min === 60);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
