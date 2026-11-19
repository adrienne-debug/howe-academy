/*
 * test_house_grabs_world.js — HOUSEGRABS, Household by room step 6a (DESIGN_household_rooms_2026-11-15 §2.3 problem 7, §4.7, §13; her
 * "Yes, start 6a" 2026-11-18), the WHOLE app: test_fixtures/house_grabs_world.js (every device runs index.html over one in-memory
 * Firebase and one virtual clock) on the made-up family, with a made-up Up for Grabs pool and a table whose rows do not match it.
 * Every day the kids use Up for Grabs the way they do: I did it now, Grab for later, Mark done, Let go, and Mom assigns and releases.
 *   A  nothing switched: 60 days × plan off / preview / ON × a family on the built-in list, one with a saved list, one with none — every
 *      kid's Up for Grabs (their screen and Mom's), every write and the whole database = main's, byte for byte
 *   B  🙌 Switch at 2 PM with one kid holding a grab for later and another having done one: every screen, the database outside
 *      household/ and the only write; then the held one is marked done (same stars, same Click-off Log line) and the done one stays
 *      in its cooldown — the same as a world that never switched
 *   C  a switched world against one that never switched, 60 days (off / preview / ON; built-in and saved): every kid's screen every day,
 *      the stars, the logs and the grab records — through the weekly reseed and every cooldown
 *   D  ↩ Undo a week later: the whole database byte for byte the never-switched world's, and the next week too
 *   E  a kid's device open across the switch: a tap before it hears is kept and paid once; a tap on a chore Mom left out is refused
 *      after; the device is either all old or all new
 *   F  loading and drawing every page with the switch stored writes exactly what it writes without it (no write on load)
 *   BASE_HTML=/path/to/main/index.html BASE_HOUSE=/path/to/main/house.js node test_house_grabs_world.js   (default: `git show origin/main:…`)
 */
"use strict";
const fs = require("fs"), os = require("os"), path = require("path"), cp = require("child_process"), F = require(path.join(__dirname, "test_fixtures", "house_grabs_world.js"));
const HJS = fs.readFileSync(path.join(__dirname, "house.js"), "utf8");
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 700) + ")" : "")); } };
const show = f => { try { return cp.execSync("git show origin/main:" + f, { cwd: __dirname, maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] }); } catch (e) { return null; } };
let BASE = process.env.BASE_HTML, BHJS = process.env.BASE_HOUSE ? fs.readFileSync(process.env.BASE_HOUSE, "utf8") : null;
if (!BASE) { const b = show("index.html"); if (b) { BASE = path.join(os.tmpdir(), "house_grabs_base_" + process.pid + ".html"); fs.writeFileSync(BASE, b); } }
if (!BHJS) { const b = show("house.js"); if (b) BHJS = b.toString("utf8"); }
console.log("(base: " + (BASE && BHJS ? BASE : "none — git show failed; part A is skipped") + ")");
const J = o => JSON.stringify(o), clone = o => JSON.parse(J(o)), KIDS = F.KIDS;
const dOf = n => new Date(2026, 10, 16 + n);   // day n of the replay (day 0 = Mon 11/16)
const isoN = n => { const d = dOf(n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const go = (w, n, h, mi) => { const d = dOf(n); return w.at(d.getFullYear(), d.getMonth() + 1, d.getDate(), h, mi || 0); };
const writes = (w, m) => w.since(m).map(l => l.op + " " + l.path + " " + (l.keys || []).slice().sort().join(","));
const noHH = t => { const o = clone(t); delete o.household; return J(o); };
// With the plan ON a day's record keeps a signature of the table (built/sig) so Mom is asked "Re-lay today too / Keep today" after a
// table change; the switch IS a table change (as any Up for Grabs card edit is on main), so C and D compare that part on its own.
const noSig = t => { const o = clone(t); Object.keys(o.houseDay || {}).forEach(k => { const d = o.houseDay[k]; if (d.built) delete d.built.sig; delete d.keep; }); return o; };
const outHH = t => noHH(noSig(t));
const R = (d, expr) => JSON.parse(d.run("JSON.stringify((function(){ " + expr + " })())"));
const pool = (d, kid) => F.poolNames(d, kid);
const mkW = async (kind, mode, o) => { o = o || {}; const w = await F.world(kind, mode, o); const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"); A.run(o.hjs || HJS); await w.flush(); return { w, A, B }; };
const drawn = async S => { S.A.run("try{ renderAll(); hhRender(); }catch(e){}"); await S.w.flush(); };
const snap = S => J({ kid: F.kidHTML(S.B), mom: F.kidHTML(S.A, true).map(h => h.replace(/<span onclick="event\.stopPropagation\(\);hcGo\('[^']*'\)" title="Edit this chore" style="[^"]*">✎<\/span>/g, "")) });
// One day of Up for Grabs, picked by name from each kid's own list, so two worlds do the same thing to the same chore.
async function dayOf(S, n) {
  const { w, A, B } = S, pick = (kid, k) => { const p = pool(B, kid); return p.length ? p[k % p.length] : null; };
  await go(w, n, 8, 0); { const l = pick("kid_a", n); if (l) F.act(B, "gbInstant", "kid_a", l); }
  { const held = R(B, "const x=gbPool('kid_b',false).find(function(x){ const s=gbCur(x.i); return s&&s.by==='kid_b'&&!s.done; }); return x?x.g.label:'';");
    if (held && n % 2) F.act(B, "gbMarkDone", "kid_b", held); else if (!held) { const l = pick("kid_b", n + 1); if (l) F.act(B, "gbClaim", "kid_b", l); } }
  await w.flush(); await go(w, n, 12, 0); { const l = pick("kid_c", n + 2); if (l) { F.act(B, "gbClaim", "kid_c", l); await w.flush(); if (n % 3) F.act(B, "gbLetGo", "kid_c", l); } }
  await w.flush(); await go(w, n, 15, 0); { const l = pick("kid_d", n + 3); if (l) { F.act(A, "gbClaim", "kid_d", l); await w.flush(); await go(w, n, 16, 0); if (n % 2) F.act(B, "gbMarkDone", "kid_d", l); else F.act(A, "gbLetGo", "kid_d", l); } }   // Mom assigns; kid_d does it, or Mom releases
  await w.flush(); await go(w, n, 18, 0); await drawn(S);
}

(async () => {
// ── A ──
console.log("\n── A · nothing switched: 60 days, every kid's Up for Grabs, every write, the whole database = main's ──");
if (BASE && BHJS) for (const kind of ["builtin", "saved", "none"]) for (const mode of ["off", "preview", "on"]) {
  const replay = async (index, hjs) => { const S = await mkW(kind, mode, { index, hjs, extra: mode === "on" ? h => Object.keys(h.people).forEach(k => { h.people[k] = { school: 300, weekend: 300 }; }) : undefined }), shots = [];   // step 6b: ON = main only where nothing fits nobody (what does is test_house_overflow_world B)
    for (let n = 0; n < 60; n++) { await dayOf(S, n); shots.push(snap(S)); }
    return { shots, writes: writes(S.w, 0).join("\n"), tree: J(S.w.db.tree.root), gc: Object.keys(S.w.get("grabClaims") || {}).length }; };
  const N = await replay(undefined, HJS), O = await replay(BASE, BHJS);
  const bad = N.shots.map((s, i) => s === O.shots[i] ? null : isoN(i)).filter(Boolean);
  ok(kind + " · " + mode + " · every kid's Up for Grabs (their screen and Mom's) = main's on all 60 days", bad.length === 0, bad.slice(0, 3));
  ok(kind + " · " + mode + " · every write in 60 days = main's, in order (" + N.writes.split("\n").length + " writes)", N.writes === O.writes, (() => { const x = N.writes.split("\n"), y = O.writes.split("\n"); const i = x.findIndex((l, j) => l !== y[j]); return [i, x[i], y[i]]; })());
  ok(kind + " · " + mode + " · the whole database after 60 days = main's, byte for byte", N.tree === O.tree);
  ok(kind + " · " + mode + " · (sanity) " + (kind === "none" ? "no grab was ever written" : "the kids grabbed every week (" + N.gc + " grab records)"), kind === "none" ? N.gc === 0 : N.gc >= 30, N.gc);
}

// ── B ──
for (const mode of ["preview", "on"]) {
  console.log("\n── B · 🙌 Switch at 2 PM, one grab held for later and one done (" + mode + ") ──");
  const X = await mkW("saved", mode), Y = await mkW("saved", mode);
  for (const S of [X, Y]) { await go(S.w, 2, 9, 0); F.act(S.B, "gbInstant", "kid_a", "Wipe the island"); F.act(S.B, "gbClaim", "kid_b", "Scrub the hall toilet"); await S.w.flush(); await go(S.w, 2, 14, 0); await drawn(S); }
  const s0 = snap(X), t0 = noHH(X.w.db.tree.root), m0 = X.w.mark(), bal = S => R(S.B, "return " + J(KIDS) + ".map(bankBalance);");
  X.A.run("hgOpen(); hgSwitch()"); Y.A.run("renderAll()"); await X.w.flush(); await Y.w.flush();
  ok(mode + " · the only write is the switch: ONE update under household/", (() => { const wr = X.w.since(m0); return wr.length === 1 && wr[0].op === "update" && wr[0].keys.every(k => /^household\//.test(k)); })(), writes(X.w, m0));
  ok(mode + " · every kid's Up for Grabs and Mom's view: byte for byte as before, and as the world that did not switch", snap(X) === s0 && snap(X) === snap(Y));
  ok(mode + " · the database outside household/ (grab records, stars, the Click-off Log): as before, and as the world that did not switch", noHH(X.w.db.tree.root) === t0 && t0 === noHH(Y.w.db.tree.root));
  ok(mode + " · kid_b still holds the toilet (one at a time: no other grab), kid_a's island is still done", R(X.B, "return [(gbCur(2)||{}).by, gbHasActive('kid_b'), (gbCur(1)||{}).done];").join() === "kid_b,true,true" && !pool(X.B, "kid_c").includes("Wipe the island") && !pool(X.B, "kid_c").includes("Scrub the hall toilet"));
  const b0 = bal(X); for (const S of [X, Y]) { await go(S.w, 2, 15, 0); F.act(S.B, "gbMarkDone", "kid_b", "Scrub the hall toilet"); await S.w.flush(); }
  ok(mode + " · kid_b marks it done: the same stars (40 + the Wednesday bathroom bonus 5) as the world that did not switch", bal(X)[1] - b0[1] === 45 && J(bal(X)) === J(bal(Y)), [bal(X), bal(Y)]);
  ok(mode + " · …the same Click-off Log line and grab records — the database outside household/ = the world that did not switch", noHH(X.w.db.tree.root) === noHH(Y.w.db.tree.root) && /Scrub the hall toilet \(zone bonus \+5\)/.test(J(X.w.get("routineLog/kid_b"))));
  for (const S of [X, Y]) { await go(S.w, 3, 8, 0); }
  ok(mode + " · next day: the island and the toilet come back (daily cooldown), in both worlds alike", ["Wipe the island", "Scrub the hall toilet"].every(l => pool(X.B, "kid_c").includes(l)) && snap(X) === snap(Y));
  { const Z = await mkW("saved", mode); await go(Z.w, 2, 9, 0); F.act(Z.B, "gbClaim", "kid_b", "Wipe the island"); await Z.w.flush(); await go(Z.w, 2, 14, 0);
    Z.A.run("hgOpen(); hgSheet.ch={f1_pts:'table'}; hgSwitch()"); await Z.w.flush(); const z0 = R(Z.B, "return bankBalance('kid_b');"); F.act(Z.B, "gbMarkDone", "kid_b", "Wipe the island"); await Z.w.flush();
    ok(mode + " · (her choice: the table's 20 ⭐ for the island) a grab held across the switch pays the stars on its card when marked done", R(Z.B, "return bankBalance('kid_b');") - z0 === 20); }
}

// ── C, D ──
for (const kind of ["saved", "builtin"]) for (const mode of ["off", "preview", "on"]) {
  console.log("\n── C · switched on day 0 vs never switched, 60 days (" + kind + ", " + mode + ") ──");
  const X = await mkW(kind, mode), Y = await mkW(kind, mode); let bad = [], badT = [];
  for (const S of [X, Y]) { await go(S.w, 0, 7, 0); await drawn(S); }
  X.A.run("hgOpen(); hgSwitch()"); Y.A.run("renderAll()"); await X.w.flush(); await Y.w.flush();
  ok(kind + " · " + mode + " · switched", R(X.B, "return gbSwOn();") === true && R(Y.B, "return gbSwOn();") === false);
  if (mode === "on") { const t = isoN(0), asked = X.A.run("hdAsking('" + t + "')"), m = X.w.mark(); X.A.run("hdRelay('" + t + "')"); await X.w.flush();
    ok(kind + " · on · the switch is a table change, so Mom is asked once “Re-lay today too / Keep today” — and re-laying changes no chore in the plan (Up for Grabs rows are never handed out)",
      asked === true && Y.A.run("hdAsking('" + t + "')") === false && writes(X.w, m).length === 1 && X.w.since(m)[0].keys.every(k => /\/(built\/sig|keep)$/.test(k)), [asked, writes(X.w, m)]); }
  const undoAt = 7;
  for (let n = 0; n < 60; n++) {
    if (n === undoAt && mode !== "off") { const why = X.A.run("hgUndoWhy()"); X.A.run("hgUndo()"); Y.A.run("renderAll()"); await X.w.flush(); await Y.w.flush();
      console.log("\n── D · ↩ Undo on day " + n + " (" + kind + ", " + mode + ") ──");
      ok(kind + " · " + mode + " · Undo a week later is allowed (the kids' grabs never block it)", why === "", why);
      ok(kind + " · " + mode + " · …and the WHOLE database is byte for byte the world that never switched" + (mode === "on" ? " (but each day's table signature, compared next)" : ""), J(noSig(X.w.db.tree.root)) === J(noSig(Y.w.db.tree.root)));
      ok(kind + " · " + mode + " · …and every kid's Up for Grabs", snap(X) === snap(Y)); }
    for (const S of [X, Y]) await dayOf(S, n);
    if (snap(X) !== snap(Y)) bad.push(isoN(n));
    if (outHH(X.w.db.tree.root) !== outHH(Y.w.db.tree.root)) badT.push(isoN(n));
    if (n === 6) { ok(kind + " · " + mode + " · the switched week: every kid's Up for Grabs, every day = the world that never switched", bad.length === 0, bad.slice(0, 3));
      ok(kind + " · " + mode + " · …the stars, the Click-off Log and the grab records (everything outside household/), every day", badT.length === 0, badT.slice(0, 3)); }
  }
  ok(kind + " · " + mode + " · 60 days" + (mode !== "off" ? " (undone on day " + undoAt + ")" : "") + ": every kid's Up for Grabs every day = the world that never switched (weekly reseed, 2-week and weekday cooldowns, the Wednesday bonus)", bad.length === 0, bad.slice(0, 3));
  ok(kind + " · " + mode + " · …and everything outside household/, every day", badT.length === 0, badT.slice(0, 3));
  ok(kind + " · " + mode + " · (sanity) the kids earned stars from grabs in both worlds alike", (() => { const s = R(X.B, "return " + J(KIDS) + ".map(bankBalance);"); return s.some(x => x > 0) && J(s) === J(R(Y.B, "return " + J(KIDS) + ".map(bankBalance);")); })());
  if (mode !== "off") ok(kind + " · " + mode + " · after the Undo the whole database stays the never-switched world's to the end" + (mode === "on" ? " (every day laid after the Undo has the same table signature too)" : ""),
    J(noSig(X.w.db.tree.root)) === J(noSig(Y.w.db.tree.root)) && Object.keys(X.w.get("houseDay") || {}).filter(k => k >= isoN(undoAt)).every(k => J(X.w.get("houseDay/" + k + "/built")) === J(Y.w.get("houseDay/" + k + "/built"))));
}

// ── E ──
console.log("\n── E · a kid's device open across the switch ──");
{ const X = await mkW("saved", "preview"), Y = await mkW("saved", "preview");
  for (const S of [X, Y]) { await go(S.w, 2, 13, 0); await drawn(S); }
  const old = X.B.run("_grabsHTML('kid_c',false)"), i0 = old.match(/gbInstant\('kid_c',(\d+)\)/)[1];
  ok("(the kid's screen, drawn before the switch, has numbered buttons)", i0 === "0");
  X.A.run("hgOpen(); hgSheet.ch={a5:'out',a7:'out'}; hgSwitch()");   // Mom taps 🙌 (towel basket and porch plants left out) — kid_c's device has not heard yet
  ok("kid_c's device before it hears: all old (the old pool, not switched)", R(X.B, "return [gbSwOn(), gbRows().length, gbList()[5].label];").join() === "false,8,Fold the towel basket");
  X.B.run("gbInstant('kid_c',0); gbInstant('kid_c',5)"); Y.B.run("gbInstant('kid_c',0); gbInstant('kid_c',5)");   // taps on the old screen
  await X.w.flush(); await Y.w.flush();
  ok("…its taps are kept: the porch window and the towel basket were paid once, as in a world with no switch", J(R(X.B, "return " + J(KIDS) + ".map(bankBalance);")) === J(R(Y.B, "return " + J(KIDS) + ".map(bankBalance);")) && noHH(X.w.db.tree.root) === noHH(Y.w.db.tree.root));
  ok("after it hears: all new — the table's rows, each carried row with its number, the towel basket and porch plants left out", R(X.B, "return gbSwOn()&&gbRows().every(function(x){ return typeof x.i==='number'; })&&gbRows().length===6&&!gbRows().some(function(x){ return x.g.label==='Fold the towel basket'||x.g.label==='Water the porch plants'; });") === true);
  ok("…the porch window kid_c did on the old screen is done on the new list for every kid (same record)", KIDS.every(k => !pool(X.B, k).includes("Wash the porch window")) && R(X.B, "return (gbCur(0)||{}).by;") === "kid_c");
  const m = X.w.mark(), b = R(X.B, "return bankBalance('kid_a');"); const gone = R(X.B, "return [gbCur(7), typeof gbAt(7)];"); X.B.run("gbInstant('kid_a',7); gbClaim('kid_a',7); gbInstant('kid_a',5)"); await X.w.flush(); await Y.w.flush();
  ok("a tap on a left-out chore nobody touched (porch plants), from a screen not yet redrawn: nothing written, nothing paid, no hold", J(gone) === J([null, "undefined"]) && X.w.since(m).length === 0 && R(X.B, "return bankBalance('kid_a');") === b && R(X.B, "return gbHasActive('kid_a');") === false, [gone, writes(X.w, m)]);
  X.B.run("gbInstant('kid_a',1)"); await X.w.flush(); Y.B.run("gbInstant('kid_a',1)"); await Y.w.flush();
  ok("a tap on a kept chore from that old screen lands on the same chore, paid once", noHH(X.w.db.tree.root) === noHH(Y.w.db.tree.root));
}

// ── F ──
console.log("\n── F · loading and drawing with the switch stored writes what it writes without it ──");
{ const S0 = await mkW("saved", "preview"); await go(S0.w, 2, 10, 0); S0.A.run("hgOpen(); hgSwitch()"); await S0.w.flush(); const HH = clone(S0.w.get("household"));
  for (const mode of ["off", "preview", "on"]) {
    const boot = async h => { const hh = clone(h); if (hh.meta.engine) hh.meta.engine.mode = mode; const w = await F.world("saved", mode, { household: hh }), m = w.mark();
      const A = w.boot("A", "devA", { mom: true }), B = w.boot("B", "devB"); await w.flush(); A.run(HJS); await w.at(2026, 11, 18, 10, 0);
      A.run("try{ renderAll(); hhRender(); hcOpen('gb_wipe_the_island'); hhRender(); hcRulesOn('kitchen'); popOpen('kid_a','grabs'); _storeEditorHTML(); popClose(); }catch(e){}"); B.run("try{ renderAll(); popOpen('kid_a','grabs'); popClose(); }catch(e){}"); await w.flush();
      return writes(w, m).join("\n"); };
    const unsw = clone(HH); delete unsw.meta.grabs; Object.keys(unsw.jobs).forEach(id => { delete unsw.jobs[id].grabKey; });
    const a = await boot(HH), b = await boot(unsw);
    ok(mode + " · boot, a day roll and every page drawn (Household, the card, Rules, Up for Grabs, the Star Store): the same writes as without the switch (" + a.split("\n").filter(Boolean).length + ")", a === b, [a.split("\n").filter(l => b.split("\n").indexOf(l) < 0).slice(0, 3)]);
    ok(mode + " · …and none of them is under grabClaims, config/grabs or household/", !/ (grabClaims|config\/grabs|household)/.test(a), a.split("\n").filter(l => / (grabClaims|config\/grabs|household)/.test(l)).slice(0, 3));
  } }

console.log("\n" + pass + " passed, " + fail + " failed");
if (BASE && !process.env.BASE_HTML) try { fs.unlinkSync(BASE); } catch (e) {}
process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
