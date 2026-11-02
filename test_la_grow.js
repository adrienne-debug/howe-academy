/*
 * Node tests — ＋ Grow Language Arts (LAGROW_START…LAGROW_END, her ask + answers 2026-11-02). Replays the read-only snapshot
 * test_fixtures/la_grow_2026-11-02.json (the Language Arts + First Language Lessons 4 unit records and both boys' cards,
 * list entries and settings in the language-arts decks, at their real indexes).
 *   · the content constants match the live data (Reading Detective = his saved list, Grammar = the built-in older list,
 *     every repeat front is in the book deck, every card that stays is found);
 *   · the plan: Irregulars + 3 new decks at the next deck indexes, the grown marker; per kid every card keeps its id and
 *     status, repeats move or merge (higher rung kept), new cards go to the list, held decks stay out;
 *   · after Yes (replayed): one card per fact, every unit card is a card or a list entry, the old Grammar list retires;
 *   · Yes = one root-level update + the app's by-id deletes; rebuilt first; dry run / not Mom / no db write nothing;
 *   · the Editor Sprint and the Editor retrieval stages skip sprint:false decks.
 *   run: node test_la_grow.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const FX = JSON.parse(fs.readFileSync(path.join(__dirname, "test_fixtures", "la_grow_2026-11-02.json"), "utf8"));
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 700) : "")); } };
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const braced = (i) => { let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } };
const fnSrc = n => { const i = src.indexOf("function " + n + "("); if (i < 0) throw new Error("missing " + n); return braced(i); };
const constSrc = n => { const i = src.indexOf("const " + n + "="); if (i < 0) throw new Error("missing " + n); return braced(i) + ";"; };
const block = cut("// LAGROW_START", "// LAGROW_END");
const irrBlock = cut("// LAIRR_START", "// LAIRR_END");

console.log("── the block ──");
ok("LAGROW present once, after LAIRR, hooked into the unit's Mom panel by typeof", src.split("// LAGROW_START").length === 2 && src.indexOf("// LAGROW_START") > src.indexOf("// LAIRR_END") && /if\(typeof laGrowHtml==="function"\) h\+=laGrowHtml\(u,esc\);/.test(src));
ok("no kid names in the code (comments excepted)", !/lincoln|ellis|lucy|julian/i.test(block.split("\n").filter(l => !/^\s*\/\//.test(l)).map(l => l.replace(/\s+\/\/ .*$/, "")).join("\n")));
ok("one db write in the block — the root-level update behind !db || _dryRun(); never a set()", (block.match(/db\.ref\(/g) || []).length === 1 && /db\.ref\(\)\.update\(up\)/.test(block) && !/\.set\(/.test(block) && /_dryRun\(\)/.test(block));
ok("removals go through the app's own by-id delete and list filter (mastRemoveByIds / mastBankRemove)", /mastRemoveByIds\(r\.kid,r\.ids\)/.test(block) && /mastBankRemove\(r\.kid,pred\)/.test(block));
ok("mastFullBank retires a built-in list through laGrowRetired", /laGrowRetired\(kid,k\)\)\)\{ base\[k\]=\[\]; return; \}/.test(fnSrc("mastFullBank")));
ok("Editor Sprint pills, laSetDeck and the Editor retrieval stages skip sprint:false decks", /d\.sprint!==false&&\(d\.cards\|\|\[\]\)\.length\)/.test(fnSrc("buildSprintEditorHtml")) && /x\.sprint!==false/.test(fnSrc("laSetDeck")) && /d\.sprint===false\) return;/.test(fnSrc("retrEditorStages")));

// ── a world built from the snapshot ──
const KIDS = ["ellis", "lincoln"];
function arrFrom(len, map, filler) { const a = []; for (let i = 0; i < len; i++) a.push(map[String(i)] ? JSON.parse(JSON.stringify(map[String(i)])) : filler(i)); return a; }
function world(o) {
  o = o || {};
  const G = { writes: [], removedIds: {}, bankPreds: {}, rendered: 0, mom: o.mom !== false, dry: !!o.dry, content: {} };
  G.unitStudies = JSON.parse(JSON.stringify(FX.units));
  G.masteryData = {};
  KIDS.forEach(k => { const K = FX.kids[k];
    G.masteryData[k] = arrFrom(K.itemsLen, K.items, i => ({ id: k + "_other_" + i, subject: "Other", prompt: "other " + i, status: "active", tier: "weekly" }));
    G.masteryData[k + "_custom_items"] = arrFrom(K.bankLen, K.bank, i => ({ cat: "Other", name: "other " + i }));
    G.masteryData[k + "_settings"] = JSON.parse(JSON.stringify(K.settings)); });
  if (o.tweak) o.tweak(G);
  const db = o.noDb ? null : { ref(p) { return { update(v) { G.writes.push(["update", p || "", v]); return Promise.resolve(); }, set(v) { G.writes.push(["set", p, v]); return Promise.resolve(); } }; } };
  const w = new Function("G", "db", `
    let unitStudies=G.unitStudies, masteryData=G.masteryData; const HA_LS={setItem(){}};
    function momHere(){ return G.mom; } function _dryRun(){ return G.dry; } function cap(s){ return s[0].toUpperCase()+s.slice(1); }
    function renderUnits(){ G.rendered++; } const document={ getElementById:()=>G.content };
    function mastRemoveByIds(kid,ids){ G.removedIds[kid]=(G.removedIds[kid]||[]).concat(ids); }
    function mastBankRemove(kid,pred){ G.bankPreds[kid]=pred; }
    function wrBuiltInRetired(){ return false; }
    ${constSrc("MAST_LINCOLN_BANK")} ${constSrc("MAST_ELLIS_BANK")} ${constSrc("MAST_VOCAB_DEFS")}
    const MAST_BANK_MAP={lincoln:MAST_LINCOLN_BANK,ellis:MAST_ELLIS_BANK};
    ${fnSrc("mastDefKeyOk")} ${fnSrc("mastFullBank")} ${fnSrc("_wrSetLocal")}
    const LA_UNIT_ID="language_arts"; function _laStrip(html){ return String(html||"").replace(/<[^>]*>/g,"").replace(/\\s+/g," ").trim(); }
    ${irrBlock}
    ${block}
    return { LAGROW_RD, LAGROW_GRAMMAR, LAGROW_SAME, LAGROW_FOLD, laGrowPlan, laGrowOpen, laGrowClose, laGrowHold, laGrowApply, laGrowHtml, laGrowRetired, mastFullBank, laIrrPlan, get view(){ return laGrowView; } };`)(G, db);
  w.G = G; return w;
}
const FLL = "First Language Lessons 4", RDK = "Reading Detective", GR = "Grammar";
const live = (G, k) => G.masteryData[k].filter(Boolean);
const keyOf = (d, n) => d + "\u0001" + n;
const tick = () => new Promise(r => setImmediate(r));

(async () => {
console.log("\n── the constants vs the live data ──");
{ const w = world(), E = FX.kids.ellis;
  const rdSaved = Object.keys(E.bank).sort((a, b) => a - b).map(i => E.bank[i]).filter(c => c.cat === RDK);
  ok("Reading Detective = his 36 saved entries, front AND back, in his list's order", JSON.stringify(rdSaved.map(c => [c.name, c.def])) === JSON.stringify(w.LAGROW_RD) && w.LAGROW_RD.length === 36);
  ok("Grammar = the 24 built-in older grammar terms, each with a back in MAST_VOCAB_DEFS", w.LAGROW_GRAMMAR.length === 24 && JSON.stringify(w.LAGROW_GRAMMAR) === JSON.stringify(w.mastFullBank("lincoln").Grammar.slice(0, 24)));
  const bookNames = FX.units.fll_4.decks[0].cards.map(c => c.name);
  const drops = w.LAGROW_SAME.filter(s => s[0] === FLL);
  ok("18 book repeats, every one a real card of the book deck, none twice", drops.length === 18 && drops.every(s => bookNames.includes(s[1])) && new Set(drops.map(s => s[1])).size === 18);
  ok("9 old Grammar words, every one in the built-in older list he's on", w.LAGROW_SAME.filter(s => s[0] === GR).length === 9 && w.LAGROW_SAME.filter(s => s[0] === GR).every(s => w.mastFullBank("ellis").Grammar.includes(s[1])));
  ok("the live records: plain Language Arts unit, both boys on it, 7 decks; the book unit has one 60-card deck", !FX.units.language_arts.stages && FX.units.language_arts.enrolled.ellis && FX.units.language_arts.enrolled.lincoln && FX.units.language_arts.decks.length === 7 && FX.units.fll_4.decks.length === 1 && FX.units.fll_4.decks[0].cards.length === 60);
}

console.log("\n── the plan (live snapshot) ──");
const w0 = world(), P = w0.laGrowPlan("language_arts", 1793000000000);
ok("plan ready", P.ok, P.why);
ok("Irregulars ride along (40) when not in yet", P.sum.irr === 40 && P.writes.filter(x => /^unitStudies\/language_arts\/decks\/[45]\/cards\/\d+$/.test(x.path)).length === 40);
ok("3 new decks at decks/7, 8, 9: First Language Lessons 4 (42), Reading Detective (36), Grammar (24), all sprint:false", ["7", "8", "9"].every(n => P.writes.some(x => x.path === "unitStudies/language_arts/decks/" + n)) && JSON.stringify(P.sum.decks) === JSON.stringify([{ key: FLL, n: 42 }, { key: RDK, n: 36 }, { key: GR, n: 24 }]) && [7, 8, 9].every(n => P.writes.find(x => x.path === "unitStudies/language_arts/decks/" + n).value.sprint === false));
{ const fold = P.writes.find(x => x.path === "unitStudies/language_arts/decks/7").value, book = FX.units.fll_4.decks[0];
  ok("the book deck moves in as it is (key, gate, mode, start cap, card fields + order) minus the 18 repeats", fold.key === FLL && JSON.stringify(fold.gate) === JSON.stringify(book.gate) && fold.mode === book.mode && fold.introCap === book.introCap && fold.cards.every(c => JSON.stringify(c) === JSON.stringify(book.cards.find(b => b.name === c.name))) && fold.cards.length === 42); }
ok("the grown marker", P.writes.some(x => x.path === "unitStudies/language_arts/grown" && x.value.v === 1 && x.value.from === "fll_4"));
ok("nothing touches enrolled, stages, the book unit, cat_gate, definitions or another kid", P.writes.every(x => !/\/enrolled|\/stages|unitStudies\/fll_4|cat_gate|definitions/.test(x.path) && (/^unitStudies\/language_arts\//.test(x.path) || /^mastery\/(ellis|lincoln)(_custom_items|_settings)?\//.test(x.path))));
ok("every write has plain words", P.writes.every(x => typeof x.what === "string" && x.what.length > 8));

const E = P.sum.kids.ellis, L = P.sum.kids.lincoln;
ok("Ellis: 7 old Grammar cards MOVE onto their book cards (verb → Verb … subject → Simple subject)", E.moved.length === 7 && E.moved.includes("verb → Verb") && E.moved.includes("subject → Simple subject"), E.moved);
ok("Ellis: 6 repeats fold in — noun → Noun and pronoun → the Editor pronoun card (higher rung kept), 4 book plurals", E.merged.length === 6 && E.merged.some(m => /^noun → Noun \(its higher rung kept\)/.test(m)) && E.merged.some(m => /^pronoun → .*\(its higher rung kept\)/.test(m)) && E.merged.filter(m => /^Plurals/.test(m)).length === 4 && E.merged.filter(m => /^Plurals/.test(m)).every(m => !/higher rung/.test(m)), E.merged);
ok("Ellis: 6 cards removed by id + the 18 repeat list entries", P.removes.find(r => r.kid === "ellis").ids.length === 6 && P.removes.find(r => r.kid === "ellis").bank.length === 18);
ok("Ellis: new to his list = the 24 Grammar terms only (he has everything else); 11 not-started built-in words leave", JSON.stringify(E.added) === JSON.stringify({ Grammar: 24 }) && E.leaves.length === 11 && E.leaves.includes("predicate"), { added: E.added, leaves: E.leaves });
ok("Lincoln: nothing moves or folds; nothing removed", L.moved.length === 0 && L.merged.length === 0 && !P.removes.some(r => r.kid === "lincoln"));
ok("Lincoln: new to his list = Irregulars 15 + 25, First Language Lessons 4 42, Reading Detective 36, Grammar 20 (his own list, 4 already cards)", JSON.stringify(L.added) === JSON.stringify({ "Plural Nouns": 15, "Verb Tenses": 25, [FLL]: 42, [RDK]: 36, Grammar: 20 }), L.added);
ok("Lincoln: card style + start cap for the two decks brand-new to him only (not Grammar, which he had)", P.writes.filter(x => /^mastery\/lincoln_settings\//.test(x.path)).map(x => x.path + "=" + x.value).sort().join() === ["mastery/lincoln_settings/cat_intro_max/" + FLL + "=3", "mastery/lincoln_settings/cat_intro_max/" + RDK + "=3", "mastery/lincoln_settings/cat_modes/" + FLL + "=flip", "mastery/lincoln_settings/cat_modes/" + RDK + "=flip"].sort().join() && !P.writes.some(x => /^mastery\/ellis_settings/.test(x.path)));
ok("list entries are appended after the last index (Ellis from " + FX.kids.ellis.bankLen + ", Lincoln from " + FX.kids.lincoln.bankLen + ") and carry the back (+ lesson for book cards)", ["ellis", "lincoln"].every(k => { const ws = P.writes.filter(x => x.path.startsWith("mastery/" + k + "_custom_items/")); return ws.length && ws.map(x => +x.path.split("/").pop()).join() === ws.map((x, i) => FX.kids[k].bankLen + i).join() && ws.every(x => x.value.def); }) && P.writes.filter(x => x.path.startsWith("mastery/lincoln_custom_items/") && x.value.cat === FLL).every(x => x.value.ch != null));

console.log("\n── after Yes (replayed) ──");
{ const w = world(), G = w.G; const before = {}; KIDS.forEach(k => { before[k] = {}; live(G, k).forEach(it => { before[k][it.id] = JSON.parse(JSON.stringify(it)); }); });
  w.laGrowOpen(); const r = w.laGrowApply(w.view.plan); await tick();
  ok("Yes: one root-level update with every planned path, then the deletes", r === true && G.writes.length === 1 && G.writes[0][1] === "" && Object.keys(G.writes[0][2]).length === P.writes.length && G.removedIds.ellis && G.removedIds.ellis.length === 6 && typeof G.bankPreds.ellis === "function" && !G.removedIds.lincoln);
  const pred = G.bankPreds.ellis, bankBefore = Object.values(FX.kids.ellis.bank);
  ok("the list filter removes exactly the 18 repeat entries", bankBefore.filter(pred).length === 18 && bankBefore.filter(pred).every(e => e.cat === FLL));
  const removed = new Set(G.removedIds.ellis);
  ok("every card that wasn't a repeat keeps its id and progress; the 7 moved keep id + status with their new deck/front", KIDS.every(k => Object.keys(before[k]).filter(id => !removed.has(id)).every(id => { const a = before[k][id], b = live(G, k).find(x => x.id === id); if (!b) return false;
    const same = ["status", "tier", "next_due", "tally_dots", "consecutive_correct"].every(f => JSON.stringify(a[f]) === JSON.stringify(b[f]));
    const raised = (k === "ellis" && (b.prompt === "Noun" || /They<\/u> went to the library/.test(b.prompt)));
    return same || raised; })));
  const ell = live(G, "ellis"), noun = ell.find(x => x.subject === FLL && x.prompt === "Noun"), oldNoun = Object.values(before.ellis).find(x => x.subject === GR && x.prompt === "noun");
  ok("Ellis's Noun took his old noun's monthly rung (same Noun card id)", noun && noun.tier === oldNoun.tier && noun.next_due === oldNoun.next_due && noun.id === Object.values(before.ellis).find(x => x.prompt === "Noun").id, noun);
  const verb = ell.find(x => x.prompt === "Verb"), oldVerb = Object.values(before.ellis).find(x => x.prompt === "verb");
  ok("Ellis's verb card IS now the Verb book card — same id, rung, due day; book back", verb && verb.id === oldVerb.id && verb.subject === FLL && verb.tier === oldVerb.tier && verb.next_due === oldVerb.next_due && verb.answer === FX.units.fll_4.decks[0].cards.find(c => c.name === "Verb").def);
  ok("no old Grammar word or book repeat is left as a card", !ell.some(x => w.LAGROW_SAME.some(s => s[0] === x.subject && s[1] === x.prompt)));
  ok("one card per fact: no kid has two cards on the same deck + front", KIDS.every(k => { const s = live(G, k).map(x => keyOf(x.subject, x.prompt)); return new Set(s).size === s.length; }));
  const u = G.unitStudies.language_arts;
  ok("the unit now holds 10 decks: Editor 7 (Plural Nouns 21, Verb Tenses 30) + FLL 4, Reading Detective, Grammar; grown", u.decks.length === 10 && u.decks[4].cards.length === 21 && u.decks[5].cards.length === 30 && u.decks.slice(7).map(d => d.key).join() === [FLL, RDK, GR].join() && u.grown);
  ok("the book unit is untouched", JSON.stringify(G.unitStudies.fll_4) === JSON.stringify(FX.units.fll_4));
  // each unit card is a card or a list entry for each kid (bank after the filter)
  KIDS.forEach(k => { const bank = G.masteryData[k + "_custom_items"].filter(e => e && !(k === "ellis" && pred(e))), have = new Set(live(G, k).map(x => keyOf(x.subject, x.prompt)).concat(bank.map(e => keyOf(e.cat, e.name))));
    const miss = []; u.decks.forEach(d => d.cards.forEach(c => { if (!have.has(keyOf(d.key, c.name))) miss.push(d.key + " · " + c.name); }));
    ok(k + ": every unit card is a card or in the list", miss.length === 0, miss.slice(0, 5)); });
  ok("grown: the old built-in Grammar list retires for both — Grammar = the unit's terms only", ["ellis", "lincoln"].every(k => w.mastFullBank(k).Grammar.every(n => w.LAGROW_GRAMMAR.includes(n))) && !w.mastFullBank("ellis").Grammar.includes("noun") && w.laGrowRetired("ellis", "Grammar") && !w.laGrowRetired("ellis", "Vocabulary"));
  ok("the panel closed and now reads '✓ Language Arts is grown'; a second plan refuses", w.view === null && /✓ Language Arts is grown/.test(w.laGrowHtml(u)) && !w.laGrowPlan("language_arts").ok);
}

console.log("\n── hold a deck for a kid ──");
{ const w = world(), P1 = w.laGrowPlan("language_arts", 1, { ellis: { Grammar: true }, lincoln: { Grammar: true, [RDK]: true } });
  ok("Ellis's Grammar held → nothing added there, 24 shown as held", P1.ok && !P1.sum.kids.ellis.added.Grammar && P1.sum.kids.ellis.held.Grammar === 24);
  ok("Lincoln's own Grammar terms still carry over (20); his Reading Detective held (36), no settings for it", P1.sum.kids.lincoln.added.Grammar === 20 && P1.sum.kids.lincoln.held[RDK] === 36 && !P1.writes.some(x => x.path.includes("lincoln_settings") && x.path.endsWith(RDK)));
  w.laGrowOpen(); const i = w.view.plan.sum.keys.indexOf(GR); w.laGrowHold("ellis", i);
  ok("the panel's hold button rebuilds the plan with the hold (same ts)", w.view.hold.ellis.Grammar && w.view.plan.sum.kids.ellis.held.Grammar === 24 && /held — give/.test(w.laGrowHtml(w.G.unitStudies.language_arts)));
  w.laGrowHold("ellis", i); ok("…and tapping again gives it back", !w.view.hold.ellis.Grammar && w.view.plan.sum.kids.ellis.added.Grammar === 24); }

console.log("\n── nothing writes when it shouldn't ──");
{ const w = world({ dry: true }); w.laGrowOpen(); const r = w.laGrowApply(w.view.plan); await tick(); ok("dry run: nothing written, says so", r === false && w.G.writes.length === 0 && /Dry run/.test(w.view.msg) && !w.G.unitStudies.language_arts.grown); }
{ const w = world({ noDb: true }); w.laGrowOpen(); ok("no database: nothing written", w.laGrowApply(w.view.plan) === false && w.G.writes.length === 0); }
{ const w = world({ mom: false }); w.laGrowOpen(); ok("not Mom: no panel, no button, Yes writes nothing", w.view === null && w.laGrowHtml(w.G.unitStudies.language_arts) === "" && w.laGrowApply(w.laGrowPlan("language_arts")) === false && w.G.writes.length === 0); }
{ const w = world(); w.laGrowOpen(); const seen = w.view.plan; w.G.masteryData.ellis.push({ id: "new_card", subject: GR, prompt: "gerund", status: "introduction" });   // a new card under the plan
  ok("a kid's cards changed since the plan: nothing written, the new plan shows", w.laGrowApply(seen) === false && w.G.writes.length === 0 && /changed/.test(w.view.msg)); }
{ const w = world({ tweak: G => { delete G.unitStudies.fll_4; } }); ok("no book unit: refuses", !w.laGrowPlan("language_arts").ok && /book unit/.test(w.laGrowPlan("language_arts").why)); }
{ const w = world({ tweak: G => { G.unitStudies.language_arts.stages = [{ n: 1 }]; } }); ok("staged unit: refuses", !w.laGrowPlan("language_arts").ok); }
{ const w = world({ tweak: G => { G.unitStudies.language_arts.decks.push({ key: RDK, cards: [] }); } }); ok("a deck with a new deck's name already there: refuses, no writes", !w.laGrowPlan("language_arts").ok && w.laGrowPlan("language_arts").writes.length === 0); }
{ const w = world({ tweak: G => { G.unitStudies.fll_4.decks[0].cards = G.unitStudies.fll_4.decks[0].cards.filter(c => c.name !== "Commas in a series"); } }); ok("the book deck changed under the repeat list: refuses, no writes", !w.laGrowPlan("language_arts").ok && w.laGrowPlan("language_arts").writes.length === 0); }
{ const w = world({ tweak: G => { G.unitStudies.language_arts.decks[2].cards.forEach(c => { c.def = c.def + " "; }); G.unitStudies.language_arts.decks[3].cards.forEach(c => { c.def = c.def + " "; }); } }); ok("a card that stays can't be found: refuses, no writes", !w.laGrowPlan("language_arts").ok && /stays/.test(w.laGrowPlan("language_arts").why) && w.laGrowPlan("language_arts").writes.length === 0); }
{ const w = world({ tweak: G => { G.unitStudies.language_arts.decks[4].cards = G.unitStudies.language_arts.decks[4].cards.concat(w0.laIrrPlan("language_arts", 1).writes.filter(x => /decks\/4\//.test(x.path)).map(x => x.value)); G.unitStudies.language_arts.decks[5].cards = G.unitStudies.language_arts.decks[5].cards.concat(w0.laIrrPlan("language_arts", 1).writes.filter(x => /decks\/5\//.test(x.path)).map(x => x.value)); } });
  const P2 = w.laGrowPlan("language_arts"); ok("Irregulars already in: the plan skips them and still gives Lincoln their list entries", P2.ok && P2.sum.irr === 0 && P2.sum.kids.lincoln.added["Plural Nouns"] === 15 && P2.sum.kids.lincoln.added["Verb Tenses"] === 25); }

console.log("\n── the button ──");
{ const w = world(), u = w.G.unitStudies.language_arts;
  ok("Mom sees '＋ Grow Language Arts' on the Language Arts unit; another unit gets nothing", /＋ Grow Language Arts/.test(w.laGrowHtml(u)) && w.laGrowHtml({ id: "word_roots", decks: [] }) === "");
  w.laGrowOpen(); const h = w.laGrowHtml(u);
  ok("the plan panel: decks, 'Every card a kid already has stays as it is', both kids, hold buttons, Yes + Cancel", /First Language Lessons 4<\/b> \(42\)/.test(h) && /Every card a kid already has stays as it is/.test(h) && /<b>Ellis<\/b>/.test(h) && /<b>Lincoln<\/b>/.test(h) && /laGrowHold\('lincoln',/.test(h) && /Yes, grow it/.test(h) && /laGrowClose\(\)/.test(h), h.slice(0, 500));
  const wd = world({ dry: true }); wd.laGrowOpen(); ok("…and 'Dry run — Yes writes nothing' under ?dryrun=1", /Dry run — Yes writes nothing/.test(wd.laGrowHtml(wd.G.unitStudies.language_arts))); }

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
})();
