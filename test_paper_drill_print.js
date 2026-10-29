/*
 * Node tests — 🖨 PAPERDRILL: print the NEXT drill on paper for a no-tech day (her ask 2026-10-28/29, Sara's Grandma
 * Wednesdays). Mom only. A tester's sheet (every card numbered, with its answer; a spelling word printed to read aloud)
 * and a picture sheet (picture cards only, 4 to a page, same numbers, no answers). The printed list is saved at
 * mastery/<kid>_paperDrills/<yyyymmdd> so a reprint matches and the paper can be graded later.
 * Runs the REAL PAPERDRILL block with the REAL drill clock (mastSchoolDayNum + getSchoolDays) and mastShuffleDeck.
 *   run:  node test_paper_drill_print.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
const CODE = 'const MAST_CLOCK_EPOCH="2026-01-01"; let _mastClockMemo={};\n' + ["getSchoolDays", "mastKidSchoolDows", "mastSchoolDayNum", "mastShuffleDeck"].map(slice).join("\n")
  + "\n" + cut("// PAPERDRILL_START", "// PAPERDRILL_END");

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

const KID = "kid1";
function world(o) {
  o = o || {};
  const writes = [], toasts = [], opened = [], dueCalls = [];
  const items = o.items || [];
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN,
    masteryKid: "other", calendarData: o.cal || {}, paceData: {}, today: o.today || "2026-10-27",
    masteryData: Object.assign({ [KID]: items, [KID + "_settings"]: { cat_modes: { Words: "spell" }, definitions: { "7×8": "56" } } }, o.mastery || {}),
    momHere: () => o.mom !== false, _dryRun: () => !!o.dry,
    db: { ref: p => ({ set: v => writes.push([p, v]) }) },
    gwShowToast: m => toasts.push(m), SL_KLBL: { [KID]: "Kid One" },
    MAST_ANIMAL_EMOJI: { Lion: "🦁" }, MAST_COLOR_MAP: { Red: "#ef4444" },
    mastGetCatMode: (k, c) => ((ctx.masteryData[k + "_settings"] || {}).cat_modes || {})[c] || "flip",
    mastGetDef: (k, p) => ((ctx.masteryData[k + "_settings"] || {}).definitions || {})[p] || "",
    owRuleBack: (k, it) => it.answer != null ? String(it.answer) : "",
    mastGetVisual: () => null,
    mastCatFace: s => (s === "Cats" ? "desc" : "name"),
    mastDueItems: (k, pn) => { dueCalls.push([k, pn]); return (o.due ? o.due(pn) : items).slice(); },
    window: { open: () => { const w = { document: { write: h => { w.html = h; }, close() {} }, print() {} }; opened.push(w); return w; } } };
  ctx.calToday = () => ctx.today;
  vm.createContext(ctx);
  vm.runInContext(CODE, ctx);
  return { ctx, writes, toasts, opened, dueCalls };
}

console.log("── the next school day ──");
{
  const w = world();
  ok("Tuesday night → Wednesday", w.ctx.pdNextDay(KID, "2026-10-27").iso === "2026-10-28");
  ok("Friday → Monday", w.ctx.pdNextDay(KID, "2026-10-30").iso === "2026-11-02");
  ok("its school-day number is one past today's", w.ctx.pdNextDay(KID, "2026-10-27").pn === w.ctx.mastSchoolDayNum(KID, "2026-10-27") + 1);
  const h = world({ cal: { holidays: { a: { start: "2026-11-02" } } } });
  ok("a Monday holiday is skipped → Tuesday", h.ctx.pdNextDay(KID, "2026-10-30").iso === "2026-11-03");
}

console.log("\n── each card on paper ──");
{
  const c = world().ctx;
  const sp = c.pdLine(KID, { id: "w", prompt: "garden", subject: "Words" });
  ok("a spelling word is printed for the tester to read aloud (and is its own answer)", sp.spell && sp.q === "garden" && sp.a === "garden" && !sp.pic);
  const mf = c.pdLine(KID, { id: "m", prompt: "7×8", subject: "Math Facts" });
  ok("a fact shows its answer", !mf.spell && !mf.pic && mf.q === "7×8" && mf.a === "56");
  const rl = c.pdLine(KID, { id: "r", prompt: "The TCH Rule", subject: "Spelling Rules", answer: "Tch may be used to spell /ch/ right after a short vowel." });
  ok("a rule card shows the rule as the answer", rl.a === "Tch may be used to spell /ch/ right after a short vowel.");
  const lt = c.pdLine(KID, { id: "l", prompt: "A", subject: "Letters" });
  ok("a plain text card with no back → its answer is itself", lt.q === "A" && lt.a === "A" && !lt.pic);
  const ph = c.pdLine(KID, { id: "p", prompt: "Excavator", subject: "Machines", imageUrl: "https://x/ex.jpg" });
  ok("a picture card (name on the back) → on the picture sheet, the name is the answer", ph.pic && ph.a === "Excavator" && ph.q === "");
  ok("an emoji card, an animal and a color are picture cards too", c.pdLine(KID, { prompt: "Sun", subject: "S", emoji: "☀️" }).pic
    && c.pdLine(KID, { prompt: "Lion", subject: "Animals" }).pic && c.pdLine(KID, { prompt: "Red", subject: "Colors" }).pic);
  c.masteryData[KID + "_settings"].definitions["Maine Coon"] = "A big, fluffy cat";
  const ds = c.pdLine(KID, { id: "c", prompt: "Maine Coon", subject: "Cats", emoji: "🐈" });
  ok("a picture card with the name on its front → picture + name shown, the back is the answer", ds.pic && ds.named && ds.q === "Maine Coon" && ds.a === "A big, fluffy cat");
}

const ITEMS = [
  { id: "a", prompt: "garden", subject: "Words" },
  { id: "b", prompt: "Excavator", subject: "Machines", imageUrl: "https://x/ex.jpg" },
  { id: "c", prompt: "7×8", subject: "Math Facts" },
  { id: "d", prompt: "Lion", subject: "Animals" },
  { id: "e", prompt: "Red", subject: "Colors" },
  { id: "f", prompt: "Sun", subject: "S", emoji: "☀️" },
  { id: "g", prompt: "Moon", subject: "S", emoji: "🌙" }];

console.log("\n── the two sheets ──");
{
  const c = world({ items: ITEMS }).ctx;
  const html = c.pdSheetsHtml(KID, { iso: "2026-10-28", pn: 210 }, ITEMS);
  const tester = html.split("’s pictures")[0];
  ok("the tester's sheet numbers every card 1–7", [1, 2, 3, 4, 5, 6, 7].every(n => tester.includes('<td class="n">' + n + ".</td>")) && !tester.includes('<td class="n">8.</td>'));
  ok("…prints the spelling word and the fact's answer", /🔤 Spell: <b>garden<\/b>/.test(tester) && /7×8<\/td><td class="a">56</.test(tester));
  ok("…and points a picture card at its number on the picture sheet, answer beside it", /🖼 Picture 2<\/td><td class="a">Excavator</.test(tester));
  ok("it is dated for the drill day and says to keep it (answers)", /Wednesday, October 28/.test(tester) && /answers — keep this sheet/.test(tester));
  const pics = html.split("’s pictures").slice(1).join("");
  ok("5 picture cards → 2 picture pages (4 to a page)", (html.match(/’s pictures/g) || []).length === 2);
  ok("each picture keeps its tester-sheet number (2, 4, 5, 6, 7)", ['<div class="num">2</div>', '<div class="num">4</div>', '<div class="num">5</div>', '<div class="num">6</div>', '<div class="num">7</div>'].every(s => pics.includes(s)) && !pics.includes('<div class="num">1</div>') && !pics.includes('<div class="num">3</div>'));
  ok("the picture pages never show the answer (no names)", !/Excavator|Lion|garden|>56</.test(pics.replace(/src="[^"]*"/g, "")));
  ok("the photo is on it", pics.includes('src="https://x/ex.jpg"'));
  const noPic = c.pdSheetsHtml(KID, { iso: "2026-10-28", pn: 210 }, [ITEMS[0], ITEMS[2]]);
  ok("no picture cards → no picture page", !/’s pictures/.test(noPic));
}

console.log("\n── printing saves the list (Mom only) ──");
{
  const w = world({ items: ITEMS, mom: false });
  w.ctx.pdPrintNext(KID);
  ok("not Mom → nothing printed, nothing written", !w.opened.length && !w.writes.length);
  ok("…and no button", w.ctx.pdButtonHtml(KID) === "");
}
{
  const w = world({ items: ITEMS });
  const day = w.ctx.pdNextDay(KID);
  w.ctx.pdPrintNext(KID);
  ok("the list comes from the drill due on the NEXT school day", w.dueCalls.length && w.dueCalls[0][0] === KID && w.dueCalls[0][1] === day.pn, w.dueCalls);
  ok("one targeted write: mastery/<kid>_paperDrills/20261028", w.writes.length === 1 && w.writes[0][0] === "mastery/" + KID + "_paperDrills/20261028", w.writes.map(x => x[0]));
  const rec = w.writes[0][1];
  ok("…with the date, its school-day number, the cards in printed order, state printed", rec.date === "2026-10-28" && rec.pn === day.pn && rec.ids.length === 7 && rec.q.length === 7 && rec.state === "printed");
  const rows = w.opened.length ? w.opened[0].html.split("<tr>").slice(1) : [];
  ok("the printout lists the cards in the order the record keeps", rows.length === 7 && rec.ids.every((id, i) => { const it = ITEMS.find(x => x.id === id), r = rows[i];
    return r.includes('<td class="n">' + (i + 1) + ".</td>") && (r.includes("🖼 Picture " + (i + 1)) || r.includes(it.prompt)); }));
  ok("the button now offers a reprint for that day", /Print next drill on paper · Wed, Oct 28 \(printed — reprint\)/.test(w.ctx.pdButtonHtml(KID)));
  // the due set changes (today's drill was logged after printing) — a reprint still matches the paper
  w.ctx.masteryData[KID] = ITEMS.concat([{ id: "z", prompt: "new", subject: "Words" }]);
  const list = w.ctx.pdNextList(KID, day);
  ok("a reprint uses the saved list, in the saved order", list.map(i => i.id).join() === rec.ids.join());
  w.ctx.pdPrintNext(KID);
  ok("…and writes nothing new", w.writes.length === 1);
}
{
  const w = world({ items: ITEMS, dry: true });
  w.ctx.pdPrintNext(KID);
  ok("?dryrun=1 → prints, writes nothing to Firebase", w.opened.length === 1 && !w.writes.length);
}
{
  const w = world({ items: [] });
  w.ctx.pdPrintNext(KID);
  ok("nothing due next time → a toast, no print, no record", !w.opened.length && !w.writes.length && /Nothing comes due/.test(w.toasts[0]));
}

console.log("\n── wiring ──");
ok("the drill view shows the button under its header, never while logging", /if\(!mastLogMode&&typeof pdButtonHtml==="function"\) h\+=pdButtonHtml\(masteryKid\);/.test(src));
ok("no kid names in the block", !/lincoln|ellis|lucy|julian|andrew|taylor|makenzie|caleb/i.test(cut("// PAPERDRILL_START", "// PAPERDRILL_END")));
ok("no 🔀 anywhere", !src.includes("\u{1F500}"));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
