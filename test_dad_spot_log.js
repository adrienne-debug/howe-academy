/*
 * test_dad_spot_log.js — DADSPOT / DADSPOTLOG: the 🔎 Spot check and the 🕵️ Click-off Log on Dad's Day, "where it is fro mom" (her
 * words 2026-11-24), with his code for every tap that moves stars ("Yes, ask for code", 2026-11-24).
 *   🔎 the same card (mdCardSpotCheck) right under 🧒 Kids today, as on Mom's Day, on Dad's own link only (_kioskD()). Locked: look-only
 *   (no ✓ / ✗ / 🎲 / ⚙) and one line on how to get the buttons; his device still makes the day's draw at school end, as Mom's does
 *   (first device's draw stands). With his code: ✓ / ✗ / 🎲 as Mom's, the result stored by:"dad". ⚙ stays Mom's.
 *   🕵️ one folded line under 🧾 Today's check-offs opens the same log (chSettingsClickoffLogHTML). Locked: no ⚠️, one line. With his
 *   code the ⚠️ marks as Mom's does (rlogFlag's gate = ckLogCanDock), "by Dad".
 * The WHOLE app runs per device (test_fixtures/house_world.js) on a made-up family (kid_a … kid_d). Thu 11/19: kid_a ticks 🛏 Make the bed
 * (2) · 🪶 Dust the shelves (10) · 🚰 Wipe the sink (10), kid_c 🧩 Toys in the bin (3), on a plain device; the penalty is on (100 ⭐).
 * Sections: A Mom = the app before, byte for byte (her card, her Day, her Log, her taps' writes; her view of Dad's Day) · B Dad locked ·
 *   C Dad with his code (= Mom's writes and bank, marked as Dad) · D the draw happens once · E the star switches · F 🔒 Lock · G a kid's
 *   device and a plain device with the Dad code · H dryrun.
 * "The app before" = THIS tree with DADSPOT / DADSPOTLOG taken out (each piece must match exactly once; no git, no pinned commit).
 * DS_INDEX = another copy (a mutation check).   run: node test_dad_spot_log.js
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os");
const W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 900) + ")" : "")); } };
const J = x => JSON.stringify(x), clone = x => JSON.parse(J(x));
const IDX = process.env.DS_INDEX || path.join(__dirname, "index.html"), HJS = fs.readFileSync(path.join(__dirname, "house.js"), "utf8");
// ── the app before: this tree, DADSPOT / DADSPOTLOG taken out ([now, before]) ──
const PIECES = [
  ["    db.ref(\"spotChecks\").on(\"value\",s=>{ spotOnValue(s.val()||{}); if(tab===\"moms-plan\"&&(momHere()||_kioskD())) renderAllSoon(); });   // 🔎 SPOTCHECK\n", "    db.ref(\"spotChecks\").on(\"value\",s=>{ spotOnValue(s.val()||{}); if(tab===\"moms-plan\"&&momHere()) renderAllSoon(); });   // 🔎 SPOTCHECK\n"],
  ["      if(on&&!e.flagged&&(typeof ckLogCanDock!==\"function\"||ckLogCanDock())) h+='<button onclick=\"rlogFlag(\\''+kid+'\\',\\''+_rlwk+'\\',\\''+e._day+'\\',\\''+e._key+'\\')\" title=\"Didn\\'t actually do it — dock 100 points\" style=\"flex-shrink:0;padding:4px 9px;border-radius:8px;border:1.5px solid #fca5a5;background:#fef2f2;color:#b91c1c;font-size:11px;font-weight:800;cursor:pointer\">⚠️ −100</button>';\n", "      if(on&&!e.flagged) h+='<button onclick=\"rlogFlag(\\''+kid+'\\',\\''+_rlwk+'\\',\\''+e._day+'\\',\\''+e._key+'\\')\" title=\"Didn\\'t actually do it — dock 100 points\" style=\"flex-shrink:0;padding:4px 9px;border-radius:8px;border:1.5px solid #fca5a5;background:#fef2f2;color:#b91c1c;font-size:11px;font-weight:800;cursor:pointer\">⚠️ −100</button>';\n"],
  ["  try{ h+=rlDadDoorHTML(); }catch(e){}   // 🕵️ DADSPOTLOG\n", ""],
  ["// DADSPOT (her words 2026-11-24: \"where it is fro mom\", \"Yes, ask for code\"): Dad's link sees the card and draws as Mom's does; ✓ / ✗ / 🎲 need his code. ⚙ stays Mom's.\nfunction _spSeeOk(){ return _spMomOk()||(typeof _kioskD===\"function\"&&_kioskD()); }\nfunction _spActOk(){ return _spMomOk()||(typeof _kioskD===\"function\"&&_kioskD()&&typeof dadAwardOk===\"function\"&&dadAwardOk()); }\nfunction _spByT(r){ return r&&r.by===\"dad\"?\" · by Dad\":\"\"; }\n", ""],
  ["  if(!(force?_spActOk():_spSeeOk())||typeof _todayDay!==\"string\") return null;   // DADSPOT\n", "  if(!_spMomOk()||typeof _todayDay!==\"string\") return null;\n"],
  ["  if(!_spActOk()||(r!==\"ok\"&&r!==\"no\")) return false;   // DADSPOT\n", "  if(!_spMomOk()||(r!==\"ok\"&&r!==\"no\")) return false;\n"],
  ["    if(pen.on&&typeof bankDirect===\"function\") bankDirect(kid,-pen.pts,\"🔎 Spot check: not done — \"+(p.label||\"\")+_spByT({by:_spBy()}));   // the rule, her switch\n", "    if(pen.on&&typeof bankDirect===\"function\") bankDirect(kid,-pen.pts,\"🔎 Spot check: not done — \"+(p.label||\"\"));   // the rule, her switch\n"],
  ["  if(_spBy()===\"dad\") res.by=\"dad\";   // DADSPOT\n", ""],
  ["    (r.picks||[]).forEach(function(p,j){ out.push({iso:k,label:p.label||\"\",emoji:p.emoji||\"\",type:p.type||\"\",ts:p.ts||\"\",r:(res[j]&&res[j].r)||\"\",by:(res[j]&&res[j].by)||\"\",n:(res[j]&&res[j].n)||r.n||SP_MIN,pen:(res[j]&&res[j].pen)||0}); }); });\n", "    (r.picks||[]).forEach(function(p,j){ out.push({iso:k,label:p.label||\"\",emoji:p.emoji||\"\",type:p.type||\"\",ts:p.ts||\"\",r:(res[j]&&res[j].r)||\"\",n:(res[j]&&res[j].n)||r.n||SP_MIN,pen:(res[j]&&res[j].pen)||0}); }); });\n"],
  ["  if(!_spSeeOk()||typeof _todayDay!==\"string\") return \"\";   // DADSPOT\n", "  if(!_spMomOk()||typeof _todayDay!==\"string\") return \"\";\n"],
  ["    +(_spMomOk()?'<button onclick=\"spSetToggle()\" title=\"What spot check picks from\" style=\"margin-left:auto;border:none;background:rgba(255,255,255,'+(spSetOpen?'0.45':'0.2')+');color:#fff;border-radius:8px;padding:3px 10px;font-size:12px;font-weight:700;cursor:pointer\">⚙</button>':'')+'</div>';\n  if(spSetOpen&&_spMomOk()) h+=spSetSheetHTML();\n", "    +'<button onclick=\"spSetToggle()\" title=\"What spot check picks from\" style=\"margin-left:auto;border:none;background:rgba(255,255,255,'+(spSetOpen?'0.45':'0.2')+');color:#fff;border-radius:8px;padding:3px 10px;font-size:12px;font-weight:700;cursor:pointer\">⚙</button></div>';\n  if(spSetOpen) h+=spSetSheetHTML();\n"],
  ["  if(_paused) h+='<div style=\"font-size:12px;font-weight:700;color:#1e3a8a;padding:6px 0\">Spot check is paused'+(_spMomOk()?' — ⚙ to pick what it checks.':'.')+'</div>';\n", "  if(_paused) h+='<div style=\"font-size:12px;font-weight:700;color:#1e3a8a;padding:6px 0\">Spot check is paused — ⚙ to pick what it checks.</div>';\n"],
  ["        +(x.pool&&_spActOk()?_cuBtn(\"spDrawNow('\"+kid+\"')\",\"🎲 Draw now\",\"#1e3a8a\",\"Pick today's spot checks now\"):'')+'</div>';\n", "        +(x.pool?_cuBtn(\"spDrawNow('\"+kid+\"')\",\"🎲 Draw now\",\"#1e3a8a\",\"Pick today's spot checks now\"):'')+'</div>';\n"],
  ["        +(r?(r.r===\"no\"?'<span style=\"font-size:11px;font-weight:800;color:#b91c1c\">✗ Not done'+_spByT(r)+'</span>':'<span style=\"font-size:11px;font-weight:800;color:#16a34a\">✓ Really done'+_spByT(r)+'</span>')\n           :!_spActOk()?'':_cuBtn(\"spResolve('\"+kid+\"',\"+j+\",'ok')\",\"✓ Really done\",\"#16a34a\",\"I looked — it was done\")+_cuBtn(\"spResolve('\"+kid+\"',\"+j+\",'no')\",\"✗ Not done\",\"#b91c1c\",\"Not done — back to not done, its own stars back off\"))+'</div>';\n", "        +(r?(r.r===\"no\"?'<span style=\"font-size:11px;font-weight:800;color:#b91c1c\">✗ Not done</span>':'<span style=\"font-size:11px;font-weight:800;color:#16a34a\">✓ Really done</span>')\n           :_cuBtn(\"spResolve('\"+kid+\"',\"+j+\",'ok')\",\"✓ Really done\",\"#16a34a\",\"I looked — it was done\")+_cuBtn(\"spResolve('\"+kid+\"',\"+j+\",'no')\",\"✗ Not done\",\"#b91c1c\",\"Not done — back to not done, its own stars back off\"))+'</div>';\n"],
  ["        +'<span style=\"font-weight:800;color:'+(e.r===\"no\"?'#b91c1c':e.r===\"ok\"?'#16a34a':'#9ca3af')+'\">'+(e.r===\"no\"?'✗ not done':e.r===\"ok\"?'✓ done':'— not checked')+(e.pen?' · −'+e.pen+' ⭐':'')+_spByT(e)+'</span><span style=\"flex:0 0 34px;text-align:right;color:var(--muted)\">'+e.n+'/day</span></div>'; });\n", "        +'<span style=\"font-weight:800;color:'+(e.r===\"no\"?'#b91c1c':e.r===\"ok\"?'#16a34a':'#9ca3af')+'\">'+(e.r===\"no\"?'✗ not done':e.r===\"ok\"?'✓ done':'— not checked')+(e.pen?' · −'+e.pen+' ⭐':'')+'</span><span style=\"flex:0 0 34px;text-align:right;color:var(--muted)\">'+e.n+'/day</span></div>'; });\n"],
  ["  if(!_spActOk()) h+='<div style=\"font-size:11.5px;color:#6b7280;margin-top:6px\">🔒 Put your code in under Star controls to use ✓ Really done, ✗ Not done and 🎲 Draw now.</div>';   // DADSPOT: a locked Dad\n", ""],
  ["// DADSPOTLOG_START — 🕵️ the Click-off Log on Dad's Day (her words 2026-11-24: \"where it is fro mom\"): one folded line under 🧾 opens\n// the same log (chSettingsClickoffLogHTML); its ⚠️ needs his code (ckLogCanDock, as 🧾's −100). Dad's link only.\nlet rlDadOpen=false;\nfunction rlDadToggle(){ rlDadOpen=!rlDadOpen; if(typeof renderAll===\"function\") renderAll(); }\nfunction rlDadDoorHTML(){\n  if(!_kioskD()) return \"\";\n  return '<div onclick=\"rlDadToggle()\" style=\"margin:10px 12px 0;background:#fff;border-radius:12px;padding:10px 14px;display:flex;font-size:12.5px;font-weight:800;color:#4c1d95;cursor:pointer;box-shadow:0 4px 20px rgba(43,122,120,0.13)\">🕵️ Click-off Log (this week)<span style=\"margin-left:auto\">'+(rlDadOpen?'▲':'›')+'</span></div>'\n    +(rlDadOpen?'<div style=\"margin:0 12px\">'+chSettingsClickoffLogHTML()+(ckLogCanDock()?'':'<div style=\"font-size:11.5px;color:#6b7280;margin-top:6px\">🔒 Put your code in under Star controls to use ⚠️ −100.</div>')+'</div>':'');\n}\n// DADSPOTLOG_END\n", ""],
  ["  if(bank&&(dadCtl===undefined||(typeof _kioskD===\"function\"&&_kioskD()))&&typeof mdCardSpotCheck===\"function\"){ try{ h+=mdCardSpotCheck(); }catch(e){} }   // 🔎 SPOTCHECK: Mom's Day, and Dad's Day on his link (DADSPOT)\n", "  if(bank&&dadCtl===undefined&&typeof mdCardSpotCheck===\"function\"){ try{ h+=mdCardSpotCheck(); }catch(e){} }   // 🔎 SPOTCHECK: Mom's Day only\n"],
  ["  if(!(typeof ckLogCanDock===\"function\"?ckLogCanDock():momHere())) return;   // DADSPOTLOG: Mom, or Dad's link with his code\n", "  if(!momHere()) return;   // Mom-only; the Log card lives behind the Admin PIN too\n"]
];
const BASE_IDX = (() => { let s = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  for (const [a, b] of PIECES) { const n = s.split(a).length - 1; if (n !== 1) throw new Error("test_dad_spot_log: the app before cannot be built — " + J(a.slice(0, 70)) + " found " + n + "×"); s = s.replace(a, () => b); }
  if (/DADSPOT|_spSeeOk|_spActOk|rlDadDoorHTML/.test(s)) throw new Error("test_dad_spot_log: the app before still has DADSPOT");
  const t = path.join(os.tmpdir(), "dad_spot_log_before_" + process.pid + ".html"); fs.writeFileSync(t, s); return t; })();
console.log("(the app before: this tree with DADSPOT / DADSPOTLOG taken out)");

const K = o => Object.assign({ src: { kind: "routine" }, status: "active", area: "cleaning", verdict: "", note: "", level: 1, minutes: 5 }, o);
const FAM = () => ({
  a_bed: K({ label: "Make the bed", emoji: "🛏", who: "kid_a", slot: "chores", cad: "daily", pts: 2, order: 0 }),
  a_dust: K({ label: "Dust the shelves", emoji: "🪶", who: "kid_a", slot: "chores", cad: "daily", pts: 10, order: 1 }),
  a_sink: K({ label: "Wipe the sink", emoji: "🚰", who: "kid_a", slot: "chores", cad: "daily", pts: 10, order: 2 }),
  c_toys: K({ label: "Toys in the bin", emoji: "🧩", who: "kid_c", slot: "chores", cad: "daily", pts: 3, order: 0 })
});
const CAP = "globalThis.__cf=[];globalThis.__say=true;confirm=function(m){ __cf.push(m); return __say; };tab='moms-plan';HA_LS.setItem('ha_ledger_hello','1');1";
async function mkWorld(index) {
  const w = await W.world({ index, household: { jobs: FAM(), people: clone(W.PEOPLE), meta: { takeover: 1, engine: { mode: "preview", on: "2026-11-09" } } }, tree: { config: clone(W.FX.db.config), settings: clone(W.FX.db.settings || {}) } });
  const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"), Dd = w.boot("D", "devD"), Kk = w.boot("Kk", "devK"), P = w.boot("P", "devP");
  Dd.run("HA_LS.setItem('ha_kiosk','dad');1"); Kk.run("HA_LS.setItem('ha_kiosk','routines');1");
  for (const d of [A, B, Dd, Kk, P]) d.run(CAP);
  await w.flush(); return { w, A, B, Dd, Kk, P };
}
const ITEMS = [["kid_a", "Make the bed"], ["kid_a", "Dust the shelves"], ["kid_a", "Wipe the sink"], ["kid_c", "Toys in the bin"]];
const idxOf = (d, kid, label) => d.run("(function(){ day=_todayDay; return (rtStepsFor('chores','" + kid + "',false,day)||[]).findIndex(function(x){ return x&&x.label===" + J(label) + "; }); })()");
const tickAll = async S => { for (const [k, l] of ITEMS) { const i = idxOf(S.B, k, l); S.B.run("(function(){ day=_todayDay; toggleRtStep('chores','" + k + "'," + i + "); })()"); } await S.w.flush(); };
const page = (d, f) => { d.run("globalThis.__el={innerHTML:'',style:{},appendChild(){},querySelector(){ return null; },querySelectorAll(){ return []; }};1"); try { d.run(f + "(__el);1"); } catch (e) { return "threw " + e.message; } return d.run("__el.innerHTML"); };
const txt = h => String(h || "").replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const SPC = d => d.run("mdCardSpotCheck()"), LOG = d => d.run("chSettingsClickoffLogHTML()");
const DOOR = (d, open) => d.run("(function(){ rlDadOpen=" + !!open + "; return rlDadDoorHTML(); })()");
// the pieces a locked Dad doesn't get, as Mom's card draws them
const GEAR = /<button onclick="spSetToggle\(\)"[^>]*>⚙<\/button>/g, DRAW = /<button onclick="event\.stopPropagation\(\);spDrawNow\('[^']*'\)"[^>]*>🎲 Draw now<\/button>/g,
  RES = /<button onclick="event\.stopPropagation\(\);spResolve\([^)]*\)"[^>]*>[^<]*<\/button>/g, WARN = /<button onclick="rlogFlag\([^"]*\)" title="[^"]*" style="[^"]*">⚠️ −100<\/button>/g;
const SPTIP = '<div style="font-size:11.5px;color:#6b7280;margin-top:6px">🔒 Put your code in under Star controls to use ✓ Really done, ✗ Not done and 🎲 Draw now.</div>';
const LOGTIP = '<div style="font-size:11.5px;color:#6b7280;margin-top:6px">🔒 Put your code in under Star controls to use ⚠️ −100.</div>';
const DOORLINE = o => '<div onclick="rlDadToggle()" style="margin:10px 12px 0;background:#fff;border-radius:12px;padding:10px 14px;display:flex;font-size:12.5px;font-weight:800;color:#4c1d95;cursor:pointer;box-shadow:0 4px 20px rgba(43,122,120,0.13)">🕵️ Click-off Log (this week)<span style="margin-left:auto">' + (o ? '▲' : '›') + '</span></div>';
// Mom's card → a locked Dad's (no ⚙ / 🎲 / ✓ / ✗, the line at the foot) or an unlocked Dad's (no ⚙)
const lockedSP = h => { h = h.replace(GEAR, "").replace(DRAW, "").replace(RES, ""); const i = h.lastIndexOf("</div></div>"); return h.slice(0, i) + SPTIP + h.slice(i); };
const openSP = h => h.replace(GEAR, "");
const lockedDoor = log => DOORLINE(true) + '<div style="margin:0 12px">' + log.replace(WARN, "") + LOGTIP + '</div>';
const openDoor = log => DOORLINE(true) + '<div style="margin:0 12px">' + log + '</div>';
// each write as [op, path, the value now there] — a bank line's id and a push key are random, the times are the clock's
const norm = p => p.replace(/(\/adjustments\/)[^/]+$/, "$1*").replace(/-P\d+/g, "-P*");
const vals = (w, m) => w.since(m || 0).map(l => { let v = w.get(l.path); v = v && typeof v === "object" ? clone(v) : v; if (v && typeof v === "object") { delete v.ts; delete v.iso; delete v.flagTs; delete v.at; } return [l.op, norm(l.path), v === undefined ? null : v, l.committed === undefined ? "" : l.committed]; }).sort((a, b) => J(a) < J(b) ? -1 : 1);
// Dad's writes, read as Mom's: who → mom, the result's by out
const asMom = v => J(v).replace(/"bid":"[^"]*"/g, "\"bid\"").replace(/,"by":"dad"/g, "").replace(/Dad undid/g, "Mom undid").replace(/"undo":"dad"/g, '"undo":"mom"').replace(/"flagBy":"dad"/g, '"flagBy":"mom"').replace(/ · by Dad/g, "");
const asMomO = v => J(v).replace(/"bid":"[^"]*"/g, "\"bid\"").replace(/ · by Mom/g, "");
const bankOf = (w, kid) => Object.values(w.get("bank/" + kid + "/adjustments") || {}).map(a => [a.amount, a.note]).sort((x, y) => J(x) < J(y) ? -1 : 1);
const bal = (d, kid) => d.run("bankBalance(" + J(kid) + ")");
const lock = (d, on) => d.run("dadUnlocked=" + (on ? "false" : "true") + ";1");
const spDay = (d, kid) => d.run("JSON.stringify((spDay(" + J(kid) + ")||{}).picks||null)");
const logKey = (d, kid, label) => JSON.parse(d.run("(function(){ const wk=activeWk(), dn=_todayDay, L=((routineLog[" + J(kid) + "]||{})[wk]||{})[dn]||{}; const k=Object.keys(L).filter(function(k){ return L[k]&&L[k].act==='on'&&!L[k].flagged&&L[k].label===" + J(label) + "; }).pop(); return JSON.stringify(k?[wk,dn,k]:null); })()"));
const flagJs = (k, kid) => "rlogFlag('" + kid + "','" + k.join("','") + "')";
const txs = (w, m) => w.since(m).filter(l => l.op === "tx").map(l => [l.path, l.dev, l.committed]);
const loadH = d => { if (d.run("typeof lgRuleTake") !== "function") d.run(HJS); };
const SRC = fs.readFileSync(IDX, "utf8"), BASE_SRC = fs.readFileSync(BASE_IDX, "utf8");
const SPREC = src => { const i = src.indexOf("function spRecord(kid){"), j = src.indexOf("\n}\n", i); return "(" + src.slice(i, j + 2) + ")"; };
const ISO1 = "2026-11-19", ISO2 = "2026-11-20", ISO3 = "2026-11-21";

(async () => {
const N = await mkWorld(IDX), O = await mkWorld(BASE_IDX);
for (const S of [N, O]) { await S.w.at(2026, 11, 19, 7, 0); S.A.run("spSetPenOn()"); await S.w.flush(); await S.w.at(2026, 11, 19, 8, 0); await tickAll(S); await S.w.at(2026, 11, 19, 10, 0); }
ok("the setup: Thu 11/19 10 AM, the penalty on (100 ⭐), kid_a's pool 3 and kid_c's 1 (both worlds)", [N, O].every(S => S.A.run("JSON.stringify([spPenalty(),spPool('kid_a',_todayDay).length,spPool('kid_c',_todayDay).length])") === J([{ on: true, pts: 100 }, 3, 1])));

// ── A ──
console.log("\n── A · Mom: the app before, byte for byte ──");
ok("her 🔎 card before the draw (🎲 Draw now, ⚙): byte for byte the app before's", SPC(N.A) === SPC(O.A) && /spDrawNow/.test(SPC(N.A)) && GEAR.test(SPC(N.A)) && SPC(N.A).indexOf(SPTIP) < 0);
ok("Mom's Day: byte for byte the app before's", page(N.A, "renderMomsPlan") === page(O.A, "renderMomsPlan") && /id="sp-card"/.test(page(N.A, "renderMomsPlan")));
ok("her Chores & Stars ▸ Log tab (chSettingsClickoffLogHTML): byte for byte the app before's, ⚠️ on every line", LOG(N.A) === LOG(O.A) && (LOG(N.A).match(WARN) || []).length === 4);
ok("Dad's Day as Mom sees it on her own device: byte for byte the app before's (no 🔎 card, no 🕵️ line)", page(N.A, "renderDadsDay") === page(O.A, "renderDadsDay") && !/sp-card|rlDadToggle/.test(page(N.A, "renderDadsDay")));
// the draw is random per device: Mom's draw in the new world, written for the app before's too, so both check the same picks
for (const S of [N, O]) await S.w.at(2026, 11, 19, 16, 30);
{ const m = N.w.mark(); SPC(N.A); await N.w.flush();
  ok("4:30 PM, her card draws today's picks: one transaction per kid with a pool, from her device (kid_a 2, kid_c 1)", J(txs(N.w, m)) === J([["spotChecks/kid_a/" + ISO1, "devA", true], ["spotChecks/kid_c/" + ISO1, "devA", true]]) && JSON.parse(spDay(N.A, "kid_a")).length === 2, txs(N.w, m));
  O.A.run("db.ref('spotChecks/kid_a/" + ISO1 + "').set(" + J(N.w.get("spotChecks/kid_a/" + ISO1)) + ");db.ref('spotChecks/kid_c/" + ISO1 + "').set(" + J(N.w.get("spotChecks/kid_c/" + ISO1)) + ");1"); await O.w.flush(); }
ok("…her card with picks (✓ / ✗ on each): byte for byte the app before's", SPC(N.A) === SPC(O.A) && (SPC(N.A).match(RES) || []).length === 6);
{ const r = []; for (const S of [N, O]) { const m = S.w.mark(); S.A.run("__cf=[];1"); const a = S.A.run("spResolve('kid_c',0,'ok')"); await S.w.flush(); r.push([a, vals(S.w, m), bankOf(S.w, "kid_c")]); }
  ok("her ✓ Really done (kid_c's toys): the same writes as the app before's, no by", J(r[0]) === J(r[1]) && r[0][0] === true && r[0][1].length === 1 && !("by" in r[0][1][0][2]), r[0]); }
// the two devices on one pick: Dad, with his code, hears hers first
{ lock(N.Dd, false); const m = N.w.mark(); N.Dd.run("__cf=[];1");
  ok("two devices, one pick: Dad's ✗ on the toys Mom just checked (his code in) does nothing — no ask, zero writes", N.Dd.run("spResolve('kid_c',0,'no')") === false && N.Dd.run("__cf.length") === 0 && (await N.w.flush(), N.w.since(m).length === 0) && !/spResolve\('kid_c'/.test(SPC(N.Dd))); lock(N.Dd, true); }
{ const r = []; for (const S of [N, O]) { const k = logKey(S.A, "kid_c", "Toys in the bin"), m = S.w.mark(); S.A.run("__cf=[];1"); S.A.run(flagJs(k, "kid_c")); await S.w.flush(); r.push([S.A.run("__cf.length"), vals(S.w, m), bankOf(S.w, "kid_c")]); }
  ok("her ⚠️ −100 in the Log (kid_c's toys): the same ask, writes and bank as the app before's (by Mom)", J(r[0]) === J(r[1]) && r[0][0] === 1 && r[0][2].some(a => a[0] === -100 && / · by Mom$/.test(a[1])), r[0]); }
ok("…her Log afterwards: byte for byte the app before's (\"🚩 by Mom · −100\")", LOG(N.A) === LOG(O.A) && /🚩 by Mom · −100/.test(LOG(N.A)));

// ── B ──
console.log("\n── B · Dad's link, locked: look-only, one line says how, every tap refused ──");
{ lock(N.Dd, true); lock(O.Dd, true);
  const c = SPC(N.Dd);
  ok("🔎 his card: Mom's card without ✓ / ✗ / ⚙, with the line \"🔒 Put your code in under Star controls to use ✓ Really done, ✗ Not done and 🎲 Draw now.\"", c === lockedSP(SPC(N.A)) && !/spResolve|spDrawNow|spSetToggle/.test(c) && c.indexOf(SPTIP) > 0 && /✓ Really done/.test(txt(c)), txt(c).slice(0, 300));
  const dp = page(N.Dd, "renderDadsDay"), i1 = dp.indexOf('id="sp-card"'), iK = dp.indexOf("🔒 Star controls"), iC = dp.indexOf("Today’s check-offs"), iD = dp.indexOf("rlDadToggle()");
  ok("on Dad's Day: the card right after 🧒 Kids today (after the 🔒 Star controls row and the kid rows, before 🧾), and the 🕵️ line right after 🧾", iK > 0 && i1 > iK && iC > i1 && iD > iC && dp.indexOf(lockedSP(SPC(N.A))) > 0 && dp.indexOf(DOORLINE(false)) === iD - 14, [iK, i1, iC, iD]);
  N.Dd.run("var __sp=mdCardSpotCheck,__rd=rlDadDoorHTML;mdCardSpotCheck=function(){ return ''; };rlDadDoorHTML=function(){ return ''; };1"); const rest = page(N.Dd, "renderDadsDay"); N.Dd.run("mdCardSpotCheck=__sp;rlDadDoorHTML=__rd;1");
  ok("…the rest of Dad's Day: byte for byte the app before's", rest === page(O.Dd, "renderDadsDay"));
  ok("🕵️ folded (as it opens): one line \"🕵️ Click-off Log (this week) ›\"", DOOR(N.Dd, false) === DOORLINE(false));
  const d = DOOR(N.Dd, true);
  ok("…opened: Mom's Log byte for byte without ⚠️, every line and her 🚩 mark, then \"🔒 Put your code in under Star controls to use ⚠️ −100.\"", d === lockedDoor(LOG(N.A)) && !/rlogFlag/.test(d) && /🚩 by Mom · −100/.test(d) && (LOG(N.A).match(WARN) || []).length === 3);
  N.Dd.run("rlDadOpen=false;1");
  const m = N.w.mark(), b0 = J(bankOf(N.w, "kid_a")); N.Dd.run("__cf=[];1");
  const r = [N.Dd.run("spResolve('kid_a',0,'no')"), N.Dd.run("spResolve('kid_a',1,'ok')"), N.Dd.run(flagJs(logKey(N.Dd, "kid_a", "Dust the shelves"), "kid_a"))];
  await N.w.flush();
  ok("spResolve ✗ / ✓ and the Log's rlogFlag from a locked Dad: refused, no ask, zero writes, the bank unchanged", J(r) === J([false, false, null]) && N.Dd.run("__cf.length") === 0 && N.w.since(m).length === 0 && J(bankOf(N.w, "kid_a")) === b0, r);
}

// ── C ──
console.log("\n── C · Dad's link, his code in: ✓ / ✗ / ⚠️ as Mom's, marked as Dad ──");
{ lock(N.Dd, false);
  const c = SPC(N.Dd);
  ok("🔎 his card: Mom's card without the ⚙ (the picks' settings and the penalty stay hers); ✓ / ✗ on kid_a's picks; no line", c === openSP(SPC(N.A)) && (c.match(RES) || []).length === 4 && c.indexOf(SPTIP) < 0 && !/spSetToggle/.test(c));
  // his ✗ on kid_a's first pick (N) against Mom's on the same pick in the app before (O)
  const r = []; for (const [S, d] of [[N, N.Dd], [O, O.A]]) { const m = S.w.mark(), b0 = bal(S.A, "kid_a"); d.run("__cf=[];1"); const a = d.run("spResolve('kid_a',0,'no')"); await S.w.flush(); r.push({ a, ask: d.run("__cf[0]"), w: vals(S.w, m), b: bal(S.A, "kid_a") - b0, bank: bankOf(S.w, "kid_a") }); }
  const P0 = N.w.get("spotChecks/kid_a/" + ISO1).picks[0];
  ok("his ✗ Not done: the same ask, writes and bank as Mom's (the chore back to not done, its own " + P0.pts + " ⭐ back off, −100 the rule, the count up to 3)", r[0].a === true && r[0].ask === r[1].ask && asMom(r[0].w) === asMomO(r[1].w) && r[0].b === r[1].b && r[0].b === -P0.pts - 100 && N.w.get("spotChecks/kid_a/level").n === 3, [r[0].w, r[1].w]);
  const res = N.w.get("spotChecks/kid_a/" + ISO1 + "/results/0");
  ok("…marked as Dad: the result by:\"dad\"; the bank lines \"↩︎ Dad undid: " + P0.label + "\" and \"🔎 Spot check: not done — " + P0.label + " · by Dad\"", res.by === "dad" && res.r === "no" && r[0].bank.some(a => a[0] === -P0.pts && a[1] === "↩︎ Dad undid: " + P0.label) && r[0].bank.some(a => a[0] === -100 && a[1] === "🔎 Spot check: not done — " + P0.label + " · by Dad"), [res, r[0].bank]);
  const r2 = []; for (const [S, d] of [[N, N.Dd], [O, O.A]]) { const m = S.w.mark(); const a = d.run("spResolve('kid_a',1,'ok')"); await S.w.flush(); r2.push([a, vals(S.w, m)]); }
  ok("his ✓ Really done: the same write as Mom's, plus by:\"dad\"", r2[0][0] === true && asMom(r2[0][1]) === asMomO(r2[1][1]) && N.w.get("spotChecks/kid_a/" + ISO1 + "/results/1").by === "dad", r2);
  for (const d of [N.A, O.A, N.Dd]) d.run("globalThis.__spR0=spRecord;spRecord=" + SPREC(d === O.A ? BASE_SRC : SRC) + ";spRecOpen='kid_a';1");   // the card's own spRecord (a later spRecord(f) shadows it: noticed, not built)
  const t = txt(SPC(N.A));
  ok("drawn on Mom's card: \"✗ Not done · by Dad\", \"✓ Really done · by Dad\", and in 📜 record \"✗ not done · −100 ⭐ · by Dad\"; on his the same; otherwise the app before's", new RegExp(P0.label + " [^·]*· ticked [^✗]*✗ Not done · by Dad").test(t) && /✓ Really done · by Dad/.test(t) && /✗ not done · −100 ⭐ · by Dad/.test(t) && /✓ done · by Dad/.test(t) && SPC(N.Dd) === openSP(SPC(N.A)) && SPC(N.A).replace(/ · by Dad/g, "") === SPC(O.A), t.slice(0, 400));
  for (const d of [N.A, O.A, N.Dd]) d.run("spRecord=__spR0;spRecOpen='';1");
  ok("🕵️ opened: Mom's Log byte for byte, ⚠️ on each line not marked, no line", DOOR(N.Dd, true) === openDoor(LOG(N.A)) && (DOOR(N.Dd, true).match(WARN) || []).length === 3);
  const f = []; for (const [S, d] of [[N, N.Dd], [O, O.A]]) { const k = logKey(S.A, "kid_a", "Dust the shelves"), m = S.w.mark(); d.run("__cf=[];1"); d.run(flagJs(k, "kid_a")); await S.w.flush(); f.push({ ask: d.run("__cf[0]"), w: vals(S.w, m), rec: S.w.get("routineLog/kid_a/" + k.join("/")) }); }
  ok("his ⚠️ −100: the same ask, writes and bank as Mom's; the mark flagBy \"dad\", the bank line \"🚩 false check-off dock · by Dad\"", f[0].ask === f[1].ask && asMom(f[0].w) === asMom(f[1].w).replace(/ · by Mom/g, "") && f[0].rec.flagBy === "dad" && f[0].w.some(x => x[2] && x[2].note === "🚩 false check-off dock · by Dad"), [f[0].w, f[1].w]);
  ok("…drawn \"🚩 by Dad · −100\" in his Log and in Mom's, no ⚠️ on it", /Dust the shelves<\/span> <span style="color:#b91c1c;font-weight:800">🚩 by Dad · −100/.test(DOOR(N.Dd, true)) && /🚩 by Dad · −100/.test(LOG(N.A)) && DOOR(N.Dd, true) === openDoor(LOG(N.A)));
  N.Dd.run("rlDadOpen=false;1");
  N.Dd.run("spSetOpen=true;1"); const m = N.w.mark(), c2 = SPC(N.Dd);
  const g = [N.Dd.run("spSetType('chore')"), N.Dd.run("spSetPenOn()"), N.Dd.run("spSetPenPts(5)")]; await N.w.flush(); N.Dd.run("spSetOpen=false;1");
  ok("the ⚙ stays Mom's: his card draws no sheet even when it is set open; spSetType / spSetPenOn / spSetPenPts refused, zero writes", !/What spot check picks from|spSetType|spSetPen/.test(c2) && J(g) === J([false, false, false]) && N.w.since(m).length === 0 && N.Dd.run("JSON.stringify(spPenalty())") === J({ on: true, pts: 100 }), g);
}

// ── D ──
console.log("\n── D · the draw of the day happens once, whichever device comes first ──");
const mirror = async (iso, h) => { await O.w.at(2026, 11, +iso.slice(8), 8, 0); await tickAll(O); await O.w.at(2026, 11, +iso.slice(8), 16, h || 31);
  O.A.run("db.ref('spotChecks/kid_a/" + iso + "').set(" + J(N.w.get("spotChecks/kid_a/" + iso)) + ");db.ref('spotChecks/kid_c/" + iso + "').set(" + J(N.w.get("spotChecks/kid_c/" + iso)) + ");1"); await O.w.flush(); };   // the app before's world keeps step: the same ticks, N's picks
{ const { w, A, Dd } = N;
  await w.at(2026, 11, 20, 8, 0); await tickAll(N); await w.at(2026, 11, 20, 16, 30); lock(Dd, true);
  let m = w.mark(); SPC(Dd); await w.flush(); const t1 = txs(w, m);
  ok("Fri 4:30 PM, Dad's device first (locked): his card draws the day — one transaction per kid with a pool, both committed, from his device", J(t1) === J([["spotChecks/kid_a/" + ISO2, "devD", true], ["spotChecks/kid_c/" + ISO2, "devD", true]]), t1);
  m = w.mark(); const mc = SPC(A); await w.flush();
  ok("…then Mom's card: no draw (no transaction), the same picks as his", txs(w, m).length === 0 && spDay(A, "kid_a") === spDay(Dd, "kid_a") && spDay(A, "kid_c") === spDay(Dd, "kid_c") && /spResolve\('kid_a',0,'ok'\)/.test(mc));
  m = w.mark(); SPC(Dd); SPC(A); Dd.run("spDrawNow('kid_a')"); lock(Dd, false); Dd.run("spDrawNow('kid_a')"); lock(Dd, true); await w.flush();
  ok("…every card drawn again and 🎲 (locked and unlocked): nothing drawn again, no transaction", txs(w, m).length === 0);
  await mirror(ISO2);
  await w.at(2026, 11, 21, 8, 0); await tickAll(N); await w.at(2026, 11, 21, 16, 30);
  m = w.mark(); SPC(A); await w.flush(); SPC(Dd); await w.flush();
  ok("Sat, Mom's device first: her draw stands; Dad's card after it draws nothing", J(txs(w, m)) === J([["spotChecks/kid_a/" + ISO3, "devA", true], ["spotChecks/kid_c/" + ISO3, "devA", true]]) && spDay(Dd, "kid_a") === spDay(A, "kid_a"));
  await mirror(ISO3);
  // before either has heard the other: the database keeps the first
  await w.at(2026, 11, 22, 8, 0); await tickAll(N); await w.at(2026, 11, 22, 16, 30);
  m = w.mark(); const a0 = SPC(A); const d0 = SPC(Dd); await w.flush(); const t = txs(w, m);
  ok("Sun, both cards at once (neither has heard the other): the second device's transaction is refused — one draw stored, Mom's", J(t.filter(x => x[2])) === J([["spotChecks/kid_a/2026-11-22", "devA", true], ["spotChecks/kid_c/2026-11-22", "devA", true]]) && t.filter(x => !x[2] && x[1] === "devD").length === 2 && J(w.get("spotChecks/kid_a/2026-11-22").picks) === spDay(A, "kid_a"), t);
  await mirror("2026-11-22");
  await w.at(2026, 11, 23, 7, 0);
}

// ── E ──
console.log("\n── E · the star switches: Take stars away off, ⏸ Pause — his taps as hers ──");
{ for (const S of [N, O]) { await S.w.at(2026, 11, 23, 8, 0); await tickAll(S); loadH(S.A); S.A.run("lgRuleTake('kid_a')"); await S.w.flush(); await S.w.at(2026, 11, 23, 16, 29); }
  // the same picks in both worlds: Mom's from the new world, written for the app before's too
  N.A.run("mdCardSpotCheck();1"); await N.w.flush(); const p = N.w.get("spotChecks/kid_a/2026-11-23"), pc = N.w.get("spotChecks/kid_c/2026-11-23");
  O.A.run("mdCardSpotCheck();1"); await O.w.flush();   // her own draw first (it settles the count, as in the new world), then the new world's picks over it
  O.A.run("db.ref('spotChecks/kid_a/2026-11-23').set(" + J(p) + ");db.ref('spotChecks/kid_c/2026-11-23').set(" + J(pc) + ");1"); await O.w.flush();
  ok("the setup: Mon 11/23, Take stars away off for kid_a (both worlds), the same picks", spDay(N.A, "kid_a") === spDay(O.A, "kid_a") && N.A.run("starTakeOk('kid_a')") === false && O.A.run("starTakeOk('kid_a')") === false && p.picks.length >= 2 && pc.picks.length === 1);
  lock(N.Dd, false);
  const r = []; for (const [S, d] of [[N, N.Dd], [O, O.A]]) { const m = S.w.mark(), b0 = bal(S.A, "kid_a"); d.run("__cf=[];1"); d.run("spResolve('kid_a',0,'no')"); await S.w.flush(); r.push({ ask: d.run("__cf[0]"), w: vals(S.w, m), b: bal(S.A, "kid_a") - b0 }); }
  ok("Take stars away off: his ✗ = Mom's — the same ask (\"…so nothing more comes off\"), no −100, only the chore's own stars back off", r[0].ask === r[1].ask && /so nothing more comes off/.test(r[0].ask) && asMom(r[0].w) === asMomO(r[1].w) && r[0].b === r[1].b && !r[0].w.some(x => x[2] && /Spot check: not done/.test(x[2].note || "")), [r[0], r[1]]);
  const f = []; for (const [S, d] of [[N, N.Dd], [O, O.A]]) { const k = logKey(S.A, "kid_a", "Wipe the sink"), m = S.w.mark(); d.run("__cf=[];1"); d.run(flagJs(k, "kid_a")); await S.w.flush(); f.push({ ask: d.run("__cf[0]"), w: vals(S.w, m), rec: S.w.get("routineLog/kid_a/" + k.join("/")) }); }
  ok("…his ⚠️: = Mom's — the 🚩 mark, penalty 0, no bank line (flagBy \"dad\")", f[0].ask === f[1].ask && asMom(f[0].w) === asMom(f[1].w) && f[0].rec.penalty === 0 && f[0].rec.flagBy === "dad" && f[0].w.length === 1, [f[0].w, f[1].w]);
  for (const S of [N, O]) { S.A.run("lgRuleTake('kid_a');lgRulePause()"); await S.w.flush(); }
  const q = []; for (const [S, d] of [[N, N.Dd], [O, O.A]]) { const m = S.w.mark(), b0 = bal(S.A, "kid_c"); d.run("__cf=[];1"); d.run("spResolve('kid_c',0,'no')"); await S.w.flush(); q.push({ ask: d.run("__cf[0]"), w: vals(S.w, m), b: bal(S.A, "kid_c") - b0 }); }
  ok("⏸ Pause: his ✗ on kid_c = Mom's — no −100, the toys' own 3 ⭐ back off", q[0].ask === q[1].ask && /paused/i.test(q[0].ask) && asMom(q[0].w) === asMomO(q[1].w) && q[0].b === q[1].b && q[0].b === -3, [q[0], q[1]]);
  for (const S of [N, O]) { S.A.run("lgRulePause()"); await S.w.flush(); }
}

// ── F ──
console.log("\n── F · 🔒 Lock: refused again ──");
{ const { w, A, Dd } = N; Dd.run("dadLock();1");
  const c = SPC(Dd), m = w.mark(), b0 = J(bankOf(w, "kid_a")); Dd.run("__cf=[];1");
  const r = [Dd.run("spResolve('kid_a',1,'ok')"), Dd.run("spResolve('kid_a',1,'no')"), Dd.run(flagJs(logKey(Dd, "kid_a", "Dust the shelves"), "kid_a"))]; await w.flush();
  ok("after Lock: his card has no ✓ / ✗ and the line again (= Mom's minus the buttons); the 🕵️ log has no ⚠️ and its line", Dd.run("dadAwardOk()") === false && c === lockedSP(SPC(A)) && DOOR(Dd, true) === lockedDoor(LOG(A)));
  ok("…✓, ✗ and ⚠️ refused: no ask, zero writes, the bank unchanged", J(r) === J([false, false, null]) && Dd.run("__cf.length") === 0 && w.since(m).length === 0 && J(bankOf(w, "kid_a")) === b0, r);
  Dd.run("rlDadOpen=false;1");
}

// ── G ──
console.log("\n── G · a kid's device and a plain device with the Dad code: nothing ──");
{ const { w, B, Kk, P } = N; B.run("kcKid='kid_a';1"); O.B.run("kcKid='kid_a';1");
  ok("the Kids' Corner: byte for byte the app before's", page(B, "renderKidsCorner") === page(O.B, "renderKidsCorner"));
  for (const [nm, d] of [["a kid's device (Kids' routines link)", Kk], ["a plain device, the Dad code typed", P]]) {
    d.run("dadUnlocked=true;1"); const m = w.mark(); d.run("__cf=[];1");
    const r = [d.run("mdCardSpotCheck()"), d.run("rlDadDoorHTML()"), d.run("spResolve('kid_a',1,'ok')"), d.run("spEnsureDraw('kid_b',true)"), (d.run("spDrawNow('kid_a')"), 0), d.run(flagJs(logKey(N.A, "kid_a", "Dust the shelves"), "kid_a"))]; await w.flush();
    ok(nm + ": no card, no 🕵️ line, ✓ / 🎲 / ⚠️ refused, no ask, zero writes", J(r) === J(["", "", false, null, 0, null]) && d.run("__cf.length") === 0 && w.since(m).length === 0, r);
    d.run("dadUnlocked=false;1");
  }
}

// ── H ──
console.log("\n── H · dryrun writes nothing ──");
{ const { w } = N; const Dr = w.boot("Dr", "devDr"); await w.flush(); Dr.run(CAP); Dr.run("HA_LS.setItem('ha_kiosk','dad');HA_LS.setItem('ha_dryrun','1');dadUnlocked=true;1");
  Dr.run("(function(){ const o=db.ref.bind(db); db.ref=function(p){ const r=o(p); r.set=r.update=r.remove=function(){ return Promise.resolve(); }; return r; }; })();1");   // the app's own boot-time dry-run patch
  await w.at(2026, 11, 24, 8, 0); await tickAll(N); await w.at(2026, 11, 24, 10, 0);
  { const m = w.mark(); N.Dd.run("dadUnlocked=false;spDrawNow('kid_a');1"); await w.flush(); const t0 = txs(w, m); N.Dd.run("dadUnlocked=true;spDrawNow('kid_a');spDrawNow('kid_a');1"); await w.flush(); const t1 = txs(w, m); N.Dd.run("dadUnlocked=false;1");
    ok("Tue 10 AM (before school end): 🎲 Draw now from a locked Dad draws nothing; with his code it draws kid_a's picks once, as Mom's 🎲 does (a second tap: nothing)", t0.length === 0 && J(t1) === J([["spotChecks/kid_a/2026-11-24", "devD", true]]) && spDay(N.A, "kid_a") !== "null", [t0, t1]); }
  await w.at(2026, 11, 24, 16, 30);
  const m = w.mark(); const c = SPC(Dr); const a = Dr.run("spResolve('kid_a',0,'no')"); const k = logKey(Dr, "kid_a", "Dust the shelves"); if (k) Dr.run(flagJs(k, "kid_a")); await w.flush();
  ok("?dryrun=1, his code in: the draw, ✗ and ⚠️ show on that screen, nothing reaches the database", Dr.run("_dryRun()") === true && /id="sp-card"/.test(c) && a === true && !!k && Dr.run("spDay('kid_a').results[0].by") === "dad" && w.since(m).length === 0, w.since(m).map(l => l.path));
}

try { fs.unlinkSync(BASE_IDX); } catch (e) {}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); try { fs.unlinkSync(BASE_IDX); } catch (x) {} process.exit(1); });
