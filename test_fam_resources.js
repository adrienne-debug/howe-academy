/*
 * 📎 ⏱ FAMRES (#15, her design notes 2026-10-22): Family Time items get the lesson resources (#12) and the minimum-minutes
 * timer (#11). Runs the real FAMBLOCK + FAMTOGETHER + FAMLESSONS + LESSONRES + MINMINUTES + FAMRES blocks out of index.html.
 *
 *   0. placement + hooks: the block sits right after SETTIME_TODAY_END; every hook is one guarded line; no 🔀.
 *   1. the _family record: curriculum/resources/_family/fam_<block>_<item>/<_subject|lessonKey>/<part>, one targeted part per
 *      write, Mom-only, ?dryrun=1 inert; the panel opens on the item default or on this lesson (wk<n> / l_<title>).
 *   2. the family card: one link → one button, two → "Links (2) ▾"; the kids' "🎒 bring:" line; notes never show.
 *   3. the Sunday list: a "🏡 Family" group from the items that run this week and next, same ticks and lead-time dates.
 *   4. the timer: mmTarget = the item's minMin; the countdown on Mom's view only; Mom's early check follows the family rule
 *      ("Not yet" / "Let it through") and never sends a line; a kid's tap is untouched; one leaf write for the setting.
 *   5. an item with nothing set looks exactly as it does without FAMRES.
 *
 *   run: node test_fam_resources.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const sl = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("slice " + a); return src.slice(i, j); };
const FAM = sl("// FAMBLOCK_START", "// FAMBLOCK_END"), TG = sl("// FAMTOGETHER_START", "// FAMTOGETHER_END"), FL = sl("// FAMLESSONS_START", "// FAMLESSONS_END");
const LR = sl("// LESSONRES_START", "// LESSONRES_END"), MM = sl("// MINMINUTES_START", "// MINMINUTES_END"), FR = sl("// FAMRES_START", "// FAMRES_END");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } };
const toMin = t => { const m = String(t || "").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i); if (!m) return NaN; let h = +m[1]; const ap = (m[3] || "").toUpperCase(); if (ap === "PM" && h !== 12) h += 12; if (ap === "AM" && h === 12) h = 0; return h * 60 + (+m[2]); };

const TODAY = "2026-10-23";   // a Friday → this week Mon 10/19–Sun 10/25, next week 10/26–11/1
const NOW0 = new Date(2026, 9, 23, 13, 10, 0).getTime();   // 1:10 PM — family time was laid at 1:00
function env(E) {
  let NOW = E.now || NOW0;
  class FDate extends Date { constructor(...x) { if (!x.length) super(NOW); else super(...x); } static now() { return NOW; } }
  const writes = [], toasts = [];
  const db = E.nodb ? null : { ref: p => ({ set: v => { writes.push([p, v]); return Promise.resolve(); }, remove: () => { writes.push([p, null]); return Promise.resolve(); }, on: () => {}, once: () => {} }) };
  const R = new Function("toMin", "E", "Date", "db", "writes", "toasts", `
    var rulesData=E.rulesData, currData=E.currData, weekData={tasks:E.tasks||[]}, checked=E.checked||{}, claimed={}, histState={}, WK="week12", tab="settings";
    var supplies={};
    const ROSTER=["taylor","makenzie","andrew","caleb"], KID_COLOR={};
    function fbArr(v){ if(!v) return v; if(Array.isArray(v)) return v; if(typeof v==="object"){ const k=Object.keys(v); if(k.length&&k.every(x=>/^\\d+$/.test(x))) return k.sort((a,b)=>a-b).map(x=>v[x]); } return v; }
    function cap(s){ return s?s[0].toUpperCase()+s.slice(1):s; } function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
    function _dryRun(){ return !!E.dry; } function momHere(){ return E.mom!==false; } function momHereCards(){ return E.mom!==false; }
    function renderAll(){} function dbg(){} function confirm(){ return true; } function alert(){} function gwShowToast(m){ toasts.push(m); }
    function sv(){} function ld(){ return null; } function activeWk(){ return "week12"; }
    function gwParseDate(s){ const p=s.split("-"); return new Date(+p[0],+p[1]-1,+p[2]); }
    function smapIsKidOff(k,ds){ return !!(E.off&&E.off[k+"|"+ds]); } function coopTimedEndMin(k,ds){ return 0; }
    function planBacked(){ return false; } function cbTodayISO(){ return "${TODAY}"; } function routineDateISO(d){ return (E.dayISO||{})[d]||""; } var gvShowPast=false;
    function effectiveDay(t){ return t.day; } var _todayDay="friday"; function _todayStr(){ return "${TODAY}"; }
    var _dom=E.dom||{};
    var _els={};
    var document={getElementById:id=>_els[id]||((id in _dom)?{value:_dom[id],checked:_dom[id]!==false}:null),
      createElement:()=>({style:{},innerHTML:"",remove(){ delete _els[this.id]; }}), body:{appendChild:el=>{ _els[el.id]=el; }}};
    const FX_DOW={monday:"Mon",tuesday:"Tue",wednesday:"Wed",thursday:"Thu",friday:"Fri",saturday:"Sat",sunday:"Sun"};
    ${FAM}
    ${TG}
    ${FL}
    ${LR}
    ${MM}
    ${E.noFR ? "" : FR}
    return {ev:function(c){ return eval(c); }};
  `)(toMin, E, FDate, db, writes, toasts);
  return { ev: R.ev, writes, toasts, setNow: ms => { NOW = ms; } };
}
// DeWalt-like: Family Time Mon–Fri after lunch (1:00), History by the calendar + Read Aloud; two weeks of school days.
const SD = { defaultStart: "9:00 AM", defaultEnd: "4:00 PM", lunchStart: "12:00 PM", lunchEnd: "1:00 PM" };
const dates = ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30"];
const lessons = { andrew: {} }; dates.forEach((d, i) => lessons.andrew[i + 1] = { date: d, week: "Wk " + (i < 5 ? 1 : 2) });
const HIST = { key: "h", name: "History", minutes: 30, track: { mode: "week", book: "BiblioPlan", startDate: "2026-10-19", startWeek: 8, total: 34, days: { Mon: "Day 1", Tue: "Day 2", Wed: "Day 3", Thu: "Map work", Fri: "Presidents" } } };
const READ = { key: "r", name: "Read Aloud", minutes: 30 };
const PLAIN = { key: "p", name: "Poetry", minutes: 15 };
const FT = { name: "Family Time", kids: ["taylor", "makenzie", "andrew", "caleb"], days: ["Mon", "Tue", "Wed", "Thu", "Fri"], at: "lunch", items: [HIST, READ, PLAIN] };
const card = (id, who, item, day, extra) => Object.assign({ id, who, day: day || "friday", famBlock: "ft", famItem: item, time: item === "h" ? "1:00 PM" : item === "r" ? "1:30 PM" : "2:00 PM", title: "🏡 x" }, extra || {});
const base = extra => Object.assign({
  rulesData: { schoolDay: SD, familyBlocks: { ft: JSON.parse(JSON.stringify(FT)) } },
  currData: { subjects: {}, lessons, resources: {} },
  dayISO: { monday: "2026-10-19", tuesday: "2026-10-20", wednesday: "2026-10-21", thursday: "2026-10-22", friday: "2026-10-23", nextmon: "2026-10-26" },
}, extra || {});
const J = x => JSON.stringify(x);

console.log("0. placement + hooks");
{
  const a = src.indexOf("// SETTIME_TODAY_END\n"), b = src.indexOf("// FAMRES_START");
  ok("the block sits right after SETTIME_TODAY_END (after every family block it reads)", a > 0 && b === a + "// SETTIME_TODAY_END\n".length);
  ok("one START, one END", src.split("// FAMRES_START").length === 2 && src.split("// FAMRES_END").length === 2);
  ok("the block never writes Firebase itself — only through lrWrite / famWrite", !/db\.ref|\.set\(|\.update\(/.test(FR));
  ok("no 🔀 anywhere", src.indexOf("\u{1F500}") < 0);
  const hooks = [
    ["lrCardParts → frCardParts", /if\(typeof frIsFamCard==="function"&&frIsFamCard\(t\)\) return frCardParts\(t,readOnly,done\);/],
    ["lrBuildList → frBuildFamily", /const _fr=\(typeof frBuildFamily==="function"\)\?frBuildFamily\(w0,w1,today\):null;/],
    ["lrSubjName → frSubjName", /if\(kid==="_family"&&typeof frSubjName==="function"\) return frSubjName\(sk\);/],
    ["lrCap → 🏡 Family", /function lrCap\(s\)\{ if\(s==="_family"\) return/],
    ["mmTarget → frTarget", /function mmTarget\(t\)\{ if\(t&&t\.famBlock\) return \(typeof frTarget==="function"\)\?frTarget\(t\):0;/],
    ["mmClock → frClock", /if\(_ft&&_ft\.famBlock&&typeof frClock==="function"\) return frClock\(_ft,nowMs\);/],
    ["mmTapGate → frTapGate", /if\(t\.famBlock\) return \(typeof frTapGate==="function"\)\?frTapGate\(t\):false;/],
    ["mmCardRow: Mom's view only", /if\(t\.famBlock&&!\(typeof frLeadsHere==="function"&&frLeadsHere\(t\)\)\) return "";/],
    ["mmOnDone: no early line for a family card", /if\(target&&today&&!t\.famBlock&&!mmMomTap\(\)/],
    ["mmTick: no overrun line for a family card", /c\.from==="start"&&!t\.famBlock&&el>=target\*2/],
    ["famBlockEditorHTML → frItemEditorHTML", /try\{ if\(typeof frItemEditorHTML==="function"\) h\+=frItemEditorHTML\(id,it,i,ed\); \}catch\(e\)\{\}/],
    ["renderAll → frPanelPaint", /try\{ if\(typeof frPanelPaint==="function"\) frPanelPaint\(\); \}catch\(e\)\{\}/],
  ];
  hooks.forEach(h => ok("hook: " + h[0], h[1].test(src)));
  ok("LESSONRES still names no Family Time internals", !/famBlock|famRowHTML|FAM_ICON/.test(LR));
}

console.log("1. the _family record");
{
  const E = env(base());
  ok("subject key = fam_<block>_<item>", E.ev('frSk("ft","r")') === "fam_ft_r" && E.ev('frSk("a.b","c/d")') === "fam_a_b_c_d");
  E.ev('lrWrite("_family","fam_ft_r","_subject","supplies",[{name:"blankets",kids:true},{name:"tea",kids:false}])');
  ok("one targeted part: curriculum/resources/_family/fam_ft_r/_subject/supplies", J(E.writes) === J([["curriculum/resources/_family/fam_ft_r/_subject/supplies", [{ name: "blankets", kids: true }, { name: "tea", kids: false }]]]), E.writes);
  ok("lrFor reads it back unchanged (the subject default for every day)", E.ev('lrFor("_family","fam_ft_r","__none__").supplies.length') === 2 && E.ev('lrFor("_family","fam_ft_r","__none__")._from.supplies') === "subject");
  E.ev('lrWrite("_family","fam_ft_r","_subject","supplies",[])');
  ok("an empty list clears the part (set null)", J(E.writes[1]) === J(["curriculum/resources/_family/fam_ft_r/_subject/supplies", null]));
  const K = env(base({ mom: false })); K.ev('lrWrite("_family","fam_ft_r","_subject","notes","x")');
  ok("not Mom → nothing written", K.writes.length === 0);
  const D = env(base({ dry: true })); D.ev('lrWrite("_family","fam_ft_r","_subject","notes","x")');
  ok("?dryrun=1 → nothing reaches Firebase (local copy only)", D.writes.length === 0 && D.ev('currData.resources._family.fam_ft_r._subject.notes') === "x");
  // the panel from the editor row
  E.ev('frOpenPanel("ft","r",false)');
  ok("the panel paints into its own layer above the editor sheet", /Read Aloud/.test(E.ev('_els["fr-panel-ov"].innerHTML')) && /z-index:8600/.test(E.ev('_els["fr-panel-ov"].style.cssText')));
  E.ev("lrClosePanel(); frPanelPaint()");
  ok("× closes it (the layer is removed)", E.ev('_els["fr-panel-ov"]') === undefined);
  E.ev('frOpenPanel("ft","r",false)');
  ok("📎 Resources opens the item default (_subject) on the _family record", J(E.ev("lrPanel")) === J({ kid: "_family", sk: "fam_ft_r", key: "_subject", text: "", edit: null }), E.ev("lrPanel"));
  const ph = E.ev('lrPanelHTML("_family")');
  ok("the panel names the item, not a key", /Read Aloud/.test(ph) && !/fam_ft_r/.test(ph));
  ok("the Grid's own panel never draws it (kid slot mismatch)", E.ev('lrPanelHTML("andrew")') === "");
  E.writes.length = 0;
  const E2 = env(base({ dom: { "lr-in-links-url": "https://example.com/read", "lr-in-links-label": "Audiobook" } }));
  E2.ev('frOpenPanel("ft","r",false)'); E2.ev('lrAddItem("links")');
  ok("+ Add in the panel writes ONE part under _family", J(E2.writes) === J([["curriculum/resources/_family/fam_ft_r/_subject/links", [{ url: "https://example.com/read", label: "Audiobook" }]]]), E2.writes);
  // a tracked item: "This lesson" = this book week
  E.ev('frOpenPanel("ft","h",true)');
  ok("📎 This lesson on a week-by-week item opens wk<n> (today = Wk 8 · Presidents)", E.ev("lrPanel.key") === "wk8" && /Wk 8/.test(E.ev("lrPanel.text")), E.ev("lrPanel"));
  ok("lesson keys: week mode → wk<n> for each week named (make-up days too)", J(E.ev('frLessonKeys(famDefs().ft.items[0],"BiblioPlan Wk 9 · Day 1 + Wk 8 · Day 3 (missed Oct 21)")')) === J(["wk9", "wk8"]));
  ok("lesson keys: in-order → l_<title>, every sitting of a lesson the same key", J(E.ev('frLessonKeys({track:{mode:"seq",list:[{t:"L6",n:3}]}},"Space Science L6 \\u00B7 day 2 of 3")')) === J(E.ev('frLessonKeys({track:{mode:"seq",list:[{t:"L6",n:3}]}},"Space Science L6 \\u00B7 day 3 of 3")')));
  ok("no lessons → no lesson keys (the item default only)", J(E.ev('frLessonKeys(famDefs().ft.items[1],"anything")')) === "[]");
  E.ev('lrPanel=null'); E.ev('frPanelPaint()');
  ok("the editor row shows 📎 Resources and ⏱ minimum (Mom)", /\u{1F4CE} Resources/u.test(E.ev('frItemEditorHTML("ft",famDefs().ft.items[1],1,true)')) && /Minimum before Mom checks it/.test(E.ev('frItemEditorHTML("ft",famDefs().ft.items[1],1,true)')));
  ok("a tracked item also offers This lesson", /This lesson: BiblioPlan Wk 8/.test(E.ev('frItemEditorHTML("ft",famDefs().ft.items[0],0,true)')));
}

console.log("2. the family card");
{
  const res = { _family: {
    fam_ft_r: { _subject: { links: [{ url: "https://example.com/a", label: "Audiobook" }], supplies: [{ name: "blankets", kids: true, qty: "4" }, { name: "tea for Mom", kids: false }], notes: "SECRET prep note" } },
    fam_ft_h: { _subject: { links: [{ url: "https://example.com/map", label: "Map" }] }, wk8: { links: [{ url: "https://example.com/wk8", label: "Week 8 video" }], supplies: [{ name: "colored pencils", kids: true }] } },
  } };
  const E = env(base({ currData: { subjects: {}, lessons, resources: res } }));
  const r = E.ev('lrCardParts(' + J(card("r0", "andrew", "r")) + ',null,"",false,false)');
  ok("one link → one button (no menu)", /Audiobook/.test(r.menu) && !/Links \(/.test(r.menu) && (r.menu.match(/<a /g) || []).length === 1, r.menu);
  ok("the kids' line: only kids:true supplies, with the amount", r.kids.indexOf("🎒 bring: 4 blankets") >= 0 && !/tea/.test(r.kids), r.kids);
  ok("notes never on the card", !/SECRET/.test(r.menu + r.kids));
  const h = E.ev('lrCardParts(' + J(card("h0", "andrew", "h")) + ',null,"",false,false)');
  ok("a lesson's own links win (wk8) — and the item default shows where the lesson says nothing", /Week 8 video/.test(h.menu) && !/Map/.test(h.menu) && /colored pencils/.test(h.kids), h);
  const h2 = env(base({ currData: { subjects: {}, lessons, resources: { _family: { fam_ft_h: { _subject: { links: [{ url: "https://example.com/map", label: "Map" }, { url: "https://example.com/tl", label: "Timeline" }] } } } } } }))
    .ev('lrCardParts(' + J(card("h1", "andrew", "h")) + ',null,"",false,false)');
  ok("two links → one small Links (2) ▾ menu", /Links \(2\) ▾/.test(h2.menu), h2.menu);
  const ro = E.ev('lrCardParts(' + J(card("r0", "andrew", "r")) + ',null,"",true,false)');
  ok("read-only: no link button, the kids' line stays", ro.menu === "" && /bring/.test(ro.kids));
  ok("a done card carries nothing", J(E.ev('lrCardParts(' + J(card("r0", "andrew", "r")) + ',null,"",false,true)')) === J({ menu: "", kids: "" }));
}

console.log("3. the Sunday list's 🏡 Family group");
{
  const res = { _family: {
    fam_ft_r: { _subject: { supplies: [{ name: "Blankets", kids: true }], books: [{ title: "Little House", by: "Wilder", checkoutBy: "2026-10-24" }] } },
    fam_ft_h: { wk9: { orders: [{ name: "Japan map poster", url: "https://example.com/p", orderBy: "2026-10-28" }] } },
  } };
  const E = env(base({ currData: { subjects: {}, lessons, resources: res } }));
  const L = E.ev('lrBuildList({today:"' + TODAY + '"})');
  const F = L.kids.find(k => k.kid === "_family");
  ok("a 🏡 Family group joins the list", !!F && L.kids.length === 1, L.kids.map(k => k.kid));
  const items = (F ? F.kinds : []).reduce((a, k) => a.concat(k.items), []);
  const bl = items.find(i => i.name === "Blankets"), bk = items.find(i => i.name === "Little House"), od = items.find(i => i.name === "Japan map poster");
  ok("supplies of an item that runs both weeks → one item, both weeks", bl && J(bl.weeks) === "[0,1]", bl && bl.weeks);
  ok("tick id = kid slot + subject + kind + item (survives a re-lay)", bl && bl.id === "lr__family_fam_ft_r_supplies_blankets", bl && bl.id);
  ok("a book's lead time: by Sat (10/24)", bk && bk.by === "by Sat", bk && bk.by);
  ok("a lesson's own order shows only in the week that lesson runs (Wk 9 = next week)", od && J(od.weeks) === "[1]" && od.by === "by Wed" && od.url === "https://example.com/p", od);
  ok("kinds in order: supplies, books, orders", F && J(F.kinds.map(k => k.kind)) === J(["supplies", "books", "orders"]));
  ok("the family items count in the list", L.n === 3, L.n);
  const html = E.ev('lrSundayHTML(lrBuildList({today:"' + TODAY + '"}),{},{})');
  ok("the list draws a 🏡 Family heading with the item's name on each row", html.indexOf("\u{1F3E1} Family") >= 0 && /Read Aloud — Read Aloud/.test(html) && /History — BiblioPlan Wk 9/.test(html));
  E.ev('lrTick("lr__family_fam_ft_r_supplies_blankets",0)');
  ok("the same tick path: <week>/supplies/<id>", J(E.writes) === J([["week12/supplies/lr__family_fam_ft_r_supplies_blankets", true]]), E.writes);
  const due = E.ev('lrDueSoon(lrBuildList({today:"' + TODAY + '"}),{},{})');
  ok("a family book due within two days sits in Mom's 🔴 Now", due.some(d => d.name === "Little House"), due.map(d => d.name));
  ok("its Now row names the family, not a kid", /🏡 Family · Read Aloud/.test(E.ev('lrNowRowHTML(lrDueSoon(lrBuildList({today:"' + TODAY + '"}),{},{})[0])')));
  const off = env(base({ currData: { subjects: {}, lessons, resources: res }, rulesData: { schoolDay: SD, familyBlocks: { ft: Object.assign(JSON.parse(JSON.stringify(FT)), { off: true }) } } }));
  ok("a family time that's turned off adds nothing", !off.ev('lrBuildList({today:"' + TODAY + '"})').kids.length);
}

console.log("4. the timer");
{
  const rules = (min, early) => { const r = { schoolDay: SD, familyBlocks: { ft: JSON.parse(JSON.stringify(FT)) } }; r.familyBlocks.ft.items[1].minMin = min; if (early) r.minMinutes = { early }; return r; };
  const tasks = () => [card("r0", "andrew", "r"), card("r1", "taylor", "r"), card("p0", "andrew", "p"), card("rT", "andrew", "r", "thursday")];
  let E = env(base({ rulesData: rules(20), tasks: tasks() }));
  ok("mmTarget = the item's minimum", E.ev("mmTarget(weekData.tasks[0])") === 20);
  ok("an item without one stays untimed", E.ev("mmTarget(weekData.tasks[2])") === 0);
  ok("before the card's laid time (1:30) there is no clock yet", E.ev("mmClock('r0')") === null);
  E.setNow(new Date(2026, 9, 23, 13, 40).getTime());
  ok("10 min after the laid time: from 'time', 10 min elapsed", E.ev("mmClock('r0').from") === "time" && Math.round(E.ev("mmElapsed('r0')")) === 10);
  ok("Mom's view: ⏱ 10 min left, since family time's start", /⏱ 10 min left/.test(E.ev("mmCardRow(weekData.tasks[0],false,false,false)")) && /since family time&#39;s start|since family time's start/.test(E.ev("mmCardRow(weekData.tasks[0],false,false,false)")) && /▶ Start/.test(E.ev("mmCardRow(weekData.tasks[0],false,false,false)")));
  ok("Not yet (default): Mom's early check waits — 8 min to go (20 − 2 grace − 10)", E.ev("mmTapGate(weekData.tasks[0])") === true && E.toasts[E.toasts.length - 1] === "⏱ Not yet — 8 min to go", E.toasts);
  ok("a check of another day's copy never waits", E.ev("mmTapGate(weekData.tasks[3])") === false);
  E.setNow(new Date(2026, 9, 23, 13, 49).getTime());
  ok("at target − grace: ready ✓ and the check goes through", /ready ✓/.test(E.ev("mmCardRow(weekData.tasks[0],false,false,false)")) && E.ev("mmTapGate(weekData.tasks[0])") === false);
  // ▶ Start on ANY copy is the group's clock
  E = env(base({ rulesData: rules(20), tasks: tasks(), now: new Date(2026, 9, 23, 13, 40).getTime() }));
  E.ev("started['r1']=" + new Date(2026, 9, 23, 13, 35).getTime());
  ok("Mom's ▶ Start on another copy counts for this one (5 min)", E.ev("mmClock('r0').from") === "start" && Math.round(E.ev("mmElapsed('r0')")) === 5 && !/▶ Start/.test(E.ev("mmCardRow(weekData.tasks[0],false,false,false)")));
  // kid's device
  const K = env(base({ rulesData: rules(20), tasks: tasks(), mom: false, now: new Date(2026, 9, 23, 13, 40).getTime() }));
  ok("a kid's card shows no countdown (the countdown is Mom's)", K.ev("mmCardRow(weekData.tasks[0],false,false,false)") === "");
  ok("a kid's tap is not gated here — it goes on to 'Mom checks this off'", K.ev("mmTapGate(weekData.tasks[0])") === false && K.toasts.length === 0);
  // Let it through
  const T = env(base({ rulesData: rules(20, "tell"), tasks: tasks(), now: new Date(2026, 9, 23, 13, 40).getTime() }));
  ok("Let it through: Mom's early check lands", T.ev("mmTapGate(weekData.tasks[0])") === false && T.toasts.length === 0);
  T.ev("checked['r0']=" + new Date(2026, 9, 23, 13, 40).getTime());
  const spent = T.ev("mmOnDone('r0'," + new Date(2026, 9, 23, 13, 40).getTime() + ")");
  ok("…and no 'short' line goes to Mom (she is the one checking)", T.writes.length === 0 && J(T.ev("minAlerts")) === "{}" && spent === 10, [T.writes, spent]);
  // no overrun line
  const O = env(base({ rulesData: rules(20), tasks: tasks(), now: new Date(2026, 9, 23, 15, 0).getTime() }));
  O.ev("started['r0']=" + new Date(2026, 9, 23, 13, 30).getTime()); O.ev("mmTick()");
  ok("an open family card past double its time sends no overrun line", O.writes.length === 0 && J(O.ev("minAlerts")) === "{}");
  ok("mmTick keeps a laid-time countdown moving each minute", /r0@/.test(env(base({ rulesData: rules(30), tasks: tasks(), now: new Date(2026, 9, 23, 13, 50).getTime() })).ev("mmTick()")));
  // the setting
  const S = env(base());
  S.ev('frSetMin("ft","r","20")');
  ok("the editor's minimum = ONE leaf: config/rules/familyBlocks/ft/items/1/minMin", J(S.writes) === J([["config/rules/familyBlocks/ft/items/1/minMin", 20]]) && S.ev("famDefs().ft.items[1].minMin") === 20, S.writes);
  S.ev('frSetMin("ft","r","")');
  ok("blank = off: the leaf is removed (null), never written as 0", J(S.writes[1]) === J(["config/rules/familyBlocks/ft/items/1/minMin", null]) && S.ev("famDefs().ft.items[1].minMin") === undefined);
  const SK = env(base({ mom: false })); SK.ev('frSetMin("ft","r","20")');
  ok("not Mom → no write", SK.writes.length === 0);
  ok("the minimum rides along when another field of the item is saved", (() => { const X = env(base({ rulesData: rules(20) })); X.ev('famItemSet("ft",1,"name","Read-aloud")'); return X.writes[0] && X.writes[0][1][1].minMin === 20; })());
}

console.log("5. an item with nothing set looks exactly as today");
{
  const tasks = [card("p0", "andrew", "p"), card("p1", "taylor", "p")];
  const mk = noFR => env(base({ tasks, noFR, now: new Date(2026, 9, 23, 14, 10).getTime() }));
  const A = mk(false), B = mk(true);
  ok("card parts: empty", J(A.ev("lrCardParts(weekData.tasks[0],null,'',false,false)")) === J({ menu: "", kids: "" }) && J(A.ev("lrCardParts(weekData.tasks[0],null,'',false,false)")) === J(B.ev("lrCardParts(weekData.tasks[0],null,'',false,false)")));
  ok("timer: untimed, no row, no gate — same as without FAMRES", A.ev("mmTarget(weekData.tasks[0])") === 0 && A.ev("mmCardRow(weekData.tasks[0],false,false,false)") === "" && A.ev("mmTapGate(weekData.tasks[0])") === false
    && B.ev("mmCardRow(weekData.tasks[0],false,false,false)") === "" && B.ev("mmTapGate(weekData.tasks[0])") === false);
  ok("the Sunday list: identical", J(A.ev('lrBuildList({today:"' + TODAY + '"})')) === J(B.ev('lrBuildList({today:"' + TODAY + '"})')));
  ok("the family row (famRowHTML): identical", A.ev("famRowHTML(weekData.tasks[0],false,'andrew')") === B.ev("famRowHTML(weekData.tasks[0],false,'andrew')"));
  ok("mmTick: identical signature", A.ev("mmTick()") === B.ev("mmTick()"));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
