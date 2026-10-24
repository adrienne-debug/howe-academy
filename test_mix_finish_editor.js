/*
 * MIXFINISH_EDIT (her yes 2026-10-23). The Daily Mix's finish line (mixFinish, MIX_FINISH 10/21) couldn't be set: the editor's stepper sat
 * inside `if (!isMix)` and the save line inside the deck/Daily Study branches, both behind `kind === "mix"`, so every Mix ran at 20.
 * Lincoln has 88 reviews waiting; she wants his at 60. This drives the real editor (open → stepper → save → list) in a VM.
 * run: node test_mix_finish_editor.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const block=cut("// MIXFINISH_EDIT_START","// MIXFINISH_EDIT_END");

function mk(sessions){
  const writes=[];
  const ctx={console,Object,Array,String,Number,parseInt,Math,JSON,Date,Set,Map,Infinity,
    masteryData:{lincoln:[],lincoln_sessions:JSON.parse(JSON.stringify(sessions||{}))}, masteryKid:"lincoln", mhqKid:"lincoln",
    mastDrillSettings:()=>({ladder:["every_other_day","weekly","bi_weekly","monthly","graduated"]}), mastGetPrintNum:()=>201,
    mhqSessValidate:()=>({ok:true}), _mhqSlug:(n)=>String(n).toLowerCase().replace(/\W+/g,"_"), renderAll:()=>{},
    mhqDeckStats:()=>[{deck:"German",learning:0,active:0,bank:0}], mhqDeckOwner:()=>null, mhqEsc:s=>String(s), mhqArgEsc:s=>String(s),
    _mhqPill:(l,on,oc)=>'<button onclick="'+oc+'">'+l+'</button>', mhqTierLbl:t=>t, NB_PACE_DAYS:10, NB_ROLE_LBL:{}, mastIntroDotsFor:()=>null,
    nbBudgetCardHtml:()=>"", nbSessionToday:()=>null, gwGetSubjects:()=>({}), mhqMigrationPreview:()=>({}), _mhqMigrationSentence:()=>"",
    mastFullBank:()=>({}), mastAdminLocal:true, mastAdminWaitingHtml:()=>"", mastAdminInit:()=>{},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),remove:()=>writes.push(["remove",p])})},
    HA_LS:{setItem:()=>{},getItem:()=>null}, writes};
  ctx.mstMixSession=k=>ctx.get("mstSessions('"+k+"')").find(s=>s.kind==="mix")||null;
  vm.createContext(ctx);
  vm.runInContext(cut("const MST_SESSION_DEFAULTS =","\n};")+"\n};\n"+cut("const MST_PATTERN_MODES",";\n")+";\n"+cut("const MST_HOWTO_MAX",";\n")+";\n"+
    "let mhqSessEdit = null, mhqSessForm = null, mhqSessErr = '';\n"+block+"\n"+
    ["mstPatternClean","mstHowtoClean","mstSessions","mhqSessOpen","mhqSessClose","mhqSessSet","mhqSessSave","mhqSessionRows","_mhqStepper","_mhqRenderSessForm","_mhqRenderSessions"].map(fn).join("\n")+
    "\nfunction _get(e){ return eval(e); }",ctx);
  ctx.get=e=>ctx._get(e);
  return ctx;
}
// The number shown in the Finish line stepper, and its +/- clicks
const finishStepper=h=>{ const i=h.indexOf(">Finish line<"); if(i<0) return null; const seg=h.slice(i,i+900);
  const m=seg.match(/<span[^>]*>(\d+)<\/span>/); const clicks=[...seg.matchAll(/onclick="(mhqSessSet\('mixFinish',\d+\))"/g)].map(x=>x[1]);
  return { val:m?+m[1]:null, minus:clicks[0], plus:clicks[1] }; };
const lastSet=c=>{ const w=c.writes.filter(x=>x[0]==="set"); return w[w.length-1]; };

const BASE={ daily_mix:{name:"Daily Mix",emoji:"🧠",kind:"mix",who:"solo",audio:"off"},
  german:{name:"German",kind:"deck",decks:["German"],newPerDay:5,passes:2,mixInAt:"weekly",handOffAt:"bi_weekly"},
  ds:{name:"Daily Study",kind:"all",newPerDay:5,passes:2,mixInAt:"weekly",handOffAt:"bi_weekly",maxCards:12,focusDecks:3} };

console.log("1. The Mix form shows the Finish line");
{ const c=mk(BASE); c.get("mhqSessOpen('daily_mix')"); const h=c.get("_mhqRenderSessForm('lincoln')"); const st=finishStepper(h);
  ok("existing Mix with no saved value shows the stepper at 20", st&&st.val===20, st);
  ok("it sits right after the Who studies pills", h.indexOf(">Finish line<")>h.indexOf("Who studies")&&h.indexOf(">Finish line<")<h.indexOf(">Audio<"));
  ok("with the hint", h.includes("done at this many; Keep going for the rest. 0 = all"));
  ok("the Mix form still hides deck-only controls", !h.includes("New/day")&&!h.includes("Cards a sitting")); }
{ const c=mk(Object.assign({},BASE,{daily_mix:Object.assign({},BASE.daily_mix,{mixFinish:45})})); c.get("mhqSessOpen('daily_mix')");
  const st=finishStepper(c.get("_mhqRenderSessForm('lincoln')")); ok("a saved value (45) shows as 45", st&&st.val===45, st); }
{ const c=mk({}); c.get("mhqSessOpen('__new_mix')"); const st=finishStepper(c.get("_mhqRenderSessForm('lincoln')"));
  ok("a new Mix starts at 20", st&&st.val===20, st); }
{ const c=mk(BASE); c.get("mhqSessOpen('german')"); ok("a deck session's form has no Finish line", !c.get("_mhqRenderSessForm('lincoln')").includes(">Finish line<"));
  c.get("mhqSessOpen('ds')"); ok("Daily Study's form has no Finish line", !c.get("_mhqRenderSessForm('lincoln')").includes(">Finish line<")); }

console.log("2. Changing it and saving writes mixFinish on the Mix record");
{ const c=mk(BASE); c.get("mhqSessOpen('daily_mix')");
  for(let i=0;i<40;i++){ const st=finishStepper(c.get("_mhqRenderSessForm('lincoln')")); c.get(st.plus); }
  ok("40 taps on + reads 60", finishStepper(c.get("_mhqRenderSessForm('lincoln')")).val===60);
  c.get("mhqSessSave()"); const w=lastSet(c);
  ok("saved to mastery/lincoln_sessions/daily_mix with mixFinish 60", w&&w[1]==="mastery/lincoln_sessions/daily_mix"&&w[2].mixFinish===60&&w[2].kind==="mix", w);
  ok("one targeted set, nothing else", c.writes.length===1, c.writes);
  ok("the local copy matches", c.masteryData.lincoln_sessions.daily_mix.mixFinish===60);
  ok("reopening shows 60", (c.get("mhqSessOpen('daily_mix')"), finishStepper(c.get("_mhqRenderSessForm('lincoln')")).val===60)); }
{ const c=mk(BASE); c.get("mhqSessOpen('daily_mix')"); c.get("mhqSessSave()");
  ok("saving untouched writes the default 20", lastSet(c)[2].mixFinish===20, lastSet(c)); }
{ const c=mk(Object.assign({},BASE,{daily_mix:Object.assign({},BASE.daily_mix,{mixFinish:1})})); c.get("mhqSessOpen('daily_mix')");
  const st=finishStepper(c.get("_mhqRenderSessForm('lincoln')")); c.get(st.minus);
  ok("minus from 1 reads 0, and 0 can't go lower", finishStepper(c.get("_mhqRenderSessForm('lincoln')")).val===0&&/mhqSessSet\('mixFinish',0\)/.test(finishStepper(c.get("_mhqRenderSessForm('lincoln')")).minus));
  c.get("mhqSessSave()"); ok("0 saves as 0 (all)", lastSet(c)[2].mixFinish===0, lastSet(c)); }
{ const c=mk({}); c.get("mhqSessOpen('__new_mix')"); c.get("mhqSessSet('mixFinish',30)"); c.get("mhqSessSave()");
  ok("a new Mix saves its finish line", lastSet(c)[2].mixFinish===30&&lastSet(c)[2].kind==="mix", lastSet(c)); }

console.log("3. Deck and Daily Study never get mixFinish");
{ const c=mk(BASE); c.get("mhqSessOpen('german')"); c.get("mhqSessSave()");
  ok("deck save has no mixFinish", !("mixFinish" in lastSet(c)[2]), lastSet(c));
  c.get("mhqSessOpen('ds')"); c.get("mhqSessSet('mixFinish',60)"); c.get("mhqSessSave()");
  ok("Daily Study save has no mixFinish, even if the form had one", !("mixFinish" in lastSet(c)[2]), lastSet(c));
  c.get("mhqSessOpen('__new_deck')"); c.get("mhqSessSet('name','Spanish')"); c.get("mhqSessSave()");
  ok("new deck save has no mixFinish", !("mixFinish" in lastSet(c)[2]), lastSet(c)); }

console.log("4. The sessions list shows it");
{ const c=mk(Object.assign({},BASE,{daily_mix:Object.assign({},BASE.daily_mix,{mixFinish:60})})); const h=c.get("_mhqRenderSessions('lincoln')");
  ok("the Mix row says Finish line 60", h.includes("Finish line 60"));
  ok("only the Mix row has a Finish line", (h.match(/Finish line \d/g)||[]).length===1);
  const rows=c.get("mhqSessionRows('lincoln')"); ok("deck/Daily Study rows carry no mixFinish", rows.filter(r=>r.kind!=="mix").every(r=>r.mixFinish===undefined)); }
{ const c=mk(BASE); ok("a Mix with no saved value says Finish line 20", c.get("_mhqRenderSessions('lincoln')").includes("Finish line 20")); }
{ const c=mk(Object.assign({},BASE,{daily_mix:Object.assign({},BASE.daily_mix,{mixFinish:0})})); ok("0 says Finish line 0 (all)", c.get("_mhqRenderSessions('lincoln')").includes("Finish line 0 (all)")); }

console.log("5. Source");
ok("the dead form line inside if (!isMix) is gone", !/if \(f\.kind === "mix"\) h \+= '<div><div style="' \+ lbl \+ '">Mix finish line/.test(src));
{ const save=fn("mhqSessSave"); ok("mhqSessSave sets mixFinish exactly once, outside the deck/all branches", (save.match(/rec\.mixFinish =/g)||[]).length===1&&save.indexOf("rec.mixFinish =")>save.lastIndexOf('if (mhqSessForm.kind === "all")')+0&&save.indexOf("rec.mixFinish =")>save.indexOf("rec.skipDecks")); }
ok("mstPile is untouched by this block", !block.includes("mstPile("));
ok("no 🔀", !src.includes("\u{1F500}"));

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
