/*
 * Node tests for REGEN IDEMPOTENCE (Stage 3c of the Grid/Scheduler restructure).
 *
 * A plan-backed subject's card is its lesson: id = <kid>_<planId>_<lid> — no date, no
 * counter. Re-generating the week on any day mints the SAME id for the same lesson, so
 * a check-off can never be stranded on a vanished date-id or stolen by a same-titled
 * card. These run the real code: gwPlanIds (LID_ID block) and gwCommit's re-attach
 * block (GWC_MATCH markers), sliced verbatim from index.html.
 *
 *   run:  node test_regen_idempotent.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

function sliceBlock(a, b) {
  const ia = src.indexOf(a), ib = src.indexOf(b);
  if (ia < 0 || ib < 0) { console.error("markers not found: " + a + " / " + b); process.exit(1); }
  return src.slice(ia, ib);
}
const idBlock = sliceBlock("// LID_ID_START", "// LID_ID_END");
const matchBlock = sliceBlock("// GWC_MATCH_START", "// GWC_MATCH_END");
if (!/function gwPlanIds\(/.test(idBlock)) { console.error("gwPlanIds not in LID_ID block"); process.exit(1); }
if (!/oldByLid/.test(matchBlock) || !/Keep-pass/.test(matchBlock)) { console.error("GWC_MATCH block missing pass 0 / keep-pass"); process.exit(1); }
if (!/gwPlanIds\(allTasks\)/.test(src)) { console.error("generateWeek does not call gwPlanIds"); process.exit(1); }

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ── gwPlanIds in a sandbox with plan-backed stubs ────────────────────────────
function mkIds(pb) {
  const env = {
    planBacked: (kid, sk) => !!(pb[kid + "|" + sk]),
    planIdFor: (kid, sk) => kid + "__" + sk,
    console,
  };
  vm.createContext(env);
  vm.runInContext(idBlock, env);
  return env;
}
const T = (id, who, sk, lid, day, title) => ({ id, who, subjectKey: sk, lid: lid || undefined, day: day || "monday", time: "10:00 AM", title: title || (sk + " — " + (lid || "x")) });

console.log("gwPlanIds — deterministic ids for plan-backed cards");
{
  const e = mkIds({ "lincoln|ws": true, "ellis|mr": true });
  const tasks = [
    T("2026d228_1", "lincoln", "ws", "L0007"),                 // plan-backed + lid → renamed
    T("2026d228_2", "lincoln", "ws", null),                    // no lid → untouched
    T("2026d228_3", "lincoln", "aas", "L0001"),                // not plan-backed → untouched
    T("2026d228_4_c", "lincoln", "ws", "L0002"),               // carry twin → untouched
    T("2026d229_5", "ellis", "mr", "L0011", "tuesday"),
    { id: "2026d229_retr_lincoln_drill", who: "lincoln", day: "tuesday", title: "Daily Drill" }, // no subjectKey
  ];
  const n = e.gwPlanIds(tasks);
  ok("renames exactly the plan-backed+lid cards", n === 2, n);
  ok("id = <kid>_<pid>_<lid>", tasks[0].id === "lincoln_lincoln__ws_L0007", tasks[0].id);
  ok("second kid/subject too", tasks[4].id === "ellis_ellis__mr_L0011", tasks[4].id);
  ok("no lid → untouched", tasks[1].id === "2026d228_2");
  ok("not plan-backed → untouched", tasks[2].id === "2026d228_3");
  ok("_c carry → untouched", tasks[3].id === "2026d228_4_c");
  ok("no subjectKey → untouched", tasks[5].id === "2026d229_retr_lincoln_drill");
  ok("only id changed (lid/day/title intact)", tasks[0].lid === "L0007" && tasks[0].day === "monday" && tasks[0].who === "lincoln");
  // idempotent
  const n2 = e.gwPlanIds(tasks);
  ok("running again changes nothing", n2 === 0 && tasks[0].id === "lincoln_lincoln__ws_L0007");
  // taskCounter regex must NOT see the new ids as counters
  const rx = /_(\d+)(?:_c)*$/;
  ok("taskCounter regex ignores plan ids", !rx.test(tasks[0].id) && !rx.test(tasks[4].id) && rx.test("2026d228_2"));
  ok("carry twin form still ends with _c", (tasks[0].id + "_c").endsWith("_c"));
  // baseId round trip
  const baseId = id => { let b = id; while (b.endsWith("_c")) b = b.slice(0, -2); return b; };
  ok("baseId(id+'_c') round-trips", baseId(tasks[0].id + "_c") === tasks[0].id);
  ok("no throw on empty / null", e.gwPlanIds([]) === 0 && e.gwPlanIds(null) === 0);
}
{
  const e = mkIds({ "lincoln|ws": true });
  const tasks = [T("2026d228_1", "lincoln", "ws", "L0007"), T("2026d229_2", "lincoln", "ws", "L0007", "tuesday")];
  const n = e.gwPlanIds(tasks);
  ok("same lid twice → first renamed, second keeps its date id (no collision)", n === 1 && tasks[0].id === "lincoln_lincoln__ws_L0007" && tasks[1].id === "2026d229_2", tasks.map(t => t.id));
  const ids = new Set(tasks.map(t => t.id));
  ok("ids stay unique", ids.size === 2);
}
{
  const e = mkIds({ "lincoln|ws": true });
  // planBacked throwing (e.g. currData not loaded) → card untouched, no throw
  e.planBacked = () => { throw new Error("boom"); };
  const tasks = [T("2026d228_1", "lincoln", "ws", "L0007")];
  let threw = false; try { e.gwPlanIds(tasks); } catch (er) { threw = true; }
  ok("planBacked throwing → untouched, no throw", !threw && tasks[0].id === "2026d228_1");
}

console.log("generate twice → same ids regardless of day/time/counter");
{
  const e = mkIds({ "lincoln|ws": true, "ellis|mr": true });
  const served = [["lincoln", "ws", "L0007"], ["lincoln", "ws", "L0008"], ["ellis", "mr", "L0011"]];
  const gen1 = served.map(([k, s, l], i) => T("2026d228_" + (i + 1), k, s, l, "monday"));
  const gen2 = served.map(([k, s, l], i) => T("2026d230_" + (i + 40), k, s, l, ["wednesday", "thursday", "friday"][i]));
  e.gwPlanIds(gen1); e.gwPlanIds(gen2);
  ok("identical id sets", eq(gen1.map(t => t.id), gen2.map(t => t.id)), [gen1.map(t => t.id), gen2.map(t => t.id)]);
  ok("ids carry no date", gen1.every(t => !/^\d{4}d\d+_/.test(t.id)));
}

// ── gwCommit's re-attach block, run against old/new weeks ────────────────────
// The block is sliced verbatim and wrapped so it runs on the given weekData / d.
const runMatch = new Function("weekData", "snapChecked", "snapHist", "d", "claimed", "lidForTask", "Date",
  matchBlock + "\n return {oldLookup, oldByLid};");
const NOW = 1_800_000_000_000;
const FakeDate = { now: () => NOW };
function commitMatch(oldTasks, checkedMap, histMap, newTasks, opts) {
  opts = opts || {};
  const weekData = { tasks: oldTasks };
  const snapChecked = Object.assign({}, checkedMap);
  const snapHist = JSON.parse(JSON.stringify(histMap || {}));
  const d = { tasks: newTasks.map(t => Object.assign({}, t)) };
  const lidForTask = opts.lidForTask || (t => t.lid || null);
  const claimed = opts.claimed || {};
  const r = runMatch(weekData, snapChecked, snapHist, d, claimed, lidForTask, FakeDate);
  // the GC that follows in gwCommit: purge checks whose id is not in the new set
  const commitIds = new Set(d.tasks.map(t => t.id));
  for (const id in snapChecked) { if (!commitIds.has(id)) delete snapChecked[id]; }
  for (const id in snapHist) { if (!commitIds.has(id)) delete snapHist[id]; }
  return { tasks: d.tasks, checked: snapChecked, hist: snapHist, r };
}
const TS = NOW - 60_000;

console.log("gwCommit re-attach — first regen after the switch (date ids → plan ids)");
{
  // Old week: date-id cards; L0003 was checked on Monday. New week (deterministic ids)
  // lands L0003 on Wednesday, and a same-titled card for a DIFFERENT lid comes first.
  const old = [
    T("2026d228_1", "lincoln", "ws", "L0003", "monday", "✍️ WS — pg 5"),
    T("2026d229_2", "lincoln", "ws", "L0004", "tuesday", "✍️ WS — pg 6"),
  ];
  const checked = { "2026d228_1": TS };
  const hist = { "2026d228_1": { id: "2026d228_1", title: "✍️ WS — pg 5", who: "lincoln", day: "monday", ts: TS, checkedOnDay: "monday" } };
  const neu = [
    T("lincoln_lincoln__ws_L0009", "lincoln", "ws", "L0009", "monday", "✍️ WS — pg 5"),  // same title, different lesson (a repeat in the list)
    T("lincoln_lincoln__ws_L0003", "lincoln", "ws", "L0003", "wednesday", "✍️ WS — pg 5"),
    T("lincoln_lincoln__ws_L0004", "lincoln", "ws", "L0004", "thursday", "✍️ WS — pg 6"),
  ];
  const out = commitMatch(old, checked, hist, neu);
  ok("check moved to the SAME lesson's plan id (not the same-titled earlier card)",
    out.checked["lincoln_lincoln__ws_L0003"] === TS && !out.checked["lincoln_lincoln__ws_L0009"], out.checked);
  ok("history copied onto the new id, keeps checkedOnDay", out.hist["lincoln_lincoln__ws_L0003"] && out.hist["lincoln_lincoln__ws_L0003"].id === "lincoln_lincoln__ws_L0003" && out.hist["lincoln_lincoln__ws_L0003"].checkedOnDay === "monday");
  ok("old date-id card NOT kept as a duplicate", !out.tasks.some(t => t.id === "2026d228_1"), out.tasks.map(t => t.id));
  ok("old date-id check GC'd", !out.checked["2026d228_1"]);
  ok("unchecked lesson has no check", !out.checked["lincoln_lincoln__ws_L0004"]);
}

console.log("gwCommit re-attach — second regen (plan ids both sides) is a no-op for checks");
{
  const old = [
    T("lincoln_lincoln__ws_L0003", "lincoln", "ws", "L0003", "monday", "✍️ WS — pg 5"),
    T("lincoln_lincoln__ws_L0004", "lincoln", "ws", "L0004", "tuesday", "✍️ WS — pg 6"),
  ];
  const checked = { "lincoln_lincoln__ws_L0003": TS };
  const hist = { "lincoln_lincoln__ws_L0003": { id: "lincoln_lincoln__ws_L0003", ts: TS, checkedOnDay: "monday" } };
  // regen moves L0003 to friday (a day-move) and drops L0004 for a new lesson L0005
  const neu = [
    T("lincoln_lincoln__ws_L0003", "lincoln", "ws", "L0003", "friday", "✍️ WS — pg 5"),
    T("lincoln_lincoln__ws_L0005", "lincoln", "ws", "L0005", "monday", "✍️ WS — pg 7"),
  ];
  const out = commitMatch(old, checked, hist, neu);
  ok("check survives a day-move (same id)", out.checked["lincoln_lincoln__ws_L0003"] === TS);
  ok("history untouched", out.hist["lincoln_lincoln__ws_L0003"] && out.hist["lincoln_lincoln__ws_L0003"].checkedOnDay === "monday");
  ok("no duplicate cards", out.tasks.length === 2 && new Set(out.tasks.map(t => t.id)).size === 2, out.tasks.map(t => t.id));
  ok("new lesson unchecked", !out.checked["lincoln_lincoln__ws_L0005"]);
  // run the very same commit again → byte-identical
  const out2 = commitMatch(out.tasks, out.checked, out.hist, neu);
  ok("idempotent: commit twice → same checked/hist", eq(out2.checked, out.checked) && eq(out2.hist, out.hist));
}

console.log("gwCommit re-attach — keep-pass, carries, id-less cards");
{
  // A DONE lesson the regen no longer serves (list−done advanced past it) keeps its card.
  const old = [
    T("lincoln_lincoln__ws_L0003", "lincoln", "ws", "L0003", "monday", "✍️ WS — pg 5"),
    T("lincoln_lincoln__ws_L0004", "lincoln", "ws", "L0004", "tuesday", "✍️ WS — pg 6"),
  ];
  const checked = { "lincoln_lincoln__ws_L0003": TS };
  const neu = [T("lincoln_lincoln__ws_L0004", "lincoln", "ws", "L0004", "wednesday", "✍️ WS — pg 6")];
  const out = commitMatch(old, checked, {}, neu);
  ok("done-but-not-served lesson keeps its original card", out.tasks.some(t => t.id === "lincoln_lincoln__ws_L0003") && out.checked["lincoln_lincoln__ws_L0003"] === TS);
  ok("exactly two cards, no dup", out.tasks.length === 2);
}
{
  // Old check on a plan id whose lid the regen serves under a NEW plan id? Impossible by
  // construction (lid ↔ id), but an id-LESS old card (pre-1.2) still re-attaches by title.
  const old = [T("2026d228_1", "lincoln", "ws", null, "monday", "✍️ WS — pg 5")];
  const checked = { "2026d228_1": TS };
  const neu = [T("lincoln_lincoln__ws_L0003", "lincoln", "ws", "L0003", "monday", "✍️ WS — pg 5")];
  const out = commitMatch(old, checked, {}, neu, { lidForTask: t => t.lid || null });
  ok("id-less old card re-attaches by title+who+day", out.checked["lincoln_lincoln__ws_L0003"] === TS);
}
{
  // A _c carry twin is never re-attached by lid (its own pass runs later in gwCommit).
  const old = [T("2026d200_9_c", "lincoln", "ws", "L0003", "monday", "✍️ WS — pg 5")];
  const checked = { "2026d200_9_c": TS };
  const neu = [T("lincoln_lincoln__ws_L0003", "lincoln", "ws", "L0003", "tuesday", "✍️ WS — pg 5")];
  const out = commitMatch(old, checked, {}, neu);
  ok("_c twin's check does not jump onto the fresh plan card by lid", !out.r.oldByLid["lincoln|ws|L0003"]);
}
{
  // Stale check (older than 7 days) never bleeds across weeks.
  const old = [T("2026d200_1", "lincoln", "ws", "L0003", "monday", "✍️ WS — pg 5")];
  const checked = { "2026d200_1": NOW - 8 * 24 * 3600 * 1000 };
  const neu = [T("lincoln_lincoln__ws_L0003", "lincoln", "ws", "L0003", "monday", "✍️ WS — pg 5")];
  const out = commitMatch(old, checked, {}, neu);
  ok("stale (>7d) check not re-attached", !out.checked["lincoln_lincoln__ws_L0003"]);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
