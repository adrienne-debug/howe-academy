/*
 * 👩 MOM_LOOP_SETTINGS (her ask 2026-10-04) — the Mom-loop order lives in Admin ▸ Settings (one family-wide setting)
 * with "Each morning start with": whoever the loop stopped on yesterday (default, = old behaviour) | the first kid,
 * every day. A "Start the loop on X" tap still wins for that day. The schedule strip names the order (no arrows).
 *   run:  node test_mom_loop_settings.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(process.env.MLS_SRC || path.join(__dirname, "index.html"), "utf8");
function fn(name) {
  const m = src.search(new RegExp("^function\\s+" + name + "\\s*\\(", "m"));
  if (m < 0) throw new Error("missing " + name);
  let i = src.indexOf("{", m), d = 0;
  for (let j = i; j < src.length; j++) { const c = src[j]; if (c === "{") d++; else if (c === "}") { d--; if (!d) return src.slice(m, j + 1); } }
}
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); } }
function load(momLoop, ovn) {
  const writes = [];
  const ctx = { console, Math, Object, Array, JSON, String, parseInt, momLoop, ROSTER: ["caleb", "andrew", "taylor", "makenzie"],
    _mlDayStamp: () => "2026-10-5", mlOvernightStart: () => ovn, momHere: () => true, adminPinUnlocked: false, _dryRun: () => false,
    renderAll: () => {}, rulesOpen: {}, cap: s => s[0].toUpperCase() + s.slice(1), esc: s => String(s),
    MAST_KID_EMOJI: { caleb: "🚜" }, db: { ref: p => ({ set: v => writes.push([p, v]) }) } };
  vm.createContext(ctx);
  ["mlOrder", "mlCursor", "mlSetStartMode", "renderMomLoopCard"].forEach(n => vm.runInContext(fn(n), ctx));
  ctx.writes = writes; return ctx;
}
const ORDER = ["caleb", "andrew", "taylor", "makenzie"];

console.log("how each morning starts");
ok("default (unset) = whoever the loop stopped on yesterday (old behaviour)", load({ order: ORDER, cursor: 0 }, 2).mlCursor() === 2);
ok("…and with nobody cut off yesterday, the stored cursor (old behaviour)", load({ order: ORDER, cursor: 1 }, -1).mlCursor() === 1);
ok("'carry' = same as default", load({ order: ORDER, cursor: 0, startMode: "carry" }, 3).mlCursor() === 3);
ok("'first' = the first kid in the order, even if someone was cut off yesterday", load({ order: ORDER, cursor: 2, startMode: "first" }, 3).mlCursor() === 0);
ok("a 'Start the loop on X' tap TODAY still wins in 'first' mode", load({ order: ORDER, cursor: 2, cursorSetOn: "2026-10-5", startMode: "first" }, 3).mlCursor() === 2);
ok("…and in 'carry' mode", load({ order: ORDER, cursor: 1, cursorSetOn: "2026-10-5" }, 3).mlCursor() === 1);
ok("yesterday's tap doesn't stick in 'first' mode", load({ order: ORDER, cursor: 2, cursorSetOn: "2026-10-4", startMode: "first" }, -1).mlCursor() === 0);

console.log("\nsetting it");
{ const c = load({ order: ORDER }, -1); c.mlSetStartMode("first");
  ok("choosing 'first' writes config/momLoop/startMode (one leaf)", JSON.stringify(c.writes) === JSON.stringify([["config/momLoop/startMode", "first"]]) && c.momLoop.startMode === "first"); }
{ const c = load({ order: ORDER }, -1); c.mlSetStartMode("bogus"); ok("anything else is ignored", c.writes.length === 0); }
{ const c = load({ order: ORDER }, -1); c.momHere = () => false; vm.runInContext("momHere=()=>false", c); c.mlSetStartMode("first"); ok("not Mom / not unlocked → no write", c.writes.length === 0); }

console.log("\nthe Settings card");
{ const h = load({ order: ORDER, startMode: "first" }, -1).renderMomLoopCard();
  ok("title shows the order: Caleb → Andrew → Taylor → Makenzie", /Caleb → Andrew → Taylor → Makenzie/.test(h));
  ok("numbered rows with ▲ ▼ (mlMove), top ▲ and bottom ▼ disabled", (h.match(/mlMove\(/g) || []).length === 8 && /move up" disabled/.test(h) && /move down" disabled/.test(h));
  ok("both start choices, 'first' selected", /mlSetStartMode\('carry'\)/.test(h) && /mlSetStartMode\('first'\)" style="[^"]*background:#7c3aed/.test(h) && /Caleb first, every day/.test(h));
  ok("says it's one setting for every school day", /one setting for the whole family — every school day uses it/.test(h));
  ok("points to 'Start the loop on' for just-today changes", /just for today/.test(h)); }

console.log("\nwiring");
ok("Settings page shows the card right after Family", /pinHtml\+=renderFamilyCard\(\);\n\s*pinHtml\+=renderMomLoopCard\(\);/.test(src));
const strip = src.slice(src.indexOf("function mlStripHTML("), src.indexOf("function mlStripHTML(") + 9000);
ok("strip no longer has ◀ ▶ order arrows, names the order + points to Settings", !/mlMove\(/.test(strip) && /change in Admin \\u25B8 Settings/.test(strip));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
