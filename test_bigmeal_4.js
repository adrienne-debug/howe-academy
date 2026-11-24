/*
 * Node tests for 🍗 BIGMEAL slice 4 — 👩‍🍳 the cook view for the kitchen tablet (PLAN_holiday_menu_2026-11-24.md §5.2 + §6 slice 4).
 *   · at 2:41 PM on Thanksgiving: Next, Cooking now, nothing late; tick in / out moves a dish; un-tick; "late 6 min"
 *   · opened two days early or after the day: nothing late · the night before counts on the day before
 *   · one tick = one write of one field · a tick from another device shows · a dry run writes nothing
 *   · ONE setTimeout to the next minute, re-armed, cleared on close — never a setInterval · the screen kept on, let go on close
 *   · the layer carries dlg-overlay + inline display:flex only in the cook view (a deploy's reload waits)
 *   · the Mom switch off → it closes · changing the eat time keeps the ticks · 📖 only when the app has the recipe pop-up
 *
 *   run:  node test_bigmeal_4.js
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


function cookWorld(opt) {
  const o = world(opt); o.timers = []; o.cleared = []; o.listen = []; o.unlisten = []; o.now = 0; o.lock = { released: 0, release() { this.released++; } }; o.pops = [];
  o.W.setTimeout = (fn, ms) => { o.timers.push({ fn, ms, id: o.timers.length + 1 }); return o.timers.length; };
  o.W.clearTimeout = id => { o.cleared.push(id); };
  o.W._mlNowMin = () => o.now;
  o.W.navigator = { wakeLock: { request: () => ({ then(f) { f(o.lock); return { catch() {} }; } }) } };
  o.W.document.addEventListener = (ev, fn) => { o.listen.push(ev); o.visFn = fn; }; o.W.document.removeEventListener = ev => { o.unlisten.push(ev); };
  o.W.document.visibilityState = "visible";
  o.W.grMealPop = mid => { o.pops.push(mid); };
  o.pending = () => o.timers.filter(t => t.ms > 1000 && o.cleared.indexOf(t.id) < 0 && !t.fired).length;   // the cook view's minute tick (the planner's own 80 ms sync timer is not ours)
  return o;
}
const A4 = [dish("Turkey", "oven", 240, "325", { prep: 20, rest: 45, big: true, mid: "m_turkey" }), dish("Mac and cheese", "slow", 150, "high", { prep: 15 }),
  dish("Mashed potatoes", "slow", 120, "low", { how: "ahead", days: 1 }), dish("Stuffing", "oven", 45, "350"), dish("Sweet potato casserole", "oven", 30, "350"),
  dish("Green beans", "stove", 15, "", { prep: 10 }), dish("Gravy", "stove", 15), dish("Rolls", "oven", 12, "400"),
  dish("Cranberry sauce", "", null, "", { how: "ahead", days: 2 }), dish("Pumpkin pie", "", null, "", { how: "bring", whoTxt: "Grandma" })];
// keys of every step before 2:41 PM (the plan's table): start turkey, heat, turkey in, start mac, mac in, mashed in
const BEFORE_241 = { f00_r: 1, f00_heat: 1, f00_i: 1, f01_r: 1, f01_i: 1, f02_i: 1 };
const o = cookWorld(), W = o.W, T = o.T, B = o.B;
const setDay = (today, now, tick) => { o.set(SEASON(IDEAS({ eat: "16:00", ts: 1, tick: tick ? { "2026-11-26": tick } : undefined }, foodMap(A4))), {}, EV()); o.today = today; o.now = now; };

console.log("\n# Thanksgiving at 2:41 PM");
{
  setDay("2026-11-26", B.clockMin("2:41 PM"), Object.assign({ f08_a: 1, f02_a: 1 }, BEFORE_241));
  W.bmOpen("xmas", "t1");
  ok("the planning page has 👩‍🍳 Cook view once there's an eat time", /bmCook\(\)">👩‍🍳 Cook view/.test(o.html()));
  W.bmCook(); const t = o.text();
  ok("the tablet's clock and the countdown: “It is 2:41 PM” · “We eat at 4:00 PM · 1 h 19 min to go”", /It is 2:41 PM/.test(t) && /We eat at 4:00 PM · 1 h 19 min to go/.test(t), t.slice(0, 200));
  ok("⏭ Next: 3:15 PM — Turkey comes out · rests 45 min, in 34 min", /⏭ Next 3:15 PM — Turkey comes out · rests 45 min in 34 min/.test(t), t.slice(t.indexOf("Next"), t.indexOf("Next") + 90));
  ok("🔥 Cooking now (from the plan, nothing ticked out yet): turkey in the oven; mac and cheese + mashed potatoes in the slow cooker", /🔥 Oven Turkey 11:15 AM–3:15 PM/.test(t) && /🍲 Slow cooker \(crockpot\) Mac and cheese 1:30 PM–4:00 PM/.test(t) && /Mashed potatoes 2:00 PM–4:00 PM/.test(t));
  ok("nothing late (everything before 2:41 is ticked)", !/late \d/.test(t));
  ok("the layer holds back a deploy's reload: class dlg-overlay + inline display:flex", o.layer().className === "dlg-overlay" && o.layer().style.display === "flex");
  ok("…the screen is asked to stay on, and a wake-up listener is on", B.cook().wake === true && o.listen.join() === "visibilitychange");
  ok("…ONE timer, to the next minute (never a setInterval)", o.pending() === 1 && o.timers.filter(t => t.ms > 1000).pop().ms <= 60050 && !/setInterval/.test(BM.replace(/^\s*\/\/.*$/gm, "")));
  ok("opening the cook view writes nothing", o.writes.length === 0);
  const st = B.stateAt(B.steps(960, B.plan(960, A4.map((d, i) => B.dishOf({ id: "f" + String(i).padStart(2, "0"), r: d })))), B.plan(960, A4.map((d, i) => B.dishOf({ id: "f" + String(i).padStart(2, "0"), r: d }))), BEFORE_241, B.clockMin("2:41 PM"), false);
  ok("stateAt: next = turkey out, late = none, in now = turkey (in) + 2 in the slow cooker (in)", st.next.key === "f00_o" && st.late.length === 0 && st.inNow.map(x => x.d.name + ":" + x.how).join() === "Turkey:in,Mac and cheese:in,Mashed potatoes:in");
}

{
  const P = B.plan(960, A4.map((d, i) => B.dishOf({ id: "f" + String(i).padStart(2, "0"), r: d }))), S = B.steps(960, P);
  ok("stateAt: on the exact minute a step isn't late yet (3:15 PM, turkey out unticked)", !B.stateAt(S, P, BEFORE_241, B.clockMin("3:15 PM"), false).late.some(x => x.key === "f00_o") && B.stateAt(S, P, BEFORE_241, B.clockMin("3:16 PM"), false).late.some(x => x.key === "f00_o"));
  ok("stateAt: after the meal's day nothing is late and nothing “should be in”", (() => { const x = B.stateAt(S, P, {}, 2 * 1440 + 600, true); return x.late.length === 0 && x.inNow.length === 0; })());
}

console.log("\n# ticks");
{
  W.bmTick("f00_o");
  ok("tick “Turkey comes out” → ONE write of ONE field: meal/tick/2026-11-26/f00_o", o.writes.length === 1 && Object.keys(o.writes[0].val).join() === "seasons/ideas/xmas/t1/meal/tick/2026-11-26/f00_o");
  ok("…the turkey leaves 🔥 Cooking now, and Next moves on to the stuffing", !/🔥 Oven Turkey/.test(o.text()) && /⏭ Next 3:15 PM — Stuffing — into the oven/.test(o.text()));
  W.bmTick("f00_o");
  ok("tap again → un-ticked (null), the turkey is back", o.writes.length === 2 && Object.values(o.writes[1].val)[0] === null && /🔥 Oven Turkey/.test(o.text()));
  o.now = B.clockMin("3:21 PM"); B.draw();
  ok("3:21 PM, nothing ticked since: “Turkey comes out” is late 6 min, and so is the stuffing", /Turkey comes out · rests 45 min late 6 min/.test(o.text()) && /Stuffing — into the oven · 350° · 45 min late 6 min/.test(o.text()));
  ok("…the stuffing shows greyed in Cooking now: “should be in — tick it”", /Stuffing 3:15 PM–4:00 PM · should be in — tick it/.test(o.text()) && /bm-should/.test(o.html()));
  W.bmTick("f03_i");
  ok("ticking it in makes it really in (no longer greyed)", /Stuffing 3:15 PM–4:00 PM/.test(o.text()) && !/Stuffing 3:15 PM–4:00 PM · should be in/.test(o.text()));
  ok("a big ☐ on every step (58 px)", (o.html().match(/class="bm-ctk/g) || []).length === B.steps(960, B.plan(960, A4.map((d, i) => B.dishOf({ id: "f" + String(i).padStart(2, "0"), r: d })))).length && /\.bm-ctk\{flex:none;width:58px;height:58px/.test(BM));
  o.writes.length = 0;
  o.cbs = o.cbs || {};
  ok("📖 on a step with a Kitchen recipe opens the app's read-only recipe pop-up (writes nothing)", (() => { const m = /bmRecipe\('m_turkey'\)/.test(o.html()); W.bmRecipe("m_turkey"); W.bmRecipe("nope"); return m && o.pops.join() === "m_turkey" && o.writes.length === 0; })());
}

console.log("\n# a tick from another device · a dry run");
{
  const p = cookWorld(); p.today = "2026-11-26"; p.now = B.clockMin("2:41 PM"); p.set({}, {}, EV()); p.W.renderSeasons(p.root, "");
  const cb = (k, v) => p.cbs[k]({ val: () => JSON.parse(JSON.stringify(v)) });
  cb("seasons", SEASON(IDEAS({ eat: "16:00", ts: 1, tick: { "2026-11-26": BEFORE_241 } }, foodMap(A4)))); cb("seasonSecret", {});
  p.W.bmOpen("xmas", "t1"); p.W.bmCook();
  cb("seasons", SEASON(IDEAS({ eat: "16:00", ts: 1, tick: { "2026-11-26": Object.assign({ f00_o: 9 }, BEFORE_241) } }, foodMap(A4))));
  ok("another device ticks the turkey out → this tablet shows it at once", !/🔥 Oven Turkey/.test(p.text()) && /⏭ Next 3:15 PM — Stuffing/.test(p.text()));
  p.dry = true; p.W.bmTick("f03_i");
  ok("?dryrun=1: a tick shows on screen and writes nothing", p.writes.length === 0 && /Stuffing 3:15 PM–4:00 PM/.test(p.text()) && !/should be in/.test(p.text()));
}

console.log("\n# before the day · after the day · the night before");
{
  setDay("2026-11-24", B.clockMin("9:00 PM"));
  W.bmOpen("xmas", "t1"); W.bmCook(); let t = o.text();
  ok("two days early: “This is for Thu Nov 26 (in 2 days)”, and nothing is late", /This is for Thu Nov 26 \(in 2 days\)\./.test(t) && !/late \d/.test(t));
  ok("…what's still open from before the day shows on top (cranberry, mashed potatoes)", /Still open from before the day/.test(t) && /Make Cranberry sauce \(Tue Nov 24\)/.test(t) && /Make Mashed potatoes \(Wed Nov 25\)/.test(t));
  W.bmTick("f08_a"); ok("…and can be ticked from here", !/Make Cranberry sauce \(Tue/.test(o.text()) && o.writes.length === 1);
  ok("…🚗 Coming with guests: Pumpkin pie — Grandma", /Coming with guests Pumpkin pie — Grandma/.test(o.text()) || /Pumpkin pie — Grandma/.test(o.text()));
  W.bmClose();
  setDay("2026-11-28", B.clockMin("10:00 AM")); W.bmOpen("xmas", "t1"); W.bmCook(); t = o.text();
  ok("after the day: “This was Thu Nov 26.”, nothing late, nothing “should be in”", /This was Thu Nov 26\./.test(t) && !/late \d/.test(t) && !/should be in/.test(t));
  W.bmClose();
  o.set(SEASON(IDEAS({ eat: "16:00" })), {}, EV()); o.today = "2026-12-24"; o.now = B.clockMin("11:45 PM");
  W.bmOpen("xmas", "b1"); W.bmCook(); t = o.text();
  ok("Christmas Eve 11:45 PM: the 11:30 PM slow-cooker step for breakfast is late 15 min (the night before counts)", /Thu Dec 24 · 11:30 PM \(the night before\) Hash-brown casserole — into the slow cooker · low · 9 h late 15 min/.test(t), t.slice(t.indexOf("Every step"), t.indexOf("Every step") + 160));
  ok("…and the morning steps aren't late yet", !/7:20 AM Heat the oven to 350° late/.test(t));
  W.bmClose();
}

console.log("\n# the timer, the screen, closing");
{
  setDay("2026-11-26", B.clockMin("2:41 PM"), BEFORE_241); W.bmOpen("xmas", "t1"); W.bmCook();
  const before = o.timers.filter(t => t.ms > 1000).length; B.draw(); B.draw(); B.draw();
  ok("redrawing three times still leaves ONE timer pending (each draw clears the last)", o.pending() === 1 && o.timers.filter(t => t.ms > 1000).length === before + 3);
  o.now = B.clockMin("2:42 PM"); const tm = o.timers.filter(t => t.ms > 1000).pop(); tm.fired = true; tm.fn();
  ok("the minute tick redraws (now 2:42 PM) and re-arms ONE timer", /It is 2:42 PM/.test(o.text()) && o.pending() === 1);
  o.now = B.clockMin("2:43 PM"); W.document.visibilityState = "visible"; o.visFn();
  ok("the screen wakes → it catches up (2:43 PM) and asks to stay on again", /It is 2:43 PM/.test(o.text()) && B.cook().wake === true);
  const rel = o.lock.released; W.bmCookClose();
  ok("✕ Close → back to the planning page: no timer, screen let go, listener off, class and flex gone", o.pending() === 0 && B.cook().timer === false && B.cook().wake === false && o.lock.released === rel + 1 && o.unlisten.length === o.listen.length && o.unlisten.every(e => e === "visibilitychange") && o.layer().className === "" && o.layer().style.display === "block" && /👩‍🍳 Cook view/.test(o.html()));
  W.bmCook(); W.bmClose();
  ok("← closing the whole page from the cook view cleans up too", o.pending() === 0 && B.cook().wake === false && B.cook().view === "plan" && o.layer().innerHTML === "");
  W.bmOpen("xmas", "t1"); W.bmCook(); o.mom = false; W.bmRefresh();
  ok("🤫 the Mom switch goes off → the cook view closes, no timer left, screen let go", o.layer().innerHTML === "" && o.pending() === 0 && B.cook().wake === false && B.cook().view === "plan");
  o.mom = true;
  const q2 = cookWorld({ oldPage: true }); delete q2.W.navigator; delete q2.W._mlNowMin; delete q2.W.grMealPop; q2.W.document.addEventListener = undefined;
  q2.set(SEASON(IDEAS({ eat: "16:00" }, foodMap(A4))), {}, EV()); q2.today = "2026-11-26"; q2.W.bmOpen("xmas", "t1"); q2.W.bmCook();
  ok("an older page with no wake lock, no clock helper, no recipe pop-up, no event listener: the cook view still works (device clock, no 📖)", /It is \d{1,2}:\d{2} [AP]M/.test(q2.text()) && !/bmRecipe/.test(q2.html()) && /Every step/.test(q2.text()));
  q2.W.bmCookClose(); ok("…and closes cleanly", q2.pending() === 0);
}

console.log("\n# changing the eat time on the day");
{
  setDay("2026-11-26", B.clockMin("10:00 AM"), { f00_r: 1, f00_heat: 1 }); W.bmOpen("xmas", "t1"); W.bmCook();
  ok("Mom sees “Change the eat time”", /Change the eat time/.test(o.text()));
  W.bmEat("17:00");
  ok("→ ONE write of meal/eat; every step moves an hour; the ticked ones stay ticked (keys are by dish, not by time)", o.writes.length === 1 && JSON.stringify(o.writes[0].val) === '{"seasons/ideas/xmas/t1/meal/eat":"17:00"}' && /We eat at 5:00 PM/.test(o.text()) && /12:15 PM Turkey — into the oven/.test(o.text()) && (o.html().match(/bm-cs done/g) || []).length === 2);
  W.bmClose();
  o.set(SEASON(IDEAS(undefined, foodMap(A4))), {}, EV()); W.bmOpen("xmas", "t1");
  ok("no eat time → no Cook view button", !/bmCook\(\)/.test(o.html()));
  W.bmCook(); ok("…and if opened anyway it says to put in the eat time first", /Put in when you eat first/.test(o.text()));
  W.bmClose();
}

console.log("\n# the file");
{
  const code = BM.replace(/^\s*\/\/.*$/gm, "");
  ok("no setInterval; exactly one setTimeout (the minute tick) and it is cleared", !/setInterval/.test(code) && (code.match(/setTimeout\(/g) || []).length === 1 && /clearTimeout\(/.test(code));
  ok("still no database call and no other node's path", !/\bdb\b|\.ref\(/.test(code) && !/kitchen\/|calendar\/|momday|dadday|seasonJobs|gifts/.test(code));
  ok("every page global it reads is typeof-guarded: _mlNowMin, grMealPop, navigator, momHere, mwToast", /typeof _mlNowMin==="function"/.test(code) && /typeof grMealPop==="function"/.test(code) && /typeof navigator!=="undefined"/.test(code) && /typeof momHere==="function"/.test(code) && /typeof mwToast==="function"/.test(code));
  ok("every drawn handler exists (bmCook, bmCookClose, bmRecipe too)", (() => { const names = new Set(); (code.match(/on(click|input|change)=\\?"([A-Za-z_$][\w$]*)\(/g) || []).forEach(m => names.add(m.replace(/.*"/, "").replace("(", ""))); names.delete("if"); return ["bmCook", "bmCookClose", "bmRecipe", "bmTick"].every(n => names.has(n)) && [...names].every(n => typeof W[n] === "function"); })());
  ok("no family's names", !/Lincoln|Ellis|Lucy|Julian|Howe|Burris|DeWalt|Dewalt|Melanie|Sara\b|Adrienne|Andrew/.test(BM));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
