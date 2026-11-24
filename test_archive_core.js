/*
 * test_archive_core.js — PLAN_archive_window_2026-11-21.md, slice 1 (her "Start slice 1", 2026-11-22): the FIELD AUDIT and the
 * PARITY TEST for Path 1's trimmed copy of the past weeks ("archiveCore"). No app change: this file only reads index.html.
 *
 * What it proves, before any trimmed copy exists anywhere:
 *   1. Who reads `archive`: every function in the app that touches the past weeks is on the list below, in its group
 *      (A builds/writes, B history pages, C last week only, D every week on the main screens). A NEW reader fails this test
 *      until someone decides its group — so slice 4 can never switch the start-up copy under a reader nobody checked.
 *   2. The field audit: the app runs (the whole script, test_fixtures/demo_week_sandbox.js) on a made-up family with made-up past
 *      weeks, and every group C and D function runs with the past weeks wrapped in a recorder. Every field they read must be in
 *      ARCH_CORE below. (The live run — ARCH_CORE_SNAPSHOT, below — found lid, checkedOnDay, archivedAt and deferred, which the
 *      plan's first estimate missed, and showed noCarry, completion and history.day are never read by them.)
 *   3. Parity: the same calls on two copies of the app, one given the full past weeks and one given the trimmed copy (stored the
 *      way Firebase stores it: no empty objects, no nulls), give IDENTICAL answers — every kid, every subject, every day.
 *   4. Size: what the trimmed copy saves.
 *
 * Group B pages (History, Attendance, reports, the Pace page streak, the week viewer on Mom's plan) and group A (the week build,
 * the attendance writes, the editor walk-back) are NOT fed the trimmed copy in Path 1: slice 2 makes them wait for the full one.
 *
 * Live data, read only, never committed (this repo is public):
 *   ARCH_CORE_SNAPSHOT=/path/to/folder node test_archive_core.js
 * The folder holds <node>.json files saved by a read-only GET (archive, curriculum, config, pace, plans, settings, weekConfig,
 * calendar, ha_active_wk, the active week, …). The app boots over them in memory; nothing is written anywhere. Prints counts only.
 *   run: node test_archive_core.js
 */
"use strict";
process.env.TZ = "America/New_York";
const fs = require("fs"), path = require("path"), vm = require("vm");
const SB = require(path.join(__dirname, "test_fixtures", "demo_week_sandbox.js"));
const FX = JSON.parse(fs.readFileSync(path.join(__dirname, "test_fixtures", "living_demo_family.json"), "utf8"));
const INDEX = path.join(__dirname, "index.html");
const SRC = fs.readFileSync(INDEX, "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + (typeof x === "string" ? x : JSON.stringify(x)).slice(0, 900) + ")" : "")); } };

// ── THE CORE FIELD LIST (slice 3 moves this into the app; this test then pins the app's copy to it) ─────────────────────────
const ARCH_CORE = {
  week: ["weekLabel", "archivedAt", "checked", "dates", "deferred", "tasks", "history"],
  task: ["id", "who", "title", "day", "subjectKey", "lid", "famBlock", "famItem"],
  hist: ["who", "title", "ts", "missed", "flag", "checkedOnDay", "famLabel", "famMadeUp"]
};
const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
const pick = (o, ks) => { const r = {}; ks.forEach(k => { if (o[k] !== undefined) r[k] = clone(o[k]); }); return r; };
function archCoreOf(aw) {
  if (!aw || typeof aw !== "object") return aw;
  const out = {};
  ARCH_CORE.week.forEach(k => {
    if (aw[k] === undefined) return;
    if (k === "tasks") {
      const t1 = t => (t && typeof t === "object") ? pick(t, ARCH_CORE.task) : t;
      out.tasks = Array.isArray(aw.tasks) ? aw.tasks.map(t1) : Object.fromEntries(Object.entries(aw.tasks || {}).map(([i, t]) => [i, t1(t)]));
    } else if (k === "history") {
      // every history KEY is kept (tsCardsDay asks whether "<id>_missed" exists); an entry left with no core field becomes `true`
      // so Firebase can't drop the key (it drops empty objects) — `true.ts`, `true.who` read as undefined, exactly like `{}`.
      out.history = {};
      Object.entries(aw.history || {}).forEach(([hk, h]) => {
        if (!h || typeof h !== "object") { out.history[hk] = clone(h); return; }
        const p = pick(h, ARCH_CORE.hist); out.history[hk] = Object.keys(p).length ? p : true;
      });
    } else out[k] = clone(aw[k]);
  });
  return out;
}
const archCore = A => Object.fromEntries(Object.entries(A || {}).map(([wk, aw]) => [wk, archCoreOf(aw)]));
// What Firebase hands back: no nulls, no empty objects (arrays with holes keep their holes as null, like the SDK).
function fbNorm(v) {
  if (v === null || typeof v !== "object") return v;
  if (Array.isArray(v)) { const a = v.map(fbNorm); while (a.length && (a[a.length - 1] === null || a[a.length - 1] === undefined)) a.pop(); return a.length ? a.map(x => x === undefined ? null : x) : undefined; }
  const o = {}; Object.keys(v).forEach(k => { const x = fbNorm(v[k]); if (x !== undefined && x !== null) o[k] = x; });
  return Object.keys(o).length ? o : undefined;
}

// ── 1. WHO READS `archive` (static) ───────────────────────────────────────────────────────────────────────────────────────
const GROUPS = {
  A: ["archBootListen", "archLoadFull", "boot", "getCarryOverPool", "addManualAttWeek", "setAttDate", "loadJson", "ceWalkGather", "ceWalkApply", "lidImportPlan", "gwCommit", "digestFreezeIfNeeded",
      "archCoreBackfill"],   // ARCHCORE slice 3 (11/22): "Make the copy" writes archiveCore from every full week
  // ARCHBOOT slice 4 (11/23): the listener moved out of initFb — archBootListen fills `archive` from the copy, archLoadFull from the full record

  B: ["digestArchiveView", "digestGatherData", "renderHistoryReport", "renderHistoryTrends", "renderHistory", "buildKidAttendance", "printWeekReport", "mpSchWkLoad",
      "archCoreStatus"],   // ARCHCORE slice 3 (11/22): Settings ▸ 📚 Past weeks compares every full week with its copy

  C: ["scpPrevWeek", "scpGather", "haPrevWeekSummary", "_sucPrevArchive", "dmWeeks",
      "archCoreHasLastWeek"],   // ARCHBOOT slice 4 (11/23): does the copy have last week? (a key check, never waits)
  // paceStreak moved B → D in slice 2 (11/22): the Kids' Corner trophy shelf shows it (paceWins), a main screen that never waits
  D: ["tsWeekDays", "tsCardsDay", "completedLessonKeys", "famRecordAt", "famMadeUpSet", "famRecSig", "paceDoneTitles", "paceAutoCount", "ktPaceSig", "paceStreak"]
};
// Blank out comments, strings, template text and regex literals (same length, same newlines) so only real code is searched.
function codeOnly(raw) {
  const out = []; let i = 0, last = ""; const n = raw.length, blank = s => s.replace(/[^\n]/g, " "), tmpl = [];
  while (i < n) {
    const c = raw[i], d = raw[i + 1];
    if (c === "/" && d === "/") { let j = raw.indexOf("\n", i); if (j < 0) j = n; out.push(blank(raw.slice(i, j))); i = j; continue; }
    if (c === "/" && d === "*") { let j = raw.indexOf("*/", i + 2); j = j < 0 ? n : j + 2; out.push(blank(raw.slice(i, j))); i = j; continue; }
    if (c === '"' || c === "'") { let j = i + 1; while (j < n && raw[j] !== c) { if (raw[j] === "\\") j++; if (raw[j] === "\n") break; j++; } out.push(c + blank(raw.slice(i + 1, j)) + c); i = j + 1; last = "a"; continue; }
    if (c === "`" || (c === "}" && tmpl.length && tmpl[tmpl.length - 1] === 0)) {
      if (c === "}") tmpl.pop();
      let j = i + 1, r = c; while (j < n && raw[j] !== "`") { if (raw[j] === "\\") { r += "  "; j += 2; continue; } if (raw[j] === "$" && raw[j + 1] === "{") break; r += raw[j] === "\n" ? "\n" : " "; j++; }
      if (j < n && raw[j] === "$") { out.push(r + "${"); tmpl.push(0); i = j + 2; last = "("; continue; }
      out.push(r + "`"); i = j + 1; last = "a"; continue;
    }
    if (c === "{" && tmpl.length) tmpl[tmpl.length - 1]++;
    if (c === "}" && tmpl.length) tmpl[tmpl.length - 1]--;
    if (c === "/" && (!last || /[(,=:\[!&|?{};+\-*%<>~^]/.test(last) || /\b(return|typeof|case|in|of)$/.test(out.slice(-3).join("")))) {
      let j = i + 1, cls = false; while (j < n) { const ch = raw[j]; if (ch === "\\") { j += 2; continue; } if (ch === "[") cls = true; else if (ch === "]") cls = false; else if (ch === "/" && !cls) break; else if (ch === "\n") break; j++; }
      j++; while (j < n && /[a-z]/.test(raw[j])) j++; out.push("/" + blank(raw.slice(i + 1, j - 1)) + "/"); i = j; last = "a"; continue;
    }
    out.push(c); if (!/\s/.test(c)) last = /[\w$)\]]/.test(c) ? "a" : c; i++;
  }
  return out.join("");
}
console.log("\n── 1. every function that reads the past weeks is on the list, in its group ──");
{
  const L = SRC.split("\n"), a = L.lastIndexOf("<script>"), b = L.lastIndexOf("</script>");
  const code = codeOnly(L.slice(a + 1, b).join("\n"));
  ok("the code scan kept the script's length (sanity)", code.length === L.slice(a + 1, b).join("\n").length);
  const found = new Set(), re = /function\s+([A-Za-z_$][\w$]*)\s*\(/g; let m;
  while ((m = re.exec(code))) {
    let dep = 0, e = -1; for (let j = code.indexOf("{", m.index); j < code.length; j++) { const ch = code[j]; if (ch === "{") dep++; else if (ch === "}") { dep--; if (!dep) { e = j; break; } } }
    if (/(^|[^\w$.])archive(?![\w$])/.test(code.slice(m.index, e + 1))) found.add(m[1]);
  }
  const listed = new Set([].concat(...Object.values(GROUPS)));
  const added = [...found].filter(f => !listed.has(f)), gone = [...listed].filter(f => !found.has(f));
  ok("no NEW reader of the past weeks (a new one needs a group: A/B wait for the full copy, C/D must pass the audit below)", !added.length, added);
  ok("every listed reader still reads them (a gone one: take it off the list)", !gone.length, gone);
  ok("…" + found.size + " readers: A " + GROUPS.A.length + " · B " + GROUPS.B.length + " · C " + GROUPS.C.length + " · D " + GROUPS.D.length, found.size === listed.size);
  // no reader under another name: the global is never copied to another global or handed to a function, except scpPrevWeek's own parameter
  const alias = (code.match(/[\w$]+\s*=\s*archive(?![\w$\[.])/g) || []).filter(s => !/^(A|a)\s*=/.test(s));
  ok("the past weeks aren't copied to another name a scan would miss", !alias.length, alias);
  const handed = (code.match(/[\w$]+\((?:[^()]*,)?\s*\(?\s*(?:typeof archive[^)]*\)\s*\?\s*)?archive\s*[,)]/g) || []).filter(s => !/^(scpPrevWeek|function|keys|values|entries|if)\(/.test(s));
  ok("…and aren't handed to a function off the list (only scpPrevWeek takes them as a parameter)", !handed.length, handed);
}

// ── the made-up past weeks ───────────────────────────────────────────────────────────────────────────────────────────────
// Five closed weeks cloned from the week the app really builds for the demo family (so every card has every field the builder
// writes), with every case the readers branch on: checked / unchecked, a history-only finish, a missed and a flagged record,
// "<id>_missed" keys, a stolen check (the record names another kid's lesson), a finish only on the cascade copy (<id>_c), a
// late finish (checkedOnDay), lesson ids and a deferred list, Family Time cards with a made-up label, and the fields the trimmed
// copy leaves behind (detail, time, completion, slot_points, …). (Cards are always a list: gwCommit writes arrays, and Firebase
// hands back 0..n keys as a list — paceAutoCount relies on it today, full copy or trimmed.)
const FAM = [{ block: "fam_read", item: "aloud", label: "Read-aloud", madeUp: "2026-10-20" }, { block: "fam_art", item: "draw", label: "Draw together", madeUp: "" }];
function makePast(liveTasks) {
  const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];
  const MONTH = ["October 5", "October 6", "October 7", "October 8", "October 9"];
  const datesOf = w => { const out = {}; DAYS.forEach((d, i) => { const dt = new Date(2026, 9, 5 + 7 * (w - 1) + i); out[d] = dt.toLocaleString("en-US", { month: "long" }) + " " + dt.getDate(); }); return out; };
  void MONTH;
  const A = {};
  for (let w = 1; w <= 5; w++) {
    const wk = "week" + w, tasks = [], checked = {}, history = {}, ts = d => "2026-10-0" + ((w + d) % 9 + 1) + "T10:00:00";
    liveTasks.forEach((t0, i) => {
      const t = clone(t0); t.id = "w" + w + "_" + i; tasks.push(t);
      const r = (i * 7 + w * 3) % 10, hr = { id: t.id, who: t.who, title: t.title, day: t.day, ts: ts(i), originalDay: t.day, week: wk, daysLate: 0, momRequired: false, by: "devX" };
      if (r < 5) { checked[t.id] = "10:00 AM Oct " + (5 + w); history[t.id] = hr; }                                   // finished on the day
      else if (r === 5) { checked[t.id] = "4:00 PM Oct " + (6 + w); history[t.id] = Object.assign(hr, { checkedOnDay: DAYS[(DAYS.indexOf(t.day) + 1) % 5], daysLate: 1 }); }   // late
      else if (r === 6) { history[t.id] = hr; }                                                                         // a finish only in history
      else if (r === 7) { history[t.id + "_missed"] = Object.assign({}, hr, { missed: true }); }                        // missed
      else if (r === 8) { checked[t.id] = "x"; history[t.id] = Object.assign(hr, { flag: "redo" }); }                   // flagged
      else if (r === 9) { history[t.id] = Object.assign(hr, { missed: true }); }                                        // a missed record on the card's own key
      if (i % 11 === 3) { const c = clone(t); c.id = t.id + "_c"; c.cascadedFrom = t.id; tasks.push(c); checked[c.id] = "1:00 PM"; delete checked[t.id]; history[c.id] = Object.assign({}, hr, { id: c.id }); }  // cascade copy finished
      if (i % 13 === 5) { checked[t.id] = "9:00 AM"; const other = liveTasks[(i + 1) % liveTasks.length]; history[t.id] = Object.assign({}, hr, { who: other.who, title: other.title }); }  // stolen check
    });
    FAM.forEach((f, j) => DAYS.slice(0, 3 + j).forEach((d, k) => {                                                     // Family Time cards
      const id = "w" + w + "_fam" + j + k; tasks.push({ id, who: "kid_a", day: d, time: "1:00 PM", dur: 20, title: "👪 " + f.label, detail: "Family Time", famBlock: f.block, famItem: f.item, mom: "required", cascade: false });
      if ((k + w) % 2 === 0) { checked[id] = "1:20 PM"; history[id] = { id, who: "kid_a", title: "👪 " + f.label, day: d, ts: ts(k), famLabel: f.label + " (wk " + w + ")", famMadeUp: f.madeUp && k === 1 ? f.madeUp : "" }; }
    }));
    A[wk] = { weekLabel: wk, archivedAt: Date.UTC(2026, 9, 9 + 7 * w), dates: datesOf(w), tasks, checked, history,
      completion: { byKid: { kid_a: { done: 3, planned: 5 } } }, slot_points: { kid_a: { morning: 5 } }, meta: { note: "left behind" } };
    if (w === 5) {   // last week's deferred list: a lesson the kid finished on the card but Mom pushed to this week (sucBehind owes it)
      const lt = liveTasks.filter(t => t.lid && t.who === "kid_a"), dt = lt.find((t, i) => checked["w5_" + liveTasks.indexOf(t)]) || lt[0];
      if (dt) A[wk].deferred = { kid_a: { [dt.subjectKey]: [dt.lid] } };
    }
  }
  return A;
}

// ── the calls: every group C and D function, every kid, every subject, every day ──────────────────────────────────────────
// Returns one JSON string: {res:{name:answer}, err:[...]}. __lbl names the call group for the field recorder.
const CALLS = fam => `(function(){
  const res={}, err=[], kids=[...ROSTER];
  const T=(n,f)=>{ window.__lbl=n.split("|")[0]; try{ const v=f(); res[n]=v===undefined?"(undefined)":JSON.parse(JSON.stringify(v)); }catch(e){ err.push(n+": "+e.message); } };
  kids.forEach(k=>{
    const subs=Object.keys(((currData.subjects||{})[k])||{});
    subs.forEach(sk=>{ const ps=((paceData.subjects||{})[k]||{})[sk]; const kws=paceKeywords(k,sk,ps);
      T("paceAutoCount|"+k+"|"+sk,()=>paceAutoCount(k,kws,null,sk));
      T("paceAutoCount.excl|"+k+"|"+sk,()=>paceAutoCount(k,kws,"week3",sk));
      T("paceDoneTitles|"+k+"|"+sk,()=>paceDoneTitles(k,kws,null,sk).sort());
      T("computeSubjectCursor|"+k+"|"+sk,()=>computeSubjectCursor(k,sk));
      T("computeSubjectDone|"+k+"|"+sk,()=>computeSubjectDone(k,sk));
      T("getNextLessons|"+k+"|"+sk,()=>getNextLessons(k,sk,3));
      T("cbBacklogInfo|"+k+"|"+sk,()=>{ const b=cbBacklogInfo(k,sk); return b&&{doneN:b.doneN,stale:b.split.stale.map(c=>c.text),future:b.split.future.length,dupFuture:b.dupFuture}; });
    });
    T("paceKidStatus|"+k,()=>paceKidStatus(k));
    T("haPrevWeekSummary|"+k,()=>haPrevWeekSummary(k));
    T("haNbContext|"+k,()=>haNbContext(k));
    T("scpGather|"+k,()=>{ const g=scpGather(k); return g; });
    T("paceStreak|"+k,()=>paceStreak(k));
  });
  T("paceStreak|all",()=>paceStreak("all"));
  T("completedLessonKeys",()=>[...completedLessonKeys()].sort());
  const today=cbTodayISO(); let wd={}; T("tsWeekDays",()=>(wd=tsWeekDays(today)));
  kids.forEach(k=>Object.keys(wd).forEach(iso=>T("tsCardsDay|"+k+"|"+iso,()=>tsCardsDay(k,iso,wd))));
  T("scpPrevWeek",()=>{ const p=scpPrevWeek(archive,currWeekNum()); return p&&{num:p.num,tasks:Object.values(p.tasks||{}).map(t=>t&&t.id),checked:p.checked}; });
  T("_sucPrevArchive",()=>{ const p=_sucPrevArchive(); return p&&{wk:p.weekLabel,at:p.archivedAt||1}; });
  T("sucBehind",()=>sucBehind(_sucPrevArchive(),weekData.tasks||[],function(){return true;},function(){return true;}));
  T("dmWeeks",()=>dmWeeks().map(w=>({d:w.dates,n:Object.keys(w.tasks||{}).length})));
  T("dmCompute",()=>dmCompute(dmWeeks(),{todayISO:today,kids:kids,isDaily:dmIsDaily,labelOf:dmLabel,kidOff:function(){return false;}}));
  T("famRecSig",()=>famRecSig("fam_read","aloud"));
  ${JSON.stringify(fam)}.forEach(f=>{
    T("famMadeUpSet|"+f.block+"|"+f.item,()=>famMadeUpSet(f.block,f.item));
    f.days.forEach(ds=>T("famRecordAt|"+f.block+"|"+f.item+"|"+ds,()=>famRecordAt(f.block,f.item,ds)));
  });
  window.__lbl="";
  return JSON.stringify({res,err});
})()`;

// ── a recorder for which fields are read ──────────────────────────────────────────────────────────────────────────────────
function recorder(ctx) {
  const byGroup = {}, cache = new WeakMap();
  const rec = p => { const g = ctx.__lbl || "(boot)"; (byGroup[g] = byGroup[g] || new Set()).add(p); };
  const child = (p, t, k) => {
    if (p === "A") return "W";
    if (Array.isArray(t)) return /^\d+$/.test(k) ? p + "[]" : p + ".<" + k + ">";
    if (/^W\.(checked|dates|history|deferred|tasks|completion|slot_points|meta)$/.test(p)) return p + (p === "W.tasks" ? "[]" : "{}");
    if (/^W\.(checked|dates|deferred|completion|slot_points|meta)\{\}/.test(p)) return p.replace(/(\{\}).*$/, "$1…");
    return p + "." + k;
  };
  const wrap = (o, p) => {
    if (o === null || typeof o !== "object") return o;
    let m = cache.get(o); if (m && m.has(p)) return m.get(p);
    const px = new Proxy(o, {
      get(t, k, r) { const v = Reflect.get(t, k, r); if (typeof k === "symbol") return v; if (Array.isArray(t) && !/^\d+$/.test(k)) return v; const np = child(p, t, k); rec(np); return wrap(v, np); },
      ownKeys(t) { return Reflect.ownKeys(t); }, has(t, k) { return Reflect.has(t, k); }
    });
    if (!m) { m = new Map(); cache.set(o, m); } m.set(p, px); return px;
  };
  return { wrap, byGroup };
}
// a read path → the core field it needs (null = structure only)
function fieldOf(p) {
  let m;
  if ((m = /^W\.([A-Za-z_$][\w$]*)$/.exec(p))) return { kind: "week", f: m[1] };
  if ((m = /^W\.tasks\[\]\.([\w$]+)/.exec(p))) return { kind: "task", f: m[1] };
  if ((m = /^W\.history\{\}\.([\w$]+)/.exec(p))) return { kind: "hist", f: m[1] };
  return null;
}

// ── a world: the whole app over one database ──────────────────────────────────────────────────────────────────────────────
async function world(tree, family, at) {
  const clock = SB.makeClock(at); clock.boot = clock.now; const sched = SB.makeScheduler(clock);
  const db = SB.makeDb(tree, clock, sched);
  const d = SB.bootDevice({ name: "A", dev: "devCore", db, clock, sched, family, indexPath: INDEX });
  d.momOn(); await sched.run(clock.now + 30000);
  return d;
}

async function run(label, baseTree, family, at, prep, famCalls) {
  // full copy, with the recorder
  const full = clone(baseTree.archive || {});
  const Wf = await world(clone(baseTree), family, at); if (prep) prep(Wf);
  const R = recorder(Wf.ctx);
  Wf.set("archive", R.wrap(fbNorm(clone(full)) || {}, "A"));
  const outF = JSON.parse(Wf.run(CALLS(famCalls(Wf))));
  // trimmed copy, as Firebase would store it, in its own app (no shared caches)
  const core = fbNorm(archCore(full)) || {};
  const Wc = await world(Object.assign(clone(baseTree), { archive: core }), family, at); if (prep) prep(Wc);
  Wc.set("archive", core);
  const outC = JSON.parse(Wc.run(CALLS(famCalls(Wc))));
  return { full, core, outF, outC, byGroup: R.byGroup, Wf, Wc };
}

function report(label, r, opts) {
  opts = opts || {};
  const names = Object.keys(r.outF.res);
  ok(label + ": the calls ran without an error on the full copy", !r.outF.err.length, r.outF.err.slice(0, 12));
  ok(label + ": …and on the trimmed copy", !r.outC.err.length, r.outC.err.slice(0, 5));
  ok(label + ": the app saw the past weeks (" + Object.keys(r.full).length + " weeks)", Object.keys(r.full).length >= (opts.minWeeks || 1) && r.Wf.get("fbArchiveLoaded") === true && r.Wc.get("fbArchiveLoaded") === true);
  // 2. the field audit
  const need = { week: new Set(), task: new Set(), hist: new Set() }, where = {};
  Object.entries(r.byGroup).forEach(([g, ps]) => ps.forEach(p => { const f = fieldOf(p); if (!f) return; need[f.kind].add(f.f); (where[f.kind + "." + f.f] = where[f.kind + "." + f.f] || new Set()).add(g); }));
  const missing = [];
  ["week", "task", "hist"].forEach(kind => need[kind].forEach(f => { if (ARCH_CORE[kind].indexOf(f) < 0) missing.push(kind + "." + f + " (read by " + [...where[kind + "." + f]].join(", ") + ")"); }));
  ok(label + ": FIELD AUDIT — every field the main-screen functions read is in the trimmed copy", !missing.length, missing);
  console.log("        read: weeks " + [...need.week].sort().join(" ") + " | cards " + [...need.task].sort().join(" ") + " | history " + [...need.hist].sort().join(" "));
  if (opts.expectRead) Object.entries(opts.expectRead).forEach(([k, fs]) => fs.forEach(f => ok(label + ": the audit really reached " + k + "." + f + " (coverage)", need[k].has(f), [...need[k]])));
  // 3. parity
  const diff = names.filter(n => JSON.stringify(r.outF.res[n]) !== JSON.stringify(r.outC.res[n]));
  const groups = {}; names.forEach(n => { const g = n.split("|")[0]; groups[g] = (groups[g] || 0) + 1; });
  ok(label + ": PARITY — all " + names.length + " answers are identical on the full and the trimmed copy", !diff.length && names.length === Object.keys(r.outC.res).length,
    diff.slice(0, 3).map(n => ({ n: opts.hideNames ? n.split("|")[0] : n, full: JSON.stringify(r.outF.res[n]).slice(0, 200), core: JSON.stringify(r.outC.res[n]).slice(0, 200) })));
  console.log("        answers: " + Object.entries(groups).map(([g, n]) => g + " " + n).join(" · "));
  // the answers are not all empty (the test would pass on nothing)
  const nonEmpty = g => names.filter(n => n.split("|")[0] === g).some(n => { const v = r.outF.res[n]; return v && v !== "(undefined)" && JSON.stringify(v) !== "{}" && JSON.stringify(v) !== "[]" && v !== 0; });
  (opts.mustHave || []).forEach(g => ok(label + ": " + g + " gave real answers (not all empty)", nonEmpty(g)));
  // 4. size
  const fb = Buffer.byteLength(JSON.stringify(r.full)), cb = Buffer.byteLength(JSON.stringify(r.core));
  console.log("        size: full " + (fb / 1024).toFixed(0) + " KB → trimmed " + (cb / 1024).toFixed(0) + " KB (" + Math.round(100 - cb / fb * 100) + "% smaller)");
  ok(label + ": the trimmed copy is smaller", cb < fb, [fb, cb]);
  return { need, fb, cb };
}

async function demoSetup() {
  const at = new Date(2026, 10, 8, 0, 0, 30).getTime();
  // the week the app builds for the demo family → the cards the past weeks are cloned from
  const W0 = await world(clone(FX.db), FX.family, at);
  const live = W0.tasks().filter(t => t && t.id && !String(t.id).endsWith("_c"));
  const past = makePast(live), tree = Object.assign(clone(FX.db), { archive: past });
  const prep = d => d.set("WK", "week6");   // the live week sits after the five closed ones
  const famCalls = d => FAM.map(f => ({ block: f.block, item: f.item, days: Object.values(past).map(aw => Object.values(aw.dates)).flat().map(lbl => { try { return d.run("famArchDayISO(" + JSON.stringify(lbl) + "," + JSON.stringify("2026-10-15") + ")"); } catch (e) { return null; } }).filter(Boolean) }));
  return { at, live, tree, prep, famCalls };
}

(async () => {
  console.log("\n── 2–4. made-up family: field audit, parity, size ──");
  {
    const { at, live, tree, prep, famCalls } = await demoSetup();
    ok("the demo family's week built (" + live.length + " cards, the shape every past card is cloned from)", live.length > 40);
    const r = await run("demo", tree, FX.family, at, prep, famCalls);
    const got = report("demo", r, {
      minWeeks: 5,
      mustHave: ["paceAutoCount", "paceDoneTitles", "completedLessonKeys", "tsWeekDays", "tsCardsDay", "haPrevWeekSummary", "scpPrevWeek", "dmCompute", "famRecordAt", "famMadeUpSet", "sucBehind"],
      expectRead: { task: ["id", "who", "title", "day", "subjectKey", "lid", "famBlock", "famItem"], hist: ["who", "title", "ts", "missed", "flag", "checkedOnDay", "famLabel", "famMadeUp"], week: ["weekLabel", "archivedAt", "checked", "dates", "deferred", "tasks", "history"] }
    });
    // the core list carries nothing the audit didn't find a reader for (keeps it lean); week-level is checked the same way
    const extra = [].concat(...["week", "task", "hist"].map(k => ARCH_CORE[k].filter(f => !got.need[k].has(f)).map(f => k + "." + f)));
    ok("demo: the trimmed copy keeps nothing no main-screen function reads", !extra.length, extra);
    // the fields left behind really are left behind
    const c1 = r.core.week1, t1 = Object.values(c1.tasks)[0];
    ok("demo: cards lose detail, time, dur, mom, device, cascade (the bulk)", ["detail", "time", "dur", "mom", "device", "cascade"].every(k => t1[k] === undefined) && t1.id && t1.title);
    ok("demo: weeks lose completion, slot_points, meta", ["completion", "slot_points", "meta"].every(k => c1[k] === undefined));
    ok("demo: every history key survives Firebase's storage, the \"_missed\" keys too", Object.keys(r.full).every(wk => Object.keys(r.full[wk].history || {}).every(hk => r.core[wk].history && r.core[wk].history[hk] !== undefined)));
    ok("demo: cards stay a list, in the same order", Object.keys(r.full).every(wk => Array.isArray(r.core[wk].tasks) && r.core[wk].tasks.map(t => t && t.id).join() === r.full[wk].tasks.map(t => t && t.id).join()));
    ok("demo: a history record with no core field keeps its key as `true`", archCoreOf({ history: { x: { spent: 1 } } }).history.x === true);
  }

  // ── a mutation check: the parity test can SEE a field the trimmed copy drops ──
  console.log("\n── the test can fail: drop one field the main screens need ──");
  {
    const { at, tree, prep, famCalls } = await demoSetup();
    const every = [].concat(...["week", "task", "hist"].map(k => ARCH_CORE[k].map(f => [k, f])));
    for (const [kind, f] of every) {
      const saved = ARCH_CORE[kind].slice(); ARCH_CORE[kind] = saved.filter(x => x !== f);
      const r = await run("mut", tree, FX.family, at, prep, famCalls);
      ARCH_CORE[kind] = saved;
      const diff = Object.keys(r.outF.res).filter(n => JSON.stringify(r.outF.res[n]) !== JSON.stringify(r.outC.res[n]));
      ok("without " + kind + "." + f + " the answers differ (" + diff.length + " of them, e.g. " + (diff[0] || "none").split("|")[0] + ")", diff.length > 0);
    }
  }

  // ── live data (local only) ──
  const SNAP = process.env.ARCH_CORE_SNAPSHOT;
  if (SNAP) {
    console.log("\n── live snapshot (read-only copy in " + SNAP + "; names and titles never printed) ──");
    const tree = {}; fs.readdirSync(SNAP).filter(f => /\.json$/.test(f)).forEach(f => { tree[f.replace(/\.json$/, "")] = JSON.parse(fs.readFileSync(path.join(SNAP, f), "utf8")); });
    const fw = {}; vm.runInNewContext(fs.readFileSync(path.join(__dirname, "family-config.js"), "utf8"), { window: fw });
    const at = process.env.ARCH_CORE_AT ? new Date(process.env.ARCH_CORE_AT).getTime() : Date.now();
    const famCalls = d => { const A = tree.archive || {}, m = {}; Object.values(A).forEach(aw => Object.values((aw && aw.tasks) || {}).forEach(t => { if (t && t.famBlock) { const k = t.famBlock + "|" + t.famItem; m[k] = m[k] || { block: t.famBlock, item: t.famItem, days: new Set() }; Object.values(aw.dates || {}).forEach(lbl => { try { const iso = d.run("famArchDayISO(" + JSON.stringify(lbl) + "," + JSON.stringify(new Date(at).toISOString().slice(0, 10)) + ")"); if (iso) m[k].days.add(iso); } catch (e) {} }); } })); return Object.values(m).map(x => ({ block: x.block, item: x.item, days: [...x.days] })); };
    const r = await run("live", tree, fw.HA_FAMILY, at, null, famCalls);
    report("live", r, { minWeeks: 10, hideNames: true, mustHave: ["paceAutoCount", "paceDoneTitles", "completedLessonKeys", "tsCardsDay", "haPrevWeekSummary", "dmCompute"] });
  } else console.log("\n(live snapshot not run — set ARCH_CORE_SNAPSHOT=<folder of read-only GETs> to run the same checks on real data)");

  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
