/*
 * Node tests for 🎁 Gifts — GIFTTUNE (a mom's worksheet answers 2026-11-24), four changes:
 *   1 · 👍 They said yes — a third tick between 🗣 Told them and ✅ They've got it (yes = the day; ONE update; never false).
 *   2 · a present someone else is buying counts as a GIFT for that kid (People row, their page, ⚖️ Even count + "gifts behind",
 *       Dad's rows) — never as money (every money number is the same with or without it).
 *   3 · 📤 Text <giver> their list — plain text (kid + present + link only; never a price, spot, paper, note, or anyone else's
 *       present), handed to the share sheet or the clipboard; then ONE tap 🗣 Mark these N as told (one multi-path update).
 *   4 · one section budget for everyone in a group — gifts/plan/<oid>/g_<gid>/secEach/<sid>; a person's own number always wins.
 *   + Q2 check: a wish-linked present handed to a relative still shows on the wish row with who is buying it.
 *
 *   run:  node test_gifts_tuning.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 500) + ")" : "")); } }

function el(id) { return { id, innerHTML: "", value: "", classList: { contains() { return false; }, add() {}, remove() {} }, querySelector() { return null; }, style: {}, focus() {}, appendChild() {} }; }
const nodes = {}; const root = el("content"), droot = el("dad");
const document = { getElementById(id) { return nodes[id] || (nodes[id] = el(id)); }, createElement(t) { return el(t); }, head: { appendChild() {} }, activeElement: null, querySelector() { return null; } };
const writes = [], toasts = [], net = [];
const S = { dadOpen: false, dry: false };
const db = { ref(p) { return { set(v) { writes.push({ op: "set", path: p, val: JSON.parse(JSON.stringify(v)) }); }, update(v) { writes.push({ op: "update", path: p, val: JSON.parse(JSON.stringify(v)) }); }, remove() { writes.push({ op: "remove", path: p }); }, push(v) { writes.push({ op: "push", path: p, val: v }); }, on() {}, off() {}, once() { return Promise.resolve({ val: () => null }); } }; } };
const LS = {};
const navigator = {};   // each test sets share / clipboard as that device would have them
const ctx = { console, Date, Math, JSON, Promise, document, db, navigator, _todayStr: () => "2026-11-20", _dryRun: () => S.dry, momHere: () => true, gwShowToast(m) { toasts.push(m); }, confirm: () => true,
  giftDadOpen: () => S.dadOpen, _kioskD: () => false, fetch() { net.push("fetch"); return Promise.reject(new Error("no network in tests")); }, XMLHttpRequest: function () { net.push("xhr"); },
  HA_LS: { getItem: k => (k in LS ? LS[k] : null), setItem: (k, v) => { LS[k] = String(v); } }, tab: "moms-plan", mpSubView: "gifts" };
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext("const ROSTER_DEF=[{id:'ava',name:'Ava',color:'#2563eb'},{id:'ben',name:'Ben',color:'#16a34a'},{id:'cal',name:'Cal',color:'#9333ea'}];", ctx);   // generic names
const SRC = fs.readFileSync(path.join(__dirname, "gifts.js"), "utf8");
vm.runInContext(SRC, ctx);
const T = ctx._gfTest, W = ctx, DT = ctx._gfDadTest, WT = ctx._gfWishTest;
const reset = d => { writes.length = 0; toasts.length = 0; S.dry = false; T.setData(d || {}); T.reset(); for (const k in LS) delete LS[k]; T.setOcc("x"); T.setRoot(root, "<nav/>"); };
const logs = () => writes.filter(w => w.op === "push" && w.path === "gifts/log").map(w => w.val.text);
const nonLog = () => writes.filter(w => w.path !== "gifts/log");
const J = JSON.stringify;
const tick = () => new Promise(r => setTimeout(r, 0));

const BASE = () => ({
  occasions: {
    x: { name: "Christmas 2026", kind: "christmas", date: "2026-12-25", budget: 1000,
      secs: { special: { name: "Special", emoji: "⭐", order: 0 }, parents: { name: "From Mom & Dad", emoji: "🎁", order: 1 }, stocking: { name: "Stocking", emoji: "🧦", order: 2 } } },
    y: { name: "Easter 2027", kind: "easter", date: "2027-03-28", secs: { basket: { name: "Basket", emoji: "🧺", order: 0 } } } },
  groups: { mom: { secs: { big: { name: "Big gift", emoji: "🎁", order: 0 }, card: { name: "Card", emoji: "💌", order: 1 } } } },
  people: { "p-gma": { name: "Gma Rose", group: "mom", ts: 1 }, "p-pat": { name: "Uncle Pat", group: "mom", ts: 2 }, "p-sam": { name: "Sam", group: "dad", isDad: true, ts: 3 } },
  plan: { x: { k_ava: { budget: 300, sec: { stocking: 20 } }, g_kids: { budget: 900 } } },
  share: { x: { k_ava: "edit", k_ben: "look" } },
  items: {
    a: { occ: "x", pids: ["k_ava"], sec: "stocking", name: "Socks", status: "here", paid: 15, where: "Closet", ts: 1 },
    b: { occ: "x", pids: ["k_ava"], sec: "stocking", name: "Candy", status: "idea", plan: 10, store: "Target", ts: 2 },
    c: { occ: "x", pids: ["k_ava", "k_ben"], sec: "special", name: "Trampoline", status: "ordered", paid: 300, ts: 3 },
    d: { occ: "x", pids: ["k_ben"], sec: "parents", name: "Lego", status: "wrapped", paid: 60, ts: 4 },
    e: { occ: "x", pids: ["p-pat"], sec: "big", name: "Watch", status: "here", paid: 40, ts: 5 },
    g: { occ: "x", pids: ["k_cal"], sec: "parents", name: "Book", status: "here", paid: 12, ts: 7 } } });
const OTHERS = () => ({
  o1: { occ: "x", pids: ["k_ava"], sec: "special", name: "Bike", status: "ordered", paid: 200, plan: 220, where: "Garage", paper: "Red stripes", store: "Bikes Inc", note: "SECRETNOTE",
    link: "https://example.com/bike", from: "p-gma", ts: 11 },
  o2: { occ: "x", pids: ["k_ava", "k_ben"], sec: "stocking", name: "Board game", status: "idea", plan: 30, from: "p-pat", told: "2026-11-19", ts: 12 },
  o3: { occ: "x", pids: ["k_cal"], sec: "parents", name: "Jigsaw", status: "here", paid: 20, wish: "cal/w1", from: "p-gma", told: "2026-11-17", yes: "2026-11-18", ts: 13 },
  o4: { occ: "x", pids: ["k_ava"], sec: "stocking", name: "Mittens", status: "idea", from: "p-gma", ts: 14 },
  o5: { occ: "y", pids: ["k_ava"], sec: "basket", name: "Chocolate egg", status: "idea", from: "p-gma", ts: 15 } });
const WITH = () => { const d = BASE(); Object.assign(d.items, OTHERS()); return d; };

console.log("\n# 1 · 👍 They said yes");
{
  reset(WITH()); W.renderGifts(root, "<nav/>"); W.gfGo("others");
  let h = root.innerHTML;
  ok("🎁 From others header: 'N told · N said yes · N got it'", /🎁 Gma Rose<\/span><span class="gf-gsum">3 · 1 told · 1 said yes · 0 got it<\/span>/.test(h) && /🎁 Uncle Pat<\/span><span class="gf-gsum">1 · 1 told · 0 said yes · 0 got it<\/span>/.test(h), h.match(/gf-gsum">[^<]*/g));
  ok("…three ticks on each row, in order 🗣 · 👍 · ✅", /gfFromTick\('o1','told'\)">🗣 Told them<\/button><button class="gf-pick" onclick="gfFromTick\('o1','yes'\)">👍 They said yes<\/button><button class="gf-pick" onclick="gfFromTick\('o1','got'\)">✅ They've got it/.test(h));
  ok("…the Jigsaw's 👍 is drawn on", /class="gf-pick on" onclick="gfFromTick\('o3','yes'\)"/.test(h));
  ok("…the intro mentions 👍", /👍 when they say yes/.test(h));
  writes.length = 0; W.gfFromTick("o1", "yes");
  ok("👍 = ONE update {yes: today}", nonLog().length === 1 && nonLog()[0].op === "update" && nonLog()[0].path === "gifts/items/o1" && J(nonLog()[0].val) === '{"yes":"2026-11-20"}', nonLog());
  ok("…log '👍 Gma Rose said yes to Bike'", logs()[0] === "👍 Gma Rose said yes to Bike", logs());
  ok("…the header counts it (2 said yes)", /3 · 1 told · 2 said yes · 0 got it/.test(root.innerHTML));
  writes.length = 0; W.gfFromTick("o1", "yes");
  ok("un-tick = ONE update {yes: null} — never false", nonLog().length === 1 && J(nonLog()[0].val) === '{"yes":null}' && !("yes" in T.data().items.o1), nonLog());
  ok("…log says not yet", logs()[0] === "🎁 Bike: Gma Rose hasn't said yes yet", logs());
  writes.length = 0; W.gfFromTick("a", "yes"); W.gfFromTick("o1", "maybe");
  ok("👍 on Mom's own present, or a made-up tick, writes nothing", writes.length === 0, writes);
  ok("ticks never change status", T.data().items.o1.status === "ordered");
  S.dry = true; writes.length = 0; W.gfFromTick("o2", "yes"); S.dry = false;
  ok("dry run (?dryrun=1): 👍 writes nothing", writes.length === 0, writes);
}
{
  reset(WITH()); W.renderGifts(root, "<nav/>"); W.gfOpenPerson("k_cal");
  ok("the kid's page row has the three ticks (Jigsaw: told + said yes on)", /gfFromTick\('o3','told'\)">🗣 Told them<\/button><button class="gf-pick on" onclick="gfFromTick\('o3','yes'\)">👍 They said yes/.test(root.innerHTML));
  W.gfEditItem("o3"); let h = root.innerHTML;
  ok("the present's sheet: three ticks, 👍 on", /gfFromFormTick\('told'\)">🗣 Told them<\/button><button class="gf-pick on" onclick="gfFromFormTick\('yes'\)">👍 They said yes<\/button><button class="gf-pick" onclick="gfFromFormTick\('got'\)">/.test(h), h.match(/gfFromFormTick[\s\S]{0,400}/));
  W.gfFromPick("p-pat");
  ok("changing the giver clears all three", T.edit().form.told === "" && T.edit().form.yes === "" && T.edit().form.got === "");
  W.gfFromPick("p-gma");
  ok("going back to the first giver restores all three", T.edit().form.told === "2026-11-17" && T.edit().form.yes === "2026-11-18");
  W.gfFromFormTick("got"); writes.length = 0; W.gfSave();
  ok("save: ONE set keeping told + yes + got", nonLog().length === 1 && nonLog()[0].op === "set" && nonLog()[0].val.yes === "2026-11-18" && nonLog()[0].val.told === "2026-11-17" && nonLog()[0].val.got === "2026-11-20", nonLog());
  W.gfEditItem("o3"); W.gfFromPick("p-pat"); writes.length = 0; W.gfSave();
  ok("save after a new giver: no yes / told / got", nonLog().length === 1 && nonLog()[0].val.from === "p-pat" && !("yes" in nonLog()[0].val) && !("told" in nonLog()[0].val) && !("got" in nonLog()[0].val), nonLog());
  W.gfEditItem("o3"); W.gfFromFormTick("yes"); W.gfFromPick(""); writes.length = 0; W.gfSave();
  ok("🏠 Us: no yes stored", !("yes" in nonLog()[0].val) && !("from" in nonLog()[0].val), nonLog());
  W.gfEditItem("a"); writes.length = 0; W.gfFromFormTick("yes");
  ok("on a present that is Us, the 👍 tick does nothing", T.edit().form.yes === "" && writes.length === 0);
  W.gfCancel();
}
{
  reset(WITH()); W.renderGifts(root, "<nav/>"); W.gfMove("o3"); W.gfSetDraw("occ", "y"); writes.length = 0; W.gfSave();
  ok("↪ Move: ONE update without the ticks, and it keeps told + yes", nonLog().length === 1 && !("yes" in nonLog()[0].val) && T.data().items.o3.yes === "2026-11-18" && T.data().items.o3.told === "2026-11-17", nonLog());
}
{
  reset(WITH()); S.dadOpen = true; W.renderGiftsDad(droot, ""); W.gdOpen("k_ava"); let h = droot.innerHTML;
  ok("Dad (✏️ edit page): three tappable ticks", /onclick="gdFromTick\('o1','told'\)"/.test(h) && /onclick="gdFromTick\('o1','yes'\)">👍 They said yes/.test(h) && /onclick="gdFromTick\('o1','got'\)"/.test(h));
  writes.length = 0; W.gdFromTick("o1", "yes");
  ok("…his 👍 = ONE update + a 'Dad:' log line", nonLog().length === 1 && J(nonLog()[0].val) === '{"yes":"2026-11-20"}' && logs()[0] === "Dad: 👍 Gma Rose said yes to Bike", [nonLog(), logs()]);
  writes.length = 0; W.gdFromTick("o1", "yes");
  ok("…un-tick removes it", J(nonLog()[0].val) === '{"yes":null}' && logs()[0] === "Dad: 🎁 Bike — Gma Rose hasn't said yes yet", [nonLog(), logs()]);
  W.gdOpen("k_ben"); h = droot.innerHTML;
  ok("Dad (👀 look page): the 👍 shows read-only", /<span class="gf-pick" style="cursor:default">👍 They said yes<\/span>/.test(h) && !/gdFromTick/.test(h));
  writes.length = 0; W.gdFromTick("o2", "yes");
  ok("…and a 👍 from a look page writes nothing", writes.length === 0, writes);
  S.dadOpen = false;
}

console.log("\n# 2 · a present someone else is buying counts as a GIFT for that kid — never as money");
{
  reset(WITH()); W.renderGifts(root, "<nav/>"); const h = root.innerHTML;
  const row = pid => { const m = h.match(new RegExp('<button class="gf-prow" onclick="gfOpenPerson\\(\'' + pid + '\'\\)">([\\s\\S]*?)</button>')); return m ? m[1] : ""; };
  ok("People row: Ava '6 presents · 👤 2 own · 🤝 1 shared · … · 🎁 3 from others' (3 of hers + 3 from others)", /<span class="gf-pc">6 presents · 👤 2 own · 🤝 1 shared · (<span title="[^"]*">[^<]*<\/span> ?)+ · 🎁 3 from others<\/span>/.test(row("k_ava")), row("k_ava"));
  ok("…Ben 3 presents (the shared Board game counts for him too)", /<span class="gf-pc">3 presents · 👤 1 own · 🤝 1 shared · .* · 🎁 1 from others<\/span>/.test(row("k_ben")), row("k_ben"));
  ok("…Cal 2 presents · 🎁 1 from others", /<span class="gf-pc">2 presents · <span title="📦 Here">📦1<\/span> · 🎁 1 from others<\/span>/.test(row("k_cal")), row("k_cal"));
  W.gfOpenPerson("k_ava");
  ok("Ava's page header: '6 presents · 👤 2 just theirs · 🤝 1 shared · 🎁 3 from others'", /<div class="gf-line" style="color:#475569">6 presents · 👤 2 just theirs · 🤝 1 shared · 🎁 3 from others<\/div>/.test(root.innerHTML), root.innerHTML.match(/\d+ presents?[^<]*/));
  const d = WITH(); delete d.items.g; reset(d); W.renderGifts(root, "<nav/>");
  ok("a kid with ONLY a relative's present: '1 present · 🎁 1 from others', not 'nothing yet'", /Cal<span class="gf-pc">1 present · 🎁 1 from others<\/span>/.test(root.innerHTML), root.innerHTML.match(/Cal<span class="gf-pc">[^]*?<\/span>/));
  W.gfOpenPerson("k_cal");
  ok("…their page: '1 present · 🎁 1 from others'", /color:#475569">1 present · 🎁 1 from others/.test(root.innerHTML));
  reset(BASE()); W.renderGifts(root, "<nav/>");
  ok("no relatives' presents: rows read exactly as before ('3 presents · 👤 2 own …', no 🎁)", /Ava<span class="gf-pc">3 presents · 👤 2 own · 🤝 1 shared · /.test(root.innerHTML) && !/from others/.test(root.innerHTML));
  ok("drawing wrote nothing", writes.length === 0, writes);
}
{
  reset(WITH()); const E = T.evenData("x");
  ok("⚖️ Even count = own + from others: Ava 6, Ben 3, Cal 2", J(E.all.map(c => c.count)) === "[6,3,2]", E.all);
  const st = E.secs.find(s => s.sec.id === "stocking");
  ok("…per section too (🧦 Stocking: Ava 2 + Mittens + Board game = 4, Ben 1)", J(st.cells.map(c => c.count)) === "[4,1,0]", st.cells);
  const noC = { occasions: BASE().occasions, people: BASE().people, items: { a: BASE().items.a, b: BASE().items.b, c: BASE().items.c, d: BASE().items.d, g: BASE().items.g } };
  reset(noC); const before = T.behind(T.evenData("x").all);
  noC.items.x1 = { occ: "x", pids: ["k_cal"], sec: "parents", name: "Kite", status: "idea", from: "p-gma", ts: 20 };
  noC.items.x2 = { occ: "x", pids: ["k_cal"], sec: "parents", name: "Yo-yo", status: "idea", from: "p-pat", ts: 21 };
  reset(noC); const after = T.behind(T.evenData("x").all);
  ok("'gifts behind': Cal is 2 gifts behind on her own presents, and not behind once two relatives' presents count", before[2].count === true && after[2].count === false, [before[2], after[2]]);
  W.renderGifts(root, "<nav/>"); W.gfGo("even"); const ev = root.innerHTML;
  ok("⚖️ Even cells show the count, the 🎁 From others row tells them apart, the intro says how they count", /3 gifts/.test(ev) && /<tr><th>🎁 From others<\/th>/.test(ev) && /A present someone else is buying counts as a gift, never in the dollars\./.test(ev));
  reset(BASE()); W.renderGifts(root, "<nav/>"); W.gfGo("even");
  ok("…with none, the intro has no such sentence", !/someone else is buying/.test(root.innerHTML));
}
{
  reset(BASE()); const kidsP = ["k_ava", "k_ben", "k_cal"];
  const money = () => J({ occ: T.occTot("x"), per: kidsP.map(p => T.personTot("x", p)), sec: kidsP.map(p => T.personTot("x", p, "stocking")), grp: T.groupTot("x", "kids"), mom: T.groupTot("x", "mom"),
    even: [T.evenData("x").all].concat(T.evenData("x").secs.map(s => s.cells)).map(r => r.map(c => [c.amt, c.paid])), tally: T.tally(T.allItems("x"), () => 1) });
  const mb = money(); W.renderGifts(root, "<nav/>"); const amtB = root.innerHTML.match(/<span class="gf-amt">[\s\S]*?<\/span>/g);
  reset(WITH()); const mf = money(); W.renderGifts(root, "<nav/>"); const amtF = root.innerHTML.match(/<span class="gf-amt">[\s\S]*?<\/span>/g);
  ok("NEVER money: occasion, each kid, each section, groups, ⚖️ dollars and tally() identical with or without relatives' presents", mf === mb, [mf, mb]);
  ok("…personTot's own count is still Mom's own (Ava 3)", T.personTot("x", "k_ava").count === 3);
  ok("…every People row amount the same", J(amtF) === J(amtB), [amtF, amtB]);
}
{
  reset(WITH()); S.dadOpen = true; const dtB = J([DT.dadTot("x", "k_ava"), DT.dadTot("x", "k_ben")]);
  W.renderGiftsDad(droot, ""); W.gdBack(); let h = droot.innerHTML;
  ok("Dad's list: Ava '6 presents · … · 🎁 3 from others' (✏️ edit)", /Ava [\s\S]*?<span class="gf-pc">6 presents · (<span title="[^"]*">[^<]*<\/span> ?)+ · 🎁 3 from others<\/span>/.test(h), h.match(/gf-pc">[^]*?<\/span><\/span>/g));
  ok("…Ben (👀 look) '3 presents · … · 🎁 1 from others'", /Ben [\s\S]*?<span class="gf-pc">3 presents · (<span title="[^"]*">[^<]*<\/span> ?)+ · 🎁 1 from others<\/span>/.test(h));
  ok("…Cal isn't shared: not there, and his Jigsaw counts nowhere on Dad's side", !/Cal/.test(h) && !/Jigsaw/.test(h));
  W.gdOpen("k_ava"); h = droot.innerHTML;
  ok("Dad's Ava page header: '6 presents · 🎁 3 from others · ✏️ you can edit'", /color:#475569">6 presents · 🎁 3 from others · <span class="gf-chip"[^>]*>✏️ you can edit/.test(h), h.match(/\d+ presents?[^<]*/));
  ok("…his money (dadTot) unchanged", J([DT.dadTot("x", "k_ava"), DT.dadTot("x", "k_ben")]) === dtB);
  reset(BASE()); S.dadOpen = true; const dt0 = J([DT.dadTot("x", "k_ava"), DT.dadTot("x", "k_ben")]); S.dadOpen = false;
  ok("…and the same as with no relatives' presents at all", dt0 === dtB);
  const dd = WITH(); dd.items.o6 = { occ: "x", pids: ["k_ava", "p-sam"], sec: "special", name: "Surprise for Ava and Dad", status: "idea", from: "p-gma", ts: 30 };
  reset(dd); S.dadOpen = true; W.renderGiftsDad(droot, ""); W.gdBack(); h = droot.innerHTML; W.gdOpen("k_ava"); h += droot.innerHTML; S.dadOpen = false;
  ok("…a relative's present that is partly FOR Dad is never shown or counted on his side (Ava still 6)", !/Surprise/.test(h) && /6 presents · 🎁 3 from others · </.test(h) && !/7 presents/.test(h), h.match(/\d+ presents?[^<]*/g));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
