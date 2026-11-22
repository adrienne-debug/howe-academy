// ✓ UNITACTCHK — check off a unit's activity right on today's card (a beta mom's ask 2026-11-19, Adrienne's yes: cross the day's
//   activity off from the card instead of leaving the day for the Units page).
//   Runs the REAL UNITTRACK + DAYCARD blocks (with UNITACTCHK inside) and the Units page's REAL sign-off (unitActivityDone,
//   unitActivityClaim and their helpers) against a fake db that records paths.
//   · a ✓ chip per enrolled kid (roster order) under 🎨 Today's activity, for the card's unit day
//   · Mom's tap calls the existing unitActivityDone: one set of unitStudies/<id>/activityLog/<kid>/<key>; again → one remove
//   · the card and the Units page agree both ways (one record); a claim shows ⏳ on the card
//   · a kid sees the states, nothing to tap, nothing written; dry run (the app's own db patch) writes nothing
//   · a card with no unit day or no activity draws byte-identical to before
//   run: node test_unit_act_check.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
const UT = cut("// UNITTRACK_START", "// UNITTRACK_END"), DC = cut("// DAYCARD_START", "// DAYCARD_END"), AC = cut("// UNITACTCHK_START", "// UNITACTCHK_END");
const HOOK = "+dcActChecksHTML(g,act)";
const DC_BEFORE = DC.replace(HOOK, "").replace(cut("// UNITACTCHK_START", "// UNITACTCHK_END") + "// UNITACTCHK_END\n", "");   // the card as it drew before
const SIGN = ["_unitActs", "_nbActKeys", "_nbActWrite", "_nbActRemove", "unitActPoints", "unitActivityClaim", "unitActivityDone"].map(fn).join("\n");
const LR = "const LR_PARTS=[\"links\",\"supplies\",\"books\",\"orders\",\"notes\"];\n" + ["lrSafeUrl", "lrList", "lrStr", "lrDate", "lrClean", "lrHost"].map(fn).join("\n");
const DRY = (() => { const i = src.indexOf("    if(_dryRun()){\n      try{\n        const _origRef=db.ref.bind(db);"), j = src.indexOf("console.warn(\"⚠️ HA DRY-RUN", i); if (i < 0 || j < 0) throw new Error("no dry-run patch"); return src.slice(i, j) + "}catch(e){} }"; })();
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const J = x => JSON.stringify(x);
const visible = h => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const UNIT = () => ({ id: "fall", title: "Fall", emoji: "🍂", decks: [], enrolled: { k2: true, k1: true },
  activities: [{ key: "leaf_hunt", title: "Leaf hunt", emoji: "🍁", kind: "sheet", points: 5, day: 1 }, { key: "thank_list", title: "Thank-you list", kind: "sheet", points: 0, day: 2 }],
  track: { mode: "seq", perWeek: 4, days: [
    { id: "d1", n: 1, t: "Leaves change", nb: { activity: "leaf_hunt" }, res: { books: [{ title: "Leaf Man" }] } },
    { id: "d2", n: 2, t: "Thankful", nb: { activity: "thank_list" } },
    { id: "d3", n: 3, t: "Why leaves fall", res: { books: [{ title: "Fall Leaves" }] }, note: "Go outside first." }] } });
function world(o) {
  o = o || {}; const writes = [], banked = [];
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, Promise, Error, parseInt, isNaN, isFinite, URL,
    unitStudies: { fall: o.unit || UNIT() }, ROSTER: ["k1", "k2", "k3"], KID_NAME: { k1: "Ada", k2: "Ben", k3: "Cy" },
    momHere: () => ctx.MOM, MOM: o.mom !== false, _dryRun: () => !!o.dry,
    db: { ref: p => ({ set: v => writes.push(["set", p, JSON.parse(J(v))]), update: v => writes.push(["update", p]), remove: () => writes.push(["remove", p]), transaction: () => writes.push(["tx", p]), child: () => null }) },
    renderAll: () => { ctx.repaints++; }, repaints: 0, confirm: () => true, bankDirect: (k, p, n) => banked.push([k, p]) };
  vm.createContext(ctx);
  vm.runInContext(LR + "\n" + UT + "\n" + (o.before ? DC_BEFORE : DC) + "\n" + SIGN, ctx);
  if (o.dry) vm.runInContext(DRY, ctx);   // the app's own initFb dry-run patch over db
  return { ctx, writes, banked };
}
const G = (c, id) => { const u = c.unitStudies.fall; return { day: c.utRef("fall", c.utDay(u, id)), u: u, first: null, present: [] }; };
const P = (k, a) => "unitStudies/fall/activityLog/" + k + "/" + a;

console.log("── the block ──");
ok("UNITACTCHK is a marked block inside DAYCARD, hooked once into 🎨 Today's activity", AC.length > 800 && DC.indexOf("// UNITACTCHK_START") > 0 && DC.split(HOOK).length === 2 && /Today\\u2019s [^\n]*\+dcActChecksHTML\(g,act\)\)\)\.join\(""\)\);/.test(DC));
ok("the block writes nothing itself: no db call, no new path — its only write door is the Units page's unitActivityDone", !/db\.|\.ref\(|\.set\(|\.update\(|\.remove\(/.test(AC.replace(/^\s*\/\/.*$/mg, "")) && /unitActivityDone\(uid,kid,key\)/.test(AC));
ok("the tap is Mom-only (momHere), as the Units page's ✓ Done is", /function dcActTap\(uid,kid,key\)\{ if\(!\(typeof momHere==="function"&&momHere\(\)\)/.test(AC) && /function unitActivityDone\(unitId,kid,actKey\)\{\n  if\(!momHere\(\)\) return;/.test(src));
ok("the Units page's ✓ Done calls the same function with (unit id, kid, activity key) and reads the same record",
  /h\+=btn\(done\?'↩︎ Not done':'✓ Done','unitActivityDone\('\+args\+'\)',!!done\);/.test(src) && /const args='\\''\+esc\(u\.id\)\+'\\',\\''\+esc\(k\)\+'\\',\\''\+esc\(a\.key\)\+'\\'';/.test(src) && /const done=\(\(u\.activityLog\|\|\{\}\)\[k\]\|\|\{\}\)\[a\.key\];/.test(src));
ok("no 🔀 and no family names in the block", AC.indexOf("\u{1F500}") < 0 && !/Lincoln|Ellis|Lucy|Julian|Sara\b|DeWalt|taylor|makenzie|andrew|caleb/i.test(AC));

console.log("\n── the chips on the card ──");
{
  const { ctx } = world(); const g = G(ctx, "d1"), act = ctx.dcActivity(g);
  const h = ctx.dcActChecksHTML(g, act), card = ctx.dcDayHTML(g);
  ok("one chip per enrolled kid, in roster order (an unenrolled kid gets none)", J((h.match(/data-dc-actkid="([^"]+)"/g) || []).map(s => s.slice(16, -1))) === J(["k1", "k2"]), h);
  ok("names from KID_NAME, each not done yet (○)", visible(h) === "Ada ○ Ben ○", visible(h));
  ok("the chips sit on the card under the activity (title, then chips)", card.indexOf("Leaf hunt") > 0 && card.indexOf("data-dc-actchk") > card.indexOf("Leaf hunt"));
  ok("Mom gets buttons that call dcActTap with (unit, kid, activity)", (h.match(/<button /g) || []).length === 2 && h.indexOf("onclick=\"dcActTap('fall','k1','leaf_hunt')\"") > 0 && h.indexOf("onclick=\"dcActTap('fall','k2','leaf_hunt')\"") > 0);
  ok("small on the card: 15px type, 6px×12px pill", /font-size:15px/.test(h) && /padding:6px 12px/.test(h) && !/font-size:(1[6-9]|[2-9]\d)px/.test(h));
  const g2 = G(ctx, "d2"); ok("the chips follow the card's unit day (Day 2 → its own activity)", ctx.dcActChecksHTML(g2, ctx.dcActivity(g2)).indexOf("'thank_list'") > 0);
}

console.log("\n── Mom's ✓ = the Units page's sign-off ──");
{
  const { ctx, writes, banked } = world(); const g = G(ctx, "d1"), act = ctx.dcActivity(g);
  ok("Mom's tap returns true", ctx.dcActTap("fall", "k1", "leaf_hunt") === true);
  ok("ONE write: set of unitStudies/fall/activityLog/k1/leaf_hunt = {ts, points}", writes.length === 1 && writes[0][0] === "set" && writes[0][1] === P("k1", "leaf_hunt") && writes[0][2].points === 5 && typeof writes[0][2].ts === "number", writes);
  ok("points post as on the Units page (+5 to that kid) and the screen redraws", J(banked) === J([["k1", 5]]) && ctx.repaints === 1);
  ok("the card now shows ✓ for that kid only", visible(ctx.dcActChecksHTML(g, act)) === "Ada ✓ Ben ○");
  ok("the Units page reads it as done (the same activityLog leaf)", !!((ctx.unitStudies.fall.activityLog || {}).k1 || {}).leaf_hunt);
  writes.length = 0; banked.length = 0;
  ctx.dcActTap("fall", "k1", "leaf_hunt");
  ok("tapping again un-checks the Units page's way: ONE remove of the same leaf, the points taken back", J(writes) === J([["remove", P("k1", "leaf_hunt")]]) && J(banked) === J([["k1", -5]]), [writes, banked]);
  ok("…and the card shows ○ again; the Units page sees it not done", visible(ctx.dcActChecksHTML(g, act)) === "Ada ○ Ben ○" && !((ctx.unitStudies.fall.activityLog || {}).k1 || {}).leaf_hunt);
}
{
  const { ctx, writes } = world(); const g = G(ctx, "d1"), act = ctx.dcActivity(g);
  ctx.unitActivityDone("fall", "k2", "leaf_hunt");   // the Units page's ✓ Done
  ok("a ✓ on the Units page shows ✓ on the card", visible(ctx.dcActChecksHTML(g, act)) === "Ada ○ Ben ✓");
  ctx.dcActTap("fall", "k2", "leaf_hunt");
  ok("…and un-checking it from the card clears the Units page's record", !((ctx.unitStudies.fall.activityLog || {}).k2 || {}).leaf_hunt && writes[writes.length - 1][0] === "remove");
  ctx.unitStudies.fall.nbActivity = { k1: { leaf_hunt: true } }; ctx.MOM = false; ctx.unitActivityClaim("fall", "k1", "leaf_hunt"); ctx.MOM = true;   // a kid's claim on the Units page
  ok("a kid's claim from the Units page shows ⏳ on the card", visible(ctx.dcActChecksHTML(g, act)) === "Ada ⏳ Ben ○");
  writes.length = 0; ctx.dcActTap("fall", "k1", "leaf_hunt");
  ok("Mom's ✓ on a claimed one does what the Units page's ✓ Done does: logs it, clears the claim and the notebook queue",
    writes.map(w => w[0] + " " + w[1]).join(" | ") === "set " + P("k1", "leaf_hunt") + " | remove unitStudies/fall/activityClaims/k1/leaf_hunt | remove unitStudies/fall/nbActivity/k1" && visible(ctx.dcActChecksHTML(g, act)) === "Ada ✓ Ben ○", writes);
}

console.log("\n── a kid's view ──");
{
  const { ctx, writes, banked } = world({ mom: false }); const g = G(ctx, "d1"), act = ctx.dcActivity(g);
  ctx.unitStudies.fall.activityLog = { k2: { leaf_hunt: { ts: 1, points: 5 } } };
  const h = ctx.dcActChecksHTML(g, act);
  ok("a kid sees each name's state but no button", visible(h) === "Ada ○ Ben ✓" && !/<button|onclick/.test(h));
  ok("a kid's tap (if called) does nothing: false, no write, no points", ctx.dcActTap("fall", "k1", "leaf_hunt") === false && writes.length === 0 && banked.length === 0);
}

console.log("\n── dry run ──");
{
  const { ctx, writes } = world({ dry: true }); const g = G(ctx, "d1"), act = ctx.dcActivity(g);
  ctx.dcActTap("fall", "k1", "leaf_hunt"); ctx.dcActTap("fall", "k2", "leaf_hunt"); ctx.dcActTap("fall", "k2", "leaf_hunt");
  ok("under the app's dry-run db patch the taps write nothing", writes.length === 0, writes);
  ok("…the screen still shows the local ✓ (as the Units page does in dry run)", visible(ctx.dcActChecksHTML(g, act)) === "Ada ✓ Ben ○");
}

console.log("\n── cards without an activity draw as before ──");
{
  const A = world(), B = world({ before: true });
  ["d3"].forEach(id => ok("a unit day with no activity: dcDayHTML byte-identical to before", A.ctx.dcDayHTML(G(A.ctx, id)) === B.ctx.dcDayHTML(G(B.ctx, id))));
  ok("no unit day / no activity / no kids enrolled → no chips", A.ctx.dcActChecksHTML({ day: null, u: null }, null) === "" && A.ctx.dcActChecksHTML(G(A.ctx, "d3"), null) === "" &&
    (c => c.dcActChecksHTML(G(c, "d1"), { key: "leaf_hunt" }))(world({ unit: Object.assign(UNIT(), { enrolled: {} }) }).ctx) === "");
  const a = A.ctx.dcDayHTML(G(A.ctx, "d1")), b = B.ctx.dcDayHTML(G(B.ctx, "d1"));
  ok("a day with an activity: the card is the same plus only the chip row", a === b.replace(/(Leaf hunt[^]*?<\/div>)(<\/div><\/section>)/, (m, x, y) => x + A.ctx.dcActChecksHTML(G(A.ctx, "d1"), A.ctx.dcActivity(G(A.ctx, "d1"))) + y), [a.length, b.length]);
  const C = world({ unit: Object.assign(UNIT(), { enrolled: {} }) }), D = world({ unit: Object.assign(UNIT(), { enrolled: {} }), before: true });
  ok("a unit nobody is enrolled in: the card byte-identical to before", C.ctx.dcDayHTML(G(C.ctx, "d1")) === D.ctx.dcDayHTML(G(D.ctx, "d1")));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
