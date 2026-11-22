/*
 * Node tests for 🎉 Seasons & Events — SEASONREPEAT slice 7 (her "Repeating nights" 2026-11-22; her words 11/21: "multiple options
 * even pick the days and add them as well"): ONE idea on several days, from its 📅 Schedule pop-up.
 *   · One day (exactly as before) · Every week (the next 2–12 of one weekday) · Pick days (tap up to 20, then add them all at once)
 *   · each day = its OWN ordinary calendar/events/<id> record (the same one a single tap makes), linked in the idea's ev:{};
 *     🤐 = its own date in on:{}; ✨ = "A surprise" on every day. ONE update. Nothing new stored; no calendar code changes.
 *   · a day it is already on is skipped, never doubled; a day gone by can't be added; caps 2–12 weeks, 20 picked
 *   · the pop-up still shows what is already on each day
 *   · ✕ one day · ✕ Take all N days off · delete / 🌙 takes every day off
 *   · "its day" = the next one still to come (today counts), else the last — row, kids' countdown, sort; its to-dos count back from
 *     its FIRST day, so a to-do happens once and a missed one stays late (Dad's list, a kid's jobs and 🔴 NOW follow)
 *   · an idea with ONE day behaves exactly as before
 *
 *   run:  node test_seasons_6.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
const MSRC = fs.readFileSync(path.join(__dirname, process.env.SN_SRC || "seasons.js"), "utf8");
const KSRC = fs.readFileSync(path.join(__dirname, process.env.SK_SRC || "seasonkid.js"), "utf8");

function momWorld() {
  const el = id => ({ id, innerHTML: "", value: "", style: {}, focus() {}, appendChild() {} });
  const nodes = {}, root = el("root");
  const o = { writes: [], timers: [], toasts: [], dry: false, mom: true, LS: {}, root, listens: [], today: "2026-11-20" };   // a Friday
  const document = { getElementById(id) { return nodes[id] || (nodes[id] = el(id)); }, createElement(t) { return el(t); }, head: { appendChild() {} } };
  const db = { ref(p) { const P = p === undefined ? "" : p; return {
    update(v) { o.writes.push({ op: "update", path: P, val: JSON.parse(JSON.stringify(v)) }); }, set(v) { o.writes.push({ op: "set", path: P, val: v }); }, remove() { o.writes.push({ op: "remove", path: P }); },
    on(ev, fn) { o.listens.push(P); }, once() {} }; } };
  const ctx = { console: { log: console.log, warn() {} }, Date, Math, JSON, document, db, _todayStr: () => o.today, _dryRun: () => o.dry, momHere: () => o.mom, _kioskD: () => false,
    gwShowToast: m => o.toasts.push(m), HA_LS: { getItem: k => (k in o.LS ? o.LS[k] : null), setItem: (k, v) => { o.LS[k] = String(v); } },
    tab: "moms-plan", mpSubView: "seasons", momSchedView: false, renderMomsPlan() {}, mpGoto() {},
    grData: { items: {} }, momdayData: {}, setTimeout: fn => { o.timers.push(fn); return o.timers.length; },
    bankDirect: () => "bd1", bankDirectRemove() {}, cuUnpay: () => false, choreVerifyOn: () => false };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext("const ROSTER_DEF=[{id:'ava',name:'Ava',color:'#2563eb'},{id:'ben',name:'Ben',color:'#16a34a'}]; var calendarData={events:{}}; var daddayData={};", ctx);
  vm.runInContext(MSRC, ctx);
  o.W = ctx; o.T = ctx._snTest; o.cal = () => vm.runInContext("calendarData", ctx);
  o.set = (d, sec, ev, today) => { o.timers.splice(0); o.today = today || "2026-11-20"; o.writes.length = 0; o.toasts.length = 0; const cp = x => JSON.parse(JSON.stringify(x || {}));   // apply() mirrors writes into what it was given: hand it copies
    o.T.setData(cp(d), cp(sec)); o.T.reset(); o.cal().events = cp(ev);
    o.T.setJobs({}); o.T.setRoot(root, ""); o.T.ddFresh(true); };
  o.last = () => o.writes[o.writes.length - 1];
  o.html = () => root.innerHTML;
  return o;
}
const SEASON = (ideas) => ({ list: { xmas: { name: "Christmas 2026", emoji: "🎄", kind: "holiday", start: "2026-11-20", end: "2026-12-31", ts: 1 } }, ideas: { xmas: ideas } });
const IDEAS = () => ({
  g1: { t: "Gingerbread houses", emoji: "🏠", by: "mom", ts: 2, ev: { e1: true } },   // already on Sat Dec 5
  m1: { t: "Movie night", emoji: "🎬", by: "mom", ts: 3 } });                         // no day yet
const EV = () => ({ e1: { title: "Gingerbread houses", date: "2026-12-05", time: "", who: "family", emoji: "🏠" },
  r1: { title: "Piano recital", date: "2026-11-27", time: "6:00 PM", who: "family", emoji: "🎹" } });
const ev = (id, d, t) => ({ title: t || "Movie night", date: d, time: "", who: "family", emoji: "🎬" });
const calKeys = v => Object.keys(v).filter(p => /^calendar\/events\/[^\/]+$/.test(p)).sort((a, b) => v[a].date.localeCompare(v[b].date));

const o = momWorld(), W = o.W, T = o.T;

console.log("\n# nothing new to read or store");
{
  o.set(SEASON(IDEAS()), {}, EV());
  const code = MSRC.replace(/^\s*\/\/.*$/gm, "");
  ok("still the same database calls (no new listener, no new reader)", (code.match(/db\.ref\(/g) || []).length === 5);
  ok("the write guard is unchanged: seasons, seasonSecret, calendar events, the sn-copies, kids' jobs",
    T.OK.source === "^(seasons\\/(list|ideas|extra)\\/[^\\/]+|seasonSecret\\/[^\\/]+\\/[^\\/]+|calendar\\/events\\/[^\\/]+|(momday|dadday)\\/\\d{4}-\\d{2}-\\d{2}\\/todos\\/sn[^\\/]+|seasonJobs\\/[^\\/]+\\/[^\\/]+)(\\/|$)", T.OK.source);
  ok("no new kind of record: a repeat is only more ev links (no 'repeat'/'rrule'/'every' field is written)", !/["'](repeat|rrule|every|nights)["']\s*:/.test(code) && !/\/(repeat|rrule|nights)["']/.test(code));
  ok("no family's names in the code", !/Lincoln|Ellis|Lucy|Julian|Howe|Burris|DeWalt|Dewalt/.test(MSRC));
}

console.log("\n# One day — exactly as before");
{
  o.set(SEASON(IDEAS()), {}, EV());
  W.snSched("m1"); T.draw();
  ok("the pop-up opens on One day, with the three choices", T.edit().mode === "one" && /snMode\('one'\)/.test(o.html()) && />Every week</.test(o.html()) && />Pick days</.test(o.html()));
  ok("one day: tapping a day still puts it straight on", /onclick="snPickDay\('2026-11-21'\)"/.test(o.html()));
  W.snPickDay("2026-11-21");
  const v = o.last().val, P = Object.keys(v), ek = calKeys(v);
  ok("ONE update, two paths: the event + the idea's link (as before)", o.writes.length === 1 && P.length === 2 && ek.length === 1 && v["seasons/ideas/xmas/m1/ev/" + ek[0].split("/")[2]] === true, P);
  ok("the event is the calendar's own record", JSON.stringify(v[ek[0]]) === JSON.stringify({ title: "Movie night", date: "2026-11-21", time: "", who: "family", emoji: "🎬", addedBy: "mom" }), v[ek[0]]);
  ok("…and the pop-up closed", T.edit() === null);
  // moving is always one day
  o.set(SEASON(IDEAS()), {}, EV());
  W.snSched("g1", "e1"); T.draw();
  ok("↪ Move shows no Every week / Pick days", !/snMode\(/.test(o.html()));
  W.snMode("week");
  ok("…and can't be switched to them", T.edit().mode === "one");
  W.snPickDay("2026-12-12");
  ok("↪ Move still moves the SAME event", JSON.stringify(o.last().val) === JSON.stringify({ "calendar/events/e1/date": "2026-12-12", "calendar/events/e1/time": "", "calendar/events/e1/who": "family" }), o.last().val);
}

console.log("\n# Every week");
{
  o.set(SEASON(IDEAS()), {}, EV());
  W.snSched("m1"); W.snMode("week");
  ok("starts on today's weekday when it has no day yet (Friday), 4 weeks", T.edit().form.dow === 5 && T.edit().form.n === 4);
  const h = o.html();
  ok("lists the next 4 Fridays, from today", ["Fri Nov 20", "Fri Nov 27", "Fri Dec 4", "Fri Dec 11"].every(d => h.includes(d)) && !h.includes("Fri Dec 18"));
  ok("shows what is already on each day (the recital on Nov 27)", /Fri Nov 27[^]*?Piano recital/.test(h));
  ok("the button says how many go on", /📅 Put 4 on/.test(h));
  for (let i = 0; i < 20; i++) W.snWeeks(1);
  ok("weeks stop at 12", T.edit().form.n === 12 && /＋<\/button>/.test(o.html()) && /disabled>＋/.test(o.html()));
  for (let i = 0; i < 20; i++) W.snWeeks(-1);
  ok("…and at 2", T.edit().form.n === 2 && /disabled>−/.test(o.html()));
  W.snWeeks(1); W.snWeeks(1);
  W.snDow(3);
  ok("pick another weekday: Wednesdays from the next one", T.edit().form.dow === 3 && /Wed Nov 25/.test(o.html()) && /Wed Dec 16/.test(o.html()));
  W.snDow(9);
  ok("a weekday that isn't one is ignored", T.edit().form.dow === 3);
  W.snDow(5);
  const n = W.snPutWeeks(), v = o.last().val, ek = calKeys(v);
  ok("ONE update puts all 4 on", n === 4 && o.writes.length === 1 && ek.length === 4 && Object.keys(v).length === 8, Object.keys(v));
  ok("each is its own ordinary event, on its own Friday", ek.map(k => v[k].date).join() === "2026-11-20,2026-11-27,2026-12-04,2026-12-11" && ek.every(k => v[k].title === "Movie night" && v[k].who === "family" && v[k].addedBy === "mom" && Object.keys(v[k]).length === 6));
  ok("each linked on the idea", ek.every(k => v["seasons/ideas/xmas/m1/ev/" + k.split("/")[2]] === true));
  ok("ids all different", new Set(ek).size === 4);
  ok("pop-up closed; plain toast", T.edit() === null && o.toasts.pop() === "📅 Movie night → 4 days");
  // a time and a kid on all of them
  o.set(SEASON(IDEAS()), {}, EV());
  W.snSched("m1"); W.snSet("time", "7:00 PM"); W.snSet("who", "ben"); W.snMode("week"); W.snPutWeeks();
  const v2 = o.last().val;
  ok("the time and who go on every day", calKeys(v2).every(k => v2[k].time === "7:00 PM" && v2[k].who === "ben"));
}

console.log("\n# a day it's already on → skipped, never doubled");
{
  o.set(SEASON(IDEAS()), {}, EV());
  W.snSched("g1"); W.snMode("week");
  ok("starts on its own weekday (Saturday)", T.edit().form.dow === 6);
  const h = o.html();
  ok("Dec 5 shows 'already on — skipped'; the button says 3", /Sat Dec 5 · already on — skipped/.test(h) && /📅 Put 3 on/.test(h));
  W.snPutWeeks();
  const v = o.last().val, ek = calKeys(v);
  ok("3 new days, Dec 5 not doubled", ek.map(k => v[k].date).join() === "2026-11-21,2026-11-28,2026-12-12", ek.map(k => v[k].date));
  ok("toast says one was already on", o.toasts.pop() === "📅 Gingerbread houses → 3 days (1 already on)");
  // every day already on → nothing written, a plain message
  const E = EV(); E.a = ev("a", "2026-11-21", "Gingerbread houses"); E.b = ev("b", "2026-11-28", "Gingerbread houses");
  const I = IDEAS(); I.g1.ev = { e1: true, a: true, b: true };
  o.set(SEASON(I), {}, E);
  W.snSched("g1"); W.snMode("week"); W.snWeeks(-1); W.snWeeks(-1);   // 2 weeks: Nov 21, 28 — both on
  ok("2 weeks, both already on: the button can't be tapped", /disabled>📅 Put 0 on/.test(o.html()));
  ok("…and nothing is written", W.snPutWeeks() === 0 && o.writes.length === 0 && /already on those days/.test(o.html()));
}

console.log("\n# a day after the season ends is marked");
{
  o.set(SEASON(IDEAS()), {}, EV());
  W.snSched("m1"); W.snMode("week"); for (let i = 0; i < 4; i++) W.snWeeks(1);
  ok("8 Fridays: Jan 1 and Jan 8 say 'after the season ends'", /Fri Jan 1 · after the season ends/.test(o.html()) && /Fri Jan 8 · after the season ends/.test(o.html()) && !/Fri Dec 25 · after/.test(o.html()));
}

console.log("\n# Pick days");
{
  o.set(SEASON(IDEAS()), {}, EV());
  W.snSched("g1"); W.snMode("pick");
  let h = o.html();
  ok("days are tapped to pick them, not put on", /onclick="snPickToggle\('2026-11-21'\)"/.test(h) && !/snPickDay\(/.test(h));
  ok("the day it's already on can't be picked", /Sat Dec 5 · already on/.test(h) && !/snPickToggle\('2026-12-05'\)/.test(h));
  ok("shows what's already on each day", /Fri Nov 27[^]*?Piano recital/.test(h));
  ok("nothing picked yet: the add button can't be tapped", /disabled>📅 Add 0 days/.test(h));
  W.snPickToggle("2026-11-25"); W.snPickToggle("2026-12-01"); W.snPickToggle("2026-12-19");
  h = o.html();
  ok("3 picked: they show ✓ picked, and the list says which", /Wed Nov 25 · ✓ picked/.test(h) && /Picked: Nov 25, Dec 1, Dec 19\./.test(h) && /📅 Add 3 days/.test(h));
  W.snPickToggle("2026-12-01");
  ok("tap again un-picks", !T.edit().form.sel["2026-12-01"] && /📅 Add 2 days/.test(o.html()));
  W.snPickToggle("2026-11-19");
  ok("a day gone by can't be picked", !T.edit().form.sel["2026-11-19"] && /That day has gone by/.test(o.html()));
  W.snPickToggle("2026-12-05");
  ok("a day it's already on can't be picked", !T.edit().form.sel["2026-12-05"] && /already on that day/.test(o.html()));
  W.snSet("any", "2027-02-14"); W.snPickAny();
  ok("'Or any other day' adds to the picks (nothing written yet)", T.edit().form.sel["2027-02-14"] === true && o.writes.length === 0 && /Pick it/.test(o.html()));
  const n = W.snPutPicked(), v = o.last().val, ek = calKeys(v);
  ok("ONE update adds all 3", n === 3 && o.writes.length === 1 && ek.map(k => v[k].date).join() === "2026-11-25,2026-12-19,2027-02-14", ek.map(k => v[k].date));
  ok("each linked on the idea, nothing else written", Object.keys(v).length === 6 && ek.every(k => v["seasons/ideas/xmas/g1/ev/" + k.split("/")[2]] === true));
  // cap 20
  o.set(SEASON(IDEAS()), {}, EV());
  W.snSched("m1"); W.snMode("pick");
  const d = "2026-11-21", add = (x, n) => { const p = x.split("-"); const t = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + n, 12)); return t.toISOString().slice(0, 10); };
  for (let i = 0; i < 22; i++) W.snPickToggle(add(d, i));
  ok("at most 20 picked; the 21st gets a plain message", Object.keys(T.edit().form.sel).length === 20 && /That’s 20\. Add these first/.test(o.html()));
  ok("putNights itself never adds more than 20", T.putNights(Array.from({ length: 30 }, (_, i) => add("2027-01-01", i))) === 20 && calKeys(o.last().val).length === 20);
  o.set(SEASON(IDEAS()), {}, EV());
  W.snSched("m1"); W.snMode("pick");
  ok("putNights itself never adds a day gone by", T.putNights(["2026-11-19", "2026-11-21"]) === 1 && calKeys(o.last().val).map(k => o.last().val[k].date).join() === "2026-11-21");
  // dry run
  o.set(SEASON(IDEAS()), {}, EV()); o.dry = true;
  W.snSched("m1"); W.snMode("week"); W.snPutWeeks();
  ok("?dryrun=1: nothing is written", o.writes.length === 0);
  o.dry = false;
}

console.log("\n# 🤫 surprises: the same rule on every day");
{
  const sec = { xmas: { s1: { t: "Light show drive", emoji: "✨", by: "mom", ts: 5, hide: "hint" }, s2: { t: "Sleigh ride", by: "mom", ts: 6, hide: "none", on: { o1: { d: "2026-12-12" } } } } };
  o.set(SEASON(IDEAS()), sec, EV());
  W.snSched("s1"); W.snMode("week"); W.snPutWeeks();
  let v = o.last().val; const ek = calKeys(v);
  ok("✨ hint: every day says only 'A surprise' ✨", ek.length === 4 && ek.every(k => v[k].title === "A surprise" && v[k].emoji === "✨"));
  ok("…the real words are in no calendar record, and the links live in seasonSecret", !JSON.stringify(ek.map(k => v[k])).includes("Light show") && ek.every(k => v["seasonSecret/xmas/s1/ev/" + k.split("/")[2]] === true) && !Object.keys(v).some(p => p.startsWith("seasons/")));
  o.set(SEASON(IDEAS()), sec, EV());
  W.snSched("s2"); W.snMode("pick"); W.snPickToggle("2026-12-12"); W.snPickToggle("2026-12-19"); W.snPickToggle("2026-12-26");
  ok("🤐 no hint: its own date can't be picked twice", !T.edit().form.sel["2026-12-12"]);
  W.snPutPicked(); v = o.last().val;
  const P = Object.keys(v);
  ok("🤐 no hint: nothing reaches the calendar; each day is its own date kept here", P.length === 2 && P.every(p => /^seasonSecret\/xmas\/s2\/on\/o[a-z0-9]+$/.test(p)) && P.map(p => v[p].d).sort().join() === "2026-12-19,2026-12-26", v);
  o.set(SEASON(IDEAS()), sec, EV());
  W.snSched("s2"); W.snMode("week"); T.draw();
  ok("🤐 the pop-up says nothing goes on the family calendar", /Nothing goes on the family calendar/.test(o.html()));
}

console.log("\n# taking days off");
{
  const I = IDEAS(); I.m1.ev = { a: true, b: true, c: true };
  const E = Object.assign(EV(), { a: ev("a", "2026-11-27"), b: ev("b", "2026-12-04"), c: ev("c", "2026-12-11") });
  o.set(SEASON(I), {}, E);
  W.snOpenIdea("m1"); T.draw();
  ok("the idea pop-up lists all 3 days, each with ✕ Take off", (o.html().match(/snUnsched\('m1','[abc]'\)/g) || []).length === 3);
  ok("…and a '✕ Take all 3 days off'", /✕ Take all 3 days off/.test(o.html()));
  W.snUnsched("m1", "b");
  ok("✕ one day: only that event and its link", JSON.stringify(o.last().val) === JSON.stringify({ "calendar/events/b": null, "seasons/ideas/xmas/m1/ev/b": null }), o.last().val);
  o.set(SEASON(I), {}, E);
  W.snOpenIdea("m1"); W.snUnschedAll("m1");
  ok("take all: the first tap only asks", o.writes.length === 0 && /Tap again to take all 3 off/.test(o.html()));
  W.snUnschedAll("m1");
  const v = o.last().val;
  ok("…the second takes every day off in ONE update", ["a", "b", "c"].every(k => v["calendar/events/" + k] === null && v["seasons/ideas/xmas/m1/ev/" + k] === null) && Object.keys(v).length === 6, v);
  o.set(SEASON(I), {}, E);
  W.snOpenIdea("m1"); W.snDelIdea(); W.snDelIdea();
  const v2 = o.last().val;
  ok("deleting the idea removes every day's event", ["a", "b", "c"].every(k => v2["calendar/events/" + k] === null) && v2["seasons/ideas/xmas/m1"] === null);
  o.set(SEASON(I), {}, E);
  W.snSkip("m1");
  ok("🌙 Not this year takes every day off", ["a", "b", "c"].every(k => o.last().val["calendar/events/" + k] === null));
  o.set(SEASON(IDEAS()), {}, EV());
  W.snOpenIdea("g1"); T.draw();
  ok("one day: no 'Take all' button (as before)", !/Take all/.test(o.html()));
}

console.log("\n# what 'its day' means");
{
  const I = IDEAS(); I.m1.ev = { a: true, b: true, c: true };
  I.m1.todo = { t1: { t: "Pop the popcorn", who: "dad", before: 3 }, t2: { t: "Pick the movie", who: "ava", before: 1 }, t3: { t: "Borrow a projector", who: "mom", before: 2 } };
  const E = Object.assign(EV(), { a: ev("a", "2026-11-27"), b: ev("b", "2026-12-04"), c: ev("c", "2026-12-11") });
  const L = id => T.line("xmas", "m1", "todo", id);
  o.set(SEASON(I), {}, E, "2026-11-20");
  ok("before the first: its day = the first (Nov 27), scheduled", T.ideaDay(T.idea("xmas", "m1")) === "2026-11-27" && T.state(T.idea("xmas", "m1")) === "sched");
  T.draw();
  ok("its row: the next day, '+2 more'", /📅 Fri Nov 27 \+2 more/.test(o.html()));
  ok("to-dos count back from the first day", T.tdDue(L("t1")) === "2026-11-24" && T.tdDue(L("t3")) === "2026-11-25");
  o.set(SEASON(I), {}, E, "2026-12-05");
  ok("between: its day = the next still to come (Dec 11)", T.ideaDay(T.idea("xmas", "m1")) === "2026-12-11");
  T.draw();
  ok("its row: Dec 11, no '+more' (only one left)", /📅 Fri Dec 11</.test(o.html()) && !/Dec 11 \+/.test(o.html()));
  ok("…but its to-dos stay on the first day — a to-do happens once, it doesn't hop to the next night", T.tdDue(L("t1")) === "2026-11-24" && T.tdDue(L("t2")) === "2026-11-26");
  ok("a missed one stays late", T.tdState(L("t3")) === "late");
  const NOW = T.nowItems().filter(x => x.k === "todo");
  ok("🔴 NOW lists each to-do ONCE, overdue since the first day (not once per night)", NOW.map(x => x.L.id + "@" + x.d).join() === "t1@2026-11-24,t3@2026-11-25,t2@2026-11-26" && NOW.every(x => x.late), NOW.map(x => [x.L.id, x.d]));
  const want = T.dadPlan();
  ok("Dad's copy stays on its one show day (no copy per night)", Object.keys(want).join() === "2026-11-24/snt1", Object.keys(want));
  ok("a kid's job: one, due the day before the first", T.jobRec(L("t2")).due === "2026-11-26" && T.jobRec(L("t2")).show === "2026-11-26");
  o.set(SEASON(I), {}, E, "2026-12-12");
  ok("after the last: its day = the last (Dec 11), 'did it happen?'", T.ideaDay(T.idea("xmas", "m1")) === "2026-12-11" && T.state(T.idea("xmas", "m1")) === "past");
  // the first day is taken off → the to-dos count back from the new first
  const I2 = JSON.parse(JSON.stringify(I)); delete I2.m1.ev.a;
  o.set(SEASON(I2), {}, E, "2026-11-20");
  ok("first day taken off → to-dos count back from the new first (Dec 4)", T.tdDue(L("t1")) === "2026-12-01");
  // a new earlier day pulls them earlier
  const I3 = JSON.parse(JSON.stringify(I)); I3.m1.ev.z = true;
  o.set(SEASON(I3), {}, Object.assign({}, E, { z: ev("z", "2026-11-22") }), "2026-11-20");
  ok("a new earlier day → to-dos move earlier with it", T.tdDue(L("t1")) === "2026-11-19");
  // the to-do pop-up says so
  o.set(SEASON(I), {}, E, "2026-11-20");
  W.snLine("todo", "m1", "t1"); T.draw();
  ok("the to-do pop-up says it counts back from the first day, once", /counts back from the first one, Fri Nov 27\. The to-do happens once/.test(o.html()));
}

console.log("\n# ONE day: exactly as before");
{
  const I = IDEAS(); I.g1.todo = { t1: { t: "Buy icing", who: "dad", before: 2 } };
  ["2026-11-20", "2026-12-05", "2026-12-20"].forEach(today => {
    o.set(SEASON(I), {}, EV(), today);
    const it = T.idea("xmas", "g1");
    ok("today " + today + ": first day = its day = Dec 5, to-do due Dec 3", T.firstDay(it) === "2026-12-05" && T.ideaDay(it) === "2026-12-05" && T.tdDue(T.line("xmas", "g1", "todo", "t1")) === "2026-12-03");
  });
  o.set(SEASON(I), {}, EV());
  W.snLine("todo", "g1", "t1"); T.draw();
  ok("the to-do pop-up words are unchanged for one day", /Its day is Sat Dec 5 right now\./.test(o.html()));
  T.draw();
  ok("its row: no '+more'", !/\+\d+ more/.test(o.html()));
}

console.log("\n# the kids' page: the countdown is to the next day");
{
  const el = id => ({ id, innerHTML: "", value: "", style: {}, focus() {}, setSelectionRange() {}, appendChild() {} });
  const kctx = { console: { log() {}, warn() {} }, Date, Math, JSON, document: { getElementById: () => null, createElement: el, head: { appendChild() {} } },
    db: { ref: () => ({ on() {}, off() {}, once: () => Promise.resolve({ val: () => null }), update() {} }) }, setTimeout: () => 0, _todayStr: () => kt, _dryRun: () => false, gwShowToast() {}, kcLittle: () => false, tab: "kids" };
  let kt = "2026-11-21";
  kctx.window = kctx; vm.createContext(kctx);
  vm.runInContext("const ROSTER_DEF=[{id:'ava',name:'Ava',color:'#2563eb'}]; var calendarData={events:{}};", kctx);
  vm.runInContext(KSRC, kctx);
  vm.runInContext("calendarData", kctx).events = { a: ev("a", "2026-11-27"), b: ev("b", "2026-12-04") };
  const K = kctx._skTest, it = { id: "m1", t: "Movie night", ev: { a: true, b: true } };
  ok("before the first: counts to the first ('in 6 sleeps')", K.when(it).d === "2026-11-27" && K.sleeps(6) === "in 6 sleeps");
  kt = "2026-11-28";
  ok("after the first: counts to the next one (Dec 4)", K.when(it).d === "2026-12-04");
  ok("seasonkid.js is unchanged by this slice (still never names Mom's secret node)", !/seasonSecret/.test(KSRC));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
