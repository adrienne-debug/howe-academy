/*
 * Node tests — pinning days retires the legacy `days` string (her "yes" 2026-09-14).
 * Live case: AAS with every day allowed (allowedDays cleared) still ran Tue/Thu/Fri because the
 * Builder's form fell back to the Excel-era `days:"Tue,Thu,Fri"` left on the subject.
 *   run:  node test_daypin_legacy.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(name) { const sig = "function " + name + "("; const i = src.indexOf(sig); if (i < 0) throw new Error("fn " + name); let d = 0, j = src.indexOf("{", i); for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); } } throw new Error("unbalanced " + name); }
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); } }
const eq = (x, y) => JSON.stringify(x) === JSON.stringify(y);
function world(subject) {
  const log = { writes: [], removes: [] };
  const env = {
    currData: { subjects: { lincoln: { aas: subject } } }, cbKid: "lincoln", cbSubjKey: "aas", cbDayPinScroll: 0,
    db: { ref: p => ({ set: v => { log.writes.push([p, v]); }, remove: () => { log.removes.push(p); } }) },
    document: { getElementById: () => null }, planBacked: () => false, renderAll: () => {}, Date, Object, Array, String, JSON,
  };
  const keys = Object.keys(env);
  const api = new Function(...keys, "\"use strict\";" + slice("cbPinDay") + "\n" + slice("cbDefaultForm") + "; return {cbPinDay, cbDefaultForm};")(...keys.map(k => env[k]));
  return { api, log, subject };
}
console.log("── un-pinning the last day means ANY day, not the old string ──");
{
  const w = world({ display: "AAS Lesson", days: "Tue,Thu,Fri", allowedDays: ["Tue"], timesPerWeek: 3, pacing: { mode: "timesPerWeek", tpw: 3 } });
  w.api.cbPinDay("aas", "Tue");
  ok("allowedDays written as an empty list", eq(w.log.writes.find(x => /allowedDays/.test(x[0])), ["curriculum/subjects/lincoln/aas/allowedDays", []]), w.log.writes);
  ok("the legacy days string is removed from the record", w.log.removes.indexOf("curriculum/subjects/lincoln/aas/days") >= 0 && w.subject.days === undefined, w.log.removes);
  ok("the Builder's form now reads ANY day (empty), not Tue/Thu/Fri", eq(w.api.cbDefaultForm("lincoln", "aas").allowedDays, []), w.api.cbDefaultForm("lincoln", "aas").allowedDays);
}
{
  const w = world({ display: "AAS Lesson", days: "Tue,Thu,Fri", allowedDays: ["Tue"], timesPerWeek: 3 });
  w.api.cbPinDay("aas", "Mon");
  ok("pinning a day ON also retires the string (the pinned set is the one truth)", eq(w.subject.allowedDays, ["Tue", "Mon"]) && w.log.removes.length === 1);
}
{
  const w = world({ display: "Plain", allowedDays: ["Mon"], timesPerWeek: 1 });
  w.api.cbPinDay("aas", "Mon");
  ok("no legacy string → nothing to remove", w.log.removes.length === 0 && eq(w.subject.allowedDays, []));
}
{
  const w = world({ display: "Never built", days: "Mon,Wed" });
  ok("a never-pinned subject still gets its legacy days as the form's fallback", eq(w.api.cbDefaultForm("lincoln", "aas").allowedDays, ["Mon", "Wed"]));
}console.log("\n── the Rebuild itself retires the string (the form chips are the day set) ──");
{
  ok("cbApply writes days:null alongside allowedDays", /up\["subjects\/"\+kid\+"\/"\+sk\+"\/allowedDays"\]=cbForm\.allowedDays;[\s\S]{0,700}up\["subjects\/"\+kid\+"\/"\+sk\+"\/days"\]=null;/.test(src));
  ok("…and snapshots it for undo", /snap\("subjects\/"\+kid\+"\/"\+sk\+"\/days",s\.days\);/.test(src));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
