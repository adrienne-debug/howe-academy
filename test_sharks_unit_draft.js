// 🦈 Types of Sharks — unit DRAFT check (her ask 2026-11-08: "a unit on different types of sharks … at this level, it
//   would be picture and name, but you can also go ahead and add information cards if you want to for the next level").
//   sharks_unit_DRAFT.json is a unitStudies/<id> record she loads herself; nothing here writes anywhere. Runs the REAL app
//   functions sliced out of index.html (ubSlug, _unitPortrait, _ustCards, _ustApply …) on the draft:
//   · the id is what the Units Builder would make from the title; no key the database refuses
//   · every card of both decks draws a picture through _unitPortrait; each picture is a JPEG data URI that decodes,
//     ≤ 420 px (the app's own unitEditPhoto size) and under 80 KB; one credit per picture, licence PD / CC0 / CC BY(-SA)
//   · Stage 1 = "Sharks" (picture → name, no backs); Stage 2 = "Shark Facts" (one short fact each, its source kept)
//   · staged enroll (_ustApply): Stage 1 seeds only Sharks (3 to start), Stage 2 only Shark Facts with the fact as answer
//   · no family or kid names, no enrolled / kidStage — the draft enrolls nobody
// v2 (her words 2026-11-10, told it had 18 of 500+ species: "i want a bigger list for sure"): 56 sharks. v1 was imported
//   into a live database that night, so its 18 cards stay first and byte-identical (names, order, groups, facts, pictures,
//   credits) — checked against the v1 commit itself; the new sharks are appended, each with a one-sentence fact.
//   run: node test_sharks_unit_draft.js
const fs = require("fs"), path = require("path"), vm = require("vm"), cp = require("child_process");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const raw = fs.readFileSync(path.join(__dirname, "sharks_unit_DRAFT.json"), "utf8");
const u = JSON.parse(raw);
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
// one top-level function, from "function name(" to the next top-level line
const fn = name => { const i = src.indexOf("\nfunction " + name + "("); if (i < 0) throw new Error("no function " + name);
  const m = /\n(function |\/\/|const |let )/g; m.lastIndex = i + 1; const e = m.exec(src); return src.slice(i + 1, e ? e.index : undefined); };
const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, masteryData: {}, UNIT_BOOK_MAPS: {} };
vm.createContext(ctx);
vm.runInContext(["ubSlug", "mastDefKeyOk", "_unitPortrait", "_unitStagedEnrollPending", "_ustFamNum", "_ustCards", "_ustFamilies",
  "_ustStageDef", "_ustSlug", "_ustApply"].map(fn).join("\n"), ctx);
const decks = u.decks || [], D1 = decks[0] || {}, D2 = decks[1] || {};
const allCards = decks.flatMap(d => (d.cards || []).map(c => ({ d, c })));

console.log("── the record ──");
ok("id is what the Units Builder makes from the title (ubSlug)", u.id === ctx.ubSlug(u.title), [u.id, ctx.ubSlug(u.title)]);
ok("title, emoji and a one-line desc", u.title === "Types of Sharks" && u.emoji === "\u{1F988}" && typeof u.desc === "string" && u.desc.length > 20 && u.desc.length <= 240);
ok("no enrolled / kidStage / starter — the draft enrolls nobody and is a database unit", !u.enrolled && !u.kidStage && !u.starter);
const badKeys = []; (function walk(o, p) { if (o && typeof o === "object") Object.keys(o).forEach(k => { if (/[.#$\[\]\/]/.test(k) || k === "") badKeys.push(p + "/" + k); walk(o[k], p + "/" + k); }); })(u, "");
ok("no key the Realtime Database refuses (. # $ [ ] /)", badKeys.length === 0, badKeys.slice(0, 5));
ok("two stages: 1 picture & name, 2 facts — a staged unit (enroll picks the stage)", ctx._unitStagedEnrollPending(u) && JSON.stringify((u.stages || []).map(s => s.n)) === "[1,2]" && u.stages.every(s => s.label && s.weeklyFrom === 0));

console.log("── the decks ──");
ok("deck 1 is Sharks: flip, picture → name, 3 at a time, stage 1", D1.key === "Sharks" && D1.mode === "flip" && D1.flipFace === "name" && D1.introCap === 3 && D1.stage === 1);
ok("deck 2 is Shark Facts: flip, name + picture → fact, 3 at a time, stage 2", D2.key === "Shark Facts" && D2.mode === "flip" && D2.flipFace === "desc" && D2.introCap === 3 && D2.stage === 2);
ok("40–60 sharks, the same ones in both decks, same order", D1.cards.length >= 40 && D1.cards.length <= 60 && JSON.stringify(D1.cards.map(c => c.name)) === JSON.stringify(D2.cards.map(c => c.name)), D1.cards.length);
ok("no two sharks share a name, even ignoring capitals and accents", new Set(D1.cards.map(c => c.name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase())).size === D1.cards.length);
ok("every card is in one of the five v1 groups", D1.cards.concat(D2.cards).every(c => ["Famous Sharks", "Giant Sharks", "Open-Ocean & Reef Sharks", "Sea-Floor Sharks", "Deep & Cold Sharks"].includes(c.group)));
decks.forEach(d => {
  const names = d.cards.map(c => c.name), orders = d.cards.map(c => c.order);
  ok(d.key + ": names unique and non-empty", new Set(names).size === names.length && names.every(n => typeof n === "string" && n.trim() === n && n.length > 0));
  ok(d.key + ": order 1…n, unique", JSON.stringify(orders) === JSON.stringify(names.map((_, i) => i + 1)));
  ok(d.key + ": every card is on its deck's stage and has a group/family", d.cards.every(c => c.stage === d.stage && c.group && c.family === c.group));
  ok(d.key + ": every name can be a definitions key (mastDefKeyOk)", names.every(n => ctx.mastDefKeyOk(n)));
});
ok("Sharks cards have no back (Pre-K: picture and name only)", D1.cards.every(c => c.def == null && c.bio == null && c.info == null));
ok("every Shark Facts card has one short fact (≤ 130 chars, ends with . or !)", D2.cards.every(c => typeof c.def === "string" && c.def.length >= 20 && c.def.length <= 130 && /[.!]$/.test(c.def)), D2.cards.map(c => c.def.length));
const sentences = s => (s.match(/[.!?](\s|$)/g) || []).length;
ok("every shark added in v2 has a one-sentence fact (v1's 18 keep their words as imported)", D2.cards.slice(18).every(c => sentences(c.def) === 1), D2.cards.slice(18).filter(c => sentences(c.def) !== 1).map(c => c.name));

console.log("── v1's 18 sharks are untouched (v1 is in a live database) ──");
{
  // the v1 commit itself, so this still means something once v2 is on main; origin/main only if that commit isn't here
  let v1 = null;
  for (const ref of ["b758651", "origin/main"]) { try { v1 = JSON.parse(cp.execSync("git show " + ref + ":sharks_unit_DRAFT.json", { cwd: __dirname, maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] }).toString()); if (v1.version === 1) break; v1 = null; } catch (e) { v1 = null; } }
  ok("v1 found in git (the 18 cards as imported)", !!v1 && v1.decks[0].cards.length === 18);
  if (v1) {
    ok("same id and title; version 2", u.id === v1.id && u.title === v1.title && u.version === 2);
    ok("same stages and the same deck settings", JSON.stringify(u.stages) === JSON.stringify(v1.stages) && decks.every((d, i) => JSON.stringify(Object.assign({}, d, { cards: 0 })) === JSON.stringify(Object.assign({}, v1.decks[i], { cards: 0 }))));
    ok("both decks: the first 18 cards are v1's, field for field (name, group, order, stage, fact)", decks.every((d, i) => JSON.stringify(d.cards.slice(0, 18)) === JSON.stringify(v1.decks[i].cards)));
    const v1keys = Object.keys(v1.visuals);
    ok("v1's 36 pictures and credit lines are byte-identical", v1keys.length === 36 && v1keys.every(k => u.visuals[k] && u.visuals[k].imageUrl === v1.visuals[k].imageUrl && u.visuals[k].credit === v1.visuals[k].credit));
    ok("v1's 18 credits come first, unchanged", JSON.stringify(u.credits.slice(0, 18)) === JSON.stringify(v1.credits));
    ok("new sharks are appended: order 19…n, none reuses a v1 name", D1.cards.slice(18).every((c, i) => c.order === 19 + i && !v1.decks[0].cards.some(o => o.name === c.name)));
  }
}

console.log("── the pictures ──");
const vkeys = Object.keys(u.visuals || {}), want = allCards.map(x => x.d.key + "_" + x.c.name);
ok("one visual per card, keyed deck_name, nothing extra", vkeys.length === want.length && want.every(k => vkeys.includes(k)));
const jpgSize = b => { let i = 2; while (i < b.length) { if (b[i] !== 0xFF) return null; const m = b[i + 1], L = b.readUInt16BE(i + 2);
  if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) }; i += 2 + L; } return null; };
const picFail = [], sizes = [];
allCards.forEach(({ d, c }) => {
  const p = ctx._unitPortrait(u, "kid", d.key, c.name); const url = p && p.img;
  const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+=*)$/.exec(url || "");
  if (!m) return picFail.push(d.key + " " + c.name + ": no JPEG data URI");
  const b = Buffer.from(m[1], "base64"); const wh = jpgSize(b); sizes.push(b.length);
  if (b.toString("base64") !== m[1]) picFail.push(c.name + ": base64 does not round-trip");
  if (b[0] !== 0xFF || b[1] !== 0xD8 || b[b.length - 2] !== 0xFF || b[b.length - 1] !== 0xD9) picFail.push(c.name + ": not a whole JPEG");
  if (!wh || wh.w > 420 || wh.h > 420 || wh.w < 200) picFail.push(c.name + ": size " + JSON.stringify(wh));
  if (b.length > 80 * 1024) picFail.push(c.name + ": " + b.length + " bytes");
  if (!(u.visuals[d.key + "_" + c.name].credit || "").includes("Wikimedia Commons")) picFail.push(c.name + ": no credit line");
});
ok("every card draws a picture through the app's _unitPortrait: a whole JPEG, ≤ 420 px, < 80 KB, credited", picFail.length === 0, picFail.slice(0, 5));
ok("a Shark Facts card shows the same photo as its Sharks card", D1.cards.every(c => !!(u.visuals["Sharks_" + c.name] || {}).imageUrl && (u.visuals["Sharks_" + c.name] || {}).imageUrl === (u.visuals["Shark Facts_" + c.name] || {}).imageUrl));

console.log("── credits ──");
const cr = u.credits || [];
ok("one credit per shark, in card order", cr.length === D1.cards.length && cr.every((x, i) => x.card === D1.cards[i].name));
ok("each credit: file title, author, licence, Commons source", cr.every(x => x.title && x.author && /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(x.source)));
ok("licences are public domain, CC0 or CC BY(-SA)", cr.every(x => /^(Public domain|CC0|CC BY(-SA)? \d\.\d)$/.test(x.license)), cr.map(x => x.license));
ok("each fact keeps its source link", cr.every(x => /^https:\/\//.test(x.factSource || "")));

console.log("── nobody's name in it ──");
const text = raw.replace(/data:image\/jpeg;base64,[A-Za-z0-9+/=]+/g, "");
const names = /\b(howe|adrienne|andrew|julian|lincoln|ellis|lucy|sara|caleb|taylor|kenzie|dewalt|burris|mom|dad)\b/i.exec(text);
ok("no family or kid names anywhere (pictures left out of the search)", !names, names && names[0]);

console.log("── staged enroll, the real _ustApply ──");
{
  ctx.masteryData = {};
  const w = ctx._ustApply(u, "kid", 1, "", "", "");
  const items = Object.values(w.iu), bank = Object.values(w.bu);
  ok("Stage 1: only Sharks cards — 3 start (introCap), every shark waits in the bank", items.length === 3 && items.every(i => i.subject === "Sharks" && i.status === "introduction") && bank.length === D1.cards.length && bank.every(b => b.cat === "Sharks"), [items.length, bank.length]);
  ok("Stage 1: the first three are the first three sharks, no answer (the kid names it)", JSON.stringify(items.map(i => i.prompt)) === JSON.stringify(D1.cards.slice(0, 3).map(c => c.name)) && items.every(i => i.answer == null));
  ok("Stage 1: no definitions written, no deck held", Object.keys(w.defs).length === 0 && Object.keys(w.hold).length === 0 && w.modes.Sharks === "flip" && !("Shark Facts" in w.modes));
  // Stage 2 on top of Stage 1 (Mom's "move up")
  const m = ctx.masteryData.kid, before = m.length;
  const w2 = ctx._ustApply(u, "kid", 2, "", "", "");
  const items2 = Object.values(w2.iu);
  ok("Stage 2: only Shark Facts — 3 start, each with its fact as the answer", items2.length === 3 && items2.every(i => i.subject === "Shark Facts" && i.answer === D2.cards.find(c => c.name === i.prompt).def) && Object.keys(w2.modes).join() === "Shark Facts");
  ok("Stage 2: Stage 1's cards untouched; ids never repeat", m.slice(0, before).every(i => i.subject === "Sharks") && new Set(m.map(i => i.id)).size === m.length);
  ok("Stage 2: a definition for each shark", Object.keys(w2.defs).length === D2.cards.length);
}

console.log("── size ──");
const total = Buffer.byteLength(raw), pics = sizes.reduce((a, b) => a + b, 0);
console.log("  file " + (total / 1048576).toFixed(2) + " MB · " + sizes.length + " pictures (" + sizes.length / 2 + " different) · largest " + Math.round(Math.max(...sizes) / 1024) + " KB");
ok("the whole draft is under 6 MB (it's a Realtime Database node; ~4.5 MB with 56 sharks)", total < 6 * 1048576, total);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
