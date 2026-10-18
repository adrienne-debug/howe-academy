// 🖼 PICMOVE — Change 2 of the picture move (her yes 2026-10-18): the Mom-only Pictures card in Settings COPIES every
// picture still saved as text to Storage and CHECKS each copy, with no database writes. Slices the real PICMOVE block out
// of index.html and runs it over an in-memory Storage that works out size + md5 from the bytes it stored (as the real
// one does): the fingerprint matches Node's md5; only data: pictures under imageUrl are found (links, emoji and other
// text are skipped); the same photo in two places uploads once to pictures/moved/<md5>.<ext>; a copy is ✓ only when
// Storage's size AND md5 match; a bad copy or a failed upload is ✗ with a reason; a re-run uploads nothing; dry run
// uploads nothing; a kid can't run it; and nothing ever touches the database.
// Run: node test_pictures_copy.js
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond, d) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (d ? "  → " + d : "")); } }
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("missing " + a); return src.slice(i, j); };

ok("PICMOVE block present once", src.indexOf("// PICMOVE_START") > 0 && src.indexOf("// PICMOVE_START", src.indexOf("// PICMOVE_START") + 1) < 0 && src.indexOf("// PICMOVE_END") > src.indexOf("// PICMOVE_START"));
const BLOCK = cut("// PICMOVE_START", "// PICMOVE_END");
ok("the block never writes the database (no db.ref)", !/db\.ref\(/.test(BLOCK));
const settings = cut("function renderSettings(", "\n}\n");
ok("Settings shows the Pictures card", /pinHtml\+=picMoveCardHtml\(\);/.test(settings));

const pic = (bytes, type) => "data:" + (type || "image/jpeg") + ";base64," + Buffer.from(bytes).toString("base64");
const A = pic([0xff, 0xd8, 1, 2, 3, 4, 0xff, 0xd9]), B = pic([0xff, 0xd8, 9, 9, 9, 0xff, 0xd9]), P = pic([0x89, 0x50, 0x4e, 0x47, 7, 7], "image/png");
const md5hex = s => crypto.createHash("md5").update(Buffer.from(s.split(",")[1], "base64")).digest("hex");
function fixture() {
  return {
    unitStudies: { monarchy: { title: "British Monarchy", visuals: { "British Monarchs_Henry V": { imageUrl: A }, "British Monarchs_Anne": { imageUrl: "https://upload.wikimedia.org/anne.jpg" }, "British Monarchs_John": "👑" },
      decks: [{ key: "British Monarchs", cards: [{ name: "Henry V", bio: "data:image/jpeg;base64,NOTAPICTUREFIELD" }] }] } },
    masteryData: { julian_visuals: { "Dinosaurs_T-Rex": { imageUrl: B }, "Dinosaurs_Stego": { imageUrl: P } },
      julian: [{ prompt: "T-Rex", subject: "Dinosaurs", imageUrl: B }, { prompt: "Owl", subject: "Birds", emoji: "🦉" }],
      lincoln: [{ prompt: "beaker", subject: "Lab", imageUrl: "https://firebasestorage.googleapis.com/x" }] }
  };
}
function load(env) {
  env = env || {};
  const G = { puts: [], dbCalls: 0, toasts: [], files: env.files || {}, dom: {} };
  const db = new Proxy({}, { get() { G.dbCalls++; return () => { throw new Error("database touched"); }; } });
  const storage = { ref(p) { return {
    put(blob, meta) { G.puts.push({ p, meta });
      const pr = (async () => { if (env.putFail) throw Object.assign(new Error("x"), { code: "storage/unauthorized" });
        let b = Buffer.from(await blob.arrayBuffer()); if (env.corrupt) b = Buffer.concat([b, Buffer.from([0])]);
        G.files[p] = { bytes: b, type: meta.contentType }; })();
      pr.cancel = () => {}; return pr; },
    getMetadata() { const f = G.files[p]; if (!f) return Promise.reject(Object.assign(new Error("nf"), { code: "storage/object-not-found" }));
      return Promise.resolve({ size: f.bytes.length, md5Hash: crypto.createHash("md5").update(f.bytes).digest("base64"), contentType: f.type }); },
    getDownloadURL() { return Promise.resolve("https://firebasestorage.googleapis.com/v0/b/x/o/" + encodeURIComponent(p) + "?alt=media"); } }; } };
  const doc = { getElementById: id => G.dom[id] || null, createElement: () => { const el = { style: {}, remove() { delete G.dom[el.id]; } }; return el; }, body: { appendChild: el => { G.dom[el.id] = el; } } };
  const fx = env.fixture || fixture();
  const fn = new Function("G", "db", "firebase", "document", "fx", `
    let unitStudies=fx.unitStudies, masteryData=fx.masteryData;
    let _haMastReady=${env.ready !== false}, _haUnitsReady=${env.ready !== false};
    function momHere(){ return ${env.mom !== false}; } function _dryRun(){ return ${!!env.dry}; }
    function gwShowToast(m){ G.toasts.push(m); } function cap(s){ s=String(s); return s.charAt(0).toUpperCase()+s.slice(1); }
    function esc(s){ return String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
    ${BLOCK}
    return { picMd5Hex, picMoveScan, picMoveGroups, picMoveRun, _picMoveBody, picMoveCardHtml, get state(){ return picMove; } };`);
  const api = fn(G, db, env.noStorage ? undefined : { storage: () => storage }, doc, fx); api.G = G; return api;
}

(async () => {
  // fingerprint
  let a = load(), good = true, bad = "";
  for (const n of [0, 1, 3, 55, 56, 57, 63, 64, 65, 119, 120, 127, 128, 1000, 100003]) {
    const b = crypto.randomBytes(n); const got = a.picMd5Hex(new Uint8Array(b)), want = crypto.createHash("md5").update(b).digest("hex");
    if (got !== want) { good = false; bad = n + ": " + got + " vs " + want; break; }
  }
  ok("fingerprint (md5) matches Node's for every size tried", good, bad);

  // scan + labels + grouping
  const items = a.picMoveScan();
  ok("finds only pictures saved as text under imageUrl (4)", items.length === 4, items.map(x => x.path).join(", "));
  ok("skips links, emoji and other text fields", !items.some(x => /Anne|John|bio|lincoln/.test(x.path)));
  const lab = items.map(x => x.label);
  ok("plain labels", lab.includes("British Monarchy · British Monarchs Henry V") && lab.includes("Julian · Dinosaurs T-Rex") && lab.includes("Julian · Dinosaurs T-Rex") && lab.includes("Julian · Dinosaurs Stego"), lab.join(" | "));
  const groups = a.picMoveGroups(items);
  ok("the same photo in two places is one group (4 pictures → 3 photos)", groups.length === 3 && groups.find(g => g.md5 === md5hex(B)).items.length === 2);
  ok("card text counts pictures, MB and different photos", /<b>4<\/b> pictures saved inside the database/.test(a._picMoveBody()) && /3 different photos/.test(a._picMoveBody()));

  // the copy
  await a.picMoveRun();
  ok("each different photo uploads once (3)", a.G.puts.length === 3, a.G.puts.length);
  ok("named by fingerprint under pictures/moved/", a.G.puts.every(p => /^pictures\/moved\/[0-9a-f]{32}\.(jpg|png)$/.test(p.p)) && a.G.puts.some(p => p.p === "pictures/moved/" + md5hex(P) + ".png"));
  ok("type kept, a year's cache", a.G.puts.every(p => /^image\/(jpeg|png)$/.test(p.meta.contentType) && /max-age=31536000/.test(p.meta.cacheControl)));
  ok("every copy ✓ (size + md5 match)", a.state.groups.every(g => g.st === "ok" && /^https:/.test(g.url)));
  ok("Storage holds exactly the original bytes", Object.entries(a.G.files).every(([p, f]) => p.includes(crypto.createHash("md5").update(f.bytes).digest("hex"))));
  ok("the database was never touched", a.G.dbCalls === 0, a.G.dbCalls);
  ok("pictures in the app are unchanged", a.picMoveScan().length === 4);
  ok("check page opens with ✓ 3 of 3", a.G.dom["pic-move-check"] && /✓ 3 of 3 different photos copied and checked/.test(a.G.dom["pic-move-check"].innerHTML));
  ok("card shows ✓ 3 copied and checked", /✓ <b>3<\/b> copied and checked/.test(a._picMoveBody()));

  // re-run skips what's done
  const files = a.G.files; a = load({ files });
  await a.picMoveRun();
  ok("re-run uploads nothing, still all ✓", a.G.puts.length === 0 && a.state.groups.every(g => g.st === "ok" && g.skipped));

  // a copy that doesn't match → ✗
  a = load({ corrupt: true }); await a.picMoveRun();
  ok("Storage copy differs → ✗ with the reason", a.state.groups.every(g => g.st === "bad" && /doesn't match/.test(g.why)));
  ok("…and the card says how many didn't copy", /✗ 3<\/b> didn't copy/.test(a._picMoveBody()));
  a = load({ putFail: true }); await a.picMoveRun();
  ok("upload refused → ✗ with the reason", a.state.groups.every(g => g.st === "bad" && /unauthorized/.test(g.why)));
  a = load({ noStorage: true }); await a.picMoveRun();
  ok("no Storage on this device → ✗, nothing uploaded", a.state.groups.every(g => g.st === "bad") && a.G.puts.length === 0);

  // dry run, not Mom, not loaded
  a = load({ dry: true }); await a.picMoveRun();
  ok("dry run uploads nothing", a.G.puts.length === 0 && a.state.groups.every(g => g.st === "dry") && /Dry run/.test(a._picMoveBody()));
  a = load({ mom: false }); await a.picMoveRun();
  ok("a kid can't run it (and the card is hidden)", a.G.puts.length === 0 && !a.state && a.picMoveCardHtml() === "");
  a = load({ ready: false }); await a.picMoveRun();
  ok("still loading → a message, nothing uploaded", a.G.puts.length === 0 && !a.state && a.G.toasts.length === 1 && /Loading pictures/.test(a._picMoveBody()));

  ok("🔀 not used", src.indexOf("🔀") < 0);
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
