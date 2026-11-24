/*
 * LMCLEAR — 🧹 Clear old make-ups, the one-time row in 📅 <Kid>'s year (Curriculum streamline slice 3b, LMCLEANUP;
 * her call 2026-11-23 answering AUDIT_lessonmap_dead_2026-11-21.md §11 question 1: "A Clear button I tap").
 *
 * What it proves, with the real code sliced out of index.html and replayed on inert stubs (no network, no Firebase):
 *   (1) the row is absent when the open kid has no added[subject]===true entry (string-valued make-ups, `removed`,
 *       another kid's entries don't count), and absent for a non-Mom device;
 *   (2) present with the count and the first and last date, all from the data; kyPanelHTML draws it above the tabs;
 *   (3) "See the dates…" opens the in-page confirm: every date with its count, a Clear button with the total, Cancel;
 *   (4) Clear writes ONE multi-path update on scheduleOverrides whose paths are exactly <date>/<kid>/added/<subject> =
 *       null for the listed entries — a string-valued entry, a `removed` entry, another kid's entry all survive, locally
 *       and in a replayed database; the save baseline (_soBase) agrees, so the next override save writes nothing;
 *   (5) the end state equals N taps of ✕ make-up (gvMenuOffAdded → lmDropSlot → setSchedOverride → saveScheduleOverrides,
 *       the real code) — same local copy, same database; neither re-lays, toasts, or writes anything else;
 *   (6) a dry run and a non-Mom device write nothing and change nothing;
 *   (7) the row is gone afterwards.
 *
 *   run:  node test_lm_clear_makeups.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra).slice(0, 600) + ")" : "")); }
}
function braceSlice(S, name) { const sig = "function " + name + "("; const i = S.indexOf(sig); if (i < 0) return null; let d = 0, j = S.indexOf("{", i); for (let k = j; k < S.length; k++) { if (S[k] === "{") d++; else if (S[k] === "}") { d--; if (d === 0) return S.slice(i, k + 1); } } return null; }
function block(S, a, b) { const i = S.indexOf(a); if (i < 0) return ""; const j = S.indexOf(b, i); return j < 0 ? "" : S.slice(i, j + b.length); }
const LMC = block(src, "// LMCLEAR_START", "// LMCLEAR_END");
const SO = block(src, "// SO_START", "// SO_END");
const need = ["setSchedOverride", "lmDropSlot", "lmRemoveSubj", "gvMenuOffAdded", "kyPanelHTML", "esc"];
ok("the LMCLEAR block, the SO block and the ✕ make-up path are all in index.html", LMC.length > 500 && SO.length > 200 && need.every(n => braceSlice(src, n)), need.filter(n => !braceSlice(src, n)));

const clone = o => JSON.parse(JSON.stringify(o));
// The fixture: the kid has 5 true make-ups on 3 dates, plus a moved-in (string) make-up, a `removed`, a dayOff, and
// another kid's true make-up on a shared date.
const FIX = {
  "2027-09-20": { kid: { added: { math: true, read: true } }, other: { added: { math: true } } },
  "2027-09-21": { kid: { added: { math: true, sci: "Lesson 12" }, removed: { read: true } } },
  "2027-10-08": { kid: { added: { math: true, read: true } } },
  "2027-01-05": { kid: { removed: { sci: true } } },
  "2027-02-01": { other: { added: { read: true } } },
};
// A database replay: apply update(up) on the scheduleOverrides node the way RTDB does (null deletes; empty parents vanish).
function applyUpdate(dbTree, up) {
  Object.keys(up).forEach(p => {
    const parts = p.split("/"); let o = dbTree; const stack = [];
    for (let i = 0; i < parts.length - 1; i++) { if (o[parts[i]] == null || typeof o[parts[i]] !== "object") { if (up[p] === null) return; o[parts[i]] = {}; } stack.push([o, parts[i]]); o = o[parts[i]]; }
    const last = parts[parts.length - 1];
    if (up[p] === null) delete o[last]; else o[last] = clone(up[p]);
    for (let i = stack.length - 1; i >= 0; i--) { const [par, k] = stack[i]; if (par[k] && typeof par[k] === "object" && !Object.keys(par[k]).length) delete par[k]; }
  });
  return dbTree;
}

function world(o) {
  o = o || {};
  const log = [];
  const ctx = {
    console, Object, Array, String, Number, JSON, Date, Math, Set, Map, Error,
    scheduleOverrides: clone(o.fix || FIX), _soBase: null, lmMovePick: o.pick || null, lmcAsk: null,
    momModeActive: o.mom !== false, adminPinUnlocked: false,
    momHere() { return ctx.momModeActive || ctx.adminPinUnlocked; },
    _dryRun() { return !!o.dry; },
    HA_LS: { setItem(k, v) { log.push(["ls", k]); }, getItem() { return null; } },
    db: { ref: p => ({ set: v => log.push([p, "set", clone(v)]), update: v => log.push([p, "update", clone(v)]), remove: () => log.push([p, "remove"]) }) },
    renders: 0, renderAll() { ctx.renders++; }, gwShowToast(m) { log.push(["toast", m]); },
    rtlMakeupRelay() { log.push(["relay"]); }, buildCurrPaceCum() { log.push(["pace"]); },
    gvGrabScroll() {}, gvMenu: null, gvEdit: null,
    currData: { lessons: { kid: { d1: { date: "2027-09-20" }, d2: { date: "2027-09-21" }, d3: { date: "2027-10-08" } } } },
    cap: x => String(x).charAt(0).toUpperCase() + String(x).slice(1),
    cw: k => k, kyTab: "hours", cbKid: null,
    cbRenderRules: (col, part) => "<div class=\"rules-" + part + "\"></div>", ceRenderSessions: () => "<div class=\"terms\"></div>",
    lnRenderSection: () => "<div class=\"lanes\"></div>", gvColOrderHTML: () => "", currDataTarget: null,
  };
  ctx.currData.targetEnd = {}; ctx.currData.momVerifyKid = {};
  ctx.log = log;
  vm.createContext(ctx);
  const code = [SO, braceSlice(src, "setSchedOverride"), braceSlice(src, "lmRemoveSubj"), braceSlice(src, "lmDropSlot"), braceSlice(src, "gvMenuOffAdded"),
    braceSlice(src, "esc"), braceSlice(src, "kyPanelHTML"), LMC].join("\n");
  // `let` declarations in the slices would shadow the ctx fields; run them as var-free assignments by re-declaring here.
  vm.runInContext(code.replace(/^let _soBase=null;/m, "").replace(/^let lmcAsk=null;/m, ""), ctx);
  ctx._soBase = clone(ctx.scheduleOverrides);   // the listener has answered: the baseline is the node as it stands
  return ctx;
}
const writes = w => w.log.filter(e => e[1] === "set" || e[1] === "update" || e[1] === "remove");

// ── (1) absent ──────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const none = { "2027-09-21": { kid: { added: { sci: "Lesson 12" }, removed: { read: true } } }, "2027-09-20": { other: { added: { math: true } } } };
  const w = world({ fix: none });
  ok("(1) no row when the kid has no added===true entry (a string make-up, a removed, another kid's true don't count)", w.lmcRowHTML("kid", "#123") === "" && !/lmc-row/.test(w.kyPanelHTML("kid", "#123")));
  const w2 = world({ mom: false });
  ok("(1) no row on a non-Mom device, even with entries", w2.lmcRowHTML("kid", "#123") === "");
  ok("(1) …and the other kid's row counts only its own (2 on 2 days)", /<b>2<\/b> old make-ups on <b>2<\/b> days/.test(world().lmcRowHTML("other", "#123")));
}

// ── (2) present ─────────────────────────────────────────────────────────────────────────────────────────────────────
const W = world();
const row = W.lmcRowHTML("kid", "#123");
ok("(2) row present: count 5 on 3 days", /<b>5<\/b> old make-ups on <b>3<\/b> days/.test(row), row);
ok("(2) first and last date from the data", row.includes("Mon, Sep 20, 2027") && row.includes("Fri, Oct 8, 2027"), row);
ok("(2) the row's door is See the dates… (lmcOpen), no Clear until it is open", /onclick="lmcOpen\('kid'\)"/.test(row) && !/lmcClear/.test(row));
const panel = W.kyPanelHTML("kid", "#123");
ok("(2) kyPanelHTML draws the row above the four tabs", panel.indexOf("lmc-row") > 0 && panel.indexOf("lmc-row") < panel.indexOf("kySetTab("), panel.slice(0, 400));
ok("(2) …on every tab", ["hours", "terms", "lanes", "all"].every(t => { W.kyTab = t; return /lmc-row/.test(W.kyPanelHTML("kid", "#123")); }));
ok("(2) no literal count, date or name in the block's code (all from the data)", !/\b(55|2027|Sep|Oct)\b/.test(LMC.replace(/^\/\/.*$/gm, "")));

// ── (3) the in-page confirm ─────────────────────────────────────────────────────────────────────────────────────────
W.lmcOpen("kid");
const open = W.lmcRowHTML("kid", "#123");
const days = (open.match(/<span class="lmc-day">[^<]*<b>\d+<\/b><\/span>/g) || []).map(x => x.replace(/<[^>]+>/g, ""));
ok("(3) the confirm lists every date with its count", JSON.stringify(days) === JSON.stringify(["Mon, Sep 20, 2027 · 2", "Tue, Sep 21, 2027 · 1", "Fri, Oct 8, 2027 · 2"]), days);
ok("(3) a Clear button with the total, and Cancel", /onclick="lmcClear\('kid'\)"[^>]*>🧹 Clear these 5</.test(open) && /onclick="lmcOpen\('kid'\)"[^>]*>Cancel</.test(open));
ok("(3) nothing written by opening it", writes(W).length === 0);
W.lmcOpen("kid");
ok("(3) Cancel closes it, still nothing written", !/lmcClear/.test(W.lmcRowHTML("kid", "#123")) && writes(W).length === 0);

// ── (4) Clear ───────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const w = world({ pick: { kid: "kid" } });
  const before = clone(w.scheduleOverrides);
  w.lmcOpen("kid"); w.lmcClear("kid");
  const wr = writes(w);
  const EXP = ["2027-09-20/kid/added/math", "2027-09-20/kid/added/read", "2027-09-21/kid/added/math", "2027-10-08/kid/added/math", "2027-10-08/kid/added/read"];
  ok("(4) exactly one write: an update on scheduleOverrides", wr.length === 1 && wr[0][0] === "scheduleOverrides" && wr[0][1] === "update", wr);
  const up = (wr[0] || [])[2] || {};
  ok("(4) its paths are exactly the listed entries, every value null", JSON.stringify(Object.keys(up).sort()) === JSON.stringify(EXP) && Object.values(up).every(v => v === null), up);
  const S = w.scheduleOverrides;
  ok("(4) local: the string-valued make-up survives", S["2027-09-21"].kid.added.sci === "Lesson 12");
  ok("(4) local: removed entries survive", S["2027-09-21"].kid.removed.read === true && S["2027-01-05"].kid.removed.sci === true);
  ok("(4) local: the other kid's entries survive", S["2027-09-20"].other.added.math === true && S["2027-02-01"].other.added.read === true);
  ok("(4) local: emptied containers pruned (2027-10-08 gone, kid gone from nothing else)", !S["2027-10-08"] && !S["2027-09-20"].kid);
  const dbAfter = applyUpdate(clone(before), up);
  ok("(4) replayed database == this device's copy", JSON.stringify(dbAfter) === JSON.stringify(S), dbAfter);
  ok("(4) the save baseline agrees, so the next override save writes nothing", JSON.stringify(w._soBase) === JSON.stringify(S) && (w.saveScheduleOverrides(), writes(w).length === 1));
  ok("(4) the in-page confirm closed, the armed ➡ move dropped, one re-render", w.lmcAsk === null && w.lmMovePick === null && w.renders >= 2);
  ok("(4) no toast, no re-lay, no pace rebuild (✕ make-up does none)", !w.log.some(e => e[0] === "toast" || e[0] === "relay" || e[0] === "pace"));
  // ── (7) gone after
  ok("(7) the row is gone afterwards", w.lmcRowHTML("kid", "#123") === "" && !/lmc-row/.test(w.kyPanelHTML("kid", "#123")));
  ok("(7) a second Clear (stale tap) writes nothing", (w.lmcClear("kid"), writes(w).length === 1));

  // ── (5) same as N taps of ✕ make-up (the real gvMenuOffAdded → lmDropSlot path)
  const t = world({ pick: { kid: "kid" } });
  const L = t.lmcList("kid");
  const dn = { "2027-09-20": "d1", "2027-09-21": "d2", "2027-10-08": "d3" };
  L.forEach(e => e.sks.forEach(sk => t.gvMenuOffAdded("kid", dn[e.date], sk)));
  ok("(5) N taps of ✕ make-up leave this device's copy exactly as Clear does", JSON.stringify(t.scheduleOverrides) === JSON.stringify(S), t.scheduleOverrides);
  let dbTaps = clone(before); writes(t).forEach(e => applyUpdate(dbTaps, e[2]));
  ok("(5) …and the database exactly as Clear does", JSON.stringify(dbTaps) === JSON.stringify(dbAfter), dbTaps);
  ok("(5) ✕ make-up also drops the armed move and toasts / re-lays nothing", t.lmMovePick === null && !t.log.some(e => e[0] === "toast" || e[0] === "relay" || e[0] === "pace"));
}

// ── (6) dry run · not Mom ───────────────────────────────────────────────────────────────────────────────────────────
{
  const d = world({ dry: true }); const b = clone(d.scheduleOverrides);
  d.lmcOpen("kid"); d.lmcClear("kid");
  ok("(6) dry run: nothing written, nothing changed, it says so", writes(d).length === 0 && JSON.stringify(d.scheduleOverrides) === JSON.stringify(b) && d.log.some(e => e[0] === "toast" && /Dry run/.test(e[1])));
  const n = world({ mom: false }); const b2 = clone(n.scheduleOverrides);
  n.lmcOpen("kid"); n.lmcClear("kid");
  ok("(6) not Mom: nothing written, nothing changed, the confirm never opens", writes(n).length === 0 && JSON.stringify(n.scheduleOverrides) === JSON.stringify(b2) && n.lmcAsk === null && n.renders === 0);
  const nodb = world(); nodb.db = null; nodb.lmcClear("kid");
  ok("(6) no database (first load): local only, no throw", !nodb.lmcRowHTML("kid", "#1"));
}

// ── static: the write is targeted, gated, and never a whole-node set ───────────────────────────────────────────────
ok("static: the block's only database write is db.ref(\"scheduleOverrides\").update(up), behind db&&!_dryRun()",
  (LMC.match(/db\.ref\(/g) || []).length === 1 && /if\(db&&!_dryRun\(\)\) db\.ref\("scheduleOverrides"\)\.update\(up\);/.test(LMC) && !/\.set\(|\.remove\(/.test(LMC));
ok("static: no confirm() / alert() dialog", !/\b(confirm|alert)\(/.test(LMC.replace(/^\/\/.*$/gm, "")));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
