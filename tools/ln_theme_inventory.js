// LN_PLAINQ — inventory of the 6th-grade notebook's built-in questions (LINCOLN_DATA in notebooks.js), flagging every
// item that leans on the old snake/reptile theme. Mom's answer 2026-11-24: "Replace them now" — the built-in questions
// get rewritten without the theme before any other notebook look is offered.
// Run: node tools/ln_theme_inventory.js            (counts per table + every flagged item)
//      node tools/ln_theme_inventory.js --all      (also lists the unflagged items)
// Used by test_ln_plainq.js (require: { THEME, data, items, hits }).
const fs = require("fs"), path = require("path");

// The theme words. "core" = snakes, reptiles and keeping them (built from the plan's Appendix B count: snake, reptile,
// python, shed, scale, cobra, lizard … and the words found in the tables). "flavor" = the hunting/hiding world the old
// questions leaned on again and again (predator, prey, camouflage, ambush …) — general animal words, but 20 of 24
// analogies sat on them, so they count as the theme for this notebook.
const THEME = {
  core: ["snake", "serpent", "reptil", "python", "cobra", "viper", "\\bboas?\\b", "rattlesnake", "hognose", "copperhead", "cottonmouth",
    "herpetolog", "terrarium", "enclosure", "\\bshed(s|ding)?\\b", "\\bmolt", "\\bscales?\\b", "\\bfangs?\\b", "venom", "\\bhiss", "slither",
    "\\bcoil", "constrict", "\\bflick", "lizard", "gecko", "iguana", "crocodile", "alligator", "\\bturtle", "tortoise", "mongoose",
    "cold-blooded", "warm-blooded", "mealworm", "\\bcrickets?\\b", "heat lamp", "hot spot", "cool side", "substrate", "\\bhides\\b", "basking"],
  flavor: ["predator", "\\bprey\\b", "camouflage", "ambush", "stealth", "\\bburrow", "dormant", "nocturnal", "diurnal", "\\bapex\\b"]
};
// A theme word used in its everyday sense, not the theme (table, id, field, word): "At the very end of a scale" = a range.
const NOT_THEME = [["words", "w13", "def", "scale"]];
const RX = THEME.core.concat(THEME.flavor).map(s => new RegExp(s, "i"));

function data(file) {
  const src = fs.readFileSync(file || path.join(__dirname, "..", "notebooks.js"), "utf8");
  const line = src.split("\n").find(l => l.indexOf("  var LINCOLN_DATA = ") === 0);
  if (!line) throw new Error("LINCOLN_DATA line not found");
  return JSON.parse(line.slice("  var LINCOLN_DATA = ".length, line.lastIndexOf("}; //") + 1));
}
// every question item, with the fields a child or parent reads (ids, tags, letters and the answer key are not text)
function items(d) {
  const out = [], B = d.banks;
  const ch = (pre, arr) => (arr || []).map((c, i) => [pre + "." + i + ".t", c.t]);
  B.cogat_verbal.forEach(q => out.push({ table: "cogat_verbal", id: q.id, fields: [["text", q.text]].concat(ch("choices", q.choices)) }));
  B.iowa_math.forEach(q => out.push({ table: "iowa_math", id: q.id, fields: [["text", q.text]].concat(ch("choices", q.choices)) }));
  B.conventions.forEach(q => out.push({ table: "conventions", id: q.id, fields: [["sentence", q.sentence], ["corrected", q.corrected]] }));
  B.words.forEach(q => out.push({ table: "words", id: q.id, fields: [["word", q.word], ["def", q.def], ["ex1", q.ex1], ["ex2", q.ex2]] }));
  B.fallback_passages.forEach((p, i) => out.push({ table: "fallback_passages", id: "passage" + (i + 1),
    fields: [["html", p.html], ["q1_stem", p.q1_stem]].concat(ch("q1", p.q1), [["q2_stem", p.q2_stem]], ch("q2", p.q2)) }));
  return out;
}
// the theme words an item uses: [{field, word}]
function hits(it) {
  const h = [];
  it.fields.forEach(([f, t]) => RX.forEach(rx => {
    const m = rx.exec(String(t || "").replace(/<[^>]+>/g, ""));
    if (m && !NOT_THEME.some(n => n[0] === it.table && n[1] === it.id && n[2] === f && n[3] === m[0].toLowerCase())) h.push({ field: f, word: m[0] });
  }));
  return h;
}
module.exports = { THEME, NOT_THEME, data, items, hits };

if (require.main === module) {
  const all = items(data()), tables = {};
  console.log("Theme words (core): " + THEME.core.join(", ").replace(/\\b/g, ""));
  console.log("Theme words (flavor): " + THEME.flavor.join(", ").replace(/\\b/g, ""));
  all.forEach(it => { const t = tables[it.table] = tables[it.table] || { items: 0, themed: 0 }; t.items++; const h = hits(it); if (h.length) t.themed++;
    if (h.length || process.argv.includes("--all")) console.log((h.length ? "  ✱ " : "    ") + it.table + " " + it.id + (h.length ? "  — " + h.map(x => x.word + " (" + x.field + ")").join(", ") : "")); });
  console.log("\ntable                items  themed");
  Object.keys(tables).forEach(k => console.log(k.padEnd(20) + String(tables[k].items).padStart(6) + String(tables[k].themed).padStart(8)));
}
