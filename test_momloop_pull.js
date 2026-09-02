/*
 * Node tests for MOM LOOP STAGE 2 — the loop feeds the schedule view.
 *
 * Her rules, 2026-09-01:
 *   · when the loop says a kid has Mom, their next Mom-required card is pulled forward in
 *     the rendered day
 *   · the card the kid could already be working on must NOT move — a kid works on a card
 *     before it's checked off, and it (usually the notebook) is the buffer while Mom arrives
 *   · so the pulled card sits right AFTER the in-flight card; times can change, order of
 *     everything else is preserved
 *   · derived at render time, nothing written — when the loop moves on, the old order
 *     simply re-derives
 *   · the kid sees a banner on their own page; Mom's strip names the card
 *
 *   run:  node test_momloop_pull.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// MOMLOOP_START"), b = src.indexOf("// MOMLOOP_END");
if (a < 0 || b < 0) { console.error("MOMLOOP markers not found"); process.exit(1); }
const BLOCK = src.slice(a, b);

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

// Faithful copies of the app's own time helpers (index.html).
function toMin(s) {
  const p = String(s || "").match(/(\d+):(\d+)\s*(AM|PM)/i); if (!p) return 0;
  let h = parseInt(p[1]);
  if (p[3].toUpperCase() === "PM" && h !== 12) h += 12;
  if (p[3].toUpperCase() === "AM" && h === 12) h = 0;
  return h * 60 + parseInt(p[2]);
}
function fromMin(m) {
  let h = Math.floor(m / 60), mn = m % 60;
  const ap = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12; else if (h > 12) h -= 12;
  return h + ":" + String(mn).padStart(2, "0") + " " + ap;
}

// Lincoln's real Tuesday shape (week 20, 2026-09-01): independent morning, Mom work after
// lunch — the exact day that surfaced this stage.
function lincolnDay() {
  return [
    { id: "l_nb",   who: "lincoln", day: "monday", time: "10:00 AM", dur: 5,  mom: "none",     title: "Morning Notebook" },
    { id: "l_eggs", who: "lincoln", day: "monday", time: "10:05 AM", dur: 25, mom: "none",     title: "Eggspress" },
    { id: "l_read", who: "lincoln", day: "monday", time: "10:30 AM", dur: 20, mom: "none",     title: "Ind Reading" },
    { id: "l_sing", who: "lincoln", day: "monday", time: "10:50 AM", dur: 25, mom: "maybe",    title: "Singapore Math" },
    { id: "l_lun",  who: "lincoln", day: "monday", time: "12:00 PM", dur: 30, mom: "none",     title: "Lunch" },
    { id: "l_eic",  who: "lincoln", day: "monday", time: "12:30 PM", dur: 15, mom: "required", title: "Editor in Chief" },
    { id: "l_sys",  who: "lincoln", day: "monday", time: "12:45 PM", dur: 15, mom: "required", title: "Spelling You See" },
    { id: "l_clos", who: "lincoln", day: "monday", time: "2:50 PM",  dur: 5,  mom: "none",     title: "Closing Notebook" },
  ];
}

function run(o) {
  o = o || {};
  const kids = o.kids || ["julian", "lucy", "lincoln"];
  const tasks = o.tasks || lincolnDay();
  const ctx = {
    console, ROSTER: kids, db: null,
    checked: o.checked || {},
    getActiveTasks: () => tasks,
    morningComplete: (k) => (o.ready || {})[k] !== false,
    bbActive: (k) => (o.paused || {})[k] ? { phase: "go" } : null,
    momHere: () => true, adminPinUnlocked: true, renderAll: () => {},
    cap: s => String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1),
    esc: s => String(s == null ? "" : s),
    toMin, fromMin,
    Object, Array, String, Number, parseInt, isNaN, Math, JSON, RegExp,
  };
  Object.defineProperty(ctx, "_todayDay", { get: () => "monday" });
  ctx.WK = "week0";
  vm.createContext(ctx); vm.runInContext(BLOCK, ctx);
  vm.runInContext("momLoop=" + JSON.stringify(o.momLoop || {}) + ";", ctx);
  if (o.momHold) vm.runInContext("momHold=" + JSON.stringify(o.momHold) + ";", ctx);
  // Check a card off the way the app does: mark it, then let the loop react.
  const check = (id) => { ctx.checked[id] = "x"; vm.runInContext("mlOnCheck(getActiveTasks().find(t=>t.id===" + JSON.stringify(id) + "))", ctx); };
  return { ctx, call: e => vm.runInContext(e, ctx), tasks, check };
}
function timesOf(out) { const m = {}; out.forEach(t => m[t.id] = t.time); return m; }

// ── the pull: Mom's card slots in right after the in-flight card ──
console.log("── the pull ──");
{
  // Only Lincoln ready → mlNow = lincoln (borrowed from julian).
  const w = run({ ready: { julian: false, lucy: false } });
  const out = w.call("mlPullForward(getActiveTasks())");
  const T = timesOf(out);
  ok("in-flight card (notebook) does not move", T.l_nb === "10:00 AM", T);
  ok("Mom card pulled to right after the in-flight card", T.l_eic === "10:05 AM", T);
  ok("jumped card 1 (Eggspress) shifts by the Mom card's length", T.l_eggs === "10:20 AM", T);
  ok("jumped card 2 (Ind Reading) shifts by the Mom card's length", T.l_read === "10:45 AM", T);
  ok("jumped card 3 (Singapore, mom=maybe) shifts too", T.l_sing === "11:05 AM", T);
  ok("lunch never shifts", T.l_lun === "12:00 PM", T);
  ok("cards after the vacated slot are untouched (Spelling)", T.l_sys === "12:45 PM", T);
  ok("cards after the vacated slot are untouched (Closing)", T.l_clos === "2:50 PM", T);
  ok("order by time is now nb, EIC, eggs, read, sing",
    out.filter(t => t.who === "lincoln" && t.id !== "l_lun").sort((x, y) => toMin(x.time) - toMin(y.time)).map(t => t.id).slice(0, 5).join(",") === "l_nb,l_eic,l_eggs,l_read,l_sing");
  ok("derived, not mutated: source array untouched", w.tasks.find(t => t.id === "l_eic").time === "12:30 PM");
}
{
  // In-flight card checked off → the next card becomes the buffer, Mom card follows IT.
  const w = run({ ready: { julian: false, lucy: false }, checked: { l_nb: "10:24 AM" } });
  const T = timesOf(w.call("mlPullForward(getActiveTasks())"));
  ok("after check-off the next card is the new buffer", T.l_eggs === "10:05 AM", T);
  ok("Mom card re-derives to follow the new buffer", T.l_eic === "10:30 AM", T);
}
{
  // Mom card already next (or first) → nothing to do.
  const tasks = lincolnDay();
  tasks.find(t => t.id === "l_eic").time = "10:03 AM"; // now 2nd by time
  const w = run({ ready: { julian: false, lucy: false }, tasks });
  ok("already next → schedule untouched", w.call("mlPullForward(getActiveTasks())===getActiveTasks()"));
}
{
  // Checked mom cards are skipped: earliest UNchecked required is what pulls.
  const w = run({ ready: { julian: false, lucy: false }, checked: { l_eic: "x" } });
  const T = timesOf(w.call("mlPullForward(getActiveTasks())"));
  ok("checked Mom card stays put", T.l_eic === "12:30 PM", T);
  ok("next unchecked Mom card (Spelling) pulls instead", T.l_sys === "10:05 AM", T);
}

console.log("── the pull follows the loop's decision ──");
{
  // Nobody ready → no pull.
  const w = run({ ready: { julian: false, lucy: false, lincoln: false } });
  ok("nobody ready → schedule untouched", w.call("mlPullForward(getActiveTasks())===getActiveTasks()"));
}
{
  // Cursor kid (julian) ready with his own Mom work → HIS card pulls, lincoln's stays.
  const tasks = lincolnDay().concat([
    { id: "j_nb",  who: "julian", day: "monday", time: "10:00 AM", dur: 10, mom: "none",     title: "Julian Notebook" },
    { id: "j_ret", who: "julian", day: "monday", time: "10:10 AM", dur: 10, mom: "none",     title: "Retrieval" },
    { id: "j_dr",  who: "julian", day: "monday", time: "10:20 AM", dur: 10, mom: "required", title: "Julian Drills" },
  ]);
  const w = run({ tasks, ready: { lucy: false } });
  const T = timesOf(w.call("mlPullForward(getActiveTasks())"));
  ok("cursor kid's Mom card pulls after his in-flight card", T.j_dr === "10:10 AM", T);
  ok("other kids' cards never move (Lincoln EIC)", T.l_eic === "12:30 PM", T);
  ok("other kids' cards never move (Lincoln Eggspress)", T.l_eggs === "10:05 AM", T);
}
{
  // The turn kid on a break → loop hands on, pull follows.
  const w = run({ ready: { julian: false, lucy: false }, paused: { lincoln: true } });
  ok("paused kid gets no pull", w.call("mlPullForward(getActiveTasks())===getActiveTasks()"));
}

console.log("── mlNextCard ──");
{
  const w = run({ ready: { julian: false, lucy: false } });
  ok("points at the earliest unchecked Mom-required card", w.call("mlNextCard('lincoln').id") === "l_eic");
  ok("null for a kid with no Mom work", w.call("mlNextCard('lucy')") === null);
  const w2 = run({ ready: { julian: false, lucy: false }, checked: { l_eic: "x", l_sys: "x" } });
  ok("null when all Mom work is done", w2.call("mlNextCard('lincoln')") === null);
}

console.log("── the kid banner ──");
{
  const w = run({ ready: { julian: false, lucy: false } });
  const h = w.call("mlBannerHTML('lincoln')");
  ok("banner shows for the kid the loop picked", h.indexOf("Mom&rsquo;s ready for you") >= 0);
  ok("banner names the card", h.indexOf("Editor in Chief") >= 0);
  ok("borrowed turn does not say ‘your turn’", h.indexOf("your turn") < 0);
  ok("no banner for other kids", w.call("mlBannerHTML('lucy')") === "");
  const w2 = run({ momLoop: { order: ["julian", "lucy", "lincoln"], cursor: 2 }, ready: { julian: false, lucy: false } });
  ok("own turn says ‘your turn’", w2.call("mlBannerHTML('lincoln')").indexOf("your turn") >= 0);
}

console.log("── Mom's strip names the card ──");
{
  const w = run({ ready: { julian: false, lucy: false } });
  const h = w.call("mlStripHTML()");
  ok("strip shows now-with kid and the card", h.indexOf("Lincoln") >= 0 && h.indexOf("Editor in Chief") >= 0);
}

// ── the hold: "once checked, who has it has it" (her scenario 2026-09-01) ──
// Lucy is planned first; Lincoln finishes his routine first and borrows.
function lucyPlan(extra) {
  return {
    kids: ["lucy", "lincoln"],
    momLoop: { order: ["lucy", "lincoln"], cursor: 0 },
    tasks: lincolnDay().concat([
      { id: "u_nb", who: "lucy", day: "monday", time: "10:00 AM", dur: 10, mom: "none",     title: "Lucy Notebook" },
      { id: "u_dim", who: "lucy", day: "monday", time: "10:10 AM", dur: 25, mom: "required", title: "Lucy Dimensions" },
    ]),
    ...extra,
  };
}
console.log("── before the buffer is checked, the plan holds ──");
{
  // Lucy finishes her routine BEFORE Lincoln checks his notebook → back to Lucy, plan kept.
  const o = lucyPlan({ ready: { lucy: false } });
  const w = run(o);
  ok("Lincoln borrows while Lucy is on her routine", w.call("mlNow().kid") === "lincoln" && w.call("mlNow().borrowed") === true);
  o.ready.lucy = true; // her routine completes; nothing was checked
  ok("Lucy ready before his buffer check → turn snaps back to Lucy", w.call("mlNow().kid") === "lucy");
  ok("and no hold exists", w.call("mlHold()") === null);
}
console.log("── once checked, who has it has it ──");
{
  const o = lucyPlan({ ready: { lucy: false } });
  const w = run(o);
  w.check("l_nb"); // Lincoln checks his notebook while borrowing — he has STARTED
  ok("buffer check sets the hold on his Mom card", JSON.stringify(w.call("momHold")) === JSON.stringify({ kid: "lincoln", id: "l_eic", day: "monday" }));
  o.ready.lucy = true; // Lucy finishes her routine mid-session
  ok("Lucy ready mid-session → Lincoln KEEPS Mom", w.call("mlNow().kid") === "lincoln");
  ok("and the turn reads as started", w.call("mlNow().held") === true);
  const T = timesOf(w.call("mlPullForward(getActiveTasks())"));
  ok("his started Mom card now renders FIRST", T.l_eic === "10:05 AM", T);
  ok("banner says he's with Mom", w.call("mlBannerHTML('lincoln')").indexOf("You&rsquo;re with Mom") >= 0);
  ok("strip marks the turn (started)", w.call("mlStripHTML()").indexOf("(started)") >= 0);
  w.check("l_eic"); // Mom card done
  ok("Mom-card check releases the hold", w.call("mlHold()") === null);
  ok("next turn follows the loop → Lucy", w.call("mlNow().kid") === "lucy");
}
console.log("── the hold cannot be stolen or faked ──");
{
  // Lucy already ready and picked → Lincoln checking his notebook locks nothing.
  const w = run(lucyPlan({}));
  ok("Lucy (plan) has the turn", w.call("mlNow().kid") === "lucy");
  w.check("l_nb");
  ok("a non-pick kid's check sets no hold", w.call("mlHold()") === null);
  ok("Lucy still has the turn", w.call("mlNow().kid") === "lucy");
}
{
  // Checking a LATER card out of order is not the buffer — no lock.
  const w = run(lucyPlan({ ready: { lucy: false } }));
  w.check("l_read"); // Ind Reading while the notebook is still unchecked
  ok("out-of-order check sets no hold", w.call("mlHold()") === null);
}
{
  // A pause hands Mom on; the hold resumes when the break ends.
  const o = lucyPlan({ ready: { lucy: false }, paused: {} });
  const w = run(o);
  w.check("l_nb");
  o.ready.lucy = true;
  o.paused.lincoln = true;
  ok("paused mid-session → Mom hands on to Lucy", w.call("mlNow().kid") === "lucy");
  o.paused.lincoln = false;
  ok("break over → the hold resumes", w.call("mlNow().kid") === "lincoln" && w.call("mlNow().held") === true);
}
{
  // Another device checked the held card (no local mlOnCheck) → hold derives away.
  const o = lucyPlan({ ready: { lucy: false }, momHold: { kid: "lincoln", id: "l_eic", day: "monday" } });
  const w = run(o);
  ok("hold honored from sync", w.call("mlNow().kid") === "lincoln" && w.call("mlNow().held") === true);
  w.ctx.checked.l_eic = "x"; // arrives via the checked listener, not a local check
  ok("held card checked elsewhere → hold is over", w.call("mlHold()") === null);
}
{
  // Yesterday's hold means nothing.
  const w = run(lucyPlan({ momHold: { kid: "lincoln", id: "l_eic", day: "friday" } }));
  ok("stale-day hold ignored", w.call("mlHold()") === null && w.call("mlNow().kid") === "lucy");
}
{
  // Mom's "Start the loop on X" override clears a hold.
  const o = lucyPlan({ ready: { lucy: false }, momHold: { kid: "lincoln", id: "l_eic", day: "monday" } });
  const w = run(o);
  w.call("mlSetCursor('lucy')");
  ok("cursor override clears the hold", JSON.stringify(w.call("momHold")) === "{}");
}

console.log("");
console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
