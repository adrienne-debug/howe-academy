/*
 * 📂 Long lists on the sprint setup fold away (her ask 2026-09-27): the drill-item list (spelling words), the
 * Editor focus-rules list and the phonogram sprint's two grids sit behind a one-line summary, closed by default,
 * so Grid Size / options / Generate are right there. The open/closed choice is remembered for the session.
 * The phonogram focus grid stays open until a phonogram is picked. No Firebase writes.
 *   run:  node test_sprint_fold.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// SPRINTFOLD_START"), b = src.indexOf("// SPRINTFOLD_END");
if (a < 0 || b < 0) { console.error("SPRINTFOLD markers not found"); process.exit(1); }
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
function world() { const ctx = { console, Object, Array, String, JSON }; vm.createContext(ctx); vm.runInContext(src.slice(a, b), ctx); return { ctx, call: e => vm.runInContext(e, ctx) }; }
const fn = (name) => { const s = src.indexOf("function " + name + "("); return src.slice(s, src.indexOf("\nfunction ", s + 10)); };

console.log("── the fold helper ──");
{
  const w = world();
  const closed = w.call("sprintFoldHtml('drill','The 36 items in this set','<i>list</i>',false)");
  ok("closed by default: no open attribute", /<details class="sp-fold" data-fold="drill" ontoggle=/.test(closed), closed.slice(0, 120));
  ok("summary line and the list are both there", closed.includes("The 36 items in this set") && closed.includes("<i>list</i>"));
  ok("says Show when closed", closed.includes(">Show<") && !closed.includes(">Hide<"));
  ok("tapping records the choice", closed.includes("ontoggle=\"sprintFoldSet('drill',this.open)\""));
  const open = w.call("sprintFoldHtml('phono-focus','Pick the focus phonogram','grid',true)");
  ok("a fold with no choice yet honors its default (open)", /<details class="sp-fold" data-fold="phono-focus" open ontoggle=/.test(open) && open.includes(">Hide<"));
  w.call("sprintFoldSet('drill',true)");
  ok("once opened it stays open across a re-render", /data-fold="drill" open/.test(w.call("sprintFoldHtml('drill','x','y',false)")));
  w.call("sprintFoldSet('phono-focus',false)");
  ok("once closed it stays closed even when the default is open", !/data-fold="phono-focus" open/.test(w.call("sprintFoldHtml('phono-focus','x','y',true)")));
  ok("folds are independent", w.call("sprintFoldIsOpen('editor-rules',false)") === false && w.call("sprintFoldIsOpen('drill',false)") === true);
  ok("the caret is our own (no native marker)", src.includes(".sp-fold>summary::-webkit-details-marker{display:none}") && closed.includes("list-style:none"));
  ok("no 🔀 in the block", !src.slice(a, b).includes("\u{1F500}"));
  ok("no Firebase writes in the block", !/db\.ref|\.set\(|\.update\(|\.push\(/.test(src.slice(a, b)));
}

console.log("── drill-item sprint: the word list folds, controls follow the summary ──");
{
  const f = fn("buildSprintFromDrillHtml");
  ok("the list is built apart and handed to the fold, closed", f.includes("pool.forEach(it=>{") && f.includes("list+='<div") && /sprintFoldHtml\("drill",.*pool\.length.*,list,false\)/.test(f));
  ok("summary counts the items", f.includes("' item'+(pool.length===1?\"\":\"s\")+' in this set'"));
  const i1 = f.indexOf('sprintFoldHtml("drill"'), i2 = f.indexOf("sprintDrillGridPillsHtml(color,pool.length)"), i3 = f.indexOf('onclick="sprintGenerateFromPool()"');
  ok("order: fold → Grid Size → Generate", i1 > 0 && i1 < i2 && i2 < i3);
  const loop = f.slice(f.indexOf("pool.forEach(it=>{"), f.indexOf("});", f.indexOf("pool.forEach(it=>{")));
  ok("nothing is appended to the page directly inside the list loop", loop.length > 0 && !loop.includes("h+="), loop);
}

console.log("── Editor sprint: the rule buttons fold, count + quick picks stay visible ──");
{
  const f = fn("buildSprintEditorHtml");
  ok("rule buttons go into the fold, closed", f.includes("ruleList+='<button onclick=\"laToggleRule(") && f.includes('sprintFoldHtml("editor-rules",\'Pick rules one by one\',ruleList,false)'));
  const hdr = f.indexOf("' of '+rules.length+' selected</span>'"), quick = f.indexOf("laRulesQuick('started')".replace(/'/g, "\\'")), fold = f.indexOf('sprintFoldHtml("editor-rules"');
  ok("'N of M selected' and Learned only / All sit above the fold", hdr > 0 && quick > 0 && hdr < fold && quick < fold);
  ok("the legend rides inside the fold", f.indexOf("tap to include/exclude") > 0 && f.indexOf("let ruleList=") < f.indexOf("tap to include/exclude"));
}

console.log("── phonogram sprint: focus grid open until picked; review grid folded ──");
{
  const s0 = src.indexOf("🔤 Focus Phonogram"), f = src.slice(s0, src.indexOf("🎛️ Options", s0));
  ok("focus grid goes into the fold, open only while nothing is picked", f.includes('sprintFoldHtml("phono-focus",') && f.includes(",focusGrid,!sprintSelectedPhono)"));
  ok("the pick shows in the summary", f.includes("Focus: <b style=\"font-family:'DM Mono',monospace;color:${color}\">${sprintSelectedPhono.pg}</b>") && f.includes('"Pick the focus phonogram"'));
  ok("the custom-pattern box stays outside the fold", f.indexOf(",focusGrid,!sprintSelectedPhono)") < f.indexOf('id="sp-custom-phono"'));
  ok("review grid goes into the fold, closed", f.includes('sprintFoldHtml("phono-review",') && f.includes(",reviewGrid,false)"));
  ok("review summary counts the picks", f.includes('("Reviewing "+sprintReviewPhonos.length+" of 3")') && f.includes('"Add up to 3 review phonograms"'));
  ok("the review chips stay visible after the fold", f.indexOf(",reviewGrid,false)") < f.indexOf('id="sp-review-chips"'));
  ok("phonogram buttons keep their handlers", f.includes("onclick=\"sprintSelectPhono('${p.pg}')\"") && f.includes("onclick=\"sprintToggleReview('${p.pg}')\""));
}

console.log("── untouched: unit rounds and the Book list ──");
{
  ok("unit sprint form has no fold (only round pills)", !fn("buildSprintUnitHtml").includes("sprintFoldHtml"));
  ok("book sprint form has no fold (its list is already last)", !fn("buildSprintBookHtml").includes("sprintFoldHtml"));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
