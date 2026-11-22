/*
 * Node tests for 🎁 Gifts — FROMOTHERS (a mom's ask 2026-11-22: "Is there a section for me to put in what certain grandparents or
 * aunt and uncles are buying? … I always struggle about who did I tell which things to and forgetting if they are buying it or I am"):
 *   1 · the present's sheet: 🎁 Who's buying it? — 🏠 Us (nothing stored) or one of her people (not kids, not Dad), or a typed name
 *       (existing person by that name, else a new person — ONE update, then the present's ONE set). Saved as from:<pid>.
 *   2 · two ticks 🗣 Told them / ✅ They've got it (told / got = the day; un-tick removes) instead of the status journey on screen;
 *       status is kept untouched, so 🏠 Us puts it back exactly where it was.
 *   3 · NEVER in Mom's money or logistics: every total, budget, ⚖️ Even, list view, Eve, ☑ Select, receipts, reminders, Last time,
 *       Past totals, Stash — each view is rendered with and without from-others presents and must come out the same.
 *   4 · where it shows: person page (🎁 From others, by giver), People row count, ⚖️ Even count row, 🎁 From others view.
 *   5 · wish lists: nothing under wishes/; 6 · Dad's side; 7 · ↪ Move keeps from/told/got, shared presents count for each kid;
 *   8 · log lines; and nothing is written by drawing.
 *
 *   run:  node test_gifts_from_others.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 500) + ")" : "")); } }

function el(id) { return { id, innerHTML: "", value: "", classList: { contains() { return false; }, add() {}, remove() {} }, querySelector() { return null; }, style: {}, focus() {}, appendChild() {} }; }
const nodes = {}; const root = el("content"), droot = el("dad");
const document = { getElementById(id) { return nodes[id] || (nodes[id] = el(id)); }, createElement(t) { return el(t); }, head: { appendChild() {} }, activeElement: null, querySelector() { return null; } };
const writes = [];
const S = { dadOpen: false };
const db = { ref(p) { return { set(v) { writes.push({ op: "set", path: p, val: JSON.parse(JSON.stringify(v)) }); }, update(v) { writes.push({ op: "update", path: p, val: JSON.parse(JSON.stringify(v)) }); }, remove() { writes.push({ op: "remove", path: p }); }, push(v) { writes.push({ op: "push", path: p, val: v }); }, on() {}, off() {}, once() { return Promise.resolve({ val: () => null }); } }; } };
const LS = {};
const ctx = { console, Date, Math, JSON, Promise, document, db, _todayStr: () => "2026-11-20", _dryRun: () => false, momHere: () => true, gwShowToast() {}, confirm: () => true,
  giftDadOpen: () => S.dadOpen, _kioskD: () => false,
  HA_LS: { getItem: k => (k in LS ? LS[k] : null), setItem: (k, v) => { LS[k] = String(v); } }, tab: "moms-plan", mpSubView: "gifts" };
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext("const ROSTER_DEF=[{id:'ava',name:'Ava',color:'#2563eb'},{id:'ben',name:'Ben',color:'#16a34a'},{id:'cal',name:'Cal',color:'#9333ea'}];", ctx);   // generic names
const SRC = fs.readFileSync(path.join(__dirname, "gifts.js"), "utf8");
vm.runInContext(SRC, ctx);
const T = ctx._gfTest, W = ctx, DT = ctx._gfDadTest, WT = ctx._gfWishTest;
const reset = d => { writes.length = 0; T.setData(d || {}); T.reset(); for (const k in LS) delete LS[k]; T.setOcc("x"); T.setRoot(root, "<nav/>"); };
const logs = () => writes.filter(w => w.op === "push" && w.path === "gifts/log").map(w => w.val.text);
const nonLog = () => writes.filter(w => w.path !== "gifts/log");

// Mom's own presents — one for every view (wrap, where, coming + late, shop, closet, stash, going, eve jobs, receipts, last time)
const BASE = () => ({
  occasions: {
    x: { name: "Christmas 2026", kind: "christmas", date: "2026-12-25", budget: 1000, orderBy: "2026-11-25",
      secs: { special: { name: "Special", emoji: "⭐", order: 0 }, parents: { name: "From Mom & Dad", emoji: "🎁", order: 1 }, stocking: { name: "Stocking", emoji: "🧦", order: 2 } } },
    y: { name: "Easter 2027", kind: "easter", date: "2027-03-28", secs: { basket: { name: "Basket", emoji: "🧺", order: 0 } } },
    p: { name: "Christmas 2025", kind: "christmas", date: "2025-12-25", closed: true, secs: { parents: { name: "From Mom & Dad", emoji: "🎁", order: 0 } } } },
  people: { "p-gma": { name: "Gma Rose", group: "mom", ts: 1 }, "p-pat": { name: "Uncle Pat", group: "mom", ts: 2 }, "p-sam": { name: "Sam", group: "dad", isDad: true, ts: 3 } },
  plan: { x: { k_ava: { budget: 300, sec: { stocking: 20 } }, g_kids: { budget: 900 } } },
  share: { x: { k_ava: "edit", k_ben: "look" } },
  receipts: { r1: { store: "Shop", iso: "2026-11-15", lines: [{ t: "Book", p: 12, item: "g" }], photoCount: 0, occ: "x", returnBy: "2026-11-24", ts: 1 } },
  items: {
    a: { occ: "x", pids: ["k_ava"], sec: "stocking", name: "Socks", status: "here", paid: 15, where: "Closet", ts: 1 },
    b: { occ: "x", pids: ["k_ava"], sec: "stocking", name: "Candy", status: "idea", plan: 10, store: "Target", ts: 2 },
    c: { occ: "x", pids: ["k_ava", "k_ben"], sec: "special", name: "Trampoline", status: "ordered", paid: 300, due: "2026-11-10", ts: 3 },
    d: { occ: "x", pids: ["k_ben"], sec: "parents", name: "Lego", status: "wrapped", paid: 60, needs: { build: true }, ts: 4 },
    e: { occ: "x", pids: ["p-pat"], sec: "gifts", name: "Watch", status: "here", paid: 40, ts: 5 },
    f: { occ: "p", pids: ["k_ava"], sec: "parents", name: "Doll", status: "given", paid: 25, ts: 6 },
    g: { occ: "x", pids: ["k_cal"], sec: "parents", name: "Book", status: "here", paid: 12, rcpt: "r1", returnBy: "2026-11-24", ts: 7 },
    h: { occ: "x", sec: "parents", name: "Spare puzzle", status: "here", paid: 9, ts: 8 },
    i: { occ: "_hold", pids: ["k_ben"], sec: "stocking", name: "Kite", status: "here", paid: 8, heldFrom: "x", ts: 9 },
    j: { occ: "x", pids: ["k_ava"], sec: "parents", name: "Scarf", status: "wrapped", paid: 20, giveAt: "the lake house", ts: 10 } } });
// presents someone else is buying — each one touches a different money / logistics path if it were counted
const OTHERS = () => ({
  o1: { occ: "x", pids: ["k_ava"], sec: "special", name: "Bike", status: "ordered", due: "2026-11-01", paid: 200, plan: 220, where: "Garage", paper: "Red", store: "Bikes Inc",
    needs: { batt: "AA x4" }, giveAt: "the lake house", returnBy: "2026-11-22", from: "p-gma", ts: 11 },
  o2: { occ: "x", pids: ["k_ava", "k_ben"], sec: "stocking", name: "Board game", status: "idea", plan: 30, store: "Toy shop", from: "p-pat", told: "2026-11-19", ts: 12 },
  o3: { occ: "x", pids: ["k_cal"], sec: "parents", name: "Jigsaw", status: "here", paid: 20, wish: "cal/w1", from: "p-gma", got: "2026-11-18", ts: 13 },
  o4: { occ: "x", sec: "parents", name: "Spare game", status: "here", paid: 7, from: "p-pat", ts: 14 },
  o5: { occ: "p", pids: ["k_ava"], sec: "parents", name: "Old train", status: "given", paid: 50, from: "p-gma", ts: 15 } });
const WITH = () => { const d = BASE(); Object.assign(d.items, OTHERS()); return d; };
const OTH_NAMES = ["Bike", "Board game", "Jigsaw", "Spare game", "Old train"];
const noOthers = h => OTH_NAMES.every(n => h.indexOf(n) < 0);

// every Mom view, drawn
const VIEWS = ["people", "even", "wrap", "where", "coming", "shop", "closet", "going", "eve", "receipts"];
function drawAll(d) {
  reset(d); W.renderGifts(root, "<nav/>"); const out = {};
  VIEWS.forEach(v => { W.gfGo(v); out[v] = root.innerHTML; });
  W.gfGo("people"); W.gfGroup("mom"); out.groupMom = root.innerHTML; W.gfGroup("kids");
  ["k_ava", "k_ben", "k_cal", "p-pat"].forEach(pid => { W.gfOpenPerson(pid); out["p:" + pid] = root.innerHTML; });
  W.gfPickOcc("p"); out.past = root.innerHTML; W.gfOpenPerson("k_ava"); out["past:k_ava"] = root.innerHTML; W.gfPickOcc("x");
  return out;
}
const NAVBTN = '<button class="gf-vw" onclick="gfGo(\'others\')">🎁 From others</button>';
const stripNav = h => h.split(NAVBTN).join("");
const MARK = '<div class="gf-card"><div class="gf-ghd"><span>🎁 From others</span>';
// with the 🎁 From others card taken out (it's the last thing on a person page), is the page the same as without?
function sameButCard(withH, baseH) { const i = withH.indexOf(MARK); if (i < 0) return withH === baseH; const tail = baseH.slice(i); return withH.slice(0, i) === baseH.slice(0, i) && withH.endsWith(tail) && withH.length > baseH.length; }

console.log("\n# 3 · none of it counts: every view drawn with and without presents someone else is buying");
const B = drawAll(BASE()), F = drawAll(WITH());
ok("nothing was written by drawing every view (with from-others presents)", writes.length === 0, writes);
ok("without any from-others present there is NO 🎁 From others button, card, row or count anywhere", Object.keys(B).every(k => !/From others|from others|🎁 from /.test(B[k])), Object.keys(B).filter(k => /From others|from others/.test(B[k])));
ok("with them the 🎁 From others view button shows (every view's nav)", VIEWS.every(v => F[v].indexOf(NAVBTN) >= 0));
[["wrap", "🎀 To wrap"], ["where", "📍 Where"], ["coming", "📦 Coming"], ["shop", "🛍 Shop"], ["closet", "🗄 Closet / Stash"], ["going", "🚗 Going"], ["eve", "🌙 Eve gather list + battery / assembly jobs + count check"], ["receipts", "🧾 Receipts"]].forEach(([v, lbl]) => {
  ok(lbl + ": byte-identical to the same page without them (only the nav button added)", stripNav(F[v]) === B[v]);
  ok(lbl + ": none of their names", noOthers(F[v]));
});
ok("🌙 Eve: the Bike's 'AA x4' batteries job is not there", !/AA x4/.test(F.eve) && !/AA x4/.test(B.eve));
ok("📍 Where: the Bike's 'Garage' spot is not there", !/Garage/.test(F.where));
ok("🛍 Shop: the 'Toy shop' store is not there", !/Toy shop/.test(F.shop));
ok("🚗 Going: still one present for the lake house (the Scarf)", /🚗 the lake house<\/span><span class="gf-gsum">1 ·/.test(F.going), F.going.match(/🚗 the lake house[^<]*<\/span><span class="gf-gsum">[^<]*/));
const peopleStrip = h => stripNav(h).replace(/ · 🎁 \d+ from others/g, "").replace(/<span class="gf-pc">🎁 \d+ from others<\/span>/g, '<span class="gf-pc">nothing yet</span>');
ok("👨‍👩‍👧 People (occasion card, group total + bar, rows, money, budgets, section chips): same once the '· 🎁 N from others' bits are taken out", peopleStrip(F.people) === B.people);
ok("…group 'Mom's side' view the same (givers have no presents of their own)", stripNav(F.groupMom) === B.groupMom);
const evenStrip = h => stripNav(h).replace(/<tr><th>🎁 From others<\/th>.*?<\/tr>/, "");
ok("⚖️ Even: dollars, counts, amber flags and the behind / even note the same once the count row is taken out", evenStrip(F.even) === B.even);
{ const note = h => (h.match(/⚖️ [^<]*(behind|even\.)/) || [""])[0];
  ok("⚖️ Even behind / even note unchanged", note(F.even) === note(B.even) && / behind$/.test(note(B.even)), [note(F.even), note(B.even)]); }
["k_ava", "k_ben", "k_cal", "p-pat"].forEach(pid => ok("person page " + pid + ": totals, sections, section totals the same — From others is only an extra card at the bottom", sameButCard(stripNav(F["p:" + pid]), B["p:" + pid])));
ok("📜 Past occasion (money, counts) unchanged by the old from-others present — only Ava's row gains its count", peopleStrip(F.past) === B.past && /Ava<span class="gf-pc">1 present · <span title="✅ Given">✅1<\/span> · 🎁 1 from others/.test(F.past));
  ok("📜 …her page there: same, + the From others card", sameButCard(stripNav(F["past:k_ava"]), B["past:k_ava"]));
{
  reset(BASE()); const tb = { occ: T.occTot("x"), ava: T.personTot("x", "k_ava"), avaSt: T.personTot("x", "k_ava", "stocking"), ben: T.personTot("x", "k_ben"), kids: T.groupTot("x", "kids"), even: T.evenData("x"),
    rem: T.reminders("2026-11-20", 10), now: W.giftNowLines(), held: T.held(), past: T.oc.pastGifts(T.occs().find(o => o.id === "x"), "k_ava"), pastLbl: T.oc.pastLabel(T.occs().find(o => o.id === "p")),
    ideas: T.rc.ideas("x").map(i => i.id) };
  reset(WITH()); const tf = { occ: T.occTot("x"), ava: T.personTot("x", "k_ava"), avaSt: T.personTot("x", "k_ava", "stocking"), ben: T.personTot("x", "k_ben"), kids: T.groupTot("x", "kids"), even: T.evenData("x"),
    rem: T.reminders("2026-11-20", 10), now: W.giftNowLines(), held: T.held(), past: T.oc.pastGifts(T.occs().find(o => o.id === "x"), "k_ava"), pastLbl: T.oc.pastLabel(T.occs().find(o => o.id === "p")),
    ideas: T.rc.ideas("x").map(i => i.id) };
  const J = JSON.stringify;
  ok("occasion paid / still to buy / budget (occTot) the same", J(tf.occ) === J(tb.occ), [tf.occ, tb.occ]);
  ok("a kid's paid / to buy / count / budget (personTot) the same", J(tf.ava) === J(tb.ava) && J(tf.ben) === J(tb.ben));
  ok("a kid's section total + section budget (personTot by section) the same", J(tf.avaSt) === J(tb.avaSt));
  ok("group total + group budget (groupTot) the same", J(tf.kids) === J(tb.kids));
  ok("⚖️ Even dollars AND count (evenData) the same", J(tf.even) === J(tb.even));
  ok("⏰ reminders (late order, return window, order-by) the same", J(tf.rem) === J(tb.rem) && tb.rem.length >= 3, tf.rem.map(r => r.kind));
  ok("🔴 NOW lines for Home Base (giftNowLines) the same", J(tf.now) === J(tb.now));
  ok("🗄 Stash on hold (held) the same", J(tf.held) === J(tb.held));
  ok("🕰 Last time the same (their old train from a grandparent isn't there)", J(tf.past) === J(tb.past) && !/Old train/.test(J(tf.past)));
  ok("📜 Past total label the same", tf.pastLbl === tb.pastLbl, [tf.pastLbl, tb.pastLbl]);
  ok("🧾 receipt idea matching: the Board game idea is not offered", J(tf.ideas) === J(tb.ideas) && tf.ideas.indexOf("o2") < 0);
  ok("🧾 …and a receipt line called 'Board game' doesn't match it", T.rc.matchIdea("Board game", "Board game", "x", []) === null);
  ok("tally() itself skips a from-others present handed to it directly (all presents in → same money as Mom's own)", J(T.tally(T.allItems("x"), () => 1)) === J(T.tally(T.items("x"), () => 1)) && T.allItems("x").length === T.items("x").length + 4);
  reset(WITH()); W.renderGifts(root, "<nav/>"); W.gfRcptNew();
  ok("🧾 the receipt check screen's 'one of my ideas' list doesn't have it", !/Board game/.test(root.innerHTML)); W.gfCancel();
  ok("drawing / totals wrote nothing", writes.length === 0, writes);
}
{
  reset(WITH()); W.renderGifts(root, "<nav/>");
  W.gfBulkIds("o1,o3", "wrapped"); W.gfNext("o1");
  ok("☑ bulk status / next step never changes a from-others present", nonLog().length === 0 && T.data().items.o1.status === "ordered" && T.data().items.o3.status === "here", writes);
  W.gfOpenPerson("k_ava"); W.gfSelToggle(); W.gfPick("a"); W.gfPick("o1"); W.gfBulk("given");
  ok("…even if one got picked: only Mom's own present changes", nonLog().length === 1 && nonLog()[0].path === "gifts/items/a" && T.data().items.o1.status === "ordered", nonLog());
}

console.log("\n# 4 · where it shows");
{
  const h = F.people;
  const row = pid => { const m = h.match(new RegExp('<button class="gf-prow" onclick="gfOpenPerson\\(\'' + pid + '\'\\)">([\\s\\S]*?)</button>')); return m ? m[1] : ""; };
  ok("People row: Ava '… · 🎁 2 from others' right after her own count", /<span class="gf-pc">4 presents · 👤 3 own · 🤝 1 shared · (<span title="[^"]*">[^<]*<\/span> ?)+ · 🎁 2 from others<\/span>/.test(row("k_ava")), row("k_ava"));
  ok("…the count before it is still Mom's own (4 presents, $185 paid)", /4 presents/.test(row("k_ava")) && /<span class="gf-amt">\$185<small> \/ \$300<\/small>/.test(row("k_ava")), row("k_ava"));
  ok("Ben: 🎁 1 from others (the shared Board game counts for him too)", /🎁 1 from others/.test(row("k_ben")));
  ok("Cal: 🎁 1 from others", /🎁 1 from others/.test(row("k_cal")));
  const ava = stripNav(F["p:k_ava"]), card = ava.slice(ava.indexOf(MARK));
  ok("Ava's page: 🎁 From others card at the bottom, 2 presents", card.indexOf(MARK) === 0 && /<span class="gf-gsum">2<\/span>/.test(card));
  ok("…grouped by giver: Gma Rose (Bike) then Uncle Pat (Board game)", /🎁 Gma Rose<\/div>[\s\S]*Bike[\s\S]*🎁 Uncle Pat<\/div>[\s\S]*Board game/.test(card));
  ok("…each with its giver chip and the two ticks (Board game told, Bike not)", /🎁 from Gma Rose/.test(card) && (card.match(/🗣 Told them/g) || []).length === 2 && /class="gf-pick on" onclick="gfFromTick\('o2','told'\)"/.test(card) && /class="gf-pick" onclick="gfFromTick\('o1','told'\)"/.test(card));
  ok("…no 🛒 / 📦 / 🎀 status steps and no next button on them", !/gfNext\('o1'\)|gfNext\('o2'\)/.test(ava) && !/🛒 Ordered/.test(card) && !/💭 Idea/.test(card));
  ok("…and not inside a section (the Special section doesn't list the Bike)", ava.indexOf("Bike") > ava.indexOf(MARK));
  ok("…the shared one says who else it's for", /🤝 with Ben/.test(card));
  const ev = F.even.match(/<tr><th>🎁 From others<\/th>.*?<\/tr>/);
  ok("⚖️ Even: one count row — Ava 2, Ben 1, Cal 1", !!ev && /🎁 2 from others[\s\S]*🎁 1 from others[\s\S]*🎁 1 from others/.test(ev[0]), ev && ev[0]);
  ok("…never amber (not part of behind / ahead)", !!ev && !/gf-behind/.test(ev[0]));
  reset(WITH()); W.renderGifts(root, "<nav/>"); W.gfGo("others"); const o = root.innerHTML;
  ok("🎁 From others view: one card per giver with 'N told · N got it'", /🎁 Gma Rose<\/span><span class="gf-gsum">2 · 0 told · 1 got it<\/span>/.test(o) && /🎁 Uncle Pat<\/span><span class="gf-gsum">2 · 1 told · 0 got it<\/span>/.test(o), o.match(/gf-gsum">[^<]*/g));
  ok("…what they're getting and for whom (👤 Ava, 🤝 Ava, Ben, 🗄 no one yet)", /Bike[\s\S]*👤 Ava/.test(o) && /🤝 Ava, Ben/.test(o) && /Spare game[\s\S]*🗄 no one yet/.test(o));
  ok("…the button is on, and only this occasion's (no Old train)", /class="gf-vw on" onclick="gfGo\('others'\)"/.test(o) && !/Old train/.test(o));
  W.gfPickOcc("y"); W.gfGo("others");
  ok("an occasion with none: the view says so; the button only shows while she's on it", /Nobody else is buying anything yet/.test(root.innerHTML)); W.gfGo("people");
  ok("…and goes away when she leaves it", root.innerHTML.indexOf("gfGo('others')") < 0);
  ok("nothing written", writes.length === 0, writes);
}

console.log("\n# 1 · Who's buying it? on the present");
{
  reset(BASE()); W.renderGifts(root, "<nav/>"); W.gfEditItem("a"); let h = root.innerHTML;
  ok("sheet: 🎁 Who's buying it? with 🏠 Us picked", /🎁 Who\\'s buying it\?|🎁 Who's buying it\?/.test(h) && /class="gf-pick on" onclick="gfFromPick\(&quot;&quot;\)">🏠 Us/.test(h), h.match(/Who[^<]*buying[\s\S]{0,300}/));
  ok("…her people to pick (Gma Rose, Uncle Pat) — never a kid, never Dad", /gfFromPick\(&quot;p-gma&quot;\)/.test(h) && /gfFromPick\(&quot;p-pat&quot;\)/.test(h) && !/gfFromPick\(&quot;p-sam&quot;\)/.test(h) && !/gfFromPick\(&quot;k_/.test(h));
  ok("…a box to type someone new", /Someone not on your list\? Type their name/.test(h));
  ok("…the status picker is there while it's Us", /gfSetDraw\('status','wrapped'\)/.test(h));
  W.gfFromPick("p-gma"); h = root.innerHTML;
  ok("pick Gma Rose: the status picker gives way to the two ticks", !/gfSetDraw\('status'/.test(h) && /gfFromFormTick\('told'\)/.test(h) && /gfFromFormTick\('got'\)/.test(h) && /Gma Rose is buying it/.test(h));
  W.gfFromFormTick("told"); writes.length = 0; W.gfSave();
  const s = nonLog();
  ok("Save = ONE set on gifts/items/a with from:p-gma + told, status still 📦 here", s.length === 1 && s[0].op === "set" && s[0].path === "gifts/items/a" && s[0].val.from === "p-gma" && s[0].val.told === "2026-11-20" && s[0].val.status === "here" && s[0].val.paid === 15 && s[0].val.where === "Closet", s);
  ok("log: 'Edited: Socks → Ava $15 · 🎁 Gma Rose is buying it'", logs().length === 1 && logs()[0] === "Edited: Socks → Ava $15 · 🎁 Gma Rose is buying it", logs());
  ok("Ava's paid drops by the Socks ($185 → $170)", T.personTot("x", "k_ava").paid === 170, T.personTot("x", "k_ava"));
  W.gfEditItem("a"); W.gfFromPick(""); writes.length = 0; W.gfSave();
  const s2 = nonLog();
  ok("back to 🏠 Us: ONE set with no from / told / got and the SAME status, paid, spot", s2.length === 1 && !("from" in s2[0].val) && !("told" in s2[0].val) && !("got" in s2[0].val) && s2[0].val.status === "here" && s2[0].val.where === "Closet", s2);
  ok("…log says it's back to us", /· 🏠 back to us$/.test(logs()[0]), logs());
  const srt = o => JSON.stringify(Object.keys(o).sort().map(k => [k, o[k]]));
  ok("…and it's exactly where it was: the record matches the original, field for field", srt(T.data().items.a) === srt(BASE().items.a), [T.data().items.a, BASE().items.a]);
  ok("…every total back to before", JSON.stringify(T.personTot("x", "k_ava")) === JSON.stringify((reset(BASE()), T.personTot("x", "k_ava"))));
  reset(BASE()); W.renderGifts(root, "<nav/>"); W.gfNewItem("k_ben", "special"); W.gfSet("name", "Drum"); W.gfSave();
  ok("a new present left on Us stores no from", nonLog().length === 1 && !("from" in nonLog()[0].val));
}
{
  reset(BASE()); W.renderGifts(root, "<nav/>"); W.gfNewItem("k_ben", "special"); W.gfSet("name", "Telescope"); W.gfSet("fromNew", "Aunt Mo"); writes.length = 0; W.gfSave();
  const s = nonLog();
  ok("a typed new name: ONE update making the person (Everyone else), THEN the present's ONE set with from", s.length === 2 && s[0].op === "update" && s[0].path === "gifts/people/p-aunt-mo" && s[0].val.name === "Aunt Mo" && s[0].val.group === "other" && s[1].op === "set" && /^gifts\/items\//.test(s[1].path) && s[1].val.from === "p-aunt-mo", s);
  ok("…logs: Added person, then the present", logs()[0] === "Added person: Aunt Mo" && /Added: Telescope → Ben · 🎁 Aunt Mo is buying it/.test(logs()[1]), logs());
  W.gfNewItem("k_cal", "special"); W.gfSet("name", "Yo-yo"); W.gfSet("fromNew", "  gma rose "); writes.length = 0; W.gfSave();
  ok("a typed name that's already on her list = that person, nothing new made", nonLog().length === 1 && nonLog()[0].val.from === "p-gma", nonLog());
  W.gfEditItem(nonLog()[0].path.split("/")[2]); W.gfFromFormTick("got"); W.gfSet("fromNew", "Aunt Mo"); writes.length = 0; W.gfSave();
  ok("typing a different giver drops ticks made for the old one", nonLog().length === 1 && nonLog()[0].val.from === "p-aunt-mo" && !("got" in nonLog()[0].val), nonLog());
}
{
  reset(WITH()); W.renderGifts(root, "<nav/>"); W.gfEditItem("o2");
  ok("editing a from-others present opens on its giver with its ticks", T.edit().form.from === "p-pat" && T.edit().form.told === "2026-11-19");
  W.gfFromPick("p-gma"); const cleared = T.edit().form.told === "" && T.edit().form.got === "";
  W.gfFromPick("p-pat");
  ok("switching giver clears the ticks; switching back brings them back", cleared && T.edit().form.told === "2026-11-19");
  W.gfSetDraw("status", "here"); writes.length = 0; W.gfSave();
  ok("save keeps from + told and its hidden status", nonLog()[0].val.from === "p-pat" && nonLog()[0].val.told === "2026-11-19" && nonLog()[0].val.status === "here");
}

console.log("\n# 2 · the two ticks");
{
  reset(WITH()); W.renderGifts(root, "<nav/>"); W.gfGo("others");
  W.gfFromTick("o1", "told");
  ok("🗣 Told them = ONE update {told: today}", nonLog().length === 1 && nonLog()[0].op === "update" && nonLog()[0].path === "gifts/items/o1" && JSON.stringify(nonLog()[0].val) === '{"told":"2026-11-20"}', nonLog());
  ok("…log 'Told Gma Rose about Bike'", logs()[0] === "🗣 Told Gma Rose about Bike", logs());
  ok("…drawn ticked, card counts 1 told", /class="gf-pick on" onclick="gfFromTick\('o1','told'\)"/.test(root.innerHTML) && /2 · 1 told · 1 got it/.test(root.innerHTML));
  writes.length = 0; W.gfFromTick("o1", "told");
  ok("un-tick = ONE update {told: null}", nonLog().length === 1 && JSON.stringify(nonLog()[0].val) === '{"told":null}' && !("told" in T.data().items.o1), nonLog());
  writes.length = 0; W.gfFromTick("o3", "got");
  ok("un-tick ✅ They've got it too", JSON.stringify(nonLog()[0].val) === '{"got":null}' && /Gma Rose hasn't got it yet/.test(logs()[0]), [nonLog(), logs()]);
  writes.length = 0; W.gfFromTick("a", "told"); W.gfFromTick("o1", "status");
  ok("a tick on Mom's own present, or a made-up tick, writes nothing", writes.length === 0, writes);
  ok("ticks never change status", T.data().items.o1.status === "ordered" && T.data().items.o3.status === "here");
}

console.log("\n# 5 · kids' wish lists — nothing under wishes/");
{
  reset(WITH()); W.renderGifts(root, "<nav/>");
  WT.setWishes({ cal: { w1: { text: "Jigsaw", ts: 1 }, w2: { text: "Skates", ts: 2 } } }); W.gfOpenPerson("k_cal");
  ok("a wish someone else is buying shows '✓ on your list · 🎁 from Gma Rose' (not offered again)", /✓ on your list · 🎁 from Gma Rose/.test(root.innerHTML) && (root.innerHTML.match(/💭 Add as an idea/g) || []).length === 1);
  writes.length = 0; W.gfWishAdd("cal", "w2"); W.gfFromPick("p-pat"); W.gfSave();
  const s = nonLog();
  ok("💭 Add as an idea → pick who's buying → ONE set with wish + from", s.length === 1 && s[0].op === "set" && s[0].val.wish === "cal/w2" && s[0].val.from === "p-pat", s);
  ok("…NOTHING written under wishes/ or wishPhotos/", writes.every(w => !/^wish/.test(w.path)), writes.map(w => w.path));
  ok("…the kid's wish records untouched", JSON.stringify(WT.wishes().cal) === JSON.stringify({ w1: { text: "Jigsaw", ts: 1 }, w2: { text: "Skates", ts: 2 } }));
}

console.log("\n# 6 · Dad's side");
{
  reset(BASE()); S.dadOpen = true; W.renderGiftsDad(droot, ""); W.gdBack(); const listB = droot.innerHTML; W.gdOpen("k_ava"); const avaB = droot.innerHTML; const totB = JSON.stringify(DT.dadTot("x", "k_ava")); W.gdOpen("k_ben"); const benB = droot.innerHTML;
  W.gdBack(); reset(WITH()); S.dadOpen = true; W.renderGiftsDad(droot, ""); const listF = droot.innerHTML; W.gdOpen("k_ava"); const avaF = droot.innerHTML;
  ok("his list page (totals, counts) is unchanged", listF === listB);
  ok("his totals never include them (dadTot)", JSON.stringify(DT.dadTot("x", "k_ava")) === totB);
  ok("Ava (✏️ edit): same page + a 🎁 From others card at the bottom", sameButCard(avaF, avaB));
  const card = avaF.slice(avaF.indexOf(MARK));
  ok("…giver chips and tappable ticks", /🎁 from Gma Rose/.test(card) && /Bike/.test(card) && /onclick="gdFromTick\('o1','told'\)"/.test(card) && /onclick="gdFromTick\('o2','got'\)"/.test(card));
  ok("…the shared one names only people shared with him (Ben), never a hidden one", /🤝 shared with Ben/.test(card));
  writes.length = 0; W.gdFromTick("o1", "got");
  ok("his tick = ONE update + a 'Dad:' log line", nonLog().length === 1 && JSON.stringify(nonLog()[0].val) === '{"got":"2026-11-20"}' && logs()[0] === "Dad: ✅ Gma Rose has got Bike", [nonLog(), logs()]);
  W.gdOpen("k_ben"); const benF = droot.innerHTML;
  ok("Ben (👀 look): same page + the card, ticks read-only", sameButCard(benF, benB) && /Board game/.test(benF) && !/gdFromTick/.test(benF) && /<span class="gf-pick on" style="cursor:default">🗣 Told them<\/span>/.test(benF));
  writes.length = 0; W.gdFromTick("o2", "told");
  ok("…and a tick from a look page writes nothing", writes.length === 0, writes);
  ok("Cal isn't shared: the Jigsaw never shows on his side", !/Jigsaw/.test(listF + avaF + benF));
  W.gdBack(); writes.length = 0; W.renderGiftsDad(droot, "");
  ok("drawing his side wrote nothing", writes.length === 0);
  S.dadOpen = false;
}

console.log("\n# 7 · ↪ Move, and shared presents");
{
  reset(WITH()); W.renderGifts(root, "<nav/>"); W.gfMove("o2"); let h = root.innerHTML;
  ok("↪ Move on a from-others present: no 🗄 Hold option", !/Hold for a future holiday/.test(h));
  W.gfCancel(); W.gfMove("a");
  ok("…Mom's own presents still have it", /Hold for a future holiday/.test(root.innerHTML)); W.gfCancel();
  W.gfMove("o2"); W.gfSetDraw("occ", "y"); W.gfTogglePid("k_ava"); writes.length = 0; W.gfSave();
  const it = T.data().items.o2;
  ok("move to Easter, just Ben: ONE update of pids / occ / sec only", nonLog().length === 1 && nonLog()[0].op === "update" && !("from" in nonLog()[0].val) && !("told" in nonLog()[0].val), nonLog());
  ok("…it keeps from, told", it.from === "p-pat" && it.told === "2026-11-19" && it.occ === "y" && it.pids.join() === "k_ben");
  ok("…and shows under Easter's From others, not Christmas's", T.fromOthers("y").some(i => i.id === "o2") && !T.fromOthers("x").some(i => i.id === "o2"));
  reset(WITH());
  ok("a present for two kids from a relative counts once for each", T.othersFor("x", "k_ava").some(i => i.id === "o2") && T.othersFor("x", "k_ben").some(i => i.id === "o2"));
}

console.log("\n# taking a giver off the list keeps them on the record");
{
  reset(WITH()); W.renderGifts(root, "<nav/>"); W.gfEditPerson("p-gma"); writes.length = 0; W.gfDelete();
  ok("Gma Rose (only a giver): marked gone, not removed", nonLog().length === 1 && nonLog()[0].op === "update" && JSON.stringify(nonLog()[0].val) === '{"gone":true}', nonLog());
  W.gfGo("others");
  ok("…her presents still say who's buying them", /🎁 Gma Rose<\/span>/.test(root.innerHTML));
}

console.log("\n# no real names, nothing at start");
{
  ok("gifts.js FROMOTHERS block uses neutral words (a grandparent, aunt or uncle)", /a grandparent, aunt or uncle/.test(SRC));
  ok("no new top-level node: every from-others write goes to gifts/items or gifts/people", /write\("gifts\/items\/"\+id,\{\[k\]:null\},"update"\)/.test(SRC) && !/db\.ref\("gifts\/from/.test(SRC));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
