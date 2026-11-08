// 🦈 Shark notebook theme (PREKTHEME, her ask 2026-11-08) — a Pre-K notebook look any kid can be given from data,
// built on Julian's engine (generatePreK). Run: node test_notebook_shark.js
//   • the theme is picked from data (ctx.theme / ctx.notebookTheme ← the kid's Family record), default = today's notebook
//   • Julian's and Caleb's notebooks are byte-for-byte what they were before the refactor (hash snapshots below)
//   • every shark page keeps Julian's measured layout (same page skeleton, colour-only CSS); real-Chromium page measurement
//     runs when Playwright is installed (as test_nb_binding_print.js), else says SKIPPED
//   • no literal kid or family names in the new code
// If Julian's or Caleb's notebook is changed ON PURPOSE later, refresh the snapshots: node test_notebook_shark.js --hashes
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const src = fs.readFileSync(path.join(__dirname, "notebooks.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
global.window = {};
eval(src);
const NB = window.HoweNotebooks, I = NB._internal;
let pass = 0, fail = 0;
function ok(c, name, d) { if (c) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name + (d ? "  → " + d : "")); } }
const noStyle = (h) => String(h).replace(/<style[\s\S]*?<\/style>/g, "");

const dates = { monday: "November 9, 2026", tuesday: "November 10, 2026", wednesday: "November 11, 2026", thursday: "November 12, 2026", friday: "November 13, 2026" };
const base = (extra) => Object.assign({ weekNum: "week30", weekDates: "Nov 9–13, 2026", weekData: { dates, tasks: [] }, masteryItems: [], extraPages: {} }, extra || {});
const mi = (subject, prompts, extra) => prompts.map((p, i) => Object.assign({ subject, prompt: String(p), tier: "daily" }, (extra || {})[i] || {}));
const juItems = [].concat(
  mi("Letters", ["A", "B", "C", "D", "E", "F", "G"], { 2: { recentMiss: 2 } }),
  mi("Numbers", [1, 2, 3, 4, 5, 6, 7, 8], { 7: { status: "introduction" } }),
  mi("Shapes", ["Circle", "Square", "Triangle", "Star"], { 1: { drop_count: 1 } }),
  mi("Colors", ["Red", "Blue", "Green", "Yellow"]),
  mi("Animals", ["Lion", "Giraffe", "Shark", "Dog"]));
const cbItems = [].concat(mi("Lowercase", ["c", "o", "s", "v", "w"]), mi("Letter Sounds", ["c"]), mi("Numbers", [11, 12, 13], { 2: { status: "introduction" } }), mi("Shapes", ["Circle", "Oval"], { 1: { status: "introduction" } }));
const unit = { emoji: "🐢", title: "Sea Turtles", learning: [{ name: "Shell", emoji: "🐚" }, { name: "Flipper" }], learned: [{ name: "Egg" }], next: [{ name: "Beach" }], days: { tuesday: true } };
const spelling = { title: "Spelling", sections: [{ label: "Mon–Tue", lesson: 3, words: ["cat", "hat", "sat"] }], practice: ["mat"] };
const FIXTURES = (items) => ({
  empty: base(),
  mastery: base({ masteryItems: items }),
  cursors: base({ weekNum: "week31", masteryItems: items, letterCursor: { week: 30, idx: 2, adv: 5, from: 28 }, numberCursor: { week: 30, from: 4, adv: 5 } }),
  extras: base({ masteryItems: items, extraPages: { abc: { on: false }, daysSeasons: { on: true, days: { monday: true } }, thisMonth: { on: true, days: { wednesday: true, friday: true } } }, units: [unit] }),
  spelling: base({ spelling, teachNotes: "Grandma visits Wednesday — keep it short.", reviewCap: 0 }),
  fourDay: base({ weekData: { dates: { tuesday: "November 10, 2026", wednesday: "November 11, 2026", thursday: "November 12, 2026", friday: "November 13, 2026" }, tasks: [] }, countEmoji: "🐟" }),
  picks: base({ masteryItems: items, juPicks: { letters: { 0: "D" }, numbers: { 1: "6" } } })
});
// sha256 (first 16 hex) of JSON.stringify(generate(kid, ctx)) — taken from origin/main d3224dc, BEFORE generatePreK existed.
const BEFORE = {
  "julian/empty": "8a86b1e0d153f181", "julian/mastery": "fe558aa8ce3804e1", "julian/cursors": "5455af6aaaf562f7", "julian/extras": "e7a73a6c292926de",
  "julian/spelling": "cf9da3a6129a42ad", "julian/fourDay": "64f1989e078eaa38", "julian/picks": "a89cffbae1f753d5",
  "caleb/empty": "8b37fe802fbd9ed6", "caleb/mastery": "844d75732e5723d3", "caleb/cursors": "46cc24e6432e0fe9", "caleb/extras": "29ca960f1a13df95",
  "caleb/spelling": "a84698ec494f2eaa", "caleb/fourDay": "785246ec8aeb0380", "caleb/picks": "2f6b157b07c2a86a"
};
// caleb/picks refreshed ON PURPOSE 2026-11-08 (🚜 CBPLAN, test_construction_planner.js): Mom's planner number pick now joins the
// construction notebook's week list (JU_NUMPICK, as Julian's) — the Tuesday number reads 6, not 15. It used to equal caleb/mastery.
const snap = {};
for (const [kid, items] of [["julian", juItems], ["caleb", cbItems]]) {
  const F = FIXTURES(items);
  for (const name of Object.keys(F)) snap[kid + "/" + name] = crypto.createHash("sha256").update(JSON.stringify(NB.generate(kid, JSON.parse(JSON.stringify(F[name]))))).digest("hex").slice(0, 16);
}
if (process.argv.includes("--hashes")) { console.log(JSON.stringify(snap, null, 1)); process.exit(0); }

console.log("Julian + Caleb unchanged (byte-identical to before the refactor)");
Object.keys(BEFORE).forEach(k => ok(snap[k] === BEFORE[k], k, "now " + snap[k]));
ok(JSON.stringify(I.generateJulian(base({ masteryItems: juItems }))) === JSON.stringify(I.generatePreK(base({ masteryItems: juItems }))), "generateJulian = generatePreK with Julian's theme (his is the default)");
ok(NB.generate("julian", base({ notebookTheme: "" })).student === NB.generate("julian", base()).student &&
   NB.generate("julian", base({ notebookTheme: "unicorns" })).student === NB.generate("julian", base()).student, "blank / unknown theme = today's notebook");

console.log("theme picked from data");
const shark = (extra) => NB.generate("kid9", base(Object.assign({ notebookTheme: "shark", kidName: "Finn" }, extra || {})));
let o = shark();
ok(o.prekTheme === "shark" && /--ju-dark:  #0c4a6e/.test(o.student) && /🦈/.test(o.student), "notebookTheme \"shark\" → the ocean Pre-K notebook (any kid id)");
ok(NB.generate("kid9", base({ theme: "Shark", kidName: "Finn" })).prekTheme === "shark", "ctx.theme works too, any case");
ok(!NB.generate("kid9", base({ kidName: "Finn" })).prekTheme && !/Pre-K/.test(NB.generate("kid9", base()).student), "no theme → the kid's usual notebook (starter one here)");
ok(I.nbThemeKey({ notebookTheme: "constructor" }) === "" && I.nbThemeKey(null) === "" && I.nbThemeKey({ notebookTheme: 7 }) === "", "only a real theme name counts (read defensively)");
ok(NB.themes && NB.themes.shark && /Shark/.test(NB.themes.shark.label), "HoweNotebooks.themes lists the shark look");

console.log("the shark pages");
const sh = noStyle(o.student), shp = noStyle(o.parent);
ok((o.student.match(/<div class="page">/g) || []).length === 9 && (o.parent.match(/<div class="page">/g) || []).length === 1, "same page set as Julian: cover + ABC + calendar + month + 5 days, and a Grown-Up Guide");
ok(/Hi, Finn! 🦈/.test(sh) && /✏️ Draw YOU as a shark!/.test(sh) && /Finn's Notebook/.test(sh), "cover: hello, \"Draw YOU as a shark!\", the name from data");
ok(/class="nt-trace"[^>]*>#F#I#N#N</.test(sh.replace(/<span[^>]*>|<\/span>/g, "")) || /Trace My Name<\/div>\s*<div class="nt-trace"/.test(sh), "Trace My Name: the name in capitals");
ok((sh.match(/Swim the waves!/g) || []).length === 5 && (sh.match(/fill="#e0f2fe"/g) || []).length === 5 && (sh.match(/🐚/g) || []).length >= 5, "a wavy-ocean warm-up on every daily page (shark → shell)");
const waves = [...sh.matchAll(/stroke="#38bdf8"[^>]*>|<path d="(M4[^"]+)" fill="none" stroke="#38bdf8"/g)].map(m => m[1]).filter(Boolean);
ok(new Set(waves).size === 5, "a different sea each day (5 wave shapes)", waves.length + " / " + new Set(waves).size);
ok(/🦈 Splash! New Week/.test(sh) && /⭐ Shark Star!/.test(sh), "shark day badges");
ok(/Finn's Grown-Up Guide/.test(shp) && /Swim the Waves/.test(shp) && /10–15 minutes, side-by-side/.test(shp), "Grown-Up Guide in Caleb's voice, the warm-up explained");
const banned = /🦕|🦖|🚜|Julian|JULIAN|Caleb|Howe|DeWalt/;
ok(!banned.test(sh) && !banned.test(shp) && !/<title>[^<]*(Julian|Howe)/.test(o.student), "no dinosaur / construction / other kid's or family's words", (sh.match(banned) || shp.match(banned) || [""])[0]);
ok(!/\b(he|him|his|she|her)\b/i.test(shp.replace(/<[^>]+>/g, " ")), "the guide doesn't guess the child's pronouns");
o = shark({ kidName: '<b>"Bo"</b>' });
ok(!/<b>"Bo"/.test(o.student) && /&lt;b>&quot;Bo&quot;&lt;\/b>/.test(o.student), "the name is escaped");
ok(/Hi, Kid9! 🦈/.test(NB.generate("kid9", base({ notebookTheme: "shark", nbKidName: "Kid9" })).student), "no Family name → the app's nbKidName");
const longTrace = (n) => +((shark({ kidName: n }).student.match(/Trace My Name<\/div>\s*<div class="nt-trace" style="font-size:(\d+)px/) || [])[1]);
ok(longTrace("Finn") === 52 && longTrace("Maximilian") < 52 && longTrace("Maximilian") * 10 <= 52 * 7 + 4, "a long name is traced smaller so it stays on the card", longTrace("Finn") + "/" + longTrace("Maximilian"));

console.log("Julian's engine, his rotation from his own first week");
const letters = (h) => [...h.matchAll(/recap-chip">🔤 (\w)/g)].map(m => m[1]).join(" ");
const az = mi("Letters", "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""));
o = shark({ masteryItems: az });
ok(letters(o.student) === "A B C D E" && JSON.stringify(o.letterCursor) === '{"week":30,"idx":0,"adv":5,"from":30}', "first notebook in school week 30 opens on A (not where week 30 lands), cursor keeps his first week", letters(o.student) + " " + JSON.stringify(o.letterCursor));
o = shark({ weekNum: "week31", masteryItems: az, letterCursor: o.letterCursor });
ok(letters(o.student) === "F G H I J", "next week continues F–J", letters(o.student));
o = shark({ masteryItems: mi("Numbers", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], { 11: { status: "introduction" } }) });
ok(o.numberCursor && o.numberCursor.from === 12 && /Number of the Day · 12/.test(o.student), "numbers run ahead like Julian's (opens on the one he's learning)");
o = shark();
ok(/My Animal Friends[\s\S]*?🦈 🐟 🐙 🐳/.test(o.student), "no Animals deck → sea friends (shark, fish, octopus, whale)");
o = shark({ masteryItems: mi("Animals", ["Shark", "Sea Turtle", "Zorilla", "Lion"]) });
ok(/My Animal Friends[\s\S]*?🦈 🐢 🐟 🦁/.test(o.student), "his Animals deck: sea names get sea pictures, unknown → 🐟, the rest as Julian's");
o = shark({ masteryItems: mi("Shapes", ["Blob"]) });
ok((o.warnings || []).some(w => /Blob/.test(w)), "unknown shape still warns Mom (as Julian/Caleb)");

console.log("the \"work on these today\" strip + add-on pages");
o = shark({ extraPages: { abc: { days: { monday: true } }, thisMonth: { on: false, days: { tuesday: true } } }, units: [unit] });
const day = (h, n) => h.split('<div class="page-label">Daily Page')[n + 1] || "";
ok(/border:1.5px dashed #0284c7[\s\S]*ABC Practice/.test(day(o.student, 0)) && !/This Month/.test(day(o.student, 1)) && /Sea Turtles/.test(day(o.student, 1)), "pages assigned to a day show on that day's strip (off pages don't)");
ok(/background:#0c4a6e/.test(o.student.split('Sea Turtles · Unit Study')[0].slice(-3000) + o.student) && /#0284c7/.test(day(o.student, 0)), "unit pages + strip in the ocean palette");
ok(!/<div class="page-label">This Month/.test(o.student) && /<div class="page-label">ABC Sing-Along/.test(o.student), "the extra-page on/off toggles apply");

console.log("page fit — the same measured layout as Julian's");
const skel = (h, i) => (h.split('<div class="page-label">')[i] || "").replace(/<style[\s\S]*?<\/style>/g, "").replace(/>[^<]*</g, "><").replace(/ style="[^"]*"/g, "").replace(/<path[^>]*>|<svg[^>]*>|<\/svg>/g, "");
// week 1 for both, so the engine picks the same items (the shark kid counts from his own first week) — only words differ
const ju = NB.generate("julian", base({ weekNum: "week1", masteryItems: juItems })), sk = shark({ weekNum: "week1", masteryItems: juItems });
let same = true; for (let i = 1; i <= 10; i++) if (skel(ju.student, i) !== skel(sk.student, i)) { same = false; console.log("    differs at page " + i); }
ok(same && skel(ju.parent, 1).replace(/class="p-row"/g, "") .length > 0, "every shark page has Julian's element skeleton (tags + classes), so his measured fit carries over");
const css = (sk.student.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || "", jcss = (ju.student.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || "";
const added = css.slice(jcss.length);
ok(css.indexOf(jcss) === 0 && added.length > 0 && !/(^|[;{\s])(height|width|padding|margin|font-size|gap|flex|display|line-height|top|bottom)\s*:/m.test(added), "the shark CSS only adds colours/backgrounds on top of Julian's sheet");
ok((sk.parent.match(/class="p-row"/g) || []).length === (ju.parent.match(/class="p-row"/g) || []).length &&
   noStyle(sk.parent).replace(/<[^>]+>/g, "").length <= noStyle(ju.parent).replace(/<[^>]+>/g, "").length + 40, "the guide is no longer than Julian's (same rows, ≤ his text)",
   noStyle(sk.parent).replace(/<[^>]+>/g, "").length + " vs " + noStyle(ju.parent).replace(/<[^>]+>/g, "").length);

console.log("no kid or family names in the new code");
const block = src.slice(src.indexOf("// ── 🦈 SHARK"), src.indexOf("// PREKTHEME_END"));
const names = ["Julian", "Lincoln", "Ellis", "Lucy", "Caleb", "Kenzie", "Howe", "DeWalt", "Burris", "3D"];
ok(block.length > 2000 && !names.some(n => new RegExp("\\b" + n + "\\b", "i").test(block.replace(/Julian's (Pre-K pages|pages|sheet|measured page fit|notebook carries|path)/g, "").replace(/as Caleb's trucks do/g, ""))),
   "the shark block names no child or family (only \"Julian's sheet/pages\" for what it reuses)", names.filter(n => new RegExp("\\b" + n + "\\b", "i").test(block)).join(","));
const wire = html.slice(html.indexOf("// PREKTHEME_WIRE"), html.indexOf("// PREKTHEME_WIRE") + 600);
ok(wire.length > 100 && !names.some(n => new RegExp("\\b" + n + "\\b").test(wire)), "the app wiring names no child either");

console.log("index.html wiring");
ok(/notebookTheme:\(typeof nbRec\.notebookTheme==="string"&&nbRec\.notebookTheme\)\|\|null/.test(html) && /nbRec=ROSTER_DEF\.find\(k=>k&&k\.id===kid\)/.test(html), "haNbContext reads notebookTheme off the kid's Family record (missing = null)");
ok(/kidName:nbNm\(nbRec\.notebookName\)\|\|nbNm\(nbRec\.name\)/.test(html), "…and the name to print: notebookName (when the app shows a nickname), else the record's name");
ok((html.match(/\(kid==="julian"\|\|kid==="caleb"\|\|\(out&&out\.prekTheme\)\)&&out&&out\.letterCursor/g) || []).length === 2 &&
   (html.match(/\(kid==="julian"\|\|kid==="caleb"\|\|\(out&&out\.prekTheme\)\)&&out&&out\.numberCursor/g) || []).length === 2, "print + PDF save a themed kid's letter/number cursors (so next week continues)");
ok(/famSave[\s\S]{0,900}Object\.assign\(\{\},k,/.test(html), "the Family editor keeps extra fields on save, so notebookTheme survives renames");

// ── Real Chromium: every shark page measured (like test_nb_binding_print.js) — optional
(async () => {
  let pw = null;
  try { pw = require("playwright"); } catch (e) { try { pw = require(path.join(require("child_process").execSync("npm root -g", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(), "playwright")); } catch (e2) {} }
  if (!pw) console.log("Chromium page measurement — SKIPPED (Playwright not installed)");
  else {
    let browser; try { browser = await pw.chromium.launch(); } catch (e) { console.log("Chromium page measurement — SKIPPED: " + e.message.split("\n")[0]); }
    if (browser) {
      console.log("Chromium page measurement");
      const page = await browser.newPage();
      const big = [].concat(az, mi("Numbers", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], { 12: { status: "introduction" } }),
        mi("Shapes", ["Circle", "Square", "Triangle", "Rectangle", "Hexagon", "Oval", "Diamond", "Star", "Heart"]), mi("Colors", ["Red", "Blue", "Yellow", "Green", "Orange", "Purple", "Brown", "Black"]),
        mi("Animals", ["Shark", "Whale", "Octopus", "Crab", "Sea Turtle", "Dolphin", "Jellyfish", "Lobster"], { 1: { recentMiss: 1 } }));
      const all = { abc: { days: dates }, daysSeasons: { days: dates }, thisMonth: { days: dates } };
      for (const [label, ctx] of [["empty", {}], ["full decks + strips + units", { masteryItems: big, extraPages: all, units: [unit], spelling, teachNotes: "Short day." }], ["10-letter name", { kidName: "Maximilian" }]]) {
        const out = shark(ctx);
        for (const part of ["student", "parent"]) {
          await page.setContent(out[part].replace(/<link[^>]*fonts\.googleapis[^>]*>/g, ""));
          const bad = await page.evaluate(() => { const b = []; document.querySelectorAll(".page").forEach((pg, i) => {
            if (pg.scrollHeight > pg.clientHeight + 1 || pg.scrollWidth > pg.clientWidth + 1) b.push(i + ": page");
            pg.querySelectorAll(".body,.card,.col,.grid2,.path-wrap,.cover-learn,.p-sec").forEach(el => { if (el.scrollHeight > el.clientHeight + 2) b.push(i + ": ." + el.className.split(" ")[0] + " " + el.scrollHeight + ">" + el.clientHeight); });
          }); return b; });
          ok(!bad.length, "shark " + label + " (" + part + "): no page clips", bad.slice(0, 4).join("; "));
        }
      }
      await browser.close();
    }
  }
  console.log(pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log("  FAIL - threw: " + (e && e.stack || e)); process.exit(1); });
