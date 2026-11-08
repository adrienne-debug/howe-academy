// 💾 UBSAVELOCK — the Builder's Save locks while its transaction is out (her yes 2026-11-07, "also the saving fix"; live 11/2: one
//   Save tapped three times in 3 s made <title>, <title>_2 and <title>_3). Runs the REAL UNITBUILD block (+ UNITTRACK, PUTSCHED).
//   · three fast taps → ONE transaction, one unit id; the button reads ⏳ Saving…, disabled and dimmed while it is out
//   · unlock on commit (done, once), on not-committed (the other-device message), on error (its message)
//   · stuck network: no answer in UB_SAVE_WAIT_MS → unlock with a plain line; the next tap re-sends the SAME id/addedTs, and a retry
//     that finds its own first try counts as done — never a second unit
//   · dry run: Save finishes at once, nothing locked, nothing written
//   run: node test_unit_save_lock.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
const UB = cut("// UNITBUILD_START", "// UNITBUILD_END");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const tick = () => new Promise(r => setImmediate(r));
function world(o) {
  o = o || {}; const tx = [], writes = [], timers = [], toasts = [];
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, isFinite, WeakMap, Promise,
    setTimeout: (f, ms) => { timers.push({ f, ms, live: true }); return timers.length; }, clearTimeout: h => { if (timers[h - 1]) timers[h - 1].live = false; },
    unitStudies: o.units || {}, momHere: () => true, _dryRun: () => !!o.dry,
    db: { ref: p => ({ set: v => writes.push([p, v]), update: v => writes.push([p, v]),
      transaction: f => { let res, rej; const pr = new Promise((a, b) => { res = a; rej = b; }); tx.push({ p, f, res, rej }); return pr; } }) },
    window: { HA_FAMILY: { familyId: "fam", familyName: "Fam Academy" } }, HA_LS: { getItem: () => "Mom", setItem: () => {} }, cap: s => s ? s[0].toUpperCase() + s.slice(1) : s,
    renderAll: () => {}, openUnit: id => { ctx.opened = (ctx.opened || []).concat(id); }, gwShowToast: m => toasts.push(m), document: { getElementById: () => null },
    lrSafeUrl: u => /^https:\/\//i.test(String(u || "").trim()) ? String(u).trim() : "", famDefs: () => ({}), famList: x => x || [], famTrack: () => null, famWhoBlockFor: () => null, famWrite: () => true, famItems: () => [], currData: { subjects: {} }, masteryData: {},
    kitCapKey: () => "", masteryKid: "", MAST_MASTERY_TIER_DEFAULT: "monthly", mastTierAtLeast: () => false, _unitPortrait: () => "", _nbActKeys: () => [], unitActPoints: a => a.points || 0, nbUnitDays: () => ({}) };
  vm.createContext(ctx);
  vm.runInContext(cut("// UNITTRACK_START", "// UNITTRACK_END") + "\n" + cut("// PUTSCHED_START", "// PUTSCHED_END") + "\n" + UB + "\n" + fn("lrClean") + "\n" + fn("lrList") + "\n" + fn("lrStr") + "\n" + fn("lrDate") + "\nObject.defineProperty(this,'ubForm',{get:()=>ubForm,set:v=>{ubForm=v;}});", ctx);
  // a ready-to-save unit: one day, one checked card
  ctx.ubOpen(); ctx.ubSet("title", "Freshwater Fish"); ctx.ubGo("fill");
  ctx.document.getElementById = id => id === "ub-in-cards-0" ? { value: "Guppy | a small fish" } : null; ctx.ubAddLines(0, "cards"); ctx.document.getElementById = () => null;
  ctx.ubAllCards().forEach(x => ctx.ubKeep(x.c.id)); ctx.ubGo("check");
  return { ctx, tx, writes, timers, toasts };
}
// what the transaction hands back: committed with our record, or aborted with what is there
const commit = t => t.res({ committed: true, snapshot: { val: () => t.f(null) } });
const abort = (t, there) => t.res({ committed: false, snapshot: { val: () => there } });

(async () => {
  console.log("── three fast taps ──");
  {
    const w = world(), c = w.ctx, f = c.ubForm;
    const u1 = c.ubSave(), u2 = c.ubSave(), u3 = c.ubSave();
    ok("three taps → ONE transaction, on unitStudies/freshwater_fish; taps 2 and 3 return at once", w.tx.length === 1 && w.tx[0].p === "unitStudies/freshwater_fish" && u1 && u1.id === "freshwater_fish" && u2 === null && u3 === null);
    ok("while it is out: the form is saving, the button reads ⏳ Saving…, disabled and dimmed", f.saving === true && (() => { const h = c.ubPageHTML(); return /⏳ Saving…/.test(h) && /<button onclick="ubSave\(\)" disabled /.test(h) && /opacity:\.55/.test(h) && !/Save the unit/.test(h); })());
    ok("a 20 s guard is set", w.timers.length === 1 && w.timers[0].ms === 20000);
    commit(w.tx[0]); await tick();
    ok("commit → done once: one unit id in the library, the unit opens, a toast, the guard cleared", Object.keys(c.unitStudies).join() === "freshwater_fish" && c.ubForm === null && (c.opened || []).join() === "freshwater_fish" && w.toasts.length === 1 && w.timers[0].live === false && f.saving === false);
    ok("nothing else written (only the transaction)", w.writes.length === 0);
  }
  console.log("\n── unlock on abort and on error ──");
  {
    const w = world(), c = w.ctx, f = c.ubForm;
    c.ubSave(); abort(w.tx[0], { id: "freshwater_fish", addedTs: 1, title: "Someone else's" }); await tick();
    ok("not committed (another device's unit there) → unlocked, the existing message, the builder still open", f.saving === false && c.ubForm === f && /another device/.test(f.msg) && !c.unitStudies.freshwater_fish && w.timers[0].live === false);
    ok("…and the button is Save the unit again", /Save the unit/.test(c.ubPageHTML()) && !/Saving…/.test(c.ubPageHTML()));
    ok("…a fresh tap builds a fresh record (the stale one is not re-sent)", c.ubSave() && w.tx.length === 2 && f.pendingU === w.tx[1].f(null));
  }
  {
    const w = world(), c = w.ctx, f = c.ubForm;
    c.ubSave(); w.tx[0].rej(new Error("PERMISSION_DENIED")); await tick();
    ok("error → unlocked, its message shown, nothing in the library", f.saving === false && /PERMISSION_DENIED/.test(f.msg) && !c.unitStudies.freshwater_fish && !f.pendingU);
  }
  console.log("\n── a stuck network ──");
  {
    const w = world(), c = w.ctx, f = c.ubForm;
    const u = c.ubSave(); w.timers[0].f();
    ok("no answer in 20 s → unlocked with a plain line; the record waiting stays on the form", f.saving === false && /Still saving — check your connection, then tap Save again/.test(f.msg) && f.pendingU === u);
    c.unitStudies.freshwater_fish = u;   // the first try landed meanwhile and the listener brought it in
    c.ubSave();
    ok("the next tap re-sends the SAME id and addedTs (no _2), locks again", w.tx.length === 2 && w.tx[1].p === "unitStudies/freshwater_fish" && w.tx[1].f(null).addedTs === u.addedTs && f.saving === true);
    abort(w.tx[1], u); await tick();
    ok("the retry finds its own first try → done, one unit, no other-device message", c.ubForm === null && Object.keys(c.unitStudies).join() === "freshwater_fish" && !/another device/.test(f.msg || "") && w.toasts.length === 1);
    commit(w.tx[0]); await tick();
    ok("the late first answer changes nothing: still one unit, opened once, one toast", Object.keys(c.unitStudies).join() === "freshwater_fish" && (c.opened || []).length === 1 && w.toasts.length === 1);
  }
  {
    const w = world(), c = w.ctx, f = c.ubForm;
    c.ubSave(); w.timers[0].f(); commit(w.tx[0]); await tick();
    ok("stuck, then the first try lands after the line → done (once), no second transaction", w.tx.length === 1 && c.ubForm === null && Object.keys(c.unitStudies).join() === "freshwater_fish");
  }
  console.log("\n── dry run ──");
  {
    const w = world({ dry: true }), c = w.ctx, f = c.ubForm;
    const u = c.ubSave(), again = c.ubSave();
    ok("dry run: Save finishes at once — no transaction, nothing written, nothing left locked, no guard", u && w.tx.length === 0 && w.writes.length === 0 && f.saving === false && w.timers.length === 0 && c.ubForm === null && again === null && /dry run/.test(w.toasts[0]));
  }
  ok("no kid's name in the lock lines", !/lincoln|ellis|lucy|julian|taylor|makenzie|andrew|caleb/i.test(cut("// UBSAVELOCK", "// ── the screens")));
  console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
})().catch(e => { console.log("CRASH", e); process.exit(1); });
