/*
 * 🃏 DRILLTHREE — a third practice card a day (her pick 2026-11-22: "Allow three", asked with the trade-offs laid out; slice 9
 * of DESIGN_drill_rows_curriculum_2026-11-19.md). A third slot per day at mastery/retrievalPlan/<kid>/week3 (same shape as
 * week2). The week builder and the live-week pass read the day's kinds only through retrDayKinds. Against code sliced out of
 * index.html (RETRWEEK + RETRFAM + the DRILLTHREE block, GWRETR, SCHOOLEND with DMSLOT's seRetrSlot + seGuardCtx, the ⏰ day-time
 * readers, RETRLIVE, the Mastery panel's editor with RETRSAVE + DRILLSAVE, DRILLROWS, DRILLDAYS, DRILLADD), and against the
 * same tree with the slice taken out again (stripThree — every edit undone byte for byte):
 *   0. stripThree undoes the slice exactly: no trace left, and the touched regions equal origin/main's (stripped the same way —
 *      still true after this branch is merged)
 *   1. REPLAY, plans with NO week3: the builder's whole output (every card: id, day, kind, minutes, time, the day's box, the
 *      Closing Notebook re-times) and the live pass's adds / removes / re-times are byte-identical with and without the slice —
 *      random made-up weeks and plans, three children (two with a sprint ladder, one without), two clocks (before the week;
 *      a running Wednesday)
 *   2. a week3 kind: exactly one more card on that day (never a duplicate kind), laid by the second card's own rule — the
 *      result equals the unchanged builder laying it in a second pass after rows 1–2; the live pass adds exactly those cards,
 *      the same way, and takes exactly those off again when the third row is cleared; a built week is already what the live
 *      pass wants
 *   3. card ids: rows 1–2 keep theirs; <year>d<day>_retr_<kind>_<kid>; never two the same
 *   4. readers: retrDayKinds / retrOn / the Curriculum line's saved side read the third row; the Min column and the brain-work
 *      strip read through retrDayKinds
 *   5. writers: drDaysMap's third slot; a day tap / Card practice Save write week3 only when it is used (a plan that never used
 *      it writes {week, week2} exactly as before), clear it when its last kind goes; the old Mastery day buttons never touch it;
 *      Mom only, ?dryrun=1 sends nothing
 *   run:  node test_drill_three.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm"), cp = require("child_process");
const { stripPoint } = require("./test_drill_pointer.js");   // DRILLPOINT (slice 6): the panel's save is numbers only now — compared regions strip it on both sides
const { stripCoop } = require("./test_drill_coop.js");      // DRILLCOOP: the co-op laying rule — compared regions and the reader pins strip it (its own test pins it)

// ── stripThree: the slice taken out again. The block (inside RETRWEEK) goes; every other edit is put back to its old text.
// [new text, old text] — exactly what the slice changed outside its block (each new text occurs exactly once).
const THREE_EDITS = [
  ["  return [rp.week,rp.week2,rp.week3].some(w=>w&&typeof w===\"object\"&&RETR_DAYS.some(d=>w[d]&&w[d]!==\"off\"));   // DRILLTHREE: + the third row\n}\n// RETRFAM_END", "  return [rp.week,rp.week2].some(w=>w&&typeof w===\"object\"&&RETR_DAYS.some(d=>w[d]&&w[d]!==\"off\"));\n}\n// RETRFAM_END"],
  ["  [retrWeek(kid)[dk],retrWeek2(kid)[dk],retrWeek3(kid)[dk]].forEach(k=>{ if(k&&k!==\"off\"&&out.indexOf(k)<0&&(lad||RETR_NOLADDER_KINDS[k])) out.push(k); });   // 🧠 RETRFAM: no ladder → drill + match only · DRILLTHREE: + the third row\n", "  [retrWeek(kid)[dk],retrWeek2(kid)[dk]].forEach(k=>{ if(k&&k!==\"off\"&&out.indexOf(k)<0&&(lad||RETR_NOLADDER_KINDS[k])) out.push(k); });   // 🧠 RETRFAM: no ladder → drill + match only\n"],
  ["      // Row 1 + optional Row 2 (retrievalPlan/{kid}/week2) — up to two slots that day,\n      // never the same kind twice (retrDayKinds dedupes). Template keys are mon/tue/….\n      // DRILLTHREE: + optional Row 3 (…/week3) — up to three; each laid by this same loop, after the one before it.\n", "      // Row 1 + optional Row 2 (retrievalPlan/{kid}/week2) — up to two slots that day,\n      // never the same kind twice (retrDayKinds dedupes). Template keys are mon/tue/….\n"],
  ["  const w1=(rp.week&&typeof rp.week===\"object\")?rp.week:{}, w2=(rp.week2&&typeof rp.week2===\"object\")?rp.week2:{};\n  const w3=(rp.week3&&typeof rp.week3===\"object\")?rp.week3:{};   // DRILLTHREE\n  RETR_DAYS.forEach(function(d){\n    on[d]=live?retrDayKinds(kid,d):[];\n    saved[d]=[w1[d],w2[d],w3[d]].filter(function(k){ return k&&k!==\"off\"; });   // DRILLTHREE: + the third row\n", "  const w1=(rp.week&&typeof rp.week===\"object\")?rp.week:{}, w2=(rp.week2&&typeof rp.week2===\"object\")?rp.week2:{};\n  RETR_DAYS.forEach(function(d){\n    on[d]=live?retrDayKinds(kid,d):[];\n    saved[d]=[w1[d],w2[d]].filter(function(k){ return k&&k!==\"off\"; });\n"],
  ["// DRILLTHREE: w3 = the third slot (retrWeek3; leaving it out = an empty third slot) → also week3, cleaned like week2 (off /\n// same as week or week2 dropped); a day is full only with THREE other kinds, and full names all three.\nfunction drDaysMap(w1,w2,day,kind,on,w3){\n  const days=(typeof RETR_DAYS!==\"undefined\")?RETR_DAYS:[\"mon\",\"tue\",\"wed\",\"thu\",\"fri\"];\n  const a={}, b={}, c={};\n  days.forEach(function(d){\n    a[d]=((w1||{})[d])||\"off\";\n    const x=((w2||{})[d])||\"off\"; b[d]=(x===a[d])?\"off\":x;   // the same kind twice is never kept\n    const y=((w3||{})[d])||\"off\"; c[d]=(y===a[d]||y===b[d])?\"off\":y;   // DRILLTHREE\n  });\n  let changed=false;\n  if(days.indexOf(day)>=0&&kind&&kind!==\"off\"){\n    if(on){\n      if(a[day]!==kind&&b[day]!==kind&&c[day]!==kind){   // DRILLTHREE\n        if(a[day]===\"off\"){ a[day]=kind; changed=true; }\n        else if(b[day]===\"off\"){ b[day]=kind; changed=true; }\n        else if(c[day]===\"off\"){ c[day]=kind; changed=true; }   // DRILLTHREE: the third slot\n        else return {ok:false,full:[a[day],b[day],c[day]]};   // DRILLTHREE\n      }\n    } else {\n      if(a[day]===kind){ a[day]=\"off\"; changed=true; }\n      if(b[day]===kind){ b[day]=\"off\"; changed=true; }\n      if(c[day]===kind){ c[day]=\"off\"; changed=true; }   // DRILLTHREE\n    }\n  }\n  const week={}, week2={}, week3={};   // DRILLTHREE\n  days.forEach(function(d){ week[d]=a[d]; if(b[d]!==\"off\"&&b[d]!==a[d]) week2[d]=b[d]; if(c[d]!==\"off\"&&c[d]!==a[d]&&c[d]!==b[d]) week3[d]=c[d]; });   // DRILLTHREE\n  return {ok:true,changed:changed,week:week,week2:week2,week3:week3};   // DRILLTHREE\n}", "function drDaysMap(w1,w2,day,kind,on){\n  const days=(typeof RETR_DAYS!==\"undefined\")?RETR_DAYS:[\"mon\",\"tue\",\"wed\",\"thu\",\"fri\"];\n  const a={}, b={};\n  days.forEach(function(d){\n    a[d]=((w1||{})[d])||\"off\";\n    const x=((w2||{})[d])||\"off\"; b[d]=(x===a[d])?\"off\":x;   // the same kind twice is never kept\n  });\n  let changed=false;\n  if(days.indexOf(day)>=0&&kind&&kind!==\"off\"){\n    if(on){\n      if(a[day]!==kind&&b[day]!==kind){\n        if(a[day]===\"off\"){ a[day]=kind; changed=true; }\n        else if(b[day]===\"off\"){ b[day]=kind; changed=true; }\n        else return {ok:false,full:[a[day],b[day]]};\n      }\n    } else {\n      if(a[day]===kind){ a[day]=\"off\"; changed=true; }\n      if(b[day]===kind){ b[day]=\"off\"; changed=true; }\n    }\n  }\n  const week={}, week2={};\n  days.forEach(function(d){ week[d]=a[d]; if(b[d]!==\"off\"&&b[d]!==a[d]) week2[d]=b[d]; });\n  return {ok:true,changed:changed,week:week,week2:week2};\n}"],
  ["function drDaysWrite(kid,week,week2,week3){\n  if(!_drMom()) return false;\n  const pl={week:week,week2:week2}; if(drThreeIn(kid,week3)) pl.week3=week3;   // DRILLTHREE: week3 only when used (drThreeIn)\n  if(!drPlanWrite(kid,pl,{rhythm:true})) return false;\n", "function drDaysWrite(kid,week,week2){\n  if(!_drMom()) return false;\n  if(!drPlanWrite(kid,{week:week,week2:week2},{rhythm:true})) return false;\n"],
  ["  const r=drDaysMap(retrWeek(kid),retrWeek2(kid),day,kind,!lit,retrWeek3(kid));   // DRILLTHREE\n", "  const r=drDaysMap(retrWeek(kid),retrWeek2(kid),day,kind,!lit);\n"],
  ["  else if(r.changed&&drDaysWrite(kid,r.week,r.week2,r.week3)){ drDaysSaved=kid+\"|\"+kind; saved=true; }   // DRILLTHREE\n", "  else if(r.changed&&drDaysWrite(kid,r.week,r.week2)){ drDaysSaved=kid+\"|\"+kind; saved=true; }\n"],
  ["      +esc(dl)+' already has three: '+esc(drAnd(ks.map(tt)))+'. Turn one of those off for '+esc(dl)+' first.<div style=\"margin-top:6px\">';   // DRILLTHREE\n", "      +esc(dl)+' already has two: '+esc(tt(ks[0]))+' and '+esc(tt(ks[1]))+'. Turn one of those off for '+esc(dl)+' first.<div style=\"margin-top:6px\">';\n"],
  ["function daRoom(w1,w2,kind,w3){   // DRILLTHREE: + w3\n  const out={};\n  Object.keys(DR_DAY_SHORT).forEach(function(d){ const r=drDaysMap(w1,w2,d,kind,true,w3); out[d]=r.ok?true:r.full; });\n", "function daRoom(w1,w2,kind){\n  const out={};\n  Object.keys(DR_DAY_SHORT).forEach(function(d){ const r=drDaysMap(w1,w2,d,kind,true); out[d]=r.ok?true:r.full; });\n"],
  ["function daPlan(w1,w2,kind,days,w3){   // DRILLTHREE: + w3 → + week3\n  let a=w1||{}, b=w2||{}, c=w3||{}, changed=false; const on=[], full=[];\n  (days||[]).forEach(function(d){ const r=drDaysMap(a,b,d,kind,true,c); if(!r.ok){ full.push(d); return; } a=r.week; b=r.week2; c=r.week3; if(r.changed) changed=true; on.push(d); });\n  const z=drDaysMap(a,b,\"\",kind,true,c);   // no day: just the shape every save writes\n  return {week:z.week,week2:z.week2,week3:z.week3,on:on,full:full,changed:changed};\n", "function daPlan(w1,w2,kind,days){\n  let a=w1||{}, b=w2||{}, changed=false; const on=[], full=[];\n  (days||[]).forEach(function(d){ const r=drDaysMap(a,b,d,kind,true); if(!r.ok){ full.push(d); return; } a=r.week; b=r.week2; if(r.changed) changed=true; on.push(d); });\n  const z=drDaysMap(a,b,\"\",kind,true);   // no day: just the shape every save writes\n  return {week:z.week,week2:z.week2,on:on,full:full,changed:changed};\n"],
  ["  const w1=retrWeek(kid), w2=retrWeek2(kid), w3=retrWeek3(kid), room=kind?daRoom(w1,w2,kind,w3):{};   // DRILLTHREE\n", "  const w1=retrWeek(kid), w2=retrWeek2(kid), room=kind?daRoom(w1,w2,kind):{};\n"],
  ["  return {info:info,list:list,kind:kind,w1:w1,w2:w2,w3:w3,room:room,roomDays:roomDays,lit:lit};   // DRILLTHREE\n", "  return {info:info,list:list,kind:kind,w1:w1,w2:w2,room:room,roomDays:roomDays,lit:lit};\n"],
  ["  const p=daPlan(st.w1,st.w2,st.kind,st.lit,st.w3);   // DRILLTHREE\n", "  const p=daPlan(st.w1,st.w2,st.kind,st.lit);\n"],
  ["  if(!drDaysWrite(kid,p.week,p.week2,p.week3)) return say(\"Not saved — try again.\");   // DRILLTHREE\n", "  if(!drDaysWrite(kid,p.week,p.week2)) return say(\"Not saved — try again.\");\n"],
  ["      return esc((DR_DAY_LONG[d]||d)+\" is full: \"+drAnd((st.room[d]||[]).map(_daTitle))+\".\");   // DRILLTHREE: all three named\n", "      return esc((DR_DAY_LONG[d]||d)+\" is full: \"+(st.room[d]||[]).map(_daTitle).join(\" and \")+\".\");\n"]
];
function stripThree(s) {
  if (s.indexOf("DRILLTHREE") < 0) return s;   // a tree without the slice (origin/main before it is merged)
  const a = s.indexOf("// DRILLTHREE_START"), b = s.indexOf("// DRILLTHREE_END\n");
  if (a < 0 || b < a) throw new Error("DRILLTHREE block markers not found");
  s = s.slice(0, a) + s.slice(b + "// DRILLTHREE_END\n".length);
  THREE_EDITS.forEach(function (p) {
    const n = s.split(p[0]).length - 1;
    if (n !== 1) throw new Error("stripThree: an edit is not there exactly once (" + n + "): " + p[0].slice(0, 80));
    s = s.replace(p[0], () => p[1]);
  });
  return s;
}
module.exports = { stripThree };
if (require.main !== module) return;

const { stripPause } = require("./test_drill_pause.js");   // DRILLPAUSE (slice 5): this test pins its own slice on the tree with the pause taken out (both sides); test_drill_pause.js pins the pause
const { stripSwitch } = require("./test_drill_switch.js");   // DRILLSWITCH (slice 7): its door / strip / paper-drill lines and its block are taken out on both sides (test_drill_switch.js pins them)
const src = stripPause(stripSwitch(fs.readFileSync(path.join(__dirname, "index.html"), "utf8")));   // DRILLPAUSE   // DRILLSWITCH
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 600) + ")" : "")); } }
function fnIn(S, name) { const i = S.indexOf("function " + name + "("); if (i < 0) throw new Error("not found " + name); let d = 0; for (let k = S.indexOf("{", i); k < S.length; k++) { if (S[k] === "{") d++; else if (S[k] === "}") { d--; if (!d) return S.slice(i, k + 1); } } throw new Error("unbalanced " + name); }
function sliceIn(S, a, b) { const i = S.indexOf(a), j = S.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error("marker " + a); return S.slice(i, j + b.length); }
const clone = x => JSON.parse(JSON.stringify(x));
const J = JSON.stringify;
const esc = s => String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const DEF_RE = /const RETR_WEEK_DEFAULT=\{[\s\S]*?\n\s*lincoln:\{[^}]*\}\};/;
const D3 = ["mon", "tue", "wed", "thu", "fri"], DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const WDAY_MAP = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const ISO = { monday: "2026-11-02", tuesday: "2026-11-03", wednesday: "2026-11-04", thursday: "2026-11-05", friday: "2026-11-06" };
const doy = d => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
const toMin = s => { const m = String(s || "").match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return null; let h = +m[1] % 12; if (/pm/i.test(m[3])) h += 12; return h * 60 + +m[2]; };
const fromMin = mn => { let h = Math.floor(mn / 60), m = mn % 60, ap = h >= 12 ? "PM" : "AM"; h = h % 12; if (h === 0) h = 12; return h + ":" + String(m).padStart(2, "0") + " " + ap; };
// seeded, so a failure can be replayed
function rng(seed) { let a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const SRC0 = stripThree(src);

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("0. stripThree undoes the slice exactly");
{
  ok("the block is there once, inside RETRWEEK", src.split("// DRILLTHREE_START").length === 2 && src.split("// DRILLTHREE_END").length === 2
    && src.indexOf("// RETRWEEK_START") < src.indexOf("// DRILLTHREE_START") && src.indexOf("// DRILLTHREE_END") < src.indexOf("// RETRWEEK_END"));
  const touched = S => ["RETRWEEK", "GWRETR", "DRILLROWS", "DRILLDAYS", "DRILLADD"].map(m => sliceIn(S, "// " + m + "_START", "// " + m + "_END")).join("\n");
  ok("stripped: no trace of the slice (anywhere: the marker / the reader; in the touched blocks: week3, w3, the third slot)", !/DRILLTHREE|retrWeek3|drThreeIn|drAnd\(/.test(SRC0) && !/week3|\bw3\b|\bc\[d(ay)?\]/.test(touched(SRC0)));
  ok("stripped: the old two-slot text is back (refusal names two)", /already has two: '\+esc\(tt\(ks\[0\]\)\)\+' and '\+esc\(tt\(ks\[1\]\)\)/.test(SRC0) && /else return \{ok:false,full:\[a\[day\],b\[day\]\]\};/.test(SRC0));
  let main = ""; try { main = cp.execSync("git show origin/main:index.html", { cwd: __dirname, encoding: "utf8", maxBuffer: 1 << 28, stdio: ["ignore", "pipe", "ignore"] }); } catch (e) { main = ""; } main = stripPause(stripSwitch(main));   // DRILLPAUSE: the same on origin/main's side
  if (main) {
    const M0 = stripThree(main);
    const regions = [["// RETRWEEK_START", "// RETRWEEK_END"], ["// GWRETR_START", "// GWRETR_END"], ["// RETRLIVE_START", "// RETRLIVE_END"],
      ["// SCHOOLEND_START", "// SCHOOLEND_END"], ["// DRILLROWS_START", "// DRILLROWS_END"], ["// DRILLDAYS_START", "// DRILLDAYS_END"],
      ["// DRILLADD_START", "// DRILLADD_END"], ["// RETRSAVE_START", "// RETRSAVE_END"]];
    const P0 = stripPoint(stripCoop(SRC0)), PM = stripPoint(stripCoop(M0));   // DRILLCOOP taken out the same way on both sides too   // DRILLPOINT (slice 6) taken out the same way on both sides (a no-op without it)
    const diff = regions.filter(r => sliceIn(P0, r[0], r[1]) !== sliceIn(PM, r[0], r[1])).map(r => r[0]);
    ok("stripped, RETRWEEK / GWRETR / RETRLIVE / SCHOOLEND / DRILLROWS / DRILLDAYS / DRILLADD / RETRSAVE equal origin/main's (stripped the same way)", diff.length === 0, diff);
  } else console.log("  (origin/main not readable here — compare skipped)");
  const g0 = sliceIn(src, "// GWRETR_START", "// GWRETR_END"), g1 = sliceIn(SRC0, "// GWRETR_START", "// GWRETR_END");
  ok("the week builder's code is untouched (one comment line added, nothing else)", g0.replace(/\n *\/\/ DRILLTHREE:[^\n]*/, "") === g1);
  ok("the live pass and the slot finder are untouched", sliceIn(src, "// RETRLIVE_START", "// RETRLIVE_END") === sliceIn(SRC0, "// RETRLIVE_START", "// RETRLIVE_END")
    && fnIn(src, "seRetrSlot") === fnIn(SRC0, "seRetrSlot"));
}

// ── the scheduler world (builder + slot finder + live pass), from a given source ──
function schedCode(S) {
  return [sliceIn(S, "// RETRWEEK_START", "// RETRWEEK_END").replace(DEF_RE, "const RETR_WEEK_DEFAULT={};"),
    sliceIn(S, "// GWRETR_START", "// GWRETR_END"), sliceIn(S, "// SCHOOLEND_START", "// SCHOOLEND_END"),
    S.slice(S.indexOf("function dtSd("), S.indexOf("// ── what the day is")), sliceIn(S, "// RETRLIVE_START", "// RETRLIVE_END")].join("\n");
}
const LADDER = { k1: true, k2: true, k3: false };   // k3 has no sprint ladder → Drill + Match only (RETRFAM)
function schedEnv(S, nowIso) {
  const NOW = new Date(nowIso).getTime();
  class FD extends Date { constructor(...a) { if (!a.length) super(NOW); else super(...a); } static now() { return NOW; } }
  const writes = [];
  const env = {
    rulesData: { schoolDay: { defaultStart: "9:00 AM", defaultEnd: "4:00 PM", lunchStart: "12:00 PM", lunchEnd: "1:00 PM" } },
    masteryData: { retrievalPlan: {}, history: {} }, ROSTER: ["k1", "k2", "k3"],
    retrTracks: k => (LADDER[k] ? [{ key: "t" }] : []),
    MIN: { drill: 5, match: 10, sprint: 2, recheck: 3 },
    gwParseDate: s => new FD(s + "T12:00:00"),
    mlMomSpan: (t, s, d) => [s, s + (d == null ? (t.dur || 20) : d)],
    stIsoOk: s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || "")), stDsOf: dn => ISO[dn] || null,
    _todayDay: null, DAY_DT: {}, currData: { subjects: {} }, checked: {}, claimed: {},
    cap: s => String(s).charAt(0).toUpperCase() + String(s).slice(1),
    db: { ref: p => ({ update: v => writes.push(p), set: v => writes.push(p), remove: () => writes.push(p) }) }, _dryRun: () => true,
    dbg: () => {}, toMin, fromMin, Date: FD, Math, Object, JSON, String, Number, Array, parseInt, parseFloat, isNaN, Set, Map, RegExp, console,
  };
  env.retrSlotMinutes = (k, kind) => env.MIN[kind] || 15;
  env.gwRules = () => { const sd = env.rulesData.schoolDay; return { schoolStart: toMin(sd.defaultStart), schoolEnd: toMin(sd.defaultEnd), lunchStart: toMin(sd.lunchStart), lunchEnd: toMin(sd.lunchEnd) }; };
  vm.createContext(env);
  new vm.Script(schedCode(S)).runInContext(env);
  env.retrSlotMinutes = (k, kind) => env.MIN[kind] || 15;   // the test's minutes, not the app's measured ones
  env._writes = writes; env._NOW = new FD();
  return env;
}
function build(env, plan, tasks) {
  env.masteryData.retrievalPlan = clone(plan);
  const T = clone(tasks), dates = {};
  const sorted = DAYS.map(dn => { dates[dn] = "x"; return ISO[dn]; });
  env.gwInjectRetrieval(T, sorted, WDAY_MAP, new Set(), dates, doy);
  return T;
}
function liveCtx(env, kid) {
  const n = env._NOW, iso = n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0") + "-" + String(n.getDate()).padStart(2, "0");
  const g = env.seGuardCtx();
  return { dayISO: dn => ISO[dn] || null, todayISO: iso, todayOpen: true, nowMin: Math.ceil((n.getHours() * 60 + n.getMinutes()) / 5) * 5,
    win: (dn, ds) => g.win(dn, ds), kidOff: () => false, checked: {}, claimed: {},
    on: env.retrOn(kid), kinds: dk => env.retrDayKinds(kid, dk), minutes: k => env.retrSlotMinutes(kid, k), mom: k => env.retrSlotMom(k),
    toMin, fromMin, slot: (ts, c, W, x) => env.seRetrSlot(ts, c, W, x) };
}
function live(env, plan, tasks, kids) {
  env.masteryData.retrievalPlan = clone(plan);
  let T = clone(tasks); const out = [];
  (kids || env.ROSTER).forEach(kid => {
    const d = env.retrLiveDiff(kid, T, liveCtx(env, kid));
    out.push(clone({ kid, upd: d.upd, added: d.added, removed: d.removed, retimed: d.retimed }));
    T = applyDiff(T, d);
  });
  return { diffs: out, tasks: T };
}
function applyDiff(T, d) {
  T = T.filter(t => d.removed.indexOf(t.id) < 0).map(t => { const r = d.retimed.find(x => x.id === t.id); return r ? Object.assign({}, t, { time: r.to }) : t; });
  return T.concat(clone(d.added));
}
const KINDS = ["drill", "match", "sprint", "recheck"];
function randWeek(r, kids) {
  const T = []; let n = 0;
  kids.forEach(kid => DAYS.forEach(dn => {
    if (r() < 0.12) return;                                            // off that day
    let t = toMin(["8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM"][Math.floor(r() * 4)]);
    if (r() < 0.6) { T.push({ id: kid + "_" + dn + "_mnb", who: kid, day: dn, time: fromMin(t), dur: 15, mom: "none", subjectKey: "morning_nb", title: "Morning Notebook", cascade: true }); t += 15; }
    const packed = r() < 0.25;                                         // a packed day: no gaps, up to the end — the day's box gets used
    const k = packed ? 9 + Math.floor(r() * 4) : 2 + Math.floor(r() * 7);
    for (let i = 0; i < k; i++) {
      t += packed ? 0 : [0, 0, 5, 10, 30][Math.floor(r() * 5)];
      if (t >= toMin("12:00 PM") && t < toMin("1:00 PM")) t = toMin("1:00 PM");
      const dur = [10, 15, 20, 25, 30, 45][Math.floor(r() * 6)];
      T.push({ id: kid + "_" + dn + "_" + (++n), who: kid, day: dn, time: fromMin(t), dur, mom: r() < 0.4 ? "required" : "none", subjectKey: "s" + Math.floor(r() * 6), title: "Card " + n, cascade: true });
      t += dur;
    }
    if (r() < 0.7) T.push({ id: kid + "_" + dn + "_cnb", who: kid, day: dn, time: fromMin(t), dur: 10, mom: "none", subjectKey: "closing_nb", title: "Closing Notebook", cascade: true });
  }));
  return T;
}
function randRow(r, pOn) { const w = {}; D3.forEach(d => { if (r() < pOn) w[d] = r() < 0.2 ? "off" : KINDS[Math.floor(r() * 4)]; }); return w; }
function randPlan(r, kids, o) {
  o = o || {}; const p = {};
  kids.forEach(kid => {
    if (r() < 0.12) return;                                            // no plan for this child
    const e = { week: randRow(r, 0.9) };
    if (r() < 0.75) e.week2 = randRow(r, 0.7);
    if (o.three && r() < (o.pThree || 0.85)) e.week3 = randRow(r, 0.7);
    if (r() < 0.2) e.settings = { gate_pct: 80 };
    p[kid] = e;
  });
  return p;
}
function randDay(env, r) {
  env.MIN = { drill: [5, 8, 10][Math.floor(r() * 3)], match: [10, 15][Math.floor(r() * 2)], sprint: 2, recheck: 3 };
  env.rulesData.schoolDay = Object.assign({}, env.rulesData.schoolDay, { defaultEnd: ["3:00 PM", "3:30 PM", "4:00 PM", "4:15 PM"][Math.floor(r() * 4)] });
}
const byId = T => T.slice().sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
const retr = T => T.filter(t => t.subjectKey === "retrieval");
const CLOCKS = [["2026-11-01T20:00:00", "before the week (Sunday evening)"], ["2026-11-04T11:47:00", "a running Wednesday, 11:47"]];

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("1. REPLAY — plans with no week3: the builder and the live pass are byte-identical with and without the slice");
{
  const N = 250;
  CLOCKS.forEach(function (c, ci) {
    const A = schedEnv(src, c[0]), B = schedEnv(SRC0, c[0]);
    let same = 0, cards = 0, boxed = 0, retimed = 0, twoDays = 0, liveSame = 0, adds = 0, rems = 0, lre = 0;
    const bad = [];
    for (let i = 0; i < N; i++) {
      const r = rng(1000 * (ci + 1) + i), kids = ["k1", "k2", "k3"];
      const T = randWeek(r, kids), P = randPlan(r, kids), P2 = randPlan(r, kids);
      const s1 = r(); randDay(A, rng(s1 * 1e9)); randDay(B, rng(s1 * 1e9));
      const a = build(A, P, T), b = build(B, P, T);
      if (J(a) === J(b)) same++; else bad.push(["build", i]);
      const ra = retr(a); cards += ra.length; boxed += ra.filter(t => t._dayDrop).length;
      retimed += a.filter((t, k) => t.subjectKey === "closing_nb" && J(t) !== J(T.find(x => x.id === t.id))).length;
      kids.forEach(k => DAYS.forEach(dn => { if (ra.filter(t => t.who === k && t.day === dn).length === 2) twoDays++; }));
      // the live pass: the week built with P, then the plan changes to P2
      const la = live(A, P2, a), lb = live(B, P2, a);
      if (J(la.diffs) === J(lb.diffs)) liveSame++; else bad.push(["live", i]);
      la.diffs.forEach(d => { adds += d.added.length; rems += d.removed.length; lre += d.retimed.length; });
    }
    ok(c[1] + ": " + N + " random weeks — builder output byte-identical (" + cards + " practice cards, " + boxed + " in the day's box, " + retimed + " Closing re-times, " + twoDays + " two-card days)", same === N && cards > 500 && boxed > 50 && twoDays > 50, bad.slice(0, 5));
    ok(c[1] + ": " + N + " plan changes — live pass byte-identical (" + adds + " added, " + rems + " taken off, " + lre + " Closing re-times)", liveSame === N && adds > 100 && rems > 100, bad.slice(0, 5));
  });
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("2. a week3 kind: one more card that day, laid by the second card's own rule");
{
  const N = 200;
  CLOCKS.forEach(function (c, ci) {
    const A = schedEnv(src, c[0]), B = schedEnv(SRC0, c[0]);
    const today = A._NOW.getDay() >= 1 && A._NOW.getDay() <= 5 ? WDAY_MAP[A._NOW.getDay()] : null;
    const openDays = today ? DAYS.slice(DAYS.indexOf(today)) : DAYS;
    let sameTwoPass = 0, countOk = 0, thirds = 0, noDup = 0, liveOk = 0, idem = 0, offOk = 0, third3 = 0, boxed3 = 0;
    const bad = [];
    for (let i = 0; i < N; i++) {
      const r = rng(50000 + 1000 * ci + i);
      const kid = ["k1", "k2", "k3"][i % 3];                          // one child on the plan (the others' cards stay, for Mom's lane)
      const T = randWeek(r, ["k1", "k2", "k3"]);
      const P = randPlan(r, [kid], { three: true, pThree: 1 }); if (!P[kid]) { P[kid] = { week: randRow(r, 0.9), week3: randRow(r, 0.8) }; }
      const P0 = clone(P); delete P0[kid].week3;
      const s1 = r(); randDay(A, rng(s1 * 1e9)); randDay(B, rng(s1 * 1e9));
      // the slice: one pass with three rows
      const a = build(A, P, T);
      // the reference: the UNCHANGED builder (slice stripped) lays rows 1–2, then lays the third row's new kinds in a second pass
      A.masteryData.retrievalPlan = clone(P0);
      const want2 = {}; DAYS.forEach(dn => { const d3 = dn.slice(0, 3); want2[dn] = A.retrOn(kid) ? A.retrDayKinds(kid, d3) : []; });
      A.masteryData.retrievalPlan = clone(P);
      const want3 = {}; DAYS.forEach(dn => { const d3 = dn.slice(0, 3); want3[dn] = A.retrOn(kid) ? A.retrDayKinds(kid, d3) : []; });
      const row3 = {}; D3.forEach((d3, k) => { const dn = DAYS[k]; const x = want3[dn].filter(z => want2[dn].indexOf(z) < 0); row3[d3] = x.length ? x[0] : "off"; });
      const b1 = build(B, P0, T), b = build(B, { [kid]: { week: row3 } }, b1);
      if (J(byId(a)) === J(byId(b))) sameTwoPass++; else bad.push(["twopass", i]);
      // per day: exactly the kinds retrDayKinds gives, one card each, one more than rows 1–2 where the third row adds a kind
      let cOk = true, dOk = true;
      DAYS.forEach(dn => {
        const has = T.some(t => t.who === kid && t.day === dn);
        const mineA = retr(a).filter(t => t.who === kid && t.day === dn), mineB1 = retr(b1).filter(t => t.who === kid && t.day === dn);
        const extra = want3[dn].length - want2[dn].length;
        if (has && mineA.length !== mineB1.length + extra) cOk = false;
        if (!has && mineA.length) cOk = false;
        if (extra > 1) cOk = false;
        if (has && extra === 1) { thirds++; if (mineA.length === 3) third3++; if (mineA.find(t => t.retrieval === row3[dn.slice(0, 3)])._dayDrop) boxed3++; }
        if (new Set(mineA.map(t => t.retrieval)).size !== mineA.length) dOk = false;
        // rows 1–2: the same cards, same ids, same places
        mineB1.forEach(x => { const y = mineA.find(t => t.id === x.id); if (!y || J(y) !== J(x)) cOk = false; });
      });
      if (cOk) countOk++; else bad.push(["count", i]);
      if (dOk && new Set(a.map(t => t.id)).size === a.length) noDup++; else bad.push(["dup", i]);
      // the live pass: the week built with rows 1–2, then the third row saved → exactly the third cards, the same way (open days)
      const L = live(A, P, b1, [kid]);
      const restrict = T2 => byId(T2.filter(t => openDays.indexOf(t.day) >= 0));
      const addIds = L.diffs[0].added.map(t => t.id).sort();
      const wantIds = retr(b).filter(t => t.who === kid && openDays.indexOf(t.day) >= 0 && !b1.some(x => x.id === t.id)).map(t => t.id).sort();
      if (J(addIds) === J(wantIds) && L.diffs[0].removed.length === 0 && J(restrict(L.tasks)) === J(restrict(b))) liveOk++; else bad.push(["live", i, addIds, wantIds]);
      // a week built with three rows is already what the live pass wants
      const L2 = live(A, P, a, [kid]);
      if (!L2.diffs[0].added.length && !L2.diffs[0].removed.length && !L2.diffs[0].retimed.length) idem++; else bad.push(["idem", i]);
      // the third row cleared → exactly its cards come off (open days), nothing else
      const L3 = live(A, P0, a, [kid]);
      const offWant = retr(a).filter(t => t.who === kid && openDays.indexOf(t.day) >= 0 && !b1.some(x => x.id === t.id)).map(t => t.id).sort();
      if (J(L3.diffs[0].removed.slice().sort()) === J(offWant) && !L3.diffs[0].added.length) offOk++; else bad.push(["off", i]);
    }
    ok(c[1] + ": " + N + " plans with a third row — one pass == the unchanged builder's two passes, card for card (" + thirds + " third cards, " + third3 + " of them a day's third, " + boxed3 + " in the day's box)", sameTwoPass === N && thirds > 100 && third3 > 20 && boxed3 > 10, bad.filter(x => x[0] === "twopass").slice(0, 5));
    ok(c[1] + ": exactly one more card on a day the third row adds a kind; rows 1–2 cards unchanged; none on a day off", countOk === N, bad.filter(x => x[0] === "count").slice(0, 5));
    ok(c[1] + ": never the same kind twice on a day, never two cards with one id", noDup === N, bad.filter(x => x[0] === "dup").slice(0, 5));
    ok(c[1] + ": the live pass adds exactly the third cards, laid the same way" + (today ? " (today and later)" : ""), liveOk === N, bad.filter(x => x[0] === "live").slice(0, 3));
    ok(c[1] + ": a week built with three rows needs no live change", idem === N, bad.filter(x => x[0] === "idem").slice(0, 5));
    ok(c[1] + ": the third row cleared → exactly its cards come off, nothing else", offOk === N, bad.filter(x => x[0] === "off").slice(0, 5));
  });
  // a worked day, by hand: rows Sprint / Daily Drill / Match & Play on Monday, school 9–4, room after the last card
  {
    const A = schedEnv(src, CLOCKS[0][0]);
    const T = [{ id: "c1", who: "k1", day: "monday", time: "9:00 AM", dur: 60, mom: "none", subjectKey: "s1", title: "A", cascade: true },
      { id: "c2", who: "k1", day: "monday", time: "1:00 PM", dur: 60, mom: "none", subjectKey: "s2", title: "B", cascade: true },
      { id: "c3", who: "k1", day: "monday", time: "2:00 PM", dur: 10, mom: "none", subjectKey: "closing_nb", title: "Closing Notebook", cascade: true }];
    const a = build(A, { k1: { week: { mon: "sprint" }, week2: { mon: "drill" }, week3: { mon: "match" } } }, T);
    const m = retr(a).map(t => [t.retrieval, t.time, t.dur, t.id]);
    ok("worked Monday: Sprint 2:00, Daily Drill 2:02, Match & Play 2:07 — each right after the one before; Closing Notebook moves to 2:17",
      J(m) === J([["sprint", "2:00 PM", 2, "2026d306_retr_sprint_k1"], ["drill", "2:02 PM", 5, "2026d306_retr_drill_k1"], ["match", "2:07 PM", 10, "2026d306_retr_match_k1"]]) && a.find(t => t.id === "c3").time === "2:17 PM", { m, close: a.find(t => t.id === "c3").time });
    const f = build(A, { k1: { week: { mon: "drill" }, week2: { mon: "drill" }, week3: { mon: "drill" } } }, T);
    ok("worked Monday: the same kind in all three rows → one card", retr(f).length === 1);
  }
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("3. card ids");
{
  const A = schedEnv(src, CLOCKS[0][0]);
  let good = 0, n = 0, stable = 0;
  for (let i = 0; i < 120; i++) {
    const r = rng(90000 + i), kids = ["k1", "k2", "k3"];
    const T = randWeek(r, kids), P = randPlan(r, kids, { three: true });
    const a = build(A, P, T);
    const P0 = clone(P); Object.keys(P0).forEach(k => delete P0[k].week3);
    const b = build(A, P0, T);
    n++;
    const ids = retr(a).map(t => t.id);
    if (new Set(a.map(t => t.id)).size === a.length && retr(a).every(t => t.id === "2026d" + doy(new Date(ISO[t.day] + "T12:00:00")) + "_retr_" + t.retrieval + "_" + t.who)) good++;
    if (retr(b).every(t => ids.indexOf(t.id) >= 0)) stable++;
  }
  ok("120 weeks with third rows: every id is <year>d<day>_retr_<kind>_<kid>, never two the same", good === n);
  ok("…and every row 1–2 card keeps its id when a third row is added", stable === n);
}

// ── the Curriculum / Mastery world (readers and writers), from the real source ──
function uiWorld(o) {
  o = o || {};
  const S = src, writes = [], sets = [], queued = [], log = [], toasts = [];
  const els = {};
  const env = {
    console, JSON, Math, Object, Array, Set, Map, String, Number, parseInt, parseFloat, isNaN, RegExp, Error, Date,
    masteryKid: o.masteryKid || "kida",
    masteryData: Object.assign({ retrievalPlan: clone(o.plan || {}) }, clone(o.items || {})),
    currData: { subjects: {}, lessons: {} },
    ROSTER: ["kida", "kidb"], SL_KLBL: { kida: "Kid A", kidb: "Kid B" }, KID_COLOR: { kida: "#0ea5e9", kidb: "#e11d48" },
    cap: k => ({ kida: "Kid A", kidb: "Kid B" })[k] || k, esc,
    retrTracks: k => (k === "kida" ? [{ key: "t" }] : []),
    retrSettings: () => ({ sprint_seconds: 60, sprint_rounds: 2, review_count: 3, slot_min_drill: 5, slot_min_match: 10 }),
    mastMeasuredDrillMin: () => null, mastIsNeverDrill: () => false, mstOwnedIds: () => new Set(),
    momHere: () => o.mom !== false, _dryRun: () => !!o.dry,
    HA_LS: { setItem: () => log.push("ls"), getItem() { return null; } },
    retrLiveQueue: k => { queued.push(k); return true; }, retrLivePending: () => false,
    _mastRe: () => log.push("repaint"), renderAll: () => {}, gwShowToast: m => toasts.push(m),
    mhqKid: "kidb", mhqView: "week", mhqDeck: null, mpSchoolOpen: () => {},
    requestAnimationFrame: () => {}, setTimeout: () => 1, clearTimeout: () => {},
    document: { body: { style: {}, appendChild: e => { els[e.id] = e; } }, getElementById: id => els[id] || null,
      createElement: () => ({ style: {}, innerHTML: "", querySelector() { return null; } }) },
    writes, sets, queued, log, toasts, els,
  };
  env.db = o.db === false ? null : { ref: p => ({ update: v => writes.push({ p, v: clone(v) }), set: v => sets.push({ p, v }), remove: () => sets.push({ p, remove: true }) }) };
  vm.createContext(env);
  vm.runInContext(fnIn(S, "retrSlotMinutes") + "\n" + sliceIn(S, "// RETRWEEK_START", "// RETRWEEK_END").replace(DEF_RE, "const RETR_WEEK_DEFAULT={};") + "\n"
    + sliceIn(S, "// GWRETR_START", "// GWRETR_END") + "\n"
    + S.slice(S.indexOf("let retrAdminLocal=null;"), S.indexOf("// ── P4: schedule day-card strip")) + "\n"
    + sliceIn(S, "// DRILLROWS_START", "// DRILLROWS_END") + "\n" + sliceIn(S, "// DRILLDAYS_START", "// DRILLDAYS_END") + "\n"
    + "let ceAddKid=null, afStep=0; function ceRenderAddSheet(){} function ceCloseSheet(){} function ceOpenAdd(k){ ceAddKid=k; }\n"
    + sliceIn(S, "// DRILLADD_START", "// DRILLADD_END")
    + "\n;this.__admin=()=>retrAdminLocal;this.__setAddKid=k=>{ceAddKid=k;};this.__full=()=>drDaysFull;this.RETR_SLOT_TITLE=RETR_SLOT_TITLE;", env);
  env.sheet = () => (els["dr-days-wrap"] || {}).innerHTML || "";
  return env;
}
const wk = (mon, tue, wed, thu, fri) => ({ mon, tue, wed, thu, fri });
const litIn = h => { const out = []; h.replace(/class="ce-chip dr-day( on)?"[^>]*onclick="drDaysTap\('(\w+)'\)"/g, (m, on, d) => { if (on) out.push(d); }); return out; };

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("4. readers");
{
  const w = uiWorld({ plan: { kida: { week: wk("sprint", "off", "off", "off", "off"), week2: { mon: "drill" }, week3: { mon: "match", tue: "recheck", wed: "off" } },
    kidb: { week3: { tue: "drill", wed: "sprint" } } } });
  ok("retrDayKinds: rows 1, 2, 3 in that order", J(w.retrDayKinds("kida", "mon")) === J(["sprint", "drill", "match"]) && J(w.retrDayKinds("kida", "tue")) === J(["recheck"]) && J(w.retrDayKinds("kida", "wed")) === "[]");
  ok("retrDayKinds: the third row still follows RETRFAM (no ladder → Drill + Match only)", J(w.retrDayKinds("kidb", "tue")) === J(["drill"]) && J(w.retrDayKinds("kidb", "wed")) === "[]");
  ok("retrOn: a no-ladder child with only a third row is in the rhythm", w.retrOn("kidb") === true);
  ok("retrWeek3: a copy of what is saved, {} when nothing", J(w.retrWeek3("kida")) === J({ mon: "match", tue: "recheck", wed: "off" }) && J(w.retrWeek3("nobody")) === "{}");
  const rows = w.drRows("kida").map(r => r.kind + ":" + r.dayText + (r.ok ? "" : "(grey)"));
  ok("the Curriculum lines read the third row (Match & Play · Mon, Re-checks · Tue)", J(rows) === J(["drill:Mon", "match:Mon", "sprint:Mon", "recheck:Tue"]), rows);
  const rb = w.drRows("kidb").map(r => r.kind + ":" + r.dayText + (r.ok ? "" : "(grey)"));
  ok("…and a third-row kind the child can't run shows greyed (saved side)", J(rb) === J(["drill:Tue", "sprint:Wed(grey)"]), rb);
  const w0 = uiWorld({ plan: { kida: { week: wk("sprint", "off", "off", "off", "off"), week2: { mon: "drill" } } } });
  ok("no week3 → retrDayKinds as before", J(w0.retrDayKinds("kida", "mon")) === J(["sprint", "drill"]));
  const SC = stripCoop(src);   // DRILLCOOP: these readers now go retrDayKindsOn → retrDayKinds (the co-op filter, pinned in test_drill_coop.js)
  ok("the Grid's Min column adds retrDayKinds' kinds (so a third card's minutes count)", /retrDayKinds\(gvKid,DOWS\[d\.getDay\(\)\]\.toLowerCase\(\)\)\.filter\([^)]*\)\);?\s*retrievalMins=_rks\.reduce/.test(SC) || /const _rks=retrDayKinds\(gvKid,[^;]*;\s*retrievalMins=_rks\.reduce\(/.test(SC));
  ok("the Day page's brain-work strip reads retrTodayKinds → retrDayKinds", /function retrTodayKinds\(kid\)\{[\s\S]{0,120}return retrDayKinds\(kid,RETR_DAYS\[d-1\]\);/.test(src) && /const kinds=retrTodayKinds\(kid\);/.test(fnIn(SC, "retrSchedStripHtml")));
  ok("the builder and the live pass read the day's kinds only through retrDayKinds", /const kinds=\(typeof retrDayKinds==="function"\)\?retrDayKinds\(kid,dn\.slice\(0,3\)\)/.test(SC) && /kinds:dk=>retrDayKinds\(kid,dk\)/.test(SC)
    && /function retrDayKindsOn\(kid,dk,ds\)\{ return retrDayKinds\(kid,dk\)\.filter\(/.test(src));   // DRILLCOOP's reader is a filter on retrDayKinds
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("5. writers");
{
  const w = uiWorld();
  const M = (a, b, d, k, on, c) => clone(w.drDaysMap(a, b, d, k, on, c));
  let r = M(wk("sprint", "off", "off", "off", "off"), { mon: "drill" }, "mon", "match", true);
  ok("drDaysMap: two kinds, a third → week3; the others not moved", r.ok && r.changed && J(r.week3) === J({ mon: "match" }) && J(r.week2) === J({ mon: "drill" }) && r.week.mon === "sprint", r);
  r = M(wk("sprint", "off", "off", "off", "off"), { mon: "drill" }, "mon", "recheck", true, { mon: "match" });
  ok("drDaysMap: three kinds, a fourth → refused, names all three", r.ok === false && J(r.full) === J(["sprint", "drill", "match"]), r);
  r = M(wk("sprint", "off", "off", "off", "off"), {}, "mon", "drill", true, { mon: "match" });
  ok("drDaysMap: a free second slot is used before the third (week, then week2, then week3)", r.ok && J(r.week2) === J({ mon: "drill" }) && J(r.week3) === J({ mon: "match" }), r);
  r = M(wk("sprint", "off", "off", "off", "off"), { mon: "drill" }, "mon", "match", false, { mon: "match", tue: "off" });
  ok("drDaysMap: off in the third slot → dropped from week3; off days never stored there", r.ok && r.changed && J(r.week3) === "{}", r);
  r = M(wk("drill", "off", "off", "off", "off"), { mon: "match" }, "tue", "sprint", true, { mon: "drill", tue: "match", wed: "off" });
  ok("drDaysMap: a third row repeating week / week2 is never kept", J(r.week3) === J({ tue: "match" }) && r.week.tue === "sprint", r);
  r = M(wk("drill", "off", "off", "off", "off"), { mon: "match" }, "mon", "match", true, { mon: "sprint" });
  ok("drDaysMap: already on → nothing to save", r.ok && r.changed === false);
  r = M(wk("drill", "off", "off", "off", "off"), {}, "mon", "match", true);
  ok("drDaysMap: no w3 (old callers) = an empty third slot, week3 {}", r.ok && J(r.week3) === "{}" && J(r.week2) === J({ mon: "match" }), r);
  // random: the old two-slot answer is unchanged whenever the third slot isn't needed
  const B0 = uiWorld.call(null); const KS = KINDS.concat(["off"]);
  const old = vm.runInNewContext("(" + fnIn(SRC0, "drDaysMap") + ")", { RETR_DAYS: D3 });
  let agree = 0, n = 0; const rr = rng(7);
  for (let i = 0; i < 2000; i++) {
    const a = {}, b = {}; D3.forEach(d => { if (rr() < .9) a[d] = KS[Math.floor(rr() * 5)]; if (rr() < .6) b[d] = KS[Math.floor(rr() * 5)]; });
    const d = D3[Math.floor(rr() * 5)], k = KINDS[Math.floor(rr() * 4)], on = rr() < .6;
    const o1 = clone(old(a, b, d, k, on)), o2 = clone(B0.drDaysMap(a, b, d, k, on, {}));
    n++;
    if (o1.ok) { if (o2.ok && J(o1.week) === J(o2.week) && J(o1.week2) === J(o2.week2) && J(o2.week3) === "{}" && o1.changed === o2.changed) agree++; }
    else if (o2.ok && J(o2.week3) === J({ [d]: k }) && J(o2.week) === J(clone(old(a, b, "", k, on)).week)) agree++;   // the old refusal → now the third slot
  }
  ok("2000 random taps with no third row: the same week / week2 as the two-slot rule; where it refused, the kind goes to week3", agree === n, { agree, n });
}
{
  // a day tap from the sheet
  const plan = { kida: { settings: { gate_pct: 80 }, week: wk("sprint", "match", "off", "sprint", "recheck"), week2: wk("drill", "drill", "drill", "drill", "drill") } };
  const w = uiWorld({ plan });
  w.drDaysOpen("kida", "drill"); w.drDaysTap("wed");
  ok("a plan that never used the third slot writes exactly {week, week2} (as before)", w.writes.length === 1 && J(Object.keys(w.writes[0].v).sort()) === J(["week", "week2"]), w.writes[0] && w.writes[0].v);
  w.drDaysOpen("kida", "recheck"); w.drDaysTap("mon");
  const v = w.writes[1] && w.writes[1].v;
  ok("Re-checks on Mon (Sprint + Drill there) → one targeted update with week3 {mon:recheck}", w.writes.length === 2 && w.writes[1].p === "mastery/retrievalPlan/kida" && J(v.week3) === J({ mon: "recheck" }) && J(Object.keys(v).sort()) === J(["week", "week2", "week3"]) && w.sets.length === 0, v);
  ok("…never settings; the mirror keeps them; the live pass queued", !("settings" in v) && w.masteryData.retrievalPlan.kida.settings.gate_pct === 80 && w.queued.length === 2);
  ok("…the sheet shows Mon lit, read through the builder's reader", litIn(w.sheet()).indexOf("mon") >= 0 && w.retrDayKinds("kida", "mon").indexOf("recheck") >= 0);
  w.drDaysOpen("kida", "match"); const ok3 = w.drDaysTap("mon") === false;
  ok("Match on Mon (Sprint, Daily Drill, Re-checks) → refused, nothing written", ok3 && w.writes.length === 2 && J(w.__full()) === J({ day: "mon", kinds: ["sprint", "drill", "recheck"] }));
  ok("…the message names all three", w.sheet().indexOf("Monday already has three: \u{1F3C3} Sprint, \u{1F0CF} Daily Drill and \u{1F4C5} Sprint Re-checks. Turn one of those off for Monday first.") >= 0, w.sheet().slice(w.sheet().indexOf("dr-full"), w.sheet().indexOf("dr-full") + 260));
  ok("…and offers all three lines", ["sprint", "drill", "recheck"].every(k => w.sheet().indexOf("drDaysOpen('kida','" + k + "')") >= 0));
  w.drDaysOpen("kida", "recheck"); w.drDaysTap("mon");
  ok("the last third-row kind off → week3 {} (clears the node)", w.writes.length === 3 && J(w.writes[2].v.week3) === "{}", w.writes[2] && w.writes[2].v);
  w.drDaysOpen("kida", "drill"); w.drDaysTap("tue");
  ok("…and after that, writes are {week, week2} again", w.writes.length === 4 && J(Object.keys(w.writes[3].v).sort()) === J(["week", "week2"]), w.writes[3] && w.writes[3].v);
}
{
  // the Mastery ▸ Settings panel never erases a saved week3 (DRILLPOINT, slice 6: its day buttons are gone; a number saves settings only)
  const plan = { kida: { week: wk("sprint", "match", "off", "sprint", "recheck"), week2: { mon: "drill" }, week3: { mon: "match", tue: "drill" } } };
  const w = uiWorld({ plan, masteryKid: "kida" });
  w.retrAdminInit(); w.retrAdminNum("gate_pct", "75");
  ok("a Mastery number: one save, settings only (no week3, no days)", w.writes.length === 1 && J(Object.keys(w.writes[0].v)) === J(["settings"]), w.writes.map(x => Object.keys(x.v)));
  ok("…update() keeps week3 in the database and in the mirror", J(w.masteryData.retrievalPlan.kida.week3) === J({ mon: "match", tue: "drill" }));
  ok("…and the builder still reads it", J(w.retrDayKinds("kida", "tue")) === J(["match", "drill"]));
  w.drDaysOpen("kida", "drill"); w.drDaysTap("wed");
  ok("a Curriculum tap after that carries week3 through untouched", J(w.writes[1].v.week3) === J({ mon: "match", tue: "drill" }) && w.__admin() === null, w.writes[1] && w.writes[1].v);
}
{
  // ＋ Add subject ▸ Card practice
  const deck = n => Array.from({ length: n }, (_, i) => ({ id: "m" + i, subject: "Math", status: "active", prompt: "p" + i }));
  const plan = { kida: { week: wk("sprint", "sprint", "off", "off", "off"), week2: { mon: "match", tue: "match" }, week3: { tue: "recheck" } } };
  const w = uiWorld({ plan, items: { kida: deck(6) } });
  const room = clone(w.daRoom(w.retrWeek("kida"), w.retrWeek2("kida"), "drill", w.retrWeek3("kida")));
  ok("daRoom: Mon (two kinds) has room now; Tue (three) is full and names all three", room.mon === true && J(room.tue) === J(["sprint", "match", "recheck"]) && room.wed === true, room);
  const p = clone(w.daPlan(w.retrWeek("kida"), w.retrWeek2("kida"), "drill", D3, w.retrWeek3("kida")));
  ok("daPlan: Drill placed Mon (third slot), Wed–Fri (first); Tue refused", J(p.on) === J(["mon", "wed", "thu", "fri"]) && J(p.full) === J(["tue"]) && J(p.week3) === J({ mon: "drill", tue: "recheck" }) && p.week.wed === "drill", p);
  w.__setAddKid("kida"); vm.runInContext("daOn=true;daKind='drill';daDays=null;", w);
  const h = w.daSheetHTML("kida", "#0ea5e9");
  ok("the form: Tue drawn full, its line names all three", /class="ce-chip da-day da-full"[^>]*>Tue · full</.test(h) && /Tuesday is full: \u{1F3C3} Sprint, \u{1F3AF} Match &amp; Play and \u{1F4C5} Sprint Re-checks\./u.test(h), h.slice(h.indexOf("da-fulls"), h.indexOf("da-fulls") + 300));
  ok("Save → one update with week, week2, week3", w.daSave() === true && w.writes.length === 1 && J(w.writes[0].v) === J({ week: p.week, week2: p.week2, week3: p.week3 }), w.writes[0] && w.writes[0].v);
  const w2 = uiWorld({ plan: { kida: { week: wk("sprint", "off", "off", "off", "off") } }, items: { kida: deck(6) } });
  w2.__setAddKid("kida"); vm.runInContext("daOn=true;daKind='drill';daDays=null;", w2);
  ok("a plan with no third row and room in rows 1–2 → Save writes {week, week2} exactly as before", w2.daSave() === true && J(Object.keys(w2.writes[0].v).sort()) === J(["week", "week2"]), w2.writes[0] && w2.writes[0].v);
}
{
  const plan = { kida: { week: wk("sprint", "off", "off", "off", "off"), week2: { mon: "drill" } } };
  const k = uiWorld({ plan, mom: false });
  ok("not Mom: the sheet does not open, drDaysWrite refuses", k.drDaysOpen("kida", "match") === false && k.drDaysWrite("kida", wk("off", "off", "off", "off", "off"), {}, { mon: "match" }) === false && k.writes.length === 0);
  const d = uiWorld({ plan, dry: true });
  d.drDaysOpen("kida", "match"); d.drDaysTap("mon");
  ok("?dryrun=1: no database write; the screen follows (mirror has week3)", d.writes.length === 0 && d.sets.length === 0 && J(d.masteryData.retrievalPlan.kida.week3) === J({ mon: "match" }));
  ok("no kid or family names in the slice", !/lincoln|ellis|lucy|julian|howe/i.test(sliceIn(src, "// DRILLTHREE_START", "// DRILLTHREE_END") + THREE_EDITS.map(p => p[0]).join("\n")));
  ok("no 🔀 in the slice", (sliceIn(src, "// DRILLTHREE_START", "// DRILLTHREE_END") + THREE_EDITS.map(p => p[0]).join("")).indexOf("\u{1F500}") < 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
