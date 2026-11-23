/*
 * 💾 RETRSAVE + 🃏 RETRLIVE (her asks 2026-11-19: "could we just auto save to avoid this" → "it needs to be live and it is
 * added to live week"). Against code sliced out of index.html (RETRWEEK, GWRETR, RETRLIVE, the Retrieval Plan editor, the
 * relay door's functions):
 *   1. the page saves by itself: one tap stores the whole row as shown; Row 2 clean-up in the payload while the editor keeps
 *      what it shows; the wrong-kid guard; number boxes save without a repaint; no Save button; Reset still confirms;
 *      ?dryrun=1 writes nothing
 *   2. the live week (retrLiveDiff through retrLiveCtx): today (after now) and later days only; a day turned off loses its open
 *      card; a checked card is kept; no other card changes day or time (only the kid's Closing Notebook is re-timed to stay
 *      last, the builder's own rule); a kid with no sprint ladder gets drill + match only; a day the kid has no cards gets
 *      none; after school ends today is left alone; a second run changes nothing (two devices never double it); a later full
 *      build (the REAL gwInjectRetrieval) makes the same cards under the same ids
 *   3. once after the tapping settles: four taps → one relayWeek; two kids → one run; never for a kid's device / dry run;
 *      the door runs pass R alone (no sweep), one targeted multi-path update, a what-moved line that says "taken off"
 * DRILLPOINT (slice 6, her pick 2026-11-22 "Yes, replace them"): the panel's day buttons are gone — the days are set in
 * Curriculum, which saves through the same one plan write (drPlanWrite, o.rhythm → the live pass). §1 now pins the panel as
 * it is (numbers save themselves, no Save button, Reset the numbers); §2–§3 replay the old day tap through that one write
 * (tap(), below), so the live-week checks are unchanged.
 *   run:  node test_retr_autosave.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
function fn(name) { const sig = "function " + name + "("; const i = src.indexOf(sig); if (i < 0) throw new Error("not found " + name); let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } throw new Error("unbalanced " + name); }
function slice(a, b) { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error("marker " + a); return src.slice(i, j + b.length); }
const RETRWEEK = slice("// RETRWEEK_START", "// RETRWEEK_END");
const GWRETR = slice("// GWRETR_START", "// GWRETR_END");
const RETRLIVE = slice("// RETRLIVE_START", "// RETRLIVE_END");
const ADMIN = src.slice(src.indexOf("let retrAdminLocal=null;"), src.indexOf("// ── P4: schedule day-card strip"));
const toMin = s => { const m = /(\d+):(\d+)\s*([AP]M)/.exec(s || ""); if (!m) return null; return (+m[1] % 12 + (m[3] === "PM" ? 12 : 0)) * 60 + +m[2]; };
const fromMin = n => { let h = Math.floor(n / 60), m = n % 60, ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return h + ":" + String(m).padStart(2, "0") + " " + ap; };
const RealDate = Date;
const frozen = at => class F extends RealDate { constructor(...a) { if (!a.length) super(at); else super(...a); } static now() { return new RealDate(at).getTime(); } };
const clone = x => JSON.parse(JSON.stringify(x));

// week of Mon 2026-11-16; "today" = Thursday 11/19
const DAY_DT = { monday: "November 16", tuesday: "November 17", wednesday: "November 18", thursday: "November 19", friday: "November 20" };
const ISO = { monday: "2026-11-16", tuesday: "2026-11-17", wednesday: "2026-11-18", thursday: "2026-11-19", friday: "2026-11-20" };
const DAYS = Object.keys(ISO);

function world(o) {
  o = o || {};
  const writes = [], removes = [], relays = [], timers = [];
  const env = {
    console, JSON, Math, Object, Array, Set, Map, String, Number, parseInt, parseFloat, isNaN, RegExp, Error,
    Date: frozen(o.now || "2026-11-19T11:02:00"),
    masteryKid: o.kid || "kida", masteryData: { retrievalPlan: clone(o.plan || {}) },
    ROSTER: ["kida", "kidb"], SL_KLBL: { kida: "Kid A", kidb: "Kid B" },
    retrTracks: k => (k === "kida" ? [{ key: "t" }] : []),           // kida has a sprint ladder, kidb has none
    retrSettings: () => ({ gate_pct: 80, gate_streak: 2, review_count: 3, stuck_after: 8, sprint_seconds: 60, sprint_rounds: 2, slot_min_drill: 5, slot_min_match: 10, heatmap_window: 14, recheck_ladder: [1, 3, 7], gate_metric: "accuracy", recheck_fail: "focus", match_rotation: "heatmap" }),
    gwRules: () => ({ schoolStart: 600, schoolEnd: 975, lunchStart: 780, lunchEnd: 840 }),
    rulesData: { schoolDay: { defaultStart: "10:00 AM", defaultEnd: "4:15 PM" } },
    DAY_DT, _todayDay: "thursday", toMin, fromMin,
    _rlwModeToday: () => (o.mode || "today"),
    momHere: () => (o.mom !== false), _dryRun: () => !!o.dry,
    checked: o.checked || {}, claimed: {},
    HA_LS: { setItem() {}, getItem() { return null; } },
    _mastRe: () => { env.repaints++; }, repaints: 0,
    confirm: () => env.confirmAnswer, confirmAnswer: false, confirms: 0,
    document: { getElementById: id => (id === "retrAdminSaved" ? env.savedEl : null) }, savedEl: { innerHTML: "" },
    setTimeout: (f, ms) => { timers.push({ f, ms, live: true }); return timers.length; },
    clearTimeout: h => { if (h && timers[h - 1]) timers[h - 1].live = false; },
    relayWeek: (why, info) => relays.push({ why, info: clone(info) }),
    dbg: () => {}, sv: () => {}, lastTasksWrite: 0, WK: "week32",
    weekData: { tasks: [] },
    db: { ref: p => ({ update: v => writes.push({ p, v: clone(v) }), remove: () => removes.push(p) }) },
    writes, removes, relays, timers,
  };
  const _conf = env.confirm; env.confirm = m => { env.confirms++; return _conf(m); };
  env.gwParseDate = new Function("return " + fn("gwParseDate"))();
  vm.createContext(env);
  vm.runInContext(fn("retrSlotMinutes") + "\n" + RETRWEEK + "\n" + GWRETR + "\n" + RETRLIVE + "\n" + ADMIN + "\n;this.__admin=()=>retrAdminLocal;", env);
  env.fire = () => { let n = 0; for (let i = 0; i < timers.length; i++) if (timers[i].live) { timers[i].live = false; timers[i].f(); n++; } return n; };
  return env;
}
const lastWrite = env => env.writes[env.writes.length - 1];
// DRILLPOINT: the old day button's cycle, replayed through the one plan write the Curriculum page uses (week = the whole row
// as shown, week2 cleaned, the live pass queued) — the same days payload the button sent, without the panel.
const CYCLE = ["sprint", "match", "recheck", "drill", "off"], D3 = ["mon", "tue", "wed", "thu", "fri"];
function tap(w, day, row) {
  const kid = w.masteryKid, w1 = Object.assign({}, w.retrWeek(kid)), w2 = Object.assign({}, w.retrWeek2(kid));
  const map = row === 2 ? w2 : w1;
  map[day] = CYCLE[(CYCLE.indexOf(map[day] || "off") + 1) % CYCLE.length];
  const week = {}, week2 = {};
  D3.forEach(d => { week[d] = w1[d] || "off"; });
  D3.forEach(d => { const k = w2[d]; if (k && k !== "off" && k !== week[d]) week2[d] = k; });
  return w.drPlanWrite(kid, { week, week2 }, { rhythm: true });
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("1. the page saves by itself");
{
  // DRILLPOINT: the day buttons and their tap are gone; the panel's save is numbers only
  const w = world({ kid: "kida", plan: { kida: { week: { mon: "drill", tue: "match" }, mathfacts_order: ["x"] } } });
  ok("no day-button tap in the panel any more", typeof w.retrAdminCycleDay === "undefined");
  w.retrAdminInit(); w.retrAdminNum("gate_pct", "85");
  const u = lastWrite(w);
  ok("a number writes at once, to that kid's node, settings only", w.writes.length === 1 && u.p === "mastery/retrievalPlan/kida" && JSON.stringify(Object.keys(u.v)) === '["settings"]', w.writes);
  ok("the stored days are untouched and the kid's other keys kept", JSON.stringify(w.masteryData.retrievalPlan.kida.week) === JSON.stringify({ mon: "drill", tue: "match" }) && JSON.stringify(w.masteryData.retrievalPlan.kida.mathfacts_order) === '["x"]');
}
{
  const w = world({ kid: "kida" });
  w.retrAdminInit(); w.retrAdminNum("gate_pct", "85");
  const n = w.writes.length;
  w.masteryKid = "kidb";                                            // kid switched without a repaint
  const r = w.retrAdminSave();
  ok("wrong-kid guard: a stale editor never writes to the kid on screen", r === false && w.writes.length === n && !w.writes.some(x => /kidb$/.test(x.p)), w.writes);
  ok("…and the editor reloads for the kid on screen", w.__admin().kid === "kidb");
  w.retrAdminNum("sprint_seconds", "40");
  ok("the next change writes only that kid", /kidb$/.test(lastWrite(w).p) && lastWrite(w).v.settings.sprint_seconds === 40);
}
{
  const w = world({ kid: "kida" });
  w.retrAdminInit();
  const r0 = w.repaints;
  w.retrAdminNum("slot_min_drill", "7");
  ok("a number box saves at once", lastWrite(w).v.settings.slot_min_drill === 7, lastWrite(w).v.settings);
  ok("…with no repaint (the box keeps its focus)", w.repaints === r0, w.repaints - r0);
  ok("…and 'Saved ✓' shows in place", /Saved ✓/.test(w.savedEl.innerHTML), w.savedEl.innerHTML);
  w.retrAdminLadder("1, 4, 9");
  ok("the re-check ladder box saves at once, no repaint", JSON.stringify(lastWrite(w).v.settings.recheck_ladder) === "[1,4,9]" && w.repaints === r0);
  w.retrAdminNum("slot_min_drill", "");
  ok("a cleared box saves as inherit (key gone)", lastWrite(w).v.settings.slot_min_drill === undefined);
  w.retrAdminToggle("gate_metric", "accuracy", "completion");
  ok("a toggle saves at once (then repaints once)", lastWrite(w).v.settings.gate_metric === "accuracy" && w.repaints === r0 + 1);
  ok("number/ladder/toggle changes never queue a live-week update", w.timers.length === 0, w.timers.length);
}
{
  const w = world({ kid: "kida" });
  const h0 = w.retrAdminHtml();
  ok("no Save button in the page", !/Save Retrieval Plan/.test(h0) && !/retrAdminSave\(/.test(h0));
  ok("Reset is still there (\"Reset the numbers\")", /onclick="retrAdminReset\(\)"[^>]*>Reset the numbers</.test(h0));
  ok("the saved line sits by Reset, with an id, once (DRILLPOINT: no rhythm rows above it any more)", h0.split('id="retrAdminSaved"').length === 2 && h0.indexOf('id="retrAdminSaved"') < h0.indexOf('onclick="retrAdminReset()"') && h0.indexOf('id="retrAdminSaved"') > h0.indexOf("Days are set in Curriculum") && !/Weekly rhythm|Row 2/.test(h0));
  ok("before any change it says changes save by themselves", /changes save by themselves/.test(h0));
  w.retrAdminNum("gate_pct", "85");
  const h1 = w.retrAdminHtml();
  ok("after a change the page shows Saved ✓", /Saved ✓/.test(h1));
  ok("the number inputs still use onchange (no per-keystroke repaint)", !/oninput=/.test(h1));
  ok("the old Save button is gone from the whole app", !/>Save Retrieval Plan</.test(src) && !/onclick="retrAdminSave\(/.test(src));
}
{
  const w = world({ kid: "kida", plan: { kida: { week: { mon: "drill" } } } });
  w.confirmAnswer = false;
  w.retrAdminReset();
  ok("Reset still asks first — No changes nothing", w.confirms === 1 && w.removes.length === 0 && w.writes.length === 0 && w.masteryData.retrievalPlan.kida, w.removes);
  w.confirmAnswer = true;
  w.retrAdminReset();
  // DRILLPOINT: "Reset the numbers" — one targeted update {settings:null}; the plan (its days) is never removed
  ok("Reset → Yes clears the numbers only (no remove of the plan)", w.removes.length === 0 && w.writes.length === 1 && JSON.stringify(lastWrite(w).v) === '{"settings":null}' && w.masteryData.retrievalPlan.kida.week.mon === "drill");
  ok("…and the live week is not queued (the days did not change)", !w.timers.some(t => t.live));
}
{
  const w = world({ kid: "kida", dry: true });
  w.retrAdminInit(); w.retrAdminNum("gate_pct", "85");
  ok("?dryrun=1: a change writes nothing to the database", w.writes.length === 0);
  ok("?dryrun=1: and never queues the live week", w.timers.length === 0);
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("2. the live week — only that kid's practice cards, today (after now) and later");
const mk = (id, who, day, time, dur, title, sk, x) => Object.assign({ id, who, day, time, dur, title, subjectKey: sk, mom: "none", device: "paper" }, x || {});
function baseWeek() {
  const out = [];
  DAYS.forEach((dn, i) => {
    ["kida", "kidb"].forEach(k => {
      if (k === "kidb" && dn === "friday") return;                   // kidb has nothing on Friday
      const p = dn.slice(0, 2) + "_" + k + "_";
      out.push(mk(p + "m", k, dn, "10:00 AM", 20, "Morning Notebook", "morning_nb"));
      out.push(mk(p + "1", k, dn, "10:30 AM", 30, "Math — L" + i, "math", { mom: k === "kida" ? "required" : "none" }));
      out.push(mk(p + "2", k, dn, "11:30 AM", 30, "Reading — L" + i, "reading"));
      out.push(mk(p + "c", k, dn, "12:00 PM", 15, "Closing Notebook", "closing_nb"));
    });
  });
  return out;
}
const OLD = { kida: { week: { mon: "sprint", tue: "match", wed: "sprint", thu: "drill", fri: "match" } },
              kidb: { week: { mon: "drill", tue: "drill", wed: "drill", thu: "drill", fri: "drill" } } };
const WDAY = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const doy = dt => { const jan1 = new Date(dt.getFullYear(), 0, 0); return Math.floor((dt - jan1) / 86400000); };
// the REAL builder pass on a week with no practice cards in it (a fresh full build's view)
function build(env, tasks) { const t = clone(tasks); env.gwInjectRetrieval(t, Object.values(ISO), WDAY, new Set(), { monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1 }, doy); return t; }
const retr = (ts, k) => ts.filter(t => t.subjectKey === "retrieval" && (!k || t.who === k));

{
  // the week as it was built before the change (built Sunday, so no running-day floor)
  const w0 = world({ plan: OLD, now: "2026-11-15T19:00:00" });
  const week = build(w0, baseWeek());
  ok("setup: the built week has practice cards for both kids", retr(week, "kida").length === 5 && retr(week, "kidb").length === 4, retr(week).map(t => t.id));
  const thuDrillA = retr(week, "kida").find(t => t.day === "thursday");
  // now Thursday 11:02 AM; kida's Thursday drill is already checked
  const w = world({ plan: OLD, checked: { [thuDrillA.id]: 1 } });
  w.weekData.tasks = clone(week);
  // Mom: kida thu drill → off (4 taps: drill→off), fri match → recheck (1 tap… match→recheck), Row 2 thu sprint
  w.masteryKid = "kida"; w.retrAdminInit();
  tap(w, "thu");                                       // drill → off
  tap(w, "fri");                                       // match → recheck
  tap(w, "wed");                                       // sprint → match (a PAST day)
  tap(w, "thu", 2);                                    // Row 2 thu: off → sprint
  // kidb (no ladder): every day → sprint (drill→off→sprint), then thu → match
  w.masteryKid = "kidb"; w.retrAdminInit();
  ["mon", "tue", "wed", "thu", "fri"].forEach(d => { tap(w, d); tap(w, d); });   // drill → off → sprint
  tap(w, "thu");                                       // sprint → match
  ok("each tap saved (15 taps → 15 writes)", w.writes.length === 15, w.writes.length);
  ok("…but the live week is NOT touched per tap", JSON.stringify(w.weekData.tasks) === JSON.stringify(week));

  const before = clone(w.weekData.tasks);
  const dA = w.retrLiveDiff("kida", before, w.retrLiveCtx("kida"));
  const dB = w.retrLiveDiff("kidb", before, w.retrLiveCtx("kidb"));
  const pastIds = new Set(before.filter(t => ["monday", "tuesday", "wednesday"].indexOf(t.day) >= 0).map(t => t.id));
  ok("nothing on a past day is added, removed or changed", ![...dA.added, ...dB.added].some(c => ["monday", "tuesday", "wednesday"].indexOf(c.day) >= 0)
    && ![...dA.removed, ...dB.removed].some(id => pastIds.has(id)) && !Object.keys(Object.assign({}, dA.upd, dB.upd)).some(k => pastIds.has(k.split("/")[0])), [dA.upd, dB.upd]);
  ok("kida: the CHECKED Thursday drill stays (day turned off)", !dA.removed.includes(thuDrillA.id) && dA.upd[thuDrillA.id] === undefined);
  const friMatchA = retr(before, "kida").find(t => t.day === "friday");
  ok("kida: Friday's open match is taken off (day changed kind)", dA.removed.includes(friMatchA.id) && dA.upd[friMatchA.id] === null);
  const aAdd = dA.added.map(c => c.day + ":" + c.retrieval).sort();
  ok("kida: Thursday Row 2 sprint + Friday recheck added", JSON.stringify(aAdd) === JSON.stringify(["friday:recheck", "thursday:sprint"]), aAdd);
  const thuSprint = dA.added.find(c => c.day === "thursday");
  ok("today's new card is laid after now (11:02 → 11:05 floor)", toMin(thuSprint.time) >= toMin("11:05 AM"), thuSprint.time);
  ok("ids are the builder's: <year>d<dayOfYear>_retr_<kind>_<kid>", thuSprint.id === "2026d" + doy(new Date(2026, 10, 19)) + "_retr_sprint_kida", thuSprint.id);
  ok("the card is made like the builder's (title, detail, minutes, Mom, device, subject, cascade)",
    thuSprint.title === vm.runInContext("RETR_SLOT_TITLE", w).sprint && thuSprint.detail === vm.runInContext("RETR_SLOT_DETAIL", w).sprint && thuSprint.dur === w.retrSlotMinutes("kida", "sprint")
    && thuSprint.mom === "required" && thuSprint.device === "paper" && thuSprint.subjectKey === "retrieval" && thuSprint.cascade === true, thuSprint);
  const bKinds = [...new Set(dB.added.map(c => c.retrieval))];
  ok("kidb (no ladder): sprint days give NO card — drill + match only", !bKinds.includes("sprint") && !bKinds.includes("recheck"), bKinds);
  ok("kidb: Thursday → match added, the old Thursday drill taken off", dB.added.some(c => c.day === "thursday" && c.retrieval === "match")
    && dB.removed.some(id => /_retr_drill_kidb$/.test(id) && before.find(t => t.id === id).day === "thursday"), [dB.added, dB.removed]);
  ok("kidb: Friday (no cards that day) gets nothing", !dB.added.some(c => c.day === "friday"));

  // apply both, as pass R does, and compare every other card
  const after = clone(before);
  [dA, dB].forEach(d => {
    d.removed.forEach(id => after.splice(after.findIndex(t => t.id === id), 1));
    d.retimed.forEach(r => { after.find(t => t.id === r.id).time = r.to; });
    d.added.forEach(c => after.push(clone(c)));
  });
  const touched = new Set([...dA.removed, ...dB.removed, ...dA.added.map(c => c.id), ...dB.added.map(c => c.id)]);
  const retimed = new Set([...dA.retimed, ...dB.retimed].map(r => r.id));
  const others = before.filter(t => !touched.has(t.id) && !retimed.has(t.id));
  ok("every other card is byte-identical (" + others.length + " cards)", others.every(t => JSON.stringify(after.find(x => x.id === t.id)) === JSON.stringify(t)));
  ok("only a Closing Notebook is ever re-timed (to stay last), same day, later only",
    [...dA.retimed, ...dB.retimed].every(r => { const t = before.find(x => x.id === r.id); return t.subjectKey === "closing_nb" && toMin(r.to) > toMin(r.from); }), [...dA.retimed, ...dB.retimed]);
  ok("every write is a week<N>/tasks child (a card, null, or one Closing time) — never the node",
    Object.keys(Object.assign({}, dA.upd, dB.upd)).every(k => k && (/^[^/]+$/.test(k) || /^[^/]+\/time$/.test(k))));

  // a second run (another device, or the same tap twice) finds nothing to do
  const d2 = w.retrLiveDiff("kida", after, w.retrLiveCtx("kida"));
  const d2b = w.retrLiveDiff("kidb", after, w.retrLiveCtx("kidb"));
  ok("a second run changes nothing — no doubles", !Object.keys(d2.upd).length && !Object.keys(d2b.upd).length, [d2.upd, d2b.upd]);

  // a later full build (the REAL builder on the same day's rules, no practice cards to start from) → the same ids
  const wb = world({ plan: w.masteryData.retrievalPlan });
  const rebuilt = build(wb, baseWeek());
  const ids = (ts, k) => retr(ts, k).filter(t => t.day === "thursday" || t.day === "friday").map(t => t.id).sort();
  const keptChecked = [thuDrillA.id];
  ok("a later full build makes the same practice-card ids for kida (plus the checked card the commit keeps)",
    JSON.stringify(ids(rebuilt, "kida").concat(keptChecked).sort()) === JSON.stringify(ids(after, "kida")), [ids(rebuilt, "kida"), ids(after, "kida")]);
  ok("…and for kidb (no ladder)", JSON.stringify(ids(rebuilt, "kidb")) === JSON.stringify(ids(after, "kidb")), [ids(rebuilt, "kidb"), ids(after, "kidb")]);
  const sameShape = (a, b) => ["id", "who", "day", "dur", "title", "detail", "mom", "cascade", "device", "subjectKey", "retrieval"].every(f => a[f] === b[f]);
  ok("…the builder's cards have the same fields as the live ones", [...dA.added, ...dB.added].every(c => { const r = rebuilt.find(t => t.id === c.id); return r && sameShape(r, c); }));
}
{
  // after school today: today is left alone, later days still follow
  const w = world({ plan: OLD, mode: "tomorrow", now: "2026-11-19T17:00:00" });
  w.weekData.tasks = build(world({ plan: OLD, now: "2026-11-15T19:00:00" }), baseWeek());
  w.masteryKid = "kida"; w.retrAdminInit(); tap(w, "thu", 2); tap(w, "fri", 2);
  const d = w.retrLiveDiff("kida", w.weekData.tasks, w.retrLiveCtx("kida"));
  ok("after school ends, nothing is added on today", !d.added.some(c => c.day === "thursday") && d.added.some(c => c.day === "friday"), d.added.map(c => c.day));
}
{
  // a kid switched out of the rhythm entirely (no ladder, every day off) → the open cards go, none come
  const w = world({ plan: OLD });
  w.weekData.tasks = build(world({ plan: OLD, now: "2026-11-15T19:00:00" }), baseWeek());
  w.masteryKid = "kidb"; w.retrAdminInit();
  ["mon", "tue", "wed", "thu", "fri"].forEach(d => tap(w, d));   // drill → off
  const d = w.retrLiveDiff("kidb", w.weekData.tasks, w.retrLiveCtx("kidb"));
  ok("all days off: today's and later open cards are taken off, past ones stay", d.removed.length === 1 && !d.added.length
    && w.weekData.tasks.find(t => t.id === d.removed[0]).day === "thursday", d.removed);
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("3. once after the tapping settles");
{
  const w = world({ kid: "kida" });
  w.retrAdminInit();
  ["thu", "thu", "thu", "thu"].forEach(d => tap(w, d));
  ok("four taps → four saves, one pending timer", w.writes.length === 4 && w.timers.filter(t => t.live).length === 1);
  ok("the wait is long enough to finish a day's cycle", w.timers.filter(t => t.live)[0].ms >= 4000, w.timers[0].ms);
  ok("nothing reaches the week before it settles", w.relays.length === 0);
  w.fire();
  ok("then ONE relayWeek('retrieval') for that kid", w.relays.length === 1 && w.relays[0].why === "retrieval" && JSON.stringify(w.relays[0].info.retr) === '["kida"]', w.relays);
  ok("the line names the kid from the family's own labels", /Kid A/.test(w.relays[0].info.label), w.relays[0].info.label);
  w.masteryKid = "kida"; tap(w, "mon"); w.masteryKid = "kidb"; w.retrAdminInit(); tap(w, "mon");
  w.fire();
  ok("two kids changed together → one run with both", w.relays.length === 2 && JSON.stringify(w.relays[1].info.retr) === '["kida","kidb"]', w.relays[1]);
}
{
  const w = world({ kid: "kida", mom: false });
  ok("not Mom (a kid's device) → never queued", w.retrLiveQueue("kida") === false && w.timers.length === 0);
  ok("only a day change through the plan write queues it — no listener / render path calls retrLiveQueue (DRILLPOINT: Reset no longer does)", (src.match(/retrLiveQueue\(/g) || []).length === 2, (src.match(/retrLiveQueue\(/g) || []).length);
}
{
  // the door: pass R alone under the relay's lock, its snapshot / diff / line; no sweep
  const names = ["relayWeek", "_rlwFire", "_rlwRetrOnly", "_rlwMvtOnly", "_rlwRun", "_rlwSnapOf", "_rlwDiff", "_rlwWords", "_rlwIsClass"];
  const consts = /const RLW_WAIT_MS=[^\n]*\n/.exec(src)[0] + "let relayLogData={};\nlet _rlwPend=null, _rlwTimer=null;\n";
  const w = world({ plan: OLD });
  w.weekData.tasks = build(world({ plan: OLD, now: "2026-11-15T19:00:00" }), baseWeek());
  w.masteryKid = "kida"; w.retrAdminInit(); tap(w, "fri");   // match → recheck (Friday: off the old, on the new)
  const w0 = w.writes.length;
  let sweeps = 0, locks = 0, released = 0;
  Object.assign(w, { cascadeIntraWeek: () => sweeps++, runCascade: () => sweeps++, _rlwGuard: () => sweeps++, _rlwChain: (l, p, f) => f(),
    haClaimSchedLock: (k, cb) => { locks++; cb(() => released++); }, lockHeldByOther: () => false, momMoves: {}, HA_DEV_ID: "dev1",
    fdtHeld: () => false, mvtHeldToday: () => false, currData: { subjects: {} }, cap: s => s, gwShowToast: m => { w.toast = m; }, renderAll: () => {} });
  vm.runInContext(consts + names.map(fn).join("\n"), w);
  w.relayWeek = w.relayWeek;   // the real door now
  vm.runInContext("relayWeek('retrieval',{label:'\u{1F0CF} Kid A practice days',retr:['kida']});", w);
  w.fire();
  const tw = w.writes.slice(w0).filter(x => x.p === "week32/tasks");
  ok("one lock claim, released", locks === 1 && released === 1, [locks, released]);
  ok("no sweep in a practice-days-only run (nothing else re-laid)", sweeps === 0, sweeps);
  ok("ONE targeted multi-path update of week<N>/tasks", tw.length === 1 && Object.keys(tw[0].v).length >= 2, tw);
  ok("the week in memory has the new Friday recheck and not the old match", w.weekData.tasks.some(t => t.who === "kida" && t.day === "friday" && t.retrieval === "recheck")
    && !w.weekData.tasks.some(t => t.who === "kida" && t.day === "friday" && t.retrieval === "match"));
  const logW = w.writes.slice(w0).find(x => /^week32\/relayLog\//.test(x.p));
  ok("the relay log gets its usual line", !!logW || Object.keys(vm.runInContext("relayLogData", w)).length === 1);
  ok("the line says added / taken off — not 'to next week'", /1 added/.test(w.toast) && /1 taken off/.test(w.toast) && !/next week/.test(w.toast), w.toast);
  ok("pass R runs inside _rlwRun after the snapshot, before the run's own step (a mixed run's sweep packs around it)", (r => r.indexOf("retrLiveRelay(pend)") > r.indexOf("const before=_rlwSnapOf(") && r.indexOf("retrLiveRelay(pend)") < r.indexOf("fn(fin)"))(fn("_rlwRun")) && /_rlwRetrOnly\(pend\)\) _rlwRun\(pend,function\(\)\{\},_done\)/.test(fn("_rlwFire")));
}
{
  const blk = slice("// RETRSAVE_START", "// RETRSAVE_END") + slice("// RETRLIVE_START", "// RETRLIVE_END");
  ok("no kid or family names in the new blocks", !/\b(lincoln|ellis|lucy|julian|taylor|makenzie|andrew|caleb|sara|melanie|howe|dewalt|burris)\b/i.test(blk));
  ok("every database write in the new code is behind db && !_dryRun()", (blk.match(/db\.ref\(/g) || []).length === 2 && (blk.match(/db&&!\(typeof _dryRun==="function"&&_dryRun\(\)\)\)\{? ?(lastTasksWrite=Date\.now\(\); )?db\.ref\(/g) || []).length === 2);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
