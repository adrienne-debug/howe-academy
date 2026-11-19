/*
 * ⏸ FTPAUSE — Pause / Resume, with dates, for every Family Time subject (beta mom's ask 2026-11-19, approved by Adrienne:
 *   "Christmas school" in December — pause Science and History for the month, pick up where they left off in January).
 * Made-up family: two kids, one block (History week by week, Science in order, Read Aloud with no lessons, a unit in order),
 * a school calendar with Thanksgiving week and a winter break off. Real FAMBLOCK + FAMTOGETHER + FAMBLOCKOUT + FAMLESSONS +
 * FAMDAYSTART + UNITFT (with FTPAUSE inside) code; the clock is faked (America/New_York).
 *   run: node test_famtime_pause.js
 */
process.env.TZ = "America/New_York";
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const J = x => JSON.stringify(x);

const KIDS = ["kida", "kidb"];
const BLOCK = () => ({ name: "Together", kids: KIDS.slice(), days: ["Mon", "Tue", "Wed", "Thu", "Fri"], at: "1:00 PM",
  items: [{ key: "hist", name: "History", minutes: 30, track: { mode: "week", book: "Book", startDate: "2026-11-02", startWeek: 1, total: 30, days: { Mon: "Day 1", Tue: "Day 2", Wed: "Day 3", Thu: "Map", Fri: "Fun" } } },
    { key: "sci", name: "Science", minutes: 30, track: { mode: "seq", list: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40].map(n => ({ t: "Lesson " + n, n: 1 })) } },
    { key: "ra", name: "Read Aloud", minutes: 20 },
    { key: "un", name: "Bugs", minutes: 30, track: { mode: "seq", list: [1, 2, 3, 4, 5, 6].map(n => ({ t: "Day " + n, n: 1, u: { id: "bugs", d: "d" + n } })) } }] });
// school dates: weekdays Nov 2 – Jan 29, but not Thanksgiving week (Nov 23–27) or Dec 21 – Jan 1
const SCHOOL = (() => { const out = []; const d = new Date(2026, 10, 2); while (d <= new Date(2027, 0, 29)) { const s = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  if (d.getDay() >= 1 && d.getDay() <= 5 && !(s >= "2026-11-23" && s <= "2026-11-27") && !(s >= "2026-12-21" && s <= "2027-01-01")) out.push(s); d.setDate(d.getDate() + 1); } return out; })();
const DN = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const toMin = t => { const m = String(t || "").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i); if (!m) return NaN; let h = +m[1]; const ap = (m[3] || "").toUpperCase(); if (ap === "PM" && h !== 12) h += 12; if (ap === "AM" && h === 12) h = 0; return h * 60 + (+m[2]); };
const fromMin = v => { let h = Math.floor(v / 60), m = v % 60; const ap = h >= 12 ? "PM" : "AM"; let hh = h % 12; if (hh === 0) hh = 12; return hh + ":" + String(m).padStart(2, "0") + " " + ap; };

function world(o) {
  o = o || {}; const writes = [], relays = [];
  const RealDate = Date; const NOW = new RealDate(o.now || "2026-11-19T10:00:00");
  class FakeDate extends RealDate { constructor(...a) { if (a.length) super(...a); else super(NOW.getTime()); } static now() { return NOW.getTime(); } }
  const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const today = iso(NOW), todayDay = DN[NOW.getDay()];
  const mon = (() => { const d = new RealDate(NOW.getTime()); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; })();
  const BOARD = {}; ["monday", "tuesday", "wednesday", "thursday", "friday"].forEach((dn, i) => { const d = new RealDate(mon.getTime()); d.setDate(d.getDate() + i); BOARD[dn] = iso(d); });
  const lessons = { kida: {} }; SCHOOL.forEach((d, i) => lessons.kida[i] = { date: d, week: "Wk" });
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date: FakeDate, parseInt, isNaN, isFinite, setTimeout: () => 0, clearTimeout: () => {},
    window: { HA_FAMILY: { familyId: "testfam" } }, ROSTER: KIDS.slice(), KID_COLOR: {}, unitStudies: {},
    rulesData: { schoolDay: { defaultStart: "9:00 AM", defaultEnd: "4:00 PM", lunchStart: "12:00 PM", lunchEnd: "1:00 PM" }, familyBlocks: { ft: o.block || BLOCK() } },
    currData: { subjects: { kida: { math: { display: "Math", paused: false, minutes: 30 }, art: { display: "Art", paused: true, pausedSince: "2026-11-01" } } }, lessons },
    masteryData: {}, weekData: { tasks: o.tasks || [] }, checked: o.checked || {}, claimed: {}, histState: {}, archive: {}, blockouts: {},
    WK: "week9", _todayDay: todayDay, lastTasksWrite: 0, rulesOpen: {}, gvShowPast: false,
    momHere: () => o.mom !== false, _dryRun: () => !!o.dry, renderAll: () => {}, renderAllSoon: () => {}, dbg: () => {}, gwShowToast: () => {}, sv: () => {},
    db: { ref: p => ({ set: v => writes.push({ op: "set", p, v: JSON.parse(J(v === undefined ? null : v)) }), update: v => writes.push({ op: "update", p, v: JSON.parse(J(v)) }), remove: () => writes.push({ op: "remove", p }), transaction: () => writes.push({ op: "tx", p }) }) },
    fbArr: v => v, cap: s => s ? s[0].toUpperCase() + s.slice(1) : s, esc: s => String(s == null ? "" : s).replace(/</g, "&lt;"), toMin, fromMin,
    gwParseDate: s => { const p = s.split("-"); return new FakeDate(+p[0], +p[1] - 1, +p[2]); },
    cbTodayISO: () => today, routineDateISO: dn => BOARD[dn] || null,
    smapIsKidOff: () => false, coopTimedEndMin: () => 0, FX_DOW: { monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun" },
    confirm: () => true };
  ctx.relayWeek = (why, info) => relays.push({ why, info: JSON.parse(J(info || {})) });
  vm.createContext(ctx);
  vm.runInContext([cut("// FAMBLOCK_START", "// FAMBLOCK_END"), cut("// FAMTOGETHER_START", "// FAMTOGETHER_END"), cut("// FAMBLOCKOUT_START", "// FAMBLOCKOUT_END"),
    cut("// FAMLESSONS_START", "// FAMLESSONS_END"), cut("// FAMDAYSTART_START", "// FAMDAYSTART_END"), cut("// UNITFT_START", "// UNITFT_END"),
    "Object.defineProperty(this,'famProgress',{get:()=>famProgress,set:v=>{famProgress=v;}});"].join("\n"), ctx);
  ctx.famProgress = o.prog || { ft: { sci: { done: 10 } } };
  const B = () => ctx.rulesData.familyBlocks.ft, IT = k => B().items.find(x => x.key === k);
  const map = k => ctx.famLessonMap(B(), "ft", IT(k));
  const lbl = (k, d) => map(k).byDate[d] || "";
  const cards = ds => ctx.famDayCards(DN[new RealDate(ds + "T12:00:00").getDay()], ds, null).filter(c => c.who === "kida").map(c => c.k + "@" + fromMin(c.s));
  const pf = k => ctx.uftRelayFams({ fams: [{ id: "ft", key: k }] });
  return { ctx, writes, relays, B, IT, map, lbl, cards, pf, today, BOARD };
}
const P = "config/rules/familyBlocks/ft/items/";
const fwrites = w => w.writes.filter(x => x.p.indexOf("config/rules/familyBlocks/") === 0);

console.log("── 0. nothing paused: the gate stays out of the way ──");
{
  const w = world();
  ok("no pause → the item is not the gate's (uftTr null), History's startDate is not read as a unit start", w.ctx.uftTr(w.IT("hist")) === null && w.ctx.uftTr(w.IT("sci")) === null && w.ctx.uftTr(w.IT("ra")) === null);
  const real = SCHOOL.map(d => J(w.cards(d))), mapH = J(w.map("hist")), mapS = J(w.map("sci"));
  w.ctx.uftOnDay = () => true; w.ctx._famLmMemo = {}; w.ctx._famRdCache = { t: 0, v: {} };
  ok("every school day lays exactly the cards it would with no gate at all", J(SCHOOL.map(d => J(w.cards(d)))) === J(real));
  ok("…and both lesson maps are the same", J(w.map("hist")) === mapH && J(w.map("sci")) === mapS);
  ok("the editor shows ⏸ Pause on History, Science and a subject with no lessons", ["hist", "sci"].every((k, i) => /⏸ Pause/.test(w.ctx.famLessonsEditorHTML("ft", w.B(), w.IT(k), i, true))) && /⏸ Pause/.test(w.ctx.famLessonsEditorHTML("ft", w.B(), w.IT("ra"), 2, true)));
}

console.log("── 1. pause WITH a resume date: Pause from Tue Dec 1, Resume on Mon Jan 4 (set on Thu Nov 19) ──");
{
  const w = world();
  const before = { s30: w.lbl("sci", "2026-11-30"), h30: w.lbl("hist", "2026-11-30") };
  ok("Science: three leaves under its item — paused, pauseFrom, resumeOn — never the item or the node", w.ctx.uftPauseDates("ft", "sci", "2026-12-01", "2027-01-04") &&
    J(fwrites(w).map(x => x.p + "=" + J(x.v))) === J([P + "1/track/paused=true", P + "1/track/pauseFrom=\"2026-12-01\"", P + "1/track/resumeOn=\"2027-01-04\""]), fwrites(w));
  ok("…then the one re-lay door with an Undo of each leaf (none were there)", w.relays.length === 1 && w.relays[0].why === "famtime" && J(w.relays[0].info.fams) === J([{ id: "ft", key: "sci" }]) && w.relays[0].info.undo.length === 3 && w.relays[0].info.undo.every(u => u.gone));
  w.ctx.uftPauseDates("ft", "hist", "2026-12-01", "2027-01-04");
  ok("the words: ⏸ Paused Dec 1 – Jan 3 (the day before she's back)", w.ctx.uftWords(w.IT("sci")) === "⏸ Paused Dec 1 – Jan 3" && w.ctx.uftWords(w.IT("hist")) === "⏸ Paused Dec 1 – Jan 3", w.ctx.uftWords(w.IT("sci")));
  ok("…on the Family Time editor (status line), the kid's Together strip and the Grid column", /⏸ Paused Dec 1 – Jan 3/.test(w.ctx.famLessonsEditorHTML("ft", w.B(), w.IT("sci"), 1, false)) && /⏸ Paused Dec 1 – Jan 3/.test(w.ctx.famGridStripHTML("kida")) && /⏸ Paused Dec 1 – Jan 3/.test(w.ctx.uftGridTag(w.IT("hist"))));
  ok("Mon Nov 30 still runs as before: History 1:00, Science 1:30, Read Aloud 2:00, Bugs 2:20", J(w.cards("2026-11-30")) === J(["hist@1:00 PM", "sci@1:30 PM", "ra@2:00 PM", "un@2:20 PM"]), w.cards("2026-11-30"));
  const dec = SCHOOL.filter(d => d >= "2026-12-01" && d < "2027-01-04");
  ok("every December school day: no History, no Science — the block closes up (Read Aloud 1:00, Bugs 1:20)", dec.length === 14 && dec.every(d => J(w.cards(d)) === J(["ra@1:00 PM", "un@1:20 PM"])), dec.map(d => d + " " + w.cards(d)));
  ok("Mon Jan 4: both are back at their places", J(w.cards("2027-01-04")) === J(["hist@1:00 PM", "sci@1:30 PM", "ra@2:00 PM", "un@2:20 PM"]));
  ok("the Grid cell for a December day is empty (not a run day)", !w.ctx.famCellState(w.B(), w.IT("sci"), "2026-12-08").runs && w.ctx.famCellState(w.B(), w.IT("sci"), "2027-01-05").runs);
  ok("Science (in order, done 10: Nov 19 = 11, Nov 20 = 12): Nov 30 = Lesson 13 (unchanged), Jan 4 = Lesson 14 — the very next one", before.s30 === "Lesson 13" && w.lbl("sci", "2026-11-30") === "Lesson 13" && w.lbl("sci", "2027-01-04") === "Lesson 14" && w.lbl("sci", "2027-01-05") === "Lesson 15", [before.s30, w.lbl("sci", "2027-01-04")]);
  ok("History (week by week): Nov 30 = Wk 4 · Day 1 (unchanged); Jan 4 = Wk 5 · Day 1 — December weeks don't count", before.h30 === "Book Wk 4 · Day 1" && w.lbl("hist", "2026-11-30") === "Book Wk 4 · Day 1" && w.lbl("hist", "2027-01-04") === "Book Wk 5 · Day 1" && w.lbl("hist", "2027-01-11") === "Book Wk 6 · Day 1", [w.lbl("hist", "2026-11-30"), w.lbl("hist", "2027-01-04")]);
  ok("no December date has a lesson in either map", Object.keys(w.map("sci").byDate).concat(Object.keys(w.map("hist").byDate)).every(d => !(d >= "2026-12-01" && d < "2027-01-04")));
  ok("Read Aloud and the unit are untouched (no pause leaves)", !w.IT("ra").track && !w.IT("un").track.paused);
  // first day back, with the make-up setting on: nothing in December is owed
  const j = world({ now: "2027-01-04T09:00:00", prog: { ft: { sci: { done: 12 } } } });
  ["sci", "hist"].forEach(k => Object.assign(j.IT(k).track, { paused: true, pauseFrom: "2026-12-01", resumeOn: "2027-01-04", missed: "next", missedFrom: "2026-12-01" }));
  ok("Jan 4, make-ups on from Dec 1: nothing owed (paused days are not missed), Science = Lesson 13, History = Wk 5 · Day 1", J(j.map("sci").owed) === "[]" && J(j.map("hist").owed) === "[]" && j.lbl("sci", "2027-01-04") === "Lesson 13" && j.lbl("hist", "2027-01-04") === "Book Wk 5 · Day 1", [j.map("sci").owed, j.lbl("sci", "2027-01-04")]);
  ok("…and the words are gone once she's back", j.ctx.uftWords(j.IT("sci")) === "");
}

console.log("── 2. pause WITHOUT a resume date, then ▶ Resume ──");
{
  const w = world();
  ok("Pause from Dec 1, no resume date: resumeOn is not written (no leaf to remove)", w.ctx.uftPauseDates("ft", "sci", "2026-12-01", "") && J(fwrites(w).map(x => x.p)) === J([P + "1/track/paused", P + "1/track/pauseFrom"]) && w.ctx.uftWords(w.IT("sci")) === "⏸ Paused from Dec 1", fwrites(w));
  ok("it stays paused: nothing in December or January", ["2026-12-01", "2027-01-04", "2027-01-29"].every(d => w.cards(d).indexOf("sci@1:30 PM") < 0 && !w.ctx.famCellState(w.B(), w.IT("sci"), d).runs));
  ok("the row says so and offers ✕ Don't pause (it hasn't begun) and a Resume on date", (() => { const h = w.ctx.uftControlsHTML("ft", "sci"); return /⏸ Paused from Dec 1/.test(h) && /Don’t pause/.test(h) && /When you tap ▶ Resume it picks up with the next lesson/.test(h) && /uftPauseSet\('ft','sci','resumeOn'/.test(h); })());
  // Wed Dec 9: Mom taps ▶ Resume
  const r = world({ now: "2026-12-09T08:00:00", prog: { ft: { sci: { done: 12 } } } }); Object.assign(r.IT("sci").track, { paused: true, pauseFrom: "2026-12-01" });
  Object.assign(r.IT("hist").track, { paused: true, pauseFrom: "2026-12-07" });
  ok("on Wed Dec 9 the row shows ▶ Resume", /▶ Resume/.test(r.ctx.uftControlsHTML("ft", "sci")));
  ok("▶ Resume after it began: ONE leaf, resumeOn = today — the paused days stay paused", r.ctx.uftResume("ft", "sci") && J(fwrites(r).map(x => x.p + "=" + J(x.v))) === J([P + "1/track/resumeOn=\"2026-12-09\""]) && r.IT("sci").track.paused === true, fwrites(r));
  ok("Science: Dec 1–8 still no lesson; today Dec 9 = Lesson 13, the next one", ["2026-12-01", "2026-12-08"].every(d => !r.lbl("sci", d)) && r.lbl("sci", "2026-12-09") === "Lesson 13" && J(r.cards("2026-12-09")).indexOf("sci") >= 0, r.lbl("sci", "2026-12-09"));
  r.ctx.uftResume("ft", "hist");
  ok("History paused Mon Dec 7, resumed Wed Dec 9: Nov 30 week = Wk 4; this week is Wk 5 starting at Wed's role (Day 3) — no week skipped, none repeated", r.lbl("hist", "2026-11-30") === "Book Wk 4 · Day 1" && r.lbl("hist", "2026-12-09") === "Book Wk 5 · Day 3" && r.lbl("hist", "2026-12-14") === "Book Wk 6 · Day 1", [r.lbl("hist", "2026-12-09"), r.lbl("hist", "2026-12-14")]);
  ok("…and that pause counts as cutting a book week short (it ended on a Wednesday)", r.ctx.uftPauseCuts(r.B(), r.IT("hist"), r.IT("hist").track) === true);
  const c = world(); c.ctx.uftPauseDates("ft", "sci", "2026-12-01", ""); c.writes.length = 0;
  ok("✕ Don't pause before it begins: the three leaves removed (null), as if it never was", c.ctx.uftResume("ft", "sci") && J(fwrites(c).map(x => x.p + "=" + J(x.v))) === J([P + "1/track/paused=null", P + "1/track/pauseFrom=null"]) && !c.IT("sci").track.paused && c.ctx.uftTr(c.IT("sci")) === null, fwrites(c));
}

console.log("── 3. a pause starting MID-WEEK, inside the board week (Mon Dec 7 – Fri Dec 11; today Mon Dec 7, 9 AM) ──");
{
  // the board week as built: History / Science / Read Aloud for both kids every day; Monday's Science already checked
  const tasks = []; let n = 0;
  ["monday", "tuesday", "wednesday", "thursday", "friday"].forEach(dn => [["hist", "1:00 PM", 30], ["sci", "1:30 PM", 30], ["ra", "2:00 PM", 20]].forEach(x => KIDS.forEach(k => tasks.push({ id: "t" + (n++), who: k, day: dn, time: x[1], dur: x[2], title: "🏡 " + x[0], mom: "none", cascade: true, device: "paper", famBlock: "ft", famItem: x[0] }))));
  const own = { id: "own1", who: "kida", day: "thursday", time: "9:00 AM", dur: 30, title: "Math", subjectKey: "math" }; tasks.push(own);
  const w = world({ now: "2026-12-07T09:00:00", tasks, prog: { ft: { sci: { done: 10 } } } });
  const thuSci = tasks.find(t => t.day === "thursday" && t.famItem === "sci" && t.who === "kida"); w.ctx.checked[thuSci.id] = "1:55 PM";   // done early, ahead of the pause
  ok("Pause Science from Wed Dec 9 to Mon Dec 14", w.ctx.uftPauseDates("ft", "sci", "2026-12-09", "2026-12-14"));
  const r = w.pf("sci");
  const left = d => w.ctx.weekData.tasks.filter(t => t.famItem === "sci" && t.day === d).length;
  ok("pass F: Wed + Fri open Science cards off (4), Thu's checked card stays, Thu's other kid's open one off (1)", r.removed.length === 5 && left("wednesday") === 0 && left("friday") === 0 && left("thursday") === 1 && w.ctx.weekData.tasks.some(t => t.id === thuSci.id), r.removed);
  ok("Mon + Tue Science cards stay (before the pause)", left("monday") === 2 && left("tuesday") === 2);
  ok("one targeted multi-path update of week9/tasks/<id> → null — never the node", (() => { const u = w.writes.filter(x => /^week9/.test(x.p)); return u.length === 1 && u[0].op === "update" && u[0].p === "week9/tasks" && Object.keys(u[0].v).length === 5 && Object.values(u[0].v).every(v => v === null); })());
  ok("History, Read Aloud and the kid's own Math card untouched", w.ctx.weekData.tasks.filter(t => t.famItem === "hist").length === 10 && w.ctx.weekData.tasks.filter(t => t.famItem === "ra").length === 10 && w.ctx.weekData.tasks.includes(own));
  ok("Science lessons: Mon Dec 7 = Lesson 11, Tue = Lesson 12, Mon Dec 14 = Lesson 13 (no gap, no repeat)", w.lbl("sci", "2026-12-07") === "Lesson 11" && w.lbl("sci", "2026-12-08") === "Lesson 12" && w.lbl("sci", "2026-12-14") === "Lesson 13", [w.lbl("sci", "2026-12-08"), w.lbl("sci", "2026-12-14")]);
  ok("next week's build (famDayCards with the date): Science back Mon Dec 14", w.cards("2026-12-14").indexOf("sci@1:30 PM") >= 0 && w.cards("2026-12-11").indexOf("sci@1:30 PM") < 0);
  // week by week, mid-week: the note shows; from a Monday it doesn't
  const h = world(); h.ctx.uftPauseDates("ft", "hist", "2026-12-02", "2027-01-04");
  ok("History paused from a Wednesday: the row says that book week is cut short", h.ctx.uftPauseCuts(h.B(), h.IT("hist"), h.IT("hist").track) && /book week is cut short/.test(h.ctx.uftControlsHTML("ft", "hist")));
  const m = world(); m.ctx.uftPauseDates("ft", "hist", "2026-11-30", "2027-01-04");
  ok("…from a Monday to a Monday: no note, and Jan 4 is the very next book week (Wk 4 · Day 1)", !m.ctx.uftPauseCuts(m.B(), m.IT("hist"), m.IT("hist").track) && !/cut short/.test(m.ctx.uftControlsHTML("ft", "hist")) && m.lbl("hist", "2027-01-04") === "Book Wk 4 · Day 1", m.lbl("hist", "2027-01-04"));
  ok("in-order Science never shows the note", !m.ctx.uftPauseCuts(m.B(), m.IT("sci"), Object.assign({}, m.IT("sci").track, { paused: true, pauseFrom: "2026-12-02" })));
}

console.log("── 4. dry run: the pause and the week build write nothing ──");
{
  const tasks = [{ id: "a1", who: "kida", day: "wednesday", time: "1:30 PM", dur: 30, title: "🏡 sci", famBlock: "ft", famItem: "sci" }];
  const w = world({ dry: true, now: "2026-12-07T09:00:00", tasks });
  ok("?dryrun=1: Pause + pass F → this device's memory only (Wed's card off, Mon/Tue laid), nothing to the database", w.ctx.uftPauseDates("ft", "sci", "2026-12-09", "2026-12-14") && (w.pf("sci"), true) && w.writes.length === 0 && w.IT("sci").track.pauseFrom === "2026-12-09" && !w.ctx.weekData.tasks.some(t => t.id === "a1") && w.ctx.weekData.tasks.every(t => t.day === "monday" || t.day === "tuesday"), w.writes);
  const before = w.writes.length; SCHOOL.forEach(d => w.cards(d));
  ok("the week build's family cards (famDayCards for every school day) write nothing", w.writes.length === before && before === 0);
  ok("▶ Resume in dry run writes nothing either", w.ctx.uftResume("ft", "sci") && w.writes.length === 0);
}

console.log("── 5. unit items still pause as before ──");
{
  const w = world();
  w.IT("un").track.paused = true;   // a unit paused before dates existed
  ok("an old pause with no dates: every day off, the words '⏸ paused', no date row", w.ctx.uftWords(w.IT("un")) === "⏸ paused" && ["2026-11-19", "2026-12-08", "2027-01-04"].every(d => !w.ctx.famCellState(w.B(), w.IT("un"), d).runs) && !/Pause from/.test(w.ctx.uftControlsHTML("ft", "un")) && /▶ Resume/.test(w.ctx.uftControlsHTML("ft", "un")));
  ok("▶ Resume: the leaf removed, back every day", w.ctx.uftResume("ft", "un") && fwrites(w).some(x => x.p === P + "3/track/paused" && x.v === null) && w.ctx.famCellState(w.B(), w.IT("un"), "2026-11-20").runs);
  ok("⏸ Pause on a unit (uftPause on) = from today, until ▶ Resume — the same leaves", w.ctx.uftPause("ft", "un", true) && w.IT("un").track.pauseFrom === "2026-11-19" && !w.IT("un").track.resumeOn && !w.ctx.famCellState(w.B(), w.IT("un"), "2026-11-20").runs);
  ok("▶ Resume the same day: no pause left at all", w.ctx.uftPause("ft", "un", false) && !w.IT("un").track.paused && !w.IT("un").track.pauseFrom);
  w.IT("un").track.startDate = "2026-12-07"; w.IT("un").track.perWeek = 2;
  ok("a unit's start and pace still apply (not before Dec 7; 2 a week)", !w.ctx.famCellState(w.B(), w.IT("un"), "2026-12-04").runs && w.ctx.famCellState(w.B(), w.IT("un"), "2026-12-07").runs && w.ctx.famCellState(w.B(), w.IT("un"), "2026-12-08").runs && !w.ctx.famCellState(w.B(), w.IT("un"), "2026-12-09").runs);
  w.ctx.uftPauseDates("ft", "un", "2026-12-08", "2026-12-10");
  ok("a dated pause on a paced unit: Tue paused, so Wed + Thu make that week's 2 (a paused day isn't one of the week's runs)", w.ctx.famCellState(w.B(), w.IT("un"), "2026-12-07").runs && !w.ctx.famCellState(w.B(), w.IT("un"), "2026-12-08").runs && !w.ctx.famCellState(w.B(), w.IT("un"), "2026-12-09").runs && w.ctx.famCellState(w.B(), w.IT("un"), "2026-12-10").runs && !w.ctx.famCellState(w.B(), w.IT("un"), "2026-12-11").runs);
  ok("the unit row keeps Starts on and Runs on, with the pause row under them", (() => { const h = w.ctx.uftControlsHTML("ft", "un"); return /Starts on/.test(h) && /Runs on/.test(h) && /⏸ Paused Dec 8 – Dec 9/.test(h); })());
}

console.log("── 6. kid subjects untouched; guards; the next pause keeps the last one ──");
{
  const w = world(); const kidSubs = J(w.ctx.currData.subjects);
  w.ctx.uftPauseDates("ft", "sci", "2026-12-01", "2027-01-04"); w.ctx.uftPauseDates("ft", "hist", "2026-12-01", ""); w.ctx.uftResume("ft", "hist");
  ok("a kid's own subjects (and their own pause) are not read or changed", J(w.ctx.currData.subjects) === kidSubs);
  ok("every write is a leaf under config/rules/familyBlocks/ft/items/<i>/track/ — nothing else", w.writes.length > 0 && w.writes.every(x => x.op === "set" && x.p.indexOf(P) === 0 && /\/track\/(paused|pauseFrom|resumeOn|pausedBefore\/[\d-]+)$/.test(x.p)), w.writes.map(x => x.p));
  const n0 = world({ mom: false }); const nW = n0.writes.length;
  ok("not Mom → nothing written, no row", n0.ctx.uftPauseDates("ft", "sci", "2026-12-01", "2027-01-04") === false && n0.writes.length === nW && n0.ctx.uftControlsHTML("ft", "sci") === "");
  const g = world();
  ok("a past 'Pause from' becomes today; a resume date on or before it is refused", g.ctx.uftPauseDates("ft", "sci", "2026-11-02", "") && g.IT("sci").track.pauseFrom === "2026-11-19" && world().ctx.uftPauseDates("ft", "sci", "2026-12-01", "2026-12-01") === false);
  ok("changing the dates in place: Resume on → Jan 11 (one leaf), blank → until ▶ Resume (leaf removed); a past date refused", (() => { const v = world(); v.ctx.uftPauseDates("ft", "sci", "2026-12-01", "2027-01-04"); v.writes.length = 0;
    const a = v.ctx.uftPauseSet("ft", "sci", "resumeOn", "2027-01-11") && J(v.writes.map(x => x.p + "=" + J(x.v))) === J([P + "1/track/resumeOn=\"2027-01-11\""]);
    const b = v.ctx.uftPauseSet("ft", "sci", "resumeOn", "") && v.writes[1].v === null && !v.IT("sci").track.resumeOn;
    return a && b && v.ctx.uftPauseSet("ft", "sci", "pauseFrom", "2026-11-02") === false && v.ctx.uftPauseSet("ft", "sci", "pauseFrom", "2026-12-07") && v.IT("sci").track.pauseFrom === "2026-12-07"; })());
  // March: Dec 1 → Jan 4 is over; a new pause keeps December paused, so the book weeks still count right
  const s = world({ now: "2027-01-20T09:00:00" }); Object.assign(s.IT("hist").track, { paused: true, pauseFrom: "2026-12-01", resumeOn: "2027-01-04" });
  const wk = s.lbl("hist", "2027-01-25");
  ok("a new pause after the last is over: the last moves to pausedBefore/<from> (one leaf) and its days stay paused", s.ctx.uftPauseDates("ft", "hist", "2027-01-26", "2027-01-27") && fwrites(s).some(x => x.p === P + "0/track/pausedBefore/2026-12-01" && x.v === "2027-01-04") &&
    s.ctx.uftPausedOn(s.IT("hist").track, "2026-12-08") && !s.ctx.famCellState(s.B(), s.IT("hist"), "2026-12-08").runs && s.lbl("hist", "2027-01-25") === wk && wk === "Book Wk 8 · Day 1", [wk, s.lbl("hist", "2027-01-25")]);
  ok("re-saving the lessons keeps the pause and its dates (uftKeep)", (() => { const nt = s.ctx.uftKeep(s.IT("hist").track, { mode: "week", days: {} }); return nt.paused === true && nt.pauseFrom === "2027-01-26" && nt.resumeOn === "2027-01-27" && nt.pausedBefore["2026-12-01"] === "2027-01-04"; })());
  ok("the run-dates cache key carries the pause dates (a new resume date shows at once)", /it\.track\.pauseFrom\|\|null,it\.track\.resumeOn\|\|null,it\.track\.pausedBefore\|\|null/.test(src));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
