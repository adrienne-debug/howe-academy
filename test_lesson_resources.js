/*
 * Node tests for LESSONRES (2026-10-23): a lesson carries its resources; the Sunday list replaces the
 * Supplies tab; photo capture drafts items onto lessons.
 *
 *  - lrFor: a lesson's own part wins, a part it says nothing about falls back to the subject default (_subject).
 *  - lrWrite: ONE targeted path (curriculum/resources/<kid>/<sk>/<lid>/<part> or …/_subject/<part>); an empty list
 *    clears the part (null); Mom-only; ?dryrun=1 inert.
 *  - The card: 2+ links → one small "Links (n) ▾" menu that REPLACES the LESSONLINK button; one link → one button.
 *  - The Sunday list from a fixture of this week's and next week's laid lessons: grouped by kid then kind, ticks keyed by
 *    kid+subject+kind+item, "by Thu" lead-time labels, Mom's Day rows for items due within two days, ✓ Got it = the tick.
 *  - Staples cycle have → low → out at supplies/staples/<id>; low and out ones join the list.
 *  - SUP_DEFAULT is gone; a family with nothing sees the one empty-state line.
 *  - Photo capture: the answer parses; "Lesson 12" maps to the laid lesson, an unknown ref to the subject default;
 *    nothing is written until Save; unticked rows are dropped.
 *  - A kid's card line shows only kids:true supplies and never notes.
 *  - Hooks: taskCard, the Grid cell menu, the Grid sheet, Mom's Day 🔴 Now, the Firebase listeners, the tab button.
 *
 *   run:  node test_lesson_resources.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + (typeof extra === "string" ? extra : JSON.stringify(extra)) + ")" : "")); }
}
function slice(a, b) { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("missing " + a); return src.slice(i, j + b.length); }
function extractFn(name) {
  const i = src.indexOf("function " + name + "(");
  if (i < 0) throw new Error("not found: " + name);
  let depth = 0, started = false;
  for (let k = src.indexOf("{", i); k < src.length; k++) {
    const c = src[k];
    if (c === "{") { depth++; started = true; }
    else if (c === "}") { depth--; if (started && depth === 0) return src.slice(i, k + 1); }
  }
  throw new Error("unbalanced: " + name);
}

// ── the real slices ──
const LL = slice("// LESSONLINK_START", "// LESSONLINK_END");
const LR = slice("// LESSONRES_START", "// LESSONRES_END");
ok("LESSONRES block is marked and sits right after LESSONLINK_END", src.indexOf("// LESSONRES_START") === src.indexOf("// LESSONLINK_END") + "// LESSONLINK_END\n".length);
ok("LESSONRES block appears once", src.split("// LESSONRES_START").length === 2 && src.split("// LESSONRES_END").length === 2);

// ── a sandbox: the app's globals the block reaches for ──
const TODAY = "2026-10-23";   // a Friday → this week Mon 10/19–Sun 10/25, next week 10/26–11/1
function mkWorld(opt) {
  opt = opt || {};
  const writes = [], removes = [];
  const DOM = {};
  const ctx = {
    console, Date, JSON, Math, Number, String, Array, Object, Set, RegExp, Promise, URL, parseInt, isNaN, encodeURIComponent, setTimeout,
    currData: opt.currData,
    weekData: { tasks: [] },
    db: { ref: p => ({ set: v => writes.push([p, v]), remove: () => removes.push(p), on: () => {}, once: () => {} }) },
    _writes: writes, _removes: removes, _dom: DOM,
    momHere: () => opt.mom !== false,
    _dryRun: () => !!opt.dry,
    esc: s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
    cap: s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s,
    ROSTER: ["lincoln", "ellis", "lucy", "julian"],
    KID_COLOR: { lincoln: "#1e3a5f", ellis: "#2b7a78", lucy: "#6b4c93", julian: "#e07b39" },
    WK: "week12", activeWk: () => "week12",
    supplies: opt.supplies || {},
    tab: "supplies",
    cbTodayISO: () => TODAY,
    gvFilled: v => !!(v && v !== "—" && v !== "nan" && String(v).trim()),
    _lidNorm: s => String(s == null ? "" : s).replace(/[–—−]/g, "-").replace(/\s+/g, " ").trim().toLowerCase(),
    planBacked: () => false,
    renderAll: () => { ctx._renders = (ctx._renders || 0) + 1; },
    sv: () => {}, ld: () => null,
    HA_LS: { getItem: () => null, setItem: () => {} },
    confirm: () => true, alert: () => {}, gwShowToast: m => { ctx._toast = m; },
    showTab: t => { ctx._tab = t; },
    document: { getElementById: id => DOM[id] || null },
    gvKid: "lincoln", gvMenu: null,
    kitCapKey: () => (opt.key === undefined ? "sk-ant-test" : opt.key),
  };
  // lidsFor / lidStamped / lidDoneSet / lidForTask / taskLessonRef — the app's own shapes
  ctx.lidsFor = (kid, sk) => { const s = (((ctx.currData || {}).subjects || {})[kid] || {})[sk]; return (s && Array.isArray(s.lessonIds) && Array.isArray(s.lessonSeq) && s.lessonIds.length === s.lessonSeq.length) ? s.lessonIds : null; };
  ctx.lidStamped = (kid, sk) => { const s = (((ctx.currData || {}).subjects || {})[kid] || {})[sk]; return !!(s && s.doneImportedAt && ctx.lidsFor(kid, sk)); };
  ctx.lidDoneSet = (kid, sk) => ctx.lidStamped(kid, sk) ? new Set(Object.keys(((((ctx.currData || {}).done || {})[kid] || {})[sk]) || {})) : null;
  ctx.taskLessonRef = t => { const m = String(t && t.title || "").match(/[—–]\s*(.+)$/); return m ? m[1].trim() : ""; };
  ctx.lidForTask = t => {
    if (!t || !t.who || !t.subjectKey) return null; if (t.lid) return t.lid;
    if (!ctx.lidStamped(t.who, t.subjectKey)) return null;
    const s = ctx.currData.subjects[t.who][t.subjectKey], ids = ctx.lidsFor(t.who, t.subjectKey), k = ctx._lidNorm(ctx.taskLessonRef(t));
    for (let i = 0; i < s.lessonSeq.length; i++) if (ctx._lidNorm(s.lessonSeq[i]) === k) return ids[i];
    return null;
  };
  ctx.gwGetSubjects = kid => ((ctx.currData || {}).subjects || {})[kid] || {};
  ctx.gvCellIdentity = (kid, dn, sk) => ({ mode: "stored", text: String(((((ctx.currData || {}).lessons || {})[kid] || {})[dn] || {})[sk] || "") });
  ctx.gvCellLesson = (kid, dn, sk) => { const text = ctx.gvCellIdentity(kid, dn, sk).text; const ids = ctx.lidsFor(kid, sk); if (!ids) return null; const seq = ctx.currData.subjects[kid][sk].lessonSeq; const i = seq.findIndex(x => ctx._lidNorm(x) === ctx._lidNorm(text)); return i < 0 ? null : { i, lid: ids[i], text }; };
  vm.createContext(ctx);
  vm.runInContext(LL + "\n" + LR, ctx, { filename: "lessonres.js" });
  ctx.get = name => vm.runInContext(name, ctx);
  return ctx;
}
function fixture() {
  return {
    subjects: {
      lincoln: { math: { display: "Math", lessonSeq: ["Lesson 11", "Lesson 12", "Lesson 13", "Lesson 14"], lessonIds: ["L11", "L12", "L13", "L14"], doneImportedAt: "2026-08-01" } },
      ellis: { science: { display: "Science", lessonSeq: ["Ch.2", "Ch.3"], lessonIds: ["S2", "S3"], doneImportedAt: "2026-08-01" },
               reading: { display: "Reading" } },   // not stamped: keyed by the ref text
      lucy: {}, julian: {},
    },
    done: { lincoln: { math: { L11: true } } },
    lessons: {
      lincoln: { 1: { date: "2026-10-22", math: "Lesson 12" }, 2: { date: "2026-10-27", math: "Lesson 13" }, 3: { date: "2026-11-03", math: "Lesson 14" }, 4: { date: "2026-10-16", math: "Lesson 11" } },
      ellis: { 1: { date: "2026-10-28", science: "Ch.3", reading: "Frog and Toad" }, 2: { date: "2026-10-21", reading: "Frog and Toad 2" } },
    },
    resources: {
      lincoln: { math: {
        _subject: { supplies: [{ name: "ruler", kids: true }], links: [{ url: "https://mathlady.example/all", label: "Math Lady" }], notes: "Default notes — Mom only" },
        L12: { supplies: [{ name: "glue stick", qty: "2", kids: true }, { name: "scissors", kids: false }], books: [{ title: "Charlotte's Web", by: "E. B. White", checkoutBy: "2026-10-24" }], notes: "Print p. 40 first" },
        L13: { orders: [{ name: "Protractor", url: "https://shop.example/protractor", orderBy: "2026-10-29" }] },
      } },
      ellis: { science: { S3: { supplies: [{ name: "baking soda", kids: true }, { name: "vinegar", kids: true }] } },
               reading: { _subject: { books: [{ title: "Frog and Toad Are Friends" }] } } },
    },
  };
}

// ── 1. the record: own part wins, missing part → subject default ──
{
  const W = mkWorld({ currData: fixture() });
  const r = W.lrFor("lincoln", "math", "L12");
  ok("L12 keeps its own supplies (glue stick, scissors)", r.supplies.length === 2 && r.supplies[0].name === "glue stick" && r.supplies[0].qty === "2" && r.supplies[1].kids === false, r.supplies);
  ok("L12 says nothing about links → the subject default's link", r.links.length === 1 && r.links[0].url === "https://mathlady.example/all" && r._from.links === "subject");
  ok("L12's own notes win over the subject notes", r.notes === "Print p. 40 first" && r._from.notes === "lesson");
  ok("L12 has no orders anywhere → []", Array.isArray(r.orders) && r.orders.length === 0 && r._from.orders === "none");
  const r13 = W.lrFor("lincoln", "math", "L13");
  ok("L13 inherits the subject supplies (ruler) and notes", r13.supplies.length === 1 && r13.supplies[0].name === "ruler" && r13._from.supplies === "subject" && r13.notes === "Default notes — Mom only" && r13._from.notes === "subject");
  ok("a lesson with no record at all is the subject default", W.lrFor("lincoln", "math", "L99").links.length === 1 && W.lrFor("lincoln", "math", "L99").supplies[0].name === "ruler");
  ok("a subject with no resources at all → empty every part", W.lrFor("lucy", "art", "X").supplies.length === 0 && W.lrFor("lucy", "art", "X").notes === "");
  ok("a http:// link is dropped on read (https only, like LESSONLINK)", W.lrClean("links", [{ url: "http://x.example/a" }, { url: "https://x.example/b" }]).length === 1);
  ok("a Firebase array that came back as {0:…,1:…} reads as a list", W.lrClean("supplies", { 0: { name: "a" }, 1: { name: "b" } }).length === 2);
}

// ── 2. targeted writes ──
{
  const W = mkWorld({ currData: fixture() });
  ok("lrWrite writes ONE path: …/<kid>/<sk>/<lid>/<part>", W.lrWrite("lincoln", "math", "L13", "supplies", [{ name: "compass", qty: "", kids: true }]) && W._writes.length === 1
    && W._writes[0][0] === "curriculum/resources/lincoln/math/L13/supplies" && W._writes[0][1].length === 1 && W._writes[0][1][0].name === "compass" && W._writes[0][1][0].qty === undefined, W._writes);
  ok("…and the in-memory record follows", W.lrFor("lincoln", "math", "L13").supplies[0].name === "compass" && W.lrFor("lincoln", "math", "L13")._from.supplies === "lesson");
  W.lrWrite("lincoln", "math", "L13", "supplies", []);
  ok("an empty list clears the part (set null) → the subject default shows through again", W._writes[1][0] === "curriculum/resources/lincoln/math/L13/supplies" && W._writes[1][1] === null && W.lrFor("lincoln", "math", "L13").supplies[0].name === "ruler");
  W.lrWrite("lincoln", "math", "_subject", "notes", "  Every lesson: sharpen pencils  ");
  ok("the subject default writes to …/_subject/<part>", W._writes[2][0] === "curriculum/resources/lincoln/math/_subject/notes" && W._writes[2][1] === "Every lesson: sharpen pencils");
  ok("a bad part name is refused", W.lrWrite("lincoln", "math", "L13", "tasks", [1]) === false && W._writes.length === 3);
  ok("never a whole-node write", W._writes.every(w => /^curriculum\/resources\/[^/]+\/[^/]+\/[^/]+\/(links|supplies|books|orders|notes)$/.test(w[0])));
  const K = mkWorld({ currData: fixture(), mom: false });
  ok("not Mom → nothing written", K.lrWrite("lincoln", "math", "L13", "supplies", [{ name: "x" }]) === false && K._writes.length === 0);
  const D = mkWorld({ currData: fixture(), dry: true });
  D.lrWrite("lincoln", "math", "L13", "supplies", [{ name: "x" }]);
  ok("?dryrun=1 → memory changes, Firebase untouched", D._writes.length === 0 && D.lrFor("lincoln", "math", "L13").supplies[0].name === "x");
  ok("every db write in the block is guarded by db&&!lrDry()", (LR.match(/db\.ref\(/g) || []).length > 0 && (LR.match(/db\.ref\([^)]*\)\.(set|remove)\(/g) || []).every(() => true)
    && LR.split("\n").filter(l => /db\.ref\([^)]*\)\.(set|remove)\(/.test(l)).every(l => /db&&!lrDry\(\)/.test(l)), LR.split("\n").filter(l => /db\.ref\([^)]*\)\.(set|remove)\(/.test(l) && !/db&&!lrDry\(\)/.test(l)));
}

// ── 3. the card: links menu ──
{
  const W = mkWorld({ currData: fixture() });
  const t = { id: "t1", who: "lincoln", subjectKey: "math", title: "Math — Lesson 12" };
  const subj = W.currData.subjects.lincoln.math;
  const two = W.lrCardParts(t, subj, "https://mathlady.example/5B/12", false, false);
  ok("LESSONLINK link + one record link → a small menu with 2 links", /Links \(2\) ▾/.test(two.menu) && (two.menu.match(/<a /g) || []).length === 2 && /mathlady\.example\/5B\/12/.test(two.menu) && /mathlady\.example\/all/.test(two.menu));
  ok("menu links open in a new tab, no opener", (two.menu.match(/target="_blank" rel="noopener noreferrer"/g) || []).length === 2);
  const L13 = { id: "t2", who: "lincoln", subjectKey: "math", title: "Math — Lesson 13" };
  const one = W.lrCardParts(L13, subj, "", false, false);
  ok("one link (the record's) and no LESSONLINK → one button, no menu", !/Links \(/.test(one.menu) && (one.menu.match(/<a /g) || []).length === 1 && /Math Lady/.test(one.menu));
  W.currData.resources.lincoln.math._subject.links = [];
  const only = W.lrCardParts(t, subj, "https://mathlady.example/5B/12", false, false);
  ok("only the LESSONLINK link → the card keeps its one button (menu empty)", only.menu === "");
  ok("a done card carries nothing", W.lrCardParts(t, subj, "https://mathlady.example/5B/12", false, true).menu === "" && W.lrCardParts(t, subj, "x", false, true).kids === "");
  const tc = extractFn("taskCard");
  ok("taskCard asks lrCardParts and blanks its own button when the menu takes over", /const _lr=\(\(typeof lrCardParts==="function"\)\?lrCardParts\(t,_llS,_llU,readOnly,done\):null\)\|\|\{menu:"",kids:""\}; if\(_lr\.menu\) _llU="";/.test(tc) && /let _llU=_llS\?llUrlFor\(t,_llS\):"";/.test(tc));
  ok("the menu and the kids' line ride at the end of the card's row chain, after the notebook rows", /nbRedoRow\+mpdRow\+_lr\.menu\+_lr\.kids\+\(\(typeof mmCardRow/.test(tc));
}

// ── 4. the Sunday list ──
{
  const W = mkWorld({ currData: fixture() });
  const w0 = W.lrWeekRange(0, TODAY), w1 = W.lrWeekRange(1, TODAY);
  ok("this week is Mon 10/19 – Sun 10/25, next week 10/26 – 11/1", w0.from === "2026-10-19" && w0.to === "2026-10-25" && w1.from === "2026-10-26" && w1.to === "2026-11-01", [w0, w1]);
  const sun = W.lrWeekRange(0, "2026-10-25");
  ok("on a Sunday 'this week' is the week that starts tomorrow", sun.from === "2026-10-26" && sun.to === "2026-11-01", sun);
  const laid = W.lrLaidLessons("lincoln", w0.from, w1.to);
  ok("laid lessons for the two weeks: Lesson 12 (10/22) and Lesson 13 (10/27), keyed by lesson id — not 10/16 or 11/3", laid.length === 2 && laid[0].key === "L12" && laid[0].date === "2026-10-22" && laid[1].key === "L13", laid);
  const el = W.lrLaidLessons("ellis", w0.from, w1.to);
  ok("an unstamped subject is keyed by its ref text", el.some(x => x.sk === "reading" && x.key === "frog_and_toad") && el.some(x => x.sk === "science" && x.key === "S3"), el);
  const list = W.lrBuildList({ today: TODAY });
  ok("grouped by kid (roster order) then by kind", list.kids.map(k => k.kid).join(",") === "lincoln,ellis" && list.kids[0].kinds.map(k => k.kind).join(",") === "supplies,books,orders" && list.kids[1].kinds.map(k => k.kind).join(",") === "supplies,books", list.kids.map(k => [k.kid, k.kinds.map(x => x.kind)]));
  const sup = list.kids[0].kinds[0].items;
  const ruler = sup.find(i => i.name === "ruler"), glue = sup.find(i => i.name === "glue stick"), sc = sup.find(i => i.name === "scissors");
  ok("L12 owns its supplies so the default ruler is NOT on it: glue stick and scissors this week, ruler (via L13) next week", ruler && ruler.weeks.join(",") === "1" && glue && glue.weeks.join(",") === "0" && sc && sc.weeks.join(",") === "0", sup.map(i => [i.name, i.weeks]));
  const frog = list.kids[1].kinds[1].items[0];
  ok("a subject-default book needed by a lesson in each week is ONE row with two ticks", frog.name === "Frog and Toad Are Friends" && frog.weeks.join(",") === "0,1" && frog.lessons.length === 2, frog);
  ok("ticks are keyed by kid+subject+kind+item, stable across re-lays", ruler.id === "lr_lincoln_math_supplies_ruler" && glue.id === "lr_lincoln_math_supplies_glue_stick" && W.lrItemId("lincoln", "math", "supplies", "Glue Stick!") === glue.id);
  ok("the Sunday list hides nothing a kid can't see — but never notes", !JSON.stringify(list).includes("Print p. 40") && !JSON.stringify(list).includes("Default notes") && sc.name === "scissors");
  const book = list.kids[0].kinds[1].items[0], order = list.kids[0].kinds[2].items[0];
  ok("a book due tomorrow (Sat 10/24) reads 'by Sat'; an order due Thu 10/29 reads 'by Thu'", book.by === "by Sat" && order.by === "by Thu" && order.url === "https://shop.example/protractor", [book.by, order.by]);
  ok("lead-time labels: today / further out / slipped", W.lrByLabel("2026-10-23", TODAY) === "by today" && W.lrByLabel("2026-11-05", TODAY) === "by 11/5" && W.lrByLabel("2026-10-20", TODAY) === "was due 10/20");
  ok("ellis's lessons carry baking soda, vinegar and the Frog and Toad book", list.kids[1].kinds[0].items.map(i => i.name).join(",") === "baking soda,vinegar" && list.kids[1].kinds[1].items[0].name === "Frog and Toad Are Friends");
  ok("n counts every item", list.n === 8, list.n);
  // ticks + Mom's Day rows
  const due = W.lrDueSoon(list, {}, {});
  ok("Mom's Day rows: only the book due within two days (not the order due in six)", due.length === 1 && due[0].name === "Charlotte's Web" && due[0].w === 0, due.map(d => d.name));
  const due2 = W.lrDueSoon(list, { [book.id]: true }, {});
  ok("…and a ticked one is gone", due2.length === 0);
  const now = W.lrNowHTML();
  ok("lrNowHTML → {n, html} with ✓ Got it that ticks the item", now.n === 1 && /Check out <b>Charlotte&#39;s Web|Check out <b>Charlotte's Web/.test(now.html.replace(/&#39;/g, "'")) && /lrTick\('lr_lincoln_math_books_charlotte_s_web',0\)/.test(now.html) && /✓ Got it/.test(now.html), now.html.slice(0, 300));
  W.lrTick(book.id, 0);
  ok("a this-week tick writes <active week>/supplies/<id> = true", W._writes.length === 1 && W._writes[0][0] === "week12/supplies/lr_lincoln_math_books_charlotte_s_web" && W._writes[0][1] === true, W._writes);
  W.lrTick(ruler.id, 1);
  ok("a next-week tick writes <next week>/supplies/<id>", W._writes[1][0] === "week13/supplies/lr_lincoln_math_supplies_ruler" && W._writes[1][1] === true);
  W.lrTick(ruler.id, 1);
  ok("ticking again clears it (set null)", W._writes[2][1] === null);
  ok("a ticked item reads ticked for its week only", W.lrTicked(book.id, 0) === true && W.lrTicked(book.id, 1) === false);
  const html = W.lrSundayHTML(list);
  ok("the rendered list shows the kid, the kinds, the 'by Thu', the lesson and both tick boxes", /Lincoln/.test(html) && /🎒 Supplies/.test(html) && /📚 Books/.test(html) && /🛒 To order/.test(html) && /by Thu/.test(html) && /Lesson 12/.test(html) && /class="sup-cb on"/.test(html) && /lrTick\('lr_lincoln_math_supplies_ruler',1\)/.test(html));
  ok("notes never reach the rendered list", !/Print p\. 40/.test(html) && !/Default notes/.test(html));
  ok("renderSupplies and openSuppliesForDay now live in the block", /function renderSupplies\(el\)/.test(LR) && /function openSuppliesForDay\(\)\{ showTab\("supplies"\); \}/.test(LR));
  const con = { innerHTML: "" }; W.renderSupplies(con);
  ok("renderSupplies(el) draws the Sunday list", /Sunday list/.test(con.innerHTML) && /glue stick/.test(con.innerHTML));
  ok("the Mom's Day 🔴 Now hook is in place", /try\{ const _lr=lrNowHTML\(\); nowN\+=_lr\.n; h\+=_lr\.html; \}catch\(e\)\{\}/.test(src));
}

// ── 5. staples ──
{
  const W = mkWorld({ currData: fixture() });
  W.lrStapleAdd("pencils");
  const id = Object.keys(W.get("lrStaples"))[0];
  ok("adding a staple writes supplies/staples/<id> = {name, state:have}", W._writes.length === 1 && W._writes[0][0] === "supplies/staples/" + id && W._writes[0][1].name === "pencils" && W._writes[0][1].state === "have", W._writes);
  ok("a stocked staple is not on the list", W.lrStaplesNeeded().length === 0);
  W.lrStapleCycle(id);
  ok("tap → low, written to the same path", W._writes[1][0] === "supplies/staples/" + id && W._writes[1][1].state === "low");
  ok("low → on the Sunday list's Staples group", W.lrStaplesNeeded().length === 1 && W.lrBuildList({ today: TODAY }).staples[0].name === "pencils");
  W.lrStapleCycle(id);
  ok("tap → out, still on the list", W._writes[2][1].state === "out" && W.lrStaplesNeeded()[0].state === "out");
  W.lrStapleCycle(id);
  ok("tap → have again, off the list", W._writes[3][1].state === "have" && W.lrStaplesNeeded().length === 0);
  ok("the staples store is its own, not the Kitchen's", !/kitchen\/staples/.test(LR) && /supplies\/staples\//.test(LR));
  const K = mkWorld({ currData: fixture(), mom: false });
  K.lrStapleAdd("glue"); ok("staples are Mom's to edit", K._writes.length === 0 && Object.keys(K.get("lrStaples")).length === 0);
  W.lrStapleDel(id);
  ok("removing a staple is one targeted remove", W._removes.length === 1 && W._removes[0] === "supplies/staples/" + id);
  const H = mkWorld({ currData: fixture() }); H.lrStapleAdd("printer paper"); H.lrStapleCycle(Object.keys(H.get("lrStaples"))[0]);
  const html = H.lrSundayHTML(H.lrBuildList({ today: TODAY }));
  ok("the rendered Staples group shows the low chip with its tap", /🧷 Staples/.test(html) && /🟡 printer paper/.test(html) && /lrStapleCycle\(/.test(html) && /1 low or out/.test(html));
}

// ── 6. the old list is gone; empty state ──
{
  ok("SUP_DEFAULT, SUP_CATS_DEFAULT and the old renderer are gone", !/SUP_DEFAULT=/.test(src) && !/SUP_CATS_DEFAULT/.test(src) && !/function togSup\(/.test(src) && !/function selSupDay\(/.test(src) && !/AAS Level 1 Book/.test(src));
  ok("the old renderer's filter/day state is gone too", !/supDay/.test(src) && !/collCats/.test(src));
  const E = mkWorld({ currData: { subjects: { lincoln: {}, ellis: {}, lucy: {}, julian: {} }, lessons: {}, resources: {} } });
  const list = E.lrBuildList({ today: TODAY });
  const html = E.lrSundayHTML(list);
  ok("a family with no resources sees the empty-state line", list.n === 0 && html.includes("Add supplies to a lesson, snap a photo of a materials list, or set your staples — they show up here."));
  const F = mkWorld({ currData: fixture() });
  ok("…and a family with items does not", !F.lrSundayHTML(F.lrBuildList({ today: TODAY })).includes("they show up here"));
  ok("the tab button is the Sunday list, same slot (openSuppliesForDay)", /Sunday list<\/span><\/button>/.test(src) && /openSuppliesForDay\(\)/.test(src) && /else if\(tab==="supplies"\) renderSupplies\(c\);/.test(src));
}

// ── 7. photo capture ──
{
  const W = mkWorld({ currData: fixture() });
  const items = W.lrCapParse('Here you go:\n{"items":[{"item":"Glue sticks","qty":"4","ref":"Lesson 12","kind":"supply"},{"item":"Protractor","qty":"","ref":"Lesson 99","kind":"order"},{"item":"Charlotte\'s Web","ref":"","kind":"book"},{"item":"","ref":"Lesson 1"},{"item":"Ruler","ref":"L13"}]}\nDone.');
  ok("the answer parses: blank items dropped, kinds normalized", items.length === 4 && items[0].kind === "supply" && items[1].kind === "order" && items[2].kind === "book" && items[3].kind === "supply", items);
  const laid = W.lrCapLaid("lincoln", "math");
  const drafts = W.lrCapMap(items, laid, "_subject");
  ok("'Lesson 12' maps to the laid lesson L12; 'L13' to L13", drafts[0].key === "L12" && drafts[0].matched && drafts[3].key === "L13", drafts.map(d => [d.ref, d.key]));
  ok("an unknown ref ('Lesson 99') and no ref fall to the subject default", drafts[1].key === "_subject" && !drafts[1].matched && drafts[2].key === "_subject");
  ok("every draft starts ticked, kids-visible", drafts.every(d => d.on && d.kids));
  ok("drafting writes nothing", W._writes.length === 0);
  drafts[1].on = false;   // Mom unticks the protractor
  const plan = W.lrCapPlanWrites(drafts, "lincoln", "math");
  ok("one write per lesson + part; the unticked row is dropped", plan.length === 3 && !JSON.stringify(plan).includes("Protractor"), plan.map(p => [p.key, p.part, p.value.length]));
  const l12 = plan.find(p => p.key === "L12" && p.part === "supplies");
  ok("L12's supplies get the glue sticks APPENDED to what it already owns (2 → 3)", l12 && l12.value.length === 3 && l12.value[2].name === "Glue sticks" && l12.value[2].qty === "4" && l12.value[2].kids === true, l12 && l12.value);
  const def = plan.find(p => p.key === "_subject" && p.part === "books");
  ok("the book goes to the subject default's books", def && def.value.length === 1 && def.value[0].title === "Charlotte's Web");
  const l13 = plan.find(p => p.key === "L13" && p.part === "supplies");
  ok("L13 had no own supplies: it starts from a COPY of the default (ruler) plus the new one", l13 && l13.value.map(x => x.name).join(",") === "ruler,Ruler");
  ok("still nothing written before Save", W._writes.length === 0);
  // Save through the real door
  vm.runInContext('lrCapState={where:"list",kid:"lincoln",sk:"math",defaultKey:"_subject",mode:null,busy:false,msg:"",drafts:' + JSON.stringify(drafts) + '}', W);
  W.lrCapSave();
  ok("Save writes the three targeted paths and closes the drafts", W._writes.length === 3 && W._writes.map(w => w[0]).sort().join("|") === "curriculum/resources/lincoln/math/L12/supplies|curriculum/resources/lincoln/math/L13/supplies|curriculum/resources/lincoln/math/_subject/books" && W.get("lrCapState") === null, W._writes.map(w => w[0]));
  ok("the saved items are on the record now", W.lrFor("lincoln", "math", "L12").supplies.length === 3 && W.lrFor("lincoln", "math", "L14").books[0].title === "Charlotte's Web");
  // bad answer, no key, panel default
  let threw = false; try { W.lrCapParse("I can't see a list here."); } catch (e) { threw = true; }
  ok("an answer with no JSON throws (shown as the message, not saved)", threw);
  const N = mkWorld({ currData: fixture(), key: "" });
  const nbtn = N.lrCapButtonsHTML("list");
  ok("no key → the 📷 button is not a file picker; it opens the box", !/type="file"/.test(nbtn) && /lrCapOpen\('list'\)/.test(nbtn));
  N.lrCapOpen("list");
  ok("…whose first line says where the key goes (Settings, like the Kitchen)", /Needs a Claude key — Admin ▸ Settings ▸ ✨ AI key/.test(N.lrCapHTML()) && N.get("lrCapState").msg.indexOf("Settings") > 0);
  ok("with a key the 📷 button is the photo picker itself", /type="file"/.test(W.lrCapButtonsHTML("list")) && /_cbShrinkImage/.test(LR) && /kitCapAsk\(/.test(LR));
  ok("the prompt asks for item, qty and the printed lesson reference, and forbids inventing", /"item"/.test(W.get("LR_CAP_PROMPT")) && /"qty"/.test(W.get("LR_CAP_PROMPT")) && /"ref"/.test(W.get("LR_CAP_PROMPT")) && /never invent/.test(W.get("LR_CAP_PROMPT")));
  const pd = W.lrCapMap([{ item: "Chalk", ref: "", kind: "supply" }], laid, "L12");
  ok("from the Grid panel an unreferenced item defaults to THAT lesson", pd[0].key === "L12");
  ok("drafts render with a lesson picker that lists the laid lessons and the subject default", (function () { vm.runInContext('lrCapState={where:"list",kid:"lincoln",sk:"math",defaultKey:"_subject",mode:null,busy:false,msg:"",drafts:' + JSON.stringify(pd) + '}', W); const h = W.lrCapDraftsHTML(); return /Every Math lesson/.test(h) && /Lesson 12 \(Thu 10\/22\)/.test(h) && /Lesson 13 \(Tue 10\/27\)/.test(h) && /lrCapSave\(\)/.test(h) && /Nothing is written until you do/.test(h); })());
}

// ── 8. the kid's card line ──
{
  const W = mkWorld({ currData: fixture() });
  const t = { id: "t1", who: "lincoln", subjectKey: "math", title: "Math — Lesson 12" };
  const parts = W.lrCardParts(t, W.currData.subjects.lincoln.math, "", true, false);
  ok("the line shows only kids:true supplies — glue stick, not scissors", /🎒 bring: 2 glue stick/.test(parts.kids) && !/scissors/.test(parts.kids), parts.kids);
  ok("notes never reach the card", !/Print p\. 40/.test(parts.kids) && !/Print p\. 40/.test(parts.menu));
  ok("a read-only card still gets the kids' line (it is theirs), but no link menu", parts.kids !== "" && parts.menu === "");
  const l13 = W.lrCardParts({ id: "t2", who: "lincoln", subjectKey: "math", title: "Math — Lesson 13" }, W.currData.subjects.lincoln.math, "", false, false);
  ok("a lesson with no own supplies shows the subject default's (ruler)", /🎒 bring: ruler/.test(l13.kids));
  ok("books and orders are not on the kid's line", !/Charlotte/.test(parts.kids) && !/Protractor/.test(l13.kids));
  ok("nothing when no kid-visible supplies", W.lrKidLineHTML({ supplies: [{ name: "scissors", kids: false }] }) === "" && W.lrKidLineHTML({ supplies: [] }) === "");
}

// ── 9. the Grid panel ──
{
  const W = mkWorld({ currData: fixture() });
  W.lrOpenPanel("lincoln", 1, "math");
  const P = W.get("lrPanel");
  ok("tapping 📎 on the Lesson 12 cell opens the panel for L12", P && P.kid === "lincoln" && P.sk === "math" && P.key === "L12" && P.text === "Lesson 12", P);
  const h = W.lrPanelHTML("lincoln");
  ok("the panel shows links, supplies, books, orders and notes", /🔗 Links/.test(h) && /🎒 Supplies/.test(h) && /📚 Books to check out/.test(h) && /🛒 To order/.test(h) && /📝 Notes/.test(h));
  ok("…its items, with edit / remove", /glue stick/.test(h) && /lrEditItem\('supplies',0\)/.test(h) && /lrRemoveItem\('supplies',1\)/.test(h) && /hidden from kids/.test(h));
  ok("…marks the inherited links as the subject default and offers 'Set for every Math lesson'", /subject default/.test(h) && /Set for every Math lesson/.test(h) && /lrSetSubjectDefault\('supplies'\)/.test(h));
  ok("…and the kids-can-see checkbox, on by default", /id="lr-in-supplies-kids" checked/.test(h));
  ok("the panel is for Mom only", mkWorld({ currData: fixture(), mom: false }).lrPanelHTML("lincoln") === "" && (function () { const K = mkWorld({ currData: fixture(), mom: false }); K.lrOpenPanel("lincoln", 1, "math"); return K.get("lrPanel") === null; })());
  // add a supply through the inputs
  W._dom["lr-in-supplies-name"] = { value: " Crayons " }; W._dom["lr-in-supplies-qty"] = { value: "" }; W._dom["lr-in-supplies-kids"] = { checked: false };
  W.lrAddItem("supplies");
  ok("+ Add writes the lesson's supplies (own list + the new one), kids flag honoured", W._writes.length === 1 && W._writes[0][0] === "curriculum/resources/lincoln/math/L12/supplies" && W._writes[0][1].length === 3 && W._writes[0][1][2].name === "Crayons" && W._writes[0][1][2].kids === false, W._writes);
  W._dom["lr-in-links-url"] = { value: "http://nope.example" }; W._dom["lr-in-links-label"] = { value: "" };
  W.lrAddItem("links");
  ok("a non-https link is refused with a message, not written", W._writes.length === 1 && /https:\/\//.test(W._toast));
  W.lrSetSubjectDefault("supplies");
  ok("'Set for every Math lesson' writes the shown list to _subject/supplies", W._writes[1][0] === "curriculum/resources/lincoln/math/_subject/supplies" && W._writes[1][1].length === 3);
  W.lrRemoveItem("supplies", 2);
  ok("✕ removes one item and rewrites the one part", W._writes[2][0] === "curriculum/resources/lincoln/math/L12/supplies" && W._writes[2][1].length === 2);
  W._dom["lr-in-notes"] = { value: "Bring the red folder" }; W.lrSaveNotes();
  ok("notes save to …/L12/notes", W._writes[3][0] === "curriculum/resources/lincoln/math/L12/notes" && W._writes[3][1] === "Bring the red folder");
  W.lrUseDefault("supplies");
  ok("'use default' clears the lesson's own list (null) so the subject default shows", W._writes[4][0] === "curriculum/resources/lincoln/math/L12/supplies" && W._writes[4][1] === null);
  W.lrOpenPanel("ellis", 1, "reading");
  ok("an unstamped subject's cell opens the panel keyed by its ref text", W.get("lrPanel").key === "frog_and_toad");
  // hooks in the Grid
  const grid = extractFn("renderCurrGrid");
  ok("the cell menu carries 📎 for Mom (one line)", /if\(gvFilled\(v\)&&momHere\(\)&&typeof lrGridBtnHTML==="function"\) m\+=lrGridBtnHTML\(gvKid,dn,sk\);/.test(grid));
  ok("the Grid draws the resources sheet (one line)", /if\(typeof lrPanelHTML==="function"\) h\+=lrPanelHTML\(gvKid\);/.test(grid));
  ok("the Firebase listeners start with the others (one line)", /if\(typeof lrListen==="function"\) lrListen\(\);/.test(src) && /db\.ref\("curriculum\/resources"\)\.on\("value"/.test(LR) && /db\.ref\("supplies\/staples"\)\.on\("value"/.test(LR));
}

// ── 10. nothing else moved ──
ok("the scheduler / generator / lay are untouched by the block", !/MOMLOOP_|DAYSTART_|SCHOOLEND_|REPROJ_/.test(LR) && !/weekData\.tasks\.(push|splice)/.test(LR));
ok("Family Time is untouched", !/famBlock|famRowHTML|FAM_ICON/.test(LR));
ok("no 🔀 in the block", !LR.includes("\u{1F500}"));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
