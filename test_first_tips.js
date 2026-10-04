/*
 * 💡 FIRST_TIPS (her ask 2026-10-04) — first-time help on a kid's schedule and the Notebook tab, remembered per PERSON
 * (tipKey: Mom / each helper / Dad), "Got it" hides it, "ⓘ" brings it back. No data writes.
 *   run:  node test_first_tips.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); } }
const a = src.indexOf("// FIRST_TIPS_START"), b = src.indexOf("// FIRST_TIPS_END");
const t0 = src.indexOf("function tipWho("), t1 = src.indexOf("function drillTipSeen(");
ok("FIRST_TIPS block present, tipWho/tipKey shared", a > 0 && b > a && t0 > 0 && t1 > t0);
const st = {}; let who = { helper: null }, renders = 0;
const ctx = { console, String, JSON, RegExp, cap: s => s[0].toUpperCase() + s.slice(1),
  HA_LS: { getItem: k => (k in st ? st[k] : null), setItem: (k, v) => { st[k] = String(v); }, removeItem: k => { delete st[k]; } },
  renderAll: () => { renders++; }, _kioskD: () => false, helperViewActive: () => !!who.helper, get helperView() { return who.helper; }, location: { search: "" } };
vm.createContext(ctx); vm.runInContext(src.slice(t0, t1) + "\n" + src.slice(a, b), ctx);

let h = ctx.schedTipHtml("caleb");
ok("schedule tip: 'How Caleb’s school day works'", /How Caleb’s school day works/.test(h));
ok("…morning unlocks school · tap a card · Mom cards wait · Drills opens · chores after", /unlocks the school list/.test(h) && /Tap a card/.test(h) && /Mom Required<\/b> cards wait for Mom/.test(h) && /Open drills/.test(h) && /afternoon chores/.test(h));
ok("…uses the kid's name, never he/she", !/\b(he|she|his|her)\b/i.test(h.replace(/<[^>]+>/g, "")));
h = ctx.notebookTipHtml();
ok("notebook tip: Print → PDF → Files → Share → Print, parent guide, Look first = peek", /Print notebook/.test(h) && /Files<\/b>/.test(h) && /Share → Print/.test(h) && /parent guide/.test(h) && /Look first<\/b> is just a quick peek/.test(h));
ctx.firstTipGotIt("schedule");
ok("Got it → hidden for Mom, redraw", st.ha_tip_first_schedule === "1" && renders === 1 && /ⓘ How Caleb’s school day works/.test(ctx.schedTipHtml("caleb")) && !/unlocks the school list/.test(ctx.schedTipHtml("caleb")));
who.helper = "h_grandma";
ok("Grandma under her own name still sees it", /unlocks the school list/.test(ctx.schedTipHtml("caleb")));
who.helper = null; ctx.firstTipShow("schedule");
ok("ⓘ brings it back for Mom", /unlocks the school list/.test(ctx.schedTipHtml("caleb")));
ok("no data writes", !/db\.ref\(/.test(src.slice(a, b)));

console.log("\nwiring");
ok("schedule tip sits under '<Kid>’s Day' (a kid's own view)", /"'s Day<\/div>"\+\(typeof schedTipHtml==="function"\?schedTipHtml\(kid\):""\)/.test(src));
ok("notebook tip sits under the Notebook tab's top line", /\(typeof notebookTipHtml==="function"\?notebookTipHtml\(\):""\)\+/.test(src));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
