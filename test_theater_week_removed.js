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

// The page's other options (Sitter, Skip, Late, Car, Include Saturday) live on 📅 This week now — the Plan Next Week wizard
// is gone (GWGONE, slice D 2026-11-08): sitter + with-sitter, each kid off, ⏰ day times (a later start), 🚗 car school, Saturday.
const s=src.indexOf("// THISWEEK_START"), e=src.indexOf("// THISWEEK_END");
const tw=src.slice(s,e);
ok("the This week strip found, the wizard's Configure step gone", s>0&&e>s&&src.indexOf("// ── STEP 1: CONFIGURE ──")<0);
["twsToggleSitter","twsToggleWithSitter","twsToggleKid","twsTimes","twsToggleCar","twsToggleSaturday"].forEach(t=>ok("This week offers "+t, tw.includes("function "+t+"(")));
ok("…and no Theater Week there", !/[Tt]heater/.test(tw));

// The week config keeps every other field, in the same order, at each place it is built.
const cfgRe=/carSchool:\{\},saturday:(false|gwSatPlanned\(wn\)),redistribute:\[\],autoAdvance:true\}/g;
ok("three fresh week configs build without theater", (src.match(cfgRe)||[]).length===3);   // GWGONE: the wizard's own fresh config went with it   // 🗓 AUTOBUILD (2026-11-08): the self-build's fixed config became gwEffectiveConfig — four fixed configs remain (the default, Regenerate's fallback, reprojectSubjectWeek's fallback, the wizard's)
ok("the loaded week config (🔄 Regenerate's) builds without theater", (src.match(/carSchool:v\.carSchool\|\|\{\},saturday:!!v\.saturday,/g)||[]).length===1);   // GWGONE: the wizard's load went with it

// The generator's day window still reads school hours from the rules.
ok("default window = school hours only", /windows\.default="School "\+fromMin\(gwR\.schoolStart\)\+"–"\+fromMin\(gwR\.schoolEnd\);/.test(src));

console.log(pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
