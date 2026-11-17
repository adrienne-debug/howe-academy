// 💎 Rocks, Gems & Minerals — an INTEREST_UNITS starter (her ask 2026-11-16: a Pre-K kid "wants to learn different gem
// stones rocks minerals etc geology"). Slices the real block + registry out of index.html and checks: the unit is a
// plain-enroll notebook unit like Construction Machines and Cats (no stages, notebook pages ON); 42 picture cards in four
// families in order (Gemstones · Minerals · Rocks · Kid favorites) + a 15-card words deck, Pre-K backs (one or two short
// sentences), pearl / amber / coal / fossil honest that they aren't minerals; every card carries a Wikipedia title for
// 🖼 Find pictures AND ships a photo visual {imageUrl, credit} — a 330px Wikimedia Commons thumbnail, licence public
// domain / CC0 / CC BY only (never SA / NC / ND), credit shown; seven hands-on sheet projects (the gem dig reuses the
// "Oat and gem treasure" idea without a second activity record); Mom sees it under 📚 Starter units and Add is ONE
// create-only transaction; a kid enrolling gets 2 + 2 cards learning and all 57 in the bank (targeted writes only);
// building the unit writes nothing; no kid or family name anywhere in it; and the notebook insert pages it prints fit
// the 8.5×11 page — measured in real Chrome (Playwright if installed, else the Chrome app headless; SKIPPED if neither).
// Run: node test_rocks_gems_unit.js
const fs = require("fs"), path = require("path"), os = require("os"), cp = require("child_process");
const src = fs.readFileSync(process.env.UNITS_SRC || path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond, d) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (d ? "  → " + d : "")); } }
function extract(startPat) {
  const i = src.indexOf("\n" + startPat); if (i < 0) throw new Error("not found: " + startPat);
  let depth = 0, inS = null, seen = false, k = i + 1;
  for (; k < src.length; k++) { const c = src[k], p = src[k - 1];
    if (inS) { if (c === inS && p !== "\\") inS = null; continue; }
    if (c === '"' || c === "'" || c === "`") { inS = c; continue; }
    if (c === "/" && src[k + 1] === "/") { k = src.indexOf("\n", k) - 1; continue; }
    if (c === "/" && /[=(,:!&|?{};]\s*$/.test(src.slice(Math.max(0, k - 3), k))) {
      let q = k + 1, cls = false; for (; q < src.length; q++) { const d = src[q];
        if (d === "\\") { q++; continue; } if (d === "[") cls = true; else if (d === "]") cls = false; else if (d === "/" && !cls) break; }
      k = q; continue; }
    if (c === "{" || c === "[" || c === "(") { depth++; seen = true; } else if (c === "}" || c === "]" || c === ")") depth--;
    else if (c === "\n" && depth === 0 && seen) break; }
  return src.slice(i + 1, k + 1);
}
const a = src.indexOf("// STARTER_UNITS_START"), b = src.indexOf("// STARTER_UNITS_END");
const block = src.slice(a, b);

function load(env) {
  env = env || {};
  const G = { unitStudies: env.unitStudies || {}, mom: env.mom !== false, dry: !!env.dry, writes: [], content: { innerHTML: "" },
    masteryData: env.mastery || {}, nbActs: env.nbActs || [] };
  const db = env.db === false ? null : { ref(p) { return { update(v) { G.writes.push(["update", p, v]); }, set(v) { G.writes.push(["set", p, v]); },
    transaction(fn) { const r = fn(null); if (r !== undefined) G.writes.push(["txn", p, r]); return Promise.resolve({ committed: r !== undefined }); } }; } };
  const fn = new Function("G", "db", `
    let unitStudies=G.unitStudies; const masteryData=G.masteryData; const HA_LS={ setItem(){} };
    function momHere(){ return G.mom; } function _dryRun(){ return G.dry; } function cap(s){ return s[0].toUpperCase()+s.slice(1); }
    function renderUnits(){} function mastDefKeyOk(n){ return !/[.$#\\[\\]\\/]/.test(n); } function mastGateChapter(){ return null; }
    function nbUnitDays(){ return {}; } function _nbActKeys(){ return G.nbActs; } function mastTierAtLeast(){ return false; }
    const document={ getElementById:()=>G.content };
    ${block}
    ${extract("function unitEnroll(")}
    ${extract("function _unitCharDeck(")}
    ${extract("function _unitPortrait(")}
    ${extract("function _unitActs(")}
    ${extract("function unitActPoints(")}
    ${extract("function haBuildUnitInsight(")}
    return { STARTER_UNITS, _starterUnitsHtml, starterUnitAdd, _unitStagedEnrollPending, unitEnroll, haBuildUnitInsight, RG_PICS, INTEREST_WIKI,
      get us(){ return unitStudies; } };`);
  const api = fn(G, db); api.G = G; return api;
}

console.log("# loads quietly");
const api = load();
const u = api.STARTER_UNITS.rocks_gems_minerals();
ok("building the unit (and loading the block) writes nothing", api.G.writes.length === 0 && api.STARTER_UNITS.rocks_gems_minerals() !== u && api.G.writes.length === 0);

console.log("# shape");
ok("a plain-enroll notebook unit: no stages, nbInsert on, starter/starterVer/title/emoji/desc", !u.stages && !api._unitStagedEnrollPending(u) && u.nbInsert !== false &&
  u.id === "rocks_gems_minerals" && u.starter === u.id && u.starterVer === 1 && u.title === "Rocks, Gems & Minerals" && u.emoji === "\u{1F48E}" && u.desc.length > 60);
ok("two flip decks, 2 at a time: Rocks and Gems (grouped) + Rock Words", u.decks.length === 2 && u.decks[0].key === "Rocks and Gems" && u.decks[0].groupBy === "group" &&
  u.decks[1].key === "Rock Words" && !u.decks[1].groupBy && u.decks.every(d => d.mode === "flip" && d.introCap === 2));
const rocks = u.decks[0].cards, words = u.decks[1].cards, all = rocks.concat(words);
const groups = [...new Set(rocks.map(c => c.group))];
ok("families in order: Gemstones · Minerals · Rocks · Kid favorites", JSON.stringify(groups) === JSON.stringify(["Gemstones", "Minerals", "Rocks", "Kid favorites"]));
const cnt = g => rocks.filter(c => c.group === g).length;
ok("42 picture cards (12 gemstones, 13 minerals, 9 rocks, 8 kid favorites) + 15 words", rocks.length === 42 && cnt("Gemstones") === 12 && cnt("Minerals") === 13 && cnt("Rocks") === 9 && cnt("Kid favorites") === 8 && words.length === 15,
  [rocks.length, groups.map(cnt).join("/"), words.length].join(" "));
ok("every family runs as one block (the Units tab and notebook sort by order)", rocks.every((c, i) => i === 0 || c.group === rocks[i - 1].group || groups.indexOf(c.group) === groups.indexOf(rocks[i - 1].group) + 1));
ok("the brief's cards are all there", ["Ruby", "Sapphire", "Emerald", "Diamond", "Amethyst", "Topaz", "Opal", "Garnet", "Turquoise", "Pearl", "Quartz", "Pyrite", "Mica", "Calcite", "Fluorite", "Gold", "Copper", "Halite", "Magnetite",
  "Granite", "Basalt", "Obsidian", "Pumice", "Sandstone", "Limestone", "Marble", "Slate", "Coal", "Geode", "Crystal", "Fossil", "Meteorite", "Petrified wood", "Amber"].every(n => rocks.some(c => c.name === n)));
ok("the brief's words are all there (hard and soft as two cards)", ["Rock", "Mineral", "Gem", "Magma", "Lava", "Volcano", "Layers", "Shiny", "Sparkle", "Hard", "Soft", "Magnet"].every(n => words.some(c => c.name === n)));
ok("every name is a legal Firebase key, unique across BOTH decks (the kid's definitions are keyed by name)", all.every(c => !/[.$#\[\]\/]/.test(c.name)) && new Set(all.map(c => c.name)).size === all.length);
ok("order runs 1..n in each deck; a words card has no group", u.decks.every(d => d.cards.every((c, i) => c.order === i + 1)) && words.every(c => !c.group) && rocks.every(c => c.group));

console.log("# Pre-K backs");
const sentences = d => d.split(/(?<=[.!?])\s+/).filter(Boolean);
ok("every card has a back of 20–130 characters", all.every(c => typeof c.def === "string" && c.def.length >= 20 && c.def.length <= 130), all.filter(c => !(c.def && c.def.length >= 20 && c.def.length <= 130)).map(c => c.name + ":" + (c.def || "").length).join(","));
ok("one or two sentences, none over 14 words", all.every(c => sentences(c.def).length <= 2 && sentences(c.def).every(s => s.split(/\s+/).length <= 14)),
  all.filter(c => sentences(c.def).length > 2 || sentences(c.def).some(s => s.split(/\s+/).length > 14)).map(c => c.name).join(","));
ok("short words (none over 11 letters, the card's own name aside)", all.every(c => c.def.split(/[\s—-]+/).every(w => { const x = w.replace(/[^a-z]/gi, ""); return x.length <= 11 || c.name.replace(/\s/g, "").toLowerCase().indexOf(x.toLowerCase()) === 0; })),
  all.map(c => c.def.split(/[\s—-]+/).map(w => w.replace(/[^a-z]/gi, "")).filter(x => x.length > 11 && c.name.replace(/\s/g, "").toLowerCase().indexOf(x.toLowerCase()) !== 0).join("/")).filter(Boolean).join(","));
const back = n => (rocks.find(c => c.name === n) || {}).def || "";
ok("pearl, amber, coal and fossil say honestly they aren't minerals", ["Pearl", "Amber", "Coal", "Fossil"].every(n => /(isn't|is not|not) a (rock or a )?mineral/.test(back(n))), ["Pearl", "Amber", "Coal", "Fossil"].map(back).join(" | "));
ok("pyrite is fool's gold; diamond is the hardest; talc the softest", /fool's gold/.test(back("Pyrite")) && /hardest/.test(back("Diamond")) && /softest/.test(back("Talc")));
ok("no 🔀 anywhere in the unit", !/\u{1F500}/u.test(JSON.stringify(u)));

console.log("# pictures");
ok("every card carries a Wikipedia title for 🖼 Find pictures", all.every(c => typeof c.wiki === "string" && c.wiki.length > 2));
ok("titles that differ from the name point at the article (Aquamarine (gem), Rock (geology), Gemstone, Stratum)", rocks.find(c => c.name === "Aquamarine").wiki === "Aquamarine (gem)" &&
  words.find(c => c.name === "Rock").wiki === "Rock (geology)" && words.find(c => c.name === "Gem").wiki === "Gemstone" && words.find(c => c.name === "Layers").wiki === "Stratum" && rocks.find(c => c.name === "Quartz").wiki === "Quartz");
ok("the other interest units' wiki titles are untouched", api.INTEREST_WIKI["Persian"] === "Persian cat" && api.INTEREST_WIKI["Boom"] === "Crane (machine)");
const V = u.visuals || {};
ok("every card ships a photo visual {imageUrl, credit} — one per card, nothing extra", all.every(c => { const v = V["Rocks and Gems_" + c.name] || V["Rock Words_" + c.name]; return v && typeof v === "object" && v.imageUrl && v.credit; }) &&
  Object.keys(V).length === all.length && u.decks.every(d => d.cards.every(c => V[d.key + "_" + c.name])));
const URL_RE = /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\/([0-9a-f])\/\1[0-9a-f]\/([^\/?#\s"'<>]+)\/330px-\2$/;
ok("each a 330px Wikimedia Commons thumbnail (no query string, no rewritten width)", Object.values(V).every(v => URL_RE.test(v.imageUrl)), Object.values(V).filter(v => !URL_RE.test(v.imageUrl)).map(v => v.imageUrl).join(" "));
ok("no photo used twice", new Set(Object.values(V).map(v => v.imageUrl)).size === all.length);
const LIC_RE = /(?:^| · )(Public domain|CC0|CC BY \d\.\d) · Wikimedia Commons$/;
ok("every credit names the licence: public domain, CC0 or CC BY only — never SA / NC / ND", Object.values(V).every(v => LIC_RE.test(v.credit) && !/SA|NC|ND/.test(v.credit)), Object.values(V).filter(v => !LIC_RE.test(v.credit)).map(v => v.credit).join(" | "));
ok("CC BY credits name the photographer", Object.values(V).filter(v => /CC BY/.test(v.credit)).every(v => /^[^·]{2,} · CC BY/.test(v.credit)));
ok("RG_PICS has one row per card, no strays", api.RG_PICS.length === all.length && api.RG_PICS.every(p => all.some(c => c.name === p[0])));

console.log("# projects");
const acts = u.activities;
ok("seven hands-on sheet projects, unique keys, 5 points each", acts.length === 7 && new Set(acts.map(x => x.key)).size === 7 && acts.every(x => x.kind === "sheet" && x.points === 5 && x.title && x.emoji && x.desc));
ok("rock hunt · sort · scratch test · magnet · salt crystals · pet rock · gem dig", acts.map(x => x.key).join() === "rock_hunt,sort_rocks,scratch_test,magnet_test,grow_crystals,pet_rock,gem_dig");
ok("Pre-K: nothing to write (no lines), short steps", acts.every(x => !x.lines && (x.steps || []).every(s => s.split(/\s+/).length <= 8)));
ok("the scratch test uses a penny, the crystals are salt with Mom", /penny/.test(acts[2].desc) && /With Mom/.test(acts[4].desc) && /salt/.test(acts[4].desc));
ok("the gem dig reuses the Oat and gem treasure idea; that activity record is still the only one", /Oat and gem treasure/.test(acts[6].desc) && (src.match(/t:'Oat and gem treasure'/g) || []).length === 1);

console.log("# no names");
const names = ["Julian", "Lincoln", "Ellis", "Lucy", "Caleb", "Kenzie", "Taylor", "Andrew", "Adrienne", "Sara", "Howe", "DeWalt", "Burris"];
const rgSrc = src.slice(src.indexOf("function _rgDecks("), src.indexOf("// INTEREST_UNITS_END")) + extract("  rocks_gems_minerals:") +
  src.slice(src.indexOf("//   💎 Rocks, Gems & Minerals"), src.indexOf("\n", src.indexOf("projects (Mom queues")) ) +
  src.slice(src.indexOf("  // 💎 Rocks, Gems & Minerals (2026-11-16)"), src.indexOf("};", src.indexOf("  // 💎 Rocks, Gems & Minerals (2026-11-16)")));
ok("the unit's code, comments and record name no child or family", rgSrc.length > 5000 && !names.some(n => new RegExp("\\b" + n + "\\b", "i").test(rgSrc + JSON.stringify(u))),
  names.filter(n => new RegExp("\\b" + n + "\\b", "i").test(rgSrc + JSON.stringify(u))).join(","));

console.log("# 📚 starter list + Add + enroll");
const h = api._starterUnitsHtml();
ok("Mom sees it with an Add button and 57 cards", /starterUnitAdd\('rocks_gems_minerals'\)/.test(h) && /Rocks, Gems &amp; Minerals/.test(h) && /57 cards/.test(h));
ok("kid view: nothing; hidden once the family has it", load({ mom: false })._starterUnitsHtml() === "" && !/rocks_gems_minerals/.test(load({ unitStudies: { rocks_gems_minerals: { id: "rocks_gems_minerals" } } })._starterUnitsHtml()));
{ const t = load(); t.starterUnitAdd("rocks_gems_minerals");
  const w = t.G.writes;
  ok("Add → ONE create-only transaction on unitStudies/rocks_gems_minerals, photos inside", w.length === 1 && w[0][0] === "txn" && w[0][1] === "unitStudies/rocks_gems_minerals" && w[0][2].id === "rocks_gems_minerals" && w[0][2].addedTs > 0 &&
    Object.keys(w[0][2].visuals).length === 57); }
{ const t = load({ dry: true }); t.starterUnitAdd("rocks_gems_minerals");
  ok("dry run: added in memory, nothing written", t.us.rocks_gems_minerals && t.G.writes.length === 0); }
{ const t = load({ unitStudies: { rocks_gems_minerals: api.STARTER_UNITS.rocks_gems_minerals() } });
  t.unitEnroll("rocks_gems_minerals", "kid1");
  const items = t.G.masteryData.kid1, bank = t.G.masteryData.kid1_custom_items, st = t.G.masteryData.kid1_settings;
  ok("a kid enrolls: Ruby + Sapphire + Rock + Mineral learning, all 57 in the bank", items.map(i => i.prompt).join() === "Ruby,Sapphire,Rock,Mineral" && items.every(i => i.status === "introduction") && bank.length === 57);
  ok("both decks flip, 2 at a time, all 57 backs in the kid's definitions", st.cat_modes["Rocks and Gems"] === "flip" && st.cat_modes["Rock Words"] === "flip" && st.cat_intro_max["Rocks and Gems"] === 2 && Object.keys(st.definitions).length === 57 && st.definitions["Pyrite"] === back("Pyrite"));
  ok("writes are targeted (enrolled flag + the kid's own mastery nodes), no wiki copied to the bank", t.G.writes.every(w => w[0] === "set" ? /^unitStudies\/rocks_gems_minerals\/enrolled\/kid1$/.test(w[1]) : /^mastery\/kid1(_custom_items|_settings\/(cat_modes|cat_intro_max|definitions))?$/.test(w[1])) && bank.every(e => e.wiki == null)); }
{ const t = load({ mom: false, unitStudies: { rocks_gems_minerals: api.STARTER_UNITS.rocks_gems_minerals() } }); t.unitEnroll("rocks_gems_minerals", "kid1");
  ok("kid device: enroll does nothing", !t.G.masteryData.kid1 && t.G.writes.length === 0); }

// ── Notebook: the insert pages this unit prints (haBuildUnitInsight → notebooks.js unitInsertPages), worst case: five
// cards learning, a dozen learned, the words strip, and all seven projects queued.
console.log("# notebook pages");
global.window = {};
eval(fs.readFileSync(path.join(__dirname, "notebooks.js"), "utf8"));
const NB = window.HoweNotebooks, I = NB._internal;
const nbKid = (learn, learned, actKeys) => { const mastery = { kid1: rocks.slice(0, learn + learned).map((c, i) => ({ subject: "Rocks and Gems", prompt: c.name, status: i < learned ? "learning" : "introduction", tier: "daily" })) };
  const t = load({ mastery, nbActs: actKeys }); return t.haBuildUnitInsight("kid1", u); };
const insFull = nbKid(5, 12, acts.map(x => x.key)), insStart = nbKid(2, 0, ["rock_hunt"]);
ok("the insight carries photos, families and backs into the notebook", insFull.learning.length === 5 && insFull.learned.length === 12 &&
  insFull.learning.every(m => m.group && m.bio === back(m.name) && m.portrait && m.portrait.img === V["Rocks and Gems_" + m.name].imageUrl));
ok("…the words deck as the strip, and every queued project as its own page spec", insFull.extrasTitle === "Rock Words" && insFull.extras.length === 15 && insFull.activities.length === 7 && insFull.activities.every(x => x.kind === "sheet" && x.points === 5));
const dates = { monday: "November 16, 2026", tuesday: "November 17, 2026", wednesday: "November 18, 2026", thursday: "November 19, 2026", friday: "November 20, 2026" };
const ctx = units => ({ weekNum: "week31", weekDates: "Nov 16–20, 2026", weekData: { dates, tasks: [] }, masteryItems: [], extraPages: {}, units });
const books = [["Pre-K notebook", I.generatePreK(ctx([insFull]))], ["starter notebook", I.generateGeneric(ctx([insFull]))], ["Pre-K, first week", I.generatePreK(ctx([insStart]))]]
  .map(([l, o]) => [l, (o && (o.student || o.html)) || String(o)]);
books.forEach(([l, html]) => {
  const n = (html.match(/Unit Study — Rocks, Gems &amp; Minerals \(/g) || []).length;
  ok(l + ": the unit's pages print (" + n + ")", l === "Pre-K, first week" ? n === 2 : n === 8, n);
});
ok("every project page prints its title and steps", acts.every(x => books[0][1].indexOf(x.title.replace(/&/g, "&amp;")) >= 0 && (x.steps || []).every(s => books[0][1].indexOf(s) >= 0)));
ok("the printed pages show the cards' photos", books[0][1].indexOf(insFull.learning[0].portrait.img) >= 0);

function measureScript() { return `<script>window.addEventListener("load",()=>setTimeout(()=>{const b=[];document.querySelectorAll(".page").forEach((pg,i)=>{
  const lbl=(pg.previousElementSibling&&pg.previousElementSibling.textContent)||("page "+i); if(!/Rocks, Gems/.test(lbl)) return;
  if(pg.scrollHeight>pg.clientHeight+1||pg.scrollWidth>pg.clientWidth+1) b.push(lbl+": page "+pg.scrollHeight+">"+pg.clientHeight);
  pg.querySelectorAll("div").forEach(el=>{ const cs=getComputedStyle(el); if(cs.overflow==="hidden"&&el.scrollHeight>el.clientHeight+2) b.push(lbl+": box "+el.scrollHeight+">"+el.clientHeight); }); });
  const n=[...document.querySelectorAll(".page")].filter(pg=>/Rocks, Gems/.test((pg.previousElementSibling||{}).textContent||"")).length;
  const o=document.createElement("pre"); o.id="rgout"; o.textContent=JSON.stringify({n,b}); document.body.appendChild(o);},300));</script>`; }
const prep = html => html.replace(/<link[^>]*fonts\.googleapis[^>]*>/g, "").replace(/<img [^>]*src="https:[^"]*"[^>]*>/g, m => m.replace(/src="https:[^"]*"/, 'src="data:image/gif;base64,R0lGODlhAQABAAAAACw="')).replace("</body>", measureScript() + "</body>");
(async () => {
  let pw = null;
  try { pw = require("playwright"); } catch (e) { try { pw = require(path.join(cp.execSync("npm root -g", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(), "playwright")); } catch (e2) {} }
  const CHROME = ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find(p => fs.existsSync(p));
  const results = [];
  if (pw) { let browser; try { browser = await pw.chromium.launch(); } catch (e) {}
    if (browser) { const page = await browser.newPage();
      for (const [l, html] of books) { await page.setContent(prep(html)); await page.waitForSelector("#rgout", { state: "attached", timeout: 10000 }); results.push([l, JSON.parse(await page.$eval("#rgout", e => e.textContent))]); }
      await browser.close(); } }
  if (!results.length && CHROME) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rgnb-"));
    for (const [l, html] of books) { const f = path.join(dir, "nb.html"); fs.writeFileSync(f, prep(html));
      try { const out = cp.execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--user-data-dir=" + path.join(dir, "prof"), "--virtual-time-budget=4000", "--dump-dom", "file://" + f], { stdio: ["ignore", "pipe", "ignore"], timeout: 60000 }).toString();
        const m = /<pre id="rgout">([^<]*)<\/pre>/.exec(out); if (m) results.push([l, JSON.parse(m[1].replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&quot;/g, '"').replace(/&amp;/g, "&"))]); } catch (e) {} }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} }
  if (!results.length) console.log("Chrome page measurement — SKIPPED (no Playwright, no Chrome)");
  else { console.log("# Chrome page measurement (8.5×11, overflow hidden)");
    results.forEach(([l, r]) => ok(l + ": all " + r.n + " of the unit's pages measured, none clips", r.n === (l === "Pre-K, first week" ? 2 : 8) && !r.b.length, r.n + " " + r.b.slice(0, 4).join("; "))); }
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log("  FAIL- threw: " + (e && e.stack || e)); process.exit(1); });
