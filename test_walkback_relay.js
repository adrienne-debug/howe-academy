/*
 * Node tests — ↩ a walk-back re-serves the lesson THIS WEEK, in sequence (her report 2026-10-15).
 *
 * "I walked back in Social Studies and it added it to next week instead when I was already in the week. Say 6 was at
 *  the end of the week; I walked back and added 5 — 5 went to the next week and 6 stayed in this one."
 *
 * Live (week27, Lincoln, Discover! Social Studies 6A, Wed Oct 14 12:04 PM): lesson 5 had been checked Monday; lesson 6 sat
 * in the end-of-week carries box (`_eowOverflow`). The walk-back removed 5's card and re-laid the subject (Rebuild →
 * reprojectSubjectWeek). The pattern re-lay wanted 5 Thursday / 6 Friday and MOVED the boxed 6 onto Friday — but left
 * `_eowOverflow` on it, so 6 still showed in the box and the school-end guard, which skips boxed cards, saw no next sitting
 * to roll 5 into when Mom's Thursday could not take another Mom-required card: 5 was deferred off the week, 6 "stayed".
 *
 * RPUNBOX (in _reprojectPlan): a card the pattern wants this week IS a sitting — unlocked, it leaves the box with one
 * targeted <id>/_eowOverflow: null write, and that counts as a change so the save happens.
 *
 * Replays the REAL ceWalkApply (rows removed, done record / check-off / history retracted, snapshot saved) into the REAL
 * reprojectSubjectWeek + _rpPatternWant + _reprojectPlan + seGuardWeek against a fake Firebase with Firebase's rules.
 * The pre-fix code (RPUNBOX sliced out) is run as a control and must reproduce her report.
 *   run:  node test_walkback_relay.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
const ra = src.indexOf("// REPROJ_START"), rb = src.indexOf("// REPROJ_END");
const REPROJ = src.slice(ra, rb);
const CODE = REPROJ + "\n" + slice("seGuardWeek") + "\n" + slice("lessonDayList") + "\n" + slice("lessonDayFlags") + "\n" + slice("lessonDayStamp") + "\n"
  + slice("ceWalkApply") + "\n" + slice("_walkDoneKey") + "\n";
// the control: the same code with the fix sliced out (and its count term)
const CODE_OLD = CODE.replace(/ *\/\/ RPUNBOX_START[\s\S]*?\/\/ RPUNBOX_END\n/, "").replace(/\+\(\(r\.summary\.unboxed\|\|\[\]\)\.length\);[^\n]*\n/, ";\n");

console.log("── wiring ──");
{
  const ua = src.indexOf("// RPUNBOX_START"), ub = src.indexOf("// RPUNBOX_END");
  ok("RPUNBOX block exists, inside the REPROJ diff", ua > ra && ub < rb && ub > ua);
  ok("it sits in _reprojectPlan's live-card pass, before the day move", src.slice(ua, ub).indexOf("_eowOverflow") > 0 && src.indexOf("if(w.day&&w.day!==t.day){ if(locked(t)) return;", ub) > ub && src.indexOf("if(w.day&&w.day!==t.day){ if(locked(t)) return;", ub) < rb);
  ok("the unbox is a targeted <id>/_eowOverflow: null write", /upd\[t\.id\+"\/_eowOverflow"\]=null/.test(src.slice(ua, ub)));
  ok("only an unlocked card (checked / claimed / started never change)", /t\._eowOverflow&&!locked\(t\)/.test(src.slice(ua, ub)));
  ok("reprojectSubjectWeek counts an unboxed card as a change to save", /\(\(r\.summary\.unboxed\|\|\[\]\)\.length\)/.test(slice("reprojectSubjectWeek")));
  ok("the control code really lacks the fix", CODE_OLD.indexOf("RPUNBOX") < 0 && CODE_OLD.indexOf("summary.unboxed.push") < 0 && CODE_OLD.indexOf("unboxed||[]") < 0);
  ok("ceWalkApply still re-lays each walked-back subject (the 2026-08-16 rule)", /_wbSubs\.forEach\(sk=>[\s\S]*_gvRelaySubject\(ceEditKid,sk/.test(slice("ceWalkApply")));
}

// ── the world ─────────────────────────────────────────────────────────────────────────────────────
const SK = "discover_social_studies_6_student_worktext_6a", KID = "lincoln", WK = "week27";
const L = n => KID + "_" + KID + "__" + SK + "_L" + String(n).padStart(4, "0");
const toMin = s => { const m = /(\d+):(\d+)\s*(AM|PM)/.exec(s || ""); return m ? (+m[1] % 12 + (m[3] === "PM" ? 12 : 0)) * 60 + +m[2] : null; };
const fromMin = n => { let h = Math.floor(n / 60), m = n % 60, ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return h + ":" + String(m).padStart(2, "0") + " " + ap; };
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DATES = { monday: "2026-10-12", tuesday: "2026-10-13", wednesday: "2026-10-14", thursday: "2026-10-15", friday: "2026-10-16", saturday: "2026-10-17" };
const SEQ = ["Lesson 1", "Lesson 2", "Lesson 3", "Lesson 4", "Lesson 5: What Makes a Civilization (p.20)", "Lesson 6: Life in Sumer (p.22)", "Lesson 7: Ancient Writing (p.24)", "Lesson 8", "Lesson 9", "Lesson 10"];
const IDS = SEQ.map((_, i) => "L" + String(i + 1).padStart(4, "0"));
const TITLE = n => "📖 Discover! Social Studies 6 — Student Worktext 6A — " + SEQ[n - 1];
const ss = (n, day, time, x) => Object.assign({ id: L(n), who: KID, subjectKey: SK, lid: IDS[n - 1], day, time, dur: 25, mom: "required", device: "book", title: TITLE(n), detail: "25 minutes. Mom Required. Sequential. Max 1 per day." }, x || {});
let N = 0;
const c = (who, day, time, dur, sk, x) => Object.assign({ id: "2026d" + (280 + DAYS.indexOf(day)) + "_" + (N++), who, day, time, dur, subjectKey: sk, title: sk === "morning_nb" ? "📖 Morning Notebook — Morning Notebook" : sk === "closing_nb" ? "📖 Closing Notebook — Closing Notebook" : "📄 " + sk, mom: "none" }, x || {});
// the plan (what the Grid shows): 5 Thu 10/15, 6 Fri 10/16, then Mon/Fri of the following weeks
const PLAN = [["2026-10-15", 5], ["2026-10-16", 6], ["2026-10-19", 7], ["2026-10-23", 8], ["2026-10-26", 9], ["2026-10-30", 10]];

function FakeDB(tree) {
  const log = [];
  const setPath = (p, v) => { const ks = p.split("/").filter(Boolean); let x = tree;
    for (let i = 0; i < ks.length - 1; i++) { if (x[ks[i]] == null || typeof x[ks[i]] !== "object") x[ks[i]] = {}; x = x[ks[i]]; }
    if (v === null) delete x[ks[ks.length - 1]]; else x[ks[ks.length - 1]] = JSON.parse(JSON.stringify(v)); };
  const get = p => p.split("/").filter(Boolean).reduce((x, k) => (x == null ? x : x[k]), tree);
  return { tree, log, ref(base) { return {
    once: () => Promise.resolve({ val: () => JSON.parse(JSON.stringify(get(base) || null)) }),
    set(v) { log.push({ op: "set", base, keys: [] }); setPath(base, v); return Promise.resolve(); },
    remove() { log.push({ op: "remove", base, keys: [] }); setPath(base, null); return Promise.resolve(); },
    update(map) { const ks = Object.keys(map);
      for (const a of ks) for (const b of ks) if (a !== b && b.indexOf(a + "/") === 0) throw new Error("update failed: /" + a + " is ancestor of /" + b);
      ks.forEach(k => setPath(base + "/" + k, map[k])); log.push({ op: "update", base, keys: ks, map: JSON.parse(JSON.stringify(map)) }); return Promise.resolve(); } }; } };
}

// Lincoln's week. Thursday: `thuBusy` adds Mom-required cards of the OTHER kids across the whole day (Mom has no 25-minute
// gap left) plus Lincoln's own Mom-required German, and a stacked pair so the guard re-lays the day (live shape).
function world(o) {
  o = o || {};
  const tasks = [];
  ["monday", "tuesday", "wednesday", "thursday", "friday"].forEach(d => {
    tasks.push(c(KID, d, "10:00 AM", 5, "morning_nb"));
    tasks.push(c(KID, d, "10:05 AM", 25, "mr_pages"));
    tasks.push(c(KID, d, "10:30 AM", 25, "eggspress_l"));
    tasks.push(c(KID, d, "2:00 PM", 5, "closing_nb"));
  });
  if (o.thuBusy) {
    tasks.push(c(KID, "thursday", "10:55 AM", 25, "german_flash_cards", { mom: "required" }));
    tasks.push(c(KID, "thursday", "11:00 AM", 15, "conventions"));   // stacked on German → the guard re-lays Thursday
    [["ellis", "10:00 AM", 60], ["lucy", "11:00 AM", 60], ["julian", "12:00 PM", 60], ["ellis", "2:00 PM", 60], ["lucy", "3:00 PM", 75]]
      .forEach(([who, t, dur]) => tasks.push(c(who, "thursday", t, dur, "other_mom", { mom: "required" })));
  }
  // lesson 5: checked Monday
  tasks.push(ss(5, "monday", "11:05 AM", { cascade: true }));
  // lesson 6: at the end of the week
  if (o.six === "box-saturday") tasks.push(ss(6, "saturday", "10:00 AM", { _eowOverflow: true }));
  else if (o.six === "box-friday") tasks.push(ss(6, "friday", "3:55 PM", { _eowOverflow: true }));   // the cap rule keeps a card's day
  else if (o.six === "friday") tasks.push(ss(6, "friday", "2:25 PM"));
  const checked = { [L(5)]: "02:34 PM Oct 12" };
  if (o.six === "box-friday" && o.sixChecked) checked[L(6)] = "03:55 PM Oct 16";
  const history = { [L(5)]: { id: L(5), lid: "L0005", day: "monday", ts: "02:34 PM Oct 12", week: WK, who: KID } };
  const done = { L0001: { day: "2026-09-15", src: "check", taskId: "2026d256_4196", ts: "03:33 PM Sep 15" }, L0004: { day: "2026-10-05", src: "check", taskId: L(4), ts: "11:29 AM Oct 5" }, L0005: { day: "2026-10-12", src: "check", taskId: L(5), ts: "02:34 PM Oct 12" } };
  const tree = { [WK]: { tasks: Object.fromEntries(tasks.map(t => [t.id, JSON.parse(JSON.stringify(t))])), checked: Object.assign({}, checked), history: JSON.parse(JSON.stringify(history)) },
    curriculum: { done: { [KID]: { [SK]: JSON.parse(JSON.stringify(done)) } } }, walkbacks: {}, walkback_excl: {} };
  const db = FakeDB(tree); const dbgL = [], toasts = [];
  const subj = { display: "Discover! Social Studies 6 — Student Worktext 6A", mom: "required", minutes: 25, timesPerWeek: 2, allowedDays: ["Mon", "Tue", "Wed", "Thu", "Fri"], pacing: { mode: "timesPerWeek", tpw: 2, builtThrough: "2027-02-26" }, planAnchor: "2026-10-14", lessonIds: IDS.slice(), lessonSeq: SEQ.slice(), rules: "sequential" };
  const localHist = { [WK + "_history"]: JSON.parse(JSON.stringify(history)) };
  const env = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, parseInt, isNaN, Promise, Infinity,
    WK, weekData: { tasks: tasks.map(t => Object.assign({}, t)) }, fbTasksLoaded: true, checked, claimed: {}, histState: JSON.parse(JSON.stringify(history)), archive: {},
    db, _dryRun: () => false, sv: (k, v) => { localHist[k] = v; }, ld: k => localHist[k], dbg: m => dbgL.push(m), gwShowToast: m => toasts.push(m),
    currData: { subjects: { [KID]: { [SK]: subj } }, done: { [KID]: { [SK]: done } } },
    planBacked: () => true, currWeekNum: () => 27, gwWeekDateRange: () => ({ start: "2026-10-12", end: "2026-10-16" }), _schoolWeekDateFor: d => d,
    _todayStr: () => "2026-10-14", gwParseDate: s => new Date(s + "T12:00:00"), _cbISO: () => "2026-10-14",
    haClaimSchedLock: (k, cb) => cb(function () {}), generateWeek: () => ({ result: { tasks: [] } }), gwSatPlanned: () => false,
    gwRules: () => ({ schoolStart: 600, schoolEnd: 975, lunchStart: 780, lunchEnd: 840 }), toMin, fromMin, packAround: () => null,
    calDateForWeekDay: d => DATES[d] || null, _ovRmX: (kid, ds) => ds === "2026-10-13",   // Tuesday co-op: no Mom-required base
    planMaterialize: () => ({ assignments: PLAN.map(([date, n]) => ({ date, lid: IDS[n - 1], text: SEQ[n - 1] })), extras: [] }),
    seGuardCtx: x => Object.assign({ days: ["monday", "tuesday", "wednesday", "thursday", "friday"], todayDay: "wednesday", nowMin: 12 * 60 + 7,
      win: () => ({ start: 600, end: 975, lunchStart: 780, lunchEnd: 840 }), kidOff: () => false, isClass: () => false,
      isLesson: t => /_L\d+$/.test(String(t.id || "")), ahead: () => 0, toMin, fromMin }, x || {}),
    // ── walk-back sheet state (ceWalkGather's output for lesson 5, Mom's note, "take them off the schedule" ticked) ──
    ceEditKid: KID, ceEditKey: SK, _ceWalkItems: [{ wk: WK, wkNum: 27, dord: 0, doneKey: L(5), baseId: L(5), title: TITLE(5), detail: "25 minutes", day: "monday", ts: "02:34 PM Oct 12", hist: history[L(5)], archive: false }],
    ceWalkSel: new Set([0]), document: { getElementById: id => id === "ce-walk-note" ? { value: "  he never did it  " } : id === "ce-walk-remove" ? { checked: true } : null },
    confirm: () => true, manualUnchecks: new Set(), ckForget: () => {}, obRemove: () => {}, lastCheckedWrite: 0, HA_LS: { setItem: () => {} },
    walkbackExcl: {}, walkbackData: {}, nowTs: () => "12:04 PM Oct 14", baseId: id => String(id || "").replace(/(_c)+$/, ""), schedCascade: () => { env.cascades = (env.cascades || 0) + 1; },
    renderAll: () => {}, ceRenderEditSheet: () => {},
    // the real one reads lidStamped / lidsFor; this mirrors its first branch (done record keyed by lid, found by the card id)
    lidDoneRemoveByCard: (kid, sk, ids, title, patch) => { const node = env.currData.done[kid][sk]; const set = new Set(ids.filter(Boolean)); const lid = Object.keys(node).find(k => node[k] && set.has(node[k].taskId)) || null; if (!lid) return null; patch["done/" + kid + "/" + sk + "/" + lid] = null; delete node[lid]; return lid; },
  };
  // frozen clock: Wednesday Oct 14, 12:07 PM
  const RealDate = Date;
  env.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else { super("2026-10-14T00:00:00"); this.setHours(12, 7, 0, 0); } } static now() { return new RealDate("2026-10-14T12:07:00").getTime(); } };
  vm.createContext(env);
  new vm.Script(o.old ? CODE_OLD : CODE).runInContext(env);
  new vm.Script("var relayOut=null; function _gvRelaySubject(kid,sk,msg){ reprojectSubjectWeek(kid,sk,'relay',{then:function(v){ relayOut=v; }}); return true; }").runInContext(env);
  env._rpRelayMode = () => o.mode || "tomorrow";
  return { env, db, dbgL, toasts, subj };
}
const card = (w, n) => w.env.weekData.tasks.find(t => t.id === L(n)) || null;
const srv = (w, n) => (w.db.tree[WK].tasks || {})[L(n)] || null;
const dayIx = d => DAYS.indexOf(d);
async function walkBack(w) { w.env.ceWalkApply(); await new Promise(r => setTimeout(r, 5)); await new Promise(r => setTimeout(r, 5)); return w.env.relayOut; }
const writesTo = (w, base) => w.db.log.filter(e => e.base === base);

(async () => {
console.log("\n── her case: 6 in the carries box, walk back 5 mid-week → 5 then 6 THIS week ──");
for (const mode of ["tomorrow", "today"]) {
  const w = world({ six: "box-saturday", mode });
  const out = await walkBack(w);
  ok("[" + mode + "] the re-lay ran after the walk-back", !!out, w.dbgL);
  ok("[" + mode + "] lesson 5 is back on this week, Thursday", card(w, 5) && card(w, 5).day === "thursday", card(w, 5) && card(w, 5).day);
  ok("[" + mode + "] lesson 6 follows on Friday — the pattern's next day", card(w, 6) && card(w, 6).day === "friday", card(w, 6) && card(w, 6).day);
  ok("[" + mode + "] 6 left the end-of-week box (no _eowOverflow)", card(w, 6) && !card(w, 6)._eowOverflow, card(w, 6));
  ok("[" + mode + "] in sequence: 5 before 6", dayIx(card(w, 5).day) < dayIx(card(w, 6).day));
  ok("[" + mode + "] the server agrees: 5 Thursday, 6 Friday, neither boxed", srv(w, 5) && srv(w, 5).day === "thursday" && srv(w, 6) && srv(w, 6).day === "friday" && !srv(w, 6)._eowOverflow, [srv(w, 5), srv(w, 6)]);
  ok("[" + mode + "] Monday's walked-back card is gone (base row removed, nothing re-checked)", !w.env.weekData.tasks.some(t => t.id === L(5) && t.day === "monday") && !w.env.checked[L(5)] && !w.db.tree[WK].checked[L(5)]);
  ok("[" + mode + "] no SS card anywhere carries the box flag", !w.env.weekData.tasks.some(t => t.subjectKey === SK && t._eowOverflow));
  ok("[" + mode + "] the diff reports the unboxed card", out && Array.isArray(out.unboxed) && out.unboxed.indexOf(L(6)) >= 0, out && out.unboxed);
  if (mode === "tomorrow") {
    const tu = writesTo(w, WK + "/tasks");
    ok("the tasks write is ONE targeted update (never a whole-node set)", tu.length === 1 && tu[0].op === "update" && !w.db.log.some(e => e.op === "set" && /^week27/.test(e.base)), tu.map(e => e.op));
    ok("it writes 6's day/time and _eowOverflow: null beside them — no path beside its own child", tu[0].map[L(6) + "/day"] === "friday" && tu[0].map[L(6) + "/_eowOverflow"] === null && !(L(6) in tu[0].map), Object.keys(tu[0].map).filter(k => k.indexOf(L(6)) === 0));
    ok("5 is added as a whole card", tu[0].map[L(5)] && tu[0].map[L(5)].day === "thursday" && tu[0].map[L(5)].lid === "L0005");
    ok("walk-back writes: tasks/<id> remove, checked update {id:null}, history/<id> remove — all targeted", writesTo(w, WK + "/tasks/" + L(5)).some(e => e.op === "remove") && writesTo(w, WK + "/checked").every(e => e.op === "update" && e.map[L(5)] === null) && writesTo(w, WK + "/history/" + L(5)).some(e => e.op === "remove"));
    const cu = writesTo(w, "curriculum");
    ok("done record: curriculum update sets done/lincoln/<sk>/L0005 to null (and lastEdit)", cu.length === 1 && cu[0].map["done/" + KID + "/" + SK + "/L0005"] === null && typeof cu[0].map.lastEdit === "string", cu);
    ok("done record gone locally and on the server", !w.env.currData.done[KID][SK].L0005 && !w.db.tree.curriculum.done[KID][SK].L0005);
    const wb = w.db.log.filter(e => e.op === "set" && /^walkbacks\/lincoln\/wb_/.test(e.base));
    ok("a snapshot is saved under walkbacks/lincoln/wb_* with the removed card and her note", wb.length === 1 && Object.values(w.db.tree.walkbacks.lincoln)[0].note === "he never did it" && Object.values(w.db.tree.walkbacks.lincoln)[0].items[0].removedFromSchedule === true);
    ok("walkback_excl/<id> set true (the carry never resurrects it)", w.db.tree.walkback_excl[L(5)] === true);
    const bases = new Set(w.db.log.map(e => e.base));
    ok("no other nodes written", [...bases].every(b => /^(week27\/(tasks|checked|history)(\/|$)|curriculum$|walkbacks\/|walkback_excl\/)/.test(b)), [...bases]);
    ok("the cascade was asked for (debounced sweep), the toast says walked back", w.env.cascades === 1 && w.toasts.some(t => /Walked back 1/.test(t)));
  }
}

console.log("\n── control: the pre-fix code reproduces her report ──");
{
  const w = world({ six: "box-saturday", old: true });
  const out = await walkBack(w);
  ok("old code: 6 moved to Friday but STILL boxed (ghost sitting)", card(w, 6) && card(w, 6).day === "friday" && card(w, 6)._eowOverflow === true, card(w, 6));
  ok("old code: nothing reports an unboxed card", !out || !out.unboxed || out.unboxed.length === 0, out && out.unboxed);
  ok("old code: the server copy of 6 keeps the flag too", srv(w, 6) && srv(w, 6)._eowOverflow === true);
}

console.log("\n── the live squeeze: Mom's Thursday is full → 5 rolls into 6's Friday sitting, 6 defers; never 5 off / 6 boxed ──");
{
  const w = world({ six: "box-saturday", thuBusy: true });
  const out = await walkBack(w);
  ok("5 stays on this week — it took 6's Friday sitting", card(w, 5) && card(w, 5).day === "friday", card(w, 5) && card(w, 5).day);
  ok("6 left the week (lesson undone → next week's build serves it after 5)", !card(w, 6) && !srv(w, 6));
  ok("nothing of the subject sits in the carries box", !w.env.weekData.tasks.some(t => t.subjectKey === SK && t._eowOverflow));
  ok("the guard rolled 5 and deferred 6 (sequence kept)", out && out.removed.indexOf(L(6)) >= 0 && card(w, 5) && !card(w, 5)._eowOverflow, out && out.removed);
  const tu = writesTo(w, WK + "/tasks")[0];
  ok("ghost rule D: 6 is removed whole — no <id>/_eowOverflow beside <id>: null", tu && tu.map[L(6)] === null && !Object.keys(tu.map).some(k => k.indexOf(L(6) + "/") === 0), tu && Object.keys(tu.map).filter(k => k.indexOf(L(6)) === 0));
  ok("Friday still ends on time (no stacking, Closing last)", (() => { const fri = w.env.weekData.tasks.filter(t => t.who === KID && t.day === "friday").sort((a, b) => toMin(a.time) - toMin(b.time)); for (let i = 1; i < fri.length; i++) if (toMin(fri[i].time) < toMin(fri[i - 1].time) + (fri[i - 1].dur || 20)) return false; const last = fri[fri.length - 1]; return /closing/i.test(last.title) && toMin(last.time) + last.dur <= 975; })(), w.env.weekData.tasks.filter(t => t.who === KID && t.day === "friday").map(t => t.time + " " + t.subjectKey));
  // the same squeeze on the OLD code = her report
  const o = world({ six: "box-saturday", thuBusy: true, old: true });
  await walkBack(o);
  ok("old code, same week: 5 went to next week and 6 stayed in this one (boxed) — her words", !card(o, 5) && card(o, 6) && card(o, 6)._eowOverflow === true, [card(o, 5), card(o, 6)]);
}

console.log("\n── a boxed card already on the day the plan wants: it is unboxed alone, and that alone is a write ──");
{
  const w = world({ six: "box-friday" });
  const out = await walkBack(w);
  ok("6 keeps Friday and leaves the box", card(w, 6) && card(w, 6).day === "friday" && !card(w, 6)._eowOverflow, card(w, 6));
  ok("5 lands Thursday ahead of it", card(w, 5) && card(w, 5).day === "thursday");
  const tu = writesTo(w, WK + "/tasks")[0];
  ok("the targeted write carries <id>/_eowOverflow: null (and no day write — it never moved)", tu && tu.map[L(6) + "/_eowOverflow"] === null && tu.map[L(6) + "/day"] === undefined, tu && Object.keys(tu.map));
  ok("summary.unboxed names it", out && out.unboxed.indexOf(L(6)) >= 0);
}
{
  // nothing else to do but unbox → the save still happens
  const w = world({ six: "box-friday" });
  // pretend 5 is already laid on Thursday (so the diff has no add/move) — only 6's flag is wrong
  const five = ss(5, "thursday", "10:55 AM"); w.env.weekData.tasks = w.env.weekData.tasks.filter(t => t.id !== L(5)).concat([five]); w.db.tree[WK].tasks[L(5)] = JSON.parse(JSON.stringify(five));
  delete w.env.checked[L(5)]; delete w.db.tree[WK].checked[L(5)]; delete w.env.currData.done[KID][SK].L0005;
  let out = null; w.env.reprojectSubjectWeek(KID, SK, "relay", { then: v => { out = v; } }); await new Promise(r => setTimeout(r, 5));
  const tu = writesTo(w, WK + "/tasks");
  ok("unbox-only re-lay: one update, containing exactly the flag write (plus any shift)", tu.length === 1 && tu[0].map[L(6) + "/_eowOverflow"] === null, tu.map(e => Object.keys(e.map)));
  ok("summary counts it (added 0, moved 0, unboxed 1)", out && out.added.length === 0 && out.moved.length === 0 && out.unboxed.length === 1, out);
}

console.log("\n── locked cards never change: a CHECKED boxed card keeps its flag and is not written ──");
{
  const w = world({ six: "box-friday", sixChecked: true });
  await walkBack(w);
  ok("checked 6 untouched (still flagged, still Friday)", card(w, 6) && card(w, 6)._eowOverflow === true && card(w, 6).day === "friday");
  const tu = writesTo(w, WK + "/tasks")[0];
  ok("no write names 6", !tu || !Object.keys(tu.map).some(k => k.indexOf(L(6)) === 0), tu && Object.keys(tu.map));
  ok("5 still re-laid this week", card(w, 5) && card(w, 5).day === "thursday");
}

console.log("\n── ghost rule F: an unbox write for a card not on the server is dropped, never recreating it ──");
{
  const w = world({ six: "box-friday" });
  delete w.db.tree[WK].tasks[L(6)];   // another device already removed 6; this device still holds it
  const out = await walkBack(w);
  const tu = writesTo(w, WK + "/tasks")[0];
  ok("no <L0006>/… field write reached the server", tu && !Object.keys(tu.map).some(k => k.indexOf(L(6) + "/") === 0), tu && Object.keys(tu.map));
  ok("the server has no ghost {_eowOverflow} node for 6", !srv(w, 6));
  ok("the drop was logged", w.dbgL.some(m => /👻 dropped/.test(m) && m.indexOf(L(6) + "/_eowOverflow") >= 0), w.dbgL);
  ok("5 still landed Thursday", out && card(w, 5) && card(w, 5).day === "thursday");
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})();
