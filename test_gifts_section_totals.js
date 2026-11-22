/*
 * Node tests for 🎁 Gifts — SECTOTALS (a mom's ask 2026-11-22: "where it says what you have spent on each kids could it separate it
 * to the categories? … so I can see which category is low … on the overview page too"):
 *   · People: under each person's row, one small chip per section they have, in section order — paid, +still to buy, / budget
 *   · shared presents count by share; returned/dropped don't count; a per-section budget goes red when over
 *   · an empty section shows $0 (if the person has anything at all); nothing at all → no chips; one-section group → no chips
 *   · the row is still ONE button that opens the person; drawing writes nothing
 *
 *   run:  node test_gifts_section_totals.js
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
vm.runInContext("const ROSTER_DEF=[{id:'ava',name:'Ava',color:'#2563eb'},{id:'ben',name:'Ben',color:'#16a34a'},{id:'cal',name:'Cal',color:'#9333ea'}];", ctx);   // generic names
const SRC = fs.readFileSync(path.join(__dirname, "gifts.js"), "utf8");
vm.runInContext(SRC, ctx);
const T = ctx._gfTest, W = ctx;
const reset = d => { writes.length = 0; T.setData(d || {}); T.reset(); for (const k in LS) delete LS[k]; T.setRoot(root, "<nav/>"); };

const D = () => ({
  occasions: { x: { name: "Christmas 2026", kind: "christmas", date: "2026-12-25",
    secs: { special: { name: "Special", emoji: "⭐", order: 0 }, parents: { name: "From Mom & Dad", emoji: "🎁", order: 1 }, stocking: { name: "Stocking", emoji: "🧦", order: 2 } } } },
  groups: { house: { name: "Our house", emoji: "👥", order: 52 } },
  people: { "p-pat": { name: "Pat", group: "house", ts: 1 } },
  plan: { x: { k_ava: { budget: 300, sec: { stocking: 20, special: 100 } } } },
  items: {
    a: { occ: "x", pids: ["k_ava"], sec: "stocking", name: "Socks", status: "here", paid: 15 },
    b: { occ: "x", pids: ["k_ava"], sec: "stocking", name: "Candy", status: "idea", plan: 10 },
    c: { occ: "x", pids: ["k_ava", "k_ben"], sec: "special", name: "Trampoline", status: "ordered", paid: 300 },
    d: { occ: "x", pids: ["k_ava"], sec: "parents", name: "Old pick", status: "returned", paid: 50 },
    e: { occ: "x", pids: ["p-pat"], sec: "gifts", name: "Watch", status: "here", paid: 40 } } });

// the row (button) for one person, and its chips line
const rowOf = (h, pid) => { const m = h.match(new RegExp('<button class="gf-prow" onclick="gfOpenPerson\\(\'' + pid + '\'\\)">([\\s\\S]*?)</button>')); return m ? m[1] : null; };
const chipsOf = row => { const m = row && row.match(/<span class="gf-secs">([\s\S]*?)<\/span><\/span><span class="gf-amt">/); return m ? m[1] : null; };
const chipList = c => (c || "").split('<span class="gf-sc">').slice(1).map(x => x.replace(/<\/span>$/, "").replace(/<[^>]+>/g, ""));

console.log("\n# chips per section, in order, right amounts");
{
  reset(D()); W.renderGifts(root, "<nav/>"); const h = root.innerHTML;
  const ra = rowOf(h, "k_ava"), ca = chipList(chipsOf(ra));
  ok("Ava's row has a chips line", !!chipsOf(ra), ra);
  ok("three chips, section order: ⭐ Special · 🎁 From Mom & Dad · 🧦 Stocking", ca.length === 3 && /^⭐ Special/.test(ca[0]) && /^🎁 From Mom &amp; Dad/.test(ca[1]) && /^🧦 Stocking/.test(ca[2]), ca);
  ok("Stocking: $15 paid +$10 to buy / $20 budget", ca[2] === "🧦 Stocking $15 +$10 to buy / $20", ca[2]);
  ok("shared trampoline split in two: Special $150 / $100", ca[0] === "⭐ Special $150 / $100", ca[0]);
  ok("returned present not counted: From Mom & Dad $0 (empty section still shows)", ca[1] === "🎁 From Mom &amp; Dad $0", ca[1]);
  ok("over budget is red (Special $150 > $100; Stocking $25 > $20)", /⭐ Special <b>\$150<\/b> <b style="color:#dc2626">\/ \$100<\/b>/.test(ra) && /🧦 Stocking <b>\$15<\/b> \+\$10 to buy <b style="color:#dc2626">\/ \$20<\/b>/.test(ra), ra);
  const rb = rowOf(h, "k_ben"), cb = chipList(chipsOf(rb));
  ok("Ben (only a shared present, no budgets): Special $150, the others $0", cb.join(" | ") === "⭐ Special $150 | 🎁 From Mom &amp; Dad $0 | 🧦 Stocking $0", cb);
  const rc = rowOf(h, "k_cal");
  ok("Cal has nothing → 'nothing yet' and NO chips line", /nothing yet/.test(rc) && !/gf-secs/.test(rc), rc);
  ok("the whole row is still ONE button that opens the person", (ra.match(/<button/g) || []).length === 0 && /gf-sc/.test(ra));
  ok("the row's own total is unchanged (Ava $165 paid / $300)", /<span class="gf-amt">\$165<small> \/ \$300<\/small><\/span>/.test(ra), ra);
  W.gfOpenPerson("k_ava");
  ok("tapping the row opens Ava's page", T.view() === "person" && /Ava · Christmas 2026/.test(root.innerHTML));
  ok("nothing was written by drawing", writes.length === 0, writes);
}

console.log("\n# budget under → green; budget only → chips at $0");
{
  const d = D(); d.plan.x.k_cal = { sec: { stocking: 30 } }; d.plan.x.k_ava.sec.special = 200;
  reset(d); W.renderGifts(root, "<nav/>"); const h = root.innerHTML;
  ok("under budget is green (Special $150 / $200)", /⭐ Special <b>\$150<\/b> <b style="color:#16a34a">\/ \$200<\/b>/.test(rowOf(h, "k_ava")));
  const cc = chipList(chipsOf(rowOf(h, "k_cal")));
  ok("Cal: no presents but a Stocking budget → chips, all $0", cc.join(" | ") === "⭐ Special $0 | 🎁 From Mom &amp; Dad $0 | 🧦 Stocking $0 / $30", cc);
  ok("nothing written", writes.length === 0, writes);
}

console.log("\n# a present outside the person's sections → 📦 No section chip (like their page)");
{
  const d = D(); d.items.f = { occ: "x", pids: ["k_ben"], sec: "gone", name: "Kite", status: "idea", plan: 12 };
  reset(d); W.renderGifts(root, "<nav/>");
  const cb = chipList(chipsOf(rowOf(root.innerHTML, "k_ben")));
  ok("Ben: 📦 No section +$12 to buy, last", cb[cb.length - 1] === "📦 No section $0 +$12 to buy" && cb.length === 4, cb);
  ok("Ava (all in sections): no 📦 chip", !/No section/.test(rowOf(root.innerHTML, "k_ava")));
}

console.log("\n# one-section group → no chips line");
{
  reset(D()); W.renderGifts(root, "<nav/>"); W.gfGroup("house"); const h = root.innerHTML;
  const rp = rowOf(h, "p-pat");
  ok("Pat's row is there with $40", !!rp && /\$40/.test(rp));
  ok("…but no chips line (only 🎁 Gifts)", !/gf-secs/.test(rp), rp);
  const d = D(); d.groups.house.secs = { a: { name: "Big", emoji: "🎁", order: 0 }, b: { name: "Small", emoji: "🧦", order: 1 } }; d.items.e.sec = "b";
  reset(d); W.renderGifts(root, "<nav/>"); W.gfGroup("house");
  const cp = chipList(chipsOf(rowOf(root.innerHTML, "p-pat")));
  ok("a group with two sections of its own → its own sections as chips", cp.join(" | ") === "🎁 Big $0 | 🧦 Small $40", cp);
  ok("nothing written", writes.length === 0, writes);
}

console.log("\n# no presents at all → nothing changes");
{
  const d = D(); d.items = {}; d.plan = {};
  reset(d); W.renderGifts(root, "<nav/>");
  ok("no chips anywhere", !/gf-secs/.test(root.innerHTML));
  ok("CSS for the chips is in gifts.js's style block", /\.gf-secs\{/.test(SRC) && /\.gf-sc\{/.test(SRC));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
