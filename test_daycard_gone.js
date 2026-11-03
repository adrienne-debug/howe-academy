// 📺 DCGONE — a family card whose family time was deleted never opens someone else's day card (her yes 2026-11-02, "all
//   yeses"). Live DeWalt 11/2: the Fact Review family time was deleted in Settings; its 🏡 cards stay on the week until the
//   week is planned again (by design), and "📺 Open today's card" on them opened History. Runs the REAL DAYCARD + UNITTRACK
//   blocks (and lrLinksFor / lrLinkA).
//   · a card of a deleted family time: no button; dcOpen(bid, taskId) → a plain toast, no view, nothing written
//   · a card of a family time still there: button + view exactly as before; dcOpen() (the Corner tile) still picks the first
//   run: node test_daycard_gone.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
const DC = cut("// DAYCARD_START", "// DAYCARD_END");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const J = x => JSON.stringify(x);
const ROSTER = ["taylor", "makenzie", "andrew", "caleb"];
const ROSTER_DEF = ROSTER.map(k => ({ id: k, name: k[0].toUpperCase() + k.slice(1), color: "#333", grade: "4", schoolAge: true }));
// What DeWalt had on 11/2: History (still there) at 1:00 for everyone; Fact Review (deleted) at 9:00 for two kids.
const BLOCKS = () => ({ hist: { name: "Family Time", kids: ROSTER.slice(), days: ["Mon", "Tue", "Wed", "Thu", "Fri"], at: "lunch", items: [{ key: "h", name: "History", minutes: 30 }] } });
const TASKS = () => { const out = [];
  ["andrew", "makenzie"].forEach(k => out.push({ id: "fr_" + k, who: k, famBlock: "factrev", famItem: "f", day: "monday", time: "9:00 AM", title: "🏡 Fact Review" }));
  ROSTER.forEach(k => out.push({ id: "h_" + k, who: k, famBlock: "hist", famItem: "h", day: "monday", time: "1:00 PM", title: "🏡 History" }));
  return out; };
function world(o) {
  o = o || {}; const writes = [];
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, isFinite, WeakMap, URL,
    unitStudies: {}, ROSTER: ROSTER.slice(), ROSTER_DEF: JSON.parse(J(ROSTER_DEF)), KID_NAME: Object.fromEntries(ROSTER_DEF.map(k => [k.id, k.name])),
    momHereCards: () => true, momHere: () => true, _dryRun: () => false, db: { ref: p => ({ set: v => writes.push([p, v]), update: v => writes.push([p, v]), remove: () => writes.push([p, null]) }) },
    rulesData: { familyBlocks: BLOCKS() }, famDefs: () => ctx.rulesData.familyBlocks, famList: x => Array.isArray(x) ? x.filter(v => v != null) : [],
    famTrack: () => null, famItemOf: t => { const b = ctx.famDefs()[t.famBlock]; return b ? ctx.famList(b.items).find(it => it && it.key === t.famItem) || null : null; },
    famLessonFor: () => "", famIsAbsent: () => false, famPresLeads: () => false, famBoState: () => null,
    weekData: { tasks: o.tasks || TASKS() }, getActiveTasks: () => ctx.weekData.tasks, _todayDay: "monday", effectiveDay: t => t.day, checked: o.checked || {},
    toMin: s => { const m = /^(\d+):(\d+)\s*(AM|PM)/i.exec(s || ""); if (!m) return 0; let h = +m[1]; if (/PM/i.test(m[3]) && h !== 12) h += 12; return h * 60 + +m[2]; },
    routineDateISO: () => "2026-11-02", cbTodayISO: () => "2026-11-02", _todayStr: () => "Monday, November 2", lidsFor: () => null, llLessonKey: () => "", currData: { subjects: {}, resources: {} },
    frCardRec: () => ({ links: [], supplies: [], books: [], orders: [], notes: "", _from: {} }),
    lrSafeUrl: u => /^https:\/\//i.test(String(u || "").trim()) ? String(u).trim() : "", lrEsc: s => String(s == null ? "" : s), lrHost: () => "link",
    _unitActs: () => [], cap: s => s ? s[0].toUpperCase() + s.slice(1) : s, tab: "kids", renderAll: () => { ctx.repaints++; }, repaints: 0, window: { scrollTo: () => {} },
    gwShowToast: m => { ctx.toast = m; }, tapTask: () => {} };
  vm.createContext(ctx);
  vm.runInContext(cut("// UNITTRACK_START", "// UNITTRACK_END") + "\n" + fn("lrClean") + "\n" + fn("lrList") + "\n" + fn("lrStr") + "\n" + fn("lrDate") + "\n" + fn("lrLinksFor") + "\n" + fn("lrLinkA") + "\n" + DC, ctx);
  return { ctx, writes };
}
const card = id => TASKS().find(t => t.id === id);

console.log("── a card of a deleted family time ──");
{
  const w = world(), c = w.ctx;
  ok("no 📺 Open today's card button on it", c.dcCardBtnHTML(card("fr_andrew"), false) === "");
  ok("dcOpen(its block, its card) opens nothing (live: it opened History)", c.dcOpen("factrev", "fr_andrew") === false && !c.dcOn() && c.dcState == null && c.repaints === 0, c.dcState);
  ok("…and says why, in plain words", /taken out in Settings/.test(c.toast || "") && /Regenerate/.test(c.toast || ""), c.toast);
  ok("dcOpen(its block) alone opens nothing either", c.dcOpen("factrev") === false && !c.dcOn());
  ok("nothing is written", w.writes.length === 0, w.writes);
}
{
  const c = world({ tasks: TASKS().filter(t => t.famBlock === "factrev") }).ctx;
  ok("with no other family time today: still no view", c.dcOpen("factrev", "fr_andrew") === false && !c.dcOn());
}

console.log("\n── a family time that is still there: unchanged ──");
{
  const c = world().ctx;
  ok("History's card keeps its button", /dcOpen\('hist','h_taylor'\)/.test(c.dcCardBtnHTML(card("h_taylor"), false)));
  ok("its button opens History", c.dcOpen("hist", "h_taylor") === true && c.dcState.bid === "hist" && c.dcState.key === "h" && c.dcOn());
  c.dcClose();
  ok("dcOpen() with nothing named (the Corner tile) still opens the first family time of the day", c.dcOpen() === true && c.dcState.bid === "hist");
}
{
  const c = world({ tasks: [] }).ctx;
  ok("nothing on today → the same toast as before", c.dcOpen() === false && /No family time/.test(c.toast));
}

console.log("\n── the block ──");
{
  ok("the guard sits in dcOpen, before the first-group fallback", /if\(!g&&\(bid\|\|taskId\)\)\{[^\n]*return false; \}\n  if\(!g\) g=groups\.find\(x=>!x\.done\)\|\|groups\[0\];/.test(fn("dcOpen")));
  ok("no 🔀 in the day card block", DC.indexOf("\u{1F500}") < 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
