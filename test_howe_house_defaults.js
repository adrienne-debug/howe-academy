// The routine lists (morning / afternoon / chores / evening) in the code are the Howe house itself (rabbit, Chloe, the dogs, reptile lights, Bella's chair, Maggie's days),
// so only Howe falls back to them. Another family with nothing saved starts empty — same rule as
// gbDefault() for Up for Grabs (PR #14). (2026-10-07.) The school-room supplies list (SUP_DEFAULT, 29 Howe items)
// is GONE since 2026-10-23: the Sunday list is derived from the lessons (LESSONRES) and starts empty for every family.
// Run: node test_howe_house_defaults.js
const fs=require("fs"); const src=fs.readFileSync(__dirname+"/index.html","utf8");
let fail=0; const ok=(c,m)=>{ if(!c){fail++;console.log("FAIL "+m);} else console.log("ok   "+m); };
const slice=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j+b.length); };
const morning=slice("const MORNING_STEPS_DEFAULT =","\n};");
const rt=slice("const RT_DEFAULT =","\n};");
const HOWE_WORDS=/rabbit|bunny|Chloe|dogs|reptile|sunny|Bella|Maggie|Lincoln|Ellis|Lucy|Julian|school room/i;
function load(howe){
  return new Function("HA_IS_HOWE",morning+";\n"+rt+";\nreturn {MORNING_STEPS_DEFAULT,RT_DEFAULT};")(howe);
}
// Howe: unchanged
{ const D=load(true);
  ok(D.MORNING_STEPS_DEFAULT.lincoln.some(s=>/rabbit/.test(s.label)),"Howe morning still has Lincoln's rabbit jobs");
  ok(D.RT_DEFAULT.morning.lucy.some(s=>/Chloe/.test(s.label)),"Howe RT_DEFAULT.morning still derives from the morning list");
  ok(D.RT_DEFAULT.evening.ellis.some(s=>/reptile/.test(s.label)),"Howe evening still has the reptile lights");
  ok(D.RT_DEFAULT.chores.lincoln.some(s=>/bunny/.test(s.label)),"Howe chores still has the bunny bedding");
  ok(D.RT_DEFAULT.afternoon.lincoln.length>0,"Howe afternoon list intact");
}
// Another family: nothing Howe leaks, even if a kid id happens to match a Howe kid
{ const D=load(false);
  ok(Object.keys(D.MORNING_STEPS_DEFAULT).length===0,"other family: no morning defaults");
  ["morning","afternoon","chores","evening"].forEach(slot=>{
    const v=D.RT_DEFAULT[slot];
    ok(v&&typeof v==="object"&&Object.keys(v).length===0,"other family: RT_DEFAULT."+slot+" is an empty map");
    ok(((v||{}).lucy||[]).length===0,"other family with a kid id 'lucy' gets no Howe "+slot+" steps");
  });
  ok(!HOWE_WORDS.test(JSON.stringify(D)),"no Howe house content in any of these defaults");
}
// Readers still cope with the empty defaults (no crash on a missing slot/kid)
ok(/\(\(\(RT_DEFAULT\[slot\]\|\|\{\}\)\[kid\]\)\|\|\[\]\)/.test(src),"rtStepsFor still guards a missing slot/kid");
ok(/MORNING_STEPS_DEFAULT\[kid\]\|\|\[\]/.test(src),"_mrLegacySteps still guards a missing kid");
// Supplies: the hard-coded Howe list is gone (her decision 2026-10-23); the Sunday list derives from the lessons and
// every family starts from the same empty line.
ok(!/SUP_DEFAULT=/.test(src)&&!/SUP_CATS_DEFAULT/.test(src),"SUP_DEFAULT / SUP_CATS_DEFAULT are gone");
ok(/const LR_EMPTY_LINE="Add supplies to a lesson, snap a photo of a materials list, or set your staples — they show up here\."/.test(src),"the Sunday list's empty-state line is in the LESSONRES block");
// The earlier Howe-only gates are still in place
ok(/function gbDefault\(\)\{ return \(typeof HA_IS_HOWE!=="undefined"&&HA_IS_HOWE\)\?GRAB_DEFAULT:\[\]; \}/.test(src),"Up for Grabs still Howe-only");
ok(/const KIT_ROT_DEFAULT=\(typeof HA_IS_HOWE!=="undefined"&&!HA_IS_HOWE\)\?\{\}:/.test(src),"meal rotation still Howe-only");
ok(/if\(!hasSavedPlans&&HA_IS_HOWE\)/.test(src),"pace plans still Howe-only");
console.log(fail?fail+" FAILED":"all passed"); process.exit(fail?1:0);
