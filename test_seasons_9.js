/*
 * Node tests for 🎉 Seasons & Events — KIDPAGE guard: seasons.js on a page with NO kids' side.
 *   A newer seasons.js can be dropped onto an older index.html (no SEASONKID block, no seasonkid.js, no skJobsN). There the kids'
 *   jobs must switch off cleanly: a kid's to-do is a plain to-do with their name on it, as before kids' jobs existed.
 *   · the one signal: typeof skJobsN==="function" (index.html's SEASONKID block — the kids' page + its job count)
 *   · world A (Howe's page, skJobsN defined): every kids'-jobs behaviour exactly as before
 *   · world B (the older page): (1) kidWhy = "who", kidNote = "", no seasonJobs write, no jobFor, no chip
 *     (2) the to-do pop-up has no "Show it early / ⭐ for doing it" (3) no 🧒 Open it to the kids, and snKids does nothing
 *     (4) no listener on seasonJobs — and nothing waits on it (Dad's list still syncs) (5) Mom's tick pays nothing
 *     · Dad's to-dos the same on both pages · old kids:true / jobFor / stars data draws with no error and no new writes
 *
 *   run:  node test_seasons_9.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm"), cp = require("child_process");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
const MSRC = fs.readFileSync(path.join(__dirname, process.env.SN_SRC || "seasons.js"), "utf8");
const BASE = (() => { try { return cp.execSync("git show 5ec3c058:seasons.js", { cwd: __dirname, maxBuffer: 16 << 20, stdio: ["ignore", "pipe", "ignore"] }).toString(); } catch (e) { return null; } })();
const TODAY = "2026-11-20";
const paths = w => Object.keys(w.val);

function world(kidPage) {
  const el = id => ({ id, innerHTML: "", value: "", style: {}, focus() {}, appendChild() {} });
  const nodes = {}, root = el("root");
  const o = { writes: [], timers: [], bank: [], toasts: [], dry: false, mom: true, LS: {}, root, listens: [], cbs: {}, onces: {} };
  const document = { getElementById(id) { return id === "sn-style" ? null : (nodes[id] || (nodes[id] = el(id))); }, createElement(t) { return el(t); }, head: { appendChild() {} } };
  const db = { ref(p) { const P = p === undefined ? "" : p; return {
    update(v) { o.writes.push({ op: "update", path: P, val: JSON.parse(JSON.stringify(v)) }); }, set(v) { o.writes.push({ op: "set", path: P, val: v }); }, remove() { o.writes.push({ op: "remove", path: P }); },
    on(ev, fn) { o.listens.push(P); o.cbs[P] = fn; }, once(ev, fn) { o.onces[P] = fn; } }; } };
  const ctx = { console: { log: console.log, warn() {} }, Date, Math, JSON, document, db, _todayStr: () => TODAY, _dryRun: () => o.dry, momHere: () => o.mom, _kioskD: () => false,
    gwShowToast: m => o.toasts.push(m), HA_LS: { getItem: k => (k in o.LS ? o.LS[k] : null), setItem: (k, v) => { o.LS[k] = String(v); } },
    tab: "moms-plan", mpSubView: "seasons", momSchedView: false, renderMomsPlan() {}, mpGoto() {},
    grData: { items: {} }, momdayData: {}, setTimeout: fn => { o.timers.push(fn); return o.timers.length; },
    bankDirect(kid, pts) { o.bank.push({ op: "pay", kid, pts }); return "bd1"; }, bankDirectRemove(kid, id) { o.bank.push({ op: "remove", kid, id }); },
    cuUnpay(kid) { o.bank.push({ op: "cuUnpay?", kid }); return false; }, choreVerifyOn: () => false };
  if (kidPage) ctx.skJobsN = () => 0;   // Howe's page: the SEASONKID block's job count
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext("const ROSTER_DEF=[{id:'ava',name:'Ava',color:'#2563eb'},{id:'ben',name:'Ben',color:'#16a34a'}]; var calendarData={events:{}}; var daddayData={};", ctx);
  vm.runInContext(MSRC, ctx);
  o.W = ctx; o.T = ctx._snTest; o.cal = () => vm.runInContext("calendarData", ctx);
  o.set = (d, sec, ev, jobs) => { o.timers.splice(0); o.writes.length = 0; o.bank.length = 0; o.toasts.length = 0; const c = x => JSON.parse(JSON.stringify(x || {}));
    o.T.setData(c(d), c(sec)); o.T.reset(); o.cal().events = c(ev); o.T.setJobs(jobs === undefined ? {} : jobs); o.T.setRoot(root, ""); o.T.ddFresh(true); };
  o.sync = () => { o.writes.length = 0; return o.T.dadSync(); };
  o.last = () => o.writes[o.writes.length - 1];
  o.all = () => o.writes.reduce((a, w) => a.concat(w.val && typeof w.val === "object" ? paths(w) : [w.path]), []);
  o.html = () => root.innerHTML;
  return o;
}
const SEASON = (todoG1, extra, list) => ({
  list: { xmas: Object.assign({ name: "Christmas 2026", emoji: "🎄", kind: "holiday", start: "2026-11-20", end: "2026-12-31", ts: 1 }, list || {}) },
  ideas: { xmas: { g1: { t: "Gingerbread houses", emoji: "🏠", by: "mom", ts: 2, ev: { e1: true }, todo: todoG1 || {} }, m1: { t: "Movie night", by: "mom", ts: 3 } } },
  extra: extra ? { xmas: { todo: extra } } : undefined });
const EV = () => ({ e1: { title: "Gingerbread houses", date: "2026-12-05", time: "", who: "family", emoji: "🏠" } });
const rec = (o, iid, lid) => o.T.data().ideas.xmas[iid].todo[lid];
const jobPaths = o => o.all().filter(p => /^seasonJobs(\/|$)/.test(p));
const OLDJOBS = () => ({ ava: { t1: { t: "Dough", for: "🏠 Gingerbread houses", show: "2026-12-03", due: "2026-12-03", stars: 3, sn: "xmas/g1/t1", ts: 1 } } });

const A = world(true), B = world(false);

console.log("\n# the guard itself");
{
  const code = MSRC.replace(/^\s*\/\/.*$/gm, "");
  ok("ONE helper, ONE signal: kidPageOk() = typeof skJobsN===\"function\"", /function kidPageOk\(\)\{return typeof skJobsN==="function";\}/.test(code) && (code.match(/skJobsN/g) || []).length === 1);
  ok("the write guard is unchanged", A.T.OK.source === "^(seasons\\/(list|ideas|extra)\\/[^\\/]+|seasonSecret\\/[^\\/]+\\/[^\\/]+|calendar\\/events\\/[^\\/]+|(momday|dadday)\\/\\d{4}-\\d{2}-\\d{2}\\/todos\\/sn[^\\/]+|seasonJobs\\/[^\\/]+\\/[^\\/]+)(\\/|$)", A.T.OK.source);
  const n = (code.match(/db\.ref\(/g) || []).length;
  if (BASE) ok("the same number of database calls as the branch it sits on (" + n + ")", n === (BASE.replace(/^\s*\/\/.*$/gm, "").match(/db\.ref\(/g) || []).length);
  else console.log("  skip — base seasons.js not readable here");
  ok("the seasonJobs listener sits behind the guard", /if\(kidPageOk\(\)\)db\.ref\("seasonJobs"\)\.on\(/.test(code));
  ok("no family's names in the code", !/Lincoln|Ellis|Lucy|Julian|Howe|Burris|DeWalt|Dewalt/.test(MSRC));
}

console.log("\n# A — Howe's page (skJobsN there): kids' jobs exactly as before");
{
  const o = A, T = o.T, W = o.W;
  o.set(SEASON({ t1: { t: "Make the dough", who: "ava", before: 2, stars: 3 } }), {}, EV(), {});
  const L = T.line("xmas", "g1", "todo", "t1");
  ok("A: a kid's to-do is a job (kidWhy \"\")", T.kidWhy(L) === "");
  ok("A: Mom's row says it's going to Ava's jobs, with its ⭐", /Going to Ava’s jobs/.test(T.kidNote(L)) && /⭐ 3/.test(T.kidNote(L)));
  o.sync(); const w = o.last();
  ok("A: the sync writes the job + jobFor in ONE update", o.writes.length === 1 && !!w.val["seasonJobs/ava/t1"] && w.val["seasons/ideas/xmas/g1/todo/t1/jobFor"] === "ava", w && paths(w));
  W.snLine("todo", "g1", "t1");
  ok("A: the pop-up has Show it early + ⭐", /Show it to Ava early/.test(o.html()) && /⭐ for doing it/.test(o.html()));
  W.snCancel(); T.draw();
  ok("A: the header has 🧒 Open it to the kids", /Open it to the kids/.test(o.html()) && /class="sn-kids/.test(o.html()));
  W.snKids();
  ok("A: snKids opens it (ONE field) and says so", o.last().val["seasons/list/xmas/kids"] === true && /The kids can see it now/.test(o.toasts.join()));
  o.set(SEASON({ t1: { t: "Dough", who: "ava", due: "2026-11-20", stars: 2 } }), {}, EV(), {}); o.sync(); o.writes.length = 0; o.bank.length = 0;
  W.snTodoTick("xmas", "g1", "t1");
  ok("A: Mom's tick pays through bankDirect and marks the job", o.bank.length === 1 && o.bank[0].op === "pay" && o.last().val["seasonJobs/ava/t1/done"] === TODAY, o.bank);
  const a = world(true); a.W.renderSeasons(a.root, "");
  ok("A: Mom's page listens to seasons, seasonSecret AND seasonJobs", a.listens.slice().sort().join() === "seasonJobs,seasonSecret,seasons", a.listens);
}

console.log("\n# B — the older page (no skJobsN): (1) a kid's to-do is a plain to-do");
{
  const o = B, T = o.T;
  o.set(SEASON({ t1: { t: "Make the dough", who: "ava", before: 2, stars: 3 } }), {}, EV(), {});
  const L = T.line("xmas", "g1", "todo", "t1");
  ok("B: kidWhy answers \"who\" (not a kid job)", T.kidWhy(L) === "who");
  ok("B: kidNote is empty — no Going to / In Ava's jobs chip, no ⭐ chip", T.kidNote(L) === "" && T.dadNote(L) === "");
  ok("B: the sync writes nothing (no seasonJobs, no jobFor)", o.sync() === 0 && o.writes.length === 0);
  o.set(SEASON({ t1: { t: "Dough", who: "ava", due: "2026-12-03", jobFor: "ava", stars: 3 } }), {}, EV(), OLDJOBS());
  ok("B: even with old job records in memory, the sync never removes or rewrites them", o.sync() === 0 && jobPaths(o).length === 0);
  ok("B: an old job record is not read as this to-do's copy", T.kidCopy(T.line("xmas", "g1", "todo", "t1")) === null);
  T.draw(); o.W.snViewSet("todo");
  ok("B: the to-do row shows Ava's name and no jobs chip", /Dough/.test(o.html()) && !/Ava’s jobs/.test(o.html()) && !/⭐ 3/.test(o.html()) && !/did it/.test(o.html()));
}

console.log("\n# B — (2) the to-do pop-up has no kids'-jobs boxes");
{
  const o = B, W = o.W, T = o.T;
  o.set(SEASON({ t1: { t: "Dough", who: "ava", due: "2026-12-03" } }), {}, EV(), {});
  W.snLine("todo", "g1", "t1");
  ok("B: no Show it early, no ⭐ for doing it, no Kids' Corner line", !/Show it to Ava early/.test(o.html()) && !/⭐ for doing it/.test(o.html()) && !/Kids’ Corner/.test(o.html()) && /What needs doing/.test(o.html()));
  ok("B: Ava can still be picked as who", /snLineWho\('ava'\)/.test(o.html()));
  W.snCancel();
  o.set(SEASON({ t1: { t: "Dough", who: "ava", due: "2026-12-03" } }), {}, EV(), {});
  W.snLine("todo", "g1", "t1"); W.snLineWho("dad");
  ok("B: Dad's own box still shows (Dad's list works the same)", /Show it on Dad’s list early/.test(o.html()));
  W.snCancel();
  o.set(SEASON({}), {}, EV(), {});
  W.snLine("todo", "g1", ""); W.snSet("t", "Sweep the porch"); W.snLineWho("ben"); W.snSave();
  const r = Object.values(T.data().ideas.xmas.g1.todo)[0];
  ok("B: a new to-do for a kid saves as a plain to-do with their name (no stars, no ahead)", r && r.t === "Sweep the porch" && r.who === "ben" && !("stars" in r) && !("ahead" in r) && jobPaths(o).length === 0, r);
}

console.log("\n# B — (3) no 🧒 Open it to the kids");
{
  const o = B, W = o.W, T = o.T;
  o.set(SEASON(), {}, EV(), {}); T.draw();
  ok("B: the header shows no kids switch", !/Open it to the kids/.test(o.html()) && !/class="sn-kids/.test(o.html()) && !/Only you see this list/.test(o.html()) && /Christmas 2026/.test(o.html()));
  o.set(SEASON({}, null, { kids: true }), {}, EV(), {}); T.draw();
  ok("B: a season already open to the kids draws, with no switch and no 'Open to the kids' line", !/Open to the kids/.test(o.html()) && !/Close it to the kids/.test(o.html()) && /Christmas 2026/.test(o.html()));
  W.snKids();
  ok("B: snKids (even if called) writes nothing and says nothing", o.writes.length === 0 && o.toasts.length === 0);
}

console.log("\n# B — (4) no seasonJobs listener, and nothing waits on it");
{
  const o = world(false);
  o.W.renderSeasons(o.root, "");
  ok("B: Mom's page listens to seasons and seasonSecret only", o.listens.slice().sort().join() === "seasonSecret,seasons", o.listens);
  ok("B: …and never asks for seasonJobs in any way", !o.listens.some(p => /seasonJobs/.test(p)) && !Object.keys(o.onces).some(p => /seasonJobs/.test(p)));
  vm.runInContext("calendarData.events=" + JSON.stringify(EV()) + ";", o.W);
  const v = x => ({ val: () => JSON.parse(JSON.stringify(x)) });
  o.cbs.seasons(v(SEASON({ d1: { t: "Buy the flour", who: "dad", due: "2026-11-20" }, t1: { t: "Dough", who: "ava", due: "2026-11-20", stars: 2 } })));
  o.cbs.seasonSecret(v({}));
  ok("B: the planner is loaded and drawn with only those two answers", /Christmas 2026/.test(o.html()));
  if (o.onces.dadday) o.onces.dadday(v({}));
  let guard = 0; while (o.timers.length && guard++ < 20) o.timers.shift()();
  const dad = o.all().filter(p => /^dadday\//.test(p));
  ok("B: Dad's copy is still written (the sync never waits for the kids' jobs)", dad.length === 1 && dad[0] === "dadday/2026-11-20/todos/snd1", o.all());
  ok("B: …and no path under seasonJobs/ in any update", jobPaths(o).length === 0 && !o.all().some(p => /\/jobFor$/.test(p)), o.all());
}

console.log("\n# B — (5) Mom's tick pays nothing for a job the kid never saw");
{
  const o = B, W = o.W, T = o.T;
  o.set(SEASON({ t1: { t: "Dough", who: "ava", due: "2026-11-20", stars: 2 } }), {}, EV(), {}); o.sync(); o.writes.length = 0; o.bank.length = 0;
  W.snTodoTick("xmas", "g1", "t1"); let w = o.last();
  ok("B: the tick marks only the to-do done — no bank call, no seasonJobs path", o.bank.length === 0 && paths(w).join() === "seasons/ideas/xmas/g1/todo/t1/done" && w.val["seasons/ideas/xmas/g1/todo/t1/done"] === TODAY, w && w.val);
  W.snTodoTick("xmas", "g1", "t1"); w = o.last();
  ok("B: un-tick clears done only — no bank call", o.bank.length === 0 && paths(w).join() === "seasons/ideas/xmas/g1/todo/t1/done" && w.val["seasons/ideas/xmas/g1/todo/t1/done"] === null);
  o.set(SEASON({ t1: { t: "Dough", who: "ava", due: "2026-11-20", stars: 2, jobFor: "ava" } }), {}, EV(), OLDJOBS()); o.bank.length = 0;
  W.snTodoTick("xmas", "g1", "t1"); w = o.last();
  ok("B: old data (jobFor + a job record in memory) → still no pay and no seasonJobs path", o.bank.length === 0 && jobPaths(o).length === 0 && paths(w).join() === "seasons/ideas/xmas/g1/todo/t1/done");
  o.set(SEASON({ t1: { t: "Dough", who: "ava", due: "2026-11-20", stars: 2 } }), {}, EV(), {});
  W.tab = "moms-plan"; W.mpSubView = "plan"; const now = W.seasonNowLines(); W.mpSubView = "seasons";
  ok("B: Home Base NOW shows a kid's to-do to Mom (no kid page to leave it to)", /Dough/.test(now.html));
}

console.log("\n# Dad's to-dos — the same on both pages");
{
  const run = o => { o.set(SEASON({ d1: { t: "Buy the flour", who: "dad", due: "2026-11-22", ahead: 2 } }), {}, EV(), {}); o.sync(); return o.writes.map(w => { const v = JSON.parse(JSON.stringify(w.val)); for (const k in v) if (v[k] && v[k].ts) v[k].ts = 0; return v; }); };
  const a = run(A), b = run(B);
  ok("Dad's copy: the same ONE update on both pages", JSON.stringify(a) === JSON.stringify(b) && a.length === 1 && !!a[0]["dadday/2026-11-20/todos/snd1"] && a[0]["seasons/ideas/xmas/g1/todo/d1/dadOn"] === "2026-11-20", b);
  const L = B.T.line("xmas", "g1", "todo", "d1");
  ok("Dad's row note is the same on both pages", A.T.dadNote(A.T.line("xmas", "g1", "todo", "d1")) === B.T.dadNote(L) && /Dad’s list/.test(B.T.dadNote(L)));
  B.W.snTodoTick("xmas", "g1", "d1"); A.W.snTodoTick("xmas", "g1", "d1");
  ok("ticking Dad's to-do writes the same paths on both pages", paths(A.last()).sort().join() === paths(B.last()).sort().join() && /dadday\/2026-11-20\/todos\/snd1/.test(paths(B.last()).join()));
}

console.log("\n# B — old data reads without error and without new writes");
{
  const o = B, W = o.W, T = o.T;
  const D = SEASON({ t1: { t: "Dough", who: "ava", due: "2026-12-03", before: null, ahead: 2, stars: 3, jobFor: "ava" }, t2: { t: "Wrap", who: "ben", due: "2026-11-19", stars: 5, jobFor: "ben", done: "2026-11-19" } }, null, { kids: true });
  o.set(D, {}, EV(), {});
  let threw = null; try { T.draw(); W.snViewSet("todo"); W.snViewSet("ideas"); } catch (e) { threw = e.message; }
  ok("B: a season with kids:true and to-dos with jobFor/stars draws without error", threw === null && /Dough/.test((W.snViewSet("todo"), o.html())), threw);
  ok("B: drawing writes nothing; the sync writes nothing", o.writes.length === 0 && o.sync() === 0);
  W.snLine("todo", "g1", "t1"); W.snSet("t", "Make the dough"); W.snSave();
  const w = o.last();
  ok("B: re-wording that old to-do writes only its words (stars, ahead, jobFor untouched)", paths(w).join() === "seasons/ideas/xmas/g1/todo/t1/t" && rec(o, "g1", "t1").stars === 3 && rec(o, "g1", "t1").jobFor === "ava" && rec(o, "g1", "t1").ahead === 2, w && w.val);
  o.writes.length = 0; W.tab = "moms-plan"; W.mpSubView = "plan"; threw = null; try { W.seasonNowLines(); } catch (e) { threw = e.message; } W.mpSubView = "seasons";
  ok("B: Home Base NOW reads it without error or writes", threw === null && o.writes.length === 0, threw);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
