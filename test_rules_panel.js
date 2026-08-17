/*
 * Node tests for Stage 6a: the ⚙ Rules panel is the ONE door for every placement rule.
 * Renders the real cbRenderRules and asserts each legacy card control has a home:
 * rule tokens (sequential / max1 — no-fri / mon-thu retired in 6c-1) and per-subject Max/day (wk + Sat).
 *
 *   run:  node test_rules_panel.js
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
const code = ["cbRenderRules", "rulesUpdateMax"].map(braceSlice).join("\n");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

function mkEnv() {
  const env = {
    currData: { subjects: { lincoln: {
      ws: { display: "Wordsmith", rules: "sequential,no-fri", minutes: 20, mom: "none", device: "paper", pacing: { mode: "timesPerWeek", tpw: 3 }, planId: "lincoln__ws", doneImportedAt: 1, lessonIds: ["L0001"] },
      reflex: { display: "Reflex", rules: "max1,first", minutes: 10, tracking: "daily" },
    } } },
    rulesData: { maxPerDay: { "Wordsmith": { max: 2, saturday_max: 1 } } },
    DEFAULT_DAY_CAP: 2, KID_COLOR: { lincoln: "#123456" }, CURR_DEV_EMOJI: {}, CURR_DEV_LABEL: {},
    cbKid: "lincoln", cbRulesOpen: true, cbDayPinScroll: 0, cbGroupEdit: null,
    planBacked: (k, sk) => !!(env.currData.subjects[k][sk] || {}).planId,
    lidsFor: () => ["L0001"],
    cbDayCap: () => 5, cbAltGroups: () => [], cbOverCapDays: () => [], cbGroupOf: () => null,
    esc: x => String(x), cap: x => x, disp: sk => (env.currData.subjects.lincoln[sk] || {}).display || sk,
    saved: null, saveRules: r => { env.saved = r; },
    document: { getElementById: () => null },
    cbNewGroup: (function(){ try{ return null; }catch(e){ return null; } })(),
    JSON, Object, Array, String, Number, Math, parseInt, console,
  };
  vm.createContext(env);
  new vm.Script(code).runInContext(env);
  return env;
}

console.log("cbRenderRules — Rules + Max/day columns");
{
  const e = mkEnv();
  let h = "";
  try { h = e.cbRenderRules("#123456"); } catch (er) { ok("renders without throwing", false, String(er)); }   // arg = kid colour; kid comes from cbKid
  if (h) {
    ok("renders", typeof h === "string" && h.length > 200);
    ok("header has Rules and Max/day columns", h.indexOf(">Rules<") >= 0 && h.indexOf(">Max/day<") >= 0);
    ok("token chips wired to rlSet rulesTok for sequential + max1", ["sequential", "max1"].every(t => h.indexOf("rlSet('lincoln','ws','rulesTok','" + t + "'") >= 0));
    ok("no-fri / mon-thu chips are GONE (6c-1: Days pins are the one door)", h.indexOf("rulesTok','no-fri'") < 0 && h.indexOf("rulesTok','mon-thu'") < 0);
    // selected state: ws has sequential + no-fri on
    const iW = h.indexOf('title="Wordsmith"'), iR = h.indexOf('title="Reflex"');
    const wsRow = iW > iR ? h.slice(iW) : h.slice(iW, iR);
    const onChips = (wsRow.match(/rulesTok','(sequential|no-fri|mon-thu|max1)',(?:true|false)\)" style="[^"]*background:#123456/g) || []).map(m => m.match(/rulesTok','([a-z0-9-]+)'/)[1]);
    ok("selected tokens highlighted (sequential on; max1 off)", onChips.sort().join(",") === "sequential", onChips);
    ok("Max/day inputs wired to rulesUpdateMax by DISPLAY name, prefilled 2 / 1", wsRow.indexOf("rulesUpdateMax('Wordsmith','max',this.value)") >= 0 && wsRow.indexOf("rulesUpdateMax('Wordsmith','saturday_max',this.value)") >= 0 && /value="2" placeholder="wk"/.test(wsRow) && /value="1" placeholder="Sat"/.test(wsRow));
    const rfRow = iR > iW ? h.slice(iR) : h.slice(iR, iW);
    ok("subject with no Max/day entry renders blank inputs", /value="" placeholder="wk"/.test(rfRow) && /value="" placeholder="Sat"/.test(rfRow));
    // rulesUpdateMax still writes the same shape
    e.rulesUpdateMax("Wordsmith", "max", "3");
    ok("rulesUpdateMax('Wordsmith','max',3) → saveRules with maxPerDay.Wordsmith.max=3, Sat kept", e.saved && e.saved.maxPerDay.Wordsmith.max === 3 && e.saved.maxPerDay.Wordsmith.saturday_max === 1);
    e.rulesUpdateMax("Wordsmith", "saturday_max", "");
    ok("blank → null", e.saved.maxPerDay.Wordsmith.saturday_max === null);
  }
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
