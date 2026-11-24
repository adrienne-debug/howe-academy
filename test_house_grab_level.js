/*
 * test_house_grab_level.js — HOUSEGRABLV (index.html) + HOUSEGRABLV_UI (house.js): Up for Grabs follows the Cleaning level (design
 * DESIGN_household_rooms_2026-11-15 §13, her "i think so" 2026-11-18). After the 🙌 switch a cleaning or pickup grab at Level L opens to
 * a kid only when L ≤ THAT kid's level (hhLevelCurFor(kid)), on top of "who can grab it"; health and animal never wait; no level = 1.
 * The ×2 offers (plan ON) follow the same rule. The WHOLE app per device (test_fixtures/house_grabs_world.js, house_overflow_world.js:
 * the made-up family kid_a … kid_d, a made-up pool and table). No real family's names or data.
 *   1 the rule per kid and per level: the family level, a kid's own level above and below it; cleaning and pickup held back, health
 *     and animal not; no level = Level 1; whose level (the kid looking — not the owner "grab", not Mom's or Dad's)
 *   2 it opens up by itself: a kid's level raised, the family's raised, a chore's level lowered on its card — no other tap
 *   3 a held grab is kept (mark done, let go) when it is now above the kid's level; "one at a time" still counts it
 *   4 who can grab it and the level together
 *   5 Mom's view of a kid and "assign"
 *   6 the card's words, ⚙ Rules, 🔍 Checks (beside "nobody is ticked"); nothing of it before the switch
 *   7 the guards: a kid below the level taps from a stale screen (I did it now, Grab for later, Mom's assign) → refused, unpaid,
 *     nothing written; a kid at the level still can
 *   8 the ×2 offers (plan ON): who sees them, Mom's view and assign, Mom's chips and the preview's, the guards on hdGrabDone /
 *     hdGrabHold, it opens up by itself, a held one kept; the stored offer itself is not changed
 *   9 mutation checks: each guard, the pool's and the ×2 filter, whose level, the held grab — removed or bent in a copy of index.html,
 *     the check that protects it fails
 *  10 the pool NOT switched (saved, built-in, none) with levels set everywhere: 14 days × preview / ON, every kid's Up for Grabs, Mom's
 *     view, the card and Checks, every write and the whole database = the app before this change's (37e81600)
 *  11 switched, every chore at Level 1 (her data): 60 days × off / preview / ON with grabs and ×2 grabs every day — every kid's Up for
 *     Grabs, Mom's view, every write and the whole database = the app before this change's (37e81600)
 *   BASE_HTML=/path/to/before/index.html BASE_HOUSE=/path/to/before/house.js node test_house_grab_level.js   (default: `git show 37e81600:…`, the
 *   commit just before this change — pinned, so 10 and 11 mean the same before and after it is on main; no such commit → 10 and 11 are skipped)
 *   HOUSE_INDEX=/path/to/other/index.html node test_house_grab_level.js   (a mutation check from outside)
 */
"use strict";
const fs = require("fs"), os = require("os"), path = require("path"), cp = require("child_process");
const F = require(path.join(__dirname, "test_fixtures", "house_grabs_world.js")), O = require(path.join(__dirname, "test_fixtures", "house_overflow_world.js"));
const HJS = fs.readFileSync(path.join(__dirname, "house.js"), "utf8"), IDX = process.env.HOUSE_INDEX || undefined;
const SRC_IDX = fs.readFileSync(IDX || path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 700) + ")" : "")); } };
const BEFORE = "37e81600", WAS = "the app before the level rule's";   // the commit before HOUSEGRABLV (main d040aecb has it)
const show = f => { try { return cp.execSync("git show " + BEFORE + ":" + f, { cwd: __dirname, maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] }); } catch (e) { return null; } };
let BASE = process.env.BASE_HTML, BHJS = process.env.BASE_HOUSE ? fs.readFileSync(process.env.BASE_HOUSE, "utf8") : null;
if (!BASE) { const b = show("index.html"); if (b) { BASE = path.join(os.tmpdir(), "house_grablv_base_" + process.pid + ".html"); fs.writeFileSync(BASE, b); } }
if (!BHJS) { const b = show("house.js"); if (b) BHJS = b.toString("utf8"); }
console.log("(base: " + (BASE && BHJS ? BASE : "none — git show " + BEFORE + " failed; parts 10 and 11 are skipped") + ")");
const J = o => JSON.stringify(o), clone = o => o == null ? o : JSON.parse(J(o)), KIDS = F.KIDS;
const R = (d, expr) => JSON.parse(d.run("JSON.stringify((function(){ " + expr + " })())"));
const text = h => String(h).replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/\s+/g, " ");
const writes = (w, m) => w.since(m).map(l => l.op + " " + l.path + " " + (l.keys || []).slice().sort().join(","));
const MON = "2026-11-16";
// The switched pool by old number (the made-up pool of house_grabs_world): 0 porch window · 1 island · 2 hall toilet · 3 couch (Sat) ·
// 4 bookshelf · 5 towel basket · 6 garage · 7 porch plants. On Wednesday 11/18 all but the couch are due.
const ID = ["gb_wash_the_porch_window", "gb_wipe_the_island", "gb_scrub_the_hall_toilet_old", "gb_clean_under_the_couch", "gb_sort_the_bookshelf", "gb_fold_the_towel_basket", "gb_sweep_the_garage", "gb_water_the_porch_plants"];
const mk = async (o) => { o = o || {}; const w = await F.world(o.kind || "saved", o.mode || "preview", { index: o.index || IDX, household: o.household }); const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB");
  A.run(o.hjs || HJS); await w.flush(); await w.at(2026, 11, 18, 14, 0); if (o.sw !== false) { A.run("hgOpen(); hgSwitch()"); await w.flush(); } A.run("try{ renderAll(); hhRender(); }catch(e){}"); await w.flush(); return { w, A, B }; };
const pool = (d, kid, mom) => R(d, "return gbPool(" + J(kid) + "," + (mom ? "true" : "false") + ").map(function(x){ return x.i; });");
const pools = d => KIDS.map(k => pool(d, k));
const bal = (d, kid) => R(d, "return bankBalance(" + J(kid) + ");");
const set = async (S, js) => { S.A.run(js); await S.w.flush(); };
// The levels used in 1–7, each set by Mom's own taps (the card's Area and Level, the dials): island cleaning L2 · porch window pickup L2 ·
// towel basket cleaning L3 · hall toilet ANIMALS L3 · garage HEALTH L2 · bookshelf, porch plants, couch: no level (= 1).
// The family is on Level 1; kid_a's own dial 2, kid_b's 3, kid_c none (follows the family), kid_d's own 1.
const SCENE = "hhEditSet('gb_wipe_the_island','level',2); hhEditSet('gb_wash_the_porch_window','area','pickup'); hhEditSet('gb_wash_the_porch_window','level',2);"
  + " hhEditSet('gb_fold_the_towel_basket','level',3); hhEditSet('gb_scrub_the_hall_toilet_old','area','animals'); hhEditSet('gb_scrub_the_hall_toilet_old','level',3);"
  + " hhEditSet('gb_sweep_the_garage','area','health'); hhEditSet('gb_sweep_the_garage','level',2); hhLevelSetFor('kid_a',2); hhLevelSetFor('kid_b',3); hhLevelSetFor('kid_d',1);";
const scene = async (o) => { const S = await mk(o); await set(S, SCENE); return S; };
// copies of index.html with one thing removed or bent (part 9)
const mut = (name, a, b) => { const n = SRC_IDX.split(a).length - 1; if (n !== 1) { ok("(mutation " + name + ": its text occurs exactly once in index.html)", false, n); return null; } const p = path.join(os.tmpdir(), "house_grablv_" + name + "_" + process.pid + ".html"); fs.writeFileSync(p, SRC_IDX.replace(a, b)); MUTS.push(p); return p; };
const MUTS = [];

(async () => {
// ── 1 ──
console.log("\n── 1 · the rule, per kid and per level ──");
{ const S = await mk(), { w, A, B } = S;
  ok("(switched, no level stored on any Up for Grabs row: every kid sees all 7 due chores, as before)", J(pools(B)) === J([[0, 1, 2, 4, 5, 6, 7], [0, 1, 2, 4, 5, 6, 7], [0, 1, 2, 4, 5, 6, 7], [0, 1, 2, 4, 5, 6, 7]]) && R(B, "return gbRows().every(function(x){ return x.g.level==null; });"), pools(B));
  const m = w.mark(); await set(S, SCENE);
  ok("setting it up was Mom's own taps: one path each, all under household/ (the card's Area and Level, the dials)", writes(w, m).every(l => /^set household\/(jobs\/gb_[a-z_]+\/(area|level)|levels\/kid_[abd]\/current) $/.test(l)) && writes(w, m).length === 11, writes(w, m));
  const P = pools(B);
  ok("kid_a (own Level 2, the family on 1): the Level 2 cleaning island and pickup porch window yes, the Level 3 towel basket no", J(P[0]) === J([0, 1, 2, 4, 6, 7]), P[0]);
  ok("kid_b (own Level 3): everything", J(P[1]) === J([0, 1, 2, 4, 5, 6, 7]), P[1]);
  ok("kid_c (no dial of their own → the family's Level 1): no Level 2 or 3 cleaning or pickup chore", J(P[2]) === J([2, 4, 6, 7]), P[2]);
  ok("kid_d (own Level 1): the same as kid_c", J(P[3]) === J([2, 4, 6, 7]), P[3]);
  ok("health (the garage, Level 2) and animal (the hall toilet, Level 3) chores are never held back — every kid sees them", P.every(p => p.includes(2) && p.includes(6)));
  ok("no level stored (the bookshelf, the porch plants) = Level 1 — every kid sees them", P.every(p => p.includes(4) && p.includes(7)));
  ok("each kid's own screen draws exactly that (no button for a chore above their level)", KIDS.every((k, n) => { const h = B.run("_grabsHTML('" + k + "',false)"); return [0, 1, 2, 4, 5, 6, 7].every(i => (h.indexOf("gbInstant('" + k + "'," + i + ")") >= 0) === P[n].includes(i)); }));
  ok("the Today card's Up for Grabs count follows (it is the same pool)", R(B, "return gbPool('kid_c',false).length;") === 4);
  await set(S, "hhLevelSet(3)");
  ok("whose level: the family raised to 3 changes nothing for kid_d, whose own dial says 1 (the kid looking, not the owner \"grab\", whose level would be the family's)", J(pool(B, "kid_d")) === J([2, 4, 6, 7]) && R(B, "return hhLevelCurFor('grab');") === 3, pool(B, "kid_d"));
  await set(S, "hhLevelSet(1); hhLevelSetFor('mom',3); hhLevelSetFor('dad',3)");
  ok("…and Mom's and Dad's own levels do not matter here (kid_c still on the family's 1)", J(pool(B, "kid_c")) === J([2, 4, 6, 7]));
}

// ── 2 ──
console.log("\n── 2 · it opens up by itself ──");
{ const S = await scene(), { w, A, B } = S;
  const m = w.mark(); await set(S, "hhLevelSetFor('kid_c',2)");
  ok("Mom raises kid_c's own dial to 2: on the kid's device the island and the porch window appear, no other tap", J(pool(B, "kid_c")) === J([0, 1, 2, 4, 6, 7]), pool(B, "kid_c"));
  ok("…the only write was the dial (household/levels/kid_c/current) — nothing about grabs", J(writes(w, m)) === J(["set household/levels/kid_c/current "]), writes(w, m));
  await set(S, "hhLevelSetFor('kid_c',0); hhLevelSet(2)");
  ok("the family's level raised to 2: kid_c (following it) sees the Level 2 chores; kid_d (own dial 1) does not", J(pool(B, "kid_c")) === J([0, 1, 2, 4, 6, 7]) && J(pool(B, "kid_d")) === J([2, 4, 6, 7]));
  await set(S, "hhLevelSet(3)");
  ok("…to 3: kid_c sees the towel basket too", J(pool(B, "kid_c")) === J([0, 1, 2, 4, 5, 6, 7]));
  await set(S, "hhLevelSet(1)");
  ok("…back to 1: the Level 2 and 3 chores leave kid_c's list again (nobody held them)", J(pool(B, "kid_c")) === J([2, 4, 6, 7]));
  const m2 = w.mark(); await set(S, "hhEditSet('gb_fold_the_towel_basket','level',1)");
  ok("Mom lowers the towel basket to Level 1 on its card: every kid's list follows at once", pools(B).every(p => p.includes(5)), pools(B));
  ok("…the only write was the card's (household/jobs/<id>/level)", J(writes(w, m2)) === J(["set household/jobs/gb_fold_the_towel_basket/level "]), writes(w, m2));
  await set(S, "hhEditSet('gb_sort_the_bookshelf','level',2)");
  ok("…and raising one (the bookshelf to 2) takes it off the Level 1 kids' lists", !pool(B, "kid_c").includes(4) && !pool(B, "kid_d").includes(4) && pool(B, "kid_a").includes(4));
  await set(S, "hhEditSet('gb_sort_the_bookshelf','area','health')");
  ok("…and making it a health chore puts it back for every kid (health is never held back)", pools(B).every(p => p.includes(4)));
}

// ── 3 ──
console.log("\n── 3 · a held grab is kept ──");
{ const S = await scene(), { w, A, B } = S;
  B.run("gbClaim('kid_a',1)"); await w.flush();
  ok("(kid_a, on Level 2, holds the Level 2 island for later)", R(B, "return (gbCur(1)||{}).by;") === "kid_a");
  await set(S, "hhEditSet('gb_wipe_the_island','level',3)");
  ok("Mom raises the island to Level 3: kid_a still has it on their list, with ✓ Mark done and let go", pool(B, "kid_a").includes(1) && /gbMarkDone\('kid_a',1\)/.test(B.run("_grabsHTML('kid_a',false)")) && /gbLetGo\('kid_a',1\)/.test(B.run("_grabsHTML('kid_a',false)")));
  ok("…\"one at a time\" still counts it (kid_a can't grab another)", R(B, "return gbHasActive('kid_a');") === true);
  const b0 = bal(B, "kid_a"); B.run("gbMarkDone('kid_a',1)"); await w.flush();
  ok("…kid_a marks it done: paid its stars (25), the record theirs", bal(B, "kid_a") - b0 === 25 && R(B, "return [(gbCur(1)||{}).by,(gbCur(1)||{}).done];").join() === "kid_a,true", bal(B, "kid_a") - b0);
  B.run("gbClaim('kid_a',0)"); await w.flush(); await set(S, "hhLevelSetFor('kid_a',1)");
  ok("kid_a holds the porch window (Level 2), then their own dial goes down to 1: still theirs", pool(B, "kid_a").includes(0) && R(B, "return (gbCur(0)||{}).by;") === "kid_a");
  B.run("gbLetGo('kid_a',0)"); await w.flush();
  ok("…kid_a lets it go: it leaves their list (above their level now) and is open again for the kids at Level 2", !pool(B, "kid_a").includes(0) && R(B, "return gbCur(0);") === null && pool(B, "kid_b").includes(0));
}

// ── 4 ──
console.log("\n── 4 · who can grab it and the level together ──");
{ const S = await scene(), { w, A, B } = S;
  await set(S, "hgCan('gb_wipe_the_island','kid_a'); hgCan('gb_wipe_the_island','kid_d')");
  ok("(the island: who can grab it = kid_b and kid_c)", J(R(A, "return hhJobs().gb_wipe_the_island.can;")) === J(["kid_b", "kid_c"]));
  ok("kid_b (ticked, Level 3): yes · kid_c (ticked, Level 1): no · kid_a (Level 2, not ticked): no · kid_d: no", pool(B, "kid_b").includes(1) && !pool(B, "kid_c").includes(1) && !pool(B, "kid_a").includes(1) && !pool(B, "kid_d").includes(1));
  await set(S, "hhLevelSet(2)");
  ok("the family goes to 2: kid_c (ticked) now sees it; kid_a (Level 2, not ticked) still not; kid_d (own 1) still not", pool(B, "kid_c").includes(1) && !pool(B, "kid_a").includes(1) && !pool(B, "kid_d").includes(1));
  await set(S, "hgCan('gb_wipe_the_island','kid_a')");
  ok("…Mom ticks kid_a: kid_a sees it (both rules met)", pool(B, "kid_a").includes(1));
  const b0 = bal(B, "kid_d"), m = w.mark(); B.run("gbInstant('kid_d',1)"); await w.flush();
  ok("kid_d (not ticked AND below the level) taps it anyway: refused by the level guard, nothing written, nothing paid", w.since(m).length === 0 && bal(B, "kid_d") === b0, writes(w, m));
}

// ── 5 ──
console.log("\n── 5 · Mom's view of a kid, and assign ──");
{ const S = await scene(), { w, A, B } = S;
  ok("Mom's view of each kid shows what that kid may grab (the same pool as theirs)", KIDS.every(k => J(pool(A, k, true)) === J(pool(B, k))), KIDS.map(k => pool(A, k, true)));
  B.run("gbClaim('kid_b',5)"); await w.flush();
  ok("kid_b holds the Level 3 towel basket: Mom's view of kid_b shows it with release; her view of kid_a / kid_c doesn't (they can't grab it)",
    /gbLetGo\('kid_b',5\)/.test(A.run("_grabsHTML('kid_b',true)")) && !pool(A, "kid_a", true).includes(5) && !pool(A, "kid_c", true).includes(5));
  const h = A.run("_grabsHTML('kid_b',true)"), card = i => { const k = h.indexOf("gbInstant('kid_b'," + i + ")"); return h.slice(k, h.indexOf("</div></div>", k) + 12); };
  const asg = i => (card(i).match(/gc-assign">assign: (.*?)<\/div>/) || [])[1] || "";
  ok("assign on the Level 2 island offers only the kids at Level 2+: kid_a and kid_b", /gbClaim\('kid_a',1\)/.test(asg(1)) && /gbClaim\('kid_b',1\)/.test(asg(1)) && !/kid_c|kid_d/.test(asg(1)), asg(1));
  ok("assign on the health garage (Level 2) offers every kid; on the bookshelf (no level) every kid", KIDS.every(k => asg(6).indexOf("gbClaim('" + k + "',6)") >= 0 && asg(4).indexOf("gbClaim('" + k + "',4)") >= 0));
  await set(S, "hhLevelSetFor('kid_c',2)");
  ok("kid_c's dial to 2 → assign on the island offers kid_c too (opens up by itself)", /gbClaim\('kid_c',1\)/.test(A.run("_grabsHTML('kid_b',true)")));
}

// ── 6 ──
console.log("\n── 6 · the card, ⚙ Rules, 🔍 Checks ──");
{ const S = await scene(), { w, A, B } = S;
  const cardT = id => text(A.run("hcOpen('" + id + "'); hcCardHTML()"));
  ok("the island's card (cleaning, Level 2) says what the Level does in Up for Grabs, and who sees it now",
    cardT("gb_wipe_the_island").indexOf("🪜 In Up for Grabs a kid sees this chore once their own Cleaning level is 2 or higher. Sees it now: Kid A, Kid B.") >= 0, cardT("gb_wipe_the_island").slice(0, 900));
  ok("the towel basket's (Level 3): \"… is 3.\" (no \"or higher\") · Sees it now: Kid B", cardT("gb_fold_the_towel_basket").indexOf("Cleaning level is 3. Sees it now: Kid B.") >= 0);
  ok("a no-level chore (the bookshelf): Level 1, every kid", cardT("gb_sort_the_bookshelf").indexOf("Cleaning level is 1 or higher. Sees it now: Kid A, Kid B, Kid C, Kid D.") >= 0);
  ok("the garage's (health): the level holds back no health or animal chore", cardT("gb_sweep_the_garage").indexOf("In Up for Grabs the level holds back no health or animal chore: every kid ticked under “Who can grab it” sees it.") >= 0);
  await set(S, "hgCan('gb_fold_the_towel_basket','kid_b'); hgCan('gb_fold_the_towel_basket','kid_a')");
  ok("the towel basket with only kid_c and kid_d ticked (both on Level 1): \"No kid ticked … is up to Level 3 yet, so no kid sees it.\"", cardT("gb_fold_the_towel_basket").indexOf("No kid ticked under “Who can grab it” is up to Level 3 yet, so no kid sees it.") >= 0);
  ok("a kid's own chore's card has no such line", cardT("c_a_dishes").indexOf("🪜 In Up for Grabs") < 0);
  const rules = A.run("hcRulesHTML('kitchen',['gb_wipe_the_island','c_a_dishes'])");
  ok("⚙ Rules shows an Up for Grabs chore's level as it does every chore's (the same select, Level 2 chosen)", /<select onchange="hhEditSet\('gb_wipe_the_island','level',this\.value\)"[^>]*>(?:(?!<\/select>).)*<option value="2" selected>Level 2/.test(rules) && /hhEditSet\('c_a_dishes','level',this\.value\)/.test(rules));
  A.run("hhEditSet('gb_wipe_the_island','level','3')"); await w.flush();
  ok("…and changing it there is the card's own setter (one path) — the island at 3 leaves kid_a's list", !pool(B, "kid_a").includes(1) && R(A, "return hhLevelOf(hhJobs().gb_wipe_the_island);") === 3);
  await set(S, "hhEditSet('gb_wipe_the_island','level',2)");
  const chk = () => R(A, "return hcChecks('__none'," + J(ID) + ").filter(function(c){ return /grab|level/i.test(c.k); }).map(function(c){ return [c.k,c.txt,c.id]; });");
  let C = chk();
  ok("🔍 Checks: the towel basket (Level 3, only Level 1 kids ticked) → \"Up for Grabs at Level 3, and no kid ticked is up to Level 3 yet — no kid sees it\"",
    J(C) === J([["grabLv", "Up for Grabs at Level 3, and no kid ticked is up to Level 3 yet — no kid sees it", "gb_fold_the_towel_basket"]]), C);
  ok("…the old owner line (\"above Up for Grabs’s Level 1, not on a list yet\") is not said for a switched Up for Grabs chore — the owner \"grab\" has no list", !R(A, "return hcChecks('__none'," + J(ID) + ").some(function(c){ return /above Up for Grabs/.test(c.txt); });"));
  ok("…a chore some ticked kid can see (the island: kid_a, kid_b) has no line; nor the health or animal ones at Level 2/3", !C.some(c => /island|garage|toilet/.test(c[2])));
  A.run("hhJobs().gb_fold_the_towel_basket.can=['kid_zz']; householdOnValue(householdData);");
  C = chk();
  ok("a stored who-can list with no current kid → only the existing \"nobody is ticked\" line, never both", J(C) === J([["grab0", "Up for Grabs, and nobody is ticked — no kid sees it", "gb_fold_the_towel_basket"]]), C);
  A.run("delete hhJobs().gb_fold_the_towel_basket.can; householdOnValue(householdData);");
  ok("…every kid ticked (kid_b on Level 3): no line", chk().length === 0, chk());
  ok("a kid's own chore above its owner's level still gets the old line (unchanged)", (() => { A.run("hhJobs().c_c_toys.level=2; householdOnValue(householdData);"); const c = R(A, "return hcChecks('__none',['c_c_toys']).map(function(c){ return c.txt; });"); A.run("hhJobs().c_c_toys.level=1; householdOnValue(householdData);"); return J(c) === J(["Level 2 — above Kid C’s Level 1, not on a list yet"]); })());
  const U = await mk({ sw: false }); await set(U, SCENE.replace(/hhEditSet\('gb_fold_the_towel_basket'[^;]*;/, ""));
  ok("not switched: the card says nothing of the level for Up for Grabs (as before)", text(U.A.run("hcOpen('gb_wipe_the_island'); hcCardHTML()")).indexOf("🪜 In Up for Grabs") < 0);
  ok("…Checks are main's: the owner line as before, no grabLv line", J(R(U.A, "return hcChecks('__none'," + J(ID) + ".filter(function(id){ return !!hhJobs()[id]; })).filter(function(c){ return /grab/i.test(c.k)||/Up for Grabs/.test(c.txt); }).map(function(c){ return c.txt; });"))
    === J(["Level 2 — above Up for Grabs’s Level 1, not on a list yet", "Level 2 — above Up for Grabs’s Level 1, not on a list yet"]));
  ok("…and every kid sees the old pool, whatever the table's levels", J(pools(U.B)) === J([[0, 1, 2, 4, 5, 6, 7], [0, 1, 2, 4, 5, 6, 7], [0, 1, 2, 4, 5, 6, 7], [0, 1, 2, 4, 5, 6, 7]]), pools(U.B));
  // 6a's switch screen works out "after" with the real pool code, so a table row already above a kid's level shows as that kid losing it,
  // and 6a's own rule (the starting choices must keep every kid's list) holds the switch back until the row is put on Level 1.
  const p = R(U.A, "const p=hgPlan({}); return {ok:p.ok,why:p.why,same:p.same,minus:p.now.kid.map(function(k,n){ return k.pool.filter(function(x){ return p.aft.kid[n].pool.indexOf(x)<0; }); })};");
  ok("the 🙌 switch screen, with the island and porch window already at Level 2 in the table: kid_c and kid_d (Level 1) would lose them, so it does not switch (6a's rule)",
    !p.ok && J(p.same) === J([true, true, false, false]) && J(p.minus[2]) === J(["Wash the porch window +15", "Wipe the island +25"]) && p.why.some(x => /would not stay the same/.test(x)), p);
  await set(U, "hhEditSet('gb_wipe_the_island','level',1); hhEditSet('gb_wash_the_porch_window','level',1)");
  ok("…both put back on Level 1 on their cards: every kid's list stays the same and it can switch", R(U.A, "const p=hgPlan({}); return p.ok&&p.same.every(Boolean);") === true);
}

// ── 7 ── (also run against the mutated copies in part 9)
console.log("\n── 7 · the guards: a kid below the level taps from a stale screen ──");
// The stale screen: kid_c's Up for Grabs drawn while the island was still Level 1; then Mom raises it to 2 and the kid's device hears.
const staleOf = async (o) => { const S = await scene(o); await set(S, "hhEditSet('gb_wipe_the_island','level',1)"); const h = S.B.run("_grabsHTML('kid_c',false)"); await set(S, "hhEditSet('gb_wipe_the_island','level',2)"); return { S, h }; };
const tapG = async (S, d, call, kid) => { const m = S.w.mark(), b = bal(S.B, kid); d.run(call); await S.w.flush(); return { wr: writes(S.w, m), paid: bal(S.B, kid) - b, rec: R(S.B, "return gbGet(1);"), held: R(S.B, "return gbHasActive(" + J(kid) + ");") }; };
const refused = t => t.wr.length === 0 && t.paid === 0 && t.rec === null && t.held === false;
async function guardsG(o, say) {
  const out = {};
  { const { S, h } = await staleOf(o); const t = await tapG(S, S.B, "gbInstant('kid_c',1)", "kid_c"); out.instant = refused(t);
    if (say) { ok("(kid_c's screen, drawn before Mom raised the island to Level 2, still has its ✓ I did it now and 🔖 Grab for later)", /gbInstant\('kid_c',1\)/.test(h) && /gbClaim\('kid_c',1\)/.test(h));
      ok("gbInstant — kid_c (Level 1) taps ✓ I did it now on the Level 2 island: refused — nothing written, unpaid, no record", out.instant, t);
      ok("…the screen is redrawn without it (the existing \"That one isn’t up for grabs any more.\")", !/gbInstant\('kid_c',1\)/.test(S.B.run("_grabsHTML('kid_c',false)"))); } }
  { const { S } = await staleOf(o); const t = await tapG(S, S.B, "gbClaim('kid_c',1)", "kid_c"); out.claim = refused(t);
    if (say) ok("gbClaim — kid_c taps 🔖 Grab for later: refused — nothing written, no hold, kid_c still free to grab another", out.claim && R(S.B, "return gbHasActive('kid_c');") === false, t); }
  { const { S } = await staleOf(o); const t = await tapG(S, S.A, "gbClaim('kid_c',1)", "kid_c"); out.assign = refused(t);
    if (say) ok("gbClaim from Mom's assign (her screen drawn before) for kid_c: refused the same way", out.assign, t); }
  { const { S } = await staleOf(o); const t = await tapG(S, S.B, "gbInstant('kid_b',1)", "kid_b"); out.okB = t.paid === 25 && !!t.rec && t.rec.by === "kid_b";
    if (say) ok("a kid at the level (kid_b, Level 3) still can: paid 25, the record theirs — the guard refuses only below the level", out.okB, t); }
  { const { S } = await staleOf(o); const t = await tapG(S, S.B, "gbInstant('kid_c',6)", "kid_c"); out.health = t.paid === 20;
    if (say) ok("…and kid_c (Level 1) can still do the health garage at Level 2: paid 20", out.health, t); }
  return out;
}
const G0 = await guardsG({}, true);
{ const S = await scene(); const m = S.w.mark(); S.B.run("gbInstant('kid_c',1); gbClaim('kid_c',1)"); await S.w.flush();
  ok("direct calls with no screen at all (gbInstant / gbClaim for kid_c on the island): nothing written", S.w.since(m).length === 0 && R(S.B, "return gbGet(1);") === null); }

// ── 8 ──
console.log("\n── 8 · the ×2 offers (plan ON) ──");
// The tub (kid_b's, who-can kid_b + kid_a) is set to Level 2 and kid_b's own dial to 2, so it enters kid_b's day and fits nobody; kid_a is on
// the family's Level 1. Mom's oven is Level 2 with kid_a ticked and Mom's dial on 2: it fits nobody and its only kid is below its level.
const x2hh = (lvA, mode) => O.household(mode || "on", { extra: h => { h.jobs.c_b_tub.level = 2; h.jobs.m_oven.level = 2; h.jobs.m_oven.can = ["mom", "kid_a"]; h.levels = { kid_b: { current: 2 }, mom: { current: 2 } }; if (lvA) h.levels.kid_a = { current: lvA }; } });
const mkX = async (o) => { o = o || {}; const w = await O.world("saved", o.mode || "on", { index: o.index || IDX, household: x2hh(o.lvA, o.mode) }); const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"); A.run(HJS); await w.flush(); await w.at(2026, 11, 16, 8, 0); return { w, A, B }; };
const x2 = (d, k, mom) => O.x2(d, k, mom), offer = (S, id) => clone(S.w.get("houseDay/" + MON + "/grabs/" + id)) || null;
{ const S = await mkX(), { w, A, B } = S;
  ok("(the day's offers: the tub to kid_b + kid_a, the oven to kid_a — stored as on main, every ticked kid in `can`)", J((offer(S, "c_b_tub") || {}).can) === J(["kid_b", "kid_a"]) && J((offer(S, "m_oven") || {}).can) === J(["kid_a"]), [offer(S, "c_b_tub"), offer(S, "m_oven")]);
  ok("kid_b (own Level 2) sees the Level 2 tub; kid_a (Level 1) does not — and not the oven either", x2(B, "kid_b").includes("c_b_tub") && !x2(B, "kid_a").includes("c_b_tub") && !x2(B, "kid_a").includes("m_oven"), [x2(B, "kid_a"), x2(B, "kid_b")]);
  ok("…kid_a still sees the Level 1 vacuum offered to them; the Today card's ×2 count is 1", J(x2(B, "kid_a")) === J(["c_a_vac"]) && B.run("hdGrabOpenN('kid_a',false)") === 1);
  ok("Mom's view of kid_a: no tub · of kid_b: the tub, assign only kid_b", !x2(A, "kid_a", true).includes("c_b_tub") && /hdGrabHold\('kid_b','2026-11-16','c_b_tub'\)/.test(A.run("_grabsHTML('kid_b',true)")) && !/hdGrabHold\('kid_a','2026-11-16','c_b_tub'\)/.test(A.run("_grabsHTML('kid_b',true)")));
  const chip = id => text(A.run("hpGrabChip('" + MON + "','" + id + "')"));
  ok("Mom's chip under \"Didn't fit anyone today\": the tub \"for Kid B\" (not Kid A); the oven \"no kid up to Level 2 yet\"", /🙌 Up for Grabs ×2 · \+30 ⭐ · for Kid B\s*$/.test(chip("c_b_tub")) && /· no kid up to Level 2 yet\s*$/.test(chip("m_oven")), [chip("c_b_tub"), chip("m_oven")]);
  const tapX = async (d, fn, kid, id) => { const m = w.mark(), b = O.bal(w, kid), o0 = J(offer(S, id)); d.run(fn + "('" + kid + "','" + MON + "','" + id + "')"); await w.flush(); return { wr: writes(w, m), paid: O.bal(w, kid) - b, same: J(offer(S, id)) === o0, done: !!w.get("houseDay/" + MON + "/done/" + id) }; };
  const rx = t => t.wr.length === 0 && t.paid === 0 && t.same && !t.done;
  let t = await tapX(B, "hdGrabDone", "kid_a", "c_b_tub"); ok("hdGrabDone — kid_a (Level 1) on the Level 2 tub: refused — nothing written, unpaid, the offer unchanged, not done", rx(t), t);
  t = await tapX(B, "hdGrabHold", "kid_a", "c_b_tub"); ok("hdGrabHold — kid_a's 🔖 Grab for later: refused the same way (nobody holding)", rx(t), t);
  t = await tapX(A, "hdGrabHold", "kid_a", "c_b_tub"); ok("…and Mom's assign to kid_a: refused", rx(t), t);
  t = await tapX(B, "hdGrabDone", "kid_a", "m_oven"); ok("…kid_a on the oven (ticked, below its level): refused", rx(t), t);
  await set(S, "hhLevelSetFor('kid_a',2)");
  ok("kid_a's dial raised to 2: the tub and the oven appear on kid_a's Up for Grabs by themselves", J(x2(B, "kid_a").slice().sort()) === J(["c_a_vac", "c_b_tub", "m_oven"]), x2(B, "kid_a"));
  ok("…and Mom's chips name kid_a now", /for Kid B, Kid A\s*$/.test(chip("c_b_tub")) && /for Kid A\s*$/.test(chip("m_oven")), [chip("c_b_tub"), chip("m_oven")]);
  t = await tapX(B, "hdGrabHold", "kid_a", "c_b_tub");
  ok("kid_a (Level 2 now) grabs the tub for later", t.wr.length >= 1 && (offer(S, "c_b_tub") || {}).by === "kid_a", t);
  await set(S, "hhLevelSetFor('kid_a',1)");
  ok("Mom lowers kid_a's dial back to 1: the held tub stays on kid_a's list (Mark done / let go); the oven leaves it", x2(B, "kid_a").includes("c_b_tub") && !x2(B, "kid_a").includes("m_oven") && /hdGrabDone\('kid_a','2026-11-16','c_b_tub'\)">✓ Mark done/.test(B.run("_grabsHTML('kid_a',false)")));
  t = await tapX(B, "hdGrabDone", "kid_a", "c_b_tub");
  ok("…kid_a marks it done: paid the double, 30, done everywhere", t.paid === 30 && t.done, t);
}
const staleX = async (o) => { const S = await mkX(Object.assign({ lvA: 2 }, o)); const h = S.B.run("_grabsHTML('kid_a',false)"); await set(S, "hhLevelSetFor('kid_a',1)"); return { S, h }; };
async function guardsX(o, say) {
  const out = {}, tap = async (S, d, fn, kid) => { const m = S.w.mark(), b = O.bal(S.w, kid), o0 = J(offer(S, "c_b_tub")); d.run(fn + "('" + kid + "','" + MON + "','c_b_tub')"); await S.w.flush(); return { wr: writes(S.w, m), paid: O.bal(S.w, kid) - b, same: J(offer(S, "c_b_tub")) === o0 }; };
  { const { S, h } = await staleX(o); const t = await tap(S, S.B, "hdGrabDone", "kid_a"); out.done = t.wr.length === 0 && t.paid === 0 && t.same;
    if (say) { ok("(stale screen: kid_a's Up for Grabs drawn while on Level 2 shows the tub's ✓ I did it now (+30))", /hdGrabDone\('kid_a','2026-11-16','c_b_tub'\)">✓ I did it now \(\+30\)/.test(h));
      ok("hdGrabDone from that screen after Mom put kid_a back on Level 1: refused — nothing written, unpaid, offer unchanged", out.done, t); } }
  { const { S } = await staleX(o); const t = await tap(S, S.B, "hdGrabHold", "kid_a"); out.hold = t.wr.length === 0 && t.same;
    if (say) ok("hdGrabHold from that screen: refused — nothing written, nobody holding", out.hold, t); }
  { const { S } = await staleX(o); const t = await tap(S, S.B, "hdGrabDone", "kid_b"); out.okB = t.paid === 30;
    if (say) ok("kid_b (at the level) still does it: paid 30", out.okB, t); }
  return out;
}
const X0 = await guardsX({}, true);
{ const S = await mkX({ mode: "preview" });
  const t = text(S.A.run("hpTomorrowHTML()"));
  ok("preview (her live setting): \"Tomorrow would look like this\" says the tub is \"at double for: Kid B\" and the oven \"no kid up to Level 2 yet\"", /at double for: Kid B(?!, Kid A)/.test(t) && /Clean the oven.*?no kid up to Level 2 yet/.test(t), t.slice(t.indexOf("Would go to Up for Grabs"), t.indexOf("Would go to Up for Grabs") + 600));
  ok("…and nothing is offered or stored in preview", !S.w.get("houseDay/" + MON + "/grabs")); }

// ── 9 ──
console.log("\n── 9 · mutation checks: remove or bend each piece, the check that protects it fails ──");
{ const M = {
    instant: mut("instant", "if(_gbGone(i)) return; if(!(s&&s.by===kid)&&_gbLvNo(i,kid)) return; _gbWrite", "if(_gbGone(i)) return; _gbWrite"),
    claim: mut("claim", "if(_gbGone(i)) return; if(!(s&&s.by===kid)&&_gbLvNo(i,kid)) return;\n", "if(_gbGone(i)) return;\n"),
    hold: mut("hold", " if(!gbLvFor(hhJobs()[id],kid)) return _hdGrabSay(\"That one isn’t up for grabs any more.\");\n", "\n"),
    done: mut("done", " if(g.by!==kid&&!gbLvFor(hhJobs()[id],kid)) return _hdGrabSay(\"That one isn’t up for grabs any more.\");\n", "\n"),
    pool: mut("pool", "gbCanKids(g).indexOf(kid)>=0&&gbLvFor(g,kid); }", "gbCanKids(g).indexOf(kid)>=0; }"),
    rows: mut("rows", "can=hdGrabCan(g).filter(function(k){ return gbLvFor(j,k); });   // HOUSEGRABLV", "can=hdGrabCan(g);"),
    whose: mut("whose", "hhLevelOf(j)<=hhLevelCurFor(kid); }", "hhLevelOf(j)<=hhLevelCurFor(\"grab\"); }"),
    area: mut("area", "return !j||!(j.area===\"cleaning\"||j.area===\"pickup\")||hhLevelOf(j)", "return !j||hhLevelOf(j)") };
  if (M.instant) { const g = await guardsG({ index: M.instant }); ok("M1 gbInstant's level guard removed → the stale ✓ I did it now is written and paid (the gbInstant check fails); the others still hold", !g.instant && g.claim && g.assign && g.okB, g); }
  if (M.claim) { const g = await guardsG({ index: M.claim }); ok("M2 gbClaim's level guard removed → the stale 🔖 Grab for later and Mom's assign are written (both checks fail)", !g.claim && !g.assign && g.instant, g); }
  if (M.hold) { const x = await guardsX({ index: M.hold }); ok("M3 hdGrabHold's level guard removed → the stale ×2 Grab for later is written (the hdGrabHold check fails)", !x.hold && x.done, x); }
  if (M.done) { const x = await guardsX({ index: M.done }); ok("M4 hdGrabDone's level guard removed → the stale ×2 I did it now is paid (the hdGrabDone check fails)", !x.done && x.hold, x); }
  if (M.pool) { const S = await scene({ index: M.pool }); ok("M5 the pool's level filter removed (gbCanGrab) → kid_c sees the Level 2 / 3 chores (the part 1 check fails)", J(pool(S.B, "kid_c")) !== J([2, 4, 6, 7]), pool(S.B, "kid_c")); }
  if (M.rows) { const S = await mkX({ index: M.rows }); ok("M6 the ×2 rows' level filter removed → kid_a is shown the Level 2 tub (the part 8 check fails)", x2(S.B, "kid_a").includes("c_b_tub"), x2(S.B, "kid_a")); }
  if (M.whose) { const S = await scene({ index: M.whose }); await set(S, "hhLevelSet(3)"); ok("M7 the owner's level (\"grab\" = the family's) instead of the kid's → kid_d (own 1) sees the Level 2 chores once the family is on 3 (the part 1 \"whose level\" check fails)", J(pool(S.B, "kid_d")) !== J([2, 4, 6, 7]), pool(S.B, "kid_d")); }
  if (M.area) { const S = await scene({ index: M.area }); ok("M8 health and animal held back too → kid_c loses the garage and the toilet (the part 1 health/animal check fails)", !pool(S.B, "kid_c").includes(6) && !pool(S.B, "kid_c").includes(2), pool(S.B, "kid_c")); }
  { const S = await scene({ index: mut("held", "if(st.by!==kid&&!gbCanGrab(x.i,kid)) return false;", "if(!gbCanGrab(x.i,kid)) return false;") }); S.B.run("gbClaim('kid_a',1)"); await S.w.flush(); await set(S, "hhEditSet('gb_wipe_the_island','level',3)");
    ok("M9 a held grab no longer kept (gbPool's \"they hold it\" exception removed) → the island leaves kid_a's list (the part 3 check fails)", !pool(S.B, "kid_a").includes(1)); }
}

// ── 10 ──
console.log("\n── 10 · NOT switched, levels set everywhere: = " + WAS + " ──");
const dOf = n => new Date(2026, 10, 16 + n), isoN = n => { const d = dOf(n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const go = (w, n, h, mi) => { const d = dOf(n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h, mi || 0); };
const snap = S => J({ kid: F.kidHTML(S.B), mom: F.kidHTML(S.A, true) });
// One day of grabs, picked by name from each kid's own list (so two worlds do the same): I did it now, Grab for later, Mark done, Let go,
// Mom's assign and release, and the day's ×2 offers (a kid does the first one offered, another holds one and lets it go).
async function dayOf(S, n) {
  const { w, A, B } = S, pick = (kid, k) => { const p = F.poolNames(B, kid); return p.length ? p[k % p.length] : null; };
  await go(w, n, 8, 0); { const l = pick("kid_a", n); if (l) F.act(B, "gbInstant", "kid_a", l); }
  { const held = R(B, "const x=gbPool('kid_b',false).find(function(x){ const s=gbCur(x.i); return s&&s.by==='kid_b'&&!s.done; }); return x?x.g.label:'';");
    if (held && n % 2) F.act(B, "gbMarkDone", "kid_b", held); else if (!held) { const l = pick("kid_b", n + 1); if (l) F.act(B, "gbClaim", "kid_b", l); } }
  await w.flush(); await go(w, n, 12, 0); { const l = pick("kid_c", n + 2); if (l) { F.act(B, "gbClaim", "kid_c", l); await w.flush(); if (n % 3) F.act(B, "gbLetGo", "kid_c", l); } }
  await w.flush(); await go(w, n, 15, 0); { const l = pick("kid_d", n + 3); if (l) { F.act(A, "gbClaim", "kid_d", l); await w.flush(); await go(w, n, 16, 0); if (n % 2) F.act(B, "gbMarkDone", "kid_d", l); else F.act(A, "gbLetGo", "kid_d", l); } }
  await w.flush(); await go(w, n, 17, 0);
  for (const k of ["kid_c", "kid_a"]) { const t = isoN(n), o = R(B, "return hdGrabRows(" + J(k) + ",false).filter(function(x){ return !x.d&&!x.g.by; }).map(function(x){ return x.id; });");
    if (o.length) { if (k === "kid_c" || n % 2) B.run("hdGrabDone(" + J(k) + "," + J(t) + "," + J(o[0]) + ")"); else { B.run("hdGrabHold(" + J(k) + "," + J(t) + "," + J(o[0]) + ")"); await w.flush(); B.run("hdGrabLetGo(" + J(k) + "," + J(t) + "," + J(o[0]) + ")"); } await w.flush(); } }
  await go(w, n, 18, 0); S.A.run("try{ renderAll(); hhRender(); }catch(e){}"); await w.flush();
}
const mkW = async (kind, mode, o) => { const w = await F.world(kind, mode, { index: o.index, household: o.household }); const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"); A.run(o.hjs); await w.flush(); return { w, A, B }; };
const replay = async (kind, mode, days, hh, sw, index, hjs) => { const S = await mkW(kind, mode, { index, hjs, household: hh() }), shots = [];
  await go(S.w, 0, 7, 0); if (sw) { S.A.run("hgOpen(); hgSwitch()"); await S.w.flush(); }
  for (let n = 0; n < days; n++) { await dayOf(S, n); shots.push(snap(S)); }
  const ex = J(R(S.A, "return " + J(ID) + ".filter(function(id){ return !!hhJobs()[id]; }).map(function(id){ hcOpen(id); return [hcCardHTML().replace(typeof hoHistHTML==='function'?hoHistHTML(id):'',''), hcChecks('__none',[id])]; });")); S.A.run("hcClose()");
  return { shots, writes: writes(S.w, 0).join("\n"), tree: J(S.w.db.tree.root), gc: Object.keys(S.w.get("grabClaims") || {}).length, x2: J(S.w.get("houseDay") || {}).split('"grab":').length - 1, ex }; };
const cmp = (label, N, B0, days) => {
  const bad = N.shots.map((s, i) => s === B0.shots[i] ? null : isoN(i)).filter(Boolean);
  ok(label + " · every kid's Up for Grabs (their screen and Mom's) = " + WAS + " on all " + days + " days", bad.length === 0, bad.slice(0, 3));
  ok(label + " · every write = " + WAS + ", in order (" + N.writes.split("\n").length + " writes)", N.writes === B0.writes, (() => { const x = N.writes.split("\n"), y = B0.writes.split("\n"); const i = x.findIndex((l, j) => l !== y[j]); return [i, x[i], y[i]]; })());
  ok(label + " · the whole database = " + WAS + ", byte for byte", N.tree === B0.tree);
};
// levels everywhere: every Up for Grabs row of the table at 2 or 3, two kid chores at 2, kids' own dials 1–3, the family on 1
const lvHH = (mode, kind) => () => O.household(mode, { over: true, extra: h => { Object.keys(h.jobs).forEach((id, n) => { if (h.jobs[id].who === "grab") h.jobs[id].level = 2 + (n % 2); });
  h.jobs.c_b_tub.level = 2; h.jobs.c_a_dishes.level = 2; h.levels = { cleaning: { current: 1 }, kid_a: { current: 2 }, kid_b: { current: 3 }, kid_d: { current: 1 } }; } });
if (BASE && BHJS) for (const kind of ["saved", "builtin", "none"]) for (const mode of ["preview", "on"]) {
  const N = await replay(kind, mode, 14, lvHH(mode, kind), false, IDX, HJS), B0 = await replay(kind, mode, 14, lvHH(mode, kind), false, BASE, BHJS);
  cmp(kind + " · " + mode + " · not switched" + (mode === "on" ? " (every ×2 chore's ticked kids at its level; part 8 has one that is not)" : ""), N, B0, 14);
  ok(kind + " · " + mode + " · not switched · Mom's card and 🔍 Checks for every Up for Grabs row = " + WAS, N.ex === B0.ex);
  ok(kind + " · " + mode + " · (sanity) " + (kind === "none" ? "no grab was written" : "the kids grabbed (" + N.gc + " grab records)") + (mode === "on" ? ", ×2 grabs done: " + N.x2 : ""), (kind === "none" ? N.gc === 0 : N.gc >= 8) && (mode !== "on" || N.x2 >= 5), [N.gc, N.x2]);
}

// ── 11 ──
console.log("\n── 11 · switched, every chore at Level 1 (her data): 60 days = " + WAS + " ──");
// Slice E (missed chores, the plan's part) changes the plan ON from HD_MISSED_FROM (12/07), inside these 60 days and not in BEFORE: the ON
// replay runs this tree with that one constant moved past the window, so it still measures the level rule alone.
const IDX_NOE = (() => { const n = SRC_IDX.split('const HD_MISSED_FROM="2026-12-07";').length - 1; if (n !== 1) return IDX; const p = path.join(os.tmpdir(), "house_grablv_noE_" + process.pid + ".html"); fs.writeFileSync(p, SRC_IDX.replace('const HD_MISSED_FROM="2026-12-07";', 'const HD_MISSED_FROM="2099-01-01";')); MUTS.push(p); return p; })();
if (BASE && BHJS) for (const kind of ["saved", "builtin"]) for (const mode of ["off", "preview", "on"]) {
  const hh = () => O.household(mode, {}), N = await replay(kind, mode, 60, hh, true, mode === "on" ? IDX_NOE : IDX, HJS), B0 = await replay(kind, mode, 60, hh, true, BASE, BHJS);
  cmp(kind + " · " + mode + " · switched, all Level 1", N, B0, 60);
  ok(kind + " · " + mode + " · switched, all Level 1 · Mom's card and 🔍 Checks for every Up for Grabs row: only the new 🪜 line differs from " + WAS, (() => { const a = JSON.parse(N.ex), b = JSON.parse(B0.ex); return a.every((x, i) => J(x[1]) === J(b[i][1]) && x[0].replace(/<div style="width:100%;font-size:11\.5px;color:#7c2d12;margin-top:4px">🪜 [^<]*<\/div>/, "") === b[i][0]); })());
  ok(kind + " · " + mode + " · (sanity) switched; the kids grabbed (" + N.gc + " records)" + (mode === "on" ? ", ×2 grabs done: " + N.x2 : ""), N.gc >= 30 && (mode !== "on" || N.x2 >= 20) && /gb_/.test(N.tree) && /"grabs":\{"on"/.test(N.tree), [N.gc, N.x2]);
}

console.log("\n" + pass + " passed, " + fail + " failed");
for (const p of MUTS.concat(BASE && !process.env.BASE_HTML ? [BASE] : [])) try { fs.unlinkSync(p); } catch (e) {}
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
