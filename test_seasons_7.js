/*
 * Node tests for 🎉 Seasons & Events — SEASONFOOD slice 4 (her "Food → Kitchen" 2026-11-22; plan §4.7): an idea's FOOD lines.
 *   · food/<id> {name, mid?, ts, menu?:{<day>:{s, side?, mid|txt}}} on the idea (a 🤫 idea's in seasonSecret/ with it)
 *   · 🛒 Ingredients → the Kitchen's own tick sheet (grIngRows + grImpOpen, what grFromRecipe opens), labelled like supplies
 *   · 🍽 Put on the Menu → the Kitchen's own kitRotDaySet / kitSideAddMid / kitSideChange — run HERE AS THE REAL CODE, cut out of
 *     index.html — on one of the idea's days still to come; a busy spot ASKS (replace · add as a side · leave it)
 *   · the planner never writes kitchen/ itself; nothing on the Menu moves or goes by itself; a ✕ takes off only what it put there
 *   · 🤫 a surprise's food never goes on the Menu; its ingredients' label is the season only
 *   · no recipes yet → words still work, and it says where recipes come from; a recipe deleted later → words
 *   · the 🍿 Food view; an idea with no food: its row looks as before
 *
 *   run:  node test_seasons_7.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
const MSRC = fs.readFileSync(path.join(__dirname, process.env.SN_SRC || "seasons.js"), "utf8");
const KSRC = fs.readFileSync(path.join(__dirname, process.env.SK_SRC || "seasonkid.js"), "utf8");
const HTML = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

// the Kitchen's REAL functions, cut out of index.html by name (brace-matched)
function fnSrc(name) {
  const i = HTML.indexOf("\nfunction " + name + "(");
  if (i < 0) throw new Error("not found in index.html: " + name);
  let j = HTML.indexOf("{", i), d = 0, k = j;
  for (; k < HTML.length; k++) { const c = HTML[k]; if (c === "{") d++; else if (c === "}") { d--; if (!d) break; } }
  return HTML.slice(i + 1, k + 1);
}
const KIT_FNS = ["kitRotDaySet", "kitRotApplyUp", "kitRotDb", "kitEatGate", "kitSideRaw", "kitSideHasList", "kitSideStart", "kitSideSave", "kitSideChange",
  "kitSideAddMid", "kitSideRemove", "kitRotRecName", "kitRotSlotName", "kitPlanRec", "kitSlotsPartVal", "kitSlotsIsParts", "kitSlotsParts", "kitSlotsList",
  "kitSlotsPartText", "kitSlotsNames"];
const KITCHEN = KIT_FNS.map(fnSrc).join("\n") + "\n" + (HTML.match(/\nconst KIT_PARTS=[^\n]*/) || [""])[0];

function momWorld() {
  const el = id => ({ id, innerHTML: "", value: "", style: {}, focus() {}, appendChild() {} });
  const nodes = {}, root = el("root");
  const o = { writes: [], kit: [], toasts: [], dry: false, mom: true, LS: {}, root, today: "2026-11-20", imp: [], pin: 0 };
  const document = { getElementById(id) { return nodes[id] || (nodes[id] = el(id)); }, createElement(t) { return el(t); }, head: { appendChild() {} } };
  const db = { ref(p) { const P = p === undefined ? "" : p; const rec = (op, v) => (/^kitchen\//.test(P) ? o.kit : o.writes).push({ op, path: P, val: v === undefined ? v : JSON.parse(JSON.stringify(v)) });
    return { update(v) { rec("update", v); }, set(v) { rec("set", v); }, remove() { rec("remove"); }, on() {}, once() {} }; } };
  const ctx = { console: { log: console.log, warn() {} }, Date, Math, JSON, document, db, _todayStr: () => o.today, _dryRun: () => o.dry, momHere: () => o.mom, _kioskD: () => false,
    gwShowToast: m => o.toasts.push(m), HA_LS: { getItem: k => (k in o.LS ? o.LS[k] : null), setItem: (k, v) => { o.LS[k] = String(v); } },
    tab: "moms-plan", mpSubView: "seasons", momSchedView: false, renderMomsPlan() {}, mpGoto() {},
    grData: { items: {} }, momdayData: {}, setTimeout: fn => 0,
    bankDirect: () => "bd1", bankDirectRemove() {}, cuUnpay: () => false, choreVerifyOn: () => false,
    // the Kitchen's surroundings the real functions call: repaint / list-sync / PIN — stubs
    kitRotRender() {}, _kitRefresh() {}, grSyncWatch() {}, kitPinGate() { o.pin++; }, kitRotQueuedFor: () => null, dadAwardOk: () => false,
    grIngRows: src => { o.imp.push({ rows: src }); return [{ p: { name: "flour" }, meals: [src[0].lbl], why: "", on: true }]; },
    grImpOpen: (title, rows, empty) => { o.imp[o.imp.length - 1].title = title; o.imp[o.imp.length - 1].empty = empty; } };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext("const ROSTER_DEF=[{id:'ava',name:'Ava',color:'#2563eb'},{id:'ben',name:'Ben',color:'#16a34a'}]; var calendarData={events:{}}; var daddayData={}; var kitMeals={}; var kitPlan={}; var kitRotPick=null;\n" + KITCHEN, ctx);
  vm.runInContext(MSRC, ctx);
  o.W = ctx; o.T = ctx._snTest; o.cal = () => vm.runInContext("calendarData", ctx);
  o.kitchen = (meals, plan) => { vm.runInContext("kitMeals=" + JSON.stringify(meals || {}) + ";kitPlan=" + JSON.stringify(plan || {}) + ";", ctx); };
  o.plan = () => vm.runInContext("kitPlan", ctx);
  o.set = (d, sec, ev, opt) => { opt = opt || {}; o.today = opt.today || "2026-11-20"; o.writes.length = 0; o.kit.length = 0; o.toasts.length = 0; o.imp.length = 0;
    const cp = x => JSON.parse(JSON.stringify(x || {})); o.T.setData(cp(d), cp(sec)); o.T.reset(); o.cal().events = cp(ev);
    o.kitchen("meals" in opt ? opt.meals : MEALS(), opt.plan); o.T.setJobs({}); o.T.setRoot(root, ""); o.T.ddFresh(true); };
  o.html = () => root.innerHTML;
  o.last = () => o.writes[o.writes.length - 1];
  return o;
}
const MEALS = () => ({ m_cookie: { name: "Sugar cookies", emoji: "🍪", ing: "2 cups flour\n1 cup sugar" }, m_cocoa: { name: "Hot cocoa", emoji: "☕", ing: "4 cups milk" }, m_pasta: { name: "Pasta bake", ing: "1 lb pasta" } });
const SEASON = (ideas) => ({ list: { xmas: { name: "Christmas 2026", emoji: "🎄", kind: "holiday", start: "2026-11-20", end: "2026-12-31", ts: 1 } }, ideas: { xmas: ideas } });
const EV = () => ({ e1: { title: "Gingerbread houses", date: "2026-12-05", time: "", who: "family", emoji: "🏠" },
  n1: { title: "Movie night", date: "2026-11-27", time: "", who: "family", emoji: "🎬" }, n2: { title: "Movie night", date: "2026-12-04", time: "", who: "family", emoji: "🎬" }, n3: { title: "Movie night", date: "2026-12-11", time: "", who: "family", emoji: "🎬" } });
const IDEAS = (food) => ({
  g1: { t: "Gingerbread houses", emoji: "🏠", by: "mom", ts: 2, ev: { e1: true }, food: food || {} },
  m1: { t: "Movie night", emoji: "🎬", by: "mom", ts: 3, ev: { n1: true, n2: true, n3: true } },
  z1: { t: "Ice skating", by: "mom", ts: 4 } });
const FB = "seasons/ideas/xmas/g1/food/";

const o = momWorld(), W = o.W, T = o.T;

console.log("\n# the Kitchen is written only through its own functions");
{
  o.set(SEASON(IDEAS()), {}, EV());
  const code = MSRC.replace(/^\s*\/\/.*$/gm, "");
  ok("the write guard is unchanged (no kitchen/ path in it)", T.OK.source.indexOf("kitchen") < 0 && T.OK.source === "^(seasons\\/(list|ideas|extra)\\/[^\\/]+|seasonSecret\\/[^\\/]+\\/[^\\/]+|calendar\\/events\\/[^\\/]+|(momday|dadday)\\/\\d{4}-\\d{2}-\\d{2}\\/todos\\/sn[^\\/]+|seasonJobs\\/[^\\/]+\\/[^\\/]+)(\\/|$)");
  ok("…so the planner's own door refuses a kitchen path", T.apply({ "kitchen/plan/2026-12-05/mid": "x" }) === false && o.kit.length === 0);
  ok("the file never names a kitchen/ path", !/kitchen\//.test(code));
  ok("Menu writes go through kitRotDaySet / kitSideAddMid / kitSideChange / kitSideRemove; ingredients through grIngRows + grImpOpen",
    /kitRotDaySet\(d,t,v\)/.test(code) && /kitSideAddMid\(d,v\.mid\)/.test(code) && /kitSideChange\(d,/.test(code) && /kitSideRemove\(iso,/.test(code) && /grImpOpen\(/.test(code) && /grIngRows\(\[\{lines:m\.ing,lbl:shopLabel\(sid,L\.it\)\}\]\)/.test(code));
  ok("still the same database calls (no new listener, no Kitchen listener)", (code.match(/db\.ref\(/g) || []).length === 5);
  ok("no family's names or foods in the code", !/Lincoln|Ellis|Lucy|Julian|Howe|Burris|DeWalt|Dewalt/.test(MSRC));
}

console.log("\n# an idea with no food");
{
  o.set(SEASON(IDEAS()), {}, EV());
  T.draw();
  ok("its row looks as before: no food chip", !/🍿/.test(o.html().split('class="sn-views"')[1].split("sn-item")[1] || "x") && !/🍿 \d+ food/.test(o.html()));
  ok("the season has a 🍿 Food view beside Supplies and To-dos", /snViewSet\('food'\)">🍿 Food</.test(o.html()));
  W.snViewSet("food");
  ok("…with nothing in it yet, and a plain pointer", /No food yet\. Open an idea in 💡 Ideas and tap ＋ Add food\./.test(o.html()));
  W.snOpenIdea("g1");
  ok("the idea pop-up has a 🍿 Food part with ＋ Add food", /🍿 Food<\/div><div class="sn-acts"><button class="sn-tool" onclick="snLine\('food','g1',''\)">＋ Add food/.test(o.html()));
  ok("food can't be added to the whole season (it belongs to an idea)", (W.snLine("food", "", ""), T.edit().type === "idea"));
}

console.log("\n# adding food: a recipe, or words");
{
  o.set(SEASON(IDEAS()), {}, EV());
  W.snLine("food", "g1", "");
  let h = o.html();
  ok("the pop-up lists the Kitchen's recipes A–Z, with 'no recipe, just words' first", /<option value="">— no recipe, just words —<\/option><option value="m_cocoa">☕ Hot cocoa<\/option><option value="m_pasta">Pasta bake<\/option><option value="m_cookie">🍪 Sugar cookies/.test(h));
  W.snFoodMid("m_cookie");
  ok("picking a recipe fills the name", T.edit().form.mid === "m_cookie" && T.edit().form.name === "Sugar cookies");
  W.snFoodMid("nope");
  ok("a recipe that isn't there can't be picked", T.edit().form.mid === "");
  W.snFoodMid("m_cookie"); W.snSave();
  let v = o.last().val, P = Object.keys(v);
  ok("ONE write: the food line {name, mid, ts} on the idea", P.length === 1 && P[0].indexOf(FB + "f") === 0 && v[P[0]].name === "Sugar cookies" && v[P[0]].mid === "m_cookie" && typeof v[P[0]].ts === "number" && Object.keys(v[P[0]]).length === 3, v);
  o.set(SEASON(IDEAS()), {}, EV());
  W.snLine("food", "g1", ""); W.snSet("name", "Candy canes"); W.snSave();
  v = o.last().val; P = Object.keys(v);
  ok("words only: {name, ts}, no recipe", v[P[0]].name === "Candy canes" && !("mid" in v[P[0]]));
  o.set(SEASON(IDEAS()), {}, EV());
  W.snLine("food", "g1", ""); W.snSave();
  ok("nothing typed or picked → not saved, a plain message", o.writes.length === 0 && /Pick a recipe or type the food\./.test(o.html()));
  // changing it
  o.set(SEASON(IDEAS({ f1: { name: "Sugar cookies", mid: "m_cookie", ts: 1 } })), {}, EV());
  W.snLine("food", "g1", "f1"); W.snFoodMid(""); W.snSet("name", "Store cookies"); W.snSave();
  ok("changing it writes only what changed (name, recipe off)", JSON.stringify(o.last().val) === JSON.stringify({ [FB + "f1/name"]: "Store cookies", [FB + "f1/mid"]: null }), o.last().val);
}

console.log("\n# a family with no recipes yet (never a dead end)");
{
  o.set(SEASON(IDEAS()), {}, EV(), { meals: {} });
  W.snLine("food", "g1", "");
  const h = o.html();
  ok("no recipe picker, and it says words work and where recipes come from", !/<select onchange="snFoodMid/.test(h) && /No recipes in the Kitchen yet\. That’s fine: type the food/.test(h) && /Mom’s Day ▸ 🍽 Meals ▸ 📚 Meal library/.test(h));
  ok("the placeholder is a plain food, nothing family-specific", /placeholder="Popcorn"/.test(h));
  W.snSet("name", "Popcorn"); W.snSave();
  ok("words save fine", Object.values(o.last().val)[0].name === "Popcorn");
}

console.log("\n# a recipe deleted from the Kitchen later");
{
  o.set(SEASON(IDEAS({ f1: { name: "Fudge", mid: "m_gone", ts: 1 } })), {}, EV());
  W.snOpenIdea("g1");
  const h = o.html();
  ok("the row says the recipe is gone and it is words now; no 🛒 Ingredients", /Fudge<small>📖 recipe gone from the Kitchen — words now/.test(h) && !/snFoodShop/.test(h));
  W.snLine("food", "g1", "f1");
  ok("its pop-up says so too", /Its recipe was taken out of the Kitchen, so it is just words now/.test(o.html()));
  W.snCancel(); W.snMenu("xmas", "g1", "f1");
  W.snMenuGo("put");
  ok("🍽 puts it on as words", o.kit.length === 1 && o.kit[0].val.txt === "Fudge" && o.kit[0].val.mid === null);
}

console.log("\n# 🛒 Ingredients: the Kitchen's own tick sheet, labelled like supplies");
{
  o.set(SEASON(IDEAS({ f1: { name: "Sugar cookies", mid: "m_cookie", ts: 1 }, f2: { name: "Candy canes", ts: 2 } })), {}, EV());
  W.snOpenIdea("g1");
  ok("only a recipe line has 🛒 Ingredients", (o.html().match(/snFoodShop\(/g) || []).length === 1 && /snFoodShop\('xmas','g1','f1'\)/.test(o.html()));
  W.snFoodShop("xmas", "g1", "f1");
  const x = o.imp[0];
  ok("opens the tick sheet with the recipe's ingredients", x && x.title === "Add ingredients — Sugar cookies" && x.rows.length === 1 && x.rows[0].lines === "2 cups flour\n1 cup sugar");
  ok("…labelled '🎄 Season · Idea', like a supply", x.rows[0].lbl === "🎄 Christmas 2026 · Gingerbread houses");
  ok("the planner itself writes nothing (the sheet adds what she ticks)", o.writes.length === 0 && o.kit.length === 0);
  W.snFoodShop("xmas", "g1", "f2");
  ok("words have no ingredients to send", o.imp.length === 1);
  o.dry = true; W.snFoodShop("xmas", "g1", "f1"); o.dry = false;
  ok("?dryrun=1: the sheet doesn't open", o.imp.length === 1);
  const sec = { xmas: { s1: { t: "Birthday cake for Dad", by: "mom", ts: 5, hide: "hint", ev: { e9: true }, food: { f9: { name: "Cake", mid: "m_cookie", ts: 1 } } } } };
  o.set(SEASON(IDEAS()), sec, Object.assign(EV(), { e9: { title: "A surprise", date: "2026-12-06", time: "", who: "family", emoji: "✨" } }));
  W.snFoodShop("xmas", "s1", "f9");
  ok("🤫 a surprise's ingredients: the label is the season only (the supplies rule)", o.imp[0].rows[0].lbl === "🎄 Christmas 2026");
}

console.log("\n# 🍽 Put on the Menu — an empty spot");
{
  o.set(SEASON(IDEAS({ f1: { name: "Sugar cookies", mid: "m_cookie", ts: 1 } })), {}, EV());
  W.snOpenIdea("g1");
  ok("the row has 🍽 Menu", /snMenu\('xmas','g1','f1'\)/.test(o.html()));
  W.snMenu("xmas", "g1", "f1");
  let h = o.html();
  ok("the sheet: its day (Sat Dec 5), Dinner first; four meals", T.edit().type === "menu" && T.edit().day === "2026-12-05" && T.edit().slot === "d" && /🍽 Dinner/.test(h) && /🌅 Breakfast/.test(h) && /☀️ Lunch/.test(h) && /🍎 Snack/.test(h));
  W.snMenuSlot("s");
  h = o.html();
  ok("it shows what that spot has now", /Sat Dec 5, snack now:<\/b> nothing yet/.test(h) && /snMenuGo\('put'\)">🍽 Put it on/.test(h));
  ok("put it on", W.snMenuGo("put") === true);
  ok("the Kitchen's own kitRotDaySet made ONE targeted write of that day's snack", o.kit.length === 1 && o.kit[0].op === "update" && o.kit[0].path === "kitchen/plan/2026-12-05" && JSON.stringify(o.kit[0].val) === JSON.stringify({ s: { mid: "m_cookie" } }), o.kit);
  ok("the planner remembers where it went", JSON.stringify(o.last().val) === JSON.stringify({ [FB + "f1/menu/2026-12-05"]: { s: "s", mid: "m_cookie" } }), o.last().val);
  ok("toast + back to the idea", o.toasts.pop() === "🍽 Sugar cookies → Sat Dec 5, snack" && T.edit().type === "idea");
  // the row now
  const d = JSON.parse(JSON.stringify(SEASON(IDEAS({ f1: { name: "Sugar cookies", mid: "m_cookie", ts: 1, menu: { "2026-12-05": { s: "s", mid: "m_cookie" } } } }))));
  o.set(d, {}, EV(), { plan: o.plan() });
  W.snOpenIdea("g1");
  ok("the row says 'On the Menu — Sat Dec 5, snack' with a ✕", /🍽 On the Menu — Sat Dec 5, snack<\/span><button class="sn-tool" onclick="snMenuOff\('xmas','g1','f1','2026-12-05'\)">✕ Take it off the Menu/.test(o.html()));
  W.snMenu("xmas", "g1", "f1"); W.snMenuSlot("d");
  ok("the same food that day again → 'already on the Menu', no button", /It’s already on the Menu that day \(snack\)/.test(o.html()) && !/snMenuGo/.test(o.html()) && W.snMenuGo("put") === false);
  // dinner as words
  o.set(SEASON(IDEAS({ f2: { name: "Chili", ts: 2 } })), {}, EV());
  W.snMenu("xmas", "g1", "f2"); W.snMenuGo("put");
  ok("words go on as the dinner's words (sides cleared on an empty dinner, as the Kitchen does)", JSON.stringify(o.kit[0].val) === JSON.stringify({ mid: null, txt: "Chili", sides: null, sideList: null }) && o.plan()["2026-12-05"].txt === "Chili");
}

console.log("\n# 🍽 a busy spot ASKS — never a quiet overwrite");
{
  const F = { f1: { name: "Sugar cookies", mid: "m_cookie", ts: 1 } };
  o.set(SEASON(IDEAS(F)), {}, EV(), { plan: { "2026-12-05": { mid: "m_pasta", sideList: [{ txt: "salad" }] } } });
  W.snMenu("xmas", "g1", "f1");
  let h = o.html();
  ok("it shows what's there and asks: replace · add as a side · leave it", /Sat Dec 5, dinner now:<\/b> Pasta bake \+ 1 side/.test(h) && /That spot already has Pasta bake \+ 1 side\. What should happen\?/.test(h)
    && /snMenuGo\('replace'\)">Replace it \(its sides come off too\)/.test(h) && /snMenuGo\('side'\)">＋ Add as a side/.test(h) && /onclick="snCancel\(\)">Leave it/.test(h) && !/snMenuGo\('put'\)/.test(h));
  ok("'put' on a busy spot writes nothing", W.snMenuGo("put") === false && o.kit.length === 0 && o.writes.length === 0 && /That spot has something on it now/.test(o.html()));
  W.snCancel();
  ok("Leave it: nothing written", o.kit.length === 0 && o.writes.length === 0);
  W.snMenu("xmas", "g1", "f1"); W.snMenuGo("side");
  ok("＋ Add as a side → the Kitchen's kitSideAddMid: the sides list, ONE write", o.kit.length === 1 && o.kit[0].op === "set" && o.kit[0].path === "kitchen/plan/2026-12-05/sideList" && JSON.stringify(o.kit[0].val) === JSON.stringify([{ txt: "salad" }, { mid: "m_cookie" }]), o.kit);
  ok("…the main dish is untouched, and the planner remembers it as a side", o.plan()["2026-12-05"].mid === "m_pasta" && JSON.stringify(o.last().val[FB + "f1/menu/2026-12-05"]) === JSON.stringify({ s: "d", side: true, mid: "m_cookie" }));
  o.set(SEASON(IDEAS(F)), {}, EV(), { plan: { "2026-12-05": { mid: "m_pasta" } } });
  W.snMenu("xmas", "g1", "f1"); W.snMenuGo("replace");
  ok("Replace it → kitRotDaySet replaces the dinner", o.kit.length === 1 && o.kit[0].val.mid === "m_cookie" && o.plan()["2026-12-05"].mid === "m_cookie");
  // a word side
  o.set(SEASON(IDEAS({ f2: { name: "Cranberry sauce", ts: 2 } })), {}, EV(), { plan: { "2026-12-05": { txt: "Turkey" } } });
  W.snMenu("xmas", "g1", "f2"); W.snMenuGo("side");
  ok("words as a side → the Kitchen's kitSideChange", o.kit.length === 1 && JSON.stringify(o.kit[0].val) === JSON.stringify([{ txt: "Cranberry sauce" }]));
  // breakfast / lunch / snack: no sides there
  o.set(SEASON(IDEAS(F)), {}, EV(), { plan: { "2026-12-05": { b: { txt: "Oatmeal" } } } });
  W.snMenu("xmas", "g1", "f1"); W.snMenuSlot("b");
  h = o.html();
  ok("breakfast busy: replace · leave it (no 'side' — only dinner has sides)", /That spot already has Oatmeal/.test(h) && !/snMenuGo\('side'\)/.test(h) && W.snMenuGo("side") === false && o.kit.length === 0);
  // a breakfast in parts (main · veg · fruit · extra)
  o.set(SEASON(IDEAS(F)), {}, EV(), { plan: { "2026-12-05": { l: { parts: { main: { txt: "Soup" }, fruit: { txt: "apple" } } } } } });
  W.snMenu("xmas", "g1", "f1"); W.snMenuSlot("l");
  ok("a lunch in parts shows its parts' names", /That spot already has Soup · apple/.test(o.html()));
  // the Kitchen says no (its own gate: not Mom / Dad) → the planner remembers nothing
  o.set(SEASON(IDEAS(F)), {}, EV()); o.mom = false;
  W.snMenu("xmas", "g1", "f1");
  ok("the Kitchen refuses → nothing remembered, a plain message", W.snMenuGo("put") === false && o.kit.length === 0 && o.writes.length === 0 && /The Menu didn’t change\./.test(o.html()));
  o.mom = true;
  // dry run
  o.set(SEASON(IDEAS(F)), {}, EV()); o.dry = true;
  W.snMenu("xmas", "g1", "f1");
  ok("?dryrun=1: nothing goes on", W.snMenuGo("put") === false && o.kit.length === 0 && o.writes.length === 0 && Object.keys(o.plan()).length === 0);
  o.dry = false;
}

console.log("\n# several days: she picks; the next one first");
{
  const I = IDEAS(); I.m1.food = { p1: { name: "Popcorn", ts: 1 } };
  o.set(SEASON(I), {}, EV(), { today: "2026-11-28" });
  W.snMenu("xmas", "m1", "p1");
  const h = o.html();
  ok("only its days still to come, the next one first", T.edit().day === "2026-12-04" && /snMenuDay\('2026-12-04'\)/.test(h) && /snMenuDay\('2026-12-11'\)/.test(h) && !/snMenuDay\('2026-11-27'\)/.test(h));
  W.snMenuSlot("s"); W.snMenuGo("put");
  ok("Dec 4, snack", o.kit[0].path === "kitchen/plan/2026-12-04" && JSON.stringify(o.kit[0].val) === JSON.stringify({ s: { txt: "Popcorn" } }));
  const d = SEASON(I); d.ideas.xmas.m1.food.p1.menu = { "2026-12-04": { s: "s", txt: "Popcorn" } };
  o.set(d, {}, EV(), { today: "2026-11-28", plan: o.plan() });
  W.snMenu("xmas", "m1", "p1");
  ok("it remembers the meal she used last (snack)", T.edit().slot === "s");
  W.snMenuDay("2026-12-11"); W.snMenuGo("put");
  ok("one food can go on more than one of its days", o.kit.length === 1 && o.kit[0].path === "kitchen/plan/2026-12-11" && Object.keys(o.last().val)[0] === "seasons/ideas/xmas/m1/food/p1/menu/2026-12-11");
  W.snMenu("xmas", "m1", "p1"); W.snMenuDay("2026-11-27");
  ok("a day gone by can't be picked", T.edit().day === "2026-12-04");
  W.snMenuDay("2026-12-25");
  ok("…nor a day that isn't one of its days", T.edit().day === "2026-12-04");
  // no day yet
  const I2 = IDEAS(); I2.z1.food = { q1: { name: "Hot cocoa", mid: "m_cocoa", ts: 1 } };
  o.set(SEASON(I2), {}, EV());
  W.snOpenIdea("z1");
  ok("no day yet: the row says the Menu waits for a day (like 'days before' to-dos)", /🍽 Menu waits for a day/.test(o.html()) && !/snMenu\('xmas','z1'/.test(o.html()));
  W.snCancel(); W.snMenu("xmas", "z1", "q1");
  ok("…and the Menu sheet doesn't open", T.edit() === null && /needs a day first/.test(o.toasts.pop()));
}

console.log("\n# the idea's day moves or goes AFTER — the Menu is never changed by itself");
{
  const F = { f1: { name: "Sugar cookies", mid: "m_cookie", ts: 1, menu: { "2026-12-05": { s: "s", mid: "m_cookie" } } } };
  const E = EV(); E.e1.date = "2026-12-12";   // she moved the idea after the cookies went on the Menu
  o.set(SEASON(IDEAS(F)), {}, E, { plan: { "2026-12-05": { s: { mid: "m_cookie" } } } });
  T.draw(); T.dadSync(); W.snOpenIdea("g1");
  ok("nothing is written to the Kitchen by itself (drawing, syncing)", o.kit.length === 0);
  ok("the row says it plainly: still there, not one of its days now, with a ✕", /On the Menu — Sat Dec 5, snack · still there, but it’s not one of this idea’s days now/.test(o.html()) && /class="sn-mn old"/.test(o.html()) && /✕ Take it off the Menu/.test(o.html()));
  W.snMenuOff("xmas", "g1", "f1", "2026-12-05");
  ok("✕ → the Kitchen's kitRotDaySet clears that snack only", o.kit.length === 1 && JSON.stringify(o.kit[0].val) === JSON.stringify({ s: null }) && !o.plan()["2026-12-05"]);
  ok("…and the planner forgets the spot", JSON.stringify(o.last().val) === JSON.stringify({ [FB + "f1/menu/2026-12-05"]: null }) && o.toasts.pop() === "🍽 Taken off the Menu");
  // she changed the Menu herself in the Kitchen
  o.set(SEASON(IDEAS(F)), {}, EV(), { plan: { "2026-12-05": { s: { txt: "Apples" } } } });
  W.snOpenIdea("g1");
  ok("changed in the Kitchen → 'not there now', with ✕ Forget it", /Was on the Menu for Sat Dec 5 — not there now \(changed in the Kitchen\)/.test(o.html()) && /✕ Forget it/.test(o.html()));
  W.snMenuOff("xmas", "g1", "f1", "2026-12-05");
  ok("Forget it: the Kitchen is NOT touched (its Apples stay); only the planner's note goes", o.kit.length === 0 && o.plan()["2026-12-05"].s.txt === "Apples" && o.last().val[FB + "f1/menu/2026-12-05"] === null);
  // renamed after it went on: still recognised by what it put there
  const F2 = { f1: { name: "Iced cookies", ts: 1, menu: { "2026-12-05": { s: "s", txt: "Cookies" } } } };
  o.set(SEASON(IDEAS(F2)), {}, EV(), { plan: { "2026-12-05": { s: { txt: "Cookies" } } } });
  W.snOpenIdea("g1");
  ok("renaming the line later doesn't make a real Menu entry look gone", /🍽 On the Menu — Sat Dec 5, snack</.test(o.html()));
  // a day gone by: shown, no ✕
  o.set(SEASON(IDEAS(F)), {}, EV(), { today: "2026-12-06", plan: { "2026-12-05": { s: { mid: "m_cookie" } } } });
  W.snOpenIdea("g1");
  ok("after the day: 'Was on the Menu', no ✕", /Was on the Menu — Sat Dec 5, snack<\/span><\/div>/.test(o.html()));
}

console.log("\n# taking a dinner off when it has sides: ask once");
{
  const F = { f1: { name: "Pasta bake", mid: "m_pasta", ts: 1, menu: { "2026-12-05": { s: "d", mid: "m_pasta" } } } };
  o.set(SEASON(IDEAS(F)), {}, EV(), { plan: { "2026-12-05": { mid: "m_pasta", sideList: [{ txt: "salad" }] } } });
  W.snOpenIdea("g1");
  W.snMenuOff("xmas", "g1", "f1", "2026-12-05");
  ok("first tap only asks (its sides would come off too)", o.kit.length === 0 && /Tap again — that dinner’s sides come off too/.test(o.html()));
  W.snMenuOff("xmas", "g1", "f1", "2026-12-05");
  ok("second tap: the Kitchen clears the dinner", o.kit.length === 1 && o.kit[0].val.mid === null && o.kit[0].val.sideList === null);
  // a side: only that side
  const S = { f1: { name: "Sugar cookies", mid: "m_cookie", ts: 1, menu: { "2026-12-05": { s: "d", side: true, mid: "m_cookie" } } } };
  o.set(SEASON(IDEAS(S)), {}, EV(), { plan: { "2026-12-05": { mid: "m_pasta", sideList: [{ txt: "salad" }, { mid: "m_cookie" }, { txt: "bread" }] } } });
  W.snMenuOff("xmas", "g1", "f1", "2026-12-05");
  ok("a side: the Kitchen's kitSideRemove takes off only that side", o.kit.length === 1 && JSON.stringify(o.kit[0].val) === JSON.stringify([{ txt: "salad" }, { txt: "bread" }]) && o.plan()["2026-12-05"].mid === "m_pasta");
}

console.log("\n# deleting food or its idea, or 🌙: the Menu is never touched quietly");
{
  const F = { f1: { name: "Sugar cookies", mid: "m_cookie", ts: 1, menu: { "2026-12-05": { s: "s", mid: "m_cookie" } } } };
  const PL = { "2026-12-05": { s: { mid: "m_cookie" } } };
  o.set(SEASON(IDEAS(F)), {}, EV(), { plan: PL });
  W.snLine("food", "g1", "f1"); W.snLineDel(); W.snLineDel();
  ok("delete the food line: only the line goes; the Menu keeps it", o.kit.length === 0 && JSON.stringify(o.last().val) === JSON.stringify({ [FB + "f1"]: null }) && o.plan()["2026-12-05"].s.mid === "m_cookie");
  ok("…and it says so", o.toasts.some(t => /still on the Menu \(Dec 5\)\. Change it in 🍽 Meals/.test(t)));
  o.set(SEASON(IDEAS(F)), {}, EV(), { plan: PL });
  W.snOpenIdea("g1"); W.snDelIdea(); W.snDelIdea();
  ok("delete the idea: the Menu keeps it, and it says so", o.kit.length === 0 && o.plan()["2026-12-05"] && o.toasts.some(t => /still on the Menu/.test(t)));
  o.set(SEASON(IDEAS(F)), {}, EV(), { plan: PL });
  W.snSkip("g1");
  ok("🌙 not this year: the Menu keeps it, and it says so", o.kit.length === 0 && o.toasts.some(t => /still on the Menu/.test(t)));
  o.set(SEASON(IDEAS({ f1: { name: "Candy canes", ts: 1 } })), {}, EV());
  W.snLine("food", "g1", "f1"); W.snLineDel(); W.snLineDel();
  ok("a food that was never on the Menu: no message", !o.toasts.some(t => /Menu/.test(t)));
}

console.log("\n# 🤫 a surprise's food never goes on the Menu");
{
  const sec = { xmas: { s1: { t: "Birthday cake for Dad", by: "mom", ts: 5, hide: "hint", ev: { e9: true }, food: { f9: { name: "Cake", mid: "m_cookie", ts: 1 } } } } };
  const E = Object.assign(EV(), { e9: { title: "A surprise", date: "2026-12-06", time: "", who: "family", emoji: "✨" } });
  o.set(SEASON(IDEAS()), sec, E);
  W.snOpenIdea("s1");
  const h = o.html();
  ok("no 🍽 Menu button; the row says it stays off the Menu", !/snMenu\(/.test(h) && /🤫 stays off the Menu/.test(h));
  ok("🛒 Ingredients is still there (the supplies rule)", /snFoodShop\('xmas','s1','f9'\)/.test(h));
  W.snMenu("xmas", "s1", "f9");
  ok("the Menu sheet doesn't open", T.edit().type === "idea" && /surprise’s food stays on this page/.test(o.toasts.pop()));
  W.snCancel();
  o.set(SEASON(IDEAS({ f1: { name: "Sugar cookies", mid: "m_cookie", ts: 1 } })), sec, E);
  W.snMenu("xmas", "g1", "f1"); const fe = T.edit(); fe.iid = "s1"; fe.id = "f9"; fe.day = "2026-12-06";   // a sheet forced onto the surprise's food
  ok("even forced, a surprise's food can't be put on the Menu", W.snMenuGo("put") === false && W.snMenuGo("replace") === false && o.kit.length === 0 && o.writes.length === 0);
  W.snCancel();
  W.snLine("food", "s1", "f9");
  ok("its food pop-up explains why", /🤫 This idea is a surprise, so its food stays on this page\. It never goes on the Menu, because the whole family sees the Menu\./.test(o.html()));
  ok("a surprise's food line lives in seasonSecret with it", (W.snCancel(), W.snLine("food", "s1", ""), W.snSet("name", "Candles"), W.snSave(), Object.keys(o.last().val)[0].indexOf("seasonSecret/xmas/s1/food/f") === 0));
}

console.log("\n# the 🍿 Food view");
{
  const I = IDEAS({ f1: { name: "Sugar cookies", mid: "m_cookie", ts: 1 } });
  I.m1.food = { p1: { name: "Popcorn", ts: 1 } };
  I.z1.food = { q1: { name: "Hot cocoa", mid: "m_cocoa", ts: 1 } };
  I.y1 = { t: "Sledding", by: "mom", ts: 6, skip: true, food: { r1: { name: "PARKEDFOOD", ts: 1 } } };
  o.set(SEASON(I), {}, EV());
  W.snViewSet("food");
  const h = o.html();
  ok("every food with its day, soonest first, then 'Not scheduled yet'", h.indexOf("Fri Nov 27 +2 more — 🎬 <b>Movie night") > 0 && h.indexOf("Popcorn") < h.indexOf("Sugar cookies") && h.indexOf("Sat Dec 5 — 🏠 <b>Gingerbread houses") < h.indexOf("Not scheduled yet") && h.indexOf("Not scheduled yet") < h.indexOf("Hot cocoa"));
  ok("a 🌙 idea's food is left out", !/PARKEDFOOD/.test(h));
  T.draw();
  ok("the view tab counts the food", /🍿 Food<small>3<\/small>/.test(o.html()));
  W.snViewSet("ideas");
  ok("an idea with food: its row gets a 🍿 chip", /🍿 1 food/.test(o.html()));
}

console.log("\n# the kids' page never shows food");
{
  const el = id => ({ id, innerHTML: "", value: "", style: {}, focus() {}, setSelectionRange() {}, appendChild() {} });
  const kctx = { console: { log() {}, warn() {} }, Date, Math, JSON, document: { getElementById: () => null, createElement: el, head: { appendChild() {} } },
    db: { ref: () => ({ on() {}, off() {}, once: () => Promise.resolve({ val: () => null }), update() {} }) }, setTimeout: () => 0, _todayStr: () => "2026-11-21", _dryRun: () => false, gwShowToast() {}, kcLittle: () => false, tab: "kids" };
  kctx.window = kctx; vm.createContext(kctx);
  vm.runInContext("const ROSTER_DEF=[{id:'ava',name:'Ava',color:'#2563eb'}]; var calendarData={events:{}};", kctx);
  vm.runInContext(KSRC, kctx);
  vm.runInContext("calendarData", kctx).events = EV();
  const K = kctx._skTest;
  K.setData({ xmas: { name: "Christmas 2026", emoji: "🎄", kind: "holiday", kids: true, ts: 1 } }, { xmas: { g1: { t: "Gingerbread houses", by: "mom", ts: 2, ev: { e1: true }, want: { ava: true }, food: { f1: { name: "FOODWORD", ts: 1 } } } } }); K.setFor("ava");
  const kh = K.inner("ava");
  ok("Kids' Corner shows the idea, never its food", /Gingerbread houses/.test(kh) && !/FOODWORD/.test(kh));
  ok("seasonkid.js is untouched by this slice", !/food/i.test(KSRC.replace(/\/\/.*$/gm, "")));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
