/*
 * Node tests — STARTERUP: ＋ Add the new stages (PLAN_us_unit_2026-11-16.md §9 row 0, §1; her go-ahead 2026-11-17 "buil the us").
 * A family that added a starter unit before the code grew catches up — create-only, additive, one multi-path update on Yes.
 * The real case: two live families hold Geography Path at starterVer 3 (87 Countries, 60 World Geography, Stage 6 ready at 96,
 * Stage 7 at 54); the code is 4 (195 + 195, 193 and 175). The fixture copy is the real v4 code with GEOALL's 108 countries and
 * 135 capitals taken back out. The kids are made up:
 *   kidb — Stage 7 by the GEOADOPT hook-up: the built-in 30 World Geography names + the 30 ★ appended, 7 live; no Countries list;
 *   kida — Stage 5 by the stock enroll: the 50 State Capitals in the list;
 *   kidc — Stage 6 by the stock enroll: the 87 Countries in the list.
 *   · the plan: exactly 108 + 135 cards at new indexes, readyAt 96→193 and 54→175, starterVer 4 — nothing existing written;
 *   · Mom's edited back, bio and picture, and a kid's saved back, are kept; a Mom-held readyAt is kept and said so;
 *   · kidb gets the 135 in path order after the list (no back written — the code has them); kida nothing; kidc the 108;
 *   · twice adds nothing; a current copy shows no row; dry run inert; stale plan refused; no kid or family name in the block;
 *   · a v2-shaped copy (no Stages 5 and 7) gets both stages and decks, ➡ goes by number; an unstaged unit gets its card + picture.
 *   run: node test_starter_update.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const UNIT = "geography_path", C6 = "Countries", C7 = "World Geography", SC = "State Capitals";
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 600) : "")); } };
const block = src.slice(src.indexOf("// STARTER_UNITS_START"), src.indexOf("// STARTER_UNITS_END"));
const SU = src.slice(src.indexOf("// STARTERUP_START"), src.indexOf("// STARTERUP_END"));
const fnSrc = n => { const i = src.indexOf("function " + n + "("); if (i < 0) throw new Error("missing " + n); let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } };
const GATE = ["mastGateChapter", "mastDefKeyOk", "mastFullBank", "mastBankEligible", "haKeyOk", "haKey", "haKeys"].map(fnSrc).join("\n");
const VOCAB = src.slice(src.indexOf("const MAST_VOCAB_DEFS={"), src.indexOf('if(typeof _wrSlashDefs==="function") Object.assign(MAST_VOCAB_DEFS'));
const VOCAB_GEO = (() => { const s = src.indexOf('if(typeof geoVocabDefs==="function")'); return src.slice(s, src.indexOf("\n", s)); })();
const WORLD = JSON.parse(/"World Geography":(\[[^\]]*\])/.exec(src)[1]);   // the built-in list, read from the page
const clone = o => JSON.parse(JSON.stringify(o));
const TS = 1763400000000;

function boot(o) {
  o = o || {};
  const G = { writes: [], rendered: 0, content: { innerHTML: "" }, mom: true, dry: !!o.dry, masteryData: {}, currData: { subjects: {}, done: {} }, unitStudies: {}, opened: null };
  const db = { ref(p) { return { update(v) { G.writes.push(["update", p || "", v]); return Promise.resolve(); }, set(v) { G.writes.push(["set", p, v]); return Promise.resolve(); }, transaction() { return Promise.resolve({ committed: false }); } }; } };
  const w = new Function("G", "db", "BANKS", `
    const masteryData=G.masteryData, currData=G.currData; let unitStudies=G.unitStudies;
    function momHere(){ return G.mom; } function _dryRun(){ return G.dry; } function cap(s){ return s[0].toUpperCase()+s.slice(1); }
    function renderUnits(){ G.rendered++; } function openUnit(id){ G.opened=id; renderUnits(); } const HA_LS={ setItem(){} }; const document={ getElementById:()=>G.content };
    let masteryKid="kidb"; const MAST_BANK_MAP=BANKS; ${VOCAB}
    ${GATE}
    ${block}
    ${VOCAB_GEO}
    return { STARTER_UNITS, suPlan, suApply, suPending, suRowHtml, suHtml, suOpen, _ustCards, _ustStagesWithCards, unitStageStatus, mastFullBank, MAST_VOCAB_DEFS, GEO_ALL_MORE, GEO_ALL_CAPITALS,
      get view(){ return suView; } };`)(G, db, { kidb: { [C7]: WORLD.slice() }, kida: {}, kidc: {} });
  w.G = G; return w;
}
const deck = (u, k) => u.decks.find(d => d && d.key === k);
// The v3 copy: the real v4 record with GEOALL's additions taken back out — what the two live families hold.
function v3Copy(w, home) {
  const u = clone(w.STARTER_UNITS.geography_path({ home: home || "North Carolina" }));
  const more = new Set([].concat(...Object.values(w.GEO_ALL_MORE))), caps = new Set(Object.keys(w.GEO_ALL_CAPITALS));
  deck(u, C6).cards = deck(u, C6).cards.filter(c => !more.has(c.name));
  deck(u, C7).cards = deck(u, C7).cards.filter(c => !caps.has(c.name));
  u.stages.find(s => s.n === 6).readyAt = 96; u.stages.find(s => s.n === 7).readyAt = 54; u.starterVer = 3; u.addedTs = 1763000000000;
  return u;
}
function family(o) {
  o = o || {};
  const w = boot(o), u = o.copy ? o.copy(w) : v3Copy(w); w.G.unitStudies[UNIT] = u; w.u = u;
  const names = k => (deck(u, k) || { cards: [] }).cards.map(c => c.name), v3w = names(C7), v3c = names(C6), sc = names(SC);
  // kidb: hooked up at Stage 7 (GEOADOPT shape) — the built-in 30 + the 30 ★ appended; 7 live; one back saved by the kid
  const bItems = ["United Kingdom", "France", "Germany", "Spain", "Italy", "Japan", "China"].map((n, i) => ({ id: "kidb_wg" + i, subject: C7, type: "world geography", prompt: n, answer: "x", status: i === 6 ? "introduction" : "active", tier: "weekly", next_due: 30 + i }));
  const bCust = []; for (let i = 0; i < 12; i++) bCust.push({ cat: "Social Studies", name: "ss" + i });
  v3w.filter(n => !WORLD.includes(n)).forEach(n => bCust.push({ cat: C7, name: n }));
  // kida: stock-enrolled at Stage 5 — the 50 State Capitals in the list, 3 learning
  const aCust = sc.map(n => ({ cat: SC, name: n })), aItems = sc.slice(0, 3).map((n, i) => ({ id: "kida_sc" + i, subject: SC, prompt: n, answer: "c", status: "introduction", tier: "daily" }));
  // kidc: stock-enrolled at Stage 6 — the 87 Countries in the list, 3 learning
  const cCust = v3c.map(n => ({ cat: C6, name: n })), cItems = v3c.slice(0, 3).map((n, i) => ({ id: "kidc_c" + i, subject: C6, prompt: n, status: "introduction", tier: "daily" }));
  Object.assign(w.G.masteryData, {
    kidb: bItems, kidb_custom_items: bCust, kidb_settings: { definitions: { France: "Paris (my words)" }, cat_modes: { [C7]: "flip" } },
    kida: aItems, kida_custom_items: aCust, kida_settings: { definitions: {} },
    kidc: cItems, kidc_custom_items: cCust, kidc_settings: { definitions: {} } });
  if (!o.noKids) {
    u.enrolled = { kida: true, kidb: true, kidc: true };
    u.kidStage = { kida: { stage: 5, knows: "", subject: "", map: "", ts: 1 }, kidb: { stage: 7, subject: "", knows: "", map: "", ts: 2, via: "attach" }, kidc: { stage: 6, knows: "", subject: "", map: "", ts: 3 } };
  }
  if (o.pre) o.pre(w, u);
  return w;
}
const snapKids = G => JSON.stringify(["kida", "kidb", "kidc"].map(k => [G.masteryData[k], G.masteryData[k + "_settings"]]));
const tick = () => new Promise(r => setTimeout(r, 0));

(async () => {
console.log("── the fixture is the live shape ──");
{ const w = family(), u = w.u, code = w.STARTER_UNITS.geography_path(u);
  ok("v3 copy: Countries 87, World Geography 60, ready at 96 / 54, starterVer 3; the code: 195 / 195, 193 / 175, starterVer 4",
    deck(u, C6).cards.length === 87 && deck(u, C7).cards.length === 60 && u.starterVer === 3 && code.starterVer === 4 && deck(code, C6).cards.length === 195 && deck(code, C7).cards.length === 195 &&
    code.stages.find(s => s.n === 6).readyAt === 193 && code.stages.find(s => s.n === 7).readyAt === 175);
  ok("the code is built with THIS family's home (Stage 3 and the region order follow it)", w.STARTER_UNITS.geography_path({ home: "Oregon" }).home === "Oregon" && w.STARTER_UNITS.geography_path().home === "North Carolina");
}

console.log("\n── the plan for the v3 copy ──");
{ const w = family(), u = w.u, code = w.STARTER_UNITS.geography_path(u), before = JSON.stringify(u), kb = snapKids(w.G);
  const P = w.suPlan(UNIT, TS), S = P.sum || {};
  const di6 = u.decks.findIndex(d => d.key === C6), di7 = u.decks.findIndex(d => d.key === C7);
  const uw = P.writes.filter(x => x.path.startsWith("unitStudies/")), kw = P.writes.filter(x => x.path.startsWith("mastery/"));
  const c6 = uw.filter(x => x.path.startsWith("unitStudies/" + UNIT + "/decks/" + di6 + "/cards/")), c7 = uw.filter(x => x.path.startsWith("unitStudies/" + UNIT + "/decks/" + di7 + "/cards/"));
  ok("plan ok; Countries: 108 new · World Geography: 135 new; 243 cards; no new deck or stage", P.ok && S.cards === 243 && S.decks.length === 2 && S.decks.find(d => d.key === C6).added === 108 && S.decks.find(d => d.key === C6).had === 87 && S.decks.find(d => d.key === C7).added === 135 && S.stages.length === 0, S);
  ok("record writes: 108 at Countries 87…194, 135 at World Geography 60…194, readyAt ×2, starterVer — nothing else", uw.length === 108 + 135 + 3 && c6.length === 108 && c7.length === 135 &&
    c6.every((x, i) => x.path.endsWith("/cards/" + (87 + i))) && c7.every((x, i) => x.path.endsWith("/cards/" + (60 + i))), uw.filter(x => !/\/cards\//.test(x.path)).map(x => x.path));
  const si6 = u.stages.findIndex(s => s.n === 6), si7 = u.stages.findIndex(s => s.n === 7);
  ok("readiness: Stage 6 96 → 193, Stage 7 54 → 175, said in the plan", uw.some(x => x.path === "unitStudies/" + UNIT + "/stages/" + si6 + "/readyAt" && x.value === 193) && uw.some(x => x.path === "unitStudies/" + UNIT + "/stages/" + si7 + "/readyAt" && x.value === 175) &&
    S.settings.length === 2 && S.settings.every(s => s.k === "readyAt") && S.kept.length === 0);
  ok("starterVer 4 is the last write", P.writes[P.writes.length - 1].path === "unitStudies/" + UNIT + "/starterVer" && P.writes[P.writes.length - 1].value === 4);
  const new6 = deck(code, C6).cards.filter(c => !deck(u, C6).cards.some(x => x.name === c.name)), new7 = deck(code, C7).cards.filter(c => !deck(u, C7).cards.some(x => x.name === c.name));
  ok("the new cards are the code's, in the code's order, name/family/stage/back as the code has them; order after the deck's last", JSON.stringify(c6.map(x => x.value.name)) === JSON.stringify(new6.map(c => c.name)) && JSON.stringify(c7.map(x => x.value.name)) === JSON.stringify(new7.map(c => c.name)) &&
    c7.every((x, i) => x.value.def === new7[i].def && x.value.family === new7[i].family && x.value.stage === 7) && c6.every(x => x.value.stage === 6 && x.value.def === undefined) &&
    (m => c6.every((x, i) => x.value.order === m + 1 + i))(Math.max(...deck(u, C6).cards.map(c => c.order))));
  ok("no write lands on an existing card index, an existing deck or stage, enrolled, kidStage or visuals", uw.every(x => { const m = /\/decks\/(\d+)\/cards\/(\d+)$/.exec(x.path); return m ? Number(m[2]) >= deck(u, u.decks[m[1]].key).cards.length : /\/stages\/\d+\/readyAt$|\/starterVer$/.test(x.path); }));
  // kids
  const kb_ = kw.filter(x => x.path.startsWith("mastery/kidb")), ka_ = kw.filter(x => x.path.startsWith("mastery/kida")), kc_ = kw.filter(x => x.path.startsWith("mastery/kidc"));
  const bLen = w.G.masteryData.kidb_custom_items.length;
  ok("Stage-7 kid: the 135 appended to the list after it (indexes " + bLen + "…), {cat,name} only, in path order", kb_.length === 135 && kb_.every((x, i) => x.path === "mastery/kidb_custom_items/" + (bLen + i) && JSON.stringify(x.value) === JSON.stringify({ cat: C7, name: new7[i].name })), kb_.slice(0, 3));
  ok("Stage-7 kid: no back written (every capital's back is in the code); no Countries (that stage was never given)", !kb_.some(x => /definitions/.test(x.path)) && S.kids.find(k => k.kid === "kidb").notGiven[C6] === 108 && !S.kids.find(k => k.kid === "kidb").added[C6]);
  ok("Stage-5 kid: nothing — Countries and World Geography come with ➡", ka_.length === 0 && S.kids.find(k => k.kid === "kida").later[C7] === 135 && S.kids.find(k => k.kid === "kida").later[C6] === 108);
  ok("Stage-6 kid: the 108 Countries after the 87, in path order; World Geography later", kc_.length === 108 && kc_.every((x, i) => x.path === "mastery/kidc_custom_items/" + (87 + i) && x.value.name === new6[i].name && x.value.cat === C6) && S.kids.find(k => k.kid === "kidc").later[C7] === 135);
  ok("in all: 243 + 3 record writes, 243 kid appends = 489", P.writes.length === 489, P.writes.length);
  ok("making the plan changed nothing", JSON.stringify(u) === before && snapKids(w.G) === kb && w.G.writes.length === 0);
  // the next cards don't jump: the Stage-7 kid's next new cards are the same after the appends
  const nextB = () => { const live = new Set(w.G.masteryData.kidb.map(i => i.prompt)); return (w.mastFullBank("kidb")[C7] || []).filter(n => !live.has(n)).slice(0, 10); };
  const before10 = nextB();
  // what Mom sees
  w.suOpen(UNIT); const h = w.suHtml(u);
  ok("suOpen opens the unit with the plan", w.G.opened === UNIT && w.view && w.view.plan.ok);
  ok("Mom sees: Countries 108 new · World Geography 135 new · new ‘ready’ numbers for Stages 6 and 7", /<b>Countries<\/b>: <b>108<\/b> new cards, after the 87 already there/.test(h) && /<b>World Geography<\/b>: <b>135<\/b> new cards, after the 60/.test(h) &&
    /New ‘ready’ number for <b>Stage 6<\/b> · Countries by continent: <b>193<\/b> \(was 96\)/.test(h) && /New ‘ready’ number for <b>Stage 7<\/b> · World capitals: <b>175<\/b> \(was 54\)/.test(h), h.slice(0, 1600));
  ok("…and per kid: Kidb 135 added after what's there; Kida nothing yet; Kidc 108 Countries", /<b>Kidb<\/b> \(Stage 7\): <b>135<\/b> new World Geography cards added to Kidb’s list, after what’s already there/.test(h) &&
    /<b>Kida<\/b> \(Stage 5\): nothing added to the list — the new Countries, World Geography cards come when Kida gets to that stage/.test(h) && /<b>Kidc<\/b> \(Stage 6\): <b>108<\/b> new Countries cards/.test(h) && /489 saved changes/.test(h) && /Yes, add them/.test(h), h);
  // Yes
  const r = w.suApply(w.view.plan); await tick();
  const up = w.G.writes.find(x => x[1] === "");
  ok("Yes: ONE root update with the 489 paths, nothing else", r === true && w.G.writes.length === 1 && up && Object.keys(up[2]).length === 489, w.G.writes.map(x => x[1]));
  ok("after: 195 / 195, ready 193 / 175, starterVer 4 — the copy's cards now match the code's names stage by stage", deck(u, C6).cards.length === 195 && deck(u, C7).cards.length === 195 && u.stages.find(s => s.n === 6).readyAt === 193 && u.stages.find(s => s.n === 7).readyAt === 175 && u.starterVer === 4 &&
    [1, 2, 3, 4, 5, 6, 7].every(n => JSON.stringify(w._ustCards(u, n).map(c => c._dk + c.name).sort()) === JSON.stringify(w._ustCards(code, n).map(c => c._dk + c.name).sort())));
  const old = JSON.parse(before);
  ok("every card that was there is byte-identical, at the same index; every other field of the record too", old.decks.every((d, i) => d.cards.every((c, j) => JSON.stringify(u.decks[i].cards[j]) === JSON.stringify(c))) &&
    JSON.stringify(Object.assign({}, u, { decks: 0, stages: 0, starterVer: 0 })) === JSON.stringify(Object.assign({}, old, { decks: 0, stages: 0, starterVer: 0 })) &&
    old.stages.every((s, i) => JSON.stringify(Object.assign({}, u.stages[i], { readyAt: 0 })) === JSON.stringify(Object.assign({}, s, { readyAt: 0 }))));
  const st = w.unitStageStatus(u, "kidb");
  ok("Stage-7 kid: next ten new cards unchanged; status 6 of 195, ready at 175", JSON.stringify(nextB()) === JSON.stringify(before10) && st.total === 195 && st.need === 175 && st.on === 6, [before10, nextB(), st]);
  ok("kid's live cards and saved back untouched", JSON.stringify(w.G.masteryData.kidb.map(i => i.prompt)) === JSON.stringify(["United Kingdom", "France", "Germany", "Spain", "Italy", "Japan", "China"]) && w.G.masteryData.kidb_settings.definitions.France === "Paris (my words)" && Object.keys(w.G.masteryData.kidb_settings.definitions).length === 1);
  // twice
  const P2 = w.suPlan(UNIT, TS);
  ok("running it twice adds nothing: the plan says current, the row is gone", !P2.ok && P2.writes.length === 0 && /current/.test(P2.why) && w.suPending(u) === null && w.suRowHtml(u) === "" && w.suHtml(u) === "", P2);
}

console.log("\n── Mom's own edits are hers ──");
{ const w = family({ pre: (w, u) => {
    const fr = deck(u, C7).cards.find(c => c.name === "France"); fr.def = "Paris — on the Seine"; fr.bio = "Mom's note";
    u.visuals = { "World Geography_France": "data:image/png;base64,AAAA", "Countries_Chile": "\u{1F336}" };
    deck(u, C6).cards.push({ name: "Greenland", order: 9999, def: "Mom added this" });   // a card Mom batch-added
    u.stages.find(s => s.n === 6).readyAt = 80;   // a value no code ever shipped
  } });
  const u = w.u, before = JSON.stringify(u), P = w.suPlan(UNIT, TS), S = P.sum;
  const di6 = u.decks.findIndex(d => d.key === C6), si6 = u.stages.findIndex(s => s.n === 6);
  ok("an edited back is counted as hers and never written; the bio and pictures are never written", P.ok && S.backsMine === 1 && !P.writes.some(x => /visuals|bio/.test(x.path)) && !P.writes.some(x => x.value && x.value.name === "France" && /unitStudies/.test(x.path)));
  ok("a card Mom added stays; the 108 go after it (index 88…, order after 9999)", P.writes.filter(x => x.path.startsWith("unitStudies/" + UNIT + "/decks/" + di6 + "/cards/")).every((x, i) => x.path.endsWith("/cards/" + (88 + i)) && x.value.order === 10000 + i));
  ok("Stage 6 ready at 80 (not a code value) is KEPT and said so; Stage 7 54 → 175 still updated", !P.writes.some(x => x.path === "unitStudies/" + UNIT + "/stages/" + si6 + "/readyAt") && S.kept.length === 1 && S.kept[0].mine === 80 && S.kept[0].code === 193 && S.settings.length === 1 && S.settings[0].n === 7);
  w.suOpen(UNIT); const h = w.suHtml(u);
  ok("Mom reads it: ready number 80 kept; 1 card's back differs and stays", /Stage 6’s ‘ready’ number is 80 here — kept as it is \(the path says 193\)/.test(h) && /1 card here has a back that differs from the path’s — kept as they are/.test(h), h.slice(0, 1400));
  w.suApply(w.view.plan); await tick();
  const fr = deck(u, C7).cards.find(c => c.name === "France");
  ok("after Yes: her back, bio, pictures, her card and her 80 are exactly as they were", fr.def === "Paris — on the Seine" && fr.bio === "Mom's note" && u.visuals["World Geography_France"] === "data:image/png;base64,AAAA" && deck(u, C6).cards[87].name === "Greenland" &&
    u.stages.find(s => s.n === 6).readyAt === 80 && JSON.parse(before).decks.every((d, i) => d.cards.every((c, j) => JSON.stringify(u.decks[i].cards[j]) === JSON.stringify(c))));
}

console.log("\n── a current copy, dry run, a stale plan, not Mom ──");
{ const w = boot(); const u = clone(w.STARTER_UNITS.geography_path()); w.G.unitStudies[UNIT] = u;
  ok("a copy added today (starterVer 4): no row, no panel, the plan says current", w.suPending(u) === null && w.suRowHtml(u) === "" && w.suHtml(u) === "" && !w.suPlan(UNIT).ok);
  const v = boot(); v.G.unitStudies[UNIT] = Object.assign(clone(v.STARTER_UNITS.geography_path()), { starterVer: 3 });
  ok("an older starterVer with nothing actually missing: still no row (nothing to add)", v.suPending(v.G.unitStudies[UNIT]) === null && !v.suPlan(UNIT).ok);
}
{ const w = family({ dry: true }), before = JSON.stringify(w.u), kb = snapKids(w.G);
  w.suOpen(UNIT); const r = w.suApply(w.view.plan); await tick();
  ok("dry run: Yes writes nothing, changes nothing in memory, says so", r === false && w.G.writes.length === 0 && JSON.stringify(w.u) === before && snapKids(w.G) === kb && /Dry run/.test(w.view.msg) && /Dry run — Yes writes nothing/.test(w.suHtml(w.u)));
}
{ const w = family(); w.suOpen(UNIT); const P = w.view.plan;
  w.G.masteryData.kidb_custom_items.push({ cat: "Social Studies", name: "late add" });   // the list moved after the plan was shown
  const r = w.suApply(P); await tick();
  ok("a stale plan is refused: nothing written, the new plan shown", r === false && w.G.writes.length === 0 && /changed since the plan/.test(w.view.msg) && w.view.plan.writes.length === P.writes.length);
}
{ const w = family(); w.G.mom = false;
  ok("not Mom: no row, no panel, no open, Yes refused", w.suRowHtml(w.u) === "" && w.suHtml(w.u) === "" && (w.suOpen(UNIT), w.view === null) && w.suApply(w.suPlan(UNIT, TS)) === false && w.G.writes.length === 0);
  w.G.mom = true;
  ok("Mom: the quiet row on the unit's card", /＋ Add the new stages \(243 new cards\)/.test(w.suRowHtml(w.u)) && /event\.stopPropagation\(\);suOpen\('geography_path'\)/.test(w.suRowHtml(w.u)));
}

console.log("\n── a v2-shaped copy: Stages 5 and 7 are new ──");
{ const w = family({ copy: w => { const u = v3Copy(w); u.decks = u.decks.filter(d => d.key !== SC && d.key !== C7); u.stages = u.stages.filter(s => s.n !== 5 && s.n !== 7); u.starterVer = 2; return u; },
    pre: (w, u) => { delete u.kidStage.kida; delete u.kidStage.kidb; u.enrolled = { kidc: true }; } });
  const u = w.u, n0 = u.decks.length, P = w.suPlan(UNIT, TS), S = P.sum;
  ok("adds the State Capitals and World Geography decks whole, at new indexes, and Stages 5 and 7", P.ok && S.decks.filter(d => d.isNew).map(d => d.key + ":" + d.added).sort().join() === "State Capitals:50,World Geography:195" &&
    P.writes.filter(x => /\/decks\/\d+$/.test(x.path)).map(x => x.path.split("/").pop()).join() === n0 + "," + (n0 + 1) && S.stages.map(s => s.n).join() === "5,7", S);
  ok("the Stage-6 kid gets the 108 Countries — and nothing from the new decks", S.kids.length === 1 && S.kids[0].added[C6] === 108 && !S.kids[0].added[C7] && !S.kids[0].added[SC]);
  w.suOpen(UNIT); w.suApply(w.view.plan); await tick();
  ok("after Yes, ➡ and the Start form go by stage number (1…7), though 5 and 7 sit at the end of the saved list", w._ustStagesWithCards(u).map(s => s.n).join() === "1,2,3,4,5,6,7" && u.stages.map(s => s.n).join() === "1,2,3,4,6,5,7" &&
    w.unitStageStatus(u, "kidc").next.n === 7);
}

console.log("\n── an unstaged starter unit ──");
{ const w = boot(), U = "cats_house_and_wild", code = w.STARTER_UNITS[U](), d0 = code.decks.find(d => d.key === "Cats"), last = d0.cards.find(c => c.name === "Lion");   // a card with a picture on the code's record
  const u = clone(code); u.starterVer = 0; const ci = code.decks.indexOf(d0); u.decks[ci].cards = u.decks[ci].cards.filter(c => c.name !== last.name); u.visuals = Object.assign({}, u.visuals); delete u.visuals[d0.key + "_" + last.name];
  u.enrolled = { kida: true, kidc: true }; w.G.unitStudies[U] = u;
  w.G.masteryData.kida_custom_items = u.decks[ci].cards.map(c => ({ cat: d0.key, name: c.name })); w.G.masteryData.kida_settings = { definitions: {} };
  w.G.masteryData.kidc_custom_items = []; w.G.masteryData.kidc_settings = {};
  const P = w.suPlan(U, TS), hasPic = (code.visuals || {})[d0.key + "_" + last.name] != null;
  ok("the missing card is appended to its deck" + (hasPic ? " with its picture" : "") + "; starterVer 1", P.ok && P.sum.cards === 1 && P.writes.some(x => x.path === "unitStudies/" + U + "/decks/" + ci + "/cards/" + u.decks[ci].cards.length && x.value.name === last.name) &&
    hasPic && P.writes.some(x => x.path === "unitStudies/" + U + "/visuals/Cats_Lion" && x.value === code.visuals.Cats_Lion) && P.writes.filter(x => /\/visuals\//.test(x.path)).length === 1 && P.writes[P.writes.length - 1].value === 1, P.writes.map(x => x.path));
  ok("an enrolled kid with that deck gets it the unitEnroll way; one without the deck gets nothing", P.writes.some(x => x.path === "mastery/kida_custom_items/" + u.decks[ci].cards.length && x.value.cat === d0.key && x.value.name === last.name) && !P.writes.some(x => /kidc/.test(x.path)));
}
{ const w = boot(), u = clone(w.STARTER_UNITS.nc_envirothon()); u.starterVer = 0; w.G.unitStudies.nc_envirothon = u;
  ok("a unit whose cards live in the code (Envirothon) is never offered", w.suPending(u) === null && !w.suPlan("nc_envirothon").ok);
}

console.log("\n── the block ──");
{ const names = /\b(howe academy|adrienne|andrew|julian|lincoln|ellis|lucy|sara|caleb|taylor|kenzie|dewalt|burris|melanie|david)\b/i;
  const code = SU.split("\n").map(l => l.replace(/\/\/.*$/, "")).join("\n");
  ok("no kid or family name in the block's code", !names.test(code), (names.exec(code) || [])[0]);
  ok("every database write goes through one db.ref().update, behind db && !_dryRun()", (SU.match(/db\.ref\(/g) || []).length === 1 && /if\(!db\|\|_dryRun\(\)\)/.test(SU) && !/\.set\(|\.remove\(|\.transaction\(/.test(code));
  ok("the hooks: the row on the Units card, the panel in the unit's Mom box", /typeof suRowHtml==="function"\) h\+=suRowHtml\(u\)/.test(src) && /typeof suHtml==="function"\) h\+=suHtml\(u,esc\)/.test(src));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})();
