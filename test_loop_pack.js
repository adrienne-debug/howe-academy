/*
 * Node tests for gwLoopPack (LOOP_PACK, 2026-10-04) — kids with no saved Workflow Orders lay the way the Mom loop
 * runs the day: Mom-led family time → Mom-required in loop order (borrowing a free kid) → kids-only family time →
 * everyone's own work packed into the earliest hole → last-of-day.
 *
 *   run:  node test_loop_pack.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function fn(name) {
  const m = src.search(new RegExp("^function\\s+" + name + "\\s*\\(", "m"));
  if (m < 0) throw new Error("missing " + name);
  let i = src.indexOf("{", m), d = 0;
  for (let j = i; j < src.length; j++) { const c = src[j]; if (c === "{") d++; else if (c === "}") { d--; if (!d) return src.slice(m, j + 1); } }
}
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}
function load(workflow, order) {
  const ctx = { console, Math, Object, Array, JSON, rulesData: { workflow }, momLoop: { order },
    fbArr: v => Array.isArray(v) ? v : (v && typeof v === "object" ? Object.values(v) : null),
    taskDevice: t => t.device || "paper", ROSTER: ["taylor", "makenzie", "andrew"] };
  vm.createContext(ctx);
  ["toMin", "fromMin", "packDay", "packAround", "mlOrder", "gwLoopPack"].forEach(n => vm.runInContext(fn(n), ctx));
  return ctx;
}
const H = (h, m) => h * 60 + (m || 0);
const baseCtx = () => ({ start: H(9), end: H(16), lunchStart: H(12), lunchEnd: H(13), kidStart: {}, momStart: 0, busy: {}, momBusy: [], laneBusy: {},
  lanes: ["computer", "screen", "ipadLucy", "keyboard"], laneCap: { computer: 1, screen: 2, keyboard: 1 }, helperFor: null });
let n = 0;
const card = (who, key, dur, mom, device) => ({ id: "c" + (n++), who, key, dur, mom: mom || "none", device: device || "paper" });
const info = it => ({ rules: it.rules || "", key: it.key });
const day = () => [
  card("taylor", "saxon", 20, "required"), card("taylor", "fixit", 20, "required"),
  card("taylor", "piano", 20, "none", "keyboard"), card("taylor", "read", 30),
  card("makenzie", "math", 20, "required"), card("makenzie", "cle", 30, "required"),
  card("makenzie", "piano", 20, "none", "keyboard"), card("makenzie", "read", 30), card("makenzie", "pen", 10),
  card("andrew", "arith", 20, "required"), card("andrew", "phon", 30, "required"),
  card("andrew", "piano", 20, "none", "keyboard"), card("andrew", "hw", 10), card("andrew", "read", 20),
];
const ivs = (L) => L.map(t => [vmc.toMin(t.time), vmc.toMin(t.time) + t.dur]);
let vmc;

console.log("Howe-shaped (every kid has saved Workflow Orders) — untouched");
{
  const wf = { taylor: { normal: [{ tier: "required" }] }, makenzie: { normal: [{ tier: "required" }] }, andrew: { normal: [{ tier: "required" }] } };
  vmc = load(wf, []);
  const a = day(), b = JSON.parse(JSON.stringify(a));
  vmc.gwLoopPack(a, baseCtx(), ["taylor", "makenzie", "andrew"], info);
  vmc.packAround([], b, baseCtx());
  ok("identical times to the old single pack", JSON.stringify(a.map(t => t.time)) === JSON.stringify(b.map(t => t.time)));
}

console.log("\nno saved orders — the Mom loop's day");
{
  vmc = load({}, ["andrew", "makenzie", "taylor"]);
  const T = day(); const over = vmc.gwLoopPack(T, baseCtx(), ["taylor", "makenzie", "andrew"], info);
  ok("nothing overflows", over.length === 0, over.map(t => t.id));
  const mom = T.filter(t => t.mom === "required").sort((a, b) => vmc.toMin(a.time) - vmc.toMin(b.time));
  ok("Mom starts at the bell with the FIRST kid in loop order", mom[0].time === "9:00 AM" && mom[0].who === "andrew", mom[0]);
  const iv = ivs(mom); let gaps = 0, overlap = false; for (let i = 1; i < iv.length; i++) { if (iv[i][0] > iv[i - 1][1]) gaps += iv[i][0] - iv[i - 1][1]; if (iv[i][0] < iv[i - 1][1]) overlap = true; }
  ok("Mom works straight through — no idle gap", gaps === 0, gaps);
  ok("Mom is never with two kids at once", !overlap);
  ok("blocks follow loop order: Andrew's, then Kenzie's, then Taylor's", mom.map(t => t.who).join() === "andrew,andrew,makenzie,makenzie,taylor,taylor", mom.map(t => t.who));
  const tay = T.filter(t => t.who === "taylor" && t.mom !== "required");
  ok("a later kid does their own work BEFORE their Mom turn (from the bell)", tay.some(t => t.time === "9:00 AM"));
  let kidOverlap = false; ["taylor", "makenzie", "andrew"].forEach(k => { const I = ivs(T.filter(t => t.who === k)).sort((a, b) => a[0] - b[0]); for (let i = 1; i < I.length; i++) if (I[i][0] < I[i - 1][1]) kidOverlap = true; });
  ok("no kid is double-booked", !kidOverlap);
  const kb = ivs(T.filter(t => t.device === "keyboard")).sort((a, b) => a[0] - b[0]); let kbo = false; for (let i = 1; i < kb.length; i++) if (kb[i][0] < kb[i - 1][1]) kbo = true;
  ok("one keyboard → pianos never overlap", !kbo);
}
{
  vmc = load({}, ["andrew", "makenzie", "taylor"]);
  const T = day(); const c = baseCtx(); c.busy = { andrew: [{ s: H(9), e: H(9, 15) }] };
  vmc.gwLoopPack(T, c, ["taylor", "makenzie", "andrew"], info);
  const mom = T.filter(t => t.mom === "required").sort((a, b) => vmc.toMin(a.time) - vmc.toMin(b.time));
  ok("turn-kid busy at the bell → Mom borrows the next free kid, never waits", mom[0].time === "9:00 AM" && mom[0].who === "makenzie", mom[0]);
}
{
  vmc = load({}, ["andrew", "makenzie", "taylor"]);
  const T = day();
  const fam = { id: "fam", who: "andrew", _participants: ["andrew", "makenzie"], dur: 15, mom: "none", device: "paper" };
  const led = { id: "led", who: "taylor", _participants: ["taylor", "makenzie", "andrew"], dur: 20, mom: "required", device: "paper" };
  T.push(fam, led);
  vmc.gwLoopPack(T, baseCtx(), ["taylor", "makenzie", "andrew"], info);
  ok("Mom-led family time goes FIRST", led.time === "9:00 AM", led.time);
  const momEnds = T.filter(t => t.mom === "required" && !t._participants && (t.who === "andrew" || t.who === "makenzie")).map(t => vmc.toMin(t.time));
  const fs0 = vmc.toMin(fam.time);
  ok("kids-only family time sits where BOTH kids are free (never on a Mom card)",
    T.filter(t => (t.who === "andrew" || t.who === "makenzie") && t !== fam && t !== led).every(t => { const s = vmc.toMin(t.time); return s + t.dur <= fs0 || s >= fs0 + 15; }));
}
{
  vmc = load({}, ["andrew"]);
  const a = card("andrew", "iew", 20), b = card("andrew", "iew", 20), m1 = card("andrew", "arith", 40, "required");
  const T = [m1, a, b]; const c = baseCtx(); c.busy = { andrew: [{ s: H(9, 30), e: H(9, 50) }] };
  vmc.gwLoopPack(T, c, ["andrew"], info);
  ok("a subject's later lesson never lands ahead of its earlier one", vmc.toMin(a.time) < vmc.toMin(b.time), [a.time, b.time]);
}
{
  vmc = load({}, ["andrew", "makenzie"]);
  const g1 = card("andrew", "aas", 20, "required"), g2 = card("andrew", "phon", 30, "required"), k1 = card("makenzie", "math", 20, "required"), k2 = card("makenzie", "cle", 30, "required");
  const T = [g1, g2, k1, k2]; const c = baseCtx();
  c.helperFor = it => (it === g1 || it === g2) ? { id: "h_grandma", s: H(9, 30), e: H(12) } : null;
  vmc.gwLoopPack(T, c, ["andrew", "makenzie"], info);
  ok("Grandma's cards sit in her window", vmc.toMin(g1.time) >= H(9, 30) && vmc.toMin(g2.time) >= H(9, 30), [g1.time, g2.time]);
  ok("…and don't hold Mom: Kenzie gets Mom at the bell", k1.time === "9:00 AM", k1.time);
}
console.log("\nsource wiring");
ok("the generator's pack goes through gwLoopPack (guarded)", /typeof gwLoopPack==="function"\)\?gwLoopPack\(toPack,_packCtx,KIDS,/.test(src));
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
