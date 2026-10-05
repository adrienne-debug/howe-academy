/*
 * Node tests — 🚩 Problem Words (step 3 of the AAS plan; her "okay go", 2026-10-04). One word = one card: a word is
 * looked up first — an existing card (even graduated) COMES BACK; an AAS word they haven't reached is added as that
 * AAS card; only a word found nowhere becomes a new card. Mom picks where each goes (Learn it · Every few days ·
 * Weekly · Monthly check). 📸 a graded page → AI lists the words + what was marked wrong. Runs the REAL block.
 *   run:  node test_problem_words.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const CODE = cut("// AAS_START", "// AAS_END") + "\n" + cut("// SPELLTEST_START", "// SPELLTEST_END") + "\n" + cut("// PROBLEMWORDS_START", "// PROBLEMWORDS_END");

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

function world(o) {
  o = o || {};
  const writes = [], toasts = [], els = {};
  const document = { body: { appendChild: e => { els[e.id] = e; } }, getElementById: id => els[id] || null, createElement: () => ({ style: {}, remove() { delete els[this.id]; } }) };
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, document, Promise,
    momHere: () => o.mom !== false, mastAdminPinOk: false, masteryKid: "lincoln", _dryRun: () => false,
    masteryData: o.mastery, db: { ref: p => ({ set: v => writes.push(["set", p, v]), update: v => writes.push(["update", p, v]), push: v => writes.push(["push", p, v]) }) },
    HA_LS: { setItem: () => {} }, gwShowToast: m => toasts.push(m), _mastRe: () => {}, mastGetPrintNum: () => 3,
    mastStampNextDue: (it, items, tier) => { it.next_due = tier === "monthly" ? 28 : 7; },
    mastDrillSettings: () => ({ ladder: ["every_other_day", "weekly"], cat_intro_max: o.caps || {} }),
    mastIntroMaxFor: (cat, s) => ((s && s.cat_intro_max) || {})[cat] != null ? s.cat_intro_max[cat] : 3 };
  vm.createContext(ctx);
  vm.runInContext(CODE + "\nObject.defineProperty(this,'pwUI',{get:()=>pwUI,set:v=>{pwUI=v;}});", ctx);
  ctx.unitStudies = { all_about_spelling: { id: "all_about_spelling", cardLessons: true, decks: ctx._aasDecks(), kidStage: { lincoln: { stage: 2, subject: "aas" } } } };
  return { ctx, writes, toasts, els };
}
const LIN = () => ({
  lincoln: [
    { id: "lin_keep", subject: "Spelling", prompt: "keep", answer: "keep", status: "active", tier: "weekly" },
    { id: "lin_keep2", subject: "AAS Words", prompt: "keep", answer: "keep", status: "active", tier: "graduated" },
    { id: "lin_been", subject: "AAS Words", prompt: "been", answer: "been", status: "active", tier: "graduated" },
    { id: "lin_7x8", subject: "Math Facts", prompt: "7×8", answer: "56", status: "introduction", tier: "daily" }],
  lincoln_custom_items: [], lincoln_settings: {} });

console.log("── splitting what Mom types ──");
{
  const c = world({ mastery: LIN() }).ctx;
  ok("commas, new lines and semicolons; duplicates once; order kept", JSON.stringify(c.pwSplit("keep, three\nbeen; Keep\n\n fifteen ")) === JSON.stringify(["keep", "three", "been", "fifteen"]));
}
console.log("\n── one word = one card: the lookup ──");
{
  const c = world({ mastery: LIN() }).ctx;
  const k = c.pwLookup("lincoln", "Keep");
  ok("'keep' is found (case doesn't matter) — the AAS Words card wins over the Spelling copy", k.kind === "existing" && k.deck === "AAS Words" && k.tier === "graduated" && k.dupes === 1, k);
  ok("…and the panel says it's coming back", /♻️ Already a card in AAS Words \(graduated\) — bringing it back/.test(c.pwFindText(k)));
  const t = c.pwLookup("lincoln", "three");
  ok("'three' isn't a card yet but IS an AAS word → AAS Level 2 · Lesson 17", t.kind === "aas" && t.level === 2 && t.lesson === 17, t);
  ok("'jefferson' is found nowhere → new", c.pwLookup("lincoln", "jefferson").kind === "new");
  ok("'Mr.' matches the AAS card stored as 'Mr․'", c.pwLookup("lincoln", "Mr.").kind === "aas");
}
console.log("\n── adding ──");
{
  const w = world({ mastery: LIN() }), c = w.ctx;
  c.pwOpen("lincoln"); c.pwUI.text = "been, three, jefferson"; c.pwFromText();
  ok("review lists all three, each with what the app found", c.pwUI.step === "review" && c.pwUI.rows.map(r => r.find.kind).join() === "existing,aas,new");
  c.pwSet(2, "deck", "History"); c.pwSet(2, "where", "weekly");
  const r = c.pwApply();
  const items = c.masteryData.lincoln, get = n => items.filter(i => i.prompt === n);
  ok("'been' came BACK — same card, now learning, marked came back", get("been").length === 1 && get("been")[0].id === "lin_been" && get("been")[0].status === "introduction" && get("been")[0].cameBack.from === "graduated");
  ok("…and the graduated comeback is logged for the dashboard", w.writes.some(x => x[0] === "push" && x[1] === "mastery/lincoln_comebacks" && x[2].name === "been" && x[2].from === "graduated"));
  ok("'three' became the AAS Words card, tagged with its lesson in the bank", get("three").length === 1 && get("three")[0].subject === "AAS Words" && c.masteryData.lincoln_custom_items.some(b => b.cat === "AAS Words" && b.name === "three" && b.ch === 17));
  ok("'jefferson' is a new History card on weekly", get("jefferson")[0].subject === "History" && get("jefferson")[0].tier === "weekly" && get("jefferson")[0].status === "active" && get("jefferson")[0].next_due === 7);
  ok("every card carries the 🚩 problem stamp", ["been", "three", "jefferson"].every(n => get(n)[0].problem && get(n)[0].problem.ts));
  ok("writes are targeted (cards by index)", w.writes.some(x => x[0] === "update" && x[1] === "mastery/lincoln" && Object.keys(x[2]).every(k => /^\d+$/.test(k))));
  ok("a one-line summary", /🚩 1 brought back · 1 AAS · 1 new/.test(w.toasts.join(" ")), w.toasts);
}
{
  const m = LIN(); for (let i = 0; i < 3; i++) m.lincoln.push({ id: "s" + i, subject: "Spelling", prompt: "w" + i, status: "introduction", tier: "daily" });
  const w = world({ mastery: m, caps: { Spelling: 3 } }), c = w.ctx;
  c.pwOpen("lincoln"); c.pwUI.text = "jefferson"; c.pwFromText(); c.pwApply();
  const j = c.masteryData.lincoln.find(i => i.prompt === "jefferson");
  ok("Learn it past the deck's learning cap → waits PARKED (steps in as a slot opens)", j.status === "parked", j);
}
{
  const w = world({ mastery: LIN() }), c = w.ctx;
  c.pwOpen("lincoln"); c.pwUI.text = "fifteen"; c.pwFromText(); c.pwSet(0, "where", "monthly"); c.pwApply();
  const f = c.masteryData.lincoln.find(i => i.prompt === "fifteen");
  ok("Monthly check → active/monthly with its next check booked", f.status === "active" && f.tier === "monthly" && f.next_due === 28);
  ok("a brand-new Spelling deck is set to 🔊 Spell (spoken, never shown)", c.masteryData.lincoln_settings.cat_modes.Spelling === "spell");
}
{
  const w = world({ mastery: LIN() }), c = w.ctx;
  c.pwOpen("lincoln"); c.pwUI.text = "been, three"; c.pwFromText(); c.pwSet(1, "on", false); c.pwApply();
  ok("an unticked row is skipped", !c.masteryData.lincoln.some(i => i.prompt === "three"));
}
console.log("\n── 📸 the photo reader's answer ──");
{
  const c = world({ mastery: LIN() }).ctx;
  const list = c.pwParseAI('Here you go:\n{"words":[{"word":"they","missed":true,"wrote":"thay"},{"word":"were","missed":false,"wrote":""}]}');
  ok("JSON is pulled out of the reply", list.length === 2 && list[0].word === "they" && list[0].missed && list[0].wrote === "thay");
  c.pwOpen("lincoln"); c.pwToReview(list);
  ok("missed words come pre-ticked; right ones come unticked", c.pwUI.rows[0].on === true && c.pwUI.rows[1].on === false);
  ok("what they wrote is shown", /wrote <b>thay<\/b>/.test(world({ mastery: LIN() }).ctx && (c.pwRender(), c.document.getElementById("pw-panel").innerHTML)));
  ok("garbage → null (Mom types instead)", c.pwParseAI("sorry, I can't read that") === null);
}
console.log("\n── Mom only ──");
{
  const c = world({ mastery: LIN(), mom: false }).ctx;
  c.pwOpen("lincoln");
  ok("without Mom unlocked the panel doesn't open", c.pwUI === null);
}
console.log("\n── wiring ──");
ok("the drill page has the 🚩 Problem words button next to ＋", /onclick="pwOpen\(masteryKid\)"/.test(src) && src.indexOf('onclick="pwOpen(masteryKid)"') < src.indexOf('onclick="mastOpenAdd()"'));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
