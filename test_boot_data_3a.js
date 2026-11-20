// 3a — less data at every start (her "Yes, start 3a" 2026-11-19; REPORT_phone_battery_2026-11-09.md step 3a).
//   DIGESTLAZY: digest/ (~190 KB) loads when History ▸ Report opens; nothing freezes or writes before it has arrived.
//   SCANLAZY:   Book Sprints read library/scans/<one book> (~2 KB) instead of all of library/scans (~108 KB).
//   DONEORDER:  curriculum/done is attached after the whole-curriculum listener, so it is never downloaded twice.
// Left out on purpose (needed on the schedule itself): workbooks (every card's 📕 Open Ex. chip) and notebookSettings
// (the 📱 tablet-notebook chips) — those need per-book / per-kid listeners, a later step.
const fs = require("fs"), path = require("path"), vm = require("vm");
const dir = process.argv[2] || __dirname;
const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ✓ " + n); } else { fail++; console.log("  ✗ " + n + (x !== undefined ? "  → " + JSON.stringify(x) : "")); } };
const block = name => { const m = new RegExp("// " + name + "_START[\\s\\S]*?// " + name + "_END").exec(html); return m ? m[0] : ""; };
const fnSrc = name => { const a = html.indexOf("function " + name + "("); if (a < 0) return ""; const b = html.indexOf("\n}\n", a); return html.slice(a, b + 2); };

console.log("── the boot listeners (initFb) ──");
const ia = html.indexOf("function initFb() {"), ib = html.indexOf("\n}\n", ia), initFb = html.slice(ia, ib);
ok("initFb found", ia > 0 && ib > ia);
ok("no whole-node digest listener at start-up", !/db\.ref\("digest"\)\.(on|once)/.test(initFb));
ok("no whole-node library/scans listener at start-up", !/db\.ref\("library\/scans"\)\.(on|once)/.test(initFb));
const iCur = initFb.indexOf('db.ref("curriculum").on("value"'), iDone = initFb.indexOf('db.ref("curriculum/done").on("value"');
ok("both curriculum listeners are still there", iCur > 0 && iDone > 0);
ok("DONEORDER: curriculum is attached before curriculum/done (served from it, never fetched twice)", iCur > 0 && iDone > iCur);
ok("the done listener still keeps currData.done live and repaints the Grid", /db\.ref\("curriculum\/done"\)\.on\("value",s=>\{\n\s*if\(!currData\) currData=\{\};\n\s*currData\.done=s\.val\(\)\|\|\{\};/.test(initFb));
ok("the boot still reads workbooks and notebookSettings (the schedule needs them)", /db\.ref\("workbooks"\)\.on/.test(initFb) && /db\.ref\("notebookSettings"\)\.on/.test(initFb));

// a fake Realtime Database: records listeners; deliver(path, value) fires them
function fakeDb() {
  const L = [];
  return { L, ref(p) { return { on(ev, cb, err) { L.push({ p, cb, err }); }, once() { throw new Error("no once expected: " + p); }, set() { throw new Error("no write expected: " + p); }, update() { throw new Error("no write expected: " + p); } }; },
    deliver(p, v) { L.filter(x => x.p === p).forEach(x => x.cb({ val: () => v })); } };
}

console.log("\n── DIGESTLAZY ──");
{ const src = block("DIGESTLAZY"); ok("block present", !!src);
  const db = fakeDb(); let renders = 0;
  const ctx = { db, digestData: {}, renderAllSoon: () => renders++ }; vm.createContext(ctx);
  vm.runInContext(src + "\nthis.digestEnsure=digestEnsure;", ctx);
  ok("first ask: not ready, starts loading digest/", ctx.digestEnsure() === false && db.L.length === 1 && db.L[0].p === "digest");
  ok("asking again while loading opens no second listener", ctx.digestEnsure() === false && db.L.length === 1);
  db.deliver("digest", { report: { week30: { frozenAt: 1 } }, mute: { x: true } });
  ok("on arrival: digestData is the node, the screen redraws once", ctx.digestData.report.week30.frozenAt === 1 && renders === 1, { renders });
  ok("…and it is ready from then on", ctx.digestEnsure() === true && db.L.length === 1);
  db.deliver("digest", { report: {} });
  ok("a later change from another device follows, without another forced redraw", JSON.stringify(ctx.digestData) === '{"report":{}}' && renders === 1);
  const ctx2 = { db: null, digestData: {} }; vm.createContext(ctx2); vm.runInContext(src + "\nthis.digestEnsure=digestEnsure;", ctx2);
  ok("no connection object: ready at once (works on what it has, as before)", ctx2.digestEnsure() === true); }
{ const rh = fnSrc("renderHistoryReport");
  ok("the report shows Loading (after the Mom-only check) until digest/ is here", /momHere\(\)\) return [^\n]*\n\s*if\(typeof digestEnsure==="function"&&!digestEnsure\(\)\) return '[^']*Loading the weekly report/.test(rh));
  const fz = fnSrc("digestFreezeIfNeeded");
  ok("digestFreezeIfNeeded never runs before digest/ is here", /if\(wkKey===WK\) return null;\n\s*if\(typeof digestEnsure==="function"&&!digestEnsure\(\)\) return null;/.test(fz));
  // run it for real: not ready → null, and no write (the fake db throws on any write)
  const db = fakeDb(); const ctx = { db, WK: "week31", digestData: {}, archive: { week30: {} }, masteryData: { a: 1 }, renderAllSoon() {},
    digestBuildWeekReport() { throw new Error("must not build"); }, digestGatherData() { return {}; } };
  vm.createContext(ctx); vm.runInContext(block("DIGESTLAZY") + "\n" + fz + "\nthis.f=digestFreezeIfNeeded;", ctx);
  let r, err = null; try { r = ctx.f("week30"); } catch (e) { err = e.message; }
  ok("an archived week asked before digest/ arrives: nothing built, nothing written", r === null && !err, err); }

console.log("\n── SCANLAZY ──");
{ const src = block("SCANLAZY"); ok("block present", !!src);
  const db = fakeDb(); let mast = 0, renders = 0;
  const ctx = { db, tab: "schedule", lbScansMS: {}, _mastRe: () => mast++, renderAllSoon: () => renders++, momHere: () => true, mathSprints: {}, nowTs: () => "t", dbg() {}, _dryRun: () => false, writes: [] };
  vm.createContext(ctx);
  vm.runInContext("let lbScansMSx;\n" + src + "\n" + fnSrc("msBookList") + "\n" + fnSrc("msSetPosition") + "\nthis.msBookList=msBookList;this.msScanEnsure=msScanEnsure;this.msScanReady=msScanReady;this.msSetPosition=msSetPosition;", ctx);
  ok("first read of a book: empty for now, and ONE listener on that book only", JSON.stringify(ctx.msBookList("sm-sprints-4")) === "[]" && db.L.length === 1 && db.L[0].p === "library/scans/sm-sprints-4", db.L.map(x => x.p));
  ctx.msBookList("sm-sprints-4"); ctx.msBookList("sm-sprints-4");
  ok("reading it again opens no second listener", db.L.length === 1);
  db.deliver("library/scans/sm-sprints-4", { lessons: ["Sprint 402 · Fractions (p. 3)", "Sprint 401 · Adding"] });
  ok("on arrival the list is there, in order", JSON.stringify(ctx.msBookList("sm-sprints-4")) === '[{"n":401,"title":"Adding"},{"n":402,"title":"Fractions"}]');
  ok("on the schedule the first arrival redraws once", renders === 1 && mast === 0, { renders, mast });
  ctx.tab = "mastery"; db.deliver("library/scans/sm-sprints-4", { lessons: ["Sprint 401 · Adding (edited)"] });
  ok("an edit from another device arrives and redraws Mastery (as the old listener did)", ctx.msBookList("sm-sprints-4")[0].title === "Adding (edited)" && mast === 1);
  db.deliver("library/scans/sm-sprints-4", null);
  ok("a removed scan empties the list", JSON.stringify(ctx.msBookList("sm-sprints-4")) === "[]");
  ctx.msBookList(undefined); ctx.msBookList("bad/../path"); ctx.msBookList("");
  ok("no listener for a missing or odd book id", db.L.length === 1, db.L.map(x => x.p));
  // msSetPosition on a book nobody has read yet: loads it first, then sets the first sprint (never cur:null)
  const upd = []; ctx.db.ref = (p) => ({ on(ev, cb, err) { db.L.push({ p, cb, err }); }, update(u) { upd.push({ p, u }); } });
  ctx.msSetPosition("lincoln", "sm-sprints-5", null, "picked");
  ok("Mom picks a book not read yet: nothing saved before its list arrives", upd.length === 0 && db.L.some(x => x.p === "library/scans/sm-sprints-5"));
  db.deliver("library/scans/sm-sprints-5", { lessons: ["Sprint 501 · Ratios", "Sprint 502 · Rates"] });
  (async () => {
    await new Promise(r => setTimeout(r, 0));
    ok("…then it saves that book at its first sprint", upd.length === 1 && upd[0].p === "mathSprints/lincoln" && upd[0].u.book === "sm-sprints-5" && upd[0].u.cur === 501, upd);
    ctx.msSetPosition("lincoln", "sm-sprints-5", 502, "tapped");
    ok("a book already read saves at once (as before)", upd.length === 2 && upd[1].u.cur === 502, upd[1] && upd[1].u);
    ctx.lbScansMS["sm-sprints-6"] = { lessons: ["Sprint 601 · A", "Sprint 602 · B"] };   // a list already in memory (e.g. just edited here)
    const before = upd.length; ctx.msSetPosition("lincoln", "sm-sprints-6", null, "picked");
    ok("a book whose list is already in memory saves at once (first sprint)", upd.length === before + 1 && upd[before].u.cur === 601, upd[before] && upd[before].u);
    { const c4 = { db: { ref() { return {}; } }, tab: "schedule", lbScansMS: {} }; vm.createContext(c4); vm.runInContext(src + "\nthis.e=msScanEnsure;this.r=msScanReady;", c4);
      let t4 = null; try { await c4.e("sm-sprints-1"); } catch (e) { t4 = e.message; }
      ok("a connection that can't listen: no error, the list just stays empty", t4 === null && c4.r("sm-sprints-1") === true, t4); }
    const ctx3 = { db: null, tab: "x", lbScansMS: {} }; vm.createContext(ctx3); vm.runInContext(src + "\nthis.e=msScanEnsure;", ctx3);
    let threw = null; try { await ctx3.e("sm-sprints-4"); } catch (e) { threw = e.message; }
    ok("no connection object: nothing to load, no error", threw === null);
    console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
  })();
}
