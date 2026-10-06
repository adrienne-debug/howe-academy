/*
 * 📮 Taps made offline survive a reload (her yes 2026-09-23, "yes also chores and claims").
 * Live 9/23 11:41: an offline console came back with 53 check-offs vs the server's 51; the server's
 * list replaced it and Lincoln re-checked two lessons. Firebase keeps offline writes in page memory
 * only — a reload loses them. The outbox notes each write until the server confirms it, and replays
 * orphans from an earlier page load only where the server still shows what this device saw before.
 *   run:  node test_outbox.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// OUTBOX_START"), b = src.indexOf("// CKRECOVER_END");
if (a < 0 || b < 0 || a > b) { console.error("OUTBOX/CKRECOVER markers not found"); process.exit(1); }
const BLOCK = src.slice(a, b);
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }

// ── a fake Firebase: a server tree, an online switch, writes that never confirm while offline ──
function server(init) {
  const S = { tree: JSON.parse(JSON.stringify(init || {})), online: true, writes: [] };
  const get = p => p.split("/").reduce((o, k) => (o == null ? null : (o[k] === undefined ? null : o[k])), S.tree);
  const put = (p, v) => {
    const ks = p.split("/"); let o = S.tree;
    ks.slice(0, -1).forEach(k => { if (!o[k] || typeof o[k] !== "object") o[k] = {}; o = o[k]; });
    if (v === null || v === undefined) delete o[ks[ks.length - 1]]; else o[ks[ks.length - 1]] = JSON.parse(JSON.stringify(v));
  };
  const write = (p, v) => { S.writes.push([p, v]); if (!S.online) return new Promise(() => {}); put(p, v); return Promise.resolve(); };
  S.get = get;
  S.db = {
    ref: p => ({
      set: v => write(p, v), remove: () => write(p, null),
      transaction: fn => write(p, fn(get(p))),
      once: (ev, cb) => cb({ val: () => get(p) }),
      push: () => ({ key: "k" + S.writes.length }),
    }),
  };
  return S;
}
const flush = () => new Promise(r => setImmediate(r));
// A page load: the outbox block runs fresh (new session id) over the SAME localStorage.
function page(S, o) {
  o = o || {};
  const store = o.store;
  const toasts = [], logs = [], timers = [];
  const ctx = {
    console, WK: "week24", checked: o.checked || {}, weekData: { tasks: o.tasks || [] },
    fbCheckedLoaded: true, fbTasksLoaded: true, fbHistoryLoaded: true,
    firebase: { auth: () => ({ currentUser: o.signedOut ? null : { uid: "fam" } }) },
    ld: k => store[k] === undefined ? null : JSON.parse(JSON.stringify(store[k])), sv: (k, v) => { store[k] = JSON.parse(JSON.stringify(v)); },
    dbg: m => logs.push(m), gwShowToast: m => toasts.push(m), renderAll: () => {}, nowTs: () => "1:00 PM Sep 23",
    setTimeout: (fn, ms) => { timers.push([fn, ms]); return timers.length; },
    finalizeDone: (id, ts) => { ctx.calls.push([id, ts]); ctx.checked[id] = ts; return true; },
    calls: [], slState: o.slState || {}, db: S.db, _dryRun: () => !!o.dry,
    Object, String, JSON, Math, Date, Array, Promise,
  };
  vm.createContext(ctx); vm.runInContext(BLOCK, ctx);
  return { ctx, toasts, logs, timers, call: e => vm.runInContext(e, ctx) };
}
// age every outbox / pendck note past the 30s wait (as if the reload came a minute later)
function age(store) {
  Object.values(store.ha_outbox || {}).forEach(e => { e.at -= 60000; });
  Object.values(store.week24_pendck || {}).forEach(e => { if (e && typeof e === "object") e.at -= 60000; });
}

(async () => {
console.log("── an online write is noted, then forgotten when the server confirms ──");
{
  const S = server(), store = {};
  const p = page(S, { store });
  p.call(`obSet("bank/lincoln/adjustments/bd1",{amount:5,note:"Bed"},null)`);
  ok("noted immediately", Object.keys(store.ha_outbox).length === 1);
  await flush();
  ok("confirmed → forgotten", Object.keys(store.ha_outbox).length === 0);
  ok("it is on the server", S.get("bank/lincoln/adjustments/bd1").amount === 5);
}

console.log("\n── the live case: chores + stars tapped offline, then the page reloads ──");
{
  const S = server({ week24: { sl: {} } }), store = {};
  S.online = false;
  const p1 = page(S, { store });
  p1.call(`obSet("bank/lincoln/adjustments/bd1",{amount:5,note:"🛏 Bed"},null)`);
  p1.call(`obSet("routineLog/lincoln/week24/wednesday/k1",{label:"Bed",act:"on"},null)`);
  p1.ctx.slState = { week24_wednesday_lincoln_mstep0: { done: true, ts: "9:02 AM Sep 23", pts: 5, bid: "bd1" } };
  p1.call(`obNoteSl("week24",db.ref("week24/sl").set(slState),{week24_wednesday_lincoln_mstep0:null})`);
  await flush();
  ok("three offline writes are still waiting (server has none)", Object.keys(store.ha_outbox).length === 3 && S.get("bank/lincoln") === null);
  // reload: page memory (and Firebase's queue) is gone; the notes are in localStorage
  S.online = true; age(store);
  const p2 = page(S, { store });
  p2.call("obReplay()"); await flush(); await flush(); await flush(); await flush();
  ok("the star lands in the bank", S.get("bank/lincoln/adjustments/bd1").amount === 5);
  ok("the log line lands", S.get("routineLog/lincoln/week24/wednesday/k1").act === "on");
  ok("the step shows done on the server", S.get("week24/sl/week24_wednesday_lincoln_mstep0").done === true);
  ok("outbox emptied", Object.keys(store.ha_outbox).length === 0);
  ok("Mom sees a count", p2.toasts.length === 1 && /Recovered 3/.test(p2.toasts[0]), p2.toasts);
}

console.log("\n── offline check THEN un-check of a chore nets to nothing ──");
{
  const S = server(), store = {};
  S.online = false;
  const p1 = page(S, { store });
  p1.call(`obSet("bank/ellis/adjustments/bd9",{amount:3},null)`);
  p1.call(`obRemove("bank/ellis/adjustments/bd9",{amount:3})`);
  S.online = true; age(store);
  const p2 = page(S, { store });
  p2.call("obReplay()"); for (let i = 0; i < 8; i++) await flush();
  ok("replayed in tap order: added then removed → no stars", S.get("bank/ellis/adjustments/bd9") === null);
  ok("outbox emptied", Object.keys(store.ha_outbox).length === 0);
}

console.log("\n── it never overrides what someone else did ──");
{
  const S = server({ pointClaims: { lucy: { week24: { wednesday: { status: "cashed", earned: 40 } } } } }), store = {};
  S.online = false;
  const p1 = page(S, { store });
  // this device thought there was no claim yet and made one offline; meanwhile Mom cashed it elsewhere
  p1.call(`obSet("pointClaims/lucy/week24/wednesday",{status:"claimed",earned:40},null)`);
  S.online = true; age(store);
  const p2 = page(S, { store });
  p2.call("obReplay()"); for (let i = 0; i < 6; i++) await flush();
  ok("Mom's cashed record stands", S.get("pointClaims/lucy/week24/wednesday").status === "cashed");
  ok("the stale note is dropped", Object.keys(store.ha_outbox).length === 0);
  ok("no toast for a no-op", p2.toasts.length === 0);
}
{
  const S = server(), store = {};
  S.online = false;
  const p1 = page(S, { store });
  p1.call(`obSet("week24/claimed/t5","11:00 AM Sep 23",null,{u:"week24/checked/t5"})`);
  S.online = true; S.tree = { week24: { checked: { t5: "11:30 AM Sep 23" } } }; age(store);
  const p2 = page(S, { store });
  p2.call("obReplay()"); for (let i = 0; i < 6; i++) await flush();
  ok("a claim on a card Mom has since checked is not re-sent", S.get("week24/claimed/t5") === null && Object.keys(store.ha_outbox).length === 0);
}
{
  const S = server(), store = {};
  const p1 = page(S, { store });
  p1.call(`obSet("week24/spins_used/t1",true,null)`);
  S.online = false; // (note already confirmed above) — now a write that DID land but the page died before hearing back
  store.ha_outbox = { x_1: { p: "week24/spins_used/t1", op: "set", v: true, w: null, s: "old", n: 1, at: Date.now() - 60000 } };
  S.online = true;
  const p2 = page(S, { store });
  const before = S.writes.length;
  p2.call("obReplay()"); for (let i = 0; i < 4; i++) await flush();
  ok("already on the server → nothing re-written", S.writes.length === before && Object.keys(store.ha_outbox).length === 0);
}

console.log("\n── spin points: added once, never twice ──");
{
  const S = server({ week24: { slot_points: { lucy: { wednesday: 10 } } } }), store = {};
  S.online = false;
  const p1 = page(S, { store });
  p1.call(`obInc("week24/slot_points/lucy/wednesday",20,{g:"week24/spin_results/t7"})`);
  p1.call(`obSet("week24/spin_results/t7",{pts:20,kid:"lucy"},null)`);
  S.online = true; age(store);
  const p2 = page(S, { store });
  p2.call("obReplay()"); for (let i = 0; i < 8; i++) await flush();
  ok("the lost spin's 20 points are added (10 → 30)", S.get("week24/slot_points/lucy/wednesday") === 30, S.get("week24/slot_points/lucy/wednesday"));
  ok("and its spin record lands", S.get("week24/spin_results/t7").pts === 20);
}
{
  const S = server({ week24: { slot_points: { lucy: { wednesday: 30 } }, spin_results: { t7: { pts: 20, kid: "lucy" } } } }), store = {};
  store.ha_outbox = { o_1: { p: "week24/slot_points/lucy/wednesday", op: "inc", v: 20, w: null, g: "week24/spin_results/t7", s: "old", n: 1, at: Date.now() - 60000 } };
  const p2 = page(S, { store });
  p2.call("obReplay()"); for (let i = 0; i < 4; i++) await flush();
  ok("spin already on the server → points NOT added again", S.get("week24/slot_points/lucy/wednesday") === 30);
}

console.log("\n── it waits for the right moment ──");
{
  const S = server(), store = {};
  S.online = false;
  const p1 = page(S, { store });
  p1.call(`obSet("bank/lucy/adjustments/bd2",{amount:2},null)`);
  p1.call("obReplay()"); await flush();
  ok("this page's own waiting write is never replayed by itself (Firebase still has it queued)", S.writes.length === 1);
  S.online = true;
  const p2 = page(S, { store });   // reloaded seconds later: under 30s old
  p2.call("obReplay()"); await flush();
  ok("an orphan under 30s old waits, and a retry is scheduled", S.get("bank/lucy/adjustments/bd2") === null && p2.timers.length === 1 && p2.timers[0][1] > 30000);
  age(store); p2.timers[0][0](); for (let i = 0; i < 4; i++) await flush();
  ok("…then lands on the retry", S.get("bank/lucy/adjustments/bd2").amount === 2);
}
{
  const S = server(), store = { ha_outbox: { o_1: { p: "bank/lucy/adjustments/bd3", op: "set", v: { amount: 2 }, w: null, s: "old", n: 1, at: Date.now() - 60000 } } };
  const p = page(S, { store, signedOut: true });
  p.call("obReplay()"); await flush();
  ok("signed out → nothing replayed, note kept", S.writes.length === 0 && Object.keys(store.ha_outbox).length === 1);
}
{
  const S = server(), store = {};
  const p = page(S, { store, dry: true });
  p.call(`obSet("bank/lucy/adjustments/bd4",{amount:2},null)`);
  ok("dry-run records nothing", !store.ha_outbox);
}

console.log("\n── check-offs: an offline check lost to a reload is replayed through finalizeDone ──");
{
  const S = server(), store = {};
  S.online = false;
  const p1 = page(S, { store, tasks: [{ id: "t1" }] });
  p1.call(`ckNotePending("t1","11:20 AM Sep 23")`);
  p1.ctx.checked = { t1: "11:20 AM Sep 23" };   // offline: the device's own view has it
  p1.call("ckReplayPending()");
  ok("same page, still in flight → not replayed and NOT forgotten", p1.ctx.calls.length === 0 && store.week24_pendck.t1);
  // reload: server snapshot replaced the list — t1 is gone
  S.online = true; age(store);
  const p2 = page(S, { store, tasks: [{ id: "t1" }], checked: {} });
  p2.call("ckReplayPending()");
  ok("after the reload it's replayed with its ORIGINAL time", JSON.stringify(p2.ctx.calls) === JSON.stringify([["t1", "11:20 AM Sep 23"]]), p2.ctx.calls);
  ok("…and forgotten", Object.keys(store.week24_pendck).length === 0);
}
{
  const store = {}, S = server();
  const p = page(S, { store });
  p.call(`ckNotePending("t2","10:00 AM Sep 23")`);
  p.call(`ckConfirmed("t2","10:00 AM Sep 23")`);
  ok("confirmed by the server → forgotten", Object.keys(store.week24_pendck).length === 0);
  p.call(`ckNotePending("t3","10:05 AM Sep 23")`);
  p.call(`ckForget("t3")`);
  ok("un-checked on this device → forgotten, never resurrected", Object.keys(store.week24_pendck).length === 0);
}

console.log("\n── the wiring in index.html ──");
ok("stars bank through the outbox", /obSet\("bank\/"\+kid\+"\/adjustments\/"\+id,rec,null\)/.test(src));
ok("un-check removes stars through the outbox", /obRemove\("bank\/"\+kid\+"\/adjustments\/"\+id,_bw\)/.test(src));
ok("chore log through the outbox", /obSet\("routineLog\/"\+kid\+"\/"\+wk\+"\/"\+day\+"\/"\+key,rec,null\)/.test(src));
ok("both routine toggles note their step keys", (src.match(/obNoteSl\(wk,db\.ref\(wk\+"\/sl"\)\.set\(slState\),_obPrev\)/g) || []).length === 2);
ok("Mom-check claims: set with the checked guard", /obSet\(WK\+"\/claimed\/"\+id,ts,_cw0,\{u:WK\+"\/checked\/"\+id\}\)/.test(src));
ok("no raw claimed writes left", !/db\.ref\(WK\+"\/claimed\/"/.test(src));
ok("point claims + grab claims through the outbox", /obSet\("pointClaims\//.test(src) && /obSet\("grabClaims\/"\+k,rec,_gw\)/.test(src));
ok("spin points are guarded by their spin record", /addKidPoints\(k,outcome\.pts,d,slotPendingTaskId\?\(WK\+"\/spin_results\/"\+slotPendingTaskId\):null\)/.test(src) && /obInc\(WK\+"\/slot_points\/"/.test(src));
ok("replay runs when the device comes back online", /if\(on\) setTimeout\(function\(\)\{ try\{ obReplay\(\); \}catch\(e\)\{\} \},4000\)/.test(src));
ok("…and after the checked list loads", /try\{ obReplay\(\); \}catch\(e\)\{\}\s+\/\/ 📮/.test(src));
ok("each check-off is noted before it's written", /ckNotePending\(id,doneTs\); const _w=db\.ref\(WK\+"\/checked\/"\+id\)\.set\(doneTs\)/.test(src));
ok("Mom's un-check forgets the note", /manualUnchecks\.add\(id\); ckForget\(id\);/.test(src));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})();
