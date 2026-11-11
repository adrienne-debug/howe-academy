/*
 * Node tests — KIDNAME_ROSTER (her report 2026-11-10: "the kid is named D3 for Burris. It's supposed to be 3D").
 * Kid ids can't start with a digit (they feed CSS class names), so a child named "3D" has the id "d3". Every place
 * that shows a kid's name must go through cap(), which reads KID_NAME from the roster, instead of capitalizing the id.
 *   run:  node test_kidname_roster.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

console.log("── marked block ──");
const a = src.indexOf("// KIDNAME_ROSTER_START"), b = src.indexOf("// KIDNAME_ROSTER_END");
ok("KIDNAME_ROSTER_START / _END block exists, in order", a >= 0 && b > a);
const capM = src.match(/^function cap\(s\)\{[^\n]*\}$/m);
ok("cap() sits right after the block", !!capM && src.indexOf(capM[0]) > b && src.indexOf(capM[0]) - b < 40);

console.log("── no raw-id names left ──");
// allow-list: the fallback inside cap() itself, and luByName (reads KID_NAME first)
const allow = [capM && capM[0], (src.match(/^function luByName\(b\)\{[^\n]*\}$/m) || [])[0]].filter(Boolean);
let scrubbed = src; allow.forEach(s => { scrubbed = scrubbed.split(s).join(""); });
const raw = [];
const re = /\b(kid|k|masteryKid)\.charAt\(0\)\.toUpperCase\(\)\+\1\.slice\(1\)/g;
let m; while ((m = re.exec(scrubbed))) raw.push(scrubbed.slice(Math.max(0, m.index - 60), m.index + 50));
ok("no charAt(0).toUpperCase()+X.slice(1) for kid / k / masteryKid", raw.length === 0, raw);
ok("cap() and luByName are still there (allow-list matched)", allow.length === 2);

console.log("── each call site uses cap() ──");
[
  ["weekly education record", "const name=esc((opts.kidNames||{})[k]||cap(k)); // KIDNAME_ROSTER"],
  ["history report kName", "const kName=k=>cap(k); // KIDNAME_ROSTER"],
  ["notebook ctx (starter notebook header)", "return { nbKidName:cap(kid), "],
  ["notebook picker label", '{label:cap(k)+" (starter notebook)"}; // KIDNAME_ROSTER'],
  ["NB_KIDS starter label", 'NB_KIDS.push({k,label:cap(k)+" (starter notebook)",aam:false,generic:true})); // KIDNAME_ROSTER'],
  ["mastery header", "const _kid=cap(masteryKid); // KIDNAME_ROSTER"],
  ["check-up heading", "New check-up for '+e(cap(kid))+'</div>'; // KIDNAME_ROSTER"],
].forEach(([n, s]) => ok(n, src.includes(s)));
ok("nbKidName:cap(kid) line is tagged", /nbKidName:cap\(kid\)[^\n]*\/\/ KIDNAME_ROSTER\n/.test(src));
ok("seven sites tagged // KIDNAME_ROSTER", (src.match(/ \/\/ KIDNAME_ROSTER\n/g) || []).length === 7);

console.log("── cap() resolves the roster name ──");
const ctx = { String, KID_NAME: { d3: "3D", zuri: "Zuri" } };
vm.createContext(ctx); vm.runInContext(capM[0], ctx);
ok('cap("d3") → "3D"', ctx.cap("d3") === "3D", ctx.cap("d3"));
ok('cap("zuri") → "Zuri"', ctx.cap("zuri") === "Zuri");
ok('cap("sam") not in the roster → "Sam"', ctx.cap("sam") === "Sam");
const bare = { String }; vm.createContext(bare); vm.runInContext(capM[0], bare);
ok("cap() without KID_NAME still capitalizes", bare.cap("d3") === "D3");

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
