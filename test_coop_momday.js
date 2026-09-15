/*
 * Node tests — 🏫 "no Mom-required lessons" is the NATURAL co-op default, and Mom can flip ONE DATE
 * to "Mom's available" so it pulls from the Mom-required list again (her ask 2026-09-14).
 *
 *   run:  node test_coop_momday.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(name) {
  const sig = "function " + name + "(";
  const i = src.indexOf(sig); if (i < 0) throw new Error("function not found: " + name);
  let d = 0, j = src.indexOf("{", i);
  for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); } }
  throw new Error("unbalanced: " + name);
}
const FNS = ["toMin", "coopsMap", "_coopHasDate", "coopMomDay", "coopNoMomBaseFor", "coopBlocksBase", "coopTimedOn", "coopToggleMomDay"].map(slice).join("\n");
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); } }
const eq = (x, y) => JSON.stringify(x) === JSON.stringify(y);

function world(o) {
  o = o || {};
  const log = { writes: [], relays: [], toasts: [], renders: 0 };
  const env = {
    calendarData: { coops: o.coops || {}, coopMomDays: o.momDays || {} },
    currData: { subjects: o.subjects || {} },
    db: { ref: p => ({ set: v => { log.writes.push([p, v]); }, remove: () => { log.writes.push([p, null]); } }) },
    momHere: () => o.mom !== false,
    planBacked: (k, sk) => !!(((o.subjects || {})[k] || {})[sk] || {}).planId,
    reprojectSubjectWeek: (k, sk, why) => { log.relays.push([k, sk, why]); return {}; },
    gwShowToast: m => { log.toasts.push(m); }, renderAll: () => { log.renders++; }, dbg: () => {},
    Object, Array, String, Number, parseInt, isNaN, Math, JSON,
  };
  const keys = Object.keys(env);
  const api = new Function(...keys, "\"use strict\";" + FNS + "; return {coopMomDay, coopNoMomBaseFor, coopBlocksBase, coopTimedOn, coopToggleMomDay, cal: () => calendarData};")(...keys.map(k => env[k]));
  return { api, log, env };
}
const D = "2026-09-15";
const CLEVE = (extra) => ({ c1: Object.assign({ name: "Cleveland Co-Op", mode: "timed", start: "9:00 AM", end: "2:00 PM", kids: ["lincoln", "ellis", "lucy", "julian"], dates: [D] }, extra || {}) });
const SUBS = { lincoln: { aas: { mom: "required", planId: "p" }, mr: { mom: "maybe", planId: "p" }, conv: { mom: "required", planId: "p", paused: true }, grid_only: { mom: "required" } },
               ellis: { eic: { mom: "required", planId: "p" } } };

console.log("── the natural default ──");
{
  const w = world({ coops: CLEVE(), subjects: SUBS });
  ok("a timed co-op with NO noMomBase field blocks Mom-required base lessons (default ON)", w.api.coopNoMomBaseFor("lincoln", D) === "Cleveland Co-Op");
  ok("…for a Mom-required subject", w.api.coopBlocksBase("lincoln", D, "aas") === true);
  ok("…not for a maybe subject", w.api.coopBlocksBase("lincoln", D, "mr") === false);
  ok("another date is untouched", w.api.coopNoMomBaseFor("lincoln", "2026-09-16") === null);
  ok("a kid not in the co-op is untouched", w.api.coopNoMomBaseFor("nobody", D) === null);
}
{
  const w = world({ coops: CLEVE({ noMomBase: true }) });
  ok("an explicit true (the two live co-ops today) still blocks", w.api.coopNoMomBaseFor("lincoln", D) === "Cleveland Co-Op");
}
{
  const w = world({ coops: CLEVE({ noMomBase: false }) });
  ok("an explicit FALSE (the box unticked) is the only way to turn the default off", w.api.coopNoMomBaseFor("lincoln", D) === null);
}
{
  const w = world({ coops: { f: { name: "Field day", mode: "fullDay", kids: ["lincoln"], dates: [D] } } });
  ok("a full-day co-op is not a no-Mom rule (it is an off day upstream)", w.api.coopNoMomBaseFor("lincoln", D) === null);
}

console.log("\n── Mom's per-day flip ──");
{
  const w = world({ coops: CLEVE(), momDays: { [D]: true } });
  ok("a flagged date pulls from the Mom-required list again", w.api.coopMomDay(D) === true && w.api.coopNoMomBaseFor("lincoln", D) === null && w.api.coopBlocksBase("lincoln", D, "aas") === false);
  ok("…only that date", w.api.coopNoMomBaseFor("lincoln", "2026-09-29") === null && w.api.coopMomDay("2026-09-29") === false);
}
{
  const w = world({ coops: CLEVE(), subjects: SUBS });
  const r = w.api.coopToggleMomDay(D);
  ok("flip ON writes the flag", eq(w.log.writes, [["calendar/coopMomDays/" + D, true]]), w.log.writes);
  ok("…locally too, so the next read sees it", w.api.cal().coopMomDays[D] === true && w.api.coopNoMomBaseFor("lincoln", D) === null);
  ok("re-lays every plan-backed, unpaused, Mom-required subject of the co-op kids", eq(w.log.relays.map(x => x[0] + "/" + x[1]).sort(), ["ellis/eic", "lincoln/aas"]), w.log.relays);
  ok("…tagged as the Mom-day flip", w.log.relays.every(x => x[2] === "coop-mom-on"));
  ok("maybe, paused, and grid-only subjects are not re-laid", !w.log.relays.some(x => ["mr", "conv", "grid_only"].includes(x[1])));
  ok("returns what it did", r.on === true && eq(r.kids, ["lincoln", "ellis", "lucy", "julian"]) && r.relaid.length === 2, r);
  ok("Mom is told, screen re-renders", /Mom's available on 2026-09-15/.test(w.log.toasts[0]) && w.log.renders === 1, w.log.toasts);
  const r2 = w.api.coopToggleMomDay(D);
  ok("flip OFF removes the flag and re-lays again (nothing drops — the plan just stops wanting them there)", r2.on === false && eq(w.log.writes[1], ["calendar/coopMomDays/" + D, null]) && w.log.relays.length === 4 && w.log.relays[3][2] === "coop-mom-off", w.log.writes);
  ok("…and the rule is back", w.api.coopNoMomBaseFor("lincoln", D) === "Cleveland Co-Op");
}
{
  const w = world({ coops: CLEVE(), subjects: SUBS, mom: false });
  ok("a kid can't flip it", w.api.coopToggleMomDay(D) === null && w.log.writes.length === 0 && w.log.relays.length === 0);
}
{
  const w = world({ coops: CLEVE(), subjects: SUBS });
  ok("no date → nothing", w.api.coopToggleMomDay("") === null && w.log.writes.length === 0);
}
{
  const w = world({ coops: CLEVE() });
  ok("coopTimedOn lists the timed co-ops on a date with their kids", eq(w.api.coopTimedOn(D).map(c => c.name), ["Cleveland Co-Op"]) && w.api.coopTimedOn("2026-09-16").length === 0);
}

console.log("\n── the doors (source checks) ──");
{
  ok("a NEW co-op form starts with the box ticked", /coopForm=\{name:"",color:COOP_COLORS\[0\],kids:\[\.\.\.ROSTER\],mode:"timed",start:"09:00",end:"12:00",dates:\[\],noMomBase:true\}/.test(src));
  ok("editing reads the natural default (missing = on)", /noMomBase:c\.noMomBase!==false\}; coopScanStatus=""/.test(src));
  ok("saving stores an explicit boolean", /obj\.noMomBase=coopForm\.noMomBase!==false;/.test(src));
  ok("the list checkbox writes an explicit boolean (false = off)", /db\.ref\("calendar\/coops\/"\+id\+"\/noMomBase"\)\.set\(!!on\)/.test(src));
  ok("both checkboxes render ticked unless explicitly false", (src.match(/noMomBase!==false\?'checked':''/g) || []).length === 2 && (src.match(/c\.noMomBase!==false\?'checked':''/g) || []).length === 1 && (src.match(/f\.noMomBase!==false\?'checked':''/g) || []).length === 1);
  ok("the day banner offers Mom the flip on a co-op date", /onclick="coopToggleMomDay\(\\''\+_ds\+'\\'\)"/.test(src) && /tap if Mom\\'s available/.test(src));
  ok("the local calendar cache keeps the flags", /coopMomDays:cv\.coopMomDays\|\|\{\}/.test(src));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
