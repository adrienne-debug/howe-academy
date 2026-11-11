/*
 * Node tests — UNITPICS_CREDIT: 📷 a card's extra pictures + who took each one (her words 2026-11-11: "go on the website
 * that I attach and get the additional pictures for each of the frogs and toads and the snakes of North Carolina and add
 * them to those units"). Additive beside UNITMULTIPIC: `more` stays URL strings; credits live in visuals/<key>/moreBy.
 *   1 · the block exists, after UNITMULTIPIC, and every surface still resolves the same main picture
 *   2 · credits: keyed by the picture's URL, read defensively (no credit → no line), main credit falls back to `credit`
 *   3 · the 📷 +N chip shows only when the card has extras (not for an emoji, a lone photo, or a kid's own override)
 *   4 · the gallery: main first, then extras, a credit line under each when known, never the card's name or its source page
 *   5 · the study flip card and the day card carry the chip; the gallery opens, steps ◀ ▶ (wrapping), closes on ✕ / Esc
 *   6 · Mom's "Photo by" on ＋ another picture → Save writes only visuals/<key>/moreBy/<k> inside UNITMULTIPIC's one update
 *   7 · no whole-node set, no timers (no autoplay), reduced motion respected, no family names in the block
 * Runs the REAL code sliced from index.html.   run:  node test_unit_pics_credit.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
function block(n) { const a = src.indexOf("// " + n + "_START"), b = src.indexOf("// " + n + "_END"); if (a < 0 || b < a) throw new Error(n + " block missing"); return src.slice(a, b); }
const BLOCK = block("UNITPICS_CREDIT"), MULTI = block("UNITMULTIPIC"), UNITPIC = block("UNITPIC");

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

// a tiny DOM: enough for the gallery overlay and the card sheet's inputs
const els = {}; const docListeners = {};
function mkEl(tag) { const e = { tag, id: "", style: {}, attrs: {}, innerHTML: "", value: "", listeners: {},
  setAttribute(k, v) { this.attrs[k] = v; }, addEventListener(t, f) { this.listeners[t] = f; },
  remove() { if (els[this.id] === this) delete els[this.id]; } };
  Object.defineProperty(e, "cssText", { set(v) { e.style.cssText = v; } }); return e; }
const document = { body: { appendChild(e) { if (e.id) els[e.id] = e; } }, createElement: mkEl, getElementById: id => els[id] || null,
  addEventListener(t, f) { docListeners[t] = f; }, removeEventListener(t, f) { if (docListeners[t] === f) delete docListeners[t]; } };

const writes = []; let dry = false;
const mkDb = () => ({ ref: p => ({ set: v => writes.push({ p, op: "set", v: JSON.parse(JSON.stringify(v === undefined ? null : v)) }),
  update: v => writes.push({ p, op: "update", v: JSON.parse(JSON.stringify(v)) }) }) });
const M = "https://example.test/main.jpg", X = [1, 2, 3, 4].map(n => "https://example.test/x" + n + ".jpg");
const DECK = "NC Snakes", NAME = "Eastern Kingsnake", KEY = DECK + "_" + NAME;
const ctx = { console, Object, Array, String, JSON, Math, Date, encodeURIComponent, decodeURIComponent, alert: () => {}, document,
  masteryKid: "k1", masteryData: { k1: [] }, unitEdit: null, db: mkDb(), _dryRun: () => dry, momHere: () => true,
  renderAll: () => {}, renderUnits: () => {}, _unitEditOverlay: () => {}, unitEditClose() { ctx.unitEdit = null; } };
function fresh() {
  ctx.unitStudies = { u1: { id: "u1", decks: [{ key: DECK, cards: [{ name: NAME, order: 1 }, { name: "Copperhead", order: 2 }, { name: "Corn Snake", order: 3 }, { name: "Racer", order: 4 }] }],
    visuals: { [KEY]: { imageUrl: M, credit: "Wikipedia · Eastern kingsnake", more: X.slice() },
      [DECK + "_Copperhead"]: { imageUrl: "https://example.test/copper.jpg" }, [DECK + "_Corn Snake"]: "🐍" } } };
  writes.length = 0; dry = false; ctx.unitEdit = null; ctx.masteryData = { k1: [] };
}
fresh(); vm.createContext(ctx);
vm.runInContext(MULTI + "\n" + BLOCK + "\n" + UNITPIC + "\n" + ["mastGetVisual", "unitEditSave"].map(slice).join("\n"), ctx);
const run = c => vm.runInContext(c, ctx);
const U = () => ctx.unitStudies.u1;
// give the main card credits for x1..x3 (x4 has none)
function credit() { const mb = {}; [["x1", "JD Willson"], ["x2", "RW Van Devender"], ["x3", "Todd Pierson"]].forEach(([n, by], i) => {
  mb[run("unitPicCreditKey(" + JSON.stringify(X[i]) + ")")] = { by, src: "https://herps.example/" + n + "/" }; }); U().visuals[KEY].moreBy = mb; }

console.log("1 · the block, and the main picture everywhere");
{ ok("UNITPICS_CREDIT sits right after UNITMULTIPIC, before mastGetVisual",
    src.indexOf("// UNITPICS_CREDIT_START") > src.indexOf("// UNITMULTIPIC_END") && src.indexOf("// UNITPICS_CREDIT_END") < src.indexOf("function mastGetVisual("));
  ok("cites her words and the date", /2026-11-11/.test(BLOCK) && /additional pictures/.test(BLOCK));
  ok("_mastVisNorm: a string is still an emoji", JSON.stringify(run("_mastVisNorm('🐍','live')")) === JSON.stringify({ emoji: "🐍", from: "live" }));
  ok("_mastVisNorm: {imageUrl} is still that picture", JSON.stringify(run("_mastVisNorm({imageUrl:'" + M + "'},'live')")) === JSON.stringify({ img: M, from: "live" }));
  credit();
  ok("_mastVisNorm: {imageUrl, more, moreBy} resolves to the same main picture", JSON.stringify(run("_mastVisNorm(unitStudies.u1.visuals[" + JSON.stringify(KEY) + "],'live')")) === JSON.stringify({ img: M, from: "live" }));
  ok("mastLiveImg (drill, study, games, print) still shows the main picture", run("mastLiveImg({subject:" + JSON.stringify(DECK) + ",prompt:" + JSON.stringify(NAME) + "})") === M);
  ok("UNITMULTIPIC's list is untouched by moreBy (5 URL strings, main first)", JSON.stringify(run("unitPicsOf(unitStudies.u1.visuals[" + JSON.stringify(KEY) + "])")) === JSON.stringify([M].concat(X)));
  ok("the notebook / Royal Line portrait reader is unchanged", /if\(v\.imageUrl\) return \{img:v\.imageUrl\}/.test(slice("_unitPortrait"))); }

console.log("2 · credits");
{ const k1 = run("unitPicCreditKey('" + X[0] + "')"), k1b = run("unitPicCreditKey('" + X[0] + "')"), k2 = run("unitPicCreditKey('" + X[1] + "')");
  ok("a credit key is stable per URL and differs between URLs", k1 === k1b && k1 !== k2);
  ok("a credit key is never all digits (RTDB would turn moreBy into an array)", /^p[0-9a-z]+$/.test(k1) && !/^\d+$/.test(k1));
  ok("an extra's credit comes from moreBy", JSON.stringify(run("unitPicCredit(unitStudies.u1.visuals[" + JSON.stringify(KEY) + "],'" + X[0] + "')")) === JSON.stringify({ by: "JD Willson", src: "https://herps.example/x1/" }));
  ok("the main picture falls back to its own credit", run("unitPicCredit(unitStudies.u1.visuals[" + JSON.stringify(KEY) + "],'" + M + "').by") === "Wikipedia · Eastern kingsnake");
  ok("no credit → null", run("unitPicCredit(unitStudies.u1.visuals[" + JSON.stringify(KEY) + "],'" + X[3] + "')") === null);
  const odd = ["null", "'🐍'", "{imageUrl:'a'}", "{imageUrl:'a',moreBy:'junk'}", "{imageUrl:'a',moreBy:{[unitPicCreditKey('b')]:{by:42}}}",
    "{imageUrl:'a',moreBy:{[unitPicCreditKey('b')]:'Bob'}}", "{imageUrl:'a',moreBy:{[unitPicCreditKey('b')]:{by:'   '}}}", "{imageUrl:'a',credit:{x:1}}"];
  ok("odd shapes never throw and give no credit", odd.every(o => run("unitPicCredit(" + o + ",'b')") === null)); }

console.log("3 · the chip");
{ const v = "unitStudies.u1.visuals";
  ok("4 extras → 📷 +4", /📷 \+4</.test(run("unitPicsChipHtml(" + v + "[" + JSON.stringify(KEY) + "]," + JSON.stringify(KEY) + ")")));
  ok("a lone photo → no chip", run("unitPicsChipHtml(" + v + "['NC Snakes_Copperhead'],'NC Snakes_Copperhead')") === "");
  ok("an emoji → no chip", run("unitPicsChipHtml(" + v + "['NC Snakes_Corn Snake'],'x')") === "");
  ok("no picture → no chip", run("unitPicsChipHtml(null,'x')") === "" && run("unitPicsChipHtml(undefined,'x')") === "");
  U().visuals[DECK + "_Racer"] = { imageUrl: "https://example.test/r.jpg", more: ["https://example.test/r2.jpg"] };
  ok("1 extra → 📷 +1, labelled in the singular", /📷 \+1</.test(run("unitPicsChipHtml(" + v + "['NC Snakes_Racer'],'NC Snakes_Racer')")) && /1 more picture"/.test(run("unitPicsChipHtml(" + v + "['NC Snakes_Racer'],'NC Snakes_Racer')")));
  const chip = run("unitPicsChipHtml(" + v + "[" + JSON.stringify(KEY) + "]," + JSON.stringify(KEY) + ")");
  ok("the chip stops the tap (the flip card underneath doesn't flip)", /event\.stopPropagation\(\);unitGalleryOpen\(/.test(chip));
  ok("the chip never carries the card's name, not even in its onclick", chip.indexOf("Kingsnake") < 0 && chip.indexOf("Snakes") < 0);
  ok("unitPicsVisualFor finds the stored visual (not the 🎲 pick)", run("unitPicsVisualFor(" + JSON.stringify(DECK) + "," + JSON.stringify(NAME) + ")") === U().visuals[KEY]);
  U().mixPics = true; run("unitPicNewSitting('s1')");
  ok("…even with 🎲 on", run("unitPicsVisualFor(" + JSON.stringify(DECK) + "," + JSON.stringify(NAME) + ")") === U().visuals[KEY]);
  delete U().mixPics;
  ctx.masteryData.k1_visuals = { [KEY]: { imageUrl: "https://example.test/own.jpg" } };
  ok("a kid's own picture override → no unit extras, no chip", run("unitPicsVisualFor(" + JSON.stringify(DECK) + "," + JSON.stringify(NAME) + ")") === null);
  delete ctx.masteryData.k1_visuals;
  const apos = "Fowler's Toad"; U().visuals["NC Frogs_" + apos] = { imageUrl: "https://example.test/f.jpg", more: ["https://example.test/f2.jpg"] };
  const fc = run("unitPicsChipHtml(unitStudies.u1.visuals[" + JSON.stringify("NC Frogs_" + apos) + "]," + JSON.stringify("NC Frogs_" + apos) + ")");
  ok("a name with an apostrophe makes a safe onclick", fc.indexOf("Fowler") < 0 && /unitGalleryOpen\('g[0-9a-z]+'\)/.test(fc)); }

console.log("4 · the gallery markup");
{ const pics = run("unitPicsGallery(unitStudies.u1.visuals[" + JSON.stringify(KEY) + "])");
  ok("main first, then the 4 extras", pics.length === 5 && pics[0].url === M && X.every((x, i) => pics[i + 1].url === x));
  ok("each carries its credit (empty when unknown)", pics[1].by === "JD Willson" && pics[3].by === "Todd Pierson" && pics[4].by === "");
  const h0 = run("unitGalleryHtml(unitPicsGallery(unitStudies.u1.visuals[" + JSON.stringify(KEY) + "]),0)");
  ok("picture 1 of 5: the main picture + its credit", h0.indexOf('src="' + M + '"') > 0 && /Photo by Wikipedia · Eastern kingsnake/.test(h0) && /1 \/ 5/.test(h0));
  const h2 = run("unitGalleryHtml(unitPicsGallery(unitStudies.u1.visuals[" + JSON.stringify(KEY) + "]),2)");
  ok("picture 3 of 5: the second extra + 'Photo by RW Van Devender'", h2.indexOf('src="' + X[1] + '"') > 0 && /📷 Photo by RW Van Devender/.test(h2) && /3 \/ 5/.test(h2));
  const h4 = run("unitGalleryHtml(unitPicsGallery(unitStudies.u1.visuals[" + JSON.stringify(KEY) + "]),4)");
  ok("no credit → no credit line", h4.indexOf("Photo by") < 0 && h4.indexOf("ug-by") < 0);
  ok("◀ ▶ and ✕ are there", /unitGalleryGo\(-1\)/.test(h0) && /unitGalleryGo\(1\)/.test(h0) && /unitGalleryClose\(\)/.test(h0));
  ok("never the card's name, never the source page (it would give the answer)", [h0, h2, h4].every(h => h.indexOf("Kingsnake") < 0 && h.indexOf("herps.example") < 0 && h.indexOf("<a ") < 0));
  ok("prefers-reduced-motion turns the fade off", /@media \(prefers-reduced-motion: reduce\)\{#unit-gallery img\{transition:none\}\}/.test(h0));
  const hx = run("unitGalleryHtml([{url:'a\"><script>',by:'<b>x</b>'},{url:'b',by:''}],0)");
  ok("URLs and credits are escaped", hx.indexOf("<script>") < 0 && hx.indexOf("<b>x</b>") < 0); }

console.log("5 · where the chip shows, and the gallery working");
{ const mpc = slice("mstPicCardHtml"), dcd = slice("dcDayHTML"), dcf = slice("dcFeature");
  ok("study flip card: the chip sits on the front picture", /mast-slide-img" style="position:relative">'\+img\+\(typeof unitPicsChipHtml==="function"\?unitPicsChipHtml\(unitPicsVisualFor\(card\.deck/.test(mpc));
  ok("study flip card: the back is untouched (no chip there)", (mpc.match(/unitPicsChipHtml\(/g) || []).length === 1);
  ok("day card: dcFeature hands back the deck, the figure carries the chip", /deck:c\.deck/.test(dcf) && /unitPicsChipHtml\(\(\(u&&u\.visuals\)\|\|\{\}\)\[f\.deck\+"_"\+f\.caption\]/.test(dcd));
  // render the study card for real
  const sctx = Object.assign(ctx, { mastCatFace: () => "name", mastGetDefAudio: () => null, ttsFlipAttrs: () => "", mstFlipped: false,
    mstEsc: s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"), mstFlipBtn: () => "" });
  vm.runInContext(mpc, sctx);
  const card = run("mstPicCardHtml({name:'Snakes'},{name:" + JSON.stringify(NAME) + ",deck:" + JSON.stringify(DECK) + "},'" + M + "','def','')");
  const front = card.slice(0, card.indexOf("mast-flip-back"));
  ok("rendered study card: 📷 +4 on the front", /📷 \+4/.test(front));
  ok("rendered study card: the 'name' face still hides the name on the front", front.indexOf(NAME) < 0);
  const lone = run("mstPicCardHtml({name:'Snakes'},{name:'Copperhead',deck:" + JSON.stringify(DECK) + "},'https://example.test/copper.jpg','','')");
  ok("rendered study card with one picture: no chip, the same markup as before apart from position:relative", lone.indexOf("📷") < 0);
  // open → step → close
  const gid = run("unitPicsChipHtml(unitStudies.u1.visuals[" + JSON.stringify(KEY) + "]," + JSON.stringify(KEY) + ")").match(/unitGalleryOpen\('(g[0-9a-z]+)'\)/)[1];
  run("unitGalleryOpen('" + gid + "')");
  const g = els["unit-gallery"];
  ok("tap → a full-screen gallery opens on the main picture", !!g && /position:fixed;inset:0/.test(g.style.cssText) && g.innerHTML.indexOf('src="' + M + '"') > 0);
  run("unitGalleryGo(1)"); ok("▶ → the first extra", g.innerHTML.indexOf('src="' + X[0] + '"') > 0 && /Photo by JD Willson/.test(g.innerHTML));
  run("unitGalleryGo(-1);unitGalleryGo(-1)"); ok("◀ from the main picture wraps to the last", g.innerHTML.indexOf('src="' + X[3] + '"') > 0 && /5 \/ 5/.test(g.innerHTML));
  docListeners.keydown({ key: "ArrowRight" }); ok("→ key steps too", /1 \/ 5/.test(g.innerHTML));
  g.listeners.touchstart({ touches: [{ clientX: 300 }] }); g.listeners.touchend({ changedTouches: [{ clientX: 200 }] });
  ok("a swipe left → the next picture", /2 \/ 5/.test(g.innerHTML));
  let stopped = false; g.listeners.click({ stopPropagation() { stopped = true; } }); ok("a tap inside never reaches the card underneath", stopped);
  docListeners.keydown({ key: "Escape" }); ok("Esc closes it and lets go of the keys", !els["unit-gallery"] && !docListeners.keydown);
  run("unitGalleryOpen('nope')"); ok("an unknown key opens nothing", !els["unit-gallery"]);
  ok("the gallery writes nothing", writes.length === 0); }

console.log("6 · Mom's 'Photo by' → visuals/<key>/moreBy only, inside the one update");
{ fresh();
  const sheet = run("unitEdit={unitId:'u1',deckKey:" + JSON.stringify(DECK) + ",order:1,newImg:null}; unitMorePicsHtml(unitStudies.u1," + JSON.stringify(KEY) + ",'" + M + "')");
  ok("the card sheet shows ✕ / ★ and no ＋ when the card is full (4 extras)", sheet.indexOf("unit-pic-by") < 0 && /5 pictures/.test(sheet));
  run("unitMorePicDrop(4)");   // room for one more
  const sheet2 = run("unitMorePicsHtml(unitStudies.u1," + JSON.stringify(KEY) + ",'" + M + "')");
  ok("with room: ＋ another picture + an optional 'Photo by' line", /＋ another picture/.test(sheet2) && /id="unit-pic-by"/.test(sheet2) && /Photo by \(optional\)/.test(sheet2));
  els["unit-pic-by"] = { id: "unit-pic-by", value: "  Kevin Stohlgren  " };
  ok("what Mom typed is read trimmed", run("unitPicCreditTyped()") === "Kevin Stohlgren");
  const NEW = "https://example.test/mom.jpg";
  run("if(unitMorePicPush('" + NEW + "')) unitPicCreditStage('" + NEW + "',unitPicCreditTyped())");
  delete els["unit-pic-by"];
  run("unitEditSave()");
  const kN = run("unitPicCreditKey('" + NEW + "')");
  ok("ONE update, on unitStudies/u1", writes.length === 1 && writes[0].op === "update" && writes[0].p === "unitStudies/u1", writes);
  const up = writes[0] && writes[0].v || {};
  ok("…writing more (UNITMULTIPIC) and exactly visuals/<key>/moreBy/<k> for the credit", JSON.stringify(Object.keys(up).sort()) === JSON.stringify(["visuals/" + KEY + "/more", "visuals/" + KEY + "/moreBy/" + kN].sort()), Object.keys(up));
  ok("…the credit is {by}", JSON.stringify(up["visuals/" + KEY + "/moreBy/" + kN]) === JSON.stringify({ by: "Kevin Stohlgren" }));
  ok("…and `more` is still URL strings", Array.isArray(up["visuals/" + KEY + "/more"]) && up["visuals/" + KEY + "/more"].every(p => typeof p === "string") && up["visuals/" + KEY + "/more"].indexOf(NEW) >= 0);
  ok("the screen copy has the credit at once", U().visuals[KEY].moreBy && U().visuals[KEY].moreBy[kN].by === "Kevin Stohlgren");
  ok("the main credit is not touched", !Object.keys(up).some(k => /\/credit$|\/imageUrl$/.test(k)) && U().visuals[KEY].credit === "Wikipedia · Eastern kingsnake");
  // no credit typed → the write is exactly what UNITMULTIPIC alone writes
  fresh(); run("unitEdit={unitId:'u1',deckKey:" + JSON.stringify(DECK) + ",order:1,newImg:null}; unitMorePicDrop(4); unitMorePicPush('" + NEW + "'); unitEditSave()");
  ok("no 'Photo by' → only visuals/<key>/more (UNITMULTIPIC's own write)", writes.length === 1 && JSON.stringify(Object.keys(writes[0].v)) === JSON.stringify(["visuals/" + KEY + "/more"]), writes);
  // a card with no visual yet: UNITMULTIPIC writes the card whole → the credit rides inside it (no overlapping paths)
  const pw = run("unitPicCreditPlan('NC Snakes_Racer',unitPicsPlan('NC Snakes_Racer',null,null,['https://example.test/r.jpg','https://example.test/r2.jpg']),{'https://example.test/r2.jpg':'Eric Stine','https://example.test/gone.jpg':'Nobody'})");
  const pk = Object.keys(pw.up);
  ok("a new card: one path, the card object, with moreBy inside it", pk.length === 1 && pk[0] === "visuals/NC Snakes_Racer" && pw.up[pk[0]].moreBy[run("unitPicCreditKey('https://example.test/r2.jpg')")].by === "Eric Stine");
  ok("a credit for a picture no longer on the card is dropped", JSON.stringify(pw.up[pk[0]]).indexOf("Nobody") < 0);
  ok("no plan → nothing added", run("unitPicCreditPlan('k',null,{a:'b'})") === null);
  // a "Dr." front: the credit path uses the same coded key UNITMULTIPIC uses
  ctx.haKey = k => String(k).replace(/\./g, "%2E");
  const pw2 = run("unitPicCreditPlan('D_Dr. Who',{up:{'visuals/D_Dr%2E Who/more':['b']},vis:{imageUrl:'a',more:['b']}},{b:'Ann'})");
  ok("a dotted key uses the coded path like the rest of the save", Object.keys(pw2.up).indexOf("visuals/D_Dr%2E Who/moreBy/" + run("unitPicCreditKey('b')")) >= 0, Object.keys(pw2.up));
  delete ctx.haKey;
  // dry run
  fresh(); dry = true; run("unitEdit={unitId:'u1',deckKey:" + JSON.stringify(DECK) + ",order:1,newImg:null}; unitMorePicDrop(4); unitMorePicPush('" + NEW + "'); unitPicCreditStage('" + NEW + "','A'); unitEditSave()");
  ok("dry run: nothing written", writes.length === 0);
  ok("the add path stages the credit it read when the file was picked", /const _ue=unitEdit, _by=\(typeof unitPicCreditTyped==="function"\)\?unitPicCreditTyped\(\):""/.test(slice("unitMorePicAdd")) && /unitPicCreditStage\(url,_by\)/.test(slice("unitMorePicAdd"))); }

console.log("7 · safety");
{ ok("no .set( anywhere in the block (no whole-node writes)", BLOCK.indexOf(".set(") < 0);
  ok("no database call in the block at all (writes go through UNITMULTIPIC's one update)", !/\bdb\./.test(BLOCK.replace(/^\s*\/\/.*$/gm, "")));
  ok("no timers → no autoplay", !/setInterval|setTimeout|requestAnimationFrame/.test(BLOCK));
  ok("no family or kid names in the block", !/Lincoln|Ellis|Lucy|Julian|Adrienne|Howe/.test(BLOCK));
  ok("no 🔀 in the block", BLOCK.indexOf("\u{1F500}") < 0); }

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
