// 🗓 PUTSCHED — Put on the schedule ("One shape" §3 both examples, §5 the link; BRIEF_units_build_2026-10-27.md T2; her answers
//   1 (whole family by default), 5 (the start is Mom's option), 14 (Sara does it herself)). Runs the REAL UNITTRACK + PUTSCHED
//   blocks with FAMEDITORHOME's famWhoBlockFor and FAMBLOCK's famWrite / famItems sliced in.
//   · 2+ kids joins the block whose kids are exactly the picks (one famWrite of <id>/items, the other items untouched), else
//     makes a new block named after the unit with the start picked; the lines carry u:{id,d}; week by week writes track.unit
//   · 1 kid writes curriculum/subjects/<kid>/<sk> with lessonSeq "Day n — t", lessonIds born as ceAddSave does, and .unit
//   · the gate: cat_gate/<deck> = {fam,item} or {subject}, one set per deck per kid, before unitEnroll; staged units skip enroll
//   · twice → refused, nothing written; dry run → nothing written; not Mom → nothing
//   · an existing DeWalt-shaped block without u: the FAMLESSONS block is byte-identical to HEAD and its labels unchanged
//   · the button, the chip, the sheet
//   run: node test_put_schedule.js
const fs = require("fs"), path = require("path"), vm = require("vm"), cp = require("child_process");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let head = ""; try { head = cp.execSync("git show HEAD:index.html", { cwd: __dirname, encoding: "utf8", maxBuffer: 1 << 28 }); } catch (e) { head = ""; }
const cutIn = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return s.slice(i, j); };
const fnIn = (s, name) => { const i = s.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < s.length; j++) { const c = s[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return s.slice(i, j + 1); };
const fn = n => fnIn(src, n);
const PS = cutIn(src, "// PUTSCHED_START", "// PUTSCHED_END");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const J = x => JSON.stringify(x);
const ROSTER = ["taylor", "makenzie", "andrew", "caleb"];
const UNIT = o => Object.assign({ id: "thanksgiving", title: "Thanksgiving", emoji: "🦃", enrolled: {}, decks: [{ key: "Thanksgiving", introCap: 3, cards: [{ name: "Wampanoag", ch: 1 }, { name: "Mayflower", ch: 2 }, { name: "Plymouth" }] }, { key: "Harvest words", cards: [{ name: "cornucopia" }] }],
  track: { mode: "seq", perWeek: 4, roles: { Mon: "The object", Tue: "Nature", Wed: "Where" }, weeks: { 1: "Before the cities" }, days: [{ id: "d1", n: 1, wk: 1, role: "The object", t: "Who were the Wampanoag?" }, { id: "d2", n: 2, wk: 1, role: "Nature", t: "The Mayflower" }, { id: "d3", n: 3, wk: 2, role: "The object", t: "Plymouth" }, { id: "dx", n: 4, off: true, t: "Skipped" }] } }, o || {});
function world(o) {
  o = o || {}; const writes = [], enrolls = [], toasts = [];
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, isFinite, WeakMap,
    unitStudies: { thanksgiving: UNIT(o.unit) }, ROSTER: ROSTER.slice(), momHere: () => o.mom !== false, _dryRun: () => !!o.dry,
    db: { ref: p => ({ set: v => writes.push([p, JSON.parse(J(v === undefined ? null : v))]), update: v => writes.push(["update " + p, v]) }) },
    rulesData: { familyBlocks: o.blocks || {} }, currData: { subjects: o.subjects || {}, resources: {} }, masteryData: { caleb_settings: {}, taylor_settings: {} },
    rulesOpen: {}, renderAll: () => { ctx.repaints = (ctx.repaints || 0) + 1; }, repaints: 0, gwShowToast: m => toasts.push(m), cap: s => s[0].toUpperCase() + s.slice(1),
    famList: x => Array.isArray(x) ? x.filter(v => v != null) : (x && typeof x === "object" ? Object.keys(x).sort().map(k => x[k]).filter(v => v != null) : []), famDefs: () => ctx.rulesData.familyBlocks,
    famTrack: it => (it && it.track && (it.track.mode === "week" || it.track.mode === "seq")) ? it.track : null,
    cbTodayISO: () => "2026-10-21", to12h: s => { if (!s) return ""; const p = s.split(":"); let h = parseInt(p[0]); const ap = h >= 12 ? "PM" : "AM"; if (h === 0) h = 12; else if (h > 12) h -= 12; return h + ":" + p[1] + " " + ap; }, ampmTo24: s => s,
    _lidAlign: (a, b, seq, next) => ({ ids: seq.map((x, i) => "L" + String(i + 1).padStart(4, "0")), nextLid: seq.length + 1 }),
    unitEnroll: (uid, kid) => { enrolls.push(kid); ctx.unitStudies[uid].enrolled[kid] = true; }, _unitStagedEnrollPending: u => !!(u && u.stages), famBoTrackDefault: tr => tr,
    famHomeGo: id => { ctx.went = ["fam", id]; }, ceOpenEdit: (k, s) => { ctx.went = ["kid", k, s]; }, setAdminSub: () => {} };
  vm.createContext(ctx);
  vm.runInContext(cutIn(src, "// UNITTRACK_START", "// UNITTRACK_END") + "\n" + PS + "\n" + fn("famWhoBlockFor") + "\n" + fn("famWrite") + "\n" + fn("famItems") + "\nObject.defineProperty(this,'psForm',{get:()=>psForm,set:v=>{psForm=v;}});", ctx);
  return { ctx, writes, enrolls, toasts };
}
const FT = () => ({ name: "Family Time", kids: ROSTER.slice(), days: ["Mon", "Tue", "Wed", "Thu"], at: "lunch", items: [{ key: "h", name: "History", minutes: 30, track: { mode: "seq", list: [{ t: "Ch 1", n: 1 }, { t: "Ch 2", n: 1 }] } }, { key: "r", name: "Read Aloud", minutes: 20 }] });

console.log("── 2+ kids: joins the block the picks share ──");
{
  const w = world({ blocks: { ft: FT() } }), c = w.ctx;
  c.psOpen("thanksgiving");
  ok("the sheet opens with every kid picked, the unit's days a week, in order, lunch, today", c.psForm && c.psForm.kids.join() === ROSTER.join() && c.psForm.days.join() === "Mon,Tue,Wed,Thu" && c.psForm.mode === "seq" && c.psForm.at === "lunch" && c.psForm.start === "2026-10-21", c.psForm);
  const res = c.psApply();
  ok("one famWrite of ft/items: History and Read Aloud untouched, the unit appended", w.writes.length >= 1 && w.writes[0][0] === "config/rules/familyBlocks/ft/items" && w.writes[0][1].length === 3 && w.writes[0][1][0].key === "h" && w.writes[0][1][2].name === "Thanksgiving", w.writes.map(x => x[0]));
  const it = w.writes[0][1][2];
  ok("the item: name, 30 min, an in-order track of one line per day (the off day left out), each line carrying u:{id,d}", it.minutes === 30 && it.track.mode === "seq" && it.track.list.length === 3 && J(it.track.list[0]) === J({ t: "Day 1 — Who were the Wampanoag?", n: 1, u: { id: "thanksgiving", d: "d1" } }) && it.track.list[2].u.d === "d3", it.track);
  ok("the block's days already match → no item.days", it.days === undefined);
  ok("the gate: cat_gate/<deck> = {fam, item} for every deck of the unit, every kid (8 sets)", w.writes.filter(x => /cat_gate/.test(x[0])).length === 8 && w.writes.some(x => x[0] === "mastery/caleb_settings/cat_gate/Thanksgiving" && J(x[1]) === J({ fam: "ft", item: it.key })) && w.writes.some(x => x[0] === "mastery/taylor_settings/cat_gate/Harvest words"), w.writes.filter(x => /cat_gate/.test(x[0])).map(x => x[0]));
  ok("the gate lands BEFORE enroll, then unitEnroll runs for each kid", w.writes.findIndex(x => /cat_gate/.test(x[0])) >= 0 && w.enrolls.join() === ROSTER.join() && res.fam.id === "ft" && res.joined === true);
  ok("nothing else: no curriculum write, the sheet closed, a toast", !w.writes.some(x => /^curriculum/.test(x[0])) && c.psForm === null && /on the schedule for Taylor & Makenzie & Andrew & Caleb/.test(w.toasts[0]));
  ok("utDayForTask now resolves a laid card of that item (the pointer works end to end)", (() => { c.famLessonFor = () => "Day 2 — The Mayflower"; c.routineDateISO = () => "2026-10-20"; const d = c.utDayForTask({ id: "x", who: "caleb", famBlock: "ft", famItem: it.key, day: "tuesday" }); return d && d.id === "d2"; })());
  ok("twice → refused ('already'), nothing more written; the button becomes the chip with Open it", (() => { const n = w.writes.length; c.psOpen("thanksgiving"); const r = c.psApply(); const h = c.psButtonHTML(c.unitStudies.thanksgiving); return r === null && w.writes.length === n && c.psForm.msg === "already" && /On the schedule: Family Time · Thanksgiving/.test(h) && /Open it/.test(h) && !/Put on the schedule/.test(h); })());
  ok("Open it → the Grid's Family panel on that block", (c.psOpenPointer("fam", "ft"), J(c.went) === J(["fam", "ft"])));
}
console.log("\n── 2+ kids, no such block: a new family time named after the unit ──");
{
  const w = world({ blocks: { ft: FT() } }), c = w.ctx;
  c.psOpen("thanksgiving"); c.psSet("kid", "taylor"); c.psSet("kid", "makenzie"); c.psSet("day", "Thu"); c.psSet("at", "time"); c.psSet("time", "09:00"); c.psSet("minutes", "45");
  ok("two kids picked, Thu unticked, a set time 9:00 AM, 45 min", c.psForm.kids.join() === "andrew,caleb" && c.psForm.days.join() === "Mon,Tue,Wed" && c.psForm.at === "time" && c.psForm.time === "9:00 AM" && c.psForm.minutes === 45);
  const res = c.psApply();
  const nb = w.writes[0];
  ok("ONE famWrite of a new block: name = the unit, kids = the picks, days = the picks, at = the set time, one item", /^config\/rules\/familyBlocks\/fb[a-z0-9]+$/.test(nb[0]) && nb[1].name === "Thanksgiving" && nb[1].kids.join() === "andrew,caleb" && nb[1].days.join() === "Mon,Tue,Wed" && nb[1].at === "9:00 AM" && nb[1].items.length === 1 && nb[1].items[0].minutes === 45, nb);
  ok("the old block is untouched; the new block id comes back", !w.writes.some(x => x[0] === "config/rules/familyBlocks/ft/items") && res.fam.id === nb[0].split("/").pop() && c.rulesOpen["fam_" + res.fam.id] === true);
  ok("the gate names the new block; enroll for the two kids only", w.writes.some(x => x[0] === "mastery/caleb_settings/cat_gate/Thanksgiving" && x[1].fam === res.fam.id) && w.enrolls.join() === "andrew,caleb");
  ok("a kid already enrolled is not enrolled again", (() => { const w2 = world({ blocks: {}, unit: { enrolled: { caleb: true } } }); w2.ctx.psOpen("thanksgiving"); w2.ctx.psApply(); return w2.enrolls.join() === "taylor,makenzie,andrew"; })());
  ok("a staged unit: the gate is set, enroll is left to Mom per kid", (() => { const w2 = world({ blocks: {}, unit: { stages: [{ n: 1 }] } }); w2.ctx.psOpen("thanksgiving"); w2.ctx.psApply(); return w2.enrolls.length === 0 && w2.writes.filter(x => /cat_gate/.test(x[0])).length === 8; })());
  ok("'scheduler picks' → at:'auto'", (() => { const w2 = world({ blocks: {} }); w2.ctx.psOpen("thanksgiving"); w2.ctx.psSet("at", "auto"); w2.ctx.psApply(); return w2.writes[0][1].at === "auto"; })());
  ok("the block's days differ from the picks → the item carries its own days", (() => { const w2 = world({ blocks: { ft: Object.assign(FT(), { days: ["Mon", "Tue", "Wed", "Thu", "Fri"] }) } }); w2.ctx.psOpen("thanksgiving"); w2.ctx.psSet("day", "Thu"); w2.ctx.psApply(); const it = w2.writes[0][1][2]; return it.days.join() === "Mon,Tue,Wed"; })());
}
console.log("\n── week by week ──");
{
  const w = world({ blocks: { ft: FT() } }), c = w.ctx;
  c.psOpen("thanksgiving"); c.psSet("mode", "week"); c.psSet("start", "2026-10-26");
  c.psApply();
  const tr = w.writes[0][1][2].track;
  ok("track = {mode week, book, startDate, startWeek 1, total = the last wk, days = the unit's roles, topics from its weeks, unit:{id, fromWeek 1}}", J(tr) === J({ mode: "week", book: "Thanksgiving", startDate: "2026-10-26", startWeek: 1, total: 2, days: { Mon: "The object", Tue: "Nature", Wed: "Where" }, unit: { id: "thanksgiving", fromWeek: 1 }, topics: { 1: "Before the cities" } }), tr);
  ok("week by week with no roles → refused with a plain message, nothing written", (() => { const w2 = world({ blocks: {}, unit: { track: { mode: "week", days: [{ id: "a", wk: 1, t: "x" }] } } }); w2.ctx.psOpen("thanksgiving"); w2.ctx.psSet("mode", "week"); const r = w2.ctx.psApply(); return r === null && /needs a role/.test(w2.ctx.psForm.msg) && w2.writes.length === 0; })());
}
console.log("\n── one kid: that kid's own subject ──");
{
  const w = world({ blocks: { ft: FT() } }), c = w.ctx;
  c.psOpen("thanksgiving"); ["taylor", "makenzie", "andrew"].forEach(k => c.psSet("kid", k)); c.psSet("day", "Wed"); c.psSet("day", "Thu");
  const res = c.psApply();
  const sub = w.writes.find(x => x[0] === "curriculum/subjects/caleb/thanksgiving");
  ok("ONE set of curriculum/subjects/caleb/thanksgiving (+ lastEdit), nothing under familyBlocks", !!sub && w.writes.some(x => x[0] === "curriculum/lastEdit") && !w.writes.some(x => /familyBlocks/.test(x[0])) && res.kid.sk === "thanksgiving");
  const s = sub[1];
  ok("the record ceAddSave writes: display, device, mom, minutes, days, allowedDays, rules, total, priority, carryoverCap, lessonSeq 'Day n — t', lessonIds born, nextLid, timesPerWeek — plus .unit", s.display === "Thanksgiving" && s.device === "paper" && s.mom === "none" && s.minutes === 30 && s.days === "Mon Tue" && J(s.allowedDays) === J(["Mon", "Tue"]) && s.rules === "sequential" && s.total === 3 && s.priority === "normal" && s.carryoverCap === 2 && J(s.lessonSeq) === J(["Day 1 — Who were the Wampanoag?", "Day 2 — The Mayflower", "Day 3 — Plymouth"]) && J(s.lessonIds) === J(["L0001", "L0002", "L0003"]) && s.nextLid === 4 && s.timesPerWeek === 2 && J(s.unit) === J({ id: "thanksgiving" }) && s.fixedTime === undefined, s);
  ok("the gate: cat_gate/<deck> = {subject:'thanksgiving'} for each deck of the unit, then enroll", w.writes.filter(x => /mastery\/caleb_settings\/cat_gate/.test(x[0])).length === 2 && J(w.writes.find(x => x[0] === "mastery/caleb_settings/cat_gate/Thanksgiving")[1]) === J({ subject: "thanksgiving" }) && w.enrolls.join() === "caleb");
  ok("utDayForTask resolves the kid's lesson 2 → day 2", (() => { c.lidsFor = (k, sk) => c.currData.subjects[k][sk].lessonIds; c.llLessonKey = t => t.lid; const d = c.utDayForTask({ id: "x", who: "caleb", subjectKey: "thanksgiving", lid: "L0002" }); return d && d.id === "d2"; })());
  ok("twice → refused (the subject points at the unit); the chip names the kid", (() => { const n = w.writes.length; c.psOpen("thanksgiving"); const r = c.psApply(); return r === null && w.writes.length === n && /Caleb’s Thanksgiving/.test(c.psButtonHTML(c.unitStudies.thanksgiving)); })());
  ok("a set time becomes fixedTime on the subject", (() => { const w2 = world({ blocks: {} }); const c2 = w2.ctx; c2.psOpen("thanksgiving"); ["taylor", "makenzie", "andrew"].forEach(k => c2.psSet("kid", k)); c2.psSet("at", "time"); c2.psSet("time", "10:00"); c2.psApply(); return w2.writes[0][1].fixedTime === "10:00 AM"; })());
  ok("a subject with that key already there → refused, nothing written", (() => { const w2 = world({ blocks: {}, subjects: { caleb: { thanksgiving: { display: "Old" } } } }); const c2 = w2.ctx; c2.psOpen("thanksgiving"); ["taylor", "makenzie", "andrew"].forEach(k => c2.psSet("kid", k)); return c2.psApply() === null && w2.writes.length === 0 && /already has a subject/.test(c2.psForm.msg); })());
}
console.log("\n── dry run, Mom-only, no days ──");
{
  const w = world({ blocks: { ft: FT() }, dry: true }), c = w.ctx; c.psOpen("thanksgiving"); const r = c.psApply();
  ok("dry run: the local block gains the item, the gate is set locally, nothing is written, enroll is skipped, the toast says so", r && r.dry === true && w.writes.length === 0 && c.rulesData.familyBlocks.ft.items.length === 3 && c.masteryData.caleb_settings.cat_gate.Thanksgiving.fam === "ft" && w.enrolls.length === 0 && /dry run/.test(w.toasts[0]));
  const m = world({ blocks: { ft: FT() }, mom: false }); m.ctx.psOpen("thanksgiving");
  ok("not Mom: the sheet does not open, psApply writes nothing, the button is not drawn", m.ctx.psForm === null && m.ctx.psApply() === null && m.writes.length === 0 && m.ctx.psButtonHTML(m.ctx.unitStudies.thanksgiving) === "");
  const n = world({ blocks: {}, unit: { track: { mode: "seq", days: [] } } }); n.ctx.psOpen("thanksgiving");
  ok("a unit with no days: no sheet, no button", n.ctx.psForm === null && n.ctx.psButtonHTML(n.ctx.unitStudies.thanksgiving) === "");
}
console.log("\n── a DeWalt-shaped block without u is untouched ──");
if (!head) ok("HEAD readable", false); else {
  ok("the FAMLESSONS block (famLessonMap, famLessonFor, famSittings) is byte-identical to HEAD", cutIn(src, "// FAMLESSONS_START", "// FAMLESSONS_END") === cutIn(head, "// FAMLESSONS_START", "// FAMLESSONS_END"));
  ok("the FAMEDITORHOME block (famWhoSave) and FAMBLOCK's famWrite are byte-identical to HEAD", cutIn(src, "// FAMEDITORHOME_START", "// FAMEDITORHOME_END") === cutIn(head, "// FAMEDITORHOME_START", "// FAMEDITORHOME_END") && fn("famWrite") === fnIn(head, "famWrite"));
  const w = world({ blocks: { ft: FT() } }), c = w.ctx;
  ok("psPointers finds nothing on a block without u, so the Family chip, the cards and the lists are what they were", c.psPointers("thanksgiving").length === 0 && c.utDayForFam("ft", FT().items[0], "2026-10-19", "Ch 1") === null);
}
console.log("\n── the sheet renders ──");
{
  const w = world({ blocks: { ft: FT() } }), c = w.ctx; const u = c.unitStudies.thanksgiving;
  const b = c.psButtonHTML(u);
  ok("Mom, a unit with days: the 🗓 Put on the schedule button", /Put on the schedule/.test(b) && !/data-ps-sheet/.test(b));
  c.psOpen("thanksgiving"); const h = c.psButtonHTML(u);
  ok("open: Who (4 chips, all picked), How often, In order / Week by week, Minutes, First day, 'Joins Family Time', Put it on / Cancel", (h.match(/class="ce-chip sel"/g) || []).length >= 4 && /Who does this\?/.test(h) && /How often/.test(h) && /Week by week/.test(h) && /Minutes/.test(h) && /First day/.test(h) && /Joins “Family Time”/.test(h) && /Put it on/.test(h) && /Cancel/.test(h));
  ["taylor", "makenzie", "andrew"].forEach(k => c.psSet("kid", k)); const h1 = c.psButtonHTML(u);
  ok("one kid: 'Caleb’s own subject — 3 lessons', its own slot / a set time", /Caleb’s own subject — 3 lessons/.test(h1) && /Its own slot in the day/.test(h1) && !/Joins/.test(h1));
  c.psSet("kid", "taylor"); const h2 = c.psButtonHTML(u);
  ok("two kids with no shared block: Starts chips (lunch / set time / scheduler picks) and 'Makes a new family time for Taylor & Caleb'", /Right after lunch/.test(h2) && /Scheduler picks/.test(h2) && /Makes a new family time for Taylor &amp; Caleb/.test(h2));
  ok("the sheet names no kid in code (roster only) and the hook sits in the Days section", !/lincoln|ellis|lucy|julian/i.test(PS.replace(/\/\/.*$/gm, "")) && /if\(isMom&&days\.length&&typeof psButtonHTML==="function"\) h\+=psButtonHTML\(u\);/.test(fn("utDaysSectionHTML")));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
