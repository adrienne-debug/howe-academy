/*
 * test_flag_mark_who.js — FLAGWHO: the 🚩 mark on a false check-off says who made it, and "Take stars away" off still marks (her words
 * 2026-11-23: "Yes, mark it", then "also put who makred mom or dad"). index.html: block FLAGWHO (inside CKLOG: flagWho, flagWhoName,
 * flagMarkTxt, flagOffAsk), rlogFlag (the Click-off Log's ⚠️ −100), ckLogDock (🧾 Today's check-offs' −100), the two drawings.
 *   Take stars away ON  → as before (ask, −100, the 🚩 mark) + the mark stores flagBy "mom"/"dad" + the bank line ends " · by Mom/Dad".
 *   Take stars away OFF for that kid, or ⏸ paused → the tap still asks (the words say no stars come off and why); yes = the 🚩 mark with
 *   penalty 0 and flagBy, ONE targeted write on the line, no bank line. A marked line can never be docked later (the switch back on).
 *   Drawn: "🚩 by Mom · −100" / "🚩 by Dad · no stars taken" in the Click-off Log and 🧾; an old mark (no flagBy) draws as before.
 * The WHOLE app per device (test_fixtures/house_world.js), a made-up family (kid_a … kid_d), Thursday 11/26/2026.
 * "The app before" = THIS tree with FLAGWHO taken out (no git, no pinned commit; each piece must match exactly once).
 * FW_INDEX = another copy (a mutation check). FW_DUMP = a file for the preview page's drawings.
 * run: node test_flag_mark_who.js
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os");
const W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 900) + ")" : "")); } };
const J = x => JSON.stringify(x), clone = x => JSON.parse(J(x));
const IDX = process.env.FW_INDEX || path.join(__dirname, "index.html"), HJS = fs.readFileSync(path.join(__dirname, "house.js"), "utf8");

// ── the app before: this tree, FLAGWHO taken out ──
const PIECES = [
  [/^\/\/ FLAGWHO_START[^\n]*\n[\s\S]*?^\/\/ FLAGWHO_END\n/m, "", "the FLAGWHO block"],
  [",ref:t.id,flagged:!!h.flagged,flagBy:h.flagBy,penalty:h.penalty,pts:0});   // FLAGWHO", ",ref:t.id,flagged:!!h.flagged,pts:0});", "🧾's card line"],
  [",flagged:!!r.flagged,flagBy:r.flagBy,penalty:r.penalty,pts:r.pts||0}); });   // WAVE lines ride along · FLAGWHO", ",flagged:!!r.flagged,pts:r.pts||0}); });   // WAVE lines ride along", "🧾's step line"],
  [",flagged:!!r.flagged,flagBy:r.flagBy,penalty:r.penalty,pts:r.pts||0}); }); }); }); }   // FLAGWHO", ",flagged:!!r.flagged,pts:r.pts||0}); }); }); }); }", "🧾's 🌅 line"],
  ['    bankDirect(kid,-100,"🚩 false check-off dock — "+(rec.label||label||"")+" · by "+flagWhoName(who));   // FLAGWHO', '    bankDirect(kid,-100,"🚩 false check-off dock — "+(rec.label||label||""));', "🧾's step bank line"],
  ['    bankDirect(kid,-100,"🚩 false check-off dock — "+(label||"")+" · by "+flagWhoName(who));   // FLAGWHO', '    bankDirect(kid,-100,"🚩 false check-off dock — "+(label||""));', "🧾's card bank line"],
  [`          else if(i.flagged) h+='<span title="'+(i.penalty===0?'marked, no stars taken':'docked −100')+'" style="flex-shrink:0;font-size:11px;font-weight:800;color:#b91c1c">'+(flagMarkTxt(i)||'🚩 −100')+'</span>';   // FLAGWHO`,
   `          else if(i.flagged) h+='<span title="docked −100" style="flex-shrink:0;font-size:11px;font-weight:800;color:#b91c1c">🚩 −100</span>';`, "🧾's mark"],
  [`+(e.flagged?' <span style="color:#b91c1c;font-weight:800">'+((typeof flagMarkTxt==="function"&&flagMarkTxt(e))||'−100')+'</span>':'')`, `+(e.flagged?' <span style="color:#b91c1c;font-weight:800">−100</span>':'')`, "the Log's mark"],
  [`  if(!rec||rec.flagged) return;
  const off=typeof starTakeOk==="function"&&!starTakeOk(kid), who=typeof flagWho==="function"?flagWho():"mom";   // FLAGWHO: Take stars away off → the 🚩 mark, no stars
  if(!confirm(off?flagOffAsk(kid,rec.label||""):"Dock 100 points from "+cap(kid)+" for a false check-off?\\n\\n\\""+(rec.label||"")+"\\"")) return;
  if(!off) bankDirect(kid,-100,"🚩 false check-off dock"+(typeof flagWhoName==="function"?" · by "+flagWhoName(who):""));
  const patch={flagged:true,penalty:off?0:-100,flagTs:nowTs(),flagBy:who};
  Object.assign(rec,patch);
  if(db&&!(typeof _dryRun==="function"&&_dryRun())) db.ref(`, `  if(!rec||rec.flagged||(typeof starTakeNo==="function"&&starTakeNo(kid))) return;   // STARRULES
  if(!confirm("Dock 100 points from "+cap(kid)+" for a false check-off?\\n\\n\\""+(rec.label||"")+"\\"")) return;
  bankDirect(kid,-100,"🚩 false check-off dock");
  const patch={flagged:true,penalty:-100,flagTs:nowTs()};
  Object.assign(rec,patch);
  if(db) db.ref(`, "rlogFlag"]
];
const BASE_IDX = (() => { let s = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  for (const [a, b, l] of PIECES) { const n = typeof a === "string" ? s.split(a).length - 1 : (s.match(a) || []).length;
    if (n !== 1) throw new Error("test_flag_mark_who: the app before cannot be built — " + l + " found " + n + "×"); s = s.replace(a, () => b); }
  if (/FLAGWHO|flagWho|flagMarkTxt|flagOffAsk/.test(s)) throw new Error("test_flag_mark_who: the app before still has FLAGWHO");
  const t = path.join(os.tmpdir(), "flag_mark_who_before_" + process.pid + ".html"); fs.writeFileSync(t, s); return t; })();
console.log("(the app before: this tree with FLAGWHO taken out)");

const K = o => Object.assign({ src: { kind: "routine" }, status: "active", area: "cleaning", verdict: "", note: "", level: 1, minutes: 5 }, o);
const FAM = () => ({
  a_bed: K({ label: "Make the bed", emoji: "🛏", who: "kid_a", slot: "chores", cad: "daily", pts: 2, order: 0 }),
  a_dust: K({ label: "Dust the shelves", emoji: "🪶", who: "kid_a", slot: "chores", cad: "daily", pts: 10, order: 1 }),
  a_sink: K({ label: "Wipe the sink", emoji: "🚰", who: "kid_a", slot: "chores", cad: "daily", pts: 10, order: 2 }),
  b_dog: K({ label: "Feed the dog", emoji: "🐶", who: "kid_b", slot: "chores", cad: "daily", pts: 2, area: "animals", order: 0 }),
  b_porch: K({ label: "Sweep the porch", emoji: "🧺", who: "kid_b", slot: "chores", cad: "daily", pts: 10, order: 1 }),
  c_toys: K({ label: "Toys in the bin", emoji: "🧩", who: "kid_c", slot: "chores", cad: "daily", pts: 3, order: 0 })
});
const CAP = "globalThis.__pop='';globalThis.__toast=[];globalThis.__cf=[];globalThis.__say=true;document.body.insertAdjacentHTML=function(p,h){ globalThis.__pop=h; };gwShowToast=function(m){ __toast.push(m); };confirm=function(m){ __cf.push(m); return __say; };tab='moms-plan';1";
async function mkWorld(index) {
  const w = await W.world({ index, household: { jobs: FAM(), people: clone(W.PEOPLE), meta: { takeover: 1, engine: { mode: "preview", on: "2026-11-09" } } }, tree: { config: clone(W.FX.db.config), settings: clone(W.FX.db.settings || {}) } });
  const A = w.boot("A", "devA", { mom: true }), Dd = w.boot("D", "devD"), Kk = w.boot("Kk", "devK");
  Dd.run("HA_LS.setItem('ha_kiosk','dad');dadUnlocked=true;1"); Kk.run("HA_LS.setItem('ha_kiosk','routines');1");
  for (const d of [A, Dd, Kk]) { d.run(CAP); if (d.run("typeof lgShow") !== "function") d.run(HJS); }
  await w.flush(); await w.at(2026, 11, 26, 15, 0); await w.flush();
  return { w, A, Dd, Kk };
}
const idxOf = (d, kid, label) => d.run("(function(){ return (rtStepsFor('chores','" + kid + "',false,_todayDay)||[]).findIndex(function(x){ return x&&x.label===" + J(label) + "; }); })()");
const tick = (d, kid, label) => { const i = idxOf(d, kid, label); d.run("(function(){ day=_todayDay; toggleRtStep('chores','" + kid + "'," + i + "); })()"); return i; };
// the newest "on" line for a chore today → [wk, day, key]
const logKey = (d, kid, label) => JSON.parse(d.run("(function(){ const wk=activeWk(), dn=_todayDay, L=((routineLog[" + J(kid) + "]||{})[wk]||{})[dn]||{}; const ks=Object.keys(L).filter(function(k){ return L[k]&&L[k].act==='on'&&L[k].label===" + J(label) + "; }).sort(function(a,b){ return (L[a].at||0)-(L[b].at||0); }); return JSON.stringify(ks.length?[wk,dn,ks.pop()]:null); })()"));
const writes = (w, m) => w.since(m || 0).map(l => l.op + " " + l.path.replace(/(\/adjustments\/)[^/]+$/, "$1*"));
const notes = (w, kid) => Object.values(w.get("bank/" + kid + "/adjustments") || {}).filter(a => /false check-off/.test(a.note || "")).map(a => [a.amount, a.note]);
const rec = (w, k) => { const r = w.get("routineLog/" + k[0].replace(/^/, "") + "/" + k.join("/")); return r; };
const recOf = (w, kid, k) => w.get("routineLog/" + kid + "/" + k.join("/")) || {};
const logHTML = d => d.run("chSettingsClickoffLogHTML()");
const ckHTML = d => d.run("(function(){ ckLogOpen=true; return mdCardCheckLog(); })()");
// one kid's row in the Click-off Log / one line in 🧾, by its label
const logRow = (h, label) => (String(h).split('<div style="display:flex;align-items:center;gap:8px;padding:7px 0;').filter(r => r.indexOf(label) >= 0)[0] || "").split("</div></div>")[0];
const ckRow = (h, label) => (String(h).split('<div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid #f3f4f6">').filter(r => r.indexOf(label) >= 0)[0] || "").split("</div>")[0];
const strip = s => String(s).replace(/ · by (Mom|Dad)$/, "");
const DUMP = {};

(async () => {
const N = await mkWorld(IDX), O = await mkWorld(BASE_IDX);
for (const S of [N, O]) { for (const [k, l] of [["kid_a", "Make the bed"], ["kid_a", "Dust the shelves"], ["kid_a", "Wipe the sink"], ["kid_b", "Feed the dog"], ["kid_b", "Sweep the porch"], ["kid_c", "Toys in the bin"]]) tick(S.Kk, k, l); await S.w.flush(); }

// ── A ──
console.log("\n── A · Take stars away ON: as before, plus who ──");
{ const run = async S => { const o = {}, k = logKey(S.A, "kid_a", "Make the bed"); S.A.run("__cf.length=0;1"); const m = S.w.mark();
    S.A.run("rlogFlag('kid_a','" + k.join("','") + "')"); await S.w.flush(); o.w = writes(S.w, m); o.ask = S.A.run("__cf[0]"); o.bank = notes(S.w, "kid_a"); o.rec = recOf(S.w, "kid_a", k);
    o.log = logRow(logHTML(S.A), "Make the bed"); o.ck = ckRow(ckHTML(S.A), "Make the bed"); return o; };
  const a = await run(N), b = await run(O);
  ok("the Click-off Log's ⚠️ (Mom): the same ask and the same writes as before (the −100 and one update of the line)", a.ask === b.ask && J(a.w) === J(b.w) && J(a.w) === J(["set bank/kid_a/adjustments/*", "update routineLog/kid_a/" + logKey(N.A, "kid_a", "Make the bed").join("/")]), [a.w, b.w]);
  ok("…the Star Bank line: −100, \"🚩 false check-off dock · by Mom\" (before: no who)", J(a.bank) === J([[-100, "🚩 false check-off dock · by Mom"]]) && J(b.bank) === J([[-100, "🚩 false check-off dock"]]));
  const { flagTs: t1, ...ra } = a.rec, { flagTs: t2, ...rb } = b.rec;
  ok("…the line's record = before + flagBy \"mom\" (flagged, penalty −100)", J(ra) === J(Object.assign({}, rb, { flagBy: "mom" })) && ra.penalty === -100, [ra, rb]);
  ok("…drawn: the Click-off Log \"🚩 by Mom · −100\" (before \"−100\"); 🧾 \"🚩 by Mom · −100\" (before \"🚩 −100\")", /<span style="color:#b91c1c;font-weight:800">🚩 by Mom · −100<\/span>/.test(a.log) && /<span style="color:#b91c1c;font-weight:800">−100<\/span>/.test(b.log) && />🚩 by Mom · −100<\/span>/.test(a.ck) && />🚩 −100<\/span>/.test(b.ck) && /title="docked −100"/.test(a.ck), [a.log.slice(-200), a.ck.slice(-200)]);
  DUMP.momLog = a.log; DUMP.momCk = a.ck;
  // 🧾's −100 by an unlocked Dad on his link, a step line
  const dad = async S => { const k = logKey(S.A, "kid_b", "Feed the dog"), m = S.w.mark(); S.Dd.run("__cf.length=0;1");
    S.Dd.run("ckLogDock('step','kid_b'," + J(k.join("/")) + ",'Feed the dog')"); await S.w.flush();
    return { w: writes(S.w, m), ask: S.Dd.run("__cf[0]"), bank: notes(S.w, "kid_b"), by: recOf(S.w, "kid_b", k).flagBy, ck: ckRow(ckHTML(S.Dd), "Feed the dog"), log: logRow(logHTML(S.A), "Feed the dog") }; };
  const c = await dad(N), d = await dad(O);
  ok("🧾's −100 by Dad (his link, code in): the same ask and writes as before; the mark says flagBy \"dad\" (as before)", c.ask === d.ask && J(c.w) === J(d.w) && c.by === "dad" && d.by === "dad");
  ok("…its bank line now ends \" · by Dad\"; drawn \"🚩 by Dad · −100\" on his 🧾 and in Mom's Click-off Log", J(c.bank) === J([[-100, "🚩 false check-off dock — Feed the dog · by Dad"]]) && J(d.bank.map(x => x[1])) === J(["🚩 false check-off dock — Feed the dog"]) && />🚩 by Dad · −100<\/span>/.test(c.ck) && /🚩 by Dad · −100<\/span>/.test(c.log), [c.ck.slice(-160), c.log.slice(-160)]);
  DUMP.dadCk = c.ck; DUMP.dadLog = c.log;
  // a school card in 🧾 (Mom)
  const card = async S => { S.A.run("(function(){ weekData.tasks.push({id:'t_fw',who:'kid_c',day:_todayDay,title:'Math page 12'}); checked.t_fw=nowTs(); histState.t_fw={title:'Math page 12'}; })()");
    const m = S.w.mark(); S.A.run("ckLogDock('task','kid_c','t_fw','Math page 12')"); await S.w.flush();
    return { w: writes(S.w, m), bank: notes(S.w, "kid_c"), h: (({ flagTs, ...x }) => x)(S.A.run("histState.t_fw")), ck: ckRow(ckHTML(S.A), "Math page 12") }; };
  const e = await card(N), f = await card(O);
  ok("🧾's −100 on a school card (Mom): the same writes as before; the bank line ends \" · by Mom\"; drawn \"🚩 by Mom · −100\"", J(e.w) === J(f.w) && e.w.length === 2 && J(e.h) === J(f.h) && e.h.flagBy === "mom" && J(e.bank) === J([[-100, "🚩 false check-off dock — Math page 12 · by Mom"]]) && />🚩 by Mom · −100<\/span>/.test(e.ck), [e.w, f.w, e.h]);
  ok("a kid's device: both refused, nothing written (as before)", await (async () => { const r = []; for (const S of [N, O]) { const k = logKey(S.A, "kid_c", "Toys in the bin"), m = S.w.mark();
    S.Kk.run("rlogFlag('kid_c','" + k.join("','") + "')"); S.Kk.run("ckLogDock('step','kid_c'," + J(k.join("/")) + ",'Toys in the bin')"); await S.w.flush(); r.push(S.w.since(m).length); } return J(r) === J([0, 0]); })());
  ok("Dad's link, code in: the Click-off Log's rlogFlag still refuses (Mom's; the Log is not on his link), nothing written", await (async () => { const r = []; for (const S of [N, O]) { const k = logKey(S.A, "kid_c", "Toys in the bin"), m = S.w.mark();
    r.push(S.Dd.run("rlogFlag('kid_c','" + k.join("','") + "')")); await S.w.flush(); r.push(S.w.since(m).length); } return J(r) === J([null, 0, null, 0]); })());
}

// ── B ──
console.log("\n── B · Take stars away OFF: the Click-off Log's ⚠️ marks, takes nothing ──");
{ const { w, A } = N; A.run("lgRuleTake('kid_a')"); await w.flush();
  const k = logKey(A, "kid_a", "Dust the shelves"); A.run("__cf.length=0;__say=false;1"); let m = w.mark();
  A.run("rlogFlag('kid_a','" + k.join("','") + "')"); await w.flush();
  ok("Cancel on the ask: nothing written, no mark", w.since(m).length === 0 && !recOf(w, "kid_a", k).flagged && A.run("__cf.length") === 1);
  A.run("__cf.length=0;__say=true;__toast.length=0;1"); m = w.mark(); A.run("rlogFlag('kid_a','" + k.join("','") + "')"); await w.flush();
  const ask = A.run("__cf[0]");
  ok("the ask: \"Mark a false check-off for Kid A? / \\\"Dust the shelves\\\" / Taking stars away is off for Kid A, so no stars come off. The line just gets its 🚩 mark.\"", ask === "Mark a false check-off for Kid A?\n\n\"Dust the shelves\"\n\nTaking stars away is off for Kid A, so no stars come off. The line just gets its 🚩 mark." && A.run("__toast.length") === 0, ask);
  const r = recOf(w, "kid_a", k);
  ok("yes: exactly ONE write, the line's update; no bank line; the record flagged, penalty 0, flagBy \"mom\"", J(writes(w, m)) === J(["update routineLog/kid_a/" + k.join("/")]) && notes(w, "kid_a").length === 1 && r.flagged === true && r.penalty === 0 && r.flagBy === "mom" && typeof r.flagTs === "string", [writes(w, m), r]);
  const lr = logRow(logHTML(A), "Dust the shelves"), cr = ckRow(ckHTML(A), "Dust the shelves");
  ok("drawn: the Click-off Log \"🚩 by Mom · no stars taken\" (no ⚠️ button); 🧾 the same, its tip \"marked, no stars taken\"", /🚩 by Mom · no stars taken<\/span>/.test(lr) && !/rlogFlag/.test(lr) && /title="marked, no stars taken"[^>]*>🚩 by Mom · no stars taken<\/span>/.test(cr), [lr.slice(-200), cr.slice(-200)]);
  DUMP.offLog = lr; DUMP.offCk = cr;
  // the switch back on: the marked line can never be docked
  A.run("lgRuleTake('kid_a')"); await w.flush(); A.run("__cf.length=0;1"); m = w.mark();
  A.run("rlogFlag('kid_a','" + k.join("','") + "')"); A.run("ckLogDock('step','kid_a'," + J(k.join("/")) + ",'Dust the shelves')"); await w.flush();
  ok("Take stars away On again: that line can't be docked by either button (no ask, nothing written, still penalty 0)", w.since(m).length === 0 && A.run("__cf.length") === 0 && recOf(w, "kid_a", k).penalty === 0 && notes(w, "kid_a").length === 1);
  const k2 = logKey(A, "kid_a", "Wipe the sink"); m = w.mark(); A.run("rlogFlag('kid_a','" + k2.join("','") + "')"); await w.flush();
  ok("…a line not yet marked docks −100 as before, by Mom", J(notes(w, "kid_a").map(x => x[0]).sort()) === J([-100, -100]) && recOf(w, "kid_a", k2).flagBy === "mom" && recOf(w, "kid_a", k2).penalty === -100);
}

// ── C ──
console.log("\n── C · ⏸ Pause behaves like Take stars away off ──");
{ const { w, A } = N; A.run("lgRulePause()"); await w.flush();
  const k = logKey(A, "kid_b", "Sweep the porch"); A.run("__cf.length=0;1"); const m = w.mark(); A.run("rlogFlag('kid_b','" + k.join("','") + "')"); await w.flush();
  ok("paused: the ask says \"⏸ Star rules are paused for everyone, so no stars come off.\"; one write, penalty 0, by Mom, no bank line", /^Mark a false check-off for Kid B\?\n\n"Sweep the porch"\n\n⏸ Star rules are paused for everyone, so no stars come off\. The line just gets its 🚩 mark\.$/.test(A.run("__cf[0]")) && J(writes(w, m)) === J(["update routineLog/kid_b/" + k.join("/")]) && recOf(w, "kid_b", k).penalty === 0 && notes(w, "kid_b").length === 1, A.run("__cf[0]"));
  A.run("lgRulePause()"); await w.flush();
}

// ── D ──
console.log("\n── D · an old mark (no flagBy) draws as before ──");
{ const put = S => S.A.run("(function(){ const wk=activeWk(), dn=_todayDay; routineLog.kid_c[wk][dn].old1={label:'Old chore',slot:'chores',act:'on',ts:'9:00 AM',at:1,pts:3,flagged:true,penalty:-100,flagTs:'9:30 AM'}; weekData.tasks.push({id:'t_old',who:'kid_c',day:_todayDay,title:'Old card'}); checked.t_old=nowTs().replace(/^\\S+ \\S+/,'09:05 AM'); histState.t_old={title:'Old card',flagged:true,penalty:-100,flagTs:'9:31 AM'}; })()");
  put(N); put(O);
  const a = [logRow(logHTML(N.A), "Old chore"), ckRow(ckHTML(N.A), "Old chore"), ckRow(ckHTML(N.A), "Old card")], b = [logRow(logHTML(O.A), "Old chore"), ckRow(ckHTML(O.A), "Old chore"), ckRow(ckHTML(O.A), "Old card")];
  ok("an old marked chore line (Click-off Log and 🧾) and an old marked school card (🧾): byte for byte the app before (\"−100\", \"🚩 −100\")", a.every(x => x !== "") && J(a) === J(b) && />🚩 −100<\/span>/.test(a[1]) && />−100<\/span>/.test(a[0]), a.map((x, i) => x === b[i] ? "same" : [x.slice(-160), b[i].slice(-160)]));
  ok("…and ckLogToday's lines for check-offs unmarked in both read the same as before (no new fields)", (() => { const f = S => JSON.parse(S.A.run("JSON.stringify(ckLogToday())")); const x = f(N), y = f(O), id = i => i.kid + "|" + i.label, un = new Set(x.filter(i => !i.flagged).map(id).filter(r => y.some(q => id(q) === r && !q.flagged)));
    const g = L => J(L.filter(i => un.has(id(i))).map(i => Object.assign({}, i, { ref: "" }))); return un.size >= 1 && g(x) === g(y); })());   // the push keys differ between the two worlds
}

// ── E ──
console.log("\n── E · dryrun writes nothing ──");
{ const { w } = N; const Dr = w.boot("Dr", "devDr", { mom: true }); await w.flush(); Dr.run(CAP); Dr.run("HA_LS.setItem('ha_dryrun','1');1"); Dr.run(HJS);
  Dr.run("lgRuleTake('kid_c')");   // on this screen only
  const k = logKey(Dr, "kid_c", "Toys in the bin"), m = w.mark(); Dr.run("rlogFlag('kid_c','" + k.join("','") + "')"); await w.flush();
  ok("?dryrun=1, Take off: the mark shows on that screen (penalty 0, by Mom) and nothing reaches the database", Dr.run("_dryRun()") === true && w.since(m).length === 0 && Dr.run("routineLog.kid_c[" + J(k[0]) + "][" + J(k[1]) + "][" + J(k[2]) + "].penalty") === 0 && !recOf(w, "kid_c", k).flagged);
  // Take on: the bank line goes through obSet, which the app's boot-time dry-run patch (db.ref's set/update/remove → nothing) stops; the same patch here
  Dr.run("lgRuleTake('kid_c');(function(){ const o=db.ref.bind(db); db.ref=function(p){ const r=o(p); r.set=r.update=r.remove=function(){ return Promise.resolve(); }; return r; }; })();1");
  tick(N.Kk, "kid_c", "Toys in the bin"); tick(N.Kk, "kid_c", "Toys in the bin"); await w.flush(); const k2 = logKey(Dr, "kid_c", "Toys in the bin"), m2 = w.mark();
  Dr.run("rlogFlag('kid_c','" + k2.join("','") + "')"); await w.flush();
  ok("?dryrun=1, Take on (with the app's own boot-time dry-run patch): nothing reaches the database", w.since(m2).length === 0 && k2[2] !== k[2]);
}

if (process.env.FW_DUMP) fs.writeFileSync(process.env.FW_DUMP, J(DUMP));
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
