/*
 * 🃏 DRILLSAVE (her yes 2026-11-20 to slice 2 of DESIGN_drill_rows_curriculum_2026-11-19.md: "the plan write becomes one
 * function that takes the child"). Nothing on screen changes. Against code sliced out of index.html (RETRWEEK, the Retrieval
 * Plan editor with RETRSAVE + DRILLSAVE inside it):
 *   1. drPlanWrite(kid, payload, o) writes for the child it is TOLD (not masteryKid), at mastery/retrievalPlan/<kid>, with a
 *      targeted update() — never set()
 *   2. inert in ?dryrun=1 and with no db (the mirror + ha_mastery copy still happen, as before)
 *   3. the mirror keeps the kid's other keys; only the keys handed in are written (week/week2 without settings is fine)
 *   4. the live-week pass is queued only on o.rhythm, for that child
 *   5. refuses no kid / a bad kid / an empty payload — nothing written anywhere
 *   6. retrAdminSave through it: the exact payload of the old Save for several editor states (Row 2 off / same-as-Row-1
 *      dropped, an emptied Row 2 → {}, settings carried), the same path, the same effect order
 *   run:  node test_drill_plan_write.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
function slice(a, b) { const i = src.indexOf(a), j = src.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error("marker " + a); return src.slice(i, j + b.length); }
const RETRWEEK = slice("// RETRWEEK_START", "// RETRWEEK_END");
const DRILLSAVE = slice("// DRILLSAVE_START", "// DRILLSAVE_END");
const ADMIN = src.slice(src.indexOf("let retrAdminLocal=null;"), src.indexOf("// ── P4: schedule day-card strip"));
const clone = x => JSON.parse(JSON.stringify(x));
const J = JSON.stringify;

function world(o) {
  o = o || {};
  const log = [], writes = [], sets = [], queued = [], ls = [];
  const env = {
    console, JSON, Math, Object, Array, Set, Map, String, Number, parseInt, parseFloat, isNaN, RegExp, Error, Date,
    masteryKid: o.kid || "kida", masteryData: { retrievalPlan: clone(o.plan || {}) },
    ROSTER: ["kida", "kidb"], SL_KLBL: { kida: "Kid A", kidb: "Kid B" },
    retrTracks: k => (k === "kida" ? [{ key: "t" }] : []),
    retrSettings: () => ({ slot_min_drill: 5, slot_min_match: 10, sprint_seconds: 60, sprint_rounds: 2, review_count: 3 }),
    _dryRun: () => !!o.dry,
    HA_LS: { setItem: (k, v) => { log.push("ls"); ls.push({ k, v }); }, getItem() { return null; } },
    retrLiveQueue: k => { log.push("queue"); queued.push(k); return true; },
    retrLivePending: () => false,
    _mastRe: () => log.push("repaint"),
    document: { getElementById: id => (id === "retrAdminSaved" ? env.savedEl : null) }, savedEl: { innerHTML: "" },
    log, writes, sets, queued, ls,
  };
  if (o.db !== false) env.db = { ref: p => ({
    update: v => { log.push("db"); writes.push({ p, v: clone(v), mirrorFirst: J(env.masteryData.retrievalPlan[p.split("/").pop()]) }); },
    set: v => sets.push({ p, v }), remove: () => sets.push({ p, remove: true }) }) };
  else env.db = null;
  vm.createContext(env);
  vm.runInContext(RETRWEEK + "\n" + ADMIN + "\n;this.__admin=()=>retrAdminLocal;this.__savedKid=()=>retrAdminSavedKid;", env);
  return env;
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
console.log("1. writes for the child it is told");
{
  const w = world({ kid: "kida" });
  const p = { week: { mon: "drill", tue: "off", wed: "match", thu: "off", fri: "off" }, week2: {} };
  const r = w.drPlanWrite("kidb", p, {});
  ok("returns true", r === true);
  ok("one targeted update() at mastery/retrievalPlan/kidb — the child it was told, not masteryKid", w.writes.length === 1 && w.writes[0].p === "mastery/retrievalPlan/kidb", w.writes);
  ok("the payload is written as handed", J(w.writes[0].v) === J(p), w.writes[0].v);
  ok("nothing written for the kid on screen", !w.writes.some(x => /kida$/.test(x.p)) && !w.masteryData.retrievalPlan.kida);
  ok("never a set() / remove()", w.sets.length === 0, w.sets);
  ok("the mirror has it", J(w.masteryData.retrievalPlan.kidb) === J(p), w.masteryData.retrievalPlan.kidb);
  ok("ha_mastery saved with the mirror", w.ls.length === 1 && w.ls[0].k === "ha_mastery" && JSON.parse(w.ls[0].v).retrievalPlan.kidb.week.mon === "drill");
  ok("the mirror is a copy, not the caller's object", (p.week.mon = "sprint", w.masteryData.retrievalPlan.kidb.week.mon === "drill"));
  ok("no repaint, no 'Saved' marker — those belong to the Mastery panel", w.log.indexOf("repaint") < 0 && w.__savedKid() === null, w.log);
}
{
  const w = world({});
  w.masteryData = { };   // no retrievalPlan node yet
  w.drPlanWrite("kida", { week: { mon: "drill" } }, {});
  ok("makes the retrievalPlan mirror node when there is none", w.masteryData.retrievalPlan && w.masteryData.retrievalPlan.kida.week.mon === "drill");
}

console.log("2. inert in dry run and with no db");
{
  const w = world({ dry: true });
  const r = w.drPlanWrite("kidb", { week: { mon: "drill" } }, { rhythm: true });
  ok("?dryrun=1: no database write", w.writes.length === 0 && w.sets.length === 0 && r === true, w.writes);
  ok("?dryrun=1: the mirror + ha_mastery still update (as the old save did)", w.masteryData.retrievalPlan.kidb.week.mon === "drill" && w.ls.length === 1);
}
{
  const w = world({ db: false });
  const r = w.drPlanWrite("kidb", { week: { mon: "drill" } }, {});
  ok("no db: nothing thrown, no write, mirror kept", r === true && w.writes.length === 0 && w.masteryData.retrievalPlan.kidb.week.mon === "drill");
}

console.log("3. only the keys handed in; the kid's other keys kept");
{
  const w = world({ plan: { kidb: { settings: { slot_min_drill: 7 }, week: { mon: "sprint" }, week2: { tue: "match" }, mathfacts_order: ["x", "y"] } } });
  w.drPlanWrite("kidb", { week: { mon: "drill", tue: "off", wed: "off", thu: "off", fri: "off" }, week2: {} }, {});
  ok("week/week2 without settings: the update() carries only those two keys", Object.keys(w.writes[0].v).sort().join() === "week,week2", Object.keys(w.writes[0].v));
  const m = w.masteryData.retrievalPlan.kidb;
  ok("the mirror keeps settings untouched", J(m.settings) === J({ slot_min_drill: 7 }), m.settings);
  ok("…and the kid's other keys (mathfacts_order)", J(m.mathfacts_order) === '["x","y"]', m);
  ok("…and takes the new week / emptied week2", m.week.mon === "drill" && J(m.week2) === "{}", m);
  ok("the other kid's plan is untouched", !w.masteryData.retrievalPlan.kida);
}

console.log("4. the live pass only on o.rhythm");
{
  const w = world({});
  w.drPlanWrite("kidb", { week: { mon: "drill" } }, {});
  w.drPlanWrite("kidb", { week: { mon: "drill" } });
  ok("no o.rhythm → nothing queued", w.queued.length === 0, w.queued);
  w.drPlanWrite("kidb", { week: { mon: "match" } }, { rhythm: true });
  ok("o.rhythm → the pass is queued for that child", J(w.queued) === '["kidb"]', w.queued);
  ok("…after the write and the ha_mastery copy", J(w.log.slice(-3)) === '["db","ls","queue"]', w.log);
}

console.log("5. refuses no kid / a bad kid / an empty payload");
for (const [label, args] of [["no kid", [undefined, { week: {} }]], ["empty kid", ["", { week: { mon: "drill" } }]], ["null kid", [null, { week: { mon: "drill" } }]],
  ["a kid that is a path", ["kida/settings", { week: { mon: "drill" } }]], ["a non-string kid", [{}, { week: { mon: "drill" } }]],
  ["no payload", ["kida", undefined]], ["an empty payload", ["kida", {}]], ["an array payload", ["kida", [1]]]]) {
  const w = world({ plan: { kida: { week: { mon: "sprint" } } } });
  const before = J(w.masteryData);
  const r = w.drPlanWrite(args[0], args[1], { rhythm: true });
  ok(label + " → false, nothing written, mirror and queue untouched", r === false && w.writes.length === 0 && w.sets.length === 0 && w.ls.length === 0 && w.queued.length === 0 && J(w.masteryData) === before, { r, writes: w.writes });
}

console.log("6. retrAdminSave through it — the old payload, path and order");
// Each case: stored plan + taps → the exact payload the old Save button / RETRSAVE wrote (pinned).
const CASES = [
  { name: "fresh kid, one Row 1 tap", kid: "kidb", plan: {}, run: w => { w.retrAdminInit(); w.retrAdminCycleDay("mon"); },
    want: { settings: {}, week: { mon: "sprint", tue: "off", wed: "off", thu: "off", fri: "off" }, week2: {} }, rhythm: true },
  { name: "partly stored row + settings carried", kid: "kida", plan: { kida: { settings: { slot_min_drill: 7, recheck_ladder: [1, 4] }, week: { mon: "drill", tue: "match" }, mathfacts_order: ["x"] } },
    run: w => { w.retrAdminInit(); w.retrAdminCycleDay("wed"); },
    want: { settings: { slot_min_drill: 7, recheck_ladder: [1, 4] }, week: { mon: "drill", tue: "match", wed: "sprint", thu: "off", fri: "off" }, week2: {} }, rhythm: true },
  { name: "Row 2: off and same-as-Row-1 days dropped", kid: "kida", plan: { kida: { week: { mon: "match", tue: "drill", wed: "off", thu: "off", fri: "sprint" } } },
    run: w => { w.retrAdminInit(); Object.assign(w.__admin().week2, { mon: "match", tue: "sprint", wed: "off", thu: "recheck", fri: "sprint" }); w.retrAdminSave(); },
    want: { settings: {}, week: { mon: "match", tue: "drill", wed: "off", thu: "off", fri: "sprint" }, week2: { tue: "sprint", thu: "recheck" } }, rhythm: false },
  { name: "emptied Row 2 → {}", kid: "kida", plan: { kida: { week: { mon: "match", tue: "off", wed: "off", thu: "off", fri: "off" }, week2: { mon: "drill" } } },
    run: w => { w.retrAdminInit(); w.retrAdminCycleDay("mon", 2); },   // drill → off
    want: { settings: {}, week: { mon: "match", tue: "off", wed: "off", thu: "off", fri: "off" }, week2: {} }, rhythm: true },
  { name: "a number box (quiet path)", kid: "kidb", plan: { kidb: { week: { mon: "drill", tue: "drill", wed: "drill", thu: "drill", fri: "drill" } } },
    run: w => { w.retrAdminInit(); w.retrAdminNum("slot_min_match", "12"); },
    want: { settings: { slot_min_match: 12 }, week: { mon: "drill", tue: "drill", wed: "drill", thu: "drill", fri: "drill" }, week2: {} }, rhythm: false, quiet: true },
];
for (const c of CASES) {
  const w = world({ kid: c.kid, plan: c.plan });
  const other = J((c.plan[c.kid] || {}).mathfacts_order);
  c.run(w);
  const u = w.writes[w.writes.length - 1];
  ok(c.name + ": one write, at the kid on screen", w.writes.length === 1 && u.p === "mastery/retrievalPlan/" + c.kid, w.writes);
  ok(c.name + ": the exact old payload", J(u.v) === J(c.want), u.v);
  ok(c.name + ": mirror = old mirror (other keys kept + payload)", J(w.masteryData.retrievalPlan[c.kid]) === J(Object.assign({}, clone(c.plan[c.kid] || {}), c.want)), w.masteryData.retrievalPlan[c.kid]);
  ok(c.name + ": the mirror was updated before the database write", u.mirrorFirst === J(w.masteryData.retrievalPlan[c.kid]));
  const want = ["db", "ls"].concat(c.rhythm ? ["queue"] : []).concat(c.quiet ? [] : ["repaint"]);
  ok(c.name + ": effects in the old order (" + want.join(" → ") + ")", J(w.log) === J(want), w.log);
  ok(c.name + ": live pass queued only for a day tap", J(w.queued) === (c.rhythm ? J([c.kid]) : "[]"), w.queued);
  ok(c.name + ": 'Saved ✓' for that kid", w.__savedKid() === c.kid && (!c.quiet || /Saved ✓/.test(w.savedEl.innerHTML)));
  if (other) ok(c.name + ": the kid's other keys survive", J(w.masteryData.retrievalPlan[c.kid].mathfacts_order) === other);
}
{
  const w = world({ kid: "kida" });
  w.retrAdminInit(); w.retrAdminCycleDay("mon");
  w.masteryKid = "kidb";
  const n = w.writes.length, r = w.retrAdminSave();
  ok("wrong-kid guard still runs before the write", r === false && w.writes.length === n && !w.masteryData.retrievalPlan.kidb, w.writes);
}
{
  const w = world({ kid: "kida", dry: true });
  w.retrAdminInit(); w.retrAdminCycleDay("mon");
  ok("retrAdminSave in ?dryrun=1: no database write (mirror only)", w.writes.length === 0 && w.masteryData.retrievalPlan.kida.week.mon === "sprint");
}
{
  // the editor kept for a kid id the write refuses → no write, no "Saved" for it
  const w = world({});
  w.masteryKid = "";
  vm.runInContext("retrAdminLocal={kid:'',settings:{},week:{mon:'drill'},week2:{}};", w);
  const r = w.retrAdminSave({ rhythm: true });
  ok("an empty masteryKid never updates mastery/retrievalPlan itself", r === false && w.writes.length === 0 && w.queued.length === 0 && w.__savedKid() === null, w.writes);
}

console.log("7. the block");
{
  const save = src.slice(src.indexOf("function retrAdminSave("), src.indexOf("function retrAdminSavedHtml("));
  ok("retrAdminSave no longer writes itself — it calls drPlanWrite once", !/db\.ref\(|HA_LS\.setItem|retrLiveQueue\(/.test(save) && (save.match(/drPlanWrite\(/g) || []).length === 1);
  ok("DRILLSAVE has exactly one db.ref(), an update(), behind db && !_dryRun()", (DRILLSAVE.match(/db\.ref\(/g) || []).length === 1 && /db&&!\(typeof _dryRun==="function"&&_dryRun\(\)\)\) db\.ref\("mastery\/retrievalPlan\/"\+kid\)\.update\(payload\)/.test(DRILLSAVE));
  ok("no set() / remove() in DRILLSAVE", !/\.set\(|\.remove\(/.test(DRILLSAVE));
  ok("DRILLSAVE does not read masteryKid or the Mastery editor copy", !/masteryKid|retrAdminLocal|retrAdminSavedKid|_mastRe/.test(DRILLSAVE.replace(/^\/\/.*$/mg, "")));
  ok("no kid or family names in the block", !/\b(lincoln|ellis|lucy|julian|taylor|makenzie|andrew|caleb|sara|melanie|howe|dewalt|burris)\b/i.test(DRILLSAVE));
  ok("Reset is unchanged (still its own remove, slice 6's job)", /function retrAdminReset\(\)\{[\s\S]*?if\(db\) db\.ref\("mastery\/retrievalPlan\/"\+kid\)\.remove\(\);/.test(src));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
