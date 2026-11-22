/*
 * Node tests for 🎉 Seasons & Events — slice 2 (her "Planner slice 2" 2026-11-20): supplies + to-dos + 🎟 book by + due things in 🔴 NOW.
 *   · the guard: two new kinds of path only — seasons/extra/<sid>/… and momday/<day>/todos/sn<id>; nothing else on Mom's day, nothing in the Kitchen
 *   · 🧺 supplies: lines on an idea (inside the idea's own record) or on the whole season (seasons/extra); ☐ have it = one field
 *   · 🛒 To the list: ONE TAP per line through the Kitchen's own grCreate, with a back-link and a label; NEVER by itself;
 *     "already on the list" / "in the pantry" is said FIRST; "send all for this idea" leaves those to ask one by one
 *   · ✅ to-dos: what, who, a date OR "N days before the idea's day" — the day is worked out, so it moves when the idea moves
 *   · → My list today: ONE copy on momday/<today>/todos/sn<id>, never twice; ticked here or there = done
 *   · 🎟 book by: a date + booked
 *   · 🔴 NOW: Mom only, never Dad's TV; due to-dos + close book-by dates; a 🤫 surprise is only counted
 *   · 🤫 surprise: its lines live in seasonSecret/; its Shopping List label is the season only; its NOW line and its copy on Mom's
 *     list never carry its name or its words; flipping the switch later re-labels rows already sent
 *   · index.html: only the thin seasonNowHTML hook + one line in the NOW list
 *
 *   run:  node test_seasons_2.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
const SRC = fs.readFileSync(path.join(__dirname, "seasons.js"), "utf8");

function world(opts) {   // a fresh page: stubbed app globals + seasons.js
  opts = opts || {};
  const el = id => ({ id, innerHTML: "", value: "", style: {}, focus() {}, appendChild() {} });
  const nodes = {}, root = el("root");
  const o = { writes: [], listens: [], fire: {}, grCalls: [], grPuts: [], dup: {}, have: {}, toasts: [], repaints: 0, gotos: [], dry: false, mom: true, kioskD: false, LS: {}, root };
  const document = { getElementById(id) { return nodes[id] || (nodes[id] = el(id)); }, createElement(t) { return el(t); }, head: { appendChild() {} } };
  const db = opts.noDb ? null : { ref(p) { const P = p === undefined ? "" : p; return {
    set(v) { o.writes.push({ op: "set", path: P, val: JSON.parse(JSON.stringify(v)) }); },
    update(v) { o.writes.push({ op: "update", path: P, val: JSON.parse(JSON.stringify(v)) }); },
    remove() { o.writes.push({ op: "remove", path: P }); },
    on(ev, fn) { o.listens.push(P); o.fire[P] = v => fn({ val: () => v }); } }; } };
  let gn = 0;
  const ctx = { console: { log: console.log, warn() {} }, Date, Math, JSON, document, db, _todayStr: () => "2026-11-20", _dryRun: () => o.dry, momHere: () => o.mom, _kioskD: () => o.kioskD,
    gwShowToast: m => o.toasts.push(m), HA_LS: { getItem: k => (k in o.LS ? o.LS[k] : null), setItem: (k, v) => { o.LS[k] = String(v); } },
    tab: "moms-plan", mpSubView: "seasons", momSchedView: false, renderMomsPlan() { o.repaints++; }, mpGoto: v => { o.gotos.push(v); },
    grData: { items: {} }, momdayData: {},
    grCreate(p, src, stores) { const id = "g" + (++gn); o.grCalls.push({ p: JSON.parse(JSON.stringify(p)), src: JSON.parse(JSON.stringify(src)), stores }); const it = { name: p.name, src: [src] }; if (p.qty > 0) it.qty = p.qty; if (p.ref) it.ref = p.ref; ctx.grData.items[id] = it; return id; },
    grPut(id, it) { o.grPuts.push({ id, it: JSON.parse(JSON.stringify(it)) }); ctx.grData.items[id] = it; },
    grFindDup: name => o.dup[String(name).toLowerCase()] || null, grHaveIt: name => o.have[String(name).toLowerCase()] || "" };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext("const ROSTER_DEF=[{id:'ava',name:'Ava',color:'#2563eb'},{id:'ben',name:'Ben',color:'#16a34a'}]; var calendarData={events:{}};", ctx);
  vm.runInContext(SRC, ctx);
  o.ctx = ctx; o.W = ctx; o.T = ctx._snTest; o.cal = () => vm.runInContext("calendarData", ctx);
  o.set = (d, s, ev) => { o.writes.length = 0; o.T.setData(d || {}, s || {}); o.T.reset(); o.cal().events = ev || {}; o.T.setRoot(root, ""); o.grCalls.length = 0; o.grPuts.length = 0; o.toasts.length = 0; ctx.grData.items = {}; for (const k in ctx.momdayData) delete ctx.momdayData[k]; o.dup = {}; o.have = {}; };
  o.last = () => o.writes[o.writes.length - 1];
  return o;
}
const paths = w => Object.keys(w.val);
const SEASON = () => ({ list: { xmas: { name: "Christmas 2026", emoji: "🎄", kind: "holiday", start: "2026-11-20", end: "2026-12-31", ts: 1 } },
  ideas: { xmas: { g1: { t: "Gingerbread houses", emoji: "🏠", by: "mom", ts: 2 }, m1: { t: "Movie night", by: "mom", ts: 3 } } } });
const ID = (w, re) => paths(w).map(p => (re.exec(p) || [])[1]).filter(Boolean);

const o = world(), W = o.W, T = o.T;

console.log("\n# the guard: two new kinds of path, nothing wider");
{
  o.set(SEASON());
  ok("allowed: a whole-season line, and one sn-record on Mom's own to-do list", T.OK.test("seasons/extra/xmas/todo/t1") && T.OK.test("seasons/extra/xmas/sup/u1/have") && T.OK.test("seasons/extra/xmas") && T.OK.test("momday/2026-11-20/todos/snt1") && T.OK.test("momday/2026-11-20/todos/snt1/done"));
  const bad = ["momday/2026-11-20/todos/t123", "momday/2026-11-20/todos", "momday/2026-11-20/win", "momday/2026-11-20", "momday/today/todos/snx", "dadday/2026-11-20/todos/t123", "dadday/2026-11-20/chores/x", "kitchen/grocery/items/g1", "kitchen/grocery/items/g1/src", "kitchen/plan/2026-11-20", "seasons/extra", "calendar/holidays/x", "week32/tasks/t1"];
  ok("refused: any other record on Mom's day, Dad's day, the Kitchen, school", bad.every(p => { const u = {}; u[p] = { x: 1 }; return T.apply(u) === false; }) && o.writes.length === 0, bad.filter(p => T.OK.test(p)));
}

console.log("\n# 🧺 supplies on an idea");
let supIds;
{
  o.set(SEASON()); T.draw();
  W.snOpenIdea("g1"); W.snLine("sup", "g1", "");
  ok("＋ Add supplies opens its own pop-up and writes nothing", T.edit().type === "line" && T.edit().kind === "sup" && o.writes.length === 0 && /Commas make more than one line/.test(o.root.innerHTML));
  W.snSave();
  ok("nothing typed → a plain line, no write", o.writes.length === 0 && /Type what you need first/.test(o.root.innerHTML));
  W.snSet("name", "4 gingerbread kits, frosting,  gumdrops"); W.snSave();
  const w = o.last(); supIds = ID(w, /^seasons\/ideas\/xmas\/g1\/sup\/([^\/]+)$/);
  ok("commas → three lines in ONE update, each its own record inside the idea", o.writes.length === 1 && w.op === "update" && w.path === "" && paths(w).length === 3 && supIds.length === 3, paths(w));
  const recs = supIds.map(id => w.val["seasons/ideas/xmas/g1/sup/" + id]);
  ok("a number in front is how many; the record is just {name, qty?}", recs[0].name === "gingerbread kits" && recs[0].qty === 4 && Object.keys(recs[0]).length === 2 && recs[1].name === "frosting" && Object.keys(recs[1]).length === 1 && recs[2].name === "gumdrops", recs);
  ok("it comes back to the idea's pop-up, which lists them with 🛒 To the list", T.edit().type === "idea" && T.edit().id === "g1" && /gingerbread kits <b>× 4<\/b>/.test(o.root.innerHTML) && (o.root.innerHTML.match(/🛒 To the list/g) || []).length === 3 && /Send all 3/.test(o.root.innerHTML));
  ok("adding supplies never touches the Shopping List by itself", o.grCalls.length === 0);
  // change one
  o.writes.length = 0; W.snLine("sup", "g1", supIds[1]); W.snSet("name", "white frosting"); W.snSet("qty", "2"); W.snSave();
  ok("a change writes only the fields that changed", o.writes.length === 1 && paths(o.last()).sort().join() === ["seasons/ideas/xmas/g1/sup/" + supIds[1] + "/name", "seasons/ideas/xmas/g1/sup/" + supIds[1] + "/qty"].join(), paths(o.last()));
  o.writes.length = 0; W.snLine("sup", "g1", supIds[1]); W.snSave();
  ok("Save with nothing changed writes nothing", o.writes.length === 0);
  // have it
  W.snCancel(); o.writes.length = 0; W.snSupHave("xmas", "g1", supIds[2]);
  ok("☐ have it = ONE field", o.writes.length === 1 && paths(o.last()).join() === "seasons/ideas/xmas/g1/sup/" + supIds[2] + "/have" && o.last().val[paths(o.last())[0]] === true && T.supState(T.line("xmas", "g1", "sup", supIds[2])) === "have");
  W.snSupHave("xmas", "g1", supIds[2]);
  ok("un-tick clears it", o.last().val[paths(o.last())[0]] === null && T.supState(T.line("xmas", "g1", "sup", supIds[2])) === "need");
  // delete: two taps
  o.writes.length = 0; W.snLine("sup", "g1", supIds[2]); W.snLineDel();
  ok("Delete asks for a second tap", o.writes.length === 0 && /Tap again to delete/.test(o.root.innerHTML));
  W.snLineDel();
  ok("the second tap removes that ONE line", o.writes.length === 1 && paths(o.last()).join() === "seasons/ideas/xmas/g1/sup/" + supIds[2] && o.last().val[paths(o.last())[0]] === null && T.lines("xmas", "sup").length === 2);
}

console.log("\n# 🛒 To the list — one tap, through the Kitchen's own door");
{
  W.snViewSet("sup"); o.writes.length = 0; W.snSupList("xmas", "g1", supIds[0]);
  const c = o.grCalls[0];
  ok("one tap = ONE grCreate call", o.grCalls.length === 1 && c.p.name === "gingerbread kits" && c.p.qty === 4, c);
  ok("with the back-link ref.sn = season/idea/line", c.p.ref.sn === "xmas/g1/" + supIds[0]);
  ok("and the label '🎄 Christmas 2026 · Gingerbread houses'", c.src.k === "season" && c.src.lbl === "🎄 Christmas 2026 · Gingerbread houses", c.src);
  ok("this file's own write: just the row's id on the line", o.writes.length === 1 && paths(o.last()).join() === "seasons/ideas/xmas/g1/sup/" + supIds[0] + "/gr" && o.last().val[paths(o.last())[0]] === "g1");
  ok("the line now says it is on the Shopping List", T.supState(T.line("xmas", "g1", "sup", supIds[0])) === "list" && /🛒 on the Shopping List/.test(o.root.innerHTML));
  W.snSupList("xmas", "g1", supIds[0]);
  ok("a second tap adds nothing", o.grCalls.length === 1 && o.writes.length === 1);
  delete o.ctx.grData.items.g1; T.draw();
  ok("when the row leaves the list (bought) the line asks 'got it?' — the tick stays hers", T.supState(T.line("xmas", "g1", "sup", supIds[0])) === "was" && /was on the Shopping List/.test(o.root.innerHTML));
}

console.log("\n# it says so first: already on the list / already in the house");
{
  o.set(SEASON()); W.snViewSet("sup"); W.snLine("sup", "g1", ""); W.snSet("name", "frosting, gumdrops, 2 candy canes, sprinkles"); W.snSave();
  const ids = ID(o.last(), /sup\/([^\/]+)$/); o.writes.length = 0;
  o.ctx.grData.items.gX = { name: "Frosting", src: [{ k: "mom" }] }; o.dup.frosting = { kind: "item", id: "gX", it: o.ctx.grData.items.gX }; o.have.gumdrops = "🥫 in pantry";
  W.snSupList("xmas", "g1", ids[0]);
  ok("already on the list → nothing is sent, and the line says so", o.grCalls.length === 0 && o.writes.length === 0 && /is already on the Shopping List/.test(o.root.innerHTML) && /It’s the same one/.test(o.root.innerHTML) && /Add anyway/.test(o.root.innerHTML));
  W.snSupSame("xmas", "g1", ids[0]);
  ok("'It's the same one' links the line to that row — no new row", o.grCalls.length === 0 && o.writes.length === 1 && o.last().val["seasons/ideas/xmas/g1/sup/" + ids[0] + "/gr"] === "gX" && T.supState(T.line("xmas", "g1", "sup", ids[0])) === "list");
  o.writes.length = 0; W.snSupList("xmas", "g1", ids[1]);
  ok("pantry or staples have it → nothing is sent, and the line says so", o.grCalls.length === 0 && o.writes.length === 0 && /You may already have it \(🥫 in pantry\)/.test(o.root.innerHTML));
  W.snAskNo();
  ok("'Leave it' drops the question, still nothing sent", T.ask() === null && o.grCalls.length === 0);
  W.snSupList("xmas", "g1", ids[1]); W.snSupList("xmas", "g1", ids[1], 1);
  ok("'Add anyway' sends it", o.grCalls.length === 1 && o.grCalls[0].p.name === "gumdrops");
  // send all
  o.set(SEASON()); T.draw(); W.snLine("sup", "g1", ""); W.snSet("name", "frosting, gumdrops, 2 candy canes, sprinkles"); W.snSave();
  o.have.gumdrops = "🧺 have"; o.writes.length = 0; W.snSupAll("xmas", "g1");
  ok("'Send all' sends every line still needed, and leaves the ones the house may have", o.grCalls.length === 3 && o.grCalls.every(c => c.p.name !== "gumdrops") && /3 sent/.test(o.toasts[o.toasts.length - 1]) && /1 may already be/.test(o.toasts[o.toasts.length - 1]), o.toasts);
  ok("each sent line got its own one-field write", o.writes.length === 3 && o.writes.every(w => paths(w).length === 1 && /\/sup\/[^\/]+\/gr$/.test(paths(w)[0])));
  o.set(SEASON()); T.draw(); W.snLine("sup", "g1", ""); W.snSet("name", "tape"); W.snSave(); const id = ID(o.last(), /sup\/([^\/]+)$/)[0];
  o.dry = true; o.writes.length = 0; W.snSupList("xmas", "g1", id);
  ok("?dryrun=1 → the Kitchen is never called", o.grCalls.length === 0 && o.writes.length === 0);
  o.dry = false;
  // scheduling an idea with supplies does not send them
  W.snSched("g1"); W.snPickDay("2026-12-12");
  ok("putting the idea on the calendar sends nothing to the Shopping List (never automatic)", o.grCalls.length === 0);
}

console.log("\n# 🧺 for the whole season + the Supplies view");
{
  o.set(SEASON(), {}, { ev1: { title: "Movie night", date: "2026-12-04", time: "", who: "family", emoji: "🎉" }, ev2: { title: "Gingerbread houses", date: "2026-12-12", time: "", who: "family", emoji: "🏠" } });
  T.data().ideas.xmas.m1.ev = { ev1: true }; T.data().ideas.xmas.g1.ev = { ev2: true };
  T.data().ideas.xmas.c1 = { t: "Cookie swap", by: "mom", ts: 4, sup: { u9: { name: "tins" } } };
  T.data().ideas.xmas.z1 = { t: "Parked thing", by: "mom", ts: 5, skip: true, sup: { u8: { name: "parkedsupply" } } };
  T.data().ideas.xmas.g1.sup = { u1: { name: "kits", qty: 4 } }; T.data().ideas.xmas.m1.sup = { u2: { name: "popcorn" } };
  W.snViewSet("sup"); W.snLine("sup", "", ""); W.snSet("name", "wrapping paper"); W.snSave();
  ok("a whole-season supply is ONE record under seasons/extra/<sid>/sup", o.writes.length === 1 && /^seasons\/extra\/xmas\/sup\/[^\/]+$/.test(paths(o.last())[0]) && o.last().val[paths(o.last())[0]].name === "wrapping paper");
  const h = o.root.innerHTML, i1 = h.indexOf("For Fri Dec 4"), i2 = h.indexOf("For Sat Dec 12"), i3 = h.indexOf("Not scheduled yet"), i4 = h.indexOf("For all of Christmas 2026");
  ok("the Supplies view: soonest day first, then 'Not scheduled yet', then the whole season", i1 > 0 && i2 > i1 && i3 > i2 && i4 > i3 && h.indexOf("tins") > i3 && h.indexOf("wrapping paper") > i4, [i1, i2, i3, i4]);
  ok("a 🌙 not-this-year idea's supplies rest too", h.indexOf("parkedsupply") < 0);
  ok("the view chip counts what is still to get", /🧺 Supplies<small>4 to get<\/small>/.test(h), (h.match(/🧺 Supplies[^<]*<small>[^<]*/) || [""])[0]);
  o.grCalls.length = 0; const xid = paths(o.last())[0].split("/").pop(); W.snSupList("xmas", "", xid);
  ok("a whole-season line goes to the list labelled with the season", o.grCalls.length === 1 && o.grCalls[0].src.lbl === "🎄 Christmas 2026" && o.grCalls[0].p.ref.sn === "xmas/-/" + xid);
}

console.log("\n# ✅ to-dos: who, and a date OR days before the idea's day");
let tdRel, tdDate;
{
  o.set(SEASON(), {}, { ev2: { title: "Gingerbread houses", date: "2026-12-12", time: "", who: "family", emoji: "🏠" } });
  T.data().ideas.xmas.g1.ev = { ev2: true }; T.draw();
  W.snOpenIdea("g1"); W.snLine("todo", "g1", "");
  ok("the pop-up offers every person, a date, and 'days before its day'", /What needs doing/.test(o.root.innerHTML) && />Ava</.test(o.root.innerHTML) && />Mom</.test(o.root.innerHTML) && />Dad</.test(o.root.innerHTML) && /days before its day/.test(o.root.innerHTML) && /Its day is Sat Dec 12/.test(o.root.innerHTML));
  W.snSave();
  ok("it needs words", o.writes.length === 0 && /needs a few words/.test(o.root.innerHTML));
  W.snSet("t", "Buy the candy"); W.snLineWho("dad"); W.snSet("before", "3"); W.snSave();
  tdRel = ID(o.last(), /todo\/([^\/]+)$/)[0];
  const r = o.last().val["seasons/ideas/xmas/g1/todo/" + tdRel];
  ok("ONE record inside the idea: {t, who, before} — no date is stored for 'days before'", o.writes.length === 1 && r.t === "Buy the candy" && r.who === "dad" && r.before === 3 && Object.keys(r).length === 3, r);
  ok("its day is worked out: 3 days before Sat Dec 12 = Wed Dec 9", T.tdDue(T.line("xmas", "g1", "todo", tdRel)) === "2026-12-09");
  o.writes.length = 0; o.cal().events.ev2.date = "2026-12-16";
  ok("move the idea in the calendar → the to-do moves by itself, with no write", T.tdDue(T.line("xmas", "g1", "todo", tdRel)) === "2026-12-13" && o.writes.length === 0);
  delete o.cal().events.ev2; T.draw();
  ok("no day → it waits ('3 days before — no day yet')", T.tdDue(T.line("xmas", "g1", "todo", tdRel)) === "" && T.tdState(T.line("xmas", "g1", "todo", tdRel)) === "open");
  o.cal().events.ev2 = { title: "Gingerbread houses", date: "2026-11-22", time: "", who: "family", emoji: "🏠" };
  ok("its day went by → overdue", T.tdDue(T.line("xmas", "g1", "todo", tdRel)) === "2026-11-19" && T.tdState(T.line("xmas", "g1", "todo", tdRel)) === "late");
  // a dated one
  W.snCancel(); W.snLine("todo", "g1", ""); W.snSet("t", "Print the pattern"); W.snSet("due", "2026-11-20"); W.snSave();
  tdDate = ID(o.last(), /todo\/([^\/]+)$/)[0];
  const r2 = o.last().val["seasons/ideas/xmas/g1/todo/" + tdDate];
  ok("a dated to-do stores {t, who:'mom', due}", r2.due === "2026-11-20" && r2.who === "mom" && r2.before === undefined && T.tdState(T.line("xmas", "g1", "todo", tdDate)) === "due", r2);
  // whole season: no "before"
  W.snCancel(); W.snViewSet("todo"); W.snLine("todo", "", "");
  ok("a whole-season to-do has no 'days before' box", !/days before its day/.test(o.root.innerHTML));
  W.snSet("t", "Mail the cards"); W.snSet("before", "5"); W.snSet("due", "2026-12-01"); W.snLineWho("ava"); W.snSave();
  const p3 = paths(o.last())[0], r3 = o.last().val[p3];
  ok("it is ONE record under seasons/extra/<sid>/todo, with its owner kept for the later slice", /^seasons\/extra\/xmas\/todo\/[^\/]+$/.test(p3) && r3.who === "ava" && r3.due === "2026-12-01" && r3.before === undefined, r3);
  // change: before → a date
  o.writes.length = 0; W.snLine("todo", "g1", tdRel); W.snSet("before", ""); W.snSet("due", "2026-12-05"); W.snSave();
  const P = paths(o.last()).sort();
  ok("changing 'days before' to a date writes just those two fields", P.join() === ["seasons/ideas/xmas/g1/todo/" + tdRel + "/before", "seasons/ideas/xmas/g1/todo/" + tdRel + "/due"].join() && o.last().val[P[0]] === null && o.last().val[P[1]] === "2026-12-05", o.last().val);
  o.writes.length = 0; W.snLine("todo", "g1", tdRel); W.snSet("due", ""); W.snSet("before", "3"); W.snSave();
  // the To-dos view order
  T.data().extra.xmas.todo.tLate = { t: "Order the tree", who: "mom", due: "2026-11-15" };
  T.data().extra.xmas.todo.tDone = { t: "Pick a date", who: "mom", due: "2026-11-10", done: "2026-11-11" };
  T.data().extra.xmas.todo.tNone = { t: "Someday thing", who: "mom" };
  delete o.cal().events.ev2; W.snViewSet("todo");
  const h = o.root.innerHTML, a = h.indexOf(">Overdue<"), b = h.indexOf(">Today<"), c = h.indexOf(">Coming up<"), d = h.indexOf(">No day yet<"), e = h.indexOf(">Done<");
  ok("the To-dos view: Overdue, Today, Coming up, No day yet, Done — in that order", a > 0 && b > a && c > b && d > c && e > d && h.indexOf("Order the tree") > a && h.indexOf("Order the tree") < b && h.indexOf("Mail the cards") > c && h.indexOf("Someday thing") > d && h.indexOf("Pick a date") > e, [a, b, c, d, e]);
  ok("the chip says how many are open and overdue", /✅ To-dos<small>5 open · 1 overdue<\/small>/.test(h), (h.match(/✅ To-dos<small>[^<]*/) || [""])[0]);
  ok("each row names who and what it is for", /Buy the candy<small>Dad · 3 days before — no day yet · 🏠 Gingerbread houses<\/small>/.test(h) && /Mail the cards<small>Ava · [^<]*all of Christmas 2026<\/small>/.test(h), (h.match(/Buy the candy<small>[^<]*/) || [""])[0]);
}

console.log("\n# ✅ tick, and → My list today");
{
  o.writes.length = 0; W.snTodoTick("xmas", "g1", tdDate);
  ok("a tick = ONE field, stamped with the day", o.writes.length === 1 && paths(o.last()).join() === "seasons/ideas/xmas/g1/todo/" + tdDate + "/done" && o.last().val[paths(o.last())[0]] === "2026-11-20" && T.tdState(T.line("xmas", "g1", "todo", tdDate)) === "done");
  W.snTodoTick("xmas", "g1", tdDate);
  ok("un-tick clears it", o.last().val[paths(o.last())[0]] === null && T.tdState(T.line("xmas", "g1", "todo", tdDate)) === "due");
  o.writes.length = 0; W.snTodoMine("xmas", "g1", tdDate);
  const w = o.last(), mp = "momday/2026-11-20/todos/sn" + tdDate, rec = w.val[mp];
  ok("→ My list today = ONE update: the copy on Mom's list + the day on the to-do", o.writes.length === 1 && w.op === "update" && w.path === "" && paths(w).sort().join() === [mp, "seasons/ideas/xmas/g1/todo/" + tdDate + "/list"].sort().join(), paths(w));
  ok("the copy is Mom's own kind of to-do {text, done:false, ts} + src and the back-link", rec.text === "Print the pattern (🏠 Gingerbread houses)" && rec.done === false && rec.ts > 0 && rec.src === "season" && rec.sn === "xmas/g1/" + tdDate && Object.keys(rec).length === 5, rec);
  ok("Mom's list in memory has it too (it shows at once)", o.ctx.momdayData["2026-11-20"].todos["sn" + tdDate].text === rec.text && /sn/.test(o.LS.momday_data || ""));
  W.snTodoMine("xmas", "g1", tdDate);
  ok("it can't be copied twice", o.writes.length === 1 && /already on your list/.test(o.toasts[o.toasts.length - 1]));
  ok("the row says '✓ on your list' instead of the button", /Print the pattern[\s\S]{0,400}✓ on your list/.test((W.snViewSet("todo"), o.root.innerHTML)));
  o.ctx.momdayData["2026-11-20"].todos["sn" + tdDate].done = true;
  ok("ticked on Mom's list → done here too (worked out, not stored)", T.tdDone(T.line("xmas", "g1", "todo", tdDate)) === true && !T.line("xmas", "g1", "todo", tdDate).r.done);
  o.writes.length = 0; W.snTodoTick("xmas", "g1", tdDate);
  ok("un-ticking here un-ticks the copy in the SAME update", o.writes.length === 1 && o.last().val[mp + "/done"] === false && o.last().val[mp + "/doneOn"] === null && o.last().val["seasons/ideas/xmas/g1/todo/" + tdDate + "/done"] === null, o.last().val);
  W.snTodoTick("xmas", "g1", tdDate);
  ok("ticking here ticks the copy too", o.last().val[mp + "/done"] === true && o.last().val[mp + "/doneOn"] === "2026-11-20" && o.last().val["seasons/ideas/xmas/g1/todo/" + tdDate + "/done"] === "2026-11-20");
  W.snTodoTick("xmas", "g1", tdDate); delete o.ctx.momdayData["2026-11-20"].todos["sn" + tdDate]; o.writes.length = 0; W.snTodoMine("xmas", "g1", tdDate);
  ok("if she deleted the copy from her list, the button works again", o.writes.length === 1 && !!o.last().val[mp]);
}

console.log("\n# 🎟 book by");
{
  o.set(SEASON()); T.draw(); W.snOpenIdea("g1");
  ok("the idea pop-up has Book by + Booked", /🎟 Book by/.test(o.root.innerHTML) && /Booked/.test(o.root.innerHTML));
  W.snSet("bookBy", "2026-11-25"); W.snSave();
  ok("Save writes the one field", o.writes.length === 1 && paths(o.last()).join() === "seasons/ideas/xmas/g1/bookBy" && o.last().val["seasons/ideas/xmas/g1/bookBy"] === "2026-11-25");
  ok("5 days away = soon; the row shows a chip", T.bookState(T.idea("xmas", "g1")) === "soon" && /🎟 book by Nov 25/.test(o.root.innerHTML));
  o.writes.length = 0; W.snBooked("xmas", "g1");
  ok("✓ Booked = ONE field", o.writes.length === 1 && o.last().val["seasons/ideas/xmas/g1/booked"] === true && T.bookState(T.idea("xmas", "g1")) === "booked" && /🎟 booked/.test(o.root.innerHTML));
  W.snBooked("xmas", "g1"); T.data().ideas.xmas.g1.bookBy = "2026-11-18";
  ok("a date that went by = late", T.bookState(T.idea("xmas", "g1")) === "late");
  T.data().ideas.xmas.g1.bookBy = "2026-12-20";
  ok("far off = later (not in NOW yet)", T.bookState(T.idea("xmas", "g1")) === "later" && T.nowItems().length === 0);
  o.writes.length = 0; W.snOpenIdea("g1"); W.snSet("bookBy", ""); W.snSave();
  ok("clearing the date clears it", o.last().val["seasons/ideas/xmas/g1/bookBy"] === null);
}

console.log("\n# 🤫 a surprise keeps its name to itself");
{
  const SECRETWORD = "Elf visit", TODOWORD = "Hide the costume";
  o.set(SEASON(), { xmas: { s1: { t: SECRETWORD, by: "mom", ts: 9, hide: "none", on: { o1: { d: "2026-11-21" } } } } }); T.draw();
  W.snLine("sup", "s1", ""); W.snSet("name", "striped socks"); W.snSave();
  const sp = paths(o.last())[0], sid = sp.split("/").pop();
  ok("a surprise's supply is saved inside seasonSecret/ with it — never under seasons/", /^seasonSecret\/xmas\/s1\/sup\/[^\/]+$/.test(sp) && JSON.stringify(T.data()).indexOf("striped socks") < 0);
  W.snSupList("xmas", "s1", sid);
  ok("its Shopping List label is the season only — not the idea's name", o.grCalls.length === 1 && o.grCalls[0].src.lbl === "🎄 Christmas 2026" && JSON.stringify(o.grCalls[0]).indexOf(SECRETWORD) < 0 && JSON.stringify(o.ctx.grData).indexOf(SECRETWORD) < 0, o.grCalls[0]);
  ok("the pop-up tells her what the list will and won't say", (W.snOpenIdea("s1"), /never this idea’s name/.test(o.root.innerHTML)));
  W.snCancel(); W.snLine("todo", "s1", ""); W.snSet("t", TODOWORD); W.snSet("before", "1"); W.snSave();
  const tp = paths(o.last())[0], tid = tp.split("/").pop();
  ok("its to-do is saved inside seasonSecret/ too", /^seasonSecret\/xmas\/s1\/todo\/[^\/]+$/.test(tp) && JSON.stringify(T.data()).indexOf(TODOWORD) < 0);
  ok("a 🤐 idea's own date drives 'days before' (1 before Nov 21 = today)", T.tdDue(T.line("xmas", "s1", "todo", tid)) === "2026-11-20");
  const N = W.seasonNowLines();
  ok("🔴 NOW only COUNTS it: no name, no to-do words, no tick button", N.n === 1 && /🤫 1 surprise thing needs you/.test(N.html) && N.html.indexOf(SECRETWORD) < 0 && N.html.indexOf(TODOWORD) < 0 && !/snTodoTick/.test(N.html) && /snNowOpen\('xmas'\)/.test(N.html), N.html);
  o.writes.length = 0; W.snTodoMine("xmas", "s1", tid);
  const rec = o.last().val["momday/2026-11-20/todos/sn" + tid];
  ok("its copy on Mom's list says only 'A surprise to-do'", !!rec && /A surprise to-do/.test(rec.text) && rec.text.indexOf(SECRETWORD) < 0 && rec.text.indexOf(TODOWORD) < 0 && rec.sn === "xmas/s1/" + tid, rec);
  ok("nothing of the surprise is anywhere outside seasonSecret/", JSON.stringify(T.data()).indexOf(SECRETWORD) < 0 && JSON.stringify(o.ctx.momdayData).indexOf(SECRETWORD) < 0 && JSON.stringify(o.ctx.momdayData).indexOf(TODOWORD) < 0 && JSON.stringify(o.cal()).indexOf(SECRETWORD) < 0);
  // an open idea that BECOMES a surprise after its supplies went to the list
  o.set(SEASON()); T.draw(); W.snLine("sup", "g1", ""); W.snSet("name", "kits"); W.snSave(); const u = ID(o.last(), /sup\/([^\/]+)$/)[0];
  W.snLine("todo", "g1", ""); W.snSet("t", "Bake the walls"); W.snSave(); W.snOpenIdea("g1"); W.snSet("bookBy", "2026-12-01"); W.snSave();
  W.snSupList("xmas", "g1", u);
  ok("(open idea: the row names the idea)", Object.keys(o.ctx.grData.items).length === 1 && /Gingerbread houses/.test(o.ctx.grData.items[Object.keys(o.ctx.grData.items)[0]].src[0].lbl));
  const gid = Object.keys(o.ctx.grData.items)[0];
  o.writes.length = 0; W.snOpenIdea("g1"); W.snHide("none"); W.snSave();
  const mv = o.last().val["seasonSecret/xmas/g1"];
  ok("flipping to 🤐 moves the WHOLE record — supplies, to-dos and book-by go with it", !!mv && mv.sup[u].name === "kits" && mv.sup[u].gr === gid && Object.keys(mv.todo).length === 1 && mv.bookBy === "2026-12-01" && o.last().val["seasons/ideas/xmas/g1"] === null, mv);
  ok("and the row already on the Shopping List loses the idea's name (the Kitchen's own grPut)", o.grPuts.length === 1 && o.grPuts[0].id === gid && o.grPuts[0].it.src[0].lbl === "🎄 Christmas 2026" && JSON.stringify(o.ctx.grData).indexOf("Gingerbread houses") < 0, o.grPuts);
  o.writes.length = 0; W.snLine("sup", "g1", ""); W.snSet("name", "more candy"); W.snSave();
  ok("lines added afterwards go to seasonSecret/", /^seasonSecret\/xmas\/g1\/sup\//.test(paths(o.last())[0]));
  o.grPuts.length = 0; W.snOpenIdea("g1"); W.snHide(""); W.snSet("t", "Gingerbread village"); W.snSave();
  ok("back to 'everyone can see it' (and renamed) → the row is labelled with the new name", o.grPuts.length === 1 && o.grPuts[0].it.src[0].lbl === "🎄 Christmas 2026 · Gingerbread village");
  o.grPuts.length = 0; o.ctx.grData.items[gid].ref = { lr: "other" }; W.snOpenIdea("g1"); W.snSet("t", "Renamed again"); W.snSave();
  ok("a row that is not this idea's own (linked with 'the same one') is never re-labelled", o.grPuts.length === 0);
}

console.log("\n# SEASONRELABEL: renaming the SEASON re-labels rows already on the Shopping List");
{
  o.set(SEASON()); T.draw();
  W.snLine("sup", "g1", ""); W.snSet("name", "kits"); W.snSave(); const a = ID(o.last(), /sup\/([^\/]+)$/)[0];
  W.snViewSet("sup"); W.snLine("sup", "", ""); W.snSet("name", "wrapping paper"); W.snSave(); const b = ID(o.last(), /sup\/([^\/]+)$/)[0];
  W.snLine("sup", "g1", ""); W.snSet("name", "frosting"); W.snSave();   // never sent to the list
  W.snSupList("xmas", "g1", a); W.snSupList("xmas", "", b);
  const G = o.ctx.grData.items, ids = Object.keys(G), ga = ids.find(i => G[i].name === "kits"), gb = ids.find(i => G[i].name === "wrapping paper");
  ok("(before: an idea's row names season + idea; a whole-season row names the season)", ids.length === 2 && G[ga].src[0].lbl === "🎄 Christmas 2026 · Gingerbread houses" && G[gb].src[0].lbl === "🎄 Christmas 2026", ids.map(i => G[i].src[0].lbl));
  G[ga].done = true; G[ga].stores = ["s1"];   // what the Kitchen has since put on the row must ride along untouched
  o.grPuts.length = 0; o.writes.length = 0; W.snEditSeason(); W.snSet("name", "Our Christmas"); W.snSave();
  ok("the season's own save is still one field", o.writes.length === 1 && paths(o.last()).join() === "seasons/list/xmas/name", o.writes.map(w => paths(w)));
  ok("both rows follow the new name — the idea's row keeps its idea", o.grPuts.length === 2 && G[ga].src[0].lbl === "🎄 Our Christmas · Gingerbread houses" && G[gb].src[0].lbl === "🎄 Our Christmas", o.grPuts.map(x => x.it.src[0].lbl));
  ok("everything else on the row is kept (ticked, store, name, back-link)", G[ga].done === true && G[ga].stores.join() === "s1" && G[ga].name === "kits" && G[ga].ref.sn === "xmas/g1/" + a && G[gb].ref.sn === "xmas/-/" + b);
  o.grPuts.length = 0; W.snEditSeason(); W.snSet("emoji", "🎅"); W.snSave();
  ok("a new emoji re-labels too", o.grPuts.length === 2 && G[gb].src[0].lbl === "🎅 Our Christmas");
  o.grPuts.length = 0; W.snEditSeason(); W.snSet("end", "2026-12-31"); W.snSave();
  ok("a save that changes neither name nor emoji touches no row", o.grPuts.length === 0);
  o.grPuts.length = 0; W.snEditSeason(); W.snSet("name", "Our Christmas"); W.snSave();
  ok("saving the same name again touches no row", o.grPuts.length === 0);
  // a 🤫 idea's row carries the season only — before and after
  W.snOpenIdea("g1"); W.snHide("none"); W.snSave(); o.grPuts.length = 0;
  W.snEditSeason(); W.snSet("name", "Christmas"); W.snSave();
  ok("a 🤫 idea's row gets the new season name and still never the idea", o.grPuts.length === 2 && G[ga].src[0].lbl === "🎅 Christmas" && JSON.stringify(o.ctx.grData).indexOf("Gingerbread houses") < 0, o.grPuts.map(x => x.it.src[0].lbl));
  // a row that is not this line's own (linked with "It's the same one") is left alone
  G[gb].ref = { lr: "other" }; o.grPuts.length = 0; W.snEditSeason(); W.snSet("name", "Yule"); W.snSave();
  ok("a row linked with 'the same one' is never re-labelled", o.grPuts.length === 1 && o.grPuts[0].id === ga && G[gb].src[0].lbl === "🎅 Christmas", o.grPuts.map(x => x.id));
  // dry run: nothing
  o.dry = true; o.grPuts.length = 0; o.writes.length = 0; W.snEditSeason(); W.snSet("name", "Dry"); W.snSave();
  ok("?dryrun=1 → no Shopping List row is touched", o.grPuts.length === 0);
  o.dry = false;
}

console.log("\n# 🔴 NOW on Home Base");
{
  o.set(SEASON(), {}, { ev2: { title: "Gingerbread houses", date: "2026-11-22", time: "", who: "family", emoji: "🏠" } });
  const D = T.data(); D.ideas.xmas.g1.ev = { ev2: true };
  D.ideas.xmas.g1.todo = { tA: { t: "Buy the candy", who: "dad", before: 3 }, tB: { t: "Far off", who: "mom", due: "2026-12-20" }, tC: { t: "Already done", who: "mom", due: "2026-11-01", done: "2026-11-02" } };
  D.ideas.xmas.m1.bookBy = "2026-11-24";
  D.extra = { xmas: { todo: { tD: { t: "Mail the cards", who: "mom", due: "2026-11-20" } } } };
  D.ideas.xmas.z1 = { t: "Parked", by: "mom", ts: 7, skip: true, bookBy: "2026-11-21", todo: { tZ: { t: "parked to-do", due: "2026-11-01" } } };
  D.list.old = { name: "Last year", emoji: "📜", kind: "holiday", closed: true, ts: 0 }; D.extra.old = { todo: { tO: { t: "old to-do", due: "2025-12-01" } } };
  o.ctx.tab = "moms-plan"; o.ctx.mpSubView = "plan";
  o.mom = false;
  ok("not Mom → nothing", W.seasonNowLines().n === 0 && W.seasonNowLines().html === "");
  o.mom = true; o.kioskD = true;
  ok("Dad's TV → nothing", W.seasonNowLines().n === 0);
  o.kioskD = false;
  const N = W.seasonNowLines(), h = N.html;
  ok("Mom → the overdue to-do, today's to-do and the close book-by date — and only those", N.n === 3 && /Buy the candy/.test(h) && /Mail the cards/.test(h) && /🎟 Book Movie night/.test(h) && !/Far off/.test(h) && !/Already done/.test(h), h.replace(/<[^>]+>/g, "|"));
  ok("not for a 🌙 idea, not for a 📜 past season", !/parked/i.test(h) && !/old to-do/.test(h));
  ok("soonest first; overdue says so; someone else's to-do names them", h.indexOf("Buy the candy") < h.indexOf("Mail the cards") && /Dad · overdue · Thu Nov 19/.test(h) && /· today/.test(h) && /by Tue Nov 24/.test(h), h.replace(/<[^>]+>/g, "|"));
  ok("each to-do has ✓ Done and → My list; the book-by has ✓ Booked", (h.match(/snTodoTick\(/g) || []).length === 2 && (h.match(/snTodoMine\(/g) || []).length === 2 && /snBooked\('xmas','m1'\)/.test(h));
  ok("under its own small heading, like the gift reminders", /🎉 Seasons &amp; Events<\/div>/.test(h));
  const r0 = o.repaints; o.writes.length = 0; W.snTodoTick("xmas", "", "tD");
  ok("a tick on Home Base writes the one field and repaints Home Base (not the season page)", o.writes.length === 1 && paths(o.last()).join() === "seasons/extra/xmas/todo/tD/done" && o.repaints === r0 + 1 && W.seasonNowLines().n === 2);
  W.snTodoMine("xmas", "g1", "tA");
  ok("→ My list moves it off NOW (it is on her list now)", W.seasonNowLines().n === 1 && !/Buy the candy/.test(W.seasonNowLines().html) && !!o.ctx.momdayData["2026-11-20"].todos.sntA);
  W.snBooked("xmas", "m1");
  ok("✓ Booked clears the last one → nothing left", W.seasonNowLines().n === 0 && T.idea("xmas", "m1").booked === true);
  // many → capped
  for (let i = 0; i < 8; i++) D.extra.xmas.todo["tM" + i] = { t: "Thing " + i, who: "mom", due: "2026-11-1" + i };
  const M = W.seasonNowLines();
  ok("more than five → five lines and '+3 more' with Open", M.n === 8 && (M.html.match(/snTodoTick\(/g) || []).length === 5 && /\+3 more/.test(M.html) && /snNowOpen\('xmas'\)/.test(M.html));
  W.snNowOpen("xmas");
  ok("Open › goes to Seasons & Events, on the To-dos view", o.gotos.join() === "seasons" && T.view() === "todo" && T.curSid() === "xmas");
  o.ctx.mpSubView = "seasons";
}

console.log("\n# 🔴 NOW loads the data only for Mom, and repaints Home Base once");
{
  const p = world(); p.ctx.mpSubView = "plan";
  p.mom = false; p.W.seasonNowLines();
  ok("no Mom → no listener", p.listens.length === 0);
  p.mom = true; const a = p.W.seasonNowLines();
  ok("Mom on Home Base → listeners on seasons and seasonSecret only; nothing to show until the data is in", a.n === 0 && p.listens.slice().sort().join() === "seasonJobs,seasonSecret,seasons", p.listens);   // + seasonJobs: SEASONJOBS step B
  p.W.seasonNowLines();
  ok("asking again adds no listener", p.listens.length === 3);
  p.fire.seasons({ list: { s: { name: "S", ts: 1 } }, extra: { s: { todo: { t1: { t: "Due thing", who: "mom", due: "2026-11-19" } } } } });
  ok("half the data → no repaint yet", p.repaints === 0);
  p.fire.seasonSecret(null);
  ok("all in → Home Base is repainted ONCE, and the line is there", p.repaints === 1 && p.W.seasonNowLines().n === 1 && /Due thing/.test(p.W.seasonNowLines().html));
  p.fire.seasons({ list: { s: { name: "S", ts: 1 } } });
  ok("later changes never repaint Home Base on their own", p.repaints === 1);
  ok("and nothing was written", p.writes.length === 0);
}

console.log("\n# the idea rows, deleting, and a whole session inside the guard");
{
  o.set(SEASON()); const D = T.data();
  D.ideas.xmas.g1.sup = { u1: { name: "kits" }, u2: { name: "frosting", have: true } }; D.ideas.xmas.g1.todo = { t1: { t: "x", who: "mom", due: "2026-11-19" }, t2: { t: "y", who: "mom", done: "2026-11-19" } }; D.ideas.xmas.g1.bookBy = "2026-11-30";
  D.extra = { xmas: { sup: { u9: { name: "tape" } } } };
  T.draw();
  ok("an idea's row shows what it still needs", /🧺 1 to get/.test(o.root.innerHTML) && /✅ 1 to do/.test(o.root.innerHTML) && /🎟 book by Nov 30/.test(o.root.innerHTML));
  ok("the three view chips are there", /💡 Ideas/.test(o.root.innerHTML) && /snViewSet\('sup'\)/.test(o.root.innerHTML) && /snViewSet\('todo'\)/.test(o.root.innerHTML));
  // delete a season with no ideas but whole-season lines
  D.list.empty = { name: "Empty", ts: 5 }; D.extra.empty = { todo: { t: { t: "z" } } };
  W.snPick("empty"); W.snEditSeason(); W.snDelSeason(); o.writes.length = 0; W.snDelSeason();
  ok("deleting an empty season takes its whole-season lines with it, in ONE update", o.writes.length === 1 && paths(o.last()).sort().join() === "seasons/extra/empty,seasons/list/empty" && !T.data().extra.empty);
  // everything this slice can write
  o.set(SEASON()); T.draw(); const before = o.writes.length;
  W.snLine("sup", "g1", ""); W.snSet("name", "a, 2 b"); W.snSave(); const s = ID(o.last(), /sup\/([^\/]+)$/);
  W.snSupHave("xmas", "g1", s[0]); W.snSupList("xmas", "g1", s[1]); W.snSupAll("xmas", "g1");
  W.snLine("todo", "g1", ""); W.snSet("t", "T"); W.snSet("before", "2"); W.snSave(); const t = ID(o.last(), /todo\/([^\/]+)$/)[0];
  W.snTodoMine("xmas", "g1", t); W.snTodoTick("xmas", "g1", t); W.snTodoTick("xmas", "g1", t);
  W.snLine("todo", "", ""); W.snSet("t", "Whole"); W.snSet("due", "2026-12-01"); W.snSave(); W.snLine("sup", "", ""); W.snSet("name", "paper"); W.snSave();
  W.snOpenIdea("g1"); W.snSet("bookBy", "2026-12-01"); W.snSet("booked", true); W.snSave(); W.snBooked("xmas", "g1");
  W.snOpenIdea("g1"); W.snHide("hint"); W.snSave(); W.snLine("todo", "g1", t); W.snLineDel(); W.snLineDel();
  ok("a whole session: every write is a root multi-path update inside the guard", o.writes.length > before + 8 && o.writes.every(w => w.op === "update" && w.path === "" && paths(w).every(p => T.OK.test(p))), o.writes.filter(w => !(w.op === "update" && w.path === "")).length);
  ok("no update ever holds a path and its own parent", o.writes.every(w => { const P = paths(w); return P.every(a => P.every(b => a === b || b.indexOf(a + "/") !== 0)); }));
  o.dry = true; o.writes.length = 0; W.snLine("sup", "", ""); W.snSet("name", "dry"); W.snSave(); W.snLine("todo", "", ""); W.snSet("t", "dry"); W.snSave();
  ok("?dryrun=1 → no writes at all", o.writes.length === 0);
  o.dry = false;
}

console.log("\n# seasons.js itself");
{
  const code = SRC.replace(/^\s*\/\/.*$/gm, "");
  ok("still only three listeners (seasonJobs: SEASONJOBS step B), the once-read of Dad's list, and ONE update door", (code.match(/db\.ref\(/g) || []).length === 5 && /db\.ref\("dadday"\)\.once\(/.test(code));
  ok("the Kitchen is only reached through its own grCreate / grPut — this file never writes kitchen/ itself", !/["'`]kitchen\//.test(code) && (code.match(/grCreate\(/g) || []).length === 1 && (code.match(/grPut\(/g) || []).length === 1);
  ok("the only path it builds on Mom's day is todos/sn<id>", (code.match(/"momday\//g) || []).length === 2 && (code.match(/"momday\/"\+[A-Za-z.]+\+"\/todos\/sn"/g) || []).length === 2 && !/dadday\/(?!"\+)/.test(code));   // SEASONJOBS step A: Dad's day only through the sn-record rule (test_seasons_4.js)
  ok("no family's names, no Santa, no 🔀", !/lincoln|ellis|\blucy\b|julian|howe|dewalt|burris|polar|disney|santa/i.test(SRC) && SRC.indexOf("\u{1F500}") < 0);
  ok("it never names the calendar nodes that change school, or the school's own data", !/calendar\/(holidays|vacations|kidOverrides|coops|coopMomDays|cleaningDays)|config\/rules|familyBlocks|curriculum\/|\/tasks|\/checked/.test(code));
  ok("no confirm()/alert()/prompt() pop-ups", !/\b(confirm|alert|prompt)\(/.test(code));
}

console.log("\n# index.html: only the thin hook");
{
  const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const a = src.indexOf("// SEASONS_START"), b = src.indexOf("// SEASONS_END"), BLOCK = src.slice(a, b);
  ok("seasonNowHTML lives in the SEASONS block: Mom only, never Dad's TV, and it only asks seasons.js", /function seasonNowHTML\(\)\{\n  if\(!\(typeof momHere==="function"&&momHere\(\)\)\|\|\(typeof _kioskD==="function"&&_kioskD\(\)\)\) return \{n:0,html:""\};\n  if\(typeof window\.seasonNowLines!=="function"\)\{ seasonsLoad\(\); return \{n:0,html:""\}; \}\n  return window\.seasonNowLines\(\)\|\|\{n:0,html:""\};\n\}/.test(BLOCK));
  ok("the NOW list asks for it right after the gift reminders, guarded", /_gf\.html; \} \}catch\(e\)\{\}[^\n]*\n  try\{ if\(typeof seasonNowHTML==="function"\)\{ const _sn=seasonNowHTML\(\); nowN\+=_sn\.n; h\+=_sn\.html; \} \}catch\(e\)\{\}[^\n]*\n  if\(!nowN\)/.test(src));
  ok("it is asked for in exactly one place", (src.match(/seasonNowHTML\(\)/g) || []).length === 2);   // the function itself + the one guarded call
  ok("the block still writes nothing and reads no season data itself", !/\.set\(|\.update\(|\.remove\(|db\.ref/.test(BLOCK) && !/db\.ref\(["'`]season/.test(src));
  ok("when seasons.js arrives for Home Base, Home Base is drawn again", /s\.onload=\(\)=>\{ if\(tab==="moms-plan"&&\(mpSubView==="seasons"\|\|\(typeof giftHomeBase==="function"&&giftHomeBase\(\)\)\)\) renderAll\(\); \};/.test(BLOCK));
  // run the hook
  let momOn = false, kiosk = false, loads = 0; const win = {};
  const F = new Function("momHere", "_kioskD", "window", "seasonsLoad", BLOCK.slice(BLOCK.indexOf("function seasonNowHTML")) + "\nreturn seasonNowHTML;")(() => momOn, () => kiosk, win, () => { loads++; });
  ok("no Mom → nothing, and seasons.js is NOT fetched", F().n === 0 && loads === 0);
  momOn = true; kiosk = true;
  ok("Dad's TV → nothing, not fetched", F().n === 0 && loads === 0);
  kiosk = false;
  ok("Mom → seasons.js is asked for; nothing to show yet", F().n === 0 && loads === 1);
  win.seasonNowLines = () => ({ n: 2, html: "<x>" });
  ok("once it is in, its lines are passed straight through", F().n === 2 && F().html === "<x>");
  const grow = Buffer.byteLength(BLOCK, "utf8");
  ok("the whole SEASONS block stays small (under 6 KB) — the page budget is tight", grow < 6144, grow);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
