/*
 * Node tests — ⚙ FAMILY TIME IS EDITED WHERE IT LIVES (FAMEDITORHOME). Her ask 2026-10-22: "a new mom never finds the
 * Family Time editor under Settings; it belongs on the Grid where the block lives, and Add Subject should let her pick
 * several kids and get a shared item instead of per-kid subjects."
 *
 * Checks, against code sliced verbatim out of index.html (the DeWalt shape is the fixture):
 *   0. the block sits right after FAMDAYSTART_END; every hook is one line; the block writes only through famWrite
 *   1. the Grid panel: a "⚙ Family time" bar, closed = bar only; open = EVERY field the Settings editor rendered (the
 *      handler + input-id sets of the panel render and the old editor render on the same block are identical; the
 *      must-have list — name, who, days, starts, Some days, Mom leads, celebration, subjects with kids / minutes / points /
 *      lessons / order / remove, off, delete, add — is in it); toggle flips it; the kids' Grid branch is untouched
 *   2. Settings ▸ Family rules renders ONLY the door line; the door opens the Grid's Family chip with the panel open
 *   3. an edit in the panel writes the same famWrite path the old editor wrote (Mom only, dry run inert)
 *   4. Add Subject with ONE kid: ceAddSave's writes are byte-identical to the code with the hook removed
 *   5. Add Subject with TWO kids: one family-time item, no per-kid subject, nothing paused; joins a block with the same
 *      kids, creates a new one otherwise (name · kids · days · start from the sheet · Mom leads); minutes and the lessons
 *      (start-at → total, ×days-per-lesson; the typed list; daily = none) ride onto the item's lesson track
 *   6. the "Who does this?" row: a chip per kid, the current kid pre-selected, the plain sentence, Starts only for a new
 *      block, the last kid can't be un-picked; after Save the Grid's Family chip opens on that block
 *
 *   run:  node test_fam_editor_home.js          (reads ./index.html)
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

function extractFn(name, from) {
  from = from || src;
  const i = from.indexOf("function " + name + "(");
  if (i < 0) throw new Error("not found: " + name);
  let depth = 0, started = false;
  for (let k = from.indexOf("{", i); k < from.length; k++) {
    const c = from[k];
    if (c === "{") { depth++; started = true; }
    else if (c === "}") { depth--; if (started && depth === 0) return from.slice(i, k + 1); }
  }
  throw new Error("unbalanced: " + name);
}
function slice(a, b, from) {
  from = from || src;
  const i = from.indexOf(a); if (i < 0) throw new Error("slice start not found: " + a);
  const j = from.indexOf(b, i); if (j < 0) throw new Error("slice end not found: " + b);
  return from.slice(i, j);
}
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra).slice(0, 400) + ")" : "")); }
}

const toMin = (t) => {
  if (t == null) return NaN;
  const m = String(t).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return NaN;
  let h = parseInt(m[1], 10); const mi = parseInt(m[2], 10);
  const ap = (m[3] || "").toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return h * 60 + mi;
};
const fromMin = (v) => { let h = Math.floor(v / 60), m = v % 60; const ap = h >= 12 ? "PM" : "AM"; let hh = h % 12; if (hh === 0) hh = 12; return hh + ":" + String(m).padStart(2, "0") + " " + ap; };
const fbArr = (v) => { if (!v) return v; if (Array.isArray(v)) return v; if (typeof v === "object") { const k = Object.keys(v); if (k.length && k.every(x => /^\d+$/.test(x))) return k.sort((a, b) => a - b).map(x => v[x]); } return v; };
const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ampmTo24 = (s) => { const m = toMin(s); return isNaN(m) ? "" : String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
const to12h = (s) => { const p = String(s || "").split(":"); if (p.length !== 2) return s; return fromMin((+p[0]) * 60 + (+p[1])); };
const ROSTER = ["taylor", "makenzie", "andrew", "caleb"];

const FAM = slice("// FAMBLOCK_START", "// FAMBLOCK_END");
const CELEB = slice("// FAMCELEB_START", "// FAMCELEB_END");
const TG = slice("// FAMTOGETHER_START", "// FAMTOGETHER_END");
const LES = slice("// FAMLESSONS_START", "// FAMLESSONS_END");
const DS = slice("// FAMDAYSTART_START", "// FAMDAYSTART_END");
const HOME = slice("// FAMEDITORHOME_START", "// FAMEDITORHOME_END");
const FX_DOW_SRC = 'const FX_DOW={monday:"Mon",tuesday:"Tue",wednesday:"Wed",thursday:"Thu",friday:"Fri",saturday:"Sat",sunday:"Sun"};';
if (src.indexOf(FX_DOW_SRC) < 0) throw new Error("FX_DOW changed — update this test");

// ── the DeWalt fixture ──
const ID = "fbmusz3l9q";
const BLOCK = () => ({ name: "Family Time", kids: ROSTER.slice(), days: ["Mon", "Tue", "Wed", "Thu", "Fri"], at: "lunch", atByDay: { Mon: "1:35 PM" }, celeb: { on: true },
  items: [{ key: "hist", name: "History", minutes: 30, pts: 20 }, { key: "sci", name: "Science", minutes: 30, kids: ["taylor", "andrew"], track: { mode: "seq", list: [{ t: "Space Science L6", n: 2 }] } }, { key: "ra", name: "Read Aloud", minutes: 20 }] });
const PAIR = "fbpair"; // a block Taylor + Andrew already share
const PAIR_BLOCK = () => ({ name: "Fact Review", kids: ["taylor", "andrew"], days: ["Mon", "Wed", "Fri"], at: "auto", items: [{ key: "fr", name: "Fact Review", minutes: 15 }] });

// ── an environment with the REAL family helpers + the feature on stubs ──
function famEnv(E) {
  E = E || {};
  const f = new Function("toMin", "fromMin", "fbArr", "cap", "esc", "ampmTo24", "to12h", "ROSTER", "E", `
    var rulesData=E.rulesData||{familyBlocks:{}}, weekData={tasks:[]}, checked={}, histState={}, WK="week1", currData=E.currData||{subjects:{},lessons:{}};
    var rulesOpen=E.rulesOpen||{}, KID_COLOR={}, blockouts={}, SITTER_NAME="Maggie", archive={};
    var gvKid=E.gvKid||"taylor", gvEdit={x:1}, currInnerTab="plans", adminSub=null, toasts=[], closed=0, scrolled=0;
    var ceAddKid=E.ceAddKid||"taylor", ceAddForm=E.ceAddForm||{};
    var writes=[], renders=0, alerts=[], db=E.db===false?null:{ref:function(p){ return {set:function(v){ writes.push([p,v===undefined?null:JSON.parse(JSON.stringify(v===undefined?null:v))]); },remove:function(){ writes.push([p,"REMOVE"]); },update:function(u){ writes.push([p,"UPDATE",u]); },transaction:function(){}}; }};
    function _dryRun(){ return !!E.dry; } function momHere(){ return E.mom!==false; } function renderAll(){ renders++; } function dbg(){} function sv(){} function ld(){ return {}; }
    function alert(m){ alerts.push(m); } function confirm(){ return true; }
    function setAdminSub(s){ adminSub=s; renders++; } function ceCloseSheet(){ closed++; } function gwShowToast(m){ toasts.push(m); } function ceRenderAddSheet(){ renders++; }
    var document={getElementById:function(){ return null; }}; function setTimeout(fn){ scrolled++; }
    function smapIsKidOff(){ return false; } function coopTimedEndMin(){ return 0; }
    function gwParseDate(s){ const p=s.split("-"); return new Date(+p[0],+p[1]-1,+p[2]); }
    function routineDateISO(d){ return null; } function cbTodayISO(){ return "2026-10-26"; }
    function famPresLeadsId(){ return false; } function bankDirect(){ return null; } function rlogAppend(){} function finalizeDone(){} function nowTs(){ return 1; }
    ${FX_DOW_SRC}
    ${FAM}
    ${CELEB}
    ${TG}
    ${LES}
    ${DS}
    ${HOME}
    return {famDefs,famBlockEditorHTML,famSettingsCardHTML,famHomePanelHTML,famHomeToggle,famHomeDoorHTML,famHomeGo,famBlkSet,famItemSet,famToggle,famDsSet,famWrite,famItems,famMomLeads,
      famWhoPicks,famWhoToggle,famWhoSetStart,famWhoSetTime,famWhoAt,famWhoBlockFor,famWhoLessons,famWhoRowHTML,famWhoSave,
      writes:writes,alerts:alerts,toasts:toasts,rd:function(){ return rulesData; },renders:function(){ return renders; },
      st:function(){ return {open:famHomeOpen,rulesOpen:rulesOpen,gvKid:gvKid,gvEdit:gvEdit,currInnerTab:currInnerTab,adminSub:adminSub,closed:closed,scrolled:scrolled,ceAddKid:ceAddKid,form:ceAddForm}; },
      setOpen:function(v){ famHomeOpen=v; }};
  `);
  return f(toMin, fromMin, fbArr, cap, esc, ampmTo24, to12h, ROSTER, E);
}
const handlers = (h) => { const out = {}; (h.match(/on(?:click|change|input)="[A-Za-z_]+\(/g) || []).forEach(x => { const k = x.replace(/^on(?:click|change|input)="/, "").replace(/\($/, ""); out[k] = (out[k] || 0) + 1; }); return out; };
const ids = (h) => (h.match(/ id="[^"]+"/g) || []).map(x => x.slice(5, -1)).sort();
const fields = (h) => (h.match(/famBlkSet\('[^']*','[a-zA-Z]+'/g) || []).map(x => x.split("','")[1].replace(/'$/, "")).sort().filter((x, i, a) => a.indexOf(x) === i);

console.log("0. shape and hooks");
{
  const a = src.indexOf("// FAMDAYSTART_END\n"), b = src.indexOf("// FAMEDITORHOME_START");
  ok("the block sits right after FAMDAYSTART_END", a > 0 && b === a + "// FAMDAYSTART_END\n".length);
  ok("one START, one END", src.split("// FAMEDITORHOME_START").length === 2 && src.split("// FAMEDITORHOME_END").length === 2);
  const CODE = HOME.split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n");   // the block without its comment lines
  ok("the block writes only through famWrite (no db.ref / .set of its own, nothing under curriculum/)", !/db\.ref\(/.test(CODE) && !/\.set\(|\.update\(|\.remove\(/.test(CODE) && !/curriculum\//.test(CODE) && (CODE.match(/famWrite\(/g) || []).length === 2);
  ok("no 🔀 anywhere", src.indexOf("\u{1F500}") < 0);
  const hooks = [
    ["Settings ▸ Family rules draws the door instead of the card", /rulesFamilyCardsHTML\(true\)\+'<\/div>'\+\(typeof famHomeDoorHTML==="function"\?famHomeDoorHTML\(\):\(typeof famSettingsCardHTML==="function"\?famSettingsCardHTML\(\):''\)\)/],
    ["the panel sits above the family grid, on its own line", /\n  if\(gvKid==="__fam"&&typeof famHomePanelHTML==="function"\) h\+=famHomePanelHTML\(\);[^\n]*\n  if\(gvKid==="__fam"\)\{ h\+=\(typeof famGridHTML==="function"\?famGridHTML\(\):""\)\+'<\/div>'; el\.innerHTML\+=h; return; \}/],
    ["famGoEdit lands on the panel", /function famGoEdit\(\)\{\n  if\(typeof famHomeGo==="function"\)\{ famHomeGo\(\); return; \}/],
    ["the Add sheet draws the Who row right under its title", /Add Subject for '\+cap\(kid\)\+'<\/div>';\n  if\(typeof famWhoRowHTML==="function"\) h\+=famWhoRowHTML\(f\);/],
    ["ceAddSave's first line hands 2+ kids to famWhoSave", /function ceAddSave\(\)\{\n  if\(typeof famWhoSave==="function"&&famWhoSave\(\)\) return;/],
  ];
  hooks.forEach(([n, re]) => ok("hook: " + n, re.test(src)));
  ok("the Firebase paths are documented in the block", /config\/rules\/familyBlocks\/<id>/.test(HOME) && /config\/rules\/familyBlocks\/<id>\/items/.test(HOME));
  ok("the Settings card renderer itself is untouched (reused by the panel, not duplicated)", /function famSettingsCardHTML\(\)\{\n  const defs=famDefs\(\), ids=Object\.keys\(defs\);\n  let h='<div class="rules-wrap" id="fam-settings">/.test(src) && (src.match(/function famBlockEditorHTML\(/g) || []).length === 1 && (src.match(/function famSettingsCardHTML\(/g) || []).length === 1);
}

console.log("1. the Grid panel renders every field the Settings editor rendered");
{
  const E = famEnv({ rulesData: { familyBlocks: { [ID]: BLOCK(), [PAIR]: PAIR_BLOCK() } }, rulesOpen: { ["fam_" + ID]: true, ["fam_" + PAIR]: true } });
  const closed = E.famHomePanelHTML();
  ok("closed: the bar only — '⚙ Family time ▾', no editor fields", /onclick="famHomeToggle\(\)"/.test(closed) && /⚙ Family time ▾/.test(closed) && Object.keys(handlers(closed)).join() === "famHomeToggle" && !/fam-home-panel/.test(closed));
  E.famHomeToggle();
  const open = E.famHomePanelHTML();
  ok("open: the bar reads ▴ and the panel is drawn", /⚙ Family time ▴/.test(open) && /id="fam-home-panel"/.test(open) && E.renders() === 1);
  const oldEditor = E.famSettingsCardHTML();                       // what Settings ▸ Family rules drew before (the same renderer)
  const perBlock = E.famBlockEditorHTML(ID, E.famDefs()[ID], true) + E.famBlockEditorHTML(PAIR, E.famDefs()[PAIR], true);
  ok("the panel carries the old Settings render whole", open.indexOf(oldEditor) > 0);
  const hp = handlers(open), hb = handlers(perBlock);
  delete hp.famHomeToggle; const addBtn = hp.famAddBlock; delete hp.famAddBlock;   // the bar is the panel's own; ＋ Add family time belongs to the list, not to one block
  ok("handler set: panel === every block's editor (same names, same counts) + the one ＋ Add family time", JSON.stringify(hp) === JSON.stringify(hb) && addBtn === 1, { panel: hp, editor: hb });
  hp.famAddBlock = addBtn;
  ok("input ids: panel === the editors (lesson fields)", JSON.stringify(ids(open).filter(x => x !== "fam-home-panel" && x !== "fam-settings")) === JSON.stringify(ids(perBlock)));
  const must = ["famBlkSet", "famToggle", "famSetStart", "famDsToggle", "famDsSet", "famCelebTest", "famItemSet", "famItemMove", "famItemDel", "famItemAdd", "famItemKid", "famItemDay", "famTrackStart", "famTrackSaveSeq", "famSetWeAreOn", "famTogetherOpen", "famDelBlock", "famAddBlock", "rulesToggleCard"];
  ok("every field is there: " + must.join(" · "), must.every(k => hp[k] > 0), Object.keys(hp));
  ok("famBlkSet covers name · momLeads · celebration · off (Starts is famSetStart; 'at' appears once a set time is picked)", ["celeb", "momLeads", "name", "off"].every(f => fields(open).indexOf(f) >= 0) && /famBlkSet\('fbtime','at',to12h\(this\.value\)\)/.test(famEnv({ rulesData: { familyBlocks: { fbtime: Object.assign(BLOCK(), { at: "2:00 PM" }) } }, rulesOpen: { fam_fbtime: true } }).famSettingsCardHTML()), fields(open));
  ok("kids and days chips (famToggle) for both blocks", (open.match(/famToggle\('fbmusz3l9q','kids'/g) || []).length === 4 && (open.match(/famToggle\('fbmusz3l9q','days'/g) || []).length === 6 && (open.match(/famToggle\('fbpair','days'/g) || []).length === 6);
  ok("Starts: Right after lunch / Scheduler picks / At a set time + Some days (Mon 1:35 PM)", /famSetStart\('fbmusz3l9q',this\.value\)/.test(open) && /Right after lunch/.test(open) && /Scheduler picks/.test(open) && /At a set time/.test(open) && /Mondays start 1:35 PM/.test(open) && /famDsToggle\('fbmusz3l9q','Tue'\)/.test(open));
  ok("subjects in order with minutes · points · kids · lessons · ↑↓ · ✕", /famItemSet\('fbmusz3l9q',0,'minutes',this\.value\)/.test(open) && /famItemSet\('fbmusz3l9q',0,'pts',this\.value\)/.test(open) && /famItemKid\('fbmusz3l9q',1,'taylor'\)/.test(open) && /Space Science L6 ×2/.test(open) && /famItemMove\('fbmusz3l9q',2,-1\)/.test(open) && /famItemDel\('fbmusz3l9q',1\)/.test(open));
  ok("off / delete / ＋ Add family time", /famBlkSet\('fbmusz3l9q','off',true\)/.test(open) && /famDelBlock\('fbmusz3l9q'\)/.test(open) && /onclick="famAddBlock\(\)"/.test(open));
  E.famHomeToggle();
  ok("tap again → closed, nothing left the page (no setAdminSub)", !/fam-home-panel/.test(E.famHomePanelHTML()) && E.st().adminSub === null);
  // not Mom: the panel still opens, read-only (the same as the old Settings card)
  const V = famEnv({ rulesData: { familyBlocks: { [ID]: BLOCK() } }, rulesOpen: { ["fam_" + ID]: true }, mom: false });
  V.setOpen(true);
  const ro = V.famHomePanelHTML();
  ok("not in Mom mode: read-only, no famBlkSet / famItemSet / Add", !/famBlkSet|famItemSet|famAddBlock|famDelBlock/.test(ro) && /Family Time/.test(ro) && /History/.test(ro));
  // a family with no blocks: the bar, and the open panel offers ＋ Add family time (the door must land somewhere useful)
  const N = famEnv({});
  N.setOpen(true);
  ok("no family time yet: the open panel offers ＋ Add family time, nothing else", /onclick="famAddBlock\(\)"/.test(N.famHomePanelHTML()) && !/rules-card/.test(N.famHomePanelHTML()));
  // the kids' Grid branch is untouched
  const grid = extractFn("renderCurrGrid");
  ok("famHomePanelHTML is drawn only in the Family branch of renderCurrGrid", (grid.match(/famHomePanelHTML/g) || []).length === 2 && /if\(gvKid==="__fam"&&typeof famHomePanelHTML/.test(grid));
  ok("a kid's Grid still draws its 🏡 Together strip and ⚙ Rules exactly as before", (grid.match(/famGridStripHTML\(gvKid\):""\); h\+=_cardOnlyHtml;/g) || []).length === 2 && /onclick="gvRulesToggle\(\)"/.test(grid));
}

console.log("2. Settings renders only the door");
{
  const E = famEnv({ rulesData: { familyBlocks: { [ID]: BLOCK() } }, rulesOpen: { ["fam_" + ID]: true } });
  const door = E.famHomeDoorHTML();
  ok("the door is ONE line: '🏡 Family time — edit it on the Grid →' that taps famHomeGo()", /onclick="famHomeGo\(\)"/.test(door) && /\u{1F3E1} Family time — edit it on the Grid →/u.test(door) && Object.keys(handlers(door)).join() === "famHomeGo");
  ok("the door carries no editor field", !/famBlkSet|famToggle|famItemSet|famAddBlock|rules-card|Family Time<\/div>/.test(door));
  // the real Settings wrap, on stubs: the door is drawn, the old card is not
  let calledCard = 0;
  const wrap = new Function("rulesFamilyCardsHTML", "mmRulesCardHTML", "famHomeDoorHTML", "famSettingsCardHTML", extractFn("renderFamilyRulesWrap") + "; return renderFamilyRulesWrap();")(
    () => "<cards>", () => "<mm>", E.famHomeDoorHTML, () => { calledCard++; return "<OLDCARD>"; });
  ok("renderFamilyRulesWrap: Family rules cards · the door · Timed cards — the old Family time card is never drawn", wrap.indexOf("<cards>") > 0 && wrap.indexOf("famHomeGo()") > 0 && wrap.indexOf("<mm>") > 0 && calledCard === 0 && !/OLDCARD/.test(wrap));
  ok("…and in the same order (door between the cards and Timed cards)", wrap.indexOf("<cards>") < wrap.indexOf("famHomeGo()") && wrap.indexOf("famHomeGo()") < wrap.indexOf("<mm>"));
  // the door opens the Grid's Family chip with the panel open
  E.famHomeGo();
  const s = E.st();
  ok("famHomeGo(): panel open · Family chip (gvKid __fam, gvEdit cleared) · Grid tab · Admin ▸ Curriculum · scrolls to the panel", s.open === true && s.gvKid === "__fam" && s.gvEdit === null && s.currInnerTab === "grid" && s.adminSub === "curriculum" && s.scrolled === 1);
  E.setOpen(false); E.famHomeGo(PAIR);
  ok("famHomeGo(id): the same, with that family time's card expanded", E.st().open === true && E.st().rulesOpen["fam_" + PAIR] === true);
  ok("the old famGoEdit (strip chips, audit lines) delegates to famHomeGo", /function famGoEdit\(\)\{\n  if\(typeof famHomeGo==="function"\)\{ famHomeGo\(\); return; \}/.test(src));
}

console.log("3. an edit in the panel writes the same famWrite path the old editor wrote");
{
  const E = famEnv({ rulesData: { familyBlocks: { [ID]: BLOCK() } } });
  E.famBlkSet(ID, "name", "Afternoon Together");
  E.famToggle(ID, "days", "Sat");
  E.famItemSet(ID, 0, "minutes", "45");
  E.famDsSet(ID, "Wed", "2:00 PM");
  const paths = E.writes.map(w => w[0]);
  ok("name → config/rules/familyBlocks/<id>/name", paths[0] === "config/rules/familyBlocks/" + ID + "/name" && E.writes[0][1] === "Afternoon Together");
  ok("days → …/<id>/days (whole list, in week order)", paths[1] === "config/rules/familyBlocks/" + ID + "/days" && E.writes[1][1].join() === "Mon,Tue,Wed,Thu,Fri,Sat");
  ok("a subject's minutes → …/<id>/items (the items list)", paths[2] === "config/rules/familyBlocks/" + ID + "/items" && E.writes[2][1][0].minutes === 45);
  ok("Some days → …/<id>/atByDay/Wed", paths[3] === "config/rules/familyBlocks/" + ID + "/atByDay/Wed" && E.writes[3][1] === "2:00 PM");
  ok("nothing under curriculum/ or the week", paths.every(p => p.indexOf("config/rules/familyBlocks/") === 0));
  const V = famEnv({ rulesData: { familyBlocks: { [ID]: BLOCK() } }, mom: false });
  V.famBlkSet(ID, "name", "X");
  ok("not Mom → nothing written", V.writes.length === 0 && V.famDefs()[ID].name === "Family Time");
  const D = famEnv({ rulesData: { familyBlocks: { [ID]: BLOCK() } }, dry: true });
  D.famBlkSet(ID, "name", "X");
  ok("?dryrun=1 → the screen changes, the database does not", D.writes.length === 0 && D.famDefs()[ID].name === "X");
}

// ── the REAL ceAddSave on stubs: writes recorded, Date frozen ──
const SAVE = extractFn("ceAddSave");
const SAVE_TODAY = SAVE.replace(/\n  if\(typeof famWhoSave==="function"&&famWhoSave\(\)\) return;[^\n]*\n/, "\n");
if (SAVE_TODAY === SAVE) throw new Error("the ceAddSave hook line was not found");
function saveEnv(saveSrc, E) {
  const f = new Function("toMin", "fromMin", "fbArr", "cap", "esc", "ampmTo24", "to12h", "ROSTER", "E", `
    var Date=(function(R){ function D(){ return new R(1761480000000); } D.now=function(){ return 1761480000000; }; return D; })(globalThis.Date);
    var rulesData=E.rulesData||{familyBlocks:{}}, weekData={tasks:[]}, checked={}, histState={}, WK="week1", currData=E.currData||{subjects:{taylor:{},andrew:{}},lessons:{}};
    var rulesOpen={}, KID_COLOR={}, archive={}, gvKid="taylor", gvEdit=null, currInnerTab="grid", adminSub=null, toasts=[], closed=0;
    var ceAddKid=E.ceAddKid||"taylor", ceAddForm=E.ceAddForm, ceBuildOpen=null, cbKid=null, cbSubjKey=null, cbForm=null, cbPreviewRes=null, opened=[];
    var writes=[], renders=0, alerts=[], db={ref:function(p){ return {set:function(v){ writes.push([p,JSON.parse(JSON.stringify(v))]); },remove:function(){ writes.push([p,"REMOVE"]); },update:function(u){ writes.push([p,"UPDATE",u]); },transaction:function(){}}; }};
    function _dryRun(){ return false; } function momHere(){ return E.mom!==false; } function renderAll(){ renders++; } function dbg(){} function sv(){} function ld(){ return {}; }
    function alert(m){ alerts.push(m); } function confirm(){ return true; }
    function setAdminSub(s){ adminSub=s; renders++; } function ceCloseSheet(){ closed++; } function gwShowToast(m){ toasts.push(m); } function ceRenderAddSheet(){ renders++; }
    function ceOpenEdit(k,sk){ opened.push(k+"|"+sk); } function cbDefaultForm(){ return {}; }
    function _lidAlign(o,oi,seq){ return {ids:seq.map(function(_,i){ return "L"+String(i+1).padStart(4,"0"); }),nextLid:seq.length+1}; }
    ${slice("const LESSON_DAY_RE=", "\n")}
    ${extractFn("lessonExpandDays")}
    var document={getElementById:function(){ return null; }}; function setTimeout(fn){}
    function gwParseDate(s){ const p=s.split("-"); return new Date(+p[0],+p[1]-1,+p[2]); } function cbTodayISO(){ return "2026-10-26"; }
    function smapIsKidOff(){ return false; } function coopTimedEndMin(){ return 0; } function routineDateISO(){ return null; }
    ${FX_DOW_SRC}
    ${FAM}
    ${TG}
    ${LES}
    ${DS}
    ${E.noHome ? "" : HOME}
    ${saveSrc}
    ceAddSave();
    return {writes:writes,alerts:alerts,toasts:toasts,closed:closed,opened:opened,rd:function(){ return rulesData; },cd:function(){ return currData; },
      st:function(){ return {open:typeof famHomeOpen!=="undefined"?famHomeOpen:null,rulesOpen:rulesOpen,gvKid:gvKid,currInnerTab:currInnerTab,adminSub:adminSub,ceAddKid:ceAddKid}; }};
  `);
  return f(toMin, fromMin, fbArr, cap, esc, ampmTo24, to12h, ROSTER, E);
}
const FORM = (o) => Object.assign({ name: "Space Science", device: "book", mom: "required", minutes: 35, days: "Mon Wed Fri", rules: "sequential", total: 12, startAt: 3, lessonSource: "auto", prefix: "Lesson", manualLessons: "", daysPerLesson: 1, allowedDays: [], priority: "normal", carryoverCap: 2, stickyWith: "", stickyOrder: "after", tracking: "sequenced", timesPerWeek: 3, fixedTime: "", fixedDates: [], joinUrl: "" }, o || {});

console.log("4. Add Subject with ONE kid writes exactly what it writes today");
{
  const cases = [["no who at all (the sheet as before)", {}], ["who = [the current kid]", { who: ["taylor"] }], ["who = [] (nothing picked yet)", { who: [] }],
    ["a daily subject", { tracking: "daily" }], ["a typed lesson list, 2 days per lesson", { lessonSource: "manual", manualLessons: "pg 1-3\npg 4-6\nReview", daysPerLesson: 2 }], ["a class at a set time", { fixedTime: "1:00 PM", fixedDates: ["2026-11-02"], joinUrl: "https://zoom.us/j/1" }]];
  cases.forEach(([n, o]) => {
    const now = saveEnv(SAVE, { ceAddForm: FORM(o) }), before = saveEnv(SAVE_TODAY, { ceAddForm: FORM(o), noHome: true });
    ok("byte-identical writes — " + n, JSON.stringify(now.writes) === JSON.stringify(before.writes) && now.writes.length === 2 && now.writes[0][0] === "curriculum/subjects/taylor/space_science" && now.closed === 1 && before.closed === 1 && JSON.stringify(now.opened) === JSON.stringify(before.opened), { now: now.writes, before: before.writes });
  });
  const one = saveEnv(SAVE, { ceAddForm: FORM() });
  ok("…a subject for the kid, with its lessons (Lesson 3 → 12) and nothing under familyBlocks", one.writes[0][1].lessonSeq.join() === "Lesson 3,Lesson 4,Lesson 5,Lesson 6,Lesson 7,Lesson 8,Lesson 9,Lesson 10,Lesson 11,Lesson 12" && one.writes[0][1].minutes === 35 && !one.writes.some(w => /familyBlocks/.test(w[0])));
  const other = saveEnv(SAVE, { ceAddForm: FORM({ who: ["andrew"] }) });
  ok("one OTHER kid picked → that kid's own subject, today's path", other.writes[0][0] === "curriculum/subjects/andrew/space_science" && other.st().ceAddKid === "andrew" && !other.writes.some(w => /familyBlocks/.test(w[0])));
}

console.log("5. Add Subject with TWO kids writes one family-time item, no per-kid subject");
{
  // no block with these kids yet → a new one, named after the subject
  const R = saveEnv(SAVE, { ceAddForm: FORM({ who: ["andrew", "taylor"] }), rulesData: { familyBlocks: { [ID]: BLOCK() } } });
  ok("exactly ONE write", R.writes.length === 1, R.writes);
  const w = R.writes[0], nid = w[0].replace("config/rules/familyBlocks/", "");
  ok("…a new block at config/rules/familyBlocks/<id>", /^config\/rules\/familyBlocks\/fb[a-z0-9]+$/.test(w[0]) && nid !== ID);
  const b = w[1];
  ok("named after the subject · kids = the picks (roster order) · days = the sheet's days · starts right after lunch", b.name === "Space Science" && b.kids.join() === "taylor,andrew" && b.days.join() === "Mon,Wed,Fri" && b.at === "lunch");
  ok("Mom leads it (momLeads absent = on, the editor's own convention)", b.momLeads === undefined && R.rd().familyBlocks[nid] && new Function("return " + extractFn("famMomLeads") + ";")()(b) === true);
  ok("ONE item: the subject's name and minutes, no kids list (everyone in the block), no from:, no points", b.items.length === 1 && b.items[0].name === "Space Science" && b.items[0].minutes === 35 && b.items[0].kids === undefined && b.items[0].from === undefined && b.items[0].pts === undefined && /^i[a-z0-9]+$/.test(b.items[0].key));
  ok("the lessons the sheet captured ride onto the item's in-order track: Lesson 3 → 12, 1 sitting each", b.items[0].track.mode === "seq" && b.items[0].track.list.length === 10 && b.items[0].track.list[0].t === "Lesson 3" && b.items[0].track.list[9].t === "Lesson 12" && b.items[0].track.list.every(l => l.n === 1));
  ok("NO per-kid subject written, nothing under curriculum/", !R.writes.some(x => /^curriculum\//.test(x[0])) && Object.keys(R.cd().subjects.taylor).length === 0 && Object.keys(R.cd().subjects.andrew).length === 0);
  ok("nothing paused (no pausedFor anywhere — unlike 🧩 Do together there is nothing to pause)", JSON.stringify(R.writes).indexOf("paused") < 0 && JSON.stringify(R.cd()).indexOf("paused") < 0);
  ok("the sheet closes, the pace-and-build sheet does NOT open, a toast names the kids", R.closed === 1 && R.opened.length === 0 && /Space Science — a Family Time subject for Taylor & Andrew/.test(R.toasts[0] || ""));
  const s = R.st();
  ok("…and the Grid's Family chip opens with the panel open on that block", s.open === true && s.rulesOpen["fam_" + nid] === true && s.gvKid === "__fam" && s.currInnerTab === "grid" && s.adminSub === "curriculum");
  // a block with EXACTLY these kids exists → the item joins it
  const J = saveEnv(SAVE, { ceAddForm: FORM({ who: ["taylor", "andrew"] }), rulesData: { familyBlocks: { [ID]: BLOCK(), [PAIR]: PAIR_BLOCK() } } });
  ok("joins: ONE write to …/<that block>/items — the old item + the new one (the write 🧩 Do together makes)", J.writes.length === 1 && J.writes[0][0] === "config/rules/familyBlocks/" + PAIR + "/items" && J.writes[0][1].length === 2 && J.writes[0][1][0].key === "fr" && J.writes[0][1][1].name === "Space Science" && J.writes[0][1][1].minutes === 35 && J.writes[0][1][1].track.list.length === 10);
  ok("…the block itself is untouched (name, kids, days, start) and the panel opens on IT", J.rd().familyBlocks[PAIR].name === "Fact Review" && J.rd().familyBlocks[PAIR].at === "auto" && J.st().rulesOpen["fam_" + PAIR] === true && Object.keys(J.rd().familyBlocks).length === 2);
  // the big block has all four kids → three picks don't match it → a new block
  const T = saveEnv(SAVE, { ceAddForm: FORM({ who: ["taylor", "makenzie", "caleb"] }), rulesData: { familyBlocks: { [ID]: BLOCK() } } });
  ok("three kids, no block with exactly those three → a new block for the three", T.writes.length === 1 && T.writes[0][0] !== "config/rules/familyBlocks/" + ID + "/items" && T.writes[0][1].kids.join() === "taylor,makenzie,caleb");
  const A = saveEnv(SAVE, { ceAddForm: FORM({ who: ROSTER.slice() }), rulesData: { familyBlocks: { [ID]: BLOCK() } } });
  ok("all four → joins the family's block (4 items now), order kept", A.writes[0][0] === "config/rules/familyBlocks/" + ID + "/items" && A.writes[0][1].map(x => x.name).join() === "History,Science,Read Aloud,Space Science");
  // start picked on the sheet
  const S1 = saveEnv(SAVE, { ceAddForm: FORM({ who: ["taylor", "andrew"], famAt: "auto" }) });
  const S2 = saveEnv(SAVE, { ceAddForm: FORM({ who: ["taylor", "andrew"], famAt: "time", famTime: "2:15 PM" }) });
  const S3 = saveEnv(SAVE, { ceAddForm: FORM({ who: ["taylor", "andrew"], famAt: "time" }) });
  ok("Starts: Scheduler picks → at 'auto' · At a set time → the time ('2:15 PM') · a set time with none typed → 1:00 PM", S1.writes[0][1].at === "auto" && S2.writes[0][1].at === "2:15 PM" && S3.writes[0][1].at === "1:00 PM");
  // lessons: the typed list, days per lesson, daily
  const M = saveEnv(SAVE, { ceAddForm: FORM({ who: ["taylor", "andrew"], lessonSource: "manual", manualLessons: "Ch. 1 Planets\n\nCh. 2 Moons  \nCh. 3 Stars", daysPerLesson: 2 }) });
  ok("a typed list → one line per lesson, ×2 sittings each (days per lesson)", JSON.stringify(M.writes[0][1].items[0].track.list) === JSON.stringify([{ t: "Ch. 1 Planets", n: 2 }, { t: "Ch. 2 Moons", n: 2 }, { t: "Ch. 3 Stars", n: 2 }]));
  const D3 = saveEnv(SAVE, { ceAddForm: FORM({ who: ["taylor", "andrew"], daysPerLesson: 3, total: 4, startAt: 1 }) });
  ok("auto-number ×3 days per lesson → Lesson 1..4, n:3", D3.writes[0][1].items[0].track.list.map(l => l.t + "×" + l.n).join() === "Lesson 1×3,Lesson 2×3,Lesson 3×3,Lesson 4×3");
  const DY = saveEnv(SAVE, { ceAddForm: FORM({ who: ["taylor", "andrew"], tracking: "daily" }) });
  ok("Daily tracking → no lesson track on the item", DY.writes.length === 1 && DY.writes[0][1].items[0].track === undefined);
  const ND = saveEnv(SAVE, { ceAddForm: FORM({ who: ["taylor", "andrew"], days: "" }) });
  ok("no days picked → Mon–Fri (the same default ＋ Add family time uses)", ND.writes[0][1].days.join() === "Mon,Tue,Wed,Thu,Fri");
  const MN = saveEnv(SAVE, { ceAddForm: FORM({ who: ["taylor", "andrew"], minutes: 500 }) });
  ok("minutes clamped like the editor (5–240)", MN.writes[0][1].items[0].minutes === 240);
  // guards
  const NN = saveEnv(SAVE, { ceAddForm: FORM({ who: ["taylor", "andrew"], name: "  " }) });
  ok("no name → 'Enter a subject name.', nothing written, sheet stays", NN.writes.length === 0 && NN.alerts[0] === "Enter a subject name." && NN.closed === 0);
  const NL = saveEnv(SAVE, { ceAddForm: FORM({ who: ["taylor", "andrew"], total: 0 }) });
  ok("sequenced with no lessons → 'Add at least one lesson.', nothing written", NL.writes.length === 0 && NL.alerts[0] === "Add at least one lesson.");
  const NM = saveEnv(SAVE, { ceAddForm: FORM({ who: ["taylor", "andrew"] }), mom: false });
  ok("not Mom → nothing written (no per-kid subject either), a plain message", NM.writes.length === 0 && /Mom mode/.test(NM.alerts[0] || "") && NM.closed === 0);
  const K = saveEnv(SAVE, { ceAddForm: FORM({ who: ["taylor", "andrew"] }), rulesData: { familyBlocks: { [PAIR]: Object.assign(PAIR_BLOCK(), { off: true }), fblive: PAIR_BLOCK() } } });
  ok("two blocks with the same kids, one off → joins the live one", K.writes[0][0] === "config/rules/familyBlocks/fblive/items");
}

console.log("6. the 'Who does this?' row");
{
  const E = famEnv({ rulesData: { familyBlocks: { [ID]: BLOCK() } }, ceAddKid: "andrew", ceAddForm: FORM() });
  let h = E.famWhoRowHTML(E.st().form);
  ok("a chip per kid (roster order), the current kid pre-selected, nothing else selected", (h.match(/famWhoToggle\('/g) || []).length === 4 && /class="ce-chip sel" onclick="famWhoToggle\('andrew'\)">Andrew</.test(h) && (h.match(/ce-chip sel/g) || []).length === 1 && h.indexOf("Taylor") < h.indexOf("Makenzie") && h.indexOf("Makenzie") < h.indexOf("Andrew"));
  ok("the plain words under the chips", /Picking 2 or more makes this a Family Time subject they do together\./.test(h));
  ok("one kid: no Starts picker, no family-time box", !/famWhoSetStart/.test(h) && !/Makes a new family time|Joins/.test(h));
  E.famWhoToggle("andrew");
  ok("the last kid can't be un-picked", E.famWhoPicks(E.st().form).join() === "andrew");
  E.famWhoToggle("taylor");
  h = E.famWhoRowHTML(E.st().form);
  ok("two picked (roster order kept): both kid chips selected", E.famWhoPicks(E.st().form).join() === "taylor,andrew" && (h.match(/ce-chip sel" onclick="famWhoToggle/g) || []).length === 2);
  ok("…no block with exactly these two → 'Makes a new family time for Taylor & Andrew' + Starts chips, lunch pre-selected", /Makes a new family time for Taylor &amp; Andrew, named after this subject\. Mom leads it\./.test(h) && /class="ce-chip sel" onclick="famWhoSetStart\('lunch'\)">Right after lunch</.test(h) && /famWhoSetStart\('time'\)">At a set time</.test(h) && /famWhoSetStart\('auto'\)">Scheduler picks</.test(h) && !/famWhoSetTime/.test(h));
  E.famWhoSetStart("time");
  h = E.famWhoRowHTML(E.st().form);
  ok("At a set time → a time field (13:00 by default) that saves through famWhoSetTime", /value="13:00" onchange="famWhoSetTime\(this\.value\)"/.test(h));
  E.famWhoSetTime("14:15");
  ok("…typed 14:15 → '2:15 PM' (what the block's at will be)", E.st().form.famTime === "2:15 PM" && E.famWhoAt(E.st().form) === "2:15 PM");
  E.famWhoSetStart("auto");
  ok("Scheduler picks → at 'auto', with its one line of explanation", E.famWhoAt(E.st().form) === "auto" && /earliest morning time/.test(E.famWhoRowHTML(E.st().form)));
  E.famWhoToggle("makenzie"); E.famWhoToggle("caleb");
  h = E.famWhoRowHTML(E.st().form);
  ok("all four picked → 'Joins “Family Time”' (the block they already share), no Starts picker", /Joins “Family Time” — the family time Taylor &amp; Makenzie &amp; Andrew &amp; Caleb already share\./.test(h) && !/famWhoSetStart/.test(h));
  ok("nothing is written while picking", E.writes.length === 0);
  ok("famWhoLessons: auto 3→12 ×1 · manual list · daily none", E.famWhoLessons(FORM()).length === 10 && E.famWhoLessons(FORM({ lessonSource: "manual", manualLessons: "a\nb" })).map(l => l.t).join() === "a,b" && E.famWhoLessons(FORM({ tracking: "daily" })).length === 0);
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
