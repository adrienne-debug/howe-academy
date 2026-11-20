/*
 * Node tests for 🎁 Gifts — slice 6 (2026-11-20): any occasion + history + birthdays in gifts.js (GIFTS_OCC_START … GIFTS_OCC_END).
 *   · a birthday is about ONE person: made from the 🎂 nudge or ＋ Occasion = ONE set on gifts/occasions/<oid> carrying for:<pid>
 *     (+ budget in the same set), name "<name>'s birthday <year>", date = their next birthday; a typed date/name wins
 *   · its People view: that person first and open (presents, budget, ＋ Present); everyone else folded under "Others giving or
 *     getting" (closed until tapped); a Christmas has no fold
 *   · 🎂 nudge: only inside 30 days, only without an occasion for that birthday, age only with a birth year — and NOTHING is
 *     written until she taps it; dry-run writes nothing
 *   · 🕰 Last time on a person's page: earlier occasions of the same kind + their last birthday, newest first, 8 at most, no ideas
 *     / dropped, read-only
 *   · sizes save = ONE update on gifts/people/<pid>; shown on their page
 *   · 📜 Past lists totals (paid · count), newest first; a closed occasion says how to reopen; untick Done = closed:null
 *   · the block writes nothing itself (no new nodes: only occasions/<oid>.for and people/<pid>.sizes)
 *
 *   run:  node test_gifts_occasions.js
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
const SRC = fs.readFileSync(path.join(__dirname, "gifts.js"), "utf8");
vm.runInContext(SRC, ctx);
const T = ctx._gfTest, W = ctx, OC = T.oc;
const reset = d => { writes.length = 0; T.setData(d || {}); T.reset(); for (const k in LS) delete LS[k]; T.setRoot(root, "<nav/>"); };
const sets = () => writes.filter(w => w.op === "set"), nonLog = () => writes.filter(w => w.path !== "gifts/log");

const XSECS = { santa: { name: "Santa", emoji: "🎅", order: 0 }, parents: { name: "From Mom & Dad", emoji: "🎁", order: 1 } };
const BSECS = { main: { name: "Main gift", emoji: "🎁", order: 0 }, party: { name: "Party", emoji: "🎈", order: 1 }, small: { name: "Small things", emoji: "🧁", order: 2 } };
const PEOPLE = () => ({
  "k_lucy": { birthday: "2017-12-15" },                                   // 25 days → turns 9
  "p-grandma": { name: "Grandma", group: "mom", birthday: "1950-12-05" },  // 15 days → turns 76
  "p-aunt": { name: "Aunt Bea", group: "dad", birthday: "1980-12-20" },    // exactly 30 days
  "p-uncle": { name: "Uncle Al", group: "dad", birthday: "1979-12-21" },   // 31 days → no nudge
  "p-pat": { name: "Pat", group: "friends", birthday: "--12-01" },         // no year → no age
  "p-teach": { name: "Ms. Kay", group: "teachers" } });                    // no birthday
const D = () => ({ occasions: { x: { name: "Christmas 2026", kind: "christmas", date: "2026-12-25", secs: XSECS } }, people: PEOPLE() });

console.log("\n# the block");
{
  const a = SRC.indexOf("// GIFTS_OCC_START"), b = SRC.indexOf("// GIFTS_OCC_END"), blk = SRC.slice(a, b);
  ok("marked block GIFTS_OCC_START … GIFTS_OCC_END", a > 0 && b > a);
  ok("the block writes nothing itself (every write rides gfStartOcc / the person + occasion saves)", !/\bwrite\(/.test(blk) && !/db\.ref/.test(blk));
}

console.log("\n# next birthday");
{
  ok("Dec 15 2017 → 2026-12-15, turns 9, 25 days", JSON.stringify(OC.nextBday("2017-12-15")) === JSON.stringify({ iso: "2026-12-15", year: 2026, age: 9, days: 25 }), OC.nextBday("2017-12-15"));
  ok("already passed this year → next year", OC.nextBday("2015-03-02").iso === "2027-03-02" && OC.nextBday("2015-03-02").age === 12);
  ok("today counts as upcoming", OC.nextBday("2000-11-20").days === 0);
  ok("no birth year → no age", OC.nextBday("--12-01").age === null && OC.nextBday("12-01").iso === "2026-12-01");
  ok("Feb 29 in a common year → Feb 28", OC.nextBday("2016-02-29").iso === "2027-02-28");
  ok("junk → null", OC.nextBday("") === null && OC.nextBday("soon") === null);
}

console.log("\n# 🎂 nudges — inside 30 days, no occasion yet, nothing written until the tap");
{
  reset(D()); T.setOcc("x"); T.draw(); const h = root.innerHTML;
  ok("Grandma turns 76 on Dec 5", /Grandma turns 76 on Dec 5 — start their list\?/.test(h));
  ok("Lucy turns 9 on Dec 15", /Lucy turns 9 on Dec 15/.test(h));
  ok("exactly 30 days still nudges; 31 days doesn't", /Aunt Bea turns 46/.test(h) && /in 30 days/.test(h) && !/Uncle Al turns/.test(h));
  ok("no birth year → no age", /Pat's birthday is on Dec 1/.test(h) && !/Pat turns/.test(h));
  ok("soonest first, on top of Gifts", h.indexOf("Pat") < h.indexOf("Grandma turns") && h.indexOf("Grandma turns") < h.indexOf("Lucy turns") && h.indexOf("Lucy turns") < h.indexOf("gf-occs"));
  ok("drawing them wrote NOTHING", writes.length === 0, writes);
  W.gfGo("wrap"); ok("not on the other views", !/gf-nudge/.test(root.innerHTML));
  const d2 = D(); d2.occasions.lb = { name: "Lucy's birthday 2026", kind: "birthday", for: "k_lucy", date: "2026-12-15", secs: BSECS };
  d2.occasions.old = { name: "Grandma's birthday 2025", kind: "birthday", for: "p-grandma", date: "2025-12-05", closed: true, secs: BSECS };
  reset(d2); T.setOcc("x"); T.draw();
  ok("an occasion for that birthday stops the nudge; last year's closed one doesn't", !/Lucy turns 9/.test(root.innerHTML) && /Grandma turns 76/.test(root.innerHTML));
  const d3 = D(); d3.occasions.lb = { name: "Lucy's birthday 2026", kind: "birthday", for: "k_lucy", date: "2026-12-15", closed: true, secs: BSECS };
  reset(d3); T.setOcc("x"); T.draw();
  ok("…even when she already closed this year's", !/Lucy turns 9/.test(root.innerHTML));
  reset({ people: PEOPLE() }); T.draw();
  ok("no occasions yet: the nudge sits above Start Christmas", /Grandma turns 76/.test(root.innerHTML) && /Start Christmas/.test(root.innerHTML) && writes.length === 0);
}

console.log("\n# the tap = ONE set of the birthday occasion, with for");
{
  reset(D()); T.setOcc("x"); T.draw();
  ok("the nudge's button calls gfBdayStart", /gfBdayStart\('k_lucy'\)/.test(root.innerHTML));
  W.gfBdayStart("k_lucy");
  const s = sets(), occW = nonLog();
  ok("ONE set on gifts/occasions/lucy-s-birthday-2026 (+ one log line), nothing else", s.length === 1 && occW.length === 1 && s[0].path === "gifts/occasions/lucy-s-birthday-2026" && writes.filter(w => w.op === "push" && w.path === "gifts/log").length === 1, writes.map(w => w.path));
  const v = s[0].val;
  ok("for:k_lucy · kind birthday · date from the birthday · its name", v.for === "k_lucy" && v.kind === "birthday" && v.date === "2026-12-15" && v.name === "Lucy's birthday 2026", v);
  ok("birthday sections (Main · Party · Small)", v.secs.main && v.secs.party && v.secs.small);
  ok("it opens, and the Lucy nudge is gone", T.curOcc() === "lucy-s-birthday-2026" && !/Lucy turns 9/.test(root.innerHTML) && /Grandma turns 76/.test(root.innerHTML));
  writes.length = 0; W.gfBdayStart("k_lucy");
  ok("tapping again opens the same one — no second occasion", writes.length === 0 && T.curOcc() === "lucy-s-birthday-2026");
  reset(D()); dryRun = true; W.gfBdayStart("p-grandma"); dryRun = false;
  ok("?dryrun=1 → no writes", writes.length === 0);
}

console.log("\n# ＋ Occasion → a birthday: whose, name + date fill in, ONE set");
{
  reset(D()); T.setOcc("x");
  W.gfNewOcc(); ok("the sheet shows Whose birthday? with the person chips", /Whose birthday\?/.test(root.innerHTML) && /gfOccFor\('p-grandma'\)/.test(root.innerHTML) && /Grandma 🎂/.test(root.innerHTML));
  W.gfOccFor("p-grandma");
  ok("picking Grandma fills the name and her next birthday", T.edit().form.name === "Grandma's birthday 2026" && T.edit().form.date === "2026-12-05" && T.edit().form.for === "p-grandma", T.edit().form);
  W.gfSet("budget", "50"); writes.length = 0; W.gfSave();
  const s = sets();
  ok("ONE set with for + budget inside it (no second budget write)", s.length === 1 && nonLog().length === 1 && s[0].val.for === "p-grandma" && s[0].val.budget === 50 && s[0].path === "gifts/occasions/grandma-s-birthday-2026", writes.map(w => w.path));
  reset(D()); T.setOcc("x"); W.gfNewOcc(); W.gfSet("date", "2027-01-10"); W.gfOccFor("p-teach");
  ok("a date she typed stays; the name takes its year", T.edit().form.date === "2027-01-10" && T.edit().form.name === "Ms. Kay's birthday 2027", T.edit().form);
  W.gfSet("name", "Party for Kay"); W.gfOccFor("p-teach"); W.gfOccFor("p-teach");
  ok("a name she typed stays too", T.edit().form.name === "Party for Kay");
  W.gfSetDraw("kind", "easter"); writes.length = 0; W.gfSave();
  ok("switch to Easter → no for stored", !("for" in sets()[0].val));
  ok("Easter has no Whose birthday picker", (W.gfNewOcc(), W.gfSetDraw("kind", "easter"), !/Whose birthday/.test(root.innerHTML)));
}

console.log("\n# a birthday's People view: that person first + open, the rest folded");
{
  const d = D(); d.occasions.lb = { name: "Lucy's birthday 2026", kind: "birthday", for: "k_lucy", date: "2026-12-15", secs: BSECS };
  d.plan = { lb: { k_lucy: { budget: 120 } } };
  d.items = {
    a: { occ: "lb", pids: ["k_lucy"], sec: "main", name: "Art easel", status: "ordered", paid: 70 },
    b: { occ: "lb", pids: ["k_lucy"], sec: "small", name: "Stickers", status: "idea", plan: 8 },
    c: { occ: "lb", pids: ["k_ellis"], sec: "small", name: "Sibling gift", status: "here", paid: 10 },
    z: { occ: "x", pids: ["k_lucy"], sec: "santa", name: "Xmas only", status: "here", paid: 5 } };
  reset(d); T.setOcc("lb"); T.draw(); let h = root.innerHTML;
  ok("Lucy's card first: name, her presents, budget", /🎂 Lucy · turns 9/.test(h) && /Art easel/.test(h) && /Stickers/.test(h) && /\$70<\/b> paid/.test(h) && /budget \$120/.test(h) && !/Xmas only/.test(h));
  ok("＋ Present for her in the first section, 💲 Budget, Their page", /gfNewItem\('k_lucy','main'\)/.test(h) && /gfBudget\('k_lucy'\)/.test(h) && /gfOpenPerson\('k_lucy'\)">Their page/.test(h));
  ok("everyone else folded: 'Others giving or getting · 1 present', closed", /▸ Others giving or getting · 1 present/.test(h) && !/gfOpenPerson\('k_ellis'\)/.test(h) && !/Sibling gift/.test(h) && OC.othersOpen() === null);
  ok("the star card comes before the fold", h.indexOf("Art easel") < h.indexOf("Others giving or getting"));
  ok("opening it wrote nothing", writes.length === 0);
  W.gfOthers(); h = root.innerHTML;
  ok("tap → the groups show, Lucy not listed twice", /▾ Others giving or getting/.test(h) && /gfOpenPerson\('k_ellis'\)/.test(h) && /Grandma/.test(h) && (h.match(/gfOpenPerson\('k_lucy'\)/g) || []).length === 1);
  W.gfOthers(); ok("tap again → folded", !/gfOpenPerson\('k_ellis'\)/.test(root.innerHTML) && writes.length === 0);
  W.gfNewItem("k_lucy", "main"); W.gfSet("name", "Paints"); W.gfSave();
  ok("＋ Present from her card is for her", sets()[0].val.pids.join() === "k_lucy" && sets()[0].val.occ === "lb");
  W.gfPickOcc("x"); h = root.innerHTML;
  ok("a Christmas has no fold — every group shows", !/Others giving or getting/.test(h) && /gfOpenPerson\('k_lucy'\)/.test(h) && /gfOpenPerson\('k_ellis'\)/.test(h));
  const d2 = JSON.parse(JSON.stringify(d)); delete d2.occasions.lb.for; reset(d2); T.setOcc("lb"); T.draw();
  ok("an older birthday with no for → the usual People view", !/Others giving or getting/.test(root.innerHTML) && /gfOpenPerson\('k_lucy'\)/.test(root.innerHTML));
  reset(d); T.setOcc("lb"); W.gfOccEdit(); ok("✏️ a birthday shows whose it is", /Whose birthday/.test(root.innerHTML) && T.edit().form.for === "k_lucy");
  W.gfOccFor("p-grandma"); writes.length = 0; W.gfSave();
  const u = writes.find(w => w.path === "gifts/occasions/lb");
  ok("✏️ changing whose = for in the occasion's ONE update; the name she had stays", u.op === "update" && u.val.for === "p-grandma" && u.val.name === "Lucy's birthday 2026");
}

console.log("\n# 🕰 Last time on a person's page");
{
  const d = D();
  Object.assign(d.occasions, {
    x24: { name: "Christmas 2024", kind: "christmas", date: "2024-12-25", closed: true, secs: XSECS },
    x25: { name: "Christmas 2025", kind: "christmas", date: "2025-12-25", closed: true, secs: XSECS },
    lb25: { name: "Lucy's birthday 2025", kind: "birthday", for: "k_lucy", date: "2025-12-15", closed: true, secs: BSECS },
    eb26: { name: "Ellis's birthday 2026", kind: "birthday", for: "k_ellis", date: "2026-06-01", closed: true, secs: BSECS },
    ea26: { name: "Easter 2026", kind: "easter", date: "2026-04-05", closed: true, secs: {} } });
  d.items = {
    p1: { occ: "x24", pids: ["k_lucy"], name: "Doll house", status: "given", paid: 90, ts: 1 },
    p2: { occ: "x25", pids: ["k_lucy"], name: "Scooter", status: "given", paid: 60, ts: 2 },
    p3: { occ: "x25", pids: ["k_lucy", "k_ellis"], name: "Board game", status: "given", paid: 30, ts: 3 },
    p4: { occ: "x25", pids: ["k_lucy"], name: "Never bought", status: "idea", plan: 20, ts: 4 },
    p5: { occ: "x25", pids: ["k_lucy"], name: "Dropped one", status: "dropped", ts: 5 },
    p6: { occ: "lb25", pids: ["k_lucy"], name: "Bike helmet", status: "given", paid: 35, ts: 6 },
    p7: { occ: "ea26", pids: ["k_lucy"], name: "Easter basket", status: "given", paid: 25, ts: 7 },
    p8: { occ: "eb26", pids: ["k_lucy"], name: "At Ellis's party", status: "given", paid: 5, ts: 8 },
    p9: { occ: "x", pids: ["k_lucy"], name: "This year", status: "idea", ts: 9 },
    p10: { occ: "x25", pids: ["k_lucy"], name: "Returned one", status: "returned", paid: 12, ts: 10 } };
  for (let i = 0; i < 6; i++) d.items["q" + i] = { occ: "x24", pids: ["k_lucy"], name: "Small " + i, status: "given", paid: 1, ts: 100 + i };
  reset(d); T.setOcc("x");
  const L = OC.pastGifts(T.occs().find(o => o.id === "x"), "k_lucy"), names = L.map(r => r.name);
  ok("Christmas: earlier Christmases + her last birthday — not Easter, not Ellis's birthday, not this year", names.indexOf("Scooter") >= 0 && names.indexOf("Bike helmet") >= 0 && names.indexOf("Easter basket") < 0 && names.indexOf("At Ellis's party") < 0 && names.indexOf("This year") < 0, names);
  ok("no ideas or dropped; a return still shows", names.indexOf("Never bought") < 0 && names.indexOf("Dropped one") < 0 && names.indexOf("Returned one") >= 0);
  ok("newest first, 8 at most", L.length === 8 && names[0] === "Returned one" && names.indexOf("Bike helmet") > names.indexOf("Scooter") && names.indexOf("Bike helmet") < names.indexOf("Small 5"), names);
  ok("each row: name, paid, status, which occasion, shared", L.find(r => r.name === "Board game").shared && L.find(r => r.name === "Scooter").paid === 60 && L.find(r => r.name === "Scooter").occ === "Christmas 2025" && L.find(r => r.name === "Scooter").status === "given");
  W.gfOpenPerson("k_lucy"); const h = root.innerHTML, i = h.indexOf("🕰 Last time"), strip = h.slice(i, h.indexOf('<div class="gf-card">', i + 1));
  ok("her page shows the strip", i > 0 && /Scooter/.test(strip) && /Christmas 2025/.test(strip) && /\$60/.test(strip) && /🎄 Given/.test(strip) && /🤝 shared/.test(strip));
  ok("…read-only: no buttons in it", !/onclick/.test(strip));
  ok("opening it wrote nothing", writes.length === 0);
  const d4 = JSON.parse(JSON.stringify(d)); d4.occasions.lb26 = { name: "Lucy's birthday 2026", kind: "birthday", for: "k_lucy", date: "2026-12-15", secs: BSECS };
  d4.items.up = { occ: "lb26", pids: ["k_lucy"], name: "Upcoming easel", status: "ordered", paid: 70, ts: 999 };
  reset(d4); T.setOcc("x");
  const L4 = OC.pastGifts(T.occs().find(o => o.id === "x"), "k_lucy").map(r => r.name);
  ok("a birthday still coming (Dec 15, before Christmas but after today) isn't 'last time' — her last one is", L4.indexOf("Upcoming easel") < 0 && L4.indexOf("Bike helmet") >= 0, L4);
  const Lb = OC.pastGifts({ id: "new", kind: "birthday", date: "2026-12-15", for: "k_lucy" }, "k_lucy").map(r => r.name);
  ok("a birthday: earlier birthdays (hers and a sibling's) — no Christmases", Lb.join() === "At Ellis's party,Bike helmet", Lb);
  W.gfOpenPerson("p-teach"); ok("nobody's past → no strip", !/Last time/.test(root.innerHTML));
}

console.log("\n# 👕 sizes");
{
  reset(D()); T.setOcc("x");
  W.gfEditPerson("p-grandma"); ok("the person sheet has 👕 Sizes and keeps notes", /👕 Sizes/.test(root.innerHTML) && /Likes, notes/.test(root.innerHTML));
  W.gfSet("sizes", " sweater L · shoe 8 "); writes.length = 0; W.gfSave();
  const u = nonLog();
  ok("save = ONE update on gifts/people/p-grandma with sizes", u.length === 1 && u[0].op === "update" && u[0].path === "gifts/people/p-grandma" && u[0].val.sizes === "sweater L · shoe 8" && u[0].val.birthday === "1950-12-05", u);
  W.gfOpenPerson("p-grandma"); ok("shown on her page", /👕 sweater L · shoe 8/.test(root.innerHTML));
  W.gfEditPerson("p-grandma"); ok("…and read back into the sheet", T.edit().form.sizes === "sweater L · shoe 8");
  W.gfSet("sizes", ""); writes.length = 0; W.gfSave();
  ok("cleared = sizes:null in the same ONE update", nonLog().length === 1 && nonLog()[0].val.sizes === null && !("sizes" in T.data().people["p-grandma"]));
  W.gfEditPerson("k_lucy"); W.gfSet("sizes", "shirt 10"); writes.length = 0; W.gfSave();
  ok("a kid: ONE update on gifts/people/k_lucy", nonLog().length === 1 && nonLog()[0].path === "gifts/people/k_lucy" && nonLog()[0].val.sizes === "shirt 10");
}

console.log("\n# 📜 Past — totals, reopen");
{
  const d = D();
  Object.assign(d.occasions, {
    x24: { name: "Christmas 2024", kind: "christmas", date: "2024-12-25", closed: true, secs: XSECS },
    x25: { name: "Christmas 2025", kind: "christmas", date: "2025-12-25", closed: true, secs: XSECS } });
  d.items = { a: { occ: "x25", pids: ["k_lucy"], name: "Scooter", status: "given", paid: 60 }, b: { occ: "x25", pids: ["k_ellis"], name: "Kite", status: "given", paid: 20.5 },
    c: { occ: "x25", pids: ["k_ellis"], name: "Gone", status: "returned", paid: 40 }, e: { occ: "x24", pids: ["k_lucy"], name: "Doll", status: "given", paid: 15 } };
  reset(d); T.setOcc("x"); T.draw(); const h = root.innerHTML;
  ok("📜 Past options carry paid · count (a return doesn't count)", /Christmas 2025 — \$80\.50 paid · 2 presents/.test(h) && /Christmas 2024 — \$15 paid · 1 present</.test(h), h.match(/<option[^>]*>[^<]*/g));
  ok("newest first", h.indexOf("Christmas 2025 —") < h.indexOf("Christmas 2024 —"));
  W.gfPickOcc("x25");
  ok("a past occasion says how to reopen it", /📜 Past — ✏️ and untick Done to reopen it/.test(root.innerHTML));
  W.gfOccEdit(); W.gfSet("closed", false); writes.length = 0; W.gfSave();
  const u = writes.find(w => w.path === "gifts/occasions/x25");
  ok("untick Done = ONE update closed:null, no for key on a Christmas", u.op === "update" && u.val.closed === null && !("for" in u.val) && !T.data().occasions.x25.closed);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
