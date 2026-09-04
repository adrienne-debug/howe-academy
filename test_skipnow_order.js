/*
 * "Skip for now" sweeps by BOOK ORDER, not by week. Dismissing a card takes with it only the
 * subject's lessons that come AFTER it in the sequence; earlier lessons still on the week stay
 * live. Found live 2026-09-04: dismissing an overflow pg 35 card also dismissed pg 32 (today)
 * and pg 33 (Saturday), and the toast said the subject "picks up here". Runs the real code.
 *
 *   run:  node test_skipnow_order.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

function braceSlice(name) {
  const sig = "function " + name + "("; const i = src.indexOf(sig); if (i < 0) throw new Error("fn not found: " + name);
  let d = 0, j = src.indexOf("{", i);
  for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); } }
  throw new Error("unbalanced: " + name);
}
const fns = ["taskLessonRef", "_lessonPos", "momDismiss"].map(braceSlice).join("\n");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

// Lincoln's real shape: lessonIds L0001.. against "B2 pg N" titles; cards can sit on any day.
function mkEnv(o) {
  o = o || {};
  const seq = [], ids = [];
  for (let i = 1; i <= 40; i++) { seq.push("B2 pg " + i); ids.push("L" + String(i).padStart(4, "0")); }
  const sub = { display: "Editor in Chief", lessonSeq: seq, lessonIds: o.noIds ? undefined : ids, tracking: o.tracking };
  const card = (n, day, extra) => Object.assign({ id: "lincoln__conventions_L" + String(n).padStart(4, "0"), who: "lincoln", subjectKey: "conventions",
    day: day, time: "11:00 AM", title: "📄 Editor in Chief — B2 pg " + n, lid: o.noIds ? undefined : "L" + String(n).padStart(4, "0") }, extra || {});
  const env = {
    currData: { subjects: { lincoln: { conventions: sub } } },
    weekData: { tasks: o.tasks ? o.tasks(card) : [card(31, "tuesday"), card(32, "friday"), card(33, "saturday"), card(35, "thursday", { _eowOverflow: true })] },
    momMoves: {}, checked: o.checked || {}, effectiveDay: t => t.day, nowTs: () => "ts",
    moves: [], toast: null, momHere: () => true, gwShowToast: t => { env.toast = t; },
    _saveMomMove: (id, rec) => { env.momMoves[id] = rec; env.moves.push(id); },
    _isNextUpLesson: () => false, planBacked: () => true, paceData: { subjects: {} }, savePaceSubject: () => {},
    closeDlg: () => {}, schedCascade: () => {}, renderAll: () => {}, dbg: () => {},
    Date, Math, Object, JSON, String, Number, Array, parseInt, console,
  };
  env.window = env;
  vm.createContext(env);
  new vm.Script(fns).runInContext(env);
  return env;
}
const L = n => "lincoln__conventions_L" + String(n).padStart(4, "0");

console.log("_lessonPos — by lesson id, then by title text, else -1");
{
  const e = mkEnv();
  ok("id: pg 35 → 34", e._lessonPos(e.weekData.tasks[3]) === 34);
  const e2 = mkEnv({ noIds: true });
  ok("no ids: title 'B2 pg 32' → 31", e2._lessonPos(e2.weekData.tasks[1]) === 31);
  ok("dash variants match: 'B2 pg 32' vs 'B2  pg 32'", e2._lessonPos({ who: "lincoln", subjectKey: "conventions", title: "📄 EIC — B2  pg 32" }) === 31);
  ok("unknown text → -1", e2._lessonPos({ who: "lincoln", subjectKey: "conventions", title: "📄 EIC — Review Z" }) === -1);
  ok("no subject → -1", e2._lessonPos({ who: "lincoln", title: "x" }) === -1);
}

console.log("skip for now — the live bug: dismissing overflow pg 35 must NOT take pg 32 / pg 33");
{
  const e = mkEnv({ checked: { [L(31)]: "10:00 AM" } });
  e.momDismiss(L(35), "now");
  ok("pg 35 itself dismissed", e.momMoves[L(35)] && e.momMoves[L(35)].mode === "skip");
  ok("pg 32 (earlier, today) stays live", !e.momMoves[L(32)]);
  ok("pg 33 (earlier, Saturday) stays live", !e.momMoves[L(33)]);
  ok("checked pg 31 untouched", !e.momMoves[L(31)]);
  ok("toast says 2 earlier lessons stay", /2 earlier lessons this week stay/.test(e.toast || ""), e.toast);
}

console.log("skip for now — tapping the NEXT lesson still ends the subject for the week (old behavior kept)");
{
  const e = mkEnv({ checked: { [L(31)]: "10:00 AM" } });
  e.momDismiss(L(32), "now");
  ok("pg 32 dismissed", e.momMoves[L(32)] && e.momMoves[L(32)].mode === "skip");
  ok("pg 33 (later) swept", e.momMoves[L(33)] && e.momMoves[L(33)].mode === "skip");
  ok("pg 35 (later, overflow) swept", e.momMoves[L(35)] && e.momMoves[L(35)].mode === "skip");
  ok("toast is the plain 'picks up here'", /picks up here/.test(e.toast || ""), e.toast);
}

console.log("skip for now — middle card: earlier stays, later goes");
{
  const e = mkEnv();
  e.momDismiss(L(33), "now");
  ok("pg 31, 32 stay", !e.momMoves[L(31)] && !e.momMoves[L(32)]);
  ok("pg 35 swept", !!e.momMoves[L(35)]);
  ok("toast counts 2 kept", /2 earlier lessons/.test(e.toast || ""), e.toast);
}

console.log("skip for now — order comes from the BOOK, not the day: a later lesson on an earlier day is still later");
{
  const e = mkEnv({ tasks: card => [card(32, "friday"), card(34, "monday")] });
  e.momDismiss(L(32), "now");
  ok("pg 34 sitting on Monday is swept (it's after pg 32 in the book)", !!e.momMoves[L(34)]);
  const e2 = mkEnv({ tasks: card => [card(32, "friday"), card(34, "monday")] });
  e2.momDismiss(L(34), "now");
  ok("dismissing pg 34 on Monday leaves Friday's pg 32 alone", !e2.momMoves[L(32)]);
}

console.log("skip for now — when the tapped card can't be placed, nothing else moves");
{
  const e = mkEnv({ tasks: card => [card(32, "friday"), Object.assign(card(99, "thursday"), { lid: "L9999", title: "📄 Editor in Chief — Review Z" })] });
  e.momDismiss(L(99), "now");
  ok("tapped card dismissed", !!e.momMoves[L(99)]);
  ok("pg 32 untouched", !e.momMoves[L(32)]);
  ok("toast reports 1 kept", /1 earlier lesson this week stays/.test(e.toast || ""), e.toast);
}

console.log("skip for now — an unplaceable SIBLING is kept, not swept");
{
  const e = mkEnv({ tasks: card => [card(32, "friday"), Object.assign(card(98, "saturday"), { lid: "L9998", title: "📄 Editor in Chief — Bonus" })] });
  e.momDismiss(L(32), "now");
  ok("unknown sibling stays live", !e.momMoves[L(98)]);
}

console.log("skip for now — title-only subjects (no lesson ids) order by title text");
{
  const e = mkEnv({ noIds: true });
  e.momDismiss(L(35), "now");
  ok("pg 32 / 33 stay", !e.momMoves[L(32)] && !e.momMoves[L(33)]);
}

console.log("skip for now — daily subjects: only the tapped card, as before");
{
  const e = mkEnv({ tracking: "daily" });
  e.momDismiss(L(32), "now");
  ok("nothing else moves", Object.keys(e.momMoves).length === 1);
}

console.log("dialog label names the rule (source assertion)");
ok("button text", src.indexOf("Skip for now — this and any later lessons this week come back next week") >= 0);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
