/*
 * 🔁 REGROUP_CARRY — saving a regrouped lesson list keeps what was finished finished.
 *
 * Sara (DeWalt), 2026-11-09: she used Days per lesson ×1 ("back to one line per lesson") then Save list on
 * Kenzie's AAS 4 (177 steps → 36 lessons) and Andrew's AAS 1 (37 steps → 8 lessons). Every line got a
 * fresh id, so 22 + 25 ✓ marks stopped counting and both kids were "back on" the first lesson of the list.
 * Now "Lesson 3 · day 4 of 5" and "Lesson 3" are one lesson: ids follow the lesson, and a day that did not
 * exist before is marked done only when its whole old lesson was done.
 *
 *   run:  node test_regroup_carry.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const la = src.indexOf("// LID_START"), lb = src.indexOf("// LID_END");
if (la < 0 || lb < 0) { console.error("LID markers not found"); process.exit(1); }
const block = src.slice(la, lb);
if (block.indexOf("// REGROUP_CARRY_START") < 0 || block.indexOf("// REGROUP_CARRY_END") < 0) { console.error("REGROUP_CARRY markers not found inside LID"); process.exit(1); }

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const L = n => "L" + String(n).padStart(4, "0");
const range = (a, n) => Array.from({ length: n }, (_, i) => L(a + i));

function world() {
  const ctx = {
    console, currData: { subjects: {}, done: {}, lessons: {} }, paceData: {}, masteryData: {},
    cbTodayISO: () => "2026-11-10", planBacked: () => false, momModeActive: true, adminPinUnlocked: true, db: null,
    document: { getElementById: () => null }, HA_LS: { getItem: () => null, setItem() {}, removeItem() {} },
    gwShowToast() {}, confirm: () => true, alert() {}, renderAll() {}, esc: s => String(s), cap: s => String(s), dbg() {},
    setTimeout, clearTimeout,
  };
  vm.createContext(ctx);
  new vm.Script(block, { filename: "LID.js" }).runInContext(ctx);
  return ctx;
}
// A subject with a list, ids and (optionally) stamped done marks. done = ids that are finished.
function subject(ctx, kid, sk, seq, firstId, done, extra) {
  const ids = range(firstId, seq.length);
  const s = Object.assign({ display: sk, lessonSeq: seq.slice(), lessonIds: ids.slice(), nextLid: firstId + seq.length, total: seq.length }, extra || {});
  (ctx.currData.subjects[kid] = ctx.currData.subjects[kid] || {})[sk] = s;
  const node = {}; (done || []).forEach((id, i) => { node[id] = { day: "2026-10-" + String(5 + (i % 20)).padStart(2, "0"), src: "check", ts: "t" }; });
  (ctx.currData.done[kid] = ctx.currData.done[kid] || {})[sk] = node;
  return s;
}
function save(ctx, kid, sk, newSeq) { const patch = {}; const r = ctx.setLessonSeq(kid, sk, newSeq, { patch }); return { r, patch }; }
const doneWrites = patch => Object.keys(patch).filter(k => k.startsWith("done/"));
const firstUndone = (ctx, kid, sk) => { const d = ctx.lidDoneIdx(kid, sk); const s = ctx.currData.subjects[kid][sk]; return s.lessonSeq.findIndex((t, i) => !d.has(i)); };

// ── A. Kenzie's shape: 177 steps (Lessons 3–38 × 5, starting at Lesson 3 day 4) → ×1 → 36 lessons ──────────
{
  const ctx = world();
  const bases = Array.from({ length: 36 }, (_, i) => "Lesson " + (i + 3));
  const old = ctx.lessonExpandDays(bases, 5).slice(3);
  ok("A: the old list is 177 steps and starts at Lesson 3 · day 4 of 5", old.length === 177 && old[0] === "Lesson 3 · day 4 of 5");
  subject(ctx, "k", "aas_4", old, 139, range(139, 22), { doneImportedAt: "2026-10-03" });   // L0139–L0160 ✓ (through Lesson 7 day 5)
  ok("A: before — the kid is on Lesson 8 day 1", old[firstUndone(ctx, "k", "aas_4")] === "Lesson 8 · day 1 of 5");
  const one = ctx.lessonExpandDays(old, 1);
  ok("A: ×1 gives the 36 plain lessons", eq(one, bases));
  const { r, patch } = save(ctx, "k", "aas_4", one);
  ok("A: Lessons 3–7 keep their LAST step's id", eq(r.lessonIds.slice(0, 6), [L(140), L(145), L(150), L(155), L(160), L(165)]));
  ok("A: no id is minted (nextLid stays 316)", r.nextLid === 316 && patch["subjects/k/aas_4/nextLid"] === 316);
  ok("A: Lessons 3–7 are still finished", eq([...ctx.lidDoneIdx("k", "aas_4")].sort((a, b) => a - b), [0, 1, 2, 3, 4]));
  ok("A: after — the kid is on Lesson 8 (not back on Lesson 3)", one[firstUndone(ctx, "k", "aas_4")] === "Lesson 8");
  ok("A: no done record needed to be written", doneWrites(patch).length === 0);
}
// ── B. Andrew's shape: 37 steps (L18 day 4 → L25 day 5) → ×1 → 8 lessons, lesson day pinned Wed ─────────────
{
  const ctx = world();
  const bases = ["L18 CK and the CK Rule", "L19 NG", "L20 NK", "L21 Compound Words", "L22 Adding S to Make Words Plural", "L23 Adding ES to Make Words Plural", "L24 The Long Vowel Rule", "L25 Putting It All Together"];
  const old = ctx.lessonExpandDays(bases, 5).slice(3);
  ok("B: 37 old steps", old.length === 37);
  subject(ctx, "a", "aas_1", old, 8, range(8, 25), { doneImportedAt: "2026-10-02", lessonDay: "Wed" });   // L0008–L0032: through L23 day 3
  const { r, patch } = save(ctx, "a", "aas_1", ctx.lessonExpandDays(old, 1));
  ok("B: L18–L22 keep their last step's id; L23 keeps its (unfinished) last step", eq(r.lessonIds, [L(9), L(14), L(19), L(24), L(29), L(34), L(39), L(44)]));
  ok("B: L18–L22 finished, L23 is the current lesson", eq([...ctx.lidDoneIdx("a", "aas_1")].sort((a, b) => a - b), [0, 1, 2, 3, 4]) && r.lessonSeq[firstUndone(ctx, "a", "aas_1")] === "L23 Adding ES to Make Words Plural");
  ok("B: nextLid stays 45, nothing written to done/", r.nextLid === 45 && doneWrites(patch).length === 0);
}
// ── C. ×4 on a plain list: a finished lesson's new days are carried; the current lesson's are not ──────────────
{
  const ctx = world();
  subject(ctx, "k", "ws", ["Lesson 1", "Lesson 2", "Lesson 3"], 1, [L(1)], { doneImportedAt: "2026-09-01" });
  ctx.currData.done.k.ws[L(1)].day = "2026-11-02";
  const { r, patch } = save(ctx, "k", "ws", ctx.lessonExpandDays(["Lesson 1", "Lesson 2", "Lesson 3"], 4));
  ok("C: day 1 of each lesson keeps the lesson's old id", r.lessonIds[0] === L(1) && r.lessonIds[4] === L(2) && r.lessonIds[8] === L(3));
  ok("C: 9 new days minted in order (nextLid 13)", eq(r.lessonIds.slice(1, 4), [L(4), L(5), L(6)]) && r.nextLid === 13);
  const w = doneWrites(patch);
  ok("C: exactly Lesson 1's three new days are carried as done", eq(w.sort(), ["done/k/ws/L0004", "done/k/ws/L0005", "done/k/ws/L0006"]));
  const rec = patch["done/k/ws/L0004"];
  ok("C: a carried record says so — src carry, via regroup, from the old id, on the old day", rec.src === "carry" && rec.via === "regroup" && rec.from === L(1) && rec.day === "2026-11-02");
  ok("C: the kid is on Lesson 2 · day 1 of 4", r.lessonSeq[firstUndone(ctx, "k", "ws")] === "Lesson 2 · day 1 of 4");
}
// ── D. 5 days → 4 days: finished stays finished, a lesson in progress keeps its place ──────────────────────────
{
  const ctx = world();
  const old = ctx.lessonExpandDays(["A", "B"], 5);
  subject(ctx, "k", "s", old, 1, range(1, 8), { doneImportedAt: "2026-09-01" });   // A all, B days 1–3
  const { r, patch } = save(ctx, "k", "s", ctx.lessonExpandDays(old, 4));
  ok("D: days 1–4 keep their ids, day 5 is dropped", eq(r.lessonIds, [L(1), L(2), L(3), L(4), L(6), L(7), L(8), L(9)]));
  ok("D: A finished, B through day 3; current = B · day 4 of 4", r.lessonSeq[firstUndone(ctx, "k", "s")] === "B · day 4 of 4" && ctx.lidDoneIdx("k", "s").size === 7);
  ok("D: nothing minted, nothing carried", r.nextLid === 11 && doneWrites(patch).length === 0);
}
// ── E. 4 days → 5 days: only the finished lesson's new day 5 is carried ─────────────────────────────────────────
{
  const ctx = world();
  const old = ctx.lessonExpandDays(["A", "B"], 4);
  subject(ctx, "k", "s", old, 1, range(1, 6), { doneImportedAt: "2026-09-01" });   // A all, B days 1–2
  const { r, patch } = save(ctx, "k", "s", ctx.lessonExpandDays(old, 5));
  ok("E: A day 5 and B day 5 are minted", r.lessonIds[4] === L(9) && r.lessonIds[9] === L(10) && r.nextLid === 11);
  ok("E: A's day 5 is carried, B's is not", eq(doneWrites(patch), ["done/k/s/L0009"]));
  ok("E: current = B · day 3 of 5", r.lessonSeq[firstUndone(ctx, "k", "s")] === "B · day 3 of 5");
}
// ── F. No stamped ids → ids still follow the lesson, but nothing is carried (no truth to carry) ────────────────
{
  const ctx = world();
  subject(ctx, "k", "ws", ["Lesson 1", "Lesson 2"], 1, [L(1)]);   // no doneImportedAt
  const { r, patch } = save(ctx, "k", "ws", ctx.lessonExpandDays(["Lesson 1", "Lesson 2"], 3));
  ok("F: ids align (day 1 keeps the lesson's id)", r.lessonIds[0] === L(1) && r.lessonIds[3] === L(2));
  ok("F: no done record is written for an unstamped subject", doneWrites(patch).length === 0);
}
// ── G. Ambiguous stems are left to minting, exactly as before (lengths differ, so no positional pairing) ──────
{
  const ctx = world();
  subject(ctx, "k", "s", ["Review", "Review", "Other"], 1, [L(1), L(2)], { doneImportedAt: "2026-09-01" });
  const { r, patch } = save(ctx, "k", "s", ["Review · day 1 of 2", "Review · day 2 of 2"]);
  ok("G: two plain old 'Review' lines → fresh ids, nothing carried", eq(r.lessonIds, [L(4), L(5)]) && doneWrites(patch).length === 0, r.lessonIds);
  const ctx2 = world();
  subject(ctx2, "k", "s", ["Review · day 1 of 2", "Review · day 2 of 2", "Other"], 1, [L(1), L(2)], { doneImportedAt: "2026-09-01" });
  const r2 = save(ctx2, "k", "s", ["Review", "Review"]);
  ok("G: 'Review' twice among the new plain lines → fresh ids, nothing carried", eq(r2.r.lessonIds, [L(4), L(5)]) && doneWrites(r2.patch).length === 0, r2.r.lessonIds);
}
// ── H. The old behaviours are untouched ────────────────────────────────────────────────────────────────────────
{
  const ctx = world();
  subject(ctx, "k", "s", ["pg 1", "pg 2", "pg 3"], 1, [L(1)], { doneImportedAt: "2026-09-01" });
  const { r } = save(ctx, "k", "s", ["pg 1", "pg 2a", "pg 3"]);
  ok("H: same-length rename keeps every id (positional pairing still first)", eq(r.lessonIds, [L(1), L(2), L(3)]));
  const ctx2 = world();
  subject(ctx2, "k", "s", ["pg 1", "pg 2"], 1, [L(1)], { doneImportedAt: "2026-09-01" });
  const r2 = save(ctx2, "k", "s", ["pg 1", "pg 2", "Chapter test"]);
  ok("H: a genuinely new line is minted and NOT marked done", eq(r2.r.lessonIds, [L(1), L(2), L(3)]) && doneWrites(r2.patch).length === 0);
  ok("H: _lidAlign still answers {ids,nextLid} (carry rides along)", (() => { const a = ctx2._lidAlign(["a"], [L(1)], ["a", "b"], 2, null, false); return eq(a.ids, [L(1), L(2)]) && a.nextLid === 3 && Array.isArray(a.carry); })());
}
// ── I. The writer sends only targeted paths — never a whole done node ──────────────────────────────────────────
{
  const ctx = world();
  subject(ctx, "k", "ws", ["Lesson 1", "Lesson 2"], 1, [L(1)], { doneImportedAt: "2026-09-01" });
  const { patch } = save(ctx, "k", "ws", ctx.lessonExpandDays(["Lesson 1", "Lesson 2"], 2));
  const keys = Object.keys(patch);
  ok("I: every path is a leaf under subjects/… or done/<kid>/<sk>/<id>", keys.every(k => /^subjects\/k\/ws\/(lessonSeq|lessonIds|total|nextLid)$/.test(k) || /^done\/k\/ws\/L\d{4}$/.test(k)), keys);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
