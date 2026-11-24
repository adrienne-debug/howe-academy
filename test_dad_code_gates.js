/*
 * test_dad_code_gates.js — DADGATE: on Dad's own link, ⭐ Give stars back (and its Undo) in the 📒 Ledger and 🧾 Today's check-offs'
 * −100 (and its 🚩 mark with Take stars away off) need his code, like everything else there that moves stars. Her answer 2026-11-24:
 * "Yes, ask for code". house.js lgGbOk() and index.html ckLogCanDock() = Mom, or Dad's own link (_kioskD()) with his code in
 * (dadAwardOk()) — the ➖ Excuse / ⚙ gate. A locked Dad still sees both look-only (every line, mark and "given back" note), with one line
 * saying how to get the buttons; the taps refuse too.
 * The WHOLE app runs per device (test_fixtures/house_world.js) on a made-up family (kid_a … kid_d), the clock moved day by day from
 * Mon 11/16 to Mon 11/30: kid_a 🧹 Make the bed (daily 2) · Wash the car (Sun 10)   kid_c 🧹 Toys in the bin (daily 3). The car is missed
 * Sun 11/29 and ticked Mon 11/30 (paid 8 of 10: the one row with ⭐ Give stars back).
 * Checks: A a locked Dad: no button, the hint line, every tap refused (zero writes, the bank unchanged), the marks and notes still shown ·
 *   B an unlocked Dad = the app before's Dad (the same drawings, writes and bank; marked as Dad) · C 🔒 Lock refuses again · D Mom and a
 *   kid's device = the app before, byte for byte · E dryrun writes nothing.
 * "The app before" = THIS tree with DADGATE taken out (no git, no pinned commit; each piece must match exactly once).
 * DG_INDEX / DG_HJS = other copies (a mutation check).   run: node test_dad_code_gates.js
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os");
const W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 900) + ")" : "")); } };
const J = x => JSON.stringify(x), clone = x => JSON.parse(J(x));
const IDX = process.env.DG_INDEX || path.join(__dirname, "index.html"), HJS = fs.readFileSync(process.env.DG_HJS || path.join(__dirname, "house.js"), "utf8");

// ── the app before: this tree, DADGATE taken out ──
const R = (s, a, b, l) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error("test_dad_code_gates: the app before cannot be built — " + l + " found " + n + "×"); return s.replace(a, () => b); };
const BASE_HJS = (() => { let s = fs.readFileSync(path.join(__dirname, "house.js"), "utf8");
  const a = s.indexOf("// DADGATE (her answer 2026-11-24"), b = s.indexOf("function lgGbOk(){");
  if (a < 0 || b < a) throw new Error("test_dad_code_gates: the app before cannot be built — house.js's DADGATE comment");
  s = s.slice(0, a) + s.slice(b);
  s = R(s, 'function lgGbOk(){ return (typeof momHere==="function"&&momHere())||(typeof _kioskD==="function"&&_kioskD()&&typeof dadAwardOk==="function"&&dadAwardOk()); }',
    'function lgGbOk(){ return (typeof momHere==="function"&&momHere())||(typeof _kioskD==="function"&&_kioskD()); }', "lgGbOk");
  s = s.replace(/^function lgDadTip\(\)[^\n]*\n/m, "");
  s = R(s, '  if(typeof lgDadTip==="function") h+=lgDadTip();   // DADGATE: a locked Dad\'s one line\n', "", "the hint's hook");
  if (/DADGATE|lgDadTip/.test(s)) throw new Error("test_dad_code_gates: the app before's house.js still has DADGATE");
  return s; })();
const BASE_IDX = (() => { let s = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const a = s.indexOf("// DADGATE (her answer 2026-11-24"), b = s.indexOf("function ckLogCanSee(){");
  if (a < 0 || b < a) throw new Error("test_dad_code_gates: the app before cannot be built — index.html's DADGATE comment");
  s = s.slice(0, a) + s.slice(b);
  s = R(s, 'function ckLogCanSee(){ try{ return momHere()||_kioskD(); }catch(e){ return false; } }\nfunction ckLogCanDock(){ try{ return momHere()||(_kioskD()&&typeof dadAwardOk==="function"&&dadAwardOk()); }catch(e){ return false; } }',
    'function ckLogCanDock(){ try{ return momHere()||_kioskD(); }catch(e){ return false; } }', "the gates");
  s = R(s, '    if(!ckLogCanSee()) return "";   // DADGATE\n    const items=ckLogToday(), canDock=ckLogCanDock();', '    if(!ckLogCanDock()) return "";\n    const items=ckLogToday();', "the card's gate");
  s = R(s, "          else if(canDock) h+='<button onclick=\"event.stopPropagation();ckLogDock(", "          else h+='<button onclick=\"event.stopPropagation();ckLogDock(", "the −100's gate");
  s = s.replace(/^ {6}if\(!canDock\) h\+='<div[^\n]*DADGATE: a locked Dad\n/m, "");
  if (/DADGATE|ckLogCanSee|canDock/.test(s)) throw new Error("test_dad_code_gates: the app before's index.html still has DADGATE");
  const t = path.join(os.tmpdir(), "dad_code_gates_before_" + process.pid + ".html"); fs.writeFileSync(t, s); return t; })();
console.log("(the app before: this tree with DADGATE taken out of house.js and index.html)");

const K = o => Object.assign({ src: { kind: "routine" }, status: "active", area: "cleaning", verdict: "", note: "", level: 1, minutes: 5 }, o);
const FAM = () => ({
  a_bed: K({ label: "Make the bed", emoji: "🛏", who: "kid_a", slot: "chores", cad: "daily", pts: 2, order: 0 }),
  a_car: K({ label: "Wash the car", emoji: "🚗", who: "kid_a", slot: "chores", cad: "wk:6", pts: 10, order: 1 }),
  c_toys: K({ label: "Toys in the bin", emoji: "🧩", who: "kid_c", slot: "chores", cad: "daily", pts: 3, order: 0 })
});
const dOf = n => new Date(2026, 10, 16 + n);
const go = (w, n, h) => { const d = dOf(n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h, 0); };
const CAP = "globalThis.__pop='';globalThis.__cf=[];document.body.insertAdjacentHTML=function(p,h){ globalThis.__pop=h; };confirm=function(m){ __cf.push(m); return true; };tab='moms-plan';HA_LS.setItem('ha_ledger_hello','1');1";
const loadH = (d, hjs) => { if (d.run("typeof lgShow") !== "function") d.run(hjs); };
async function mkWorld(index, hjs) {
  const w = await W.world({ index, household: { jobs: FAM(), people: clone(W.PEOPLE), meta: { takeover: 1, engine: { mode: "preview", on: "2026-11-09" } } }, tree: { config: clone(W.FX.db.config) } });
  const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"), Dd = w.boot("D", "devD");
  Dd.run("HA_LS.setItem('ha_kiosk','dad');1");
  for (const d of [A, B, Dd]) d.run(CAP);
  await w.flush(); return { w, A, B, Dd, hjs };
}
const idxOf = (d, kid, label) => d.run("(function(){ day=_todayDay; return (rtStepsFor('chores','" + kid + "',false,day)||[]).findIndex(function(x){ return x&&x.label===" + J(label) + "&&x.cad!=='none'; }); })()");
const tick = (d, kid, label) => { const i = idxOf(d, kid, label); if (i < 0) return -1; d.run("(function(){ day=_todayDay; toggleRtStep('chores','" + kid + "'," + i + "); })()"); return i; };
const LG = (d, js) => d.run("(function(){ __pop=''; " + js + "; return __pop; })()");
const CK = d => d.run("(function(){ ckLogOpen=true; return mdCardCheckLog(); })()");
const page = (d, f) => { d.run("globalThis.__el={innerHTML:'',style:{},appendChild(){},querySelector(){ return null; },querySelectorAll(){ return []; }};1"); try { d.run(f + "(__el);1"); } catch (e) { return "threw " + e.message; } return d.run("__el.innerHTML"); };
const txt = h => String(h || "").replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const rowsH = h => String(h).split('<div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 8px;padding:5px 2px;').slice(1).map(r => '<div ' + r.split("</div>")[0]);
const rowT = (h, name) => txt(rowsH(h).filter(r => r.indexOf(name) >= 0)[0] || "");
const ckRow = (h, label) => txt((String(h).split('<div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid #f3f4f6">').filter(r => r.indexOf(label) >= 0)[0] || "").split("</div>")[0]);
const GIVE = /<button onclick="lgGive\('[^']*','[^']*','[^']*','[^']*',\d+\)" title="[^"]*" style="[^"]*">⭐ Give stars back<\/button>/g;
const GUNDO = /<button onclick="lgGiveUndo\('[^']*','[^']*','[^']*','[^']*',\d+\)" style="[^"]*">Undo<\/button>/g;
const DOCK = /<button onclick="event\.stopPropagation\(\);ckLogDock\([^"]*\)" title="[^"]*" style="[^"]*">−100<\/button>/g;
const LTIP = '<div style="margin-top:10px;font-size:12px;color:#6b7280">🔒 Put your code in under Star controls to give stars back or excuse a chore.</div>';
const CTIP = '<div style="font-size:11.5px;color:#6b7280;margin-top:6px">🔒 Put your code in under Star controls to use −100.</div>';
const FOOT = "in the subject sheet to undo the record.</div>";
// a locked Dad's drawing, worked out from the app before's: the buttons out, the one line in
const lockedLG = h => { h = h.replace(GIVE, "").replace(GUNDO, ""); const i = h.lastIndexOf("</div></div>"); return h.slice(0, i) + LTIP + h.slice(i); };
const lockedCK = h => h.replace(DOCK, "").replace(FOOT, FOOT + CTIP);
// each write as [op, path, the value now at that path] — an ordinary bank line's id and a push key are random, the times are the clock's
const norm = p => p.replace(/(\/adjustments\/)(?!lgb_)[^/]+$/, "$1*").replace(/-P\d+/g, "-P*");
const vals = (w, m) => w.since(m || 0).map(l => { let v = w.get(l.path); v = v && typeof v === "object" ? Object.assign({}, v) : v; if (v && typeof v === "object") { delete v.ts; delete v.iso; delete v.flagTs; delete v.at; } return [l.op, norm(l.path), v === undefined ? null : v]; });
const bankOf = (w, kid) => Object.values(w.get("bank/" + kid + "/adjustments") || {}).map(a => [a.amount, a.note, a.by || ""]).sort((x, y) => J(x) < J(y) ? -1 : 1);
const bal = (d, kid) => d.run("bankBalance(" + J(kid) + ")");
const logKey = (d, kid, label) => JSON.parse(d.run("(function(){ const wk=activeWk(), dn=_todayDay, L=((routineLog[" + J(kid) + "]||{})[wk]||{})[dn]||{}; const k=Object.keys(L).filter(function(k){ return L[k]&&L[k].act==='on'&&L[k].label===" + J(label) + "; }).pop(); return JSON.stringify(k?[wk,dn,k]:null); })()"));
const dockJs = (k, kid, label) => "ckLogDock('step','" + kid + "','" + k.join("/") + "'," + J(label) + ")";
const lock = (d, on) => d.run("dadUnlocked=" + (on ? "false" : "true") + ";1");

(async () => {
const N = await mkWorld(IDX, HJS), O = await mkWorld(BASE_IDX, BASE_HJS);
for (let n = 0; n <= 14; n++) for (const S of [N, O]) {
  await go(S.w, n, 8); tick(S.B, "kid_a", "Make the bed"); tick(S.B, "kid_c", "Toys in the bin"); await S.w.flush();
  await go(S.w, n, 16); if (n === 6) tick(S.B, "kid_a", "Wash the car"); if (n === 14) tick(S.B, "kid_a", "Wash the car"); await S.w.flush(); await go(S.w, n, 18);
}
for (const S of [N, O]) { for (const d of [S.A, S.Dd]) loadH(d, S.hjs); S.wk = S.A.run("activeWk()"); S.carI = idxOf(S.A, "kid_a", "Wash the car"); S.car = "'kid_a','" + S.wk + "','monday','chores'," + S.carI; S.CAR = "lgb_" + S.wk + "_monday_kid_a_cstep" + S.carI; }
const ledger = S => LG(S.Dd, "lgShow();lgGo('kid_a',0,0)");
const momLG = S => LG(S.A, "lgShow();lgGo('kid_a',0,0)");
ok("the setup: Mon 11/30, Mom's ledger shows \"🚗 Wash the car paid 8 of 10 ⭐ · due Sun … ⭐ Give stars back\" (both worlds)", [N, O].every(S => /^✅ 🚗 Wash the car paid 8 of 10 ⭐ · due Sun .*⭐ Give stars back$/.test(rowT(momLG(S), "Wash the car"))), rowT(momLG(N), "Wash the car"));

// ── A ──
console.log("\n── A · Dad's link, locked: look-only, one line says how, every tap refused ──");
{ for (const S of [N, O]) lock(S.Dd, true);
  const hN = ledger(N), hO = ledger(O);
  ok("the 📒 Ledger: no ⭐ Give stars back (the app before had it on the car)", !/lgGive/.test(hN) && (hO.match(GIVE) || []).length === 1, rowT(hN, "Wash the car"));
  ok("…every row as before; the car still reads \"paid 8 of 10 ⭐ · due Sun\"", /^✅ 🚗 Wash the car paid 8 of 10 ⭐ · due Sun \+8 ⭐/.test(rowT(hN, "Wash the car")) && rowsH(hN).length === rowsH(hO).length);
  ok("…and the one line at the foot: \"🔒 Put your code in under Star controls to give stars back or excuse a chore.\" — the rest byte for byte the app before's", hN === lockedLG(hO) && hN.indexOf(LTIP) > 0, [hN.length, lockedLG(hO).length]);
  const m = N.w.mark(), b0 = J(bankOf(N.w, "kid_a")), bl = bal(N.A, "kid_a");
  ok("lgGive from a locked Dad: no, zero writes, the bank unchanged", N.Dd.run("lgGive(" + N.car + ")") === false && (await N.w.flush(), N.w.since(m).length === 0) && J(bankOf(N.w, "kid_a")) === b0 && bal(N.A, "kid_a") === bl);
  // Mom gives back; the locked Dad sees the note, no Undo, and his Undo is refused
  for (const S of [N, O]) { S.A.run("lgGive(" + S.car + ")"); await S.w.flush(); }
  const gN = ledger(N), gO = ledger(O);
  ok("Mom gave back: his ledger shows \"⭐ Mom gave back +2 ⭐\" with no Undo (the app before had Undo)", /⭐ Mom gave back \+2 ⭐$/.test(rowT(gN, "Wash the car")) && /⭐ Mom gave back \+2 ⭐ Undo$/.test(rowT(gO, "Wash the car")) && gN === lockedLG(gO), [rowT(gN, "Wash the car"), rowT(gO, "Wash the car")]);
  const m2 = N.w.mark(), b1 = J(bankOf(N.w, "kid_a"));
  ok("lgGiveUndo from a locked Dad: no, zero writes, Mom's line still there", N.Dd.run("lgGiveUndo(" + N.car + ")") === false && (await N.w.flush(), N.w.since(m2).length === 0) && J(bankOf(N.w, "kid_a")) === b1 && !!N.w.get("bank/kid_a/adjustments/" + N.CAR));
  for (const S of [N, O]) { S.A.run("lgGiveUndo(" + S.car + ")"); await S.w.flush(); }
  // 🧾
  const cN = CK(N.Dd), cO = CK(O.Dd);
  ok("🧾 Today's check-offs: still drawn on his Day, every line there, no −100 (the app before had " + (cO.match(DOCK) || []).length + ")", cN !== "" && !/ckLogDock/.test(cN) && (cO.match(DOCK) || []).length === 3 && ["Make the bed", "Wash the car", "Toys in the bin"].every(l => ckRow(cN, l) !== ""));
  ok("…and the one line: \"🔒 Put your code in under Star controls to use −100.\" — the rest byte for byte the app before's", cN === lockedCK(cO) && cN.indexOf(CTIP) > 0);
  ok("Dad's Day with 🧾 closed (as it opens): byte for byte the app before's", (() => { for (const S of [N, O]) S.Dd.run("ckLogOpen=false;1"); return page(N.Dd, "renderDadsDay") === page(O.Dd, "renderDadsDay"); })());
  const k = logKey(N.Dd, "kid_c", "Toys in the bin"), m3 = N.w.mark(), b2 = J(bankOf(N.w, "kid_c"));
  N.Dd.run("__cf=[];1");
  ok("ckLogDock on a chore line from a locked Dad: no ask, zero writes, the bank unchanged, no mark", (N.Dd.run(dockJs(k, "kid_c", "Toys in the bin")), true) && N.Dd.run("__cf.length") === 0 && (await N.w.flush(), N.w.since(m3).length === 0) && J(bankOf(N.w, "kid_c")) === b2 && !N.Dd.run("routineLog.kid_c[" + J(k[0]) + "][" + J(k[1]) + "][" + J(k[2]) + "].flagged"));
  // a school card's line: its history entry on this device (the made-up family has no school week)
  N.Dd.run("histState['card_x']={title:'Reading — Ex. 1'};__cf=[];1");
  const m4 = N.w.mark(); N.Dd.run("ckLogDock('task','kid_a','card_x','Reading — Ex. 1')"); await N.w.flush();
  ok("ckLogDock on a school card from a locked Dad: no ask, zero writes, no mark (the app before's gate let him: " + O.Dd.run("ckLogCanDock()") + ")", N.Dd.run("__cf.length") === 0 && N.w.since(m4).length === 0 && !N.Dd.run("!!histState.card_x.flagged") && O.Dd.run("ckLogCanDock()") === true);
  N.Dd.run("delete histState.card_x;1");
  // Take stars away off: the 🚩 mark is refused too
  for (const S of [N, O]) { S.A.run("lgRuleTake('kid_c')"); await S.w.flush(); }
  const m5 = N.w.mark(); N.Dd.run("__cf=[];1"); N.Dd.run(dockJs(k, "kid_c", "Toys in the bin")); await N.w.flush();
  ok("Take stars away off for kid_c: his tap still refused — no ask, no 🚩 mark, zero writes", N.Dd.run("__cf.length") === 0 && N.w.since(m5).length === 0);
  for (const S of [N, O]) { S.A.run("lgRuleTake('kid_c')"); await S.w.flush(); }
  // a mark Mom made: shown to him
  for (const S of [N, O]) { const kk = logKey(S.A, "kid_a", "Make the bed"); S.A.run(dockJs(kk, "kid_a", "Make the bed")); await S.w.flush(); }
  const fN = CK(N.Dd);
  ok("a line Mom marked: he sees \"🚩 by Mom · −100\"; the rest as the app before minus the buttons", /🚩 by Mom · −100$/.test(ckRow(fN, "Make the bed")) && fN === lockedCK(CK(O.Dd)), ckRow(fN, "Make the bed"));
  for (const S of [N, O]) lock(S.Dd, false);
}

// ── B ──
console.log("\n── B · Dad's link, his code in = the app before's Dad ──");
{ for (const S of [N, O]) lock(S.Dd, false);
  ok("the 📒 Ledger: byte for byte the app before's (⭐ Give stars back on the car, no line)", ledger(N) === ledger(O) && (ledger(N).match(GIVE) || []).length === 1 && ledger(N).indexOf(LTIP) < 0);
  ok("🧾: byte for byte the app before's (−100 on each line not marked, no line)", CK(N.Dd) === CK(O.Dd) && (CK(N.Dd).match(DOCK) || []).length === 2 && CK(N.Dd).indexOf(CTIP) < 0);
  ok("Dad's Day: byte for byte the app before's", page(N.Dd, "renderDadsDay") === page(O.Dd, "renderDadsDay"));
  const r = []; for (const S of [N, O]) { const m = S.w.mark(); r.push([S.Dd.run("lgGive(" + S.car + ")"), (await S.w.flush(), vals(S.w, m)), bankOf(S.w, "kid_a"), bal(S.A, "kid_a")]); }
  ok("his ⭐ Give stars back: the same answer, writes and bank as the app before's Dad — one line \"⭐ Dad gave back: 🚗 Wash the car\" +2, by dad", J(r[0]) === J(r[1]) && r[0][0] === true && r[0][1].length === 1 && r[0][1][0][2].note === "⭐ Dad gave back: 🚗 Wash the car" && r[0][1][0][2].by === "dad" && r[0][1][0][2].amount === 2, r);
  ok("…his ledger then: byte for byte the app before's (\"⭐ Dad gave back +2 ⭐ Undo\")", ledger(N) === ledger(O) && /⭐ Dad gave back \+2 ⭐ Undo$/.test(rowT(ledger(N), "Wash the car")));
  const u = []; for (const S of [N, O]) { const m = S.w.mark(); u.push([S.Dd.run("lgGiveUndo(" + S.car + ")"), (await S.w.flush(), vals(S.w, m)), bankOf(S.w, "kid_a")]); }
  ok("his Undo: the same as the app before's (one remove, the line gone)", J(u[0]) === J(u[1]) && u[0][0] === true && u[0][1].length === 1 && u[0][1][0][0] === "remove" && !N.w.get("bank/kid_a/adjustments/" + N.CAR), u);
  const d = []; for (const S of [N, O]) { const k = logKey(S.Dd, "kid_c", "Toys in the bin"), m = S.w.mark(); S.Dd.run("__cf=[];1"); S.Dd.run(dockJs(k, "kid_c", "Toys in the bin")); await S.w.flush(); d.push([S.Dd.run("__cf.length"), vals(S.w, m), bankOf(S.w, "kid_c"), S.w.get("routineLog/kid_c/" + k.join("/")).flagBy]); }
  ok("his 🧾 −100: the same ask, writes and bank as the app before's Dad; the mark says Dad", J(d[0]) === J(d[1]) && d[0][0] === 1 && d[0][3] === "dad" && d[0][2].some(a => a[0] === -100 && / · by Dad$/.test(a[1])), d);
  ok("🧾 afterwards: byte for byte the app before's (\"🚩 by Dad · −100\")", CK(N.Dd) === CK(O.Dd) && /🚩 by Dad · −100$/.test(ckRow(CK(N.Dd), "Toys in the bin")));
}

// ── C ──
console.log("\n── C · 🔒 Lock: refused again ──");
{ N.Dd.run("dadLock();1"); O.Dd.run("dadLock();1");
  ok("after Lock: no ⭐ Give stars back and the line again; 🧾 has no −100 and its line", N.Dd.run("dadAwardOk()") === false && ledger(N) === lockedLG(ledger(O)) && CK(N.Dd) === lockedCK(CK(O.Dd)) && !/lgGive|ckLogDock/.test(ledger(N) + CK(N.Dd)));
  for (const S of [N, O]) { await go(S.w, 14, 19); tick(S.B, "kid_c", "Toys in the bin"); tick(S.B, "kid_c", "Toys in the bin"); await S.w.flush(); }   // a fresh line, not marked (the same minute in both worlds)
  const k = logKey(N.Dd, "kid_c", "Toys in the bin"), m = N.w.mark(), b0 = J([bankOf(N.w, "kid_a"), bankOf(N.w, "kid_c")]);
  ok("…a fresh toys line, not marked (the one he marked in B is not the one tapped here)", !!k && !N.w.get("routineLog/kid_c/" + k.join("/")).flagged);
  N.Dd.run("__cf=[];1"); const g = N.Dd.run("lgGive(" + N.car + ")"); N.Dd.run(dockJs(k, "kid_c", "Toys in the bin")); await N.w.flush();
  ok("…lgGive and ckLogDock refused: no ask, zero writes, the bank unchanged", g === false && N.Dd.run("__cf.length") === 0 && N.w.since(m).length === 0 && J([bankOf(N.w, "kid_a"), bankOf(N.w, "kid_c")]) === b0);
}

// ── D ──
console.log("\n── D · Mom and a kid's device: the app before, byte for byte ──");
{ for (const S of [N, O]) S.B.run("kcKid='kid_a';1");
  ok("Mom's 📒 Ledger, 🧾 and Mom's Day: byte for byte the app before's", momLG(N) === momLG(O) && CK(N.A) === CK(O.A) && page(N.A, "renderMomsPlan") === page(O.A, "renderMomsPlan") && momLG(N).indexOf(LTIP) < 0 && CK(N.A).indexOf(CTIP) < 0);
  const r = []; for (const S of [N, O]) { let m = S.w.mark(); const g = S.A.run("lgGive(" + S.car + ")"); await S.w.flush(); const a = vals(S.w, m); m = S.w.mark(); const u = S.A.run("lgGiveUndo(" + S.car + ")"); await S.w.flush(); r.push([g, a, u, vals(S.w, m), bankOf(S.w, "kid_a")]); }
  ok("Mom's ⭐ Give stars back and Undo: the same answers, writes and bank as the app before (\"⭐ Mom gave back\", by mom)", J(r[0]) === J(r[1]) && r[0][0] === true && r[0][1][0][2].by === "mom" && r[0][2] === true, r);
  const d = []; for (const S of [N, O]) { await go(S.w, 14, 20); const k = logKey(S.A, "kid_c", "Toys in the bin"); tick(S.B, "kid_c", "Toys in the bin"); await S.w.flush(); tick(S.B, "kid_c", "Toys in the bin"); await S.w.flush(); const k2 = logKey(S.A, "kid_c", "Toys in the bin"), m = S.w.mark(); S.A.run("__cf=[];1"); S.A.run(dockJs(k2, "kid_c", "Toys in the bin")); await S.w.flush(); d.push([k2 && k2[2] !== (k && k[2]), S.A.run("__cf.length"), vals(S.w, m), bankOf(S.w, "kid_c")]); }
  ok("Mom's 🧾 −100: the same ask, writes and bank as the app before (by Mom)", J(d[0].slice(1)) === J(d[1].slice(1)) && d[0][1] === 1 && d[0][3].some(a => a[0] === -100 && / · by Mom$/.test(a[1])), d);
  for (const S of [N, O]) S.Dd.run("haMomOn();1");
  ok("Mom mode switched on on Dad's device: the 📒 Ledger and 🧾 = the app before's, no line", ledger(N) === ledger(O) && CK(N.Dd) === CK(O.Dd) && (ledger(N) + CK(N.Dd)).indexOf("🔒 Put your code in") < 0 && /lgGive/.test(ledger(N)));
  for (const S of [N, O]) S.Dd.run("haMomOff();1");
  ok("a kid's device: no 🧾 card, no ledger, every tap refused, the Kids' Corner byte for byte", N.B.run("mdCardCheckLog()") === "" && (loadH(N.B, N.hjs), LG(N.B, "lgShow()")) === "" && N.B.run("lgGive(" + N.car + ")") === false && N.B.run("lgGiveUndo(" + N.car + ")") === false && (N.B.run("__cf=[];" + dockJs(logKey(N.B, "kid_a", "Make the bed") || ["x", "y", "z"], "kid_a", "Make the bed") + ";__cf.length")) === 0 && page(N.B, "renderKidsCorner") === page(O.B, "renderKidsCorner"));
}

// ── E ──
console.log("\n── E · dryrun writes nothing ──");
{ const { w } = N; const Dr = w.boot("Dr", "devDr"); await w.flush(); Dr.run(CAP); Dr.run("HA_LS.setItem('ha_kiosk','dad');HA_LS.setItem('ha_dryrun','1');dadUnlocked=true;1"); loadH(Dr, HJS);
  // the −100's bank line goes through bankDirect, which the app's boot-time dry-run patch (db.ref's set/update/remove → nothing) stops; the same patch here
  Dr.run("(function(){ const o=db.ref.bind(db); db.ref=function(p){ const r=o(p); r.set=r.update=r.remove=function(){ return Promise.resolve(); }; return r; }; })();1");
  await w.flush(); const m = w.mark();
  const g = Dr.run("lgGive(" + N.car + ")"); const kk = (() => { const ks = JSON.parse(Dr.run("(function(){ const wk=activeWk(), dn=_todayDay, L=((routineLog.kid_a||{})[wk]||{})[dn]||{}; return JSON.stringify(Object.keys(L).filter(function(x){ return L[x]&&L[x].act==='on'&&!L[x].flagged; }).map(function(x){ return [wk,dn,x]; })); })()")); return ks[0]; })();
  if (kk) Dr.run(dockJs(kk, "kid_a", "x")); await w.flush();
  ok("?dryrun=1, his code in: ⭐ Give stars back and 🧾 −100 show on that screen, nothing reaches the database", Dr.run("_dryRun()") === true && g === true && !!kk && w.since(m).length === 0, [g, kk, w.since(m).map(l => l.path)]);
}

try { fs.unlinkSync(BASE_IDX); } catch (e) {}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); try { fs.unlinkSync(BASE_IDX); } catch (x) {} process.exit(1); });
