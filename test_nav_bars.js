/*
 * Node tests — NAVSTACK + NAVBARS (her reports 2026-10-22: "the navy top bar shifts a little bit at times" · "when I open
 * the Schedule first and then go to Household inside Mom's Day, the schedule's day/kid row comes along").
 *   1. The sticky stack (header → nav tabs → Schedule sub-tabs → day row → kid row → in-page bars) is measured into CSS
 *      variables (--hdr-h, --nav-h, --sub-h, --day-h) by navStackSync(); no bar keeps a typed pixel `top`.
 *   2. Which bars show is decided in ONE place, navBarsApply(), on every paint — so a page reached without a tap
 *      (the update reload's come-back, a kiosk boot) shows only its own bars.
 *   run:  node test_nav_bars.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(name) {
  const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}" && --d === 0) return src.slice(i, k + 1); }
}
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const css = src.slice(src.indexOf("/* NAVSTACK_CSS_START"), src.indexOf("/* NAVSTACK_CSS_END */"));
const rule = sel => { const m = src.match(new RegExp("\\n" + sel.replace(/[#.]/g, "\\$&") + "\\{([^}]*)\\}")); return m ? m[1] : ""; };
const navBlk = src.slice(src.indexOf("// NAVBARS_START"), src.indexOf("// NAVBARS_END"));
const stackBlk = src.slice(src.indexOf("// NAVSTACK_START"), src.indexOf("// NAVSTACK_END"));

console.log("── the sticky stack is measured, not typed ──");
ok("the stack's variables exist with fallbacks", /:root\{--hdr-h:\d+px;--nav-h:\d+px;--sub-h:\d+px;--day-h:\d+px\}/.test(css));
ok("the navy nav row sticks at the header's real height", /position:sticky;top:var\(--hdr-h\);/.test(rule("#nav-tabs")));
// STICKYSTACK (2026-10-22): Mom's Day's menu row (--mp-h) joined the stack right under the navy bars — it measures 0 everywhere but Mom's Day ▸ Schedule.
ok("Schedule sub-tabs stick under header + nav (+ Mom's Day's menu row)", /top:calc\(var\(--hdr-h\) \+ var\(--nav-h\) \+ var\(--mp-h\)\);/.test(rule("#sched-subtabs")));
ok("the day row sticks under header + nav + menu row + sub-tabs", /top:calc\(var\(--hdr-h\) \+ var\(--nav-h\) \+ var\(--mp-h\) \+ var\(--sub-h\)\);/.test(rule("#day-tabs")));
ok("the kid row sticks under all five", /top:calc\(var\(--hdr-h\) \+ var\(--nav-h\) \+ var\(--mp-h\) \+ var\(--sub-h\) \+ var\(--day-h\)\);/.test(rule("#kid-filter")));
["#app-header", "#nav-tabs", "#sched-subtabs", "#day-tabs", "#kid-filter"].forEach(sel => {
  const r = rule(sel); const typed = r.match(/(^|;)top:\d+px/);
  ok(sel + " has no typed pixel top" + (sel === "#app-header" ? " except 0" : ""), sel === "#app-header" ? /top:0;/.test(r) : !typed, typed && typed[0]);
});
ok("the old fixed offsets are gone for good (52 / 88 / 122 / 166 / 182 px)", !/top:(52|88|122|166|182)px/.test(src.replace(/body\.kioskr[^\n]*/g, "")));
ok("no script sets the kid row's top by hand any more", !/kf\.style\.top=/.test(src) && !/kid-filter"\)\.style\.top/.test(src));
ok("in-page bars under the stack use the variables too (Mastery kid row, Schedule ▸ Admin tabs)", /top:calc\(var\(--hdr-h\) \+ var\(--nav-h\)\);z-index:96/.test(src) && /top:calc\(var\(--hdr-h\) \+ var\(--nav-h\) \+ var\(--mp-h\) \+ var\(--sub-h\)\);z-index:90/.test(src));
ok("the stack is documented in one comment block (header → nav-tabs → page bars) with the how-to-add rule", /#app-header \(top:0\) → #nav-tabs → #sched-subtabs → #day-tabs → #kid-filter/.test(css) && /To add a bar to the stack/.test(css));
ok("the page can never scroll sideways (html only — body too would break sticky)", /\nhtml\{overflow-x:hidden\}/.test(src) && !/\nbody\{[^}]*overflow-x/.test(src));

console.log("\n── the header never changes height ──");
ok("the family line is always in flow — no display:none on it", /<div class="header-family" id="hdr-family"><\/div>/.test(src) && !/hdr-family" style="display:none"/.test(src));
ok("…and keeps its height when empty (min-height)", /\.header-family\{[^}]*min-height:1\.1em/.test(css));
ok("the family-name script no longer toggles the line's display", !/el\.textContent="The "\+m\[1\]\+" Family"; el\.style\.display=""/.test(src));

console.log("\n── navStackSync measures the four bars ──");
{
  const set = {}; const hs = { "app-header": 63, "nav-tabs": 34, "sched-subtabs": 0, "day-tabs": 58 };
  const env = { document: { documentElement: { style: { setProperty: (k, v) => { set[k] = v; } } }, getElementById: id => (id in hs ? { offsetHeight: hs[id] } : null) } };
  const f = new Function(...Object.keys(env), stackBlk.replace(/\(function navStackWire\(\)\{[\s\S]*?\}\)\(\);/, "") + "\nreturn navStackSync;")(...Object.values(env));
  f();
  ok("each bar's height lands in its variable (a hidden bar = 0px)", set["--hdr-h"] === "63px" && set["--nav-h"] === "34px" && set["--sub-h"] === "0px" && set["--day-h"] === "58px", set);
  ok("wired to ResizeObserver, window resize, orientation and the fonts arriving, and run once at boot", /new ResizeObserver\(navStackSync\)/.test(stackBlk) && /addEventListener\("resize",navStackSync\)/.test(stackBlk) && /orientationchange/.test(stackBlk) && /document\.fonts\.ready\.then\(navStackSync\)/.test(stackBlk) && /\n    navStackSync\(\);\n/.test(stackBlk));
  ok("the wiring runs where the header already exists (inside the main script, after the markup)", src.indexOf('<div id="app-header">') < src.indexOf("// NAVSTACK_START") && src.indexOf("// NAVSTACK_START") < src.indexOf("function _renderAllInner("));
  ok("a browser without ResizeObserver re-measures after each paint", /if\(typeof ResizeObserver!=="function"\) requestAnimationFrame\(navStackSync\);/.test(slice("_renderAllInner")));
}

console.log("\n── one place decides the bars ──");
function world(o) {
  const els = {}; const el = id => (els[id] = els[id] || { id, style: { display: "" } });
  const env = { document: { getElementById: el } };
  const vars = Object.assign({ tab: "schedule", schedShowHistory: false, schedShowPace: false, schedShowAdmin: false, schedShowBoard: false }, o || {});
  const api = new Function(...Object.keys(env), ...Object.keys(vars), navBlk + "\nreturn {navBarsShow,navBarsApply};")(...Object.values(env), ...Object.values(vars));
  // boot state: the rows carry no inline display, the sub-tabs start hidden (as the markup has them)
  el("day-tabs"); el("kid-filter"); el("sched-subtabs").style.display = "none";
  api.navBarsApply();
  return { sub: els["sched-subtabs"].style.display, day: els["day-tabs"].style.display, kf: els["kid-filter"].style.display };
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
ok("Schedule: sub-tabs, day row and kid row", same(world({ tab: "schedule" }), { sub: "flex", day: "flex", kf: "flex" }));
ok("Schedule ▸ History / Wins: day row goes, kid row stays", same(world({ tab: "schedule", schedShowHistory: true }), { sub: "flex", day: "none", kf: "flex" }) && same(world({ tab: "schedule", schedShowPace: true }), { sub: "flex", day: "none", kf: "flex" }));
ok("Schedule ▸ Admin: only the sub-tabs", same(world({ tab: "schedule", schedShowAdmin: true }), { sub: "flex", day: "none", kf: "none" }));
ok("Supplies: the day row only", same(world({ tab: "supplies" }), { sub: "none", day: "flex", kf: "none" }));
ok("History / Pace pages: the kid row only", same(world({ tab: "history" }), { sub: "none", day: "none", kf: "flex" }) && same(world({ tab: "pace" }), { sub: "none", day: "none", kf: "flex" }));
["moms-plan", "kids", "notebook", "mastery", "units", "play", "babysitter", "activities"].forEach(t => {
  ok(t + ": no Schedule rows (even when they started visible)", same(world({ tab: t }), { sub: "none", day: "none", kf: "none" }));
});
ok("Mom's Day: hidden whatever sub-view is open (Home Base, Household, Meals, Prep, Weigh-In, Grocery, Week/Month)", ["plan", "house", "meals", "prep", "weigh", "grocery", "cal"].every(() => same(world({ tab: "moms-plan" }), { sub: "none", day: "none", kf: "none" })) && !/mpSubView/.test(navBlk));
ok("the rule has no per-page patch — nothing but tab + the Schedule's own view flags", !/house|moms-plan|kids|mastery/.test(navBlk.replace(/\/\/[^\n]*/g, "")));
ok("every paint runs it (_renderAllInner), after the bars are drawn and before the page body", (() => { const f = slice("_renderAllInner"); const i = f.indexOf("renderSchedSubtabs(); renderDayTabs(); renderKidFilter();"), j = f.indexOf("navBarsApply();"), k = f.indexOf('if(tab==="schedule") renderSchedule(c);'); return i >= 0 && i < j && j < k; })());
ok("showTab no longer decides the bars itself (it paints, and the paint decides)", (() => { const f = slice("showTab"); return !/getElementById\("day-tabs"\)\.style\.display/.test(f) && !/getElementById\("kid-filter"\)\.style\.display/.test(f) && !/getElementById\("sched-subtabs"\)\.style\.display/.test(f) && /renderAll\(\);/.test(f); })());
ok("the paint's old second rule for the rows is gone", !/if\(tab==="schedule"\) document\.getElementById\("day-tabs"\)\.style\.display=/.test(src) && !/const showKidFilter=/.test(src));

console.log("\n── the bug's own route: the update reload's come-back ──");
{
  // haCvReturnRestore sets tab= directly and the boot paints — no showTab. The paint's navBarsApply must hide the rows.
  const store = { ha_cv_return: JSON.stringify({ at: Date.now(), tab: "moms-plan", kid: "all" }) };
  const vars = { tab: "schedule", kid: "all", masteryKid: null, mastView: null, mastSlideIdx: 0, schedShowAdmin: false, adminSubTab: "hq", mhqKid: null, mhqView: null, mhqDeck: null, schedShowHistory: false, schedShowPace: false, schedShowBoard: false };
  const els = {}; const el = id => (els[id] = els[id] || { id, style: { display: "" } });
  const env = { sessionStorage: { getItem: k => store[k] || null, removeItem: k => { delete store[k]; } }, _kiosk: () => false, _kioskR: () => false, _kioskD: () => false, _kioskK: () => false, document: { getElementById: el } };
  const r = new Function(...Object.keys(env), ...Object.keys(vars), slice("haCvReturnRestore") + "\n" + navBlk + "\nconst got=haCvReturnRestore(); el=null; navBarsApply(); return {got,tab};".replace("el=null;", ""))(...Object.values(env), ...Object.values(vars));
  el("day-tabs"); el("kid-filter"); el("sched-subtabs");
  ok("the come-back lands on Mom's Day…", r.got && r.tab === "moms-plan", r);
  ok("…and the Schedule's rows are hidden by the paint, with no tap", els["day-tabs"].style.display === "none" && els["kid-filter"].style.display === "none" && els["sched-subtabs"].style.display === "none", els);
  ok("the boot still paints after the come-back (renderAll follows haCvReturnRestore)", (() => { const i = src.lastIndexOf("if(haCvReturnRestore())"), j = src.indexOf("try{ renderAll(); }", i); return i > 0 && j > i && j - i < 600; })());
}
ok("no 🔀 anywhere", src.indexOf("🔀") < 0);
console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
