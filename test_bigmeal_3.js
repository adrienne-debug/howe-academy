/*
 * Node tests for 🍗 BIGMEAL slice 3 — before the day: made ahead, who brings what, who makes it, thaw
 * (PLAN_holiday_menu_2026-11-24.md §4.5 + §6 slice 3).
 *   · the plan's Thanksgiving dates (Sun Nov 22 thaw · Tue Nov 24 cranberry · Wed Nov 25 mashed potatoes · Grandma: pie)
 *   · dates follow the meal's day (nothing stored as a date) · no day → "N days before", no date, no ticks
 *   · pounds → days (1 day per 4 lb) · warm-ups on the day · brought dishes have no 🛒 · who and whoTxt never both
 *   · ticks live under meal/tick/<meal day>/… and a moved day starts clean
 *   · NEVER a guest's name outside the idea; a kid as maker makes no job, no stars, no other write
 *
 *   run:  node test_bigmeal_3.js
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
const A3 = [dish("Turkey", "oven", 240, "325", { prep: 20, rest: 45, big: true, thaw: { days: 4, lb: 16 }, who: "dad" }), dish("Mac and cheese", "slow", 150, "high", { prep: 15 }),
  dish("Mashed potatoes", "slow", 120, "low", { how: "ahead", days: 1 }), dish("Stuffing", "oven", 45, "350"), dish("Sweet potato casserole", "oven", 30, "350", { who: "ava" }),
  dish("Green beans", "stove", 15, "", { prep: 10 }), dish("Gravy", "stove", 15), dish("Rolls", "oven", 12, "400"),
  dish("Cranberry sauce", "", null, "", { how: "ahead", days: 2 }), dish("Pumpkin pie", "", null, "", { how: "bring", whoTxt: "Grandma" }), dish("Drinks", "", null, "", { how: "bring" })];
const D_ = list => list.map((d, i) => B.dishOf({ id: "f" + String(i).padStart(2, "0"), r: d }));
const fmtB = (b) => b.list.map(x => (x.day ? x.day.slice(5) : "-") + " " + x.k + " " + x.d.name).join("|");

console.log("\n# before the day — the plan's Thanksgiving (§4.5, §4.6 A)");
{
  const b = B.before(D_(A3), "2026-11-26");
  ok("Sun Nov 22 turkey to the fridge · Tue Nov 24 cranberry sauce · Wed Nov 25 mashed potatoes — in that order", fmtB(b) === "11-22 t Turkey|11-24 a Cranberry sauce|11-25 a Mashed potatoes", fmtB(b));
  ok("who brings what: Grandma: Pumpkin pie, and Drinks with nobody yet (last)", b.bring.map(g => (g.name || "?") + ":" + g.dishes.map(d => d.name).join()).join("|") === "Grandma:Pumpkin pie|?:Drinks");
  const b2 = B.before(D_(A3), "2026-11-27");
  ok("the meal's day moves → every date moves with it", fmtB(b2) === "11-23 t Turkey|11-25 a Cranberry sauce|11-26 a Mashed potatoes");
  ok("no day → the lines still list, with no date", fmtB(B.before(D_(A3), "")) === "- t Turkey|- a Cranberry sauce|- a Mashed potatoes");
  ok("pounds → days: 16 lb → 4 · 12 → 3 · 20 → 5 · 3 → 1 · 41 → 10 (never more) · 0 or 61 or words → none", B.thawDays(16) === 4 && B.thawDays(12) === 3 && B.thawDays(20) === 5 && B.thawDays(3) === 1 && B.thawDays(41) === 10 && [0, 61, "x", ""].every(v => B.thawDays(v) === null));
  const P = B.plan(960, D_(A3)), S = B.steps(960, P), e = S[S.length - 1];
  ok("a made-ahead dish with a warm-up is on the day's list as a warm-up", S.some(x => x.k === "i" && x.d.name === "Mashed potatoes" && B.fmtClock(x.at) === "2:00 PM"));
  ok("…one without a warm-up is only in “Put out” (with the brought dishes)", e.put.join() === "Cranberry sauce,Pumpkin pie,Drinks" && !S.some(x => x.d && x.d.name === "Cranberry sauce"));
  ok("…and none of them is “Not timed yet”", B.notTimed(P).length === 0);
  ok("a dish someone brings never gets a thaw line", B.dishOf({ id: "x", r: { name: "Ham", how: "bring", thaw: { days: 3 } } }).thaw === null);
  ok("who: a person in the family, else a typed guest — never both", (() => { const d = B.dishOf({ id: "x", r: { name: "A", who: "dad", whoTxt: "Grandma" } }), g = B.dishOf({ id: "x", r: { name: "A", who: "nobody", whoTxt: "Grandma" } }); return d.who === "dad" && d.whoTxt === "" && g.who === "" && g.whoTxt === "Grandma"; })());
  ok("made ahead: 1–14 days, a bad number reads as 1 (never 0)", B.dishOf({ id: "x", r: { name: "A", how: "ahead", days: 0 } }).days === 1 && B.dishOf({ id: "x", r: { name: "A", how: "ahead", days: 20 } }).days === 1 && B.dishOf({ id: "x", r: { name: "A", how: "ahead", days: 3 } }).days === 3);
}

console.log("\n# the page");
o.set(SEASON(IDEAS({ eat: "16:00", ts: 1 }, foodMap(A3))), {}, EV()); o.today = "2026-11-23";
{
  W.bmOpen("xmas", "t1"); const t = o.text();
  ok("🧊 Before the day: the dates in words", /Sun Nov 22 — Move Turkey to the fridge to thaw \(16 lb\) \(4 days before\)/.test(t) && /Tue Nov 24 — Make Cranberry sauce \(2 days before\)/.test(t) && /Wed Nov 25 — Make Mashed potatoes \(1 day before\)/.test(t), t.slice(t.indexOf("Before the day"), t.indexOf("Before the day") + 300));
  ok("…the thaw day went by and isn't ticked → “late”", /\(4 days before\) late/.test(t) && !/\(2 days before\) late/.test(t));
  ok("🚗 Who brings what: Grandma: Pumpkin pie · Nobody yet: Drinks", /Who brings what/.test(t) && /Grandma: Pumpkin pie/.test(t) && /Nobody yet: Drinks/.test(t));
  ok("the dish rows say who: “Dad makes it”, “Ava makes it”, “made 1 day before”, “Grandma brings it”, “someone brings it — who?”", /👩‍🍳 Dad makes it/.test(t) && /👩‍🍳 Ava makes it/.test(t) && /📦 made 1 day before/.test(t) && /🚗 Grandma brings it/.test(t) && /someone brings it — who\?/.test(t));
  ok("a warm-up reads “warm it up in the slow cooker”", /Mashed potatoes — warm it up in the slow cooker · low · 2 h/.test(t));
  ok("a brought dish has no 🛒 / 🧺", (() => { const h = o.html(), i = h.indexOf(">Pumpkin pie<"); const row = h.slice(i, h.indexOf('class="bm-dish"', i + 1)); return !/bmShop|bmBuy/.test(row); })());
  ok("opening writes nothing", o.writes.length === 0);
  W.bmTick("f00_t");
  ok("☐ on the thaw line → ONE write: meal/tick/2026-11-26/f00_t", o.writes.length === 1 && Object.keys(o.writes[0].val).join() === "seasons/ideas/xmas/t1/meal/tick/2026-11-26/f00_t" && typeof Object.values(o.writes[0].val)[0] === "number");
  ok("…it shows ✅, crossed off, no longer late", !/\(4 days before\) late/.test(o.text()) && /bm-row done/.test(o.html()));
  o.writes.length = 0; W.bmTick("f00_t");
  ok("tapping again un-ticks it (null)", o.writes.length === 1 && Object.values(o.writes[0].val)[0] === null);
  W.bmTick("f09_h"); ok("“it's here” on a brought dish", /Grandma: Pumpkin pie — it’s here/.test(o.text()));
  o.writes.length = 0; W.bmTick("../../calendar/events/x"); W.bmTick(""); W.bmTick("a/b");
  ok("a bad tick key writes nothing", o.writes.length === 0);
  o.today = "2026-11-24"; B.draw();
  ok("on its own day a line is not late yet (cranberry on Tue Nov 24); the day after, it is", !/\(2 days before\) late/.test(o.text()) && (o.today = "2026-11-25", B.draw(), /\(2 days before\) late/.test(o.text())));
  W.bmClose();
}

console.log("\n# a moved day starts clean · no day, no ticks");
{
  const ideas = IDEAS({ eat: "16:00", ts: 1, tick: { "2026-11-26": { f00_t: 5 } } }, foodMap(A3));
  o.set(SEASON(ideas), {}, Object.assign(EV(), { e1: { title: "Thanksgiving dinner", date: "2026-11-27", time: "", who: "family", emoji: "🦃" } }));
  W.bmOpen("xmas", "t1");
  ok("ticks from the old day don't count on the new day (Mon Nov 23 thaw, unticked)", /Mon Nov 23 — Move Turkey/.test(o.text()) && !/bm-row done/.test(o.html()) && JSON.stringify(B.ticksOf(T.idea("xmas", "t1"), "2026-11-27")) === "{}");
  W.bmClose();
  const noDay = IDEAS({ eat: "16:00" }, foodMap(A3)); delete noDay.t1.ev;
  o.set(SEASON(noDay), {}, EV()); W.bmOpen("xmas", "t1");
  ok("no day → “Give it a day to get dates and reminders”, “(4 days before)” with no date, and no tick buttons", /Give it a day to get dates and reminders/.test(o.text()) && /Move Turkey to the fridge to thaw \(16 lb\) \(4 days before\)/.test(o.text()) && !/bmTick/.test(o.html()));
  W.bmTick("f00_t"); ok("…a tick with no day writes nothing", o.writes.length === 0);
  W.bmClose();
}

console.log("\n# the dish pop-up: how, who, thaw");
{
  o.set(SEASON(IDEAS({ eat: "16:00", ts: 1 }, { f1: { name: "Ham", ts: 3, where: "oven", cook: 120, temp: "325", menu: { "2026-11-26": { s: "d", txt: "Ham" } } } })), {}, EV());
  W.bmOpen("xmas", "t1"); W.bmDish("f1");
  ok("it asks how it gets made, who, and frozen?", /How does it get made\?/.test(o.html()) && /📦 Made before the day/.test(o.html()) && /🚗 Someone brings it/.test(o.html()) && /Who makes it\? \(optional\)/.test(o.html()) && /Frozen\?/.test(o.html()) && /1 day in the fridge for every 4 pounds/.test(o.html()));
  ok("the family's people are chips (Ava, Ben, Mom, Dad)", ["Ava", "Ben", "Mom", "Dad"].every(n => new RegExp("bmWho\\('[a-z]+'\\)\">" + n + "<").test(o.html())));
  W.bmWho("dad"); W.bmDishSet("thawLb", "16"); W.bmDishSave();
  const v = o.writes[0] && o.writes[0].val;
  ok("Dad + 16 lb → writes who:dad and thaw {days:4, lb:16} (worked out), and nothing else", !!v && Object.keys(v).sort().join() === "seasons/ideas/xmas/t1/food/f1/thaw,seasons/ideas/xmas/t1/food/f1/who" && v["seasons/ideas/xmas/t1/food/f1/who"] === "dad" && JSON.stringify(v["seasons/ideas/xmas/t1/food/f1/thaw"]) === '{"days":4,"lb":16}', v);
  ok("…the Menu note survives", !!T.data().ideas.xmas.t1.food.f1.menu);
  o.writes.length = 0; W.bmDish("f1"); W.bmDishSet("thawD", "3"); W.bmDishSave();
  ok("typing the days herself wins over the pounds rule", o.writes.length === 1 && JSON.stringify(o.writes[0].val["seasons/ideas/xmas/t1/food/f1/thaw"]) === '{"days":3,"lb":16}');
  o.writes.length = 0; W.bmDish("f1"); W.bmDishSave(); ok("saving unchanged writes nothing (thaw compared by value)", o.writes.length === 0);
  W.bmDish("f1"); W.bmDishSet("thawD", "11"); W.bmDishSave(); ok("11 days → refused", o.writes.length === 0 && /1 to 10 days/.test(o.html()));
  W.bmDishSet("thawD", ""); W.bmDishSet("thawLb", "90"); W.bmDishSave(); ok("90 lb → refused", o.writes.length === 0 && /1 to 60/.test(o.html()));
  W.bmDishSet("thawLb", ""); W.bmDishSave(); ok("clearing both removes the thaw", o.writes.length === 1 && o.writes[0].val["seasons/ideas/xmas/t1/food/f1/thaw"] === null);
  o.writes.length = 0; W.bmDish("f1"); W.bmDishSet("whoTxt", "Aunt Kim"); W.bmDishSave();
  ok("typing a guest's name replaces Dad — who and whoTxt are never both saved", o.writes.length === 1 && o.writes[0].val["seasons/ideas/xmas/t1/food/f1/who"] === null && o.writes[0].val["seasons/ideas/xmas/t1/food/f1/whoTxt"] === "Aunt Kim");
  o.writes.length = 0; W.bmDish("f1"); W.bmWho("ava"); W.bmDishSave();
  ok("picking a person clears the typed guest", o.writes.length === 1 && o.writes[0].val["seasons/ideas/xmas/t1/food/f1/who"] === "ava" && o.writes[0].val["seasons/ideas/xmas/t1/food/f1/whoTxt"] === null);
  ok("a kid as maker is a label only: the write touched only this food line (no job, no stars)", Object.keys(o.writes[0].val).every(p => p.indexOf("seasons/ideas/xmas/t1/food/f1/") === 0) && !o.writes.some(w => /seasonJobs|bank|stars/.test(JSON.stringify(w))));
  o.writes.length = 0; W.bmDish(""); W.bmDishSet("name", "Pie"); W.bmHow("bring"); W.bmGuest("Aunt Kim"); W.bmDishSave();
  ok("a new brought dish: {name, ts, how:bring, whoTxt} — the guest's name only on this food line", o.writes.length === 1 && (() => { const k = Object.keys(o.writes[0].val)[0], r = o.writes[0].val[k]; return /^seasons\/ideas\/xmas\/t1\/food\/f/.test(k) && r.how === "bring" && r.whoTxt === "Aunt Kim" && !r.who && !r.where && Object.keys(r).sort().join() === "how,name,ts,whoTxt"; })(), o.writes[0].val);
  ok("guest names typed before show as chips next time", (W.bmDish(""), /bmGuest\('Aunt Kim'\)">Aunt Kim</.test(o.html())));
  W.bmDishCancel();
  o.writes.length = 0; W.bmDish(""); W.bmDishSet("name", "Cranberry"); W.bmHow("ahead"); W.bmDishSet("days", "15"); W.bmDishSave();
  ok("made ahead 15 days → refused", o.writes.length === 0 && /1 to 14 days/.test(o.html()));
  W.bmDishSet("days", ""); W.bmDishSave();
  ok("blank days → 1 day before", o.writes.length === 1 && Object.values(o.writes[0].val)[0].days === 1 && Object.values(o.writes[0].val)[0].how === "ahead");
  o.writes.length = 0; W.bmDish(""); W.bmDishSet("name", "Rolls"); W.bmHow("bring"); W.bmDishSet("thawD", "2"); W.bmDishSave();
  ok("a brought dish never saves a thaw", o.writes.length === 1 && !("thaw" in Object.values(o.writes[0].val)[0]));
  W.bmClose();
}

console.log("\n# 🤫 a surprise meal's guests stay in seasonSecret/");
{
  o.set(SEASON(IDEAS({ eat: "16:00" })), { xmas: { s1: { t: "Surprise party", by: "mom", hide: "none", ts: 9, on: { o1: { d: "2026-12-06", time: "" } }, meal: { eat: "18:00" }, food: {} } } }, EV());
  W.bmOpen("xmas", "s1"); W.bmDish(""); W.bmDishSet("name", "Cake"); W.bmHow("bring"); W.bmGuest("Uncle Joe"); W.bmDishSave(); W.bmTick(Object.keys(T.secret().xmas.s1.food)[0] + "_h");
  const P = o.writes.reduce((a, w) => a.concat(Object.keys(w.val)), []);
  ok("the dish and its tick: every path under seasonSecret/", P.length === 2 && P.every(p => p.indexOf("seasonSecret/xmas/s1/") === 0) && JSON.stringify(T.data()).indexOf("Uncle Joe") < 0, P);
  W.bmClose();
}

console.log("\n# the file");
{
  const code = BM.replace(/^\s*\/\/.*$/gm, "");
  ok("still no database call, no timer, no other node's path", !/\bdb\b|\.ref\(|setInterval|setTimeout/.test(code) && !/kitchen\/|calendar\/|momday|dadday|seasonJobs|gifts/.test(code));
  ok("every drawn handler exists (bmHow, bmWho, bmGuest, bmTick too)", (() => { const names = new Set(); (code.match(/on(click|input|change)=\\?"([A-Za-z_$][\w$]*)\(/g) || []).forEach(m => names.add(m.replace(/.*"/, "").replace("(", ""))); names.delete("if"); return ["bmHow", "bmWho", "bmGuest", "bmTick"].every(n => names.has(n)) && [...names].every(n => typeof W[n] === "function"); })());
  ok("the tick path is inside BM_OK", B.OK.test("seasons/ideas/xmas/t1/meal/tick/2026-11-26/f1_t"));
  ok("no family's names", !/Lincoln|Ellis|Lucy|Julian|Howe|Burris|DeWalt|Dewalt|Melanie|Sara\b|Adrienne|Andrew/.test(BM));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
