/*
 * Node tests for LRPLANNER (2026-10-23, #13): the Builder planner view over the LESSONRES record.
 *
 *  - The table: a "Subject default" row first, then one row per lesson of lessonSeq; columns Lesson · Links · Supplies ·
 *    Books · To order · Notes.
 *  - Rows are keyed EXACTLY as the Grid's 📎 panel keys the lesson (lrOpenPanel): lesson ids when the subject carries
 *    lessonIds, else lrKeyForText.
 *  - Inherited (subject default) items are faded and labelled "default"; a lesson's own items are not.
 *  - A cell edit goes through the existing panel → lrWrite: exactly curriculum/resources/<kid>/<sk>/<key>/<part>.
 *  - Mom-only (no toggle, no table, no write without momHere()); ?dryrun=1 inert.
 *  - Zero lessons / no resources: just the default row and an empty line, nothing throws.
 *  - 📷 From a photo opens the existing capture preset to this kid + subject.
 *  - Hook: cbRenderForm's Builder (non-embedded) view only; no 🔀; block sits right after LESSONRES_END.
 *
 *   run:  node test_lr_planner.js
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

const LL = slice("// LESSONLINK_START", "// LESSONLINK_END");
const LR = slice("// LESSONRES_START", "// LESSONRES_END");
const LRP = slice("// LRPLANNER_START", "// LRPLANNER_END");

// ── placement + hooks ──
ok("LRPLANNER block sits right after LESSONRES_END", src.indexOf("// LRPLANNER_START") === src.indexOf("// LESSONRES_END") + "// LESSONRES_END\n".length);
ok("LRPLANNER block appears once", src.split("// LRPLANNER_START").length === 2 && src.split("// LRPLANNER_END").length === 2);
{
  const i = src.indexOf("function cbRenderForm("), j = src.indexOf("// Mode chips", i);
  const head = src.slice(i, j);
  ok("cbRenderForm hooks the planner in the Builder view only (not the embedded card form)", /if\(!embedded&&typeof lrpBuilderHTML==="function"\) h\+=lrpBuilderHTML\(kid,sk\);/.test(head));
  ok("the hook is the only place the planner is drawn", src.split("lrpBuilderHTML(").length === 3);   // definition + hook
}
ok("no 🔀 in the block", LRP.indexOf("🔀") < 0);
ok("the block never calls db directly — writes go through lrWrite", !/\bdb\.ref\(/.test(LRP) && !/\blrWrite\(/.test(LRP));
ok("nothing in the block touches the scheduler / generator / lay", !/MOMLOOP_|DAYSTART_|REPROJ_|reprojectSubjectWeek|cbBuild|saveScheduleOverrides|weekData/.test(LRP));

// ── sandbox ──
function mkWorld(opt) {
  opt = opt || {};
  const writes = [];
  const DOM = {};
  const ctx = {
    console, Date, JSON, Math, Number, String, Array, Object, Set, RegExp, Promise, URL, parseInt, isNaN, encodeURIComponent,
    setTimeout: fn => fn(),
    currData: opt.currData,
    db: { ref: p => ({ set: v => writes.push([p, v]), remove: () => writes.push([p, null]), on: () => {}, once: () => {} }) },
    _writes: writes, _dom: DOM,
    momHere: () => opt.mom !== false,
    _dryRun: () => !!opt.dry,
    esc: s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"),
    cap: s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s,
    ROSTER: ["lincoln", "ellis", "lucy", "julian"],
    KID_COLOR: {}, WK: "week12", activeWk: () => "week12", supplies: {}, tab: "curriculum",
    cbTodayISO: () => "2026-10-23",
    gvFilled: v => !!(v && v !== "—" && v !== "nan" && String(v).trim()),
    _lidNorm: s => String(s == null ? "" : s).replace(/[–—−]/g, "-").replace(/\s+/g, " ").trim().toLowerCase(),
    planBacked: () => false,
    renderAll: () => { ctx._renders = (ctx._renders || 0) + 1; },
    sv: () => {}, ld: () => null,
    confirm: () => true, alert: () => {}, gwShowToast: m => { ctx._toast = m; },
    document: { getElementById: id => DOM[id] || null },
    gvKid: "lincoln", gvMenu: null,
    kitCapKey: () => (opt.key === undefined ? "sk-ant-test" : opt.key),
  };
  ctx.lidsFor = (kid, sk) => { const s = (((ctx.currData || {}).subjects || {})[kid] || {})[sk]; return (s && Array.isArray(s.lessonIds) && Array.isArray(s.lessonSeq) && s.lessonIds.length === s.lessonSeq.length) ? s.lessonIds : null; };
  ctx.lidStamped = (kid, sk) => { const s = (((ctx.currData || {}).subjects || {})[kid] || {})[sk]; return !!(s && s.doneImportedAt && ctx.lidsFor(kid, sk)); };
  ctx.lidDoneSet = (kid, sk) => ctx.lidStamped(kid, sk) ? new Set(Object.keys(((((ctx.currData || {}).done || {})[kid] || {})[sk]) || {})) : null;
  ctx.gwGetSubjects = kid => ((ctx.currData || {}).subjects || {})[kid] || {};
  // The Grid's cell identity, as test_lesson_resources.js models it.
  ctx.gvCellIdentity = (kid, dn, sk) => ({ mode: "stored", text: String(((((ctx.currData || {}).lessons || {})[kid] || {})[dn] || {})[sk] || "") });
  ctx.gvCellLesson = (kid, dn, sk) => { const text = ctx.gvCellIdentity(kid, dn, sk).text; const ids = ctx.lidsFor(kid, sk); if (!ids) return null; const seq = ctx.currData.subjects[kid][sk].lessonSeq; const i = seq.findIndex(x => ctx._lidNorm(x) === ctx._lidNorm(text)); return i < 0 ? null : { i, lid: ids[i], text }; };
  vm.createContext(ctx);
  vm.runInContext(LL + "\n" + LR + "\n" + LRP, ctx, { filename: "lrplanner.js" });
  ctx.get = name => vm.runInContext(name, ctx);
  ctx.set = (name, v) => { ctx.__v = v; vm.runInContext(name + "=__v", ctx); };
  return ctx;
}
function fixture() {
  return {
    subjects: {
      lincoln: { math: { display: "Math", lessonSeq: ["Lesson 11", "Lesson 12", "Lesson 13"], lessonIds: ["L11", "L12", "L13"], doneImportedAt: "2026-08-01" },
                 empty: { display: "Art" } },
      ellis: { reading: { display: "Reading", lessonSeq: ["Frog and Toad", "Owl at Home 2.1"] } },   // no ids: keyed by the text
      lucy: {}, julian: {},
    },
    done: { lincoln: { math: { L11: true } } },
    lessons: {
      lincoln: { 1: { date: "2026-10-22", math: "Lesson 12" } },
      ellis: { 1: { date: "2026-10-22", reading: "Owl at Home 2.1" } },
    },
    resources: {
      lincoln: { math: {
        _subject: { supplies: [{ name: "ruler", kids: true }], notes: "Default notes" },
        L12: { supplies: [{ name: "glue stick", qty: "2", kids: true }], books: [{ title: "Charlotte's Web" }] },
      } },
    },
  };
}
const rowsOf = h => (h.match(/class="lrp-row" data-lrp-key="([^"]*)"/g) || []).map(m => m.replace(/.*data-lrp-key="/, "").replace(/"$/, ""));
function rowHTML(h, key) { const i = h.indexOf('data-lrp-key="' + key + '"'); const j = h.indexOf('class="lrp-row"', i + 10); return h.slice(i, j < 0 ? h.length : j); }
function cellHTML(row, part) { const i = row.indexOf('data-lrp-part="' + part + '"'); const j = row.indexOf('data-lrp-part=', i + 10); return row.slice(i, j < 0 ? row.length : j); }

// ── 1. a row per lesson + the default row ──
{
  const W = mkWorld({ currData: fixture() });
  W.lrpToggle("lincoln", "math");
  const h = W.lrpBuilderHTML("lincoln", "math");
  ok("the toggle reads 📋 Plan resources", /📋 Plan resources/.test(h));
  ok("rows: Subject default first, then one per lesson in book order", JSON.stringify(rowsOf(h)) === JSON.stringify(["_subject", "L11", "L12", "L13"]), rowsOf(h));
  ok("the default row is labelled Subject default", /⭐ Subject default/.test(rowHTML(h, "_subject")));
  ok("the columns: Lesson · Links · Supplies · Books · To order · Notes", ["Lesson", "🔗 Links", "🎒 Supplies", "📚 Books", "🛒 To order", "📝 Notes"].every(c => h.indexOf(c) >= 0));
  ok("every row carries all five cells", ["_subject", "L11", "L12", "L13"].every(k => ["links", "supplies", "books", "orders", "notes"].every(p => rowHTML(h, k).indexOf('data-lrp-part="' + p + '"') >= 0)));
  ok("a finished lesson says ✓ done", /✓ done/.test(rowHTML(h, "L11")) && !/✓ done/.test(rowHTML(h, "L12")));
  ok("closed by default, closed again on a second tap", (function () { const K = mkWorld({ currData: fixture() }); const a = K.lrpBuilderHTML("lincoln", "math"); K.lrpToggle("lincoln", "math"); K.lrpToggle("lincoln", "math"); const b = K.lrpBuilderHTML("lincoln", "math"); return a.indexOf("data-lrp-table") < 0 && b.indexOf("data-lrp-table") < 0; })());
  ok("open for one subject only", W.lrpBuilderHTML("lincoln", "empty").indexOf("data-lrp-table") < 0);
  ok("phone width: rows wrap (flex-wrap, min-width:0), no fixed-width table", /lrp-row[^>]*flex-wrap:wrap/.test(h) && h.indexOf("<table") < 0 && !/[;"]min-width:\s*[3-9]\d\dpx/.test(h));
}

// ── 2. keyed exactly as the Grid panel keys the lesson ──
{
  const W = mkWorld({ currData: fixture() });
  W.lrOpenPanel("lincoln", 1, "math");
  const gridKey = W.get("lrPanel").key;
  const rowKey = W.lrpRows("lincoln", "math").find(r => r.label === "Lesson 12").key;
  ok("lesson ids: the planner row key = the Grid panel key", gridKey === "L12" && rowKey === gridKey, [gridKey, rowKey]);
  const E = mkWorld({ currData: fixture() });
  E.lrOpenPanel("ellis", 1, "reading");
  const gk = E.get("lrPanel").key;
  const rk = E.lrpRows("ellis", "reading").find(r => r.label === "Owl at Home 2.1").key;
  ok("no ids: the planner row key = the Grid panel key (lrKeyForText)", gk === rk && gk === E.lrKeyForText("ellis", "reading", "Owl at Home 2.1"), [gk, rk]);
  ok("…and that key is Firebase-safe", !/[.#$\/\[\]\s]/.test(rk), rk);
}

// ── 3. inherited items marked ──
{
  const W = mkWorld({ currData: fixture() });
  W.lrpToggle("lincoln", "math");
  const h = W.lrpBuilderHTML("lincoln", "math");
  const r11 = rowHTML(h, "L11"), r12 = rowHTML(h, "L12"), def = rowHTML(h, "_subject");
  ok("a lesson that says nothing shows the default supplies faded + labelled default", /data-lrp-inherited="1" style="opacity:.55">ruler/.test(cellHTML(r11, "supplies")) && /data-lrp-default="1"[^>]*>default</.test(cellHTML(r11, "supplies")));
  ok("…and the default notes the same way", /data-lrp-inherited="1"[^>]*>Default notes/.test(cellHTML(r11, "notes")) && /default</.test(cellHTML(r11, "notes")));
  ok("a lesson's own items are plain (no default tag)", /2 glue stick/.test(cellHTML(r12, "supplies")) && cellHTML(r12, "supplies").indexOf("data-lrp-inherited") < 0 && cellHTML(r12, "supplies").indexOf("data-lrp-default") < 0);
  ok("own books plain, while its notes still inherit", /Charlotte&#39;s Web|Charlotte's Web/.test(cellHTML(r12, "books")) && cellHTML(r12, "books").indexOf("data-lrp-inherited") < 0 && cellHTML(r12, "notes").indexOf("data-lrp-inherited") >= 0);
  ok("the default row shows its own items plain", /ruler/.test(cellHTML(def, "supplies")) && def.indexOf("data-lrp-inherited") < 0);
  ok("an empty cell shows a dash", /—/.test(cellHTML(r11, "links")));
}

// ── 4. a cell edit writes exactly …/<kid>/<sk>/<key>/<part> with the Grid panel's key ──
{
  const W = mkWorld({ currData: fixture() });
  W.lrpToggle("lincoln", "math");
  W._dom["lr-in-supplies-name"] = { value: "protractor", focus() { W._focused = "lr-in-supplies-name"; }, scrollIntoView() {} };
  W._dom["lr-in-supplies-qty"] = { value: "" };
  W._dom["lr-in-supplies-kids"] = { checked: true };
  W.lrpEdit("lincoln", "math", "L13", "supplies");
  const P = W.get("lrPanel");
  ok("tapping a cell opens the Grid's 📎 panel on that lesson", P && P.kid === "lincoln" && P.sk === "math" && P.key === "L13" && P.text === "Lesson 13");
  ok("…with the cursor in that part's first box", W._focused === "lr-in-supplies-name");
  ok("…and the panel draws in the Builder while the planner is open", /📎 Resources/.test(W.lrpBuilderHTML("lincoln", "math")));
  W.lrAddItem("supplies");
  ok("one write, exactly curriculum/resources/lincoln/math/L13/supplies", W._writes.length === 1 && W._writes[0][0] === "curriculum/resources/lincoln/math/L13/supplies", W._writes);
  ok("…a copy of the default plus the new item (the default doesn't vanish)", JSON.stringify(W._writes[0][1]) === JSON.stringify([{ name: "ruler", kids: true }, { name: "protractor", kids: true }]), W._writes[0][1]);
  ok("…and the row shows it as the lesson's own now", (function () { const r = rowHTML(W.lrpBuilderHTML("lincoln", "math"), "L13"); return /ruler, protractor/.test(cellHTML(r, "supplies")) && cellHTML(r, "supplies").indexOf("data-lrp-inherited") < 0; })());
  // the default row edits _subject/<part>
  W._writes.length = 0;
  W._dom["lr-in-notes"] = { value: "Bring the ruler box", focus() {}, scrollIntoView() {} };
  W.lrpEdit("lincoln", "math", "_subject", "notes");
  W.lrSaveNotes();
  ok("the default row writes exactly curriculum/resources/lincoln/math/_subject/notes", W._writes.length === 1 && W._writes[0][0] === "curriculum/resources/lincoln/math/_subject/notes" && W._writes[0][1] === "Bring the ruler box", W._writes);
  // the Grid door and the planner door write the same path for the same lesson
  const G = mkWorld({ currData: fixture() });
  G.lrOpenPanel("ellis", 1, "reading");
  G._dom["lr-in-books-title"] = { value: "Owl at Home" }; G._dom["lr-in-books-by"] = { value: "" }; G._dom["lr-in-books-checkoutBy"] = { value: "" };
  G.lrAddItem("books");
  const Pl = mkWorld({ currData: fixture() });
  const k = Pl.lrpRows("ellis", "reading")[1].key;
  Pl.lrpEdit("ellis", "reading", k, "books");
  Pl._dom["lr-in-books-title"] = { value: "Owl at Home" }; Pl._dom["lr-in-books-by"] = { value: "" }; Pl._dom["lr-in-books-checkoutBy"] = { value: "" };
  Pl.lrAddItem("books");
  ok("Grid door and planner door write the same path for the same lesson", G._writes.length === 1 && Pl._writes.length === 1 && G._writes[0][0] === Pl._writes[0][0] && JSON.stringify(G._writes[0][1]) === JSON.stringify(Pl._writes[0][1]), [G._writes, Pl._writes]);
  ok("an unknown row key opens nothing", (function () { const K = mkWorld({ currData: fixture() }); K.lrpEdit("lincoln", "math", "nope", "links"); return K.get("lrPanel") === null; })());
}

// ── 5. Mom-only; dry-run inert ──
{
  const K = mkWorld({ currData: fixture(), mom: false });
  K.lrpToggle("lincoln", "math");
  ok("not Mom: no toggle, no table", K.lrpBuilderHTML("lincoln", "math") === "" && K.lrpTableHTML("lincoln", "math") === "" && K.get("lrpOpen") === null);
  K.lrpEdit("lincoln", "math", "L12", "supplies");
  ok("not Mom: a row tap opens nothing", K.get("lrPanel") === null);
  K.lrpCapOpen("lincoln", "math");
  ok("not Mom: the photo capture doesn't open", K.get("lrCapState") === null);
  K.set("lrPanel", { kid: "lincoln", sk: "math", key: "L12", text: "Lesson 12", edit: null });
  K._dom["lr-in-supplies-name"] = { value: "x" }; K._dom["lr-in-supplies-qty"] = { value: "" };
  K.lrAddItem("supplies");
  ok("not Mom: no write", K._writes.length === 0);
  const D = mkWorld({ currData: fixture(), dry: true });
  D.lrpEdit("lincoln", "math", "L12", "links");
  D._dom["lr-in-links-url"] = { value: "https://example.com/x" }; D._dom["lr-in-links-label"] = { value: "" };
  D.lrAddItem("links");
  ok("?dryrun=1: nothing reaches Firebase", D._writes.length === 0);
}

// ── 6. zero lessons / no resources ──
{
  const W = mkWorld({ currData: fixture() });
  W.lrpToggle("lincoln", "empty");
  let h = "", threw = null;
  try { h = W.lrpBuilderHTML("lincoln", "empty"); } catch (e) { threw = e; }
  ok("a subject with no lessons draws without throwing", !threw, threw && String(threw));
  ok("…just the default row and the empty line", JSON.stringify(rowsOf(h)) === '["_subject"]' && /No lessons in this subject yet/.test(h));
  ok("…every default cell is a dash", ["links", "supplies", "books", "orders", "notes"].every(p => /—/.test(cellHTML(rowHTML(h, "_subject"), p))));
  const N = mkWorld({ currData: { subjects: { lincoln: { math: { display: "Math", lessonSeq: ["A", "", null, "B"] } } } } });
  N.lrpToggle("lincoln", "math");
  let h2 = "", t2 = null;
  try { h2 = N.lrpBuilderHTML("lincoln", "math"); } catch (e) { t2 = e; }
  ok("no resources node at all: safe, blank lesson lines skipped", !t2 && JSON.stringify(rowsOf(h2)) === '["_subject","a","b"]', t2 ? String(t2) : rowsOf(h2));
  ok("an unknown subject: no rows, no throw", (function () { try { return mkWorld({ currData: fixture() }).lrpRows("lincoln", "nope").length === 0; } catch (e) { return false; } })());
  ok("no currData: no throw", (function () { try { const Z = mkWorld({ currData: null }); Z.lrpToggle("lincoln", "math"); Z.lrpBuilderHTML("lincoln", "math"); return true; } catch (e) { return false; } })());
}

// ── 7. 📷 From a photo, preset to this kid + subject ──
{
  const W = mkWorld({ currData: fixture() });
  W.lrpToggle("lincoln", "math");
  ok("the table carries the 📷 From a photo button (the file picker when a key is set)", /📷 From a photo/.test(W.lrpTableHTML("lincoln", "math")) && /lrpCapOpen\('lincoln','math'\);lrCapAddPhotos\(this\)/.test(W.lrpTableHTML("lincoln", "math")));
  W.lrpCapOpen("lincoln", "math");
  const C = W.get("lrCapState");
  ok("it opens the existing capture for this kid + subject, defaulting to the subject default", C && C.where === "planner" && C.kid === "lincoln" && C.sk === "math" && C.defaultKey === "_subject");
  ok("…and draws inside the planner", /📷 From a photo — a materials list/.test(W.lrpTableHTML("lincoln", "math")));
  ok("other kids' capture works too (ellis/reading)", (function () { const K = mkWorld({ currData: fixture() }); K.lrpCapOpen("ellis", "reading"); const c = K.get("lrCapState"); return c.kid === "ellis" && c.sk === "reading"; })());
  const NK = mkWorld({ currData: fixture(), key: "" });
  NK.lrpToggle("lincoln", "math");
  ok("no key: a button that opens the box saying where the key goes", /onclick="lrpCapOpen\('lincoln','math'\)"/.test(NK.lrpTableHTML("lincoln", "math")));
  W.lrpToggle("lincoln", "math");
  ok("closing the planner closes its capture", W.get("lrCapState") === null);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
