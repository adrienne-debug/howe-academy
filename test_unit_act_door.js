// 🎨 UACTDOOR — a one-kid unit gets a door to its activity (slice 7 of PLAN_unit_activity_types_2026-11-19 §4 row 7, §1.5; her go
//   2026-11-22/23 "go with her answers and build").
//   Runs the REAL UNITTRACK + DAYCARD (UNITACTCHK, DCACTS) + the activity kinds + UACTCLAIM + UACTDOOR, the Units page's REAL claim and
//   ✓ Done, against a fake db and a fake document. No real names.
//   · the door: "🎨 Today's activity" on a kid's own card of today whose subject points at a unit day with an activity; nothing on a
//     family card, another day's card, a read-only copy, a subject with no unit, a day with no activity
//   · taskCard's only change is that one guarded hook after the family row (its source is origin/main's plus the hook, nothing else)
//   · the sheet: ← Back, the subject + day, then exactly Today's card's 🎨 section for that day (the same renderer, byte for byte)
//   · his device: his 🙋 I did it works from the sheet (his card is his unit day); Mom: her ✓ chips; the sheet redraws on renderAll
//   · closes on ← Back, and by itself when the card is gone; writes nothing itself; phone width; no duplicate ids; balanced HTML
//   run: node test_unit_act_door.js
const fs = require("fs"), path = require("path"), vm = require("vm"), cp = require("child_process");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 600) : "")); } };
const J = x => JSON.stringify(x);
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fnIn = (s, name) => { const i = s.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < s.length; j++) { const c = s[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return s.slice(i, j + 1); };
const fn = name => fnIn(src, name);
const BLK = cut("// UACTDOOR_START", "// UACTDOOR_END") + "// UACTDOOR_END\n";
const UT = cut("// UNITTRACK_START", "// UNITTRACK_END"), DC = cut("// DAYCARD_START", "// DAYCARD_END");
const KIND = cut("// UACTKIND_START", "// UACTKIND_END"), LINK = cut("// UACTLINK_START", "// UACTLINK_END"), PRINT = cut("// UACTPRINT_START", "// UACTPRINT_END"), HANDS = cut("// UACTHANDS_START", "// UACTHANDS_END"), CLAIM = cut("// UACTCLAIM_START", "// UACTCLAIM_END");
const CRAFT = cut("// CRAFT_START", "// CRAFT_END");
const SIGN = ["_unitActs", "_nbActKeys", "_nbActWrite", "_nbActRemove", "unitActPoints", "unitActivityClaim", "unitActivityDone"].map(fn).join("\n");
const LR = "const LR_PARTS=[\"links\",\"supplies\",\"books\",\"orders\",\"notes\"];\n" + ["lrSafeUrl", "lrList", "lrStr", "lrDate", "lrClean", "lrHost"].map(fn).join("\n");
const ids = h => [...h.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
const dup = L => L.filter((x, i) => L.indexOf(x) !== i);
const balanced = h => { const st = []; for (const m of h.matchAll(/<(\/?)([a-zA-Z0-9]+)[^>]*?(\/?)>/g)) { const t = m[2].toLowerCase(); if (/^(input|img|br|hr|meta|link)$/.test(t) || m[3]) continue; if (!m[1]) st.push(t); else if (st.pop() !== t) return false; } return st.length === 0; };

console.log("── wiring ──");
ok("UACTDOOR is one marked block right after UACTCLAIM", src.indexOf("// UACTCLAIM_END\n// UACTDOOR_START") > 0 && src.split("// UACTDOOR_START").length === 2);
const code = BLK.split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n");
ok("the block never calls the database, loads no script, sets no timer (its only .remove() is the sheet's own element)", !/\bdb\b|\.ref\(|\.set\(|\.update\(|\.on\(|\.once\(|\.transaction\(|createElement\("script"|setTimeout|setInterval|addEventListener/.test(code) && (code.match(/\.remove\(\)/g) || []).length === 1 && /if\(el\) el\.remove\(\);/.test(code));
const NAMES = /\b(adrienne|andrew|julian|lincoln|ellis|lucy|sara|sarah|caleb|taylor|makenzie|kenzie|dewalt|burris|melanie|howe)\b/i;
ok("no kid or family name in the block or this test, no 🔀", !NAMES.test(BLK) && BLK.indexOf("\u{1F500}") < 0 && !NAMES.test(fs.readFileSync(__filename, "utf8").split("\n").filter(l => !/^const NAMES =/.test(l)).join("\n")));
const HOOK = `+((typeof uadBtnHTML==="function"&&uadBtnHTML(t,done,readOnly))||"")`;
ok("taskCard's hook sits right after the family row, once, typeof-guarded", fn("taskCard").split("+famRow" + HOOK + "+dr+spinBtn+").length === 2 && src.split(HOOK).length === 2);
ok("renderAll's one guarded line redraws an open sheet, after the family resources panel's", /frPanelPaint\(\); \}catch\(e\)\{\}[^\n]*\n  try\{ if\(typeof uadPaint==="function"\) uadPaint\(\); \}catch\(e\)\{\}/.test(fn("renderAll")) && src.split('if(typeof uadPaint==="function") uadPaint();').length === 2);
{
  let base = null; try { base = cp.execSync("git show origin/main:index.html", { cwd: __dirname, maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] }).toString(); } catch (e) { base = null; }
  if (base && base.indexOf("// UACTDOOR_START") < 0) ok("taskCard = origin/main's taskCard plus only that hook (so every card it already drew is byte-identical when the hook returns \"\")", fn("taskCard").replace(HOOK, "") === fnIn(base, "taskCard"));
  else ok("taskCard minus the hook has no other trace of the block", fn("taskCard").replace(HOOK, "").indexOf("uad") < 0);
  if (base && base.indexOf("// UACTDOOR_START") < 0) ok("renderAll = origin/main's plus only that line", fn("renderAll").replace(/\n  try\{ if\(typeof uadPaint==="function"\) uadPaint\(\); \}catch\(e\)\{\}[^\n]*/, "") === fnIn(base, "renderAll"));
}
ok("the sheet's state is its own (uadState), never stored on another feature's object (wbView, dcState …)", /^var uadState=null;/m.test(BLK) && !/wbView|dcState\.|wbdView/.test(code));

const UNIT = () => ({ id: "rock", title: "Rocks", emoji: "🪨", enrolled: { k1: true }, decks: [],
  activities: [
    { key: "magnet", title: "Magnet test", emoji: "🎨", kind: "sheet", points: 5, day: 2, type: "hands", desc: "Which rocks stick?", steps: ["Hold the magnet near each rock", "Sort them"], supplies: [{ qty: "1", name: "magnet", kids: true }] },
    { key: "draw", title: "Draw your rocks", emoji: "🎨", kind: "sheet", points: 3, day: 2 },
    { key: "video", title: "Rock video", emoji: "🎨", kind: "sheet", points: 2, day: 3, type: "link", url: "https://example.org/rocks", kidOpen: true }],
  track: { mode: "seq", perWeek: 4, craft: { title: "Rock painting", supplies: [{ name: "paint" }] }, days: [
    { id: "d1", n: 1, t: "What is a rock?", res: { books: [{ title: "Rock Book" }] } },
    { id: "d2", n: 2, t: "Magnets", nb: { activity: "magnet" }, res: { books: [{ title: "Magnet Book" }], supplies: [{ name: "rocks" }] }, note: "Outside if dry.", rungs: { early: "Which stuck?" } },
    { id: "d3", n: 3, t: "Watch", nb: { activity: "video" } }] } });
function world(o) {
  o = o || {}; const writes = [], banked = [], body = [];
  const els = {};
  const mkEl = () => { const e = { id: "", style: {}, attrs: {}, innerHTML: "", setAttribute(k, v) { this.attrs[k] = v; }, remove() { delete els[this.id]; const i = body.indexOf(this); if (i >= 0) body.splice(i, 1); } }; return e; };
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, Promise, Error, parseInt, isNaN, isFinite, WeakMap, URL,
    unitStudies: { rock: o.unit || UNIT() }, ROSTER: ["k1", "k2"], KID_NAME: { k1: "Ada", k2: "Ben" }, kcKid: o.kcKid || "",
    momHere: () => ctx.MOM, MOM: !!o.mom, _dryRun: () => false, gwShowToast: () => {}, confirm: () => true,
    db: { ref: p => ({ set: v => writes.push(["set", p]), update: v => writes.push(["update", p]), remove: () => writes.push(["remove", p]), transaction: () => writes.push(["tx", p]), child: () => null }) },
    bankDirect: (k, p) => banked.push([k, p]),
    _todayDay: "monday", effectiveDay: t => t.day, weekData: { tasks: o.tasks || [] }, getActiveTasks: () => ctx.weekData.tasks,
    currData: { subjects: { k1: { geo: { display: "Earth Science", unit: { id: "rock" }, lessonSeq: ["What is a rock?", "Magnets", "Watch"] }, math: { display: "Math", lessonSeq: ["L1", "L2"] } } }, lessons: {}, resources: {} },
    taskLessonRef: t => t.ref || "", llLessonKey: t => "", dcTodayGroups: () => [],
    document: { getElementById: id => els[id] || null, createElement: () => mkEl(), body: { appendChild: e => { body.push(e); if (e.id) els[e.id] = e; } } } };
  ctx.renderAll = () => { ctx.repaints = (ctx.repaints || 0) + 1; try { if (typeof ctx.uadPaint === "function") ctx.uadPaint(); } catch (e) { } };
  vm.createContext(ctx);
  vm.runInContext(LR + "\n" + UT + "\n" + DC + "\n" + CRAFT + "\n" + KIND + "\n" + LINK + "\n" + PRINT + "\n" + HANDS + "\n" + CLAIM + "\n" + (o.before ? "" : BLK) + "\n" + SIGN + "\nObject.defineProperty(this,'__st',{get:()=>typeof uadState==='undefined'?undefined:uadState});", ctx);
  ctx.dcTodayGroups = () => [];
  return { ctx, writes, banked, body, els };
}
const T = (o) => Object.assign({ id: "t1", who: "k1", subjectKey: "geo", day: "monday", ref: "Magnets", title: "Earth Science", detail: "" }, o || {});

console.log("\n── the door ──");
{
  const c = world({ tasks: [T()] }).ctx, h = c.uadBtnHTML(T(), false, false);
  ok("his own Earth Science card today (lesson 2 → the unit's Day 2, two activities): \"🎨 Today's activities\", 44 px, opens the sheet for this card",
    /^<div style="margin-top:6px"><button data-uad-door="1" onclick="event\.stopPropagation\(\);uadOpen\('t1'\)" style="min-height:44px;[^"]*">🎨 Today’s activities<\/button><\/div>$/.test(h), h);
  ok("a day with one activity says \"activity\"", /Today’s activity</.test(c.uadBtnHTML(T({ ref: "Watch" }), false, false)));
  ok("done cards keep it (the activity is its own record)", c.uadBtnHTML(T(), true, false) === h);
  ok("nothing on: a read-only copy · a family card · another day's card · a subject with no unit · a unit day with no activity · no subject",
    [c.uadBtnHTML(T(), false, true), c.uadBtnHTML(T({ famBlock: "ft", famItem: "un" }), false, false), c.uadBtnHTML(T({ day: "tuesday" }), false, false), c.uadBtnHTML(T({ subjectKey: "math", ref: "L2" }), false, false), c.uadBtnHTML(T({ ref: "What is a rock?" }), false, false), c.uadBtnHTML(T({ subjectKey: "" }), false, false)].every(x => x === ""));
  ok("its HTML is balanced, no element id (a page can hold many cards)", balanced(h) && ids(h).length === 0);
  const fam = { id: "f1", famBlock: "ft", famItem: "un", who: "k1", day: "monday" }; let called = 0; const c2 = world().ctx; c2.utDayForTask = () => { called++; return null; };
  ok("a family card returns \"\" before reading anything (byte-for-byte: famRow+\"\"+dr…)", c2.uadBtnHTML(fam, false, false) === "" && called === 0);
}

console.log("\n── the sheet = Today's card's 🎨 section ──");
const SEC = '<section style="margin-top:22px"><div style="font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;color:#a5b4fc">🎨 Today’s ';
const sectionOf = h => { const i = h.indexOf(SEC); if (i < 0) return ""; const j = h.indexOf("<section", i + 1); return h.slice(i, j < 0 ? h.length : j); };
for (const [who, o] of [["Mom", { mom: true }], ["his device", { kcKid: "k1" }], ["the board", {}]]) {
  const w = world(Object.assign({ tasks: [T()] }, o)); const c = w.ctx;
  const full = c.dcDayHTML({ day: c.utRef("rock", c.utDay(c.unitStudies.rock, "d2")), u: c.unitStudies.rock, first: null, present: ["k1"] });
  const acts = c.uadActsHTML(c.uadGroup(T()));
  ok(who + ": the sheet's activity view IS Today's card's 🎨 section for Day 2, byte for byte — and nothing else of the day (no book, craft, rungs, note)",
    acts.length > 500 && acts === sectionOf(full) && full.indexOf("Magnet Book") > 0 && full.indexOf("Rock painting") > 0 && acts.indexOf("Magnet Book") < 0 && acts.indexOf("Rock painting") < 0 && acts.indexOf("Which stuck?") < 0 && acts.indexOf("Outside if dry") < 0, [acts.length, sectionOf(full).length]);
}
{
  const w = world({ tasks: [T()], kcKid: "k1" }); const c = w.ctx;
  ok("uadOpen: true; ONE div#uad-sheet on the page, fixed, full screen, scrolls, above the app and under the page viewer (z 10040 < 10050)",
    c.uadOpen("t1") === true && w.body.length === 1 && w.body[0].id === "uad-sheet" && /position:fixed;inset:0;z-index:10040;overflow-y:auto/.test(w.body[0].style.cssText) && w.body[0].attrs.role === "dialog" && src.indexOf('ov.style.cssText="position:fixed;inset:0;z-index:10050;') > 0);
  const h = w.body[0].innerHTML;
  ok("…← Back (44 px), the subject and the day, the day's title, then the activity rows", /<button onclick="uadClose\(\)" style="min-height:44px;[^"]*">← Back<\/button>/.test(h) && h.indexOf("Earth Science · Day 2") > 0 && h.indexOf("Magnets</h1>") > 0 && h.indexOf("Magnet test") > h.indexOf("</h1>") && h.indexOf("Draw your rocks") > 0);
  ok("…the 🧪 steps and supplies, the ✍️ Whiteboard, and his own 🙋 I did it are there", /data-uah-steps/.test(h) && /🎒 1 magnet/.test(h) && /data-wbd-row|wbdOpen|data-uac-claim="open"/.test(h) && (h.match(/data-uac-claim="open"/g) || []).length === 2, h.slice(0, 200));
  ok("…no element ids inside (the only id is the sheet's own), balanced HTML, phone width (max-width, 16 px sides, nothing fixed-wide)", ids(h).length === 0 && balanced(h) && /max-width:860px;margin:0 auto;padding:16px 16px 32px;box-sizing:border-box/.test(h) && !/[^-]width:\d{3,}px/.test(h));
  ok("…opening wrote nothing", w.writes.length === 0);
  c.uacTap("rock", "k1", "magnet");
  ok("his 🙋 from the sheet: the claim is written (his card of today is his unit day), and the sheet redraws with ⏳", J(w.writes) === J([["set", "unitStudies/rock/activityClaims/k1/magnet"]]) && /data-uac-claim="wait"/.test(w.body[0].innerHTML) && w.body.length === 1, w.writes);
  c.uadClose(); ok("← Back: the sheet is gone, the state cleared", w.body.length === 0 && c.__st === null);
  ok("renderAll with it closed does nothing", (c.renderAll(), w.body.length === 0));
}
{
  const w = world({ tasks: [T()], mom: true }); const c = w.ctx; c.uadOpen("t1");
  ok("Mom: her ✓ chips in the sheet; ✓ → the Units page's ✓ Done, points as there, the sheet redraws with ✓", /dcActTap\('rock','k1','magnet'\)/.test(w.body[0].innerHTML) && (c.dcActTap("rock", "k1", "magnet"), J(w.writes) === J([["set", "unitStudies/rock/activityLog/k1/magnet"]]) && J(w.banked) === J([["k1", 5]]) && /Ada <span>✓<\/span>/.test(w.body[0].innerHTML)), w.writes);
  c.weekData.tasks = []; c.renderAll(); ok("the card gone (a re-lay, the next day): the sheet closes itself on the next paint", w.body.length === 0 && c.__st === null);
  ok("uadOpen on a card with no activity / a family card: false, nothing drawn", (c.weekData.tasks = [T({ id: "t2", ref: "What is a rock?" }), T({ id: "t3", famBlock: "ft" })], c.uadOpen("t2") === false && c.uadOpen("t3") === false && c.uadOpen("nope") === false && w.body.length === 0));
}
{
  const w = world({ tasks: [T({ ref: "Watch" })], kcKid: "k2" }); w.ctx.uadOpen("t1"); const h = w.body[0].innerHTML;
  ok("a sibling's device opening it: no 🙋 (only the card's kid's chip could be his, and it is not)", h.indexOf("data-uac-claim") < 0 && /▶ Open: Rock video/.test(h));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
