/*
 * MOMPEND — a card SENT TO MOM to check counts as finished for the fill-in (her report 2026-10-15):
 *   "Still holding up the schedule when waiting for things to get checked off. It's messing with the algorithm of
 *    letting things fill in the blanks. It shouldn't be. It should just go to Mom for her to check, and she can send it
 *    back to the kids later or the next day and say 'you're not done with this.'"
 * The day's end, the living-day lay and the school-end rule already use "done OR sent to Mom"; the ⏩ early-finish
 * fill-in (efPullNext) and the cascade's gap float tested `checked` only. This replays Lincoln's real Thursday 2026-10-15
 * (week27): everything checked but MR5, which he sent to Mom at 3:32 PM; AAS, Geography and WriteShop fell off Thursday
 * to Friday. Then Mom sends MR5 back — the hand-back must work exactly as before.
 *   run:  node test_mom_pending_fill.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// EFPULL_START"), b = src.indexOf("// EFPULL_END");
if (a < 0 || b < 0) { console.error("EFPULL markers not found"); process.exit(1); }
const BLOCK = src.slice(a, b);
function slice(n) { const i = src.indexOf("function " + n); if (i < 0) { console.error(n + " not found"); process.exit(1); } return src.slice(i, src.indexOf("\n}", i) + 2); }
const HELPERS = slice("toMin") + "\n" + slice("fromMin");
const REJECT = slice("momReject(");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }

function card(id, who, day, time, dur, mom, sk, title, extra) { return Object.assign({ id, who, day, time, dur, mom: mom || "none", subjectKey: sk, title: title || sk }, extra || {}); }
function world(o) {
  const writes = [], toasts = [], logs = [], removes = [], sentBack = [];
  const ctx = {
    console, WK: "week27", weekData: { tasks: o.tasks }, checked: o.checked || {}, claimed: o.claimed || {}, fbTasksLoaded: true, momMoves: {},
    _todayDay: o.today || "thursday", DAY_DT: {}, lastTasksWrite: 0,
    _mlNowMin: () => o.now, _mlDayEndMin: () => 16 * 60 + 15, _mlLunchWin: () => [13 * 60, 14 * 60],
    mlMomOff: () => false, mlNow: () => ({ kid: o.momWith === undefined ? null : o.momWith }),
    planPace: (kid, sk) => ({ behind: (o.behind || {})[sk] || 0, ahead: 0 }),
    catchupDayCap: () => 2, taskSubject: t => t.subjectKey,
    subjNoCarry: t => /retrieval|reflex|_flash|daily_/.test(t.subjectKey || ""), _mlDayOf: t => t.day,
    sv: () => {}, dbg: m => logs.push(m), gwShowToast: m => toasts.push(m), cap: s => s, _dryRun: () => false,
    db: { ref: p => ({ update: u => writes.push([p, u]), set: v => writes.push([p, "SET", v]), remove: () => writes.push([p, "REMOVE"]) }) },
    // Mom's ↩ Send back (momReject) — stubs for what it touches
    momHere: () => true, renderAll: () => {}, obRemove: (p, v) => removes.push([p, v]), coMarkSentBack: (id, mode) => sentBack.push([id, mode]),
    Object, String, Array, Math, Date, RegExp, parseInt, JSON,
  };
  vm.createContext(ctx); vm.runInContext(HELPERS, ctx); vm.runInContext(BLOCK, ctx); vm.runInContext(REJECT, ctx);
  return { ctx, writes, toasts, logs, removes, sentBack, call: e => vm.runInContext(e, ctx), pull: k => vm.runInContext("efPullNext('" + (k || "lincoln") + "')", ctx) };
}
// Lincoln's Thursday 2026-10-15 (week27, read-only copy): notebook + MR5 sent to Mom, the rest checked by 12:50 PM except the
// closing notebook; AAS / Geography / WriteShop fell off Thursday to Friday (the school-end rule rolled them).
function lincolnThursday() {
  const nb = card("nb", "lincoln", "thursday", "10:00 AM", 5, "none", "morning_nb", "📖 Morning Notebook");
  const ger = card("ger", "lincoln", "thursday", "10:05 AM", 25, "required", "german_flash_cards", "💻 German Flash Cards");
  const eic = card("eic", "lincoln", "thursday", "10:10 AM", 15, "maybe", "conventions", "📱 Editor in Chief — Sitting 6");
  const mr5 = card("lincoln_lincoln__mr_pages_L0044", "lincoln", "thursday", "10:50 AM", 25, "maybe", "mr_pages", "📄 MR5 Math Reasoning — MR5 pp.308–311");
  const sci = card("sci", "lincoln", "thursday", "11:15 AM", 25, "maybe", "rs4k6", "📖 Real Science-4-Kids — Science Book 6");
  const drill = card("2026d288_retr_drill_lincoln", "lincoln", "thursday", "12:45 PM", 5, "required", "retrieval", "🃏 Daily Drill");
  const close = card("close", "lincoln", "thursday", "2:00 PM", 5, "none", "closing_nb", "📖 Closing Notebook");
  const aas = card("aas", "lincoln", "friday", "11:55 AM", 25, "required", "aas", "📄 AAS Lesson — L2-19", { rolledFrom: "thursday" });
  const geo = card("geo", "lincoln", "friday", "12:15 PM", 15, "none", "geography", "📄 Skill Sharpeners: Geography — Unit 2", { rolledFrom: "thursday" });
  const ws = card("ws", "lincoln", "friday", "2:25 PM", 25, "required", "writeshop", "📖 WriteShop I — Lesson 1b", { cascadedFrom: "thursday" });
  const aas2 = card("aas2", "lincoln", "saturday", "10:00 AM", 25, "required", "aas", "📄 AAS Lesson — L2-20");
  const ellis = card("ellis_ls", "ellis", "thursday", "10:27 AM", 25, "maybe", "lang_smarts", "📄 Language Smarts D");
  const checked = {}; [ger, eic, sci, drill].forEach(t => { checked[t.id] = "12:50 PM Oct 15"; });
  const claimed = { nb: "10:18 AM Oct 15", [mr5.id]: "03:32 PM Oct 15", ellis_ls: "03:47 PM Oct 15" };
  return { tasks: [nb, ger, eic, mr5, sci, drill, close, aas, geo, ws, aas2, ellis], checked, claimed, cards: { nb, ger, eic, mr5, sci, drill, close, aas, geo, ws, aas2, ellis } };
}
const NOW = 15 * 60 + 32;   // 3:32 PM — the moment MR5 went to Mom
const BEHIND = { aas: 2, geography: 1, writeshop: 1 };

console.log("── the source: one 'done or sent to Mom' test in the fill-in ──");
{
  ok("MOMPEND block sits inside EFPULL", BLOCK.indexOf("// MOMPEND_START") > 0 && BLOCK.indexOf("// MOMPEND_END") > BLOCK.indexOf("// MOMPEND_START"));
  ok("_efDone reads checked and claimed", /function _efDone\(id\)[\s\S]*checked\[id\][\s\S]*claimed\[id\]/.test(BLOCK));
  ok("'still has open work today' uses it", /mine\.some\(function\(t\)\{ return !_efIsClose\(t\)&&!_efDone\(t\.id\); \}\)\) return null;/.test(BLOCK));
  ok("…and so does eligibility (a claimed card is never pulled or slid)", /function _efEligible\(t,kid\)\{[\s\S]*?if\(_efDone\(t\.id\)\) return false;/.test(BLOCK));
  ok("no checked-only test is left in the block", !/!\(checked&&checked\[t\.id\]\)/.test(BLOCK));
  // the claim path (kid taps "I'm done" → sent to Mom) fires the same pull a check-off does
  const ci = src.indexOf("if(pendingClaimMode){"), ce = src.indexOf("return;", ci);
  const claimPath = src.slice(ci, ce);
  ok("sending a card to Mom fires efPullNext for that kid (same line finalizeDone uses)", /efPullNext\(t\.who\)/.test(claimPath) && /effectiveDay\(t\)===_todayDay/.test(claimPath), claimPath.length);
  ok("…on the next tick (setTimeout 0), ahead of the 600 ms celebration, as in finalizeDone", /setTimeout\(function\(\)\{ try\{ if\(efPullNext\(t\.who\)[^\n]*\},0\)/.test(claimPath));
}

console.log("\n── replay: Lincoln sends MR5 to Mom at 3:32 PM — the day fills in ──");
{
  const L = lincolnThursday(), c = L.cards;
  const w = world({ tasks: L.tasks, checked: L.checked, claimed: L.claimed, now: NOW, behind: BEHIND });
  const got = w.pull();
  ok("a card waiting on Mom does not hold the day: the most-behind fell-off lesson (AAS) comes to today", got && got.id === "aas", got && got.id);
  ok("it lands at the moment he sent MR5 (3:32 PM), from Friday", c.aas.day === "thursday" && c.aas.time === "3:32 PM" && c.aas.pulledFrom === "friday" && c.aas.rolledFrom === undefined, [c.aas.day, c.aas.time, c.aas.pulledFrom]);
  ok("AAS L2-20 slides up into Friday's slot (lesson order holds)", c.aas2.day === "friday" && c.aas2.time === "11:55 AM", [c.aas2.day, c.aas2.time]);
  ok("MR5 itself did not move and is still with Mom", c.mr5.day === "thursday" && c.mr5.time === "10:50 AM" && w.ctx.claimed[c.mr5.id] === "03:32 PM Oct 15" && !w.ctx.checked[c.mr5.id]);
  ok("Geography and WriteShop stay on Friday", c.geo.day === "friday" && c.ws.day === "friday");
  ok("exactly one write: a targeted multi-path update of week27/tasks — nothing to checked/claimed/history", w.writes.length === 1 && w.writes[0][0] === "week27/tasks" && Object.keys(w.writes[0][1]).every(k => /^(aas|aas2)\//.test(k)), w.writes.map(x => x[0]));
  ok("…6 paths: AAS day/time/pulledFrom/rolledFrom(cleared), L2-20 day/time", Object.keys(w.writes[0][1]).length === 6 && w.writes[0][1]["aas/rolledFrom"] === null, Object.keys(w.writes[0][1]));
  ok("the kid hears what is next", w.toasts.length === 1 && /next up: .*AAS Lesson — L2-19 \(from Friday\)/.test(w.toasts[0]), w.toasts);
  ok("nothing more until the pulled card is done", w.pull() === null && w.writes.length === 1);

  console.log("\n── …then Mom's ↩ Send back hands MR5 back exactly as before ──");
  w.call("momReject('" + c.mr5.id + "','now')");
  ok("the claim comes off (local + targeted remove of week27/claimed/<id>)", w.ctx.claimed[c.mr5.id] === undefined && w.removes.length === 1 && w.removes[0][0] === "week27/claimed/" + c.mr5.id && w.removes[0][1] === "03:32 PM Oct 15", w.removes);
  ok("the '↩ Do this again' marker is written the usual way", w.sentBack.length === 1 && w.sentBack[0][0] === c.mr5.id && w.sentBack[0][1] === "now", w.sentBack);
  ok("Mom sees the usual toast", /↩ Sent back — do it again now/.test(w.toasts[w.toasts.length - 1]), w.toasts);
  ok("MR5 is open again on Thursday at its own time — nothing else moved", c.mr5.day === "thursday" && c.mr5.time === "10:50 AM" && !w.ctx.checked[c.mr5.id]);
  ok("the pulled AAS stays on today (nothing is undone)", c.aas.day === "thursday" && c.aas.time === "3:32 PM");
  ok("with MR5 open again the fill-in waits: no second pull, no new write", w.pull() === null && w.writes.length === 1);
  // he redoes it and checks it; AAS (pulled, unchecked) is still open → still nothing more
  w.ctx.checked[c.mr5.id] = "03:40 PM Oct 15"; w.call("_mlNowMin=()=>15*60+40");
  ok("MR5 checked after the redo, AAS still open → still nothing more", w.pull() === null && w.writes.length === 1);
  w.ctx.checked[c.aas.id] = "03:45 PM Oct 15"; w.call("_mlNowMin=()=>15*60+45");
  const got2 = w.pull();
  ok("AAS done at 3:45 → the next fell-off lesson follows (Geography) right after AAS ends at 3:57 — cards never stack", got2 && got2.id === "geo" && c.geo.day === "thursday" && c.geo.time === "3:57 PM", got2 && [got2.id, c.geo.time]);
}

console.log("\n── the controls: the same day with MR5 open / checked ──");
{
  const L = lincolnThursday(), c = L.cards; delete L.claimed[c.mr5.id];
  const w = world({ tasks: L.tasks, checked: L.checked, claimed: L.claimed, now: NOW, behind: BEHIND });
  ok("MR5 simply open (not sent) → no pull, no write", w.pull() === null && w.writes.length === 0 && c.aas.day === "friday");
}
{
  const L = lincolnThursday(), c = L.cards; delete L.claimed[c.mr5.id]; L.checked[c.mr5.id] = "03:32 PM Oct 15";
  const w = world({ tasks: L.tasks, checked: L.checked, claimed: L.claimed, now: NOW, behind: BEHIND });
  const got = w.pull();
  ok("MR5 checked → the identical pull (sent to Mom now behaves like a check-off here)", got && got.id === "aas" && c.aas.time === "3:32 PM");
}
{
  const L = lincolnThursday(), c = L.cards; delete L.claimed.nb;   // the Morning Notebook plain unchecked (it reads as "assumed" only in the lay, not here)
  const w = world({ tasks: L.tasks, checked: L.checked, claimed: L.claimed, now: NOW, behind: BEHIND });
  ok("an unsent Morning Notebook is still open work → no pull (unchanged)", w.pull() === null && w.writes.length === 0);
}

console.log("\n── a claimed card on a later day is never the one pulled, nor slid ──");
{
  const L = lincolnThursday(), c = L.cards;
  L.claimed.geo = "09:00 AM Oct 15";   // Geography already sent to Mom (worked ahead on Friday's card)
  const w = world({ tasks: L.tasks, checked: L.checked, claimed: L.claimed, now: NOW, behind: { geography: 9, aas: 1, writeshop: 0 } });
  const got = w.pull();
  ok("Geography (behind 9, but with Mom) is skipped; AAS comes instead", got && got.id === "aas" && c.geo.day === "friday" && c.geo.time === "12:15 PM", got && got.id);
}
{
  const L = lincolnThursday(), c = L.cards;
  L.claimed.aas = "09:00 AM Oct 15";   // Friday's AAS L2-19 already with Mom; L2-20 on Saturday has no fell-off stamp
  const w = world({ tasks: L.tasks, checked: L.checked, claimed: L.claimed, now: NOW, behind: { aas: 9, geography: 1, writeshop: 0 } });
  const got = w.pull();
  ok("AAS chain: the claimed L2-19 is not pulled and L2-20 (no fell-off stamp) is not auto-pulled → Geography comes", got && got.id === "geo" && c.aas.day === "friday" && c.aas2.day === "saturday", got && got.id);
}

console.log("\n── the other gates still hold with a card at Mom ──");
{
  const L = lincolnThursday(), c = L.cards;
  const w = world({ tasks: L.tasks, checked: L.checked, claimed: L.claimed, now: NOW, behind: BEHIND, momWith: "lucy" });
  const got = w.pull();
  ok("Mom with Lucy → Mom-required AAS/WriteShop skipped, Geography (no Mom) fills in", got && got.id === "geo" && c.aas.day === "friday" && c.ws.day === "friday", got && got.id);
}
{
  const L = lincolnThursday();
  const w = world({ tasks: L.tasks, checked: L.checked, claimed: L.claimed, now: 16 * 60 + 5, behind: BEHIND });
  ok("4:05 PM: nothing fits before the 4:15 school end → no pull", w.pull() === null && w.writes.length === 0);
}
{
  const L = lincolnThursday();
  const w = world({ tasks: L.tasks, checked: L.checked, claimed: L.claimed, now: NOW, behind: BEHIND });
  ok("Ellis: day done (his one card is with Mom) but nothing fell off → nothing pulled, nothing written", w.pull("ellis") === null && w.writes.length === 0);
}
{
  const L = lincolnThursday();
  const w = world({ tasks: L.tasks, checked: L.checked, claimed: {}, now: NOW, behind: BEHIND });
  delete w.ctx.claimed; w.call("claimed=undefined");
  ok("no `claimed` map at all (older device state) → _efDone falls back to checked without throwing", w.call("_efDone('ger')") === true && w.call("_efDone('aas')") === false);
}

console.log("\n── the cascade's gap float: a card with Mom is finished — never floated into a blank, never waited on ──");
{
  const ga = src.indexOf("  // ── Gap-backfill (resource-aware)");
  const gb = src.indexOf("  // 🧩 a carried page-book sitting landing beside the day's own sitting folds into one card", ga);
  ok("Gap-backfill block found", ga > 0 && gb > ga);
  const gblock = src.slice(ga, gb);
  ok("the float skips a claimed card the same way it skips a checked one", /occ\.filter\(t=>!checked\[t\.id\]&&!_isNote\(t\)[^\n]*\n\s*\.filter\(t=>!\(typeof claimed!=="undefined"&&claimed&&claimed\[t\.id\]\)\)/.test(gblock));
  ok("the closing-notebook re-tuck does not wait behind a claimed card", /!checked\[t\.id\]&&!\(typeof claimed!=="undefined"&&claimed&&claimed\[t\.id\]\)\) \(byKid/.test(gblock));
  const tm = s => { const m = String(s).match(/(\d+):(\d+)\s*(AM|PM)/i); let h = +m[1] % 12; if (/pm/i.test(m[3])) h += 12; return h * 60 + +m[2]; };
  const fm = n => { let h = Math.floor(n / 60), m = n % 60, ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return h + ":" + String(m).padStart(2, "0") + " " + ap; };
  function replay(tasks, checked, claimed) {
    const run = new Function("weekData", "currData", "checked", "claimed", "toMin", "fromMin", `
      const dayOrder=["thursday"], todayIdx=0, today="thursday", _nowMin=10*60, _todaySchoolOver=false;
      const sd={defaultStart:"10:00 AM",lunchStart:"1:00 PM",lunchEnd:"2:00 PM"};
      const _cascDate=d=>"2026-10-15"; const coopApplyStart=()=>({}); const taskDevice=t=>t.device||null; const taskSubject=t=>t.subjectKey;
      const _isNote=t=>/notebook/i.test(t.title||""); const _isClose=t=>/closing/i.test(t.title||""); const fxIsClass=()=>false;
      ` + gblock);
    run({ tasks }, { subjects: {} }, checked, claimed, tm, fm);
    return tasks;
  }
  // Lincoln: Eggspress 10:00–10:25 done, an idle gap, MR5 (sent to Mom) stored at 2:00, Geography 2:30, Closing 3:00
  const mk = () => [
    { id: "egg", who: "lincoln", day: "thursday", time: "10:00 AM", dur: 25, subjectKey: "eggspress", title: "Eggspress" },
    { id: "mr5", who: "lincoln", day: "thursday", time: "2:00 PM", dur: 25, mom: "maybe", subjectKey: "mr_pages", title: "MR5" },
    { id: "geo", who: "lincoln", day: "thursday", time: "2:30 PM", dur: 25, subjectKey: "geography", title: "Geography" },
    { id: "close", who: "lincoln", day: "thursday", time: "3:00 PM", dur: 5, subjectKey: "closing_nb", title: "Closing Notebook" }];
  let out = replay(mk(), { egg: "x" }, { mr5: "x" });
  const by = id => out.find(t => t.id === id);
  ok("MR5 (with Mom) keeps its time — it is not the thing that fills the blank", by("mr5").time === "2:00 PM", by("mr5").time);
  ok("the open Geography floats into the blank (10:25 AM)", by("geo").time === "10:25 AM", by("geo").time);
  ok("the Closing Notebook tucks after the open work, not behind the card with Mom", by("close").time === "10:50 AM", by("close").time);
  out = replay(mk(), { egg: "x" }, {});
  ok("control: the same MR5 not sent to Mom does float (proves the replay exercises the float)", by("mr5").time === "10:25 AM" && by("geo").time === "10:50 AM", [by("mr5").time, by("geo").time]);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
