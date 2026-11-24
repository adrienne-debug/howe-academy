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

(async () => {
console.log("\n# 3 · 📤 Text a giver their list");
const GMA = "Hi Gma Rose! Here's your gift list for Christmas 2026:\n• Ava: Bike — https://example.com/bike\n• Cal: Jigsaw\n• Ava: Mittens";
const setNav = o => { delete navigator.share; delete navigator.clipboard; Object.assign(navigator, o || {}); };
{
  reset(WITH()); W.renderGifts(root, "<nav/>"); W.gfGo("others"); const h = root.innerHTML;
  ok("each giver's card has '📤 Text <name> their list'", /onclick="gfFromText\('p-gma'\)">📤 Text Gma Rose their list<\/button>/.test(h) && /onclick="gfFromText\('p-pat'\)">📤 Text Uncle Pat their list<\/button>/.test(h));
  ok("…no 'Mark as told' offer before anything is handed over", !/gfFromToldAll/.test(h));
  const shared = []; setNav({ share: o => { shared.push(o); return Promise.resolve(); } });
  writes.length = 0; W.gfFromText("p-gma"); await tick();
  ok("share sheet gets {text} only — a first line, then one line per present Gma Rose is buying (kid: present — link)", shared.length === 1 && J(Object.keys(shared[0])) === '["text"]' && shared[0].text === GMA, shared);
  const tx = shared[0] ? shared[0].text : "";
  ok("NEVER a price, spot, paper, store, note or status in it", !/\$|200|220|Garage|Red stripes|Bikes Inc|SECRETNOTE|Ordered|Idea|📦|🛒|💭|🎀/.test(tx), tx);
  ok("NEVER Mom's own presents, another giver's, or another occasion's", !/Socks|Candy|Trampoline|Lego|Watch|Book|Board game|Chocolate egg/.test(tx), tx);
  ok("handing it over wrote nothing and made no network call", writes.length === 0 && net.length === 0, [writes, net]);
  let o = root.innerHTML;
  ok("then ONE offer: '🗣 Mark these 2 as told' (the Jigsaw is already told) + Not now", /onclick="gfFromToldAll\(\)">🗣 Mark these 2 as told<\/button>/.test(o) && /gfFromTextNo\(\)">Not now/.test(o), o.match(/Mark these[^<]*/));
  ok("…only on Gma Rose's card", (o.match(/gfFromToldAll/g) || []).length === 1 && o.indexOf("gfFromToldAll") < o.indexOf("Uncle Pat</span>"));
  ok("…nothing ticked by itself", !T.data().items.o1.told && !T.data().items.o4.told);
  writes.length = 0; W.gfFromToldAll();
  ok("tap = ONE multi-path update of told only: {o1/told, o4/told}", nonLog().length === 1 && nonLog()[0].op === "update" && nonLog()[0].path === "gifts/items" && J(nonLog()[0].val) === '{"o1/told":"2026-11-20","o4/told":"2026-11-20"}', nonLog());
  ok("…the Jigsaw keeps its own told day", T.data().items.o3.told === "2026-11-17");
  ok("…log 'Told Gma Rose about 2 presents (sent their list)'", logs()[0] === "🗣 Told Gma Rose about 2 presents (sent their list)", logs());
  ok("…the offer is gone and the header counts 3 told", !/gfFromToldAll/.test(root.innerHTML) && /3 · 3 told · 1 said yes · 0 got it/.test(root.innerHTML));
  writes.length = 0; W.gfFromToldAll();
  ok("a second tap writes nothing", writes.length === 0);
  shared.length = 0; W.gfFromText("p-pat"); await tick();
  ok("a shared present reads 'Ava & Ben: Board game'; all told already → no offer", shared[0] && shared[0].text === "Hi Uncle Pat! Here's your gift list for Christmas 2026:\n• Ava & Ben: Board game" && !/gfFromToldAll/.test(root.innerHTML), shared);
}
{
  reset(WITH()); W.renderGifts(root, "<nav/>"); W.gfGo("others");
  setNav({ share: () => { const e = new Error("cancel"); e.name = "AbortError"; return Promise.reject(e); } });
  W.gfFromText("p-gma"); await tick();
  ok("a cancelled share: no toast, no offer, nothing written", toasts.length === 0 && !/gfFromToldAll/.test(root.innerHTML) && writes.length === 0, toasts);
  setNav({ share: () => { throw new Error("NotAllowedError"); } });
  W.gfFromText("p-gma"); await tick();
  ok("a refused share (throws): quietly nothing", toasts.length === 0 && !/gfFromToldAll/.test(root.innerHTML) && writes.length === 0, toasts);
  const copied = []; setNav({ clipboard: { writeText: t => { copied.push(t); return Promise.resolve(); } } });
  W.gfFromText("p-gma"); await tick();
  ok("no share sheet: copied to the clipboard + a toast saying so", copied[0] === GMA && toasts[0] === "📋 Copied — paste it into a text to Gma Rose", [copied, toasts]);
  ok("…and the same one-tap offer", /🗣 Mark these 2 as told/.test(root.innerHTML));
  W.gfFromTextNo();
  ok("Not now: the offer goes, nothing written", !/gfFromToldAll/.test(root.innerHTML) && writes.length === 0);
  W.gfFromText("p-gma"); await tick(); W.gfFromTick("o4", "told"); writes.length = 0;
  ok("one ticked by hand meanwhile → 'Mark these 1 as told'", /🗣 Mark these 1 as told/.test(root.innerHTML));
  W.gfFromToldAll();
  ok("…and the tap only writes that one", J(nonLog()[0].val) === '{"o1/told":"2026-11-20"}', nonLog());
  toasts.length = 0; setNav({ clipboard: { writeText: () => Promise.reject(new Error("denied")) } });
  W.gfFromText("p-gma"); await tick();
  ok("a refused copy: says it couldn't, no offer", toasts[0] === "Couldn't copy on this device" && !/gfFromToldAll/.test(root.innerHTML), toasts);
  toasts.length = 0; setNav({}); W.gfFromText("p-gma"); await tick();
  ok("neither share nor clipboard: says it couldn't, no offer", toasts[0] === "Couldn't copy on this device" && !/gfFromToldAll/.test(root.innerHTML), toasts);
}
{
  reset(WITH()); S.dry = true; W.renderGifts(root, "<nav/>"); W.gfGo("others"); setNav({ share: () => Promise.resolve() });
  W.gfFromText("p-gma"); await tick(); W.gfFromToldAll();
  ok("dry run (?dryrun=1): the Mark-as-told tap writes nothing", writes.length === 0, writes); S.dry = false;
  ok("no network call anywhere in this section", net.length === 0, net);
  const blk = SRC.slice(SRC.indexOf("GIFTTUNE 3"), SRC.indexOf("// FROMOTHERS_END"));
  ok("the text-a-list code has no fetch / XHR / sendBeacon / link out", !/fetch\(|XMLHttpRequest|sendBeacon|location\.|window\.open|sms:/.test(blk));
  setNav({});
}

console.log("\n# 4 · one section budget for everyone in a group (secEach)");
{
  reset(BASE()); W.renderGifts(root, "<nav/>"); W.gfGroupBudget("kids"); let h = root.innerHTML;
  ok("the group's 💲 sheet: its own budget first, then one box per section — \"Each kid's 🧦 Stocking budget\"", /Budget for Christmas 2026[\s\S]*Each kid's ⭐ Special budget[\s\S]*Each kid's 🎁 From Mom &amp; Dad budget[\s\S]*Each kid's 🧦 Stocking budget/.test(h) && /gfEachBudget\('stocking',this.value\)/.test(h), h.match(/Each[^<]*/g));
  ok("…with a line saying it's the same for everyone and their own number wins", /The same amount for everyone in this group\. Anyone with their own section budget keeps theirs\./.test(h));
  writes.length = 0; W.gfEachBudget("stocking", "25"); W.gfSave();
  const s = nonLog();
  ok("save = the group plan's ONE set: {budget: 900, secEach: {stocking: 25}}", s.length === 1 && s[0].op === "set" && s[0].path === "gifts/plan/x/g_kids" && J(s[0].val) === '{"budget":900,"secEach":{"stocking":25}}', s);
  ok("a kid with no section budget of their own gets it (Ben 🧦 $25)", T.personTot("x", "k_ben", "stocking").budget === 25);
  ok("NEVER beats a person's own number (Ava keeps her $20)", T.personTot("x", "k_ava", "stocking").budget === 20);
  ok("…only for that section (Ben ⭐ Special has none)", T.personTot("x", "k_ben", "special").budget === null);
  ok("…never changes a person's whole budget or the group's (Ben none, Ava $300, Kids $900)", T.personTot("x", "k_ben").budget === null && T.personTot("x", "k_ava").budget === 300 && T.groupTot("x", "kids").budget === 900);
  ok("…not another group's people (Uncle Pat) and not another occasion", T.personTot("x", "p-pat", "stocking").budget === null && T.personTot("y", "k_ben", "stocking").budget === null);
  W.gfGo("people"); h = root.innerHTML;
  ok("the People pills pick it up (Ben: 🧦 Stocking / $25 · Cal too, though he has nothing in it)", /onclick="gfOpenPerson\('k_ben'\)">[\s\S]*?🧦 Stocking <b>\$0<\/b> <b style="color:#16a34a">\/ \$25<\/b>/.test(h) && /onclick="gfOpenPerson\('k_cal'\)">[\s\S]*?🧦 Stocking <b>\$0<\/b> <b style="color:#16a34a">\/ \$25<\/b>/.test(h));
  W.gfOpenPerson("k_ben"); h = root.innerHTML;
  ok("Ben's page: the 🧦 Stocking card says $0 / $25 with a bar", /🧦 Stocking<\/span><span class="gf-gsum">\$0 \/ \$25<\/span>[\s\S]{0,200}<div class="gf-bar">/.test(h), h.match(/🧦 Stocking<\/span>[^]{0,200}/));
  W.gfBudget("k_ben"); h = root.innerHTML;
  ok("Ben's 💲 sheet: the box is empty with '$25 — the same for each kid' as the placeholder", /value="" placeholder="\$25 — the same for each kid" oninput="gfSecBudget\('stocking',this.value\)"/.test(h), h.match(/Stocking \(optional\)[^]{0,200}/));
  W.gfSecBudget("stocking", "0"); writes.length = 0; W.gfSave();
  ok("Ben types his own $0: saved on HIS plan only, and his own number wins", nonLog().length === 1 && nonLog()[0].path === "gifts/plan/x/k_ben" && T.personTot("x", "k_ben", "stocking").budget === 0, nonLog());
  W.gfBudget("k_ava"); h = root.innerHTML;
  ok("Ava's sheet: her own $20 in the box, the group's amount behind it as placeholder", /value="20" placeholder="\$25 — the same for each kid"/.test(h));
  W.gfCancel(); W.gfGroupBudget("kids");
  ok("reopening the group's sheet shows 25 in its box", /value="25" oninput="gfEachBudget\('stocking',this.value\)"/.test(root.innerHTML));
  W.gfEachBudget("stocking", ""); writes.length = 0; W.gfSave();
  ok("clearing it: ONE set with no secEach ({budget: 900})", nonLog().length === 1 && J(nonLog()[0].val) === '{"budget":900}' && T.personTot("x", "k_cal", "stocking").budget === null, nonLog());
  W.gfGroupBudget("kids"); W.gfSet("budget", ""); writes.length = 0; W.gfSave();
  ok("clearing everything removes the group plan record, as before", nonLog().length === 1 && nonLog()[0].op === "remove" && nonLog()[0].path === "gifts/plan/x/g_kids", nonLog());
}
{
  reset(BASE()); W.renderGifts(root, "<nav/>"); W.gfGroupBudget("mom"); const h = root.innerHTML;
  ok("another group: \"Each person's 🎁 Big gift budget\" — that group's own sections", /Each person's 🎁 Big gift budget[\s\S]*Each person's 💌 Card budget/.test(h) && !/Each [^<]*Stocking/.test(h) && !/gfEachBudget\('stocking'/.test(h), h.match(/Each[^<]*/g));
  W.gfEachBudget("big", "50"); W.gfSave();
  ok("…applies to its people (Uncle Pat 🎁 Big gift $50), never the kids", T.personTot("x", "p-pat", "big").budget === 50 && T.personTot("x", "k_ava", "big").budget === null);
  W.gfBudget("p-pat");
  ok("…his sheet's placeholder says '$50 — the same for each person'", /placeholder="\$50 — the same for each person"/.test(root.innerHTML));
}
{
  const d = BASE(); reset(d); const kidsP = ["k_ava", "k_ben", "k_cal"];
  const money = () => J({ occ: T.occTot("x"), per: kidsP.map(p => T.personTot("x", p)), grp: T.groupTot("x", "kids"), even: T.evenData("x"),
    secPaid: kidsP.map(p => { const t = T.personTot("x", p, "stocking"); return [t.paid, t.toBuy, t.count]; }) });
  const mb = money(); S.dadOpen = true; W.renderGiftsDad(droot, ""); W.gdOpen("k_ava"); const dadB = droot.innerHTML; W.gdOpen("k_ben"); const dadB2 = droot.innerHTML; S.dadOpen = false;
  d.plan.x.g_kids.secEach = { stocking: 25, special: 100 }; reset(d); const mf = money();
  ok("secEach adds NOTHING to money: occasion, people, group total + budget, ⚖️ Even, section paid / to buy all the same", mf === mb, [mf, mb]);
  S.dadOpen = true; W.renderGiftsDad(droot, ""); W.gdOpen("k_ava"); const dadF = droot.innerHTML; W.gdOpen("k_ben"); const dadF2 = droot.innerHTML; S.dadOpen = false;
  ok("Dad's side is exactly the same (he never sees section budgets)", dadF === dadB && dadF2 === dadB2);
  S.dry = true; writes.length = 0; W.renderGifts(root, "<nav/>"); W.gfGroupBudget("kids"); W.gfEachBudget("stocking", "30"); W.gfSave(); S.dry = false;
  ok("dry run (?dryrun=1): saving the group sheet writes nothing", writes.length === 0, writes);
}

console.log("\n# Q2 · a wish handed to a relative still shows on the wish row with who is buying it");
{
  reset(WITH()); W.renderGifts(root, "<nav/>");
  WT.setWishes({ cal: { w1: { text: "Jigsaw", ts: 1 }, w2: { text: "Skates", ts: 2 } } }); W.gfOpenPerson("k_cal");
  ok("Cal's wish 'Jigsaw' (Gma Rose is buying it): '✓ on your list · 🎁 from Gma Rose'", /✓ on your list · 🎁 from Gma Rose/.test(root.innerHTML));
  W.gfWishAdd("cal", "w2"); W.gfSave(); const iid = Object.keys(T.data().items).find(k => T.data().items[k].wish === "cal/w2");
  W.gfEditItem(iid); W.gfFromPick("p-pat"); writes.length = 0; W.gfSave(); W.gfOpenPerson("k_cal");
  ok("a wish made into Mom's present, then handed to Uncle Pat: the wish row says '🎁 from Uncle Pat'", /Skates[\s\S]*?✓ on your list · 🎁 from Uncle Pat/.test(root.innerHTML) && nonLog().every(w => !/^wish/.test(w.path)), nonLog());
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})();
