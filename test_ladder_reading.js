/*
 * Node tests — 📖 READ AND ANSWER ladder (draft for Mom's review, 2026-11-23). Unit #1 of the notebooks study
 * (PLAN_notebooks_study §25): "the biggest hole — Lucy has nothing to read; Ellis lost his passages when his bank
 * loaded; Lincoln has one a week." 70 passages, 10 per level g1 … g78. NOT wired into the app yet — this only
 * guards the content's shape so a later edit can't break it.
 *   run:  node test_ladder_reading.js
 */
const path = require("path");
const C = require(path.join(__dirname, "ladders", "check_read_and_answer.js"));
const data = C.load(path.join(__dirname, "ladders", "read_and_answer.json"));
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

// 1. every shape rule in the checker (ids, word ranges, question / choice counts, one real answer letter, why lines)
const errs = C.checkShape(data);
ok("shape check passes (" + errs.length + " errors)", errs.length === 0, errs.slice(0, 10));

const P = data.passages, ids = Object.keys(P);
ok("70 passages", ids.length === 70, ids.length);
for (const lv of C.LEVEL_ORDER) ok(lv + " has 10 passages", ids.filter(id => P[id].lv === lv).length === 10);

// 2. the checker itself catches broken content (so a green run means something)
const bad = JSON.parse(JSON.stringify(data)), b1 = bad.passages.ra_g3_01;
b1.q[0].ans = "E"; b1.q[1].c.push("All of the above"); b1.words += 1; b1.q[2].why = "";
const bErr = C.checkShape(bad).join("\n");
ok("checker catches an answer letter with no choice", /ans E has no choice/.test(bErr));
ok("checker catches an 'all of the above' choice", /all\/none of the above/.test(bErr));
ok("checker catches a stale word count", /words says/.test(bErr));
ok("checker catches a missing why line", /no why line/.test(bErr));
const dup = JSON.parse(JSON.stringify(data)); dup.passages.ra_g1_01.q[0].c[1] = dup.passages.ra_g1_01.q[0].c[0];
ok("checker catches a repeated choice", /choice repeated/.test(C.checkShape(dup).join("\n")));
const late = JSON.parse(JSON.stringify(data)); late.passages.ra_g2_01.q[0].type = "purpose";
ok("checker keeps author's-purpose questions at g5 and up", /purpose questions start at g5/.test(C.checkShape(late).join("\n")));

// 3. counting helpers
ok("word count ignores a spaced dash", C.countWords("Sam ran — fast.") === 3);
ok("sentence count sees ! and ? and a sign-off line", C.countSentences("Hi! Is it you? Yes.\nLove, Gran") === 4);
ok("syllables: cat 1, water 2, butterfly 3", C.syllables("cat") === 1 && C.syllables("water") === 2 && C.syllables("butterfly") === 3);

// 4. content rules from the brief: any family can use it — no family names, no brands or characters
const NAMES = /\b(Lincoln|Ellis|Lucy|Julian|Adrienne|Howe|Zuri|Taylor|Sara|Optimus|Bumblebee|Autobots?|Decepticons?|Transformers?|Lego|Disney|Pokemon|Pokémon|Minecraft|Marvel)\b/;
const allText = ids.map(id => { const p = P[id]; return [p.title, p.text].concat(p.q.map(q => [q.text, q.why].concat(q.c).join(" "))).join(" "); }).join("\n");
ok("no family names, brands or characters", !NAMES.test(allText), (allText.match(NAMES) || [])[0]);
ok("no 🔀 emoji", allText.indexOf("🔀") < 0);
ok("no HTML in passages (prints and taps the same)", ids.every(id => !/[<>]/.test(P[id].text)));

// 5. the answer never sits in the same slot every time (letters spread across each level)
for (const lv of C.LEVEL_ORDER) {
  const seen = {}; ids.filter(id => P[id].lv === lv).forEach(id => P[id].q.forEach(q => { seen[q.ans] = (seen[q.ans] || 0) + 1; }));
  const n = C.LEVELS[lv].choices;
  ok(lv + " uses every answer letter", Object.keys(seen).length === n, seen);
}

// 6. a mix of kinds at each level, and roughly half stories / half true facts overall
for (const lv of C.LEVEL_ORDER) {
  const kinds = new Set(ids.filter(id => P[id].lv === lv).map(id => P[id].kind));
  ok(lv + " has at least 3 kinds of passage", kinds.size >= 3, [...kinds]);
}
const facty = ids.filter(id => P[id].kind === "facts" || P[id].kind === "howto").length;
ok("between 40% and 60% true facts / how-to", facty >= 28 && facty <= 42, facty);

// 7. easier → harder inside a level (loose: the first half reads no harder than the second half)
const R = C.rows(data);
for (const lv of C.LEVEL_ORDER) {
  const L = R.filter(r => r.lv === lv).sort((a, b) => a.o - b.o), avg = a => a.reduce((s, r) => s + r.fk, 0) / a.length;
  ok(lv + " first five read no harder than the last five", avg(L.slice(0, 5)) <= avg(L.slice(5)) + 0.01, [avg(L.slice(0, 5)), avg(L.slice(5))]);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
