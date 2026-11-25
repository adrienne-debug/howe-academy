/*
 * 🧩 AREAS — switches for the areas inside Mom's Day, and ⚙️ Settings' home under 🏡 Home Base (her ask 2026-11-24: "build this
 * in a way where we could just turn off those other areas"; her "Every family" 2026-11-24 for the Settings chip — slice 2 of
 * DESIGN_household_edition_2026-11-24.md §5.2).
 *
 * Runs the WHOLE app (test_fixtures/demo_week_sandbox.js) on the made-up demo family and on a made-up household, and checks:
 *   0. the block, and stripAreas() undoing the slice line by line (the "app before" = this tree with the slice taken out — no git)
 *   1. the starting switches: every area ON for an ordinary family; a household starts with School, Chores & Stars, Dad's Day
 *      and Kids' Corner off
 *   2. WHAT EVERY FAMILY SEES CHANGE — only Settings: a ⚙️ Settings chip on Home Base's row, and the Settings page lit under
 *      Home Base. Every other Mom's Day page is byte for byte the page before; the same database writes
 *   3. each switch, turned off from the dashboard's side (one write to settings/pages/<area>): its tab leaves the menu row, its
 *      pages fall back to Home Base, its HQ rows / Home Base cards / way in go — and come back when it is turned on again
 *   4. the app itself never writes a switch; a kiosk link is not stopped; a page open when its switch goes off → Home Base
 *   5. a household: no 🎓 School tab, no Chores & Stars, no Dad's Day or Generate Week on HQ, no kid cards — and Settings is there
 *
 *   run:  node test_area_switches.js
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
// Every line the slice added or changed, as [what, the line(s) now, the line(s) before]. stripAreas puts each "before" back and
// insists every one matches exactly once — so a later change to one of these lines fails here, by name, instead of passing blind.
const SLICE = [
  ["block + defaults",
   "// AREAS_START — 🧩 switches for the areas INSIDE Mom's Day (her ask 2026-11-24: \"build this in a way where we could just turn off those\n// other areas\"; her \"Every family\" 2026-11-24 for the Settings chip — slice 2 of DESIGN_household_edition_2026-11-24.md §5.2). Same\n// home as the top-tab switches: settings/pages/<area> = true|false, set from Adrienne's families dashboard, one listener, one saved\n// copy (ha_pages). Every area starts ON for every family, so nothing changes until a switch is turned off — and an area nobody has\n// set is not written into the saved copy either, so a family with no switch set stores exactly what it stored before; a household\n// (HHKIND) starts with School, Chores & Stars and Dad's Day off, and Kids' Corner off. A switch that is off takes away: the area's\n// tab on Mom's Day's menu row, its HQ rows, its way in from other pages (the page falls back to Home Base), and — for School and\n// Chores & Stars — their cards on Home Base. It does NOT stop what the area does elsewhere (a kid's chores, stars, the week build),\n// and kiosk links (?kiosk=…) ignore it, as they ignore the top-tab switches. Every call site is marked 🧩 AREAS.\n// Settings' one home is 🏡 Home Base ▸ ⚙️ Settings for every family (it only had a chip under 🎓 School, which a home with School\n// off would lose); the School chip and HQ still jump to it.\nconst AREA_KEYS=[\"household\",\"chores\",\"kitchen\",\"school\",\"budget\",\"health\",\"dad\",\"seasons\"];\nconst AREA_LABEL={household:\"Household\",chores:\"Chores & Stars\",kitchen:\"Kitchen\",school:\"School\",budget:\"Budget\",health:\"Health\",dad:\"Dad's Day\",seasons:\"Seasons & Events\"};\nconst AREA_OFF_HOUSEHOLD=[\"school\",\"chores\",\"dad\"];\nconst AREA_VIEWS={house:[\"household\"],chores:[\"household\",\"chores\"],meals:[\"kitchen\"],grocery:[\"kitchen\"],prep:[\"kitchen\"],curr:[\"school\"],hist:[\"school\"],wins:[\"school\"],scor:[\"school\"],mhq:[\"school\"],gen:[\"school\"],\n  budget:[\"budget\"],gifts:[\"budget\"],esa:[\"budget\"],weigh:[\"health\"],dad:[\"dad\"],dadcal:[\"dad\"],dadall:[\"dad\"],dadmast:[\"dad\"],dadgifts:[\"dad\"],seasons:[\"seasons\"]};   // Mom's Day page → the area(s) that must be on\nfunction areaHome(){ return (typeof HA_HOUSEHOLD!==\"undefined\")&&HA_HOUSEHOLD; }\nfunction areaDefaults(d){ if(areaHome()) d.kids=false; return d; }   // the top-tab starting values: a household starts with Kids' Corner off too\nfunction areaOn(k){ if(AREA_KEYS.indexOf(k)<0) return true; const v=PAGES[k]; return (v===true||v===false)?v:!(areaHome()&&AREA_OFF_HOUSEHOLD.indexOf(k)>=0); }   // set from the dashboard, else its starting value\nfunction areaViewOn(v){ const a=AREA_VIEWS[v]; return !a||a.every(areaOn); }\n// AREAS_END\nconst PAGE_DEFAULT=(function(){ const howe=!(window.HA_FAMILY&&window.HA_FAMILY.familyId&&window.HA_FAMILY.familyId!==\"howe\"); const d={}; PAGE_KEYS.forEach(k=>{ d[k]=k!==\"helpers\"&&(howe||k===\"moms-plan\"||k===\"kids\"); }); return (typeof areaDefaults===\"function\")?areaDefaults(d):d; })();",
   "const PAGE_DEFAULT=(function(){ const howe=!(window.HA_FAMILY&&window.HA_FAMILY.familyId&&window.HA_FAMILY.familyId!==\"howe\"); const d={}; PAGE_KEYS.forEach(k=>{ d[k]=k!==\"helpers\"&&(howe||k===\"moms-plan\"||k===\"kids\"); }); return d; })();"],
  ["pagesApply",
   "  try{ if(!kiosk&&typeof mpSubView!==\"undefined\"&&!areaViewOn(mpSubView)) mpSubView=\"plan\"; }catch(e){}   // 🧩 AREAS: the open Mom's Day page was just switched off → Home Base\n  if(!kiosk&&!pageOn(tab)) showTab(\"schedule\"); else if(soon) renderAllSoon(); else renderAll();",
   "  if(!kiosk&&!pageOn(tab)) showTab(\"schedule\"); else if(soon) renderAllSoon(); else renderAll();"],
  ["subnav helper",
   "function mpSubnav(active){\n  const _ao=k=>(typeof areaOn!==\"function\")||areaOn(k);   // 🧩 AREAS: a tab whose area is off is not drawn\n",
   "function mpSubnav(active){\n"],
  ["subnav home",
   "  const home=(active==='plan'||active==='hq'||active==='gen'||active==='sset'), house=(active==='house'||active==='chores'), hlth=(active==='weigh');",
   "  const home=(active==='plan'||active==='hq'||active==='gen'), house=(active==='house'||active==='chores'), hlth=(active==='weigh');"],
  ["subnav tabs",
   "${hbtn}${btn('cal','🗓 Schedule')}${_ao('household')?hsbtn:''}${_ao('kitchen')?kbtn:''}${_ao('school')?sbtn:''}${_ao('budget')?gbtn:''}${_ao('health')?hlbtn:''}</div>${sub}</div>`;",
   "${hbtn}${btn('cal','🗓 Schedule')}${hsbtn}${kbtn}${sbtn}${gbtn}${hlbtn}</div>${sub}</div>`;"],
  ["home row",
   "  if(active==='plan'||active==='hq'||active==='gen'||active==='sset') return `<div id=\"mp-home-row\" class=\"mp-sub\">${chip(active==='plan',\"mpGoto('plan')\",'🏡 Today')}${chip(active==='hq'||active==='gen',\"mpGoto('hq')\",'🗺 HQ')}${chip(active==='sset',\"mpGoto('sset')\",'⚙️ Settings')}</div>`;   // 🧩 AREAS: ⚙️ Settings' home, every family",
   "  if(active==='plan'||active==='hq'||active==='gen') return `<div id=\"mp-home-row\" class=\"mp-sub\">${chip(active==='plan',\"mpGoto('plan')\",'🏡 Today')}${chip(active!=='plan',\"mpGoto('hq')\",'🗺 HQ')}</div>`;"],
  ["house row",
   "${chip(active==='house',\"mpGoto('house')\",'🧹 Household')}${((typeof areaOn!==\"function\")||areaOn('chores'))?chip(active==='chores',\"mpGoto('chores')\",'⭐ Chores & Stars'):''}</div>`;",
   "${chip(active==='house',\"mpGoto('house')\",'🧹 Household')}${chip(active==='chores',\"mpGoto('chores')\",'⭐ Chores & Stars')}</div>`;"],
  ["settings top",
   "  const top=mwBanner(MP_SCHOOL_SUBS[key]||'')+mpSubnav(key==='settings'?'sset':key);   // 🧩 AREAS: Settings is lit under 🏡 Home Base",
   "  const top=mwBanner(MP_SCHOOL_SUBS[key]||'')+mpSubnav(key);"],
  ["school open",
   "  if(t!=='settings') mpSchoolNote(t);   // 🧩 AREAS: Settings is a jump to Home Base, not School's last page\n  const v=mpSchoolSub(t);\n  if(v){ if(t==='curriculum')",
   "  mpSchoolNote(t);\n  const v=mpSchoolSub(t);\n  if(v){ if(t==='curriculum')"],
  ["school last",
   "function mpSchoolLast(){ let v=null; try{ v=HA_LS.getItem('ha_mp_school'); }catch(e){} return (MP_SCHOOL.indexOf(v)>=0&&v!=='settings')?v:'notebook'; }",
   "function mpSchoolLast(){ let v=null; try{ v=HA_LS.getItem('ha_mp_school'); }catch(e){} return MP_SCHOOL.indexOf(v)>=0?v:'notebook'; }"],
  ["seasons pill",
   "function mpSeasonsPill(on,pad){\n  if(typeof areaOn===\"function\"&&!areaOn(\"seasons\")) return '';   // 🧩 AREAS\n",
   "function mpSeasonsPill(on,pad){\n"],
  ["hq generate",
   "    ((typeof areaOn!==\"function\")||areaOn(\"school\"))?_hqRow(\"generate\",\"🪄\",\"Generate Week\",\"Notebooks, week JSON — the week builds itself; change it in 📅 This week\"):\"\",   // GWGONE · 🧩 AREAS",
   "    _hqRow(\"generate\",\"🪄\",\"Generate Week\",\"Notebooks, week JSON — the week builds itself; change it in 📅 This week\"),   // GWGONE"],
  ["hq dad",
   "    ((typeof areaOn!==\"function\")||areaOn(\"dad\"))?_hqRow(\"dadsday\",\"👨\",\"Dad's Day\",\"His own checklist plus bills, laundry, dinner and the kids\"):\"\",   // 🧩 AREAS",
   "    _hqRow(\"dadsday\",\"👨\",\"Dad's Day\",\"His own checklist plus bills, laundry, dinner and the kids\"),"],
  ["hq group",
   "function _hqGroup(emoji,title,rows){\n  if(!rows.join('')) return '';   // 🧩 AREAS: a group with no row left draws no heading\n",
   "function _hqGroup(emoji,title,rows){\n"],
  ["page guard",
   "function renderMomsPlanView(el){\n  mpInit();\n  if(typeof areaViewOn===\"function\"&&!areaViewOn(mpSubView)&&!(typeof _kioskD===\"function\"&&_kioskD())) mpSubView='plan';   // 🧩 AREAS: an area that is off has no page — Home Base (asked before the Mom door)\n",
   "function renderMomsPlanView(el){\n  mpInit();\n"],
  ["kids open",
   "  const _arS=(typeof areaOn!==\"function\")||areaOn(\"school\"), _arK=_arS||areaOn(\"chores\");   // 🧩 AREAS: 🧒 Kids + 🧾 Check-offs go when School AND Chores & Stars are off; 🤝 Together + 📓 Word banks with School\n  if(_arK){   // 🧩 AREAS\n  h+=_ss('kids','🧒 Kids');   // STICKYSTACK\n",
   "  h+=_ss('kids','🧒 Kids');   // STICKYSTACK\n"],
  ["kids close + together",
   "  try{ h+=mdCardCheckLog(); }catch(e){}   // 🧾 Today's check-offs · −100\n  }   // 🧩 AREAS\n  if(_arS){   // 🧩 AREAS\n  h+=_ss('together','🤝 Together');   // STICKYSTACK\n  try{ h+=mdCardTogether(); }catch(e){}   // 🤝 Together\n  }   // 🧩 AREAS\n",
   "  try{ h+=mdCardCheckLog(); }catch(e){}   // 🧾 Today's check-offs · −100\n  h+=_ss('together','🤝 Together');   // STICKYSTACK\n  try{ h+=mdCardTogether(); }catch(e){}   // 🤝 Together\n"],
  ["banks",
   "  if(_arS){   // 🧩 AREAS\n  h+=_ss('banks','📓 Word banks');   // STICKYSTACK\n  try{ h+=nbBankLowAlertHTML(); }catch(e){}   // 📓 a notebook word bank about to run out of unused words\n  }   // 🧩 AREAS\n",
   "  h+=_ss('banks','📓 Word banks');   // STICKYSTACK\n  try{ h+=nbBankLowAlertHTML(); }catch(e){}   // 📓 a notebook word bank about to run out of unused words\n"]
];
function stripAreas(s) {
  SLICE.forEach(([what, now, before]) => {
    const n = s.split(now).length - 1;
    if (n !== 1) throw new Error("stripAreas: \"" + what + "\" matched " + n + " times");
    s = s.replace(now, () => before);
  });
  return s;
}
console.log("0. the slice, and the app before it");
const BLOCK = src.slice(src.indexOf("// AREAS_START"), src.indexOf("// AREAS_END"));
ok("AREAS_START / _END once each, right before PAGE_DEFAULT", src.split("// AREAS_START").length === 2 && src.split("// AREAS_END").length === 2 && src.indexOf("// AREAS_END\nconst PAGE_DEFAULT=") > 0);
ok("the block cites her ask, her pick, the date and the design", /turn off those/.test(BLOCK) && /Every family/.test(BLOCK) && /2026-11-24/.test(BLOCK) && /DESIGN_household_edition_2026-11-24\.md/.test(BLOCK));
ok("the block writes nothing and asks nothing (no db, no dialog)", !/db\.ref|\.set\(|\.update\(|alert\(|confirm\(|prompt\(/.test(BLOCK.replace(/^\s*\/\/.*$/gm, "")));
ok("no 🔀 anywhere in index.html", src.indexOf("\u{1F500}") < 0);
let BEFORE = "";
try { BEFORE = stripAreas(src); } catch (e) { ok("stripAreas runs (" + SLICE.length + " places)", false, String(e)); }
const TRACE = /AREAS_START|🧩 AREAS|function areaOn|function areaViewOn|areaDefaults|\bAREA_(KEYS|LABEL|OFF_HOUSEHOLD|VIEWS)\b|_arS|_arK|_ao\(|mpGoto\('sset'\)/;   // (a later slice — 🏡 HHHOME — asks areaOn("school") in two lines of its own, behind a typeof guard)
ok("stripped: no trace of the slice left", !!BEFORE && !TRACE.test(BEFORE), (BEFORE.match(new RegExp("[^\\n]{0,60}(" + TRACE.source + ")[^\\n]{0,40}")) || [""])[0]);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "areas-"));
const INDEX_BEFORE = path.join(TMP, "index.html");
fs.writeFileSync(INDEX_BEFORE, BEFORE || src);

// ── worlds ─────────────────────────────────────────────────────────────────────────────────────────────────────
const AT = new Date("2026-11-24T14:00:00").getTime();   // a Tuesday afternoon
const FB = { apiKey: "x", authDomain: "x.local", databaseURL: "https://x.local", projectId: "x" };
const HH = { familyId: "hh_check", familyName: "Check Family", kind: "household", roster: [], firebase: FB };
const LAZY = ["house.js", "seasons.js", "gifts.js", "bigmeal.js"];
const VIEWS = ["plan", "hq", "gen", "cal", "house", "chores", "meals", "grocery", "prep", "budget", "gifts", "esa", "seasons", "weigh", "curr", "sset", "hist", "wins", "scor", "mhq", "dad", "dadcal", "dadall"];
async function world(family, tree, o) {
  o = o || {};
  const clock = SB.makeClock(AT); clock.boot = clock.now; const sched = SB.makeScheduler(clock);
  const db = SB.makeDb(clone(tree || {}), clock, sched);
  const d = SB.bootDevice({ name: "A", dev: "devA", db, clock, sched, family, indexPath: o.index || INDEX });
  d.momOn(); await sched.run(clock.now + 30000);
  LAZY.forEach(f => vm.runInContext(fs.readFileSync(path.join(__dirname, f), "utf8"), d.ctx, { filename: f }));
  d.db = db; d.clock = clock; d.sched = sched;
  d.page = v => { d.run("__HARNESS_NO_RENDER=false; mpSubView=" + JSON.stringify(v) + "; if(typeof mpSchMode!=='undefined') mpSchMode='week'; tab='moms-plan'; __el={innerHTML:''}; try{ renderMomsPlan(__el); } finally { __HARNESS_NO_RENDER=true; }"); return String(d.get("__el.innerHTML") || ""); };
  d.view = () => d.get("mpSubView");
  d.dash = async (k, v) => { db.api("dashboard").ref("settings/pages/" + k).set(v); await sched.run(clock.now + 1500); };   // what Adrienne's families dashboard does
  d.errors = () => sched.errors.map(e => e.err).concat(d.logs.filter(l => /^error /.test(l)));
  VIEWS.forEach(v => { try { d.page(v); } catch (e) {} }); await sched.run(clock.now + 6000);   // chore history, presents, seasons and the Settings cards arrive once — after this a page draws the same every time
  return d;
}
const TABS = { household: "🧹 Household", kitchen: "🍳 Kitchen", school: "🎓 School", budget: "💰 Budget", health: "❤️ Health" };
const menu = h => { const a = h.indexOf('<div id="mp-subnav"'), b = h.indexOf("</div>", h.indexOf('class="mp-row"', a)); return a < 0 ? "" : h.slice(a, b); };   // the top row of Mom's Day's menu
const subrow = h => { const m = h.match(/<div id="mp-(home|house|health|kitchen|school|budget)-row"[\s\S]*?<\/div>/); return m ? m[0] : ""; };
const lit = (h, label) => new RegExp("color:#fff;background:#2B7A78[^>]*>" + label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "<").test(menu(h));
const SETCHIP = /<button onclick="mpGoto\('sset'\)"[^>]*>⚙️ Settings<\/button>/;

(async () => {
  // ── 1. the starting switches ───────────────────────────────────────────────────────────────────────────────
  console.log("1. the starting switches");
  const demo = await world(FX.family, FX.db);
  const AREAS = demo.get("AREA_KEYS");
  ok("eight areas: household, chores, kitchen, school, budget, health, dad, seasons", JSON.stringify(AREAS) === '["household","chores","kitchen","school","budget","health","dad","seasons"]');
  ok("an ordinary family: every area starts ON", AREAS.every(k => demo.run("areaOn('" + k + "')") === true));
  ok("the top-tab switches are the same list as before", JSON.stringify(demo.get("PAGE_KEYS")) === '["notebook","mastery","units","play","moms-plan","kids","purchases","workbooks","eic","helpers"]' && AREAS.every(k => demo.get("PAGE_KEYS").indexOf(k) < 0));
  ok("… and their starting values are what they were (a family that is not Howe: Mom's Day + Kids' Corner)", demo.get("PAGE_KEYS").every(k => demo.run("pageOn('" + k + "')") === (k === "moms-plan" || k === "kids")));
  ok("a name that is not an area is never off", demo.run("areaOn('nope')") === true && demo.run("areaViewOn('plan')") === true && demo.run("areaViewOn('sset')") === true && demo.run("areaViewOn('cal')") === true);
  const hh = await world(HH, {});
  ok("a household starts with School, Chores & Stars and Dad's Day off — the other five on", JSON.stringify(AREAS.filter(k => !hh.run("areaOn('" + k + "')"))) === '["chores","school","dad"]');
  ok("… and Kids' Corner off, Mom's Day on", hh.run("pageOn('kids')") === false && hh.run("pageOn('moms-plan')") === true);

  // ── 2. what every family sees change: only Settings ────────────────────────────────────────────────────────
  console.log("2. every family: only Settings moves");
  const was = await world(FX.family, FX.db, { index: INDEX_BEFORE });
  const now = {}, old = {};
  VIEWS.forEach(v => { now[v] = demo.page(v); old[v] = was.page(v); });
  const same = VIEWS.filter(v => ["plan", "hq", "gen", "sset"].indexOf(v) < 0);
  const diff = same.filter(v => now[v] !== old[v]);
  ok("all switches on: " + same.length + " Mom's Day pages are byte for byte the pages before", diff.length === 0, diff);
  ["plan", "hq", "gen"].forEach(v => ok("Home Base ▸ " + v + ": the page before + ONE ⚙️ Settings chip on its row, nothing else", SETCHIP.test(now[v]) && now[v].replace(SETCHIP, "") === old[v] && (now[v].match(/⚙️ Settings<\/button>/g) || []).length === 1));
  ok("Settings: lit under 🏡 Home Base now (it was lit under 🎓 School)", lit(now.sset, "🏡 Home Base") && !lit(now.sset, "🎓 School") && lit(old.sset, "🎓 School"));
  ok("Settings: Home Base's row under the menu — 🏡 Today · 🗺 HQ · ⚙️ Settings, Settings the lit one", /id="mp-home-row"/.test(subrow(now.sset)) && /🏡 Today<[\s\S]*🗺 HQ<[\s\S]*⚙️ Settings</.test(subrow(now.sset)) && /border:1\.5px solid #2B7A78[^>]*>⚙️ Settings</.test(subrow(now.sset)) && !/border:1\.5px solid #2B7A78[^>]*>🗺 HQ</.test(subrow(now.sset)));
  ok("Settings: below the menu it is the same Settings page as before", now.sset.slice(now.sset.indexOf("</div></div>", now.sset.indexOf('id="mp-subnav"'))).replace(/^[\s\S]*?<div class="rules-wrap">/, "") === old.sset.slice(old.sset.indexOf("</div></div>", old.sset.indexOf('id="mp-subnav"'))).replace(/^[\s\S]*?<div class="rules-wrap">/, ""));
  ok("HQ's chip is the lit one on HQ and Generate Week, Today's on Today (as before)", /border:1\.5px solid #2B7A78[^>]*>🗺 HQ</.test(subrow(now.hq)) && /border:1\.5px solid #2B7A78[^>]*>🗺 HQ</.test(subrow(now.gen)) && /border:1\.5px solid #2B7A78[^>]*>🏡 Today</.test(subrow(now.plan)));
  ok("the School row keeps its ⚙️ Settings chip — a jump to the one home", /mpSchoolOpen\('settings'\)[^>]*>⚙️ Settings</.test(now.curr));
  { demo.run("try{ HA_LS.setItem('ha_mp_school','curriculum'); }catch(e){}; __HARNESS_NO_RENDER=true; mpSchoolOpen('settings');");
    ok("tapping School ▸ ⚙️ Settings opens Settings (Home Base's) and is not remembered as School's last page", demo.view() === "sset" && demo.run("HA_LS.getItem('ha_mp_school')") === "curriculum" && demo.run("mpSchoolLast()") === "curriculum");
    demo.run("HA_LS.setItem('ha_mp_school','settings')");
    ok("a device that had Settings saved as School's last page reopens School on Notebooks", demo.run("mpSchoolLast()") === "notebook"); }
  ok("the same database writes as before (" + demo.db.log.length + ")", JSON.stringify(demo.db.log.map(w => (w.op + " " + w.path).replace(/^(\w+ connDiary\/[^/]+\/)[^/]+/, "$1*"))) === JSON.stringify(was.db.log.map(w => (w.op + " " + w.path).replace(/^(\w+ connDiary\/[^/]+\/)[^/]+/, "$1*"))));
  ok("no error on either", demo.errors().length === 0 && was.errors().length === 0, demo.errors().slice(0, 2));

  // ── 3. each switch ─────────────────────────────────────────────────────────────────────────────────────────
  console.log("3. each switch, off and on again");
  const d = await world(FX.family, FX.db);
  const base = {}; VIEWS.forEach(v => { base[v] = d.page(v); });
  const home = () => d.page("plan");
  const fallsHome = v => { const h = d.page(v); return d.view() === "plan" && h === home(); };
  for (const k of Object.keys(TABS)) {
    await d.dash(k, false);
    const m = menu(home());
    ok(AREAS_LABEL(k) + " off: its tab leaves the menu row, the other four stay", m.indexOf(TABS[k]) < 0 && Object.keys(TABS).filter(x => x !== k).every(x => m.indexOf(TABS[x]) >= 0) && m.indexOf("🏡 Home Base") >= 0 && m.indexOf("🗓 Schedule") >= 0, m.replace(/<[^>]+>/g, "|"));
    const views = Object.keys(d.get("AREA_VIEWS")).filter(v => d.get("AREA_VIEWS")[v].indexOf(k) >= 0);
    ok(AREAS_LABEL(k) + " off: its pages (" + views.join(", ") + ") fall back to Home Base", views.length > 0 && views.every(fallsHome));
    await d.dash(k, true);
    ok(AREAS_LABEL(k) + " on again: its pages are back, byte for byte", views.every(v => d.page(v) === base[v]) && d.page("plan") === base.plan, views.filter(v => d.page(v) !== base[v]));
  }
  function AREAS_LABEL(k) { return d.get("AREA_LABEL")[k]; }
  // School: HQ's Generate Week, Home Base's Together / Word banks
  await d.dash("school", false);
  ok("School off: Generate Week leaves HQ; Dad's Day stays", d.page("hq").indexOf(">Generate Week</span>") < 0 && d.page("hq").indexOf(">Dad's Day</span>") > 0 && base.hq.indexOf(">Generate Week</span>") > 0);
  ok("School off, Chores & Stars on: Home Base keeps 🧒 Kids, loses 🤝 Together", home().indexOf("🧒 Kids") > 0 && home().indexOf("🤝 Together") < 0 && base.plan.indexOf("🤝 Together") > 0);
  ok("School off: the framed-tab chips are gone with the tab (no way in to Notebooks / Mastery / Units from Mom's Day)", home().indexOf("mpSchoolOpen(") < 0);
  await d.dash("chores", false);
  ok("School AND Chores & Stars off: 🧒 Kids leaves Home Base too", home().indexOf("🧒 Kids") < 0 && base.plan.indexOf("🧒 Kids") > 0);
  ok("… the rest of Home Base is still there (My day, Weigh-in, Dinner, Bills)", ["🏡 My day", "⚖️ Weigh-in", "🍽 Dinner", "💳 Bills"].every(l => home().indexOf(l) > 0));
  await d.dash("school", true);
  // Chores & Stars
  ok("Chores & Stars off: its chip leaves Household's row, Household stays", subrow(d.page("house")).indexOf("⭐ Chores & Stars") < 0 && subrow(d.page("house")).indexOf("🧹 Household") > 0 && subrow(base.house).indexOf("⭐ Chores & Stars") > 0);
  ok("Chores & Stars off: its page falls back to Home Base; Household's own page does not", fallsHome("chores") && (() => { const h = d.page("house"), v = d.view(); return v === "house" && h !== home(); })());
  await d.dash("chores", true);
  // Household off takes Chores & Stars with it
  await d.dash("household", false);
  ok("Household off: Chores & Stars (its sub-page) goes with it", fallsHome("chores") && fallsHome("house"));
  await d.dash("household", true);
  // Dad's Day
  await d.dash("dad", false);
  ok("Dad's Day off: its HQ row is gone, Generate Week stays", d.page("hq").indexOf(">Dad's Day</span>") < 0 && d.page("hq").indexOf(">Generate Week</span>") > 0);
  ok("Dad's Day off: his pages fall back to Home Base on Mom's device", ["dad", "dadcal", "dadall"].every(fallsHome));
  d.run("__kd=_kioskD; _kioskD=function(){ return true; };");
  ok("… but Dad's own link (?kiosk=dad) is not stopped", (() => { d.page("dad"); return d.view() === "dad"; })());
  d.run("_kioskD=__kd;");
  await d.dash("dad", true);
  // Seasons & Events
  await d.dash("seasons", false);
  ok("Seasons & Events off: its button leaves 🗓 Schedule, and its page falls back to Home Base", d.page("cal").indexOf("mp-seasons-pill") < 0 && base.cal.indexOf("mp-seasons-pill") > 0 && fallsHome("seasons"));
  ok("… the rest of the Schedule page is the page before, minus that one button", d.page("cal") === base.cal.replace(/<div style="padding:[^"]*;max-width:520px;margin:0 auto"><button id="mp-seasons-pill"[\s\S]*?<\/button><\/div>/, ""));
  await d.dash("seasons", true);
  ok("everything on again: every page is the page it was", VIEWS.every(v => d.page(v) === base[v]), VIEWS.filter(v => d.page(v) !== base[v]));

  // ── 4. who writes, and a page that is open ─────────────────────────────────────────────────────────────────
  console.log("4. who writes a switch, and a page that is open");
  ok("the app itself never wrote a switch — every settings/pages write came from the dashboard's side", d.db.log.filter(w => /^settings\/pages/.test(w.path)).every(w => w.dev === "dashboard") && d.db.log.filter(w => /^settings\/pages/.test(w.path)).length > 0);
  ok("each of those was ONE targeted write, settings/pages/<area>", d.db.log.filter(w => /^settings\/pages/.test(w.path)).every(w => /^settings\/pages\/[a-z]+$/.test(w.path) && w.op === "set"));
  d.run("mpSubView='meals'; tab='moms-plan';"); await d.dash("kitchen", false);
  ok("Kitchen switched off while its Menu is open → the device is on Home Base", d.view() === "plan");
  d.run("mpSubView='weigh'; tab='moms-plan';"); await d.dash("kitchen", true);
  ok("a switch for another area does not move the open page", d.view() === "weigh");
  ok("the saved copy on the device carries the areas the dashboard has set (ha_pages)", /"kitchen":true/.test(d.run("HA_LS.getItem('ha_pages')")));
  ok("a family with no area switch set stores exactly the ten top-tab switches it stored before — nothing more", JSON.stringify(Object.keys(demo.get("PAGES"))) === JSON.stringify(demo.get("PAGE_KEYS")) && JSON.stringify(demo.get("PAGES")) === JSON.stringify(was.get("PAGES")));
  ok("no error from any of it", d.errors().length === 0, d.errors().slice(0, 3));

  // ── 5. a household ─────────────────────────────────────────────────────────────────────────────────────────
  console.log("5. a household");
  const hp = hh.page("plan"), hm = menu(hp);
  ok("its menu row: 🏡 Home Base · 🗓 Schedule · 🧹 Household · 🍳 Kitchen · 💰 Budget · ❤️ Health — no 🎓 School", ["🏡 Home Base", "🗓 Schedule", "🧹 Household", "🍳 Kitchen", "💰 Budget", "❤️ Health"].every(l => hm.indexOf(l) >= 0) && hm.indexOf("🎓 School") < 0, hm.replace(/<[^>]+>/g, "|"));
  ok("Home Base's row: 🏡 Today · 🗺 HQ · ⚙️ Settings", /🏡 Today<[\s\S]*🗺 HQ<[\s\S]*⚙️ Settings</.test(subrow(hp)));
  ok("Home Base: no 🧒 Kids, 🧾 Check-offs, 🤝 Together or 📓 Word banks", ["🧒 Kids", "🧾 Check-offs", "🤝 Together", "📓 Word banks"].every(l => hp.indexOf(l) < 0));
  ok("Home Base: My day, Weigh-in, Dinner and Bills are there", ["🏡 My day", "⚖️ Weigh-in", "🍽 Dinner", "💳 Bills"].every(l => hp.indexOf(l) > 0));
  const hq = hh.page("hq");
  ok("HQ: no Generate Week, no Dad's Day, and no empty 🏫 School / 🧹 Home & Chores heading", hq.indexOf(">Generate Week</span>") < 0 && hq.indexOf(">Dad's Day</span>") < 0 && !/>School<\/div>/.test(hq) && hq.indexOf("Home & Chores") < 0 && demo.page("hq").indexOf(">Generate Week</span>") > 0 && demo.page("hq").indexOf(">Dad's Day</span>") > 0,hq.replace(/<[^>]+>/g, "|").slice(0, 600));
  ok("Household's row: no ⭐ Chores & Stars", subrow(hh.page("house")).indexOf("Chores & Stars") < 0 && subrow(hh.page("house")).indexOf("🧹 Household") > 0);
  ok("School's, Chores & Stars' and Dad's pages all fall back to Home Base", ["curr", "hist", "wins", "scor", "mhq", "gen", "chores", "dad", "dadcal", "dadall"].every(v => { hh.page(v); return hh.view() === "plan"; }));
  const hs = hh.page("sset");
  ok("⚙️ Settings is there, lit under Home Base, with the Kids editor", hh.view() === "sset" && lit(hs, "🏡 Home Base") && /Save Family/.test(hs) && /\+ Add Kid/.test(hs));
  ok("Kitchen, Budget, Health, Schedule and Seasons & Events still open", ["meals", "grocery", "prep", "budget", "gifts", "weigh", "cal", "seasons"].every(v => { const h = hh.page(v); return hh.view() === v && h.length > 200; }) && hh.page("cal").indexOf("mp-seasons-pill") > 0);
  await hh.dash("school", true);
  ok("the dashboard can turn School on for a household: the 🎓 tab is back", menu(hh.page("plan")).indexOf("🎓 School") >= 0);
  await hh.dash("school", null);
  ok("… and with the saved switch removed it is the household's own start again (off)", menu(hh.page("plan")).indexOf("🎓 School") < 0);
  ok("a household: no error", hh.errors().length === 0, hh.errors().slice(0, 3));

  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) {}
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error("test crashed:", e && e.stack || e); process.exit(1); });
