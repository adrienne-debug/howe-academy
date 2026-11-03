/*
 * Node tests — ⚙ LADDER1: one right answer climbs one level (her rule 2026-11-03: "everything is at one, and then that
 * setting is taken out"). A stored ladder_streak / tier_streaks (DeWalt's old 3s) is ignored; a miss still sends the card
 * back down; the "Ladder Streak" row and the per-level streak buttons are gone from ⚙ Rules; the "3 in a row" labels are gone.
 * Her follow-up the same day, "erase from envirothon as well": the class site's Right in a row rows (class settings, 📅 Pace) are gone too.
 *   run:  node test_ladder_one.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
const constLine = n => { const m = src.match(new RegExp("const " + n + "=[^\\n]*;")); if (!m) throw new Error("missing const " + n); return m[0]; };

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

const CODE = [constLine("MAST_TIER_INT"), constLine("MAST_TIER_ORDER"),
  ...["mastDrillSettings", "mastApplyScores", "_unitKidLadderCfg", "_unitLadderDaysToGate", "mastTierAtLeast"].map(slice)].join("\n");
const LADDER = ["every_other_day", "weekly", "bi_weekly", "monthly", "graduated"];
const card = (id, tier, extra) => Object.assign({ id, prompt: id, subject: "Math Facts", tier, status: "active", consecutive_correct: 0, cycle: 1, drop_count: 0, tally_dots: 5, next_due: 100 }, extra || {});
function world(settings, overlay) {
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map,
    masteryKid: "kid1", masteryData: { kid1_settings: settings },
    mastStampNextDue: (it, items, tier, pn) => { it.next_due = pn + (ctx.MAST_TIER_INT[tier] || 1); },
    mastIsParked: () => false, mastIsNeverDrill: () => false, mastBankEligible: () => [], mastCatFinishedLearning: () => false,
    mastIntroDotsFor: () => 5, mastIntroMaxFor: () => 3,
    mastDynamicEligible: () => false, mastDynamicMark: () => {}, mastDynamicClear: () => {}, mastDynamicShouldAdd: () => false, mastDynamicShouldPrune: () => false };
  if (overlay) ctx.envClassOverlay = overlay;
  vm.createContext(ctx);
  vm.runInContext(CODE + "\nthis.MAST_TIER_INT=MAST_TIER_INT;", ctx);
  return ctx;
}
const score = (ctx, items, scores) => ctx.mastApplyScores(items, Object.keys(scores).map(id => ({ id })), scores, 200, ctx.mastDrillSettings(), { autoPull: false, chain: false });

// 1. a stored 3 (and per-level 3s) is ignored — the settings read 1
{ const ctx = world({ ladder: LADDER, ladder_streak: 3, tier_streaks: { weekly: 3, bi_weekly: 4 }, miss_drop: "reset" });
  const s = ctx.mastDrillSettings();
  ok("stored ladder_streak 3 reads as 1", s.ladder_streak === 1, s.ladder_streak);
  ok("stored per-level streaks are ignored", Object.keys(s.tier_streaks).length === 0, s.tier_streaks);
  ok("the kid's other settings come through", s.miss_drop === "reset" && s.ladder.length === 5);
  ok("the stored settings object is not changed", ctx.masteryData.kid1_settings.ladder_streak === 3); }

// 2. no stored value → 1
{ const ctx = world(undefined); ok("no settings → 1", ctx.mastDrillSettings().ladder_streak === 1); }

// 3. one right answer climbs one level, at every level
{ const ctx = world({ ladder: LADDER, ladder_streak: 3, tier_streaks: { weekly: 3 }, miss_drop: "reset" });
  const items = [card("a", "every_other_day"), card("b", "weekly"), card("c", "bi_weekly"), card("d", "monthly")];
  score(ctx, items, { a: "c", b: "c", c: "c", d: "c" });
  ok("every-other-day → weekly on one right", items[0].tier === "weekly", items[0].tier);
  ok("weekly → every 2 weeks on one right (per-level 3 ignored)", items[1].tier === "bi_weekly", items[1].tier);
  ok("every 2 weeks → monthly on one right", items[2].tier === "monthly", items[2].tier);
  ok("monthly → graduated on one right", items[3].tier === "graduated", items[3].tier);
  ok("the climb starts the new level fresh", items.every(i => i.consecutive_correct === 0)); }

// 4. a lucky guess climbs, then the next miss sends it back to the start (miss_drop reset)
{ const ctx = world({ ladder: LADDER, ladder_streak: 3, miss_drop: "reset" });
  const items = [card("a", "every_other_day")];
  score(ctx, items, { a: "c" });
  ok("lucky guess climbs one level", items[0].tier === "weekly");
  score(ctx, items, { a: "m" });
  ok("the next miss sends it back to every other day", items[0].tier === "every_other_day", items[0].tier);
  ok("the miss is counted", items[0].drop_count === 1); }

// 5. "drop one" miss rule still drops one level
{ const ctx = world({ ladder: LADDER, miss_drop: "one" });
  const items = [card("a", "bi_weekly")];
  score(ctx, items, { a: "m" });
  ok("miss_drop one → back one level", items[0].tier === "weekly", items[0].tier); }

// 6. a close answer still stays put by default
{ const ctx = world({ ladder: LADDER });
  const items = [card("a", "weekly")];
  score(ctx, items, { a: "~" });
  ok("close (~) stays on its level", items[0].tier === "weekly", items[0].tier); }

// 7. sprint-unlock estimates count one review per level
{ const ctx = world({ ladder: LADDER, ladder_streak: 3, tier_streaks: { every_other_day: 3 } });
  const cfg = ctx._unitKidLadderCfg("kid1");
  ok("estimate config is 1 per level", cfg.streak === 1 && Object.keys(cfg.streaks).length === 0, cfg);
  ok("every-other-day → weekly gate = one interval (2 days)", ctx._unitLadderDaysToGate("every_other_day", 0, cfg) === 2); }

// 8. the class site (her follow-up 2026-11-03: "erase from envirothon as well"): a class value is ignored too, the rows are gone
{ const ctx = world({ ladder: LADDER, ladder_streak: 3, tier_streaks: { weekly: 4 } }, (part, kid, s) => Object.assign({}, s, { ladder_streak: 2, tier_streaks: { weekly: 5 }, miss_drop: "one" }));
  ctx.envClsOn = () => true;
  const s = ctx.mastDrillSettings();
  ok("class site: a class's Right in a row (2, per level 5) is ignored → 1", s.ladder_streak === 1 && Object.keys(s.tier_streaks).length === 0, s);
  ok("class site: the class's other drill settings still apply", s.miss_drop === "one");
  ok("class site: estimates are 1 per level", ctx._unitKidLadderCfg("kid1").streak === 1); }
{ const F = src.slice(src.indexOf("const ENVCS_FIELDS"), src.indexOf("const _envcs="));
  ok("class settings: no Right in a row rows (ladder_streak / tier_streaks)", F.length > 100 && F.indexOf('name:"ladder_streak"') < 0 && F.indexOf('name:"tier_streaks"') < 0);
  const bar = slice("cppPlanBarHtml");
  ok("📅 Pace: no Right in a row box", bar.indexOf("Right in a row") < 0 && bar.indexOf('num("streak"') < 0);
  ok("📅 Pace: Save never writes settings/drill/ladder_streak", slice("cpPaceSave").indexOf("ladder_streak") < 0);
  ok("📅 Pace: the planner runs at one right per level", /streak:1,/.test(slice("cppBase")));
  ok("the demo class no longer gets Right in a row 2", slice("cppDemo").indexOf("ladder_streak") < 0);
  ok("Days a card is learned sits above What a miss does", /findIndex\(f=>f&&f\.name==="miss_drop"\)/.test(slice("cpSeatsFields"))); }

// 9. the setting is gone from the screens
{ const rules = slice("mastAdminRulesHtml");
  ok("⚙ Rules has no Ladder Streak row", rules.indexOf('key:"ladder_streak"') < 0 && rules.indexOf("Ladder Streak") < 0);
  ok("⚙ Rules has no per-level streak buttons", rules.indexOf("mastAdminTierStreak") < 0 && rules.indexOf("tier_streaks") < 0);
  ok("the per-level streak handler is gone", src.indexOf("function mastAdminTierStreak(") < 0);
  ok("the card editor has no Streak (x/3) row", src.indexOf("Streak ('+") < 0);
  ok("no '3 correct in a row' on the printed cards", src.indexOf("3 correct in a row") < 0);
  ok("no ladder_streak in a row label", src.indexOf("_jps.ladder_streak") < 0); }

// 10. the two leftover streak labels are gone (her yes 2026-11-03); the level's name and the dot stay
{ const i = src.indexOf("const tallyMax=isIntro?"), drill = src.slice(i, src.indexOf("\n", src.indexOf("else _tallyH+=", i)));
  ok("drill card: no 'n/1 streak' under a review card", i > 0 && drill.indexOf("streak</div>") < 0 && drill.indexOf("' streak") < 0);
  ok("drill card: the level's name stays", /else _tallyH\+='<div[^\n]*\(MAST_TIER_LBL\[it\.tier\]\|\|it\.tier\)\+'<\/div>'/.test(drill));
  ok("drill card: the tally dots stay", /for\(let d=0;d<tallyMax;d\+\+\) _tallyH\+=/.test(drill));
  const g = src.indexOf("const tierLbl=isIntro?\"Intro\""), grid = src.slice(g, g + 900);
  ok("card grid hover: '(x/y)' only on a learning card, never '(0/1)' on a ladder card", g > 0 && grid.indexOf("(isIntro?' ('+dots+'/'+maxD+')':'')") > 0);
  ok("card grid: the dots row stays", /for\(let d=0;d<maxD;d\+\+\) h\+=/.test(src.slice(g, g + 1400))); }

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
