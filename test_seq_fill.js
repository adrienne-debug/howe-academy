/*
 * Node tests for SEQFILL — her design (2026-09-17): "everything should get a how many of each
 * subject and then when relay is done the assignments are assigned from grid in order."
 *
 * A card stores its lesson today, so the lesson goes stale the moment anything moves it. The
 * cascade carries a card forward with its old stamp; a rebuild serves the right lesson into a
 * new card beside it; nothing reconciles the pair. Live on 2026-09-17: Lucy's Friday held
 * Ch4-1 AND Ch4-3 with Ch4-2 skipped. seqFillSlots treats a card as a SLOT and fills the slots
 * from the list — minus done, minus what locked cards hold — in order.
 *
 * Runs the REAL function, sliced verbatim from index.html.
 *   run:  node test_seq_fill.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// SEQFILL_START"), b = src.indexOf("// SEQFILL_END");
if (a < 0 || b < 0) { console.error("SEQFILL markers not found"); process.exit(1); }
const BLOCK = src.slice(a, b);
if (!/function seqFillSlots\(/.test(BLOCK)) { console.error("seqFillSlots not in block"); process.exit(1); }
const env = { console, JSON, Object, Array, String, Number, Math, Set, RegExp };
vm.createContext(env); vm.runInContext(BLOCK, env);
const seqFillSlots = env.seqFillSlots;

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const C = (id, day, time, lid, extra) => Object.assign({ id, day, time, lid, title: "x — " + lid }, extra || {});

// Lucy's real book, around the cursor
const IDS = ["L0059", "L0060", "L0061", "L0062", "L0063"];
const SEQ = ["Ch3-8: Practice", "Ch4-1", "Ch4-2", "Ch4-3", "Ch4-4"];
const DONE = new Set(["L0059"]);
const base = o => Object.assign({ kid: "lucy", sk: "dimensions_math_1a", planId: "lucy__dm1a", lessonIds: IDS, lessonSeq: SEQ, done: DONE, isLocked: () => false }, o || {});

console.log("── the live 2026-09-17 case: two Friday slots, Ch4-1 + stale Ch4-3 ──");
{
  const r = seqFillSlots(base({ cards: [C("a", "friday", "10:05 AM", "L0060"), C("b", "friday", "10:30 AM", "L0062")] }));
  ok("slot 1 keeps Ch4-1", r.assign[0].lid === "L0060" && !r.assign[0].changed);
  ok("slot 2 becomes Ch4-2, not Ch4-3 — the gap closes", r.assign[1].lid === "L0061" && r.assign[1].changed, r.assign[1]);
  ok("Ch4-3 is simply not placed (stays open for next week)", r.drop.length === 0 && r.assign.length === 2);
  ok("the week reads in order", r.ascending, r.violations);
  ok("the re-stamped slot gets its deterministic id", r.assign[1].newId === "lucy_lucy__dm1a_L0061", r.assign[1].newId);
}

console.log("\n── Ellis's dead card becomes real work ──");
{
  // one slot holding Pg 50 while Pg 49 is open — today it is refused by the guard; now it is filled correctly
  const ids = ["L0022", "L0023", "L0024"], seq = ["Pg 48", "Pg 49", "Pg 50"];
  const r = seqFillSlots(base({ kid: "ellis", sk: "hwt", planId: "ellis__hwt", lessonIds: ids, lessonSeq: seq, done: new Set(["L0022"]), cards: [C("h", "friday", "12:00 PM", "L0024")] }));
  ok("the slot is re-stamped to Pg 49 — the lesson that is actually next", r.assign[0].lid === "L0023" && r.assign[0].text === "Pg 49", r.assign[0]);
  ok("nothing dropped", r.drop.length === 0);
}

console.log("\n── a gap can no longer open ──");
{
  const r = seqFillSlots(base({ cards: [C("a", "monday", "10:00 AM", "L0062"), C("b", "wednesday", "10:00 AM", "L0060"), C("c", "thursday", "10:00 AM", "L0063")] }));
  ok("three slots take the next THREE open lessons, consecutively", r.assign.map(x => x.lid).join(",") === "L0060,L0061,L0062", r.assign.map(x => x.lid));
  ok("in order", r.ascending);
}

console.log("\n── locked cards are fixed points ──");
{
  const locked = C("done1", "monday", "10:00 AM", "L0060");
  const r = seqFillSlots(base({ cards: [locked, C("s", "thursday", "10:00 AM", "L0063")], isLocked: t => t.id === "done1" }));
  ok("the locked card is not in the assignments", !r.assign.some(x => x.oldId === "done1"));
  ok("its lesson is not handed to a slot as well", !r.assign.some(x => x.lid === "L0060"));
  ok("the slot takes the next one after it", r.assign[0].lid === "L0061", r.assign[0]);
  ok("counted as locked", r.locked === 1 && r.slots === 1);
}

console.log("\n── more slots than lessons left ──");
{
  const r = seqFillSlots(base({ done: new Set(["L0059", "L0060", "L0061", "L0062"]), cards: [C("a", "monday", "10:00 AM", "L0063"), C("b", "tuesday", "10:00 AM", "L0060"), C("c", "wednesday", "10:00 AM", "L0061")] }));
  ok("only the one remaining lesson is placed", r.assign.length === 1 && r.assign[0].lid === "L0063");
  ok("the two empty slots are reported as drops, not filled with done work", r.drop.length === 2, r.drop);
}

console.log("\n── a done lesson is never re-served ──");
{
  const r = seqFillSlots(base({ cards: [C("a", "monday", "10:00 AM", "L0059")] }));
  ok("the slot holding a DONE lesson is re-stamped to the next OPEN one", r.assign[0].lid === "L0060", r.assign[0]);
}

console.log("\n── the overflow card is the tail, not a sitting ──");
{
  const r = seqFillSlots(base({ cards: [C("eow", "monday", "9:00 AM", "L0062", { _eowOverflow: true }), C("a", "thursday", "10:00 AM", "L0060")] }));
  ok("the Thursday sitting is filled FIRST even though the eow card is parked on Monday", r.assign[0].oldId === "a" && r.assign[0].lid === "L0060", r.assign.map(x => [x.oldId, x.lid]));
  ok("the overflow slot takes the later lesson", r.assign[1].oldId === "eow" && r.assign[1].lid === "L0061", r.assign[1]);
}

console.log("\n── a locked card out of sequence is REPORTED, not silently laid ──");
{
  // a started card holding Ch4-3 while Ch4-1 is still open — we cannot move it, so say so
  const locked = C("started", "thursday", "12:00 PM", "L0062");
  const r = seqFillSlots(base({ cards: [locked, C("s", "friday", "10:00 AM", "L0060")], isLocked: t => t.id === "started" }));
  ok("the slot still gets the earliest open lesson", r.assign[0].lid === "L0060");
  ok("but the out-of-order locked card is flagged", !r.ascending && r.violations.length === 1, r.violations);
}

console.log("\n── idempotent ──");
{
  const inp = base({ cards: [C("a", "friday", "10:05 AM", "L0060"), C("b", "friday", "10:30 AM", "L0062")] });
  const r1 = seqFillSlots(inp);
  const after = r1.assign.map(x => C(x.newId, x.day, x.time, x.lid));
  const r2 = seqFillSlots(base({ cards: after }));
  ok("run 1 changes something", r1.changed);
  ok("run 2 on its own output changes nothing", !r2.changed, r2.assign.map(x => [x.lid, x.changed]));
}

console.log("\n── nothing is invented and nothing is marked done ──");
{
  const r = seqFillSlots(base({ cards: [C("a", "friday", "10:05 AM", "L0060"), C("b", "friday", "10:30 AM", "L0062")] }));
  ok("every assigned lid comes from the list", r.assign.every(x => IDS.indexOf(x.lid) >= 0));
  ok("no assigned lid is a DONE lesson", r.assign.every(x => !DONE.has(x.lid)));
  // Scan CODE only: strip // comments first, or the assertion matches prose describing the
  // writer (a trap this repo has hit before — 2026-08-30, planOwed / overflowExtras).
  const CODE = BLOCK.split("\n").map(l => l.replace(/\/\/.*$/, "")).join("\n");
  ok("the block writes nothing to the database — no db.ref / .set( / .update( in its CODE", !/db\.ref|\.set\(|\.update\(/.test(CODE));
}

// ── seqFillNormalize: the whole week, at the one writer ─────────────────────────
console.log("\n── seqFillNormalize — applied at safeWriteTasks ──");
function mkNorm(o) {
  const subj = { lucy: { dm: { planId: "lucy__dm", lessonIds: IDS, lessonSeq: SEQ } } };
  const e = { console, JSON, Object, Array, String, Number, Math, Set, RegExp,
    Date: class extends Date { constructor(...a) { if (!a.length) super("2026-09-18T08:00:00"); else super(...a); } },
    checked: (o && o.checked) || {}, claimed: (o && o.claimed) || {},
    currData: { subjects: subj }, DAY_DT: { monday: "September 14", thursday: "September 17", friday: "September 18" },
    _todayStr: () => "2026-09-18",
    toMin: x => { const m = /^(\d+):(\d+)\s*(AM|PM)/i.exec(x || ""); if (!m) return 9999; let h = +m[1] % 12; if (/pm/i.test(m[3])) h += 12; return h * 60 + +m[2]; },
    planBacked: (k, sk) => !!(subj[k] && subj[k][sk]), lidsFor: () => IDS, lidDoneSet: () => DONE, dbg: () => {} };
  vm.createContext(e); vm.runInContext(BLOCK, e); return e;
}
const TT = (id, day, time, lid) => ({ id, who: "lucy", subjectKey: "dm", day, time, lid, title: "📄 Dimensions Math 1A — " + SEQ[IDS.indexOf(lid)] });
{
  const e = mkNorm();
  const tasks = [TT("lucy_lucy__dm_L0060", "friday", "10:05 AM", "L0060"), TT("lucy_lucy__dm_L0062", "friday", "10:30 AM", "L0062")];
  e.__t = tasks; const r = vm.runInContext("seqFillNormalize(__t,'test')", e);
  ok("the stale card is re-stamped to Ch4-2", tasks[1].lid === "L0061", tasks[1]);
  ok("…its id follows its lesson", tasks[1].id === "lucy_lucy__dm_L0061", tasks[1].id);
  ok("…and only the lesson part of the title changes", tasks[1].title === "📄 Dimensions Math 1A — Ch4-2", tasks[1].title);
  ok("the correct first card is left alone", tasks[0].id === "lucy_lucy__dm_L0060" && tasks[0].lid === "L0060");
  ok("reports what it changed", r.changed === 1);
  const r2 = vm.runInContext("seqFillNormalize(__t,'test')", e);
  ok("idempotent — a second write changes nothing", r2.changed === 0, r2);
}
{
  const e = mkNorm({ checked: { "lucy_lucy__dm_L0062": "10:40 AM Sep 18" } });
  const tasks = [TT("lucy_lucy__dm_L0060", "friday", "10:05 AM", "L0060"), TT("lucy_lucy__dm_L0062", "friday", "10:30 AM", "L0062")];
  e.__t = tasks; vm.runInContext("seqFillNormalize(__t,'test')", e);
  ok("a CHECKED card is never re-stamped, even when out of order", tasks[1].id === "lucy_lucy__dm_L0062" && tasks[1].lid === "L0062");
}
{
  const e = mkNorm();
  const tasks = [TT("lucy_lucy__dm_L0062", "thursday", "10:00 AM", "L0062")];   // Thursday = a past day on Friday
  e.__t = tasks; vm.runInContext("seqFillNormalize(__t,'test')", e);
  ok("a STARTED card (past day) is never re-stamped", tasks[0].lid === "L0062");
}
{
  const e = mkNorm();
  const tasks = [TT("lucy_lucy__dm_L0060", "friday", "10:05 AM", "L0060"), TT("lucy_lucy__dm_L0062", "friday", "10:30 AM", "L0062"),
                 { id: "other", who: "lucy", subjectKey: "read_aloud", day: "friday", time: "11:00 AM", title: "Read-Aloud" }];
  e.__t = tasks; vm.runInContext("seqFillNormalize(__t,'test')", e);
  ok("card count unchanged — nothing added, nothing dropped", tasks.length === 3);
  ok("a non-plan-backed card is untouched", tasks[2].id === "other" && tasks[2].title === "Read-Aloud");
}
{
  const e = mkNorm();
  const tasks = [TT("lucy_lucy__dm_L0062", "friday", "10:30 AM", "L0062"), TT("lucy_lucy__dm_L0061", "friday", "11:00 AM", "L0061")];
  // a slot wants L0061's id but another live card already holds it — never collide
  e.__t = tasks; vm.runInContext("seqFillNormalize(__t,'test')", e);
  ok("ids stay unique when a target id is already taken", new Set(tasks.map(t => t.id)).size === tasks.length, tasks.map(t => t.id));
}
console.log("\n── wiring ──");
{
  const w = src.slice(src.indexOf("function safeWriteTasks("), src.indexOf("function dbg("));
  ok("safeWriteTasks calls seqFillNormalize", /seqFillNormalize\(weekData\.tasks,reason\)/.test(w));
  ok("…BEFORE it builds the object it writes", w.indexOf("seqFillNormalize(") < w.indexOf("const obj={}"));
  ok("…inside a try, so a throw can never block the write", /try\{[^\n]*seqFillNormalize\(weekData\.tasks,reason\)[^\n]*\}catch/.test(w));
  ok("the writer still uses a whole-node set (so an id change needs no path surgery)", /db\.ref\(WK\+"\/tasks"\)\.set\(obj\)/.test(w));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
