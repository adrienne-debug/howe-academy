/*
 * Node tests for 📅 Curriculum heads-up, step 6a + 6b (her yes 2026-10-25; DESIGN_linked_roadmap_2026-10-24.md §3.2):
 * her typed roadmap rows can LINK to the curriculum.
 *   6a · the form's "Shows up…" (On the date / On the date · ticks itself / When ‹subject› is running out / When a lesson
 *        is done) + "new subject's name contains…" → rmxLinkFromForm → plans/<kid>/roadmap/<id>.link = {sk, when, lid?, n?,
 *        match?}, written ONLY inside her own Save (rmSave's set); keepOpen rides through an edit; rows without a link are
 *        saved exactly as before (no link key)
 *      · effective date (rmxEffDue): ends → the subject's run-out day (or the last done day when empty); lesson → the done
 *        day, else where the Grid projects that lesson; her typed due is the fallback everywhere
 *      · a "running out" row REPLACES that subject's automatic row (strip, Mom's Day, plan-bar chip — one row per subject)
 *        and shows on Mom's Day when the heads-up would (rmxLinkHot)
 *   6b · rmxAuto(kid,r) → {met, why}: append / pause / add / swap per the design table; edit and note never; rows without
 *        a link never; honours autoDone (family / kid) — the row draws as done with "✓ auto · why"
 *      · her untick of an auto-done row → ONE update {keepOpen:true} ("not yet"); ticking it again → {done, keepOpen:null};
 *        a hand tick / untick writes {done} exactly as today
 *   · every write is her tap on plans/<kid>/roadmap/<id>; derive, display and auto-done write nothing
 *
 *   run:  node test_rmx_link.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 700) + ")" : "")); } }
const block = src.slice(src.indexOf("// RMX_START"), src.indexOf("// RMX_END")), sblock = src.slice(src.indexOf("// RMXS_START"), src.indexOf("// RMXS_END")), rblock = src.slice(src.indexOf("// ROADMAP_START"), src.indexOf("// ROADMAP_END"));

console.log("# hygiene");
ok("the RMX block still has no Firebase write", !/db\.ref|\.set\(|\.update\(|\.remove\(|rmWrite\(/.test(block));
ok("ROADMAP writes only through rmWrite; the link is built by rmxLinkFromForm inside rmSave; rmDone writes keepOpen", /rmxLinkFromForm\(kid,f,prev\)/.test(rblock) && /patch=\{keepOpen:true\}/.test(rblock) && /patch=\{done:r\.done,keepOpen:null\}/.test(rblock) && rblock.split("\n").filter(l => /db\.ref/.test(l)).length === 1 && /^function rmWrite/.test(rblock.split("\n").find(l => /db\.ref/.test(l))));
ok("the calendar day sheet is untouched (step 7 is not built): _calRoadmapFor still reads rmList by typed due", /function _calRoadmapFor\(kid,iso\)\{ return rmList\(kid\)\.filter\(function\(r\)\{ return !r\.done&&r\.due===iso; \}\); \}/.test(rblock));

const writes = [], opened = []; let projCalls = [], renders = 0;
const db = { ref(p) { return { set(v) { writes.push({ op: "set", path: p, val: v }); }, update(v) { writes.push({ op: "update", path: p, val: v }); }, remove() { writes.push({ op: "remove", path: p }); } }; } };
function gwParseDate(iso) { const m = iso.split("-"); return new Date(+m[0], +m[1] - 1, +m[2]); }
function _cbISO(d) { const p = n => String(n).padStart(2, "0"); return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); }
const TODAY = "2026-10-24";
const ctx = {
  console, Date, JSON, Math, Object, Array, String, parseInt, isFinite, window: {}, db, gwParseDate, _cbISO, _todayStr: () => TODAY,
  esc: s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
  cap: s => s.charAt(0).toUpperCase() + s.slice(1),
  currData: { subjects: {}, done: {}, lanes: {}, lastEdit: 0 }, rulesData: null, checked: {}, mom: true, momHere() { return ctx.mom; }, _dryRun: () => false,
  proj: {}, dealt: {},
  lidStamped(kid, sk) { const s = ctx.currData.subjects[kid][sk]; return !!(s && s.doneImportedAt && Array.isArray(s.lessonIds) && Array.isArray(s.lessonSeq) && s.lessonIds.length === s.lessonSeq.length); },
  lidDoneIdx(kid, sk) { if (!ctx.lidStamped(kid, sk)) return null; const s = ctx.currData.subjects[kid][sk]; const node = ((ctx.currData.done[kid] || {})[sk]) || {}; const out = new Set(); s.lessonIds.forEach((id, i) => { if (node[id]) out.add(i); }); return out; },
  planBacked(kid, sk) { const s = ctx.currData.subjects[kid][sk]; return !!(s && s.planId && ctx.lidStamped(kid, sk)); },
  lnOpenCount(kid, sk) { const s = ctx.currData.subjects[kid][sk]; if (!s || s.paused) return 0; if (!ctx.planBacked(kid, sk)) return 0; return Math.max(0, s.lessonSeq.length - ctx.lidDoneIdx(kid, sk).size); },
  lnLanes(kid) { return ctx.currData.lanes[kid] || {}; }, lnUnits(kid, id) { return ((ctx.lnLanes(kid)[id] || {}).units) || []; },
  lnUnitSubs(u) { if (!u) return []; if (u.subs) return u.subs.map(String); return u.sk ? [String(u.sk)] : []; },
  lnUnitOpen(kid, u) { if (u && u.retired) return false; return ctx.lnUnitSubs(u).some(x => ctx.lnOpenCount(kid, x) > 0); },
  lnUp(kid, id) { const us = ctx.lnUnits(kid, id); for (let i = 0; i < us.length; i++) if (ctx.lnUnitOpen(kid, us[i])) return i; return -1; },
  lnRhythm() { return { tpw: 2, allowedDays: ["Tue", "Thu"] }; },
  cbDefaultForm(kid, sk) { const s = ctx.currData.subjects[kid][sk] || {}; return { tpw: s.timesPerWeek || 3, allowedDays: (s.allowedDays || []).slice() }; },
  gvDerivedColumn(kid, sk) { projCalls.push(sk); const p = ctx.proj[sk]; return p === undefined ? null : p; },
  gvFilled: v => !!(v && v !== "—" && String(v).trim()), gvDealtDates(kid, sk) { return ctx.dealt[sk] || {}; },
  cbRemainingContent() { throw new Error("never"); }, ceQuickPause() { throw new Error("never"); }, ceOpenEdit(kid, sk) { opened.push(kid + "/" + sk); },
  fxIsClass(s) { return !!(s && s.fixedTime); }, fxDateList(s) { return (s && Array.isArray(s.fixedDates) && s.fixedDates.length) ? s.fixedDates : null; },
  famProgress: {}, famBlocks: {}, famMaps: {}, famDefs() { return ctx.famBlocks; }, famList(v) { return Array.isArray(v) ? v.filter(Boolean) : (v ? Object.keys(v).map(k => v[k]) : []); },
  famTrack(it) { return (it && it.track && (it.track.mode === "week" || it.track.mode === "seq")) ? it.track : null; }, famLessonMap() { return { byDate: {}, ends: null, none: true }; }, famSheetOpen() {},
  roadmapData: {}, adminPinUnlocked: false, momPinUnlocked: true, renderAll() { renders++; }, gwShowToast() {}, confirm: () => true,
  setInterval: () => 0, clearInterval() {}, showTab() {}, plSetSub() {}, ROSTER: ["kidx", "kidy"], KID_COLOR: {}, lrCap: s => s === "_family" ? "🏡 Family" : s, scList: () => [], ntList: () => [], planOpen: {},
  subjectFinished(kid, sk) { return !!ctx.finished[sk]; }, finished: {},
};
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(block, ctx); vm.runInContext(sblock, ctx); vm.runInContext(rblock, ctx);
const pbA = src.indexOf("function planBarHTML(kid){"), pbZ = src.indexOf("\n}\n", pbA) + 3; vm.runInContext(src.slice(pbA, pbZ), ctx);
const T = name => vm.runInContext(name, ctx), K = "kidx";
function sub(n, o) { const seq = [], ids = []; for (let i = 1; i <= n; i++) { seq.push("Lesson " + i); ids.push("L" + String(i).padStart(4, "0")); } return Object.assign({ display: "Sub", lessonSeq: seq, lessonIds: ids, nextLid: n + 1, doneImportedAt: "2026-09-01", planId: "p1", timesPerWeek: 2, allowedDays: ["Tue", "Thu"] }, o || {}); }
function doneN(sk, n, day) { const node = {}; for (let i = 1; i <= n; i++) node["L" + String(i).padStart(4, "0")] = { day: day || "2026-10-01", ts: (day || "2026-10-01") + "T10:00:00Z" }; (ctx.currData.done[K] = ctx.currData.done[K] || {})[sk] = node; }
let edit = 0;
function reset(subjects, lanes) { ctx.currData = { subjects: { [K]: subjects || {} }, done: {}, lanes: { [K]: lanes || {} }, lastEdit: ++edit }; ctx.proj = {}; ctx.dealt = {}; projCalls = []; ctx.rulesData = null; ctx.roadmapData = {}; ctx.finished = {}; writes.length = 0; vm.runInContext("rmEdit=null", ctx); }
function plus(n) { const d = gwParseDate(TODAY); d.setDate(d.getDate() + n); return _cbISO(d); }
function projTo(iso, lidAt) { const bd = {}; bd[iso] = { text: "Lesson", lid: lidAt ? lidAt[iso] : undefined, src: "plan" }; bd[plus(1)] = { text: "Lesson", src: "plan" }; if (lidAt) Object.keys(lidAt).forEach(d => { bd[d] = { text: "L", lid: lidAt[d], src: "plan" }; }); return { byDate: bd, stats: null, warnings: [] }; }
function typed(rows) { ctx.roadmapData[K] = { roadmap: rows }; }
const row = (o) => Object.assign({ due: "2026-11-02", text: "Append the next book", kind: "append", subject: "s1", done: null }, o || {});

console.log("\n# 6a — the form → link (rmxLinkFromForm)");
{
  reset({ s1: sub(10, { display: "Book One", nextLid: 11 }), nolid: { display: "No ids", lessonSeq: ["a", "b", "c"] } });
  const F = T("rmxLinkFromForm");
  ok("On the date, no match → null (no link, the record is exactly as today)", F(K, { when: "date", subject: "s1", match: "" }) === null && F(K, { subject: "s1" }, null) === null);
  ok("On the date · ticks itself + subject → {sk, when:date, n:nextLid}", JSON.stringify(F(K, { when: "datelink", subject: "s1" }, null)) === JSON.stringify({ sk: "s1", when: "date", n: 11 }), F(K, { when: "datelink", subject: "s1" }));
  ok("running out + subject → {sk, when:ends, n}", JSON.stringify(F(K, { when: "ends", subject: "s1" })) === JSON.stringify({ sk: "s1", when: "ends", n: 11 }));
  ok("a lesson is done + lid → {sk, when:lesson, n, lid}", JSON.stringify(F(K, { when: "lesson", subject: "s1", lid: "L0007" })) === JSON.stringify({ sk: "s1", when: "lesson", n: 11, lid: "L0007" }));
  ok("a lesson is done WITHOUT a lid → falls back to when:date (still linked)", F(K, { when: "lesson", subject: "s1", lid: "" }).when === "date");
  ok("match alone (add, no subject) → {when:date, match}", JSON.stringify(F(K, { when: "date", subject: "", match: " Cursive " })) === JSON.stringify({ when: "date", match: "Cursive" }));
  ok("running out without a subject → needs one: null without a match, {when:date,match} with one", F(K, { when: "ends", subject: "" }) === null && F(K, { when: "ends", subject: "", match: "Python" }).when === "date");
  ok("n: a subject without nextLid falls back to its list length (3)", F(K, { when: "ends", subject: "nolid" }).n === 3);
  ok("editing keeps the old snapshot n for the same subject; a new subject takes a fresh one", F(K, { when: "ends", subject: "s1" }, { link: { sk: "s1", when: "ends", n: 4 } }).n === 4 && F(K, { when: "ends", subject: "s1" }, { link: { sk: "other", when: "ends", n: 4 } }).n === 11);
  ok("match rides along with a subject link", F(K, { when: "ends", subject: "s1", match: "Cursive" }).match === "Cursive");
}

console.log("\n# 6a — rmSave carries link + keepOpen; the form shows the choices");
{
  reset({ s1: sub(10, { display: "Book One", nextLid: 11 }) });
  T("rmNew")(K); T("rmSet")("text", "Book One ends → Book Two"); T("rmSet")("due", "2026-11-02"); T("rmSet")("kind", "swap"); T("rmSet")("subject", "s1"); T("rmSet")("when", "ends"); T("rmSet")("match", "Two");
  let h = T("rmStripHTML")(K);
  ok("form: 'Shows up…' select with On the date / ticks itself (swap) / running out / a lesson is done (subject picked)", /rmPick\('when'/.test(h) && /On the date<\/option>/.test(h) && /ticks itself when done/.test(h) && /When Book One is running out/.test(h) && /When a lesson of Book One is done/.test(h), h.slice(h.indexOf("rmPick('when'"), h.indexOf("rmPick('when'") + 500));
  ok("form: the 'new subject's name contains…' input for swap", /rmSet\('match'/.test(h) && /value="Two"/.test(h));
  T("rmSave")();
  ok("Save = ONE set with link {sk:s1, when:ends, n:11, match:Two}; due/text/kind as today", writes.length === 1 && writes[0].op === "set" && /^plans\/kidx\/roadmap\//.test(writes[0].path) && JSON.stringify(writes[0].val.link) === JSON.stringify({ sk: "s1", when: "ends", n: 11, match: "Two" }) && writes[0].val.due === "2026-11-02" && writes[0].val.kind === "swap" && !("keepOpen" in writes[0].val), writes[0]);
  const id = writes[0].path.split("/")[3]; writes.length = 0;
  T("rmNew")(K); T("rmSet")("text", "Plain note"); T("rmSet")("kind", "note"); T("rmSave")();
  ok("a row without a link saves exactly as before — no link key, no keepOpen key", writes.length === 1 && !("link" in writes[0].val) && !("keepOpen" in writes[0].val), writes[0].val);
  writes.length = 0;
  ctx.roadmapData[K].roadmap[id].keepOpen = true;
  T("rmEditStart")(K, id);
  const f = T("rmEdit").form;
  ok("✏️ loads the link into the form: when ends, match Two, subject s1", f.when === "ends" && f.match === "Two" && f.subject === "s1" && f.lid === "");
  T("rmSet")("text", "Book One ends → Book Two (edited)"); T("rmSave")();
  ok("an edit keeps keepOpen:true and the link (same n)", writes.length === 1 && writes[0].val.keepOpen === true && writes[0].val.link.n === 11 && writes[0].val.link.when === "ends", writes[0].val);
  writes.length = 0;
  T("rmNew")(K); T("rmSet")("kind", "pause"); T("rmSet")("subject", "s1"); T("rmSet")("when", "lesson");
  h = T("rmStripHTML")(K);
  ok("'a lesson is done' → a lesson select listing the list by text, valued by lesson id", /rmSet\('lid'/.test(h) && /<option value="L0007"[^>]*>Lesson 7<\/option>/.test(h));
  T("rmSet")("lid", "L0007"); T("rmSet")("text", "After lesson 7, pause"); T("rmSave")();
  ok("saved with lid", writes.length === 1 && writes[0].val.link.lid === "L0007" && writes[0].val.link.when === "lesson");
  ok("a stored link with when:date shows as 'ticks itself' in the form", (() => { ctx.roadmapData[K].roadmap.zz = row({ link: { sk: "s1", when: "date", n: 11 } }); T("rmEditStart")(K, "zz"); return T("rmEdit").form.when === "datelink"; })());
  T("rmCancel")();
}

console.log("\n# 6a — the effective date and one row per subject");
{
  reset({ s1: sub(10, { display: "Book One" }), e: sub(6, { display: "Empty Book" }), p: sub(10, { display: "Paused Book", paused: true }) });
  doneN("s1", 5); ctx.proj.s1 = projTo(plus(3)); doneN("e", 6, "2026-10-14");
  const E = T("rmxEffDue");
  ok("ends → the subject's run-out day (Tue Oct 27)", E(K, row({ link: { sk: "s1", when: "ends", n: 1 } })) === plus(3));
  ok("ends on an empty list → the last done day", E(K, row({ subject: "e", link: { sk: "e", when: "ends", n: 1 } })) === "2026-10-14");
  ok("ends on a paused subject → her typed due", E(K, row({ subject: "p", due: "2026-12-01", link: { sk: "p", when: "ends", n: 1 } })) === "2026-12-01");
  ok("lesson done → its done day", E(K, row({ link: { sk: "s1", when: "lesson", lid: "L0003", n: 1 } })) === "2026-10-01");
  ctx.proj.s1 = projTo(plus(3), { [plus(9)]: "L0008" }); ctx.currData.lastEdit = ++edit;
  ok("lesson not done → where the Grid projects it", E(K, row({ link: { sk: "s1", when: "lesson", lid: "L0008", n: 1 } })) === plus(9));
  ok("lesson not projected anywhere → her typed due", E(K, row({ due: "2026-12-01", link: { sk: "s1", when: "lesson", lid: "L0010", n: 1 } })) === "2026-12-01");
  ok("no link / no sk → her typed due", E(K, row({})) === "2026-11-02" && E(K, row({ link: { when: "date", match: "x" } })) === "2026-11-02");
  // one row per subject (a fresh world with Book One alone, so the derive has exactly one item)
  reset({ s1: sub(10, { display: "Book One" }) }); doneN("s1", 5); ctx.proj.s1 = projTo(plus(3));
  typed({ r1: row({ due: "2026-10-05", text: "Decide: buy the next book", kind: "note", link: { sk: "s1", when: "ends", n: 1 } }) });
  let h = T("rmStripHTML")(K);
  ok("strip: her 'running out' row stands in for the automatic Book One row (no 'Book One runs out'); the row shows the curriculum's date (Oct 27, not her Oct 5) + 🔗 + the status chip", !/Book One runs out/.test(h) && /Decide: buy the next book/.test(h) && /Oct 27<\/span>/.test(h) && !/Oct 5<\/span>/.test(h) && /🔗/.test(h) && /5 left · Tue Oct 27/.test(h), h);
  ok("rmxShown(kid) drops it; rmxDerive(kid) still has it (the derive is untouched)", T("rmxShown")(K).length === 0 && T("rmxDerive")(K).length === 1);
  h = T("rmWeekHTML")(TODAY);
  ok("Mom's Day: her row shows (this week by its effective date), the automatic row does not; 1 item", /Decide: buy the next book/.test(h) && !/Book One runs out/.test(h) && /1 item</.test(h), h);
  ok("plan bar: no heads-up chip (her row covers it); by its effective date (Tue Oct 27) the row is neither overdue nor this week (Mon-based week ends Sun Oct 25)", !/heads-up/.test(T("planBarHTML")(K)) && !/overdue/.test(T("planBarHTML")(K)) && /1 to do/.test(T("planBarHTML")(K)), T("planBarHTML")(K));
  ctx.roadmapData[K].roadmap.r1.done = 1; ctx.currData.lastEdit = ++edit;
  ok("a done row no longer replaces: the automatic row is back", /Book One runs out/.test(T("rmStripHTML")(K)) && T("rmxShown")(K).length === 1);
  // hot: a linked row with a far typed due still shows when the heads-up would
  reset({ s1: sub(30, { display: "Long Book" }) }); doneN("s1", 24); ctx.proj.s1 = projTo(plus(18));
  typed({ r1: row({ due: "2027-03-01", text: "Order the next one", kind: "add", link: { sk: "s1", when: "ends", n: 1 } }) });
  h = T("rmWeekHTML")(TODAY);
  ok("amber subject (18 days out) → her linked row is on Mom's Day with the Nov date, even though her typed due was March", /Order the next one/.test(h) && /Nov 11/.test(h), h);
  ctx.proj.s1 = projTo(plus(40)); ctx.currData.lastEdit = ++edit;
  ok("…and off Mom's Day when the subject is not a heads-up (40 days out)", T("rmWeekHTML")(TODAY) === "" || !/Order the next one/.test(T("rmWeekHTML")(TODAY)));
  ok("a row typed before this (no link) shows on its typed date and never carries 🔗 / auto", (() => { typed({ r2: row({ due: TODAY, text: "Old row" }) }); const x = T("rmStripHTML")(K); return /Old row/.test(x) && /Sat Oct 24|Oct 24/.test(x) && !/🔗|auto/.test(x); })());
}

console.log("\n# 6b — auto-done per kind");
{
  const A = T("rmxAuto");
  reset({ s1: sub(10, { display: "Book One", nextLid: 11 }), big: sub(40, { display: "Big Book", nextLid: 41 }), cur: { display: "HWT Cursive", lessonSeq: ["a"] }, p: sub(10, { display: "Paused Book", paused: true, pausedSince: "2026-10-03T12:00:00.000Z" }) });
  doneN("s1", 5); ctx.proj.s1 = projTo(plus(3)); doneN("big", 10);
  ok("append: list grew (nextLid 41 > n 27) and not running out → met, 'list grew — now runs to Lesson 40'", (r => r.met && r.why === "list grew — now runs to Lesson 40")(A(K, row({ subject: "big", link: { sk: "big", when: "ends", n: 27 } }))), A(K, row({ subject: "big", link: { sk: "big", when: "ends", n: 27 } })));
  ok("append: list grew but STILL running out (Book One, 5 left) → not met", !A(K, row({ link: { sk: "s1", when: "ends", n: 4 } })).met);
  ok("append: list did not grow (n 41) → not met; no n → not met", !A(K, row({ subject: "big", link: { sk: "big", when: "ends", n: 41 } })).met && !A(K, row({ subject: "big", link: { sk: "big", when: "ends" } })).met);
  ok("pause: subject paused → met, 'paused Oct 3'", (r => r.met && r.why === "paused Oct 3")(A(K, row({ kind: "pause", subject: "p", link: { sk: "p", when: "date", n: 1 } }))));
  ok("pause: subject live → not met; subject gone → met", !A(K, row({ kind: "pause", link: { sk: "s1", when: "date", n: 1 } })).met && (r => r.met && /gone/.test(r.why))(A(K, row({ kind: "pause", link: { sk: "zzz", when: "date", n: 1 } }))));
  ok("add: a subject whose name contains the match (case-insensitive) → met, 'HWT Cursive is in the Builder'", (r => r.met && r.why === "HWT Cursive is in the Builder")(A(K, row({ kind: "add", subject: "", link: { when: "date", match: "cursive" } }))));
  ok("add: no such subject → not met", !A(K, row({ kind: "add", link: { when: "date", match: "Python" } })).met);
  ok("swap: old paused + a match exists → met with both halves", (r => r.met && r.why === "Paused Book paused Oct 3 · HWT Cursive is in the Builder")(A(K, row({ kind: "swap", subject: "p", link: { sk: "p", when: "ends", n: 1, match: "Cursive" } }))));
  ok("swap: old still live → not met even with a match", !A(K, row({ kind: "swap", link: { sk: "s1", when: "ends", n: 1, match: "Cursive" } })).met);
  ok("swap: old paused, no match → not met (nothing follows)", !A(K, row({ kind: "swap", subject: "p", link: { sk: "p", when: "ends", n: 1 } })).met);
  reset({ a: sub(10, { display: "Book A" }), b: sub(20, { display: "Book B" }) }, { L1: { units: [{ sk: "a" }, { sk: "b" }] } }); doneN("a", 10); ctx.finished.a = true;
  ok("swap: old finished and its lane has a later unit with lessons → met, '… · Book B follows in its lane'", (r => r.met && r.why === "Book A finished · Book B follows in its lane")(A(K, row({ kind: "swap", subject: "a", link: { sk: "a", when: "ends", n: 1 } }))), A(K, row({ kind: "swap", subject: "a", link: { sk: "a", when: "ends", n: 1 } })));
  ok("edit / note: never, even linked", !A(K, row({ kind: "note", link: { sk: "a", when: "ends", n: 1 } })).met && !A(K, row({ kind: "edit", link: { sk: "a", when: "ends", n: 1, match: "Book" } })).met);
  ok("no link → never", !A(K, row({ kind: "pause", subject: "a" })).met);
  ctx.rulesData = { headsUp: { autoDone: false } };
  ok("autoDone off (family) → never", !A(K, row({ kind: "swap", subject: "a", link: { sk: "a", when: "ends", n: 1 } })).met);
  ctx.rulesData = { headsUp: { kid: { [K]: { autoDone: false } } } };
  ok("autoDone off for the kid → never for that kid", !A(K, row({ kind: "swap", subject: "a", link: { sk: "a", when: "ends", n: 1 } })).met);
  ctx.rulesData = null;
}

console.log("\n# 6b — display and her ticks");
{
  reset({ p: sub(10, { display: "Paused Book", paused: true, pausedSince: "2026-10-03T12:00:00.000Z" }), cur: { display: "HWT Cursive", lessonSeq: ["a"] } });
  typed({ r1: row({ due: "2026-10-06", text: "Printing ends → add Cursive", kind: "swap", subject: "p", link: { sk: "p", when: "date", n: 1, match: "Cursive" } }), r2: row({ due: "2026-10-05", text: "Hand row", kind: "note", subject: "" }) });
  vm.runInContext("rmShowDone={kidx:true}", ctx);   // unfold the done rows so the auto-done one is visible
  let h = T("rmStripHTML")(K);
  ok("the auto-done row draws as done — struck through, '✓ auto · Paused Book paused Oct 3 · HWT Cursive is in the Builder', ✓ titled 'Not yet'", /line-through[^>]*>🔁 Printing ends/.test(h) && /✓ auto · Paused Book paused Oct 3 · HWT Cursive is in the Builder/.test(h) && /title="Not yet — keep it open"/.test(h), h);
  ok("it sits in the done fold ('1 done'); the hand row is open and overdue", /(Show|Hide) 1 done/.test(h) && /1 to do/.test(h) && /1 overdue/.test(h));
  ok("Mom's Day: the auto-done row is not drawn (like a done row); the hand row is", (x => !/Printing ends/.test(x) && /Hand row/.test(x))(T("rmWeekHTML")(TODAY)));
  writes.length = 0; T("rmDone")(K, "r1");
  ok("her untick of the auto-done row → ONE update {keepOpen:true}, nothing else", writes.length === 1 && writes[0].op === "update" && writes[0].path === "plans/kidx/roadmap/r1" && JSON.stringify(writes[0].val) === JSON.stringify({ keepOpen: true }), writes);
  h = T("rmStripHTML")(K);
  ok("…the row is open again, marked 'kept open', and the automatic condition no longer draws it done", /kept open/.test(h) && !/✓ auto/.test(h) && /2 to do/.test(h), h);
  writes.length = 0; T("rmDone")(K, "r1");
  ok("ticking it again → {done:ts, keepOpen:null}", writes.length === 1 && typeof writes[0].val.done === "number" && writes[0].val.keepOpen === null && Object.keys(writes[0].val).sort().join() === "done,keepOpen", writes);
  writes.length = 0; T("rmDone")(K, "r1");
  ok("unticking a hand-done row → {done:null} as today", writes.length === 1 && JSON.stringify(writes[0].val) === JSON.stringify({ done: null }));
  writes.length = 0; T("rmDone")(K, "r2");
  ok("a hand tick on a plain row → {done:ts} as today", writes.length === 1 && Object.keys(writes[0].val).join() === "done" && typeof writes[0].val.done === "number");
  writes.length = 0; vm.runInContext("_dryRun=function(){return true}", ctx); T("rmDone")(K, "r1"); vm.runInContext("_dryRun=function(){return false}", ctx);
  ok("dry run → no write", writes.length === 0);
  ok("the ⚙ panel offers autoDone (family + per kid) and writes it as one leaf", (() => { vm.runInContext("_rmxPanel=true", ctx); const x = T("rmWeekHTML")(TODAY); writes.length = 0; T("rmxRuleSet")("", "autoDone", false); return x.indexOf("rmxRuleSet('','autoDone'") >= 0 && x.indexOf("rmxRuleSet('kid/kidx','autoDone'") >= 0 && writes.length === 1 && writes[0].path === "config/rules/headsUp/autoDone" && writes[0].val === false; })(), writes);
  vm.runInContext("_rmxPanel=false", ctx); ctx.rulesData = null;
}

console.log("\n# writes audit");
ok("every recorded write was her own tap: plans/<kid>/roadmap/<id> or one config/rules/headsUp leaf", writes.every(w => /^plans\/kidx\/roadmap\/[^/]+$/.test(w.path) || /^config\/rules\/headsUp\/.+/.test(w.path)), writes.filter(w => !/^plans\/kidx\/roadmap\/[^/]+$/.test(w.path)));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
