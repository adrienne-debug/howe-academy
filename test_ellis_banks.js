// ELLISBANKS (2026-10-05): Ellis's four daily boxes print from Mom's banks; built-ins stay byte-identical without them.
const fs = require("fs"), path = require("path");
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("  FAIL - " + m); } };
const w = {}; (new Function("window", "document", fs.readFileSync(path.join(__dirname, "notebooks.js"), "utf8")))(w, {});
const H = w.HoweNotebooks, src = fs.readFileSync(path.join(__dirname, "notebooks.js"), "utf8");
const load = f => Object.values(JSON.parse(fs.readFileSync(path.join(__dirname, f), "utf8"))).sort((a, b) => a.o - b.o);
const dates = { monday: "Oct 5", tuesday: "Oct 6", wednesday: "Oct 7", thursday: "Oct 8", friday: "Oct 9" };
const tasks = [{ id: "e1", who: "ellis", day: "monday", title: "📖 Reading", time: "9:30 AM", mom: "none" }, { id: "e2", who: "ellis", day: "tuesday", title: "✏️ Spelling", time: "10:00 AM", mom: "required" }];
const base = () => ({ weekData: { dates, tasks }, weekNum: 26, weekDates: "Oct 5–9", extraPages: {}, prevSummary: {}, pace: [], units: [] });
const cursor = { week: 26, day: 1, adv: 5, from: 26 };
const banks = () => ({ wordBank: { label: "", cursor, words: load("ellis_word_bank.json") }, cogatBank: { cursor, items: load("ellis_cogat_bank.json") }, convBank: { cursor, items: load("ellis_conv_bank.json") }, quantBank: { cursor, items: load("ellis_quant_bank.json") } });

console.log("ELLISBANKS block");
ok(src.indexOf("// ── ELLISBANKS_START") > 0 && src.indexOf("// ── ELLISBANKS_END") > src.indexOf("// ── ELLISBANKS_START"), "marked block present");

console.log("Seeds");
["ellis_word_bank.json", "ellis_cogat_bank.json", "ellis_conv_bank.json", "ellis_quant_bank.json"].forEach(f => { const l = load(f); ok(l.length === 125, f + " has 125"); ok(l.every((e, i) => e.o === i + 1), f + " o = 1..125"); ok(l.every(e => typeof e.lv === "number"), f + " every item carries a level tag"); });
const cq = load("ellis_cogat_bank.json"), cv = load("ellis_conv_bank.json"), qb = load("ellis_quant_bank.json");
ok(cq.every(e => e.type === ["A", "S", "C", "S", "A"][(e.o - 1) % 5]), "CogAT weekday layout Mon A · Tue S · Wed C · Thu S · Fri A");
ok(cv.every(e => e.type === (((e.o - 1) % 5) % 2 === 0 ? "SP" : "CP")), "conventions weekday layout Mon/Wed/Fri SP · Tue/Thu CP");
ok(qb.every(e => e.type === ["NS", "NA", "NP", "NA", "NP"][(e.o - 1) % 5]), "number weekday layout Mon NS · Tue NA · Wed NP · Thu NA · Fri NP");
ok(cv.filter(e => e.type === "CP").every(e => e.hint), "every capitals item carries a rule hint");
ok([...cq, ...qb, ...cv.filter(e => e.type === "SP")].every(e => Array.isArray(e.c) && e.c.length === 5 && /^[A-E]$/.test(e.ans)), "CogAT, number and spelling questions have 5 choices and an A–E answer");
ok(cv.filter(e => e.type === "CP").every(e => Array.isArray(e.c) && e.c.length === 4 && /^[A-D]$/.test(e.ans) && e.c[3] === "(No mistake)"), "capitals items have 3 lines + (No mistake) and an A–D answer");
ok(!/\b(Lincoln|Lucy|Julian|Adrienne|Howe)\b/.test(JSON.stringify([cq, cv, qb, load("ellis_word_bank.json")])), "no family names in the seeds");

console.log("No banks = built-in boxes, unchanged");
const plain = H.generate("ellis", base());
ok(/Iowa Reading — Test Prep/.test(plain.student) && /Language — Fix It Up/.test(plain.student) && /Iowa Math — Problem Solving/.test(plain.student), "built-in three boxes print");
ok(!/🧠 CogAT/.test(plain.student) && !/Rule to remember/.test(plain.student) && !/Synonyms:/.test(plain.student), "no bank markup without banks");
ok(plain.wordBankCursor === undefined && plain.cogatBankCursor === undefined && plain.convBankCursor === undefined && plain.quantBankCursor === undefined, "no cursors handed back without banks");

console.log("All four banks, bank-week 1");
const full = H.generate("ellis", Object.assign(base(), banks()));
ok(/🧠 CogAT — Word Analogy/.test(full.student) && /🧠 CogAT — Sentence Completion/.test(full.student) && /🧠 CogAT — Belongs With/.test(full.student), "CogAT box replaces the passage, all three formats in the week");
ok(!/Iowa Reading — Test Prep/.test(full.student), "built-in passage gone");
ok(/✏️ Spelling — Which word is spelled wrong\?/.test(full.student) && /🔠 Capital Letters — Which line has a mistake\?/.test(full.student), "spelling and capitals boxes replace Fix It Up");
ok((full.student.match(/Rule to remember/g) || []).length === 2, "the two capitals days print their rule hint");
ok(/🔢 Number Series/.test(full.student) && /🔢 Number Analogies/.test(full.student) && /🔢 Number Puzzles/.test(full.student), "number box replaces the math problem");
ok((full.student.match(/Synonyms:/g) || []).length === 5, "word box prints a Synonyms line each day");
ok(/word-big">portion</.test(full.student), "week 1 starts at word 1 (portion)");
ok(/Read the whole sentence first — which word is the clue\?/.test(full.student), "sentence-completion self-check prints");
ok(/put your answer back in/.test(full.student) || /both sides/.test(full.student), "puzzle self-check prints");
[["wordBankCursor"], ["cogatBankCursor"], ["convBankCursor"], ["quantBankCursor"]].forEach(([k]) => ok(full[k] && full[k].week === 26 && full[k].day === 1 && full[k].adv === 5 && full[k].from === 26, k + " handed back as {26,1,5,from 26}"));
ok(/CogAT<\/div>/.test(full.parent) && /Capitals<\/div>|Spelling<\/div>/.test(full.parent) && /Number<\/div>/.test(full.parent), "parent key rows name the bank boxes");
ok(/Rule: /.test(full.parent) && /🧠 CogAT · /.test(full.parent), "parent full keys show the rule and the CogAT item");
ok(/Synonyms: /.test(full.parent), "parent word reference shows synonyms");

console.log("Later weeks, before the start week, one bank only");
const wk7 = H.generate("ellis", Object.assign(base(), banks(), { weekNum: 32 }));
ok(wk7.wordBankCursor && wk7.wordBankCursor.day === 31, "week 7 of the bank starts at item 31");
ok(/word-big">eager</.test(wk7.student), "week 7 prints word 31 (eager)");
const before = H.generate("ellis", Object.assign(base(), banks(), { weekNum: 25 }));
ok(/Iowa Reading — Test Prep/.test(before.student) && before.wordBankCursor === undefined, "a week before the start week prints built-ins and stores no cursor");
const only = H.generate("ellis", Object.assign(base(), { convBank: banks().convBank }));
ok(/Iowa Reading — Test Prep/.test(only.student) && /✏️ Spelling — Which word/.test(only.student) && /Iowa Math — Problem Solving/.test(only.student), "one loaded bank replaces only its own box");
ok(only.convBankCursor && only.wordBankCursor === undefined, "only the loaded bank hands back a cursor");

console.log("Shared planners");
ok(/CP: \{ tag: "🔠 Capital letters"/.test(src), "conventions planner knows the CP type");
const plan = H.convBankPlan({ cursor, items: cv }, 26, ["monday", "tuesday", "wednesday", "thursday", "friday"]);
ok(plan.items[1].ctype === "CP" && plan.items[1].hint && plan.items[0].ctype === "SP", "convBankPlan carries ctype and hint");
const wp = H.wordBankPlan({ cursor, words: load("ellis_word_bank.json") }, 26, ["monday"]);
ok(wp.words[0].root !== undefined && Array.isArray(wp.words[0].family), "wordBankPlan carries root and family");

console.log("index.html");
const idx = fs.existsSync(path.join(__dirname, "index.html")) ? fs.readFileSync(path.join(__dirname, "index.html"), "utf8") : "";
if (idx) {
  ok(/const NB_WB_KIDS=\{lincoln:1,ellis:1\}/.test(idx), "Ellis is a bank kid");
  ok(/NB_CV_TYPES=\{SP:"Spelling",US:"Usage",CP:"Capitals"\}/.test(idx), "CP conventions type exists");
  ok(/if\(\/\^CAP\/\.test\(v\)\) return "CP"/.test(idx), "nbCvType accepts Capitals");
  ok(/\(kid==="lincoln"&&lib\.lincolnBuiltinQ3\)/.test(idx), "built-in Q3 fallback is Lincoln-only");
  ok(/\["CP","Capitals — which line has a capital-letter mistake\?/.test(idx), "conventions card offers the Capitals type");
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
