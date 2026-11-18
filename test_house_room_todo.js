/*
 * test_house_room_todo.js — 📝 To do at the top of a room page (ROOMTODO in house.js; DESIGN_now_todo_schedule_2026-11-17 §2, slice A,
 * her "Yes, build A" 2026-11-17). Made-up family (Ada, Ben, Cal, Mom, Dad).
 *   · the rows are this room's one-time jobs (hhIsOnce), not retired: waiting ones with "from Tue" (the laundry to-do's wording) and
 *     the pile's own Send to…; sent ones quietly, "on Cal's list", with ⏸ Back to the pile; nothing from another room, no repeating chore;
 *   · ＋ To-do writes exactly what ＋ Add chore ▸ One time writes for the same input (the one save, hhAddSave), and leaves the Add
 *     form's own draft as it was;
 *   · ✓ "I did it myself": one update of household/jobs/<id>/{status,done,doneSelf}; retired with today's date like a finished
 *     one-time job; no stars, no Click-off line; stays ticked until the day ends; a second tap puts the record back byte for byte;
 *     not Mom → nothing; ?dryrun=1 → nothing written; it touches no day plan, and the sweeps (hhOnceSweep, hhSyncKids) leave it be;
 *   · the full ☑️ pile under ⋯ More is unchanged.
 *   run: node test_house_room_todo.js
 */
"use strict";
const path = require("path"), V = require(path.join(__dirname, "test_fixtures", "house_vm.js"));
const { K, TODAY, ago, DOW, mk, roomPage, handlers } = V;
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 600) + ")" : "")); } };
const strip = s => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(), J = x => JSON.stringify(x);
const canon = v => Array.isArray(v) ? v.map(canon) : (v && typeof v === "object") ? Object.keys(v).sort().reduce((a, k) => (a[k] = canon(v[k]), a), {}) : v;
const WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], wd = n => WD[(DOW - n % 7 + 7) % 7];
const JOBS = () => ({
  k_counter: K({ label: "Wipe the counters", who: "ada", slot: "chores", cad: "daily", room: "kitchen", minutes: 10 }),
  o_shelf: K({ label: "Fix the shelf", emoji: "🔨", who: "ben", slot: "chores", cad: "once", hold: true, room: "kitchen", from: ago(2), minutes: 10, pts: 5, level: 1, order: 9, ts: 2 }),
  o_drawer: K({ label: "Sort the junk drawer", who: "mom", slot: "", cad: "once", hold: true, room: "kitchen", from: ago(9), can: ["mom", "ada", "ben"], src: { kind: "momChore", id: "o_drawer" }, ts: 1 }),
  o_today: K({ label: "Wipe the high shelf", who: "ada", slot: "chores", cad: "once", hold: true, room: "kitchen", from: TODAY, ts: 3 }),
  o_sent: K({ label: "Boxes to the curb", who: "cal", slot: "chores", cad: "once", room: "kitchen", from: ago(1), ts: 4 }),
  o_done: K({ label: "Hang the hooks", who: "ben", slot: "chores", cad: "once", room: "kitchen", status: "retired", done: ago(3), ts: 5 }),
  o_bath: K({ label: "New shower curtain", who: "mom", slot: "", cad: "once", hold: true, room: "bathdown", from: ago(1), src: { kind: "momChore", id: "o_bath" } }),
  p_cab: K({ label: "The art cabinet", who: "mom", slot: "", cad: "asneeded", layer: "project", room: "kitchen", src: { kind: "momChore", id: "cab" } })
});

console.log("\n── the rows: this room's part of the one-time pile ──");
{ const c = mk({ jobs: JOBS() }), ids = c.rtdIds("kitchen"), h = c.rtdHTML("kitchen"), t = strip(h), page = roomPage(c, "kitchen");
  ok("this room's one-time jobs, waiting ones first (oldest first), then sent ones", J(ids) === J(["o_drawer", "o_shelf", "o_today", "o_sent"]), ids);
  ok("not the retired one, not the bathroom's, not a project or a repeating chore", !ids.some(x => ["o_done", "o_bath", "p_cab", "k_counter"].includes(x)));
  ok("“from <day>” for a day that has passed; the date too once it is more than 6 days old", t.indexOf("Fix the shelf · from " + wd(2)) >= 0 && t.indexOf("Sort the junk drawer · from " + wd(9) + " " + (+ago(9).slice(5, 7)) + "/" + (+ago(9).slice(8))) >= 0, t);
  ok("…nothing for one added today (the laundry to-do's rule)", /Wipe the high shelf <\/span>|Wipe the high shelf<span style="font-weight:400;color:#6b6560"><\/span>/.test(h) && !/Wipe the high shelf · from/.test(t));
  ok("…the same wording as the laundry to-do (amber “ · from Tue”)", h.indexOf(' · <span style="color:#b45309">from ' + wd(2) + '</span>') > 0);
  const taps = handlers(h);
  ok("a waiting row has the pile's own Send to… (who can do it)", taps.includes("hhOnceSend('o_drawer','mom')") && taps.includes("hhOnceSend('o_drawer','ada')") && taps.includes("hhOnceSend('o_drawer','ben')") && taps.includes("hhOnceSend('o_shelf','ben')"), taps);
  ok("…and the ✓ (I did it myself)", taps.includes("rtdTick('o_shelf')") && taps.includes("rtdTick('o_drawer')") && /title="I did it myself"/.test(h));
  ok("a sent one is quiet: “on Cal’s list” with ⏸ Back to the pile, no ✓", t.indexOf("Boxes to the curb · on Cal’s list") >= 0 && taps.includes("hhOnceHold('o_sent')") && !taps.includes("rtdTick('o_sent')"));
  ok("＋ To-do in the card's corner (Mom)", taps.includes("rtdToggleForm('kitchen')") && /＋ To-do/.test(h));
  ok("the card is on the room page, after 🔴 Now and above the grid", page.indexOf(h) > page.indexOf("🔴 Now") && page.indexOf(h) < page.indexOf("<table"));
  const k = mk({ jobs: JOBS(), noMom: true }), kh = k.rtdHTML("kitchen");
  ok("not Mom: the rows without a single button", /Fix the shelf/.test(kh) && handlers(kh).length === 0, handlers(kh));
  const e = mk({ jobs: { k_counter: JOBS().k_counter } });
  ok("an empty room says so in plain words", /Nothing waiting here\./.test(e.rtdHTML("kitchen")));
  roomPage(c, "kitchen"); roomPage(c, "bathdown"); ok("drawing wrote nothing", c.writes.length === 0, c.writes);
  ok("the full ☑️ pile under ⋯ More is drawn as before (it is not this code)", c.hhOnceHTML() === mk({ jobs: JOBS() }).hhOnceHTML() && /☑️ The pile/.test(c.hhOnceHTML()));
}

console.log("\n── ＋ To-do: the one save ＋ Add chore ▸ One time uses ──");
{ // the existing form, driven by its own controls: the card's Add draft for the kitchen, Mom, One time, everyone else can do it
  const a = mk({ jobs: JOBS() });
  a.hcAdd("kitchen"); a.hhAddSet("who", "mom"); a.hhAddSet("kind", "once"); ["ada", "ben", "cal", "dad"].forEach(w => a.hhAddCan(w));
  a.els["hh-add-label"] = { value: "Clean out the toy bin" }; a.els["hh-add-emoji"] = { value: "🧸" };
  const ida = a.hcAddSave(); const wa = a.writes.slice();
  // ＋ To-do with the same words
  const b = mk({ jobs: JOBS() }); b.get('hhAdd.label="half typed"; hhAdd.who="ben"; hhAdd.slot="evening"; hhAdd.pts="7"');
  const draft = J(b.get("hhAdd")), open0 = b.get("hhAddOpen");
  b.rtdToggleForm("kitchen"); ok("＋ To-do opens a small form: emoji + text + Save", /id="rtd-emoji"/.test(b.rtdHTML("kitchen")) && /id="rtd-label"/.test(b.rtdHTML("kitchen")) && handlers(b.rtdHTML("kitchen")).includes("rtdSave('kitchen')"));
  b.els["rtd-label"] = { value: "Clean out the toy bin" }; b.els["rtd-emoji"] = { value: "🧸" };
  const idb = b.rtdSave("kitchen"), wb = b.writes.slice();
  ok("the same id and exactly the same write as the Add form (one set of household/jobs/<id>)", ida && ida === idb && J(wa) === J(wb) && wb.length === 1 && wb[0][0] === "set" && wb[0][1] === "household/jobs/" + idb, { wa, wb });
  const rec = wb[0][2];
  ok("the record: one-time, waiting in the pile, this room, from today, Mom's, anyone can do it", rec.cad === "once" && rec.hold === true && rec.room === "kitchen" && rec.from === TODAY && rec.who === "mom" && J(rec.can) === J(["mom", "ada", "ben", "cal", "dad"]) && rec.label === "Clean out the toy bin" && rec.emoji === "🧸", rec);
  ok("…its defaults: 0 stars, no minutes stored (the area's default), Any time, Mom's level, the guessed area", rec.pts === 0 && rec.minutes === undefined && rec.slot === "" && rec.level === b.hhLevelCurFor("mom") && rec.area === b.hhGuessArea("Clean out the toy bin", "", "") && rec.status === "active" && rec.src.kind === "momChore", rec);
  ok("the Add form's draft is back exactly as it was", J(b.get("hhAdd")) === draft && b.get("hhAddOpen") === open0, [J(b.get("hhAdd")), draft]);
  ok("it shows on the room's To do at once, and the form closed", b.rtdIds("kitchen").includes(idb) && !/id="rtd-label"/.test(b.rtdHTML("kitchen")));
  const n = mk({ jobs: JOBS() }); n.els["rtd-label"] = { value: "   " }; ok("no words → nothing saved", n.rtdSave("kitchen") === null && n.writes.length === 0);
  const o = mk({ jobs: JOBS() }); o.els["hh-add-label"] = { value: "a chore in the open card" };
  ok("the chore card open (its fields would be read first) → nothing saved, she is told", o.rtdSave("kitchen", "Wash the dog bed", "") === null && o.writes.length === 0 && /Close the chore card first/.test(o.toasts.join()));
  const m = mk({ jobs: JOBS(), noMom: true }); ok("not Mom → nothing saved", m.rtdSave("kitchen", "Wash the dog bed", "") === null && m.writes.length === 0);
  const d = mk({ jobs: JOBS(), dry: true }); ok("dry run → nothing written", !!d.rtdSave("kitchen", "Wash the dog bed", "") && d.writes.length === 0);
  const r = mk({ jobs: JOBS() }); ok("a room that is not on the list → nothing saved", r.rtdSave("attic_gone", "Wash the dog bed", "") === null && r.writes.length === 0);
}

console.log("\n── ✓ I did it myself, and back ──");
{ const c = mk({ jobs: JOBS() }), before = J(c.hhJobs().o_shelf), canonBefore = J(canon(c.hhJobs().o_shelf));
  const upd = c.rtdTick("o_shelf");
  ok("one update, only household/jobs/o_shelf/{status,done,doneSelf}", c.writes.length === 1 && c.writes[0][0] === "update" && c.writes[0][1] === "" && J(Object.keys(c.writes[0][2]).sort()) === J(["household/jobs/o_shelf/done", "household/jobs/o_shelf/doneSelf", "household/jobs/o_shelf/status"]), c.writes);
  ok("retired with today's date — how a finished one-time job ends (hhOnceSweep: status + done)", upd["household/jobs/o_shelf/status"] === "retired" && upd["household/jobs/o_shelf/done"] === TODAY && J(upd["household/jobs/o_shelf/doneSelf"]) === J({ on: TODAY, was: { status: "active" } }), upd);
  ok("no stars to anyone, no Click-off line", c.bank.length === 0 && c.rlog.length === 0, [c.bank, c.rlog]);
  const h = c.rtdHTML("kitchen");
  ok("it stays on the room's To do, ticked and crossed out, “done today”, no Send to…", c.rtdIds("kitchen").includes("o_shelf") && /title="Not done after all"/.test(h) && /text-decoration:line-through">Fix the shelf/.test(h) && /done today/.test(h) && !handlers(h).some(x => /hhOnceSend\('o_shelf'/.test(x)));
  ok("the ☑️ pile under ⋯ More lists it under ✓ Done, like any finished one", /✓ Done/.test(c.hhOnceHTML()) && c.hhOnceHTML().indexOf("Fix the shelf") > c.hhOnceHTML().indexOf("✓ Done"));
  c.writes.length = 0; const back = c.rtdTick("o_shelf");
  ok("a second tap: one update putting status back, done and doneSelf gone", c.writes.length === 1 && J(canon(back)) === J(canon({ "household/jobs/o_shelf/status": "active", "household/jobs/o_shelf/done": null, "household/jobs/o_shelf/doneSelf": null })), back);
  ok("…the record is byte-for-byte what it was before the tick", J(c.hhJobs().o_shelf) === before, [J(c.hhJobs().o_shelf), before]);
  // the same in the database: apply both updates to the stored record the way the server merges a multi-path update
  const store = JSON.parse(before), apply = u => Object.keys(u).forEach(k => { const f = k.split("/").pop(); if (u[k] === null) delete store[f]; else store[f] = JSON.parse(JSON.stringify(u[k])); });
  apply(upd); apply(back); ok("…and in the database (the two updates applied to the stored record)", J(canon(store)) === canonBefore);
  ok("…back in the pile with its Send to… again", handlers(c.rtdHTML("kitchen")).includes("hhOnceSend('o_shelf','ben')") && c.hhOnceHeld(c.hhJobs().o_shelf));
  // a record that had a done date before (an older finish, then put back in the pile by hand) gets it back too
  const e = mk({ jobs: Object.assign(JOBS(), { o_old: K({ label: "Old one", who: "mom", slot: "", cad: "once", hold: true, room: "kitchen", done: "2026-01-02", src: { kind: "momChore", id: "o_old" } }) }) }), eb = J(e.hhJobs().o_old);
  e.rtdTick("o_old"); e.rtdTick("o_old"); ok("…a record with an older done date gets that date back, byte for byte", J(e.hhJobs().o_old) === eb);
}

console.log("\n── who and when ──");
{ const n = mk({ jobs: JOBS(), noMom: true }); ok("not Mom → nothing changes, nothing written", n.rtdTick("o_shelf") === null && n.writes.length === 0 && n.hhJobs().o_shelf.status === "active");
  const d = mk({ jobs: JOBS(), dry: true }); d.rtdTick("o_shelf"); ok("dry run → nothing written", d.writes.length === 0 && d.bank.length === 0);
  const s = mk({ jobs: JOBS() }); ok("a sent one (on Cal's list) can't be ticked here", s.rtdTick("o_sent") === null && s.writes.length === 0);
  ok("an already finished one can't be ticked", s.rtdTick("o_done") === null && s.writes.length === 0);
  ok("a repeating chore can't be ticked", s.rtdTick("k_counter") === null && s.writes.length === 0);
  // ticked yesterday: the day has ended — gone from the room, and no longer un-tickable here
  const y = mk({ jobs: Object.assign(JOBS(), { o_y: K({ label: "Yesterday's", who: "mom", slot: "", cad: "once", hold: true, room: "kitchen", status: "retired", done: ago(1), doneSelf: { on: ago(1), was: { status: "active" } }, src: { kind: "momChore", id: "o_y" } }) }) });
  ok("ticked yesterday: gone from the room's To do (the day has ended), still under ✓ Done", !y.rtdIds("kitchen").includes("o_y") && /Yesterday's/.test(y.hhOnceHTML()));
  ok("…and a tap does nothing", y.rtdTick("o_y") === null && y.writes.length === 0);
}

console.log("\n── nothing else is disturbed ──");
{ const day = { [TODAY]: { built: { ok: 1, sig: "x" }, plan: { k_counter: { who: "ada", mins: 10, order: 0, late: 0, k: "daily" } }, over: {} } };
  const c = mk({ jobs: JOBS(), hd: { meta: { takeover: 1, engine: { mode: "on", on: ago(3) } } }, houseDay: day }), d0 = J(c.get("houseDayData"));
  c.rtdTick("o_shelf"); c.rtdTick("o_shelf"); c.rtdSave("kitchen", "Wash the dog bed", "");
  ok("plan ON: the tick, the untick and ＋ To-do write nothing under houseDay and leave today's plan as it was", J(c.get("houseDayData")) === d0 && c.writes.every(w => w[0] === "set" ? /^household\/jobs\/\w+$/.test(w[1]) : Object.keys(w[2]).every(k => /^household\/jobs\/\w+\/(status|done|doneSelf)$/.test(k))), c.writes);
  ok("…a one-time job is never the plan's (hdManaged), ticked or not", !c.hdManaged(c.hhJobs().o_shelf));
  const s = mk({ jobs: JOBS() }); s.rtdTick("o_shelf"); s.writes.length = 0;
  ok("hhOnceSweep after a tick: nothing to retire, nothing written", J(s.hhOnceSweep()) === "[]" && s.writes.length === 0);
  s.rtdTick("o_shelf"); s.writes.length = 0;
  ok("…and after the untick: it stays in the pile", J(s.hhOnceSweep()) === "[]" && s.writes.length === 0 && s.hhJobs().o_shelf.status === "active");
  const k = mk({ jobs: { o_shelf: JOBS().o_shelf } }); k.rtdTick("o_shelf"); k.writes.length = 0; k.hhSyncKids();
  const touched = w => (w[0] === "update" ? Object.keys(w[2]) : [w[1]]).some(p => p.indexOf("household/jobs/o_shelf") === 0);
  ok("hhSyncKids (a Chores & Stars save) leaves a ticked one alone", !k.writes.some(touched) && k.hhJobs().o_shelf.status === "retired", k.writes);
  k.rtdTick("o_shelf"); k.writes.length = 0; k.hhSyncKids();
  ok("…and the unticked one stays waiting in the pile (HH_SYNC_HELD)", !k.writes.some(touched) && k.hhJobs().o_shelf.status === "active" && k.hhJobs().o_shelf.hold === true, k.writes);
  ok("nothing is on anyone's list from it, before or after (held / retired)", ["ada", "ben", "cal"].every(w => !k.hhKidJobIds("chores", w).includes("o_shelf")));
}

console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
