/*
 * Node tests for 🎉 Seasons & Events — slice 1 (2026-11-20): seasons.js + its wiring in index.html (Mom's Day ▸ 🗓 Schedule).
 *   · secrecy: nothing loads without Mom; Mom → listeners on seasons/ and seasonSecret/ only, once
 *   · a new season = ONE update of ONE record seasons/list/<id>; edits write only the fields that changed
 *   · an idea = ONE record seasons/ideas/<sid>/<iid>; who wants it; THREE ⭐ per person per season (her answer 2026-11-20)
 *   · 📅 Schedule = ONE update: the calendar's own event record (exactly its six fields) + the idea's link to it
 *   · the calendar is the one truth: move the event → the idea follows; delete it → "not scheduled yet"
 *   · ↪ Move changes the SAME event; ✕ take off; ✓ did it; 🌙 not this year (also off the calendar)
 *   · 🤫 Surprise: ✨ hint → the record moves to seasonSecret/ and the calendar says only "A surprise";
 *                  🤐 no hint → nothing on the calendar at all, the date lives in seasonSecret/ only
 *   · the real words of a surprise never appear under seasons/ or calendar/
 *   · no write ever leaves seasons/, seasonSecret/ and calendar/events/<id> (school can't be touched); dry-run = no writes
 *   · counts, open days, Everyone's picks are worked out, never stored
 *   · index.html: the pill on the Schedule page, the route, the lazy loader behind momHere, nothing read at app start
 *
 *   run:  node test_seasons.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }

function el(id) { return { id, innerHTML: "", value: "", style: {}, focus() {}, appendChild() {} }; }
const nodes = {}; const root = el("content");
const document = { getElementById(id) { return nodes[id] || (nodes[id] = el(id)); }, createElement(t) { return el(t); }, head: { appendChild() {} } };
const writes = [], listens = [];
let dryRun = false, mom = true;
const db = { ref(p) { const P = p === undefined ? "" : p; return {
  set(v) { writes.push({ op: "set", path: P, val: JSON.parse(JSON.stringify(v)) }); },
  update(v) { writes.push({ op: "update", path: P, val: JSON.parse(JSON.stringify(v)) }); },
  remove() { writes.push({ op: "remove", path: P }); }, push(v) { writes.push({ op: "push", path: P, val: v }); },
  on(ev, fn) { listens.push(P); } }; } };
const LS = {};
const ctx = { console: { log: console.log, warn() {} }, Date, Math, JSON, document, db, _todayStr: () => "2026-11-20", _dryRun: () => dryRun, momHere: () => mom, gwShowToast() {},
  HA_LS: { getItem: k => (k in LS ? LS[k] : null), setItem: (k, v) => { LS[k] = String(v); } }, tab: "moms-plan", mpSubView: "seasons" };
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext("const ROSTER_DEF=[{id:'ava',name:'Ava',color:'#2563eb'},{id:'ben',name:'Ben',color:'#16a34a'},{id:'cora',name:'Cora',color:'#db2777'}]; var calendarData={events:{}};"
  + "function calBreaksOn(iso){ return (iso>='2026-12-21'&&iso<='2027-01-02')?[{kind:'holiday',name:'Winter break'}]:[]; } function coopsOnDate(iso){ return iso==='2026-11-24'?[{name:'Co-op'}]:[]; }", ctx);
const SRC = fs.readFileSync(path.join(__dirname, "seasons.js"), "utf8");
vm.runInContext(SRC, ctx);
const T = ctx._snTest, W = ctx;
const cal = () => vm.runInContext("calendarData", ctx);
const reset = (d, s, ev) => { writes.length = 0; T.setData(d || {}, s || {}); T.reset(); cal().events = ev || {}; for (const k in LS) delete LS[k]; T.setRoot(root, "<nav/>"); };
const last = () => writes[writes.length - 1];
const paths = w => Object.keys(w.val);
const type = (id, v) => { document.getElementById(id).value = v; };

console.log("\n# secrecy: nothing loads without Mom");
{
  mom = false; const r = el("x"); ctx.renderSeasons(r, "<nav/>");
  ok("no Mom → 'Mom only', no listener at all", /Mom only/.test(r.innerHTML) && listens.length === 0, listens);
  mom = true; ctx.renderSeasons(r, "<nav/>");
  ok("Mom → listeners on seasons and seasonSecret, and only there", listens.length === 2 && listens.slice().sort().join() === "seasonSecret,seasons", listens);
  ctx.renderSeasons(r, "<nav/>");
  ok("re-opening never adds another listener", listens.length === 2);
}

console.log("\n# a new season");
{
  reset(); T.draw();
  ok("nothing yet → the start card with the kinds, and nothing written", /bucket list that gets onto the calendar/i.test(root.innerHTML) && /Holiday season/.test(root.innerHTML) && writes.length === 0);
  const k = T.kindDefaults("holiday");
  ok("holiday in November suggests Christmas 2026, today → Dec 31 (a suggestion she can change)", k.name === "Christmas 2026" && k.start === "2026-11-20" && k.end === "2026-12-31", k);
  ok("summer suggests next summer's dates", T.kindDefaults("summer").name === "Summer 2027 bucket list" && T.kindDefaults("summer").start === "2027-06-01");
  W.snNewSeason("holiday");
  ok("opening the pop-up writes nothing", writes.length === 0 && T.edit().type === "season");
  W.snSave();
  ok("Save = ONE update of ONE record: seasons/list/christmas-2026", writes.length === 1 && last().op === "update" && last().path === "" && paths(last()).join() === "seasons/list/christmas-2026", writes.map(w => paths(w)));
  const r = last().val["seasons/list/christmas-2026"];
  ok("the record: name, emoji, kind, start, end, ts — nothing else", r.name === "Christmas 2026" && r.emoji === "🎄" && r.kind === "holiday" && r.start === "2026-11-20" && r.end === "2026-12-31" && r.ts > 0 && Object.keys(r).length === 6, r);
  ok("the page now shows it, with the add box", /Christmas 2026/.test(root.innerHTML) && /id="sn-new"/.test(root.innerHTML) && /Nothing on the list yet/.test(root.innerHTML));
  writes.length = 0; W.snNewSeason(); W.snSet("name", ""); W.snSave();
  ok("a season needs a name", writes.length === 0 && /name first/.test(root.innerHTML));
  W.snSet("name", "Christmas 2026"); W.snSave();
  ok("a second one with the same name gets its own id", paths(last()).join() === "seasons/list/christmas-2026-2");
  writes.length = 0; W.snNewSeason(); W.snSet("name", "Trip"); W.snSet("start", "2027-01-25"); W.snSet("end", "2027-01-16"); W.snSave();
  ok("ends before it starts → not saved", writes.length === 0 && /ends before it starts/.test(root.innerHTML));
}

const SEASON = () => ({ list: { xmas: { name: "Christmas 2026", emoji: "🎄", kind: "holiday", start: "2026-11-20", end: "2026-12-31", ts: 1 } }, ideas: { xmas: {} } });
const addIdea = (t, who) => { T.reset(); T.draw(); (who || []).forEach(w => W.snForToggle(w)); type("sn-new", t); W.snQuickAdd(); const p = paths(last())[0]; return p.split("/").pop(); };

console.log("\n# ideas + who wants them");
let gid;
{
  reset(SEASON()); T.draw();
  W.snForToggle("cora"); W.snForToggle("ben"); type("sn-new", "  Gingerbread houses  "); W.snQuickAdd();
  ok("＋ Add = ONE update of ONE record under seasons/ideas/xmas/", writes.length === 1 && paths(last()).length === 1 && /^seasons\/ideas\/xmas\/i[a-z0-9]+$/.test(paths(last())[0]), paths(last()));
  const p = paths(last())[0], r = last().val[p]; gid = p.split("/").pop();
  ok("the record: trimmed words, by mom, who wants it", r.t === "Gingerbread houses" && r.by === "mom" && r.want.cora === true && r.want.ben === true && !r.want.ava && r.ts > 0, r);
  ok("it shows as 'not scheduled yet' with a 📅 Schedule button and both names", /not scheduled yet/.test(root.innerHTML) && /snSched\(/.test(root.innerHTML) && />Cora</.test(root.innerHTML) && />Ben</.test(root.innerHTML));
  writes.length = 0; type("sn-new", "   "); W.snQuickAdd();
  ok("an empty box adds nothing", writes.length === 0);
}

console.log("\n# three ⭐ per person per season");
{
  const D = SEASON(); ["a", "b", "c", "d"].forEach((k, i) => { D.ideas.xmas[k] = { t: "Idea " + k, by: "mom", ts: i + 1, want: { cora: true } }; });
  ["a", "b", "c"].forEach(k => { D.ideas.xmas[k].star = { cora: true }; });
  reset(D); T.draw();
  ok("default is 3 (her answer)", T.starMax(T.season("xmas")) === 3 && T.starsUsed("xmas", "cora") === 3);
  W.snOpenIdea("d"); W.snStar("cora");
  ok("a 4th ⭐ is refused with a plain line", !T.edit().form.star.cora && /used all 3 ⭐/.test(root.innerHTML));
  W.snStar("ben");
  ok("no ⭐ without wanting it first", !T.edit().form.star.ben);
  W.snWant("ben"); W.snStar("ben"); W.snWant("family"); W.snStar("family"); W.snSave();
  const v = last().val;
  ok("Save writes only what changed: want + star (two fields of that idea)", paths(last()).sort().join() === "seasons/ideas/xmas/d/star,seasons/ideas/xmas/d/want", paths(last()));
  ok("Everyone can want it but has no ⭐", v["seasons/ideas/xmas/d/want"].family === true && v["seasons/ideas/xmas/d/star"].ben === true && !v["seasons/ideas/xmas/d/star"].family);
  W.snOpenIdea("d"); W.snWant("ben"); W.snSave();
  ok("un-wanting takes the ⭐ off too", last().val["seasons/ideas/xmas/d/star"] === null && !last().val["seasons/ideas/xmas/d/want"].ben, last().val);
}

console.log("\n# 📅 Schedule → the family calendar");
let evId;
{
  const D = SEASON(); D.ideas.xmas.g = { t: "Gingerbread houses", emoji: "🍪", by: "mom", ts: 1, want: { cora: true } };
  reset(D, {}, { ev_x: { title: "Train show", date: "2026-12-05", time: "2:30 PM", who: "family", emoji: "🚂" } }); T.draw();
  W.snSched("g");
  ok("the sheet opens and writes nothing", writes.length === 0 && T.edit().type === "sched");
  ok("it lists the days with what's already on each", /Sat Dec 5/.test(root.innerHTML) && /🚂 Train show 2:30 PM/.test(root.innerHTML) && /nothing on/.test(root.innerHTML) && /🏫 Co-op/.test(root.innerHTML) && /Winter break/.test(root.innerHTML));
  const R = T.schedRange(T.season("xmas"), 0);
  ok("the days run from today to the season's end", R.from === "2026-11-20" && R.to === "2026-12-31", R);
  W.snDaysOpen(true);
  ok("'Open days only' hides the busy ones", !/Train show/.test(root.innerHTML) && !/Co-op/.test(root.innerHTML) && /Sun Dec 6/.test(root.innerHTML));
  W.snSet("time", "2:00 PM"); W.snPickDay("2026-12-12");
  const P = paths(last()).sort();
  ok("a tap on a day = ONE update of TWO paths: the event + the idea's link", writes.length === 1 && P.length === 2 && /^calendar\/events\/ev_20261212_[a-z0-9]{5}$/.test(P[0]) && P[1] === "seasons/ideas/xmas/g/ev/" + P[0].split("/").pop(), P);
  evId = P[0].split("/").pop(); const e = last().val[P[0]];
  ok("the event is the calendar's own record — exactly its six fields", JSON.stringify(Object.keys(e).sort()) === JSON.stringify(["addedBy", "date", "emoji", "time", "title", "who"]) && e.title === "Gingerbread houses" && e.date === "2026-12-12" && e.time === "2:00 PM" && e.who === "family" && e.emoji === "🍪" && e.addedBy === "mom", e);
  ok("the date is NOT stored on the idea (only the link)", last().val[P[1]] === true && !("on" in T.idea("xmas", "g")) && !("date" in T.idea("xmas", "g")));
  ok("the idea now says 📅 Sat Dec 12 · 2:00 PM", T.state(T.idea("xmas", "g")) === "sched" && /📅 Sat Dec 12 · 2:00 PM/.test(root.innerHTML) && !/not scheduled yet<\/span>/.test(root.innerHTML));
  ok("the family calendar (this device's copy) has it at once", cal().events[evId] && cal().events[evId].date === "2026-12-12");

  console.log("\n# the calendar is the one truth");
  cal().events[evId].date = "2026-12-14"; cal().events[evId].time = "6:00 PM"; T.draw();
  ok("the event moved in the calendar → the idea follows", /📅 Mon Dec 14 · 6:00 PM/.test(root.innerHTML));
  const keep = cal().events[evId]; delete cal().events[evId]; T.draw();
  ok("the event deleted in the calendar → 'not scheduled yet' again", T.state(T.idea("xmas", "g")) === "todo" && /not scheduled yet/.test(root.innerHTML));
  cal().events[evId] = keep; keep.date = "2026-12-12"; keep.time = "2:00 PM";

  console.log("\n# move · take off · did it · not this year");
  writes.length = 0; W.snSched("g", evId);
  ok("↪ Move opens the sheet on that day", T.edit().move === evId && T.edit().form.time === "2:00 PM" && /Now on Sat Dec 12/.test(root.innerHTML));
  W.snPickDay("2026-12-13");
  ok("Move = the SAME event gets the new date (date · time · who only)", writes.length === 1 && paths(last()).sort().join() === ["date", "time", "who"].map(f => "calendar/events/" + evId + "/" + f).join(), paths(last()));
  ok("…and the idea shows the new day", /📅 Sun Dec 13/.test(root.innerHTML) && cal().events[evId].title === "Gingerbread houses");
  writes.length = 0; W.snSched("g"); W.snPickDay("2026-12-20");
  ok("＋ another day adds a second event", T.whens(T.idea("xmas", "g")).length === 2 && /\+1 more/.test(root.innerHTML));
  const second = T.whens(T.idea("xmas", "g"))[1].id;
  writes.length = 0; W.snUnsched("g", second);
  ok("✕ Take off = that event removed + its link, one update", writes.length === 1 && paths(last()).sort().join() === ["calendar/events/" + second, "seasons/ideas/xmas/g/ev/" + second].join() && last().val["calendar/events/" + second] === null && !cal().events[second]);
  writes.length = 0; W.snDid("g");
  ok("✓ did it = ONE field, stamped today when its day is still ahead", writes.length === 1 && paths(last()).join() === "seasons/ideas/xmas/g/did" && last().val["seasons/ideas/xmas/g/did"] === "2026-11-20" && T.state(T.idea("xmas", "g")) === "done");
  W.snUndid("g");
  ok("↩ not done after all clears it", last().val["seasons/ideas/xmas/g/did"] === null && T.state(T.idea("xmas", "g")) === "sched");
  writes.length = 0; W.snSkip("g");
  ok("🌙 Not this year = skip + its day comes off the calendar, one update", writes.length === 1 && last().val["seasons/ideas/xmas/g/skip"] === true && last().val["calendar/events/" + evId] === null && !cal().events[evId] && T.state(T.idea("xmas", "g")) === "skip");
  W.snUnskip("g");
  ok("↩ Bring back → not scheduled yet", T.state(T.idea("xmas", "g")) === "todo");
}

console.log("\n# a day that went by");
{
  const D = SEASON(); D.ideas.xmas.p = { t: "See the lights", by: "mom", ts: 1, ev: { ev_p: true } };
  reset(D, {}, { ev_p: { title: "See the lights", date: "2026-11-18", time: "", who: "family", emoji: "🎉" } }); T.draw();
  ok("its day passed, not marked → 'did it happen?' with ✓ Yes · ↪ Move · 🌙", T.state(T.idea("xmas", "p")) === "past" && /was Wed Nov 18 — did it happen\?/.test(root.innerHTML) && /✓ Yes/.test(root.innerHTML));
  W.snDid("p");
  ok("✓ Yes stamps the day it was on, not today", last().val["seasons/ideas/xmas/p/did"] === "2026-11-18");
}

console.log("\n# editing an idea that's on the calendar");
{
  const D = SEASON(); D.ideas.xmas.g = { t: "Gingerbread houses", emoji: "🍪", by: "mom", ts: 1, ev: { ev_g: true } };
  reset(D, {}, { ev_g: { title: "Gingerbread houses", date: "2026-12-12", time: "2:00 PM", who: "family", emoji: "🍪" } }); T.draw();
  W.snOpenIdea("g"); W.snSet("t", "Gingerbread village"); W.snSet("note", "Buy 4 kits"); W.snSize("home"); W.snSave();
  ok("new words → the idea's fields + the event's title and emoji, one update", writes.length === 1 && paths(last()).sort().join() === ["calendar/events/ev_g/emoji", "calendar/events/ev_g/title", "seasons/ideas/xmas/g/note", "seasons/ideas/xmas/g/size", "seasons/ideas/xmas/g/t"].join(), paths(last()));
  ok("the calendar now says the new words; date untouched", cal().events.ev_g.title === "Gingerbread village" && cal().events.ev_g.date === "2026-12-12");
  writes.length = 0; W.snOpenIdea("g"); W.snSave();
  ok("Save with nothing changed writes nothing", writes.length === 0);
  W.snOpenIdea("g"); W.snDelIdea();
  ok("Delete asks for a second tap", writes.length === 0 && /Tap again to delete/.test(root.innerHTML));
  W.snDelIdea();
  ok("…then removes the idea and its event in one update", writes.length === 1 && last().val["seasons/ideas/xmas/g"] === null && last().val["calendar/events/ev_g"] === null && !T.idea("xmas", "g"));
}

console.log("\n# 🤫 Surprise — ✨ hint");
{
  const D = SEASON(); D.ideas.xmas.s = { t: "Sleigh ride tickets", emoji: "🛷", by: "mom", ts: 1, want: { mom: true }, ev: { ev_s: true } };
  reset(D, {}, { ev_s: { title: "Sleigh ride tickets", date: "2026-12-19", time: "5:00 PM", who: "family", emoji: "🛷" } }); T.draw();
  W.snOpenIdea("s"); W.snHide("hint"); W.snSave();
  const v = last().val;
  ok("one update: the record MOVES to seasonSecret/ and leaves seasons/ideas", writes.length === 1 && v["seasons/ideas/xmas/s"] === null && v["seasonSecret/xmas/s"] && v["seasonSecret/xmas/s"].hide === "hint" && v["seasonSecret/xmas/s"].t === "Sleigh ride tickets", paths(last()));
  ok("the calendar event now says only ✨ A surprise (same event, same day)", v["calendar/events/ev_s/title"] === "A surprise" && v["calendar/events/ev_s/emoji"] === "✨" && cal().events.ev_s.title === "A surprise" && cal().events.ev_s.date === "2026-12-19");
  ok("the real words are nowhere under seasons/ or calendar/", !/Sleigh/.test(JSON.stringify(T.data())) && !/Sleigh/.test(JSON.stringify(cal())) && !("s" in (T.data().ideas.xmas || {})));
  ok("Mom still sees it, with its day and what the calendar says", /Sleigh ride tickets/.test(root.innerHTML) && /Sat Dec 19/.test(root.innerHTML) && /calendar says ✨ A surprise/.test(root.innerHTML) && T.state(T.idea("xmas", "s")) === "sched");
  writes.length = 0; W.snOpenIdea("s"); W.snSet("t", "Sleigh ride at the farm"); W.snSave();
  ok("renaming a hint never touches the calendar", writes.length === 1 && paths(last()).join() === "seasonSecret/xmas/s/t" && cal().events.ev_s.title === "A surprise");
  writes.length = 0; W.snSched("s"); W.snPickDay("2026-12-22");
  const np = paths(last()).find(p => /^calendar\/events\//.test(p));
  ok("scheduling a hint writes an event that says only A surprise", last().val[np].title === "A surprise" && last().val[np].emoji === "✨" && !/Sleigh/.test(JSON.stringify(last().val)) && paths(last()).some(p => /^seasonSecret\/xmas\/s\/ev\//.test(p)));
  W.snSched("s"); T.draw();
  ok("on Mom's day list the hint shows its real words beside it", /✨ A surprise \(Sleigh ride at the farm\)/.test(root.innerHTML));
  W.snCancel();
}

console.log("\n# 🤫 Surprise — 🤐 no hint");
{
  const D = SEASON(); D.ideas.xmas.n = { t: "Puppy comes home", by: "mom", ts: 1, ev: { ev_n: true } };
  reset(D, {}, { ev_n: { title: "Puppy comes home", date: "2026-12-24", time: "9:00 AM", who: "family", emoji: "🎉" } }); T.draw();
  W.snOpenIdea("n"); W.snHide("none"); W.snSave();
  const v = last().val, rec = v["seasonSecret/xmas/n"];
  ok("one update: the event is REMOVED and the record moves to seasonSecret/", writes.length === 1 && v["calendar/events/ev_n"] === null && v["seasons/ideas/xmas/n"] === null && rec.hide === "none" && !rec.ev, paths(last()));
  const on = Object.values(rec.on || {});
  ok("its day is kept with the secret record (date + time)", on.length === 1 && on[0].d === "2026-12-24" && on[0].time === "9:00 AM", rec.on);
  ok("nothing about it is left on the calendar or under seasons/", !cal().events.ev_n && !/Puppy/.test(JSON.stringify(cal())) && !/Puppy/.test(JSON.stringify(T.data())));
  ok("Mom still sees the day: 🤐 Thu Dec 24 · not on the calendar", T.state(T.idea("xmas", "n")) === "sched" && /🤐 Thu Dec 24 · 9:00 AM · not on the calendar/.test(root.innerHTML));
  ok("that day is not 'open' for her, though the calendar is empty", T.dayInfo("2026-12-24").open === false && T.dayInfo("2026-12-24").secret[0].t === "Puppy comes home");
  writes.length = 0; W.snSched("n"); W.snPickDay("2026-12-23");
  ok("scheduling a 🤐 writes ONE path under seasonSecret/ and nothing on the calendar", writes.length === 1 && paths(last()).length === 1 && /^seasonSecret\/xmas\/n\/on\/o[a-z0-9]+$/.test(paths(last())[0]) && Object.keys(cal().events).length === 0, paths(last()));
  const first = T.whens(T.idea("xmas", "n"))[0];
  writes.length = 0; W.snSched("n", first.id); W.snPickDay("2026-12-22");
  ok("moving a 🤐 rewrites that one date, still off the calendar", writes.length === 1 && paths(last()).join() === "seasonSecret/xmas/n/on/" + first.id && last().val[paths(last())[0]].d === "2026-12-22" && Object.keys(cal().events).length === 0);
  writes.length = 0; W.snOpenIdea("n"); W.snHide(""); W.snSave();
  const back = last().val, evs = paths(last()).filter(p => /^calendar\/events\/ev_/.test(p));
  ok("back to 'everyone can see': real events are made and the record moves back", back["seasonSecret/xmas/n"] === null && back["seasons/ideas/xmas/n"] && !back["seasons/ideas/xmas/n"].hide && !back["seasons/ideas/xmas/n"].on && evs.length === 2 && evs.every(p => back[p].title === "Puppy comes home"), paths(last()));
  writes.length = 0; W.snOpenIdea("n"); W.snHide("hint"); W.snSave(); W.snOpenIdea("n"); W.snHide("none"); W.snSave();
  ok("hint → no hint stays in seasonSecret/ (one record path) and clears the calendar", paths(last()).filter(p => /^seasonSecret\//.test(p)).join() === "seasonSecret/xmas/n" && !paths(last()).some(p => /^seasons\//.test(p)) && Object.keys(cal().events).length === 0);
}

console.log("\n# the meter + Everyone's picks (worked out, never stored)");
{
  const D = SEASON();
  D.ideas.xmas = { a: { t: "A", by: "mom", ts: 1, want: { ava: true, ben: true }, star: { ben: true }, ev: { e1: true } }, b: { t: "B", by: "mom", ts: 2, want: { ava: true } },
    c: { t: "C", by: "mom", ts: 3, want: { cora: true }, star: { cora: true } }, d: { t: "D", by: "mom", ts: 4, want: { family: true }, did: "2026-11-19" }, e: { t: "E", by: "mom", ts: 5, want: { ben: true }, skip: true } };
  reset(D, { xmas: { z: { t: "Z", hide: "none", by: "mom", ts: 6, on: { o1: { d: "2026-12-01" } } } } }, { e1: { title: "A", date: "2026-12-12", time: "", who: "family", emoji: "🎉" } }); T.draw();
  const c = T.counts("xmas");
  ok("counts: 6 ideas · 2 scheduled · 2 not yet · 1 done · 1 🌙", c.n === 6 && c.sched === 2 && c.todo === 2 && c.done === 1 && c.skip === 1, c);
  const P = T.picks("xmas"), by = id => P.find(x => x.id === id);
  ok("Ava 1 of 2 · Ben 1 of 2 with his ⭐ on the calendar", by("ava").got === 1 && by("ava").n === 2 && !by("ava").warn && by("ben").got === 1 && by("ben").n === 2 && by("ben").stMiss === 0 && !by("ben").warn, P);
  ok("Cora 0 of 1 ⚠ — her ⭐ has no day", by("cora").got === 0 && by("cora").warn === true && by("cora").stMiss === 1);
  ok("'Everyone' wishes count for no one person; people with no wishes aren't listed", !by("mom") && !by("dad") && !by("family"));
  // Nov 20 → Dec 31 = 42 days; busy: Nov 24 (co-op), Dec 1 (🤐), Dec 12 (event) → 39 open
  ok("open days left = days to the end with nothing on (events, co-ops, 🤐 dates)", T.openDays(T.season("xmas")) === 39, T.openDays(T.season("xmas")));
  ok("no end date → no open-days line", T.openDays({ start: "2026-11-20" }) === null);
  ok("the header says it in plain words", /<b>6<\/b> ideas/.test(root.innerHTML) && /39 open days left before Dec 31/.test(root.innerHTML) && /Cora 0 of 1 ⭐ ⚠/.test(root.innerHTML) && /Ben 1 of 2 ⭐✓/.test(root.innerHTML));
  ok("none of it is written", writes.length === 0);
  W.snFilterSet("todo");
  ok("'Not scheduled yet' shows only those", />B</.test(root.innerHTML) && />C</.test(root.innerHTML) && !/<b>A<\/b>/.test(root.innerHTML) && !/<b>Z<\/b>/.test(root.innerHTML));
}

console.log("\n# a day's events read in clock order");
{
  reset(SEASON(), {}, { e1: { title: "Show", date: "2026-11-27", time: "2:30 PM", who: "family", emoji: "🎭" }, e2: { title: "Dentist", date: "2026-11-27", time: "9:00 AM", who: "ben", emoji: "🦷" }, e3: { title: "Lunch", date: "2026-11-27", time: "12:15 PM", who: "family", emoji: "🥪" } });
  ok("9:00 AM · 12:15 PM · 2:30 PM (the calendar's time is free text)", T.dayInfo("2026-11-27").events.map(e => e.title).join() === "Dentist,Lunch,Show" && T.mins("12:05 AM") === 5 && T.mins("14:30") === 870 && T.mins("after lunch") === 9999);
  ok("a day with two or more things says so, and never blocks the tap", (() => { const D = SEASON(); D.ideas.xmas.q = { t: "Q", by: "mom", ts: 1 }; T.setData(D, {}); T.draw(); W.snSched("q"); const has = /already 3 things/.test(root.innerHTML); W.snPickDay("2026-11-27"); return has && T.state(T.idea("xmas", "q")) === "sched"; })());
}

console.log("\n# editing / closing / deleting a season");
{
  const D = SEASON(); D.ideas.xmas.a = { t: "A", by: "mom", ts: 1 }; D.list.empty = { name: "Empty", emoji: "🎉", kind: "season", ts: 2 };
  reset(D); T.draw();
  W.snEditSeason(); W.snSet("end", "2027-01-01"); W.snSave();
  ok("an edit writes only the field that changed", writes.length === 1 && paths(last()).join() === "seasons/list/xmas/end" && last().val["seasons/list/xmas/end"] === "2027-01-01");
  W.snEditSeason();
  ok("a season with ideas has no Delete button", !/snDelSeason/.test(root.innerHTML));
  W.snSet("closed", true); W.snSave();
  ok("Done → closed, one field; it moves under 📜 Past and the add box goes", last().val["seasons/list/xmas/closed"] === true && /📜 Past 1/.test(root.innerHTML));
  W.snPick("empty"); W.snEditSeason(); writes.length = 0; W.snDelSeason();
  ok("an empty one: Delete asks twice", writes.length === 0 && /Tap again to delete/.test(root.innerHTML));
  W.snDelSeason();
  ok("…then ONE path removed", writes.length === 1 && paths(last()).join() === "seasons/list/empty" && last().val["seasons/list/empty"] === null);
}

console.log("\n# nothing can leave its own nodes; dry-run writes nothing");
{
  reset(SEASON());
  const bad = ["calendar/holidays/x", "calendar/vacations/x", "calendar/coops/x", "calendar/kidOverrides/ava/2026-12-01", "calendar/events", "config/rules/familyBlocks/x", "week32/tasks/t1", "curriculum/lessons/ava", "gifts/items/x", "seasons", "seasons/list", "seasonSecret/xmas"];
  ok("apply() refuses every path outside seasons/…/<id>, seasonSecret/<sid>/<iid>, calendar/events/<id>", bad.every(p => { const o = {}; o[p] = { x: 1 }; return T.apply(o) === false; }) && writes.length === 0, writes);
  const mixed = { "seasons/list/y": { name: "Y" }, "calendar/holidays/x": { name: "bad" } };
  ok("one bad path refuses the whole update (nothing half-written)", T.apply(mixed) === false && writes.length === 0 && !T.data().list.y);
  ok("the guard allows exactly the three kinds of path", T.OK.test("seasons/list/a") && T.OK.test("seasons/ideas/a/b/ev/c") && T.OK.test("seasonSecret/a/b/on/c") && T.OK.test("calendar/events/ev_1/title"));
  // every write this file can make, across a full session, stays inside
  const all = [];
  reset(SEASON()); T.draw(); const before = writes.length;
  type("sn-new", "One"); W.snQuickAdd(); const id = paths(last())[0].split("/").pop();
  W.snSched(id); W.snPickDay("2026-12-02"); W.snOpenIdea(id); W.snHide("hint"); W.snSave(); W.snOpenIdea(id); W.snHide("none"); W.snSave(); W.snOpenIdea(id); W.snHide(""); W.snSave();
  W.snDid(id); W.snUndid(id); W.snSkip(id); W.snUnskip(id); W.snOpenIdea(id); W.snDelIdea(); W.snDelIdea();
  writes.forEach(w => { all.push(w.op + ":" + w.path); paths(w).forEach(p => all.push(p)); });
  ok("a whole session: every write is a root multi-path update, every path inside the three", writes.length > before && writes.every(w => w.op === "update" && w.path === "" && paths(w).every(p => T.OK.test(p))), all.filter(p => !/^update:$/.test(p) && !T.OK.test(p)));
  ok("no update ever holds a path and its own parent (the database would refuse it)", writes.every(w => { const P = paths(w); return P.every(a => P.every(b => a === b || b.indexOf(a + "/") !== 0)); }));
  dryRun = true; writes.length = 0; type("sn-new", "Dry"); W.snQuickAdd(); W.snNewSeason("trip"); W.snSet("name", "Dry trip"); W.snSave();
  ok("?dryrun=1 → no writes at all", writes.length === 0);
  dryRun = false;
}

console.log("\n# seasons.js itself");
{
  ok("no family's names, places or shows in the file", !/lincoln|ellis|\blucy\b|julian|howe|dewalt|burris|polar|disney/i.test(SRC));
  ok("it never says Santa (a kid may see the screen)", !/santa/i.test(SRC));
  ok("no 🔀 emoji", SRC.indexOf("\u{1F500}") < 0);
  ok("it never names the calendar nodes that change school, or the school's own data", !/calendar\/(holidays|vacations|kidOverrides|coops|coopMomDays|cleaningDays)|config\/rules|familyBlocks|curriculum\/|\/tasks|\/checked/.test(SRC.replace(/^\/\/.*$/gm, "")));
  ok("its only database calls: two listeners and ONE update door", (SRC.replace(/^\/\/.*$/gm, "").match(/db\.ref\(/g) || []).length === 3 && /db\.ref\("seasons"\)\.on\(/.test(SRC) && /db\.ref\("seasonSecret"\)\.on\(/.test(SRC) && /if\(live\(\)\)db\.ref\(\)\.update\(up\);/.test(SRC));
  ok("it never reads the gift list", !/gifts\//.test(SRC.replace(/^\/\/.*$/gm, "")) && !/db\.ref\("gifts/.test(SRC));
}

console.log("\n# index.html wiring");
{
  const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const a = src.indexOf("// SEASONS_START"), b = src.indexOf("// SEASONS_END"), BLOCK = src.slice(a, b);
  ok("one SEASONS block", a > 0 && b > a && src.indexOf("// SEASONS_START", a + 1) < 0);
  ok("route: mpSubView 'seasons' → renderMPSeasons, inside renderMomsPlanView after the Mom gate", /if\(mpSubView==='seasons'\)\{ return renderMPSeasons\(el\); \}/.test(src) && src.indexOf("if(mpSubView==='seasons')") > src.indexOf("function renderMomsPlanView") && src.indexOf("if(mpSubView==='seasons')") > src.indexOf("if(!momGateOpen())", src.indexOf("function renderMomsPlanView")));
  ok("the page draws the Mom's Day banner + the menu row with 🗓 Schedule lit", /mwBanner\('[^']{1,50}'\)\+mpSubnav\('cal'\)\+mpSeasonsBar\(\)/.test(BLOCK));
  ok("Mom only: no Mom → 'Mom only' before anything loads", /if\(!\(typeof momHere==="function"&&momHere\(\)\)\)\{ el\.innerHTML=top\+'[^']*Mom only\.<\/div>'; return; \}\n  if\(window\.renderSeasons\)/.test(BLOCK));
  ok("seasons.js is loaded lazily by ONE loader, called only from the page and (slice 2) Home Base's 🔴 NOW hook — both behind momHere", /function seasonsLoad\(onErr\)/.test(BLOCK) && /"seasons\.js\?v="\+Date\.now\(\)/.test(BLOCK) && (src.match(/seasonsLoad\(/g) || []).length === 3 && (BLOCK.match(/seasonsLoad\(/g) || []).length === 3 && !/<script[^>]*seasons\.js/.test(src));
  ok("index.html itself never reads seasons/ or seasonSecret/ (nothing at app start, nothing on a kid's device)", !/db\.ref\(["'`]season/.test(src) && !/["'`]seasons\//.test(src) && !/seasonSecret/.test(src.replace(BLOCK, "").replace(/^\s*\/\/.*$/gm, "")));
  ok("the pill is under Today · Week · Month on both Schedule rows, guarded", (src.match(/typeof mpSeasonsPill==="function"/g) || []).length === 2 && /function msvBarHTML\(\)\{[\s\S]*?mpSeasonsPill\(false,'0 12px 8px'\)/.test(src) && /function mpSchBody\(\)\{[\s\S]*?h\+=mpSeasonsPill\(false\);/.test(src));
  ok("the pill says 🎉 Seasons & Events and opens the page", /mpGoto\(\\'seasons\\'\)/.test(BLOCK) && /\\u\{1F389\} Seasons &amp; Events/.test(BLOCK));
  ok("'seasons' is not a Today view (SS_OTHER_VIEWS)", (() => { const l = JSON.parse(src.match(/const SS_OTHER_VIEWS=(\[[^\]]*\])/)[1]); return l.indexOf("seasons") >= 0 && l[l.length - 1] === "gifts"; })());
  ok("the block writes nothing and touches no calendar or scheduler code", !/\.set\(|\.update\(|\.remove\(|db\.ref/.test(BLOCK) && !/relayWeek|_rlwAfterCalendar|calSave/.test(BLOCK));
  // run the block: the pill, the bar, the Mom door, the loader
  const made = []; let momOn = false, got = null; const E = { innerHTML: "" };
  const env = { mwBanner: s => "<ban>" + s + "</ban>", mpSubnav: v => "<nav>" + v + "</nav>", momHere: () => momOn, tab: "moms-plan", mpSubView: "seasons", renderAll() {}, location: { hostname: "x.github.io" },
    document: { createElement: t => { const s = { tag: t }; made.push(s); return s; }, head: { appendChild() {} } }, window: {}, renderSeasons: (el, top) => { got = top; } };
  const fnNames = ["mpSeasonsPill", "mpSeasonsBar", "renderMPSeasons", "seasonsLoad"];
  const F = new Function(...Object.keys(env), BLOCK.replace(/^\/\/ SEASONS_START[^\n]*\n/, "") + "\nreturn {" + fnNames.join(",") + "};")(...Object.values(env));
  ok("the pill: unlit on the Schedule pages, lit on its own page", /background:#fff/.test(F.mpSeasonsPill(false)) && /background:#2B7A78;color:#fff/.test(F.mpSeasonsPill(true)) && /mpSchSet\('today'\)/.test(F.mpSeasonsBar()) && /mpSchSet\('month'\)/.test(F.mpSeasonsBar()));
  F.renderMPSeasons(E);
  ok("no Mom → 'Mom only' and NO script is fetched", /Mom only/.test(E.innerHTML) && made.length === 0);
  momOn = true; F.renderMPSeasons(E);
  ok("Mom → 'Opening…' and seasons.js is fetched once (cache-busted on the live site)", /Opening Seasons/.test(E.innerHTML) && made.length === 1 && /^seasons\.js\?v=\d+$/.test(made[0].src));
  F.renderMPSeasons(E);
  ok("a second draw while it loads fetches nothing more", made.length === 1);
  env.window.renderSeasons = env.renderSeasons;
  F.renderMPSeasons(E);
  ok("once loaded the page is handed the banner + menu + chips to draw under", /<ban>/.test(got) && /<nav>cal<\/nav>/.test(got) && /mp-seasons-pill/.test(got));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
