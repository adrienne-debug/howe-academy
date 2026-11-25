/*
 * 🏡 HHHOME — a household's one page is "My Day" (her words 2026-11-24: "the mom's day, but it wouldn't be called mom's day for
 * her. Maybe my day"; "instead of this being called Howe Academy, this would be Howe Household"; her "Yes, start step 3" —
 * slice 3 of DESIGN_household_edition_2026-11-24.md §5.3).
 *
 * Runs the WHOLE app (test_fixtures/demo_week_sandbox.js) on the made-up demo family and on a made-up household, and checks:
 *   0. the block, and stripHome() undoing the slice place by place (the "app before" = this tree with the slice taken out — no git)
 *   1. EVERY OTHER FAMILY IS UNCHANGED: the demo family opens where it opened, every Mom's Day page, the door and the banner's
 *      date line are byte for byte the same, and so are its database writes
 *   2. the app's name: a family file's appName is on the header, the browser tab and the sign-in card; none = Howe Academy
 *   3. a household opens on My Day; the Schedule tab is never where it lands; no top tab bar (the rule + the class)
 *   4. "My Day", not "Mom's Day": the banner on every page, the door, the ← pill, the household's own pages; the date line has no
 *      school week number and no "no school"
 *   5. 🗓 Schedule is the month calendar: no Today / Week chips, no who row, never the kids' schedule page
 *
 *   run:  node test_household_my_day.js
 */
const fs = require("fs"), path = require("path"), os = require("os"), vm = require("vm");
const SB = require(path.join(__dirname, "test_fixtures", "demo_week_sandbox.js"));
const FX = JSON.parse(fs.readFileSync(path.join(__dirname, "test_fixtures", "living_demo_family.json"), "utf8"));
const INDEX = path.join(__dirname, "index.html");
const src = fs.readFileSync(INDEX, "utf8");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + (typeof extra === "string" ? extra : JSON.stringify(extra)).slice(0, 500) + ")" : "")); }
}
const clone = v => JSON.parse(JSON.stringify(v));

// ── 0. the slice, and the app before it ────────────────────────────────────────────────────────────────────────
// Every place the slice added or changed, as [what, the text now, the text before]. stripHome puts each "before" back and insists
// every one matches exactly once — a later change to one of these places fails here, by name, instead of passing blind.
const SLICE = [
  ["css",
   "body.hh-home #nav-tabs{display:none!important}   /* 🏡 HHHOME (2026-11-24): a household has one page, My Day — no top tab bar */\nbody.kioskd #app-header,body.kioskd #nav-tabs,body.kioskd #sched-subtabs,",
   "body.kioskd #app-header,body.kioskd #nav-tabs,body.kioskd #sched-subtabs,"],
  ["header name",
   "  if(m&&el){ el.textContent=\"The \"+m[1]+\" Family\"; } }catch(e){} })();   // NAVSTACK: the line keeps its height either way\n// 🏡 HHHOME (her pick 2026-11-24: \"Howe Household with name underneath it\"): a family file's appName is the name on the header and on the browser tab. No appName = Howe Academy, as always.\n(function(){ try{ var a=String((window.HA_FAMILY&&window.HA_FAMILY.appName)||\"\").trim(); if(!a) return; document.title=a; var t=document.querySelector(\"#app-header .header-title\"), i=a.indexOf(\" \"); if(!t) return; t.textContent=(i<0?a:a.slice(0,i+1)); if(i>=0){ var sp=document.createElement(\"span\"); sp.textContent=a.slice(i+1); t.appendChild(sp); } }catch(e){} })();\n",
   "  if(m&&el){ el.textContent=\"The \"+m[1]+\" Family\"; } }catch(e){} })();   // NAVSTACK: the line keeps its height either way\n"],
  ["block",
   "// HHHOME_START — 🏡 a household's one page is \"My Day\" (her words 2026-11-24: \"the mom's day, but it wouldn't be called mom's day for her.\n// Maybe my day\"; \"instead of this being called Howe Academy, this would be Howe Household\"; her \"Yes, start step 3\" 2026-11-24 —\n// slice 3 of DESIGN_household_edition_2026-11-24.md §5.3). For a household (a family file with kind household) only — every call site is marked 🏡 HHHOME:\n//   · the app opens on Mom's Day's Home Base and draws no top tab bar; every way back to the Schedule tab lands there too;\n//   · \"Mom's Day\" reads \"My Day\" on its banner, its door, the ← return pill and the wording inside the household's own pages;\n//   · 🗓 Schedule is the month calendar (no Today — that is the kids' schedule page — and no Week, which walks school weeks);\n//   · the banner's date line drops the school week number and \"no school\".\n// The app's name (header, browser tab, sign-in card) comes from the family file's appName for ANY family that has one.\n// Kiosk links (?kiosk=…) are not touched. No database reads or writes.\nfunction haAppName(){ try{ const a=String((window.HA_FAMILY&&window.HA_FAMILY.appName)||\"\").trim(); if(a) return a; }catch(e){} return \"Howe Academy\"; }\nfunction haDay(curly){ return ((typeof HA_HOUSEHOLD!==\"undefined\")&&HA_HOUSEHOLD)?\"My Day\":(curly?\"Mom\\u2019s Day\":\"Mom's Day\"); }   // each call site keeps the apostrophe it always had\nfunction haHome(){ return (typeof HA_HOUSEHOLD!==\"undefined\")&&HA_HOUSEHOLD&&!(_kiosk()||_kioskR()||_kioskD()||_kioskK()); }\n// HHHOME_END\n// AREAS_START",
   "// AREAS_START"],
  ["boot",
   "if(_kioskK()){ tab=\"kids\"; document.body.classList.add(\"kioskd\"); }\nif(typeof haHome===\"function\"&&haHome()){ tab=\"moms-plan\"; document.body.classList.add(\"hh-home\"); try{ const mb=document.getElementById(\"md-back\"); if(mb) mb.textContent=\"\\u2190 \\u{1F3E1} \"+haDay(); }catch(e){} }   // 🏡 HHHOME: a household opens on My Day, with no top tab bar\n",
   "if(_kioskK()){ tab=\"kids\"; document.body.classList.add(\"kioskd\"); }\n"],
  ["showTab",
   "  if(typeof envSiteTabGate===\"function\"&&envSiteTabGate(t)) return;   // 🌿 ENVSITE: the Envirothon site has one page — every tap lands on it; false for every other family\n  if(t===\"schedule\"&&typeof haHome===\"function\"&&haHome()) t=\"moms-plan\";   // 🏡 HHHOME: a household has no Schedule tab — every way back to it lands on My Day\n",
   "  if(typeof envSiteTabGate===\"function\"&&envSiteTabGate(t)) return;   // 🌿 ENVSITE: the Envirothon site has one page — every tap lands on it; false for every other family\n"],
  ["banner name",
   "margin-bottom:2px\">🏡 ${(typeof haDay===\"function\")?haDay():\"Mom's Day\"}</div>",
   "margin-bottom:2px\">🏡 Mom's Day</div>"],
  ["date line",
   "  const hh=(typeof HA_HOUSEHOLD!==\"undefined\")&&HA_HOUSEHOLD;   // 🏡 HHHOME: a household's date line has no school week number and no \"no school\"\n  return esc(line)+((wn&&!hh)?' · Week '+wn:'')+(brk?' · '+esc(brk.name||'Break')+(hh?'':' — no school'):'');",
   "  return esc(line)+(wn?' · Week '+wn:'')+(brk?' · '+esc(brk.name||'Break')+' — no school':'');"],
  ["door",
   "font-weight:700;margin:6px 0 2px\">'+(typeof haDay===\"function\"?haDay(1):\"Mom\\u2019s Day\")+'</div>'",
   "font-weight:700;margin:6px 0 2px\">Mom\\u2019s Day</div>'"],
  ["hq sub",
   "Everything else is on the '+(typeof haDay===\"function\"?haDay(1):\"Mom\\u2019s Day\")+' tabs now.'",
   "Everything else is on the Mom\\u2019s Day tabs now.'"],
  ["hq banner",
   "mwBanner(((typeof areaOn!==\"function\")||areaOn(\"school\"))?'Alerts, Generate Week, links and doors':'Alerts, links and doors')",
   "mwBanner('Alerts, Generate Week, links and doors')"],
  ["now empty",
   "Nothing waiting on you right now'+(((typeof areaOn!==\"function\")||areaOn(\"school\"))?' — school is on the schedule below.':'.')+' 🎉</div>';",
   "Nothing waiting on you right now — school is on the schedule below. 🎉</div>';"],
  ["home base tip",
   "function hbTipHTML(){\n  if(typeof haHome===\"function\"&&haHome()) return \"\";   // 🏡 HHHOME: the tip explains the red number on the Mom's Day TAB — a household has no tab bar, so no red number\n",
   "function hbTipHTML(){\n"],
  ["laundry",
   "'Then it shows on '+(typeof haDay===\"function\"?haDay():\"Mom's Day\")+' so nothing sits and sours')",
   "'Then it shows on Mom\\'s Day so nothing sits and sours')"],
  ["kitchen word",
   "What your family calls it. The calendar, '+(typeof haDay===\"function\"?haDay(1):\"Mom\\u2019s Day\")+', the week list",
   "What your family calls it. The calendar, Mom’s Day, the week list"],
  ["kitchen prep",
   "These pop into 🔴 NOW on '+(typeof haDay===\"function\"?haDay():\"Mom's Day\")+' when the meal is planned.</div>';",
   "These pop into 🔴 NOW on Mom\\'s Day when the meal is planned.</div>';"],
  ["kitchen order",
   "' — it pops onto '+(typeof haDay===\"function\"?haDay():\"Mom's Day\")+' every '+cap(kitSettings.orderDay)+'.':' — pick an order day above to surface it on '+(typeof haDay===\"function\"?haDay():\"Mom's Day\")+'.')",
   "' — it pops onto Mom\\'s Day every '+cap(kitSettings.orderDay)+'.':' — pick an order day above to surface it on Mom\\'s Day.')"],
  ["symptoms",
   "tap symptom chips on '+(typeof haDay===\"function\"?haDay():\"Mom's Day\")+' as they happen.</div>'",
   "tap symptom chips on Mom\\'s Day as they happen.</div>'"],
  ["sign-in",
   "Sign in to '+((typeof haAppName===\"function\")?haAppName():\"Howe Academy\")+'</div>'+",
   "Sign in to Howe Academy</div>'+"],
  ["sch mode",
   "function mpSchModeGet(){ if((typeof HA_HOUSEHOLD!==\"undefined\")&&HA_HOUSEHOLD) return \"month\";   /* 🏡 HHHOME */ if(mpSchMode) return mpSchMode;",
   "function mpSchModeGet(){ if(mpSchMode) return mpSchMode;"],
  ["sch set",
   "function mpSchSet(v){ if((typeof HA_HOUSEHOLD!==\"undefined\")&&HA_HOUSEHOLD) v=\"month\";   /* 🏡 HHHOME: a household's Schedule is the month calendar */ mpSchMode=",
   "function mpSchSet(v){ mpSchMode="],
  ["sch chips",
   "  const _hh=(typeof HA_HOUSEHOLD!==\"undefined\")&&HA_HOUSEHOLD;   // 🏡 HHHOME: a household's Schedule is the month calendar — no Today · Week · Month chips, no who row\n  if(!_hh)   // 🏡 HHHOME\n  h+='<div style=\"display:flex;gap:8px;padding:12px 12px 0;max-width:520px;margin:0 auto\">'+tb('today',",
   "  h+='<div style=\"display:flex;gap:8px;padding:12px 12px 0;max-width:520px;margin:0 auto\">'+tb('today',"],
  ["sch who",
   "  if(!_hh)   // 🏡 HHHOME\n  h+='<div style=\"display:flex;gap:6px;flex-wrap:wrap;justify-content:center;padding:10px 12px 0\">'+wb('mom',",
   "  h+='<div style=\"display:flex;gap:6px;flex-wrap:wrap;justify-content:center;padding:10px 12px 0\">'+wb('mom',"],
  ["seasons bar",
   "margin:0 auto\">'+(((typeof HA_HOUSEHOLD!==\"undefined\")&&HA_HOUSEHOLD)?'':tb('today','\\u{1F4C6} Today')+tb('week','\\u{1F5D3} Week'))+tb('month','\\u{1F5D3} Month')+'</div>'+mpSeasonsPill(true);",
   "margin:0 auto\">'+tb('today','\\u{1F4C6} Today')+tb('week','\\u{1F5D3} Week')+tb('month','\\u{1F5D3} Month')+'</div>'+mpSeasonsPill(true);"],
  ["cal banner",
   "mode===\"month\"?(((typeof HA_HOUSEHOLD!==\"undefined\")&&HA_HOUSEHOLD)?'Events and dinners \\u2014 tap a day':'Breaks, co-ops, events and dinners \\u2014 tap a day')",
   "mode===\"month\"?'Breaks, co-ops, events and dinners \\u2014 tap a day'"]
];
function stripHome(s) {
  SLICE.forEach(([what, now, before]) => {
    const n = s.split(now).length - 1;
    if (n !== 1) throw new Error("stripHome: \"" + what + "\" matched " + n + " times");
    s = s.replace(now, () => before);
  });
  return s;
}
console.log("0. the slice, and the app before it");
const BLOCK = src.slice(src.indexOf("// HHHOME_START"), src.indexOf("// HHHOME_END"));
ok("HHHOME_START / _END once each, right before the AREAS block", src.split("// HHHOME_START").length === 2 && src.split("// HHHOME_END").length === 2 && src.indexOf("// HHHOME_END\n// AREAS_START") > 0);
ok("the block cites her words, her yes, the date and the design", /Maybe my day/.test(BLOCK) && /Howe Household/.test(BLOCK) && /Yes, start step 3/.test(BLOCK) && /2026-11-24/.test(BLOCK) && /DESIGN_household_edition_2026-11-24\.md/.test(BLOCK));
ok("the block reads and writes nothing (no db, no storage, no dialog)", !/db\.ref|HA_LS|\.set\(|\.update\(|alert\(|confirm\(|prompt\(/.test(BLOCK.replace(/^\s*\/\/.*$/gm, "")));
let BEFORE = "";
try { BEFORE = stripHome(src); } catch (e) { ok("stripHome runs (" + SLICE.length + " places)", false, String(e)); }
const TRACE = /HHHOME|haAppName|haDay\(|haHome\(|hh-home|appName|Howe Household/;
ok("stripped: no trace of the slice left", !!BEFORE && !TRACE.test(BEFORE), (BEFORE.match(new RegExp("[^\\n]{0,60}(" + TRACE.source + ")[^\\n]{0,40}")) || [""])[0]);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "hhhome-"));
const INDEX_BEFORE = path.join(TMP, "index.html");
fs.writeFileSync(INDEX_BEFORE, BEFORE || src);

// ── worlds ─────────────────────────────────────────────────────────────────────────────────────────────────────
const AT = new Date("2026-11-24T14:00:00").getTime();   // a Tuesday afternoon
const FB = { apiKey: "x", authDomain: "x.local", databaseURL: "https://x.local", projectId: "x" };
const HH = { familyId: "hh_check", familyName: "Check Family", appName: "Howe Household", kind: "household", roster: [], firebase: FB };
const LAZY = ["house.js", "seasons.js", "gifts.js", "bigmeal.js"];
const VIEWS = ["plan", "hq", "gen", "cal", "house", "chores", "meals", "grocery", "prep", "budget", "gifts", "esa", "seasons", "weigh", "curr", "sset", "hist", "wins", "scor", "mhq", "dad", "dadcal", "dadall"];
const HOME = ["plan", "hq", "cal", "house", "meals", "grocery", "prep", "budget", "gifts", "seasons", "weigh", "sset"];   // every page a household can open
async function world(family, tree, o) {
  o = o || {};
  const clock = SB.makeClock(o.at || AT); clock.boot = clock.now; const sched = SB.makeScheduler(clock);
  const db = SB.makeDb(clone(tree || {}), clock, sched);
  const d = SB.bootDevice({ name: "A", dev: "devA", db, clock, sched, family, indexPath: o.index || INDEX, globals: o.globals });
  d.bootTab = d.get("tab");
  d.momOn(); await sched.run(clock.now + 30000);
  LAZY.forEach(f => vm.runInContext(fs.readFileSync(path.join(__dirname, f), "utf8"), d.ctx, { filename: f }));
  d.db = db; d.clock = clock; d.sched = sched;
  d.page = (v, mode) => { d.run("__HARNESS_NO_RENDER=false; mpSubView=" + JSON.stringify(v) + "; if(typeof mpSchMode!=='undefined') mpSchMode=" + JSON.stringify(mode || "week") + "; tab='moms-plan'; __el={innerHTML:''}; try{ renderMomsPlan(__el); } finally { __HARNESS_NO_RENDER=true; }"); return String(d.get("__el.innerHTML") || ""); };
  d.errors = () => sched.errors.map(e => e.err).concat(d.logs.filter(l => /^error /.test(l)));
  VIEWS.forEach(v => { try { d.page(v); } catch (e) {} }); await sched.run(clock.now + 6000);   // lazy pages have their data — a page now draws the same every time
  return d;
}
const text = h => h.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, "|");
const MOMS = /Mom(?:'|’|&#39;)s Day/;

(async () => {
  // ── 1. every other family is unchanged ─────────────────────────────────────────────────────────────────────
  console.log("1. every other family: this tree == the tree with the slice taken out");
  const demo = await world(FX.family, FX.db), was = await world(FX.family, FX.db, { index: INDEX_BEFORE });
  ok("it opens where it opened (the Schedule tab), and is not a household home", demo.bootTab === "schedule" && was.bootTab === "schedule" && demo.run("haHome()") === false);
  { const diff = VIEWS.filter(v => demo.page(v) !== was.page(v)); ok("all " + VIEWS.length + " Mom's Day pages are byte for byte the pages before (Week)", diff.length === 0, diff); }
  { const diff = ["cal", "seasons"].filter(v => demo.page(v, "month") !== was.page(v, "month")); ok("🗓 Schedule ▸ Month and Seasons & Events too", diff.length === 0, diff); }
  ok("the door, the banner's date line and the saved Schedule mode are the same", demo.run("momGateHTML()") === was.run("momGateHTML()") && demo.run("mdBannerDateLine()") === was.run("mdBannerDateLine()") && /Week \d/.test(demo.run("mdBannerDateLine()")) && demo.run("mpSchMode=null; mpSchModeGet()") === was.run("mpSchMode=null; mpSchModeGet()"));
  ok("its pages still say Mom's Day", MOMS.test(demo.page("plan")) && demo.run("haDay()") === "Mom's Day" && demo.run("haDay(1)") === "Mom’s Day");
  ok("showTab('schedule') still goes to the Schedule tab", (() => { demo.run("showTab('moms-plan'); showTab('schedule');"); return demo.get("tab") === "schedule"; })());
  ok("the same database writes (" + demo.db.log.length + ")", JSON.stringify(demo.db.log.map(w => (w.op + " " + w.path).replace(/^(\w+ connDiary\/[^/]+\/)[^/]+/, "$1*"))) === JSON.stringify(was.db.log.map(w => (w.op + " " + w.path).replace(/^(\w+ connDiary\/[^/]+\/)[^/]+/, "$1*"))));
  ok("no error on either", demo.errors().length === 0 && was.errors().length === 0, demo.errors().slice(0, 2));
  { const brk = { calendar: { holidays: { h1: { name: "Fall Break", from: "2026-11-23", to: "2026-11-27" } } } };
    const a = await world(FX.family, Object.assign(clone(FX.db), { calendar: Object.assign({}, clone(FX.db).calendar || {}, brk.calendar) })), b = await world(FX.family, Object.assign(clone(FX.db), { calendar: Object.assign({}, clone(FX.db).calendar || {}, brk.calendar) }), { index: INDEX_BEFORE });
    ok("on a break day its date line still says “— no school”, as before", a.run("mdBannerDateLine()") === b.run("mdBannerDateLine()") && (/no school/.test(a.run("mdBannerDateLine()")) || a.run("String(!!scheduleBreakToday())") === "false"), a.run("mdBannerDateLine()")); }

  // ── 2. the app's name ──────────────────────────────────────────────────────────────────────────────────────
  console.log("2. the app's name");
  const hh = await world(HH, {});
  ok("a household file with appName: the name is Howe Household", hh.run("haAppName()") === "Howe Household");
  ok("no appName: Howe Academy, as always", demo.run("haAppName()") === "Howe Academy" && (await world({ familyId: "x1", familyName: "X Family", appName: "   ", roster: FX.family.roster, firebase: FB }, {})).run("haAppName()") === "Howe Academy");
  ok("the sign-in card asks the name", /Sign in to '\+\(\(typeof haAppName==="function"\)\?haAppName\(\):"Howe Academy"\)\+'<\/div>/.test(src));
  { // the small script right under the header: header words + browser tab
    const m = src.match(/\n(\(function\(\)\{ try\{ var a=String\(\(window\.HA_FAMILY&&window\.HA_FAMILY\.appName\)[^\n]*)\n/);
    const run = fam => { const kids = []; const t = { textContent: "Howe |Academy", appendChild(c) { kids.push(c); } }; const doc = { title: "Howe Academy", querySelector: s => s === "#app-header .header-title" ? t : null, createElement: () => ({ textContent: "" }) };
      vm.runInNewContext(m ? m[1] : "", { window: { HA_FAMILY: fam }, document: doc, String }); return { title: doc.title, first: t.textContent, span: kids.map(k => k.textContent).join("|") }; };
    const a = run({ appName: "Howe Household" }), b = run({}), c = run({ appName: "Homeplace" });
    ok("header + browser tab: “Howe Household” → Howe + Household (the second word in the header's lighter colour)", !!m && a.title === "Howe Household" && a.first === "Howe " && a.span === "Household", a);
    ok("no appName: the header and the tab are left exactly as the page ships them", b.title === "Howe Academy" && b.first === "Howe |Academy" && b.span === "");
    ok("a one-word name works too", c.title === "Homeplace" && c.first === "Homeplace" && c.span === ""); }
  ok("the page itself still ships as Howe Academy (title and header markup untouched)", src.indexOf("<title>Howe Academy</title>") > 0 && src.indexOf('<div class="header-title">Howe <span>Academy</span></div>') > 0);

  // ── 3. a household opens on My Day ─────────────────────────────────────────────────────────────────────────
  console.log("3. a household opens on My Day");
  ok("it starts on Mom's Day's tab (Home Base), not the Schedule tab", hh.bootTab === "moms-plan" && hh.get("mpSubView") !== undefined && hh.run("haHome()") === true);
  ok("no top tab bar: the rule, and the class the start puts on the page", /body\.hh-home #nav-tabs\{display:none!important\}/.test(src) && /if\(typeof haHome==="function"&&haHome\(\)\)\{ tab="moms-plan"; document\.body\.classList\.add\("hh-home"\);/.test(src));
  ok("every way back to the Schedule tab lands on My Day", (() => { hh.run("showTab('schedule');"); const a = hh.get("tab"); hh.run("tab='moms-plan'; pagesApply({'moms-plan':true});"); return a === "moms-plan" && hh.get("tab") === "moms-plan"; })());
  ok("a kiosk link in a household is not a household home (kiosk links are not touched)", (() => { hh.run("__k=_kioskD; _kioskD=function(){ return true; };"); const v = hh.run("haHome()"); hh.run("_kioskD=__k;"); return v === false; })());
  ok("it started with no error", hh.errors().length === 0, hh.errors().slice(0, 3));

  // ── 4. "My Day" ────────────────────────────────────────────────────────────────────────────────────────────
  console.log("4. My Day, not Mom's Day");
  const hp = {}; HOME.forEach(v => { hp[v] = hh.page(v, "month"); });
  ok("the banner on every page a household opens says 🏡 My Day", HOME.every(v => />🏡 My Day<\/div>/.test(hp[v])), HOME.filter(v => !/>🏡 My Day<\/div>/.test(hp[v])));
  { const left = HOME.filter(v => MOMS.test(text(hp[v]))); ok("none of those pages says “Mom's Day” anywhere", left.length === 0, left.map(v => v + ": " + (text(hp[v]).match(/[^|]{0,50}Mom(?:'|’|&#39;)s Day[^|]{0,30}/) || [""])[0])); }
  ok("the door says My Day", /margin:6px 0 2px">My Day<\/div>/.test(hh.run("momGateHTML()")) && !MOMS.test(hh.run("momGateHTML()")));
  ok("the ← return pill says My Day", hh.run("document.getElementById('md-back').textContent") === "← \u{1F3E1} My Day");
  ok("the date line: the day, no school week number", /^Tuesday, November 24$/.test(hh.run("mdBannerDateLine()")), hh.run("mdBannerDateLine()"));
  { const b = await world(HH, { calendar: { holidays: { h1: { name: "Thanksgiving", from: "2026-11-23", to: "2026-11-27" } } } });
    const line = b.run("mdBannerDateLine()"), on = b.run("String(!!scheduleBreakToday())") === "true";
    ok("on a holiday the date line names it, without “no school”", !/no school/.test(line) && !/Week \d/.test(line) && (!on || /Thanksgiving/.test(line)), line); }
  ok("HQ's line no longer promises Generate Week", /Alerts, links and doors/.test(hp.hq) && !/Generate Week/.test(text(hp.hq)));
  ok("Home Base does not show the tip about the red number on the Mom's Day tab (there is no tab bar); the demo family still gets it", hp.plan.indexOf('id="hb-tip"') < 0 && demo.page("plan").indexOf('id="hb-tip"') > 0);
  ok("Home Base's empty Now line does not mention school", /Nothing waiting on you right now\. 🎉/.test(hp.plan) && !/school is on the schedule/.test(hp.plan));
  ok("the household's own pages use the name (Kitchen's settings and prep notes, Health's symptoms note)", /tap symptom chips on My Day/.test(hp.weigh));

  // ── 5. 🗓 Schedule is the month calendar ───────────────────────────────────────────────────────────────────
  console.log("5. Schedule is the month calendar");
  ok("the mode is month whatever was saved or asked", ["today", "week", "month", null].every(m => { hh.run("mpSchMode=" + JSON.stringify(m) + "; try{ HA_LS.setItem('ha_mp_schmode'," + JSON.stringify(m || "today") + "); }catch(e){}"); return hh.run("mpSchModeGet()") === "month"; }));
  ok("asking for Today never opens the kids' schedule page", (() => { hh.run("tab='moms-plan'; mpSubView='cal'; mpSchSet('today');"); return hh.get("tab") === "moms-plan" && hh.get("momSchedView") === false && hh.get("mpSchMode") === "month"; })());
  const cal = hh.page("cal", "today");
  ok("▸ Schedule draws the month calendar, on Mom's Day's own page", hh.get("mpSubView") === "cal" && /Events and dinners/.test(cal) && cal.length > 2000 && cal === hh.page("cal", "week") && cal === hh.page("cal", "month"));
  ok("no 📆 Today / 🗓 Week / 🗓 Month chips and no 👩 Mom · All · kid row", !/mpSchSet\('today'\)|mpSchSet\('week'\)|mpSchSet\('month'\)/.test(cal) && !/mpSchWhoSet\(/.test(cal));
  ok("the 🎉 Seasons & Events button is there", /id="mp-seasons-pill"/.test(cal));
  { const se = hh.page("seasons", "month"); ok("Seasons & Events: one way back — 🗓 Month — and no Today / Week", /mpSchSet\('month'\)/.test(se) && !/mpSchSet\('today'\)|mpSchSet\('week'\)/.test(se)); }
  ok("the demo family's Schedule still has all three chips and its who row", /mpSchSet\('today'\)/.test(demo.page("cal", "month")) && /mpSchSet\('week'\)/.test(demo.page("cal", "month")) && /mpSchWhoSet\(/.test(demo.page("cal", "month")));
  ok("a household: no error from any of it, and nothing written but the start-up diary and its code-version note", hh.errors().length === 0 && hh.db.log.every(w => /^(connDiary|settings\/codeVersion|_debug)/.test(w.path)), [hh.errors().slice(0, 2), [...new Set(hh.db.log.map(w => w.path.split("/").slice(0, 2).join("/")))]]);

  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) {}
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error("test crashed:", e && e.stack || e); process.exit(1); });
