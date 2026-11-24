// 🙋 UACTCLAIM — the kid's own "I did it" on Today's card (slice 6 of PLAN_unit_activity_types_2026-11-19 §4 row 6, §2(b); her go
//   2026-11-22/23 "go with her answers and build").
//   Runs the REAL UNITTRACK + DAYCARD (UNITACTCHK, DCACTS) + the activity kinds + UACTCLAIM, the Units page's REAL claim / approve /
//   reject / done, and Mom's REAL ⏳ queue (renderClaimQueue) against a fake db that records paths. No real names.
//   · on his own device (Kids' Corner kid, Mom mode off) his own chip is a button "🙋 I did it"; siblings' chips stay plain;
//     Mom's chips stay ✓ buttons; the board's stay plain
//   · the tap = unitActivityClaim's own write, activityClaims/<kid>/<key> = {ts}; the chip turns ⏳; Mom's ⏳ queue lists it; her
//     ✓ Approve posts the points as today; tapping ⏳ again cancels (the claim's own confirm)
//   · refused: another kid's chip, another day's activity, a day he is away from, a unit he is not in, Mom's device, the board
//   · his own subject's card of today counts as his unit day; another day's card does not
//   · dry run (the app's db patch) writes nothing; the queued-to-notebook claim works as before
//   · no device kid / Mom / the board → Today's card byte-identical to the tree minus UACTCLAIM
//   run: node test_unit_act_claim.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 600) : "")); } };
const J = x => JSON.stringify(x);
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
const BLK = cut("// UACTCLAIM_START", "// UACTCLAIM_END") + "// UACTCLAIM_END\n";
const UT = cut("// UNITTRACK_START", "// UNITTRACK_END"), DC = cut("// DAYCARD_START", "// DAYCARD_END");
const KIND = cut("// UACTKIND_START", "// UACTKIND_END"), LINK = cut("// UACTLINK_START", "// UACTLINK_END"), PRINT = cut("// UACTPRINT_START", "// UACTPRINT_END"), HANDS = cut("// UACTHANDS_START", "// UACTHANDS_END");
const SIGN = ["_unitActs", "_nbActKeys", "_nbActWrite", "_nbActRemove", "unitActPoints", "unitActivityClaim", "unitActivityApprove", "unitActivityReject", "unitActivityDone", "renderClaimQueue"].map(fn).join("\n");
const LR = "const LR_PARTS=[\"links\",\"supplies\",\"books\",\"orders\",\"notes\"];\n" + ["lrSafeUrl", "lrList", "lrStr", "lrDate", "lrClean", "lrHost"].map(fn).join("\n");
const DRY = (() => { const i = src.indexOf("    if(_dryRun()){\n      try{\n        const _origRef=db.ref.bind(db);"), j = src.indexOf("console.warn(\"⚠️ HA DRY-RUN", i); if (i < 0 || j < 0) throw new Error("no dry-run patch"); return src.slice(i, j) + "}catch(e){} }"; })();
const visible = h => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const ids = h => [...h.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
const balanced = h => { const st = []; for (const m of h.matchAll(/<(\/?)([a-zA-Z0-9]+)[^>]*?(\/?)>/g)) { const t = m[2].toLowerCase(); if (/^(input|img|br|hr|meta|link)$/.test(t) || m[3]) continue; if (!m[1]) st.push(t); else if (st.pop() !== t) return false; } return st.length === 0; };

console.log("── wiring ──");
ok("UACTCLAIM is one marked block right after UACTHANDS", src.indexOf("// UACTHANDS_END\n// UACTCLAIM_START") > 0 && src.split("// UACTCLAIM_START").length === 2);
const code = BLK.split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n");
ok("the block never calls the database itself — its only write door is unitActivityClaim", !/db\.|\.ref\(|\.set\(|\.update\(|\.remove\(|\.transaction\(|\.on\(|\.once\(/.test(code) && /unitActivityClaim\(uid,kid,key\)/.test(code));
const NAMES = /\b(adrienne|andrew|julian|lincoln|ellis|lucy|sara|sarah|caleb|taylor|makenzie|kenzie|dewalt|burris|melanie|howe)\b/i;
ok("no kid or family name in the block or this test, no 🔀", !NAMES.test(BLK) && BLK.indexOf("\u{1F500}") < 0 && !NAMES.test(fs.readFileSync(__filename, "utf8").split("\n").filter(l => !/^const NAMES =/.test(l)).join("\n")));
const GATE = `if(_nbActKeys(u,kid).indexOf(actKey)<0&&!(typeof uacToday==="function"&&uacToday(unitId,kid,actKey))) return; // claimable once Mom queued it to THIS kid — UACTCLAIM`;
const CHIP = `else h+=((typeof uacChipHTML==="function")&&uacChipHTML(g,act,k,done,wait,st))||('<span data-dc-actkid="'+dcEsc(k)+'" style="'+st+'">'+inner+'</span>'); });   // UACTCLAIM`;
ok("two hooks, each once, typeof-guarded: the claim's gate (U7) and the chip (UNITACTCHK)", src.split(GATE).length === 2 && fn("unitActivityClaim").indexOf(GATE) > 0 && src.split(CHIP).length === 2 && fn("dcActChecksHTML").indexOf(CHIP) > 0);
ok("approve / reject / ✓ Done are untouched (still Mom's momHere() gate)", /function unitActivityApprove\(unitId,kid,actKey\)\{\n  if\(!momHere\(\)\) return;/.test(src) && /function unitActivityReject\(unitId,kid,actKey\)\{\n  if\(!momHere\(\)\) return;/.test(src) && !/unitActivityApprove|unitActivityDone|bankDirect/.test(code));

const UNIT = () => ({ id: "harv", title: "Harvest", emoji: "🌾", enrolled: { k1: true, k2: true }, decks: [],
  activities: [
    { key: "corn_maze", title: "Draw a corn maze", emoji: "🎨", kind: "sheet", points: 5, day: 2 },
    { key: "float", title: "Build a float", emoji: "🎨", kind: "sheet", points: 15, day: 2, type: "hands" },
    { key: "walk", title: "Nature walk", emoji: "🎨", kind: "sheet", points: 3, day: 3, type: "screen" }],
  track: { mode: "seq", perWeek: 4, days: [{ id: "d1", n: 1, t: "Fields" }, { id: "d2", n: 2, t: "Mazes", nb: { activity: "corn_maze" } }, { id: "d3", n: 3, t: "Walk", nb: { activity: "walk" } }] } });
function world(o) {
  o = o || {}; const writes = [], banked = [];
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, Promise, Error, parseInt, isNaN, isFinite, WeakMap, URL,
    unitStudies: { harv: o.unit || UNIT() }, ROSTER: ["k1", "k2", "k3"], KID_NAME: { k1: "Ada", k2: "Ben", k3: "Cy" }, kcKid: o.kcKid || "",
    momHere: () => ctx.MOM, MOM: !!o.mom, _dryRun: () => !!o.dry, gwShowToast: () => {}, confirm: () => true,
    db: { ref: p => ({ set: v => writes.push(["set", p, JSON.parse(J(v))]), update: v => writes.push(["update", p]), remove: () => writes.push(["remove", p]), transaction: () => writes.push(["tx", p]), child: () => null }) },
    renderAll: () => { ctx.repaints++; }, repaints: 0, bankDirect: (k, p, n) => banked.push([k, p, n]),
    _todayDay: "monday", effectiveDay: t => t.day, weekData: { tasks: o.tasks || [] }, getActiveTasks: () => ctx.weekData.tasks,
    currData: { subjects: { k1: { sci: { display: "Science", unit: { id: "harv" }, lessonSeq: ["Fields", "Mazes", "Walk"] } } }, lessons: {}, resources: {} },
    taskLessonRef: t => t.ref || "", llLessonKey: t => "",
    claimed: {}, checked: {}, kid: "all", PACE_KCOL: {}, cap: s => s ? s[0].toUpperCase() + s.slice(1) : s, esc: s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"),
    document: { getElementById: () => null } };
  vm.createContext(ctx);
  vm.runInContext(LR + "\n" + UT + "\n" + DC + "\n" + KIND + "\n" + LINK + "\n" + PRINT + "\n" + HANDS + "\n" + (o.before ? "" : BLK) + "\n" + SIGN, ctx);
  // today's family card: the unit's Day 2 on family time, the kids at it (DAYCARD's own reader is stubbed to this one group)
  const g = { bid: "ft", key: "un", day: ctx.utRef("harv", ctx.utDay(ctx.unitStudies.harv, o.famDay || "d2")), u: ctx.unitStudies.harv, first: null, present: o.present || ["k1", "k2"], copies: [] };
  ctx.dcTodayGroups = () => (o.noFam ? [] : [g]);
  if (o.dry) vm.runInContext(DRY, ctx);
  return { ctx, writes, banked, g };
}
const CL = (k, a) => "unitStudies/harv/activityClaims/" + k + "/" + a;
const LOG = (k, a) => "unitStudies/harv/activityLog/" + k + "/" + a;
const chipOf = (h, k, from) => { const i = h.indexOf('data-dc-actkid="' + k + '"', from || 0); return i < 0 ? "" : h.slice(h.lastIndexOf("<", i), h.indexOf("</", i)); };

console.log("\n── the chips: who sees a button ──");
{
  const w = world({ kcKid: "k1" }); const h = w.ctx.dcDayHTML(w.g), row2 = h.indexOf("Build a float");
  ok("his device: his own chip on each activity is a button \"🙋 I did it\" that calls uacTap(unit, him, that activity)",
    /^<button data-dc-actkid="k1" data-uac-claim="open" onclick="uacTap\('harv','k1','corn_maze'\)" style="[^"]*min-height:44px;cursor:pointer;background:#4338ca[^"]*">Ada <span>🙋 I did it$/.test(chipOf(h, "k1")) &&
    /onclick="uacTap\('harv','k1','float'\)"/.test(chipOf(h, "k1", row2)), chipOf(h, "k1"));
  ok("…a sibling's chip stays a plain name (no button, nothing to tap)", /^<span data-dc-actkid="k2"/.test(chipOf(h, "k2")) && !/uacTap\('harv','k2'/.test(h));
  ok("…the card's HTML is balanced, no element ids added", balanced(h) && ids(h).length === ids(world({ kcKid: "k1", before: true }).ctx.dcDayHTML(world({ kcKid: "k1", before: true }).g)).length);
  const A = world({ kcKid: "k1" }), B = world({ kcKid: "k1", before: true });
  ok("…everything else on his card is byte-identical to the tree minus UACTCLAIM (only his two chips differ)", A.ctx.dcDayHTML(A.g).replace(/<button data-dc-actkid="k1"[^]*?<\/button>/g, "@") === B.ctx.dcDayHTML(B.g).replace(/<span data-dc-actkid="k1"[^]*?<\/span><\/span>/g, "@"));
  for (const [who, o] of [["Mom's device", { mom: true }], ["Mom mode left on his tablet", { mom: true, kcKid: "k1" }], ["the board (no kid picked)", {}], ["a kid not at today's family card", { kcKid: "k3" }], ["a kid marked away today", { kcKid: "k1", present: ["k2"] }]]) {
    const a = world(o), b = world(Object.assign({ before: true }, o));
    ok(who + ": Today's card byte-identical to the tree minus UACTCLAIM", a.ctx.dcDayHTML(a.g) === b.ctx.dcDayHTML(b.g));
  }
  const m = world({ mom: true }); ok("Mom still gets her ✓ buttons (dcActTap), no 🙋", /dcActTap\('harv','k1','corn_maze'\)/.test(m.ctx.dcDayHTML(m.g)) && m.ctx.dcDayHTML(m.g).indexOf("🙋") < 0);
}

console.log("\n── the tap → ⏳ → Mom's queue → approve ──");
{
  const w = world({ kcKid: "k1" }); const c = w.ctx;
  ok("tap: true, ONE write — set of unitStudies/harv/activityClaims/k1/corn_maze = {ts}", c.uacTap("harv", "k1", "corn_maze") === true && w.writes.length === 1 && w.writes[0][0] === "set" && w.writes[0][1] === CL("k1", "corn_maze") && typeof w.writes[0][2].ts === "number" && J(Object.keys(w.writes[0][2])) === J(["ts"]), w.writes);
  ok("…the screen redraws; nothing is logged, no points yet", c.repaints === 1 && w.banked.length === 0 && !(c.unitStudies.harv.activityLog || {}).k1);
  const h = c.dcDayHTML(w.g);
  ok("the chip now shows ⏳ (still his button: tapping it again is the claim's own cancel)", /^<button data-dc-actkid="k1" data-uac-claim="wait"[^>]*>Ada <span>⏳$/.test(chipOf(h, "k1")) && !/background:#4338ca/.test(chipOf(h, "k1")), chipOf(h, "k1"));
  ok("…the other activity's chip is still \"🙋 I did it\"", /🙋 I did it/.test(chipOf(h, "k1", h.indexOf("Build a float"))));
  c.MOM = true;
  const q = c.renderClaimQueue();
  ok("Mom's ⏳ queue lists it — his name, the title, the points — with ✓ Approve and ✗", /⏳ 1 waiting for your check/.test(q) && /<b[^>]*>K1<\/b> · 🌾 Draw a corn maze <b[^>]*>⭐5<\/b>/.test(q) && q.indexOf("unitActivityApprove('harv','k1','corn_maze')") > 0 && q.indexOf("unitActivityReject('harv','k1','corn_maze')") > 0, q);
  ok("Mom's Day approvals (_momApprovalsHTML) read every activityClaims leaf not yet logged, with ✓ Approve → unitActivityApprove — unchanged, so his claim is there too", /u\.activityClaims\[k\]\|\|\{\}\)\)\{\n\s*if\(\(\(u\.activityLog\|\|\{\}\)\[k\]\|\|\{\}\)\[ak\]\) continue;[^]*?unitActivityApprove\(/.test(fn("_momApprovalsHTML")));
  ok("…Mom's card shows ⏳ on his chip", /Ada <span>⏳<\/span>/.test(c.dcActChecksHTML(w.g, c.unitStudies.harv.activities[0])));
  w.writes.length = 0; c.unitActivityApprove("harv", "k1", "corn_maze");
  ok("✓ Approve: the log leaf {ts, points, claimTs}, the claim removed, +5 banked as \"🧪 Unit activity\" — as today",
    w.writes.map(x => x[0] + " " + x[1]).join(" | ") === "set " + LOG("k1", "corn_maze") + " | remove " + CL("k1", "corn_maze") && w.writes[0][2].points === 5 && typeof w.writes[0][2].claimTs === "number" && J(w.banked) === J([["k1", 5, "🧪 Unit activity"]]), [w.writes, w.banked]);
  c.MOM = false;
  const h2 = c.dcDayHTML(w.g); ok("after approve his chip is a plain ✓ (done is never a button)", /^<span data-dc-actkid="k1"[^>]*>Ada <span>✓$/.test(chipOf(h2, "k1")));
  w.writes.length = 0; ok("…and a tap on a done one does nothing", c.uacTap("harv", "k1", "corn_maze") === false && w.writes.length === 0);
}
{
  const w = world({ kcKid: "k1" }); const c = w.ctx; c.uacTap("harv", "k1", "float"); w.writes.length = 0;
  ok("tapping ⏳ again: the claim's own \"Cancel this claim?\" → ONE remove of that leaf", c.uacTap("harv", "k1", "float") === true && J(w.writes) === J([["remove", CL("k1", "float")]]));
  c.confirm = () => false; c.uacTap("harv", "k1", "float"); w.writes.length = 0;
  ok("…answering No keeps it", c.uacTap("harv", "k1", "float") === false && w.writes.length === 0 && !!c.unitStudies.harv.activityClaims.k1.float);
  c.confirm = () => true; c.MOM = true; w.writes.length = 0; c.unitActivityReject("harv", "k1", "float");
  ok("Mom's ✗ clears it (as today) — no points", J(w.writes) === J([["remove", CL("k1", "float")]]) && w.banked.length === 0);
}

console.log("\n── refused ──");
{
  const w = world({ kcKid: "k1" }); const c = w.ctx;
  ok("his device, his sibling's chip: refused, nothing written", c.uacTap("harv", "k2", "corn_maze") === false && w.writes.length === 0);
  ok("…even called straight at the claim (not queued, not his device) — nothing written", (c.unitActivityClaim("harv", "k2", "corn_maze"), w.writes.length === 0));
  ok("an activity of another day (Day 3's walk) on today's Day 2: refused", c.uacTap("harv", "k1", "walk") === false && w.writes.length === 0);
  ok("an activity that does not exist: refused", c.uacTap("harv", "k1", "nope") === false && w.writes.length === 0);
  const u = UNIT(); u.enrolled = { k2: true }; const n = world({ unit: u, kcKid: "k1" });
  ok("a unit he is not enrolled in: refused", n.ctx.uacTap("harv", "k1", "corn_maze") === false && n.writes.length === 0);
  const a = world({ kcKid: "k1", present: ["k2"] }); ok("a day he is marked away from: refused", a.ctx.uacTap("harv", "k1", "corn_maze") === false && a.writes.length === 0);
  const m = world({ kcKid: "k1", mom: true }); ok("Mom's device (Mom mode on): uacTap refused — her door is ✓ Done", m.ctx.uacTap("harv", "k1", "corn_maze") === false && m.writes.length === 0);
  const b = world(); ok("the board (no kid picked): refused", b.ctx.uacTap("harv", "k1", "corn_maze") === false && b.writes.length === 0);
  const nf = world({ kcKid: "k1", noFam: true }); ok("no family card today and no card of his own: refused", nf.ctx.uacTap("harv", "k1", "corn_maze") === false && nf.writes.length === 0);
}

console.log("\n── his own subject's card of today ──");
{
  const T = (day, ref) => ({ id: "t1", who: "k1", subjectKey: "sci", day: day, ref: ref, title: "Science", detail: "" });
  const w = world({ kcKid: "k1", noFam: true, tasks: [T("monday", "Walk")] });
  ok("his Science card today points at the unit's Day 3 → he may claim Day 3's activity", w.ctx.uacTap("harv", "k1", "walk") === true && J(w.writes.map(x => x[0] + " " + x[1])) === J(["set " + CL("k1", "walk")]), w.writes);
  ok("…but not Day 2's", w.ctx.uacTap("harv", "k1", "corn_maze") === false);
  const t2 = world({ kcKid: "k1", noFam: true, tasks: [T("tuesday", "Walk")] }); ok("the same card on another day (not today): refused", t2.ctx.uacTap("harv", "k1", "walk") === false && t2.writes.length === 0);
  const t3 = world({ kcKid: "k1", noFam: true, tasks: [Object.assign(T("monday", "Walk"), { who: "k2" })] }); ok("a sibling's card today: not his day — refused", t3.ctx.uacTap("harv", "k1", "walk") === false);
}

console.log("\n── dry run, and the old notebook door ──");
{
  const w = world({ kcKid: "k1", dry: true }); w.ctx.uacTap("harv", "k1", "corn_maze");
  ok("dry run (the app's own db patch): nothing written; the screen copy shows ⏳", w.writes.length === 0 && !!w.ctx.unitStudies.harv.activityClaims.k1.corn_maze);
  const u = UNIT(); u.nbActivity = { k2: { walk: true } }; const q = world({ unit: u }); q.ctx.unitActivityClaim("harv", "k2", "walk");
  ok("queued to his notebook: the Units page / Notebook claim works from any device, as before", J(q.writes.map(x => x[0] + " " + x[1])) === J(["set " + CL("k2", "walk")]));
  const B = world({ kcKid: "k1", before: true }); B.ctx.unitActivityClaim("harv", "k1", "corn_maze");
  ok("without the block the claim is queued-only (the tree minus UACTCLAIM refuses a day's activity)", B.writes.length === 0);
}

console.log("\n── phone width ──");
{
  const w = world({ kcKid: "k1" }); const h = w.ctx.dcActChecksHTML(w.g, w.ctx.unitStudies.harv.activities[0]);
  ok("the chip row wraps (flex-wrap) and the button has no fixed width", /data-dc-actchk="1" style="display:flex;gap:8px;flex-wrap:wrap/.test(h) && !/width:\d/.test(chipOf(h, "k1")));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
