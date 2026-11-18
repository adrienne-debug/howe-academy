// 🇺🇸 United States Path — slice 6 part 1 USNB: the notebook's stage pages (PLAN_us_unit_2026-11-16.md §7, §9 row 6; her go
// 2026-11-17 via the hub: "Yes, start it"). Runs the real notebooks.js (every generator) and the real index.html USNB builder
// (usNbCtx / usNbAttach / usNbAmendPic, with the real STARTER_UNITS block, us.js, the photo files and geo.js). Made-up kids only:
//  · NOT ENROLLED = BYTE FOR BYTE: notebooks.js with its USNB block and "// USNB" lines stripped is main's file, and every
//    generator (Lincoln, Ellis, Lucy, Julian, Caleb, a themed Pre-K, the starter notebook) prints the same notebook from both;
//  · enrolled at Stage n: one stage page for 1, 2, 3, 4, 6, 7, 10 (none yet for 5, 8, 9 — the map pages are part 2);
//  · a page never prints what the child writes: no president's name on Stage 7, no answer on the quiz or Who am I?, the
//    match-up pictures carry no number, the four "find out with Mom" lines are blank;
//  · pictures not loaded → no empty picture boxes (portraits left out, 🎉 for a holiday, phrases for the Bill of Rights);
//  · the Memory Work page: President of the Week = the kid's learning Presidents card, + the stage's recite line;
//  · the builder (index.html) reads only: the kid's stage cards with statuses, writes nothing, and returns null when not enrolled.
// Page overflow (8.5×11in, clipped silently) is measured in a real browser — see the hand-over note; this file checks content.
const fs = require("fs"), path = require("path"), vm = require("vm");
const rd = f => fs.readFileSync(path.join(__dirname, f), "utf8");
const nbSrc = rd("notebooks.js"), src = rd("index.html");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 500) : "")); } };

console.log("── wiring ──");
const n0 = nbSrc.indexOf("  // USNB_START"), n1 = nbSrc.indexOf("  // USNB_END\n");
ok("notebooks.js: one USNB block, right after unitInsertPages", n0 > 0 && n1 > n0 && nbSrc.indexOf("  // USNB_START", n0 + 1) < 0 &&
  nbSrc.lastIndexOf("function unitInsertPages(", n0) > nbSrc.lastIndexOf("function spellNbPages(", n0) && nbSrc.indexOf("function generateLincoln(") > n1);
const hookLines = nbSrc.split("\n").filter(l => /   \/\/ USNB(:|$)/.test(l));
ok("notebooks.js: exactly four one-line hooks outside the block (President of the Week, recite line, Lincoln, Ellis)", hookLines.length === 4 &&
  hookLines.filter(l => /_usNb = usNbOf\(ctx\);/.test(l)).length === 2 && hookLines.some(l => /pres = usNbPres\(_usNb\)/.test(l)) && hookLines.some(l => /recite = recite\.concat\(usNbRecite\(_usNb\)\)/.test(l)), hookLines);
const i0 = src.indexOf("// USNB_START"), i1 = src.indexOf("// USNB_END");
ok("index.html: the USNB block once, right after USCIVTEST_END, inside STARTER_UNITS", i0 === src.indexOf("// USCIVTEST_END") + "// USCIVTEST_END\n".length && i1 > i0 && i1 < src.indexOf("// STARTER_UNITS_END") && src.indexOf("// USNB_START", i0 + 1) < 0);
ok("index.html: one added line hands the kid's inserts to usNbAttach (haNbContext), guarded", (src.match(/usNbAttach\(kid,units\)/g) || []).length === 2 &&
  /let units=\[\]; try\{ units=haKidUnits\(kid\)[^\n]*\n  try\{ if\(typeof usNbAttach==="function"\) usNbAttach\(kid,units\); \}catch\(e\)\{\}/.test(src));
const blockTxt = nbSrc.slice(n0, n1) + src.slice(i0, i1);
const NAMES = /\b(adrienne|andrew|julian|lincoln|ellis|lucy|sara|caleb|taylor|kenzie|dewalt|burris|melanie|david|north carolina|raleigh)\b/i;
ok("no kid, family or state name in the new code", !NAMES.test(blockTxt.replace(/generateLincoln|generateEllis|Lincoln \/ Ellis|UNIT_INSERT_THEMES\.lincoln/g, "")), (blockTxt.match(NAMES) || [])[0]);
ok("no Firebase in the new code (read-only)", !/db\.ref|\.set\(|\.update\(|\.remove\(/.test(blockTxt));

// ── the notebooks ──
const load = s => { const w = {}; (new Function("window", "document", s))(w, {}); return w.HoweNotebooks; };
const strip = s => { const a = s.indexOf("  // USNB_START"), b = s.indexOf("  // USNB_END\n"); s = s.slice(0, a) + s.slice(b + "  // USNB_END\n".length); return s.split("\n").filter(l => !/   \/\/ USNB(:|$)/.test(l)).join("\n"); };
const NB = load(nbSrc), NB0 = load(strip(nbSrc));
ok("the stripped file has no trace of USNB", !/usNb|USNB|usStagePages/.test(strip(nbSrc)));

const win = {}, vctx = { window: win, module: undefined, console }; vm.createContext(vctx);
["geo.js", "us_pics_1.js", "us_pics_2.js", "us.js"].forEach(f => vm.runInContext(rd(f), vctx)); const L = win.HoweUS; L.geo = win.HoweGeo;
const bare = name => { const t = L.text("amend:" + parseInt(name, 10)); const b = t.replace(/<rect x="14" y="14" width="86" height="46"[^>]*\/><text[^>]*>[^<]*<\/text><\/svg>$/, "</svg>"); return "data:image/svg+xml;utf8," + encodeURIComponent(b); };
const PIC = { "American Holidays": 1, "Famous Americans": 1, "Amendments": 1, "Presidents": 1 };
function usRec(stage, grade, o) {   // the record usNbCtx makes (checked against the real builder below)
  o = o || {};
  const cards = L.cards.filter(c => c.stage === stage).map(c => ({ deck: c.deck, name: c.name, family: c.family, order: c.order, def: c.def || "", status: "",
    img: (!o.noPics && PIC[c.deck]) ? (c.deck === "Amendments" ? bare(c.name) : (L.svg(c.deck, c.name) || "")) : "" }));
  const by = {}; cards.forEach(c => (by[c.deck] = by[c.deck] || []).push(c));
  Object.values(by).forEach(a => a.forEach((c, i) => { c.status = i < 3 ? "learning" : i < (stage === 10 ? 14 : 7) ? "review" : ""; }));   // Stage 10 is one deck: 3 learning + 11 review
  if (stage === 7) { const f = o.fam || "Rebuilding and the Gilded Age", first = cards.find(c => c.family === f); cards.forEach(c => { c.status = c === first ? "learning" : ""; }); }
  if (o.pres) { const p = L.cards.find(c => c.deck === "Presidents" && c.name === o.pres); cards.push({ deck: "Presidents", name: p.name, family: p.family, order: p.order, def: p.def, status: "learning", img: "" }); }
  return { stage, label: (L.stages.find(s => s.n === stage) || {}).label || "", grade, cards };
}
const dates = { monday: "November 16", tuesday: "November 17", wednesday: "November 18", thursday: "November 19", friday: "November 20" };
const tasks = kid => Object.keys(dates).map((d, i) => ({ id: kid + i, who: kid, day: d, title: "📖 Reading " + i, time: "10:00 AM", mom: "none" }));
const OTHER = { unitId: "rocks", title: "Rocks & Gems", emoji: "💎", learning: [{ name: "Quartz", group: "Minerals", bio: "a common mineral", portrait: { emoji: "💎" } }], learned: [], next: [{ name: "Granite" }], extras: [], activities: [] };
const USINS = us => Object.assign({ unitId: "us_path", title: "United States Path", emoji: "🇺🇸", learning: [], learned: [], next: [{ name: "American flag" }], extras: [], activities: [] }, us ? { us } : {});
const mk = (kid, units, extra) => Object.assign({ weekData: { dates, tasks: tasks(kid) }, weekNum: 12, extraPages: {}, prevSummary: {}, pace: [], units, nbKidName: "Student" }, extra || {});
const GENS = [["lincoln"], ["ellis"], ["lucy"], ["julian"], ["caleb"], ["kidp", { notebookTheme: "shark", nbGrade: "Pre-K" }], ["kidz"]];

console.log("── not enrolled: byte for byte ──");
GENS.forEach(([kid, ex]) => {
  [["no units", []], ["another unit", [OTHER]], ["the US Path without a stage record", [USINS(null), OTHER]]].forEach(([lbl, units]) => {
    const a = NB.generate(kid, mk(kid, units, ex)), b = NB0.generate(kid, mk(kid, units, ex));
    ok(kid + (ex ? " (" + ex.notebookTheme + ")" : "") + ", " + lbl + ": student and parent notebooks identical to main's", a.student === b.student && a.parent === b.parent && a.student.length > 1000);
  });
});

console.log("── enrolled: one page for the stage ──");
const pageOf = (html, n) => { const lab = "United States Path — Stage " + n + " "; const i = html.indexOf(lab); if (i < 0) return null; const j = html.indexOf('<div class="page-label">', i + 10); return html.slice(i, j < 0 ? html.length : j); };
const countPages = html => (html.match(/<div class="page-label">United States Path — Stage /g) || []).length;
const BUILT = [1, 2, 3, 4, 6, 7, 10], GRADE = { lincoln: "6th Grade", ellis: "4th Grade", lucy: "1st Grade", julian: "Pre-K", caleb: "Kindergarten", kidp: "Pre-K", kidz: "" };
GENS.forEach(([kid, ex]) => {
  const got = [];
  for (let n = 1; n <= 10; n++) { const h = NB.generate(kid, mk(kid, [USINS(usRec(n, GRADE[kid])), OTHER], ex)).student; got.push(countPages(h) + (pageOf(h, n) ? "" : "-")); }
  ok(kid + ": Stages 1, 2, 3, 4, 6, 7, 10 each print exactly one page; 5, 8, 9 none yet", got.join() === "1,1,1,1,0-,1,1,0-,0-,1", got);
});
{ const a = NB.generate("lincoln", mk("lincoln", [USINS(usRec(4, "6th Grade")), OTHER])).student, b = NB0.generate("lincoln", mk("lincoln", [USINS(usRec(4, "6th Grade")), OTHER])).student;
  ok("the stage page rides right after the unit's usual insert, and nothing else in the notebook moves", a.indexOf("Unit Study — United States Path") < a.indexOf("United States Path — Stage 4") &&
    a.indexOf("United States Path — Stage 4") < a.indexOf("Unit Study — Rocks") && a.replace(/<div class="page-label">United States Path — Stage[\s\S]*?(?=<div class="page-label">)/, "").replace(/I Can Recite These[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, "") === b.replace(/I Can Recite These[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, "")); }

console.log("── the pages ──");
const gen = (kid, us, ex) => NB.generate(kid, mk(kid, [USINS(us)], ex)).student;
const text = h => h.replace(/<img[^>]*>/g, "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<");
{ const p1 = pageOf(gen("julian", usRec(1, "Pre-K")), 1), p1b = pageOf(gen("lincoln", usRec(1, "6th Grade")), 1);
  ok("Stage 1: an outline flag (13 stripes, 50 stars, all white) and a Liberty Bell to color", (p1.match(/<rect [^>]*height="[\d.]+" fill="#fff"/g) || []).length >= 13 && (p1.match(/<polygon /g) || []).length === 50 && !/fill="#(b91c1c|1e3a8a|dc2626)"/.test(p1.slice(p1.indexOf("<svg"))) && /Liberty Bell/.test(p1));
  ok("…Pre-K traces “USA”; an older kid writes how many stripes and stars (numbers not printed)", /#U#S#A/.test(p1) && !/#U#S#A/.test(p1b) && /stripes\./.test(text(p1b)) && !/\b13 stripes|\b50 stars/.test(text(p1b))); }
{ const us = usRec(2, "1st Grade"), p2 = pageOf(gen("lucy", us), 2), shown = us.cards.filter(c => c.deck === "American Holidays" && c.status).slice(0, 5);
  ok("Stage 2: this week's holidays (learning, then review), all 12 months, a line to draw", shown.every(c => p2.indexOf(c.name.replace(/'/g, "'")) >= 0) && ["January", "June", "December"].every(m => p2.indexOf(m) >= 0) && /Draw a line/.test(p2));
  ok("…1st grade traces the Pledge's first words; 4th grade writes about a favorite holiday", /#I #p#l#e#d#g#e/.test(p2) && !/#I #p#l#e#d#g#e/.test(pageOf(gen("ellis", usRec(2, "4th Grade")), 2)) && /favorite holiday/.test(pageOf(gen("ellis", usRec(2, "4th Grade")), 2)));
  ok("…the month each holiday falls in is never printed beside it", !/· (January|February|May|June|July|September|October|November|December)/.test(p2)); }
{ const us = usRec(3, "6th Grade"), p3 = pageOf(gen("lincoln", us), 3), ppl = us.cards.filter(c => c.deck === "Famous Americans" && c.status).slice(0, 4);
  ok("Stage 3: up to four of this week's Americans, portrait + name + lines; what they did is not printed", ppl.length === 4 && ppl.every(c => p3.indexOf(c.name) >= 0 && p3.indexOf(c.def.slice(0, 30)) < 0) && (p3.match(/<img /g) || []).length === 4);
  ok("…a 1st grader gets a drawing box instead of lines", /Draw what they did/.test(pageOf(gen("lucy", usRec(3, "1st Grade")), 3)) && !/Draw what they did/.test(p3)); }
{ const p4 = pageOf(gen("ellis", usRec(4, "4th Grade")), 4);
  ok("Stage 4: the three branches tree and How a bill becomes a law, both from word banks (four numbered boxes, blank)", /three branches tree/.test(p4) && /How a bill becomes a law/.test(p4) && (p4.match(/Word bank/g) || []).length === 2 && /Someone in Congress writes a bill/.test(p4) && (p4.match(/Branch: /g) || []).length === 3); }
{ const p6 = pageOf(gen("lincoln", usRec(6, "6th Grade")), 6), imgs = p6.match(/<img src="([^"]+)"/g) || [];
  ok("Stage 6: 10 numbers ↔ 10 pictures; no picture carries its number badge", imgs.length === 10 && imgs.every(s => !/%3E\d+(st|nd|rd|th)%3C/.test(s)) && ["1st", "5th", "10th"].every(x => p6.indexOf(">" + x + "<") >= 0));
  ok("…and “Which amendment says…?” asks for the number (not printed beside it)", /Which amendment says/.test(p6) && !/Which amendment says[^?]*\?\s*(1st|2nd|3rd|\d+th)/.test(text(p6)));
  const p6o = pageOf(gen("lincoln", usRec(6, "6th Grade", { noPics: true })), 6);
  ok("…pictures not loaded: the match-up uses short phrases (no empty boxes)", !/<img /.test(p6o) && /freedom of religion/.test(p6o) && /to what it says/.test(p6o)); }
{ const us = usRec(7, "6th Grade"), p7 = pageOf(gen("lincoln", us), 7), fam = us.cards.filter(c => c.family === "Rebuilding and the Gilded Age");
  ok("Stage 7: this week's era (the learning card's family), number + years printed, portraits", fam.length === 8 && fam.every(c => p7.indexOf(">" + c.name.replace(" President", "") + "<") >= 0 && p7.indexOf(c.def.split(" · ")[1]) >= 0) && (p7.match(/<img /g) || []).length === 8);
  ok("…no president's name on the page (the kid writes it)", fam.every(c => text(p7).indexOf(c.def.split(" · ")[0]) < 0), fam.filter(c => text(p7).indexOf(c.def.split(" · ")[0]) >= 0).map(c => c.def.split(" · ")[0]));
  const p7o = pageOf(gen("lincoln", usRec(7, "6th Grade", { noPics: true, fam: "Founders" })), 7);
  ok("…portraits not loaded: no picture boxes, numbers and years still print", !/<img /.test(p7o) && />1st</.test(p7o) && /1789–1797/.test(p7o)); }
{ const us = usRec(10, "6th Grade"), p10 = pageOf(gen("lincoln", us), 10), qs = us.cards.filter(c => c.status).slice(0, 10);
  ok("Stage 10: 10 of the kid's learning and review questions, numbered, with lines; answers not printed", qs.length === 10 && qs.every(c => text(p10).indexOf(c.name.replace(/“|”/g, "\"").slice(0, 25)) >= 0 || p10.indexOf(c.name.slice(0, 25)) >= 0) &&
    (t => qs.every(c => c.def.length < 4 || t.indexOf(c.def) < 0))(qs.reduce((t, c) => t.split(c.name).join(" "), p10.replace(/<[^>]+>/g, " "))) && />10</.test(p10));   // an answer can sit inside another question's words
  ok("…the four “find out with Mom” lines: governor, two senators, representative, capital — blank", /Find out with Mom/.test(p10) && ["My state's governor:", "My state's two U.S. senators:", "My U.S. representative:", "My state's capital:"].every(t => text(p10).indexOf(t) >= 0) &&
    !/\b(Raleigh|Governor [A-Z]|Senator [A-Z])/.test(text(p10)));
  const few = usRec(10, "6th Grade"); few.cards.forEach((c, i) => { c.status = i < 3 ? "learning" : ""; });
  ok("…a kid just starting (3 learning) gets those 3, not questions they haven't met", (pageOf(gen("lincoln", few), 10).match(/font-size:12\.5px;font-weight:700;line-height:1\.3">/g) || []).length === 3); }
{ const p2o = pageOf(gen("lucy", usRec(2, "1st Grade", { noPics: true })), 2), p3o = pageOf(gen("lucy", usRec(3, "1st Grade", { noPics: true })), 3);
  ok("pictures not loaded: holidays show 🎉, Americans print without a portrait — no empty picture box", !/<img /.test(p2o) && (p2o.match(/🎉/g) || []).length === 5 && !/<img /.test(p3o) && /Pocahontas/.test(p3o)); }

ok("American spelling on every US page (the rest of the notebook says “color”, “favorite”): no “colour”, no “favourite”", (() => { let all = ""; GENS.forEach(([kid, ex]) => BUILT.forEach(n => { all += pageOf(gen(kid, usRec(n, GRADE[kid]), ex), n) || ""; all += pageOf(gen(kid, usRec(n, GRADE[kid], { noPics: true }), ex), n) || ""; })); return all.length > 100000 && !/olour|avourite/i.test(all) && /Color the Flag/.test(all) && /favorite holiday/.test(all); })());

console.log("── the Memory Work page ──");
const mw = h => { const i = h.indexOf("Memory Work &amp; Civics"); const a = h.lastIndexOf('<div class="page', i); return h.slice(a, h.indexOf("I Can Recite These", i) + 2000); };
{ const before = mw(gen("lincoln", null)), pres = mw(gen("lincoln", usRec(7, "6th Grade"))), early = mw(gen("lincoln", usRec(4, "6th Grade"))), lincolnP = mw(gen("lincoln", usRec(4, "6th Grade", { pres: "16th President" })));
  ok("not enrolled: President of the Week as today", before === mw(NB0.generate("lincoln", mk("lincoln", [USINS(null)])).student));
  ok("enrolled and learning a Presidents card: President of the Week is that card (the 18th — name, number, years, fact)", /Ulysses S\. Grant<\/span>/.test(pres) && /18th · 1869–1877/.test(pres) && /winning Union general/.test(pres));
  ok("enrolled before Stage 7 (no Presidents card): the week's cycle, as today", early.indexOf(before.slice(before.indexOf("President of the Week"), before.indexOf("I Can Recite"))) >= 0);
  ok("…unless the kid is learning one anyway (placed at 7 earlier)", /Abraham Lincoln<\/span>/.test(lincolnP) && /16th · 1861–1865/.test(lincolnP));
  ok("“I Can Recite These” gains the stage's line (Stage 4: how a bill becomes a law; Stage 7: the presidents in order)", /How a bill becomes a law, in four steps/.test(early) && /The presidents in order, up to this week/.test(pres) && !/in four steps/.test(before));
  ok("Ellis's notebook reads it too", /Ulysses S\. Grant<\/span>/.test(mw(gen("ellis", usRec(7, "4th Grade"))))); }

console.log("── the builder (index.html) ──");
{ const a = src.indexOf("// STARTER_UNITS_START"), b = src.indexOf("// STARTER_UNITS_END"), block = src.slice(a, b);
  const fnSrc = n => { const i = src.indexOf("function " + n + "("); let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } };
  const VOCAB = src.slice(src.indexOf("const MAST_VOCAB_DEFS={"), src.indexOf('if(typeof _wrSlashDefs==="function") Object.assign(MAST_VOCAB_DEFS'));
  const GATE = ["mastGateChapter", "mastDefKeyOk", "mastFullBank", "mastBankEligible", "haKeyOk", "haKey", "mastGetDef", "_unitPortrait"].map(fnSrc).join("\n");
  const G = { writes: [], masteryData: {}, unitStudies: {} };
  const db = { ref(p) { return { update(v) { G.writes.push(p); return Promise.resolve(); }, set(v) { G.writes.push(p); return Promise.resolve(); } }; } };
  const W = new Function("G", "db", "window", `const masteryData=G.masteryData; let unitStudies=G.unitStudies; const MAST_BANK_MAP={};
    function momHere(){ return true; } function _dryRun(){ return false; } function cap(s){ return s; } function nbGradeOf(k){ return k==="kidq"?"6th Grade":""; }
    ${VOCAB}
    ${GATE}
    ${block}
    return { STARTER_UNITS, usNbCtx, usNbAttach, usNbAmendPic, usHydrate, usLib };`)(G, db, win);
  const u = W.STARTER_UNITS.us_path(); W.usHydrate(u, L); G.unitStudies.us_path = u;
  u.enrolled = { kidq: true }; u.kidStage = { kidq: { stage: 6, ts: 1 } };
  G.masteryData.kidq = [{ id: "a", subject: "Amendments", prompt: "1st Amendment", status: "introduction", tier: "daily" }, { id: "b", subject: "Amendments", prompt: "2nd Amendment", status: "active", tier: "weekly" },
    { id: "c", subject: "Presidents", prompt: "16th President", status: "introduction", tier: "daily" }, { id: "d", subject: "Amendments", prompt: "3rd Amendment", status: "parked" }];
  G.masteryData.kidq_settings = { definitions: { "2nd Amendment": "Mom's own words" } };
  const before = JSON.stringify(G.masteryData) + JSON.stringify(u);
  const r = W.usNbCtx("kidq", u);
  ok("usNbCtx: stage, label, grade, and the stage's 30 cards + the learning Presidents card, in order", r && r.stage === 6 && r.label === "The Bill of Rights & all 27 amendments" && r.grade === "6th Grade" &&
    r.cards.length === 31 && r.cards.filter(c => c.deck === "Presidents").map(c => c.name).join() === "16th President" && r.cards.every((c, i, A) => !i || A[i - 1].order <= c.order));
  ok("…statuses: introduction → learning, active → review, parked or none → \"\"", (s => s["1st Amendment"] === "learning" && s["2nd Amendment"] === "review" && s["3rd Amendment"] === "" && s["4th Amendment"] === "")(Object.fromEntries(r.cards.map(c => [c.name, c.status]))));
  ok("…the kid's saved back wins over the unit's", r.cards.find(c => c.name === "2nd Amendment").def === "Mom's own words" && r.cards.find(c => c.name === "1st Amendment").def === L.card("Amendments", "1st Amendment").def);
  ok("…amendment pictures without their number badge; Civics / U.S. History cards carry no picture", r.cards.filter(c => c.deck === "Amendments").every(c => /^data:image\/svg/.test(c.img) && !/%3E\d+(st|nd|rd|th)%3C/.test(c.img)) &&
    r.cards.filter(c => c.deck !== "Amendments").every(c => c.img === ""));
  ok("…reads only: nothing written, the kid's cards and the unit untouched", G.writes.length === 0 && JSON.stringify(G.masteryData) + JSON.stringify(u) === before);
  ok("not enrolled, no stage, or another unit → null", W.usNbCtx("kidr", u) === null && W.usNbCtx("kidq", Object.assign({}, u, { kidStage: {} })) === null && W.usNbCtx("kidq", { id: "rocks", decks: [] }) === null);
  const ins = [{ unitId: "us_path" }, { unitId: "rocks" }]; G.unitStudies.rocks = { id: "rocks", decks: [] }; W.usNbAttach("kidq", ins);
  ok("usNbAttach: only the US Path's insert gets the record", ins[0].us && ins[0].us.stage === 6 && !("us" in ins[1]));
  const ins2 = [{ unitId: "us_path" }]; W.usNbAttach("kidr", ins2); ok("…and a kid not enrolled gets none", !("us" in ins2[0]));
  const L2 = Object.assign({}, L, { text: () => "<svg></svg>" });
  ok("usNbAmendPic: \"\" when us.js isn't here or the drawing has no badge to take off", (() => { const w2 = new Function("window", `${fnSrc("usNbAmendPic")}; function usLib(){ return window.HoweUS||null; } return usNbAmendPic;`); return w2({})("1st Amendment") === "" && w2({ HoweUS: L2 })("1st Amendment") === ""; })());
  // the record the builder makes matches the one the page tests above use
  const r7 = (u.kidStage.kidq = { stage: 7, ts: 1 }, W.usNbCtx("kidq", u));
  ok("the builder's Stage 7 record has what the pages read (deck, name, family, order, def, status, img)", r7.cards.every(c => ["deck", "name", "family", "order", "def", "status", "img"].every(k => k in c)) && r7.cards.filter(c => c.deck === "Presidents").length === 47 &&
    /^data:image\/jpeg/.test(r7.cards.find(c => c.name === "16th President").img)); }

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
