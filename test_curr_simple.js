/* test_curr_simple.js — CURRSIMPLE (Curriculum streamline slice 6, PLAN_curriculum_streamline_2026-11-10.md §3.6 / §4 row 6).
 * Her answer to question 3 (2026-11-10): "3 per family", then "lets put us on simple as well"; her "Yes, build them" 2026-11-23.
 * ONE family-wide switch, config/ui/curriculum/view = "simple" | "everything"; absent = Simple for every family. Simple hides and
 * never deletes.
 *
 * The baseline is THIS tree with the feature taken out again (stripSimple: the block goes, every edit is put back byte for byte),
 * never a pinned commit — so the checks still hold after the branch is merged. The renders reuse the Curriculum tests' own
 * harnesses (test_currtools / test_currcard / test_kidyear / test_addflow export them).
 *   0. stripSimple undoes the slice exactly; only the six render functions and the boot listener differ from the stripped tree
 *   1. the block: absent = Simple, no start rule by grid size; the one write is ONE leaf, Mom-only, never in a dry run; the read
 *      is that one leaf; no new ids; no 🔀; no family names
 *   2. the grid page (toolbar, ⋯ More, 🔍 Checks drawer, every banner forced true one at a time and all at once):
 *      Everything = the stripped tree byte for byte (plus the one "Keep it simple" item); Simple = the same minus Edit many
 *      cells / Order by end date and with Tidy-up folded to "n more under Show everything", the badge counting it; the line's
 *      tap writes the one leaf and the page comes back byte-identical to Everything
 *   3. the 🗂 plan bar: Simple keeps the counts line, drops Show and the three strips; Everything = stripped
 *   4. the subject card, every condition pair test_currcard replays (+ ⋯ open, a preview armed, after a build): Everything =
 *      stripped; Simple = header + 1–4 (+ 5 · Lane when 2+ subjects have lessons or it sits in a lane) + the footer, nothing else
 *   5. 📅 Kid's year, every tab, and the All-subjects table (rich fixture): Everything = stripped; Simple drops exactly the
 *      advanced columns (Co-op day · Mom days · 📌 new lesson · Right after · If missed · If the day is tight)
 *   5b. 📅 All subjects ▸ Column order (COLORDER, slice 7 — newer than the plan, not in §3.6): drawn the same in Simple
 *   6. ＋ Add subject, book and class, steps 1–3 with More options open and shut, and Show all options at once:
 *      Everything = stripped; Simple = the same minus More options and what is behind it
 *   7. the card-practice lines and 🃏 Card practice in the Add are not behind the switch
 *
 *   run:  node test_curr_simple.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

// ── stripSimple: the slice taken out again. The block goes; every other edit is put back to its old text ([new, old]).
const CSM_EDITS = [
  ["    if(t.length) h+=(typeof csmSimple===\"function\"&&csmSimple())?csmTidyLine(t.length):'<div class=\"ct-tidy\"><div style=\"'+G+'\">'+cw(\"tidyUp\")+'</div>'+t.map(function(k){ return ct[k]; }).join(\"\")+'</div>';   // CURRSIMPLE: Simple folds Tidy-up to one line (the badge above still counts them)","    if(t.length) h+='<div class=\"ct-tidy\"><div style=\"'+G+'\">'+cw(\"tidyUp\")+'</div>'+t.map(function(k){ return ct[k]; }).join(\"\")+'</div>';"],
  ["  let _ctRelay=null, _ctItems=[];\n  const _csmS=(typeof csmSimple===\"function\"&&csmSimple()), _csmItem=(typeof csmMoreItem===\"function\")?csmMoreItem():null;   // CURRSIMPLE: Simple / Everything (family-wide)\n","  let _ctRelay=null, _ctItems=[];\n"],
  ["    h=h.replace(\"__CT_MORE__\",ctMoreHTML([_ctRelay,_csmItem]));   // CURRTOOLS · CURRSIMPLE: + Show everything / Keep it simple","    h=h.replace(\"__CT_MORE__\",ctMoreHTML([_ctRelay]));   // CURRTOOLS"],
  ["  if(!_csmS||gvSelMode) _ctItems.push({fn:\"gvToggleSelMode()\",label:(gvSelMode?'✕ '+cw(\"doneSel\"):'☑︎ '+cw(\"selCells\")),on:gvSelMode});   // CURRSIMPLE","  _ctItems.push({fn:\"gvToggleSelMode()\",label:(gvSelMode?'✕ '+cw(\"doneSel\"):'☑︎ '+cw(\"selCells\")),on:gvSelMode});"],
  ["  if((momModeActive||adminPinUnlocked)&&typeof gvEndSortToggle===\"function\"&&(!_csmS||gvEndSort)) _ctItems.push({fn:\"gvEndSortToggle()\",title:\"Order the columns by each subject's plan end date, earliest first (this device only)\",label:((typeof gvColOrderSet===\"function\"&&gvColOrderSet(gvKid))?'Order by end date · off while a custom order is set — Back to A–Z first':(gvEndSort?'✓ ':'')+cw(\"endSort\")),on:gvEndSort&&!(typeof gvColOrderSet===\"function\"&&gvColOrderSet(gvKid))});   // COLORDER: her own order wins · CURRSIMPLE: in Simple only while it is on", "  if((momModeActive||adminPinUnlocked)&&typeof gvEndSortToggle===\"function\") _ctItems.push({fn:\"gvEndSortToggle()\",title:\"Order the columns by each subject's plan end date, earliest first (this device only)\",label:((typeof gvColOrderSet===\"function\"&&gvColOrderSet(gvKid))?'Order by end date · off while a custom order is set — Back to A–Z first':(gvEndSort?'✓ ':'')+cw(\"endSort\")),on:gvEndSort&&!(typeof gvColOrderSet===\"function\"&&gvColOrderSet(gvKid))});   // COLORDER: her own order wins"],
  ["  h=h.replace(\"__CT_MORE__\",ctMoreHTML(_ctItems.concat([_ctRelay,_csmItem])));   // CURRSIMPLE: + Show everything / Keep it simple","  h=h.replace(\"__CT_MORE__\",ctMoreHTML(_ctItems.concat([_ctRelay])));"],
  ["  h+=(typeof csmSimple===\"function\"&&csmSimple())?'</div>':'<span style=\"flex:1\"></span><button onclick=\"planOpen[\\''+kid+'\\']=!planOpen[\\''+kid+'\\'];renderAll()\" style=\"padding:4px 12px;border-radius:99px;border:1.5px solid var(--border);background:'+(planOpen[kid]?'#111827':'#fff')+';color:'+(planOpen[kid]?'#fff':'#0f172a')+';font-weight:800;font-size:11.5px;cursor:pointer;font-family:\\'DM Sans\\',sans-serif\">'+(planOpen[kid]?'Hide':'Show')+'</button></div>';   // CURRSIMPLE","  h+='<span style=\"flex:1\"></span><button onclick=\"planOpen[\\''+kid+'\\']=!planOpen[\\''+kid+'\\'];renderAll()\" style=\"padding:4px 12px;border-radius:99px;border:1.5px solid var(--border);background:'+(planOpen[kid]?'#111827':'#fff')+';color:'+(planOpen[kid]?'#fff':'#0f172a')+';font-weight:800;font-size:11.5px;cursor:pointer;font-family:\\'DM Sans\\',sans-serif\">'+(planOpen[kid]?'Hide':'Show')+'</button></div>';"],
  ["  if(planOpen[kid]&&!(typeof csmSimple===\"function\"&&csmSimple())){ try{ h+=rmStripHTML(kid); }catch(e){ console.error(\"[HA] roadmap\",e); } try{ h+=scStripHTML(kid); }catch(e){ console.error(\"[HA] scores\",e); } try{ h+=ntStripHTML(kid); }catch(e){ console.error(\"[HA] notes\",e); } }   // CURRSIMPLE","  if(planOpen[kid]){ try{ h+=rmStripHTML(kid); }catch(e){ console.error(\"[HA] roadmap\",e); } try{ h+=scStripHTML(kid); }catch(e){ console.error(\"[HA] scores\",e); } try{ h+=ntStripHTML(kid); }catch(e){ console.error(\"[HA] notes\",e); } }"],
  ["\n  const _csmA=h.length;   // CURRSIMPLE: 5 · Lane starts here\n  // ── 5 · Lane (shortcuts into 📅 Kid's year ▸ Lanes — kyLane, KIDYEAR) ──","\n  // ── 5 · Lane (shortcuts into 📅 Kid's year ▸ Lanes — kyLane, KIDYEAR) ──"],
  ["\n  const _csmB=h.length;   // CURRSIMPLE: 6 · Checking off starts here\n  // ── 6 · Checking off ──\n","\n  // ── 6 · Checking off ──\n"],
  ["    } }\n\n  if(typeof csmCardCut===\"function\") h=csmCardCut(h,_csmA,_csmB,K,SK);   // CURRSIMPLE: Simple = header + 1–4 (+ Lane) + one footer line\n  // Actions\n  h+='<div class=\"ce-sheet-actions\">';\n  h+='<button class=\"ce-btn-cancel\" onclick=\"ceCloseSheet()\">Done</button>';","    } }\n\n  // Actions\n  h+='<div class=\"ce-sheet-actions\">';\n  h+='<button class=\"ce-btn-cancel\" onclick=\"ceCloseSheet()\">Done</button>';"],
  ["  const _csmS=(typeof csmSimple===\"function\"&&csmSimple());   // CURRSIMPLE: Simple hides the advanced columns (the table stays)\n  if(_coopAny) h+='<div style=\"font-size:10px;color:var(--muted);margin:2px 0 6px\">🏫 <b>Weeks without co-op:</b> each subject has a second row of days under <b>'+cw(\"days\")+'</b> for weeks when '+window.cap(kid)+' has no co-op (none lit = same days every week). <span onclick=\"cwdUseMonThu(\\''+kid+'\\')\" style=\"text-decoration:underline;cursor:pointer;font-weight:700\">Use Mon–Thu for every subject 4 times a week</span></div>';","  if(_coopAny) h+='<div style=\"font-size:10px;color:var(--muted);margin:2px 0 6px\">🏫 <b>Weeks without co-op:</b> each subject has a second row of days under <b>'+cw(\"days\")+'</b> for weeks when '+window.cap(kid)+' has no co-op (none lit = same days every week). <span onclick=\"cwdUseMonThu(\\''+kid+'\\')\" style=\"text-decoration:underline;cursor:pointer;font-weight:700\">Use Mon–Thu for every subject 4 times a week</span></div>';"],
  ["[\"Subject\",cw(\"days\"),cw(\"tpw\"),cw(\"cap\"),cw(\"duration\")].concat(_coopCol&&!_csmS?[\"Co-op day\"]:[]).concat([cw(\"momReq\"),cw(\"device\")].concat(_csmS?[]:[cw(\"priority\")]).concat([cw(\"schedRules\")]).concat(_csmS?[]:[cw(\"stickWith\"),cw(\"noCarry\")]).concat([\"Rules\"])).map(x=>'<th style=\"text-align:left;padding:5px 6px;white-space:nowrap;font-size:10px;color:var(--muted)\">'+x+'</th>').join(\"\")+'</tr></thead><tbody>';   // CURRSIMPLE","[\"Subject\",cw(\"days\"),cw(\"tpw\"),cw(\"cap\"),cw(\"duration\")].concat(_coopCol?[\"Co-op day\"]:[]).concat([cw(\"momReq\"),cw(\"device\"),cw(\"priority\"),cw(\"schedRules\"),cw(\"stickWith\"),cw(\"noCarry\"),\"Rules\"]).map(x=>'<th style=\"text-align:left;padding:5px 6px;white-space:nowrap;font-size:10px;color:var(--muted)\">'+x+'</th>').join(\"\")+'</tr></thead><tbody>';"],
  ["    if(_coopCol&&!_csmS){ h+='<td style=\"padding:3px 6px;white-space:nowrap\" title=\"On a day this kid is at co-op: keep the full card, shorten it, or skip it that day. Other days are unchanged.\">'+_P(\"coopDay\")+'</td>'; }   // 🏫 COOPDAY   // CURRSIMPLE","    if(_coopCol){ h+='<td style=\"padding:3px 6px;white-space:nowrap\" title=\"On a day this kid is at co-op: keep the full card, shorten it, or skip it that day. Other days are unchanged.\">'+_P(\"coopDay\")+'</td>'; }   // 🏫 COOPDAY"],
  ["'+_P(\"mom\")+(_csmS?'':_P(\"momDays\")+_P(\"lessonDay\"))+'</td>';   // 👩 Mom · 👩 days (her ask 2026-10-02) · 📌 new lesson (her ask 2026-10-04)   // CURRSIMPLE","'+_P(\"mom\")+_P(\"momDays\")+_P(\"lessonDay\")+'</td>';   // 👩 Mom · 👩 days (her ask 2026-10-02) · 📌 new lesson (her ask 2026-10-04)"],
  ["    if(!_csmS) h+='<td style=\"padding:3px 6px\">'+_P(\"priority\")+'</td>';   // CURRSIMPLE","    h+='<td style=\"padding:3px 6px\">'+_P(\"priority\")+'</td>';"],
  ["    if(!_csmS) h+='<td style=\"padding:3px 6px;white-space:nowrap\">'+_P(\"stickyWith\")+'</td>';   // CURRSIMPLE","    h+='<td style=\"padding:3px 6px;white-space:nowrap\">'+_P(\"stickyWith\")+'</td>';"],
  ["    if(!_csmS) h+='<td style=\"padding:3px 6px\">'+_P(\"noCarry\")+'</td>';   // CURRSIMPLE","    h+='<td style=\"padding:3px 6px\">'+_P(\"noCarry\")+'</td>';"],
  ["    if(!(typeof csmSimple===\"function\"&&csmSimple())){   // CURRSIMPLE: More options (step 2) is under Show everything\n      h+='<div style=\"margin-top:12px\"><button onclick=\"afMore=!afMore;ceRenderAddSheet()\" style=\"border:none;background:none;color:var(--muted);font-size:12px;font-weight:700;cursor:pointer;padding:0\">More options '+(afMore?\"▴\":\"▾\")+'</button></div>';","    {\n      h+='<div style=\"margin-top:12px\"><button onclick=\"afMore=!afMore;ceRenderAddSheet()\" style=\"border:none;background:none;color:var(--muted);font-size:12px;font-weight:700;cursor:pointer;padding:0\">More options '+(afMore?\"▴\":\"▾\")+'</button></div>';"],
  ["      }\n      if(!(typeof csmSimple===\"function\"&&csmSimple())){   // CURRSIMPLE: More options (step 3) is under Show everything\n      h+='<div style=\"margin-top:12px\"><button onclick=\"afMore=!afMore;ceRenderAddSheet()\" style=\"border:none;background:none;color:var(--muted);font-size:12px;font-weight:700;cursor:pointer;padding:0\">More options '+(afMore?\"▴\":\"▾\")+'</button></div>';","      }\n      h+='<div style=\"margin-top:12px\"><button onclick=\"afMore=!afMore;ceRenderAddSheet()\" style=\"border:none;background:none;color:var(--muted);font-size:12px;font-weight:700;cursor:pointer;padding:0\">More options '+(afMore?\"▴\":\"▾\")+'</button></div>';"],
  ["\n      }\n      }   // CURRSIMPLE\n    }\n    nav=B(\"afGo(2)\",\"Back\")+B(\"afSave()\",fam?\"Add it\":(f.tracking===\"daily\"?cw(\"putOn\"):\"Next — see the plan\"),1);","\n      }\n    }\n    nav=B(\"afGo(2)\",\"Back\")+B(\"afSave()\",fam?\"Add it\":(f.tracking===\"daily\"?cw(\"putOn\"):\"Next — see the plan\"),1);"],
  ["    db.ref(\"config/ui/curriculum/view\").on(\"value\",s=>{ if(typeof csmOnValue===\"function\") csmOnValue(s.val()); });   // CURRSIMPLE: the family's Simple / Everything switch — this one leaf only\n    db.ref(\"config/zoneBonus\").on(\"value\",s=>{ zoneBonus=Object.assign({enabled:true,mode:\"flat\",amount:5}, s.val()||{}); if(typeof renderAllSoon===\"function\") renderAllSoon(); });","    db.ref(\"config/zoneBonus\").on(\"value\",s=>{ zoneBonus=Object.assign({enabled:true,mode:\"flat\",amount:5}, s.val()||{}); if(typeof renderAllSoon===\"function\") renderAllSoon(); });"],
];
function stripSimple(s) {
  if (s.indexOf("CURRSIMPLE") < 0) return s;   // a tree without the slice (origin/main before it is merged)
  const a = s.indexOf("// CURRSIMPLE_START"), b = s.indexOf("// CURRSIMPLE_END\n");
  if (a < 0 || b < a) throw new Error("CURRSIMPLE block markers not found");
  s = s.slice(0, a) + s.slice(b + "// CURRSIMPLE_END\n".length);
  CSM_EDITS.forEach(function (p) {
    const n = s.split(p[0]).length - 1;
    if (n !== 1) throw new Error("stripSimple: an edit is not there exactly once (" + n + "): " + p[0].slice(0, 80));
    s = s.replace(p[0], () => p[1]);
  });
  return s;
}
module.exports = { stripSimple, CSM_EDITS };
if (require.main !== module) return;

const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const SRC0 = stripSimple(src);
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 700) + ")" : "")); } }
function braceAt(S, i) { let d = 0; for (let k = S.indexOf("{", i); k < S.length; k++) { if (S[k] === "{") d++; else if (S[k] === "}") { d--; if (!d) return S.slice(i, k + 1); } } throw new Error("unbalanced at " + i); }
function fnIn(S, name) { const i = S.indexOf("function " + name + "("); if (i < 0) throw new Error("not found " + name); return braceAt(S, i); }
function sliceIn(S, a, b) { const i = S.indexOf(a), j = S.indexOf(b, i + 1); if (i < 0 || j < 0) throw new Error("marker " + a); return S.slice(i, j + b.length); }
const BLOCK = sliceIn(src, "// CURRSIMPLE_START", "// CURRSIMPLE_END");
const VIEW = v => BLOCK + "\ncsmView=" + JSON.stringify(v) + ";";   // load the block into a harness, the switch read as v (null = absent)
const EV = VIEW("everything"), SV = VIEW(null);
const SW_RE = /<button onclick="ctMoreOpen=false;csmSet\('(simple|everything)'\)"[^>]*>[^<]*<\/button>/g;
const noSwitch = h => h.replace(SW_RE, "");
const switches = h => (h.match(SW_RE) || []).length;
const hAll = h => { const out = []; const re = /\s(onclick|onchange|oninput)="([^"]*)"/g; let m; while ((m = re.exec(h))) out.push(m[2]); return out; };

console.log("── 0. stripSimple undoes the slice exactly ──");
{
  ok("stripped: no trace of the slice (CURRSIMPLE / csm* / the view leaf)", !/CURRSIMPLE|\bcsm[A-Z]\w*|csmView|config\/ui\/curriculum/.test(SRC0));
  ok("the block is marked once, START before END", src.split("// CURRSIMPLE_START").length === 2 && src.split("// CURRSIMPLE_END").length === 2 && src.indexOf("// CURRSIMPLE_START") < src.indexOf("// CURRSIMPLE_END"));
  ok("every edit outside the block carries a CURRSIMPLE comment", CSM_EDITS.every(p => /CURRSIMPLE/.test(p[0])));
  // which functions differ between the tree and the stripped tree: the six renderers, the boot listener's function, and the block's own
  const names = new Set(); { const re = /(^|[^\w$.])function ([A-Za-z_$][\w$]*)\(/g; let m; while ((m = re.exec(src))) names.add(m[2]); }
  const diff = [];
  names.forEach(n => { let a, b; try { a = fnIn(src, n); } catch (e) { a = "?" + n; } try { b = fnIn(SRC0, n); } catch (e) { b = "!" + n; } if (a !== b && a.length < 1e6) diff.push(n); });   // > 1 MB = the naive slicer ran past a brace inside a string (grRcptJson)
  const lst = (function () { const i = src.indexOf('db.ref("config/ui/curriculum/view").on('); let best = null; const re = /(^|[^\w$.])function ([A-Za-z_$][\w$]*)\(/g; let m; while ((m = re.exec(src)) && m.index < i) { try { if (m.index + braceAt(src, m.index + m[1].length).length > i) best = m[2]; } catch (e) {} } return best; })();
  const RENDER = ["ctChecksHTML", "renderCurrGrid", "planBarHTML", "ceRenderEditSheet", "cbRenderRules", "afSheetHTML"];
  const OWN = ["csmSimple", "csmOnValue", "csmSet", "csmMoreItem", "csmTidyLine", "csmLessonSubjects", "csmCardCut"];
  const want = RENDER.concat(OWN).concat(lst ? [lst] : []).sort();
  ok("only the six renderers, the boot listener's function (" + lst + ") and the block's own functions differ — every writer is byte-identical", JSON.stringify(diff.slice().sort()) === JSON.stringify(want), diff);
}

console.log("── 1. the switch: absent = Simple, one leaf, Mom only ──");
function switchWorld(o) {
  o = o || {};
  const log = [], ctx = { console, renders: 0, momHere: () => !!o.mom, _dryRun: () => !!o.dry, renderAll: () => { ctx.renders++; }, renderAllSoon: () => { ctx.soon = (ctx.soon || 0) + 1; },
    db: o.noDb ? null : { ref: p => ({ set: v => log.push(["set", p, v]), update: v => log.push(["update", p, v]), remove: () => log.push(["remove", p]), on: () => {} }) } };
  vm.createContext(ctx); vm.runInContext(BLOCK, ctx);
  return { ctx, log, run: e => vm.runInContext(e, ctx) };
}
{
  const W = switchWorld({ mom: true });
  ok("absent (null) reads as Simple — every family, no start rule by grid size", W.run("csmSimple()") === true && fnIn(src, "csmSimple") === 'function csmSimple(){ return csmView!=="everything"; }');
  W.run("csmOnValue('everything')"); ok("'everything' read → Everything, and the page re-draws once", W.run("csmSimple()") === false && W.ctx.soon === 1);
  W.run("csmOnValue('everything')"); ok("the same value again → no re-draw", W.ctx.soon === 1);
  W.run("csmOnValue('simple')"); ok("'simple' → Simple", W.run("csmSimple()") === true);
  W.run("csmOnValue({x:1})"); ok("anything else → Simple", W.run("csmSimple()") === true && W.run("csmView") === null);
  const A = switchWorld({ mom: true }); A.run("csmSet('everything')");
  ok("Mom taps Show everything → exactly one write: set config/ui/curriculum/view = 'everything'", JSON.stringify(A.log) === JSON.stringify([["set", "config/ui/curriculum/view", "everything"]]) && A.ctx.renders === 1 && A.run("csmSimple()") === false);
  A.log.length = 0; A.run("csmSet('simple')");
  ok("Keep it simple → exactly one write of the same leaf = 'simple'", JSON.stringify(A.log) === JSON.stringify([["set", "config/ui/curriculum/view", "simple"]]) && A.run("csmSimple()") === true);
  const D = switchWorld({ mom: true, dry: true }); D.run("csmSet('everything')");
  ok("dry run: writes nothing (this device shows it)", D.log.length === 0 && D.run("csmSimple()") === false);
  const K = switchWorld({ mom: false }); K.run("csmSet('everything')");
  ok("not Mom: writes nothing, changes nothing", K.log.length === 0 && K.run("csmSimple()") === true && K.ctx.renders === 0);
  const X = switchWorld({ mom: true }); X.run("csmSet('all')"); X.run("csmSet(null)");
  ok("a value that is not simple / everything: writes nothing", X.log.length === 0);
  const N = switchWorld({ mom: true, noDb: true }); N.run("csmSet('everything')");
  ok("no database: no throw, the view still flips here", N.run("csmSimple()") === false);
  const refs = S => (S.match(/\bref\([^)]*\)/g) || []);
  const added = refs(src).slice(); refs(SRC0).forEach(r => { const i = added.indexOf(r); if (i >= 0) added.splice(i, 1); });
  ok("the whole file gains exactly two ref( — the leaf's write (CSM_PATH) and its read; nothing reads or writes the config node",
    JSON.stringify(added.sort()) === JSON.stringify(['ref("config/ui/curriculum/view")', "ref(CSM_PATH)"].sort()) && /const CSM_PATH="config\/ui\/curriculum\/view";/.test(BLOCK), added);
  ok("the read sits with the other config listeners and only hands the value to csmOnValue",
    /db\.ref\("config\/ui\/curriculum\/view"\)\.on\("value",s=>\{ if\(typeof csmOnValue==="function"\) csmOnValue\(s\.val\(\)\); \}\);/.test(src) && src.indexOf('db.ref("config/ui/curriculum/view")') < src.indexOf('db.ref("config/zoneBonus").on('));
  ok("the write is behind db && !_dryRun() and momHere()", /if\(!\(typeof momHere==="function"&&momHere\(\)\)\) return;/.test(fnIn(src, "csmSet")) && /if\(typeof db!=="undefined"&&db&&!_dryRun\(\)\) db\.ref\(CSM_PATH\)\.set\(v\);/.test(fnIn(src, "csmSet")));
  const mine = BLOCK + CSM_EDITS.map(p => p[0]).join("\n");
  ok("no new element id (the block and its edits add none)", !/\bid=\\?["']/.test(mine));
  ok("no 🔀, no family names", mine.indexOf("\u{1F500}") < 0 && !/lincoln|ellis|lucy|julian|howe|dewalt/i.test(mine));
  ok("no csm* name was already taken in the stripped tree", !/\bcsm[A-Za-z_]/.test(SRC0));
}

console.log("── 2. the grid page: toolbar, ⋯ More, 🔍 Checks ──");
const CT = require("./test_currtools.js");
const OPEN = CT.OPEN;
const SEL_RE = /<button onclick="ctMoreOpen=false;gvToggleSelMode\(\)"[^>]*>[^<]*<\/button>/, END_RE = /<button onclick="ctMoreOpen=false;gvEndSortToggle\(\)"[^>]*>[^<]*<\/button>/;
const TIDYLINE_RE = /<div class="ct-tidy-more"[\s\S]*?<\/button><\/div>/;
function gridCase(name, over, prex, tidyN) {
  const pre = (prex || "");
  const B = CT.render(SRC0, over, OPEN + pre), E = CT.render(src, over, OPEN + pre + EV), Sm = CT.render(src, over, OPEN + pre + SV);
  const Bc = CT.render(SRC0, over, pre), Ec = CT.render(src, over, pre + EV);
  ok(name + ": Everything = the stripped tree byte for byte, plus one ⋯ More item “Keep it simple”", noSwitch(E) === B && switches(E) === 1 && /csmSet\('simple'\)"[^>]*>Keep it simple</.test(E) && Ec === Bc);
  ok(name + ": the badge is the same in both views", CT.badge(Sm) === CT.badge(B));
  ok(name + ": Simple — the grid itself is untouched", CT.gridOf(Sm) === CT.gridOf(B));
  ok(name + ": Simple — Worth a look is drawn in full", CT.groupOf(Sm, "ct-worth") === CT.groupOf(B, "ct-worth"));
  const tg = CT.groupOf(B, "ct-tidy");
  if (tidyN) {
    const m = TIDYLINE_RE.exec(Sm);
    ok(name + ": Simple — Tidy-up folds to “" + tidyN + " more under Show everything — one-time tidy-ups for an older curriculum”, the tap = csmSet('everything')",
      !!m && Sm.indexOf('class="ct-tidy"') < 0 && m[0].indexOf(">" + tidyN + " more under Show everything</b> — one-time tidy-ups for an older curriculum<") >= 0 && /onclick="csmSet\('everything'\)"/.test(m[0]));
    const gone = hAll(tg).filter(f => hAll(Sm).indexOf(f) < 0);
    ok(name + ": Simple — the Tidy-up buttons are absent (" + gone.length + ") and all of them are back in Everything", gone.length > 0 && gone.every(f => hAll(E).indexOf(f) >= 0));
  } else ok(name + ": no Tidy-up drawn → no fold line", !TIDYLINE_RE.test(Sm) && !tg);
  // nothing else changes: Simple with the fold put back, the switch out = the stripped page without Edit many cells / Order by end date
  const S2 = noSwitch(Sm).replace(TIDYLINE_RE, () => tg), B2 = B.replace(SEL_RE, "").replace(END_RE, "");
  ok(name + ": Simple — ⋯ More has no Edit many cells / Order by end date, has “Show everything”; nothing else on the page differs",
    !SEL_RE.test(Sm) && !END_RE.test(Sm) && SEL_RE.test(B) && END_RE.test(B) && /csmSet\('everything'\)"[^>]*>Show everything</.test(Sm) && S2 === B2);
  return { B, E, Sm };
}
{
  gridCase("nothing to check", {}, "", 0);
  CT.BANNERS.forEach(b => gridCase("banner " + (b.name || b.k), b.over, b.pre || "", b.g === "ct-tidy" ? 1 : 0));
  const all = gridCase("every condition at once", CT.ALL_TRUE_OVER(), CT.ALL_TRUE_PRE, 8);
  ok("every condition at once: Simple still counts all 15 (Tidy-up included)", CT.badge(all.Sm) === CT.badge(all.B) && CT.badge(all.B) >= 15, [CT.badge(all.Sm), CT.badge(all.B)]);
  // the fold line flips the switch: one write, and the page is then the Everything page byte for byte
  const c = CT.world(src, CT.ALL_TRUE_OVER()); const log = [];
  c.db = { ref: p => ({ set: v => log.push(["set", p, v]) }) }; c._dryRun = () => false;
  vm.runInContext(OPEN + CT.ALL_TRUE_PRE + SV, c);
  const el1 = { innerHTML: "" }; c.renderCurrGrid(el1);
  const tap = (TIDYLINE_RE.exec(el1.innerHTML) || [""])[0].match(/onclick="([^"]*)"/)[1];
  vm.runInContext(tap, c);
  const el2 = { innerHTML: "" }; c.renderCurrGrid(el2);
  const E = CT.render(src, CT.ALL_TRUE_OVER(), OPEN + CT.ALL_TRUE_PRE + EV);
  ok("tapping “n more under Show everything” writes the one leaf once and the page is the Everything page, byte for byte", JSON.stringify(log) === JSON.stringify([["set", "config/ui/curriculum/view", "everything"]]) && el2.innerHTML === E);
  // a control that is ON stays in sight in Simple (its way out)
  const sel = CT.render(src, { gvSelMode: true }, OPEN + SV), es = CT.render(src, {}, OPEN + "gvEndSort=true;" + SV);   // gvEndSort is GRIDEND's own let
  ok("Simple keeps “✕ Done selecting” in ⋯ More while select mode is on, and Order by end date while it is on", SEL_RE.test(sel) && END_RE.test(es));
  ok("…and with them on, Everything is still the stripped page", noSwitch(CT.render(src, { gvSelMode: true }, OPEN + EV)) === CT.render(SRC0, { gvSelMode: true }, OPEN) && noSwitch(CT.render(src, {}, OPEN + "gvEndSort=true;" + EV)) === CT.render(SRC0, {}, OPEN + "gvEndSort=true;"));
  // not Mom: no switch, and Everything / Simple differ only by what Simple hides
  const nm = { momModeActive: false, adminPinUnlocked: false, momHere: () => false };
  ok("not Mom: no Show everything / Keep it simple item in either view", switches(CT.render(src, nm, OPEN + EV)) === 0 && switches(CT.render(src, nm, OPEN + SV)) === 0 && CT.render(src, nm, OPEN + EV) === CT.render(SRC0, nm, OPEN));
}

console.log("── 3. the 🗂 plan bar ──");
function planBar(S, view, open) {
  const ctx = { console, Object, Array, String, JSON, Math, planOpen: { kid: !!open }, _todayStr: () => "2026-11-23", cap: s => s,
    rmList: () => [{ id: "a", done: false }, { id: "b", done: false }, { id: "c", done: true }], rmEff: (k, r) => r, rmState: (r) => r.id === "a" ? "over" : "week",
    scList: () => [1, 2], ntList: () => [1], rmStripHTML: () => "<div>ROADMAP onclick=\"rmSave()\"</div>", scStripHTML: () => "<div>SCORES</div>", ntStripHTML: () => "<div>NOTES onclick=\"ntSave()\"</div>", renderAll: () => {} };
  vm.createContext(ctx); vm.runInContext(fnIn(S, "planBarHTML") + (view === undefined ? "" : "\n" + VIEW(view)), ctx);
  return ctx.planBarHTML("kid");
}
{
  [false, true].forEach(open => ok("Everything (" + (open ? "Show tapped" : "shut") + ") = the stripped tree", planBar(src, "everything", open) === planBar(SRC0, undefined, open)));
  const s = planBar(src, null, true), e = planBar(src, "everything", true);
  ok("Simple: the counts line stays (to do · overdue · this week · reports · notes)", s.indexOf("'s plan</span>") >= 0 && s.indexOf("3 report") < 0 && /2 to do · <b[^>]*>1 overdue<\/b> · <b[^>]*>1 this week<\/b>/.test(s) && s.indexOf("2 reports") >= 0 && s.indexOf("1 note") >= 0);
  ok("Simple: no Show button and none of the three strips, even after Show was tapped", s.indexOf("planOpen[") < 0 && !/ROADMAP|SCORES|NOTES/.test(s) && /ROADMAP/.test(e) && /SCORES/.test(e) && /NOTES/.test(e));
  ok("Simple = the Everything bar cut right after the counts (nothing else differs)", s === e.slice(0, e.indexOf('<span style="flex:1"></span>')) + "</div></div>");
}

console.log("── 4. the subject card ──");
const CC = require("./test_currcard.js");
const CARD_FNS = ["csmSimple", "csmCardCut", "csmLessonSubjects"];
const SEC = n => '<div style="margin-top:20px;padding-top:10px;border-top:1px solid var(--border);font-size:12px;font-weight:800;color:#123456">' + n + " · ";
const FOOT = '<div class="csm-foot" style="margin-top:18px;padding-top:10px;border-top:1px solid var(--border);font-size:11.5px;color:var(--muted);text-align:center">More options are under <b>Show everything</b> (⋯ More)</div>';
{
  let cases = 0;
  Object.entries(CC.OLD).forEach(([name, o]) => {
    const fl = o.fl;
    const vars = [["closed", {}], ["⋯ open", { ceMoreOpen: "kid|math" }]];
    if (!fl.daily) {
      vars.push(["preview armed", { cbKid: "kid", cbSubjKey: "math", cbForm: { mode: fl.pacedMode || "timesPerWeek", tpw: 3, allowedDays: ["Mon"], units: null }, cbPreviewRes: { stats: { placed: 3, tpwUsed: 3, firstDate: "a", lastDate: "b" }, clears: [], warnings: [], assignments: [] } }]);
      vars.push(["after a build", { cbLastBuild: { kid: "kid", sk: "math" }, cbMsg: "done" }]);
    }
    vars.forEach(([vn, x]) => {
      cases++;
      const B = CC.renderCard(SRC0, fl, x), E = CC.renderCard(src, fl, Object.assign({ csmView: "everything" }, x), CARD_FNS), Sm = CC.renderCard(src, fl, Object.assign({ csmView: null }, x), CARD_FNS);
      const a = E.indexOf(SEC(5)), b = E.indexOf(SEC(6)), z = E.lastIndexOf('<div class="ce-sheet-actions">');
      const lessonSubs = (fl.daily ? 0 : (fl.paused ? 0 : 1)) + 1;   // the fixture's other subjects: History (a list), Reading (daily)
      const lane = !!fl.lane || lessonSubs >= 2;
      const want = E.slice(0, a) + (lane ? E.slice(a, b) : "") + FOOT + E.slice(z);
      const okE = E === B, okS = a > 0 && b > a && z > b && Sm === want;
      if (!okE || !okS || vn === "closed") ok(name + " · " + vn + ": Everything = stripped" + (okE ? "" : " ✗") + "; Simple = header + 1–4" + (lane ? " + 5 · Lane" : "") + " + the footer, nothing else", okE && okS);
      if (vn === "closed") {
        const gone = hAll(E).filter(f => hAll(Sm).indexOf(f) < 0);
        ok(name + ": Simple's handlers ⊂ Everything's; the " + gone.length + " hidden ones all live in §5–9", hAll(Sm).every(f => hAll(E).indexOf(f) >= 0) && gone.every(f => hAll(E.slice(a, z)).indexOf(f) >= 0) && gone.length > 0);
      }
    });
  });
  ok("all " + cases + " card renders checked", cases >= 30);
  // the Lane rule: hidden with only one subject that has lessons, shown with two, shown when the subject sits in a lane
  const one = { currData: { subjects: { kid: { math: CC.fixture({}), read: { display: "Reading", tracking: "daily" } } }, lessons: { kid: {} }, done: { kid: {} }, momVerifyKid: { kid: false } } };
  one.ceGetSubject = () => one.currData.subjects.kid.math;
  const s1 = CC.renderCard(src, {}, Object.assign({ csmView: null }, one), CARD_FNS);
  const s1l = CC.renderCard(src, { lane: true }, Object.assign({ csmView: null }, one), CARD_FNS);
  ok("Simple, one subject with lessons: no Lane section; in a lane already: the Lane section shows", s1.indexOf(SEC(5)) < 0 && s1l.indexOf(SEC(5)) > 0 && s1.indexOf(FOOT) > 0);
  ok("Simple never draws 6 · Checking off · 7 · Links · 8 · Rewards · 9 · Fix-ups", [6, 7, 8, 9].every(n => s1.indexOf(SEC(n)) < 0 && s1l.indexOf(SEC(n)) < 0));
  const pausedLessons = { currData: { subjects: { kid: { math: CC.fixture({}), hist: { display: "History", lessonSeq: ["a"], paused: true }, geo: { display: "Geo", tracking: "daily", lessonSeq: ["x"] } } }, lessons: { kid: {} }, done: { kid: {} }, momVerifyKid: { kid: false } } };
  pausedLessons.ceGetSubject = () => pausedLessons.currData.subjects.kid.math;
  ok("a paused subject and a daily one don't count toward the two", CC.renderCard(src, {}, Object.assign({ csmView: null }, pausedLessons), CARD_FNS).indexOf(SEC(5)) < 0);
}

console.log("── 5. 📅 Kid's year and the All-subjects table ──");
const KY = require("./test_kidyear.js");
{
  const opts = [{}, { capSet: true, tgt: true, sessOpen: true, undo: true }, { coop: true }];
  opts.forEach((o, i) => {
    const W0 = KY.panelWorld(SRC0, o), WE = KY.panelWorld(src, o), WS = KY.panelWorld(src, o);
    WE.run(EV); WS.run(SV);
    ["hours", "terms", "lanes", "all"].forEach(t => {
      const b = W0.panel(t), e = WE.panel(t), s = WS.panel(t);
      ok("panel " + i + " · " + t + ": Everything = stripped" + (t === "all" ? "" : "; Simple = the same (only All subjects changes)"), e === b && (t === "all" || s === b));
    });
  });
  // the table, rich fixture (lane · timed co-op · Mom days · 📌 new lesson · sticky · priority · no-carry)
  const T0 = CC.renderTable(SRC0, CC.RICH), TE = CC.renderTable(src, CC.RICH), TS = CC.renderTable(src, CC.RICH);
  vm.runInContext(EV, TE); vm.runInContext(SV, TS);
  const b = T0.render(), e = TE.render(), s = TS.render();
  ok("All subjects, rich fixture: Everything = stripped", e === b);
  const ths = h => (h.match(/<th\b[^>]*>([^<]*)<\/th>/g) || []).map(x => x.replace(/<[^>]*>/g, ""));
  const gone = ths(b).filter(x => ths(s).indexOf(x) < 0);
  const tb = ths(b);   // Subject · Days · ×/wk · Cap · How long · Co-op day · Mom · Device · Priority · Order · Right after · If missed · Rules
  ok("Simple drops exactly the columns Co-op day · If the day is tight · Right after · If missed (the Mom column keeps its 👩 pill)", tb.length === 13 && tb[5] === "Co-op day" && JSON.stringify(gone) === JSON.stringify([tb[5], tb[8], tb[10], tb[11]]), [tb, ths(s)]);
  ok("…and keeps Subject · Days · times a week · Most in one day · How long · Needs you · Where it happens · Order in the day · Rules", ths(s).length === ths(b).length - 4 && ths(s).every(x => ths(b).indexOf(x) >= 0));
  const ADV = ["coopDay", "momDays", "lessonDay", "priority", "stickyWith", "noCarry"], KEEP = ["days", "noCoopDays", "tpw", "cap", "minutes", "mom", "device", "order", "seq"];
  const sks = Object.keys(CC.RICH.subjects);
  const pill = (sk, f) => TE.pill(sk, f, { col: "#123456" });
  ADV.forEach(f => { const ps = sks.map(sk => pill(sk, f)).filter(Boolean); ok("Simple hides the " + f + " pill on every row; Everything draws it", ps.length > 0 && ps.every(p => s.indexOf(p) < 0 && e.indexOf(p) >= 0)); });
  KEEP.forEach(f => { const ps = sks.map(sk => pill(sk, f)).filter(Boolean); ok("Simple keeps the " + f + " pill on every row", ps.every(p => s.indexOf(p) >= 0)); });
  ok("Simple: every handler in the table is one Everything draws (nothing new)", hAll(s).every(x => hAll(e).indexOf(x) >= 0));
}

console.log("── 5b. Column order (COLORDER, newer than the plan) stays in Simple ──");
{
  const CO = require("./test_col_order.js");
  const SET = 'currData.colOrder={kid:["plain","lane:math","zoo","art"]};';
  const Ws = CO.world(src), We = CO.world(src), W0 = CO.world(SRC0);
  Ws.run(SV + SET); We.run(EV + SET); W0.run(SET);
  const ls = CO.listOf(Ws.panel()), le = CO.listOf(We.panel()), l0 = CO.listOf(W0.panel());
  ok("📅 All subjects ▸ Column order: drawn in Simple, the same list (▲ ▼ · Back to A–Z) as Everything and the stripped tree", ls.length > 500 && ls === le && le === l0 && /gvColBack|A–Z/.test(ls));
  ok("…and the grid follows her saved order in Simple too", JSON.stringify(CO.headOrder(Ws.grid())) === JSON.stringify(CO.headOrder(W0.grid())) && JSON.stringify(CO.headOrder(Ws.grid())) === JSON.stringify(["plain", "lane:math", "zoo", "art"]));
  ok("with a saved order, Everything's grid page = the stripped tree's (plus Keep it simple)", noSwitch(We.grid(OPEN)) === W0.grid(OPEN));
}

console.log("── 6. ＋ Add subject ──");
const AF = require("./test_addflow.js");
const MORE_RE = /<div style="margin-top:12px"><button onclick="afMore=!afMore;ceRenderAddSheet\(\)"[^>]*>More options [▾▴]<\/button><\/div>/;
function addWalk(S, view, kind) {
  const w = AF.world(S);
  if (view !== undefined) w.run(VIEW(view));
  w.run("ceOpenAdd('kid_a')");
  const out = { s1: w.html() };
  Object.assign(w.ctx.ceAddForm, AF.BOOK); w.type("ce-add-name", AF.BOOK.name);
  if (kind === "class") w.run("afSetKind('class')");
  w.run("afGo(2)"); out.s2 = w.html(); w.run("afMore=true;ceRenderAddSheet()"); out.s2m = w.html();
  w.run("afGo(3)"); out.s3 = w.html(); w.run("afMore=true;ceRenderAddSheet()"); out.s3m = w.html();
  w.run("afAll()"); out.all = w.html();
  return out;
}
{
  ["book", "class"].forEach(kind => {
    const B = addWalk(SRC0, undefined, kind), E = addWalk(src, "everything", kind), Sm = addWalk(src, null, kind);
    Object.keys(B).forEach(k => ok(kind + " · " + k + ": Everything = stripped", E[k] === B[k]));
    ok(kind + ": step 1 and Show all options at once are the same in Simple", Sm.s1 === B.s1 && Sm.all === B.all);
    ok(kind + ": Simple step 2 / 3 = the stripped step minus the More options link", MORE_RE.test(B.s2) && MORE_RE.test(B.s3) && Sm.s2 === B.s2.replace(MORE_RE, "") && Sm.s3 === B.s3.replace(MORE_RE, ""));
    ok(kind + ": More options left open changes nothing in Simple (what is behind it is not drawn)", Sm.s2m === Sm.s2 && Sm.s3m === Sm.s3 && B.s3m.length > B.s3.length + 500);
    const hidden = hAll(B.s3m).filter(f => hAll(Sm.s3m).indexOf(f) < 0);
    ok(kind + ": the " + hidden.length + " controls behind More options are back in Everything with the same handlers", hidden.length >= 8 && hidden.every(f => hAll(E.s3m).indexOf(f) >= 0));
  });
}

console.log("── 7. what Simple does not hide ──");
{
  const g0 = fnIn(SRC0, "renderCurrGrid"), g1 = fnIn(src, "renderCurrGrid");
  const drLines = S => S.split("\n").filter(l => /drStripChips|_drChips/.test(l)).join("\n");
  ok("the 🃏 card-practice lines in Runs every day (DRILLROWS) are drawn the same in both views", drLines(g1) === drLines(g0) && !/csm/.test(drLines(g1)));
  const af = fnIn(src, "afSheetHTML");
  ok("🃏 Card practice in the guided Add (DRILLADD) is not behind the switch", /\n  if\(typeof daOn!=="undefined"&&daOn&&typeof daSheetHTML==="function"\) return daSheetHTML\(kid,col\);/.test(af) && /\n    if\(typeof daChoiceHTML==="function"\) h\+=daChoiceHTML\(kid,false\);/.test(af));
  ok("the DRILL* blocks are untouched", ["DRILLROWS", "DRILLDAYS", "DRILLADD", "DRILLTHREE", "DRILLPOINT"].every(m => sliceIn(src, "// " + m + "_START", "// " + m + "_END") === sliceIn(SRC0, "// " + m + "_START", "// " + m + "_END")));
  ok("nothing that lays a week reads the switch (csm* is called only from the six renderers)", (function () { const C = src.replace(BLOCK, ""); const re = /\bcsm[A-Z]\w*\(/g; let m, bad = []; while ((m = re.exec(C))) { const line = C.slice(C.lastIndexOf("\n", m.index) + 1, C.indexOf("\n", m.index)); if (!/CURRSIMPLE/.test(line)) bad.push(line.slice(0, 80)); } return bad.length === 0; })());
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
