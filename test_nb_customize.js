// 🎛 NB_CUSTOM — one "Customize this notebook" card per kid on the Notebook tab (PLAN_notebook_looks_2026-11-23 §14, build
// step 4; her answer 2026-11-24 to question 12: "Yes, one card"). Run: node test_nb_customize.js
//   • the REAL renderNotebook + the real card functions run in a sandbox for a Pre-K, 1st, 4th and 6th-grade kid and a kid with
//     nothing set: folded = the top line only (Grade · Look · Printed/Tablet); open = the four dials; every control exactly once
//     on the whole tab, and none of them outside the card
//   • every button in the card still calls its own handler, which writes the same one path it always did
//   • a kid's notebook is byte for byte the same: nothing the build reads was touched (call graph from haNbContext and the print
//     entry points), and the real haNbContext + notebooks.js give the same notebook before and after the card is drawn, opened,
//     folded — the open/folded state is this device's only and never written to the database
//   • Dad in parent mode sees the same card as Mom
const fs = require("fs"), path = require("path"), vm = require("vm");
const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const nbSrc = fs.readFileSync(path.join(__dirname, "notebooks.js"), "utf8");
let pass = 0, fail = 0;
function ok(c, name, d) { if (c) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name + (d !== undefined ? "  → " + String(d).slice(0, 300) : "")); } }
const count = (s, sub) => s.split(sub).length - 1;
const block = (n) => { const a = html.indexOf("// " + n + "_START"), b = html.indexOf("// " + n + "_END"); if (a < 0 || b < a) throw new Error("no block " + n); return html.slice(a, b); };
// a top-level function: its first line to its closing "}" at column 0 (a one-liner ends on its own line)
function fnSrc(name) {
  let a = html.indexOf("\nfunction " + name + "("); if (a < 0) a = html.indexOf("\nasync function " + name + "(");
  if (a < 0) throw new Error("no function " + name);
  const lines = html.slice(a + 1).split("\n"), out = [lines[0]];
  if (!/\{\s*$/.test(lines[0]) && /\}\s*(\/\/.*)?$/.test(lines[0])) return out[0];
  for (let i = 1; i < lines.length; i++) { const l = lines[i]; if (/^[^\s}]/.test(l)) break; out.push(l); if (/^\}/.test(l)) break; }
  return out.join("\n");
}

// ── the block ───────────────────────────────────────────────────────────────
console.log("the block");
const CUST = block("NB_CUSTOM");
ok(count(html, "// NB_CUSTOM_START") === 1 && count(html, "// NB_CUSTOM_END") === 1, "index.html: one NB_CUSTOM block");
const code = CUST.split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n").replace(/   \/\/ .*$/gm, "");   // code only: no comment lines, no trailing comments
ok(!/db\.ref|firebase|\.set\(|\.update\(|\.remove\(/.test(code), "the block writes nothing to the database");
ok(!/\b(julian|lincoln|ellis|lucy|caleb|kenzie|david|howe|dewalt|burris)\b/i.test(code), "no child's or family's name in the block");
ok(!/\b(he|his|him|she|her)\b/.test((code.match(/'[^']*'/g) || []).join(" ").replace(/<[^>]*>/g, " ")), "no he/his/she/her in its words");
ok(html.indexOf("\u{1F500}") < 0, "no 🔀 in index.html");
ok(/HA_LS\.setItem\("ha_nbcust_open"/.test(code) && count(code, "ha_nbcust_open") === 2 && count(html, "ha_nbcust_open") === count(CUST, "ha_nbcust_open"), "open/folded is kept on this device only (HA_LS ha_nbcust_open)");
ok(count(html, "nbCustomCardHtml(") === 2 && /nbCustomCardHtml\(sel,\{look:lookParts,xp:xpHtml,review:reviewHtml,dg:dgHtml\}\)\+/.test(fnSrc("renderNotebook")), "drawn once, in the kid's card on the Notebook tab");
ok(/function nbCustomCardHtml\(kid,p\)\{\n  if\(!momHere\(\)\) return "";/.test(CUST) && !/_kioskD|dadUnlocked|momModeActive|adminPinUnlocked/.test(code), "Mom-gated through momHere() only — no Mom-vs-Dad check");

// ── the sandbox: the real tab ───────────────────────────────────────────────
const NBW = {}; new Function("window", nbSrc)(NBW); const NB = NBW.HoweNotebooks;
const FNS = ["momHere", "esc", "utsJ", "nbReviewCap", "nbXpCfg", "nbXpSave", "nbXpToggle", "nbXpDay", "nbDgDefaultBook", "nbDgCfg", "nbDgSave", "nbDgToggle",
  "nbDgWeekLen", "nbDgTotal", "nbDgStartFor", "nbDgSetStart", "nbDgStep", "nbUnitDays", "nbUnitDayToggle", "nbSetReviewCap", "haKidUnits", "stEnroll",
  "nbtMode", "nbtSetMode", "nbtBuilt", "nbtTabHtml", "nbtSegHtml", "renderNotebook", "_nbMomLockHtml", "nbSelectKid"];
const BLOCKS = ["NB_LOOKPICK", "PREKLEVEL_WIRE", "NBLEVEL", "NBLADDER", "NBNAME", "NB_COUNTPIC", "NBNEEDS", "NB_CUSTOM"];
const SRC = BLOCKS.map(block).join("\n") + "\n" + FNS.map(fnSrc).join("\n") + "\n" + fnSrc("haNbContext") + "\n" + fnSrc("nbLevelCtx");
const NAMES = { kidp: "Pia", lucy: "Lu", ellis: "El", lincoln: "Li", kidz: "Zed" };
const KIDS = ["kidp", "lucy", "ellis", "lincoln", "kidz"];
function settings() {
  return {
    kidp: { notebookTheme: "dino", nbLevel: { nbTeens: true }, extraPages: { abc: { on: false } } },   // Pre-K
    lucy: { reviewCap: 3 },                                                                            // 1st
    ellis: {},                                                                                         // 4th
    lincoln: { gradeOverride: "6", dailyGrams: { on: true }, unitDays: { u1: { tuesday: true } } },    // 6th
    kidz: {}                                                                                           // nothing set
  };
}
function sandbox(o) {
  o = o || {};
  const writes = [], ls = {}, els = {};
  const content = { innerHTML: "" };
  const ctx = {
    window: { HoweNotebooks: NB }, console, Promise, setTimeout, JSON, Object, Array, String, Math, Date, parseInt, isNaN,
    notebookSettings: o.ns || settings(), momModeActive: o.mom !== false && !o.dad, adminPinUnlocked: !!o.dad, tab: "notebook", WK: "week30",
    HA_LS: { getItem: (k) => (k in ls ? ls[k] : null), setItem: (k, v) => { ls[k] = String(v); }, removeItem: (k) => { delete ls[k]; } },
    db: { ref: (p) => ({ set: (v) => writes.push(["set", p, v]), remove: () => writes.push(["remove", p]), update: (v) => writes.push(["update", p, v]) }) },
    _dryRun: () => !!o.dry,
    document: { getElementById: (id) => (id === "content" ? content : (els[id] || null)) },
    ROSTER_DEF: [{ id: "kidp", name: "Pia", grade: "PreK" }, { id: "lucy", name: "Lu", grade: "1" }, { id: "ellis", name: "El", grade: "4" }, { id: "lincoln", name: "Li", grade: "5" }, { id: "kidz", name: "Zed" }],
    NB_KIDS: KIDS.map((k) => ({ k, label: NAMES[k] + " (" + (k === "kidp" ? "Pre-K" : k === "lucy" ? "1st" : k === "ellis" ? "4th" : k === "lincoln" ? "5th" : "starter notebook") + ")", aam: k !== "kidp" && k !== "kidz" })),
    nbSelectedKid: o.kid || "kidp", isPreK: (k) => k === "kidp", cap: (k) => NAMES[k] || k, KID_NAME: NAMES, KID_COLOR: {},
    haLoadNotebooksLib: () => Promise.resolve(NB), nbProbeNextWeek: () => {}, nbTargetWk: () => "week30", nbTargetWkNum: () => 30, nbDgPrefetch: () => Promise.resolve(),
    notebookPersonal: {}, haGetKey: () => "", mastAIKey: "", notebookStories: {}, NB_ACT_CATS: [], nbActivities: {}, nbActCurUrl: () => null,
    masteryFromApp: () => ({}), masteryData: { history: {} }, nbPlanCardHtml: () => "", nbChkLineHTML: () => "", NB_WB_KIDS: { lincoln: 1, ellis: 1 },
    notebookBooks: { dg5: { kid: "lincoln", title: "Daily Grams", days: 180 } }, nbWeekOverride: null, nbNextWeek: null,
    DAY_DT: { monday: "Nov 9", tuesday: "Nov 10", wednesday: "Nov 11", thursday: "Nov 12", friday: "Nov 13" }, DAYS: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    weekData: { tasks: [] }, HA_IS_HOWE: false, nbtWhen: () => "today",
    nbWbCardHTML: () => "<!--wb-->", nbCqCardHTML: () => "<!--cq-->", nbQbCardHTML: () => "<!--qb-->", nbCvCardHTML: () => "<!--cv-->", renderUnitPages: () => "<!--unit cards-->",
    unitStudies: { u1: { id: "u1", title: "Sharks", emoji: "🦈", enrolled: { lincoln: true, ellis: true }, cardLessons: true, kidStage: { lincoln: { nbWords: "all" } } },
                   u2: { id: "u2", title: "Rocks", emoji: "🪨", enrolled: { ellis: true }, nbInsert: false } },
    haPrevWeekSummary: () => null, haPaceRows: () => null, haBuildUnitInsight: (k, u) => ({ id: u.id, title: u.title }), nbJuPicks: () => null,
    luWordsCursorOf: () => null, nbDgCtx: () => null, renderAll() {}, showTab() {}, openUnit() {}
  };
  vm.createContext(ctx);
  vm.runInContext(SRC + "\n;this.__=function(c){return eval(c)};", ctx);
  ctx.writes = writes; ctx.ls = ls; ctx.els = els; ctx.content = content;
  ctx.draw = (kid) => { if (kid) ctx.nbSelectedKid = kid; ctx.__("nbSelectedKid=" + JSON.stringify(ctx.nbSelectedKid)); ctx.renderNotebook(content); return content.innerHTML; };
  return ctx;
}
const cardOf = (h) => { const a = h.indexOf('<div id="nbcustom-card"'); if (a < 0) return ""; let d = 0, i = a; const re = /<div\b|<\/div>/g; re.lastIndex = a; let m; while ((m = re.exec(h))) { d += m[0] === "</div>" ? -1 : 1; if (d === 0) return h.slice(a, m.index + 6); } return h.slice(a); };
const outside = (h) => { const c = cardOf(h); return c ? h.replace(c, "") : h; };

// what each control looks like in the HTML (its handler call), and the ONE path its handler writes
const CONTROLS = {
  grade: { re: (k) => "nbSetGradeOverride('" + k + "',this.value)" },
  paper: { re: (k) => "nbtSetMode('" + k + "','print')" }, tablet: { re: (k) => "nbtSetMode('" + k + "','tablet')" },
  open: { re: (k) => "nbCustomToggle('" + k + "')" },
  levelSw: { re: (k) => "nbSetLevel('" + k + "','" }, extra: { re: (k) => "nbXpToggle('" + k + "','" }, ladders: { re: () => 'id="nbladder-card"' },
  needs: { re: () => 'id="nbneeds-card"' }, review: { re: (k) => "nbSetReviewCap('" + k + "',1)" },
  units: { re: () => "showTab('units');openUnit('" }, dg: { re: (k) => "nbDgToggle('" + k + "')" },
  name: { re: (k) => 'id="nbname-' + k + '"' }, countPic: { re: (k) => "nbSetCountPic('" + k + "','animal')" }, ticks: { re: () => 'id="nblookpick-ticks"' }
};
const DIAL_KEYS = ["levelSw", "extra", "ladders", "needs", "review", "units", "dg", "name", "countPic", "ticks"];

// ── folded: the top line only ───────────────────────────────────────────────
console.log("folded — the one-minute setup");
const WANT = {   // which dial controls each kid's notebook has (open)
  kidp: { levelSw: 5, extra: 3, ladders: 1, needs: 1, review: 1, units: 0, dg: 0, name: 1, countPic: 1, ticks: 1 },
  lucy: { levelSw: 0, extra: 4, ladders: 1, needs: 1, review: 1, units: 0, dg: 0, name: 0, countPic: 0, ticks: 0 },
  ellis: { levelSw: 0, extra: 4, ladders: 1, needs: 1, review: 0, units: 2, dg: 0, name: 0, countPic: 0, ticks: 0 },
  lincoln: { levelSw: 0, extra: 5, ladders: 1, needs: 1, review: 0, units: 2, dg: 1, name: 0, countPic: 0, ticks: 0 },
  kidz: { levelSw: 0, extra: 0, ladders: 1, needs: 1, review: 0, units: 0, dg: 0, name: 0, countPic: 0, ticks: 0 }
};
const GRADEW = { kidp: "Pre-K", lucy: "1st grade", ellis: "4th grade", lincoln: "6th grade", kidz: "" };
for (const k of KIDS) {
  const S = sandbox({ kid: k }), page = S.draw(k), card = cardOf(page);
  const tag = k + " (" + (GRADEW[k] || "nothing set") + ")";
  ok(card.length > 300 && count(page, 'id="nbcustom-card"') === 1, tag + ": one Customize card");
  ok(["grade", "paper", "tablet", "open"].every((c) => count(page, CONTROLS[c].re(k)) === 1 && count(card, CONTROLS[c].re(k)) === 1), tag + ": Grade, Printed, On the tablet and ▸ Customize — each once, in the card");
  const looks = NB.notebookOptions(k, { isPreK: k === "kidp", notebookTheme: S.notebookSettings[k].notebookTheme || null, nbLevel: {} }).looks;
  ok(looks.every((l) => count(page, "nbSetLook('" + k + "','" + l.key + "')") === 1 && count(card, "nbSetLook('" + k + "','" + l.key + "')") === 1), tag + ": each look's button once, on the top line (" + looks.length + ")");
  ok(DIAL_KEYS.every((c) => count(page, CONTROLS[c].re(k)) === 0), tag + ": folded — no dial control anywhere on the tab");
  ok(card.indexOf(GRADEW[k] ? (k === "kidz" ? "" : " for " + GRADEW[k]) : "the usual.") > 0, tag + ": the line names the grade", card.match(/(Everything else is the usual[^<]*|Changed from the usual[^:]*)/)?.[0]);
  ok(/aria-expanded="false"[^>]*>▸ Customize</.test(card), tag + ": ▸ Customize, folded");
}
{ const S = sandbox({ ns: { kidz: {} } }), card = cardOf(S.draw("kidz"));
  ok(card.indexOf("Everything else is the usual.") > 0 && card.indexOf("Changed from") < 0 && card.indexOf('title="Not the usual"') < 0, "a kid with nothing set: “Everything else is the usual.”, no dots"); }
{ const S = sandbox(), card = cardOf(S.draw("ellis"));
  ok(card.indexOf("Everything else is the usual for 4th grade.") > 0, "a 4th grader with nothing changed: “Everything else is the usual for 4th grade.”"); }
{ const S = sandbox(), card = cardOf(S.draw("kidp"));
  ok(card.indexOf("Changed from the usual for Pre-K: <b") > 0 && /📏 Level · 🎨 Look/.test(card) === false && /📏 Level<\/b>/.test(card), "Pre-K kid with a switch and a page changed: “Changed from the usual for Pre-K: 📏 Level”", card.match(/Changed from[^]*?<\/b>/)?.[0]); }

// ── open: the four dials, every control exactly once ────────────────────────
console.log("open — the four dials");
for (const k of KIDS) {
  const S = sandbox({ kid: k }); S.draw(k); S.nbCustomToggle(k); const page = S.content.innerHTML, card = cardOf(page), out = outside(page);
  const tag = k + " (" + (GRADEW[k] || "nothing set") + ")";
  ok(/aria-expanded="true"[^>]*>▾ Customize</.test(card) && ["level", "struggles", "units", "look"].every((d) => count(card, 'id="nbc-' + d + '"') === 1), tag + ": ▾ Customize shows 📏 Level · 🔁 Struggles · 🧩 Units · 🎨 Look");
  const got = {}; DIAL_KEYS.forEach((c) => { got[c] = count(page, CONTROLS[c].re(k)); });
  ok(DIAL_KEYS.every((c) => got[c] === WANT[k][c]), tag + ": each dial control the expected number of times", JSON.stringify(got));
  ok(DIAL_KEYS.concat(["grade", "paper", "tablet"]).every((c) => count(out, CONTROLS[c].re(k)) === 0) && count(out, "nbSetLook(") === 0 && count(out, "nbLookAllow(") === 0, tag + ": none of them outside the card");
  ok(["grade", "paper", "tablet", "open"].every((c) => count(page, CONTROLS[c].re(k)) === 1), tag + ": the top line is still the only home of Grade, Printed / On the tablet");
  // the dial each control sits in
  const dial = (d) => { const a = card.indexOf('id="nbc-' + d + '"'), nx = ["level", "struggles", "units", "look"].map((x) => card.indexOf('id="nbc-' + x + '"')).filter((i) => i > a); return card.slice(a, nx.length ? Math.min(...nx) : card.length); };
  const IN = { level: ["levelSw", "extra", "ladders"], struggles: ["needs", "review"], units: ["units", "dg"], look: ["name", "countPic", "ticks"] };
  ok(Object.keys(IN).every((d) => IN[d].every((c) => count(dial(d), CONTROLS[c].re(k)) === WANT[k][c])), tag + ": Level = switches, extra pages, ladders · Struggles = trouble + review · Units = units + Daily Grams · Look = name, counting picture, ticks");
}
{ const S = sandbox(); S.draw("ellis"); S.nbCustomToggle("ellis"); const u = cardOf(S.content.innerHTML);
  ok(/🦈 Sharks<\/b> <span style="color:var\(--muted\)">— pages print<\/span>/.test(u) && /🪨 Rocks<\/b> <span style="color:var\(--muted\)">— no pages in the notebook/.test(u), "🧩 Units: a line per unit — pages print / no pages — read-only", u.match(/Sharks[^]{0,120}/)?.[0]);
  ok(count(u, "showTab('units');openUnit('u1')") === 1 && count(u, "showTab('units');openUnit('u2')") === 1, "…each with its jump to Units");
  ok(!/nbUnitDayToggle|nbInsert|onchange/.test(u.slice(u.indexOf('id="nbc-units"'), u.indexOf('id="nbc-look"'))), "…and no unit control of its own (on/off and the 📌 days keep their homes)"); }
{ const S = sandbox(); S.draw("lincoln"); S.nbCustomToggle("lincoln"); const u = cardOf(S.content.innerHTML);
  ok(/Sharks<\/b> <span style="color:var\(--muted\)">— pages print · 📌 Tue<\/span>/.test(u) && /📝 <b>Spelling page<\/b> <span style="color:var\(--muted\)">— This Week’s Words<\/span>/.test(u), "🧩 Units: the 📌 days and the spelling page, read from where they're set"); }

// ── who sees it ─────────────────────────────────────────────────────────────
console.log("who sees it");
for (const k of KIDS) {
  const mom = sandbox({ kid: k }), dad = sandbox({ kid: k, dad: true });
  [mom, dad].forEach((s) => { s.draw(k); s.nbCustomToggle(k); });
  ok(cardOf(mom.content.innerHTML) === cardOf(dad.content.innerHTML) && cardOf(dad.content.innerHTML).length > 500, k + ": Dad in parent mode sees the same card, open, as Mom");
}
{ const S = sandbox({ mom: false }); const page = S.draw("kidp");
  ok(page.indexOf("nbcustom-card") < 0 && ["nbSetGradeOverride(", "nbtSetMode(", "nbSetLook(", "nbCustomToggle("].every((s) => page.indexOf(s) < 0), "not a parent (a kid's device): no card, no control — as before"); }

// ── handlers: same handler, same one path ───────────────────────────────────
console.log("every button calls its own handler, which writes the path it always did");
function clicks(h) { const out = []; const re = /on(?:click|change)="([^"]+)"/g; let m; while ((m = re.exec(h))) out.push(m[1].replace(/&quot;/g, '"').replace(/&#39;/g, "'")); return out; }
const PATHS = [
  [/^nbSetGradeOverride\('(\w+)'/, (k) => ["notebookSettings/" + k + "/gradeOverride"]], [/^nbSetLook\('(\w+)'/, (k) => ["notebookSettings/" + k + "/notebookTheme"]],
  [/^nbtSetMode\('(\w+)'/, (k) => ["notebookSettings/" + k + "/nbMode"]], [/^nbSetLevel\('(\w+)','(\w+)'/, (k, x) => ["notebookSettings/" + k + "/nbLevel/" + x]],
  [/^nbXpToggle\('(\w+)','(\w+)'/, (k, x) => ["notebookSettings/" + k + "/extraPages/" + x]], [/^nbXpDay\('(\w+)','(\w+)'/, (k, x) => ["notebookSettings/" + k + "/extraPages/" + x]],
  [/^nbSetReviewCap\('(\w+)'/, (k) => ["notebookSettings/" + k + "/reviewCap"]], [/^nbDgToggle\('(\w+)'/, (k) => ["notebookSettings/" + k + "/dailyGrams/on"]],
  [/^nbDgSetStart\('(\w+)'/, (k) => ["notebookSettings/" + k + "/dailyGrams/cursor"]], [/^nbDgStep\('(\w+)'/, (k) => ["notebookSettings/" + k + "/dailyGrams/cursor"]],
  [/^nbLookAllow\('(\w+)','(\w+)'/, (k, x) => ["notebookSettings/" + k + "/looksAllowed/" + x]], [/^nbSetCountPic\('(\w+)'/, (k) => ["notebookSettings/" + k + "/countPic"]],
  [/^nbSaveName\('(\w+)'/, (k) => ["notebookSettings/" + k + "/notebookName"]], [/^nbClearName\('(\w+)'/, (k) => ["notebookSettings/" + k + "/notebookName"]],
  [/^nbLadderSetOn\('(\w+)','(\w+)'/, (k, x) => ["notebookSettings/" + k + "/ladders/" + x + "/on"]],
  [/^nbCustomToggle\(/, () => []], [/^showTab\('units'\)/, () => []], [/^\(function\(\)\{var e=document\.getElementById\('nbrev-card'\)/, () => []], [/^nbLadder(Placement|Retry|Toggle)/, () => []], [/^nbLadder/, null]
];
let tried = 0, bad = [], unknown = new Set(), seen = new Set();
for (const k of KIDS) {
  const S0 = sandbox({ kid: k }); S0.draw(k); S0.nbCustomToggle(k);
  const cl = clicks(cardOf(S0.content.innerHTML));
  for (const c of cl) {
    const rule = PATHS.find(([re]) => re.test(c)); if (!rule) { unknown.add(c.slice(0, 40)); continue; }
    if (!rule[1]) continue;   // a ladder control the row draws (its own test: test_nb_ladder.js)
    const S = sandbox({ kid: k }); S.draw(k); S.writes.length = 0;
    S.els["nbname-" + k] = { value: "Bea" };
    try { S.__(c.replace("this.value", c.indexOf("nbSetGradeOverride") === 0 ? "'3'" : "'12'").replace(/this\.open/, "true")); } catch (e) { bad.push(c.slice(0, 50) + " threw " + e.message); continue; }
    const m = c.match(rule[0]), want = rule[1](...m.slice(1)), got = S.writes.map((w) => w[1]);
    tried++; seen.add(c.split("(")[0]);
    if (JSON.stringify(got) !== JSON.stringify(want)) bad.push(c.slice(0, 60) + " → " + JSON.stringify(got) + " (want " + JSON.stringify(want) + ")");
  }
}
ok(unknown.size === 0, "every button in the card is a known control", [...unknown].join(" | "));
ok(bad.length === 0 && tried > 60, "each one writes exactly its own one path, under notebookSettings/<kid>/ (" + tried + " buttons tried)", bad.slice(0, 4).join(" ; "));
ok(["nbSetGradeOverride", "nbSetLook", "nbtSetMode", "nbSetLevel", "nbXpToggle", "nbXpDay", "nbSetReviewCap", "nbDgToggle", "nbLookAllow", "nbSetCountPic", "nbSaveName"].every((f) => seen.has(f)),
  "…covering Grade, Look, Printed/Tablet, level switches, extra pages + days, review slots, Daily Grams, the ticks, the counting picture, the name", [...seen].join(","));
{ const S = sandbox({ kid: "kidp" }); S.draw("kidp"); S.writes.length = 0; S.nbCustomToggle("kidp"); S.nbCustomToggle("kidp"); S.nbCustomToggle("kidp");
  ok(S.writes.length === 0 && S.ls.ha_nbcust_open === '{"kidp":true}' && Object.keys(S.ls).length === 1, "▸ Customize writes nothing to the database — only this device's ha_nbcust_open"); }
{ const S = sandbox({ kid: "kidp", dry: true }); S.draw("kidp"); S.nbCustomToggle("kidp");
  clicks(cardOf(S.content.innerHTML)).filter((c) => /^nb(SetGradeOverride|SetLook|tSetMode|SetLevel|LookAllow|SetCountPic)\(/.test(c)).forEach((c) => S.__(c.replace("this.value", "'3'")));
  ok(S.writes.length === 0, "?dryrun=1: the card's own controls write nothing (their handlers' guards are unchanged)"); }
{ const S = sandbox({ kid: "kidp", ns: Object.assign(settings(), { kidp: { notebookTheme: "dino", looksAllowed: { dino: true, shark: true } } }) });
  const card = cardOf(S.draw("kidp"));
  ok(card.indexOf('id="nblookpick-chose"') > 0 && count(card, "nbSetLook(") === 0 && card.indexOf("Pia chose ") > 0, "2+ looks ticked: the top line's Look is the read-only “Pia chose …” line, no look buttons");
  S.nbCustomToggle("kidp"); const open = cardOf(S.content.innerHTML);
  ok(count(open, 'id="nblookpick-chose"') === 1 && count(open, "nbSetLook(") === 0 && count(open, "nbLookAllow('kidp','") === NB.notebookOptions("kidp", { isPreK: true, notebookTheme: "dino" }).looks.filter((l) => l.key).length,
    "…opened: still one read-only line, and the tick list in 🎨 Look"); }

// ── the notebook a kid gets is byte for byte the same ───────────────────────
console.log("nothing a notebook prints changes");
// (1) nothing the build reaches was touched: walk the call graph from the build and print entry points
const CHANGED = ["renderNotebook", "nbLevelCardHtml", "nbtTabHtml", "nbtSegHtml", "nbLookPickRow", "nbCustomOpen", "nbCustomToggle", "nbCustomDots", "nbCustomUnitsHtml", "nbCustomCardHtml"];
const DECL = {}; html.replace(/\n(?:async )?function ([A-Za-z_$][\w$]*)\(/g, (m, n) => { DECL[n] = 1; return m; });
// a screen repaint a build may ask for afterwards (renderNotebook / renderAll …, nbLadderRepaint) only paints — it isn't walked
const PAINT = (n) => /^render[A-Z]|^renderAll|Repaint$|Soon$|^showTab$/.test(n);
const seenFn = new Set(), queue = ["haNbContext", "haNbOpen", "haNbPdf", "nbtSend"], painted = new Set();
while (queue.length) {
  const n = queue.shift(); if (seenFn.has(n) || painted.has(n)) continue; if (PAINT(n)) { painted.add(n); continue; } seenFn.add(n);
  let body; try { body = fnSrc(n); } catch (e) { continue; }
  const calls = new Set((body.replace(/^\s*\/\/.*$/gm, "").match(/[A-Za-z_$][\w$]*(?=\s*\()/g) || []).filter((x) => DECL[x] && x !== n));
  calls.forEach((x) => { if (!seenFn.has(x)) queue.push(x); });
}
const hit = CHANGED.filter((n) => seenFn.has(n));
ok(seenFn.size > 40 && hit.length === 0, "no function this change touched is reachable from the notebook build or a print / tablet send (" + seenFn.size + " functions walked; repaints not followed: " + [...painted].join(", ") + ")", hit.join(","));
ok(nbSrc.indexOf("NB_CUSTOM") < 0 && fnSrc("haNbContext").indexOf("nbCustom") < 0, "notebooks.js and haNbContext know nothing of the card");
// (2) the real haNbContext + notebooks.js: the same notebook before and after the card is drawn, opened and folded
const fixed = (c) => Object.assign(c, { prevSummary: null, prevStats: null, pace: null });
let same = 0, total = 0;
for (const k of KIDS) for (const ns of [settings(), {}]) {
  const S = sandbox({ kid: k, ns: JSON.parse(JSON.stringify(ns)) });
  const before = NB.generate(k, fixed(S.haNbContext(k)));
  S.draw(k); S.nbCustomToggle(k); S.draw(k); S.nbCustomToggle(k); S.draw(k);
  const after = NB.generate(k, fixed(S.haNbContext(k)));
  total++; if (before.student === after.student && before.parent === after.parent && before.student.length > 1000) same++;
}
ok(same === total && total === 10, "each kid's notebook + parent guide, every setting set and none: byte for byte the same after drawing, opening and folding the card (" + same + "/" + total + ")");

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
