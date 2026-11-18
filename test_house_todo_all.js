/*
 * test_house_todo_all.js — 🔴 Now and 📝 To do on 🏠 Whole house, 📝 To do on 👤 By person (HOUSETODO in house.js;
 * DESIGN_now_todo_schedule_2026-11-17 §7, slice E; her "Yes, every area" and "c is merged so go to next", 2026-11-17).
 * Made-up family (Ada, Ben, Cal, Mom, Dad).
 *   · Whole house To do: every waiting one-time job once, under its room, rooms in the page's order, ❔ No room last; the very rows a
 *     room's own card draws (rtdRowHTML); sent ones quietly; a room with more than 4 folds to 4 and "+N more";
 *   · ＋ To-do with a room = the room card's exact write; ✓ / un-✓ = rtdTick's writes and its exact restore; Send to… / ⏸ Back to the
 *     pile = hhOnceSend / hhOnceHold's writes;
 *   · By person: on this person's list + waiting ones they can do (hhCanOf), "Give to <Name>" = hhOnceSend(id, who); Mom and Dad too;
 *   · Whole house Now: each room's line = that room's rnRows (left, late, done) — plan off, preview, ON stored, ON not stored; what fit
 *     nobody with the room card's → Give to… (hdGive's write); the line taps write nothing;
 *   · not Mom → no buttons; ?dryrun=1 → nothing written; drawing writes nothing; the rest of every page is byte-for-byte as before.
 *   run: node test_house_todo_all.js
 */
"use strict";
const path = require("path"), vm = require("vm"), V = require(path.join(__dirname, "test_fixtures", "house_vm.js"));
const { K, TODAY, ago, DOW, mk, roomPage, handlers } = V;
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 600) + ")" : "")); } };
const J = x => JSON.stringify(x), strip = s => s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const canon = v => Array.isArray(v) ? v.map(canon) : (v && typeof v === "object") ? Object.keys(v).sort().reduce((a, k) => (a[k] = canon(v[k]), a), {}) : v;
const WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], wd = n => WD[(DOW - n % 7 + 7) % 7];
const O = (id, o) => K(Object.assign({ who: "mom", slot: "", cad: "once", hold: true, src: { kind: "momChore", id } }, o));
const JOBS = () => {
  const j = {
    // the chores of the day
    k_counter: K({ label: "Wipe the counters", emoji: "🧽", who: "ada", slot: "chores", cad: "daily", room: "kitchen", minutes: 10, lastDone: ago(1), can: ["ada", "ben"] }),
    k_sink: K({ label: "Scrub the sink", who: "ada", slot: "chores", cad: "daily", room: "kitchen", minutes: 10, lastDone: ago(4) }),
    k_chairs: K({ label: "Wipe the chairs", who: "ben", slot: "chores", cad: "daily", room: "kitchen", minutes: 5 }),
    m_fridge: K({ label: "Wipe the fridge", who: "mom", slot: "", cad: "daily", room: "kitchen", minutes: 10, src: { kind: "momChore", id: "fridge" }, lastDone: ago(1) }),
    k_mop: K({ label: "Mop the floor", who: "ben", slot: "chores", cad: "wk:" + ((DOW + 3) % 7), room: "kitchen", minutes: 15, can: ["ben", "ada"] }),
    l_dust: K({ label: "Dust the den", who: "ben", slot: "chores", cad: "daily", room: "living", minutes: 5, lastDone: ago(1) }),
    b_tub: K({ label: "Rinse the tub", who: "cal", slot: "chores", cad: "daily", room: "bathdown", minutes: 5, lastDone: ago(1) }),
    x_lost: K({ label: "Dust the old shelf", who: "cal", slot: "chores", cad: "daily", room: "attic_gone", minutes: 5 }),
    // the one-time pile
    o_shelf: O("o_shelf", { label: "Fix the shelf", emoji: "🔨", who: "ben", slot: "chores", room: "kitchen", from: ago(2), can: ["ben", "ada"], src: { kind: "new" }, ts: 2 }),
    o_drawer: O("o_drawer", { label: "Sort the junk drawer", room: "kitchen", from: ago(9), can: ["mom", "ada", "ben", "dad"], ts: 1 }),
    o_sent: K({ label: "Boxes to the curb", who: "cal", slot: "chores", cad: "once", room: "kitchen", from: ago(1), ts: 4 }),
    o_gone: K({ label: "Hang the hooks", who: "ben", slot: "chores", cad: "once", room: "kitchen", status: "retired", done: ago(3), ts: 5 }),
    o_bath: O("o_bath", { label: "New shower curtain", room: "bathdown", from: ago(1), can: ["mom", "dad"] }),
    o_lost: O("o_lost", { label: "Box up the old toys", room: "attic_gone", from: ago(3), can: ["mom", "cal"] }),
    o_dad: K({ label: "Fix the gate", who: "dad", slot: "", cad: "once", room: "entry", from: ago(1), src: { kind: "dadChore", id: "gate" } }),
    p_cab: K({ label: "The art cabinet", who: "mom", slot: "", cad: "asneeded", layer: "project", room: "kitchen", src: { kind: "momChore", id: "cab" } })
  };
  for (let i = 1; i <= 7; i++) j["o_liv" + i] = O("o_liv" + i, { label: "Living job " + i, room: "living", from: ago(10 - i), can: ["mom", "ada"], ts: 10 + i });
  return j;
};
const WAIT = ["o_shelf", "o_drawer", "o_bath", "o_lost"].concat([1, 2, 3, 4, 5, 6, 7].map(i => "o_liv" + i));
const MOMDAY = { [TODAY]: { chores: { fridge: true } } };
const PREVIEW = { takeover: 1, engine: { mode: "preview", on: TODAY } }, ONM = { takeover: 1, engine: { mode: "on", on: ago(3) } };
const DAY = () => ({ [TODAY]: { built: { ok: 1, sig: "x" },
  plan: { k_counter: { who: "ben", mins: 10, order: 0, why: "given", late: 0, k: "daily", from: "ada" }, k_sink: { who: "ada", mins: 10, order: 1, late: 2, k: "daily" }, m_fridge: { who: "mom", mins: 10, order: 0, late: 0, k: "daily" }, l_dust: { who: "ben", mins: 5, order: 1, late: 0, k: "daily" } },
  over: { k_mop: { turn: "ben", mins: 15, k: "days", late: 1 }, x_lost: { turn: "cal", mins: 5, k: "daily", late: 0 } }, done: { m_fridge: { who: "mom", ts: "9:00 AM" } } } });
const MODES = [["plan off", {}], ["preview", { meta: PREVIEW }], ["ON, today stored", { meta: ONM, houseDay: DAY() }], ["ON, today not stored", { meta: ONM }]];
const mkT = o => { o = o || {}; const c = mk({ jobs: o.jobs || JOBS(), momday: MOMDAY, hd: { meta: o.meta || { takeover: 1 } }, houseDay: o.houseDay, dry: o.dry, noMom: o.noMom }); c.event = { stopPropagation: () => {} }; return c; };
const LB = V.RAW.slice(V.RAW.indexOf("// LAUNDRYLINE_START"), V.RAW.indexOf("// LAUNDRYLINE_END"));   // the laundry code, as it is in index.html
const withLaundry = c => { vm.runInContext("var calNormDate=function(s){ return s; }, _lbWrite=function(){ return true; }, kitPinGate=function(){};\n" + LB, c); c.laundryLineOnValue({ log: { [ago(1)]: { ben: { at: 1, done: true } } } }); c.writes.length = 0; return c; };
const house = c => roomPage(c, "");
const person = (c, who) => { c.get('hhView="person"; hpSel=' + J(who)); return c.hpPersonHTML(); };
const run = (c, t) => c.get(t.replace(/this\.value/g, '"ada"'));
const jobs = c => J(c.get("householdData.jobs"));
// The page without HOUSETODO (its hooks are guarded), to compare the rest of each page with.
const without = (c, fn) => { const k = ["htNowHTML", "htdHTML", "htdPersonHTML"], keep = k.map(n => c[n]); k.forEach(n => { c[n] = undefined; }); try { return fn(); } finally { k.forEach((n, i) => { c[n] = keep[i]; }); } };

console.log("\n── 📝 To do on 🏠 Whole house: every room's to-dos, by room ──");
{ const c = mkT(), h = c.htdHTML(), page = house(c), G = c.htdGroups();
  ok("the groups: rooms in the page's order (living, bathdown, kitchen …), ❔ No room last", J(G.map(g => g.rid)) === J(["living", "bathdown", "kitchen", "entry", ""].filter(r => G.some(g => g.rid === r)).sort((a, b) => (a === "" ? 99 : c.hhRoomList().findIndex(x => x[0] === a)) - (b === "" ? 99 : c.hhRoomList().findIndex(x => x[0] === b)))) && G[G.length - 1].rid === "", G.map(g => g.rid));
  ok("each group is that room's own card list (rtdIds), in its order", G.every(g => J(g.ids) === J(c.rtdIds(g.rid))));
  const all = G.reduce((a, g) => a.concat(g.ids), []);
  ok("every waiting one-time job is there exactly once", WAIT.every(id => all.filter(x => x === id).length === 1), all);
  ok("…plus the sent ones (Boxes to the curb, Fix the gate); not the retired one, not the project, no repeating chore", all.includes("o_sent") && all.includes("o_dad") && !all.includes("o_gone") && !all.includes("p_cab") && !all.includes("k_counter") && all.length === WAIT.length + 2, all);
  ok("a job whose room is no longer on the list sits under ❔ No room", J((G.find(g => g.rid === "") || {}).ids) === J(["o_lost"]) && /❔ No room · 1/.test(strip(h)));
  ok("each row is drawn by the room card's own row code (the same bytes as on the room page)", c.rtdIds("kitchen").every(id => h.indexOf(c.rtdRowHTML(id, c.hhJobs()[id], true, TODAY)) > 0) && c.rtdHTML("kitchen").indexOf(c.rtdRowHTML("o_shelf", c.hhJobs().o_shelf, true, TODAY)) > 0);
  const t = strip(h);
  ok("rows read as on a room page: “from <day>”, Send to…, ✓, and sent ones quietly “on Cal’s list”", t.indexOf("Fix the shelf · from " + wd(2)) >= 0 && t.indexOf("Boxes to the curb · on Cal’s list") >= 0 && t.indexOf("Fix the gate · on Dad’s list") >= 0);
  const taps = handlers(h);
  ok("…with the pile's own Send to…, ✓ and ⏸ Back to the pile", taps.includes("hhOnceSend('o_drawer','dad')") && taps.includes("rtdTick('o_shelf')") && taps.includes("hhOnceHold('o_sent')") && !taps.includes("rtdTick('o_sent')"), taps);
  ok("the header counts them: 11 waiting · 2 sent", /one-time jobs, every room · 11 waiting · 2 sent/.test(t), t.slice(0, 120));
  ok("a room heading opens that room", taps.includes("hhRmGo('kitchen')") && taps.includes("hhRmGo('__none')"));
  // the fold
  const liv = c.rtdIds("living");
  ok("a room with more than 4 shows its first 4 and “+3 more”", liv.length === 7 && liv.slice(0, 4).every(id => h.indexOf(">Living job " + id.slice(5) + "<") > 0) && liv.slice(4).every(id => h.indexOf(">Living job " + id.slice(5) + "<") < 0) && /\+3 more/.test(t) && taps.includes("htdFold('living')"));
  ok("…the kitchen's 3 are all there, no fold line for it", !taps.includes("htdFold('kitchen')"));
  ok("…after the living room the other rooms still show (it does not bury them)", h.indexOf("New shower curtain") > h.indexOf("+3 more") && h.indexOf("Fix the shelf") > h.indexOf("+3 more"));
  c.get("htdFold('living')"); const h2 = c.htdHTML();
  ok("“+3 more” opens the room: all 7, and “Show fewer”", liv.every(id => h2.indexOf(">Living job " + id.slice(5) + "<") > 0) && /Show fewer/.test(h2));
  c.get("htdFold('living')"); ok("…tap again: folded", J(c.htdHTML()) === J(h));
  ok("on the page: 🔴 Now, then 📝 To do, then the 📅 Schedule card and the “most behind first” list", page.indexOf("🔴 Now") < page.indexOf("📝 To do") && page.indexOf("📝 To do") < page.indexOf("📅 Schedule") && page.indexOf("📅 Schedule") < page.indexOf("most behind first"));
  ok("drawing wrote nothing", c.writes.length === 0, c.writes);
  const e = mkT({ jobs: { k_counter: JOBS().k_counter } });
  ok("no to-dos anywhere: one plain line", /Nothing waiting in any room\./.test(e.htdHTML()));
}

console.log("\n── ＋ To-do on Whole house: pick a room, the room card's own save ──");
{ const a = mkT(); const ida = a.rtdSave("bathdown", "Clean out the toy bin", "🧸"), wa = a.writes.slice();
  const b = mkT(); b.get('hhAdd.label="half typed"; hhAdd.who="ben"'); const draft = J(b.get("hhAdd"));
  b.htdToggleForm(); const f = b.htdHTML();
  ok("＋ To-do opens: emoji + text + a room drop-down (her rooms) + Save", /id="htd-emoji"/.test(f) && /id="htd-label"/.test(f) && /<select id="htd-room"/.test(f) && b.hhRoomList().every(r => f.indexOf('<option value="' + r[0] + '">') > 0) && handlers(f).includes("htdSave()"));
  ok("…“Which room?” first; no “No room” choice", /<option value="">Which room\?<\/option>/.test(f) && (f.match(/<option /g) || []).length === b.hhRoomList().length + 1);
  b.els["htd-label"] = { value: "Clean out the toy bin" }; b.els["htd-emoji"] = { value: "🧸" }; b.els["htd-room"] = { value: "bathdown" };
  const idb = run(b, "htdSave()"), wb = b.writes.slice();
  ok("Save = exactly the room card's write for that room (one set of household/jobs/<id>, the same id)", ida && ida === idb && J(wa) === J(wb) && wb.length === 1 && wb[0][0] === "set" && wb[0][1] === "household/jobs/" + idb, { wa, wb });
  ok("…filed under that room, waiting; the form closed; the Add form's draft untouched", wb[0][2].room === "bathdown" && wb[0][2].hold === true && b.htdGroups().find(g => g.rid === "bathdown").ids.includes(idb) && !/id="htd-label"/.test(b.htdHTML()) && J(b.get("hhAdd")) === draft);
  const n = mkT(); n.els["htd-label"] = { value: "Wash the dog bed" }; n.els["htd-room"] = { value: "" };
  ok("no room picked → nothing saved, she is told", n.htdSave() === null && n.writes.length === 0 && /Pick a room first/.test(n.toasts.join()));
  const w = mkT(); w.els["htd-label"] = { value: "  " }; w.els["htd-room"] = { value: "kitchen" };
  ok("no words → nothing saved, she is told", w.htdSave() === null && w.writes.length === 0 && /Write the to-do first/.test(w.toasts.join()));
  const g = mkT(); ok("a room that is not on the list → nothing saved", g.htdSave("attic_gone", "Wash the dog bed", "") === null && g.writes.length === 0);
  const m = mkT({ noMom: true }); ok("not Mom → nothing saved", m.htdSave("kitchen", "Wash the dog bed", "") === null && m.writes.length === 0);
  const d = mkT({ dry: true }); ok("dry run → nothing written", !!d.htdSave("kitchen", "Wash the dog bed", "") && d.writes.length === 0);
}

console.log("\n── ✓ / Send to… / ⏸ from Whole house = the room card's writes ──");
{ const a = mkT(), b = mkT(), before = jobs(a), canon0 = J(canon(a.hhJobs().o_shelf));
  run(a, handlers(a.htdHTML()).find(t => t === "rtdTick('o_shelf')")); b.rtdTick("o_shelf");
  ok("✓ on Whole house = rtdTick's one update, byte for byte", a.writes.length === 1 && J(a.writes) === J(b.writes) && a.writes[0][0] === "update" && Object.keys(a.writes[0][2]).sort().join() === ["household/jobs/o_shelf/done", "household/jobs/o_shelf/doneSelf", "household/jobs/o_shelf/status"].join(), a.writes);
  const h = a.htdHTML();
  ok("…the row stays, ticked, “done today”, with the un-✓", /Fix the shelf<span style="font-weight:400;color:#6b6560"> · done today/.test(h) && handlers(h).includes("rtdTick('o_shelf')") && /title="Not done after all"/.test(h));
  a.writes.length = 0; b.writes.length = 0; run(a, "rtdTick('o_shelf')"); b.rtdTick("o_shelf");
  ok("un-✓ = rtdTick's restore, byte for byte, and the record is back exactly", J(a.writes) === J(b.writes) && jobs(a) === before && J(canon(a.hhJobs().o_shelf)) === canon0, [a.writes, a.hhJobs().o_shelf]);
  for (const [tap, fn] of [["hhOnceSend('o_drawer','ben')", c => c.hhOnceSend("o_drawer", "ben")], ["hhOnceSend('o_shelf','ben')", c => c.hhOnceSend("o_shelf", "ben")], ["hhOnceHold('o_sent')", c => c.hhOnceHold("o_sent")]]) {
    const x = mkT(), y = mkT(); ok(tap + " from the card is in its taps", handlers(x.htdHTML()).includes(tap));
    run(x, tap); fn(y); ok("…and writes exactly what the function itself writes", x.writes.length >= 1 && J(x.writes) === J(y.writes) && jobs(x) === jobs(y), [x.writes, y.writes]);
  }
  const s = mkT(); s.hhOnceSend("o_drawer", "ben");
  ok("a sent one moves to quiet “on Ben’s list” in its room, ✓ gone", strip(s.htdHTML()).indexOf("Sort the junk drawer · on Ben’s list") >= 0 && !handlers(s.htdHTML()).includes("rtdTick('o_drawer')"));
}

console.log("\n── 📝 To do on 👤 By person ──");
{ const c = mkT();
  const P = who => JSON.parse(c.get("JSON.stringify(htdPersonIds(" + J(who) + "))"));
  ok("Ben: on his list nothing yet; waiting he can do = Fix the shelf (his) and the junk drawer (ticked), oldest first", J(P("ben")) === J({ sent: [], can: ["o_drawer", "o_shelf"] }), P("ben"));
  ok("Cal: on his list Boxes to the curb; waiting he can do = Box up the old toys", J(P("cal")) === J({ sent: ["o_sent"], can: ["o_lost"] }), P("cal"));
  ok("Ada: the shelf, the drawer and the 7 living-room jobs (ticked on each), not the bathroom's", J(P("ada")) === J({ sent: [], can: ["o_liv1", "o_drawer", "o_liv2", "o_liv3", "o_liv4", "o_liv5", "o_liv6", "o_liv7", "o_shelf"].sort((a, b) => { const J0 = c.hhJobs(); return String(J0[a].from).localeCompare(String(J0[b].from)) || (J0[a].ts || 0) - (J0[b].ts || 0); }) }), P("ada"));
  const all = Object.keys(c.hhJobs());
  ok("can do = hhCanOf, for every person (Mom and Dad too): the owner and everyone ticked", ["ada", "ben", "cal", "mom", "dad"].every(w => J(P(w).can.slice().sort()) === J(all.filter(id => { const j = c.hhJobs()[id]; return c.hhOnceHeld(j) && j.status !== "retired" && c.hhCanOf(j).includes(w); }).sort())));
  ok("Mom: every waiting job she owns or is ticked on; Dad: the drawer and the curtain, and the gate on his list", P("mom").can.length === 10 && J(P("dad")) === J({ sent: ["o_dad"], can: ["o_drawer", "o_bath"] }), [P("mom"), P("dad")]);
  const h = c.htdPersonHTML("cal"), t = strip(h), taps = handlers(h);
  ok("the card: “one-time jobs for Cal”, on his list first (⏸ Back to the pile), then waiting with “Give to Cal”", /📝 To do one-time jobs for Cal/.test(t) && t.indexOf("On Cal’s list now (1)") < t.indexOf("Waiting — Cal can do (1)") && taps.includes("hhOnceHold('o_sent')") && taps.includes("hhOnceSend('o_lost','cal')") && /Give to Cal/.test(t), t);
  ok("…each row says its room (and “from <day>” on waiting ones); no ✓ here", t.indexOf("Boxes to the curb · 🍳 Kitchen + dining") >= 0 && t.indexOf("Box up the old toys · ❔ No room · from " + wd(3)) >= 0 && !taps.some(x => /rtdTick/.test(x)), t);
  ok("…only this person's rows", !/Fix the shelf|junk drawer|shower curtain|Living job/.test(h));
  const ha = c.htdPersonHTML("ada"), tp = handlers(ha);
  ok("Ada's 9 waiting fold to 6 with “+3 more”", (ha.match(/Give to Ada/g) || []).length === 6 && /\+3 more/.test(strip(ha)) && tp.includes("htdFold('p|ada')"));
  c.get("htdFold('p|ada')"); ok("…tap: all 9", (c.htdPersonHTML("ada").match(/Give to Ada/g) || []).length === 9);
  const pg = person(c, "cal");
  ok("on the page: right under 📅 Today, above 📆 This week / 📅 Schedule / ⚙ Settings", pg.indexOf("📅 Today") < pg.indexOf("one-time jobs for Cal") && pg.indexOf("one-time jobs for Cal") < pg.indexOf("📅 Schedule") && pg.indexOf("one-time jobs for Cal") < pg.indexOf("⚙ Settings"));
  for (const [who, id] of [["cal", "o_lost"], ["ben", "o_drawer"], ["dad", "o_bath"], ["mom", "o_liv3"], ["ada", "o_shelf"]]) {
    const x = mkT(), y = mkT(); x.get("htdFold('p|" + who + "')"); run(x, handlers(x.htdPersonHTML(who)).find(t => t === "hhOnceSend('" + id + "','" + who + "')") || "null"); y.hhOnceSend(id, who);
    ok("Give to " + who + " (" + id + ") = hhOnceSend(id, '" + who + "') byte for byte", x.writes.length >= 1 && J(x.writes) === J(y.writes) && jobs(x) === jobs(y) && x.hhJobs()[id].who === who && !x.hhJobs()[id].hold, [x.writes, y.writes]);
  }
  const x = mkT(), y = mkT(); run(x, handlers(x.htdPersonHTML("cal")).find(t => t === "hhOnceHold('o_sent')") || "null"); y.hhOnceHold("o_sent");
  ok("⏸ Back to the pile on By person = hhOnceHold, byte for byte; it is waiting again, “Give to Cal”", x.writes.length === 1 && J(x.writes) === J(y.writes) && handlers(x.htdPersonHTML("cal")).includes("hhOnceSend('o_sent','cal')"), [x.writes, y.writes]);
  const e = mkT({ jobs: { k_counter: JOBS().k_counter } });
  ok("nothing for them: one plain line", /Nothing on Ben’s list, and nothing waiting that Ben can do\./.test(e.htdPersonHTML("ben")));
  ok("drawing wrote nothing", c.writes.length === 0 && e.writes.length === 0);
}

console.log("\n── 🔴 Now on Whole house = each room's 🔴 Now, in one line a room ──");
for (const [name, o] of MODES) {
  const c = mkT(o), D = JSON.parse(c.get("JSON.stringify(htNowData())")), h = c.htNowHTML(), t = strip(h);
  const want = c.hhRoomList().map(r => r[0]).map(rid => { const R = c.rnRows(rid), op = R.rows.filter(x => !x.done); return { rid, left: op.length, late: op.filter(x => x.late).length, done: R.rows.length - op.length, over: R.over.length }; });
  const nr = ["__none", ""].map(r => c.rnRows(r)), nop = nr[0].rows.concat(nr[1].rows).filter(x => !x.done);
  want.push({ rid: "__none", left: nop.length, late: nop.filter(x => x.late).length, done: nr[0].rows.length + nr[1].rows.length - nop.length, over: nr[0].over.length + nr[1].over.length });
  ok(name + ": every room's numbers = its rnRows (left, late, done, didn't fit)", J(D.rooms.map(x => ({ rid: x.rid, left: x.left, late: x.late, done: x.done, over: x.over }))) === J(want), [D.rooms, want]);
  ok(name + ": the kitchen line reads “" + D.rooms.find(x => x.rid === "kitchen").left + " left” and opens the kitchen", h.indexOf("hhRmGo('kitchen')") > 0 && t.indexOf("🍳 Kitchen + dining " + D.rooms.find(x => x.rid === "kitchen").left + " left") >= 0, t);
  const open = D.rooms.filter(x => x.left || x.over), lines = handlers(h).filter(x => /^hhRmGo/.test(x)).map(x => x.slice(8, -2));
  ok(name + ": one line per room with something open, most late first", J(lines) === J(open.slice().sort((a, b) => (b.late - a.late) || (b.left - a.left) || (a.i - b.i)).map(x => x.rid)) && lines.length === open.length, [lines, open]);
  ok(name + ": the clear rooms in one quiet line", D.rooms.filter(x => !x.left && !x.over && x.done).every(x => t.indexOf("Clear today:") >= 0 && t.indexOf((c.hhRoomEmoji(x.rid) + " " + c.hhRoomName(x.rid)) + " (" + x.done + " done)") >= 0));
  ok(name + ": it says where today comes from", D.plan === (name === "ON, today stored") && (D.plan ? /today’s plan/.test(t) : /today, from the lists/.test(t)));
  ok(name + ": drawing wrote nothing", c.writes.length === 0);
}
{ const c = mkT({ meta: ONM, houseDay: DAY() }), h = c.htNowHTML(), t = strip(h);
  ok("ON stored: what fit nobody — the kitchen's mop and the no-room shelf — with whose turn, and → Give to…", /Didn’t fit anyone today \(2\)/.test(t) && /Mop the floor/.test(t) && /Dust the old shelf/.test(t) && /Ben’s turn/.test(t) && (h.match(/→ Give to…/g) || []).length === 2, t);
  ok("…the No room line counts its own (the plan's no-room chore)", c.htNowData().rooms.find(x => x.rid === "__none").over === 1 && t.indexOf("❔ No room 1 didn’t fit") >= 0, t);
  const give = handlers(h).find(x => /hdGive\(.*'k_mop'/.test(x)); const x = mkT({ meta: ONM, houseDay: DAY() }), y = mkT({ meta: ONM, houseDay: DAY() });
  run(x, give); y.hdGive(TODAY, "k_mop", "ada"); y.hhRender();
  ok("→ Give to… = the room card's control (hdGive), the same write", give && J(x.writes) === J(y.writes) && x.writes.length === 1 && Object.keys(x.writes[0][2]).includes("houseDay/" + TODAY + "/plan/k_mop"), [give, x.writes]);
  ok("…the same control the kitchen's own Now card draws", c.rnNowHTML("kitchen").indexOf(c.hpGiveSel(TODAY, "k_mop", "")) > 0 && h.indexOf(c.hpGiveSel(TODAY, "k_mop", "")) > 0);
}
{ const day = DAY(); day[TODAY].done.l_dust = { who: "ben", ts: "9:10 AM" }; day[TODAY].done.k_sink = { who: "ada", ts: "9:20 AM" }; const c = mkT({ meta: ONM, houseDay: day }), t = strip(c.htNowHTML());
  const k = c.rnRows("kitchen").rows.find(x => x.id === "k_sink");
  ok("a late chore done today counts as done, not late (the kitchen: 1 late = the open one)", k && k.done && k.late === 2 && c.htNowData().rooms.find(x => x.rid === "kitchen").late === c.rnRows("kitchen").rows.filter(x => !x.done && x.late).length && c.htNowData().rooms.find(x => x.rid === "kitchen").late === 0, c.rnRows("kitchen").rows);
  ok("a room with everything done today: no line of its own, named in the quiet line “✅ Clear today: 🛋 Living room (1 done)”", c.rnRows("living").rows.length === 1 && c.rnRows("living").rows[0].done && t.indexOf("✅ Clear today: 🛋 Living room (1 done)") >= 0 && c.htNowHTML().indexOf("hhRmGo('living')") < 0, t);
}
{ const c = mkT();
  ok("off: no “didn't fit” part", !/Didn’t fit/.test(c.htNowHTML()));
  const e = mkT({ jobs: { o_shelf: JOBS().o_shelf } });
  ok("nothing on any list: a plain line, no room lines", /Nothing on anyone’s list in a room today\./.test(e.htNowHTML()) && !handlers(e.htNowHTML()).some(x => /hhRmGo/.test(x)));
}

console.log("\n── taps on Now write nothing; not Mom; dry run ──");
for (const [name, o] of MODES) {
  const c = mkT(o), s0 = jobs(c) + J(c.get("houseDayData")), taps = handlers(c.htNowHTML()).filter(x => !/hdGive/.test(x));
  taps.forEach(x => { house(c); run(c, x); });
  ok(name + ": every tap on Now but Give to… (room lines, chore rows) wrote nothing and changed nothing", taps.length > 0 && c.writes.length === 0 && jobs(c) + J(c.get("houseDayData")) === s0 && taps.every(x => /^(hhRmGo|hcOpen|event\.stopPropagation\(\))/.test(x)), [taps, c.writes]);
}
{ const k = mkT({ noMom: true, meta: ONM, houseDay: DAY() }), hn = k.htNowHTML(), ht = k.htdHTML(), hp = k.htdPersonHTML("cal");
  ok("not Mom: the same rows", /Fix the shelf/.test(ht) && /Box up the old toys/.test(hp) && /Mop the floor/.test(hn));
  ok("…and no button: only the room lines, room headings and the fold", handlers(hn + ht + hp).every(x => /^(hhRmGo|htdFold)\(/.test(x)) && !/<button|<select/.test(hn + ht + hp), handlers(hn + ht + hp).filter(x => !/^(hhRmGo|htdFold)/.test(x)));
  ok("…no ＋ To-do, and the form cannot be opened", !/＋ To-do/.test(ht) && (k.htdToggleForm(), !/htd-label/.test(k.htdHTML())));
  const d = mkT({ dry: true, meta: ONM, houseDay: DAY() }), all = handlers(d.htNowHTML() + d.htdHTML() + d.htdPersonHTML("ada") + d.htdPersonHTML("cal"));
  all.forEach(x => { try { run(d, x); } catch (e) {} }); d.htdSave("kitchen", "Wash the dog bed", "");
  ok("?dryrun=1: every button on the three cards and ＋ To-do write nothing", all.length > 10 && d.writes.length === 0, d.writes);
}

console.log("\n── nothing else changes: Whole house, By person, a room, the pile, the laundry schedule ──");
for (const [name, o] of MODES) {
  const c = withLaundry(mkT(o)), bh = without(c, () => house(c)), ah = house(c), now = c.htNowHTML(), td = c.htdHTML();
  ok(name + ": Whole house = before, with 🔴 Now + 📝 To do just above the 📅 Schedule card", ah === bh.replace(c.hwCardHTML() + c.hhRmHouseHTML(c.hhRoomChores()), () => now + td + c.hwCardHTML() + c.hhRmHouseHTML(c.hhRoomChores())) && ah.length === bh.length + now.length + td.length);
  const bp = without(c, () => person(c, "ben")), ap = person(c, "ben"), pc = c.htdPersonHTML("ben"), at = ap.indexOf(pc);
  ok(name + ": By person = before (Today · This week · Schedule · Settings · Habits), with 📝 To do under 📅 Today", at > 0 && ap.slice(0, at) + ap.slice(at + pc.length) === bp && ap.slice(0, at).indexOf("📅 Today") > 0 && ap.slice(at + pc.length).indexOf("📈 Habits") > 0);
  for (const rid of ["kitchen", "living", "__none"]) ok(name + ": the " + rid + " page is byte-for-byte as before", without(c, () => roomPage(c, rid)) === roomPage(c, rid));
  c.get('hhView="laundry"'); const lw = c.hwLaundryCardHTML();
  ok(name + ": the ☑️ pile under ⋯ More and the Laundry page's schedule card are as before", without(c, () => c.hhOnceHTML()) === c.hhOnceHTML() && /☑️ The pile/.test(c.hhOnceHTML()) && without(c, () => c.hwLaundryCardHTML()) === lw && /This week/.test(lw) && !/📝 To do|🔴 Now/.test(lw), lw.slice(0, 200));
  ok(name + ": drawing every page wrote nothing", c.writes.length === 0, c.writes);
}

console.log("\n── draw time ──");
{ const c = mkT({ meta: PREVIEW }); let t0 = Date.now(); c.htNowHTML(); c.htdHTML(); const cold = Date.now() - t0;
  t0 = Date.now(); for (let i = 0; i < 20; i++) { c.htNowHTML(); c.htdHTML(); c.htdPersonHTML("ada"); } const warm = (Date.now() - t0) / 20;
  console.log("  (Now + To do on Whole house, preview: first draw " + cold + " ms; then " + warm.toFixed(1) + " ms for Now + To do + one person)");
  ok("the cards draw in well under a second on the made-up family", cold < 1000 && warm < 250, [cold, warm]);
}

console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
