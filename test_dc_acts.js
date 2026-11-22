// 🎨 DCACTS — every activity of the day on Today's card (slice 1 of PLAN_unit_activity_types_2026-11-19; Adrienne 2026-11-22
//   "go with her answers and build"). A day names ONE activity through nb; a beta mom writes two on one day (day:n on each).
//   Runs the REAL UNITTRACK + DAYCARD blocks (UNITACTCHK and DCACTS inside) and the Units page's real sign-off against a fake db.
//   · a two-activity day → two rows under "🎨 Today's activities", each with its own ✓ chip per enrolled kid
//   · the nb one first, then the others by day:n in the unit's order; never twice; another day's activity never shows
//   · a one-activity day, a day with no activity, older data with no day field → dcDayHTML byte-identical to the tree minus DCACTS
//   · Mom's ✓ on the second row writes that activity's own log leaf; a kid sees no buttons; DCACTS itself writes nothing
//   run: node test_dc_acts.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
const UT = cut("// UNITTRACK_START", "// UNITTRACK_END"), DC = cut("// DAYCARD_START", "// DAYCARD_END"), BLK = cut("// DCACTS_START", "// DCACTS_END") + "// DCACTS_END\n";
// the tree minus the feature: the block out, the 🎨 line back to one activity (the same strip works on main after a merge)
const PRE_NEW = 'const acts=dcActivities(g); if(acts.length) h+=dcSection("\\u{1F3A8} Today\\u2019s "+(acts.length>1?"activities":"activity"),acts.map((act,i)=>dcActRow(i,';
const PRE_OLD = 'const act=dcActivity(g); if(act) h+=dcSection("\\u{1F3A8} Today\\u2019s activity",';
const SUF_NEW = 'dcActChecksHTML(g,act))).join(""));   // UNITACTCHK: ✓ per kid · DCACTS: every activity of the day, each its own row';
const SUF_OLD = 'dcActChecksHTML(g,act));   // UNITACTCHK: ✓ per kid';
const DC_BEFORE = DC.replace(BLK, "").replace(PRE_NEW, PRE_OLD).replace(SUF_NEW, SUF_OLD);
const SIGN = ["_unitActs", "_nbActKeys", "_nbActWrite", "_nbActRemove", "unitActPoints", "unitActivityClaim", "unitActivityDone"].map(fn).join("\n");
const LR = "const LR_PARTS=[\"links\",\"supplies\",\"books\",\"orders\",\"notes\"];\n" + ["lrSafeUrl", "lrList", "lrStr", "lrDate", "lrClean", "lrHost"].map(fn).join("\n");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 400) : "")); } };
const J = x => JSON.stringify(x);
const visible = h => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
// a made-up family: four kids, a harvest unit; Day 2 has a younger and an older version, Day 4 a draw and a build
const UNIT = () => ({ id: "harv", title: "Harvest", emoji: "🌾", decks: [], enrolled: { k1: true, k2: true, k3: true, k4: true },
  activities: [
    { key: "corn_maze", title: "Draw a corn maze", emoji: "🎨", kind: "sheet", points: 5, day: 1 },
    { key: "my_holiday", title: "Your own holiday", emoji: "🎨", kind: "sheet", points: 20, day: 2, desc: "Write 2-3 sentences." },
    { key: "my_holiday_2", title: "Your own holiday (younger)", emoji: "🎨", kind: "sheet", points: 10, day: 2, desc: "Draw it." },
    { key: "design_float", title: "Design your float", emoji: "🎨", kind: "sheet", points: 5, day: 4 },
    { key: "build_float", title: "Build your float", emoji: "🎨", kind: "sheet", points: 15, day: 4, desc: "Gather supplies around the house." },
    { key: "leaf_rub", title: "Leaf rubbing", emoji: "🍁", kind: "sheet", points: 5 }],   // older data: no day field
  track: { mode: "seq", perWeek: 4, days: [
    { id: "d1", n: 1, t: "Fields", nb: { activity: "corn_maze" } },
    { id: "d2", n: 2, t: "Holidays", nb: { activity: "my_holiday" } },
    { id: "d3", n: 3, t: "Rest day", res: { books: [{ title: "A Book" }] }, note: "Read outside." },
    { id: "d4", n: 4, t: "Parade", nb: { activity: "design_float" } },
    { id: "d5", n: 5, t: "Leaves", nb: { activity: "leaf_rub" } },
    { id: "d6", n: 6, t: "No pointer" }] } });
function world(o) {
  o = o || {}; const writes = [], banked = [];
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, Promise, Error, parseInt, isNaN, isFinite, URL,
    unitStudies: { harv: o.unit || UNIT() }, ROSTER: ["k1", "k2", "k3", "k4"], KID_NAME: { k1: "Ada", k2: "Ben", k3: "Cy", k4: "Di" },
    momHere: () => ctx.MOM, MOM: o.mom !== false, _dryRun: () => false,
    db: { ref: p => ({ set: v => writes.push(["set", p, JSON.parse(J(v))]), update: v => writes.push(["update", p]), remove: () => writes.push(["remove", p]), transaction: () => writes.push(["tx", p]), child: () => null }) },
    renderAll: () => { ctx.repaints++; }, repaints: 0, confirm: () => true, bankDirect: (k, p, n) => banked.push([k, p]) };
  vm.createContext(ctx);
  vm.runInContext(LR + "\n" + UT + "\n" + (o.before ? DC_BEFORE : DC) + "\n" + SIGN, ctx);
  return { ctx, writes, banked };
}
const G = (c, id) => { const u = c.unitStudies.harv; return { day: c.utRef("harv", c.utDay(u, id)), u: u, first: null, present: [] }; };

console.log("── the block ──");
ok("DCACTS is a marked block inside DAYCARD, after UNITACTCHK", BLK.length > 600 && DC.indexOf("// DCACTS_START") > DC.indexOf("// UNITACTCHK_END"));
ok("the 🎨 line loops over dcActivities, each row through dcActRow, chips per row", DC.indexOf(PRE_NEW) > 0 && DC.indexOf(SUF_NEW) > 0 && DC.split("=dcActivities(g)").length === 2);
ok("the strip gives back the one-activity line (the baseline is this tree minus the feature)", DC_BEFORE.indexOf(PRE_OLD) > 0 && DC_BEFORE.indexOf(SUF_OLD) > 0 && DC_BEFORE.indexOf("dcActivities") < 0 && DC_BEFORE.indexOf("DCACTS_START") < 0);
ok("the block writes nothing: no db, no ref/set/update/remove", !/db\.|\.ref\(|\.set\(|\.update\(|\.remove\(/.test(BLK.replace(/^\s*\/\/.*$/mg, "")));
ok("no family names and no 🔀 in the block or this test's fixture", BLK.indexOf("\u{1F500}") < 0 && !/Lincoln|Ellis|Lucy|Julian|Sara\b|DeWalt|taylor|makenzie|andrew|caleb/i.test(BLK) && !/Lincoln|Ellis|Lucy|Julian|DeWalt/i.test(J(UNIT())));
ok("no fixed width on the extra row (phone width: it wraps like the first)", !/width:\d/.test(fn("dcActRow")));

console.log("\n── which activities a day has ──");
{
  const { ctx } = world(); const keys = id => J(ctx.dcActivities(G(ctx, id)).map(a => a.key));
  ok("Day 2 → the nb one first, then the other written on Day 2", keys("d2") === J(["my_holiday", "my_holiday_2"]), keys("d2"));
  ok("Day 4 → the draw (nb) then the build", keys("d4") === J(["design_float", "build_float"]), keys("d4"));
  ok("Day 1 → just its one", keys("d1") === J(["corn_maze"]));
  ok("a day with no activity → none", keys("d3") === "[]" && keys("d6") === "[]");
  ok("older data (nb names an activity with no day field) → that one, as before", keys("d5") === J(["leaf_rub"]));
  ok("no unit day / no unit → none", J(ctx.dcActivities({ day: null, u: null })) === "[]" && J(ctx.dcActivities({ day: G(ctx, "d2").day, u: null })) === "[]");
  const u2 = UNIT(); u2.track.days[3].nb = { activity: "gone_key" };
  const w2 = world({ unit: u2 }); ok("nb points at a deleted activity → the day's day:n ones still show", J(w2.ctx.dcActivities(G(w2.ctx, "d4")).map(a => a.key)) === J(["design_float", "build_float"]));
  const u3 = UNIT(); u3.track.days[1].nb = undefined; delete u3.track.days[1].nb;
  const w3 = world({ unit: u3 }); ok("a day with no nb but two day:n activities → both, unit order", J(w3.ctx.dcActivities(G(w3.ctx, "d2")).map(a => a.key)) === J(["my_holiday", "my_holiday_2"]));
  const u4 = UNIT(); u4.activities = Object.assign({}, u4.activities); delete u4.activities[1]; u4.activities["7"] = { key: "late_add", title: "Late add", points: 5, day: 2 };
  const w4 = world({ unit: u4 }); ok("activities as Firebase's sparse object: still found, never twice", J(w4.ctx.dcActivities(G(w4.ctx, "d2")).map(a => a.key)) === J(["my_holiday_2", "late_add"]), w4.ctx.dcActivities(G(w4.ctx, "d2")).map(a => a.key));
}

console.log("\n── the card ──");
{
  const { ctx } = world(); const h = ctx.dcDayHTML(G(ctx, "d2"));
  ok("the section says Today's activities (plural) once", h.split("Today’s activities").length === 2 && h.indexOf("Today’s activity<") < 0);
  const v = visible(h); ok("both titles, in order, each with its points, line and chips", v.indexOf("Your own holiday · 20 ⭐ Write 2-3 sentences. Ada ○ Ben ○ Cy ○ Di ○ 🎨 Your own holiday (younger) · 10 ⭐ Draw it. Ada ○ Ben ○ Cy ○ Di ○") > 0, v);
  ok("8 chips: one per kid per activity (2 × 4)", (h.match(/data-dc-actkid=/g) || []).length === 8 && (h.match(/data-dc-actchk=/g) || []).length === 2);
  ok("each row's chips carry its own activity key", h.split("dcActTap('harv','k3','my_holiday')").length === 2 && h.split("dcActTap('harv','k3','my_holiday_2')").length === 2);
  ok("the second row sits under a thin line (data-dc-actrow=1), the first has no wrapper", (h.match(/data-dc-actrow="1"/g) || []).length === 1 && h.indexOf('data-dc-actrow="0"') < 0);
  const h4 = ctx.dcDayHTML(G(ctx, "d4")); ok("Day 4 shows the draw and the build", visible(h4).indexOf("Design your float") > 0 && visible(h4).indexOf("Build your float") > 0 && (h4.match(/data-dc-actkid=/g) || []).length === 8);
}

console.log("\n── one activity or none: byte-identical to the tree minus DCACTS ──");
{
  const A = world(), B = world({ before: true });
  ["d1", "d3", "d5", "d6"].forEach(id => ok("Day " + id.slice(1) + ": dcDayHTML byte-identical (Mom)", A.ctx.dcDayHTML(G(A.ctx, id)) === B.ctx.dcDayHTML(G(B.ctx, id))));
  const C = world({ mom: false }), D = world({ mom: false, before: true });
  ["d1", "d5"].forEach(id => ok("Day " + id.slice(1) + ": byte-identical on a kid's screen too", C.ctx.dcDayHTML(G(C.ctx, id)) === D.ctx.dcDayHTML(G(D.ctx, id))));
  const b2 = B.ctx.dcDayHTML(G(B.ctx, "d2")), a2 = A.ctx.dcDayHTML(G(A.ctx, "d2"));
  ok("before, Day 2 showed only the first (the bug this fixes)", b2.indexOf("younger") < 0 && a2.indexOf("younger") > 0);
  // expected = the old Day 2 card with the section's inner = old row (holiday) + dcActRow(1, old row of the younger one)
  const secInner = h => { const m = h.match(/Today\u2019s activit(?:y|ies)<\/div><div style="margin-top:8px">([^]*?)<\/div><\/section>/); return m ? m[1] : null; };
  const uY = UNIT(); uY.track.days[1].nb = { activity: "my_holiday_2" }; const BY = world({ unit: uY, before: true });
  const rowY = secInner(BY.ctx.dcDayHTML(G(BY.ctx, "d2"))), rowH = secInner(b2);
  ok("Day 2 now = the old card, plural title, the old first row, then the old row of the second under a line", !!rowY && !!rowH && a2 === b2.replace("Today\u2019s activity<", "Today\u2019s activities<").replace(rowH, rowH + A.ctx.dcActRow(1, rowY)), [a2.length, b2.length]);
}

console.log("\n── taps ──");
{
  const { ctx, writes, banked } = world();
  ok("Mom's ✓ on the second row's chip: one set of that activity's own log leaf, its own points", ctx.dcActTap("harv", "k2", "my_holiday_2") === true && J(writes.map(w => [w[0], w[1]])) === J([["set", "unitStudies/harv/activityLog/k2/my_holiday_2"]]) && J(banked) === J([["k2", 10]]), [writes, banked]);
  const h = ctx.dcDayHTML(G(ctx, "d2"));
  const parts = h.split('data-dc-actrow="1"'); ok("…the second row shows ✓ for that kid, the first row still ○", parts.length === 2 && parts[1].indexOf("Ben <span>✓") > 0 && parts[0].indexOf("Ben <span>○") > 0 && parts[0].indexOf("✓") < 0);
  const K = world({ mom: false }); const hk = K.ctx.dcDayHTML(G(K.ctx, "d2"));
  ok("a kid sees both rows and all 8 states, no button", (hk.match(/data-dc-actkid=/g) || []).length === 8 && !/<button[^>]*dcActTap/.test(hk) && K.writes.length === 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
