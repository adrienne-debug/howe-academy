/*
 * Node tests — 📝 ENVTEST: the Envirothon station check-ins (pre-test → cards → post-test → 🎓 graduated), PR 2 of the
 * Envirothon plan (her words 2026-10-27: "having a pre-test on the area that's about to be studied, and then the same test or
 * another test in that same category after they have finished learning those cards, and then maybe if it gets to the graduated
 * point"; DESIGN_envirothon_console §DECISIONS; PLAN_envirothon §2).
 *   · envirothon.js carries HoweEnvirothon.tests (compiled from envirothon/nc_envirothon_tests.json): five stations, pre + post
 *     forms, every item with its choices, keyed answer and source cite; the counts kept / dropped match TESTS.md; no question
 *     text in index.html; station ids are the unit's deck stations and carry the stage labels.
 *   · The block (sliced from index.html with ENVUNIT, inside STARTER_UNITS): pre-test open only after a release, taken once;
 *     post-test locked until every deck of the station is mastered (the real mastDeckMastery rule) or Mom opens it early; the
 *     test flow (pick, Back, Next, Finish, Quit keeps nothing); scoring and the 80 % pass (shorter forms round up); the exact
 *     write paths and nothing else written; a 24 h retake; graduated; dry run writes nothing; the Units tab card with and
 *     without records and byte-identical for a kid not in the unit; the hooks; no kid's name in the block.
 *   run: node test_env_tests.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const LIB = require(path.join(__dirname, "envirothon.js"));
const JSON_T = JSON.parse(fs.readFileSync(path.join(__dirname, "envirothon", "nc_envirothon_tests.json"), "utf8"));
const TESTS_MD = fs.readFileSync(path.join(__dirname, "envirothon", "TESTS.md"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 300) : "")); } };
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };

const a = src.indexOf("// STARTER_UNITS_START"), b = src.indexOf("// STARTER_UNITS_END");
const block = src.slice(a, b);
const ta = src.indexOf("// ENVTEST_START"), tb = src.indexOf("// ENVTEST_END");
const TBLK = src.slice(ta, tb);
ok("ENVTEST block present once, right after ENVUNIT_END, inside STARTER_UNITS", ta > a && tb < b && src.indexOf("// ENVTEST_START", ta + 1) < 0 && src.slice(src.indexOf("// ENVUNIT_END"), ta).trim() === "// ENVUNIT_END");
ok("no Howe kid's name in the block (the kid comes from the caller)", !/lincoln|ellis|lucy|julian|famName/i.test(TBLK));
ok("no 🔀 in index.html", src.indexOf("\u{1F500}") < 0);

// ── the forms ──────────────────────────────────────────────────────────────────────────────────────────────────────
console.log("── envirothon.js: HoweEnvirothon.tests ──");
const T = LIB.tests, SIDS = ["forestry", "soils", "aquatics", "wildlife", "cei"];
ok("five stations in the club's order", T && Object.keys(T).join() === SIDS.join(), T && Object.keys(T));
const EXPECT = { forestry: [15, 14], soils: [15, 17], aquatics: [14, 13], wildlife: [15, 14], cei: [20, 20] };
const EXPECT_DROP = { forestry: [5, 6], soils: [5, 3], aquatics: [6, 7], wildlife: [5, 6], cei: [0, 0] };
SIDS.forEach(s => { const r = T[s]; ok(s + ": pre " + EXPECT[s][0] + " kept, post " + EXPECT[s][1] + " kept (TESTS.md)", r.pre.n === EXPECT[s][0] && r.pre.items.length === r.pre.n && r.post.n === EXPECT[s][1] && r.post.items.length === r.post.n, [r.pre.n, r.post.n]);
  const J = JSON_T.stations[s]; ok(s + ": dropped " + EXPECT_DROP[s].join("/") + " in the JSON, each with a reason", J.pre.dropped.length === EXPECT_DROP[s][0] && J.post.dropped.length === EXPECT_DROP[s][1] && J.pre.dropped.concat(J.post.dropped).every(d => d.n >= 1 && d.n <= 20 && d.why.length > 10)); });
const ALL = []; SIDS.forEach(s => ["pre", "post"].forEach(w => T[s][w].items.forEach(it => ALL.push(Object.assign({ _s: s, _w: w }, it)))));
console.log("     items compiled: " + ALL.length);
ok("every item: question text, a cite, 2–5 choices, a keyed answer inside the choices", ALL.every(it => typeof it.q === "string" && it.q.trim().length > 8 && typeof it.cite === "string" && it.cite.trim() && Array.isArray(it.choices) && it.choices.length >= 2 && it.choices.length <= 5 && it.choices.every(c => typeof c === "string" && c.trim()) && (Number.isInteger(it.ans) ? (it.ans >= 0 && it.ans < it.choices.length) : (Array.isArray(it.ans) && it.ans.length >= 2 && it.ans.every((x, i) => Number.isInteger(x) && x >= 0 && x < it.choices.length && (i === 0 || x > it.ans[i - 1]))))));
ok("4 choices everywhere except two True/False items (Forestry post 11, 13) and one 5-choice item (Wildlife post 9)", ALL.filter(it => it.choices.length !== 4).map(it => it._s + " " + it._w + " " + it.n + ":" + it.choices.length).join("|") === "forestry post 11:2|forestry post 13:2|wildlife post 9:5");
ok("select-all items: Forestry pre 1, 13, 15 · Aquatics pre 8 · CEI 2, 4, 7, 9, 18, 19 (pre and post)", ALL.filter(it => Array.isArray(it.ans)).map(it => it._s + " " + it._w + " " + it.n).join("|") === "forestry pre 1|forestry pre 13|forestry pre 15|aquatics pre 8|cei pre 2|cei pre 4|cei pre 7|cei pre 9|cei pre 18|cei pre 19|cei post 2|cei post 4|cei post 7|cei post 9|cei post 18|cei post 19");
ok("every item keeps its original number and no number repeats inside a form", SIDS.every(s => ["pre", "post"].every(w => { const ns = T[s][w].items.map(i => i.n); return ns.every(n => n >= 1 && n <= 20) && new Set(ns).size === ns.length; })));
ok("each form names its source file (.docx) and form", SIDS.every(s => ["pre", "post"].every(w => /\.docx$/.test(T[s][w].source) && /^20(26|22) Area 8 MS /.test(T[s][w].form))));
ok("pre forms are the 2026 tests; post forms the 2022 tests, except CEI = the 2026 form again with a note", SIDS.every(s => /^2026/.test(T[s].pre.form)) && SIDS.filter(s => s !== "cei").every(s => /^2022/.test(T[s].post.form)) && /^2026/.test(T.cei.post.form) && /same test/.test(T.cei.post.note) && JSON.stringify(T.cei.post.items) === JSON.stringify(T.cei.pre.items));
ok("the compiled tests match the JSON item for item (q, choices, ans, cite)", SIDS.every(s => ["pre", "post"].every(w => { const J = JSON_T.stations[s][w].items, C = T[s][w].items; return J.length === C.length && J.every((j, i) => JSON.stringify([j.n, j.q, j.choices, j.ans, j.cite]) === JSON.stringify([C[i].n, C[i].q, C[i].choices, C[i].ans, C[i].cite])); })));
ok("TESTS.md and the JSON agree on the counts", SIDS.every(s => TESTS_MD.indexOf("| " + EXPECT[s][0] + " / " + EXPECT_DROP[s][0] + " |") > 0 && TESTS_MD.indexOf("| " + EXPECT[s][1] + " / " + EXPECT_DROP[s][1] + " |") > 0));
ok("no question text in index.html", ["The 5 soil forming factors are", "Latent heat of fusion", "tapetum lucidum", "Hurricane Helene", "Biltmore", "mycorrhizae"].every(t => src.indexOf(t) < 0));
ok("the preview page lists every kept question with a Show-answers toggle", (() => { const h = fs.readFileSync(path.join(__dirname, "envirothon", "PREVIEW_tests.html"), "utf8"); return /Show answers/.test(h) && !/firebase|<script src/i.test(h) && (h.match(/<div class=q>/g) || []).length === ALL.length - T.cei.post.n; })());

// ── a tiny world ───────────────────────────────────────────────────────────────────────────────────────────────────
function world(o) {
  o = o || {};
  const G = { masteryData: o.mastery || {}, unitStudies: o.unitStudies || {}, writes: [], dry: !!o.dry, mom: o.mom !== false, rendered: 0, now: o.now || 1800000000000, confirmAns: true, els: {}, renders: 0 };
  const db = o.db || { ref(p) { return { update(v) { G.writes.push(["update", p, v]); }, set(v) { G.writes.push(["set", p, v]); },
    transaction(fn) { const r = fn(null); G.writes.push(["transaction", p, r]); return Promise.resolve({ committed: true }); } }; } };
  const helpers = 'const MAST_TIER_ORDER=["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"]; const MAST_MASTERY_TIER_DEFAULT="monthly"; function mastIsNeverDrill(){ return false; }\n' + fn("mastTierAtLeast") + "\n" + fn("mastDeckMastery") + "\n";
  const api = new Function("G", "db", "LIB", "RealDate", `
    const masteryData=G.masteryData, currData={subjects:{}}; let unitStudies=G.unitStudies; const window={ HoweEnvirothon: ${o.lib === null ? "null" : "LIB"} }; let tab="units";
    const _els=G.els; const document={ getElementById:id=>_els[id]||null, createElement:()=>({ style:{}, _h:"", set innerHTML(v){ this._h=v; }, get innerHTML(){ return this._h; }, parentNode:null }), head:{ appendChild(){} },
      body:{ appendChild(el){ _els[el.id]=el; el.parentNode={ removeChild(){ delete _els[el.id]; } }; } } };
    const location={ hostname:"localhost" }; function Date(...a){ return a.length?new RealDate(...a):new RealDate(G.now); } Date.now=()=>G.now;
    function momHere(){ return G.mom; } function _dryRun(){ return G.dry; } function cap(s){ return s[0].toUpperCase()+s.slice(1); }
    function renderUnits(){ G.rendered++; } function renderAll(){ G.renders++; } const HA_LS={ setItem(){} }; function confirm(){ return G.confirmAns; }
    function setInterval(){ return 1; } function clearInterval(){} function _todayStr(){ return "2027-01-20"; }
    function mastDefKeyOk(p){ return !/[.#$\\[\\]\\/]/.test(p); }
    function mastDefKey(p){ p=String(p); return mastDefKeyOk(p)?p:p.replace(/[.#$\\[\\]\\/%]/g,c=>"%"+c.charCodeAt(0).toString(16).toUpperCase().padStart(2,"0")); }
    function mastGateChapter(){ return null; } function mastFullBank(){ return {}; }
    ${helpers}
    ${block}
    return { STARTER_UNITS, ENV_DECKS, ENV_STAGES, envUnitRecord, envHydrateAll, unitStageFormOpen, unitStageEnroll, unitStageMoveUp,
      envtStations, envtStation, envtForm, envtPassAt, envtRec, envtStatus, envtReleased, envtAllMastered, envtDeckMastered, envtLineHtml, envtKidCardsHtml, envtDetailHtml, envtStartHtml,
      envtMomOpen, envtOpen, envtPick, envtBack, envtNext, envtQuit, envtFinish, envtClose, envtScore, envtHtml, mastDeckMastery,
      get state(){ return envtState; }, get us(){ return unitStudies; }, ov(){ return _els["envtest-ov"]?_els["envtest-ov"].innerHTML:null; } };`
  ).call(null, G, db, LIB, globalThis.Date);
  api.G = G; return api;
}
// a world with the unit added and one kid enrolled at stage 0 (every deck held), writes cleared
function enrolled(kid, o) { const w = world(o); w.G.unitStudies.nc_envirothon = w.envUnitRecord(); w.envHydrateAll(); w.unitStageFormOpen("nc_envirothon", kid); w.unitStageEnroll(); w.G.writes.length = 0; return w; }
const K = "kid1", U = w => w.us.nc_envirothon;
// take a sitting: answer the first `right` items with the keyed answer, the rest wrong; returns the finish result
function take(w, kid, station, which, right) {
  if (!w.envtOpen(kid, station, which)) return null;
  const f = w.state.form;
  f.items.forEach((it, i) => { const keyed = Array.isArray(it.ans) ? it.ans : [it.ans];
    if (i < right) keyed.forEach(x => w.envtPick(x)); else { const wrong = it.choices.map((_, k) => k).find(k => keyed.indexOf(k) < 0); w.envtPick(wrong); }
    w.envtNext(); });
  return w.state && w.state.done;
}

console.log("\n── stations = the unit's deck stations, labels = the stages ──");
{ const w = world(); const S = w.envtStations();
  ok("five stations, ids = ENV_DECKS stations, in deck order", S.map(s => s.id).join() === SIDS.join());
  ok("labels are the stage labels (Forestry, Soils/Land Use, Aquatic Ecology, Wildlife, Current Environmental Issues)", S.map(s => s.label).join("|") === "Forestry|Soils/Land Use|Aquatic Ecology|Wildlife|Current Environmental Issues" && S.every(s => s.label === LIB.tests[s.id].label));
  ok("each station's decks are its ENV_DECKS rows with their card counts (3 each, CEI 1)", S.map(s => s.decks.length).join() === "3,3,3,3,1" && S.find(s => s.id === "soils").decks.map(d => d.key).join("|") === "Soils and Land Use · Terms|Soils and Land Use · Facts|Soils and Land Use · ID" && S.find(s => s.id === "soils").decks.reduce((n, d) => n + d.n, 0) === 850);
  ok("station ids are Firebase-safe keys", S.every(s => !/[.#$\[\]\/]/.test(s.id)));
  ok("pass at 80 %: 16/20, 12/15, 12/14, 11/13, 14/17", [20, 15, 14, 13, 17].map(w.envtPassAt).join() === "16,12,12,11,14");
  ok("envirothon.js not loaded → no stations, every html helper empty, nothing throws", (() => { const w2 = world({ lib: null }); return w2.envtStations().length === 0 && w2.envtKidCardsHtml({ id: "nc_envirothon", enrolled: { kid1: true } }, "kid1", true) === "" && w2.envtStartHtml("kid1", { sid: "envirothon" }) === ""; })()); }

console.log("\n── not enrolled → nothing ──");
{ const w = world(); w.G.unitStudies.nc_envirothon = w.envUnitRecord(); w.envHydrateAll(); const u = U(w);
  ok("status null, card / detail / line / start html all empty, no test opens", w.envtStatus(u, K, "forestry") === null && w.envtKidCardsHtml(u, K, true) === "" && w.envtDetailHtml(u, [K], true) === "" && w.envtLineHtml(u, K) === "" && w.envtStartHtml(K, { sid: "envirothon" }) === "" && w.envtOpen(K, "forestry", "pre") === false && w.G.writes.length === 0);
  ok("another unit → empty too", w.envtKidCardsHtml({ id: "word_roots", enrolled: { kid1: true } }, K, true) === "" && w.envtDetailHtml({ id: "word_roots", enrolled: { kid1: true } }, [K], true) === ""); }

console.log("\n── enrolled, everything held → no pre-test yet ──");
{ const w = enrolled(K); const u = U(w);
  const st = w.envtStatus(u, K, "forestry");
  ok("status: pre closed (nothing released), post locked on the cards, no line", st && !st.pre.open && !st.post.open && st.post.why === "cards" && st.line === "" && !st.graduated);
  ok("every station closed", SIDS.every(s => !w.envtStatus(u, K, s).pre.open && !w.envtStatus(u, K, s).post.open));
  ok("no hold map at all (data not here yet): closed; a minted card of the station's deck = released", (() => { const w2 = world({ unitStudies: { nc_envirothon: Object.assign(w.envUnitRecord(), { enrolled: { kid1: true } }) } }); w2.envHydrateAll();
    const closed = !w2.envtReleased(K, "forestry") && !w2.envtStatus(w2.us.nc_envirothon, K, "forestry").pre.open; w2.G.masteryData.kid1 = [{ id: "x", subject: "Forestry · Facts", prompt: "Cambium", status: "introduction", tier: "daily" }]; return closed && w2.envtReleased(K, "forestry") && !w2.envtReleased(K, "soils"); })());
  const h = w.envtKidCardsHtml(u, K, false);
  ok("the kid's card lists the five stations as 'not sent out yet', no Start, no Mom button", (h.match(/not sent out yet/g) || []).length === 5 && !/envtOpen\(/.test(h) && !/envtMomOpen/.test(h) && /Soils\/Land Use/.test(h));
  ok("Mom sees 🔓 Open the final early on each station", (w.envtKidCardsHtml(u, K, true).match(/envtMomOpen\('kid1','(forestry|soils|aquatics|wildlife|cei)'\)/g) || []).length === 5);
  ok("pre-test cannot be opened", w.envtOpen(K, "forestry", "pre") === false && w.state === null);
  ok("the 🌿 session start shows nothing; another session shows nothing", w.envtStartHtml(K, { sid: "envirothon" }) === "" && w.envtStartHtml(K, { sid: "daily" }) === "");
  ok("line html empty (no records)", w.envtLineHtml(u, K) === ""); }

console.log("\n── a release opens the pre-test, once ──");
{ const w = enrolled(K); const u = U(w); delete w.G.masteryData.kid1_settings.cat_hold["Forestry · Terms"];   // PR 3's send-out: the hold cleared
  ok("released: Forestry pre open, the other stations still closed", w.envtReleased(K, "forestry") && w.envtStatus(u, K, "forestry").pre.open && SIDS.filter(s => s !== "forestry").every(s => !w.envtStatus(u, K, s).pre.open));
  const h = w.envtKidCardsHtml(u, K, false);
  ok("the card: '📝 Forestry check-in · 15 questions' with Start → envtOpen(kid, forestry, pre)", /Forestry check-in/.test(h) && /15 questions/.test(h) && /envtOpen\('kid1','forestry','pre'\)/.test(h) && /check-in ready/.test(h));
  ok("the same card tops the kid's 🌿 session start (and only that session)", /envtOpen\('kid1','forestry','pre'\)/.test(w.envtStartHtml(K, { sid: "envirothon" })) && w.envtStartHtml(K, { sid: "other" }) === "");
  ok("the unit's page shows the kid's block", /kid1|Kid1/.test(w.envtDetailHtml(u, [K], true)) && /envtOpen\('kid1','forestry','pre'\)/.test(w.envtDetailHtml(u, [K], true)) && w.envtDetailHtml(u, ["kid9"], true) === "");
  // the flow
  ok("Start: 15 items, question 1, nothing answered, a layer drawn with A–D letters and a timer", w.envtOpen(K, "forestry", "pre") === true && w.state.i === 0 && w.state.form.items.length === 15 && w.state.answers.every(x => x === null) && /1 of 15/.test(w.ov()) && /envt-timer/.test(w.ov()) && />A</.test(w.ov()) && />D</.test(w.ov()) && !/>E</.test(w.ov()));
  ok("Next without an answer does nothing", (w.envtNext(), w.state.i === 0));
  const it0 = w.state.form.items[0];
  ok("item 1 is a select-all item: picks toggle, the set is kept sorted", Array.isArray(it0.ans) && (w.envtPick(3), w.envtPick(0), w.envtPick(1), JSON.stringify(w.state.answers[0]) === "[0,1,3]") && (w.envtPick(1), JSON.stringify(w.state.answers[0]) === "[0,3]") && (w.envtPick(1), true));
  ok("Next → question 2; Back → question 1 with the answer kept; Back at 1 stays", (w.envtNext(), w.state.i === 1) && (w.envtBack(), w.state.i === 0 && JSON.stringify(w.state.answers[0]) === "[0,1,3]") && (w.envtBack(), w.state.i === 0));
  ok("a single-answer item: the last tap wins", (w.envtNext(), w.envtPick(2), w.envtPick(1), w.state.answers[1] === 1));
  ok("no feedback per item: the layer never says right / wrong before Finish", !/right|wrong|correct/i.test(w.ov().replace(/Pick every answer that fits/, "")));
  ok("Quit (confirmed) keeps nothing: no state, no layer, no write", (w.envtQuit(), w.state === null && w.ov() === null && w.G.writes.length === 0));
  ok("Quit declined keeps going", (w.envtOpen(K, "forestry", "pre"), w.G.confirmAns = false, w.envtQuit(), !!w.state) && (w.G.confirmAns = true, w.envtQuit(), w.state === null));
  // a full sitting: 12 of 15
  w.G.now = 1800000000000; const d = take(w, K, "forestry", "pre", 12);
  ok("Finish: 12 of 15, the result screen says 'now the cards', saved", d && d.right === 12 && d.n === 15 && d.saved === true && /12 of 15/.test(w.ov()) && /now the cards/.test(w.ov()) && !/Dry run/.test(w.ov()));
  const wr = w.G.writes;
  ok("ONE write: set mastery/kid1_tests/forestry/pre = {form, date, n, right, secs, answers, ts}", wr.length === 1 && wr[0][0] === "set" && wr[0][1] === "mastery/kid1_tests/forestry/pre" && (() => { const r = wr[0][2]; return r.form === "2026 Area 8 MS Forestry" && r.date === "2027-01-20" && r.n === 15 && r.right === 12 && typeof r.secs === "number" && r.ts === 1800000000000 && Array.isArray(r.answers) && r.answers.length === 15 && Array.isArray(r.answers[0]) && Number.isInteger(r.answers[1]); })(), wr);
  ok("in memory too; Done closes the layer and redraws", w.G.masteryData.kid1_tests.forestry.pre.right === 12 && (w.envtClose(), w.state === null && w.ov() === null && w.G.renders > 0));
  const st = w.envtStatus(u, K, "forestry");
  ok("after: pre closed for good (never twice), line 'Pre 12/15 · Post —', the post still locked on the cards", !st.pre.open && w.envtOpen(K, "forestry", "pre") === false && st.line === "Pre 12/15 · Post —" && !st.post.open && st.post.why === "cards");
  ok("the card shows the line and no Start; the Family-tab line names the station", /Pre 12\/15/.test(w.envtKidCardsHtml(u, K, false)) && !/envtOpen\(/.test(w.envtKidCardsHtml(u, K, false)) && /Forestry: Pre 12\/15/.test(w.envtLineHtml(u, K)));
  ok("nothing written anywhere else (no mastery/kid1, no settings, no unit record)", wr.every(x => /^mastery\/kid1_tests\/forestry\/pre$/.test(x[1]))); }

console.log("\n── the post-test: locked on the cards, Mom opens early, 24 h retake, 🎓 ──");
{ const w = enrolled(K); const u = U(w); delete w.G.masteryData.kid1_settings.cat_hold["Forestry · Terms"]; take(w, K, "forestry", "pre", 10); w.envtClose(); w.G.writes.length = 0;
  ok("post closed: not every deck mastered; opening it is refused", !w.envtStatus(u, K, "forestry").post.open && w.envtOpen(K, "forestry", "post") === false);
  ok("a kid's device can't open it early", (w.G.mom = false, w.envtMomOpen(K, "forestry"), w.G.writes.length === 0 && !w.envtStatus(u, K, "forestry").post.open));
  w.G.mom = true; w.envtMomOpen(K, "forestry");
  ok("Mom: one write set mastery/kid1_tests/forestry/postOpen = {date, ts}; the post opens", w.G.writes.length === 1 && w.G.writes[0][0] === "set" && w.G.writes[0][1] === "mastery/kid1_tests/forestry/postOpen" && w.G.writes[0][2].date === "2027-01-20" && w.envtStatus(u, K, "forestry").post.open);
  ok("the card: '📝 Forestry final · 14 questions' with Start; it tops the 🌿 start too", /Forestry final/.test(w.envtKidCardsHtml(u, K, false)) && /14 questions/.test(w.envtKidCardsHtml(u, K, false)) && /envtOpen\('kid1','forestry','post'\)/.test(w.envtStartHtml(K, { sid: "envirothon" })));
  w.G.writes.length = 0; w.G.now = 1800000100000; const d1 = take(w, K, "forestry", "post", 10);
  ok("10 of 14 → not passed (pass is 12): 'not yet', 'try again tomorrow'", d1 && d1.right === 10 && !d1.pass && !d1.grad && /10 of 14/.test(w.ov()) && /not yet/.test(w.ov()) && /pass is 12 of 14/.test(w.ov()));
  const up = w.G.writes;
  ok("ONE multi-path update on mastery/kid1_tests/forestry: post/t<ts> and post/best, no graduated", up.length === 1 && up[0][0] === "update" && up[0][1] === "mastery/kid1_tests/forestry" && Object.keys(up[0][2]).sort().join() === "post/best,post/t1800000100000" && up[0][2]["post/best"].right === 10 && !("graduated" in up[0][2]), up);
  w.envtClose();
  let st = w.envtStatus(u, K, "forestry");
  ok("line 'Pre 10/15 · Post 10/14'; a retake waits 24 h ('final again tomorrow')", st.line === "Pre 10/15 · Post 10/14" && !st.post.open && st.post.why === "wait" && /final again tomorrow/.test(w.envtKidCardsHtml(u, K, false)) && w.envtOpen(K, "forestry", "post") === false);
  w.G.now = 1800000100000 + 23 * 3600 * 1000; ok("23 h later: still waiting", !w.envtStatus(u, K, "forestry").post.open);
  w.G.now = 1800000100000 + 25 * 3600 * 1000; ok("25 h later: open again", w.envtStatus(u, K, "forestry").post.open);
  w.G.writes.length = 0; const d2 = take(w, K, "forestry", "post", 12);
  ok("12 of 14 → passed: '🎓 Graduated!'", d2 && d2.right === 12 && d2.pass && d2.grad && /Graduated/.test(w.ov()));
  const up2 = w.G.writes;
  ok("ONE update: post/t<ts>, post/best (the new best), graduated = {date, right 12, n 14}", up2.length === 1 && up2[0][0] === "update" && up2[0][1] === "mastery/kid1_tests/forestry" && Object.keys(up2[0][2]).sort().join() === "graduated,post/best,post/t" + w.G.now && JSON.stringify(up2[0][2].graduated) === JSON.stringify({ date: "2027-01-20", right: 12, n: 14 }) && up2[0][2]["post/best"].right === 12, up2);
  w.envtClose(); st = w.envtStatus(u, K, "forestry");
  ok("graduated: line 'Pre 10/15 · Post 12/14 · 🎓 Graduated', 🎓 on the station's line, the post closed, two attempts kept", st.graduated && st.line === "Pre 10/15 · Post 12/14 · \u{1F393} Graduated" && !st.post.open && st.post.attempts.length === 2 && /Forestry \u{1F393}/u.test(w.envtKidCardsHtml(u, K, true)) && !/envtOpen\(/.test(w.envtKidCardsHtml(u, K, true)) && !/envtMomOpen\('kid1','forestry'\)/.test(w.envtKidCardsHtml(u, K, true)) && /envtMomOpen\('kid1','soils'\)/.test(w.envtKidCardsHtml(u, K, true)));
  ok("the Family-tab line: 'Forestry: Pre 10/15 · Post 12/14 · 🎓 Graduated'", /Forestry: Pre 10\/15 · Post 12\/14 · \u{1F393} Graduated/u.test(w.envtLineHtml(u, K)));
  ok("a weaker later attempt would not replace best", (() => { w.G.masteryData.kid1_tests.forestry.graduated = null; delete w.G.masteryData.kid1_tests.forestry.graduated; w.G.now += 30 * 3600 * 1000; w.G.writes.length = 0; take(w, K, "forestry", "post", 11); const u3 = w.G.writes[0][2]; w.envtClose(); return !("post/best" in u3) && Object.keys(u3).length === 1; })());
  ok("every write path stays under mastery/kid1_tests/forestry", w.G.writes.every(x => /^mastery\/kid1_tests\/forestry(\/pre|\/postOpen)?$/.test(x[1]))); }

console.log("\n── the post-test unlocks itself when every deck of the station is mastered (mastDeckMastery) ──");
{ const w = enrolled(K); const u = U(w); const soils = w.envtStation("soils");
  const items = []; soils.decks.forEach(d => { const cards = LIB.unit.decks.find(x => x.key === d.key).cards; cards.forEach((c, i) => items.push({ id: d.key + i, subject: d.key, prompt: c.name, status: "active", tier: "monthly" })); });
  w.G.masteryData.kid1 = items;
  ok("850 Soils cards at monthly → every Soils deck mastered → post open without Mom; Forestry still locked", items.length === 850 && w.envtAllMastered(K, "soils") && w.envtStatus(u, K, "soils").post.open && !w.envtAllMastered(K, "forestry") && !w.envtStatus(u, K, "forestry").post.open);
  items[5].tier = "bi_weekly"; ok("one card at bi-weekly → not mastered → locked", !w.envtAllMastered(K, "soils") && w.envtStatus(u, K, "soils").post.why === "cards");
  items[5].tier = "graduated"; items[6].status = "introduction"; ok("one card still learning → locked", !w.envtAllMastered(K, "soils"));
  items[6].status = "active"; items.pop(); ok("one card never minted (still in the bank) → locked", !w.envtAllMastered(K, "soils"));
  ok("a twin / production card does not count toward the deck", (() => { items.push({ id: "tw", subject: items[0].subject, prompt: items[0].prompt, dir: "prod", twinOf: items[0].id, status: "active", tier: "monthly" }); return !w.envtAllMastered(K, "soils"); })());
  ok("uses the real mastDeckMastery rule (monthly+ = mastered)", w.mastDeckMastery([{ status: "active", tier: "monthly" }, { status: "active", tier: "weekly" }]).mastered === 1); }

console.log("\n── dry run: runs and scores, writes nothing, says so ──");
{ const w = enrolled(K, { dry: true, db: { ref() { throw new Error("db touched in dry run"); } } }); const u = U(w); delete w.G.masteryData.kid1_settings.cat_hold["Forestry · Facts"];
  const d = take(w, K, "forestry", "pre", 9);
  ok("pre: scored 9 of 15, 'Dry run — nothing saved', in memory for the page, no db call", d && d.right === 9 && d.saved === false && /Dry run/.test(w.ov()) && w.G.masteryData.kid1_tests.forestry.pre.right === 9);
  w.envtClose(); w.G.mom = true; w.envtMomOpen(K, "forestry");
  ok("Mom's early open in dry run: in memory only", w.G.masteryData.kid1_tests.forestry.postOpen && w.envtStatus(u, K, "forestry").post.open);
  const d2 = take(w, K, "forestry", "post", 13); ok("post in dry run: graduated in memory, nothing thrown", d2 && d2.grad && w.G.masteryData.kid1_tests.forestry.graduated.right === 13); w.envtClose(); }

console.log("\n── scoring ──");
{ const w = world(); const f = { form: "x", items: [{ q: "a", choices: ["1", "2", "3", "4"], ans: 2 }, { q: "b", choices: ["1", "2", "3", "4"], ans: [0, 3] }, { q: "c", choices: ["T", "F"], ans: 0 }] };
  ok("single: the keyed index; select-all: exactly the set (a partial or extra pick is wrong); unanswered = -1", JSON.stringify(w.envtScore(f, [2, [0, 3], 0])) === JSON.stringify({ right: 3, n: 3, pass: true, answers: [2, [0, 3], 0] }) && w.envtScore(f, [2, [0], 0]).right === 2 && w.envtScore(f, [2, [0, 1, 3], 0]).right === 2 && w.envtScore(f, [null, [0, 3], 1]).right === 1 && w.envtScore(f, [null, null, null]).answers.join() === "-1,-1,-1");
  ok("pass = right ≥ ceil(80 %): 2 of 3 fails, 3 of 3 passes", !w.envtScore(f, [2, [0, 3], 1]).pass && w.envtScore(f, [2, [0, 3], 0]).pass);
  const w2 = enrolled(K); const u = U(w2); w2.G.mom = true; w2.envtMomOpen(K, "wildlife"); w2.envtOpen(K, "wildlife", "post");
  const five = w2.state.form.items.findIndex(it => it.choices.length === 5); for (let i = 0; i < five; i++) { w2.envtPick(0); w2.envtNext(); }
  ok("the 5-choice Wildlife item draws an E button; a True/False item two", />E</.test(w2.ov()) && (() => { w2.envtQuit(); w2.envtMomOpen(K, "forestry"); w2.envtOpen(K, "forestry", "post"); const tf = w2.state.form.items.findIndex(it => it.choices.length === 2); for (let i = 0; i < tf; i++) { w2.envtPick(0); w2.envtNext(); } const h = w2.ov(); w2.envtQuit(); return (h.match(/envtPick\(\d\)/g) || []).length === 2; })()); }

console.log("\n── the Units tab (UNITSTAB) with the hook: identical for a kid not in the unit ──");
{ const w = enrolled(K); const u = U(w); delete w.G.masteryData.kid1_settings.cat_hold["Forestry · Terms"]; take(w, K, "forestry", "pre", 13); w.envtClose();
  u.enrolled.kid2 = true; u.kidStage.kid2 = { stage: 0 };   // a second kid in the unit so the Family tab lists it as shared
  const roster = ["kid1", "kid2", "kid3", "kid4"];
  function uts(withHook) {
    const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, isFinite,
      unitStudies: w.G.unitStudies, ROSTER: roster.slice(), KID_COLOR: {}, momHere: () => false, _dryRun: () => false, db: { ref: () => ({ set() { throw new Error("write"); }, update() { throw new Error("write"); } }) },
      rulesData: { familyBlocks: {} }, currData: { subjects: {}, resources: {} }, masteryData: w.G.masteryData, notebookSettings: {}, cap: s => s[0].toUpperCase() + s.slice(1),
      famDefs: () => ({ ft: { name: "Family Time", kids: [], days: [], items: [] } }), famList: x => Array.isArray(x) ? x : [], famTrack: () => null, famLessonMap: () => ({}), famCellState: () => null, famHomeGo: () => {}, cbTodayISO: () => "2027-01-20", _todayDay: "wednesday", checked: {}, claimed: {}, weekData: { tasks: [] },
      nbUnitDays: () => ({}), lidDoneIdx: () => new Set(), _unitMomLockHtml: () => "", _starterUnitsHtml: () => "", openUnit: () => {}, unitOpenId: null, renderUnits: () => {}, document: { getElementById: () => null },
      unitStageStatus: () => null, _unitStagedEnrollPending: u => !!(u && u.stages), _unitActs: () => [], psPointers: () => [] };
    if (withHook) { ctx.envtKidCardsHtml = w.envtKidCardsHtml; ctx.envtLineHtml = w.envtLineHtml; }
    vm.createContext(ctx);
    vm.runInContext(cut("// UNITSTAB_START", "// UNITSTAB_END"), ctx);
    return { kid: k => ctx.utsKidHTML(k, false), fam: () => ctx.utsFamilyHTML(false) };
  }
  const A = uts(true), B = uts(false);
  ok("kid3 (not in the unit): byte-identical with and without the hook", A.kid("kid3") === B.kid("kid3") && A.kid("kid3").length > 200);
  ok("kid2 (in the unit, no records): the station lines appear, nothing else changes", A.kid("kid2") !== B.kid("kid2") && /not sent out yet/.test(A.kid("kid2")) && A.kid("kid2").replace(/<div style="margin-top:8px;border-top:1px solid #f3f1ee;padding-top:6px">[\s\S]*?<\/div><\/div>/, "") === B.kid("kid2").replace(/<div style="margin-top:8px;border-top:1px solid #f3f1ee;padding-top:6px">[\s\S]*?<\/div><\/div>/, ""));
  ok("kid1: 'Pre 13/15 · Post —' on the Units tab card", /Pre 13\/15 · Post —/.test(A.kid("kid1")));
  ok("the Family tab's shared-units row carries kid1's line and nothing for kid2", /Forestry: Pre 13\/15/.test(A.fam()) && A.fam() !== B.fam() && (A.fam().match(/\u{1F4DD} /gu) || []).length === 1);
  ok("the Units tab block itself still has no write path", !/db\.ref|famWrite/.test(cut("// UNITSTAB_START", "// UNITSTAB_END"))); }

console.log("\n── the hooks in index.html (one guarded line each) ──");
ok("utsKidHTML: the kid's card after the rung chips", /inner\+=utsRungChips\(utsRungs\(kid,u\)\);\n    if\(typeof envtKidCardsHtml==="function"\) inner\+=envtKidCardsHtml\(u,kid,isMom\);/.test(src));
ok("renderUnitDetail: the per-kid block after enrolledKids", /const enrolledKids=roster\.filter\(k=>\(u\.enrolled\|\|\{\}\)\[k\]\);\n  if\(typeof envtDetailHtml==="function"\) h\+=envtDetailHtml\(u,enrolledKids,isMom\);/.test(src));
ok("utsFamilyHTML: the scores line beside the rung chips", /utsRungChips\(utsRungs\(k,u\)\)\.replace\('margin-top:5px','margin-top:0'\)\+\(\(typeof envtLineHtml==="function"\)\?envtLineHtml\(u,k\):""\)/.test(src));
ok("renderMastStudy: the open test sits under the header, the how-to and the buttons line, before Start", /h\+=mstControlsHtml\(session\);[^\n]*\n  if\(typeof envtStartHtml==="function"\) h\+=envtStartHtml\(kid,session\);[^\n]*\n  const running=mstState&&mstSid===session\.sid;/.test(src));
ok("exactly these hooks: 4 guarded lines + the two markers", (src.match(/ENVTEST/g) || []).length === 6);
ok("every write in the block is a targeted set or a multi-path update under mastery/<kid>_tests/<station>; dry run guarded (envtLive)", (TBLK.match(/db\.ref\(/g) || []).length === 3 && /db\.ref\("mastery\/"\+kid\+"_tests\/"\+station\+"\/postOpen"\)\.set\(rec\)/.test(TBLK) && /db\.ref\(base\+"\/pre"\)\.set\(rec\)/.test(TBLK) && /db\.ref\(base\)\.update\(up\)/.test(TBLK) && (TBLK.match(/if\(envtLive\(\)\) db\.ref/g) || []).length === 3);
ok("nothing speaks, no confetti in the block (code lines)", !/mastSpeak|speechSynthesis|confetti|haConfetti|new Audio|\.play\(/.test(TBLK.split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n")));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
