/*
 * test_fixtures/ledger_l5_out.js — slice L5 (↩ Send back, FLAGONE) taken out of this tree, for the tests whose "app before" is this tree
 * minus an older feature that shares L5's lines (test_ledger_sendback, test_flag_mark_who, test_ledger_rules). Each piece must match
 * exactly once, or the caller stops loudly.
 *   const L5=require("./test_fixtures/ledger_l5_out.js"); L5.idx(indexSrc) · L5.hjs(houseSrc)
 */
"use strict";
const once = (src, what, from, to, label) => { const n = typeof from === "string" ? src.split(from).length - 1 : (src.match(from) || []).length;
  if (n !== 1) throw new Error("ledger_l5_out: L5 cannot be taken out — " + label + " found " + n + "× in " + what + " (must be exactly once)"); return src.replace(from, () => to); };
const IDX_PIECES = [
  [/^\/\/ FLAGONE_START[^\n]*\n[\s\S]*?^\/\/ FLAGONE_END\n/m, "", "the FLAGONE block"],
  [`function flagMarkTxt(r){ return r&&r.flagBy?"🚩 "+(r.sb?"Wasn't done · ":"")+"by "+flagWhoName(r.flagBy)+" · "+(r.penalty===0?"no stars taken":"−"+(-r.penalty||100)):""; }   // FLAGONE: the amount taken`,
   `function flagMarkTxt(r){ return r&&r.flagBy?"🚩 by "+flagWhoName(r.flagBy)+" · "+(r.penalty===0?"no stars taken":"−100"):""; }`, "flagMarkTxt"],
  [`(arguments[2]?"The 🔎 spot check's ✗ already took "+arguments[2]+" ⭐":starTakeOk(kid)?"The penalty is off":starTakeWhy(kid))+", so no stars come off.`, `starTakeWhy(kid)+", so no stars come off.`, "flagOffAsk"],
  [`  const who=(typeof momHere==="function"&&momHere())?"mom":"dad", sp=flagSpotTook(kid,kind,ref), n=flagN(kid,kind,ref), off=!n;   // FLAGWHO · FLAGONE: no penalty (off, Take stars away off, ⏸, SPOTONE) → the 🚩 mark, no stars`,
   `  const who=(typeof momHere==="function"&&momHere())?"mom":"dad", off=typeof starTakeOk==="function"&&!starTakeOk(kid);   // FLAGWHO: Take stars away off → the 🚩 mark, no stars (as the Click-off Log's ⚠️)`, "🧾's who"],
  [String.raw`    if(!confirm(off?flagOffAsk(kid,rec.label||label||"",sp):"Dock "+n+" points from "+cap(kid)+" for a false check-off?\n\n\""+(rec.label||label||"")+"\"")) return;
    flagSet(kid,rec,"routineLog/"+kid+"/"+p[0]+"/"+p[1]+"/"+p[2],"flg_"+p.join("_"),"🚩 false check-off dock — "+(rec.label||label||"")+" · by "+flagWhoName(who),who,null,n);   // FLAGWHO · FLAGONE`,
   String.raw`    if(!confirm(off?flagOffAsk(kid,rec.label||label||""):"Dock 100 points from "+cap(kid)+" for a false check-off?\n\n\""+(rec.label||label||"")+"\"")) return;
    if(!off) bankDirect(kid,-100,"🚩 false check-off dock — "+(rec.label||label||"")+" · by "+flagWhoName(who));   // FLAGWHO
    const patch={flagged:true,penalty:off?0:-100,flagTs:nowTs(),flagBy:who}; Object.assign(rec,patch);
    if(db&&!_dryRun()) db.ref("routineLog/"+kid+"/"+p[0]+"/"+p[1]+"/"+p[2]).update(patch);`, "🧾's step"],
  [String.raw`    if(!confirm((off?flagOffAsk(kid,label||"",sp):"Dock "+n+" points from "+cap(kid)+" for a false check-off?\n\n\""+(label||"")+"\"")+"\n\n(The card stays checked — use “"+cw("fixFalse")+"” in the subject sheet to undo the record.)")) return;
    const patch=flagSet(kid,h,WK+"/history/"+ref,"flg_"+WK+"_"+ref,"🚩 false check-off dock — "+(label||"")+" · by "+flagWhoName(who),who,null,n);   // FLAGWHO · FLAGONE
    try{ const hs=ld(WK+"_history")||{}; if(hs[ref]){ Object.assign(hs[ref],patch); sv(WK+"_history",hs); } }catch(e){}`,
   String.raw`    if(!confirm((off?flagOffAsk(kid,label||""):"Dock 100 points from "+cap(kid)+" for a false check-off?\n\n\""+(label||"")+"\"")+"\n\n(The card stays checked — use “"+cw("fixFalse")+"” in the subject sheet to undo the record.)")) return;
    if(!off) bankDirect(kid,-100,"🚩 false check-off dock — "+(label||"")+" · by "+flagWhoName(who));   // FLAGWHO
    const patch={flagged:true,penalty:off?0:-100,flagTs:nowTs(),flagBy:who}; Object.assign(h,patch);
    try{ const hs=ld(WK+"_history")||{}; if(hs[ref]){ Object.assign(hs[ref],patch); sv(WK+"_history",hs); } }catch(e){}
    if(db&&!_dryRun()) db.ref(WK+"/history/"+ref).update(patch);`, "🧾's card"],
  [`  dbg("🚩 "+(off?"mark, no stars,":"dock −"+n)+" "+kid`, `  dbg("🚩 "+(off?"mark, no stars,":"dock −100")+" "+kid`, "🧾's debug line"],
  [`    const items=ckLogToday(), canDock=ckLogCanDock(), fl=flagLbl(), fP=spPenalty(); if(!items.length) return "";   // FLAGONE`, `    const items=ckLogToday(), canDock=ckLogCanDock(); if(!items.length) return "";`, "🧾's amount"],
  [`'docked −'+(-i.penalty||100))+'" style="flex-shrink:0;font-size:11px;font-weight:800;color:#b91c1c">'+(flagMarkTxt(flagRec(i.kind,i.kid,i.ref)||i)||'🚩 −100')+'</span>'+flagUndoBtn(i.kind,i.kid,i.ref);   // FLAGWHO · FLAGONE: undo`,
   `'docked −100')+'" style="flex-shrink:0;font-size:11px;font-weight:800;color:#b91c1c">'+(flagMarkTxt(i)||'🚩 −100')+'</span>';   // FLAGWHO`, "🧾's mark"],
  [`title="Didn’t actually do it — '+(fP.on?'dock '+fP.pts:'mark it')+'" style="flex-shrink:0;padding:3px 9px;border-radius:8px;border:1px solid #ef4444;background:#fff;color:#ef4444;font-size:11px;font-weight:800;cursor:pointer;font-family:\\'DM Sans\\',sans-serif">'+fl+'</button>';`,
   `title="Didn’t actually do it — dock 100" style="flex-shrink:0;padding:3px 9px;border-radius:8px;border:1px solid #ef4444;background:#fff;color:#ef4444;font-size:11px;font-weight:800;cursor:pointer;font-family:\\'DM Sans\\',sans-serif">−100</button>';`, "🧾's button"],
  [`A dock takes '+(fP.on?fP.pts+' ⭐ from the Star Bank':'no stars (the penalty is off)')+' and marks the line.`, `A dock takes 100 ⭐ from the Star Bank and marks the line.`, "🧾's foot"],
  [`🔒 Put your code in under Star controls to use '+fl+'.</div>';`, `🔒 Put your code in under Star controls to use −100.</div>';`, "🧾's lock line"],
  [`to use ⚠️ '+flagLbl()+'.</div>')`, `to use ⚠️ −100.</div>')`, "Dad's Click-off Log's lock line (DADSPOTLOG)"],
  [`tap ⚠️ '+flagLbl()+(spPenalty().on?' to dock '+spPenalty().pts+' points.':' to mark it.')+'</div>';`, `tap ⚠️ −100 to dock 100 points.</div>';`, "the log's words"],
  [`title="Didn\\'t actually do it — '+(spPenalty().on?'dock '+spPenalty().pts+' points':'mark it')+'" style="flex-shrink:0;padding:4px 9px;border-radius:8px;border:1.5px solid #fca5a5;background:#fef2f2;color:#b91c1c;font-size:11px;font-weight:800;cursor:pointer">⚠️ '+flagLbl()+'</button>';
      else if(e.flagged) h+=flagUndoBtn("step",kid,_rlwk+"/"+e._day+"/"+e._key);   // FLAGONE: undo`,
   `title="Didn\\'t actually do it — dock 100 points" style="flex-shrink:0;padding:4px 9px;border-radius:8px;border:1.5px solid #fca5a5;background:#fef2f2;color:#b91c1c;font-size:11px;font-weight:800;cursor:pointer">⚠️ −100</button>';`, "the log's ⚠️"],
  [String.raw`  const sp=flagSpotTook(kid,"step",wk+"/"+d+"/"+key), n=flagN(kid,"step",wk+"/"+d+"/"+key), off=!n, who=typeof flagWho==="function"?flagWho():"mom";   // FLAGWHO · FLAGONE: no penalty (off, Take stars away off, ⏸, SPOTONE) → the 🚩 mark, no stars
  if(!confirm(off?flagOffAsk(kid,rec.label||"",sp):"Dock "+n+" points from "+cap(kid)+" for a false check-off?\n\n\""+(rec.label||"")+"\"")) return;
  flagSet(kid,rec,"routineLog/"+kid+"/"+wk+"/"+d+"/"+key,"flg_"+wk+"_"+d+"_"+key,"🚩 false check-off dock"+(typeof flagWhoName==="function"?" · by "+flagWhoName(who):""),who,null,n);   // FLAGONE`,
   String.raw`  const off=typeof starTakeOk==="function"&&!starTakeOk(kid), who=typeof flagWho==="function"?flagWho():"mom";   // FLAGWHO: Take stars away off → the 🚩 mark, no stars
  if(!confirm(off?flagOffAsk(kid,rec.label||""):"Dock 100 points from "+cap(kid)+" for a false check-off?\n\n\""+(rec.label||"")+"\"")) return;
  if(!off) bankDirect(kid,-100,"🚩 false check-off dock"+(typeof flagWhoName==="function"?" · by "+flagWhoName(who):""));
  const patch={flagged:true,penalty:off?0:-100,flagTs:nowTs(),flagBy:who};
  Object.assign(rec,patch);
  if(db&&!(typeof _dryRun==="function"&&_dryRun())) db.ref("routineLog/"+kid+"/"+wk+"/"+d+"/"+key).update(patch);`, "rlogFlag"],
  [/^ {2}const _fm=r==="no"&&pen\.on&&typeof flagSpotMark[^\n]*SPOTONE[^\n]*\n/m, "", "spResolve's SPOTONE line"],
  [`+(_fm?"\\n\\nIt is already marked 🚩 by "+_fm+", so no more stars come off.":"")`, "", "spResolve's SPOTONE words"],
  [`Missing = ON at 100 (her\n//   answer 2026-11-21 to the ledger design's question 2, "ON at 100"; was OFF: DeWalt shares this code).`, `Missing = OFF (DeWalt\n//   shares this code; Adrienne turns it on for Howe).`, "the spot check's comment"],
  [`// −pts on ✗ Not done — on at 100 unless she turned it off (FLAGONE: the one penalty, also the 🚩's and ↩ Send back's).\nfunction spPenalty(){ const p=(spotSet&&spotSet.penalty)||{}; const n=parseInt(p.pts,10); return {on:p.on!==false,`,
   `// −pts on ✗ Not done — off unless she turned it on.\nfunction spPenalty(){ const p=(spotSet&&spotSet.penalty)||{}; const n=parseInt(p.pts,10); return {on:p.on===true,`, "spPenalty's default"]
];
const HJS_PIECES = [
  [/^\/\/ LEDGERSB_START[^\n]*\n[\s\S]*?^\/\/ LEDGERSB_END\n/m, "", "the LEDGERSB block"],
  [/^ {8}if\(typeof lgSbRow==="function"\) lgSbRow\(r,kid,D,"s:"\+slot\+":"\+i\);[^\n]*\n/m, "", "the list row hook"],
  [/^ {6}if\(typeof lgSbMore==="function"\) lgSbMore\(rows,kid,D,slot\);[^\n]*\n/m, "", "the extra rows hook"],
  [/^ {8}if\(typeof lgSbRow==="function"\) lgSbRow\(r,kid,D,"a:"\+it\.id\);[^\n]*\n/m, "", "the 🌅 row hook"],
  ["+(r.sbH||'')+(r.xH||'')", "+(r.xH||'')", "the drawing hook"],
  [`the Click-off Log\\'s ⚠️, 🧾 Today\\'s check-offs\\' −100 and ↩ Send back\\'s 🚩 Wasn\\'t done. Off:`, `and the −100 on the Click-off Log and on 🧾 Today\\'s check-offs. Off:`, "the ⚙ panel's Take stars away words"],
  [`The Click-off Log's ⚠️, 🧾 and ↩ Send back's 🚩 Wasn't done use it too."`, `The −100 on the Click-off Log and 🧾 is always 100."`, "the ⚙ panel's Penalty line"]
];
const build = (s, P, what) => { for (const [a, b, l] of P) s = once(s, what, a, b, l); return s; };
module.exports = { idx: s => build(s, IDX_PIECES, "index.html"), hjs: s => build(s, HJS_PIECES, "house.js"), IDX_PIECES, HJS_PIECES };
