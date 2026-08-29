/*
 * Node tests for the cascade's lesson-order sort.
 *
 * The pass re-deals a cascaded subject's open cards to its slots in lesson order. It has been
 * wrong twice, each time because the sort key was a PROXY for position rather than position:
 *
 *   2026-08-20  sorted by TITLE TEXT — Reading Detective switches naming mid-book
 *               ("pg80-83" then "Ex. 39–40") and "Ex." text-sorts first. Fixed to sort by lid.
 *   2026-08-29  sorted by LID TEXT — a lid is minted when a lesson is added and is never
 *               renumbered when the list is reordered, so lid order and list order disagree.
 *               Lincoln's AAS holds L0011="L2-16" at index 9 and L0009="L2-17" at index 10,
 *               so L2-17 was dealt into the EARLIER Saturday slot and the order guard refused
 *               it. She caught it on the live board.
 *
 * The key is now the lesson's index in lessonIds. These run the real comparator, sliced from
 * index.html, against that exact shape.
 *
 *   run:  node test_lid_order.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

const a = src.indexOf("    const _lidIdx={};");
if (a < 0) { console.error("lid-order sort block not found"); process.exit(1); }
const end = src.indexOf("    });", a);
if (end < 0) { console.error("end of byLesson sort not found"); process.exit(1); }
const BLOCK = src.slice(a, end + "    });".length);

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

// Run the real comparator over a group of cards.
function order(cards, lessonIds) {
  const ctx = {
    console,
    grp: cards,
    uncheckedGrp: cards,
    lidsFor: () => lessonIds,
    // natCmp/lessonKey stand in for the fallbacks; the position path must not need them.
    natCmp: (x, y) => String(x) < String(y) ? -1 : String(x) > String(y) ? 1 : 0,
    lessonKey: t => t.title || "",
  };
  vm.createContext(ctx);
  vm.runInContext(BLOCK + "\nvar __out=byLesson.map(function(t){return t.title;});", ctx);
  return ctx.__out;
}
const card = (lid, title) => ({ lid, title, who: "lincoln", subjectKey: "aas" });

console.log("\n── the live AAS shape (ids out of list order) ──");
{
  // index 9 → L0011 → L2-16 ; index 10 → L0009 → L2-17
  const ids = ["L0001","L0002","L0003","L0004","L0005","L0006","L0007","L0008","L0010","L0011","L0009","L0012"];
  const got = order([card("L0009", "L2-17"), card("L0011", "L2-16")], ids);
  ok("L2-16 is dealt before L2-17 even though L0009 < L0011", got.join() === "L2-16,L2-17", got);
}
{
  const ids = ["L0011","L0009","L0012"];
  const got = order([card("L0012", "L2-18"), card("L0009", "L2-17"), card("L0011", "L2-16")], ids);
  ok("a three-card group follows the list, not the ids", got.join() === "L2-16,L2-17,L2-18", got);
}

console.log("\n── ordinary cases still hold ──");
{
  const ids = ["L0001", "L0002", "L0003"];
  const got = order([card("L0003", "c"), card("L0001", "a"), card("L0002", "b")], ids);
  ok("ids already in list order sort normally", got.join() === "a,b,c", got);
}
{
  // 2026-08-20's case: title text lies, but both lids resolve — position wins.
  const ids = ["L0022", "L0023", "L0024"];
  const got = order([card("L0023", "Ex. 39–40"), card("L0022", "pg80-83")], ids);
  ok("naming that switches mid-book still deals in list order", got.join() === "pg80-83,Ex. 39–40", got);
}

console.log("\n── fallbacks, when position can't be resolved ──");
{
  const got = order([card("L0009", "L2-17"), card("L0011", "L2-16")], []);   // no list
  ok("no lessonIds → falls back to lid text", got.join() === "L2-17,L2-16", got);
}
{
  const ids = ["L0011"];                                                     // only one resolves
  const got = order([card("L0009", "L2-17"), card("L0011", "L2-16")], ids);
  ok("only one lid in the list → falls back to lid text", got.join() === "L2-17,L2-16", got);
}
{
  const ids = ["L0001", "L0002"];
  const got = order([{ title: "b", who: "lincoln", subjectKey: "aas" },
                     { title: "a", who: "lincoln", subjectKey: "aas" }], ids);
  ok("cards with no lid at all → falls back to title text", got.join() === "a,b", got);
}
{
  const ids = ["L0002"];
  const got = order([{ title: "b", who: "lincoln", subjectKey: "aas" }, card("L0002", "a")], ids);
  ok("a mixed group (one lid, one not) → title text", got.join() === "a,b", got);
}
{
  const got = (() => {
    const ctx = { console, grp: [card("L0001", "a")], uncheckedGrp: [card("L0001", "a")],
      lidsFor: () => { throw new Error("boom"); },
      natCmp: (x, y) => String(x) < String(y) ? -1 : 1, lessonKey: t => t.title };
    vm.createContext(ctx);
    vm.runInContext(BLOCK + "\nvar __out=byLesson.map(function(t){return t.title;});", ctx);
    return ctx.__out;
  })();
  ok("a throw from lidsFor is caught, not fatal", got.join() === "a", got);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
