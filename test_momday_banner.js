/*
 * Node tests — 🏡 MDBANNER (her ask + yes 2026-10-24): "when i click schedule on moms day the header moms day disappears but
 * doesnt for the others. id like it to stay the same for all of them size etc and keep the date, maybe can add the line
 * summary centered?" One teal 🏡 Mom's Day banner, drawn by one helper, on every Mom's Day section — ▸ Schedule included —
 * with Home Base's date line; each section's one-line summary centered under it (Home Base: none). On ▸ Schedule the banner
 * rides ahead of the sticky sub-menu inside #msv-bar (display:contents), so it scrolls away and the menu row stays pinned.
 *   run:  node test_momday_banner.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
function slice(name) {
  const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}" && --d === 0) return src.slice(i, k + 1); }
}
const A = src.indexOf("// MDBANNER_START"), B = src.indexOf("// MDBANNER_END");
ok("the MDBANNER block is marked", A > 0 && B > A);
const BLOCK = src.slice(A, B);

function world(o) {
  o = o || {};
  const env = {
    gwParseDate: iso => new Date(iso + "T12:00:00"), _todayStr: () => o.iso || "2026-10-24",
    currWeekNum: () => (o.wn === undefined ? 28 : o.wn), scheduleBreakToday: () => o.brk || null,
    esc: s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;"),
    mpSubnav: a => '<div id="mp-subnav" data-a="' + a + '"></div>', helperGiveBtnsHTML: () => "",
    mpSchModeGet: () => o.mode || "today", mpSchBody: () => "<i>body</i>",
  };
  const keys = Object.keys(env);
  const body = BLOCK + "\n" + slice("msvBarHTML") + "\n" + slice("renderMPCalendar") + "\nreturn {mwBanner,mdBannerDateLine,msvBarHTML,renderMPCalendar};";
  return new Function(...keys, body)(...keys.map(k => env[k]));
}

console.log("── the banner ──");
{
  const w = world();
  const h = w.mwBanner("Every chore in one place");
  ok("title is 🏡 Mom's Day in Fraunces 22px (Home Base's size)", /font-family:'Fraunces',serif;font-size:22px;font-weight:700;margin-bottom:2px">🏡 Mom's Day<\/div>/.test(h));
  ok("teal gradient, same padding as Home Base", /background:linear-gradient\(135deg,#2B7A78,#3AAFA9\);color:#fff;padding:18px 14px 14px/.test(h));
  ok("date line: Saturday, October 24 · Week 28", /class="md-date"[^>]*>Saturday, October 24 · Week 28<\/div>/.test(h), h);
  ok("the summary is one centered line under the banner", /<\/div><\/div><div class="md-sum" style="text-align:center;[^"]*white-space:nowrap[^"]*">Every chore in one place<\/div>$/.test(h));
  const hb = w.mwBanner("");
  ok("no summary passed: the date line, and the summary line still drawn blank (MDSMOOTH 2026-10-24 — it holds the height)", /Saturday, October 24 · Week 28/.test(hb) && /class="md-sum"[^>]*>&nbsp;<\/div>$/.test(hb));
  const wb = world({ brk: { name: "Thanksgiving Break" } });
  ok("a break adds · <name> — no school", /Week 28 · Thanksgiving Break — no school<\/div>/.test(wb.mwBanner("x")));
  ok("no week number → just the date", /class="md-date"[^>]*>Saturday, October 24<\/div>/.test(world({ wn: null }).mwBanner("x")));
  ok("the break name is escaped", /Tom &amp; Jerry &lt;b — no school/.test(world({ brk: { name: "Tom & Jerry <b" } }).mwBanner("")));
}

console.log("\n── every Mom's Day section draws it ──");
{
  // the section renderers — each one's page opens with the banner, then the sub-menu row
  const SECTIONS = { renderMomsDay: "plan", renderHousehold: "house", renderGrocery: "grocery", renderKitchen: "meals", renderMPCalendar: "cal", renderMPPrep: "prep", renderMPPrepLegacy: "prep", renderMPWeigh: "weigh", msvBarHTML: "cal" };
  Object.keys(SECTIONS).forEach(fn => {
    const f = slice(fn), b = f.indexOf("mwBanner("), n = f.indexOf("mpSubnav('" + SECTIONS[fn] + "')");
    ok(fn + ": banner first, then the " + SECTIONS[fn] + " menu row", b > 0 && n > b);
  });
  ok("Home Base's summary: Today at a glance (MDSMOOTH 2026-10-24)", /h\+=mwBanner\('Today at a glance'\);/.test(slice("renderMomsDay")));
  ok("Home Base no longer builds its own banner", slice("renderMomsDay").indexOf("linear-gradient(135deg,#2B7A78,#3AAFA9)") < 0);
  ok("the banner markup lives in one place", src.split("🏡 Mom's Day</div>").length - 1 === 1 && src.split("🏡 Mom\\'s Day</div>").length - 1 === 0);
  // every summary is one short line (fits a phone)
  const sums = [...src.matchAll(/mwBanner\((['"`])((?:\\.|(?!\1).)*)\1\)/g)].map(m => m[2]).filter(Boolean);
  ok("summaries found for the sections", sums.length >= 6, sums);
  ok("each summary is one short line (≤ 50 chars)", sums.every(s => s.replace(/\\u2019|\\'|&amp;/g, "'").length <= 50), sums);
  ok("the summaries she saw: Household / Schedule", sums.indexOf("Every chore in one place") >= 0 && /Your day and the kids\\u2019 schedule/.test(slice("msvBarHTML")));
}

console.log("\n── ▸ Schedule (MSV) ──");
{
  const w = world();
  const bar = w.msvBarHTML();
  const bi = bar.indexOf('class="md-banner"'), ni = bar.indexOf('<div id="mp-subnav"');
  ok("Schedule shows the same banner with the date", bar.startsWith('<div class="md-banner"') && /Saturday, October 24 · Week 28/.test(bar));
  ok("…its summary centered: Your day and the kids' schedule", /class="md-sum" style="text-align:center[^>]*>Your day and the kids’ schedule<\/div>/.test(bar));
  ok("…above the sticky menu row and outside it (closed before it opens)", ni > bi && bar.slice(0, ni).indexOf("mp-subnav") < 0);
  ok("#msv-bar is display:contents, so the banner is plain page flow (scrolls away) and the sub-menu sticks", /mb\.style\.display=on\?"contents":"none"/.test(slice("renderSchedSubtabs")) && /mb\.innerHTML=on\?msvBarHTML\(\):""/.test(slice("renderSchedSubtabs")));
  ok("only the sub-menu is sticky — nothing pins the banner", /#mp-subnav\{position:sticky;/.test(src) && !/\.md-banner[^{]*\{[^}]*sticky/.test(src) && !/#msv-bar\{[^}]*sticky/.test(src));
  ok("the banner isn't a measured stack bar (the Schedule rows' tops don't move)", !/md-banner/.test(src.slice(src.indexOf("const NAV_STACK_IDS="), src.indexOf("function navStackSync"))));
  ok("msvBarHTML still works if the banner throws (a bare world)", /let ban=''; try\{ ban=mwBanner\(/.test(slice("msvBarHTML")));
  // Week / Month stay on Mom's Day's own page — same banner, their own summary
  ["week", "month", "today"].forEach(m => {
    const el = { innerHTML: "" }; world({ mode: m }).renderMPCalendar(el);
    ok("Schedule ▸ " + m + ": the page opens with the banner + date + summary", /^<div[^>]*><div class="md-banner"/.test(el.innerHTML) && /Week 28/.test(el.innerHTML) && /class="md-sum"/.test(el.innerHTML));
  });
}

console.log("\n── display only ──");
ok("the banner writes nothing", !/db\.|\.ref\(|HA_LS\.setItem|localStorage/.test(BLOCK));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
