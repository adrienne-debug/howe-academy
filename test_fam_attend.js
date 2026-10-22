/*
 * Node tests — 🏡 FAMATTEND: "not here" per kid on Mom's Done (her ask 2026-10-22, session D of the 10/22 pack).
 * The hole: Mom's one tap on a Family Time card marked EVERY kid's copy done and paid every kid — a kid who left sick
 * mid-morning was recorded present and paid.
 *
 * Runs the REAL FAMBLOCK + FAMATTEND slices (and the real dlg-ok / dlg-uncheck handlers, and rtSchoolworkDone,
 * famCellDone, famCheckPre) in a sandbox:
 *   1. the chips — one per open copy, default "here"; a tap flips; the last "here" can't be flipped
 *   2. Mom's plain "Done — everyone" with one kid not here → that copy unfinalized + flagged (ONE targeted write,
 *      WK/tasks/<id>/famAbsent = true), the others done; no chips touched → byte-identical to today (origin/main's
 *      handler, same stubs, same log — or FAM_BASE=<old index.html> to compare against another build)
 *   3. Mom's ⭐ screen — points go only to present kids; no chips touched → identical to the FAMBLOCK-only path
 *   4. a re-opened ⭐ screen on the "not here" copy: flipped back → paid (the once-lock is already taken)
 *   5. Unmark clears every flag (targeted removes), through the real dlg-uncheck handler
 *   6. the cell still counts as taught (famCellDone) and the lesson place rule (famCheckPre) is untouched
 *   7. an absent copy does not block that kid's day-done (rtSchoolworkDone)
 *   8. the kid’s view — "wasn’t here" line, the tap only says so; structure (block placement, ten one-line hooks, writes)
 *
 *   run:  node test_fam_attend.js          (reads ./index.html)
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
// today's build to compare against: FAM_BASE=<old index.html>, else origin/main (git show), else that check is skipped
let baseSrc = process.env.FAM_BASE ? fs.readFileSync(process.env.FAM_BASE, "utf8") : null;
if (!baseSrc) { try { baseSrc = require("child_process").execSync("git show origin/main:index.html", { cwd: __dirname, maxBuffer: 1 << 28, stdio: ["ignore", "pipe", "ignore"] }).toString("utf8"); } catch (e) {} }

function extractFn(name, from) {
  from = from || src;
  const i = from.indexOf("function " + name + "(");
  if (i < 0) throw new Error("not found: " + name);
  let depth = 0, started = false;
  for (let k = from.indexOf("{", i); k < from.length; k++) {
    const c = from[k];
    if (c === "{") { depth++; started = true; }
    else if (c === "}") { depth--; if (started && depth === 0) return from.slice(i, k + 1); }
  }
  throw new Error("unbalanced: " + name);
}
function slice(a, b, from) {
  from = from || src;
  const i = from.indexOf(a); if (i < 0) throw new Error("slice start not found: " + a);
  const j = from.indexOf(b, i); if (j < 0) throw new Error("slice end not found: " + b);
  return from.slice(i, j);
}
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

const toMin = (t) => { if (t == null) return NaN; const m = String(t).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i); if (!m) return NaN; let h = parseInt(m[1], 10); const mi = parseInt(m[2], 10); const ap = (m[3] || "").toUpperCase(); if (ap === "PM" && h !== 12) h += 12; if (ap === "AM" && h === 12) h = 0; return h * 60 + mi; };
const fromMin = (v) => { let h = Math.floor(v / 60), m = v % 60; const ap = h >= 12 ? "PM" : "AM"; let hh = h % 12; if (hh === 0) hh = 12; return hh + ":" + String(m).padStart(2, "0") + " " + ap; };
const fbArr = (v) => { if (!v) return v; if (Array.isArray(v)) return v; if (typeof v === "object") { const k = Object.keys(v); if (k.length && k.every(x => /^\d+$/.test(x))) return k.sort((a, b) => a - b).map(x => v[x]); } return v; };
const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const ROSTER = ["taylor", "makenzie", "andrew", "caleb"];

const FAM_ALL = slice("// FAMBLOCK_START", "// FAMATTEND_END");          // FAMBLOCK + FAMATTEND, as laid out
const FAM_ONLY = slice("// FAMBLOCK_START", "// FAMBLOCK_END");          // FAMBLOCK alone (today's points path)
const DLG_OK = slice('document.getElementById("dlg-ok").onclick=()=>{', 'document.getElementById("dlg-uncheck").onclick=');
const DLG_UN = slice('document.getElementById("dlg-uncheck").onclick=()=>{', "function closeDlg()");
const DLG_OK_BASE = baseSrc ? slice('document.getElementById("dlg-ok").onclick=()=>{', 'document.getElementById("dlg-uncheck").onclick=', baseSrc) : null;

// A tiny DOM: enough for the dialog's detail line, the ⭐ overlay and the chips.
function fakeDoc() {
  const els = {};
  function mk(id) {
    const e = { id: id, innerHTML: "", style: {}, _kids: [], parentNode: null, onclick: null,
      remove() { if (this.parentNode) this.parentNode._kids = this.parentNode._kids.filter(k => k !== this); this.parentNode = null; if (this.id) delete els[this.id]; },
      appendChild(c) { c.parentNode = this; this._kids.push(c); if (c.id) els[c.id] = c; return c; },
      insertBefore(c, ref) { c.parentNode = this; const i = this._kids.indexOf(ref); if (i < 0) this._kids.push(c); else this._kids.splice(i, 0, c); if (c.id) els[c.id] = c; return c; },
      get nextSibling() { if (!this.parentNode) return null; const k = this.parentNode._kids; return k[k.indexOf(this) + 1] || null; } };
    if (id) els[id] = e;
    return e;
  }
  const box = mk("dlg-box"); box.appendChild(mk("dlg-title")); box.appendChild(mk("dlg-detail")); box.appendChild(mk("dlg-actions"));
  mk("dlg");
  return { getElementById: id => els[id] || null, createElement: () => mk(""), body: mk("body"), els: els };
}

// The sandbox: real family code + stubs for the app globals. ENV.famCode picks which slice; ENV.extra adds handlers.
function world(ENV) {
  const log = [], writes = [], toasts = [], bank = [], store = {};
  const doc = fakeDoc();
  const ctx = {
    document: doc, ROSTER, toMin, fromMin, fbArr, cap, esc: s => String(s),
    rulesData: ENV.rulesData, weekData: { tasks: ENV.tasks }, currData: { subjects: {} },
    checked: ENV.checked || {}, claimed: {}, histState: {}, WK: "week1", _todayDay: "monday", day: "monday", DAYS: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    lastTasksWrite: 0, lastCheckedWrite: 0, manualUnchecks: new Set(), pendingId: null, pendingClaimMode: false,
    db: ENV.nodb ? null : { ref: p => ({
      set: v => { writes.push(["set", p, v]); return { then: () => {} }; }, remove: () => writes.push(["remove", p]),
      update: u => writes.push(["update", p, u]), transaction: (fn, cb) => { writes.push(["txn", p]); cb(null, true); } }) },
    _dryRun: () => !!ENV.dry, nowTs: () => "1:30 PM Mon", dbg: m => log.push("dbg:" + m), sv: (k, v) => { store[k] = JSON.parse(JSON.stringify(v)); }, ld: k => store[k] ? JSON.parse(JSON.stringify(store[k])) : null,
    momHere: () => ENV.mom !== false, momHereCards: () => ENV.mom !== false, renderAll: () => log.push("render"), gwShowToast: m => toasts.push(m),
    bankDirect: (k, p, n) => { const id = "b" + bank.length; bank.push({ k, p, n, id }); return id; },
    bankDirectRemove: (k, id) => { const i = bank.findIndex(b => b.id === id); if (i >= 0) bank.splice(i, 1); },
    rlogAppend: () => {}, checkoffHeld: () => false, closeDlg: () => { log.push("close"); ctx.pendingId = null; },
    showPaceToast: () => {}, scoredType: () => null, openScoreDialog: () => log.push("score"), openOrderBlockDialog: () => log.push("orderblock"),
    effectiveDay: t => t.day, rtSchoolworkDone: () => false, celebrateDayComplete: () => {}, obSet: () => {}, obRemove: () => {},
    ckForget: () => {}, lidDoneRemove: () => {}, spinRecParts: () => [], schedCascade: () => log.push("cascade"), setTimeout: () => 0,
    FX_DOW: { monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun" },
    // the real finalizeDone's visible effect, in call order: mark + history (score rides along)
    finalizeDone: (id, ts, score) => { log.push("finalize:" + id); ctx.checked[id] = ts; ctx.histState[id] = { id, score }; return true; },
    log, writes, toasts, bank, store,
  };
  const code = (ENV.famCode || FAM_ALL) + "\n" + (ENV.extra || "") + "\n" +
    "Object.assign(ctx,{famSiblings,famGroup,famRowHTML,famRateOpen,famRateSave,famRateRender,famRateSet,famUncheckSiblings,famBeforeUncheck,famPtsMax,famScore," +
    (ENV.famCode === FAM_ONLY ? "" : "famAttendFlip,famAttendDlg,famAttendSave,famAttendOpen,famAttendClear,famAttendKidTap,famIsAbsent,famAttendChipsHTML,") +
    "dlgOk:(typeof __dlgOk==='function')?__dlgOk:null,dlgUn:(typeof __dlgUn==='function')?__dlgUn:null,setPending:function(id){ pendingId=id; pendingClaimMode=false; }});";
  new Function("ctx", "with(ctx){" + code + "}")(ctx);
  return ctx;
}
// the real handlers, as functions the test can call
const OK_FN = "function __dlgOk(){ (" + DLG_OK.replace('document.getElementById("dlg-ok").onclick=', "").replace(/;\s*$/, "") + ")(); }";
const UN_FN = "function __dlgUn(){ (" + DLG_UN.replace('document.getElementById("dlg-uncheck").onclick=', "").replace(/;\s*$/, "") + ")(); }";
const OK_FN_BASE = DLG_OK_BASE ? "function __dlgOk(){ (" + DLG_OK_BASE.replace('document.getElementById("dlg-ok").onclick=', "").replace(/;\s*$/, "") + ")(); }" : null;

const SD = { defaultStart: "9:00 AM", defaultEnd: "4:00 PM", lunchStart: "12:00 PM", lunchEnd: "1:00 PM" };
const rules = (blocks) => ({ schoolDay: SD, familyBlocks: blocks });
const PLAIN = { name: "Family Time", kids: ROSTER.slice(), days: ["Mon"], at: "lunch", items: [{ key: "hist", name: "History", minutes: 30 }] };
const PAYS = { name: "Family Time", kids: ROSTER.slice(), days: ["Mon"], at: "lunch", items: [{ key: "hist", name: "History", minutes: 30, pts: 20 }] };
const mkTasks = () => ROSTER.map((k, i) => ({ id: "h" + i, who: k, day: "monday", time: "1:00 PM", dur: 30, title: "🏡 History", famBlock: "fb1", famItem: "hist" }))
  .concat([{ id: "a1", who: "andrew", day: "monday", time: "9:00 AM", dur: 20, title: "Math" }]);
const absentWrites = w => w.writes.filter(x => /famAbsent/.test(x[1]));

console.log("1. the chips");
{
  const w = world({ rulesData: rules({ fb1: PLAIN }), tasks: mkTasks() });
  const t = w.weekData.tasks[0];
  ok("Mom opens the dialog on an open family card → chips under the detail line", w.famAttendDlg(t, false) === true && !!w.document.getElementById("fam-attend"));
  const html = w.document.getElementById("fam-attend").innerHTML;
  ok("one chip per member kid, every one 'here' by default", (html.match(/famAttendFlip\(/g) || []).length === 4 && !/not here/.test(html) && /✓ Taylor/.test(html) && /✓ Caleb/.test(html), html);
  ok("the chips sit right after the detail line, inside the dialog box", w.document.getElementById("dlg-detail").nextSibling === w.document.getElementById("fam-attend"));
  w.famAttendFlip("h2");
  ok("a tap flips Andrew to 'not here' and redraws", /✕ Andrew — not here/.test(w.document.getElementById("fam-attend").innerHTML) && !/✕ Taylor/.test(w.document.getElementById("fam-attend").innerHTML));
  w.famAttendFlip("h2");
  ok("a second tap flips him back", !/not here/.test(w.document.getElementById("fam-attend").innerHTML));
  w.famAttendFlip("h0"); w.famAttendFlip("h1"); w.famAttendFlip("h2");
  const before = w.document.getElementById("fam-attend").innerHTML;
  w.famAttendFlip("h3");
  ok("the last 'here' kid can't be flipped — someone has to be here", w.document.getElementById("fam-attend").innerHTML === before && /Someone has to be here/.test(w.toasts[w.toasts.length - 1]), w.toasts);
  ok("a normal card's dialog removes the chips", w.famAttendDlg(w.weekData.tasks[4], false) === false && !w.document.getElementById("fam-attend"));
  w.famAttendDlg(t, false);
  ok("a done copy (Unmark dialog) shows none", w.famAttendDlg(t, true) === false && !w.document.getElementById("fam-attend"));
  const k = world({ rulesData: rules({ fb1: PLAIN }), tasks: mkTasks(), mom: false });
  ok("a kid's device never gets chips", k.famAttendDlg(k.weekData.tasks[0], false) === false && !k.document.getElementById("fam-attend"));
}

console.log("2. Mom's plain 'Done — everyone' (the real dlg-ok handler)");
{
  const w = world({ rulesData: rules({ fb1: PLAIN }), tasks: mkTasks(), extra: OK_FN });
  w.famAttendDlg(w.weekData.tasks[0], false);   // Mom tapped Taylor's copy
  w.famAttendFlip("h2");                          // Andrew wasn't here
  w.setPending("h0"); w.dlgOk();
  ok("Taylor, Makenzie, Caleb finalized — in today's order (tapped card first)", w.log.filter(l => /^finalize/.test(l)).join() === "finalize:h0,finalize:h1,finalize:h3", w.log);
  ok("Andrew's copy is NOT finalized", !w.checked.h2 && !w.histState.h2);
  ok("…and is flagged in memory", w.weekData.tasks[2].famAbsent === true);
  const aw = absentWrites(w);
  ok("ONE targeted write: week1/tasks/h2/famAbsent = true", aw.length === 1 && aw[0][0] === "set" && aw[0][1] === "week1/tasks/h2/famAbsent" && aw[0][2] === true, aw);
  ok("never the whole tasks node", !w.writes.some(x => x[1] === "week1/tasks" && x[0] === "set"));
  ok("the local tasks copy was saved (lastTasksWrite set so our own echo is skipped)", w.store.week1_tasks[2].famAbsent === true && w.lastTasksWrite > 0);
  ok("Mom's toast says who was done and who wasn't here", /Done for Taylor, Makenzie, Caleb · not here: Andrew/.test(w.toasts[w.toasts.length - 1]), w.toasts);
  ok("the dialog closed and the page redrew", w.log.indexOf("close") >= 0 && w.log.indexOf("render") >= 0);
  // dry run: the flag still lands locally, nothing goes to Firebase
  const d = world({ rulesData: rules({ fb1: PLAIN }), tasks: mkTasks(), extra: OK_FN, dry: true });
  d.famAttendDlg(d.weekData.tasks[0], false); d.famAttendFlip("h2"); d.setPending("h0"); d.dlgOk();
  ok("?dryrun=1 → flagged locally, no famAbsent write", d.weekData.tasks[2].famAbsent === true && absentWrites(d).length === 0);
  // the tapped card itself is the absent one
  const w2 = world({ rulesData: rules({ fb1: PLAIN }), tasks: mkTasks(), extra: OK_FN });
  w2.famAttendDlg(w2.weekData.tasks[2], false); w2.famAttendFlip("h2"); w2.setPending("h2"); w2.dlgOk();
  ok("Mom tapped the absent kid's own copy → the others finalize, his is flagged", w2.log.filter(l => /^finalize/.test(l)).join() === "finalize:h0,finalize:h1,finalize:h3" && w2.weekData.tasks[2].famAbsent === true && !w2.checked.h2);
  // re-tap on the flagged copy, flipped back to "here"
  w2.famAttendDlg(w2.weekData.tasks[2], false);
  ok("re-opened on the flagged copy: his chip starts 'not here' (the only open copy)", /✕ Andrew — not here/.test(w2.document.getElementById("fam-attend").innerHTML) && (w2.document.getElementById("fam-attend").innerHTML.match(/famAttendFlip\(/g) || []).length === 1);
  w2.famAttendFlip("h2"); w2.setPending("h2"); w2.dlgOk();
  const rw = absentWrites(w2);
  ok("flipped back and saved → the flag is removed (targeted) and his copy finalizes like today", !w2.weekData.tasks[2].famAbsent && w2.checked.h2 && rw[rw.length - 1][0] === "remove" && rw[rw.length - 1][1] === "week1/tasks/h2/famAbsent", rw);
  // saved without flipping → nothing happens, Mom is told
  const w3 = world({ rulesData: rules({ fb1: PLAIN }), tasks: mkTasks(), extra: OK_FN });
  w3.famAttendDlg(w3.weekData.tasks[0], false); w3.famAttendFlip("h2"); w3.setPending("h0"); w3.dlgOk();
  w3.famAttendDlg(w3.weekData.tasks[2], false); w3.setPending("h2"); const n = w3.log.filter(l => /^finalize/.test(l)).length; w3.dlgOk();
  ok("Done on a 'not here' copy without flipping it → nothing finalized, a toast says to tap the name", w3.log.filter(l => /^finalize/.test(l)).length === n && !w3.checked.h2 && /Andrew marked not here/.test(w3.toasts[w3.toasts.length - 1]), w3.toasts);
}

console.log("2b. no chips touched → byte-identical to today's fan-out");
{
  const run = (extra) => { const w = world({ rulesData: rules({ fb1: PLAIN }), tasks: mkTasks(), extra }); w.famAttendDlg && w.famAttendDlg(w.weekData.tasks[1], false); w.setPending("h1"); w.dlgOk(); return w; };
  const now = run(OK_FN);
  ok("every copy finalized, tapped card first", now.log.filter(l => /^finalize/.test(l)).join() === "finalize:h1,finalize:h0,finalize:h2,finalize:h3", now.log);
  ok("no famAbsent write, no flag", absentWrites(now).length === 0 && !now.weekData.tasks.some(t => t.famAbsent));
  // the same handler with FAMATTEND absent (today's code path): identical log and writes
  const old = world({ rulesData: rules({ fb1: PLAIN }), tasks: mkTasks(), extra: OK_FN, famCode: FAM_ONLY }); old.setPending("h1"); old.dlgOk();
  ok("identical to the handler run WITHOUT the FAMATTEND block (log + writes + checked)", JSON.stringify([old.log, old.writes, old.checked]) === JSON.stringify([now.log, now.writes, now.checked]), [old.log, now.log]);
  if (OK_FN_BASE) {
    const base = world({ rulesData: rules({ fb1: PLAIN }), tasks: mkTasks(), extra: OK_FN_BASE, famCode: FAM_ONLY }); base.setPending("h1"); base.dlgOk();
    ok("identical to today's build's own dlg-ok handler (origin/main or FAM_BASE)", JSON.stringify([base.log, base.writes, base.checked]) === JSON.stringify([now.log, now.writes, now.checked]));
  } else console.log("  (skip) no origin/main and no FAM_BASE — the old-build comparison was not run");
}

console.log("3. Mom's ⭐ screen — points only to present kids (the real famRateOpen → famRateSave)");
{
  const w = world({ rulesData: rules({ fb1: PAYS }), tasks: mkTasks() });
  w.famRateOpen("h0");
  const ov = w.document.getElementById("fam-rate-ov");
  ok("the screen shows a Here chip by every kid", !!ov && (ov.innerHTML.match(/famAttendFlip\(/g) || []).length === 4 && (ov.innerHTML.match(/✓ Here/g) || []).length === 4, ov && ov.innerHTML.slice(0, 200));
  w.famAttendFlip("h2");
  ok("Andrew flipped → his row reads Not here, the screen redrew", /✕ Not here/.test(w.document.getElementById("fam-rate-ov").innerHTML) && (w.document.getElementById("fam-rate-ov").innerHTML.match(/✓ Here/g) || []).length === 3);
  w.famRateSet("h1", 3);
  w.famRateSave();
  ok("paid: Taylor 20, Makenzie 12, Caleb 20 — nothing for Andrew", w.bank.map(b => b.k + ":" + b.p).join() === "taylor:20,makenzie:12,caleb:20", w.bank);
  ok("three copies checked with scores; Andrew's open, no score", w.checked.h0 && w.checked.h1 && w.checked.h3 && !w.checked.h2 && w.histState.h1.score.pts === 12 && !w.histState.h2);
  const aw = absentWrites(w);
  ok("ONE targeted write for Andrew: week1/tasks/h2/famAbsent = true", aw.length === 1 && aw[0].join("|") === "set|week1/tasks/h2/famAbsent|true" && w.weekData.tasks[2].famAbsent === true, aw);
  ok("the once-lock was still taken (same as today)", w.writes.some(x => x[0] === "txn" && x[1] === "week1/famPaid/fb1_hist_monday"));
  ok("Mom's toast names only the paid kids", /Paid: Taylor \+20⭐, Makenzie \+12⭐, Caleb \+20⭐/.test(w.toasts[w.toasts.length - 1]) && !/Andrew/.test(w.toasts[w.toasts.length - 1]), w.toasts);
  // no chips touched → identical to the FAMBLOCK-only path
  const now = world({ rulesData: rules({ fb1: PAYS }), tasks: mkTasks() }); now.famRateOpen("h0"); now.famRateSet("h2", 4); now.famRateSave();
  const old = world({ rulesData: rules({ fb1: PAYS }), tasks: mkTasks(), famCode: FAM_ONLY }); old.famRateOpen("h0"); old.famRateSet("h2", 4); old.famRateSave();
  ok("no chips touched → bank, checked, scores and writes identical to the FAMBLOCK-only path", JSON.stringify([now.bank, now.checked, now.histState, now.writes, now.log]) === JSON.stringify([old.bank, old.checked, old.histState, old.writes, old.log]));
  ok("…and everyone paid", now.bank.length === 4 && !now.weekData.tasks.some(t => t.famAbsent));
}

console.log("4. the ⭐ screen re-opened on the 'not here' copy");
{
  const w = world({ rulesData: rules({ fb1: PAYS }), tasks: mkTasks() });
  w.famRateOpen("h0"); w.famAttendFlip("h2"); w.famRateSave();
  w.famRateOpen("h2");   // Mom taps Andrew's open copy later — he was here after all
  const ov = w.document.getElementById("fam-rate-ov");
  ok("only Andrew is on it, starting 'not here'", (ov.innerHTML.match(/famAttendFlip\(/g) || []).length === 1 && /✕ Not here/.test(ov.innerHTML));
  w.famRateSave();
  ok("saved without flipping → still not here, not paid, told so", !w.checked.h2 && w.bank.length === 3 && /Still marked not here/.test(w.toasts[w.toasts.length - 1]), w.toasts);
  w.famRateOpen("h2"); w.famAttendFlip("h2"); w.famRateSet("h2", 4); w.famRateSave();
  ok("flipped back to Here, ★★★★ → paid 16, checked, the flag removed", w.checked.h2 && w.bank.some(b => b.k === "andrew" && b.p === 16) && !w.weekData.tasks[2].famAbsent && w.histState.h2.score.by === "Mom", w.bank);
  const rw = absentWrites(w);
  ok("the flag came off with a targeted remove", rw[rw.length - 1][0] === "remove" && rw[rw.length - 1][1] === "week1/tasks/h2/famAbsent", rw);
  ok("the once-lock was not taken a second time (no double pay path)", w.writes.filter(x => x[0] === "txn").length === 1);
}

console.log("5. Unmark clears every flag (the real dlg-uncheck handler)");
{
  const w = world({ rulesData: rules({ fb1: PAYS }), tasks: mkTasks(), extra: UN_FN });
  w.famRateOpen("h0"); w.famAttendFlip("h2"); w.famAttendFlip("h3"); w.famRateSave();
  ok("setup: Taylor + Makenzie paid, Andrew + Caleb flagged", w.bank.length === 2 && w.weekData.tasks[2].famAbsent && w.weekData.tasks[3].famAbsent);
  w.setPending("h1"); w.dlgUn();   // Mom unmarks Makenzie's copy
  ok("every copy unchecked, points back off", !w.checked.h0 && !w.checked.h1 && w.bank.length === 0);
  ok("both flags cleared in memory", !w.weekData.tasks.some(t => t.famAbsent));
  const rm = absentWrites(w).filter(x => x[0] === "remove").map(x => x[1]).sort();
  ok("two targeted removes: week1/tasks/h2/famAbsent + h3", rm.join() === "week1/tasks/h2/famAbsent,week1/tasks/h3/famAbsent", rm);
  ok("never the whole tasks node", !w.writes.some(x => x[1] === "week1/tasks" && x[0] === "set"));
  // the plain path too, where only ONE copy was checked (famUncheckSiblings' early return must not skip the clear)
  const p = world({ rulesData: rules({ fb1: { name: "Pair", kids: ["andrew", "makenzie"], days: ["Mon"], at: "lunch", items: [{ key: "hist", name: "History", minutes: 30 }] } }),
    tasks: [{ id: "h1", who: "makenzie", day: "monday", famBlock: "fb1", famItem: "hist" }, { id: "h2", who: "andrew", day: "monday", famBlock: "fb1", famItem: "hist" }], extra: OK_FN + UN_FN });
  p.famAttendDlg(p.weekData.tasks[0], false); p.famAttendFlip("h2"); p.setPending("h1"); p.dlgOk();
  ok("two kids, one not here → one checked, one flagged", p.checked.h1 && !p.checked.h2 && p.weekData.tasks[1].famAbsent === true);
  p.setPending("h1"); p.dlgUn();
  ok("Unmark the only checked copy → the other's flag clears too", !p.checked.h1 && !p.weekData.tasks[1].famAbsent && absentWrites(p).some(x => x[0] === "remove" && x[1] === "week1/tasks/h2/famAbsent"));
}

console.log("6. the block still counts as taught");
{
  const w = world({ rulesData: rules({ fb1: PLAIN }), tasks: mkTasks(), extra: OK_FN + extractFn("famCellDone") + "\nfunction routineDateISO(d){ return d==='monday'?'2026-10-19':''; }\nctx.famCellDone=famCellDone;" });
  w.famAttendDlg(w.weekData.tasks[0], false); w.famAttendFlip("h2"); w.setPending("h0"); w.dlgOk();
  ok("famCellDone: ≥1 checked copy → the Grid cell is ✓ with Andrew not here", w.famCellDone(PLAIN, "fb1", PLAIN.items[0], "2026-10-19") === true);
  const all = world({ rulesData: rules({ fb1: PLAIN }), tasks: mkTasks(), extra: extractFn("famCellDone") + "\nfunction routineDateISO(d){ return d==='monday'?'2026-10-19':''; }\nctx.famCellDone=famCellDone;" });
  ok("…and not before anyone is checked", all.famCellDone(PLAIN, "fb1", PLAIN.items[0], "2026-10-19") === false);
  ok("famCellDone's rule is untouched (no famAbsent in it)", !/famAbsent/.test(extractFn("famCellDone")));
  ok("famCheckPre's first-copy rule is untouched (the place moves once, on the first checked copy)", /first=!sib\.some\(function\(x\)\{ return checked\[x\.id\]; \}\)/.test(extractFn("famCheckPre")) && !/famAbsent/.test(extractFn("famCheckPre")));
}

console.log("7. an absent copy never blocks the kid's day-done (the real rtSchoolworkDone)");
{
  const mk = (tasks, checked) => {
    const ctx = { _todayDay: "monday", _rtSwTodayLay: () => null, getActiveTasks: () => tasks, effectiveDay: t => t.day, checked, claimed: {}, famCelebOf: () => "", famDefs: () => ({}) };
    new Function("ctx", "with(ctx){" + extractFn("rtSchoolworkDone") + "\n" + extractFn("famIsAbsent") + "\nctx.rt=rtSchoolworkDone;}")(ctx);
    return ctx.rt;
  };
  const T = () => [{ id: "a1", who: "andrew", day: "monday", title: "Math" }, { id: "h2", who: "andrew", day: "monday", title: "🏡 History", famBlock: "fb1", famItem: "hist" }];
  ok("Math done, family copy open → NOT done (today's rule)", mk(T(), { a1: 1 })("andrew", "monday") === false);
  const t2 = T(); t2[1].famAbsent = true;
  ok("Math done, family copy 'not here' → done", mk(t2, { a1: 1 })("andrew", "monday") === true);
  ok("…but his own open Math still blocks it", mk(t2, {})("andrew", "monday") === false);
  const t3 = T(); t3[1].famAbsent = true; delete t3[1].famBlock;
  ok("famAbsent on a non-family card means nothing (only a family copy can be 'not here')", mk(t3, { a1: 1 })("andrew", "monday") === false);
  // the celebration suite's own sandbox has no famIsAbsent → the guard keeps today's behaviour
  const ctx = { _todayDay: "monday", _rtSwTodayLay: () => null, getActiveTasks: () => t2, effectiveDay: t => t.day, checked: { a1: 1 }, claimed: {}, famCelebOf: () => "", famDefs: () => ({}) };
  new Function("ctx", "with(ctx){" + extractFn("rtSchoolworkDone") + "\nctx.rt=rtSchoolworkDone;}")(ctx);
  ok("without the FAMATTEND helpers loaded, rtSchoolworkDone behaves as before", ctx.rt("andrew", "monday") === false);
}

console.log("8. the kid's view + structure");
{
  const w = world({ rulesData: rules({ fb1: PAYS }), tasks: mkTasks(), mom: false });
  const t = w.weekData.tasks[2];
  ok("an open family card reads as today (points, Mom checks it off)", /Up to 20 ⭐/.test(w.famRowHTML(t, false, "andrew")) && /Mom checks this off/.test(w.famRowHTML(t, false, "andrew")));
  t.famAbsent = true;
  const mine = w.famRowHTML(t, false, "andrew"), moms = w.famRowHTML(t, false, "all");
  ok("'not here' → the kid's own card: a muted 'You weren’t here for this one'", /You weren’t here for this one/.test(mine) && /var\(--muted\)/.test(mine) && !/⭐/.test(mine) && !/Mom checks/.test(mine), mine);
  ok("…on Mom's view: 'Andrew wasn’t here for this one'", /Andrew wasn’t here for this one/.test(moms), moms);
  ok("the line is plain and kid-safe (no button, no points promise)", !/<button/.test(mine) && !/Up to/.test(mine));
  ok("the kid's tap on their 'wasn't here' copy only says so", w.famAttendKidTap(t) === true && /You weren’t here for this one — nothing to do/.test(w.toasts[w.toasts.length - 1]));
  ok("a kid's tap on a normal open family card is not his to handle (today's lock + toast)", w.famAttendKidTap(w.weekData.tasks[0]) === false);
  w.checked.h2 = "1:30 PM Mon"; w.histState.h2 = { score: { pts: 12, max: 20, rating: 3, by: "Mom" } };
  ok("a done copy is never 'wasn't here' (the flag is cleared before a check — but even stale, done wins)", /earned 12 of 20/.test(w.famRowHTML(t, true, "andrew")));
  // structure
  ok("FAMATTEND block sits immediately after FAMBLOCK_END", src.indexOf("// FAMBLOCK_END\n// FAMATTEND_START") >= 0);
  ok("…and ends before FAMTOGETHER_START", src.indexOf("// FAMATTEND_END") < src.indexOf("// FAMTOGETHER_START") && src.indexOf("// FAMATTEND_END") > src.indexOf("// FAMATTEND_START"));
  const BLOCK = slice("// FAMATTEND_START", "// FAMATTEND_END");
  const outside = src.replace(BLOCK, "");
  const hooks = outside.split("\n").filter(l => /famAttend|famIsAbsent/.test(l));
  ok("ten one-line hooks outside the block (tapTask ×2, dlg-ok, famUncheckSiblings, famRateOpen, famRateRender, famRateSave ×2, famRowHTML, rtSchoolworkDone)", hooks.length === 10, hooks.map(l => l.trim().slice(0, 60)));
  ok("every hook is guarded by typeof (the FAMBLOCK-only tests still run)", hooks.every(l => /typeof fam(Attend\w+|IsAbsent)==="function"/.test(l)));
  ok("the only Firebase write in the block is the famAbsent leaf (set true / remove)", (BLOCK.match(/db\.ref\(/g) || []).length === 1 && /db\.ref\(WK\+"\/tasks\/"\+x\.id\+"\/famAbsent"\)/.test(BLOCK) && /r\.set\(true\); else r\.remove\(\)/.test(BLOCK));
  ok("…behind db&&!_dryRun()", /if\(db&&!_dryRun\(\)\)\{ const r=db\.ref\(WK\+"\/tasks\/"\+x\.id\+"\/famAbsent"\)/.test(BLOCK));
  ok("no generator / packer / Grid / Settings function is touched", !/famDayCards|packAround|famGridHTML|famBlockEditorHTML|famSettingsCardHTML/.test(BLOCK) && !/famAttend|famIsAbsent/.test(extractFn("famDayCards")) && !/famAttend|famIsAbsent/.test(extractFn("famGridHTML")) && !/famAttend|famIsAbsent/.test(extractFn("famBlockEditorHTML")));
  ok("no 🔀 in the block", BLOCK.indexOf("\u{1F500}") < 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
