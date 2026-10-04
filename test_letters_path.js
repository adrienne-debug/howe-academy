// 🔤 Letters Path starter unit (her "lets do his step 2", 2026-10-04 — Caleb, DeWalt K).
// Runs the real STARTER_UNITS block (LETTERS_PATH + UNIT_STAGES) over a Caleb-shaped kid:
//  · Stage 1 Big letters, "knows through S–Z" → all 26 capitals straight to weekly review, ready;
//  · ➡ Stage 2 Little letters (HWT order) → c and o start learning; ready at 20 of 26, not 26;
//  · ➡ Stage 3 Letter sounds → "c sound", "o sound" start; the sound lives on THOSE cards only;
//  · the drill draws little letters / sounds in the HWT font; the notebook shows the sound text.
// UNITS_SRC=<path> runs it against another copy of index.html.
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(process.env.UNITS_SRC || path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name); } }
const a = src.indexOf("// STARTER_UNITS_START"), b = src.indexOf("// STARTER_UNITS_END");
ok("LETTERS_PATH inside the STARTER_UNITS block", a > 0 && src.indexOf("LETTERS_PATH (her") > a && src.indexOf("// LETTERS_PATH_END") < b);
const block = src.slice(a, b);

function world() {
  const G = { masteryData: {}, currData: { subjects: {} }, writes: [], unitStudies: {}, content: { innerHTML: "" } };
  const db = { ref(p) { return { update(v) { G.writes.push(["update", p, v]); }, set(v) { G.writes.push(["set", p, v]); },
    transaction() { return Promise.resolve({ committed: false }); } }; } };
  const api = new Function("G", "db", `
    const masteryData=G.masteryData, currData=G.currData; let unitStudies=G.unitStudies;
    function momHere(){ return true; } function _dryRun(){ return false; } function cap(s){ return s[0].toUpperCase()+s.slice(1); }
    function renderUnits(){} const HA_LS={ setItem(){} }; const document={ getElementById:()=>G.content };
    function mastDefKeyOk(n){ return !/[.$#\\[\\]\\/]/.test(n); }
    function mastGateChapter(){ return null; }
    ${block}
    return { STARTER_UNITS, LP_SOUNDS, mastLetterVis, unitStageFormOpen, unitStageFormSet, unitStageEnroll, unitStageStatus, unitStageMoveUp, _unitStageRowsHtml };`)(G, db);
  const u = api.STARTER_UNITS.letters_path(); G.unitStudies[u.id] = u; api.u = u; api.G = G; return api;
}
const w = world(), u = w.u, md = w.G.masteryData;
const deck = k => u.decks.find(d => d.key === k);

// ── the unit ──
ok("3 stages: Big letters · Little letters (ready at 20) · Letter sounds", u.stages.map(s => s.label).join("|") === "Big letters|Little letters|Letter sounds" && u.stages[1].readyAt === 20);
ok("decks: Letters (flash) 26 · Lowercase (flash) 26 · Letter Sounds (flip) 26", deck("Letters").cards.length === 26 && deck("Lowercase").cards.length === 26 && deck("Letter Sounds").cards.length === 26 && deck("Letters").mode === "flash" && deck("Lowercase").mode === "flash" && deck("Letter Sounds").mode === "flip");
ok("little letters in handwriting order (Mrs. DeWalt's pick 10/3)", deck("Lowercase").cards.map(c => c.name).join("") === "cosvwtadguielkyjprnmhbfqxz");
ok("b and d sit weeks apart (d is 8th, b is 22nd)", deck("Lowercase").cards.findIndex(c => c.name === "d") === 7 && deck("Lowercase").cards.findIndex(c => c.name === "b") === 21);
ok("sound cards are named 'a sound' — never the same name as a little-letter card", deck("Letter Sounds").cards.every(c => / sound$/.test(c.name)) && !deck("Letter Sounds").cards.some(c => deck("Lowercase").cards.some(l => l.name === c.name)));
ok("every sound card carries its sound + word; capitals and little letters carry none", deck("Letter Sounds").cards.every(c => /^\/[a-z]+\/ — \S/.test(c.def)) && deck("Letters").cards.concat(deck("Lowercase").cards).every(c => c.def == null));
ok("short-vowel / hard-consonant words (c → /k/ cat, g → goat, x → /ks/ fox)", w.LP_SOUNDS.c === "/k/ — cat 🐱" && /goat/.test(w.LP_SOUNDS.g) && w.LP_SOUNDS.x === "/ks/ — fox 🦊" && /apple/.test(w.LP_SOUNDS.a));
ok("all card names are legal Firebase keys", u.decks.every(d => d.cards.every(c => !/[.$#\[\]\/]/.test(c.name))));

// ── Stage 1: he already knows his capitals ──
w.unitStageFormOpen("letters_path", "caleb"); w.unitStageFormSet("stage", "1"); w.unitStageFormSet("knows", "S–Z"); w.unitStageEnroll();
let it = md.caleb || [];
ok("Stage 1 (knows through S–Z): 26 capitals, all weekly review", it.length === 26 && it.every(i => i.subject === "Letters" && i.status === "active" && i.tier === "weekly"));
let st = w.unitStageStatus(u, "caleb");
ok("Stage 1 ready, next = Little letters", st.ready && st.next && st.next.n === 2);

// ── Stage 2: little letters ──
w.unitStageMoveUp("letters_path", "caleb");
it = md.caleb;
const low = it.filter(i => i.subject === "Lowercase");
ok("Stage 2: c and o start learning (2 at a time), capitals keep reviewing", low.map(i => i.prompt).join(",") === "c,o" && low.every(i => i.status === "introduction") && it.filter(i => i.subject === "Letters").length === 26);
ok("bank holds all 26 little letters in order", md.caleb_custom_items.filter(c => c.cat === "Lowercase").map(c => c.name).join("") === "cosvwtadguielkyjprnmhbfqxz");
ok("no answer written for any little letter (he says the name)", !Object.keys(md.caleb_settings.definitions || {}).some(k => k.length === 1));
// pretend he has learned 19, then 20, little letters
const add = n => { const have = new Set(md.caleb.filter(i => i.subject === "Lowercase").map(i => i.prompt));
  deck("Lowercase").cards.slice(0, n).forEach(c => { if (!have.has(c.name)) md.caleb.push({ id: "cal_" + c.name, subject: "Lowercase", prompt: c.name }); });
  md.caleb.forEach(i => { if (i.subject === "Lowercase" && deck("Lowercase").cards.slice(0, n).some(c => c.name === i.prompt)) { i.status = "active"; i.tier = "weekly"; } }); };
add(19); st = w.unitStageStatus(u, "caleb");
ok("19 of 26 known → not ready yet", !st.ready && st.on === 19 && st.need === 20);
let h = w._unitStageRowsHtml(u, ["caleb"]);
ok("row says '19 of 26 on the ladder · ready at 20'", /19 of 26 on the ladder · ready at 20/.test(h));
add(20); st = w.unitStageStatus(u, "caleb");
ok("20 of 26 known → ✓ ready to move up (her yes 10/2)", st.ready && st.next && st.next.n === 3);
h = w._unitStageRowsHtml(u, ["caleb"]);
ok("row: ✓ ready + ➡ Start Stage 3: Letter sounds", /ready to move up/.test(h) && /Start Stage 3: Letter sounds/.test(h));

// ── Stage 3: sounds ──
w.unitStageMoveUp("letters_path", "caleb");
const snd = md.caleb.filter(i => i.subject === "Letter Sounds");
ok("Stage 3: 'c sound' and 'o sound' start learning", snd.map(i => i.prompt).join(",") === "c sound,o sound" && snd.every(i => i.status === "introduction"));
ok("sound text saved under the sound card's name only", md.caleb_settings.definitions["c sound"] === "/k/ — cat 🐱" && md.caleb_settings.definitions.c == null);
ok("Letter Sounds deck is flip (front: letter, back: sound)", md.caleb_settings.cat_modes["Letter Sounds"] === "flip" && md.caleb_settings.cat_modes.Lowercase === "flash");
ok("unfinished little letters keep going (the 6 left still in the bank)", md.caleb_custom_items.filter(c => c.cat === "Lowercase").length === 26);
ok("writes are targeted paths only", w.G.writes.every(x => /^(mastery\/caleb(_custom_items|_settings\/(cat_modes|cat_intro_max|definitions|cat_instructions|cat_instructions_kid))?|unitStudies\/letters_path\/(kidStage|enrolled)\/caleb)$/.test(x[1])));

// ── the drill card ──
const v1 = w.mastLetterVis("a", "Lowercase"), v2 = w.mastLetterVis("g sound", "Letter Sounds");
ok("drill: little letter drawn in the HWT font", /NoTears/.test(v1) && />a<\/span>/.test(v1));
ok("drill: sound card shows just the letter + 'What sound does it make?' (no answer on the front)", />g<\/span>/.test(v2) && /What sound does it make\?/.test(v2) && !/goat/.test(v2));
ok("drill big-card hook for Lowercase / Letter Sounds is in place", /if\(!bigVis&&\(cat==="Lowercase"\|\|cat==="Letter Sounds"\)&&typeof mastLetterVis==="function"\) bigVis=mastLetterVis\(it\.prompt,cat\);/.test(src));
ok("Math Fluency Path still needs every card for 'ready' (no readyAt there)", w.STARTER_UNITS.math_fluency_path().stages.every(s => s.readyAt == null));

// ── the notebook follows the decks ──
global.window = {};
eval(fs.readFileSync(path.join(__dirname, "notebooks.js"), "utf8"));
const NB = window.HoweNotebooks;
const dates = { monday: "October 5, 2026", tuesday: "October 6, 2026", wednesday: "October 7, 2026", thursday: "October 8, 2026", friday: "October 9, 2026" };
const o = NB.generate("caleb", { weekNum: "week30", weekDates: "x", weekData: { dates, tasks: [] }, masteryItems: md.caleb, letterSounds: md.caleb_settings.definitions });
const cues = [...o.student.matchAll(/class="cue">([^<]+)</g)].map(m => m[1]);
ok("notebook: 'c says /k/ — cat 🐱' from his sound card", cues[0] === "c says /k/ — cat 🐱");
ok("notebook: letters without a sound card stay name-only", cues.slice(1).every(c => /^This is little/.test(c) || /^o says/.test(c)));
const o2 = NB.generate("caleb", { weekNum: "week26", weekDates: "x", weekData: { dates, tasks: [] }, masteryItems: [{ subject: "Lowercase", prompt: "c", status: "introduction" }, { subject: "Lowercase", prompt: "o", status: "introduction" }] });
const days = [...o2.student.matchAll(/recap-chip">🔤 (\w)</g)].map(m => m[1]).join("");
ok("notebook runs ahead of the 2 drilled letters: c o s v w (not c o c o c)", days === "cosvw");

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
