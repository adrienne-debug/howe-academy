/*
 * test_chore_card_rules.js — the chore card's four settings for a missed chore (missed-chores design slice D: §1.1–1.5, §7, §8 row D;
 * her words 11/19: "customizeable also have a fixed day option versus move 7 days after last done option then if fixed and done within
 * how may days is the next skipped"). house.js CARDRULES draws them on the card ("If it is missed") and as pills in a room's ⚙ Rules,
 * ONE setter (cdrSet); index.html CARDWAIT lets rtWaitDays read the chore's own Waits.
 *   clock "roll" · wait 0–6 | "next" · cover 0–6 · keep true — each on household/jobs/<id>/<field>, nothing else.
 * Waits acts NOW on a kid's fixed-day chore on today's lists; Rolling, Skip the next one and 📌 do nothing until the plan is ON (slice E).
 * The WHOLE app runs per device (test_fixtures/house_world.js) on a made-up family (kid_a … kid_c), clock from Mon 11/16 (day 0).
 *   A · the setter: each setting writes exactly its own field (one targeted set), clearing removes it, a repeat writes nothing,
 *       wrong values / wrong chores / not Mom / dry run write nothing
 *   B · the card and ⚙ Rules: the words, one control drawn twice (same handlers, same writes), the same state shown in both
 *   C · Waits on today's lists, every choice: the days on the list, the drop day's "— not done", Mom's note "day k of N"; a wait
 *       longer than the gap is cut at the next day; 3 a week keeps the old rule whatever is saved
 *   D · a chore with no setting = the app before; Rolling / 📌 / Skip set = the app before on every list, pop-up and write
 *   E · the plan engine: HouseEng.run and hdSig byte-identical with and without all four settings
 * "The app before" = THIS tree's index.html with the CARDWAIT block and its one call in rtWaitDays taken out (no pinned commit).
 *   run: node test_chore_card_rules.js        (CARD_INDEX / CARD_HJS = other copies: the mutation checks)
 */
"use strict";
const fs = require("fs"), path = require("path"), os = require("os");
const W = require(path.join(__dirname, "test_fixtures", "house_world.js"));
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 700) + ")" : "")); } };
const J = x => JSON.stringify(x), clone = x => JSON.parse(J(x));
const IDX = process.env.CARD_INDEX || path.join(__dirname, "index.html"), HJS = fs.readFileSync(process.env.CARD_HJS || path.join(__dirname, "house.js"), "utf8");
const BASE = (() => { let src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const blk = /^\/\/ CARDWAIT_START[^\n]*\n[\s\S]*?^\/\/ CARDWAIT_END\n/gm, call = /^  const _own=\(typeof rtWaitOwn==="function"\)\?rtWaitOwn\(st\):null; if\(_own!==null\) return _own;[^\n]*\n/gm;
  const nb = (src.match(blk) || []).length, nc = (src.match(call) || []).length;
  if (nb !== 1 || nc !== 1) throw new Error("test_chore_card_rules: the app before cannot be built — CARDWAIT block " + nb + "×, its call " + nc + "× (each must be exactly once)");
  src = src.replace(blk, "").replace(call, ""); if (/rtWaitOwn|CARDWAIT/.test(src)) throw new Error("the app before still mentions CARDWAIT");
  const t = path.join(os.tmpdir(), "card_rules_before_" + process.pid + ".html"); fs.writeFileSync(t, src); return t; })();
process.on("exit", () => { try { fs.unlinkSync(BASE); } catch (e) {} });
console.log("(the app before: this tree's index.html with the CARDWAIT block and its call taken out)");

// ── the made-up family. Day 0 = Mon 11/16; wk: 0 = Monday ──
const K = o => Object.assign({ src: { kind: "routine" }, status: "active", area: "cleaning", verdict: "", note: "", level: 1, slot: "chores", minutes: 5 }, o);
const WAITS = [["w_auto", undefined], ["w_0", 0], ["w_1", 1], ["w_2", 2], ["w_3", 3], ["w_4", 4], ["w_5", 5], ["w_6", 6], ["w_next", "next"]];
const JOBS = () => { const o = {
  a_teeth: K({ label: "Brush teeth", emoji: "🪥", who: "kid_a", slot: "morning", cad: "daily", area: "health", order: 0 }),
  a_table: K({ label: "Wipe the table", emoji: "🍽", who: "kid_a", cad: "daily", pts: 5, order: 0 }) };
  WAITS.forEach(([id], k) => { o[id] = K({ label: "Weekly chore " + id.slice(2), emoji: "🧹", who: "kid_a", cad: "wk:1", pts: 10, order: 1 + k }); });
  Object.assign(o, {
    b_two: K({ label: "Shine the mirror", emoji: "🪞", who: "kid_b", cad: "wk:1,4", pts: 4, order: 0 }),
    b_two_auto: K({ label: "Dust the lamp", emoji: "💡", who: "kid_b", cad: "wk:1,4", pts: 4, order: 1 }),
    b_three: K({ label: "Empty the trash", emoji: "🗑", who: "kid_b", cad: "wk:0,2,4", pts: 3, order: 2 }),
    b_sink: K({ label: "Rinse the sink", emoji: "🚰", who: "kid_b", cad: "daily", pts: 2, order: 3 }),
    c_vac: K({ label: "Vacuum the den", emoji: "🧹", who: "kid_c", cad: "wk:1", pts: 10, order: 0 }),
    c_plants: K({ label: "Water the plants", emoji: "🪴", who: "kid_c", cad: "wk:1,4", pts: 3, order: 1 }),
    c_mop: K({ label: "Mop the porch", emoji: "🪣", who: "kid_c", cad: "7d", pts: 6, lastDone: "2026-11-10", order: 2 }),
    c_tub: K({ label: "Scrub the tub", emoji: "🛁", who: "kid_c", cad: "wk:2", cycW: 1, cycN: 4, cycStart: "2026-11-16", pts: 12, order: 3 }),
    c_beds: K({ label: "Straighten the beds", emoji: "🛌", who: "kid_c", cad: "daily", pts: 5, order: 4 }),
    m_oven: K({ label: "Clean the oven", who: "mom", slot: "", cad: "wk:5", minutes: 20, src: { kind: "momChore", id: "oven" }, order: 0 })
  }); return o; };
const LBL = Object.fromEntries(Object.entries(JOBS()).map(([id, j]) => [id, j.label]));
const withWaits = js => { WAITS.forEach(([id, v]) => { if (v !== undefined) js[id].wait = v; }); js.b_two.wait = 5; js.b_three.wait = 2; js.c_tub.wait = 6; return js; };
const withPlanOnly = js => { js.c_vac.clock = "roll"; js.c_vac.keep = true; js.c_plants.cover = 3; js.c_plants.keep = true; js.c_mop.keep = true; js.c_tub.cover = 0; js.c_tub.keep = true; js.b_three.keep = true; return js; };
const household = jobs => ({ jobs, people: clone(W.PEOPLE), meta: { takeover: 1, engine: { mode: "preview", on: "2026-11-09" } } });
const tree = () => ({ config: clone(W.FX.db.config) });
const DN = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const dOf = n => new Date(2026, 10, 16 + n);
const go = (w, n, h) => { const d = dOf(n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h, 0); };
const nOfMs = ms => { const d = new Date(ms); return Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(2026, 10, 16)) / 864e5); };
async function mkWorld(jobs, index) { const w = await W.world({ household: household(jobs), tree: tree(), index: index || IDX }); const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"); await w.flush(); return { w, A, B }; }
const loadH = d => { if (d.run("typeof cdrSet") !== "function") d.run(HJS); };
// every database call a device makes while js runs: [method, path, value]
const writesOf = (d, js) => { d.run("globalThis.__w=[]; if(!globalThis.__dbw&&db){ const r0=db.ref; db.ref=function(p){ const r=r0.apply(db,arguments), P=String(p==null?'':p); ['set','update','remove','push','transaction'].forEach(function(m){ const f=r[m]; if(typeof f==='function') r[m]=function(v){ __w.push([m,P,v===undefined?null:JSON.parse(JSON.stringify(v))]); return f.apply(r,arguments); }; }); return r; }; globalThis.__dbw=1; }");
  const ret = d.run(js); return { ret, w: JSON.parse(d.run("JSON.stringify(__w)")) }; };
const draw = (d, slot, kid) => d.run("(function(){ const d0=day; day=_todayDay; try{ rtOpen={}; return rtSlotHTML(" + J(slot) + "," + J(kid) + "); } finally{ day=d0; } })()");
const rowsOf = h => { const i = h.indexOf('<div class="mr-steps"'); if (i < 0) return []; const p = h.slice(h.indexOf(">", i) + 1).split('<div class="mr-step').slice(1).map(r => '<div class="mr-step' + r); if (p.length) p[p.length - 1] = p[p.length - 1].replace(/<\/div>$/, ""); return p; };
const onList = (h, id) => rowsOf(h).filter(r => r.indexOf(LBL[id] + "<") >= 0 || r.indexOf(LBL[id] + " ") >= 0).filter(r => r.indexOf("toggleRtStep(") >= 0).length;
const teeth = d => d.run("(function(){ day=_todayDay; const i=morningStepsFor('kid_a').findIndex(function(s){ return s.label==='Brush teeth'; }); if(i>=0&&!mStepDoneOn('kid_a',day,i)) toggleMorningStep('kid_a',i); return i; })()");
const pop = (d, kid, slot) => d.run("(function(){ let h=''; const b=document.body.insertAdjacentHTML; document.body.insertAdjacentHTML=function(w,x){ h=x; }; try{ boardStatPop(" + J(kid) + "," + J(slot) + ",_todayDay); } finally{ document.body.insertAdjacentHTML=b; } return h; })()");
const misses = w => { const L = w.db.tree.root.routineLog || {}, out = []; Object.keys(L).forEach(k => Object.keys(L[k] || {}).forEach(wk => Object.keys(L[k][wk] || {}).forEach(dn => Object.keys(L[k][wk][dn] || {}).forEach(key => { if (/^miss_/.test(key)) out.push([k, wk, dn, L[k][wk][dn][key].label]); })))); return out; };
const missWrites = (w, m) => w.since(m || 0).filter(l => /^routineLog\/[^/]+\/[^/]+\/[^/]+\/miss_/.test(l.path || "")).map(l => { const p = l.path.split("/"); const r = ((((w.db.tree.root.routineLog || {})[p[1]] || {})[p[2]] || {})[p[3]] || {})[p[4]] || {}; return { kid: p[1], dn: p[3], label: r.label, n: nOfMs(l.at) }; });
const handlers = h => { const out = [], re = / on(click|change)="([^"]*)"/g; let m; while ((m = re.exec(h))) out.push(m[2].replace(/&quot;/g, '"').replace(/&amp;/g, "&")); return out; };
const txt = h => String(h || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const card = (d, id) => d.run("hcOpen('" + id + "'); hcCardHTML()");
const missedPart = h => { const i = h.indexOf("If it is missed"); return i < 0 ? "" : h.slice(i, h.indexOf("3 · Who", i)); };
const rules = (d, ids) => d.run("hcRulesHTML('kitchen'," + J(ids) + ")");
const jobsOf = w => clone(w.db.tree.root.household.jobs);

(async () => {
// ── A ──
console.log("\n── A · the setter: each setting saves exactly its own field at the chore's own path, and nothing else ──");
{ const { w, A, B } = await mkWorld(JOBS()); loadH(A); loadH(B);
  const CASES = [["clock", "w_auto", "'roll'", "roll", "'fixed'"], ["keep", "w_auto", "true", true, "false"], ["keep", "c_mop", "true", true, "false"]]
    .concat([0, 1, 2, 3, 4, 5, 6].map(n => ["wait", "w_auto", String(n), n, "''"])).concat([["wait", "w_auto", "'next'", "next", "''"], ["wait", "w_auto", "'3'", 3, "'auto'"], ["wait", "c_mop", "4", 4, "''"]])
    .concat([0, 1, 2, 3, 4, 5, 6].map(n => ["cover", "b_two_auto", String(n), n, "''"])).concat([["cover", "b_three", "'2'", 2, "''"]]);
  for (const [f, id, v, stored, clear] of CASES) {
    const t0 = jobsOf(w); await w.flush(); const m = w.mark();
    const r = writesOf(A, "cdrSet('" + id + "','" + f + "'," + v + ")"); await w.flush(); const t1 = jobsOf(w), lg = w.since(m);
    const want = clone(t0); want[id][f] = stored;
    ok(f + " = " + J(stored) + " on " + id + ": one set of household/jobs/" + id + "/" + f + " = " + J(stored) + ", and the table is the old table plus that one field", J(r.w) === J([["set", "household/jobs/" + id + "/" + f, stored]]) && lg.length === 1 && lg[0].op === "set" && !lg[0].whole && J(t1) === J(want) && J(A.run("hhJobs()['" + id + "']['" + f + "']")) === J(stored), [r.w, lg]);
    const r2 = writesOf(A, "cdrSet('" + id + "','" + f + "'," + v + ")");
    ok("…the same tap again writes nothing", r2.w.length === 0);
    const m2 = w.mark(); const r3 = writesOf(A, "cdrSet('" + id + "','" + f + "'," + clear + ")"); await w.flush();
    ok("…cleared (" + clear + "): one set of null at the same path, the field gone, the table back to what it was", J(r3.w) === J([["set", "household/jobs/" + id + "/" + f, null]]) && w.since(m2).length === 1 && J(jobsOf(w)) === J(t0) && !A.run("'" + f + "' in hhJobs()['" + id + "']"), r3.w);
  }
  const refused = [["wait", "w_auto", "7"], ["wait", "w_auto", "-1"], ["wait", "w_auto", "2.5"], ["wait", "w_auto", "'soon'"], ["cover", "w_auto", "'next'"], ["cover", "w_auto", "9"], ["clock", "w_auto", "'weekly'"], ["keep", "w_auto", "'yes'"],
    ["clock", "b_two", "'roll'"], ["clock", "c_mop", "'roll'"], ["wait", "b_three", "2"], ["cover", "c_mop", "1"], ["wait", "a_table", "2"], ["keep", "a_table", "true"], ["wait", "a_teeth", "1"], ["wait", "no_such", "1"], ["label", "w_auto", "'x'"], ["pts", "w_auto", "1"]];
  const t0 = jobsOf(w), m = w.mark(); const bad = refused.map(([f, id, v]) => [f, id, v, writesOf(A, "cdrSet('" + id + "','" + f + "'," + v + ")")]).filter(x => x[3].ret !== false || x[3].w.length);
  await w.flush(); ok("refused, nothing written: a wait of 7, −1, 2.5 or a word · Skip \"next\" or 9 · a clock that is not roll/fixed · 📌 \"yes\" · Rolling on a 2-day or an every-N chore · Waits on a 3-a-week chore · Skip on a rolling chore · anything on a daily · another field · a chore that is not there", bad.length === 0 && w.since(m).length === 0 && J(jobsOf(w)) === J(t0), bad.map(x => x.slice(0, 3)));
  // only the four fields: any other field name is refused for every value, a clearing one too (a clear skips cdrOk, so this guard is all
  // that keeps a "" / null / "auto" tap from wiping the chore's real who / stars / days / words / status)
  { const OTHER = ["who", "pts", "cad", "label", "status", "emoji", "slot", "order", "lastDone", "can", "minutes", "room", "level", "area", "verdict", "src", "", "__proto__", "constructor", "clocks", "Wait"],
      VALS = ["''", "null", "undefined", "'auto'", "0", "3", "'next'", "'roll'", "true", "false", "'x'"];
    const t1 = jobsOf(w), j1 = A.run("JSON.stringify(hhJobs())"), m5 = w.mark(), bad = [];
    for (const f of OTHER) for (const v of VALS) { const r = writesOf(A, "cdrSet('w_auto'," + J(f) + "," + v + ")"); if (r.ret !== false || r.w.length) bad.push([f, v, r]); }
    for (const v of ["''", "null", "'auto'"]) for (const id of ["a_table", "c_mop", "b_three", "m_oven"]) for (const f of ["who", "pts", "cad", "label", "status"]) { const r = writesOf(A, "cdrSet(" + J(id) + "," + J(f) + "," + v + ")"); if (r.ret !== false || r.w.length) bad.push([id, f, v, r]); }
    await w.flush();
    ok("a field outside the four (who, pts, cad, label, status, …, \"\", __proto__) is refused for every value, \"\" / null / undefined / \"auto\" included: false, nothing written, the chore unchanged on the device and in the database (" + (OTHER.length * VALS.length + 60) + " taps)", bad.length === 0 && w.since(m5).length === 0 && A.run("JSON.stringify(hhJobs())") === j1 && J(jobsOf(w)) === J(t1), bad.slice(0, 4)); }
  A.run("cdrSet('w_auto','clock','roll')"); await w.flush(); const m3 = w.mark(); const rc = writesOf(A, "cdrSet('w_auto','cover',2)");
  ok("Skip on a chore switched to Rolling is refused (not needed: the clock already restarted)", rc.ret === false && rc.w.length === 0 && w.since(m3).length === 0);
  A.run("cdrSet('w_auto','clock','fixed')"); await w.flush();
  // right after a clear, on the device that tapped and before the database's echo comes back: no such field, the card and ⚙ Rules show
  // Auto / Fixed / not kept, and the lists wait by Auto (a clear that left 0 behind would read as None / Never here)
  { A.run(String.raw`globalThis.__look=function(){ const j=hhJobs().w_auto, c=(hcOpen('w_auto'),hcCardHTML()), r=hcRulesHTML('kitchen',['w_auto']), st=(rtStepsFor('chores','kid_a',true)||[]).find(function(x){ return x&&x._hh==='w_auto'; });
      const has=function(h,s){ return h.indexOf(s)>=0; };
      return JSON.stringify({has:['clock','wait','cover','keep'].filter(function(f){ return f in j; }), wait:st?rtWaitDays(st):-1, own:st?rtWaitOwn(st):-1,
        cW:has(c,'<button class="ce-chip sel" onclick="cdrSet(\'w_auto\',\'wait\',\'\')"'), cC:has(c,'<button class="ce-chip sel" onclick="cdrSet(\'w_auto\',\'cover\',\'\')"'),
        cF:has(c,'<button class="ce-chip sel" onclick="cdrSet(\'w_auto\',\'clock\',\'fixed\')"'), cK:has(c,'<button title="Keep until done" class="ce-chip sel"'),
        rW:/onchange="cdrSet\('w_auto','wait',this\.value\)"[^>]*><option value="" selected>Auto: 2 days</.test(r), rC:/onchange="cdrSet\('w_auto','cover',this\.value\)"[^>]*><option value="" selected>Auto: 2 days</.test(r),
        rF:has(r,'<button class="ce-chip sel" onclick="cdrSet(\'w_auto\',\'clock\',\'fixed\')"'), rK:has(r,'<button title="Keep until done" class="ce-chip sel"') }); };`);
    const look = () => "__look()";
    const AUTO = { has: [], wait: 2, own: null, cW: true, cC: true, cF: true, cK: false, rW: true, rC: true, rF: true, rK: false };
    ok("(sanity) a chore with nothing set looks like that", J(JSON.parse(A.run(look()))) === J(AUTO), A.run(look()));
    for (const [f, v, clear] of [["wait", "0", "''"], ["wait", "5", "'auto'"], ["cover", "0", "null"], ["cover", "4", "''"], ["clock", "'roll'", "'fixed'"], ["keep", "true", "false"]]) {
      A.run("cdrSet('w_auto','" + f + "'," + v + ")"); await w.flush(); const set = JSON.parse(A.run(look()));
      const now = JSON.parse(A.run("(function(){ cdrSet('w_auto','" + f + "'," + clear + "); return " + look() + "; })()")), pend = w.sched && typeof w.sched.pending === "function" ? w.sched.pending() : null;
      await w.flush(); const later = JSON.parse(A.run(look()));
      ok(f + " " + v + " then cleared (" + clear + "): at once on the same device, before the database answers — no " + f + " field, the card and ⚙ Rules show Auto / Fixed / not kept, the lists wait by Auto (2 days); the same after the echo", J(set) !== J(AUTO) && J(now) === J(AUTO) && J(later) === J(AUTO) && !(f in jobsOf(w).w_auto), [set, now, later, pend]); }
  }
  const k = writesOf(B, "[cdrSet('w_auto','wait',3),cdrSet('w_auto','keep',true),cdrSet('w_auto','clock','roll'),cdrSet('w_auto','cover',1)]");
  ok("a kid's device (not Mom): every setter refuses, nothing written, nothing changed", J(k.ret) === J([false, false, false, false]) && k.w.length === 0 && B.run("JSON.stringify(hhJobs().w_auto)") === J(jobsOf(w).w_auto), k);
  A.run("_dryRun=function(){ return true; }"); const m4 = w.mark(); const d = writesOf(A, "[cdrSet('w_auto','wait',3),cdrSet('w_auto','keep',true),cdrSet('w_auto','clock','roll'),cdrSet('w_2','wait','')]"); await w.flush();
  ok("dry run (?dryrun=1): the screen changes, the database gets nothing", d.w.length === 0 && w.since(m4).length === 0 && A.run("hhJobs().w_auto.wait") === 3 && J(jobsOf(w)) === J(t0), d);
}

// ── B ──
console.log("\n── B · the card and ⚙ Rules: the words, one control drawn in two places ──");
{ const { w, A, B } = await mkWorld(JOBS()); loadH(A); loadH(B);
  const one = txt(missedPart(card(A, "w_auto")));
  ok("a weekly kid's chore: \"If it is missed\" · Clock: 📅 Fixed day: Tuesdays · 🔄 Rolling: every 7 days after last done · its plan note", one.indexOf("If it is missed Clock 📅 Fixed day: Tuesdays 🔄 Rolling: every 7 days after last done Rolling starts working when the plan is switched on. Until then it comes on Tuesdays.") === 0, one);
  ok("…Waits: Auto: 2 days · None · 1 day … 6 days · Until its next day, and \"Acts on today’s lists now\"", one.indexOf("Waits Auto: 2 days None 1 day 2 days 3 days 4 days 5 days 6 days Until its next day Acts on today’s lists now: a missed one stays on the list this long, then it is dropped until its next day.") > 0, one);
  ok("…Skip the next one if done within … days before its day: Auto: 2 days · Never · 1 day … 6 days, and its plan note", one.indexOf("Skip the next one if done within … days before its day Auto: 2 days Never 1 day 2 days 3 days 4 days 5 days 6 days Done this many days before its day, the next one is skipped. Starts working when the plan is switched on.") > 0, one);
  ok("…Keep until done: 📌 Keep until done, and its plan note", /Keep until done 📌 Keep until done Never dropped: it stays on the list every day until it is done\. Starts working when the plan is switched on\.$/.test(one), one);
  const two = txt(missedPart(card(A, "b_two_auto")));
  ok("twice a week (Tue + Fri): \"📅 Fixed days: Tuesdays and Fridays\", no Rolling switch; Auto: 1 day; Skip Auto: 1 day", two.indexOf("Clock 📅 Fixed days: Tuesdays and Fridays Waits Auto: 1 day") > 0 && two.indexOf("Rolling") < 0 && /Skip the next one[^A]*Auto: 1 day Never/.test(two), two);
  A.run("cdrSet('b_two_auto','wait',5)"); const cut = txt(missedPart(card(A, "b_two_auto")));
  ok("…a wait longer than the gap: \"Its next day comes first, so it waits at most 2 days after Tue, 3 days after Fri.\"", cut.indexOf("Its next day comes first, so it waits at most 2 days after Tue, 3 days after Fri.") > 0, cut);
  A.run("cdrSet('b_two_auto','wait','next')"); ok("…\"Until its next day\" needs no such line", txt(missedPart(card(A, "b_two_auto"))).indexOf("comes first") < 0); A.run("cdrSet('b_two_auto','wait','')");
  A.run("cdrSet('w_auto','wait',5)"); ok("a wait of 5 or more on a chore with stars: \"By day 5 of the wait it pays 0 ⭐.\"", txt(missedPart(card(A, "w_auto"))).indexOf("By day 5 of the wait it pays 0 ⭐.") > 0 && txt(missedPart(card(A, "w_auto"))).indexOf("comes first") < 0);
  A.run("cdrSet('w_auto','wait',4)"); ok("…not at 4", txt(missedPart(card(A, "w_auto"))).indexOf("pays 0") < 0); A.run("cdrSet('w_auto','wait','')");
  const three = txt(missedPart(card(A, "b_three")));
  ok("3 a week: \"As now: on the list until its next day, with the red “late” tag\", no Waits choices; Skip Auto: never", three.indexOf("Waits As now: on the list until its next day, with the red “late” tag") > 0 && three.indexOf("Until its next day") < 0 && /Auto: never Never/.test(three) && !/cdrSet\('b_three','wait'/.test(card(A, "b_three")), three);
  const ev = txt(missedPart(card(A, "c_mop")));
  ok("every 7 days: \"🔄 Rolling: every 7 days after last done\" (How often sets this), Waits with the plan note, no Skip", ev.indexOf("Clock 🔄 Rolling: every 7 days after last done How often sets this. Waits Auto: 2 days") > 0 && ev.indexOf("How long a missed one stays on the list before it is dropped. Starts working when the plan is switched on.") > 0 && ev.indexOf("Skip the next") < 0, ev);
  const cy = txt(missedPart(card(A, "c_tub")));
  ok("the 4-week cycle: \"📅 Fixed day: Wednesdays (week 1 of 4)\" · \"🔄 Rolling: every 28 days after last done\" · Auto: 7 days", cy.indexOf("📅 Fixed day: Wednesdays (week 1 of 4) 🔄 Rolling: every 28 days after last done") > 0 && cy.indexOf("Waits Auto: 7 days") > 0, cy);
  A.run("cdrSet('c_tub','wait',6)"); const cy6 = txt(missedPart(card(A, "c_tub"))); A.run("cdrSet('c_tub','wait','')");
  ok("…with Waits 6: \"Its cycle week ends first, so it waits at most 4 days after Wed.\" (none for Auto)", cy6.indexOf("Its cycle week ends first, so it waits at most 4 days after Wed.") > 0 && cy.indexOf("ends first") < 0, cy6);
  const mo = txt(missedPart(card(A, "m_oven")));
  ok("a grown-up's fixed-day chore: Waits with the plan note (grown-ups' lists never wait today)", mo.indexOf("Waits Auto: 2 days") > 0 && mo.indexOf("Acts on today’s lists now") < 0 && mo.indexOf("How long a missed one stays on the list before it is dropped. Starts working when the plan is switched on.") > 0, mo);
  ok("no \"If it is missed\" on a daily chore, or on the ＋ Add form", missedPart(card(A, "a_table")) === "" && missedPart(A.run("hcAdd(); hcCardHTML()")) === "");
  A.run("cdrSet('w_auto','clock','roll')"); const rl = txt(missedPart(card(A, "w_auto")));
  ok("switched to Rolling: its chip is the lit one and Skip is not offered", /class="ce-chip sel"[^>]*>🔄 Rolling: every 7 days/.test(card(A, "w_auto")) && rl.indexOf("Skip the next") < 0, rl); A.run("cdrSet('w_auto','clock','fixed')");
  ok("not Mom: the card (and so its settings) does not open", B.run("hcOpen('w_auto'); hcCardHTML()") === "");
  // one control in two places
  const ids = ["w_auto", "b_two_auto", "b_three", "c_mop", "c_tub"], R = rules(A, ids);
  ok("⚙ Rules: an \"If missed\" column and its footnote", /<th[^>]*>If missed<\/th>/.test(R) && txt(R).indexOf("If missed: Waits acts now on the kids’ fixed-day chores. 🔄 Rolling, Skip and 📌 start working when the plan is switched on.") >= 0);
  const hc = h => handlers(h).filter(x => /^cdrSet\(/.test(x)), cardH = ids.map(id => hc(card(A, id))).flat(), rulesH = hc(R);
  const fOf = x => x.replace(/^cdrSet\('([^']+)','([^']+)'.*$/, "$1|$2"), setOf = a => Array.from(new Set(a.map(fOf))).sort();
  ok("every setting on the cards is in the table and nothing else: the same chore + field pairs, all through cdrSet", J(setOf(cardH)) === J(setOf(rulesH)) && setOf(cardH).length === 15 && handlers(missedPart(card(A, "w_auto"))).every(x => /^cdrSet\(/.test(x)), [setOf(cardH), setOf(rulesH)]);
  const pairs = [["w_auto", "wait", "4", "cdrSet('w_auto','wait',4)"], ["w_auto", "wait", "0", "cdrSet('w_auto','wait',0)"], ["w_auto", "wait", "next", "cdrSet('w_auto','wait','next')"], ["w_auto", "cover", "0", "cdrSet('w_auto','cover',0)"], ["b_two_auto", "cover", "3", "cdrSet('b_two_auto','cover',3)"], ["c_mop", "wait", "6", "cdrSet('c_mop','wait',6)"]];
  for (const [id, f, val, cardCode] of pairs) {
    const sel = rulesH.find(x => x === "cdrSet('" + id + "','" + f + "',this.value)");
    const t0 = jobsOf(w); const a = writesOf(A, "(function(){ const __t={value:" + J(val) + "}; return (function(){ " + sel.replace(/this\.value/g, "__t.value") + "; }).call(__t); })()"); await w.flush(); const ta = jobsOf(w);
    const Rh = rules(A, ids), Ch = card(A, id);
    const shownR = (new RegExp("onchange=\"cdrSet\\('" + id + "','" + f + "',this\\.value\\)\"[^]*?<option value=\"" + val + "\" selected>")).test(Rh), lab = val === "next" ? "Until its next day" : f === "cover" && val === "0" ? "Never" : f === "wait" && val === "0" ? "None" : val + (val === "1" ? " day" : " days");
    const shownC = Ch.indexOf('<button class="ce-chip sel" onclick="cdrSet(\'' + id + "','" + f + "'") >= 0 && txt(Ch.slice(Ch.indexOf('<button class="ce-chip sel" onclick="cdrSet(\'' + id + "','" + f + "'"))).indexOf(lab) === 0;
    A.run("cdrSet('" + id + "','" + f + "','')"); await w.flush();
    ok("⚙ Rules pill " + id + " " + f + " → " + val + ": its write is the card chip's write (" + cardCode + "), and both show it", !!sel && cardH.indexOf(cardCode) >= 0 && (() => { const b = writesOf(A, cardCode); return J(a.w) === J(b.w) && a.w.length === 1; })() && shownR && shownC, [a.w, shownR, shownC]);
    await w.flush(); A.run("cdrSet('" + id + "','" + f + "','')"); await w.flush(); void ta; void t0;
  }
  const kp = writesOf(A, rulesH.find(x => x.indexOf("cdrSet('w_auto','keep'") === 0)), kc = (() => { A.run("cdrSet('w_auto','keep',false)"); return writesOf(A, hc(card(A, "w_auto")).find(x => x.indexOf("cdrSet('w_auto','keep'") === 0)); })();
  ok("⚙ Rules 📌 and the card's 📌 Keep until done: the same tap, the same one write", J(kp.w) === J(kc.w) && J(kp.w) === J([["set", "household/jobs/w_auto/keep", true]]), [kp.w, kc.w]);
  ok("…and the table shows it lit after the card set it", /class="ce-chip sel"[^>]*title="Keep until done"|title="Keep until done" class="ce-chip sel"/.test(rules(A, ["w_auto"])), rules(A, ["w_auto"]).match(/<button[^>]*Keep until done[^>]*>/));
  A.run("cdrSet('w_auto','keep',false)"); await w.flush();
  const kr = writesOf(A, rulesH.find(x => x === "cdrSet('w_auto','clock','roll')")), kc2 = (() => { A.run("cdrSet('w_auto','clock','fixed')"); return writesOf(A, hc(card(A, "w_auto")).find(x => x === "cdrSet('w_auto','clock','roll')")); })();
  ok("⚙ Rules 🔄 Rolling and the card's 🔄 Rolling: the same one write", J(kr.w) === J(kc2.w) && J(kr.w) === J([["set", "household/jobs/w_auto/clock", "roll"]]), [kr.w, kc2.w]);
}

// ── C ──
console.log("\n── C · Waits on today's lists: every choice, 14 days, nothing done ──");
const runDays = async (jobs, index, days) => { const { w, A, B } = await mkWorld(jobs, index); let a = A, b = B; const out = { seen: {}, html: [], mom: [], twice: [], drop: null };
  for (let n = 0; n < days; n++) { await go(w, n, 7);
    if (dOf(n).getDay() === 0) { w.devs.splice(0); a = w.boot("A", "devA", { mom: true }); b = w.boot("B", "devB"); await w.flush(); }   // the Sunday reload (test_chore_wait D)
    ["kid_a", "kid_b", "kid_c"].forEach(k => draw(b, "chores", k)); await w.flush();
    await go(w, n, 17); const h = { kid_a: draw(b, "chores", "kid_a"), kid_b: draw(b, "chores", "kid_b"), kid_c: draw(b, "chores", "kid_c") }; await w.flush();
    ["kid_a", "kid_b", "kid_c"].forEach(k => pop(a, k, "chores")); await w.flush();   // a device booted this morning reads last week's ticks on its first look
    out.html.push(h); out.mom.push({ kid_a: pop(a, "kid_a", "chores"), kid_b: pop(a, "kid_b", "chores"), kid_c: pop(a, "kid_c", "chores") });
    Object.keys(LBL).forEach(id => { const kid = "kid_" + (id[0] === "b" ? "b" : id[0] === "c" ? "c" : "a"); const c = onList(h[kid], id); if (c) (out.seen[id] = out.seen[id] || []).push(n); if (c > 1) out.twice.push([id, n]); });
    teeth(b); await w.flush(); }
  out.miss = misses(w); out.missW = missWrites(w); out.writes = w.since(0).map(l => l.op + " " + l.path + " " + (l.keys || []).join(",")).join("\n"); out.tree = clone(w.db.tree.root); return out; };
const range = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
const NOW = await runDays(withWaits(JOBS()), IDX, 14);
{ const eff = { w_auto: 2, w_0: 0, w_1: 1, w_2: 2, w_3: 3, w_4: 4, w_5: 5, w_6: 6, w_next: 6 };
  WAITS.forEach(([id, v]) => { const W2 = eff[id], want = range(1, 1 + W2).concat(range(8, Math.min(13, 8 + W2)));
    ok("a Tuesday chore, Waits " + (v === undefined ? "Auto (2)" : J(v)) + ": on the list on days " + want.join(","), J(NOW.seen[id]) === J(want), NOW.seen[id]); });
  WAITS.forEach(([id, v]) => { const W2 = eff[id], drops = [2 + W2].concat(9 + W2 <= 13 ? [9 + W2] : []), got = NOW.missW.filter(x => x.label === LBL[id] + " — not done");
    ok("…Waits " + (v === undefined ? "Auto" : J(v)) + ": one \"— not done\" per missed turn, filed under Tuesday, written the day it drops (day " + drops.join(", ") + ")", J(Array.from(new Set(got.map(x => x.n)))) === J(drops) && got.every(x => x.dn === "tuesday") && NOW.miss.filter(x => x[3] === LBL[id] + " — not done").length === drops.length, got); });
  const note = (n, id) => (NOW.mom[n].kid_a.match(new RegExp(LBL[id] + " [^<]*⭐<span[^>]*>([^<]*)<")) || [])[1] || "";
  ok("Mom's note, Waits 4: \"from Tue · day 1 of 4\" Wed … \"day 4 of 4\" Sat; none on Sunday (dropped)", [1, 2, 3, 4].every(k => note(1 + k, "w_4") === "from Tue · day " + k + " of 4") && note(6, "w_4") === "" && onList(NOW.html[6].kid_a, "w_4") === 0, [2, 3, 4, 5, 6].map(n => note(n, "w_4")));
  ok("…Waits \"Until its next day\": \"day 6 of 6\" on Monday, back as a fresh turn on Tuesday (no note)", note(7, "w_next") === "from Tue · day 6 of 6" && note(8, "w_next") === "", [note(7, "w_next"), note(8, "w_next")]);
  ok("…Waits 1: \"day 1 of 1\"; Waits None never waits (no note, off the list Wednesday)", note(2, "w_1") === "from Tue · day 1 of 1" && note(2, "w_0") === "" && onList(NOW.html[2].kid_a, "w_0") === 0);
  ok("…Auto (no setting) is today's \"day 2 of 2\"", note(3, "w_auto") === "from Tue · day 2 of 2");
  ok("a kid's list never says \"late\" or \"from \" on any of these rows", NOW.html.every(h => rowsOf(h.kid_a).every(r => !/late|from /.test(r))));
  const nb = (n) => (NOW.mom[n].kid_b.match(/Shine the mirror [^<]*⭐<span[^>]*>([^<]*)</) || [])[1] || "";
  ok("a wait longer than the gap is cut at the next day (Tue + Fri, Waits 5): Tue's turn waits Wed–Thu (\"day 2 of 2\"), Fri's waits Sat–Mon (\"day 3 of 3\")", J(NOW.seen.b_two) === J(range(1, 13)) && nb(3) === "from Tue · day 2 of 2" && nb(7) === "from Fri · day 3 of 3" && NOW.twice.length === 0, [NOW.seen.b_two, nb(3), nb(7), NOW.twice]);
  const tw = NOW.missW.filter(x => x.label === LBL.b_two + " — not done");
  ok("…its drops: Tuesday's turn the day Friday comes (4), Friday's the day Tuesday comes (8), Tuesday's again (11)", J(Array.from(new Set(tw.map(x => x.n + ":" + x.dn)))) === J(["4:tuesday", "8:friday", "11:tuesday"]), tw);
  ok("the same chore with no setting (Auto 1 day) for comparison: days 1,2,4,5,8,9,11,12", J(NOW.seen.b_two_auto) === J([1, 2, 4, 5, 8, 9, 11, 12]), NOW.seen.b_two_auto);
  ok("a 4-week-cycle chore (Wed) with Waits 6: its cycle week ends first — on the list Wed to Sun (days 2–6), \"day 4 of 4\" on Sunday", J(NOW.seen.c_tub) === J([2, 3, 4, 5, 6]) && /Scrub the tub [^<]*⭐<span[^>]*>from Wed · day 4 of 4</.test(NOW.mom[6].kid_c), NOW.seen.c_tub);
  ok("3 a week (Mon Wed Fri) with a saved wait of 2: the old rule as before — red \"1 day late\" Tue and Thu, on the list until its next day", [1, 3].every(n => /Empty the trash<span class="rt-late">1 day late<\/span>/.test(NOW.html[n].kid_b)) && /<span class="rt-late">2 days late<\/span>/.test(NOW.html[6].kid_b) && J(NOW.seen.b_three) === J(range(0, 13)));
  ok("never two of a chore on one list", NOW.twice.length === 0, NOW.twice);
}

// ── D ──
console.log("\n── D · no setting = the app before; Rolling / 📌 / Skip = the app before on every list, pop-up and write ──");
{ const OLD = await runDays(JOBS(), BASE, 14), PLAIN = await runDays(JOBS(), IDX, 14), PO = await runDays(withPlanOnly(JOBS()), IDX, 14);
  const diffDay = (x, y) => x.html.map((h, i) => J(h) === J(y.html[i]) && J(x.mom[i]) === J(y.mom[i]) ? null : i).filter(v => v !== null);
  ok("no setting anywhere: every kid's list and Mom's pop-ups on all 14 days = the app before", diffDay(PLAIN, OLD).length === 0, diffDay(PLAIN, OLD));
  ok("…every write, in order (" + PLAIN.writes.split("\n").length + "), and the whole database = the app before", PLAIN.writes === OLD.writes && J(PLAIN.tree) === J(OLD.tree));
  ok("Rolling, 📌 Keep until done and Skip set on six chores (no Waits): every list and pop-up = the app before", diffDay(PO, OLD).length === 0, diffDay(PO, OLD));
  const strip = t => { const c = clone(t); Object.values(c.household.jobs).forEach(j => { delete j.clock; delete j.keep; delete j.cover; }); return c; };
  ok("…every write = the app before, and the database = the app before but for the saved settings themselves", PO.writes === OLD.writes && J(strip(PO.tree)) === J(OLD.tree));
  ok("(sanity) the run had missed turns to drop: " + OLD.miss.length + " \"— not done\" lines", OLD.miss.length > 5 && J(PO.miss) === J(OLD.miss));
  ok("(sanity) the Waits run differs from the app before (the mutation this test catches)", J(NOW.seen) !== J(OLD.seen));
}

// ── E ──
console.log("\n── E · the plan engine: the same output with and without the four settings ──");
{ const { w, A } = await mkWorld(JOBS()); loadH(A);
  const eng = js => A.run("(function(){ const t={jobs:" + J(js) + "}, P=" + J(W.PEOPLE) + "; return JSON.stringify([HouseEng.run(t,'2026-11-16',21,P,{kids:SL_KIDS.slice(),slots:SL_SLOTS.slice(),on:'2026-11-09'}),HouseEng.day(t,'2026-11-19',P,{kids:SL_KIDS.slice(),slots:SL_SLOTS.slice(),on:'2026-11-09',carry:[]})]); })()");
  const all = withPlanOnly(withWaits(JOBS())); Object.values(all).forEach(j => { if (!("keep" in j)) j.keep = true; });
  const e0 = eng(JOBS()), e1 = eng(all);
  ok("HouseEng.run (21 days) and HouseEng.day: byte-identical with every chore carrying clock / wait / cover / keep (" + e0.length + " bytes)", e0 === e1 && e0.length > 1000);
  const sig0 = A.run("hdSig()"); A.run("cdrSet('w_auto','wait',3); cdrSet('w_auto','keep',true); cdrSet('c_vac','clock','roll'); cdrSet('c_plants','cover',2)");
  ok("hdSig (what asks Mom to rebuild a stored plan) does not change when the four are set", A.run("hdSig()") === sig0);
  await w.flush();
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
