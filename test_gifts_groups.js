/*
 * Node tests for 🎁 Gifts — GIFTS_GROUPS (her ask + "yes" 2026-11-20): group buttons on People + each group's own sections.
 *   · 👧 Kids · <each group that has people> · ＋ Group; Gifts OPENS on Kids every visit (a redraw while she's there keeps her pick)
 *   · a group's button shows only that group (its people, total, budget bar); the occasion card keeps everyone's total
 *   · a group with no sections saved = one 🎁 Gifts, and nothing is written until she changes something
 *   · ✏️ Sections = ONE update per section that changed, under gifts/groups/<gid>/secs/<sid>
 *   · section choices follow the (first) person's group: present sheet, ↪ Move, person page, budget sheet, receipt rows
 *   · the kids keep the occasion's sections; no family's kid names in the defaults
 *
 *   run:  node test_gifts_groups.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }

function el(id) { return { id, innerHTML: "", value: "", classList: { contains() { return false; }, add() {}, remove() {} }, querySelector() { return null; }, style: {}, focus() {}, appendChild() {} }; }
const nodes = {}; const root = el("content");
const document = { getElementById(id) { return nodes[id] || (nodes[id] = el(id)); }, createElement(t) { return el(t); }, head: { appendChild() {} }, activeElement: null, querySelector() { return null; } };
const writes = [];
const db = { ref(p) { return { set(v) { writes.push({ op: "set", path: p, val: JSON.parse(JSON.stringify(v)) }); }, update(v) { writes.push({ op: "update", path: p, val: JSON.parse(JSON.stringify(v)) }); }, remove() { writes.push({ op: "remove", path: p }); }, push(v) { writes.push({ op: "push", path: p, val: v }); }, on() {}, once() { return Promise.resolve({ val: () => null }); } }; } };
const LS = {};
const ctx = { console, Date, Math, JSON, Promise, document, db, _todayStr: () => "2026-11-20", _dryRun: () => false, momHere: () => true, gwShowToast() {}, confirm: () => true,
  HA_LS: { getItem: k => (k in LS ? LS[k] : null), setItem: (k, v) => { LS[k] = String(v); } }, tab: "moms-plan", mpSubView: "gifts" };
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext("const ROSTER_DEF=[{id:'ava',name:'Ava',color:'#2563eb'},{id:'ben',name:'Ben',color:'#16a34a'}];", ctx);   // generic names
const SRC = fs.readFileSync(path.join(__dirname, "gifts.js"), "utf8");
vm.runInContext(SRC, ctx);
const T = ctx._gfTest, G = T.gr, W = ctx;
const reset = d => { writes.length = 0; T.setData(d || {}); T.reset(); for (const k in LS) delete LS[k]; T.setRoot(root, "<nav/>"); };
const ups = () => writes.filter(w => w.op !== "push");

const D = () => ({
  occasions: { x: { name: "Christmas 2026", kind: "christmas", date: "2026-12-25", budget: 1000,
    secs: { special: { name: "Special", emoji: "⭐", order: 0 }, parents: { name: "From Mom & Dad", emoji: "🎁", order: 1 }, stocking: { name: "Stocking", emoji: "🧦", order: 2 }, eve: { name: "Christmas Eve box", emoji: "🌙", order: 3 } } } },
  groups: { house: { name: "Our house", emoji: "👥", order: 52 }, empty: { name: "Neighbors", emoji: "🏡", order: 53 } },
  people: { "p-pat": { name: "Pat", group: "house", ts: 1 } },
  plan: { x: { g_house: { budget: 100 } } },
  items: {
    a: { occ: "x", pids: ["k_ava"], sec: "stocking", name: "Socks", status: "idea", plan: 10 },
    b: { occ: "x", pids: ["k_ben"], sec: "special", name: "Bike", status: "here", paid: 200 },
    c: { occ: "x", pids: ["p-pat"], sec: "gifts", name: "Watch", status: "here", paid: 40 },
    d: { occ: "x", pids: ["p-pat"], sec: "stocking", name: "Old pick", status: "idea", plan: 5 } } });

console.log("\n# 👧 Kids is the default — every visit");
{
  reset(D()); W.renderGifts(root, "<nav/>"); let h = root.innerHTML;
  ok("group bar: 👧 Kids (on) · 👥 Our house · ＋ Group", /class="gf-grp on" onclick="gfGroup\('kids'\)">👧 Kids</.test(h) && /gfGroup\('house'\)">👥 Our house</.test(h) && /gf-grp add[^>]*>＋ Group</.test(h));
  ok("a group with no people gets no button (Neighbors, Mom's side)", !/gfGroup\('empty'\)/.test(h) && !/gfGroup\('mom'\)/.test(h));
  ok("Kids view: the kids are there, Pat isn't", /Ava/.test(h) && /Ben/.test(h) && !/>Pat</.test(h) && !/Watch/.test(h));
  ok("＋ Group is on the bar (not twice)", (h.match(/＋ Group/g) || []).length === 1);
  W.gfGroup("house"); h = root.innerHTML;
  ok("Our house: only Pat; the kids disappear", /Pat/.test(h) && !/gfOpenPerson\('k_ava'\)/.test(h) && !/gfOpenPerson\('k_ben'\)/.test(h) && /class="gf-grp on" onclick="gfGroup\('house'\)"/.test(h));
  ok("its own total + budget bar: $40 / $100", /👥 Our house<\/span><span class="gf-gsum">\$40 \/ \$100/.test(h) && /gf-bar/.test(h));
  ok("the occasion card still adds up everyone ($240 paid, $15 to buy, budget $1,000)", /<b>\$240<\/b> paid · \$15 still to buy · budget \$1,000/.test(h));
  ok("✏️ Sections + her group's sections line (🎁 Gifts) — none on Kids", /gfGrpSecs\('house'\)">✏️ Sections/.test(h) && /gf-grpsec"><span>🎁 Gifts</.test(h));
  W.gfOpenPerson("p-pat"); W.gfBack();
  ok("← Everyone from Pat's page comes back to Our house", /class="gf-grp on" onclick="gfGroup\('house'\)"/.test(root.innerHTML));
  const here = Object.assign(el("content"), { querySelector: q => (q === "#gf-page" ? {} : null) });
  W.renderGifts(here, "<nav/>");
  ok("a redraw while she's on Gifts keeps Our house", G.cur() === "house" && /Watch|Pat/.test(here.innerHTML));
  W.renderGifts(root, "<nav/>");
  ok("a fresh visit opens on Kids again", G.cur() === "kids" && !/>Pat</.test(root.innerHTML));
  G.set("gone-group"); W.gfGroup("nobody"); T.draw();
  ok("a group that has no one left falls back to Kids", G.cur() === "kids" && /Ava/.test(root.innerHTML));
  W.gfGroup("house"); W.gfNewPerson();
  ok("＋ Person from Our house starts in Our house", T.edit().form.group === "house");
  ok("nothing was written by looking around", ups().length === 0, writes);
}

console.log("\n# 🎁 Gifts stand-in + ✏️ Sections (ONE update per section)");
{
  reset(D());
  const S = G.grpSecs("house");
  ok("no sections saved → one virtual 🎁 Gifts", S.length === 1 && S[0].id === "gifts" && S[0].name === "Gifts" && S[0].virtual);
  W.gfOpenPerson("p-pat"); let h = root.innerHTML;
  ok("Pat's page: 🎁 Gifts (Watch) + 📦 No section (Old pick) — no Special / Stocking", /🎁 Gifts/.test(h) && /Watch/.test(h) && /📦 No section/.test(h) && /Old pick/.test(h) && !/⭐ Special/.test(h) && !/🧦 Stocking/.test(h));
  writes.length = 0; W.gfGrpSecs("house"); h = root.innerHTML;
  ok("✏️ Sections sheet lists 🎁 Gifts", /✏️ Sections/.test(h) && /value="Gifts"/.test(h) && T.edit().kind === "gsecs");
  W.gfSave();
  ok("saving with nothing changed writes NOTHING", ups().length === 0 && writes.length === 0, writes);
  W.gfGrpSecs("house"); W.gfSecAdd(); W.gfSecEdit(1, "name", "Stocking"); W.gfSecEdit(1, "emoji", "🧦"); W.gfSave();
  let U = ups();
  ok("adding a section: 🎁 Gifts saved too (so Watch stays in it) + the new one — ONE update each", U.length === 2 && U.every(w => w.op === "update") &&
    U[0].path === "gifts/groups/house/secs/gifts" && U[0].val.name === "Gifts" && U[0].val.order === 0 &&
    U[1].path === "gifts/groups/house/secs/stocking" && U[1].val.name === "Stocking" && U[1].val.emoji === "🧦" && U[1].val.order === 1, U);
  ok("+ one log line; nothing else touched (group record, occasion sections)", writes.filter(w => w.op === "push" && w.path === "gifts/log").length === 1 && !writes.some(w => /occasions|^gifts\/groups\/house$/.test(w.path)));
  ok("Pat's sections now 🎁 Gifts · 🧦 Stocking (her group's own), the kids' unchanged", G.grpSecs("house").map(s => s.id).join() === "gifts,stocking" && T.secsOf(T.data().occasions.x).map(s => s.id).join() === "special,parents,stocking,eve");
  writes.length = 0; W.gfGrpSecs("house"); W.gfSecEdit(0, "name", "Big gift"); W.gfSave(); U = ups();
  ok("renaming one = ONE update of just that section", U.length === 1 && U[0].path === "gifts/groups/house/secs/gifts" && U[0].val.name === "Big gift" && U[0].val.order === 0, U);
  writes.length = 0; W.gfGrpSecs("house"); W.gfSecAdd(); W.gfSecEdit(2, "name", "Fun"); W.gfSave(); U = ups();
  ok("another new one: ONE update, next in order", U.length === 1 && U[0].path === "gifts/groups/house/secs/fun" && U[0].val.order === 2, U);
  W.gfOpenPerson("p-pat"); h = root.innerHTML;
  ok("Pat's page: 🎁 Big gift (Watch) · 🧦 Stocking (Old pick moved in by id) · Fun", /🎁 Big gift/.test(h) && /🧦 Stocking/.test(h) && /Fun/.test(h) && !/📦 No section/.test(h));
  ok("kept across occasions: stored on the group, not the occasion", !!T.data().groups.house.secs.fun && !T.data().occasions.x.secs.fun);
}

console.log("\n# Section choices follow the person's group");
{
  reset(D()); T.setOcc("x");
  W.gfNewItem("p-pat", null);
  ok("new present for Pat: starts in 🎁 Gifts; picker shows only his group's", T.edit().form.sec === "gifts" && /gfSetDraw\('sec','gifts'\)/.test(root.innerHTML) && !/gfSetDraw\('sec','special'\)/.test(root.innerHTML));
  W.gfCancel(); W.gfNewItem("k_ava", null);
  ok("new present for a kid: the occasion's sections (⭐ Special first)", T.edit().form.sec === "special" && /gfSetDraw\('sec','stocking'\)/.test(root.innerHTML) && !/gfSetDraw\('sec','gifts'\)/.test(root.innerHTML));
  W.gfCancel(); W.gfNewItem(null, null);
  ok("no one picked yet: the occasion's sections", T.edit().form.sec === "special");
  W.gfTogglePid("p-pat");
  ok("tap Pat → section switches to his group's 🎁 Gifts", T.edit().form.sec === "gifts" && /gfSetDraw\('sec','gifts'\)/.test(root.innerHTML));
  W.gfTogglePid("k_ben");
  ok("first person decides: Pat first + Ben → still Pat's sections", T.edit().form.sec === "gifts");
  W.gfTogglePid("p-pat");
  ok("Pat off (Ben first now) → back to the occasion's sections", T.edit().form.sec === "special");
  W.gfSetDraw("sec", "stocking"); W.gfTogglePid("k_ava");
  ok("a kid's chosen section stays when another kid is added", T.edit().form.sec === "stocking");
  W.gfSet("name", "Game"); writes.length = 0; W.gfSave();
  ok("save = ONE set of the present with the kids' section", ups().length === 1 && ups()[0].op === "set" && ups()[0].val.sec === "stocking");

  reset(D()); T.setOcc("x"); W.gfMove("a");
  W.gfTogglePid("k_ava"); W.gfTogglePid("p-pat");
  ok("↪ Move a kid's stocking present to Pat → his 🎁 Gifts, his chips only", T.edit().form.sec === "gifts" && /gfSetDraw\('sec','gifts'\)/.test(root.innerHTML) && !/gfSetDraw\('sec','stocking'\)/.test(root.innerHTML));
  writes.length = 0; W.gfSave();
  ok("Move = ONE update (pids + sec)", ups().length === 1 && ups()[0].op === "update" && ups()[0].path === "gifts/items/a" && ups()[0].val.sec === "gifts" && ups()[0].val.pids.join() === "p-pat", ups());

  reset(D()); T.setOcc("x"); W.gfBudget("p-pat");
  ok("Pat's 💲 budget sheet: his group's 🎁 Gifts, not the kids' sections", /🎁 Gifts \(optional\)/.test(root.innerHTML) && !/Stocking \(optional\)/.test(root.innerHTML));
  W.gfCancel(); W.gfBudget("k_ava");
  ok("a kid's 💲 budget sheet: the occasion's sections", /🧦 Stocking \(optional\)/.test(root.innerHTML));

  reset(D()); T.setOcc("x"); W.gfRcptNew();
  T.rc.load(T.edit().form, { store: "Shop", lines: [{ name: "Scarf", price: 20 }, { name: "Yo-yo", price: 4 }] }, "x");
  const rows = T.edit().form.rows;
  ok("receipt rows start on the occasion's first section (rcRow)", rows.every(r => r.sec === "special"));
  W.gfRcPid(0, "p-pat"); W.gfRcPid(1, "k_ben"); const h = root.innerHTML;
  ok("receipt line for Pat → his 🎁 Gifts chip (and its sec follows)", rows[0].sec === "gifts" && /gfRcSec\(0,'gifts'\)/.test(h) && !/gfRcSec\(0,'special'\)/.test(h));
  ok("receipt line for a kid → the occasion's chips", rows[1].sec === "special" && /gfRcSec\(1,'stocking'\)/.test(h) && !/gfRcSec\(1,'gifts'\)/.test(h));
  writes.length = 0; W.gfSave();
  const made = writes.filter(w => w.op === "set" && /^gifts\/items\//.test(w.path)).map(w => w.val);
  ok("saved presents carry their person's section", made.find(v => v.name === "Scarf").sec === "gifts" && made.find(v => v.name === "Yo-yo").sec === "special", made);
}

console.log("\n# Kids unchanged + no family names");
{
  reset(D()); const o = T.data().occasions.x;
  ok("secsFor(kid) = the occasion's sections", G.secsFor(o, ["k_ben"]).map(s => s.id).join() === "special,parents,stocking,eve");
  ok("⚖️ Even still uses the occasion's sections for the kids", T.evenData("x").secs.map(r => r.sec.id).join() === "special,parents,stocking,eve");
  const blk = SRC.slice(SRC.indexOf("// GIFTS_GROUPS_START"), SRC.indexOf("// GIFTS_GROUPS_END"));
  ok("GIFTS_GROUPS block found", blk.length > 1000);
  ok("no Howe kid names in the block or its defaults", !/Lincoln|Ellis|Lucy|Julian/.test(blk));
  W.renderGifts(root, "<nav/>"); W.gfGroup("house");
  ok("no Howe kid names on screen for another family", !/Lincoln|Ellis|Lucy|Julian/.test(root.innerHTML));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
