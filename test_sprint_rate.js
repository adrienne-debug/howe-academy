/*
 * ⏱ SPRINTRATE — finish early + right per minute (PLAN_learning_system_2026-10-24 §4 rules 2–3; her yes 2026-10-24).
 * A sheet holds each card once, so a fast kid finished early, the clock ran out the minute and the score was "100% of
 * the sheet". Now tapping the LAST item stops the clock and keeps the seconds ("20 in 32 s"); untapped items are his
 * misses; every logged result records clk / secsA / secsB / finA / rpmA / rpmB / rpm; results show against his own best
 * per minute for the same deck + source (never a sibling's); old entries without seconds read as before.
 *   run:  node test_sprint_rate.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// SPRINTRATE_START"), b = src.indexOf("// SPRINTRATE_END");
if (a < 0 || b < 0) { console.error("SPRINTRATE markers not found"); process.exit(1); }
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
const fn = (name) => { const s = src.indexOf("function " + name + "("); if (s < 0) throw new Error("no " + name); return src.slice(s, src.indexOf("\n}\n", s) + 2); };
const block = src.slice(a, b);

// A tiny DOM: one sheet "A" with N tappable cells (ids sp-cell-A-<pos>), the timer button, result line, inputs.
function world(o) {
  o = o || {};
  const els = {};
  const mk = (id, extra) => (els[id] = Object.assign({ id, style: {}, dataset: {}, textContent: "", innerHTML: "", value: "" }, extra || {}));
  const cells = [];
  for (let i = 0; i < (o.n || 5); i++) cells.push(mk("sp-cell-A-" + i, { dataset: { wc: "#000", fw: "500" } }));
  mk("sp-timer-btn-A", { dataset: o.bonus ? { col: "#5b3a8c", bonus: "1" } : { col: "#5b3a8c" } });
  ["sp-timer-disp-A", "sp-timer-res-A", "sp-timer-count-A", "sp-score-a", "sp-err-a"].forEach(id => mk(id));
  const ctx = { console, Object, Array, String, Number, Math, JSON, parseInt, isNaN, Date: { now: () => ctx._now },
    _now: 1000000, masteryKid: "lincoln", sprintSource: "drill", sprintDeck: "AAS Words",
    masteryData: { sprintLog: o.log || {} }, sprintLive: {}, els, gainCalls: 0,
    document: { getElementById: id => els[id] || null, querySelectorAll: sel => sel === ".sp-live-cell-A" ? cells : [] },
    setInterval: () => 1, clearInterval: () => {} };
  vm.createContext(ctx);
  vm.runInContext([block, fn("sprintLiveStart"), fn("sprintLiveTap"), fn("sprintLiveEnd"),
    "function sprintCurrentSeconds(){ return 60; }", "function sprintLivePaint(){}",
    "function sprintUpdateGain(){ gainCalls++; }", "function _sprintUnitRound(){ return null; }", "function laLogLabel(){ return 'Rules'; }"].join("\n"), ctx);
  return { ctx, els, call: e => vm.runInContext(e, ctx) };
}

console.log("── per minute ──");
{
  const w = world();
  ok("20 in 32 s = 37.5 a minute", w.call("sprintRate(20,32)") === 37.5);
  ok("20 in 60 s = 20", w.call("sprintRate(20,60)") === 20);
  ok("no seconds → no rate", w.call("sprintRate(20,null)") === null && w.call("sprintRate(20,0)") === null);
  ok("0 right in 30 s = 0", w.call("sprintRate(0,30)") === 0);
}

console.log("── finish early: the last item stops the clock ──");
{
  const w = world({ n: 5 });
  w.call("sprintLiveStart('A',5)");
  w.ctx._now += 3000; w.call("sprintLiveTap('A',0)");
  w.ctx._now += 3000; w.call("sprintLiveTap('A',1)");
  w.ctx._now += 3000; w.call("sprintLiveTap('A',3)");   // he went past #2
  ok("still running before the last item", w.call("sprintLive.A.running") === true);
  w.ctx._now += 3000; w.call("sprintLiveTap('A',4)");   // last item, 12 s in
  const st = w.call("sprintLive.A");
  ok("the clock stopped", st.running === false && st.fin === true);
  ok("seconds kept: 12", st.used === 12, st.used);
  ok("misses = the item he went past", st.miss === 1, st.miss);
  ok("score box filled with the count", w.els["sp-score-a"].value === 4);
  ok("misses box filled", w.els["sp-err-a"].value === 1);
  ok("result line says finished, the seconds, the per minute", /Finished! 4 of 5 in 12 s/.test(w.els["sp-timer-res-A"].innerHTML) && /20 a minute/.test(w.els["sp-timer-res-A"].innerHTML), w.els["sp-timer-res-A"].innerHTML);
  ok("display says Done!", w.els["sp-timer-disp-A"].textContent === "Done!");
  // Mom fixes a mis-tap on the finished sheet: #2 was read right after all
  w.call("sprintLiveTap('A',2)");
  ok("a correction still counts on a finished sheet", w.call("sprintLive.A.count") === 5 && w.call("sprintLive.A.miss") === 0);
  ok("the corrected count reaches the score box", w.els["sp-score-a"].value === 5 && w.els["sp-err-a"].value === 0);
  ok("the clock did not restart", w.call("sprintLive.A.running") === false && w.call("sprintLive.A.used") === 12);
}
{
  const w = world({ n: 3 });
  w.call("sprintLiveStart('A',3)");
  w.ctx._now += 2000; w.call("sprintLiveTap('A',2)"); w.call("sprintLiveTap('A',0)");
  ok("tapping the last cell first (out of order) ends it", w.call("sprintLive.A.fin") === true);
  const w2 = world({ n: 3 });
  w2.call("sprintLiveStart('A',3)");
  w2.call("sprintLiveTap('A',1)"); w2.call("sprintLiveTap('A',0)");
  ok("not finished while the last item is untapped", w2.call("sprintLive.A.running") === true);
}
{
  const w = world({ n: 5, bonus: true });
  w.call("sprintLiveStart('A',5)");
  for (let i = 0; i < 5; i++) w.call("sprintLiveTap('A'," + i + ")");
  ok("a Bonus Zone sheet keeps running past the grid", w.call("sprintLive.A.running") === true);
}
{
  const w = world({ n: 40 });
  w.call("sprintLiveStart('A',40)");
  for (let i = 0; i < 25; i++) w.call("sprintLiveTap('A'," + i + ")");
  w.call("sprintLive.A.remaining=0"); w.ctx._now += 61500; w.call("sprintLiveEnd('A')");
  const st = w.call("sprintLive.A");
  ok("time ran out: the full minute, not finished", st.used === 60 && st.fin === false);
  ok("no auto misses when time ran out", st.miss === null);
  ok("result: 25 read in 60 s · 25 a minute", /25 read in 60 s/.test(w.els["sp-timer-res-A"].innerHTML) && /25 a minute/.test(w.els["sp-timer-res-A"].innerHTML));
  const w2 = world({ n: 40 });
  w2.call("sprintLiveStart('A',40)");
  for (let i = 0; i < 10; i++) w2.call("sprintLiveTap('A'," + i + ")");
  w2.ctx._now += 20000; w2.call("sprintLiveEnd('A')");
  ok("■ Stop keeps the seconds used", w2.call("sprintLive.A.used") === 20);
}

console.log("── log fields ──");
{
  const w = world();
  const f = w.call("sprintRateFields(20,24,{used:32,fin:true},{used:60,fin:false},60)");
  ok("clk + live seconds + finished flag", f.clk === 60 && f.secsA === 32 && f.finA === true && f.secsB === 60 && !("finB" in f), f);
  ok("rpm per sheet and the better one", f.rpmA === 37.5 && f.rpmB === 24 && f.rpm === 37.5, f);
  const t = w.call("sprintRateFields(18,null,null,null,45)");
  ok("typed score, no live clock → per the clock length", t.clk === 45 && !("secsA" in t) && t.rpmA === 24 && t.rpm === 24, t);
  const z = w.call("sprintRateFields(0,0,null,null,60)");
  ok("nothing scored → only clk", JSON.stringify(z) === '{"clk":60}', z);
  ok("no undefined values (Firebase refuses them)", !Object.values(f).some(v => v === undefined));
}

console.log("── his own best, per deck + source ──");
{
  const log = { lincoln: [
    { deck: "AAS Words", src: "drill", a: 20, secsA: 40, ts: 1 },            // 30 a minute
    { deck: "AAS Words", src: "drill", a: 22, rpm: 33, ts: 2 },              // stored rpm wins
    { deck: "Math Facts", src: "drill", a: 50, secsA: 30, ts: 3 },           // other deck: 100 — never compared
    { deck: "AAS Words", src: "phonogram", a: 60, secsA: 30, ts: 4 },        // other source
    { deck: "AAS Words", src: "drill", a: 30, best: 30, ts: 5 } ],            // old entry: no seconds → no rate
    ellis: [{ deck: "AAS Words", src: "drill", a: 90, secsA: 30, ts: 6 }] }; // a sibling — never read
  const w = world({ log });
  ok("best per minute for this deck + source only", w.call("sprintBestRpm(masteryData.sprintLog.lincoln,'AAS Words','drill')") === 33);
  ok("the entry just logged is left out", w.call("sprintBestRpm(masteryData.sprintLog.lincoln,'AAS Words','drill',2)") === 30);
  ok("an old entry without seconds has no per minute", w.call("sprintEntryRpm({a:30,b:28,best:30})") === null);
  ok("an old entry with a clock length derives it", w.call("sprintEntryRpm({a:30,clk:60})") === 30);
  ok("Firebase object form reads too", w.call("sprintBestRpm({x:{deck:'D',src:'drill',a:10,secsA:20}},'D','drill')") === 30);
  ok("vs best: beats it", /new best a minute \(was 33\)/.test(w.call("sprintRateVsBest(37.5,33)")));
  ok("vs best: below it", /own best 33 a minute/.test(w.call("sprintRateVsBest(30,33)")));
  ok("vs best: first timed one", /first one timed/.test(w.call("sprintRateVsBest(30,null)")));
  ok("the log note compares to his best only", /37.5 a minute · 🏆 new best a minute \(was 33\)/.test(w.call("sprintRateLogNote({deck:'AAS Words',src:'drill',a:20,secsA:32,rpm:37.5,ts:9},masteryData.sprintLog.lincoln)")));
  ok("the live result reads only this kid's log", /own best 33|new best/.test((() => { const w2 = world({ n: 2, log }); w2.call("sprintLiveStart('A',2)"); w2.ctx._now += 4000; w2.call("sprintLiveTap('A',0)"); w2.call("sprintLiveTap('A',1)"); return w2.els["sp-timer-res-A"].innerHTML; })()));
}

console.log("── Scores ──");
{
  const w = world();
  ok("an entry with seconds shows them + per minute", w.call("sprintScoresRateHtml({a:20,b:null,secsA:32,finA:true,clk:60,rpmPB:true})").includes("A 20 in 32 s 🏁 = 37.5/min") );
  ok("…and the ⚡ best a minute mark", w.call("sprintScoresRateHtml({a:20,secsA:32,clk:60,rpmPB:true})").includes("best a minute"));
  ok("a typed entry shows per the clock", w.call("sprintScoresRateHtml({a:18,clk:45})").includes("A 24/min"));
  ok("an old entry shows nothing new", w.call("sprintScoresRateHtml({a:20,b:22})") === "");
  ok("headline best a minute only for one deck", w.call("sprintScoresBestRpmHtml([{rpm:30},{rpm:37.5},{rpm:null}],true)").includes("Best a minute: 37.5") && w.call("sprintScoresBestRpmHtml([{rpm:30}],false)") === "");
  // the trend keeps per-minute bests per deck + source
  const tw = vm.createContext({ console, Object, Array, String, Number, Math });
  vm.runInContext(block + fn("mastSprintBestTrend"), tw);
  const t = vm.runInContext("mastSprintBestTrend([{date:'2026-10-01',deck:'D',src:'drill',a:20,secsA:40},{date:'2026-10-02',deck:'E',src:'drill',a:10,secsA:60},{date:'2026-10-03',deck:'D',src:'drill',a:20,secsA:30},{date:'2026-10-04',deck:'D',src:'drill',a:25,best:25}])", tw);
  ok("series carries rpm (old entry: null)", t.series.map(x => x.rpm).join(",") === "30,10,40,", t.series.map(x => x.rpm));
  ok("best a minute is per deck: E's first is its own best, D beats its own", t.series.map(x => x.rpmPB).join(",") === "true,true,true,false");
  ok("the old words/60s best is unchanged", t.currentBest === 25);
}

console.log("── wiring ──");
{
  const log = src.slice(src.indexOf("function sprintLogResult("), src.indexOf("async function sprintGenerate("));
  ok("Log result adds the rate fields", log.includes("Object.assign(entry,sprintRateFields(a,b,la,lb,sprintCurrentSeconds()))"));
  ok("Log result uses the shared deck label", log.includes("const deck=sprintCurrentDeckLabel();"));
  ok("Log result says per minute vs his own best", log.includes("sprintRateLogNote(entry,masteryData.sprintLog[kid])"));
  ok("the write path is the same single push", (log.match(/db\.ref\(/g) || []).length === 1 && log.includes('if(db&&!_dryRun()) db.ref("mastery/sprintLog/"+kid).push(entry)'));
  const row = fn("sprintScoreRowHtml");
  ok("the misses box shows for every kid", row.includes("const errCell=(sheet,col)=>`<input") && !row.includes("errCell=(sheet,col)=>showErr?"));
  ok("phonogram sheet flags a Bonus Zone on its Start button", fn("sprintBuildSheet").includes("sprintSheetHasBonus(parsed,ps)?' data-bonus=\"1\"'"));
  ok("drill grid log slot untouched", log.includes("gs:isPhon?sprintPillState.gs:(isEd?laSize:sprintDrillLoggedGs())"));
  const sc = src.slice(src.indexOf("R6: Sprint personal-best trend"), src.indexOf("Only racing themselves"));
  ok("Scores rows show seconds + per minute", sc.includes("sprintScoresRateHtml(s)"));
  ok("Scores headline shows best a minute for one deck", sc.includes("sprintScoresBestRpmHtml(_st.series,mastSprintDeckFilter!==\"__all__\"||_dOrder.length<=1)"));
  ok("Book Sprints untouched", !src.slice(src.indexOf("// MSPRINT_START"), src.indexOf("// MSPRINT_END")).includes("sprintRate"));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
