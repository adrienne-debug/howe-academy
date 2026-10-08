/*
 * Node tests — 🚩 badge + Problem-words list + 🔁 "graduated words came back" nudge (her asks 2026-10-04).
 *   run:  node test_problem_flags.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
function slice(name) { const i = src.indexOf("function " + name + "("); let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
const CODE = cut("// AAS_START", "// AAS_END") + "\n" + cut("// SPELLTEST_START", "// SPELLTEST_END") + "\n" + cut("// PROBLEMWORDS_START", "// PROBLEMWORDS_END") + "\n"
  + cut("// PWFLAG_START", "// PWFLAG_END") + "\n" + slice("mastDirTag");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
function world(o) {
  o = o || {}; const writes = [], els = {};
  const document = { body: { appendChild: e => { els[e.id] = e; } }, getElementById: id => els[id] || null, createElement: () => ({ style: {}, remove() { delete els[this.id]; } }) };
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, document, setTimeout: f => f(),
    momHere: () => o.mom !== false, mastAdminPinOk: false, masteryKid: "k", _dryRun: () => false, ROSTER: new Set(["k"]),
    HA_LS: { setItem: () => {} }, gwShowToast: () => {}, _mastRe: () => {}, renderAll: () => {}, mastGetPrintNum: () => 1,
    masteryData: o.mastery || { k: [] }, db: { ref: p => ({ set: v => writes.push(["set", p, v]), update: v => writes.push(["update", p, v]), push: v => writes.push(["push", p, v]) }) } };
  vm.createContext(ctx); vm.runInContext(CODE + "\nObject.defineProperty(this,'pwUI',{get:()=>pwUI,set:v=>{pwUI=v;}});", ctx);
  return { ctx, writes, els };
}
const I = (prompt, x) => Object.assign({ id: "k_" + prompt, subject: "AAS Words", prompt, status: "active", tier: "weekly" }, x || {});
console.log("── 🚩 badge on drill cards (Mom's view) ──");
{
  const m = { k: [I("been", { problem: { ts: 1, d: "2026-10-04" } }), I("they", { cameBack: { ts: 2, from: "graduated" }, problem: { ts: 2 } }), I("cat")] };
  const c = world({ mastery: m }).ctx;
  ok("a problem word's label carries 🚩", /🚩/.test(c.mastDirTag("k_been")));
  ok("a word that came back carries '🔁 came back'", /came back/.test(c.mastDirTag("k_they")));
  ok("an ordinary card has no badge", c.mastDirTag("k_cat") === "");
  ok("a kid's device shows no badge", world({ mastery: m, mom: false }).ctx.mastDirTag("k_been") === "");
  const g = world({ mastery: { k: [I("Hund", { dir: "prod", problem: { ts: 1 } })] } }).ctx;
  ok("the German direction tag still shows alongside it", /🚩/.test(g.mastDirTag("k_Hund")) && /\u{1F1E9}\u{1F1EA}/u.test(g.mastDirTag("k_Hund")));
}
console.log("\n── 📋 My problem words (the filter) ──");
{
  const m = { k: [I("been", { problem: { ts: 3, d: "2026-10-04" }, status: "introduction", tier: "daily" }), I("they", { problem: { ts: 2 }, ww: { on: true, r: [] } }),
    I("were", { problem: { ts: 1 }, status: "active", tier: "monthly" }), I("cat")] };
  const w = world({ mastery: m }), c = w.ctx;
  c.pwOpen("k");
  ok("the panel links to 'My problem words (3)'", /My problem words \(3\)/.test(w.els["pw-panel"].innerHTML));
  c.pwUI.step = "list"; c.pwUI.filter = "all"; c.pwRender();
  const h = w.els["pw-panel"].innerHTML;
  ok("only problem words are listed (not 'cat')", /been/.test(h) && /they/.test(h) && /were/.test(h) && !/>cat</.test(h));
  ok("filter chips with counts", /Learning now \(1\)/.test(h) && /In Word Workout \(1\)/.test(h) && /Back on the ladder \(1\)/.test(h));
  c.pwUI.filter = "workout"; c.pwRender();
  ok("filtering to Word Workout shows just 'they'", /they/.test(w.els["pw-panel"].innerHTML) && !/>been</.test(w.els["pw-panel"].innerHTML));
}
console.log("\n── 🔁 the comeback nudge ──");
{
  const now = Date.now(), log = {};
  ["been", "they", "were"].forEach((n, i) => log["c" + i] = { name: n, deck: "AAS Words", from: "graduated", ts: now - i * 864e5, src: "problem word" });
  log.old = { name: "said", deck: "AAS Words", from: "graduated", ts: now - 40 * 864e5 };
  log.math = { name: "7×8", deck: "Math Facts", from: "graduated", ts: now };
  const w = world({ mastery: { k: [], k_comebacks: log } }), c = w.ctx;
  const n = c.cbNudges("k", now);
  ok("3 graduated AAS words back within 30 days → one nudge (old ones and a lone math fact don't count)", n.length === 1 && n[0].deck === "AAS Words" && n[0].n === 3, n);
  ok("Mom HQ shows it with Check-up and Dismiss", /3 graduated AAS Words came back for K this month/.test(c.cbNudgeHTML()) && /🩺 Check-up/.test(c.cbNudgeHTML()));
  c.cbDismiss("k", "AAS Words");
  ok("Dismiss quiets it (saved per deck)", c.cbNudges("k", now).length === 0 && w.writes.some(x => x[1] === "mastery/k_settings/cbDismiss/AAS Words"));
  ok("a kid's device never shows the nudge", world({ mastery: { k: [], k_comebacks: log }, mom: false }).ctx.cbNudgeHTML() === "");
}
{
  const w = world({ mastery: { k: [I("black", { tier: "graduated" })], k_custom_items: [] } }), c = w.ctx;
  c.stApplyResults("k", ["black"], { 0: "m" }, "L1-18");
  ok("a graduated word missed on a spelling test is logged as a comeback", Object.values(c.masteryData.k_comebacks || {}).some(r => r.name === "black" && r.src === "spelling test"));
}
console.log("\n── wiring ──");
ok("Mom HQ and Mom's Day show the nudge", (src.match(/h\+=cbNudgeHTML\(\)/g) || []).length === 2);
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
