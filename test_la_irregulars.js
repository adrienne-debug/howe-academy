/*
 * Node tests — ＋ Add Irregulars to the Language Arts unit (units switch-over step 9, her §9; LAIRR_START…LAIRR_END;
 * PLAN_la_irregulars_2026-10-26.md). Replays the read-only snapshot test_fixtures/la_irregulars_2026-10-26.json when present
 * (the live unit record's Plural Nouns + Verb Tenses decks and the boys' saved entries); otherwise a made-up record.
 *   · the 40 constants are exactly Ellis's saved question cards (name + answer), none duplicated, none already a unit card;
 *   · the plan = 15 + 25 create-only writes at the decks' free indexes, {name, def, family:"Irregulars", order after the
 *     existing}; no `stages`, no enrolment, no kid data in any path;
 *   · Yes = one root-level update; rebuilt first and refused if a deck changed; dry run / non-Mom / no db / missing unit /
 *     missing deck / staged unit write nothing; cards already present are skipped;
 *   · the button sits in the Mom panel of the Language Arts unit only; after Yes the record holds every Irregular once.
 *   run: node test_la_irregulars.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const FXP = path.join(__dirname, "test_fixtures", "la_irregulars_2026-10-26.json");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 600) : "")); } };
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fnSrc = n => { const i = src.indexOf("function " + n + "("); if (i < 0) throw new Error("missing " + n); let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } };
const block = cut("// LAIRR_START", "// LAIRR_END");

console.log("── the block ──");
ok("LAIRR block present once, right after laUnitFor, and hooked into the unit's Mom panel by typeof", src.split("// LAIRR_START").length === 2 && src.indexOf("// LAIRR_START") > src.indexOf("function laUnitFor(kid)") && /if\(typeof laIrrHtml==="function"\) h\+=laIrrHtml\(u,esc\);/.test(src));
ok("no kid names in the code (comments excepted)", !/lincoln|ellis|lucy|julian/i.test(block.split("\n").filter(l => !/^\s*\/\//.test(l)).map(l => l.replace(/\s+\/\/ .*$/, "")).join("\n")));
ok("every db write is the one root-level update behind !db || _dryRun(); never a set, never a 'stages' write", (block.match(/db\.ref\(/g) || []).length === 1 && /db\.ref\(\)\.update\(up\)/.test(block) && !/\.set\(/.test(block) && !/stages["']?\s*[:=]/.test(block.replace(/u\.stages/g, "")));

let FX = null, synthetic = false;
if (fs.existsSync(FXP)) FX = JSON.parse(fs.readFileSync(FXP, "utf8"));
else { synthetic = true; FX = { unit: { id: "language_arts", title: "Language Arts — Editor in Chief", enrolled: { kidA: true }, nbInsert: false, hasStages: false, decks: [{ key: "Capitalization", count: 27 }, { key: "Punctuation", count: 30 }, { key: "Articles", count: 9 }, { key: "Nouns & Pronouns", count: 23 }, { key: "Plural Nouns", count: 6, cards: [1, 2, 3, 4, 5, 6].map(n => ({ name: "plural rule " + n, def: "rule", order: n })) }, { key: "Verb Tenses", count: 5, cards: [1, 2, 3, 4, 5].map(n => ({ name: "tense rule " + n, def: "rule", order: n })) }, { key: "Subject-Verb Agreement", count: 7 }] }, ellis: null, lincoln: null }; }
console.log(synthetic ? "(no snapshot file — made-up unit record)" : "(replaying " + path.basename(FXP) + ")");
const unitFromFX = () => ({ id: FX.unit.id, title: FX.unit.title, enrolled: JSON.parse(JSON.stringify(FX.unit.enrolled || {})), nbInsert: FX.unit.nbInsert, decks: FX.unit.decks.map(d => ({ key: d.key, mode: d.mode || "flip", cards: d.cards ? JSON.parse(JSON.stringify(d.cards)) : new Array(d.count).fill(null).map((_, i) => ({ name: d.key + " " + (i + 1), def: "x", order: i + 1 })) })) });

function world(o) {
  o = o || {};
  const G = { writes: [], rendered: 0, mom: o.mom !== false, dry: !!o.dry, content: {} , unitStudies: {} };
  if (!o.noUnit) G.unitStudies.language_arts = unitFromFX();
  const db = o.noDb ? null : { ref(p) { return { update(v) { G.writes.push(["update", p || "", v]); return Promise.resolve(); }, set(v) { G.writes.push(["set", p, v]); return Promise.resolve(); } }; } };
  const w = new Function("G", "db", `
    let unitStudies=G.unitStudies, masteryData={}; function momHere(){ return G.mom; } function _dryRun(){ return G.dry; }
    function renderUnits(){ G.rendered++; } const document={ getElementById:()=>G.content };
    const LA_UNIT_ID="language_arts"; function _laStrip(html){ return String(html||"").replace(/<[^>]*>/g,"").replace(/\\s+/g," ").trim(); }
    ${fnSrc("_wrSetLocal")}
    ${block}
    return { LAIRR_CARDS, laIrrPlan, laIrrOpen, laIrrClose, laIrrApply, laIrrHtml, get view(){ return laIrrView; } };`)(G, db);
  w.G = w.G || G; w.G = G; return w;
}
const PN = "Plural Nouns", VT = "Verb Tenses";

(async () => {
console.log("\n── the 40 constants vs the snapshot ──");
{ const w = world(), C = w.LAIRR_CARDS;
  ok("15 plurals + 25 past tenses, every name unique, every one a question with an answer", C[PN].length === 15 && C[VT].length === 25 && new Set([...C[PN], ...C[VT]].map(c => c.name)).size === 40 && [...C[PN], ...C[VT]].every(c => /^What is the (plural|past tense) of <u>[a-z]+<\/u>\?$/.test(c.name) && /^[a-z]+$/.test(c.def)));
  if (FX.ellis) {
    const ex = (cat) => FX.ellis.entries.filter(e => e.cat === cat && !FX.unit.decks.find(d => d.key === cat).cards.some(c => c.name === e.name));
    ok("…they are EXACTLY Ellis's saved entries beyond the unit's cards (15 + 25), name AND answer, in his list's order", JSON.stringify(ex(PN).map(e => [e.name, e.def])) === JSON.stringify(C[PN].map(c => [c.name, c.def])) && JSON.stringify(ex(VT).map(e => [e.name, e.def])) === JSON.stringify(C[VT].map(c => [c.name, c.def])), { pn: ex(PN).length, vt: ex(VT).length });
    ok("his other entries in those decks are the unit's own cards (6 + 5), spelled the same", FX.ellis.entries.filter(e => e.cat === PN).length === 21 && FX.ellis.entries.filter(e => e.cat === VT).length === 30);
    ok("Lincoln has only the unit's own cards there (6 + 5) — his Irregulars are step 16", FX.lincoln.entries.length === 11 && FX.lincoln.entries.every(e => FX.unit.decks.find(d => d.key === e.cat).cards.some(c => c.name === e.name)));
    ok("the live record: plain unit (no stages), both boys enrolled, Plural Nouns 6 · Verb Tenses 5, decks at indexes 4 and 5", FX.unit.hasStages === false && FX.unit.enrolled && FX.unit.enrolled.ellis && FX.unit.enrolled.lincoln && FX.unit.decks[4].key === PN && FX.unit.decks[4].count === 6 && FX.unit.decks[5].key === VT && FX.unit.decks[5].count === 5);
  }
}

console.log("\n── the plan ──");
const w = world(), P = w.laIrrPlan("language_arts", 1761500000000);
ok("plan is ready: 40 writes, 15 to Plural Nouns + 25 to Verb Tenses, none already in", P.ok && P.writes.length === 40 && P.sum.decks[PN].adding === 15 && P.sum.decks[VT].adding === 25 && P.sum.already === 0, P.why || P.sum);
ok("paths are create-only indexes right after the existing cards: decks/4/cards/6…20 and decks/5/cards/5…29", P.writes.filter(x => /decks\/4\//.test(x.path)).map(x => +x.path.split("/").pop()).join() === Array.from({ length: 15 }, (_, i) => 6 + i).join() && P.writes.filter(x => /decks\/5\//.test(x.path)).map(x => +x.path.split("/").pop()).join() === Array.from({ length: 25 }, (_, i) => 5 + i).join(), P.writes.map(x => x.path).slice(0, 3));
ok("every value is {name, def, family:'Irregulars', order}, orders continue the deck's (7…21, 6…30)", P.writes.every(x => Object.keys(x.value).sort().join() === "def,family,name,order" && x.value.family === "Irregulars") && P.writes.filter(x => /decks\/4\//.test(x.path)).map(x => x.value.order).join() === Array.from({ length: 15 }, (_, i) => 7 + i).join() && P.writes.filter(x => /decks\/5\//.test(x.path)).map(x => x.value.order).join() === Array.from({ length: 25 }, (_, i) => 6 + i).join());
ok("no write touches stages, enrolled, nbInsert, mastery/ or any other deck", P.writes.every(x => /^unitStudies\/language_arts\/decks\/[45]\/cards\/\d+$/.test(x.path)));
ok("every write has a plain-words 'what' ('adds “What is the plural of man?” → men to Plural Nouns')", P.writes.every(x => /^adds “What is the/.test(x.what)) && /adds “What is the plural of man\?” → men to Plural Nouns/.test(P.writes[0].what), P.writes[0].what);

console.log("\n── after Yes (replayed locally) ──");
{ const w = world(); const u = w.G.unitStudies.language_arts; const others = JSON.stringify(u.decks.filter(d => d.key !== PN && d.key !== VT)), enr = JSON.stringify(u.enrolled);
  w.laIrrOpen(); const r = w.laIrrApply(w.view.plan); await new Promise(res => setImmediate(res));
  ok("Yes writes once: one root-level update carrying exactly the 40 paths", r === true && w.G.writes.length === 1 && w.G.writes[0][0] === "update" && w.G.writes[0][1] === "" && Object.keys(w.G.writes[0][2]).length === 40 && Object.keys(w.G.writes[0][2]).every(p => /^unitStudies\/language_arts\/decks\/[45]\/cards\/\d+$/.test(p)));
  ok("locally the decks now hold 21 and 30 cards, every Irregular once, the old cards first and unchanged; other decks and enrolment untouched", u.decks[4].cards.length === 21 && u.decks[5].cards.length === 30 && u.decks[4].cards.slice(6).every(c => c.family === "Irregulars") && JSON.stringify(u.decks.filter(d => d.key !== PN && d.key !== VT)) === others && JSON.stringify(u.enrolled) === enr && !u.stages);
  ok("the panel closed, the page re-rendered, and the button now reads '✓ Irregulars are in'", w.view === null && w.G.rendered >= 2 && /✓ Irregulars are in/.test(w.laIrrHtml(u)) && !/Add Irregulars/.test(w.laIrrHtml(u)));
  ok("a second plan says every Irregular is already in (nothing to write)", !w.laIrrPlan("language_arts").ok && /already in the unit/.test(w.laIrrPlan("language_arts").why));
}

console.log("\n── partial: some already present ──");
{ const w = world(); const u = w.G.unitStudies.language_arts; u.decks[4].cards.push({ name: "What is the plural of <u>man</u>?", def: "men", order: 7 });
  const P = w.laIrrPlan("language_arts"); ok("one plural already there → 39 writes, it is skipped, Plural Nouns starts at index 7 / order 8", P.ok && P.writes.length === 39 && P.sum.already === 1 && P.writes.find(x => /decks\/4\//.test(x.path)).path.endsWith("/7") && P.writes.find(x => /decks\/4\//.test(x.path)).value.order === 8, P.sum); }
{ const w = world(); const u = w.G.unitStudies.language_arts; u.decks[4].cards = { 0: u.decks[4].cards[0], 2: u.decks[4].cards[2] };   // a sparse object, as Firebase can return
  const P = w.laIrrPlan("language_arts"); ok("a sparse deck (object with gaps) → next index after the highest key (3), nothing overwritten", P.ok && P.writes.find(x => /decks\/4\//.test(x.path)).path.endsWith("/cards/3")); }

console.log("\n── nothing writes when it shouldn't ──");
{ const w = world({ dry: true }); w.laIrrOpen(); const r = w.laIrrApply(w.view.plan); await new Promise(res => setImmediate(res)); ok("dry run: Yes writes nothing and says so", r === false && w.G.writes.length === 0 && /Dry run/.test(w.view.msg) && w.G.unitStudies.language_arts.decks[4].cards.length === 6); }
{ const w = world({ noDb: true }); w.laIrrOpen(); ok("no database: nothing written", w.laIrrApply(w.view.plan) === false && w.G.writes.length === 0); }
{ const w = world({ mom: false }); w.laIrrOpen(); ok("not Mom: no panel, Yes writes nothing, no button", w.view === null && w.laIrrApply(w.laIrrPlan("language_arts")) === false && w.G.writes.length === 0 && w.laIrrHtml(w.G.unitStudies.language_arts) === ""); }
{ const w = world(); w.laIrrOpen(); const seen = w.view.plan; w.G.unitStudies.language_arts.decks[5].cards.push({ name: "extra", def: "x", order: 6 });   // the deck grew under the plan
  ok("the unit changed since the plan was shown: nothing written, the new plan shows with a note", w.laIrrApply(seen) === false && w.G.writes.length === 0 && /changed/.test(w.view.msg) && w.view.plan.writes.length === 40 && w.view.plan.writes.find(x => /decks\/5\//.test(x.path)).path.endsWith("/6")); }
{ const w = world({ noUnit: true }); const P = w.laIrrPlan("language_arts"); ok("unit not in the database: refuses", !P.ok && /isn’t in the database/.test(P.why)); }
{ const w = world(); w.G.unitStudies.language_arts.stages = [{ n: 1 }]; const P = w.laIrrPlan("language_arts"); ok("a staged unit: refuses (the Irregulars never add stages)", !P.ok && /has stages/.test(P.why)); }
{ const w = world(); w.G.unitStudies.language_arts.decks.splice(5, 1); const P = w.laIrrPlan("language_arts"); ok("a missing Verb Tenses deck: refuses, writes nothing", !P.ok && /no Verb Tenses deck/.test(P.why) && P.writes.length === 0); }

console.log("\n── the button ──");
{ const w = world(); const u = w.G.unitStudies.language_arts;
  const h = w.laIrrHtml(u);
  ok("Mom sees '＋ Add Irregulars (40)' on the Language Arts unit", /Add Irregulars \(40\)/.test(h) && /laIrrOpen\(\)/.test(h), h.slice(0, 300));
  ok("another unit gets nothing", w.laIrrHtml({ id: "word_roots", decks: [] }) === "");
  w.laIrrOpen(); const h2 = w.laIrrHtml(u);
  ok("the plan panel: both decks' counts, 'Nothing is written to any kid', 40 saved changes, Yes + Cancel", /Plural Nouns<\/b>: 6 cards today → adds <b>15<\/b>/.test(h2) && /Verb Tenses<\/b>: 5 cards today → adds <b>25<\/b>/.test(h2) && /Nothing is written to any kid/.test(h2) && /40 saved changes/.test(h2) && /Yes, add them/.test(h2) && /laIrrClose\(\)/.test(h2), h2.slice(0, 600));
  const wd = world({ dry: true }); wd.laIrrOpen(); ok("…and says 'Dry run — Yes writes nothing' under ?dryrun=1", /Dry run — Yes writes nothing/.test(wd.laIrrHtml(wd.G.unitStudies.language_arts)));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})();
