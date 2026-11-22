/*
 * LMCLEANUP-audit — proves which Lesson Map / Builder-tab code is dead (Curriculum streamline slice 3a,
 * PLAN_curriculum_streamline_2026-11-10.md §4 row 3a, §4.3, Appendix C; her words 2026-11-10: "lets remove and clean up
 * but def audit to make sure it causes no issues before you do it"). READ-ONLY: deletes nothing, writes nothing.
 * The audit write-up is AUDIT_lessonmap_dead_2026-11-21.md beside this file.
 *
 * What it proves, on today's index.html and every lazy app .js file beside it:
 *   (1) STATIC — a small JS lexer separates code / comments / strings / regexes, every `function NAME(` body is found by
 *       brace matching, and every occurrence of every audited name is classified: comment · its definition · its own
 *       body · inside another GO body · inside a structurally dead span (the Subjects/Builder branches of
 *       renderCurriculumView, the router's "builder" case, the grid's "Moved … ↩ Undo" banner) · LIVE.
 *       Each dead span carries its own proof (the guard can only be true after GO code ran, or nothing sets it).
 *       Asserts: no GO name has a LIVE occurrence (code, onclick/onchange text, or static markup) except the exact
 *       re-point sites listed below (RE_POINT), and every KEEP name has at least one LIVE occurrence.
 *       Verdicts: KEEP (reachable) · KEEP-reserved (unreached today, the plan's ADDFLOW slice draws it) · MOVE (no live
 *       door, but still has work to do) · GO (dead). A transitive closure adds anything only GO code reaches.
 *   (2) VM — loads every inline <script> of index.html into one vm context on inert stubs (no network, no Firebase:
 *       `db` is null), then forces the dead code unreachable: every GO function is replaced by a tripwire. It drives the
 *       live Curriculum page (renderCurriculumView → the grid, every router target, the 📅 Kid's year panel) and asserts
 *       no tripwire fired and no onclick/onchange/oninput attribute in the drawn HTML names a GO function.
 *
 *   run:  node audit_lessonmap_dead.js            (exit 0 = pass)
 *         node audit_lessonmap_dead.js --json     (also writes the per-name occurrence table used by the audit doc)
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const DIR = __dirname;
const HTML = fs.readFileSync(path.join(DIR, "index.html"), "utf8");
const LAZY = fs.readdirSync(DIR).filter(f => /\.js$/.test(f) && !/^(test_|audit_|vendor-)/.test(f)).sort();

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra).slice(0, 700) + ")" : "")); }
}

// ── the verdict lists (PLAN §4.3 + Appendix C, re-found on today's main) ────────────────────────────────────────────
const KEEP = [
  // reachable through the grid's cell menu / Align banner / generator
  "lmDropSlot", "lmRemoveSubj", "lmRestoreSubj", "lmAddSubj", "alignPlanPreview", "alignPlanApply", "lmWeekAnchor",
  "lmWeekNumOfDate", "_lmKidOff", "_normOrderArr", "lmMovePick", "lmMoveWeek", "currViewKid",
  // drawn by live panels (📅 Kid's year, Admin, Settings) — only their dead-branch buttons go
  "ceRenderSessions", "ceSessToggle", "ceSetTargetEnd", "ceToggleMomVerifyKid", "downloadCurrTemplate",
  // the three moved doors (moved by KIDYEAR, now live in the subject card)
  "lrpBuilderHTML", "gvSelShiftUp", "gvAuditFixGap", "cbCopyTo",
  // the one-chip bar's handler stays live until 3b drops the bar
  "setCurrInnerTab",
];
const GO_FUNCS = [
  // the dead Subjects branch's own helpers
  "setCurrViewKid", "setCurrViewWeek",
  // the Subjects-page card and its embedded Builder
  "ceOpenBuild", "_ceMaybeBuilder", "ceBuildCard",
  // Lesson Map UI
  "lmToggleDayOff", "lmOpenAdd", "lmLessonByDate", "lmDayRunOrder", "lmNudgeSubj", "lmResetOrder", "lmWeekMonday",
  "lmRenderOffWeek", "lmSchedCheckState", "lmRenderMovePicker", "lmSetView", "lmCalData", "_lmWeekMon", "lmCalDayChips",
  "_lmDayKind", "lmSelSubj", "lmEditSlotOpen", "lmEditSlotCancel", "lmEditAddedOpen", "lmSaveAddedText", "lmSaveSlotText",
  "lmOpenMove", "lmPickMoveWeek", "lmMoveSlot", "lmRenderSubjectView", "_lmSnapMove", "_lmRestoreOverride",
  "_lmLessonEntry", "_lmMovingVal", "lmMoveDay", "lmSubjJumpWk", "lmSubjStepWk", "lmRenderSubjectGrid",
  "lmComputeSuggestions",
  // the ◀▶ move and its Undo
  "gvMenuMove", "lmUndoMove",
  // the Builder tab
  "renderCurrBuilder", "cbSetKid", "cbSummaryToggle", "cbRenderSummary", "cbCloseSubj", "cbOpenSubj", "cbJumpTo",
  "gvJumpBuilder", "cbFamilyRulesToggle",
  // Finish Line Extend
  "renderFinishLine", "flExtendSubject",
];
// MOVE — dead today, but a feature with no other door that still has work to do. The data check (audit doc §5) found 55
// leftover added:true make-ups (one kid, 2027-09-20 → 2027-10-08); the only "Clear make-ups" button is in the dead
// Subjects branch. These two stay until she has a live door and has tapped it (or said leave them).
const MOVE = ["flExtendMakeupCount", "flUndoExtend"];
// KEEP, reserved — unreached today, but PLAN §3.7 / §4 row 5 (ADDFLOW, being built now) makes them the guided Add's form:
// "steps 2–4 are cbRenderForm's fields re-chunked". Not proven removable, so they stay; 3b must not touch them.
const RESERVED = ["cbRenderForm", "cbSetMode", "cbSetField", "cbStepTpw", "cbToggleDay"];
const GO_STATE = ["cbFamilyRulesOpen", "currViewWeek", "lmViewMode", "lmEditSlot", "lmAddOpen", "lmSubjKey", "lmSubjWk", "lmLastMove"];
let GO = GO_FUNCS.concat(GO_STATE);
const goFnDecls = new Set(GO_FUNCS);

// Live sites that READ a GO name today and that 3b must re-point (each one's guard is proven dead or harmless below).
// key = "<name>@<enclosing function>"
const RE_POINT = {
  "lmEditSlot@lmDropSlot": "a stale-editor reset inside the KEPT ✕ off-day writer; lmEditSlot is only ever set non-null by lmEditSlotOpen (GO) — 3b deletes that one statement",
  "lmLastMove@renderCurrGrid": "the grid's \"Moved … ↩ Undo\" banner guard; lmLastMove is only ever set non-null by _lmSnapMove (GO) — 3b deletes the banner",
  "lmAddOpen@lmAddSubj": "a stale add-picker reset inside the KEPT ➕ make-up writer; lmAddOpen is only ever set non-null by lmOpenAdd (GO) — 3b deletes that one statement",
};

// ── 1 · a small JS lexer: kind per char (0 code · 1 comment · 2 string/template text · 3 regex · 4 HTML markup) ────
function lexJS(S, kinds, from, to) {
  const RE_BEFORE = new Set(["(", ",", "=", ":", "[", "!", "&", "|", "?", "{", "}", ";", "+", "-", "*", "%", "<", ">", "~", "^", ""]);
  const RE_KW = new Set(["return", "typeof", "case", "do", "else", "in", "of", "new", "delete", "void", "throw", "instanceof", "yield", "await"]);
  let i = from, last = "", lastWord = "";
  const tstack = [];   // template nesting: brace depth at each `${`
  let depth = 0;
  while (i < to) {
    const c = S[i], n = S[i + 1];
    if (c === "/" && n === "/") { const e = S.indexOf("\n", i); const j = e < 0 || e > to ? to : e; kinds.fill(1, i, j); i = j; continue; }
    if (c === "/" && n === "*") { const e = S.indexOf("*/", i + 2); const j = e < 0 ? to : Math.min(to, e + 2); kinds.fill(1, i, j); i = j; continue; }
    if (c === "'" || c === '"') {
      let j = i + 1; while (j < to && S[j] !== c) { if (S[j] === "\\") j++; else if (S[j] === "\n") break; j++; }
      kinds.fill(2, i, j + 1); i = j + 1; last = "str"; lastWord = ""; continue;
    }
    if (c === "`" || (c === "}" && tstack.length && tstack[tstack.length - 1] === depth)) {
      if (c === "}") { tstack.pop(); }
      let j = i + 1;
      while (j < to) {
        if (S[j] === "\\") { j += 2; continue; }
        if (S[j] === "`") { j++; break; }
        if (S[j] === "$" && S[j + 1] === "{") { tstack.push(depth); j += 2; kinds.fill(2, i, j); i = j; j = -1; break; }
        j++;
      }
      if (j === -1) { last = "("; continue; }
      kinds.fill(2, i, j); i = j; last = "str"; lastWord = ""; continue;
    }
    if (c === "/") {
      const isRe = (last === "word") ? RE_KW.has(lastWord) : RE_BEFORE.has(last);
      if (isRe) {
        let j = i + 1, cls = false;
        while (j < to) { const d = S[j]; if (d === "\\") { j += 2; continue; } if (d === "\n") break; if (cls) { if (d === "]") cls = false; } else if (d === "[") cls = true; else if (d === "/") break; j++; }
        j++; while (j < to && /[a-z]/i.test(S[j])) j++;
        kinds.fill(3, i, j); i = j; last = "str"; lastWord = ""; continue;
      }
    }
    if (/[A-Za-z0-9_$]/.test(c)) { let j = i; while (j < to && /[A-Za-z0-9_$]/.test(S[j])) j++; lastWord = S.slice(i, j); last = "word"; i = j; continue; }
    if (c === "{") depth++; else if (c === "}") depth--;
    if (!/\s/.test(c)) { last = c; lastWord = ""; }
    i++;
  }
}
function lexFile(S, isHtml) {
  const kinds = new Uint8Array(S.length);
  if (!isHtml) { lexJS(S, kinds, 0, S.length); return { kinds, scripts: [[0, S.length]] }; }
  kinds.fill(4);
  const scripts = []; const re = /<script(\s[^>]*)?>/g; let m;
  while ((m = re.exec(S))) {
    const end = S.indexOf("</script", re.lastIndex);
    if (!/\ssrc=/.test(m[1] || "")) { kinds.fill(0, re.lastIndex, end); lexJS(S, kinds, re.lastIndex, end); scripts.push([re.lastIndex, end]); }
    re.lastIndex = end + 9;
  }
  return { kinds, scripts };
}
function lineOf(S, idx) { let n = 1; for (let i = S.indexOf("\n"); i >= 0 && i < idx; i = S.indexOf("\n", i + 1)) n++; return n; }
function lineTable(S) { const starts = [0]; for (let i = 0; i < S.length; i++) if (S[i] === "\n") starts.push(i + 1); return idx => { let lo = 0, hi = starts.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= idx) lo = mid; else hi = mid - 1; } return lo + 1; }; }
function matchBrace(S, kinds, open) { let d = 0; for (let k = open; k < S.length; k++) { if (kinds[k] !== 0) continue; if (S[k] === "{") d++; else if (S[k] === "}") { d--; if (d === 0) return k; } } return -1; }
function functionsOf(S, kinds) {
  const out = []; const re = /function\s+([A-Za-z_$][\w$]*)\s*\(/g; let m;
  while ((m = re.exec(S))) {
    if (kinds[m.index] !== 0) continue;
    const open = S.indexOf("{", re.lastIndex); let o = open; while (o >= 0 && kinds[o] !== 0) o = S.indexOf("{", o + 1);
    const close = matchBrace(S, kinds, o);
    out.push({ name: m[1], start: m.index, open: o, end: close });
  }
  return out;
}

const FILES = [{ file: "index.html", S: HTML, isHtml: true }].concat(LAZY.map(f => ({ file: f, S: fs.readFileSync(path.join(DIR, f), "utf8"), isHtml: false })));
FILES.forEach(F => {
  const L = lexFile(F.S, F.isHtml); F.kinds = L.kinds; F.scripts = L.scripts; F.fns = functionsOf(F.S, F.kinds); F.line = lineTable(F.S);
  F.inner = new Int32Array(F.S.length).fill(-1); F.parent = [];   // innermost declared function at each char; parent chain
  F.fns.forEach((f, i) => { f.i = i; F.parent[i] = f.start > 0 ? F.inner[f.start] : -1; if (f.end > f.open) F.inner.fill(i, f.start, f.end + 1); });
});
const IX = FILES[0];
console.log("── 0 · inputs ──");
ok("index.html lexed: " + IX.scripts.length + " inline <script> blocks, " + IX.fns.length + " function declarations; lazy files: " + LAZY.join(" "), IX.scripts.length >= 4 && IX.fns.length > 5000);
ok("every inline <script> block parses as JavaScript (vm.Script)", IX.scripts.every(([a, b]) => { try { new vm.Script(HTML.slice(a, b)); return true; } catch (e) { console.log("    parse error in block at line " + IX.line(a) + ": " + e.message); return false; } }));
// lexer sanity: if the lexer lost its place, the brace depth of each script would not return to 0
ok("lexer sanity: every inline <script> block's code braces balance to 0", IX.scripts.every(([a, b]) => { let d = 0; for (let k = a; k < b; k++) if (IX.kinds[k] === 0) { if (HTML[k] === "{") d++; else if (HTML[k] === "}") d--; } return d === 0; }));
ok("lexer sanity: every function declaration found its closing brace", IX.fns.every(f => f.end > f.open));

function fnDecl(F, name) { return F.fns.filter(f => f.name === name); }
function enclosing(F, idx) { const i = F.inner[idx]; return i >= 0 ? F.fns[i] : null; }
function parentOf(F, f) { const i = F.parent[f.i]; return i >= 0 ? F.fns[i] : null; }
function body(name) { const d = fnDecl(IX, name)[0]; return d ? HTML.slice(d.start, d.end + 1) : ""; }

// ── 2 · the structurally dead spans, each with its proof ──────────────────────────────────────────────────────────
console.log("── 1 · the structurally dead spans ──");
const DEAD = [];   // {from,to,why}
{
  const rcv = fnDecl(IX, "renderCurriculumView")[0];
  const R = HTML.slice(rcv.start, rcv.end + 1);
  const red = R.indexOf('if(currInnerTab==="plans"||currInnerTab==="subjects") currInnerTab="grid";');
  const bOpen = R.indexOf('if(currInnerTab==="builder"){');
  const gOpen = R.indexOf('if(currInnerTab==="grid"){');
  const sub = R.indexOf("// Subjects tab — needs curriculum data");
  ok("renderCurriculumView rewrites \"subjects\"/\"plans\" to \"grid\" before any branch", red > 0 && red < bOpen && red < gOpen);
  const bClose = matchBrace(HTML, IX.kinds, rcv.start + bOpen + 'if(currInnerTab==="builder")'.length);
  DEAD.push({ from: rcv.start + bOpen, to: bClose, why: "renderCurriculumView: the Builder-tab branch (currInnerTab===\"builder\")" });
  DEAD.push({ from: rcv.start + sub, to: rcv.end, why: "renderCurriculumView: the Subjects branch (everything after the Grid's return)" });
  ok("the Grid branch returns, so the Subjects branch needs currInnerTab ∉ {grid, builder, subjects, plans}", /renderCurrGrid\(el\);\s*return;\s*\}/.test(R.slice(gOpen, sub)) && sub > gOpen);
  // every assignment to currInnerTab in the app
  const assigns = []; FILES.forEach(F => { const re = /currInnerTab\s*=(?!=)\s*([^;,)}\n]*)/g; let m; while ((m = re.exec(F.S))) if (F.kinds[m.index] === 0) assigns.push({ file: F.file, line: F.line(m.index), fn: (enclosing(F, m.index) || {}).name, val: m[1].trim() }); });
  const nonLiteral = assigns.filter(a => !/^["'](grid|builder|subjects|plans)["']$/.test(a.val));
  ok("every assignment to currInnerTab is a literal grid/builder/subjects/plans, except setCurrInnerTab(tab)", nonLiteral.length === 1 && nonLiteral[0].fn === "setCurrInnerTab", nonLiteral);
  // setCurrInnerTab's only callers pass the one-chip bar's tab, which iterates ["grid"]
  const sct = []; FILES.forEach(F => { const re = /setCurrInnerTab\(/g; let m; while ((m = re.exec(F.S))) { if (F.kinds[m.index] === 1) continue; if (F.S.slice(m.index - 9, m.index) === "function ") continue; sct.push({ file: F.file, line: F.line(m.index), fn: (enclosing(F, m.index) || {}).name, text: F.S.slice(m.index, m.index + 30) }); } });
  ok("setCurrInnerTab is called only by the one-chip bar, which iterates [\"grid\"] only", sct.length === 1 && sct[0].fn === "renderCurriculumView" && /\["grid"\]\.forEach\(tab=>\{/.test(R), sct);
  const toBuilder = assigns.filter(a => /builder/.test(a.val)).map(a => a.fn).sort();
  ok("\"builder\" is assigned only in cbJumpTo, gvJumpBuilder (both GO) and momHQGo's case \"builder\"", JSON.stringify(toBuilder) === JSON.stringify(["cbJumpTo", "gvJumpBuilder", "momHQGo"]), toBuilder);
  // momHQGo's "builder" case: no live caller passes "builder"
  const mh = fnDecl(IX, "momHQGo")[0]; const M = HTML.slice(mh.start, mh.end + 1);
  const cOpen = M.indexOf('case "builder":'); const cEnd = M.indexOf("\n", cOpen);
  DEAD.push({ from: mh.start + cOpen, to: mh.start + cEnd, why: "momHQGo: case \"builder\" (no caller passes \"builder\")" });
  const mhCalls = []; FILES.forEach(F => { const re = /momHQGo\(\\?(['"]?)([^)'"\\]*)/g; let m; while ((m = re.exec(F.S))) { if (F.kinds[m.index] === 1) continue; if (F.S.slice(m.index - 9, m.index) === "function ") continue; mhCalls.push({ file: F.file, line: F.line(m.index), fn: (enclosing(F, m.index) || {}).name, arg: m[1] ? m[2] : "<" + m[2] + ">" }); } });
  ok("no live momHQGo call passes \"builder\"", !mhCalls.some(c => c.arg === "builder"), mhCalls.filter(c => c.arg === "builder"));
  const dyn = mhCalls.filter(c => c.arg.startsWith("<"));
  ok("the only computed momHQGo targets are _hqRow(target) and momHQGo's own forwarders", dyn.every(c => /^(_hqRow|_hqGo|momHQGo|hqGoto)$/.test(c.fn) || c.arg === "<t>"), dyn);
  const hqb = []; FILES.forEach(F => { const re = /_hqRow\(\s*["']builder["']/g; let m; while ((m = re.exec(F.S))) hqb.push({ line: F.line(m.index), kind: F.kinds[m.index] }); });
  ok("_hqRow(\"builder\") exists only inside a comment", hqb.length >= 1 && hqb.every(h => h.kind === 1), hqb);

  // the grid's "Moved … ↩ Undo" banner: guarded by lmLastMove, which only GO code sets non-null
  const g = fnDecl(IX, "renderCurrGrid")[0]; const G = HTML.slice(g.start, g.end + 1);
  const ix = G.indexOf("lmLastMove"); const ln0 = G.lastIndexOf("\n", ix) + 1;
  const gOpenB = G.indexOf("{", ix); const lnEnd = matchBrace(HTML, IX.kinds, g.start + gOpenB) - g.start;   // the whole if(lmLastMove){…} block
  ok("the banner's guard is `if(typeof lmLastMove!==\"undefined\"&&lmLastMove){`", /if\(typeof lmLastMove!=="undefined"&&lmLastMove\)\{$/.test(G.slice(ln0, gOpenB + 1).trim()), G.slice(ln0, gOpenB + 1));
  DEAD.push({ from: g.start + ln0, to: g.start + lnEnd, why: "renderCurrGrid: the \"Moved … ↩ Undo\" banner (guard lmLastMove is only set by GO code)" });
  const lmSets = []; FILES.forEach(F => { const re = /lmLastMove\s*=(?!=)\s*([^;\n]*)/g; let m; while ((m = re.exec(F.S))) if (F.kinds[m.index] === 0) lmSets.push({ line: F.line(m.index), fn: (enclosing(F, m.index) || {}).name || "<top level>", val: m[1].slice(0, 40) }); });
  ok("lmLastMove is set non-null only by _lmSnapMove (GO); every other assignment is null or its declaration", lmSets.every(s => /^null\b/.test(s.val) || s.fn === "_lmSnapMove") && lmSets.some(s => s.fn === "_lmSnapMove"), lmSets);
  const leSets = []; FILES.forEach(F => { const re = /lmEditSlot\s*=(?!=)\s*([^;\n]*)/g; let m; while ((m = re.exec(F.S))) if (F.kinds[m.index] === 0) leSets.push({ line: F.line(m.index), fn: (enclosing(F, m.index) || {}).name || "<top level>", val: m[1].slice(0, 40) }); });
  ok("lmEditSlot is set non-null only by GO functions (lmEditSlotOpen / lmEditAddedOpen); lmDropSlot only clears it", leSets.every(s => /^null\b/.test(s.val) || GO_FUNCS.includes(s.fn)), leSets);
  DEAD.forEach(d => console.log("    dead span L" + IX.line(d.from) + "–" + IX.line(d.to) + ": " + d.why));
}

// ── 3 · classify every occurrence of every audited name ────────────────────────────────────────────────────────────
function classify(F, name, idx) {
  const k = F.kinds[idx];
  if (k === 1) return "comment";
  const enc = enclosing(F, idx);
  if (enc && enc.name === name && idx < enc.open) return "definition";
  if (F.isHtml || F === IX) {
    if (F === IX && /^\s*(let|var|const)\s/.test(F.S.slice(F.S.lastIndexOf("\n", idx) + 1, idx)) && !enc) return "definition";
  }
  if (!enc && /(let|var|const)\s+[^;]*$/.test(F.S.slice(Math.max(0, idx - 120), idx)) && /^\s*[=;,]/.test(F.S.slice(idx + name.length, idx + name.length + 3))) return "definition";
  // walk outward through enclosing functions: any GO ancestor or dead span makes it dead
  for (let e = enc; e; e = parentOf(F, e)) {
    if (e.name === name) return "own body";
    if (goFnDecls.has(e.name)) return "GO body (" + e.name + ")";
    if (RESERVED.includes(e.name)) return "reserved body (" + e.name + ")";
  }
  if (F === IX) for (const d of DEAD) if (idx >= d.from && idx <= d.to) return "dead span (" + d.why.split(":")[0] + ")";
  if (k === 4) return "LIVE markup";
  return k === 2 ? "LIVE string (handler/HTML text)" : "LIVE code";
}
// ── 2b · the transitive closure: anything else that only the GO code (or a dead span) reaches ───────────────────────
// A function or top-level variable is dead too when it is referenced at least once and EVERY reference (code, handler
// text, markup) sits in a comment, its own body, a GO body or a dead span. Any reference from anywhere else — including a
// `typeof X` probe, a string, or another file — keeps it. Iterated to a fixed point.
console.log("── 1b · the transitive closure (names the plan's list missed) ──");
const IDX = new Map();   // name → [{F, idx}] for every identifier not preceded by "."
FILES.forEach(F => { const re = /[A-Za-z_$][\w$]*/g; let m; while ((m = re.exec(F.S))) { if (F.kinds[m.index] === 1) continue; if (m.index && F.S[m.index - 1] === ".") continue; if (/^\d/.test(m[0])) continue; let a = IDX.get(m[0]); if (!a) IDX.set(m[0], a = []); a.push({ F, idx: m.index }); } });
const topDecl = new Map();   // name → [{start,end,kind}] top-level declarations in index.html
IX.fns.forEach(f => { if (IX.parent[f.i] === -1) { if (!topDecl.has(f.name)) topDecl.set(f.name, []); topDecl.get(f.name).push({ start: f.start, end: f.end, kind: "function" }); } });
{ const re = /(^|\n)[ \t]*(let|var|const)\s+([^;]*)/g; let m; while ((m = re.exec(HTML))) { const at = m.index + m[1].length; if (IX.kinds[at] !== 0 || IX.inner[at] !== -1) continue; const decl = m[3]; let d = 0, seg = 0; const parts = []; for (let k = 0; k <= decl.length; k++) { const c = decl[k]; if (c === "(" || c === "[" || c === "{") d++; else if (c === ")" || c === "]" || c === "}") d--; else if ((c === "," && d === 0) || k === decl.length) { parts.push(decl.slice(seg, k)); seg = k + 1; } } parts.forEach(p => { const mm = /^\s*([A-Za-z_$][\w$]*)\s*(=|$)/.exec(p); if (mm) { if (!topDecl.has(mm[1])) topDecl.set(mm[1], []); topDecl.get(mm[1]).push({ start: at, end: at + m[0].length - m[1].length, kind: "state" }); } }); } }
function deadAt(F, idx, self, deadSet) {
  if (F.kinds[idx] === 1) return true;
  for (let e = enclosing(F, idx); e; e = parentOf(F, e)) if (e.name === self || deadSet.has(e.name) || RESERVED.includes(e.name)) return true;
  if (F === IX) for (const d of DEAD) if (idx >= d.from && idx <= d.to) return true;
  return false;
}
const deadSet = new Set(GO_FUNCS.concat(GO_STATE)); const keepSet = new Set(KEEP.concat(MOVE, RESERVED));
const EXTRA = [];   // [{name, kind, why}]
for (let changed = true; changed;) {
  changed = false;
  for (const [name, decls] of topDecl) {
    if (deadSet.has(name) || keepSet.has(name) || decls.length !== 1) continue;
    const D0 = decls[0]; const refs = (IDX.get(name) || []).filter(r => !(r.F === IX && r.idx >= D0.start && r.idx <= (D0.kind === "function" ? D0.start + 9 + name.length : D0.end)));
    if (!refs.length) continue;   // never referenced at all: already orphaned before this cleanup — not this audit's business
    // at least one reference must come from GO code or a dead span — a name only its own body names was orphaned long ago
    const fromDead = refs.some(r => r.F.kinds[r.idx] !== 1 && deadAt(r.F, r.idx, "\u0000", deadSet));
    if (fromDead && refs.every(r => deadAt(r.F, r.idx, name, deadSet))) {
      deadSet.add(name); changed = true;
      const from = [...new Set(refs.filter(r => r.F.kinds[r.idx] !== 1).map(r => { const e = enclosing(r.F, r.idx); return e && e.name !== name ? e.name : (e ? "own body" : "dead span"); }))];
      EXTRA.push({ name, kind: D0.kind, line: IX.line(D0.start), from });
    }
  }
}
EXTRA.forEach(x => console.log("    also dead: " + x.name + " (" + x.kind + ", L" + x.line + ") — referenced only from " + x.from.join(", ")));
const EXTRA_FN = EXTRA.filter(x => x.kind === "function").map(x => x.name), EXTRA_STATE = EXTRA.filter(x => x.kind === "state").map(x => x.name);
EXTRA_FN.forEach(n => goFnDecls.add(n));
GO = GO.concat(EXTRA_FN, EXTRA_STATE);
ok("the closure found " + EXTRA.length + " more dead name(s); each is added to the GO list for the checks below", true);

console.log("── 2 · every occurrence of every audited name ──");
const live = r => r.cls.startsWith("LIVE");
const TABLE = {};
function scan(name) {
  const rows = [];
  const re = new RegExp("(^|[^A-Za-z0-9_$.])(" + name.replace(/\$/g, "\\$") + ")(?![A-Za-z0-9_$])", "g");
  FILES.forEach(F => { let m; re.lastIndex = 0; while ((m = re.exec(F.S))) { const idx = m.index + m[1].length; const enc = enclosing(F, idx); rows.push({ file: F.file, line: F.line(idx), cls: classify(F, name, idx), fn: enc ? enc.name : "<top level>" }); } });
  return rows;
}
[...KEEP, ...MOVE, ...RESERVED, ...GO].forEach(n => { TABLE[n] = scan(n); });
const resLive = RESERVED.filter(n => TABLE[n].some(r => live(r) && r.cls !== "definition"));
ok("the RESERVED names (" + RESERVED.join(", ") + ") are reached by nothing live today — kept only for ADDFLOW", resLive.length === 0, resLive);
const moveLive = MOVE.filter(n => TABLE[n].some(r => live(r) && r.cls !== "definition" && !MOVE.includes(r.fn)));
ok("the MOVE names (" + MOVE.join(", ") + ") have no live door today — the reason they must move, not stay as they are", moveLive.length === 0, moveLive);
// tests that name each
const TESTS = fs.readdirSync(DIR).filter(f => /^test_.*\.js$/.test(f));
const TSRC = {}; TESTS.forEach(t => TSRC[t] = fs.readFileSync(path.join(DIR, t), "utf8"));
function testsNaming(name) { const re = new RegExp("(^|[^A-Za-z0-9_$])" + name.replace(/\$/g, "\\$") + "(?![A-Za-z0-9_$])"); return TESTS.filter(t => re.test(TSRC[t])); }

const offending = [];
GO.forEach(n => {
  const L = TABLE[n].filter(live);
  const unexpected = L.filter(r => !RE_POINT[n + "@" + r.fn]);
  if (unexpected.length) offending.push({ name: n, at: unexpected });
  const defs = TABLE[n].filter(r => r.cls === "definition");
  if (!defs.length) offending.push({ name: n, missingDefinition: true });
});
ok("every GO name (" + GO.length + ") is defined, and has no LIVE occurrence outside the " + Object.keys(RE_POINT).length + " re-point sites", offending.length === 0, offending);
const rp = Object.keys(RE_POINT).map(k => { const [n, fn] = k.split("@"); return { k, n: TABLE[n].filter(r => r.cls !== "comment" && r.fn === fn).length }; });
ok("each re-point site is really there today (so 3b knows what to touch)", rp.every(x => x.n > 0), rp);
const keepNoLive = KEEP.filter(n => !TABLE[n].some(r => live(r) && r.cls !== "definition"));
ok("every KEEP name (" + KEEP.length + ") has at least one LIVE occurrence outside its own body", keepNoLive.length === 0, keepNoLive);
const keepGo = KEEP.filter(n => TABLE[n].some(r => r.cls === "definition") === false);
ok("every KEEP name is defined", keepGo.length === 0, keepGo);
const lazyHits = [...KEEP, ...GO].filter(n => TABLE[n].some(r => r.file !== "index.html"));
ok("no lazy .js file (" + LAZY.length + ") names any audited name", lazyHits.length === 0, lazyHits);

// ── 4 · the three moved doors really have a new home (KIDYEAR) ───────────────────────────────────────────────────
console.log("── 3 · the three doors whose only home was the dead code now live elsewhere ──");
{
  const lrp = TABLE.lrpBuilderHTML.filter(live).map(r => r.fn);
  ok("📋 Plan resources (lrpBuilderHTML) is drawn by live code: " + [...new Set(lrp)].join(", "), lrp.length > 0 && !lrp.includes("renderCurrBuilder"), lrp);
  ["gvSelShiftUp", "gvAuditFixGap", "cbCopyTo"].forEach(n => ok(n + " no longer opens the Builder tab (no cbOpenSubj/cbSetKid/currInnerTab=)", !/currInnerTab\s*=|cbOpenSubj\(|cbSetKid\(/.test(body(n))));
  ok("cbCopyTo / gvSelShiftUp / gvAuditFixGap are still reached by live code", ["cbCopyTo", "gvSelShiftUp", "gvAuditFixGap"].every(n => TABLE[n].some(r => live(r))));
}

// ── 5 · VM: load the app on inert stubs, tripwire every GO function, drive the live Curriculum page ──────────────────
console.log("── 4 · vm: the live Curriculum page, with every GO function replaced by a tripwire ──");
const vmResult = (function runVM() {
  const fired = [];
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
    navigator: { userAgent: "node-audit", onLine: false, serviceWorker: undefined, platform: "node", language: "en-US", maxTouchPoints: 0 },
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
  const errs = [];
  IX.scripts.forEach(([a, b]) => { try { vm.runInContext(HTML.slice(a, b), ctx, { filename: "index.html@L" + IX.line(a) }); } catch (e) { errs.push("L" + IX.line(a) + ": " + String(e && e.message).slice(0, 120) + " @ " + String(e && e.stack).split("\n").slice(1,3).join(" ")); } });
  const g = n => { try { return vm.runInContext("typeof " + n + "==='function'?" + n + ":undefined", ctx); } catch (e) { return undefined; } };
  const TRIP = [...goFnDecls, ...RESERVED];
  const defined = TRIP.filter(n => g(n));
  // force the dead code unreachable: each GO function (the plan's list + the closure's) becomes a tripwire
  TRIP.forEach(n => { try { vm.runInContext(n + "=function(){ __trip(" + JSON.stringify(n) + "); return ''; };", ctx); } catch (e) {} });
  ctx.__trip = n => fired.push(n);
  // a small family: every roster kid, one sequenced subject with five lessons NEXT week (future cells open the action menu)
  const today = new Date(); const iso = d => d.toISOString().slice(0, 10);
  const mon = new Date(today); mon.setDate(today.getDate() - ((today.getDay() + 6) % 7) + 7);
  const days = [0, 1, 2, 3, 4].map(i => { const d = new Date(mon); d.setDate(mon.getDate() + i); return iso(d); });
  const html = []; const visits = [];
  function drive(label, js) {
    try { const out = vm.runInContext(js, ctx); if (typeof out === "string") html.push(out); visits.push(label + ": ok"); }
    catch (e) { visits.push(label + ": threw " + String(e && e.message).slice(0, 100)); }
  }
  drive("seed", `
    try{ momModeActive=true; }catch(e){} try{ adminPinUnlocked=true; }catch(e){}
    try{ if(typeof ROSTER!=="undefined"&&ROSTER.length===0) ROSTER.push("kid"); }catch(e){}
    try{ currData={subjects:{},lessons:{},done:{},weekDays:{},momVerifyKid:{},targetEnd:{}}; ROSTER.forEach(function(k){ currData.subjects[k]={math:{display:"Math",tracking:"sequenced",minutes:30,mom:"none",device:"paper",allowedDays:["Mon","Tue","Wed","Thu","Fri"],timesPerWeek:5,cap:1,lessonSeq:["L 1","L 2","L 3"]}}; currData.lessons[k]={}; currData.done[k]={}; ${JSON.stringify(days)}.forEach(function(d,i){ currData.lessons[k][90000+i]=(i===3?{date:d,week:1}:{date:d,week:1,math:"L "+(i+1)}); }); }); }catch(e){}
    try{ scheduleOverrides={}; }catch(e){}
  `);
  const cv = "(function(){ var el=document.getElementById('cv'); el.innerHTML=''; try{ renderCurriculumView(el,''); }catch(e){ return 'THREW:'+e.message; } return el.innerHTML; })()";
  drive("set the grid's kid", "try{ gvKid=ROSTER[0]; }catch(e){} ''");
  ["grid", "subjects", "plans"].forEach(t => drive("currInnerTab=" + t + " → draw", "currInnerTab=" + JSON.stringify(t) + ";" + cv));
  ["curriculum", "grid"].forEach(t => drive("momHQGo(" + JSON.stringify(t) + ") → draw", "try{ setAdminSub=function(){}; }catch(e){} momHQGo(" + JSON.stringify(t) + "); " + cv));
  drive("📅 Kid's year panel, all four tabs", "(function(){ var out=''; cbRulesOpen=true; ['hours','terms','lanes','all'].forEach(function(t){ kyTab=t; out+=" + cv + "; }); cbRulesOpen=false; return out; })()");
  drive("a future grid cell's action menu (✕ off day · ➡ move · ↩ put back …)", "(function(){ try{ gvOpenCell(90002,'math'); }catch(e){ return 'THREW:'+e.message; } return " + cv + "; })()");
  drive("an empty cell's ➕ make-up", "(function(){ try{ gvMenu=null; gvOpenCell(90003,'math'); }catch(e){ return 'THREW:'+e.message; } return " + cv + "; })()");
  drive("the ➡ move armed (Parking banner + Cancel)", "(function(){ try{ gvMenu=null; lmMovePick={date:" + JSON.stringify(days[1]) + ",sk:'math',added:false,kid:gvKid}; }catch(e){ return 'THREW:'+e.message; } var o=" + cv + "; lmMovePick=null; return o; })()");
  drive("the subject card (every section)", "(function(){ try{ ceOpenEdit(ROSTER[0],'math'); }catch(e){ return 'THREW:'+e.message; } return document.getElementById('ce-sheet-wrap').innerHTML; })()");
  drive("⤒ Delete & shift up's moved door (kyPaceDoor → the card's Pace preview)", "(function(){ try{ kyPaceDoor(ROSTER[0],'math'); }catch(e){ return 'THREW:'+e.message; } return document.getElementById('ce-sheet-wrap').innerHTML; })()");
  drive("Copy to another kid's landing (kyCopyLand)", "(function(){ try{ kyCopyLand(ROSTER[0],'math'); }catch(e){ return 'THREW:'+e.message; } return document.getElementById('ce-sheet-wrap').innerHTML; })()");
  const drawn = html.join("\n");
  const attrs = []; { const re = /\son(click|change|input|keydown|keyup|submit)="([^"]*)"/g; let m; while ((m = re.exec(drawn))) attrs.push(m[2]); }
  const named = attrs.filter(a => TRIP.some(n => new RegExp("(^|[^\\w$.])" + n + "\\(").test(a)));
  drive("currInnerTab after every router target", "''");
  const tab = (function () { try { vm.runInContext("momHQGo('curriculum')", ctx); vm.runInContext("(function(){ var el=document.getElementById('cv'); renderCurriculumView(el,''); })()", ctx); return vm.runInContext("currInnerTab", ctx); } catch (e) { return "?"; } })();
  const LIVE_HANDLERS = ["gvOpenCell", "gvMenuOff", "gvMenuStartMove", "gvMenuAddMakeup", "gvCancelMove", "kySetTab", "ceSetTargetEnd", "ceToggleMomVerifyKid", "ceSessToggle", "gvRulesToggle", "setCurrInnerTab"];
  const handlerSeen = LIVE_HANDLERS.filter(n => attrs.some(a => a.indexOf(n + "(") >= 0));
  return { TRIP, handlerSeen, LIVE_HANDLERS, errs, defined, fired, attrs: attrs.length, named, visits, drawnBytes: drawn.length, tab, threw: html.filter(h => /^THREW:/.test(h)) };
})();
console.log("    script blocks that stopped early on the stubs (function declarations are hoisted, so all are defined): " + (vmResult.errs.length ? vmResult.errs.join(" | ") : "none"));
vmResult.visits.forEach(v => console.log("    " + v));
ok("all " + vmResult.TRIP.length + " GO functions exist as globals in the vm before the tripwires go in", vmResult.defined.length === vmResult.TRIP.length, vmResult.TRIP.filter(n => !vmResult.defined.includes(n)));
ok("the live page drew (" + vmResult.drawnBytes + " bytes of HTML, " + vmResult.attrs + " handler attributes)", vmResult.drawnBytes > 5000 && vmResult.attrs > 20, vmResult.threw);
ok("the drive really reached the live controls (" + vmResult.handlerSeen.join(", ") + ")", vmResult.handlerSeen.length === vmResult.LIVE_HANDLERS.length, vmResult.LIVE_HANDLERS.filter(n => !vmResult.handlerSeen.includes(n)));
ok("the router's targets all land on the Grid (currInnerTab === \"grid\")", vmResult.tab === "grid", vmResult.tab);
ok("no GO tripwire fired while drawing the live page", vmResult.fired.length === 0, [...new Set(vmResult.fired)]);
ok("no drawn onclick/onchange/oninput names a GO function", vmResult.named.length === 0, vmResult.named.slice(0, 5));

// ── bytes 3b would free: the union of every GO function's declaration, the dead spans and the GO state declarators ──
console.log("── 5 · size ──");
const spans = [];
[...goFnDecls].forEach(n => fnDecl(IX, n).forEach(d => spans.push([d.start, d.end + 1])));
DEAD.forEach(d => spans.push([d.from, d.to + 1]));
spans.sort((a, b) => a[0] - b[0]);
const merged = []; spans.forEach(sp => { const L = merged[merged.length - 1]; if (L && sp[0] <= L[1]) L[1] = Math.max(L[1], sp[1]); else merged.push(sp.slice()); });
const goBytes = merged.reduce((t, [a, b]) => t + Buffer.byteLength(HTML.slice(a, b)), 0);
const planBytes = (() => { const pl = []; GO_FUNCS.forEach(n => fnDecl(IX, n).forEach(d => pl.push([d.start, d.end + 1]))); DEAD.forEach(d => pl.push([d.from, d.to + 1])); pl.sort((a, b) => a[0] - b[0]); const m = []; pl.forEach(sp => { const L = m[m.length - 1]; if (L && sp[0] <= L[1]) L[1] = Math.max(L[1], sp[1]); else m.push(sp.slice()); }); return m.reduce((t, [a, b]) => t + Buffer.byteLength(HTML.slice(a, b)), 0); })();
const totalBytes = Buffer.byteLength(HTML);
// …plus the full-line comments directly above each GO function (its header), which 3b deletes with it
const withHdr = merged.map(([a, b]) => { let st = a; for (;;) { const prevEnd = HTML.lastIndexOf("\n", st - 1); if (prevEnd < 0) break; const prevStart = HTML.lastIndexOf("\n", prevEnd - 1) + 1; const line = HTML.slice(prevStart, prevEnd); if (!/^\s*\/\//.test(line) || /_(START|END)\b/.test(line)) break; st = prevStart; } const ls = HTML.lastIndexOf("\n", a - 1) + 1; return [Math.min(st, ls), b]; });
const goBytesHdr = withHdr.reduce((t, [a, b]) => t + Buffer.byteLength(HTML.slice(a, b)), 0);
console.log("    GO code (bodies + dead spans, not counting their comment headers): " + goBytes + " bytes = " + (goBytes / 1024).toFixed(1) + " KB; with their comment headers " + goBytesHdr + " bytes = " + (goBytesHdr / 1024).toFixed(1) + " KB — of " + (totalBytes / 1048576).toFixed(2) + " MB (" + (100 * goBytes / totalBytes).toFixed(2) + " %); the plan's list alone: " + planBytes + " bytes");
ok("the GO list frees at least 80 KB", goBytes > 80 * 1024, goBytes);

// ── report ────────────────────────────────────────────────────────────────────────────────────────────────────────
if (process.argv.includes("--json")) {
  const sz = n => { const d = fnDecl(IX, n)[0]; return d ? Buffer.byteLength(HTML.slice(d.start, d.end + 1)) : 0; };
  const out = { goBytes, goBytesHdr, planBytes, totalBytes, extra: EXTRA, move: {}, keep: {}, go: {}, dead: DEAD.map(d => ({ from: IX.line(d.from), to: IX.line(d.to), why: d.why, bytes: Buffer.byteLength(HTML.slice(d.from, d.to + 1)) })) };
  out.reserved = {}; RESERVED.forEach(n => out.reserved[n] = { rows: TABLE[n], tests: testsNaming(n), bytes: sz(n) });
  MOVE.forEach(n => out.move[n] = { rows: TABLE[n], tests: testsNaming(n), bytes: sz(n) });
  [...KEEP].forEach(n => out.keep[n] = { rows: TABLE[n], tests: testsNaming(n), bytes: sz(n) });
  GO.forEach(n => out.go[n] = { rows: TABLE[n], tests: testsNaming(n), bytes: sz(n) });
  fs.writeFileSync(process.env.AUDIT_JSON || path.join(require("os").tmpdir(), "audit_lessonmap_dead.json"), JSON.stringify(out, null, 1));
  console.log("  (wrote " + (process.env.AUDIT_JSON || path.join(require("os").tmpdir(), "audit_lessonmap_dead.json")) + ")");
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
