/*
 * Node tests — 🚩 study-session alerts for Mom (her ask 2026-10-06: Lincoln's Daily Study ran 18 cards in
 * 10 seconds and nothing told her). Read-only checks: ⚡ too fast · ❌ misses · ⏰ not done after school ·
 * 🔁 stuck cards. Plus the per-sitting time the session save now records.
 *   run:  node test_study_alerts.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(process.env.HA_INDEX || path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

const CODE = cut("// MSTALERT_START", "// MSTALERT_END");
const TODAY = "2026-10-06", KEY = "20261006";
function world(md, o) {
  o = o || {};
  const ctx = { console, JSON, Object, Array, Math, Set, String, Date,
    masteryData: md, DAYS: ["monday","tuesday","wednesday","thursday","friday"],
    _todayStr: () => TODAY, mstTodayKey: () => o.utcKey || KEY, mdTodayName: () => o.day || "tuesday",
    gwParseDate: s => { const [y,m,d] = s.split("-").map(Number); return new Date(y, m-1, d); },
    gwRules: () => ({ schoolEnd: 16*60+15 }), scheduleBreakToday: () => o.brk || null,
    getActiveTasks: () => o.tasks || [], gwGetSubjects: () => o.subs || {},
    mastIsParked: i => i && i.status === "parked", esc: s => String(s), cap: s => s[0].toUpperCase() + s.slice(1),
    mstSessions: kid => Object.entries(md[kid + "_sessions"] || {}).map(([sid, r]) => Object.assign({ sid, kind: "deck" }, r)),
    retrSchedGo: (...a) => (ctx._went = a) };
  vm.createContext(ctx); vm.runInContext(CODE, ctx);
  return ctx;
}
const sess = { dailystudy: { name: "Daily Study", emoji: "📚", kind: "all" }, daily_mix: { name: "Daily Mix", emoji: "🧠", kind: "mix" },
  german: { name: "German", emoji: "🇩🇪" }, ck: { name: "Check-up", kind: "checkup" } };

const LIVE_1006 = {"studyLog": {"daily_mix": {"20261006": {"correct": 19, "date": "20261006", "miss": 5, "printNum": 40, "secs": 329, "shown": 0, "total": 24, "items": [{"deck": "German", "id": "lin_der_beamer_p", "name": "der Beamer", "result": "m"}, {"deck": "German", "id": "lin_das_papier_p", "name": "das Papier", "result": "m"}, {"deck": "German", "id": "lin_guten_tag_p", "name": "Guten Tag", "result": "m"}, {"deck": "German", "id": "lin_frau_p", "name": "Frau", "result": "m"}, {"deck": "German", "id": "lin_hallo_p", "name": "Hallo", "result": "m"}]}}, "dailystudy": {"20261006": {"correct": 0, "date": "20261006", "miss": 0, "printNum": 40, "secs": 10, "shown": 18, "total": 18, "items": []}}, "german": {"20261006": {"correct": 0, "date": "20261006", "miss": 0, "printNum": 40, "secs": 1223, "shown": 25, "total": 25, "items": []}}, "science": {"20261006": {"correct": 0, "date": "20261006", "miss": 0, "printNum": 40, "secs": 465, "shown": 10, "total": 10, "items": []}}, "social_studies": {"20261006": {"correct": 1, "date": "20261006", "miss": 0, "printNum": 40, "secs": 282, "shown": 11, "total": 12, "items": []}}}, "items": [{"answer": "slept", "consecutive_correct": 0, "cycle": 1, "drop_count": 1, "id": "lin_slept", "next_due": 42, "prompt": "slept", "review_mode": "written", "status": "active", "subject": "AAS Words", "tally_dots": 0, "tier": "every_other_day", "ww": {"d": "2026-10-06", "m": 1}}, {"answer": "helmet", "consecutive_correct": 0, "cycle": 2, "drop_count": 4, "id": "lin_helmet", "next_due": 41, "prompt": "helmet", "review_mode": "written", "status": "active", "subject": "AAS Words", "tally_dots": 0, "tier": "every_other_day", "type": "spelling_word"}, {"answer": "skull", "consecutive_correct": 0, "cycle": 2, "drop_count": 4, "id": "lin_skull", "next_due": 42, "prompt": "skull", "review_mode": "written", "status": "active", "subject": "AAS Words", "tally_dots": 0, "tier": "every_other_day", "type": "spelling_word", "ww": {"d": "2026-10-06", "m": 1}}], "history": {"20261006": {"close": 0, "correct": 2, "date": "2026-10-06", "items": [{"id": "lin_skull", "oldTier": "every_other_day", "prompt": "skull", "result": "m"}, {"id": "lin_slept", "oldTier": "every_other_day", "prompt": "slept", "result": "m"}, {"id": "lin_swim", "oldTier": "graduated", "prompt": "swim", "result": "c"}, {"id": "lin_six", "oldTier": "graduated", "prompt": "six", "result": "c"}], "miss": 2, "pct": 50, "printNum": 40, "scored": 4, "secs": 125, "sessTimes": [125], "shown": 0, "total": 4}}, "sessions": {"daily_mix": {"audio": "off", "emoji": "🧠", "kind": "mix", "name": "Daily Mix", "who": "solo"}, "dailystudy": {"audio": "front", "emoji": "📚", "focusDecks": 6, "handOffAt": "bi_weekly", "kind": "all", "maxCards": 18, "mixInAt": "every_other_day", "name": "Daily Study", "newPerDay": 8, "order": "bank", "passes": 2, "who": "solo"}, "german": {"audio": "front", "bothWays": true, "decks": ["German"], "emoji": "🇩🇪", "focusDecks": 1, "handOffAt": "bi_weekly", "kind": "deck", "maxCards": 25, "mixInAt": "every_other_day", "name": "German", "newPerDay": 5, "order": "bank", "passes": 3, "pattern": ["rec", "rec", "say", "say", "type"], "who": "solo"}, "science": {"audio": "off", "decks": ["Real Science-4-Kids", "Chemistry Instruments"], "emoji": "📚", "focusDecks": 2, "handOffAt": "bi_weekly", "kind": "deck", "maxCards": 10, "mixInAt": "every_other_day", "name": "Science", "newPerDay": 10, "order": "bank", "passes": 2, "who": "solo"}, "social_studies": {"audio": "front", "bothWays": true, "decks": ["Discover! Social Studies 6A"], "emoji": "📚", "focusDecks": 0, "handOffAt": "bi_weekly", "kind": "deck", "maxCards": 0, "mixInAt": "weekly", "name": "Social Studies", "newPerDay": 5, "order": "bank", "passes": 2, "who": "solo"}}};   // Lincoln's real 10/6 (logs trimmed to misses)
console.log("── Lincoln's real 10/6 logs ──");
{
  const live = LIVE_1006.studyLog, items = LIVE_1006.items, hist = { lincoln: LIVE_1006.history }, sessLive = LIVE_1006.sessions;
  const md = { lincoln: items, lincoln_sessions: sessLive, studyLog: { lincoln: live }, history: hist };
  const c = world(md);
  const al = c.mstAlertsFor("lincoln", 15 * 60);
  ok("Daily Study 18 cards in 10 sec → ⚡ too fast", al.some(a => a.kind === "fast" && a.sid === "dailystudy" && /18 cards in 10 sec/.test(a.text)), al);
  ok("German (25 in 1223 s), Science, Daily Mix, Social Studies → not flagged fast", al.filter(a => a.kind === "fast").length === 1, al);
  ok("Daily Mix 19 of 24 (79%) → no miss alert", !al.some(a => a.kind === "miss"), al);
  ok("skull (dropped 4×, missed today) → 🔁 stuck", al.some(a => a.kind === "stuck" && /skull \(4×\)/.test(a.text)), al);
  ok("slept (dropped once) is not called stuck", !al.some(a => /slept/.test(a.text)));
  console.log("     →", al.map(a => a.text).join("  |  "));
}

console.log("── each rule ──");
{
  const md = { lincoln: [], lincoln_sessions: sess, studyLog: { lincoln: {
    german: { [KEY]: { total: 20, secs: 400, correct: 8, miss: 12 } },
    daily_mix: { [KEY]: { total: 4, secs: 2, correct: 1, miss: 3 } },
    ck: { [KEY]: { total: 10, secs: 5, correct: 1, miss: 9 } } } } };
  const al = world(md).mstAlertsFor("lincoln", 10 * 60);
  ok("8 of 20 right → ❌ 40%", al.some(a => a.kind === "miss" && a.sid === "german" && /8 of 20 right \(40%\)/.test(a.text)), al);
  ok("under 5 cards → no fast / miss alert (too small to judge)", !al.some(a => a.sid === "daily_mix"), al);
  ok("check-up sessions are Mom's own → never flagged", !al.some(a => a.sid === "ck"), al);
  ok("exactly 3 s a card is OK", world({ lincoln: [], lincoln_sessions: sess, studyLog: { lincoln: { german: { [KEY]: { total: 10, secs: 30 } } } } }).mstAlertsFor("lincoln", 600).length === 0);
}
{
  // a rushed first sitting stays visible after a slow "log another"
  const md = { lincoln: [], lincoln_sessions: sess, studyLog: { lincoln: { dailystudy: { [KEY]: { total: 36, secs: 900, sits: [{ secs: 10, total: 18 }, { secs: 900, total: 18 }] } } } } };
  const al = world(md).mstAlertsFor("lincoln", 600);
  ok("per-sitting time catches the rushed sitting", al.some(a => a.kind === "fast" && /18 cards in 10 sec/.test(a.text)), al);
}
{
  const tasks = [{ who: "lincoln", day: "tuesday", subjectKey: "ger" }, { who: "lincoln", day: "tuesday", subjectKey: "ds" },
    { who: "lincoln", day: "wednesday", subjectKey: "sci" }, { who: "ellis", day: "tuesday", subjectKey: "ger" }];
  const subs = { ger: { study: "german" }, ds: { study: "dailystudy" }, sci: { study: "science" } };
  const md = { lincoln: [], lincoln_sessions: sess, studyLog: { lincoln: { dailystudy: { [KEY]: { total: 18, secs: 700 } } } } };
  ok("before school ends → no ⏰", world(md, { tasks, subs }).mstAlertsFor("lincoln", 16 * 60).filter(a => a.kind === "notdone").length === 0);
  const al = world(md, { tasks, subs }).mstAlertsFor("lincoln", 16 * 60 + 15);
  ok("after school: German on today's card, no sitting → ⏰", al.some(a => a.kind === "notdone" && a.sid === "german"), al);
  ok("done session (Daily Study) and tomorrow's Science → not flagged", al.filter(a => a.kind === "notdone").length === 1, al);
  ok("break day → no ⏰", world(md, { tasks, subs, brk: { name: "x" } }).mstAlertsFor("lincoln", 17 * 60).length === 0);
  ok("weekend → no ⏰", world(md, { tasks, subs, day: "saturday" }).mstAlertsFor("lincoln", 17 * 60).length === 0);
  // evening: log saved under the UTC (tomorrow) key still counts as today
  const md2 = { lincoln: [], lincoln_sessions: sess, studyLog: { lincoln: { german: { "20261007": { total: 20, secs: 600 } } } } };
  ok("after 8 PM the UTC-keyed log is still found", world(md2, { tasks: [tasks[0]], subs, utcKey: "20261007" }).mstAlertsFor("lincoln", 21 * 60).length === 0);
}
{
  const items = [{ id: "a", prompt: "<u>Dr.</u> Smith", drop_count: 5 }, { id: "b", prompt: "old", drop_count: 6 }, { id: "c", prompt: "pk", drop_count: 4, status: "parked" }];
  const md = { lincoln: items, lincoln_sessions: sess, history: { lincoln: {
      "20261005": { date: "2026-10-05", items: [{ id: "a", result: "m" }, { id: "c", result: "m" }] },
      "20260920": { date: "2026-09-20", items: [{ id: "b", result: "m" }] } } } };
  const al = world(md).mstAlertsFor("lincoln", 600);
  ok("stuck = missed this week, HTML stripped", al.some(a => a.kind === "stuck" && a.text === "Keeps missing: Dr. Smith (5×)"), al);
  ok("missed 16 days ago → not stuck; parked → not stuck", !al.some(a => /old|pk/.test(a.text)));
}
{
  const md = { lincoln: [], lincoln_sessions: sess, ellis: [], ellis_sessions: {}, julian: [],
    studyLog: { lincoln: { german: { [KEY]: { total: 20, secs: 20 } } } } };
  const c = world(md);
  ok("only kids with sessions are checked", JSON.stringify(c.mstAlertKids()) === '["lincoln"]', c.mstAlertKids());
  const h = c.mstAlertsNowHTML();
  ok("Mom's Day Now rows: count + Open button", h.n === 1 && /Open/.test(h.html) && /Lincoln/.test(h.html), h);
  c.mstAlertOpen(0);
  ok("Open ↗ jumps to that kid's session", JSON.stringify(c._went) === '["lincoln","study","german"]', c._went);
  ok("Mom HQ banner renders", /needs a look/.test(c.mstAlertsHQHTML()));
  ok("no alerts → nothing on either page", world({ lincoln: [], lincoln_sessions: sess }).mstAlertsHQHTML() === "" && world({ lincoln: [], lincoln_sessions: sess }).mstAlertsNowHTML().n === 0);
}


console.log("── ↩ send back ──");
const LIVE_RUSH = {"rushed": [{"consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin___as_decimal", "next_due": 43, "prompt": "⅓ as decimal", "review_mode": "flash", "status": "active", "subject": "Math Facts", "tally_dots": 3, "tier": "every_other_day", "type": "math facts"}, {"consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin___as_decimal_2", "prompt": "⅔ as decimal", "review_mode": "flash", "status": "introduction", "subject": "Math Facts", "tally_dots": 1, "tier": "daily", "type": "math facts"}, {"answer": "Names of places, cities, states, roads, and avenues.", "consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin__u_disney_world__u__", "prompt": "<u>Disney World</u> is in <u>Orlando</u>, <u>Florida</u>.", "review_mode": "recite", "status": "introduction", "subject": "Capitalization", "tally_dots": 2, "tier": "daily", "type": "capitalization"}, {"answer": "good", "consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin_bene", "prompt": "bene", "review_mode": "flash", "status": "introduction", "subject": "Greek & Latin Roots", "tally_dots": 2, "tier": "daily", "type": "greek & latin roots"}, {"answer": "a group of words with a subject and verb that cannot stand alone — needs an independent clause", "consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin_dependent_clause", "prompt": "dependent clause", "review_mode": "flash", "status": "introduction", "subject": "Grammar", "tally_dots": 2, "tier": "daily", "type": "grammar"}, {"answer": "bad", "consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin_mal", "prompt": "mal", "review_mode": "flash", "status": "introduction", "subject": "Greek & Latin Roots", "tally_dots": 2, "tier": "daily", "type": "greek & latin roots"}, {"answer": "form or shape", "consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin_morph", "prompt": "morph", "review_mode": "flash", "status": "introduction", "subject": "Greek & Latin Roots", "tally_dots": 2, "tier": "daily", "type": "greek & latin roots"}, {"answer": "People’s titles and their abbreviations.", "consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin_my_dentist_s_name_is", "prompt": "My dentist’s name is <u>Doctor</u> Olson.", "review_mode": "recite", "status": "introduction", "subject": "Capitalization", "tally_dots": 2, "tier": "daily", "type": "capitalization"}, {"answer": "People’s titles and their abbreviations.", "consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin_my_dentist_s_name_is_2", "prompt": "My dentist’s name is <u>Dr.</u> Olson.", "review_mode": "recite", "status": "introduction", "subject": "Capitalization", "tally_dots": 2, "tier": "daily", "type": "capitalization"}, {"answer": "a phrase beginning with a verb form (-ing or -ed) that acts as an adjective", "consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin_participial_phrase", "prompt": "participial phrase", "review_mode": "flash", "status": "introduction", "subject": "Grammar", "tally_dots": 2, "tier": "daily", "type": "grammar"}, {"answer": "/j/ · edge", "consecutive_correct": 0, "cycle": 2, "drop_count": 0, "id": "lin_pg_dge", "next_due": 43, "prompt": "dge", "review_mode": "recite", "status": "active", "subject": "Phonograms", "tally_dots": 3, "tier": "every_other_day", "type": "phonograms"}, {"answer": "/ā-ī/ · eight, height", "consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin_pg_eigh", "prompt": "eigh", "review_mode": "recite", "status": "introduction", "subject": "Phonograms", "tally_dots": 2, "tier": "daily", "type": "phonograms"}, {"answer": "/n/ · sign", "consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin_pg_gn", "prompt": "gn", "review_mode": "recite", "status": "introduction", "subject": "Phonograms", "tally_dots": 2, "tier": "daily", "type": "phonograms"}, {"answer": "a dependent clause that starts with who, which, or that and describes a noun", "consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin_relative_clause", "prompt": "relative clause", "review_mode": "flash", "status": "introduction", "subject": "Grammar", "tally_dots": 2, "tier": "daily", "type": "grammar"}, {"answer": "stones", "consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin_stones", "prompt": "stones", "review_mode": "flash", "status": "introduction", "subject": "AAS Words", "tally_dots": 2, "tier": "daily", "type": "aas words"}, {"answer": "trade", "consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin_trade", "prompt": "trade", "review_mode": "flash", "status": "introduction", "subject": "AAS Words", "tally_dots": 2, "tier": "daily", "type": "aas words"}, {"answer": "0.25", "consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin___as_decimal_3", "prompt": "¼ as decimal", "review_mode": "flash", "status": "introduction", "subject": "Math Facts", "tally_dots": 1, "tier": "daily", "type": "math facts"}, {"answer": "/n/ · know", "consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin_pg_kn", "prompt": "kn", "review_mode": "recite", "status": "introduction", "subject": "Phonograms", "tally_dots": 1, "tier": "daily", "type": "phonograms"}], "handUndo": [{"consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin___as_decimal", "prompt": "⅓ as decimal", "review_mode": "flash", "status": "introduction", "subject": "Math Facts", "tally_dots": 2, "tier": "daily", "type": "math facts"}, {"consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin___as_decimal_2", "prompt": "⅔ as decimal", "review_mode": "flash", "status": "introduction", "subject": "Math Facts", "tally_dots": 0, "tier": "daily", "type": "math facts"}, {"answer": "Names of places, cities, states, roads, and avenues.", "consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin__u_disney_world__u__", "prompt": "<u>Disney World</u> is in <u>Orlando</u>, <u>Florida</u>.", "review_mode": "recite", "status": "introduction", "subject": "Capitalization", "tally_dots": 1, "tier": "daily", "type": "capitalization"}, {"answer": "good", "consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin_bene", "prompt": "bene", "review_mode": "flash", "status": "introduction", "subject": "Greek & Latin Roots", "tally_dots": 1, "tier": "daily", "type": "greek & latin roots"}, {"answer": "a group of words with a subject and verb that cannot stand alone — needs an independent clause", "consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin_dependent_clause", "prompt": "dependent clause", "review_mode": "flash", "status": "introduction", "subject": "Grammar", "tally_dots": 1, "tier": "daily", "type": "grammar"}, {"answer": "bad", "consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin_mal", "prompt": "mal", "review_mode": "flash", "status": "introduction", "subject": "Greek & Latin Roots", "tally_dots": 1, "tier": "daily", "type": "greek & latin roots"}, {"answer": "form or shape", "consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin_morph", "prompt": "morph", "review_mode": "flash", "status": "introduction", "subject": "Greek & Latin Roots", "tally_dots": 1, "tier": "daily", "type": "greek & latin roots"}, {"answer": "People’s titles and their abbreviations.", "consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin_my_dentist_s_name_is", "prompt": "My dentist’s name is <u>Doctor</u> Olson.", "review_mode": "recite", "status": "introduction", "subject": "Capitalization", "tally_dots": 1, "tier": "daily", "type": "capitalization"}, {"answer": "People’s titles and their abbreviations.", "consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin_my_dentist_s_name_is_2", "prompt": "My dentist’s name is <u>Dr.</u> Olson.", "review_mode": "recite", "status": "introduction", "subject": "Capitalization", "tally_dots": 1, "tier": "daily", "type": "capitalization"}, {"answer": "a phrase beginning with a verb form (-ing or -ed) that acts as an adjective", "consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin_participial_phrase", "prompt": "participial phrase", "review_mode": "flash", "status": "introduction", "subject": "Grammar", "tally_dots": 1, "tier": "daily", "type": "grammar"}, {"answer": "/j/ · edge", "consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin_pg_dge", "prompt": "dge", "review_mode": "recite", "status": "introduction", "subject": "Phonograms", "tally_dots": 2, "tier": "daily", "type": "phonograms"}, {"answer": "/ā-ī/ · eight, height", "consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin_pg_eigh", "prompt": "eigh", "review_mode": "recite", "status": "introduction", "subject": "Phonograms", "tally_dots": 1, "tier": "daily", "type": "phonograms"}, {"answer": "/n/ · sign", "consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin_pg_gn", "prompt": "gn", "review_mode": "recite", "status": "introduction", "subject": "Phonograms", "tally_dots": 1, "tier": "daily", "type": "phonograms"}, {"answer": "a dependent clause that starts with who, which, or that and describes a noun", "consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin_relative_clause", "prompt": "relative clause", "review_mode": "flash", "status": "introduction", "subject": "Grammar", "tally_dots": 1, "tier": "daily", "type": "grammar"}, {"answer": "stones", "consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin_stones", "prompt": "stones", "review_mode": "flash", "status": "introduction", "subject": "AAS Words", "tally_dots": 1, "tier": "daily", "type": "aas words"}, {"answer": "trade", "consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin_trade", "prompt": "trade", "review_mode": "flash", "status": "introduction", "subject": "AAS Words", "tally_dots": 1, "tier": "daily", "type": "aas words"}, {"answer": "0.25", "consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin___as_decimal_3", "prompt": "¼ as decimal", "review_mode": "flash", "status": "introduction", "subject": "Math Facts", "tally_dots": 0, "tier": "daily", "type": "math facts"}, {"answer": "/n/ · know", "consecutive_correct": 0, "cycle": 1, "drop_count": 0, "id": "lin_pg_kn", "prompt": "kn", "review_mode": "recite", "status": "introduction", "subject": "Phonograms", "tally_dots": 0, "tier": "daily", "type": "phonograms"}]};   // Lincoln's 18 cards right after the 10-second run, and after the hand undo of 10/6
{
  const c = world({});
  // the before-copy his Daily Study would have saved = the cards as they stood before it (= the hand undo)
  const before = LIVE_RUSH.handUndo.map(it => c.mstBeforeSnap(it, false));
  const items = JSON.parse(JSON.stringify(LIVE_RUSH.rushed));
  const upd = c.mstSendBackPatch(items, before);
  ok("real 10/6: Send back gives exactly what was undone by hand (all 18 cards)", JSON.stringify(items) === JSON.stringify(LIVE_RUSH.handUndo),
     items.map((x, i) => JSON.stringify(x) === JSON.stringify(LIVE_RUSH.handUndo[i]) ? null : x.id).filter(Boolean));
  ok("⅓ as decimal: next_due removed in the patch (null), back to introduction", upd["0/next_due"] === null && upd["0/status"] === "introduction" && upd["0/tally_dots"] === 2, upd);
  ok("patch is field-level only (never a whole card)", Object.keys(upd).every(k => /^\d+\/[a-zA-Z_]+$/.test(k)));
}
{
  const c = world({});
  const fresh = { id: "n1", status: "active", tier: "every_other_day", tally_dots: 3, next_due: 50, cycle: 2 };
  const items = [fresh];
  c.mstSendBackPatch(items, [c.mstBeforeSnap(fresh, true)]);
  ok("a card minted in the sitting goes back to a new learning card (kept, not deleted)", items.length === 1 && items[0].status === "introduction" && items[0].tally_dots === 0 && items[0].next_due === undefined, items[0]);
  const m = c.mstBeforeMerge([{ id: "a", st: { tally_dots: 1 } }], [{ id: "a", st: { tally_dots: 2 } }, { id: "b", st: { tally_dots: 0 } }]);
  ok("second sitting: a card's FIRST before-copy of the day wins", m.length === 2 && m[0].st.tally_dots === 1 && m[1].id === "b", m);
  ok("missing card id → skipped, no write", Object.keys(c.mstSendBackPatch([{ id: "x" }], [{ id: "gone", st: {} }])).length === 0);
}
function sbWorld(entry, o) {
  o = o || {};
  const items = [{ id: "c1", status: "active", tier: "every_other_day", tally_dots: 3, next_due: 43, cycle: 2 }];
  const md = { lincoln: items, lincoln_sessions: sess, studyLog: { lincoln: { dailystudy: { [KEY]: entry } } } };
  const c = world(md, o);
  const writes = [];
  c.db = { ref: p => ({ update: v => writes.push(["update", p, v]), remove: () => writes.push(["remove", p]), set: v => writes.push(["set", p, v]) }) };
  c.confirm = m => { c._asked = m; return o.no ? false : true; };
  c.alert = m => (c._alerted = m); c.momHere = () => !o.kid; c.kitPinGate = f => (c._pin = f);
  c.HA_LS = { setItem: () => {} }; c.gwShowToast = m => (c._toast = m); c.renderAll = () => (c._rendered = true);
  return { c, md, writes };
}
{
  const entry = { total: 18, secs: 10, correct: 0, miss: 0, shown: 18, before: [{ id: "c1", st: { status: "introduction", tier: "daily", tally_dots: 2, cycle: 1 } }] };
  const { c, md, writes } = sbWorld(entry);
  c.mstAlertsFor("lincoln", 600);
  const al = c.mstAlertsAll();
  const i = al.findIndex(a => a.kind === "fast");
  ok("⚡ row carries ↩ Send back", i >= 0 && al[i].back && /mstSendBack\(/.test(c.mstAlertRowHTML(al[i], i)));
  c.mstSendBack(i);
  ok("Mom is asked first, told how many cards go back", /1 cards it moved today go back/.test(c._asked || ""), c._asked);
  ok("writes: card fields to mastery/lincoln", writes.some(w => w[0] === "update" && w[1] === "mastery/lincoln" && w[2]["0/status"] === "introduction" && w[2]["0/next_due"] === null), writes);
  ok("writes: today's log removed (session opens again)", writes.some(w => w[0] === "remove" && w[1] === "mastery/studyLog/lincoln/dailystudy/" + KEY));
  ok("writes: a send-back record (the rushed run is kept there)", writes.some(w => w[0] === "set" && w[1] === "mastery/studyBack/lincoln/dailystudy" && w[2].secs === 10 && w[2].total === 18 && w[2].undone === 1));
  ok("exactly those 3 writes", writes.length === 3, writes);
  ok("local copy updated at once", md.lincoln[0].tally_dots === 2 && md.lincoln[0].next_due === undefined && !md.studyLog.lincoln.dailystudy[KEY]);
  ok("pending → his session + schedule card will say so", c.mstSentBackPending("lincoln", "dailystudy") === true);
  const al2 = c.mstAlertsFor("lincoln", 17 * 60);
  ok("Mom now sees ↩ waiting for his redo (no more ⚡)", al2.some(a => a.kind === "sentback") && !al2.some(a => a.kind === "fast"), al2);
  md.studyBack.lincoln.dailystudy.redoneTs = new Date(2026, 9, 6, 15, 0).getTime(); md.studyBack.lincoln.dailystudy.redoTotal = 18; md.studyBack.lincoln.dailystudy.redoSecs = 540;
  const al3 = c.mstAlertsFor("lincoln", 17 * 60);
  ok("after the redo: ✅ redone — 18 cards in 9 min, not pending", al3.some(a => a.kind === "redone" && /18 cards in 9 min/.test(a.text)) && !c.mstSentBackPending("lincoln", "dailystudy"), al3);
  ok("✅ redone row is not counted as needing her", c.mstAlertsNowHTML().n === al3.filter(a => a.kind !== "redone").length);
}
{
  const { c, writes } = sbWorld({ total: 18, secs: 10 }, { no: true });
  c.mstAlertsAll(); c.mstSendBack(0);
  ok("Cancel → nothing written", writes.length === 0);
}
{
  const { c, writes } = sbWorld({ total: 18, secs: 10 });
  c.mstAlertsAll(); c.mstSendBack(0);
  ok("old sitting (no before-copy): Mom is told progress can't be taken back", /can't be taken back/.test(c._asked || ""));
  ok("…and only the log + record are written, no card writes", writes.length === 2 && !writes.some(w => w[0] === "update"), writes);
}
{
  const { c, writes } = sbWorld({ total: 18, secs: 10, before: [] }, { kid: true });
  c.mstAlertsAll(); c.mstSendBack(0);
  ok("on a kid's device → Mom PIN first, nothing written yet", typeof c._pin === "function" && writes.length === 0);
}

console.log("── wiring ──");
ok("Mom's Day Now card calls it", /_momApprovalsHTML\(\); nowN\+=_ap\.n; h\+=_ap\.html; \}catch\(e\)\{\}\n  try\{ const _sa=mstAlertsNowHTML\(\); nowN\+=_sa\.n; h\+=_sa\.html;/.test(src));
ok("Mom HQ calls it", /h\+=wsBannerHTML\(\);[^\n]*\n  try\{ h\+=mstAlertsHQHTML\(\); \}catch\(e\)\{\}/.test(src));
ok("save keeps a before-copy of every card it scores", /_before\.push\(mstBeforeSnap\(it,_mintedIds\.has\(it\.id\)\)\)/.test(src) && /before:_before\}/.test(src) && /mstBeforeMerge\(prevLog\.before,_before\)/.test(src));
ok("before-copy taken BEFORE the scores are applied", src.indexOf("_before.push(mstBeforeSnap") < src.indexOf("r=mastApplyScores(items,due,scores,pn,settings,{prevShown:prevShownIds"));
ok("a saved sitting closes the send-back (redoneTs)", /mastery\/studyBack\/"\+kid\+"\/"\+sid\)\.update\(_rd\)/.test(src));
ok("his session shows 'Mom sent this back'", /mstSentBackPending\(kid,session\.sid\)\) h\+=/.test(src));
ok("his schedule card shows it too", /mstSentBackPending\(t\.who,_dlSub\.study\)\) linkRow\+=/.test(src));
ok("session save records each sitting's time", /sits:\[\{secs:secs,total:total\}\]/.test(src) && /prevLog\.sits/.test(src));
ok("the alert checks write nothing", !/db\.ref|\.set\(|\.update\(|HA_LS\.setItem/.test(cut("function mstAlertKids(", "// ── ↩ Send back ──")));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
