/*
 * test_house_grabs.js — HOUSEGRABS (index.html) + HOUSEGRABS_UI (house.js), Household by room step 6a (DESIGN_household_rooms_2026-11-15
 * §2.3 problem 7, §4.7, §13; her "Yes, start 6a" 2026-11-18): Up for Grabs kept in the chore table, with "who can grab it". The WHOLE app
 * per device (test_fixtures/house_grabs_world.js: a made-up family, a made-up pool and a table whose Up for Grabs rows do not match it).
 *   1 the switch screen: every difference listed with its choice; the kids' list now and after; drawing writes nothing
 *   2 🙌 Switch = ONE update of exactly the paths the screen worked out; Mom only; ?dryrun=1 inert; refused without Take over / twice;
 *     after it every kid's Up for Grabs (their screen and Mom's) is byte for byte what it was; nothing outside household/ is written;
 *     the screen's "after" is what the kids then see — with her choices too (a different name, the table's stars, left out, added)
 *   3 ↩ Undo = ONE update; household/ byte for byte as before; refused once Up for Grabs was changed; a kid's grab does not block it
 *   4 who can grab it: the card and ⚙ Rules, one path per tap, the kids' lists, a sibling's pull, Mom's view and assign, a held grab
 *     kept, the last kid, "everyone", 🔍 Checks, the cleaning day's Can-do; nothing of it before the switch
 *   5 the card after the switch: name, stars, days, retire, bring back, ＋ Add with Up for Grabs → the kids' list follows
 *   6 adding, retiring and re-ordering rows never moves a grab; the old pool's records are never written after the switch
 *   7 the old editors (Star Store ▸ 🙌, Chores & Stars ▸ Up for Grabs, zones): refuse a switched pool and point to Household; still
 *     work on a pool not switched; 📥 Bring in leaves a switched pool alone
 * Run: node test_house_grabs.js
 */
"use strict";
const fs = require("fs"), path = require("path"), F = require(path.join(__dirname, "test_fixtures", "house_grabs_world.js"));
const HJS = fs.readFileSync(path.join(__dirname, "house.js"), "utf8");
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 700) + ")" : "")); } };
const J = o => JSON.stringify(o), clone = o => JSON.parse(J(o));
const mk = async (kind, mode, o) => { const w = await F.world(kind, mode || "preview", o); const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"); A.run(HJS); await w.flush(); await w.at(2026, 11, 18, 14, 0); A.run("try{ renderAll(); hhRender(); }catch(e){}"); await w.flush(); return { w, A, B }; };
const R = (d, expr) => JSON.parse(d.run("JSON.stringify((function(){ " + expr + " })())"));
const writes = (w, m) => w.since(m).map(l => l.op + " " + l.path + " " + (l.keys || []).slice().sort().join(","));
const plan = (A, ch) => R(A, "const p=hgPlan(" + J(ch || {}) + "); return {ok:p.ok,why:p.why,diffs:p.diffs.map(function(d){ return d.k; }),upd:p.upd,same:p.same,aft:p.aft,now:p.now};");
const text = h => String(h).replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");
const UPD = ["household/jobs/gb_wash_the_porch_window/grabKey", "household/jobs/gb_wipe_the_island/grabKey", "household/jobs/gb_wipe_the_island/pts", "household/jobs/gb_scrub_the_hall_toilet_old/grabKey", "household/jobs/gb_scrub_the_hall_toilet_old/label", "household/jobs/gb_scrub_the_hall_toilet_old/zone", "household/jobs/gb_clean_under_the_couch/grabKey", "household/jobs/gb_clean_under_the_couch/cad", "household/jobs/gb_sort_the_bookshelf/grabKey", "household/jobs/gb_sort_the_bookshelf/status", "household/jobs/gb_sort_the_bookshelf/verdict", "household/jobs/gb_fold_the_towel_basket", "household/jobs/gb_sweep_the_garage/grabKey", "household/jobs/gb_water_the_porch_plants", "household/jobs/gb_dust_the_blinds/status", "household/jobs/gb_dust_the_blinds/verdict", "household/meta/grabs"].sort();
const typeIn = (o) => Object.keys(o).map(k => "document.getElementById('hh-add-" + k + "').value=" + J(o[k]) + ";").join(" ");
const noHH = t => { const o = clone(t); delete o.household; return J(o); };

(async () => {
console.log("\n── 1 · the switch screen ──");
{ const S = await mk("saved"), { w, A, B } = S;
  F.act(B, "gbInstant", "kid_a", "Wipe the island"); F.act(B, "gbClaim", "kid_b", "Sweep the garage"); await w.flush();
  const p = plan(A);
  ok("every difference is listed, each with its own choice: stars, a different name, a zone, days, a retired row, two only in the kids' list, one only in the table",
    J(p.diffs) === J(["f1_pts", "f2_label", "f2_zone", "f3_cad", "k4", "a5", "a7", "tgb_dust_the_blinds"]), p.diffs);
  ok("a table row that is retired and not in the kids' list is not a difference (it stays retired)", !p.diffs.some(k => /old_toy_bin/.test(k)));
  ok("the switch would write exactly these paths, all under household/", J(Object.keys(p.upd).sort()) === J(UPD), Object.keys(p.upd).sort());
  ok("…the starting choices keep every kid's Up for Grabs exactly the same (the real pool code, now and after)", p.ok && p.same.every(Boolean) && J(p.now.kid.map(k => k.pool)) === J(p.aft.kid.map(k => k.pool)));
  ok("…and the whole list (every chore, its stars with the zone bonus, its days, its order, who holds it) is the same now and after",
    J(p.now.list.map(v => [v.i, v.e, v.l, v.pay, v.cad, v.lau, v.by, v.done])) === J(p.aft.list.map(v => [v.i, v.e, v.l, v.pay, v.cad, v.lau, v.by, v.done])), [p.now.list.length, p.aft.list.length]);
  ok("(sanity) the list has all 8 chores in the kids' order, with the zone bonus on the toilet (Wednesday) and the two grabs of today", p.now.list.length === 8 && p.now.list[2].pay === 45 && p.now.list[1].by === "kid_a" && p.now.list[1].done && p.now.list[6].by === "kid_b" && !p.now.list[6].done);
  const m = w.mark(); A.run("hgOpen()"); const sh = text(A.run("hgSheetHTML()")); A.run("hhRender(); renderAll()"); await w.flush();
  ok("the screen says each difference in plain words", ["Wipe the island — stars: the kids have 25 ⭐, the table has 20 ⭐", "name: the kids see “Scrub the hall toilet”, the table says “Scrub the toilet”", "zone: the kids have 🚽 Bathrooms, the table has none", "days: the kids have Sat, the table has every day", "Sort the bookshelf is retired in the table, but the kids still see it", "Fold the towel basket is only in the kids’ list", "Water the porch plants is only in the kids’ list", "Dust the blinds is only in the table — the kids have never seen it"].every(s => sh.indexOf(s) >= 0), sh.slice(0, 1500));
  ok("…with the choices (Keep the kids’ … / Use the table’s · Keep it for the kids / Leave it out · Add it to the table · Leave it out (retire it) / Add it to Up for Grabs)", ["Keep the kids’ stars", "Use the table’s", "Keep it for the kids", "Add it to the table", "Leave it out (retire it)", "Add it to Up for Grabs"].every(s => sh.indexOf(s) >= 0));
  ok("…the list now and after, who holds what, each kid's ✓ and the counts, and when it starts", ["✓ Every chore, its stars, its days and its order stay the same.", "✓ Kid A did it", "🔒 Kid B has it", "Kid A : now", "6 rows get a lasting claim number", "4 changes to the kids’ version", "2 new rows", "1 retired", "Right away"].every(s => sh.indexOf(s) >= 0) && (sh.match(/exactly the same screen/g) || []).length === 4, sh.slice(sh.indexOf("now and after"), sh.indexOf("now and after") + 1200));
  ok("drawing the screen and the page writes nothing", w.since(m).length === 0, writes(w, m));
  A.run("hgPick('a5','out')"); const sh2 = text(A.run("hgSheetHTML()"));
  ok("a choice is shown at once: leaving out the towel basket shows it gone on the after side and for every kid", /1 line changes/.test(sh2) && (sh2.match(/loses Fold the towel basket \+10/g) || []).length === 4, sh2.slice(sh2.indexOf("Each kid"), sh2.indexOf("Each kid") + 400));
  A.run("hgClose()");
}

console.log("\n── 2 · 🙌 Switch ──");
for (const kind of ["saved", "builtin"]) {
  const { w, A, B } = await mk(kind);
  F.act(B, "gbInstant", "kid_a", "Wipe the island"); F.act(B, "gbClaim", "kid_b", "Sweep the garage"); await w.flush();
  const K0 = F.kidHTML(B), M0 = F.kidHTML(A, true), T0 = clone(w.db.tree.root), p = plan(A), m = w.mark();
  A.run("hgOpen(); hgSwitch()"); await w.flush();
  const wr = w.since(m);
  ok(kind + " · ONE update, of exactly the paths the screen worked out", wr.length === 1 && wr[0].op === "update" && wr[0].path === "" && J(wr[0].keys.slice().sort()) === J(UPD), writes(w, m));
  const T1 = w.db.tree.root;
  ok(kind + " · …with the values the screen worked out (but the record's time)", Object.keys(p.upd).every(k => k === "household/meta/grabs" || J(w.get(k)) === J(p.upd[k])), Object.keys(p.upd).filter(k => k !== "household/meta/grabs" && J(w.get(k)) !== J(p.upd[k])));
  ok(kind + " · nothing outside household/ changed: no grab record, no star, no log, no config/grabs, no list", noHH(T1) === noHH(T0));
  ok(kind + " · every kid's own Up for Grabs is byte for byte what it was", J(F.kidHTML(B)) === J(K0));
  ok(kind + " · …and Mom's view of each kid (release, assign)", J(F.kidHTML(A, true)) === J(M0));
  const jb = w.get("household/jobs");
  ok(kind + " · the rows: each carried row keeps its old number as its claim key; the kids' stars, name, zone and days are on the rows; the retired one is back",
    jb.gb_wash_the_porch_window.grabKey === 0 && jb.gb_wipe_the_island.pts === 25 && jb.gb_scrub_the_hall_toilet_old.label === "Scrub the hall toilet" && jb.gb_scrub_the_hall_toilet_old.zone === "bath" && jb.gb_scrub_the_hall_toilet_old.grabKey === 2 && jb.gb_clean_under_the_couch.cad === "wk:5" && jb.gb_sort_the_bookshelf.status === "active" && jb.gb_sort_the_bookshelf.grabKey === 4 && jb.gb_sweep_the_garage.grabKey === 6);
  ok(kind + " · two new rows for the chores only the kids had (laundry link kept), the table-only row retired, the old retired one untouched",
    jb.gb_fold_the_towel_basket.grabKey === 5 && jb.gb_fold_the_towel_basket.laundry === "fold" && jb.gb_fold_the_towel_basket.who === "grab" && jb.gb_water_the_porch_plants.cad === "wk:1,4" && jb.gb_water_the_porch_plants.grabKey === 7 && jb.gb_dust_the_blinds.status === "retired" && J(jb.gb_old_toy_bin) === J(T0.household.jobs.gb_old_toy_bin));
  const rec = w.get("household/meta/grabs");
  ok(kind + " · the record: who, when, where the list came from, and what Undo puts back", rec && rec.by === "mom" && rec.on > 0 && rec.src === (kind === "saved" ? "config" : "default") && rec.n === 8 && Object.keys(rec.made).sort().join() === "gb_fold_the_towel_basket,gb_water_the_porch_plants" && JSON.parse(rec.was.gb_wipe_the_island).pts === 20, rec);
  ok(kind + " · B (a kid's device) now reads the table: the pool is the rows", R(B, "return gbSwOn()&&gbRows().map(function(x){ return x.id; }).join();") === "gb_wash_the_porch_window,gb_wipe_the_island,gb_scrub_the_hall_toilet_old,gb_clean_under_the_couch,gb_sort_the_bookshelf,gb_fold_the_towel_basket,gb_sweep_the_garage,gb_water_the_porch_plants");
  { const m2 = w.mark(); A.run("hgOpen(); hgSwitch()"); await w.flush(); ok(kind + " · a second switch is refused and writes nothing", w.since(m2).length === 0 && plan(A).why.some(s => /already/.test(s))); }
}
{ const S = await mk("saved"); S.A.run("HA_LS.setItem('ha_dryrun','1')"); const m = S.w.mark(); S.A.run("hgOpen(); hgSwitch()"); await S.w.flush();
  ok("?dryrun=1: Switch writes nothing", S.w.since(m).length === 0 && !S.w.get("household/meta/grabs"));
  const T = await mk("saved"); T.A.run("haMomOff()"); const m2 = T.w.mark(); T.A.run("hgOpen(); hgSwitch(); hgSheet={ch:{}}; hgSwitch()"); await T.w.flush();
  ok("not Mom: no screen, no write", T.w.since(m2).length === 0 && T.A.run("hgSheetHTML()") === "");
  const U = await mk("saved", "preview", { extra: h => { delete h.meta.takeover; } }); const m3 = U.w.mark(); U.A.run("hgOpen(); hgSwitch()"); await U.w.flush();
  ok("Take over off: refused (the screen says why), nothing written", U.w.since(m3).length === 0 && /Take over first/.test(text(U.A.run("hgSheetHTML()"))) && !plan(U.A).ok); }
for (const ch of [{ f1_pts: "table", f2_label: "table", a5: "out", tgb_dust_the_blinds: "add", k4: "out" }, { f3_cad: "table", f2_zone: "table", a7: "out" }]) {
  const { w, A, B } = await mk("saved"); F.act(B, "gbClaim", "kid_c", "Fold the towel basket"); await w.flush();
  const p = plan(A, ch); A.run("hgOpen(); hgSheet.ch=" + J(ch) + "; hgSwitch()"); await w.flush();
  const now = R(A, "return hgView();"), pk = R(B, "return " + J(F.KIDS) + ".map(function(k){ return _grabsHTML(k,false); });");
  ok("her choices " + J(ch) + ": what the kids see after = the screen's after (the list, each kid's pool, each kid's screen)", J(now.list) === J(p.aft.list) && J(now.kid.map(k => k.pool)) === J(p.aft.kid.map(k => k.pool)) && J(pk) === J(p.aft.kid.map(k => k.html)), [now.list.map(v => v.l), p.aft.list.map(v => v.l)]);
  if (ch.a5) ok("…a chore left out while a kid holds it: gone for everyone, and that kid is free to grab another", !F.poolNames(B, "kid_c").includes("Fold the towel basket") && R(B, "return gbHasActive('kid_c');") === false);
  if (ch.f1_pts) ok("…the table's stars and name are what the kids see and earn", R(B, "const x=gbRows().find(function(x){ return x.id==='gb_wipe_the_island'; }); return [gbPayout(x.i), gbAt(x.i).label, gbAt(2).label];").join() === "20,Wipe the island,Scrub the toilet");
}

console.log("\n── 3 · ↩ Undo ──");
for (const mode of ["preview", "on"]) {
  const { w, A, B } = await mk("saved", mode); F.act(B, "gbInstant", "kid_a", "Wipe the island"); await w.flush();
  const T0 = J(w.db.tree.root), K0 = F.kidHTML(B); A.run("hgOpen(); hgSwitch()"); await w.flush();
  F.act(B, "gbClaim", "kid_b", "Sweep the garage"); await w.flush();   // a kid's grab after the switch does not block Undo
  ok(mode + " · Undo is offered on the card after the switch", A.run("hgUndoWhy()") === "" && /Undo the switch/.test(A.run("hgWhoHTML('gb_wipe_the_island')")));
  const T1 = clone(w.db.tree.root), m = w.mark(); A.run("hgUndo()"); await w.flush(); const wr = w.since(m);
  ok(mode + " · ONE update", wr.length === 1 && wr[0].op === "update", writes(w, m));
  const T2 = clone(w.db.tree.root), t0 = JSON.parse(T0);
  ok(mode + " · household/ is byte for byte what it was before the switch", J(T2.household) === J(t0.household));
  ok(mode + " · the only other change since the switch is the kid's own grab, which the old list still shows on the same chore", noHH(T2) === noHH(T1) && F.poolNames(B, "kid_b").includes("Sweep the garage") && R(B, "return (gbCur(6)||{}).by;") === "kid_b");
  const K1 = F.kidHTML(B); F.act(B, "gbLetGo", "kid_b", "Sweep the garage"); await w.flush();
  ok(mode + " · after letting that grab go, every kid's Up for Grabs is byte for byte what it was before the switch, and the database too", J(F.kidHTML(B)) === J(K0) && J(w.db.tree.root) === T0, K1 === K0);
}
{ const { w, A, B } = await mk("saved"); A.run("hgOpen(); hgSwitch()"); await w.flush(); A.run("hhEditSet('gb_wipe_the_island','pts','30')"); await w.flush();
  const m = w.mark(); A.run("hgUndo()"); await w.flush();
  ok("Undo is refused once a chore was changed after the switch (the card says why), and writes nothing", w.since(m).length === 0 && /changed after the switch/.test(A.run("hgWhoHTML('gb_wipe_the_island')")) && !/Undo the switch/.test(A.run("hgWhoHTML('gb_wipe_the_island')")));
  A.run("hhEditSet('gb_wipe_the_island','pts','25')"); ok("…putting it back as it was offers Undo again", A.run("hgUndoWhy()") === "");
  A.run("hhSet('gb_fold_the_towel_basket','verdict','retire')"); ok("…retiring a chore blocks it", /changed after/.test(A.run("hgUndoWhy()")));
  A.run("hhSet('gb_fold_the_towel_basket','verdict','keep')"); A.run("hcAdd(); hhAddSet('who','grab'); " + typeIn({ label: "Shine the taps" }) + " hcAddSave()"); ok("…and so does a chore added on the card", /changed after/.test(A.run("hgUndoWhy()")));
  A.run("haMomOff()"); const m2 = w.mark(); A.run("hgUndo()"); await w.flush(); ok("not Mom: Undo writes nothing", w.since(m2).length === 0); }

console.log("\n── 4 · who can grab it ──");
{ const { w, A, B } = await mk("saved");
  const card0 = A.run("hcOpen('gb_wipe_the_island'); hcCardHTML()"), rules0 = A.run("hcRulesHTML('kitchen',['gb_wipe_the_island','c_a_dishes'])");
  ok("before the switch: no who-can chips on the card or in ⚙ Rules for an Up for Grabs chore — the card says the kids don't see it and offers the switch",
    !/hgCan\(/.test(card0) && !/hgCan\(/.test(rules0) && /The kids don’t see these rows/.test(card0) && /hgOpen\(\)/.test(card0) && /the list saved in the Star Store \(8\)/.test(text(card0)));
  ok("…and nothing of who-can is read: a stored list changes no kid's pool and not the cleaning day's Can-do", (() => { A.run("hhJobs().gb_wipe_the_island.can=['kid_a']"); B.run("hhJobs().gb_wipe_the_island&&(hhJobs().gb_wipe_the_island.can=['kid_a'])"); const r = F.poolNames(B, "kid_b").includes("Wipe the island") && R(A, "return hhPlanCanDo(hhJobs().gb_wipe_the_island);").length === 4; A.run("delete hhJobs().gb_wipe_the_island.can"); B.run("delete hhJobs().gb_wipe_the_island.can"); return r; })());
  A.run("hgOpen(); hgSwitch()"); await w.flush();
  const card = A.run("hcOpen('gb_wipe_the_island'); hcCardHTML()"), rules = A.run("hcRulesHTML('kitchen',['gb_wipe_the_island'])");
  ok("the card: “Who can grab it” with each kid as a chip, all ticked, “everyone (nobody chosen yet)”", /Who can grab it/.test(card) && F.KIDS.every(k => card.indexOf("hgCan('gb_wipe_the_island','" + k + "')") >= 0) && (card.match(/ce-chip sel"[^>]*onclick="hgCan/g) || []).length === 4 && /everyone \(nobody chosen yet\)/.test(card));
  ok("⚙ Rules: the same chips, compact (same setter), no “↑ same”", F.KIDS.every(k => rules.indexOf("hgCan('gb_wipe_the_island','" + k + "')") >= 0) && !/hcCanSame\('gb_wipe/.test(rules));
  ok("the card says the kids see it, and offers Undo", /The kids see this chore in Up for Grabs/.test(card) && /Undo the switch/.test(card));
  let m = w.mark(); A.run("hgCan('gb_wipe_the_island','kid_d')"); await w.flush();
  ok("unticking a kid = ONE path: household/jobs/<id>/can = the other kids", J(writes(w, m)) === J(["set household/jobs/gb_wipe_the_island/can "]) && J(w.get("household/jobs/gb_wipe_the_island/can")) === J(["kid_a", "kid_b", "kid_c"]));
  ok("…kid_d no longer sees it; the others still do", !F.poolNames(B, "kid_d").includes("Wipe the island") && ["kid_a", "kid_b", "kid_c"].every(k => F.poolNames(B, k).includes("Wipe the island")));
  const mv = A.run("_grabsHTML('kid_a',true)"), i1 = mv.indexOf("Wipe the island"), as = mv.slice(i1, mv.indexOf("</div></div>", i1));
  ok("Mom's view: assign offers only the kids who can grab it", /gbClaim\('kid_a',1\)/.test(as) && /gbClaim\('kid_c',1\)/.test(as) && !/gbClaim\('kid_d',1\)/.test(as), as.slice(0, 400));
  ok("…and Mom looking at kid_d's Up for Grabs sees what kid_d may grab", !A.run("_grabsHTML('kid_d',true)").includes("Wipe the island"));
  ok("the cleaning day offers it only to those kids too", J(R(A, "return hhPlanCanDo(hhJobs().gb_wipe_the_island);")) === J(["kid_a", "kid_b", "kid_c"]));
  F.act(B, "gbClaim", "kid_a", "Wipe the island"); await w.flush();
  ok("a sibling's pull: kid_a grabs it → off kid_b's and kid_c's lists; Mom sees it held with release", !F.poolNames(B, "kid_b").includes("Wipe the island") && !F.poolNames(B, "kid_c").includes("Wipe the island") && /release/.test(A.run("_grabsHTML('kid_b',true)").slice(A.run("_grabsHTML('kid_b',true)").indexOf("Wipe the island")) ));
  A.run("hgCan('gb_wipe_the_island','kid_a')"); await w.flush();
  ok("unticking a kid who is holding it: they still see it to mark it done or let it go", F.poolNames(B, "kid_a").includes("Wipe the island") && /gbMarkDone\('kid_a',1\)/.test(B.run("_grabsHTML('kid_a',false)")));
  ok("…and the card says who can now", J(w.get("household/jobs/gb_wipe_the_island/can")) === J(["kid_b", "kid_c"]));
  F.act(B, "gbLetGo", "kid_a", "Wipe the island"); await w.flush(); ok("…once let go, it leaves that kid's list", !F.poolNames(B, "kid_a").includes("Wipe the island"));
  A.run("hgCan('gb_wipe_the_island','kid_b')"); m = w.mark(); A.run("hgCan('gb_wipe_the_island','kid_c')"); await w.flush();
  ok("the last kid cannot be unticked (nothing written; “To stop offering it, Retire it”)", w.since(m).length === 0 && J(w.get("household/jobs/gb_wipe_the_island/can")) === J(["kid_c"]));
  ["kid_a", "kid_b"].forEach(k => A.run("hgCan('gb_wipe_the_island','" + k + "')")); m = w.mark(); A.run("hgCan('gb_wipe_the_island','kid_d')"); await w.flush();
  ok("ticking every kid again stores nothing (= everyone, as before)", J(writes(w, m)) === J(["set household/jobs/gb_wipe_the_island/can "]) && w.get("household/jobs/gb_wipe_the_island/can") === null && F.KIDS.every(k => F.poolNames(B, k).includes("Wipe the island")));
  A.run("HA_LS.setItem('ha_dryrun','1')"); m = w.mark(); A.run("hgCan('gb_wipe_the_island','kid_d')"); await w.flush(); A.run("HA_LS.removeItem('ha_dryrun')");
  ok("?dryrun=1: a who-can tap writes nothing", w.since(m).length === 0);
  A.run("haMomOff()"); m = w.mark(); A.run("hgCan('gb_sweep_the_garage','kid_d')"); await w.flush(); A.run("haMomOn()");
  ok("not Mom: nothing", w.since(m).length === 0);
  A.run("hhJobs().gb_sweep_the_garage.can=['mom']; householdOnValue(householdData)");
  const chk = R(A, "return hcChecks('__none',['gb_sweep_the_garage','gb_wash_the_porch_window']);");
  ok("🔍 Checks: an Up for Grabs chore no kid can see (a stored list with no kid in it) shows as a problem; others don't", chk.filter(c => c.k === "grab0").map(c => c.id).join() === "gb_sweep_the_garage", chk);
  ok("…and indeed no kid's list has it", (() => { B.run("hhJobs().gb_sweep_the_garage.can=['mom']"); const r = F.KIDS.every(k => !F.poolNames(B, k).includes("Sweep the garage")); B.run("delete hhJobs().gb_sweep_the_garage.can"); return r; })());
  ok("the Add card offers “Up for Grabs” once switched, with stars and who can grab it", (() => { const h = A.run("hcAdd(); hhAddSet('who','grab'); hcCardHTML()"); return /hhAddSet\('who','grab'\)/.test(h) && /hh-add-pts/.test(h) && /hgAddCan\('kid_a'\)/.test(h) && !/hhAddSet\('kind','once'\)|hhAddSet\('kind','project'\)/.test(h); })());
}

console.log("\n── 5 · the card is the one editor ──");
{ const { w, A, B } = await mk("saved"); A.run("hgOpen(); hgSwitch()"); await w.flush();
  const name = () => F.poolNames(B, "kid_a");
  A.run("hhEditSet('gb_wash_the_porch_window','label','Wash the porch windows')"); await w.flush();
  ok("a new name on the card is the kids' name", name()[0] === "Wash the porch windows" && /Wash the porch windows/.test(B.run("_grabsHTML('kid_a',false)")));
  A.run("hhEditSet('gb_wash_the_porch_window','pts','18')"); await w.flush();
  ok("new stars on the card are what the kids see and earn", /\+18 ⭐/.test(B.run("_grabsHTML('kid_a',false)")) && R(B, "return gbPayout(0);") === 18);
  const bank0 = R(B, "return bankBalance('kid_c');"); F.act(B, "gbInstant", "kid_c", "Wash the porch windows"); await w.flush();
  ok("…and a kid doing it is paid those stars, logged under the new name", R(B, "return bankBalance('kid_c');") - bank0 === 18 && J(w.get("routineLog")).indexOf("Wash the porch windows") >= 0);
  A.run("hhEditCadMode_set('gb_wipe_the_island','wk'); hhEditDay('gb_wipe_the_island',4); hhEditDay('gb_wipe_the_island',2)"); await w.flush();   // Wed only → Fri only (today Wed)
  ok("new days on the card: the island is due from Friday, so not today", J(w.get("household/jobs/gb_wipe_the_island/cad")) === J("wk:4") && !name().includes("Wipe the island"), w.get("household/jobs/gb_wipe_the_island/cad"));
  const opts = text(A.run("hcOpen('gb_wipe_the_island'); hcCardHTML()")).split("How often")[1].split("Days")[0];
  ok("…the card offers only what the kids' Up for Grabs understands (Daily · On these days · Every 2 weeks) and no start date", /Daily/.test(opts) && /On these days/.test(opts) && /Every 2 weeks/.test(opts) && !/As needed|One time|Every 4 weeks/.test(opts) && !/Starts/.test(text(A.run("hcCardHTML()"))), opts);
  A.run("hhSet('gb_scrub_the_hall_toilet_old','verdict','retire')"); await w.flush();
  ok("🚫 Retire on the card: gone from every kid's list", F.KIDS.every(k => !F.poolNames(B, k).includes("Scrub the hall toilet")));
  A.run("hhSet('gb_scrub_the_hall_toilet_old','verdict','keep')"); await w.flush();
  ok("↩ Bring back: in its old place again", name().indexOf("Scrub the hall toilet") === 0, name());
  let m = w.mark(); A.run("hcAdd(); hhAddSet('who','grab'); hgAddCan('kid_d'); " + typeIn({ label: "Shine the taps", emoji: "✨", pts: "12" }) + " hcAddSave()"); await w.flush();
  const wr = writes(w, m), nid = (wr[0] || "").split(" ")[1].split("/")[2], row = w.get("household/jobs/" + nid);
  ok("＋ Add with “Up for Grabs”: ONE targeted write, a new row (owner Up for Grabs, its stars, who can)", wr.length === 1 && /^set household\/jobs\/hh/.test(wr[0]) && row.who === "grab" && row.pts === 12 && J(row.can) === J(["kid_a", "kid_b", "kid_c"]) && row.grabKey === undefined, [wr, row]);
  ok("…the kids who can see it at the end of their list (its key is its id), kid_d doesn't", name().slice(-1)[0] === "Shine the taps" && !F.poolNames(B, "kid_d").includes("Shine the taps") && new RegExp("gbInstant\\('kid_a','" + nid + "'\\)").test(B.run("_grabsHTML('kid_a',false)")));
  F.act(B, "gbClaim", "kid_b", "Shine the taps"); await w.flush(); F.act(B, "gbMarkDone", "kid_b", "Shine the taps"); await w.flush();
  ok("…grab for later and mark done work on it: the record is keyed by the chore's id, the cooldown too, 12 ⭐ paid", (w.get("grabClaims/" + R(B, "return activeWk();") + "_" + nid) || {}).done === true && (w.get("grabClaims/last_" + nid) || {}).by === "kid_b");
}

console.log("\n── 6 · a grab never moves to another chore ──");
{ const { w, A, B } = await mk("saved"); A.run("hgOpen(); hgSwitch()"); await w.flush();
  F.act(B, "gbClaim", "kid_b", "Sweep the garage"); F.act(B, "gbInstant", "kid_a", "Wipe the island"); await w.flush();
  const held = () => R(B, "return gbRows().filter(function(x){ const s=gbCur(x.i); return s&&s.by; }).map(function(x){ const s=gbCur(x.i); return x.g.label+'|'+s.by+'|'+!!s.done; });").sort().join();
  const h0 = held(), wk = R(B, "return activeWk();"), C0 = J(w.get("grabClaims"));
  A.run("hcAdd(); hhAddSet('who','grab'); " + typeIn({ label: "Shine the taps" }) + " hcAddSave()"); await w.flush();
  ok("adding a chore: every grab is on the same chore", held() === h0, held());
  A.run("hhSet('gb_wash_the_porch_window','verdict','retire')"); await w.flush();
  ok("retiring the first chore: every grab is on the same chore (nothing slides up)", held() === h0 && F.poolNames(B, "kid_c")[0] === "Scrub the hall toilet", held());
  A.run("Object.keys(hhJobs()).forEach(function(id,n){ const j=hhJobs()[id]; if(j.who==='grab'){ j.order=100-n; db.ref('household/jobs/'+id+'/order').set(j.order); } })"); await w.flush();
  ok("re-ordering the rows: every grab is on the same chore, and the kids' order is unchanged", held() === h0 && F.poolNames(B, "kid_c").join() === "Scrub the hall toilet,Sort the bookshelf,Fold the towel basket,Water the porch plants,Shine the taps", F.poolNames(B, "kid_c"));
  ok("…and the grab records were not touched by any of it", J(w.get("grabClaims")) === C0);
  F.act(B, "gbMarkDone", "kid_b", "Sweep the garage"); await w.flush();
  ok("kid_b marks the held one done: the same record (its old number), not another", (w.get("grabClaims/" + wk + "_6") || {}).done === true && Object.keys(w.get("grabClaims")).filter(k => k.indexOf(wk) === 0).sort().join() === [wk + "_1", wk + "_6"].sort().join());
  ok("the old pool's position records are the switched pool's records for carried chores (a device that has not heard of the switch writes the same one)", R(B, "return [gbKeyOf('gb_sweep_the_garage',hhJobs().gb_sweep_the_garage), gbList()[6].label];").join() === "6,Sweep the garage");
}

console.log("\n── 7 · the old editors ──");
{ const { w, A, B } = await mk("saved");
  let m = w.mark(); A.run("gbSet(1,'pts','30')"); await w.flush();
  ok("not switched: the Star Store's grab editor still writes config/grabs as before", J(writes(w, m)) === J(["set config/grabs "]) && w.get("config/grabs/1/pts") === 30);
  A.run("gbSet(1,'pts','25')"); await w.flush();
  ok("not switched: the Star Store editor and the Grabs tab draw as on main (no pointer)", !/lives on Household now/.test(A.run("storeEditPinOk=true; _storeEditorHTML()")) && (() => { const el = { innerHTML: "" }; A.set("__el", el); A.run("cpTab='grabs'; cpSlot='grabs'; renderChorePlan(__el)"); return !/lives on Household now/.test(el.innerHTML) && /gbCadToggle|cpSetField|cpToggle/.test(el.innerHTML); })());
  ok("not switched: 📥 Bring in still lists the pool's chores", R(A, "return hhLiveRows().filter(function(r){ return r.who==='grab'; }).length;") === 8);
  A.run("hgOpen(); hgSwitch()"); await w.flush();
  m = w.mark(); A.run("gbSet(1,'pts','99'); gbSet(1,'label','X'); gbAdd(); gbDel(0); gbCadToggle(0,2); cpSlot='grabs'; cpSetZone(2,'kitchen'); cpSetField(1,'pts','5'); cpAddChore()"); await w.flush();
  ok("switched: every old grab setter writes nothing (Star Store, Chores & Stars, zones)", w.since(m).length === 0, writes(w, m));
  const se = text(A.run("storeEditPinOk=true; _storeEditorHTML()")), el = { innerHTML: "" }; A.set("__el", el); A.run("cpTab='grabs'; cpSlot='grabs'; renderChorePlan(__el)");
  ok("switched: the Star Store editor's 🙌 part and the Grabs tab say it lives on Household now, with a way there, and draw no grab inputs", /Up for Grabs lives on Household now/.test(se) && /Up for Grabs lives on Household now/.test(text(el.innerHTML)) && /mpGoto\('house'\)/.test(el.innerHTML) && !/gbSet\(|gbDel\(|gbCadToggle\(/.test(A.run("_storeEditorHTML()")) && !/gbCadToggle|cpSetZone/.test(el.innerHTML));
  ok("switched: 📥 Bring in adds no grab rows (the table is the list)", R(A, "return hhLiveRows().filter(function(r){ return r.who==='grab'; }).length;") === 0);
  ok("switched: config/grabs is still there, as it was", J(w.get("config/grabs")) === J(F.POOL));
  const cand = () => R(A, "return hhPlanCandidates('2026-11-18').map(function(c){ return c.id; });"), c0 = cand().includes("gb_sweep_the_garage");
  F.act(B, "gbInstant", "kid_a", "Sweep the garage"); await w.flush();
  ok("switched: the cleaning day finds a grab by its chore (a candidate; done → not a candidate)", c0 && !cand().includes("gb_sweep_the_garage"), [c0, cand()]);
}
{ const { w, A, B } = await mk("none", "preview", { rows: false });
  ok("a family with no pool and no rows: the kids' empty line and Mom's add button are as before", /No jobs yet/.test(B.run("_grabsHTML('kid_a',false)")) && /gbAdd\(\)/.test(A.run("_grabsHTML('kid_a',true)"))); }

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
