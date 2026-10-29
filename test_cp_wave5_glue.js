// test_cp_wave5_glue.js — the wave-5 merge (2026-10-29): PR 8 📅 Pace and PR 25 🧩 skills meet. Pace's station rows show the skill
// engine's "skills learned N of M" (cpSkillPaceLine, defined in CPSKILL) through one typeof-guarded line inside CPPACE.
const fs=require("fs"), path=require("path"); const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n); } };
const slice=(a,b)=>{ const i=src.indexOf("// "+a), j=src.indexOf("// "+b); return i>=0&&j>i?src.slice(i,j):""; };
const PACE=slice("CPPACE_START","CPPACE_END"), SKILL=slice("CPSKILL_START","CPSKILL_END");
ok("both blocks are present once", PACE&&SKILL&&src.split("// CPPACE_START").length===2&&src.split("// CPSKILL_START").length===2);
ok("CPSKILL defines cpSkillPaceLine(summary, section)", /function cpSkillPaceLine\(summary,section\)/.test(SKILL));
const lines=PACE.split("\n").filter(l=>/cpSkillPaceLine\(/.test(l));
ok("CPPACE calls it once, typeof-guarded, tagged 🧩 CPSKILL, with the row's summary and section", lines.length===1&&/typeof cpSkillPaceLine==="function"/.test(lines[0])&&/cpSkillPaceLine\(sm,st\.id\)/.test(lines[0])&&/🧩 CPSKILL/.test(lines[0]));
ok("…and it sits in the station-row loop, right before the tests line", /cpSkillPaceLine\(sm,st\.id\)[^\n]*\n    const t=sm\.tests&&sm\.tests\[st\.id\];/.test(PACE));
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
