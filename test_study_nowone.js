/*
 * 📚 STUDY_NOWONE — one study row in 🔴 Now (her ask 2026-11-11: "Could we do something similar for study sessions and study
 * sittings today? Because it's very busy as well on that same area of my page."). Her picks: ONE combined row · Open › → Home Base
 * ▸ HQ · all three families · ⏱ Timed cards / 🩺 Check-ups unchanged · all clear → a quiet gray row, no red light.
 *   (1) the row: red light, "📚 Study needs you · N", each kid's items in one short line, Open › — gray "all looked at" when
 *       nothing waits, nothing when there is no flag and no sitting today
 *   (2) Mom's 🔴 Now: the same nowN as main's two study lines, the per-row lists gone; ⏱ / 🩺 rows still drawn
 *   (3) Open › → Home Base ▸ HQ (mpGoto("hq")); HQ shows the full 🕒 Study sittings today list under the 🚩 box
 *   (4) not changed: MSTALERT + SREVIEW (what's flagged / counted), hbAlertItems, the schedule blocks; nothing is written
 *                                                                                                run: node test_study_nowone.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm"), cp = require("child_process");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 700) + ")" : "")); } };
const cut = (a, b, s) => { s = s || src; const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error("missing " + a); return s.slice(i, j + b.length); };
function sliceFn(name, s) { s = s || src; const i = s.indexOf("function " + name + "("); if (i < 0) throw new Error("not found: " + name); let d = 0; for (let k = s.indexOf("{", i); k < s.length; k++) { if (s[k] === "{") d++; else if (s[k] === "}") { d--; if (d === 0) return s.slice(i, k + 1); } } throw new Error("unbalanced: " + name); }

const CODE = cut("// MSTALERT_START", "// SREVIEW_END");
const ONE = cut("// STUDY_NOWONE_START", "// STUDY_NOWONE_END");
const TODAY = "2026-11-04", KEY = "20261104";
const SESS = { mix: { name: "Mix", emoji: "🧠", kind: "mix", who: "solo" }, words: { name: "Words", emoji: "📚", kind: "deck" } };

function world(md) {
  const writes = [], gone = [];
  const ref = p => ({ set: () => writes.push(["set", p]), update: () => writes.push(["update", p]), remove: () => writes.push(["remove", p]) });
  const ctx = { console, JSON, Object, Array, Math, Set, String, Date, isFinite, parseFloat,
    masteryData: md, ROSTER: ["kida", "kidb"], DAYS: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    _todayStr: () => TODAY, mstTodayKey: () => KEY, mdTodayName: () => "wednesday",
    gwParseDate: s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); },
    gwRules: () => ({ schoolEnd: 16 * 60 + 15 }), scheduleBreakToday: () => null, getActiveTasks: () => [], gwGetSubjects: () => ({}),
    mastIsParked: () => false, esc: s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"), cap: s => s[0].toUpperCase() + s.slice(1),
    mstSessions: kid => Object.entries(md[kid + "_sessions"] || {}).map(([sid, r]) => Object.assign({ sid, kind: "deck", who: "solo" }, r)),
    db: { ref }, _dryRun: () => false, momHere: () => true, HA_LS: { setItem: () => {} }, renderAll: () => {}, _kioskD: () => false,
    mpGoto: v => gone.push(v), _writes: writes, _gone: gone };
  vm.createContext(ctx); vm.runInContext(CODE + "\n" + ONE, ctx);
  return ctx;
}
// kida: Mix 60 cards in 97 s (⚡ too fast) + a 214 s redo sitting + Words; kidb: Words 8 cards in 200 s.
const busy = () => ({ kida_sessions: SESS, kidb_sessions: { words: SESS.words }, kida: [], kidb: [],
  studyLog: { kida: { mix: { [KEY]: { total: 120, secs: 311, sits: [{ secs: 97, total: 60 }, { secs: 214, total: 60 }] } },
                      words: { [KEY]: { total: 10, secs: 60, sits: [{ secs: 60, total: 10 }] } } },
              kidb: { words: { [KEY]: { total: 8, secs: 200, sits: [{ secs: 200, total: 8 }] } } } } });
const judgedAll = () => { const m = busy(); const J = { by: "mom", at: 1, verdict: "ok" };
  [m.studyLog.kida.mix[KEY], m.studyLog.kida.words[KEY], m.studyLog.kidb.words[KEY]].forEach(e => e.sits.forEach(s => s.judged = J));
  m.studyLog.kida.mix[KEY].sits[0].secs = 300;   // no ⚡ flag either
  return m; };

console.log("── (1) the one row ──");
{ const c = world(busy()); const al = c.mstAlertsAll(), rows = c.srRows(); const H = c.studyNowOneHTML(al, rows);
  const want = al.filter(a => a.kind !== "redone").length + rows.filter(r => !r.back && !r.judged).length;
  ok("fixture: a ⚡ flag and four sittings to judge", al.some(a => a.kind === "fast") && rows.length === 4, [al.map(a => a.kind), rows.length]);
  ok("ONE row: 📚 Study needs you · N (flags + sittings to judge)", (H.match(/class="study-nowone"/g) || []).length === 1 && H.includes("📚 Study needs you · " + want + "<"), H);
  ok("…a red light", /class="study-light"/.test(H) && /background:#dc2626/.test(H));
  ok("…each kid's items in one short line", H.includes("Kida ⚡ Mix, 🕒 3 to judge · Kidb 🕒 1 to judge"), H);
  ok("…no per-row buttons (those live on HQ)", !/srOk\(|srBack\(|mstSendBack\(|mstAlertOpen\(/.test(H), H);
  ok("…Open › and the whole row run studyNowOpen()", /class="study-nowone" onclick="studyNowOpen\(\)"/.test(H) && /event\.stopPropagation\(\);studyNowOpen\(\)"[^>]*>Open ›</.test(H), H);
  const G = world(judgedAll()); const GH = G.studyNowOneHTML(G.mstAlertsAll(), G.srRows());
  ok("all judged → quiet gray '📚 Study today · all looked at', no red light", /📚 Study today · all looked at/.test(GH) && !/study-light|#dc2626|needs you/.test(GH) && /studyNowOpen\(\)/.test(GH), GH);
  const E = world({}); ok("no flag and no sitting → nothing", E.studyNowOneHTML(E.mstAlertsAll(), E.srRows()) === "" && E.studyNowOneHTML([], []) === "");
  ok("a ✅ redone flag alone reads as all looked at", /all looked at/.test(c.studyNowOneHTML([{ kid: "kida", kind: "redone", text: "🧠 Mix: redone" }], [])));
  ok("names are escaped", c.studyNowOneHTML([{ kid: "kida", kind: "fast", text: "🧠 X<i>: 60 cards" }], []).includes("⚡ X&lt;i>"));
}

console.log("── (2) Mom's 🔴 Now: same nowN as main ──");
let base = ""; try { base = cp.execSync("git show origin/main:index.html", { cwd: __dirname, encoding: "utf8", maxBuffer: 1 << 28 }); } catch (e) {}
const nowLines = s => { const md = sliceFn("renderMomsDay", s), i = md.indexOf("try{ const _ap=_momApprovalsHTML();"), j = md.indexOf("try{ const _mm=mmAlertsNowHTML();"); return md.slice(md.indexOf("\n", i) + 1, j); };
const runNow = (lines, md) => { const c = world(md); c.mmAlertsNowHTML = () => ({ n: 2, html: "<MM/>" }); return vm.runInContext("(function(){ let nowN=0, h=''; " + lines + " try{ const _mm=mmAlertsNowHTML(); nowN+=_mm.n; h+=_mm.html; }catch(e){} return {nowN:nowN,h:h}; })()", c); };
{ const L = nowLines(src);
  ok("🔴 Now's study lines draw studyNowOneHTML", /studyNowOneHTML\(_stA\|\|\[\],_stR\|\|\[\]\)/.test(L) && /nowN\+=_sa\.n/.test(L) && /nowN\+=_sr\.n/.test(L), L);
  if (base) { const LM = nowLines(base);
    [["busy", busy], ["all judged", judgedAll], ["no study data", () => ({})]].forEach(([nm, f]) => {
      const a = runNow(L, f()), b = runNow(LM, f());
      ok(nm + ": nowN is main's (" + b.nowN + ")", a.nowN === b.nowN, [a.nowN, b.nowN]);
    });
    const a = runNow(L, busy()), b = runNow(LM, busy());
    ok("busy: main drew the two lists, this draws one row instead", /Study sittings today/.test(b.h) && !/Study sittings today|Study sessions — needs a look/.test(a.h) && (a.h.match(/class="study-nowone"/g) || []).length === 1, a.h.slice(0, 300));
    ok("⏱ Timed cards / 🩺 Check-ups still drawn as before", a.h.endsWith("<MM/>") && b.h.endsWith("<MM/>"));
    ok("no study data: nothing drawn, as on main", runNow(L, {}).h === "<MM/>" && runNow(LM, {}).h === "<MM/>");
  } else console.log("  (skip — no origin/main to compare)");
}

console.log("── (3) Open › → Home Base ▸ HQ, the full list there ──");
{ const c = world(busy()); c.studyNowOpen(); ok("Open › → mpGoto('hq')", JSON.stringify(c._gone) === '["hq"]', c._gone);
  const S = c.studySitsHQHTML(), R = c.srNowHTML();
  ok("HQ box holds srNowHTML's full list, unchanged", S.includes(R.html) && /class="study-sits-hq"/.test(S) && (S.match(/srOk\(/g) || []).length === 4);
  ok("no sittings today → no HQ box", world({}).studySitsHQHTML() === "");
  const hq = sliceFn("renderMomHQ");
  ok("Mom HQ: 🕒 list right under the 🚩 Study sessions box", /try\{ h\+=mstAlertsHQHTML\(\); \}catch\(e\)\{\}[^\n]*\n  try\{ if\(typeof studySitsHQHTML==="function"\) h\+=studySitsHQHTML\(\); \}catch\(e\)\{\}/.test(hq));
  ok("…for every family (no family gate on it)", !/familyId|famId|FAMILY_ID/.test(ONE));
}

console.log("── (4) not changed; nothing written ──");
{ const c = world(busy()); c.studyNowOneHTML(c.mstAlertsAll(), c.srRows()); c.studySitsHQHTML(); c.studyNowOpen();
  ok("no Firebase write from any of it", c._writes.length === 0, c._writes);
  ok("no db / storage in the block", !/db\.ref|HA_LS|\.set\(|\.update\(/.test(ONE));
  if (base) {
    ok("MSTALERT + SREVIEW (what's flagged, what's counted, the HQ 🚩 box) are byte-for-byte main's", cut("// MSTALERT_START", "// SREVIEW_END", base) === CODE);
    ok("the Home Base badge list (hbAlertItems) is byte-for-byte main's", sliceFn("hbAlertItems", base) === sliceFn("hbAlertItems"));
    ok("⏱ MINMINUTES Now rows (mmAlertsNowHTML) are main's", sliceFn("mmAlertsNowHTML", base) === sliceFn("mmAlertsNowHTML"));
    ["REPROJ", "MOMLOOP", "DAYSTART", "SCHOOLEND"].forEach(k => ok("schedule block " + k + " is byte-for-byte main's", cut("// " + k + "_START", "// " + k + "_END", base) === cut("// " + k + "_START", "// " + k + "_END")));
    const mdB = sliceFn("renderMomsDay", base), mdN = sliceFn("renderMomsDay");
    ok("renderMomsDay changed only in the study lines", mdN.replace(nowLines(src), "") === mdB.replace(nowLines(base), ""));
  } else console.log("  (skip — no origin/main to compare)");
}

console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
