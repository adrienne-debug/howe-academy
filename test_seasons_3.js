/*
 * Node tests for 🎉 Seasons & Events — slice 3 (her "Yes, kids' page" 2026-11-21): Kids' Corner ▸ ✨ Our plans (seasonkid.js),
 * Mom's "open to the kids" switch (seasons.js) and the thin SEASONKID hook in index.html.
 *   · the kids' file never names Mom's secret node, the gift list, to-dos, supplies or Mom's day — and reads nothing once-off
 *   · it listens to seasons/list, and to seasons/ideas/<sid> ONLY for a season Mom opened to the kids; all of it stops on close
 *   · a kid sees: words, picture, who wants it, a countdown in sleeps. Never a note, a supply, a to-do, a book-by date, a 🌙 idea
 *   · 🤫: a no-hint surprise shows nothing; a ✨ hint shows only the calendar's own "A surprise" event, inside the season's dates
 *   · a kid can: add an idea (straight on the list, marked theirs) · ✋ me too · THREE ⭐ per season · take off their OWN bare idea
 *   · a kid cannot: touch anyone else's mark, change or remove another idea, schedule, or write anywhere else (okPath)
 *   · the app never suggests an idea
 *   · Mom: ONE field opens a season to the kids (off by default); a kid's idea is marked "💡 <name>'s idea"
 *   · index.html: only the button, the open/close state and the loader — nothing at app start
 *
 *   run:  node test_seasons_3.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
const KSRC = fs.readFileSync(path.join(__dirname, "seasonkid.js"), "utf8");
const MSRC = fs.readFileSync(path.join(__dirname, "seasons.js"), "utf8");
const HTML = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const paths = w => Object.keys(w.val);

function kidWorld() {   // a kid's device: stubbed app globals + seasonkid.js — and NOTHING of Mom's
  const el = id => ({ id, innerHTML: "", value: "", style: {}, focus() {}, setSelectionRange() {}, appendChild() {} });
  const nodes = {}; const root = el("sk-root"); nodes["sk-root"] = root;
  const o = { writes: [], on: [], off: [], once: [], fire: {}, toasts: [], dry: false, root, little: false };
  const document = { getElementById(id) { return nodes[id] || null; }, createElement(t) { const e = el(t); return e; }, head: { appendChild(e) { if (e.id) nodes[e.id] = e; } }, activeElement: null };
  const db = { ref(p) { const P = p === undefined ? "" : p; return {
    set(v) { o.writes.push({ op: "set", path: P, val: v }); }, update(v) { o.writes.push({ op: "update", path: P, val: JSON.parse(JSON.stringify(v)) }); }, remove() { o.writes.push({ op: "remove", path: P }); },
    on(ev, fn) { o.on.push(P); o.fire[P] = v => fn({ val: () => v }); }, off() { o.off.push(P); delete o.fire[P]; },
    once() { o.once.push(P); return Promise.resolve({ val: () => null }); } }; } };
  const ctx = { console: { log: console.log, warn() {} }, Date, Math, JSON, document, db, setTimeout: () => 0, _todayStr: () => "2026-11-21", _dryRun: () => o.dry, gwShowToast: m => o.toasts.push(m),
    kcLittle: () => o.little, tab: "kids" };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext("const ROSTER_DEF=[{id:'ava',name:'Ava',color:'#2563eb'},{id:'ben',name:'Ben',color:'#16a34a'}]; var calendarData={events:{}};", ctx);
  vm.runInContext(KSRC, ctx);
  o.ctx = ctx; o.W = ctx; o.T = ctx._skTest; o.cal = () => vm.runInContext("calendarData", ctx);
  o.open = (k, list, ideas, ev) => { o.cal().events = ev || {}; o.T.setData(list || {}, ideas || {}); o.T.setFor(k); root.innerHTML = o.T.inner(k); o.writes.length = 0; o.toasts.length = 0; };
  o.html = () => root.innerHTML; o.last = () => o.writes[o.writes.length - 1];
  return o;
}
const LIST = () => ({ xmas: { name: "Winter fun", emoji: "⛄", kind: "holiday", start: "2026-11-20", end: "2026-12-31", kids: true, ts: 1 } });
const IDEAS = () => ({ xmas: {
  g1: { t: "Build a fort", emoji: "🏰", by: "mom", ts: 2, want: { ben: true }, ev: { e1: true }, note: "NOTEWORD buy tape", sup: { u1: { name: "SUPPLYWORD" } }, todo: { t1: { t: "TODOWORD", who: "mom" } }, bookBy: "2026-11-30" },
  m1: { t: "Board game night", by: "mom", ts: 3, want: { family: true } },
  b1: { t: "Sock skating", by: "ben", ts: 4, want: { ben: true }, star: { ben: true } },
  d1: { t: "Leaf pile", by: "mom", ts: 5, did: "2026-11-19" },
  z1: { t: "PARKEDWORD", by: "mom", ts: 6, skip: true } } });
const EV = () => ({ e1: { title: "Build a fort", date: "2026-11-24", time: "2:00 PM", who: "family", emoji: "🏰" } });

console.log("\n# seasonkid.js itself: what it can never reach");
{
  const code = KSRC.replace(/^\s*\/\/.*$/gm, "");
  ok("it never names Mom's secret node — not in code, not even in a comment", KSRC.indexOf("seasonSecret") < 0 && !/secret\//i.test(KSRC));
  ok("nor the gift list, the whole-season lines, Mom's or Dad's day, or the Kitchen", !/gifts|seasons\/extra|momday|dadday|kitchen|wishes/.test(code));
  ok("its database calls: the season list, ONE season's ideas, and ONE update door — nothing else", (code.match(/db\.ref\(/g) || []).length === 4 && /db\.ref\("seasonJobs\/"\+k\)/.test(code) && /db\.ref\("seasons\/list"\)/.test(code) && /db\.ref\("seasons\/ideas\/"\+sid\)/.test(code) && /if\(live\(\)\)db\.ref\(\)\.update\(up\);/.test(code));
  ok("it never does a one-time read", !/\.once\(/.test(code) && !/\.get\(\)/.test(code));
  ok("it never writes the calendar (a kid cannot schedule here)", !/["'`]calendar\//.test(code) && !/calSave|kcSaveEvent/.test(code));
  ok("no family's names, no Santa, no 🔀, no confirm()/alert()", !/lincoln|ellis|\blucy\b|julian|howe|dewalt|burris|polar|disney|santa/i.test(KSRC) && KSRC.indexOf("\u{1F500}") < 0 && !/\b(confirm|alert|prompt)\(/.test(code));
  const mh = /SN_HINT_TITLE="([^"]+)", SN_HINT_EMOJI="([^"]+)"/.exec(MSRC), ms = /const SN_STARS=(\d+);/.exec(MSRC);
  const T = kidWorld().T;
  ok("its cover-event words are exactly what Mom's page writes on the calendar", !!mh && T.HINT[0] === mh[1] && T.HINT[1] === mh[2], T.HINT);
  ok("and its star count is Mom's page's (three)", !!ms && T.STARS === +ms[1] && T.STARS === 3);
  ok("it never suggests an idea: one plain box, no examples, no picture palette", /placeholder="Type your idea"/.test(KSRC) && (KSRC.match(/placeholder=/g) || []).length === 1 && !/starter|example|suggest(?!s an idea)/i.test(code));
}

console.log("\n# listening: only the list, and only a season Mom opened to the kids");
{
  const o = kidWorld(); const h = o.W.seasonKidPageHTML("ava");
  ok("opening → listeners on seasons/list and (SEASONJOBS step B) this kid's own jobs; the page says Opening…", o.on.join() === "seasons/list,seasonJobs/ava" && /Opening…/.test(h) && /id="sk-root"/.test(h));
  o.fire["seasons/list"]({ xmas: LIST().xmas, hush: { name: "HUSHSEASON", ts: 2 }, old: { name: "OLDSEASON", kids: true, closed: true, ts: 0 } });
  ok("the list is in → it listens to the open season's ideas, and to no other season's", o.on.join() === "seasons/list,seasonJobs/ava,seasons/ideas/xmas", o.on);
  ok("a season that is not open to the kids is never shown — not even its name", o.html().indexOf("HUSHSEASON") < 0 && o.html().indexOf("OLDSEASON") < 0 && /Winter fun/.test(o.html()));
  ok("until that season's ideas are in, it says Opening… (never 'No ideas yet')", /Opening…/.test(o.html()) && !/No ideas yet/.test(o.html()) && !/skNew\(\)/.test(o.html()));
  o.fire["seasons/ideas/xmas"](IDEAS().xmas);
  ok("its ideas arrive and are drawn", /Board game night/.test(o.html()) && !/Opening…/.test(o.html()));
  o.fire["seasons/ideas/xmas"](null);
  ok("an open season with nothing on it yet says so, with the add button", /No ideas yet/.test(o.html()) && /skNew\(\)/.test(o.html()));
  o.fire["seasons/ideas/xmas"](IDEAS().xmas);
  o.W.seasonKidPageHTML("ava");
  ok("drawing again adds no listener", o.on.length === 3);
  const l2 = LIST(); delete l2.xmas.kids; o.fire["seasons/list"](l2);
  ok("Mom closes it to the kids → that listener stops and its ideas are dropped from this device's page", o.off.join() === "seasons/ideas/xmas" && Object.keys(o.T.data()).length === 0 && /Nothing to plan yet/.test(o.html()) && o.html().indexOf("Board game night") < 0, o.off);
  o.fire["seasons/list"](LIST());
  ok("she opens it again → it listens again", o.on.length === 4 && o.T.refs().join() === "xmas");
  o.W.seasonKidStop();
  ok("closing the page stops every listener", o.off.slice().sort().join() === "seasonJobs/ava,seasons/ideas/xmas,seasons/ideas/xmas,seasons/list" && o.T.refs().length === 0);
  ok("nothing was read once, nothing was written", o.once.length === 0 && o.writes.length === 0);
  ok("no listener ever sat on the whole seasons node or all ideas", o.on.every(p => p === "seasons/list" || p === "seasonJobs/ava" || /^seasons\/ideas\/[^\/]+$/.test(p)));
  // leaving Kids' Corner: the next data change stops it
  const p = kidWorld(); p.W.seasonKidPageHTML("ava"); p.fire["seasons/list"](LIST()); p.ctx.tab = "today"; p.fire["seasons/ideas/xmas"]({});
  ok("the kid leaves Kids' Corner → the next change stops the listeners", p.off.length === 3 && p.T.refs().length === 0, p.off);
  ok("only a kid on the roster gets a page", kidWorld().W.seasonKidPageHTML("mom") === "" && kidWorld().W.seasonKidPageHTML("") === "");
}

console.log("\n# what a kid sees");
{
  const o = kidWorld(); o.open("ava", {}, {});
  ok("nothing open → 'Nothing to plan yet.' and no add button", /Nothing to plan yet/.test(o.html()) && !/skNew\(\)/.test(o.html()));
  o.open("ava", LIST(), IDEAS(), EV());
  const h = o.html();
  ok("the season's name, each idea's words and picture", /⛄ Winter fun/.test(h) && /Build a fort/.test(h) && /🏰/.test(h) && /Board game night/.test(h) && /Sock skating/.test(h));
  ok("its day as a countdown in sleeps, with the day and time", /<b>in 3 sleeps<\/b><span>Tue Nov 24 · 2:00 PM<\/span>/.test(h), (h.match(/<b>in[^<]*<\/b><span>[^<]*/) || [""])[0]);
  ok("who wants it, with their ⭐; and whose idea it is", /Ben ⭐/.test(h) && /Everyone/.test(h) && /Ben’s idea/.test(h));
  ok("a done one says so", /✅ we did it/.test(h) && /Leaf pile/.test(h));
  ok("NEVER a note, a supply, a to-do or a book-by date", h.indexOf("NOTEWORD") < 0 && h.indexOf("SUPPLYWORD") < 0 && h.indexOf("TODOWORD") < 0 && !/book/i.test(h) && h.indexOf("Nov 30") < 0);
  ok("a 🌙 not-this-year idea is not shown", h.indexOf("PARKEDWORD") < 0);
  ok("sections: Coming up, then No day yet, then We did it", h.indexOf(">Coming up<") > 0 && h.indexOf(">No day yet<") > h.indexOf(">Coming up<") && h.indexOf(">We did it<") > h.indexOf(">No day yet<"));
  ok("sleeps: today / 1 / many", o.T.sleeps(0) === "today!" && o.T.sleeps(1) === "in 1 sleep" && o.T.sleeps(12) === "in 12 sleeps");
  o.cal().events.e1.date = "2026-11-21"; o.root.innerHTML = o.T.inner("ava");
  ok("its day is today → 'today!'", /<b>today!<\/b>/.test(o.html()));
  o.cal().events.e1.date = "2026-11-19"; o.root.innerHTML = o.T.inner("ava");
  ok("its day went by and nobody marked it → no countdown, 'its day was …'", !/sleeps?<\/b>/.test(o.html()) && /its day was Thu Nov 19/.test(o.html()));
  delete o.cal().events.e1; o.root.innerHTML = o.T.inner("ava");
  ok("Mom took the event off the calendar → it is back under No day yet", o.T.state(o.T.ideas("xmas").find(i => i.id === "g1")) === "none");
  o.little = true;
  ok("a little kid gets the big layout", /class="sk-page sk-little"/.test(o.W.seasonKidPageHTML("ava")));
  o.little = false;
  const two = LIST(); two.sum = { name: "Summer list", emoji: "☀️", kids: true, start: "2027-06-01", ts: 2 };
  o.open("ava", two, IDEAS());
  ok("two open seasons → a button for each", /skPick\('xmas'\)/.test(o.html()) && /skPick\('sum'\)/.test(o.html()) && /Summer list/.test(o.html()));
}

console.log("\n# 🤫 surprises: nothing, or only what the calendar already says");
{
  const SECRET = "Pony ride at the farm", SECRET2 = "New kitten comes home";
  // Mom's real data — the secret node exists in HER world. The kid's device is never handed it, and never asks for it.
  const momSecret = { xmas: { s1: { t: SECRET, hide: "hint", by: "mom", ts: 7, ev: { h1: true }, want: { ava: true }, star: { ava: true } }, s2: { t: SECRET2, hide: "none", by: "mom", ts: 8, on: { o1: { d: "2026-12-24" } } } } };
  const ev = Object.assign(EV(), { h1: { title: "A surprise", date: "2026-12-05", time: "5:00 PM", who: "family", emoji: "✨" }, h2: { title: "A surprise", date: "2027-02-01", time: "", who: "family", emoji: "✨" }, x1: { title: "A surprise", date: "2026-12-06", time: "", who: "family", emoji: "🎉" } });
  const o = kidWorld(); o.W.seasonKidPageHTML("ava"); o.fire["seasons/list"](LIST()); o.fire["seasons/ideas/xmas"](IDEAS().xmas); o.cal().events = ev; o.root.innerHTML = o.T.inner("ava");
  const h = o.html();
  ok("the device never asked the database for anything but the list and that season's ideas", o.on.join() === "seasons/list,seasonJobs/ava,seasons/ideas/xmas" && o.once.length === 0 && !o.on.some(p => /secret/i.test(p)));
  ok("(Mom's world does hold the surprises — this proves the test would notice a leak)", JSON.stringify(momSecret).indexOf(SECRET) > 0);
  ok("a 🤐 no-hint surprise shows a kid NOTHING: not its words, not its day", h.indexOf(SECRET2) < 0 && h.indexOf("Dec 24") < 0);
  ok("a ✨ hint shows only 'A surprise' on its day, with sleeps — never its words", h.indexOf(SECRET) < 0 && /✨<\/div><div class="sk-wt"><div class="sk-words">A surprise<\/div><\/div><div class="sk-count"[^>]*><b>in 14 sleeps<\/b><span>Sat Dec 5 · 5:00 PM<\/span>/.test(h), (h.match(/A surprise[\s\S]{0,160}/) || [""])[0]);
  ok("the surprise card has no ✋, no ⭐, nothing to tap", (h.match(/skMe\(/g) || []).length === 3 && !/A surprise<\/div><\/div><div class="sk-count"[^>]*>[\s\S]{0,120}<button/.test(h));
  ok("only the calendar's cover events inside the season's dates count", o.T.covers(LIST().xmas).length === 1 && o.T.covers(LIST().xmas)[0].d === "2026-12-05");
  ok("an ordinary event that just happens to be called 'A surprise' is not one (wrong picture)", !o.T.covers(LIST().xmas).some(c => c.d === "2026-12-06"));
  ok("Ava's ⭐ on a surprise is not counted on her page (she can't see it) — Mom's page counts every one", o.T.starsUsed("xmas", "ava") === 0);
  // a record that should never be here (a surprise mark under seasons/ideas) is dropped, not shown
  const bad = IDEAS(); bad.xmas.q1 = { t: "LEAKWORD", hide: "hint", by: "mom", ts: 9 }; o.open("ava", LIST(), bad, ev);
  ok("belt and braces: an idea carrying a surprise mark is never drawn", o.html().indexOf("LEAKWORD") < 0);
}

console.log("\n# a kid adds an idea — straight on the list, marked as theirs");
{
  const o = kidWorld(); o.open("ava", LIST(), IDEAS(), EV());
  ok("a big ＋ Add an idea button", /skNew\(\)/.test(o.html()) && /＋ Add an idea/.test(o.html()));
  o.W.skNew();
  ok("the box asks, with no example to copy", /What do you want to do\?/.test(o.html()) && /placeholder="Type your idea"/.test(o.html()) && o.writes.length === 0);
  o.W.skAdd();
  ok("nothing typed → nothing happens", o.writes.length === 0);
  o.W.skSet("  Snow   painting  "); o.W.skAdd();
  const w = o.last(), p = paths(w)[0], r = w.val[p];
  ok("Add = ONE update of ONE new record under that season's ideas", o.writes.length === 1 && w.op === "update" && w.path === "" && paths(w).length === 1 && /^seasons\/ideas\/xmas\/k[a-z0-9]+$/.test(p), paths(w));
  ok("the record: {t, by:<kid>, want:{<kid>:true}, ts} — nothing else", r.t === "Snow painting" && r.by === "ava" && JSON.stringify(r.want) === '{"ava":true}' && r.ts > 0 && Object.keys(r).length === 4, r);
  ok("it shows at once as 'your idea', with ✋ already on", /Snow painting/.test(o.html()) && /your idea/.test(o.html()) && /I want this ✓/.test(o.html()) && o.T.draft() === null);
  o.writes.length = 0; o.W.skNew(); o.W.skSet("board GAME night"); o.W.skAdd();
  ok("the same words as an idea already there → not added; it says to tap ✋", o.writes.length === 0 && /on the list already/.test(o.html()));
  o.W.skCancel(); o.dry = true; o.W.skNew(); o.W.skSet("Dry idea"); o.W.skAdd();
  ok("?dryrun=1 → no write", o.writes.length === 0);
  o.dry = false;
  const many = IDEAS(); for (let i = 0; i < 30; i++) many.xmas["a" + i] = { t: "Mine " + i, by: "ava", ts: 10 + i };
  o.open("ava", LIST(), many);
  ok("30 of their own → no add button until one comes off", !/skNew\(\)/.test(o.html()) && /Take one off/.test(o.html()));
}

console.log("\n# ✋ me too and ⭐ (three per season)");
{
  const o = kidWorld(); o.open("ava", LIST(), IDEAS(), EV());
  o.W.skMe("m1");
  ok("✋ = ONE field: her own mark on that idea", o.writes.length === 1 && paths(o.last()).join() === "seasons/ideas/xmas/m1/want/ava" && o.last().val["seasons/ideas/xmas/m1/want/ava"] === true);
  o.W.skMe("m1");
  ok("tapping again takes it back", o.last().val["seasons/ideas/xmas/m1/want/ava"] === null);
  o.writes.length = 0; o.W.skStar("m1");
  ok("⭐ on an idea she hadn't joined = her ⭐ and her ✋, in one update", o.writes.length === 1 && paths(o.last()).sort().join() === "seasons/ideas/xmas/m1/star/ava,seasons/ideas/xmas/m1/want/ava" && o.T.starsUsed("xmas", "ava") === 1);
  ok("the star line counts down", /⭐☆☆ <span>2 stars left/.test(o.html()), (o.html().match(/sk-stars">[^<]*<span>[^<]*/) || [""])[0]);
  o.W.skStar("g1"); o.W.skStar("b1");
  ok("three ⭐ are hers to place", o.T.starsUsed("xmas", "ava") === 3 && /all your stars are out/.test(o.html()));
  o.writes.length = 0; o.W.skStar("d1");
  ok("a fourth is refused, in plain words, and nothing is written", o.writes.length === 0 && o.T.starsUsed("xmas", "ava") === 3 && /All 3 of your stars are out/.test(o.html()));
  o.W.skStar("g1");
  ok("taking a ⭐ back = ONE field (her ✋ stays)", o.writes.length === 1 && paths(o.last()).join() === "seasons/ideas/xmas/g1/star/ava" && o.last().val[paths(o.last())[0]] === null && o.T.data().xmas.g1.want.ava === true);
  o.writes.length = 0; o.W.skMe("m1");
  ok("taking ✋ back takes her ⭐ on it back too, in one update", o.writes.length === 1 && paths(o.last()).sort().join() === "seasons/ideas/xmas/m1/star/ava,seasons/ideas/xmas/m1/want/ava" && paths(o.last()).every(p => o.last().val[p] === null));
  ok("Ben's marks were never touched", o.T.data().xmas.b1.star.ben === true && o.T.data().xmas.g1.want.ben === true && o.writes.every(w => paths(w).every(p => /\/(want|star)\/ava$/.test(p))));
  const one = LIST(); one.xmas.stars = 1; o.open("ava", one, IDEAS()); o.W.skStar("m1"); o.writes.length = 0; o.W.skStar("g1");
  ok("a season with its own star count is respected", o.writes.length === 0 && o.T.starMax(one.xmas) === 1);
}

console.log("\n# taking off: only their OWN idea, only while it is bare");
{
  const o = kidWorld(); const I = IDEAS(); I.xmas.a1 = { t: "My own idea", by: "ava", ts: 9, want: { ava: true } }; I.xmas.a2 = { t: "My scheduled idea", by: "ava", ts: 10, ev: { e1: true } }; I.xmas.a3 = { t: "My idea with supplies", by: "ava", ts: 11, sup: { u: { name: "x" } } };
  o.open("ava", LIST(), I, EV());
  ok("only her own bare idea has a ✕", (o.html().match(/skRemove\(/g) || []).length === 1 && /skRemove\('a1'\)/.test(o.html()));
  o.W.skRemove("a1");
  ok("the first tap only asks", o.writes.length === 0 && /Tap again to take it off/.test(o.html()) && /Keep it/.test(o.html()));
  o.W.skKeep(); o.W.skRemove("a1"); o.W.skRemove("a1");
  ok("the second tap removes that ONE record", o.writes.length === 1 && paths(o.last()).join() === "seasons/ideas/xmas/a1" && o.last().val["seasons/ideas/xmas/a1"] === null && !o.T.data().xmas.a1);
  o.writes.length = 0; ["b1", "m1", "g1", "a2", "a3", "d1"].forEach(id => { o.W.skRemove(id); o.W.skRemove(id); });
  ok("someone else's idea, or her own once it has a day or Mom added to it: cannot be removed", o.writes.length === 0 && Object.keys(o.T.data().xmas).length === 7);
}

console.log("\n# the guard: what a kid's device can write, and nothing wider");
{
  const o = kidWorld(); const I = IDEAS(); I.xmas.a1 = { t: "My own idea", by: "ava", ts: 9 };
  const L = LIST(); L.hush = { name: "Not open", ts: 2 }; L.old = { name: "Old", kids: true, closed: true, ts: 0 };
  o.open("ava", L, Object.assign(I, { hush: { h1: { t: "x", by: "mom" } }, old: { o1: { t: "y", by: "ava" } } }));
  const no = (p, v) => { const u = {}; u[p] = v; return o.T.apply(u, "ava") === false; };
  ok("allowed: her own ✋ / ⭐, a new idea of hers, removing her own bare idea", o.T.okPath("seasons/ideas/xmas/m1/want/ava", true, "ava") && o.T.okPath("seasons/ideas/xmas/m1/star/ava", null, "ava") && o.T.okPath("seasons/ideas/xmas/new1", { t: "n", by: "ava" }, "ava") && o.T.okPath("seasons/ideas/xmas/a1", null, "ava"));
  ok("refused: another kid's or Mom's mark", no("seasons/ideas/xmas/m1/want/ben", true) && no("seasons/ideas/xmas/b1/star/ben", null) && no("seasons/ideas/xmas/m1/want/mom", true) && no("seasons/ideas/xmas/m1/want/family", null));
  ok("refused: changing an idea's words, day, done, 🌙, supplies, to-dos, book-by", ["t", "emoji", "ev/e9", "did", "skip", "sup/u1", "todo/t1", "bookBy", "note", "by", "hide", "want", "star"].every(f => no("seasons/ideas/xmas/g1/" + f, f === "want" || f === "star" ? { ava: true } : "x")));
  ok("refused: removing or replacing someone else's idea, or her own that has a day", no("seasons/ideas/xmas/b1", null) && no("seasons/ideas/xmas/g1", null) && no("seasons/ideas/xmas/m1", { t: "mine now", by: "ava" }) && no("seasons/ideas/xmas/a1", { t: "again", by: "ava" }));
  ok("refused: a new idea marked as someone else's", no("seasons/ideas/xmas/new2", { t: "n", by: "ben" }) && no("seasons/ideas/xmas/new2", { t: "n", by: "mom" }) && no("seasons/ideas/xmas/new2", { t: "n" }) && no("seasons/ideas/xmas/new2", true));
  ok("refused: a season that is not open to the kids, or is in the past", no("seasons/ideas/hush/h1/want/ava", true) && no("seasons/ideas/hush/n", { t: "n", by: "ava" }) && no("seasons/ideas/old/o1/want/ava", true) && no("seasons/ideas/old/o1", null));
  ok("refused: anything that is not an idea", ["seasons/list/xmas/kids", "seasons/list/xmas", "seasons/extra/xmas/todo/t", "seasons/ideas/xmas", "seasons/ideas", "calendar/events/e1", "calendar/events/e1/date", "momday/2026-11-21/todos/snx", "kitchen/grocery/items/g", "wishes/ava/w1", "week32/tasks/t"].every(p => no(p, true)) && no("season" + "Secret/xmas/s1", null) && no("season" + "Secret/xmas/s1/want/ava", true));
  ok("refused: a mark with any value but true or cleared", no("seasons/ideas/xmas/m1/want/ava", "yes") && no("seasons/ideas/xmas/m1/star/ava", 3) && no("seasons/ideas/xmas/m1/want/ava", { x: 1 }));
  ok("refused: someone who is not a kid on the roster", o.T.apply({ "seasons/ideas/xmas/m1/want/mom": true }, "mom") === false && o.T.apply({ "seasons/ideas/xmas/m1/want/zed": true }, "zed") === false);
  ok("one bad path refuses the whole update", o.T.apply({ "seasons/ideas/xmas/m1/want/ava": true, "seasons/ideas/xmas/g1/t": "x" }, "ava") === false && !(o.T.data().xmas.m1.want || {}).ava);
  ok("and none of that wrote anything", o.writes.length === 0);
  // every tap a kid has, in one session
  o.open("ava", LIST(), IDEAS(), EV());
  o.W.skNew(); o.W.skSet("One"); o.W.skAdd(); const nid = paths(o.last())[0].split("/").pop();
  o.W.skMe("m1"); o.W.skStar("m1"); o.W.skStar("g1"); o.W.skStar("b1"); o.W.skStar("d1"); o.W.skStar("g1"); o.W.skMe("m1"); o.W.skRemove(nid); o.W.skRemove(nid); o.W.skRemove("b1"); o.W.skRemove("b1"); o.W.skPick("xmas");
  ok("a whole session: every write is a root multi-path update of her own marks or her own idea", o.writes.length >= 7 && o.writes.every(w => w.op === "update" && w.path === "" && paths(w).every(p => /^seasons\/ideas\/xmas\/[^\/]+\/(want|star)\/ava$/.test(p) || p === "seasons/ideas/xmas/" + nid)), o.writes.map(paths));
}

console.log("\n# Mom's page: one switch, and whose idea it is");
{
  const el = id => ({ id, innerHTML: "", value: "", style: {}, focus() {}, appendChild() {} }); const nodes = {}, root = el("content"), writes = [];
  const document = { getElementById(id) { return nodes[id] || (nodes[id] = el(id)); }, createElement: t => el(t), head: { appendChild() {} } };
  const db = { ref(p) { const P = p === undefined ? "" : p; return { update(v) { writes.push({ op: "update", path: P, val: JSON.parse(JSON.stringify(v)) }); }, set(v) { writes.push({ op: "set", path: P, val: v }); }, on() {} }; } };
  const LS = {};
  const ctx = { console: { log: console.log, warn() {} }, Date, Math, JSON, document, db, _todayStr: () => "2026-11-21", _dryRun: () => false, momHere: () => true, gwShowToast() {},
    HA_LS: { getItem: k => (k in LS ? LS[k] : null), setItem: (k, v) => { LS[k] = String(v); } }, tab: "moms-plan", mpSubView: "seasons" };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext("const ROSTER_DEF=[{id:'ava',name:'Ava',color:'#2563eb'},{id:'ben',name:'Ben',color:'#16a34a'}]; var calendarData={events:{}};", ctx);
  vm.runInContext(MSRC, ctx);
  const T = ctx._snTest, W = ctx, last = () => writes[writes.length - 1];
  const L = LIST(); delete L.xmas.kids;
  T.setData({ list: L, ideas: IDEAS() }, {}); T.reset(); T.setRoot(root, ""); T.draw();
  ok("a season starts closed to the kids, and says so", /Only you see this list/.test(root.innerHTML) && /onclick="snKids\(\)">Open it to the kids</.test(root.innerHTML));
  W.snKids();
  ok("Open it to the kids = ONE field on the season", writes.length === 1 && last().op === "update" && last().path === "" && paths(last()).join() === "seasons/list/xmas/kids" && last().val["seasons/list/xmas/kids"] === true);
  ok("the header now says what the kids can do — and that surprises never show", /Open to the kids/.test(root.innerHTML) && /Surprises never show there/.test(root.innerHTML) && /Close it to the kids/.test(root.innerHTML));
  W.snKids();
  ok("Close it = the field is cleared", writes.length === 2 && last().val["seasons/list/xmas/kids"] === null && !T.season("xmas").kids);
  writes.length = 0; W.snNewSeason("trip"); W.snSet("name", "A trip"); W.snSave();
  ok("a new season is never open to the kids by itself", last().val[paths(last())[0]].kids === undefined);
  W.snPick("xmas");
  ok("a kid's idea is marked with whose it is; Mom's own are not", /💡 Ben’s idea/.test(root.innerHTML) && (root.innerHTML.match(/’s idea</g) || []).length === 1);
  ok("each kid's ✋ and ⭐ show on the idea", /Ben ⭐/.test(root.innerHTML));
  // the record a kid's device writes is an ordinary idea here
  const k = kidWorld(); k.open("ava", LIST(), IDEAS()); k.W.skNew(); k.W.skSet("Snow painting"); k.W.skAdd(); k.W.skStar("m1");
  const kp = paths(k.writes[0])[0].split("/"); T.data().ideas.xmas[kp[3]] = k.writes[0].val[paths(k.writes[0])[0]]; T.data().ideas.xmas.m1.want.ava = true; T.data().ideas.xmas.m1.star = { ava: true }; T.draw();
  ok("what a kid adds shows on Mom's page as 'not scheduled yet', hers to give a day", /Snow painting/.test(root.innerHTML) && /💡 Ava’s idea/.test(root.innerHTML) && T.state(T.idea("xmas", kp[3])) === "todo" && /Ava ⭐/.test(root.innerHTML));
  ok("a kid's ⭐ counts toward the same three on Mom's page", T.starsUsed("xmas", "ava") === 1 && T.picks("xmas").some(p => p.id === "ava" && p.n === 2 && p.stars === 1));
  W.snOpenIdea(kp[3]);
  ok("the idea's pop-up says who added it", /💡 Ava’s idea<\/span> — added in Kids’ Corner/.test(root.innerHTML));
  const closed = LIST(); closed.xmas.closed = true; T.setData({ list: closed, ideas: IDEAS() }, {}); T.reset(); T.draw(); writes.length = 0; W.snKids();
  ok("a 📜 past season has no switch", !/snKids\(\)/.test(root.innerHTML) && writes.length === 0);
  ok("Mom's file has three listeners (seasonJobs: SEASONJOBS step B) and ONE update door", (MSRC.replace(/^\s*\/\/.*$/gm, "").match(/db\.ref\(/g) || []).length === 4);
}

console.log("\n# index.html: the button, the open/close state, the loader — nothing more");
{
  const a = HTML.indexOf("// SEASONKID_START"), b = HTML.indexOf("// SEASONKID_END"), BLOCK = HTML.slice(a, b);
  ok("one SEASONKID block, right after the wish list's", a > 0 && b > a && HTML.indexOf("// SEASONKID_START", a + 1) < 0 && HTML.slice(HTML.lastIndexOf("\n", a - 2) + 1, a - 1) === "// WISHES_END");
  ok("seasonkid.js is named only inside the block (never loaded at start)", HTML.split("seasonkid.js").length - 1 === BLOCK.split("seasonkid.js").length - 1 && BLOCK.split("seasonkid.js").length - 1 >= 2 && !/<script[^>]*seasonkid/.test(HTML));
  ok("the block reads and writes nothing itself", !/db\.ref|\.set\(|\.update\(|\.remove\(|\.on\(/.test(BLOCK));
  ok("the block is under 3 KB", Buffer.byteLength(BLOCK, "utf8") < 3072, Buffer.byteLength(BLOCK, "utf8"));
  const kc = HTML.slice(HTML.indexOf("function renderKidsCorner(el){"), HTML.indexOf("\nfunction kcAddOpen"));
  ok("Kids' Corner: the page in place of the buttons, the button next to the wish list's", /else if\(typeof skOn==="function"&&skOn\(k\)\) h\+=skPageHTML\(k\);/.test(kc) && /if\(typeof skTileHTML==="function"\) h\+=skTileHTML\(k\);/.test(kc) && kc.indexOf("kcCalToggleHTML(k)") < kc.indexOf("skTileHTML(k)") && kc.indexOf("skTileHTML(k)") < kc.indexOf("kcModeBodyHTML(k)"));
  ok("no boot listener was added for it", !/db\.ref\(["'`]seasons/.test(HTML));
  // run the block
  const made = []; let draws = 0, stops = 0; const win = {};
  const env = { KID_COLOR: { ava: "#2563eb" }, ROSTER: ["ava", "ben"], kcLittle: k => k === "ben", kcPlay: null, kcPlayClose() {}, renderAll() { draws++; }, location: { hostname: "x.github.io" }, tab: "kids",
    document: { createElement: t => { const s = { tag: t }; made.push(s); return s; }, head: { appendChild() {} } }, window: win, seasonKidStop: () => { stops++; }, seasonKidPageHTML: k => "<page:" + k + ">" };
  const names = ["skOn", "skTileHTML", "skOpen", "skClose", "skBack", "skPageHTML"];
  const F = new Function(...Object.keys(env), "setTab", BLOCK.replace(/^\/\/ SEASONKID_START[^\n]*\n/, "") + "\nreturn {" + names.join(",") + ",kid:()=>skKid,setTab:v=>{tab=v;}};")(...Object.values(env));
  ok("the button says ✨ Our plans, in the kid's colour; bigger for a little one", /✨ Our plans/.test(F.skTileHTML("ava")) && /#2563eb/.test(F.skTileHTML("ava")) && /skOpen\('ava'\)/.test(F.skTileHTML("ava")) && /font-size:15px/.test(F.skTileHTML("ben")) && /font-size:13px/.test(F.skTileHTML("ava")));
  ok("nothing is fetched until the tap", made.length === 0 && F.skOn("ava") === false);
  F.skOpen("ava");
  ok("the tap fetches seasonkid.js once (cache-busted on the live site) and draws 'Opening…'", made.length === 1 && /^seasonkid\.js\?v=\d+$/.test(made[0].src) && F.skOn("ava") === true && /Opening/.test(F.skPageHTML("ava")) && /skBack\(\)/.test(F.skPageHTML("ava")) && draws === 1);
  F.skOpen("ava");
  ok("a second tap while it loads fetches nothing more", made.length === 1);
  made[0].onerror();
  ok("no internet → it says so, and the next tap tries again", /check the internet/.test(F.skPageHTML("ava")) && (F.skOpen("ava"), made.length === 2));
  win.seasonKidPageHTML = env.seasonKidPageHTML; win.seasonKidStop = env.seasonKidStop;
  ok("once loaded, the page is the kids' file's", F.skPageHTML("ava") === "<page:ava>");
  ok("another kid picked → it closes and the listeners are stopped", F.skOn("ben") === false && F.kid() === null && stops === 1);
  F.skOpen("ava"); F.skBack();
  ok("← Back closes it and stops the listeners", F.kid() === null && stops === 2);
  F.skOpen("ava"); F.setTab("today");
  ok("another tab → closed the next time the Corner asks", F.skOn("ava") === false && stops === 3);
  F.skOpen("zed");
  ok("someone not on the roster opens nothing", F.kid() === null);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
