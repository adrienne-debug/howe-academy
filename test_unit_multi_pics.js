/*
 * Node tests — UNITMULTIPIC: 🎲 several pictures per unit card (her ask 2026-11-08: add up to 5 pictures to one card,
 * "randomly picked to make it a little harder for the kid", behind a switch that defaults to the first picture).
 *   1 · switch off → the default picture only, always, even with extras saved
 *   2 · switch on  → one of all the pictures; the same pick for a card all sitting; other sittings pick others
 *   3 · a sitting ends after a long gap with no picture asked for; a fresh study start begins a new one
 *   4 · a unit with no extras returns the very same visual object (byte-identical), switch on or off
 *   5 · the card sheet writes exactly visuals/<key>/more (and imageUrl + credit only when ★ moves the default)
 *   6 · the switch writes exactly unitStudies/<id>/mixPics; dry run writes nothing
 *   7 · the sheet shows ✕ / ★ / ＋ another picture; at most 5 pictures; no family or kid names in the block
 * Runs the REAL code sliced from index.html.   run:  node test_unit_multi_pics.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
const a = src.indexOf("// UNITMULTIPIC_START"), b = src.indexOf("// UNITMULTIPIC_END");
if (a < 0 || b < a) throw new Error("UNITMULTIPIC block missing");
const BLOCK = src.slice(a, b);

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

const P0 = "https://example.test/king_0.jpg", EXTRA = [1, 2, 3, 4].map(n => "https://example.test/king_" + n + ".jpg");
const KEY = "Snakes_Eastern Kingsnake", KEY2 = "Snakes_Copperhead", KEY3 = "Snakes_Corn Snake";
const writes = [];
function mkDb() { return { ref: p => ({ set: v => writes.push({ p, op: "set", v: JSON.parse(JSON.stringify(v === undefined ? null : v)) }),
  update: v => writes.push({ p, op: "update", v: JSON.parse(JSON.stringify(v)) }) }) }; }
let dry = false;
const ctx = { console, Object, Array, String, JSON, Math, Date, alert: () => {}, masteryKid: "k1", unitEdit: null,
  masteryData: { k1: [] }, db: mkDb(), _dryRun: () => dry, momHere: () => true, renderAll: () => {}, renderUnits: () => {},
  document: { getElementById: () => null }, _unitEditOverlay: () => {} };
function fresh() {
  ctx.unitStudies = { u1: { id: "u1", decks: [{ key: "Snakes", cards: [{ name: "Eastern Kingsnake", order: 1 }, { name: "Copperhead", order: 2 }, { name: "Corn Snake", order: 3 }] }],
    visuals: { [KEY]: { imageUrl: P0, credit: "Wikipedia", more: EXTRA.slice() }, [KEY2]: { imageUrl: "https://example.test/copper.jpg", credit: "Wikipedia" }, [KEY3]: "🐍" } } };
  writes.length = 0; dry = false; ctx.unitEdit = null;
}
fresh();
vm.createContext(ctx);
vm.runInContext(BLOCK + "\n" + ["mastGetVisual", "unitEditSave", "unitEditClose"].map(slice).join("\n"), ctx);
const run = c => vm.runInContext(c, ctx);
const U = () => ctx.unitStudies.u1;
const ALL = [P0].concat(EXTRA);
const pic = (k) => { const v = run("mastGetVisual('Snakes'," + JSON.stringify(k.split("_")[1]) + ")"); return v && v.imageUrl; };

console.log("1 · switch off → the default only");
{ let allDefault = true;
  for (let s = 0; s < 30; s++) { run("unitPicNewSitting('off" + s + "')"); if (pic(KEY) !== P0) allDefault = false; }
  ok("30 sittings, extras saved, switch off → always the first picture", allDefault);
  ok("off returns the stored visual itself (credit kept)", run("mastGetVisual('Snakes','Eastern Kingsnake')") === U().visuals[KEY]); }

console.log("2 · switch on → a random pick, steady within a sitting");
{ U().mixPics = true;
  run("unitPicNewSitting('s-a')"); const first = pic(KEY); let steady = true;
  for (let i = 0; i < 40; i++) if (pic(KEY) !== first) steady = false;
  ok("the pick is one of the card's 5 pictures", ALL.indexOf(first) >= 0, first);
  ok("40 redraws in one sitting → the same picture (no flicker)", steady);
  const seen = new Set(); let inSet = true;
  for (let s = 0; s < 60; s++) { run("unitPicNewSitting('s" + s + "')"); const p = pic(KEY); seen.add(p); if (ALL.indexOf(p) < 0) inSet = false; }
  ok("60 sittings → every pick is from the card's pictures", inSet);
  ok("60 sittings → the picks vary (" + seen.size + " different pictures)", seen.size >= 3, [...seen]);
  ok("…and the default is still among them", seen.has(P0));
  ok("a picked extra carries no credit (the credit is the default's)", (() => { for (let s = 0; s < 60; s++) { run("unitPicNewSitting('c" + s + "')"); const v = run("mastGetVisual('Snakes','Eastern Kingsnake')"); if (v.imageUrl !== P0) return !("credit" in v); } return false; })());
  ok("two cards are picked independently (the seed is the card key)", run("(function(){ const v={imageUrl:'x',more:['y','z']}; let d=0; for(let s=0;s<30;s++){ unitPicNewSitting('k'+s); if(unitPickVisual(v,'A').imageUrl!==unitPickVisual(v,'B').imageUrl) d++; } return d; })()") > 0);
  delete U().mixPics; }

console.log("3 · what a sitting is");
{ const t0 = 1e12;
  const id1 = run("unitPicSitting(" + t0 + ")"), id2 = run("unitPicSitting(" + (t0 + 60000) + ")"), id3 = run("unitPicSitting(" + (t0 + 60000 + 14 * 60000) + ")");
  ok("pictures asked for within 15 min of each other → one sitting", id1 === id2 && id2 === id3);
  const id4 = run("unitPicSitting(" + (t0 + 60000 + 14 * 60000 + 15 * 60000 + 1) + ")");
  ok("a gap of over 15 min with no picture asked for → a new sitting", id4 !== id3);
  const st = slice("mstStart");
  ok("a fresh study start (mstStart) begins a new sitting", /mstState=state;[^\n]*\n\s*if\(typeof unitPicNewSitting==="function"\) unitPicNewSitting\(\);/.test(st));
  ok("…a restored sitting does not", st.indexOf("unitPicNewSitting") > st.indexOf("mstRestoreSitting(")); }

console.log("4 · a unit with no extras is byte-identical");
{ U().mixPics = true; const v2 = U().visuals[KEY2];
  ok("one picture + switch on → the very same object back", run("mastGetVisual('Snakes','Copperhead')") === v2);
  ok("an emoji visual is untouched", run("mastGetVisual('Snakes','Corn Snake')") === "🐍");
  ok("unitPickVisual of a one-picture visual is that visual", run("(function(){ const v={imageUrl:'q'}; return unitPickVisual(v,'k')===v; })()"));
  delete U().mixPics;
  const lk = src.match(/if\(uv&&uv\[key\]\) return [^\n]*/)[0];
  ok("the lookup only picks when the unit's mixPics is on", /unitStudies\[uid\]\.mixPics&&typeof unitPickVisual==="function"\)\?unitPickVisual\(uv\[key\],key\):uv\[key\]/.test(lk));
  // the card sheet, nothing staged → no write at all; a new photo on a one-picture card → the old write's data
  fresh(); ctx.unitEdit = { unitId: "u1", deckKey: "Snakes", order: 2, newImg: null };
  run("unitEditSave()"); ok("save with nothing changed → no picture write", writes.length === 0, writes);
  fresh(); ctx.unitEdit = { unitId: "u1", deckKey: "Snakes", order: 2, newImg: "https://example.test/new.jpg" };
  run("unitEditSave()");
  ok("new photo, no extras → visuals/<key> = {imageUrl} (the same data as before)", writes.length === 1 && writes[0].p === "unitStudies/u1" &&
    JSON.stringify(writes[0].v) === JSON.stringify({ ["visuals/" + KEY2]: { imageUrl: "https://example.test/new.jpg" } }), writes);
  ok("…and in memory the same visual as before", JSON.stringify(U().visuals[KEY2]) === JSON.stringify({ imageUrl: "https://example.test/new.jpg" })); }

console.log("5 · the card sheet's writes");
{ fresh(); delete U().visuals[KEY].more; ctx.unitEdit = { unitId: "u1", deckKey: "Snakes", order: 1, newImg: null };
  ok("＋ another picture stages it", run("unitMorePicPush('" + EXTRA[0] + "')") === true && JSON.stringify(ctx.unitEdit.pics) === JSON.stringify([P0, EXTRA[0]]));
  run("unitEditSave()");
  ok("save → ONE update, exactly visuals/<key>/more", writes.length === 1 && writes[0].p === "unitStudies/u1" &&
    JSON.stringify(writes[0].v) === JSON.stringify({ ["visuals/" + KEY + "/more"]: [EXTRA[0]] }), writes);
  ok("…the default and its credit untouched", U().visuals[KEY].imageUrl === P0 && U().visuals[KEY].credit === "Wikipedia" && U().visuals[KEY].more[0] === EXTRA[0]);

  fresh(); ctx.unitEdit = { unitId: "u1", deckKey: "Snakes", order: 1, newImg: null };
  ok("a 6th picture is refused (5 in all)", run("unitMorePicPush('https://example.test/sixth.jpg')") === false && ctx.unitEdit.pics.length === 5);
  ok("the same picture twice is refused", run("unitMorePicPush('" + EXTRA[1] + "')") === false);
  run("unitMorePicDrop(2)"); run("unitEditSave()");
  ok("✕ → exactly visuals/<key>/more, without that picture", writes.length === 1 &&
    JSON.stringify(writes[0].v) === JSON.stringify({ ["visuals/" + KEY + "/more"]: [EXTRA[0], EXTRA[2], EXTRA[3]] }), writes);

  fresh(); ctx.unitEdit = { unitId: "u1", deckKey: "Snakes", order: 1, newImg: null };
  run("unitMorePicStar(3)");
  ok("★ swaps the picture into first place, the old default into its spot", JSON.stringify(ctx.unitEdit.pics) === JSON.stringify([EXTRA[2], EXTRA[0], EXTRA[1], P0, EXTRA[3]]));
  ok("…and the sheet's big photo follows it", ctx.unitEdit.newImg === EXTRA[2]);
  run("unitEditSave()");
  const w = writes[0] && writes[0].v;
  ok("★ save → visuals/<key>/imageUrl + /credit (cleared) + /more, nothing else", writes.length === 1 && writes[0].p === "unitStudies/u1" &&
    JSON.stringify(Object.keys(w).sort()) === JSON.stringify(["visuals/" + KEY + "/credit", "visuals/" + KEY + "/imageUrl", "visuals/" + KEY + "/more"]), writes);
  ok("…the new default and its extras", w["visuals/" + KEY + "/imageUrl"] === EXTRA[2] && w["visuals/" + KEY + "/credit"] === null &&
    JSON.stringify(w["visuals/" + KEY + "/more"]) === JSON.stringify([EXTRA[0], EXTRA[1], P0, EXTRA[3]]));
  ok("switch off after ★ → the new default shows", pic(KEY) === EXTRA[2]);

  fresh(); ctx.unitEdit = { unitId: "u1", deckKey: "Snakes", order: 1, newImg: null };
  run("unitMorePicStar(1)"); run("unitMorePicStar(1)"); run("unitEditSave()");
  ok("★ and ★ back → no write", writes.length === 0, writes);

  fresh(); ctx.unitEdit = { unitId: "u1", deckKey: "Snakes", order: 1, newImg: "https://example.test/replaced.jpg" };
  run("unitEditSave()");
  ok("Change photo on a card with extras → imageUrl + credit only, extras kept", writes.length === 1 &&
    JSON.stringify(writes[0].v) === JSON.stringify({ ["visuals/" + KEY + "/imageUrl"]: "https://example.test/replaced.jpg", ["visuals/" + KEY + "/credit"]: null }) &&
    U().visuals[KEY].more.length === 4, writes);

  fresh(); dry = true; ctx.unitEdit = { unitId: "u1", deckKey: "Snakes", order: 1, newImg: null };
  run("unitMorePicDrop(1)"); run("unitEditSave()");
  ok("dry run → nothing written", writes.length === 0, writes);
  ok("the sheet never writes the whole unit", !/db\.ref\("unitStudies\/"\+unitEdit\.unitId\)\.set/.test(slice("unitEditSave"))); }

console.log("6 · the switch");
{ fresh();
  run("unitToggleMixPics('u1')");
  ok("on → exactly unitStudies/<id>/mixPics = true", writes.length === 1 && writes[0].p === "unitStudies/u1/mixPics" && writes[0].op === "set" && writes[0].v === true && U().mixPics === true, writes);
  run("unitToggleMixPics('u1')");
  ok("off → mixPics cleared (absent = off)", writes.length === 2 && writes[1].p === "unitStudies/u1/mixPics" && writes[1].v === null && !("mixPics" in U()), writes);
  fresh(); dry = true; run("unitToggleMixPics('u1')"); ok("dry run → nothing written", writes.length === 0);
  fresh(); ctx.momHere = () => false; run("unitToggleMixPics('u1')"); ok("not Mom → no change", writes.length === 0 && !U().mixPics); ctx.momHere = () => true;
  const sw = run("unitMixPicsHtml(unitStudies.u1)");
  ok("the switch shows on the unit page, off by default, with one line of help", /🎲 Multiple pictures/.test(sw) && /○ Off/.test(sw) && /at random each sitting/.test(sw) && /1 card with extras/.test(sw));
  ok("the unit page draws the switch", /if\(typeof unitMixPicsHtml==="function"\) h\+=unitMixPicsHtml\(u\);/.test(src)); }

console.log("7 · the sheet");
{ fresh(); ctx.unitEdit = { unitId: "u1", deckKey: "Snakes", order: 1, newImg: null };
  const h = run("unitMorePicsHtml(unitStudies.u1,'" + KEY + "','" + P0 + "')");
  ok("4 extras → 4 ✕ and 4 ★ make default", (h.match(/unitMorePicDrop\(/g) || []).length === 4 && (h.match(/★ make default/g) || []).length === 4);
  ok("5 pictures → no ＋ another picture", !/＋ another picture/.test(h) && /the most one card holds/.test(h));
  ok("switch off → the sheet says only the first picture shows", /Multiple pictures is off/.test(h));
  ctx.unitEdit = { unitId: "u1", deckKey: "Snakes", order: 2, newImg: null };
  const h2 = run("unitMorePicsHtml(unitStudies.u1,'" + KEY2 + "','https://example.test/copper.jpg')");
  ok("one picture → ＋ another picture, through the same upload path", /＋ another picture/.test(h2) && /unitMorePicAdd\(this\)/.test(h2) && /mastCompressImg\(f,420,0\.82\)[^\n]*picStore\(/.test(BLOCK));
  ok("no photo yet → nothing extra (the first one is Add photo)", run("unitMorePicsHtml(unitStudies.u1,'" + KEY3 + "',null)") === "");
  ok("the card sheet draws the extras", /\(typeof unitMorePicsHtml==="function"\?unitMorePicsHtml\(u,key,cur\):""\)/.test(slice("_unitEditOverlay")));
  const names = ["nailuj", "nlocnil", "sille", "ycul", "ewoh", "tlawed", "sirrub", "aras", "eiznek", "werdna", "enneirda"].map(s => s.split("").reverse().join(""));
  ok("no family or kid names in the block", !names.some(n => new RegExp("\\b" + n + "\\b", "i").test(BLOCK)));
  ok("no 🔀 in index.html", src.indexOf("\u{1F500}") < 0); }

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
