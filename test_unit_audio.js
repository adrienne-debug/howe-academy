// 🎧 UNITAUDIO — upload a recording for a unit day's Listen (BRIEF_units_build_2026-10-27.md A1; her answer 9: "upload kinda like
//   the celebration songs but its own and in its spot"). Runs the REAL UNITAUDIO + UNITTRACK blocks with a fake Storage.
//   · a wrong file type refused; over the limit refused; the Storage path is unitAudio/<unit>/<day>/<safe>, never songs/
//   · one utWrite on success → the day's read = {mode listen, what, url}; ✕ asks, deletes the file, clears read.url only
//   · dry run uploads and writes nothing; not Mom → nothing; the celebration songs' list and path are untouched
//   · the Days editor shows the button next to the read strand (UNITTRACK's hook); the day card plays read.url (DAYCARD)
//   run: node test_unit_audio.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
const UA = cut("// UNITAUDIO_START", "// UNITAUDIO_END");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const J = x => JSON.stringify(x);
function world(o) {
  o = o || {}; const writes = [], puts = [], deletes = [];
  const storage = { ref: p => ({ put: file => { const task = { snapshot: { ref: { getDownloadURL: () => Promise.resolve("https://firebasestorage.googleapis.com/v0/b/x/o/" + encodeURIComponent(p) + "?alt=media") } }, on: (ev, prog, err, done) => { puts.push([p, file.name, file.size]); if (o.fail) err(new Error("denied")); else { prog({ bytesTransferred: 50, totalBytes: 100 }); done(); } } }; return task; } }), refFromURL: u => ({ delete: () => { deletes.push(u); return Promise.resolve(); } }) };
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, isFinite, WeakMap, Promise, setTimeout,
    unitStudies: o.units || { thanksgiving: { id: "thanksgiving", title: "Thanksgiving", decks: [{ key: "Thanksgiving", cards: [{ name: "Wampanoag" }] }], track: { mode: "seq", days: [{ id: "d1", n: 1, t: "Who were the Wampanoag?", read: { mode: "mom", what: "Squanto ch 1" } }, { id: "d2", n: 2, t: "The Mayflower", read: { mode: "listen", what: "SOTW ch 2", url: "https://firebasestorage.googleapis.com/v0/b/x/o/unitAudio%2Fthanksgiving%2Fd2%2F1_sotw2.mp3?alt=media" } }, { id: "d3", n: 3, t: "Plymouth", read: { mode: "listen", what: "A podcast", url: "https://podcast.example/ep3" } }] } } },
    momHere: () => o.mom !== false, _dryRun: () => !!o.dry, db: { ref: p => ({ set: v => writes.push([p, JSON.parse(J(v === undefined ? null : v))]) }) }, firebase: { storage: () => storage },
    confirm: () => o.confirm !== false, document: { getElementById: () => null }, renderAll: () => { ctx.repaints = (ctx.repaints || 0) + 1; }, repaints: 0, celebSongs: [{ name: "Hooray", url: "https://firebasestorage.googleapis.com/v0/b/x/o/songs%2Fhooray.mp3" }],
    lrSafeUrl: u => /^https:\/\//i.test(String(u || "").trim()) ? String(u).trim() : "" };
  vm.createContext(ctx);
  vm.runInContext(cut("// UNITTRACK_START", "// UNITTRACK_END") + "\n" + fn("lrClean") + "\n" + fn("lrList") + "\n" + fn("lrStr") + "\n" + fn("lrDate") + "\n" + UA + "\nObject.defineProperty(this,'uaStatus',{get:()=>uaStatus});", ctx);
  return { ctx, writes, puts, deletes };
}
const F = (name, type, mb) => ({ name: name, type: type, size: Math.round((mb || 1) * 1024 * 1024) });
const tick = () => new Promise(r => setTimeout(r, 0));

(async () => {
  console.log("── the checks before anything leaves the device ──");
  {
    const w = world(), c = w.ctx;
    ok("a wrong file type is refused with a plain line, nothing uploaded", c.uaUpload("thanksgiving", "d1", { files: [F("notes.pdf", "application/pdf", 1)], value: "x" }) === false && /MP3 or M4A/.test(c.uaStatus["thanksgiving|d1"]) && w.puts.length === 0);
    ok("over the limit is refused", c.uaUpload("thanksgiving", "d1", { files: [F("big.mp3", "audio/mpeg", 61)] }) === false && /too large/.test(c.uaStatus["thanksgiving|d1"]) && w.puts.length === 0);
    ok("uaOk: mp3 · m4a (audio/mp4, audio/x-m4a) pass; an unknown type with a .m4a name passes; a wav does not", c.uaOk(F("a.mp3", "audio/mpeg")) === "" && c.uaOk(F("a.m4a", "audio/mp4")) === "" && c.uaOk(F("a.m4a", "audio/x-m4a")) === "" && c.uaOk(F("a.m4a", "")) === "" && c.uaOk(F("a.wav", "audio/wav")) !== "" && c.uaOk(null) !== "");
    ok("not Mom → nothing", world({ mom: false }).ctx.uaUpload("thanksgiving", "d1", { files: [F("a.mp3", "audio/mpeg")] }) === false);
  }
  console.log("\n── a good upload ──");
  {
    const w = world(), c = w.ctx;
    const p = c.uaUpload("thanksgiving", "d1", { files: [F("SOTW 01 - The Earliest People.mp3", "audio/mpeg", 22)], value: "x" });
    ok("the Storage path is unitAudio/<unit>/<day>/<time>_<safe name> — never songs/", /^unitAudio\/thanksgiving\/d1\/\d+_SOTW_01_-_The_Earliest_People\.mp3$/.test(p) && w.puts.length === 1 && w.puts[0][0] === p && !/songs\//.test(p), p);
    await tick(); await tick();
    ok("on success ONE utWrite: the day's read = {mode listen, what (kept from the day), url}", w.writes.length === 1 && w.writes[0][0] === "unitStudies/thanksgiving/track/days/0/read" && w.writes[0][1].mode === "listen" && w.writes[0][1].what === "Squanto ch 1" && /unitAudio%2Fthanksgiving%2Fd1/.test(w.writes[0][1].url), w.writes);
    ok("the day now reads it; the status line clears; the screen repaints", c.utDay(c.unitStudies.thanksgiving, "d1").read.url.indexOf("https://firebasestorage") === 0 && c.uaStatus["thanksgiving|d1"] === "" && c.repaints >= 1);
    const w2 = world(), c2 = w2.ctx; c2.unitStudies.thanksgiving.track.days[0].read = undefined; c2.utTouched(c2.unitStudies.thanksgiving);
    c2.uaUpload("thanksgiving", "d1", { files: [F("07_Curiosity_Chronicles_Ch3.m4a", "audio/mp4", 30)] }); await tick(); await tick();
    ok("a day with no read yet: what comes from the file's name, tidied", w2.writes[0][1].what === "Curiosity Chronicles Ch3" && w2.writes[0][1].mode === "listen");
    ok("the celebration songs' list is untouched", J(c.celebSongs) === J([{ name: "Hooray", url: "https://firebasestorage.googleapis.com/v0/b/x/o/songs%2Fhooray.mp3" }]));
    const wf = world({ fail: true }), cf = wf.ctx; cf.uaUpload("thanksgiving", "d1", { files: [F("a.mp3", "audio/mpeg", 2)], value: "x" }); await tick();
    ok("an upload that fails → the status line says so, nothing written", /Upload failed: denied/.test(cf.uaStatus["thanksgiving|d1"]) && wf.writes.length === 0);
  }
  console.log("\n── ✕ takes the recording off ──");
  {
    const w = world(), c = w.ctx;
    ok("✕ on an uploaded recording: asks, deletes the file, ONE utWrite of read without url (mode + what kept)", c.uaRemove("thanksgiving", "d2") === true && w.deletes.length === 1 && /unitAudio%2Fthanksgiving%2Fd2/.test(w.deletes[0]) && w.writes.length === 1 && w.writes[0][0] === "unitStudies/thanksgiving/track/days/1/read" && J(w.writes[0][1]) === J({ mode: "listen", what: "SOTW ch 2" }) && c.utDay(c.unitStudies.thanksgiving, "d2").read.url === undefined, w.writes);
    ok("✕ on a day whose Listen is a link (not an upload of ours): the link clears, nothing is deleted from Storage", c.uaRemove("thanksgiving", "d3") === true && w.deletes.length === 1 && c.utDay(c.unitStudies.thanksgiving, "d3").read.url === undefined);
    ok("Cancel in the ask → nothing", (() => { const w2 = world({ confirm: false }); return w2.ctx.uaRemove("thanksgiving", "d2") === false && w2.writes.length === 0 && w2.deletes.length === 0; })());
    ok("a day with no recording → nothing", c.uaRemove("thanksgiving", "d1") === false);
  }
  console.log("\n── dry run ──");
  {
    const w = world({ dry: true }), c = w.ctx;
    ok("dry run: nothing uploaded, nothing written, the status line says so", c.uaUpload("thanksgiving", "d1", { files: [F("a.mp3", "audio/mpeg", 2)], value: "x" }) === false && /Dry run/.test(c.uaStatus["thanksgiving|d1"]) && w.puts.length === 0 && w.writes.length === 0);
    ok("dry run ✕: the local day changes, nothing written, nothing deleted", c.uaRemove("thanksgiving", "d2") === true && w.writes.length === 0 && w.deletes.length === 0 && c.utDay(c.unitStudies.thanksgiving, "d2").read.url === undefined);
  }
  console.log("\n── the editor's button, the day card, the block ──");
  {
    const c = world().ctx; const u = c.unitStudies.thanksgiving;
    const h = c.uaUploadHTML(u, c.utDay(u, "d2"));
    ok("Mom's Days editor: ⬆ Upload recording (mp3/m4a), 'recording on this day' with ✕, the limit line", /Upload recording/.test(h) && /accept="audio\/mpeg,audio\/mp3,audio\/mp4,audio\/x-m4a,\.mp3,\.m4a"/.test(h) && /recording on this day/.test(h) && /uaRemove\('thanksgiving','d2'\)/.test(h) && /up to 60 MB/.test(h) && /not the celebration songs/.test(h));
    ok("a day with a link shows the link, a day with none shows just the button; a kid sees nothing", /a link: https:\/\/podcast\.example\/ep3/.test(c.uaUploadHTML(u, c.utDay(u, "d3"))) && !/✕/.test(c.uaUploadHTML(u, c.utDay(u, "d1"))) && world({ mom: false }).ctx.uaUploadHTML(u, c.utDay(u, "d1")) === "");
    ok("UNITTRACK's day editor carries the hook under the read strand (guarded)", /\(\(typeof uaUploadHTML==="function"\)\?uaUploadHTML\(u,d\):""\)/.test(fn("utEditorHTML")));
    ok("the day card plays read.url (DAYCARD's 🎧 Listen player)", /<audio controls preload="none" src="'\+dcEsc\(url\)\+'"/.test(cut("// DAYCARD_START", "// DAYCARD_END")));
    ok("the block's writes: Storage put / delete on unitAudio only, the record through utWrite only — no db.ref, never songs/", !/db\.ref\(/.test(UA) && !/songs\//.test(UA.replace(/\/\/.*$/gm, "")) && (UA.match(/utWrite\(/g) || []).length === 2 && /firebase\.storage\(\)\.ref\(path\)/.test(UA));
    ok("no kid's name in the block; no shuffle emoji in index.html", !/lincoln|ellis|lucy|julian/i.test(UA.replace(/\/\/.*$/gm, "")) && src.indexOf("🔀") < 0);
  }
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})();
