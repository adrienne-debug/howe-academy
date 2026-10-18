// 🖼 PICSWITCH — Change 3 of the picture move (her yes 2026-10-18: "switch with backup first, put-back undo, units and
// Mastery separate"). Slices the real PICMOVE + PICSWITCH blocks out of index.html and runs them over an in-memory
// database (the same tree the app reads) and an in-memory Storage that reports size + md5 from the bytes it holds.
// Checks: nothing switches before its copy is checked; each original is backed up BEFORE its spot switches, and a failed
// backup means no switch; only that one imageUrl spot changes, by transaction, and only while it still holds the
// original; units and Mastery switch separately; Put back restores the exact original only where the link is still
// there; dry run, a cancelled confirm and a kid write nothing; every write path is targeted.
// Run: node test_pictures_switch.js
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond, d) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name + (d ? "  → " + d : "")); } }
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("missing " + a); return src.slice(i, j); };

ok("PICSWITCH block present once", src.indexOf("// PICSWITCH_START") > 0 && src.indexOf("// PICSWITCH_START", src.indexOf("// PICSWITCH_START") + 1) < 0 && src.indexOf("// PICSWITCH_END") > src.indexOf("// PICSWITCH_START"));
const MOVE = cut("// PICMOVE_START", "// PICMOVE_END"), SW = cut("// PICSWITCH_START", "// PICSWITCH_END");
ok("the Pictures card shows the switch rows", /h\+=_picSwitchHtml\(\);/.test(MOVE));
ok("nothing listens to the backup (no .on on picturesBackup anywhere)", !/ref\("picturesBackup[^"]*"\)\.on\(/.test(src));

const pic = (bytes, type) => "data:" + (type || "image/jpeg") + ";base64," + Buffer.from(bytes).toString("base64");
const A = pic([0xff, 0xd8, 1, 2, 3, 4, 0xff, 0xd9]), B = pic([0xff, 0xd8, 9, 9, 9, 0xff, 0xd9]), P = pic([0x89, 0x50, 0x4e, 0x47, 7, 7], "image/png");
const H5 = "unitStudies/monarchy/visuals/British Monarchs_Henry V/imageUrl";
function fixture() {
  return {
    unitStudies: { monarchy: { title: "British Monarchy", visuals: { "British Monarchs_Henry V": { imageUrl: A, credit: "x" }, "British Monarchs_Anne": { imageUrl: "https://upload.wikimedia.org/anne.jpg" } } } },
    mastery: { julian_visuals: { "Dinosaurs_T-Rex": { imageUrl: B }, "Dinosaurs_Stego": { imageUrl: P } },
      julian: [{ prompt: "T-Rex", subject: "Dinosaurs", imageUrl: B, tier: "daily" }, { prompt: "Owl", subject: "Birds", emoji: "🦉" }] }
  };
}
function load(env) {
  env = env || {};
  const G = { log: [], puts: [], files: env.files || {}, dom: {}, toasts: [] };
  const store = env.store || fixture();
  const ks = p => String(p).split("/").filter(Boolean);
  const getAt = p => ks(p).reduce((o, k) => (o == null ? undefined : o[k]), store);
  const setAt = (p, v) => { const k = ks(p); let o = store; for (let i = 0; i < k.length - 1; i++) { if (o[k[i]] == null || typeof o[k[i]] !== "object") o[k[i]] = {}; o = o[k[i]]; } o[k[k.length - 1]] = v; };
  const db = { ref(p) { return {
    set(v) { G.log.push(["set", p]); if (env.failBackup && p.indexOf("picturesBackup/") === 0) return Promise.reject(new Error("denied")); setAt(p, JSON.parse(JSON.stringify(v))); return Promise.resolve(); },
    transaction(fn) { G.log.push(["tx", p]); if (env.mutate) env.mutate(p, setAt); const cur = getAt(p); const nv = fn(cur === undefined ? null : cur);
      if (nv === undefined) return Promise.resolve({ committed: false }); setAt(p, nv); return Promise.resolve({ committed: true }); },
    once() { G.log.push(["once", p]); const v = getAt(p); return Promise.resolve({ val: () => (v === undefined ? null : JSON.parse(JSON.stringify(v))) }); },
    update() { G.log.push(["update", p]); throw new Error("no update expected"); }, remove() { G.log.push(["remove", p]); throw new Error("no remove expected"); } }; } };
  const storage = { ref(p) { return {
    put(blob, meta) { G.puts.push(p); const pr = (async () => { let b = Buffer.from(await blob.arrayBuffer()); if (env.corrupt) b = Buffer.concat([b, Buffer.from([0])]); G.files[p] = { bytes: b, type: meta.contentType }; })(); pr.cancel = () => {}; return pr; },
    getMetadata() { const f = G.files[p]; if (!f) return Promise.reject(Object.assign(new Error("nf"), { code: "storage/object-not-found" }));
      return Promise.resolve({ size: f.bytes.length, md5Hash: crypto.createHash("md5").update(f.bytes).digest("base64") }); },
    getDownloadURL() { return Promise.resolve("https://firebasestorage.googleapis.com/v0/b/x/o/" + encodeURIComponent(p) + "?alt=media&token=t"); } }; } };
  const doc = { getElementById: id => G.dom[id] || null, createElement: () => { const el = { style: {}, remove() { delete G.dom[el.id]; } }; return el; }, body: { appendChild: el => { G.dom[el.id] = el; } } };
  const fn = new Function("G", "db", "firebase", "document", "store", "env", `
    let unitStudies=store.unitStudies, masteryData=store.mastery;
    let _haMastReady=true, _haUnitsReady=true;
    function momHere(){ return env.mom!==false; } function _dryRun(){ return !!env.dry; } function confirm(){ return env.confirm!==false; }
    function gwShowToast(m){ G.toasts.push(m); } function cap(s){ s=String(s); return s.charAt(0).toUpperCase()+s.slice(1); }
    function esc(s){ return String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
    ${MOVE}
    ${SW}
    return { picMoveRun, picSwitchRun, picBackRun, picMoveScan, picBackupKey, picMd5Hex, _picMoveBody, get sw(){ return picSwitch; } };`);
  const api = fn(G, db, { storage: () => storage }, doc, store, env); api.G = G; api.store = store; return api;
}
const writes = G => G.log.filter(l => l[0] === "set" || l[0] === "tx");
const link = v => typeof v === "string" && /^https:\/\/firebasestorage/.test(v);

(async () => {
  // 1. nothing switches before its copy exists
  let a = load(); await a.picSwitchRun("units");
  ok("no copy yet → skipped 'needs copying first', nothing written", a.sw.units.ok === 0 && /needs copying first/.test(a.sw.units.skips[0].why) && writes(a.G).length === 0);

  // 2. copy, then switch UNITS only
  a = load(); await a.picMoveRun(); const files = a.G.files;
  a = load({ files }); await a.picSwitchRun("units");
  const u = a.store.unitStudies.monarchy.visuals;
  ok("unit picture switched to its Storage link", a.sw.units.ok === 1 && link(u["British Monarchs_Henry V"].imageUrl));
  ok("…its other fields untouched (credit), the link picture untouched", u["British Monarchs_Henry V"].credit === "x" && u["British Monarchs_Anne"].imageUrl === "https://upload.wikimedia.org/anne.jpg");
  ok("Mastery untouched by the unit switch (3 still text)", a.picMoveScan().filter(x => x.path.startsWith("mastery/")).length === 3);
  const bk = a.store.picturesBackup.units[a.picBackupKey(H5)];
  ok("original backed up at picturesBackup/units/<key> with path, was, now", bk && bk.path === H5 && bk.was === A && bk.now === u["British Monarchs_Henry V"].imageUrl && bk.at > 0);
  const iB = a.G.log.findIndex(l => l[1] === "picturesBackup/units/" + a.picBackupKey(H5)), iT = a.G.log.findIndex(l => l[0] === "tx" && l[1] === H5);
  ok("backup written BEFORE the spot switched", iB >= 0 && iT > iB);
  ok("every write is targeted (one imageUrl, one backup entry, the meta note)", writes(a.G).every(l => /\/imageUrl$/.test(l[1]) || /^picturesBackup\/units\/[0-9a-f]{32}$/.test(l[1]) || l[1] === "picturesBackupMeta/units"), JSON.stringify(writes(a.G)));
  ok("the imageUrl write is a transaction (only if still the original)", a.G.log.some(l => l[0] === "tx" && l[1] === H5) && !a.G.log.some(l => l[0] === "set" && l[1] === H5));
  ok("meta note counts 1 switched", a.store.picturesBackupMeta.units.count === 1);
  ok("card shows the switch result and a Put back button", /✓ <b>1<\/b> switched · backup kept/.test(a._picMoveBody()) && /Put unit pictures back/.test(a._picMoveBody()));

  // 3. MASTERY separately (the same photo in two spots — both switch)
  await a.picSwitchRun("mastery");
  const m = a.store.mastery;
  ok("Mastery: all 3 switched (2 spots share one photo)", a.sw.mastery.ok === 3 && link(m.julian_visuals["Dinosaurs_T-Rex"].imageUrl) && link(m.julian_visuals["Dinosaurs_Stego"].imageUrl) && link(m.julian[0].imageUrl));
  ok("…the card's other fields untouched", m.julian[0].tier === "daily" && m.julian[1].emoji === "🦉");
  ok("no picture saved as text is left", a.picMoveScan().length === 0);

  // 4. Put back units → exact original, only units
  await a.picBackRun("units");
  ok("Put back units: the exact original returns", a.store.unitStudies.monarchy.visuals["British Monarchs_Henry V"].imageUrl === A && a.sw.units.ok === 1);
  ok("…Mastery stays switched", link(m.julian[0].imageUrl));
  ok("…meta note back to 0, backup kept", a.store.picturesBackupMeta.units.count === 0 && a.store.picturesBackup.units[a.picBackupKey(H5)].was === A);
  // a spot changed since the switch is left alone on Put back
  a.store.mastery.julian_visuals["Dinosaurs_Stego"].imageUrl = "🦕";
  await a.picBackRun("mastery");
  ok("Put back Mastery: changed-since spot left alone, the others restored", m.julian_visuals["Dinosaurs_Stego"].imageUrl === "🦕" && m.julian_visuals["Dinosaurs_T-Rex"].imageUrl === B && m.julian[0].imageUrl === B && a.sw.mastery.ok === 2 && a.sw.mastery.skips.length === 1);

  // 5. backup fails → no switch
  a = load({ files, failBackup: true }); await a.picSwitchRun("units");
  ok("backup didn't save → the picture is NOT switched", a.store.unitStudies.monarchy.visuals["British Monarchs_Henry V"].imageUrl === A && /backup didn't save/.test(a.sw.units.skips[0].why) && !a.G.log.some(l => l[0] === "tx" && l[1] === H5));

  // 6. changed between the check and the switch → left alone
  a = load({ files, mutate: (p, setAt) => { if (p === H5) setAt(p, "data:image/jpeg;base64,NEWPHOTO"); } }); await a.picSwitchRun("units");
  ok("picture changed meanwhile → left alone (new photo kept)", a.store.unitStudies.monarchy.visuals["British Monarchs_Henry V"].imageUrl === "data:image/jpeg;base64,NEWPHOTO" && /changed since/.test(a.sw.units.skips[0].why));

  // 7. a copy that doesn't match → skipped
  a = load({ corrupt: true }); await a.picMoveRun(); const bad = a.G.files;
  a = load({ files: bad }); await a.picSwitchRun("units");
  ok("Storage copy doesn't match → skipped, nothing written", a.sw.units.ok === 0 && /doesn't match/.test(a.sw.units.skips[0].why) && writes(a.G).length === 0);

  // 8. dry run, cancel, kid
  a = load({ files, dry: true }); await a.picSwitchRun("units"); await a.picSwitchRun("mastery");
  ok("dry run writes nothing", writes(a.G).length === 0 && a.sw.units.dry && /Dry run — nothing saved/.test(a._picMoveBody()));
  a = load({ files, confirm: false }); await a.picSwitchRun("units");
  ok("cancelled confirm writes nothing", writes(a.G).length === 0 && !a.sw.units);
  a = load({ files, mom: false }); await a.picSwitchRun("units"); await a.picBackRun("units");
  ok("a kid can't switch or put back", writes(a.G).length === 0 && !a.sw.units);

  ok("🔀 not used", src.indexOf("🔀") < 0);
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
