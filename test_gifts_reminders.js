/*
 * Node tests for 🎁 Gifts — slice 5 (2026-11-20): ⏰ reminders (gifts.js GIFTS_REMIND_START … GIFTS_REMIND_END) + Home Base's
 * 🔴 NOW rows (index.html GIFTS block: giftsLoad · giftNowHTML · giftNowOpen · giftNowRepaint, and one line in the NOW band).
 *   · each kind on/off by date: ⏰ return within 7 days (present's own or its receipt's; a receipt with no present; given / returned
 *     never nag) · 📦 late orders · 🚚 order-by (Christmas default Dec 15, her own date wins) · 🎀 the 7 days before · 🌙 Christmas Eve
 *     from 5 PM · 🔎 Jan 2–10 never marked given
 *   · ⏰ early buys: a window that ends BEFORE the occasion, more than 7 days off (then it's the ⏰ return line)
 *   · ✏️ occasion: orderBy rides in the ONE update — the only new data
 *   · the Gifts page: the card sits above the occasions + views; a tap opens the view on that occasion
 *   · Home Base: asks gifts.js only for Mom and never on Dad's TV; [] until gifts/ is in, then ONE repaint; no present names;
 *     index.html never reads gifts/
 *
 *   run:  node test_gifts_reminders.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const GJS = fs.readFileSync(path.join(__dirname, "gifts.js"), "utf8");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }

function el(id) { return { id, innerHTML: "", value: "", classList: { contains() { return false; }, add() {}, remove() {} }, querySelector() { return null; }, style: {}, focus() {}, appendChild() {} }; }
// a fresh gifts.js world (its listener state is per load)
function gworld(o) {
  o = o || {};
  const nodes = {}, writes = [], listens = [], fns = [], scripts = [], repaints = [];
  const document = { getElementById(id) { return nodes[id] || null; }, createElement(t) { return el(t); }, head: { appendChild(s) { scripts.push(s.id || s.src || ""); if (s.id) nodes[s.id] = s; } }, activeElement: null };
  const db = { ref(p) { return { set(v) { writes.push({ op: "set", path: p, val: JSON.parse(JSON.stringify(v)) }); }, update(v) { writes.push({ op: "update", path: p, val: JSON.parse(JSON.stringify(v)) }); }, remove() { writes.push({ op: "remove", path: p }); }, push(v) { writes.push({ op: "push", path: p, val: v }); }, on(ev, fn) { listens.push(p); fns.push(fn); } }; } };
  const LS = {};
  const ctx = { console, Date, Math, JSON, document, db, _todayStr: () => o.today || "2026-11-20", _dryRun: () => false, momHere: () => o.mom !== false, _kioskD: () => !!o.kiosk,
    gwShowToast() {}, confirm: () => true, HA_LS: { getItem: k => (k in LS ? LS[k] : null), setItem: (k, v) => { LS[k] = String(v); } }, tab: "moms-plan", mpSubView: o.view || "plan",
    giftNowRepaint: () => repaints.push(1), scrollTo() {} };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext("const ROSTER_DEF=[{id:'ava',name:'Ava',color:'#2563eb'},{id:'ben',name:'Ben',color:'#16a34a'}];", ctx);
  vm.runInContext(GJS, ctx);
  return { ctx, T: ctx._gfTest, R: ctx._gfRemTest, writes, listens, fns, scripts, repaints, fire: d => fns.forEach(f => f({ val: () => d })) };
}

const D = () => ({
  occasions: { x: { name: "Christmas 2026", kind: "christmas", date: "2026-12-25", secs: { santa: { name: "Santa", emoji: "🎅", order: 0 } } },
    bd: { name: "Zed's birthday 2026", kind: "birthday", date: "2026-12-01", for: "p-zed", secs: { main: { name: "Main gift", emoji: "🎁", order: 0 } } } },
  people: { "p-zed": { name: "Zed", group: "friends" } },
  items: {
    a: { occ: "x", pids: ["k_ava"], sec: "santa", name: "Treehouse", status: "here", paid: 80 },
    b: { occ: "x", pids: ["k_ben"], sec: "santa", name: "Trampoline", status: "ordered", paid: 300, due: "2026-11-15" },
    c: { occ: "x", pids: ["k_ben"], sec: "santa", name: "Socks", status: "idea", plan: 10 },
    d: { occ: "x", pids: ["k_ava"], sec: "santa", name: "Filament", status: "wrapped", paid: 60 },
    e: { occ: "x", pids: ["k_ben"], sec: "santa", name: "Dino", status: "here", paid: 20, rcpt: "r1" },
    f: { occ: "x", pids: ["k_ava"], sec: "santa", name: "Scooter", status: "ordered", paid: 90, returnBy: "2026-12-10", due: "2026-12-20" },
    g: { occ: "x", pids: ["k_ava"], sec: "santa", name: "Kite", status: "given", paid: 10, returnBy: "2026-11-22" },
    h: { occ: "x", pids: ["k_ben"], sec: "santa", name: "Robot", status: "returned", paid: 40, returnBy: "2026-11-22" },
    i: { occ: "x", pids: ["k_ben"], sec: "santa", name: "Puzzle", status: "here", paid: 15, returnBy: "2027-01-15" },
    z: { occ: "bd", pids: ["p-zed"], sec: "main", name: "Watch", status: "here", paid: 50 } },
  receipts: { r1: { store: "Shop", iso: "2026-11-01", returnBy: "2026-11-25", lines: [{ t: "Dino", item: "e" }], occ: "x" },
    r2: { store: "Shop", iso: "2026-11-02", returnBy: "2026-11-24", total: 30, lines: [{ t: "Something" }], occ: "x" } } });
const NAMES = ["Treehouse", "Trampoline", "Socks", "Filament", "Dino", "Scooter", "Kite", "Robot", "Puzzle", "Watch", "Ava", "Ben", "Zed", "Christmas 2026", "Shop"];

const W = gworld(); const { T, R } = W;
const at = (day, hour, d) => { T.setData(d || D()); return R.giftReminders(day, hour == null ? 10 : hour); };
const kind = (L, k) => L.filter(r => r.kind === k);
const one = (L, k, oid) => L.find(r => r.kind === k && (!oid || r.occ === oid));

console.log("\n# ⏰ return within 7 days · 📦 late · ⏰ early buys (Nov 20)");
{
  const L = at("2026-11-20");
  const r = one(L, "return", "x");
  ok("⏰ return: the receipt's window (Dino, Nov 25) + a receipt with no present (Nov 24) — given / returned never nag", r && r.n === 2 && r.view === "receipts" && r.text === "⏰ Return windows close this week for 1 present and 1 receipt — the first Tue Nov 24", r);
  ok("📦 late: 1 order past its coming-by date → 📦 Coming", (one(L, "late", "x") || {}).text === "📦 1 order should have come by now" && one(L, "late", "x").view === "coming");
  const e = one(L, "early", "x");
  ok("⏰ early buy: Scooter's window ends Dec 10, before Christmas → 🧾 Receipts", e && e.n === 1 && e.view === "receipts" && e.text === "⏰ 1 present's return window ends Thu Dec 10 — before Christmas", e);
  ok("no 🚚 / 🎀 / 🌙 / 🔎 on Nov 20", !kind(L, "orderby").length && !kind(L, "wrap").length && !kind(L, "eve").length && !kind(L, "hidden").length, L.map(r => r.kind));
  const d = D(); d.items.e.status = "given"; d.receipts.r2.lines = [{ t: "Something", item: "a" }]; d.items.a.rcpt = "r2";
  const L2 = at("2026-11-20", 10, d);
  ok("a given present + a receipt whose present is still here: only the here one counts", (one(L2, "return", "x") || {}).text === "⏰ The return window for 1 present closes Tue Nov 24", one(L2, "return", "x"));
  const d3 = D(); d3.items.f.returnBy = "2027-01-05"; d3.items.i.returnBy = "2026-12-24";
  ok("early buy needs the window to end BEFORE the day (Jan 5 no · Dec 24 yes)", (one(at("2026-11-20", 10, d3), "early", "x") || {}).text === "⏰ 1 present's return window ends Thu Dec 24 — before Christmas");
  const L4 = at("2026-12-05");
  ok("Dec 5: Scooter's window (Dec 10) is 5 days off → the ⏰ return line, not early", (one(L4, "return", "x") || {}).text === "⏰ The return window for 1 present closes Thu Dec 10" && !one(L4, "early", "x"), L4.filter(r => r.occ === "x"));
  ok("window closing today / tomorrow says so", /closes today$/.test((one(at("2026-12-10"), "return", "x") || {}).text) && /closes tomorrow$/.test((one(at("2026-12-09"), "return", "x") || {}).text));
  ok("a closed window says nothing (Dec 11)", !one(at("2026-12-11"), "return", "x"));
  const d5 = D(); d5.items.b.due = "2026-11-20";
  ok("📦 due today isn't late yet", !one(at("2026-11-20", 10, d5), "late", "x"));
}

console.log("\n# 🚚 order-by — Christmas default Dec 15, her own date wins");
{
  ok("Dec 7: 8 days before Dec 15 → no line", !one(at("2026-12-07"), "orderby"));
  const o = one(at("2026-12-08"), "orderby", "x");
  ok("Dec 8: 'Order the last presents by Tue Dec 15 — 1 idea not bought yet' → 🛍 Shop", o && o.text === "🚚 Order the last presents by Tue Dec 15 — 1 idea not bought yet" && o.view === "shop" && o.n === 1, o);
  ok("Dec 15: 'by today'", /by today — /.test((one(at("2026-12-15"), "orderby", "x") || {}).text));
  ok("Dec 16: gone", !one(at("2026-12-16"), "orderby"));
  const d = D(); d.items.c.status = "ordered";
  ok("no ideas left → no line", !one(at("2026-12-08", 10, d), "orderby"));
  const d2 = D(); d2.occasions.x.orderBy = "2026-12-10";
  ok("her own date (Dec 10): on from Dec 3, off Dec 2", (one(at("2026-12-03", 10, d2), "orderby", "x") || {}).text === "🚚 Order the last presents by Thu Dec 10 — 1 idea not bought yet" && !one(at("2026-12-02", 10, d2), "orderby"));
  ok("orderByOf: Christmas default / her date / a birthday has none", R.orderByOf(D().occasions.x) === "2026-12-15" && R.orderByOf(d2.occasions.x) === "2026-12-10" && R.orderByOf(D().occasions.bd) === "");
  const d3 = D(); d3.occasions.bd.orderBy = "2026-11-24"; d3.items.z.status = "idea";
  ok("a birthday with her order-by date gets the line too", !!one(at("2026-11-20", 10, d3), "orderby", "bd"));
  const d4 = D(); d4.occasions.x.closed = true;
  ok("a closed occasion: no 🚚", !one(at("2026-12-08", 10, d4), "orderby"));
}

console.log("\n# 🎀 the week of · 🌙 Christmas Eve from 5 PM · 🔎 Jan 2–10");
{
  ok("Dec 17 (8 days): no 🎀", !one(at("2026-12-17"), "wrap", "x"));
  const w = one(at("2026-12-18"), "wrap", "x");
  ok("Dec 18 (7 days): '5 presents still to wrap — Christmas in 7 days' → 🎀 To wrap (JOURNEY: here + ordered both still need wrapping)", w && w.text === "🎀 5 presents still to wrap — Christmas in 7 days" && w.view === "wrap" && w.n === 5, w);
  ok("Christmas Eve: '… is tomorrow' · the day: '… is today' · Dec 26: gone", /is tomorrow$/.test(one(at("2026-12-24"), "wrap", "x").text) && /is today$/.test(one(at("2026-12-25"), "wrap", "x").text) && !one(at("2026-12-26"), "wrap", "x"));
  ok("a birthday says 'the birthday', never its name", (one(at("2026-11-28"), "wrap", "bd") || {}).text === "🎀 1 present still to wrap — the birthday in 3 days");
  ok("Christmas Eve 4 PM: no 🌙", !one(at("2026-12-24", 16), "eve"));
  const e = one(at("2026-12-24", 17), "eve", "x");
  ok("Christmas Eve 5 PM: 'Time to gather — 4 presents to set out' → 🌙 Eve, first in the list", e && e.text === "🌙 Time to gather — 4 presents to set out · open 🌙 Eve" && e.view === "eve" && at("2026-12-24", 17)[0].kind === "eve", e);
  ok("Dec 23 at 8 PM: no 🌙", !one(at("2026-12-23", 20), "eve"));
  const h = one(at("2027-01-02"), "hidden", "x");
  ok("Jan 2: '4 presents never got marked given — still hidden?' → 📍 Where", h && h.text === "🔎 4 presents never got marked given — still hidden?" && h.view === "where", h);
  ok("Jan 1 and Jan 11: no 🔎 · Jan 10: yes", !one(at("2027-01-01"), "hidden") && !one(at("2027-01-11"), "hidden") && !!one(at("2027-01-10"), "hidden"));
  const d = D(); d.occasions.x.closed = true;
  ok("🔎 still asks after she closed Christmas (closing doesn't find a hidden present)", !!one(at("2027-01-05", 10, d), "hidden", "x"));
  const d2 = D(); Object.values(d2.items).forEach(it => { if (it.status === "here" || it.status === "wrapped") it.status = "given"; });
  ok("everything marked given → no 🔎", !one(at("2027-01-05", 10, d2), "hidden"));
  ok("a year later: no 🔎 for an old Christmas", !one(at("2028-01-05"), "hidden"));
}

console.log("\n# no names in any line");
{
  const days = [["2026-11-20", 10], ["2026-11-28", 10], ["2026-12-08", 10], ["2026-12-18", 10], ["2026-12-24", 18], ["2027-01-03", 10]];
  const all = []; days.forEach(([d, h]) => at(d, h).forEach(r => all.push(r.text)));
  ok("every kind showed up across the season", ["return", "late", "orderby", "wrap", "early", "eve", "hidden"].every(k => days.some(([d, h]) => one(at(d, h), k))));
  const leak = all.filter(t => NAMES.some(n => t.indexOf(n) >= 0));
  ok("no present, person, store or occasion name in " + all.length + " lines", !leak.length, leak);
}

console.log("\n# her rule 2026-11-20: no reminder ever says a section name or 'Santa' (a kid may see it while working)");
{
  const d = () => { const x = D(); x.occasions.x.secs.stocking = { name: "Stocking from Santa", emoji: "🧦", order: 1 }; x.occasions.x.orderBy = "2026-12-20";
    x.items.s1 = { occ: "x", pids: ["k_ava"], sec: "stocking", name: "Santa hat", status: "here", paid: 5, returnBy: "2026-12-21" };
    x.items.s2 = { occ: "x", pids: ["k_ben"], sec: "santa", name: "Letter from Santa", status: "ordered", paid: 3, due: "2026-12-01" };
    x.items.s3 = { occ: "x", pids: ["k_ben"], sec: "santa", name: "Santa sleigh", status: "idea", plan: 20 }; return x; };
  const days = [["2026-11-20", 10], ["2026-12-14", 10], ["2026-12-18", 10], ["2026-12-24", 18], ["2027-01-03", 10]];
  const texts = []; days.forEach(([dy, h]) => at(dy, h, d()).forEach(r => texts.push(r.text)));
  ok("an occasion with a 'Santa' section + Santa-named presents: " + texts.length + " lines, none matches /santa/i", texts.length >= 6 && !texts.some(t => /santa/i.test(t)), texts.filter(t => /santa/i.test(t)));
  ok("…and no section name at all (Stocking, Main gift)", !texts.some(t => /stocking|main gift/i.test(t)));
  const G = gworld({ today: "2026-12-18" }); G.T.setData(d()); G.T.reset(); G.T.setOcc("x"); const root = el("content"); G.T.setRoot(root, ""); G.ctx.gfGo("people");
  const card = (root.innerHTML.match(/<div class="gf-card gf-rem">[\s\S]*?<\/div><\/div>/) || [""])[0];
  ok("the Gifts page's reminders card: no /santa/i either", card.length > 0 && !/santa/i.test(card), card.slice(0, 200));
  const M = gworld({ today: "2026-12-18" }); M.ctx.giftNowLines(); M.fire(d()); const L = M.ctx.giftNowLines();
  ok("Home Base NOW lines: no /santa/i", L.length > 0 && !L.some(r => /santa/i.test(JSON.stringify(r))), L);
}

console.log("\n# ✏️ occasion: the order-by date — ONE update");
{
  T.setData(D()); T.reset(); T.setOcc("x"); W.writes.length = 0;
  const root = el("content"); T.setRoot(root, "");
  W.ctx.gfOccEdit(); let h = root.innerHTML;
  ok("Christmas sheet: 🚚 field, empty, saying the default", /🚚 Order the last presents by \(empty = Dec 15\)/.test(h) && T.edit().form.orderBy === "", T.edit().form.orderBy);
  W.ctx.gfSet("orderBy", "2026-12-12"); W.ctx.gfSave();
  const occW = W.writes.filter(w => w.path.indexOf("gifts/log") !== 0);
  ok("Save = ONE update of gifts/occasions/x carrying orderBy", occW.length === 1 && occW[0].op === "update" && occW[0].path === "gifts/occasions/x" && occW[0].val.orderBy === "2026-12-12", occW);
  ok("the reminders read it at once", R.orderByOf(T.data().occasions.x) === "2026-12-12");
  W.writes.length = 0; W.ctx.gfOccEdit(); ok("✏️ again shows her date", T.edit().form.orderBy === "2026-12-12");
  W.ctx.gfSet("orderBy", ""); W.ctx.gfSave();
  const w2 = W.writes.filter(w => w.path.indexOf("gifts/log") !== 0);
  ok("emptied → orderBy removed in the same ONE update (back to Dec 15)", w2.length === 1 && w2[0].val.orderBy === null && !("orderBy" in T.data().occasions.x) && R.orderByOf(T.data().occasions.x) === "2026-12-15", w2);
  W.ctx.gfNewOcc(); ok("a NEW occasion's sheet has no 🚚 field (set it on ✏️)", !/🚚 Order the last presents/.test(root.innerHTML)); W.ctx.gfCancel();
  W.writes.length = 0; W.ctx.gfOccEdit(); W.ctx.gfSet("name", "Christmas 2026"); W.ctx.gfSave();
  ok("saving the sheet for something else never writes a default date", W.writes.filter(w => w.path === "gifts/occasions/x").every(w => w.val.orderBy == null));
  const allPaths = new Set(); [W].forEach(w => w.writes.forEach(x => allPaths.add(x.path)));
  ok("no other node written (occasion + log only)", [...allPaths].every(p => p === "gifts/occasions/x" || p === "gifts/log"), [...allPaths]);
}

console.log("\n# the Gifts page: card on top, a tap opens the view on that occasion");
{
  const G = gworld({ today: "2026-11-20" }); G.T.setData(D()); G.T.reset(); G.T.setOcc("x");
  const root = el("content"); G.T.setRoot(root, "<nav/>"); G.ctx.gfGo("people"); const h = root.innerHTML;
  const iR = h.indexOf("gf-rem"), iO = h.indexOf("gf-occs"), iV = h.indexOf("gf-views");
  ok("⏰ card sits above the occasions and the view row", iR > 0 && iR < iO && iO < iV, [iR, iO, iV]);
  ok("each line a button → gfRemGo(view, occasion)", /onclick="gfRemGo\('coming','x'\)"/.test(h) && /onclick="gfRemGo\('receipts','x'\)"/.test(h));
  ok("its own style, added once", G.scripts.filter(s => s === "gf-rem-style").length === 1);
  G.ctx.gfRemGo("coming", "x"); ok("tap 📦 → 📦 Coming, the late one listed", G.T.view() === "coming" && /⏰ Late/.test(root.innerHTML) && /gf-remrow on/.test(root.innerHTML));
  G.ctx.gfRemGo("where", "bd", true); ok("quiet (from Home Base): view + occasion set, nothing drawn", G.T.view() === "where" && G.T.curOcc() === "bd");
  G.ctx.gfRemGo("nonsense", "nope", true); ok("an unknown view → People; an unknown occasion is left alone", G.T.view() === "people" && G.T.curOcc() === "bd");
  const E = gworld({ today: "2026-11-20" }); E.T.setData({ occasions: D().occasions, items: { c: D().items.c } }); E.T.reset(); E.T.setOcc("x");
  const r2 = el("content"); E.T.setRoot(r2, ""); E.ctx.gfGo("people");
  ok("nothing due → no card", r2.innerHTML.indexOf("gf-rem") < 0);
}

console.log("\n# giftNowLines — Mom only, never Dad's TV, [] until gifts/ is in, ONE repaint");
{
  const K = gworld({ mom: false }); ok("not Mom: [] and gifts/ never listened to", K.ctx.giftNowLines().length === 0 && K.listens.length === 0);
  const Dd = gworld({ kiosk: true }); ok("Dad's TV (?kiosk=dad) even with the Mom switch on: [] and no listener", Dd.ctx.giftNowLines().length === 0 && Dd.listens.length === 0);
  const M = gworld({ today: "2026-11-20" });
  ok("Mom, before gifts/ is in: [] — and the listener starts", M.ctx.giftNowLines().length === 0 && M.listens.join() === "gifts");
  M.fire(D()); ok("gifts/ arrives → Home Base repaints ONCE", M.repaints.length === 1);
  M.fire(D()); ok("a later change doesn't repaint Home Base again", M.repaints.length === 1);
  const L = M.ctx.giftNowLines();
  ok("then the lines: same as the Gifts card, most urgent first", L.length === 3 && L.map(r => r.kind).join() === "return,late,early", L.map(r => r.kind));
  ok("each line is {kind, text, n, view, occ} only — no occasion name", L.every(r => Object.keys(r).sort().join() === "kind,n,occ,text,view"));
  ok("no present names in the NOW lines", !L.some(r => NAMES.some(n => r.text.indexOf(n) >= 0)));
  ok("calling it again doesn't add a second listener", (M.ctx.giftNowLines(), M.listens.length === 1));
  const P = gworld({ view: "gifts" }); P.ctx.renderGifts(el("content"), ""); P.fire(D());
  ok("Gifts page opened first (Home Base never asked): no Home Base repaint", P.repaints.length === 0);
}

// ── index.html ────────────────────────────────────────────────────────────────
const blk = name => { const a = src.indexOf("// " + name + "_START"), b = src.indexOf("// " + name + "_END"); if (a < 0 || b < a) throw new Error("missing block " + name); return src.slice(a, b); };
const fn = name => { const i = src.indexOf("\nfunction " + name + "("); if (i < 0) throw new Error("missing " + name); const eol = src.indexOf("\n", i + 1), line = src.slice(i + 1, eol);
  if (line.split("{").length === line.split("}").length) return line; return src.slice(i + 1, src.indexOf("\n}", i + 1) + 2); };
const GB = blk("GIFTS");

console.log("\n# index.html — the secret stays in gifts.js");
{
  ok("index.html never reads gifts/ itself (no db.ref(\"gifts…))", !/db\.ref\(\s*["'`]gifts/.test(src));
  ok("the GIFTS block has no db and no family / kid names", !/\bdb\b|\.ref\(/.test(GB.replace(/\/\/[^\n]*/g, "")) && !/lincoln|ellis|lucy|julian|howe|dewalt|burris|sara|melanie/i.test(GB));
  const md = fn("renderMomsDay"), iNow = md.indexOf("Now — needs you"), iG = md.indexOf("giftNowHTML()"), iNone = md.indexOf("Nothing waiting on you right now");
  ok("Home Base's 🔴 NOW asks giftNowHTML, inside the Now card, counted before the 'nothing waiting' line", iNow > 0 && iG > iNow && iG < iNone && /const _gf=giftNowHTML\(\); nowN\+=_gf\.n; h\+=_gf\.html;/.test(md));
  ok("one gifts.js loader for both doors", (GB.match(/createElement\("script"\)/g) || []).length === 1 && /giftsLoad\(\(\)=>/.test(GB) && /if\(typeof window\.giftNowLines!=="function"\)\{ giftsLoad\(\); return/.test(GB));
  ok("every inline <script> still compiles", (() => { const re = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g; let m, n = 0; while ((m = re.exec(src))) { n++; try { new vm.Script(m[1]); } catch (e) { console.log("    script #" + n + ": " + e.message); return false; } } return n > 0; })());
}

function iworld(o) {
  o = o || {};
  const scripts = [], log = [], content = { id: "content", innerHTML: "" };
  const ctx = { console, Date, Math, JSON, String, Object, Array,
    momHere: () => o.mom !== false, _kioskD: () => !!o.kiosk, location: { hostname: "localhost" },
    mwBanner: s => "<banner/>", mpSubnav: v => "<subnav " + v + "/>", renderAll: () => log.push("renderAll"), renderMomsPlan: () => log.push("renderMomsPlan"),
    mpGoto: v => log.push("mpGoto:" + v),
    document: { getElementById: id => id === "content" ? content : null, createElement: t => ({ tagName: t }), head: { appendChild: s => scripts.push(s) } } };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(["var tab=" + JSON.stringify(o.tab || "moms-plan") + ", mpSubView=" + JSON.stringify(o.view === undefined ? "plan" : o.view) + ", momSchedView=" + (!!o.msv) + ";", fn("esc"), GB].join("\n"), ctx);
  return { ctx, scripts, log, content };
}

console.log("\n# Home Base asks gifts.js only for Mom, never Dad's TV");
{
  const k = iworld({ mom: false }); const r = k.ctx.giftNowHTML();
  ok("a kid's device (Mom switch off): nothing, gifts.js never loaded", r.n === 0 && r.html === "" && k.scripts.length === 0);
  const d = iworld({ kiosk: true }); const r2 = d.ctx.giftNowHTML();
  ok("Dad's TV, even with the Mom switch on: nothing, gifts.js never loaded", r2.n === 0 && r2.html === "" && d.scripts.length === 0);
  const m = iworld(); const r3 = m.ctx.giftNowHTML();
  ok("Mom on Home Base: gifts.js starts loading, no rows yet", r3.n === 0 && m.scripts.length === 1 && m.scripts[0].src === "gifts.js");
  m.ctx.giftNowHTML(); ok("asked again while it loads: still one script", m.scripts.length === 1);
  m.scripts[0].onload(); ok("loaded on Home Base → one repaint", m.log.join() === "renderAll");
  const g = iworld({ view: "gifts" }); g.ctx.renderMPGifts(g.content);
  ok("💰 Budget ▸ Gifts still loads it through the same loader", g.scripts.length === 1 && /Loading presents/.test(g.content.innerHTML));
  g.scripts[0].onerror(); ok("a failed load on Gifts says so; the next try may load again", /Couldn't load the gift list/.test(g.content.innerHTML) && (g.ctx.renderMPGifts(g.content), g.scripts.length === 2));
  const h = iworld(); h.ctx.giftNowHTML(); h.scripts[0].onerror(); ok("a failed load on Home Base: no error page painted over Home Base", h.content.innerHTML === "");
  ok("giftHomeBase: plan / null yes · gifts, the Schedule view, another tab no", iworld().ctx.giftHomeBase() && iworld({ view: null }).ctx.giftHomeBase() && !iworld({ view: "gifts" }).ctx.giftHomeBase() && !iworld({ msv: true }).ctx.giftHomeBase() && !iworld({ tab: "kids" }).ctx.giftHomeBase());
  const rp = iworld(); rp.ctx.giftNowRepaint(); const rq = iworld({ view: "grocery" }); rq.ctx.giftNowRepaint();
  ok("giftNowRepaint repaints Home Base only", rp.log.join() === "renderMomsPlan" && rq.log.length === 0);
}

console.log("\n# the real thing: Home Base + gifts.js together");
{
  const m = iworld({ today: "2026-11-20" }); const c = m.ctx; const fns = [];
  c._todayStr = () => "2026-11-20"; c._dryRun = () => false; c.HA_LS = { getItem: () => null, setItem() {} }; c.gwShowToast = () => {};
  c.db = { ref: p => ({ on: (ev, f) => fns.push([p, f]), set() {}, update() {}, remove() {}, push() {} }) };
  vm.runInContext("const ROSTER_DEF=[{id:'ava',name:'Ava',color:'#2563eb'},{id:'ben',name:'Ben',color:'#16a34a'}];", c);
  c.giftNowHTML(); vm.runInContext(GJS, c); m.scripts[0].onload();
  const r0 = c.giftNowHTML();
  ok("gifts.js in, gifts/ not yet: no rows, gifts/ listened to once", r0.n === 0 && fns.length === 1 && fns[0][0] === "gifts");
  m.log.length = 0; fns[0][1]({ val: () => D() });
  ok("gifts/ arrives → Home Base repainted once", m.log.join() === "renderMomsPlan");
  const r = c.giftNowHTML();
  ok("then 3 🎁 Presents rows, each Open › to its view", r.n === 3 && /🎁 Presents/.test(r.html) && (r.html.match(/Open ›/g) || []).length === 3 && /giftNowOpen\('coming','x'\)/.test(r.html), r.html);
  const leak = NAMES.filter(n => r.html.indexOf(n) >= 0);
  ok("no present, person, store or occasion name on Home Base", !leak.length, leak);
  m.log.length = 0; c.giftNowOpen("coming", "x");
  ok("tap → Gifts opens on 📦 Coming for that occasion", m.log.join() === "mpGoto:gifts" && c._gfTest.view() === "coming" && c._gfTest.curOcc() === "x");
  c.momHere = () => false; ok("Mom switch off → the rows go", c.giftNowHTML().n === 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
