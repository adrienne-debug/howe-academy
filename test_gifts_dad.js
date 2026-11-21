/*
 * Node tests for 🎁 Gifts — 👨 Dad sharing (GIFTS_DAD, her answer 2026-11-20: "dad can too if given permission from mom and that
 * can be per person per holiday etc"; Mom picks per share: off · 👀 look · ✏️ edit).
 *   MOM  · a share = ONE targeted write gifts/share/<oid>/<pid> ("look" | "edit" | removed); a group = one each, only where it changes
 *        · giftShare/<oid> = true (own top node, no names) only when a holiday goes nothing ↔ something
 *        · per holiday: another holiday starts with nothing shared
 *        · "This person is Dad" (gifts/people/<pid>.isDad): never shared, never a kid, one at a time
 *   DAD  · renderGiftsDad reads nothing and draws nothing until index.html's giftDadOpen() is true (his code, this visit) —
 *          his ?kiosk=dad link, Mom mode and his Star controls don't count
 *        · only shared holidays / people / presents; a present with an unshared person says "🤝 shared" and never names them;
 *          a present for Dad never renders; no Even, receipts, Stash, wish lists, group or holiday totals
 *        · 👀 look = no handlers, no writes · ✏️ edit = ONE update of status / where / paper / paid only, or ONE set of a new present
 *          for that person · logged "Dad: …" · a 📜 Past holiday is look-only
 *        · gfDadLock stops the gifts/ listener and forgets the data (unless Mom is on the device)
 *   index.html · never reads gifts/ · entry only when the flag says so, no names / counts · the lock, 5-tries wait, leaving / idle /
 *          hidden all lock · routes
 *
 *   run:  node test_gifts_dad.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 400) + ")" : "")); } }
const GJS = fs.readFileSync(path.join(__dirname, "gifts.js"), "utf8");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const ROSTER = "const ROSTER_DEF=[{id:'ava',name:'Ava',color:'#2563eb'},{id:'ben',name:'Ben',color:'#16a34a'},{id:'cal',name:'Cal',color:'#db2777'},{id:'dee',name:'Dee',color:'#d97706'}];";

// ── a gifts.js world ──────────────────────────────────────────────────────────
function el(id) { return { id, innerHTML: "", value: "", classList: { contains() { return false; }, add() {}, remove() {} }, querySelector() { return null; }, style: {}, focus() {}, appendChild() {} }; }
function gworld() {
  const nodes = {}, root = el("content");
  const document = { getElementById(id) { return nodes[id] || (nodes[id] = el(id)); }, createElement(t) { return el(t); }, head: { appendChild() {} }, activeElement: null };
  const w = { writes: [], listens: [], offs: [], dry: false, mom: true, dadOpen: false, kioskD: false, root, LS: {} };
  const db = { ref(p) { return { set(v) { w.writes.push({ op: "set", path: p, val: JSON.parse(JSON.stringify(v)) }); }, update(v) { w.writes.push({ op: "update", path: p, val: JSON.parse(JSON.stringify(v)) }); }, remove() { w.writes.push({ op: "remove", path: p }); },
    push(v) { w.writes.push({ op: "push", path: p, val: v }); }, on() { w.listens.push(p); }, off() { w.offs.push(p); }, once() { w.listens.push(p); return { then() { return { catch() {} }; } }; } }; } };
  const ctx = { console, Date, Math, JSON, document, db, _todayStr: () => "2026-11-20", _dryRun: () => w.dry, momHere: () => w.mom, gwShowToast() {}, confirm: () => true,
    giftDadOpen: () => w.dadOpen, _kioskD: () => w.kioskD, dadUnlocked: false,
    HA_LS: { getItem: k => (k in w.LS ? w.LS[k] : null), setItem: (k, v) => { w.LS[k] = String(v); } }, tab: "moms-plan", mpSubView: "gifts" };
  ctx.window = ctx; vm.createContext(ctx); vm.runInContext(ROSTER, ctx); vm.runInContext(GJS, ctx);
  w.W = ctx; w.T = ctx._gfTest; w.D = ctx._gfDadTest;
  w.reset = d => { w.writes.length = 0; w.listens.length = 0; w.offs.length = 0; w.T.setData(d || {}); w.T.reset(); w.T.setOcc("x"); w.T.setRoot(root, "<nav/>"); };
  w.shareW = () => w.writes.filter(x => /^gifts\/share\//.test(x.path));
  w.flagW = () => w.writes.filter(x => /^giftShare\//.test(x.path));
  w.logs = () => w.writes.filter(x => x.op === "push" && x.path === "gifts/log").map(x => x.val.text);
  return w;
}
const DATA = () => ({
  occasions: { x: { name: "Christmas 2026", kind: "christmas", date: "2026-12-25", budget: 2000,
      secs: { special: { name: "Special", emoji: "⭐", order: 0 }, parents: { name: "From Mom & Dad", emoji: "🎁", order: 1 }, stocking: { name: "Stocking", emoji: "🧦", order: 2 } } },
    y: { name: "Easter 2027", kind: "easter", date: "2027-03-28", secs: { basket: { name: "Basket", emoji: "🧺", order: 0 } } } },
  people: { "p-gma": { name: "Gma Rose", group: "mom" }, "p-pat": { name: "Uncle Pat", group: "mom" }, "p-sam": { name: "Sam", group: "dad" }, "p-nan": { name: "Nana Jo", group: "dad" } },
  plan: { x: { k_ava: { budget: 300 }, k_ben: { budget: 250 }, g_kids: { budget: 1111 } } },
  items: {
    a: { occ: "x", pids: ["k_ava"], sec: "parents", name: "Treehouse", status: "here", paid: 80, plan: 90, where: "Attic", paper: "Gold stars", note: "secret note", link: "https://example.com/t", rcpt: "r1" },
    b: { occ: "x", pids: ["k_ava", "k_ben"], sec: "special", name: "Trampoline", status: "ordered", paid: 300 },
    c: { occ: "x", pids: ["k_ben"], sec: "stocking", name: "Socks", status: "idea", plan: 10 },
    d: { occ: "x", pids: ["k_cal"], sec: "parents", name: "Filament", status: "wrapped", paid: 60 },
    e: { occ: "x", pids: ["p-gma"], sec: "gifts", name: "Scarf", status: "here", paid: 25 },
    f: { occ: "x", pids: ["p-sam"], sec: "gifts", name: "Wallet", status: "here", paid: 40 },
    g: { occ: "x", pids: ["k_ava", "p-sam"], sec: "parents", name: "Kite for two", status: "here", paid: 50 },
    h: { occ: "x", sec: "parents", name: "Spare puzzle", status: "here", paid: 15 },
    i: { occ: "_hold", pids: ["k_ava"], sec: "parents", name: "Held robot", status: "here", paid: 33 },
    j: { occ: "y", pids: ["k_ava"], sec: "basket", name: "Bunny", status: "idea", plan: 12 } },
  receipts: { r1: { store: "Shopmart", iso: "2026-11-01", total: 80, occ: "x", lines: [{ t: "Treehouse", p: 80, item: "a" }] } } });

console.log("\n# Mom — a share is ONE targeted write per person, this holiday only");
{
  const w = gworld(); w.reset(DATA());
  w.W.gfShareDad("k_ava", "edit");
  ok("one person → ONE set gifts/share/x/k_ava = 'edit'", w.shareW().length === 1 && w.shareW()[0].op === "set" && w.shareW()[0].path === "gifts/share/x/k_ava" && w.shareW()[0].val === "edit", w.writes);
  ok("first share of the holiday → giftShare/x = true (own top node, no names)", w.flagW().length === 1 && w.flagW()[0].op === "set" && w.flagW()[0].path === "giftShare/x" && w.flagW()[0].val === true);
  ok("…and one log line; nothing else written", w.writes.length === 3 && /Dad \+ Ava for Christmas 2026: edit/.test(w.logs()[0]), w.writes.map(x => x.path));
  w.writes.length = 0; w.W.gfShareDad("k_ben", "look");
  ok("a second person → ONE share write, no flag write (already on)", w.shareW().length === 1 && w.shareW()[0].val === "look" && w.flagW().length === 0);
  w.writes.length = 0; w.W.gfShareDad("k_ben", "look");
  ok("the same pick again writes nothing", w.writes.length === 0);
  ok("per holiday: Easter starts with nothing shared", w.D.shareMode("y", "k_ava") === "" && !w.D.shareAny("y") && w.D.shareMode("x", "k_ava") === "edit");
  w.T.draw(); const h = w.root.innerHTML;
  ok("occasion card: 👨 Dad sees: Ava (edit), Ben (look)", /👨 Dad sees: Ava \(edit\), Ben \(look\)/.test(h), h.match(/👨 Dad sees[^<]*/));
  ok("group card: 👨 Share all with Dad — Off · 👀 Look · ✏️ Edit · '2 of 4 shared'", /Share all with Dad · 2 of 4 shared/.test(h) && /gfShareGroup\('kids',''\)/.test(h) && /gfShareGroup\('kids','look'\)/.test(h) && /gfShareGroup\('kids','edit'\)/.test(h));
  w.W.gfOpenPerson("k_ava"); const ph = w.root.innerHTML;
  ok("person page: 👨 Share with Dad card, ✏️ Edit lit, for this holiday", /👨 Share with Dad<\/span><span class="gf-gsum">Christmas 2026/.test(ph) && /class="gf-pick on" onclick="gfShareDad\('k_ava','edit'\)"/.test(ph) && /gfShareDad\('k_ava',''\)/.test(ph));
  ok("a kid's page has no 'This person is Dad' tick", !/gfDadIs\('k_ava'/.test(ph));
  w.writes.length = 0; w.W.gfShareDad("k_ava", "");
  ok("off → ONE remove of that person; flag stays (Ben is still shared)", w.shareW().length === 1 && w.shareW()[0].op === "remove" && w.shareW()[0].path === "gifts/share/x/k_ava" && w.flagW().length === 0);
  w.writes.length = 0; w.W.gfShareDad("k_ben", "");
  ok("last one off → ONE remove + the flag removed", w.shareW().length === 1 && w.flagW().length === 1 && w.flagW()[0].op === "remove" && w.flagW()[0].path === "giftShare/x");
  w.T.draw(); ok("nothing shared → no 'Dad sees' line", !/Dad sees/.test(w.root.innerHTML));
}

console.log("\n# Mom — a whole group in one tap = one write EACH");
{
  const w = gworld(); w.reset(DATA()); w.W.gfShareDad("k_ben", "look"); w.writes.length = 0;
  w.W.gfShareGroup("kids", "look");
  ok("kids → look: one set for each kid that changes (Ben already look → 3)", w.shareW().length === 3 && w.shareW().every(x => x.op === "set" && x.val === "look" && /^gifts\/share\/x\/k_(ava|cal|dee)$/.test(x.path)), w.shareW());
  ok("never a whole-node write of gifts/share or gifts/share/x", !w.writes.some(x => x.path === "gifts/share" || x.path === "gifts/share/x" || x.path === "gifts"));
  ok("one log line for the group, no flag write (already on)", w.logs().length === 1 && /Dad \+ Kids \(3\) for Christmas 2026: look/.test(w.logs()[0]) && w.flagW().length === 0, w.logs());
  w.writes.length = 0; w.W.gfShareGroup("kids", "edit");
  ok("kids → edit: 4 sets, one each", w.shareW().length === 4 && w.shareW().every(x => x.val === "edit"));
  w.writes.length = 0; w.W.gfShareGroup("kids", "");
  ok("kids → off: 4 removes + the flag removed once", w.shareW().length === 4 && w.shareW().every(x => x.op === "remove") && w.flagW().length === 1 && w.flagW()[0].op === "remove");
  w.writes.length = 0; w.dry = true; w.W.gfShareGroup("kids", "edit"); w.W.gfShareDad("p-gma", "look");
  ok("?dryrun=1 writes nothing", w.writes.length === 0); w.dry = false;
}

console.log("\n# Mom — 'This person is Dad': never shared");
{
  const w = gworld(); w.reset(DATA());
  w.W.gfShareDad("p-sam", "edit"); w.W.gfShareDad("p-nan", "look"); w.writes.length = 0;
  w.W.gfDadIs("p-sam", true);
  const up = w.writes.find(x => x.path === "gifts/people/p-sam");
  ok("tick = ONE update {isDad:true} on that person", up && up.op === "update" && JSON.stringify(up.val) === '{"isDad":true}', w.writes);
  ok("…and his share for this holiday is taken away (one remove)", w.shareW().length === 1 && w.shareW()[0].op === "remove" && w.shareW()[0].path === "gifts/share/x/p-sam");
  ok("flag stays — Nana is still shared", w.flagW().length === 0 && w.D.shareAny("x"));
  w.writes.length = 0; w.W.gfShareDad("p-sam", "edit");
  ok("sharing Dad himself writes nothing", w.writes.length === 0 && w.D.shareMode("x", "p-sam") === "");
  w.W.gfShareGroup("dad", "edit");
  ok("sharing his whole group skips him (only Nana's write)", w.shareW().length === 1 && w.shareW()[0].path === "gifts/share/x/p-nan" && w.shareW()[0].val === "edit", w.shareW());
  w.W.gfOpenPerson("p-sam"); const h = w.root.innerHTML;
  ok("his page: 'This is Dad', the tick is on, no share buttons", /This is Dad\. Presents for him never show/.test(h) && /type="checkbox" checked onchange="gfDadIs\('p-sam'/.test(h) && !/gfShareDad\('p-sam'/.test(h));
  w.writes.length = 0; w.W.gfDadIs("k_ava", true);
  ok("a kid can never be marked Dad", w.writes.length === 0 && !w.D.dadIds().k_ava);
  w.W.gfDadIs("p-pat", true);
  ok("one Dad at a time: ticking another unticks the first (one update each)", w.writes.filter(x => x.op === "update").map(x => x.path + JSON.stringify(x.val)).join("|") === 'gifts/people/p-sam{"isDad":null}|gifts/people/p-pat{"isDad":true}', w.writes);
  w.writes.length = 0; w.W.gfDadIs("p-pat", false);
  ok("untick = ONE update {isDad:null}", w.writes.filter(x => x.op === "update").length === 1 && JSON.stringify(w.writes[0].val) === '{"isDad":null}' && !Object.keys(w.D.dadIds()).length);
  const w2 = gworld(); w2.reset(DATA()); w2.W.gfShareDad("p-sam", "look"); w2.writes.length = 0; w2.W.gfDadIs("p-sam", true);
  ok("ticking Dad when he was the only one shared also removes the flag", w2.flagW().length === 1 && w2.flagW()[0].op === "remove" && w2.flagW()[0].path === "giftShare/x");
  w2.W.gfOpenPerson("k_ava");
  const w3 = gworld(); w3.reset(DATA()); w3.W.gfOpenPerson("k_ava");
  ok("nobody marked as Dad yet → a nudge to tick him", /Is Dad on your list\?/.test(w3.root.innerHTML) && !/Is Dad on your list\?/.test(w2.root.innerHTML));
}

// what Dad's side looks like with: Ava ✏️ edit, Ben 👀 look, Sam = Dad; Cal, Dee, Gma, Pat, Nana not shared
function dadWorld(opts) {
  const w = gworld(), d = DATA(); d.share = { x: { k_ava: "edit", k_ben: "look" } }; d.people["p-sam"].isDad = true;
  if (opts && opts.data) opts.data(d);
  w.mom = false; w.reset(d); w.droot = el("dad"); return w;
}

console.log("\n# Dad — nothing is read or drawn before his code this visit");
{
  const w = dadWorld(); w.dadOpen = false;
  w.W.renderGiftsDad(w.droot, "<nav/>");
  ok("no code → NO gifts/ listener, no read at all", w.listens.length === 0 && !w.D.on(), w.listens);
  ok("…and nothing about the gifts on screen", /🔒/.test(w.droot.innerHTML) && !/Ava|Ben|Treehouse|Christmas|gd-page/.test(w.droot.innerHTML), w.droot.innerHTML);
  w.kioskD = true; w.W.dadUnlocked = true; w.mom = true; w.W.renderGiftsDad(w.droot, "<nav/>");
  ok("his ?kiosk=dad link, his Star controls and Mom mode don't open it either", w.listens.length === 0 && !/Ava|gd-page/.test(w.droot.innerHTML));
  w.mom = false; w.W.gdOpen("k_ava"); w.W.gdEditItem("a"); w.W.gdNew("k_ava", "parents"); w.W.gdSave();
  ok("locked: every Dad action is inert (no sheet, no write)", w.D.edit() === null && w.writes.length === 0);
  w.kioskD = false; w.dadOpen = true; w.W.renderGiftsDad(w.droot, "<nav/>");
  ok("code typed → the gifts/ listener starts (gifts.js, not index.html)", w.listens.join() === "gifts" && w.D.on());
  ok("…and the page is drawn inside #gd-page under the nav", /^<nav\/><div id="gd-page">/.test(w.droot.innerHTML));
}

console.log("\n# Dad — only what Mom shared");
{
  const w = dadWorld(); w.dadOpen = true; w.W.renderGiftsDad(w.droot, "<nav/>");
  let h = w.droot.innerHTML;
  ok("list: the two shared kids, with ✏️ / 👀", /Ava <span[^>]*>✏️ you can edit/.test(h) && /Ben <span[^>]*>👀 look only/.test(h), h.match(/gdOpen[^)]*\)/g));
  ok("no unshared people (Cal, Dee, Gma, Pat, Nana) and never Dad himself", !/Cal|Dee|Gma|Pat|Nana|Sam/.test(h));
  ok("only the shared holiday (Easter has nothing shared → no chips at all)", !/Easter/.test(h) && !/gdPickOcc/.test(h) && w.D.dadOccs().map(o => o.id).join() === "x");
  ok("no Even, receipts, Stash, Shop, Eve, wish lists, ＋ Occasion, ＋ Person, Move", !/Even|Receipt|Stash|🛍|🌙 Eve|wish|gfNewOcc|gfNewPerson|gfMove|gfGo\(|gfEditItem|gfBudget/i.test(h));
  ok("no holiday total / budget and no group budget", !/2,000|1,111|\$540|\$570/.test(h), h.match(/\$[\d,.]+/g));
  ok("Ava's own budget bar is there ($300)", /\/ \$300/.test(h) && /gf-bar/.test(h));
  const TA = w.D.dadTot("x", "k_ava");
  ok("his totals count only presents he can see: Ava = 80 + half the trampoline (the one with Dad is left out)", TA.paid === 230 && TA.count === 2 && TA.budget === 300, TA);
  w.W.gdOpen("k_ava"); h = w.droot.innerHTML;
  ok("Ava's page: her presents — name, status, paid / planned, 📍 where, 🎀 paper", /Treehouse/.test(h) && /📦 Here/.test(h) && /\$80/.test(h) && /planned \$90/.test(h) && /📍 Attic/.test(h) && /🎀 Gold stars/.test(h));
  ok("a present shared with Ben (also shared) names him", /🤝 shared with Ben/.test(h));
  ok("the present that is also for Dad never renders", !/Kite for two/.test(h) && !w.D.dadItems("x").some(it => it.id === "g" || it.id === "f"));
  ok("no notes, links, receipts, held or other-holiday presents", !/secret note|example\.com|Shopmart|🧾|Held robot|Bunny|Spare puzzle/.test(h));
  ok("presents Dad sees = a, b, c only", w.D.dadItems("x").map(it => it.id).sort().join() === "a,b,c");
}
{
  const w = dadWorld({ data: d => { d.share.x = { k_ava: "look" }; } }); w.dadOpen = true; w.W.renderGiftsDad(w.droot, ""); w.W.gdOpen("k_ava");
  const h = w.droot.innerHTML;
  ok("shared with someone who is NOT shared: '🤝 shared' and no name (the safer pick)", /Trampoline/.test(h) && />🤝 shared<\/span>/.test(h) && !/Ben/.test(h), h.match(/🤝[^<]*/g));
  w.W.gdOpen("k_ben"); ok("an unshared person's page can't be opened (falls back to the list)", !/Socks/.test(w.droot.innerHTML) && w.D.pid() === null);
}
{
  const w = dadWorld({ data: d => { d.share.y = { k_ava: "edit" }; d.occasions.y.closed = true; } }); w.dadOpen = true; w.W.renderGiftsDad(w.droot, "");
  ok("two shared holidays → a chip for each", /gdPickOcc\('x'\)/.test(w.droot.innerHTML) && /gdPickOcc\('y'\)/.test(w.droot.innerHTML));
  w.W.gdPickOcc("y"); w.W.gdOpen("k_ava"); const h = w.droot.innerHTML;
  ok("a 📜 Past holiday is look-only even when shared as edit", /Bunny/.test(h) && !/gdEditItem|gdNew/.test(h) && /👀 look only/.test(h));
  w.W.gdEditItem("j"); w.W.gdNew("k_ava", "basket"); ok("…its presents can't be opened or added to", w.D.edit() === null);
}
{
  const w = dadWorld({ data: d => { d.people["p-gma"].gone = true; d.share.x = { "p-gma": "edit" }; } }); w.dadOpen = true; w.W.renderGiftsDad(w.droot, "");
  ok("someone taken off the list is not shared → 'Nothing is shared with you right now'", /Nothing is shared with you right now/.test(w.droot.innerHTML) && !/Gma|Scarf/.test(w.droot.innerHTML));
}

console.log("\n# Dad — 👀 look = no handlers, no writes");
{
  const w = dadWorld(); w.dadOpen = true; w.W.renderGiftsDad(w.droot, ""); w.W.gdOpen("k_ben");
  const h = w.droot.innerHTML;
  ok("Ben's page (look): his presents, read-only rows", /Socks/.test(h) && /Trampoline/.test(h) && /gd-ro/.test(h));
  ok("…the only buttons are ← back (no edit, add or save handler)", (h.match(/onclick="[^"]*"/g) || []).join("|") === 'onclick="gdBack()"', h.match(/onclick="[^"]*"/g));
  w.W.gdEditItem("c"); ok("opening a look-only present does nothing", w.D.edit() === null);
  w.W.gdNew("k_ben", "stocking"); ok("adding for a look-only person does nothing", w.D.edit() === null);
  w.W.gdSave(); ok("no write of any kind", w.writes.length === 0);
  w.W.gdEditItem("b"); ok("…even the present Ben shares with Ava (✏️) is read-only on Ben's page", w.D.edit() === null);
  w.W.gdOpen("k_ava"); w.W.gdEditItem("b"); ok("…it opens from Ava's page, where Dad may edit", w.D.edit() && w.D.edit().id === "b" && w.D.edit().pid === "k_ava"); w.W.gdCancel();
}

console.log("\n# Dad — ✏️ edit = the allowed writes only");
{
  const w = dadWorld(); w.dadOpen = true; w.W.renderGiftsDad(w.droot, ""); w.W.gdOpen("k_ava");
  let h = w.droot.innerHTML;
  ok("Ava's page (edit): rows open, ＋ on each section", /onclick="gdEditItem\('a'\)"/.test(h) && /onclick="gdNew\('k_ava','parents'\)"/.test(h) && /onclick="gdNew\('k_ava','stocking'\)"/.test(h));
  w.W.gdEditItem("a"); h = w.droot.innerHTML;
  ok("the sheet: status, paid, where, paper — and nothing else (no name, For, section, Move, Delete)", /id="gd-sheet"/.test(h) && /gdSetDraw\('status','wrapped'\)/.test(h) && /gdSet\('paid'/.test(h) && /gdSet\('where'/.test(h) && /gdSet\('paper'/.test(h) &&
    !/gdSet\('name'|gdSet\('plan'|gdSetDraw\('sec'|gfMove|gfDelete|gfTogglePid|Delete/.test(h.slice(h.indexOf('id="gd-sheet"'))));
  ok("each box has an id, so a repaint of the app keeps his cursor (_preserveUI)", /id="gd-f-paid"/.test(h) && /id="gd-f-where"/.test(h) && /id="gd-f-paper"/.test(h));
  w.W.gdSet("where", "Garage"); w.W.gdSetDraw("status", "wrapped"); w.W.gdSet("name", "HACKED"); w.W.gdSet("pids", ["k_cal"]); w.W.gdSet("occ", "y"); w.W.gdSet("sec", "special");
  w.W.gdSave();
  const U = w.writes.filter(x => x.op !== "push");
  ok("Save = ONE update on that present", U.length === 1 && U[0].op === "update" && U[0].path === "gifts/items/a", w.writes);
  ok("…with ONLY the fields he changed (status, where) — it moved nowhere", JSON.stringify(Object.keys(U[0].val).sort()) === '["status","where"]' && U[0].val.status === "wrapped" && U[0].val.where === "Garage", U[0].val);
  ok("logged 'Dad: …'", w.logs().length === 1 && /^Dad: Treehouse — 🎀 Wrapped · 📍 Garage$/.test(w.logs()[0]), w.logs());
  const it = w.T.data().items.a; ok("the present is still Ava's, same name / section / holiday", it.name === "Treehouse" && it.pids.join() === "k_ava" && it.occ === "x" && it.sec === "parents");
  w.writes.length = 0; w.W.gdEditItem("a"); w.W.gdSave();
  ok("Save with nothing changed writes nothing", w.writes.length === 0);
  w.W.gdEditItem("a"); w.W.gdSet("paid", "75.50"); w.W.gdSet("paper", ""); w.W.gdSave();
  const U2 = w.writes.filter(x => x.op !== "push");
  ok("paid + cleared paper = ONE update {paid:75.5, paper:null}", U2.length === 1 && U2[0].val.paid === 75.5 && U2[0].val.paper === null && Object.keys(U2[0].val).length === 2, U2);
  ok("every key Dad ever updates is status / where / paper / paid", w.writes.filter(x => x.op === "update").every(x => /^gifts\/items\/[^/]+$/.test(x.path) && Object.keys(x.val).every(k => ["status", "where", "paper", "paid"].indexOf(k) >= 0)));
  w.writes.length = 0; w.W.gdNew("k_ava", "stocking"); h = w.droot.innerHTML;
  ok("＋ sheet: name, that person's sections, status, planned, paid, store, where, paper — no For picker", /New present for Ava/.test(h) && /gdSet\('name'/.test(h) && /gdSetDraw\('sec','special'\)/.test(h) && /gdSet\('plan'/.test(h) && /gdSet\('store'/.test(h) && !/gfTogglePid|gdSet\('pids'/.test(h));
  w.W.gdSave(); ok("no name → nothing saved", w.writes.length === 0 && w.D.edit() !== null);
  w.W.gdSet("name", "Marbles"); w.W.gdSet("plan", "12"); w.W.gdSet("store", "Toy Barn"); w.W.gdSet("pids", ["k_cal"]); w.W.gdSave();
  const S = w.writes.filter(x => x.op === "set");
  ok("＋ = ONE set of a new present, for that person only, this holiday, marked by Dad", S.length === 1 && /^gifts\/items\/[^/]+$/.test(S[0].path) && S[0].val.pids.join() === "k_ava" && S[0].val.occ === "x" && S[0].val.sec === "stocking" && S[0].val.name === "Marbles" && S[0].val.plan === 12 && S[0].val.store === "Toy Barn" && S[0].val.status === "idea" && S[0].val.by === "dad", S);
  ok("…logged 'Dad: added Marbles → Ava'; nothing else written", w.writes.length === 2 && /^Dad: added Marbles → Ava/.test(w.logs()[0]), w.writes.map(x => x.path));
  w.writes.length = 0; w.W.gdEditItem("d"); w.W.gdEditItem("e"); w.W.gdEditItem("g"); w.W.gdEditItem("f"); w.W.gdEditItem("h"); w.W.gdEditItem("i");
  ok("he can't open an unshared person's present, one for Dad, one for no one, or a held one", w.D.edit() === null);
  w.W.gdNew("k_cal", "parents"); w.W.gdNew("p-sam", "gifts"); ok("…or add one for someone not shared as edit", w.D.edit() === null && w.writes.length === 0);
  w.W.gdEditItem("a"); w.W.gdSet("where", "Shed"); w.dadOpen = false; w.W.gdSave();
  ok("locked while a sheet is open → Save writes nothing and the page shows the lock", w.writes.length === 0 && /🔒 Locked/.test(w.droot.innerHTML) && !/Treehouse/.test(w.droot.innerHTML));
  ok("Dad's side never writes share, people, plan, occasions, receipts or the flag", !/gfShareDad|gfDadIs|gfShareGroup/.test(GJS.slice(GJS.indexOf("// ── Dad's side ──"), GJS.indexOf("function gfDadLock"))));
  w.dadOpen = true; w.dry = true; w.W.renderGiftsDad(w.droot, ""); w.W.gdOpen("k_ava"); w.W.gdEditItem("b"); w.W.gdSetDraw("status", "here"); w.W.gdSave();
  ok("?dryrun=1: Dad's Save writes nothing", w.writes.length === 0);
}

console.log("\n# Dad — locking forgets everything on the device");
{
  const w = dadWorld(); w.dadOpen = true; w.W.renderGiftsDad(w.droot, ""); w.W.gdOpen("k_ava");
  w.dadOpen = false; w.W.gfDadLock();
  ok("gfDadLock: the gifts/ listener is turned off and the data dropped", w.offs.join() === "gifts" && Object.keys(w.T.data()).length === 0 && !w.D.on() && !w.D.loaded() && w.D.root() === null && w.D.pid() === null);
  const m = dadWorld(); m.dadOpen = true; m.W.renderGiftsDad(m.droot, ""); m.mom = true; m.dadOpen = false; m.W.gfDadLock();
  ok("…unless Mom is using this device (her own Gifts keeps its listener)", m.offs.length === 0 && Object.keys(m.T.data()).length > 0 && m.D.root() === null);
  const g = dadWorld(); g.dadOpen = true; g.W.renderGiftsDad(g.droot, "");
  ok("Mom's own Gifts page still refuses anyone but Mom", (() => { const r = el("c"); g.W.renderGifts(r, ""); return /Mom only/.test(r.innerHTML) && !/Ava/.test(r.innerHTML); })());
  ok("Home Base reminders still answer [] off Mom's side", g.W.giftNowLines().length === 0);
}

// ── index.html ────────────────────────────────────────────────────────────────
const blk = name => { const a = src.indexOf("// " + name + "_START"), b = src.indexOf("// " + name + "_END"); if (a < 0 || b < a) throw new Error("missing block " + name); return src.slice(a, b); };
const fn = name => { const i = src.indexOf("\nfunction " + name + "("); if (i < 0) throw new Error("missing " + name); const eol = src.indexOf("\n", i + 1), line = src.slice(i + 1, eol);
  if (line.split("{").length === line.split("}").length) return line; return src.slice(i + 1, src.indexOf("\n}", i + 1) + 2); };
const DB = blk("GIFTS_DAD");
function iworld(o) {
  o = o || {};
  const w = { refs: [], loads: 0, locks: 0, intervals: 0, touts: [], clearedT: [], obs: [], disc: 0, handlers: {}, LS: {}, flagCb: null, soon: 0, now: 1000000 };
  const root = { innerHTML: "" }, pins = {};
  const document = { hidden: false,
    getElementById(id) { if (id === "content") return root; if (root.innerHTML.indexOf('id="' + id + '"') < 0) return null; return pins[id] || (pins[id] = { id, value: "", textContent: "", focus() {} }); },
    addEventListener(ev, f) { (w.handlers[ev] = w.handlers[ev] || []).push(f); } };
  const db = { ref(p) { w.refs.push(p); return { on(ev, cb) { if (p === "giftShare") w.flagCb = cb; } }; } };
  const FakeDate = { now: () => w.now };
  const ctx = { console, JSON, Object, Math, String, Date: FakeDate, document, db, root, pins,
    HA_LS: { getItem: k => (k in w.LS ? w.LS[k] : null), setItem: (k, v) => { w.LS[k] = String(v); }, removeItem: k => { delete w.LS[k]; } },
    setInterval: () => { w.intervals++; return 1; }, clearInterval: () => {}, setTimeout: (f, ms) => { w.touts.push({ f, ms }); return w.touts.length; }, clearTimeout: id => { w.clearedT.push(id); },
    MutationObserver: function (cb) { const o = { cb, on: false }; w.obs.push(o); this.observe = () => { o.on = true; }; this.disconnect = () => { o.on = false; w.disc++; }; },
    renderAllSoon: () => { w.soon++; }, giftsLoad: () => { w.loads++; }, momHere: () => !!o.mom, _kioskD: () => !!o.kiosk, dadUnlocked: !!o.star,
    addEventListener(ev, f) { (w.handlers[ev] = w.handlers[ev] || []).push(f); } };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext('var tab="moms-plan", mpSubView="dad", momSchedView=false, DAD_PIN="4321", ADMIN_PIN="", APP_PIN="9999";\n' +
    "function mpGoto(v){ mpSubView=v; renderMomsPlan(root); }\nfunction renderMomsPlan(el){ if(mpSubView==='dadgifts') renderDadGifts(el); else el.innerHTML='<div>Dad day '+giftDadEntryHTML()+'</div>'; }\n" +
    [fn("_pinStr"), fn("_adminPinOk"), fn("pinOk"), fn("dadPinOk")].join("\n") + "\n" + DB, ctx);
  w.c = ctx; w.root = root; w.run = code => vm.runInContext(code, ctx);
  w.type = v => { const i = document.getElementById("gd-pin"); i.value = v; ctx.giftDadTry(); };
  w.err = () => (pins["gd-pin-err"] || {}).textContent || "";
  w.mut = () => { const o = w.obs[w.obs.length - 1]; if (o && o.on) o.cb(); };   // #content was redrawn
  w.tap = () => { w.handlers.pointerdown[0](); };
  w.idleFire = () => { const id = w.touts.length; if (w.clearedT.indexOf(id) < 0) w.touts[id - 1].f(); };   // the live 5-minute timeout runs out
  return w;
}

console.log("\n# index.html — the entry on Dad's Day");
{
  ok("index.html never reads gifts/ itself (no db.ref(\"gifts…))", !/db\.ref\(\s*["'`]gifts/.test(src));
  ok("…the only node the Dad block reads is the no-names flag giftShare", (DB.match(/db\.ref\([^)]*\)/g) || []).join() === 'db.ref("giftShare")');
  ok("the Dad block writes nothing", !/\.(set|update|remove|push)\(/.test(DB));
  const w = iworld();
  ok("nothing shared → no entry at all", w.c.giftDadEntryHTML() === "" && w.refs.join() === "giftShare");
  w.flagCb({ val: () => null }); ok("flag empty → still no entry", w.c.giftDadEntryHTML() === "" && w.soon === 0);
  w.flagCb({ val: () => ({ "lucys-birthday-2027": true }) });
  const e = w.c.giftDadEntryHTML();
  ok("Mom shared something → Dad's Day repaints and shows '🎁 Gifts 🔒'", w.soon === 1 && />🎁 Gifts 🔒</.test(e) && /mpGoto\('dadgifts'\)/.test(e));
  ok("…with no name, no holiday and no count in it", !/lucy|birthday|2027|\d+ (present|people|person)/i.test(e) && e.replace(/<[^>]*>/g, "").trim() === "🎁 Gifts 🔒›", e.replace(/<[^>]*>/g, ""));
  ok("the flag listener starts once", (w.c.giftDadEntryHTML(), w.refs.length === 1));
  w.flagCb({ val: () => ({ x: false }) }); ok("a flag that isn't true doesn't count", w.c.giftDadEntryHTML() === "");
  const dd = fn("renderDadsDay");
  ok("renderDadsDay draws the entry at the top of his column, guarded", /h\+='<div class="ss-col ss-col-dad"[^\n]*\n  try\{ if\(typeof giftDadEntryHTML==="function"\) h\+=giftDadEntryHTML\(\); \}catch\(e\)\{\}/.test(dd));
}

console.log("\n# index.html — the lock: Dad's code, every visit");
{
  let w = iworld({ kiosk: true, star: true, mom: true }); w.c.mpGoto("dadgifts");
  ok("opening the page shows the lock — on his kiosk link, with Star controls open and Mom mode on", /id="gd-pin"/.test(w.root.innerHTML) && !/gd-page/.test(w.root.innerHTML) && w.loads === 0 && !w.c.giftDadOpen());
  ok("nothing was read to draw it (no db.ref at all)", w.refs.length === 0);
  w = iworld(); w.c.mpGoto("dadgifts");
  w.type("1111"); ok("wrong code → still locked, gifts.js not loaded", !w.c.giftDadOpen() && w.loads === 0 && /Not right/.test(w.err()) && /id="gd-pin"/.test(w.root.innerHTML));
  w.type("9999"); ok("Mom's own code is not Dad's code here", !w.c.giftDadOpen() && w.loads === 0);
  w.type("4321");
  ok("Dad's code → open: gifts.js is asked for (once), the page holds #gd-page", w.c.giftDadOpen() && w.loads === 1 && /id="gd-page"/.test(w.root.innerHTML) && !/id="gd-pin"/.test(w.root.innerHTML));
  ok("…the watch starts with NO clock ticking: one 5-minute timeout + an observer on #content; the try count is cleared", w.intervals === 0 && w.touts.length === 1 && w.touts[0].ms === 5 * 60 * 1000 && w.obs.length === 1 && w.obs[0].on && !("ha_gd_try" in w.LS));
  ok("the Dad block has no setInterval at all (PERF_BUDGET)", !/setInterval\(/.test(DB));
  ok("the top row offers 🔒 Lock · ← Dad's Day", /giftDadBack\(\)[^>]*>🔒 Lock · /.test(w.root.innerHTML));
  let calls = 0; w.c.renderGiftsDad = (el, top) => { calls++; el.innerHTML = top + '<div id="gd-page">LIST</div>'; }; w.c.renderMomsPlan(w.root);
  ok("once gifts.js is in, the page hands off to renderGiftsDad", calls === 1 && /LIST/.test(w.root.innerHTML) && w.loads === 1);
  w.c.gfDadLock = () => { w.locks++; };
  w.mut(); w.tap(); ok("still on the page → a redraw or a tap leaves it open", w.c.giftDadOpen() && w.locks === 0);
  w.run('mpSubView="dad"'); ok("giftDadOpen() is false the moment another page is the route", !w.c.giftDadOpen());
  w.mut(); ok("…and the redraw locks it (gifts.js told to forget) and the watch stops", w.locks === 1 && w.disc === 1 && !w.run("giftDadIn") && w.clearedT.indexOf(w.touts.length) >= 0);
  w.c.mpGoto("dadgifts"); ok("coming back asks for the code again", /id="gd-pin"/.test(w.root.innerHTML) && !/LIST/.test(w.root.innerHTML));
  w.type("4321"); ok("code again → open again", w.c.giftDadOpen() && /LIST/.test(w.root.innerHTML));
  w.run('tab="kids"'); w.mut(); ok("another tab drawn → locked", !w.run("giftDadIn") && w.locks === 2); w.run('tab="moms-plan"');
  w.c.mpGoto("dadgifts"); w.type("4321"); w.root.innerHTML = "<div>something else drew here</div>"; w.mut();
  ok("anything else drawn in its place → locked", !w.run("giftDadIn") && w.locks === 3);
  w.c.mpGoto("dadgifts"); w.type("4321"); w.root.innerHTML = "<div>something else drew here</div>"; w.tap();
  ok("…and even with no redraw seen, the next tap anywhere locks it", !w.run("giftDadIn") && w.locks === 4);
  w.c.mpGoto("dadgifts"); w.type("4321"); const t0 = w.touts.length; w.tap();
  ok("a tap restarts the 5 quiet minutes (the old timeout is dropped, one new one)", w.c.giftDadOpen() && w.touts.length === t0 + 1 && w.clearedT.indexOf(t0) >= 0 && w.touts[t0].ms === 5 * 60 * 1000);
  w.idleFire();
  ok("5 quiet minutes → locked, and the lock screen is what's left", !w.run("giftDadIn") && /id="gd-pin"/.test(w.root.innerHTML));
  w.type("4321"); w.c.document.hidden = true; w.handlers.visibilitychange[0]();
  ok("the screen sleeps / app hidden → locked, and the lock screen is what's left", !w.run("giftDadIn") && /id="gd-pin"/.test(w.root.innerHTML)); w.c.document.hidden = false;
  ok("the tap / key / sleep handlers are wired once, however many visits", w.handlers.pointerdown.length === 1 && w.handlers.visibilitychange.length === 1);
  w.type("4321"); const l0 = w.locks; w.c.giftDadBack();
  ok("← Dad's Day locks at once and goes back to Dad's Day", !w.run("giftDadIn") && w.locks === l0 + 1 && w.run("mpSubView") === "dad" && /Dad day/.test(w.root.innerHTML));
  w.c.mpGoto("dadgifts"); w.type("4321"); w.run('mpSubView="dad"'); w.c.renderMomsPlan(w.root);
  ok("Dad's Day drawing while it was open locks it too", !w.run("giftDadIn"));
}
{
  const w = iworld(); w.c.mpGoto("dadgifts");
  for (let k = 0; k < 4; k++) w.type("000" + k);
  ok("4 wrong tries: still 'try again'", /Not right/.test(w.err()) && JSON.parse(w.LS.ha_gd_try).n === 4);
  w.type("0004"); ok("the 5th wrong try → a one-minute wait", /Too many tries/.test(w.err()) && JSON.parse(w.LS.ha_gd_try).until === w.now + 60000);
  w.type("4321"); ok("…during it even the right code is refused", !w.c.giftDadOpen() && w.loads === 0 && /Too many tries/.test(w.err()));
  const w2 = iworld(); w2.LS.ha_gd_try = w.LS.ha_gd_try; w2.c.mpGoto("dadgifts"); w2.type("4321");
  ok("…and a reload doesn't reset the wait (kept on the device)", !w2.c.giftDadOpen());
  w.now += 60001; w.type("4321"); ok("after the minute the right code opens it", w.c.giftDadOpen());
  const n = iworld(); n.run('DAD_PIN=""'); n.c.mpGoto("dadgifts"); n.type("0726");
  ok("no Dad code set → it can't be opened", !n.c.giftDadOpen() && /hasn't set a Dad code/.test(n.err()));
}

console.log("\n# index.html — routes");
{
  ok("'dadgifts' routes to renderDadGifts", /if\(mpSubView==='dadgifts'\)\{ return renderDadGifts\(el\); \}/.test(fn("renderMomsPlanView")));
  ok("it is on Dad's side of the Mom gate (its own lock does the work)", /if\(mpSubView==='dadgifts'\) return true;/.test(fn("momGateOpen")));
  ok("'dadgifts' is not a Today page (SS_OTHER_VIEWS); 'gifts' is still last", (() => { const l = JSON.parse(src.match(/const SS_OTHER_VIEWS=(\[[^\]]*\])/)[1]); return l.indexOf("dadgifts") >= 0 && l[l.length - 1] === "gifts"; })());
  const GB = blk("GIFTS");
  ok("still ONE gifts.js loader; it repaints Dad's page when the file arrives", (GB.match(/createElement\("script"\)/g) || []).length === 1 && !/createElement\("script"\)/.test(DB) && /mpSubView==="gifts"\|\|mpSubView==="dadgifts"\|\|giftHomeBase\(\)/.test(GB));
  ok("Mom's Gifts page still checks Mom before it loads anything", GB.indexOf("momHere()") > 0 && GB.indexOf("momHere()") < GB.indexOf('createElement("script")'));
  ok("the lock is checked before the loader is ever called", DB.indexOf("if(!giftDadIn){") > 0 && DB.indexOf("if(!giftDadIn){") < DB.indexOf("giftsLoad("));
}

console.log("\n# both files together — no gifts/ read until the code");
{
  const w = iworld(); const listens = [], writes = [];
  const gdb = { ref(p) { w.refs.push(p); return { on(ev, cb) { listens.push(p); if (p === "giftShare") w.flagCb = cb; }, off() {}, set(v) { writes.push(p); }, update() { writes.push(p); }, remove() { writes.push(p); }, push() { writes.push(p); } }; } };
  w.c.db = gdb; w.c._todayStr = () => "2026-11-20"; w.c._dryRun = () => false; w.c.gwShowToast = () => {};
  w.c.document.createElement = t => el(t); w.c.document.head = { appendChild() {} };
  vm.runInContext(ROSTER, w.c);
  w.c.giftsLoad = () => { w.loads++; vm.runInContext(GJS, w.c); w.c.renderMomsPlan(w.root); };
  vm.runInContext(GJS, w.c);   // even with gifts.js already on the device…
  w.c.mpGoto("dadgifts");
  ok("gifts.js present + page open + no code → no gifts/ listener", listens.indexOf("gifts") < 0 && /id="gd-pin"/.test(w.root.innerHTML));
  w.c.renderGiftsDad(w.root, ""); ok("…calling renderGiftsDad directly changes nothing", listens.indexOf("gifts") < 0 && !/gd-page/.test(w.root.innerHTML));
  w.c.mpGoto("dadgifts"); w.type("0000"); ok("wrong code → still none", listens.indexOf("gifts") < 0);
  w.type("4321"); ok("right code → gifts.js starts the one gifts/ listener", listens.filter(p => p === "gifts").length === 1 && /id="gd-page"/.test(w.root.innerHTML));
  ok("opening and looking wrote nothing", writes.length === 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
