// 📖 Lucy's phonogram of the day follows LOE Foundations B (her "go" 2026-10-14, step 1 of PLAN_lucy_notebook_2026-10-14.md).
// notebooks.js LU_PHONO block + the one-line index.html wiring (ctx.loe = loeTaught(kid)). Run: node test_lucy_phono.js
const fs = require("fs");
global.window = {};
eval(fs.readFileSync(__dirname + "/notebooks.js", "utf8"));
const NB = window.HoweNotebooks, I = NB._internal;
const idx = fs.readFileSync(__dirname + "/index.html", "utf8");
let pass = 0, fail = 0;
function ok(c, name, d) { if (c) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name + (d ? "  → " + d : "")); } }

// the ladder exactly as index.html carries it (LOELINK) — the bank must cover every rung
const ladderSrc = idx.slice(idx.indexOf("const SPRINT_LOE_B="), idx.indexOf("// Foundations C (lessons 81+)"));
const SPRINT_LOE_B = new Function(ladderSrc + "; return SPRINT_LOE_B;")();
const taughtTo = (lesson) => SPRINT_LOE_B.filter(p => p.lesson <= lesson);

const dates = { monday: "October 19", tuesday: "October 20", wednesday: "October 21", thursday: "October 22", friday: "October 23" };
const titles = ["Morning Notebook", "Dimensions Math 1A", "HWT", "Math Reasoning B", "Read-Aloud", "Closing Notebook"];
const tasks = titles.flatMap(t => Object.keys(dates).map(d => ({ who: "lucy", day: d, title: t, time: "8:00 AM" })));
const base = (extra) => Object.assign({ weekNum: "week11", weekDates: "Oct 19–23, 2026", weekData: { dates, tasks }, extraPages: {} }, extra || {});
const labels = (html) => [...html.matchAll(/Phonogram · (\w+) <span class="ph-sounds"/g)].map(m => m[1]);

console.log("bank");
ok(SPRINT_LOE_B.length === 20 && SPRINT_LOE_B.every(p => I.LU_PHONO[p.pg]), "every Foundations B phonogram on the ladder has a card", SPRINT_LOE_B.filter(p => !I.LU_PHONO[p.pg]).map(p => p.pg).join(","));
ok(Object.keys(I.LU_PHONO).every(pg => { const e = I.LU_PHONO[pg]; return e.word.indexOf(pg) >= 0 && e.words.length === 5 && e.words.every(w => w.indexOf(pg) >= 0) && e.tip.length > 20; }), "each card: the trace word and all five words contain the phonogram, and Mom has a tip");
ok(Object.keys(I.LU_PHONO).every(pg => { const e = I.LU_PHONO[pg]; return (e.pre || "") + pg + (e.post || "") === e.word; }), "pre + phonogram + post spells the trace word (what the card displays)");

console.log("planner");
let w = I.luPhonoWeek(taughtTo(51), 5);
ok(w.map(b => b.digraph).join(" ") === "er ee ch er igh", "Lesson 51 (Lucy 10/14): newest er on Mon + Thu, then ee · ch · igh", w.map(b => b.digraph).join(" "));
ok(w[0].newest && !w[1].newest && w[0].lesson === 51 && w[0].sounds === "/er/" && w[0].pre === "h" && w[0].word === "her", "entry carries lesson, sound, pre-part and the trace word");
ok(w[0].review.join(" ") === "sh th ck igh ch ee" && w[1].review.indexOf("ee") < 0 && w[1].review.indexOf("er") >= 0, "review row = the other taught phonograms (newest six), never today's", w[0].review.join(" "));
w = I.luPhonoWeek(taughtTo(74), 4);
ok(w.map(b => b.digraph).join(" ") === "ough ou tch ough" && w[0].review.length === 6, "Lesson 74, a 4-day week: review capped at six");
w = I.luPhonoWeek([{ pg: "sh", sounds: "/sh/", lesson: 41 }], 5);
ok(w.length === 5 && w.every(b => b.digraph === "sh") && w[0].review.length === 0, "only one phonogram taught: it fills the week, nothing to review");
w = I.luPhonoWeek([{ pg: "th", lesson: 42 }, { pg: "sh", lesson: 41 }], 5);
ok(w.map(b => b.digraph).join(" ") === "th sh th th sh", "two taught, any order in: sorted by lesson, wraps");
ok(I.luPhonoWeek(null, 5) === null && I.luPhonoWeek([], 5) === null && I.luPhonoWeek([{ pg: "ir", lesson: 81 }], 5) === null, "no link, nothing taught, or only a rung off the ladder → null (static list)");

console.log("notebook — LOE driving");
let o = NB.generate("lucy", base({ loe: taughtTo(51) }));
ok(labels(o.student).join(" ") === "er ee ch er igh", "five daily pages print the planned phonograms", labels(o.student).join(" "));
ok(/says \/er\/<\/span><span class="ph-lesson">LOE B · Lesson 51</.test(o.student), "card shows the sound and the book lesson");
ok(/<span class="blend-part">h<\/span>\s*<span class="blend-plus">\+<\/span>\s*<span class="blend-part">er<\/span>\s*<span class="blend-arrow">→<\/span>\s*<span class="blend-word">her<\/span>/.test(o.student), "h + er → her (phonogram mid-word)");
ok(/<span class="blend-part">n<\/span>[\s\S]{0,120}<span class="blend-part">igh<\/span>[\s\S]{0,120}<span class="blend-part">t<\/span>[\s\S]{0,80}<span class="blend-word">night<\/span>/.test(o.student), "n + igh + t → night (three parts)");
ok((o.student.match(/class="ph-review">Review: /g) || []).length === 5 && /ph-chip">ck</.test(o.student), "every daily page carries the review row with the taught phonograms");
ok(/#h#e#r/.test(o.student) && /fern<\/span>/.test(o.student), "trace word in the dotted font + the five words");
ok(/\.ph-chip/.test(o.student) && /\.ph-chip/.test(o.parent), "the phonogram styles ride along only when the book is driving");
ok(/key-label" style="min-width:28px;">er<\/div>[\s\S]{0,400}bossy r[\s\S]{0,300}LOE B · Lesson 51 · new this week/.test(o.parent), "Mom's page: the ladder tip for er, marked new this week");
ok(/>ee<\/div>[\s\S]{0,400}LOE B · Lesson 50 · review/.test(o.parent), "Mom's page: ee marked review");
ok(/Blends I practiced this week[\s\S]{0,600}>er<\/div>[\s\S]{0,1800}>igh<\/div>/.test(o.student) && /fern · herd · perch/.test(o.student), "end-of-week page lists the week's phonograms (same card shape)");
ok(!/Blend of the day/.test(o.student), "no leftover static-blend label");
ok((o.student.match(/class="blend-card ph"/g) || []).length === 5 && !/class="blend-draw-box"/.test(o.student) && /nt-trace" style="font-size:26px;">#h#e#r/.test(o.student), "book-driven card runs compact (no draw box, 26px trace) so the review row fits the same 229px card");
ok(/\.blend-card\.ph \.write-line \{ height:24px; \}/.test(o.student), "compact styles ship with it");

console.log("notebook — no LOE link (fallback)");
const f1 = NB.generate("lucy", base()), f2 = NB.generate("lucy", base({ loe: [] })), f3 = NB.generate("lucy", base({ loe: null }));
ok(f1.student === f2.student && f2.student === f3.student && f1.parent === f3.parent, "missing, empty and null loe all print the same notebook");
ok(labels(f1.student).length === 0 && (f1.student.match(/Blend of the day · /g) || []).length === 5 && /Blend of the day · sh/.test(f1.student), "static blends print as before (sh ch th wh sh)");
ok(!/ph-review|ph-sounds|\.ph-chip|blend-card ph/.test(f1.student) && !/\.ph-chip|LOE B · Lesson/.test(f1.parent), "none of the new markup or styles in the fallback");
ok((f1.student.match(/class="blend-draw-box"/g) || []).length === 5 && /nt-trace" style="font-size:31px;">#s#h#i#p/.test(f1.student), "fallback keeps the draw box and the 31px trace");
ok(/<span class="blend-part">sh<\/span>\s*<span class="blend-plus">\+<\/span>\s*<span class="blend-part">ip<\/span>\s*<span class="blend-arrow">→<\/span>\s*<span class="blend-word">ship<\/span>/.test(f1.student), "sh + ip → ship exactly as before");
ok(/>sh<\/div><div style="font-size:11px;color:var\(--ink\);line-height:1.5;">"sh" is one sound/.test(f1.parent), "Mom's page keeps the original tips in the fallback");

console.log("index.html wiring");
ok(/let loe=null; try\{ if\(typeof loeTaught==="function"\) loe=loeTaught\(kid\)\|\|null; \}catch\(e\)\{\}/.test(idx) && /dailyGrams:dailyGrams, loe:loe, weekData:/.test(idx), "the notebook context passes loe = loeTaught(kid) (read-only; LOELINK)");
ok(/function loeTaught\(kid,cd\)/.test(idx), "loeTaught still exists for it to call");

console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
