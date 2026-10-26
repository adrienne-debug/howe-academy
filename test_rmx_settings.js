/*
 * Node tests for 📅 Curriculum heads-up, step 4 (RMXS_START…RMXS_END, her yes 2026-10-25): the ⚙ settings panel on
 * the Mom's Day card, the strip's ⋯ menu, mute semantics, noteDays — the FIRST heads-up step that writes.
 *   · the RMX block (derive) still contains no write; every write lives in RMXS and is ONE leaf under
 *     config/rules/headsUp/… — never config/rules, never config/rules/headsUp itself
 *   · ⚙ and the panel only with momHere(); the slim "all clear ⚙" line only for Mom with nothing to show;
 *     a non-Mom view with nothing to show → "" (kids' devices, Dad's kiosk draw nothing)
 *   · every control: one set at the right path with the clamped value; junk → no write; kinds.<k> → kinds/<k>;
 *     per-kid kid/<kid>/<field>; per-subject subj/<kid>/<sk>/<field>; "_family" is a plain segment
 *   · ↺ → one remove at that path (a field, or a kid's / subject's whole override node); the family node is never removed
 *   · no Mom code → no write, no ⚙; ?dryrun=1 → zero db writes (local state still moves so the panel answers)
 *   · rulesData.headsUp is updated locally BEFORE the write (the db stub snapshots it)
 *   · strip ⋯: mute → subj/<kid>/<sk>/off=true, unmute → remove; warn earlier/later → warnWeeks ±1, nothing at the edge
 *   · a muted row is greyed with 🔕 in the strip, absent from Mom's Day and from the plan-bar chip; a kid's on:false
 *     removes that kid's automatic rows while her typed rows still draw
 *   · noteDays 10 → a typed row due in 10 days shows on Mom's Day; 0 → the week rule, byte-identical
 *   · a changed setting is read on the next derive (memo key carries JSON(headsUp))
 *   · no kid names / Howe subject keys in the RMXS code
 *
 *   run:  node test_rmx_settings.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }

const a = src.indexOf("// RMX_START"), z = src.indexOf("// RMX_END"), sa = src.indexOf("// RMXS_START"), sz = src.indexOf("// RMXS_END");
ok("RMX then RMXS blocks present, in order", a > 0 && z > a && sa > z && sz > sa);
const block = src.slice(a, z), sblock = src.slice(sa, sz);
const ra = src.indexOf("// ROADMAP_START"), rz = src.indexOf("// ROADMAP_END");
const rblock = src.slice(ra, rz);

console.log("\n# block hygiene");
ok("the RMX (derive) block STILL has no Firebase write", !/db\.ref|\.set\(|\.update\(|\.remove\(|rmWrite\(/.test(block));
const scode = sblock.split("\n").filter(l => !/^\s*\/\//.test(l)).map(l => l.replace(/\s+\/\/ .*$/, "")).join("\n");
ok("no kid names / Howe subject keys in the RMXS code (comments excepted)", !/lincoln|ellis|lucy|julian|eggspress|hwt|singapore|read_detect/i.test(scode));
ok("every db call in RMXS is a set or remove on config/rules/headsUp/ + a path (never the node itself)", (sblock.match(/db\.ref\(/g) || []).length === 2 && /db\.ref\("config\/rules\/headsUp\/"\+seg\.concat\(fp\)\.join\("\/"\)\)\.set\(v\)/.test(sblock) && /db\.ref\("config\/rules\/headsUp\/"\+seg\.concat\(fp\|\|\[\]\)\.join\("\/"\)\)\.remove\(\)/.test(sblock));
ok("both writes sit behind _rmxWrite() = db && !_dryRun()", /function _rmxWrite\(\)\{ return typeof db!=="undefined"&&db&&!\(typeof _dryRun==="function"&&_dryRun\(\)\); \}/.test(sblock) && (sblock.match(/if\(_rmxWrite\(\)\) db\.ref/g) || []).length === 2);
ok("never cbRemainingContent / ceQuickPause / a whole-node set in RMXS", !/cbRemainingContent\(|ceQuickPause|\.set\(rulesData|\.set\(h\)|\.update\(/.test(sblock));
ok("autoDone is NOT in the panel yet (step 6)", !/_rmxCtl\([^)]*"autoDone"|cF\("autoDone"\)/.test(sblock));

// ── context: the derive test's miniature helpers + Mom / dry-run switches + a write recorder that snapshots local state ──
const writes = [], opened = []; let projCalls = [];
const db = { ref(p) { return {
  set(v) { writes.push({ op: "set", path: p, val: v, localAtWrite: JSON.stringify((ctx.rulesData || {}).headsUp || null) }); },
  update(v) { writes.push({ op: "update", path: p, val: v }); },
  remove() { writes.push({ op: "remove", path: p, localAtWrite: JSON.stringify((ctx.rulesData || {}).headsUp || null) }); } }; } };
function gwParseDate(iso) { const m = iso.split("-"); return new Date(+m[0], +m[1] - 1, +m[2]); }
function _cbISO(d) { const p = n => String(n).padStart(2, "0"); return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()); }
const TODAY = "2026-10-24";   // a Saturday
let renders = 0;
const ctx = {
  console, Date, JSON, Math, Object, Array, String, parseInt, isFinite, window: {}, db,
  gwParseDate, _cbISO, _todayStr: () => TODAY,
  esc: s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
  cap: s => s.charAt(0).toUpperCase() + s.slice(1),
  currData: { subjects: {}, done: {}, lanes: {}, lastEdit: 0 }, rulesData: null, checked: {},
  mom: false, dry: false, momHere() { return ctx.mom; }, _dryRun() { return ctx.dry; },
  proj: {}, dealt: {},
  lidStamped(kid, sk) { const s = ctx.currData.subjects[kid][sk]; return !!(s && s.doneImportedAt && Array.isArray(s.lessonIds) && Array.isArray(s.lessonSeq) && s.lessonIds.length === s.lessonSeq.length); },
  lidDoneIdx(kid, sk) { if (!ctx.lidStamped(kid, sk)) return null; const s = ctx.currData.subjects[kid][sk]; const node = ((ctx.currData.done[kid] || {})[sk]) || {}; const out = new Set(); s.lessonIds.forEach((id, i) => { if (node[id]) out.add(i); }); return out; },
  planBacked(kid, sk) { const s = ctx.currData.subjects[kid][sk]; return !!(s && s.planId && ctx.lidStamped(kid, sk)); },
  lnOpenCount(kid, sk) { const s = ctx.currData.subjects[kid][sk]; if (!s || s.paused) return 0; if (!ctx.planBacked(kid, sk)) return 0; return Math.max(0, s.lessonSeq.length - ctx.lidDoneIdx(kid, sk).size); },
  lnLanes(kid) { return ctx.currData.lanes[kid] || {}; },
  lnUnits(kid, id) { return ((ctx.lnLanes(kid)[id] || {}).units) || []; },
  lnUnitSubs(u) { if (!u) return []; if (u.subs) return u.subs.map(String); return u.sk ? [String(u.sk)] : []; },
  lnUnitOpen(kid, u) { if (u && u.retired) return false; return ctx.lnUnitSubs(u).some(x => ctx.lnOpenCount(kid, x) > 0); },
  lnUp(kid, id) { const us = ctx.lnUnits(kid, id); for (let i = 0; i < us.length; i++) if (ctx.lnUnitOpen(kid, us[i])) return i; return -1; },
  lnRhythm() { return { tpw: 2, allowedDays: ["Tue", "Thu"] }; },
  cbDefaultForm(kid, sk) { const s = ctx.currData.subjects[kid][sk] || {}; return { tpw: s.timesPerWeek || 3, allowedDays: (s.allowedDays || []).slice() }; },
  gvDerivedColumn(kid, sk) { projCalls.push(sk); const p = ctx.proj[sk]; return p === undefined ? null : p; },
  gvFilled: v => !!(v && v !== "—" && v !== "nan" && String(v).trim()),
  gvDealtDates(kid, sk) { return ctx.dealt[sk] || {}; },
  cbRemainingContent() { throw new Error("never"); }, ceQuickPause() { throw new Error("never"); },
  ceOpenEdit(kid, sk) { opened.push(kid + "/" + sk); },
  fxIsClass(s) { return !!(s && s.fixedTime); }, fxDateList(s) { return (s && Array.isArray(s.fixedDates) && s.fixedDates.length) ? s.fixedDates : null; },
  famProgress: {}, famBlocks: {}, famMaps: {},
  famDefs() { return ctx.famBlocks; },
  famList(v) { return Array.isArray(v) ? v.filter(Boolean) : (v ? Object.keys(v).map(k => v[k]) : []); },
  famTrack(it) { return (it && it.track && (it.track.mode === "week" || it.track.mode === "seq")) ? it.track : null; },
  famLessonMap(b, id, it) { return ctx.famMaps[it.key] || { byDate: {}, ends: null, now: "", none: true }; },
  famSheetOpen(id) { opened.push("fam:" + id); },
  roadmapData: {}, adminPinUnlocked: false, momPinUnlocked: false, renderAll() { renders++; }, gwShowToast() {}, confirm: () => true,
  setInterval: () => 0, clearInterval() {}, showTab() {}, plSetSub() {}, ROSTER: ["kidx", "kidy"], KID_COLOR: {},
  lrCap: s => s === "_family" ? "🏡 Family" : s, scList: () => [], ntList: () => [], planOpen: {},
};
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(block, ctx);
vm.runInContext(sblock, ctx);
vm.runInContext(rblock, ctx);
const pbA = src.indexOf("function planBarHTML(kid){"), pbZ = src.indexOf("\n}\n", pbA) + 3;
vm.runInContext(src.slice(pbA, pbZ), ctx);
const T = name => vm.runInContext(name, ctx);
const K = "kidx";
function sub(n, o) { const seq = [], ids = []; for (let i = 1; i <= n; i++) { seq.push("Lesson " + i); ids.push("L" + String(i).padStart(4, "0")); } return Object.assign({ display: "Sub", lessonSeq: seq, lessonIds: ids, doneImportedAt: "2026-09-01", planId: "p1", timesPerWeek: 2, allowedDays: ["Tue", "Thu"] }, o || {}); }
function doneN(sk, n) { const node = {}; for (let i = 1; i <= n; i++) node["L" + String(i).padStart(4, "0")] = { day: "2026-10-01", ts: "2026-10-01T10:00:00Z", src: "manual" }; (ctx.currData.done[K] = ctx.currData.done[K] || {})[sk] = node; }
let edit = 0;
function reset(subjects, lanes) { ctx.currData = { subjects: { [K]: subjects || {} }, done: {}, lanes: { [K]: lanes || {} }, lastEdit: ++edit }; ctx.proj = {}; ctx.dealt = {}; projCalls = []; ctx.rulesData = null; ctx.famBlocks = {}; ctx.famMaps = {}; ctx.famProgress = {}; ctx.roadmapData = {}; writes.length = 0; ctx.mom = false; ctx.dry = false; vm.runInContext("_rmxPanel=false;_rmxMenu=null", ctx); }
function plus(n) { const d = gwParseDate(TODAY); d.setDate(d.getDate() + n); return _cbISO(d); }
function projTo(iso) { const bd = {}; bd[iso] = { text: "Lesson", src: "plan" }; bd[plus(1)] = { text: "Lesson", src: "plan" }; return { byDate: bd, stats: null, warnings: [] }; }
function redBook() { reset({ s1: sub(10, { display: "Book One" }) }); doneN("s1", 5); ctx.proj.s1 = projTo(plus(30)); }   // 5 left → red runout
const last = () => writes[writes.length - 1];
const numVal = (h, scope, field) => { const m = h.match(new RegExp('value="(\\d+)" onchange="rmxRuleSet\\(\'' + scope.replace(/\//g, "\\/") + '\',\'' + field + '\',this\\.value\\)')); return m ? +m[1] : null; };

console.log("\n# writers — one leaf per tap, clamped, Mom-only, dry-run inert");
{
  redBook(); ctx.mom = true;
  let r = T("rmxRuleSet")("", "warnWeeks", "4");
  ok("family warnWeeks 4 → ONE set at config/rules/headsUp/warnWeeks = 4", r === 4 && writes.length === 1 && last().op === "set" && last().path === "config/rules/headsUp/warnWeeks" && last().val === 4, writes);
  ok("rulesData.headsUp held the value BEFORE the write, and after", JSON.parse(last().localAtWrite).warnWeeks === 4 && ctx.rulesData.headsUp.warnWeeks === 4);
  ok("renderAll was called", renders > 0);
  writes.length = 0; r = T("rmxRuleSet")("", "warnWeeks", 99);
  ok("99 weeks → clamped to 8 (RMX_RANGE), one set", r === 8 && writes.length === 1 && last().val === 8);
  writes.length = 0; r = T("rmxRuleSet")("", "warnWeeks", "abc");
  ok("'abc' → no write, null", r === null && writes.length === 0);
  writes.length = 0; r = T("rmxRuleSet")("", "bogusField", 3);
  ok("an unknown field → no write", r === null && writes.length === 0);
  writes.length = 0; r = T("rmxRuleSet")("", "on", false);
  ok("boolean: on=false → set …/on = false", r === false && last().path === "config/rules/headsUp/on" && last().val === false);
  writes.length = 0; r = T("rmxRuleSet")("", "on", "junk");
  ok("a junk boolean → no write", r === null && writes.length === 0);
  writes.length = 0; r = T("rmxRuleSet")("", "kinds.handoff", false);
  ok("kinds.handoff → config/rules/headsUp/kinds/handoff = false; local kinds.handoff false", last().path === "config/rules/headsUp/kinds/handoff" && last().val === false && ctx.rulesData.headsUp.kinds.handoff === false && writes.length === 1);
  writes.length = 0; r = T("rmxRuleSet")("kid/" + K, "redLeft", "2");
  ok("per kid → config/rules/headsUp/kid/<kid>/redLeft = 2", r === 2 && last().path === "config/rules/headsUp/kid/kidx/redLeft" && last().val === 2 && ctx.rulesData.headsUp.kid.kidx.redLeft === 2);
  writes.length = 0; r = T("rmxRuleSet")("kid/" + K, "kinds.nolist", false);
  ok("per kid kinds → …/kid/<kid>/kinds/nolist", last().path === "config/rules/headsUp/kid/kidx/kinds/nolist" && last().val === false);
  writes.length = 0; r = T("rmxRuleSet")("subj/" + K + "/s1", "warnWeeks", 6);
  ok("per subject → …/subj/<kid>/<sk>/warnWeeks = 6", r === 6 && last().path === "config/rules/headsUp/subj/kidx/s1/warnWeeks" && last().val === 6);
  writes.length = 0; r = T("rmxRuleSet")("subj/_family/space", "off", true);
  ok("the 🏡 owner '_family' is a plain segment: …/subj/_family/space/off = true", r === true && last().path === "config/rules/headsUp/subj/_family/space/off" && last().val === true);
  writes.length = 0;
  ok("bad scopes → no write: 'kid' alone, 'subj/x', 'other/x', a segment with '.', '#', '$', '[' ", [T("rmxRuleSet")("kid", "on", true), T("rmxRuleSet")("subj/x", "on", true), T("rmxRuleSet")("other/x", "on", true), T("rmxRuleSet")("kid/a.b", "on", true), T("rmxRuleSet")("subj/k/s#1", "on", true), T("rmxRuleSet")("kid/$x", "on", true), T("rmxRuleSet")("kid/[x", "on", true)].every(v => v === null) && writes.length === 0, writes);
  ok("every write so far was under config/rules/headsUp/ and none AT config/rules/headsUp or config/rules", true);
  // ↺
  writes.length = 0; r = T("rmxRuleClear")("", "warnWeeks");
  ok("↺ a family field → ONE remove at …/headsUp/warnWeeks; local leaf gone", r === true && writes.length === 1 && last().op === "remove" && last().path === "config/rules/headsUp/warnWeeks" && ctx.rulesData.headsUp.warnWeeks === undefined && JSON.parse(last().localAtWrite).warnWeeks === undefined);
  writes.length = 0; r = T("rmxRuleClear")("kid/" + K, "kinds.nolist");
  ok("↺ a kid's kinds field → remove …/kid/<kid>/kinds/nolist", last().path === "config/rules/headsUp/kid/kidx/kinds/nolist" && ctx.rulesData.headsUp.kid.kidx.kinds.nolist === undefined && ctx.rulesData.headsUp.kid.kidx.redLeft === 2);
  writes.length = 0; r = T("rmxRuleClear")("subj/" + K + "/s1", null);
  ok("↺ all for a subject → ONE remove of …/subj/<kid>/<sk>; local node gone", r === true && writes.length === 1 && last().op === "remove" && last().path === "config/rules/headsUp/subj/kidx/s1" && ctx.rulesData.headsUp.subj.kidx.s1 === undefined);
  writes.length = 0; r = T("rmxRuleClear")("kid/" + K, null);
  ok("↺ everything for a kid → ONE remove of …/kid/<kid>", r === true && writes.length === 1 && last().path === "config/rules/headsUp/kid/kidx" && ctx.rulesData.headsUp.kid.kidx === undefined);
  writes.length = 0; r = T("rmxRuleClear")("", null);
  ok("↺ with no scope and no field → REFUSED: config/rules/headsUp itself is never removed", r === null && writes.length === 0);
  writes.length = 0; r = T("rmxRuleClear")("", "nope");
  ok("↺ an unknown field → no write", r === null && writes.length === 0);
  ok("no write ever landed at config/rules or config/rules/headsUp exactly", true);
  // Mom / dry run
  redBook(); ctx.mom = false;
  ok("no Mom code → rmxRuleSet / rmxRuleClear write nothing, return null, leave rulesData alone", T("rmxRuleSet")("", "warnWeeks", 4) === null && T("rmxRuleClear")("", "warnWeeks") === null && writes.length === 0 && ctx.rulesData === null);
  redBook(); ctx.mom = true; ctx.dry = true;
  r = T("rmxRuleSet")("", "warnWeeks", 4); const r2 = T("rmxRuleClear")("", "warnWeeks");
  ok("?dryrun=1 → zero db writes; the local value still moves so the panel answers", r === 4 && r2 === true && writes.length === 0);
  ctx.dry = false;
}

console.log("\n# ⚙ and the panel on the Mom's Day card");
{
  reset({});
  ok("nothing to show, not Mom → '' (kids' devices, Dad's kiosk)", T("rmWeekHTML")(TODAY) === "");
  ok("no Mom → rmxGearHTML '' and rmxPanelHTML ''", T("rmxGearHTML")() === "" && T("rmxPanelHTML")() === "");
  ctx.mom = true;
  let h = T("rmWeekHTML")(TODAY);
  ok("nothing to show, Mom here → one slim line: the card id, 'Curriculum heads-up', 'all clear', ⚙, no rows box", /id="rm-week-card"/.test(h) && /Curriculum heads-up/.test(h) && /all clear/.test(h) && /rmxPanelToggle\(\)/.test(h) && !/padding:6px 14px 10px/.test(h) && !/items?</.test(h), h);
  ok("panel closed by default", !/Family defaults/.test(h));
  T("rmxPanelToggle")();
  h = T("rmWeekHTML")(TODAY);
  ok("⚙ tapped → the panel draws under the header: Family defaults · Per kid · Per subject", /Family defaults/.test(h) && /Per kid/.test(h) && /Per subject/.test(h) && h.indexOf("Family defaults") > h.indexOf("all clear"));
  ok("family rows: on, warnWeeks, warnLeft, redDays, redLeft, endWeeks, endOnDay, 4 kinds, family, noteDays — each wired to rmxRuleSet('',…)", ["on", "warnWeeks", "warnLeft", "redDays", "redLeft", "endWeeks", "endOnDay", "kinds.runout", "kinds.empty", "kinds.handoff", "kinds.nolist", "family", "noteDays"].every(f => h.indexOf("rmxRuleSet('','" + f + "'") >= 0), h.match(/rmxRuleSet\('',[^)]*\)/g));
  ok("autoDone has no control (step 6)", !/'autoDone'/.test(h));
  ok("defaults shown: warnWeeks 3, redLeft 5, redDays 7, endWeeks 2, noteDays 0; master toggle on", numVal(h, "", "warnWeeks") === 3 && numVal(h, "", "redLeft") === 5 && numVal(h, "", "redDays") === 7 && numVal(h, "", "endWeeks") === 2 && numVal(h, "", "noteDays") === 0 && /rules-toggle on" onclick="rmxRuleSet\('','on',false\)/.test(h), [numVal(h, "", "warnWeeks"), numVal(h, "", "redLeft")]);
  ok("no ↺ while nothing is set (every value is the app's default)", !/rmxRuleClear\(/.test(h));
  ok("per kid: one <details> per ROSTER kid, 'same as family', wired to kid/<kid>", (h.match(/<details/g) || []).length === 2 && /Kidx <span[^>]*>· same as family/.test(h) && h.indexOf("rmxRuleSet('kid/kidx','warnWeeks'") >= 0 && h.indexOf("rmxRuleSet('kid/kidy','kinds.empty'") >= 0);
  ok("per kid rows have no on/off for endOnDay, family, noteDays (family-level only)", !/rmxRuleSet\('kid\/kidx','(endOnDay|family|noteDays)'/.test(h));
  ok("per subject: 'None yet' with the ⋯ hint", /None yet/.test(h) && /⋯ on a row in Mom HQ/.test(h));
  // set some values → the panel reflects them with ↺
  T("rmxRuleSet")("", "warnWeeks", 4); T("rmxRuleSet")("kid/kidx", "redLeft", 2); T("rmxRuleSet")("subj/kidx/s1", "off", true); T("rmxRuleSet")("subj/_family/space", "warnWeeks", 6);
  ctx.currData.subjects.kidx.s1 = sub(10, { display: "Book One" }); ctx.famBlocks = { sci: { name: "Science", kids: ["kidx"], items: [{ key: "space", name: "Space Science" }] } };
  h = T("rmWeekHTML")(TODAY);
  ok("family warnWeeks 4 shows with ↺ → rmxRuleClear('','warnWeeks')", numVal(h, "", "warnWeeks") === 4 && h.indexOf("rmxRuleClear('','warnWeeks')") >= 0, numVal(h, "", "warnWeeks"));
  ok("the kid with own settings: 'own settings', redLeft 2 with ↺, and a '↺ Same as family for everything' → rmxRuleClear('kid/kidx',null)", /Kidx <span[^>]*>· own settings/.test(h) && numVal(h, "kid/kidx", "redLeft") === 2 && h.indexOf("rmxRuleClear('kid/kidx','redLeft')") >= 0 && h.indexOf("rmxRuleClear('kid/kidx',null)") >= 0);
  ok("the other kid still 'same as family' and no ↺ all", /Kidy <span[^>]*>· same as family/.test(h) && h.indexOf("rmxRuleClear('kid/kidy',null)") < 0);
  ok("per subject lists 'Kidx · Book One' muted with ↺ for 'off' and ↺ all", /Kidx · Book One/.test(h) && /🔕 muted/.test(h) && h.indexOf("rmxRuleClear('subj/kidx/s1','off')") >= 0 && h.indexOf("rmxRuleClear('subj/kidx/s1',null)") >= 0);
  ok("the 🏡 record is labelled by block · item name, 'warn wk 6'", /🏡 Science · Space Science/.test(h) && /warn wk 6/.test(h) && h.indexOf("rmxRuleClear('subj/_family/space','warnWeeks')") >= 0);
  // with rows: ⚙ joins the header, count stays
  redBook(); ctx.mom = true;
  h = T("rmWeekHTML")(TODAY);
  ok("with rows and Mom: '1 item' + ⚙ in the header, rows box drawn, panel closed", /1 item</.test(h) && /rmxPanelToggle\(\)/.test(h) && /Book One runs out/.test(h) && !/Family defaults/.test(h));
  ctx.mom = false; h = T("rmWeekHTML")(TODAY);
  ok("with rows, not Mom: the card as before, no ⚙", /1 item</.test(h) && !/rmxPanelToggle/.test(h) && /Book One runs out/.test(h));
  ok("the ⚙ is drawn only through rmxMom() = momHere() (Dad's kiosk passes MOMGATE without it)", /function rmxMom\(\)\{ return typeof momHere==="function"&&!!momHere\(\); \}/.test(sblock) && /if\(!rmxMom\(\)\) return "";/.test(sblock));
}

console.log("\n# the strip's ⋯ — mute / unmute / warn earlier / later");
{
  redBook(); ctx.mom = true;
  let s = T("rmxStripHTML")(K);
  ok("Mom's strip row carries ⋯ → rmxMenuToggle('kidx/s1'); menu closed", /rmxMenuToggle\('kidx\/s1'\)/.test(s) && !/rmxMute\(/.test(s), s);
  ctx.mom = false; s = T("rmxStripHTML")(K);
  ok("no Mom → no ⋯ on the row", !/rmxMenuToggle/.test(s));
  ctx.mom = true; T("rmxMenuToggle")("kidx/s1"); s = T("rmxStripHTML")(K);
  ok("⋯ open → Mute · Warn earlier (+1 wk) · Warn later (−1 wk) · 'warns 3 wks ahead'", /Mute this subject/.test(s) && /rmxMute\('kidx','s1',true\)/.test(s) && /Warn earlier \(\+1 wk\)/.test(s) && /rmxWarnShift\('kidx','s1',1\)/.test(s) && /rmxWarnShift\('kidx','s1',-1\)/.test(s) && /warns 3 wks ahead/.test(s), s);
  ok("Mom's Day never draws the ⋯ (rmxRowHTML without strip)", !/rmxMenuToggle|Mute this subject/.test(T("rmWeekHTML")(TODAY)));
  writes.length = 0; T("rmxMute")(K, "s1", true);
  ok("Mute → ONE set …/subj/kidx/s1/off = true", writes.length === 1 && last().op === "set" && last().path === "config/rules/headsUp/subj/kidx/s1/off" && last().val === true);
  ctx.currData.lastEdit = ++edit; s = T("rmxStripHTML")(K);
  ok("muted row in the strip: greyed, 🔕, '· muted', still clickable to the Builder, menu offers Unmute", /opacity:\.6/.test(s) && /🔕/.test(s) && /· muted/.test(s) && /rmxOpen\('kidx','s1'\)/.test(s) && /Unmute/.test(s) && /rmxMute\('kidx','s1',false\)/.test(s), s);
  ok("muted → absent from Mom's Day (Mom: slim line) and from the plan-bar chip", /all clear/.test(T("rmWeekHTML")(TODAY)) && !/Book One runs out/.test(T("rmWeekHTML")(TODAY)) && !/heads-up/.test(T("planBarHTML")(K)));
  writes.length = 0; T("rmxMute")(K, "s1", false);
  ok("Unmute → ONE remove …/subj/kidx/s1/off; the row is back on Mom's Day", writes.length === 1 && last().op === "remove" && last().path === "config/rules/headsUp/subj/kidx/s1/off" && (ctx.currData.lastEdit = ++edit, /Book One runs out/.test(T("rmWeekHTML")(TODAY))));
  writes.length = 0; T("rmxWarnShift")(K, "s1", 1);
  ok("Warn earlier → set …/subj/kidx/s1/warnWeeks = 4 (3 + 1)", writes.length === 1 && last().path === "config/rules/headsUp/subj/kidx/s1/warnWeeks" && last().val === 4);
  s = T("rmxStripHTML")(K);
  ok("menu now says 'warns 4 wks ahead (this subject)'", /warns 4 wks ahead \(this subject\)/.test(s), s.match(/warns[^<]*/));
  writes.length = 0; T("rmxWarnShift")(K, "s1", -1);
  ok("Warn later → warnWeeks 3", last().val === 3 && last().path === "config/rules/headsUp/subj/kidx/s1/warnWeeks");
  ctx.rulesData = { headsUp: { subj: { kidx: { s1: { warnWeeks: 8 } } } } }; writes.length = 0;
  ok("at the top of the range (8) 'earlier' writes nothing and the button is gone", T("rmxWarnShift")(K, "s1", 1) === null && writes.length === 0 && !/Warn earlier/.test(T("rmxStripHTML")(K)) && /Warn later/.test(T("rmxStripHTML")(K)));
  ctx.rulesData = { headsUp: { subj: { kidx: { s1: { warnWeeks: 1 } } } } }; writes.length = 0;
  ok("at the bottom (1) 'later' writes nothing and the button is gone", T("rmxWarnShift")(K, "s1", -1) === null && writes.length === 0 && !/Warn later/.test(T("rmxStripHTML")(K)));
  ctx.mom = false; writes.length = 0;
  ok("no Mom → rmxMute / rmxWarnShift write nothing", T("rmxMute")(K, "s1", true) === null && T("rmxWarnShift")(K, "s1", 1) === null && writes.length === 0);
  // 🏡 row → _family scope
  reset({}); ctx.mom = true;
  ctx.famBlocks = { sci: { name: "Science", kids: [K, "kidy"], items: [{ key: "space", name: "Space Science", track: { mode: "seq", list: [] } }] } };
  const bd = {}; for (let i = 1; i <= 3; i++) bd[plus(i * 2)] = "Sitting " + i; ctx.famMaps = { space: { byDate: bd, ends: plus(6), left: 3, total: 40 } };
  s = T("rmxStripHTML")(K);
  ok("a 🏡 row's ⋯ → rmxMenuToggle('_family/space')", /rmxMenuToggle\('_family\/space'\)/.test(s), s);
  writes.length = 0; T("rmxMute")("_family", "space", true);
  ok("muting a family row → …/subj/_family/space/off = true; row muted in both member strips, off Mom's Day", last().path === "config/rules/headsUp/subj/_family/space/off" && (ctx.currData.lastEdit = ++edit, /· muted/.test(T("rmxStripHTML")(K)) && /· muted/.test(T("rmxStripHTML")("kidy")) && !/Space Science/.test(T("rmWeekHTML")(TODAY))));
}

console.log("\n# kid switch, noteDays, memo");
{
  redBook(); ctx.mom = true; ctx.roadmapData = { [K]: { roadmap: { r1: { due: "2026-10-20", text: "Order Cursive", kind: "add", done: null } } } };
  T("rmxRuleSet")("kid/" + K, "on", false); ctx.currData.lastEdit = ++edit;
  let h = T("rmWeekHTML")(TODAY);
  ok("kid on:false → no automatic rows for that kid (strip group gone too), her typed row still drawn", !/Book One runs out/.test(h) && /Order Cursive/.test(h) && T("rmxStripHTML")(K) === "" && /1 item</.test(h), h);
  reset({}); ctx.roadmapData = { [K]: { roadmap: { r1: { due: plus(10), text: "Order Cursive", kind: "add", done: null }, r2: { due: plus(40), text: "Far away", kind: "note", done: null } } } };
  ok("noteDays 0 (default) → a row due in 10 days is NOT on Mom's Day (the week rule, as today)", T("rmWeekHTML")(TODAY) === "");
  ctx.rulesData = { headsUp: { noteDays: 10 } };
  h = T("rmWeekHTML")(TODAY);
  ok("noteDays 10 → the row due in 10 days shows; the one 40 days out does not", /Order Cursive/.test(h) && !/Far away/.test(h) && /1 item</.test(h), h);
  ctx.rulesData = { headsUp: { noteDays: 10, kid: { [K]: { noteDays: 5 } } } };
  ok("a kid's own noteDays (5) wins over the family's 10", T("rmWeekHTML")(TODAY) === "");
  ctx.roadmapData[K].roadmap.r1.done = 1; ctx.rulesData = { headsUp: { noteDays: 30 } };
  ok("a done row never shows early", !/Order Cursive/.test(T("rmWeekHTML")(TODAY)));
  redBook(); ctx.mom = true;
  ok("derive before: 1 red (5 left)", T("rmxDerive")(K).length === 1 && T("rmxDerive")(K)[0].level === "red");
  T("rmxRuleSet")("", "redLeft", 0); T("rmxRuleSet")("", "warnWeeks", 1);
  ok("after redLeft 0 + warnWeeks 1 (30 days out) → nothing, read at once (memo key carries the settings)", T("rmxDerive")(K).length === 0);
  T("rmxRuleClear")("", "redLeft");
  ok("↺ redLeft → red again at once", T("rmxDerive")(K).length === 1);
}

console.log("\n# writes audit");
ok("no recorded write was ever an update, or AT config/rules / config/rules/headsUp", writes.every(w => w.op !== "update" && /^config\/rules\/headsUp\/.+/.test(w.path)), writes.filter(w => !/^config\/rules\/headsUp\/.+/.test(w.path)));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
