// Theater Week is gone from Plan Next Week (her 10/4 Generate Week cleanup: "old, take out").
// Pins that no chip offers it, no week config carries it, and no generator/window code reads it.
const fs=require("fs"), path=require("path");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const famCfg=fs.readFileSync(path.join(__dirname,"family-config.js"),"utf8");
let pass=0, fail=0;
function ok(name,cond){ if(cond){ pass++; } else { fail++; console.log("FAIL: "+name); } }

// Code lines only — a comment may still tell the history of the old 5 PM-unless-Theater rule.
const code=src.split("\n").filter(l=>!/^\s*\/\//.test(l)).join("\n");

ok("no Theater Week chip on Plan Next Week", !/>Theater Week</.test(src));
ok("no gwToggleTheater", !/gwToggleTheater/.test(src));
ok("no code reads a .theater setting", !/\.theater\b/.test(code));
ok("no config or dayConfig carries a theater key", !/\btheater\s*:/.test(code));
ok("no Theater 4:30 note in the schedule window", !/Theater 4:30/.test(src));
ok("Howe's first-boot window banner has no Theater note", !/Theater/.test(famCfg));

// The page's other options are untouched (Sitter, Skip, Late, Car, Include Saturday).
const s=src.indexOf("// ── STEP 1: CONFIGURE ──"), e=src.indexOf("// ── STEP 2: PREVIEW ──");
const step1=src.slice(s,e);
ok("Configure step found", s>0&&e>s);
["Days'","Skip Days","Late Start","Car School","Include Saturday","pnwToggleWithSitter"].forEach(t=>ok("Configure still offers "+t, step1.includes(t)));

// The week config keeps every other field, in the same order, at each place it is built.
const cfgRe=/carSchool:\{\},saturday:(false|gwSatPlanned\(wn\)),redistribute:\[\],autoAdvance:true\}/g;
ok("five fresh week configs build without theater", (src.match(cfgRe)||[]).length===5);
ok("two loaded week configs build without theater", (src.match(/carSchool:v\.carSchool\|\|\{\},saturday:!!v\.saturday,/g)||[]).length===2);

// The generator's day window still reads school hours from the rules.
ok("default window = school hours only", /windows\.default="School "\+fromMin\(gwR\.schoolStart\)\+"–"\+fromMin\(gwR\.schoolEnd\);/.test(src));

console.log(pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
