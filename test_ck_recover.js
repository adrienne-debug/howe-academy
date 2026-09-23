/*
 * 🔁 Refused check-offs are kept and replayed after sign-in (her yes 2026-09-22).
 * Live case: a signed-out Fire HD 8 showed its check-offs on its own screen only; the first
 * server snapshot after sign-in replaced them. Now the refused write is recorded and replayed.
 *   run:  node test_ck_recover.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
// CKRECOVER uses the outbox session id (2026-09-23) — load both blocks
const a = src.indexOf("// OUTBOX_START"), b = src.indexOf("// CKRECOVER_END");
if (a < 0 || b < 0 || a > b) { console.error("OUTBOX/CKRECOVER markers not found"); process.exit(1); }
const BLOCK = src.slice(a, b);
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
function world(o) {
  o = o || {};
  const store = Object.assign({}, o.store || {});
  const calls = [], toasts = [], logs = [], timers = [];
  const ctx = {
    console, WK: "week24", checked: o.checked || {}, weekData: { tasks: o.tasks || [] },
    fbCheckedLoaded: o.loaded !== false, fbTasksLoaded: o.loaded !== false, fbHistoryLoaded: o.loaded !== false,
    firebase: { auth: () => ({ currentUser: o.signedOut ? null : { uid: "fam" } }) },
    ld: k => store[k] === undefined ? null : JSON.parse(JSON.stringify(store[k])), sv: (k, v) => { store[k] = JSON.parse(JSON.stringify(v)); },
    dbg: m => logs.push(m), gwShowToast: m => toasts.push(m), renderAll: () => {}, nowTs: () => "1:00 PM Sep 22",
    setTimeout: (fn, ms) => timers.push([fn, ms]),
    finalizeDone: (id, ts) => { calls.push([id, ts]); if (o.refuseOrder && o.refuseOrder[id]) return false; ctx.checked[id] = ts; return true; },
    Object, String, JSON, Math, Date, db: null, _dryRun: () => false,
  };
  vm.createContext(ctx); vm.runInContext(BLOCK, ctx);
  return { ctx, store, calls, toasts, logs, timers, call: e => vm.runInContext(e, ctx) };
}
console.log("── a refused write is remembered, per week, with its done-time ──");
{
  const w = world();
  w.call("ckNoteRefused('t1','11:05 AM Sep 21',{code:'PERMISSION_DENIED'})");
  w.call("ckNoteRefused('t2','11:20 AM Sep 21',{code:'PERMISSION_DENIED'})");
  const pc = w.store.week24_pendck || {};
  ok("both ids stored under <week>_pendck with their times, marked refused", pc.t1 && pc.t1.t === "11:05 AM Sep 21" && pc.t1.r === 1 && pc.t2 && pc.t2.t === "11:20 AM Sep 21" && pc.t2.r === 1, pc);
  ok("the refusal is logged", w.logs.some(m => /REFUSED/.test(m) && /t1/.test(m)));
}
console.log("\n── replay after the server's list has loaded on a signed-in device ──");
{
  const w = world({ store: { week24_pendck: { t1: "11:05 AM Sep 21", t2: "11:20 AM Sep 21" } }, tasks: [{ id: "t1" }, { id: "t2" }], checked: {} });
  w.call("ckReplayPending()");
  ok("finalizeDone ran for each pending id with the ORIGINAL done-time", JSON.stringify(w.calls) === JSON.stringify([["t1", "11:05 AM Sep 21"], ["t2", "11:20 AM Sep 21"]]), w.calls);
  ok("the pending list is emptied", JSON.stringify(w.store.week24_pendck) === "{}", w.store.week24_pendck);
  ok("Mom sees a count", w.toasts.length === 1 && /Recovered 2 check-offs/.test(w.toasts[0]), w.toasts);
}
{
  const w = world({ store: { week24_pendck: { t1: "11:05 AM Sep 21" } }, tasks: [{ id: "t1" }], checked: { t1: "11:05 AM Sep 21" } });
  w.call("ckReplayPending()");
  ok("an id the server already has is dropped quietly — no replay, no toast", w.calls.length === 0 && w.toasts.length === 0 && JSON.stringify(w.store.week24_pendck) === "{}");
}
{
  const w = world({ store: { week24_pendck: { gone: "11:05 AM Sep 21" } }, tasks: [{ id: "t1" }], checked: {} });
  w.call("ckReplayPending()");
  ok("a card that no longer exists this week is skipped, not replayed", w.calls.length === 0 && /1 couldn/.test(w.toasts[0] || ""), w.toasts);
}
{
  const w = world({ store: { week24_pendck: { t1: "x" } }, tasks: [{ id: "t1" }], checked: {}, refuseOrder: { t1: true } });
  w.call("ckReplayPending()");
  ok("the order guard's refusal is respected and the id is not retried forever", w.calls.length === 1 && JSON.stringify(w.store.week24_pendck) === "{}" && /1 couldn/.test(w.toasts[0] || ""));
}
console.log("\n── it waits for the right moment ──");
{
  const w = world({ store: { week24_pendck: { t1: "x" } }, tasks: [{ id: "t1" }], loaded: false });
  w.call("ckReplayPending()");
  ok("server lists not loaded yet → nothing replayed, a retry is scheduled", w.calls.length === 0 && w.timers.length === 1 && w.timers[0][1] === 500);
}
{
  const w = world({ store: { week24_pendck: { t1: "x" } }, tasks: [{ id: "t1" }], signedOut: true });
  w.call("ckReplayPending()");
  ok("still signed out → nothing replayed, the pending list is KEPT", w.calls.length === 0 && JSON.stringify(w.store.week24_pendck) === JSON.stringify({ t1: "x" }));
}
{
  const w = world({ store: {}, tasks: [{ id: "t1" }] });
  w.call("ckReplayPending()");
  ok("nothing pending → nothing happens, no toast", w.calls.length === 0 && w.toasts.length === 0);
}
console.log("\n── it never guesses from a list comparison ──");
{
  // local checked has an id the server lacks (un-checked elsewhere) but it was never REFUSED → untouched
  const w = world({ store: {}, tasks: [{ id: "t1" }], checked: {} });
  w.call("ckReplayPending()");
  ok("an id missing on the server without a refusal record is never resurrected", w.calls.length === 0);
}
console.log("\n── the wiring in index.html ──");
ok("finalizeDone notes the check, clears it on confirm, keeps it on refusal", /ckNotePending\(id,doneTs\); const _w=db\.ref\(WK\+"\/checked\/"\+id\)\.set\(doneTs\); if\(_w&&typeof _w\.then==="function"\) _w\.then\(function\(\)\{ ckConfirmed\(id,doneTs\); \},function\(err\)\{ ckNoteRefused\(id,doneTs,err\); \}\);/.test(src));
ok("the checked snapshot handler triggers the replay after fbCheckedLoaded", /fbCheckedLoaded=true;\s*schedCascade\(\);\s*renderAll\(\);\s*try\{ ckReplayPending\(\); \}catch\(e\)\{\}/.test(src));
ok("attaching a week resets the per-week pending cache", /detachWeekListeners\(\);\s*_ckPending=null; _ckReplayTries=0;/.test(src));
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
