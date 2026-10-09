/*
 * Node tests — ⚠ SEQWARN (her yes 2026-10-09, out-of-sequence step 1): when the week's order check fails, one _debug line
 * names the two exact cards (lesson id + name, day, time, checked or open, card id) — even when nothing was re-stamped —
 * once per page load per pair. Read-only apart from that log line.
 *   run:  node test_seqwarn.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(name) { const i = src.indexOf("function " + name + "("); let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}" && --d === 0) return src.slice(i, k + 1); } }
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const lines = [];
const api = new Function("dbg", "checked", "claimed", "const _seqWarned={};\n" + slice("seqWarnLog") + "\nreturn seqWarnLog;")(m => lines.push(m), { "lincoln_lincoln__conventions_L0020": "10:32 AM Oct 7" }, {});
const subj = { lessonIds: ["L0018", "L0019", "L0020"], lessonSeq: ["Sitting 1", "Sitting 2", "Sitting 3"] };
const cards = [
  { id: "lincoln_lincoln__conventions_L0020", lid: "L0019", day: "wednesday", time: "10:30 AM" },
  { id: "lincoln_lincoln__conventions_L0019", lid: "L0020", day: "friday", time: "11:56 AM" },
];
api("lincoln", "conventions", subj, [{ after: "L0020", before: "L0019" }], cards);
ok("one line", lines.length === 1, lines);
const L = lines[0] || "";
ok("names kid + subject", /lincoln conventions/.test(L));
ok("names both lessons with their names", /L0020 'Sitting 3'/.test(L) && /L0019 'Sitting 2'/.test(L), L);
ok("says the day/time and checked vs open", /fri 11:56 AM, open/.test(L) && /wed 10:30 AM/.test(L), L);
ok("shows the card ids (where a tag and its lesson drifted)", /card id …_L0019/.test(L) && /card id …_L0020/.test(L), L);
api("lincoln", "conventions", subj, [{ after: "L0020", before: "L0019" }], cards);
ok("same pair again on this page load → not repeated", lines.length === 1);
const sfn = slice("seqFillNormalize");
ok("seqFillNormalize calls it whenever the check fails — before the 'nothing changed' return", sfn.indexOf("seqWarnLog(") > 0 && sfn.indexOf("seqWarnLog(") < sfn.indexOf("if(!res||!res.changed) return;"));
ok("no Firebase writes of its own", !/db\.ref|\.set\(|\.update\(/.test(slice("seqWarnLog")));
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
