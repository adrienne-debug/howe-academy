/*
 * 🃏 DRILLDAYS (her yes 2026-11-21 to slice 3 of DESIGN_drill_rows_curriculum_2026-11-19.md, §3.3 / §3.7 / §4). Tap a
 * card-practice line on the Curriculum page → a sheet with Mon–Fri on/off for that kind. Against code sliced out of index.html
 * (RETRWEEK + RETRFAM, GWRETR, retrSlotMinutes, DRILLROWS, DRILLDAYS, and the Mastery panel's editor with RETRSAVE +
 * DRILLSAVE inside it):
 *   1. drDaysMap (pure): every §3.7 case — on/off on an empty day, a one-kind day, a two-kind day; the two-a-day refusal;
 *      the same kind never stored twice; week always all five days, week2 cleaned
 *   2. a day tap hands drPlanWrite exactly {week, week2} (never settings) with {rhythm:true}: one targeted update() at
 *      mastery/retrievalPlan/<kid>, the live pass queued for that child
 *   3. the two-a-day message: nothing saved, both kinds named, their lines offered
 *   4. Mom only; ?dryrun=1 sends nothing to the database
 *   5. the stale-copy trap: a day changed in the sheet, then a number saved in the Mastery panel → the new days survive
 *      (and the control: with the old editor copy put back, the old days WOULD come back — the drop is what saves them)
 *   6. a child running on the built-in starting days: the first tap saves the whole row as shown
 *   7. the sheet shows the saved days (the builder's own reader), the line's minutes and with Mom / on their own
 *   8. greyed "can't run" lines stay pointers to Mastery (the empty chip: Card practice, slice 4); an ok line opens the sheet
 *   9. random taps: only the tapped kind on the tapped day changes, never a duplicate, never a third kind
 *   run:  node test_drill_days.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
function fn(name) { const sig = "function " + name + "("; const i = src.indexOf(sig); if (i < 0) throw new Error("not found " + name); let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } throw new Error("unbalanced " + name); }
function slice(a, b) { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error("marker " + a); return src.slice(i, j + b.length); }
const RETRWEEK0 = slice("// RETRWEEK_START", "// RETRWEEK_END");
const GWRETR = slice("// GWRETR_START", "// GWRETR_END");
const DRILLROWS = slice("// DRILLROWS_START", "// DRILLROWS_END");
const DRILLDAYS = slice("// DRILLDAYS_START", "// DRILLDAYS_END");
const ADMIN = src.slice(src.indexOf("let retrAdminLocal=null;"), src.indexOf("// ── P4: schedule day-card strip"));
const clone = x => JSON.parse(JSON.stringify(x));
const J = JSON.stringify;
const esc = s => String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const DAYS = ["mon", "tue", "wed", "thu", "fri"];
// The code's built-in starting days are keyed by real ids — swap them for made-up kids (o.defaults) or none at all.
const DEF_RE = /const RETR_WEEK_DEFAULT=\{[\s\S]*?\n\s*lincoln:\{[^}]*\}\};/;
if (!DEF_RE.test(RETRWEEK0)) throw new Error("RETR_WEEK_DEFAULT shape changed");

// kida has a sprint ladder, kidb has none (the RETRFAM rule).
function world(o) {
  o = o || {};
  const writes = [], sets = [], queued = [], nav = [], log = [], renders = [];
  const els = {};
  const mkEl = id => ({ id, style: {}, innerHTML: "", querySelector() { return null; } });
  const env = {
    console, JSON, Math, Object, Array, Set, Map, String, Number, parseInt, parseFloat, isNaN, RegExp, Error, Date,
    masteryKid: o.masteryKid || "kida",
    masteryData: { retrievalPlan: clone(o.plan || {}) },
    currData: { subjects: clone(o.subjects || {}) },
    ROSTER: ["kida", "kidb"], SL_KLBL: { kida: "Kid A", kidb: "Kid B" },
    cap: k => ({ kida: "Kid A", kidb: "Kid B" })[k] || k, esc,
    retrTracks: k => (k === "kida" ? [{ key: "t" }] : []),
    retrSettings: () => ({ sprint_seconds: 60, sprint_rounds: 2, review_count: 3, slot_min_drill: 5, slot_min_match: 10 }),
    mastMeasuredDrillMin: () => null,
    momHere: () => o.mom !== false,
    _dryRun: () => !!o.dry,
    HA_LS: { setItem: () => log.push("ls"), getItem() { return null; } },
    // the real retrLiveQueue refuses off Mom / in dry run; this stand-in records what it was asked
    retrLiveQueue: k => { queued.push(k); env._pend.push(k); return true; },
    retrLivePending: k => env._pend.indexOf(k) >= 0, _pend: [],
    _mastRe: () => log.push("repaint"),
    renderAll: () => renders.push("all"),
    mhqKid: "kidb", mhqView: "week", mhqDeck: null, mpSchoolOpen: t => nav.push(t),
    requestAnimationFrame: () => {}, setTimeout: () => 1, clearTimeout: () => {},
    document: {
      body: { style: {}, appendChild: e => { els[e.id] = e; } },
      getElementById: id => els[id] || null,
      createElement: () => mkEl(""),
    },
    writes, sets, queued, nav, log, renders, els,
  };
  if (o.db !== false) env.db = { ref: p => ({
    update: v => writes.push({ p, v: clone(v) }),
    set: v => sets.push({ p, v }), remove: () => sets.push({ p, remove: true }) }) };
  else env.db = null;
  const defs = "const RETR_WEEK_DEFAULT=" + J(o.defaults || {}) + ";";
  const RETRWEEK = RETRWEEK0.replace(DEF_RE, defs);
  vm.createContext(env);
  vm.runInContext(fn("retrSlotMinutes") + "\n" + RETRWEEK + "\n" + GWRETR + "\n" + ADMIN + "\n" + DRILLROWS + "\n" + DRILLDAYS
    + "\n;this.__admin=()=>retrAdminLocal;this.__setAdmin=v=>{retrAdminLocal=v;};"
    + "this.__state=()=>({kid:drDaysKid,kind:drDaysKind,full:drDaysFull,saved:drDaysSaved});"
    + "this.RETR_SLOT_TITLE=RETR_SLOT_TITLE;", env);
  return env;
}
const wk = (mon, tue, wed, thu, fri) => ({ mon, tue, wed, thu, fri });
const sheet = w => (w.els["dr-days-wrap"] || {}).innerHTML || "";
const litIn = h => { const out = []; h.replace(/class="ce-chip dr-day( on)?"[^>]*onclick="drDaysTap\('(\w+)'\)"/g, (m, on, d) => { if (on) out.push(d); }); return out; };

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("1. drDaysMap — §3.7 onto the two slots");
{
  const w = world();
  const M = (a, b, d, k, on) => clone(w.drDaysMap(a, b, d, k, on));
  let r = M(wk("off", "off", "off", "off", "off"), {}, "wed", "drill", true);
  ok("empty day, on → the first slot", r.ok && r.changed && r.week.wed === "drill" && J(r.week2) === "{}", r);
  ok("week always carries all five days, off stored as \"off\"", J(r.week) === J(wk("off", "off", "drill", "off", "off")), r.week);
  r = M({}, {}, "mon", "match", true);
  ok("nothing saved at all → still the whole row", J(r.week) === J(wk("match", "off", "off", "off", "off")) && J(r.week2) === "{}", r);
  r = M(wk("match", "off", "off", "off", "off"), {}, "mon", "drill", true);
  ok("one-kind day, on → the second slot; the first is not moved", r.ok && r.week.mon === "match" && J(r.week2) === J({ mon: "drill" }), r);
  r = M(wk("off", "off", "off", "off", "off"), { mon: "match" }, "mon", "drill", true);
  ok("first slot off, second full → the first slot (week first); the second stays", r.ok && r.week.mon === "drill" && J(r.week2) === J({ mon: "match" }), r);
  r = M(wk("sprint", "off", "off", "off", "off"), { mon: "drill" }, "mon", "match", true);
  ok("two-kind day, a third → refused, names both (week, week2)", r.ok === false && J(r.full) === J(["sprint", "drill"]) && !r.week, r);
  r = M(wk("drill", "off", "off", "off", "off"), {}, "mon", "drill", true);
  ok("already there → nothing to save", r.ok && r.changed === false && r.week.mon === "drill", r);
  r = M(wk("sprint", "off", "off", "off", "off"), { mon: "drill" }, "mon", "drill", true);
  ok("already there in the second slot (a full day) → nothing, not a refusal", r.ok && r.changed === false, r);
  r = M(wk("drill", "off", "off", "off", "off"), { mon: "match" }, "mon", "drill", false);
  ok("off in the first slot → \"off\"; the second slot left where it is", r.ok && r.changed && r.week.mon === "off" && J(r.week2) === J({ mon: "match" }), r);
  r = M(wk("match", "off", "off", "off", "off"), { mon: "drill" }, "mon", "drill", false);
  ok("off in the second slot → dropped from week2", r.ok && r.changed && r.week.mon === "match" && J(r.week2) === "{}", r);
  r = M(wk("drill", "off", "off", "off", "off"), {}, "mon", "drill", false);
  ok("the last one off → the day is \"off\"", r.ok && r.week.mon === "off" && J(r.week2) === "{}", r);
  r = M(wk("off", "off", "off", "off", "off"), {}, "mon", "drill", false);
  ok("off when not there → nothing to save", r.ok && r.changed === false, r);
  r = M(wk("drill", "drill", "off", "off", "off"), { mon: "drill", tue: "off", wed: "off" }, "thu", "match", true);
  ok("same kind in both slots is never kept; off days dropped from week2", J(r.week2) === "{}" && r.week.mon === "drill", r);
  r = M(wk("drill", "off", "off", "off", "off"), { mon: "drill" }, "mon", "drill", false);
  ok("…and turning it off clears it from both", r.week.mon === "off" && J(r.week2) === "{}", r);
  r = M(wk("drill", "off", "off", "off", "off"), { mon: "drill" }, "mon", "match", true);
  ok("…and a doubled day counts as ONE kind: a second kind fits", r.ok && r.week.mon === "drill" && J(r.week2) === J({ mon: "match" }), r);
  r = M(wk("drill", "drill", "drill", "drill", "drill"), {}, "sat", "match", true);
  ok("a day outside Mon–Fri → nothing", r.ok && r.changed === false, r);
  r = M(wk("drill", "drill", "drill", "drill", "drill"), {}, "mon", "off", true);
  ok("\"off\" is not a kind → nothing", r.ok && r.changed === false, r);
  const a = wk("drill", "off", "off", "off", "off"), b = { tue: "match" }, a0 = J(a), b0 = J(b);
  M(a, b, "wed", "sprint", true);
  ok("pure: the inputs are not changed", J(a) === a0 && J(b) === b0);
}

console.log("2. a day tap → drPlanWrite({week, week2}, {rhythm:true})");
{
  const plan = { kida: { settings: { gate_pct: 80 }, week: wk("sprint", "match", "off", "sprint", "recheck"), week2: wk("drill", "drill", "drill", "drill", "drill") } };
  const w = world({ plan });
  ok("open the Daily Drill sheet for kida", w.drDaysOpen("kida", "drill") === true && w.__state().kid === "kida" && w.__state().kind === "drill");
  ok("lit Mon–Fri from the saved plan", J(litIn(sheet(w))) === J(DAYS), litIn(sheet(w)));
  ok("Wed off → saved", w.drDaysTap("wed") === true);
  ok("one targeted update() at mastery/retrievalPlan/kida, no set()/remove()", w.writes.length === 1 && w.writes[0].p === "mastery/retrievalPlan/kida" && w.sets.length === 0, w.writes);
  const p = w.writes[0].v;
  ok("payload keys are exactly week + week2 — never settings", J(Object.keys(p).sort()) === J(["week", "week2"]), Object.keys(p));
  ok("week = the whole row as before", J(p.week) === J(wk("sprint", "match", "off", "sprint", "recheck")), p.week);
  ok("week2 = Wed dropped, the rest kept", J(p.week2) === J({ mon: "drill", tue: "drill", thu: "drill", fri: "drill" }), p.week2);
  ok("the live pass queued for kida", J(w.queued) === J(["kida"]), w.queued);
  ok("settings untouched in the mirror", J(w.masteryData.retrievalPlan.kida.settings) === J({ gate_pct: 80 }));
  ok("the sheet now shows Wed off", J(litIn(sheet(w))) === J(["mon", "tue", "thu", "fri"]), litIn(sheet(w)));
  ok("Saved ✓ · this week’s cards update in a moment", /Saved ✓<\/b> · this week’s cards update in a moment/.test(sheet(w)));
  ok("Wed on → back in the first slot (it is off)", w.drDaysTap("wed") === true && J(w.writes[1].v) === J({ week: wk("sprint", "match", "drill", "sprint", "recheck"), week2: { mon: "drill", tue: "drill", thu: "drill", fri: "drill" } }), w.writes[1] && w.writes[1].v);
  ok("a tap that changes nothing (bad day) writes nothing", w.drDaysTap("sat") === false && w.writes.length === 2);
}
{
  // kidb has no ladder: Drill + Match only
  const w = world({ plan: { kidb: { week: wk("match", "off", "match", "off", "match") } } });
  w.drDaysOpen("kidb", "match");
  w.drDaysTap("tue");
  ok("no-ladder child, Match on Tue → week.tue", J(w.writes[0].v) === J({ week: wk("match", "match", "match", "off", "match"), week2: {} }), w.writes[0] && w.writes[0].v);
}

console.log("3. the two-a-day message — never a silent drop");
{
  const plan = { kida: { week: wk("sprint", "off", "off", "off", "off"), week2: { mon: "drill" } } };
  const w = world({ plan });
  w.drDaysOpen("kida", "match");
  ok("Match on Mon (Sprint + Drill already) → refused", w.drDaysTap("mon") === false);
  ok("nothing written, nothing queued", w.writes.length === 0 && w.queued.length === 0);
  ok("the plan is unchanged", J(w.masteryData.retrievalPlan) === J(plan));
  const h = sheet(w);
  ok("message names the day and both kinds", h.indexOf("Monday already has two: \u{1F3C3} Sprint and \u{1F0CF} Daily Drill. Turn one of those off for Monday first.") >= 0, h.slice(h.indexOf("dr-full"), h.indexOf("dr-full") + 300));
  ok("offers both lines to tap", /onclick="drDaysOpen\('kida','sprint'\)"/.test(h) && /onclick="drDaysOpen\('kida','drill'\)"/.test(h));
  ok("Match still off on Mon", litIn(h).indexOf("mon") < 0);
  w.drDaysOpen("kida", "drill"); w.drDaysTap("mon");
  ok("follow the offer: Drill off on Mon → saved", w.writes.length === 1 && J(w.writes[0].v.week2) === "{}" && w.writes[0].v.week.mon === "sprint");
  w.drDaysOpen("kida", "match");
  ok("…the message is gone on the next sheet", sheet(w).indexOf("dr-full") < 0);
  ok("…and now Match fits on Mon (second slot)", w.drDaysTap("mon") === true && J(w.writes[1].v.week2) === J({ mon: "match" }), w.writes[1] && w.writes[1].v);
}
{
  // no-ladder child with a dead Sprint saved on a day: it still fills a slot, and is offered as a pointer to Mastery
  const w = world({ plan: { kidb: { week: wk("sprint", "off", "off", "off", "off"), week2: { mon: "match" } } } });
  w.drDaysOpen("kidb", "drill");
  ok("dead Sprint + Match → Drill refused, not silently dropped", w.drDaysTap("mon") === false && w.writes.length === 0);
  const h = sheet(w);
  ok("the Sprint that can't run points to Mastery; Match opens its sheet", /can’t run for Kid B yet · change in Mastery →/.test(h) && /onclick="drDaysOpen\('kidb','match'\)"/.test(h));
}

console.log("4. Mom only; dry run sends nothing");
{
  const plan = { kida: { week: wk("drill", "drill", "drill", "drill", "drill") } };
  const w = world({ plan, mom: false });
  ok("a kid's device: the sheet does not open", w.drDaysOpen("kida", "drill") === false && !w.els["dr-days-wrap"]);
  ok("…and a tap does nothing", w.drDaysTap("mon") === false && w.writes.length === 0 && w.queued.length === 0);
  ok("…and drDaysWrite refuses", w.drDaysWrite("kida", wk("off", "off", "off", "off", "off"), {}) === false && w.writes.length === 0);
  ok("…plan unchanged", J(w.masteryData.retrievalPlan) === J(plan));
}
{
  const plan = { kida: { week: wk("drill", "drill", "drill", "drill", "drill") } };
  const w = world({ plan, dry: true });
  w.drDaysOpen("kida", "drill"); w.drDaysTap("mon");
  ok("?dryrun=1: no database write", w.writes.length === 0 && w.sets.length === 0);
  ok("…the screen still follows (local mirror)", w.masteryData.retrievalPlan.kida.week.mon === "off");
}
{
  const w = world({ plan: { kida: { week: wk("drill", "drill", "drill", "drill", "drill") } }, db: false });
  w.drDaysOpen("kida", "drill");
  ok("no db: no crash, nothing sent", w.drDaysTap("mon") === true && w.writes.length === 0);
}

console.log("5. the stale-copy trap (§4)");
{
  const plan = { kida: { week: wk("sprint", "match", "sprint", "match", "recheck"), week2: wk("drill", "drill", "drill", "drill", "drill") } };
  const w = world({ plan, masteryKid: "kida" });
  // Mom had the Mastery panel open and saved a number earlier: the editor copy is KEPT (RETRSAVE)
  w.retrAdminInit(); w.retrAdminNum("gate_pct", "80");
  const oldCopy = clone(w.__admin());
  ok("before: the Mastery panel keeps its copy after a save", w.__admin() && w.__admin().kid === "kida" && w.writes.length === 1);
  // Curriculum: Daily Drill off on Wed
  w.drDaysOpen("kida", "drill"); w.drDaysTap("wed");
  ok("the sheet's write drops the Mastery panel's copy for kida", w.__admin() === null);
  // back in Mastery: a number change
  w.retrAdminNum("pass_count", "3");
  const last = w.writes[w.writes.length - 1].v;
  ok("the number saves", last.settings && last.settings.pass_count === 3 && last.settings.gate_pct === 80, last.settings);
  ok("…and the new days survive (no Drill on Wed)", (last.week2 || {}).wed === undefined && last.week.wed === "sprint", last);
  ok("the stored plan still has Wed without Drill", w.masteryData.retrievalPlan.kida.week2.wed === undefined);
  // control: put the old copy back (what would happen without the drop) → the old days come back
  w.__setAdmin(oldCopy); w.retrAdminNum("pass_count", "4");
  const bad = w.writes[w.writes.length - 1].v;
  ok("control: with the stale copy the old Wed Drill WOULD be written back", (bad.week2 || {}).wed === "drill", bad.week2);
}
{
  const w = world({ plan: { kida: { week: wk("drill", "drill", "drill", "drill", "drill") }, kidb: { week: wk("match", "off", "off", "off", "off") } }, masteryKid: "kida" });
  w.retrAdminInit();
  w.drDaysOpen("kidb", "match"); w.drDaysTap("tue");
  ok("another child's sheet leaves kida's Mastery copy alone", w.__admin() && w.__admin().kid === "kida");
}

console.log("6. a child on the built-in starting days — the first tap saves the whole row");
{
  const defaults = { kida: wk("sprint", "match", "sprint", "match", "recheck") };
  const w = world({ defaults });
  const rows = w.drRows("kida");
  ok("the lines show the built-in days", J(rows.map(r => r.kind + ":" + r.dayText)) === J(["match:Tue Thu", "sprint:Mon Wed", "recheck:Fri"]), rows.map(r => r.kind + ":" + r.dayText));
  w.drDaysOpen("kida", "match");
  ok("sheet lit Tue Thu", J(litIn(sheet(w))) === J(["tue", "thu"]));
  w.drDaysTap("tue");
  ok("first tap (Match off Tue) writes the whole row as shown", J(w.writes[0].v) === J({ week: wk("sprint", "off", "sprint", "match", "recheck"), week2: {} }), w.writes[0].v);
  ok("…so the other days no longer hang on the built-in ones", J(w.masteryData.retrievalPlan.kida.week) === J(wk("sprint", "off", "sprint", "match", "recheck")));
}
{
  const w = world({ defaults: { kida: wk("drill", "off", "drill", "off", "drill") } });
  w.drDaysOpen("kida", "drill"); w.drDaysTap("tue");
  ok("first tap ON (Drill Tue) → whole row, Tue filled", J(w.writes[0].v) === J({ week: wk("drill", "drill", "drill", "off", "drill"), week2: {} }), w.writes[0].v);
}

console.log("7. the sheet");
{
  const plan = { kida: { week: wk("recheck", "sprint", "match", "sprint", "recheck"), week2: { mon: "drill", wed: "drill", fri: "drill" } } };
  const w = world({ plan });
  for (const k of ["drill", "match", "sprint", "recheck"]) {
    const h = w.drDaysHtml("kida", k);
    const want = DAYS.filter(d => w.retrDayKinds("kida", d).indexOf(k) >= 0);
    ok(k + ": lit days = the builder's retrDayKinds", J(litIn(h)) === J(want), [litIn(h), want]);
  }
  const row = w.drRows("kida").find(r => r.kind === "match");
  const h = w.drDaysHtml("kida", "match");
  ok("title is the card's own (🎯 Match & Play) and the child's name", h.indexOf("\u{1F3AF} Match &amp; Play") >= 0 && h.indexOf("· Kid A") >= 0);
  ok("minutes + on their own exactly as the line", h.indexOf(">" + row.min + " min · " + row.mom + "<") >= 0 && row.mom === "on their own", row);
  const hd = w.drDaysHtml("kida", "drill");
  ok("Daily Drill: 5 min · with Mom", hd.indexOf(">5 min · with Mom<") >= 0);
  ok("five day buttons Mon–Fri", (h.match(/class="ce-chip dr-day/g) || []).length === 5 && /drDaysTap\('mon'\)[\s\S]*drDaysTap\('fri'\)/.test(h));
  ok("\"saves by itself\" before a tap", /it saves by itself/.test(h));
  ok("a Done button and the Mastery link", /onclick="drDaysClose\(\)">Done</.test(h) && /onclick="drDaysMastery\(\)"[^>]*>More settings/.test(h));
  ok("no grade words, no 'retrieval' on the sheet", !/retrieval|rhythm|slot/i.test(h.replace(/<[^>]*>/g, "")));
  w.drDaysOpen("kida", "match");
  w.drDaysMastery();
  ok("the Mastery link = drGo for this child (closes the sheet)", w.mhqKid === "kida" && w.mhqView === "retr" && J(w.nav) === '["mhq"]' && w.__state().kid === null);
  w.drDaysOpen("kida", "drill"); w.drDaysClose();
  ok("Done closes and repaints the page behind", w.__state().kid === null && w.renders.length === 1);
}

console.log("8. which lines open the sheet");
{
  const w = world({ plan: { kida: { week: wk("drill", "off", "off", "off", "off") }, kidb: { week: wk("sprint", "off", "off", "off", "off"), week2: { tue: "match" } } } });
  const a = w.drStripChips("kida");
  ok("a line that runs opens its sheet", /class="dr-row" onclick="drDaysOpen\('kida','drill'\)"/.test(a), a);
  const b = w.drStripChips("kidb");
  ok("a greyed can't-run line keeps drGo", /class="dr-row" onclick="drGo\('kidb'\)"[^>]*>[^<]*Sprint/.test(b), b);
  ok("…the running Match line on the same child opens its sheet", /onclick="drDaysOpen\('kidb','match'\)"/.test(b));
  ok("drDaysOpen on a kind that can't run → Mastery, never the sheet", w.drDaysOpen("kidb", "sprint") === false && w.mhqKid === "kidb" && w.mhqView === "retr" && !w.__state().kid);
  ok("…nothing written", w.writes.length === 0);
  const w2 = world();
  const e = w2.drStripChips("kida");
  ok("the empty-state chip opens ＋ Add subject ▸ Card practice (DRILLADD, slice 4 — test_drill_add.js)", /class="dr-empty" onclick="daOpen\('kida'\)"/.test(e), e);
}

console.log("9. random taps keep the rules");
{
  const K = ["drill", "match", "sprint", "recheck"], pick = a => a[Math.floor(Math.random() * a.length)];
  let bad = 0, refused = 0, n = 0;
  for (let i = 0; i < 400; i++) {
    const w1 = {}, w2 = {};
    DAYS.forEach(d => { w1[d] = pick(K.concat(["off", "off"])); if (Math.random() < .6) w2[d] = pick(K.concat(["off"])); });
    const plan = { kida: { week: w1, week2: w2 } };
    const w = world({ plan });
    const k = pick(K), d = pick(DAYS);
    w.drDaysOpen("kida", k);
    const before = {}; DAYS.forEach(x => { before[x] = w.retrDayKinds("kida", x).slice().sort(); });
    const wasOn = before[d].indexOf(k) >= 0;
    const res = w.drDaysTap(d); n++;
    const after = {}; DAYS.forEach(x => { after[x] = w.retrDayKinds("kida", x).slice().sort(); });
    if (!res) {
      // refused: the day already held two other kinds; nothing written
      if (wasOn || before[d].length !== 2 || w.writes.length) bad++; else refused++;
      continue;
    }
    const want = wasOn ? before[d].filter(x => x !== k) : before[d].concat([k]).sort();
    if (J(after[d]) !== J(want)) bad++;
    if (DAYS.some(x => x !== d && J(after[x]) !== J(before[x]))) bad++;
    const p = w.writes[0].v;
    if (J(Object.keys(p.week)) !== J(DAYS) || Object.keys(p.week2).some(x => p.week2[x] === p.week[x] || p.week2[x] === "off") || "settings" in p) bad++;
    if (after[d].length > 2) bad++;
  }
  ok("400 random taps: only that kind on that day moves, ≤2 a day, no duplicates, whole row, never settings (" + refused + " refused)", bad === 0, bad);
}

console.log("10. source");
{
  const code = DRILLDAYS.replace(/^\s*\/\/.*$/gm, "");
  ok("block writes only through drPlanWrite (no db.ref, no set/update/remove)", !/db\.ref|\.set\(|\.update\(|\.remove\(/.test(code.replace(/classList\.remove\(/g, "")));
  ok("drPlanWrite is handed week + week2 only, rhythm on", /drPlanWrite\(kid,\{week:week,week2:week2\},\{rhythm:true\}\)/.test(code));
  ok("no 🔀 emoji", DRILLDAYS.indexOf("\u{1F500}") < 0);
  ok("no kid names in the block", !/lincoln|ellis|lucy|julian|caleb|andrew|taylor|makenzie/i.test(code));
  ok("builder untouched: retrDayKinds still the RETRFAM filter", /function retrDayKinds\(kid,dk\)\{\n  const out=\[\], lad=retrHasLadder\(kid\);/.test(src));
  ok("marked block in house style, cites her yes of 2026-11-21 and the design", /\/\/ DRILLDAYS_START — /.test(DRILLDAYS) && /2026-11-21/.test(DRILLDAYS) && /DESIGN_drill_rows_curriculum_2026-11-19\.md/.test(DRILLDAYS));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
