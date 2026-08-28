/*
 * Node tests for the ORDER-BLOCK ESCAPE HATCH on Mom's Approve.
 *
 * The bug (live, week18): the sequential-order guard made finalizeDone refuse and return
 * false, but every caller ran on regardless — renderAll + showPaceToast — so the kid was
 * PAID A SPIN for a check-off that was never written, the ⛔ toast was replaced by the pace
 * toast, and the card came back the next day. week18/spins_used holds
 * ellis_ellis__read_detect_L0023 while week18/checked does not.
 *
 * These cover: the refusal is honored (no spin, no write), Mom is offered
 * "approve all up to and including this", and the back-fill records earlier lessons on
 * their own cards when they have one and in the plan when they don't — paying exactly one
 * spin, for the card she actually approved.
 *
 *   run:  node test_approve_order.js
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

// Extract a top-level function verbatim so the tests run the real code.
function extractFn(name) {
  const start = src.search(new RegExp("^function\\s+" + name + "\\s*\\(", "m"));
  if (start < 0) throw new Error("fn not found: " + name);
  let i = src.indexOf("{", start), depth = 0, inStr = null, esc = false;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (inStr) { if (c === inStr) inStr = null; continue; }
    if (c === "/" && src[j + 1] === "/") { j = src.indexOf("\n", j); if (j < 0) break; continue; }
    if (c === "/" && src[j + 1] === "*") { j = src.indexOf("*/", j) + 1; continue; }
    if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (!depth) return src.slice(start, j + 1); }
  }
  throw new Error("unbalanced: " + name);
}
const FNS = ["lidsFor", "lidStamped", "lidDoneSet", "lidForTask", "lidOrderBlock",
  "lidOrderBlockList", "lidDoneWrite", "taskLessonRef", "finalizeDone", "momApprove",
  "momReject", "openOrderBlockDialog", "orderBlockClose", "orderBlockCancel",
  "orderBlockApproveThrough", "bumpSkippedInTier", "taskTierOf"];
const body = FNS.map(extractFn).join("\n");
const norm = src.match(/^const _lidNorm=.*$/m);
if (!norm) throw new Error("_lidNorm not found");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

// A Lincoln Singapore world: L0001–L0007 done, L0008 next up. Cards exist for L0008 and
// L0010 (the one the kid claimed); L0009 has no card at all — it can only be recorded in
// the plan. This is the live shape from 2026-08-27, where L0036 was claimed at 11:15:57
// before L0035 at 11:16:24 and could not be approved until L0035 landed.
function world(opts) {
  opts = opts || {};
  const seq = [], ids = [];
  for (let i = 1; i <= 10; i++) { ids.push("L" + String(i).padStart(4, "0")); seq.push("5B Ch.10 L" + i); }
  const done = {};
  for (let i = 1; i <= 7; i++) done["L" + String(i).padStart(4, "0")] = { ts: "x", src: "check" };
  const mk = (lid, day, time) => ({
    id: "lincoln_lincoln__singapore_l_" + lid, who: "lincoln", subjectKey: "singapore_l",
    lid: lid, title: "📘 Singapore — 5B Ch.10 L" + parseInt(lid.slice(1), 10),
    day: day, time: time, dur: 20, mom: "none"
  });
  const tasks = [mk("L0008", "thursday", "10:00 AM"), mk("L0010", "thursday", "10:40 AM")];
  if (opts.withL0009) tasks.push(mk("L0009", "thursday", "10:20 AM"));

  const env = {
    currData: {
      subjects: { lincoln: { singapore_l: { display: "Singapore", lessonSeq: seq, lessonIds: ids, doneImportedAt: "2026-08-01" } } },
      done: { lincoln: { singapore_l: done } }
    },
    weekData: { tasks: tasks },
    checked: {}, claimed: {}, histState: {}, WK: "week19",
    DAY_DT: { thursday: "August 27" },
    momMode: true,
    // recorders
    spins: [], toasts: [], dbWrites: {}, dialogs: [], removed: []
  };
  env.claimed["lincoln_lincoln__singapore_l_L0010"] = "11:15 AM Aug 27";
  return env;
}

function run(env, script) {
  const vm = require("vm");
  const ctx = {
    currData: env.currData, weekData: env.weekData, checked: env.checked, claimed: env.claimed,
    histState: env.histState, WK: env.WK, DAY_DT: env.DAY_DT,
    momHere: () => env.momMode,
    nowTs: () => "12:00 PM Aug 27",
    tsToMin: () => 675,
    effectiveDay: t => t.day,
    toMin: s => { const m = /(\d+):(\d+)\s*(AM|PM)/.exec(s); if (!m) return 0; let h = +m[1] % 12; if (m[3] === "PM") h += 12; return h * 60 + +m[2]; },
    fromMin: n => { let h = Math.floor(n / 60), m = n % 60, ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return h + ":" + String(m).padStart(2, "0") + " " + ap; },
    sv: () => {}, ld: () => ({}),
    lastCheckedWrite: 0, lastTasksWrite: 0,
    manualUnchecks: new Set(),
    _dryRun: () => false,
    _parseCheckTs: () => null,               // no day-heal in these tests
    cbTodayISO: () => "2026-08-27",
    checkSubjectComplete: () => {}, checkBookComplete: () => {}, checkSessionComplete: () => {}, rlOnCheckoff: () => {},
    dbg: m => env.toasts.push("dbg:" + m),
    gwShowToast: m => env.toasts.push(m),
    renderAll: () => {},
    showPaceToast: (id) => env.spins.push(id),
    esc: s => String(s), cap: s => String(s), taskSubject: () => "Singapore",
    scoredType: () => null, openScoreDialog: () => {},
    db: {
      ref: p => ({
        set: v => { env.dbWrites[p] = v; },
        remove: () => { env.removed.push(p); },
        update: o => { Object.keys(o).forEach(k => { env.dbWrites[p + "/" + k] = o[k]; }); return { catch: () => {} }; }
      })
    },
    document: {
      getElementById: () => null,
      createElement: () => ({ style: {}, set innerHTML(v) { env.dialogs.push(v); }, get innerHTML() { return ""; } }),
      body: { appendChild: () => {} }
    },
    console: console
  };
  vm.createContext(ctx);
  vm.runInContext(norm[0] + "\n" + body + "\n" + (script || ""), ctx);
  return ctx;
}

console.log("\n── the refusal is honored ──");
{
  const env = world();
  const ctx = run(env, "var r=finalizeDone('lincoln_lincoln__singapore_l_L0010','11:15 AM Aug 27',null);");
  ok("finalizeDone returns false when the lesson isn't next up", ctx.r === false, ctx.r);
  ok("nothing written to checked", Object.keys(env.checked).length === 0, env.checked);
  ok("nothing written to the plan", !env.currData.done.lincoln.singapore_l.L0010);
  ok("the ⛔ reason names the blocking lesson", env.toasts.some(t => /Ch\.10 L8/.test(t)), env.toasts);
}
{
  const env = world();
  const ctx = run(env, "var r=finalizeDone('lincoln_lincoln__singapore_l_L0008','10:00 AM Aug 27',null);");
  ok("finalizeDone returns true for the lesson that IS next up", ctx.r === true, ctx.r);
  ok("it wrote the check", !!env.checked["lincoln_lincoln__singapore_l_L0008"]);
  ok("it wrote the plan record", !!env.currData.done.lincoln.singapore_l.L0008);
}

console.log("\n── momApprove pays no spin on a refusal ──");
{
  const env = world();
  run(env, "momApprove('lincoln_lincoln__singapore_l_L0010');");
  ok("NO spin awarded", env.spins.length === 0, env.spins);
  ok("nothing checked off", Object.keys(env.checked).length === 0);
  ok("the claim is left standing for her to act on", !!env.claimed["lincoln_lincoln__singapore_l_L0010"]);
  ok("she is offered the approve-through dialog", env.dialogs.length === 1, env.dialogs.length);
  ok("the dialog lists both open lessons ahead", /Ch\.10 L8/.test(env.dialogs[0] || "") && /Ch\.10 L9/.test(env.dialogs[0] || ""));
  ok("the dialog names the card she tapped", /Ch\.10 L10/.test(env.dialogs[0] || ""));
}
{
  const env = world();
  run(env, "momApprove('lincoln_lincoln__singapore_l_L0008');");
  ok("an in-order approve still checks off", !!env.checked["lincoln_lincoln__singapore_l_L0008"]);
  ok("an in-order approve still pays its spin", env.spins.length === 1, env.spins);
  ok("no dialog when nothing blocks", env.dialogs.length === 0);
}

console.log("\n── lidOrderBlockList ──");
{
  const env = world();
  const ctx = run(env, "var a=lidOrderBlockList(weekData.tasks.find(t=>t.lid==='L0010'));var b=lidOrderBlockList(weekData.tasks.find(t=>t.lid==='L0008'));");
  ok("lists every open lesson ahead, in order", JSON.stringify(ctx.a.map(x => x.lid)) === '["L0008","L0009"]', ctx.a);
  ok("carries the readable text", ctx.a[0].text === "5B Ch.10 L8", ctx.a[0]);
  ok("empty for the lesson that is next up", ctx.b.length === 0, ctx.b);
}
{
  const env = world();
  env.currData.subjects.lincoln.singapore_l.allowOutOfOrder = true;
  const ctx = run(env, "var a=lidOrderBlockList(weekData.tasks.find(t=>t.lid==='L0010'));var r=finalizeDone('lincoln_lincoln__singapore_l_L0010','11:15 AM Aug 27',null);");
  ok("allowOutOfOrder subjects are never blocked", ctx.a.length === 0 && ctx.r === true, [ctx.a, ctx.r]);
}

console.log("\n── approve-through back-fills ──");
{
  const env = world();
  run(env, "momApprove('lincoln_lincoln__singapore_l_L0010'); orderBlockApproveThrough();");
  const D = env.currData.done.lincoln.singapore_l;
  ok("L0008 checked off on its own card", !!env.checked["lincoln_lincoln__singapore_l_L0008"]);
  ok("L0008 recorded in the plan as a check", D.L0008 && D.L0008.src === "check", D.L0008);
  ok("L0009 has no card, so plan record only", !!D.L0009 && !env.checked["lincoln_lincoln__singapore_l_L0009"], D.L0009);
  ok("L0009 marked as a hand-record, not a check-off", D.L0009 && D.L0009.src === "manual" && D.L0009.via === "approve-through", D.L0009);
  ok("the card she approved is checked off", !!env.checked["lincoln_lincoln__singapore_l_L0010"]);
  ok("its done-time is the kid's claim time", env.checked["lincoln_lincoln__singapore_l_L0010"] === "11:15 AM Aug 27");
  ok("the claim is cleared", !env.claimed["lincoln_lincoln__singapore_l_L0010"]);
  ok("EXACTLY ONE spin — for the card she approved", env.spins.length === 1 && env.spins[0] === "lincoln_lincoln__singapore_l_L0010", env.spins);
  ok("the plan-only lesson was written to Firebase", !!env.dbWrites["curriculum/done/lincoln/singapore_l/L0009"], Object.keys(env.dbWrites).filter(k => /curriculum/.test(k)));
  ok("the sequence has no holes left", ["L0008", "L0009", "L0010"].every(l => !!D[l]));
}
{
  const env = world({ withL0009: true });
  run(env, "momApprove('lincoln_lincoln__singapore_l_L0010'); orderBlockApproveThrough();");
  ok("when every blocker HAS a card, all are real check-offs",
    !!env.checked["lincoln_lincoln__singapore_l_L0008"] && !!env.checked["lincoln_lincoln__singapore_l_L0009"]);
  ok("still exactly one spin", env.spins.length === 1, env.spins);
  const D2 = env.currData.done.lincoln.singapore_l;
  ok("no plan-only record was needed — every one is a real check",
    ["L0008", "L0009", "L0010"].every(l => D2[l] && D2[l].src === "check"),
    ["L0008", "L0009", "L0010"].map(l => D2[l] && D2[l].src));
}
{
  const env = world();
  run(env, "momApprove('lincoln_lincoln__singapore_l_L0010'); orderBlockCancel();");
  ok("Cancel writes nothing", Object.keys(env.checked).length === 0 && !env.currData.done.lincoln.singapore_l.L0008);
  ok("Cancel pays no spin", env.spins.length === 0);
  ok("Cancel leaves the claim for later", !!env.claimed["lincoln_lincoln__singapore_l_L0010"]);
}
{
  const env = world();
  env.momMode = false;
  run(env, "momApprove('lincoln_lincoln__singapore_l_L0010');");
  ok("a kid gets no approve-through offer", env.dialogs.length === 0 && env.spins.length === 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
