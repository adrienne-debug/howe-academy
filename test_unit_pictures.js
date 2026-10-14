// 🖼 Find pictures (UNIT_PICS block, Andrew's ask 2026-10-14: "they will def need pictures as well and they can be
// pulled from chrome"). Slices the real block + the starter registry out of index.html and runs it over a stubbed
// fetch: Mom-only button counts the picture-less cards; the lookup asks Wikipedia's summary endpoint by the card's
// wiki title, falls back to a search on a miss, and never throws; Mom's picks save as {imageUrl, credit} visuals in
// ONE multi-path update on unitStudies/<id>/visuals (nothing in dry run, nothing for a kid); a photo already on a
// card is left alone, an emoji visual counts as missing. Every card in both interest units carries a wiki title.
// Run: node test_unit_pictures.js
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(process.env.UNITS_SRC || path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond, d) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (d ? "  → " + d : "")); } }
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("missing " + a); return src.slice(i, j); };
ok("UNIT_PICS block present once", src.indexOf("// UNIT_PICS_START") > 0 && src.indexOf("// UNIT_PICS_START", src.indexOf("// UNIT_PICS_START") + 1) < 0 && src.indexOf("// UNIT_PICS_END") > src.indexOf("// UNIT_PICS_START"));
ok("renderUnitDetail shows the button inside the Mom box", /h\+=_unitPicsBtnHtml\(u\);/.test(cut("function renderUnitDetail(", "\n}\n")));
const PICS = cut("// UNIT_PICS_START", "// UNIT_PICS_END"), UNITS = cut("// STARTER_UNITS_START", "// STARTER_UNITS_END");

// A fake Wikipedia: summary pages by title (some without a thumbnail), one search index.
function fakeWiki(pages, search) {
  const calls = [];
  const fetchFn = async url => { calls.push(url);
    const sm = /rest_v1\/page\/summary\/(.+)$/.exec(url);
    if (sm) { const t = decodeURIComponent(sm[1]).replace(/_/g, " "); const p = pages[t]; return p ? { ok: true, json: async () => p } : { ok: false, status: 404, json: async () => ({ type: "not_found" }) }; }
    const q = /srsearch=(.+)$/.exec(url); if (q) { const hit = (search || {})[decodeURIComponent(q[1])]; return { ok: true, json: async () => ({ query: { search: hit ? [{ title: hit }] : [] } }) }; }
    throw new Error("unexpected url " + url); };
  fetchFn.calls = calls; return fetchFn;
}
function load(env) {
  env = env || {};
  const G = { unitStudies: env.unitStudies || {}, mom: env.mom !== false, dry: !!env.dry, writes: [], renders: 0, dom: { content: { innerHTML: "" } } };
  const db = env.db === false ? null : { ref(p) { return { update(v) { G.writes.push(["update", p, v]); }, set(v) { G.writes.push(["set", p, v]); } }; } };
  const doc = { getElementById: id => G.dom[id] || null, createElement: () => { const el = { style: {}, remove() { el.removed = true; } }; return el; }, body: { appendChild: el => { G.dom[el.id] = el; G.lastOverlay = el; } } };
  const fn = new Function("G", "db", "fetch", "document", `
    let unitStudies=G.unitStudies; function momHere(){ return G.mom; } function _dryRun(){ return G.dry; } function renderUnits(){ G.renders++; }
    function alert(m){ G.alerted=m; }
    ${UNITS}
    ${PICS}
    return { STARTER_UNITS, _unitPicsMissing, _unitPicsBtnHtml, _unitPicsLookup, _unitPicsSummaryUrl, _unitPicsSearchUrl, _unitPicsBigger, unitFindPictures, unitPicsToggle, unitPicsSave, unitPicsClose, get pics(){ return unitPics; } };`);
  const api = fn(G, db, env.fetch, doc); api.G = G; return api;
}
const thumb = (file, w) => ({ source: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/" + file + "/" + (w || 320) + "px-" + file, width: w || 320, height: 240 });

console.log("# every interest card has a Wikipedia title");
{ const a = load(); for (const id of ["construction_machines", "cats_house_and_wild"]) { const u = a.STARTER_UNITS[id]();
    ok(id + ": every card carries wiki", u.decks.every(d => d.cards.every(c => typeof c.wiki === "string" && c.wiki.length > 2)));
    ok(id + ": the paths' cards don't (no wiki on math / letters / shapes / AAS)", !a.STARTER_UNITS.math_fluency_path().decks.some(d => d.cards.some(c => c.wiki))); }
  const cats = a.STARTER_UNITS.cats_house_and_wild().decks[0].cards;
  ok("the Tilcayo card looks up Leopardus tilcayo; breeds use the '… cat' article names", cats.find(c => c.name === "Tilcayo tiger cat").wiki === "Leopardus tilcayo" && cats.find(c => c.name === "Persian").wiki === "Persian cat" && cats.find(c => c.name === "Maine Coon").wiki === "Maine Coon");
  const cm = a.STARTER_UNITS.construction_machines();
  ok("ambiguous parts point at a page with the right picture (Boom → crane, Blade → bulldozer)", cm.decks[1].cards.find(c => c.name === "Boom").wiki === "Crane (machine)" && cm.decks[1].cards.find(c => c.name === "Blade").wiki === "Bulldozer");
  ok("the picture decks carry no wiki in the kid's bank fields (unitEnroll copies named fields only)", !/"wiki"/.test(cut("function unitEnroll(", "\n}\n")));
}

console.log("# URLs");
{ const a = load();
  ok("summary URL: title → underscores, encoded", a._unitPicsSummaryUrl("Pallas's cat") === "https://en.wikipedia.org/api/rest_v1/page/summary/Pallas's_cat".replace("'", "'") && a._unitPicsSummaryUrl("Trencher (machine)") === "https://en.wikipedia.org/api/rest_v1/page/summary/Trencher_(machine)" && a._unitPicsSummaryUrl("Tower crane") === "https://en.wikipedia.org/api/rest_v1/page/summary/Tower_crane");
  ok("search URL: action API with origin=* (CORS) and the query encoded", /^https:\/\/en\.wikipedia\.org\/w\/api\.php\?action=query&list=search&format=json&origin=\*&srlimit=1&srsearch=Leopardus%20tilcayo$/.test(a._unitPicsSearchUrl("Leopardus tilcayo")));
  ok("thumbnail upsized to 480px", a._unitPicsBigger(thumb("Lion.jpg").source) === "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Lion.jpg/480px-Lion.jpg" && a._unitPicsBigger("https://x/y.jpg") === "https://x/y.jpg");
}

console.log("# lookup");
{ const a = load(); const f = fakeWiki({ "Lion": { title: "Lion", thumbnail: thumb("Lion.jpg") }, "Leopardus tilcayo": { title: "Leopardus tilcayo" }, "Oncilla": { title: "Oncilla", thumbnail: thumb("Oncilla.jpg") } }, { "Leopardus tilcayo": "Oncilla", "Nowhere cat": null });
  (async () => {
    let r = await a._unitPicsLookup(f, "Lion", "Lion");
    ok("direct hit: url + credit", r && r.url.endsWith("480px-Lion.jpg") && r.credit === "Wikipedia · Lion" && f.calls.length === 1);
    r = await a._unitPicsLookup(f, "Leopardus tilcayo", "Tilcayo tiger cat");
    ok("page without a thumbnail → search → the hit's summary", r && r.url.endsWith("480px-Oncilla.jpg") && r.credit === "Wikipedia · Oncilla" && f.calls.slice(1).length === 3 && /srsearch=Leopardus%20tilcayo/.test(f.calls[2]));
    r = await a._unitPicsLookup(f, "Nowhere cat", "Nowhere cat");
    ok("404 + empty search → null, no throw", r === null);
    const boom = async () => { throw new Error("offline"); };
    ok("fetch that throws → null", (await a._unitPicsLookup(boom, "Lion", "Lion")) === null);
    await part2();
  })().catch(e => { console.log("  FAIL- lookup threw " + e.message); fail++; console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(1); });
}

async function part2() {
  console.log("# missing + button");
  { const a = load(); const u = a.STARTER_UNITS.cats_house_and_wild(); u.visuals["Cats_Bobcat"] = { imageUrl: "data:image/jpeg;base64,xx" };
    const miss = a._unitPicsMissing(u);
    ok("58 cards, Bobcat has a photo → 57 missing; the emoji Lion still counts as missing", miss.length === 57 && !miss.some(m => m.name === "Bobcat") && miss.some(m => m.name === "Lion"));
    ok("missing entries carry key + wiki title", miss[0].key === "Cats_Maine Coon" && miss[0].wiki === "Maine Coon");
    const G = { cats_house_and_wild: u }; const b = load({ unitStudies: G });
    ok("Mom sees the button with the count", /57 cards without one/.test(b._unitPicsBtnHtml(u)) && /unitFindPictures\('cats_house_and_wild'\)/.test(b._unitPicsBtnHtml(u)));
    ok("kid: no button", load({ mom: false })._unitPicsBtnHtml(u) === "");
    u.decks.forEach(d => d.cards.forEach(c => { u.visuals[d.key + "_" + c.name] = { imageUrl: "x" }; }));
    ok("all pictured → no button", b._unitPicsBtnHtml(u) === ""); }

  console.log("# find → pick → save");
  const pages = {}; const cmU0 = load().STARTER_UNITS.construction_machines();
  cmU0.decks[0].cards.forEach(c => { pages[c.wiki] = { title: c.wiki, thumbnail: thumb(c.wiki.replace(/\W+/g, "_") + ".jpg") }; });   // every machine found, no part found
  { const f = fakeWiki(pages, {}); const u = load().STARTER_UNITS.construction_machines(); const a = load({ unitStudies: { construction_machines: u }, fetch: f });
    await a.unitFindPictures("construction_machines");
    const p = a.pics;
    ok("20 found (19 machines + Blade via the Bulldozer page), 9 parts not, done", p && !p.busy && p.found.length === 20 && p.miss.length === 9 && p.done === 29 && p.total === 29 && p.found.some(x => x.name === "Blade"));
    ok("found entries: key, name, 480px url, credit, on", p.found.every(x => /^(Construction Machines|Machine Parts)_/.test(x.key) && x.on && /480px-/.test(x.url) && /^Wikipedia · /.test(x.credit)));
    ok("the overlay lists what was found and the misses", /20 found · 9 not found/.test(a.G.lastOverlay.innerHTML) && /No picture found:<\/b> Bucket, /.test(a.G.lastOverlay.innerHTML) && /Save 20 pictures/.test(a.G.lastOverlay.innerHTML));
    ok("each miss cost a summary + a search (no throw)", f.calls.filter(x => /srsearch/.test(x)).length === 9);
    const idx = p.found.findIndex(x => x.name === "Grader"); a.unitPicsToggle(idx);
    ok("tap → left out, button says 19", !p.found[idx].on && /Save 19 pictures/.test(a.G.lastOverlay.innerHTML));
    a.unitPicsSave();
    const w = a.G.writes;
    ok("ONE multi-path update on unitStudies/construction_machines/visuals with the 19 chosen keys", w.length === 1 && w[0][0] === "update" && w[0][1] === "unitStudies/construction_machines/visuals" && Object.keys(w[0][2]).length === 19 && !w[0][2]["Construction Machines_Grader"]);
    ok("each value is {imageUrl, credit} — the same object shape the photo picker writes", Object.values(w[0][2]).every(v => typeof v.imageUrl === "string" && /^https:\/\/upload\.wikimedia\.org\//.test(v.imageUrl) && /^Wikipedia · /.test(v.credit) && Object.keys(v).length === 2));
    ok("in memory too; the emoji Crane visual is replaced by the photo, the Bucket emoji stays", u.visuals["Construction Machines_Excavator"].imageUrl && typeof u.visuals["Construction Machines_Crane"] === "object" && u.visuals["Machine Parts_Bucket"] === "\u{1FAA3}");
    ok("overlay closed, Units re-rendered", a.pics === null && a.G.renders === 1 && a.G.lastOverlay.removed);
    ok("now 10 missing (9 parts + Grader) — the button comes back for those", a._unitPicsMissing(u).length === 10); }
  { const f = fakeWiki(pages, {}); const u = load().STARTER_UNITS.construction_machines(); const a = load({ unitStudies: { construction_machines: u }, fetch: f, dry: true });
    await a.unitFindPictures("construction_machines"); a.unitPicsSave();
    ok("dry run: picked in memory, nothing written", a.G.writes.length === 0 && u.visuals["Construction Machines_Excavator"].imageUrl); }
  { const f = fakeWiki(pages, {}); const u = load().STARTER_UNITS.construction_machines(); const a = load({ unitStudies: { construction_machines: u }, fetch: f, mom: false });
    await a.unitFindPictures("construction_machines");
    ok("kid device: Find does nothing (no fetch, no overlay)", f.calls.length === 0 && a.pics === null && !a.G.lastOverlay); }
  { const f = fakeWiki(pages, {}); const u = load().STARTER_UNITS.construction_machines(); u.visuals["Construction Machines_Excavator"] = { imageUrl: "data:image/jpeg;base64,mine" };
    const a = load({ unitStudies: { construction_machines: u }, fetch: f });
    await a.unitFindPictures("construction_machines"); a.unitPicsSave();
    ok("a card with Mom's own photo is never looked up or overwritten", !f.calls.some(x => /Excavator/.test(x)) && u.visuals["Construction Machines_Excavator"].imageUrl === "data:image/jpeg;base64,mine" && !a.G.writes[0][2]["Construction Machines_Excavator"]); }
  { const f = fakeWiki(pages, {}); const u = load().STARTER_UNITS.construction_machines(); const a = load({ unitStudies: { construction_machines: u }, fetch: f });
    const run = a.unitFindPictures("construction_machines"); a.unitPicsClose(); await run;
    ok("Cancel mid-lookup: nothing saved, no stale overlay", a.pics === null && a.G.writes.length === 0 && !u.visuals["Construction Machines_Excavator"]); }
  { const a = load({ unitStudies: {}, fetch: fakeWiki({}, {}) }); await a.unitFindPictures("nope"); ok("unknown unit: nothing", a.pics === null); }
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
}
