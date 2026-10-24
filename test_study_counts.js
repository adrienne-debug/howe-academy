/*
 * Node tests — 📚 STUDYCOUNTS (F3 of PLAN_learning_system, her yes 2026-10-24): study sittings count everywhere the drill
 * history did — Scores, the Weekly report, sprint readiness (≥ 90% untimed), the notebook's 🔁 review flags — and a
 * spelling miss in a study sitting reaches Word Workout. "shown" never counts. Runs the REAL code sliced from index.html.
 *   run:  node test_study_counts.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
const SC = cut("// STUDYCOUNTS_START", "// STUDYCOUNTS_END"), WW = cut("// WORDWORKOUT_START", "// WORDWORKOUT_END");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
function world(extra, code) {
  const ctx = Object.assign({ console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, HA_LS: { setItem: () => {} } }, extra || {});
  vm.createContext(ctx); vm.runInContext(SC + "\n" + WW + "\n" + (code || ""), ctx); return ctx;
}
// Fixtures: Lincoln-shaped logs. Drill on 10/20 (two cards), study on 10/20 (Daily Mix) and 10/21 (German, all shown).
const HIST = () => ({ lincoln: {
  "20261020": { date: "2026-10-20", printNum: 60, items: [{ id: "a", prompt: "they", result: "c" }, { id: "b", prompt: "said", result: "c" }, { id: "n", prompt: "new", result: "shown" }] } } });
const STUDY = () => ({ lincoln: {
  daily_mix: { "20261020": { date: "20261020", printNum: 60, total: 4, secs: 300, sits: [{ secs: 300, total: 4 }],
    items: [{ id: "a", name: "they", deck: "AAS Words", result: "m" }, { id: "c", name: "der Hund", deck: "German", result: "c" }, { id: "d", name: "Paris", deck: "World Geography", result: "~" }, { id: "s", name: "neu", deck: "German", result: "shown" }] } },
  german: { "20261021": { date: "20261021", printNum: 61, total: 3, secs: 600, sits: [{ secs: 600, total: 3 }, { secs: 9000, total: 0 }],
    items: [{ id: "g1", name: "die Katze", deck: "German", result: "shown" }, { id: "g2", name: "das Haus", deck: "German", result: "shown" }, { id: "g3", name: "der Baum", deck: "German", result: "shown" }] } } } });

console.log("── the shared helper merges drill history + study logs ──");
{
  const c = world();
  const d = c.scGradedDays("lincoln", HIST(), STUDY());
  ok("both days are there (drill day + study-only day)", Object.keys(d).sort().join() === "20261020,20261021", Object.keys(d));
  const d20 = d["20261020"], ids = d20.items.map(x => x.id + ":" + x.result + ":" + x.src);
  ok("graded only — shown cards never appear", !d20.items.some(x => x.result === "shown") && d["20261021"].items.length === 0, ids);
  ok("a card graded in BOTH on one day counts once, the miss wins", d20.items.filter(x => x.id === "a").length === 1 && d20.items.find(x => x.id === "a").result === "m" && d20.items.find(x => x.id === "a").src === "both", ids);
  ok("drill-only and study-only cards keep their source", d20.items.find(x => x.id === "b").src === "drill" && d20.items.find(x => x.id === "c").src === "study", ids);
  ok("each item keeps its day key + printNum (+ sid for study)", d20.items.find(x => x.id === "c").day === "20261020" && d20.items.find(x => x.id === "c").printNum === 60 && d20.items.find(x => x.id === "c").sid === "daily_mix");
  ok("a study-only day still counts as a day (shown only → no items)", d["20261021"].study.length === 1 && d["20261021"].drill === null);
  const h = c.scHistoryFor(HIST(), "lincoln", {});
  ok("no study log → the drill history exactly as it was (same object)", (() => { const H = HIST(); return c.scHistoryFor(H, "lincoln", {}) === H.lincoln; })());
  ok("hand-built history without a studyLog arg stays drill-only (tests stay honest)", (() => { const H = HIST(); return c.scHistoryFor(H, "lincoln") === H.lincoln; })());
  const c2 = world({ masteryData: { history: HIST(), studyLog: STUDY() } });
  const live = c2.scHistoryFor(c2.masteryData.history, "lincoln");
  ok("the live history picks up the live study log", !!live["20261020"] && live["20261020"].items.length === 4, live);
  ok("…but a study day of only shown cards isn't a day there (it would push real misses out of the notebook's 6-day window)", !live["20261021"]);
  ok("memoized: same inputs → same object", c2.scHistoryFor(c2.masteryData.history, "lincoln") === live);
  c2.masteryData.studyLog.lincoln.science = { "20261022": { date: "20261022", items: [{ id: "z", name: "atom", deck: "Science", result: "c" }] } };
  ok("a new sitting busts the memo", !!c2.scHistoryFor(c2.masteryData.history, "lincoln")["20261022"]);
}

console.log("── sprint readiness (≥ 90% untimed) counts study grades ──");
{
  const CODE = src.match(/const MAST_TIER_ORDER=\[[^\]]*\];/)[0] + "\n" + ["mastTierAtLeast", "mastSprintSwitch", "mastGateState", "mastUntimedAccuracy", "mastSprintPool"].map(slice).join("\n")
    + "\nfunction mastKnowledgeType(){ return 'fact_association'; }";
  const study = { lincoln: { daily_mix: {} } };
  ["20261001", "20261002", "20261003", "20261004", "20261005"].forEach(k => { study.lincoln.daily_mix[k] = { date: k, items: [{ id: "w", name: "word", deck: "AAS Words", result: "c" }, { id: "x", name: "neu", deck: "German", result: "shown" }] }; });
  const md = { history: { lincoln: {} }, studyLog: study, lincoln: [{ id: "w", subject: "AAS Words", tier: "daily", status: "active" }, { id: "x", subject: "German", tier: "daily", status: "active" }] };
  const c = world({ masteryData: md }, CODE);
  ok("before: study-only work → no accuracy signal from the drill alone", c.mastUntimedAccuracy(md.history, "lincoln", "w", { studyLog: null }) === null);
  ok("after: 5 right in study sittings → 100% untimed", c.mastUntimedAccuracy(md.history, "lincoln", "w") === 1);
  ok("shown-only card still has no signal", c.mastUntimedAccuracy(md.history, "lincoln", "x") === null);
  const pool = c.mastSprintPool("lincoln", { history: md.history, settings: { sprint_default: true, gate_tier: "weekly" } });
  ok("the study-graded card is sprint-ready; the shown one isn't", pool.map(i => i.id).join() === "w", pool.map(i => i.id));
  const H = { lincoln: { "20261001": { items: [{ id: "q", result: "c" }, { id: "q", result: "m" }] } } };
  ok("a drill-only kid reads exactly as before", c.mastUntimedAccuracy(H, "lincoln", "q") === 0.5);
}

console.log("── notebook 🔁 review flags count study misses (real haNbContext code) ──");
{
  const hn = slice("haNbContext"), a = hn.indexOf("  let mItems=(mastery[kid]||[]);"), b = hn.indexOf("  }catch(e){}", a) + "  }catch(e){}".length;
  const BODY = hn.slice(a, b);
  ok("the notebook block reads through scHistoryFor", /scHistoryFor\(masteryData\.history,kid\)/.test(BODY));
  const run = md => { const c = world({ masteryData: md, mastery: { lincoln: [{ id: "a" }, { id: "c" }, { id: "d" }, { id: "s" }] }, kid: "lincoln" },
    "var __out=(function(){ " + BODY + " return mItems; })();"); const o = {}; c.__out.forEach(i => o[i.id] = i.recentMiss); return o; };
  const after = run({ history: HIST(), studyLog: STUDY() });
  ok("a miss in a study sitting flags the card (✗ and ~)", after.a === 1 && after.d === 1, after);
  ok("right / shown in study never flags", after.c === 0 && after.s === 0, after);
  const before = run({ history: HIST(), studyLog: {} });
  ok("with no study log it's the drill alone (nothing missed there)", before.a === 0 && before.d === 0, before);
}

console.log("── Scores shows study sittings, labeled ──");
{
  const md = { history: HIST(), studyLog: STUDY(), lincoln_sessions: { daily_mix: { name: "Daily Mix" }, german: { name: "German" } } };
  const c = world({ masteryData: md, MST_SESSION_DEFAULTS: {}, mstPatternClean: x => x }, slice("mstSessions"));
  const es = c.scScoreEntries("lincoln");
  const mix = es.find(e => e.sid === "daily_mix"), ger = es.find(e => e.sid === "german");
  ok("one score card per study sitting-day", es.length === 2);
  ok("study card in the drill's shape: dashed date, counts, %", mix.date === "2026-10-20" && mix.correct === 1 && mix.miss === 1 && mix.close === 1 && mix.shown === 1 && mix.scored === 3 && mix.pct === 33, mix);
  ok("items carry prompt (from name) + result for the item list", mix.items.find(i => i.id === "c").prompt === "der Hund");
  ok("all-shown sitting → scored 0 (shows 📘 Learning, stays off the % chart)", ger.scored === 0 && ger.shown === 3);
  ok("tagged 📚 Study · <session name> vs 🎯 Drill", /Study · Daily Mix/.test(c.scScoreTag(mix)) && /Drill/.test(c.scScoreTag({ date: "2026-10-20" })));
  const view = cut('if(mastView==="scores"){', "// 🎯 Match game results");
  const vi = src.indexOf('if(mastView==="scores"){'), rest = src.slice(src.indexOf("if(!entries.length){", vi), src.indexOf("el.innerHTML=h;", vi));
  ok("Scores view merges scScoreEntries into its entries", /scScoreEntries\(masteryKid\)/.test(view));
  ok("study cards get no 🗑 Delete (that deletes drill history)", /if\(!e\.study\) h\+='<button onclick="event\.stopPropagation\(\);mastDeleteScore/.test(rest));
  ok("study cards get no ⏱ interrupted tap (drill-only toggle)", /if\(_ts\.length&&e\.study\)/.test(rest) && /else if\(_ts\.length\) h\+='<span onclick="event\.stopPropagation\(\);mastToggleBad/.test(rest));
  ok("the tag shows only when the kid has both kinds", /_scAny&&typeof scScoreTag/.test(rest));
}

console.log("── Weekly report: a short Study sessions line ──");
{
  const c = world();
  const o = c.scStudyWeek(STUDY(), "lincoln", { from: "20261019", to: "20261023" });
  ok("sittings (each sit), days, cards", o.sittings === 3 && o.days === 2 && o.cards === 7, o);
  ok("accuracy over graded only (✓1 of ✗/~/✓ 3), shown never counts", o.graded === 3 && o.correct === 1 && o.pct === 33, o);
  ok("a sitting left open over 2 h isn't counted as minutes", o.minutes === 15, o);
  ok("outside the week → nothing", c.scStudyWeek(STUDY(), "lincoln", { from: "20261026", to: "20261030" }).sittings === 0);
  const line = c.scStudyWeekLine(o);
  ok("the line reads plainly", line === "📚 Study sessions — 3 sittings on 2 days · 7 cards · 15 min · 33% right of 3 graded", line);
  const allShown = { lincoln: { german: STUDY().lincoln.german } };
  ok("all-shown week says so instead of a %", /none graded yet/.test(c.scStudyWeekLine(c.scStudyWeek(allShown, "lincoln", { from: "20261019", to: "20261023" }))));
  const rh = slice("renderHistoryReport");
  ok("the report view adds the line per kid from the live study log, by the report's own week range", /scStudyWeek\(\(\(typeof masteryData!=="undefined"&&masteryData\)\|\|\{\}\)\.studyLog,k,rep\.range\)/.test(rh));
  ok("the frozen report (digest/report) is untouched — the DIGEST block doesn't reference study logs", !/studyLog|scStudy/.test(cut("// DIGEST_START", "// DIGEST_END")));
}

console.log("── Word Workout: a study spelling miss counts (real _mstSaveInner) ──");
function saveWorld(dry, scores, items) {
  const writes = [];
  const rawDb = { ref: p => ({ set: v => writes.push(["set", p, v]), update: v => writes.push(["update", p, v]), remove: () => writes.push(["remove", p]) }) };
  let db = rawDb;
  if (dry) {   // the app's real dry-run patch (index.html, at Firebase init)
    const patch = cut("        const _origRef=db.ref.bind(db);", "        console.warn(\"⚠️ HA DRY-RUN active");
    const pc = { db: rawDb, Object, Math, Promise }; vm.createContext(pc); vm.runInContext(patch, pc); db = pc.db;
  }
  const md = { lincoln: items, studyLog: {}, printLog: [] };
  const CODE = slice("_mstSaveInner") + "\nvar __run=function(){ _mstSaveInner(); };";
  const c = world({ masteryKid: "lincoln", mstSid: "daily_mix", mstState: {}, masteryData: md, db,
    mastGetPrintNum: () => 60, mstOutcomes: () => ({ scores: scores, shownIds: [], shownNew: [] }), mstTodayKey: () => "20261024", mstDateStr: () => "2026-10-24",
    mstLogGet: () => null, mastMintFromBank: () => null, mstBeforeSnap: () => ({}), mastDrillSettings: () => ({ ladder: ["daily"] }),
    mastApplyScores: (its, due) => ({ touched: due.map(d => its.find(i => i.id === d.id)).filter(Boolean), minted: [], changes: due.length }),
    mstSessions: () => [], mstStartTs: null, mastPrintLogAppend: () => {}, mstNavReset: () => {}, mstClearPersist: () => {}, _mastRe: () => {},
    mstDone: null, mstFlipped: false, wwToday: undefined }, CODE);
  c.__run(); return { writes, items: md.lincoln, c };
}
{
  const W = (id, subject, ww) => Object.assign({ id, subject, prompt: id, status: "active", tier: "weekly" }, ww ? { ww } : {});
  const s = saveWorld(false, { they: "m", hund: "m", said: "c", neu: "shown" },
    [W("they", "AAS Words", { m: 1, d: "2026-10-01", r: [] }), W("hund", "German"), W("said", "Spelling"), W("neu", "AAS Words")]);
  const up = s.writes.find(w => w[0] === "update" && w[1] === "mastery/lincoln");
  const they = s.items.find(i => i.id === "they");
  ok("a spelling miss in a sitting is a Word Workout miss day (2nd day → in the workout)", they.ww && they.ww.m === 2 && they.ww.on === true, they.ww);
  ok("…written on the save's targeted update: mastery/lincoln/<i>/ww", up && up[2]["0/ww"] && up[2]["0/ww"].on === true, up && Object.keys(up[2]));
  ok("a German miss never touches Word Workout", !s.items.find(i => i.id === "hund").ww && !("1/ww" in up[2]));
  ok("a right answer in a sitting adds nothing (misses only)", !s.items.find(i => i.id === "said").ww);
  ok("shown never counts", !s.items.find(i => i.id === "neu").ww);
  ok("no whole-node set of the card list", !s.writes.some(w => w[0] === "set" && w[1] === "mastery/lincoln"));
  const d = saveWorld(true, { they: "m" }, [W("they", "AAS Words", { m: 1, d: "2026-10-01", r: [] })]);
  ok("?dryrun=1 → the study save writes nothing at all", d.writes.length === 0, d.writes);
  const h = d.c.scStudyWw([W("x", "SpellingYouSee")], { x: "m" }, [], "2026-10-24");
  ok("SpellingYouSee counts too (same WW_DECKS list)", h === 1);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
