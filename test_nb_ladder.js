// 📚 NBLADDER — the notebook ladders, slice 1: the engine, the Mom-only Ladders card and the placement printout (notebooks study,
// her words 2026-11-23/24: "Build it"; placement for both ladders; reading "twice a week"; the optional harder stage on 5th/7th/8th
// "add the stage", off unless switched on). Run: node test_nb_ladder.js
//  · notebooks.js NBLADDER (HoweNotebooks.ladders): order, optional stage on/off, move up at a level's end, the stop at a bank rung,
//    never wraps, the same week twice = the same items, the default level at every grade.
//  · index.html NBLADDER: the file loads lazily (never while everything is off and the card is closed), a failed load just says
//    so; writes are Mom only, one targeted field each, inert under ?dryrun=1; the card for a kid with no grade / off / on / at a
//    bank rung; ctx.ladders.
//  · placement: the right two levels for every suggested level; nothing a child must produce (answer, why, rule) on a child's
//    sheet; the parent sheet has them.
//  · EVERY built-in notebook prints byte for byte what this tree prints with the NBLADDER blocks cut out (no git, no pinned commit).
//  · page fit: every placement sheet measured in Google Chrome headless when it is on this machine (else SKIPPED, said plainly).
const fs = require("fs"), path = require("path"), vm = require("vm"), os = require("os"), cp = require("child_process");
const rd = (f) => fs.readFileSync(path.join(__dirname, f), "utf8");
const nbSrc = rd("notebooks.js"), src = rd("index.html");
const NUM = JSON.parse(rd("ladders/number_thinking.json")), READ = JSON.parse(rd("ladders/read_and_answer.json"));
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 400) : "")); } };
const NAMES = /\b(adrienne|andrew|julian|lincoln|ellis|lucy|sara|caleb|taylor|dewalt|burris|howe)\b/i;

// ════════════════════════════════════════ the blocks ════════════════════════════════════════
console.log("── the blocks ──");
const n0 = nbSrc.indexOf("  // NBLADDER_START"), n1 = nbSrc.indexOf("  // NBLADDER_END\n");
const i0 = src.indexOf("// NBLADDER_START"), i1 = src.indexOf("// NBLADDER_END\n");
ok("one NBLADDER block in notebooks.js, right after NBNEEDS_END", n0 === nbSrc.indexOf("  // NBNEEDS_END\n") + "  // NBNEEDS_END\n".length && n1 > n0 && nbSrc.indexOf("NBLADDER_START", n0 + 20) < 0);
ok("one NBLADDER block in index.html, right after NBLEVEL_END", i0 === src.indexOf("// NBLEVEL_END\n") + "// NBLEVEL_END\n".length && i1 > i0 && src.indexOf("NBLADDER_START", i0 + 5) < 0);
const nbBlk = nbSrc.slice(n0, n1), ixBlk = src.slice(i0, i1);
const code = (s) => s.split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n").replace(/\s\/\/ .*$/gm, "");   // comment lines and trailing // notes out
ok("no kid or family name in either block", !NAMES.test(nbBlk) && !NAMES.test(ixBlk), (nbBlk.match(NAMES) || ixBlk.match(NAMES) || [])[0]);
ok("notebooks.js block: no DOM, no Firebase", !/db\.ref|firebase|document\.|getElementById|window\./i.test(code(nbBlk)));
ok("no 🔀 in index.html", src.indexOf("\u{1F500}") < 0);
ok("no he/his/him in the card's words", !/\b(he|his|him|she|her)\b/i.test((code(ixBlk).match(/'[^']*'|"[^"]*"/g) || []).join(" ").replace(/<[^>]*>/g, " ")));
ok("exported once: HoweNotebooks.ladders", nbSrc.split("ladders: NB_LADDERS,").length === 2);
ok("no generator reads ctx.ladders (only index.html passes it)", !/ctx\.ladders|ctx\[["']ladders["']\]/.test(code(nbSrc)));
ok("haNbContext passes ctx.ladders, guarded", src.split('ladders:((typeof nbLadderCtx==="function")?nbLadderCtx(kid):null) }; // KIDNAME_ROSTER').length === 2);
ok("the card sits right after the Notebook level card", src.indexOf('nbLevelCardHtml(sel)+   // 📏 NBLEVEL: Notebook level (Mom)\n        ((typeof nbLadderCardHtml==="function")?nbLadderCardHtml(sel):"")+') > 0);
ok("one home: the card is drawn in one place", src.split("nbLadderCardHtml(").length === 3);   // its definition + the one call
ok("the write path is registered in test_currcard.js", rd("test_currcard.js").indexOf('"\\"notebookSettings/\\"+kid+\\"/ladders/\\"+kind+\\"/\\"+field"') > 0);
ok("only one db.ref in the index.html block, the targeted field", (ixBlk.match(/db\.ref\(/g) || []).length === 1 && ixBlk.indexOf('db.ref("notebookSettings/"+kid+"/ladders/"+kind+"/"+field)') > 0);
ok("no .set() of a whole ladders node", !/ladders\/"\+kind\)\.set|ladders"\)\.set|\/ladders\)\.set/.test(ixBlk));
ok("nothing outside the blocks touches notebookSettings …/ladders", src.replace(ixBlk, "").indexOf("/ladders/") < 0 && src.replace(ixBlk, "").indexOf(".ladders") < 0);
ok("sw.js and the content files are untouched by this slice (sw.js caches no ladders file)", rd("sw.js").indexOf("ladders") < 0);

// ════════════════════════════════════════ the engine ════════════════════════════════════════
const load = (s) => { const w = {}; (new Function("window", "document", s))(w, undefined); return w.HoweNotebooks; };
const NB = load(nbSrc), L = NB.ladders;
console.log("── the engine: the real files ──");
const tN = L.track("number", NUM), tR = L.track("reading", READ);
ok("number track: the file's order, 4th and 6th as bank rungs", tN.order.join(",") === "prek,k,g1,g2,g3,g4,g5,g6,g7,g8" && tN.levels.g4.bank && tN.levels.g6.bank && !tN.levels.g5.bank);
ok("reading track: g1 … g6, g78 (no Pre-K / K)", tR.order.join(",") === "g1,g2,g3,g4,g5,g6,g78");
ok("level counts: core 60; optional 12 on 5th, 7th, 8th", L.levels(tN, false).map((x) => x.count).join(",") === "60,60,60,60,60,0,60,0,60,60" &&
  L.levels(tN, true).map((x) => x.count).join(",") === "60,60,60,60,60,0,72,0,72,72" && L.levels(tN).filter((x) => x.optional === 12).map((x) => x.lv).join(",") === "g5,g7,g8");
ok("reading counts follow the file", L.levels(tR).map((x) => x.lv + ":" + x.count).join(",") === Object.keys(READ.levels).map((k) => k + ":" + Object.values(READ.passages).filter((p) => p.lv === k).length).join(","));
{
  const r = L.next(tN, { lv: "g1" }, 7, 5);
  const want = Object.entries(NUM.levels.g1.items).map(([id, it]) => Object.assign({ id }, it)).sort((a, b) => a.o - b.o).slice(0, 5).map((x) => x.id);
  ok("number: first week = the level's first 5 questions in order", JSON.stringify(r.items.map((x) => x.id)) === JSON.stringify(want) && r.items[0].num === 1 && r.items[4].num === 5 && r.items[0].of === 60);
  ok("…and the cursor to save: {week, lv, from, adv}", JSON.stringify(r.cursor) === JSON.stringify({ week: 7, lv: "g1", from: 0, adv: 5, opt: false }));
  const rr = L.next(tR, { lv: "g3" }, 7);
  ok("reading: default 2 a week; an item = a passage with all its questions", rr.items.length === 2 && rr.items[0].item.q.length === 4 && rr.items[0].item.title === "The Squeaky Gate" && rr.items[1].item.o === 2);
}
{
  const g2end = L.next(tN, { lv: "g2", cur: { week: 9, lv: "g2", from: 55, adv: 3 } }, 10, 5);
  ok("move up: the end of 2nd grade → 3rd grade's first questions", g2end.items.map((x) => x.lv + "#" + x.num).join(",") === "g2#59,g2#60,g3#1,g3#2,g3#3" && !g2end.stop && !g2end.end);
  const r1end = L.next(tR, { lv: "g1", cur: { week: 9, lv: "g1", from: 28, adv: 1 } }, 10, 2);
  ok("reading moves up too: g1 #30 → g2 #1", r1end.items.map((x) => x.lv + "#" + x.num).join(",") === "g1#30,g2#1");
  const g3end = L.next(tN, { lv: "g3", cur: { week: 9, lv: "g3", from: 54, adv: 4 } }, 10, 5);
  ok("bank rung: the end of 3rd grade STOPS at the 4th-grade bank (not skipped)", g3end.items.map((x) => x.num).join(",") === "59,60" && g3end.stop && g3end.stop.lv === "g4" && g3end.stop.bank === true && g3end.items.every((x) => x.lv === "g3"));
  const atBank = L.next(tN, { lv: "g3", cur: g3end.cursor }, 11, 5);
  ok("…the next week: no items, still the stop — never jumps past it to 5th", atBank.items.length === 0 && atBank.stop.lv === "g4");
  const g4 = L.next(tN, { lv: "g4" }, 3, 5);
  ok("a kid set to the 4th-grade bank → no items, the stop says so", g4.items.length === 0 && g4.stop.lv === "g4" && JSON.stringify(g4.cursor) === JSON.stringify({ week: 3, lv: "g4", from: 0, adv: 0, opt: false }));
  ok("where: 'next is the bank'", L.where(tN, { lv: "g3", cur: g3end.cursor }).stop.lv === "g4" && L.where(tN, { lv: "g6" }).stop.lv === "g6");
  const g5off = L.next(tN, { lv: "g5", cur: { week: 1, lv: "g5", from: 57, adv: 0 } }, 1, 5);
  ok("optional stage OFF: 5th grade #58–60 → stop at the 6th-grade bank (stage 6 skipped)", g5off.items.map((x) => x.num).join(",") === "58,59,60" && g5off.items.every((x) => !x.item.opt) && g5off.stop.lv === "g6");
  const g5on = L.next(tN, { lv: "g5", opt: true, cur: { week: 1, lv: "g5", from: 57, adv: 0 } }, 1, 5);
  ok("optional stage ON: … #60 → the optional questions #61, #62 (of 72)", g5on.items.map((x) => x.num).join(",") === "58,59,60,61,62" && g5on.items[3].item.opt === true && g5on.items[3].of === 72 && !g5on.stop);
  const optOffMid = L.next(tN, { lv: "g7", opt: false, cur: { week: 4, lv: "g7", from: 64, adv: 2 } }, 5, 5);
  ok("switched off while in the optional stage → 8th grade from its FIRST question (none eaten)", optOffMid.items[0].lv === "g8" && optOffMid.items[0].num === 1);
  const crossed = L.next(tN, { lv: "g7", opt: false, cur: { week: 4, lv: "g7", from: 70, adv: 5, opt: true } }, 5, 5);
  ok("…a saved week that ran from the optional stage into 8th grade continues after what it printed (8th #4)", crossed.items[0].lv === "g8" && crossed.items[0].num === 4);
  const reopen = L.next(tN, { lv: "g8", opt: true, cur: { week: 4, lv: "g8", from: 58, adv: 2, opt: false } }, 5, 5);
  ok("switched ON at the end of 8th grade → the optional questions open (#61), not end", reopen.items[0].num === 61 && reopen.items[0].item.opt === true && !reopen.end);
  ok("the cursor carries the switch: {…, opt}", reopen.cursor.opt === true && L.next(tN, { lv: "g2" }, 3, 5).cursor.opt === false);
  const end8 = L.next(tN, { lv: "g8", cur: { week: 2, lv: "g8", from: 58, adv: 0 } }, 2, 5);
  ok("never wraps: the last 8th-grade questions, then end", end8.items.map((x) => x.num).join(",") === "59,60" && end8.end === true && !end8.stop);
  const after = L.next(tN, { lv: "g8", cur: end8.cursor }, 3, 5);
  ok("…after the end: nothing, still end — never back to the start", after.items.length === 0 && after.end === true && L.where(tN, { lv: "g8", cur: end8.cursor }).end === true);
  const endR = L.next(tR, { lv: "g78", cur: { week: 2, lv: "g78", from: 10, adv: 1 } }, 3, 2);
  ok("reading never wraps either (7th–8th's last passage → end)", endR.items.length === 0 && endR.end === true);
}
{
  const s0 = { lv: "g2" }, w10 = L.next(tN, s0, 10, 5), cur = w10.cursor;
  const again = L.next(tN, { lv: "g2", cur }, 10, 5);
  ok("same week built twice → the same items", JSON.stringify(again.items.map((x) => x.id)) === JSON.stringify(w10.items.map((x) => x.id)) && JSON.stringify(again.cursor) === JSON.stringify(cur));
  const w11 = L.next(tN, { lv: "g2", cur }, 11, 5);
  ok("a later week moves on (#6–10)", w11.items.map((x) => x.num).join(",") === "6,7,8,9,10");
  const w14 = L.next(tN, { lv: "g2", cur }, 14, 5);
  ok("a later week after unprinted weeks continues right after (no questions skipped)", w14.items.map((x) => x.num).join(",") === "6,7,8,9,10");
  const c12 = { week: 12, lv: "g2", from: 20, adv: 5 };
  ok("an earlier week walks back n per week inside the level", L.next(tN, { lv: "g2", cur: c12 }, 11, 5).items[0].num === 16 && L.next(tN, { lv: "g2", cur: c12 }, 1, 5).items[0].num === 1);
  ok("the week label 'week12' reads as 12", L.next(tN, { lv: "g2", cur: c12 }, "week12", 5).items[0].num === 21);
  ok("where: up next after the saved week", JSON.stringify(L.where(tN, { lv: "g2", cur: c12 })) === JSON.stringify({ lv: "g2", label: "2nd grade", i: 25, num: 26, of: 60, started: true }));
  ok("where: not started → the level's first", L.where(tR, { lv: "g4" }).num === 1 && L.where(tR, { lv: "g4" }).started === false);
  const junk = [{ week: 0, lv: "g2", from: 3 }, { week: 5, lv: "g99", from: 3 }, { week: 5, lv: "g2", from: -1 }, { week: "x", lv: "g2", from: 2 }, "nope", null];
  ok("a broken saved place is ignored (starts at the level's first)", junk.every((c) => L.next(tN, { lv: "g2", cur: c }, 5, 5).items[0].num === 1));
  ok("no level and no place → nothing, no cursor", L.next(tN, {}, 5, 5).items.length === 0 && L.next(tN, {}, 5, 5).cursor === null && L.where(tN, {}) === null);
  ok("an unknown level → nothing", L.next(tN, { lv: "g9" }, 5, 5).items.length === 0);
  ok("a cursor moved up past the picked level is followed", L.next(tN, { lv: "g1", cur: { week: 3, lv: "g3", from: 10, adv: 5 } }, 4, 5).items[0].lv === "g3");
}
console.log("── the engine: a made-up ladder (edge cases) ──");
{
  const it = (n, extra) => Object.assign({ o: n, text: "q" + n, c: ["1", "2"], ans: "A", rule: "r" + n }, extra || {});
  const fx = { order: ["a", "b", "c", "d"], haveElsewhere: { b: "bank.json" },
    levels: { a: { label: "Level A", items: { a2: it(2), a1: it(1), a3: it(3) } }, c: { label: "Level C", optStages: [2], items: { c1: it(1), c2: it(2), c3: it(3, { opt: true }), c4: it(4, { opt: true }) } }, d: { label: "Level D", items: { d1: it(1), dx: { o: 2 } } } } };
  const t = L.track("number", fx);
  ok("sorted by o, an item with no text dropped", t.levels.a.items.map((x) => x.id).join(",") === "a1,a2,a3" && t.levels.d.items.length === 1);
  ok("a whole ladder walked 2 a week: a1 a2 | a3 STOP(b)", (() => { const w1 = L.next(t, { lv: "a" }, 1, 2), w2 = L.next(t, { lv: "a", cur: w1.cursor }, 2, 2); return w1.items.map((x) => x.id).join() === "a1,a2" && w2.items.map((x) => x.id).join() === "a3" && w2.stop.lv === "b"; })());
  ok("c with opt off: c1 c2 then d1 then end", L.next(t, { lv: "c" }, 1, 9).items.map((x) => x.id).join() === "c1,c2,d1" && L.next(t, { lv: "c" }, 1, 9).end === true);
  ok("c with opt on: c1 c2 c3 c4 d1 then end", L.next(t, { lv: "c", opt: true }, 1, 9).items.map((x) => x.id).join() === "c1,c2,c3,c4,d1");
  ok("wrong shapes → no track", L.track("number", null) === null && L.track("number", { levels: 3 }) === null && L.track("reading", { levels: {} }) === null && L.track("spelling", NUM) === null);
  ok("ladders.next on no track → empty, no throw", L.next(null, { lv: "a" }, 1, 2).items.length === 0);
}
console.log("── the default level, every grade ──");
{
  const R = { PreK: null, K: null, 1: "g1", 2: "g2", 3: "g3", 4: "g4", 5: "g5", 6: "g6", 7: "g78", 8: "g78", 9: null, 12: null, "": null };
  const N = { PreK: "prek", K: "k", 1: "g1", 2: "g2", 3: "g3", 4: "g4", 5: "g5", 6: "g6", 7: "g7", 8: "g8", 9: null, 12: null, "": null };
  for (const g of Object.keys(R)) ok("grade " + JSON.stringify(g) + " → reading " + R[g] + ", number " + N[g], L.defaultLevel("reading", g) === R[g] && L.defaultLevel("number", g) === N[g]);
  ok("no grade (null / undefined) → no default", L.defaultLevel("reading", null) === null && L.defaultLevel("number", undefined) === null);
  ok("number 4 and 6 point at the bank rungs", tN.levels[L.defaultLevel("number", "4")].bank && tN.levels[L.defaultLevel("number", "6")].bank);
  ok("every default exists in its ladder", ["PreK", "K", "1", "2", "3", "4", "5", "6", "7", "8"].every((g) => { const r = L.defaultLevel("reading", g), n = L.defaultLevel("number", g); return (r === null || tR.levels[r]) && tN.levels[n]; }));
}

// ════════════════════════════════════════ index.html ════════════════════════════════════════
console.log("── index.html: load, writes, card, ctx ──");
function sandbox(o) {
  o = o || {};
  const writes = [], fetched = [], ls = [];
  const c = {
    window: { HoweNotebooks: o.noLib ? undefined : NB, open: () => null }, location: { hostname: o.host || "localhost" },
    notebookSettings: o.settings || {}, tab: "notebook", rendered: 0,
    momHere: () => o.mom !== false, _dryRun: () => !!o.dry,
    HA_LS: { setItem: (k, v) => ls.push([k, v]) },
    document: { getElementById: () => ({}) },
    cap: (k) => String(k).charAt(0).toUpperCase() + String(k).slice(1),
    nbLevelGrade: (kid) => (o.grades || {})[kid] || null,
    nbQbList: (kid) => ((o.banks || {})[kid] ? [{ id: "x", text: "1 2 ?" }] : []),
    nbTargetWkNum: () => o.week || 12,
    db: o.noDb ? null : { ref: (p) => ({ set: (v) => writes.push(["set", p, v]), remove: () => writes.push(["remove", p]), update: (v) => writes.push(["update", p, v]) }) },
    fetch: (u) => { fetched.push(u); if (o.offline) return Promise.reject(new TypeError("Failed to fetch")); if (o.status) return Promise.resolve({ ok: false, status: o.status, json: () => Promise.resolve({}) });
      const j = /number/.test(u) ? NUM : /read_and/.test(u) ? READ : null; return Promise.resolve({ ok: !!j, status: j ? 200 : 404, json: () => Promise.resolve(o.badShape ? [1, 2] : j) }); },
    console, Promise, JSON, Object, String, Array, Date, parseInt, isNaN, setTimeout,
  };
  c.renderNotebook = () => { c.rendered++; };
  vm.createContext(c);
  vm.runInContext(ixBlk + "\nthis._nbLadData=_nbLadData; this._nbLadFail=_nbLadFail; this._nbLadOpen=_nbLadOpen; this.NBLADDER_PAGES_NOTE=NBLADDER_PAGES_NOTE;", c);
  c.writes = writes; c.fetched = fetched; c.ls = ls;
  return c;
}
const tick = () => new Promise((r) => setTimeout(r, 5));
(async () => {
  {
    const c = sandbox({ grades: { a: { key: "5", from: "family" } } });
    const card = c.nbLadderCardHtml("a"), ctx = c.nbLadderCtx("a");
    await tick();
    ok("everything off and the card closed → nothing fetched (never at app start)", c.fetched.length === 0 && ctx === null);
    ok("closed card: one summary line from the saved switches", /📚 Ladders/.test(card) && /Reading: off · Number: off/.test(card) && !/ open/.test(card.slice(0, 40)));
    ok("…and says plainly that switching on prints nothing yet", card.indexOf(c.NBLADDER_PAGES_NOTE) > 0 && /doesn’t print anything in the notebook yet/.test(c.NBLADDER_PAGES_NOTE));
    c.nbLadderToggle("a", true);
    await tick(); await tick();
    ok("opening the card fetches both files, once each", c.fetched.length === 2 && c.fetched.some((u) => u === "ladders/number_thinking.json") && c.fetched.some((u) => u === "ladders/read_and_answer.json"));
    ok("…then redraws the tab", c.rendered >= 1);
    c.nbLadderCardHtml("a"); c.nbLadderToggle("a", true); await tick();
    ok("kept in memory: no second fetch", c.fetched.length === 2);
    const gh = sandbox({ host: "someone.github.io" }); await gh.nbLadderLoad("number");
    ok("cache-bust only on GitHub Pages", /^ladders\/number_thinking\.json\?v=\d+$/.test(gh.fetched[0]) && c.fetched.every((u) => u.indexOf("?") < 0));
    const open = c.nbLadderCardHtml("a");
    ok("open card, grade 5, nothing saved: both rows, Off, following the notebook level", / open /.test(open) && /📖 Reading passages/.test(open) && /🔢 Number thinking/.test(open) && (open.match(/>Off</g) || []).length === 2 &&
      /Follow the notebook level \(5th grade\)/.test(open) && /Starts at passage 1 of 11 in 5th grade\./.test(open) && /Starts at question 1 of 60 in 5th grade\./.test(open));
    ok("number at 5th: the 'Harder extra stage' switch, off", /Harder extra stage/.test(open) && /12 more questions at the end of 5th grade/.test(open) && !/type="checkbox" checked/.test(open));
    ok("bank rungs listed, not selectable without a bank", /<option value="g4" disabled>4th grade \(the question bank\)<\/option>/.test(open) && /<option value="g6" disabled>6th grade \(the question bank\)<\/option>/.test(open));
    ok("reading picker: the levels in the file, plain names", ["1st grade", "2nd grade", "3rd grade", "7th–8th grade"].every((w) => open.indexOf(">" + w + "</option>") > 0) && open.indexOf('value="prek"') === open.lastIndexOf('value="prek"'));
    ok("Print placement on both rows", (open.match(/🖨 Print placement/g) || []).length === 2 && /nbLadderPlacement\('a','reading'\)/.test(open));
    ok("rendering the card wrote nothing", c.writes.length === 0 && c.ls.length === 0);
  }
  {
    const c = sandbox({});
    c._nbLadOpen.z = true; c.nbLadderCardHtml("z"); await tick(); await tick();
    const h = c.nbLadderCardHtml("z");
    ok("a kid with no grade: 'Pick a level', no placement button", (h.match(/>Pick a level</g) || []).length === 2 && (h.match(/Pick a level to start\./g) || []).length === 2 && !/🖨 Print placement/.test(h) && (h.match(/Pick a level to print a placement check/g) || []).length === 2);
    ok("…no optional switch without a level", !/Harder extra stage/.test(h));
    const c2 = sandbox({ grades: { p: { key: "PreK", from: "before" } } });
    ok("today's fallback grade (not set by Mom) gives no default", c2.nbLadderLevelOf("p", "number").lv === "");
    const c3 = sandbox({ settings: { y: { ladders: { reading: { lv: "g3" } } } } }); c3._nbLadData.reading = READ; c3._nbLadData.number = NUM;
    const h3 = c3.nbLadderCardHtml("y");
    ok("a saved level but no grade: the first choice still says 'Pick a level' (never 'Follow the notebook level')", !/Follow the notebook level/.test(h3) && /<option value="g3" selected>3rd grade<\/option>/.test(h3) && /Starts at passage 1 of 11 in 3rd grade/.test(h3));
  }
  {
    const c = sandbox({ grades: { b: { key: "3", from: "override" } }, banks: { b: 1 }, settings: { b: { ladders: { number: { on: true, lv: "g3", cur: { week: 11, lv: "g3", from: 58, adv: 2 } }, reading: { on: true } } } } });
    const ctx0 = c.nbLadderCtx("b"); await tick(); await tick();
    ok("a ladder ON → its file is fetched (from ctx), no write", c.fetched.length === 2 && c.writes.length === 0 && ctx0.number.on === true && ctx0.number.ready === false && ctx0.number.next === null);
    const ctx = c.nbLadderCtx("b");
    ok("ctx.ladders: saved state + this week's items", ctx.number.lv === "g3" && ctx.number.lvFrom === "saved" && ctx.number.ready === true && ctx.number.next.items.length === 0 && ctx.number.next.stop.lv === "g4" &&
      ctx.reading.lv === "g3" && ctx.reading.lvFrom === "grade" && ctx.reading.next.items.length === 2 && ctx.reading.next.items[0].item.title === "The Squeaky Gate");
    const h = c.nbLadderCardHtml("b");
    ok("card at a bank rung: 'Next is the 4th-grade question bank …'", /Next is the 4th-grade question bank \(its card is on this tab\)\. When B is done with it, pick the next level here\./.test(h));
    ok("…a kid WITH a bank can pick the bank rungs", /<option value="g4">4th grade \(the question bank\)<\/option>/.test(h) && !/value="g4" disabled/.test(h));
    ok("…both On, summary says so", (h.match(/>On</g) || []).length === 2 && /Reading: on · Number: on/.test(h));
    ok("…no optional switch at 3rd grade", !/Harder extra stage/.test(h));
  }
  {
    const c = sandbox({ offline: true, settings: { d: { ladders: { reading: { on: true, lv: "g2" } } } } });
    let threw = null; try { c.nbLadderCtx("d"); } catch (e) { threw = e; }
    await tick(); await tick();
    ok("offline: nothing throws; the ladder is marked couldn't-load", !threw && c._nbLadFail.reading === true);
    const ctx = c.nbLadderCtx("d"); await tick();
    ok("…ctx.ladders still has the saved state, no items, and does not keep retrying", ctx.reading.on === true && ctx.reading.ready === false && ctx.reading.next === null && c.fetched.length === 1);
    c._nbLadOpen.d = true;
    c.nbLadderCardHtml("d"); await tick(); await tick();
    const h = c.nbLadderCardHtml("d");
    ok("…the card says so, with Try again", (h.match(/couldn’t load — check the internet/g) || []).length === 2 && /nbLadderRetry\('reading'\)/.test(h));
    await tick();
    const nf = c.fetched.length; c.nbLadderRetry("reading"); await tick();
    ok("…Try again fetches once more (Mom only)", c.fetched.length === nf + 1);
    const c2 = sandbox({ status: 404 }); let r404 = null; await c2.nbLadderLoad("number").catch((e) => { r404 = e; });
    const c3 = sandbox({ badShape: true }); let rbad = null; await c3.nbLadderLoad("reading").catch((e) => { rbad = e; });
    ok("a 404 or a file of the wrong shape → rejected, marked failed, nothing kept", r404 && rbad && c2._nbLadFail.number && c3._nbLadFail.reading && !c2._nbLadData.number && !c3._nbLadData.reading);
    const c4 = sandbox({ noLib: true }); c4._nbLadOpen.q = true;
    ok("notebooks.js not here yet → the card says it's getting them", /Getting the ladders…/.test(c4.nbLadderCardHtml("q")));
  }
  {
    const fresh = (o) => { const c = sandbox(Object.assign({ grades: { a: { key: "5", from: "family" } } }, o)); c._nbLadData.number = NUM; c._nbLadData.reading = READ; return c; };
    let c = fresh();
    c.nbLadderSetOn("a", "reading", true);
    ok("switch on → exactly one write: …/ladders/reading/on = true", JSON.stringify(c.writes) === JSON.stringify([["set", "notebookSettings/a/ladders/reading/on", true]]));
    ok("…kept in the local notebook-settings copy, tab redrawn", c.notebookSettings.a.ladders.reading.on === true && c.ls.length === 1 && c.ls[0][0] === "ha_nb_settings" && c.rendered === 1);
    c.nbLadderSetOn("a", "reading", false);
    ok("switch off → removes that one field (nothing saved = off)", JSON.stringify(c.writes[1]) === JSON.stringify(["remove", "notebookSettings/a/ladders/reading/on"]) && !("on" in c.notebookSettings.a.ladders.reading));
    c.nbLadderSetOpt("a", true);
    ok("harder stage on → one write …/ladders/number/opt = true", JSON.stringify(c.writes[2]) === JSON.stringify(["set", "notebookSettings/a/ladders/number/opt", true]));
    c = fresh({ settings: { a: { ladders: { number: { lv: "g3", cur: { week: 4, lv: "g3", from: 10, adv: 5 } } } } } });
    c.nbLadderSetLevel("a", "number", "g5");
    ok("a new level → set lv, remove cur (the child starts at its first question) — two single-field writes",
      JSON.stringify(c.writes) === JSON.stringify([["set", "notebookSettings/a/ladders/number/lv", "g5"], ["remove", "notebookSettings/a/ladders/number/cur"]]) && !c.notebookSettings.a.ladders.number.cur);
    c.nbLadderSetLevel("a", "number", "g5");
    ok("the same level again → no write", c.writes.length === 2);
    c.nbLadderSetLevel("a", "number", "g4"); c.nbLadderSetLevel("a", "number", "g99"); c.nbLadderSetLevel("a", "number", "<x>"); c.nbLadderSetLevel("a", "reading", "prek");
    ok("a bank rung without the bank, an unknown level, junk, a level from the other ladder → no write", c.writes.length === 2);
    c.nbLadderSetLevel("a", "number", "");
    ok("back to following the notebook level → removes lv; cur kept when the level didn't change", JSON.stringify(c.writes[2]) === JSON.stringify(["remove", "notebookSettings/a/ladders/number/lv"]) && c.writes.length === 3);
    c = fresh({ banks: { a: 1 } }); c.nbLadderSetLevel("a", "number", "g6");
    ok("a kid with a bank can be set to the bank rung", JSON.stringify(c.writes) === JSON.stringify([["set", "notebookSettings/a/ladders/number/lv", "g6"]]));
    c = fresh({ dry: true }); c.nbLadderSetOn("a", "number", true); c.nbLadderSetLevel("a", "number", "g7"); c.nbLadderSetOpt("a", true);
    ok("?dryrun=1 → no Firebase write (local copy only)", c.writes.length === 0 && c.notebookSettings.a.ladders.number.on === true && c.notebookSettings.a.ladders.number.lv === "g7");
    c = fresh({ mom: false }); c.nbLadderSetOn("a", "number", true); c.nbLadderSetLevel("a", "number", "g7"); c.nbLadderSetOpt("a", true); c.nbLadderRetry("number");
    const kidCard = c.nbLadderCardHtml("a"), kidPlace = c.nbLadderPlacement("a", "number");
    ok("not Mom → no write, no local change, no card, no placement", c.writes.length === 0 && !c.notebookSettings.a && kidCard === "" && kidPlace === undefined);
    c = fresh({ noDb: true }); c.nbLadderSetOn("a", "number", true);
    ok("no database → local copy only, nothing throws", c.notebookSettings.a.ladders.number.on === true);
    c = fresh(); c.nbLadderWrite("a", "number", "items", [1]); c.nbLadderWrite("a", "spelling", "on", true);
    ok("only the four fields of the two ladders can be written", c.writes.length === 0);
    c = fresh({ settings: { a: { ladders: { number: { on: true, lv: "g5", opt: true } } } } });
    const h = c.nbLadderCardHtml("a");
    ok("card: harder stage checked when on", /type="checkbox" checked/.test(h) && /Starts at question 1 of 72 in 5th grade/.test(h));
  }

  // ════════════════════════════════════════ placement ════════════════════════════════════════
  console.log("── placement ──");
  const PAIR = {
    reading: { g1: ["g1", "g2"], g2: ["g1", "g2"], g3: ["g2", "g3"], g4: ["g3", "g4"], g5: ["g4", "g5"], g6: ["g5", "g6"], g78: ["g6", "g78"] },
    number: { prek: ["prek", "k"], k: ["prek", "k"], g1: ["k", "g1"], g2: ["g1", "g2"], g3: ["g2", "g3"], g4: ["g3", "g5"], g5: ["g3", "g5"], g6: ["g5", "g7"], g7: ["g5", "g7"], g8: ["g7", "g8"] },
  };
  const docs = [];
  // 🎨 NBLADPIC (slice: the pictures): a question drawn as a picture (every Pre-K / K one, and 1st/2nd's "about how many") prints
  // the picture and picture choices instead of its plain words; the words go to the parent sheet ("the picture: …"). Its own
  // checks are in test_nb_ladpic.js.
  const moved = (q) => !!(q.pic && L.picture && L.picture(q) && (q.lv === "prek" || q.lv === "k" || !/^(parts|pairs)$/.test(q.pic.kind)));
  for (const kind of ["reading", "number"]) {
    const data = kind === "reading" ? READ : NUM, t = kind === "reading" ? tR : tN;
    for (const lv of Object.keys(PAIR[kind])) {
      const pr = L.placementPair(t, lv), want = PAIR[kind][lv];
      ok(kind + " " + lv + " → " + want.join(" + ") + (pr.skipped.length ? " (skips " + pr.skipped.join(",") + ")" : ""), pr.lo === want[0] && pr.hi === want[1], pr);
      const pg = L.placementPages(kind, data, { lv, kidName: "Sam" });
      const childH = pg.child.join("\n"), parentH = pg.parent.join("\n");
      const items = want.map((k) => kind === "reading" ? [t.levels[k].items[0]] : t.levels[k].items.filter((x) => !x.opt).slice(0, 3)).flat();
      const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      const secret = kind === "reading" ? items.flatMap((p) => p.q.map((q) => q.why)) : items.map((q) => q.rule);
      const asked = childH.replace(/<div class="lp-psg">[\s\S]*?<\/div><\/div><\/div>/g, "");   // a why line may quote the passage itself — look everywhere BUT the passage
      const leak = secret.filter((s) => s && (asked.indexOf(esc(s)) >= 0 || asked.indexOf(s) >= 0));
      ok("  child sheet: no answer, why or rule text", leak.length === 0 && !/lp-key|lp-banner|grown-up — not|Answers/.test(childH), leak[0]);
      ok("  child sheet: every question and choice is there", kind === "reading" ? items.every((p) => childH.indexOf(esc(p.title)) >= 0 && p.q.every((q) => childH.indexOf(esc(q.text)) >= 0 && q.c.every((ch) => childH.indexOf(esc(ch)) >= 0)))
        : items.every((q) => moved(q) ? (childH.indexOf(esc(q.text)) < 0 && parentH.indexOf("the picture: " + esc(q.text)) >= 0)
          : String(q.text).split(" / ").every((s) => childH.indexOf(esc(s)) >= 0) && q.c.every((ch) => childH.indexOf(esc(q.lv === "prek" || q.lv === "k" ? String(ch).replace(/-/g, " ") : ch)) >= 0)));
      const keys = (parentH.match(/<div class="lp-key"><b>\d+\. ([A-E])<\/b>/g) || []).map((m) => m.slice(-5, -4));
      const ansWant = kind === "reading" ? items.flatMap((p) => p.q.map((q) => q.ans)) : items.map((q) => q.ans);
      ok("  parent sheet: its own page, marked not for the child, every answer + why/rule in order", pg.parent.length === 1 && /^<div class="page lp-parent">/.test(pg.parent[0]) && /not for the child/.test(parentH) &&
        keys.join("") === ansWant.join("") && secret.every((s) => parentH.indexOf(esc(s)) >= 0));
      ok("  parent sheet: how to choose", /Comfortable and mostly right on (Passage|Part) 2 → /.test(parentH) && /A struggle on (Passage|Part) 2 → /.test(parentH));
      const grown = kind === "number" && want.some((k) => k === "prek" || k === "k");
      ok("  'with a grown-up' " + (grown ? "on the sheet, the say lines printed for the grown-up" : "not on this sheet"), grown ? (/with a grown-up/.test(childH) && items.filter((q) => q.lv === "prek" || q.lv === "k").every((q) => childH.indexOf("Read aloud: “" + esc(q.say) + "”") >= 0)) : !/with a grown-up|Read aloud/.test(childH));
      if (pr.skipped.length) ok("  parent sheet says the bank rung is skipped", /is the question bank on the Notebook tab, not part of this ladder/.test(parentH) && (pr.skipped.indexOf("g4") < 0 || /4th-grade question bank/.test(parentH) || /4th grade is the question bank/.test(parentH)));
      const doc = L.placementDoc(kind, data, { lv, kidName: "Sam" });
      ok("  one printable document: child sheet(s) then the parent page", doc.indexOf("<!DOCTYPE html>") === 0 && doc.indexOf('class="page lp-child"') > 0 && doc.indexOf('class="page lp-child"') < doc.indexOf('class="page lp-parent"') && (doc.match(/<div class="page /g) || []).length === pg.child.length + 1 && /height: 11in; overflow: hidden/.test(doc));
      docs.push({ lab: kind + " " + lv, html: doc });
    }
  }
  ok("reading 6th–8th: one passage per page (a full page each)", L.placementPages("reading", READ, { lv: "g78" }).child.length === 2 && L.placementPages("reading", READ, { lv: "g2" }).child.length === 1);
  ok("placement for an unknown level → nothing", L.placementPages("reading", READ, { lv: "prek" }) === null && L.placementDoc("number", NUM, { lv: "zz" }) === "");
  {
    const c = sandbox({ grades: { a: { key: "5", from: "family" } }, settings: { a: { ladders: { number: { lv: "g7", cur: { week: 2, lv: "g7", from: 4, adv: 5 } } } } } });
    let opened = 0; c.window.open = () => { opened++; return null; }; c.alert = () => {};
    vm.runInContext("alert=this.alert", c);
    const before = JSON.stringify(c.notebookSettings);
    c.nbLadderPlacement("a", "number");
    ok("Print placement opens a window inside the tap and writes nothing", opened === 1 && c.writes.length === 0 && JSON.stringify(c.notebookSettings) === before);
  }

  // ════════════════════════════════════════ byte for byte ════════════════════════════════════════
  console.log("── every built-in notebook = this tree minus NBLADDER ──");
  const exportLine = "    ladders: NB_LADDERS,                // 📚 NBLADDER: the two notebook ladders — engine + placement (slice 1; no page reads them yet)\n";
  ok("the export line is where the cut expects it", nbSrc.split(exportLine).length === 2);
  const base = nbSrc.slice(0, n0) + nbSrc.slice(n1 + "  // NBLADDER_END\n".length).replace(exportLine, "");
  ok("the baseline has no trace of NBLADDER", !/NBLADDER|NB_LADDERS|ladderNext|LADDER_/.test(base));
  const NB0 = load(base);
  const dates = { monday: "November 16", tuesday: "November 17", wednesday: "November 18", thursday: "November 19", friday: "November 20" };
  const tasks = (kid) => Object.keys(dates).map((d, i) => ({ id: kid + i, who: kid, day: d, title: "📖 Reading " + i, time: "10:00 AM", mom: "none" }));
  const XP = { allAboutMe: { on: true }, moneyLife: { on: true }, wilderness: { on: true }, memoryCivics: { on: true }, notes: { on: true } };
  const mk = (kid, extra) => Object.assign({ weekData: { dates, tasks: tasks(kid) }, weekNum: 12, weekDates: "Nov 16–20, 2026", extraPages: XP, prevSummary: {}, pace: [], units: [], nbKidName: "Student" }, extra || {});
  const all = (o) => (o.student || "") + "\n<<PARENT>>\n" + (o.parent || "");
  const sx = sandbox({ grades: { k1: { key: "3", from: "family" } }, settings: { k1: { ladders: { number: { on: true }, reading: { on: true, lv: "g2" } } } } });
  sx._nbLadData.number = NUM; sx._nbLadData.reading = READ;
  const LCTX = JSON.parse(JSON.stringify(sx.nbLadderCtx("k1")));
  ok("the test's ctx.ladders is a full one (both on, items loaded)", LCTX.number.next.items.length === 5 && LCTX.reading.next.items.length === 2);
  const themes = Object.keys(NB.themes || {});
  const GENS = Object.keys(NB.GENERATORS).map((k) => [k]).concat(themes.map((th) => ["kidt_" + th, { notebookTheme: th, nbGrade: "Pre-K", kidName: "Sam" }]), [["kidz"], ["kidg", { gradeBand: "3rd–4th", grade: "3rd Grade" }]]);
  ok("every generator in GENERATORS + every look + a starter notebook (" + GENS.length + ")", GENS.length >= Object.keys(NB.GENERATORS).length + 2);
  for (const [kid, extra] of GENS) {
    const was = all(NB0.generate(kid, mk(kid, extra)));
    ok(kid + ": student + guide = before, ladders or not", all(NB.generate(kid, mk(kid, extra))) === was && all(NB.generate(kid, mk(kid, Object.assign({ ladders: LCTX }, extra)))) === was);
  }
  {
    const byKid = {}; Object.keys(NB.GENERATORS).forEach((k) => (byKid[k] = mk(k, { ladders: LCTX })));
    const byKid0 = {}; Object.keys(NB.GENERATORS).forEach((k) => (byKid0[k] = mk(k)));
    ok("the combined parent packet = before", NB.combinedParent(byKid) === NB0.combinedParent(byKid0));
  }

  // ════════════════════════════════════════ page fit ════════════════════════════════════════
  console.log("── page fit (8.5×11in, overflow hidden) ──");
  const MEASURE = function () {
    return [].map.call(document.querySelectorAll(".page"), function (pg) {
      const r = pg.getBoundingClientRect(), cs = getComputedStyle(pg), lim = r.bottom - parseFloat(cs.paddingBottom);
      let low = r.top; [].forEach.call(pg.querySelectorAll("*"), function (el) { const b = el.getBoundingClientRect().bottom; if (b > low) low = b; });
      return { lab: pg.getAttribute("data-lab"), h: Math.round(r.height), spare: Math.round(lim - low), wide: pg.scrollWidth - pg.clientWidth };
    });
  };
  const CHROME = process.env.CHROME_BIN || process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (!fs.existsSync(CHROME)) console.log("  page measurement — SKIPPED (no Google Chrome at " + CHROME + "; set CHROME_BIN)");
  else {
    // all sheets in one document (they share one stylesheet), web fonts not loaded (as the other notebook fit tests)
    const head = docs[0].html.slice(0, docs[0].html.indexOf("<body>") + 6).replace(/<link[^>]*fonts\.googleapis[^>]*>/g, "");
    const body = docs.map((d) => { const b = d.html.slice(d.html.indexOf("<body>") + 6, d.html.lastIndexOf("</body>")); let n = 0; return b.replace(/<div class="page ([a-z-]+)">/g, (m, cl) => '<div class="page ' + cl + '" data-lab="' + d.lab + " · " + (++n) + '">'); }).join("\n");
    const html = head + body + "<script>window.addEventListener('load',function(){document.body.setAttribute('data-r',JSON.stringify((" + MEASURE.toString() + ")()));});</script></body></html>";
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nbladder-")), f = path.join(dir, "p.html");
    fs.writeFileSync(f, html);
    let res = null;
    for (let tryN = 0; tryN < 3 && !res; tryN++) {
      const r = cp.spawnSync(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--user-data-dir=" + path.join(dir, "prof" + tryN), "--virtual-time-budget=3000", "--dump-dom", "file://" + f], { stdio: ["ignore", "pipe", "ignore"], maxBuffer: 1 << 28, timeout: 60000 });
      const m = /data-r="([^"]*)"/.exec(String(r.stdout || ""));
      if (m) res = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"));
    }
    if (!res) console.log("  page measurement — SKIPPED (Google Chrome would not run headless here)");
    else {
      const bad = res.filter((p) => p.spare < 0 || p.wide > 0 || p.h !== 1056);
      const tight = res.slice().sort((a, b) => a.spare - b.spare).slice(0, 4).map((p) => p.lab + " " + p.spare + "px");
      ok("Google Chrome headless: " + res.length + " placement pages, every one 11in tall with nothing clipped (tightest: " + tight.join(", ") + ")", !bad.length && res.length === docs.reduce((n, d) => n + (d.html.match(/<div class="page /g) || []).length, 0), bad);
    }
  }

  console.log(pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.log("  FAIL - threw: " + (e && e.stack || e)); process.exit(1); });
