/*
 * Node tests — her two rules 2026-09-05 after "kids were accumulating more points than
 * they earned":
 *   · store: the same item within 60 seconds is refused (Ellis: six "30 min of Tech" in
 *     40 minutes, four in one minute)
 *   · 🕵️ Mom-checked chores, PER KID: when a kid's switch is on, their chore and bonus
 *     pay is HELD — counts for nothing (ledger, balance, banked-today) until Mom releases
 *     it; ✗ removes it. Off = pays at the tap, exactly as before.
 *
 *   run:  node test_chore_verify.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(name) {
  const i = src.indexOf("function " + name + "(");
  if (i < 0) { console.error(name + " not found"); process.exit(1); }
  return src.slice(i, src.indexOf("\n}", i) + 2);
}
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }

const CODE = ["let choreVerify={};", slice("choreVerifyOn"), slice("choreVerifySet"), slice("bankHeldList"), slice("bankHeldToday"),
  slice("bankHeldRelease"), slice("bankHeldReleaseAll"), slice("bankHeldReject"), slice("bankDirect"), slice("bankDirectRemove"),
  slice("bankLedger"), slice("bankBalance"), slice("bankEarnedDay"), slice("storeBuyCommit")].join("\n");
function world(o) {
  o = o || {};
  const ctx = { console, writes: [], removes: [], renders: 0, toasts: [], WK: "week21", day: "monday",
    bank: o.bank || {}, pointClaims: {}, momHere: () => !!o.mom, activeWk: () => "week21", nowTs: () => "10:00 AM Sep 7",
    renderAll: function () { ctx.renders++; }, gwShowToast: m => ctx.toasts.push(m), cap: s => s.charAt(0).toUpperCase() + s.slice(1),
    _bankTsDate: (ts, iso) => iso ? new Date(iso) : new Date(0),
    db: { ref: p => ({ set: v => ctx.writes.push([p, v]), remove: () => ctx.removes.push(p), push: () => { const key = "wd_" + (++ctx.renders) + "_" + Math.random().toString(36).slice(2, 6); return { key, set: v => ctx.writes.push([p + "/" + key, v]) }; } }) } };
  vm.createContext(ctx); vm.runInContext(CODE, ctx);
  if (o.verify) vm.runInContext("choreVerify=" + JSON.stringify(o.verify) + ";", ctx);
  return { ctx, call: e => vm.runInContext(e, ctx) };
}

console.log("── 🕵️ Mom-checked chores, per kid ──");
{
  const w = world({ verify: { lucy: true } });
  const idL = w.call("bankDirect('lucy',15,'🧹 Dust',choreVerifyOn('lucy'))");
  const idE = w.call("bankDirect('ellis',15,'🧹 Dust',choreVerifyOn('ellis'))");
  ok("Lucy (switch ON): the entry is written but HELD", w.ctx.bank.lucy.adjustments[idL].held === true && w.ctx.writes.some(x => x[0] === "bank/lucy/adjustments/" + idL && x[1].held === true));
  ok("Ellis (switch OFF): pays at the tap, no held flag", !w.ctx.bank.ellis.adjustments[idE].held);
  ok("held counts for NOTHING: balance 0, banked-today 0", w.call("bankBalance('lucy')") === 0 && w.call("bankEarnedDay('lucy','monday')") === 0);
  ok("…while Ellis's identical chore counts", w.call("bankBalance('ellis')") === 15 && w.call("bankEarnedDay('ellis','monday')") === 15);
  ok("the kid's card can show what is waiting", w.call("bankHeldToday('lucy','monday')") === 15 && w.call("bankHeldList('lucy').length") === 1);
  // a kid device cannot release
  w.call("bankHeldRelease('lucy','" + idL + "')");
  ok("a kid device cannot release a held chore", w.ctx.bank.lucy.adjustments[idL].held === true);
  // Mom releases → pays; only the held flag is removed in the database
  const m = world({ verify: { lucy: true }, mom: true });
  const id2 = m.call("bankDirect('lucy',15,'🧹 Dust',choreVerifyOn('lucy'))");
  m.call("bankHeldRelease('lucy','" + id2 + "')");
  ok("Mom's ✓ releases the pay", !m.ctx.bank.lucy.adjustments[id2].held && m.call("bankBalance('lucy')") === 15 && m.ctx.removes[0] === "bank/lucy/adjustments/" + id2 + "/held");
  // Mom rejects → entry removed
  const id3 = m.call("bankDirect('lucy',20,'🏁 Chores list complete',choreVerifyOn('lucy'))");
  m.call("bankHeldReject('lucy','" + id3 + "')");
  ok("Mom's ✗ removes the pay entirely", !m.ctx.bank.lucy.adjustments[id3] && m.ctx.removes.indexOf("bank/lucy/adjustments/" + id3) >= 0 && m.call("bankBalance('lucy')") === 15);
  ok("✗ on an already-released entry does nothing", (m.call("bankHeldReject('lucy','" + id2 + "')"), !!m.ctx.bank.lucy.adjustments[id2]));
  // release all
  m.call("bankDirect('lucy',15,'a',true); bankDirect('lucy',15,'b',true);");
  m.call("bankHeldReleaseAll('lucy')");
  ok("✓ all releases every held entry for that kid", m.call("bankHeldList('lucy').length") === 0 && m.call("bankBalance('lucy')") === 45);
  // negative (uncheck) entries never hold
  const id4 = m.call("bankDirect('lucy',-15,'↩ unchecked: Dust',true)");
  ok("a reversal is never held", !m.ctx.bank.lucy.adjustments[id4].held);
  // the setting itself
  const s = world({ mom: true });
  s.call("choreVerifySet('julian',true)");
  ok("Mom flips a kid on → config/choreVerify/<kid>=true", s.call("choreVerifyOn('julian')") === true && s.ctx.writes.some(x => x[0] === "config/choreVerify/julian" && x[1] === true));
  s.call("choreVerifySet('julian',false)");
  ok("…and off removes the key", s.call("choreVerifyOn('julian')") === false && s.ctx.removes.indexOf("config/choreVerify/julian") >= 0);
  const k = world({}); k.call("choreVerifySet('julian',true)");
  ok("a kid device cannot flip the setting", k.call("choreVerifyOn('julian')") === false && k.ctx.writes.length === 0);
  ok("all four chore pay sites pass the kid's switch", (src.match(/,\(typeof choreVerifyOn==="function"&&choreVerifyOn\(kid\)\)\)/g) || []).length === 4);
  ok("grabs, books, ribbons, units still pay at the tap (not gated)", !/bankDirect\(kid, _paid,[^)]*choreVerifyOn/.test(src));
}
console.log("\n── 🛍 store: the same item within a minute is refused ──");
{
  const w = world({ bank: { ellis: { withdrawals: {} } } });
  const it = { cost: 100, label: "30 min of Tech", emoji: "▶️" };
  w.call("storeBuyCommit('ellis'," + JSON.stringify(it) + ",false,'▶️ 30 min of Tech',600)");
  ok("first purchase goes through", Object.keys(w.ctx.bank.ellis.withdrawals).length === 1);
  w.call("storeBuyCommit('ellis'," + JSON.stringify(it) + ",false,'▶️ 30 min of Tech',500)");
  ok("the same item seconds later is refused with a toast", Object.keys(w.ctx.bank.ellis.withdrawals).length === 1 && /wait a minute/.test(w.ctx.toasts[w.ctx.toasts.length - 1]));
  w.call("storeBuyCommit('ellis',{cost:15,label:'Candy',emoji:'🍬'},false,'🍬 Candy',500)");
  ok("a different item is fine", Object.keys(w.ctx.bank.ellis.withdrawals).length === 2);
  // an old purchase of the same item (2 minutes ago) does not block
  const old = world({ bank: { lucy: { withdrawals: { w1: { note: "▶️ 30 min of Tech", status: "given", iso: new Date(Date.now() - 120000).toISOString() } } } } });
  old.call("storeBuyCommit('lucy'," + JSON.stringify(it) + ",false,'▶️ 30 min of Tech',300)");
  ok("the same item two minutes later is allowed", Object.keys(old.ctx.bank.lucy.withdrawals).length === 2);
  const dec = world({ bank: { lucy: { withdrawals: { w1: { note: "▶️ 30 min of Tech", status: "declined", iso: new Date().toISOString() } } } } });
  dec.call("storeBuyCommit('lucy'," + JSON.stringify(it) + ",false,'▶️ 30 min of Tech',300)");
  ok("a declined request does not block a retry", Object.keys(dec.ctx.bank.lucy.withdrawals).length === 2);
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
