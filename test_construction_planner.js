// 🚜 CBPLAN — the construction notebook's "This week's plan" card (11/3 note: "has no planner card"; her yes 2026-11-08).
// Run: node test_construction_planner.js
//   • notebooks.js: the kid's own builder offers a planner (catalog entry `plan`) that reads the exact picks the pages print,
//     from the kid's own ctx (decks, cursors, Mom's picks); none for any other notebook or when a theme is set
//   • Mom's number pick lands on the pages (JU_NUMPICK, as the dinosaur notebook's)
//   • every other notebook (and the construction one without Mom's picks) is byte-for-byte as before (hash snapshots below)
//   • page fit: the picks change words, not layout (same page skeleton); real-Chromium measurement when Playwright is
//     installed (as test_notebook_shark.js), else SKIPPED
//   • index.html: the card shows only for a kid whose builder has a planner, Mom only; picks write that kid's week node only;
//     the dinosaur notebook's own card block is untouched; no kid or family names in the new code
// Snapshots were taken from origin/main e5cbab4 (before CBPLAN):  NB_FILE=<old notebooks.js> node test_construction_planner.js --hashes
const fs = require("fs"), path = require("path"), crypto = require("crypto"), vm = require("vm");
const NB_FILE = process.env.NB_FILE || path.join(__dirname, "notebooks.js");
const src = fs.readFileSync(path.join(__dirname, "notebooks.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function loadNb(file) { const w = {}; const sb = { window: w, console, navigator: { userAgent: "" } }; vm.createContext(sb); vm.runInContext(fs.readFileSync(file, "utf8"), sb); return w.HoweNotebooks; }
let pass = 0, fail = 0;
function ok(c, name, d) { if (c) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name + (d !== undefined ? "  → " + (typeof d === "string" ? d : JSON.stringify(d)) : "")); } }
const H = (o) => crypto.createHash("sha256").update(JSON.stringify(o)).digest("hex").slice(0, 16);
const J = (o) => JSON.parse(JSON.stringify(o));

const dates = { monday: "November 9, 2026", tuesday: "November 10, 2026", wednesday: "November 11, 2026", thursday: "November 12, 2026", friday: "November 13, 2026" };
const base = (extra) => Object.assign({ weekNum: "week30", weekDates: "Nov 9–13, 2026", weekData: { dates, tasks: [] }, masteryItems: [], extraPages: {} }, extra || {});
const mi = (subject, prompts, extra) => prompts.map((p, i) => Object.assign({ id: subject + p, subject, prompt: String(p), tier: "daily" }, (extra || {})[i] || {}));
const items = [].concat(
  mi("Letters", ["A", "B", "C", "D"]), mi("Lowercase", ["c", "o", "s", "v", "w"], { 2: { recentMiss: 2 } }), mi("Letter Sounds", ["c"]),
  mi("Numbers", [11, 12, 13], { 2: { status: "introduction" } }), mi("Shapes", ["Circle", "Oval", "Square"], { 1: { status: "introduction" } }),
  mi("Colors", ["Red", "Blue", "Green"]), mi("Animals", ["Lion", "Dog"]));
const FIX = {
  empty: base(),
  mastery: base({ masteryItems: items }),
  cursors: base({ weekNum: "week31", masteryItems: items, letterCursor: { week: 30, idx: 2, adv: 5, from: 28 }, numberCursor: { week: 30, from: 4, adv: 5 } }),
  fourDay: base({ masteryItems: items, weekData: { dates: { tuesday: dates.tuesday, wednesday: dates.wednesday, thursday: dates.thursday, friday: dates.friday }, tasks: [] } }),
  picks: base({ masteryItems: items, juPicks: { letters: { 0: "o" }, numbers: { 1: "57" }, shapes: { 2: "Square" } } }),
  theme: base({ masteryItems: items, notebookTheme: "shark" })
};
const KIDS = ["lincoln", "ellis", "lucy", "julian", "caleb", "kidx"];
function hashes(NB) {
  const out = {};
  KIDS.forEach(k => Object.keys(FIX).forEach(n => { try { out[k + "/" + n] = H(NB.generate(k, J(FIX[n]))); } catch (e) { out[k + "/" + n] = "threw:" + String(e.message || e).slice(0, 40); } }));
  Object.keys(FIX).forEach(n => { out["juPlanPreview/" + n] = H(NB.juPlanPreview(J(FIX[n]))); });
  return out;
}
if (process.argv.includes("--hashes")) { console.log(JSON.stringify(hashes(loadNb(NB_FILE)), null, 1)); process.exit(0); }

const BEFORE = {
 "lincoln/empty": "40a3ec8aaba2b516", "lincoln/mastery": "40a3ec8aaba2b516", "lincoln/cursors": "c6289aacffe59d2d", "lincoln/fourDay": "eea65c2a46406add", "lincoln/picks": "40a3ec8aaba2b516", "lincoln/theme": "2851b1b36aab33a8",
 "ellis/empty": "c3a87b363fbdcf7e", "ellis/mastery": "c3a87b363fbdcf7e", "ellis/cursors": "46e85ff74ade36f5", "ellis/fourDay": "25d955c9ae845aa2", "ellis/picks": "c3a87b363fbdcf7e", "ellis/theme": "2851b1b36aab33a8",
 "lucy/empty": "6396d3822f2d341e", "lucy/mastery": "6396d3822f2d341e", "lucy/cursors": "0917d7367019f92f", "lucy/fourDay": "85f73d959c6de9c2", "lucy/picks": "6396d3822f2d341e", "lucy/theme": "2851b1b36aab33a8",
 "julian/empty": "8a86b1e0d153f181", "julian/mastery": "c36581d4afc79708", "julian/cursors": "dedbf10fcee93f3c", "julian/fourDay": "785327ce90891c75", "julian/picks": "84106bb6874bd39d", "julian/theme": "2851b1b36aab33a8",
 "caleb/empty": "8b37fe802fbd9ed6", "caleb/mastery": "a52f4600e15d7483", "caleb/cursors": "96386ec7824807a4", "caleb/fourDay": "529367779ed92d70", "caleb/picks": "d2d83137ff5e8bee", "caleb/theme": "2851b1b36aab33a8",
 "kidx/empty": "98cd36b5413f5b91", "kidx/mastery": "98cd36b5413f5b91", "kidx/cursors": "2cf707483a0b2775", "kidx/fourDay": "98cd36b5413f5b91", "kidx/picks": "98cd36b5413f5b91", "kidx/theme": "2851b1b36aab33a8",
 "juPlanPreview/empty": "2d0d0b2f20d7012f", "juPlanPreview/mastery": "204d506f889cda4e", "juPlanPreview/cursors": "5d1ad6bf9b03921c", "juPlanPreview/fourDay": "dcace5405162a444", "juPlanPreview/picks": "b3ba3b886911e339", "juPlanPreview/theme": "204d506f889cda4e"
};

const NB = loadNb(path.join(__dirname, "notebooks.js"));
// The planner kid comes from the catalog (a Pre-K builder whose planner isn't the app's own) — never named here.
// PREKLEVEL (2026-11-08): the planner lives in the one Pre-K notebook (generatePreK), so it follows the kid's look and levels.
const PK = Object.keys(NB.GENERATORS).filter(k => NB.hasPlan(k));
const K = PK[0];

console.log("notebooks.js — the kid's own builder offers the planner");
ok(PK.length === 1, "exactly one of the kids' own builders offers this planner (the construction one; the dinosaur one keeps the app's card)", PK);
ok(NB.hasPlan(K) === true && KIDS.filter(k => k !== K).every(k => NB.hasPlan(k) === false), "hasPlan: that kid only");
ok(KIDS.filter(k => k !== K).every(k => NB.planFor(k, J(FIX.mastery)) === null), "planFor: null for every other notebook (incl. the dinosaur one, which keeps its own juPlanPreview)");
const PT = NB.planFor(K, J(FIX.theme));
ok(PT && PT.look === "shark" && JSON.stringify(Object.keys(PT.subjects)) === '["letters","numbers","shapes","colors","animals"]' && PT.lowercase === true,
   "a look set in the kid's data: the plan follows it (sharks count sea animals → an animals row), still the kid's own level", PT && [PT.look, Object.keys(PT.subjects)]);
const PX = NB.planFor("kidx", J(FIX.theme));
ok(NB.hasPlan("kidx", { notebookTheme: "shark" }) && PX && PX.look === "shark" && PX.lowercase === false && PX.days.length === 5, "a starter kid given a Pre-K look gets the planner too (capitals level)");
const P = NB.planFor(K, J(FIX.mastery));
ok(P && JSON.stringify(Object.keys(P.subjects)) === '["letters","numbers","shapes","colors"]', "the four things its daily page prints — letters, numbers, shapes, colors (no animals)", P && Object.keys(P.subjects));
ok(P && JSON.stringify(P.days) === JSON.stringify(Object.keys(dates)) && Object.values(P.subjects).every(s => s.slots.length === 5), "one slot per day that gets a page", P && P.days);
const P4 = NB.planFor(K, J(FIX.fourDay));
ok(P4 && P4.days.length === 4 && P4.days[0] === "tuesday" && P4.subjects.letters.slots.length === 4, "a four-day week → four slots, named by their own days", P4 && P4.days);
ok(P.subjects.letters.items.slice(0, 5).map(i => i.prompt).join("") === "cosvw", "letters come from the kid's own Lowercase deck first", P.subjects.letters.items.slice(0, 6).map(i => i.prompt));
ok(P.subjects.letters.items.find(i => i.prompt === "s").flagged === true, "a letter missed in drills is 🔁-flagged");
ok(P.subjects.numbers.items.length === 100 && P.subjects.numbers.items[0].prompt === "1", "the Numbers chooser offers every numeral 1–100 (JU_NUMPICK)");
const out = NB.generate(K, J(FIX.mastery));
const cover = (out.student.match(/Numbers<\/div><div class="learn-val">([^<]*)</) || [])[1] || "";
ok(cover === P.subjects.numbers.slots.map(s => s.prompt).join(" · "), "the plan's numbers are exactly the cover's numbers", [cover, P.subjects.numbers.slots.map(s => s.prompt)]);
const Pc = NB.planFor(K, J(FIX.cursors)), Oc = NB.generate(K, J(FIX.cursors));
const coverC = (Oc.student.match(/Numbers<\/div><div class="learn-val">([^<]*)</) || [])[1] || "";
ok(coverC === Pc.subjects.numbers.slots.map(s => s.prompt).join(" · "), "…and still with the kid's stored letter/number cursors", [coverC, Pc.subjects.numbers.slots.map(s => s.prompt)]);
ok(JSON.stringify(Pc.subjects.letters.slots) !== JSON.stringify(P.subjects.letters.slots), "the cursor moves the plan on (another week's letters)");

console.log("Mom's picks — the card and the pages agree");
const Pp = NB.planFor(K, J(FIX.picks)), Op = NB.generate(K, J(FIX.picks));
ok(Pp.subjects.numbers.slots[1].prompt === "57" && Pp.subjects.numbers.slots[1].picked === true, "Tuesday's number picked 57 → the plan slot says 57 📌");
ok(Pp.subjects.letters.slots[0].prompt === "o" && Pp.subjects.letters.slots[0].picked, "Monday's letter picked o → 📌");
ok(Pp.subjects.shapes.slots[2].prompt === "Square" && Pp.subjects.shapes.slots[2].picked, "Wednesday's shape picked Square → 📌");
const coverP = (Op.student.match(/Numbers<\/div><div class="learn-val">([^<]*)</) || [])[1] || "";
ok(coverP.split(" · ")[1] === "57", "…and the printed cover lists 57 on Tuesday", coverP);
ok(Pp.subjects.numbers.slots.filter((s, i) => i !== 1).every((s, i) => !s.picked), "untouched days stay on auto");
ok(!("plan" in Op) && typeof Op.student === "string", "a real build never carries the plan (planOnly is the planner's own ctx copy)");
ok(FIX.picks.planOnly === undefined, "the caller's ctx is not mutated");

console.log("every other notebook is byte-for-byte as before");
const NOW = hashes(NB);
// PREKLEVEL (2026-11-08) moves the six "*/theme" rows ON PURPOSE (notebookTheme "shark" on every kid): an older kid's notebook
// no longer wears a Pre-K look, a Pre-K kid keeps its own levels in a new look, and a long name ("Little Shark") is traced
// smaller. Their new behaviour is asserted just below; test_prek_notebook_levels.js holds the fold's own snapshots.
const THEMED = KIDS.map(k => k + "/theme");
const changed = Object.keys(BEFORE).filter(k => k !== K + "/picks" && THEMED.indexOf(k) < 0 && NOW[k] !== BEFORE[k]);
ok(!changed.length, "all " + (Object.keys(BEFORE).length - 1 - THEMED.length) + " snapshots match (5 notebooks + the starter one × 5 fixtures, the dinosaur planner's juPlanPreview × 6)", changed.map(k => k + " now " + NOW[k]).join(", "));
ok(["lincoln", "ellis", "lucy"].every(k => NOW[k + "/theme"] === NOW[k + "/mastery"]), "*/theme: an older kid's notebook ignores a Pre-K look");
ok(["julian", K, "kidx"].every(k => NB.generate(k, J(FIX.theme)).prekTheme === "shark") && NOW["julian/theme"] !== NOW[K + "/theme"], "*/theme: the Pre-K kids wear the shark look, each at their own level");
ok(NOW[K + "/picks"] !== BEFORE[K + "/picks"], "the one intended change: the construction notebook WITH Mom's picks (her number pick now prints)");

console.log("page fit — picks change words, not the layout");
// Each page's block skeleton (div classes; state marks like "on" dropped, drawings collapsed): what decides the fit.
const divs = (h) => String(h).replace(/<style[\s\S]*?<\/style>/g, "").replace(/<svg[\s\S]*?<\/svg>/g, "<svg/>").split('<div class="page').slice(1)
  .map(pg => (pg.match(/<div class="[^"]*"/g) || []).map(x => x.replace(/\s(on|rev|review|is-[a-z]+)(?=[\s"])/g, "")).join("|"));
const A0 = divs(NB.generate(K, J(FIX.mastery)).student), AP = divs(Op.student);
ok(A0.length === AP.length, "same page count with and without Mom's picks", [A0.length, AP.length]);
const diffP = AP.map((p, i) => p === A0[i] ? -1 : i).filter(i => i >= 0);
// A picked number prints the way the rotation itself prints that number: build a week whose rotation lands 57 on Tuesday.
const AN = divs(NB.generate(K, base({ masteryItems: items, numberCursor: { week: 30, from: 56, adv: 5 } })).student);
ok(diffP.length <= 1 && diffP.every(i => AP[i] === AN[i]), "every page keeps its layout; the one that changes (57's tens tiles) is exactly the page the rotation prints for 57 — already a page the notebook fits", diffP);

console.log("index.html — the card");
function cut(a, b) { const i = html.indexOf(a); if (i < 0) throw new Error("no " + a); return html.slice(i, html.indexOf(b, i) + b.length); }
function fn(n) { const i = html.indexOf("function " + n + "("); if (i < 0) throw new Error("no function " + n); const eol = html.indexOf("\n", i), line = html.slice(i, eol); let d = 0; for (const ch of line) { if (ch === "{") d++; else if (ch === "}") d--; } return d === 0 ? line : html.slice(i, html.indexOf("\n}", i) + 2); }
const CARD = cut("// CBPLAN_START", "// CBPLAN_END");
function app(o) {
  o = o || {};
  const L = { db: [], renders: 0 };
  const ctx = {
    console, Object, Array, String, JSON, parseInt, Math,
    window: { HoweNotebooks: o.noNb ? undefined : NB },
    notebookSettings: o.ns || {}, momHere: () => o.mom !== false, nbTargetWk: () => "week30", tab: "notebook",
    document: { getElementById: () => ({}) }, renderNotebook: () => { L.renders++; },
    HA_LS: { setItem() {} }, db: { ref: p => ({ set: v => L.db.push([p, v]) }) },
    DAY_LBL: { monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday", friday: "Friday" },
    esc: s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
  };
  ctx.haNbContext = (kid) => Object.assign(J(o.fix || FIX.mastery), { juPicks: vm.runInContext("nbJuPicks", ctx)("week30", kid) });
  vm.createContext(ctx);
  vm.runInContext(["nbJuPicks", "nbJuSet", "nbJuResetWeek", "nbJuToggleOpen"].map(fn).join("\n") + "\nlet nbJuOpen=null;\n" + CARD +
    "\nthis.setOpen=v=>{nbJuOpen=v;}; this.getOpen=()=>nbJuOpen;", ctx);
  ctx.L = L;
  return ctx;
}
{
  const A = app();
  const h = A.nbPlanCardHtml(K);
  ok(/This week’s build plan/.test(h) && /\u{1F69C}/u.test(h) && />MOM</.test(h), "the card: 🚜 This week's build plan · MOM");
  ok((h.match(/onclick="nbJuToggleOpen\(/g) || []).length === 20, "4 rows × 5 day buttons", (h.match(/onclick="nbJuToggleOpen\(/g) || []).length);
  ok(/Little letters/.test(h) && /Numbers/.test(h) && /Shapes/.test(h) && /Colors/.test(h) && !/Animals/.test(h), "its own rows and words (little letters; no animals row)");
  ok(/>Mon</.test(h) && />Fri</.test(h), "days named from the plan's own days");
  ok(/1 missed in drills/.test(h), "the 🔁 count from the kid's own drill misses");
  ok(!/All auto/.test(h), "no picks yet → no ↺ All auto");
  ok(!/Julian|julian|dinosaur|\u{1F995}/u.test(h), "nothing of the dinosaur card's words leaks in");
  A.setOpen(K + "|numbers:1");
  const ho = A.nbPlanCardHtml(K);
  ok((ho.match(/onclick="nbJuSet\('numbers',1,'\d+','/g) || []).length === 100, "Tuesday's Numbers chooser: 1–100");
  ok(/Tue — pick numbers/.test(ho) && /nbJuSet\('numbers',1,null,'/.test(ho), "…with its day and ↺ Back to auto");
  A.nbJuSet("numbers", 1, "57", K);
  ok(A.notebookSettings[K].juPicks.week30.numbers[1] === "57", "a pick is stored for THIS kid's week");
  ok(JSON.stringify(A.L.db) === JSON.stringify([["notebookSettings/" + K + "/juPicks/week30", { numbers: { 1: "57" } }]]), "one write: that kid's week node only", A.L.db);
  ok(A.getOpen() === null && A.L.renders === 1, "the chooser closes and the tab re-renders");
  const hp = A.nbPlanCardHtml(K);
  ok(/57<\/div>[\s\S]{0,200}\u{1F4CC} picked/u.test(hp) && /1 slot changed this week/.test(hp) && /nbJuResetWeek\('/.test(hp), "the card shows 57 📌 and ↺ All auto");
  A.nbJuResetWeek(K);
  ok(!A.notebookSettings[K].juPicks.week30 && JSON.stringify(A.L.db[1]) === JSON.stringify(["notebookSettings/" + K + "/juPicks/week30", null]), "↺ All auto clears that week only");
  const B = app({ ns: { julian: {} } });
  B.nbJuSet("letters", 0, "M");
  ok(B.L.db.length === 1 && B.L.db[0][0] === "notebookSettings/julian/juPicks/week30", "the dinosaur card's own calls (no kid) still write where they always did");
  const M = app({ mom: false });
  M.nbJuSet("numbers", 1, "57", K);
  ok(M.L.db.length === 0, "a kid's tap can't change the plan (Mom only)");
}
{
  ok(KIDS.filter(k => k !== K).every(k => app().nbPlanCardHtml(k) === ""), "every other kid: no card (\"\")");
  const ht = app({ fix: FIX.theme }).nbPlanCardHtml(K);
  ok(/\u{1F988} This week’s swim plan/u.test(ht) && /Little letters/.test(ht) && /Animals/.test(ht) && (ht.match(/onclick="nbJuToggleOpen\(/g) || []).length === 25, "a look set in the kid's data: the card follows it (🦈 swim plan, an animals row)");
  ok(app({ noNb: true }).nbPlanCardHtml(K) === "", "notebooks.js not loaded (or an older one without planFor): no card");
}

console.log("index.html — wiring");
const OLD = (() => { try { return require("child_process").execSync("git show e5cbab4:index.html", { cwd: __dirname, maxBuffer: 1 << 28, stdio: ["ignore", "pipe", "ignore"] }).toString(); } catch (e) { return null; } })();
const juBlock = (h) => { const i = h.indexOf('  let juPlanHtml="";'); return h.slice(i, h.indexOf("}catch(e){ juPlanHtml=", i)); };
if (OLD) ok(juBlock(OLD) === juBlock(html), "the dinosaur notebook's planner card block is byte-for-byte unchanged");
else console.log("  (old index.html not reachable — dinosaur card block comparison SKIPPED)");
ok(/if\(!juPlanHtml&&sel!=="julian"&&momHere\(\)&&typeof nbPlanCardHtml==="function"\) juPlanHtml=nbPlanCardHtml\(sel\);/.test(html), "the Notebook tab shows it in the planner's spot, Mom only");
ok(/else if\(typeof nbPlanKid==="function"&&nbPlanKid\(kid\)\) juPicks=nbJuPicks\(tgtWk,kid\);/.test(html), "the notebook build gets that kid's own picks (so the print follows the card)");
const names = /lincoln|ellis|lucy|julian|caleb|kenzie|sara\b|dewalt|howe/i;
ok(!names.test(CARD.replace(/HoweNotebooks/g, "")), "index.html CBPLAN block: no kid or family names (bar the HoweNotebooks API name)");
const nbBlock = src.slice(src.indexOf("// CBPLAN_START"), src.indexOf("// CBPLAN_END"));
ok(nbBlock.length > 200 && !names.test(nbBlock.replace(/generateCaleb/g, "")), "notebooks.js CBPLAN block: no kid or family names (bar the existing builder's function name)");
ok(/if \(ctx\.planOnly\) \{ var _pl = juPlanShape\(curWk, picks, wkInt \|\| 1, days\.length, pkPlanSubs\(T\)\);/.test(src), "the planner reads the build's own picks (one guarded line in the one Pre-K builder)");

(async () => {
  let pw = null;
  try { pw = require("playwright"); } catch (e) { try { pw = require(path.join(require("child_process").execSync("npm root -g", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(), "playwright")); } catch (e2) {} }
  if (!pw) console.log("Chromium page measurement — SKIPPED (Playwright not installed)");
  else {
    let browser; try { browser = await pw.chromium.launch(); } catch (e) { console.log("Chromium page measurement — SKIPPED: " + e.message.split("\n")[0]); }
    if (browser) {
      console.log("Chromium page measurement");
      const page = await browser.newPage();
      for (const [label, ctx] of [["no picks", FIX.mastery], ["Mom's picks", FIX.picks], ["picks: 100 + long colour", base({ masteryItems: items, juPicks: { numbers: { 0: "100" }, colors: { 1: "Green" } } })]]) {
        const o = NB.generate(K, J(ctx));
        await page.setContent(o.student.replace(/<link[^>]*fonts\.googleapis[^>]*>/g, ""));
        const bad = await page.evaluate(() => { const b = []; document.querySelectorAll(".page").forEach((pg, i) => { if (pg.scrollHeight > pg.clientHeight + 1 || pg.scrollWidth > pg.clientWidth + 1) b.push(i + ": page"); }); return b; });
        ok(!bad.length, "construction " + label + ": no page clips", bad.slice(0, 4).join("; "));
      }
      await browser.close();
    }
  }
  console.log(pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log("  FAIL - threw: " + (e && e.stack || e)); process.exit(1); });
