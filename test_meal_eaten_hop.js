/*
 * Node tests for MEAL_EATEN_HOP (her words 2026-11-11: "if a day has been marked as eaten for a meal, that if things are
 * shift forward, that day is skipped ... everything will shift past that day when it gets to that day").
 *
 * Replays an anonymized copy of her live Nov plan (shape read 2026-11-11: dinners carry `eaten` on Nov 4 and Nov 11;
 * Nov 6 and Nov 9 empty). Live bug: ➡ on Nov 10's breakfast/lunch/snack landed them on Nov 11, already marked eaten.
 *
 *   · b / l / s / all from Nov 10 hop the eaten Nov 11 → each lands on Nov 12, later meals slide in order
 *   · nothing on an eaten day is touched; an eaten day offers no move of its own
 *   · a day only ✗ didn't-happen hops for the dinner alone (the day is free for b/l/s)
 *   · an eating-out slot still hops as before
 *   · dinner chains are exactly what they were (old rule replayed side by side, hashed)
 *   · the multi-path update touches exactly the chain's paths; the confirm counts the hop right
 *   · ?dryrun=1 → no write
 *
 *   run:  node test_meal_eaten_hop.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm"), crypto = require("crypto");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(name) {
  const i = src.indexOf("function " + name + "(");
  if (i < 0) { console.error(name + " not found"); process.exit(1); }
  return src.slice(i, src.indexOf("\n}", i) + 2);
}
function line(startsWith) {
  const i = src.indexOf(startsWith); if (i < 0) { console.error(startsWith + " not found"); process.exit(1); }
  return src.slice(i, src.indexOf("\n", i) + 1);
}
function block(name) {
  const a = src.indexOf("// " + name + "_START"), b = src.indexOf("// " + name + "_END");
  if (a < 0 || b < a) { console.error(name + " block not found"); process.exit(1); }
  return src.slice(a, b);
}
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
const J = x => JSON.stringify(x);

const HOP = block("MEAL_EATEN_HOP");
// the rule before 2026-11-11, replayed beside the new one so dinner can be compared exactly
const OLD_FIXED = 'function _kitMvFixed(iso,slot){ const p=kitPlan[iso]; return (slot==="d"&&!!p&&!!(p.eaten||p.skipped))||(typeof kitOutIs==="function"&&kitOutIs(iso,slot)); }\n';
const REST = [slice("kitMoveChain"), slice("kitMoveForward"), slice("kitIsoPlus"), slice("kitEatGate"), slice("_kitRefresh"),
  line("function kitOutIs("), line("function kitSlotsIsParts("), line("function kitSlotsHas(")].join("\n");
const HEAD = [line("const KIT_MOVE_NAMES="), slice("_kitMvGet")].join("\n");

// her Nov 1–20 plan, names replaced (Nov 21 has nothing → it absorbs every slide)
const NOV = () => ({
  "2026-11-01": { txt:"D1101", b:{mid:"mB1101"}, l:{txt:"L1101"}, s:{txt:"S1101"} },
  "2026-11-02": { b:{txt:"B1102"}, l:{txt:"L1102"}, s:{txt:"S1102"} },
  "2026-11-03": { s:{txt:"S1103"} },
  "2026-11-04": { mid:"mD1104", b:{txt:"B1104"}, s:{txt:"S1104"}, eaten:1793836800000 },
  "2026-11-05": { mid:"mD1105", b:{txt:"B1105"}, l:{txt:"L1105"}, s:{txt:"S1105"} },
  "2026-11-07": { mid:"mD1107", b:{mid:"mB1107"}, l:{txt:"L1107"}, s:{txt:"S1107"} },
  "2026-11-08": { mid:"mD1108", b:{mid:"mB1108"}, l:{txt:"L1108"}, s:{txt:"S1108"} },
  "2026-11-10": { mid:"mD1110", b:{mid:"mB1110"}, l:{txt:"L1110"}, s:{txt:"S1110"} },
  "2026-11-11": { mid:"mD1111", b:{txt:"B1111"}, l:{txt:"L1111"}, s:{txt:"S1111"}, eaten:1794441600000 },
  "2026-11-12": { txt:"D1112", b:{txt:"B1112"}, l:{txt:"L1112"}, s:{txt:"S1112"} },
  "2026-11-13": { mid:"mD1113", b:{mid:"mB1113"}, l:{txt:"L1113"}, s:{txt:"S1113"} },
  "2026-11-14": { mid:"mD1114", b:{txt:"B1114"}, l:{txt:"L1114"}, s:{txt:"S1114"} },
  "2026-11-15": { mid:"mD1115", b:{mid:"mB1115"}, l:{txt:"L1115"}, s:{txt:"S1115"} },
  "2026-11-16": { mid:"mD1116", b:{mid:"mB1116"}, l:{txt:"L1116"}, s:{txt:"S1116"} },
  "2026-11-17": { mid:"mD1117", b:{mid:"mB1117"}, l:{txt:"L1117"}, s:{txt:"S1117"} },
  "2026-11-18": { mid:"mD1118", b:{txt:"B1118"}, l:{txt:"L1118"}, s:{txt:"S1118"} },
  "2026-11-19": { mid:"mD1119", b:{txt:"B1119"}, l:{txt:"L1119"}, s:{txt:"S1119"} },
  "2026-11-20": { mid:"mD1120", b:{txt:"B1120"}, l:{txt:"L1120"}, s:{txt:"S1120"} },
});
const DAYS = []; for (let d = 1; d <= 21; d++) DAYS.push("2026-11-" + String(d).padStart(2, "0"));
const nameOf = (P, iso, s) => { const p = P[iso]; if (!p) return null; if (s === "d") return p.mid || p.txt || null; const v = p[s]; return v ? (v.mid || v.txt) : null; };

function world(o) {
  o = o || {};
  const store = o.dry ? { ha_dryrun: "1" } : {};
  const ctx = { console, renders: 0, updates: [], sets: [], toasts: [], confirms: [], TODAY: o.today || "2026-11-11",
    momHere: () => true, confirm: m => { ctx.confirms.push(m); return true; }, mwToast: m => ctx.toasts.push(m),
    HA_LS: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
    location: { search: "" }, renderAll: function () { ctx.renders++; },
    gwParseDate: iso => new Date(iso + "T12:00:00"),
    db: { ref: p => ({ update: v => { ctx.updates.push([p, v]); return Promise.resolve(); }, set: v => ctx.sets.push([p, v]), remove: () => ctx.sets.push([p, null]) }) },
    kitPlan: o.plan || NOV(), kitPrepDone: o.prep || {}, document: { getElementById: () => null },
  };
  ctx._todayStr = () => ctx.TODAY;
  if (o.dry) ctx._dryRun = function () { return /[?&]dryrun=1/.test(ctx.location.search) || ctx.HA_LS.getItem("ha_dryrun") === "1"; };
  vm.createContext(ctx); vm.runInContext(HEAD + "\n" + (o.old ? OLD_FIXED : HOP) + "\n" + REST, ctx);
  return { ctx, call: e => vm.runInContext(e, ctx), store };
}
const chainOf = (w, iso, s, to) => w.call("kitMoveChain(" + J(iso) + "," + J(s) + (to ? "," + J(to) : "") + ")");

console.log("── the block is in index.html and is what _kitMvFixed runs ──");
{
  ok("MEAL_EATEN_HOP_START … _END wraps the one _kitMvFixed", (HOP.match(/function _kitMvFixed\(/g) || []).length === 1 && (src.match(/function _kitMvFixed\(/g) || []).length === 1);
  ok("the block cites her words and the date", /2026-11-11/.test(HOP) && /that day is skipped/.test(HOP));
  ok("the 📅 picker labels an eaten day ✓ eaten for every slot (not 🍽 eating out)", /const what=fx\?\(p\.eaten\?'✓ eaten — skipped over'/.test(src));
}

console.log("\n── live replay: Nov 10's breakfast / lunch / snack hop the eaten Nov 11 (today Nov 11) ──");
for (const s of ["b", "l", "s"]) {
  const before = NOV(), w = world(), c = chainOf(w, "2026-11-10", s);
  ok(s + ": the chain never touches Nov 11", c && !c.some(x => x.iso === "2026-11-11"), c && c.map(x => x.iso));
  ok(s + ": lands on Nov 12", c && c[1].iso === "2026-11-12");
  // the old rule put it on the eaten day — the bug this fixes
  ok(s + ": (the old rule landed it on the eaten Nov 11)", chainOf(world({ old: true }), "2026-11-10", s)[1].iso === "2026-11-11");
  w.call("kitMoveForward('2026-11-10'," + J(s) + ")");
  const P = w.ctx.kitPlan;
  ok(s + ": Nov 11 is exactly as it was", J(P["2026-11-11"]) === J(before["2026-11-11"]), P["2026-11-11"]);
  ok(s + ": Nov 10's slot is empty", !nameOf(P, "2026-11-10", s));
  const was = ["2026-11-10"].concat(DAYS.filter(d => d >= "2026-11-12" && d <= "2026-11-20")).map(d => nameOf(before, d, s));
  const now = DAYS.filter(d => d >= "2026-11-12").map(d => nameOf(P, d, s));
  ok(s + ": Nov 12…21 hold Nov 10, 12…20 in order", J(now) === J(was), now);
  ok(s + ": the other three categories never moved", ["d", "b", "l", "s"].filter(x => x !== s).every(x => DAYS.every(d => nameOf(P, d, x) === nameOf(before, d, x))));
  ok(s + ": ONE multi-path update under kitchen/", w.ctx.updates.length === 1 && w.ctx.updates[0][0] === "kitchen" && w.ctx.sets.length === 0);
  const want = c.map(x => "plan/" + x.iso + "/" + s).sort();
  ok(s + ": it writes exactly the chain's paths", J(Object.keys(w.ctx.updates[0][1]).sort()) === J(want), Object.keys(w.ctx.updates[0][1]));
  const N = { b: "breakfasts", l: "lunches", s: "snacks" }[s];
  ok(s + ": the confirm counts the hop right (9 later " + N + ", Nov 11 not counted)", new RegExp("to Thursday, Nov 12\\?[\\s\\S]*9 later " + N + " slide forward too").test(w.ctx.confirms[0]), w.ctx.confirms[0]);
}

console.log("\n── live replay: ➡ Move ALL of Nov 10 ──");
{
  const before = NOV(), prep = { "2026-11-10": { "mD1110_0": 1 } };
  const w = world({ prep });
  const chains = ["d", "b", "l", "s"].map(s => [s, chainOf(w, "2026-11-10", s)]);
  w.call("kitMoveForward('2026-11-10','all')");
  const P = w.ctx.kitPlan, up = w.ctx.updates[0][1];
  ok("every category lands on Nov 12", chains.every(x => x[1] && x[1][1].iso === "2026-11-12"), chains.map(x => x[1] && x[1][1].iso));
  ok("no path on Nov 11 is written", !Object.keys(up).some(k => k.indexOf("2026-11-11") >= 0));
  ok("Nov 11 is exactly as it was", J(P["2026-11-11"]) === J(before["2026-11-11"]));
  ok("Nov 12 holds all of Nov 10's meals", nameOf(P, "2026-11-12", "d") === "mD1110" && nameOf(P, "2026-11-12", "b") === "mB1110" && nameOf(P, "2026-11-12", "l") === "L1110" && nameOf(P, "2026-11-12", "s") === "S1110");
  ok("Nov 21 absorbs the slide for every category", ["d", "b", "l", "s"].every(s => nameOf(P, "2026-11-21", s) === nameOf(before, "2026-11-20", s)));
  const want = [];
  chains.forEach(([s, c]) => c.forEach(x => { if (s === "d") ["mid", "txt", "sides"].forEach(f => want.push("plan/" + x.iso + "/" + f)); else want.push("plan/" + x.iso + "/" + s); }));
  want.push("prepDone/2026-11-10/mD1110_0", "prepDone/2026-11-12/mD1110_0");   // the prep tick rides with its dinner
  ok("ONE update, exactly the four chains' paths (+ the prep tick)", w.ctx.updates.length === 1 && J(Object.keys(up).sort()) === J(want.sort()), Object.keys(up).length + " vs " + want.length);
  ok("the confirm lists every category landing on Nov 12", (w.ctx.confirms[0].match(/→ Thursday, Nov 12/g) || []).length === 4, w.ctx.confirms[0]);
}

console.log("\n── an eaten day is lived: it offers no move of its own, and a past move clamps past it ──");
{
  const w = world();
  ok("today's (eaten Nov 11) breakfast / lunch / snack / dinner offer no move", ["d", "b", "l", "s"].every(s => chainOf(w, "2026-11-11", s) === null));
  w.call("kitMoveForward('2026-11-11','all')");
  ok("➡ all on the eaten day writes nothing", w.ctx.updates.length === 0 && /Nothing to move/.test(w.ctx.toasts[0] || ""));
  const w2 = world({ today: "2026-11-11" });
  ok("a past day (Nov 8) lands on today's slot — but today is eaten, so Nov 12", ["b", "l", "s", "d"].every(s => chainOf(w2, "2026-11-08", s)[1].iso === "2026-11-12"));
  const w3 = world({ today: "2026-11-12" });
  ok("a day later (today Nov 12): Nov 10 → Nov 12, never back onto Nov 11", ["b", "l", "s", "d"].every(s => { const c = chainOf(w3, "2026-11-10", s); return c[1].iso === "2026-11-12" && !c.some(x => x.iso === "2026-11-11"); }));
  const w4 = world({ today: "2026-11-01" });
  ok("Nov 3's snack hops the eaten Nov 4 (lunch has nothing there and is skipped too)", chainOf(w4, "2026-11-03", "s")[1].iso === "2026-11-05" && chainOf(w4, "2026-11-02", "l")[1].iso === "2026-11-03");
  ok("📅 move to the eaten day itself → it lands on the next free one", chainOf(w4, "2026-11-10", "l", "2026-11-11")[1].iso === "2026-11-12");
}

console.log("\n── ✗ didn't happen frees the day: only the dinner hops it ──");
{
  const plan = NOV(); delete plan["2026-11-11"].eaten; plan["2026-11-11"].skipped = 1794441600000;
  const w = world({ plan });
  ok("dinner hops the skipped Nov 11", chainOf(w, "2026-11-10", "d")[1].iso === "2026-11-12");
  ok("breakfast / lunch / snack land on it", ["b", "l", "s"].every(s => chainOf(w, "2026-11-10", s)[1].iso === "2026-11-11"));
  ok("…its b/l/s are still movable", ["b", "l", "s"].every(s => chainOf(w, "2026-11-11", s)) && chainOf(w, "2026-11-11", "d") === null);
  ok("same as the old rule for every slot", ["d", "b", "l", "s"].every(s => J(chainOf(w, "2026-11-10", s)) === J(chainOf(world({ plan, old: true }), "2026-11-10", s))));
}

console.log("\n── 🍽 eating out still hops, slot by slot ──");
{
  const plan = NOV(); plan["2026-11-12"].l = { txt: "L1112", out: 1 };
  const w = world({ plan });
  const c = chainOf(w, "2026-11-10", "l");
  ok("lunch hops eaten Nov 11 AND eating-out Nov 12 → Nov 13", c[1].iso === "2026-11-13" && !c.some(x => x.iso === "2026-11-11" || x.iso === "2026-11-12"), c.map(x => x.iso));
  ok("Nov 12's other slots don't hop", chainOf(w, "2026-11-10", "b")[1].iso === "2026-11-12" && chainOf(w, "2026-11-10", "d")[1].iso === "2026-11-12");
  w.call("kitMoveForward('2026-11-10','l')");
  ok("the eating-out lunch stays put", J(w.ctx.kitPlan["2026-11-12"].l) === J({ txt: "L1112", out: 1 }));
}

console.log("\n── dinner behavior unchanged (old rule vs new, every day × every landing × three todays) ──");
{
  const runs = [];
  const variants = [NOV(), (() => { const p = NOV(); p["2026-11-14"].skipped = 1; return p; })(), (() => { const p = NOV(); p["2026-11-16"].out = 1; p["2026-11-16"].mid = "mD1116"; return p; })()];
  for (const plan of variants) for (const today of ["2026-11-01", "2026-11-11", "2026-11-12"]) {
    const a = world({ plan: JSON.parse(J(plan)), today, old: true }), b = world({ plan: JSON.parse(J(plan)), today });
    for (const from of DAYS) for (const to of [null].concat(DAYS)) runs.push([J(chainOf(a, from, "d", to)), J(chainOf(b, from, "d", to))]);
  }
  const h = k => crypto.createHash("sha1").update(runs.map(r => r[k]).join("\n")).digest("hex");
  ok("the dinner chain hash is identical (" + runs.length + " chains)", h(0) === h(1), [h(0), h(1)]);
  const a = world({ old: true }), b = world();
  a.call("kitMoveForward('2026-11-10','d')"); b.call("kitMoveForward('2026-11-10','d')");
  ok("➡ dinner from Nov 10 writes the same update and the same confirm as before", J(a.ctx.updates) === J(b.ctx.updates) && J(a.ctx.confirms) === J(b.ctx.confirms) && J(a.ctx.kitPlan) === J(b.ctx.kitPlan));
}

console.log("\n── ?dryrun=1 → no write ──");
{
  const w = world({ dry: true });
  w.call("kitMoveForward('2026-11-10','all')");
  ok("dry run: no update, no set", w.ctx.updates.length === 0 && w.ctx.sets.length === 0);
  ok("dry run: the screen still shows the move (local only)", nameOf(w.ctx.kitPlan, "2026-11-12", "l") === "L1110");
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
