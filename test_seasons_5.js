/*
 * Node tests for 🎉 Seasons & Events — SEASONJOBS step B (her yes to "Dad & kid to-dos" 2026-11-21): a planner to-do for a KID goes
 * to that kid's own jobs (Kids' Corner ▸ ✨ Our plans ▸ Your jobs), with optional ⭐.
 *   · Mom's side (seasons.js): seasonJobs/<kid>/<todoId> = {t, for, show, due, stars?, sn, ts}, one per job, kept right by the same
 *     sync as Dad's list — re-worded / re-dated in place, moved to the new kid on re-assign, taken off when deleted, closed, made a
 *     surprise or out of a day; a job a kid already did is never touched or re-sent
 *   · ⭐ a number she sets per to-do (0 unless she sets it); pays the way every kid check-off pays: bankDirect(kid, stars, label,
 *     choreVerifyOn(kid)) on the tick, the entry's id kept (bid); un-tick takes back exactly that entry; never twice
 *   · the kid's side (seasonkid.js): listens to seasonJobs/<this kid> only; shows a job from its show day; the kid ticks it; the
 *     guard lets a kid write only done/bid on their OWN job that is showing; never a surprise; still never names Mom's secret node
 *
 *   run:  node test_seasons_5.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
const MSRC = fs.readFileSync(path.join(__dirname, process.env.SN_SRC || "seasons.js"), "utf8");
const KSRC = fs.readFileSync(path.join(__dirname, process.env.SK_SRC || "seasonkid.js"), "utf8");
const TODAY = "2026-11-20";
const paths = w => Object.keys(w.val);

// a little bank, shaped like the app's own: bankDirect returns an id; bankDirectRemove removes it; cuUnpay is false on a kid's own un-tick
function bankStub(o) {
  let n = 0;
  return {
    bankDirect(kid, pts, note, hold) { const id = "bd" + (++n); o.bank.push({ op: "pay", kid, pts, note, hold: !!hold, id }); return id; },
    bankDirectRemove(kid, id) { o.bank.push({ op: "remove", kid, id }); },
    cuUnpay(kid, bid, label) { o.bank.push({ op: "cuUnpay?", kid, bid }); return !!o.cuSays; },
    choreVerifyOn: k => !!o.verify[k] };
}

function momWorld() {
  const el = id => ({ id, innerHTML: "", value: "", style: {}, focus() {}, appendChild() {} });
  const nodes = {}, root = el("root");
  const o = { writes: [], timers: [], bank: [], verify: {}, dry: false, mom: true, LS: {}, root, listens: [] };
  const document = { getElementById(id) { return nodes[id] || (nodes[id] = el(id)); }, createElement(t) { return el(t); }, head: { appendChild() {} } };
  const db = { ref(p) { const P = p === undefined ? "" : p; return {
    update(v) { o.writes.push({ op: "update", path: P, val: JSON.parse(JSON.stringify(v)) }); }, set(v) { o.writes.push({ op: "set", path: P, val: v }); }, remove() { o.writes.push({ op: "remove", path: P }); },
    on(ev, fn) { o.listens.push(P); } }; } };
  const ctx = Object.assign({ console: { log: console.log, warn() {} }, Date, Math, JSON, document, db, _todayStr: () => TODAY, _dryRun: () => o.dry, momHere: () => o.mom, _kioskD: () => false,
    gwShowToast() {}, HA_LS: { getItem: k => (k in o.LS ? o.LS[k] : null), setItem: (k, v) => { o.LS[k] = String(v); } },
    tab: "moms-plan", mpSubView: "seasons", momSchedView: false, renderMomsPlan() {}, mpGoto() {},
    grData: { items: {} }, momdayData: {}, setTimeout: fn => { o.timers.push(fn); return o.timers.length; } }, bankStub(o));
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext("const ROSTER_DEF=[{id:'ava',name:'Ava',color:'#2563eb'},{id:'ben',name:'Ben',color:'#16a34a'}]; var calendarData={events:{}}; var daddayData={};", ctx);
  vm.runInContext(MSRC, ctx);
  o.W = ctx; o.T = ctx._snTest; o.cal = () => vm.runInContext("calendarData", ctx);
  o.set = (d, sec, ev, jobs) => { o.timers.splice(0).forEach(f => f()); o.writes.length = 0; o.bank.length = 0; o.T.setData(d || {}, sec || {}); o.T.reset(); o.cal().events = ev || {};
    o.T.setJobs(jobs === undefined ? {} : jobs); o.T.setRoot(root, ""); };
  o.sync = () => { o.writes.length = 0; return o.T.dadSync(); };
  o.last = () => o.writes[o.writes.length - 1];
  return o;
}
const SEASON = (todoG1, extra) => ({
  list: { xmas: { name: "Christmas 2026", emoji: "🎄", kind: "holiday", start: "2026-11-20", end: "2026-12-31", ts: 1 } },
  ideas: { xmas: { g1: { t: "Gingerbread houses", emoji: "🏠", by: "mom", ts: 2, ev: { e1: true }, todo: todoG1 || {} }, m1: { t: "Movie night", by: "mom", ts: 3 } } },
  extra: extra ? { xmas: { todo: extra } } : undefined });
const EV = () => ({ e1: { title: "Gingerbread houses", date: "2026-12-05", time: "", who: "family", emoji: "🏠" } });
const rec = (o, iid, lid) => o.T.data().ideas.xmas[iid].todo[lid];

const o = momWorld(), W = o.W, T = o.T;

console.log("\n# Mom's side: the guard and the listener");
{
  o.set(SEASON());
  ok("allowed: one kid's job record and its fields", T.OK.test("seasonJobs/ava/t1") && T.OK.test("seasonJobs/ava/t1/done") && T.OK.test("seasonJobs/ava/t1/stars"));
  const bad = ["seasonJobs/ava", "seasonJobs", "bank/ava/adjustments/x", "config/choreVerify/ava", "routineLog/ava"];
  ok("refused: a kid's whole jobs node, the bank, chore settings", bad.every(p => { const u = {}; u[p] = { x: 1 }; return T.apply(u) === false; }), bad.filter(p => T.OK.test(p)));
  const code = MSRC.replace(/^\s*\/\/.*$/gm, "");
  ok("the bank is reached ONLY through the app's own bankDirect / bankDirectRemove / cuUnpay", !/["'`]bank\//.test(code) && /bankDirect\(k,\+c\.stars,jobLabel\(c\.t\),\(typeof choreVerifyOn==="function"&&choreVerifyOn\(k\)\)\)/.test(code));
  ok("one more listener on Mom's device: seasonJobs (all kids' jobs come back to her page)", (code.match(/db\.ref\(/g) || []).length === 4 && /db\.ref\("seasonJobs"\)\.on\(/.test(code));
}

console.log("\n# a kid's to-do goes to their jobs");
{
  o.set(SEASON({ t1: { t: "Make the gingerbread dough", who: "ava", before: 2, stars: 3 } }), {}, EV(), {});
  o.sync(); const w = o.last();
  const r = w.val["seasonJobs/ava/t1"];
  ok("ONE update: the job record + jobFor on the to-do", o.writes.length === 1 && paths(w).length === 2 && w.val["seasons/ideas/xmas/g1/todo/t1/jobFor"] === "ava", paths(w));
  ok("the record: words, what it's for, show day, due day, stars, back-link, ts", r && r.t === "Make the gingerbread dough" && r.for === "🏠 Gingerbread houses" && r.show === "2026-12-03" && r.due === "2026-12-03" && r.stars === 3 && r.sn === "xmas/g1/t1" && typeof r.ts === "number" && Object.keys(r).length === 7, r);
  ok("a second pass writes nothing", o.sync() === 0);
  o.set(SEASON({ t1: { t: "Dough", who: "ava", before: 2 } }), {}, EV(), undefined);
  T.setJobs(null);
  ok("not before the kids' jobs have loaded (Dad's list does not wait for it)", o.sync() === 0);
  o.set(SEASON({ t1: { t: "Dough", who: "ava", due: "2026-12-03", ahead: 2 } }), {}, EV(), {});
  o.sync();
  ok("show-ahead works for a kid too; no stars set → no stars field", o.last().val["seasonJobs/ava/t1"].show === "2026-12-01" && o.last().val["seasonJobs/ava/t1"].due === "2026-12-03" && !("stars" in o.last().val["seasonJobs/ava/t1"]));
  o.set(SEASON({}, { x1: { t: "Hang the stockings", who: "ben", due: "2026-11-20" } }), {}, EV(), {});
  o.sync();
  ok("a whole-season to-do goes too (for = the season)", o.last().val["seasonJobs/ben/x1"].for === "🎄 Christmas 2026" && o.last().val["seasonJobs/ben/x1"].sn === "xmas/-/x1");
}

console.log("\n# changing it updates the kid's job in place; re-assigning moves it");
{
  o.set(SEASON({ t1: { t: "Dough", who: "ava", due: "2026-12-03" } }), {}, EV(), {});
  o.sync();
  W.snLine("todo", "g1", "t1");
  ok("the pop-up has show-ahead + ⭐ boxes for a kid, and says where it goes", /Show it to Ava early/.test(o.root.innerHTML) && /⭐ for doing it/.test(o.root.innerHTML) && /Kids’ Corner ▸ ✨ Our plans ▸ Your jobs/.test(o.root.innerHTML));
  W.snSet("t", "Make the dough"); W.snSet("due", "2026-12-04"); W.snSet("stars", "2"); W.snSave();
  ok("⭐ is saved on the to-do", rec(o, "g1", "t1").stars === 2);
  o.sync(); let w = o.last();
  ok("words, date and stars → only those fields of the SAME record", w.val["seasonJobs/ava/t1/t"] === "Make the dough" && w.val["seasonJobs/ava/t1/show"] === "2026-12-04" && w.val["seasonJobs/ava/t1/due"] === "2026-12-04" && w.val["seasonJobs/ava/t1/stars"] === 2 && paths(w).length === 4, paths(w));
  W.snLine("todo", "g1", "t1"); W.snSet("stars", "999"); W.snSave();
  ok("⭐ is capped at 50", rec(o, "g1", "t1").stars === 50);
  W.snLine("todo", "g1", "t1"); W.snLineWho("ben"); W.snSet("stars", "2"); W.snSave(); o.sync(); w = o.last();
  ok("re-assigned to Ben (not done yet) → off Ava's jobs, onto Ben's, jobFor = ben", w.val["seasonJobs/ava/t1"] === null && !!w.val["seasonJobs/ben/t1"] && w.val["seasons/ideas/xmas/g1/todo/t1/jobFor"] === "ben" && !T.jobs().ava.t1);
  W.snLine("todo", "g1", "t1"); W.snLineWho("mom"); W.snSave();
  ok("re-assigned to Mom → stars and show-ahead are dropped", rec(o, "g1", "t1").stars === undefined && rec(o, "g1", "t1").ahead === undefined);
  o.sync();
  ok("…and the job comes off", o.last().val["seasonJobs/ben/t1"] === null && o.last().val["seasons/ideas/xmas/g1/todo/t1/jobFor"] === null);
  W.snLine("todo", "m1", ""); W.snSet("t", "Popcorn"); W.snSet("stars", "4"); W.snSave();
  const id = Object.keys(T.data().ideas.xmas.m1.todo)[0];
  ok("a Mom to-do never stores stars, even if typed", T.data().ideas.xmas.m1.todo[id].stars === undefined);
}

console.log("\n# taken off when deleted, closed, made a surprise, or out of a day");
{
  const fresh = () => { o.set(SEASON({ t1: { t: "Dough", who: "ava", before: 1 } }), {}, EV(), {}); o.sync(); };
  fresh(); W.snLine("todo", "g1", "t1"); W.snLineDel(); W.snLineDel(); o.sync();
  ok("delete the to-do → the job comes off", o.last().val["seasonJobs/ava/t1"] === null);
  fresh(); let up = {}; up["seasons/list/xmas/closed"] = true; T.apply(up); o.sync();
  ok("close the season → off", o.last().val["seasonJobs/ava/t1"] === null);
  fresh(); delete o.cal().events.e1; o.sync();
  ok("the idea loses its day → off", o.last().val["seasonJobs/ava/t1"] === null);
  fresh(); const g1 = JSON.parse(JSON.stringify(T.data().ideas.xmas.g1)); g1.hide = "none"; up = {}; up["seasons/ideas/xmas/g1"] = null; up["seasonSecret/xmas/g1"] = g1; T.apply(up); o.sync();
  ok("the idea made a surprise → off", o.last().val["seasonJobs/ava/t1"] === null);
  o.set(SEASON(), { xmas: { s1: { t: "SKATEWORD", hide: "hint", ev: { e1: true }, todo: { t9: { t: "TICKETWORD", who: "ava", due: "2026-12-01", stars: 2 } } } } }, EV(), {});
  ok("a surprise's to-do is never sent to a kid", o.sync() === 0);
  T.draw(); W.snViewSet("todo");
  ok("…and Mom's row says so", /Stays here\. A surprise’s to-dos never go to Ava’s jobs\./.test(o.root.innerHTML));
}

console.log("\n# a job the kid did is history — stars never stranded or doubled");
{
  const J = () => ({ ava: { t1: { t: "Dough", for: "🏠 Gingerbread houses", show: "2026-12-04", due: "2026-12-04", stars: 2, sn: "xmas/g1/t1", ts: 1, done: TODAY, bid: "bd9" } } });
  o.set(SEASON({ t1: { t: "Dough", who: "ava", due: "2026-12-04", stars: 2, jobFor: "ava" } }), {}, EV(), J());
  const L = T.line("xmas", "g1", "todo", "t1");
  ok("the kid's tick = done on Mom's page", T.tdDone(L) === true);
  T.draw(); W.snViewSet("todo");
  ok("Mom's row: “✓ Ava did it · ⭐ 2”", /✓ Ava did it · ⭐ 2/.test(o.root.innerHTML));
  ok("the sync never touches it", o.sync() === 0);
  rec(o, "g1", "t1").who = "ben";
  ok("re-assigned after it was done → NOT sent to Ben (no second pay), Ava's untouched", o.sync() === 0 && T.jobs().ava.t1.bid === "bd9" && !T.jobs().ben);
  const up = {}; up["seasons/ideas/xmas/g1/todo/t1"] = null; T.apply(up);
  ok("deleted after it was done → Ava's job and its stars stay; no bank call", o.sync() === 0 && T.jobs().ava.t1.done === TODAY && o.bank.length === 0);
}

console.log("\n# Mom ticks it on her page: it pays the way a chore pays, and un-ticking takes back exactly that");
{
  o.set(SEASON({ t1: { t: "Dough", who: "ava", due: "2026-11-20", stars: 2 } }), {}, EV(), {});
  o.sync(); o.writes.length = 0;
  W.snTodoTick("xmas", "g1", "t1"); let w = o.last();
  ok("ONE pay through bankDirect(kid, stars, label, choreVerifyOn(kid))", o.bank.length === 1 && o.bank[0].op === "pay" && o.bank[0].kid === "ava" && o.bank[0].pts === 2 && o.bank[0].note === "🎉 Dough" && o.bank[0].hold === false, o.bank);
  ok("the job is done and keeps the entry's id, in the same update as the to-do", w.val["seasons/ideas/xmas/g1/todo/t1/done"] === TODAY && w.val["seasonJobs/ava/t1/done"] === TODAY && w.val["seasonJobs/ava/t1/bid"] === "bd1");
  o.bank.length = 0; W.snTodoTick("xmas", "g1", "t1"); w = o.last();
  ok("un-tick → exactly that entry comes back off (cuUnpay first, as the app does, then bankDirectRemove)", o.bank.map(b => b.op).join() === "cuUnpay?,remove" && o.bank[1].id === "bd1" && w.val["seasonJobs/ava/t1/done"] === null && w.val["seasonJobs/ava/t1/bid"] === null);
  o.cuSays = true; W.snTodoTick("xmas", "g1", "t1"); o.bank.length = 0; W.snTodoTick("xmas", "g1", "t1"); o.cuSays = false;
  ok("…when Mom undoes a PAID one the app's cuUnpay books the reversal (no extra remove)", o.bank.map(b => b.op).join() === "cuUnpay?");
  o.bank.length = 0; o.verify.ava = true; W.snTodoTick("xmas", "g1", "t1");
  ok("re-tick pays ONCE again — held for Mom's check when Ava's chore check is on", o.bank.length === 1 && o.bank[0].hold === true);
  o.bank.length = 0; o.verify.ava = false;
  T.jobs().ava.t1.done = null; T.jobs().ava.t1.bid = "bdX"; delete rec(o, "g1", "t1").done; W.snTodoTick("xmas", "g1", "t1");
  ok("a job that already holds a bid is never paid again", o.bank.filter(b => b.op === "pay").length === 0 && o.last().val["seasonJobs/ava/t1/done"] === TODAY);
  o.set(SEASON({ t1: { t: "Dough", who: "ava", due: "2026-11-20" } }), {}, EV(), {}); o.sync(); o.bank.length = 0;
  W.snTodoTick("xmas", "g1", "t1");
  ok("no stars set → no pay at all (nothing pays unless she sets it)", o.bank.length === 0 && o.last().val["seasonJobs/ava/t1/done"] === TODAY && !("seasonJobs/ava/t1/bid" in o.last().val));
  o.set(SEASON({ t1: { t: "Dough", who: "ava", due: "2026-11-20", stars: 2 } }), {}, EV(), {}); o.sync(); o.bank.length = 0; o.dry = true;
  W.snTodoTick("xmas", "g1", "t1");
  ok("dry run → no bank call", o.bank.length === 0); o.dry = false;
  o.set(SEASON({ t1: { t: "Dough", who: "ava", due: "2026-11-20" }, t2: { t: "Wrap", who: "mom", due: "2026-11-20" } }), {}, EV(), {}); o.sync();
  W.tab = "moms-plan"; W.mpSubView = "plan"; const now = W.seasonNowLines(); W.mpSubView = "seasons";
  ok("Home Base NOW leaves a kid's job to the kid", /Wrap/.test(now.html) && !/Dough/.test(now.html));
}

// ── the kid's device ────────────────────────────────────────────────────────
function kidWorld() {
  const el = id => ({ id, innerHTML: "", value: "", style: {}, focus() {}, setSelectionRange() {}, appendChild() {} });
  const nodes = {}; const root = el("sk-root"); nodes["sk-root"] = root;
  const o = { writes: [], on: [], off: [], fire: {}, toasts: [], bank: [], verify: {}, dry: false, root, little: false };
  const document = { getElementById(id) { return nodes[id] || null; }, createElement(t) { return el(t); }, head: { appendChild(e) { if (e.id) nodes[e.id] = e; } }, activeElement: null };
  const db = { ref(p) { const P = p === undefined ? "" : p; return {
    update(v) { o.writes.push({ op: "update", path: P, val: JSON.parse(JSON.stringify(v)) }); }, set(v) { o.writes.push({ op: "set", path: P }); }, remove() { o.writes.push({ op: "remove", path: P }); },
    on(ev, fn) { o.on.push(P); o.fire[P] = v => fn({ val: () => v }); }, off() { o.off.push(P); delete o.fire[P]; }, once() { o.on.push("ONCE:" + P); return Promise.resolve({ val: () => null }); } }; } };
  const ctx = Object.assign({ console: { log: console.log, warn() {} }, Date, Math, JSON, document, db, setTimeout: () => 0, _todayStr: () => TODAY, _dryRun: () => o.dry, gwShowToast: m => o.toasts.push(m),
    kcLittle: () => o.little, tab: "kids" }, bankStub(o));
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext("const ROSTER_DEF=[{id:'ava',name:'Ava',color:'#2563eb'},{id:'ben',name:'Ben',color:'#16a34a'}]; var calendarData={events:{}};", ctx);
  vm.runInContext(KSRC, ctx);
  o.W = ctx; o.T = ctx._skTest; o.html = () => root.innerHTML; o.last = () => o.writes[o.writes.length - 1];
  return o;
}
const JOBS = () => ({
  j1: { t: "Make the dough", for: "🏠 Gingerbread houses", show: "2026-11-20", due: "2026-11-22", stars: 2, sn: "xmas/g1/j1", ts: 1 },
  j2: { t: "Hang the stockings", for: "🎄 Christmas", show: "2026-11-18", due: "2026-11-19", sn: "xmas/-/j2", ts: 2 },
  j3: { t: "FUTUREWORD", show: "2026-11-25", due: "2026-11-25", sn: "xmas/-/j3", ts: 3 },
  j4: { t: "OLDDONEWORD", show: "2026-11-10", due: "2026-11-10", done: "2026-11-11", sn: "xmas/-/j4", ts: 4 } });

console.log("\n# the kid's side: what it reads");
{
  const code = KSRC.replace(/^\s*\/\/.*$/gm, "");
  ok("it still never names Mom's secret node", KSRC.indexOf("seasonSecret") < 0);
  ok("its database calls: the list, ONE season's ideas, THIS kid's jobs, and the one update door", (code.match(/db\.ref\(/g) || []).length === 4 && /db\.ref\("seasonJobs\/"\+k\)/.test(code));
  ok("it reaches the bank only through the app's own functions", !/["'`]bank\//.test(code) && /bankDirect\(k,\+j\.stars,/.test(code) && /choreVerifyOn\(k\)/.test(code));
  const k = kidWorld(); k.W.seasonKidPageHTML("ava");
  ok("opening → listens to seasons/list and seasonJobs/ava — no other kid's jobs, no one-time read", k.on.join() === "seasons/list,seasonJobs/ava", k.on);
  k.fire["seasonJobs/ava"](JOBS()); k.fire["seasons/list"]({});
  ok("with no season open, Your jobs still shows — and “Nothing to plan yet” does not", /🧹 Your jobs/.test(k.html()) && /Make the dough/.test(k.html()) && !/Nothing to plan yet/.test(k.html()));
  ok("a job shows from its show day; a later one and one done on an earlier day do not", /Hang the stockings/.test(k.html()) && k.html().indexOf("FUTUREWORD") < 0 && k.html().indexOf("OLDDONEWORD") < 0);
  ok("when: “due in 2 sleeps”, “was due …”; ⭐ when Mom set stars", /due in 2 sleeps/.test(k.html()) && /was due Thu Nov 19/.test(k.html()) && /⭐ 2/.test(k.html()));
  ok("the job never shows its season's secret, notes or supplies (none are in the record)", !/NOTE|SUPPLY/.test(k.html()));
  k.W.seasonKidStop();
  ok("closing stops the jobs listener too", k.off.indexOf("seasonJobs/ava") >= 0);
  const k2 = kidWorld(); k2.W.seasonKidPageHTML("ava"); k2.fire["seasons/list"]({});
  ok("no jobs and no season → “Nothing to plan yet.”", /Nothing to plan yet/.test(k2.html()) && !/Your jobs/.test(k2.html()));
}

console.log("\n# the kid ticks it");
{
  const k = kidWorld(); k.W.seasonKidPageHTML("ava"); k.fire["seasons/list"]({}); k.fire["seasonJobs/ava"](JOBS()); k.writes.length = 0;
  k.W.skJob("j1"); let w = k.last();
  ok("tick → ONE update: done = today + the bank entry's id", k.writes.length === 1 && w.path === "" && paths(w).length === 2 && w.val["seasonJobs/ava/j1/done"] === TODAY && w.val["seasonJobs/ava/j1/bid"] === "bd1", w && w.val);
  ok("it paid ONCE, the chore way: bankDirect(ava, 2, label, choreVerifyOn(ava))", k.bank.length === 1 && k.bank[0].op === "pay" && k.bank[0].kid === "ava" && k.bank[0].pts === 2 && k.bank[0].note === "🎉 Make the dough" && k.bank[0].hold === false);
  ok("it says so, and the job shows ticked", /⭐ \+2/.test(k.toasts.join()) && /Done!/.test(k.html()));
  k.bank.length = 0; k.W.skJob("j1"); w = k.last();
  ok("un-tick → exactly that entry is removed; done and bid cleared", k.bank.map(b => b.op).join() === "cuUnpay?,remove" && k.bank[1].id === "bd1" && w.val["seasonJobs/ava/j1/done"] === null && w.val["seasonJobs/ava/j1/bid"] === null);
  k.bank.length = 0; k.verify.ava = true; k.W.skJob("j1");
  ok("re-tick pays once more — held for Mom when this kid's chore check is on", k.bank.length === 1 && k.bank[0].hold === true);
  k.bank.length = 0; k.W.skJob("j2");
  ok("a job with no stars pays nothing", k.bank.length === 0 && k.last().val["seasonJobs/ava/j2/done"] === TODAY);
  k.T.jobData().j1.done = null; k.T.jobData().j1.bid = "bdZ"; k.bank.length = 0; k.W.skJob("j1");
  ok("a job already holding a bid is never paid twice", k.bank.filter(b => b.op === "pay").length === 0 && k.last().val["seasonJobs/ava/j1/done"] === TODAY);
  k.bank.length = 0; k.writes.length = 0; k.W.skJob("j3");
  ok("a job that isn't showing yet can't be ticked", k.writes.length === 0 && k.bank.length === 0);
  k.dry = true; k.writes.length = 0; k.bank.length = 0; k.T.jobData().j1.done = null; k.T.jobData().j1.bid = null; k.W.skJob("j1");
  ok("dry run → no bank call, nothing written", k.bank.length === 0 && k.writes.length === 0); k.dry = false;
  k.little = true; const k3 = kidWorld(); k3.little = true; k3.W.seasonKidPageHTML("ben"); k3.fire["seasons/list"]({}); k3.fire["seasonJobs/ben"]({ b1: { t: "Feed the birds", show: TODAY, due: TODAY, sn: "x/-/b1" } });
  ok("a pre-reader gets the big layout with a big tick", /sk-little/.test(k3.W.seasonKidPageHTML("ben")) && /class="sk-tick"/.test(k3.html()) && /due today!/.test(k3.html()));
}

console.log("\n# the kid's guard");
{
  const k = kidWorld(); k.W.seasonKidPageHTML("ava"); k.fire["seasons/list"]({}); k.fire["seasonJobs/ava"](JOBS());
  const T2 = k.T, ok1 = (p, v) => T2.okPath(p, v, "ava");
  ok("allowed: their own showing job's done (today or cleared) and bid", ok1("seasonJobs/ava/j1/done", TODAY) && ok1("seasonJobs/ava/j1/done", null) && ok1("seasonJobs/ava/j1/bid", "bd1") && ok1("seasonJobs/ava/j1/bid", null));
  const bad = [["seasonJobs/ben/j1/done", TODAY], ["seasonJobs/ava/j1/done", "2026-11-01"], ["seasonJobs/ava/j1/t", "x"], ["seasonJobs/ava/j1/stars", 50], ["seasonJobs/ava/j1/show", TODAY],
    ["seasonJobs/ava/j1", null], ["seasonJobs/ava/j9/done", TODAY], ["seasonJobs/ava/j3/done", TODAY], ["seasonJobs/ava/j1/bid", { x: 1 }], ["bank/ava/adjustments/x", { amount: 9 }]];
  ok("refused: another kid's job, an old date, its words/stars/day, the whole record, a job that isn't there or isn't showing, the bank", bad.every(b => !ok1(b[0], b[1])), bad.filter(b => ok1(b[0], b[1])));
  ok("a kid not on the roster can write nothing", !T2.okPath("seasonJobs/zed/j1/done", TODAY, "zed"));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
