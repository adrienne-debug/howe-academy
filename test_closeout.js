/*
 * Node tests — ✅ CLOSEOUT (#30 part 2, her answers 2026-10-08): the close-out checklist on 🏡 Home Base
 * (✓ Approve · ↩ Send back Now / Later today / Tomorrow · 💬 Let's discuss) and spin-on-send with the points
 * HELD until Mom's check (a send-back keeps the result on hold; the redo's approval releases it, no 2nd spin).
 * Real code sliced out of index.html into a vm; Firebase is a recording stub.
 *   run:  node test_closeout.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

const CODE = cut("// SPINMERGE_START", "// SPINMERGE_END") + "\n" + cut("// ✅ CLOSEOUT_START", "// ✅ CLOSEOUT_END") + "\n" +
  ["momReject", "showPaceToast", "spinSlots", "spinAdminResetSpin"].map(slice).join("\n");
const toMin = s => { const m = String(s).match(/(\d+):(\d+)\s*([AP]M)/i); if (!m) return 0; let h = +m[1] % 12; if (/p/i.test(m[3])) h += 12; return h * 60 + +m[2]; };
const fromMin = n => { let h = Math.floor(n / 60), m = n % 60, ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return h + ":" + String(m).padStart(2, "0") + " " + ap; };

function world(o) {
  o = o || {};
  const store = { week1_spin_results: o.sr || {}, week1_slot_points: {}, week1_spins_used: o.used || {}, week1_day_bonus_used: {} };
  const writes = [], bank = [], pts = [], pending = [], toasts = [], booked = [], pushed = [], els = {};
  const srv = {};   // server copy for transactions
  const mkRef = p => ({
    set: v => { writes.push(["set", p, v]); return Promise.resolve(); },
    update: v => { writes.push(["update", p, v]); return Promise.resolve(); },
    remove: () => { writes.push(["remove", p]); return Promise.resolve(); },
    transaction: f => { const cur = p in srv ? srv[p] : null; const nv = f(cur === null ? null : JSON.parse(JSON.stringify(cur)));
      if (nv === undefined) return Promise.resolve({ committed: false }); srv[p] = nv; writes.push(["txn", p, nv]); return Promise.resolve({ committed: true }); } });
  const el = id => els[id] || (els[id] = { id, style: {}, classList: { add() {}, remove() {} }, textContent: "", className: "", disabled: false, innerHTML: "", offsetHeight: 0, remove() { delete els[id]; } });
  const tasks = o.tasks || [
    { id: "m1", who: "lincoln", day: "monday", time: "9:00 AM", dur: 30, title: "📘 Math — L12", subjectKey: "math" },
    { id: "w1", who: "lincoln", day: "monday", time: "10:00 AM", dur: 30, title: "✏️ Writing — L3", subjectKey: "wr" },
    { id: "r1", who: "lincoln", day: "monday", time: "11:00 AM", dur: 20, title: "📖 Reading", subjectKey: "rd" },
    { id: "cn", who: "lincoln", day: "monday", time: "3:30 PM", dur: 15, title: "📓 Closing Notebook", subjectKey: "closing_nb" },
  ];
  const ctx = {
    console, JSON, Object, Array, Math, Date, Promise, String, isNaN,
    WK: "week1", weekData: { tasks }, displacedResult: null, _todayDay: "monday", day: "monday", FIRST_KID: "lincoln",
    checked: o.checked || {}, claimed: o.claimed || {}, coSentBack: o.sentBack || {}, coDiscuss: o.discuss || {}, momMoves: {},
    pendingSpins: {}, slotKid: null, slotSpinDay: null, slotPendingTaskId: null, paceToastTimer: null,
    SLOT_SYMBOLS: ["⭐", "🔥", "💎", "🎯", "🌟", "🍀", "❌"], pickOutcome: () => ({ pts: o.spin || 10, msg: "Amazing" }),
    db: o.noDb ? null : { ref: mkRef }, _dryRun: () => !!o.dry,
    ld: k => store[k], sv: (k, v) => { store[k] = v; }, nowTs: () => "2:05 PM Oct 8", dbg: () => {},
    momHere: () => o.mom !== false, renderAll: () => {}, gwShowToast: t => toasts.push(t), esc: s => String(s), cap: s => s ? s[0].toUpperCase() + s.slice(1) : s,
    taskSubject: t => t.title.split(" — ")[0], taskLessonRef: t => (t.title.split(" — ")[1] || ""), rvBtn: () => "",
    toMin, fromMin, _mlNowMin: () => o.now != null ? o.now : toMin("1:00 PM"), _mlDayEndMin: () => toMin("3:45 PM"), _mlLunchWin: () => null,
    _efIsClose: t => t.subjectKey === "closing_nb", effectiveDay: t => t.day, dsRetime: x => x, _dismissed: () => false,
    obRemove: (p, w) => writes.push(["remove", p]), obSet: (p, v) => writes.push(["set", p, v]), lastTasksWrite: 0,
    addKidPoints: (k, n, d) => pts.push([k, n, d]), bankDirect: (k, n, note) => { bank.push([k, n, note]); return "bd" + bank.length; },
    bankDirectRemove: () => {}, getPointClaim: (k, d) => (o.pointClaims || {})[k + "_" + d] || null, gaBonusPctFor: () => 50,
    hasSpun: id => !!store.week1_spins_used[id], markSpun: id => { store.week1_spins_used[id] = true; },
    hasDayBonus: (k, d) => !!store.week1_day_bonus_used[k + "_" + d], markDayBonus: (k, d) => { store.week1_day_bonus_used[k + "_" + d] = true; },
    addPendingSpin: (id, k, d) => pending.push([id, k, d]), claimPendingSpin: () => {}, spinGateFor: () => ({ enabled: false, window: 5 }),
    celebrateDayComplete: () => {}, getKidDayPoints: () => 0, getKidPoints: () => 0, closeSlotMachine: () => {},
    pushTaskForward: id => pushed.push(id), rvCanToday: () => true,
    rvBook: (k, id, opts) => { booked.push([k, id, opts]); return { id: "rev1" }; },
    prompt: () => (o.prompt === undefined ? "his carrying" : o.prompt),
    setTimeout: f => f(), clearTimeout: () => {},
    document: { getElementById: el, createElement: () => el("co-sb-dlg"), body: { appendChild: () => {} } },
  };
  vm.createContext(ctx); vm.runInContext(CODE, ctx);
  return { ctx, store, writes, bank, pts, pending, toasts, booked, pushed, srv, flush: () => new Promise(r => setImmediate(r)) };
}

(async () => {
  console.log("── spin on send (Q5) ──");
  {
    const w = world({ claimed: { m1: "9:20 AM" } });
    w.ctx.coSpinOnClaim("m1");
    ok("sending a Mom-checked card earns its spin right away", w.pending.length === 1 && w.pending[0][0] === "m1" && w.store.week1_spins_used.m1);
    ok("no pace toast on a send (\"Sent to Mom\" stays up)", !w.ctx.document.getElementById("pace-toast").className);
  }
  {
    const w = world({ claimed: { m1: "9:20 AM", w1: "10:10 AM", r1: "11:00 AM" }, checked: { cn: "3:30 PM" } });
    w.ctx.coSpinOnClaim("r1");
    ok("last card SENT → the day bonus comes now (sent counts as done)", w.store.week1_day_bonus_used.lincoln_monday && w.pending.length === 1);
  }
  {
    const w = world({ claimed: { m1: "9:20 AM" }, used: { m1: true } });
    w.ctx.coSpinOnClaim("m1");
    ok("already spun (sent back, redone, sent again) → no second spin", w.pending.length === 0);
  }

  console.log("── the spin itself: held until Mom's check ──");
  {
    const w = world({ claimed: { m1: "9:20 AM" }, spin: 10 });
    w.ctx.slotPendingTaskId = "m1"; w.ctx.slotKid = "lincoln"; w.ctx.slotSpinDay = "monday";
    w.ctx.spinSlots();
    const rec = w.store.week1_spin_results.m1;
    ok("spin on a sent (unchecked) card adds NOTHING to the tally", w.pts.length === 0 && w.bank.length === 0, w.pts);
    ok("its record is held", rec && rec.held === true && rec.pts === 10, rec);
    ok("the kid is told it's saved", /saved until Mom checks it/.test(w.ctx.document.getElementById("slot-result").textContent));
    ok("record written targeted", w.writes.some(x => x[0] === "set" && x[1] === "week1/spin_results/m1" && x[2].held === true));
  }
  {
    const w = world({ checked: { m1: "9:20 AM" }, spin: 10 });
    w.ctx.slotPendingTaskId = "m1"; w.ctx.slotKid = "lincoln"; w.ctx.slotSpinDay = "monday";
    w.ctx.spinSlots();
    ok("control: a checked card's spin pays the pool exactly as before", w.pts.length === 1 && w.pts[0][1] === 10 && !w.store.week1_spin_results.m1.held);
  }
  {
    const w = world({ spin: 5 });
    w.ctx.slotPendingTaskId = "manual_lincoln_monday_1"; w.ctx.slotKid = "lincoln"; w.ctx.slotSpinDay = "monday";
    w.ctx.spinSlots();
    ok("control: Mom's manual bonus spin (no card) pays as before", w.pts.length === 1 && w.pts[0][1] === 5);
  }

  console.log("── release on Mom's check ──");
  {
    const rec = { pts: 10, kid: "lincoln", day: "monday", ts: 1, held: true };
    const w = world({ sr: { m1: rec }, checked: { m1: "9:20 AM" } });
    w.srv["week1/spin_results/m1"] = JSON.parse(JSON.stringify(rec));
    w.ctx.coOnDone("m1"); await w.flush();
    ok("approval pays the held 10 into the spin's day pool", w.pts.length === 1 && w.pts[0][0] === "lincoln" && w.pts[0][1] === 10 && w.pts[0][2] === "monday", w.pts);
    ok("record flipped by transaction (held gone, released stamped)", !w.srv["week1/spin_results/m1"].held && w.srv["week1/spin_results/m1"].released);
    w.ctx._coReleasing = {}; vm.runInContext("_coReleasing={}", w.ctx);
    w.store.week1_spin_results.m1 = Object.assign({}, rec);   // a stale device still thinks it is held
    w.ctx.coReleaseHeld("m1"); await w.flush();
    ok("a second device (stale copy) pays NOTHING — the transaction aborts", w.pts.length === 1, w.pts);
  }
  {
    const rec = { pts: 10, kid: "lincoln", day: "monday", ts: 1, held: true };
    const w = world({ sr: { m1: rec }, checked: { m1: "x" }, noDb: true });
    w.ctx.coReleaseHeld("m1"); w.ctx.coReleaseHeld("m1");
    ok("offline/no-db: paid once locally", w.pts.length === 1 && !w.store.week1_spin_results.m1.held);
  }
  {
    const rec = { pts: 10, kid: "lincoln", day: "monday", ts: 1, held: true };
    const w = world({ sr: { m1: rec }, checked: { m1: "x" }, pointClaims: { lincoln_monday: { status: "forfeited" } } });
    w.srv["week1/spin_results/m1"] = JSON.parse(JSON.stringify(rec));
    w.ctx.coReleaseHeld("m1"); await w.flush();
    ok("that day's points already closed → straight to the bank (not lost in a closed pool)", w.pts.length === 0 && w.bank.length === 1 && w.bank[0][1] === 10);
    ok("bank id stored on the record so Reset / un-check can take it back", w.writes.some(x => x[1] === "week1/spin_results/m1/gaBid" && x[2] === "bd1"));
  }
  {
    const t = [{ id: "g1", who: "ellis", day: "monday", time: "9:00 AM", dur: 30, title: "Sci — L5", gotAhead: "wednesday" }];
    const rec = { pts: 20, kid: "ellis", day: "monday", ts: 1, held: true };
    const w = world({ tasks: t, sr: { g1: rec }, checked: { g1: "x" } });
    w.srv["week1/spin_results/g1"] = JSON.parse(JSON.stringify(rec));
    w.ctx.coReleaseHeld("g1"); await w.flush();
    ok("got-ahead card: spin + 50% to the bank (her 9/23 rule) on release", w.bank.length === 1 && w.bank[0][1] === 30 && w.pts.length === 0);
  }
  {
    const rec = { pts: 15, kid: "lincoln", day: "monday", ts: 2, parts: [{ pts: 10, kid: "lincoln", day: "monday", ts: 1, held: true }, { pts: 5, kid: "lincoln", day: "monday", ts: 2, held: true }] };
    const w = world({ sr: { m1: rec }, checked: { m1: "x" } });
    w.srv["week1/spin_results/m1"] = JSON.parse(JSON.stringify(rec));
    w.ctx.coReleaseHeld("m1"); await w.flush();
    ok("own spin + day bonus both held → both paid", w.pts.length === 2 && w.pts[0][1] + w.pts[1][1] === 15);
  }
  {
    const w = world({ sr: { m1: { pts: 10, kid: "lincoln", day: "monday", held: true }, w1: { pts: 5, kid: "lincoln", day: "monday", held: true } }, checked: { m1: "x" } });
    w.srv["week1/spin_results/m1"] = { pts: 10, kid: "lincoln", day: "monday", held: true };
    w.ctx.coHealHeld(); await w.flush();
    ok("heal: a held spin whose card got checked pays; one still waiting stays held", w.pts.length === 1 && w.pts[0][1] === 10 && w.store.week1_spin_results.w1.held);
  }
  {
    const w = world({ sr: { m1: { pts: 10, kid: "lincoln", day: "monday", held: true } } });
    w.store.week1_slot_points = { lincoln: { monday: 40 } };
    w.ctx.spinAdminResetSpin("m1", "lincoln", "monday");
    ok("Mom's Reset of a held spin takes nothing off the pool (it was never added)", w.store.week1_slot_points.lincoln.monday === 40);
  }
  {
    const merged = vm.runInContext("spinMergeRec({pts:10,kid:'k',day:'monday',ts:1,held:true},{pts:5,kid:'k',day:'monday',ts:2,held:true})", world().ctx);
    ok("merge keeps held per part, not on top", merged.parts[0].held && merged.parts[1].held && merged.held === undefined);
  }

  console.log("── ↩ Send back: Now / Later today / Tomorrow (Q1 d) ──");
  {
    const w = world({ claimed: { m1: "9:20 AM" }, sr: { m1: { pts: 10, kid: "lincoln", day: "monday", held: true } } });
    w.ctx.coSendBack("m1", "now");
    ok("Now: claim removed (targeted)", !w.ctx.claimed.m1 && w.writes.some(x => x[0] === "remove" && x[1] === "week1/claimed/m1"));
    ok("Now: marker written for the kid's \"↩ Do this again\"", w.writes.some(x => x[0] === "set" && x[1] === "week1/sentBack/m1" && x[2].mode === "now" && x[2].n === 1));
    ok("Now: no card moved", !w.writes.some(x => /tasks/.test(x[1])) && !w.pushed.length);
    ok("held spin stays held through a send-back", w.store.week1_spin_results.m1.held === true && w.pts.length === 0);
    const row = w.ctx.coKidSentBackRow("m1");
    ok("kid sees Do this again + their saved spin", /Do this again/.test(row) && /\+10/.test(row));
  }
  {
    const w = world({ claimed: { m1: "9:20 AM" }, now: toMin("10:15 AM") });
    w.ctx.coSendBack("m1", "later");
    const t = w.ctx.weekData.tasks.find(x => x.id === "m1");
    ok("Later today: card goes after what's left (Reading ends 11:20), before the Closing Notebook", t.time === "11:20 AM", t.time);
    ok("Later today: ONE targeted time write", w.writes.filter(x => x[1] === "week1/tasks").length === 1 && JSON.stringify(w.writes.find(x => x[1] === "week1/tasks")[2]) === JSON.stringify({ "m1/time": "11:20 AM" }));
    ok("marker mode later", w.ctx.coSentBack.m1.mode === "later");
  }
  {
    const w = world({ claimed: { m1: "9:20 AM" }, now: toMin("4:00 PM") });
    w.ctx.coSendBack("m1", "later");
    ok("after school end, Later today is not offered → falls back to Now (no time write)", w.ctx.coSentBack.m1.mode === "now" && !w.writes.some(x => x[1] === "week1/tasks"));
  }
  {
    const w = world({ claimed: { m1: "9:20 AM" } });
    w.ctx.coSendBack("m1", "tomorrow");
    ok("Tomorrow: the existing push to the next school day", w.pushed.length === 1 && w.pushed[0] === "m1" && w.ctx.coSentBack.m1.mode === "tomorrow");
  }
  {
    const w = world({ claimed: { m1: "9:20 AM" }, mom: false });
    w.ctx.coSendBack("m1", "now");
    ok("not Mom → nothing", w.ctx.claimed.m1 && !w.writes.length);
  }
  {
    const w = world({ claimed: { m1: "9:20 AM" }, sentBack: { m1: { mode: "now", n: 1 } }, discuss: { m1: { note: "x" } }, sr: {} });
    w.ctx.coOnDone("m1");
    ok("approval clears the send-back + discuss markers (targeted removes)", !w.ctx.coSentBack.m1 && !w.ctx.coDiscuss.m1 && w.writes.some(x => x[0] === "remove" && x[1] === "week1/sentBack/m1") && w.writes.some(x => x[0] === "remove" && x[1] === "week1/discuss/m1"));
  }

  console.log("── 💬 Let's discuss (Q2 c, private Q3 b) ──");
  {
    const w = world({ claimed: { m1: "9:20 AM" } });
    w.ctx.coDiscussToggle("m1");
    ok("note written at WK/discuss/<id>", w.writes.some(x => x[0] === "set" && x[1] === "week1/discuss/m1" && x[2].note === "his carrying" && x[2].day === "monday"));
    ok("card stays waiting (still claimed)", w.ctx.claimed.m1 === "9:20 AM");
    ok("Mom's chips show it", /to discuss: his carrying/.test(w.ctx.coChipsHTML("m1")));
    ok("the kid's rows never mention it", !/discuss/i.test(w.ctx.coKidSentBackRow("m1") + w.ctx.coKidHeldLine("m1")));
    w.ctx.coDiscussToggle("m1");
    ok("tap again removes it", !w.ctx.coDiscuss.m1 && w.writes.some(x => x[0] === "remove" && x[1] === "week1/discuss/m1"));
  }
  {
    const w = world({ claimed: { m1: "x" }, prompt: null });
    w.ctx.coDiscussToggle("m1");
    ok("Cancel on the note → nothing written", !w.writes.length && !w.ctx.coDiscuss.m1);
  }
  {
    const w = world({ claimed: { m1: "x" }, discuss: { m1: { at: "x", kid: "lincoln", day: "monday", note: "carrying" } }, now: toMin("2:00 PM") });
    ok("before school end: no talk card", w.ctx.coDiscussSweep() === 0 && !w.booked.length);
  }
  {
    const w = world({ claimed: { m1: "x" }, discuss: { m1: { at: "x", kid: "lincoln", day: "monday", note: "carrying" } }, now: toMin("4:00 PM") });
    w.ctx.coDiscussSweep(); await w.flush();
    ok("after school end, still unchecked → ONE 10-min review card, next school day", w.booked.length === 1 && w.booked[0][2].minutes === 10 && w.booked[0][2].when === "next" && /carrying/.test(w.booked[0][2].note));
    ok("booked leaf claimed by transaction, then set to the card id", w.writes.some(x => x[0] === "txn" && x[1] === "week1/discuss/m1/booked") && w.writes.some(x => x[0] === "set" && x[1] === "week1/discuss/m1/booked" && x[2] === "rev1"));
    w.ctx.coDiscussSweep(); await w.flush();
    ok("never books twice", w.booked.length === 1);
  }
  {
    const w = world({ claimed: { m1: "x" }, discuss: { m1: { day: "monday" } }, now: toMin("4:00 PM") });
    w.srv["week1/discuss/m1/booked"] = "rev0";   // another Mom device already booked it
    w.ctx.coDiscussSweep(); await w.flush();
    ok("another device already booked it → this one doesn't", w.booked.length === 0);
  }
  {
    const w = world({ checked: { m1: "x" }, discuss: { m1: { day: "monday" } }, now: toMin("4:00 PM") });
    ok("approved before the end of the day → no talk card", w.ctx.coDiscussSweep() === 0);
  }

  console.log("── dry-run writes nothing ──");
  {
    const w = world({ dry: true, claimed: { m1: "x", w1: "y" }, discuss: { r1: { day: "sunday" } }, sr: { m1: { pts: 10, kid: "lincoln", day: "monday", held: true } }, now: toMin("10:15 AM") });
    w.ctx.coDiscussToggle("m1"); w.ctx.coSendBack("w1", "later"); w.ctx.coDiscussSweep();
    w.ctx.checked.m1 = "z"; w.ctx.coOnDone("m1"); await w.flush();
    ok("no db writes under ?dryrun=1 (closeout's own paths)", !w.writes.some(x => /sentBack|discuss|tasks|spin_results/.test(x[1])), w.writes);
  }

  console.log("── wiring in index.html ──");
  ok("finalizeDone releases + clears (before its return true)", /coOnDone\(id\); \}catch\(e\)\{ dbg\("closeout on-done: "\+e\); \}[^\n]*\n  return true;   \/\/ callers gate the spin/.test(src));
  ok("kid's send-to-Mom spins at once", /famCelebOwnWork\(t\.who,_todayDay\);[^\n]*\n    try\{ if\(typeof coSpinOnClaim==="function"\) coSpinOnClaim\(id\);[^\n]*\n    return;/.test(src));
  ok("Mom's claimed card carries the close-out actions", src.includes("coActionsHTML(srcId)+'</div>';"));
  ok("spin button on a sent / sent-back card", src.includes("const hasPending=!readOnly&&(done||claimedHere||_coSb)&&!!pendingSpins[t.id];"));
  ok("held spin never reaches addKidPoints at spin time", src.includes("if(_coHold){}   // ✅ CLOSEOUT: held — nothing to the tally until Mom's check\n      else if(!_gaOn) addKidPoints(k,outcome.pts,d,_srGuard);"));
  ok("Home Base header turns into Close out the day after school end", src.includes("✅ Close out the day · '+_waitN+' to check"));
  ok("sentBack + discuss listeners on the week", src.includes('db.ref(wk+"/sentBack")') && src.includes('db.ref(wk+"/discuss")'));
  const blk = cut("// ✅ CLOSEOUT_START", "// ✅ CLOSEOUT_END");
  ok("every write in the block sits behind coDry()/dry-run", (blk.match(/db\.ref\(/g) || []).length === 10 && !/\.set\(null\)|db\.ref\(WK\+"\/(tasks|discuss|sentBack)"\)\.set/.test(blk));

  console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
})();
