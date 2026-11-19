/*
 * test_house_grab_whocan.js — HOUSEGRABCAN (index.html): "who can grab it" is checked on the tap too, not only on the screen (her "Yes, fix
 * it" 2026-11-19; the gap since step 6a: gbInstant / gbClaim never asked it, so a kid Mom unticked could be written and paid from a screen
 * drawn before). The WHOLE app per device (test_fixtures/house_grabs_world.js: the made-up family kid_a … kid_d, a made-up pool and table,
 * switched with 🙌). No real family's names or data.
 *   1 the guards: kid_c's screen drawn while ticked, Mom unticks kid_c, then ✓ I did it now / 🔖 Grab for later / Mom's assign from the old
 *     screens → refused, unpaid, nothing written, no hold, redrawn; a ticked sibling still paid; a direct call is refused the same way
 *   2 a kid who holds it keeps it after being unticked (I did it now, Mark done, let go — then it is gone for them); gbMarkDone / gbLetGo
 *     act only on a held grab, so they need no guard; nobody stored = every kid
 *   3 mutation checks: each guard removed (and the holder's exception removed) in a copy of index.html → its check fails
 *   4 = the app before this change (pinned: `git show a2687b3e:…`), byte for byte, every kid's Up for Grabs and Mom's view each day, every
 *     write, the whole database: the pool not switched (saved / built-in / none × preview / ON, 14 days) and switched with nobody unticked
 *     and with kids unticked on some chores (off / preview / ON, 21 days), with grabs every day
 *   BASE_HTML=/path/to/before/index.html BASE_HOUSE=/path/to/before/house.js node test_house_grab_whocan.js   (default: `git show a2687b3e:…`,
 *   the commit just before this change — pinned, so the file means the same before and after it is on main; no such commit → 4 is skipped)
 *   HOUSE_INDEX=/path/to/other/index.html node test_house_grab_whocan.js   (a mutation check from outside)
 */
"use strict";
const fs = require("fs"), os = require("os"), path = require("path"), cp = require("child_process");
const F = require(path.join(__dirname, "test_fixtures", "house_grabs_world.js")), O = require(path.join(__dirname, "test_fixtures", "house_overflow_world.js"));
const HJS = fs.readFileSync(path.join(__dirname, "house.js"), "utf8"), IDX = process.env.HOUSE_INDEX || undefined;
const SRC_IDX = fs.readFileSync(IDX || path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 700) + ")" : "")); } };
const BEFORE = "a2687b3e", WAS = "the app before this change's";   // the commit before HOUSEGRABCAN
const show = f => { try { return cp.execSync("git show " + BEFORE + ":" + f, { cwd: __dirname, maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] }); } catch (e) { return null; } };
let BASE = process.env.BASE_HTML, BHJS = process.env.BASE_HOUSE ? fs.readFileSync(process.env.BASE_HOUSE, "utf8") : null;
if (!BASE) { const b = show("index.html"); if (b) { BASE = path.join(os.tmpdir(), "house_grabcan_base_" + process.pid + ".html"); fs.writeFileSync(BASE, b); } }
if (!BHJS) { const b = show("house.js"); if (b) BHJS = b.toString("utf8"); }
console.log("(base: " + (BASE && BHJS ? BASE : "none — git show " + BEFORE + " failed; part 4 is skipped") + ")");
const J = o => JSON.stringify(o), KIDS = F.KIDS, MUTS = [];
const R = (d, expr) => JSON.parse(d.run("JSON.stringify((function(){ " + expr + " })())"));
const writes = (w, m) => w.since(m).map(l => l.op + " " + l.path + " " + (l.keys || []).slice().sort().join(","));
const bal = (d, kid) => R(d, "return bankBalance(" + J(kid) + ");");
const pool = (d, kid, mom) => R(d, "return gbPool(" + J(kid) + "," + (mom ? "true" : "false") + ").map(function(x){ return x.i; });");
const set = async (S, js) => { S.A.run(js); await S.w.flush(); };
const mk = async (o) => { o = o || {}; const w = await F.world("saved", "preview", { index: o.index || IDX }); const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB");
  A.run(HJS); await w.flush(); await w.at(2026, 11, 18, 14, 0); A.run("hgOpen(); hgSwitch()"); await w.flush(); A.run("try{ renderAll(); hhRender(); }catch(e){}"); await w.flush(); return { w, A, B }; };
const mut = (name, a, b) => { const n = SRC_IDX.split(a).length - 1; if (n !== 1) { ok("(mutation " + name + ": its text occurs exactly once in index.html)", false, n); return null; } const p = path.join(os.tmpdir(), "house_grabcan_" + name + "_" + process.pid + ".html"); fs.writeFileSync(p, SRC_IDX.replace(a, b)); MUTS.push(p); return p; };

(async () => {
// ── 1 ── (also run against the mutated copies in part 3)
console.log("\n── 1 · the guards: a kid Mom unticked taps from a screen drawn before ──");
// The island (old number 1, 25 ⭐): kid_c's Up for Grabs and Mom's view of kid_c are drawn while every kid is ticked; then Mom unticks kid_c
// on the card (one path, household/jobs/<id>/can) and every device hears it.
const staleOf = async (o) => { const S = await mk(o), h = S.B.run("_grabsHTML('kid_c',false)"), m = S.A.run("_grabsHTML('kid_c',true)"); await set(S, "hgCan('gb_wipe_the_island','kid_c')"); return { S, h, m }; };
const tap = async (S, d, call, kid) => { const m = S.w.mark(), b = bal(S.B, kid); d.run(call); await S.w.flush(); return { wr: writes(S.w, m), paid: bal(S.B, kid) - b, rec: R(S.B, "return gbGet(1);"), held: R(S.B, "return gbHasActive(" + J(kid) + ");") }; };
const refused = t => t.wr.length === 0 && t.paid === 0 && t.rec === null && t.held === false;
async function guards(o, say) {
  const out = {};
  { const { S, h, m } = await staleOf(o); const t = await tap(S, S.B, "gbInstant('kid_c',1)", "kid_c"); out.instant = refused(t);
    if (say) { ok("(the old screens still have kid_c's ✓ I did it now and 🔖 Grab for later, and Mom's assign for kid_c)", /gbInstant\('kid_c',1\)/.test(h) && /gbClaim\('kid_c',1\)/.test(h) && /gc-assign">assign: [^]*?gbClaim\('kid_c',1\)/.test(m));
      ok("(…and Mom's untick is stored: who can grab it = kid_a, kid_b, kid_d)", J(R(S.A, "return hhJobs().gb_wipe_the_island.can;")) === J(["kid_a", "kid_b", "kid_d"]));
      ok("gbInstant — kid_c (unticked) taps ✓ I did it now from the old screen: refused — nothing written, unpaid, no record", out.instant, t);
      ok("…the screen redraws without it (the existing \"That one isn’t up for grabs any more.\")", !/gbInstant\('kid_c',1\)/.test(S.B.run("_grabsHTML('kid_c',false)"))); } }
  { const { S } = await staleOf(o); const t = await tap(S, S.B, "gbClaim('kid_c',1)", "kid_c"); out.claim = refused(t);
    if (say) ok("gbClaim — kid_c taps 🔖 Grab for later from the old screen: refused — nothing written, no hold (kid_c still free to grab another)", out.claim, t); }
  { const { S } = await staleOf(o); const t = await tap(S, S.A, "gbClaim('kid_c',1)", "kid_c"); out.assign = refused(t);
    if (say) ok("gbClaim from Mom's assign on her old view of kid_c: refused the same way", out.assign, t); }
  { const { S } = await staleOf(o); const t = await tap(S, S.B, "gbInstant('kid_b',1)", "kid_b"); out.sib = t.paid === 25 && !!t.rec && t.rec.by === "kid_b";
    if (say) ok("a ticked sibling (kid_b) still does it: paid 25, the record theirs", out.sib, t); }
  { const { S } = await staleOf(o); const t = await tap(S, S.A, "gbClaim('kid_d',1)", "kid_d"); out.sibAssign = !!t.rec && t.rec.by === "kid_d" && !t.rec.done;
    if (say) ok("…and Mom's assign to a ticked kid (kid_d) still holds it for them", out.sibAssign, t); }
  return out;
}
const G0 = await guards({}, true);
{ const S = await mk(); await set(S, "hgCan('gb_wipe_the_island','kid_c')"); const m = S.w.mark(); S.B.run("gbInstant('kid_c',1); gbClaim('kid_c',1)"); await S.w.flush();
  ok("direct calls with no screen at all (gbInstant / gbClaim for an unticked kid): nothing written", S.w.since(m).length === 0 && R(S.B, "return gbGet(1);") === null); }

// ── 2 ──
console.log("\n── 2 · a kid who holds it keeps it; nobody stored = every kid ──");
async function holder(o, say) {
  const out = {};
  { const S = await mk(o); S.B.run("gbClaim('kid_c',1)"); await S.w.flush(); await set(S, "hgCan('gb_wipe_the_island','kid_c')");
    out.kept = pool(S.B, "kid_c").includes(1) && /gbMarkDone\('kid_c',1\)/.test(S.B.run("_grabsHTML('kid_c',false)")) && R(S.B, "return gbHasActive('kid_c');") === true;
    const t = await tap(S, S.B, "gbMarkDone('kid_c',1)", "kid_c"); out.mark = t.paid === 25 && t.rec.by === "kid_c" && t.rec.done;
    if (say) { ok("kid_c holds the island for later, then Mom unticks kid_c: still on kid_c's list with ✓ Mark done; \"one at a time\" still counts it", out.kept);
      ok("…kid_c marks it done: paid 25, the record theirs", out.mark, t); } }
  { const S = await mk(o); S.B.run("gbClaim('kid_c',1)"); await S.w.flush(); await set(S, "hgCan('gb_wipe_the_island','kid_c')");
    const t = await tap(S, S.B, "gbInstant('kid_c',1)", "kid_c"); out.instant = t.paid === 25 && t.rec.done;
    if (say) ok("…a holder's ✓ I did it now (the holder's exception) is paid too", out.instant, t); }
  { const S = await mk(o); S.B.run("gbClaim('kid_c',1)"); await S.w.flush(); await set(S, "hgCan('gb_wipe_the_island','kid_c')"); S.B.run("gbLetGo('kid_c',1)"); await S.w.flush();
    out.letgo = !pool(S.B, "kid_c").includes(1) && R(S.B, "return gbGet(1);") === null && pool(S.B, "kid_b").includes(1);
    const t = await tap(S, S.B, "gbClaim('kid_c',1)", "kid_c"); out.after = refused(t);
    if (say) { ok("…or lets it go: it leaves kid_c's list and is open again for the ticked kids", out.letgo);
      ok("…and a 🔖 Grab for later from kid_c after that (screen not redrawn) is refused", out.after, t); } }
  return out;
}
const H0 = await holder({}, true);
{ const S = await mk(); const m = S.w.mark(); S.B.run("gbMarkDone('kid_c',1); gbLetGo('kid_c',1)"); await S.w.flush();
  ok("gbMarkDone / gbLetGo on a grab the kid does not hold do nothing (they act only on a held grab, so they need no who-can guard)", S.w.since(m).length === 0 && R(S.B, "return gbGet(1);") === null);
  ok("nobody stored (every row as the switch made it) = every kid: each kid's ✓ I did it now on a different chore is paid", (await (async () => { const r = []; for (const [k, i] of [["kid_a", 0], ["kid_b", 1], ["kid_c", 4], ["kid_d", 6]]) { const b = bal(S.B, k); S.B.run("gbInstant('" + k + "'," + i + ")"); await S.w.flush(); r.push(bal(S.B, k) - b); } return r; })()).every(x => x > 0)); }

// ── 3 ──
console.log("\n── 3 · mutation checks: each guard removed → its check fails ──");
{ const mi = mut("instant", "if(s&&s.done) return; if(!(s&&s.by===kid)&&_gbCanNo(i,kid)) return; if(_gbGone(i)) return;", "if(s&&s.done) return; if(_gbGone(i)) return;");
  if (mi) { const g = await guards({ index: mi }); ok("M1 gbInstant's who-can guard removed → the stale ✓ I did it now is written and paid (the gbInstant check fails); gbClaim's still holds", !g.instant && g.claim && g.assign && g.sib, g); }
  const mc = mut("claim", "if(s&&s.by&&s.by!==kid) return; if(!(s&&s.by===kid)&&_gbCanNo(i,kid)) return;", "if(s&&s.by&&s.by!==kid) return;");
  if (mc) { const g = await guards({ index: mc }); ok("M2 gbClaim's who-can guard removed → the stale Grab for later and Mom's stale assign are written (both checks fail); gbInstant's still holds", !g.claim && !g.assign && g.instant, g); }
  const mh = mut("holder", "if(s&&s.done) return; if(!(s&&s.by===kid)&&_gbCanNo(i,kid)) return;", "if(s&&s.done) return; if(_gbCanNo(i,kid)) return;");
  if (mh) { const h = await holder({ index: mh }); ok("M3 the holder's exception removed from gbInstant → an unticked holder's ✓ I did it now is refused (the holder check fails)", !h.instant && h.kept, h); }
}

// ── 4 ──
console.log("\n── 4 · = " + WAS + " (pinned " + BEFORE + "), byte for byte ──");
const dOf = n => new Date(2026, 10, 16 + n), isoN = n => { const d = dOf(n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const go = (w, n, h, mi) => { const d = dOf(n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h, mi || 0); };
const snap = S => J({ kid: F.kidHTML(S.B), mom: F.kidHTML(S.A, true) });
// One day of grabs, picked by name from each kid's own list (so two worlds do the same): I did it now, Grab for later, Mark done, Let go,
// Mom's assign and release, and the day's ×2 offers.
async function dayOf(S, n) {
  const { w, A, B } = S, pick = (kid, k) => { const p = F.poolNames(B, kid); return p.length ? p[k % p.length] : null; };
  await go(w, n, 8, 0); { const l = pick("kid_a", n); if (l) F.act(B, "gbInstant", "kid_a", l); }
  { const held = R(B, "const x=gbPool('kid_b',false).find(function(x){ const s=gbCur(x.i); return s&&s.by==='kid_b'&&!s.done; }); return x?x.g.label:'';");
    if (held && n % 2) F.act(B, "gbMarkDone", "kid_b", held); else if (!held) { const l = pick("kid_b", n + 1); if (l) F.act(B, "gbClaim", "kid_b", l); } }
  await w.flush(); await go(w, n, 12, 0); { const l = pick("kid_c", n + 2); if (l) { F.act(B, "gbClaim", "kid_c", l); await w.flush(); if (n % 3) F.act(B, "gbLetGo", "kid_c", l); } }
  await w.flush(); await go(w, n, 15, 0); { const l = pick("kid_d", n + 3); if (l) { F.act(A, "gbClaim", "kid_d", l); await w.flush(); await go(w, n, 16, 0); if (n % 2) F.act(B, "gbMarkDone", "kid_d", l); else F.act(A, "gbLetGo", "kid_d", l); } }
  await w.flush(); await go(w, n, 17, 0);
  for (const k of ["kid_c", "kid_a"]) { const t = isoN(n), o = R(B, "return hdGrabRows(" + J(k) + ",false).filter(function(x){ return !x.d&&!x.g.by; }).map(function(x){ return x.id; });");
    if (o.length) { if (k === "kid_c" || n % 2) B.run("hdGrabDone(" + J(k) + "," + J(t) + "," + J(o[0]) + ")"); else { B.run("hdGrabHold(" + J(k) + "," + J(t) + "," + J(o[0]) + ")"); await w.flush(); B.run("hdGrabLetGo(" + J(k) + "," + J(t) + "," + J(o[0]) + ")"); } await w.flush(); } }
  await go(w, n, 18, 0); S.A.run("try{ renderAll(); hhRender(); }catch(e){}"); await w.flush();
}
const replay = async (kind, mode, days, sw, unt, index, hjs) => { const w = await F.world(kind, mode, { index, household: O.household(mode, {}) }), A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"), S = { w, A, B }, shots = [];
  A.run(hjs); await w.flush(); await go(w, 0, 7, 0); if (sw) { A.run("hgOpen(); hgSwitch()"); await w.flush(); } if (unt) { A.run(unt); await w.flush(); }
  for (let n = 0; n < days; n++) { await dayOf(S, n); shots.push(snap(S)); }
  return { shots, writes: writes(w, 0).join("\n"), tree: J(w.db.tree.root), gc: Object.keys(w.get("grabClaims") || {}).length }; };
const cmp = (label, N, B0, days) => {
  const bad = N.shots.map((s, i) => s === B0.shots[i] ? null : isoN(i)).filter(Boolean);
  ok(label + " · every kid's Up for Grabs (their screen and Mom's) = " + WAS + " on all " + days + " days", bad.length === 0, bad.slice(0, 3));
  ok(label + " · every write = " + WAS + ", in order (" + N.writes.split("\n").length + " writes)", N.writes === B0.writes, (() => { const x = N.writes.split("\n"), y = B0.writes.split("\n"); const i = x.findIndex((l, j) => l !== y[j]); return [i, x[i], y[i]]; })());
  ok(label + " · the whole database = " + WAS + ", byte for byte", N.tree === B0.tree);
  ok(label + " · (sanity) " + (N.gc ? "the kids grabbed (" + N.gc + " grab records)" : "no grab record (no pool)"), N.gc >= 8 || /none/.test(label), N.gc);
};
const UNT = "hgCan('gb_wipe_the_island','kid_c'); hgCan('gb_sweep_the_garage','kid_d'); hgCan('gb_sweep_the_garage','kid_a'); hgCan('gb_wash_the_porch_window','kid_b')";
if (BASE && BHJS) {
  for (const kind of ["saved", "builtin", "none"]) for (const mode of ["preview", "on"]) cmp(kind + " · " + mode + " · not switched", await replay(kind, mode, 14, false, "", IDX, HJS), await replay(kind, mode, 14, false, "", BASE, BHJS), 14);
  for (const mode of ["off", "preview", "on"]) cmp("saved · " + mode + " · switched, nobody unticked", await replay("saved", mode, 21, true, "", IDX, HJS), await replay("saved", mode, 21, true, "", BASE, BHJS), 21);
  for (const mode of ["preview", "on"]) cmp("builtin · " + mode + " · switched, kids unticked on 3 chores (taps only from fresh screens)", await replay("builtin", mode, 21, true, UNT, IDX, HJS), await replay("builtin", mode, 21, true, UNT, BASE, BHJS), 21);
}

console.log("\n" + pass + " passed, " + fail + " failed");
for (const p of MUTS.concat(BASE && !process.env.BASE_HTML ? [BASE] : [])) try { fs.unlinkSync(p); } catch (e) {}
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
