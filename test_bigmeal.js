/*
 * Node tests for 🍗 BIGMEAL slice 1 — an idea's ⏱ Cooking timeline (PLAN_holiday_menu_2026-11-24.md §6 slice 1; Sara's answers
 * 11/24: "I type how long it cooks and where. The app works out when to start").
 *   · the rule: in = eat − cook (slice 1: nothing rests, nothing needs getting ready) — the plan's three worked meals to the minute,
 *     20,000 random dishes, every minute of the day through the clock text, the night before
 *   · NEVER a time without an eat time, never a time for a dish with no place or no cook time, never a guessed cook time
 *   · NEVER a write on opening the page, in a dry run, outside …/meal and …/food/<id>, or a whole-record set on a changed dish
 *   · an old food line is a dish with no times ("Not timed yet") and is never changed by opening the page
 *   · a 🤫 surprise's meal lives only in seasonSecret/ · nothing is drawn or attached without the Mom switch; it closes when it goes off
 *   · the files: bigmeal.js has no database call, no setInterval, no other node's path, no family names, never reads _snTest;
 *     seasons.js keeps 5 db.ref calls and the same SN_OK; an idea with no meal looks exactly as before apart from the ⏱ buttons
 *   · the loader: one script tag, a failed load leaves the planner working and the next tap tries again
 *
 *   run:  node test_bigmeal.js
 */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm"), cp = require("child_process");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 600) + ")" : "")); } }
const SN = fs.readFileSync(path.join(__dirname, process.env.SN_SRC || "seasons.js"), "utf8");
const BM = fs.readFileSync(path.join(__dirname, process.env.BM_SRC || "bigmeal.js"), "utf8");
const OLD_SN = (() => { try { return cp.execSync("git show origin/main:seasons.js", { cwd: __dirname, maxBuffer: 16 << 20, stdio: ["ignore", "pipe", "ignore"] }).toString(); } catch (e) { return null; } })();

// ── a made-up family: two kids, one season, a few ideas; the planner and the meal page in ONE vm world ──
function world(opt) {
  opt = opt || {};
  const nodes = {}, kids = [];
  const el = id => { const e = { id, innerHTML: "", value: "", style: {}, children: [], parentNode: null, focus() {}, scrollTo() {},
    appendChild(c) { c.parentNode = e; e.children.push(c); if (c.id) nodes[c.id] = c; kids.push(c); return c; } }; return e; };
  const body = el("body"), head = el("head"), root = el("content");
  const o = { writes: [], on: [], cbs: {}, toasts: [], mw: [], imp: [], dry: false, mom: true, today: "2026-11-24", scripts: [], body, root };
  const document = { body, head, getElementById(id) { return nodes[id] || null; }, createElement(t) { const e = el(""); e.tag = t; if (t === "script") o.scripts.push(e); return e; } };
  const db = { ref(p) { return { update(v) { o.writes.push({ path: p, val: JSON.parse(JSON.stringify(v)) }); }, set(v) { o.writes.push({ path: p, set: v }); }, remove() { o.writes.push({ path: p, remove: true }); },
    on(ev, cb) { o.on.push(p); o.cbs[p] = cb; }, once() {} }; } };
  const ctx = { console: { log() {}, warn() {} }, Date, Math, JSON, document, db, skJobsN: () => 0, location: { hostname: "localhost" },
    _todayStr: () => o.today, _dryRun: () => o.dry, momHere: () => o.mom, _kioskD: () => false, gwShowToast: m => o.toasts.push(m),
    HA_LS: { getItem: () => null, setItem() {} }, tab: "moms-plan", mpSubView: "seasons", momSchedView: false, renderMomsPlan() {}, mpGoto() {},
    momdayData: {}, setTimeout: () => 0, bankDirect: () => "b", bankDirectRemove() {}, cuUnpay: () => false, choreVerifyOn: () => false,
    grIngRows: src => { o.imp.push({ src }); return [{ p: { name: "x" }, meals: [src[0].lbl], why: "", on: true }]; },
    grImpOpen: (title) => { o.imp[o.imp.length - 1].title = title; } };
  if (!opt.oldPage) ctx.mwToast = m => o.mw.push(m);   // an older page may not have it
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext("const ROSTER_DEF=[{id:'ava',name:'Ava',color:'#2563eb'},{id:'ben',name:'Ben',color:'#16a34a'}]; var calendarData={events:{}}; var daddayData={}; var kitMeals={}; var kitPlan={};", ctx);
  vm.runInContext(opt.sn || SN, ctx);
  if (!opt.noBm) vm.runInContext(BM, ctx);
  o.W = ctx; o.T = ctx._snTest; o.B = ctx._bmTest; o.cal = () => vm.runInContext("calendarData", ctx);
  o.set = (d, sec, ev, meals) => { o.writes.length = 0; o.toasts.length = 0; o.mw.length = 0; o.imp.length = 0;
    const c = x => JSON.parse(JSON.stringify(x || {})); o.T.setData(c(d), c(sec)); o.T.reset(); o.cal().events = c(ev); o.T.setJobs({}); o.T.setRoot(root, ""); o.T.ddFresh(true);
    vm.runInContext("kitMeals=" + JSON.stringify(meals || MEALS()) + ";", ctx); };
  o.layer = () => nodes["bm-layer"] || null;
  o.html = () => (nodes["bm-layer"] || { innerHTML: "" }).innerHTML;
  o.text = () => o.html().replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/\s+/g, " ");
  o.nodes = nodes;
  return o;
}
const MEALS = () => ({ m_turkey: { name: "Roast turkey", ing: "1 turkey\n2 tbsp butter" }, m_rolls: { name: "Dinner rolls", ing: "3 cups flour" } });
const SEASON = (ideas) => ({ list: { xmas: { name: "Holidays 2026", emoji: "🎄", kind: "holiday", start: "2026-11-20", end: "2026-12-31", ts: 1 } }, ideas: { xmas: ideas } });
const EV = () => ({ e1: { title: "Thanksgiving dinner", date: "2026-11-26", time: "2:00 PM", who: "family", emoji: "🦃" },
  e2: { title: "Christmas breakfast", date: "2026-12-25", time: "", who: "family", emoji: "🎄" } });
const dish = (name, where, cook, temp, extra) => Object.assign({ name, ts: 0 }, where ? { where } : {}, cook != null ? { cook } : {}, temp ? { temp } : {}, extra || {});
function foodMap(list) { const m = {}; list.forEach((d, i) => { m["f" + String(i).padStart(2, "0")] = Object.assign({}, d, { ts: i + 1 }); }); return m; }
const THANKS = [dish("Turkey", "oven", 240, "325"), dish("Mac and cheese", "slow", 150, "high"), dish("Mashed potatoes", "slow", 120, "low"),
  dish("Stuffing", "oven", 45, "350"), dish("Sweet potato casserole", "oven", 30, "350"), dish("Green beans", "stove", 15), dish("Gravy", "stove", 15),
  dish("Rolls", "oven", 12, "400"), dish("Cranberry sauce", "none"), dish("Pumpkin pie", "none")];
const BREAKFAST = [dish("Hash-brown casserole", "slow", 540, "low"), dish("French toast casserole", "oven", 45, "350"), dish("Cinnamon rolls", "oven", 20, "375"),
  dish("Bacon", "air", 10, "375"), dish("Scrambled eggs", "stove", 8), dish("Fruit salad", "none")];
const BIRTHDAY = [dish("Pulled pork", "slow", 480, "low"), dish("Mac and cheese", "oven", 30, "350"), dish("Garlic bread", "oven", 10, "350"),
  dish("Corn on the cob", "stove", 10), dish("Coleslaw", "none")];
const IDEAS = (meal, food, more) => Object.assign({
  t1: { t: "Thanksgiving dinner", emoji: "🦃", by: "mom", ts: 2, ev: { e1: true }, food: food || foodMap(THANKS), meal },
  b1: { t: "Christmas breakfast", emoji: "🎄", by: "mom", ts: 3, ev: { e2: true }, food: foodMap(BREAKFAST), meal: { eat: "08:30", ts: 1 } },
  z1: { t: "Ice skating", by: "mom", ts: 4 } }, more || {});

const o = world(), W = o.W, T = o.T, B = o.B;
const stepsFor = (eat, list) => { const D = list.map((d, i) => B.dishOf({ id: "f" + i, r: d })); return B.steps(B.clockMin(eat), B.plan(B.clockMin(eat), D)); };
const at = (S, name) => { const s = S.find(x => x.k === "i" && x.d.name === name);   // the "goes in" row (slice 2 adds heat / start / out rows)
  return s ? B.fmtClock(s.at) + (B.dayShift(s.at) ? "@" + B.dayShift(s.at) : "") : null; };

console.log("\n# the rule: in = eat − cook (slice 1 — nothing rests, nothing needs getting ready)");
{
  const S = stepsFor("4:00 PM", THANKS);
  const want = { "Turkey": "12:00 PM", "Mac and cheese": "1:30 PM", "Mashed potatoes": "2:00 PM", "Stuffing": "3:15 PM", "Sweet potato casserole": "3:30 PM", "Green beans": "3:45 PM", "Gravy": "3:45 PM", "Rolls": "3:48 PM" };
  ok("Thanksgiving, eat 4:00 PM: every dish's start to the minute", Object.keys(want).every(n => at(S, n) === want[n]), Object.keys(want).map(n => n + "=" + at(S, n)));
  ok("…in time order, the stove's two at 3:45 side by side (A–Z), and the last row = eat", S.filter(s => s.k === "i" || s.k === "eat").map(s => s.d ? s.d.name : "EAT").join("|") === "Turkey|Mac and cheese|Mashed potatoes|Stuffing|Sweet potato casserole|Gravy|Green beans|Rolls|EAT");
  ok("…the last row says what to put out (the no-cooking dishes) and is at 4:00 PM", S[S.length - 1].k === "eat" && B.fmtClock(S[S.length - 1].at) === "4:00 PM" && S[S.length - 1].put.join() === "Cranberry sauce,Pumpkin pie");
  const C = stepsFor("8:30 AM", BREAKFAST);
  ok("Christmas breakfast, eat 8:30 AM: the 9-hour slow cooker starts 11:30 PM the day before", at(C, "Hash-brown casserole") === "11:30 PM@-1");
  ok("…and the rest to the minute", at(C, "French toast casserole") === "7:45 AM" && at(C, "Cinnamon rolls") === "8:10 AM" && at(C, "Bacon") === "8:20 AM" && at(C, "Scrambled eggs") === "8:22 AM");
  const Bd = stepsFor("18:00", BIRTHDAY);
  ok("Birthday dinner, eat 6:00 PM", at(Bd, "Pulled pork") === "10:00 AM" && at(Bd, "Mac and cheese") === "5:30 PM" && at(Bd, "Garlic bread") === "5:50 PM" && at(Bd, "Corn on the cob") === "5:50 PM");
  ok("the night before reads with its day: “Thu Dec 24 · 11:30 PM (the night before)”", B.stepWhen(B.clockMin("8:30 AM") - 540, "2026-12-25") === "Thu Dec 24 · 11:30 PM (the night before)");
  ok("…the day before (before 5 PM) and two days before", B.stepWhen(-600, "2026-12-25") === "Thu Dec 24 · 2:00 PM (the day before)" && B.stepWhen(-1500, "2026-12-25") === "Wed Dec 23 · 11:00 PM (2 days before)");
  ok("…and with no day yet, no date — just the clock and how many days before", B.stepWhen(-30, "") === "11:30 PM (the night before)");
  let bad = 0;
  for (let i = 0; i < 20000; i++) { const eat = Math.floor(Math.random() * 1440), c = 1 + Math.floor(Math.random() * 2880), P = B.plan(eat, [B.dishOf({ id: "x", r: { name: "x", where: "oven", cook: c } })])[0]; if (P.in + c !== eat || P.out !== eat) bad++; }
  ok("20,000 random dishes: start + cook time = eat time, every one", bad === 0, bad);
  let rt = 0; for (let m = 0; m < 1440; m++) { if (B.clockMin(B.fmtClock(m)) !== m || B.clockMin(B.hhmm(m)) !== m) rt++; }
  ok("every minute of the day survives the clock text both ways (“4:00 PM” and “16:00”)", rt === 0, rt);
  ok("12:00 AM = 0 and 12:00 PM = 720 (midnight and noon never swap)", B.clockMin("12:00 AM") === 0 && B.clockMin("12:00 PM") === 720 && B.fmtClock(0) === "12:00 AM" && B.fmtClock(720) === "12:00 PM");
  ok("what it reads: 4pm · 4 p.m. · 16:00 · 0:30", B.clockMin("4pm") === 960 && B.clockMin("4 p.m.") === 960 && B.clockMin("16:00") === 960 && B.clockMin("0:30") === 30);
  ok("what it refuses (never a guess): 4:60 PM · 13:00 PM · 24:00 · noon · 4 · blank", ["4:60 PM", "13:00 PM", "24:00", "noon", "4", "", null, "0:00 AM"].every(t => B.clockMin(t) === null));
  ok("how long reads plainly: 4 h · 2 h 30 min · 45 min", B.dur(240) === "4 h" && B.dur(150) === "2 h 30 min" && B.dur(45) === "45 min" && B.dur(1) === "1 min");
}

console.log("\n# never a time it can't know");
{
  const D = THANKS.map((d, i) => B.dishOf({ id: "f" + i, r: d }));
  ok("no eat time → no steps at all", B.steps(null, B.plan(null, D)).length === 0 && B.plan(null, D).every(d => d.in === null));
  const odd = [{ name: "No place", cook: 30 }, { name: "No time", where: "oven" }, { name: "Zero", where: "oven", cook: 0 }, { name: "Too long", where: "oven", cook: 2881 },
    { name: "Words", where: "oven", cook: "a while" }, { name: "True", where: "oven", cook: true }, { name: "Half", where: "oven", cook: 12.5 }, { name: "Bad place", where: "fireplace", cook: 30 }];
  const P = B.plan(960, odd.map((r, i) => B.dishOf({ id: "o" + i, r })));
  ok("a dish with no place, no cook time, 0, over 48 h, words, true or a bad place → no time", P.filter(d => d.name !== "Half").every(d => d.in === null), P.map(d => d.name + ":" + d.in));
  ok("…they are all “Not timed yet”", B.notTimed(P).filter(d => d.name !== "Half").length === 7);
  const S2 = B.steps(960, B.plan(960, odd.concat([{ name: "Pie", where: "none" }]).map((r, i) => B.dishOf({ id: "q" + i, r }))));
  ok("…and never sneak into the last row's “Put out” (only the no-cooking dishes do)", S2[S2.length - 1].put.join() === "Pie" && S2.filter(x => x.k !== "heat").length === 2, S2.map(x => x.put || x.d.name));
  ok("a number with a fraction is read as whole minutes, never rounded up into a guess", P.find(d => d.name === "Half").cook === 12);
  ok("no-cooking dishes need no time and are never “not timed”", B.notTimed(B.plan(960, [B.dishOf({ id: "n", r: { name: "Pie", where: "none", cook: 30 } })])).length === 0 && B.dishOf({ id: "n", r: { name: "Pie", where: "none", cook: 30, temp: "350" } }).cook === null);
  ok("the file holds no cook-time table to guess from (no minutes next to a food word)", !/turkey|ham|potato|casserole|stuffing/i.test(BM.replace(/^\s*\/\/.*$/gm, "").replace(/placeholder[^)]*\)/g, "").replace(/"Turkey"/, "")));
}

console.log("\n# the page: open it, read it");
o.set(SEASON(IDEAS({ eat: "16:00", ts: 1 })), {}, EV());
{
  const n0 = o.on.length;
  W.bmOpen("xmas", "t1");
  ok("Mom opens Thanksgiving → the layer is drawn", !!o.layer() && /Thanksgiving dinner/.test(o.html()) && o.layer().style.display === "block");
  ok("opening writes NOTHING (an old line, a new meal, nothing)", o.writes.length === 0, o.writes);
  ok("…and attaches no listener", o.on.length === n0);
  ok("it shows its day and the eat time box with 16:00", /Thu Nov 26/.test(o.html()) && /type="time" id="bm-eat" value="16:00"/.test(o.html()));
  const t = o.text();
  ok("⏱ When to start lists Turkey at 12:00 PM, into the oven, 325°, 4 h", /12:00 PM Turkey — into the oven · 325° · 4 h/.test(t), t.slice(0, 400));
  ok("…Rolls 3:48 PM · 400° · 12 min, and the last row: Everything out. Eat! Put out: Cranberry sauce, Pumpkin pie", /3:48 PM Rolls — into the oven · 400° · 12 min/.test(t) && /4:00 PM Everything out\. Eat! Put out: Cranberry sauce, Pumpkin pie/.test(t));
  ok("“low” stays as typed, no degree mark", /Mashed potatoes — into the slow cooker · low · 2 h/.test(t));
  ok("🔥 Where it cooks: Oven, Stove top, Slow cooker, No cooking — in that order", (() => { const i = ["🔥 Oven", "🍳 Stove top", "🍲 Slow cooker", "🧊 No cooking"].map(x => t.indexOf(x)); return i.every((v, k) => v > 0 && (k === 0 || v > i[k - 1])); })(), t.slice(t.indexOf("Where it cooks"), t.indexOf("Where it cooks") + 300));
  o.set(SEASON(IDEAS({ eat: "16:00" }, foodMap([dish("Turkey", "oven", 240, "325", { mid: "m_turkey" }), dish("Gravy", "stove", 15)]))), {}, EV()); W.bmOpen("xmas", "t1");
  ok("a recipe dish gets 🛒 Ingredients, a words-only dish 🧺 What to buy", /bmShop\('f00'\)">🛒 Ingredients/.test(o.html()) && /bmBuy\(\)">🧺 What to buy/.test(o.html()));
  W.bmShop("f00");
  ok("🛒 → the Kitchen's own tick sheet for that one recipe (Q14: one dish at a time), labelled with the season and the idea", o.imp.length === 1 && o.imp[0].title === "Add ingredients — Roast turkey" && o.imp[0].src[0].lbl === "🎄 Holidays 2026 · Thanksgiving dinner" && o.writes.length === 0);
  W.bmBuy();
  ok("🧺 → the planner's own supply pop-up for this idea (it sits above this page)", T.edit() && T.edit().type === "line" && T.edit().kind === "sup" && T.edit().iid === "t1");
  W.snCancel(); W.bmClose();
  ok("← Back closes it", o.layer().innerHTML === "" && o.layer().style.display === "none" && B.state().sid === null);
}

console.log("\n# an old food line is a dish with no times — never changed by looking");
{
  const old = { a: { name: "Popcorn", ts: 5 }, b: { name: "Rolls", mid: "m_rolls", ts: 6, menu: { "2026-11-26": { s: "d", side: true, mid: "m_rolls" } } } };
  o.set(SEASON(IDEAS(undefined, old)), {}, EV());
  const before = JSON.stringify(T.data());
  W.bmOpen("xmas", "t1"); W.bmRefresh(); o.B.draw();
  ok("both show under 📝 Not timed yet, asking where it cooks", /📝 Not timed yet/.test(o.text()) && /Popcorn where does it cook\?/.test(o.text()) && /Rolls where does it cook\?/.test(o.text()));
  ok("no eat time → the page says so and shows no start time", /Put in when you eat/.test(o.text()) && !/in at/.test(o.html()));
  ok("the calendar's time is offered as one tap: “Use 2:00 PM (the calendar time)” — but nothing is saved until she taps", /Use 2:00 PM \(the calendar time\)/.test(o.text()) && o.writes.length === 0);
  ok("the data is byte-for-byte what it was", JSON.stringify(T.data()) === before);
  W.bmEat("14:00");
  const w = o.writes[0];
  ok("her tap saves ONE update: meal/eat \"14:00\" + meal/ts — nothing else", o.writes.length === 1 && Object.keys(w.val).sort().join() === "seasons/ideas/xmas/t1/meal/eat,seasons/ideas/xmas/t1/meal/ts" && w.val["seasons/ideas/xmas/t1/meal/eat"] === "14:00");
  o.writes.length = 0; W.bmEat("4:00 PM");
  ok("typing 4:00 PM stores 16:00 (24-hour) and leaves ts alone", o.writes.length === 1 && JSON.stringify(o.writes[0].val) === '{"seasons/ideas/xmas/t1/meal/eat":"16:00"}');
  o.writes.length = 0; W.bmEat("25:00");
  ok("a time it can't read → a plain message, nothing saved", o.writes.length === 0 && /Type a time like 4:00 PM/.test(o.html()));
  W.bmEat(""); ok("a blank box saves nothing (half-typed time on a computer)", o.writes.length === 0);
  W.bmClose();
}

console.log("\n# adding and changing a dish — only its own fields");
{
  o.set(SEASON(IDEAS({ eat: "16:00", ts: 1 }, { f1: { name: "Rolls", mid: "m_rolls", ts: 7, menu: { "2026-11-26": { s: "d", side: true, mid: "m_rolls" } } } })), {}, EV());
  W.bmOpen("xmas", "t1"); W.bmDish("");
  ok("＋ Add a dish opens the pop-up with the places as chips", /＋ Add a dish/.test(o.html()) && /bmWhere\('oven'\)">🔥 Oven/.test(o.html()) && /bmWhere\('slow'\)">🍲 Slow cooker \(crockpot\)/.test(o.html()) && /bmWhere\('air'\)">💨 Air fryer/.test(o.html()));
  W.bmDishSet("name", "Turkey"); W.bmWhere("oven"); W.bmDishSet("h", "4"); W.bmDishSet("m", ""); W.bmDishSet("temp", "325");
  W.bmDishSave();
  const w = o.writes[0], k = Object.keys(w.val);
  ok("a new dish = ONE update of ONE path under the idea's food", o.writes.length === 1 && k.length === 1 && /^seasons\/ideas\/xmas\/t1\/food\/f[a-z0-9]+$/.test(k[0]), k);
  ok("…{name, ts, where, cook (minutes), temp} — no empty fields", (() => { const r = w.val[k[0]]; return r.name === "Turkey" && r.where === "oven" && r.cook === 240 && r.temp === "325" && typeof r.ts === "number" && Object.keys(r).length === 5; })(), w.val);
  ok("…and it shows at once: Turkey 12:00 PM", /12:00 PM Turkey — into the oven · 325° · 4 h/.test(o.text()));
  o.writes.length = 0;
  W.bmDish("f1"); W.bmWhere("oven"); W.bmDishSet("m", "12"); W.bmDishSet("temp", "400"); W.bmDishSave();
  const v = o.writes[0] && o.writes[0].val;
  ok("changing a dish writes only the fields that changed — never the whole record", !!v && Object.keys(v).sort().join() === "seasons/ideas/xmas/t1/food/f1/cook,seasons/ideas/xmas/t1/food/f1/temp,seasons/ideas/xmas/t1/food/f1/where", v);
  const r = T.data().ideas.xmas.t1.food.f1;
  ok("…so its Menu note, its recipe link and its ts survive", r.menu && r.menu["2026-11-26"].mid === "m_rolls" && r.mid === "m_rolls" && r.ts === 7 && r.cook === 12);
  o.writes.length = 0; W.bmDish("f1"); W.bmDishSave();
  ok("saving with nothing changed writes nothing", o.writes.length === 0);
  W.bmDish("f1"); W.bmDishSet("h", "0"); W.bmDishSet("m", "0"); W.bmDishSave();
  ok("0 minutes → a plain message, nothing saved", o.writes.length === 0 && /between 1 minute and 48 hours/.test(o.html()));
  W.bmDishSet("h", "49"); W.bmDishSave(); ok("49 hours → refused too", o.writes.length === 0);
  W.bmDishSet("h", "abc"); W.bmDishSet("m", "30"); W.bmDishSave(); ok("words in the hours box → refused, never read as 0 (even with minutes typed)", o.writes.length === 0 && /between 1 minute and 48 hours/.test(o.html()));
  W.bmDishCancel();
  W.bmDish("f1"); W.bmDishSet("h", ""); W.bmDishSet("m", ""); W.bmDishSave();
  ok("clearing how long removes cook (null) — it goes back to “Not timed yet”, no time is invented", o.writes.length === 1 && o.writes[0].val["seasons/ideas/xmas/t1/food/f1/cook"] === null && /📝 Not timed yet/.test(o.text()));
  o.writes.length = 0;
  W.bmDish("f1"); W.bmWhere("none"); W.bmDishSave();
  ok("switching to 🧊 No cooking clears the temperature (no cook time or degrees on a cold dish)", o.writes.length === 1 && o.writes[0].val["seasons/ideas/xmas/t1/food/f1/where"] === "none" && o.writes[0].val["seasons/ideas/xmas/t1/food/f1/temp"] === null);
  o.writes.length = 0;
  W.bmDish(""); W.bmDishSet("name", "Brisket"); W.bmWhere("x"); W.bmDishSet("h", "10"); W.bmDishSave();
  ok("✏️ Something else needs its name first", o.writes.length === 0 && /Type what it cooks in/.test(o.html()));
  W.bmDishSet("whereTxt", "Smoker shed"); W.bmDishSave();
  ok("…then it saves where:\"x\" + its name, and the page has a group for it", o.writes.length === 1 && (() => { const r = Object.values(o.writes[0].val)[0]; return r.where === "x" && r.whereTxt === "Smoker shed" && r.cook === 600; })() && /✏️ Smoker shed/.test(o.text()) && /into the Smoker shed/.test(o.text()));
  o.writes.length = 0;
  W.bmDish(""); W.bmDishSave(); ok("a dish needs a name", o.writes.length === 0 && /Give the dish a name/.test(o.html())); W.bmDishCancel();
  W.bmDish(""); W.bmDishMid("m_turkey");
  ok("picking a Kitchen recipe fills in its name", B.state().ed.form.name === "Roast turkey" && B.state().ed.form.mid === "m_turkey");
  W.bmDishMid("nope"); ok("…a recipe id the Kitchen doesn't have is never kept", B.state().ed.form.mid === "");
  W.bmDishCancel();
  W.bmDish("f1"); W.bmDishDel();
  ok("Delete asks once (“Tap again to delete”) and writes nothing yet", o.writes.length === 0 && /Tap again to delete/.test(o.html()));
  W.bmDishDel();
  ok("…the second tap removes just that food line (one path, null)", o.writes.length === 1 && JSON.stringify(o.writes[0].val) === '{"seasons/ideas/xmas/t1/food/f1":null}');
  W.bmClose();
}

console.log("\n# the one door: only …/meal and …/food/<id>, then the planner's apply()");
{
  o.set(SEASON(IDEAS({ eat: "16:00" })), {}, EV());
  const bad = ["calendar/events/e1", "calendar/events/e1/time", "kitchen/plan/2026-11-26", "momday/2026-11-26/todos/sn1", "dadday/2026-11-26/todos/sn1", "seasonJobs/ava/t1",
    "gifts/x", "seasons/list/xmas", "seasons/ideas/xmas/t1", "seasons/ideas/xmas/t1/t", "seasons/ideas/xmas/t1/ev/e1", "seasons/ideas/xmas/t1/todo/x", "seasons/ideas/xmas/t1/food",
    "seasons/extra/xmas/sup/u", "seasons/ideas/xmas/t1/mealx", "seasons/ideas/xmas", "seasonSecret/xmas", "x/seasons/ideas/xmas/t1/meal"];
  const refused = bad.filter(p => { const u = {}; u[p] = 1; return B.put(u) === false; });
  ok("refused, and nothing sent: the calendar, the Kitchen, Mom's/Dad's day, kids' jobs, gifts, the season, the idea's own fields, to-dos, the whole food list", refused.length === bad.length && o.writes.length === 0, bad.filter(p => refused.indexOf(p) < 0));
  ok("…one bad path in a batch refuses the whole batch", B.put({ "seasons/ideas/xmas/t1/meal/eat": "16:00", "calendar/events/e1/time": "4:00 PM" }) === false && o.writes.length === 0);
  ok("allowed: the meal and a food line, on a public or a 🤫 idea", B.OK.test("seasons/ideas/xmas/t1/meal/eat") && B.OK.test("seasons/ideas/xmas/t1/food/f1/cook") && B.OK.test("seasonSecret/xmas/s1/meal") && B.OK.test("seasonSecret/xmas/s1/food/f1"));
  o.dry = true; W.bmOpen("xmas", "t1"); W.bmEat("17:00"); W.bmDish(""); W.bmDishSet("name", "Pie"); W.bmWhere("none"); W.bmDishSave();
  ok("?dryrun=1: nothing reaches the database…", o.writes.length === 0);
  ok("…though the screen shows what she did (the planner's own dry-run mirror)", /value="17:00"/.test(o.html()) && /Pie/.test(o.text()));
  o.dry = false; W.bmClose();
}

console.log("\n# 🤫 a surprise meal lives only in seasonSecret/");
{
  const SECRET = "Surprise brunch for Grandpa", DISH = "Grandpa's waffles";
  o.set(SEASON(IDEAS({ eat: "16:00" })), { xmas: { s1: { t: SECRET, by: "mom", hide: "none", ts: 9, on: { o1: { d: "2026-12-06", time: "10:00 AM" } } } } }, EV());
  W.bmOpen("xmas", "s1");
  ok("its page opens for Mom and says it's a surprise", /Surprise brunch/.test(o.html()) && /🤫 a surprise — only you see this/.test(o.text()));
  W.bmEat("10:30"); W.bmDish(""); W.bmDishSet("name", DISH); W.bmWhere("oven"); W.bmDishSet("m", "20"); W.bmDishSet("temp", "400"); W.bmDishSave();
  const paths = o.writes.reduce((a, w) => a.concat(Object.keys(w.val)), []);
  ok("every path it wrote starts seasonSecret/", paths.length === 3 && paths.every(p => /^seasonSecret\/xmas\/s1\/(meal|food)\//.test(p)), paths);
  ok("its words and its dish are nowhere in seasons/ (what the kids' page reads)", JSON.stringify(T.data()).indexOf(DISH) < 0 && JSON.stringify(T.data()).indexOf(SECRET) < 0 && JSON.stringify(o.writes).indexOf("seasons/ideas") < 0);
  ok("…and a 🤐 surprise has its own date: 10:10 AM Sun Dec 6", /Sun Dec 6/.test(o.text()) && /10:10 AM Grandpa's waffles/.test(o.text()));
  W.bmClose();
}

console.log("\n# nothing without the Mom switch");
{
  const p = world(); p.set(SEASON(IDEAS({ eat: "16:00" })), {}, EV()); p.mom = false;
  const kids0 = p.body.children.length;
  p.W.bmOpen("xmas", "t1");
  ok("Mom switch off → bmOpen draws nothing and makes no layer", !p.layer() && p.body.children.length === kids0);
  ok("…and attaches nothing, writes nothing", p.on.length === 0 && p.writes.length === 0);
  p.mom = true; p.W.bmOpen("xmas", "t1"); ok("switch on → it opens", /Thanksgiving/.test(p.html()));
  p.mom = false; p.W.bmRefresh();
  ok("the switch goes off while it's open → the next redraw closes it (nothing left on screen)", p.html() === "" && p.layer().style.display === "none" && p.B.state().sid === null);
  p.mom = true; p.W.bmOpen("xmas", "t1"); p.W.bmDish(""); p.mom = false; p.W.bmRefresh();
  ok("…even while a dish pop-up is open", p.html() === "" && p.B.state().ed === null);
  p.W.bmEat("17:00"); p.W.bmDishSave();
  ok("…and a stray tap afterwards writes nothing", p.writes.length === 0);
  p.mom = true; p.W.bmOpen("xmas", "nope"); ok("an idea that doesn't exist → nothing opens", p.B.state().sid === null);
}

console.log("\n# the planner's data changes (another device) → the open page follows");
{
  const p = world(); p.set({}, {}, EV()); p.W.renderSeasons(p.root, "");
  const cb = (k, v) => p.cbs[k]({ val: () => JSON.parse(JSON.stringify(v)) });
  cb("seasons", SEASON(IDEAS({ eat: "16:00" }, foodMap([dish("Turkey", "oven", 240, "325")])))); cb("seasonSecret", {});
  p.W.bmOpen("xmas", "t1");
  ok("open with one dish", /12:00 PM Turkey/.test(p.text()) && !/Gravy/.test(p.text()));
  cb("seasons", SEASON(IDEAS({ eat: "16:00" }, foodMap([dish("Turkey", "oven", 240, "325"), dish("Gravy", "stove", 15)]))));
  ok("a dish added on another device appears (the listener hook)", /3:45 PM Gravy/.test(p.text()));
  p.W.bmDish("f00"); p.W.bmDishSet("temp", "300");
  cb("seasons", SEASON(IDEAS({ eat: "17:00" }, foodMap([dish("Turkey", "oven", 240, "325")]))));
  ok("…but never while she is typing in a dish pop-up (what she typed stays)", p.B.state().ed && p.B.state().ed.form.temp === "300" && /bm-sheet/.test(p.html()) && !/value="17:00"/.test(p.html()));
  p.W.bmDishCancel();
  ok("…and it catches up when the pop-up closes", /value="17:00"/.test(p.html()) && /1:00 PM Turkey/.test(p.text()));
  cb("seasonJobs", {}); ok("the jobs listener's hook doesn't break anything", /1:00 PM Turkey/.test(p.text()));
  cb("seasons", SEASON({ z1: { t: "Ice skating", by: "mom", ts: 4 } }));
  ok("the idea deleted on another device → “That meal is gone.” with ← Back", /That meal is gone\./.test(p.html()) && /bmClose\(\)/.test(p.html()));
}

console.log("\n# the files");
{
  const code = BM.replace(/^\s*\/\/.*$/gm, "");
  ok("bigmeal.js has no database call of its own (no db / ref / on / set)", !/\bdb\b|\.ref\(|firebase/.test(code));
  ok("…no setInterval (and no timer at all in slice 1)", !/setInterval|setTimeout/.test(code));
  ok("…names no other node's path: kitchen/ calendar/ momday dadday seasonJobs gifts", !/kitchen\/|calendar\/|momday|dadday|seasonJobs|gifts/.test(code));
  ok("…no family's names", !/Lincoln|Ellis|Lucy|Julian|Howe|Burris|DeWalt|Dewalt|Melanie|Sara\b|Adrienne|Andrew/.test(BM));
  ok("…never reads the planner's test hook", !/_snTest/.test(code) && /window\._snApi/.test(code));
  ok("…every global from the page it uses is typeof-guarded (momHere, mwToast)", /typeof momHere==="function"/.test(code) && /typeof mwToast==="function"/.test(code) && !/[^.\w]_todayStr|[^.\w]_dryRun|[^.\w]HA_LS|[^.\w]renderAll/.test(code));
  ok("…its handlers on window exist for every onclick/oninput/onchange it draws", (() => { const names = new Set(); (code.match(/on(click|input|change)=\\?"([A-Za-z_$][\w$]*)\(/g) || []).forEach(m => names.add(m.replace(/.*"/, "").replace("(", ""))); names.delete("if"); return names.size >= 10 && [...names].every(n => typeof W[n] === "function"); })(), (() => { const names = new Set(); (code.match(/on(click|input|change)=\\?"([A-Za-z_$][\w$]*)\(/g) || []).forEach(m => names.add(m.replace(/.*"/, "").replace("(", ""))); names.delete("if"); return [...names].filter(n => typeof W[n] !== "function").concat([names.size]); })());
  const sc = SN.replace(/^\s*\/\/.*$/gm, "");
  ok("seasons.js still has exactly 5 database calls", (sc.match(/db\.ref\(/g) || []).length === 5);
  const okSrc = "^(seasons\\/(list|ideas|extra)\\/[^\\/]+|seasonSecret\\/[^\\/]+\\/[^\\/]+|calendar\\/events\\/[^\\/]+|(momday|dadday)\\/\\d{4}-\\d{2}-\\d{2}\\/todos\\/sn[^\\/]+|seasonJobs\\/[^\\/]+\\/[^\\/]+)(\\/|$)";
  ok("…and the same SN_OK guard, letter for letter", T.OK.source === okSrc, T.OK.source);
  ok("…its new names don't clash with anything in the app", (() => { const H = fs.readFileSync(path.join(__dirname, "index.html"), "utf8"); return ["snMeal", "bmLoad", "bmHook", "eatTxt", "_snApi", "bigmeal", "bmOpen", "bmDraw", "_bmTest", "BM_OK"].every(n => !new RegExp("\\b" + n + "\\b").test(H)); })());
  ok("index.html never names the new file (0 bytes there)", !/bigmeal/.test(fs.readFileSync(path.join(__dirname, "index.html"), "utf8")));
}

console.log("\n# an idea with no meal looks exactly as before (apart from the ⏱ buttons)");
if (!OLD_SN) console.log("  skip — origin/main:seasons.js not readable here");
else {
  const strip = h => h.replace(/<button class="sn-tool" onclick="snMeal\('[^']*'\)">⏱ (Cooking timeline|Timeline)<\/button>/g, "");
  const data = SEASON(IDEAS(undefined, foodMap([dish("Rolls", "", null, "", { mid: "m_rolls" }), dish("Popcorn")]))); delete data.ideas.xmas.b1.meal; const N = world(), O = world({ sn: OLD_SN, noBm: true });
  [N, O].forEach(x => x.set(data, { xmas: { s1: { t: "Secret", by: "mom", hide: "hint", ts: 9, food: { f: { name: "Cake", ts: 1 } } } } }, EV()));
  const pageOf = (x, f) => { f(x); x.T.draw(); return x.root.innerHTML; };
  ok("💡 Ideas list: identical", pageOf(N, () => {}) === pageOf(O, () => {}));
  ok("🍿 Food view: identical once the ⏱ Timeline buttons are taken out", strip(pageOf(N, x => x.W.snViewSet("food"))) === strip(pageOf(O, x => x.W.snViewSet("food"))) && /⏱ Timeline/.test(pageOf(N, () => {})));
  ok("the idea pop-up: identical once ⏱ Cooking timeline is taken out — and the button sits right after ＋ Add food", strip(pageOf(N, x => { x.W.snViewSet("ideas"); x.W.snOpenIdea("t1"); })) === strip(pageOf(O, x => { x.W.snViewSet("ideas"); x.W.snOpenIdea("t1"); }))
    && /＋ Add food<\/button><button class="sn-tool" onclick="snMeal\('t1'\)">⏱ Cooking timeline<\/button><\/div>/.test(N.root.innerHTML));
  ok("✅ To-dos and 🧺 Supplies views: identical", ["todo", "sup"].every(v => pageOf(N, x => { x.W.snCancel(); x.W.snViewSet(v); }) === pageOf(O, x => { x.W.snCancel(); x.W.snViewSet(v); })));
  const M = world(); M.set(SEASON(IDEAS({ eat: "16:00" })), {}, EV()); M.W.snViewSet("ideas"); M.T.draw();
  ok("an idea WITH an eat time gets a chip on its row: “⏱ eat 4:00 PM”; the others don't", /⏱ eat 4:00 PM/.test(M.root.innerHTML) && (M.root.innerHTML.match(/⏱ eat/g) || []).length === 2);
  M.W.snViewSet("food"); M.T.draw(); ok("…and in the 🍿 Food view's header", (M.root.innerHTML.match(/⏱ eat 4:00 PM/g) || []).length === 1 && /⏱ eat 8:30 AM/.test(M.root.innerHTML));
}

console.log("\n# the loader (seasons.js) — and the planner keeps working if bigmeal.js can't load");
{
  const p = world({ noBm: true }); p.set(SEASON(IDEAS({ eat: "16:00" })), {}, EV());
  p.W.snOpenIdea("t1"); p.W.snSet("t", "Thanksgiving feast"); p.W.snMeal("t1");
  ok("⏱ from the idea pop-up saves what she typed in the idea first, then closes it", p.writes.length === 1 && p.writes[0].val["seasons/ideas/xmas/t1/t"] === "Thanksgiving feast" && p.T.edit() === null);
  ok("…and adds ONE script tag: bigmeal.js (no cache-bust off GitHub Pages)", p.scripts.length === 1 && p.scripts[0].src === "bigmeal.js");
  p.W.snMeal("t1"); ok("a second tap while it loads adds no second tag", p.scripts.length === 1);
  p.scripts[0].onerror();
  ok("it fails to load → a plain toast, nothing else happens", /Couldn’t load the cooking timeline/.test(p.toasts.join("|")) && !p.layer());
  p.W.snQuickAdd && (p.nodes["sn-new"] = { value: "Sledding" }); p.W.snQuickAdd(); p.W.snViewSet("ideas"); p.T.draw();
  ok("…the planner still works (an idea added, the page drawn)", /Sledding/.test(p.root.innerHTML));
  p.W.snMeal("t1"); ok("…and the next tap tries again", p.scripts.length === 2);
  vm.runInContext(BM, p.W); p.scripts[1].onload();
  ok("it loads → the meal page opens on that idea", !!p.W._bmTest && p.W._bmTest.state().iid === "t1" && /Thanksgiving feast/.test(p.html()));
  p.W.bmClose(); p.W.snMeal("b1"); ok("once loaded, a tap opens straight away (no new tag)", p.scripts.length === 2 && p.W._bmTest.state().iid === "b1");
  const g = world({ noBm: true }); g.W.location.hostname = "family.github.io"; g.set(SEASON(IDEAS()), {}, EV()); g.W.snMeal("t1");
  ok("on GitHub Pages it asks for a fresh copy (bigmeal.js?v=…), like seasons.js", /^bigmeal\.js\?v=\d+$/.test(g.scripts[0].src));
  const r = world({ oldPage: true }); r.set(SEASON(IDEAS({ eat: "16:00" })), {}, EV()); r.W.bmOpen("xmas", "t1"); r.W.bmDish("f00"); r.W.bmDishDel(); r.W.bmDishDel();
  ok("an older page with no mwToast: still opens and works (the planner's own toast is used)", /Thanksgiving/.test(r.html()) && r.writes.length === 1);
}

console.log("\n" + pass + " passed, " + fail + " failed");

process.exit(fail ? 1 : 0);
