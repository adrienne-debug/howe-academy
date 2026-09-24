/*
 * 🔔 Every awake device rings when a brain break ends (her yes 2026-09-23).
 * Live 9/23: one break rang on NO device (the starter left the card, the other only looked), and
 * Julian's rang only on the LG, late, when its TV screensaver lifted. Only a device showing the
 * countdown could ring, and only the first one to reach 0:00.
 *   run:  node test_bb_ring.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// BBRING_START"), b = src.indexOf("// BBRING_END");
if (a < 0 || b < 0) { console.error("BBRING markers not found"); process.exit(1); }
const BLOCK = src.slice(a, b);
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }

// one "device": its own memory + session; the shared brainBreaks tree is passed in (Firebase)
function device(shared, o) {
  o = o || {};
  const session = {}, rings = [], patches = [];
  let now = o.now;
  const ctx = {
    brainBreaks: shared, bbAlarmKid: null,
    bbPatchActive: (k, upd) => { patches.push([k, upd]); const act = shared[k] && shared[k].active; if (act) Object.assign(act, upd); },
    bbAlarmStart: k => { rings.push(k); ctx.bbAlarmKid = k; }, bbAlarmStop: () => { ctx.bbAlarmKid = null; ctx.stops++; }, stops: 0,
    _kioskD: () => !!o.dad, bbAlarmCtx: null,
    sessionStorage: { getItem: k => (k in session ? session[k] : null), setItem: (k, v) => { session[k] = String(v); } },
    Date: { now: () => now }, JSON, Object,
  };
  vm.createContext(ctx); vm.runInContext(BLOCK, ctx);
  return { ctx, rings, patches, watch: () => vm.runInContext("bbWatch()", ctx), at: t => { now = t; } };
}
const T0 = 1_000_000_000, MIN = 60000;
const brk = () => ({ julian: { active: { phase: "timer", minutes: 5, startedAt: T0, choice: "move" } } });

console.log("── a break ending rings on EVERY awake device, whatever screen it's on ──");
{
  const shared = brk();
  const tablet = device(shared, { now: T0 + 4 * MIN }), lg = device(shared, { now: T0 + 4 * MIN }), mom = device(shared, { now: T0 + 4 * MIN });
  [tablet, lg, mom].forEach(d => d.watch());
  ok("before 0:00 nobody rings", tablet.rings.length + lg.rings.length + mom.rings.length === 0);
  [tablet, lg, mom].forEach(d => d.at(T0 + 5 * MIN + 400));
  tablet.watch();
  ok("the first device to see 0:00 stamps it done with the exact end time", shared.julian.active.phase === "done" && shared.julian.active.endedAt === T0 + 5 * MIN);
  lg.watch(); mom.watch();
  ok("…and all three ring (not just the first)", tablet.rings.length === 1 && lg.rings.length === 1 && mom.rings.length === 1);
  [tablet, lg, mom].forEach(d => { d.at(T0 + 5 * MIN + 5000); d.watch(); });
  ok("each rings once, not every second", tablet.rings.length === 1 && lg.rings.length === 1 && mom.rings.length === 1);
}
console.log("\n── the live cases ──");
{
  const shared = brk();
  const other = device(shared, { now: T0 + 5 * MIN + 900 });   // only "looked at it" — not showing the card now
  other.watch();
  ok("nobody showing the countdown → it still rings", other.rings.length === 1 && shared.julian.active.phase === "done");
}
{
  const shared = brk();
  const lg = device(shared, { now: T0 + 9 * MIN });   // TV screensaver lifted 4 minutes after the end
  lg.watch();
  ok("a device waking 4 min late shows done but does NOT ring", lg.rings.length === 0 && shared.julian.active.phase === "done");
}
{
  const shared = brk();
  const lg = device(shared, { now: T0 + 6 * MIN });   // woke 1 minute late
  lg.watch();
  ok("under 2 minutes late still rings", lg.rings.length === 1);
}
{
  const shared = brk();
  const dad = device(shared, { now: T0 + 5 * MIN + 500, dad: true });
  dad.watch();
  ok("Dad's link never rings", dad.rings.length === 0);
}
console.log("\n── stopping ──");
{
  const shared = brk();
  const a1 = device(shared, { now: T0 + 5 * MIN + 100 }), a2 = device(shared, { now: T0 + 5 * MIN + 100 });
  a1.watch(); a2.watch();
  delete shared.julian.active;   // Julian tapped "Back to my work" on his tablet
  a2.at(T0 + 5 * MIN + 3000); a2.watch();
  ok("finishing the break on one device silences the others", a2.ctx.bbAlarmKid === null && a2.ctx.stops === 1);
}
{
  const shared = brk();
  const d1 = device(shared, { now: T0 + 5 * MIN + 100 });
  d1.watch();
  const d2 = device(shared, { now: T0 + 5 * MIN + 2000 });   // same browser tab after a reload: new memory…
  vm.runInContext("", d2.ctx);
  d2.ctx.sessionStorage.setItem("ha_bb_rung", d1.ctx.sessionStorage.getItem("ha_bb_rung"));   // …same session
  d2.watch();
  ok("a reload doesn't ring the same break twice", d2.rings.length === 0);
}
console.log("\n── the wiring in index.html ──");
ok("every device runs the watcher", /setInterval\(bbWatch,1000\);/.test(src));
ok("a tap unlocks sound", /document\.addEventListener\("pointerdown",bbAudioUnlock,true\);/.test(src));
ok("the countdown card's 0:00 uses the same path", /if\(rem<=0\)\{ clearInterval\(bbTimerInt\); bbTimerInt=null; bbEnd\(k,a\); bbMaybeRing\(k,a\); return; \}/.test(src));
ok("stopping the alarm keeps the (unlocked) sound context", !/bbAlarmCtx\.close\(\)/.test(src));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
