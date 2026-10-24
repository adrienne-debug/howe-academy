/*
 * 🏁 A drill sprint needs at least 20 ready cards (her complaint 2026-10-23; PLAN_mastery_system §1.1 rule 1, A1a).
 * Live case: Ellis's Math Facts drill sprint had 11 eligible cards and the sheet padded with "—" tiles.
 * 20+ → the form is exactly as before. 1–19 → "Not enough to sprint yet: N of 20 ready · M more climbing · about X"
 * in place of Grid Size + Generate, with a Mom-only "Sprint anyway". sprintGenerateFromPool refuses below 20
 * unless called through Sprint anyway. 0 → the old guided empty state. Other sprint sources untouched.
 *   run:  node test_sprint_min.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// SPRINTMIN_START"), b = src.indexOf("// SPRINTMIN_END");
if (a < 0 || b < 0) { console.error("SPRINTMIN markers not found"); process.exit(1); }
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
const fn = (name) => { const s = src.indexOf("function " + name + "("); if (s < 0) throw new Error("no " + name); return src.slice(s, src.indexOf("\n}\n", s) + 2); };
const line = (start) => { const s = src.indexOf(start); return src.slice(s, src.indexOf("\n", s)); };
const block = (m) => src.slice(src.indexOf("// " + m + "_START"), src.indexOf("// " + m + "_END"));

// A world with the REAL drill form, generator, ladder math and grid pills; only the gate pool and the sheet
// renderer are stand-ins (the pool = tier ≥ weekly + switch on, which is what mastSprintPool keeps here).
function world(o) {
  o = o || {};
  const ctx = { console, Object, Array, String, Number, Math, JSON, Set,
    masteryKid: "ellis", sprintDeck: "Math Facts", sprintSource: "drill", sprintPillState: {}, sprintNum: 1, sprintDate: "2026-10-23",
    SL_KLBL: { ellis: "Ellis" }, MAST_CAT_EMOJI_MAP: {}, masteryData: { ellis: o.items || [], ellis_settings: o.kidSettings || {}, history: null },
    _mom: !!o.mom, rendered: [] };
  vm.createContext(ctx);
  vm.runInContext([
    line("const MAST_TIER_ORDER="), line("const MAST_TIER_LBL="), line("const MAST_TIER_COL="), line("const MAST_TIER_INT="),
    fn("mastTierAtLeast"), fn("_unitKidLadderCfg"), fn("_unitLadderDaysToGate"), fn("_unitEtaLbl"),
    block("DRILLGRID"), block("SPRINTMIN"), fn("sprintGenerateFromPool"), fn("buildSprintFromDrillHtml"),
    "function momHere(){ return _mom; }",
    "function mastDrillSettings(){ return {gate_tier:'weekly'}; }",
    "function mastKnowledgeType(it){ return (it&&it.knowledge_type)||'fact_association'; }",
    "function mastSprintSwitch(it){ return it.sprint!==false; }",
    "function mastUntimedAccuracy(){ return undefined; }",
    "function sprintActiveScope(){ return null; }",
    "function sprintDrillScopes(){ return []; }",
    "function sprintDrillPool(kid,items){ return items.filter(i=>i&&i.status!=='introduction'&&i.status!=='parked'&&i.sprint!==false&&mastTierAtLeast(i.tier,'weekly')); }",
    "function sprintFoldHtml(k,s,b){ return '<fold>'+s+'</fold>'; }",
    "function sprintScoreRowHtml(){ return '<scores>'; }",
    "function sprintRenderSheets(A,B,o){ rendered.push({n:A.gridWords.length,label:o.sheetLabel}); }",
  ].join("\n"), ctx);
  return { ctx, call: e => vm.runInContext(e, ctx) };
}
let _id = 0;
const card = (tier, cc, extra) => Object.assign({ id: "c" + (++_id), subject: "Math Facts", prompt: "f" + _id, tier, consecutive_correct: cc || 0, status: "review" }, extra || {});
const many = (n, tier, cc, extra) => Array.from({ length: n }, () => card(tier, cc, extra));

console.log("── 20 or more ready: exactly as today ──");
{
  const w = world({ items: many(25, "weekly") });
  const h = w.call("buildSprintFromDrillHtml('#123456')");
  ok("Generate shows with the count", h.includes("Generate A &amp; B sprint sheets (25 items)"));
  ok("Grid Size shows", h.includes("Grid Size"));
  ok("no not-enough panel", !h.includes("Not enough to sprint yet") && !h.includes("sp-min"));
  w.call("sprintGenerateFromPool()");
  ok("generate builds sheets from all 25", w.ctx.rendered.length === 1 && w.ctx.rendered[0].n === 25, w.ctx.rendered);
  const w20 = world({ items: many(20, "weekly") });
  ok("exactly 20 is enough", w20.call("buildSprintFromDrillHtml('#1')").includes("Generate A &amp; B sprint sheets (20 items)"));
  w20.call("sprintGenerateFromPool()");
  ok("exactly 20 generates", w20.ctx.rendered.length === 1);
}

console.log("── 11 ready + 12 climbing (Ellis's Math Facts) ──");
{
  // default ladder, streak 3: every_other_day cc2 → (3-2)×2 = 2 days; daily cc0 → 3×2 = 6 days. 9th smallest = 6.
  const items = many(11, "weekly").concat(many(8, "every_other_day", 2), many(4, "daily", 0),
    many(3, "daily", 0, { sprint: false }), many(2, "daily", 0, { status: "introduction" }), many(2, "daily", 0, { knowledge_type: "concept" }));
  const w = world({ items });
  const days = w.call("sprintMinClimbDays('ellis',masteryData.ellis.filter(i=>i.status!=='introduction'),{gate_tier:'weekly'},null)");
  ok("climbing = switch-on, on-ladder, below the gate (switch off / intro / concept left out)", days.length === 12, days);
  ok("days come from the ladder math, sorted", JSON.stringify(days) === JSON.stringify([2,2,2,2,2,2,2,2,6,6,6,6]), days);
  const h = w.call("buildSprintFromDrillHtml('#123456')");
  ok("panel says 11 of 20 ready · 12 more climbing", h.includes("Not enough to sprint yet: 11 of 20 ready · 12 more climbing · about this week"), h.slice(h.indexOf("Not enough"), h.indexOf("Not enough") + 120));
  ok("no Generate, no Grid Size", !h.includes("Generate A &amp; B") && !h.includes("Grid Size"));
  ok("the item list and summary still show", h.includes("The 11 items in this set") && h.includes(">11</span>"));
  ok("score row + sheet slot stay (Sprint anyway draws there)", h.includes("<scores>") && h.includes('id="sp-sheets"'));
  ok("kids: no Sprint anyway", !h.includes("Sprint anyway") && !h.includes("sprintAnyway"));

  // A slower ladder (streak 5): eod cc2 → 3×2 = 6; daily cc0 → 5×2 = 10. 11 ready → need 9 → 10 days → ~2 wk;
  // 12 ready → need 8 → 6 days → this week. Proves it's the (20−N)th smallest, not the max or min.
  const slow = { ladder_streak: 5 };
  const w2 = world({ items: many(11, "weekly").concat(many(8, "every_other_day", 2), many(4, "daily", 0)), kidSettings: slow });
  ok("(20−N)th smallest: 11 ready → about 2 wk", w2.call("buildSprintFromDrillHtml('#1')").includes("11 of 20 ready · 12 more climbing · about 2 wk"));
  const w3 = world({ items: many(12, "weekly").concat(many(8, "every_other_day", 2), many(4, "daily", 0)), kidSettings: slow });
  ok("(20−N)th smallest: 12 ready → about this week", w3.call("buildSprintFromDrillHtml('#1')").includes("12 of 20 ready · 12 more climbing · about this week"));
  ok("label matches the unit ETA style", w.call("_unitEtaLbl(10)") === "~2 wk" && w.call("_unitEtaLbl(6)") === "~this week");
}

console.log("── 11 ready + only 3 climbing ──");
{
  const w = world({ items: many(11, "weekly").concat(many(3, "daily", 0)) });
  const h = w.call("buildSprintFromDrillHtml('#1')");
  ok("says add more cards instead of a date", h.includes("Not enough to sprint yet: 11 of 20 ready · 3 more climbing · add more cards to this deck to sprint it"));
  ok("no 'about'", !h.includes("about "));
}

console.log("── generate refuses below 20; Sprint anyway is Mom's ──");
{
  const items = many(11, "weekly").concat(many(12, "daily", 0));
  const kid = world({ items });
  kid.call("sprintGenerateFromPool()");
  ok("sprintGenerateFromPool refuses 11", kid.ctx.rendered.length === 0);
  kid.call("sprintAnyway()");
  ok("sprintAnyway does nothing without Mom", kid.ctx.rendered.length === 0);
  const mom = world({ items, mom: true });
  const h = mom.call("buildSprintFromDrillHtml('#1')");
  ok("Mom sees the Sprint anyway link", h.includes('onclick="sprintAnyway()"') && h.includes(">Sprint anyway</button>"));
  ok("Mom still sees the panel, not Generate", h.includes("Not enough to sprint yet") && !h.includes("Generate A &amp; B"));
  mom.call("sprintGenerateFromPool()");
  ok("Mom's plain generate call is refused too", mom.ctx.rendered.length === 0);
  mom.call("sprintAnyway()");
  ok("Sprint anyway builds the sheets exactly as today", mom.ctx.rendered.length === 1 && mom.ctx.rendered[0].n === 11 && mom.ctx.rendered[0].label === "Math Facts Sprint", mom.ctx.rendered);
  mom.call("sprintGenerateFromPool()");
  ok("the bypass ends with that one call", mom.ctx.rendered.length === 1 && mom.call("_sprintMinBypass") === false);
}

console.log("── 0 ready: the old guided empty state ──");
{
  const w = world({ items: many(5, "daily", 0) });
  const h = w.call("buildSprintFromDrillHtml('#1')");
  ok("old message", h.includes("Nothing has cleared the gate yet") && h.includes("5 items are still climbing"));
  ok("no panel", !h.includes("Not enough to sprint yet") && !h.includes("Sprint anyway"));
  ok("sprintMinShort(0) is false", w.call("sprintMinShort(0)") === false);
}

console.log("── only the drill source changes ──");
{
  const blk = src.slice(a, b);
  ok("constant is 20", /const SPRINT_MIN_DRILL=20;/.test(blk));
  ok("no Firebase writes in the block", !/\bdb\b|\bref\(|\.set\(|\.update\(|\.remove\(/i.test(blk));
  ok("no 🔀 in the block", !blk.includes("\u{1F500}"));
  ok("hook sits in sprintGenerateFromPool after the empty check", /if\(!pool\.length\) return;\n  if\(!sprintMinAllows\(pool\.length\)\) return;/.test(fn("sprintGenerateFromPool")));
  ["unitSprintRounds", "buildSprintHtml", "buildSprintEditorHtml", "sprintGenerate"].forEach(f => {
    let body; try { body = fn(f); } catch (e) { body = ""; }
    ok(f + " doesn't use the minimum", body && !/sprintMin|SPRINT_MIN/.test(body));
  });
  const uses = src.split(/sprintMin|SPRINT_MIN_DRILL|sprintAnyway/).length - 1;
  const inBlock = blk.split(/sprintMin|SPRINT_MIN_DRILL|sprintAnyway/).length - 1;
  const hooks = (fn("sprintGenerateFromPool") + fn("buildSprintFromDrillHtml")).split(/sprintMin|SPRINT_MIN_DRILL|sprintAnyway/).length - 1;
  ok("every use is in the block or the two drill hooks", uses === inBlock + hooks, { uses, inBlock, hooks });
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
