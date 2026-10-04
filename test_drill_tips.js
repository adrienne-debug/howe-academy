/*
 * 💡 DRILL_TIPS (her ask 2026-10-04: "shes never used the drills make sure we add instructions on log button and save
 * button etc") — step-by-step help on Today's Drill, shown until "Got it" (per device), "ⓘ How drills work" brings it
 * back; an always-on line under a grey Save Results; a tooltip on 📝 Log. No data writes.
 *   run:  node test_drill_tips.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(process.env.TIPS_SRC || path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); } }
const a = src.indexOf("// DRILL_TIPS_START"), b = src.indexOf("// DRILL_TIPS_END");
ok("DRILL_TIPS block present", a > 0 && b > a);
const store = {}; let renders = 0;
const ctx = { console, String, JSON, cap: s => s[0].toUpperCase() + s.slice(1), HA_LS: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
  document: { getElementById: () => ({}) }, renderMastery: () => { renders++; } };
vm.createContext(ctx); vm.runInContext(src.slice(a, b), ctx);

let h = ctx.drillTipHtml(false, 10, "caleb");
ok("first visit: the start tip shows", /How today's drill works/.test(h));
ok("…says to tap 📝 Log first, and that flipping through doesn't count", /Tap <b>\u{1F4DD} Log<\/b> at the bottom to start/u.test(h) && /doesn't count/.test(h));
ok("…explains Shown Today for new cards and ✓ ✗ ~ for review cards", /Shown Today/.test(h) && /✓<\/b> knew it/.test(h) && /✗<\/b> missed it/.test(h) && /<b>~<\/b> needed help/.test(h));
ok("…uses the kid's name, never he/she (every family sees it)", /Caleb says it out loud/.test(h) && /Caleb's progress/.test(h) && !/\b(he|she|his|her)\b/i.test(h.replace(/<[^>]+>/g, "")));
ok("…says nothing is saved until Save Results", /tap <b>Save Results<\/b>\. Nothing is saved until you do/.test(h));
ok("…has a Got it button", /drillTipGotIt\('start'\)/.test(h));
ctx.drillTipGotIt("start");
ok("Got it → remembered on this device, page redraws", store.ha_tip_drill_start === "1" && renders === 1);
h = ctx.drillTipHtml(false, 10);
ok("after Got it: just a small 'ⓘ How drills work' link", !/How today's drill works/.test(h) && /How drills work/.test(h) && /drillTipShow\(\)/.test(h));
h = ctx.drillTipHtml(true, 18);
ok("Log mode has its own tip (still shows after the start tip was dismissed)", /You're logging — 18 cards today/.test(h) && /turns green when they all are/.test(h) && /Pause/.test(h) && /Cancel<\/b> throws this session away/.test(h));
ctx.drillTipGotIt("log"); ctx.drillTipShow();
ok("ⓘ brings both tips back", !("ha_tip_drill_start" in store) && !("ha_tip_drill_log" in store) && /How today's drill works/.test(ctx.drillTipHtml(false, 3)));
ok("one card → singular", /— 1 card today/.test(ctx.drillTipHtml(true, 1)));

console.log("\nwiring");
ok("tip sits right under the Today's Drill header (only when cards are due)", /Print #'\+pn\+'<\/div><\/div>';\n\s*if\(due\.length&&typeof drillTipHtml==="function"\) h\+=drillTipHtml\(!!mastLogMode,due\.length,masteryKid\);/.test(src));
ok("grey Save Results explains itself (how many to go)", /Save turns on when all '\+due\.length\+' cards are marked \('\+\(due\.length-scored\)\+' to go\)/.test(src));
ok("📝 Log button has a tooltip", /title="Start today\\'s drill — mark each card, then Save Results"/.test(src));
ok("no data writes in the block", !/db\.ref\(/.test(src.slice(a, b)));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
