// 🗳 United States Path — slice 5 USCIVTEST: Stage 10, the citizen's test (PLAN_us_unit_2026-11-16.md §5 Stage 10, §8 Q6, §9 row 5,
// Appendix H, R4, R9; her go 2026-11-17 via the hub). Runs the real STARTER_UNITS block (USPATH + USPRES + USHIST + USCIVTEST +
// UNITATTACH + UNIT_STAGES + STARTERUP) with the real us.js, us_pics_1.js, us_pics_2.js and geo.js, and the real judging / study
// functions the deck's "no typing" hooks sit in. Fixture kids are made up (no family's names):
//  · the code ships Stages 1–10 at version 4: 370 cards in 11 decks; Stage 10 = Civics Test, flip, 3 at a time, 124 cards, ready at 110;
//  · ★ questions first (19 — ★61 is a "your state" one), then USCIS's sections; the four officeholder answers say "as of November 2026";
//  · no Civics Test front is a built-in back's key, a math fact, a Geography card, another starter's card or another US card;
//  · a kid not on the path can start at Stage 10 from "+ Kid" (★ first, 124 in the bank, the backs saved); a kid on Stage 9 gets ➡ 10;
//  · STARTERUP: a family on version 3 gets "＋ Add the new stages" = the Civics Test deck and Stage 10 (124 cards), nothing else;
//  · typed judging is off for the deck only: GAMEJUDGE's "type" becomes "pick", the study Type it step and Type the answer face skip it.
const fs = require("fs"), path = require("path"), vm = require("vm");
const rd = f => fs.readFileSync(path.join(__dirname, f), "utf8");
const src = rd("index.html"), usSrc = rd("us.js"), p1Src = rd("us_pics_1.js"), p2Src = rd("us_pics_2.js"), geoSrc = rd("geo.js");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 600) : "")); } };
const a = src.indexOf("// STARTER_UNITS_START"), b = src.indexOf("// STARTER_UNITS_END");
const c0 = src.indexOf("// USCIVTEST_START"), c1 = src.indexOf("// USCIVTEST_END");
ok("USCIVTEST block once, right after USHIST_END, inside the STARTER_UNITS block", c0 === src.indexOf("// USHIST_END") + "// USHIST_END\n".length && c1 > c0 && c1 < b && src.indexOf("// USCIVTEST_START", c0 + 1) < 0);
const block = src.slice(a, b);
const fnSrc = n => { const i = src.indexOf("function " + n + "("); if (i < 0) throw new Error("missing " + n); let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } };
const GATE = ["mastGateChapter", "mastDefKeyOk", "mastFullBank", "mastBankEligible", "haKeyOk", "haKey", "mastGetDef"].map(fnSrc).join("\n");
const VOCAB = src.slice(src.indexOf("const MAST_VOCAB_DEFS={"), src.indexOf('if(typeof _wrSlashDefs==="function") Object.assign(MAST_VOCAB_DEFS'));
const VOCAB_GEO = (() => { const s = src.indexOf('if(typeof geoVocabDefs==="function")'); return src.slice(s, src.indexOf("\n", s)); })();
const MATH = src.slice(src.indexOf("const MAST_MATH_ANS={"), src.indexOf("};", src.indexOf("const MAST_MATH_ANS={")) + 2);
const CT = "Civics Test", UNIT = "us_path", NEW = "kidc", NINE = "kide";

function loadAll() { const win = {}, ctx = { window: win, module: undefined, console }; vm.createContext(ctx);
  vm.runInContext(geoSrc, ctx); vm.runInContext(p1Src, ctx); vm.runInContext(p2Src, ctx); vm.runInContext(usSrc, ctx); return win; }
const WIN = loadAll(), L = WIN.HoweUS;

function world(o) {
  o = o || {};
  const G = { writes: [], content: { innerHTML: "" }, mom: o.mom !== false, dry: !!o.dry, masteryData: {}, currData: { subjects: {}, done: {} }, unitStudies: {}, window: o.window || WIN, lazy: [], tab: "units" };
  const db = { ref(p) { return { update(v) { G.writes.push(["update", p || "", v]); return Promise.resolve(); }, set(v) { G.writes.push(["set", p, v]); return Promise.resolve(); },
    transaction(fn) { const v = fn(null); G.writes.push(["transaction", p, JSON.parse(JSON.stringify(v))]); return Promise.resolve({ committed: true }); } }; } };
  const w = new Function("G", "db", "BANKS", `
    const masteryData=G.masteryData, currData=G.currData; let unitStudies=G.unitStudies; const window=G.window; const tab=G.tab;
    function momHere(){ return G.mom; } function _dryRun(){ return G.dry; } function cap(s){ return s[0].toUpperCase()+s.slice(1); }
    function renderUnits(){} function _mastRe(){} const HA_LS={ setItem(){} }; const document={ getElementById:()=>G.content };
    function haLazyReady(name){ return !!window["_haLazy_"+name]; }
    function haLazyLoad(name){ G.lazy.push(name); return Promise.reject(new Error("no loader")); }
    let masteryKid="${NEW}"; const MAST_BANK_MAP=BANKS; ${VOCAB}
    ${MATH}
    ${GATE}
    ${block}
    ${VOCAB_GEO}
    return { STARTER_UNITS, STARTER_HOWTO, US_PATH_SHIP, US_PATH_STAGES, US_PATH_STAGE_CARDS, usUnitRecord, usHydrate, usNoTyped, US_NO_TYPE_DECKS, uaSpec,
      _unitStageRowsHtml, _starterUnitsHtml, unitStageStatus, unitStageMoveUp, unitStageFormOpen, unitStageFormSet, unitStageEnroll, mastFullBank, mastGetDef,
      MAST_VOCAB_DEFS, MAST_MATH_ANS, geoUnitRecord, suPending, suPlan };`)(G, db, { [NEW]: {}, [NINE]: {} });
  [NEW, NINE].forEach(k => { G.masteryData[k] = []; G.masteryData[k + "_custom_items"] = []; G.masteryData[k + "_settings"] = {}; });
  if (!o.noUnit) { const u = o.copy || w.STARTER_UNITS.us_path(); u.addedTs = 1; G.unitStudies[UNIT] = u; w.u = u; }
  w.G = G; return w;
}
const deck = (u, k) => u.decks.find(d => d.key === k);
const esc = x => String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

console.log("── what ships ──");
const w0 = world(), U = w0.u, CTd = deck(U, CT), Q = L.uscis.teach;
ok("version 4, Stages 1–10", w0.US_PATH_SHIP.ver === 4 && w0.US_PATH_SHIP.stages.join() === "1,2,3,4,5,6,7,8,9,10" && U.starterVer === 4);
{ const s = world({ window: {}, noUnit: true }).STARTER_UNITS.us_path();
  ok("the shell (before us.js): 10 stages, 370 cards", s._shell && s.stages.map(x => x.n).join() === "1,2,3,4,5,6,7,8,9,10" && s.cardCount === 370);
  ok("the shell's Stage 10 label, readyAt and count are us.js's", (st => st.label === "The citizen's test" && st.readyAt === 110)(w0.US_PATH_STAGES.find(x => x.n === 10)) &&
    w0.US_PATH_STAGES.find(x => x.n === 10).label === L.stages.find(x => x.n === 10).label && w0.US_PATH_STAGE_CARDS[10] === 124);
  ok("the Starter units list names Stage 10 and “370 cards”", /10\. The citizen(&#39;|')s test/.test(world({ window: {}, noUnit: true })._starterUnitsHtml()) && /370 cards/.test(world({ window: {}, noUnit: true })._starterUnitsHtml())); }
ok("the description names the citizen's test among what's here, not as 'later'", /citizen's test/.test(U.desc) && !/comes later/.test(U.desc));
{ const t = w0.STARTER_HOWTO[CT];
  ok("a How-to note for the deck, inside the 240-character box", t && t.main.length > 60 && t.main.length <= 240 && t.kid && t.kid.length < 60, t && t.main.length);
  const officers = CTd.cards.filter(c => L.card(CT, c.name).changes).map(c => c.def.split(" (")[0]);
  ok("…which gives no answer away (no officeholder's name, no back's text)", officers.every(n => t.main.indexOf(n) < 0 && t.kid.indexOf(n) < 0) && CTd.cards.every(c => c.def.length < 12 || t.main.indexOf(c.def) < 0)); }

console.log("── the Civics Test deck ──");
ok("eleven decks; the Civics Test is the last, flip, 3 at a time, 124 cards, all Stage 10", U.decks.length === 11 && U.decks[10].key === CT && CTd.mode === "flip" && CTd.introCap === 3 && CTd.cards.length === 124 && CTd.cards.every(c => c.stage === 10) &&
  U.decks.reduce((t, d) => t + d.cards.length, 0) === 370);
ok("Stage 10 is the Civics Test only, ready at 110", U.stages.find(s => s.n === 10).readyAt === 110 && U.decks.every(d => d.key === CT || d.cards.every(c => c.stage < 10)));
ok("124 = the 2025 list's 128 minus the four 'your state' questions (23, 29, 61, 62); 1–128 all accounted for", (() => { const qs = CTd.cards.map(c => Q[c.name].q); const all = qs.concat(Object.keys(L.uscis.local).map(Number)).sort((x, y) => x - y);
  return new Set(qs).size === 124 && all.length === 128 && all.every((q, i) => q === i + 1); })());
const STAR = [2, 7, 12, 20, 30, 36, 38, 39, 44, 52, 61, 66, 74, 78, 86, 94, 113, 115, 121, 126];   // USCIS M-1778 (09/25) ★, checked against uscis.gov 2026-11-17
ok("the ★ family is exactly USCIS's starred list (less ★61, a 'your state' one) and comes first", JSON.stringify(CTd.cards.filter(c => c.family === "The big twenty").map(c => Q[c.name].q)) === JSON.stringify(STAR.filter(q => q !== 61)) &&
  CTd.cards.slice(0, 19).every(c => c.family === "The big twenty"));
ok("then USCIS's sections, each in question order", [...new Set(CTd.cards.map(c => c.family))].join("|") === "The big twenty|Principles of American Government|System of Government|Rights and Responsibilities|Colonial Period and Independence|The 1800s|Recent American History|Symbols and Holidays" &&
  CTd.cards.slice(19).every((c, i, arr) => !i || Q[arr[i - 1].name].q < Q[c.name].q));
ok("every card has a back (the accepted answer or answers), none empty", CTd.cards.every(c => typeof c.def === "string" && c.def.trim().length > 0));
const CHANGES = { 30: "Mike Johnson", 38: "Donald Trump", 39: "JD Vance", 57: "John Roberts" };   // R4 — what to update when an officeholder changes
const chg = L.cards.filter(c => c.deck === CT && c.changes);
ok("the answers that follow an officeholder are flagged changes:true in us.js — Q30 Speaker, Q38 President, Q39 Vice President, Q57 Chief Justice", JSON.stringify(chg.map(c => Q[c.name].q).sort((x, y) => x - y)) === "[30,38,39,57]", chg.map(c => c.name));
ok("…each back names the officeholder (USCIS's test-updates answers) and says “as of November 2026”", chg.every(c => c.def.indexOf(CHANGES[Q[c.name].q]) === 0 && /\(as of November 2026/.test(c.def)), chg.map(c => c.def));
ok("…and no other Civics Test back says “as of”", L.cards.filter(c => c.deck === CT && !c.changes).every(c => !/as of /i.test(c.def)));
ok("the record carries only name, family, stage, order, def (the changes flag stays in us.js)", CTd.cards.every(c => Object.keys(c).every(k => ["name", "family", "stage", "order", "def"].includes(k))));
ok("the record holds no picture; the whole record is under 64 KB", !/data:|<svg|imageUrl/.test(JSON.stringify(U)) && JSON.stringify(U).length < 64000, JSON.stringify(U).length);
{ const u = JSON.parse(JSON.stringify(U)); w0.usHydrate(u, L);
  ok("no Civics Test card gets a picture (a picture would give the answer away); every other card still does", CTd.cards.every(c => !u.visuals[CT + "_" + c.name]) && Object.keys(u.visuals).length === 246); }

console.log("── no card can show another deck's answer ──");
{ const fronts = CTd.cards.map(c => c.name);
  ok("no Civics Test front is a built-in back's key (MAST_VOCAB_DEFS)", fronts.every(n => w0.MAST_VOCAB_DEFS[n.toLowerCase()] == null), fronts.filter(n => w0.MAST_VOCAB_DEFS[n.toLowerCase()] != null));
  ok("no Civics Test front is a math fact (MAST_MATH_ANS)", fronts.every(n => w0.MAST_MATH_ANS[n] == null));
  const geoNames = new Set(w0.geoUnitRecord("North Carolina").decks.flatMap(d => d.cards.map(c => c.name)));
  ok("no Civics Test front is a Geography Path card", fronts.every(n => !geoNames.has(n)));
  const others = Object.keys(w0.STARTER_UNITS).filter(id => id !== UNIT).flatMap(id => { try { const r = w0.STARTER_UNITS[id](); return (r.decks || []).flatMap(d => (d.cards || []).map(c => c.name)); } catch (e) { return []; } });
  ok("no Civics Test front is another starter unit's card", fronts.every(n => !others.includes(n)));
  const rest = U.decks.filter(d => d.key !== CT).flatMap(d => d.cards.map(c => c.name.toLowerCase()));
  ok("no Civics Test front is another deck's front in this unit; no front repeats in the unit", fronts.every(n => !rest.includes(n.toLowerCase())) && new Set(U.decks.flatMap(d => d.cards.map(c => c.name))).size === 370);
  ok("with nothing saved, a Civics Test card has no back from anywhere else", fronts.every(n => w0.mastGetDef(NEW, n, CT) === "")); }

console.log("── where a kid starts ──");
{ const w = world();
  w.unitStageFormOpen(UNIT, NEW); const form = w._unitStageRowsHtml(w.u, [NEW]);
  ok("“+ Kid” offers Stage 10 — an older kid starts the test straight away, from no stage at all", /<option value="10"[^>]*>10\. The citizen(&#39;|')s test<\/option>/.test(form));
  w.unitStageFormSet("stage", "10"); w.unitStageEnroll();
  const it = w.G.masteryData[NEW], st = w.G.masteryData[NEW + "_settings"], bank = w.mastFullBank(NEW)[CT] || [];
  ok("Stage 10: three ★ questions learning, nothing from another deck", it.length === 3 && it.every(i => i.subject === CT && i.status === "introduction") &&
    JSON.stringify(it.map(i => i.prompt)) === JSON.stringify(CTd.cards.slice(0, 3).map(c => c.name)), it.map(i => i.prompt));
  ok("all 124 questions in the bank, once each, in order", bank.length === 124 && new Set(bank).size === 124 && JSON.stringify(bank) === JSON.stringify(CTd.cards.map(c => c.name)));
  ok("the deck is flip, 3 at a time, and all 124 backs are saved as the kid's definitions", st.cat_modes[CT] === "flip" && st.cat_intro_max[CT] === 3 && CTd.cards.every(c => st.definitions[c.name] === c.def));
  ok("the kid's row: Stage 10, 0 of 124, ready at 110, no ➡ after it", (s => s.stage === 10 && s.total === 124 && s.need === 110 && !s.next)(w.unitStageStatus(w.u, NEW)));
  ok("every write is targeted (no whole-node set of mastery or the unit)", w.G.writes.every(x => x[0] !== "set" || !/^mastery\/[^/]+$|^unitStudies\/us_path$/.test(x[1])), w.G.writes.map(x => x[0] + " " + x[1]).slice(0, 8)); }
{ const w = world(); w.unitStageFormOpen(UNIT, NINE); w.unitStageFormSet("stage", "9"); w.unitStageEnroll();
  const it = w.G.masteryData[NINE]; it.forEach(i => { i.status = "active"; i.tier = "weekly"; });
  (w.G.masteryData[NINE + "_custom_items"] || []).forEach((c, i) => { if (!it.some(x => x.subject === c.cat && x.prompt === c.name)) it.push({ id: "n" + i, subject: c.cat, prompt: c.name, status: "active", tier: "weekly" }); });
  const s = w.unitStageStatus(w.u, NINE);
  ok("a kid on Stage 9: ➡ Start Stage 10: The citizen's test", s.ready && s.next.n === 10 && /➡ Start Stage 10: The citizen(&#39;|')s test/.test(w._unitStageRowsHtml(w.u, [NINE])));
  w.unitStageMoveUp(UNIT, NINE);
  ok("➡ Stage 10 seeds only the Civics Test (the ★ three)", w.G.masteryData[NINE].filter(i => i.status === "introduction").map(i => i.subject + ":" + i.prompt).join("|") === CTd.cards.slice(0, 3).map(c => CT + ":" + c.name).join("|") && w.unitStageStatus(w.u, NINE).stage === 10); }
{ const w = world({ dry: true }); w.unitStageFormOpen(UNIT, NEW); w.unitStageFormSet("stage", "10"); w.unitStageEnroll(); ok("dry run: the Stage 10 enroll writes nothing", w.G.writes.length === 0); }
{ const w = world({ mom: false }); w.unitStageFormOpen(UNIT, NEW); w.unitStageEnroll(); ok("not Mom: no form, nothing written", w.G.writes.length === 0); }

console.log("── STARTERUP: families already on the unit ──");
for (const [ver, ship, cards, stages] of [[3, { ver: 3, stages: [1, 2, 3, 4, 5, 6, 7, 8, 9] }, 124, 1], [2, { ver: 2, stages: [1, 2, 3, 4, 7] }, 242, 5], [1, { ver: 1, upTo: 4 }, 289, 6]]) {
  const w = world({ copy: world().usUnitRecord(null, ship) });
  w.u.enrolled = { [NEW]: true }; w.u.kidStage = { [NEW]: { stage: 4, knows: "", ts: 1 } };
  const pend = w.suPending(w.u);
  ok("version " + ver + " copy → “＋ Add the new stages”: " + cards + " new cards, " + stages + " new stage" + (stages > 1 ? "s" : ""), pend && pend.cards === cards && pend.stages === stages, pend);
  const P = w.suPlan(UNIT, 1), paths = P.writes.map(x => x.path);
  ok("version " + ver + ": the plan adds the Civics Test deck whole, Stage 10 and version 4 — no kid, no mastery, no picture", P.writes.some(x => /^unitStudies\/us_path\/decks\/\d+$/.test(x.path) && x.value.key === CT && x.value.cards.length === 124) &&
    P.writes.some(x => /^unitStudies\/us_path\/stages\/\d+$/.test(x.path) && x.value.n === 10 && x.value.readyAt === 110) && P.writes.some(x => x.path === "unitStudies/us_path/starterVer" && x.value === 4) &&
    paths.every(p => !/kidStage|enrolled|visuals|^mastery\//.test(p)), paths);
  if (ver === 3) ok("version 3: exactly three writes — decks/10, stages/9, starterVer", JSON.stringify(paths) === JSON.stringify(["unitStudies/us_path/decks/10", "unitStudies/us_path/stages/9", "unitStudies/us_path/starterVer"]), paths); }
{ const w = world(); ok("a family on version 4 sees no row", w.suPending(w.u) === null); }

console.log("── typed judging is off for the Civics Test only ──");
ok("usNoTyped: the Civics Test deck, a sitting card ({deck}) and a mastery item ({subject}) — and nothing else", w0.US_NO_TYPE_DECKS.join() === CT && w0.usNoTyped(CT) && w0.usNoTyped({ deck: CT }) && w0.usNoTyped({ subject: CT }) &&
  !w0.usNoTyped("Presidents") && !w0.usNoTyped({ deck: "German" }) && !w0.usNoTyped(null) && !w0.usNoTyped(undefined) && !w0.usNoTyped({}));
const NOTYPE = fnSrc("usNoTyped") + "\nconst US_NO_TYPE_DECKS=" + JSON.stringify(w0.US_NO_TYPE_DECKS) + ";";
{ // GAMEJUDGE — the real helper, sliced from the page
  const gsrc = src.slice(src.indexOf("const GJ_MODES="), src.indexOf("function _gjTurn("));
  const run = (mode, deckKey, withHook) => new Function("deckKey", "modeSet", `let masteryData={kidx_settings:{games:{judge:modeSet}}}; const _gdCanEdit=()=>false;
    ${withHook ? NOTYPE : ""}
    ${gsrc}
    const st={kid:"kidx"}, t={}; const on=gameJudgeAct(st,t,{kid:"kidx",deck:deckKey,right:"The Constitution",names:["The Bill of Rights","The Preamble","Congress"]});
    return { on, mode: t.gj && t.gj.mode };`)(deckKey, mode);
  ok("a kid on “Type it”: a Civics Test card is judged “Say it, then pick it”", (r => r.on && r.mode === "pick")(run("type", CT, true)));
  ok("…every other deck still types", (r => r.on && r.mode === "type")(run("type", "Presidents", true)) && run("type", "German", true).mode === "type");
  ok("…“Mom judges” and “pick” stay as she set them on the Civics Test", run("mom", CT, true).mode === "mom" && run("pick", CT, true).mode === "pick");
  ok("…and without USCIVTEST loaded the helper is as before (guarded)", run("type", CT, false).mode === "type"); }
{ // the study sitting's Type it step and the ⌨️ Type the answer face
  const MODES = src.slice(src.indexOf("const MST_PATTERN_MODES"), src.indexOf("\n", src.indexOf("const MST_PATTERN_MODES")));
  const S = new Function(`${NOTYPE}\n${MODES}\n${fnSrc("mstPatternClean")}\n${fnSrc("mstPatternFor")}\n${fnSrc("mstTypeAnsOn")}
    function mstIsRuleCard(){ return false; } function mstIsSpellCard(){ return false; } function mstCardPic(){ return null; } function mstCardDef(c){ return c.def; }
    function mstEnvTypeSess(){ return false; }
    return { mstPatternFor, mstTypeAnsOn, usNoTyped };`)();
  const civ = { deck: CT, name: CTd.cards[0].name, def: CTd.cards[0].def }, ger = { deck: "German", name: "der Hund", def: "the dog" };
  const sites = (src.match(/noType:c=>mstEnvNoType\(session,c\)\|\|\(typeof usNoTyped==="function"&&usNoTyped\(c\)\)/g) || []).length +
    (src.match(/const noType=c=>\(\(typeof mstEnvNoType==="function"\)&&mstEnvNoType\(session,c\)\)\|\|\(typeof usNoTyped==="function"&&usNoTyped\(c\)\);/g) || []).length;
  ok("both study noType rules (a new sitting and a resumed one) ask usNoTyped", sites === 2, sites);
  const pat = ["rec", "say", "type"], noType = c => S.usNoTyped(c);
  const pc = S.mstPatternFor(pat, civ, noType), pg = S.mstPatternFor(pat, ger, noType);
  ok("a pattern with a Type it day: the Civics Test card learns without it; a German card keeps it", JSON.stringify(pc) === '["rec","say"]' && JSON.stringify(pg) === JSON.stringify(pat), [pc, pg]);
  ok("⌨️ Type the answer on for the session: never for a Civics Test card, still for another deck's card", !S.mstTypeAnsOn({ typeAnswer: true }, civ) && S.mstTypeAnsOn({ typeAnswer: true }, ger)); }

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
