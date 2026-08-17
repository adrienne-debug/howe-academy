/*
 * Node tests for Stage 4 slice 5: scheduleOverrides are saved as TARGETED per-date/kid
 * writes (diff against what this device last saw), never a whole-tree set. Runs the
 * real SO block + setSchedOverride.
 *
 *   run:  node test_sched_overrides.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

const a = src.indexOf("// SO_START"), b = src.indexOf("// SO_END");
if (a < 0 || b < 0) { console.error("SO markers not found"); process.exit(1); }
const block = src.slice(a, b);
function braceSlice(name) {
  const sig = "function " + name + "("; const i = src.indexOf(sig); if (i < 0) throw new Error("fn not found: " + name);
  let d = 0, j = src.indexOf("{", i);
  for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); } }
  throw new Error("unbalanced: " + name);
}
const fns = ["setSchedOverride", "schedOv"].map(braceSlice).join("\n");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}
const eq = (x, y) => JSON.stringify(x) === JSON.stringify(y);

function mkEnv(initial) {
  const env = {
    scheduleOverrides: JSON.parse(JSON.stringify(initial || {})),
    HA_LS: { setItem: () => {} }, writes: [],
    JSON, Object, Array, String, console,
  };
  env.db = { ref: p => ({ update: u => { env.writes.push({ p, kind: "update", u: JSON.parse(JSON.stringify(u)) }); }, set: v => { env.writes.push({ p, kind: "set", v }); } }) };
  vm.createContext(env);
  new vm.Script(block + "\n" + fns).runInContext(env);
  // simulate the listener having answered with `initial`
  vm.runInContext("_soBase=_soSnap(scheduleOverrides);", env);
  return env;
}
const base = () => ({
  "2026-08-20": { lincoln: { removed: { ws: true } }, lucy: { dayOff: true } },
  "2026-08-21": { ellis: { added: { mr: "pg 5" } } },
});

console.log("_soDiff — only what changed, per date/kid");
{
  const e = mkEnv({});
  const d1 = e._soDiff(base(), base());
  ok("identical → empty diff", eq(d1, {}));
  const cur = base(); cur["2026-08-20"].lincoln.removed.aas = true;
  ok("changed entry → that date/kid only", eq(Object.keys(e._soDiff(base(), cur)), ["2026-08-20/lincoln"]));
  const cur2 = base(); delete cur2["2026-08-21"].ellis;
  ok("removed kid entry → null at that path", eq(e._soDiff(base(), cur2), { "2026-08-21/ellis": null }));
  const cur3 = base(); delete cur3["2026-08-21"];
  ok("removed whole date → its kids nulled", eq(e._soDiff(base(), cur3), { "2026-08-21/ellis": null }));
  const cur4 = base(); cur4["2026-08-22"] = { julian: { dayOff: true } };
  ok("new date → added", eq(e._soDiff(base(), cur4), { "2026-08-22/julian": { dayOff: true } }));
  const cur5 = base(); cur5["2026-08-20"].lucy = {};
  ok("entry emptied to {} → null (never writes an empty object)", eq(e._soDiff(base(), cur5), { "2026-08-20/lucy": null }));
  ok("null/undefined inputs → no throw", eq(e._soDiff(null, undefined), {}));
}

console.log("saveScheduleOverrides — targeted multi-path update, never a whole-tree set");
{
  const e = mkEnv(base());
  e.scheduleOverrides["2026-08-20"].lincoln.removed.aas = true;
  e.saveScheduleOverrides();
  ok("one update on scheduleOverrides", e.writes.length === 1 && e.writes[0].kind === "update" && e.writes[0].p === "scheduleOverrides", e.writes);
  ok("payload = the changed date/kid only", eq(e.writes[0].u, { "2026-08-20/lincoln": { removed: { ws: true, aas: true } } }), e.writes[0].u);
  ok("no set() anywhere", !e.writes.some(w => w.kind === "set"));
  e.saveScheduleOverrides();
  ok("saving again with no change writes nothing", e.writes.length === 1);
  delete e.scheduleOverrides["2026-08-21"];
  e.saveScheduleOverrides();
  ok("deleting a date → null for its kid entry only", eq(e.writes[1].u, { "2026-08-21/ellis": null }));
}

console.log("stale device can no longer clobber another device's marks");
{
  // Device A saw {20:{lincoln}}; meanwhile device B added 21/ellis (A's listener hasn't fired).
  const e = mkEnv({ "2026-08-20": { lincoln: { removed: { ws: true } } } });
  // A parks lucy on 20
  e.setSchedOverride("2026-08-20", "lucy", o => { o.dayOff = true; });
  const u = e.writes[0].u;
  ok("A's write touches only 20/lucy", eq(Object.keys(u), ["2026-08-20/lucy"]) && u["2026-08-20/lucy"].dayOff === true, u);
  ok("B's 21/ellis is never named (would have been erased by the old whole-tree set)", !("2026-08-21/ellis" in u));
  // listener now delivers the merged tree → baseline refreshes
  vm.runInContext('scheduleOverrides={"2026-08-20":{lincoln:{removed:{ws:true}},lucy:{dayOff:true}},"2026-08-21":{ellis:{added:{mr:"pg 5"}}}}; _soBase=_soSnap(scheduleOverrides);', e);
  e.setSchedOverride("2026-08-20", "lucy", o => { delete o.dayOff; });
  ok("un-park after sync → null 20/lucy only, ellis untouched", eq(e.writes[1].u, { "2026-08-20/lucy": null }), e.writes[1].u);
}

console.log("first save before the listener has ever answered");
{
  const e = mkEnv({});
  vm.runInContext("_soBase=null; scheduleOverrides={'2026-08-20':{lincoln:{removed:{ws:true}}}};", e);
  e.saveScheduleOverrides();
  ok("adds/overwrites present entries, deletes nothing", eq(e.writes[0].u, { "2026-08-20/lincoln": { removed: { ws: true } } }));
}

console.log("setSchedOverride pruning still holds");
{
  const e = mkEnv({});
  e.setSchedOverride("2026-08-20", "lincoln", o => { o.removed = { ws: true }; });
  e.setSchedOverride("2026-08-20", "lincoln", o => { delete o.removed.ws; });
  ok("empties pruned → entry removed, null written", eq(e.scheduleOverrides, {}) && eq(e.writes[1].u, { "2026-08-20/lincoln": null }), e.writes);
  ok("schedOv reads null after prune", e.schedOv("2026-08-20", "lincoln") === null);
}

console.log("source — listener refreshes the baseline; no whole-tree set remains");
{
  ok("listener sets _soBase", /scheduleOverrides=s\.val\(\)\|\|\{\};\s*\n\s*_soBase=_soSnap\(scheduleOverrides\);/.test(src));
  ok("no db.ref(\"scheduleOverrides\").set left", !/db\.ref\("scheduleOverrides"\)\.set\(/.test(src));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
