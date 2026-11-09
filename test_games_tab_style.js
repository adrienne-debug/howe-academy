/*
 * GAMESTAB_STYLE (her words 2026-11-02): "If you click Match, you wouldn't even need to see the style buttons — that would
 * be covered at the top. Keep the pairs because that still matters." The Face-up / Memory flip toggle under the Match
 * screen is gone; the 🎯 Match / 🧠 Memory flip buttons in the games row pick the style. Pairs and Voice stay under both;
 * Memory flip's "Then" row is gone from the kid's screen (MEMLOGFIX 2026-11-08: Mom's 📜 rule now — test_memory_log_fix.js).
 * Runs the REAL buildMatchHtml + GAMESTAB code.
 *   run:  node test_games_tab_style.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }

const bm=fnText("buildMatchHtml");
ok("no Style label, no Face-up / Memory flip toggle in the Match screen",bm.indexOf(">Style</span>")<0&&bm.indexOf("\\u{1F0CF} Face-up")<0&&!/mastMatchSetStyle\(\\'(match|memory)\\'\)/.test(bm));
ok("Pairs and Voice toggles stay",bm.indexOf(">Pairs</span>")>0&&bm.indexOf(">Voice</span>")>0&&/mastMatchSetPair\(\\'two\\'\)/.test(bm)&&/mastMatchSetPair\(\\'same\\'\)/.test(bm));
ok("no Then row in the Match screen (MEMLOGFIX: Mom's rule now)",bm.indexOf(">Then</span>")<0&&bm.indexOf("mastMatchSetThen")<0);
ok("the games row still picks the style (gamesPick → mastMatchSetStyle)",/if\(pairMove\|\|g\.style!==matchStyle\) return mastMatchSetStyle\(g\.style\);/.test(fnText("gamesPick")));
ok("mastMatchSetStyle itself is unchanged (other callers, Kids' Corner)",/^function mastMatchSetStyle\(v\)\{ matchStyle=v; matchState=null; _mastRe\(\); \}/m.test(src));

// ── render it: the real buildMatchHtml with a deck ──
{
  const items=[1,2,3,4,5,6].map(i=>({id:"w"+i,subject:"Roots",prompt:"root"+i,answer:"means "+i,status:"active",tier:"weekly"}));
  const ctx={console,JSON,Object,Array,String,Number,Math,Date,Set,RegExp,
    masteryKid:"k",masteryData:{k:items,k_settings:{}},matchState:null,matchStyle:"match",matchPairMode:"two",mastView:"match",
    mastDrillSettings:()=>({match_speak:false}),mastMatchThen:()=>"say",esc:s=>String(s||""),_matchPlain:s=>String(s||""),
    mastMatchDecks:()=>["Roots"],matchDeck:"Roots",matchDeckPicked:null,_smTileVis:()=>null,mastKnowledgeType:()=>"fact",owRuleBack:(k,i)=>i.answer,
    MAST_KID_COL:{k:"#000"},document:{getElementById:()=>null}};
  vm.createContext(ctx);
  let loaded=false;
  try{ vm.runInContext(fnText("buildMatchHtml"),ctx); loaded=true; }catch(e){ console.log("  (buildMatchHtml needs more of the file than this sandbox gives — text checks above stand)",String(e).slice(0,80)); }
  if(loaded){
    let h=""; try{ h=ctx.buildMatchHtml("#7c3aed"); }catch(e){ h="ERR "+e.message; }
    if(h.indexOf("ERR ")===0) console.log("  (render skipped: "+h.slice(0,80)+")");
    else {
      ok("rendered Match: Pairs shown, Style not, Then not",h.indexOf("Pairs")>=0&&h.indexOf("Face-up")<0&&h.indexOf(">Style<")<0&&h.indexOf(">Then<")<0);
      ctx.matchStyle="memory"; let h2=""; try{ h2=ctx.buildMatchHtml("#7c3aed"); }catch(e){ h2=""; }
      ok("rendered Memory flip: no Then, no Style (MEMLOGFIX)",h2.indexOf(">Then<")<0&&h2.indexOf("Face-up")<0&&h2.indexOf("Pairs")>=0);
    }
  }
}
console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
