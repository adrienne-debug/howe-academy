/*
 * The grid audit's "Add it back…" hand-off (gvAuditFixGap), re-connected 2026-09-04.
 * Pins its write set: it may touch ONLY the subject's list paths — lessonSeq, lessonIds,
 * total, nextLid — plus lastEdit, and then open a Builder PREVIEW. It must never name a
 * grid cell (lessons/…), never change any row in memory, and never Apply. Runs the real code.
 *
 *   run:  node test_grid_audit_gapfix.js
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
function lineOf(prefix) { const i = src.indexOf(prefix); if (i < 0) throw new Error("line not found: " + prefix); return src.slice(i, src.indexOf("\n", i)); }
const code = [lineOf("const _gaDash="), lineOf("const _gaNorm="), lineOf("const _lidNorm=")].join("\n") + "\n" +
  ["_lidMake", "_lidNextFrom", "_lidAlign", "lidsFor", "setLessonSeq", "gvAuditFixGap"].map(braceSlice).join("\n");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

function mkEnv(o) {
  o = o || {};
  const seq = o.seq || ["pg 1", "pg 2", "pg 5", "pg 6"];
  const ids = o.noIds ? undefined : seq.map((_, i) => "L" + String(i + 1).padStart(4, "0"));
  const sub = { display: "Editor in Chief", lessonSeq: o.noList ? undefined : seq, lessonIds: ids, nextLid: ids ? ids.length + 1 : 1, total: seq.length, planId: "lincoln__conventions" };
  const lessons = { "10": { date: "2026-09-08", week: 21, conventions: "pg 2" }, "11": { date: "2026-09-09", week: 21, conventions: "pg 5" }, "12": { date: "2026-09-10", week: 21, conventions: "pg 6" } };
  const env = {
    currData: { subjects: { lincoln: { conventions: sub } }, lessons: { lincoln: JSON.parse(JSON.stringify(lessons)) } },
    lessonsBefore: JSON.stringify(lessons),
    momModeActive: o.mom !== false, adminPinUnlocked: false,
    updates: [], alerts: [], toasts: [], opened: [], previews: 0,
    prompt: () => (o.label === undefined ? "pg 3–4" : o.label), confirm: () => (o.confirm !== false),
    alert: m => { env.alerts.push(m); }, gwShowToast: m => { env.toasts.push(m); },
    cbOpenSubj: sk => { env.opened.push(sk); }, cbRunPreview: () => { env.previews++; },
    cbKid: null, adminSubTab: null, currInnerTab: null,
    Date, Math, Object, JSON, String, Number, Array, parseInt, console, RegExp,
  };
  env.db = o.db === null ? null : { ref: p => ({ update: u => { env.updates.push({ p, u: JSON.parse(JSON.stringify(u)) }); return { catch: () => {} }; } }) };
  env.window = env;
  vm.createContext(env);
  new vm.Script(code).runInContext(env);
  return env;
}

console.log("happy path — insert 'pg 3–4' after 'pg 2'");
{
  const e = mkEnv();
  e.gvAuditFixGap("lincoln", "conventions", 10, "pg 2", "3–4");
  ok("exactly one write, to curriculum", e.updates.length === 1 && e.updates[0].p === "curriculum", e.updates.map(u => u.p));
  const keys = Object.keys((e.updates[0] || {}).u || {});
  const allowed = k => /^subjects\/lincoln\/conventions\/(lessonSeq|lessonIds|total|nextLid)$/.test(k) || k === "lastEdit";
  ok("every path is a list path or lastEdit", keys.length > 0 && keys.every(allowed), keys);
  ok("no path names a grid cell (lessons/…)", keys.every(k => k.indexOf("lessons/") !== 0));
  const u = e.updates[0].u;
  ok("list now reads pg 1 · pg 2 · pg 3–4 · pg 5 · pg 6", JSON.stringify(u["subjects/lincoln/conventions/lessonSeq"]) === JSON.stringify(["pg 1", "pg 2", "pg 3–4", "pg 5", "pg 6"]), u["subjects/lincoln/conventions/lessonSeq"]);
  ok("ids stay aligned with the list (one new id minted, others kept)", (() => { const ids = u["subjects/lincoln/conventions/lessonIds"]; return Array.isArray(ids) && ids.length === 5 && ids[0] === "L0001" && ids[1] === "L0002" && ids[3] === "L0003" && ids[4] === "L0004" && !["L0001","L0002","L0003","L0004"].includes(ids[2]); })(), u["subjects/lincoln/conventions/lessonIds"]);
  ok("total = 5", u["subjects/lincoln/conventions/total"] === 5);
  ok("grid rows in memory untouched", JSON.stringify(e.currData.lessons.lincoln) === e.lessonsBefore);
  ok("hands off to a Builder PREVIEW of this subject (no Apply)", e.opened.length === 1 && e.opened[0] === "conventions" && e.previews === 1);
  ok("toast says review then Apply", /review/.test(e.toasts[0] || "") && /Apply/.test(e.toasts[0] || ""), e.toasts);
  ok("no alert", e.alerts.length === 0, e.alerts);
}

console.log("refusals — nothing written");
{
  const e = mkEnv({ noList: true });
  e.gvAuditFixGap("lincoln", "conventions", 10, "pg 2", "3–4");
  ok("no master list → explains 'Capture from the grid', writes nothing", e.updates.length === 0 && /Capture from the grid/.test(e.alerts[0] || ""), e.alerts);
  const e2 = mkEnv({ label: null });
  e2.gvAuditFixGap("lincoln", "conventions", 10, "pg 2", "3–4");
  ok("prompt cancelled → nothing written, no preview", e2.updates.length === 0 && e2.previews === 0);
  const e3 = mkEnv({ confirm: false });
  e3.gvAuditFixGap("lincoln", "conventions", 10, "pg 2", "3–4");
  ok("confirm declined → nothing written, no preview", e3.updates.length === 0 && e3.previews === 0);
  const e4 = mkEnv();
  e4.gvAuditFixGap("lincoln", "conventions", 10, "pg 99", "3–4");
  ok("'after' not in the list → alert, nothing written", e4.updates.length === 0 && /disagree/.test(e4.alerts[0] || ""), e4.alerts);
  const e5 = mkEnv({ mom: false });
  e5.gvAuditFixGap("lincoln", "conventions", 10, "pg 2", "3–4");
  ok("kid mode → no-op", e5.updates.length === 0 && e5.previews === 0);
  const e6 = mkEnv({ label: "   " });
  e6.gvAuditFixGap("lincoln", "conventions", 10, "pg 2", "3–4");
  ok("blank label → nothing written", e6.updates.length === 0);
}

console.log("no id list yet — list written, ids stay absent (never guessed)");
{
  const e = mkEnv({ noIds: true });
  e.gvAuditFixGap("lincoln", "conventions", 10, "pg 2", "3–4");
  const u = (e.updates[0] || {}).u || {};
  ok("lessonSeq written with the insert", Array.isArray(u["subjects/lincoln/conventions/lessonSeq"]) && u["subjects/lincoln/conventions/lessonSeq"].length === 5);
  ok("no lessonIds invented", !Array.isArray(u["subjects/lincoln/conventions/lessonIds"]), u["subjects/lincoln/conventions/lessonIds"]);
  ok("still no grid path", Object.keys(u).every(k => k.indexOf("lessons/") !== 0));
}

console.log("source — the only cell-nulling code is behind Apply / explicit cell actions");
{
  const fn = braceSlice("gvAuditFixGap");
  ok("gvAuditFixGap never references lessons/ paths or cbApply", fn.indexOf('"lessons/"') < 0 && fn.indexOf("cbApply(") < 0);
  ok("gap row renders the button again", /gvAuditFixGap\(\\''\+kid\+'\\',\\''\+f\.sk\+'\\','\+f\.dn\+'/.test(src));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
