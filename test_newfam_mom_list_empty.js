/*
 * test_newfam_mom_list_empty.js — MCNEWFAM, slice 1 of DESIGN_new_family_walkthrough_2026-11-24 (her answer 2026-11-24 for a
 * brand-new family's Mom chores: "Remove them completely").
 *
 * A family that is not Howe (HA_IS_HOWE false) with nothing saved in momChores starts with an EMPTY Mom list: mcAll() is {},
 * mcEnsure() copies nothing (no momChores/mc_* rows, no _seeded), 📥 Bring in finds no Mom rows, and Home Base ▸ My day says
 * "Nothing here yet — add the things you actually do." Nothing is put in their place. Howe, and any family with its own saved
 * list, are unchanged: the BASELINE here is this same index.html with the three MCNEWFAM lines put back the way they were.
 *
 * The whole app runs in the repo sandbox (test_fixtures/demo_week_sandbox.js: fake page, in-memory pretend database, no network).
 * Made-up family only (Nora, Teo). Every write is read from the pretend database's log and tree.
 *   node test_newfam_mom_list_empty.js
 */
"use strict";
process.env.TZ = "America/New_York";
const fs = require("fs"), path = require("path"), vm = require("vm"), os = require("os");
const S = require(path.join(__dirname, "test_fixtures", "demo_week_sandbox.js"));
const INDEX = process.env.NEWFAM_INDEX || path.join(__dirname, "index.html");
const SRC = fs.readFileSync(INDEX, "utf8"), HOUSE = fs.readFileSync(path.join(__dirname, "house.js"), "utf8");
let pass = 0, fail = 0;
const ok = (c, m, why) => { if (c) pass++; else { fail++; console.log("  ✗ " + m + (why !== undefined ? "  → " + JSON.stringify(why).slice(0, 400) : "")); } };

// ── the feature's three lines, and the baseline without them ─────────────────────────────────────────────────────────────
// the lines live once, in the sandbox (it also gives OLDER app copies the same lines — see demo_week_sandbox.js): [before, after]
const FEATURE = S.MCNEWFAM.map(p => [p[1], p[0]]);
FEATURE.forEach(([now], i) => ok(SRC.split(now).length === 2, "MCNEWFAM line " + (i + 1) + " is in index.html exactly once"));
let BASE_SRC = SRC; FEATURE.forEach(([now, was]) => { BASE_SRC = BASE_SRC.split(now).join(was); });
ok(FEATURE.every(([now]) => BASE_SRC.indexOf(now) < 0) && BASE_SRC.split("MCNEWFAM").length === 1, "the baseline is this tree minus the feature (no MCNEWFAM line left)");
// one marker line at the top of the main script, so the sandbox does not put the lines back into this baseline
{ const L = BASE_SRC.split("\n"), a = L.lastIndexOf("<script>"); L.splice(a + 1, 0, "// MCNEWFAM baseline: the three lines taken out (test_newfam_mom_list_empty.js)"); BASE_SRC = L.join("\n"); }
const BASE = path.join(os.tmpdir(), "newfam_base_" + process.pid + ".html");
fs.writeFileSync(BASE, BASE_SRC);
process.on("exit", () => { try { fs.unlinkSync(BASE); } catch (e) {} });

// ── boot ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
const FAMILY = { familyId: "ridge", familyName: "Ridge Family", windowText: "School day",
  firebase: { apiKey: "x", authDomain: "x.local", databaseURL: "https://x.local", projectId: "x" },
  roster: [{ id: "nora", name: "Nora", color: "#1e3a5f", badge: "#dbeafe", schoolAge: true }, { id: "teo", name: "Teo", color: "#c45e1a", badge: "#ffedd5", schoolAge: false }] };
const START = new Date(2026, 10, 24, 10, 0, 0).getTime();   // Tuesday 24 Nov 2026, 10:00
async function boot(index, family, tree, o) {
  o = o || {};
  const clock = S.makeClock(START); clock.boot = clock.now; const sched = S.makeScheduler(clock);
  const db = S.makeDb(tree || {}, clock, sched);
  let seed = 7; const M = Object.create(Math); M.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };   // the same keys on every run
  const globals = { Math: M };
  if (o.dry) globals.location = { search: "?dryrun=1", hostname: "demo.local", pathname: "/demo/", protocol: "https:", href: "https://demo.local/demo/?dryrun=1", origin: "https://demo.local", hash: "", reload() {}, assign() {}, replace() {} };
  const A = S.bootDevice({ name: "mom", dev: "dev_a", db, clock, sched, family, indexPath: index, globals });
  await sched.run(clock.now + 3000); A.momOn(); await sched.run(clock.now + 3000);
  vm.runInContext(HOUSE, A.ctx, { filename: "house.js" });
  try { A.run("rlHistReady()"); } catch (e) {}   // the check-off history the Household pages wait for
  await sched.run(clock.now + 3000);
  const run = e => A.run(e), js = e => JSON.parse(A.run("JSON.stringify(" + e + ")"));
  const textOf = h => String(h || "").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;|’/g, "'").replace(/\s+/g, " ").trim();
  const page = (setup, expr) => { const c = A.ctx.document.getElementById("content"); c.innerHTML = ""; run(setup); const r = run(expr); return textOf(typeof r === "string" && r.length > String(c.innerHTML).length ? r : c.innerHTML); };
  const homeBase = () => page('tab="moms-plan"; momDayIn=true; mcManage=false; mpSubView="plan";', 'renderMomsPlan(document.getElementById("content"))');
  const hhToday = () => page('tab="moms-plan"; momDayIn=true; mpSubView="house"; hhView="today";', 'renderMomsPlan(document.getElementById("content"))');
  // a step: run it, then what it wrote (op, path, keys) and the whole pretend database after
  const step = async (expr) => { const m = db.log.length; let r; try { r = run(expr); } catch (e) { r = "THREW " + e.message; } await sched.run(clock.now + 1500);
    return { r, writes: db.log.slice(m).filter(w => !/^(connDiary|settings\/codeVersion)/.test(w.path)).map(w => [w.op, w.path].concat(w.keys ? [w.keys.slice().sort()] : [])), tree: JSON.stringify(db.tree.root) }; };
  return { A, db, sched, run, js, page, homeBase, hhToday, step };
}
const ADD = (label) => 'document.getElementById("mc-new").value=' + JSON.stringify(label) + '; document.getElementById("mc-new-edit").value=""; mcAdd(); Object.keys(momChoresData).filter(function(k){ return k.charAt(0)!=="_"; }).sort().pop()';
// everything a scenario does, the same way on both copies of the app
async function scenario(index, family, tree, o) {
  const out = {};
  let B = await boot(index, family, tree, o);
  out.list = B.js("mcAll()"); out.due = B.js("mcDueToday(mdTodayName())"); out.home = B.homeBase(); out.today = B.hhToday();
  out.dad = B.page('tab="moms-plan"; momDayIn=true; mpSubView="dad";', 'renderMomsPlan(document.getElementById("content"))');   // Dad's Day, his own My day
  out.edit = B.page('tab="moms-plan"; momDayIn=true; mpSubView="plan"; mcManage=true;', "mcPopHTML(_todayStr(),mdTodayName())"); B.run("mcManage=false");
  out.add = await B.step(ADD("Water the plants")); const id = out.add.r;
  out.listAfterAdd = B.js("mcAll()");
  out.cad = await B.step("mcSetCad(" + JSON.stringify(id) + ",'wk:0')");
  out.slot = await B.step("mcSetSlot(" + JSON.stringify(id) + ",'morning')");
  out.del = await B.step("mcDel(" + JSON.stringify(id) + ")");
  out.listAfterDel = B.js("mcAll()"); out.homeAfterDel = B.homeBase();
  out.errs = B.sched.errors.length;
  B = await boot(index, family, tree, o); out.delDefault = await B.step("mcDel('mc_kclose')"); out.errs += B.sched.errors.length;
  B = await boot(index, family, tree, o); out.cadDefault = await B.step("mcSetCad('mc_sheets','daily')"); out.errs += B.sched.errors.length;
  B = await boot(index, family, tree, o); out.tick = await B.step("mcToggle('mc_kclose')"); out.errs += B.sched.errors.length;
  B = await boot(index, family, tree, o);
  out.review = B.page('tab="moms-plan"; momDayIn=true; mpSubView="house"; hhView="review";', 'renderMomsPlan(document.getElementById("content"))');
  out.live = B.js("hhLiveRows().map(function(r){ return r.id; })");
  out.bring = await B.step("hhImport()"); out.errs += B.sched.errors.length;
  B = await boot(index, family, tree, o); out.seed = await B.step("mcSeedSlot('morning')"); out.seeds = B.js("MC_SEEDS"); out.errs += B.sched.errors.length;
  B = await boot(index, family, tree, o);
  out.pages = ["kitchen", "person", "levels", "habits", "week", "rooms"].map(v => { try { return B.page('tab="moms-plan"; momDayIn=true; mpSubView="house"; hhView="' + v + '";', 'renderMomsPlan(document.getElementById("content"))').length; } catch (e) { return "THREW " + e.message; } });
  out.kitchen = B.page('tab="moms-plan"; momDayIn=true; mpSubView="house"; hhView="kitchen";', 'renderMomsPlan(document.getElementById("content"))');
  out.mcDefault = B.js("MC_DEFAULT");
  out.errs += B.sched.errors.length;
  return out;
}
const same = (a, b, keys) => keys.filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
const KEYS = ["list", "due", "home", "dad", "today", "edit", "add", "listAfterAdd", "cad", "slot", "del", "listAfterDel", "homeAfterDel", "delDefault", "cadDefault", "tick", "review", "live", "bring", "seed", "pages", "kitchen", "errs"];

(async () => {
  console.log("test_newfam_mom_list_empty.js — a new family's Mom list starts empty; Howe's 8 stay Howe's");
  // ── 1. a brand-new family, nothing saved ───────────────────────────────────────────────────────────────────────────
  const N = await scenario(INDEX, FAMILY, {}), N0 = await scenario(BASE, FAMILY, {});
  const MCL = Object.values(N.mcDefault).map(c => c.label.replace(/^[^A-Za-z]+/, "").replace(/\s*\(.*\)$/, ""));   // Howe's 8, read from the app
  ok(MCL.length === 8, "Howe's 8 Mom chores read from the app", MCL);
  ok(Object.keys(N0.list).length === 8 && MCL.some(l => N0.home.indexOf(l) >= 0), "baseline: a new family WAS shown Howe's 8 (the leak this fixes)", Object.keys(N0.list));
  ok(JSON.stringify(N.list) === "{}" && N.due.length === 0, "new family: mcAll() is empty, nothing due", N.list);
  ok(MCL.every(l => N.home.indexOf(l) < 0 && N.today.indexOf(l) < 0 && N.edit.indexOf(l) < 0), "new family: none of Howe's 8 on Home Base, Household ▸ Today or the ✎ Edit list");
  ok(/🧹 Ongoing .{0,12}Nothing here yet — add the things you actually do\./.test(N.home), "new family: Home Base ▸ My day ▸ 🧹 Ongoing says \"Nothing here yet — add the things you actually do.\"", (N.home.match(/🧹 Ongoing.{0,120}/) || [""])[0]);
  ok(N.home.indexOf("Nothing of yours due today") < 0, "…not \"Nothing of yours due today 🎉\" (she has no list yet)");
  ok(/Mom Nothing due today\./.test(N.today), "new family: Household ▸ Today reads \"Mom — Nothing due today.\"", (N.today.match(/Mom .{0,60}/) || [""])[0]);
  ok(/Nothing here yet — add your first chore below\./.test(N.edit), "new family: ✎ Edit list reads \"Nothing here yet — add your first chore below.\"");
  // her first chore: only hers is written — no Howe rows, no _seeded
  ok(N.add.writes.length === 1 && N.add.writes[0][0] === "set" && N.add.writes[0][1] === "momChores/" + N.add.r, "first add writes ONE thing: momChores/<her new id>", N.add.writes);
  ok(N0.add.writes.length === 10 && N0.add.writes.filter(w => /^momChores\/mc_/.test(w[1])).length >= 8, "baseline: the same first add wrote Howe's 8 + _seeded + hers (10 writes)", N0.add.writes.length);
  const mcT = JSON.parse(N.add.tree).momChores || {};
  ok(Object.keys(mcT).join() === N.add.r && mcT[N.add.r].label === "Water the plants" && mcT._seeded === undefined, "…the database then holds her one chore and no _seeded mark", mcT);
  ok(Object.keys(N.listAfterAdd).join() === N.add.r, "…and her list is just that chore", N.listAfterAdd);
  ok(JSON.stringify(N.cad.writes) === JSON.stringify([["set", "momChores/" + N.add.r + "/cad"]]), "first day change writes only momChores/<id>/cad", N.cad.writes);
  ok(JSON.stringify(N.slot.writes) === JSON.stringify([["set", "momChores/" + N.add.r + "/slot"]]), "time of day writes only momChores/<id>/slot", N.slot.writes);
  ok(JSON.stringify(N.del.writes) === JSON.stringify([["remove", "momChores/" + N.add.r]]), "delete writes only the remove of her chore", N.del.writes);
  ok(JSON.stringify(N.listAfterDel) === "{}" && /Nothing here yet — add the things you actually do\./.test(N.homeAfterDel), "…after it the list is empty again, Howe's 8 do not come back, and the empty line shows");
  ok(N.delDefault.writes.length === 0 && N.cadDefault.writes.length === 0 && N.tick.writes.length === 0, "a Howe chore id (✕ mc_kclose, a day on mc_sheets, a tick on mc_kclose) writes nothing for her",
    [N.delDefault.writes, N.cadDefault.writes, N.tick.writes]);
  ok(N0.delDefault.writes.length > 0, "baseline: ✕ on a shown Howe chore DID seed her database", N0.delDefault.writes.length);
  // 📥 Bring in
  ok(N.live.length === 0 && /\(0 rows\)/.test(N.review), "📥 Bring in finds no rows for her (\"… (0 rows)\")", N.live);
  ok(N0.live.filter(id => /^mc_mc_/.test(id)).length === 8 && /\(8 rows\)/.test(N0.review), "baseline: Bring in offered Howe's 8 (\"(8 rows)\")", N0.live);
  ok(N.bring.r === 0 && N.bring.writes.length === 0, "Bring in writes nothing (no household/jobs/mc_* row, no meta/imported)", N.bring.writes);
  // ✨ Start with the morning basics (MC_SEEDS is not changed in this slice — what it writes now)
  const seedW = N.seed.writes.map(w => w[1]), seedT = JSON.parse(N.seed.tree).momChores || {};
  ok(seedW.length === N.seeds.morning.length && seedW.every(p => /^momChores\/mc[0-9a-z]+$/.test(p) && !/^momChores\/mc_/.test(p)) && seedT._seeded === undefined,
    "✨ morning basics writes only its " + N.seeds.morning.length + " starter rows (no Howe 8, no _seeded)", seedW);
  ok(Object.values(seedT).map(c => c.label).sort().join("|") === N.seeds.morning.slice().sort().join("|"), "…the rows are exactly MC_SEEDS.morning (unchanged in this slice)", Object.values(seedT).map(c => c.label));
  // the other readers of her list draw with an empty list
  ok(N.pages.every(n => typeof n === "number" && n > 100), "Household ▸ Kitchen / By person / Levels / Habits / Week / Rooms draw with an empty Mom list", N.pages);
  ok(/when you tick your 🌙 Kitchen close-down/.test(N.kitchen), "(not changed here) the Kitchen tab hint still names a \"Kitchen close-down\" — reported, known #1k in test_new_family_clean.js");
  ok(N.dad === N0.dad && /Nothing of yours due today\. 🎉/.test(N.dad), "Dad's Day (his own My day, empty) draws exactly as before — the new line is Mom's only", (N.dad.match(/Ongoing.{0,80}/) || [""])[0]);
  ok(N.errs === 0, "no timer threw for the new family", N.errs);
  const dN = same(N, N0, ["pages", "kitchen", "edit", "today"]);
  ok(dN.indexOf("today") >= 0, "(sanity) the new family's pages differ from the baseline where they should", dN);

  // ── 2. Howe: the same as before, byte for byte (lists, pages, writes, the database after each step) ─────────────────
  const H = await scenario(INDEX, undefined, {}), H0 = await scenario(BASE, undefined, {});
  ok(JSON.stringify(H.list) === JSON.stringify(H.mcDefault), "Howe: mcAll() is still its 8 chores");
  ok(H.add.writes.length === 10, "Howe: the first add still writes its 8 + _seeded + the new one", H.add.writes.length);
  ok(H.live.filter(id => /^mc_mc_/.test(id)).length === 8, "Howe: Bring in still offers its 8");
  const dH = same(H, H0, KEYS);
  ok(dH.length === 0, "Howe: every list, page, write and database state matches the baseline", dH.map(k => [k, String(JSON.stringify(H[k])).slice(0, 160), String(JSON.stringify(H0[k])).slice(0, 160)]));

  // ── 3. a non-Howe family that already has its own list — unchanged ───────────────────────────────────────────────────
  const OWN = { momChores: { mcown1: { label: "Sweep the porch", cad: "daily", ts: 11 }, mcown2: { label: "Water the ferns", cad: "wk:1", ts: 12 }, _seeded: true } };
  const O = await scenario(INDEX, FAMILY, OWN), O0 = await scenario(BASE, FAMILY, OWN);
  ok(Object.keys(O.list).sort().join() === "mcown1,mcown2", "saved list (+_seeded): her own two chores", O.list);
  const dO = same(O, O0, KEYS);
  ok(dO.length === 0, "saved list (+_seeded): every list, page, write and database state matches the baseline", dO);
  const OWN2 = { momChores: { mcown1: { label: "Sweep the porch", cad: "daily", ts: 11 } } };   // saved before _seeded existed
  const Q = await scenario(INDEX, FAMILY, OWN2), Q0 = await scenario(BASE, FAMILY, OWN2);
  const dQ = same(Q, Q0, KEYS);
  ok(Object.keys(Q.list).join() === "mcown1" && dQ.length === 0, "saved list without _seeded: unchanged too", dQ);
  // a non-Howe family on 🏡 Take over (the table is the list) — unchanged
  const TK = { household: { meta: { takeover: 1 }, jobs: { m_tea: { label: "Morning tea", who: "mom", slot: "morning", cad: "daily", area: "health", status: "active", verdict: "", note: "", src: { kind: "momChore", id: "tea" }, order: 0 } } } };
  const K = await scenario(INDEX, FAMILY, TK), K0 = await scenario(BASE, FAMILY, TK);
  const dK = same(K, K0, KEYS);
  ok(Object.keys(K.list).indexOf("m_tea") >= 0 || Object.values(K.list).some(c => c && c.label === "Morning tea"), "Take over: her table's Mom row is her list", Object.keys(K.list));
  ok(dK.length === 0, "Take over: every list, page, write and database state matches the baseline", dK);

  // ── 4. ?dryrun=1 writes nothing ───────────────────────────────────────────────────────────────────────────────────
  const D = await scenario(INDEX, FAMILY, {}, { dry: true });
  const dw = ["add", "cad", "slot", "del", "delDefault", "cadDefault", "tick", "bring", "seed"].filter(k => D[k].writes.length);
  ok(dw.length === 0, "?dryrun=1: add, edit, delete, Bring in and the basics write nothing", dw.map(k => [k, D[k].writes]));
  ok(JSON.stringify(D.list) === "{}", "?dryrun=1: the list is empty the same way");

  console.log((fail ? "FAIL" : "PASS") + " — " + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error("CRASH", e); process.exit(1); });
