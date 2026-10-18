// 🖼 PICSTORE (her yes 2026-10-18): new pictures save to Firebase Storage, not inside the database. Slices the real
// PICSTORE block out of index.html and runs it over a stubbed firebase.storage(): a good upload resolves the https
// link (file under pictures/…, JPEG, a year's cache); every failure — put rejects, link rejects, a hang past the
// timeout (upload cancelled), offline, dry run, no db, no Storage — resolves the ORIGINAL data URL so the picture is
// saved exactly as before; a link passed in is left alone. Then the four pickers: each routes through picStore, the
// Mastery picture lands in the same visual + card spots, a cancelled pick saves nothing, the unit sheet's Save waits
// while a picture uploads, and both Add buttons wait too. Display code is untouched.
// Run: node test_pictures_storage.js
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond, d) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (d ? "  → " + d : "")); } }
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("missing " + a); return src.slice(i, j); };
const fnSrc = name => cut("function " + name + "(", "\n}\n") + "\n}\n";

ok("PICSTORE block present once", src.indexOf("// PICSTORE_START") > 0 && src.indexOf("// PICSTORE_START", src.indexOf("// PICSTORE_START") + 1) < 0 && src.indexOf("// PICSTORE_END") > src.indexOf("// PICSTORE_START"));
const BLOCK = cut("// PICSTORE_START", "// PICSTORE_END").replace("PICSTORE_TIMEOUT_MS=20000", "PICSTORE_TIMEOUT_MS=40");
ok("timeout is 20 s in the app", /PICSTORE_TIMEOUT_MS=20000;/.test(src));

const JPEG = "data:image/jpeg;base64," + Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 250, 0xff, 0xd9]).toString("base64");
function load(env) {
  env = env || {};
  const G = { puts: [], cancelled: 0 };
  const storage = { ref(p) { return {
    put(blob, meta) { G.puts.push({ p, blob, meta });
      if (env.mode === "hang") { const pr = new Promise(() => {}); pr.cancel = () => { G.cancelled++; }; return pr; }
      const pr = env.mode === "putFail" ? Promise.reject(new Error("storage/unauthorized")) : Promise.resolve({});
      pr.cancel = () => { G.cancelled++; }; return pr; },
    getDownloadURL() { return env.mode === "urlFail" ? Promise.reject(new Error("nope")) : Promise.resolve("https://firebasestorage.googleapis.com/v0/b/x/o/" + encodeURIComponent(p) + "?alt=media&token=t"); } }; } };
  const firebase = env.noStorage ? undefined : { storage: () => storage };
  const navigator = { onLine: env.offline ? false : true };
  const db = env.db === false ? null : {};
  const fn = new Function("G", "db", "firebase", "navigator", "console", `
    function _dryRun(){ return ${!!env.dry}; }
    ${BLOCK}
    return { picStore, picStorePath, picDataUrlToBlob, _picSlug };`);
  const api = fn(G, db, firebase, navigator, { warn() {}, log() {} }); api.G = G; return api;
}

(async () => {
  // ── the helper ──
  let a = load(), v = await a.picStore(JPEG, ["units", "monarchy", "British Monarchs", 7]);
  ok("good upload → the https link", /^https:\/\/firebasestorage\.googleapis\.com\//.test(v), v);
  const put = a.G.puts[0] || {};
  ok("file goes under pictures/<area>/<who>/<card>_<stamp>.jpg", /^pictures\/units\/monarchy\/British_Monarchs\/7_[a-z0-9]+\.jpg$/.test(put.p || ""), put.p);
  ok("uploaded as a JPEG with a year's cache", put.meta && put.meta.contentType === "image/jpeg" && /max-age=31536000/.test(put.meta.cacheControl));
  const bytes = put.blob ? Buffer.from(await put.blob.arrayBuffer()) : Buffer.alloc(0);
  ok("uploaded bytes are exactly the picture", bytes.equals(Buffer.from(JPEG.split(",")[1], "base64")));

  for (const [label, env] of [["upload rejected (e.g. Storage rules)", { mode: "putFail" }], ["link lookup fails", { mode: "urlFail" }],
    ["offline", { offline: true }], ["dry run", { dry: true }], ["no db", { db: false }], ["no Storage library", { noStorage: true }]]) {
    a = load(env); v = await a.picStore(JPEG, ["mastery", "julian", "card"]);
    ok(label + " → saved the old way (original picture, unchanged)", v === JPEG);
    if (env.offline || env.dry || env.db === false || env.noStorage) ok(label + " → no upload attempted", a.G.puts.length === 0);
  }
  a = load({ mode: "hang" }); const t0 = Date.now(); v = await a.picStore(JPEG, ["mastery", "lucy", "bank"]);
  ok("upload that hangs → times out, saved the old way", v === JPEG && Date.now() - t0 >= 30);
  ok("…and the hung upload is cancelled", a.G.cancelled === 1);
  a = load(); const link = "https://upload.wikimedia.org/x.jpg";
  ok("a link passed in is left alone (no upload)", (await a.picStore(link, ["units"])) === link && a.G.puts.length === 0);
  ok("empty value is left alone", (await a.picStore("", ["units"])) === "" && a.G.puts.length === 0);
  ok("odd names stay one safe path segment", a._picSlug("NC Frogs & Toads_Fowler's Toad/../x") === "NC_Frogs_Toads_Fowler_s_Toad_x");
  ok("never escapes pictures/", /^pictures\/[^.]*\.jpg$/.test(a.picStorePath(["../..", "", null])));

  // ── the pickers route through it ──
  for (const f of ["mastBankUploadImg", "mastVisEditUpload", "mastUploadImage", "unitEditPhoto"]) ok(f + " uploads through picStore", /picStore\(dataUrl,/.test(fnSrc(f)));
  ok("unit picture still saved to unitStudies/<id>/visuals/<key> only", /db\.ref\("unitStudies\/"\+unitEdit\.unitId\+"\/visuals\/"\+key\)\.set\(\{imageUrl:unitEdit\.newImg\}\)/.test(fnSrc("unitEditSave")));
  ok("Mastery visual still a one-key update", /db\.ref\("mastery\/"\+kid\+"_visuals"\)\.update\(\{\[key\]:val\|\|null\}\)/.test(fnSrc("mastSetVisual")));
  ok("Add to Mastery waits while a picture saves", /if\(mastAddUploading\)\{[^}]*return;/.test(fnSrc("mastAddItems")));
  ok("bank Add waits while a picture saves", /if\(mastBankAddImgUploading\)\{[^}]*return;/.test(fnSrc("mastBankAddItem")));

  // mastVisEditUpload, run: the link lands in the visual AND the card; a cancel saves nothing
  async function runVis(cancel) {
    const H = { visual: null, put: null, re: 0 };
    let resolveUp; const picStore = () => new Promise(r => { resolveUp = r; });
    const fn = new Function("H", "picStore", `
      let masteryKid="julian", mastVisEditKey={cat:"Dinosaurs",name:"T-Rex"};
      let masteryData={julian:[{prompt:"T-Rex",subject:"Dinosaurs",emoji:"🦖"}]};
      const HA_LS={setItem(){}}; function _mastRe(){ H.re++; } function alert(m){ H.alert=m; }
      function mastCompressImg(){ return Promise.resolve("data:image/jpeg;base64,AAA="); }
      function mastSetVisual(c,n,v){ H.visual=[c,n,v]; } function mastPutCards(k,items,ch){ H.put=ch[0]; }
      ${fnSrc("mastVisEditUpload")}
      return { go(){ mastVisEditUpload({size:1000}); }, cancel(){ mastVisEditKey=null; } };`);
    const api = fn(H, picStore); api.go(); await new Promise(r => setTimeout(r, 5));
    if (cancel) api.cancel();
    resolveUp("https://firebasestorage.googleapis.com/pic"); await new Promise(r => setTimeout(r, 5)); return H;
  }
  let H = await runVis(false);
  ok("Mastery picture: the link goes in the visual", H.visual && H.visual[2].imageUrl === "https://firebasestorage.googleapis.com/pic");
  ok("…and on the card (emoji cleared, as before)", H.put && H.put.imageUrl === "https://firebasestorage.googleapis.com/pic" && !H.put.emoji);
  H = await runVis(true);
  ok("closed the picker while it uploaded → nothing saved", !H.visual && !H.put);

  // unitEditPhoto + unitEditSave, run: Save waits while uploading
  {
    const D = { btn: { disabled: false, textContent: "Save" }, saved: 0 };
    let resolveUp; const picStore = () => new Promise(r => { resolveUp = r; });
    const fn = new Function("D", "picStore", `
      let unitEdit={unitId:"u1",deckKey:"British Monarchs",order:3,newImg:null};
      const unitStudies={}; const document={getElementById:id=>id==="unit-edit-save"?D.btn:null};
      function _unitEditOverlay(){ D.drawn=(D.drawn||0)+1; } function alert(m){ D.alert=m; }
      function mastCompressImg(){ return Promise.resolve("data:image/jpeg;base64,AAA="); }
      ${fnSrc("unitEditPhoto")}
      function unitEditSave(){ ${fnSrc("unitEditSave").split("\n")[1].replace(/\/\/.*$/, "")} D.saved++; }
      return { pick(){ unitEditPhoto({files:[{}]}); }, save(){ unitEditSave(); }, get ue(){ return unitEdit; } };`);
    const api = fn(D, picStore); api.pick(); await new Promise(r => setTimeout(r, 5));
    ok("unit sheet: Save button reads 'Saving picture…' and is off", D.btn.disabled === true && /Saving picture/.test(D.btn.textContent));
    api.save(); ok("…tapping Save then does nothing", D.saved === 0);
    resolveUp("https://firebasestorage.googleapis.com/u"); await new Promise(r => setTimeout(r, 5));
    ok("…upload done: button back, picture set to the link", D.btn.disabled === false && D.btn.textContent === "Save" && api.ue.newImg === "https://firebasestorage.googleapis.com/u");
    api.save(); ok("…and Save works", D.saved === 1);
  }

  ok("🔀 not used", src.indexOf("🔀") < 0);
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
