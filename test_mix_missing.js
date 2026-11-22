// ⚠️ MIXMISSING (her yes 2026-11-21: "warn Mom when a child has weekly cards waiting in a Daily Mix that is not on their schedule").
//   The incident (another family, 2026-11-19): a child had a Daily Mix study session but no schedule card that opens it. Cards on the
//   Mix's rungs belong to the Mix (mstMixOwns) and Mom's drill skips them (mstOwnedIds), so 56 weekly cards showed nowhere.
//   Rule: a Mix session + not on the schedule (no un-paused subject with study === the Mix's sid) + n > 0 cards mstMixOwns owns.
//   Shown: Mom only — a line on the kid's Mastery page (Drills / 📚 Study) and a row in the 🚩 Study sessions list. No writes.
//   Made-up family (kid_a, kid_b, kid_c); the real engine (MST_ENGINE) and the real MSTALERT block run in a sandbox.
//   run: node test_mix_missing.js
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => c ? (pass++, console.log("  ok  - " + n)) : (fail++, console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 400) : "")));

console.log("\n# 0. the block and its hooks");
const si = src.indexOf("// ── MST_ENGINE_START ──"), ei = src.indexOf("// ── MST_ENGINE_END ──");
const bs = src.indexOf("// MIXMISSING_START"), be = src.indexOf("// MIXMISSING_END");
ok("MIXMISSING block present, inside the study engine", bs > si && be > bs && be < ei);
const block = src.slice(bs, be);
ok("block cites her yes and the date", /her yes 2026-11-21/.test(block));
ok("block uses the app's own Mix rule (mstMixOwns), no second copy of the rungs", /mstMixOwns\(sessions,it,ladder\)/.test(block) && !/handOffAt/.test(block.replace(/^\/\/.*$/mg, "")));
ok("no writes in the block (no db / ref / set / update / remove)", !/\bdb\b|\.ref\(|\.set\(|\.update\(|\.remove\(|localStorage|HA_LS/.test(block.replace(/^\/\/.*$/mg, "")));
ok("no family or kid names as code literals", !/lincoln|ellis|lucy|julian|taylor|makenzie|andrew|dewalt/i.test(block.replace(/^\/\/.*$/mg, "")));
const as = src.indexOf("// MSTALERT_START"), ae = src.indexOf("// MSTALERT_END");
const alertSrc = src.slice(as, ae);
ok("🚩 MSTALERT: ⚠️ icon for the new row kind", /mixmissing:"⚠️"/.test(alertSrc));
ok("🚩 MSTALERT: mstAlertsFor pushes a mixmissing row (with the Mix's sid)", /out\.push\(\{kind:"mixmissing",sid:_mm\.sid,text:mixMissingAlertText\(_mm\)\}\)/.test(alertSrc));
const mi = src.indexOf("function _renderMasteryInner(");
const hookAt = src.indexOf("mixMissingHtml(masteryKid)", mi);
ok("Mastery page hook: Drills and Study views only, never the bare Kids' Corner card", hookAt > mi && /if\(!\(typeof mastBare!=="undefined"&&mastBare\)&&\(mastView==="drill"\|\|mastView==="study"\)&&typeof mixMissingHtml==="function"\)/.test(src.slice(hookAt - 200, hookAt)));
ok("hook sits after the Kids' Corner header cut (KC_CARD) and before the Study / Drills views draw", hookAt > src.indexOf("h=h.slice(0,_mbAt)", mi) && hookAt < src.indexOf("if(mastView===\"study\"){", mi));
ok("CW wording the line uses is the app's: ＋ Add subject / The same every day", /addSubject:"＋ Add subject"/.test(src) && /\bdaily:"The same every day"/.test(src));
ok("the add sheet's chip label is 📚 Study session", src.indexOf("'<div class=\"ce-sheet-lbl\">\\u{1F4DA} Study session</div>") > 0);

// ── sandbox: the engine + MSTALERT, with small stubs ──
const capLine = (src.match(/^function cap\(s\)\{[^\n]*\n/m) || [""])[0];
const escLine = (src.match(/^function esc\(s\)\{[^\n]*\n/m) || [""])[0];
ok("cap / esc sliced from the app", capLine.length > 0 && escLine.length > 0);
const stubs = `
var masteryData = {}; var masteryKid = "kid_x"; var currData = { subjects: {} };
var KID_NAME = { kid_a: "Kid A", kid_b: "Kid B", kid_c: "Kid C" };
var MOM = true, TAB = "today", DSCALLS = 0, WRITES = 0;
var tab = "today";
function momHere(){ return MOM; } function momHereCards(){ return MOM && TAB !== "kids"; }
var MAST_TIER_ORDER = ["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"];
var MAST_TIER_INT = {daily:1,every_other_day:2,every_third_day:3,weekly:5,bi_weekly:10,monthly:20,learned:60,graduated:null};
function mastDrillSettings(){ DSCALLS++; return { ladder: ["every_other_day","weekly","bi_weekly","monthly","graduated"] }; }
function mastIsDue(i,pn){ return i.next_due == null || i.next_due <= pn; } function mastIsParked(i){ return !!(i && i.status === "parked"); }
function mastIsNeverDrill(i){ return !!(i && i.kt === "concept"); }
function mastFullBank(){ return {}; }
function gwGetSubjects(k){ return (currData.subjects || {})[k] || {}; }
var CWT = { addSubject: "＋ Add subject", daily: "The same every day" };
function cw(k){ return CWT[k] || k; }
var HA_LS = { getItem(){ return null; }, setItem(){ WRITES++; }, removeItem(){ WRITES++; } };
var db = { ref(){ WRITES++; return { set(){}, update(){}, remove(){} }; } };
function _todayStr(){ return "2026-11-21"; } function mstTodayKey(){ return "20261121"; }
function gwRules(){ return {}; } function scheduleBreakToday(){ return null; } function mdTodayName(){ return "saturday"; }
var DAYS = ["monday","tuesday","wednesday","thursday","friday","saturday"];
function getActiveTasks(){ return []; }
function gwParseDate(s){ const p = s.split("-"); return new Date(+p[0], +p[1]-1, +p[2]); }
function _mastRe(){} function mstNavReset(){}
` + capLine + escLine;
const E = new Function(stubs + src.slice(si, ei) + "\n" + alertSrc + `
return { md: () => masteryData, cd: () => currData, setMom: (m, t) => { MOM = m; TAB = t || "today"; }, calls: () => DSCALLS, writes: () => WRITES,
  mixOnSchedule, mixMissingCount, mixMissingFor, mixMissingHtml, mixMissingLine, mixMissingAlertText, mstSessions, mstOwnedIds, mstOwns, mstPile,
  mstAlertsFor, mstAlertRowHTML, clearMemo: () => { _mixMissMemo = {}; } };`)();

// kid_a: a Mix + one deck session (Mix rungs = weekly, bi_weekly; monthly+ = Mom's drill)
const PN = 230;
function cards() {
  return [
    { id: "a1", subject: "Demo Facts", prompt: "2×3", status: "active", tier: "weekly", next_due: PN },        // Mix, due
    { id: "a2", subject: "Demo Facts", prompt: "2×4", status: "active", tier: "weekly", next_due: PN + 3 },    // Mix, not due yet
    { id: "a3", subject: "Demo Words", prompt: "cat", status: "active", tier: "bi_weekly", next_due: PN - 2 }, // Mix, overdue
    { id: "a4", subject: "Demo Words", prompt: "dog", status: "active", tier: "bi_weekly", next_due: PN + 8 }, // Mix
    { id: "a5", subject: "Demo Words", prompt: "hen", status: "active", tier: "weekly", next_due: PN },        // Mix
    { id: "a6", subject: "Demo Facts", prompt: "3×3", status: "active", tier: "monthly", next_due: PN },       // Mom's drill
    { id: "a7", subject: "Demo Facts", prompt: "3×4", status: "active", tier: "graduated" },                    // drill / done
    { id: "a8", subject: "Demo Facts", prompt: "3×5", status: "active", tier: "every_other_day", next_due: PN }, // the deck session's
    { id: "a9", subject: "Demo Facts", prompt: "3×6", status: "introduction", tier: "daily" },                 // being learned
    { id: "a10", subject: "Demo Words", prompt: "pig", status: "parked", tier: "weekly" },                     // parked → nobody's
    { id: "a11", subject: "Demo Words", prompt: "a big idea", status: "active", tier: "weekly", kt: "concept" }, // never drilled
    { id: "a12", subject: "Other Deck", prompt: "x", status: "active", tier: "weekly" }                         // no session owns its deck
  ];
}
const SES = () => ({
  daily_mix: { name: "Daily Mix", emoji: "🧠", kind: "mix" },
  demo_study: { name: "Demo Study", kind: "deck", decks: ["Demo Facts", "Demo Words"], mixInAt: "weekly", handOffAt: "monthly" }
});
const SUB_MIX = (o) => Object.assign({ display: "Daily Mix", tracking: "daily", allowedDays: ["Mon", "Tue", "Wed", "Thu", "Fri"], timesPerWeek: 5, study: "daily_mix", noCarry: true }, o || {});
const SUB_STUDY = { display: "Demo Study", tracking: "daily", allowedDays: ["Mon", "Wed"], timesPerWeek: 2, study: "demo_study" };
const SUB_MATH = { display: "Math", tracking: "sequential" };
function setKid(kid, items, ses, subs) {
  const md = E.md(); md[kid] = items; md[kid + "_sessions"] = ses; md[kid + "_settings"] = { ladder: ["every_other_day","weekly","bi_weekly","monthly","graduated"] };
  E.cd().subjects[kid] = subs; E.clearMemo();
}

console.log("\n# 1. a Mix with cards, and no Mix on the schedule → the warning, with the right count");
setKid("kid_a", cards(), SES(), { math: SUB_MATH, demo_study: SUB_STUDY });
let r = E.mixMissingFor("kid_a");
ok("warning on: 5 cards waiting (weekly + bi-weekly, due or not; not parked, never-drill, drill, deck or unowned-deck cards)", r && r.n === 5 && r.sid === "daily_mix" && r.name === "Daily Mix", r);
// the count is exactly the cards the Mix takes off Mom's drill (mstOwnedIds minus what the deck session owns)
{
  const ses = E.mstSessions("kid_a"), owned = E.mstOwnedIds("kid_a"), ladder = ["every_other_day","weekly","bi_weekly","monthly","graduated"];
  const deckOwned = cards().filter(i => ses.some(s => E.mstOwns(s, i, ladder))).map(i => i.id);
  const mixOnly = [...owned].filter(id => deckOwned.indexOf(id) < 0).sort();
  ok("count = the cards mstOwnedIds hides from the drill for the Mix (a1 a2 a3 a4 a5)", r && mixOnly.join(" ") === "a1 a2 a3 a4 a5" && mixOnly.length === r.n, mixOnly);
  const pile = E.mstPile("kid_a", "daily_mix", PN, null).reviews.map(i => i.id).sort();
  ok("every card today's Mix pile would show is in the count (due today: a1 a3 a5)", pile.join(" ") === "a1 a3 a5" && pile.every(id => mixOnly.indexOf(id) >= 0), pile);
}

console.log("\n# 2. the Mix on the schedule → nothing");
setKid("kid_a", cards(), SES(), { math: SUB_MATH, demo_study: SUB_STUDY, daily_mix: SUB_MIX() });
ok("an un-paused subject opens the Mix → null", E.mixMissingFor("kid_a") === null);
ok("its cards are never looked at (the ladder is not even read)", (() => { const c = E.calls(); E.clearMemo(); E.mixMissingFor("kid_a"); return E.calls() === c; })());
setKid("kid_a", cards(), SES(), { mix_on_mwf: SUB_MIX({ allowedDays: ["Mon", "Wed", "Fri"], timesPerWeek: 3 }) });
ok("on only some days (Mon Wed Fri) still counts as scheduled", E.mixMissingFor("kid_a") === null);
setKid("kid_a", cards(), SES(), { mix_any: SUB_MIX({ allowedDays: [], days: "", timesPerWeek: undefined }) });
ok("no days lit (= any school day) counts as scheduled", E.mixMissingFor("kid_a") === null);

console.log("\n# 3. a paused / 0-a-week / other-session link counts as missing");
setKid("kid_a", cards(), SES(), { daily_mix: SUB_MIX({ paused: true }) });
r = E.mixMissingFor("kid_a");
ok("⏸ paused Mix subject → warning on (5)", r && r.n === 5, r);
setKid("kid_a", cards(), SES(), { daily_mix: SUB_MIX({ timesPerWeek: 0 }) });
ok("0 times a week → warning on", (E.mixMissingFor("kid_a") || {}).n === 5);
setKid("kid_a", cards(), SES(), { daily_mix: SUB_MIX({ timesPerWeek: "0" }) });
ok("\"0\" times a week (stored as text) → warning on", (E.mixMissingFor("kid_a") || {}).n === 5);
setKid("kid_a", cards(), SES(), { demo_study: SUB_STUDY, fake: { display: "Mix", study: "some_other_mix" } });
ok("a subject linked to a different session id → warning on", (E.mixMissingFor("kid_a") || {}).n === 5);

console.log("\n# 4. no Mix-owned cards, or no Mix at all → nothing");
setKid("kid_b", cards().filter(i => !/^a[1-5]$/.test(i.id)), SES(), {});
ok("a Mix session with no cards on its rungs → null", E.mixMissingFor("kid_b") === null);
{ const s = SES(); delete s.daily_mix; setKid("kid_b", cards(), s, {}); }
ok("no Mix session (the drill keeps those cards) → null", E.mixMissingFor("kid_b") === null);
ok("…and those weekly cards really are the drill's (mstOwnedIds without a Mix leaves them)", !E.mstOwnedIds("kid_b").has("a1"));
setKid("kid_b", cards(), null, {});
ok("no sessions at all → null", E.mixMissingFor("kid_b") === null);
setKid("kid_b", null, SES(), {});
ok("a Mix but no cards loaded → null", E.mixMissingFor("kid_b") === null);
ok("unknown kid → null, no throw", E.mixMissingFor("kid_zz") === null && E.mixMissingFor("") === null);

console.log("\n# 5. what Mom sees — and only Mom");
setKid("kid_a", cards(), SES(), { math: SUB_MATH });
E.setMom(true);
let h = E.mixMissingHtml("kid_a");
const LINE = "⚠ 5 cards are waiting for a Daily Mix, but Kid A has no Daily Mix on the schedule. Add it: School ▸ Curriculum ▸ ＋ Add subject ▸ The same every day ▸ 📚 Study session ▸ Daily Mix.";
ok("the Mastery page line, word for word", h.indexOf(LINE) > 0 && /class="mix-missing"/.test(h), h);
ok("the kid's name comes from the app's name helper (KID_NAME via cap)", h.indexOf("Kid A has no") > 0);
E.setMom(false);
ok("not Mom (a kid's device / Dad's link without Mom mode) → nothing", E.mixMissingHtml("kid_a") === "");
E.setMom(true, "kids");
ok("Mom mode on, but the Kids' Corner tab → nothing", E.mixMissingHtml("kid_a") === "");
E.setMom(true);
ok("a kid with the Mix scheduled → nothing", (setKid("kid_c", cards(), SES(), { daily_mix: SUB_MIX() }), E.mixMissingHtml("kid_c") === ""));
setKid("kid_c", [cards()[0]], SES(), {});
ok("one card → \"1 card is waiting\"", E.mixMissingHtml("kid_c").indexOf("⚠ 1 card is waiting for a Daily Mix, but Kid C has no Daily Mix") > 0);
{ const s = SES(); s.daily_mix.name = "Review <Mix>"; setKid("kid_c", cards(), s, {}); }
ok("a renamed Mix is named, and the line is escaped", (h = E.mixMissingHtml("kid_c")).indexOf("waiting for a Review &lt;Mix&gt;") > 0 && h.indexOf("<Mix>") < 0, h);

console.log("\n# 6. the 🚩 Study sessions — needs a look row (MSTALERT)");
setKid("kid_a", cards(), SES(), { math: SUB_MATH });
let al = E.mstAlertsFor("kid_a", 9 * 60);
let row = al.find(a => a.kind === "mixmissing");
ok("one ⚠️ row for the kid, carrying the Mix's sid (Open ↗ goes to the kid's 📚 Study page)", al.filter(a => a.kind === "mixmissing").length === 1 && row.sid === "daily_mix", al);
ok("row text", row && row.text === "Daily Mix: 5 cards waiting, but it is not on the schedule. Add it: School ▸ Curriculum ▸ ＋ Add subject ▸ The same every day ▸ 📚 Study session ▸ Daily Mix.", row && row.text);
ok("🔴 Now's short line reads \"⚠️ Daily Mix\" (its text before the first \": \")", row && String(row.text).split(": ")[0] === "Daily Mix");
const rh = E.mstAlertRowHTML(Object.assign({ kid: "kid_a" }, row), 0);   // mstAlertsAll adds the kid
ok("the row draws with the kid's name, the ⚠️ icon and no ↩ Send back", rh.indexOf("⚠️ <b>Kid A</b> — Daily Mix: 5 cards waiting") > 0 && rh.indexOf("mstSendBack") < 0, rh);
setKid("kid_a", cards(), SES(), { daily_mix: SUB_MIX() });
ok("Mix scheduled → no row", !E.mstAlertsFor("kid_a", 9 * 60).some(a => a.kind === "mixmissing"));

console.log("\n# 7. cheap on redraw (memo) and nothing written");
setKid("kid_a", cards(), SES(), {});
const c0 = E.calls(); const r1 = E.mixMissingFor("kid_a"); const c1 = E.calls(); const r2 = E.mixMissingFor("kid_a");
ok("second draw with the same data reuses the answer (no second pass over the cards)", r1 === r2 && E.calls() === c1 && c1 === c0 + 1);
E.md().kid_a = cards().slice(0, 3);
ok("new cards from the database (a new object) → counted again (3)", (E.mixMissingFor("kid_a") || {}).n === 3);
E.cd().subjects.kid_a = { daily_mix: SUB_MIX() };
ok("Mom adds the Mix subject (a new subjects object) → the warning goes at once", E.mixMissingFor("kid_a") === null);
ok("no database or storage writes anywhere above", E.writes() === 0);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
