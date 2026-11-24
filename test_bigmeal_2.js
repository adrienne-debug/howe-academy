/*
 * Node tests for 🍗 BIGMEAL slice 2 — rest and get-ready time, the "Heat the oven" step, the clash warnings and Your kitchen
 * (PLAN_holiday_menu_2026-11-24.md §4.4 + §6 slice 2).
 *   · the plan's three worked meals (§4.6 A, B, C) step by step to the minute, with exactly the two warnings in A and none in B and C
 *   · ready + prep + cook + rest = eat for 20,000 random dishes
 *   · the warnings: two temperatures, too many, a dish that fills the oven, two ovens, the slow cooker wanted twice, the stove,
 *     "I have 2"; NEVER a warning for dishes that only touch end to end, never one for a dish with no temperature, never a block
 *   · "Heat the oven" only for a cold oven · Your kitchen: her numbers, else the latest other meal's, else the defaults
 *   · the dish pop-up's new fields write only what changed
 *
 *   run:  node test_bigmeal_2.js
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
  const ctx = { console: { log() {}, warn() {} }, Date, Math, JSON, document, db, location: { hostname: "localhost" },
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
const N0 = () => B.kitN(null);
const P_ = (eat, list) => B.plan(B.clockMin(eat), list.map((d, i) => B.dishOf({ id: "f" + String(i).padStart(2, "0"), r: d })));
const seq = (eat, list) => B.steps(B.clockMin(eat), P_(eat, list)).map(s => B.fmtClock(s.at) + (B.dayShift(s.at) ? "@" + B.dayShift(s.at) : "") + " " + s.k + (s.d && s.k !== "heat" ? " " + s.d.name : "")).join("|");
const warns = (eat, list, n) => B.clashes(P_(eat, list), Object.assign(N0(), n || {}));
const A2 = [dish("Turkey", "oven", 240, "325", { prep: 20, rest: 45, big: true }), dish("Mac and cheese", "slow", 150, "high", { prep: 15 }), dish("Mashed potatoes", "slow", 120, "low"),
  dish("Stuffing", "oven", 45, "350"), dish("Sweet potato casserole", "oven", 30, "350"), dish("Green beans", "stove", 15, "", { prep: 10 }), dish("Gravy", "stove", 15),
  dish("Rolls", "oven", 12, "400"), dish("Cranberry sauce", "none"), dish("Pumpkin pie", "none")];
const B2 = [dish("Hash-brown casserole", "slow", 540, "low"), dish("French toast casserole", "oven", 45, "350", { rest: 10 }), dish("Cinnamon rolls", "oven", 20, "375"),
  dish("Bacon", "air", 10, "375"), dish("Scrambled eggs", "stove", 8), dish("Fruit salad", "none")];
const C2 = [dish("Pulled pork", "slow", 480, "low", { prep: 10, rest: 15 }), dish("Mac and cheese", "oven", 30, "350"), dish("Garlic bread", "oven", 10, "350"),
  dish("Corn on the cob", "stove", 10, "", { prep: 5 }), dish("Coleslaw", "none")];

console.log("\n# the plan's worked meals, step by step");
{
  ok("A · Thanksgiving, eat 4:00 PM — every step to the minute (§4.6 A)", seq("4:00 PM", A2) === "10:55 AM r Turkey|11:00 AM heat|11:15 AM i Turkey|1:15 PM r Mac and cheese|1:30 PM i Mac and cheese|2:00 PM i Mashed potatoes|3:15 PM o Turkey|3:15 PM i Stuffing|3:30 PM i Sweet potato casserole|3:35 PM r Green beans|3:45 PM i Gravy|3:45 PM i Green beans|3:48 PM i Rolls|4:00 PM eat", seq("4:00 PM", A2));
  const wa = warns("4:00 PM", A2);
  ok("…exactly two warnings: two oven temperatures 3:48–4:00, the slow cooker twice 2:00–4:00", wa.length === 2 && wa[0].k === "one" && wa[0].key === "slow" && B.fmtClock(wa[0].from) === "2:00 PM" && B.fmtClock(wa[0].to) === "4:00 PM"
    && wa[1].k === "temp" && B.fmtClock(wa[1].from) === "3:48 PM" && B.fmtClock(wa[1].to) === "4:00 PM", wa.map(c => c.k + c.key + B.fmtClock(c.from)));
  ok("…in plain words", B.warnText(wa[1], N0(), "") === "From 3:48 PM to 4:00 PM, the oven needs 350° for Stuffing and Sweet potato casserole and 400° for Rolls. One oven can’t do both."
    && B.warnText(wa[0], N0(), "") === "From 2:00 PM to 4:00 PM, 2 dishes want the slow cooker: Mac and cheese and Mashed potatoes.", [B.warnText(wa[1], N0(), ""), B.warnText(wa[0], N0(), "")]);
  ok("…no warning at 3:15: the turkey comes out the same minute the stuffing goes in (its rest frees the oven)", !wa.some(c => c.from <= B.clockMin("3:15 PM") && c.to > B.clockMin("3:15 PM") && c.key === "oven"));
  ok("…and no second “Heat the oven” at 3:15 (the oven is still hot)", seq("4:00 PM", A2).split("heat").length === 2);
  ok("B · Christmas breakfast, eat 8:30 AM (§4.6 B)", seq("8:30 AM", B2) === "11:30 PM@-1 i Hash-brown casserole|7:20 AM heat|7:35 AM i French toast casserole|8:10 AM i Cinnamon rolls|8:20 AM o French toast casserole|8:20 AM i Bacon|8:22 AM i Scrambled eggs|8:30 AM eat", seq("8:30 AM", B2));
  ok("…nothing clashes (350° and 375° share the oven)", warns("8:30 AM", B2).length === 0);
  ok("C · Birthday dinner, eat 6:00 PM (§4.6 C)", seq("6:00 PM", C2) === "9:35 AM r Pulled pork|9:45 AM i Pulled pork|5:15 PM heat|5:30 PM i Mac and cheese|5:45 PM o Pulled pork|5:45 PM r Corn on the cob|5:50 PM i Garlic bread|5:50 PM i Corn on the cob|6:00 PM eat", seq("6:00 PM", C2));
  ok("…nothing clashes", warns("6:00 PM", C2).length === 0);
  ok("the eat row lists only what to put out; a dish that rested is already out", (() => { const S = B.steps(960, P_("4:00 PM", A2)); const e = S[S.length - 1]; return e.put.join() === "Cranberry sauce,Pumpkin pie" && e.out.indexOf("Turkey") < 0 && e.out.indexOf("Rolls") >= 0; })());
  let bad = 0;
  for (let i = 0; i < 20000; i++) { const eat = Math.floor(Math.random() * 1440), c = 1 + Math.floor(Math.random() * 2880), r = Math.floor(Math.random() * 241), p = Math.floor(Math.random() * 601);
    const d = B.plan(eat, [B.dishOf({ id: "x", r: { name: "x", where: "oven", cook: c, rest: r, prep: p } })])[0];
    if ((p ? d.ready + p : d.in) + c + r !== eat || d.out + r !== eat || (p ? d.ready !== d.in - p : d.ready !== null)) bad++; }
  ok("20,000 random dishes: start getting ready + get-ready + cook + rest = eat, every one", bad === 0, bad);
  ok("a no-cooking dish that needs getting ready starts at eat − its minutes; one without doesn't get a row", (() => { const P = P_("4:00 PM", [dish("Salad", "none", null, "", { prep: 15 }), dish("Pie", "none")]); return B.fmtClock(P[0].ready) === "3:45 PM" && P[1].ready === null; })());
  ok("a dish not timed yet never gets a start row, even with get-ready minutes", P_("4:00 PM", [dish("Ham", "oven", null, "", { prep: 30 })])[0].ready === null);
}

console.log("\n# the warnings");
{
  const ov = (name, cook, temp, x) => dish(name, "oven", cook, temp, x);
  ok("350° + 375° together → no warning (25° apart share an oven)", warns("4:00 PM", [ov("A", 60, "350"), ov("B", 30, "375")]).length === 0);
  const t = warns("4:00 PM", [ov("A", 60, "350"), ov("B", 30, "400")]);
  ok("350° + 400° together → a temperature warning", t.length === 1 && t[0].k === "temp");
  ok("…two ovens fix it", warns("4:00 PM", [ov("A", 60, "350"), ov("B", 30, "400")], { oven: 2 }).length === 0);
  ok("…three temperatures in two ovens → still one, in words", (() => { const c = warns("4:00 PM", [ov("A", 60, "300"), ov("B", 30, "375"), ov("C", 20, "450")], { oven: 2 }); return c.length === 1 && c[0].k === "temp" && /Your 2 ovens can’t do 3 temperatures at once\./.test(B.warnText(c[0], Object.assign(N0(), { oven: 2 }), "")); })());
  const f = warns("4:00 PM", [ov("A", 60, "350"), ov("B", 60, "350"), ov("C", 60, "350")]);
  ok("three 350° dishes, 2 fit at once → “too many”", f.length === 1 && f[0].k === "full" && /3 dishes are in the oven: A, B and C\. Your oven fits 2 at once\./.test(B.warnText(f[0], N0(), "")));
  ok("…3 at once fits them", warns("4:00 PM", [ov("A", 60, "350"), ov("B", 60, "350"), ov("C", 60, "350")], { spots: 3 }).length === 0);
  const bg = warns("4:00 PM", [ov("Turkey", 240, "325", { big: true }), ov("Rolls", 12, "325")]);
  ok("a dish that fills the oven + any other dish → a warning that says so", bg.length === 1 && bg[0].k === "full" && /Turkey fills a whole oven\./.test(B.warnText(bg[0], N0(), "")));
  ok("a dish with no temperature is never in a temperature warning (it fits with any)", warns("4:00 PM", [ov("A", 60, "350"), ov("B", 30, "")]).length === 0 && warns("4:00 PM", [ov("A", 60, ""), ov("B", 30, "")]).length === 0);
  ok("…but it still takes room", warns("4:00 PM", [ov("A", 60, "350"), ov("B", 60, "350"), ov("C", 30, "")]).map(c => c.k).join() === "full");
  ok("NEVER a warning for dishes that only touch end to end", warns("4:00 PM", [ov("A", 60, "300", { rest: 60 }), ov("B", 60, "450")]).length === 0);
  ok("the slow cooker wanted twice → a warning; “I have 2” covers it", warns("4:00 PM", [dish("A", "slow", 120), dish("B", "slow", 60)]).length === 1 && warns("4:00 PM", [dish("A", "slow", 120), dish("B", "slow", 60)], { slow: 2 }).length === 0);
  ok("air fryer, pressure cooker, grill and microwave each count", ["air", "pot", "grill", "micro"].every(w => warns("4:00 PM", [dish("A", w, 30), dish("B", w, 20)]).length === 1));
  ok("her own “something else”: one each, per name", warns("4:00 PM", [dish("A", "x", 60, "", { whereTxt: "Roaster" }), dish("B", "x", 30, "", { whereTxt: "roaster" })]).length === 1 && warns("4:00 PM", [dish("A", "x", 60, "", { whereTxt: "Roaster" }), dish("B", "x", 30, "", { whereTxt: "Smoker" })]).length === 0);
  const st = warns("4:00 PM", [1, 2, 3, 4, 5].map(i => dish("Pot " + i, "stove", 15)));
  ok("5 dishes on 4 burners → a stove warning in words", st.length === 1 && st[0].k === "stove" && /5 dishes are on the stove: .*\. You have 4 burners\./.test(B.warnText(st[0], N0(), "")));
  ok("the same warning over touching moments is ONE warning from–to", (() => { const c = warns("4:00 PM", [dish("A", "slow", 240), dish("B", "slow", 120), dish("C", "stove", 30)]); return c.length === 1 && B.fmtClock(c[0].from) === "2:00 PM" && B.fmtClock(c[0].to) === "4:00 PM"; })());
  ok("no eat time → no warnings", B.clashes(B.plan(null, A2.map((d, i) => B.dishOf({ id: "f" + i, r: d }))), N0()).length === 0);
}

console.log("\n# Heat the oven — only a cold oven");
{
  ok("one oven dish → heat 15 min before it goes in", seq("4:00 PM", [dish("Rolls", "oven", 12, "400")]) === "3:33 PM heat|3:48 PM i Rolls|4:00 PM eat");
  ok("a dish going in while another is in the oven → no heat step", seq("4:00 PM", [dish("A", "oven", 60, "350"), dish("B", "oven", 30, "350")]).split("heat").length === 2);
  ok("the oven was empty for an hour → heat again", seq("6:00 PM", [dish("A", "oven", 60, "350", { rest: 120 }), dish("B", "oven", 30, "350")]) === "2:45 PM heat|3:00 PM i A|4:00 PM o A|5:15 PM heat|5:30 PM i B|6:00 PM eat", seq("6:00 PM", [dish("A", "oven", 60, "350", { rest: 120 }), dish("B", "oven", 30, "350")]));
  ok("two going in together → one heat step", seq("4:00 PM", [dish("A", "oven", 30, "350"), dish("B", "oven", 30, "350")]).split("heat").length === 2);
  ok("a slow cooker or air fryer never gets a heat step", seq("4:00 PM", [dish("A", "slow", 120), dish("B", "air", 10, "400")]).indexOf("heat") < 0);
  ok("no temperature → “Heat the oven” with no number", (() => { o.set(SEASON(IDEAS({ eat: "16:00" }, foodMap([dish("Ham", "oven", 90)]))), {}, EV()); W.bmOpen("xmas", "t1"); const t = o.text(); W.bmClose(); return /2:15 PM Heat the oven 2:30 PM/.test(t); })());
}

console.log("\n# the page: warnings, ✓, Your kitchen");
{
  o.set(SEASON(IDEAS({ eat: "16:00", ts: 1 }, foodMap(A2))), {}, EV());
  W.bmOpen("xmas", "t1"); let t = o.text();
  ok("the warnings show above the lists, with “I have 2” on the slow cooker one", /⚠ From 3:48 PM to 4:00 PM, the oven needs 350°/.test(t) && /bmHave\('slow',2\)">I have 2/.test(o.html()) && t.indexOf("⚠") < t.indexOf("When to start"));
  ok("…and say they're only warnings", /These are only warnings/.test(t));
  ok("the steps read plainly: start, heat, comes out · rests", /10:55 AM Start Turkey \( ?20 min to get it ready\)/.test(t) && /11:00 AM Heat the oven to 325°/.test(t) && /3:15 PM Turkey comes out · rests 45 min/.test(t));
  ok("the turkey's row: 20 min to get ready · rests 45 min · fills the oven · in at 11:15 AM · out 3:15 PM", /Turkey 325° · 4 h · 20 min to get ready · rests 45 min · fills the oven · in at 11:15 AM · out 3:15 PM/.test(t), t.slice(t.indexOf("Turkey 325"), t.indexOf("Turkey 325") + 140));
  ok("opening still writes nothing", o.writes.length === 0);
  W.bmHave("slow", 2);
  ok("“I have 2” writes ONLY meal/n/slow = 2", o.writes.length === 1 && JSON.stringify(o.writes[0].val) === '{"seasons/ideas/xmas/t1/meal/n/slow":2}', o.writes);
  ok("…and the slow cooker warning is gone, the oven one stays", !/slow cooker: Mac/.test(o.text()) && /the oven needs 350°/.test(o.text()) && /Also: 2 × slow cooker \(crockpot\)/.test(o.text()));
  o.writes.length = 0; W.bmKit("oven", 1);
  ok("＋ on Ovens → meal/n/oven = 2, and with 2 ovens nothing clashes", o.writes.length === 1 && JSON.stringify(o.writes[0].val) === '{"seasons/ideas/xmas/t1/meal/n/oven":2}' && /✓ Nothing clashes\./.test(o.text()));
  o.writes.length = 0; W.bmKit("oven", -1); W.bmKit("oven", -1);
  ok("− stops at 1 (the button is greyed and a tap past it writes nothing)", o.writes.length === 1 && /bmKit\('oven',-1\)" disabled/.test(o.html()));
  o.writes.length = 0; W.bmHave("oven", 0); W.bmHave("oven", 9); W.bmHave("nope", 2);
  ok("a number out of range or an unknown appliance writes nothing", o.writes.length === 0);
  W.bmDish(""); W.bmDishSet("name", "Extra rolls"); W.bmWhere("oven"); W.bmDishSet("m", "12"); W.bmDishSet("temp", "450"); W.bmDishSave();
  ok("NEVER a block: a dish that makes a new warning still saves", o.writes.length === 1 && /Extra rolls/.test(o.text()));
  W.bmClose();
}

console.log("\n# Your kitchen: her numbers, else the latest other meal's, else the defaults");
{
  o.set(SEASON(IDEAS({ eat: "16:00", ts: 5 }, foodMap(A2), { c1: { t: "Birthday dinner", by: "mom", ts: 6, meal: { eat: "18:00", ts: 9, n: { oven: 2, spots: 3 } }, food: {} } })), {}, EV());
  const K = B.kitchenOf(T.idea("xmas", "t1"));
  ok("a meal with no numbers shows the newest other meal's (2 ovens, 3 at once) — nothing saved", K.from === "copy" && K.n.oven === 2 && K.n.spots === 3 && K.n.stove === 4 && o.writes.length === 0);
  W.bmOpen("xmas", "t1");
  ok("…the page says where they came from", /Same as Birthday dinner\. Change it here for this meal\./.test(o.text()));
  W.bmKit("stove", 1);
  ok("her first change saves those numbers too, so nothing jumps", o.writes.length === 1 && JSON.stringify(Object.keys(o.writes[0].val).sort()) === JSON.stringify(["seasons/ideas/xmas/t1/meal/n/oven", "seasons/ideas/xmas/t1/meal/n/spots", "seasons/ideas/xmas/t1/meal/n/stove"]) && o.writes[0].val["seasons/ideas/xmas/t1/meal/n/stove"] === 5);
  ok("…now it's her own", B.kitchenOf(T.idea("xmas", "t1")).from === "own");
  W.bmClose();
  ok("no meal anywhere has numbers → the defaults: 1 oven, 2 at once, 4 burners, 1 of everything else", (() => { const n = B.kitN(null); return n.oven === 1 && n.spots === 2 && n.stove === 4 && ["slow", "air", "pot", "grill", "micro"].every(k => n[k] === 1); })());
  ok("bad stored numbers fall back to the defaults (never 0 ovens)", (() => { const n = B.kitN({ oven: 0, spots: "x", stove: 99, slow: -1 }); return n.oven === 1 && n.spots === 2 && n.stove === 4 && n.slow === 1; })());
}

console.log("\n# the dish pop-up's new fields");
{
  o.set(SEASON(IDEAS({ eat: "16:00", ts: 1 }, { f1: { name: "Turkey", where: "oven", cook: 240, temp: "325", ts: 3, menu: { "2026-11-26": { s: "d", mid: "m_turkey" } } } })), {}, EV());
  W.bmOpen("xmas", "t1"); W.bmDish("f1");
  ok("an oven dish asks for get-ready, rest, “fills the whole oven” and a note", /Minutes to get it ready first/.test(o.html()) && /Minutes it rests after/.test(o.html()) && /It fills the whole oven/.test(o.html()) && /Note \(optional\)/.test(o.html()));
  W.bmDishSet("prep", "20"); W.bmDishSet("rest", "45"); W.bmDishSet("big", "1"); W.bmDishSet("note", "Baste every 45 min"); W.bmDishSave();
  const v = o.writes[0] && o.writes[0].val;
  ok("saving writes only the four new fields", !!v && Object.keys(v).sort().join() === "seasons/ideas/xmas/t1/food/f1/big,seasons/ideas/xmas/t1/food/f1/note,seasons/ideas/xmas/t1/food/f1/prep,seasons/ideas/xmas/t1/food/f1/rest" && v["seasons/ideas/xmas/t1/food/f1/big"] === true, v);
  ok("…its Menu note survives", !!T.data().ideas.xmas.t1.food.f1.menu);
  o.writes.length = 0; W.bmDish("f1"); W.bmDishSet("prep", "601"); W.bmDishSave();
  ok("get-ready over 600 → refused", o.writes.length === 0 && /0 to 600 minutes/.test(o.html()));
  W.bmDishSet("prep", "20"); W.bmDishSet("rest", "241"); W.bmDishSave();
  ok("rest over 240 → refused", o.writes.length === 0 && /0 to 240 minutes/.test(o.html()));
  W.bmDishSet("rest", "lots"); W.bmDishSave(); ok("words → refused, never read as 0", o.writes.length === 0);
  W.bmDishSet("rest", "45"); W.bmWhere("stove"); W.bmDishSave();
  ok("moving it to the stove clears “fills the oven” (and its temperature stays as she typed)", o.writes.length === 1 && o.writes[0].val["seasons/ideas/xmas/t1/food/f1/big"] === null && o.writes[0].val["seasons/ideas/xmas/t1/food/f1/where"] === "stove");
  o.writes.length = 0; W.bmDish("f1"); W.bmWhere("none"); W.bmDishSave();
  ok("🧊 no cooking keeps get-ready, clears rest", o.writes.length === 1 && o.writes[0].val["seasons/ideas/xmas/t1/food/f1/rest"] === null && !("seasons/ideas/xmas/t1/food/f1/prep" in o.writes[0].val));
  W.bmClose();
  ok("dishOf: rest on a no-cooking dish → 0 · “fills the oven” only for the oven, only true", B.dishOf({ id: "a", r: { name: "a", where: "none", rest: 30 } }).rest === 0 && B.dishOf({ id: "a", r: { name: "a", where: "stove", cook: 5, big: true } }).big === false && B.dishOf({ id: "a", r: { name: "a", where: "oven", cook: 5, big: "true" } }).big === false);
}

console.log("\n# the files still keep their promises");
{
  const code = BM.replace(/^\s*\/\/.*$/gm, "");
  ok("bigmeal.js: no database call, no timer, no other node's path", !/\bdb\b|\.ref\(|setInterval/.test(code) && (code.match(/setTimeout\(/g) || []).length <= 1 && !/kitchen\/|calendar\/|momday|dadday|seasonJobs|gifts/.test(code));
  ok("…every drawn handler exists on window (bmHave, bmKit too)", (() => { const names = new Set(); (code.match(/on(click|input|change)=\\?"([A-Za-z_$][\w$]*)\(/g) || []).forEach(m => names.add(m.replace(/.*"/, "").replace("(", ""))); names.delete("if"); return names.has("bmHave") && names.has("bmKit") && [...names].every(n => typeof W[n] === "function"); })());
  ok("…the only new write path is meal/n/<appliance> — still inside BM_OK", B.OK.test("seasons/ideas/xmas/t1/meal/n/slow") && !B.OK.test("seasons/ideas/xmas/t1/n/slow"));
  ok("…no family's names", !/Lincoln|Ellis|Lucy|Julian|Howe|Burris|DeWalt|Dewalt|Melanie|Sara\b|Adrienne|Andrew/.test(BM));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
