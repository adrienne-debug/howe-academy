/*
 * 🗣 MOMSAYS — the Mom-says sprint (PLAN_learning_system_2026-10-24 §4; her yes 2026-10-24, pass rule included).
 * He stands where he can't see the screen; Mom sees each prompt WITH its answer; ✓ right · ✗ no (one more try) · Pass;
 * against the clock. Pool = the sprint gate's pool, SPRINTMIN 20 with "Sprint anyway". Per card on Save: ✓ on a DUE card
 * = its review through mastApplyScores; ✓ not due = logged only; spelling pass = neutral, 3 sprints in a row → Word
 * Workout; other decks' pass = a miss; 2 sprints in a row missed → back to learning. Finish-early + per minute
 * (SPRINTRATE). Answers only on Mom's screen. ?dryrun=1 writes nothing.
 *   run:  node test_mom_says_sprint.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
if (src.indexOf("// MOMSAYS_START") < 0 || src.indexOf("// MOMSAYS_END") < 0) { console.error("MOMSAYS markers not found"); process.exit(1); }
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
const fn = (name) => { const s = src.indexOf("function " + name + "("); if (s < 0) throw new Error("no " + name); return src.slice(s, src.indexOf("\n}\n", s) + 2); };
const line = (start) => { const s = src.indexOf(start); if (s < 0) throw new Error("no " + start); return src.slice(s, src.indexOf("\n", s)); };
const block = (m) => src.slice(src.indexOf("// " + m + "_START"), src.indexOf("// " + m + "_END"));

const PN = 50;
function world(o) {
  o = o || {};
  const ctx = { console, Object, Array, String, Number, Math, JSON, Set, parseInt, isNaN,
    Date: Object.assign(function () { return new Date(); }, { now: () => ctx._now }), _now: 5000000,
    masteryKid: "lincoln", sprintSource: "momsays", sprintDeck: "__all__", sprintDeckScope: null, sprintNum: 7, sprintDate: "2026-10-24",
    masteryData: { lincoln: o.items || [], sprintLog: o.log ? { lincoln: o.log } : {}, history: null },
    _mom: o.mom !== false, _dry: !!o.dry, refs: [], rerenders: 0, HA_LS: { setItem() {} },
    MAST_CAT_EMOJI_MAP: {}, setInterval: () => 1, clearInterval: () => {}, confirm: () => true };
  ctx.db = { ref: (p) => ({ update: (v) => ctx.refs.push({ p, op: "update", v: JSON.parse(JSON.stringify(v)) }),
    push: (v) => ctx.refs.push({ p, op: "push", v: JSON.parse(JSON.stringify(v)) }), set: (v) => ctx.refs.push({ p, op: "set", v }) }) };
  vm.createContext(ctx);
  vm.runInContext([
    line("const MAST_TIER_ORDER="), line("const MAST_TIER_LBL="), line("const MAST_TIER_INT="), line("const WW_DECKS="),
    line("function wwIsSpell("), fn("wwWord"), fn("mastIsDue"), fn("mastStampNextDue"), fn("mastApplyScores"),
    fn("mastTierAtLeast"), fn("_unitKidLadderCfg"), fn("_unitLadderDaysToGate"), fn("_unitEtaLbl"),
    block("SPRINTMIN"), block("SPRINTRATE"), block("MOMSAYS"), fn("buildSprintSourceToggle"),
    "function momHere(){ return _mom; }", "function _dryRun(){ return _dry; }", "function _mastRe(){ rerenders++; }",
    "function wwToday(){ return '2026-10-24'; }", "function mastGetPrintNum(){ return " + PN + "; }",
    "function mastDrillSettings(){ return {ladder:['every_other_day','weekly','bi_weekly','monthly'],tier_streaks:{},ladder_streak:1,miss_drop:'zero',drop_threshold:0,close_behavior:'none',gate_tier:'weekly'}; }",
    "function mastGetDef(kid,p){ return ({'7×8':'56','Texas':'Austin'})[p]||''; }",
    "function mastIsNeverDrill(){ return false; } function mastDynamicShouldAdd(){ return false; } function mastDynamicEligible(){ return false; } function mastDynamicShouldPrune(){ return false; } var mastDynamicCapNotice=false;",
    "function mastKnowledgeType(){ return 'fact_association'; } function mastSprintSwitch(){ return true; } function mastUntimedAccuracy(){ return undefined; }",
    "function sprintDrillPool(kid,items){ return items.filter(i=>i&&i.status!=='introduction'&&mastTierAtLeast(i.tier,'weekly')&&(sprintDeck==='__all__'||i.subject===sprintDeck)); }",
    "function sprintActiveScope(){ return null; } function sprintDrillScopes(){ return []; }",
    "function sprintCurrentSeconds(){ return 60; }",
    "function haKidUnits(){ return []; } function laUnitFor(){ return null; } function msEnabled(){ return false; }",
  ].join("\n"), ctx);
  return { ctx, call: e => vm.runInContext(e, ctx) };
}
let _id = 0;
const spell = (word, extra) => Object.assign({ id: "s" + (++_id), subject: "AAS Words", prompt: word, tier: "weekly", status: "active", consecutive_correct: 0, cycle: 1, next_due: PN + 3 }, extra || {});
const fact = (p, extra) => Object.assign({ id: "f" + (++_id), subject: "Math Facts", prompt: p, tier: "weekly", status: "active", consecutive_correct: 0, cycle: 1, next_due: PN + 3 }, extra || {});
const fill = (n) => Array.from({ length: n }, (_, i) => fact("9×" + i));
// Run one sprint: plan maps card id → taps (e.g. ["c"], ["x","x"], ["p"]); unlisted cards → ✓. secsEach per tap.
function run(w, plan, opt) {
  opt = opt || {};
  w.call(opt.anyway ? "msaysAnyway()" : "msaysStart()");
  let guard = 0;
  while (w.call("msaysUI&&msaysUI.phase") === "run" && guard++ < 500) {
    if (opt.stopAfter != null && w.call("msaysUI.i") >= opt.stopAfter) { w.ctx._now += (opt.secsEach || 1) * 1000; w.call("msaysStop()"); break; }
    const id = w.call("msaysUI.ids[msaysUI.i]");
    (plan[id] || ["c"]).forEach(k => { w.ctx._now += (opt.secsEach || 1) * 1000; w.call("msaysMark('" + k + "')"); });
  }
}
const save = (w) => { w.call("msaysSave()"); w.call("msaysNew()"); };
const card = (w, id) => w.call("masteryData.lincoln").find(i => i.id === id);
const lastLog = (w) => { const l = w.call("masteryData.sprintLog.lincoln"); return l[l.length - 1]; };

console.log("── Mom only: answers never on a kid's device ──");
{
  const items = [spell("together"), fact("7×8")].concat(fill(20));
  const kidW = world({ items, mom: false });
  ok("no Mom-says pill on a kid's device", !kidW.call("buildSprintSourceToggle('#000')").includes("Mom says"));
  ok("the source shows no cards or answers to a kid", !/56|t o g e t h e r|together/.test(kidW.call("buildSprintMomSaysHtml('#000')")));
  kidW.call("msaysStart()");
  ok("a kid's device can't start one", kidW.call("msaysUI") === null);
  const w = world({ items });
  ok("Mom sees the pill", w.call("buildSprintSourceToggle('#000')").includes("Mom says"));
  w.call("msaysStart()");
  w.call("msaysUI.ids=['" + items[1].id + "','" + items[0].id + "'].concat(msaysUI.ids.filter(x=>x!=='" + items[0].id + "'&&x!=='" + items[1].id + "'))");
  const h = w.call("buildSprintMomSaysHtml('#000')");
  ok("Mom's run screen: the prompt with its answer beside it", h.includes("7×8") && h.includes('class="msays-answer"') && /msays-answer[^>]*>56</.test(h));
  w.call("msaysMark('c')");
  ok("a spelling word's answer is spelled out letter by letter", /msays-answer[^>]*>t o g e t h e r</.test(w.call("buildSprintMomSaysHtml('#000')")));
  w.call("_mom=false");
  ok("Mom mode off mid-sprint → the answers disappear", !/t o g e t h e r|msays-answer/.test(w.call("buildSprintMomSaysHtml('#000')")));
  w.call("msaysMark('c')");
  ok("…and taps are refused", w.call("msaysUI.i") === 1);
  w.call("_mom=true");
  ok("capitals / facts read the card's back", w.call("msaysAnswer('lincoln',{subject:'State Capitals',prompt:'Texas'})") === "Austin" && w.call("msaysAnswer('lincoln',{subject:'German',prompt:'Hund',answer:'dog'})") === "dog");
}

console.log("── the pool + the 20 minimum ──");
{
  const items = fill(10).concat([fact("2×2", { tier: "every_other_day" }), fact("3×3", { status: "introduction" })]);
  const w = world({ items });
  const h = w.call("buildSprintMomSaysHtml('#000')");
  ok("only cards past the gate count (10, not the climbing or learning ones)", /10<\/span> <span[^>]*>cards ready/.test(h), h.slice(0, 0));
  ok("under 20 → not enough, with Mom's Sprint anyway", h.includes("Not enough to sprint yet: 10 of 20") && h.includes("msaysAnyway()"));
  w.call("msaysStart()");
  ok("Start refuses below 20", w.call("msaysUI") === null);
  w.call("msaysAnyway()");
  ok("Sprint anyway starts it", w.call("msaysUI.phase") === "run" && w.call("msaysUI.ids.length") === 10);
  ok("…and the minimum holds again after", w.call("_msaysAnyway") === false);
  const w2 = world({ items: fill(25) });
  ok("20+ → the Start button", w2.call("buildSprintMomSaysHtml('#000')").includes("msaysStart()"));
}

console.log("── due-only promotion ──");
{
  const due = fact("6×7", { next_due: PN - 1 }), notDue = fact("6×8", { next_due: PN + 4 }), dueMiss = fact("6×9", { next_due: PN });
  const items = [due, notDue, dueMiss].concat(fill(20));
  const w = world({ items });
  run(w, { [dueMiss.id]: ["x", "x"] });
  ok("nothing written before Save", w.ctx.refs.length === 0);
  save(w);
  ok("✓ on a due card = its review: it climbs a rung", card(w, due.id).tier === "bi_weekly" && card(w, due.id).next_due > PN, card(w, due.id));
  ok("✓ on a card not due = logged only (rung + booked day unchanged)", card(w, notDue.id).tier === "weekly" && card(w, notDue.id).next_due === PN + 4);
  ok("a miss on a due card leaves it for its normal review", card(w, dueMiss.id).tier === "weekly" && card(w, dueMiss.id).status === "active" && card(w, dueMiss.id).next_due === PN);
  const e = lastLog(w);
  ok("the log lists the reviewed card", JSON.stringify(e.rev) === JSON.stringify([due.id]));
  ok("per card: id + result (+ due)", e.cards.find(c => c.id === due.id).r === "c" && e.cards.find(c => c.id === due.id).due === true && e.cards.find(c => c.id === notDue.id).due === undefined && e.cards.find(c => c.id === dueMiss.id).r === "m");
}

console.log("── spelling: pass = no credit, no penalty; 3 in a row → Word Workout ──");
{
  const word = spell("because"), items = [word].concat(fill(20));
  const w = world({ items });
  run(w, { [word.id]: ["p"] }); save(w);
  run(w, { [word.id]: ["p"] }); save(w);
  ok("2 passes: still on the ladder, no Workout", card(w, word.id).status === "active" && !(card(w, word.id).ww && card(w, word.id).ww.on));
  run(w, { [word.id]: ["p"] }); save(w);
  ok("3rd pass in a row → Word Workout on", card(w, word.id).ww && card(w, word.id).ww.on === true && card(w, word.id).ww.since === "2026-10-24");
  ok("…logged as ww", JSON.stringify(lastLog(w).ww) === JSON.stringify([word.id]));
  ok("passes never send a spelling word back to learning", card(w, word.id).status === "active");
  const ww = w.ctx.refs.filter(r => r.op === "update").pop();
  ok("the Workout rides the targeted card write", Object.keys(ww.v).some(k => /^0\/ww$/.test(k)));
  const w2 = world({ items: [spell("friend")].concat(fill(20)) }); const id2 = w2.call("masteryData.lincoln[0].id");
  run(w2, { [id2]: ["p"] }); save(w2); run(w2, { [id2]: ["c"] }); save(w2); run(w2, { [id2]: ["p"] }); save(w2); run(w2, { [id2]: ["p"] }); save(w2);
  ok("a ✓ in between starts the 3 over", !(card(w2, id2).ww && card(w2, id2).ww.on));
  const w3 = world({ items: [spell("their")].concat(fill(20)) }); const id3 = w3.call("masteryData.lincoln[0].id");
  run(w3, { [id3]: ["x", "x"] }); save(w3);
  run(w3, { [id3]: ["p"] }); save(w3);
  ok("miss, then a spelling pass: not dropped (the pass is neutral)", card(w3, id3).status === "active");
  run(w3, { [id3]: ["x", "x"] }); save(w3);
  ok("a wrong spelling = a miss: 2nd miss in a row (pass skipped) → back to learning", card(w3, id3).status === "introduction");
}

console.log("── facts, capitals, German, vocab: a pass counts like a miss; 2 → learning ──");
{
  const f = fact("8×7", { next_due: PN + 2, tally_dots: 3, drop_count: 1, consecutive_correct: 2 }), items = [f].concat(fill(20));
  const w = world({ items });
  run(w, { [f.id]: ["p"] }); save(w);
  ok("one pass: still on the ladder", card(w, f.id).status === "active");
  run(w, { [f.id]: ["x", "x"] }); save(w);
  const c = card(w, f.id);
  ok("pass + miss in 2 sprints → back to learning (the drill's drop path)", c.status === "introduction" && c.tally_dots === 0 && c.consecutive_correct === 0 && c.drop_count === 0 && c.tier === "daily" && c.next_due === undefined, c);
  ok("…logged as drop", JSON.stringify(lastLog(w).drop) === JSON.stringify([f.id]));
  const up = w.ctx.refs.filter(r => r.op === "update").pop();
  ok("the drop is a targeted write (status, dots, rung, next_due cleared)", up.p === "mastery/lincoln" && up.v["0/status"] === "introduction" && up.v["0/tier"] === "daily" && up.v["0/next_due"] === null && !("0" in up.v));
  // back on the ladder later: an old miss doesn't count again
  w.call("masteryData.lincoln[0].status='active'; masteryData.lincoln[0].tier='weekly'");
  run(w, { [f.id]: ["x", "x"] }); save(w);
  ok("after a drop the count starts over (1 new miss ≠ drop)", card(w, f.id).status === "active");
  const g = fact("9×9"), w2 = world({ items: [g].concat(fill(20)) });
  run(w2, { [g.id]: ["x", "x"] }); save(w2); run(w2, { [g.id]: ["c"] }); save(w2); run(w2, { [g.id]: ["x", "x"] }); save(w2);
  ok("miss · ✓ · miss → not 2 in a row, stays", card(w2, g.id).status === "active");
}

console.log("── retry, finish early, per minute ──");
{
  const items = fill(20), w = world({ items });
  const a0 = items[0].id, a1 = items[1].id;
  run(w, { [a0]: ["x", "c"], [a1]: ["x", "x"] }, { secsEach: 1 });
  ok("finished all 20 → the clock stopped early", w.call("msaysUI.phase") === "done" && w.call("msaysUI.fin") === true);
  const secs = w.call("msaysUI.used");
  const done = w.call("buildSprintMomSaysHtml('#000')");
  ok("results: right, seconds, per minute, own best", done.includes("19 right in " + secs + " s") && done.includes("a minute"), done.slice(0, 300));
  ok("'Say these once' lists the miss with its answer", /Say these once/.test(done) && done.includes(w.call("masteryData.lincoln[1].prompt")));
  save(w);
  const e = lastLog(w);
  ok("✗ then ✓ = right on the retry", e.cards.find(c => c.id === a0).r === "c" && e.cards.find(c => c.id === a0).retry === true);
  ok("✗ ✗ = a miss", e.cards.find(c => c.id === a1).r === "m");
  ok("logged: src, deck, right, misses, passes", e.src === "momsays" && e.deck === "Mom says · All decks" && e.a === 19 && e.best === 19 && e.errA === 1 && e.passes === 0);
  ok("logged: seconds, finished, per minute", e.secsA === secs && e.finA === true && e.clk === 60 && e.rpm === Math.round(19 * 600 / secs) / 10, e);
  const w2 = world({ items: fill(30) });
  run(w2, {}, { secsEach: 2, stopAfter: 12 });
  ok("■ Stop keeps the seconds used; unreached cards aren't scored", w2.call("msaysUI.fin") === false && w2.call("Object.keys(msaysUI.res).length") === 12);
  w2.call("msaysSave()");
  ok("per minute from the seconds used", lastLog(w2).a === 12 && lastLog(w2).secsA === 26 && lastLog(w2).cards.length === 12, lastLog(w2));
  const w3 = world({ items: fill(30) });
  w3.call("msaysStart()"); w3.call("msaysMark('c')"); w3.ctx._now += 61000; w3.call("msaysOnTick()");
  ok("time runs out → the full minute", w3.call("msaysUI.phase") === "done" && w3.call("msaysUI.used") === 60);
  ok("3 s on one card lights the Pass cue (never passes by itself)", (() => { const w4 = world({ items: fill(25) }); const el = { style: {}, textContent: "" }; w4.ctx.document = { getElementById: id => id === "msays-pass" ? el : null }; w4.call("msaysStart()"); w4.ctx._now += 3100; w4.call("msaysOnTick()"); return /3 s/.test(el.textContent) && w4.call("Object.keys(msaysUI.res).length") === 0; })());
  ok("↩︎ Undo takes back the last tap", (() => { const w5 = world({ items: fill(25) }); w5.call("msaysStart()"); w5.call("msaysMark('c')"); w5.call("msaysUndo()"); return w5.call("msaysUI.i") === 0 && w5.call("Object.keys(msaysUI.res).length") === 0; })());
  const w6 = world({ items: fill(20), log: [{ src: "momsays", deck: "Mom says · All decks", a: 10, secsA: 20, ts: 1, cards: [] }, { src: "drill", deck: "Mom says · All decks", a: 90, secsA: 30, ts: 2 }] });
  ok("compared only with his own Mom-says best for this deck", w6.call("sprintBestRpm(masteryData.sprintLog.lincoln,'Mom says · All decks','momsays')") === 30);
}

console.log("── writes ──");
{
  const due = fact("4×4", { next_due: PN }), items = [due].concat(fill(20));
  const w = world({ items });
  run(w, {}); save(w);
  ok("two writes: one targeted card update + one sprintLog push", w.ctx.refs.length === 2 && w.ctx.refs[0].p === "mastery/lincoln" && w.ctx.refs[0].op === "update" && w.ctx.refs[1].p === "mastery/sprintLog/lincoln" && w.ctx.refs[1].op === "push", w.ctx.refs.map(r => r.p + " " + r.op));
  ok("the card update is field paths only — never the whole list", Object.keys(w.ctx.refs[0].v).every(k => /^\d+\/[a-z_]+$/.test(k)));
  ok("no set() anywhere", !w.ctx.refs.some(r => r.op === "set"));
  const wn = world({ items: fill(20) });
  run(wn, {}); save(wn);
  ok("nothing due + nothing dropped → only the log push", wn.ctx.refs.length === 1 && wn.ctx.refs[0].op === "push");
  const d = world({ items: [fact("5×5", { next_due: PN })].concat(fill(20)), dry: true });
  run(d, { [d.call("masteryData.lincoln[1].id")]: ["p"] }); save(d);
  ok("?dryrun=1 writes nothing to Firebase", d.ctx.refs.length === 0);
  const t = world({ items: fill(20) });
  run(t, {}); t.call("msaysDiscard()");
  ok("Throw away writes nothing", t.ctx.refs.length === 0 && t.call("msaysUI") === null);
}

console.log("── wiring ──");
{
  const b = fn("buildSprintHtml");
  ok("the Sprint tab routes the momsays source", b.includes('if(sprintSource==="momsays") return h+buildSprintMomSaysHtml(color);'));
  ok("the pill sits next to From drill items", /From drill items"\)\s*\n\s*\+\(\(typeof momHere==="function"&&momHere\(\)\)\?opt\("momsays"/.test(fn("buildSprintSourceToggle")));
  ok("the pool is the sprint gate's pool", fn("msaysPool").includes("sprintDrillPool("));
  ok("ladder moves go through mastApplyScores", block("MOMSAYS").includes("mastApplyScores(items,plan.rev.map("));
  ok("Scores shows a Mom-says chip", src.includes("if(s.src==='momsays') chips.push("));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
