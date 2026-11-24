/*
 * LMCLEANUP — slice 3b of the Curriculum streamline (PLAN_curriculum_streamline_2026-11-10.md §4 row 3b, §4.3, Appendix C;
 * the audit AUDIT_lessonmap_dead_2026-11-21.md). Her words 2026-11-10: "lets remove and clean up but def audit to make sure
 * it causes no issues before you do it"; 2026-11-23 "Yes, build them"; her three calls 2026-11-23: old make-ups = "A Clear
 * button I tap" (LMCLEAR, test_lm_clear_makeups.js), the Moved … ↩ Undo banner = "Remove it", the old quick ⏸ = "Remove it".
 *
 * What it proves:
 *   (1) GONE — no removed name occurs anywhere in index.html or a lazy app .js file (code, comments, strings, handler text,
 *       static markup), with exactly one documented exception: the two header buttons inside cbRenderForm (kept, reserved by
 *       the audit, byte-identical) still name ceOpenBuild / cbCloseSubj — and cbRenderForm itself is called by nothing, so
 *       they are never drawn (the vm below also tripwires it).
 *   (2) KEPT — every KEEP name of the audit (§3.1) is still defined and still has a live caller; the reserved five (§3.2) are
 *       still defined; every KEEP / reserved body is byte-identical to origin/main except the two one-statement re-points
 *       (lmDropSlot drops lmEditSlot=null, lmAddSubj drops lmAddOpen=null). _normOrderArr still feeds the generator.
 *   (3) the plan's own 3b items: renderCurriculumView is one branch (the plan bar + the grid, no one-chip bar); the router has
 *       no "builder" and "curriculum" lands on the grid; the grid has no "Moved … ↩ Undo" banner; the HQ comment rows are gone.
 *   (4) VM — every inline script of index.html runs in one context on inert stubs (no network, no Firebase, ?dryrun=1), every
 *       removed function is undefined there, the reserved five are tripwires, and the live Curriculum page is driven in BOTH
 *       the Simple and the Everything view: the grid; currInnerTab left at an old value; every router target ("curriculum",
 *       "grid", and the retired "builder"); the 📅 Kid's year panel on each tab (with the 🧹 Clear row and its confirm open);
 *       the subject card (ceOpenEdit — what the grid's column titles open); the cell-menu actions ✕ off day, ↩ put back,
 *       ➕ make-up, ✕ make-up and ➡ move (armed, then a target picked). Nothing throws, no tripwire fires, currInnerTab is
 *       "grid" after every target, and no drawn onclick/onchange/oninput names a global that is not defined.
 *
 *   run:  node test_lmcleanup.js
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const cp = require("child_process");

const DIR = __dirname;

// ── the lists (the audit's §3, as 3b leaves them) ───────────────────────────────────────────────────────────────────
const GONE_FNS = [
  "setCurrViewKid", "setCurrViewWeek", "ceOpenBuild", "_ceMaybeBuilder", "ceBuildCard",
  "lmToggleDayOff", "lmOpenAdd", "lmLessonByDate", "lmDayRunOrder", "lmNudgeSubj", "lmResetOrder", "lmWeekMonday",
  "lmRenderOffWeek", "lmSchedCheckState", "lmRenderMovePicker", "lmSetView", "lmCalData", "_lmWeekMon", "lmCalDayChips",
  "_lmDayKind", "lmSelSubj", "lmEditSlotOpen", "lmEditSlotCancel", "lmEditAddedOpen", "lmSaveAddedText", "lmSaveSlotText",
  "lmOpenMove", "lmPickMoveWeek", "lmMoveSlot", "lmRenderSubjectView", "_lmSnapMove", "_lmRestoreOverride",
  "_lmLessonEntry", "_lmMovingVal", "lmMoveDay", "lmSubjJumpWk", "lmSubjStepWk", "lmRenderSubjectGrid", "lmComputeSuggestions",
  "gvMenuMove", "lmUndoMove",
  "renderCurrBuilder", "cbSetKid", "cbSummaryToggle", "cbRenderSummary", "cbCloseSubj", "cbOpenSubj", "cbJumpTo",
  "gvJumpBuilder", "cbFamilyRulesToggle",
  "renderFinishLine", "flExtendSubject",
  // the audit's closure
  "ceWorkflowTier", "ceSessionGoal", "ceQuickPause", "paceStatusLabel", "cbPacingLabel", "_gvAdjSchoolDate",
  // the old Extend Clear pair (the audit's MOVE): replaced by LMCLEAR's own row in 📅 Kid's year
  "flExtendMakeupCount", "flUndoExtend",
  // the one-chip "Grid" bar's handler
  "setCurrInnerTab",
];
const GONE_STATE = ["cbFamilyRulesOpen", "currViewWeek", "lmViewMode", "lmEditSlot", "lmAddOpen", "lmSubjKey", "lmSubjWk", "lmLastMove",
  "_ceFinishMap", "cbSummaryOpen", "_cvBar", "_cvTop", "_cvBare"];
const GONE = GONE_FNS.concat(GONE_STATE);
const KEEP = ["lmDropSlot", "lmRemoveSubj", "lmRestoreSubj", "lmAddSubj", "alignPlanPreview", "alignPlanApply", "lmWeekAnchor",
  "lmWeekNumOfDate", "_lmKidOff", "_normOrderArr", "lmMovePick", "lmMoveWeek", "currViewKid",
  "ceRenderSessions", "ceSessToggle", "ceSetTargetEnd", "ceToggleMomVerifyKid", "downloadCurrTemplate",
  "lrpBuilderHTML", "gvSelShiftUp", "gvAuditFixGap", "cbCopyTo"];
const KEEP_STATE = ["lmMovePick", "lmMoveWeek", "currViewKid"];
const RESERVED = ["cbRenderForm", "cbSetMode", "cbSetField", "cbStepTpw", "cbToggleDay"];
// the only removed names still written in the file: cbRenderForm's two header buttons (kept byte-identical; never drawn)
const ALLOWED = { ceOpenBuild: "cbRenderForm", cbCloseSubj: "cbRenderForm" };
const REPOINT = { lmDropSlot: " lmEditSlot=null;", lmAddSubj: "\n  lmAddOpen=null;" };

function braceSlice(S, name) { const sig = "function " + name + "("; const i = S.indexOf(sig); if (i < 0) return null; let d = 0, j = S.indexOf("{", i); for (let k = j; k < S.length; k++) { if (S[k] === "{") d++; else if (S[k] === "}") { d--; if (d === 0) return S.slice(i, k + 1); } } return null; }
const wordRe = n => new RegExp("(^|[^\\w$])" + n.replace(/\$/g, "\\$") + "(?![\\w$])", "g");

// ── the vm driver (exported so the before/after tag-balance check can run it on another index.html) ────────────────
function runVM(HTML) {
  const scripts = []; { const re = /<script(\s[^>]*)?>/g; let m; while ((m = re.exec(HTML))) { const e = HTML.indexOf("</script", re.lastIndex); if (!/\ssrc=/.test(m[1] || "")) scripts.push(HTML.slice(re.lastIndex, e)); re.lastIndex = e + 9; } }
  const noop = function () { return STUB; };
  const STUB = new Proxy(noop, {
    get(t, k) { if (k === Symbol.toPrimitive) return () => ""; if (k === "then") return undefined; if (k === "length") return 0; if (k === Symbol.iterator) return function* () {}; if (k === "toString" || k === "valueOf") return () => ""; return STUB; },
    set() { return true; }, apply() { return STUB; }, construct() { return STUB; }, has() { return true; },
  });
  const ELS = {};
  function el(id) { if (id && ELS[id]) return ELS[id]; const e = { id, innerHTML: "", style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, dataset: {}, appendChild() {}, removeChild() {}, setAttribute() {}, getAttribute() { return null; }, addEventListener() {}, removeEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0 }; }, focus() {}, scrollIntoView() {}, scrollTop: 0, scrollLeft: 0, children: [], childNodes: [], parentNode: null, value: "", outerHTML: "", textContent: "", offsetHeight: 0, offsetWidth: 0, clientHeight: 0, clientWidth: 0, scrollHeight: 0, insertAdjacentHTML() {}, remove() {}, closest() { return null; }, contains() { return false; }, click() {}, blur() {}, insertBefore() {}, replaceChildren() {}, append() {}, prepend() {} }; if (id) ELS[id] = e; return e; }
  const store = {};
  const ctx = {
    console: { log() {}, warn() {}, error() {}, info() {}, debug() {} }, Math, JSON, Date, Object, Array, String, Number, Boolean, RegExp, Error, TypeError, Map, Set, WeakMap, WeakSet, Symbol, Promise, Proxy, Reflect, Intl, parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent, encodeURI, escape, unescape, Uint8Array, ArrayBuffer, TextEncoder, TextDecoder, URL, URLSearchParams, structuredClone,
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}, requestAnimationFrame: () => 0, cancelAnimationFrame() {}, queueMicrotask() {},
    location: { search: "?dryrun=1", hash: "", href: "http://localhost/?dryrun=1", hostname: "localhost", pathname: "/", origin: "http://localhost", reload() {}, replace() {} },
    navigator: { userAgent: "node-test", onLine: false, serviceWorker: undefined, platform: "node", language: "en-US", maxTouchPoints: 0 },
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; }, key: () => null, length: 0, clear() {} },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: { getElementById: el, querySelector: () => null, querySelectorAll: () => [], createElement: () => el(null), createTextNode: () => el(null), addEventListener() {}, removeEventListener() {}, body: el("body"), head: el("head"), documentElement: el("html"), visibilityState: "visible", hidden: false, readyState: "complete", cookie: "", title: "" },
    firebase: undefined, fetch: () => new Promise(() => {}), XMLHttpRequest: function () { return STUB; }, Audio: function () { return STUB; }, Image: function () { return STUB; }, speechSynthesis: undefined, SpeechSynthesisUtterance: function () {},
    matchMedia: () => ({ matches: false, addListener() {}, addEventListener() {} }), getComputedStyle: () => ({ getPropertyValue: () => "" }), alert() {}, confirm: () => false, prompt: () => null, open() {},
    innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1, screen: { width: 1280, height: 800 }, history: { pushState() {}, replaceState() {}, back() {} },
    performance: { now: () => 0, mark() {}, measure() {} }, crypto: { getRandomValues: a => a, randomUUID: () => "00000000-0000-0000-0000-000000000000" },
    MutationObserver: function () { return { observe() {}, disconnect() {} }; }, ResizeObserver: function () { return { observe() {}, disconnect() {} }; }, IntersectionObserver: function () { return { observe() {}, disconnect() {} }; },
    Event: function () {}, CustomEvent: function () {}, BroadcastChannel: function () { return { postMessage() {}, close() {} }; }, Notification: undefined, indexedDB: undefined, caches: undefined,
  };
  ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx; ctx.addEventListener = () => {}; ctx.removeEventListener = () => {}; ctx.dispatchEvent = () => true; ctx.scrollTo = () => {};
  vm.createContext(ctx);
  scripts.forEach(s => { try { vm.runInContext(s, ctx); } catch (e) { /* a block may stop early on the stubs; its function declarations are hoisted */ } });
  const R = s => vm.runInContext(s, ctx);
  const typeOf = n => { try { return R("typeof " + n); } catch (e) { return "undefined"; } };
  const fired = []; ctx.__trip = n => fired.push(n);
  RESERVED.forEach(n => { if (typeOf(n) === "function") R(n + "=function(){ __trip(" + JSON.stringify(n) + "); return ''; };"); });

  const today = new Date(); const iso = d => d.toISOString().slice(0, 10);
  const mon = new Date(today); mon.setDate(today.getDate() - ((today.getDay() + 6) % 7) + 7);
  const days = [0, 1, 2, 3, 4].map(i => { const d = new Date(mon); d.setDate(mon.getDate() + i); return iso(d); });
  const out = { views: {}, errors: [], fired, tabs: [], days };
  const cv = "(function(){ var el=document.getElementById('cv'); el.innerHTML=''; renderCurriculumView(el,''); return el.innerHTML; })()";
  const card = "document.getElementById('ce-sheet-wrap').innerHTML";
  ["everything", "simple"].forEach(view => {
    const H = out.views[view] = { page: [], card: "", all: [] };
    const step = (label, js, keep) => {
      try { const o = R(js); if (typeof o === "string") { H.all.push(o); if (keep) keep(o); } }
      catch (e) { out.errors.push(view + " · " + label + ": " + (e && e.name) + ": " + String(e && e.message).slice(0, 160)); }
    };
    step("seed", `
      momModeActive=true; adminPinUnlocked=true;
      if(typeof ROSTER!=="undefined"&&ROSTER.length===0) ROSTER.push("kid");
      currData={subjects:{},lessons:{},done:{},weekDays:{},momVerifyKid:{},targetEnd:{}};
      ROSTER.forEach(function(k){ currData.subjects[k]={math:{display:"Math",tracking:"sequenced",minutes:30,mom:"none",device:"paper",allowedDays:["Mon","Tue","Wed","Thu","Fri"],timesPerWeek:5,cap:1,lessonSeq:["L 1","L 2","L 3"]}}; currData.lessons[k]={}; currData.done[k]={};
        ${JSON.stringify(days)}.forEach(function(d,i){ currData.lessons[k][90000+i]=(i===3?{date:d,week:1}:{date:d,week:1,math:"L "+(i+1)}); }); });
      scheduleOverrides={}; scheduleOverrides[${JSON.stringify(days[4])}]={}; scheduleOverrides[${JSON.stringify(days[4])}][ROSTER[0]]={added:{math:true}};
      currInnerTab='grid'; gvKid=ROSTER[0]; gvMenu=null; gvEdit=null; lmMovePick=null; csmView=${JSON.stringify(view)}; setAdminSub=function(){}; ''`);
    step("the grid", cv, o => H.page.push(o));
    ["subjects", "plans", "builder"].forEach(t => step("currInnerTab left at \"" + t + "\" → the grid", "currInnerTab=" + JSON.stringify(t) + ";" + cv, o => H.page.push(o)));
    ["curriculum", "grid", "builder"].forEach(t => {
      step("momHQGo(\"" + t + "\")", "currInnerTab='grid'; momHQGo(" + JSON.stringify(t) + "); " + cv, o => H.page.push(o));
      out.tabs.push(view + ":" + t + "=" + typeOf("currInnerTab") + ":" + (() => { try { return R("currInnerTab"); } catch (e) { return "?"; } })());
    });
    step("📅 Kid's year, all four tabs (+ the 🧹 Clear row, its confirm open)", "(function(){ var o=''; cbRulesOpen=true; ['hours','terms','lanes','all'].forEach(function(t){ kyTab=t; o+=" + cv + "; }); if(typeof lmcOpen==='function'){ lmcAsk=null; lmcOpen(ROSTER[0]); kyTab='hours'; o+=" + cv + "; lmcAsk=null; } cbRulesOpen=false; return o; })()", o => H.page.push(o));
    step("the subject card (ceOpenEdit)", "(function(){ ceOpenEdit(ROSTER[0],'math'); return " + card + "; })()", o => { H.card = o; });
    step("close the card", "(function(){ if(typeof ceCloseSheet==='function') ceCloseSheet(); return ''; })()");
    step("a future cell's action menu", "(function(){ gvMenu=null; gvOpenCell(90002,'math'); return " + cv + "; })()", o => H.page.push(o));
    step("✕ off day", "(function(){ gvMenuOff(ROSTER[0],90002,'math'); return " + cv + "; })()", o => H.page.push(o));
    step("the off cell's menu (↩ put back drawn)", "(function(){ gvMenu=null; gvOpenCell(90002,'math'); return " + cv + "; })()", o => H.page.push(o));
    step("↩ put back", "(function(){ gvMenuRestore(ROSTER[0],90002,'math'); return " + cv + "; })()", o => H.page.push(o));
    step("an empty cell's menu", "(function(){ gvMenu=null; gvOpenCell(90003,'math'); return " + cv + "; })()", o => H.page.push(o));
    step("➕ make-up", "(function(){ gvMenuAddMakeup(ROSTER[0],90003,'math'); return " + cv + "; })()", o => H.page.push(o));
    step("the make-up cell's menu (✕ make-up drawn)", "(function(){ gvMenu=null; gvOpenCell(90003,'math'); return " + cv + "; })()", o => H.page.push(o));
    step("✕ make-up", "(function(){ gvMenuOffAdded(ROSTER[0],90003,'math'); return " + cv + "; })()", o => H.page.push(o));
    step("➡ move armed", "(function(){ gvMenu=null; gvMenuStartMove(ROSTER[0],90001,'math'); return " + cv + "; })()", o => H.page.push(o));
    step("➡ move: a target picked", "(function(){ gvPickMoveTarget(90004); return " + cv + "; })()", o => H.page.push(o));
    step("➡ move cancelled", "(function(){ if(typeof gvCancelMove==='function') gvCancelMove(); lmMovePick=null; return " + cv + "; })()", o => H.page.push(o));
  });
  out.typeOf = typeOf;
  out.handlers = html => { const a = []; const re = /\son(click|change|input)="([^"]*)"/g; let m; while ((m = re.exec(html))) a.push(m[2].replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&")); return a; };
  return out;
}
function tagCounts(html) { const o = {}; ["div", "table", "tr", "td", "button", "details"].forEach(t => { o[t] = [(html.match(new RegExp("<" + t + "[\\s>]", "g")) || []).length, (html.match(new RegExp("</" + t + ">", "g")) || []).length]; }); return o; }
module.exports = { runVM, tagCounts, GONE, KEEP, RESERVED };
if (require.main !== module) return;

// ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra).slice(0, 700) + ")" : "")); }
}
const src = fs.readFileSync(path.join(DIR, "index.html"), "utf8");
const LAZY = fs.readdirSync(DIR).filter(f => /\.js$/.test(f) && !/^(test_|audit_|vendor-|zz_)/.test(f)).sort();
const MAIN = (function () { try { return cp.execSync("git show origin/main:index.html", { cwd: DIR, maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] }).toString(); } catch (e) { return null; } })();

console.log("── 1 · the removed names are gone ──");
{
  const hits = [];
  [["index.html", src]].concat(LAZY.map(f => [f, fs.readFileSync(path.join(DIR, f), "utf8")])).forEach(([f, S]) => {
    GONE.forEach(n => { const re = wordRe(n); let m; while ((m = re.exec(S))) hits.push({ f, n, at: m.index + m[1].length }); });
  });
  const inBody = (n, host) => { const b = braceSlice(src, host); const i = src.indexOf(b); return h => h.f === "index.html" && h.n === n && h.at > i && h.at < i + b.length; };
  const allowed = hits.filter(h => ALLOWED[h.n] && inBody(h.n, ALLOWED[h.n])(h));
  const bad = hits.filter(h => allowed.indexOf(h) < 0).map(h => h.f + ":" + h.n + " …" + (h.f === "index.html" ? src.slice(h.at - 40, h.at + 40) : ""));
  ok("no removed name (" + GONE.length + ") occurs in index.html or any of the " + LAZY.length + " lazy app files — code, comments, strings, markup", bad.length === 0, bad.slice(0, 8));
  ok("the only exception: cbRenderForm's two header buttons (ceOpenBuild ×, cbCloseSubj ‹ Back), once each", allowed.length === 2 && allowed.some(h => h.n === "ceOpenBuild") && allowed.some(h => h.n === "cbCloseSubj"), allowed);
  const calls = (src.match(/cbRenderForm\(/g) || []).length;
  ok("…and cbRenderForm is called by nothing, so those buttons are never drawn", calls === 1 && /function cbRenderForm\(/.test(src), calls);
  ok("no `let` / `function` declares a removed name", GONE.every(n => !new RegExp("(function\\s+|\\blet\\s+|\\bconst\\s+|,\\s*)" + n.replace(/\$/g, "\\$") + "\\s*[=(]").test(src)));
}

console.log("── 2 · what stays ──");
{
  const lines = src.split("\n");
  KEEP.forEach(n => {
    const isState = KEEP_STATE.indexOf(n) >= 0;
    const body = isState ? null : braceSlice(src, n);
    const decl = isState ? new RegExp("^let " + n + "=") : null;
    const bi = body ? src.indexOf(body) : -1;
    let live = 0; let off = 0;
    lines.forEach(L => { const re = wordRe(n); let m; while ((m = re.exec(L))) { const at = off + m.index + m[1].length; const inOwn = bi >= 0 && at >= bi && at < bi + body.length; const isComment = /^\s*\/\//.test(L) || /\/\/ /.test(L.slice(0, m.index)); /* a whole-line or trailing comment */ if (!inOwn && !isComment && !(decl && decl.test(L))) live++; } off += L.length + 1; });
    ok(n + " is still " + (isState ? "declared" : "defined") + " and has a live caller (" + live + ")", (isState ? lines.some(L => decl.test(L)) : !!body) && live > 0);
  });
  RESERVED.forEach(n => ok(n + " (reserved by the audit for the guided Add) is still defined", !!braceSlice(src, n)));
  if (MAIN) {
    const diff = KEEP.concat(RESERVED).filter(n => KEEP_STATE.indexOf(n) < 0).filter(n => {
      const a = braceSlice(MAIN, n), b = braceSlice(src, n);
      if (REPOINT[n]) return !(b === a || (a.indexOf(REPOINT[n]) >= 0 && b === a.replace(REPOINT[n], "")));
      return a !== b;
    });
    ok("every KEEP / reserved body is byte-identical to origin/main, apart from the two one-statement re-points", diff.length === 0, diff);
    ok("…the KEEP state declarations are unchanged", KEEP_STATE.every(n => { const re = new RegExp("^let " + n + "=.*$", "m"); return (MAIN.match(re) || [1])[0] === (src.match(re) || [2])[0]; }));
  } else console.log("    (no git origin/main here — the byte-identical check is skipped)");
  ok("lmDropSlot: a make-up is deleted, the armed move cleared — no lmEditSlot", /lmMovePick=null;\n  renderAll\(\);/.test(braceSlice(src, "lmDropSlot")) && !/lmEditSlot/.test(braceSlice(src, "lmDropSlot")));
  ok("lmAddSubj: the ➕ toggle and the mid-day relay — no lmAddOpen", /rtlMakeupRelay\(kid,dateStr,sk\)/.test(braceSlice(src, "lmAddSubj")) && !/lmAddOpen/.test(braceSlice(src, "lmAddSubj")));
  ok("_normOrderArr still reads a stored per-day order for the generator (_orderDayMerged, gwBuildDayTasks)", /_normOrderArr\(/.test(braceSlice(src, "_orderDayMerged") || "") && /_normOrderArr\(/.test(braceSlice(src, "gwBuildDayTasks") || ""));
  ok("the grid's cell menu still calls the kept writers (✕ off day, ✕ make-up, ➕ make-up, ↩ put back)", /lmDropSlot\(/.test(braceSlice(src, "gvMenuOff")) && /lmDropSlot\(kid,l\.date,sk,true\)/.test(braceSlice(src, "gvMenuOffAdded")) && /lmAddSubj\(/.test(braceSlice(src, "gvMenuAddMakeup")) && /lmRestoreSubj\(/.test(braceSlice(src, "gvMenuRestore")));
  ok("Align still runs alignPlanPreview / alignPlanApply from the grid", /alignPlanPreview\(/.test(braceSlice(src, "renderCurrGrid")) && /alignPlanApply\(/.test(braceSlice(src, "renderCurrGrid")));
}

console.log("── 3 · the plan's own 3b items ──");
{
  const cv = braceSlice(src, "renderCurriculumView");
  ok("renderCurriculumView is one branch: the lock, then the plan bar + the grid (no currInnerTab, no bar, no Subjects/Builder)", !/currInnerTab|forEach\(tab=>|Subjects tab|renderCurrBuilder/.test(cv) && /el\.innerHTML=h;[\s\S]*planBarHTML\([\s\S]*renderCurrGrid\(el\);\n\}$/.test(cv));
  const hq = braceSlice(src, "momHQGo");
  ok("the router: no \"builder\" anywhere, \"curriculum\" and \"grid\" land on the grid", !/builder/.test(hq) && /case "curriculum": currInnerTab="grid"; setAdminSub\("curriculum"\); return;/.test(hq) && /case "grid": currInnerTab="grid"; setAdminSub\("curriculum"\); return;/.test(hq));
  ok("every assignment to currInnerTab in the app is the literal \"grid\"", (src.match(/currInnerTab\s*=(?!=)\s*[^;,)}\n]*/g) || []).every(a => /=\s*["']grid["']$/.test(a)));
  ok("the grid has no \"Moved … ↩ Undo\" banner", !/Same Undo banner the Lesson Map shows|Moved <b>/.test(braceSlice(src, "renderCurrGrid")));
  ok("the two commented-out HQ rows are gone", !/_hqRow\("builder"|_hqRow\("curriculum"/.test(src));
}

console.log("── 4 · vm: the live Curriculum page in both views ──");
{
  const R = runVM(src);
  ok("every removed function is undefined in the running app", GONE_FNS.every(n => R.typeOf(n) === "undefined"), GONE_FNS.filter(n => R.typeOf(n) !== "undefined"));
  ok("nothing threw (no ReferenceError or any other) while drawing and tapping", R.errors.length === 0, R.errors);
  ok("no reserved-function tripwire fired (cbRenderForm and its setters are never reached)", R.fired.length === 0, [...new Set(R.fired)]);
  ok("currInnerTab is \"grid\" after every router target, the retired \"builder\" included, in both views", R.tabs.length === 6 && R.tabs.every(t => /=string:grid$/.test(t)), R.tabs);
  ["everything", "simple"].forEach(v => {
    const H = R.views[v], all = H.all.join("\n");
    ok(v + ": the page drew (" + all.length + " bytes) and the card drew (" + H.card.length + " bytes)", all.length > 20000 && H.card.length > 2000);
    const handlers = R.handlers(all + H.card);
    const KW = new Set(["if", "for", "while", "switch", "catch", "function", "return", "typeof", "new", "void", "delete", "in", "of", "do", "else"]);
    const names = new Set(); handlers.forEach(h => { const re = /(^|[^\w$.])([A-Za-z_$][\w$]*)\s*\(/g; let m; while ((m = re.exec(h))) if (!KW.has(m[2])) names.add(m[2]); });
    const undef = [...names].filter(n => R.typeOf(n) === "undefined");
    ok(v + ": " + handlers.length + " handler attributes call " + names.size + " globals — every one defined", handlers.length > 100 && undef.length === 0, undef);
    const reached = ["gvOpenCell", "gvMenuOff", "gvMenuStartMove", "gvMenuAddMakeup", "gvMenuOffAdded", "gvMenuRestore", "gvCancelMove", "kySetTab", "ceSetTargetEnd", "ceToggleMomVerifyKid", "lmcOpen", "lmcClear"];
    ok(v + ": the drive reached the live controls (" + reached.join(", ") + ")", reached.every(n => names.has(n)), reached.filter(n => !names.has(n)));
    ok(v + ": no drawn handler names a removed function", !handlers.some(h => GONE_FNS.some(n => wordRe(n).test(h))));
    const pg = tagCounts(H.page[0]), cd = tagCounts(H.card);
    ok(v + ": the page and the card are tag-balanced (div table tr td button details)", Object.values(pg).every(([a, b]) => a === b) && Object.values(cd).every(([a, b]) => a === b), { pg, cd });
  });
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
