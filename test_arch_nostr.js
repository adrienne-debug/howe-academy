// ARCHNOSTR — no device copy of the archive is built (her yes 2026-11-21, PLAN_archive_window_2026-11-21.md slice 0).
// HA_LS drops "ha_archive" (NO_MIRROR, LS_ARCHIVE 2026-10-22), but six places still ran JSON.stringify(archive) — 2.85 MB
// of text on every archive change, built and thrown away. They no longer do; every Firebase archive write is unchanged.
const fs = require("fs"), path = require("path");
const dir = process.argv[2] || __dirname;
const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ✓ " + n); } else { fail++; console.log("  ✗ " + n + (x !== undefined ? "  → " + JSON.stringify(x) : "")); } };
const code = html.split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n");

ok("no code saves a device copy of the archive", !/HA_LS\.setItem\("ha_archive"/.test(code));
ok("no code turns the whole archive into text", !/JSON\.stringify\(archive\)/.test(code));
ok("HA_LS still drops ha_archive (NO_MIRROR unchanged)", /var NO_MIRROR=\{"ha_mastery":1,"ha_archive":1\};/.test(html) && /setItem:function\(k,v\)\{ if\(NO_MIRROR\[k\]\) return;/.test(html));
ok("six ARCHNOSTR notes where the copies were", (html.match(/\/\/ ARCHNOSTR/g) || []).length === 6);

// every archive write to Firebase is still there, each right after its in-memory change (since ARCHCORE, slice 3 11/22, through
// archWrite — the same write plus the smaller copy, in one update; test_archive_core_sync.js tests archWrite itself)
const writes = [
  ["the start-up listener still fills archive from Firebase", /db\.ref\("archive"\)\.on\("value",s=>\{\n\s*fbArchiveLoaded=true;[\s\S]{0,300}archive=s\.val\(\)\|\|\{\};\n\s*\/\/ ARCHNOSTR/],
  ["Attendance ▸ add a week still writes archive/<week>", /archive\[wkKey\]=entry;\n\s*\/\/ ARCHNOSTR[^\n]*\n\s*archWrite\(wkKey,\{"":entry\}\);/],
  ["Attendance ▸ set a date still writes that one date", /archive\[wkKey\]\.dates\[day\]=val\.trim\(\);\n\s*\/\/ ARCHNOSTR[^\n]*\n\s*archWrite\(wkKey,\{\["dates\/"\+day\]:val\.trim\(\)\}\);/],
];
writes.forEach(([n, re]) => ok(n, re.test(html)));
const closes = html.match(/archive\[oldWK\]=entry;\n\s*\/\/ ARCHNOSTR[^\n]*\n\s*archWrite\(oldWK,\{"":entry\}\);/g) || [];
ok("both week-close paths (loadJson + gwCommit) still write archive/<old week>", closes.length === 2, closes.length);
ok("the curriculum editor walk-back still removes its archive records", /archWrite\(it\.wk,\{\["checked\/"\+it\.doneKey\]:null,\["history\/"\+it\.doneKey\]:null\}\)/.test(html));

// run the start-up listener for real: archive arrives, no storage call, nothing thrown
{ const m = /db\.ref\("archive"\)\.on\("value",(s=>\{[\s\S]*?\n\s*\})\);/.exec(html);
  ok("start-up listener found", !!m);
  const calls = []; let renders = 0;
  const ctx = { fbArchiveLoaded: false, archive: {}, tab: "schedule", cdMark() {}, HA_LS: { setItem(k) { calls.push(k); }, getItem() { return null; } },
    JSON: { stringify() { throw new Error("must not stringify the archive"); }, parse: JSON.parse }, renderHistory() { renders++; }, renderPace() { renders++; }, document: { getElementById() { return {}; } } };
  const vm = require("vm"); vm.createContext(ctx);
  let err = null; try { vm.runInContext("(" + m[1] + ")({val:()=>({week31:{weekLabel:'week31'}})})", ctx); } catch (e) { err = e.message; }
  ok("archive arrives: memory filled, flag set, no storage call, no stringify", !err && ctx.fbArchiveLoaded === true && ctx.archive.week31 && calls.length === 0, err || calls); }

console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
