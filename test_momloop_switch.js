/*
 * Node tests for the READY SWITCHES on the Mom loop — her ask 2026-09-05, and her
 * mid-build check: "check for bugs when switches are flipped off and on throughout the day
 * and make sure things are never dropped."
 *
 * A DAY WALK: four kids, a realistic laid day, and a script of events — routine ends,
 * check-offs, breaks, kid switches off/on, Mom off/on — re-deriving the whole picture after
 * every step (exactly what renderSchedule does) and asserting the invariants that must
 * hold no matter what was flipped:
 *   · nothing is dropped: the laid list has the same ids as the stored list, every step
 *   · every card still has a real time
 *   · Mom is never in two places: no two Mom-required cards of ON kids overlap
 *   · no kid is laid on top of themselves, and never on top of their own lunch
 *   · lunch never moves; a checked card never moves
 *   · the loop never points at a switched-off kid, or at anyone while Mom is off
 *   · a started session (the hold) is never lost by a flip — it resumes
 *   · closing notebooks stay last in each kid's day
 *
 *   run:  node test_momloop_switch.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// MOMLOOP_START"), b = src.indexOf("// MOMLOOP_END");
if (a < 0 || b < 0) { console.error("MOMLOOP markers not found"); process.exit(1); }
const BLOCK = src.slice(a, b);
function slice(name) {
  const i = src.indexOf("function " + name);
  if (i < 0) { console.error(name + " not found"); process.exit(1); }
  return src.slice(i, src.indexOf("\n}", i) + 2);
}
const HELPERS = slice("toMin") + "\n" + slice("fromMin");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

// ── the world ────────────────────────────────────────────────────────────────────────────
let ID = 0;
function card(who, time, dur, mom, title, extra) {
  return Object.assign({ id: who + "_" + (ID++), who, day: "thursday", mom: mom || "none",
    time, dur: dur || 20, title: title || (who + " card") }, extra || {});
}
function world() {
  const T = [];
  // Julian: notebooks ARE Mom work
  T.push(card("julian", "10:00 AM", 15, "required", "Morning Notebook"));
  T.push(card("julian", "10:15 AM", 10, "required", "Daily Drill"));
  T.push(card("julian", "12:00 PM", 30, "none", "Lunch"));
  T.push(card("julian", "1:00 PM", 5, "none", "Closing Notebook", { subjectKey: "closing_nb" }));
  // Lucy
  T.push(card("lucy", "10:00 AM", 20, "none", "Notebook"));
  T.push(card("lucy", "10:20 AM", 20, "required", "Read-Aloud"));
  T.push(card("lucy", "10:40 AM", 25, "required", "Dimensions"));
  T.push(card("lucy", "11:05 AM", 15, "none", "Reading Eggs"));
  T.push(card("lucy", "12:00 PM", 30, "none", "Lunch"));
  T.push(card("lucy", "12:30 PM", 15, "maybe", "HWT"));
  T.push(card("lucy", "12:45 PM", 5, "none", "Closing Notebook", { subjectKey: "closing_nb" }));
  // Lincoln
  T.push(card("lincoln", "10:00 AM", 20, "none", "Notebook"));
  T.push(card("lincoln", "10:20 AM", 30, "none", "MR5"));
  T.push(card("lincoln", "10:50 AM", 25, "required", "Editor in Chief"));
  T.push(card("lincoln", "11:15 AM", 20, "required", "Spelling You See"));
  T.push(card("lincoln", "12:00 PM", 30, "none", "Lunch"));
  T.push(card("lincoln", "12:30 PM", 30, "none", "Eggspress"));
  T.push(card("lincoln", "1:00 PM", 20, "required", "AAS"));
  T.push(card("lincoln", "1:20 PM", 5, "none", "Closing Notebook", { subjectKey: "closing_nb" }));
  // Ellis
  T.push(card("ellis", "10:00 AM", 20, "none", "Notebook"));
  T.push(card("ellis", "10:20 AM", 20, "required", "Reading Detective"));
  T.push(card("ellis", "10:40 AM", 25, "none", "Singapore"));
  T.push(card("ellis", "11:05 AM", 20, "required", "Word Roots"));
  T.push(card("ellis", "12:00 PM", 30, "none", "Lunch"));
  T.push(card("ellis", "12:30 PM", 5, "none", "Closing Notebook", { subjectKey: "closing_nb" }));
  return T;
}
const ORDER = ["julian", "lucy", "lincoln", "ellis"];

function makeCtx(tasks, st) {
  const ctx = {
    console, ROSTER: ORDER.slice(), db: null,
    checked: st.checked, momMoves: {},
    getActiveTasks: () => tasks,
    morningComplete: (k) => st.ready[k] !== false,
    bbActive: (k) => st.paused[k] ? { phase: "go" } : null,
    momHere: () => true, adminPinUnlocked: true, renderAll: () => {},
    cap: s => String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1),
    esc: s => String(s == null ? "" : s),
  };
  Object.defineProperty(ctx, "_todayDay", { get: () => "thursday" });
  vm.createContext(ctx);
  vm.runInContext(HELPERS, ctx); vm.runInContext(BLOCK, ctx);
  return ctx;
}

// One "render": rebuild the block from the stored state (as every device does on every
// Firebase event), lay the day, and return everything the invariants need.
function derive(tasks, st) {
  const ctx = makeCtx(tasks, st);
  const call = e => vm.runInContext(e, ctx);
  call("momLoop=" + JSON.stringify(st.momLoop) + ";");
  call("momHold=" + JSON.stringify(st.momHold || {}) + ";");
  const laid = call("mlQueueLay(" + JSON.stringify(tasks) + ")");
  return { ctx, call, laid, now: call("mlNow()"), status: call("mlStatus()"), hold: call("mlHold()") };
}

// The invariants — her "never dropped" — checked after EVERY event.
function invariants(label, tasks, st, d) {
  const laid = d.laid, tm = t => toMinLocal(t.time), end = t => tm(t) + (t.dur || 20);
  ok(label + ": nothing dropped (same ids, same count)",
    laid.length === tasks.length && tasks.every(t => laid.some(x => x.id === t.id)),
    { stored: tasks.length, laid: laid.length });
  ok(label + ": every card still has a real time", laid.every(t => typeof t.time === "string" && !isNaN(tm(t))),
    laid.filter(t => isNaN(tm(t))).map(t => t.id));
  ok(label + ": no card lost its identity/duration/kid", laid.every(t => { const s = tasks.find(x => x.id === t.id);
    return s && s.who === t.who && s.dur === t.dur && s.title === t.title && s.mom === t.mom; }));
  // checked cards and lunch never move
  const moved = laid.filter(t => { const s = tasks.find(x => x.id === t.id); return s.time !== t.time; });
  ok(label + ": checked cards never move", moved.every(t => !st.checked[t.id]), moved.filter(t => st.checked[t.id]).map(t => t.id));
  ok(label + ": lunch never moves", moved.every(t => !/lunch/i.test(t.title)), moved.filter(t => /lunch/i.test(t.title)).map(t => t.id));
  // Mom never in two places: unchecked Mom-required cards of ON kids don't overlap each other
  const momOff = !!(st.momLoop.momOff && st.momLoop.momOff === d.call("_mlDayStamp()"));
  const on = k => !(st.momLoop.off && st.momLoop.off[k] === d.call("_mlDayStamp()")) && st.ready[k] !== false;
  const momCards = laid.filter(t => t.mom === "required" && !st.checked[t.id] && on(t.who));
  let clash = null;
  for (let i = 0; i < momCards.length && !clash; i++) for (let j = i + 1; j < momCards.length; j++) {
    const x = momCards[i], y = momCards[j];
    if (tm(x) < end(y) && tm(y) < end(x)) { clash = [x.id, x.time, y.id, y.time]; break; }
  }
  // (while Mom is OFF there is no Mom queue at all — her cards sink per kid and may share a
  // time; the moment she is back the queue re-derives gap-free, checked by the next step)
  if (!momOff) ok(label + ": Mom is never in two places (ON kids' Mom cards don't overlap)", !clash, clash);
  // no kid self-overlap (unchecked cards), never on their own lunch
  ORDER.forEach(k => {
    const mine = laid.filter(t => t.who === k && !st.checked[t.id]).sort((p, q) => tm(p) - tm(q));
    let selfClash = null;
    for (let i = 0; i + 1 < mine.length; i++) if (end(mine[i]) > tm(mine[i + 1])) { selfClash = [mine[i].id, mine[i].time, mine[i + 1].id, mine[i + 1].time]; break; }
    ok(label + ": " + k + " never laid on top of themselves", !selfClash, selfClash);
    // closing = last piece of WORK (lunch is not work; the tuck steps over it only on collision)
    const work = mine.filter(t => !/lunch/i.test(t.title));
    const close = work.filter(t => t.subjectKey === "closing_nb");
    if (close.length && work.length > 1) {
      const last = work[work.length - 1];
      ok(label + ": " + k + "'s closing notebook stays last", last.subjectKey === "closing_nb", work.map(t => t.title + "@" + t.time));
    }
  });
  // the loop never points at an OFF kid, or at anyone while Mom is off
  if (d.now && d.now.kid) {
    ok(label + ": the loop never points at a switched-off kid", on(d.now.kid) || d.now.held === true && on(d.now.kid), d.now);
    ok(label + ": the loop points at nobody while Mom is off", !momOff, d.now);
  }
}
function toMinLocal(s) {
  const m = /^(\d+):(\d+)\s*(AM|PM)$/i.exec(String(s || "").trim()); if (!m) return NaN;
  let h = parseInt(m[1], 10) % 12; if (/pm/i.test(m[3])) h += 12; return h * 60 + parseInt(m[2], 10);
}

// ── the day walk ─────────────────────────────────────────────────────────────────────────
console.log("── a full day of flips: after every event, nothing is dropped ──");
{
  const tasks = world();
  const stamp = derive(tasks, { checked: {}, ready: {}, paused: {}, momLoop: { order: ORDER, cursor: 1 } }).call("_mlDayStamp()");
  const st = { checked: {}, ready: { julian: false, lucy: false, lincoln: false, ellis: false }, paused: {},
    momLoop: { order: ORDER, cursor: 1, cursorSetOn: stamp }, momHold: {} };
  const byTitle = (k, t) => tasks.find(x => x.who === k && x.title === t);
  const hasMomSwitch = /function mlMomOff/.test(BLOCK);   // step 2 lands the Mom switch
  let d;

  // 10:00 — nobody ready yet
  d = derive(tasks, st); invariants("10:00 nobody ready", tasks, st, d);
  ok("nobody has Mom before any routine ends", d.now.kid === null);

  // 10:05 — Lincoln finishes routine first (Lucy is the cursor kid, still on routine)
  st.ready.lincoln = true;
  d = derive(tasks, st); invariants("10:05 lincoln ready", tasks, st, d);
  ok("lincoln borrows — lucy's turn is kept", d.now.kid === "lincoln" && d.now.borrowed && d.now.cursorKid === "lucy", d.now);

  // 10:08 — Mom sees Lincoln wandering and switches him OFF
  st.momLoop.off = { lincoln: stamp };
  d = derive(tasks, st); invariants("10:08 lincoln switched off", tasks, st, d);
  ok("with lincoln off, nobody has Mom (everyone else on routine)", d.now.kid === null, d.now);
  ok("lincoln's own cards are all still on his day", d.laid.filter(t => t.who === "lincoln").length === tasks.filter(t => t.who === "lincoln").length);
  ok("his independent cards keep their slots while off", d.laid.find(t => t.id === byTitle("lincoln", "MR5").id).time === "10:20 AM");

  // 10:15 — Lucy ready (cursor kid) → her turn
  st.ready.lucy = true;
  d = derive(tasks, st); invariants("10:15 lucy ready", tasks, st, d);
  ok("lucy takes her turn", d.now.kid === "lucy" && !d.now.borrowed, d.now);

  // 10:20 — Lucy checks her notebook (the buffer) → STARTED, hold set
  const lucyNb = byTitle("lucy", "Notebook");
  st.checked[lucyNb.id] = "x";
  d.call("mlOnCheck(" + JSON.stringify(lucyNb) + ")");
  st.momHold = d.call("momHold");
  ok("lucy's buffer check starts a hold on her Read-Aloud", st.momHold.kid === "lucy" && st.momHold.id === byTitle("lucy", "Read-Aloud").id, st.momHold);
  d = derive(tasks, st); invariants("10:20 lucy started", tasks, st, d);
  ok("she is 'with Mom' (held)", d.now.kid === "lucy" && d.now.held === true, d.now);

  // 10:22 — Lincoln taps "I'm ready" on his tablet: he comes ON, but lucy's session holds
  st.momLoop.off = {};
  d = derive(tasks, st); invariants("10:22 lincoln taps ready", tasks, st, d);
  ok("lincoln coming back on does NOT steal lucy's started session", d.now.kid === "lucy" && d.now.held === true, d.now);
  ok("lincoln's Mom block queues behind lucy's", (() => { const l = d.laid; const tm = t => toMinLocal(t.time);
    const lucyLast = Math.max(...l.filter(t => t.who === "lucy" && t.mom === "required").map(t => tm(t) + t.dur));
    return tm(l.find(t => t.id === byTitle("lincoln", "Editor in Chief").id)) >= lucyLast; })());

  // 10:30 — Mom switches LUCY off mid-session (she melted down) → hold suspended, not lost
  st.momLoop.off = { lucy: stamp };
  d = derive(tasks, st); invariants("10:30 lucy off mid-session", tasks, st, d);
  ok("Mom is handed to lincoln while lucy is off", d.now.kid === "lincoln", d.now);
  ok("lucy's hold is still stored", d.hold && d.hold.kid === "lucy", d.hold);
  ok("lucy's Read-Aloud is still on her day, unchecked, with a time", (() => { const c = d.laid.find(t => t.id === st.momHold.id); return c && !st.checked[c.id] && !isNaN(toMinLocal(c.time)); })());

  // 10:35 — Lincoln checks his notebook (buffer) while he has Mom → his own hold
  const linNb = byTitle("lincoln", "Notebook");
  st.checked[linNb.id] = "x";
  d.call("mlOnCheck(" + JSON.stringify(linNb) + ")");
  const h2 = d.call("momHold");
  ok("lincoln's buffer check takes the hold (lucy's was suspended, he is the pick)", h2.kid === "lincoln" && h2.id === byTitle("lincoln", "Editor in Chief").id, h2);
  st.momHold = h2;
  d = derive(tasks, st); invariants("10:35 lincoln started", tasks, st, d);

  // 10:40 — Lucy back on: lincoln keeps his started session (hold beats the cursor)
  st.momLoop.off = {};
  d = derive(tasks, st); invariants("10:40 lucy back on", tasks, st, d);
  ok("lincoln keeps his started card even though lucy (cursor) is back", d.now.kid === "lincoln" && d.now.held === true, d.now);

  // 10:50 — Lincoln checks Editor in Chief (the held card) → hold released → back to lucy
  const eic = byTitle("lincoln", "Editor in Chief");
  st.checked[eic.id] = "x";
  d.call("mlOnCheck(" + JSON.stringify(eic) + ")");
  st.momHold = d.call("momHold");
  ok("checking the held card releases the hold", !st.momHold.kid, st.momHold);
  d = derive(tasks, st); invariants("10:50 EIC done", tasks, st, d);
  ok("the turn snaps back to lucy (cursor kid, ready, on)", d.now.kid === "lucy" && !d.now.borrowed, d.now);

  // 11:00 — Ellis + Julian ready; Julian switched off right away (not really ready)
  st.ready.ellis = true; st.ready.julian = true; st.momLoop.off = { julian: stamp };
  d = derive(tasks, st); invariants("11:00 ellis+julian ready, julian off", tasks, st, d);
  ok("julian reads 'off' on the strip", d.status.find(x => x.kid === "julian").state === "off");
  ok("lucy still has Mom", d.now.kid === "lucy");

  // 11:10 — brain break for lucy → Mom moves on, lucy keeps her place
  st.paused.lucy = true;
  d = derive(tasks, st); invariants("11:10 lucy on a break", tasks, st, d);
  ok("Mom moves on past the break and past off-julian to lincoln", d.now.kid === "lincoln" && d.now.cursorKid === "lucy", d.now);

  // 11:15 — flip EVERYONE off, then everyone on, then back — thrash
  for (let round = 0; round < 3; round++) {
    st.momLoop.off = { julian: stamp, lucy: stamp, lincoln: stamp, ellis: stamp };
    d = derive(tasks, st); invariants("11:15 thrash all-off #" + round, tasks, st, d);
    ok("all off → nobody, even with lucy paused", d.now.kid === null);
    st.momLoop.off = {};
    d = derive(tasks, st); invariants("11:15 thrash all-on #" + round, tasks, st, d);
    ok("all on → lincoln (lucy paused, julian first-of-ring after cursor? no: cursor lucy → lincoln)", d.now.kid === "lincoln", d.now);
  }
  st.paused.lucy = false;

  // 11:30 — a kid finishes ALL Mom work then is switched off: harmless
  tasks.filter(t => t.who === "julian" && t.mom === "required").forEach(t => { st.checked[t.id] = "x"; });
  st.momLoop.off = { julian: stamp };
  d = derive(tasks, st); invariants("11:30 julian done + off", tasks, st, d);
  ok("a done kid switched off reads 'done'", d.status.find(x => x.kid === "julian").state === "done");
  ok("his closing notebook is still on his day", d.laid.some(t => t.who === "julian" && t.subjectKey === "closing_nb"));

  // 12:00 — lunch: nothing special, but flips over lunch must not push anyone onto it
  st.momLoop.off = { ellis: stamp };
  d = derive(tasks, st); invariants("12:00 ellis off over lunch", tasks, st, d);
  st.momLoop.off = {};
  d = derive(tasks, st); invariants("12:05 ellis back on over lunch", tasks, st, d);

  // 12:30 — the Mom switch (step 2): Mom is not available; no Mom task is anyone's next
  if (hasMomSwitch) {
    st.momLoop.momOff = stamp;
    d = derive(tasks, st); invariants("12:30 Mom off", tasks, st, d);
    ok("Mom off → nobody has her", d.now.kid === null, d.now);
    ok("no kid's banner points at a Mom card", ORDER.every(k => !/Mom&rsquo;s ready for you|You&rsquo;re with Mom/.test(d.call("mlBannerHTML('" + k + "')"))));
    ok("Mom's cards are all still there", d.laid.filter(t => t.mom === "required").length === tasks.filter(t => t.mom === "required").length);
    // "stuff that's not mom dependent can fill calendar": independent work keeps its slots,
    // Mom cards sink behind it, closing follows
    const at = id => d.laid.find(t => t.id === id).time;
    ok("lincoln's Eggspress keeps its 12:30 slot while Mom is off", at(byTitle("lincoln", "Eggspress").id) === "12:30 PM");
    ok("his Spelling + AAS sink behind his own work (after Eggspress)",
      toMinLocal(at(byTitle("lincoln", "Spelling You See").id)) >= 13 * 60 && toMinLocal(at(byTitle("lincoln", "AAS").id)) > toMinLocal(at(byTitle("lincoln", "Spelling You See").id)),
      [at(byTitle("lincoln", "Spelling You See").id), at(byTitle("lincoln", "AAS").id)]);
    ok("ellis's Singapore keeps its slot and his Mom cards sink behind it",
      at(byTitle("ellis", "Singapore").id) === "10:40 AM" && toMinLocal(at(byTitle("ellis", "Reading Detective").id)) >= 11 * 60 + 5, [at(byTitle("ellis", "Reading Detective").id)]);    // a kid checks independent work while Mom is off → no hold is started
    const egg = byTitle("lincoln", "Eggspress");
    st.checked[egg.id] = "x";
    d.call("mlOnCheck(" + JSON.stringify(egg) + ")");
    ok("a check-off while Mom is off starts nothing", !d.call("momHold").kid);
    // Mom back → the loop resumes exactly where the rules say
    delete st.momLoop.momOff;
    d = derive(tasks, st); invariants("12:45 Mom back on", tasks, st, d);
    ok("Mom back on → lucy (cursor, ready, unfinished) has her again", d.now.kid === "lucy", d.now);
  } else {
    console.log("  (Mom switch not built yet — step 2 cases skipped)");
  }

  // 3:00 — end of day: everyone finishes; flips are inert
  tasks.filter(t => t.mom === "required").forEach(t => { st.checked[t.id] = "x"; });
  st.momLoop.off = { lucy: stamp, lincoln: stamp };
  d = derive(tasks, st); invariants("3:00 all Mom work done", tasks, st, d);
  ok("everyone done → the loop has nobody left, switches or not", d.now.kid === null && d.status.every(x => x.state === "done"), d.status);
}

console.log("\n── the buffer vs the kid's OWN Mom block (pre-existing, her fix 2026-09-05): it walks to the END of the block ──");
{
  // (A) a HELD kid: notebook checked, MR5 (independent) 10:20 unchecked, Editor in Chief held.
  //     The held card renders where he is (10:20); MR5 now moves to the end of his WHOLE block.
  const st = { checked: {}, ready: {}, paused: {}, momLoop: { order: ORDER, cursor: 2 }, momHold: {} };
  const nb = card("lincoln", "10:00 AM", 20, "none", "Notebook"), mr = card("lincoln", "10:20 AM", 30, "none", "MR5"),
        eic = card("lincoln", "10:50 AM", 25, "required", "Editor in Chief"), sp = card("lincoln", "11:15 AM", 20, "required", "Spelling You See"),
        cl = card("lincoln", "1:20 PM", 5, "none", "Closing Notebook", { subjectKey: "closing_nb" });
  const tasks = [nb, mr, eic, sp, cl];
  st.checked[nb.id] = "x"; st.momHold = { kid: "lincoln", id: eic.id, day: "thursday" };
  const d = derive(tasks, st); invariants("held kid", tasks, st, d);
  const at = id => d.laid.find(t => t.id === id).time;
  ok("the held Mom card renders where he is", at(eic.id) === "10:20 AM", at(eic.id));
  ok("his block chains behind it", at(sp.id) === "10:45 AM", at(sp.id));
  ok("MR5 walks to the END of the block — not just past the one Mom card", at(mr.id) === "11:05 AM", at(mr.id));
  ok("closing follows the moved card", at(cl.id) === "11:35 AM", at(cl.id));
  // (B) a NON-LEADER kid: lucy on routine, notebook checked, Reading Eggs 11:05 is her buffer;
  //     lincoln borrows; her block is laid at 10:45–11:30 and covers 11:05 → Reading Eggs moves to 11:30.
  const st2 = { checked: {}, ready: { lucy: false, julian: false, ellis: false }, paused: {}, momLoop: { order: ORDER, cursor: 1 }, momHold: {} };
  const lnb = card("lincoln", "10:00 AM", 20, "none", "Notebook"), leic = card("lincoln", "10:50 AM", 25, "required", "Editor in Chief");
  const unb = card("lucy", "10:00 AM", 20, "none", "Notebook"), ura = card("lucy", "10:20 AM", 20, "required", "Read-Aloud"),
        udm = card("lucy", "10:40 AM", 25, "required", "Dimensions"), ure = card("lucy", "11:05 AM", 15, "none", "Reading Eggs");
  const tasks2 = [lnb, leic, unb, ura, udm, ure];
  st2.checked[unb.id] = "x";
  const d2 = derive(tasks2, st2); invariants("non-leader kid", tasks2, st2, d2);
  const at2 = id => d2.laid.find(t => t.id === id).time;
  ok("her block lands behind the borrower's card", at2(ura.id) === "10:45 AM" && at2(udm.id) === "11:05 AM", [at2(ura.id), at2(udm.id)]);
  ok("her buffer, now covered, walks to the end of her block", at2(ure.id) === "11:30 AM", at2(ure.id));
  // (C) an UNCOVERED buffer still never moves (the chain leader's block starts after it)
  const st3 = { checked: {}, ready: {}, paused: {}, momLoop: { order: ORDER, cursor: 1 }, momHold: {} };
  const b3 = card("lucy", "10:00 AM", 20, "none", "Notebook"), m3 = card("lucy", "12:30 PM", 20, "required", "Read-Aloud");
  const d3 = derive([b3, m3], st3);
  ok("an uncovered buffer keeps its slot", d3.laid.find(t => t.id === b3.id).time === "10:00 AM" && d3.laid.find(t => t.id === m3.id).time === "10:20 AM");
}

console.log("\n── the switch is per-day: tomorrow morning nothing is off ──");
{
  const tasks = world();
  const st = { checked: {}, ready: {}, paused: {}, momLoop: { order: ORDER, cursor: 0, off: { julian: "2020-1-1", lucy: "2020-1-1" }, momOff: "2020-1-1" }, momHold: {} };
  const d = derive(tasks, st); invariants("next morning", tasks, st, d);
  ok("yesterday's switches mean nothing today", d.now.kid === "julian" && d.status.every(x => x.state !== "off"), d.status);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
