/*
 * 🔁 Days per lesson — a lesson that spans N days becomes N ordinary sittings.
 *   run:  node test_days_per_lesson.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function braceSlice(name) {
  const sig = "function " + name + "("; const i = src.indexOf(sig); if (i < 0) throw new Error("fn " + name);
  let d = 0, j = src.indexOf("{", i);
  for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); } }
  throw new Error("unbalanced " + name);
}
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const reLine = src.match(/const LESSON_DAY_RE=[^\n]*\n/)[0];
const toasts = [];
const ctx = { gwShowToast: m => toasts.push(m), document: { getElementById: () => ta } };
let ta = { value: "" };
vm.createContext(ctx);
new vm.Script(reLine + braceSlice("lessonExpandDays") + braceSlice("ceConvDaysPerLesson")).runInContext(ctx);
const X = ctx.lessonExpandDays;

const ws = ["Lesson 1a: Introducing WriteShop (p.1-1)", "Lesson 1b: Describing an Object (p.1-5)", "Lesson 2: Describing a Pet (p.2-1)"];
const x4 = X(ws, 4);
ok("3 lessons × 4 days = 12 sittings", x4.length === 12);
ok("each lesson's days run in order, suffix after the page", eq(x4.slice(0, 5), ["Lesson 1a: Introducing WriteShop (p.1-1) · day 1 of 4", "Lesson 1a: Introducing WriteShop (p.1-1) · day 2 of 4", "Lesson 1a: Introducing WriteShop (p.1-1) · day 3 of 4", "Lesson 1a: Introducing WriteShop (p.1-1) · day 4 of 4", "Lesson 1b: Describing an Object (p.1-5) · day 1 of 4"]), x4.slice(0, 5));
ok("every sitting's text is unique (ids align 1:1)", new Set(x4).size === x4.length);
ok("×1 leaves a plain list alone", eq(X(ws, 1), ws));
ok("idempotent: ×4 of a ×4 list is unchanged", eq(X(x4, 4), x4));
ok("regroups: ×2 of a ×4 list = 2 each, not 8", eq(X(x4, 2), X(ws, 2)));
ok("×1 undoes it", eq(X(x4, 1), ws));
ok("blank lines dropped, whitespace trimmed", eq(X(["  A ", "", "B"], 2), ["A · day 1 of 2", "A · day 2 of 2", "B · day 1 of 2", "B · day 2 of 2"]));
ok("two different lessons that happen to share a base are NOT merged unless both carry a day suffix", eq(X(["Review", "Review"], 2).length, 4));
ok("part-way lesson (remaining list starts at day 3 of 4): ×4 keeps days 3-4 only, never re-gives 1-2", eq(X(x4.slice(2), 4), x4.slice(2)));
ok("…and its later lessons still get all 4 days", X(x4.slice(2), 4).length === 10);
ok("clamped to 1..10", X(["A"], 99).length === 10 && eq(X(["A"], 0), ["A"]));

// list-editor button: rewrites the textarea only, says what it did
ta.value = ws.join("\n") + "\n";
ctx.ceConvDaysPerLesson(4);
ok("✎ Edit as a list ×4 rewrites the box (nothing saved)", ta.value.split("\n").length === 12 && /12 sittings/.test(toasts[toasts.length - 1]), toasts);
ctx.ceConvDaysPerLesson(1);
ok("×1 in the box goes back to one line per lesson", eq(ta.value.split("\n"), ws));

// Add Subject save path: expansion wired before the lesson-count guard and id minting
const save = braceSlice("ceAddSave");
ok("ceAddSave expands by daysPerLesson before minting ids", /lessonExpandDays\(lessonSeq,f\.daysPerLesson\)[\s\S]*_lidAlign\(null,null,lessonSeq/.test(save));
ok("Add sheet form defaults to 1 day per lesson", /daysPerLesson:1/.test(braceSlice("ceOpenAdd")));
ok("Add sheet shows the Days per lesson stepper", /Days per lesson/.test(braceSlice("ceRenderAddSheet")));
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
