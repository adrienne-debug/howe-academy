/*
 * Node tests — 🏋️ Word Workout: ONE button per screen (WWONE, her ask 2026-10-28: "if i click next word before check my answer
 * is lost i think check and next need to be one button" · and the locked fill-in box must say it's done for today).
 *   1. While the kid is answering there is one button — Check — and no Next word (hidden step and every copy step).
 *   2. Once the word is done for today (right, or missed twice) the box goes away, a "done for today" line shows (a missed
 *      word's own message already says it), and the one button is Next word › — or All done ✓ on the last one.
 *   3. Next word goes to the next word NOT done today; a done word never shows its copy steps.
 * Runs the REAL code.   run:  node test_ww_one_button.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
const CODE = cut("// AAS_START", "// AAS_END") + "\n" + cut("// SPELLTEST_START", "// SPELLTEST_END") + "\n" + cut("// PROBLEMWORDS_START", "// PROBLEMWORDS_END") + "\n"
  + cut("// WORDWORKOUT_START", "// WORDWORKOUT_END") + "\n" + slice("mstEsc") + "\n" + slice("mstCopyDiff") + "\n" + slice("mstCopyMarked");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
function world(items) {
  const writes = [], els = {}, toasts = [];
  const document = { body: { appendChild: e => { els[e.id] = e; } }, getElementById: id => els[id] || null, createElement: () => ({ style: {}, remove() { delete els[this.id]; } }) };
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, document, setTimeout: () => {},
    momHere: () => true, _dryRun: () => false, HA_LS: { setItem: () => {} }, gwShowToast: t => toasts.push(t), _mastRe: () => {}, mastGetPrintNum: () => 1, mastSpeak: () => {},
    _todayDay: "Wed", masteryData: { k: items || [], k_custom_items: [] },
    db: { ref: p => ({ set: v => writes.push(["set", p, v]), update: v => writes.push(["update", p, v]), push: () => {} }) } };
  vm.createContext(ctx); vm.runInContext(CODE + "\nObject.defineProperty(this,'wwUI',{get:()=>wwUI,set:v=>{wwUI=v;}});", ctx);
  return { ctx, writes, els, toasts };
}
const W = p => ({ id: "k_" + p, subject: "AAS Words", prompt: p, answer: p, status: "active", tier: "weekly", ww: { m: 1, on: true, r: [] } });
const panel = w => (w.els["ww-panel"] || {}).innerHTML || "";
const buttons = w => (panel(w).match(/<button onclick="[^"]+"/g) || []).map(s => s.slice(17, -1)).filter(s => s !== "wwClose()" && s !== "wwSay()");
const toTest = (w, word) => { const c = w.ctx; c.wwCopyHide(); w.els["ww-copy-in"] = { value: word }; c.wwCopyCheck(); c.wwCopyDone(); };

console.log("── 1. answering: one button, Check — never a Next word that drops the answer ──");
{
  const w = world([W("red"), W("men")]), c = w.ctx;
  c.wwOpen("k");
  ok("👀 look: just Hide it", JSON.stringify(buttons(w)) === '["wwCopyHide()"]', buttons(w));
  c.wwCopyHide();
  ok("🙈 cover: just Check", JSON.stringify(buttons(w)) === '["wwCopyCheck()"]', buttons(w));
  w.els["ww-copy-in"] = { value: "rad" }; c.wwCopyCheck();
  ok("✏️ fix: just Check", JSON.stringify(buttons(w)) === '["wwCopyFix()"]', buttons(w));
  w.els["ww-copy-fix"] = { value: "red" }; c.wwCopyFix();
  ok("✓ fixed: just Now from memory", JSON.stringify(buttons(w)) === '["wwCopyDone()"]', buttons(w));
  c.wwCopyDone();
  ok("hidden step: the box and ONE button, Check", /id="ww-in"/.test(panel(w)) && JSON.stringify(buttons(w)) === '["wwCheck()"]', buttons(w));
  ok("Enter in the box still checks", /onkeydown="if\(event.key===\\?'Enter\\?'\)wwCheck\(\)"/.test(panel(w)));
  w.els["ww-in"] = { value: "rde" }; c.wwCheck();
  ok("first miss: still the box and Check (try once more)", /id="ww-in"/.test(panel(w)) && JSON.stringify(buttons(w)) === '["wwCheck()"]' && /try once more/.test(panel(w)));
}

console.log("\n── 2. done for today: the box goes, a line says why, one button moves on ──");
{
  const w = world([W("red"), W("men")]), c = w.ctx;
  c.wwOpen("k"); toTest(w, "red");
  w.els["ww-in"] = { value: "red" }; c.wwCheck();
  ok("right → no box, '✓ Yes!' and '✓ Done for today — come back tomorrow!'", !/id="ww-in"/.test(panel(w)) && /✓ Yes!/.test(panel(w)) && /✓ Done for today — come back tomorrow!/.test(panel(w)));
  ok("…and the one button is Next word ›", JSON.stringify(buttons(w)) === '["wwNext()"]' && /Next word ›/.test(panel(w)), buttons(w));
  c.wwNext(); toTest(w, "men");
  w.els["ww-in"] = { value: "mne" }; c.wwCheck(); w.els["ww-in"] = { value: "mne" }; c.wwCheck();
  ok("missed twice → no box, its own 'try it again tomorrow' message, no green ✓ done line", !/id="ww-in"/.test(panel(w)) && /stays in your workout/.test(panel(w)) && !/✓ Done for today/.test(panel(w)));
  ok("last word done → the one button is All done ✓", JSON.stringify(buttons(w)) === '["wwFinish()"]' && /All done ✓/.test(panel(w)), buttons(w));
  c.wwFinish();
  ok("All done ✓ closes the workout with 'All done for today'", !w.els["ww-panel"] && c.wwUI === null && w.toasts.some(t => /All done for today/.test(t)));
  ok("a miss never writes a right day; the right one wrote once", w.writes.filter(x => /\/ww$/.test(x[1])).length === 1);
}

console.log("\n── 3. Next word skips what's done today ──");
{
  const w = world([W("red"), W("men"), W("sit")]), c = w.ctx;
  c.wwOpen("k"); c.wwUI.done["k_men"] = true;
  c.wwNext();
  ok("from word 1, Next skips done word 2 and lands on word 3 at LOOK", c.wwUI.i === 2 && c.wwUI.step === "look" && />sit</.test(panel(w)));
}
{
  const w = world([W("red"), W("men")]), c = w.ctx;
  c.wwOpen("k"); c.wwUI.done = { k_red: "miss", k_men: "miss" };
  c.wwNext();
  ok("every word done → a done word shows its done screen, never its copy steps", c.wwUI.step === "test" && !/id="ww-in"/.test(panel(w)) && !/See it, copy it/.test(panel(w)));
  ok("…a word missed twice earlier says 'Done for today — try it again tomorrow!'", /Done for today — try it again tomorrow!/.test(panel(w)) && JSON.stringify(buttons(w)) === '["wwFinish()"]', buttons(w));
}
{
  const ww = cut("// WORDWORKOUT_START", "// WORDWORKOUT_END");
  ok("no leftover 'disabled' box in the Workout (the dead box is gone)", !/'disabled '/.test(ww));
}

console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
