/*
 * Node tests for projectPlans — the pure placement engine (Stage 3.1 of the
 * Grid/Scheduler restructure). Extracts the PROJ block verbatim (plus _cbSpread,
 * which it reuses) and checks the properties a live view depends on:
 * determinism, nothing dropped, order kept, backlog absorbed only up to the cap,
 * cap 1 slides everything, off/blocked days respected, tpw spread = _cbSpread,
 * day-minute cap across subjects in priority order, ISO week math.
 *
 *   run:  node test_projection.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// PROJ_START"), b = src.indexOf("// PROJ_END");
if (a < 0 || b < 0) { console.error("PROJ markers not found"); process.exit(1); }
function extractFn(name) {
  const start = src.search(new RegExp("^function\\s+" + name + "\\s*\\(", "m"));
  let i = src.indexOf("{", start), depth = 0;
  for (let j = i; j < src.length; j++) { const c = src[j]; if (c === "{") depth++; else if (c === "}") { depth--; if (!depth) return src.slice(start, j + 1); } }
  throw new Error("fn " + name);
}
const env = { console, Date, Math, Object, Array, String, Number, JSON, parseInt };
vm.createContext(env);
new vm.Script(extractFn("_cbSpread") + "\n" + src.slice(a, b)).runInContext(env);
const P = env.projectPlans;

let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); } }
const eq = (x, y) => JSON.stringify(x) === JSON.stringify(y);

// calendar: Mon–Fri school days from 2026-08-03 for N weeks
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function cal(startISO, weeks, offDates) {
  const out = []; const t0 = Date.UTC(+startISO.slice(0, 4), +startISO.slice(5, 7) - 1, +startISO.slice(8, 10));
  for (let d = 0; d < weeks * 7; d++) { const dt = new Date(t0 + d * 86400000); const dow = dt.getUTCDay(); if (dow === 0 || dow === 6) continue; const iso = dt.toISOString().slice(0, 10); out.push({ date: iso, dow: DOW[dow], off: !!(offDates && offDates[iso]) }); }
  return out;
}
const L = (n, pfx) => Array.from({ length: n }, (_, i) => ({ lid: "L" + String(i + 1).padStart(4, "0"), text: (pfx || "L") + (i + 1) }));
const flat = (out, kid, pid) => Object.keys(out.byDate).sort().flatMap(d => (out.byDate[d][kid] || []).filter(x => !pid || x.pid === pid).map(x => ({ d, lid: x.lid, b: x.backlog })));

console.log("basics");
{
  const inp = { todayISO: "2026-08-17", calendar: { lincoln: cal("2026-08-03", 6) }, plans: [{ pid: "lincoln__mr", kid: "lincoln", sk: "mr", lessons: L(6), allowedDays: ["Mon", "Wed", "Fri"] }] };
  const o = P(inp), o2 = P(JSON.parse(JSON.stringify(inp)));
  ok("deterministic: same input twice → identical output", eq(o, o2));
  const f = flat(o, "lincoln");
  ok("every lesson placed exactly once, in order, on allowed days only, from today", f.length === 6 && eq(f.map(x => x.lid), L(6).map(x => x.lid)) && f.every(x => x.d >= "2026-08-17") && eq(f.map(x => x.d), ["2026-08-17", "2026-08-19", "2026-08-21", "2026-08-24", "2026-08-26", "2026-08-28"]));
  ok("stats: placed 6, unplaced 0, first/last", o.plans["lincoln__mr"].placed === 6 && o.plans["lincoln__mr"].unplaced === 0 && o.plans["lincoln__mr"].firstDate === "2026-08-17" && o.plans["lincoln__mr"].lastDate === "2026-08-28");
  ok("no owed without an anchor; no backlog flags", o.plans["lincoln__mr"].owed === 0 && f.every(x => !x.b));
  ok("ISO-only: no Date.now / local time in block", !/Date\.now\(|new Date\(\)|toLocale|getDay\(\)|getDate\(\)|getMonth\(\)/.test(src.slice(a, b)));
}

console.log("times-per-week spread");
{
  const inp = { todayISO: "2026-08-17", calendar: { k: cal("2026-08-17", 2) }, plans: [{ pid: "p", kid: "k", sk: "s", lessons: L(6), allowedDays: [], tpw: 3 }] };
  const f = flat(P(inp), "k");
  ok("tpw 3 on 5 allowed days → Mon/Wed/Fri each week (= _cbSpread)", eq(f.map(x => x.d), ["2026-08-17", "2026-08-19", "2026-08-21", "2026-08-24", "2026-08-26", "2026-08-28"]));
  const inp2 = { todayISO: "2026-08-17", calendar: { k: cal("2026-08-17", 4) }, plans: [{ pid: "p", kid: "k", sk: "s", lessons: L(4), allowedDays: [], targetDate: "2026-09-11" }] };
  const o2 = P(inp2);
  ok("targetDate → tpw auto = ceil(4 lessons / 4 weeks) = 1 per week", o2.plans.p.tpwUsed === 1 && eq(flat(o2, "k").map(x => x.d), ["2026-08-17", "2026-08-24", "2026-08-31", "2026-09-07"]));
}

console.log("her backlog rule — owed, cap, slide");
{
  // anchor 8/3, Mon/Wed/Fri: pattern days before today (8/17) = 6; done since anchor = 4 → owed 2
  const base = { todayISO: "2026-08-17", calendar: { k: cal("2026-08-03", 6) } };
  const mk = cap => ({ ...base, plans: [{ pid: "p", kid: "k", sk: "s", lessons: L(6), allowedDays: ["Mon", "Wed", "Fri"], cap, anchor: "2026-08-03", doneSince: 4 }] });
  const o1 = P(mk(1)); const f1 = flat(o1, "k");
  ok("owed computed = 2 (6 pattern days − 4 done)", o1.plans.p.owed === 2);
  ok("cap 1: everything slides in order, one per pattern day, first two flagged backlog", eq(f1.map(x => x.d), ["2026-08-17", "2026-08-19", "2026-08-21", "2026-08-24", "2026-08-26", "2026-08-28"]) && f1[0].b && f1[1].b && !f1[2].b);
  const o2 = P(mk(2)); const f2 = flat(o2, "k");
  ok("cap 2: Mon takes L1+L2 (one extra), Wed takes L3+L4 (one extra), then normal load", eq(f2.map(x => x.d + ":" + x.lid), ["2026-08-17:L0001", "2026-08-17:L0002", "2026-08-19:L0003", "2026-08-19:L0004", "2026-08-21:L0005", "2026-08-24:L0006"]) && f2.filter(x => x.b).length === 2);
  const o3 = P(mk(3)); const f3 = flat(o3, "k");
  ok("cap 3: Mon takes L1+L2+L3 (two extras absorb both owed at once), rest normal", eq(f3.map(x => x.d + ":" + x.lid), ["2026-08-17:L0001", "2026-08-17:L0002", "2026-08-17:L0003", "2026-08-19:L0004", "2026-08-21:L0005", "2026-08-24:L0006"]));
  ok("order never violated under any cap", [f1, f2, f3].every(f => eq(f.map(x => x.lid), L(6).map(x => x.lid))));
  const o4 = P({ ...base, plans: [{ pid: "p", kid: "k", sk: "s", lessons: L(6), allowedDays: ["Mon", "Wed", "Fri"], cap: 2, anchor: "2026-08-03", doneSince: 9 }] });
  ok("ahead of pace → owed clamps to 0", o4.plans.p.owed === 0);
  const o5 = P({ ...base, plans: [{ pid: "p", kid: "k", sk: "s", lessons: L(2), allowedDays: ["Mon", "Wed", "Fri"], cap: 1, anchor: "2026-08-03", doneSince: 0 }] });
  ok("owed never exceeds remaining lessons", o5.plans.p.owed === 2);
}

console.log("off / blocked days, horizon");
{
  const off = { "2026-08-19": true };
  const o = P({ todayISO: "2026-08-17", calendar: { k: cal("2026-08-17", 3, off) }, plans: [{ pid: "p", kid: "k", sk: "s", lessons: L(4), allowedDays: ["Mon", "Wed", "Fri"], offDates: { "2026-08-24": true } }], blocked: { k: { s: { "2026-08-21": true } } } });
  ok("kid-off (8/19), subject ✕ (8/24) and blocked (8/21) days take nothing; lessons slide", eq(flat(o, "k").map(x => x.d), ["2026-08-17", "2026-08-26", "2026-08-28", "2026-08-31"]));
  const o2 = P({ todayISO: "2026-08-17", calendar: { k: cal("2026-08-17", 1) }, plans: [{ pid: "p", kid: "k", sk: "s", lessons: L(9), allowedDays: [] }] });
  ok("past the horizon → unplaced counted + warning, nothing silently dropped", o2.plans.p.placed === 5 && o2.plans.p.unplaced === 4 && o2.warnings.length === 1);
}

console.log("day-minute cap across subjects, priority order");
{
  const o = P({ todayISO: "2026-08-17", calendar: { k: cal("2026-08-17", 1) }, dayCapMin: { k: 40 }, plans: [
    { pid: "low", kid: "k", sk: "a", lessons: L(2, "A"), allowedDays: ["Mon"], minutes: 30, priority: 1 },
    { pid: "high", kid: "k", sk: "b", lessons: L(1, "B"), allowedDays: ["Mon"], minutes: 30, priority: 5 }] });
  const mon = (o.byDate["2026-08-17"] || {}).k || [];
  ok("higher priority placed first; lower skips a full day (30+30>40)", mon.length === 1 && mon[0].pid === "high" && o.plans.low.placed === 0 && o.plans.low.unplaced === 2);
  ok("plans keyed in output; multiple kids independent", (() => { const o2 = P({ todayISO: "2026-08-17", calendar: { a: cal("2026-08-17", 1), b: cal("2026-08-17", 1) }, plans: [{ pid: "a__s", kid: "a", sk: "s", lessons: L(1) }, { pid: "b__s", kid: "b", sk: "s", lessons: L(1) }] }); return o2.byDate["2026-08-17"].a.length === 1 && o2.byDate["2026-08-17"].b.length === 1; })());
}

// ── Mom's hand-added days (Stage 2 slice A) ────────────────────────────────
// ➕ make-up and a ➡ move's landing day write scheduleOverrides…added. They are an INPUT
// she created: extra sittings on top of the pattern, never thinned by tpw or filtered by
// allowedDays. Before this the projection never read them and dropped every one.
console.log("hand-added days");
{
  const C = cal("2026-08-17", 2);                       // Mon 8/17 .. Fri 8/28, 10 school days
  const base = { todayISO: "2026-08-17", calendar: { k: C } };
  const mk = extra => Object.assign({ pid: "k__s", kid: "k", sk: "s", lessons: L(10), tpw: 2,
    allowedDays: ["Mon", "Tue"] }, extra || {});

  const noAdd = P(Object.assign({}, base, { plans: [mk()] }));
  const dates0 = Object.keys(noAdd.byDate).sort();
  ok("without added days, only allowed days are used",
    dates0.every(d => ["Mon", "Tue"].includes(DOW[new Date(d + "T00:00:00Z").getUTCDay()])), dates0);

  const withAdd = P(Object.assign({}, base, { plans: [mk()], added: { k: { s: { "2026-08-20": 1 } } } }));
  const dates1 = Object.keys(withAdd.byDate).sort();
  ok("a hand-added Thursday gets a lesson even though only Mon/Tue are allowed",
    dates1.includes("2026-08-20"), dates1);
  ok("the added day does not duplicate or drop anything",
    flat(withAdd, "k").length === flat(noAdd, "k").length ||
    flat(withAdd, "k").map(x => x.lid).join() === L(10).map(x => x.lid).join().slice(0, flat(withAdd, "k").map(x => x.lid).join().length));
  ok("lessons stay in list order across the added day",
    (() => { const ls = flat(withAdd, "k").map(x => x.lid); return ls.join() === ls.slice().sort().join(); })(),
    flat(withAdd, "k").map(x => x.lid));

  // tpw must not thin it: 2 allowed days/week + an added day = 3 sittings that week
  const wk1 = flat(withAdd, "k").filter(x => x.d >= "2026-08-17" && x.d <= "2026-08-21").length;
  ok("tpw does not thin a hand-added day (2/wk + 1 added = 3)", wk1 === 3, wk1);

  // an added day that is OFF, or ✕'d for this subject, still takes nothing
  const offCal = cal("2026-08-17", 2, { "2026-08-20": 1 });
  const addOff = P({ todayISO: "2026-08-17", calendar: { k: offCal }, plans: [mk()], added: { k: { s: { "2026-08-20": 1 } } } });
  ok("an added day the kid is OFF takes nothing", !addOff.byDate["2026-08-20"]);
  const addBlocked = P(Object.assign({}, base, { plans: [mk()], added: { k: { s: { "2026-08-20": 1 } } }, blocked: { k: { s: { "2026-08-20": 1 } } } }));
  ok("an added day ✕'d for this subject takes nothing", !addBlocked.byDate["2026-08-20"]);

  // an added day already in the pattern is not counted twice
  const addDup = P(Object.assign({}, base, { plans: [mk()], added: { k: { s: { "2026-08-17": 1 } } } }));
  ok("an added day already in the pattern places one lesson, not two",
    (addDup.byDate["2026-08-17"].k || []).length === 1, (addDup.byDate["2026-08-17"].k || []).length);

  // added days for ANOTHER subject never leak in
  const addOther = P(Object.assign({}, base, { plans: [mk()], added: { k: { other: { "2026-08-20": 1 } } } }));
  ok("an added day belonging to a different subject is ignored", !addOther.byDate["2026-08-20"]);

  ok("no added input leaves placement byte-identical (regression)",
    eq(flat(P(Object.assign({}, base, { plans: [mk()] })), "k"), flat(noAdd, "k")));
  ok("the engine leaves no _added residue on the caller's plan object",
    (() => { const p1 = mk(); P(Object.assign({}, base, { plans: [p1], added: { k: { s: { "2026-08-20": 1 } } } })); return !("_added" in p1) && !("_blocked" in p1); })());
}

console.log("week key math");
{
  ok("_pjWeekKey: Sunday belongs to the week starting the previous Monday", env._pjWeekKey("2026-08-23") === "2026-08-17" && env._pjWeekKey("2026-08-17") === "2026-08-17" && env._pjWeekKey("2026-08-22") === "2026-08-17");
  ok("_pjWeeksBetween ceil, min 1", env._pjWeeksBetween("2026-08-17", "2026-08-17") === 1 && env._pjWeeksBetween("2026-08-17", "2026-08-25") === 2);
  ok("empty input → empty output, no throw", eq(P({}), { byDate: {}, plans: {}, warnings: [] }));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
