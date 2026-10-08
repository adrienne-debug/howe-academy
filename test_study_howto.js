// 📋 MST_HOWTO: a study session can carry Mom's "How it works" text (her ask 2026-10-04, DeWalt: the kids are
// each other's teacher in Fact Review). Shown at the top of the session, foldable per device; written only in the
// session editor; kept on save; no text → no box.
// UNITS_SRC=<path> runs it against another copy of index.html.
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(process.env.UNITS_SRC || path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name); } }
const a = src.indexOf("// MST_HOWTO_START"), b = src.indexOf("// MST_HOWTO_END");
ok("MST_HOWTO block present", a > 0 && b > a);
const ls = {};
const api = new Function("ls", `const HA_LS={ getItem:k=>ls[k]||null, setItem:(k,v)=>{ls[k]=v;}, removeItem:k=>{delete ls[k];} }; let renders=0; function renderAll(){ renders++; }
  ${src.slice(a, b)}; return { mstHowtoClean, mstHowtoHtml, mstHowtoToggle, mstHowtoFolded, MST_HOWTO_MAX, get renders(){ return renders; } };`)(ls);
const T = "🍎 Teacher time! Kenzie, you're Andrew's teacher.\n1. Show him the card.\n2. <b>Good</b> if he knew it fast.";
const sess = { sid: "fact_study", howto: T };
const h = api.mstHowtoHtml("andrew", sess);
ok("box shows the title and Mom's text, lines kept", /📋 How it works|\u{1F4CB} How it works/u.test(h) && /white-space:pre-line/.test(h) && /Kenzie, you're Andrew's teacher\./.test(h));
ok("text is escaped (no HTML from the text box)", /&lt;b&gt;Good&lt;\/b&gt;/.test(h) && !/<b>Good/.test(h));
ok("no text → no box", api.mstHowtoHtml("andrew", { sid: "x" }) === "" && api.mstHowtoHtml("andrew", { sid: "x", howto: "   \n  " }) === "" && api.mstHowtoHtml("andrew", null) === "");
ok("clean: trims, drops \\r, caps the length", api.mstHowtoClean("  a\r\nb  \n") === "a\nb" && api.mstHowtoClean("x".repeat(2000)).length === api.MST_HOWTO_MAX);
api.mstHowtoToggle("andrew", "fact_study");
ok("tap folds it: title stays, text hides, remembered per kid+session", api.mstHowtoFolded("andrew", "fact_study") && !/Kenzie, you're/.test(api.mstHowtoHtml("andrew", sess)) && /show/.test(api.mstHowtoHtml("andrew", sess)) && !api.mstHowtoFolded("makenzie", "fact_study"));
api.mstHowtoToggle("andrew", "fact_study");
ok("tap again shows it", !api.mstHowtoFolded("andrew", "fact_study") && /Kenzie, you're/.test(api.mstHowtoHtml("andrew", sess)) && api.renders === 2);
ok("toggle args are quote-safe", /mstHowtoToggle\('o\\'kid','s\\'1'\)/.test(api.mstHowtoHtml("o'kid", { sid: "s'1", howto: "hi" })));
// wiring
ok("mstSessions carries howto", /howto: \(typeof mstHowtoClean === "function"\) \? mstHowtoClean\(rec\.howto\) : ""/.test(src));
ok("save keeps howto (whole-record set)", /const _ht = \(typeof mstHowtoClean === "function"\) \? mstHowtoClean\(mhqSessForm\.howto\) : ""; if \(_ht\) rec\.howto = _ht;/.test(src));
ok("editor has the box, with an id and the max length", /<textarea id="mhq-sess-howto" rows="6" maxlength="' \+ MST_HOWTO_MAX \+ '" onchange="mhqSessSet\(\\'howto\\',this\.value\)"/.test(src));
ok("study screen shows it under the header", /h\+='<\/div>';\n  if\(typeof mstHowtoHtml==="function"\) h\+=mstHowtoHtml\(kid,session\);/.test(src));
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
