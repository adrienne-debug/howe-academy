/*
 * 🌿 ENVMCK — the mirror's byConcept key is never a raw Firebase key (Lincoln's first publish, 2026-11-09:
 *   "update failed: values argument contains an invalid key (cei|Forest Management / Fire) in property 'students.howe_lincoln.summary.byConcept'").
 *   · envSummary on a unit whose Key Concept name holds a / : every byConcept key passes the SDK's key test
 *   · the coded key is haKey("<station>|<concept>") exactly; a plain concept's key is unchanged byte for byte
 *   · the real unit (envirothon.js) has that concept and, through envmCk, no forbidden key
 *   · cpmLearn (the teacher's Key Concept view) builds the key with envmCk, so it reads what the mirror wrote
 *   · the Envirothon build keeps HAKEY and ENVMIRROR (strip_list.json names neither)
 *   run:  node test_envm_concept_key.js
 */
const fs=require("fs"), path=require("path");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,300):""));} };
const BAD=/[.#$\/\[\]]/;

const a=src.indexOf("// ENVMIRROR_START"), b=src.indexOf("// ENVMIRROR_END"); const block=src.slice(a,b);
ok("ENVMIRROR block present", a>0&&b>a);
ok("envmCk is declared in the block and used for the byConcept key", /function envmCk\(station,concept\)/.test(block) && /const ck=envmCk\(d\.station,card\.family\|\|card\.group\|\|"General"\)/.test(block));
ok("no raw <station>|<concept> key is built in the block any more", !/\(d\.station\|\|""\)\+"\|"\+\(card\.family/.test(block));
const hk=src.slice(src.indexOf("function haKeyOk("), src.indexOf("\n", src.indexOf("function haKey(")));
ok("haKeyOk + haKey sliced from HAKEY", /function haKeyOk\(/.test(hk) && /function haKey\(/.test(hk));

// the smallest world envSummary needs
const tierFn=src.slice(src.indexOf("function mastTierAtLeast(tier,gateTier){"), src.indexOf("}", src.indexOf("return a>=b;", src.indexOf("function mastTierAtLeast(tier,gateTier){")))+1);
function world(decks, withHaKey){
  const famCfg={ familyId:"fam", roster:[], envirothon:{ firebase:{ apiKey:"k", authDomain:"x.firebaseapp.com", databaseURL:"https://x-default-rtdb.firebaseio.com", projectId:"x", appId:"1:2:web:3" }, classId:"c1" } };
  const unitStudies={ nc_envirothon:{ id:"nc_envirothon", starter:"nc_envirothon", starterVer:1, cardsInCode:true, enrolled:{ kidA:true }, decks } };
  const masteryData={ kidA:[], kidA_custom_items:[], kidA_settings:{ cat_hold:{} } };
  return new Function("famCfg","unitStudies","masteryData","tierFn",`
    const window={ HA_FAMILY: famCfg }; let _haUnitsReady=true; const HA_LS={ getItem(){return null;}, setItem(){}, removeItem(){} };
    const document={ getElementById:()=>null }; const console={ log(){}, error(){} };
    function momHere(){ return true; } function _dryRun(){ return false; } function cap(s){ return s; }
    const MAST_TIER_ORDER=["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"]; const MAST_MASTERY_TIER_DEFAULT="monthly";
    ${tierFn}
    const ENV_UNIT_ID="nc_envirothon"; function envCardsInCode(u){ return !!(u&&u.cardsInCode); }
    ${withHaKey?hk:""}
    ${block}
    return { envSummary, envmCk };`)(famCfg,unitStudies,masteryData,tierFn);
}
const decks=[
  { key:"Current Issue · 2027", station:"cei", stage:0, n:3, cards:[ { name:"Prescribed burn", family:"Forest Management / Fire" }, { name:"Ladder fuel", family:"Forest Management / Fire" }, { name:"Carbon", family:"Climate" } ] },
  { key:"Forestry · Terms", station:"forestry", stage:0, n:1, cards:[ { name:"Cambium", family:"Tree Biology" } ] } ];
{ const w=world(decks,true); const s=w.envSummary("kidA"); const keys=Object.keys(s.byConcept);
  ok("three Key Concepts counted", keys.length===3, keys);
  ok("every byConcept key passes the SDK's key test (no . # $ / [ ])", keys.every(k=>!BAD.test(k)), keys);
  ok("the slashed concept is keyed haKey('cei|Forest Management / Fire') = 'cei|Forest Management %2F Fire'", s.byConcept["cei|Forest Management %2F Fire"] && s.byConcept["cei|Forest Management %2F Fire"].total===2, keys);
  ok("plain concepts keep their raw key byte for byte", s.byConcept["cei|Climate"] && s.byConcept["forestry|Tree Biology"], keys);
  ok("envmCk is haKey of the raw key, and idempotent", w.envmCk("cei","Forest Management / Fire")==="cei|Forest Management %2F Fire" && w.envmCk("cei","Climate")==="cei|Climate"); }
{ const w=world(decks,false); const s=w.envSummary("kidA");   // a build without HAKEY falls back to the raw key (never throws)
  ok("without haKey the block still runs (typeof guard) and keys raw", Object.keys(s.byConcept).length===3 && !!s.byConcept["cei|Forest Management / Fire"]); }

// the real unit
{ const g={}; const fn=new Function("window", fs.readFileSync(path.join(__dirname,"envirothon.js"),"utf8")); fn(g); const U=g.HoweEnvirothon; const ds=(U&&U.unit&&U.unit.decks)||[];
  const raw=new Set(), coded=new Set(); const w=world([],true);
  ds.forEach(d=>(d.cards||[]).forEach(c=>{ if(!c) return; const k=(d.station||"")+"|"+(c.family||c.group||"General"); raw.add(k); coded.add(w.envmCk(d.station,c.family||c.group||"General")); }));
  ok("the real unit has at least one concept whose raw key Firebase would refuse", [...raw].some(k=>BAD.test(k)), [...raw].filter(k=>BAD.test(k)));
  ok("through envmCk, none of the real unit's concept keys is refused", [...coded].every(k=>!BAD.test(k)), [...coded].filter(k=>BAD.test(k)));
  ok("coding loses no concept (same count raw and coded)", raw.size===coded.size, [raw.size,coded.size]); }

// the teacher's side builds the same key
{ const i=src.indexOf("function cpmLearn(g){"); const fn=src.slice(i, src.indexOf("\n}", i));
  ok("cpmLearn keys byConcept with envmCk (typeof-guarded), the same coded key", /const ck=\(typeof envmCk==="function"\)\?envmCk\(g\.sec,cpmRaw\(g\.c0\)\):g\.sec\+"\|"\+cpmRaw\(g\.c0\)/.test(fn));
  ok("no other site builds a raw <sec>|<concept> key against byConcept", (src.match(/byConcept\[[^\]]*\]/g)||[]).every(m=>/byConcept\[(ck|k)\]/.test(m)), src.match(/byConcept\[[^\]]*\]/g)); }
{ const sl=JSON.parse(fs.readFileSync(path.join(__dirname,"envirothon/build/strip_list.json"),"utf8")); const names=(sl.strip||[]).map(s=>s.name);
  ok("the Envirothon build strips neither HAKEY nor ENVMIRROR (the console reads the coded key)", !names.includes("HAKEY") && !names.includes("ENVMIRROR")); }

console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail?1:0);
