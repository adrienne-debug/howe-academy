/*
 * ENVTYPE1 (her rule 2026-11-16): on the 🌿 quiz, Type it stays only for one-word answers — and then the question is on the
 * face and the answer is typed. Every other 🌿 card learns on the pattern without Type it, at the start of a sitting and on a
 * resumed one. Other sessions (German) unchanged.   run: node test_env_type_oneword.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b); if(i<0||j<0){ console.log("FAIL- block missing "+a); process.exit(1); } return src.slice(i,j); };
const fnTA=(()=>{ const i=src.indexOf("function mstTypeAnsOn("); const j=src.indexOf("\n}\n",i); return src.slice(i,j+3); })();
const block=cut("// ── MST_ENGINE_START ──","// ── MST_ENGINE_END ──")
  +cut("// ── Persistence (resumable sitting, same-day only)","// MSTREPICK_END")
  +cut("// ENVTYPE1_START","// ENVTYPE1_END")+fnTA;
const DEFS={"What is the largest reservoir of water on Earth?":"oceans","What does a Biltmore stick measure?":"tree diameter and height","Q pic":"White oak"};
const store={};
const ENV={sid:"envirothon",name:"Envirothon",kind:"deck",passes:2,pattern:["pick","ideas","type"]};
const GER={sid:"german",name:"German",kind:"deck",passes:3,pattern:["rec","say","type"]};
const ctx={console,Math,Object,Array,String,Number,JSON,Set,Date,ENV_SESSION_SID:"envirothon",ENV,GER,
  masteryKid:"lincoln", masteryData:{lincoln:[
    {id:"one",subject:"General",prompt:"What is the largest reservoir of water on Earth?",tally_dots:2,status:"introduction"},
    {id:"many",subject:"Forestry",prompt:"What does a Biltmore stick measure?",tally_dots:2,status:"introduction"},
    {id:"pic",subject:"Trees",prompt:"Q pic",tally_dots:2,status:"introduction"},
    {id:"day2",subject:"Forestry",prompt:"What does a Biltmore stick measure?",tally_dots:1,status:"introduction"}]},
  MAST_TIER_ORDER:[],MAST_TIER_INT:{},mastDrillSettings:()=>({}),mastIntroDotsFor:()=>3,mastIsDue:()=>false,mastIsParked:()=>false,mastIsNeverDrill:()=>false,mastFullBank:()=>({}),
  mstCardDef:c=>DEFS[c.name]||"", mstCardPic:c=>c&&c.name==="Q pic"?"pic.jpg":"", mstIsRuleCard:()=>false, mstIsSpellCard:()=>false,
  mstTodayKey:()=>"2026-11-16", mstStorageKey:(k,s)=>k+"|"+s,
  HA_LS:{setItem:(k,v)=>{store[k]=v;},getItem:k=>store[k]==null?null:store[k],removeItem:k=>{delete store[k];}}};
vm.createContext(ctx); vm.runInContext(block,ctx);
vm.runInContext('MST_PATTERN_MODES.push("pick"); MST_PATTERN_MODES.push("ideas"); var CUR=ENV; mstSessions=function(){ return [CUR]; };',ctx);
const R=c=>vm.runInContext(c,ctx);
const start=(sessName,learning)=>R(`(function(){ var it=masteryData.lincoln, S=${sessName};
  return mstSittingInit({reviews:[],learning:[${learning}].map(function(i){return it[i];}),newNames:[{deck:"Forestry",name:"What does a Biltmore stick measure?"},{deck:"General",name:"What is the largest reservoir of water on Earth?"}]},S,
   {dotsNeeded:function(){return 3;},noType:function(c){ return mstEnvNoType(S,c); }}); })()`);

console.log("🔤 one word or not");
ok("\"oceans\" is one word", R('mstOneWord("oceans")')===true);
ok("\"oceans.\" is one word", R('mstOneWord(" oceans. ")')===true);
ok("\"tree diameter and height\" is not", R('mstOneWord("tree diameter and height")')===false);
ok("an empty answer is not", R('mstOneWord("")')===false);

console.log("🌿 a day-3 sitting (Pick it → Key ideas → Type it)");
{ const st=start("ENV","0,1,2,3"); const c=st.cards;
  ok("one-word answer keeps Type it", c["l:one"].mode==="type", c["l:one"]);
  ok("many-word answer: Type it comes off → Key ideas", c["l:many"].mode==="ideas", c["l:many"]);
  ok("…and day 3 repeats day 2's Key ideas → 1 right needed", c["l:many"].passes===1, c["l:many"]);
  ok("same card on day 2 → Key ideas, a new step (full passes)", c["l:day2"].mode==="ideas"&&c["l:day2"].passes===undefined, c["l:day2"]);
  ok("picture card keeps its own step", c["l:pic"].mode==="type");
  ok("new cards still start on Pick it", c["n:Forestry|What does a Biltmore stick measure?"].mode==="pick");
  ctx.CARD1=c["l:one"]; ctx.CARDM=c["l:many"]; ctx.CARDP=c["l:pic"];
  ok("one-word Type it card shows the question, types the answer", R("mstTypeAnsOn(ENV,CARD1)")===true);
  ok("a Key ideas card is not a typing card", R("mstTypeAnsOn(ENV,CARDM)")===false);
  ok("picture card isn't switched to Type the answer", R("mstTypeAnsOn(ENV,CARDP)")===false);
}
console.log("🇩🇪 German unchanged");
{ const st=start("GER","1"); const c=st.cards;
  ok("German day 3 Type it stays even for a many-word meaning", c["l:many"].mode==="type", c["l:many"]);
  ctx.G=c["l:many"]; ok("…and stays the German face (not Type the answer)", R("mstTypeAnsOn(GER,G)")===false);
}
console.log("📌 Pattern only Type it");
{ ctx.ENV.pattern=["type"]; const st=start("ENV","1,0"); ctx.ENV.pattern=["pick","ideas","type"];
  ok("many-word card → plain flip", st.cards["l:many"].mode===undefined, st.cards["l:many"]);
  ok("one-word card → Type it", st.cards["l:one"].mode==="type");
}
console.log("💾 a sitting saved before this change is fixed on resume");
{ R(`mstState=mstSittingInit({reviews:[],learning:[masteryData.lincoln[1],masteryData.lincoln[0]],newNames:[]},ENV,{dotsNeeded:function(){return 3;}});
     mstSid="envirothon"; mstHist=[]; mstRedo=[]; mstStartTs=1; mstPersist(); mstState=null;`);
  ok("old sitting had Type it on the many-word card", JSON.parse(store["lincoln|envirothon"]).state.cards["l:many"].mode==="type");
  R('mstRestoreSitting("envirothon")');
  ok("resumed: many-word card → Key ideas", R('mstState.cards["l:many"].mode')==="ideas");
  ok("resumed: one-word card keeps Type it", R('mstState.cards["l:one"].mode')==="type");
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
