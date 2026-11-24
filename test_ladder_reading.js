/*
 * Node tests — 📖 READ AND ANSWER ladder (draft for Mom's review, 2026-11-23). Unit #1 of the notebooks study
 * (PLAN_notebooks_study §25): "the biggest hole — Lucy has nothing to read; Ellis lost his passages when his bank
 * loaded; Lincoln has one a week." 116 passages: 30 for g1 and 31 for g2 (Mom 11/23: "Yes, write more" — Lucy's first test
 * is May/summer 2027), 11 each for g3 … g78; from g2 up one of them is a "people of faith" biography (Mom 11/23).
 * NOT wired into the app yet — this only
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
ok("116 passages", ids.length === 116, ids.length);
for (const lv of C.LEVEL_ORDER) ok(lv + " has " + C.LEVELS[lv].count + " passages", ids.filter(id => P[id].lv === lv).length === C.LEVELS[lv].count);

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
const wf = JSON.parse(JSON.stringify(data)); delete wf.passages.ra_g3_01.q[0].writeFirst; wf.passages.ra_g1_01.q[0].writeFirst = true;
const wfErr = C.checkShape(wf).join("\n");
ok("checker wants writeFirst on every g3+ question", /writeFirst must be true or false from g3/.test(wfErr));
ok("checker keeps writeFirst off g1–g2", /writeFirst belongs to g3 and up/.test(wfErr));
const tp = JSON.parse(JSON.stringify(data)); tp.passages.ra_g2_01.topics = ["North Carolina"];
ok("checker wants plain topic slugs", /must be a plain slug/.test(C.checkShape(tp).join("\n")));

// 3. counting helpers
ok("word count ignores a spaced dash", C.countWords("Sam ran — fast.") === 3);
ok("sentence count sees ! and ? and a sign-off line", C.countSentences("Hi! Is it you? Yes.\nLove, Gran") === 4);
ok("syllables: cat 1, water 2, butterfly 3", C.syllables("cat") === 1 && C.syllables("water") === 2 && C.syllables("butterfly") === 3);

// 4. content rules from the brief: any family can use it — no family names (the enrolled children of all three families
//    and their parents), no brands or characters. Caleb (DeWalt) was in a g4 story until 11/23.
const NAMES = /\b(Lincoln|Ellis|Lucy|Julian|Adrienne|Howe|Caleb|Makenzie|Mackenzie|Taylor|Andrew|DeWalt|Zuri|Melanie|Burris|Sara|Sarah|Optimus|Bumblebee|Autobots?|Decepticons?|Transformers?|Lego|Disney|Pokemon|Pokémon|Minecraft|Marvel)\b/;
const allText = ids.map(id => { const p = P[id]; return [p.title, p.text].concat(p.q.map(q => [q.text, q.why].concat(q.c).join(" "))).join(" "); }).join("\n");
ok("no family names, brands or characters", !NAMES.test(allText), (allText.match(NAMES) || [])[0]);
ok("no registered event name (Repair Café → fix-it fair)", !/repair caf[eé]/i.test(allText));
ok("no 🔀 emoji", allText.indexOf("🔀") < 0);
ok("no HTML in passages (prints and taps the same)", ids.every(id => !/[<>]/.test(P[id].text)));

// 4b. topics a family can switch off; North Carolina and the kids' own animals are in (Mom 11/23: "Add those topics");
//     faith (Mom 11/23: "People of faith" — true facts about people from history whose faith shaped what they did):
//     exactly one per level from g2, none at g1, always a true-facts piece, always tagged so a family can leave it out
const allTopics = new Set(); ids.forEach(id => P[id].topics.forEach(t => allTopics.add(t)));
for (const t of ["north-carolina", "snakes", "dinosaurs", "frogs"]) ok("topic '" + t + "' is used", allTopics.has(t));
for (const lv of C.LEVEL_ORDER) {
  const f = ids.filter(id => P[id].lv === lv && P[id].topics.indexOf("faith") >= 0);
  ok(lv + (lv === "g1" ? " has no faith passage" : " has exactly one faith passage"), f.length === (lv === "g1" ? 0 : 1), f);
}
ok("every faith passage is true facts", ids.filter(id => P[id].topics.indexOf("faith") >= 0).every(id => P[id].kind === "facts"));

// 4c. write first (Mom 11/23: "Write first some days", from 3rd grade): every g3+ level has questions that work with
//     the choices hidden, and "Which … best …" stems are never marked write-first
for (const lv of C.LEVEL_ORDER.filter(l => C.LEVELS[l].writeFirst)) {
  const qs = [].concat(...ids.filter(id => P[id].lv === lv).map(id => P[id].q));
  ok(lv + " has write-first questions (" + qs.filter(q => q.writeFirst).length + "/" + qs.length + ")", qs.filter(q => q.writeFirst).length >= qs.length / 2);
  ok(lv + " never marks a 'best …' stem write-first", qs.every(q => !(q.writeFirst && /\bbest\b/i.test(q.text))));
}

// 5. the answer never sits in the same slot every time (letters spread across each level)
for (const lv of C.LEVEL_ORDER) {
  const seen = {}; ids.filter(id => P[id].lv === lv).forEach(id => P[id].q.forEach(q => { seen[q.ans] = (seen[q.ans] || 0) + 1; }));
  const n = C.LEVELS[lv].choices;
  ok(lv + " uses every answer letter", Object.keys(seen).length === n, seen);
}

// 5b. no passage puts every answer on the same letter (second read 11/23: a child would start guessing the pattern)
ok("no passage has the same answer letter for every question", ids.every(id => { const a = P[id].q.map(q => q.ans); return !a.every(x => x === a[0]); }),
  ids.filter(id => { const a = P[id].q.map(q => q.ans); return a.every(x => x === a[0]); }));

// 6. a mix of kinds at each level, and roughly half stories / half true facts overall
for (const lv of C.LEVEL_ORDER) {
  const kinds = new Set(ids.filter(id => P[id].lv === lv).map(id => P[id].kind));
  ok(lv + " has at least 3 kinds of passage", kinds.size >= 3, [...kinds]);
}
const facty = ids.filter(id => P[id].kind === "facts" || P[id].kind === "howto").length;
ok("between 40% and 60% true facts / how-to", facty >= 0.4 * ids.length && facty <= 0.6 * ids.length, facty);

// 7. easier → harder inside a level (loose: the first half reads no harder than the second half)
const R = C.rows(data);
for (const lv of C.LEVEL_ORDER) {
  const L = R.filter(r => r.lv === lv).sort((a, b) => a.o - b.o), avg = a => a.reduce((s, r) => s + r.fk, 0) / a.length;
  const h = Math.floor(L.length / 2);
  ok(lv + " first half reads no harder than the second half", avg(L.slice(0, h)) <= avg(L.slice(h)) + 0.01, [avg(L.slice(0, h)), avg(L.slice(h))]);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
