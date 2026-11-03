// 📱 NBTABLET (her yes 2026-11-02): a per-kid Printed / On-the-tablet switch; Mom's "Send to tablet" stores the week's two
// documents (kid pages + parent guide) once; the kid's Morning / Closing Notebook cards open the kid pages a page at a time
// with the pencil, on the card's day's page. NBT_MOMVIEW (her yes 2026-11-02): one door — on Mom's device the same chip shows the
// answer key beside the page (the parent guide, its own ◀ ▶, follows the page) and ✅ Grade = the printed notebook's right/wrong
// sheet, same storage. Print stays as it was. Run: node test_nb_tablet.js
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

// the answers never reach a kid's device — one door, the key pane only where wbMomEyes()
const op = blk.slice(blk.indexOf("function nbtOpen("), blk.indexOf("function nbtShow("));
ok(/const mom=wbMomEyes\(\);[\s\S]*const reads=\[db\.ref\("notebookDocs\/"\+kid\+"\/"\+wk\+"\/student"\)\.once\("value"\)\];\s*if\(mom\) reads\.push\(db\.ref\("notebookDocs\/"\+kid\+"\/"\+wk\+"\/parent"\)\.once\("value"\)\);/.test(op), "nbtOpen: the kid copy always; the parent copy read only behind wbMomEyes()");
ok(op.indexOf("'parent'") < 0 && op.indexOf('"parent"') < 0 || !/which/.test(op), "nbtOpen: no caller can ask for the parent copy by name");
ok(op.indexOf("notebookSettings") < 0 && op.indexOf(".set(") < 0 && op.indexOf(".update(") < 0, "nbtOpen: writes nothing");
ok(/nbtShow\(kid,wk,html,\(typeof ans==="string"&&ans\)\?ans:null,opts\)/.test(op), "nbtOpen: the key pane is the parent copy, or nothing");
const sh = blk.slice(blk.indexOf("function nbtShow("), blk.indexOf("function nbtPrepDoc("));
ok(/const day=\(NBT_DAYS\.indexOf\(opts\.day\)>=0\)\?opts\.day:nbtTodayDay\(\);/.test(sh), "nbtShow: the card's day, else today");
ok(/const first=v\.days\.indexOf\(v\.day\)\+1;\s*if\(first>0\)\{ if\(v\.days\[v\.page-1\]!==v\.day\) v\.page=first; \} else \{ v\.noDay=true; v\.page=1; \}/.test(sh), "nbtShow: opens on that day's first page (keeps the remembered page when it is that day's); no pages → page 1, noDay");
const ah = sh.slice(sh.indexOf('id="nbt-ans-hold"'), sh.indexOf("</div>':'')"));
ok(ah.length > 0 && ah.indexOf("<canvas") < 0 && ah.indexOf('id="nbt-ans"') > 0 && ah.indexOf("ANSWER KEY") > 0, "viewer: the ANSWER KEY pane is its own iframe, view only (no canvas)");
// the day of a page — pure, run here
const dayFns = ["NBT_DAYS", "NBT_DAY3"].map(c => blk.slice(blk.indexOf("const " + c + "="), blk.indexOf(";", blk.indexOf("const " + c + "=")) + 1)).join("\n") +
  "\n" + ["nbtDayOf", "nbtResolveLast"].map(n => { const i = blk.indexOf("function " + n + "("); let d = 0; for (let k = blk.indexOf("{", i); k < blk.length; k++) { if (blk[k] === "{") d++; else if (blk[k] === "}" && --d === 0) return blk.slice(i, k + 1); } }).join("\n");
const D = new Function(dayFns + "\nreturn {nbtDayOf,nbtResolveLast};")();
ok(D.nbtDayOf("Daily Page — Monday") === "monday" && D.nbtDayOf("Daily Grams Grade 6 — Day 16 · Tuesday") === "tuesday" && D.nbtDayOf("Brain Break — back of Wednesday (double-sided)") === "wednesday" && D.nbtDayOf("Weekly Overview — Monday kick-off") === "monday", "day of a page: the weekday on the label");
ok(D.nbtDayOf("Unit Study — British Monarchy (1/1)") === "any" && D.nbtDayOf("Cover — Week 12") === "any", "day of a page: no weekday on the label = any day");
ok(D.nbtDayOf("End of Week — Wrap-Up") === "last" && D.nbtResolveLast(["monday", "any", "friday", "last"]).join() === "monday,any,friday,friday", "day of a page: End of Week = the last school day on the pages");
ok(D.nbtDayOf("", "Howe Academy · Daily Notebook · Thursday · November 5") === "thursday" && D.nbtDayOf("", "Creative Corner · Week 12") === "any", "day of a page: no label → the page's first words, else any");
// ✅ Grade = the printed notebook's sheet
ok(/function nbtCanGrade\(v\)\{ return !!\(v&&v\.ans&&typeof nbChkOpen==="function"&&typeof NB_WB_KIDS!=="undefined"&&NB_WB_KIDS\[v\.kid\]&&wbMomEyes\(\)\); \}/.test(blk), "Grade: only with the key pane (Mom), only the kids who have the sheet");
ok(blk.indexOf("nbChkOpen(v.kid,v.wk,day,{noDgImg:true})") > 0, "Grade: opens the same sheet for the page's day, without the Daily Grams picture");
const noAc = blk.slice(0, blk.indexOf("// NBT_AUTOCHK_START")) + blk.slice(blk.indexOf("// NBT_AUTOCHK_END"));   // the auto-check (test_nb_autochk.js) writes the kid's tap into the sheet's own record — Grade itself still stores nothing
ok(noAc.indexOf("nbBankSave(") < 0 && noAc.indexOf('"checks"') < 0 && !/db\.ref\([^)]*checks/.test(noAc), "Grade: the block stores no grades of its own (the sheet's own storage)");
const ck = src.slice(src.indexOf("function nbChkOpen("), src.indexOf("function nbChkHistory("));
ok(/function nbChkOpen\(kid,wk,day,opts\)/.test(ck) && ck.indexOf("nbChkOpen(kid,wk,day,opts)") > 0 && ck.indexOf("noDg:!!(opts&&opts.noDgImg)") > 0, "the sheet: takes opts, keeps it through the lazy load");
ok(ck.indexOf("if(dg&&dg.missing.length&&!nbChkState.noDg) nbChkDgFetch();") > 0 && ck.indexOf("if(s.noDg) h+=box('📝 '+esc(s.dg.title)+' — Day '+s.dg.day,") > 0, "the sheet: no key-page fetch and no picture when the key is beside her; the ✓/✗ row stays");
ok(ck.indexOf('ov.style.zIndex=s.noDg?"10070":"9999";') > 0, "the sheet: sits above the tablet viewer when opened from it");
ok(ck.indexOf("nbBankSave(s.kid,\"checks\",s.wk+\"/\"+s.day,rec)") > 0, "the sheet: saves where it always did");
// the Schedule tab follows the switch / Send from another device
ok(src.indexOf('else if(tab==="schedule"&&typeof renderAllSoon==="function") renderAllSoon();   // 📱 NBTABLET') > 0, "listener: the Schedule repaints when notebookSettings change");

// the cards
const cr = blk.slice(blk.indexOf("function nbtCardRows("), blk.indexOf("function nbtTabHtml("));
ok(/Morning Notebook\|Closing Notebook/.test(cr), "cards: Morning and Closing Notebook only");
ok(/if\(nbtMode\(t\.who\)!=="tablet"\) return "";/.test(cr), "cards: nothing for a Printed kid");
ok(/if\(!nbtBuilt\(t\.who,WK\)\) return momHereCards\(\)\?/.test(cr), "cards: nothing for the kid until this week's copy is sent (Mom sees a hint)");
ok(cr.indexOf("nbtOpen('\"+t.who+\"',WK,{day:'\"+day+\"'})") > 0 && /const day=String\(t\.day\|\|""\)\.toLowerCase\(\)\.replace\(\/\[\^a-z\]\/g,""\);/.test(cr), "cards: one chip, opens the notebook on the card's day");
ok(cr.indexOf("'parent'") < 0 && cr.indexOf("Answer pages") < 0, "cards: no separate answer-pages chip (the key pane is inside the one door)");
ok(/MINMINUTES\n    nbtRows\+/.test(src), "card renderer: the rows end the card’s row chain");
ok(/const nbtRows=\(!readOnly&&typeof nbtCardRows==="function"\)\?\(nbtCardRows\(t\)\|\|""\):"";/.test(src), "card renderer: rows built per card, not on read-only views");

// the viewer
ok(blk.indexOf('sandbox="allow-same-origin"') > 0 && blk.indexOf("pointer-events:none") > 0, "viewer: the page sits in a same-origin, script-free iframe under the ink");
ok(blk.indexOf("width:816px;height:1056px") > 0 && blk.indexOf('fr.style.transform="scale("+k+")"') > 0, "viewer: pages laid out at 8.5×11 and scaled whole");
ok(blk.indexOf(".page:not(.nbt-on){display:none!important}") > 0, "viewer: one page shown at a time");
ok(blk.indexOf('"notebookWork/"+kid+"/"+wk+"/"+page') > 0 && blk.indexOf("db.ref(nbtInkPath(v.kid,v.wk,v.page)).set({v:1,s:v.strokes,ts:Date.now()})") > 0, "viewer: writing saves one page, one path");
ok(/function nbtSave\(quiet\)\{[\s\S]*?if\(!db\|\|_dryRun\(\)\)\{ v\.dirty=false; nbtBarRender\(\); return; \}/.test(blk), "viewer: ink save inert under ?dryrun=1");
ok(/async function nbtSave\(quiet\)\{\s*const v=nbtView; if\(!v\|\|!v\.ink\) return;/.test(blk), "viewer: the answer pages never save ink");
ok(blk.indexOf('(ink?\'<canvas id="nbt-ink"') > 0, "viewer: the canvas is on the kid's page");
ok(blk.indexOf("momHere())?WB_MOMPEN:WB_PEN") > 0, "viewer: Mom writes in red, kids in blue");
ok(blk.indexOf("nbtView.penOnly&&e.pointerType!==\"pen\"") > 0, "viewer: pencil-only lets a palm or finger scroll");

// the Notebook tab
ok(src.indexOf('((typeof nbtTabHtml==="function")?nbtTabHtml(sel,wkLabel):"")+') > 0, "Notebook tab: the switch card is in the kid's card");
const th = blk.slice(blk.indexOf("function nbtTabHtml("));
ok(/function nbtTabHtml\(kid,wkLabel\)\{\s*if\(!momHere\(\)\) return "";/.test(th), "Notebook tab: Mom only");
ok(th.indexOf('seg("print",') > 0 && th.indexOf('seg("tablet",') > 0, "Notebook tab: Printed / On the tablet switch");
ok(/if\(mode==="tablet"\)\{[\s\S]*nbtSend\(/.test(th), "Notebook tab: Send to tablet only for a tablet kid");
ok(th.indexOf('link("Open the notebook")') > 0 && th.indexOf("answer pages") < 0 && /const link=\(txt\)=>'<button onclick="nbtOpen\(\\''\+kid\+'\\',\\''\+wk\+'\\'\)"/.test(th), "Notebook tab: one Open link (today's page; the key beside it on Mom's device)");

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
    // the label before each page names its day — the viewer's day strip reads exactly this
    // (a builder with no labels — the page's own first words carry the day, as the viewer reads them)
    const re = /<div class="page-label">[^<]*<\/div>|<div class="page[" ][^>]*>/g; const days = []; let lb = "", m;
    while ((m = re.exec(o.student))) { if (m[0].indexOf('class="page-label"') > 0) lb = m[0].replace(/<[^>]+>/g, ""); else { const nxm = /<div class="page[" ]/g; nxm.lastIndex = m.index + 10; const nxr = nxm.exec(o.student); const txt = o.student.slice(m.index, nxr ? nxr.index : undefined).replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); days.push(D.nbtDayOf(lb, lb ? "" : txt)); lb = ""; } }
    const dd = D.nbtResolveLast(days), miss = ["monday", "tuesday", "wednesday", "thursday", "friday"].filter(d => dd.indexOf(d) < 0);
    if (k !== "starterkid") ok(dd.length === pages && !miss.length, "notebooks.js " + k + ": every school day has its own page the viewer can name (" + dd.filter(d => d !== "any").length + " day pages, " + dd.filter(d => d === "any").length + " any-day)" + (miss.length ? " — missing " + miss.join(",") : ""));
    const ppages = (o.parent.match(/<div class="page[\s"]/g) || []).length;
    ok(ppages > 0, "notebooks.js " + k + ": the parent guide has pages for the key pane (" + ppages + (/answer key/i.test(o.parent.replace(/<[^>]+>/g, " ")) ? ", names its Answer Keys page)" : ")"));
  });
} catch (e) { ok(false, "notebooks.js generators run: " + e.message); }

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
