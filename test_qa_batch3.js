/*
 * 🧹 QA_BATCH3 (Caleb walkthrough 2026-10-04): review picture cards hide the answer behind "👁 name" · card titles drop
 * the repeated half ("📄 Drills — Drills" → "📄 Drills", display only) · a long empty stretch reads "Free time until …".
 *   run:  node test_qa_batch3.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); } }
function fn(name) {
  const m = src.search(new RegExp("^function\\s+" + name + "\\s*\\(", "m"));
  let i = src.indexOf("{", m), d = 0;
  for (let j = i; j < src.length; j++) { const c = src[j]; if (c === "{") d++; else if (c === "}") { d--; if (!d) return src.slice(m, j + 1); } }
}
const ctx = {}; vm.createContext(ctx); vm.runInContext(fn("taskTitleShow"), ctx);
const T = s => ctx.taskTitleShow({ title: s });

console.log("card titles");
ok("📖 Morning Notebook — Morning Notebook → 📖 Morning Notebook", T("📖 Morning Notebook — Morning Notebook") === "📖 Morning Notebook");
ok("📄 Drills — Drills → 📄 Drills", T("📄 Drills — Drills") === "📄 Drills");
ok("Drills — Drills (no emoji) → Drills", T("Drills — Drills") === "Drills");
ok("a real lesson title is untouched", T("📖 Saxon Math 8/7 — Lesson 28") === "📖 Saxon Math 8/7 — Lesson 28");
ok("a title without a dash is untouched", T("🏡 History") === "🏡 History");
ok("both card-title spots use it (stored t.title untouched)", (src.match(/[^n] taskTitleShow\(t\)|\+taskTitleShow\(t\)|:taskTitleShow\(t\)/g) || []).length === 2 && !/function taskTitleShow[\s\S]{0,300}t\.title=/.test(src));

console.log("\nlong empty stretch");
const br = src.slice(src.indexOf("const _singleKid=(kid!==\"all\"&&kid!==\"mom\");"), src.indexOf("if(!lunchDone&&_ss>=_haLunchMin())"));
ok("an hour or more → 'Free time until <time> — nothing on the list until then'", /_ss-_prevEnd>=60/.test(br) && /Free time until '\+fromMin\(_to\)\+' <span[^>]*>— nothing on the list until then/.test(br));
ok("…ending at lunch when the stretch runs into it", /_to=\(_prevEnd<_lu&&_ss>_lu\)\?_lu:_ss/.test(br));
ok("short gaps keep 'Mom’s with a sibling'", /Break · '\+\(_ss-_prevEnd\)\+' min <span[^>]*>— Mom’s with a sibling, take a breather/.test(br));

console.log("\nreview picture cards");
const cd = src.slice(src.indexOf("const _picDeck="), src.indexOf("const _picDeck=") + 1400);
ok("picture decks = Shapes, Colors, Animals, Dinosaurs", /const _picDeck=cat==="Shapes"\|\|cat==="Colors"\|\|cat==="Animals"\|\|cat==="Dinosaurs";/.test(cd));
ok("review card (not new) → name hidden + '👁 name' button that reveals it", /_picDeck&&!isIntro\) c\+='<div class="mast-slide-name" style="visibility:hidden/.test(cd) && /\\u\{1F441\} name<\/button>/.test(cd) && /n\.style\.visibility=\\'visible\\'/.test(cd));
ok("new cards and letter/number cards still show the name", /else if\(cat!=="Counting"\) c\+='<div class="mast-slide-name">'\+it\.prompt\+'<\/div>';/.test(cd));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
