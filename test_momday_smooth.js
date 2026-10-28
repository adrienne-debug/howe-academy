/*
 * Node tests — 🏡 MDSMOOTH (her report 2026-10-24, right after MDBANNER went live): "It does still blink when I switch to
 * schedule. I think it's because Homebase doesn't have the little summary section, so it still has to blink and bump up and
 * down. I would love for it to look uniform when it clicks and feels smooth … let's just make a summary or make it blank for
 * home base, but that way it doesn't move."
 *   1. Home Base draws a summary line ("Today at a glance"); mwBanner always draws the line, blank or not.
 *   2. ▸ Schedule (Today) from the menu row opens the Schedule view in the same tick — no "Opening the schedule…" frame; the
 *      one route that still waits a tick paints the Schedule's own banner + menu rows meanwhile.
 *   3. Banner + summary + menu row are the same markup and the same CSS on every section, phone included.
 *   4. Above the banner it's the same bars on Mom's Day and on ▸ Schedule (#app-header, #nav-tabs).
 *   run:  node test_momday_smooth.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
function slice(name) {
  const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}" && --d === 0) return src.slice(i, k + 1); }
}
const between = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b); return i > 0 && j > i ? src.slice(i, j) : ""; };
const BLOCK = between("// MDSMOOTH_START", "// MDSMOOTH_END");
const CSS = between("/* MDSMOOTH_CSS_START", "/* MDSMOOTH_CSS_END");
const BANNER = between("// MDBANNER_START", "// MDBANNER_END");
ok("the MDSMOOTH block and its CSS block are marked", BLOCK.length > 0 && CSS.length > 0);
ok("…with her words and the date", /2026-10-24/.test(BLOCK) && /It does still blink when I switch to schedule/.test(BLOCK));

// the real banner helper + the real MDSMOOTH helpers + the real msvBarHTML, in a small world
function world(o) {
  o = o || {};
  const calls = [];
  const env = {
    gwParseDate: iso => new Date(iso + "T12:00:00"), _todayStr: () => "2026-10-24",
    currWeekNum: () => 28, scheduleBreakToday: () => null,
    esc: s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;"),
    helperGiveBtnsHTML: () => "", mpSchModeGet: () => o.mode || "today",
    calls,
  };
  const keys = Object.keys(env);
  const body = BANNER + "\n" + BLOCK + "\n" + src.slice(src.indexOf("// SHOPNAME_START"), src.indexOf("// SHOPNAME_END")) + "\n" + slice("mpSubnav") + "\n" + slice("msvBarHTML")   // SHOPNAME: the SHOPNAME slice ahead of mpSubnav — the chip reads the list's name constant
    + "\nreturn {mwBanner,mpSubnav,msvBarHTML,mdSmoothHold,mdSmoothCalNow};";
  return new Function(...keys, body)(...keys.map(k => env[k]));
}
const W = world();

console.log("── 1. Home Base has the summary line ──");
{
  ok("renderMomsDay draws mwBanner('Today at a glance'), then its menu row", /h\+=mwBanner\('Today at a glance'\);[^\n]*\n  h\+=mpSubnav\('plan'\);/.test(slice("renderMomsDay")));
  const hb = W.mwBanner("Today at a glance");
  ok("…a centered summary line under the banner: Today at a glance", /<div class="md-sum" style="text-align:center;[^"]*">Today at a glance<\/div>$/.test(hb));
  const blank = W.mwBanner("");
  ok("a blank summary still draws the line (same markup, &nbsp;) — no section can lose the height", blank.replace("&nbsp;", "X") === W.mwBanner("X"));
  ok("no Mom's Day page calls mwBanner without a summary any more", !/mwBanner\(''\)|mwBanner\(\)/.test(src));
}

console.log("\n── 2. no blink entering ▸ Schedule ──");
{
  ok("the \"Opening the schedule…\" placeholder is gone from the app (only comments name it now)", src.replace(/\/\/[^\n]*/g, "").indexOf("Opening the schedule") < 0);
  // mpGoto, the real one, with spies
  function goWorld(st) {
    const log = [];
    const env = {
      mdSmoothCalNow: v => world({ mode: st.mode }).mdSmoothCalNow(v),   // the real one
      msvEnter: () => log.push("msvEnter"), showTab: t => log.push("showTab:" + t), renderMomsPlan: () => log.push("renderMomsPlan"),
      document: { getElementById: () => ({}) }, window: { scrollTo: () => log.push("scroll") },
    };
    const keys = Object.keys(env);
    const f = new Function(...keys, "let mpSubView=null, momSchedView=" + !!st.msv + ", tab=" + JSON.stringify(st.tab || "moms-plan") + ";\n" + slice("mpGoto") + "\nreturn function(v){ mpGoto(v); return {mpSubView}; };")(...keys.map(k => env[k]));
    return v => { const r = f(v); return { log, mpSubView: r.mpSubView }; };
  }
  let r = goWorld({})("cal");
  ok("Home Base → ▸ Schedule (Today): msvEnter in the same call — no Mom's Day repaint first", r.log[0] === "msvEnter" && r.log.indexOf("renderMomsPlan") < 0 && r.log.indexOf("showTab:moms-plan") < 0, r.log);
  r = goWorld({ msv: true, tab: "schedule" })("cal");
  ok("…▸ Schedule tapped while already on it: same, straight to msvEnter", r.log[0] === "msvEnter" && r.log.indexOf("showTab:moms-plan") < 0, r.log);
  r = goWorld({ mode: "week" })("cal");
  ok("▸ Schedule on Week / Month stays a Mom's Day page (renderMomsPlan)", r.log[0] === "renderMomsPlan", r.log);
  r = goWorld({ msv: true, tab: "schedule" })("plan");
  ok("▸ Schedule → Home Base: one showTab('moms-plan') (one paint), as before", r.log[0] === "showTab:moms-plan" && r.log.length === 2, r.log);
  r = goWorld({})("house");
  ok("Home Base → Household: unchanged (renderMomsPlan)", r.log[0] === "renderMomsPlan", r.log);
  ok("mdSmoothCalNow: only 'cal' on Today", W.mdSmoothCalNow("cal") && !W.mdSmoothCalNow("plan") && !world({ mode: "month" }).mdSmoothCalNow("cal"));

  // renderMomsPlanView's own ▸ Schedule route (the Mom's Day tab tapped with ▸ Schedule last open): the real function, stubbed
  const timers = [];
  const env = {
    mpInit: () => {}, momGateOpen: () => true, mpSchModeGet: () => "today", mdSmoothHold: W.mdSmoothHold,
    setTimeout: fn => timers.push(fn), msvEnter: () => timers.push("entered"), renderMPCalendar: () => { throw new Error("not this"); },
  };
  const keys = Object.keys(env);
  const view = new Function(...keys, "let mpSubView='cal', grFromDad=false, tab='moms-plan';\n" + slice("renderMomsPlanView") + "\nreturn renderMomsPlanView;")(...keys.map(k => env[k]));
  const el = { innerHTML: "" }; view(el);
  ok("the tick it waits paints the Schedule's own banner + summary + menu row (mdSmoothHold = msvBarHTML)", el.innerHTML === W.mdSmoothHold() && el.innerHTML.indexOf(W.msvBarHTML()) > 0);
  ok("…opening with the banner, never a blank or a placeholder", /^<div[^>]*><div class="md-banner"/.test(el.innerHTML) && !/Opening/.test(el.innerHTML));
  ok("…and it still hops to the Schedule view on the next tick", timers.length === 1 && typeof timers[0] === "function");
}

console.log("\n── 3. banner + summary + menu row: same markup on every section ──");
{
  const SECTIONS = { renderMomsDay: "plan", renderHousehold: "house", renderGrocery: "grocery", renderKitchen: "meals", renderMPCalendar: "cal", renderMPPrep: "prep", renderMPPrepLegacy: "prep", renderMPWeigh: "weigh", msvBarHTML: "cal" };
  const norm = h => h.replace(/<div class="md-sum"([^>]*)>[^<]*<\/div>/, '<div class="md-sum"$1>·</div>');
  const ref = norm(W.mwBanner("x"));
  // the whole mwBanner(…) call in a renderer's source (parens matched — ▸ Schedule's Week/Month pick their summary with a ?:)
  const callOf = f => { const i = f.indexOf("mwBanner("); if (i < 0) return null; let d = 0; for (let k = i + 8; k < f.length; k++) { if (f[k] === "(") d++; else if (f[k] === ")" && --d === 0) return f.slice(i, k + 1); } return null; };
  Object.keys(SECTIONS).forEach(fn => {
    const f = slice(fn), call = callOf(f);
    const words = call ? [...call.matchAll(/(['"`])((?:\\.|(?!\1).)+)\1/g)].map(m => m[2]).filter(w => !/^(month|week|today)$/.test(w)) : [];
    ok(fn + ": draws the banner with a summary", words.length > 0, words);
    ok(fn + ": the banner markup is the shared one (only the words differ)", words.length > 0 && words.every(w => norm(W.mwBanner(w)) === ref));
    // nothing is drawn between the banner and the menu row (Grocery's Dad-side back button replaces the row — his page, not Mom's)
    const tail = call ? f.slice(f.indexOf(call) + call.length, f.indexOf("mpSubnav('" + SECTIONS[fn] + "')")) : "<";
    const clean = tail.replace(/\/\/[^\n]*/g, "").replace(/\n\s*if\(grFromDad\) h\+=[^\n]*\n\s*else /, "").replace(/catch\(e\)/g, "");
    ok(fn + ": the menu row comes right after the summary (no markup, no call between)", !/</.test(clean) && !/\w\(/.test(clean), clean.trim().slice(0, 80));
  });
  const bar = W.msvBarHTML();
  ok("▸ Schedule's bar = banner, summary, menu row, in that order, nothing between", bar.indexOf('<div class="md-banner"') === 0 && /<\/div><div class="md-sum"[^>]*>[^<]*<\/div><div id="mp-subnav"/.test(bar.replace(/>\s+</g, "><")));
  ok("the hold paint and ▸ Schedule are the exact same bar", W.mdSmoothHold().indexOf(bar) > 0);
}

console.log("\n── 3b. …and the same CSS (iPad and phone) ──");
{
  // every rule that styles the menu row / banner / summary
  const STYLE = src.slice(0, src.indexOf("</head>"));
  const rules = [...STYLE.matchAll(/([^{}\n]*(?:mp-subnav|md-banner|md-sum)[^{}\n]*)\{([^}]*)\}/g)].map(m => ({ sel: m[1].trim(), body: m[2].trim() }));
  const msvOnly = rules.filter(r => /#msv-bar #mp-subnav/.test(r.sel));
  ok("the phone strip rules that were ▸ Schedule-only are found (3)", msvOnly.length === 3, msvOnly.map(r => r.sel));
  msvOnly.forEach(r => {
    const twin = rules.find(x => x.sel === r.sel.replace("#msv-bar #mp-subnav", ".md-banner~#mp-subnav"));
    ok("…" + r.sel + " has a twin for every Mom's Day section, same declarations", !!twin && twin.body === r.body, twin);
  });
  ok("the twins live in the phone media query (max-width:480px)", /@media \(max-width:480px\)\{[^]*\.md-banner~#mp-subnav\{/.test(CSS));
  ok(".md-banner~#mp-subnav matches the menu row on every section (it follows the banner as a sibling, ▸ Schedule's #msv-bar too)", /^<div class="md-banner"[^]*<\/div><div class="md-sum"[^>]*>[^<]*<\/div>$/.test(W.mwBanner("x").replace(/>\s+</g, "><")));
  ok("no other rule singles out one section's banner, summary or menu row", rules.every(r => /^(#mp-subnav|#msv-bar #mp-subnav|\.md-banner~#mp-subnav)(::-webkit-scrollbar| button)?$/.test(r.sel) || /^body\./.test(r.sel)), rules.map(r => r.sel));
  ok("the menu row is still sticky (STICKYSTACK untouched)", /#mp-subnav\{position:sticky;top:calc\(var\(--hdr-h\) \+ var\(--nav-h\)\);z-index:98\}/.test(src));
}

console.log("\n── 4. above the banner: the same bars on Mom's Day and ▸ Schedule ──");
{
  const body = src.slice(src.indexOf("<body>"), src.indexOf('<div id="content">'));
  const ids = [...body.matchAll(/^<div id="([^"]+)"/gm)].map(m => m[1]);
  ok("page order: header, menu, then #msv-bar first (▸ Schedule's banner sits right under the menu)", ids[0] === "app-header" && ids[1] === "nav-tabs" && ids[2] === "msv-bar", ids);
  // on Mom's Day every bar between the menu and #content is hidden — so her banner sits right under the menu there too
  const nb = new Function("let tab='moms-plan', schedShowHistory=false, schedShowPace=false, schedShowAdmin=false, schedShowBoard=false; const ssJumpOn=()=>false;\n" + slice("navBarsShow") + "\nreturn navBarsShow();")();
  ok("Mom's Day: the Schedule's sub-tabs, day row and kid row are hidden (navBarsShow)", !nb["sched-subtabs"] && !nb["day-tabs"] && !nb["kid-filter"], nb);
  ok("Mom's Day: #msv-bar is hidden off ▸ Schedule", /const on=\(momSchedView&&tab==="schedule"\); mb\.style\.display=on\?"contents":"none"/.test(slice("renderSchedSubtabs")));
  ok("Mom's Day: the lights panel and the week strip are Schedule-tab only", /tab!=="schedule"[^\n]*panel\.style\.display="none"/.test(slice("renderSkylight")) && /if\(tab!=="schedule"[^\n]*el\.style\.display="none"/.test(slice("renderWeekStrip")));
  ok("the kiosk bars are hidden by default (CSS)", ["kiosk-kids", "kiosk-tabs", "kiosk-view", "kiosk-mom"].every(id => new RegExp("#" + id + "\\{display:none").test(src)));
  ok("…and the only bar left, the Mom-code box, needs kid=mom with Mom mode off — never inside Mom's Day", /if\(kid==="mom" && !momModeActive\)\{\s*pinBar\.style\.display="block"/.test(slice("renderKidFilter")));
}

console.log("\n── display only ──");
ok("MDSMOOTH writes nothing", !/db\.|\.ref\(|HA_LS\.setItem|localStorage|\.set\(|\.update\(/.test(BLOCK));
ok("…and the hooks it adds write nothing", !/db\.|\.ref\(/.test(slice("mpGoto")) && !/db\.|\.ref\(/.test(slice("renderMomsPlanView")));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
