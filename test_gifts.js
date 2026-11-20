/*
 * Node tests for 🎁 Gifts — slice 1 (2026-11-20; NOSANTA: Christmas starts with ⭐ Special, her word): gifts.js + its wiring in index.html (Mom's Day ▸ 💰 Budget).
 *   · people: the kids come from the family list (virtual until saved), her own people, groups (starter + hers), gone = hidden
 *   · Start Christmas = ONE set on gifts/occasions/<id> with the four sections (Santa · From Mom & Dad · Stocking · Eve) + a log
 *   · a present = ONE set on gifts/items/<id>; edits keep fields this sheet doesn't show; amounts numeric; needs a name
 *   · totals are computed: paid, still to buy (planned, unpaid), budget left/over; returned/dropped don't count
 *   · a shared present (2+ people) splits its cost evenly and counts once for each of them; the occasion counts it once
 *   · group totals + group budget; per-section budgets
 *   · ↪ Move = ONE update (pids / occ / sec); paper that came from the old person's default follows the new person
 *   · ➡ next status = ONE update {status}; delete = ONE remove; a person with presents is hidden (gone), not deleted
 *   · dry-run = no writes; no Mom = nothing loads (no listener, "Mom only")
 *   · index.html: 💰 Budget tab, dispatch, lazy loader behind momHere, gifts/ never read at app start
 *
 *   run:  node test_gifts.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }

function el(id) { return { id, innerHTML: "", value: "", classList: { contains() { return false; }, add() {}, remove() {} }, querySelector() { return null; }, style: {}, focus() {}, appendChild() {} }; }
const nodes = {}; const root = el("content");
const document = { getElementById(id) { return nodes[id] || (nodes[id] = el(id)); }, createElement(t) { return el(t); }, head: { appendChild() {} }, activeElement: null };
const writes = [], listens = [];
let dryRun = false, mom = true;
const db = { ref(p) { return { set(v) { writes.push({ op: "set", path: p, val: JSON.parse(JSON.stringify(v)) }); }, update(v) { writes.push({ op: "update", path: p, val: JSON.parse(JSON.stringify(v)) }); }, remove() { writes.push({ op: "remove", path: p }); }, push(v) { writes.push({ op: "push", path: p, val: v }); }, on(ev, fn) { listens.push(p); } }; } };
const LS = {};
const ctx = { console, Date, Math, JSON, document, db, _todayStr: () => "2026-11-20", _dryRun: () => dryRun, momHere: () => mom, gwShowToast() {}, confirm: () => true,
  HA_LS: { getItem: k => (k in LS ? LS[k] : null), setItem: (k, v) => { LS[k] = String(v); } }, tab: "moms-plan", mpSubView: "gifts" };
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext("const ROSTER_DEF=[{id:'lincoln',name:'Lincoln',color:'#2563eb'},{id:'ellis',name:'Ellis',color:'#16a34a'},{id:'lucy',name:'Lucy',color:'#db2777'},{id:'julian',name:'Julian',color:'#d97706'}];", ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, "gifts.js"), "utf8"), ctx);
const T = ctx._gfTest, W = ctx;
const reset = d => { writes.length = 0; T.setData(d || {}); T.reset(); for (const k in LS) delete LS[k]; };

console.log("\n# secrecy: nothing loads without Mom");
{
  mom = false; const r = el("x"); ctx.renderGifts(r, "<nav/>");
  ok("no Mom → 'Mom only', no listener on gifts/", /Mom only/.test(r.innerHTML) && listens.length === 0, listens);
  mom = true; ctx.renderGifts(r, "<nav/>");
  ok("Mom → one listener on gifts/ (and only there)", listens.length === 1 && listens[0] === "gifts", listens);
  ctx.renderGifts(r, "<nav/>");
  ok("re-opening never adds a second listener", listens.length === 1);
}

console.log("\n# people + groups");
{
  reset({ people: { "k_lucy": { paper: "Pink snowflakes" }, "p-grandma": { name: "Grandma", group: "mom" }, "p-old": { name: "Old", group: "dad", gone: true } },
    groups: { neighbors: { name: "Neighbors", emoji: "🏡", order: 60 }, teachers: { gone: true } } });
  const P = T.people(), ids = P.map(p => p.id);
  ok("the four kids come from the family list, in the Kids group", ["k_lincoln", "k_ellis", "k_lucy", "k_julian"].every(k => ids.includes(k)) && P.filter(p => p.group === "kids").length === 4);
  ok("a saved kid keeps their paper; name/color always from the family list", P.find(p => p.id === "k_lucy").paper === "Pink snowflakes" && P.find(p => p.id === "k_lucy").color === "#db2777");
  ok("her own people show; gone people hide", ids.includes("p-grandma") && !ids.includes("p-old"));
  const G = T.groups().map(g => g.id);
  ok("starter groups + hers; a gone starter group hides", G[0] === "kids" && G.includes("mom") && G.includes("dad") && G.includes("neighbors") && !G.includes("teachers"), G);
}

console.log("\n# start Christmas");
{
  reset({}); T.setRoot(root, "<nav/>"); T.draw();
  ok("no occasion yet → the Start Christmas 2026 card", /Start Christmas 2026/.test(root.innerHTML) && writes.length === 0);
  W.gfStartOcc("christmas");
  const s = writes.filter(w => w.op === "set");
  ok("ONE set on gifts/occasions/christmas-2026 + one log line", s.length === 1 && s[0].path === "gifts/occasions/christmas-2026" && writes.filter(w => w.op === "push" && w.path === "gifts/log").length === 1, writes.map(w => w.path));
  const secs = s[0].val.secs;
  ok("dated Dec 25, kind christmas, her four sections in order", s[0].val.date === "2026-12-25" && s[0].val.kind === "christmas" &&
    ["special", "parents", "stocking", "eve"].every((k, i) => secs[k] && secs[k].order === i) && secs.special.name === "Special" && secs.special.emoji === "⭐" && secs.stocking.name === "Stocking" && secs.eve.name === "Christmas Eve box");
  ok("NOSANTA: a new Christmas never says Santa anywhere (her ask 2026-11-20 — a kid may see the screen)", !/santa/i.test(JSON.stringify(s[0].val)) && !/santa/i.test(root.innerHTML));
  ok("the page now lists everyone by group", /Lincoln/.test(root.innerHTML) && /Kids/.test(root.innerHTML) && /Christmas 2026/.test(root.innerHTML));
}

const XMAS = () => ({ occasions: { "christmas-2026": { name: "Christmas 2026", kind: "christmas", date: "2026-12-25", budget: 1000,
  secs: { santa: { name: "Santa", emoji: "🎅", order: 0, paper: "Santa gold" }, parents: { name: "From Mom & Dad", emoji: "🎁", order: 1 }, stocking: { name: "Stocking", emoji: "🧦", order: 2 }, eve: { name: "Christmas Eve box", emoji: "🌙", order: 3 } } } },
  people: { "k_lucy": { paper: "Pink snowflakes" }, "k_ellis": { paper: "Blue trucks" }, "p-grandma": { name: "Grandma", group: "mom" } } });

console.log("\n# a present");
{
  reset(XMAS()); T.setRoot(root, "<nav/>");
  W.gfNewItem("k_lucy", "parents");
  ok("new present: for Lucy, From Mom & Dad, idea, her paper fills in", T.edit().form.pids.join() === "k_lucy" && T.edit().form.sec === "parents" && T.edit().form.status === "idea" && T.edit().form.paper === "Pink snowflakes");
  W.gfSetDraw("sec", "santa");
  ok("switch to Santa → the Santa paper fills in instead", T.edit().form.paper === "Santa gold");
  W.gfSetDraw("sec", "parents");
  W.gfSave(); ok("no name → nothing saved", writes.length === 0);
  W.gfSet("name", "LEGO treehouse"); W.gfSet("plan", "$80"); W.gfSet("paid", "74.99"); W.gfSet("where", "Master closet top shelf"); W.gfSetDraw("status", "here");
  W.gfSave();
  const s = writes.filter(w => w.op === "set");
  ok("ONE set on gifts/items/<id> + a log line", s.length === 1 && /^gifts\/items\/g/.test(s[0].path) && writes.filter(w => w.op === "push").length === 1);
  const v = s[0].val;
  ok("stored: numeric plan/paid, where, paper, status, pids array; blanks dropped", v.plan === 80 && v.paid === 74.99 && v.where === "Master closet top shelf" && v.paper === "Pink snowflakes" && v.status === "here" && v.pids.join() === "k_lucy" && !("store" in v) && !("note" in v), v);
  const id = s[0].path.split("/").pop();
  T.data().items[id].returnBy = "2027-01-31";   // a later slice's field
  writes.length = 0; W.gfEditItem(id); W.gfSet("paid", "70"); W.gfSave();
  const e = writes.find(w => w.op === "set").val;
  ok("edit keeps fields the sheet doesn't show (returnBy) and the first ts", e.returnBy === "2027-01-31" && e.paid === 70 && e.ts === v.ts, e);
}

console.log("\n# totals: paid · still to buy · budget · shared");
{
  const d = XMAS();
  d.items = {
    a: { occ: "christmas-2026", pids: ["k_lucy"], sec: "parents", name: "Treehouse", status: "here", paid: 75, plan: 80 },
    b: { occ: "christmas-2026", pids: ["k_lucy"], sec: "stocking", name: "Socks", status: "idea", plan: 10 },
    c: { occ: "christmas-2026", pids: ["k_lucy", "k_ellis"], sec: "santa", name: "Trampoline", status: "ordered", paid: 300 },
    d: { occ: "christmas-2026", pids: ["k_lucy"], sec: "parents", name: "Returned doll", status: "returned", paid: 40 },
    e: { occ: "christmas-2026", pids: ["p-grandma"], sec: "parents", name: "Scarf", status: "wrapped", paid: 25 },
    f: { occ: "other-occ", pids: ["k_lucy"], sec: "x", name: "Not this one", status: "here", paid: 999 } };
  d.plan = { "christmas-2026": { "k_lucy": { budget: 250, sec: { stocking: 30 } }, "g_mom": { budget: 100 } } };
  reset(d);
  const L = T.personTot("christmas-2026", "k_lucy");
  ok("Lucy: paid 75 + half the trampoline 150 = 225; still to buy 10; returned + other occasions don't count", L.paid === 225 && L.toBuy === 10 && L.count === 3 && L.shared === 1, L);
  ok("Lucy: budget 250 → 15 left", L.budget === 250 && T.left(L) === 15);
  const E = T.personTot("christmas-2026", "k_ellis");
  ok("Ellis: the shared trampoline counts once, half the cost", E.paid === 150 && E.count === 1);
  const LS2 = T.personTot("christmas-2026", "k_lucy", "stocking");
  ok("section budget: Lucy's stocking 30, 10 still to buy", LS2.budget === 30 && LS2.toBuy === 10 && LS2.paid === 0);
  const O = T.occTot("christmas-2026");
  ok("occasion: every live present once — 75 + 300 + 25 paid, 10 to buy, 4 presents; budget 1000 → 590 left", O.paid === 400 && O.toBuy === 10 && O.count === 4 && T.left(O) === 590, O);
  const G = T.groupTot("christmas-2026", "mom"), K = T.groupTot("christmas-2026", "kids");
  ok("Mom's side group: Grandma 25 against its 100 budget", G.paid === 25 && G.budget === 100 && T.left(G) === 75);
  ok("Kids group: the shared trampoline counts once in the group (full 300)", K.paid === 75 + 300 && K.count === 3, K);
  T.setRoot(root, "<nav/>"); T.draw(); const h = root.innerHTML;
  ok("people page: groups, names, amounts, what's left of the budget", /Mom&#39;s side/.test(h) && /\$225/.test(h) && /\$250/.test(h) && /\$590 left/.test(h));
  W.gfGroup("mom"); ok("GIFTS_GROUPS: Grandma shows under the 👩 Mom's side button (Kids is the default)", !/Grandma/.test(h) && /Grandma/.test(root.innerHTML)); W.gfGroup("kids");
  W.gfOpenPerson("k_lucy"); const ph = root.innerHTML;
  ok("Lucy's page: her sections, 🤝 with Ellis, where + status", /Stocking/.test(ph) && /Santa/.test(ph) && /🤝 with Ellis/.test(ph) && /Treehouse/.test(ph) && /\(\$150 each\)/.test(ph));
  W.gfBack(); ok("← Everyone goes back", T.view() === "people");
}

console.log("\n# ↪ move · next status · delete");
{
  const d = XMAS(); d.items = { a: { occ: "christmas-2026", pids: ["k_lucy"], sec: "parents", name: "Scooter", status: "idea", paid: 60, paper: "Pink snowflakes", where: "Garage" } };
  reset(d);
  W.gfMove("a"); W.gfTogglePid("k_lucy"); W.gfTogglePid("k_ellis"); W.gfSave();
  ok("move Lucy → Ellis = ONE update with the new pids", writes.filter(w => w.op === "update").length === 1 && writes[0].path === "gifts/items/a" && writes[0].val.pids.join() === "k_ellis");
  ok("her auto paper follows to Ellis's paper; where + paid stay", writes[0].val.paper === "Blue trucks" && T.data().items.a.where === "Garage" && T.data().items.a.paid === 60);
  ok("the log says who it moved from and to", writes.some(w => w.op === "push" && /Scooter: Lucy → Ellis/.test(w.val.text)));
  writes.length = 0; T.data().items.a.paper = "Hand-picked"; W.gfMove("a"); W.gfTogglePid("k_lucy"); W.gfSave();
  ok("a paper she picked by hand stays put on a move; adding Lucy makes it shared", !("paper" in writes[0].val) && writes[0].val.pids.join() === "k_ellis,k_lucy");
  writes.length = 0; W.gfNext("a");
  ok("➡ next status = ONE update {status: ordered}", writes.length === 2 && writes[0].op === "update" && writes[0].val.status === "ordered" && Object.keys(writes[0].val).length === 1);
  writes.length = 0; W.gfEditItem("a"); W.gfDelete();
  ok("delete = ONE remove", writes[0].op === "remove" && writes[0].path === "gifts/items/a" && !T.data().items.a);
}

console.log("\n# people, budgets, groups, occasions");
{
  const d = XMAS(); d.items = { a: { occ: "christmas-2026", pids: ["p-grandma"], sec: "parents", name: "Scarf", status: "idea" } };
  reset(d);
  W.gfNewPerson(); W.gfSet("name", "Aunt May"); W.gfSet("group", "dad"); W.gfSave();
  ok("＋ Person = ONE update on gifts/people/p-aunt-may (Dad's side)", writes[0].op === "update" && writes[0].path === "gifts/people/p-aunt-may" && writes[0].val.group === "dad" && writes[0].val.name === "Aunt May");
  writes.length = 0; W.gfEditPerson("k_julian"); W.gfSet("paper", "Dinosaurs"); W.gfSave();
  ok("a kid's paper saves on k_julian, still in Kids", writes[0].path === "gifts/people/k_julian" && writes[0].val.paper === "Dinosaurs" && writes[0].val.group === "kids");
  writes.length = 0; W.gfEditPerson("p-grandma"); W.gfDelete();
  ok("a person with presents is hidden (gone), never deleted", writes[0].op === "update" && writes[0].val.gone === true && !T.people().some(p => p.id === "p-grandma"));
  writes.length = 0; W.gfEditPerson("p-aunt-may"); W.gfDelete();
  ok("a person with no presents is removed", writes[0].op === "remove" && writes[0].path === "gifts/people/p-aunt-may");
  writes.length = 0; W.gfBudget("k_lucy"); W.gfSet("budget", "250"); W.gfSecBudget("stocking", "40"); W.gfSave();
  ok("💲 budget = ONE set on gifts/plan/<occ>/k_lucy with the section budget", writes[0].op === "set" && writes[0].path === "gifts/plan/christmas-2026/k_lucy" && writes[0].val.budget === 250 && writes[0].val.sec.stocking === 40);
  writes.length = 0; W.gfGroupBudget("dad"); W.gfSet("budget", "200"); W.gfSave();
  ok("group budget = ONE set on gifts/plan/<occ>/g_dad", writes[0].path === "gifts/plan/christmas-2026/g_dad" && writes[0].val.budget === 200);
  writes.length = 0; W.gfNewGroup(); W.gfSet("name", "Neighbors"); W.gfSet("emoji", "🏡"); W.gfSave();
  ok("＋ Group = ONE update on gifts/groups/neighbors", writes[0].path === "gifts/groups/neighbors" && writes[0].val.name === "Neighbors");
  writes.length = 0; W.gfNewOcc();
  ok("＋ Occasion starts as a birthday with its own name", T.edit().form.kind === "birthday" && /Birthday 2026/.test(T.edit().form.name));
  W.gfSet("name", "Lucy's birthday 2027"); W.gfSet("date", "2027-03-02"); W.gfSave();
  const s = writes.find(w => w.op === "set");
  ok("a birthday gets its own sections (Main · Party · Small)", s.path === "gifts/occasions/lucy-s-birthday-2027" && s.val.secs.main && s.val.secs.party && s.val.secs.small);
  T.setOcc("christmas-2026"); T.setRoot(root, "<nav/>"); W.gfOccEdit();
  ok("OCCFIX: ✏️ an occasion shows its Sections (rename a section there) + Done, and no Kind picker", /<span>Sections<\/span>/.test(root.innerHTML) && /Done — move it/.test(root.innerHTML) && !/<span>Kind<\/span>/.test(root.innerHTML) && /value="Santa"/.test(root.innerHTML));
  W.gfCancel(); W.gfNewOcc(); ok("…a NEW occasion shows Kind and no Sections", /<span>Kind<\/span>/.test(root.innerHTML) && !/<span>Sections<\/span>/.test(root.innerHTML)); W.gfCancel();
  writes.length = 0; T.setOcc("christmas-2026"); W.gfOccEdit(); W.gfSecAdd(); T.edit().form.secs[4].name = "Sibling gifts"; W.gfSet("closed", true); W.gfSave();
  ok("✏️ occasion: ＋ Section writes only the new section; Done → closed", writes.some(w => w.path === "gifts/occasions/christmas-2026/secs/sibling-gifts" && w.val.order === 4) &&
    writes.filter(w => /\/secs\//.test(w.path)).length === 1 && writes.find(w => w.path === "gifts/occasions/christmas-2026").val.closed === true);
}

console.log("\n# dry run");
{
  reset(XMAS()); dryRun = true;
  W.gfNewItem("k_lucy", "parents"); W.gfSet("name", "Book"); W.gfSave(); W.gfStartOcc("easter", "Easter 2027", "2027-03-28");
  ok("dry-run: nothing written, but the page still shows it", writes.length === 0 && T.items().some(it => it.name === "Book") && T.occs().some(o => o.name === "Easter 2027"));
  dryRun = false;
}

console.log("\n# index.html wiring");
{
  const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const blk = src.slice(src.indexOf("// GIFTS_START"), src.indexOf("// GIFTS_END"));
  ok("GIFTS block: lazy gifts.js loader", /function renderMPGifts\(el\)/.test(blk) && /gifts\.js/.test(blk));
  ok("loader checks Mom BEFORE loading anything", blk.indexOf("momHere()") > 0 && blk.indexOf("momHere()") < blk.indexOf("createElement(\"script\")"));
  ok("💰 Budget tab on Mom's Day's menu row (BUDGETTAB 2026-11-20: lit on any Budget page, reopens the last one)", /const gbtn=tbtn\(bud,\(typeof mpBudgetLast==="function"\)\?"mpGoto\(mpBudgetLast\(\)\)":"mpGoto\('gifts'\)",'💰 Budget'\);/.test(src) && /\$\{sbtn\}\$\{gbtn\}\$\{hlbtn\}/.test(src));
  ok("dispatch: mpSubView 'gifts' → renderMPGifts", /if\(mpSubView==='gifts'\)\{ return renderMPGifts\(el\); \}/.test(src));
  ok("'gifts' is not a Today view (SS_OTHER_VIEWS)", /SS_OTHER_VIEWS=\[[^\]]*"gifts"\]/.test(src));
  ok("gifts/ is never read by index.html itself (no boot listener — the secret stays off kid devices)", !/db\.ref\(["']gifts/.test(src));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
