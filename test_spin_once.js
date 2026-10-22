/*
 * Node tests — 🎰 SPINONCE: one card earns ONE spin, ever (her rule 2026-10-22, after Sara DeWalt's report that her kids
 * un-ticked a card and re-ticked it as the day's last card for a NEW spin, a different amount each time).
 *   · a card whose spin record exists is never offered another spin — not its own, not the day bonus
 *   · un-tick takes the spun points back (pool / bank) and marks the record held — kept, never deleted
 *   · re-tick pays the SAME amount back (the ✅ CLOSEOUT release), no new spin, no new amount
 *   · Mom's manager says "taken back — un-ticked"; Reset still refunds right; old two-part records are untouched
 * Real code sliced out of index.html into a vm; Firebase is a recording stub (transactions run against a server copy).
 *   run:  node test_spin_once.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

const UNCHECK = cut('document.getElementById("dlg-uncheck").onclick=()=>{', "\nfunction closeDlg(");
const CODE = slice("getSpinResult") + "\n" + cut("// SPINMERGE_START", "// SPINMERGE_END") + "\n" + cut("// SPINONCE_START", "// SPINONCE_END") + "\n" +
  cut("// ── 🎰 held spins ──", "// A spin recorded as held on a tablet") + "\n" +
  ["coTask", "coDry", "showPaceToast", "spinAdminResetSpin"].map(slice).join("\n") + "\n" + UNCHECK;
const toMin = s => { const m = String(s).match(/(\d+):(\d+)\s*([AP]M)/i); if (!m) return 0; let h = +m[1] % 12; if (/p/i.test(m[3])) h += 12; return h * 60 + +m[2]; };

function world(o) {
  o = o || {};
  const store = { week1_spin_results: o.sr || {}, week1_slot_points: o.pool || {}, week1_spins_used: o.used || {}, week1_day_bonus_used: o.bonusUsed || {} };
  const srv = { "week1/slot_points/lincoln/monday": (o.pool && o.pool.lincoln && o.pool.lincoln.monday) || 0 };   // server copy for transactions
  Object.keys(o.sr || {}).forEach(id => { srv["week1/spin_results/" + id] = JSON.parse(JSON.stringify(o.sr[id])); });
  const writes = [], bank = [], bankRm = [], pts = [], pending = [], els = {}, tasks = o.tasks || [
    { id: "m1", who: "lincoln", day: "monday", time: "9:00 AM", dur: 30, title: "📘 Math — L12", subjectKey: "math" },
    { id: "w1", who: "lincoln", day: "monday", time: "10:00 AM", dur: 30, title: "✏️ Writing — L3", subjectKey: "wr" },
  ];
  const mkRef = p => ({
    set: v => { writes.push(["set", p, v]); return Promise.resolve(); },
    update: v => { writes.push(["update", p, v]); return Promise.resolve(); },
    remove: () => { writes.push(["remove", p]); return Promise.resolve(); },
    transaction: f => { const cur = p in srv ? srv[p] : null; const nv = f(cur === null ? null : JSON.parse(JSON.stringify(cur)));
      if (nv === undefined) return Promise.resolve({ committed: false }); srv[p] = nv; writes.push(["txn", p, nv]); return Promise.resolve({ committed: true }); } });
  const el = id => els[id] || (els[id] = { id, style: {}, classList: { add() {}, remove() {} }, textContent: "", className: "" });
  let bid = 0;
  const ctx = {
    console, JSON, Object, Array, Math, Date, Promise, String, Set, isNaN,
    WK: "week1", weekData: { tasks }, displacedResult: null, _todayDay: "monday", day: "monday", FIRST_KID: "lincoln",
    checked: o.checked || {}, claimed: o.claimed || {}, momMoves: {}, pendingSpins: {}, slotKid: null, slotSpinDay: null, paceToastTimer: null,
    pendingId: null, manualUnchecks: new Set(), ckForget: () => {}, lastCheckedWrite: 0, histState: {}, lidDoneRemove: () => {},
    closeDlg: () => {}, schedCascade: () => {}, renderAll: () => {}, dbg: () => {}, _coReleasing: {}, _coBooking: {},
    db: o.noDb ? null : { ref: mkRef }, _dryRun: () => !!o.dry, momHere: () => true,
    ld: k => store[k], sv: (k, v) => { store[k] = v; }, nowTs: () => "2:05 PM Oct 22",
    obSet: (p, v, w) => { writes.push(["set", p, JSON.parse(JSON.stringify(v)), w === undefined ? null : w]); srv[p] = JSON.parse(JSON.stringify(v)); }, obRemove: (p, w) => writes.push(["remove", p]),
    bankDirect: (k, n, note) => { bank.push([k, n, note]); return "bd" + (++bid); }, bankDirectRemove: (k, id) => bankRm.push([k, id]),
    getPointClaim: (k, d) => (o.pointClaims || {})[k + "_" + d] || null, gaBonusPctFor: () => 50,
    addKidPoints: (k, n, d, g) => { pts.push([k, n, d]); const all = store.week1_slot_points; all[k] = all[k] || {}; all[k][d] = (all[k][d] || 0) + n; srv["week1/slot_points/" + k + "/" + d] = (srv["week1/slot_points/" + k + "/" + d] || 0) + n; },
    taskLessonRef: t => (t.title.split(" — ")[1] || ""), cap: s => s ? s[0].toUpperCase() + s.slice(1) : s, esc: s => String(s), toMin,
    effectiveDay: t => t.day, dsRetime: x => x, _dismissed: () => false, _mlNowMin: () => toMin("1:00 PM"), _mlDayEndMin: () => toMin("3:45 PM"),
    hasSpun: id => !!store.week1_spins_used[id], markSpun: id => { store.week1_spins_used[id] = true; },
    hasDayBonus: (k, d) => !!store.week1_day_bonus_used[k + "_" + d], markDayBonus: (k, d) => { store.week1_day_bonus_used[k + "_" + d] = (store.week1_day_bonus_used[k + "_" + d] || 0) + 1; },
    addPendingSpin: (id, k, d) => { pending.push([id, k, d]); ctx.pendingSpins[id] = { kid: k, day: d }; }, claimPendingSpin: id => { delete ctx.pendingSpins[id]; },
    spinGateFor: () => ({ enabled: false, window: 5 }), celebrateDayComplete: () => {},
    setTimeout: f => { f(); return 1; }, clearTimeout: () => {},
    document: { getElementById: el },
  };
  vm.createContext(ctx); vm.runInContext(CODE, ctx);
  const w = { ctx, store, srv, writes, bank, bankRm, pts, pending, els, flush: () => new Promise(r => setTimeout(r, 0)) };
  // the kid taps a card: checked + the spin decision (finalizeDone → showPaceToast, as the check-off handler does)
  w.tick = id => { ctx.checked[id] = "x"; ctx.showPaceToast(id); };
  // the slot machine lands: the record is written, the points paid (pool unless told otherwise)
  w.spun = (id, rec, toPool) => { store.week1_spin_results[id] = rec; srv["week1/spin_results/" + id] = JSON.parse(JSON.stringify(rec)); store.week1_spins_used[id] = true; delete ctx.pendingSpins[id]; if (toPool !== false && rec.pts > 0) ctx.addKidPoints(rec.kid, rec.pts, rec.day, null); };
  // the kid un-ticks: the dialog's own handler
  w.untick = id => { ctx.pendingId = id; els["dlg-uncheck"].onclick(); };
  // the kid re-ticks: finalizeDone → coOnDone → coReleaseHeld pays the held record back, then the spin decision
  w.retick = async id => { ctx.checked[id] = "y"; ctx.coReleaseHeld(id); await w.flush(); ctx.showPaceToast(id); };
  w.pool = () => ((store.week1_slot_points.lincoln || {}).monday) || 0;
  w.rec = id => store.week1_spin_results[id];
  return w;
}

(async () => {
  console.log("── Sara's case: the last card's day-bonus spin, un-ticked and re-ticked ──");
  {
    const w = world();
    w.tick("m1"); w.spun("m1", { pts: 10, kid: "lincoln", day: "monday", ts: 1 });
    w.tick("w1");
    ok("the last card earns the day bonus (one pending spin)", w.pending.length === 2 && w.pending[1][0] === "w1" && w.store.week1_day_bonus_used.lincoln_monday === 1);
    w.spun("w1", { pts: 25, kid: "lincoln", day: "monday", ts: 2 });
    ok("both spins paid into the day pool: 10 + 25 = 35", w.pool() === 35 && w.srv["week1/slot_points/lincoln/monday"] === 35);
    const before = w.writes.length;
    w.untick("w1");
    ok("un-tick takes exactly the 25 back out of the pool (35 → 10), on the server too", w.pool() === 10 && w.srv["week1/slot_points/lincoln/monday"] === 10, w.store.week1_slot_points);
    const txn = w.writes.slice(before).filter(x => x[0] === "txn" && x[1] === "week1/slot_points/lincoln/monday");
    ok("the pool write is a transaction (never a whole-table set)", txn.length === 1 && txn[0][2] === 10);
    const r = w.rec("w1");
    ok("the record is held, not deleted — the 25 is remembered", r && r.pts === 25 && r.held === true && r.heldWhy === "untick" && r.heldAt);
    const srw = w.writes.slice(before).filter(x => x[1] === "week1/spin_results/w1");
    ok("one targeted set of the record, outbox-noted with what it replaced", srw.length === 1 && srw[0][0] === "set" && srw[0][2].held === true && srw[0][3] && srw[0][3].held === undefined && srw[0][3].pts === 25);
    ok("the bank is untouched (nothing there was this spin's)", w.bank.length === 0 && w.bankRm.length === 0);
    ok("Mom's manager reads it plainly", w.ctx.spinOnceLabel(r) === "+25 pts — taken back — un-ticked" && w.ctx.spinOnceHeld(r));
    const pend = w.pending.length, dbu = w.store.week1_day_bonus_used.lincoln_monday;
    await w.retick("w1");
    ok("re-tick restores the same 25 to the pool (10 → 35)", w.pool() === 35 && w.pts[w.pts.length - 1][1] === 25);
    const r2 = w.rec("w1");
    ok("the hold clears, the un-tick marks go, the release is stamped", r2 && !r2.held && r2.heldWhy === undefined && r2.heldAt === undefined && r2.released && r2.pts === 25);
    ok("NO new spin: no pending spin, no 🎰 button, the day bonus not marked again", w.pending.length === pend && !w.ctx.pendingSpins.w1 && w.store.week1_day_bonus_used.lincoln_monday === dbu);
    ok("the kid sees why", w.els["pace-toast"].textContent === "✅ Done! This card already had its spin.");
    ok("the manager no longer says taken back", w.ctx.spinOnceLabel(r2) === null);
    // and again — the loop Sara's kids found never pays twice
    w.untick("w1"); await w.retick("w1");
    ok("a second un-tick / re-tick round: still 35 in the pool, still no spin", w.pool() === 35 && w.pending.length === pend);
  }

  console.log("── the other order: an earlier card re-ticked as the day's new last card ──");
  {
    const w = world();
    w.tick("m1"); w.spun("m1", { pts: 10, kid: "lincoln", day: "monday", ts: 1 });
    w.untick("m1");
    ok("m1's 10 came back off", w.pool() === 0 && w.rec("m1").held === true);
    w.tick("w1");
    ok("w1 is not the last card while m1 is open → its own spin, no day bonus", w.pending.length === 2 && !w.store.week1_day_bonus_used.lincoln_monday);
    w.spun("w1", { pts: 5, kid: "lincoln", day: "monday", ts: 2 });
    await w.retick("m1");
    ok("m1 re-ticked IS the last card, the day bonus unspent — but it already spun: nothing queued", w.pending.length === 2 && !w.ctx.pendingSpins.m1 && !w.store.week1_day_bonus_used.lincoln_monday);
    ok("its 10 is back (10 + 5 = 15)", w.pool() === 15);
  }

  console.log("── the day bonus: once per kid per day ──");
  {
    const late = { id: "x1", who: "lincoln", day: "monday", time: "2:00 PM", dur: 20, title: "📖 Reading — Ch 4", subjectKey: "rd" };
    const w = world({ tasks: [
      { id: "m1", who: "lincoln", day: "monday", time: "9:00 AM", dur: 30, title: "📘 Math — L12", subjectKey: "math" },
      { id: "w1", who: "lincoln", day: "monday", time: "10:00 AM", dur: 30, title: "✏️ Writing — L3", subjectKey: "wr" }, late] });
    w.tick("m1"); w.spun("m1", { pts: 10, kid: "lincoln", day: "monday", ts: 1 });
    w.tick("w1"); w.spun("w1", { pts: 2, kid: "lincoln", day: "monday", ts: 2 });
    w.tick("x1");
    ok("the genuinely last card gets the day bonus", w.store.week1_day_bonus_used.lincoln_monday === 1 && w.pending[2][0] === "x1");
    w.spun("x1", { pts: 25, kid: "lincoln", day: "monday", ts: 3 });
    w.untick("x1"); await w.retick("x1");
    ok("a second day-bonus attempt the same day queues nothing", w.pending.length === 3 && w.store.week1_day_bonus_used.lincoln_monday === 1);
    w.untick("w1"); await w.retick("w1");
    ok("nor does re-ticking an earlier card as the new last card", w.pending.length === 3 && w.store.week1_day_bonus_used.lincoln_monday === 1 && w.pool() === 37);
  }

  console.log("── a card with no record still gets its first spin ──");
  {
    const w = world();
    w.tick("m1");
    ok("first tick → one pending spin, spins_used set, no day bonus (w1 still open)", w.pending.length === 1 && w.pending[0][0] === "m1" && w.store.week1_spins_used.m1 === true && !w.store.week1_day_bonus_used.lincoln_monday);
    w.untick("m1");
    ok("un-ticking before the spin is taken: nothing to take back, no record written", w.rec("m1") === undefined && w.pool() === 0 && !w.writes.some(x => x[1] === "week1/spin_results/m1"));
    w.tick("m1");
    ok("re-tick with no record: the one pending spin is still there to take, nothing added (spins_used already set)", Object.keys(w.ctx.pendingSpins).length === 1 && !!w.ctx.pendingSpins.m1 && w.pending.length === 1);
    ok("nothing in spinOnceHas for a card that never spun", w.ctx.spinOnceHas("m1") === false && w.ctx.spinOnceLabel(null) === null);
  }

  console.log("── the pool already claimed / cashed: the bank is where it lives now ──");
  {
    const w = world({ pointClaims: { lincoln_monday: { status: "cashed", earned: 35 } } });
    w.tick("m1"); w.spun("m1", { pts: 25, kid: "lincoln", day: "monday", ts: 1 });
    w.untick("m1");
    ok("un-tick takes 25 off the bank with a plain note, the closed pool untouched", w.bank.length === 1 && w.bank[0][0] === "lincoln" && w.bank[0][1] === -25 && w.bank[0][2] === "🎰 Un-ticked — spin taken back — L12" && w.pool() === 25);
    await w.retick("m1");
    ok("re-tick banks the same 25 back, noted as a restore", w.bank.length === 2 && w.bank[1][1] === 25 && w.bank[1][2] === "🎰 Spin — L12 — re-ticked, spin restored");
    ok("the record remembers where it went (bank id on it) and is no longer held", w.rec("m1").gaBid === "bd2" && !w.rec("m1").held);
  }

  console.log("── got-ahead: the banked spin + bonus comes off and goes back ──");
  {
    const w = world({ tasks: [
      { id: "g1", who: "lincoln", day: "monday", time: "9:00 AM", dur: 30, title: "📘 Math — L13", subjectKey: "math", gotAhead: "wednesday" },
      { id: "w1", who: "lincoln", day: "monday", time: "10:00 AM", dur: 30, title: "✏️ Writing — L3", subjectKey: "wr" }] });
    w.tick("g1"); w.spun("g1", { pts: 20, kid: "lincoln", day: "monday", ts: 1, gaBank: 30, gaBonus: 10, gaBid: "b1" }, false);
    w.untick("g1");
    ok("the got-ahead bank entry is removed exactly as before (gaBid handling unchanged)", w.bankRm.length === 1 && w.bankRm[0][1] === "b1" && w.pool() === 0);
    ok("the record is held with its dead bank id dropped", w.rec("g1").held === true && w.rec("g1").gaBid === undefined && w.rec("g1").pts === 20);
    await w.retick("g1");
    ok("re-tick banks spin + half again (20 + 10 = 30), noted as a restore", w.bank.length === 1 && w.bank[0][1] === 30 && w.bank[0][2] === "⏩ Got ahead — L13 (spin 20 + 10) — re-ticked, spin restored");
    ok("no new spin", w.pending.length === 1 && !w.ctx.pendingSpins.g1);
  }

  console.log("── a sent-to-Mom spin on hold (✅ CLOSEOUT) is not this rule's to touch ──");
  {
    const w = world({ sr: { m1: { pts: 10, kid: "lincoln", day: "monday", ts: 1, held: true } } });
    ok("nothing taken (never paid), no write, no un-tick mark", w.ctx.spinOnceTakeBack("m1") === 0 && w.writes.length === 0 && w.rec("m1").heldWhy === undefined && !w.ctx.spinOnceHeld(w.rec("m1")));
    ok("the manager keeps its closeout wording for it", w.ctx.spinOnceLabel(w.rec("m1")) === null);
  }

  console.log("── legacy two-part record (SPINMERGE, Kenzie 10/5: 25 + 5) ──");
  {
    const legacy = { pts: 30, kid: "lincoln", day: "monday", ts: 2, parts: [{ pts: 25, kid: "lincoln", day: "monday", ts: 1 }, { pts: 5, kid: "lincoln", day: "monday", ts: 2 }] };
    const w = world({ sr: { m1: JSON.parse(JSON.stringify(legacy)) }, pool: { lincoln: { monday: 81 } }, used: { m1: true }, checked: { m1: "x", w1: "x" }, bonusUsed: { lincoln_monday: 1 } });
    ok("left untouched: not held, no label, nothing migrates", JSON.stringify(w.rec("m1")) === JSON.stringify(legacy) && !w.ctx.spinOnceHeld(w.rec("m1")) && w.ctx.spinOnceLabel(w.rec("m1")) === null);
    w.ctx.spinAdminResetSpin("m1", "lincoln", "monday");
    ok("Reset refunds the sum, 25 + 5 (81 → 51), and re-offers one spin", w.pool() === 51 && w.pending.length === 1 && !w.rec("m1"));
  }
  {
    const legacy = { pts: 30, kid: "lincoln", day: "monday", ts: 2, parts: [{ pts: 25, kid: "lincoln", day: "monday", ts: 1 }, { pts: 5, kid: "lincoln", day: "monday", ts: 2 }] };
    const w = world({ sr: { m1: legacy }, pool: { lincoln: { monday: 81 } }, used: { m1: true }, checked: { m1: "x", w1: "x" }, bonusUsed: { lincoln_monday: 1 } });
    w.untick("m1");
    ok("un-ticking it takes back both parts (81 → 51) and holds the whole record", w.pool() === 51 && w.rec("m1").held && w.rec("m1").parts.every(p => p.held) && w.rec("m1").pts === 30 && w.ctx.spinOnceLabel(w.rec("m1")) === "+30 pts — taken back — un-ticked");
    const pend = w.pending.length;
    await w.retick("m1");
    ok("re-tick restores 30 as one record, no third spin", w.pool() === 81 && w.pending.length === pend && !w.rec("m1").held && w.rec("m1").parts.every(p => !p.held) && w.rec("m1").pts === 30);
  }

  console.log("── Reset on a taken-back record refunds nothing more ──");
  {
    const w = world();
    w.tick("m1"); w.spun("m1", { pts: 25, kid: "lincoln", day: "monday", ts: 1 });
    w.untick("m1");
    ok("25 already back (pool 0)", w.pool() === 0);
    w.ctx.spinAdminResetSpin("m1", "lincoln", "monday");
    ok("Reset leaves the pool at 0 (nothing to refund twice), removes the record, offers a fresh spin", w.pool() === 0 && w.srv["week1/slot_points/lincoln/monday"] === 0 && !w.rec("m1") && w.pending.length === 2);
  }

  console.log("── dry-run / offline ──");
  {
    const w = world({ dry: true });
    w.tick("m1"); w.spun("m1", { pts: 25, kid: "lincoln", day: "monday", ts: 1 });
    const n = w.writes.filter(x => x[0] === "txn").length;
    w.untick("m1");
    ok("dry-run: the screen changes (25 → 0, held), no transaction reaches Firebase", w.pool() === 0 && w.rec("m1").held && w.writes.filter(x => x[0] === "txn").length === n);
    await w.retick("m1");
    ok("dry-run re-tick restores on this screen only", w.pool() === 25 && !w.rec("m1").held);
  }
  {
    const w = world({ noDb: true });
    w.tick("m1"); w.spun("m1", { pts: 25, kid: "lincoln", day: "monday", ts: 1 });
    w.untick("m1"); await w.retick("m1");
    ok("no db at all: still coherent (0 then 25), nothing thrown", w.pool() === 25 && !w.rec("m1").held);
  }

  console.log("── wiring in index.html ──");
  const sm = src.indexOf("// SPINMERGE_END"), so = src.indexOf("// SPINONCE_START"), soe = src.indexOf("// SPINONCE_END");
  ok("SPINONCE block sits right after SPINMERGE_END", sm > 0 && so > sm && src.slice(sm, so).trim() === "// SPINMERGE_END" && soe > so);
  ok("showPaceToast asks spinOnceHas BEFORE the day-bonus branch", /const _once=\(typeof spinOnceHas==="function"\)&&spinOnceHas\(taskId\);[\s\S]{0,700}if\(_once\)\{ cls="on-track"; msg="✅ Done! This card already had its spin\."; \}[^\n]*\n  else if\(isLastTask && !dayBonusClaimed\)\{/.test(src));
  ok("the un-tick dialog calls the take-back right after the got-ahead line", /bankDirectRemove\(p\.kid\|\|_sr\.kid,p\.gaBid\); \}\); \}catch\(e\)\{\}[^\n]*\n  try\{ if\(typeof spinOnceTakeBack==="function"\) spinOnceTakeBack\(id\); \}catch\(e\)\{ dbg\("spin once take-back: "\+e\); \}/.test(src));
  ok("re-tick's restore rides finalizeDone → coOnDone → coReleaseHeld (unchanged)", /coOnDone\(id\); \}catch\(e\)\{ dbg\("closeout on-done: "\+e\); \}/.test(src) && /function coOnDone\(id\)\{[\s\S]{0,400}coReleaseHeld\(id\);\n\}/.test(src));
  ok("the closeout release clears the un-tick marks", src.includes('if(typeof spinOnceClear==="function") spinOnceClear(r); r.released=nowTs(); return r; }'));
  ok("the manager shows the held state plainly", src.includes("const _sol=(typeof spinOnceLabel===\"function\")?spinOnceLabel(sr):null; if(_sol){ statusIcon='↩'; statusColor='#fca5a5'; statusText=_sol; }"));
  ok("outbox guard path unchanged: spin points are still guarded by their spin record", /addKidPoints\(k,outcome\.pts,d,_srGuard\)/.test(src) && /_srGuard=slotPendingTaskId\?\(WK\+"\/spin_results\/"\+slotPendingTaskId\+\(_srOld\?"\/parts\/"\+spinRecParts\(_srOld\)\.length:""\)\)/.test(src) && src.includes("if(_srOld) _srRec=spinMergeRec(_srOld,_srRec);"));
  ok("got-ahead handling unchanged (Reset and un-tick remove by gaBid as before)", /spinRecParts\(sr\[taskId\]\)\.forEach\(p=>\{[\s\S]{0,120}if\(p\.gaBid&&typeof bankDirectRemove==="function"\)\{ try\{ bankDirectRemove\(kid,p\.gaBid\); \}catch\(e\)\{\} \}/.test(src) && src.includes("spinRecParts(_sr).forEach(function(p){ if(p.gaBid&&typeof bankDirectRemove===\"function\") bankDirectRemove(p.kid||_sr.kid,p.gaBid); });"));
  const block = src.slice(so, soe);
  ok("the block writes only targeted paths: one spin record, a pool transaction, bank entries", /obSet\(WK\+"\/spin_results\/"\+id,rec,was\)/.test(block) && /db\.ref\(WK\+"\/slot_points\/"\+k\+"\/"\+d\)\.transaction/.test(block) && !/\.set\(/.test(block) && !/spin_results"\)\.set|spin_results"\)\.update/.test(block));
  ok("no whole-table write anywhere new", !/db\.ref\(WK\+"\/spin_results"\)\.set/.test(src) && !/db\.ref\(WK\+"\/slot_points"\)\.set/.test(src));

  console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
