/*
 * Node tests for 🎉 Seasons & Events — SEASONJOBS step A (her yes to "Dad & kid to-dos" 2026-11-21): a to-do for Dad lands on
 * Dad's OWN running to-do list by itself.
 *   · the guard: ONE more kind of path — dadday/<day>/todos/sn<id> — nothing else on Dad's day
 *   · a Dad to-do with a day → ONE copy at dadday/<due day − ahead>/todos/sn<id>, same shape as Mom's copy; the to-do keeps dadOn
 *   · "N days before" an idea follows the idea's day; nothing happens until the calendar has loaded
 *   · his tick = done on Mom's page; her tick here ticks his copy in the same update (and un-ticks it)
 *   · words / day / show-ahead / who change → his copy is re-worded or moved, never an orphan on the old day
 *   · deleting the to-do, the idea or the season, closing the season, the idea losing its day → his copy comes off
 *   · a done to-do is never re-added; a copy he ticked is never touched; a copy he ✕'d is not sent again (until its day changes)
 *   · 🤫 a surprise's to-dos NEVER reach dadday/ — and Mom's row says so
 *   · only on Mom's device, never in a dry run, never on Dad's own link; his own to-dos and other records are never touched
 *
 *   run:  node test_seasons_4.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
const SRC = fs.readFileSync(path.join(__dirname, process.env.SN_SRC || "seasons.js"), "utf8");
const TODAY = "2026-11-20";

function world() {
  const el = id => ({ id, innerHTML: "", value: "", style: {}, focus() {}, appendChild() {} });
  const nodes = {}, root = el("root");
  const o = { writes: [], timers: [], dry: false, mom: true, kioskD: false, LS: {}, root, repaints: 0 };
  const document = { getElementById(id) { return nodes[id] || (nodes[id] = el(id)); }, createElement(t) { return el(t); }, head: { appendChild() {} } };
  const db = { ref(p) { const P = p === undefined ? "" : p; return {
    set(v) { o.writes.push({ op: "set", path: P, val: JSON.parse(JSON.stringify(v)) }); },
    update(v) { o.writes.push({ op: "update", path: P, val: JSON.parse(JSON.stringify(v)) }); },
    remove() { o.writes.push({ op: "remove", path: P }); },
    on() {} }; } };
  const ctx = { console: { log: console.log, warn() {} }, Date, Math, JSON, document, db, _todayStr: () => TODAY, _dryRun: () => o.dry, momHere: () => o.mom, _kioskD: () => o.kioskD,
    gwShowToast() {}, HA_LS: { getItem: k => (k in o.LS ? o.LS[k] : null), setItem: (k, v) => { o.LS[k] = String(v); } },
    tab: "moms-plan", mpSubView: "seasons", momSchedView: false, renderMomsPlan() { o.repaints++; }, mpGoto() {},
    grData: { items: {} }, momdayData: {}, setTimeout: (fn) => { o.timers.push(fn); return o.timers.length; } };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext("const ROSTER_DEF=[{id:'ava',name:'Ava',color:'#2563eb'},{id:'ben',name:'Ben',color:'#16a34a'}]; var calendarData={events:{}}; var daddayData={};", ctx);
  vm.runInContext(SRC, ctx);
  o.ctx = ctx; o.W = ctx; o.T = ctx._snTest;
  o.cal = () => vm.runInContext("calendarData", ctx);
  o.dd = () => vm.runInContext("daddayData", ctx);
  // a timer left from the last world runs first, on the last world
  o.set = (d, s, ev, dd) => { o.timers.splice(0).forEach(f => f()); o.writes.length = 0; o.T.setData(d || {}, s || {}); o.T.reset(); o.cal().events = ev || {};
    const D = o.dd(); for (const k in D) delete D[k]; Object.assign(D, JSON.parse(JSON.stringify(dd || {}))); o.T.setRoot(root, ""); };
  o.sync = () => { o.writes.length = 0; const n = o.T.dadSync(); return n; };
  o.last = () => o.writes[o.writes.length - 1];
  return o;
}
const paths = w => Object.keys(w.val);
const DADP = w => paths(w).filter(p => /^dadday\//.test(p));
// A season: g1 has a calendar day (Dec 5); m1 has none; a whole-season to-do lives in extra.
const SEASON = (todoG1, extraTodo) => ({
  list: { xmas: { name: "Christmas 2026", emoji: "🎄", kind: "holiday", start: "2026-11-20", end: "2026-12-31", ts: 1 } },
  ideas: { xmas: {
    g1: { t: "Gingerbread houses", emoji: "🏠", by: "mom", ts: 2, ev: { e1: true }, todo: todoG1 || {} },
    m1: { t: "Movie night", by: "mom", ts: 3 } } },
  extra: extraTodo ? { xmas: { todo: extraTodo } } : undefined });
const EV = () => ({ e1: { title: "Gingerbread houses", date: "2026-12-05", time: "", who: "family", emoji: "🏠", addedBy: "mom" } });
const tdRec = (o, sid, iid, lid) => (iid ? o.T.data().ideas[sid][iid].todo[lid] : o.T.data().extra[sid].todo[lid]);
const ddTodos = (o, iso) => ((o.dd()[iso] || {}).todos || {});

const o = world(), W = o.W, T = o.T;

console.log("\n# the guard: ONE more kind of path, nothing else on Dad's day");
{
  o.set(SEASON());
  ok("allowed: an sn-record on Dad's own to-do list (and its fields)", T.OK.test("dadday/2026-11-20/todos/snt1") && T.OK.test("dadday/2026-11-20/todos/snt1/done") && T.OK.test("dadday/2026-11-20/todos/snt1/text"));
  const bad = ["dadday/2026-11-20/todos/t123", "dadday/2026-11-20/todos", "dadday/2026-11-20/chores/c1", "dadday/2026-11-20", "dadday/today/todos/snx", "dadday", "dadChores/c1", "momday/2026-11-20/todos/t1"];
  ok("refused: Dad's own to-dos, his chores, his whole day, anything else", bad.every(p => { const u = {}; u[p] = { x: 1 }; return T.apply(u) === false; }) && o.writes.length === 0, bad.filter(p => T.OK.test(p)));
  const code = SRC.replace(/^\s*\/\/.*$/gm, "");
  ok("every dadday path this file builds is <day>/todos/sn<id>", (code.match(/"dadday\/"/g) || []).length === 4 && (code.match(/"dadday\/"\+[A-Za-z.]+\+"\/todos\/(sn"|"\+k)/g) || []).length === 4);
  ok("no listener on Dad's list: it is read from the app's own daddayData", !/db\.ref\(["'`]dadday/.test(code) && /daddayData/.test(code));
}

console.log("\n# a Dad to-do with a date lands on his list by itself");
{
  o.set(SEASON({ t1: { t: "Buy frosting", who: "dad", due: "2026-12-03" } }), {}, EV());
  const n = o.sync(), w = o.last();
  ok("ONE update, two paths: his copy + the to-do's dadOn", o.writes.length === 1 && w.op === "update" && w.path === "" && paths(w).length === 2 && n === 2, w && paths(w));
  const c = w.val["dadday/2026-12-03/todos/snt1"];
  ok("the copy sits on its due day, in Mom's copy shape", !!c && c.text === "Buy frosting (🏠 Gingerbread houses)" && c.done === false && c.src === "season" && c.sn === "xmas/g1/t1" && typeof c.ts === "number" && Object.keys(c).length === 5, c);
  ok("the to-do remembers the day: dadOn", w.val["seasons/ideas/xmas/g1/todo/t1/dadOn"] === "2026-12-03" && tdRec(o, "xmas", "g1", "t1").dadOn === "2026-12-03");
  ok("it is mirrored into the app's daddayData (Dad's page on this device sees it now)", ddTodos(o, "2026-12-03").snt1 && ddTodos(o, "2026-12-03").snt1.text === c.text);
  ok("a second pass writes nothing", o.sync() === 0 && o.writes.length === 0);
  T.draw();
  ok("Mom's row says when it shows on his list — and has no “→ My list today”", /On Dad’s list from Dec 3/.test(o.root.innerHTML) || (W.snViewSet("todo"), /On Dad’s list from Dec 3/.test(o.root.innerHTML)));
  W.snViewSet("todo");
  const row = (o.root.innerHTML.split("Buy frosting")[1] || "").split("</div>")[0];
  ok("…and no “→ My list today” button on that row", row && !/My list today/.test(row), row);
}

console.log("\n# show it some days ahead (her answer 1)");
{
  o.set(SEASON({ t1: { t: "Buy frosting", who: "dad", due: "2026-12-03", ahead: 2 } }), {}, EV());
  o.sync();
  ok("ahead 2 → on his list from Dec 1", !!o.last().val["dadday/2026-12-01/todos/snt1"] && o.last().val["seasons/ideas/xmas/g1/todo/t1/dadOn"] === "2026-12-01");
  o.set(SEASON({ t1: { t: "Buy frosting", who: "dad", due: "2026-12-03", ahead: 400 } }), {}, EV());
  o.sync();
  ok("ahead is capped at 30 days", !!o.last().val["dadday/2026-11-03/todos/snt1"], paths(o.last()));
}

console.log("\n# “N days before” the idea's day");
{
  o.set(SEASON({ t2: { t: "Set up the table", who: "dad", before: 1 } }), {}, EV());
  o.sync();
  ok("1 day before Dec 5 → Dec 4", !!o.last().val["dadday/2026-12-04/todos/snt2"]);
  o.cal().events = undefined;   // a device whose calendar hasn't loaded yet must not think the idea lost its day
  ok("nothing at all until the calendar has loaded (his copy is not taken off)", o.sync() === 0 && o.writes.length === 0 && !!ddTodos(o, "2026-12-04").snt2);
  o.cal().events = EV();
  // the idea moves in the calendar
  o.cal().events.e1.date = "2026-12-10"; o.sync();
  const w = o.last();
  ok("the idea moves → his copy moves: old day's copy removed, new one added, dadOn follows — in ONE update",
    o.writes.length === 1 && w.val["dadday/2026-12-04/todos/snt2"] === null && !!w.val["dadday/2026-12-09/todos/snt2"] && w.val["seasons/ideas/xmas/g1/todo/t2/dadOn"] === "2026-12-09", paths(w));
  ok("no orphan left on the old day", !ddTodos(o, "2026-12-04").snt2 && !!ddTodos(o, "2026-12-09").snt2);
  // the idea loses its day
  delete o.cal().events.e1; o.sync();
  ok("the idea loses its day → his copy comes off, dadOn cleared", o.last().val["dadday/2026-12-09/todos/snt2"] === null && o.last().val["seasons/ideas/xmas/g1/todo/t2/dadOn"] === null && !ddTodos(o, "2026-12-09").snt2);
  T.draw(); W.snViewSet("todo");
  ok("Mom's row: “Goes on Dad’s list once it has a day”", /Goes on Dad’s list once it has a day/.test(o.root.innerHTML));
  ok("no day → nothing sent", o.sync() === 0);
}

console.log("\n# his tick, her tick");
{
  o.set(SEASON({ t1: { t: "Buy frosting", who: "dad", due: "2026-11-20" } }), {}, EV());
  o.sync();
  // Dad ticks on his own page (index.html ddTodoToggle writes done/doneOn on his copy)
  Object.assign(o.dd()["2026-11-20"].todos.snt1, { done: true, doneOn: TODAY });
  const L = T.line("xmas", "g1", "todo", "t1");
  ok("his tick → the to-do is done on Mom's page", T.tdDone(L) === true);
  T.draw(); W.snViewSet("todo");
  ok("…and her row says “✓ Dad ticked it”", /✓ Dad ticked it/.test(o.root.innerHTML));
  ok("a copy he ticked is never touched by the sync", o.sync() === 0);
  // words change after he ticked: still untouched
  tdRec(o, "xmas", "g1", "t1").t = "Buy MORE frosting";
  ok("…even when the words change after", o.sync() === 0);
  // Mom un-ticks it on her page → his copy un-ticks in the same update
  o.writes.length = 0; W.snTodoTick("xmas", "g1", "t1");
  let w = o.last();
  ok("her un-tick here un-ticks his copy in the same update", o.writes.length === 1 && w.val["seasons/ideas/xmas/g1/todo/t1/done"] === null && w.val["dadday/2026-11-20/todos/snt1/done"] === false && w.val["dadday/2026-11-20/todos/snt1/doneOn"] === null, w && w.val);
  o.writes.length = 0; W.snTodoTick("xmas", "g1", "t1"); w = o.last();
  ok("her tick here ticks his copy in the same update (it crosses off his list today, drops off tomorrow)", w.val["seasons/ideas/xmas/g1/todo/t1/done"] === TODAY && w.val["dadday/2026-11-20/todos/snt1/done"] === true && w.val["dadday/2026-11-20/todos/snt1/doneOn"] === TODAY);
  ok("a done to-do is never re-added", o.sync() === 0);
}

console.log("\n# changing it moves or updates his copy");
{
  o.set(SEASON({ t1: { t: "Buy frosting", who: "dad", due: "2026-12-03" } }), {}, EV());
  o.sync();
  W.snLine("todo", "g1", "t1"); W.snSet("t", "Buy white frosting"); W.snSave(); o.sync();
  let w = o.last();
  ok("new words → ONLY his copy's text changes", o.writes.length === 1 && paths(w).length === 1 && w.val["dadday/2026-12-03/todos/snt1/text"] === "Buy white frosting (🏠 Gingerbread houses)", w && paths(w));
  W.snLine("todo", "g1", "t1"); W.snSet("due", "2026-12-06"); W.snSave(); o.sync(); w = o.last();
  ok("new date → old day's copy off, new day's on, dadOn follows", w.val["dadday/2026-12-03/todos/snt1"] === null && !!w.val["dadday/2026-12-06/todos/snt1"] && w.val["seasons/ideas/xmas/g1/todo/t1/dadOn"] === "2026-12-06");
  W.snLine("todo", "g1", "t1");
  ok("the pop-up has the show-ahead box for Dad", /Show it on Dad’s list early/.test(o.root.innerHTML) && /on his own list by themselves/.test(o.root.innerHTML));
  W.snSet("ahead", "3"); W.snSave();
  ok("show-ahead is saved on the to-do", tdRec(o, "xmas", "g1", "t1").ahead === 3);
  o.sync(); w = o.last();
  ok("new show-ahead → his copy moves to Dec 3", w.val["dadday/2026-12-06/todos/snt1"] === null && !!w.val["dadday/2026-12-03/todos/snt1"]);
  W.snLine("todo", "g1", "t1"); W.snLineWho("mom");
  ok("for anyone but Dad there is no show-ahead box", !/Show it on Dad’s list early/.test(o.root.innerHTML));
  W.snSave();
  ok("re-assigned to Mom → show-ahead dropped", tdRec(o, "xmas", "g1", "t1").ahead === undefined && tdRec(o, "xmas", "g1", "t1").who === "mom");
  o.sync(); w = o.last();
  ok("…and his copy comes off, dadOn cleared", w.val["dadday/2026-12-03/todos/snt1"] === null && w.val["seasons/ideas/xmas/g1/todo/t1/dadOn"] === null && Object.keys(ddTodos(o, "2026-12-03")).length === 0);
  W.snLine("todo", "g1", "t1"); W.snLineWho("dad"); W.snSave(); o.sync();
  ok("back to Dad → sent again", !!o.last().val["dadday/2026-12-06/todos/snt1"]);
  // a NEW Dad to-do from the pop-up
  W.snLine("todo", "m1", ""); W.snSet("t", "Rent the projector"); W.snLineWho("dad"); W.snSet("due", "2026-12-12"); W.snSet("ahead", "2"); W.snSave();
  const id = Object.keys(T.data().ideas.xmas.m1.todo)[0], r = T.data().ideas.xmas.m1.todo[id];
  ok("a new Dad to-do: {t, who, due, ahead}", r.t === "Rent the projector" && r.who === "dad" && r.due === "2026-12-12" && r.ahead === 2 && Object.keys(r).length === 4, r);
  o.sync();
  ok("…lands on his list 2 days ahead", !!o.last().val["dadday/2026-12-10/todos/sn" + id]);
  W.snLine("todo", "m1", ""); W.snSet("t", "Popcorn"); W.snSet("ahead", "5"); W.snSave();
  const id2 = Object.keys(T.data().ideas.xmas.m1.todo).find(k => k !== id);
  ok("a Mom to-do never stores show-ahead, even if typed", T.data().ideas.xmas.m1.todo[id2].ahead === undefined);
}

console.log("\n# deleting or closing takes it off");
{
  const fresh = () => { o.set(SEASON({ t1: { t: "Buy frosting", who: "dad", due: "2026-12-03" } }, { x1: { t: "Hang the lights", who: "dad", due: "2026-11-28" } }), {}, EV()); o.sync(); };
  fresh();
  ok("a whole-season Dad to-do goes too", !!ddTodos(o, "2026-11-28").snx1 && ddTodos(o, "2026-11-28").snx1.sn === "xmas/-/x1" && ddTodos(o, "2026-11-28").snx1.text === "Hang the lights (🎄 Christmas 2026)");
  W.snLine("todo", "g1", "t1"); W.snLineDel(); W.snLineDel(); o.sync();
  ok("delete the to-do → his copy comes off", o.last().val["dadday/2026-12-03/todos/snt1"] === null && paths(o.last()).length === 1);
  fresh();
  const up = {}; up["seasons/ideas/xmas/g1"] = null; T.apply(up); o.sync();
  ok("delete the idea → its to-do's copy comes off", o.last().val["dadday/2026-12-03/todos/snt1"] === null && !!ddTodos(o, "2026-11-28").snx1);
  fresh();
  const up2 = {}; up2["seasons/list/xmas/closed"] = true; T.apply(up2); o.sync();
  ok("close the season (📜 past) → every copy comes off", o.last().val["dadday/2026-12-03/todos/snt1"] === null && o.last().val["dadday/2026-11-28/todos/snx1"] === null);
  fresh();
  const up3 = {}; up3["seasons/list/xmas"] = null; up3["seasons/ideas/xmas"] = null; up3["seasons/extra/xmas"] = null; T.apply(up3); o.sync();
  ok("delete the season → every copy comes off", o.last().val["dadday/2026-12-03/todos/snt1"] === null && o.last().val["dadday/2026-11-28/todos/snx1"] === null && paths(o.last()).length === 2);
  fresh();
  const up4 = {}; up4["seasons/ideas/xmas/g1/skip"] = true; T.apply(up4); o.sync();
  ok("🌙 not this year → its copy comes off", o.last().val["dadday/2026-12-03/todos/snt1"] === null);
  fresh();
  const up5 = {}; up5["seasons/ideas/xmas/g1/did"] = TODAY; T.apply(up5); o.sync();
  ok("✓ we did it → its unticked copy comes off", o.last().val["dadday/2026-12-03/todos/snt1"] === null);
  fresh();
  Object.assign(o.dd()["2026-12-03"].todos.snt1, { done: true, doneOn: TODAY });
  const up6 = {}; up6["seasons/ideas/xmas/g1"] = null; T.apply(up6);
  ok("a copy Dad ticked stays as his history, even when its to-do is deleted", o.sync() === 0 && ddTodos(o, "2026-12-03").snt1.done === true);
}

console.log("\n# a copy he ✕'d off his own list");
{
  o.set(SEASON({ t1: { t: "Buy frosting", who: "dad", due: "2026-12-03" } }), {}, EV());
  o.sync(); delete o.dd()["2026-12-03"].todos.snt1;   // index.html ddTodoDel
  ok("is not sent again", o.sync() === 0);
  T.draw(); W.snViewSet("todo");
  ok("Mom's row: “Dad took it off his list”", /Dad took it off his list/.test(o.root.innerHTML));
  W.snLine("todo", "g1", "t1"); W.snSet("due", "2026-12-04"); W.snSave(); o.sync();
  ok("…until its day changes", !!o.last().val["dadday/2026-12-04/todos/snt1"]);
}

console.log("\n# 🤫 a surprise's to-dos never go to Dad's list");
{
  const SEC = { xmas: { s1: { t: "Ice skating", emoji: "⛸", by: "mom", hide: "hint", ev: { e1: true }, todo: { t9: { t: "Buy skate tickets", who: "dad", due: "2026-12-01" } } } } };
  o.set(SEASON(), SEC, EV());
  ok("never sent (it lives in seasonSecret/)", o.sync() === 0 && Object.keys(o.dd()).length === 0);
  T.draw(); W.snViewSet("todo");
  ok("Mom's row says so plainly", /Stays here\. A surprise’s to-dos never go to Dad’s list\./.test(o.root.innerHTML));
  W.snLine("todo", "s1", "t9");
  ok("the pop-up says so too, with no show-ahead box", /This idea is a surprise, so its to-dos stay on this page/.test(o.root.innerHTML) && !/Show it on Dad’s list early/.test(o.root.innerHTML));
  W.snCancel();
  // an idea that becomes a surprise AFTER its to-do went out
  o.set(SEASON({ t1: { t: "Buy frosting", who: "dad", due: "2026-12-03" } }), {}, EV());
  o.sync();
  const g1 = JSON.parse(JSON.stringify(T.data().ideas.xmas.g1)); g1.hide = "hint";
  const up = {}; up["seasons/ideas/xmas/g1"] = null; up["seasonSecret/xmas/g1"] = g1; T.apply(up);
  o.sync(); const w = o.last();
  ok("an idea made a surprise later → his unticked copy comes off", w.val["dadday/2026-12-03/todos/snt1"] === null && !ddTodos(o, "2026-12-03").snt1);
  ok("no write ever carried a surprise's words to dadday/", !JSON.stringify(o.writes.filter(x => x.val).map(x => DADP(x).map(p => x.val[p]))).match(/skate|Ice skating/i));
}

console.log("\n# who runs it");
{
  const S = () => o.set(SEASON({ t1: { t: "Buy frosting", who: "dad", due: "2026-12-03" } }), {}, EV());
  S(); o.mom = false;
  ok("not on a device without Mom", o.sync() === 0 && o.writes.length === 0); o.mom = true;
  S(); o.dry = true;
  ok("never in a dry run", o.sync() === 0 && o.writes.length === 0 && Object.keys(o.dd()).length === 0); o.dry = false;
  S(); o.kioskD = true;
  ok("never on Dad's own link", o.sync() === 0); o.kioskD = false;
  // Dad's own to-dos and other sn-records are left alone
  S(); Object.assign(o.dd(), { "2026-11-19": { todos: { t1: { text: "Oil change", done: false, ts: 1 }, snq: { text: "From elsewhere", done: false, ts: 2 } }, chores: { c1: true } } });
  o.sync();
  ok("his own to-dos, his chores and any sn-record not from the planner are never touched", DADP(o.last()).every(p => p.indexOf("2026-11-19") < 0));
}

console.log("\n# Home Base 🔴 NOW and the timer");
{
  o.set(SEASON({ t1: { t: "Buy frosting", who: "dad", due: "2026-11-20" }, t2: { t: "Wrap gifts", who: "mom", due: "2026-11-20" } }), {}, EV());
  o.sync(); W.tab = "moms-plan"; W.mpSubView = "plan";
  const now = W.seasonNowLines();
  ok("NOW lists Mom's due to-do, not the one on Dad's list", /Wrap gifts/.test(now.html) && !/Buy frosting/.test(now.html), now.html);
  W.mpSubView = "seasons";
  o.set(SEASON({ t1: { t: "Buy frosting", who: "dad", due: "2026-12-03" } }), {}, EV());
  T.draw();
  ok("drawing the page asks for a sync on a timer (once)", o.timers.length === 1 && T.syncPending());
  T.draw();
  ok("…not twice", o.timers.length === 1);
  o.timers[0]();
  ok("the timer runs the sync", !!ddTodos(o, "2026-12-03").snt1 && !T.syncPending());
}

console.log("\n# no family's names, no Santa");
{
  ok("no family's names, no Santa, no 🔀", !/lincoln|ellis|\blucy\b|julian|howe|dewalt|burris|polar|disney|santa/i.test(SRC) && SRC.indexOf("\u{1F500}") < 0);
  ok("Dad is the who-picker's own id \"dad\" (no names)", /SN_DAD=\{id:"dad"/.test(SRC) && /\(L\.r\.who\|\|"mom"\)!=="dad"/.test(SRC));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
