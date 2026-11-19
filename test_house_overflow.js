/*
 * test_house_overflow.js — HOUSEOVER, Household by room step 6b (DESIGN_household_rooms_2026-11-15 §1 rule 5, §4.3 step 4, §4.4, §4.7,
 * §5; her "Yes, start 6b" 2026-11-18): with the plan ON, a house chore the day's plan could give to nobody goes to THAT DAY's Up for
 * Grabs at double stars, only for the kids who can do it; not grabbed → first in line tomorrow. The WHOLE app (test_fixtures/
 * house_overflow_world.js: every device runs index.html over one in-memory Firebase and one virtual clock) on the made-up family.
 *   1 the offer: stored with the day's plan, double stars, only the kids ticked, none for a chore no kid can do, 0 ⭐, the zone day
 *   2 who sees it and how it looks: each kid's own screen, Mom's view of a kid, the Today card's count, no pool at all
 *   3 ✓ I did it now: paid exactly double once, done everywhere the plan is read, last-done and counters, the Click-off Log line
 *   4 🔖 Grab for later, let go, Mark done, one at a time (both kinds of grab), a sibling after it is taken, Mom's assign / release
 *   5 ↩ undo (the kid's own, Mom's) — the exact reversal; Mom's check hold
 *   6 → Give to… before a kid takes it, after a kid holds it, after a kid did it, and when Mom's screen has not heard yet
 *   7 not grabbed → first in line tomorrow (on its days), every N stays due, never on a day twice, never paid and laid again
 *   8 a stars edit mid-day: Keep today / Re-lay today too, with one taken and one done
 *   9 the day roll and open devices (a screen drawn yesterday, a screen that has not heard a take-back)
 *  10 ?dryrun=1, 😷 Kid Off, switching the plan off and un-checking the old row, preview and off
 *  11 Mom's screens: 👤 By person, a room's 🔴 Now, 🏠 Whole house, 📅 Schedule, the room grid
 *  12 normal grabs never collide: the old pool by position, the switched pool (6a), the claim records
 *   HOUSE_INDEX=/path/to/other/index.html node test_house_overflow.js   (a mutation check)
 */
"use strict";
const fs = require("fs"), path = require("path"), F = require(path.join(__dirname, "test_fixtures", "house_overflow_world.js"));
const HJS = fs.readFileSync(path.join(__dirname, "house.js"), "utf8"), IDX = process.env.HOUSE_INDEX || undefined;
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 700) + ")" : "")); } };
const J = o => JSON.stringify(o), MON = "2026-11-16", TUE = "2026-11-17", WED = "2026-11-18";
const R = (d, expr) => JSON.parse(d.run("JSON.stringify((function(){ " + expr + " })())"));
const mk = async (kind, mode, o) => { o = o || {}; const w = await F.world(kind || "saved", mode || "on", Object.assign({ index: IDX }, o)); const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"); A.run(HJS); await w.flush(); return { w, A, B }; };
const at = (S, d, h, mi) => S.w.at(2026, 11, d, h, mi || 0);
const kidDo = async (S, d, fn, kid, iso, id) => { d.run(fn + "(" + J(kid) + "," + J(iso) + "," + J(id) + ")"); await S.w.flush(); };
const html = (d, kid, mom) => d.run("_grabsHTML(" + J(kid) + "," + (mom ? "true" : "false") + ")");
const clone = o => o == null ? o : JSON.parse(J(o));   // the sandbox hands back live objects
const day = (S, iso) => clone(S.w.get("houseDay/" + iso)) || {};
const job = (S, id) => clone(S.w.get("household/jobs/" + id)) || {};
const log = (S, kid, re) => { const L = S.w.get("routineLog/" + kid) || {}, out = []; Object.keys(L).forEach(wk => Object.keys(L[wk] || {}).forEach(dn => Object.keys(L[wk][dn] || {}).forEach(k => { const e = L[wk][dn][k]; if (!re || re.test(e.label || "")) out.push(Object.assign({ dn }, e)); }))); return out.sort((a, b) => (a.at || 0) - (b.at || 0)); };
const notes = (S, kid, re) => F.bank(S.w, kid).filter(x => re.test(x.note || ""));

(async () => {
// ── 1 ──
console.log("\n── 1 · the offer is stored with the day's plan ──");
{ const S = await mk(); await at(S, 16, 7);
  const r = day(S, MON), g = r.grabs || {};
  ok("Monday's plan stores an offer for each chore that fit nobody that a kid can do", J(Object.keys(g).sort()) === J(["c_a_vac", "c_b_tub", "c_c_beds", "c_d_shelf"]), Object.keys(g));
  ok("…every offer is a chore in today's \"fit nobody\" and on no one's list", Object.keys(g).every(id => r.over[id] && !(r.plan || {})[id]));
  ok("…double the chore's stars (tub 15 → 30, beds 5 → 10, vacuum 15 → 30)", g.c_b_tub.pts === 30 && g.c_c_beds.pts === 10 && g.c_a_vac.pts === 30, g);
  ok("…only the kids ticked on the card: tub = Kid B + Kid A, beds = Kid C, vacuum = Kid A", J(g.c_b_tub.can) === J(["kid_b", "kid_a"]) && J(g.c_c_beds.can) === J(["kid_c"]) && J(g.c_a_vac.can) === J(["kid_a"]));
  ok("a chore no kid can do (Mom's oven): still \"fit nobody\", no offer", !!r.over.m_oven && !g.m_oven);
  ok("a 0 ⭐ chore: offered at 0 (double of nothing)", g.c_d_shelf && g.c_d_shelf.pts === 0 && J(g.c_d_shelf.can) === J(["kid_d"]));
  ok("the offers are written in the builder's one update (no other write made them)", S.w.db.log.filter(l => l.op === "update" && (l.keys || []).some(k => /^houseDay\/2026-11-16\/grabs\//.test((l.path ? l.path + "/" : "") + k))).length === 1);
  await at(S, 18, 7); const gw = day(S, WED).grabs || {};
  ok("Wednesday (bathrooms are the zone, +5): the tub card says +35 — the double 30 and the zone bonus once", /\+35 ⭐<span class="gc-boost"[^>]*>×2 · zone \+5/.test(html(S.B, "kid_b")) && gw.c_b_tub.pts === 30, html(S.B, "kid_b").slice(0, 400));
}

// ── 2 ──
console.log("\n── 2 · who sees it, and how it looks ──");
{ const S = await mk(); await at(S, 16, 8);
  ok("Kid A sees the vacuum and the tub", J(F.x2(S.B, "kid_a")) === J(["c_a_vac", "c_b_tub"]), F.x2(S.B, "kid_a"));
  ok("Kid B sees the tub only; Kid C the beds only; Kid D the shelf only", J(F.x2(S.B, "kid_b")) === J(["c_b_tub"]) && J(F.x2(S.B, "kid_c")) === J(["c_c_beds"]) && J(F.x2(S.B, "kid_d")) === J(["c_d_shelf"]));
  const h = html(S.B, "kid_b");
  ok("the card is marked ×2 and says \"Double stars · today only\"", /gc-boost[^>]*>×2</.test(h) && /Double stars · today only/.test(h) && /Scrub the tub/.test(h));
  ok("…with the same two taps as any grab: ✓ I did it now (+30) and 🔖 Grab for later", /hdGrabDone\('kid_b','2026-11-16','c_b_tub'\)">✓ I did it now \(\+30\)/.test(h) && /hdGrabHold\('kid_b','2026-11-16','c_b_tub'\)">🔖 Grab for later/.test(h));
  ok("…and the normal grabs are still there, after it", h.indexOf("Scrub the tub") < h.indexOf("Wash the porch window") && /gbInstant\('kid_b',0\)/.test(h));
  ok("Kid D (0 ⭐): the card says +0 ⭐ ×2", /\+0 ⭐<span class="gc-boost"[^>]*>×2/.test(html(S.B, "kid_d")));
  ok("no kid sees the oven", ["kid_a", "kid_b", "kid_c", "kid_d"].every(k => !/Clean the oven/.test(html(S.B, k))));
  const m = html(S.A, "kid_a", true);
  ok("Mom's view of Kid A: assign offers only the kids who can (tub: B and A)", /hdGrabHold\('kid_b','2026-11-16','c_b_tub'\)/.test(m) && /hdGrabHold\('kid_a','2026-11-16','c_b_tub'\)/.test(m) && !/hdGrabHold\('kid_c','2026-11-16','c_b_tub'\)/.test(m));
  ok("the Today card's count adds the open ×2 grabs", S.B.run("hdGrabOpenN('kid_a',false)") === 2);
  const N = await mk("none"); await at(N, 16, 8);
  const hn = html(N.B, "kid_b");
  ok("a family with no Up for Grabs pool at all: the ×2 card shows (and not \"No jobs yet\")", /Scrub the tub/.test(hn) && !/No jobs yet/.test(hn));
  ok("…and with no ×2 that day it is exactly as before", html(N.B, "kid_c").indexOf("Straighten the beds") > 0 && /No jobs yet/.test(html(N.B, "kid_c").replace(/<div class="grab-grid">[\s\S]*$/, "")) === false);
}

// ── 3 ──
console.log("\n── 3 · ✓ I did it now: double, once, done everywhere ──");
{ const S = await mk(); await at(S, 16, 9);
  const j0 = job(S, "c_b_tub"), b0 = F.bal(S.w, "kid_b"), a0 = F.bal(S.w, "kid_a");
  await kidDo(S, S.B, "hdGrabDone", "kid_b", MON, "c_b_tub");
  const r = day(S, MON), d = (r.done || {}).c_b_tub || {};
  ok("Kid B is paid exactly 30 (double 15), once", F.bal(S.w, "kid_b") - b0 === 30 && notes(S, "kid_b", /Scrub the tub/).length === 1, notes(S, "kid_b", /tub/));
  ok("…the bank line says it was a ×2 Up for Grabs", /🛁 Scrub the tub \(×2 Up for Grabs\)/.test(notes(S, "kid_b", /tub/)[0].note));
  ok("the done record is by chore: who, paid, the offer, the list, what was there before", d.who === "kid_b" && d.pts === 30 && d.grab === 30 && d.slot === "chores" && !!d.bid && d.prev && (d.prev.doneN || 0) === (j0.doneN || 0), d);
  ok("the offer records who did it", (r.grabs.c_b_tub || {}).by === "kid_b" && !!(r.grabs.c_b_tub || {}).done);
  const j1 = job(S, "c_b_tub");
  ok("last-done, by whom and the counters are stamped", j1.lastDone === MON && j1.lastBy === "kid_b" && j1.doneN === (j0.doneN || 0) + 1 && j1.kidRun === (j0.kidRun || 0) + 1, j1);
  const L = log(S, "kid_b", /^Scrub the tub$/);
  ok("one Click-off Log line, the chore's own name on its own list, +30", L.length === 1 && L[0].act === "on" && L[0].pts === 30 && L[0].slot === "chores" && L[0].house === "c_b_tub" && L[0].x2 === 1, L);
  ok("hdDone reads it done (every plan reader asks this)", S.A.run("hdDone('" + MON + "','c_b_tub')") === true && S.B.run("hdDone('" + MON + "','c_b_tub')") === true);
  ok("Kid B's card: ✓ Done with undo; Kid A no longer sees it; Kid A's tap does nothing", /✓ Done<\/div><button class="gc-let" onclick="hdGrabUndo\('kid_b'/.test(html(S.B, "kid_b")) && J(F.x2(S.B, "kid_a")) === J(["c_a_vac"]));
  const m0 = S.w.mark(); await kidDo(S, S.B, "hdGrabDone", "kid_a", MON, "c_b_tub"); await kidDo(S, S.B, "hdGrabDone", "kid_b", MON, "c_b_tub");
  ok("…a second tap (the sibling, or Kid B again) writes nothing and pays nothing", S.w.since(m0).length === 0 && F.bal(S.w, "kid_a") === a0 && F.bal(S.w, "kid_b") - b0 === 30);
  const rn = R(S.A, "var o=null; hhRoomList().map(function(x){ return x[0]; }).concat(['__none','']).forEach(function(rid){ rnRows(rid).rows.forEach(function(x){ if(x.id==='c_b_tub') o=x; }); }); return o;");
  ok("a room's 🔴 Now: a done row, Kid B, ×2 grab", rn && rn.done === true && rn.who === "kid_b" && rn.grab === 1, rn);
  ok("📅 Schedule today: Kid B ✓", R(S.A, "return hwToday({k:'all'}).c_b_tub;").who === "kid_b" && R(S.A, "return hwToday({k:'all'}).c_b_tub;").done === true);
  ok("the room grid's today square: Kid B ✓", J(R(S.A, "return hhRmCell('c_b_tub','" + MON + "','" + MON + "',hhLogState(),{});")) === J({ who: "kid_b", done: true }));
  ok("👤 By person: ✓ Kid B did it · ×2 · +30 ⭐, no Give to… on it", /✓ Kid B did it · ×2 · \+30 ⭐/.test(S.A.run("hpOnHTML('kid_a')")) && !/hdGive\('2026-11-16','c_b_tub'/.test(S.A.run("hpOnHTML('kid_a')")));
  ok("the owner's hidden old row reads done (0 ⭐), so switching the plan off can't pay it again", R(S.B, "const k=hdOwnerKey('c_b_tub','" + MON + "'); return slState[k]||null;").hd === MON);
  await at(S, 17, 7);
  ok("Tuesday: the tub is Tuesday's own chore again (a daily), not carried; Monday's done stays", !!(day(S, TUE).over || {}).c_b_tub && !((day(S, TUE).plan || {}).c_b_tub || {}).late && !!day(S, MON).done.c_b_tub);
  ok("…and its offer is a fresh Tuesday one, open to both kids", J(F.x2(S.B, "kid_b")) === J(["c_b_tub"]) && F.x2(S.B, "kid_a").indexOf("c_b_tub") >= 0);
}

// ── 4 ──
console.log("\n── 4 · Grab for later, let go, Mark done, one at a time, a sibling ──");
{ const S = await mk(); await at(S, 16, 9);
  await kidDo(S, S.B, "hdGrabHold", "kid_a", MON, "c_b_tub");
  ok("🔖 Kid A grabs the tub for later: the offer says so; nothing paid", (day(S, MON).grabs.c_b_tub || {}).by === "kid_a" && !(day(S, MON).done || {}).c_b_tub && notes(S, "kid_a", /tub/).length === 0);
  ok("…it leaves Kid B's Up for Grabs", J(F.x2(S.B, "kid_b")) === J([]) && !/Scrub the tub/.test(html(S.B, "kid_b")));
  ok("…Kid A's card: ✓ Mark done (+30) and let go", /hdGrabDone\('kid_a','2026-11-16','c_b_tub'\)">✓ Mark done \(\+30\)<\/button><button class="gc-let" onclick="hdGrabLetGo/.test(html(S.B, "kid_a")));
  ok("…Mom's view of Kid B: 🔒 Kid A grabbed it, with release", /🔒 Kid A grabbed it<\/div><button class="gc-let" onclick="hdGrabLetGo\('kid_a','2026-11-16','c_b_tub'\)">release/.test(html(S.A, "kid_b", true)));
  let m = S.w.mark(); await kidDo(S, S.B, "hdGrabHold", "kid_a", MON, "c_a_vac");
  ok("one at a time: Kid A can't grab the vacuum for later too (nothing written)", S.w.since(m).length === 0 && !(day(S, MON).grabs.c_a_vac || {}).by);
  m = S.w.mark(); S.B.run("gbClaim('kid_a',1)"); await S.w.flush();
  ok("…nor a normal grab for later (the same rule)", S.w.since(m).length === 0 && !S.w.get("grabClaims/" + S.B.run("activeWk()") + "_1"));
  m = S.w.mark(); await kidDo(S, S.B, "hdGrabDone", "kid_b", MON, "c_b_tub");
  ok("Kid B's tap from a screen drawn before Kid A grabbed it: refused, nothing paid", !(day(S, MON).done || {}).c_b_tub && notes(S, "kid_b", /tub/).length === 0 && S.w.since(m).every(l => l.op === "tx"));
  await kidDo(S, S.B, "hdGrabLetGo", "kid_a", MON, "c_b_tub");
  ok("let go: open again for both", !(day(S, MON).grabs.c_b_tub || {}).by && F.x2(S.B, "kid_b").indexOf("c_b_tub") >= 0);
  S.B.run("gbClaim('kid_b',1)"); await S.w.flush(); m = S.w.mark(); await kidDo(S, S.B, "hdGrabHold", "kid_b", MON, "c_b_tub");
  ok("…and a kid holding a NORMAL grab can't hold a ×2 one", S.w.since(m).length === 0 && !(day(S, MON).grabs.c_b_tub || {}).by);
  const b0 = F.bal(S.w, "kid_b"); await kidDo(S, S.B, "hdGrabDone", "kid_b", MON, "c_b_tub");
  ok("…but can do it now (like I did it now on a grab): +30", F.bal(S.w, "kid_b") - b0 === 30);
  await kidDo(S, S.A, "hdGrabHold", "kid_a", MON, "c_a_vac");
  ok("Mom's assign (from Mom's device): Kid A holds the vacuum", (day(S, MON).grabs.c_a_vac || {}).by === "kid_a");
  await kidDo(S, S.A, "hdGrabLetGo", "kid_a", MON, "c_a_vac");
  ok("Mom's release: open again", !(day(S, MON).grabs.c_a_vac || {}).by);
  await kidDo(S, S.B, "hdGrabHold", "kid_a", MON, "c_a_vac"); const a0 = F.bal(S.w, "kid_a"); await kidDo(S, S.B, "hdGrabDone", "kid_a", MON, "c_a_vac"); await kidDo(S, S.B, "hdGrabDone", "kid_a", MON, "c_a_vac");
  ok("hold → Mark done: +30 once (a second tap pays nothing)", F.bal(S.w, "kid_a") - a0 === 30 && notes(S, "kid_a", /Vacuum the den/).length === 1);
  ok("…and Kid A is free to grab again (one at a time is about holds)", S.B.run("gbHasActive('kid_a')") === false);
}

// ── 5 ──
console.log("\n── 5 · ↩ undo: exactly what was paid comes back ──");
{ const S = await mk(); await at(S, 16, 9);
  const j0 = job(S, "c_c_beds"), b0 = F.bal(S.w, "kid_c"), n0 = F.bank(S.w, "kid_c").length;
  await kidDo(S, S.B, "hdGrabDone", "kid_c", MON, "c_c_beds"); ok("Kid C did the beds: +10", F.bal(S.w, "kid_c") - b0 === 10);
  S.B.run("hdGrabUndo('kid_c','" + MON + "','c_c_beds')"); await S.w.flush();
  const j1 = job(S, "c_c_beds");
  ok("Kid C's own undo: the +10 entry is gone (balance and entries as before)", F.bal(S.w, "kid_c") === b0 && F.bank(S.w, "kid_c").length === n0);
  ok("…the done record is gone; last-done, by whom and the counters are what they were", !(day(S, MON).done || {}).c_c_beds && (j1.lastDone || null) === (j0.lastDone || null) && (j1.lastBy || null) === (j0.lastBy || null) && (j1.doneN || 0) === (j0.doneN || 0) && (j1.kidRun || 0) === (j0.kidRun || 0), [j0, j1]);
  ok("…the offer is open again, the owner's row too, and an \"off\" line in the Click-off Log", J(F.x2(S.B, "kid_c")) === J(["c_c_beds"]) && !(day(S, MON).grabs.c_c_beds || {}).done && !R(S.B, "const k=hdOwnerKey('c_c_beds','" + MON + "'); return !!(slState[k]&&slState[k].done);") && log(S, "kid_c", /^Straighten the beds$/).map(e => e.act).join() === "on,off");
  await kidDo(S, S.B, "hdGrabDone", "kid_c", MON, "c_c_beds"); S.A.run("hdGrabUndo('kid_c','" + MON + "','c_c_beds')"); await S.w.flush();
  ok("Mom's undo on Kid C's Up for Grabs: \"↩︎ Mom undid\" −10, net 0", F.bal(S.w, "kid_c") === b0 && notes(S, "kid_c", /↩︎ Mom undid: Straighten the beds/).length === 1 && notes(S, "kid_c", /↩︎ Mom undid/)[0].amount === -10);
  const m = S.w.mark(); S.B.run("hdGrabUndo('kid_b','" + MON + "','c_c_beds')"); await S.w.flush();
  ok("an undo for a kid who didn't do it writes nothing", S.w.since(m).length === 0);
  S.w.db.api("t").ref("config/choreVerify/kid_c").set(true); await S.w.flush();
  await kidDo(S, S.B, "hdGrabDone", "kid_c", MON, "c_c_beds");
  const held = notes(S, "kid_c", /Straighten the beds \(×2/).find(x => x.held);
  ok("Mom's check on for Kid C: the +10 is held for her check, like a list check-off", !!held && held.amount === 10);
  S.B.run("hdGrabUndo('kid_c','" + MON + "','c_c_beds')"); await S.w.flush();
  ok("…and undone, the held entry is simply removed", !notes(S, "kid_c", /Straighten the beds \(×2/).some(x => x.held) && F.bal(S.w, "kid_c") === b0);
}

// ── 6 ──
console.log("\n── 6 · → Give to… ──");
{ const S = await mk(); await at(S, 16, 9);
  S.A.run("hdGive('" + MON + "','c_b_tub','kid_a')"); await S.w.flush(); const r = day(S, MON);
  ok("before a kid takes it: out of Up for Grabs, onto Kid A's list (given), off \"fit nobody\"", !(r.grabs || {}).c_b_tub && (r.plan.c_b_tub || {}).who === "kid_a" && r.plan.c_b_tub.why === "given" && !(r.over || {}).c_b_tub);
  ok("…no kid sees it as a grab; Kid A has it on the Chores list at its normal 15 ⭐", ["kid_a", "kid_b"].every(k => F.x2(S.B, k).indexOf("c_b_tub") < 0) && R(S.B, "return rtStepsFor('chores','kid_a').filter(function(s){ return s.house==='c_b_tub'; }).map(function(s){ return s.pts; });").join() === "15");
  await kidDo(S, S.B, "hdGrabHold", "kid_c", MON, "c_c_beds"); S.A.run("hdGive('" + MON + "','c_c_beds','kid_c')"); await S.w.flush();
  ok("after Kid C grabbed the beds for later: Give to… lets the hold go and puts it on the list", !(day(S, MON).grabs || {}).c_c_beds && (day(S, MON).plan.c_c_beds || {}).who === "kid_c" && S.B.run("gbHasActive('kid_c')") === false);
  const c0 = F.bal(S.w, "kid_c"), m = S.w.mark(); await kidDo(S, S.B, "hdGrabDone", "kid_c", MON, "c_c_beds");
  ok("…Kid C's Mark done from the old screen: refused, nothing paid (the list row pays the normal 5 when ticked)", F.bal(S.w, "kid_c") === c0 && S.w.since(m).length === 0);
  await kidDo(S, S.B, "hdGrabDone", "kid_a", MON, "c_a_vac"); const m2 = S.w.mark();
  ok("after Kid A did the vacuum: Give to… is refused (null), nothing written", S.A.run("hdGive('" + MON + "','c_a_vac','kid_a')") === null && (await S.w.flush(), S.w.since(m2).length === 0) && !(day(S, MON).plan || {}).c_a_vac);
  ok("…and Mom's screen shows no Give to… on it", !/hdGive\('2026-11-16','c_a_vac'/.test(S.A.run("hpOnHTML('kid_a')")));
  // Mom's screen hasn't heard that a kid did it yet: the take-back transaction sees the done and refuses
  const T = await mk(); await at(T, 16, 9);
  T.A.run("window.__stale=JSON.parse(JSON.stringify(houseDayData['" + MON + "']))"); await kidDo(T, T.B, "hdGrabDone", "kid_b", MON, "c_b_tub");
  T.A.run("houseDayData['" + MON + "']=window.__stale; hpTell=function(m){ window.__told=m; }"); T.A.run("hdGive('" + MON + "','c_b_tub','kid_a')"); await T.w.flush();
  ok("a Give to… from Mom's screen that hadn't heard Kid B did it: refused by the offer's own record — not paid and handed out", !(day(T, MON).plan || {}).c_b_tub && !!(day(T, MON).done || {}).c_b_tub && /already done/.test(T.A.run("window.__told||''")));
}

// ── 7 ──
console.log("\n── 7 · not grabbed → first in line tomorrow; never twice ──");
{ const X = await mk(), Y = await mk(); await at(X, 16, 9); await at(Y, 16, 9);
  await kidDo(Y, Y.B, "hdGrabDone", "kid_a", MON, "c_a_vac");
  await at(X, 17, 7); await at(Y, 17, 7);
  const px = (day(X, TUE).plan || {}).c_a_vac || {};
  ok("not grabbed Monday (Mon + Thu): Tuesday it is first in line on Kid A's list, 1 day late, normal stars, nothing paid for it", px.who === "kid_a" && px.why === "carried" && px.late === 1 && Object.entries(day(X, TUE).plan).filter(([id, p]) => p.who === "kid_a" && id !== "c_a_vac").every(([, p]) => p.order > px.order) && notes(X, "kid_a", /Vacuum/).length === 0, px);
  ok("…and on Tuesday it is not up for grabs (it is on a list)", !(day(X, TUE).grabs || {}).c_a_vac && F.x2(X.B, "kid_a").indexOf("c_a_vac") < 0);
  ok("grabbed and done Monday: Tuesday it is nowhere (not laid again, not offered, no miss)", !(day(Y, TUE).plan || {}).c_a_vac && !(day(Y, TUE).over || {}).c_a_vac && !(day(Y, TUE).miss || {}).c_a_vac);
  // every N: kid_b has no room at all, so the every-7-days mop fits nobody
  const E = await mk("saved", "on", { extra: h => { h.people.kid_b = { school: 0, weekend: 0 }; } }), Z = await mk("saved", "on", { extra: h => { h.people.kid_b = { school: 0, weekend: 0 }; } });
  await at(E, 16, 9); await at(Z, 16, 9);
  ok("an every-N chore that fits nobody is offered (Mop the kitchen ×2 = 40)", ((day(E, MON).grabs || {}).c_b_mop || {}).pts === 40);
  await kidDo(E, E.B, "hdGrabDone", "kid_b", MON, "c_b_mop"); await at(E, 17, 7); await at(Z, 17, 7);
  ok("…done as a grab: last-done is today, so it is not due tomorrow", job(E, "c_b_mop").lastDone === MON && !(day(E, TUE).plan || {}).c_b_mop && !(day(E, TUE).over || {}).c_b_mop);
  ok("…not grabbed: it stays due (every N waits for its last-done), offered again tomorrow, once", !!(day(Z, TUE).over || {}).c_b_mop && !(day(Z, TUE).plan || {}).c_b_mop && !!(day(Z, TUE).grabs || {}).c_b_mop);
  // a week: never a chore both on a list and up for grabs, never paid as a grab and laid again the same day
  const W7 = await mk(); let bad = [];
  for (let n = 16; n < 23; n++) { await at(W7, n, 9); const iso = "2026-11-" + n, r = day(W7, iso);
    Object.keys(r.grabs || {}).forEach(id => { if ((r.plan || {})[id] || !(r.over || {})[id]) bad.push(iso + " " + id); });
    F.x2(W7.B, "kid_a").forEach(id => W7.B.run("hdGrabDone('kid_a','" + iso + "','" + id + "')")); await W7.w.flush();
    W7.A.run("hdRelay('" + iso + "')"); await W7.w.flush(); const r2 = day(W7, iso);
    Object.keys(r2.done || {}).forEach(id => { if (r2.done[id].grab && (r2.plan || {})[id]) bad.push(iso + " paid+laid " + id); }); }
  ok("a week with grabs and a re-lay every day: no chore is ever both laid and up for grabs, or paid as a grab and laid again", bad.length === 0, bad);
  const paid = notes(W7, "kid_a", /×2 Up for Grabs/).reduce((a, x) => a + x.amount, 0), recs = []; for (let n = 16; n < 23; n++) { const r = day(W7, "2026-11-" + n); Object.keys(r.done || {}).forEach(id => { if (r.done[id].grab && r.done[id].who === "kid_a") recs.push(r.done[id]); }); }
  ok("…every ×2 payment matches a done record, once (" + recs.length + " grabs, " + paid + " ⭐)", recs.length >= 7 && paid === recs.reduce((a, d) => a + d.pts, 0) && notes(W7, "kid_a", /×2 Up for Grabs/).length === recs.length);
}

// ── 8 ──
console.log("\n── 8 · a stars edit mid-day ──");
{ const S = await mk(); await at(S, 16, 9);
  await kidDo(S, S.B, "hdGrabHold", "kid_a", MON, "c_b_tub"); await kidDo(S, S.B, "hdGrabDone", "kid_c", MON, "c_c_beds");
  S.w.db.api("t").ref("household/jobs/c_b_tub/pts").set(20); S.w.db.api("t").ref("household/jobs/c_a_vac/pts").set(25); S.w.db.api("t").ref("household/jobs/c_c_beds/pts").set(50); await S.w.flush();
  ok("Mom is asked \"Re-lay today too / Keep today\"", S.A.run("hdAsking('" + MON + "')") === true);
  ok("until she answers, the offers stand as laid (vacuum still +30)", (day(S, MON).grabs.c_a_vac || {}).pts === 30 && /\+30 ⭐/.test(html(S.B, "kid_a").split("Vacuum the den")[0].slice(-400)));
  S.w.db.api("t").ref("household/people/kid_d/school").set(10); await S.w.flush();
  const m = S.w.mark(); S.A.run("hdRelay('" + MON + "')"); await S.w.flush(); const r = day(S, MON);
  ok("Re-lay today too: the tub Kid A holds stays held, at the +30 Kid A grabbed it for", (r.grabs.c_b_tub || {}).by === "kid_a" && r.grabs.c_b_tub.pts === 30 && !(r.plan || {}).c_b_tub);
  ok("…the beds Kid C did stay done, paid 10 (not re-laid, not re-priced)", !!r.done.c_c_beds && r.done.c_c_beds.pts === 10 && !(r.plan || {}).c_c_beds && r.grabs.c_c_beds.pts === 10);
  ok("…the open vacuum offer follows the new stars: ×2 of 25 = 50", (r.grabs.c_a_vac || {}).pts === 50);
  ok("…the shelf now fits Kid D (limit raised): out of Up for Grabs, on Kid D's list", !(r.grabs || {}).c_d_shelf && (r.plan.c_d_shelf || {}).who === "kid_d" && !(r.over || {}).c_d_shelf);
  ok("…its writes: plan / over / sig paths, and the offers only by their own transactions", S.w.since(m).every(l => l.op === "tx" ? /^houseDay\/2026-11-16\/grabs\/\w+$/.test(l.path) : (l.keys || []).every(k => /^(plan|over)\/\w+$|^built\/sig$|^keep$/.test(String(k).replace(/^houseDay\/2026-11-16\//, "")))), S.w.since(m).map(l => l.op + " " + l.path + " " + (l.keys || []).join(",")));
  const a0 = F.bal(S.w, "kid_a"); await kidDo(S, S.B, "hdGrabDone", "kid_a", MON, "c_b_tub");
  ok("Kid A marks the tub done: +30 (what it was grabbed for)", F.bal(S.w, "kid_a") - a0 === 30);
  const K = await mk(); await at(K, 16, 9); K.w.db.api("t").ref("household/jobs/c_a_vac/pts").set(25); await K.w.flush(); K.A.run("hdKeep('" + MON + "')"); await K.w.flush();
  const k0 = F.bal(K.w, "kid_a"); await kidDo(K, K.B, "hdGrabDone", "kid_a", MON, "c_a_vac");
  ok("Keep today, start tomorrow: the offer stays +30 and pays 30", F.bal(K.w, "kid_a") - k0 === 30);
  await at(K, 19, 7); ok("…the next time it fits nobody (Thursday) it is offered at the new ×2 = 50", ((day(K, "2026-11-19").grabs || {}).c_a_vac || {}).pts === 50);
}

// ── 9 ──
console.log("\n── 9 · the day roll and open devices ──");
{ const S = await mk(); await at(S, 16, 15); await kidDo(S, S.B, "hdGrabHold", "kid_a", MON, "c_b_tub");
  await at(S, 17, 0, 5); const a0 = F.bal(S.w, "kid_a"), m = S.w.mark();
  S.B.run("hdGrabDone('kid_a','" + MON + "','c_b_tub'); hdGrabDone('kid_b','" + MON + "','c_b_tub'); hdGrabHold('kid_c','" + MON + "','c_c_beds')"); await S.w.flush();
  ok("just after midnight, taps on Monday's cards (a screen drawn yesterday): refused, nothing written or paid", S.w.since(m).filter(l => !/^houseDay\/2026-11-17|^houseDay$/.test(l.path) && !(l.keys || []).some(k => /houseDay\/2026-11-17/.test(k))).length === 0 && F.bal(S.w, "kid_a") === a0 && !(day(S, MON).done || {}).c_b_tub);
  await at(S, 17, 7);
  ok("Monday's offers are not shown Tuesday; Tuesday's are Tuesday's", F.x2(S.B, "kid_a").every(id => !!(day(S, TUE).grabs || {})[id]) && !/2026-11-16/.test(html(S.B, "kid_a")));
  ok("Monday's hold is gone with Monday (nothing paid; Kid A is free to grab)", S.B.run("gbHasActive('kid_a')") === false && notes(S, "kid_a", /tub/).length === 0);
  // a kid's screen that hasn't heard Mom took the offer back (Give to…): the offer's own record refuses the tap
  S.B.run("window.__stale=JSON.parse(JSON.stringify(houseDayData['" + TUE + "']))"); S.A.run("hdGive('" + TUE + "','c_b_tub','kid_a')"); await S.w.flush();
  S.B.run("houseDayData['" + TUE + "']=window.__stale"); const b0 = F.bal(S.w, "kid_b"), m2 = S.w.mark(); S.B.run("hdGrabDone('kid_b','" + TUE + "','c_b_tub')"); await S.w.flush();
  ok("a kid's screen that hadn't heard Give to…: the tap is refused by the offer's own record — nothing paid, no done", F.bal(S.w, "kid_b") === b0 && !(day(S, TUE).done || {}).c_b_tub && S.w.since(m2).every(l => l.op === "tx" && l.committed === false));
  // a screen that hadn't heard a re-lay took an offer back
  S.w.db.api("t").ref("household/people/kid_d/school").set(10); await S.w.flush();
  S.B.run("window.__stale=JSON.parse(JSON.stringify(houseDayData['" + TUE + "']))"); S.A.run("hdRelay('" + TUE + "')"); await S.w.flush(); S.B.run("houseDayData['" + TUE + "']=window.__stale");
  const m3 = S.w.mark(); S.B.run("hdGrabDone('kid_d','" + TUE + "','c_d_shelf')"); await S.w.flush();
  ok("…or a re-lay (the shelf now fits Kid D's list): refused, no grab done, the list row stands", !(day(S, TUE).done || {}).c_d_shelf && (day(S, TUE).plan.c_d_shelf || {}).who === "kid_d" && S.w.since(m3).every(l => l.op === "tx" && l.committed === false));
}

// ── 10 ──
console.log("\n── 10 · dry run, Kid Off, the plan switched off, preview and off ──");
{ const S = await mk(); await at(S, 16, 9); S.B.run("HA_LS.setItem('ha_dryrun','1')"); S.A.run("HA_LS.setItem('ha_dryrun','1')");
  const m = S.w.mark(), b0 = F.bal(S.w, "kid_b"); S.B.run("hdGrabDone('kid_b','" + MON + "','c_b_tub'); hdGrabHold('kid_a','" + MON + "','c_a_vac')"); S.A.run("hdGive('" + MON + "','c_c_beds','kid_c'); hdRelay('" + MON + "')"); await S.w.flush();
  ok("?dryrun=1: taps, Give to… and Re-lay write nothing and pay nothing", S.w.since(m).length === 0 && F.bal(S.w, "kid_b") === b0, S.w.since(m).map(l => l.op + " " + l.path));
  S.B.run("HA_LS.removeItem('ha_dryrun')"); S.A.run("HA_LS.removeItem('ha_dryrun')");
}
{ const S = await mk("saved", "on", { extra: h => { h.jobs.c_b_bath.minutes = 15; } }); await at(S, 16, 7, 30);   // Kid A has 12 minutes left: the sink can't move to her
  S.w.db.api("t").ref("calendar/kidOverrides/kid_b/" + MON).set({ school: false, note: "Sick" }); await S.w.flush(); await S.w.tick();
  const r = day(S, MON);
  ok("😷 Kid B off: Kid B's chores go to someone who can, else \"fit nobody\" — and then into Up for Grabs for the others only", Object.keys(r.over || {}).filter(id => job(S, id).who === "kid_b" && id !== "c_b_tub").every(id => !r.grabs[id] || J(r.grabs[id].can) === J(["kid_a"])) && Object.keys(r.plan).every(id => r.plan[id].who !== "kid_b"), [r.over, r.grabs]);
  const swept = Object.keys(r.over || {}).filter(id => job(S, id).who === "kid_b" && id !== "c_b_tub" && (job(S, id).can || []).indexOf("kid_a") >= 0);
  ok("…(" + swept.join(",") + ") offered ×2 to Kid A, with their own transaction", swept.length >= 1 && swept.every(id => (r.grabs[id] || {}).pts === 2 * job(S, id).pts), swept);
}
{ const S = await mk(); await at(S, 16, 9); await kidDo(S, S.B, "hdGrabDone", "kid_c", MON, "c_c_beds"); const c1 = F.bal(S.w, "kid_c");
  S.w.db.api("t").ref("household/meta/engine").set({ mode: "off", on: "2026-11-09" }); await S.w.flush();
  const i = S.B.run("rtStepsFor('chores','kid_c').findIndex(function(s){ return s.label==='Straighten the beds'; })");
  ok("plan switched off: Kid C's old Chores row reads done (the ×2 grab), so it can't be paid again", i >= 0 && S.B.run("rtDoneOn('chores','kid_c','monday'," + i + ")") === true && !/Scrub the tub|×2/.test(html(S.B, "kid_b")));
  S.B.run("toggleRtStep('chores','kid_c'," + i + ")"); await S.w.flush();
  ok("…un-checking it there takes back exactly the 10, clears the done record and the grab", F.bal(S.w, "kid_c") === c1 - 10 && !(day(S, MON).done || {}).c_c_beds && !(day(S, MON).grabs.c_c_beds || {}).done && !(day(S, MON).grabs.c_c_beds || {}).by);
}
for (const mode of ["preview", "off"]) { const S = await mk("saved", mode); await at(S, 16, 9); const m0 = S.w.mark(); S.A.run("try{ hhRender(); renderAll(); }catch(e){}"); await S.w.flush();
  ok(mode + ": nothing stored under houseDay, no kid sees a ×2 grab", !S.w.get("houseDay/" + MON + "/grabs") && ["kid_a", "kid_b", "kid_c", "kid_d"].every(k => !/×2|Double stars/.test(html(S.B, k)) && F.x2(S.B, k).length === 0));
  ok(mode + ": the ×2 taps do nothing", (S.B.run("hdGrabDone('kid_b','" + MON + "','c_b_tub')"), await S.w.flush(), S.w.since(m0).every(l => !/grab|bank/.test(l.path))));
  if (mode === "preview") ok("preview: tomorrow's card says where each overflow would go — \"at double for: Kid B, Kid A\"", /at double for: Kid B, Kid A/.test(S.A.run("hpTomorrowHTML()")));
}

// ── 11 ──
console.log("\n── 11 · Mom's screens ──");
{ const S = await mk(); await at(S, 16, 9); const bp = () => S.A.run("hpOnHTML('kid_a')"), rooms = () => R(S.A, "return hhRoomList().map(function(x){ return x[0]; }).concat(['__none','']);");
  const roomOf = id => rooms().find(rid => R(S.A, "return rnRows(" + J(rid) + ").over.concat(rnRows(" + J(rid) + ").rows).some(function(x){ return x.id===" + J(id) + "; });"));
  ok("👤 By person: \"Didn't fit anyone today\" says which are in Up for Grabs at double, for whom", /🙌 Up for Grabs ×2 · \+30 ⭐ · for Kid B, Kid A/.test(bp()) && /🙌 Up for Grabs ×2 · \+10 ⭐ · for Kid C/.test(bp()));
  ok("…the oven (no kid can) stays as now: whose turn, minutes, Give to…, no Up for Grabs line", (() => { const h = bp(), seg = h.slice(h.indexOf("Clean the oven"), h.indexOf("Clean the oven") + 900); return /Mom’s turn/.test(seg) && !/Up for Grabs ×2/.test(seg.split("</div>")[0]) && /hdGive\('2026-11-16','m_oven'/.test(seg); })());
  ok("…Give to… is still on every open one", ["c_b_tub", "c_c_beds", "c_a_vac", "m_oven"].every(id => new RegExp("hdGive\\('2026-11-16','" + id + "'").test(bp())));
  await kidDo(S, S.B, "hdGrabHold", "kid_a", MON, "c_b_tub"); await kidDo(S, S.B, "hdGrabDone", "kid_c", MON, "c_c_beds");
  ok("…who took one: 🔖 Kid A grabbed it · ×2; who did one: ✓ Kid C did it · ×2 · +10 ⭐ (no Give to… on that one)", /🔖 Kid A grabbed it · ×2/.test(bp()) && /✓ Kid C did it · ×2 · \+10 ⭐/.test(bp()) && !/hdGive\('2026-11-16','c_c_beds'/.test(bp()));
  const tubRoom = roomOf("c_b_tub"), now = S.A.run("rnNowHTML(" + J(tubRoom) + ")");
  ok("a room's 🔴 Now (" + tubRoom + "): the same line on the tub", /🔖 Kid A grabbed it · ×2/.test(now) && /Didn’t fit anyone today/.test(now));
  const bedRoom = roomOf("c_c_beds"), nb = S.A.run("rnNowHTML(" + J(bedRoom) + ")");
  ok("…and the beds Kid C did are in its done line, \"(Kid C, ×2 grab)\"", /Straighten the beds \(Kid C, ×2 grab\)/.test(nb), nb.slice(-500));
  const wh = S.A.run("htNowHTML()");
  ok("🏠 Whole house: the same lines under \"Didn't fit anyone today\"", /🔖 Kid A grabbed it · ×2/.test(wh) && /🙌 Up for Grabs ×2 · \+30 ⭐ · for Kid A/.test(wh) && !/hdGive\('2026-11-16','c_c_beds'/.test(wh));
  ok("📅 Schedule today: the beds are Kid C ✓; the tub still an open grab", J(R(S.A, "const t=hwToday({k:'all'}); return [t.c_c_beds,t.c_b_tub];")) === J([{ who: "kid_c", done: true, late: 0, skip: false }, { who: "kid_b", done: false, over: true }]), R(S.A, "const t=hwToday({k:'all'}); return [t.c_c_beds,t.c_b_tub];"));
  ok("drawing every one of these writes nothing", (() => { const m = S.w.mark(); S.A.run("hpOnHTML('kid_a'); rnNowHTML(" + J(tubRoom) + "); htNowHTML(); _grabsHTML('kid_a',true); hhRender();"); return S.w.since(m).length === 0; })());
}

// ── 12 ──
console.log("\n── 12 · normal grabs never collide (old pool by position, switched pool) ──");
for (const kind of ["saved", "builtin"]) for (const sw of [false, true]) {
  const S = await mk(kind); if (sw) { S.A.run("hgOpen(); hgSwitch()"); await S.w.flush(); }
  await at(S, 16, 9); const wk = S.B.run("activeWk()"), label = kind + (sw ? " · switched" : " · by position");
  ok(label + ": the pool is " + (sw ? "the table (switched)" : "by position"), S.B.run("gbSwOn()") === sw);
  const pool0 = J(F.G.poolNames(S.B, "kid_a")); F.G.act(S.B, "gbInstant", "kid_a", "Wash the porch window"); await S.w.flush();
  await kidDo(S, S.B, "hdGrabDone", "kid_a", MON, "c_b_tub"); await kidDo(S, S.B, "hdGrabHold", "kid_a", MON, "c_a_vac");
  const gc = S.w.get("grabClaims") || {}, key = R(S.B, "return gbRows().find(function(x){ return x.g.label==='Wash the porch window'; }).i;");
  ok(label + ": the grab records are exactly the normal grab's (" + Object.keys(gc).sort().join(",") + ")", J(Object.keys(gc).sort()) === J([wk + "_" + key, "last_" + key].sort()) && gc[wk + "_" + key].by === "kid_a");
  ok(label + ": both are paid, each its own (+15 porch window, +30 tub)", notes(S, "kid_a", /Wash the porch window/).reduce((a, x) => a + x.amount, 0) === 15 && notes(S, "kid_a", /Scrub the tub \(×2/).reduce((a, x) => a + x.amount, 0) === 30);
  ok(label + ": the normal pool is the same list as before the ×2 grabs (less the one done)", J(F.G.poolNames(S.B, "kid_a")) === J(JSON.parse(pool0).filter(n => n !== "Wash the porch window")));
  const m = S.w.mark(); F.G.act(S.B, "gbClaim", "kid_a", "Wipe the island"); await S.w.flush();
  ok(label + ": holding the ×2 vacuum, Kid A can't hold a normal grab (one at a time), and nothing moved", S.w.since(m).length === 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
