/*
 * test_ledger_giveback.js — ⭐ Give stars back on a 📒 Ledger row, slice L2 of DESIGN_chore_ledger_2026-11-21 (§3; her "go" 2026-11-21).
 * Her words: "adjust if there was mistakes and say like, no, let's don't take that away for this one". A row whose tick paid less than
 * the chore's stars because it was late gets ⭐ Give stars back: one plus line in the kid's Star Bank, a fixed name per kid + chore +
 * day (bank/<kid>/adjustments/lgb_<wk>_<day>_<kid>_<a|c|e>step<i>), Undo removes it, an un-tick on a list takes it away with the tick.
 * The WHOLE app runs per device (test_fixtures/house_world.js) on a made-up family (kid_a … kid_d), the clock moved day by day from
 * Mon 11/16 (day 0) to Mon 11/30 (day 14):
 *   kid_a  🌅 Brush teeth (daily, 0 ⭐) · Feed the rabbit (Mon Wed Fri, 15)
 *          🧹 Make the bed (daily 2) · Vacuum the den (Tue 10) · Dust the shelves (Wed 10) · Water the fern (Tue, 0 ⭐) · Wash the car (Sun 10)
 *   kid_b  🧹 Sweep the porch (Tue 6), Mom checks before pay   ·   kid_c  🧹 Toys in the bin (daily 3)   ·   kid_d  nothing
 * Week 1 (before the falling stars' blank slate 11/22): every row on its day, but the vacuum (Tue 11/17) ticked Thu 11/19, in full.
 * Week 2: Sun 11/22 the car on its day; Tue 11/24 the vacuum, the fern and the porch missed; Wed the fern ticked (0 ⭐) and the bed
 * not made; Thu the vacuum ticked (6 of 10) and the porch ticked (4 of 6, held). Week 3: Sun 11/29 the car missed, Mon 11/30 ticked (8 of 10).
 * Checks: A while nobody taps it, every screen, the pop-up (but the button) and the whole database = the app before, every day ·
 * B the button only on rows that fell short · C one tap = one bank line of the missing stars, the totals · D a second tap, a second
 * device, two devices at once: still one line · E Undo removes exactly that line · F last week · G un-tick after a give-back (the
 * kid's own, Mom's) leaves nothing behind · H a kid's device and a kiosk cannot · I dryrun writes nothing · J Dad's link.
 * "The app before" = THIS tree with L2 taken out (no git, no pinned commit): house.js minus the LEDGERGB block and its three hooks in
 * LEDGERVIEW, index.html minus the one LEDGERGB line in toggleRtStep (each must match exactly once, or the test stops).
 * LGB_INDEX / LGB_HJS = other copies of index.html / house.js (a mutation check).   run: node test_ledger_giveback.js
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os");
const W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 900) + ")" : "")); } };
const J = x => JSON.stringify(x), clone = x => JSON.parse(J(x));
const IDX = process.env.LGB_INDEX || path.join(__dirname, "index.html"), HJS = fs.readFileSync(process.env.LGB_HJS || path.join(__dirname, "house.js"), "utf8");

// ── the app before: this tree, L2 taken out ──
const once = (src, what, from, to, label) => { const n = typeof from === "string" ? src.split(from).length - 1 : (src.match(from) || []).length;
  if (n !== 1) throw new Error("test_ledger_giveback: the app before cannot be built — " + label + " found " + n + "× in " + what + " (must be exactly once)"); return src.replace(from, to); };
const BASE_IDX = (() => { let s = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  s = once(s, "index.html", /^ {4}if\(!now&&typeof bank!=="undefined"&&bank&&bank\[kid\]&&bank\[kid\]\.adjustments&&bank\[kid\]\.adjustments\["lgb_"\+sk\]\) bankDirectRemove\(kid,"lgb_"\+sk\);[^\n]*LEDGERGB[^\n]*\n/m, "", "the un-tick line");
  if (/LEDGERGB|"lgb_"/.test(s)) throw new Error("test_ledger_giveback: the app before still mentions LEDGERGB");
  const t = path.join(os.tmpdir(), "ledger_gb_before_" + process.pid + ".html"); fs.writeFileSync(t, s); return t; })();
const BASE_HJS = (() => { let s = fs.readFileSync(path.join(__dirname, "house.js"), "utf8");
  s = once(s, "house.js", /^\/\/ LEDGERGB_START[^\n]*\n[\s\S]*?^\/\/ LEDGERGB_END\n/m, "", "the LEDGERGB block");
  s = once(s, "house.js", /^ {4}if\(typeof lgGbRow==="function"\) lgGbRow\(r,slot,kid,D,i,st,E,p,full\);[^\n]*\n/m, "", "the lgRow hook");
  s = once(s, "house.js", "out.earned+=(r.pts||0)+(r.gb||0);", "out.earned+=r.pts||0;", "the totals hook");
  s = once(s, "house.js", "+(r.gbH||'')+'</div>'; }", "+'</div>'; }", "the row hook");
  if (/lgGb|LEDGERGB|r\.gb/.test(s)) throw new Error("test_ledger_giveback: the app before's house.js still mentions LEDGERGB");
  return s; })();
console.log("(the app before: this tree with LEDGERGB taken out of house.js and index.html)");

const K = o => Object.assign({ src: { kind: "routine" }, status: "active", area: "cleaning", verdict: "", note: "", level: 1, minutes: 5 }, o);
const FAM = () => ({
  a_teeth: K({ label: "Brush teeth", emoji: "🪥", who: "kid_a", slot: "morning", cad: "daily", area: "health", order: 0 }),
  a_rabbit: K({ label: "Feed the rabbit", emoji: "🐇", who: "kid_a", slot: "morning", cad: "wk:0,2,4", pts: 15, area: "animals", order: 1 }),
  a_bed: K({ label: "Make the bed", emoji: "🛏", who: "kid_a", slot: "chores", cad: "daily", pts: 2, order: 1 }),
  a_vac: K({ label: "Vacuum the den", emoji: "🧹", who: "kid_a", slot: "chores", cad: "wk:1", pts: 10, order: 2 }),
  a_dust: K({ label: "Dust the shelves", emoji: "🪶", who: "kid_a", slot: "chores", cad: "wk:2", pts: 10, order: 3 }),
  a_fern: K({ label: "Water the fern", emoji: "🌿", who: "kid_a", slot: "chores", cad: "wk:1", order: 4 }),
  a_car: K({ label: "Wash the car", emoji: "🚗", who: "kid_a", slot: "chores", cad: "wk:6", pts: 10, order: 5 }),
  b_porch: K({ label: "Sweep the porch", emoji: "🧺", who: "kid_b", slot: "chores", cad: "wk:1", pts: 6, order: 0 }),
  c_toys: K({ label: "Toys in the bin", emoji: "🧩", who: "kid_c", slot: "chores", cad: "daily", pts: 3, order: 0 })
});
const dOf = n => new Date(2026, 10, 16 + n);
const go = (w, n, h, mi) => { const d = dOf(n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h, mi || 0); };
async function mkWorld(index, hjs) {
  const w = await W.world({ index, household: { jobs: FAM(), people: clone(W.PEOPLE), meta: { takeover: 1, engine: { mode: "preview", on: "2026-11-09" } } }, tree: { config: Object.assign(clone(W.FX.db.config), { choreVerify: { kid_b: true } }) } });
  const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"), Dd = w.boot("D", "devD"), Kk = w.boot("Kk", "devK");
  Dd.run("HA_LS.setItem('ha_kiosk','dad');1"); Kk.run("HA_LS.setItem('ha_kiosk','routines');1");
  for (const d of [A, B, Dd, Kk]) d.run("globalThis.__pop='';document.body.insertAdjacentHTML=function(p,h){ globalThis.__pop=h; };tab='moms-plan';1");
  await w.flush(); return { w, A, B, Dd, Kk, hjs };
}
const idxOf = (d, slot, kid, label) => d.run("(function(){ day=_todayDay; return (rtStepsFor('" + slot + "','" + kid + "',false,day)||[]).findIndex(function(x){ return x&&x.label.indexOf(" + J(label) + ")===0&&x.cad!=='none'; }); })()");
const tick = (d, slot, kid, label) => { const i = idxOf(d, slot, kid, label); if (i < 0) return -1; d.run("(function(){ day=_todayDay; " + (slot === "morning" ? "toggleMorningStep('" + kid + "'," + i + ")" : "toggleRtStep('" + slot + "','" + kid + "'," + i + ")") + "; })()"); return i; };
const loadH = (d, hjs) => { if (d.run("typeof lgShow") !== "function") d.run(hjs); };
const LG = (d, js) => d.run("(function(){ __pop=''; " + js + "; return __pop; })()");
const txt = h => String(h || "").replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const rowsH = h => String(h).split('<div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 8px;padding:5px 2px;').slice(1).map(r => '<div ' + r.split("</div>")[0]);
const rowT = (h, name) => txt(rowsH(h).filter(r => r.indexOf(name) >= 0)[0] || "");
const top = h => txt((/<div style="font-size:13\.5px;padding:6px 2px 2px">([\s\S]*?)<\/div>/.exec(h) || ["", ""])[1]);
const GIVE = /<button onclick="lgGive\('[^']*','[^']*','[^']*','[^']*',\d+\)" title="[^"]*" style="[^"]*">⭐ Give stars back<\/button>/g;
const adj = (w, kid) => (((w.db.tree.root.bank || {})[kid] || {}).adjustments) || {};
const gbLines = (w, kid) => Object.keys(adj(w, kid)).filter(k => /^lgb_/.test(k));
const writes = (w, m) => w.since(m).filter(e => !/^(get|once|on|read)/.test(String(e.op || e[0] || "")));
const kidLists = d => JSON.parse(d.run("(function(){ const d0=day, o={}; day=_todayDay; try{ ROSTER.forEach(function(k){ ['afternoon','chores','evening'].forEach(function(s){ rtOpen={}; o[k+s]=rtSlotHTML(s,k); }); o[k+'morning']=mrIndividualHTML(k); }); } finally{ day=d0; } return JSON.stringify(o); })()"));
const page = (d, f) => { d.run("globalThis.__el={innerHTML:'',style:{},appendChild(){},querySelector(){ return null; },querySelectorAll(){ return []; }};1"); try { d.run(f + "(__el);1"); } catch (e) { return "threw " + e.message; } return d.run("__el.innerHTML"); };
const bal = (d, kid) => d.run("bankBalance(" + J(kid) + ")");

(async () => {
const X = await mkWorld(IDX, HJS), BW = await mkWorld(BASE_IDX, BASE_HJS);
const { w, A, B, Dd, Kk } = X;
const S = { same: [], pop: [], gives: {}, notes: {} };
const daily = (B, n, dow) => { tick(B, "morning", "kid_a", "Brush teeth"); if ([0, 2, 4].includes(dow)) tick(B, "morning", "kid_a", "Feed the rabbit"); if (n !== 9) tick(B, "chores", "kid_a", "Make the bed"); tick(B, "chores", "kid_c", "Toys in the bin"); };
// every kid's pop-up, Today and This week, and (Mon 11/30) last week's Thursday — the ledger's own drawing, house.js loaded
const pops = (V, n) => { loadH(V.A, V.hjs); const o = {}; ["kid_a", "kid_b", "kid_c", "kid_d"].forEach(k => { o[k + "day"] = LG(V.A, "lgGo('" + k + "',0,0)"); o[k + "week"] = LG(V.A, "lgGo('" + k + "',0,1)"); if (n >= 13) o[k + "thu"] = LG(V.A, "lgGo('" + k + "',-" + (n - 10) + ",0)"); if (n >= 13) o[k + "lastwk"] = LG(V.A, "lgGo('" + k + "',-" + (n - 10) + ",1)"); }); V.A.run("lgClose();1"); return o; };
for (let n = 0; n <= 14; n++) {
  for (const V of [X, BW]) {
    const { w, A, B } = V, dow = (dOf(n).getDay() + 6) % 7;   // 0 = Monday
    await go(w, n, 8); daily(B, n, dow); await w.flush();
    await go(w, n, 16);
    if (n < 6) { if (dow === 2) tick(B, "chores", "kid_a", "Dust the shelves"); if (dow === 1) { tick(B, "chores", "kid_a", "Water the fern"); tick(B, "chores", "kid_b", "Sweep the porch"); } if (dow === 3) tick(B, "chores", "kid_a", "Vacuum the den"); }
    if (n === 6) tick(B, "chores", "kid_a", "Wash the car");
    if (n === 9) { tick(B, "chores", "kid_a", "Dust the shelves"); tick(B, "chores", "kid_a", "Water the fern"); }
    if (n === 10) { tick(B, "chores", "kid_a", "Vacuum the den"); tick(B, "chores", "kid_b", "Sweep the porch"); }
    if (n === 14) tick(B, "chores", "kid_a", "Wash the car");
    await w.flush(); await go(w, n, 18);
    B.run("(function(){ day=_todayDay; ['chores','afternoon','evening'].forEach(function(s){ ROSTER.forEach(function(k){ rtOpen={}; rtSlotHTML(s,k); }); }); })()");
    A.run("haMomOn();tab='moms-plan';1"); A.run("mdCardKidsToday(mdTodayName(),true,true)"); await w.flush();
  }
  // A · nobody taps it: everything = the app before
  const scr = V => { const o = { lists: kidLists(V.B) }; V.A.run("haMomOn();tab='moms-plan';1"); o.momsDay = page(V.A, "renderMomsPlan"); o.dadsDay = page(V.Dd, "renderDadsDay"); V.B.run("kcKid='kid_a';1"); o.corner = page(V.B, "renderKidsCorner");
    o.bank = V.A.run("JSON.stringify(ROSTER.map(function(k){ return [bankBalance(k),bankLedger(k).length]; }))"); o.log = V.A.run("chSettingsClickoffLogHTML()"); return o; };
  const a = scr(X), b = scr(BW), diff = Object.keys(a).filter(k => J(a[k]) !== J(b[k]));
  const pa = pops(X, n), pb = pops(BW, n), btn = {}, pd = Object.keys(pa).filter(k => { btn[k] = (pa[k].match(GIVE) || []).length; return pa[k].replace(GIVE, "") !== pb[k]; });
  S.same.push([n, diff, J(w.db.tree.root) === J(BW.w.db.tree.root), w.db.log.length === BW.w.db.log.length]);
  S.pop.push([n, pd, btn, pd.length ? [pa[pd[0]].slice(0, 200), pb[pd[0]].slice(0, 200)] : null]);
  if (n === 3) S.notes.wk1 = pa.kid_aday;
  if (n === 10) { S.notes.thu = pa.kid_aday; S.notes.thuB = pa.kid_bday; }
}
A.run("lgClose();1");

// ── A ──
console.log("\n── A · while nobody taps it: every screen, the pop-up and the database = the app before, every day ──");
ok("15 days: the kids' lists (every list, every kid, Morning too), Mom's Day, Dad's Day, Kids' Corner, the Star Bank, the Click-off Log = the app before, byte for byte", S.same.every(s => s[1].length === 0), S.same.filter(s => s[1].length));
ok("…and the whole database and the number of writes = the app before, every day (the un-tick line writes nothing when there is no give-back)", S.same.every(s => s[2] && s[3]), S.same.filter(s => !(s[2] && s[3])));
ok("the 📒 pop-up, every kid, Today, This week and last week = the app before byte for byte once the ⭐ Give stars back button is taken out", S.pop.every(p => p[1].length === 0), S.pop.filter(p => p[1].length));
ok("…and on days with no row that fell short it is byte for byte with nothing taken out (Mon 11/16 … Wed 11/25, Sun 11/29)", S.pop.filter(p => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 13].includes(p[0])).every(p => Object.keys(p[2]).filter(k => !/thu|lastwk/.test(k)).every(k => p[2][k] === 0)), S.pop.map(p => [p[0], p[2].kid_aday]));

// ── B ──
console.log("\n── B · the button only on a row that fell short ──");
const th = S.notes.thu;
{ const r = rowsH(th).filter(x => GIVE.test(x)); GIVE.lastIndex = 0;
  ok("Thursday 11/26: exactly one button, on \"🧹 Vacuum the den paid 6 of 10 ⭐ · due Tue\"", (th.match(GIVE) || []).length === 1 && /^✅ 🧹 Vacuum the den paid 6 of 10 ⭐ · due Tue \+6 ⭐ .*⭐ Give stars back$/.test(rowT(th, "Vacuum the den")), rowT(th, "Vacuum the den"));
  ok("…its words: \"⭐ Give stars back\", the tap names the kid, the tick's week and day, the list and the row", /lgGive\('kid_a','week\d+','thursday','chores',\d+\)/.test(th));
  ok("no button on: the bed (daily), the dust (on its day), the fern (0 ⭐, ticked late), the Morning rows, not-done rows", ["Make the bed", "Dust the shelves", "Water the fern", "Brush teeth", "Feed the rabbit", "Wash the car"].every(nm => !/lgGive/.test(rowsH(th).filter(x => x.indexOf(nm) >= 0).join(""))), ["Make the bed", "Water the fern"].map(nm => rowT(th, nm)));
  ok("kid_b's porch ticked late while Mom checks before pay (⏸ held): no button", !/lgGive/.test(S.notes.thuB) && /⏸ 🧺 Sweep the porch waiting for your ✓ · 4 ⭐/.test(txt(S.notes.thuB)), rowT(S.notes.thuB, "Sweep the porch"));
  ok("week 1 (Thu 11/19): the vacuum's late tick paid in full (\"done late\", before the falling stars began): no button", /✅ 🧹 Vacuum the den done late · due Tue \+10 ⭐/.test(rowT(S.notes.wk1, "Vacuum the den")) && !/lgGive/.test(S.notes.wk1), rowT(S.notes.wk1, "Vacuum the den"));
  ok("Tue 11/24 (the vacuum not done yet): no button; Mon 11/30: one, on the car (8 of 10)", S.pop[8][2].kid_aday === 0 && S.pop[14][2].kid_aday === 1, [S.pop[8][2], S.pop[14][2]]);
  // a plan row and a Morning row never, read straight from the rule
  const u = JSON.parse(A.run("(function(){ const D=lgDay(-4), E=lgDay(-6), o={}; const t=function(slot,st){ const r={sh:4}; lgGbRow(r,slot,'kid_a',D,1,st,E,6,10); return !!r.gbH; };"
    + " o.chore=t('chores',{pts:10,cad:'wk:1'}); o.plan=t('chores',{pts:10,cad:'wk:1',house:'x'}); o.morning=t('morning',{pts:10,cad:'wk:1'}); o.zero=(function(){ const r={sh:0}; lgGbRow(r,'chores','kid_a',D,1,{pts:0,cad:'wk:1'},E,0,0); return !!r.gbH; })();"
    + " o.full=(function(){ const r={sh:0}; lgGbRow(r,'chores','kid_a',D,1,{pts:10,cad:'wk:1'},E,10,10); return !!r.gbH; })(); o.old=(function(){ const r={sh:4}; lgGbRow(r,'chores','kid_a',D,1,{pts:10,cad:'wk:1'},lgDay(-12)||{iso:'2026-11-17'},6,10); return !!r.gbH; })(); return JSON.stringify(o); })()"));
  ok("the rule itself: a late weekday chore that paid less → button; a plan row, a Morning row, 0 ⭐, paid in full, due before 11/22 → none", J(u) === J({ chore: true, plan: false, morning: false, zero: false, full: false, old: false }), u);
}

// ── C ──
console.log("\n── C · one tap: one bank line of the missing stars; the totals ──");
const wk3 = A.run("activeWk()"), carI = idxOf(A, "chores", "kid_a", "Wash the car"), CAR = "lgb_" + wk3 + "_monday_kid_a_cstep" + carI, carArgs = "'kid_a','" + wk3 + "','monday','chores'," + carI;
let before, after;
{ loadH(Dd, HJS);
  if (process.env.LGB_DUMP) A.run("HA_LS.setItem('ha_ledger_hello','1');1");   // the preview page's drawings, without the first-minute card
  S.wk0 = top(LG(A, "lgGo('kid_a',0,1)")); before = LG(A, "lgGo('kid_a',0,0)"); const b0 = bal(A, "kid_a"), lists0 = kidLists(B), m = w.mark();
  ok("Monday 11/30 before: \"✅ 🚗 Wash the car paid 8 of 10 ⭐ · due Sun +8 ⭐ … ⭐ Give stars back\"; the top line \"earned 25 ⭐ · fell short 2 ⭐\" (the rabbit 15, the bed 2, the car 8)", /^✅ 🚗 Wash the car paid 8 of 10 ⭐ · due Sun \+8 ⭐ .* ⭐ Give stars back$/.test(rowT(before, "Wash the car")) && /^Today: earned 25 ⭐ · fell short 2 ⭐/.test(top(before)), [rowT(before, "Wash the car"), top(before)]);
  ok("the tap is Mom's: lgGive answers yes", A.run("lgGive(" + carArgs + ")") === true);
  await w.flush(); const ws = writes(w, m);
  ok("exactly one database write: a set of bank/kid_a/adjustments/" + CAR, ws.length === 1 && ws[0].op === "set" && ws[0].path === "bank/kid_a/adjustments/" + CAR, ws.map(e => [e.op, e.path]));
  const L = w.get("bank/kid_a/adjustments/" + CAR) || {};
  ok("the line: +2, \"⭐ Mom gave back: 🚗 Wash the car\", src earn, the tick's week and day (monday), by mom; nothing held", L.amount === 2 && L.note === "⭐ Mom gave back: 🚗 Wash the car" && L.src === "earn" && L.wk === wk3 && L.day === "monday" && L.by === "mom" && !L.held, L);
  ok("the Star Bank: +2 on every device, the newest line reads \"⭐ Mom gave back: 🚗 Wash the car\" +2", bal(A, "kid_a") === b0 + 2 && bal(B, "kid_a") === b0 + 2 && bal(Dd, "kid_a") === b0 + 2 && /⭐ Mom gave back: 🚗 Wash the car/.test(B.run("JSON.stringify(bankLedger('kid_a').slice(0,3))")), [b0, bal(A, "kid_a"), bal(B, "kid_a")]);
  after = LG(A, "lgGo('kid_a',0,0)");
  ok("after: the row still reads late (\"paid 8 of 10 ⭐ · due Sun +8 ⭐\"), the button's place says \"⭐ Mom gave back +2 ⭐\" and Undo (after L5's ↩ Send back)", /^✅ 🚗 Wash the car paid 8 of 10 ⭐ · due Sun \+8 ⭐ \S+ [AP]M ↩ Send back ⭐ Mom gave back \+2 ⭐ Undo$/.test(rowT(after, "Wash the car")) && !/lgGive\(/.test(after) && /lgGiveUndo\('kid_a'/.test(after), rowT(after, "Wash the car"));
  S.dump = { before, after };
  ok("the top line adds up: \"earned 27 ⭐\", no \"fell short\" (25 + 2; 2 − 2)", /^Today: earned 27 ⭐( ·|$)/.test(top(after)) && !/fell short/.test(top(after)), top(after));
  const x = JSON.parse(A.run("JSON.stringify(lgDayData('kid_a',0))")), bank = JSON.parse(A.run("(function(){ let n=0; const a=bank.kid_a.adjustments; Object.keys(a).forEach(function(k){ const x=a[k]; if(x&&x.src==='earn'&&!x.held&&x.wk===activeWk()&&x.day==='monday') n+=x.amount||0; }); return n; })()"));
  ok("…earned 27 = kid_a's bank lines for Monday (the rabbit +15, the tick's own +8, the bed +2, the give-back +2)", x.earned === 27 && bank === 27 && x.short === 0, [x.earned, bank, x.short]);
  { const t = top(LG(A, "lgGo('kid_a',0,1)")), e1 = +(/earned (\d+) ⭐/.exec(t) || [0, -1])[1], e0 = +(/earned (\d+) ⭐/.exec(S.wk0) || [0, -9])[1];
    ok("This week adds it up the same: earned up by 2 (" + e0 + " → " + e1 + "), fell short 2 → gone", e1 === e0 + 2 && /fell short 2 ⭐/.test(S.wk0) && !/fell short/.test(t), [S.wk0, t]); }
  ok("the kid's own lists draw byte for byte as before the tap (the row still reads late; only the stars change)", J(kidLists(B)) === J(lists0));
}

// ── D ──
console.log("\n── D · a second tap, a second device, two at once: one line ──");
{ Dd.run("dadUnlocked=true;1");   // DADGATE (her answer 2026-11-24): Dad's link gives stars back only with his code in
  let m = w.mark();
  ok("a second tap on the same device: no, nothing written", A.run("lgGive(" + carArgs + ")") === false && writes(w, m).length === 0);
  m = w.mark();
  ok("Dad's link, having heard the first: no, nothing written", Dd.run("lgGive(" + carArgs + ")") === false && writes(w, m).length === 0);
  ok("still one give-back line for kid_a, +2", gbLines(w, "kid_a").length === 1 && adj(w, "kid_a")[CAR].amount === 2, gbLines(w, "kid_a"));
  A.run("lgGiveUndo(" + carArgs + ")"); await w.flush();
  m = w.mark(); const b0 = bal(A, "kid_a");
  const r1 = A.run("lgGive(" + carArgs + ")"), r2 = Dd.run("lgGive(" + carArgs + ")"); await w.flush();   // before either hears the other
  ok("two devices tap before either hears the other: both write the same one path, so the bank has ONE line, +2", r1 && r2 && writes(w, m).every(e => e.path === "bank/kid_a/adjustments/" + CAR) && gbLines(w, "kid_a").length === 1 && bal(B, "kid_a") === b0 + 2, [writes(w, m).map(e => e.path), gbLines(w, "kid_a"), bal(B, "kid_a") - b0]);
  A.run("lgGiveUndo(" + carArgs + ")"); await w.flush();
  Dd.run("dadUnlocked=false;1");
}

// ── E ──
console.log("\n── E · Undo removes exactly that line ──");
{ const b0 = bal(A, "kid_a"); A.run("lgGive(" + carArgs + ")"); await w.flush();
  const keys0 = Object.keys(adj(w, "kid_a")).sort(), m = w.mark();
  ok("Undo (Mom): yes", A.run("lgGiveUndo(" + carArgs + ")") === true);
  await w.flush(); const ws = writes(w, m), keys1 = Object.keys(adj(w, "kid_a")).sort();
  ok("one write: a remove of bank/kid_a/adjustments/" + CAR + "; every other bank line untouched", ws.length === 1 && ws[0].op === "remove" && ws[0].path === "bank/kid_a/adjustments/" + CAR && J(keys1) === J(keys0.filter(k => k !== CAR)), ws.map(e => [e.op, e.path]));
  ok("the Star Bank back where it was on every device", bal(A, "kid_a") === b0 && bal(B, "kid_a") === b0 && bal(Dd, "kid_a") === b0);
  const h = LG(A, "lgGo('kid_a',0,0)"); S.dump.undo = h;
  ok("the pop-up is the one from before the tap again, byte for byte (button, \"fell short 2 ⭐\", earned 25)", h === before, [top(h), rowT(h, "Wash the car")]);
  const m2 = w.mark();
  ok("Undo again: no, nothing written", A.run("lgGiveUndo(" + carArgs + ")") === false && writes(w, m2).length === 0);
}

// ── F ──
console.log("\n── F · last week: Thursday 11/26's vacuum (6 of 10) ──");
{ const wk2 = A.run("_prevWkKey()"), vi = idxOf(A, "chores", "kid_a", "Vacuum the den"), VAC = "lgb_" + wk2 + "_thursday_kid_a_cstep" + vi, va = "'kid_a','" + wk2 + "','thursday','chores'," + vi;
  const h0 = LG(A, "lgGo('kid_a',-4,0)"), w0 = LG(A, "lgGo('kid_a',-4,1)");
  ok("last week's Thursday: \"Thursday: earned 8 ⭐ · fell short 4 ⭐\" and the button on the vacuum", /^Thursday: earned 8 ⭐ · fell short 4 ⭐/.test(top(h0)) && /⭐ Give stars back$/.test(rowT(h0, "Vacuum the den")), [top(h0), rowT(h0, "Vacuum the den")]);
  const m = w.mark(), b0 = bal(A, "kid_a");
  ok("the tap: yes; one write, bank/kid_a/adjustments/" + VAC + " (+4, last week's key, thursday)", A.run("lgGive(" + va + ")") === true && (await w.flush(), writes(w, m).length === 1) && (w.get("bank/kid_a/adjustments/" + VAC) || {}).amount === 4 && w.get("bank/kid_a/adjustments/" + VAC).wk === wk2 && w.get("bank/kid_a/adjustments/" + VAC).day === "thursday", writes(w, m).map(e => e.path));
  const h1 = LG(A, "lgGo('kid_a',-4,0)"), w1 = LG(A, "lgGo('kid_a',-4,1)");
  ok("Thursday adds up: \"earned 12 ⭐\", no fell short; the row \"⭐ Mom gave back +4 ⭐ Undo\"; the Star Bank +4", /^Thursday: earned 12 ⭐( ·|$)/.test(top(h1)) && !/fell short/.test(top(h1)) && /⭐ Mom gave back \+4 ⭐ Undo$/.test(rowT(h1, "Vacuum the den")) && bal(A, "kid_a") === b0 + 4, [top(h1), rowT(h1, "Vacuum the den")]);
  const n0 = +(/earned (\d+) ⭐/.exec(top(w0)) || [0, 0])[1], s0 = +(/fell short (\d+) ⭐/.exec(top(w0)) || [0, 0])[1], n1 = +(/earned (\d+) ⭐/.exec(top(w1)) || [0, 0])[1], s1 = +(/fell short (\d+) ⭐/.exec(top(w1)) || [0, 0])[1];
  ok("last week's totals: earned +4, fell short −4", n1 === n0 + 4 && s1 === s0 - 4, [top(w0), top(w1)]);
  ok("this week's ledger and Board numbers are not changed by it (bankEarnedWeek counts this week only)", A.run("bankEarnedWeek('kid_a')") === BW.A.run("bankEarnedWeek('kid_a')"));
  A.run("lgGiveUndo(" + va + ")"); await w.flush();
  ok("Undo: the line gone, Thursday back to \"earned 8 ⭐ · fell short 4 ⭐\"", !w.get("bank/kid_a/adjustments/" + VAC) && LG(A, "lgGo('kid_a',-4,0)") === h0);
}

// ── G ──
console.log("\n── G · an un-tick after a give-back leaves nothing behind ──");
{ const bT = bal(B, "kid_a");   // the car ticked (+8)
  A.run("lgGive(" + carArgs + ")"); await w.flush();
  ok("given back (+2)", !!w.get("bank/kid_a/adjustments/" + CAR) && bal(B, "kid_a") === bT + 2);
  const m = w.mark(); tick(B, "chores", "kid_a", "Wash the car"); await w.flush();   // the kid's own un-tick, on her own device (house.js never loaded there)
  ok("the kid's own un-tick (her device, no house.js): the tick's +8 and the give-back +2 both removed", !w.get("bank/kid_a/adjustments/" + CAR) && bal(B, "kid_a") === bT - 8 && bal(A, "kid_a") === bT - 8, [bal(B, "kid_a") - bT, gbLines(w, "kid_a")]);
  ok("…by two removes (the tick's line, the give-back line); no give-back line left anywhere for kid_a", writes(w, m).filter(e => e.op === "remove" && /^bank\/kid_a\/adjustments\//.test(e.path)).length === 2 && gbLines(w, "kid_a").length === 0, writes(w, m).map(e => [e.op, e.path]));
  ok("the ledger: the car is a ⏳ row again, no button, no give-back", /^⏳ 🚗 Wash the car /.test(rowT(LG(A, "lgGo('kid_a',0,0)"), "Wash the car")) && !/lgGive/.test(LG(A, "lgGo('kid_a',0,0)")), rowT(LG(A, "lgGo('kid_a',0,0)"), "Wash the car"));
  // re-ticked (still late: 8 of 10), given back, then Mom un-ticks it from her Kids today pop-up (the reversal is banked, CHOREUNDO)
  const b1 = bal(B, "kid_a"); tick(B, "chores", "kid_a", "Wash the car"); await w.flush(); A.run("lgGive(" + carArgs + ")"); await w.flush();
  ok("re-ticked (+8 again) and given back again (+2)", bal(B, "kid_a") === b1 + 10 && !!w.get("bank/kid_a/adjustments/" + CAR), bal(B, "kid_a") - b1);
  A.run("haMomOn();1"); const ci = idxOf(A, "chores", "kid_a", "Wash the car"); A.run("choreUndo('chores','kid_a',_todayDay," + ci + ")"); await w.flush();
  ok("Mom's un-tick: the give-back line removed, the tick's +8 reversed by Mom's line; the bank back to before the tick", !w.get("bank/kid_a/adjustments/" + CAR) && bal(B, "kid_a") === b1 && gbLines(w, "kid_a").length === 0, [bal(B, "kid_a") - b1, gbLines(w, "kid_a")]);
  const b2 = bal(B, "kid_a"); tick(B, "chores", "kid_a", "Wash the car"); await w.flush();
  ok("ticked once more: 8 of 10, the button back (the give-back was not left to double it)", bal(B, "kid_a") === b2 + 8 && /⭐ Give stars back$/.test(rowT(LG(A, "lgGo('kid_a',0,0)"), "Wash the car")), rowT(LG(A, "lgGo('kid_a',0,0)"), "Wash the car"));
  const m3 = w.mark(); tick(B, "chores", "kid_a", "Make the bed"); tick(B, "chores", "kid_a", "Make the bed"); await w.flush();
  ok("an un-tick with no give-back writes just what it wrote before (no extra remove)", writes(w, m3).filter(e => /\/lgb_/.test(e.path)).length === 0);
}

// ── H ──
console.log("\n── H · a kid's device and a kiosk cannot ──");
{ for (const [nm, d] of [["a kid's device", B], ["the kitchen kiosk", Kk]]) {
    d.run(HJS); const m = w.mark(), b0 = bal(A, "kid_a");
    const pop = LG(d, "lgShow()"), g = d.run("lgGive(" + carArgs + ")"), u = d.run("lgGiveUndo(" + carArgs + ")"); await w.flush();
    ok(nm + " (house.js loaded there anyway): the pop-up does not open, lgGive and Undo say no, nothing written, the bank unchanged", pop === "" && g === false && u === false && writes(w, m).length === 0 && bal(A, "kid_a") === b0, [pop.slice(0, 50), g, u, writes(w, m).length]);
    ok(nm + ": a row drawn there would carry no button", !/lgGive/.test(d.run("(function(){ const r={sh:2,nm:'x'}; lgGbRow(r,'chores','kid_a',lgDay(0),0,{pts:10,cad:'wk:6'},lgDay(-1),8,10); return r.gbH||''; })()")));
  }
  A.run("lgGive(" + carArgs + ")"); await w.flush(); const m = w.mark();
  ok("…nor undo Mom's give-back", B.run("lgGiveUndo(" + carArgs + ")") === false && writes(w, m).length === 0 && !!w.get("bank/kid_a/adjustments/" + CAR));
  A.run("lgGiveUndo(" + carArgs + ")"); await w.flush();
}

// ── J ──
console.log("\n── J · Dad's own link, his code in ──");
{ Dd.run("dadUnlocked=true;1");   // DADGATE (her answer 2026-11-24): locked, he has no button (test_dad_code_gates.js)
  const m = w.mark(), h = LG(Dd, "lgShow();lgGo('kid_a',0,0)");
  ok("Dad's link, his code in: the same button on the car", /⭐ Give stars back$/.test(rowT(h, "Wash the car")));
  ok("his tap: one line \"⭐ Dad gave back: 🚗 Wash the car\" +2, by dad", Dd.run("lgGive(" + carArgs + ")") === true && (await w.flush(), true) && (w.get("bank/kid_a/adjustments/" + CAR) || {}).note === "⭐ Dad gave back: 🚗 Wash the car" && w.get("bank/kid_a/adjustments/" + CAR).by === "dad" && writes(w, m).length === 1);
  ok("Mom's ledger then says \"⭐ Dad gave back +2 ⭐\" with Undo", /⭐ Dad gave back \+2 ⭐ Undo$/.test(rowT(LG(A, "lgGo('kid_a',0,0)"), "Wash the car")));
  Dd.run("lgGiveUndo(" + carArgs + ")"); await w.flush();
  ok("his Undo removes it", !w.get("bank/kid_a/adjustments/" + CAR));
  Dd.run("dadUnlocked=false;1");
}

// ── I ──
console.log("\n── I · dryrun writes nothing ──");
{ const Dr = w.boot("Dr", "devDr", { mom: true }); Dr.run("globalThis.__pop='';document.body.insertAdjacentHTML=function(p,h){ globalThis.__pop=h; };tab='moms-plan';1"); await w.flush(); Dr.run(HJS);
  Dr.run("HA_LS.setItem('ha_dryrun','1');1"); const m = w.mark(), b0 = bal(A, "kid_a");
  const g = Dr.run("lgGive(" + carArgs + ")"); await w.flush();
  ok("?dryrun=1: the tap shows on that screen only (its own copy), nothing reaches the database", g === true && writes(w, m).length === 0 && !w.get("bank/kid_a/adjustments/" + CAR) && bal(A, "kid_a") === b0 && /Mom gave back \+2/.test(rowT(LG(Dr, "lgGo('kid_a',0,0)"), "Wash the car")), writes(w, m).map(e => e.path));
  const u = Dr.run("lgGiveUndo(" + carArgs + ")"); await w.flush();
  ok("…and its Undo writes nothing either", u === true && writes(w, m).length === 0);
  w.devs.splice(w.devs.indexOf(Dr), 1);
}

if (process.env.LGB_DUMP) fs.writeFileSync(process.env.LGB_DUMP, J(S.dump));   // read only by the preview page's builder
console.log("\n" + pass + " passed, " + fail + " failed");
try { fs.unlinkSync(BASE_IDX); } catch (e) {}
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); try { fs.unlinkSync(BASE_IDX); } catch (x) {} process.exit(1); });
