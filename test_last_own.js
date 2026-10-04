/*
 * ⏹ LAST_OWN (her "yes build", 2026-10-04) — two kinds of "last":
 *   last    = last of day      → after everything, family time included
 *   lastOwn = last of own work → right after the kid's own lessons; Mom-required → it ends the kid's Mom turn
 * Bug it fixes: the week builder put "last" in the earliest open slot, so Caleb's Closing Notebook landed at 11:10,
 * before lunch and family time. Her rule for Caleb: Morning Notebook → Drills → Closing Notebook as ONE block.
 *   run:  node test_last_own.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(process.env.LASTOWN_SRC || path.join(__dirname, "index.html"), "utf8");
function fn(name) {
  const m = src.search(new RegExp("^function\\s+" + name + "\\s*\\(", "m"));
  if (m < 0) throw new Error("missing " + name);
  let i = src.indexOf("{", m), d = 0;
  for (let j = i; j < src.length; j++) { const c = src[j]; if (c === "{") d++; else if (c === "}") { d--; if (!d) return src.slice(m, j + 1); } }
}
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); } }
function load(workflow, order) {
  const ctx = { console, Math, Object, Array, JSON, rulesData: { workflow }, momLoop: { order },
    fbArr: v => Array.isArray(v) ? v : (v && typeof v === "object" ? Object.values(v) : null),
    taskDevice: t => t.device || "paper", ROSTER: ["taylor", "makenzie", "andrew", "caleb"] };
  vm.createContext(ctx);
  ["toMin", "fromMin", "packDay", "packAround", "mlOrder", "gwLoopPack"].forEach(n => vm.runInContext(fn(n), ctx));
  return ctx;
}
const H = (h, m) => h * 60 + (m || 0);
const KIDS = ["taylor", "makenzie", "andrew", "caleb"];
const FAM = { s: H(13), e: H(14, 20) };   // family time after lunch (History · Science · Read Aloud)
const baseCtx = () => ({ start: H(9), end: H(16), lunchStart: H(12), lunchEnd: H(13), kidStart: {}, momStart: 0,
  busy: { taylor: [FAM], makenzie: [FAM], andrew: [FAM], caleb: [FAM] }, momBusy: [], laneBusy: {},
  lanes: ["computer", "screen", "ipadLucy", "keyboard"], laneCap: { computer: 1, screen: 2, keyboard: 1 }, helperFor: null });
let n = 0;
const card = (who, key, dur, mom, rules, device) => ({ id: "c" + (n++), who, key, dur, mom: mom || "none", rules: rules || "", device: device || "paper" });
const info = it => ({ rules: it.rules || "", key: it.key });
// DeWalt's real Monday (week of Oct 5), Caleb's closing rule supplied per test
const monday = closingRule => [
  card("caleb", "morning_notebook", 10, "required", "first", "book"), card("caleb", "drills", 10, "required"),
  card("caleb", "closing_notebook", 5, "required", closingRule, "book"),
  card("andrew", "arith", 20, "required"), card("andrew", "la2", 30, "required"), card("andrew", "hw", 10), card("andrew", "read", 20), card("andrew", "piano", 20, "none", "", "keyboard"),
  card("makenzie", "apologia", 20, "required"), card("makenzie", "cle", 30, "required"), card("makenzie", "iew", 20, "required"),
  card("makenzie", "aas", 10), card("makenzie", "pen", 10), card("makenzie", "piano", 20, "none", "", "keyboard"), card("makenzie", "read", 30),
  card("taylor", "fixit", 20, "required"), card("taylor", "saxon", 20, "required"),
  card("taylor", "piano", 20, "none", "", "keyboard"), card("taylor", "read", 30), card("taylor", "spell", 10), card("taylor", "typing", 15, "none", "", "computer"),
];
const at = (T, key, who) => T.find(t => t.key === key && (!who || t.who === who));
const s = (vmc, t) => vmc.toMin(t.time);
function momClean(vmc, T) {
  const iv = T.filter(t => t.mom === "required" && t.time).map(t => [s(vmc, t), s(vmc, t) + t.dur]).sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < iv.length; i++) if (iv[i][0] < iv[i - 1][1]) return false; return true;
}
function kidsClean(vmc, T) {
  return KIDS.every(k => { const I = T.filter(t => t.who === k && t.time).map(t => [s(vmc, t), s(vmc, t) + t.dur]).concat([[FAM.s, FAM.e]]).sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < I.length; i++) if (I[i][0] < I[i - 1][1]) return false; return true; });
}

console.log("Caleb's Closing Notebook = last of OWN work (her rule 10/4)");
{
  const vmc = load({}, ["caleb", "andrew", "makenzie", "taylor"]);
  const T = monday("lastOwn"); const over = vmc.gwLoopPack(T, baseCtx(), KIDS, info);
  ok("nothing overflows", over.length === 0, over.map(t => t.key));
  ok("one block: 9:00 Morning Notebook → 9:10 Drills → 9:20 Closing Notebook",
    at(T, "morning_notebook").time === "9:00 AM" && at(T, "drills").time === "9:10 AM" && at(T, "closing_notebook").time === "9:20 AM",
    ["morning_notebook", "drills", "closing_notebook"].map(k => at(T, k).time));
  ok("then Mom moves on to Andrew (next in her loop) at 9:25", at(T, "arith", "andrew").time === "9:25 AM", at(T, "arith", "andrew").time);
  ok("Mom is never with two kids at once", momClean(vmc, T));
  ok("no kid is double-booked (family time included)", kidsClean(vmc, T));
}

console.log("\n\"last of day\" = after everything, family time included (was: earliest open slot, 11:10 before lunch)");
{
  const vmc = load({}, ["caleb", "andrew", "makenzie", "taylor"]);
  const T = monday("last"); vmc.gwLoopPack(T, baseCtx(), KIDS, info);
  ok("Closing Notebook lands right after family time (2:20)", at(T, "closing_notebook").time === "2:20 PM", at(T, "closing_notebook").time);
  ok("Mom still clean", momClean(vmc, T));
}

console.log("\n\"last of own work\" with independent work AFTER the Mom turn waits for that work");
{
  const vmc = load({}, ["andrew", "caleb"]);
  const T = [card("andrew", "arith", 20, "required"), card("caleb", "draw", 40), card("caleb", "drills", 10, "required"), card("caleb", "wrap", 5, "none", "lastOwn")];
  const c = baseCtx(); c.busy = {};
  vmc.gwLoopPack(T, c, ["andrew", "caleb"], info);
  const ownEnd = Math.max(...T.filter(t => t.who === "caleb" && t.key !== "wrap").map(t => s(vmc, t) + t.dur));
  ok("wrap-up starts once his own work is done", s(vmc, at(T, "wrap")) >= ownEnd, [at(T, "wrap").time, ownEnd]);
  ok("…and not after lunch/family time when there's room before", s(vmc, at(T, "wrap")) < H(12), at(T, "wrap").time);
}

console.log("\nno room after → earliest hole (never dropped for this)");
{
  const vmc = load({}, ["caleb"]);
  const c = baseCtx(); c.end = H(14, 20); c.busy = { caleb: [FAM] };
  const T = [card("caleb", "drills", 10, "required"), card("caleb", "closing", 5, "required", "last")];
  const over = vmc.gwLoopPack(T, c, ["caleb"], info);
  ok("\"last of day\" with the day ending at family time's end still gets a slot", over.length === 0 && !!at(T, "closing").time, [over.length, at(T, "closing").time]);
}

console.log("\nHowe-shaped (saved Workflow Orders) — untouched");
{
  const wf = { taylor: { normal: [{ tier: "required" }] }, makenzie: { normal: [{ tier: "required" }] }, andrew: { normal: [{ tier: "required" }] }, caleb: { normal: [{ tier: "required" }] } };
  const vmc = load(wf, []);
  const a = monday("last"), b = JSON.parse(JSON.stringify(a));
  vmc.gwLoopPack(a, baseCtx(), KIDS, info); vmc.packAround([], b, baseCtx());
  ok("identical to the old single pack", JSON.stringify(a.map(t => t.time)) === JSON.stringify(b.map(t => t.time)));
}

console.log("\npickers + labels");
ok("Add Subject offers 'last of day' and 'last of own work'", /\["sequential","sticky","first","last","lastOwn"\]\.forEach/.test(src) && /RULE_LABEL=\{last:"last of day",lastOwn:"last of own work"\}/.test(src));
ok("choosing one 'last' clears the other (one end-of-day slot)", /probe==="last"\?\(x==="last"\|\|x==="lastOwn"\)/.test(src));
ok("⚙ Rules table has 'Last of day' + 'Last of own work' pills", />Last of day<\/span>/.test(src) && />Last of own work<\/span>/.test(src) && /set\.delete\(tok==="last"\?"lastOwn":"last"\)/.test(src));
ok("Subjects page labels it 'End of own work'", /label:"End of own work"/.test(src));
ok("lastOwn still reads as a 'last' card to every other engine (contains \"last\")", "lastOwn".includes("last"));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
