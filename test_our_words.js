// 📝 OURWORDS PR 1 — the home and the no-duplicates look-up (DESIGN_our_words_2026-10-24.md §4, §6, §8.4, §10, §14 items 1–10
//   minus the screens; her go 2026-10-27, step 0 of BRIEF_units_build_2026-10-27.md). Runs the REAL block with the real
//   mastGetDef / mastCustomDef / mastUniqueId / pwPlace slices.
//   · owNorm / owSame: case, spaces, <u> markup, "Mr․", curly quotes; "A" ≠ "a"; "2³" ≠ "23"; "⅓" kept
//   · owFind order: here › waiting › unit › bank › elsewhere › new; twins never match; alsoIn lists every other hit;
//     Ellis "Noun" vs "noun" → elsewhere; Lincoln "er" → the German card in alsoIn
//   · owPlanAdd is pure (no db, masteryData untouched); owApplyAdd writes only §10's paths; dry run → zero writes
//   · append-only: every pre-existing index byte-identical, the new card at items.length
//   · a bank entry never carries def; an Our-words card with a back is flash unless card.review_mode says otherwise
//   · re-check at apply: a word added meanwhile → no second card; a copy keeps its owId; copying twice = no new writes
//   · Mom-only; unitStudies / notebookSettings never written
//   run: node test_our_words.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
const BLOCK = cut("// OURWORDS_START", "// OURWORDS_END");
const CODE = BLOCK + "\n" + fn("mastGetDef") + "\n" + fn("mastCustomDef") + "\n" + fn("mastUniqueId") + "\n" + fn("mastDefKeyOk") + "\n" + fn("mastDefKey") + "\n" + fn("pwPlace");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

const FIX = () => ({
  lincoln: [
    { id: "lin_pg_er", subject: "Phonograms", prompt: "er", answer: "/er/ · her", review_mode: "recite", status: "parked", tier: "daily" },
    { id: "lin_er", subject: "German", prompt: "er", answer: "he", status: "active", tier: "weekly" },
    { id: "lin_keep", subject: "Spelling", prompt: "keep", answer: "keep", status: "active", tier: "weekly" },
    { id: "lin_keep2", subject: "AAS Words", prompt: "keep", answer: "keep", status: "active", tier: "graduated" },
    { id: "lin_floss", subject: "Spelling Rules", prompt: "Floss rule", answer: "Double f, l, or s after a single short vowel at the end of a one-syllable word.", review_mode: "recite", status: "active", tier: "monthly" },
    { id: "lin_hund_p", subject: "German", prompt: "der Hund", dir: "prod", twinOf: "lin_hund", status: "active", tier: "weekly" },
    { id: "lin_ops", subject: "Math Facts", prompt: "3 + 4 × 2", answer: "11", status: "introduction", tier: "daily" }],
  lincoln_custom_items: [{ cat: "AAS Words", name: "slept" }, { cat: "Spelling Rules", name: "Silent e rule", def: "Drop the e before a vowel suffix." }],
  lincoln_settings: { definitions: { er: "he", brave: "a family meaning of brave" } },
  ellis: [
    { id: "ell_noun", subject: "Grammar", prompt: "Noun", answer: "a person, place, thing or idea", review_mode: "recite", status: "active", tier: "weekly" },
    { id: "ell_eco", subject: "Science", prompt: "ecosystem", answer: "all the living and nonliving things in a place", status: "active", tier: "bi_weekly" }],
  ellis_custom_items: [], ellis_settings: {}
});
const UNITS = () => ({
  all_about_spelling: { id: "all_about_spelling", cardLessons: true, enrolled: { lincoln: true }, decks: [{ key: "AAS Words", cards: [{ name: "three", stage: 2, lesson: 17 }, { name: "Mr․", stage: 2, lesson: 20 }, { name: "keep", stage: 1, lesson: 9 }] }] },
  rs4k_4: { id: "rs4k_4", enrolled: { ellis: true, lincoln: true }, decks: [{ key: "RS4K Book 4", cards: [{ name: "ecosystem", def: "a community of living things and their surroundings", ch: 3 }, { name: "atmosphere", ch: 4 }] }] }
});
function world(o) {
  o = o || {};
  const writes = [], dbCalls = [];
  const ref = p => ({ set: v => { writes.push(["set", p, JSON.parse(JSON.stringify(v))]); }, update: v => { writes.push(["update", p, JSON.parse(JSON.stringify(v))]); },
    transaction: f => { writes.push(["transaction", p, f(o.bankCur !== undefined ? o.bankCur : null)]); }, push: () => { dbCalls.push("push"); return { key: "pushkey" }; } });
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN,
    masteryData: o.mastery || FIX(), unitStudies: o.units || UNITS(), masteryKid: "lincoln",
    momHere: () => o.mom !== false, mastAdminPinOk: !!o.pin, _dryRun: () => !!o.dry,
    db: o.nodb ? null : new Proxy({}, { get: (t, k) => { dbCalls.push(String(k)); return k === "ref" ? ref : undefined; } }),
    mastIsParked: i => !!(i && i.status === "parked"), mhqTierLbl: t => String(t == null ? "" : t).replace(/^bi_/, "bi-").replace(/_/g, " "),
    mastFullBank: kid => { const base = { "Math Facts": ["25% of 80", "3 + 4 × 2"], "AAS Words": [] }; let c = ctx.masteryData[kid + "_custom_items"] || []; if (!Array.isArray(c)) c = Object.values(c); c.forEach(e => { if (!e) return; if (!base[e.cat]) base[e.cat] = []; if (!base[e.cat].includes(e.name)) base[e.cat].push(e.name); }); return base; },
    haKidUnits: kid => Object.values(ctx.unitStudies).filter(u => u && u.enrolled && u.enrolled[kid]),
    MAST_MATH_ANS: { "3 + 4 × 2": "11", "25% of 80": "20" }, MAST_VOCAB_DEFS: { brave: "not afraid, ready to face danger", kind: "friendly and caring toward others" },
    mastDrillSettings: () => ({ ladder: ["every_other_day", "weekly", "bi_weekly", "monthly"], cat_intro_max: { "AAS Words": 1 }, max_intro_per_cat: 3 }),
    mastIntroMaxFor: (cat, s) => { s = s || ctx.mastDrillSettings(); const m = s.cat_intro_max || {}; return m[cat] != null ? m[cat] : s.max_intro_per_cat; },
    mastStampNextDue: (it, items, tier) => { it.next_due = tier === "monthly" ? 28 : 7; }, mastGetPrintNum: () => 12, mastGetVisual: () => null,
    MAST_ANIMAL_EMOJI: { cat: "🐱" }, _mastRe: () => { ctx.repaints = (ctx.repaints || 0) + 1; }, repaints: 0 };
  vm.createContext(ctx);
  vm.runInContext(CODE, ctx);
  return { ctx, writes, dbCalls };
}
const names = ws => ws.map(w => w[0] + " " + w[1]);

console.log("── §6.1 the same-word test ──");
{
  const c = world().ctx;
  ok("case and spaces: 'Ice Cream' = 'icecream'; '3 + 4 × 2' = '3+4×2'", c.owSame("Ice Cream", "icecream") && c.owSame("3 + 4 × 2", "3+4×2"));
  ok("rule-deck markup is ignored: '<u>Noun</u>' = 'noun'", c.owSame("<u>Noun</u>", "noun"));
  ok("pwKey's one-dot leader: 'Mr․' = 'Mr.'; curly quotes = straight", c.owSame("Mr․", "Mr.") && c.owSame("don’t", "don't"));
  ok("single letters keep case: 'A' ≠ 'a' (Julian's Letters), 'a' = 'a'", !c.owSame("A", "a") && c.owSame("a", "a"));
  ok("NFC not NFKC: '2³' ≠ '23', '⅓' ≠ '1/3', '⅓' = '⅓'", !c.owSame("2³", "23") && !c.owSame("⅓", "1/3") && c.owSame("⅓", "⅓"));
  ok("owKey encodes Firebase key characters reversibly", c.owKey("flex/flect") === "flex%2fflect" && c.owKey("AAS Words") === "AAS Words");
}
console.log("\n── §6.2 the look-up order ──");
{
  const c = world().ctx;
  const h = c.owFind("lincoln", "all_about_spelling", "AAS Words", "Keep");
  ok("a live card HERE wins (case-insensitive) — graduated still counts", h.kind === "here" && h.id === "lin_keep2" && h.state === "graduated", h);
  ok("…alsoIn lists the Spelling card and the book's own 'keep'", h.alsoIn.some(a => a.where === "card" && a.deck === "Spelling" && a.id === "lin_keep") && h.alsoIn.some(a => a.where === "unit"), h.alsoIn);
  const t = c.owFind("lincoln", "all_about_spelling", "AAS Words", "three");
  ok("not a card but in the UNIT's list → unit, Level 2 · Lesson 17, the book's spelling", t.kind === "unit" && t.lesson === 17 && t.level === 2 && t.name === "three", t);
  ok("'Mr.' matches the unit card stored as 'Mr․'", c.owFind("lincoln", "all_about_spelling", "AAS Words", "Mr.").kind === "unit");
  const b = c.owFind("lincoln", "all_about_spelling", "AAS Words", "slept");
  ok("not a card, not in the book, but in the BANK → bank", b.kind === "bank" && b.name === "slept", b);
  const e = c.owFind("lincoln", null, "Vocabulary", "keep");
  ok("a card in another deck → ELSEWHERE (the first one), the other in alsoIn", e.kind === "elsewhere" && e.deck === "Spelling" && e.id === "lin_keep" && e.alsoIn.some(a => a.deck === "AAS Words"), e);
  ok("a twin never matches: 'der Hund' in German → new", c.owFind("lincoln", null, "German", "der Hund").kind === "new");
  ok("found nowhere → new, empty alsoIn", JSON.stringify(c.owFind("lincoln", "all_about_spelling", "AAS Words", "jefferson")) === JSON.stringify({ kind: "new", deck: "AAS Words", name: "jefferson", alsoIn: [] }));
  const er = c.owFind("lincoln", null, "Phonograms", "er");
  ok("Lincoln 'er' in Phonograms → here (parked), the German card in alsoIn", er.kind === "here" && er.state === "parked" && er.alsoIn.length === 1 && er.alsoIn[0].deck === "German", er);
  const er2 = c.owFind("lincoln", null, "Vocabulary", "er");
  ok("Lincoln 'er' in a third deck → elsewhere, with both cards listed", er2.kind === "elsewhere" && er2.alsoIn.length === 1, er2);
  c.masteryKid = "ellis";
  const n = c.owFind("ellis", null, "Science", "noun");
  ok("Ellis 'noun' (lowercase) finds the Grammar 'Noun' → elsewhere", n.kind === "elsewhere" && n.id === "ell_noun" && n.deck === "Grammar", n);
  const eco = c.owFind("ellis", null, "Vocabulary", "ecosystem");
  ok("Ellis 'ecosystem' → elsewhere (Science), RS4K's not-started card as information", eco.kind === "elsewhere" && eco.deck === "Science" && eco.alsoIn.some(a => a.where === "unit" && a.unit === "rs4k_4" && a.state === "not started"), eco);
  const atm = c.owFind("ellis", null, "Vocabulary", "atmosphere");
  ok("a word only in another unit's list is information, never the hit → new with alsoIn", atm.kind === "new" && atm.alsoIn.length === 1 && atm.alsoIn[0].unit === "rs4k_4", atm);
  const w = world(); w.ctx.masteryData.lincoln_ourwords = { ow1: { v: 1, kind: "add", unit: "all_about_spelling", deck: "AAS Words", name: "clench", at: { lesson: 207 }, src: "quick", order: 1, ts: 1 } };
  w.ctx.masteryData.lincoln_custom_items.push({ cat: "AAS Words", name: "clench", ow: "ow1", ch: 207 });
  const wt = w.ctx.owFind("lincoln", "all_about_spelling", "AAS Words", "clench");
  ok("an add record with no card yet → WAITING (its record and spot ride along)", wt.kind === "waiting" && wt.rec.owId === "ow1" && wt.at.lesson === 207, wt);
  const wl = w.ctx.owList("lincoln", { deck: "AAS Words" });
  ok("owList shows it as waiting", wl.length === 1 && wl[0].state === "waiting" && wl[0].card === null, wl);
}
console.log("\n── §8.4 the planner is pure ──");
{
  const w = world(), c = w.ctx, before = JSON.stringify(c.masteryData);
  const plan = c.owPlanAdd("lincoln", { unit: "all_about_spelling", deck: "AAS Words", src: "quick", rows: [{ name: "clench", back: "to hold tight" }, { name: "keep" }, { name: "three" }, { name: "slept" }, { name: "stiff", start: "wait", at: { lesson: 207 } }, { name: "clench" }, { name: "  " }] });
  ok("one row per distinct word; the actions follow the look-up", plan.rows.map(r => r.name + ":" + r.action).join() === "clench:add,keep:leave,three:mint,slept:mint,stiff:wait", plan.rows.map(r => r.name + ":" + r.action));
  ok("no db call, masteryData untouched", w.dbCalls.length === 0 && w.writes.length === 0 && JSON.stringify(c.masteryData) === before);
  const r0 = plan.rows[0];
  ok("the record: v1 · add · unit · deck · exact name · back · src · order 1 · ts; no cardId", r0.rec.v === 1 && r0.rec.kind === "add" && r0.rec.unit === "all_about_spelling" && r0.rec.deck === "AAS Words" && r0.rec.name === "clench" && r0.rec.back === "to hold tight" && r0.rec.src === "quick" && r0.rec.order === 1 && r0.rec.ts > 0 && r0.rec.cardId === undefined, r0.rec);
  ok("its card: subject = deck, prompt = name, answer = back, FLASH (a back never makes it recite), straight to the ladder", r0.item.subject === "AAS Words" && r0.item.prompt === "clench" && r0.item.answer === "to hold tight" && r0.item.review_mode === "flash" && r0.item.status === "active" && r0.item.tier === "every_other_day" && r0.item.placed === true, r0.item);
  ok("the unit hit mints the book's card (exact spelling), no record", plan.rows[2].item.prompt === "three" && !plan.rows[2].rec);
  ok("the bank hit mints the bank word, no record", plan.rows[3].item.prompt === "slept" && !plan.rows[3].rec);
  const w4 = plan.rows[4];
  ok("'wait' → a record and a bank entry {cat,name,ow,ch} — never def, no card", w4.rec.at.lesson === 207 && !w4.item && JSON.stringify(w4.bankEntry) === JSON.stringify({ cat: "AAS Words", name: "stiff", ow: w4.rec.owId, ch: 207 }) && !("def" in w4.bankEntry), w4.bankEntry);
  ok("orders climb within the plan", plan.rows[4].rec.order === 2);
  const p2 = c.owPlanAdd("lincoln", { unit: null, deck: "Spelling Rules", src: "mathrules", rows: [{ name: "Order of operations", back: "Multiply before you add.", card: { review_mode: "recite", knowledge_type: "rule", example: "3 + 4 × 2 = 11" } }, { name: "Silent e rule" }] });
  ok("card.review_mode recite is honoured; the card fields ride the record and the card", p2.rows[0].item.review_mode === "recite" && p2.rows[0].item.knowledge_type === "rule" && p2.rows[0].item.example === "3 + 4 × 2 = 11" && p2.rows[0].rec.card.example === "3 + 4 × 2 = 11", p2.rows[0]);
  ok("a bank word with a def mints as the bank mints it (recite, its rule) — the unit's card, not ours", p2.rows[1].action === "mint" && p2.rows[1].item.review_mode === "recite" && p2.rows[1].item.answer === "Drop the e before a vowel suffix.", p2.rows[1].item);
  const p3 = c.owPlanAdd("lincoln", { unit: null, deck: "Vocabulary", src: "quick", rows: [{ name: "keep" }, { name: "er", choice: "own", back: "/er/" }] });
  ok("a card elsewhere → LINK by default: cardId + linkDeck, no card of its own", p3.rows[0].action === "link" && p3.rows[0].rec.kind === "link" && p3.rows[0].rec.cardId === "lin_keep" && p3.rows[0].rec.linkDeck === "Spelling" && !p3.rows[0].item, p3.rows[0].rec);
  ok("…or its OWN card here when Mom says so", p3.rows[1].action === "own" && p3.rows[1].rec.kind === "add" && p3.rows[1].item.subject === "Vocabulary" && p3.rows[1].item.answer === "/er/", p3.rows[1]);
  const p4 = c.owPlanAdd("lincoln", { unit: "all_about_spelling", deck: "AAS Words", rows: [{ name: "keep", choice: "bring", where: "weekly" }, { name: "cat", start: "learn" }, { name: "dog", start: "learn" }] });
  ok("a card here can be brought back (by index, Mom's placement)", p4.rows[0].action === "bring" && p4.rows[0].idx === 3 && p4.rows[0].where === "weekly");
  ok("'learn' starts in introduction up to the intro cap, then parked (cap 1 here)", p4.rows[1].item.status === "introduction" && p4.rows[2].item.status === "parked", [p4.rows[1].item.status, p4.rows[2].item.status]);
  ok("no deck → not ok", c.owPlanAdd("lincoln", { rows: [{ name: "x" }] }).ok === false);
}
console.log("\n── §10 the writer: only its paths, append-only ──");
{
  const w = world(), c = w.ctx, items0 = JSON.stringify(c.masteryData.lincoln), len0 = c.masteryData.lincoln.length;
  const plan = c.owPlanAdd("lincoln", { unit: "all_about_spelling", deck: "AAS Words", src: "quick", rows: [{ name: "clench", back: "to hold tight" }, { name: "three" }, { name: "stiff", start: "wait", at: { lesson: 207 } }, { name: "keep" }] });
  const res = c.owApplyAdd(plan);
  ok("written: 2 records, 2 cards, 1 bank entry; 'keep' left alone", res.written.records === 2 && res.written.items === 2 && res.written.bank === 1 && res.skipped.length === 0, res);
  const owId = plan.rows[0].rec.owId;
  ok("exactly: set the two records, ONE update of mastery/lincoln by index, ONE bank transaction", names(w.writes).join("|") === ["set mastery/lincoln_ourwords/" + owId, "set mastery/lincoln_ourwords/" + plan.rows[2].rec.owId, "update mastery/lincoln", "transaction mastery/lincoln_custom_items"].join("|"), names(w.writes));
  const up = w.writes.find(x => x[0] === "update")[2];
  ok("the cards are appended at items.length and items.length+1, nothing else in the update", Object.keys(up).join() === len0 + "," + (len0 + 1) && up[len0].prompt === "clench" && up[len0 + 1].prompt === "three", Object.keys(up));
  ok("every pre-existing index is byte-identical", JSON.stringify(c.masteryData.lincoln.slice(0, len0)) === items0);
  const rec = w.writes[0][2];
  ok("the stored record carries no owId field (the key is the id) and no cardId", rec.owId === undefined && rec.cardId === undefined && rec.name === "clench" && rec.back === "to hold tight");
  const tx = w.writes.find(x => x[0] === "transaction")[2];
  ok("the bank transaction appends {cat,name,ow,ch} once — no def", tx.length === 1 && tx[0].cat === "AAS Words" && tx[0].name === "stiff" && tx[0].ow === plan.rows[2].rec.owId && tx[0].ch === 207 && !("def" in tx[0]), tx);
  ok("the local home holds both records and the screen repaints once", Object.keys(c.masteryData.lincoln_ourwords).length === 2 && c.repaints === 1);
  ok("no path under unitStudies or notebookSettings", w.writes.every(x => !/^(unitStudies|notebookSettings)/.test(x[1])) && !/db\.ref\("unitStudies|notebookSettings/.test(BLOCK));
  ok("the resolver now answers 'clench' from the record (deck given); without the deck, exactly as today (nothing)", c.mastGetDef("lincoln", "clench", "AAS Words") === "to hold tight" && c.mastGetDef("lincoln", "clench") === "");
  const l = c.owList("lincoln", { deck: "AAS Words" });
  ok("owList: clench on the ladder (every other day), stiff waiting, in order", l.map(r => r.name + "·" + r.state).join() === "clench·every other day,stiff·waiting", l.map(r => r.name + "·" + r.state));
}
console.log("\n── re-check at apply, dry run, Mom-only ──");
{
  const w = world(), c = w.ctx;
  const plan = c.owPlanAdd("lincoln", { unit: "all_about_spelling", deck: "AAS Words", rows: [{ name: "clench" }] });
  c.masteryData.lincoln.push({ id: "lin_clench", subject: "AAS Words", prompt: "Clench", status: "active", tier: "weekly" });   // another device added it between plan and apply
  const res = c.owApplyAdd(plan);
  ok("a word added meanwhile → skipped, no second card, nothing written", res.skipped.length === 1 && /already a card here/.test(res.skipped[0].why) && w.writes.length === 0 && c.masteryData.lincoln.filter(i => c.owSame(i.prompt, "clench")).length === 1, res.skipped);
}
{
  const w = world({ dry: true }), c = w.ctx, len0 = c.masteryData.lincoln.length;
  const res = c.owApplyAdd(c.owPlanAdd("lincoln", { unit: "all_about_spelling", deck: "AAS Words", rows: [{ name: "clench" }, { name: "stiff", start: "wait" }] }));
  ok("dry run: the screen updates (local state), the database sees nothing", w.writes.length === 0 && res.written.records === 2 && c.masteryData.lincoln.length === len0 + 1 && Object.keys(c.masteryData.lincoln_ourwords).length === 2);
}
{
  const w = world({ mom: false }), c = w.ctx, before = JSON.stringify(c.masteryData);
  const res = c.owApplyAdd(c.owPlanAdd("lincoln", { unit: "all_about_spelling", deck: "AAS Words", rows: [{ name: "clench" }] }));
  ok("not Mom, no PIN → nothing written, nothing changed", w.writes.length === 0 && res.written.records === 0 && JSON.stringify(c.masteryData) === before && res.skipped[0].why === "Mom only");
  const w2 = world({ mom: false, pin: true });
  ok("the admin PIN counts as Mom (the Mastery ＋ guard)", w2.ctx.owApplyAdd(w2.ctx.owPlanAdd("lincoln", { unit: null, deck: "AAS Words", rows: [{ name: "clench" }] })).written.records === 1);
}
console.log("\n── link, bring back, start a waiting word ──");
{
  const w = world(), c = w.ctx, len0 = c.masteryData.lincoln.length;
  c.owApplyAdd(c.owPlanAdd("lincoln", { unit: null, deck: "Vocabulary", rows: [{ name: "keep" }] }));
  ok("a link writes ONE record and nothing else — the Spelling card is untouched", names(w.writes).join() === "set mastery/lincoln_ourwords/" + Object.keys(c.masteryData.lincoln_ourwords)[0] && c.masteryData.lincoln.length === len0 && c.masteryData.lincoln[2].tier === "weekly", names(w.writes));
  const lk = c.owList("lincoln", { deck: "Vocabulary" })[0];
  ok("owList resolves the link to its card (weekly)", lk.kind === "link" && lk.card && lk.card.id === "lin_keep" && lk.state === "weekly", lk);
}
{
  const w = world(), c = w.ctx;
  c.owApplyAdd(c.owPlanAdd("lincoln", { unit: "all_about_spelling", deck: "AAS Words", rows: [{ name: "keep", choice: "bring", where: "learn" }] }));
  const it = c.masteryData.lincoln[3];
  ok("bring back: the graduated card comes back to learning by index, one update, no record", it.status === "introduction" && it.cameBack && it.cameBack.from === "graduated" && names(w.writes).join() === "update mastery/lincoln" && Object.keys(w.writes[0][2]).join() === "3" && !c.masteryData.lincoln_ourwords);
}
{
  const w = world(), c = w.ctx;
  c.masteryData.lincoln_ourwords = { ow1: { v: 1, kind: "add", unit: "all_about_spelling", deck: "AAS Words", name: "clench", back: "to hold tight", card: { sentence: "Clench your fist." }, at: { lesson: 207 }, src: "spelltest", order: 1, ts: 1 } };
  c.masteryData.lincoln_custom_items.push({ cat: "AAS Words", name: "clench", ow: "ow1", ch: 207 });
  const plan = c.owPlanAdd("lincoln", { unit: "all_about_spelling", deck: "AAS Words", rows: [{ name: "clench", choice: "start" }] });
  const res = c.owApplyAdd(plan);
  ok("a waiting word starts now: its card carries the record's back and card fields; the record is not rewritten", plan.rows[0].action === "start" && res.written.items === 1 && res.written.records === 0 && names(w.writes).join() === "update mastery/lincoln", names(w.writes));
  const it = Object.values(w.writes[0][2])[0];
  ok("…flash, answer = the back, sentence copied", it.review_mode === "flash" && it.answer === "to hold tight" && it.sentence === "Clench your fist." && it.subject === "AAS Words", it);
  ok("the same plan applied again → the card is here now → skipped, nothing written", (() => { const n = w.writes.length; const r2 = c.owApplyAdd(plan); return r2.skipped.length === 1 && w.writes.length === n; })());
}
console.log("\n── copy keeps the id; twice is a no-op ──");
{
  const w = world(), c = w.ctx;
  const rows = [{ name: "clench", back: "to hold tight", owId: "owCOPY1", from: { kid: "lincoln" } }];
  const p1 = c.owPlanAdd("ellis", { unit: "all_about_spelling", deck: "AAS Words", src: "copy", rows });
  ok("the copy's record keeps the source owId and names where it came from", p1.rows[0].rec.owId === "owCOPY1" && p1.rows[0].rec.from.kid === "lincoln" && p1.rows[0].rec.src === "copy");
  c.owApplyAdd(p1); const n = w.writes.length;
  ok("written under ellis at that id", w.writes[0][1] === "mastery/ellis_ourwords/owCOPY1" && n === 2);
  const p2 = c.owPlanAdd("ellis", { unit: "all_about_spelling", deck: "AAS Words", src: "copy", rows });
  const r2 = c.owApplyAdd(p2);
  ok("copying twice: the look-up finds the card here → nothing new is written", p2.rows[0].action === "leave" && r2.written.records === 0 && w.writes.length === n);
}
console.log("\n── the block itself ──");
{
  ok("no 🔀 anywhere in index.html", src.indexOf("🔀") < 0);
  ok("no kid's name in the block", !/lincoln|ellis|lucy|julian/i.test(BLOCK.replace(/\/\/.*$/gm, "")));
  ok("every write sits behind the live check (db && !_dryRun)", (BLOCK.match(/db\.ref\(/g) || []).length === 3 && (BLOCK.match(/if\(live\) db\.ref\(/g) || []).length === 3);
  ok("the writer is Mom-only (momHere or the admin PIN)", /function owApplyAdd[\s\S]*?momHere\(\)[\s\S]*?mastAdminPinOk/.test(BLOCK));
  ok("the block never writes a whole array (no set of mastery/<kid> or _custom_items)", !/db\.ref\("mastery\/"\+kid\)\.set|_custom_items"\)\.set/.test(BLOCK));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
