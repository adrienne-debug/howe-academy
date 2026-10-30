/*
 * Node tests — ⚡ ENVIDFLASH: the ID decks' pictures + ID Flash (step 6 of PLAN_envirothon_2026-10-27.md; the sprint verdict
 * DESIGN_envirothon_sprint_verdict_2026-10-27.md). Runs the real ENVUNIT + ENVIDFLASH blocks sliced from index.html, the real
 * envirothon.js and the real envirothon/pics/index.json, in a tiny world with a recording db.
 *   · the pictures: the index parses, every card of the three pictured ID decks has ≥3 pictures (the three named short items
 *     have ≥1), every URL is a repo path under envirothon/pics/ whose file exists, is a JPEG ≤ 600 px with no EXIF, credit on
 *     every picture, the whole set under 40 MB, CREDITS.md lists the left-out official-profile extracts. The checked Commons
 *     sets added 2026-10-30 (build_pics.py --extra) carry check:true, may key an item with no card by its name, and picture
 *     Soils and Land Use · ID too.
 *   · the fluency rule exactly; the sitting pool; the picture choice; pick lures; the typed check through mstTypedOk.
 *   · the end of a sitting writes exactly two targeted paths and nothing else; the study-log entry has a normal show's shape;
 *     dry run writes nothing and says so; the deck line with and without state; a kid without the unit: byte-identical.
 * run: node test_env_idflash.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const LIB = require(path.join(__dirname, "envirothon.js"));
const PICS_DIR = path.join(__dirname, "envirothon", "pics");
const IDX = JSON.parse(fs.readFileSync(path.join(PICS_DIR, "index.json"), "utf8"));
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 300) : "")); } };
const bytes = v => Buffer.byteLength(JSON.stringify(v), "utf8");
const slice = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b); if (i < 0 || j < 0) throw new Error("missing " + a); return src.slice(i, j); };
const fnText = name => { const i = src.indexOf("\nfunction " + name + "("); if (i < 0) throw new Error("no fn " + name); const j = src.indexOf("\n}\n", i); return src.slice(i, j + 3); };

console.log("── placement + hooks ──");
const a = src.indexOf("// ENVIDFLASH_START"), b = src.indexOf("// ENVIDFLASH_END"), upe = src.indexOf("// UNIT_PICS_END");
ok("ENVIDFLASH block present once, immediately after UNIT_PICS_END", a > 0 && b > a && src.indexOf("// ENVIDFLASH_START", a + 1) < 0 && src.slice(upe, a).trim() === "// UNIT_PICS_END");
const block = src.slice(a, b);
const once = s => src.split(s).length === 2;
ok("hook: envHydrate calls envPicsOn (guarded, one line)", once('if(typeof envPicsOn==="function") envPicsOn(u);'));
ok("hook: mstCardPic asks envPicCycle first (guarded, one line)", once('const _ep=(typeof envPicCycle==="function")?envPicCycle(card):""; if(_ep) return _ep;'));
ok("hook: renderMastStudy — a running sitting takes the body; the door right under the how-to and controls", once('const _ef=envFlashRunningHtml(kid); if(_ef) return h+_ef;') && /h\+=mstControlsHtml\(session\);[^\n]*\n(?:  if\(typeof envtStartHtml[^\n]*\n)?  if\(typeof envFlashDoorHtml==="function"\) h\+=envFlashDoorHtml\(kid,session\);/.test(src) && once('h+=envFlashDoorHtml(kid,session);'));
ok("the block never calls renderAllSoon (test_render_soon's rule) — it redraws the Units tab or the study screen directly", !/renderAllSoon/.test(block));
ok("hook: 🎮 Games entry + gamesCurrentKey line", once('key:"idflash",emoji:"\\u26A1",     label:"ID Flash",    view:"idflash"') && once('if(mastView==="idflash") return "idflash";'));
ok("no Howe kid name in the block", !/\b(lincoln|ellis|lucy|julian)\b/i.test(block));
ok("no speech code, no confetti, no 🔀 in the block — the name after an answer goes through ENVREADALOUD's switch", !/mastSpeak\(|speechSynthesis|[cC]onfetti\(|\u{1F500}/u.test(block));

console.log("\n── the pictures (envirothon/pics) ──");
const ID_DECKS = ["Forestry · ID", "Wildlife · ID", "Aquatic Ecology · ID"];
const idCards = LIB.unit.decks.filter(d => ID_DECKS.indexOf(d.key) >= 0).flatMap(d => d.cards.map(c => ({ deck: d.key, name: c.name, item: c.item })));
const CHECKED = 216;   // build_pics.py --extra: the staged set (245 less 28 already in, 1 near-copy)
const SHORT = { "Horse fly larva": 1, "Rat Snake": 2 };   // the official-profile extracts were left out (CREDITS.md)
ok("index parses: an object keyed by card name, no meta keys", IDX && typeof IDX === "object" && !Array.isArray(IDX) && Object.keys(IDX).every(k => !k.startsWith("_")));
ok("every card of the three pictured ID decks is in the index (" + idCards.length + " cards)", idCards.every(c => Array.isArray(IDX[c.name])), idCards.filter(c => !IDX[c.name]).map(c => c.name).slice(0, 5));
const allIdCards = LIB.unit.decks.filter(d => / · ID$/.test(d.key)).flatMap(d => d.cards.map(c => ({ deck: d.key, name: c.name, item: c.item })));
ok("every index key is an ID card, or an item with no ID card keyed by its own name whose pictures are all checked additions", Object.keys(IDX).every(k => allIdCards.some(c => c.name === k) || (k.indexOf(" · ") < 0 && IDX[k].every(e => e.check === true))), Object.keys(IDX).filter(k => !allIdCards.some(c => c.name === k) && !(k.indexOf(" · ") < 0 && IDX[k].every(e => e.check === true))).slice(0, 5));
ok("≥3 pictures per card, except the three named short items (≥1)", idCards.every(c => IDX[c.name].length >= (SHORT[c.item] ? 1 : 3)), idCards.filter(c => IDX[c.name].length < (SHORT[c.item] ? 1 : 3)).map(c => c.name).slice(0, 5));
ok("the short items have exactly the pictures recorded (Horse fly larva 1, Rat Snake 2)", idCards.filter(c => SHORT[c.item]).every(c => IDX[c.name].length === SHORT[c.item]));
const entries = Object.values(IDX).flat();
ok("every entry = {url, credit, shot} (+ check:true on a checked addition), strings, credit non-empty", entries.every(e => (Object.keys(e).sort().join() === "credit,shot,url" || (Object.keys(e).sort().join() === "check,credit,shot,url" && e.check === true)) && e.credit.trim() && typeof e.shot === "string" && typeof e.url === "string"));
ok("every URL is a repo path envirothon/pics/<deck>/<item>/<n>.jpg (no host, no ..)", entries.every(e => /^envirothon\/pics\/(forestry_id|wildlife_id|aquatic_id|soils_id|aquatic_gear|forestry_tools|soils_land|forestry_pests|aquatic_lakes)\/[a-z0-9_]+\/\d+\.jpg$/.test(e.url)));
const files = [...new Set(entries.map(e => e.url))];
ok("every URL's file exists", files.every(u => fs.existsSync(path.join(__dirname, u))), files.filter(u => !fs.existsSync(path.join(__dirname, u))).slice(0, 3));
const firstSet = files.filter(u => !entries.some(e => e.url === u && e.check === true));
ok("the 2026-10-27 build is unchanged: 361 distinct pictures, forestry 101 · wildlife 119 · aquatic 141, none marked check", firstSet.length === 361 && firstSet.filter(u => u.includes("/forestry_id/")).length === 101 && firstSet.filter(u => u.includes("/wildlife_id/")).length === 119 && firstSet.filter(u => u.includes("/aquatic_id/")).length === 141, firstSet.length);
ok("the checked additions (2026-10-30): " + (files.length - 361) + " pictures, each marked check:true on every card it is under", files.length - firstSet.length === CHECKED && entries.filter(e => e.check === true).every(e => entries.filter(x => x.url === e.url).every(x => x.check === true)), files.length - firstSet.length);
ok("cards of one item share one picture set", idCards.every(c => JSON.stringify(IDX[c.name]) === JSON.stringify(IDX[idCards.find(x => x.item === c.item && x.deck === c.deck).name])));
function jpegInfo(file) {
  const buf = fs.readFileSync(file); if (buf[0] !== 0xFF || buf[1] !== 0xD8) return null;
  let i = 2, w = 0, h = 0, exif = false;
  while (i + 4 < buf.length && buf[i] === 0xFF) { const m = buf[i + 1]; if (m === 0xDA) break; const L = buf.readUInt16BE(i + 2);
    if (m === 0xE1 && buf.slice(i + 4, i + 8).toString() === "Exif") exif = true;
    if ((m >= 0xC0 && m <= 0xC3) || (m >= 0xC5 && m <= 0xC7) || (m >= 0xC9 && m <= 0xCB) || (m >= 0xCD && m <= 0xCF)) { h = buf.readUInt16BE(i + 5); w = buf.readUInt16BE(i + 7); }
    i += 2 + L; }
  return { w, h, exif, size: buf.length };
}
const infos = files.map(u => jpegInfo(path.join(__dirname, u)));
ok("every file is a JPEG, longest side ≤ 600 px, no EXIF", infos.every(x => x && x.w > 0 && Math.max(x.w, x.h) <= 600 && !x.exif), infos.filter(x => !x || Math.max(x.w, x.h) > 600 || x.exif).length);
const total = (() => { let s = 0; const walk = d => fs.readdirSync(d).forEach(f => { const p = path.join(d, f); const st = fs.statSync(p); if (st.isDirectory()) walk(p); else s += st.size; }); walk(PICS_DIR); return s; })();
console.log("     envirothon/pics total: " + (total / 1048576).toFixed(1) + " MB (" + total + " bytes); index.json " + fs.statSync(path.join(PICS_DIR, "index.json")).size + " bytes");
ok("the whole folder is under 40 MB", total < 40 * 1048576, total);
const credits = fs.readFileSync(path.join(PICS_DIR, "CREDITS.md"), "utf8");
ok("CREDITS.md lists every picture and the left-out official-profile extracts (115)", files.every(u => credits.includes(u.replace("envirothon/pics/", ""))) && /## Left out — not shown to be free to reuse \(115\)/.test(credits));
ok("build_pics.py is the rerunnable shrink script (reads pics_index.json, writes index.json + CREDITS.md)", (() => { const t = fs.readFileSync(path.join(__dirname, "envirothon", "build_pics.py"), "utf8"); return t.includes("pics_index.json") && t.includes("index.json") && t.includes("CREDITS.md") && t.includes("MAX_SIDE = 600"); })());

// ── A tiny world: the ENVUNIT + ENVIDFLASH blocks, the study's own typed checker, a recording db. ──
function world(o) {
  o = o || {};
  const G = { masteryData: o.mastery || {}, unitStudies: o.unitStudies || {}, writes: [], dry: !!o.dry, typed: "", rendered: 0, soon: 0 };
  const db = { ref(p) { return { update(v) { G.writes.push(["update", p, v]); }, set(v) { G.writes.push(["set", p, v]); }, remove() { G.writes.push(["remove", p]); },
    transaction(fn) { const r = fn(null); G.writes.push(["transaction", p, r]); return Promise.resolve({ committed: true }); } }; } };
  const api = new Function("G", "db", "LIB", `
    const masteryData=G.masteryData; let unitStudies=G.unitStudies; const window={HoweEnvirothon:LIB}; let tab="units";
    let masteryKid=G.masteryKid||null;
    const el={style:{},textContent:"",get value(){ return G.typed; },focus(){}};
    const document={ getElementById:()=>el, createElement:()=>({}), head:{ appendChild(){} }, activeElement:null };
    const location={ hostname:"localhost" };
    const setTimeout=()=>0, setInterval=()=>0, clearInterval=()=>{}; const fetch=undefined;   // the index comes from the test's own fetch
    function momHere(){ return true; } function _dryRun(){ return G.dry; } function cap(s){ return s[0].toUpperCase()+s.slice(1); }
    function renderUnits(){ G.rendered++; } function renderAllSoon(){ G.soon++; } function _mastRe(){ G.rendered++; } const HA_LS={ setItem(){} };
    function mastDefKeyOk(p){ return !/[.#$\\[\\]\\/]/.test(p); }
    function mastDefKey(p){ p=String(p); return mastDefKeyOk(p)?p:p.replace(/[.#$\\[\\]\\/%]/g,c=>"%"+c.charCodeAt(0).toString(16).toUpperCase().padStart(2,"0")); }
    function mastGateChapter(){ return null; } function mastFullBank(){ return {}; }
    function mastGetPrintNum(){ return 42; } function mstTodayKey(){ return "20261027"; }
    let mstState=null, mstHist=[];
    ${fnText("mstNormAns")}
    ${fnText("mstTypedOk")}
    ${slice("// STARTER_UNITS_START", "// STARTER_UNITS_END")}
    ${block}
    return { envUnitRecord, envHydrate, envCardsInCode, envPicsLoad, envPicsIndex, envPicsFor, envPicsApply, envPicsOn, envPicCycle,
      envFlashDecks, envFlashState, envFlashFluent, envFlashNext, envFlashPool, envFlashPicFor, envFlashLures, envFlashNameOk, envFlashCount, envFlashLine,
      envFlashOpen, envFlashAnswer, envFlashPickTap, envFlashCheckTyped, envFlashNextCard, envFlashQuit, envFlashFinish, envFlashDoorHtml, envFlashSittingHtml, envFlashRunningHtml, envFlashAvail, envFlashGameHtml, envFlashSetMode,
      ENVFLASH_SECS, ENVFLASH_SITTING, ENVFLASH_KEEP, ENVFLASH_NEED, ENVFLASH_SID,
      get flash(){ return envFlash; }, set flash(v){ envFlash=v; }, get us(){ return unitStudies; },
      setStudy(st,hist){ mstState=st; mstHist=hist; } };`)(G, db, LIB);
  api.G = G; return api;
}
const fakeFetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve(JSON.parse(JSON.stringify(IDX))) });
// A family with the unit added and one kid enrolled; every deck held, then the ID decks released as asked.
function family(opts) {
  opts = opts || {};
  const W = world({ mastery: opts.mastery || {}, dry: !!opts.dry });
  const u = W.envUnitRecord(); u.enrolled = { kidA: true }; W.us.nc_envirothon = u;
  const hold = {}; u.decks.forEach(d => { hold[d.key] = true; }); (opts.release || []).forEach(k => { delete hold[k]; });
  W.G.masteryData.kidA_settings = Object.assign({ cat_hold: hold }, (W.G.masteryData.kidA_settings || {}));
  // 📝 ENVTEST (2026-10-28): a released station's cards wait for its check-in — the kid has taken every check-in unless opts.noPre
  if (!opts.noPre) W.G.masteryData.kidA_tests = Object.assign({ forestry: { pre: { right: 9, n: 15 } }, soils: { pre: { right: 9, n: 15 } }, aquatics: { pre: { right: 9, n: 14 } }, wildlife: { pre: { right: 9, n: 15 } }, cei: { pre: { right: 9, n: 20 } } }, W.G.masteryData.kidA_tests || {});
  return W;
}

console.log("\n── the fluency rule ──");
{
  const W = world();
  const sh = (pic, ok, secs, at) => ({ pic, ok, secs, at: at || 1 });
  ok("three fast corrects on three different pictures = fluent", W.envFlashFluent([sh("p1", true, 4), sh("p2", true, 7.5), sh("p3", true, 9.9)]) === true);
  ok("two fast + one slow (10 s is not under 10) ≠ fluent", W.envFlashFluent([sh("p1", true, 4), sh("p2", true, 3), sh("p3", true, 10)]) === false);
  ok("three fast corrects on the SAME picture ≠ fluent", W.envFlashFluent([sh("p1", true, 4), sh("p1", true, 3), sh("p1", true, 2)]) === false);
  ok("two different pictures among three ≠ fluent", W.envFlashFluent([sh("p1", true, 4), sh("p2", true, 3), sh("p1", true, 2)]) === false);
  ok("only the last three CORRECT shows count: a miss in between doesn't break it", W.envFlashFluent([sh("p1", true, 4), sh("p2", false, 2), sh("p2", true, 3), sh("p3", true, 2)]) === true);
  ok("an earlier slow correct is ignored once three fast ones follow", W.envFlashFluent([sh("p0", true, 30), sh("p1", true, 4), sh("p2", true, 3), sh("p3", true, 2)]) === true);
  ok("a slow correct among the last three blocks it", W.envFlashFluent([sh("p1", true, 4), sh("p2", true, 3), sh("p0", true, 30), sh("p3", true, 2)]) === false);
  ok("fewer than three corrects ≠ fluent; empty ≠ fluent", W.envFlashFluent([sh("p1", true, 1), sh("p2", true, 1)]) === false && W.envFlashFluent([]) === false);
  const n = W.envFlashNext({ shows: [sh("a", true, 1, 1), sh("b", false, 1, 2), sh("c", true, 1, 3), sh("d", true, 1, 4), sh("e", true, 20, 5)] }, sh("f", true, 2, 6));
  ok("envFlashNext keeps the last 5 shows, sets fluent and at", n.shows.length === 5 && n.shows[0].pic === "b" && n.at === 6 && n.fluent === false && Object.keys(n).sort().join() === "at,fluent,shows");
  const n2 = W.envFlashNext(n, sh("g", true, 2, 7)); const n3 = W.envFlashNext(n2, sh("h", true, 2, 8));
  ok("… and turns fluent on the third fast different picture", n2.fluent === false && n3.fluent === true);
  ok("a state read back from Firebase as an object (not an array) still works", W.envFlashNext({ shows: { 0: sh("a", true, 1), 1: sh("b", true, 1) } }, sh("c", true, 1, 9)).fluent === true);
}

console.log("\n── the pictures on the cards (envPicsOn / envPicsApply / envPicCycle) ──");
(async () => {
  const W = family({ release: ["Forestry · ID"] });
  const u = W.us.nc_envirothon;
  ok("before the index: envPicsOn applies nothing, visuals untouched", W.envPicsOn(u) === false && !u.visuals);
  ok("envPicsFor is null before the index", W.envPicsFor("Forestry · ID", "Sassafras · parts valued in some areas") === null);
  await W.envPicsLoad(fakeFetch);
  ok("the index loads once (a second load is the cached promise/object)", W.envPicsIndex() === IDX || JSON.stringify(W.envPicsIndex()) === JSON.stringify(IDX));
  ok("envPicsFor: the card's pictures; a Terms deck never has any even with a matching name", Array.isArray(W.envPicsFor("Forestry · ID", "Sassafras · parts valued in some areas")) && W.envPicsFor("Forestry · Terms", "Sassafras · parts valued in some areas") === null);
  u.visuals = { "Forestry · ID_Sassafras · parts valued in some areas": { imageUrl: "https://moms.example/sassafras.jpg", credit: "Mom" } };
  W.envHydrate(u, LIB);   // the real hook: hydrate → envPicsOn → envPicsApply
  const vk = Object.keys(u.visuals);
  const pictured = allIdCards.filter(c => Array.isArray(IDX[c.name]) && IDX[c.name].length);
  ok("after hydrate every pictured ID card has a visual {imageUrl, credit} — the UNIT_PICS shape, first picture", vk.length === pictured.length && vk.every(k => { const v = u.visuals[k]; return Object.keys(v).sort().join() === "credit,imageUrl" && typeof v.imageUrl === "string"; }));
  ok("the visual key is deck_name, as mastGetVisual reads it", idCards.every(c => u.visuals[c.deck + "_" + c.name]));
  ok("a picture Mom saved herself stays", u.visuals["Forestry · ID_Sassafras · parts valued in some areas"].imageUrl === "https://moms.example/sassafras.jpg");
  ok("the visuals point at repo paths, never image bytes", Object.values(u.visuals).every(v => !/^data:/.test(v.imageUrl)));
  ok("applying again changes nothing (idempotent) and nothing was written to the database", W.envPicsApply(u) === 0 && W.G.writes.length === 0);
  ok("a unit that isn't code-held gets nothing", (() => { const o = { id: "x", decks: [{ key: "Forestry · ID", cards: [{ name: "Sassafras · parts valued in some areas" }] }] }; return W.envPicsOn(o) === false && !o.visuals; })());
  // cycling in study
  const card = { key: "r:1", deck: "Wildlife · ID", name: idCards.find(c => c.item === "Beaver").name };
  ok("envPicCycle is empty outside a sitting (mstState null)", W.envPicCycle(card) === "");
  const st = {}; W.setStudy(st, []);
  const p1 = W.envPicCycle(card), p1b = W.envPicCycle(card);
  W.setStudy(st, [1]); const p2 = W.envPicCycle(card);
  W.setStudy(st, [1, 2]); const p3 = W.envPicCycle(card);
  ok("a re-draw of the same show keeps its picture; the next shows get different ones", p1 && p1 === p1b && p2 !== p1 && p3 !== p2 && [p1, p2, p3].every(p => IDX[card.name].some(e => e.url === p)));
  const card2 = { key: "r:2", deck: "Wildlife · ID", name: idCards.find(c => c.item === "Beaver" && c.name !== card.name).name };
  ok("another card of the same item continues the cycle (a different picture again)", W.envPicCycle(card2) !== p3);
  const one = idCards.find(c => c.item === "Horse fly larva");
  ok("an item with one picture leaves the stock path alone (empty)", W.envPicCycle({ key: "r:3", deck: one.deck, name: one.name }) === "");

  console.log("\n── decks, the pool, the picture for a show, the lures, the typed check ──");
  const W2 = family({ release: ["Forestry · ID", "Wildlife · ID"] });
  await W2.envPicsLoad(fakeFetch); W2.envHydrate(W2.us.nc_envirothon, LIB);
  const decks = W2.envFlashDecks("kidA");
  ok("envFlashDecks: the released, pictured ID decks only (Forestry 24 items, Wildlife 35), not the held Aquatic deck, never a Terms/Facts deck", decks.map(d => d.key + ":" + d.items.length).join("|") === "Forestry · ID:24|Wildlife · ID:35");
  const Wwait = family({ release: ["Forestry · ID", "Wildlife · ID"] }); delete Wwait.G.masteryData.kidA_tests.wildlife; await Wwait.envPicsLoad(fakeFetch); Wwait.envHydrate(Wwait.us.nc_envirothon, LIB);
  ok("📝 ENVTEST: a released station whose check-in isn't taken is not an ID Flash deck (Wildlife waits; Forestry, taken, stays)", Wwait.envFlashDecks("kidA").map(d => d.key).join("|") === "Forestry · ID");
  ok("Soils ID (released) is an ID Flash deck with its pictured items only (the soil orders and horizons the 2026-10-30 set has)", (() => { delete W2.G.masteryData.kidA_settings.cat_hold["Soils and Land Use · ID"]; const D = W2.envFlashDecks("kidA"), s = D.find(d => d.key === "Soils and Land Use · ID"); const want = new Set(allIdCards.filter(c => c.deck === "Soils and Land Use · ID" && IDX[c.name]).map(c => c.item || c.name.split(" · ")[0])); return D.length === 3 && s && s.items.length === want.size && s.items.every(e => want.has(e.item)); })());
  ok("an item carries every way its cards name it (Sweetgum + Sweet gum) and its key is mastDefKey-safe", (() => { const e = decks[0].items.find(i => i.item === "Sweetgum"); return e && e.names.indexOf("Sweet gum") >= 0 && e.key === "Sweetgum" && decks.every(d => d.items.every(i => !/[.#$\[\]\/]/.test(i.key))); })());
  ok("a kid not enrolled / without the unit has no decks", W2.envFlashDecks("kidB").length === 0 && W2.envFlashAvail("kidB") === false && W2.envFlashAvail("kidA") === true);
  const rnd = () => 0.5;
  const pool = W2.envFlashPool("kidA", decks, 12, rnd);
  ok("a sitting is 12 items, each once, from the released decks", pool.length === 12 && new Set(pool.map(c => c.item)).size === 12);
  ok("fewer when fewer: a deck of 3 open items gives 3", W2.envFlashPool("kidA", [{ key: "Forestry · ID", items: decks[0].items.slice(0, 3) }], 12, rnd).length === 3);
  W2.G.masteryData.kidA_idflash = { "Forestry · ID": { Sassafras: { shows: [{ pic: "x", ok: true, secs: 2, at: 5 }], fluent: false, at: 5 }, Maple: { shows: [], fluent: true, at: 9 }, Elm: { shows: [{ pic: "y", ok: false, secs: 12, at: 1 }], fluent: false, at: 1 } } };
  const pool2 = W2.envFlashPool("kidA", [decks[0]], 12, rnd);
  ok("a fluent item is excluded from the next sitting; started items come first, oldest show first", pool2.every(c => c.item !== "Maple") && pool2[0].item === "Elm" && pool2[1].item === "Sassafras");
  const sassa = pool2[1];
  const pick = W2.envFlashPicFor(sassa, rnd);
  ok("the picture for a show avoids the pictures of recent shows", pick && pick.url !== "x" && sassa.pics.some(p => p.url === pick.url));
  const allSeen = Object.assign({}, sassa, { st: { shows: sassa.pics.map((p, i) => ({ pic: p.url, ok: true, secs: 1, at: i })) } });
  ok("… and when every picture was shown lately, the least recent one", W2.envFlashPicFor(allSeen, rnd).url === sassa.pics[0].url);
  const lures = W2.envFlashLures(sassa, decks, rnd);
  ok("pick mode: 4 chips, the item + 3 other items of the same deck, no repeats", lures.length === 4 && lures.filter(l => l.ok).length === 1 && lures.find(l => l.ok).name === "Sassafras" && new Set(lures.map(l => l.name)).size === 4 && lures.every(l => decks[0].items.some(i => i.item === l.name)));
  const sw = decks[0].items.find(i => i.item === "Sweetgum");
  ok("typed check runs through mstTypedOk over the accepted names: 'sweet gum', 'SWEETGUM', 'Sweetgum.' pass; 'oak' and blank fail", W2.envFlashNameOk("sweet gum", sw.names) && W2.envFlashNameOk("SWEETGUM", sw.names) && W2.envFlashNameOk("Sweetgum.", sw.names) && !W2.envFlashNameOk("oak", sw.names) && !W2.envFlashNameOk("   ", sw.names));
  ok("deck line without state: ⚡ 0 of 24 fluent; with one fluent: ⚡ 1 of 24 fluent", W2.envFlashLine("kidB", decks[0]) === "⚡ 0 of 24 fluent" && W2.envFlashLine("kidA", decks[0]) === "⚡ 1 of 24 fluent");

  console.log("\n── a sitting, live: the writes ──");
  const W3 = family({ release: ["Forestry · ID"] });
  await W3.envPicsLoad(fakeFetch); W3.envHydrate(W3.us.nc_envirothon, LIB);
  ok("no door for a kid without the unit; nothing running; the game screen empty for no kid", W3.envFlashDoorHtml("kidB", null) === "" && W3.envFlashRunningHtml("kidB") === "" && W3.envFlashGameHtml() === "");
  const session = { sid: "envirothon", decks: W3.us.nc_envirothon.decks.map(d => d.key) };
  const door = W3.envFlashDoorHtml("kidA", session);
  ok("the door on the unit's session: ⚡ ID Flash, the released deck's line, Go; no Mix with one deck", /⚡ ID Flash/.test(door) && door.includes("⚡ 0 of 24 fluent") && door.includes("envFlashOpen('kidA','Forestry · ID')") && !door.includes("Mix the decks") && !door.includes("Wildlife"));
  ok("the door filters to the session's decks (a session without the ID decks shows none)", W3.envFlashDoorHtml("kidA", { sid: "x", decks: ["Forestry · Terms"] }) === "");
  const f = W3.envFlashOpen("kidA", "Forestry · ID");
  ok("envFlashOpen: 12 cards, pick mode by default, every card with a picture and 4 chips, nothing written yet", f && f.cards.length === 12 && f.mode === "pick" && f.cards.every(c => c.pic && c.pic.url && c.lures.length === 4) && W3.G.writes.length === 0);
  const run = W3.envFlashRunningHtml("kidA");
  ok("the running screen: the picture, the 10 s bar, 4 chips, 1 of 12", run.includes('id="envflash-bar"') && run.includes('src="' + f.cards[0].pic.url + '"') && run.split("envFlashPickTap(").length === 5 && run.includes("1 of 12"));
  const T0 = Date.now();
  // answer every card: right, quick — except card 3 (wrong) and card 4 (right but slow)
  for (let i = 0; i < 12; i++) {
    const c = f.cards[i]; f.shownAt = Date.now() - (i === 3 ? 12500 : 1500);
    if (i === 2) { W3.envFlashPickTap(c.lures.findIndex(l => !l.ok)); } else { W3.envFlashPickTap(c.lures.findIndex(l => l.ok)); }
    if (i === 0) { const after = W3.envFlashRunningHtml("kidA"); ok("after an answer: ✓ + the name, the credit, Next", after.includes("✓ " + c.item) && after.includes("Next ▶") && (!c.pic.credit || after.includes(c.pic.credit.replace(/&/g, "&amp;").replace(/"/g, "&quot;")))); }
    if (i === 2) { const after = W3.envFlashRunningHtml("kidA"); ok("a miss shows ✗ + the name and what he picked", after.includes("✗ " + c.item) && after.includes("you said:")); }
    W3.envFlashNextCard();
  }
  const done = f.done;
  ok("12 answered → finished: 11 right, 1 missed, the summary on screen, not dry", done && done.total === 12 && done.correct === 11 && done.miss === 1 && done.saved === true && !done.dry && W3.envFlashRunningHtml("kidA").includes("ID Flash done"));
  ok("the time per show is recorded (card 4 slow ≈12.5 s, the others ≈1.5 s)", f.results[3].secs >= 12 && f.results.filter((r, i) => i !== 3).every(r => r.secs >= 1 && r.secs < 3));
  const ws = W3.G.writes;
  console.log("     writes: " + ws.map(w => w[0] + " " + w[1] + " (" + bytes(w[2]) + " B)").join(" · "));
  ok("exactly two writes: one multi-path update on mastery/kidA_idflash and the day's study-log entry", ws.length === 2 && ws[0][0] === "update" && ws[0][1] === "mastery/kidA_idflash" && ws[1][0] === "set" && ws[1][1] === "mastery/studyLog/kidA/idflash/20261027");
  const upd = ws[0][2];
  ok("the update's keys are <deckKey>/<itemKey>, one per item shown, each {shows, fluent, at}", Object.keys(upd).length === 12 && Object.keys(upd).every(k => k.startsWith("Forestry · ID/") && !/[.#$\[\]]/.test(k)) && Object.values(upd).every(v => Object.keys(v).sort().join() === "at,fluent,shows" && v.shows.length === 1 && v.fluent === false));
  ok("each show = {pic, ok, secs, at}; the miss and the slow one recorded as they happened", Object.values(upd).every(v => Object.keys(v.shows[0]).sort().join() === "at,ok,pic,secs") && upd["Forestry · ID/" + f.cards[2].key].shows[0].ok === false && upd["Forestry · ID/" + f.cards[3].key].shows[0].secs >= 12);
  const entry = ws[1][2];
  const stockKeys = (() => { const t = src.slice(src.indexOf("function _mstSaveInner("), src.indexOf("// MSTALERT_START")); const m = /let entry=\{([^}]*)\}/.exec(t.replace(/\{secs:secs,total:total\}/g, "")); return m[1].split(",").map(x => x.split(":")[0].trim()).filter(Boolean).sort(); })();
  ok("the study-log entry has a normal show's shape (the stock entry's fields minus `before`; items {id,name,deck,result})", stockKeys.join() === Object.keys(entry).concat("before").sort().join() && entry.items.length === 12 && entry.items.every(it => Object.keys(it).sort().join() === "deck,id,name,result") && entry.items.filter(it => it.result === "c").length === 11 && entry.items[2].result === "m" && entry.total === 12 && entry.correct === 11 && entry.miss === 1 && entry.shown === 0 && entry.printNum === 42 && entry.sits.length === 1, { stockKeys, got: Object.keys(entry) });
  ok("in memory too: masteryData.kidA_idflash and the study log hold the same", W3.G.masteryData.kidA_idflash["Forestry · ID"][f.cards[0].key].shows.length === 1 && W3.G.masteryData.studyLog.kidA.idflash["20261027"].total === 12);
  ok("the deck line now reads from state (still 0 fluent after one show each)", W3.envFlashDoorHtml("kidA", session).includes("⚡ 0 of 24 fluent"));
  W3.envFlashQuit();
  ok("Done clears the sitting", W3.flash === null && W3.envFlashRunningHtml("kidA") === "");
  // second sitting the same day: the entry merges, the started items come first
  const f2 = W3.envFlashOpen("kidA", "Forestry · ID");
  ok("the next sitting leads with the items already started (oldest first)", f2.cards.slice(0, 12).every(c => c.st && c.st.shows.length === 1));
  f2.shownAt = Date.now() - 1000; W3.envFlashPickTap(f2.cards[0].lures.findIndex(l => l.ok));
  ok("Stop here keeps what was answered: finishes with 1", (W3.envFlashQuit(), f2.done && f2.done.total === 1));
  const e2 = W3.G.writes[3][2];
  ok("the same day's entry merges: 13 total, 13 items, two sits", W3.G.writes.length === 4 && e2.total === 13 && e2.items.length === 13 && e2.sits.length === 2 && e2.correct === 12);
  W3.envFlashQuit();
  ok("Quit with nothing answered writes nothing and clears", (W3.envFlashOpen("kidA", "Forestry · ID"), W3.envFlashQuit(), W3.G.writes.length === 4 && W3.flash === null));

  console.log("\n── fluent through three sittings; typed mode ──");
  const W4 = family({ release: ["Forestry · ID"] });
  await W4.envPicsLoad(fakeFetch); W4.envHydrate(W4.us.nc_envirothon, LIB);
  W4.envFlashSetMode("kidA", "type");
  const one4 = W4.envFlashDecks("kidA")[0].items.find(i => i.item === "Sassafras");
  const pics = [];
  // Sassafras was missed once last week → a started item, so every sitting leads with it (24 items, 12 a sitting)
  W4.G.masteryData.kidA_idflash = { "Forestry · ID": { Sassafras: { shows: [{ pic: "old", ok: false, secs: 11, at: 1 }], fluent: false, at: 1 } } };
  for (let s = 0; s < 3; s++) {
    const ff = W4.envFlashOpen("kidA", "Forestry · ID"); const ix = ff.cards.findIndex(c => c.item === "Sassafras");
    if (s === 0) ok("the started item leads the sitting", ix === 0);
    if (s === 0) ok("typed mode: the input and Check, no chips", W4.envFlashRunningHtml("kidA").includes('id="envflash-in"') && !W4.envFlashRunningHtml("kidA").includes("envFlashPickTap("));
    for (let i = 0; i < ff.cards.length; i++) { ff.shownAt = Date.now() - 2000; if (i === ix) { pics.push(ff.cards[i].pic.url); W4.G.typed = "sassafras"; W4.envFlashCheckTyped(); } else { W4.G.typed = "zzz"; W4.envFlashCheckTyped(); } W4.envFlashNextCard(); }
    W4.envFlashQuit();
  }
  const st4 = W4.G.masteryData.kidA_idflash["Forestry · ID"].Sassafras;
  ok("three sittings, three quick typed rights on three different pictures → fluent (the old miss doesn't break it)", new Set(pics).size === 3 && st4.fluent === true && st4.shows.length === 4);
  ok("the summary named it: Now fluent: Sassafras", W4.G.writes.some(w => w[0] === "update" && w[2]["Forestry · ID/Sassafras"] && w[2]["Forestry · ID/Sassafras"].fluent));
  ok("a fluent item is out of the next sitting; the deck line says ⚡ 1 of 24 fluent", W4.envFlashOpen("kidA", "Forestry · ID").cards.every(c => c.item !== "Sassafras") && W4.envFlashDoorHtml("kidA", null).includes("⚡ 1 of 24 fluent"));
  W4.envFlashQuit();
  ok("the pictures the shows were on are the repo URLs", st4.shows.slice(1).every(s => /^envirothon\/pics\/forestry_id\/sassafras\/\d\.jpg$/.test(s.pic)));

  console.log("\n── dry run ──");
  const W5 = family({ release: ["Forestry · ID", "Wildlife · ID"], dry: true });
  await W5.envPicsLoad(fakeFetch); W5.envHydrate(W5.us.nc_envirothon, LIB);
  ok("two released decks: the door offers Mix the decks", W5.envFlashDoorHtml("kidA", null).includes("envFlashOpen('kidA','all')"));
  const f5 = W5.envFlashOpen("kidA", "all");
  ok("Mix: 12 cards from both decks", f5.cards.length === 12 && new Set(f5.cards.map(c => c.deck)).size === 2);
  f5.cards.forEach(() => { f5.shownAt = Date.now() - 1000; W5.envFlashPickTap(f5.cards[f5.i].lures.findIndex(l => l.ok)); W5.envFlashNextCard(); });
  ok("dry run: scored on the screen, nothing written, says so", f5.done && f5.done.dry === true && f5.done.saved === false && f5.done.correct === 12 && W5.G.writes.length === 0 && W5.envFlashRunningHtml("kidA").includes("Dry run — scored here only, nothing saved."));
  ok("dry run still scores in memory (the next sitting continues from it)", W5.G.masteryData.kidA_idflash["Wildlife · ID"] || W5.G.masteryData.kidA_idflash["Forestry · ID"]);

  console.log("\n── a kid / family without the unit: byte-identical ──");
  const W6 = world({ unitStudies: { other: { id: "other", decks: [{ key: "Forestry · ID", cards: [{ name: "Sassafras · parts valued in some areas" }] }], enrolled: { kidA: true } } } });
  await W6.envPicsLoad(fakeFetch);
  ok("no code-held unit: no decks, no door, no game, no cycle, no visuals, nothing written", W6.envFlashDecks("kidA").length === 0 && W6.envFlashDoorHtml("kidA", { decks: ["Forestry · ID"] }) === "" && W6.envFlashAvail("kidA") === false && (W6.setStudy({}, []), W6.envPicCycle({ key: "r:1", deck: "Forestry · ID", name: "Sassafras · parts valued in some areas" }) === "") && !W6.us.other.visuals && W6.G.writes.length === 0 && W6.G.soon === 0);
  ok("envFlashOpen for such a kid returns null and starts nothing", W6.envFlashOpen("kidA", "all") === null && W6.flash === null);

  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
