// 🎨 VISKID (her yes 2026-10-18: "write the one-line fix so Mastery HQ shows the Set Visual pop-up again"). Since the
// 9/16 retirement the pop-up was only drawn on the retired Mastery Admin page, so tapping a card's picture in Mastery
// HQ did nothing. Now the HQ deck page draws it, and the pop-up remembers WHOSE card it is: the HQ kid, not the
// Mastery tab's kid — a Lincoln-deck picture never lands on Julian. Runs the real functions over a stubbed db.
// Run: node test_hq_set_visual.js
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond, d) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (d ? "  → " + d : "")); } }
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("missing " + a); return src.slice(i, j); };
const fnSrc = name => cut("function " + name + "(", "\n}\n") + "\n}\n";

// ── wiring ──
const deckPage = fnSrc("_mhqRenderDeckPage");
const iAdd = deckPage.indexOf("_mhqDeckAddHtml(kid,deck)"), iVis = deckPage.indexOf("mastAdminVisualHtml()");
ok("HQ deck page draws the Set Visual pop-up, after the Add box", iAdd > 0 && iVis > iAdd);
const bank = fnSrc("mastAdminBankCatHtml");
const opens = bank.split("mastVisEditOpen(").slice(1).map(s => s.slice(0, s.indexOf(")\"")));
ok("all three card buttons open the pop-up", opens.length === 3, opens.length);
ok("…and each passes the card's kid", opens.every(o => /,\\''\+masteryKid\+'\\'$/.test(o)), opens.join(" | "));
ok("retired page still draws it too", /h\+=mastAdminVisualHtml\(\);/.test(fnSrc("renderMastAdmin")));

// ── run the real pop-up functions ──
function load() {
  const G = { writes: [], puts: [], re: 0 };
  const db = { ref(p) { return { update(v) { G.writes.push([p, v]); } }; } };
  const fn = new Function("G", "db", `
    let masteryKid="julian", mastVisEditKey=null, mastBankEmojiOpen=false, mastBankEmojiTab="", mastAdminLocal={};
    let masteryData={ julian:[{prompt:"T-Rex",subject:"Dinos",emoji:"🦖"}], julian_visuals:{"Dinos_T-Rex":"🦖"},
                      lincoln:[{prompt:"Beaker",subject:"Lab"}], lincoln_visuals:{"Lab_Beaker":{imageUrl:"https://x/old.jpg"}} };
    const unitStudies={}; const HA_LS={setItem(){}};
    const MAST_CAT_EMOJI_MAP={}, MAST_EMOJI_PAL={Animals:"🐶🐱"}, MAST_ANIMAL_EMOJI={};
    function mastDrillSettings(){ return {}; } function mastDefKeyOk(){ return true; }
    function _mastRe(){ G.re++; } function alert(m){ G.alert=m; }
    function mastPutCards(kid,items,ch){ G.puts.push([kid,ch[0]]); }
    function mastCompressImg(){ return Promise.resolve("data:image/jpeg;base64,AAA="); }
    function picStore(){ return Promise.resolve("https://firebasestorage.googleapis.com/new.jpg"); }
    ${fnSrc("mastGetVisual")}
    ${fnSrc("mastSetVisual")}
    ${fnSrc("mastVisEditOpen")}
    ${fnSrc("mastVisEditSet")}
    ${fnSrc("mastVisEditUpload")}
    ${fnSrc("mastAdminVisualHtml")}
    return { mastVisEditOpen, mastVisEditSet, mastVisEditUpload, mastAdminVisualHtml,
      get key(){ return mastVisEditKey; }, get kid(){ return masteryKid; }, get data(){ return masteryData; } };`);
  const api = fn(G, db); api.G = G; return api;
}

(async () => {
  // Mastery tab is on Julian; Mom is on LINCOLN's deck in HQ.
  let a = load();
  a.mastVisEditOpen("Lab", "Beaker", "lincoln");
  ok("pop-up opens for Lincoln's card", a.key && a.key.kid === "lincoln" && a.G.re === 1);
  const html = a.mastAdminVisualHtml();
  ok("pop-up is drawn, with Upload Photo", /mast-vis-overlay/.test(html) && /Upload Photo Instead/.test(html));
  ok("…showing LINCOLN's current picture, not Julian's", /https:\/\/x\/old\.jpg/.test(html) && !/🦖<\/div>/.test(html));
  ok("drawing it leaves the Mastery tab on Julian", a.kid === "julian");

  a.mastVisEditSet("🧪");
  ok("emoji saves to mastery/lincoln_visuals (one key)", a.G.writes.length === 1 && a.G.writes[0][0] === "mastery/lincoln_visuals" && a.G.writes[0][1]["Lab_Beaker"] === "🧪", JSON.stringify(a.G.writes));
  ok("…and on Lincoln's card", a.G.puts.length === 1 && a.G.puts[0][0] === "lincoln" && a.G.puts[0][1].emoji === "🧪");
  ok("Julian's picture untouched", a.data.julian_visuals["Dinos_T-Rex"] === "🦖" && a.data.julian[0].emoji === "🦖");
  ok("Mastery tab still on Julian, pop-up closed", a.kid === "julian" && a.key === null);

  a = load();
  a.mastVisEditOpen("Lab", "Beaker", "lincoln");
  a.mastVisEditUpload({ size: 1000 }); await new Promise(r => setTimeout(r, 5));
  ok("photo saves to Lincoln's visual as the Storage link", a.G.writes.length === 1 && a.G.writes[0][0] === "mastery/lincoln_visuals" && a.G.writes[0][1]["Lab_Beaker"].imageUrl === "https://firebasestorage.googleapis.com/new.jpg");
  ok("…and on Lincoln's card; Julian untouched; tab still Julian", a.G.puts[0][0] === "lincoln" && a.G.puts[0][1].imageUrl && a.data.julian[0].emoji === "🦖" && a.kid === "julian");

  // The Mastery tab's own path (no kid passed) still uses the tab's kid, as before.
  a = load();
  a.mastVisEditOpen("Dinos", "T-Rex");
  a.mastVisEditSet("🦕");
  ok("no kid passed → the Mastery tab's kid, as before", a.G.writes[0][0] === "mastery/julian_visuals" && a.G.puts[0][0] === "julian");

  ok("🔀 not used", src.indexOf("🔀") < 0);
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
