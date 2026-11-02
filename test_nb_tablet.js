// 📱 NBTABLET (her yes 2026-11-02): a per-kid Printed / On-the-tablet switch; Mom's "Send to tablet" stores the week's two
// documents (kid pages + parent guide) once; the kid's Morning / Closing Notebook cards open the kid pages a page at a time
// with the pencil; Mom's device also opens the answer pages. Print stays as it was. Run: node test_nb_tablet.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(c, name) { if (c) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name); } }

const bs = src.indexOf("// NBTABLET_START"), be = src.indexOf("// NBTABLET_END");
const blk = src.slice(bs, be);
ok(bs > 0 && be > bs, "NBTABLET block found, once");
ok(src.split("// NBTABLET_START").length === 2 && src.split("// NBTABLET_END").length === 2, "block markers appear once each");
try { new Function(blk); ok(true, "block parses as JavaScript"); } catch (e) { ok(false, "block parses as JavaScript: " + e.message); }
ok(!/\b(lincoln|ellis|lucy|julian|caleb|taylor|makenzie|andrew)\b/i.test(blk), "no kid names in the block — same code serves every family");
ok(blk.indexOf("\u{1F500}") < 0, "no 🔀");

// the switch
ok(/function nbtMode\(kid\)[\s\S]*?nbMode==="tablet"\)\?"tablet":"print"/.test(blk), "nbtMode: tablet only when notebookSettings/<kid>/nbMode says so — missing = printed");
ok(/function nbtSetMode\(kid,mode\)\{\s*if\(!momHere\(\)\) return;/.test(blk), "nbtSetMode: Mom only");
ok(blk.indexOf('db.ref("notebookSettings/"+kid+"/nbMode").set(mode)') > 0, "nbtSetMode: one targeted field write");
ok(blk.indexOf('db.ref("notebookSettings").set(') < 0 && blk.indexOf('db.ref("notebookDocs").set(') < 0, "no whole-node sets");

// sending
ok(/async function nbtSend\(kid\)\{\s*if\(!momHere\(\)\) return;/.test(blk), "nbtSend: Mom only");
ok(/if\(!db\|\|_dryRun\(\)\)\{[^}]*return; \}/.test(blk.slice(blk.indexOf("async function nbtSend"))), "nbtSend: inert without db / under ?dryrun=1");
ok(blk.indexOf("ctx.bindingMargin=false") > 0, "nbtSend: no prong margin on the tablet copy");
ok(blk.indexOf('upd["notebookDocs/"+kid+"/"+wk]={student:student,parent:parent,ts:ts,pages:pages}') > 0, "nbtSend: the week's copy at notebookDocs/<kid>/<week>");
ok(blk.indexOf('upd["notebookSettings/"+kid+"/tablet/"+wk]={ts:ts,pages:pages}') > 0, "nbtSend: the small marker at notebookSettings/<kid>/tablet/<week>");
ok(blk.indexOf("await db.ref().update(upd)") > 0, "nbtSend: one multi-path update");
ok(/if\(n&&n<wn-1\)\{[^}]*notebookDocs[^}]*notebookSettings[^}]*notebookWork[^}]*\}/.test(blk), "nbtSend: copies older than last week go (copy, marker, writing)");
ok(blk.indexOf("nbtPersistCursors(kid,out)") > 0 && /nbDgPersistCursor\(kid,out\)[\s\S]*nbWbPersistCursor\(kid,out\)[\s\S]*nbCqPersistCursor\(kid,out\)[\s\S]*nbQbPersistCursor\(kid,out\)[\s\S]*nbCvPersistCursor\(kid,out\)/.test(blk), "nbtSend: the same cursors move on as with a print");

// the answers never reach a kid's device
const op = blk.slice(blk.indexOf("function nbtOpen("), blk.indexOf("function nbtShow("));
ok(/which=\(which==="parent"\)\?"parent":"student";\s*if\(which==="parent"&&!wbMomEyes\(\)\) return;/.test(op), "nbtOpen: the parent copy opens only behind wbMomEyes(), checked before any read");
ok(op.indexOf('db.ref("notebookDocs/"+kid+"/"+wk+"/"+which).once("value")') > 0, "nbtOpen: reads just the one document");
ok(op.indexOf("notebookSettings") < 0 && op.indexOf(".set(") < 0 && op.indexOf(".update(") < 0, "nbtOpen: writes nothing");

// the cards
const cr = blk.slice(blk.indexOf("function nbtCardRows("), blk.indexOf("function nbtTabHtml("));
ok(/Morning Notebook\|Closing Notebook/.test(cr), "cards: Morning and Closing Notebook only");
ok(/if\(nbtMode\(t\.who\)!=="tablet"\) return "";/.test(cr), "cards: nothing for a Printed kid");
ok(/if\(!nbtBuilt\(t\.who,WK\)\) return momHereCards\(\)\?/.test(cr), "cards: nothing for the kid until this week's copy is sent (Mom sees a hint)");
ok(cr.indexOf("nbtOpen('\"+t.who+\"',WK,'student')") > 0, "cards: the kid's chip opens the student copy");
const pi = cr.indexOf("nbtOpen('\"+t.who+\"',WK,'parent')");
ok(pi > 0 && cr.lastIndexOf("if(momHereCards())", pi) > cr.indexOf("'student'"), "cards: the answer-pages chip is inside momHereCards()");
ok(/MINMINUTES\n    nbtRows\+/.test(src), "card renderer: the rows end the card’s row chain");
ok(/const nbtRows=\(!readOnly&&typeof nbtCardRows==="function"\)\?\(nbtCardRows\(t\)\|\|""\):"";/.test(src), "card renderer: rows built per card, not on read-only views");

// the viewer
ok(blk.indexOf('sandbox="allow-same-origin"') > 0 && blk.indexOf("pointer-events:none") > 0, "viewer: the page sits in a same-origin, script-free iframe under the ink");
ok(blk.indexOf("width:816px;height:1056px") > 0 && blk.indexOf('fr.style.transform="scale("+k+")"') > 0, "viewer: pages laid out at 8.5×11 and scaled whole");
ok(blk.indexOf(".page:not(.nbt-on){display:none!important}") > 0, "viewer: one page shown at a time");
ok(blk.indexOf('"notebookWork/"+kid+"/"+wk+"/"+page') > 0 && blk.indexOf("db.ref(nbtInkPath(v.kid,v.wk,v.page)).set({v:1,s:v.strokes,ts:Date.now()})") > 0, "viewer: writing saves one page, one path");
ok(/function nbtSave\(quiet\)\{[\s\S]*?if\(!db\|\|_dryRun\(\)\)\{ v\.dirty=false; nbtBarRender\(\); return; \}/.test(blk), "viewer: ink save inert under ?dryrun=1");
ok(/async function nbtSave\(quiet\)\{\s*const v=nbtView; if\(!v\|\|!v\.ink\) return;/.test(blk), "viewer: the answer pages never save ink");
ok(blk.indexOf('(ink?\'<canvas id="nbt-ink"') > 0, "viewer: no canvas on the answer pages (view only)");
ok(blk.indexOf("momHere())?WB_MOMPEN:WB_PEN") > 0, "viewer: Mom writes in red, kids in blue");
ok(blk.indexOf("nbtView.penOnly&&e.pointerType!==\"pen\"") > 0, "viewer: pencil-only lets a palm or finger scroll");

// the Notebook tab
ok(src.indexOf('((typeof nbtTabHtml==="function")?nbtTabHtml(sel,wkLabel):"")+') > 0, "Notebook tab: the switch card is in the kid's card");
const th = blk.slice(blk.indexOf("function nbtTabHtml("));
ok(/function nbtTabHtml\(kid,wkLabel\)\{\s*if\(!momHere\(\)\) return "";/.test(th), "Notebook tab: Mom only");
ok(th.indexOf('seg("print",') > 0 && th.indexOf('seg("tablet",') > 0, "Notebook tab: Printed / On the tablet switch");
ok(/if\(mode==="tablet"\)\{[\s\S]*nbtSend\(/.test(th), "Notebook tab: Send to tablet only for a tablet kid");

// print path untouched
ok(/haNbPdf\(\\''\+sel\+'\\',\\'student\\'\)[^>]*>🖨 Print notebook</.test(src) && /haNbPdf\(\\''\+sel\+'\\',\\'parent\\'\)[^>]*>🖨 Print parent guide</.test(src), "print: 🖨 Print notebook / parent guide still there");
const pk = src.slice(src.indexOf("function haNbPickerRows"), src.indexOf("async function haOpenNotebookPicker"));
ok(pk.indexOf("nbt") < 0, "print: the admin picker rows are untouched");
const wb = src.slice(src.indexOf("let wbView=null;"), src.indexOf("function wbPanelOpen("));
ok(wb.indexOf("nbt") < 0, "workbooks: the workbook viewer is untouched");

// notebooks.js: the kid copy and the parent copy are two different documents for every builder
try {
  const nb = fs.readFileSync(path.join(__dirname, "notebooks.js"), "utf8");
  const g = { window: {}, console: console, setTimeout: setTimeout, Promise: Promise }; g.self = g.window; vm.createContext(g); vm.runInContext(nb, g);
  const lib = g.window.HoweNotebooks;
  const dates = { monday: "November 2", tuesday: "November 3", wednesday: "November 4", thursday: "November 5", friday: "November 6" };
  const ctx = k => ({ nbKidName: k[0].toUpperCase() + k.slice(1), weekData: { dates, tasks: [] }, weekNum: "week12", weekDates: "Nov 2–6", masteryItems: [], reviewCap: 2, personal: null, prevSummary: null, prevStats: null, pace: null, units: [], extraPages: {}, bindingMargin: false, spelling: null, wordBank: null, cogatBank: null, quantBank: null, convBank: null, dailyGrams: null, loe: null, juPicks: null, numberCursor: null, letterCursor: null, countEmoji: null, letterSounds: null, coloring: null, dotdot: null, symmetry: null, maze: null, pattern: null, dolls: null, passage: null });
  Object.keys(lib.GENERATORS).concat(["starterkid"]).forEach(k => {
    const o = lib.generate(k, ctx(k));
    const pages = (o.student.match(/<div class="page[\s"]/g) || []).length;
    ok(o.student && o.parent && o.student !== o.parent && pages > 0, "notebooks.js " + k + ": kid pages (" + pages + ") and parent guide are separate documents");
  });
} catch (e) { ok(false, "notebooks.js generators run: " + e.message); }

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
