/*
 * 🔓 OPENPM — Mom's "open afternoons" switch (her ask 2026-11-20, her picks 2026-11-21: today only, Afternoon + House chores
 * together, "Yes, start it too"). Mom's Day ▸ 🧒 Kids today: one button above the names for everyone, a small one per kid.
 * A tap opens that kid's Afternoon list (and so the House chores) for today, exactly as far as the LOCK goes; school is untouched.
 * Storage: household/today/<iso>/openPM/<kid> = ms, removed when off.   run: node test_open_afternoons.js
 */
const vm = require("vm");
const src = require("./test_src.js")();
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 400) + ")" : "")); } };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name); let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}" && --d === 0) return src.slice(i, k + 1); } throw new Error("unbalanced " + name); };
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("missing " + a); return src.slice(i, j + b.length); };
const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const NOW = new Date(), TODAY = iso(NOW), YDAY = iso(new Date(NOW.getTime() - 86400000));
const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DN = DAYS[NOW.getDay()], OTHER = DAYS[(NOW.getDay() + 1) % 7];
const KIDS = ["ava", "ben", "cy"];   // made-up kids

const BLOCK = cut("// OPENPM_START", "// OPENPM_END");
const CODE = [BLOCK, fn("_todayStr"), fn("_hhIsoOk"), fn("_hhWrite"), fn("householdOnValue"), fn("rtAvailable"), fn("hdLocked"), fn("mdCardKidsToday")].join("\n");

function mk(o) {
  o = o || {}; const writes = [], ls = {};
  const ref = p => ({ set: v => writes.push(["set", p, v]), remove: () => writes.push(["rm", p]), update: v => writes.push(["update", p === undefined ? "" : p, JSON.parse(JSON.stringify(v))]) });
  const ctx = {
    console, Object, Array, String, Number, Math, JSON, Date, RegExp, Error, parseInt, isNaN,
    HA_LS: { getItem: k => ls[k] || null, setItem: (k, v) => { ls[k] = v; } },
    db: o.noDb ? null : { ref }, _dryRun: () => !!o.dry, momHere: () => !o.noMom,
    householdData: o.hh || {}, SL_KIDS: KIDS.slice(), SL_KCOL: {}, DAYS_ALL: DAYS.slice(1).concat(["sunday"]),
    _todayDay: DN, day: DN, mpDayNow: () => o.viewDay || DN,
    cap: s => String(s).charAt(0).toUpperCase() + String(s).slice(1), esc: s => String(s == null ? "" : s),
    mwToast: () => {}, renderAll: () => { ctx._renders = (ctx._renders || 0) + 1; },
    // the lock's other inputs: a weekday, school NOT done, before the afternoon hour, no cleaning switch
    rtAlwaysOpen: () => false, hhCleanOn: () => false, rtSchoolworkDone: (k) => !!(o.schoolDone && o.schoolDone[k]),
    rtAfternoonHour: () => (o.hourPassed ? 0 : 99), rtEveningHour: () => 99,
    // House chores (HOUSEDAY) on, every kid "school first", nobody off
    hdOn: () => true, hhIsKid: k => KIDS.indexOf(k) >= 0, hdFitOf: () => "school", hdKidOff: () => false, hdIsoOf: () => TODAY,
    writes, ls,
  };
  vm.createContext(ctx); vm.runInContext(CODE, ctx); return ctx;
}
const locked = (c, k, d) => !c.rtAvailable("afternoon", k, d || DN);

console.log("1. Off by default");
{ const c = mk();
  ok("no mark → nobody is opened by Mom", KIDS.every(k => !c.openPmToday(k)));
  ok("a weekday, school unfinished, before the hour → Afternoon locked for every kid", KIDS.every(k => locked(c, k)));
  ok("…and House chores locked too (hdLocked follows the Afternoon lock)", KIDS.every(k => c.hdLocked("chores", k, DN) === true));
}

console.log("2. One kid");
{ const c = mk(); const on = c.openPmToggle("ben");
  ok("the tap answers on", on === true && c.openPmToday("ben"));
  ok("ben's Afternoon is open; ava and cy stay locked", !locked(c, "ben") && locked(c, "ava") && locked(c, "cy"));
  ok("ben's House chores open (no hdLocked), the others' stay locked", c.hdLocked("chores", "ben", DN) === false && c.hdLocked("chores", "ava", DN) === true);
  ok("one targeted set: household/today/<today>/openPM/ben = a timestamp", c.writes.length === 1 && c.writes[0][0] === "set" && c.writes[0][1] === "household/today/" + TODAY + "/openPM/ben" && typeof c.writes[0][2] === "number" && c.writes[0][2] > 0, c.writes);
  ok("the local copy holds the same mark and is saved like Go clean (ha_household)", c.householdData.today[TODAY].openPM.ben === c.writes[0][2] && JSON.parse(c.ls.ha_household).today[TODAY].openPM.ben === c.writes[0][2]);
  ok("the page repaints", c._renders === 1);
  c.writes.length = 0; const off = c.openPmToggle("ben");
  ok("a second tap closes it: one remove on the same path", off === false && c.writes.length === 1 && c.writes[0][0] === "rm" && c.writes[0][1] === "household/today/" + TODAY + "/openPM/ben", c.writes);
  ok("…back to the normal rule: locked again", locked(c, "ben") && c.hdLocked("chores", "ben", DN) === true);
  ok("…and the empty openPM is gone from today's local record", !("openPM" in (c.householdData.today[TODAY] || {})));
  c.writes.length = 0;
  ok("an unknown kid name → nothing", c.openPmToggle("nobody") === null && c.openPmToggle("") === null && c.writes.length === 0);
}

console.log("3. All kids");
{ const c = mk(); c.openPmToggle("ava"); c.writes.length = 0;
  const on = c.openPmToggleAll();
  ok("with one already open, the all tap opens the others", on === true && KIDS.every(k => c.openPmToday(k)));
  const w = c.writes;
  ok("one multi-path update at the root, only the kids who changed (ben, cy), each a timestamp", w.length === 1 && w[0][0] === "update" && w[0][1] === "" && JSON.stringify(Object.keys(w[0][2]).sort()) === JSON.stringify(["household/today/" + TODAY + "/openPM/ben", "household/today/" + TODAY + "/openPM/cy"]) && Object.values(w[0][2]).every(v => typeof v === "number" && v > 0), w);
  ok("every kid's Afternoon and House chores open", KIDS.every(k => !locked(c, k) && c.hdLocked("chores", k, DN) === false));
  c.writes.length = 0; const off = c.openPmToggleAll();
  ok("everyone open → the all tap closes everyone", off === false && KIDS.every(k => !c.openPmToday(k)) && KIDS.every(k => locked(c, k)));
  ok("…one multi-path update setting all three paths to null (= removed)", c.writes.length === 1 && c.writes[0][0] === "update" && JSON.stringify(c.writes[0][2]) === JSON.stringify({ ["household/today/" + TODAY + "/openPM/ava"]: null, ["household/today/" + TODAY + "/openPM/ben"]: null, ["household/today/" + TODAY + "/openPM/cy"]: null }), c.writes);
}

console.log("4. Today only");
{ const c = mk({ hh: { today: { [YDAY]: { openPM: { ava: 1, ben: 1, cy: 1 }, goClean: 5 } } } });
  ok("yesterday's marks open nothing today", KIDS.every(k => !c.openPmToday(k) && locked(c, k)));
  ok("the reader is by date: yesterday reads on, today reads off", c.openPmOn("ava", YDAY) === true && c.openPmOn("ava", TODAY) === false);
  c.openPmToggle("ava");
  ok("today's tap leaves yesterday's record (and Go clean beside it) as it was", JSON.stringify(c.householdData.today[YDAY]) === JSON.stringify({ openPM: { ava: 1, ben: 1, cy: 1 }, goClean: 5 }));
  const d = mk({ hh: { today: { [TODAY]: { goClean: 7 } } } }); d.openPmToggle("cy");
  ok("today's Go clean mark sits untouched beside openPM", d.householdData.today[TODAY].goClean === 7 && !!d.householdData.today[TODAY].openPM.cy);
  const e = mk({ hh: { today: { [TODAY]: { openPM: { ben: 123 } } } } });
  ok("a mark that arrives from another device (the household listener) opens that kid there", !locked(e, "ben") && locked(e, "ava"));
}

console.log("5. Only the lock changes");
{ const c = mk(); c.openPmToggle("ava");
  ok("Evening keeps its own hour (still locked)", c.rtAvailable("evening", "ava", DN) === false);
  ok("another day's Afternoon answers as before (open — past days always were)", c.rtAvailable("afternoon", "ben", OTHER) === true);
  const h = mk({ hourPassed: true }); ok("without the switch: past the afternoon hour opens it as before", !locked(h, "ben"));
  const s = mk({ schoolDone: { cy: true } }); ok("without the switch: school done opens it as before", !locked(s, "cy") && locked(s, "ava"));
  ok("rtSchoolworkDone is not changed (no OPENPM reference in it)", !/openPm|OPENPM/.test(fn("rtSchoolworkDone")));
  ok("rtAvailable's evening branch is not changed", /if\(slot==="evening"\) return \(d!==_todayDay\)\|\|\(new Date\(\)\.getHours\(\)>=rtEveningHour\(\)\);/.test(fn("rtAvailable")));
  ok("the hook only counts on today: (d===_todayDay&&…openPmToday(kid))", /\(d===_todayDay&&typeof openPmToday==="function"&&openPmToday\(kid\)\)/.test(fn("rtAvailable")));
  ok("the block touches no school card, star, spin or bonus", !/checked\[|claimed|weekData|toggleTask|bankDirect|spin|bonus|mlQueueLay|dayStarts/i.test(BLOCK.replace(/^\/\/.*$/gm, "")));
  ok("the block writes only under household/today/<iso>/openPM/", (BLOCK.replace(/^\/\/.*$/gm, "").match(/"[a-z]+\/[^"]*"/g) || []).every(p => p === '"household/today/"' || p === '"/openPM/"'), BLOCK.match(/"[a-z]+\/[^"]*"/g));
}

console.log("6. Mom only, dry run inert");
{ const c = mk({ noMom: true });
  ok("not Mom: the taps do nothing and write nothing", c.openPmToggle("ava") === null && c.openPmToggleAll() === null && c.writes.length === 0 && !c.openPmToday("ava"));
  ok("not Mom: no buttons", c.openPmAllHTML() === "" && c.openPmKidBtnHTML("ava") === "");
  const d = mk({ dry: true }); d.openPmToggle("ava"); d.openPmToggleAll();
  ok("?dryrun=1: no database write at all", d.writes.length === 0);
  ok("…the screen still shows it (local only)", d.openPmToday("ava") && d.openPmToday("ben"));
  const n = mk({ noDb: true }); n.openPmToggle("ava"); ok("no db: local only, no throw", n.openPmToday("ava"));
}

console.log("7. The buttons");
{ const c = mk();
  const all0 = c.openPmAllHTML();
  ok("all-kids button off: '🔓 Open afternoons', white, calls openPmToggleAll()", /🔓 Open afternoons/.test(all0) && /onclick="openPmToggleAll\(\)"/.test(all0) && /background:#fff/.test(all0) && /today only/.test(all0));
  c.openPmToggle("ava"); const all1 = c.openPmAllHTML();
  ok("one open: still '🔓 Open afternoons', says '1 of 3 open today'", /🔓 Open afternoons/.test(all1) && /1 of 3 open today/.test(all1));
  const k1 = c.openPmKidBtnHTML("ava"), k0 = c.openPmKidBtnHTML("ben");
  ok("kid button on: '✓ Afternoon open', green", /✓ Afternoon open/.test(k1) && /background:#16a34a/.test(k1) && /openPmToggle\('ava'\)/.test(k1));
  ok("kid button off: '🔓 Afternoon', white", /🔓 Afternoon</.test(k0) && /background:#fff/.test(k0) && /openPmToggle\('ben'\)/.test(k0));
  c.openPmToggleAll(); const all2 = c.openPmAllHTML();
  ok("everyone open: '✓ Afternoons open — everyone', green, 'Tap to close them all again'", /✓ Afternoons open — everyone/.test(all2) && /background:#16a34a/.test(all2) && /Tap to close them all again/.test(all2));
}

console.log("8. Where they are drawn");
{ const count = (h, re) => (h.match(re) || []).length;
  const c = mk(); const mom = c.mdCardKidsToday(DN, true, true);
  ok("Mom's Day ▸ Kids today: one all-kids button", count(mom, /openPmToggleAll\(\)/g) === 1, mom.length);
  ok("…and one per kid", KIDS.every(k => count(mom, new RegExp("openPmToggle\\('" + k + "'\\)", "g")) === 1));
  ok("…the all-kids button is above the first kid's name", mom.indexOf("openPmToggleAll()") < mom.indexOf(">Ava</b>") && mom.indexOf(">Ava</b>") > 0);
  const dadOn = c.mdCardKidsToday(DN, true, true, true), dadOff = c.mdCardKidsToday(DN, true, true, false);
  ok("Dad's Day (unlocked or locked): no button", !/openPm/.test(dadOn) && !/openPm/.test(dadOff));
  ok("the plain card (bank off): no button", !/openPm/.test(c.mdCardKidsToday(DN, true)));
  const p = mk({ viewDay: OTHER }); ok("Mom peeking at another day's chip: no button (it is a today switch)", !/openPm/.test(p.mdCardKidsToday(DN, true, true)));
  const m = mk({ noMom: true }); ok("not in Mom mode: no button", !/openPm/.test(m.mdCardKidsToday(DN, true, true)));
}

console.log("\n" + pass + " passed, " + fail + " failed");
if (fail) process.exit(1);
