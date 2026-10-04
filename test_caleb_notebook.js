// 🚜 Caleb's notebook (DeWalt, kindergarten) — built on Julian's (Adrienne 2026-10-02/04).
// notebooks.js CALEB block + the index.html wiring (CALEB_WIRE). Run: node test_caleb_notebook.js
const fs = require("fs");
global.window = {};
eval(fs.readFileSync(__dirname + "/notebooks.js", "utf8"));
const NB = window.HoweNotebooks;
const src = fs.readFileSync(__dirname + "/index.html", "utf8");
let pass = 0, fail = 0;
function ok(c, name, d) { if (c) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name + (d ? "  → " + d : "")); } }

const dates = { monday: "October 5, 2026", tuesday: "October 6, 2026", wednesday: "October 7, 2026", thursday: "October 8, 2026", friday: "October 9, 2026" };
const base = (extra) => Object.assign({ weekNum: "week26", weekDates: "Oct 5–9, 2026", weekData: { dates, tasks: [] }, masteryItems: [], extraPages: {} }, extra || {});
const days = (html) => [...html.matchAll(/recap-chip">🔤 (\w)<\/span>[\s\S]*?recap-chip">🔢 (\d+)/g)].map(m => m[1] + "/" + m[2]);
const cues = (html) => [...html.matchAll(/class="cue">([^<]+)</g)].map(m => m[1]);

console.log("notebooks.js");
ok(NB.GENERATORS.caleb && /Caleb/.test(NB.GENERATORS.caleb.label), "GENERATORS has caleb");
let o = NB.generate("caleb", base());
ok(days(o.student).join(" ") === "c/11 o/12 s/13 v/14 w/15", "week one: handwriting order c o s v w + numbers 11–15 (no deck yet)", days(o.student).join(" "));
ok(JSON.stringify(o.letterCursor) === '{"week":26,"idx":0,"adv":5,"from":26}', "cursor stored with his first week", JSON.stringify(o.letterCursor));
o = NB.generate("caleb", base({ weekNum: "week27", letterCursor: { week: 26, idx: 0, adv: 5, from: 26 } }));
ok(days(o.student).join(" ") === "t/16 a/17 d/18 g/19 u/20", "week two continues: t a d g u + 16–20", days(o.student).join(" "));
o = NB.generate("caleb", base());
ok(cues(o.student).every(c => /^This is little \w · big \w$/.test(c)), "before his sounds stage: name + capital only, no sounds (Mrs. DeWalt 10/2)");
const items = ["c", "o", "s", "v", "w"].map(l => ({ subject: "Lowercase", prompt: l, tier: "weekly" })).concat([{ subject: "Letter Sounds", prompt: "c" }]);
o = NB.generate("caleb", base({ masteryItems: items, letterSounds: { c: "/k/" } }));
const cs = cues(o.student);
ok(cs[0] === "c says /k/ · cat 🐱" && cs.slice(1).every(c => /^This is little/.test(c)), "Letter Sounds deck turns on the sound for THAT letter only (Mom's text wins)", cs.join(" | "));
ok(/Trace My Name<\/div>\s*<div class="nt-trace"[^>]*>#C#a#l#e#b</.test(o.student), "name traced as Caleb (capital C + lowercase), HWT dotted font");
ok(/Now you try! ✏️<\/div>\s*<div class="hwt-line"/.test(o.student.split("Letter of the Day")[1] || ""), "letter card has a Now-you-try writing line (her ask 10/2)");
ok(/Circle every c/.test(o.student) && /Circle big c/.test(o.student), "find-it + match-the-capital rows");
// Julian's sheet underneath still names Fredoka; Caleb's overrides every one of those rules, never loads the font,
// and no inline style on his pages uses it.
ok(!/fonts\.googleapis[^"]*Fredoka/.test(o.student) && !/Fredoka/.test(o.student.replace(/<style[\s\S]*?<\/style>/g, "")) && /family=Bungee&family=Staatliches/.test(o.student), "no Fredoka — construction fonts (her ask 10/2)");
ok(/🚜/.test(o.student) && !/🦕|🦖|Julian/.test(o.student.replace(/<style>[\s\S]*?<\/style>/g, "")), "construction theme, no dinosaur / Julian text");
o = NB.generate("caleb", base({ countEmoji: "🚗", masteryItems: [{ subject: "Numbers", prompt: "14" }] }));
ok((o.student.match(/tf-cell on[^>]*>🚗/g) || []).length === 70 && /14 <span[^>]*>= 10 and 4</.test(o.student), "his counting picture fills the frames; teens say '= 10 and 4'");
o = NB.generate("caleb", base({ masteryItems: [{ subject: "Shapes", prompt: "Blob" }] }));
ok((o.warnings || []).some(w => /Blob/.test(w)), "unknown shape still warns Mom (same as Julian)");
ok(/ha-safari-print/.test(o.student) && /ha-safari-print/.test(o.parent), "Safari print fit on notebook + parent guide");
const j = NB.generate("julian", base());
ok(/JULIAN/.test(j.student.replace(/#/g, "")) && /Fredoka/.test(j.student) && !/Bungee|🚜/.test(j.student), "Julian's notebook unchanged (dino theme, Fredoka, JULIAN)");

console.log("index.html (CALEB_WIRE)");
ok(/\{k:"caleb",\s*label:"Caleb \(K 🚜\)",\s*aam:false\}[\s\S]{0,80}\]\.filter\(x=>ROSTER\.includes\(x\.k\)\)/.test(src), "Notebook tab lists only this family's kids (incl. Caleb)");
ok(/Object\.keys\(\(lib&&lib\.GENERATORS\)\|\|\{\}\)\.filter\(k=>ROSTER\.includes\(k\)\)/.test(src), "admin picker lists only this family's kids");
ok(/NB_KIDS\.find\(x=>x\.k===nbSelectedKid\)\?nbSelectedKid:\(\(NB_KIDS\[0\]\|\|\{\}\)\.k\|\|""\)/.test(src) && /No weekly notebooks are set up for this family yet/.test(src), "selection falls back to the family's first notebook kid; none = a message, no crash");
ok(/letterCursor:\(\(\(\(notebookSettings\|\|\{\}\)\[kid\]\)\|\|\{\}\)\.letterCursor\)\|\|null, countEmoji:/.test(src) && /letterSounds:/.test(src), "ctx: per-kid letter cursor + countEmoji + letterSounds");
ok((src.match(/\(kid==="julian"\|\|kid==="caleb"\)&&out&&out\.letterCursor\)[^\n]*db\.ref\("notebookSettings\/"\+kid\+"\/letterCursor"\)/g) || []).length === 2, "both Open and PDF save the letter place per kid");
ok(!/db\.ref\("notebookSettings\/julian\/letterCursor"\)/.test(src), "no Julian-only cursor write left");

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
