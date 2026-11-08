// 🗑 UNITDEL — Delete unit (her ask 2026-11-07: "need a delet button for the the units that we make she accidently added a unit
//   3 times"). Runs the REAL UNITDEL block with the REAL psPointers (PUTSCHED) for the schedule check.
//   · allowed on a Builder unit nothing uses; a starter / code unit never shows the button
//   · blocked (one plain line, nothing written) when a kid is enrolled, has work saved in it, or the schedule points at it
//   · two taps: the first arms "Tap again to delete <title>" for 6 s, the second deletes; the arm expires
//   · ONE targeted remove of unitStudies/<id>; local copy gone, back to the list, a toast; ?dryrun=1 writes nothing; not Mom → nothing
//   run: node test_unit_delete.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const UD = cut("// UNITDEL_START", "// UNITDEL_END");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const esc = v => String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const built = (id, extra) => Object.assign({ id, title: "Freshwater Fish", emoji: "🐟", author: { family: "f", first: "Mom" }, sources: [], decks: [{ key: "Fish", cards: [{ name: "a" }] }] }, extra || {});
function world(o) {
  o = o || {}; const writes = [], timers = [], toasts = [];
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isFinite,
    unitStudies: o.units || {}, unitOpenId: o.open || null, momHere: () => o.mom !== false, _dryRun: () => !!o.dry,
    db: { ref: p => ({ remove: () => writes.push(["remove", p]), set: v => writes.push(["set", p, v]), update: v => writes.push(["update", p, v]) }) },
    cap: s => s ? s[0].toUpperCase() + s.slice(1) : s, gwShowToast: m => toasts.push(m), setTimeout: (f, ms) => { timers.push([f, ms]); return timers.length; },
    renderUnits: () => { ctx.paints = (ctx.paints || 0) + 1; }, paints: 0, document: { getElementById: id => id === "content" ? {} : null },
    famDefs: () => o.fam || {}, famList: x => Array.isArray(x) ? x : Object.values(x || {}), famTrack: it => (it && it.track) || null, currData: { subjects: o.subs || {} } };
  vm.createContext(ctx);
  vm.runInContext("let unitOpenId=this.unitOpenId;\n" + cut("// PUTSCHED_START", "// PUTSCHED_END") + "\n" + UD + "\nObject.defineProperty(this,'udelArmed',{get:()=>udelArmed});Object.defineProperty(this,'openId',{get:()=>unitOpenId});", ctx);
  return { ctx, writes, timers, toasts };
}

console.log("── allowed when nothing uses it ──");
{
  const w = world({ units: { freshwater_fish: built("freshwater_fish"), freshwater_fish_2: built("freshwater_fish_2") }, open: "freshwater_fish_2" }), c = w.ctx;
  const u = c.unitStudies.freshwater_fish_2;
  ok("a Builder unit with no kid and nothing scheduled has no blockers", c.udelBlockers(u).length === 0);
  ok("the unit page shows 🗑 Delete unit (a real button, unarmed)", /onclick="unitDelete\('freshwater_fish_2'\)"/.test(c.udelHtml(u, esc)) && /Delete unit/.test(c.udelHtml(u, esc)));
  ok("first tap only arms it: nothing written, nothing deleted, a 6 s timer set, repainted", c.unitDelete("freshwater_fish_2") === false && w.writes.length === 0 && c.unitStudies.freshwater_fish_2 && c.udelArmed === "freshwater_fish_2" && w.timers.length === 1 && w.timers[0][1] === 6000 && c.paints === 1);
  ok("armed, the button reads “Tap again to delete <title>”", /Tap again to delete Freshwater Fish/.test(c.udelHtml(u, esc)));
  ok("second tap deletes: exactly ONE write, a remove of unitStudies/<id>", c.unitDelete("freshwater_fish_2") === true && JSON.stringify(w.writes) === JSON.stringify([["remove", "unitStudies/freshwater_fish_2"]]), w.writes);
  ok("…the local copy is gone, the other copy untouched, back to the list, a toast", !c.unitStudies.freshwater_fish_2 && !!c.unitStudies.freshwater_fish && c.openId === null && c.udelArmed === null && /Freshwater Fish deleted/.test(w.toasts[0]) && !/dry run/.test(w.toasts[0]));
}
{
  const w = world({ units: { a: built("a"), b: built("b") } }), c = w.ctx;
  c.unitDelete("a"); w.timers[0][0]();
  ok("the arm expires after 6 s: the next tap arms again, nothing written", c.udelArmed === null && c.unitDelete("a") === false && w.writes.length === 0 && c.udelArmed === "a");
  c.unitDelete("b");
  ok("arming another unit moves the arm — a tap on b after a never deletes b", c.udelArmed === "b" && w.writes.length === 0 && !!c.unitStudies.b);
}
console.log("\n── blocked when something uses it ──");
{
  const w = world({ units: { f3: built("f3", { enrolled: { kidone: true } }) } }), c = w.ctx, u = c.unitStudies.f3;
  ok("a kid enrolled → one plain line naming the kid, no button", /Kidone is enrolled in this unit/.test(c.udelHtml(u, esc)) && !/unitDelete\(/.test(c.udelHtml(u, esc)));
  ok("…and unitDelete refuses on any tap: nothing written, nothing armed, the unit stays", c.unitDelete("f3") === false && c.unitDelete("f3") === false && w.writes.length === 0 && c.udelArmed === null && !!c.unitStudies.f3);
  ok("enrolled:false does not count as enrolled", world().ctx.udelBlockers(built("x", { enrolled: { kidone: false } })).length === 0);
}
{
  const c = world().ctx;
  ok("a kid's work saved in it (activity log) blocks", /Kidtwo has work saved/.test(c.udelBlockers(built("x", { activityLog: { kidtwo: { craft: { ts: 1 } } } }))[0]));
  ok("…an empty log does not", c.udelBlockers(built("x", { activityLog: { kidtwo: {} } })).length === 0);
}
{
  const subs = { kidthree: { fish: { display: "Fish study", unit: { id: "f2" } } } };
  const c = world({ units: { f2: built("f2") }, subs }).ctx;
  ok("a kid's subject on the schedule (.unit) blocks, named", /Kidthree’s Fish study on the schedule uses this unit/.test(c.udelBlockers(c.unitStudies.f2)[0]));
  const fam = { blk: { name: "Morning time", items: [{ key: "fish", name: "Fish", track: { mode: "seq", list: [{ t: "Day 1", u: { id: "f2", d: "d1" } }] } }] } };
  const c2 = world({ units: { f2: built("f2") }, fam }).ctx;
  ok("a family item's in-order line (u.id) blocks, named with its block", /“Fish” in Morning time uses this unit/.test(c2.udelBlockers(c2.unitStudies.f2)[0]));
  const famW = { blk: { name: "Morning time", items: [{ key: "fish", name: "Fish", track: { mode: "week", unit: { id: "f2", fromWeek: 1 } } }] } };
  const c3 = world({ units: { f2: built("f2") }, fam: famW }).ctx;
  ok("a week-by-week family item (track.unit) blocks", c3.udelBlockers(c3.unitStudies.f2).length === 1);
}
console.log("\n── only Builder units; Mom only; dry run ──");
{
  const c = world().ctx;
  ok("a starter unit never shows the button", c.udelHtml({ id: "nc_frogs", title: "Frogs", starter: true, author: { first: "x" } }, esc) === "");
  ok("a unit with no author (the code's / catalog's) never shows it, and unitDelete refuses", c.udelHtml({ id: "lang", title: "LA" }, esc) === "" && (() => { const w = world({ units: { lang: { id: "lang", title: "LA" } } }); w.ctx.unitDelete("lang"); w.ctx.unitDelete("lang"); return w.writes.length === 0 && !!w.ctx.unitStudies.lang; })());
}
{
  const w = world({ mom: false, units: { a: built("a") } }), c = w.ctx;
  ok("not Mom: no button, unitDelete does nothing", c.udelHtml(c.unitStudies.a, esc) === "" && c.unitDelete("a") === false && c.unitDelete("a") === false && w.writes.length === 0 && c.udelArmed === null);
}
{
  const w = world({ dry: true, units: { a: built("a") }, open: "a" }), c = w.ctx;
  c.unitDelete("a"); const r = c.unitDelete("a");
  ok("?dryrun=1: two taps write NOTHING; the local copy goes, the toast says dry run", r === true && w.writes.length === 0 && !c.unitStudies.a && /dry run/.test(w.toasts[0]));
}
{
  const blk = UD;
  ok("the only database call in the block is ONE remove of unitStudies/<id>, behind the live check", (blk.match(/db\.ref\(/g) || []).length === 1 && /if\(live\) db\.ref\("unitStudies\/"\+id\)\.remove\(\)/.test(blk) && !/\.set\(|\.update\(/.test(blk));
  ok("no confirm() / alert() in the block's code", !/confirm\(|alert\(/.test(blk.split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n")));
  ok("no kid's or family's name in the block", !/lincoln|ellis|lucy|julian|taylor|makenzie|andrew|caleb|dewalt|burris|howe/i.test(blk));
  ok("the unit page calls it in the Mom panel", /if\(typeof udelHtml==="function"\) h\+=udelHtml\(u,esc\);/.test(cut("function renderUnitDetail(", "const enrolledKids=")));
}
console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
