/*
 * 🗓 UNITFT — a unit on Family Time starts on its day and stays adjustable (her words 2026-11-11, Sara's Thanksgiving unit:
 *   "she clicked for tomorrow, but it showed up for today in the grid … there is no way that you can actually click it and change
 *   the date … it is not in her schedule either … It needs to be pretty adjustable.")
 * Replay on an anonymized copy of the DeWalt block (History / Science / Read Aloud after a 1:00 PM lunch, Mon 1:35 PM, four kids)
 * and the 6-day Thanksgiving unit (in order, 4 a week), on her calendar: week6 = Mon 11/9–Thu 11/12 (no Friday), 11/16–20, the
 * Thanksgiving week off, school again 11/30. Real FAMBLOCK + FAMTOGETHER + FAMLESSONS + FAMBLOCKOUT + FAMDAYSTART + UNITTRACK +
 * PUTSCHED + UNITFT code, famWhoBlockFor and relayWeek sliced in; the clock is faked (America/New_York).
 *   run: node test_unitft_start.js
 */
process.env.TZ = "America/New_York";
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const J = x => JSON.stringify(x);
const UFT = cut("// UNITFT_START", "// UNITFT_END");

// ── her data, anonymized ──
const KIDS = ["k1", "k2", "k3", "k4"];
const DAYS_ON = ["Thanksgiving Traditions", "The Tradition of thanksgiving", "Thanksgiving Turkey Pardon", "Thanksgiving Parade", "Thanksgiving Pilgrims & Natives", "Thanksgiving Gratitude"];
const UNIT = () => ({ id: "thanksgiving", title: "Thanksgiving", enrolled: {}, decks: [{ key: "Thanksgiving", cards: [{ name: "Tradition", ch: 1 }] }],
  track: { mode: "seq", perWeek: 4, days: DAYS_ON.map((t, i) => ({ id: "d" + (i + 1), n: i + 1, t })) } });
const BLOCK = () => ({ name: "Family Time", kids: KIDS.slice(), days: ["Mon", "Tue", "Wed", "Thu", "Fri"], at: "lunch", atByDay: { Mon: "1:35 PM" },
  items: [{ key: "hist", name: "History", minutes: 30, pts: 20, track: { mode: "week", book: "BiblioPlan", startDate: "2026-10-05", startWeek: 7, total: 34, days: { Mon: "Day 1", Tue: "Day 2", Wed: "Day 3", Thu: "Map work", Fri: "Presidents" }, missed: "same", missedFrom: "2026-10-12" } },
    { key: "sci", name: "Science", minutes: 30, pts: 20, track: { mode: "seq", list: [{ n: 4, t: "Space Science L6" }, { n: 4, t: "Space Science L7" }], missed: "next", missedFrom: "2026-10-12" } },
    { key: "ra", name: "Read Aloud", minutes: 20 }] });
// school dates (curriculum/lessons): week6 Mon–Thu, 11/16–20, Thanksgiving week off, 11/30–12/4, 12/7–11
const SCHOOL = ["2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20",
  "2026-11-30", "2026-12-01", "2026-12-02", "2026-12-03", "2026-12-04", "2026-12-07", "2026-12-08", "2026-12-09", "2026-12-10", "2026-12-11"];
const BOARD = { monday: "2026-11-09", tuesday: "2026-11-10", wednesday: "2026-11-11", thursday: "2026-11-12" };   // week6/meta.dates: no Friday
const toMin = t => { const m = String(t || "").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i); if (!m) return NaN; let h = +m[1]; const ap = (m[3] || "").toUpperCase(); if (ap === "PM" && h !== 12) h += 12; if (ap === "AM" && h === 12) h = 0; return h * 60 + (+m[2]); };
const fromMin = v => { let h = Math.floor(v / 60), m = v % 60; const ap = h >= 12 ? "PM" : "AM"; let hh = h % 12; if (hh === 0) hh = 12; return hh + ":" + String(m).padStart(2, "0") + " " + ap; };
// the board week as laid at the week build (History / Science / Read Aloud per kid per day; no Thanksgiving)
function boardTasks() {
  const out = []; let n = 0;
  Object.keys(BOARD).forEach(dn => { const s0 = dn === "monday" ? toMin("1:35 PM") : toMin("1:00 PM"); [["hist", 30, "History"], ["sci", 30, "Science"], ["ra", 20, "Read Aloud"]].reduce((at, x) => {
    KIDS.forEach(k => out.push({ id: "w6_" + (n++), who: k, day: dn, time: fromMin(at), dur: x[1], title: "🏡 " + x[2], detail: "Family Time — together", mom: "none", cascade: true, device: "paper", famBlock: "ft", famItem: x[0] })); return at + x[1]; }, s0); });
  KIDS.forEach(k => Object.keys(BOARD).forEach(dn => out.push({ id: "own_" + k + "_" + dn, who: k, day: dn, time: "9:00 AM", dur: 30, title: "Math", subjectKey: "math" })));
  return out;
}

// ── a world: the real code on stubs, a fake clock ──
function world(o) {
  o = o || {}; const writes = [], relays = [], toasts = [];
  const RealDate = Date; const NOW = new RealDate(o.now || "2026-11-11T10:00:00");   // local time (TZ above)
  class FakeDate extends RealDate { constructor(...a) { if (a.length) super(...a); else super(NOW.getTime()); } static now() { return NOW.getTime(); } }
  const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const today = iso(NOW), todayDay = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][NOW.getDay()];
  const lessons = { k3: {} }; SCHOOL.forEach((d, i) => lessons.k3[i + 1] = { date: d, week: "Wk " + (d < "2026-11-16" ? 6 : d < "2026-11-30" ? 7 : 9) });
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date: FakeDate, parseInt, isNaN, isFinite, setTimeout: () => 0, clearTimeout: () => {},
    window: { HA_FAMILY: { familyId: "dewalt" } }, ROSTER: KIDS.slice(), KID_COLOR: {}, unitStudies: { thanksgiving: UNIT() },
    rulesData: { schoolDay: { defaultStart: "9:00 AM", defaultEnd: "4:00 PM", lunchStart: "12:00 PM", lunchEnd: "1:00 PM" }, familyBlocks: { ft: o.block || BLOCK() } },
    currData: { subjects: {}, lessons }, masteryData: {}, weekData: { tasks: o.tasks || boardTasks() }, checked: o.checked || {}, claimed: {}, histState: {}, archive: {}, blockouts: {},
    WK: "week6", _todayDay: todayDay, lastTasksWrite: 0, rulesOpen: {}, gvShowPast: false,
    momHere: () => o.mom !== false, _dryRun: () => !!o.dry, renderAll: () => {}, renderAllSoon: () => {}, dbg: () => {}, gwShowToast: m => toasts.push(m), sv: () => {},
    db: { ref: p => ({ set: v => writes.push({ op: "set", p, v: JSON.parse(J(v === undefined ? null : v)) }), update: v => writes.push({ op: "update", p, v: JSON.parse(J(v)) }), remove: () => writes.push({ op: "remove", p }), transaction: () => {} }) },
    fbArr: v => { if (!v) return v; if (Array.isArray(v)) return v; if (typeof v === "object") { const k = Object.keys(v); if (k.length && k.every(x => /^\d+$/.test(x))) return k.sort((a, b) => a - b).map(x => v[x]); } return v; },
    cap: s => s ? s[0].toUpperCase() + s.slice(1) : s, esc: s => String(s == null ? "" : s).replace(/</g, "&lt;"), toMin, fromMin,
    gwParseDate: s => { const p = s.split("-"); return new FakeDate(+p[0], +p[1] - 1, +p[2]); },
    cbTodayISO: () => iso(new FakeDate()), routineDateISO: dn => dn === todayDay ? iso(new FakeDate()) : (BOARD[dn] || null),
    smapIsKidOff: () => false, coopTimedEndMin: () => 0, FX_DOW: { monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun" },
    to12h: s => s, ampmTo24: s => s, _lidAlign: (a, b, seq) => ({ ids: seq.map((x, i) => "L" + i), nextLid: seq.length + 1 }),
    unitEnroll: () => {}, _unitStagedEnrollPending: () => false, famHomeGo: () => {}, ceOpenEdit: () => {}, setAdminSub: () => {}, confirm: () => true };
  ctx.relayWeek = (why, info) => relays.push({ why, info: JSON.parse(J(info || {})) });
  vm.createContext(ctx);
  vm.runInContext([cut("// FAMBLOCK_START", "// FAMBLOCK_END"), cut("// FAMTOGETHER_START", "// FAMTOGETHER_END"), cut("// FAMBLOCKOUT_START", "// FAMBLOCKOUT_END"),
    cut("// FAMLESSONS_START", "// FAMLESSONS_END"), cut("// FAMDAYSTART_START", "// FAMDAYSTART_END"), fn("famWhoBlockFor"),
    cut("// UNITTRACK_START", "// UNITTRACK_END"), cut("// PUTSCHED_START", "// PUTSCHED_END"), UFT,
    "Object.defineProperty(this,'psForm',{get:()=>psForm,set:v=>{psForm=v;}}); Object.defineProperty(this,'famProgress',{get:()=>famProgress,set:v=>{famProgress=v;}});"].join("\n"), ctx);
  if (o.prog) ctx.famProgress = o.prog;
  const B = () => ctx.rulesData.familyBlocks.ft, TG = () => ctx.fbArr(B().items).find(x => x && x.name === "Thanksgiving");
  const map = () => ctx.famLessonMap(B(), "ft", TG());
  const days = () => { const m = map(); return Object.keys(m.byDate).sort().filter(d => !/^✓/.test(m.byDate[d])).map(d => d + " " + m.byDate[d].split(" — ")[0]); };
  const pass = () => ctx.uftRelayFams({ fams: [{ id: "ft", key: TG().key }] });   // relayWeek's pass F, as _rlwFire runs it
  const tgCards = () => ctx.weekData.tasks.filter(t => t.famItem === TG().key);
  return { ctx, writes, relays, toasts, B, TG, map, days, pass, tgCards, today };
}
// Sara's flow: open the sheet, every kid (default), Mon–Fri like hers, First day, Put it on
function putOn(w, start, days) {
  const c = w.ctx; c.psOpen("thanksgiving");
  (days || ["Fri"]).forEach(d => c.psSet("day", d));
  if (start) c.psSet("start", start);
  return c.psApply();
}

console.log("── 0. the live cause, replayed: what the code did before (no start date on the item) ──");
{
  const w = world(); const b = w.B(); b.items.push({ key: "tg", name: "Thanksgiving", minutes: 30, track: { mode: "seq", missed: "next", missedFrom: "2026-11-12", list: DAYS_ON.map((t, i) => ({ t: "Day " + (i + 1) + " — " + t, n: 1, u: { id: "thanksgiving", d: "d" + (i + 1) } })) } });
  ok("her item as stored (no startDate / perWeek): the Grid still puts Day 1 on TODAY Wed 11/11 and runs all five days", J(w.days().slice(0, 6)) === J(["2026-11-11 Day 1", "2026-11-12 Day 2", "2026-11-16 Day 3", "2026-11-17 Day 4", "2026-11-18 Day 5", "2026-11-19 Day 6"]), w.days());
  ok("…and week6 has no card for it (the week was built Monday)", w.tgCards().length === 0);
}

console.log("── 1. start TOMORROW (Thu 11/12): nothing today, Day 1 tomorrow, 6 days at 4 a week ──");
{
  const w = world(); const res = putOn(w, "2026-11-12");
  const tr = w.TG().track;
  ok("Put it on: an in-order item with startDate 2026-11-12 and perWeek 4 (the unit's pace), lines with u", res && res.fam && tr.mode === "seq" && tr.startDate === "2026-11-12" && tr.perWeek === 4 && tr.list.length === 6 && tr.list[0].u.d === "d1", tr);
  ok("the item follows the block's days (Mon–Fri picked) — no item.days", w.TG().days === undefined);
  ok("the re-lay is asked through the one door: relayWeek('famtime', {fams:[ft/<key>]}) with an Undo for the item", w.relays.length === 1 && w.relays[0].why === "famtime" && J(w.relays[0].info.fams) === J([{ id: "ft", key: w.TG().key }]) && w.relays[0].info.undo[0].p === "config/rules/familyBlocks/ft/items/3" && w.relays[0].info.undo[0].gone === true, w.relays);
  ok("Grid / lesson map: 11/12 Day 1 · 11/16–19 Days 2–5 · Fri 11/20 none (4 a week) · 11/30 Day 6", J(w.days()) === J(["2026-11-12 Day 1", "2026-11-16 Day 2", "2026-11-17 Day 3", "2026-11-18 Day 4", "2026-11-19 Day 5", "2026-11-30 Day 6"]), w.days());
  ok("the Grid cell for today is empty and the column says 'starts Thu, Nov 12'", !w.ctx.famCellState(w.B(), w.TG(), "2026-11-11").runs && /starts Thu, Nov 12/.test(w.ctx.famGridHTML()), w.ctx.uftWords(w.TG()));
  ok("the kid's Together strip says it too", /starts Thu, Nov 12/.test(w.ctx.famGridStripHTML("k1")));
  const r = w.pass();
  const tg = w.tgCards();
  ok("pass F lays Thursday only: 4 cards (one per kid), none for today", tg.length === 4 && tg.every(t => t.day === "thursday") && J(tg.map(t => t.who).sort()) === J(KIDS), tg.map(t => t.day + "/" + t.who));
  ok("each card is the generator's shape at the block's slot (1:00 + 30 + 30 + 20 → 2:20 PM, 30 min)", tg.every(t => t.time === "2:20 PM" && t.dur === 30 && t.famBlock === "ft" && t.mom === "none" && t.device === "paper" && t.cascade === true && t.title === "🏡 Thanksgiving"), tg[0]);
  ok("one targeted multi-path update of week6/tasks/<id> — never the node", w.writes.filter(x => /^week6\/tasks/.test(x.p)).length === 1 && w.writes.some(x => x.op === "update" && x.p === "week6/tasks" && Object.keys(x.v).length === 4 && Object.keys(x.v).every(k => /^uft_/.test(k) && k.indexOf("/") < 0)), w.writes.map(x => x.op + " " + x.p));
  ok("History / Science / Read Aloud cards untouched", w.ctx.weekData.tasks.filter(t => t.famBlock === "ft" && t.famItem !== w.TG().key).length === 48 && r.removed.length === 0);
  ok("pass F again → nothing to do, nothing written", (() => { const n = w.writes.length; const r2 = w.pass(); return r2.added.length === 0 && r2.removed.length === 0 && w.writes.length === n; })());
  // the week build next week reads the same gate
  const gen = dn => w.ctx.famDayCards(dn[0], dn[1], null).filter(c => c.k === w.TG().key).length;
  ok("next week's build (famDayCards with the date): Mon–Thu 11/16–19 four cards each, Fri 11/20 none (pace), Wed 11/11 none", gen(["monday", "2026-11-16"]) === 4 && gen(["thursday", "2026-11-19"]) === 4 && gen(["friday", "2026-11-20"]) === 0 && gen(["wednesday", "2026-11-11"]) === 0);
  ok("History still lays every day as before (the gate only reads unit items)", w.ctx.famDayCards("wednesday", "2026-11-11", null).filter(c => c.k === "hist").length === 4 && w.ctx.famDayCards("friday", "2026-11-20", null).filter(c => c.k === "hist").length === 4);
}

console.log("── 2. start TODAY: Day 1 today ──");
{
  const w = world(); putOn(w, "2026-11-11");
  ok("lesson map: 11/11 Day 1, 11/12 Day 2, 11/16–18 Days 3–5, Thu 11/19 Day 6", J(w.days()) === J(["2026-11-11 Day 1", "2026-11-12 Day 2", "2026-11-16 Day 3", "2026-11-17 Day 4", "2026-11-18 Day 5", "2026-11-19 Day 6"]), w.days());
  w.pass();
  ok("pass F lays Wednesday + Thursday (8 cards), no 'starts' words", w.tgCards().length === 8 && w.tgCards().filter(t => t.day === "wednesday").length === 4 && w.ctx.uftWords(w.TG()) === "");
  const w2 = world({ now: "2026-11-11T15:10:00" }); putOn(w2, "2026-11-11"); w2.pass();
  ok("put on at 3:10 PM for today: today's card is still laid (the Grid shows Day 1 today, so the schedule does)", w2.tgCards().filter(t => t.day === "wednesday").length === 4);
}

console.log("── 3. change the start after the fact: the unlaid days move, a checked card doesn't ──");
{
  const w = world(); putOn(w, "2026-11-11"); w.pass();
  const wed = w.tgCards().filter(t => t.day === "wednesday"); wed.forEach(t => w.ctx.checked[t.id] = "2:50 PM"); w.ctx.famProgress = { ft: { [w.TG().key]: { done: 1 } } };
  w.relays.length = 0;
  ok("Starts on → Mon 11/16: one leaf config/rules/familyBlocks/ft/items/3/track/startDate", w.ctx.uftSetStart("ft", w.TG().key, "2026-11-16") && w.writes.some(x => x.op === "set" && x.p === "config/rules/familyBlocks/ft/items/3/track/startDate" && x.v === "2026-11-16"));
  ok("…then the door with an Undo of that leaf as it was (2026-11-11)", w.relays.length === 1 && w.relays[0].info.undo[0].p === "config/rules/familyBlocks/ft/items/3/track/startDate" && w.relays[0].info.undo[0].was === "2026-11-11" && /starts Mon, Nov 16/.test(w.relays[0].info.label), w.relays);
  const r = w.pass();
  ok("pass F: Thursday's 4 open cards come off; Wednesday's 4 checked cards stay", r.removed.length === 4 && w.tgCards().filter(t => t.day === "thursday").length === 0 && w.tgCards().filter(t => t.day === "wednesday").length === 4, r);
  ok("…written as id → null leaves in one update", w.writes.some(x => x.op === "update" && x.p === "week6/tasks" && Object.keys(x.v).length === 4 && Object.values(x.v).every(v => v === null)));
  ok("the rest picks up at Day 2 on Mon 11/16 (the place is kept)", J(w.days().slice(0, 2)) === J(["2026-11-16 Day 2", "2026-11-17 Day 3"]), w.days());
}

console.log("── 4. Runs on · Pause · Resume ──");
{
  const w = world(); putOn(w, "2026-11-12"); w.pass();
  ok("Runs on: Thu off → one leaf items/3/days = Mon/Tue/Wed/Fri", w.ctx.uftToggleDay("ft", w.TG().key, "Thu") && w.writes.some(x => x.p === "config/rules/familyBlocks/ft/items/3/days" && J(x.v) === J(["Mon", "Tue", "Wed", "Fri"])));
  w.pass();
  ok("…Thursday's cards come off; Day 1 moves to Mon 11/16, Fri counts in the 4 (11/16, 17, 18, 20), then 11/30, 12/1", w.tgCards().length === 0 && J(w.days()) === J(["2026-11-16 Day 1", "2026-11-17 Day 2", "2026-11-18 Day 3", "2026-11-20 Day 4", "2026-11-30 Day 5", "2026-12-01 Day 6"]), w.days());
  ok("Thu back on → every block day again = the leaf removed (follows the block)", w.ctx.uftToggleDay("ft", w.TG().key, "Thu") && w.writes.some(x => x.p === "config/rules/familyBlocks/ft/items/3/days" && x.v === null) && w.TG().days === undefined);
  ok("the last day can't be turned off", (() => { const b = w.B(); w.TG().days = ["Mon"]; return w.ctx.uftToggleDay("ft", w.TG().key, "Mon") === false; })());
  delete w.TG().days; w.pass();
  ok("Pause → items/3/track/paused = true; Thursday's cards off; nothing in the map; the Grid says paused", w.ctx.uftPause("ft", w.TG().key, true) && (w.pass(), w.tgCards().length === 0) && w.days().length === 0 && /paused/.test(w.ctx.famGridHTML()));
  ok("Resume → the leaf removed; Thursday back; Day 1 on 11/12 again", w.ctx.uftPause("ft", w.TG().key, false) && w.writes.some(x => x.p === "config/rules/familyBlocks/ft/items/3/track/paused" && x.v === null) && (w.pass(), w.tgCards().length === 4) && w.days()[0] === "2026-11-12 Day 1");
  ok("not Mom → nothing written", (() => { const v = world({ mom: false }); v.B().items.push(Object.assign({}, w.TG())); const n = v.writes.length; return v.ctx.uftSetStart("ft", w.TG().key, "2026-11-20") === false && v.writes.length === n; })());
  ok("re-saving the lesson list keeps the start, the pace and each line's unit day", (() => { const tr = w.TG().track; const nt = w.ctx.uftKeep(tr, { mode: "seq", list: tr.list.map(l => ({ t: l.t, n: 1 })) }); return nt.startDate === "2026-11-12" && nt.perWeek === 4 && nt.list[5].u.d === "d6"; })());
  ok("the controls on the editor and the unit's row: Starts on (date), Runs on (chips), Pause", (() => { const h = w.ctx.uftControlsHTML("ft", w.TG().key); return /Starts on/.test(h) && /type="date" value="2026-11-12"/.test(h) && /Runs on/.test(h) && /Pause/.test(h) && /Thu 12<\/b> · Day 1/.test(h); })());
  ok("…the Family Time editor shows them for the unit item only", /Starts on/.test(w.ctx.famLessonsEditorHTML("ft", w.B(), w.TG(), 3, true)) && !/Starts on/.test(w.ctx.famLessonsEditorHTML("ft", w.B(), w.B().items[1], 1, true)));
  ok("…and the Units tab row (psButtonHTML) shows them under the chip", /On the schedule: Family Time · Thanksgiving/.test(w.ctx.psButtonHTML(w.ctx.unitStudies.thanksgiving)) && /Starts on/.test(w.ctx.psButtonHTML(w.ctx.unitStudies.thanksgiving)));
}

console.log("── 5. the preview on the sheet matches the lay ──");
{
  const w = world(); const c = w.ctx; c.psOpen("thanksgiving"); c.psSet("day", "Fri"); c.psSet("start", "2026-11-12");
  const pv = c.uftPreview(c.unitStudies.thanksgiving, c.psForm);
  ok("preview: Thu 12 · Day 1, Mon 16 · Day 2 … Thu 19 · Day 5, last day Mon, Nov 30 · Day 6", J(pv.map(x => x.date + " " + x.label + (x.last ? " last" : ""))) === J(["2026-11-12 Day 1", "2026-11-16 Day 2", "2026-11-17 Day 3", "2026-11-18 Day 4", "2026-11-19 Day 5", "2026-11-30 Day 6 last"]), pv);
  const h = c.psSheetHTML(c.unitStudies.thanksgiving);
  ok("the sheet draws it ('Where the days land', 'Thu 12</b> · Day 1', the last day line) and nothing is written yet", /Where the days land/.test(h) && /Thu 12<\/b> · Day 1/.test(h) && /last day: <b>Mon, Nov 30<\/b>/.test(h) && w.writes.length === 0, h.slice(h.indexOf("Where"), h.indexOf("Where") + 300));
  c.psSet("start", "2026-11-16");
  ok("change the First day → the preview follows (Mon 16 · Day 1 … Thu 19 · Day 4, last Tue, Dec 1 · Day 6)", (() => { const p = c.uftPreview(c.unitStudies.thanksgiving, c.psForm); return p[0].date === "2026-11-16" && p[0].label === "Day 1" && p.find(x => x.last).date === "2026-12-01"; })());
  c.psSet("start", "2026-11-12"); c.psApply();
  ok("after Put it on, the lesson map lands on exactly the previewed dates", J(w.days().map(s => s.split(" ")[0])) === J(pv.map(x => x.date)), w.days());
  const w2 = world(); w2.ctx.psOpen("thanksgiving"); w2.ctx.psSet("start", "2026-11-12");   // the sheet's default days Mon–Thu (4 a week)
  const pv2 = w2.ctx.uftPreview(w2.ctx.unitStudies.thanksgiving, w2.ctx.psForm); w2.ctx.psApply();
  ok("with the sheet's own default (Mon–Thu): item.days written, preview = lay", J(w2.TG().days) === J(["Mon", "Tue", "Wed", "Thu"]) && J(w2.days().map(s => s.split(" ")[0])) === J(pv2.map(x => x.date)), [w2.days(), pv2]);
  const w3 = world(); w3.ctx.psOpen("thanksgiving"); w3.ctx.psSet("kid", "k2"); w3.ctx.psSet("kid", "k3"); w3.ctx.psSet("kid", "k4");
  ok("one kid (their own subject) → no Family Time preview", w3.ctx.uftPreview(w3.ctx.unitStudies.thanksgiving, w3.ctx.psForm) === null);
}

console.log("── 6. midnight: local dates, no UTC shift ──");
{
  const late = world({ now: "2026-11-11T23:59:30" });   // 04:59 UTC on 11/12
  ok("the fake clock is near midnight: UTC already says 11-12, the local day is 11-11", new Date("2026-11-11T23:59:30").toISOString().slice(0, 10) === "2026-11-12" && late.today === "2026-11-11");
  putOn(late, "2026-11-12");
  ok("at 11:59 PM: today is still 11/11 → 'starts Thu, Nov 12', nothing on 11/11, Day 1 on 11/12", late.ctx.uftWords(late.TG()) === "starts Thu, Nov 12" && late.days()[0] === "2026-11-12 Day 1" && !late.ctx.uftOnDay(late.B(), late.TG(), "wednesday", "2026-11-11"));
  ok("the trap it avoids: new Date('2026-11-12') is Nov 11 here; uftParse('2026-11-12') is Nov 12", new Date("2026-11-12").getDate() === 11 && late.ctx.uftParse("2026-11-12").getDate() === 12 && late.ctx.uftFmt("2026-11-12") === "Thu 12");
  const early = world({ now: "2026-11-12T00:00:30" });   // 05:00 UTC
  putOn(early, "2026-11-12");
  ok("just after midnight: today is 11/12, the start → no 'starts' words, Day 1 today", early.ctx.uftWords(early.TG()) === "" && early.days()[0] === "2026-11-12 Day 1");
  const pv = early.ctx.uftPreviewItem(early.ctx.unitStudies.thanksgiving, { kids: KIDS, days: ["Mon", "Tue", "Wed", "Thu", "Fri"], mode: "seq", minutes: 30, at: "lunch", start: "2026-11-12" });
  ok("the sheet's date string goes straight onto the item: startDate === '2026-11-12'", pv.it.track.startDate === "2026-11-12");
}

console.log("── 7. write paths ──");
{
  ok("UNITFT never sets a tasks node: no ref(…tasks…).set(", !/ref\([^)]*tasks[^)]*\)\s*\.set\(/.test(UFT));
  ok("its only tasks write is db.ref(WK+\"/tasks\").update(…) behind db && !_dryRun()", (UFT.match(/db\.ref\(/g) || []).length === 1 && /db&&!\(typeof _dryRun==="function"&&_dryRun\(\)\)\)\{ lastTasksWrite=Date\.now\(\); db\.ref\(WK\+"\/tasks"\)\.update\(all\.upd\)/.test(UFT));
  ok("no Date parsed from a date string in UNITFT (no new Date(\"…\") / Date.parse / toISOString)", !/new Date\(\s*(s|ds|start|tr\.startDate|v)\s*\)|Date\.parse|toISOString/.test(UFT));
  const d = world({ dry: true }); putOn(d, "2026-11-12"); d.pass();
  ok("?dryrun=1: the cards change in memory, nothing reaches the database", d.tgCards().length === 4 && d.writes.length === 0);
  const rl = fn("relayWeek"), fire = fn("_rlwFire");
  ok("relayWeek collects {fams} (de-duplicated) for pass F", /info\.fams/.test(rl) && /_rlwPend\.fams\.push\(\{id:f\.id,key:f\.key\}\)/.test(rl));
  ok("_rlwFire runs pass F inside the relay's lock and snapshot, before the sweep", /_rlwRun\(pend,function\(fin\)\{ if\(typeof uftRelayFams==="function"\) uftRelayFams\(pend\); cascadeIntraWeek\(\);/.test(fire));
  ok("relayWeek with fams really queues them", (() => { const c = { setTimeout: () => 0, clearTimeout: () => {}, String, JSON, dbg: () => {} }; vm.createContext(c); vm.runInContext("let _rlwPend=null,_rlwTimer=null; const RLW_UNDO_MAX_JSON=16000, RLW_WAIT_MS=2000;\n" + rl + "\nrelayWeek('famtime',{fams:[{id:'ft',key:'a'},{id:'ft',key:'a'}]}); relayWeek('kidoff',{}); this.out=JSON.stringify(_rlwPend.fams);", c); return c.out === J([{ id: "ft", key: "a" }]); })());
  ok("the generator, the Grid and the scheduler-picks path all ask the gate", /uftOnDay\(b,it,dayName,ds\)/.test(fn("famLayout")) && /uftOnDay\(b,it,dayName,ds\)/.test(fn("famAutoUnits")) && /uftOnDay\(b,it,dn,ds\)/.test(fn("famCellState")));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
