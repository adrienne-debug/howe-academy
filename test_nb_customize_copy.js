// 🎛 NB_CUSTOM_COPY — "Same as another kid…" on the Customize card (looks plan §14; her answer 2026-11-24 to question 12: "Yes" —
// "copies settings only"). Run: node test_nb_customize_copy.js
//   • only this family's other notebook kids are offered (NB_KIDS from the roster — nothing typed in)
//   • before writing, the card lists every change (old → new) with Copy / Cancel
//   • Copy writes exactly the listed paths, one targeted path each under notebookSettings/<kid>/, never the whole node
//   • Cancel writes nothing; ?dryrun=1 writes nothing; not a parent = no button and no write
//   • never copied: the name in the notebook, any cursor or place (ladder lv/cur/days too), Daily Grams, tablet copies, week picks,
//     banks, a kid's own look pick when the allowed lists differ — and nothing outside notebook settings
const fs = require("fs"), path = require("path"), vm = require("vm");
const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const nbSrc = fs.readFileSync(path.join(__dirname, "notebooks.js"), "utf8");
let pass = 0, fail = 0;
function ok(c, name, d) { if (c) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name + (d !== undefined ? "  → " + String(d).slice(0, 400) : "")); } }
const count = (s, sub) => s.split(sub).length - 1;
const block = (n) => { const a = html.indexOf("// " + n + "_START"), b = html.indexOf("// " + n + "_END"); if (a < 0 || b < a) throw new Error("no block " + n); return html.slice(a, b); };
function fnSrc(name) {
  let a = html.indexOf("\nfunction " + name + "("); if (a < 0) throw new Error("no function " + name);
  const lines = html.slice(a + 1).split("\n"), out = [lines[0]];
  if (!/\{\s*$/.test(lines[0]) && /\}\s*(\/\/.*)?$/.test(lines[0])) return out[0];
  for (let i = 1; i < lines.length; i++) { const l = lines[i]; if (/^[^\s}]/.test(l)) break; out.push(l); if (/^\}/.test(l)) break; }
  return out.join("\n");
}

console.log("the block");
const COPY = block("NB_CUSTOM_COPY");
const code = COPY.split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n").replace(/   \/\/ .*$/gm, "");
ok(count(html, "// NB_CUSTOM_COPY_START") === 1 && count(html, "// NB_CUSTOM_COPY_END") === 1, "index.html: one NB_CUSTOM_COPY block");
ok((code.match(/db\.ref\(/g) || []).length === 1 && /db\.ref\("notebookSettings\/"\+to\+"\/"\+c\.p\)/.test(code) && /typeof db!=="undefined"&&db&&!_dryRun\(\)/.test(code), "one write site: notebookSettings/<kid>/<one path>, behind db && !_dryRun()");
ok(!/\.update\(/.test(code) && !/ref\("notebookSettings\/"\+to\)/.test(code), "never an update() or a write of the whole notebookSettings/<kid> node");
ok(!/\b(julian|lincoln|ellis|lucy|caleb|kenzie|david|howe|dewalt|burris)\b/i.test(code), "no child's or family's name in the block");
ok(!/\b(he|his|him|she|her)\b/.test((code.match(/'[^']*'/g) || []).join(" ").replace(/<[^>]*>/g, " ")), "no he/his/she/her in its words");
ok(html.indexOf("\u{1F500}") < 0, "no 🔀 in index.html");
const CUST = block("NB_CUSTOM");
ok(/\(\(typeof nbCopyBtnHtml==="function"\)\?nbCopyBtnHtml\(kid\):""\)/.test(CUST) && /\(\(typeof nbCopyPanelHtml==="function"\)\?nbCopyPanelHtml\(kid\):""\)/.test(CUST) && count(html, "nbCopyBtnHtml(") === 2 && count(html, "nbCopyPanelHtml(") === 2,
  "the button and its panel are drawn once, on the Customize card's folded line");

// ── sandbox: the real blocks ────────────────────────────────────────────────
const NBW = {}; new Function("window", nbSrc)(NBW); const NB = NBW.HoweNotebooks;
const FNS = ["momHere", "esc", "utsJ", "nbReviewCap", "nbXpCfg", "nbUnitDays", "haKidUnits", "stEnroll", "nbtMode", "nbtSegHtml", "nbtBuilt", "nbDgCfg", "nbDgDefaultBook"];
const SRC = ["NB_LOOKPICK", "PREKLEVEL_WIRE", "NBLEVEL", "NBLADDER", "NBNAME", "NB_COUNTPIC", "NBNEEDS", "NB_CUSTOM", "NB_CUSTOM_COPY"].map(block).join("\n") + "\n" + FNS.map(fnSrc).join("\n");
const NAMES = { kidp: "Pia", kidq: "Quin", ellis: "El", kidz: "Zed", ghost: "Gus" };
function settings() {
  return {
    kidp: { notebookTheme: "space", looksAllowed: { space: true, farm: true }, nbLevel: { nbTeens: true, nbFindIt: false },
      extraPages: { abc: { on: false }, thisMonth: { on: true, days: { monday: true } } }, reviewCap: 4, countPic: "animal", nbMode: "tablet", gradeOverride: "K",
      notebookName: "Pip", letterCursor: { week: 30, idx: 7, adv: 5 }, numberCursor: { week: 30, from: 12, adv: 5 }, wordCursor: { week: 30, idx: 3, adv: 5 },
      dailyGrams: { on: true, cursor: { week: 29, day: 40, adv: 5 } }, ladders: { reading: { on: true, lv: "g1", cur: { p: "x" }, days: "tue", opt: true } },
      tablet: { week30: { ts: 1, pages: 12 } }, juPicks: { week30: { letters: { 0: "B" } } }, unitDays: { u1: { monday: true } }, wordBank: { words: { a: { word: "cat" } } } },
    kidq: { notebookTheme: "dino", notebookName: "Quin-Q", letterCursor: { week: 30, idx: 2, adv: 5 }, ladders: { reading: { lv: "k", cur: { p: "y" } } },
      extraPages: { daysSeasons: { on: false } }, unitDays: { u1: { friday: true } }, tablet: { week29: { ts: 2, pages: 9 } } },
    ellis: { nbMode: "print" }, kidz: {}
  };
}
function sandbox(o) {
  o = o || {};
  const writes = [], ls = {};
  const ctx = {
    window: { HoweNotebooks: NB }, JSON, Object, Array, String, Math, parseInt, isNaN,
    notebookSettings: o.ns || settings(), momModeActive: o.mom !== false, adminPinUnlocked: false, tab: "notebook",
    HA_LS: { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); } },
    db: { ref: (p) => ({ set: (v) => writes.push(["set", p, JSON.parse(JSON.stringify(v))]), remove: () => writes.push(["remove", p]), update: (v) => writes.push(["update", p, v]) }) },
    _dryRun: () => !!o.dry, document: { getElementById: () => null }, renderNotebook() {},
    ROSTER: ["kidp", "kidq", "ellis", "kidz"],
    ROSTER_DEF: [{ id: "kidp", name: "Pia", grade: "PreK" }, { id: "kidq", name: "Quin", grade: "PreK" }, { id: "ellis", name: "El", grade: "4" }, { id: "kidz", name: "Zed" }],
    NB_KIDS: ["kidp", "kidq", "ellis", "kidz", "ghost"].map((k) => ({ k, label: NAMES[k] })),   // ghost: not on this family's roster
    isPreK: (k) => k === "kidp" || k === "kidq", cap: (k) => NAMES[k] || k, KID_COLOR: {},
    masteryFromApp: () => ({}), masteryData: { history: {} }, notebookBooks: {}, nbTargetWk: () => "week30", nbTargetWkNum: () => 30,
    unitStudies: { u1: { id: "u1", title: "Sharks", enrolled: { kidp: true, kidq: true, ellis: true } }, u2: { id: "u2", title: "Rocks", enrolled: { kidq: true } } },
    haLoadNotebooksLib: () => Promise.resolve(NB), Promise
  };
  vm.createContext(ctx);
  vm.runInContext(SRC + "\n;this.__=function(c){return eval(c)};", ctx);
  ctx.writes = writes; ctx.ls = ls;
  return ctx;
}
const snap = (S) => JSON.stringify(S.notebookSettings);

// ── who can be copied from ──────────────────────────────────────────────────
console.log("who is offered");
{ const S = sandbox();
  ok(JSON.stringify(S.nbCopyKids("kidq")) === '["kidp","ellis","kidz"]', "Quin's card offers the family's other notebook kids, from the roster (not the kid itself, not a kid off the roster)", JSON.stringify(S.nbCopyKids("kidq")));
  ok(S.nbCopyPlan("ghost", "kidq").length === 0 && S.nbCopyPlan("kidq", "kidq").length === 0, "a kid off the roster or the kid itself gives nothing to copy");
  const btn = S.nbCopyBtnHtml("kidq");
  ok(/onclick="nbCopyOpen\('kidq'\)"[^>]*>▸ Same as another kid…</.test(btn), "the folded line's “▸ Same as another kid…” button");
  S.__("_nbcCopy=null"); S.nbCopyOpen("kidq"); const pan = S.nbCopyPanelHtml("kidq");
  ok(["kidp", "ellis", "kidz"].every((k) => count(pan, "nbCopyOpen('kidq','" + k + "')") === 1) && pan.indexOf("ghost") < 0 && pan.indexOf("nbCopyDo(") < 0, "tapped: one button per kid to copy from; nothing to confirm yet");
  ok(sandbox({ mom: false }).nbCopyBtnHtml("kidq") === "" && sandbox({ mom: false }).nbCopyPanelHtml("kidq") === "", "not a parent: no button, no panel"); }

// ── the plan: Pre-K kid → another Pre-K kid ─────────────────────────────────
console.log("Pia → Quin (two Pre-K kids)");
const WANT = [
  ["set", "notebookSettings/kidq/gradeOverride", "K"],
  ["set", "notebookSettings/kidq/nbMode", "tablet"],
  ["set", "notebookSettings/kidq/looksAllowed/space", true],
  ["set", "notebookSettings/kidq/looksAllowed/farm", true],
  ["set", "notebookSettings/kidq/nbLevel/nbFindIt", false],
  ["set", "notebookSettings/kidq/nbLevel/nbTeens", true],
  ["set", "notebookSettings/kidq/countPic", "animal"],
  ["set", "notebookSettings/kidq/extraPages/abc", { on: false }],
  ["remove", "notebookSettings/kidq/extraPages/daysSeasons"],
  ["set", "notebookSettings/kidq/extraPages/thisMonth", { on: true, days: { monday: true } }],
  ["set", "notebookSettings/kidq/reviewCap", 4],
  ["set", "notebookSettings/kidq/unitDays/u1", { monday: true }],
  ["set", "notebookSettings/kidq/ladders/reading/on", true],
  ["set", "notebookSettings/kidq/ladders/reading/opt", true]
];
const key = (w) => w[0] + " " + w[1] + " " + JSON.stringify(w[2] === undefined ? null : w[2]);
const sameSet = (a, b) => a.length === b.length && a.map(key).sort().join("\n") === b.map(key).sort().join("\n");
{ const S = sandbox(); const before = JSON.parse(snap(S));
  S.nbCopyOpen("kidq", "kidp"); const pan = S.nbCopyPanelHtml("kidq"), plan = S.nbCopyPlan("kidp", "kidq");
  ok(plan.length === WANT.length && count(pan, " → <b>") === plan.length, "the card lists each change, old → new, before anything is written (" + plan.length + " lines)", plan.map((c) => c.p).join(", "));
  ok(/Grade: <s[^>]*>the Family grade<\/s> → <b>K<\/b>/.test(pan) && /This notebook is: <s[^>]*>Printed<\/s> → <b>On the tablet<\/b>/.test(pan) && /Review slots: <s[^>]*>2<\/s> → <b>4<\/b>/.test(pan), "…in plain words (Grade the Family grade → K · Printed → On the tablet · Review slots 2 → 4)");
  ok(count(pan, "nbCopyDo('kidq')") === 1 && count(pan, ">Copy</button>") === 1 && count(pan, ">Cancel</button>") === 1, "…with Copy and Cancel");
  ok(S.writes.length === 0 && snap(S) === JSON.stringify(before), "showing the list writes nothing");
  // Cancel
  S.__(pan.match(/onclick="(nbCopyOpen\('kidq'\))"[^>]*>Cancel/)[1]);
  ok(S.writes.length === 0 && snap(S) === JSON.stringify(before) && S.nbCopyPanelHtml("kidq") === "" && S.nbCopyDo("kidq") === 0, "Cancel: nothing written, the panel closes, a stray Copy after it does nothing");
  // Copy
  S.nbCopyOpen("kidq", "kidp"); const n = S.nbCopyDo("kidq");
  ok(n === WANT.length && sameSet(S.writes, WANT), "Copy writes exactly the listed paths — the exact write list", S.writes.map(key).join(" | "));
  ok(S.writes.every((w) => /^notebookSettings\/kidq\/[^/]+/.test(w[1]) && w[0] !== "update") && new Set(S.writes.map((w) => w[1])).size === S.writes.length, "one targeted path each, under notebookSettings/kidq/ — never the whole node, no path twice");
  const q = S.notebookSettings.kidq, b = before.kidq;
  ok(q.notebookName === "Quin-Q" && JSON.stringify(q.letterCursor) === JSON.stringify(b.letterCursor) && q.numberCursor === undefined && q.wordCursor === undefined, "never copied: the name in the notebook, the letter / number / word places");
  ok(q.ladders.reading.lv === "k" && q.ladders.reading.cur.p === "y" && q.ladders.reading.days === undefined, "never copied: a ladder's level, place and days");
  ok(q.dailyGrams === undefined && JSON.stringify(q.tablet) === JSON.stringify(b.tablet) && q.juPicks === undefined && q.wordBank === undefined, "never copied: Daily Grams (its book and place), tablet copies, the week's picks, banks");
  ok(q.notebookTheme === "dino", "never copied: Pia's own look pick (she picks from 2 ticked looks) — the ticks copy, Quin keeps his look until he picks");
  ok(JSON.stringify(S.notebookSettings.kidp) === JSON.stringify(before.kidp) && JSON.stringify(S.notebookSettings.ellis) === JSON.stringify(before.ellis), "the kid copied from, and every other kid, untouched");
  ok(S.nbCopyPlan("kidp", "kidq").length === 0, "after Copy, Quin is the same as Pia — nothing left to copy");
  S.nbCopyOpen("kidq", "kidp"); ok(/Already the same as Pia — nothing to copy\./.test(S.nbCopyPanelHtml("kidq")) && S.nbCopyPanelHtml("kidq").indexOf("nbCopyDo(") < 0, "…and the card says so, with no Copy button");
  ok(S.ls.ha_nb_settings && JSON.parse(S.ls.ha_nb_settings).kidq.reviewCap === 4, "the device's copy (ha_nb_settings) follows, like every notebook setting"); }

console.log("the look");
{ const ns = settings(); ns.kidq.looksAllowed = { space: true, farm: true };
  const S = sandbox({ ns }); S.nbCopyOpen("kidq", "kidp"); S.nbCopyDo("kidq");
  ok(!S.writes.some((w) => /notebookTheme|looksAllowed/.test(w[1])) && S.notebookSettings.kidq.notebookTheme === "dino", "both kids allow the same looks: still not — each kid's own pick stays theirs"); }
{ const ns = settings(); ns.kidp.looksAllowed = { space: true }; ns.kidq.looksAllowed = { space: true, farm: true };
  const S = sandbox({ ns }); S.nbCopyOpen("kidq", "kidp"); S.nbCopyDo("kidq");
  ok(S.writes.some((w) => w[1] === "notebookSettings/kidq/notebookTheme" && w[2] === "space") && S.writes.some((w) => w[0] === "remove" && w[1] === "notebookSettings/kidq/looksAllowed/farm"),
    "Pia's look is Mom's choice (1 tick) and Quin's 2 ticks become 1 → Quin's look follows (Mom picks for him again)"); }
{ const ns = settings(); delete ns.kidp.looksAllowed;
  const S = sandbox({ ns }); S.nbCopyOpen("kidq", "kidp"); S.nbCopyDo("kidq");
  ok(S.writes.some((w) => w[1] === "notebookSettings/kidq/notebookTheme" && w[2] === "space"), "Mom chose Pia's look (no ticks) → it copies"); }

console.log("Pia → El (a 4th grader): only what El's notebook offers");
{ const S = sandbox(); S.nbCopyOpen("ellis", "kidp"); const plan = S.nbCopyPlan("kidp", "ellis"); S.nbCopyDo("ellis");
  const paths = S.writes.map((w) => w[1].replace("notebookSettings/ellis/", ""));
  ok(paths.indexOf("gradeOverride") >= 0 && paths.indexOf("nbMode") >= 0 && paths.indexOf("unitDays/u1") >= 0 && paths.indexOf("ladders/reading/on") >= 0, "grade, printed/tablet, shared unit days, ladders copy", paths.join(","));
  ok(!paths.some((p) => /^(nbLevel|countPic|looksAllowed|notebookTheme|reviewCap)/.test(p)) && !paths.some((p) => /extraPages\/(abc|thisMonth|daysSeasons)/.test(p)), "no Pre-K switch, counting picture, look, ticks, review slots or Pre-K page — El's notebook has none of them");
  ok(plan.length === S.writes.length, "the list shown = the writes made"); }

console.log("guards");
{ const S = sandbox({ dry: true }); S.nbCopyOpen("kidq", "kidp"); const n = S.nbCopyDo("kidq");
  ok(n === WANT.length && S.writes.length === 0, "?dryrun=1: nothing written to the database"); }
{ const S = sandbox({ mom: false }); const before = snap(S); S.nbCopyOpen("kidq", "kidp"); S.__("_nbcCopy={kid:'kidq',from:'kidp'}"); const n = S.nbCopyDo("kidq");
  ok(n === 0 && S.writes.length === 0 && snap(S) === before, "not a parent: Copy does nothing"); }
{ const S = sandbox(); S.nbCopyOpen("kidq", "kidp"); const n = S.nbCopyDo("kidz");
  ok(n === 0 && S.writes.length === 0, "Copy on another kid's card than the one the list was for does nothing"); }
{ const S = sandbox({ ns: { kidp: {}, kidq: {}, ellis: {}, kidz: {} } }); S.nbCopyOpen("kidq", "kidz");
  ok(S.nbCopyPlan("kidz", "kidq").length === 0 && /Already the same as Zed/.test(S.nbCopyPanelHtml("kidq")), "two kids with nothing set: already the same, nothing to copy"); }

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
