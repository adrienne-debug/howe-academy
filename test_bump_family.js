/*
 * Node tests for BUMPFAM — family time never rotates in the done-first bump.
 *
 * The bug (live, DeWalt week3, Mon 2026-10-19): at 11:09 Makenzie checked 🎹 Typing, which had been
 * laid at 2:50 PM behind the family block. bumpSkippedInTier gave Typing the earliest skipped
 * independent slot (1:00) and slid her 🏡 History / Science / Read Aloud to 1:30 / 2:00 / 2:50
 * ("4 moved"), while Taylor, Andrew and Caleb stayed at 1:00 / 1:30 / 2:00. Her report: "makenzies
 * history isnt at the same time as everyone else and it should because those are family and stuck
 * at a certain time".
 *
 *   run:  node test_bump_family.js
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

function extractFn(name) {
  const start = src.search(new RegExp("^function\\s+" + name + "\\s*\\(", "m"));
  if (start < 0) throw new Error("fn not found: " + name);
  let i = src.indexOf("{", start), depth = 0, inStr = null, esc = false;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (inStr) { if (c === inStr) inStr = null; continue; }
    if (c === "/" && src[j + 1] === "/") { j = src.indexOf("\n", j); if (j < 0) break; continue; }
    if (c === "/" && src[j + 1] === "*") { j = src.indexOf("*/", j) + 1; continue; }
    if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (!depth) return src.slice(start, j + 1); }
  }
  throw new Error("unbalanced: " + name);
}

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

const body = ["bumpSkippedInTier", "taskTierOf"].map(extractFn).join("\n");

function run(tasks, checkedIds, doneId) {
  const writes = [], logs = [];
  const checked = {}; checkedIds.forEach(id => { checked[id] = "11:09 AM Oct 19"; });
  const toMin = s => { const m = String(s || "").match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return null;
    let h = parseInt(m[1], 10) % 12; if (/PM/i.test(m[3])) h += 12; return h * 60 + parseInt(m[2], 10); };
  const fromMin = n => { let h = Math.floor(n / 60), mm = n % 60, ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12;
    return h + ":" + String(mm).padStart(2, "0") + " " + ap; };
  const fn = new Function("weekData", "checked", "claimed", "toMin", "fromMin", "sv", "db", "_dryRun", "dbg", "WK",
    "let lastTasksWrite=0;\n" + body + "\nreturn bumpSkippedInTier;");
  const db = { ref: p => ({ update: u => writes.push({ p, u }) }) };
  const weekData = { tasks };
  const bump = fn(weekData, checked, {}, toMin, fromMin, () => {}, db, () => false, m => logs.push(m), "week3");
  bump(tasks.find(t => t.id === doneId));
  return { writes, logs, at: id => tasks.find(t => t.id === id).time };
}

// Makenzie's Monday afternoon as it stood just before 11:09 (live ids).
function monday() {
  const fam = (id, item, title, time, dur) => ({ id, who: "makenzie", day: "monday", time, dur, mom: "none", device: "paper",
    cascade: true, famBlock: "fbmusz3l9q", famItem: item, title: "🏡 " + title });
  return [
    { id: "makenzie_makenzie__apologia_math_4_L0008", who: "makenzie", day: "monday", time: "11:15 AM", dur: 20, mom: "none", device: "paper", title: "📄 Apologia Math 4 — Lesson 60" },
    fam("2026d291_1533", "imusz3l9q", "History", "1:00 PM", 30),
    fam("2026d291_1537", "imusz5q0x", "Science", "1:30 PM", 30),
    fam("2026d291_1541", "imusz5q35", "Read Aloud", "2:00 PM", 20),
    { id: "2026d291_1530", who: "makenzie", day: "monday", time: "2:50 PM", dur: 20, mom: "none", device: "keyboard", title: "🎹 Typing — Typing" },
    // a sibling's copy of the same History — never touched by Makenzie's bump
    fam("2026d291_1532", "imusz3l9q", "History", "1:00 PM", 30),
  ].map((t, i) => (i === 5 ? Object.assign(t, { who: "taylor" }) : t));
}

console.log("# her 11:09 Typing check-off: family time holds");
{
  const r = run(monday(), ["2026d291_1530"], "2026d291_1530");
  ok("History stays at 1:00 PM", r.at("2026d291_1533") === "1:00 PM", r.at("2026d291_1533"));
  ok("Science stays at 1:30 PM", r.at("2026d291_1537") === "1:30 PM", r.at("2026d291_1537"));
  ok("Read Aloud stays at 2:00 PM", r.at("2026d291_1541") === "2:00 PM", r.at("2026d291_1541"));
  ok("Taylor's History untouched", r.at("2026d291_1532") === "1:00 PM");
  ok("no write touches a family card", !r.writes.some(w => Object.keys(w.u).some(k => /2026d291_15(33|37|41|32)/.test(k))), r.writes);
  // Apologia (11:15, unchecked, same tier) is still a real skipped card: Typing takes its slot, Apologia slides to Typing's.
  ok("ordinary skipped card still rotates: Typing → 11:15 AM", r.at("2026d291_1530") === "11:15 AM", r.at("2026d291_1530"));
  ok("…and Apologia → 2:50 PM (Typing's old slot)", r.at("makenzie_makenzie__apologia_math_4_L0008") === "2:50 PM", r.at("makenzie_makenzie__apologia_math_4_L0008"));
}

console.log("# only family cards skipped → nothing moves at all");
{
  const t = monday().filter(x => x.id !== "makenzie_makenzie__apologia_math_4_L0008");
  const r = run(t, ["2026d291_1530"], "2026d291_1530");
  ok("no write", r.writes.length === 0, r.writes);
  ok("no bump log", !r.logs.some(m => /^bump:/.test(m)), r.logs);
  ok("Typing keeps its slot (the ts heal moves it to its real time)", r.at("2026d291_1530") === "2:50 PM");
}

console.log("# a family card handed in never bumps either");
{
  const t = monday();
  const r = run(t, ["2026d291_1541"], "2026d291_1541");
  ok("no write when the done card is family time", r.writes.length === 0, r.writes);
}

console.log("# the guard is in the source");
{
  const fnSrc = extractFn("bumpSkippedInTier");
  ok("BUMPFAM note present", /BUMPFAM/.test(fnSrc));
  ok("skipped filter excludes famBlock", /x\.day===done\.day&&!x\.famBlock/.test(fnSrc));
  ok("done famBlock returns early", /isNb\(done\)\|\|done\.famBlock\) return/.test(fnSrc));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
