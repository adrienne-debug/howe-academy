/*
 * Node tests — 🕒 Study sittings today in 🔴 Now (SREVIEW, her ask 2026-11-08): every finished sitting of a non-Mom study
 * session, every kid — cards, m:ss, s/card (red under Mom's floor) — with 👍 Looks right / ↩ Too fast — send back.
 * Also the live 11/4 incident: the redo after a send-back went over the ⚡ 3 s line, so no Send back was offered again.
 *   run:  node test_study_review.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(process.env.HA_INDEX || path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j + b.length); };
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

const CODE = cut("// MSTALERT_START", "// SREVIEW_END");
const SR = cut("// SREVIEW_START", "// SREVIEW_END");
const TODAY = "2026-11-04", KEY = "20261104", YKEY = "20261103";
const KIDS = ["kida", "kidb", "kidc"];
const SESS = {
  mix: { name: "Mix", emoji: "🧠", kind: "mix", who: "solo" },
  words: { name: "Words", emoji: "📚", kind: "deck" },
  withmom: { name: "Read with Mom", kind: "deck", who: "mom" },
  ck: { name: "Check-up", kind: "checkup", who: "mom" } };

function world(md, o) {
  o = o || {};
  const writes = [];
  const ref = p => ({ set: v => writes.push(["set", p, JSON.parse(JSON.stringify(v))]),
    update: v => writes.push(["update", p, JSON.parse(JSON.stringify(v))]), remove: () => writes.push(["remove", p]) });
  const ctx = { console, JSON, Object, Array, Math, Set, String, Date, isFinite, parseFloat,
    masteryData: md, ROSTER: KIDS.slice(), DAYS: ["monday","tuesday","wednesday","thursday","friday"],
    _todayStr: () => TODAY, mstTodayKey: () => o.utcKey || KEY, mdTodayName: () => "wednesday",
    gwParseDate: s => { const [y,m,d] = s.split("-").map(Number); return new Date(y, m-1, d); },
    gwRules: () => ({ schoolEnd: 16*60+15 }), scheduleBreakToday: () => null, getActiveTasks: () => [], gwGetSubjects: () => ({}),
    mastIsParked: () => false, esc: s => String(s), cap: s => s[0].toUpperCase() + s.slice(1),
    mstSessions: kid => Object.entries(md[kid + "_sessions"] || {}).map(([sid, r]) => Object.assign({ sid, kind: "deck", who: "solo" }, r)),
    db: { ref }, _dryRun: () => !!o.dry, momHere: () => o.mom !== false, kitPinGate: () => { ctx._pin = true; },
    confirm: m => { ctx._confirm = m; return o.cancel ? false : true; }, alert: m => { ctx._alert = m; }, prompt: () => o.prompt,
    HA_LS: { setItem: () => {} }, renderAll: () => { ctx._renders = (ctx._renders || 0) + 1; }, gwShowToast: () => {}, _kioskD: () => false,
    _writes: writes };
  vm.createContext(ctx); vm.runInContext(CODE, ctx);
  return ctx;
}
const card = (id, tier) => ({ id, prompt: id, subject: "Words", tier: tier || "weekly", status: "active", consecutive_correct: 2, cycle: 1, drop_count: 0, tally_dots: 1 });
const before = ids => ids.map(id => ({ id, st: { tier: "daily", status: "active", consecutive_correct: 0, cycle: 1, drop_count: 0, tally_dots: 0 } }));

console.log("── no sittings today → no section ──");
{
  const c = world({ kida_sessions: SESS, studyLog: { kida: { mix: { [YKEY]: { total: 60, secs: 90, sits: [{ secs: 90, total: 60 }] } } } } });
  const r = c.srNowHTML();
  ok("nothing today → {n:0, html:''} (the Now card is byte-identical)", r.n === 0 && r.html === "", r);
  ok("…and nothing written", c._writes.length === 0);
  const c2 = world({});
  ok("a family with no study data at all → empty too", c2.srNowHTML().html === "");
}

console.log("── lists only today's finished non-Mom sittings, every kid ──");
const fixture = () => ({
  kida: [card("a1"), card("a2")], kidb: [card("b1")], kidc: [],
  kida_sessions: SESS, kidb_sessions: { words: SESS.words, ck: SESS.ck }, kidc_sessions: { withmom: SESS.withmom },
  studyLog: {
    kida: { mix: { [KEY]: { total: 120, secs: 311, before: before(["a1"]), sits: [{ secs: 97, total: 60 }, { secs: 214, total: 60 }] }, [YKEY]: { total: 60, secs: 50 } },
            words: { [KEY]: { total: 10, secs: 30, correct: 9, miss: 1 } },        // logged before per-sitting times: no sits
            withmom: { [KEY]: { total: 12, secs: 20, sits: [{ secs: 20, total: 12 }] } } },
    kidb: { words: { [KEY]: { total: 8, secs: 200, before: before(["b1"]), sits: [{ secs: 200, total: 8 }] } },
            ck: { [KEY]: { total: 20, secs: 10, sits: [{ secs: 10, total: 20 }] } } },
    kidc: { withmom: { [KEY]: { total: 15, secs: 5, sits: [{ secs: 5, total: 15 }] } } } } });
{
  const c = world(fixture());
  const rows = c.srRows();
  ok("exactly kida mix#0, mix#1, words#0, kidb words#0", JSON.stringify(rows.map(r => r.kid + ":" + r.sid + "#" + r.i)) === JSON.stringify(["kida:mix#0","kida:mix#1","kida:words#0","kidb:words#0"]), rows.map(r => r.kid + ":" + r.sid + "#" + r.i));
  ok("yesterday's sitting is not listed", !rows.some(r => r.key === YKEY));
  ok("a Mom-run session (who:mom) is excluded", !rows.some(r => r.sid === "withmom"));
  ok("a 🩺 check-up is excluded", !rows.some(r => r.sid === "ck"));
  ok("kids in roster order", rows[0].kid === "kida" && rows[rows.length - 1].kid === "kidb");
  const h = c.srNowHTML();
  ok("section heading shows", /Study sittings today/.test(h.html));
  ok("n = the 4 sittings still waiting on her", h.n === 4, h.n);
  ok("each row has 👍 Looks right and ↩ Too fast — send back", (h.html.match(/srOk\(/g) || []).length === 4 && (h.html.match(/srBack\(/g) || []).length === 4);
  ok("rows name the deck and the cards", /🧠 Mix · 60 cards · 1:37/.test(h.html) && /📚 Words · 8 cards · 3:20/.test(h.html), h.html);
}

console.log("── seconds a card + the red floor ──");
{
  const c = world({});
  ok("97 s / 60 cards → 1.6 s/card", c.srPerCard(97, 60) === 1.6);
  ok("214 s / 60 cards → 3.6 s/card", c.srPerCard(214, 60) === 3.6);
  ok("no time → null", c.srPerCard(null, 60) === null && c.srPerCard(30, 0) === null);
  ok("m:ss — 97 → 1:37, 214 → 3:34, 5 → 0:05", c.srMSS(97) === "1:37" && c.srMSS(214) === "3:34" && c.srMSS(5) === "0:05" && c.srMSS(null) === "—");
  ok("default floor is 3 s/card", c.srFloor() === 3);
  const r = (secs, total) => ({ kid: "kida", sid: "mix", deck: "🧠 Mix", total, secs, judged: null });
  ok("1.6 s/card is red under 3", /#dc2626/.test(c.srRowHTML(r(97, 60), 0, 3)));
  ok("3.6 s/card is not red", !/#dc2626/.test(c.srRowHTML(r(214, 60), 0, 3)));
  ok("exactly 3.0 s/card is not red", !/#dc2626/.test(c.srRowHTML(r(30, 10), 0, 3)));
  const c2 = world({ studyReview: { floor: 4 } });
  ok("Mom's floor 4 → read from mastery/studyReview/floor", c2.srFloor() === 4);
  ok("…and 3.6 s/card is red under it", /#dc2626/.test(c2.srRowHTML(r(214, 60), 0, c2.srFloor())));
  const c3 = world({}, { prompt: "5" }); c3.srSetFloor();
  ok("✏️ floor → one write to mastery/studyReview/floor", c3._writes.length === 1 && c3._writes[0][0] === "set" && c3._writes[0][1] === "mastery/studyReview/floor" && c3._writes[0][2] === 5, c3._writes);
  const c4 = world({}, { prompt: "abc" }); c4.srSetFloor();
  ok("…a non-number is refused, nothing written", c4._writes.length === 0 && !!c4._alert);
}

console.log("── 👍 Looks right writes the verdict once ──");
{
  const md = fixture(), c = world(md);
  c.srNowHTML(); c.srOk(1);   // kida mix, second sitting
  ok("one write", c._writes.length === 1, c._writes);
  const w = c._writes[0] || [];
  ok("…to the sitting itself: mastery/studyLog/kida/mix/<day>/sits/1/judged", w[0] === "set" && w[1] === "mastery/studyLog/kida/mix/" + KEY + "/sits/1/judged", w);
  ok("…{by:'mom', at, verdict:'ok'}", w[2] && w[2].by === "mom" && w[2].verdict === "ok" && typeof w[2].at === "number", w[2]);
  ok("memory carries it too", md.studyLog.kida.mix[KEY].sits[1].judged.verdict === "ok");
  c.srNowHTML(); c.srOk(1);
  ok("tapping again writes nothing more", c._writes.length === 1, c._writes);
  const h = c.srNowHTML();
  ok("the judged row shows 👍 Looks right with no buttons; n drops to 3", h.n === 3 && (h.html.match(/srOk\(/g) || []).length === 3, h.n);
  c.srBack(1);
  ok("↩ on an already-judged sitting does nothing", c._writes.length === 1);
  // a sitting saved before per-sitting times: its one sitting gets a sits list
  c.srNowHTML(); c.srOk(2);
  const w2 = c._writes[1] || [];
  ok("legacy log (no sits) → sits:[{secs,total,judged}] written once", w2[1] === "mastery/studyLog/kida/words/" + KEY + "/sits" && w2[2][0].secs === 30 && w2[2][0].total === 10 && w2[2][0].judged.verdict === "ok", w2);
  ok("on a kid's device Mom's PIN comes first, nothing written", (() => { const c5 = world(fixture(), { mom: false }); c5.srNowHTML(); c5.srOk(0); return c5._pin && c5._writes.length === 0; })());
}

console.log("── ↩ Too fast — send back: re-queues like ⚡ Send back, keeps the sitting ──");
{
  const md = fixture(), c = world(md);
  c.srNowHTML(); c.srBack(3);   // kidb words
  const wr = c._writes;
  ok("card fields put back on mastery/kidb (same as mstSendBack)", wr.some(w => w[0] === "update" && w[1] === "mastery/kidb" && w[2]["0/tier"] === "daily" && w[2]["0/tally_dots"] === 0), wr);
  ok("today's log removed so the session opens again", wr.some(w => w[0] === "remove" && w[1] === "mastery/studyLog/kidb/words/" + KEY));
  const rec = wr.find(w => w[1] === "mastery/studyBack/kidb/words");
  ok("send-back record is a targeted update (redo stamps cleared)", rec && rec[0] === "update" && rec[2].redoneTs === null && rec[2].total === 8 && rec[2].secs === 200, rec);
  const logKey = rec && Object.keys(rec[2]).find(k => /^log\//.test(k));
  const arc = logKey && rec[2][logKey];
  ok("the original sitting is kept at studyBack/<kid>/<sid>/log/<day>_<ts>", !!arc && logKey.indexOf("log/" + KEY + "_") === 0, rec && rec[2]);
  ok("…whole (total, secs, before) and marked sent back", arc && arc.total === 8 && arc.secs === 200 && arc.before.length === 1 && arc.sentBack.verdict === "back" && arc.sentBack.sit === 0 && arc.sits[0].judged.verdict === "back", arc);
  ok("exactly those 3 writes", wr.length === 3, wr);
  ok("memory: the card is back where it was", md.kidb[0].tier === "daily" && md.kidb[0].tally_dots === 0);
  ok("memory: log gone, record pending (the redo is waiting)", !md.studyLog.kidb.words[KEY] && c.mstSentBackPending("kidb", "words"));
  const rows = c.srRows();
  const back = rows.find(r => r.kid === "kidb");
  ok("the section still lists it, as ↩ Sent back", back && back.back === true && back.total === 8, rows);
  const h = c.srNowHTML();
  ok("…with no buttons (n counts only the 3 open ones)", h.n === 3 && /↩ Sent back/.test(h.html), h.n);
  const c6 = world(fixture(), { cancel: true }); c6.srNowHTML(); c6.srBack(0);
  ok("Cancel → nothing written", c6._writes.length === 0);
  const c7 = world(fixture()); c7.srNowHTML(); c7.srBack(0);
  ok("two sittings in one entry → Mom is told both go back", /all 2 of today's Mix sittings/.test(c7._confirm || ""), c7._confirm);
}

console.log("── the live 11/4 incident: no Send back the second time ──");
{
  // First sitting: 60 cards in 97 s (1.6 s a card) → ⚡ with ↩. Sent back. Redo: 60 cards in 214 s (3.6 s a card).
  const md = { kida: [card("a1"), card("a2")], kida_sessions: { mix: SESS.mix },
    studyLog: { kida: { mix: { [KEY]: { total: 60, secs: 97, correct: 59, miss: 1, before: before(["a1", "a2"]), sits: [{ secs: 97, total: 60 }] } } } } };
  const c = world(md);
  const a1 = c.mstAlertsFor("kida", 12 * 60);
  ok("first sitting: ⚡ too fast carries ↩", a1.some(a => a.kind === "fast" && a.back));
  c.mstAlertsAll(); c.mstSendBack(0);
  ok("sent back (log removed, record pending)", !md.studyLog.kida.mix[KEY] && c.mstSentBackPending("kida", "mix"));
  // the redo is saved the way _mstSaveInner does it: a fresh day entry + the redo stamp on the record
  md.studyLog.kida.mix[KEY] = { total: 60, secs: 214, correct: 57, miss: 3, before: before(["a1", "a2"]), sits: [{ secs: 214, total: 60 }] };
  Object.assign(md.studyBack.kida.mix, { redoneTs: new Date(2026, 10, 4, 11, 59).getTime(), redoSecs: 214, redoTotal: 60 });
  const a2 = c.mstAlertsFor("kida", 12 * 60);
  ok("REPRODUCED: after the redo the ⚡/❌ list has no ↩ (only '✅ redone')", !a2.some(a => a.back) && a2.some(a => a.kind === "redone"), a2);
  const h = c.srNowHTML();
  ok("FIXED: 🕒 lists the redo with ↩ Too fast — send back", (h.html.match(/srBack\(/g) || []).length === 1 && /3:34/.test(h.html), h.html);
  ok("…and the first sitting as ↩ Sent back (kept, not deleted)", /1:37/.test(h.html) && /↩ Sent back/.test(h.html));
  const i = vm.runInContext("_srRows", c).findIndex(r => !r.back);
  c.srBack(i);
  const log = md.studyBack.kida.mix.log || {};
  ok("second send-back: BOTH sittings are now kept in the send-back log", Object.keys(log).length === 2 && Object.values(log).some(x => x.secs === 97) && Object.values(log).some(x => x.secs === 214), Object.values(log).map(x => x.secs));
  ok("…and the record is pending again (the second redo is waiting)", c.mstSentBackPending("kida", "mix"));
  const last = c._writes.filter(w => w[1] === "mastery/studyBack/kida/mix").pop();
  ok("…written as an update, so the first log entry is never wiped", last && last[0] === "update" && last[2].redoneTs === null, last);
}

{
  // a send-back saved before this shipped: only the flat record (no log) — still shown, as sent back
  const md = { kida: [], kida_sessions: { mix: SESS.mix }, studyLog: { kida: { mix: {} } },
    studyBack: { kida: { mix: { ts: 1, date: KEY, total: 60, secs: 97, correct: 59, miss: 1, undone: 60 } } } };
  const rows = world(md).srRows();
  ok("an older send-back record (no log) shows as one ↩ Sent back row", rows.length === 1 && rows[0].back && rows[0].secs === 97, rows);
  md.studyBack.kida.mix.date = YKEY;
  ok("…only on its own day", world(md).srRows().length === 0);
}

console.log("── dry run writes nothing ──");
{
  const md = fixture(), c = world(md, { dry: true, prompt: "4" });
  c.srNowHTML(); c.srOk(0); c.srNowHTML(); c.srBack(3); c.srSetFloor();
  ok("👍, ↩ and ✏️ floor in ?dryrun=1 → zero Firebase writes", c._writes.length === 0, c._writes);
  const c2 = world(fixture(), { dry: true }); c2.mstAlertsAll(); c2.mstSendBack(0);
  ok("the ⚡ row's ↩ is inert in dry run too", c2._writes.length === 0, c2._writes);
}

console.log("── wiring + no family literals ──");
{
  const now = src.indexOf("try{ const _sa=mstAlertsNowHTML(); nowN+=_sa.n;"), sr = src.indexOf("try{ const _sr=srNowHTML(); nowN+=_sr.n;");   // 📚 STUDY_NOWONE: counted here, drawn in the one study row
  ok("🔴 Now calls srNowHTML right after the 🚩 study alerts", now > 0 && sr > now && sr - now < 400);
  ok("srRows only reads (no db / storage writes)", !/db\.ref|\.set\(|\.update\(|HA_LS/.test(cut("function srRows(", "function srRowHTML(")));
  ok("every write in the block is behind _srLive()", (SR.match(/db\.ref\(/g) || []).length === (SR.match(/if\(_srLive\(\)\) db\.ref\(/g) || []).length);
  const fd = src.slice(src.indexOf("const FAMILY_DEFAULT"), src.indexOf("];", src.indexOf("const FAMILY_DEFAULT")));
  const names = [...fd.matchAll(/name:"([A-Za-z]+)"/g)].map(m => m[1]).concat([...fd.matchAll(/id:"([a-z]+)"/g)].map(m => m[1]));
  ok("roster names found to check against", names.length >= 2);
  const lit = names.filter(n => new RegExp("\\b" + n + "\\b", "i").test(SR.replace(/\/\/.*$/gm, "")));
  ok("no family / kid literals in the SREVIEW code", lit.length === 0, lit);
  const me = fs.readFileSync(__filename, "utf8");
  ok("…nor in this test", !names.some(n => new RegExp("\\b" + n + "\\b", "i").test(me.replace(/names\.|name:/g, ""))), names.filter(n => new RegExp("\\b" + n + "\\b", "i").test(me)));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
