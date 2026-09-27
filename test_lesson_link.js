/*
 * Node tests for the per-lesson link on a card (LESSONLINK, 2026-09-27).
 *
 *  - llParseRef / llFillTemplate: "5B Ch.12 L2" fills {book}/{chapter}/{lesson}/{ref}; a ref
 *    with no chapter leaves a {chapter} hole unfilled → no link (never a half-built URL).
 *  - llUrlFor: a per-lesson override (subject.lessonUrls[<lesson id>]) wins over the template;
 *    no template and no override → "" (no row); anything not https:// is refused.
 *  - llSetOverride writes ONE targeted path (lessonUrls/<id>), never the whole map; Mom-only.
 *  - Wiring: the subject edit sheet carries the template / label / per-lesson fields, and
 *    taskCard draws llRow between the workbook and Editor in Chief rows.
 *
 *   run:  node test_lesson_link.js
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

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

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra ? "  (" + extra + ")" : "")); }
}

const blockStart = src.indexOf("// LESSONLINK_START"), blockEnd = src.indexOf("// LESSONLINK_END");
ok("LESSONLINK block is marked", blockStart > 0 && blockEnd > blockStart);

// ── The pure pieces, lifted straight out of index.html ──
const ENV = {
  subjects: {},        // kid → sk → subject
  lidFor: null,        // stubbed lidForTask result
  saved: {},           // ceSaveField sink
  refs: [],            // db.ref(path) log
  mom: true
};
const lib = new Function("ENV", `
  const _lidNorm=s=>String(s==null?"":s).replace(/[–—−]/g,"-").replace(/\\s+/g," ").trim().toLowerCase();
  function taskLessonRef(t){ const m=String(t&&t.title||"").match(/[—–]\\s*(.+)$/); return m?m[1].trim():""; }
  function lidForTask(t){ return ENV.lidFor; }
  function gwGetSubjects(kid){ return ENV.subjects[kid]||{}; }
  function momHere(){ return ENV.mom; }
  const currData={get subjects(){ return ENV.subjects; }, lastEdit:""}, ceEditKid="lincoln", ceEditKey="singapore_l";
  const db={ ref:function(p){ ENV.refs.push(p); return { set:function(v){ ENV.saved[p]=v; } }; } };
  function ceSaveField(f,v){ ENV.saved[f]=v; }
  function ceRenderEditSheet(){}
  function renderAll(){}
  ${extractFn("llParseRef")}
  ${extractFn("llFillTemplate")}
  ${extractFn("llSafeUrl")}
  ${extractFn("llKeyForRef")}
  ${extractFn("llLessonKey")}
  ${extractFn("llSubjectFor")}
  ${extractFn("llUrlFor")}
  ${extractFn("llLabelFor")}
  let llPickKey="", llMsg="";
  ${extractFn("llSetOverride")}
  return {llParseRef,llFillTemplate,llSafeUrl,llKeyForRef,llLessonKey,llUrlFor,llLabelFor,
    llSetOverride, msg:function(){ return llMsg; }};
`)(ENV);

console.log("\nA) Parsing a lesson ref\n");
(() => {
  const p = lib.llParseRef("5B Ch.12 L2");
  ok("5B Ch.12 L2 → book 5B", p.book === "5B", p.book);
  ok("5B Ch.12 L2 → chapter 12", p.chapter === "12", p.chapter);
  ok("5B Ch.12 L2 → lesson 2", p.lesson === "2", p.lesson);
  ok("raw ref kept", p.ref === "5B Ch.12 L2", p.ref);
  const q = lib.llParseRef("4A Ch.1 L5");
  ok("4A Ch.1 L5 → 4A / 1 / 5", q.book === "4A" && q.chapter === "1" && q.lesson === "5", JSON.stringify(q));
  const r = lib.llParseRef("Lesson 7");
  ok("a ref with no chapter: chapter is empty", r.chapter === "" && r.lesson === "7" && r.book === "", JSON.stringify(r));
  const s = lib.llParseRef("6A Chapter 3 Lesson 4");
  ok("long forms read too", s.book === "6A" && s.chapter === "3" && s.lesson === "4", JSON.stringify(s));
  const u = lib.llParseRef("Ex. 39–40");
  ok("a workbook page ref has none of the three", u.book === "" && u.chapter === "" && u.lesson === "", JSON.stringify(u));
  ok("empty ref is safe", lib.llParseRef("").ref === "");
})();

console.log("\nB) Filling a template\n");
const TPL = "https://videos.example.com/{book}/ch-{chapter}/lesson-{lesson}";
(() => {
  ok("5B Ch.12 L2 fills the template",
    lib.llFillTemplate(TPL, lib.llParseRef("5B Ch.12 L2")) === "https://videos.example.com/5B/ch-12/lesson-2",
    lib.llFillTemplate(TPL, lib.llParseRef("5B Ch.12 L2")));
  ok("4A Ch.1 L5 fills the template",
    lib.llFillTemplate(TPL, lib.llParseRef("4A Ch.1 L5")) === "https://videos.example.com/4A/ch-1/lesson-5");
  ok("a ref with no chapter leaves {chapter} unfillable → no URL",
    lib.llFillTemplate(TPL, lib.llParseRef("Lesson 7")) === "");
  ok("a template that never asks for the chapter still works for that ref",
    lib.llFillTemplate("https://x.example/l/{lesson}", lib.llParseRef("Lesson 7")) === "https://x.example/l/7");
  ok("{ref} is the raw text, URL-encoded",
    lib.llFillTemplate("https://x.example/?q={ref}", lib.llParseRef("5B Ch.12 L2")) === "https://x.example/?q=5B%20Ch.12%20L2",
    lib.llFillTemplate("https://x.example/?q={ref}", lib.llParseRef("5B Ch.12 L2")));
  ok("placeholder names are case-insensitive",
    lib.llFillTemplate("https://x.example/{BOOK}/{Lesson}", lib.llParseRef("5B Ch.12 L2")) === "https://x.example/5B/2");
  ok("a template with no holes is a fixed link", lib.llFillTemplate("https://x.example/all", lib.llParseRef("5B Ch.12 L2")) === "https://x.example/all");
  ok("empty template → nothing", lib.llFillTemplate("", lib.llParseRef("5B Ch.12 L2")) === "");
})();

console.log("\nC) The URL a card carries\n");
const card = (title, lid) => { ENV.lidFor = lid || null; return { id: "t1", who: "lincoln", subjectKey: "singapore_l", title: "Singapore Math — " + title }; };
(() => {
  ENV.subjects = { lincoln: { singapore_l: { display: "Singapore Math", lessonUrl: TPL } } };
  ok("template resolves for 5B Ch.12 L2", lib.llUrlFor(card("5B Ch.12 L2")) === "https://videos.example.com/5B/ch-12/lesson-2", lib.llUrlFor(card("5B Ch.12 L2")));

  ENV.subjects.lincoln.singapore_l.lessonUrls = { L0042: "https://override.example.com/special" };
  ok("a per-lesson override (by lesson id) wins over the template",
    lib.llUrlFor(card("5B Ch.12 L2", "L0042")) === "https://override.example.com/special");
  ok("another lesson of the same subject still uses the template",
    lib.llUrlFor(card("5B Ch.12 L3", "L0043")) === "https://videos.example.com/5B/ch-12/lesson-3");

  // Unstamped subject: the override key is the normalized ref, made Firebase-key-safe.
  ENV.subjects.lincoln.singapore_l.lessonUrls = { "5b_ch_12_l2": "https://override.example.com/byref" };
  ok("unstamped: override keyed by the sanitized ref", lib.llKeyForRef("5B Ch.12 L2") === "5b_ch_12_l2", lib.llKeyForRef("5B Ch.12 L2"));
  ok("unstamped: that override wins", lib.llUrlFor(card("5B Ch.12 L2")) === "https://override.example.com/byref");

  ENV.subjects = { lincoln: { singapore_l: { display: "Singapore Math" } } };
  ok("no template, no override → no URL (no row)", lib.llUrlFor(card("5B Ch.12 L2")) === "");
  ENV.subjects = { lincoln: { singapore_l: { display: "Singapore Math", lessonUrl: TPL } } };
  ok("template but the ref has no chapter → no URL", lib.llUrlFor(card("Lesson 7")) === "");
  ok("card with no subject → no URL", lib.llUrlFor({ id: "x", who: "lincoln", title: "Loose task" }) === "");
})();

console.log("\nD) Unsafe URLs are refused (https only)\n");
(() => {
  ok("javascript: refused", lib.llSafeUrl("javascript:alert(1)") === "");
  ok("data: refused", lib.llSafeUrl("data:text/html,hi") === "");
  ok("plain http refused (https only)", lib.llSafeUrl("http://videos.example.com/x") === "");
  ok("https accepted", lib.llSafeUrl("  https://videos.example.com/x ") === "https://videos.example.com/x");
  ENV.subjects = { lincoln: { singapore_l: { lessonUrl: "javascript:alert('{lesson}')" } } };
  ok("an unsafe template yields no URL", lib.llUrlFor(card("5B Ch.12 L2")) === "");
  ENV.subjects = { lincoln: { singapore_l: { lessonUrl: TPL, lessonUrls: { L0042: "javascript:alert(1)" } } } };
  ok("an unsafe override is skipped, template still used",
    lib.llUrlFor(card("5B Ch.12 L2", "L0042")) === "https://videos.example.com/5B/ch-12/lesson-2");
})();

console.log("\nE) Label\n");
(() => {
  ok("default label", lib.llLabelFor({}) === "Open lesson");
  ok("subject linkLabel wins", lib.llLabelFor({ linkLabel: " Nicole the Math Lady " }) === "Nicole the Math Lady");
})();

console.log("\nF) The per-lesson override write is targeted and Mom-only\n");
(() => {
  ENV.subjects = { lincoln: { singapore_l: { display: "Singapore Math" } } };
  ENV.saved = {}; ENV.refs = []; ENV.mom = true;
  lib.llSetOverride("L0042", "https://override.example.com/special");
  ok("writes lessonUrls/<lesson id> only", ENV.refs.includes("curriculum/subjects/lincoln/singapore_l/lessonUrls/L0042"), ENV.refs.join(","));
  ok("never the whole lessonUrls map", !ENV.refs.includes("curriculum/subjects/lincoln/singapore_l/lessonUrls") && !("lessonUrls" in ENV.saved));
  ok("value saved", ENV.saved["curriculum/subjects/lincoln/singapore_l/lessonUrls/L0042"] === "https://override.example.com/special");
  ok("local copy updated", ENV.subjects.lincoln.singapore_l.lessonUrls.L0042 === "https://override.example.com/special");

  ENV.saved = {}; ENV.refs = [];
  lib.llSetOverride("L0042", "javascript:alert(1)");
  ok("an unsafe override is not written", ENV.refs.length === 0 && /https:\/\//.test(lib.msg()), lib.msg());

  ENV.saved = {}; ENV.refs = [];
  lib.llSetOverride("L0042", "");
  ok("clearing writes null to the same path", ENV.saved["curriculum/subjects/lincoln/singapore_l/lessonUrls/L0042"] === null);
  ok("local copy cleared", !ENV.subjects.lincoln.singapore_l.lessonUrls.L0042);

  ENV.saved = {}; ENV.refs = []; ENV.mom = false;
  lib.llSetOverride("L0042", "https://override.example.com/special");
  ok("not Mom → no write", ENV.refs.length === 0);
  ENV.mom = true;
})();

console.log("\nG) Wiring in index.html\n");
(() => {
  const sheet = src.slice(src.indexOf("function ceRenderEditSheet("), src.indexOf("// LESSONLINK_SHEET_END"));
  ok("sheet has the LESSONLINK_SHEET block", src.indexOf("// LESSONLINK_SHEET_START") > 0 && sheet.indexOf("// LESSONLINK_SHEET_START") > 0);
  ok("sheet: template input saves via llSetTemplate", /onchange="llSetTemplate\(this\.value\)"/.test(sheet));
  ok("sheet: label input saves via llSetLabel", /onchange="llSetLabel\(this\.value\)"/.test(sheet));
  ok("sheet: per-lesson 'set link for this lesson' → llSetOverride", /Set link for this lesson/.test(sheet) && /onchange="llSetOverride\(/.test(sheet));
  ok("sheet: placeholder example uses the {book}/{chapter}/{lesson} holes", /placeholder="https:\/\/example\.com\/\{book\}\/chapter-\{chapter\}\/lesson-\{lesson\}"/.test(sheet));
  ok("sheet: no guessed Nicole lesson-URL pattern in the placeholder", !/placeholder="https:\/\/[^"]*nicolethemathlady/.test(sheet));
  ok("sheet section is Mom-only", /LESSONLINK_SHEET_START[\s\S]{0,200}if\(momHere\(\)\)\{/.test(sheet));
  ok("llSetTemplate saves lessonUrl through ceSaveField", /function llSetTemplate\([\s\S]*?ceSaveField\("lessonUrl"/.test(src));
  ok("llSetLabel saves linkLabel through ceSaveField", /function llSetLabel\([\s\S]*?ceSaveField\("linkLabel"/.test(src));
  ok("llSetTemplate / llSetLabel are Mom-only", /function llSetTemplate\(v\)\{\s*if\(!momHere\(\)\) return;/.test(src) && /function llSetLabel\(v\)\{\s*if\(!momHere\(\)\) return;/.test(src));

  const tc = extractFn("taskCard");
  ok("taskCard builds llRow from llUrlFor", /const llRow=_llU\?/.test(tc) && /llUrlFor\(t,_llS\)/.test(tc));
  ok("llRow only on open, live cards", /const _llS=\(!readOnly&&!done&&typeof llUrlFor==="function"\)/.test(tc));
  ok("llRow opens in a new tab, no opener", /target="_blank" rel="noopener noreferrer"/.test(tc.slice(tc.indexOf("const llRow"), tc.indexOf("// LESSONLINK_CARD_END"))));
  ok("llRow label is ▶ <label> →", /▶ '\+esc\(llLabelFor\(_llS\)\)\+' →<\/a>/.test(tc));
  ok("llRow sits last in the card's row chain (after the sprint row)", /rvRow\+msRow\+llRow\+/.test(tc));
  ok("llRow's href is escaped", /href="'\+esc\(_llU\)\+'"/.test(tc));
})();

console.log("\n" + pass + " passed, " + fail + " failed\n");
process.exit(fail ? 1 : 0);
