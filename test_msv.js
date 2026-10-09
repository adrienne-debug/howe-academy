/*
 * Node tests — 👩 MSV (her ask 2026-10-08): Mom's Day ▸ 🗓 Schedule ▸ Today IS the Schedule page with Mom mode — day tabs,
 * kid row (👩 Mom first, then All, each kid, helpers), lights, week strip, cards and every Mom tool — with the Mom's Day tabs
 * on top. The 🙋 I-need-Mom card stays on 🏡 Home Base. Leaving (any tab tap) hands back the kid picked before.
 *   run:  node test_msv.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(name) {
  const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}" && --d === 0) return src.slice(i, k + 1); }
}
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const FNS = ["msvEnter", "msvExit", "msvBarHTML", "showTab", "renderKidFilter", "renderSchedSubtabs", "mpSchSet", "mpSchModeGet", "mpGoto"].map(slice).join("\n");
function world(o) {
  o = o || {};
  const log = { renders: 0, mp: 0, scroll: 0 };
  const els = {};
  const el = id => (els[id] = els[id] || { id, style: {}, innerHTML: "", classList: { toggle() {} } });
  const navBtns = ["schedule", "moms-plan", "kids"].map(t => ({ dataset: { tab: t }, active: false, classList: { toggle(c, on) { this._o.active = !!on; }, _o: null } }));
  navBtns.forEach(b => b.classList._o = b);
  const env = {
    ROSTER: ["ava", "ben"], document: { getElementById: el, querySelectorAll: () => navBtns, querySelector: () => null },
    renderAll: () => log.renders++, renderMomsPlan: () => log.mp++, window: { scrollTo: () => log.scroll++ },
    _kiosk: () => false, _kioskR: () => false, _kioskD: () => false, _kioskK: () => false,
    HA_LS: { getItem: () => o.mode || null, setItem() {} }, momModeActive: !!o.momOn, momHere: () => !!o.momOn,
    cap: s => s.charAt(0).toUpperCase() + s.slice(1), helperChipsHTML: () => "<i>helper</i>", bankBalance: () => 0, helperViewActive: () => false,
    mpSubnav: a => "<nav>" + a + "</nav>", helperGiveBtnsHTML: () => o.give || "",
    _mpSchRender: () => log.mp++, _todayDay: "thursday",
  };
  const keys = Object.keys(env);
  const body = "var momSchedView=false,_msvPrevKid=null,kid=" + JSON.stringify(o.kid || "ava") + ",tab='moms-plan',helperView=null,mastAddMode,mastLogMode,mastLogScores,schedShowAdmin=false,schedShowHistory=false,schedShowPace=false,schedShowBoard=false,schedShowPeek=false,mpDay=null,day='thursday',mpSchMode=null,calDaySel=null,mpSubView='cal';\n" + FNS +
    "\nreturn {msvEnter,msvExit,msvBarHTML,showTab,renderKidFilter,renderSchedSubtabs,mpSchSet,mpGoto,st:()=>({msv:momSchedView,kid,tab,prev:_msvPrevKid,mpSubView})};";
  const api = new Function(...keys, body)(...keys.map(k => env[k]));
  return { api, log, els, navBtns };
}
console.log("── enter / leave ──");
{
  const w = world({ kid: "ben", momOn: true });
  w.api.msvEnter();
  ok("enter: Schedule page, Mom view, 👩 Mom picked", w.api.st().msv && w.api.st().tab === "schedule" && w.api.st().kid === "mom");
  ok("…the kid picked before is kept to hand back", w.api.st().prev === "ben");
  ok("…the nav keeps 🏡 Mom's Day lit, not Schedule", w.navBtns.find(b => b.dataset.tab === "moms-plan").active && !w.navBtns.find(b => b.dataset.tab === "schedule").active);
  w.api.showTab("schedule");
  ok("tapping the kids' Schedule tab leaves the Mom view and hands Ben back", !w.api.st().msv && w.api.st().kid === "ben" && w.navBtns.find(b => b.dataset.tab === "schedule").active);
}
{
  const w = world({ kid: "ava" }); w.api.msvEnter(); w.api.showTab("kids");
  ok("any other tab leaves it too", !w.api.st().msv && w.api.st().kid === "ava" && w.api.st().tab === "kids");
  const w2 = world({ kid: "ava" }); w2.api.msvEnter(); w2.api.mpGoto("meals");
  ok("a Mom's Day tab (🍽 Meals) leaves it and opens Mom's Day", !w2.api.st().msv && w2.api.st().tab === "moms-plan" && w2.api.st().mpSubView === "meals");
  const w3 = world({ kid: "ava" }); w3.api.msvEnter(); w3.api.mpSchSet("week");
  ok("🗓 Week goes back to Mom's Day (its week view)", !w3.api.st().msv && w3.api.st().tab === "moms-plan" && w3.api.st().mpSubView === "cal");
  const w4 = world({ kid: "ava" }); w4.api.mpSchSet("today");
  ok("📆 Today from Mom's Day opens the Schedule page", w4.api.st().msv && w4.api.st().tab === "schedule");
}
console.log("\n── the page itself ──");
{
  const w = world({ momOn: true }); w.api.msvEnter(); w.api.renderKidFilter();
  const kf = w.els["kid-filter"].innerHTML, ix = k => kf.indexOf("selKid('" + k + "')");
  ok("kid row: 👩 Mom first, then All, then each kid, helpers last", ix("mom") >= 0 && ix("mom") < ix("all") && ix("all") < ix("ava") && ix("ava") < ix("ben") && kf.indexOf("<i>helper</i>") > ix("ben"));
  w.api.showTab("schedule"); w.api.renderKidFilter();
  const kf2 = w.els["kid-filter"].innerHTML;
  ok("the kids' Schedule keeps its own order (All … Mom last) — step 3 will take Mom off it", kf2.indexOf("selKid('all')") < kf2.indexOf("selKid('mom')"));
}
{
  const w = world({ give: "<b>Give Grandma</b>" }); w.api.msvEnter(); w.api.renderSchedSubtabs();
  const bar = w.els["msv-bar"];
  ok("Mom's Day tabs + Today·Week·Month strip shown above the Schedule", bar.style.display === "block" && /<nav>cal<\/nav>/.test(bar.innerHTML) && /mpSchSet\('today'\)/.test(bar.innerHTML) && /mpSchSet\('month'\)/.test(bar.innerHTML));
  ok("🙋 Give Grandma more rides in that strip", /Give Grandma/.test(bar.innerHTML));
  w.api.showTab("schedule"); w.api.renderSchedSubtabs();
  ok("the kids' Schedule has no strip", bar.style.display === "none" && bar.innerHTML === "");
}
console.log("\n── wiring ──");
{
  ok("the strip's spot sits above the sticky Schedule rows", src.indexOf('<div id="msv-bar"') >= 0 && src.indexOf('<div id="msv-bar"') < src.indexOf('<div id="sched-subtabs"'));
  ok("🙋 I-need-Mom card stays on 🏡 Home Base, not in the Mom view", /if\(day===_todayDay&&momHere\(\)&&!momSchedView\)\{ try\{ const _hr=hrMomCardHTML\(/.test(src));
  ok("Mom's Day ▸ Schedule ▸ Today opens the Schedule page (Week/Month stay on Mom's Day)", /if\(mpSchModeGet\(\)==="today"\)\{   \/\/ 👩 MSV/.test(slice("renderMomsPlanView")) && /return renderMPCalendar\(el\);/.test(slice("renderMomsPlanView")));
  ok("declared early (no use-before-declare at boot)", src.indexOf("var momSchedView=false") >= 0 && src.indexOf("var momSchedView=false") < src.indexOf("function showTab("));
  ok("the MSV pieces write nothing to Firebase", !/db\.ref/.test(slice("msvEnter") + slice("msvExit") + slice("msvBarHTML")));
}
console.log("\n── 🔒 Mom's Day asks for the code once; inside, Mom mode is on ──");
{
  const G = ["momGateOpen", "momGateHTML", "momGateTry"].map(slice).join("\n");
  function gw(o) {
    o = o || {};
    const log = { on: 0, renders: 0 }; const els = { "mg-err": { textContent: "" } };
    const env = { momHere: () => !!o.mom, _kioskD: () => !!o.dadKiosk, pinOk: v => v === "1234", haMomOn: () => log.on++, renderAll: () => log.renders++,
      document: { getElementById: id => els[id] || null }, esc: s => String(s) };
    const keys = Object.keys(env);
    const api = new Function(...keys, "var mpSubView=" + JSON.stringify(o.sub || "plan") + ",grFromDad=" + !!o.fromDad + ",kitView=" + JSON.stringify(o.kitView || null) + ",kitEditId=" + JSON.stringify(o.kitEditId || null) + ";\n" + G + "\nreturn {momGateOpen,momGateHTML,momGateTry};")(...keys.map(k => env[k]));
    return { api, log, els };
  }
  ok("not in Mom mode → Mom's Day is closed", !gw().api.momGateOpen());
  ok("…every Mom's Day page (Schedule, Meals, Grocery, Prep, Weigh-In)", ["cal", "meals", "grocery", "prep", "weigh"].every(v => !gw({ sub: v }).api.momGateOpen()));
  ok("Mom mode on → open, no code inside", gw({ mom: true }).api.momGateOpen());
  ok("Dad's Day + his calendar never stopped", gw({ sub: "dad" }).api.momGateOpen() && gw({ sub: "dadcal" }).api.momGateOpen());
  ok("Dad's grocery list / meals from Dad's Day never stopped", gw({ sub: "grocery", fromDad: true }).api.momGateOpen() && gw({ sub: "meals", fromDad: true }).api.momGateOpen());
  ok("?kiosk=dad link never stopped", gw({ dadKiosk: true }).api.momGateOpen());
  ok("reading a recipe tapped from tonight's dinner is open; editing one is not", gw({ sub: "meals", kitView: "m1" }).api.momGateOpen() && !gw({ sub: "meals", kitView: "m1", kitEditId: "m1" }).api.momGateOpen());
  const w = gw(); w.api.momGateTry({ value: "1234" }, false);
  ok("right code → Mom mode on (haMomOn, same as every Mom door) and the page opens", w.log.on === 1 && w.log.renders === 1);
  const w2 = gw(); const inp = { value: "9999", focus() {} }; w2.api.momGateTry(inp, false);
  ok("wrong code while typing → nothing yet", w2.log.on === 0 && w2.els["mg-err"].textContent === "");
  w2.api.momGateTry(inp, true);
  ok("wrong code on Open → 'didn't match', box cleared", w2.log.on === 0 && /match/.test(w2.els["mg-err"].textContent) && inp.value === "");
  ok("the screen has the code box + Open", /id="mg-pin"/.test(gw().api.momGateHTML()) && /momGateTry/.test(gw().api.momGateHTML()));
  ok("Mom's Day draws the gate before anything else", /if\(!momGateOpen\(\)\)\{ el\.innerHTML=momGateHTML\(\)/.test(slice("renderMomsPlanView")));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
