// games.js — 🎮 THE PRACTICE GAMES: Brain Dump, Go Fish, Bingo, Sort it, Whack-a-mole, Jeopardy (with 💵 money and its judging),
// Teach it, Connect Four, Battleship, Beat my time, True / Not true, Sure? then flip, Categories, Unjumble, Kaboom, Hangman,
// Name all and the Picture Puzzle. Moved VERBATIM out of index.html on 2026-11-08 (LAZYSPLIT, PLAN_lg_performance_2026-11-08.md
// Part 2 step 2 — her words 11/8: the LG StanbyME "gets slow every week"; on the LG she uses drills and study sessions).
//   · Loaded ONCE, on the first look at the 🎮 Games section (gamesSubHtml / gamesBodyHtml / gamesOpen) or Mom's games grid
//     (gameDecksHtml), as a classic <script> by haLazyLoad("games") in index.html; its functions and top-level const/let land
//     in the page's one global scope, exactly as when they sat in index.html.
//   · What stays in index.html: the Games tab and its list (GAMESTAB, GAMEGRID), the per-kid park / restore (GAMEKID), the
//     log, rules, likes and the shared judge (GAMELOG, GAMERULES, GAMELIKE, GAMEJUDGE), and every game a study sitting or a drill
//     uses — Match / Memory flip, Which one? (and the missed-card play), Build it, the ABC Train (pre-K study) and TMAP.
//   · EDIT THE CODE HERE. Each block's place in index.html is its marker line `// ⇢ games.js: NAME`; test_src.js puts the
//     blocks back at their markers so the tests read one source.
//   · Runs after index.html's main script (never before): its top-level lines read index.html's tables (GAME_RULES, …).
// BRAINDUMP_START — 💭 "Brain Dump" (her "yeah" 2026-11-02; PLAN_practice_games_2026-10-23.md build #5 Brain Dump / Name all N, Tier 3–4).
// Free recall, the strongest retrieval format in the research (Karpicke & Blunt 2011): the kid picks a deck and names every card
// they can, typed one at a time — the deck is the answer key. Nothing is listed, hinted or auto-completed while they type: a name
// typed and entered becomes a chip, ✓ green when it is in the deck, grey when it isn't (no correction yet). A running "7 of 20".
//   Hit   = the typed name equals a card's front after the Study Session's normalizer (mstNormAns: case, punctuation, umlauts).
//   Close = one letter off (two for a long name), or the article / a trailing "(…)" left off — counts as named; the recap shows the
//           card's own spelling. A name typed twice is ignored; a name not in the deck is kept as "not in this deck" (not wrong).
//   Timer = none to beat (plan §2.5: time only mastered material). A quiet elapsed clock, an "I'm done" button, and the round stops
//           itself at DUMP_SECS. Time while the kid is switched away (GAMEKID park) is not play time.
//   Misses come back once (plan §2.3): each missed card is asked as its BACK → type the name — the retrieval they missed, one try;
//           wrong → the right name is shown, marked ✗. At most DUMP_REASK misses, the ones lowest on the ladder first; the rest are
//           listed in the recap. The round therefore ends in retrieval, then the recap: named N of M, close ones, re-asked ✓/✗, the
//           rest of the misses, "not in this deck" in grey. Confetti (no song) only when every card was named.
// A deck qualifies when it has DUMP_MIN+ distinct cards whose FRONT is a name (dumpNameable: short, not a sentence / question / math
//   fact / rule example) and that have a text back (answer, Our words, or the definitions map); spelling and phonogram decks stay out
//   (Which one?'s own rule — the app never shows a spelling the child must produce). Shown only to a kid at level middle / upper
//   (dcLevel from the roster's grade: 3rd and up) — never by name.
// Writes (only these): <kid>_settings/match_best key "<deck> · dump" = most named (only when beaten); the round's gameLog entry via
//   gameLogRound (GAMELOG, game:"dump": a card named = ok, missed = wrong, a re-ask = back, typed wrong = fail). NEVER the ladder —
//   no tier, no next_due, no history, no studyLog. db && !_dryRun() only. Per-kid park / restore / resume via 🎲 GAMEKIT.
let dumpState=null;   // {kid,deck,game:"dump",t0,pausedTotal,pausedAt,cards:[{pid,front,back,tier}],named:{pid:{how,text}},typed:[{text,pid,how}],asks:[{pid,typed,ok,done}],ai,turns,phase:"play"|"ask"|"done",count,of,isPB,prevBest,lock,msg,gameLogged}
const DUMP_MIN=10, DUMP_SECS=300, DUMP_REASK=10, DUMP_FRONT_MAX=40, DUMP_FRONT_WORDS=5;
const DUMP_ARTICLE=/^(der|die|das|den|dem|ein|eine|the|a|an|le|la|les|el|los|las)\s+/;
function _dumpItems(kid){ let items=(typeof masteryData!=="undefined"&&masteryData&&masteryData[kid||masteryKid])||[]; if(!Array.isArray(items)) items=Object.values(items); return items; }
function _dumpPlain(s){ return (typeof _matchPlain==="function")?_matchPlain(s):String(s==null?"":s).replace(/<[^>]*>/g," ").replace(/&nbsp;/g," ").replace(/\s+/g," ").trim(); }
function _dumpE(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function _dumpQ(s){ return String(s==null?"":s).replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,"&quot;"); }
// The Study Session's normalizer (case, punctuation, umlaut spellings), plus a leading / trailing hyphen ("peri-" = "peri", "-ology" = "ology")
function dumpNorm(s){ s=_dumpPlain(s); s=(typeof mstNormAns==="function")?mstNormAns(s):s.toLowerCase().replace(/[.,!?;:"()]/g," ").replace(/\s+/g," ").trim(); return s.replace(/(^|\s)[-\u2010\u2011\u2013\u2014]+/g,"$1").replace(/[-\u2010\u2011\u2013\u2014]+(?=\s|$)/g,"").replace(/\s+/g," ").trim(); }
// PURE: is this front a NAME the kid could produce from memory? (a word or short phrase — not a sentence, a question, a math fact
// or a rule's example line)
function dumpNameable(front){
  const f=_dumpPlain(front); if(!f||f.length>DUMP_FRONT_MAX) return false;
  if(f.split(/\s+/).length>DUMP_FRONT_WORDS) return false;
  if(/[.?!]$/.test(f)||/ \u00B7 |\u2192/.test(f)) return false;   // a sentence / question · "boat → boats · …" rule examples
  if(/^\s*[\d\u2153\u2154\u00BC\u00BE\u00BD]/.test(f)) return false;   // starts with a number or fraction: 6×7, ¾ as decimal, 1 foot
  return true;
}
function _dumpLeftOut(it,kid){
  if(typeof _whichLeftOut==="function"){ try{ return _whichLeftOut(it,kid); }catch(e){} }
  const d=String(it.subject||""), t=String(it.type||""); return /spell|phonogram/i.test(d)||/spell|phonogram/i.test(t);
}
// The card's back as a cue: the family's own wording, the card's answer, else the definitions map. "" when there is none.
function dumpBack(kid,it){
  let b=""; try{ b=_dumpPlain((typeof owRuleBack==="function")?owRuleBack(kid,it):it.answer); }catch(e){ b=_dumpPlain(it&&it.answer); }
  if(!b){ try{ if(typeof mastGetDef==="function") b=_dumpPlain(mastGetDef(kid,_dumpPlain(it.prompt),it.subject)); }catch(e){} }
  return b;
}
// PURE: the decks this kid can dump — {deck:[{pid,front,back,tier}]}, only decks with DUMP_MIN+ distinct nameable cards.
function dumpPools(items,kid){
  kid=kid||masteryKid;
  const by={}, seen={};
  (items||[]).forEach(i=>{
    if(!i||(i.status!=="active"&&i.status!=="introduction")||i.dir==="prod") return;
    const front=_dumpPlain(i.prompt); if(!dumpNameable(front)||_dumpLeftOut(i,kid)) return;
    if(typeof envtWaitsForCheckin==="function"&&envtWaitsForCheckin(kid,i.subject)) return;   // an Envirothon station waiting for its check-in (the same hold as Which one?)
    if(typeof cpceHidItem==="function"&&cpceHidItem(kid,i)) return;   // a card hidden for the class (Cards editor)
    if(typeof cpSecOffItem==="function"&&cpSecOffItem(kid,i)) return;   // an Off section's card (class sections)
    try{ if(typeof mastKnowledgeType==="function"&&mastKnowledgeType(i)==="procedure_fluency") return; }catch(e){}
    const d=i.subject||"Other", k=d+"|"+dumpNorm(front); if(!k||seen[k]) return;
    const back=dumpBack(kid,i); if(!back||dumpNorm(back)===dumpNorm(front)) return;
    seen[k]=1; (by[d]||(by[d]=[])).push({pid:i.id,front:front,back:back,tier:i.tier||"daily"});
  });
  const out={}; Object.keys(by).forEach(d=>{ if(by[d].length>=DUMP_MIN) out[d]=by[d]; });
  return out;
}
function dumpDecks(items,kid){ return Object.keys(dumpPools(items,kid)).sort(); }   // the game's OWN rule (the games-per-deck grid's preload asks this)
// 🎮 games per deck (GAMEGRID, her words 2026-11-02): Mom can turn Brain Dump off for one deck — the kid's deck list leaves it out.
function dumpDeckOn(kid,deck){ return (typeof gameDeckOn!=="function")||gameDeckOn(kid,"dump",deck); }
function dumpDecksOn(items,kid){ kid=kid||masteryKid; return dumpDecks(items,kid).filter(d=>dumpDeckOn(kid,d)); }
// Only a kid at level middle / upper (3rd grade and up by the roster) — readers who type; never a kid's name.
function dumpLevelOk(kid){ if(typeof dcLevel!=="function") return true; try{ const l=dcLevel(kid); return l!=="little"&&l!=="early"; }catch(e){ return true; } }
function dumpAvail(kid){ return dumpLevelOk(kid)&&dumpDecksOn(_dumpItems(kid),kid).length>0; }
// PURE: the forms of a front that count as naming it — [full, without a leading article, without a trailing "(…)"]
function dumpKeys(front){
  const n=dumpNorm(front), out=[n];
  const a=n.replace(DUMP_ARTICLE,"").trim(); if(a&&a!==n) out.push(a);
  const p=dumpNorm(_dumpPlain(front).replace(/\s*\([^)]*\)\s*$/,"")); if(p&&p!==n&&out.indexOf(p)<0) out.push(p);
  return out;
}
function dumpDist(a,b){   // Levenshtein
  if(a===b) return 0; const m=a.length, n=b.length; if(!m) return n; if(!n) return m;
  let prev=[]; for(let j=0;j<=n;j++) prev[j]=j;
  for(let i=1;i<=m;i++){ const cur=[i]; for(let j=1;j<=n;j++){ cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1)); } prev=cur; }
  return prev[n];
}
function dumpSlack(len){ return len>=8?2:len>=4?1:0; }
// PURE: what a typed name is — {card, how:"hit"|"close"|"dup"} or null (not in the deck). Exact over every card first (a card already
// named = "dup"), then the closest unnamed card within the spelling slack.
function dumpMatch(typed,cards,named){
  const t=dumpNorm(typed); if(!t) return null;
  const ta=t.replace(DUMP_ARTICLE,"").trim();
  for(const c of cards){ const ks=dumpKeys(c.front); if(ks[0]===t) return named[c.pid]?{card:c,how:"dup"}:{card:c,how:"hit"}; }
  for(const c of cards){ const ks=dumpKeys(c.front); if(ks.indexOf(t)>=0||(ta&&ks.indexOf(ta)>=0)) return named[c.pid]?{card:c,how:"dup"}:{card:c,how:"close"}; }
  let best=null, bd=99;
  for(const c of cards){ if(named[c.pid]) continue;
    for(const k of dumpKeys(c.front)){ const d=Math.min(dumpDist(t,k),ta?dumpDist(ta,k):99); if(d<=dumpSlack(k.length)&&d<bd){ bd=d; best=c; } } }
  return best?{card:best,how:"close"}:null;
}
function dumpElapsed(st,now){ now=now!=null?now:Date.now(); return Math.max(0,now-st.t0-(st.pausedTotal||0)-(st.pausedAt?now-st.pausedAt:0)); }
function dumpClock(ms){ const s=Math.floor(ms/1000); return Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); }
function dumpStart(deck){
  try{ if(typeof bbAudioUnlock==="function") bbAudioUnlock(); }catch(e){}   // the deck tap unlocks the ding / bonk (iPad)
  const pools=dumpPools(_dumpItems(),masteryKid), cards=pools[deck];
  if(!cards||!cards.length||!dumpDeckOn(masteryKid,deck)){ dumpState=null; _mastRe(); return; }
  dumpState={kid:masteryKid,deck:deck,game:"dump",t0:Date.now(),pausedTotal:0,pausedAt:null,cards:cards.slice(),named:{},typed:[],asks:[],ai:0,turns:[],phase:"play",count:0,of:cards.length,isPB:false,prevBest:null,lock:false,msg:"",gameLogged:false};
  _mastRe(); dumpTick(dumpState); dumpFocus();
}
function dumpChangeDeck(){ dumpState=null; _mastRe(); }   // the round is dropped as it stands: nothing written
function dumpFocus(){ try{ setTimeout(()=>{ const e=document.getElementById("dump-in"); if(e) e.focus(); },0); }catch(e){} }
// The quiet clock: updates #dump-clock each second; stops the round at DUMP_SECS. Clears itself once its round is parked or over.
function dumpTick(st){
  if(typeof setInterval!=="function") return;
  if(window._dumpTick) clearInterval(window._dumpTick);
  window._dumpTick=setInterval(()=>{
    if(dumpState!==st||st.phase!=="play"||st.pausedAt){ clearInterval(window._dumpTick); window._dumpTick=null; return; }
    const ms=dumpElapsed(st);
    if(ms>=DUMP_SECS*1000){ clearInterval(window._dumpTick); window._dumpTick=null; dumpStop(st); return; }
    const el=document.getElementById("dump-clock"); if(el) el.textContent=dumpClock(ms);
  },1000);
}
// PURE over the state: one entered name → "hit" | "close" | "dup" | "miss" | "" (blank)
function dumpEnter(st,text){
  const raw=_dumpPlain(text); if(!raw||st.phase!=="play") return "";
  const m=dumpMatch(raw,st.cards,st.named);
  if(!m){ if(!st.typed.some(x=>x.pid==null&&dumpNorm(x.text)===dumpNorm(raw))) st.typed.push({text:raw,pid:null,how:"miss"}); return "miss"; }
  if(m.how==="dup") return "dup";
  st.named[m.card.pid]={how:m.how,text:raw}; st.typed.push({text:raw,pid:m.card.pid,how:m.how}); st.count++;
  return m.how;
}
function dumpAdd(){
  const st=dumpState; if(!st||st.phase!=="play") return;
  const el=document.getElementById("dump-in"), text=el?el.value:"";
  const r=dumpEnter(st,text);
  if(el) el.value="";
  if(r==="hit"||r==="close"){ try{ matchDing(); }catch(e){} }
  // In place when the round is on screen (a re-render would drop the keyboard on an iPad); else the normal redraw.
  const chips=document.getElementById("dump-chips"), cnt=document.getElementById("dump-count");
  if(chips&&cnt&&r&&r!=="dup"){ chips.insertAdjacentHTML("beforeend",_dumpChip(st.typed[st.typed.length-1])); cnt.textContent=st.count+" of "+st.of; }
  else if(!chips||!cnt) _mastRe();
  if(st.count>=st.of){ dumpStop(st); return; }
  dumpFocus();
}
function _dumpChip(x){ const on=x.how==="hit"||x.how==="close"; return '<span class="dump-chip'+(on?' dump-on':'')+'">'+(on?'\u2713 ':'')+_dumpE(x.text)+'</span>'; }
// PURE: the misses to re-ask — lowest on the ladder first, DUMP_REASK at most
function dumpAskList(st){
  const order=(typeof MAST_TIER_ORDER!=="undefined"&&Array.isArray(MAST_TIER_ORDER))?MAST_TIER_ORDER:["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"];
  const ix=t=>{ const i=order.indexOf(t); return i<0?0:i; };
  return st.cards.filter(c=>!st.named[c.pid]).map((c,i)=>({c:c,i:i})).sort((a,b)=>(ix(a.c.tier)-ix(b.c.tier))||(a.i-b.i)).slice(0,DUMP_REASK).map(x=>({pid:x.c.pid,typed:"",ok:false,done:false}));
}
// "I'm done" / the clock / every card named: the dump turns (named = ok, missed = wrong), then the misses come back once.
function dumpStop(st){
  st=st||dumpState; if(!st||st.phase!=="play") return;
  if(window._dumpTick){ clearInterval(window._dumpTick); window._dumpTick=null; }
  st.turns=st.cards.map(c=>({pid:c.pid,done:true,first:!!st.named[c.pid],wrong:st.named[c.pid]?{}:{1:1},back:false}));
  st.asks=dumpAskList(st); st.ai=0; st.lock=false; st.msg="";
  if(!st.asks.length){ dumpFinish(st); _mastRe(); return; }
  st.phase="ask"; _mastRe(); dumpFocus();
}
// PURE over the state: one typed answer to the current re-ask → true (the name) | false
function dumpJudge(st,text){
  const a=st.asks[st.ai]; if(!a||a.done) return false;
  const c=st.cards.find(x=>x.pid===a.pid), raw=_dumpPlain(text);
  const same=c?st.cards.filter(x=>dumpNorm(x.back)===dumpNorm(c.back)):[];   // two cards with one back ("write": graph / scrib) share the cue — either name is right
  const m=c?dumpMatch(raw,same.length?same:[c],{}):null;
  a.typed=raw; a.ok=!!m; a.done=true;
  st.turns.push({pid:a.pid,done:true,first:a.ok,wrong:a.ok?{}:{1:1},back:true,fail:!a.ok});
  return a.ok;
}
function dumpAnswer(){
  const st=dumpState; if(!st||st.phase!=="ask"||st.lock) return;
  const el=document.getElementById("dump-in"), text=el?el.value:""; if(!_dumpPlain(text)) return;
  const ok=dumpJudge(st,text);
  try{ ok?matchDing():matchBonk(); }catch(e){}
  st.msg=ok?"right":"wrong"; st.lock=true; _mastRe();
  const at=st.ai; setTimeout(()=>{ if(dumpState===st&&st.lock&&st.ai===at) dumpNext(st); },ok?900:2200);   // GAMEKID: never advances a parked / settled turn
}
function dumpNext(st){
  st=st||dumpState; if(!st||st!==dumpState) return;
  st.lock=false; st.msg=""; st.ai++;
  if(st.ai>=st.asks.length){ dumpFinish(st); _mastRe(); return; }
  _mastRe(); dumpFocus();
}
function dumpBestKey(deck){ return deck+" \u{00B7} dump"; }
function dumpFinish(st){
  st.phase="done";
  const kid=st.kid||masteryKid;   // GAMEKID
  try{ if(typeof gameLogRound==="function") gameLogRound(st); }catch(e){}   // 🎮 GAMELOG: every card's result, game:"dump"
  const s=masteryData[kid+"_settings"]||(masteryData[kid+"_settings"]={});
  if(!s.match_best) s.match_best={};
  const key=dumpBestKey(st.deck), prev=s.match_best[key];
  st.prevBest=prev==null?null:prev;
  st.isPB=st.count>0&&(prev==null||st.count>prev);
  if(st.isPB){
    s.match_best[key]=st.count;
    if(db&&!_dryRun()) db.ref("mastery/"+kid+"_settings/match_best").update({[(typeof haKey==="function"?haKey(key):key)]:st.count});   // this key only
    try{HA_LS.setItem("ha_mastery",JSON.stringify(masteryData));}catch(e){}
  }
  try{ if(st.of>0&&st.count===st.of&&typeof _showCelebration==="function"&&document.getElementById("celeb-overlay")) _showCelebration(kid,"\u{1F4AD} You named them all!",{noSong:true}); }catch(e){}
}
// 🎲 GAMEKIT: park / restore / resume. Time away is not play time; a Check that was mid-step settles here (no render; the caller renders).
function dumpPark(){ const st=dumpState; if(st&&st.phase==="play"&&!st.pausedAt) st.pausedAt=Date.now(); return st; }
function dumpRestore(v){ dumpState=v||null; const st=dumpState; if(st&&st.pausedAt){ st.pausedTotal=(st.pausedTotal||0)+(Date.now()-st.pausedAt); st.pausedAt=null; } }
function dumpResume(){
  const st=dumpState; if(!st) return;
  if(st.phase==="ask"&&st.lock){ st.lock=false; st.msg=""; st.ai++; if(st.ai>=st.asks.length) dumpFinish(st); }
  if(st.phase==="play"&&(typeof mastView==="undefined"||mastView==="dump")) dumpTick(st);
}
const DUMP_CSS='<style>.dump-chip{display:inline-block;padding:6px 11px;border-radius:999px;border:2px solid #e2ddd6;background:#fff;color:#78716c;font-size:14px;font-weight:700;margin:3px}'+
  '.dump-chip.dump-on{border-color:#16a34a;background:#f0fdf4;color:#15803d}.dump-chip.dump-x{border-color:#fca5a5;background:#fef2f2;color:#b91c1c}.dump-chip.dump-dim{border-style:dashed;color:#a8a29e}'+
  '.dump-in{width:100%;box-sizing:border-box;padding:14px 16px;border-radius:14px;border:3px solid #e2ddd6;font-size:20px;font-family:\'DM Sans\',sans-serif;outline:none}.dump-in:focus{border-color:#0ea5e9}'+
  '.dump-btn{padding:12px 22px;border-radius:999px;border:none;color:#fff;font-size:15px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif}.dump-btn[disabled]{opacity:.45;cursor:default}'+
  '.dump-ghost{padding:10px 16px;border-radius:999px;border:1.5px solid #e2ddd6;background:#fff;color:#57534e;font-size:13px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif}</style>';
function buildDumpHtml(color){
  let h=DUMP_CSS+'<div style="padding:4px 14px 24px;max-width:720px;margin:0 auto">';
  const pools=dumpPools(_dumpItems(),masteryKid), decks=Object.keys(pools).sort().filter(d=>dumpDeckOn(masteryKid,d));
  if(!decks.length){ h+='<div class="mast-none">No decks ready for Brain Dump yet \u{2014} it needs '+DUMP_MIN+' or more named cards in one deck.</div></div>'; return h; }
  const st=dumpState;
  const chip=(dk,lbl)=>{ const sel=st&&st.deck===dk; return '<button onclick="dumpStart(\''+_dumpQ(dk)+'\')" style="padding:10px 16px;border-radius:999px;font-size:14px;font-weight:800;border:2px solid '+(sel?color:'#e2ddd6')+';background:'+(sel?color:'#fff')+';color:'+(sel?'#fff':'#57534e')+';cursor:pointer;font-family:\'DM Sans\',sans-serif">'+lbl+'</button>'; };
  if(!st||st.phase==="done"){
    h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 14px">';
    decks.forEach(dk=>{ h+=chip(dk,_dumpE(dk)+' <span style="opacity:.7;font-weight:700">'+pools[dk].length+'</span>'); });
    h+='</div>';
  }
  if(!st){ h+='<div style="font-size:15px;font-weight:700;color:#57534e">\u{1F4AD} Pick a deck, then name every card in it you can remember \u{2014} one at a time, Enter after each.</div></div>'; return h; }
  const s=masteryData[st.kid+"_settings"]||{}, best=(s.match_best||{})[dumpBestKey(st.deck)];
  const head=(right)=>'<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0 10px;flex-wrap:wrap"><div style="font-family:\'Fraunces\',serif;font-size:20px;font-weight:800;color:#292524">'+right+'</div>'+
    '<span style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--muted)">'+_dumpE(st.deck)+(best!=null?' \u{00B7} \u{1F3C6} '+best:'')+
    '<button class="dump-ghost" onclick="dumpChangeDeck()">\u{1F5C2} Change deck</button></span></div>';
  if(st.phase==="play"){
    if(typeof window!=="undefined"&&!window._dumpTick&&!st.pausedAt) dumpTick(st);   // back on screen (another view, a parked kid): the clock ticks again
    h+=head('Name every <u>'+_dumpE(st.deck)+'</u> card you know');
    h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><span id="dump-count" style="font-size:17px;font-weight:800;color:'+color+'">'+st.count+' of '+st.of+'</span><span id="dump-clock" style="font-size:13px;font-weight:700;color:var(--muted)">'+dumpClock(dumpElapsed(st))+'</span></div>';
    h+='<div style="display:flex;gap:8px;align-items:center"><input id="dump-in" class="dump-in" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Type one, press Enter" aria-label="A name you remember" onkeydown="if(event.key===\'Enter\'){event.preventDefault();dumpAdd();}">'+
      '<button class="dump-btn" style="background:'+color+'" onclick="dumpAdd()">Add</button></div>';
    h+='<div id="dump-chips" style="margin:12px 0;min-height:40px">'+st.typed.map(_dumpChip).join("")+'</div>';
    h+='<div style="display:flex;justify-content:center"><button class="dump-ghost" onclick="dumpStop()">\u{2714} I\u{2019}m done</button></div>';
    return h+'</div>';
  }
  if(st.phase==="ask"){
    const a=st.asks[st.ai], c=a?st.cards.find(x=>x.pid===a.pid):null;
    h+=head('The ones you missed \u{2014} '+(st.ai+1)+' of '+st.asks.length);
    h+='<div style="text-align:center;font-size:14px;font-weight:700;color:#57534e;margin-bottom:8px">Which card is this?</div>';
    h+='<div style="padding:16px 18px;border-radius:18px;background:#f8f7f4;border:2px solid #e2ddd6;font-size:'+((c&&c.back.length<=24)?'30px':'19px')+';font-weight:700;color:#292524;text-align:center;line-height:1.3;margin-bottom:12px">'+_dumpE(c?c.back:'')+'</div>';
    if(st.lock) h+='<div style="text-align:center;font-size:18px;font-weight:800;color:'+(st.msg==="right"?'#16a34a':'#b45309')+';padding:10px 0">'+(st.msg==="right"?'\u{2705} '+_dumpE(c?c.front:''):'\u{274C} It was <b>'+_dumpE(c?c.front:'')+'</b>')+'</div>';
    else h+='<div style="display:flex;gap:8px;align-items:center"><input id="dump-in" class="dump-in" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Type the name" aria-label="The name" onkeydown="if(event.key===\'Enter\'){event.preventDefault();dumpAnswer();}">'+
      '<button class="dump-btn" style="background:'+color+'" onclick="dumpAnswer()">\u{2714} Check</button></div>';
    return h+'</div>';
  }
  // Finish: named N of M, the close ones, the re-asked ones, the rest of the misses, not-in-deck in grey.
  const named=st.cards.filter(c=>st.named[c.pid]), askBy={}; st.asks.forEach(a=>{ askBy[a.pid]=a; });
  const asked=st.cards.filter(c=>askBy[c.pid]), rest=st.cards.filter(c=>!st.named[c.pid]&&!askBy[c.pid]), outside=st.typed.filter(x=>x.pid==null);
  h+='<div style="margin-top:6px;text-align:center;padding:16px;border-radius:18px;background:'+(st.isPB?'#f0fdf4':'#f8f7f4')+';border:2px solid '+(st.isPB?'#16a34a':'#e2ddd6')+'">';
  h+='<div style="font-family:\'Fraunces\',serif;font-size:22px;font-weight:800">\u{1F389} You named '+st.count+' of '+st.of+(st.isPB?' \u{2014} \u{1F3C6} new best!':(st.prevBest!=null?' \u{00B7} best '+st.prevBest:''))+'</div>';
  h+='<div style="font-size:12px;font-weight:700;color:var(--muted);margin-top:4px">'+_dumpE(st.deck)+' \u{00B7} '+dumpClock(dumpElapsed(st))+'</div>';
  const sec=(title,inner)=>inner?'<div style="text-align:left;margin-top:12px"><div style="font-size:12px;font-weight:800;color:#57534e;text-transform:uppercase;letter-spacing:.04em">'+title+'</div><div style="margin-top:4px">'+inner+'</div></div>':'';
  h+=sec('\u{2713} Named',named.map(c=>{ const n=st.named[c.pid]; return '<span class="dump-chip dump-on">\u2713 '+(n.how==="close"?'<s style="opacity:.6">'+_dumpE(n.text)+'</s> '+_dumpE(c.front):_dumpE(c.front))+'</span>'; }).join(""));
  h+=sec('\u{1F501} Came back',asked.map(c=>{ const a=askBy[c.pid]; return '<span class="dump-chip '+(a.ok?'dump-on':'dump-x')+'">'+(a.ok?'\u2713 ':'\u2717 ')+_dumpE(c.front)+'</span>'; }).join(""));
  h+=sec('Still in the deck',rest.map(c=>'<span class="dump-chip dump-dim">'+_dumpE(c.front)+'</span>').join(""));
  h+=sec('Not in this deck',outside.map(x=>'<span class="dump-chip dump-dim">'+_dumpE(x.text)+'</span>').join(""));
  h+='<div style="display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap"><button class="dump-btn" style="background:'+color+'" onclick="dumpStart(\''+_dumpQ(st.deck)+'\')">\u{1F501} Play again</button></div>';
  return h+'</div></div>';
}
// BRAINDUMP_END
// GOFISH_START — 🐟 "Go Fish" vs the app (her yes 2026-11-02 to gofish-design_2026-11-02.md; PLAN_practice_games_2026-10-23.md
// Tier 2, build #6). A pairs game with the app as a friendly partner: every card twice, the kid holds a hand, the app holds a
// hand, the rest is the pond. The kid's ASK is the production act — tap a card in hand, then PRODUCE it: a picture / letter
// card is said out loud (a tablet has no mic, so the 🗣 tap is the honor system, never a miss, and the app says the name back
// as the confirm); a number fact is typed on the number pad; a word answer is picked from three of the deck's own backs. The
// app answers honestly from its real hand — "Yes! Here you go." (the pair goes down, ask again) or "Go fish!" (tap the pond).
// On its turn the app asks for a card it really holds — a picture card by NAME (said, never written), an answer card by its
// ANSWER ("Do you have… 15?") — and the kid FINDS it in hand (taps it) or taps 🎣 Go fish! when they don't have it: a wrong
// tap, or Go fish! with the card in hand, is a miss (the soft bonk, hear it again, try again). Every pair goes down through
// the kid — their ask, the app's ask, or a fished pair they name — so every card in the round is asked at least once. One
// shared row of pairs, no lives, no clock, no score against the kid. When every pair is down the missed cards come back once
// (one last produce or find each), then the finish: "N of M pairs clean". Cards: Which one?'s own pool (whichPool /
// whichDeckModes — pictures, symbols, short backs; spelling and phonograms stay out), decks with GF_MIN+ cards, GF_PAIRS a round.
// Writes (only these): <kid>_settings/match_best key "<deck> · gofish" (clean pairs, only when beaten) and the round's gameLog
// entry (GAMELOG, game:"gofish"). NEVER touches the ladder — no scores, no next_due, no study log. db && !_dryRun() only.
// Per-kid park / restore / resume through its GAMES_LIST entry (🎲 GAMEKIT). A round dropped (Stop, a kid switch) writes nothing.
// ⚖️ GAMEJUDGE (her decision 2026-11-08, from the games audit — Go Fish's 🗣 logged a right every time): the say act is judged by the
// kid's ONE setting (say it then pick it / type it / Mom judges) — _gfJudgeOpen / _gfJudged below; the honor tap only when the deck
// has no other name to pick from. The round is stamped (st.judge → gameLog judge) so Scores can tell judged rounds from older ones.
let gofishState=null;   // {kid,deck,mix,game:"gofish",t0,pairs:[pid],kinds:{pid:"say"|"type"|"pick"},hand,app,pond,table:[{pid,who}],turns:[{pid,act,why,done,first,wrong:{},tries,fail,back,opts?,typed?}],step:{k:"ask"|"produce"|"fish"|"find",…},after,phase:"play"|"back"|"done",first,of,isPB,prevBest,lock,seq,msg,say,asked:{},backs,gameLogged}
let _gfRandom=Math.random;   // tests seed it
const GF_PAIRS=8, GF_MIN=4, GF_TRIES=2, GF_BEAT=1600, GF_BEAT_LONG=2200;
const GF_NUM=/^[-+]?\d+([.,]\d+)?$/;
function _gfItems(kid){ let items=(typeof masteryData!=="undefined"&&masteryData&&masteryData[kid||masteryKid])||[]; if(!Array.isArray(items)) items=Object.values(items); return items; }
function _gfShuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(_gfRandom()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function _gfPick(a){ return a.length?a[Math.floor(_gfRandom()*a.length)]:undefined; }
function _gfTake(arr,pid){ const j=arr.indexOf(pid); if(j>=0) arr.splice(j,1); }
function _gfIt(st,pid){ return _gfItems(st.kid).find(x=>x&&x.id===pid)||null; }
function gofishName(it){ return _matchPlain(it&&it.prompt); }
// The decks that can deal a hand: Which one?'s playable decks with GF_MIN+ cards in play.
// 🎮 GAMEGRID (2026-11-03): Go Fish has its own column in Mom's games-per-deck grid. Which one?'s modes are read RAW (Which one?'s
// own cells stand aside — a deck turned off for Which one? still plays here), then this game's own cell: gameDeckOn(kid,"gofish",deck).
function _gfRaw(fn){ const had=(typeof _gdRaw!=="undefined")?_gdRaw:null; try{ if(had!==null) _gdRaw=true; return fn(); } finally{ if(had!==null) _gdRaw=had; } }
function gofishDeckOn(kid,deck){ return (typeof _gdRaw!=="undefined"&&_gdRaw)||typeof gameDeckOn!=="function"||gameDeckOn(kid,"gofish",deck); }
function _gfWhichPool(items,kid){ return _gfRaw(()=>whichPool(items,WHICH_MIX,kid)); }
function gofishDecks(items,kid){
  kid=kid||masteryKid;
  const n={}; _gfWhichPool(items,kid).forEach(i=>{ const d=i.subject||"Other"; n[d]=(n[d]||0)+1; });
  return Object.keys(n).filter(d=>n[d]>=GF_MIN&&gofishDeckOn(kid,d)).sort();
}
function gofishPool(items,deck,kid){ kid=kid||masteryKid; const ok=gofishDecks(items,kid); return _gfWhichPool(items,kid).filter(i=>ok.indexOf(i.subject||"Other")>=0&&(deck===WHICH_MIX||(i.subject||"Other")===deck)); }
// What the kid DOES with a card: "say" (picture / symbol — say it out loud), "type" (a number back — the number pad), "pick" (a word back — three of the deck's backs).
function gofishKind(it,mode){ if(mode!=="answer") return "say"; return GF_NUM.test(String(_whichBack(it)).trim())?"type":"pick"; }
// PURE: deal the pairs — the kid and the app each get H different cards; the rest (two copies of each card, less the ones held) is the pond.
function gofishDeal(pids){
  const h=pids.length>=6?5:3;
  const hand=_gfShuffle(pids.slice()).slice(0,h), app=_gfShuffle(pids.slice()).slice(0,h);
  const left={}; pids.forEach(p=>{ left[p]=2; }); hand.forEach(p=>{ left[p]--; }); app.forEach(p=>{ left[p]--; });
  const pond=[]; pids.forEach(p=>{ for(let i=0;i<left[p];i++) pond.push(p); });
  return {hand:hand,app:app,pond:_gfShuffle(pond)};
}
function _gfSay(st,text){ st.say=text||""; if(!text||(typeof mastView!=="undefined"&&mastView!=="gofish")) return; try{ mastSpeak(text); }catch(e){} }
function gofishSayAgain(){ const st=gofishState; if(st&&st.say) try{ mastSpeak(st.say); }catch(e){} }
function gofishStart(deck){
  try{ if(typeof bbAudioUnlock==="function") bbAudioUnlock(); }catch(e){}   // the deck tap unlocks the ding / bonk (iPad)
  const items=_gfItems(), mix=deck===WHICH_MIX, modes=_gfRaw(()=>whichDeckModes(items)), pool=gofishPool(items,deck);
  if(pool.length<GF_MIN||(!mix&&!gofishDeckOn(masteryKid,deck))){ gofishState=null; _mastRe(); return; }   // 🎮 GAMEGRID: a deck Mom turned off for Go Fish
  const picks=_gfShuffle(pool.slice()).slice(0,GF_PAIRS), pids=picks.map(i=>i.id), kinds={};
  picks.forEach(i=>{ kinds[i.id]=gofishKind(i,modes[i.subject||"Other"]); });
  const d=gofishDeal(pids);
  gofishState={kid:masteryKid,deck:deck,mix:mix,game:"gofish",t0:Date.now(),pairs:pids,kinds:kinds,hand:d.hand,app:d.app,pond:d.pond,table:[],turns:[],step:null,after:null,phase:"play",first:0,of:pids.length,isPB:false,prevBest:null,lock:false,seq:0,msg:"",say:"",asked:{},backs:null};
  if(typeof gameJudgeMode==="function"){ gofishState.judge=gameJudgeMode(masteryKid); gofishState.nch=gameJudgeChoices(masteryKid); }   // ⚖️ GAMEJUDGE: the kid's setting, read once a round (stamps the log)
  _gfKidTurn(gofishState);
  _mastRe();
}
function gofishStop(){ gofishState=null; _mastRe(); }   // drop the round as it stands: nothing written
function _gfDown(st){ return st.table.length>=st.pairs.length; }
function _gfTurn(st,pid,act,why){ const t={pid:pid,act:act,why:why,done:false,first:false,wrong:{},tries:0,fail:false,back:false}; st.turns.push(t); return t; }
// A beat between steps (the ding, the app's line), then `after` runs: "kid" | "app" | "back". GAMEKID: the timer checks its own seq, so it never acts on a parked / settled round.
function _gfBeat(st,after,ms){ st.lock=true; st.after=after; const seq=++st.seq; setTimeout(()=>{ if(gofishState===st&&st.lock&&st.seq===seq) gofishNext(st); },ms||GF_BEAT); }
function _gfGo(st,a){ if(a==="kid") _gfKidTurn(st); else if(a==="app") _gfAppTurn(st); else if(a==="back") _gfBackNext(st); }
function gofishNext(st){ st=st||gofishState; if(!st||st!==gofishState) return; st.lock=false; const a=st.after; st.after=null; _gfGo(st,a); _mastRe(); }
// ── the kid's turn ──
function _gfKidTurn(st){
  if(_gfDown(st)) return _gfEnd(st);
  if(!st.hand.length){
    if(!st.pond.length) return _gfAppTurn(st);
    st.hand.push(st.pond.pop());   // an empty hand draws one (it can't pair with nothing)
  }
  st.step={k:"ask"}; st.msg="Your turn! Tap a card and ask me for it."; _gfSay(st,"Your turn!");
}
function gofishAsk(i){
  const st=gofishState; if(!st||st.phase!=="play"||st.lock||!st.step||st.step.k!=="ask") return;
  const pid=st.hand[i]; if(pid==null) return;
  _gfProduce(st,pid,"ask"); _mastRe();
}
// The produce step — why: "ask" (the kid's ask) · "fished" (the kid drew its pair) · "appfished" (the app drew its pair) · "back" (one more look)
function _gfProduce(st,pid,why){
  const kind=st.kinds[pid]||"say", t=_gfTurn(st,pid,kind,why);
  if(why==="back") t.back=true;
  if(kind==="pick") t.opts=_gfLures(st,pid);
  if(kind==="type") t.typed="";
  st.step={k:"produce",pid:pid,why:why,t:st.turns.length-1};
  const lead=why==="fished"?"You fished a pair! ":why==="appfished"?"I fished a pair! ":why==="back"?"One more time. ":"";
  st.msg=lead+(kind==="say"?"Say it out loud, then tap \u{1F5E3}":kind==="type"?"Type the answer.":"Tap the answer.");
  _gfSay(st,lead+"What is it?");
  if(st.judge) _gfJudgeOpen(st,t,lead);   // ⚖️ GAMEJUDGE: a say card is judged (pick / type / Mom) instead of the honor tap
}
// Three backs for a pick: the card's own + two different backs from its deck (Which one?'s rule), shuffled.
function _gfLures(st,pid){
  const it=_gfIt(st,pid); if(!it) return [];
  const own=_whichBack(it), seen={}; seen[_whichNorm(own)]=1;
  const more=_gfShuffle(_gfWhichPool(_gfItems(st.kid),st.kid).filter(x=>x.id!==pid&&(x.subject||"Other")===(it.subject||"Other"))).map(x=>_whichBack(x)).filter(b=>b&&!seen[_whichNorm(b)]&&(seen[_whichNorm(b)]=1)).slice(0,2);
  return _gfShuffle([own].concat(more));
}
function _gfProdTurn(st,act){ if(!st||st.lock||st.phase==="done"||!st.step||st.step.k!=="produce") return null; const t=st.turns[st.step.t]; return (t&&t.act===act)?t:null; }
function gofishSaid(){   // 🗣 "I said it" — the honor system: a tablet can't hear; the app says the name back as the confirm
  const st=gofishState, t=_gfProdTurn(st,"say"); if(!t) return;
  if(typeof gameCardAnswered==="function") gameCardAnswered(t);   // ⏱ CARDSECS: the first answer on this card stops its clock
  if(t.gj){ gameJudgeSaid(); return; }   // ⚖️ GAMEJUDGE: no self-report — "I said it" opens the choices (pick); type / Mom have their own taps
  t.done=true; t.first=true;
  _gfProduced(st,gofishName(_gfIt(st,t.pid))); _mastRe();
}
function gofishKey(ch){   // the number pad
  const st=gofishState, t=_gfProdTurn(st,"type"); if(!t) return;
  if(ch==="back") t.typed=t.typed.slice(0,-1); else if(t.typed.length<6) t.typed+=ch;
  _mastRe();
}
function gofishCheck(){
  const st=gofishState, t=_gfProdTurn(st,"type"); if(!t||!t.typed) return;
  _gfAfterJudge(st,t,gofishJudge(t,t.typed,_whichBack(_gfIt(st,t.pid))));
}
function gofishPickTap(i){
  const st=gofishState, t=_gfProdTurn(st,"pick"); if(!t||!t.opts||t.opts[i]==null||t.wrong[t.opts[i]]) return;
  _gfAfterJudge(st,t,gofishJudge(t,t.opts[i],_whichBack(_gfIt(st,t.pid))));
}
function _gfAnsOk(act,given,back){ if(act==="pick") return String(given)===String(back); return (typeof mstTypeAnsOk==="function")?mstTypeAnsOk(given,back):Number(String(given).replace(",","."))===Number(String(back).replace(",",".")); }
// PURE: one answer against the card's back → "right" | "again" | "fail". A picked back that was wrong greys out (t.wrong).
function gofishJudge(t,given,back){
  if(typeof gameCardAnswered==="function") gameCardAnswered(t);   // ⏱ CARDSECS: the first answer on this card stops its clock
  if(_gfAnsOk(t.act,given,back)){ t.done=true; t.first=t.tries===0; return "right"; }
  t.tries++; t.wrong[t.act==="pick"?String(given):String(t.tries)]=1; t.typed="";
  if(t.tries>=GF_TRIES){ t.done=true; t.first=false; t.fail=true; return "fail"; }
  return "again";
}
function _gfAfterJudge(st,t,r){
  if(r==="again"){ try{ matchBonk(); }catch(e){} st.msg="Almost \u2014 try again!"; _mastRe(); return; }
  if(r==="fail") try{ matchBonk(); }catch(e){}
  _gfProduced(st,r==="fail"?"We\u2019ll come back to that one.":""); _mastRe();
}
// The card was produced (or the kid tapped 🗣, or missed it twice): answer the ask from the app's real hand, or lay the fished pair down.
function _gfProduced(st,lead){
  const s=st.step, pid=s.pid, why=s.why, t=st.turns[s.t], say=lead?lead+" ":"", ding=()=>{ if(!(t&&t.fail)) try{ matchDing(); }catch(e){} };
  if(why==="ask"){
    if(st.app.indexOf(pid)>=0){ _gfTake(st.app,pid); _gfTake(st.hand,pid); st.table.push({pid:pid,who:"kid"}); ding(); st.msg="Yes! Here you go. Ask me again!"; _gfSay(st,say+"Yes! Here you go."); return _gfBeat(st,"kid"); }
    if(!st.pond.length){ st.msg="Go fish! But the pond is empty \u2014 my turn."; _gfSay(st,say+"Go fish! The pond is empty, so it's my turn."); return _gfBeat(st,"app"); }
    st.step={k:"fish"}; st.msg="Go fish! Tap the pond."; _gfSay(st,say+"Go fish!"); return;
  }
  if(why==="fished"){ _gfTake(st.hand,pid); _gfTake(st.hand,pid); st.table.push({pid:pid,who:"kid"}); ding(); st.msg="Down it goes! Ask me again!"; _gfSay(st,say+"Down it goes!"); return _gfBeat(st,"kid"); }
  if(why==="appfished"){ _gfTake(st.app,pid); _gfTake(st.app,pid); st.table.push({pid:pid,who:"app"}); ding(); st.msg="Down it goes! Your turn."; _gfSay(st,say+"Down it goes! Your turn."); return _gfBeat(st,"kid"); }
  if(t&&t.first){ ding(); st.msg="That\u2019s it!"; _gfSay(st,say+"That\u2019s it!"); } else { st.msg="Okay \u2014 next one."; _gfSay(st,say+"Next one."); }   // "back": nothing moves
  return _gfBeat(st,"back");
}
function gofishFish(){   // 🎣 the kid taps the pond
  const st=gofishState; if(!st||st.phase!=="play"||st.lock||!st.step||st.step.k!=="fish") return;
  if(!st.pond.length){ st.msg="The pond is empty \u2014 my turn."; _gfSay(st,"The pond is empty. My turn!"); _gfBeat(st,"app"); _mastRe(); return; }
  const pid=st.pond.pop(), had=st.hand.indexOf(pid)>=0;
  st.hand.push(pid);
  if(had){ _gfProduce(st,pid,"fished"); _mastRe(); return; }
  st.msg="Into your hand it goes. My turn!"; _gfSay(st,"My turn!"); _gfBeat(st,"app"); _mastRe();
}
// ── the app's turn: it asks for a card it really holds (one it hasn't asked for yet, when it can) ──
function _gfAppTurn(st){
  if(_gfDown(st)) return _gfEnd(st);
  if(!st.app.length){ if(!st.pond.length) return _gfEnd(st); st.app.push(st.pond.pop()); }
  const fresh=st.app.filter(p=>!st.asked[p]), pid=_gfPick(fresh.length?fresh:st.app);
  st.asked[pid]=1;
  _gfFind(st,pid,false);
}
function _gfFind(st,pid,back){
  const t=_gfTurn(st,pid,"find","find"); t.back=!!back;
  st.step={k:"find",pid:pid,t:st.turns.length-1,back:!!back};
  const it=_gfIt(st,pid), ans=st.kinds[pid]!=="say", ask=ans?_whichBack(it):gofishName(it);
  st.msg=ans?"Do you have\u2026 "+ask+"?":"Do you have\u2026 (listen!)";   // a picture / letter is said, never written
  _gfSay(st,"Do you have "+ask+"?");
}
function gofishFindTap(i){
  const st=gofishState; if(!st||st.lock||st.phase==="done"||!st.step||st.step.k!=="find") return;
  const t=st.turns[st.step.t], pid=st.hand[i]; if(!t||pid==null||t.wrong[pid]) return;
  if(typeof gameCardAnswered==="function") gameCardAnswered(t);   // ⏱ CARDSECS: the first answer on this card stops its clock
  if(pid!==t.pid){ t.wrong[pid]=1; try{ matchBonk(); }catch(e){} st.msg="Almost \u2014 listen again!"; gofishSayAgain(); _mastRe(); return; }
  t.done=true; t.first=!Object.keys(t.wrong).length;
  try{ matchDing(); }catch(e){}
  if(st.step.back){ st.msg="That\u2019s it!"; _gfSay(st,"That\u2019s it!"); _gfBeat(st,"back"); _mastRe(); return; }
  _gfTake(st.hand,pid); _gfTake(st.app,pid); st.table.push({pid:pid,who:"app"});
  st.msg="Thank you! I\u2019ll ask again."; _gfSay(st,"Thank you!"); _gfBeat(st,"app"); _mastRe();
}
function gofishGoFish(){   // 🎣 "Go fish!" — the kid says they don't have it
  const st=gofishState; if(!st||st.lock||st.phase==="done"||!st.step||st.step.k!=="find"||st.step.back) return;
  const t=st.turns[st.step.t]; if(!t) return;
  if(typeof gameCardAnswered==="function") gameCardAnswered(t);   // ⏱ CARDSECS: the first answer on this card stops its clock
  if(st.hand.indexOf(t.pid)>=0){ t.wrong["gofish"]=1; try{ matchBonk(); }catch(e){} st.msg="Look again \u2014 you have it!"; gofishSayAgain(); _mastRe(); return; }
  t.done=true; t.first=!Object.keys(t.wrong).length;
  if(t.first) t.nolog=true;   // ⚖️ GAMEJUDGE (games audit): the card was never in the kid's hand — a right "Go fish!" knows nothing about IT, so it isn't logged
  if(!st.pond.length){ st.msg="The pond is empty \u2014 your turn!"; _gfSay(st,"The pond is empty. Your turn!"); _gfBeat(st,"kid"); _mastRe(); return; }
  const pid=st.pond.pop(), had=st.app.indexOf(pid)>=0;
  st.app.push(pid);
  if(had){ _gfProduce(st,pid,"appfished"); _mastRe(); return; }
  st.msg="Go fish for me\u2026 no pair. Your turn!"; _gfSay(st,"No pair. Your turn!"); _gfBeat(st,"kid"); _mastRe();
}
// ⚖️ GAMEJUDGE: a say card's produce goes to the shared judge. Right → as the honor tap was (the ask is answered / the pair goes down).
// Wrong → a miss like a missed find: ok:false in the log, the bonk, "It's <name>." said (the right one stays lit), and the card is NOT a
// pair yet — an ask goes unanswered (the app's turn); a fished card goes back to the bottom of the pond (the app's turn); an app-fished
// pair is the app's and still goes down; a come-back moves on. Like any miss it comes back once at the end.
function _gfJudgeOpen(st,t,lead){
  if(!st.judge||t.act!=="say"||typeof gameJudgeAct!=="function") return;
  const it=_gfIt(st,t.pid); if(!it) return;
  const deck=it.subject||"Other", names=_gfWhichPool(_gfItems(st.kid),st.kid).filter(x=>x&&x.id!==it.id&&(x.subject||"Other")===deck).map(x=>gofishName(x));
  if(gameJudgeAct(st,t,{kid:st.kid,deck:deck,right:gofishName(it),names:names,mode:st.judge,n:st.nch,shuffle:_gfShuffle,
    live:()=>gofishState===st&&_gfProdTurn(st,"say")===t&&!t.done, line:s=>{ st.msg=lead+s; },
    onRight:x=>_gfJudged(st,x,true), onWrong:(x,g)=>_gfJudged(st,x,false,g)})) t.judge=st.judge;   // false (no other name) → the honor tap
}
function _gfJudged(st,t,right,given){
  const name=gofishName(_gfIt(st,t.pid));
  t.done=true; t.first=!!right;
  if(right) return _gfProduced(st,name);   // the name said back, as before
  t.tries=1; t.fail=true; t.wrong[(given!=null&&String(given)!=="")?String(given):"1"]=1;
  try{ matchBonk(); }catch(e){}
  const s=st.step, lead="It\u2019s "+name+".";
  if(s.why==="ask"){ st.msg=lead+" Not a pair yet \u2014 my turn."; _gfSay(st,lead+" Not a pair yet. My turn!"); return _gfBeat(st,"app",GF_BEAT_LONG); }
  if(s.why==="fished"){ _gfTake(st.hand,s.pid); st.pond.unshift(s.pid); st.msg=lead+" Not a pair yet \u2014 back in the pond. My turn!"; _gfSay(st,lead+" Back in the pond. My turn!"); return _gfBeat(st,"app",GF_BEAT_LONG); }
  return _gfProduced(st,lead);   // the app's own pair still goes down; a come-back moves on
}
// ── the end: every pair is down → the missed cards come back once, each as the act it was missed on → finish ──
function _gfEnd(st){
  if(st.phase!=="play") return;
  st.phase="back"; st.step=null; st.hand=[]; st.app=[];
  const seen={}, backs=[];
  st.turns.forEach(t=>{ if(t.back||seen[t.pid]) return; if(Object.keys(t.wrong).length||t.fail){ seen[t.pid]=1; backs.push({pid:t.pid,act:t.act}); } });
  st.backs=backs;
  if(!backs.length) return _gfFinish(st);
  st.msg="All the pairs are down! Let\u2019s look at a few again."; _gfSay(st,"All the pairs are down! Let's look at a few again."); _gfBeat(st,"back",GF_BEAT_LONG);
}
function _gfBackNext(st){
  const b=st.backs&&st.backs.shift();
  if(!b) return _gfFinish(st);
  if(b.act==="find"){ st.hand=_gfBackHand(st,b.pid); _gfFind(st,b.pid,true); return; }
  _gfProduce(st,b.pid,"back");
}
// Three cards for a last find: the missed card + two others from the round with different names
function _gfBackHand(st,pid){
  const nm=x=>_whichNorm(st.kinds[x.id]==="say"?gofishName(x):_whichBack(x)), seen={}, it=_gfIt(st,pid);
  if(it) seen[nm(it)]=1;
  const others=_gfShuffle(st.pairs.filter(p=>p!==pid)).map(p=>_gfIt(st,p)).filter(x=>x&&!seen[nm(x)]&&(seen[nm(x)]=1)).slice(0,2).map(x=>x.id);
  return _gfShuffle([pid].concat(others));
}
function gofishBestKey(deck){ return deck+" \u{00B7} gofish"; }
// PURE: clean pairs — the cards whose every act in the round (not the come-back) was right the first time
function gofishClean(st){ const bad={}; st.turns.forEach(t=>{ if(!t.back&&(!t.first||t.fail)) bad[t.pid]=1; }); return st.pairs.filter(p=>!bad[p]).length; }
function _gfFinish(st){
  st.phase="done"; st.step=null; st.lock=false; st.after=null;
  st.first=gofishClean(st);
  const kid=st.kid||masteryKid;   // GAMEKID
  try{ if(typeof gameLogRound==="function") gameLogRound(st); }catch(e){}   // 🎮 GAMELOG: every act's result, game:"gofish"
  const s=masteryData[kid+"_settings"]||(masteryData[kid+"_settings"]={});
  if(!s.match_best) s.match_best={};
  const key=gofishBestKey(st.deck), prev=s.match_best[key];
  st.prevBest=prev==null?null:prev;
  st.isPB=st.first>0&&(prev==null||st.first>prev);
  if(st.isPB){
    s.match_best[key]=st.first;
    if(db&&!_dryRun()) db.ref("mastery/"+kid+"_settings/match_best").update({[(typeof haKey==="function"?haKey(key):key)]:st.first});   // this key only
    try{HA_LS.setItem("ha_mastery",JSON.stringify(masteryData));}catch(e){}
  }
  st.msg="All the pairs are down!"; st.say="";
  try{ if(st.of>0&&st.first===st.of&&typeof _showCelebration==="function"&&document.getElementById("celeb-overlay")) _showCelebration(kid,"\u{1F41F} All the pairs are down!",{noSong:true}); }catch(e){}
}
// GAMEKID → 🎲 GAMEKIT resume: a beat that was mid-way when the kid switched settles here (no render; the caller renders)
function gofishResume(){
  const st=gofishState; if(!st||st.phase==="done") return;
  if(st.lock){ st.lock=false; const a=st.after; st.after=null; _gfGo(st,a); return; }
  if(st.say&&(typeof mastView==="undefined"||mastView==="gofish")) try{ mastSpeak(st.say); }catch(e){}   // back to the round: hear the ask again
}
// ── the screen ──
const GF_CSS='<style>.gf-card{width:92px;height:104px;border-radius:14px;border:3px solid #e2ddd6;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer;padding:0;-webkit-tap-highlight-color:transparent;transition:transform .2s,opacity .2s}'+
  '.gf-card .gf-vis{pointer-events:none;transform:scale(.95)}.gf-card .gf-txt{pointer-events:none;font-family:\'Fraunces\',serif;font-weight:800;font-size:22px;line-height:1.1;color:#292524;text-align:center;padding:4px;overflow-wrap:anywhere}'+
  '.gf-card.gf-wrong{opacity:.28;filter:grayscale(1);cursor:default}.gf-card.gf-still{cursor:default;opacity:.8}.gf-card[disabled]{color:#292524}.gf-card.gf-big{width:150px;height:160px;border-color:#a78bfa;background:#f5f3ff;cursor:default}.gf-card.gf-big .gf-vis{transform:scale(1.5)}.gf-card.gf-big .gf-txt{font-size:38px}'+
  '.gf-pair{width:44px;height:44px;border-radius:10px;border:2px solid #e2ddd6;background:#fff;display:inline-flex;align-items:center;justify-content:center;overflow:hidden}.gf-pair .gf-vis{transform:scale(.5);pointer-events:none}.gf-pair .gf-txt{font-size:11px;padding:2px}'+
  '.gf-pair.gf-slot{border-style:dashed;background:#fafaf9;color:#d6d3d1;font-size:18px}'+
  '.gf-btn{padding:12px 22px;border-radius:999px;border:none;font-size:16px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif;-webkit-tap-highlight-color:transparent}.gf-btn[disabled],.gf-key[disabled],.gf-opt[disabled]{opacity:.45;cursor:default}'+
  '.gf-key{width:64px;height:56px;border-radius:14px;border:2px solid #e2ddd6;background:#fff;font-family:\'Fraunces\',serif;font-size:26px;font-weight:800;color:#292524;cursor:pointer}'+
  '.gf-opt{min-width:96px;padding:14px 18px;border-radius:16px;border:3px solid #e2ddd6;background:#fff;font-family:\'Fraunces\',serif;font-size:24px;font-weight:800;color:#292524;cursor:pointer;overflow-wrap:anywhere}.gf-opt.gf-wrong{opacity:.28;filter:grayscale(1);cursor:default}</style>';
function _gfCardVis(st,pid){
  const it=_gfIt(st,pid); if(!it) return '';
  if(st.kinds[pid]==="say"){ const v=_smTileVis(it); if(v) return '<span class="gf-vis">'+v+'</span>'; }
  return '<span class="gf-txt">'+esc(gofishName(it))+'</span>';   // an answer card shows its FRONT (the kid produces the back)
}
function buildGofishHtml(color){
  const q=s=>String(s).replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,"&quot;");
  let h=GF_CSS+'<div style="padding:4px 14px 24px;max-width:720px;margin:0 auto">';
  const items=_gfItems(), decks=gofishDecks(items);
  if(!decks.length){ h+='<div class="mast-none">No decks ready for Go Fish yet \u{2014} it needs '+GF_MIN+' or more cards with a picture (or a short answer on the back).</div></div>'; return h; }
  const st=gofishState;
  const chip=(dk,lbl)=>{ const sel=st&&st.deck===dk; return '<button onclick="gofishStart(\''+q(dk)+'\')" style="padding:10px 16px;border-radius:999px;font-size:14px;font-weight:800;border:2px solid '+(sel?color:'#e2ddd6')+';background:'+(sel?color:'#fff')+';color:'+(sel?'#fff':'#57534e')+';cursor:pointer;font-family:\'DM Sans\',sans-serif">'+lbl+'</button>'; };
  if(!st||st.phase==="done"){
    h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 14px">';
    decks.forEach(dk=>{ h+=chip(dk,esc(dk)); });
    if(decks.length>1) h+=chip(WHICH_MIX,"\u{1F3B2} "+WHICH_MIX);
    h+='</div>';
  }
  if(!st){ h+='<div style="font-size:15px;font-weight:700;color:#57534e">\u{1F41F} Pick a deck. Ask me for a card by saying what it is \u{2014} if I have it, the pair goes down!</div></div>'; return h; }
  const s=masteryData[st.kid+"_settings"]||{}, best=(s.match_best||{})[gofishBestKey(st.deck)];
  // the table: one slot per pair, filled as the pairs go down (shared — no "mine / yours")
  const down={}; st.table.forEach(p=>{ down[p.pid]=1; });
  const table=st.pairs.map(p=>down[p]?'<span class="gf-pair">'+_gfCardVis(st,p)+'</span>':'<span class="gf-pair gf-slot">\u{1F41F}</span>').join('');
  if(st.phase!=="done"){
    h+='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0 4px;flex-wrap:wrap"><div style="display:flex;gap:4px;flex-wrap:wrap">'+table+'</div>';
    h+='<span style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--muted)">'+esc(st.deck)+(best!=null?' \u{00B7} \u{1F3C6} '+best:'')+
      '<button onclick="gofishStop()" style="padding:6px 12px;border-radius:999px;border:1.5px solid #e2ddd6;background:#fff;color:#57534e;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap;font-family:\'DM Sans\',sans-serif">\u{21A9} Stop</button></span></div>';
    // the app's line, with 🔊 to hear it again
    h+='<div style="display:flex;align-items:center;gap:10px;margin:10px 0 12px;padding:12px 14px;border-radius:18px;background:#f0f9ff;border:2px solid #bae6fd"><span style="font-size:30px;line-height:1">\u{1F41F}</span><span style="flex:1;font-size:17px;font-weight:800;color:#0c4a6e">'+esc(st.msg)+'</span>'+
      (st.say?'<button onclick="gofishSayAgain()" aria-label="Hear it again" style="width:56px;height:56px;flex:none;border-radius:50%;border:3px solid '+color+';background:#fff;color:'+color+';font-size:26px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center">\u{1F50A}</button>':'')+'</div>';
    const sp=st.step, lock=st.lock, t=sp&&sp.t!=null?st.turns[sp.t]:null;
    if(typeof gameCardShown==="function") gameCardShown(t);   // ⏱ CARDSECS: the card is on screen — its clock starts at the first paint
    const hand=(fn,wrong)=>{ let x='<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:6px 0 12px">';
      st.hand.forEach((pid,i)=>{ const w=!!(wrong&&wrong[pid]); x+='<button class="gf-card'+(w?' gf-wrong':'')+(fn?'':' gf-still')+'" aria-label="Card '+(i+1)+'"'+(fn&&!w&&!lock?' onclick="'+fn+'('+i+')"':' disabled')+'>'+_gfCardVis(st,pid)+'</button>'; });
      return x+'</div>'; };
    const pond='<span style="font-size:13px;font-weight:700;color:var(--muted)">\u{1F30A} pond: '+st.pond.length+'</span>';
    if(sp&&sp.k==="ask"){ h+='<div style="text-align:center;font-size:13px;font-weight:700;color:var(--muted);margin-top:8px">Your hand \u{00B7} '+pond+'</div>'+hand("gofishAsk"); }
    else if(sp&&sp.k==="fish"){ h+='<div style="display:flex;justify-content:center;margin:14px 0"><button class="gf-btn" onclick="gofishFish()" style="background:'+color+';color:#fff;font-size:20px;padding:18px 34px">\u{1F3A3} Go fish!</button></div><div style="text-align:center;font-size:13px;font-weight:700;color:var(--muted)">Your hand \u{00B7} '+pond+'</div>'+hand(null); }
    else if(sp&&sp.k==="find"){ h+='<div style="text-align:center;font-size:13px;font-weight:700;color:var(--muted);margin-top:8px">'+(sp.back?'Find it!':'Your hand \u{00B7} '+pond)+'</div>'+hand("gofishFindTap",t&&t.wrong);
      if(!sp.back) h+='<div style="display:flex;justify-content:center"><button class="gf-btn" onclick="gofishGoFish()"'+(lock?' disabled':'')+' style="background:#fff;color:'+color+';border:2px solid '+color+'">\u{1F3A3} Go fish!</button></div>'; }
    else if(sp&&sp.k==="produce"&&t){
      h+='<div style="display:flex;justify-content:center;margin:6px 0 12px"><span class="gf-card gf-big">'+_gfCardVis(st,sp.pid)+'</span></div>';
      if(t.act==="say"&&t.gj&&typeof gameJudgeHtml==="function") h+=gameJudgeHtml(t,color,lock);   // ⚖️ GAMEJUDGE: the choices / the typing box / Mom's ✓ ✗
      else if(t.act==="say") h+='<div style="display:flex;justify-content:center"><button class="gf-btn" onclick="gofishSaid()"'+(lock?' disabled':'')+' style="background:'+color+';color:#fff;font-size:20px;padding:18px 34px">\u{1F5E3} I said it</button></div>';
      else if(t.act==="type"){
        h+='<div style="display:flex;justify-content:center;margin-bottom:10px"><span style="min-width:120px;height:56px;border-radius:14px;border:3px solid '+color+';background:#fff;font-family:\'Fraunces\',serif;font-size:30px;font-weight:800;color:#292524;display:inline-flex;align-items:center;justify-content:center;padding:0 14px">'+esc(t.typed||"")+'</span></div>';
        h+='<div style="display:grid;grid-template-columns:repeat(3,64px);gap:8px;justify-content:center">';
        ["1","2","3","4","5","6","7","8","9","back","0","ok"].forEach(k=>{ if(k==="back") h+='<button class="gf-key" onclick="gofishKey(\'back\')"'+(lock?' disabled':'')+' aria-label="Erase">\u{232B}</button>'; else if(k==="ok") h+='<button class="gf-key" onclick="gofishCheck()"'+(lock||!t.typed?' disabled':'')+' style="background:'+color+';color:#fff;border-color:transparent" aria-label="Check">\u{2714}</button>'; else h+='<button class="gf-key" onclick="gofishKey(\''+k+'\')"'+(lock?' disabled':'')+'>'+k+'</button>'; });
        h+='</div>';
      } else {
        h+='<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">';
        (t.opts||[]).forEach((o,i)=>{ const w=!!t.wrong[o]; h+='<button class="gf-opt'+(w?' gf-wrong':'')+'" onclick="gofishPickTap('+i+')"'+(w||lock?' disabled':'')+'>'+esc(o)+'</button>'; });
        h+='</div>';
      }
      if(!lock&&st.hand.length&&sp.why!=="back") h+='<div style="text-align:center;font-size:13px;font-weight:700;color:var(--muted);margin-top:14px">Your hand \u{00B7} '+pond+'</div>'+hand(null);
    }
    return h+'</div>';
  }
  // Finish: the pairs on the table, how many went down clean, Play again / Mix the decks
  h+='<div style="margin-top:6px;text-align:center;padding:16px;border-radius:18px;background:'+(st.isPB?'#f0fdf4':'#f8f7f4')+';border:2px solid '+(st.isPB?'#16a34a':'#e2ddd6')+'">';
  h+='<div style="font-family:\'Fraunces\',serif;font-size:22px;font-weight:800">\u{1F389} All the pairs are down!</div>';
  h+='<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin:12px 0">'+table+'</div>';
  h+='<div style="font-size:17px;font-weight:800;color:#57534e">\u{1F41F} '+st.first+' of '+st.of+' pairs clean'+(st.isPB?' \u{2014} \u{1F3C6} new best!':(st.prevBest!=null?' \u{00B7} best '+st.prevBest:''))+'</div>';
  h+='<div style="display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap">';
  h+='<button onclick="gofishStart(\''+q(st.deck)+'\')" class="gf-btn" style="background:'+color+';color:#fff;font-size:15px">\u{1F501} Play again</button>';
  if(decks.length>1&&!st.mix) h+='<button onclick="gofishStart(\''+q(WHICH_MIX)+'\')" class="gf-btn" style="border:2px solid '+color+';background:#fff;color:'+color+';font-size:15px">\u{1F3B2} '+WHICH_MIX+'</button>';
  return h+'</div></div></div>';
}
// GOFISH_END
// BINGO_START — 🎱 "Bingo" (her yes "I think options for both", 2026-11-02; PLAN_practice_games_2026-10-23.md Tier 1 Picture Bingo).
// The classic for the littlest ones (Pre-K / K, any pre-reader): a board of pictures from the kid's own cards, the app
// SAYS a name, the kid finds it on the board and taps it. Built on Which one?'s cards (whichPool keeps the hidden,
// spelling, phonogram and answer-only cards out): a deck Which one? plays as "picture" (photo, deck visual, emoji, animal,
// color, shape) or "symbol" (letters / numbers / sight words — hear it, tap the glyph; letter bingo is the classic).
//   Board (her "options for both"): 9+ cards → 3×3; 4–8 cards → a small 2×2 board; a small deck ALSO pools into 🎲 Mix
//   the decks (the Mix's board is sized from every picture card the kid has). One picture per name on a board.
//   Calls: the board's own cards in a random order — every picture on the board is asked once (cover-all bingo); the lures
//   are the other tiles, and the choice shrinks as tiles get marked (that's bingo). The name is never written: said once,
//   a big 🔊 says it again, a wrong tap says it again.
//   Right tap → the soft ding, a green stamp on the tile, next call. Wrong tap → that tile greys for this call, the soft
//   bonk, hear it again, try again. The first full line (across, down, corner to corner) → "🎱 BINGO!" — the line glows,
//   small confetti (no song, no points) — then "Fill the whole board!" and the calls go on to a full board.
//   A card that took more than one tap comes back once at the end: the stamps clear and only the missed ones are called
//   again ("One more time!"). No lives, no clock, no competition.
// Writes (only these): <kid>_settings/match_best key "<deck> · bingo" (most on the first tap, only when beaten) and the
//   round's gameLog entry (GAMELOG, game:"bingo", via gameLogRound — the only log). NEVER touches the ladder: no scores,
//   no next-due, no study log. db && !_dryRun() only. Per-kid park / restore / resume through its GAMES_LIST entry (🎲 GAMEKIT).
// ⚖️ BINGOFORCED (games honesty audit §7 #12, her decision via the hub 2026-11-08: "Bingo's forced last call is not counted as a
//   first-try"): every tile is called once, so the last call always has ONE un-stamped tile left — a guaranteed first tap, logged
//   ok:true every round. That call is now not logged at all (nolog, GAMELOG skips it — Battleship's last-tile find does the same) and
//   leaves "N of M on the first tap" and the best (a full 3×3 is "8 of 8"). It is still called, stamped, and fills the board.
let bingoState=null;   // {kid,deck,mix,size,game:"bingo",t0,board:[pid…],marked:{pid:1},turns:[{pid,back,wrong:{},done,first}],i,phase,line,bingo,clearup,first,of,isPB,prevBest,lock,grow,returned:{},gameLogged}
const BINGO_MIX="Mix the decks", BINGO_BIG=9, BINGO_SMALL=4;
function _bingoItems(kid){ let items=(typeof masteryData!=="undefined"&&masteryData&&masteryData[kid||masteryKid])||[]; if(!Array.isArray(items)) items=Object.values(items); return items; }
function _bingoName(i){ return (typeof _whichNorm==="function")?_whichNorm(i&&i.prompt):String((i&&i.prompt)||"").toLowerCase().trim(); }
function _bingoShuffle(a,rnd){ rnd=rnd||Math.random; for(let i=a.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
// The cards Bingo can call: Which one?'s picture / symbol cards (active or introduction, not a production twin, one per
// name in its deck, nothing hidden or waiting). Never an answer-mode deck — a tile must be the picture of what is said.
// 🎮 GAMEGRID: Which one?'s own per-deck cells stand aside here (_gdRaw while asking) — Bingo has its OWN column in Mom's grid,
// so a deck turned off for Which one? still plays Bingo, and bingoDeckOn (below) is the only switch that hides a deck from Bingo.
function _bingoCards(items,kid){
  if(typeof whichPool!=="function"||typeof whichDeckModes!=="function") return [];
  const had=(typeof _gdRaw!=="undefined")?_gdRaw:null;
  try{
    if(had!==null) _gdRaw=true;
    const modes=whichDeckModes(items,kid);
    return whichPool(items,BINGO_MIX,kid).filter(i=>{ const m=modes[i.subject||"Other"]; return m==="picture"||m==="symbol"; });
  } finally{ if(had!==null) _gdRaw=had; }
}
function bingoDeckOn(kid,deck){ return (typeof _gdRaw!=="undefined"&&_gdRaw)||typeof gameDeckOn!=="function"||gameDeckOn(kid||masteryKid,"bingo",deck); }   // 🎮 GAMEGRID: Mom's cell for this deck (default on; the preload asks raw)
function bingoPool(items,kid){ return _bingoCards(items,kid).filter(i=>bingoDeckOn(kid,i.subject||"Other")); }
// One card per name across decks (the Mix: "red" in Colors and "red" in Words would draw two of one picture).
function _bingoDistinct(pool){ const seen={}; return (pool||[]).filter(i=>{ const k=_bingoName(i); if(!k||seen[k]) return false; seen[k]=1; return true; }); }
// PURE: the board side for a card count — 3 (3×3) from BINGO_BIG, 2 (2×2) from BINGO_SMALL, 0 = not enough for a board.
function bingoSize(n){ return n>=BINGO_BIG?3:n>=BINGO_SMALL?2:0; }
// {deck: side} — every deck that fills a board, plus the Mix when two or more decks have cards and together fill one.
// The game's OWN deck list (the games-per-deck grid's preload asks this; it asks raw, so every deck that fills a board is listed).
function bingoDeckList(items,kid){ return Object.keys(bingoDecks(items,kid)).filter(d=>d!==BINGO_MIX); }
function bingoDecks(items,kid){
  const pool=bingoPool(items,kid), by={};
  pool.forEach(i=>{ const d=i.subject||"Other"; by[d]=(by[d]||0)+1; });
  const out={};
  Object.keys(by).sort().forEach(d=>{ const s=bingoSize(by[d]); if(s) out[d]=s; });
  if(Object.keys(by).length>1){ const s=bingoSize(_bingoDistinct(pool).length); if(s) out[BINGO_MIX]=s; }
  return out;
}
// PURE: the lines of an n×n board as cell indexes — rows, columns, the two corner-to-corner runs.
function bingoLines(n){
  const L=[];
  for(let r=0;r<n;r++){ const row=[], col=[]; for(let c=0;c<n;c++){ row.push(r*n+c); col.push(c*n+r); } L.push(row); L.push(col); }
  const d1=[], d2=[]; for(let i=0;i<n;i++){ d1.push(i*n+i); d2.push(i*n+(n-1-i)); } L.push(d1); L.push(d2);
  return L;
}
// PURE: the first full line on the board (cells), or null.
function bingoLineDone(board,marked,n){ return bingoLines(n).find(l=>l.every(ci=>marked[board[ci]]))||null; }
function _bingoSay(st){
  const t=st&&st.turns[st.i]; if(!t) return;
  const it=_bingoItems(st.kid).find(x=>x&&x.id===t.pid);
  if(it&&it.prompt) try{ mastSpeak(_matchPlain(it.prompt)); }catch(e){}
}
function bingoStart(deck){
  try{ if(typeof bbAudioUnlock==="function") bbAudioUnlock(); }catch(e){}   // the deck tap unlocks the ding / bonk (iPad)
  const items=_bingoItems(), decks=bingoDecks(items), size=decks[deck]||0, mix=deck===BINGO_MIX;
  const pool=_bingoDistinct(bingoPool(items).filter(i=>mix||i.subject===deck));
  if(!size||pool.length<size*size){ bingoState=null; _mastRe(); return; }
  const board=_bingoShuffle(pool.slice()).slice(0,size*size).map(i=>i.id);   // a fresh pick of the deck each round
  const turns=_bingoShuffle(board.slice()).map(pid=>({pid:pid,back:false,wrong:{},done:false,first:false}));   // every tile asked once
  bingoState={kid:masteryKid,deck:deck,mix:mix,size:size,game:"bingo",t0:Date.now(),board:board,marked:{},turns:turns,i:0,phase:"play",line:null,bingo:false,clearup:false,first:0,of:turns.length,isPB:false,prevBest:null,lock:false,grow:null,returned:{}};
  _mastRe();
  _bingoSay(bingoState);   // the first name, inside the tap
}
function bingoSayAgain(){ _bingoSay(bingoState); }
function bingoChangeDeck(){ bingoState=null; _mastRe(); }   // drop the round as it stands: nothing written
function bingoTap(ci){
  const st=bingoState; if(!st||st.phase!=="play"||st.lock) return;
  const t=st.turns[st.i]; if(!t) return;
  const pid=st.board[ci]; if(pid==null||st.marked[pid]||t.wrong[pid]) return;   // a stamped tile, or one greyed this call, is not a tap
  if(typeof gameCardAnswered==="function") gameCardAnswered(t);   // ⏱ CARDSECS: the first answer on this card stops its clock
  if(pid!==t.pid){
    t.wrong[pid]=1;
    try{ matchBonk(); }catch(e){}
    _mastRe();
    _bingoSay(st);   // hear it again, then try again
    return;
  }
  t.done=true; t.first=!Object.keys(t.wrong).length;
  if(!t.back&&st.board.filter(p=>!st.marked[p]).length<=1){ t.nolog=true; st.of=Math.max(0,st.of-1); }   // ⚖️ BINGOFORCED: one tile left — a forced tap, not a first try
  else if(!t.back&&t.first) st.first++;
  // A card that took more than one tap comes back once, after the board is full.
  if(!t.first&&!t.back&&!st.returned[t.pid]){ st.returned[t.pid]=1; st.turns.push({pid:t.pid,back:true,wrong:{},done:false,first:false}); }
  st.marked[pid]=1;
  try{ matchDing(); }catch(e){}
  let gotLine=false;
  if(!st.bingo&&!st.clearup){ const line=bingoLineDone(st.board,st.marked,st.size); if(line){ st.bingo=true; st.line=line; gotLine=true;
    try{ if(typeof _showCelebration==="function"&&document.getElementById("celeb-overlay")) _showCelebration(st.kid,"\u{1F3B1} BINGO!",{noSong:true}); }catch(e){} } }
  st.grow=ci; st.lock=true;
  _mastRe();
  const at=st.i; setTimeout(()=>{ if(bingoState===st&&st.lock&&st.i===at) bingoNext(st); },gotLine?1600:900);   // GAMEKID: never advances a parked / settled turn
}
// PURE over the state: step to the next call (the comeback clears the stamps the first time it is reached); finishes the round at the end.
function _bingoStep(st){
  st.grow=null; st.lock=false;
  st.i++;
  if(st.i>=st.turns.length){ bingoFinish(st); return; }
  if(st.turns[st.i].back&&!st.clearup){ st.clearup=true; st.marked={}; st.line=null; }   // "One more time!" — only the missed ones are called
}
function bingoNext(st){
  st=st||bingoState; if(!st||st!==bingoState) return;
  _bingoStep(st);
  _mastRe();
  if(st.phase==="play"&&(typeof mastView==="undefined"||mastView==="bingo")) _bingoSay(st);
}
// GAMEKID → 🎲 GAMEKIT resume: a tap that was mid-step when the kid switched settles here (no render; the caller renders)
function bingoResume(){
  const st=bingoState; if(!st||st.phase!=="play") return;
  if(st.lock) _bingoStep(st);
  if(st.phase==="play"&&(typeof mastView==="undefined"||mastView==="bingo")) _bingoSay(st);
}
function bingoBestKey(deck){ return deck+" \u{00B7} bingo"; }
function bingoFinish(st){
  st.phase="done";
  const kid=st.kid||masteryKid;   // GAMEKID
  try{ if(typeof gameLogRound==="function") gameLogRound(st); }catch(e){}   // 🎮 GAMELOG: every card's first-tap result, game:"bingo"
  const s=masteryData[kid+"_settings"]||(masteryData[kid+"_settings"]={});
  if(!s.match_best) s.match_best={};
  const key=bingoBestKey(st.deck), prev=s.match_best[key];
  st.prevBest=prev==null?null:prev;
  st.isPB=st.first>0&&(prev==null||st.first>prev);
  if(st.isPB){
    s.match_best[key]=st.first;
    if(db&&!_dryRun()) db.ref("mastery/"+kid+"_settings/match_best").update({[(typeof haKey==="function"?haKey(key):key)]:st.first});   // this key only
    try{HA_LS.setItem("ha_mastery",JSON.stringify(masteryData));}catch(e){}
  }
}
const BINGO_CSS='<style>.bingo-cell{position:relative;aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:20px;border:3px solid #e2ddd6;background:#fff;cursor:pointer;overflow:hidden;transition:transform .25s,opacity .2s;-webkit-tap-highlight-color:transparent}'+
  '.bingo-cell .bingo-vis{transform:scale(1.1);pointer-events:none}.bingo-2 .bingo-cell .bingo-vis{transform:scale(1.6)}@media(min-width:560px){.bingo-cell .bingo-vis{transform:scale(1.6)}.bingo-2 .bingo-cell .bingo-vis{transform:scale(2.1)}}'+
  '.bingo-cell.bingo-wrong{opacity:.28;filter:grayscale(1);cursor:default}.bingo-cell.bingo-grow{transform:scale(1.08);border-color:#16a34a;background:#f0fdf4;box-shadow:0 0 0 5px #bbf7d0}'+
  '.bingo-cell.bingo-marked{cursor:default;border-color:#86efac;background:#f0fdf4}.bingo-cell.bingo-marked .bingo-vis{opacity:.55}'+
  '.bingo-stamp{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:clamp(34px,9vw,64px);color:#16a34a;text-shadow:0 2px 0 #fff,0 0 12px #fff;pointer-events:none}'+
  '.bingo-cell.bingo-line{border-color:#f59e0b;background:#fffbeb;box-shadow:0 0 0 4px #fde68a}.bingo-cell.bingo-line .bingo-stamp{color:#d97706}</style>';
function buildBingoHtml(color){
  const q=s=>String(s).replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,"&quot;");
  let h=BINGO_CSS+'<div style="padding:4px 14px 24px;max-width:720px;margin:0 auto">';
  const items=_bingoItems(), decks=bingoDecks(items), names=Object.keys(decks).filter(d=>d!==BINGO_MIX);
  if(!Object.keys(decks).length){
    h+='<div class="mast-none">No decks ready for Bingo yet \u{2014} it needs 4 or more cards with a picture (9 for a big board).</div></div>';
    return h;
  }
  const st=bingoState;
  const chip=(dk,lbl)=>{ const sel=st&&st.deck===dk; return '<button onclick="bingoStart(\''+q(dk)+'\')" style="padding:10px 16px;border-radius:999px;font-size:14px;font-weight:800;border:2px solid '+(sel?color:'#e2ddd6')+';background:'+(sel?color:'#fff')+';color:'+(sel?'#fff':'#57534e')+';cursor:pointer;font-family:\'DM Sans\',sans-serif">'+lbl+(decks[dk]===2?' <span style="font-weight:700;opacity:.7">\u{00B7} small</span>':'')+'</button>'; };
  if(!st||st.phase==="done"){
    h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 14px">';
    names.forEach(dk=>{ h+=chip(dk,esc(dk)); });
    if(decks[BINGO_MIX]) h+=chip(BINGO_MIX,"\u{1F3B2} "+BINGO_MIX);
    h+='</div>';
  }
  if(!st){
    h+='<div style="font-size:15px;font-weight:700;color:#57534e">\u{1F442} Pick a deck. Listen, then find it on your board!</div></div>';
    return h;
  }
  const s=masteryData[st.kid+"_settings"]||{};
  const best=(s.match_best||{})[bingoBestKey(st.deck)];
  if(st.phase==="play"){
    const t=st.turns[st.i], n=st.size;
    if(typeof gameCardShown==="function") gameCardShown(t);   // ⏱ CARDSECS: the card is on screen — its clock starts at the first paint
    h+='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0 4px">';
    h+='<div style="display:flex;gap:6px;flex-wrap:wrap">';
    st.turns.forEach((x,ix)=>{ const cur=ix===st.i; h+='<span style="width:14px;height:14px;border-radius:50%;display:inline-block;'+(x.done?'background:'+(x.first?'#16a34a':'#f59e0b'):cur?'background:#fff;border:3px solid '+color:'background:#e7e5e4')+'"></span>'; });
    h+='</div>';
    h+='<span style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--muted)">'+esc(st.deck)+(best!=null?' \u{00B7} \u{1F3C6} '+best:'')+
      '<button onclick="bingoChangeDeck()" style="padding:6px 12px;border-radius:999px;border:1.5px solid #e2ddd6;background:#fff;color:#57534e;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap;font-family:\'DM Sans\',sans-serif">\u{1F5C2} Change deck</button></span></div>';
    const wrongNow=!!(t&&Object.keys(t.wrong).length), justLine=!!(st.lock&&st.line&&st.line.indexOf(st.grow)>=0&&!st.clearup);
    h+='<div style="display:flex;justify-content:center;margin:10px 0 6px"><button onclick="bingoSayAgain()" aria-label="Hear it again" style="width:96px;height:96px;border-radius:50%;border:4px solid '+color+';background:#fff;color:'+color+';font-size:46px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center">\u{1F50A}</button></div>';
    h+='<div style="text-align:center;font-size:'+(justLine?'24px':'17px')+';font-weight:800;color:'+(justLine?'#d97706':'#57534e')+';margin-bottom:12px;font-family:'+(justLine?'\'Fraunces\',serif':'inherit')+'">'+
      (justLine?'\u{1F3B1} BINGO!':wrongNow?'Almost \u{2014} listen again!':st.clearup?'One more time \u{2014} find the one you hear!':st.bingo?'Fill the whole board!':'Find the one you hear!')+'</div>';
    h+='<div class="bingo-'+n+'" style="display:grid;grid-template-columns:repeat('+n+',1fr);gap:'+(n===2?'16px':'12px')+';max-width:'+(n===2?'440px':'720px')+';margin:0 auto">';
    st.board.forEach((pid,ci)=>{
      const it=items.find(x=>x&&x.id===pid), marked=!!st.marked[pid], onLine=!!(st.line&&st.line.indexOf(ci)>=0);
      const cls='bingo-cell'+(marked?' bingo-marked':'')+(onLine?' bingo-line':'')+(t&&t.wrong[pid]?' bingo-wrong':'')+(st.grow===ci?' bingo-grow':'');
      h+='<div class="'+cls+'" role="button" aria-label="Picture '+(ci+1)+'" onclick="bingoTap('+ci+')"><span class="bingo-vis">'+(_smTileVis(it)||'')+'</span>'+(marked?'<span class="bingo-stamp">\u{2713}</span>':'')+'</div>';
    });
    h+='</div></div>';
    return h;
  }
  // Finish: the board's pictures, first-tap count, Play again / Mix the decks. Pictures only — no names.
  h+='<div style="margin-top:6px;text-align:center;padding:16px;border-radius:18px;background:'+(st.isPB?'#f0fdf4':'#f8f7f4')+';border:2px solid '+(st.isPB?'#16a34a':'#e2ddd6')+'">';
  h+='<div style="font-family:\'Fraunces\',serif;font-size:22px;font-weight:800">\u{1F3B1} BINGO \u{2014} board full!</div>';
  h+='<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin:12px 0">';
  st.board.forEach(pid=>{ const it=items.find(y=>y&&y.id===pid);
    h+='<span style="width:72px;height:72px;display:inline-flex;align-items:center;justify-content:center;overflow:hidden;border-radius:14px;background:#fff;border:2px solid #e2ddd6"><span style="transform:scale(.8)">'+(_smTileVis(it)||'')+'</span></span>'; });
  h+='</div>';
  h+='<div style="font-size:17px;font-weight:800;color:#57534e">\u{1F446} '+st.first+' of '+st.of+' on the first tap'+(st.isPB?' \u{2014} \u{1F3C6} new best!':(st.prevBest!=null?' \u{00B7} best '+st.prevBest:''))+'</div>';
  h+='<div style="display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap">';
  h+='<button onclick="bingoStart(\''+q(st.deck)+'\')" style="padding:12px 24px;border-radius:999px;border:none;background:'+color+';color:#fff;font-size:15px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif">\u{1F501} Play again</button>';
  if(decks[BINGO_MIX]&&!st.mix) h+='<button onclick="bingoStart(\''+q(BINGO_MIX)+'\')" style="padding:12px 24px;border-radius:999px;border:2px solid '+color+';background:#fff;color:'+color+';font-size:15px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif">\u{1F3B2} '+BINGO_MIX+'</button>';
  h+='</div></div></div>';
  return h;
}
// BINGO_END
// SORTIT_START — 🧺 "Sort it" (her "sure let's try", 2026-11-02; PLAN_practice_games_2026-10-23.md Tier 1 "Sort it" / Tier 3
// "Group Sort", build order #3). One game, two faces: the little ones sort PICTURES into 2–3 bins (Animals / Colors / Shapes…);
// the readers sort 12 cards into the rules or answers they belong to. The kid drags a card onto a bin, or taps the card and then
// the bin — the sorting IS the recall (plan §2.1), nothing is answered to earn a turn at something else.
// WHERE A BIN COMES FROM (read from the real decks 2026-11-02: no card carries a group / rule field, so nothing is invented):
//   "pic"  — the 🖼 Pictures deck: every card with a BUILT-IN picture (emoji, color dot, shape — never a photo, so a photo ID deck
//            like a chemistry set or a frog unit doesn't sort by "which deck is it from"); the bin is the card's own deck.
//            2–3 bins a round (SORT_PIC_BINS), SORT_PER_BIN pictures each. A deck needs SORT_PER_BIN such cards to be a bin.
//   "back" — any other deck whose BACKS repeat: the shared back is the bin (a rule deck: "Use a before a consonant sound" ×3 →
//            the sentences sort to their rule; math facts: 1+4 / 2+3 / 4+1 → the bin "5"). A card belongs to exactly one bin.
//            A bin needs SORT_MIN_PER cards; a deck plays with 2+ bins and SORT_MIN_CARDS+ cards on the board (her yes to the
//            2-per-bin bar). Up to SORT_BINS_MAX bins and SORT_BOARD cards a round, split evenly; more bins than that → a
//            random SORT_BINS_MAX of them each round. Left out, as in Which one?: spelling / phonograms (_whichLeftOut), a
//            class's hidden cards, a back that is the front, a sound mark, a back too long for a bin label.
//   Tap a picture card: hear its name. Tap a bin with nothing picked: hear the bin's name (a pre-reader's bin labels). Never
//   the answer — the app never says which bin a card belongs in (feedback_howe_dont_do_the_work_for_them).
//   Right bin → the soft ding, the card settles into the bin. Wrong bin → the soft bonk, the card shakes back into the tray
//   (nothing is told), and that card comes back ONCE after the rest are placed (Which one?'s rule). No lives, no clock.
// Writes (only these): <kid>_settings/match_best key "<deck> · sort" (most first-try right, only when beaten) and the round's
//   gameLog entry (GAMELOG, game:"sort" — each card's first/wrong/back; a Pictures round is tagged cat:true, 🧺 SORTPIC
//   2026-11-08, so Scores' Right % and learned-through-games skip it). NEVER touches the ladder: no scores, no next_due,
//   no studyLog. db && !_dryRun() only. A round dropped (Change deck, kid switch) writes nothing. Per-kid park via GAMEKID
//   through the GAMES_LIST entry (🎲 GAMEKIT). Pure pieces (sortDecks / sortRound / sortJudge) are what test_sortit.js runs.
//   🎮 GAMEGRID (Mom's per-deck pick, gameDeckOn(kid,"sort",deck), default on): a rule / answer deck she turned off is out; a
//   picture deck she turned off is no longer a bin (Pictures stays while two bins remain). The grid's own preload (_gdRaw) sees
//   the raw rule; the entry's decks(k) = sortDeckList, the REAL decks Sort it would play (the bins of Pictures, not "Pictures").
let sortState=null;   // {kid,deck,kind,game:"sort",t0,bins:[{key,label,ids:[]}],turns:[{pid,bin,done,first,wrong:{},back}],sel,shake,lit,phase,first,of,isPB,prevBest,returned:{},gameLogged}
const SORT_PIC="Pictures", SORT_BOARD=12, SORT_BINS_MAX=4, SORT_PIC_BINS=3, SORT_PER_BIN=3, SORT_MIN_PER=2, SORT_MIN_CARDS=6, SORT_LABEL_MAX=120;
const SORT_BIN_EMOJI={animals:"\u{1F43E}",colors:"\u{1F3A8}",shapes:"\u{1F537}",dinosaurs:"\u{1F996}",food:"\u{1F34E}",pictures:"\u{1F5BC}"};
function _sortItems(kid){ let items=(typeof masteryData!=="undefined"&&masteryData&&masteryData[kid||masteryKid])||[]; if(!Array.isArray(items)) items=Object.values(items); return items; }
function _sortPlain(s){ return (typeof _matchPlain==="function")?_matchPlain(s):String(s||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(); }
function _sortNorm(s){ return _sortPlain(s).toLowerCase().replace(/\s+/g," ").trim(); }
function _sortShuffle(a,rnd){ rnd=rnd||Math.random; for(let i=a.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
// A card in play for the games: active / introduction, not a 🇬🇧→🇩🇪 production twin, with a front, not one Which one? leaves out.
function _sortInPlay(i,kid){
  if(!i||(i.status!=="active"&&i.status!=="introduction")||i.dir==="prod") return false;
  if(!String(i.prompt||"").trim()) return false;
  try{ if(typeof _whichLeftOut==="function"&&_whichLeftOut(i,kid)) return false; }catch(e){}
  try{ if(typeof envtWaitsForCheckin==="function"&&envtWaitsForCheckin(kid,i.subject)) return false; }catch(e){}   // 📝 a station waiting for its check-in (as Which one?)
  try{ if(typeof cpceHidItem==="function"&&cpceHidItem(kid,i)) return false; }catch(e){}   // 📚 CPCARDSEDIT
  try{ if(typeof cpSecOffItem==="function"&&cpSecOffItem(kid,i)) return false; }catch(e){}   // 🎚 CPSECTIONS
  return true;
}
// The card's built-in picture (emoji / color / shape / a unit's emoji visual) — "" for a photo or no picture at all.
function _sortPic(it){ let v=null; try{ v=(typeof _smTileVis==="function")?_smTileVis(it,true):null; }catch(e){} return (v&&!/^\s*<img/i.test(v))?v:""; }
// The card's back as a bin label — "" when it can't be one (none, the same as the front, a sound mark, too long).
function _sortBack(it,kid){
  let b=""; try{ b=(typeof owRuleBack==="function")?owRuleBack(kid,it):(it.answer!=null?String(it.answer):""); }catch(e){ b=it.answer!=null?String(it.answer):""; }   // OURWORDS
  b=_sortPlain(b); const f=_sortPlain(it.prompt);
  if(!b||!f||_sortNorm(b)===_sortNorm(f)||b.length>SORT_LABEL_MAX||b.charAt(0)==="/") return "";
  return b;
}
// 🎮 GAMEGRID: is this deck on for Sort it? (default on; the grid's preload asks for the raw rule)
function _sortDeckOn(kid,deck){ try{ if(typeof _gdRaw!=="undefined"&&_gdRaw) return true; return typeof gameDeckOn!=="function"||gameDeckOn(kid,"sort",deck)!==false; }catch(e){ return true; } }
// PURE: every deck this kid can sort → {deck:{kind:"pic"|"back", bins:[{key,label,ids:[...]}]}} (bins biggest first)
function sortDecks(items,kid){
  kid=kid||masteryKid;
  const back={}, pic={}, seen={};
  (items||[]).forEach(i=>{
    if(!_sortInPlay(i,kid)) return;
    const d=i.subject||"Other", nk=d+"|"+_sortNorm(i.prompt); if(seen[nk]) return; seen[nk]=1;   // one card per name
    if(!_sortDeckOn(kid,d)) return;   // 🎮 GAMEGRID: Mom's per-deck pick
    if(_sortPic(i)){ (pic[d]||(pic[d]={key:d,label:d,ids:[]})).ids.push(i.id); return; }
    const b=_sortBack(i,kid); if(!b) return;
    const g=back[d]||(back[d]={}), k=_sortNorm(b); (g[k]||(g[k]={key:k,label:b,ids:[]})).ids.push(i.id);
  });
  const out={}, bySize=(a,b)=>b.ids.length-a.ids.length||String(a.label).localeCompare(String(b.label),undefined,{numeric:true});
  const pbins=Object.values(pic).filter(b=>b.ids.length>=SORT_PER_BIN).sort(bySize);
  if(pbins.length>=2) out[SORT_PIC]={kind:"pic",bins:pbins};
  Object.keys(back).sort().forEach(d=>{
    const bins=Object.values(back[d]).filter(b=>b.ids.length>=SORT_MIN_PER).sort(bySize);
    if(bins.length>=2&&bins.reduce((n,b)=>n+b.ids.length,0)>=SORT_MIN_CARDS) out[d]={kind:"back",bins:bins};
  });
  return out;
}
function sortDeckNames(decks){ return Object.keys(decks||{}).sort((a,b)=>(a===SORT_PIC?-1:b===SORT_PIC?1:a.localeCompare(b))); }
// 🎮 GAMEGRID: the REAL decks Sort it would play for this kid (a Pictures bin is its own deck), for the grid's rows
function sortDeckList(items,kid){ const d=sortDecks(items,kid), o={}; Object.keys(d).forEach(n=>{ if(d[n].kind==="pic") d[n].bins.forEach(b=>{ o[b.label]=1; }); else o[n]=1; }); return Object.keys(o).sort(); }
// PURE: one round of a deck → {kind, bins:[{key,label,ids:[]}] (ids = what's been placed, in order), turns:[…] shuffled} or null
function sortRound(deck,decks,rnd){
  rnd=rnd||Math.random;
  const d=decks&&decks[deck]; if(!d) return null;
  const nb=d.kind==="pic"?SORT_PIC_BINS:SORT_BINS_MAX;
  const picks=_sortShuffle(d.bins.slice(),rnd).slice(0,nb);
  if(picks.length<2) return null;
  const cap=d.kind==="pic"?SORT_PER_BIN:Math.ceil(SORT_BOARD/picks.length);
  const turns=[];
  picks.forEach(b=>{ _sortShuffle(b.ids.slice(),rnd).slice(0,cap).forEach(id=>turns.push({pid:id,bin:b.key,done:false,first:false,wrong:{},back:false})); });
  _sortShuffle(turns,rnd);
  const bins=picks.map(b=>({key:b.key,label:b.label,ids:[]})).sort((a,b)=>String(a.label).localeCompare(String(b.label),undefined,{numeric:true}));
  return {kind:d.kind,bins:bins,turns:turns};
}
// PURE over the state: one drop of turn ti onto bin bi → "right" | "wrong" | null (nothing to do). On "right" the card is
// placed; when the tray empties, every card that missed comes back once (the end of the round), else the round is over.
function sortJudge(st,ti,bi){
  const t=st&&st.turns[ti], b=st&&st.bins[bi]; if(!t||!b||t.done) return null;
  if(t.bin!==b.key){ t.wrong[b.key]=1; return "wrong"; }
  t.done=true; t.first=!Object.keys(t.wrong).length;
  b.ids.push(t.pid);
  if(!t.back&&t.first) st.first++;
  if(st.turns.every(x=>x.done)){
    const again=st.turns.filter(x=>!x.first&&!x.back&&!st.returned[x.pid]);
    again.forEach(x=>{ st.returned[x.pid]=1; st.turns.push({pid:x.pid,bin:x.bin,done:false,first:false,wrong:{},back:true}); });
    if(!again.length) st.phase="done";
  }
  return "right";
}
function _sortItem(st,pid){ return _sortItems(st.kid).find(x=>x&&x.id===pid)||null; }
function _sortSilent(it){ try{ return typeof whichSilent==="function"&&whichSilent(it); }catch(e){ return false; } }
function _sortSayCard(st,t){ const it=t&&_sortItem(st,t.pid); if(it&&!_sortSilent(it)) try{ mastSpeak(_sortPlain(it.prompt)); }catch(e){} }   // its NAME — never its bin
function _sortSayBin(st,bi){ const b=st&&st.bins[bi]; if(b&&b.label) try{ mastSpeak(_sortPlain(b.label)); }catch(e){} }
function sortStart(deck){
  try{ if(typeof bbAudioUnlock==="function") bbAudioUnlock(); }catch(e){}   // the deck tap unlocks the ding / bonk (iPad)
  const items=_sortItems(), decks=sortDecks(items), r=sortRound(deck,decks);
  if(!r){ sortState=null; _mastRe(); return; }
  sortState={kid:masteryKid,deck:deck,kind:r.kind,game:"sort",t0:Date.now(),bins:r.bins,turns:r.turns,sel:null,shake:null,lit:null,phase:"play",first:0,of:r.turns.length,isPB:false,prevBest:null,returned:{}};
  _mastRe();
  if(r.kind==="pic") try{ mastSpeak(r.bins.map(b=>_sortPlain(b.label)).join(", ")); }catch(e){}   // the bins' names, for a pre-reader
}
function sortChangeDeck(){ sortState=null; _mastRe(); }   // drop the round as it stands: nothing written
// Tap a card: pick it up (tap again to put it down). Hear its name.
function sortPick(ti){
  const st=sortState; if(!st||st.phase!=="play") return;
  const t=st.turns[ti]; if(!t||t.done) return;
  st.shake=null; st.lit=null;
  st.sel=st.sel===ti?null:ti;
  _mastRe();
  if(st.sel!==null) _sortSayCard(st,t);
}
// Tap a bin: the picked card goes in; with nothing picked, hear the bin's name.
function sortBinTap(bi){
  const st=sortState; if(!st||st.phase!=="play") return;
  if(st.sel===null){ _sortSayBin(st,bi); return; }
  sortDrop(st.sel,bi);
}
function sortDrop(ti,bi){
  const st=sortState; if(!st||st.phase!=="play") return;
  const t=st.turns[ti], r=sortJudge(st,ti,bi);
  st.sel=null; st.shake=null; st.lit=null;
  if(r==="wrong"){ try{ matchBonk(); }catch(e){} st.shake=ti; _mastRe(); _sortSayCard(st,t); return; }
  if(r!=="right"){ _mastRe(); return; }
  try{ matchDing(); }catch(e){}
  st.lit=bi;
  if(st.phase==="done") sortFinish(st);
  _mastRe();
}
// Drag a card with a finger or the mouse: a move under 8px is a tap (sortPick); a drop lands on the bin under the pointer.
function sortDown(ev,ti){
  const st=sortState; if(!st||st.phase!=="play"||!ev||ev.button>0) return;
  const el=ev.currentTarget; if(!el) return;
  if(typeof haDragStart==="function") haDragStart(ev);   // NOSELDRAG
  const x0=ev.clientX, y0=ev.clientY, pid=ev.pointerId; let moved=false;
  try{ el.setPointerCapture(pid); }catch(e){}
  const move=e=>{ const dx=e.clientX-x0, dy=e.clientY-y0; if(!moved&&Math.hypot(dx,dy)<8) return; moved=true; el.classList.add("sort-drag"); el.style.transform="translate("+dx+"px,"+dy+"px)"; _sortHover(e.clientX,e.clientY); };
  const up=e=>{
    el.removeEventListener("pointermove",move); el.removeEventListener("pointerup",up); el.removeEventListener("pointercancel",up);
    try{ el.releasePointerCapture(pid); }catch(x){}
    if(typeof haDragOff==="function") haDragOff();
    if(!moved){ sortPick(ti); return; }
    el.style.transform=""; el.classList.remove("sort-drag"); _sortHover(-1,-1);
    const bi=e.type==="pointercancel"?-1:_sortBinAt(e.clientX,e.clientY);
    if(bi<0){ _mastRe(); return; }
    sortDrop(ti,bi);
  };
  el.addEventListener("pointermove",move); el.addEventListener("pointerup",up); el.addEventListener("pointercancel",up);
}
function _sortBinAt(x,y){ try{ const n=document.elementFromPoint(x,y), b=n&&n.closest?n.closest("[data-sortbin]"):null; return b?parseInt(b.getAttribute("data-sortbin"),10):-1; }catch(e){ return -1; } }
function _sortHover(x,y){ const bi=_sortBinAt(x,y); try{ document.querySelectorAll("[data-sortbin]").forEach(b=>b.classList.toggle("sort-over",parseInt(b.getAttribute("data-sortbin"),10)===bi)); }catch(e){} }
function sortBestKey(deck){ return deck+" \u{00B7} sort"; }
// GAMEKID → 🎲 GAMEKIT resume: a card picked up when the kid switched is put down (no render; the caller renders)
function sortResume(){ const st=sortState; if(st){ st.sel=null; st.shake=null; st.lit=null; } }
function sortFinish(st){
  st.phase="done";
  const kid=st.kid||masteryKid;   // GAMEKID
  try{ if(typeof gameLogRound==="function"){   // 🎮 GAMELOG: every card's result, game:"sort"
    let pre=null; if(st.kind==="pic"&&typeof gameLogEntry==="function"){ pre=gameLogEntry(st); if(pre) pre.cat=true; }   // 🧺 SORTPIC: a category sort, tagged
    gameLogRound(st,pre); } }catch(e){}
  const s=masteryData[kid+"_settings"]||(masteryData[kid+"_settings"]={});
  if(!s.match_best) s.match_best={};
  const key=sortBestKey(st.deck), prev=s.match_best[key];
  st.prevBest=prev==null?null:prev;
  st.isPB=st.first>0&&(prev==null||st.first>prev);
  if(st.isPB){
    s.match_best[key]=st.first;
    if(db&&!_dryRun()) db.ref("mastery/"+kid+"_settings/match_best").update({[(typeof haKey==="function"?haKey(key):key)]:st.first});   // this key only
    try{HA_LS.setItem("ha_mastery",JSON.stringify(masteryData));}catch(e){}
  }
  try{ if(st.of>0&&st.first===st.of&&typeof _showCelebration==="function"&&document.getElementById("celeb-overlay")) _showCelebration(kid,"\u{1F9FA} You sorted them all!",{noSong:true}); }catch(e){}
}
const SORT_CSS='<style>.sort-card{position:relative;display:flex;align-items:center;justify-content:center;min-height:72px;padding:8px 10px;border-radius:16px;border:3px solid #e2ddd6;background:#fff;cursor:grab;overflow:hidden;user-select:none;-webkit-user-select:none;touch-action:none;-webkit-tap-highlight-color:transparent;transition:transform .15s,border-color .15s;font-family:\'Fraunces\',serif;font-weight:800;color:#292524;text-align:center;line-height:1.15}'+
  '.sort-card .memoji,.sort-card img,.sort-card svg{pointer-events:none}.sort-card.sort-pic{aspect-ratio:1;min-height:0;padding:4px}.sort-card.sort-sel{border-color:#2563eb;background:#eff6ff;box-shadow:0 0 0 4px #bfdbfe;transform:translateY(-4px)}'+
  '.sort-card.sort-drag{pointer-events:none;z-index:9;box-shadow:0 10px 24px rgba(0,0,0,.18);transition:none}.sort-card.sort-shake{animation:sortShake .45s;border-color:#f59e0b}'+
  '@keyframes sortShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-9px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(4px)}}'+
  '.sort-bin{border-radius:18px;border:3px dashed #d6d3d1;background:#fafaf9;padding:8px;min-height:96px;cursor:pointer;transition:background .15s,border-color .15s;-webkit-tap-highlight-color:transparent}.sort-bin.sort-over,.sort-bin.sort-ready:hover{border-color:#2563eb;background:#eff6ff}'+
  '.sort-bin.sort-lit{border-color:#16a34a;border-style:solid;background:#f0fdf4}.sort-bin-label{font-family:\'DM Sans\',sans-serif;font-weight:800;font-size:14px;color:#44403c;text-align:center;margin-bottom:6px;line-height:1.2}'+
  '.sort-bin-chips{display:flex;flex-wrap:wrap;gap:4px;justify-content:center}.sort-chip{display:inline-flex;align-items:center;justify-content:center;max-width:100%;padding:3px 7px;border-radius:9px;background:#fff;border:1.5px solid #e2ddd6;font-size:12px;font-weight:700;color:#292524;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}'+
  '.sort-chip.sort-chip-pic{width:40px;height:40px;padding:0}.sort-chip.sort-chip-pic>span{transform:scale(.5);pointer-events:none}</style>';
// A card's face: its built-in picture, or its front as the drill shows it (markup kept: the <u>target word</u>, .mast-hl marks).
function _sortFace(it,kind){
  if(kind==="pic") return '<span class="sort-vis" style="pointer-events:none">'+(_sortPic(it)||'')+'</span>';
  const p=String((it&&it.prompt)||""), n=_sortPlain(p).length;
  return '<span style="pointer-events:none;font-size:'+(n<=4?'34px':n<=12?'22px':n<=40?'15px':'13px')+';overflow-wrap:anywhere">'+p+'</span>';
}
function buildSortHtml(color){
  const q=s=>String(s).replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,"&quot;"), E=s=>(typeof esc==="function")?esc(s):String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  let h=SORT_CSS+'<div class="ha-nosel" style="padding:4px 14px 24px;max-width:720px;margin:0 auto">';
  const items=_sortItems(), decks=sortDecks(items), names=sortDeckNames(decks);
  if(!names.length){ h+='<div class="mast-none">No decks ready for Sort it yet \u{2014} it needs two or more groups of cards that belong together (pictures from two decks, or cards that share an answer or a rule).</div></div>'; return h; }
  const st=sortState;
  const chipLbl=dk=>dk===SORT_PIC?'\u{1F5BC} '+SORT_PIC:E(dk);
  const chip=(dk)=>{ const sel=st&&st.deck===dk; return '<button onclick="sortStart(\''+q(dk)+'\')" style="padding:10px 16px;border-radius:999px;font-size:14px;font-weight:800;border:2px solid '+(sel?color:'#e2ddd6')+';background:'+(sel?color:'#fff')+';color:'+(sel?'#fff':'#57534e')+';cursor:pointer;font-family:\'DM Sans\',sans-serif">'+chipLbl(dk)+'</button>'; };
  if(!st||st.phase==="done"){ h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 14px">'; names.forEach(dk=>{ h+=chip(dk); }); h+='</div>'; }
  if(!st){ h+='<div style="font-size:15px;font-weight:700;color:#57534e">\u{1F9FA} Pick a deck. Drag each card to the bin where it belongs \u{2014} or tap the card, then tap the bin.</div></div>'; return h; }
  const s=masteryData[st.kid+"_settings"]||{}, best=(s.match_best||{})[sortBestKey(st.deck)];
  const binLabel=b=>{ const em=st.kind==="pic"?(SORT_BIN_EMOJI[String(b.label).toLowerCase()]||'\u{1F9FA}')+' ':''; return em+E(b.label); };
  const chips=b=>{ let c='<div class="sort-bin-chips">'; b.ids.forEach(pid=>{ const it=_sortItem(st,pid); if(!it) return;
      if(st.kind==="pic") c+='<span class="sort-chip sort-chip-pic"><span>'+(_sortPic(it)||'')+'</span></span>';
      else { const p=_sortPlain(it.prompt); c+='<span class="sort-chip" title="'+E(p)+'">'+E(p.length>34?p.slice(0,32)+'\u{2026}':p)+'</span>'; } });
    return c+'</div>'; };
  if(st.phase==="play"){
    const tray=[]; st.turns.forEach((t,ti)=>{ if(!t.done) tray.push(ti); });
    h+='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0 4px"><div style="display:flex;gap:6px;flex-wrap:wrap">';
    st.turns.forEach((x,ix)=>{ h+='<span style="width:14px;height:14px;border-radius:50%;display:inline-block;'+(x.done?'background:'+(x.first?'#16a34a':'#f59e0b'):st.sel===ix?'background:#fff;border:3px solid '+color:'background:#e7e5e4')+'"></span>'; });
    h+='</div><span style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--muted)">'+chipLbl(st.deck)+(best!=null?' \u{00B7} \u{1F3C6} '+best:'')+
      '<button onclick="sortChangeDeck()" style="padding:6px 12px;border-radius:999px;border:1.5px solid #e2ddd6;background:#fff;color:#57534e;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap;font-family:\'DM Sans\',sans-serif">\u{1F5C2} Change deck</button></span></div>';
    h+='<div style="text-align:center;font-size:16px;font-weight:800;color:#57534e;margin:6px 0 10px">'+(st.shake!==null?'Not that bin \u{2014} try another!':st.sel!==null?'Now tap the bin it belongs in':st.turns.some(t=>t.back&&!t.done)?'These come back for one more sort':'Where does each one belong?')+'</div>';
    // the tray
    h+='<div style="display:grid;grid-template-columns:repeat('+(st.kind==="pic"?'3':'2')+',1fr);gap:10px;margin-bottom:16px">';
    tray.forEach(ti=>{ const t=st.turns[ti], it=_sortItem(st,t.pid); if(!it) return;
      h+='<div class="sort-card'+(st.kind==="pic"?' sort-pic':'')+(st.sel===ti?' sort-sel':'')+(st.shake===ti?' sort-shake':'')+'" role="button" aria-label="Card '+(ti+1)+'" onpointerdown="sortDown(event,'+ti+')">'+_sortFace(it,st.kind)+'</div>'; });
    h+='</div>';
    // the bins
    h+='<div style="display:grid;grid-template-columns:repeat('+(st.bins.length>=4?'2':st.bins.length)+',1fr);gap:10px">';
    st.bins.forEach((b,bi)=>{ h+='<div class="sort-bin'+(st.sel!==null?' sort-ready':'')+(st.lit===bi?' sort-lit':'')+'" data-sortbin="'+bi+'" role="button" aria-label="Bin: '+E(_sortPlain(b.label))+'" onclick="sortBinTap('+bi+')"><div class="sort-bin-label">'+binLabel(b)+'</div>'+chips(b)+'</div>'; });
    h+='</div></div>';
    return h;
  }
  // Finish: the bins as sorted (the recap), first-try count, Play again.
  h+='<div style="margin-top:6px;text-align:center;padding:16px;border-radius:18px;background:'+(st.isPB?'#f0fdf4':'#f8f7f4')+';border:2px solid '+(st.isPB?'#16a34a':'#e2ddd6')+'">';
  h+='<div style="font-family:\'Fraunces\',serif;font-size:22px;font-weight:800">\u{1F389} All sorted!</div>';
  h+='<div style="display:grid;grid-template-columns:repeat('+(st.bins.length>=4?'2':st.bins.length)+',1fr);gap:8px;margin:12px 0;text-align:left">';
  st.bins.forEach(b=>{ h+='<div class="sort-bin sort-lit" style="cursor:default"><div class="sort-bin-label">'+binLabel(b)+'</div>'+chips(b)+'</div>'; });
  h+='</div>';
  h+='<div style="font-size:17px;font-weight:800;color:#57534e">\u{1F9FA} '+st.first+' of '+st.of+' on the first try'+(st.isPB?' \u{2014} \u{1F3C6} new best!':(st.prevBest!=null?' \u{00B7} best '+st.prevBest:''))+'</div>';
  h+='<div style="display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap"><button onclick="sortStart(\''+q(st.deck)+'\')" style="padding:12px 24px;border-radius:999px;border:none;background:'+color+';color:#fff;font-size:15px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif">\u{1F501} Play again</button></div>';
  return h+'</div></div>';
}
// SORTIT_END
// MOLE_START — 🐹 "Whack-a-mole" (her "yes to all and go to all" 2026-11-03 to games-later_design_2026-11-03.md #2; PLAN_practice_games_2026-10-23.md
// Tier 3 "Whack-a-mole / Find the match": "prompt at top; answers pop; tap only the right one, ignore wrong ones; Wordwall's most-loved
// template at ages 9–10"; demand REC + inhibition + fluency). The one game here with a clock, so it keeps plan rule 5 — "time only what is
// already ~90% accurate": ONLY cards at the kid's gate tier or above play (gate_tier, the Sprint rule, default weekly); a learning card is
// never timed. The prompt is Which one?'s: a picture / letter card is SAID (never written), an answer card shows its front big. Four moles
// pop up one after another in four holes — the right answer and three of the deck's own wrong ones (plausible lures, plan rule 2) — and
// each goes back down after MOLE_UP ms. Tap the right one before it hides → the soft ding. Tap a wrong one, or let the right one hide
// untouched → the soft bonk, the prompt is said again, and the right mole comes back up and STAYS (no clock on a correction — plan rule 3)
// until it is tapped. A round is MOLE_WAVES prompts (fewer when the deck is small), misses come back once at the end, then the finish:
// "N on the first tap" against the kid's own best. No lives, no leaderboard, no points, no score against the kid.
// Cards: Which one?'s own pool (whichPool / whichDeckModes read RAW, like Go Fish — a deck turned off for Which one? still plays here),
// then this game's own grid cell gameDeckOn(kid,"mole",deck); a deck plays with MOLE_MIN+ gated cards that each have 2+ lures.
// Writes (only these): <kid>_settings/match_best key "<deck> · mole" (first-tap rights, only when beaten) and the round's gameLog entry
// (GAMELOG, game:"mole"). NEVER touches the ladder — no scores, no next_due, no study log. db && !_dryRun() only. Per-kid park /
// restore / resume through its GAMES_LIST entry (🎲 GAMEKIT): every timer checks its own round and sequence, so a parked round's
// moles never move; on resume the open wave's moles all come up and stay. A round dropped (Change deck, a kid switch) writes nothing.
let moleState=null;   // {kid,deck,mix,game:"mole",t0,turns:[{pid,mode,tiles:[pid],up:{slot:1},wrong:{pid|late:1},done,first,back,hold}],i,seq,lock,grow,phase,first,of,isPB,prevBest,gameLogged}
let _moleRandom=Math.random;   // tests seed it
const MOLE_WAVES=10, MOLE_MIN=4, MOLE_HOLES=4, MOLE_GAP=450, MOLE_UP=2600, MOLE_BEAT=800;
function _moleItems(kid){ return (typeof _gamesItems==="function")?_gamesItems(kid||masteryKid):[]; }
function _moleShuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(_moleRandom()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function _moleRaw(fn){ const had=(typeof _gdRaw!=="undefined")?_gdRaw:null; try{ if(had!==null) _gdRaw=true; return fn(); } finally{ if(had!==null) _gdRaw=had; } }
function moleDeckOn(kid,deck){ return (typeof _gdRaw!=="undefined"&&_gdRaw)||typeof gameDeckOn!=="function"||gameDeckOn(kid,"mole",deck); }
function moleGate(kid){ try{ const s=(typeof masteryData!=="undefined"&&masteryData&&masteryData[(kid||masteryKid)+"_settings"])||{}; return s.gate_tier||"weekly"; }catch(e){ return "weekly"; } }
// The Sprint rule: a card is timed only at the gate tier or above, and only once it is on the ladder
function moleReady(it,kid){ if(!it||it.status!=="active") return false; return (typeof mastTierAtLeast==="function")?mastTierAtLeast(it.tier,moleGate(kid)):true; }
function _moleWhichPool(items,kid){ return _moleRaw(()=>whichPool(items,WHICH_MIX,kid)); }
function _moleModes(items,kid){ return _moleRaw(()=>whichDeckModes(items,kid)); }
// The name a mole shows / the prompt asks for, by the deck's mode (answer mode: the BACK is the mole)
function _moleName(it,mode){ return mode==="answer"?_whichNorm(_whichBack(it)):String(it&&it.prompt||"").trim().toLowerCase(); }
// PURE: this wave's moles — the right card + up to MOLE_HOLES-1 different cards of ITS deck with different names (never fewer than 2 lures), shuffled into holes; null when the deck can't
function moleTiles(it,pool,mode){
  const seen={}; seen[_moleName(it,mode)]=1;
  const lures=_moleShuffle((pool||[]).filter(x=>x&&x.id!==it.id&&x.subject===it.subject)).filter(x=>{ const n=_moleName(x,mode); if(!n||seen[n]) return false; seen[n]=1; return true; }).slice(0,MOLE_HOLES-1);
  if(lures.length<2) return null;
  return _moleShuffle([it.id].concat(lures.map(x=>x.id)));
}
// The cards a deck can time: Which one?'s pool, at the gate or above, with lures to pop beside them
function molePool(items,deck,kid){
  kid=kid||masteryKid;
  const all=_moleWhichPool(items,kid), modes=_moleModes(items,kid);
  return all.filter(i=>(deck===WHICH_MIX||(i.subject||"Other")===deck)&&moleReady(i,kid)&&!!moleTiles(i,all,modes[i.subject||"Other"]));
}
function moleDecks(items,kid){
  kid=kid||masteryKid;
  const n={}; molePool(items,WHICH_MIX,kid).forEach(i=>{ const d=i.subject||"Other"; n[d]=(n[d]||0)+1; });
  return Object.keys(n).filter(d=>n[d]>=MOLE_MIN&&moleDeckOn(kid,d)).sort();
}
function _moleSay(st,t){
  t=t||(st&&st.turns[st.i]); if(!st||!t) return;
  const it=_moleItems(st.kid).find(x=>x&&x.id===t.pid);
  if(it&&it.prompt&&!(t.mode==="answer"&&whichSilent(it))&&(typeof mastView==="undefined"||mastView==="mole")) try{ mastSpeak(_matchPlain(it.prompt)); }catch(e){} 
}
function moleSayAgain(){ const st=moleState; if(st&&st.phase==="play") _moleSay(st); }
function moleStart(deck){
  try{ if(typeof bbAudioUnlock==="function") bbAudioUnlock(); }catch(e){}   // the deck tap unlocks the ding / bonk (iPad)
  const items=_moleItems(), mix=deck===WHICH_MIX, modes=_moleModes(items), ok=moleDecks(items), all=_moleWhichPool(items,masteryKid);
  const pool=molePool(items,deck).filter(i=>ok.indexOf(i.subject||"Other")>=0);
  if(pool.length<MOLE_MIN||(!mix&&!moleDeckOn(masteryKid,deck))){ moleState=null; _mastRe(); return; }   // 🎮 GAMEGRID: a deck Mom turned off for this game
  const picks=_moleShuffle(pool.slice()).slice(0,MOLE_WAVES), turns=[];
  picks.forEach(it=>{ const mode=modes[it.subject||"Other"], tiles=moleTiles(it,all,mode); if(tiles) turns.push({pid:it.id,mode:mode,tiles:tiles,up:{},wrong:{},done:false,first:false,back:false,hold:false}); });
  moleState={kid:masteryKid,deck:deck,mix:mix,game:"mole",t0:Date.now(),turns:turns,i:0,seq:0,lock:false,grow:null,phase:turns.length?"play":"done",first:0,of:turns.length,isPB:false,prevBest:null,returned:{}};
  _moleWave(moleState);
  _mastRe();
}
function moleChangeDeck(){ moleState=null; _mastRe(); }   // drop the round as it stands: nothing written
// A wave: the prompt, then the moles pop one after another; each hides MOLE_UP later unless it is the right one and the wave is on hold
function _moleWave(st){
  const t=st.turns[st.i]; if(!t) return;
  const seq=++st.seq; st.lock=false; st.grow=null;
  _moleSay(st,t);
  t.tiles.forEach((pid,slot)=>{
    setTimeout(()=>{ if(moleState!==st||st.seq!==seq||t.done) return; t.up[slot]=1; _mastRe();
      setTimeout(()=>{ if(moleState!==st||st.seq!==seq||t.done||t.hold) return; _moleHide(st,t,slot); },MOLE_UP); },slot*MOLE_GAP);
  });
}
function _moleHide(st,t,slot){
  delete t.up[slot];
  if(t.tiles[slot]===t.pid&&!t.wrong.late){   // the right one went down untouched: a miss — bring it back and hold it
    t.wrong.late=1; _moleHold(st,t); return;
  }
  _mastRe();
}
// After any miss: the bonk, the prompt again, the right mole up and held (no clock on a correction), the wrong ones down
function _moleHold(st,t){
  try{ matchBonk(); }catch(e){}
  t.hold=true; t.up={}; t.up[t.tiles.indexOf(t.pid)]=1;
  _mastRe(); _moleSay(st,t);
}
function moleTap(slot){
  const st=moleState; if(!st||st.phase!=="play"||st.lock) return;
  const t=st.turns[st.i]; if(!t||t.done||!t.up[slot]) return;
  if(typeof gameCardAnswered==="function") gameCardAnswered(t);   // ⏱ CARDSECS: the first answer on this card stops its clock
  const pid=t.tiles[slot];
  if(pid!==t.pid){ t.wrong[pid]=1; _moleHold(st,t); return; }
  t.done=true; t.first=!Object.keys(t.wrong).length;
  if(!t.back&&t.first) st.first++;
  // a card missed on its first wave comes back once, at the end of the round
  if(!t.first&&!t.back&&!st.returned[t.pid]){
    st.returned[t.pid]=1;
    const it=_moleItems(st.kid).find(x=>x&&x.id===t.pid), tiles=it?moleTiles(it,_moleWhichPool(_moleItems(st.kid),st.kid),t.mode):null;
    if(tiles) st.turns.push({pid:t.pid,mode:t.mode,tiles:tiles,up:{},wrong:{},done:false,first:false,back:true,hold:false});
  }
  try{ matchDing(); }catch(e){}
  st.grow=slot; st.lock=true; const seq=++st.seq;
  _mastRe();
  setTimeout(()=>{ if(moleState===st&&st.lock&&st.seq===seq) moleNext(st); },MOLE_BEAT);
}
function moleNext(st){
  st=st||moleState; if(!st||st!==moleState) return;
  st.lock=false; st.grow=null; st.i++;
  if(st.i>=st.turns.length){ moleFinish(st); _mastRe(); return; }
  _moleWave(st); _mastRe();
}
function moleBestKey(deck){ return deck+" \u{00B7} mole"; }
function moleFinish(st){
  st.phase="done"; st.lock=false;
  const kid=st.kid||masteryKid;   // GAMEKID
  try{ if(typeof gameLogRound==="function") gameLogRound(st); }catch(e){}   // 🎮 GAMELOG: every card's first-tap result, game:"mole"
  const s=masteryData[kid+"_settings"]||(masteryData[kid+"_settings"]={});
  if(!s.match_best) s.match_best={};
  const key=moleBestKey(st.deck), prev=s.match_best[key];
  st.prevBest=prev==null?null:prev;
  st.isPB=st.first>0&&(prev==null||st.first>prev);
  if(st.isPB){
    s.match_best[key]=st.first;
    if(db&&!_dryRun()) db.ref("mastery/"+kid+"_settings/match_best").update({[(typeof haKey==="function"?haKey(key):key)]:st.first});   // this key only
    try{HA_LS.setItem("ha_mastery",JSON.stringify(masteryData));}catch(e){}
  }
  try{ if(st.of>0&&st.first===st.of&&typeof _showCelebration==="function"&&document.getElementById("celeb-overlay")) _showCelebration(kid,"\u{1F439} You got them all!",{noSong:true}); }catch(e){}
}
// GAMEKID → 🎲 GAMEKIT resume: the open wave's moles all come up and stay (its timers died with the switch); a beat that was mid-way settles
function moleResume(){
  const st=moleState; if(!st||st.phase!=="play") return;
  if(st.lock){ st.lock=false; st.grow=null; st.i++; if(st.i>=st.turns.length){ moleFinish(st); return; } }
  const t=st.turns[st.i]; if(!t||t.done) return;
  st.seq++; t.hold=true; t.up={}; t.tiles.forEach((p,slot)=>{ if(!t.wrong[p]) t.up[slot]=1; });
  _moleSay(st,t);
}
const MOLE_CSS='<style>.mole-hole{position:relative;aspect-ratio:1;border-radius:50%;background:radial-gradient(ellipse at 50% 70%,#8b6b47 0,#a98b66 55%,#d9cbb3 100%);overflow:hidden;-webkit-tap-highlight-color:transparent}'+
  '.mole{position:absolute;left:8%;right:8%;top:8%;bottom:8%;border-radius:22px;border:3px solid #e2ddd6;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer;transform:translateY(115%);transition:transform .22s ease-out}'+
  '.mole.mole-up{transform:none}.mole.mole-held{border-color:#16a34a;box-shadow:0 0 0 5px #bbf7d0}.mole.mole-grow{transform:scale(1.08);border-color:#16a34a;background:#f0fdf4}'+
  '.mole .mole-vis{transform:scale(1.1);pointer-events:none}@media(min-width:560px){.mole .mole-vis{transform:scale(1.6)}}'+
  '.mole .mole-ans{padding:6px;text-align:center;font-weight:800;color:#292524;font-family:\'Fraunces\',serif;line-height:1.1;overflow-wrap:anywhere;pointer-events:none}</style>';
function buildMoleHtml(color){
  const q=s=>String(s).replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,"&quot;");
  let h=MOLE_CSS+'<div style="padding:4px 14px 24px;max-width:720px;margin:0 auto">';
  const items=_moleItems(), decks=moleDecks(items);
  if(!decks.length){ h+='<div class="mast-none">No decks ready for Whack-a-mole yet \u{2014} it plays cards that have reached the gate level (the Sprint rule), '+MOLE_MIN+' or more in a deck.</div></div>'; return h; }
  const st=moleState;
  const chip=(dk,lbl)=>{ const sel=st&&st.deck===dk; return '<button onclick="moleStart(\''+q(dk)+'\')" style="padding:10px 16px;border-radius:999px;font-size:14px;font-weight:800;border:2px solid '+(sel?color:'#e2ddd6')+';background:'+(sel?color:'#fff')+';color:'+(sel?'#fff':'#57534e')+';cursor:pointer;font-family:\'DM Sans\',sans-serif">'+lbl+'</button>'; };
  if(!st||st.phase==="done"){
    h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 14px">';
    decks.forEach(dk=>{ h+=chip(dk,esc(dk)); });
    if(decks.length>1) h+=chip(WHICH_MIX,"\u{1F3B2} "+WHICH_MIX);
    h+='</div>';
  }
  if(!st){ h+='<div style="font-size:15px;font-weight:700;color:#57534e">\u{1F439} Pick a deck. The answers pop up \u{2014} tap the right one before it hides!</div></div>'; return h; }
  const s=masteryData[st.kid+"_settings"]||{}, best=(s.match_best||{})[moleBestKey(st.deck)];
  if(st.phase==="play"){
    const t=st.turns[st.i], tIt=t?items.find(x=>x&&x.id===t.pid):null, ans=!!(t&&t.mode==="answer"), mute=ans&&whichSilent(tIt), missed=!!(t&&Object.keys(t.wrong).length);
    if(typeof gameCardShown==="function") gameCardShown(t);   // ⏱ CARDSECS: the card is on screen — its clock starts at the first paint
    h+='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0 4px"><div style="display:flex;gap:6px;flex-wrap:wrap">';
    st.turns.forEach((x,ix)=>{ const cur=ix===st.i; h+='<span style="width:14px;height:14px;border-radius:50%;display:inline-block;'+(x.done?'background:'+(x.first?'#16a34a':'#f59e0b'):cur?'background:#fff;border:3px solid '+color:'background:#e7e5e4')+'"></span>'; });
    h+='</div><span style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--muted)">'+esc(st.deck)+(best!=null?' \u{00B7} \u{1F3C6} '+best:'')+
      '<button onclick="moleChangeDeck()" style="padding:6px 12px;border-radius:999px;border:1.5px solid #e2ddd6;background:#fff;color:#57534e;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap;font-family:\'DM Sans\',sans-serif">\u{1F5C2} Change deck</button></span></div>';
    if(ans){
      const fr=_matchPlain(tIt&&tIt.prompt);
      h+='<div style="display:flex;align-items:center;justify-content:center;gap:14px;margin:12px 0 8px;flex-wrap:wrap"><div style="font-family:\'Fraunces\',serif;font-size:'+(fr.length<=8?'52px':fr.length<=18?'38px':'28px')+';font-weight:800;color:#292524;text-align:center;line-height:1.1">'+esc(fr)+'</div>';
      if(!mute) h+='<button onclick="moleSayAgain()" aria-label="Hear it again" style="width:56px;height:56px;flex:none;border-radius:50%;border:3px solid '+color+';background:#fff;color:'+color+';font-size:26px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center">\u{1F50A}</button>';
      h+='</div>';
    } else {
      h+='<div style="display:flex;justify-content:center;margin:10px 0 6px"><button onclick="moleSayAgain()" aria-label="Hear it again" style="width:84px;height:84px;border-radius:50%;border:4px solid '+color+';background:#fff;color:'+color+';font-size:40px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center">\u{1F50A}</button></div>';
    }
    h+='<div style="text-align:center;font-size:17px;font-weight:800;color:#57534e;margin-bottom:12px">'+(missed?(t.hold?'Here it is \u{2014} tap it!':'Almost \u{2014} try again!'):(ans?'Tap the answer before it hides!':'Tap the one you hear before it hides!'))+'</div>';
    h+='<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px;max-width:460px;margin:0 auto">';
    (t?t.tiles:[]).forEach((pid,slot)=>{
      const it=items.find(x=>x&&x.id===pid), up=!!t.up[slot], held=up&&t.hold&&pid===t.pid, grow=st.grow===slot;
      let inner;
      if(ans){ const bk=_whichBack(it); inner='<span class="mole-ans" style="font-size:'+(bk.length<=3?'clamp(30px,9vw,56px)':bk.length<=7?'clamp(22px,6vw,38px)':bk.length<=13?'clamp(16px,4.2vw,26px)':'clamp(13px,3.4vw,20px)')+'">'+esc(bk)+'</span>'; }
      else inner='<span class="mole-vis">'+(_smTileVis(it)||'')+'</span>';
      h+='<div class="mole-hole"><div class="mole'+(up?' mole-up':'')+(held?' mole-held':'')+(grow?' mole-grow':'')+'" role="button" aria-label="Mole '+(slot+1)+'"'+(up&&!st.lock?' onclick="moleTap('+slot+')"':'')+'>'+inner+'</div></div>';
    });
    h+='</div></div>';
    return h;
  }
  // Finish: first-tap count against the kid's own best, Play again / Mix the decks
  h+='<div style="margin-top:6px;text-align:center;padding:16px;border-radius:18px;background:'+(st.isPB?'#f0fdf4':'#f8f7f4')+';border:2px solid '+(st.isPB?'#16a34a':'#e2ddd6')+'">';
  h+='<div style="font-family:\'Fraunces\',serif;font-size:22px;font-weight:800">\u{1F389} You got them all!</div>';
  h+='<div style="font-size:17px;font-weight:800;color:#57534e;margin-top:10px">\u{1F439} '+st.first+' of '+st.of+' on the first tap'+(st.isPB?' \u{2014} \u{1F3C6} new best!':(st.prevBest!=null?' \u{00B7} best '+st.prevBest:''))+'</div>';
  h+='<div style="display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap">';
  h+='<button onclick="moleStart(\''+q(st.deck)+'\')" style="padding:12px 24px;border-radius:999px;border:none;background:'+color+';color:#fff;font-size:15px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif">\u{1F501} Play again</button>';
  if(decks.length>1&&!st.mix) h+='<button onclick="moleStart(\''+q(WHICH_MIX)+'\')" style="padding:12px 24px;border-radius:999px;border:2px solid '+color+';background:#fff;color:'+color+';font-size:15px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif">\u{1F3B2} '+WHICH_MIX+'</button>';
  return h+'</div></div></div>';
}
// MOLE_END
// JEOPARDY_START — 📺 "Jeopardy" (her "continue next items" 2026-11-03; games-later_design_2026-11-03.md #3; PLAN_practice_games_2026-10-23.md
// Tier 3 "Jeopardy board: 5 categories × 5 values from his decks; he picks; harder = higher tier card; says/types the answer" — CR with
// self-chosen difficulty). A board: one column per deck (up to JP_COLS of the kid's playable decks, the kid picks which on the start
// screen), JP_ROWS rows of ★ → ★★★★★. A row's hardness comes from the ladder — ★ is the deck's best-known card (highest rung),
// ★★★★★ its least-known (lowest rung) — the plan wrote "higher tier = harder", but on this ladder a high tier means the kid knows it
// cold, so the stars run the other way. Choosing the cell is the kid's; the retrieval IS the move (plan rule 1): a cell opens its
// card and the kid PRODUCES it — Go Fish's three acts: a picture / letter card is said out loud (🗣 honor tap, no mic on a tablet, the
// app says the name back), a number back is typed on the number pad, a word back is picked from three of the deck's own backs.
// Right → the ding, the cell turns green. Wrong → the bonk, one more try; wrong twice → "We'll come back to that one" (the answer is
// never shown — the app never supplies what the kid must produce), the cell turns amber. When every cell is done the missed cards
// come back once, then the finish: "N of M on the first try" against the kid's own best. No values, no points, no wager, no
// lives, no clock, no opponent — a cell is worth exactly one card. (💵 JPMONEY, her words 2026-11-08: Mom's game rule "Play money?" → Money
// prices the same board like the TV show — play money inside the one game; guarded hooks below, each marked 💵 JPMONEY.)
// Cards: Which one?'s own pool (whichPool / whichDeckModes read RAW, like Go Fish — a deck turned off for Which one? still plays here),
// then this game's grid cell gameDeckOn(kid,"jeop",deck); a deck needs JP_MIN+ cards. Writes (only these): <kid>_settings/match_best key
// "<board> · jeop" (first-try rights, only when beaten) and the round's gameLog entry (GAMELOG, game:"jeop"). NEVER touches the ladder —
// no scores, no next_due, no study log. db && !_dryRun() only. Per-kid park / restore / resume through its GAMES_LIST entry (🎲 GAMEKIT).
// A round dropped (Stop, a kid switch) writes nothing.
let jeopState=null;   // {kid,deck,decks:[name],mix,game:"jeop",t0,rows,cells:[{col,row,pid,act,done,first,fail}],open:{ci,t}|null,turns:[{pid,act,done,first,wrong:{},tries,fail,back,opts?,typed?}],phase:"play"|"back"|"done",backs,first,of,isPB,prevBest,lock,seq,msg,gameLogged}
let jeopPickDecks=null;   // the start screen's deck toggles (this device; null = the first JP_COLS decks)
let _jpRandom=Math.random;   // tests seed it
const JP_COLS=5, JP_ROWS=5, JP_MIN=3, JP_TRIES=2, JP_BEAT=900;
const JP_NUM=/^[-+]?\d+([.,]\d+)?$/;
function _jpItems(kid){ return (typeof _gamesItems==="function")?_gamesItems(kid||masteryKid):[]; }
function _jpShuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(_jpRandom()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function _jpRaw(fn){ const had=(typeof _gdRaw!=="undefined")?_gdRaw:null; try{ if(had!==null) _gdRaw=true; return fn(); } finally{ if(had!==null) _gdRaw=had; } }
function jeopDeckOn(kid,deck){ return (typeof _gdRaw!=="undefined"&&_gdRaw)||typeof gameDeckOn!=="function"||gameDeckOn(kid,"jeop",deck); }
function _jpWhichPool(items,kid){ return _jpRaw(()=>whichPool(items,WHICH_MIX,kid)); }
function _jpModes(items,kid){ return _jpRaw(()=>whichDeckModes(items,kid)); }
function _jpIt(st,pid){ return _jpItems(st.kid).find(x=>x&&x.id===pid)||null; }
function jeopName(it){ return _matchPlain(it&&it.prompt); }
// The decks that can be a column: Which one?'s playable decks with JP_MIN+ cards in play, and this game's cell on
function jeopDecks(items,kid){
  kid=kid||masteryKid;
  const n={}; _jpWhichPool(items,kid).forEach(i=>{ const d=i.subject||"Other"; n[d]=(n[d]||0)+1; });
  return Object.keys(n).filter(d=>n[d]>=JP_MIN&&jeopDeckOn(kid,d)).sort();
}
// What the kid DOES with a card (Go Fish's rule): "say" (picture / symbol), "type" (a number back), "pick" (a word back)
function jeopKind(it,mode){ if(mode!=="answer") return "say"; return JP_NUM.test(String(_whichBack(it)).trim())?"type":"pick"; }
// PURE: one column — the deck's cards ordered best-known → least-known (rung high → low, ties shuffled), one card per row, spread over the whole deck
function jeopColumn(cards,rows,order){
  order=order||((typeof MAST_TIER_ORDER!=="undefined"&&MAST_TIER_ORDER)||["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"]);
  const sorted=_jpShuffle(cards.slice()).sort((a,b)=>order.indexOf(b.tier||"daily")-order.indexOf(a.tier||"daily"));
  const n=sorted.length, out=[];
  for(let r=0;r<rows;r++) out.push(sorted[Math.min(n-1,Math.floor((r+0.5)/rows*n))]);
  return out;
}
// The start screen's toggles: which of the kid's decks go on the board (up to JP_COLS on at once)
function jeopDecksOn(decks){ const on=(jeopPickDecks&&jeopPickDecks.length)?decks.filter(d=>jeopPickDecks.indexOf(d)>=0):decks.slice(0,JP_COLS); return on.length?on:decks.slice(0,JP_COLS); }
function jeopToggle(deck){
  const decks=jeopDecks(_jpItems()), on=jeopDecksOn(decks), i=on.indexOf(deck);
  if(i>=0){ if(on.length>1) on.splice(i,1); } else if(on.length<JP_COLS) on.push(deck);
  jeopPickDecks=on.slice(); _mastRe();
}
function jeopBoardName(decks){ return decks.length===1?decks[0]:(decks.length+" decks"); }
function jeopStart(){
  try{ if(typeof bbAudioUnlock==="function") bbAudioUnlock(); }catch(e){}   // the tap unlocks the ding / bonk (iPad)
  const items=_jpItems(), modes=_jpModes(items), pool=_jpWhichPool(items,masteryKid), ok=jeopDecks(items), decks=jeopDecksOn(ok).filter(d=>ok.indexOf(d)>=0);
  if(!decks.length){ jeopState=null; _mastRe(); return; }
  const byDeck={}; decks.forEach(d=>{ byDeck[d]=pool.filter(i=>(i.subject||"Other")===d); });
  const rows=Math.max(1,Math.min(JP_ROWS,Math.min.apply(null,decks.map(d=>byDeck[d].length))));
  const cells=[];
  decks.forEach((d,col)=>{ jeopColumn(byDeck[d],rows).forEach((it,row)=>{ cells.push({col:col,row:row,pid:it.id,act:jeopKind(it,modes[d]),done:false,first:false,fail:false}); }); });
  jeopState={kid:masteryKid,deck:jeopBoardName(decks),decks:decks,mix:decks.length>1,game:"jeop",t0:Date.now(),rows:rows,cells:cells,open:null,turns:[],phase:"play",backs:null,first:0,of:cells.length,isPB:false,prevBest:null,lock:false,seq:0,msg:"Pick a square!",say:""};
  if(typeof jpMoneyStart==="function") jpMoneyStart(jeopState);   // 💵 JPMONEY: Money adds the dollar values + a hidden Daily Double (Off adds nothing)
  if(typeof jpJudgeStart==="function") jpJudgeStart(jeopState);   // ⚖️ JPJUDGE: with money on, how a say-it square is judged (read once per board; Off reads nothing)
  _mastRe();
}
function jeopStop(){ jeopState=null; _mastRe(); }   // drop the round as it stands: nothing written
function _jpSay(st,text){ st.say=text||""; if(!text||(typeof mastView!=="undefined"&&mastView!=="jeop")) return; try{ mastSpeak(text); }catch(e){} }
function jeopSayAgain(){ const st=jeopState; if(st&&st.say) try{ mastSpeak(st.say); }catch(e){} }
// Three backs for a pick: the card's own + two different backs from its deck (Which one?'s rule), shuffled
function _jpLures(st,pid){
  const it=_jpIt(st,pid); if(!it) return [];
  const own=_whichBack(it), seen={}; seen[_whichNorm(own)]=1;
  const more=_jpShuffle(_jpWhichPool(_jpItems(st.kid),st.kid).filter(x=>x.id!==pid&&(x.subject||"Other")===(it.subject||"Other"))).map(x=>_whichBack(x)).filter(b=>b&&!seen[_whichNorm(b)]&&(seen[_whichNorm(b)]=1)).slice(0,2);
  return _jpShuffle([own].concat(more));
}
// Open a card: a cell (ci) or a come-back (ci null, pid given)
function _jpOpen(st,ci,pid,act,back){
  const t={pid:pid,act:act,done:false,first:false,wrong:{},tries:0,fail:false,back:!!back}; st.turns.push(t);
  if(act==="pick") t.opts=_jpLures(st,pid);
  if(act==="type") t.typed="";
  st.open={ci:ci,t:st.turns.length-1};
  const it=_jpIt(st,pid), lead=back?"One more time. ":"";
  st.msg=lead+(act==="say"?"Say it out loud, then tap \u{1F5E3}":act==="type"?"Type the answer.":"Tap the answer.");
  if(act==="say") _jpSay(st,lead+"What is it?"); else _jpSay(st,lead+(it&&!whichSilent(it)?jeopName(it):""));   // a word answer's FRONT is read (Which one? reads it too); a silent language is shown only
  if(st.money&&typeof jpJudgeOpen==="function") jpJudgeOpen(st,t);   // ⚖️ JPJUDGE: a say-it square gets the board's judging (pick / type / Mom) instead of the honor tap
}
function jeopPickCell(ci){
  const st=jeopState; if(!st||st.phase!=="play"||st.lock||st.open||st.bet) return;   // 💵 JPMONEY: not while a bet is being made
  const c=st.cells[ci]; if(!c||c.done) return;
  if(st.money&&typeof jpMoneyPick==="function"&&jpMoneyPick(st,ci)){ _mastRe(); return; }   // 💵 JPMONEY: a Daily Double asks for the bet first
  _jpOpen(st,ci,c.pid,c.act,false); _mastRe();
}
function _jpTurn(st,act){ if(!st||st.lock||st.phase==="done"||!st.open) return null;
   const t=st.turns[st.open.t]; return (t&&t.act===act&&!t.done)?t:null; }
function jeopSaid(){   // 🗣 "I said it" — the honor system: a tablet can't hear; the app says the name back as the confirm
  const st=jeopState, t=_jpTurn(st,"say"); if(!t) return;
  if(typeof gameCardAnswered==="function") gameCardAnswered(t);   // ⏱ CARDSECS: the first answer on this card stops its clock
  if(t.judge&&typeof jpJudgeSaid==="function"){ jpJudgeSaid(st,t); return; }   // ⚖️ JPJUDGE: no self-report with money on — "I said it" opens the choices (pick), else nothing
  t.done=true; t.first=true;
  if(st.money&&typeof jpMoneyAnswer==="function") jpMoneyAnswer(st,t);   // 💵 JPMONEY: the honor tap is a right answer
  _jpSettle(st,t,"",jeopName(_jpIt(st,t.pid))); _mastRe();   // the name is SAID back, never written
}
function jeopKey(ch){   // the number pad
  const st=jeopState, t=_jpTurn(st,"type"); if(!t) return;
  if(ch==="back") t.typed=t.typed.slice(0,-1); else if(t.typed.length<6) t.typed+=ch;
  _mastRe();
}
function _jpAnsOk(act,given,back){ if(act==="pick") return String(given)===String(back); return (typeof mstTypeAnsOk==="function")?mstTypeAnsOk(given,back):Number(String(given).replace(",","."))===Number(String(back).replace(",",".")); }
// PURE: one answer against the card's back → "right" | "again" | "fail". A picked back that was wrong greys out (t.wrong)
function jeopJudge(t,given,back){
  if(typeof gameCardAnswered==="function") gameCardAnswered(t);   // ⏱ CARDSECS: the first answer on this card stops its clock
  if(_jpAnsOk(t.act,given,back)){ t.done=true; t.first=t.tries===0; return "right"; }
  t.tries++; t.wrong[t.act==="pick"?String(given):String(t.tries)]=1; t.typed="";
  if(t.tries>=JP_TRIES){ t.done=true; t.first=false; t.fail=true; return "fail"; }
  return "again";
}
function jeopCheck(){
  const st=jeopState, t=_jpTurn(st,"type"); if(!t||!t.typed) return;
  _jpAfter(st,t,jeopJudge(t,t.typed,_whichBack(_jpIt(st,t.pid))));
}
function jeopPickTap(i){
  const st=jeopState, t=_jpTurn(st,"pick"); if(!t||!t.opts||t.opts[i]==null||t.wrong[t.opts[i]]) return;
  _jpAfter(st,t,jeopJudge(t,t.opts[i],_whichBack(_jpIt(st,t.pid))));
}
function _jpAfter(st,t,r){
  if(st.money&&typeof jpMoneyAnswer==="function") jpMoneyAnswer(st,t);   // 💵 JPMONEY: the FIRST answer moves the bank (the show takes one response)
  if(r==="again"){ try{ matchBonk(); }catch(e){} st.msg=(st.money&&typeof jpMoneyMsg==="function"&&jpMoneyMsg(st,t,r))||"Almost \u2014 try again!"; _mastRe(); return; }   // 💵 JPMONEY: the dollars, louder for a Daily Double
  if(r==="fail") try{ matchBonk(); }catch(e){}
  _jpSettle(st,t,r==="fail"?((st.money&&typeof jpMoneyMsg==="function"&&jpMoneyMsg(st,t,r))||"We\u2019ll come back to that one."):""); _mastRe();
}
// The card is settled: mark its cell, a beat, then the board (or the next come-back). lead = the line on screen; spoken = said first (a picture's name)
function _jpSettle(st,t,lead,spoken){
  const o=st.open, c=(o&&o.ci!=null)?st.cells[o.ci]:null;
  if(c){ c.done=true; c.first=t.first; c.fail=t.fail; if(t.first) st.first++; }
  if(!t.fail) try{ matchDing(); }catch(e){}
  st.msg=lead||(t.first?"That\u2019s it!":"Okay \u2014 next one.");
  if(!lead&&st.money&&typeof jpMoneyMsg==="function") st.msg=jpMoneyMsg(st,t,"settle")||st.msg;   // 💵 JPMONEY: "That's it! +$400"
  const pre=spoken?spoken+". ":(lead?lead+" ":"");
  if(t.first) _jpSay(st,pre+"That\u2019s it!"); else _jpSay(st,lead||"Next one.");
  st.lock=true; const seq=++st.seq;
  setTimeout(()=>{ if(jeopState===st&&st.lock&&st.seq===seq) jeopNext(st); },JP_BEAT);
}
function jeopNext(st){
  st=st||jeopState; if(!st||st!==jeopState) return;
  st.lock=false; st.open=null;
  if(st.phase==="back"){ _jpBackNext(st); _mastRe(); return; }
  if(st.cells.every(c=>c.done)){ _jpEnd(st); _mastRe(); return; }
  st.msg="Pick a square!"; st.say=""; _mastRe();
}
// ── the end: every cell done → the missed cards come back once → finish ──
function _jpEnd(st){
  if(st.money&&typeof jpMoneyRoundEnd==="function"&&jpMoneyRoundEnd(st)) return;   // 💵 JPMONEY: Double Jeopardy, then Final Jeopardy, before the come-backs
  st.phase="back";
  const seen={}, backs=[];
  st.turns.forEach(t=>{ if(t.back||seen[t.pid]) return; if(Object.keys(t.wrong).length||t.fail){ seen[t.pid]=1; backs.push({pid:t.pid,act:t.act}); } });
  st.backs=backs;
  if(!backs.length) return _jpFinish(st);
  st.msg="The board is clear! Let\u2019s look at a few again."; _jpSay(st,"The board is clear! Let's look at a few again.");
  st.lock=true; const seq=++st.seq; setTimeout(()=>{ if(jeopState===st&&st.lock&&st.seq===seq) jeopNext(st); },JP_BEAT*2);
}
function _jpBackNext(st){
  const b=st.backs&&st.backs.shift();
  if(!b) return _jpFinish(st);
  _jpOpen(st,null,b.pid,b.act,true);
}
function jeopBestKey(deck){ return deck+" \u{00B7} jeop"; }
function _jpFinish(st){
  st.phase="done"; st.open=null; st.lock=false;
  const kid=st.kid||masteryKid;   // GAMEKID
  if(st.money&&typeof jpMoneyFinish==="function") return jpMoneyFinish(st,kid);   // 💵 JPMONEY: the final bank is the result, the deck's best bank the record
  try{ if(typeof gameLogRound==="function") gameLogRound(st); }catch(e){}   // 🎮 GAMELOG: every act's result, game:"jeop"
  const s=masteryData[kid+"_settings"]||(masteryData[kid+"_settings"]={});
  if(!s.match_best) s.match_best={};
  const key=jeopBestKey(st.deck), prev=s.match_best[key];
  st.prevBest=prev==null?null:prev;
  st.isPB=st.first>0&&(prev==null||st.first>prev);
  if(st.isPB){
    s.match_best[key]=st.first;
    if(db&&!_dryRun()) db.ref("mastery/"+kid+"_settings/match_best").update({[(typeof haKey==="function"?haKey(key):key)]:st.first});   // this key only
    try{HA_LS.setItem("ha_mastery",JSON.stringify(masteryData));}catch(e){}
  }
  st.msg="The board is clear!"; st.say="";
  try{ if(st.of>0&&st.first===st.of&&typeof _showCelebration==="function"&&document.getElementById("celeb-overlay")) _showCelebration(kid,"\u{1F4FA} You cleared the board!",{noSong:true}); }catch(e){}
}
// GAMEKID → 🎲 GAMEKIT resume: a beat that was mid-way when the kid switched settles here (no render; the caller renders)
function jeopResume(){
  const st=jeopState; if(!st||st.phase==="done") return;
  if(st.lock){ st.lock=false; st.open=null; if(st.phase==="back") _jpBackNext(st); else if(st.cells.every(c=>c.done)) _jpEnd(st); else { st.msg="Pick a square!"; st.say=""; } return; }
  if(st.say&&(typeof mastView==="undefined"||mastView==="jeop")) try{ mastSpeak(st.say); }catch(e){}
}
// ── the screen ──
const JP_CSS='<style>.jp-grid{display:grid;gap:6px}.jp-head{font-size:11px;font-weight:800;color:#57534e;text-align:center;padding:4px 2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:\'DM Sans\',sans-serif}'+
  '.jp-cell{min-height:48px;border-radius:12px;border:2px solid #1e3a8a;background:#1d4ed8;color:#fde68a;font-size:13px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif;letter-spacing:.02em;-webkit-tap-highlight-color:transparent}'+
  '.jp-cell[disabled]{cursor:default}.jp-cell.jp-ok{background:#f0fdf4;border-color:#16a34a;color:#15803d;font-size:20px}.jp-cell.jp-miss{background:#fffbeb;border-color:#f59e0b;color:#b45309;font-size:20px}'+
  '.jp-card{width:150px;height:160px;border-radius:14px;border:3px solid #a78bfa;background:#f5f3ff;display:flex;align-items:center;justify-content:center;overflow:hidden;margin:0 auto}.jp-card .jp-vis{pointer-events:none;transform:scale(1.5)}.jp-card .jp-txt{pointer-events:none;font-family:\'Fraunces\',serif;font-weight:800;font-size:34px;line-height:1.1;color:#292524;text-align:center;padding:6px;overflow-wrap:anywhere}'+
  '.jp-btn{padding:12px 22px;border-radius:999px;border:none;font-size:16px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif;-webkit-tap-highlight-color:transparent}.jp-btn[disabled],.jp-key[disabled],.jp-opt[disabled]{opacity:.45;cursor:default}'+
  '.jp-key{width:64px;height:56px;border-radius:14px;border:2px solid #e2ddd6;background:#fff;font-family:\'Fraunces\',serif;font-size:26px;font-weight:800;color:#292524;cursor:pointer}'+
  '.jp-opt{min-width:96px;padding:14px 18px;border-radius:16px;border:3px solid #e2ddd6;background:#fff;font-family:\'Fraunces\',serif;font-size:24px;font-weight:800;color:#292524;cursor:pointer;overflow-wrap:anywhere}.jp-opt.jp-wrong{opacity:.28;filter:grayscale(1);cursor:default}'+
  '.jp-chip{padding:10px 16px;border-radius:999px;font-size:14px;font-weight:800;border:2px solid #e2ddd6;background:#fff;color:#57534e;cursor:pointer;font-family:\'DM Sans\',sans-serif}</style>';
function _jpStars(r){ let s=""; for(let i=0;i<=r;i++) s+="\u2605"; return s; }
function _jpCardVis(st,pid,act){
  const it=_jpIt(st,pid); if(!it) return '';
  if(act==="say"){ const v=_smTileVis(it); if(v) return '<span class="jp-vis">'+v+'</span>'; }
  return '<span class="jp-txt">'+esc(jeopName(it))+'</span>';   // an answer card shows its FRONT (the kid produces the back)
}
function buildJeopHtml(color){
  const q=s=>String(s).replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,"&quot;");
  let h=JP_CSS+'<div style="padding:4px 14px 24px;max-width:720px;margin:0 auto">';
  const items=_jpItems(), decks=jeopDecks(items);
  if(!decks.length){ h+='<div class="mast-none">No decks ready for Jeopardy yet \u{2014} it needs '+JP_MIN+' or more cards with a picture (or a short answer on the back).</div></div>'; return h; }
  const st=jeopState;
  if(!st||st.phase==="done"){
    const on=jeopDecksOn(decks);
    h+='<div style="font-size:13px;font-weight:700;color:var(--muted);margin:10px 0 6px">Which decks go on the board? (up to '+JP_COLS+')</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">';
    decks.forEach(dk=>{ const sel=on.indexOf(dk)>=0; h+='<button class="jp-chip" onclick="jeopToggle(\''+q(dk)+'\')" aria-pressed="'+sel+'" style="'+(sel?'border-color:'+color+';background:'+color+';color:#fff':'')+'">'+esc(dk)+'</button>'; });
    h+='</div>';
    h+='<div style="display:flex;justify-content:center;margin:6px 0 14px"><button class="jp-btn" onclick="jeopStart()" style="background:'+color+';color:#fff;font-size:18px;padding:16px 32px">\u{1F4FA} '+(st?'Play again':'Build the board')+'</button></div>';
    if(!st){ h+='<div style="font-size:15px;font-weight:700;color:#57534e;text-align:center">'+((typeof jpMoneyIntro==="function"&&jpMoneyIntro(masteryKid))||'Pick any square. \u2605 is a card you know well, \u2605\u2605\u2605\u2605\u2605 one you\u2019re still learning. Answer it to clear it!')+'</div></div>'; return h; }   // 💵 JPMONEY: Money's own line
  }
  const s=masteryData[st.kid+"_settings"]||{}, best=(st.money&&typeof jpMoneyBest==="function")?jpMoneyBest(st):(s.match_best||{})[jeopBestKey(st.deck)];   // 💵 JPMONEY: the best bank
  if(st.phase==="done"){
    if(st.money&&typeof jpMoneyFinishHtml==="function") return h+jpMoneyFinishHtml(st)+'</div>';   // 💵 JPMONEY: New record! / You won $N / Out of money
    h+='<div style="margin-top:6px;text-align:center;padding:16px;border-radius:18px;background:'+(st.isPB?'#f0fdf4':'#f8f7f4')+';border:2px solid '+(st.isPB?'#16a34a':'#e2ddd6')+'">';
    h+='<div style="font-family:\'Fraunces\',serif;font-size:22px;font-weight:800">\u{1F389} You cleared the board!</div>';
    h+='<div style="font-size:17px;font-weight:800;color:#57534e;margin-top:10px">\u{1F4FA} '+st.first+' of '+st.of+' on the first try'+(st.isPB?' \u{2014} \u{1F3C6} new best!':(st.prevBest!=null?' \u{00B7} best '+st.prevBest:''))+'</div>';
    return h+'</div></div>';
  }
  // the board, with the open card above it
  h+='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0 4px;flex-wrap:wrap"><span style="font-size:13px;font-weight:800;color:#57534e">'+st.cells.filter(c=>c.done).length+' of '+st.cells.length+' cleared</span>';
  h+='<span style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--muted)">'+esc(st.deck)+(best!=null?' \u{00B7} \u{1F3C6} '+best:'')+
    '<button onclick="jeopStop()" style="padding:6px 12px;border-radius:999px;border:1.5px solid #e2ddd6;background:#fff;color:#57534e;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap;font-family:\'DM Sans\',sans-serif">\u{21A9} Stop</button></span></div>';
  if(st.money&&typeof jpMoneyBarHtml==="function") h+=jpMoneyBarHtml(st);   // 💵 JPMONEY: the round and the bank, big
  h+='<div style="display:flex;align-items:center;gap:10px;margin:10px 0 12px;padding:12px 14px;border-radius:18px;background:#eff6ff;border:2px solid #bfdbfe"><span style="font-size:28px;line-height:1">\u{1F4FA}</span><span style="flex:1;font-size:17px;font-weight:800;color:#1e3a8a">'+esc(st.msg)+'</span>'+
    (st.say?'<button onclick="jeopSayAgain()" aria-label="Hear it again" style="width:56px;height:56px;flex:none;border-radius:50%;border:3px solid '+color+';background:#fff;color:'+color+';font-size:26px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center">\u{1F50A}</button>':'')+'</div>';
  const o=st.open, t=o?st.turns[o.t]:null, lock=st.lock;
  if(typeof gameCardShown==="function") gameCardShown(t);   // ⏱ CARDSECS: the card is on screen — its clock starts at the first paint
  if(st.bet&&typeof jpMoneyBetHtml==="function") h+=jpMoneyBetHtml(st,color);   // 💵 JPMONEY: the Daily Double / Final Jeopardy bet
  if(t&&!t.done||t&&lock){
    h+='<div style="margin:6px 0 12px"><span class="jp-card">'+_jpCardVis(st,t.pid,t.act)+'</span></div>';
    if(t.act==="say"&&t.judge&&typeof jpJudgeHtml==="function") h+=jpJudgeHtml(st,t,color,lock);   // ⚖️ JPJUDGE: the choices / the typing box / Mom's ✓ ✗
    else if(t.act==="say") h+='<div style="display:flex;justify-content:center"><button class="jp-btn" onclick="jeopSaid()"'+(lock||t.done?' disabled':'')+' style="background:'+color+';color:#fff;font-size:20px;padding:18px 34px">\u{1F5E3} I said it</button></div>';
    else if(t.act==="type"){
      h+='<div style="display:flex;justify-content:center;margin-bottom:10px"><span style="min-width:120px;height:56px;border-radius:14px;border:3px solid '+color+';background:#fff;font-family:\'Fraunces\',serif;font-size:30px;font-weight:800;color:#292524;display:inline-flex;align-items:center;justify-content:center;padding:0 14px">'+esc(t.typed||"")+'</span></div>';
      h+='<div style="display:grid;grid-template-columns:repeat(3,64px);gap:8px;justify-content:center">';
      ["1","2","3","4","5","6","7","8","9","back","0","ok"].forEach(k=>{ if(k==="back") h+='<button class="jp-key" onclick="jeopKey(\'back\')"'+(lock?' disabled':'')+' aria-label="Erase">\u{232B}</button>'; else if(k==="ok") h+='<button class="jp-key" onclick="jeopCheck()"'+(lock||!t.typed?' disabled':'')+' style="background:'+color+';color:#fff;border-color:transparent" aria-label="Check">\u{2714}</button>'; else h+='<button class="jp-key" onclick="jeopKey(\''+k+'\')"'+(lock?' disabled':'')+'>'+k+'</button>'; });
      h+='</div>';
    } else {
      h+='<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">';
      (t.opts||[]).forEach((op,i)=>{ const w=!!t.wrong[op]; h+='<button class="jp-opt'+(w?' jp-wrong':'')+'" onclick="jeopPickTap('+i+')"'+(w||lock||t.done?' disabled':'')+'>'+esc(op)+'</button>'; });
      h+='</div>';
    }
  }
  if(st.phase==="play"&&!(st.money&&st.round===3)){   // 💵 JPMONEY: Final Jeopardy has no board
    const cols=st.decks.length;
    h+='<div class="jp-grid" style="grid-template-columns:repeat('+cols+',1fr);margin-top:14px">';
    st.decks.forEach(d=>{ h+='<div class="jp-head" title="'+esc(d)+'">'+esc(d)+'</div>'; });
    for(let r=0;r<st.rows;r++){ for(let c=0;c<cols;c++){ const ci=st.cells.findIndex(x=>x.col===c&&x.row===r), cell=st.cells[ci];
      if(!cell){ h+='<div></div>'; continue; }
      const openNow=o&&o.ci===ci||st.bet&&st.bet.ci===ci, can=!cell.done&&!o&&!lock&&!st.bet, lab=(st.money&&typeof jpMoneyCell==="function")?jpMoneyCell(st,r):_jpStars(r);   // 💵 JPMONEY: $200 … $1000 for ★ … ★★★★★
      h+='<button class="jp-cell'+(cell.done?(cell.first?' jp-ok':' jp-miss'):'')+'"'+(can?' onclick="jeopPickCell('+ci+')"':' disabled')+' aria-label="'+esc(st.decks[c])+' '+lab+(cell.done?(cell.first?' done':' missed'):'')+'"'+(openNow?' style="box-shadow:0 0 0 4px #fde68a"':'')+'>'+(cell.done?(cell.first?'\u2713':'\u25D0'):lab)+'</button>'; } }
    h+='</div>';
  }
  return h+'</div>';
}
// JEOPARDY_END
// TEACH_START — 🎓 "Teach it" (her word 2026-11-03: "Teach-it (moves nothing) … lets do these now"; games-later_design_2026-11-03.md #5;
// PLAN_practice_games_2026-10-23.md Tier 4 "Teach it": self-explanation g≈.55, co-op across ages). The kid holding the device is the
// TEACHER: a card from their own deck comes up — the front big, its picture when it has one — and they explain it to whoever is
// listening (a sibling, Mom, Dad) in their own words. "Show the answer" turns the back over so the teacher can check themselves
// (nothing is typed or graded by the app). Then the listener's verdict, two big buttons: ✓ "They got it" or ↻ "Teach it again".
// A card taught again comes back once at the end of the round. That is the whole game: a card read, explained and checked out
// loud. Her rule 2026-11-03: it MOVES NOTHING — no tier, no next_due, no drill answer for either kid, no credit to the listener;
// if she ever wants the ✓ to count, that is a Mom-run Family-time drill designed on its own, not this block.
// Cards: every card in play in the teacher's decks (active or introduction, not a production twin) with a front, INCLUDING the
// concept / transfer "discuss / teach" cards the drills never ask (mastIsNeverDrill) — this is the one game made for them.
// Spelling / phonogram decks stay out (_whichLeftOut: the app never shows a spelling a child must produce). A deck needs TEACH_MIN+
// cards, and this game's grid cell gameDeckOn(kid,"teach",deck). A round is TEACH_N cards (fewer when the deck is small), Mix the decks
// when there is more than one. Writes (only these): <kid>_settings/match_best key "<deck> · teach" (got it on the first teach, only
// when beaten) and the round's gameLog entry (GAMELOG, game:"teach"). db && !_dryRun() only. Per-kid park / restore / resume through
// its GAMES_LIST entry (🎲 GAMEKIT). A round dropped (Change deck, a kid switch) writes nothing.
let teachState=null;   // {kid,deck,mix,game:"teach",t0,turns:[{pid,shown,done,first,wrong:{},back}],i,phase:"play"|"done",first,of,isPB,prevBest,returned:{},gameLogged}
let _teachRandom=Math.random;   // tests seed it
const TEACH_N=6, TEACH_MIN=3;
function _teachItems(kid){ return (typeof _gamesItems==="function")?_gamesItems(kid||masteryKid):[]; }
function _teachShuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(_teachRandom()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function teachDeckOn(kid,deck){ return (typeof _gdRaw!=="undefined"&&_gdRaw)||typeof gameDeckOn!=="function"||gameDeckOn(kid,"teach",deck); }
function teachFront(it){ return _matchPlain(it&&it.prompt); }
function teachBack(it,kid){ try{ return _matchPlain((typeof owRuleBack==="function")?owRuleBack(kid||masteryKid,it):(it&&it.answer)); }catch(e){ return _matchPlain(it&&it.answer); } }   // OURWORDS: the rule as the kid's own words, when set
// The cards a teacher can teach: in play, with a front, not a production twin; spelling / phonograms out; hidden-for-class cards out
function teachPool(items,deck,kid){
  kid=kid||masteryKid;
  return (items||[]).filter(i=>{
    if(!i||(i.status!=="active"&&i.status!=="introduction")||i.dir==="prod") return false;
    if(!teachFront(i)||_whichLeftOut(i,kid)) return false;
    if(typeof cpceHidItem==="function"&&cpceHidItem(kid,i)) return false;   // 📚 CPCARDSEDIT
    if(typeof cpSecOffItem==="function"&&cpSecOffItem(kid,i)) return false;   // 🎚 CPSECTIONS
    if(deck!==WHICH_MIX&&(i.subject||"Other")!==deck) return false;
    return true;
  });
}
function teachDecks(items,kid){
  kid=kid||masteryKid;
  const n={}; teachPool(items,WHICH_MIX,kid).forEach(i=>{ const d=i.subject||"Other"; n[d]=(n[d]||0)+1; });
  return Object.keys(n).filter(d=>n[d]>=TEACH_MIN&&teachDeckOn(kid,d)).sort();
}
function teachStart(deck){
  try{ if(typeof bbAudioUnlock==="function") bbAudioUnlock(); }catch(e){}   // the deck tap unlocks the ding (iPad)
  const items=_teachItems(), mix=deck===WHICH_MIX, ok=teachDecks(items);
  const pool=teachPool(items,deck).filter(i=>ok.indexOf(i.subject||"Other")>=0);
  if(pool.length<TEACH_MIN||(!mix&&!teachDeckOn(masteryKid,deck))){ teachState=null; _mastRe(); return; }   // 🎮 GAMEGRID: a deck Mom turned off for this game
  const picks=_teachShuffle(pool.slice()).slice(0,TEACH_N);
  teachState={kid:masteryKid,deck:deck,mix:mix,game:"teach",t0:Date.now(),turns:picks.map(it=>({pid:it.id,shown:false,done:false,first:false,wrong:{},back:false})),i:0,phase:"play",first:0,of:picks.length,isPB:false,prevBest:null,returned:{}};
  _mastRe();
}
function teachChangeDeck(){ teachState=null; _mastRe(); }   // drop the round as it stands: nothing written
function teachShow(){ const st=teachState, t=st&&st.turns[st.i]; if(!st||st.phase!=="play"||!t||t.done) return; if(typeof gameCardAnswered==="function") gameCardAnswered(t); t.shown=true; _mastRe(); }   // ⏱ CARDSECS: turning it over = the answer given
function teachSay(){ const st=teachState, t=st&&st.turns[st.i]; if(!st||!t) return; const it=_teachItems(st.kid).find(x=>x&&x.id===t.pid); if(it&&!whichSilent(it)) try{ mastSpeak(teachFront(it)); }catch(e){} }
// The listener's verdict: got=true "✓ They got it" · got=false "↻ Teach it again" (the card comes back once at the end)
function teachVerdict(got){
  const st=teachState; if(!st||st.phase!=="play") return;
  const t=st.turns[st.i]; if(!t||t.done||!t.shown) return;   // the answer must be turned over first
  t.done=true;
  if(got){ t.first=!Object.keys(t.wrong).length; if(!t.back&&t.first) st.first++; try{ matchDing(); }catch(e){} }
  else { t.wrong.again=1; t.first=false; if(!t.back&&!st.returned[t.pid]){ st.returned[t.pid]=1; st.turns.push({pid:t.pid,shown:false,done:false,first:false,wrong:{},back:true}); } }
  st.i++;
  if(st.i>=st.turns.length) teachFinish(st);
  _mastRe();
}
function teachBestKey(deck){ return deck+" \u{00B7} teach"; }
function teachFinish(st){
  st.phase="done";
  const kid=st.kid||masteryKid;   // GAMEKID
  try{ if(typeof gameLogRound==="function") gameLogRound(st); }catch(e){}   // 🎮 GAMELOG: each card's verdict, game:"teach" — a log line, never a drill answer
  const s=masteryData[kid+"_settings"]||(masteryData[kid+"_settings"]={});
  if(!s.match_best) s.match_best={};
  const key=teachBestKey(st.deck), prev=s.match_best[key];
  st.prevBest=prev==null?null:prev;
  st.isPB=st.first>0&&(prev==null||st.first>prev);
  if(st.isPB){
    s.match_best[key]=st.first;
    if(db&&!_dryRun()) db.ref("mastery/"+kid+"_settings/match_best").update({[(typeof haKey==="function"?haKey(key):key)]:st.first});   // this key only
    try{HA_LS.setItem("ha_mastery",JSON.stringify(masteryData));}catch(e){}
  }
  try{ if(st.of>0&&st.first===st.of&&typeof _showCelebration==="function"&&document.getElementById("celeb-overlay")) _showCelebration(kid,"\u{1F393} You taught them all!",{noSong:true}); }catch(e){}
}
function teachResume(){}   // no timers, nothing mid-way: the round is exactly as it was left
const TEACH_CSS='<style>.teach-card{border-radius:22px;border:3px solid #c4b5fd;background:#f5f3ff;padding:18px 16px;text-align:center}.teach-front{font-family:\'Fraunces\',serif;font-weight:800;color:#292524;line-height:1.15;overflow-wrap:anywhere}'+
  '.teach-back{margin-top:14px;padding:12px 14px;border-radius:14px;background:#fff;border:2px solid #e2ddd6;font-size:17px;font-weight:700;color:#44403c;line-height:1.35;overflow-wrap:anywhere;text-align:left}'+
  '.teach-btn{padding:14px 22px;border-radius:999px;border:none;font-size:17px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif;-webkit-tap-highlight-color:transparent}</style>';
function buildTeachHtml(color){
  const q=s=>String(s).replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,"&quot;");
  let h=TEACH_CSS+'<div style="padding:4px 14px 24px;max-width:720px;margin:0 auto">';
  const items=_teachItems(), decks=teachDecks(items);
  if(!decks.length){ h+='<div class="mast-none">No decks ready for Teach it yet \u{2014} it needs '+TEACH_MIN+' or more cards in a deck.</div></div>'; return h; }
  const st=teachState;
  const chip=(dk,lbl)=>{ const sel=st&&st.deck===dk; return '<button onclick="teachStart(\''+q(dk)+'\')" style="padding:10px 16px;border-radius:999px;font-size:14px;font-weight:800;border:2px solid '+(sel?color:'#e2ddd6')+';background:'+(sel?color:'#fff')+';color:'+(sel?'#fff':'#57534e')+';cursor:pointer;font-family:\'DM Sans\',sans-serif">'+lbl+'</button>'; };
  if(!st||st.phase==="done"){
    h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 14px">';
    decks.forEach(dk=>{ h+=chip(dk,esc(dk)); });
    if(decks.length>1) h+=chip(WHICH_MIX,"\u{1F3B2} "+WHICH_MIX);
    h+='</div>';
  }
  if(!st){ h+='<div style="font-size:15px;font-weight:700;color:#57534e">\u{1F393} Pick a deck, then teach each card to someone \u{2014} in your own words. They tell you if they got it!</div></div>'; return h; }
  const s=masteryData[st.kid+"_settings"]||{}, best=(s.match_best||{})[teachBestKey(st.deck)];
  if(st.phase==="play"){
    const t=st.turns[st.i], it=items.find(x=>x&&x.id===t.pid), fr=teachFront(it), bk=teachBack(it,st.kid), vis=_smTileVis(it,true), silent=whichSilent(it);
    if(typeof gameCardShown==="function") gameCardShown(t);   // ⏱ CARDSECS: the card is on screen — its clock starts at the first paint
    h+='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0 4px"><div style="display:flex;gap:6px;flex-wrap:wrap">';
    st.turns.forEach((x,ix)=>{ const cur=ix===st.i; h+='<span style="width:14px;height:14px;border-radius:50%;display:inline-block;'+(x.done?'background:'+(x.first?'#16a34a':'#f59e0b'):cur?'background:#fff;border:3px solid '+color:'background:#e7e5e4')+'"></span>'; });
    h+='</div><span style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--muted)">'+esc(st.deck)+(best!=null?' \u{00B7} \u{1F3C6} '+best:'')+
      '<button onclick="teachChangeDeck()" style="padding:6px 12px;border-radius:999px;border:1.5px solid #e2ddd6;background:#fff;color:#57534e;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap;font-family:\'DM Sans\',sans-serif">\u{1F5C2} Change deck</button></span></div>';
    h+='<div style="text-align:center;font-size:17px;font-weight:800;color:#57534e;margin:10px 0 12px">'+(t.back?'One more time \u{2014} teach it again!':'Teach it: tell them what this is, in your own words.')+'</div>';
    h+='<div class="teach-card">';
    if(vis) h+='<div style="display:flex;justify-content:center;margin-bottom:10px"><span style="display:inline-flex;transform:scale(1.4);margin:16px 0">'+vis+'</span></div>';
    h+='<div style="display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap"><div class="teach-front" style="font-size:'+(fr.length<=8?'46px':fr.length<=18?'34px':fr.length<=40?'26px':'20px')+'">'+esc(fr)+'</div>'+
      (silent?'':'<button onclick="teachSay()" aria-label="Hear it" style="width:48px;height:48px;flex:none;border-radius:50%;border:3px solid '+color+';background:#fff;color:'+color+';font-size:22px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center">\u{1F50A}</button>')+'</div>';
    if(t.shown){ h+='<div class="teach-back">'+(bk?esc(bk):'<span style="color:var(--muted)">(this card is its picture and its name)</span>')+'</div>'; }
    else h+='<div style="margin-top:14px"><button class="teach-btn" onclick="teachShow()" style="background:#fff;color:'+color+';border:2px solid '+color+'">\u{1F440} Show the answer</button></div>';
    h+='</div>';
    if(t.shown){
      h+='<div style="text-align:center;font-size:15px;font-weight:800;color:#57534e;margin:16px 0 10px">Did they get it?</div>';
      h+='<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><button class="teach-btn" onclick="teachVerdict(true)" style="background:#16a34a;color:#fff;min-width:150px">\u2713 They got it</button><button class="teach-btn" onclick="teachVerdict(false)" style="background:#fff;color:#b45309;border:2px solid #f59e0b;min-width:150px">\u21BB Teach it again</button></div>';
    }
    return h+'</div>';
  }
  // Finish: how many got it on the first teach, against the kid's own best; Play again / Mix the decks
  h+='<div style="margin-top:6px;text-align:center;padding:16px;border-radius:18px;background:'+(st.isPB?'#f0fdf4':'#f8f7f4')+';border:2px solid '+(st.isPB?'#16a34a':'#e2ddd6')+'">';
  h+='<div style="font-family:\'Fraunces\',serif;font-size:22px;font-weight:800">\u{1F389} You taught them all!</div>';
  h+='<div style="font-size:17px;font-weight:800;color:#57534e;margin-top:10px">\u{1F393} '+st.first+' of '+st.of+' got it the first time'+(st.isPB?' \u{2014} \u{1F3C6} new best!':(st.prevBest!=null?' \u{00B7} best '+st.prevBest:''))+'</div>';
  h+='<div style="display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap">';
  h+='<button onclick="teachStart(\''+q(st.deck)+'\')" class="teach-btn" style="background:'+color+';color:#fff;font-size:15px">\u{1F501} Play again</button>';
  if(decks.length>1&&!st.mix) h+='<button onclick="teachStart(\''+q(WHICH_MIX)+'\')" class="teach-btn" style="border:2px solid '+color+';background:#fff;color:'+color+';font-size:15px">\u{1F3B2} '+WHICH_MIX+'</button>';
  return h+'</div></div></div>';
}
// TEACH_END
// FOUR_START — 🔴 "Connect Four" vs the app (her word 2026-11-03: "Connect Four … lets do these now" — her call over the plan's rule-4 note on
// competitive play; PLAN_practice_games_2026-10-23.md Tier 3 "Connect Four: claim a cell by answering the card in it vs the app; cell content =
// the problem (intrinsic)"). A C4_COLS × C4_ROWS board; every cell holds one of the deck's cards and SHOWS it (a short front, or its picture;
// a long front shows "?" until it is asked), so the kid chooses the column by the problem they want — self-chosen difficulty, the retrieval IS
// the move (plan rule 1). Tap a column: the disc would land on the lowest open cell, and that cell's card is asked — Go Fish's three acts (a
// picture / letter card is said out loud, 🗣 honor tap, the app says the name back; a number back is typed; a word back is picked from three
// of the deck's own backs). Right → the ding, the kid's 🟡 disc lands. Wrong → the bonk, one more try; wrong twice → "We'll come back to that
// one" (the answer never shown), NO disc, the turn passes. Then the app drops a 🔴 disc — it answers nothing, it just plays: a winning column if
// it has one, else it blocks the kid's, else a column near the middle (c4AppMove, pure). Four in a row wins; a full board is a tie. The missed
// cards come back once at the end, then the finish: who connected four + "N of M on the first try" against the kid's own best — the best is the
// ANSWERING, never the wins. No points, no steals, no lives, no clock.
// Cards: Which one?'s own pool (whichPool / whichDeckModes read RAW, like Go Fish), then this game's grid cell gameDeckOn(kid,"four",deck); a
// deck needs C4_MIN+ cards (cells repeat cards when the deck is smaller than the board). Writes (only these): <kid>_settings/match_best key
// "<deck> · four" (first-try rights, only when beaten) and the round's gameLog entry (GAMELOG, game:"four"). NEVER touches the ladder — no
// scores, no next_due, no study log. db && !_dryRun() only. Per-kid park / restore / resume through its GAMES_LIST entry (🎲 GAMEKIT): every
// timer checks its round and sequence. A round dropped (Stop, a kid switch) writes nothing.
// ⚖️ GAMEJUDGE (her decision 2026-11-08, from the games audit — a picture deck's 🗣 logged a right every time, ~7 a card on a small
// deck): the say act is judged by the kid's ONE setting (say it then pick it / type it / Mom judges) — _c4JudgeOpen / _c4Judged below.
// A wrong judge is a double wrong: no disc, the app moves. The honor tap only when the deck has no other name. Rounds are stamped.
let fourState=null;   // {kid,deck,mix,game:"four",t0,cols,rows,board:[[0|1|2]],cards:[[pid]],kinds:{pid},turns:[{pid,act,done,first,wrong:{},tries,fail,back,opts?,typed?}],open:{col,row,t}|null,who:"kid"|"app",winner:null|"kid"|"app"|"tie",last:{col,row,who}|null,phase:"play"|"back"|"done",backs,first,of,isPB,prevBest,lock,seq,msg,say,gameLogged}
let _c4Random=Math.random;   // tests seed it
const C4_COLS=7, C4_ROWS=6, C4_MIN=6, C4_TRIES=2, C4_BEAT=900, C4_LABEL_MAX=6;
const C4_NUM=/^[-+]?\d+([.,]\d+)?$/;
function _c4Items(kid){ return (typeof _gamesItems==="function")?_gamesItems(kid||masteryKid):[]; }
function _c4Shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(_c4Random()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function _c4Raw(fn){ const had=(typeof _gdRaw!=="undefined")?_gdRaw:null; try{ if(had!==null) _gdRaw=true; return fn(); } finally{ if(had!==null) _gdRaw=had; } }
function fourDeckOn(kid,deck){ return (typeof _gdRaw!=="undefined"&&_gdRaw)||typeof gameDeckOn!=="function"||gameDeckOn(kid,"four",deck); }
function _c4WhichPool(items,kid){ return _c4Raw(()=>whichPool(items,WHICH_MIX,kid)); }
function _c4Modes(items,kid){ return _c4Raw(()=>whichDeckModes(items,kid)); }
function _c4It(st,pid){ return _c4Items(st.kid).find(x=>x&&x.id===pid)||null; }
function fourName(it){ return _matchPlain(it&&it.prompt); }
function fourDecks(items,kid){
  kid=kid||masteryKid;
  const n={}; _c4WhichPool(items,kid).forEach(i=>{ const d=i.subject||"Other"; n[d]=(n[d]||0)+1; });
  return Object.keys(n).filter(d=>n[d]>=C4_MIN&&fourDeckOn(kid,d)).sort();
}
function fourPool(items,deck,kid){ kid=kid||masteryKid; const ok=fourDecks(items,kid); return _c4WhichPool(items,kid).filter(i=>ok.indexOf(i.subject||"Other")>=0&&(deck===WHICH_MIX||(i.subject||"Other")===deck)); }
function fourKind(it,mode){ if(mode!=="answer") return "say"; return C4_NUM.test(String(_whichBack(it)).trim())?"type":"pick"; }
// ── the board, pure ── board[row][col], row 0 at the TOP; 0 empty, 1 kid, 2 app
function c4Empty(cols,rows){ const b=[]; for(let r=0;r<rows;r++){ b.push(new Array(cols).fill(0)); } return b; }
function c4Drop(board,col){ for(let r=board.length-1;r>=0;r--){ if(board[r][col]===0) return r; } return -1; }   // the row a disc lands on, -1 when full
function c4Full(board){ return board[0].every(v=>v!==0); }
function c4Win(board,who,r,c){
  const R=board.length, C=board[0].length, dirs=[[0,1],[1,0],[1,1],[1,-1]];
  return dirs.some(([dr,dc])=>{ let n=1;
    for(const s of [1,-1]){ let rr=r+dr*s, cc=c+dc*s; while(rr>=0&&rr<R&&cc>=0&&cc<C&&board[rr][cc]===who){ n++; rr+=dr*s; cc+=dc*s; } }
    return n>=4; });
}
// The app's column: win if it can, else block the kid's win, else near the middle (random among the best); -1 when the board is full
function c4AppMove(board,rnd){
  rnd=rnd||_c4Random;
  const C=board[0].length, open=[]; for(let c=0;c<C;c++){ if(c4Drop(board,c)>=0) open.push(c); }
  if(!open.length) return -1;
  const tryWin=who=>open.filter(c=>{ const r=c4Drop(board,c); board[r][c]=who; const w=c4Win(board,who,r,c); board[r][c]=0; return w; });
  const w=tryWin(2); if(w.length) return w[Math.floor(rnd()*w.length)];
  const b=tryWin(1); if(b.length) return b[Math.floor(rnd()*b.length)];
  const mid=(C-1)/2, best=Math.min.apply(null,open.map(c=>Math.abs(c-mid))), near=open.filter(c=>Math.abs(c-mid)<=best+1);
  return near[Math.floor(rnd()*near.length)];
}
// ── the round ──
function _c4Say(st,text){ st.say=text||""; if(!text||(typeof mastView!=="undefined"&&mastView!=="four")) return; try{ mastSpeak(text); }catch(e){} }
function fourSayAgain(){ const st=fourState; if(st&&st.say) try{ mastSpeak(st.say); }catch(e){} }
function fourStart(deck){
  try{ if(typeof bbAudioUnlock==="function") bbAudioUnlock(); }catch(e){}   // the deck tap unlocks the ding / bonk (iPad)
  const items=_c4Items(), mix=deck===WHICH_MIX, modes=_c4Modes(items), pool=fourPool(items,deck);
  if(pool.length<C4_MIN||(!mix&&!fourDeckOn(masteryKid,deck))){ fourState=null; _mastRe(); return; }   // 🎮 GAMEGRID: a deck Mom turned off for this game
  const kinds={}; pool.forEach(i=>{ kinds[i.id]=fourKind(i,modes[i.subject||"Other"]); });
  // every cell a card: the pool shuffled, then again when the board is bigger than the deck (no card twice before all are placed)
  const need=C4_COLS*C4_ROWS; let seq=[]; while(seq.length<need) seq=seq.concat(_c4Shuffle(pool.map(i=>i.id)));
  const cards=[]; for(let r=0;r<C4_ROWS;r++){ cards.push(seq.slice(r*C4_COLS,(r+1)*C4_COLS)); }
  fourState={kid:masteryKid,deck:deck,mix:mix,game:"four",t0:Date.now(),cols:C4_COLS,rows:C4_ROWS,board:c4Empty(C4_COLS,C4_ROWS),cards:cards,kinds:kinds,turns:[],open:null,who:"kid",winner:null,last:null,phase:"play",backs:null,first:0,of:0,isPB:false,prevBest:null,lock:false,seq:0,msg:"Your turn! Tap a column.",say:""};
  if(typeof gameJudgeMode==="function"){ fourState.judge=gameJudgeMode(masteryKid); fourState.nch=gameJudgeChoices(masteryKid); }   // ⚖️ GAMEJUDGE: the kid's setting, read once a round (stamps the log)
  _c4Say(fourState,"Your turn!");
  _mastRe();
}
function fourStop(){ fourState=null; _mastRe(); }   // drop the round as it stands: nothing written
// Three backs for a pick: the card's own + two different backs from its deck (Which one?'s rule), shuffled
function _c4Lures(st,pid){
  const it=_c4It(st,pid); if(!it) return [];
  const own=_whichBack(it), seen={}; seen[_whichNorm(own)]=1;
  const more=_c4Shuffle(_c4WhichPool(_c4Items(st.kid),st.kid).filter(x=>x.id!==pid&&(x.subject||"Other")===(it.subject||"Other"))).map(x=>_whichBack(x)).filter(b=>b&&!seen[_whichNorm(b)]&&(seen[_whichNorm(b)]=1)).slice(0,2);
  return _c4Shuffle([own].concat(more));
}
function _c4Ask(st,col,row,pid,back){
  const act=st.kinds[pid]||"say", t={pid:pid,act:act,done:false,first:false,wrong:{},tries:0,fail:false,back:!!back}; st.turns.push(t);
  if(act==="pick") t.opts=_c4Lures(st,pid);
  if(act==="type") t.typed="";
  st.open={col:col,row:row,t:st.turns.length-1};
  const it=_c4It(st,pid), lead=back?"One more time. ":"";
  st.msg=lead+(act==="say"?"Say it out loud, then tap \u{1F5E3}":act==="type"?"Type the answer.":"Tap the answer.");
  if(act==="say") _c4Say(st,lead+"What is it?"); else _c4Say(st,lead+(it&&!whichSilent(it)?fourName(it):""));
  if(st.judge) _c4JudgeOpen(st,t,lead);   // ⚖️ GAMEJUDGE: a say card is judged (pick / type / Mom) instead of the honor tap
}
function fourPickCol(col){
  const st=fourState; if(!st||st.phase!=="play"||st.lock||st.open||st.who!=="kid") return;
  const row=c4Drop(st.board,col); if(row<0) return;
  _c4Ask(st,col,row,st.cards[row][col],false); _mastRe();
}
function _c4Turn(st,act){ if(!st||st.lock||st.phase==="done"||!st.open) return null; const t=st.turns[st.open.t]; return (t&&t.act===act&&!t.done)?t:null; }
function fourSaid(){   // 🗣 "I said it" — the honor system: a tablet can't hear; the app says the name back as the confirm
  const st=fourState, t=_c4Turn(st,"say"); if(!t) return;
  if(typeof gameCardAnswered==="function") gameCardAnswered(t);   // ⏱ CARDSECS: the first answer on this card stops its clock
  if(t.gj){ gameJudgeSaid(); return; }   // ⚖️ GAMEJUDGE: no self-report — "I said it" opens the choices (pick); type / Mom have their own taps
  t.done=true; t.first=true;
  _c4Settle(st,t,"",fourName(_c4It(st,t.pid))); _mastRe();
}
// ⚖️ GAMEJUDGE: a say card goes to the shared judge. Right → the kid's disc, as the honor tap was. Wrong → exactly a double wrong:
// ok:false, the bonk, "It's <name>." said (the right one stays lit), NO disc, the app moves; it comes back once at the end.
function _c4JudgeOpen(st,t,lead){
  if(!st.judge||t.act!=="say"||typeof gameJudgeAct!=="function") return;
  const it=_c4It(st,t.pid); if(!it) return;
  const deck=it.subject||"Other", names=_c4WhichPool(_c4Items(st.kid),st.kid).filter(x=>x&&x.id!==it.id&&(x.subject||"Other")===deck).map(x=>fourName(x));
  if(gameJudgeAct(st,t,{kid:st.kid,deck:deck,right:fourName(it),names:names,mode:st.judge,n:st.nch,shuffle:_c4Shuffle,
    live:()=>fourState===st&&_c4Turn(st,"say")===t, line:s=>{ st.msg=lead+s; },
    onRight:x=>_c4Judged(st,x,true), onWrong:(x,g)=>_c4Judged(st,x,false,g)})) t.judge=st.judge;   // false (no other name) → the honor tap
}
function _c4Judged(st,t,right,given){
  const name=fourName(_c4It(st,t.pid));
  t.done=true; t.first=!!right;
  if(right) return _c4Settle(st,t,"",name);
  t.tries=1; t.fail=true; t.wrong[(given!=null&&String(given)!=="")?String(given):"1"]=1;
  try{ matchBonk(); }catch(e){}
  return _c4Settle(st,t,"It\u2019s "+name+". We\u2019ll come back to that one.","");   // a fail: no disc, the app plays
}
function fourKey(ch){ const st=fourState, t=_c4Turn(st,"type"); if(!t) return; if(ch==="back") t.typed=t.typed.slice(0,-1); else if(t.typed.length<6) t.typed+=ch; _mastRe(); }
function _c4AnsOk(act,given,back){ if(act==="pick") return String(given)===String(back); return (typeof mstTypeAnsOk==="function")?mstTypeAnsOk(given,back):Number(String(given).replace(",","."))===Number(String(back).replace(",",".")); }
// PURE: one answer against the card's back → "right" | "again" | "fail"
function fourJudge(t,given,back){
  if(typeof gameCardAnswered==="function") gameCardAnswered(t);   // ⏱ CARDSECS: the first answer on this card stops its clock
  if(_c4AnsOk(t.act,given,back)){ t.done=true; t.first=t.tries===0; return "right"; }
  t.tries++; t.wrong[t.act==="pick"?String(given):String(t.tries)]=1; t.typed="";
  if(t.tries>=C4_TRIES){ t.done=true; t.first=false; t.fail=true; return "fail"; }
  return "again";
}
function fourCheck(){ const st=fourState, t=_c4Turn(st,"type"); if(!t||!t.typed) return; _c4After(st,t,fourJudge(t,t.typed,_whichBack(_c4It(st,t.pid)))); }
function fourPickTap(i){ const st=fourState, t=_c4Turn(st,"pick"); if(!t||!t.opts||t.opts[i]==null||t.wrong[t.opts[i]]) return; _c4After(st,t,fourJudge(t,t.opts[i],_whichBack(_c4It(st,t.pid)))); }
function _c4After(st,t,r){
  if(r==="again"){ try{ matchBonk(); }catch(e){} st.msg="Almost \u2014 try again!"; _mastRe(); return; }
  if(r==="fail") try{ matchBonk(); }catch(e){}
  _c4Settle(st,t,r==="fail"?"We\u2019ll come back to that one.":"",""); _mastRe();
}
// The card is settled. In play: a right answer lands the kid's disc (and may win); a fail lands nothing; either way the turn passes to the app after a beat.
function _c4Settle(st,t,lead,spoken){
  const o=st.open;
  if(st.phase==="play"&&o&&!t.fail){
    st.board[o.row][o.col]=1; st.last={col:o.col,row:o.row,who:"kid"}; st.of++; if(t.first) st.first++;
    try{ matchDing(); }catch(e){}
    if(c4Win(st.board,1,o.row,o.col)){ st.winner="kid"; st.msg="Four in a row \u2014 you did it!"; _c4Say(st,(spoken?spoken+". ":"")+"Four in a row! You did it!"); return _c4Beat(st,"end"); }
    if(c4Full(st.board)){ st.winner="tie"; st.msg="The board is full \u2014 a tie!"; _c4Say(st,(spoken?spoken+". ":"")+"A tie!"); return _c4Beat(st,"end"); }
    st.msg=t.first?"That\u2019s it! Your disc drops in.":"Got it \u2014 your disc drops in."; _c4Say(st,(spoken?spoken+". ":"")+"That\u2019s it!"); return _c4Beat(st,"app");
  }
  if(st.phase==="play"){ st.of++; st.msg=lead; _c4Say(st,lead); return _c4Beat(st,"app"); }   // a fail: no disc, the app plays
  if(t.first){ try{ matchDing(); }catch(e){} st.msg="That\u2019s it!"; _c4Say(st,(spoken?spoken+". ":"")+"That\u2019s it!"); } else { st.msg=lead||"Okay \u2014 next one."; _c4Say(st,lead||"Next one."); }   // a come-back: nothing moves
  return _c4Beat(st,"back");
}
function _c4Beat(st,after,ms){ st.lock=true; st.after=after; const seq=++st.seq; setTimeout(()=>{ if(fourState===st&&st.lock&&st.seq===seq) fourNext(st); },ms||C4_BEAT); }
function fourNext(st){ st=st||fourState; if(!st||st!==fourState) return; st.lock=false; st.open=null; const a=st.after; st.after=null; _c4Go(st,a); _mastRe(); }
function _c4Go(st,a){ if(a==="app") _c4AppTurn(st); else if(a==="kid") _c4KidTurn(st); else if(a==="end") _c4End(st); else if(a==="back") _c4BackNext(st); }
function _c4KidTurn(st){ st.who="kid"; st.msg="Your turn! Tap a column."; _c4Say(st,"Your turn!"); }
function _c4AppTurn(st){
  st.who="app";
  const col=c4AppMove(st.board); if(col<0){ st.winner="tie"; return _c4End(st); }
  const row=c4Drop(st.board,col); st.board[row][col]=2; st.last={col:col,row:row,who:"app"};
  if(c4Win(st.board,2,row,col)){ st.winner="app"; st.msg="I got four in a row this time!"; _c4Say(st,"I got four in a row this time!"); return _c4Beat(st,"end"); }
  if(c4Full(st.board)){ st.winner="tie"; st.msg="The board is full \u2014 a tie!"; _c4Say(st,"A tie!"); return _c4Beat(st,"end"); }
  st.msg="My disc goes here. Your turn!"; _c4Say(st,"My turn. Your turn!"); _c4Beat(st,"kid");
}
// ── the end: four in a row or a full board → the missed cards come back once → finish ──
function _c4End(st){
  if(st.phase!=="play") return;
  st.phase="back"; st.open=null; st.who="kid";
  const seen={}, backs=[];
  st.turns.forEach(t=>{ if(t.back||seen[t.pid]) return; if(Object.keys(t.wrong).length||t.fail){ seen[t.pid]=1; backs.push(t.pid); } });
  st.backs=backs;
  if(!backs.length) return _c4Finish(st);
  st.msg="Game over! Let\u2019s look at a few again."; _c4Say(st,"Let's look at a few again."); _c4Beat(st,"back",C4_BEAT*2);
}
function _c4BackNext(st){ const pid=st.backs&&st.backs.shift(); if(pid==null) return _c4Finish(st); _c4Ask(st,-1,-1,pid,true); }
function fourBestKey(deck){ return deck+" \u{00B7} four"; }
function _c4Finish(st){
  st.phase="done"; st.open=null; st.lock=false; st.after=null;
  const kid=st.kid||masteryKid;   // GAMEKID
  try{ if(typeof gameLogRound==="function") gameLogRound(st); }catch(e){}   // 🎮 GAMELOG: every act's result, game:"four"
  const s=masteryData[kid+"_settings"]||(masteryData[kid+"_settings"]={});
  if(!s.match_best) s.match_best={};
  const key=fourBestKey(st.deck), prev=s.match_best[key];
  st.prevBest=prev==null?null:prev;
  st.isPB=st.first>0&&(prev==null||st.first>prev);
  if(st.isPB){
    s.match_best[key]=st.first;
    if(db&&!_dryRun()) db.ref("mastery/"+kid+"_settings/match_best").update({[(typeof haKey==="function"?haKey(key):key)]:st.first});   // this key only
    try{HA_LS.setItem("ha_mastery",JSON.stringify(masteryData));}catch(e){}
  }
  st.msg=st.winner==="kid"?"Four in a row!":st.winner==="app"?"Good game \u2014 I got four this time.":"A tie!"; st.say="";
  try{ if(st.winner==="kid"&&st.of>0&&st.first===st.of&&typeof _showCelebration==="function"&&document.getElementById("celeb-overlay")) _showCelebration(kid,"\u{1F534} Four in a row!",{noSong:true}); }catch(e){}
}
// GAMEKID → 🎲 GAMEKIT resume: a beat that was mid-way when the kid switched settles here (no render; the caller renders)
function fourResume(){
  const st=fourState; if(!st||st.phase==="done") return;
  if(st.lock){ st.lock=false; st.open=null; const a=st.after; st.after=null; _c4Go(st,a); return; }
  if(st.say&&(typeof mastView==="undefined"||mastView==="four")) try{ mastSpeak(st.say); }catch(e){}
}
// ── the screen ──
const C4_CSS='<style>.c4-board{display:grid;gap:4px;background:#1d4ed8;border:4px solid #1e3a8a;border-radius:16px;padding:6px}.c4-cell{aspect-ratio:1;border-radius:50%;background:#eff6ff;display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative;min-width:0}'+
  '.c4-cell .c4-lbl{font-size:clamp(9px,2.6vw,13px);font-weight:800;color:#1e3a8a;font-family:\'DM Sans\',sans-serif;text-align:center;line-height:1;pointer-events:none;overflow:hidden;padding:1px}.c4-cell .c4-pic{transform:scale(.42);pointer-events:none}'+
  '.c4-cell.c4-kid{background:#facc15;box-shadow:inset 0 0 0 3px #ca8a04}.c4-cell.c4-app{background:#ef4444;box-shadow:inset 0 0 0 3px #b91c1c}.c4-cell.c4-last{outline:3px solid #fff}.c4-cell.c4-ask{background:#fef3c7;box-shadow:0 0 0 4px #fde68a}'+
  '.c4-col{min-height:40px;border-radius:12px;border:2px solid #e2ddd6;background:#fff;font-size:18px;font-weight:800;cursor:pointer;color:#1e3a8a;-webkit-tap-highlight-color:transparent}.c4-col[disabled]{opacity:.4;cursor:default}'+
  '.c4-card{width:150px;height:160px;border-radius:14px;border:3px solid #a78bfa;background:#f5f3ff;display:flex;align-items:center;justify-content:center;overflow:hidden;margin:0 auto}.c4-card .c4-vis{pointer-events:none;transform:scale(1.5)}.c4-card .c4-txt{pointer-events:none;font-family:\'Fraunces\',serif;font-weight:800;font-size:34px;line-height:1.1;color:#292524;text-align:center;padding:6px;overflow-wrap:anywhere}'+
  '.c4-btn{padding:12px 22px;border-radius:999px;border:none;font-size:16px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif;-webkit-tap-highlight-color:transparent}.c4-btn[disabled],.c4-key[disabled],.c4-opt[disabled]{opacity:.45;cursor:default}'+
  '.c4-key{width:64px;height:56px;border-radius:14px;border:2px solid #e2ddd6;background:#fff;font-family:\'Fraunces\',serif;font-size:26px;font-weight:800;color:#292524;cursor:pointer}'+
  '.c4-opt{min-width:96px;padding:14px 18px;border-radius:16px;border:3px solid #e2ddd6;background:#fff;font-family:\'Fraunces\',serif;font-size:24px;font-weight:800;color:#292524;cursor:pointer;overflow-wrap:anywhere}.c4-opt.c4-wrong{opacity:.28;filter:grayscale(1);cursor:default}</style>';
// What a cell shows before a disc covers it: a short front, its picture, or "?" for a long front
function _c4CellLabel(st,pid){
  const it=_c4It(st,pid); if(!it) return '';
  if((st.kinds[pid]||"say")==="say"){ const v=_smTileVis(it); if(v) return '<span class="c4-pic">'+v+'</span>'; }
  const f=fourName(it); return '<span class="c4-lbl">'+(f.length<=C4_LABEL_MAX?esc(f):'?')+'</span>';
}
function _c4CardVis(st,pid){
  const it=_c4It(st,pid); if(!it) return '';
  if((st.kinds[pid]||"say")==="say"){ const v=_smTileVis(it); if(v) return '<span class="c4-vis">'+v+'</span>'; }
  return '<span class="c4-txt">'+esc(fourName(it))+'</span>';   // an answer card shows its FRONT (the kid produces the back)
}
function buildFourHtml(color){
  const q=s=>String(s).replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,"&quot;");
  let h=C4_CSS+'<div style="padding:4px 14px 24px;max-width:720px;margin:0 auto">';
  const items=_c4Items(), decks=fourDecks(items);
  if(!decks.length){ h+='<div class="mast-none">No decks ready for Connect Four yet \u{2014} it needs '+C4_MIN+' or more cards with a picture (or a short answer on the back).</div></div>'; return h; }
  const st=fourState;
  const chip=(dk,lbl)=>{ const sel=st&&st.deck===dk; return '<button onclick="fourStart(\''+q(dk)+'\')" style="padding:10px 16px;border-radius:999px;font-size:14px;font-weight:800;border:2px solid '+(sel?color:'#e2ddd6')+';background:'+(sel?color:'#fff')+';color:'+(sel?'#fff':'#57534e')+';cursor:pointer;font-family:\'DM Sans\',sans-serif">'+lbl+'</button>'; };
  if(!st||st.phase==="done"){
    h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 14px">';
    decks.forEach(dk=>{ h+=chip(dk,esc(dk)); });
    if(decks.length>1) h+=chip(WHICH_MIX,"\u{1F3B2} "+WHICH_MIX);
    h+='</div>';
  }
  if(!st){ h+='<div style="font-size:15px;font-weight:700;color:#57534e">\u{1F534} Pick a deck. Answer the card where your disc would land to drop it in \u{2014} four in a row wins!</div></div>'; return h; }
  const s=masteryData[st.kid+"_settings"]||{}, best=(s.match_best||{})[fourBestKey(st.deck)];
  const o=st.open, t=o?st.turns[o.t]:null, lock=st.lock;
  if(typeof gameCardShown==="function") gameCardShown(t);   // ⏱ CARDSECS: the card is on screen — its clock starts at the first paint
  const board=()=>{ let x='<div class="c4-board" style="grid-template-columns:repeat('+st.cols+',1fr)">';
    for(let r=0;r<st.rows;r++){ for(let c=0;c<st.cols;c++){ const v=st.board[r][c], ask=!!(o&&o.col===c&&o.row===r&&st.phase==="play"), last=!!(st.last&&st.last.col===c&&st.last.row===r);
      x+='<div class="c4-cell'+(v===1?' c4-kid':v===2?' c4-app':'')+(ask?' c4-ask':'')+(last?' c4-last':'')+'" aria-label="'+(v===1?'your disc':v===2?'the app\u2019s disc':'open')+'">'+(v?'':_c4CellLabel(st,st.cards[r][c]))+'</div>'; } }
    return x+'</div>'; };
  if(st.phase==="done"){
    h+='<div style="margin-top:6px;text-align:center;padding:16px;border-radius:18px;background:'+(st.isPB?'#f0fdf4':'#f8f7f4')+';border:2px solid '+(st.isPB?'#16a34a':'#e2ddd6')+'">';
    h+='<div style="font-family:\'Fraunces\',serif;font-size:22px;font-weight:800">'+(st.winner==="kid"?'\u{1F389} Four in a row \u2014 you did it!':st.winner==="app"?'\u{1F534} Good game! I got four this time.':'\u{1F91D} A tie!')+'</div>';
    h+='<div style="margin:12px auto;max-width:380px">'+board()+'</div>';
    h+='<div style="font-size:17px;font-weight:800;color:#57534e">\u{1F7E1} '+st.first+' of '+st.of+' on the first try'+(st.isPB?' \u{2014} \u{1F3C6} new best!':(st.prevBest!=null?' \u{00B7} best '+st.prevBest:''))+'</div>';
    h+='<div style="display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap">';
    h+='<button onclick="fourStart(\''+q(st.deck)+'\')" class="c4-btn" style="background:'+color+';color:#fff;font-size:15px">\u{1F501} Play again</button>';
    if(decks.length>1&&!st.mix) h+='<button onclick="fourStart(\''+q(WHICH_MIX)+'\')" class="c4-btn" style="border:2px solid '+color+';background:#fff;color:'+color+';font-size:15px">\u{1F3B2} '+WHICH_MIX+'</button>';
    return h+'</div></div></div>';
  }
  h+='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0 4px;flex-wrap:wrap"><span style="font-size:13px;font-weight:800;color:#57534e">\u{1F7E1} you \u00B7 \u{1F534} the app</span>';
  h+='<span style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--muted)">'+esc(st.deck)+(best!=null?' \u{00B7} \u{1F3C6} '+best:'')+
    '<button onclick="fourStop()" style="padding:6px 12px;border-radius:999px;border:1.5px solid #e2ddd6;background:#fff;color:#57534e;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap;font-family:\'DM Sans\',sans-serif">\u{21A9} Stop</button></span></div>';
  h+='<div style="display:flex;align-items:center;gap:10px;margin:10px 0 12px;padding:12px 14px;border-radius:18px;background:#fef2f2;border:2px solid #fecaca"><span style="font-size:28px;line-height:1">\u{1F534}</span><span style="flex:1;font-size:17px;font-weight:800;color:#7f1d1d">'+esc(st.msg)+'</span>'+
    (st.say?'<button onclick="fourSayAgain()" aria-label="Hear it again" style="width:56px;height:56px;flex:none;border-radius:50%;border:3px solid '+color+';background:#fff;color:'+color+';font-size:26px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center">\u{1F50A}</button>':'')+'</div>';
  if(t&&(!t.done||lock)){
    h+='<div style="margin:6px 0 12px"><span class="c4-card">'+_c4CardVis(st,t.pid)+'</span></div>';
    if(t.act==="say"&&t.gj&&typeof gameJudgeHtml==="function") h+=gameJudgeHtml(t,color,lock);   // ⚖️ GAMEJUDGE: the choices / the typing box / Mom's ✓ ✗
    else if(t.act==="say") h+='<div style="display:flex;justify-content:center"><button class="c4-btn" onclick="fourSaid()"'+(lock||t.done?' disabled':'')+' style="background:'+color+';color:#fff;font-size:20px;padding:18px 34px">\u{1F5E3} I said it</button></div>';
    else if(t.act==="type"){
      h+='<div style="display:flex;justify-content:center;margin-bottom:10px"><span style="min-width:120px;height:56px;border-radius:14px;border:3px solid '+color+';background:#fff;font-family:\'Fraunces\',serif;font-size:30px;font-weight:800;color:#292524;display:inline-flex;align-items:center;justify-content:center;padding:0 14px">'+esc(t.typed||"")+'</span></div>';
      h+='<div style="display:grid;grid-template-columns:repeat(3,64px);gap:8px;justify-content:center">';
      ["1","2","3","4","5","6","7","8","9","back","0","ok"].forEach(k=>{ if(k==="back") h+='<button class="c4-key" onclick="fourKey(\'back\')"'+(lock?' disabled':'')+' aria-label="Erase">\u{232B}</button>'; else if(k==="ok") h+='<button class="c4-key" onclick="fourCheck()"'+(lock||!t.typed?' disabled':'')+' style="background:'+color+';color:#fff;border-color:transparent" aria-label="Check">\u{2714}</button>'; else h+='<button class="c4-key" onclick="fourKey(\''+k+'\')"'+(lock?' disabled':'')+'>'+k+'</button>'; });
      h+='</div>';
    } else {
      h+='<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">';
      (t.opts||[]).forEach((op,i)=>{ const w=!!t.wrong[op]; h+='<button class="c4-opt'+(w?' c4-wrong':'')+'" onclick="fourPickTap('+i+')"'+(w||lock||t.done?' disabled':'')+'>'+esc(op)+'</button>'; });
      h+='</div>';
    }
  }
  if(st.phase==="play"){
    const can=st.who==="kid"&&!o&&!lock;
    h+='<div style="display:grid;grid-template-columns:repeat('+st.cols+',1fr);gap:4px;margin:14px 0 6px">';
    for(let c=0;c<st.cols;c++){ const full=c4Drop(st.board,c)<0; h+='<button class="c4-col" aria-label="Drop in column '+(c+1)+'"'+(can&&!full?' onclick="fourPickCol('+c+')"':' disabled')+'>\u2B07</button>'; }
    h+='</div>'+board();
  }
  return h+'</div>';
}
// FOUR_END
// SHIP_START — 🚢 "Battleship" (her word 2026-11-03: "Battleship/map pin. lets do these now"; PLAN_practice_games_2026-10-23.md Tier 4
// "Battleship / map pin (geography, anatomy): tap the country / part on a picture; type its name — spatial REC → PROD"). The plan's map
// needs a map image and a pin position per card, and NO deck carries either today, so this is the picture-grid form: the deck's own
// pictures are the fleet, anchored on a sea grid with coordinates (A1 … D3) that stay put for the whole round — the "map" is the grid.
// Two kinds of turn, alternating: 🎯 FIND — the app SAYS a name ("Fire at… the copperhead!"; never written), the kid taps that picture;
// wrong → the bonk, said again, try again from the ones left. 📣 NAME — one tile lights up ("What's at B2?"), the kid says its name out
// loud and taps 🗣 (the honor system — a tablet has no mic; the app says the name back as the confirm). A hit marks the tile 💥 (sunk);
// every tile is fired at exactly once. Misses come back once at the end as a find, then the finish: "N of M sunk on the first shot"
// against the kid's own best. No lives, no clock, no opponent fleet, no luck — every shot is a card.
// Decks: Which one?'s picture and symbol decks only (whichDeckModes read RAW, like Go Fish — a deck turned off for Which one? still
// plays here), with SHIP_MIN+ cards; answer-only decks (math, roots, capitals) can't be a map — hidden through decks:(k)=>…, never
// asked about. Then this game's grid cell gameDeckOn(kid,"ship",deck). Writes (only these): <kid>_settings/match_best key "<deck> · ship"
// (first-shot hits, only when beaten) and the round's gameLog entry (GAMELOG, game:"ship"). NEVER touches the ladder — no scores, no
// next_due, no study log. db && !_dryRun() only. Per-kid park / restore / resume through its GAMES_LIST entry (🎲 GAMEKIT). A round
// dropped (Change deck, a kid switch) writes nothing.
// ⚖️ GAMEJUDGE (her decision 2026-11-08, from the games audit — half of every round was a free 🗣 right, and the last find was forced):
//   · the NAME act is judged by the kid's ONE setting (say it then pick it / type it / Mom judges) — _shipJudgeOpen / _shipJudged below.
//     A wrong judge: ok:false, the bonk, "It's <name>." said (the right one stays lit), the tile still sinks, and it comes back once as a
//     find. The honor tap only when the deck has no other name. Rounds are stamped (st.judge → gameLog judge).
//   · a FIND with only one tile left to tap is forced: it isn't logged (nolog) and isn't a first shot — "N of M" leaves it out.
let shipState=null;   // {kid,deck,mix,game:"ship",t0,cols,rows,grid:[pid],sunk:{pid:1},turns:[{pid,act:"find"|"name",done,first,wrong:{},back}],i,phase:"play"|"done",first,of,isPB,prevBest,lock,seq,msg,say,returned:{},gameLogged}
let _shipRandom=Math.random;   // tests seed it
const SHIP_MAX=12, SHIP_MIN=6, SHIP_BEAT=900, SHIP_LETTERS="ABCDEF";
function _shipItems(kid){ return (typeof _gamesItems==="function")?_gamesItems(kid||masteryKid):[]; }
function _shipShuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(_shipRandom()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function _shipRaw(fn){ const had=(typeof _gdRaw!=="undefined")?_gdRaw:null; try{ if(had!==null) _gdRaw=true; return fn(); } finally{ if(had!==null) _gdRaw=had; } }
function shipDeckOn(kid,deck){ return (typeof _gdRaw!=="undefined"&&_gdRaw)||typeof gameDeckOn!=="function"||gameDeckOn(kid,"ship",deck); }
function _shipModes(items,kid){ return _shipRaw(()=>whichDeckModes(items,kid)); }
function _shipWhichPool(items,kid){ return _shipRaw(()=>whichPool(items,WHICH_MIX,kid)); }
function shipName(it){ return _matchPlain(it&&it.prompt); }
// The decks that can be a map: picture or symbol mode (a tile must be something to look at), SHIP_MIN+ cards
function shipDecks(items,kid){
  kid=kid||masteryKid;
  const modes=_shipModes(items,kid), n={};
  _shipWhichPool(items,kid).forEach(i=>{ const d=i.subject||"Other"; if(modes[d]==="picture"||modes[d]==="symbol") n[d]=(n[d]||0)+1; });
  return Object.keys(n).filter(d=>n[d]>=SHIP_MIN&&shipDeckOn(kid,d)).sort();
}
function shipPool(items,deck,kid){ kid=kid||masteryKid; const ok=shipDecks(items,kid); return _shipWhichPool(items,kid).filter(i=>ok.indexOf(i.subject||"Other")>=0&&(deck===WHICH_MIX||(i.subject||"Other")===deck)); }
// PURE: the grid shape for n tiles — 3 across up to 9, else 4 across
function shipShape(n){ const cols=n<=9?3:4; return {cols:cols,rows:Math.ceil(n/cols)}; }
function shipCoord(i,cols){ return SHIP_LETTERS.charAt(Math.floor(i/cols))+(i%cols+1); }   // "B2"
function _shipSay(st,text){ st.say=text||""; if(!text||(typeof mastView!=="undefined"&&mastView!=="ship")) return; try{ mastSpeak(text); }catch(e){} }
function shipSayAgain(){ const st=shipState; if(st&&st.say) try{ mastSpeak(st.say); }catch(e){} }
function shipStart(deck){
  try{ if(typeof bbAudioUnlock==="function") bbAudioUnlock(); }catch(e){}   // the deck tap unlocks the ding / bonk (iPad)
  const items=_shipItems(), mix=deck===WHICH_MIX, pool=shipPool(items,deck);
  if(pool.length<SHIP_MIN||(!mix&&!shipDeckOn(masteryKid,deck))){ shipState=null; _mastRe(); return; }   // 🎮 GAMEGRID: a deck Mom turned off for this game
  const grid=_shipShuffle(pool.slice()).slice(0,SHIP_MAX).map(i=>i.id), sh=shipShape(grid.length);
  // every tile once: the order shuffled, find / name alternating
  const turns=_shipShuffle(grid.slice()).map((pid,k)=>({pid:pid,act:k%2===0?"find":"name",done:false,first:false,wrong:{},back:false}));
  shipState={kid:masteryKid,deck:deck,mix:mix,game:"ship",t0:Date.now(),cols:sh.cols,rows:sh.rows,grid:grid,sunk:{},turns:turns,i:0,phase:"play",first:0,of:turns.length,isPB:false,prevBest:null,lock:false,seq:0,msg:"",say:"",returned:{}};
  if(typeof gameJudgeMode==="function"){ shipState.judge=gameJudgeMode(masteryKid); shipState.nch=gameJudgeChoices(masteryKid); }   // ⚖️ GAMEJUDGE: the kid's setting, read once a round (stamps the log)
  _shipAsk(shipState);
  _mastRe();
}
function shipChangeDeck(){ shipState=null; _mastRe(); }   // drop the round as it stands: nothing written
function _shipIt(st,pid){ return _shipItems(st.kid).find(x=>x&&x.id===pid)||null; }
function _shipAsk(st){
  const t=st.turns[st.i]; if(!t) return;
  const it=_shipIt(st,t.pid), lead=t.back?"One more time. ":"";
  if(t.act==="find"){ st.msg=lead+"\u{1F3AF} Fire at\u2026 (listen!) Tap it on the map."; _shipSay(st,lead+"Fire at the "+shipName(it)+"!"); }   // the name is SAID, never written
  else { st.msg=lead+"\u{1F4E3} What\u2019s at "+shipCoord(st.grid.indexOf(t.pid),st.cols)+"? Say it, then tap \u{1F5E3}"; _shipSay(st,lead+"What's at "+shipCoord(st.grid.indexOf(t.pid),st.cols).split("").join(" ")+"?");
    if(st.judge) _shipJudgeOpen(st,t,lead+"\u{1F4E3} What\u2019s at "+shipCoord(st.grid.indexOf(t.pid),st.cols)+"? "); }   // ⚖️ GAMEJUDGE: the name is judged (pick / type / Mom)
}
// 🎯 a find: the kid taps a tile
function shipTap(gi){
  const st=shipState; if(!st||st.phase!=="play"||st.lock) return;
  const t=st.turns[st.i]; if(!t||t.done||t.act!=="find") return;
  const pid=st.grid[gi]; if(pid==null||t.wrong[pid]||(st.sunk[pid]&&pid!==t.pid)) return;
  if(typeof gameCardAnswered==="function") gameCardAnswered(t);   // ⏱ CARDSECS: the first answer on this card stops its clock
  if(pid!==t.pid){ t.wrong[pid]=1; try{ matchBonk(); }catch(e){} st.msg="Splash \u2014 not that one. Listen again!"; shipSayAgain(); _mastRe(); return; }
  _shipHit(st,t,"");
}
// 📣 a name: 🗣 "I said it" — the honor system; the app says the name back
function shipSaid(){
  const st=shipState; if(!st||st.phase!=="play"||st.lock) return;
  const t=st.turns[st.i]; if(!t||t.done||t.act!=="name") return;
  if(typeof gameCardAnswered==="function") gameCardAnswered(t);   // ⏱ CARDSECS: the first answer on this card stops its clock
  if(t.gj){ gameJudgeSaid(); return; }   // ⚖️ GAMEJUDGE: no self-report — "I said it" opens the choices (pick); type / Mom have their own taps
  _shipHit(st,t,shipName(_shipIt(st,t.pid)));
}
// ⚖️ GAMEJUDGE: the name act goes to the shared judge. Right → the Hit, as the honor tap was. Wrong → a miss (see the header).
function _shipJudgeOpen(st,t,lead){
  if(!st.judge||t.act!=="name"||typeof gameJudgeAct!=="function") return;
  const it=_shipIt(st,t.pid); if(!it) return;
  const deck=it.subject||"Other", names=_shipWhichPool(_shipItems(st.kid),st.kid).filter(x=>x&&x.id!==it.id&&(x.subject||"Other")===deck).map(x=>shipName(x));
  if(gameJudgeAct(st,t,{kid:st.kid,deck:deck,right:shipName(it),names:names,mode:st.judge,n:st.nch,shuffle:_shipShuffle,
    live:()=>shipState===st&&st.phase==="play"&&!st.lock&&st.turns[st.i]===t&&!t.done, line:s=>{ st.msg=lead+s; },
    onRight:x=>_shipHit(st,x,shipName(it)), onWrong:(x,g)=>_shipJudged(st,x,g)})) t.judge=st.judge;   // false (no other name) → the honor tap
}
function _shipJudged(st,t,given){
  t.fail=true; t.wrong[(given!=null&&String(given)!=="")?String(given):"1"]=1;
  _shipHit(st,t,"","It\u2019s "+shipName(_shipIt(st,t.pid))+".");
}
function _shipHit(st,t,spoken,miss){   // miss: a wrong judged name — the line that says the right one
  t.done=true; t.first=!Object.keys(t.wrong).length;
  if(!t.back&&t.act==="find"&&st.grid.filter(p=>!st.sunk[p]).length<=1){ t.nolog=true; st.of=Math.max(0,st.of-1); }   // ⚖️ GAMEJUDGE: one tile left — a forced find, not a first shot
  else if(!t.back&&t.first) st.first++;
  st.sunk[t.pid]=1;
  if(!t.first&&!t.back&&!st.returned[t.pid]){ st.returned[t.pid]=1; st.turns.push({pid:t.pid,act:"find",done:false,first:false,wrong:{},back:true}); }   // a miss comes back once, as a find
  if(miss){ try{ matchBonk(); }catch(e){} st.msg=miss; _shipSay(st,miss); }   // ⚖️ GAMEJUDGE: the right name, after the kid's answer
  else { try{ matchDing(); }catch(e){} st.msg="\u{1F4A5} Hit!"; _shipSay(st,(spoken?spoken+". ":"")+"Hit!"); }
  st.lock=true; const seq=++st.seq;
  _mastRe();
  setTimeout(()=>{ if(shipState===st&&st.lock&&st.seq===seq) shipNext(st); },miss?SHIP_BEAT*2:SHIP_BEAT);
}
function shipNext(st){
  st=st||shipState; if(!st||st!==shipState) return;
  st.lock=false; st.i++;
  if(st.i>=st.turns.length){ shipFinish(st); _mastRe(); return; }
  _shipAsk(st); _mastRe();
}
function shipBestKey(deck){ return deck+" \u{00B7} ship"; }
function shipFinish(st){
  st.phase="done"; st.lock=false; st.say="";
  const kid=st.kid||masteryKid;   // GAMEKID
  try{ if(typeof gameLogRound==="function") gameLogRound(st); }catch(e){}   // 🎮 GAMELOG: every shot's result, game:"ship"
  const s=masteryData[kid+"_settings"]||(masteryData[kid+"_settings"]={});
  if(!s.match_best) s.match_best={};
  const key=shipBestKey(st.deck), prev=s.match_best[key];
  st.prevBest=prev==null?null:prev;
  st.isPB=st.first>0&&(prev==null||st.first>prev);
  if(st.isPB){
    s.match_best[key]=st.first;
    if(db&&!_dryRun()) db.ref("mastery/"+kid+"_settings/match_best").update({[(typeof haKey==="function"?haKey(key):key)]:st.first});   // this key only
    try{HA_LS.setItem("ha_mastery",JSON.stringify(masteryData));}catch(e){}
  }
  try{ if(st.of>0&&st.first===st.of&&typeof _showCelebration==="function"&&document.getElementById("celeb-overlay")) _showCelebration(kid,"\u{1F6A2} You sank them all!",{noSong:true}); }catch(e){}
}
// GAMEKID → 🎲 GAMEKIT resume: a beat that was mid-way when the kid switched settles here; back to a round: hear the ask again
function shipResume(){
  const st=shipState; if(!st||st.phase==="done") return;
  if(st.lock){ st.lock=false; st.i++; if(st.i>=st.turns.length){ shipFinish(st); return; } _shipAsk(st); return; }
  if(st.say&&(typeof mastView==="undefined"||mastView==="ship")) try{ mastSpeak(st.say); }catch(e){}
}
const SHIP_CSS='<style>.ship-sea{display:grid;gap:6px;padding:8px;border-radius:18px;background:linear-gradient(180deg,#bae6fd,#7dd3fc);border:3px solid #38bdf8}'+
  '.ship-tile{position:relative;aspect-ratio:1;border-radius:14px;border:3px solid #e0f2fe;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .2s}'+
  '.ship-tile .ship-vis{pointer-events:none;transform:scale(.9)}@media(min-width:560px){.ship-tile .ship-vis{transform:scale(1.25)}}'+
  '.ship-tile .ship-co{position:absolute;left:4px;top:2px;font-size:10px;font-weight:800;color:#0369a1;font-family:\'DM Sans\',sans-serif;pointer-events:none}'+
  '.ship-tile.ship-sunk{opacity:.55}.ship-tile.ship-sunk::after{content:"\\1F4A5";position:absolute;right:2px;bottom:0;font-size:22px}.ship-tile.ship-wrong{opacity:.3;filter:grayscale(1);cursor:default}'+
  '.ship-tile.ship-lit{border-color:#f59e0b;box-shadow:0 0 0 5px #fde68a;transform:scale(1.06);cursor:default}.ship-tile.ship-still{cursor:default}'+
  '.ship-btn{padding:14px 26px;border-radius:999px;border:none;font-size:18px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif;-webkit-tap-highlight-color:transparent}.ship-btn[disabled]{opacity:.45;cursor:default}</style>';
function buildShipHtml(color){
  const q=s=>String(s).replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,"&quot;");
  let h=SHIP_CSS+'<div style="padding:4px 14px 24px;max-width:720px;margin:0 auto">';
  const items=_shipItems(), decks=shipDecks(items);
  if(!decks.length){ h+='<div class="mast-none">No decks ready for Battleship yet \u{2014} it needs '+SHIP_MIN+' or more cards with a picture.</div></div>'; return h; }
  const st=shipState;
  const chip=(dk,lbl)=>{ const sel=st&&st.deck===dk; return '<button onclick="shipStart(\''+q(dk)+'\')" style="padding:10px 16px;border-radius:999px;font-size:14px;font-weight:800;border:2px solid '+(sel?color:'#e2ddd6')+';background:'+(sel?color:'#fff')+';color:'+(sel?'#fff':'#57534e')+';cursor:pointer;font-family:\'DM Sans\',sans-serif">'+lbl+'</button>'; };
  if(!st||st.phase==="done"){
    h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 14px">';
    decks.forEach(dk=>{ h+=chip(dk,esc(dk)); });
    if(decks.length>1) h+=chip(WHICH_MIX,"\u{1F3B2} "+WHICH_MIX);
    h+='</div>';
  }
  if(!st){ h+='<div style="font-size:15px;font-weight:700;color:#57534e">\u{1F6A2} Pick a deck. Listen, then fire at the picture you hear \u{2014} or name what\u2019s at the square I call!</div></div>'; return h; }
  const s=masteryData[st.kid+"_settings"]||{}, best=(s.match_best||{})[shipBestKey(st.deck)];
  if(st.phase==="done"){
    h+='<div style="margin-top:6px;text-align:center;padding:16px;border-radius:18px;background:'+(st.isPB?'#f0fdf4':'#f8f7f4')+';border:2px solid '+(st.isPB?'#16a34a':'#e2ddd6')+'">';
    h+='<div style="font-family:\'Fraunces\',serif;font-size:22px;font-weight:800">\u{1F389} You sank them all!</div>';
    h+='<div style="font-size:17px;font-weight:800;color:#57534e;margin-top:10px">\u{1F6A2} '+st.first+' of '+st.of+' on the first shot'+(st.isPB?' \u{2014} \u{1F3C6} new best!':(st.prevBest!=null?' \u{00B7} best '+st.prevBest:''))+'</div>';
    h+='<div style="display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap">';
    h+='<button onclick="shipStart(\''+q(st.deck)+'\')" class="ship-btn" style="background:'+color+';color:#fff;font-size:15px">\u{1F501} Play again</button>';
    if(decks.length>1&&!st.mix) h+='<button onclick="shipStart(\''+q(WHICH_MIX)+'\')" class="ship-btn" style="border:2px solid '+color+';background:#fff;color:'+color+';font-size:15px">\u{1F3B2} '+WHICH_MIX+'</button>';
    return h+'</div></div></div>';
  }
  const t=st.turns[st.i], find=!!(t&&t.act==="find"), lock=st.lock;
  if(typeof gameCardShown==="function") gameCardShown(t);   // ⏱ CARDSECS: the card is on screen — its clock starts at the first paint
  h+='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0 4px"><div style="display:flex;gap:6px;flex-wrap:wrap">';
  st.turns.forEach((x,ix)=>{ const cur=ix===st.i; h+='<span style="width:14px;height:14px;border-radius:50%;display:inline-block;'+(x.done?'background:'+(x.first?'#16a34a':'#f59e0b'):cur?'background:#fff;border:3px solid '+color:'background:#e7e5e4')+'"></span>'; });
  h+='</div><span style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--muted)">'+esc(st.deck)+(best!=null?' \u{00B7} \u{1F3C6} '+best:'')+
    '<button onclick="shipChangeDeck()" style="padding:6px 12px;border-radius:999px;border:1.5px solid #e2ddd6;background:#fff;color:#57534e;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap;font-family:\'DM Sans\',sans-serif">\u{1F5C2} Change deck</button></span></div>';
  h+='<div style="display:flex;align-items:center;gap:10px;margin:10px 0 12px;padding:12px 14px;border-radius:18px;background:#f0f9ff;border:2px solid #bae6fd"><span style="font-size:28px;line-height:1">\u{1F6A2}</span><span style="flex:1;font-size:17px;font-weight:800;color:#0c4a6e">'+esc(st.msg)+'</span>'+
    (st.say?'<button onclick="shipSayAgain()" aria-label="Hear it again" style="width:56px;height:56px;flex:none;border-radius:50%;border:3px solid '+color+';background:#fff;color:'+color+';font-size:26px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center">\u{1F50A}</button>':'')+'</div>';
  h+='<div class="ship-sea" style="grid-template-columns:repeat('+st.cols+',1fr)">';
  st.grid.forEach((pid,gi)=>{ const it=_shipIt(st,pid), sunk=!!st.sunk[pid], wrong=!!(t&&t.wrong[pid]), lit=!!(t&&!find&&t.pid===pid&&!t.done), can=find&&!lock&&!wrong&&!(sunk&&pid!==t.pid);
    h+='<div class="ship-tile'+(sunk?' ship-sunk':'')+(wrong?' ship-wrong':'')+(lit?' ship-lit':'')+(can?'':' ship-still')+'" role="button" aria-label="'+shipCoord(gi,st.cols)+'"'+(can?' onclick="shipTap('+gi+')"':'')+'><span class="ship-co">'+shipCoord(gi,st.cols)+'</span><span class="ship-vis">'+(_smTileVis(it)||'')+'</span></div>'; });
  h+='</div>';
  if(t&&!find&&t.gj&&typeof gameJudgeHtml==="function") h+='<div style="margin-top:14px">'+gameJudgeHtml(t,color,lock)+'</div>';   // ⚖️ GAMEJUDGE: the choices / the typing box / Mom's ✓ ✗
  else if(t&&!find) h+='<div style="display:flex;justify-content:center;margin-top:14px"><button class="ship-btn" onclick="shipSaid()"'+(lock||t.done?' disabled':'')+' style="background:'+color+';color:#fff">\u{1F5E3} I said it</button></div>';
  return h+'</div>';
}
// SHIP_END
// BEAT_START — ⏱ "Beat my time" (her go 2026-11-03 "work on this and all the other games"; PLAN_practice_games_2026-10-23.md Tier 2 "Beat-my-time
// Matching: current Matching, but only on decks at monthly+ tier; the clock is against her own best" — REC + FLU; plan rule 5: "time only what is
// already ~90% accurate"). Match's face-up board — BEAT_PAIRS word ↔ meaning / picture pairs, tap two to match — with two differences:
//   · ONLY MASTERED CARDS play: a card at the kid's gate tier or above (gate_tier, the Sprint rule, default weekly; mastTierAtLeast). A deck
//     needs BEAT_MIN such cards. A learning card never meets a clock here.
//   · THE CLOCK IS THE GAME: it starts on the first tap, runs big at the top beside the time to beat ("⏱ beat 23.4s"), and the finish is the
//     kid's time against their OWN best for this deck — nobody else's (plan rule 4). A new best gets the small confetti.
// A wrong pair (the soft bonk) marks both cards; when the board is clear the marked pairs come back once on a small UNTIMED board (the clock
// has stopped — plan rule 3), then the finish: the time, and "N of M pairs clean". No lives, no leaderboard, no points.
// Cards: Match's own pair content (_matchPairHtml: a picture, else the definition / answer), Match's hidden-card guards, one tile per
// name; this game's grid cell gameDeckOn(kid,"beat",deck). Writes (only these): <kid>_settings/match_best key "<deck> · beat" (seconds,
// lower is better, only when beaten) and the round's gameLog entry (GAMELOG, game:"beat"). NEVER touches the ladder. db && !_dryRun() only.
// Per-kid park / restore / resume through its GAMES_LIST entry (🎲 GAMEKIT): parking pauses the clock, resume picks it up.
let beatState=null;   // {kid,deck,game:"beat",t0,pairs:[pid],tiles:[{pid,html,isPrompt,matched,miss}],sel,lock,seq,startTs,endTs,pausedAt,pausedTotal,missed:{pid:1},phase:"play"|"back"|"done",turns:[],first,of,sec,isPB,prevBest,gameLogged}
let _beatRandom=Math.random;   // tests seed it
const BEAT_PAIRS=6, BEAT_MIN=4, BEAT_LINGER=650;
function _beatNow(){ return Date.now(); }
function _beatItems(kid){ return (typeof _gamesItems==="function")?_gamesItems(kid||masteryKid):[]; }
function _beatShuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(_beatRandom()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function beatDeckOn(kid,deck){ return (typeof _gdRaw!=="undefined"&&_gdRaw)||typeof gameDeckOn!=="function"||gameDeckOn(kid,"beat",deck); }
function beatGate(kid){ try{ const s=(typeof masteryData!=="undefined"&&masteryData&&masteryData[(kid||masteryKid)+"_settings"])||{}; return s.gate_tier||"weekly"; }catch(e){ return "weekly"; } }
// Match's own door, asked as this kid in word ↔ meaning mode: not a production twin, not a card hidden for the class (ENVTEST / CPCARDSEDIT /
// CPSECTIONS live inside _matchEligible — no hook line of their own here), and with pair content (_matchPairHtml)
function _beatMatchOk(it,kid){
  const kk=masteryKid, pm=(typeof matchPairMode!=="undefined")?matchPairMode:null;
  try{ masteryKid=kid; if(pm!==null) matchPairMode="two"; return (typeof _matchEligible==="function")?!!_matchEligible(it):!!_matchPairHtml(it); }
  finally{ masteryKid=kk; if(pm!==null) matchPairMode=pm; }
}
// A card the clock may meet: in play and mastered (gate tier or above), and through Match's door
function beatEligible(it,kid){
  kid=kid||masteryKid;
  if(!it||it.status!=="active"||!String(it.prompt||"").trim()) return false;
  if(typeof mastTierAtLeast==="function"&&!mastTierAtLeast(it.tier,beatGate(kid))) return false;
  return _beatMatchOk(it,kid);
}
// PURE-ish: the deck's playable pairs, one per name and one per pair face (two cards sharing one rule text would make two identical tiles)
function beatPool(items,deck,kid){
  kid=kid||masteryKid;
  const seenW={}, seenP={}, out=[];
  (items||[]).forEach(it=>{ if(!beatEligible(it,kid)||(deck!==WHICH_MIX&&(it.subject||"Other")!==deck)) return;
    const w=_matchPlain(it.prompt).toLowerCase(), p=_matchPlain(_matchPairHtml(it)).toLowerCase()||("pic:"+it.id); if(seenW[w]||seenP[p]) return; seenW[w]=seenP[p]=1; out.push(it); });
  return out;
}
function beatDecks(items,kid){
  kid=kid||masteryKid;
  const n={}; beatPool(items,WHICH_MIX,kid).forEach(i=>{ const d=i.subject||"Other"; n[d]=(n[d]||0)+1; });
  return Object.keys(n).filter(d=>n[d]>=BEAT_MIN&&beatDeckOn(kid,d)).sort();
}
function _beatTiles(st,pids){
  const tiles=[];
  pids.forEach(pid=>{ const it=_beatItems(st.kid).find(x=>x&&x.id===pid); if(!it) return;
    tiles.push({pid:pid,isPrompt:true,matched:false,miss:false,html:'<span style="font-size:'+((_matchPlain(it.prompt)||"").length<=4?26:15)+'px;font-weight:800;color:#c2410c;pointer-events:none;word-break:break-word">'+(it.prompt||"")+'</span>'});
    tiles.push({pid:pid,isPrompt:false,matched:false,miss:false,html:_matchPairHtml(it)||""}); });
  return _beatShuffle(tiles);
}
function beatStart(deck){
  try{ if(typeof bbAudioUnlock==="function") bbAudioUnlock(); }catch(e){}   // the deck tap unlocks the ding / bonk (iPad)
  const items=_beatItems(), ok=beatDecks(items), pool=beatPool(items,deck).filter(i=>ok.indexOf(i.subject||"Other")>=0);
  if(pool.length<BEAT_MIN||(deck!==WHICH_MIX&&!beatDeckOn(masteryKid,deck))){ beatState=null; _mastRe(); return; }   // 🎮 GAMEGRID: a deck Mom turned off for this game
  const pairs=_beatShuffle(pool.slice()).slice(0,BEAT_PAIRS).map(i=>i.id);
  beatState={kid:masteryKid,deck:deck,game:"beat",t0:_beatNow(),pairs:pairs,tiles:[],sel:-1,lock:false,seq:0,startTs:null,endTs:null,pausedAt:null,pausedTotal:0,missed:{},phase:"play",turns:[],first:0,of:pairs.length,sec:null,isPB:false,prevBest:null};
  beatState.tiles=_beatTiles(beatState,pairs);
  _beatTick(beatState);
  _mastRe();
}
function beatChangeDeck(){ const st=beatState; beatState=null; if(st) st.seq++; _mastRe(); }   // drop the round as it stands: nothing written
function beatElapsed(st){ if(!st||!st.startTs) return 0; const end=st.endTs||_beatNow(); return Math.max(0,end-st.startTs-st.pausedTotal-(st.pausedAt?(end-st.pausedAt):0)); }
// the running clock: a light tick that only touches the clock's text; it stops by itself when the round is over, parked or off screen
function _beatTick(st){
  if(typeof setInterval!=="function"||typeof document==="undefined") return;
  if(st._tick) return;
  st._tick=setInterval(()=>{ if(beatState!==st||st.endTs||st.pausedAt||(typeof mastView!=="undefined"&&mastView!=="beat")){ clearInterval(st._tick); st._tick=null; return; }
    const el=document.getElementById("beat-clock"); if(el) el.textContent=(beatElapsed(st)/1000).toFixed(1)+"s"; },100);
}
function beatTap(ix){
  const st=beatState; if(!st||st.lock||st.phase==="done"||st.pausedAt) return;
  const t=st.tiles[ix]; if(!t||t.matched||ix===st.sel) return;
  if(st.phase==="play"&&!st.startTs){ st.startTs=_beatNow(); _beatTick(st); }   // the clock starts on the first tap — studying the board is free
  if(st.sel<0){ st.sel=ix; _mastRe(); return; }
  const a=st.tiles[st.sel];
  if(a.pid===t.pid){
    a.matched=t.matched=true; st.sel=-1; try{ matchDing(); }catch(e){}
    if(st.tiles.every(x=>x.matched)) _beatBoardDone(st);
    _mastRe(); return;
  }
  a.miss=t.miss=true; st.lock=true;
  if(st.phase==="play"){ st.missed[a.pid]=1; st.missed[t.pid]=1; } else { st.backMiss[a.pid]=1; st.backMiss[t.pid]=1; }
  try{ matchBonk(); }catch(e){}
  _mastRe();
  const seq=++st.seq; setTimeout(()=>{ if(beatState===st&&st.seq===seq){ a.miss=t.miss=false; st.sel=-1; st.lock=false; _mastRe(); } },BEAT_LINGER);
}
// the board is clear: stop the clock; the marked pairs come back once, untimed (a lone pair brings one clean pair along so there is still a choice)
function _beatBoardDone(st){
  if(st.phase==="play"){
    st.endTs=_beatNow(); st.sec=Math.round(beatElapsed(st)/100)/10;
    st.pairs.forEach(pid=>{ st.turns.push({pid:pid,done:true,first:!st.missed[pid],wrong:st.missed[pid]?{pair:1}:{},back:false}); });
    st.first=st.pairs.filter(p=>!st.missed[p]).length;
    const back=st.pairs.filter(p=>st.missed[p]);
    if(!back.length) return beatFinish(st);
    if(back.length===1){ const extra=st.pairs.find(p=>!st.missed[p]); if(extra) back.push(extra); }
    st.phase="back"; st.backPairs=back; st.backMiss={}; st.sel=-1; st.tiles=_beatTiles(st,back);
    return;
  }
  st.backPairs.forEach(pid=>{ if(st.missed[pid]) st.turns.push({pid:pid,done:true,first:!st.backMiss[pid],wrong:st.backMiss[pid]?{pair:1}:{},back:true}); });
  beatFinish(st);
}
function beatBestKey(deck){ return deck+" \u{00B7} beat"; }
function beatFinish(st){
  st.phase="done"; st.lock=false;
  const kid=st.kid||masteryKid;   // GAMEKID
  try{ if(typeof gameLogRound==="function") gameLogRound(st); }catch(e){}   // 🎮 GAMELOG: each pair clean or not, game:"beat"
  const s=masteryData[kid+"_settings"]||(masteryData[kid+"_settings"]={});
  if(!s.match_best) s.match_best={};
  const key=beatBestKey(st.deck), prev=s.match_best[key];
  st.prevBest=prev==null?null:prev;
  st.isPB=st.sec!=null&&st.sec>0&&(prev==null||st.sec<prev);   // seconds: lower is better
  if(st.isPB){
    s.match_best[key]=st.sec;
    if(db&&!_dryRun()) db.ref("mastery/"+kid+"_settings/match_best").update({[(typeof haKey==="function"?haKey(key):key)]:st.sec});   // this key only
    try{HA_LS.setItem("ha_mastery",JSON.stringify(masteryData));}catch(e){}
  }
  try{ if(st.isPB&&typeof _showCelebration==="function"&&document.getElementById("celeb-overlay")) _showCelebration(kid,"\u23F1 "+st.deck+" \u2014 new best!",{noSong:true}); }catch(e){}
}
// GAMEKID → 🎲 GAMEKIT: parking pauses the clock; resume picks it up where it left off
function beatPark(){ const st=beatState; if(st&&st.startTs&&!st.endTs&&!st.pausedAt) st.pausedAt=_beatNow(); return st; }
function beatResume(){ const st=beatState; if(!st||st.phase==="done") return; if(st.pausedAt){ st.pausedTotal+=_beatNow()-st.pausedAt; st.pausedAt=null; } if(st.lock){ st.lock=false; st.sel=-1; st.tiles.forEach(x=>{ x.miss=false; }); } _beatTick(st); }
const BEAT_CSS='<style>.beat-tile{aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:16px;border:3px solid #e2ddd6;background:#fff;cursor:pointer;overflow:hidden;padding:6px;text-align:center;-webkit-tap-highlight-color:transparent;transition:transform .15s}'+
  '.beat-tile.beat-sel{border-color:#7c3aed;background:#f5f3ff;transform:scale(1.04)}.beat-tile.beat-miss{border-color:#dc2626;background:#fef2f2}.beat-tile.beat-done{opacity:0;pointer-events:none;transform:scale(.6)}</style>';
function buildBeatHtml(color){
  const q=s=>String(s).replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,"&quot;");
  let h=BEAT_CSS+'<div style="padding:4px 14px 24px;max-width:720px;margin:0 auto">';
  const items=_beatItems(), decks=beatDecks(items);
  if(!decks.length){ h+='<div class="mast-none">No decks ready for Beat my time yet \u{2014} it plays cards that have reached the gate level (the Sprint rule), '+BEAT_MIN+' or more in a deck.</div></div>'; return h; }
  const st=beatState;
  const chip=(dk,lbl)=>{ const sel=st&&st.deck===dk; return '<button onclick="beatStart(\''+q(dk)+'\')" style="padding:10px 16px;border-radius:999px;font-size:14px;font-weight:800;border:2px solid '+(sel?color:'#e2ddd6')+';background:'+(sel?color:'#fff')+';color:'+(sel?'#fff':'#57534e')+';cursor:pointer;font-family:\'DM Sans\',sans-serif">'+lbl+'</button>'; };
  if(!st||st.phase==="done"){
    h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 14px">';
    decks.forEach(dk=>{ h+=chip(dk,esc(dk)); });
    if(decks.length>1) h+=chip(WHICH_MIX,"\u{1F3B2} "+WHICH_MIX);
    h+='</div>';
  }
  if(!st){ h+='<div style="font-size:15px;font-weight:700;color:#57534e">\u23F1 Pick a deck. Match the pairs as fast as you can \u2014 the clock starts on your first tap. Beat your own best!</div></div>'; return h; }
  const s=masteryData[st.kid+"_settings"]||{}, best=(s.match_best||{})[beatBestKey(st.deck)];
  if(st.phase==="done"){
    h+='<div style="margin-top:6px;text-align:center;padding:16px;border-radius:18px;background:'+(st.isPB?'#f0fdf4':'#f8f7f4')+';border:2px solid '+(st.isPB?'#16a34a':'#e2ddd6')+'">';
    h+='<div style="font-family:\'Fraunces\',serif;font-size:22px;font-weight:800">'+(st.isPB?'\u{1F3C6} New best \u2014 '+st.sec+'s!':'\u23F1 '+st.sec+'s'+(st.prevBest!=null?' \u00B7 best '+st.prevBest+'s':''))+'</div>';
    h+='<div style="font-size:17px;font-weight:800;color:#57534e;margin-top:10px">'+st.first+' of '+st.of+' pairs clean</div>';
    h+='<div style="display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap">';
    h+='<button onclick="beatStart(\''+q(st.deck)+'\')" style="padding:12px 24px;border-radius:999px;border:none;background:'+color+';color:#fff;font-size:15px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif">\u{1F501} Try to beat it</button>';
    if(decks.length>1&&st.deck!==WHICH_MIX) h+='<button onclick="beatStart(\''+q(WHICH_MIX)+'\')" style="padding:12px 24px;border-radius:999px;border:2px solid '+color+';background:#fff;color:'+color+';font-size:15px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif">\u{1F3B2} '+WHICH_MIX+'</button>';
    return h+'</div></div></div>';
  }
  const timed=st.phase==="play";
  h+='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0 10px;flex-wrap:wrap">';
  h+='<span style="display:flex;align-items:baseline;gap:10px"><span id="beat-clock" style="font-family:\'DM Mono\',monospace;font-size:30px;font-weight:800;color:'+(timed?color:'#a8a29e')+'">'+(beatElapsed(st)/1000).toFixed(1)+'s</span>'+(timed?(best!=null?'<span style="font-size:13px;font-weight:800;color:var(--muted)">\u23F1 beat '+best+'s</span>':'<span style="font-size:13px;font-weight:800;color:var(--muted)">first time \u2014 set your best!</span>'):'<span style="font-size:13px;font-weight:800;color:#b45309">clock stopped \u2014 one more look at these</span>')+'</span>';
  h+='<span style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--muted)">'+esc(st.deck)+'<button onclick="beatChangeDeck()" style="padding:6px 12px;border-radius:999px;border:1.5px solid #e2ddd6;background:#fff;color:#57534e;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap;font-family:\'DM Sans\',sans-serif">\u{1F5C2} Change deck</button></span></div>';
  const cols=st.tiles.length<=8?2:st.tiles.length<=12?3:4;
  h+='<div style="display:grid;grid-template-columns:repeat('+cols+',1fr);gap:10px">';
  st.tiles.forEach((t,ix)=>{ h+='<div class="beat-tile'+(t.matched?' beat-done':'')+(ix===st.sel?' beat-sel':'')+(t.miss?' beat-miss':'')+'" role="button" aria-label="Tile '+(ix+1)+'"'+(t.matched||st.lock?'':' onclick="beatTap('+ix+')"')+'>'+t.html+'</div>'; });
  return h+'</div></div>';
}
// BEAT_END
// TRUENOT_START — ✅ "True / Not true" (the hub's "build four games" 2026-11-03; PLAN_practice_games_2026-10-23.md Tier 2 "True / Not true
// swipe: card flies by ('8 is more than 10'), swipe ✓ or ✗" — REC + speed, "only on mastered"). A statement comes up: a card's front with a
// claim about it — its own back ("7+8 · 15", "geo · earth") or one of its deck's OTHER backs ("7+8 · 12": a plausible lure, plan rule 2).
// For a picture / letter card the claim is a NAME, said and never written (Which one?'s rule — a pre-reader hears it; a written name
// would be matched letter for letter). The kid swipes the card right = ✓ True, left = ✗ Not true, or taps the two big buttons.
// Right → the soft ding, the card flies off. Wrong → the soft bonk, "Not that one" — nothing more is told (the app never supplies the
// answer), and the card comes back ONCE at the end as a fresh statement. No clock, no lives, no points, no opponent, no score against the kid.
// ⚖️ TNBOTH (games honesty audit §7 #11, her pick via the hub 2026-11-08: "each card both ways in a round"): exactly half the statements
//   were true and each card was asked once, so always tapping ✓ logged 50% right — a coin flip read as "knew it". Now a round is
//   TN_CARDS cards, each asked TWICE: once true (its own claim) and once not (a same-deck lure), in a shuffled order where a card's two
//   statements are never back to back (tnOrder). The card's `first` (= the log's ok) is true only when BOTH calls were right — blind
//   tapping drops to 1 in 4. One log item per card: the pair's first-asked statement is nolog, the second carries the pair (its n
//   counts both statements' wrong calls). TN_CARDS = half of TN_ROUND, so a round is still TN_ROUND swipes. "N of M" and the best
//   count cards called right both ways. Each statement still gets its own ding / "Not that one", and a miss still comes back once.
// MASTERED ONLY (the plan's "only on mastered" + the Sprint rule): a card plays only at the kid's gate tier or above (gate_tier, default
// weekly) — a learning card must never be shown a false pairing it could remember as true. Cards: Which one?'s own pool (whichPool /
// whichDeckModes read RAW, like Go Fish — a deck turned off for Which one? still plays here), then this game's own grid cell
// gameDeckOn(kid,"truenot",deck); a deck plays with TN_MIN+ gated cards that each have a lure (a different back / name in the deck).
// Writes (only these): <kid>_settings/match_best key "<deck> · truenot" (cards right both ways, only when beaten) and the round's gameLog entry
// (GAMELOG, game:"truenot"). NEVER touches the ladder — no scores, no next_due, no study log. db && !_dryRun() only. Per-kid park /
// restore / resume through its GAMES_LIST entry (🎲 GAMEKIT). A round dropped (Change deck, a kid switch) writes nothing.
let tnState=null;   // {kid,deck,mix,game:"truenot",t0,turns:[{pid,mode,cpid,truth,done,right,first,wrong:{},back,nolog}],i,lock,fly,shake,phase,first,of,isPB,prevBest,returned:{},gameLogged}
let _tnRandom=Math.random;   // tests seed it
const TN_ROUND=10, TN_CARDS=TN_ROUND/2, TN_MIN=4, TN_BEAT=700, TN_BEAT_WRONG=1400, TN_SWIPE=70;
function _tnItems(kid){ return (typeof _gamesItems==="function")?_gamesItems(kid||masteryKid):[]; }
function _tnShuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(_tnRandom()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function _tnRaw(fn){ const had=(typeof _gdRaw!=="undefined")?_gdRaw:null; try{ if(had!==null) _gdRaw=true; return fn(); } finally{ if(had!==null) _gdRaw=had; } }
function tnDeckOn(kid,deck){ return (typeof _gdRaw!=="undefined"&&_gdRaw)||typeof gameDeckOn!=="function"||gameDeckOn(kid,"truenot",deck); }
function tnGate(kid){ try{ const s=(typeof masteryData!=="undefined"&&masteryData&&masteryData[(kid||masteryKid)+"_settings"])||{}; return s.gate_tier||"weekly"; }catch(e){ return "weekly"; } }
// The Sprint rule: only a card at the gate tier or above, and only once it is on the ladder — never a learning card
function tnReady(it,kid){ if(!it||it.status!=="active") return false; return (typeof mastTierAtLeast==="function")?mastTierAtLeast(it.tier,tnGate(kid)):true; }
function _tnWhichPool(items,kid){ return _tnRaw(()=>whichPool(items,WHICH_MIX,kid)); }
function _tnModes(items,kid){ return _tnRaw(()=>whichDeckModes(items,kid)); }
// What a claim is, by the deck's mode: an answer deck claims a BACK; a picture / symbol deck claims a NAME (the front, said)
function _tnName(it,mode){ return mode==="answer"?_whichNorm(_whichBack(it)):String(it&&it.prompt||"").trim().toLowerCase(); }
function _tnClaimText(it,mode){ return mode==="answer"?_whichBack(it):_matchPlain(it&&it.prompt); }
// PURE: the cards of ITS deck whose claim differs from this card's — the lures a false statement can borrow
function tnLures(it,pool,mode){
  const own=_tnName(it,mode), seen={};
  return (pool||[]).filter(x=>{ if(!x||x.id===it.id||x.subject!==it.subject) return false; const n=_tnName(x,mode); if(!n||n===own||seen[n]) return false; seen[n]=1; return true; });
}
// The cards a deck can play: Which one?'s pool, at the gate or above, with a lure beside them
function tnPool(items,deck,kid){
  kid=kid||masteryKid;
  const all=_tnWhichPool(items,kid), modes=_tnModes(items,kid);
  return all.filter(i=>(deck===WHICH_MIX||(i.subject||"Other")===deck)&&tnReady(i,kid)&&tnLures(i,all,modes[i.subject||"Other"]).length>0);
}
function tnDecks(items,kid){
  kid=kid||masteryKid;
  const n={}; tnPool(items,WHICH_MIX,kid).forEach(i=>{ const d=i.subject||"Other"; n[d]=(n[d]||0)+1; });
  return Object.keys(n).filter(d=>n[d]>=TN_MIN&&tnDeckOn(kid,d)).sort();
}
// ⚖️ TNBOTH — PURE: the order of a round of n cards asked both ways → 2n slots [{k: card index, truth}], each card once true and once
// not, shuffled, and a card's two slots never side by side (n ≥ 2). Random tries first; the fallback (every card, then every card
// again in the same order) can never put a card next to itself.
function tnOrder(n){
  const adj=a=>a.some((x,i)=>i>0&&a[i-1]===x);
  let ks=null;
  for(let tries=0;tries<60&&n>=2;tries++){ const a=[]; for(let k=0;k<n;k++) a.push(k,k); _tnShuffle(a); if(!adj(a)){ ks=a; break; } }
  if(!ks){ const p=[]; for(let k=0;k<n;k++) p.push(k); _tnShuffle(p); ks=p.concat(p); }
  const firstTrue=[]; for(let k=0;k<n;k++) firstTrue.push(_tnRandom()<0.5);
  const seen={}; return ks.map(k=>{ const one=!seen[k]; seen[k]=1; return {k:k,truth:one?firstTrue[k]:!firstTrue[k]}; });
}
// One statement: the card, and the card whose claim is shown — itself when true, a lure when not
function _tnTurn(it,pool,mode,truth,back){
  const lures=tnLures(it,pool,mode); if(!truth&&!lures.length) truth=true;
  const c=truth?it:lures[Math.floor(_tnRandom()*lures.length)];
  return {pid:it.id,mode:mode,cpid:c.id,truth:!!truth,done:false,right:false,first:false,wrong:{},back:!!back};
}
// What is said: a picture / letter card's CLAIM (the name — never written); an answer card's FRONT (the claim is written), unless the voice can't say it
function _tnSay(st,t){
  t=t||(st&&st.turns[st.i]); if(!st||!t||(typeof mastView!=="undefined"&&mastView!=="truenot")) return;
  const items=_tnItems(st.kid), it=items.find(x=>x&&x.id===t.pid), c=items.find(x=>x&&x.id===t.cpid);
  if(t.mode==="answer"){ if(it&&it.prompt&&!whichSilent(it)) try{ mastSpeak(_matchPlain(it.prompt)); }catch(e){} }
  else if(c&&c.prompt) try{ mastSpeak(_matchPlain(c.prompt)); }catch(e){}
}
function tnSayAgain(){ const st=tnState; if(st&&st.phase==="play") _tnSay(st); }
function tnStart(deck){
  try{ if(typeof bbAudioUnlock==="function") bbAudioUnlock(); }catch(e){}   // the deck tap unlocks the ding / bonk (iPad)
  const items=_tnItems(), mix=deck===WHICH_MIX, modes=_tnModes(items), ok=tnDecks(items), all=_tnWhichPool(items,masteryKid);
  const pool=tnPool(items,deck).filter(i=>ok.indexOf(i.subject||"Other")>=0);
  if(pool.length<TN_MIN||(!mix&&!tnDeckOn(masteryKid,deck))){ tnState=null; _mastRe(); return; }   // 🎮 GAMEGRID: a deck Mom turned off for this game
  const picks=_tnShuffle(pool.slice()).slice(0,TN_CARDS);   // ⚖️ TNBOTH: TN_CARDS cards, each asked both ways
  const turns=tnOrder(picks.length).map(o=>{ const it=picks[o.k]; return _tnTurn(it,all,modes[it.subject||"Other"],o.truth,false); });
  tnState={kid:masteryKid,deck:deck,mix:mix,game:"truenot",t0:Date.now(),turns:turns,i:0,lock:false,fly:null,shake:false,phase:turns.length?"play":"done",first:0,of:picks.length,isPB:false,prevBest:null,returned:{}};
  _mastRe();
  _tnSay(tnState);   // the first statement, inside the tap
}
function tnChangeDeck(){ tnState=null; _mastRe(); }   // drop the round as it stands: nothing written
// PURE over the state: the kid's call (true = "it belongs together") against the statement → "right" | "wrong" | null (nothing to judge)
// ⚖️ TNBOTH: the card's first is settled on its SECOND statement — right only when both calls were; the first-asked one is nolog.
function tnJudge(st,call){
  const t=st&&st.turns[st.i]; if(!t||t.done||st.lock) return null;
  if(typeof gameCardAnswered==="function") gameCardAnswered(t);   // ⏱ CARDSECS: the first answer on this card stops its clock
  t.done=true; t.right=!!call===t.truth;
  if(!t.right) t.wrong[String(t.cpid)]=1;
  if(t.back){ t.first=t.right; return t.right?"right":"wrong"; }   // a come-back: one statement, never counted
  const mate=st.turns.find(x=>x!==t&&!x.back&&x.pid===t.pid);
  if(mate&&!mate.done){ t.nolog=true; t.first=false; }   // the pair's first half: its call rides on the second
  else {
    if(mate) Object.keys(mate.wrong||{}).forEach(k=>{ t.wrong[k]=1; });   // n = both statements' wrong calls + 1
    t.first=t.right&&(!mate||mate.right);
    if(t.first) st.first++;
  }
  return t.right?"right":"wrong";
}
// ✓ True (call true) / ✗ Not true (call false): the swipe or the button
function tnSwipe(call){
  const st=tnState; if(!st||st.phase!=="play") return;
  const t=st.turns[st.i], r=tnJudge(st,call); if(!r) return;
  if(r==="right"){ try{ matchDing(); }catch(e){} st.fly=call?"right":"left"; }
  else {
    try{ matchBonk(); }catch(e){} st.shake=true;
    // a card missed on its first statement comes back once, at the end, as a fresh statement
    if(!t.back&&!st.returned[t.pid]){ st.returned[t.pid]=1;
      const items=_tnItems(st.kid), it=items.find(x=>x&&x.id===t.pid);
      if(it) st.turns.push(_tnTurn(it,_tnWhichPool(items,st.kid),t.mode,_tnRandom()<0.5,true)); }
  }
  st.lock=true; const at=st.i;
  _mastRe();
  setTimeout(()=>{ if(tnState===st&&st.lock&&st.i===at) tnNext(st); },r==="right"?TN_BEAT:TN_BEAT_WRONG);   // GAMEKID: never advances a parked / settled turn
}
// PURE over the state: step to the next statement; finishes the round at the end
function _tnStep(st){
  st.lock=false; st.fly=null; st.shake=false; st.i++;
  if(st.i>=st.turns.length) tnFinish(st);
}
function tnNext(st){
  st=st||tnState; if(!st||st!==tnState) return;
  _tnStep(st); _mastRe();
  if(st.phase==="play") _tnSay(st);
}
// GAMEKID → 🎲 GAMEKIT resume: a beat that was mid-way when the kid switched settles here (no render; the caller renders)
function tnResume(){
  const st=tnState; if(!st||st.phase!=="play") return;
  if(st.lock) _tnStep(st);
  if(st.phase==="play") _tnSay(st);
}
function tnBestKey(deck){ return deck+" \u{00B7} truenot"; }
function tnFinish(st){
  st.phase="done"; st.lock=false; st.fly=null; st.shake=false;
  const kid=st.kid||masteryKid;   // GAMEKID
  try{ if(typeof gameLogRound==="function") gameLogRound(st); }catch(e){}   // 🎮 GAMELOG: one item per card (ok = both calls right — ⚖️ TNBOTH), game:"truenot"
  const s=masteryData[kid+"_settings"]||(masteryData[kid+"_settings"]={});
  if(!s.match_best) s.match_best={};
  const key=tnBestKey(st.deck), prev=s.match_best[key];
  st.prevBest=prev==null?null:prev;
  st.isPB=st.first>0&&(prev==null||st.first>prev);
  if(st.isPB){
    s.match_best[key]=st.first;
    if(db&&!_dryRun()) db.ref("mastery/"+kid+"_settings/match_best").update({[(typeof haKey==="function"?haKey(key):key)]:st.first});   // this key only
    try{HA_LS.setItem("ha_mastery",JSON.stringify(masteryData));}catch(e){}
  }
  try{ if(st.of>0&&st.first===st.of&&typeof _showCelebration==="function"&&document.getElementById("celeb-overlay")) _showCelebration(kid,"\u{2705} You called them all!",{noSong:true}); }catch(e){}
}
// Drag the card with a finger or the mouse: past TN_SWIPE px right = True, left = Not true; a move under 8px is a tap (hear it again)
function tnDown(ev){
  const st=tnState; if(!st||st.phase!=="play"||st.lock||!ev||ev.button>0) return;
  const el=ev.currentTarget; if(!el) return;
  const x0=ev.clientX, pid=ev.pointerId; let moved=false, dx=0;
  try{ el.setPointerCapture(pid); }catch(e){}
  const move=e=>{ dx=e.clientX-x0; if(!moved&&Math.abs(dx)<8) return; moved=true; el.style.transition="none"; el.style.transform="translateX("+dx+"px) rotate("+(dx/18)+"deg)"; };
  const up=e=>{
    el.removeEventListener("pointermove",move); el.removeEventListener("pointerup",up); el.removeEventListener("pointercancel",up);
    try{ el.releasePointerCapture(pid); }catch(x){}
    el.style.transition=""; el.style.transform="";
    if(!moved){ tnSayAgain(); return; }
    if(e.type==="pointercancel"||Math.abs(dx)<TN_SWIPE) return;
    tnSwipe(dx>0);
  };
  el.addEventListener("pointermove",move); el.addEventListener("pointerup",up); el.addEventListener("pointercancel",up);
}
const TN_CSS='<style>.tn-card{position:relative;max-width:360px;margin:0 auto;min-height:220px;padding:18px 16px;border-radius:24px;border:3px solid #e2ddd6;background:#fff;box-shadow:0 8px 24px rgba(0,0,0,.08);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;cursor:grab;user-select:none;-webkit-user-select:none;touch-action:pan-y;-webkit-tap-highlight-color:transparent;transition:transform .45s ease-in,opacity .4s}'+
  '.tn-card .memoji,.tn-card img,.tn-card svg{pointer-events:none}.tn-card.tn-fly-right{transform:translateX(120vw) rotate(18deg);opacity:0}.tn-card.tn-fly-left{transform:translateX(-120vw) rotate(-18deg);opacity:0}'+
  '.tn-card.tn-shake{animation:tnShake .5s;border-color:#f59e0b;background:#fffbeb}@keyframes tnShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-10px)}40%{transform:translateX(9px)}60%{transform:translateX(-6px)}80%{transform:translateX(4px)}}'+
  '.tn-front{font-family:\'Fraunces\',serif;font-weight:800;color:#292524;text-align:center;line-height:1.1;overflow-wrap:anywhere;pointer-events:none}.tn-vis{pointer-events:none;transform:scale(1.5);margin:14px 0}'+
  '.tn-claim{pointer-events:none;padding:10px 18px;border-radius:14px;background:#f5f3ff;border:2px solid #ddd6fe;font-family:\'Fraunces\',serif;font-weight:800;color:#4c1d95;text-align:center;line-height:1.1;overflow-wrap:anywhere}'+
  '.tn-btn{flex:1;max-width:170px;padding:16px 10px;border-radius:18px;border:3px solid;font-size:18px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif;-webkit-tap-highlight-color:transparent}.tn-btn[disabled]{opacity:.45;cursor:default}'+
  '.tn-no{border-color:#fca5a5;background:#fef2f2;color:#b91c1c}.tn-yes{border-color:#86efac;background:#f0fdf4;color:#15803d}</style>';
function buildTnHtml(color){
  const q=s=>String(s).replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,"&quot;");
  let h=TN_CSS+'<div style="padding:4px 14px 24px;max-width:720px;margin:0 auto">';
  const items=_tnItems(), decks=tnDecks(items);
  if(!decks.length){ h+='<div class="mast-none">No decks ready for True / Not true yet \u{2014} it plays cards that have reached the gate level (the Sprint rule), '+TN_MIN+' or more in a deck.</div></div>'; return h; }
  const st=tnState;
  const chip=(dk,lbl)=>{ const sel=st&&st.deck===dk; return '<button onclick="tnStart(\''+q(dk)+'\')" style="padding:10px 16px;border-radius:999px;font-size:14px;font-weight:800;border:2px solid '+(sel?color:'#e2ddd6')+';background:'+(sel?color:'#fff')+';color:'+(sel?'#fff':'#57534e')+';cursor:pointer;font-family:\'DM Sans\',sans-serif">'+lbl+'</button>'; };
  if(!st||st.phase==="done"){
    h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 14px">';
    decks.forEach(dk=>{ h+=chip(dk,esc(dk)); });
    if(decks.length>1) h+=chip(WHICH_MIX,"\u{1F3B2} "+WHICH_MIX);
    h+='</div>';
  }
  if(!st){ h+='<div style="font-size:15px;font-weight:700;color:#57534e">\u{2705} Pick a deck. A card and a claim come up \u{2014} swipe right if it\u2019s true, left if it\u2019s not!</div></div>'; return h; }
  const s=masteryData[st.kid+"_settings"]||{}, best=(s.match_best||{})[tnBestKey(st.deck)];
  if(st.phase==="play"){
    const t=st.turns[st.i], it=t?items.find(x=>x&&x.id===t.pid):null, c=t?items.find(x=>x&&x.id===t.cpid):null, ans=!!(t&&t.mode==="answer"), mute=ans&&whichSilent(it);
    if(typeof gameCardShown==="function") gameCardShown(t);   // ⏱ CARDSECS: the card is on screen — its clock starts at the first paint
    h+='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0 4px"><div style="display:flex;gap:6px;flex-wrap:wrap">';
    st.turns.forEach((x,ix)=>{ const cur=ix===st.i; h+='<span style="width:14px;height:14px;border-radius:50%;display:inline-block;'+(x.done?'background:'+(x.right?'#16a34a':'#f59e0b'):cur?'background:#fff;border:3px solid '+color:'background:#e7e5e4')+'"></span>'; });   // ⚖️ TNBOTH: a dot per statement, by its own call
    h+='</div><span style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--muted)">'+esc(st.deck)+(best!=null?' \u{00B7} \u{1F3C6} '+best:'')+
      '<button onclick="tnChangeDeck()" style="padding:6px 12px;border-radius:999px;border:1.5px solid #e2ddd6;background:#fff;color:#57534e;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap;font-family:\'DM Sans\',sans-serif">\u{1F5C2} Change deck</button></span></div>';
    h+='<div style="text-align:center;font-size:17px;font-weight:800;color:'+(st.shake?'#b45309':'#57534e')+';margin:10px 0 12px">'+(st.shake?'Not that one.':st.lock?(t.truth?'\u{2705} True!':'\u{274C} Not true!'):(ans?'Do these go together?':'Is this what you hear?'))+'</div>';
    // the card: the front (a picture, a letter, or the written front) and, for an answer deck, the written claim
    h+='<div class="tn-card'+(st.fly==='right'?' tn-fly-right':st.fly==='left'?' tn-fly-left':'')+(st.shake?' tn-shake':'')+'" role="group" aria-label="Statement '+(st.i+1)+'" onpointerdown="tnDown(event)">';
    if(ans){ const fr=_matchPlain(it&&it.prompt), cl=_tnClaimText(c,"answer");
      h+='<div class="tn-front" style="font-size:'+(fr.length<=8?'46px':fr.length<=18?'32px':'22px')+'">'+esc(fr)+'</div>';
      h+='<div style="font-size:12px;font-weight:800;color:#a8a29e;text-transform:uppercase;letter-spacing:.08em;pointer-events:none">is</div>';
      h+='<div class="tn-claim" style="font-size:'+(cl.length<=6?'40px':cl.length<=14?'28px':'20px')+'">'+esc(cl)+'</div>';
    } else h+='<span class="tn-vis">'+(_smTileVis(it)||'')+'</span>';   // the claim is SAID, never written
    h+='</div>';
    h+='<div style="display:flex;justify-content:center;margin:14px 0 6px">'+(mute?'':'<button onclick="tnSayAgain()" aria-label="Hear it again" style="width:64px;height:64px;border-radius:50%;border:3px solid '+color+';background:#fff;color:'+color+';font-size:30px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center">\u{1F50A}</button>')+'</div>';
    h+='<div style="display:flex;gap:12px;justify-content:center;margin-top:6px"><button class="tn-btn tn-no" onclick="tnSwipe(false)"'+(st.lock?' disabled':'')+'>\u{2B05} \u{274C} Not true</button><button class="tn-btn tn-yes" onclick="tnSwipe(true)"'+(st.lock?' disabled':'')+'>\u{2705} True \u{27A1}</button></div>';
    return h+'</div>';
  }
  // Finish: cards called right both ways against the kid's own best, Play again / Mix the decks
  h+='<div style="margin-top:6px;text-align:center;padding:16px;border-radius:18px;background:'+(st.isPB?'#f0fdf4':'#f8f7f4')+';border:2px solid '+(st.isPB?'#16a34a':'#e2ddd6')+'">';
  h+='<div style="font-family:\'Fraunces\',serif;font-size:22px;font-weight:800">\u{1F389} All called!</div>';
  h+='<div style="font-size:17px;font-weight:800;color:#57534e;margin-top:10px">\u{2705} '+st.first+' of '+st.of+' cards right both ways'+(st.isPB?' \u{2014} \u{1F3C6} new best!':(st.prevBest!=null?' \u{00B7} best '+st.prevBest:''))+'</div>';
  h+='<div style="display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap">';
  h+='<button onclick="tnStart(\''+q(st.deck)+'\')" style="padding:12px 24px;border-radius:999px;border:none;background:'+color+';color:#fff;font-size:15px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif">\u{1F501} Play again</button>';
  if(decks.length>1&&!st.mix) h+='<button onclick="tnStart(\''+q(WHICH_MIX)+'\')" style="padding:12px 24px;border-radius:999px;border:2px solid '+color+';background:#fff;color:'+color+';font-size:15px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif">\u{1F3B2} '+WHICH_MIX+'</button>';
  return h+'</div></div></div>';
}
// TRUENOT_END
// SURE_START — 🤔 "Sure? then flip" (the hub's "build four games" 2026-11-03; PLAN_practice_games_2026-10-23.md Tier 3 "Sure? then flip:
// before revealing, tap 👍 sure / 🤷 not sure; a confident miss gets a louder correction + comes back first" — CR + metacognition, the
// hypercorrection effect: an error made with high confidence is the one most likely to be fixed by a clear correction). A card's front
// comes up (a picture, a letter, or the written front of an answer deck). FIRST the kid says how sure they are — 👍 I'm sure / 🤷 Not
// sure — THEN produces the card (Go Fish's three acts: a picture / letter card is said out loud and judged — ⚖️ GAMEJUDGE below, it
// was an honor tap + a self-mark against the flip until 2026-11-08; a number back is typed on the number pad; a word back is picked from three of the deck's
// own backs, one try). THEN the flip: the card's back / name, written and said — the one game here that shows the answer, and only
// AFTER the kid has produced (the app never supplies what the child must produce before they produce it).
//   Right → the soft ding: "You knew it!" (sure) or "You had it after all!" (not sure); a beat, the next card.
//   Wrong and NOT sure → the soft bonk, an amber flip ("Not yet — it's …"), the answer said once; the kid reads it and taps ➡ Got it.
//   Wrong and SURE → the LOUDER correction: the bonk, a big red flip ("You were sure — look closely: …"), the answer said twice; ➡ Got it.
//   When the round's cards are done the misses come back once — the confident misses FIRST, then the unsure ones — through the same
//   sure → produce → flip. The finish: "N of M right the first time" and the honest tally (sure & right, sure & wrong, not sure & right,
//   not sure & wrong). No clock, no lives, no points, no opponent.
// Cards: Which one?'s own pool (whichPool / whichDeckModes read RAW, like Go Fish — a deck turned off for Which one? still plays here),
// then this game's own grid cell gameDeckOn(kid,"sure",deck); a deck needs SURE_MIN+ cards. Writes (only these): <kid>_settings/match_best
// key "<deck> · sure" (first-time rights, only when beaten) and the round's gameLog entry (GAMELOG, game:"sure"). NEVER touches the ladder —
// no scores, no next_due, no study log. db && !_dryRun() only. Per-kid park / restore / resume through its GAMES_LIST entry (🎲 GAMEKIT).
// A round dropped (Change deck, a kid switch) writes nothing.
// ⚖️ GAMEJUDGE (her decision 2026-11-08, from the games audit — the self-mark came AFTER the flip had shown the name): a picture / letter
// card is now judged BEFORE the flip by the kid's ONE setting (say it then pick it / type it / Mom judges) — _sureJudgeOpen / _sureJudged
// below; the 👍 / 🤷 call stays first, the flip is the confirm (right → the name shown and said; wrong → the same corrections as a typed
// or picked miss), and the ✅ I had it / ❌ Not quite self-mark is gone. The honor tap only when the deck has no other name: then 🗣 is
// counted right and the flip shows the name. Rounds are stamped (st.judge → gameLog judge).
let sureState=null;   // {kid,deck,mix,game:"sure",t0,turns:[{pid,act,mode,step:"sure"|"produce"|"flip",sure,ok,done,first,wrong:{},back,fail,opts?,typed?}],i,lock,seq,phase,first,of,isPB,prevBest,returned:{},tally:{sr,sw,nr,nw},gameLogged}
let _sureRandom=Math.random;   // tests seed it
const SURE_ROUND=8, SURE_MIN=3, SURE_BEAT=900;
const SURE_NUM=/^[-+]?\d+([.,]\d+)?$/;
function _sureItems(kid){ return (typeof _gamesItems==="function")?_gamesItems(kid||masteryKid):[]; }
function _sureShuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(_sureRandom()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function _sureRaw(fn){ const had=(typeof _gdRaw!=="undefined")?_gdRaw:null; try{ if(had!==null) _gdRaw=true; return fn(); } finally{ if(had!==null) _gdRaw=had; } }
function sureDeckOn(kid,deck){ return (typeof _gdRaw!=="undefined"&&_gdRaw)||typeof gameDeckOn!=="function"||gameDeckOn(kid,"sure",deck); }
function _sureWhichPool(items,kid){ return _sureRaw(()=>whichPool(items,WHICH_MIX,kid)); }
function _sureModes(items,kid){ return _sureRaw(()=>whichDeckModes(items,kid)); }
function _sureIt(st,pid){ return _sureItems(st.kid).find(x=>x&&x.id===pid)||null; }
function sureName(it){ return _matchPlain(it&&it.prompt); }
// The decks that can play: Which one?'s playable decks with SURE_MIN+ cards in play, and this game's cell on
function sureDecks(items,kid){
  kid=kid||masteryKid;
  const n={}; _sureWhichPool(items,kid).forEach(i=>{ const d=i.subject||"Other"; n[d]=(n[d]||0)+1; });
  return Object.keys(n).filter(d=>n[d]>=SURE_MIN&&sureDeckOn(kid,d)).sort();
}
function surePool(items,deck,kid){ kid=kid||masteryKid; const ok=sureDecks(items,kid); return _sureWhichPool(items,kid).filter(i=>ok.indexOf(i.subject||"Other")>=0&&(deck===WHICH_MIX||(i.subject||"Other")===deck)); }
// What the kid DOES with a card (Go Fish's rule): "say" (picture / symbol), "type" (a number back), "pick" (a word back)
function sureKind(it,mode){ if(mode!=="answer") return "say"; return SURE_NUM.test(String(_whichBack(it)).trim())?"type":"pick"; }
// The flip: what the kid had to produce — a picture / letter card's NAME, an answer card's BACK
function sureAnswer(it,act){ return act==="say"?sureName(it):_whichBack(it); }
// Three backs for a pick: the card's own + two different backs from its deck (Which one?'s rule), shuffled
function _sureLures(st,pid){
  const it=_sureIt(st,pid); if(!it) return [];
  const own=_whichBack(it), seen={}; seen[_whichNorm(own)]=1;
  const more=_sureShuffle(_sureWhichPool(_sureItems(st.kid),st.kid).filter(x=>x.id!==pid&&(x.subject||"Other")===(it.subject||"Other"))).map(x=>_whichBack(x)).filter(b=>b&&!seen[_whichNorm(b)]&&(seen[_whichNorm(b)]=1)).slice(0,2);
  return _sureShuffle([own].concat(more));
}
function _sureTurn(it,mode,back){ return {pid:it.id,act:sureKind(it,mode),mode:mode,step:"sure",sure:null,ok:null,done:false,first:false,wrong:{},back:!!back,fail:false}; }
// What is said when a card comes up: an answer deck's FRONT (unless the voice can't say it); a picture / letter card is shown only — its name is what the kid must produce
function _sureSay(st,t){
  t=t||(st&&st.turns[st.i]); if(!st||!t||(typeof mastView!=="undefined"&&mastView!=="sure")) return;
  const it=_sureIt(st,t.pid); if(!it) return;
  if(t.step==="flip"){ const ans=sureAnswer(it,t.act); try{ mastSpeak(t.ok===false&&t.sure?ans+". "+ans+".":ans); }catch(e){} return; }   // the flip: the answer, twice after a confident miss
  if(t.mode==="answer"&&!whichSilent(it)) try{ mastSpeak(sureName(it)); }catch(e){}
}
function sureSayAgain(){ const st=sureState; if(st&&st.phase==="play") _sureSay(st); }
function sureStart(deck){
  try{ if(typeof bbAudioUnlock==="function") bbAudioUnlock(); }catch(e){}   // the deck tap unlocks the ding / bonk (iPad)
  const items=_sureItems(), mix=deck===WHICH_MIX, modes=_sureModes(items);
  const pool=surePool(items,deck);
  if(pool.length<SURE_MIN||(!mix&&!sureDeckOn(masteryKid,deck))){ sureState=null; _mastRe(); return; }   // 🎮 GAMEGRID: a deck Mom turned off for this game
  const turns=_sureShuffle(pool.slice()).slice(0,SURE_ROUND).map(it=>_sureTurn(it,modes[it.subject||"Other"],false));
  sureState={kid:masteryKid,deck:deck,mix:mix,game:"sure",t0:Date.now(),turns:turns,i:0,lock:false,seq:0,phase:turns.length?"play":"done",first:0,of:turns.length,isPB:false,prevBest:null,returned:{},tally:{sr:0,sw:0,nr:0,nw:0}};
  if(typeof gameJudgeMode==="function"){ sureState.judge=gameJudgeMode(masteryKid); sureState.nch=gameJudgeChoices(masteryKid); }   // ⚖️ GAMEJUDGE: the kid's setting, read once a round (stamps the log)
  _mastRe();
  _sureSay(sureState);
}
function sureChangeDeck(){ sureState=null; _mastRe(); }   // drop the round as it stands: nothing written
function _sureOpen(st,step){ const t=st&&st.turns[st.i]; return (st&&st.phase==="play"&&!st.lock&&t&&!t.done&&t.step===step)?t:null; }
// 👍 I'm sure (true) / 🤷 Not sure (false): the confidence call, BEFORE the card is produced
function sureCall(sure){
  const st=sureState, t=_sureOpen(st,"sure"); if(!t) return;
  t.sure=!!sure; t.step="produce";
  if(t.act==="pick") t.opts=_sureLures(st,t.pid);
  if(t.act==="type") t.typed="";
  if(st.judge) _sureJudgeOpen(st,t);   // ⚖️ GAMEJUDGE: a say card is judged (pick / type / Mom) BEFORE the flip
  _mastRe();
}
function sureSaid(){   // 🗣 "I said it" — judged now (GAMEJUDGE); the honor system only when there is no other name to pick from
  const st=sureState, t=_sureOpen(st,"produce"); if(!t||t.act!=="say") return;
  if(typeof gameCardAnswered==="function") gameCardAnswered(t);   // ⏱ CARDSECS: the first answer on this card stops its clock
  if(t.gj){ gameJudgeSaid(); return; }   // ⚖️ GAMEJUDGE: "I said it" opens the choices (pick); type / Mom have their own taps
  _sureJudged(st,t,true);   // the honor tap: counted right, the flip shows and says the name
}
// ⚖️ GAMEJUDGE: a say card goes to the shared judge before the flip; the verdict settles it the way a typed / picked answer does
function _sureJudgeOpen(st,t){
  if(!st.judge||t.act!=="say"||typeof gameJudgeAct!=="function") return;
  const it=_sureIt(st,t.pid); if(!it) return;
  const deck=it.subject||"Other", names=_sureWhichPool(_sureItems(st.kid),st.kid).filter(x=>x&&x.id!==it.id&&(x.subject||"Other")===deck).map(x=>sureName(x));
  if(gameJudgeAct(st,t,{kid:st.kid,deck:deck,right:sureName(it),names:names,mode:st.judge,n:st.nch,shuffle:_sureShuffle,
    live:()=>sureState===st&&_sureOpen(st,"produce")===t, line:s=>{ t.gjLine=s; },
    onRight:x=>_sureJudged(st,x,true), onWrong:(x,g)=>_sureJudged(st,x,false,g)})) t.judge=st.judge;   // false (no other name) → the honor tap
}
function _sureJudged(st,t,right,given){
  if(!right&&given!=null&&String(given)!==""&&t.judge!=="mom") t.picked=String(given);   // the flip shows what the kid answered, struck through
  _sureAfter(st,t,sureJudge(st,t,!!right));
  if(right) _sureSay(st,t);   // the flip says the name: the confirm (a miss is said by _sureAfter)
}
function sureKey(ch){   // the number pad
  const st=sureState, t=_sureOpen(st,"produce"); if(!t||t.act!=="type") return;
  if(ch==="back") t.typed=t.typed.slice(0,-1); else if(t.typed.length<6) t.typed+=ch;
  _mastRe();
}
function _sureAnsOk(act,given,back){ if(act==="pick") return String(given)===String(back); return (typeof mstTypeAnsOk==="function")?mstTypeAnsOk(given,back):Number(String(given).replace(",","."))===Number(String(back).replace(",",".")); }
// PURE over the state: the produced answer (typed, picked, or a said card's judge) settles the turn → "right" | "wrong"
function sureJudge(st,t,okNow){
  if(typeof gameCardAnswered==="function") gameCardAnswered(t);   // ⏱ CARDSECS: the first answer on this card stops its clock
  t.ok=!!okNow; t.done=true; t.step="flip";
  if(t.ok){ t.first=true; if(!t.back) st.first++; }
  else { t.first=false; t.fail=true; t.wrong[t.sure?"sure":"unsure"]=1; }
  if(!t.back){ const k=(t.sure?"s":"n")+(t.ok?"r":"w"); st.tally[k]=(st.tally[k]||0)+1; }
  return t.ok?"right":"wrong";
}
function sureCheck(){
  const st=sureState, t=_sureOpen(st,"produce"); if(!t||t.act!=="type"||!t.typed) return;
  _sureAfter(st,t,sureJudge(st,t,_sureAnsOk("type",t.typed,_whichBack(_sureIt(st,t.pid)))));
}
function surePickTap(i){
  const st=sureState, t=_sureOpen(st,"produce"); if(!t||t.act!=="pick"||!t.opts||t.opts[i]==null) return;
  t.picked=t.opts[i];
  _sureAfter(st,t,sureJudge(st,t,_sureAnsOk("pick",t.opts[i],_whichBack(_sureIt(st,t.pid)))));
}
// After the judgement: right → the ding and a beat; wrong → the bonk (louder after a confident miss: the answer said twice) and the kid taps ➡ Got it
function _sureAfter(st,t,r){
  if(r==="right"){ try{ matchDing(); }catch(e){} st.lock=true; const seq=++st.seq; _mastRe(); if(t.act!=="say") _sureSay(st,t);
    setTimeout(()=>{ if(sureState===st&&st.lock&&st.seq===seq) sureNext(st); },SURE_BEAT); return; }   // GAMEKID: never advances a parked / settled turn
  try{ matchBonk(); }catch(e){}
  // a card missed on its first look comes back once: a confident miss goes to the FRONT of the come-backs, an unsure one to the back
  if(!t.back&&!st.returned[t.pid]){ st.returned[t.pid]=1; const it=_sureIt(st,t.pid);
    if(it){ const nt=_sureTurn(it,t.mode,true); let at=st.turns.length; if(t.sure){ nt.sureFirst=true; const j=st.turns.findIndex((x,ix)=>ix>st.i&&x.back&&!x.sureFirst); if(j>=0) at=j; } st.turns.splice(at,0,nt); } }
  _mastRe(); _sureSay(st,t);
}
function sureGotIt(){   // ➡ after a wrong flip
  const st=sureState, t=st&&st.turns[st.i]; if(!st||st.phase!=="play"||st.lock||!t||!t.done||t.ok!==false) return;
  sureNext(st);
}
function sureNext(st){
  st=st||sureState; if(!st||st!==sureState) return;
  st.lock=false; st.i++;
  if(st.i>=st.turns.length){ sureFinish(st); _mastRe(); return; }
  _mastRe(); _sureSay(st);
}
function sureBestKey(deck){ return deck+" \u{00B7} sure"; }
function sureFinish(st){
  st.phase="done"; st.lock=false;
  const kid=st.kid||masteryKid;   // GAMEKID
  try{ if(typeof gameLogRound==="function") gameLogRound(st); }catch(e){}   // 🎮 GAMELOG: every card's first-time result, game:"sure"
  const s=masteryData[kid+"_settings"]||(masteryData[kid+"_settings"]={});
  if(!s.match_best) s.match_best={};
  const key=sureBestKey(st.deck), prev=s.match_best[key];
  st.prevBest=prev==null?null:prev;
  st.isPB=st.first>0&&(prev==null||st.first>prev);
  if(st.isPB){
    s.match_best[key]=st.first;
    if(db&&!_dryRun()) db.ref("mastery/"+kid+"_settings/match_best").update({[(typeof haKey==="function"?haKey(key):key)]:st.first});   // this key only
    try{HA_LS.setItem("ha_mastery",JSON.stringify(masteryData));}catch(e){}
  }
  try{ if(st.of>0&&st.first===st.of&&typeof _showCelebration==="function"&&document.getElementById("celeb-overlay")) _showCelebration(kid,"\u{1F914} You knew them all!",{noSong:true}); }catch(e){}
}
// GAMEKID → 🎲 GAMEKIT resume: a beat that was mid-way when the kid switched settles here (no render; the caller renders)
function sureResume(){
  const st=sureState; if(!st||st.phase!=="play") return;
  if(st.lock){ st.lock=false; st.i++; if(st.i>=st.turns.length){ sureFinish(st); return; } }
  _sureSay(st);
}
const SURE_CSS='<style>.sure-card{width:200px;min-height:150px;border-radius:18px;border:3px solid #a78bfa;background:#f5f3ff;display:flex;align-items:center;justify-content:center;overflow:hidden;margin:0 auto;padding:8px;box-sizing:border-box}.sure-card .sure-vis{pointer-events:none;transform:scale(1.5)}'+
  '.sure-card .sure-txt{pointer-events:none;font-family:\'Fraunces\',serif;font-weight:800;line-height:1.1;color:#292524;text-align:center;overflow-wrap:anywhere}'+
  '.sure-flip{max-width:360px;margin:12px auto 0;padding:14px 16px;border-radius:18px;border:3px solid;text-align:center;font-family:\'Fraunces\',serif;font-weight:800;line-height:1.15;overflow-wrap:anywhere}'+
  '.sure-flip.sure-ok{border-color:#16a34a;background:#f0fdf4;color:#15803d}.sure-flip.sure-soft{border-color:#f59e0b;background:#fffbeb;color:#b45309}.sure-flip.sure-loud{border-color:#dc2626;background:#fef2f2;color:#b91c1c;box-shadow:0 0 0 6px #fecaca;animation:sureLoud .6s}'+
  '@keyframes sureLoud{0%,100%{transform:scale(1)}30%{transform:scale(1.06)}60%{transform:scale(.98)}}'+
  '.sure-btn{padding:14px 22px;border-radius:999px;border:none;font-size:17px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif;-webkit-tap-highlight-color:transparent}.sure-btn[disabled],.sure-key[disabled],.sure-opt[disabled]{opacity:.45;cursor:default}'+
  '.sure-conf{flex:1;max-width:190px;padding:16px 10px;border-radius:18px;border:3px solid #e2ddd6;background:#fff;color:#292524;font-size:17px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif;-webkit-tap-highlight-color:transparent}'+
  '.sure-key{width:64px;height:56px;border-radius:14px;border:2px solid #e2ddd6;background:#fff;font-family:\'Fraunces\',serif;font-size:26px;font-weight:800;color:#292524;cursor:pointer}'+
  '.sure-opt{min-width:96px;padding:14px 18px;border-radius:16px;border:3px solid #e2ddd6;background:#fff;font-family:\'Fraunces\',serif;font-size:24px;font-weight:800;color:#292524;cursor:pointer;overflow-wrap:anywhere}.sure-opt.sure-wrong{opacity:.28;filter:grayscale(1)}</style>';
function _sureCardVis(st,t){
  const it=_sureIt(st,t.pid); if(!it) return '';
  if(t.act==="say"){ const v=_smTileVis(it); if(v) return '<span class="sure-vis">'+v+'</span>'; }
  const fr=sureName(it);
  return '<span class="sure-txt" style="font-size:'+(fr.length<=8?'38px':fr.length<=18?'28px':'20px')+'">'+esc(fr)+'</span>';   // an answer card shows its FRONT (the kid produces the back)
}
function buildSureHtml(color){
  const q=s=>String(s).replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,"&quot;");
  let h=SURE_CSS+'<div style="padding:4px 14px 24px;max-width:720px;margin:0 auto">';
  const items=_sureItems(), decks=sureDecks(items);
  if(!decks.length){ h+='<div class="mast-none">No decks ready for Sure? then flip yet \u{2014} it needs '+SURE_MIN+' or more cards with a picture (or a short answer on the back).</div></div>'; return h; }
  const st=sureState;
  const chip=(dk,lbl)=>{ const sel=st&&st.deck===dk; return '<button onclick="sureStart(\''+q(dk)+'\')" style="padding:10px 16px;border-radius:999px;font-size:14px;font-weight:800;border:2px solid '+(sel?color:'#e2ddd6')+';background:'+(sel?color:'#fff')+';color:'+(sel?'#fff':'#57534e')+';cursor:pointer;font-family:\'DM Sans\',sans-serif">'+lbl+'</button>'; };
  if(!st||st.phase==="done"){
    h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 14px">';
    decks.forEach(dk=>{ h+=chip(dk,esc(dk)); });
    if(decks.length>1) h+=chip(WHICH_MIX,"\u{1F3B2} "+WHICH_MIX);
    h+='</div>';
  }
  if(!st){ h+='<div style="font-size:15px;font-weight:700;color:#57534e">\u{1F914} Pick a deck. Say how sure you are, answer, then flip the card!</div></div>'; return h; }
  const s=masteryData[st.kid+"_settings"]||{}, best=(s.match_best||{})[sureBestKey(st.deck)];
  if(st.phase==="play"){
    const t=st.turns[st.i], it=_sureIt(st,t.pid), mute=!!(t.mode==="answer"&&whichSilent(it)), lock=st.lock;
    if(typeof gameCardShown==="function") gameCardShown(t);   // ⏱ CARDSECS: the card is on screen — its clock starts at the first paint
    h+='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0 4px"><div style="display:flex;gap:6px;flex-wrap:wrap">';
    st.turns.forEach((x,ix)=>{ const cur=ix===st.i; h+='<span style="width:14px;height:14px;border-radius:50%;display:inline-block;'+(x.done?'background:'+(x.first?'#16a34a':'#f59e0b'):cur?'background:#fff;border:3px solid '+color:'background:#e7e5e4')+'"></span>'; });
    h+='</div><span style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--muted)">'+esc(st.deck)+(best!=null?' \u{00B7} \u{1F3C6} '+best:'')+
      '<button onclick="sureChangeDeck()" style="padding:6px 12px;border-radius:999px;border:1.5px solid #e2ddd6;background:#fff;color:#57534e;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap;font-family:\'DM Sans\',sans-serif">\u{1F5C2} Change deck</button></span></div>';
    const lead=t.back?'One more look. ':'';
    const line=t.step==="sure"?lead+'How sure are you?':t.step==="produce"?(t.act==="say"?(t.gj&&t.gjLine?esc(t.gjLine):'Say it out loud, then tap \u{1F5E3}'):t.act==="type"?'Type the answer.':'Tap the answer.'):(t.ok?(t.sure?'\u{1F44D} You knew it!':'\u{1F60A} You had it after all!'):(t.sure?'\u{1F6A8} You were sure \u{2014} look closely:':'Not yet \u{2014} it\u2019s:'));
    h+='<div style="text-align:center;font-size:17px;font-weight:800;color:#57534e;margin:10px 0 12px">'+line+'</div>';
    h+='<div style="margin:6px 0 10px;display:flex;align-items:center;justify-content:center;gap:12px"><span class="sure-card">'+_sureCardVis(st,t)+'</span>'+
      ((t.mode==="answer"&&!mute)||t.step==="flip"?'<button onclick="sureSayAgain()" aria-label="Hear it again" style="width:56px;height:56px;flex:none;border-radius:50%;border:3px solid '+color+';background:#fff;color:'+color+';font-size:26px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center">\u{1F50A}</button>':'')+'</div>';
    if(t.step==="sure"){
      h+='<div style="display:flex;gap:12px;justify-content:center;margin-top:8px"><button class="sure-conf" onclick="sureCall(true)">\u{1F44D} I\u2019m sure</button><button class="sure-conf" onclick="sureCall(false)">\u{1F937} Not sure</button></div>';
    } else if(t.step==="produce"){
      if(t.act==="say"&&t.gj&&typeof gameJudgeHtml==="function") h+=gameJudgeHtml(t,color,lock);   // ⚖️ GAMEJUDGE: the choices / the typing box / Mom's ✓ ✗ — before the flip
      else if(t.act==="say") h+='<div style="display:flex;justify-content:center"><button class="sure-btn" onclick="sureSaid()" style="background:'+color+';color:#fff;font-size:20px;padding:18px 34px">\u{1F5E3} I said it</button></div>';
      else if(t.act==="type"){
        h+='<div style="display:flex;justify-content:center;margin-bottom:10px"><span style="min-width:120px;height:56px;border-radius:14px;border:3px solid '+color+';background:#fff;font-family:\'Fraunces\',serif;font-size:30px;font-weight:800;color:#292524;display:inline-flex;align-items:center;justify-content:center;padding:0 14px">'+esc(t.typed||"")+'</span></div>';
        h+='<div style="display:grid;grid-template-columns:repeat(3,64px);gap:8px;justify-content:center">';
        ["1","2","3","4","5","6","7","8","9","back","0","ok"].forEach(k=>{ if(k==="back") h+='<button class="sure-key" onclick="sureKey(\'back\')" aria-label="Erase">\u{232B}</button>'; else if(k==="ok") h+='<button class="sure-key" onclick="sureCheck()"'+(!t.typed?' disabled':'')+' style="background:'+color+';color:#fff;border-color:transparent" aria-label="Check">\u{2714}</button>'; else h+='<button class="sure-key" onclick="sureKey(\''+k+'\')">'+k+'</button>'; });
        h+='</div>';
      } else {
        h+='<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">';
        (t.opts||[]).forEach((op,i)=>{ h+='<button class="sure-opt" onclick="surePickTap('+i+')">'+esc(op)+'</button>'; });
        h+='</div>';
      }
    } else {   // the flip: the answer, written — after the kid produced
      const ans=sureAnswer(it,t.act), cls=t.ok===null?'':t.ok?' sure-ok':t.sure?' sure-loud':' sure-soft';
      h+='<div class="sure-flip'+cls+'" style="font-size:'+(ans.length<=6?'40px':ans.length<=14?'28px':'20px')+(t.ok===null?';border-color:#a78bfa;background:#fff;color:#292524':'')+'">'+(t.ok===false&&t.picked!=null?'<div style="font-size:14px;opacity:.7;margin-bottom:4px"><s>'+esc(t.picked)+'</s></div>':'')+esc(ans)+'</div>';
      if(t.ok===false) h+='<div style="display:flex;justify-content:center;margin-top:14px"><button class="sure-btn" onclick="sureGotIt()" style="background:'+color+';color:#fff">\u{27A1} Got it</button></div>';
    }
    return h+'</div>';
  }
  // Finish: first-time count against the kid's own best, the honest tally, Play again / Mix the decks
  const T=st.tally||{};
  h+='<div style="margin-top:6px;text-align:center;padding:16px;border-radius:18px;background:'+(st.isPB?'#f0fdf4':'#f8f7f4')+';border:2px solid '+(st.isPB?'#16a34a':'#e2ddd6')+'">';
  h+='<div style="font-family:\'Fraunces\',serif;font-size:22px;font-weight:800">\u{1F389} All flipped!</div>';
  h+='<div style="font-size:17px;font-weight:800;color:#57534e;margin-top:10px">\u{1F914} '+st.first+' of '+st.of+' right the first time'+(st.isPB?' \u{2014} \u{1F3C6} new best!':(st.prevBest!=null?' \u{00B7} best '+st.prevBest:''))+'</div>';
  h+='<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:12px;font-size:13px;font-weight:700">'+
    '<span style="padding:6px 12px;border-radius:999px;background:#f0fdf4;color:#15803d;border:1.5px solid #86efac">\u{1F44D} sure &amp; right '+(T.sr||0)+'</span>'+
    '<span style="padding:6px 12px;border-radius:999px;background:#fef2f2;color:#b91c1c;border:1.5px solid #fca5a5">\u{1F44D} sure &amp; wrong '+(T.sw||0)+'</span>'+
    '<span style="padding:6px 12px;border-radius:999px;background:#f0fdf4;color:#15803d;border:1.5px solid #86efac">\u{1F937} not sure &amp; right '+(T.nr||0)+'</span>'+
    '<span style="padding:6px 12px;border-radius:999px;background:#fffbeb;color:#b45309;border:1.5px solid #fde68a">\u{1F937} not sure &amp; wrong '+(T.nw||0)+'</span></div>';
  h+='<div style="display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap">';
  h+='<button onclick="sureStart(\''+q(st.deck)+'\')" style="padding:12px 24px;border-radius:999px;border:none;background:'+color+';color:#fff;font-size:15px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif">\u{1F501} Play again</button>';
  if(decks.length>1&&!st.mix) h+='<button onclick="sureStart(\''+q(WHICH_MIX)+'\')" style="padding:12px 24px;border-radius:999px;border:2px solid '+color+';background:#fff;color:'+color+';font-size:15px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif">\u{1F3B2} '+WHICH_MIX+'</button>';
  return h+'</div></div></div>';
}
// SURE_END
// CATS_START — 📋 "Categories" (the hub's "build four games" 2026-11-03; PLAN_practice_games_2026-10-23.md Tier 3 "Categories dump
// (Scattergories-lite): 'name every … about …' — 2 min, typed list, checked against the deck" — free recall by CATEGORY). Brain Dump
// asks for a whole deck; this asks for one GROUP inside it: "Name every fact that makes 12", "Name every sentence that follows
// 'Use a before a consonant sound'", "Name every 'a type of atom'". The category is the cue; the kid types every card in it they can,
// one at a time, Enter after each — nothing is listed, hinted or auto-completed while they type.
//   WHERE A CATEGORY COMES FROM (the same fact as Sort it's bins — no card carries a group field, so nothing is invented): a deck's
//   cards that share one BACK (the rule, the answer, the kind). A group needs CATS_MIN_PER cards; a deck plays with CATS_MIN_CATS+
//   groups. A round is up to CATS_PER_ROUND groups of the deck, drawn at random, each with its own quiet clock (CATS_SECS) and a
//   "Next" button — Scattergories' timer, nothing to beat (plan §2.5: no clock against a learning card; this one only stops a category).
//   A typed name becomes a chip: ✓ green when it is in this group; amber "another group" when it is a card of the deck that belongs
//   elsewhere (which group is never told); grey "not in this deck". Hit = Brain Dump's own matcher when it is on the page (case,
//   punctuation, one letter off on a long name), after a math-aware tidy (spaces out, x / * → ×, 4+8 counts for 8+4 — the same
//   fact). A name typed twice is ignored. No re-ask: the category was the cue, and the kid saw it.
//   📋 CATSCAP (games honesty audit #16, 2026-11-08): a wrong entry cost nothing, so a kid who knew the deck's FRONTS but not the groups
//   could type every front into every group and collect the hits. Each group now takes at most its size + CATS_EXTRA entries (a name
//   typed twice is still free); past that an entry is refused with a soft line ("tap Next") — nothing is counted, nothing is logged.
//   The finish, per group: ✓ named, then "still in the group" (dim) — shown only AFTER the kid is done with it (the app never supplies
//   what the child must produce before they produce it). Confetti (no song) only when every card of the round was named.
//   Shown only to a kid at level middle / upper (dcLevel from the roster's grade: 3rd and up — readers who type) — never by name.
// Writes (only these): <kid>_settings/match_best key "<deck> · cats" (most named in a round, only when beaten) and the round's gameLog
//   entry (GAMELOG, game:"cats": a card named = ok, missed = wrong). NEVER the ladder — no tier, no next_due, no history, no studyLog.
//   db && !_dryRun() only. Per-kid park / restore / resume through its GAMES_LIST entry (🎲 GAMEKIT): time away is not play time.
//   A round dropped (Change deck, a kid switch) writes nothing.
let catsState=null;   // {kid,deck,game:"cats",t0,catT0,pausedTotal,pausedAt,cats:[{key,label,cards:[{pid,front}],named:{pid:1},typed:[{text,pid,how}],secs}],others:[{pid,front}],ci,phase:"play"|"done",count,of,turns,isPB,prevBest,gameLogged}
let _catsRandom=Math.random;   // tests seed it
const CATS_PER_ROUND=3, CATS_MIN_PER=3, CATS_MIN_CATS=2, CATS_SECS=120, CATS_LABEL_MAX=120, CATS_EXTRA=3;
function catsCap(cat){ return ((cat&&cat.cards)?cat.cards.length:0)+CATS_EXTRA; }   // 📋 CATSCAP: the most entries one group takes
function catsFull(cat){ return !!cat&&(cat.typed||[]).length>=catsCap(cat); }
const CATS_FULL_LINE="That\u2019s plenty for this category \u2014 tap Next when you\u2019re ready.";
function _catsItems(kid){ return (typeof _gamesItems==="function")?_gamesItems(kid||masteryKid):[]; }
function _catsPlain(s){ return (typeof _matchPlain==="function")?_matchPlain(s):String(s==null?"":s).replace(/<[^>]*>/g," ").replace(/&nbsp;/g," ").replace(/\s+/g," ").trim(); }
function _catsE(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function _catsQ(s){ return String(s==null?"":s).replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,"&quot;"); }
function _catsShuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(_catsRandom()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function _catsNorm(s){ s=_catsPlain(s); return (typeof dumpNorm==="function")?dumpNorm(s):s.toLowerCase().replace(/[.,!?;:"()]/g," ").replace(/\s+/g," ").trim(); }
// PURE: the math-aware tidy — a fact typed "6 + 6", "6x6", "6*6" is the card "6+6" / "6×6"; words are left as they are
function catsPrep(s){
  s=_catsPlain(s);
  if(!/\d/.test(s)) return s;
  return s.replace(/\s+/g,"").replace(/[xX*\u22C5\u00B7]/g,"\u00D7").replace(/[\u2212\u2013\u2014]/g,"-").replace(/[\u2044]/g,"/");
}
// PURE: a fact's twin with the two sides swapped ("4+8" → "8+4", "3×7" → "7×3"), or "" when it isn't one
function catsSwap(s){ const m=/^(\d+)([+\u00D7])(\d+)$/.exec(catsPrep(s)); return m?m[3]+m[2]+m[1]:""; }
// A card in play for the games: active / introduction, not a production twin, with a front, not one Which one? leaves out (spelling, phonograms), not hidden for a class
function _catsInPlay(i,kid){
  if(!i||(i.status!=="active"&&i.status!=="introduction")||i.dir==="prod") return false;
  if(!String(i.prompt||"").trim()) return false;
  try{ if(typeof _whichLeftOut==="function"&&_whichLeftOut(i,kid)) return false; }catch(e){}
  try{ if(typeof envtWaitsForCheckin==="function"&&envtWaitsForCheckin(kid,i.subject)) return false; }catch(e){}
  try{ if(typeof cpceHidItem==="function"&&cpceHidItem(kid,i)) return false; }catch(e){}
  try{ if(typeof cpSecOffItem==="function"&&cpSecOffItem(kid,i)) return false; }catch(e){}
  return true;
}
// The card's back as a category label — "" when it can't be one (none, the same as the front, a sound mark, too long)
function _catsBack(it,kid){
  let b=""; try{ b=(typeof owRuleBack==="function")?owRuleBack(kid,it):(it.answer!=null?String(it.answer):""); }catch(e){ b=it.answer!=null?String(it.answer):""; }
  b=_catsPlain(b); const f=_catsPlain(it.prompt);
  if(!b||!f||_catsNorm(b)===_catsNorm(f)||b.length>CATS_LABEL_MAX||b.charAt(0)==="/") return "";
  return b;
}
function catsDeckOn(kid,deck){ return (typeof _gdRaw!=="undefined"&&_gdRaw)||typeof gameDeckOn!=="function"||gameDeckOn(kid,"cats",deck); }   // 🎮 GAMEGRID: Mom's cell for this deck (default on; the preload asks raw)
// PURE: every deck's groups → {deck:[{key,label,cards:[{pid,front}]}]} (biggest first), only decks with CATS_MIN_CATS+ groups of CATS_MIN_PER+
function catsGroups(items,kid){
  kid=kid||masteryKid;
  const by={}, seen={};
  (items||[]).forEach(i=>{
    if(!_catsInPlay(i,kid)) return;
    const d=i.subject||"Other", front=_catsPlain(i.prompt), nk=d+"|"+_catsNorm(catsPrep(front)); if(seen[nk]) return; seen[nk]=1;   // one card per name
    const b=_catsBack(i,kid); if(!b) return;
    const g=by[d]||(by[d]={}), k=_catsNorm(b); (g[k]||(g[k]={key:k,label:b,cards:[]})).cards.push({pid:i.id,front:front});
  });
  const out={}, bySize=(a,b)=>b.cards.length-a.cards.length||String(a.label).localeCompare(String(b.label),undefined,{numeric:true});
  Object.keys(by).sort().forEach(d=>{
    const cats=Object.values(by[d]).filter(c=>c.cards.length>=CATS_MIN_PER).sort(bySize);
    if(cats.length>=CATS_MIN_CATS&&catsDeckOn(kid,d)) out[d]=cats;
  });
  return out;
}
function catsDecks(items,kid){ return Object.keys(catsGroups(items,kid)).sort(); }   // the game's OWN rule (the games-per-deck grid's preload asks this, raw)
// Only a kid at level middle / upper (3rd grade and up by the roster) — readers who type; never a kid's name
function catsLevelOk(kid){ if(typeof dumpLevelOk==="function") return dumpLevelOk(kid); if(typeof dcLevel!=="function") return true; try{ const l=dcLevel(kid); return l!=="little"&&l!=="early"; }catch(e){ return true; } }
function catsAvail(kid){ return catsLevelOk(kid)&&catsDecks(_catsItems(kid),kid).length>0; }
// PURE: one round of a deck → {cats:[…up to CATS_PER_ROUND, shuffled], others:[{pid,front}] (the deck's grouped cards left out of this round)} or null
function catsRound(deck,groups){
  const g=groups&&groups[deck]; if(!g||g.length<CATS_MIN_CATS) return null;
  const picks=_catsShuffle(g.slice()).slice(0,CATS_PER_ROUND);
  const cats=picks.map(c=>({key:c.key,label:c.label,cards:c.cards.map(x=>({pid:x.pid,front:x.front})),named:{},typed:[],secs:0}));
  const others=[]; g.forEach(c=>{ if(picks.indexOf(c)<0) c.cards.forEach(x=>others.push({pid:x.pid,front:x.front})); });
  return {cats:cats,others:others};
}
// PURE: a typed name against a list of cards → {card,how:"hit"|"close"|"dup"} or null. Brain Dump's matcher when it is on the page (spelling
// slack on long names), else exact; a fact counts with its sides swapped
function catsMatch(typed,cards,named){
  const t=catsPrep(typed); if(!t) return null;
  const prepped=cards.map(c=>({pid:c.pid,front:catsPrep(c.front)})), nm=named||{};
  const exact=(s)=>{ const n=_catsNorm(s); for(const c of prepped){ if(_catsNorm(c.front)===n) return {card:c,how:nm[c.pid]?"dup":"hit"}; } return null; };
  let m=exact(t)||(catsSwap(t)?exact(catsSwap(t)):null);
  if(!m&&typeof dumpMatch==="function"&&!/\d/.test(t)){ const r=dumpMatch(t,prepped,nm); if(r) m={card:r.card,how:r.how}; }
  return m;
}
function catsElapsed(st,now){ now=now!=null?now:Date.now(); return Math.max(0,now-st.catT0-(st.pausedTotal||0)-(st.pausedAt?now-st.pausedAt:0)); }
function catsClock(ms){ const s=Math.floor(ms/1000); return Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); }
function catsStart(deck){
  try{ if(typeof bbAudioUnlock==="function") bbAudioUnlock(); }catch(e){}   // the deck tap unlocks the ding (iPad)
  const r=catsRound(deck,catsGroups(_catsItems(),masteryKid));
  if(!r||!catsDeckOn(masteryKid,deck)){ catsState=null; _mastRe(); return; }   // 🎮 GAMEGRID: a deck Mom turned off for this game
  catsState={kid:masteryKid,deck:deck,game:"cats",t0:Date.now(),catT0:Date.now(),pausedTotal:0,pausedAt:null,cats:r.cats,others:r.others,ci:0,phase:"play",count:0,of:r.cats.reduce((n,c)=>n+c.cards.length,0),turns:[],isPB:false,prevBest:null,gameLogged:false};
  _mastRe(); catsTick(catsState); catsFocus();
}
function catsChangeDeck(){ catsState=null; _mastRe(); }   // the round is dropped as it stands: nothing written
function catsFocus(){ try{ setTimeout(()=>{ const e=document.getElementById("cats-in"); if(e) e.focus(); },0); }catch(e){} }
// The quiet clock of the open category: updates #cats-clock each second; moves on at CATS_SECS. Clears itself once its round is parked or over.
function catsTick(st){
  if(typeof setInterval!=="function") return;
  if(window._catsTick) clearInterval(window._catsTick);
  window._catsTick=setInterval(()=>{
    if(catsState!==st||st.phase!=="play"||st.pausedAt){ clearInterval(window._catsTick); window._catsTick=null; return; }
    const ms=catsElapsed(st);
    if(ms>=CATS_SECS*1000){ clearInterval(window._catsTick); window._catsTick=null; catsNextCat(st); return; }
    const el=document.getElementById("cats-clock"); if(el) el.textContent=catsClock(ms);
  },1000);
}
// PURE over the state: one entered name → "hit" | "close" | "dup" | "other" (a card of the deck, another group) | "miss" (not in the deck)
// | "full" (📋 CATSCAP: the group has taken its size + CATS_EXTRA entries — refused, nothing counted) | "" (blank)
function catsEnter(st,text){
  const raw=_catsPlain(text), cat=st.cats[st.ci]; if(!raw||st.phase!=="play"||!cat) return "";
  const m=catsMatch(raw,cat.cards,cat.named);
  if(m&&m.how==="dup") return "dup";
  if(catsFull(cat)) return "full";   // 📋 CATSCAP
  if(m){ cat.named[m.card.pid]=1; cat.typed.push({text:raw,pid:m.card.pid,how:m.how}); st.count++; return m.how; }
  const elsewhere=[]; st.cats.forEach((c,i)=>{ if(i!==st.ci) elsewhere.push.apply(elsewhere,c.cards); }); elsewhere.push.apply(elsewhere,st.others||[]);
  const how=catsMatch(raw,elsewhere,{})?"other":"miss";
  if(!cat.typed.some(x=>x.pid==null&&_catsNorm(catsPrep(x.text))===_catsNorm(catsPrep(raw)))) cat.typed.push({text:raw,pid:null,how:how});
  return how;
}
function catsAdd(){
  const st=catsState; if(!st||st.phase!=="play") return;
  const el=document.getElementById("cats-in"), text=el?el.value:"";
  const r=catsEnter(st,text), cat=st.cats[st.ci];
  if(el) el.value="";
  if(r==="hit"||r==="close"){ try{ matchDing(); }catch(e){} }
  // In place when the round is on screen (a re-render would drop the keyboard on an iPad); else the normal redraw.
  const chips=document.getElementById("cats-chips"), cnt=document.getElementById("cats-count"), note=document.getElementById("cats-note");
  if(note) note.textContent=(r==="full"||catsFull(cat))?CATS_FULL_LINE:"";   // 📋 CATSCAP: the soft line
  if(chips&&cnt&&r&&r!=="dup"&&r!=="full"){ chips.insertAdjacentHTML("beforeend",_catsChip(cat.typed[cat.typed.length-1])); cnt.textContent=Object.keys(cat.named).length+" of "+cat.cards.length; }
  else if(!chips||!cnt) _mastRe();
  if(cat&&Object.keys(cat.named).length>=cat.cards.length){ catsNextCat(st); return; }   // the group is complete
  catsFocus();
}
function _catsChip(x){ const on=x.how==="hit"||x.how==="close"; return '<span class="cats-chip'+(on?' cats-on':x.how==="other"?' cats-other':'')+'">'+(on?'\u2713 ':'')+_catsE(x.text)+(x.how==="other"?' <i>\u{00B7} another group</i>':'')+'</span>'; }
// "Next" / the clock / every card of the group named: close this category; the last one closes the round
function catsNextCat(st){
  st=st||catsState; if(!st||st.phase!=="play") return;
  if(window._catsTick){ clearInterval(window._catsTick); window._catsTick=null; }
  const cat=st.cats[st.ci]; if(cat) cat.secs=Math.round(catsElapsed(st)/1000);
  st.ci++;
  if(st.ci>=st.cats.length){ catsFinish(st); _mastRe(); return; }
  st.catT0=Date.now(); st.pausedTotal=0; st.pausedAt=null;
  _mastRe(); catsTick(st); catsFocus();
}
function catsBestKey(deck){ return deck+" \u{00B7} cats"; }
function catsFinish(st){
  st.phase="done"; st.ci=st.cats.length;
  st.turns=[]; st.cats.forEach(c=>c.cards.forEach(x=>st.turns.push({pid:x.pid,done:true,first:!!c.named[x.pid],wrong:c.named[x.pid]?{}:{1:1},back:false})));
  const kid=st.kid||masteryKid;   // GAMEKID
  try{ if(typeof gameLogRound==="function") gameLogRound(st); }catch(e){}   // 🎮 GAMELOG: every card of the round's groups, game:"cats"
  const s=masteryData[kid+"_settings"]||(masteryData[kid+"_settings"]={});
  if(!s.match_best) s.match_best={};
  const key=catsBestKey(st.deck), prev=s.match_best[key];
  st.prevBest=prev==null?null:prev;
  st.isPB=st.count>0&&(prev==null||st.count>prev);
  if(st.isPB){
    s.match_best[key]=st.count;
    if(db&&!_dryRun()) db.ref("mastery/"+kid+"_settings/match_best").update({[(typeof haKey==="function"?haKey(key):key)]:st.count});   // this key only
    try{HA_LS.setItem("ha_mastery",JSON.stringify(masteryData));}catch(e){}
  }
  try{ if(st.of>0&&st.count===st.of&&typeof _showCelebration==="function"&&document.getElementById("celeb-overlay")) _showCelebration(kid,"\u{1F4CB} You named every one!",{noSong:true}); }catch(e){}
}
// 🎲 GAMEKIT: park / restore / resume. Time away is not play time (no render here; the caller renders).
function catsPark(){ const st=catsState; if(st&&st.phase==="play"&&!st.pausedAt) st.pausedAt=Date.now(); return st; }
function catsRestore(v){ catsState=v||null; const st=catsState; if(st&&st.pausedAt){ st.pausedTotal=(st.pausedTotal||0)+(Date.now()-st.pausedAt); st.pausedAt=null; } }
function catsResume(){ const st=catsState; if(st&&st.phase==="play"&&(typeof mastView==="undefined"||mastView==="cats")) catsTick(st); }
const CATS_CSS='<style>.cats-chip{display:inline-block;padding:6px 11px;border-radius:999px;border:2px solid #e2ddd6;background:#fff;color:#78716c;font-size:14px;font-weight:700;margin:3px}'+
  '.cats-chip.cats-on{border-color:#16a34a;background:#f0fdf4;color:#15803d}.cats-chip.cats-other{border-color:#fde68a;background:#fffbeb;color:#b45309}.cats-chip.cats-dim{border-style:dashed;color:#a8a29e}.cats-chip i{font-style:normal;font-weight:600;opacity:.8}'+
  '.cats-in{width:100%;box-sizing:border-box;padding:14px 16px;border-radius:14px;border:3px solid #e2ddd6;font-size:20px;font-family:\'DM Sans\',sans-serif;outline:none}.cats-in:focus{border-color:#0ea5e9}'+
  '.cats-btn{padding:12px 22px;border-radius:999px;border:none;color:#fff;font-size:15px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif}'+
  '.cats-ghost{padding:10px 16px;border-radius:999px;border:1.5px solid #e2ddd6;background:#fff;color:#57534e;font-size:13px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif}'+
  '.cats-cue{padding:16px 18px;border-radius:18px;background:#f5f3ff;border:2px solid #ddd6fe;text-align:center;font-family:\'Fraunces\',serif;font-weight:800;color:#4c1d95;line-height:1.25;overflow-wrap:anywhere}</style>';
function buildCatsHtml(color){
  let h=CATS_CSS+'<div style="padding:4px 14px 24px;max-width:720px;margin:0 auto">';
  const groups=catsGroups(_catsItems(),masteryKid), decks=Object.keys(groups).sort();
  if(!decks.length){ h+='<div class="mast-none">No decks ready for Categories yet \u{2014} it needs a deck with '+CATS_MIN_CATS+' or more groups of '+CATS_MIN_PER+'+ cards that share an answer or a rule.</div></div>'; return h; }
  const st=catsState;
  const chip=(dk,lbl)=>{ const sel=st&&st.deck===dk; return '<button onclick="catsStart(\''+_catsQ(dk)+'\')" style="padding:10px 16px;border-radius:999px;font-size:14px;font-weight:800;border:2px solid '+(sel?color:'#e2ddd6')+';background:'+(sel?color:'#fff')+';color:'+(sel?'#fff':'#57534e')+';cursor:pointer;font-family:\'DM Sans\',sans-serif">'+lbl+'</button>'; };
  if(!st||st.phase==="done"){
    h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 14px">';
    decks.forEach(dk=>{ h+=chip(dk,_catsE(dk)+' <span style="opacity:.7;font-weight:700">'+groups[dk].length+'</span>'); });
    h+='</div>';
  }
  if(!st){ h+='<div style="font-size:15px;font-weight:700;color:#57534e">\u{1F4CB} Pick a deck. A category comes up \u{2014} name every card in it you can, one at a time, Enter after each.</div></div>'; return h; }
  const s=masteryData[st.kid+"_settings"]||{}, best=(s.match_best||{})[catsBestKey(st.deck)];
  const head=(right)=>'<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0 10px;flex-wrap:wrap"><div style="font-family:\'Fraunces\',serif;font-size:20px;font-weight:800;color:#292524">'+right+'</div>'+
    '<span style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--muted)">'+_catsE(st.deck)+(best!=null?' \u{00B7} \u{1F3C6} '+best:'')+
    '<button class="cats-ghost" onclick="catsChangeDeck()">\u{1F5C2} Change deck</button></span></div>';
  if(st.phase==="play"){
    const cat=st.cats[st.ci], n=Object.keys(cat.named).length;
    if(typeof window!=="undefined"&&!window._catsTick&&!st.pausedAt) catsTick(st);   // back on screen (another view, a parked kid): the clock ticks again
    h+=head('Category '+(st.ci+1)+' of '+st.cats.length);
    h+='<div class="cats-cue" style="font-size:'+(cat.label.length<=12?'32px':cat.label.length<=40?'22px':'17px')+'"><div style="font-size:12px;font-weight:800;color:#7c3aed;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;font-family:\'DM Sans\',sans-serif">Name every one that is\u2026</div>'+_catsE(cat.label)+'</div>';
    h+='<div style="display:flex;align-items:center;justify-content:space-between;margin:10px 0 8px"><span id="cats-count" style="font-size:17px;font-weight:800;color:'+color+'">'+n+' of '+cat.cards.length+'</span><span id="cats-clock" style="font-size:13px;font-weight:700;color:var(--muted)">'+catsClock(catsElapsed(st))+'</span></div>';
    h+='<div style="display:flex;gap:8px;align-items:center"><input id="cats-in" class="cats-in" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Type one, press Enter" aria-label="A card in this category" onkeydown="if(event.key===\'Enter\'){event.preventDefault();catsAdd();}">'+
      '<button class="cats-btn" style="background:'+color+'" onclick="catsAdd()">Add</button></div>';
    h+='<div id="cats-note" style="min-height:20px;font-size:13px;font-weight:700;color:#78716c;margin-top:6px">'+(catsFull(cat)?_catsE(CATS_FULL_LINE):'')+'</div>';   // 📋 CATSCAP
    h+='<div id="cats-chips" style="margin:12px 0;min-height:40px">'+cat.typed.map(_catsChip).join("")+'</div>';
    h+='<div style="display:flex;justify-content:center"><button class="cats-ghost" onclick="catsNextCat()">'+(st.ci+1<st.cats.length?'\u{27A1} Next category':'\u{2714} I\u{2019}m done')+'</button></div>';
    return h+'</div>';
  }
  // Finish: named N of M, then each group — ✓ named, the rest dim (after the kid is done with it), the stray chips
  h+='<div style="margin-top:6px;text-align:center;padding:16px;border-radius:18px;background:'+(st.isPB?'#f0fdf4':'#f8f7f4')+';border:2px solid '+(st.isPB?'#16a34a':'#e2ddd6')+'">';
  h+='<div style="font-family:\'Fraunces\',serif;font-size:22px;font-weight:800">\u{1F389} You named '+st.count+' of '+st.of+(st.isPB?' \u{2014} \u{1F3C6} new best!':(st.prevBest!=null?' \u{00B7} best '+st.prevBest:''))+'</div>';
  h+='<div style="font-size:12px;font-weight:700;color:var(--muted);margin-top:4px">'+_catsE(st.deck)+' \u{00B7} '+st.cats.length+' categories</div>';
  st.cats.forEach(cat=>{
    h+='<div style="text-align:left;margin-top:12px"><div style="font-size:12px;font-weight:800;color:#57534e;text-transform:uppercase;letter-spacing:.04em">'+_catsE(cat.label)+' \u{00B7} '+Object.keys(cat.named).length+' of '+cat.cards.length+'</div><div style="margin-top:4px">';
    cat.cards.forEach(x=>{ const t=cat.named[x.pid]?cat.typed.find(y=>y.pid===x.pid):null;
      h+=t?'<span class="cats-chip cats-on">\u2713 '+(t.how==="close"?'<s style="opacity:.6">'+_catsE(t.text)+'</s> ':'')+_catsE(x.front)+'</span>':'<span class="cats-chip cats-dim">'+_catsE(x.front)+'</span>'; });
    const stray=cat.typed.filter(y=>y.pid==null); if(stray.length) h+='<div style="margin-top:2px">'+stray.map(_catsChip).join("")+'</div>';
    h+='</div></div>';
  });
  h+='<div style="display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap"><button class="cats-btn" style="background:'+color+'" onclick="catsStart(\''+_catsQ(st.deck)+'\')">\u{1F501} Play again</button></div>';
  return h+'</div></div>';
}
// CATS_END
// UNJUMBLE_START — 🧩 "Unjumble" (her go via the hub 2026-11-03; PLAN_practice_games_2026-10-23.md Tier 2 "Unjumble: drag words of a
// sentence into order (Daily Grams, rule cards with `sentence`)" — demand SEQ). The words of one of the kid's own sentence cards come up
// mixed as tiles; the kid taps them into order (tap a placed word to send it back), then ✔ Check. Phone-first: tap, no drag.
//   Cards: a card's `sentence` field when it carries one, else a FRONT that is a sentence — UJ_MIN_WORDS..UJ_MAX_WORDS words ending . ? !
//   (the grammar rule decks: "Isaac hit a grand slam." / "Kangaroos are native to Australia."); never a run of abbreviations, a rule's
//   "boat → boats · …" example line, or a card Which one? leaves out (spelling / phonograms). The markup is dropped (<u>a</u>, the
//   .mast-hl mark): the tiles are plain words with their own capital and punctuation (a worksheet unjumble gives those too). A deck
//   needs UJ_MIN+ sentences; a round is UJ_ROUND of them; 🎲 Mix the decks when two or more decks have some. Readers only (dcLevel:
//   not a pre-reader — never a name).
//   Right → the soft ding, the sentence is SAID as the confirm (not for a silent language), next. Wrong → the soft bonk; the words that
//   sit in their right place stay and lock (green), the rest go back to the tray — one more try. Wrong twice → "Here's how it goes"
//   shows the sentence for a beat (the card's own face, which the drill shows every day) and that card comes back once at the end.
//   No lives, no clock, no points.
// Writes (only these): <kid>_settings/match_best key "<deck> · jumble" (first-try rights, only when beaten) and the round's gameLog
//   entry (GAMELOG, game:"jumble"). NEVER touches the ladder — no scores, no next_due, no study log. db && !_dryRun() only. Per-kid
//   park / restore / resume through its GAMES_LIST entry (🎲 GAMEKIT). A round dropped (Change deck, a kid switch) writes nothing.
//   🎮 GAMEGRID: its own column — gameDeckOn(kid,"jumble",deck); the grid's preload asks raw (ujDecks).
let jumbleState=null;   // {kid,deck,mix,game:"jumble",t0,turns:[{pid,words:[w],tiles:[wi],line:[wi|null],locked:{pos:1},wrong:{},tries,done,first,fail,back,show}],i,phase,first,of,isPB,prevBest,lock,seq,msg,returned:{},gameLogged}
let _ujRandom=Math.random;   // tests seed it
const UJ_MIN=3, UJ_ROUND=6, UJ_MIN_WORDS=4, UJ_MAX_WORDS=12, UJ_TRIES=2, UJ_BEAT=900, UJ_BEAT_SHOW=2600;
function _ujItems(kid){ return (typeof _gamesItems==="function")?_gamesItems(kid||masteryKid):[]; }
function _ujShuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(_ujRandom()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function ujDeckOn(kid,deck){ return (typeof _gdRaw!=="undefined"&&_gdRaw)||typeof gameDeckOn!=="function"||gameDeckOn(kid,"jumble",deck); }
// The sentence's plain words: tags dropped, not spaced out ("Kentucky<b>.</b>" stays "Kentucky."), entities and runs of space collapsed
function ujPlain(s){ return String(s==null?"":s).replace(/<[^>]*>/g,"").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/\s+/g," ").trim(); }
function ujWords(s){ const p=ujPlain(s); return p?p.split(" "):[]; }
// PURE: is this text a sentence the game can jumble? (UJ_MIN_WORDS..UJ_MAX_WORDS words, ends . ? !, not a rule's example line, not a run
// of abbreviations, and at least three different words — one word repeated has no order to find)
function ujIsSentence(s){
  const w=ujWords(s); if(w.length<UJ_MIN_WORDS||w.length>UJ_MAX_WORDS) return false;
  const p=w.join(" "); if(!/[.?!]["\u201D\u2019']?$/.test(p)||/ \u00B7 |\u2192/.test(p)) return false;
  if(w.slice(0,-1).filter(x=>/\.$/.test(x)).length>1) return false;   // "Fri.   Aug.   Ln.   Mrs." is a list, not a sentence
  const seen={}; let distinct=0; w.forEach(x=>{ const k=x.toLowerCase(); if(!seen[k]){ seen[k]=1; distinct++; } });
  return distinct>=3;
}
// The sentence a card carries: its `sentence` field, else a front that is one; "" when neither
function ujSentence(it){ if(!it) return ""; const s=ujPlain(it.sentence); if(s&&ujIsSentence(s)) return s; const f=ujPlain(it.prompt); return ujIsSentence(f)?f:""; }
function _ujLeftOut(it,kid){
  if(!it||(it.status!=="active"&&it.status!=="introduction")||it.dir==="prod") return true;
  try{ if(typeof _whichLeftOut==="function"&&_whichLeftOut(it,kid)) return true; }catch(e){}   // spelling / phonograms: the app never shows a spelling the child must produce
  try{ if(typeof envtWaitsForCheckin==="function"&&envtWaitsForCheckin(kid,it.subject)) return true; }catch(e){}   // 📝 a station waiting for its check-in
  try{ if(typeof cpceHidItem==="function"&&cpceHidItem(kid,it)) return true; }catch(e){}   // 📚 CPCARDSEDIT
  try{ if(typeof cpSecOffItem==="function"&&cpSecOffItem(kid,it)) return true; }catch(e){}   // 🎚 CPSECTIONS
  return false;
}
// Readers only: not a pre-reader by the roster's grade (never a name)
function ujLevelOk(kid){ if(typeof dcLevel!=="function") return true; try{ return dcLevel(kid)!=="little"; }catch(e){ return true; } }
// PURE: every sentence card this kid can play → {deck:[{pid,text}]} (one card per sentence), only decks with UJ_MIN+ that are on
function ujPools(items,kid){
  kid=kid||masteryKid;
  const by={}, seen={};
  (items||[]).forEach(i=>{ if(_ujLeftOut(i,kid)) return; const s=ujSentence(i); if(!s) return; const d=i.subject||"Other", k=d+"|"+s.toLowerCase(); if(seen[k]) return; seen[k]=1; (by[d]||(by[d]=[])).push({pid:i.id,text:s}); });
  const out={}; Object.keys(by).sort().forEach(d=>{ if(by[d].length>=UJ_MIN&&ujDeckOn(kid,d)) out[d]=by[d]; });
  return out;
}
function ujDecks(items,kid){ return Object.keys(ujPools(items,kid)); }   // the game's OWN deck list (the games-per-deck grid's preload asks this, raw)
function ujAvail(kid){ return ujLevelOk(kid)&&ujDecks(_ujItems(kid),kid).length>0; }
// PURE: a turn for a sentence — its words, the tiles shuffled (never the sentence's own order when another is possible), an empty line
function ujTurn(pid,text,back){
  const words=ujWords(text), n=words.length, tiles=[]; for(let i=0;i<n;i++) tiles.push(i);
  let guard=0; do{ _ujShuffle(tiles); }while(guard++<20&&tiles.every((wi,p)=>words[wi].toLowerCase()===words[p].toLowerCase()));
  const line=[]; for(let i=0;i<n;i++) line.push(null);
  return {pid:pid,words:words,tiles:tiles,line:line,locked:{},wrong:{},tries:0,done:false,first:false,fail:false,back:!!back,show:false};
}
function jumbleStart(deck){
  try{ if(typeof bbAudioUnlock==="function") bbAudioUnlock(); }catch(e){}   // the deck tap unlocks the ding / bonk (iPad)
  const pools=ujPools(_ujItems(),masteryKid), mix=deck===WHICH_MIX, names=Object.keys(pools);
  let cards=[]; if(mix) names.forEach(d=>{ cards=cards.concat(pools[d]); }); else cards=pools[deck]||[];
  if(cards.length<UJ_MIN||(mix&&names.length<2)){ jumbleState=null; _mastRe(); return; }   // 🎮 GAMEGRID: a deck Mom turned off is not in pools
  const picks=_ujShuffle(cards.slice()).slice(0,UJ_ROUND);
  jumbleState={kid:masteryKid,deck:deck,mix:mix,game:"jumble",t0:Date.now(),turns:picks.map(c=>ujTurn(c.pid,c.text,false)),i:0,phase:"play",first:0,of:picks.length,isPB:false,prevBest:null,lock:false,seq:0,msg:"",returned:{}};
  _mastRe();
}
function jumbleChangeDeck(){ jumbleState=null; _mastRe(); }   // drop the round as it stands: nothing written
function _ujCur(st){ return (st&&st.phase==="play"&&!st.lock)?st.turns[st.i]:null; }
// Tap a tile in the tray: it fills the first empty slot of the line
function jumbleTap(wi){
  const st=jumbleState, t=_ujCur(st); if(!t||t.done) return;
  if(t.line.indexOf(wi)>=0||t.tiles.indexOf(wi)<0) return;
  const p=t.line.indexOf(null); if(p<0) return;
  t.line[p]=wi; st.msg=""; _mastRe();
}
// Tap a placed word: back to the tray (a locked one stays)
function jumbleUntap(p){
  const st=jumbleState, t=_ujCur(st); if(!t||t.done||t.locked[p]||t.line[p]==null) return;
  t.line[p]=null; st.msg=""; _mastRe();
}
function jumbleClear(){ const st=jumbleState, t=_ujCur(st); if(!t||t.done) return; t.line=t.line.map((wi,p)=>t.locked[p]?wi:null); st.msg=""; _mastRe(); }
// PURE: judge the line → "right" | "again" | "fail" | null (the line isn't full). Words compare by text, so two "the"s may swap. On a miss
// the right positions lock and the others go back to the tray; the second miss is a fail.
function ujJudge(t){
  if(t.done||t.line.some(wi=>wi==null)) return null;
  if(typeof gameCardAnswered==="function") gameCardAnswered(t);   // ⏱ CARDSECS: the first answer on this card stops its clock
  const okAt=t.line.map((wi,p)=>t.words[wi].toLowerCase()===t.words[p].toLowerCase());
  if(okAt.every(Boolean)){ t.done=true; t.first=t.tries===0; return "right"; }
  t.tries++; t.wrong[String(t.tries)]=1;
  okAt.forEach((o,p)=>{ if(o) t.locked[p]=1; else t.line[p]=null; });
  if(t.tries>=(t.limit||UJ_TRIES)){ t.done=true; t.first=false; t.fail=true; return "fail"; }   // 📜 GAMERULES jumble.reveal: "3 misses" gives a third try
  return "again";
}
function ujText(t){ return t.words.join(" "); }
// 📜 GAMERULES: Mom's "Show the sentence after…" rule for this kid (the games grid's pop-up) — {limit: misses before the card ends, show: reveal it then}.
// Default "2" = today; "3" = one more try; "never" = no reveal, the card just comes back once at the end like the other games.
function ujRule(kid){ const v=(typeof gameRule==="function")?gameRule(kid,"jumble","reveal"):null; return {limit:v==="3"?3:UJ_TRIES,show:v!=="never"}; }
function _ujSay(st,t){ try{ const it=_ujItems(st.kid).find(x=>x&&x.id===t.pid); if(typeof whichSilent==="function"&&whichSilent(it)) return; if(typeof mastView==="undefined"||mastView==="jumble") mastSpeak(ujText(t)); }catch(e){} }
function jumbleCheck(){
  const st=jumbleState, t=_ujCur(st); if(!t||t.done) return;
  const R=ujRule(st.kid); t.limit=R.limit;   // 📜 GAMERULES jumble.reveal
  const r=ujJudge(t); if(!r) return;
  if(r==="again"){ try{ matchBonk(); }catch(e){} st.msg="again"; _mastRe(); return; }
  if(r==="right"){ if(!t.back&&t.first) st.first++; try{ matchDing(); }catch(e){} st.msg="right"; _ujSay(st,t); }
  else {
    try{ matchBonk(); }catch(e){}
    if(R.show){ st.msg="show"; t.show=true; t.line=t.words.map((w,p)=>p); } else st.msg="back";   // "Here's how it goes" — the card's own face, for a beat; 📜 GAMERULES "never": no reveal, it just comes back
    if(!t.back&&!st.returned[t.pid]){ st.returned[t.pid]=1; st.turns.push(ujTurn(t.pid,ujText(t),true)); }   // back once, at the end
  }
  st.lock=true; const seq=++st.seq;
  _mastRe();
  setTimeout(()=>{ if(jumbleState===st&&st.lock&&st.seq===seq) jumbleNext(st); },(r==="fail"&&t.show)?UJ_BEAT_SHOW:UJ_BEAT);   // GAMEKID: never advances a parked / settled turn
}
function _ujStep(st){ st.lock=false; st.msg=""; st.i++; if(st.i>=st.turns.length) jumbleFinish(st); }
function jumbleNext(st){ st=st||jumbleState; if(!st||st!==jumbleState) return; _ujStep(st); _mastRe(); }
function jumbleBestKey(deck){ return deck+" \u{00B7} jumble"; }
function jumbleFinish(st){
  st.phase="done"; st.lock=false;
  const kid=st.kid||masteryKid;   // GAMEKID
  try{ if(typeof gameLogRound==="function") gameLogRound(st); }catch(e){}   // 🎮 GAMELOG: every sentence's result, game:"jumble"
  const s=masteryData[kid+"_settings"]||(masteryData[kid+"_settings"]={});
  if(!s.match_best) s.match_best={};
  const key=jumbleBestKey(st.deck), prev=s.match_best[key];
  st.prevBest=prev==null?null:prev;
  st.isPB=st.first>0&&(prev==null||st.first>prev);
  if(st.isPB){
    s.match_best[key]=st.first;
    if(db&&!_dryRun()) db.ref("mastery/"+kid+"_settings/match_best").update({[(typeof haKey==="function"?haKey(key):key)]:st.first});   // this key only
    try{HA_LS.setItem("ha_mastery",JSON.stringify(masteryData));}catch(e){}
  }
  try{ if(st.of>0&&st.first===st.of&&typeof _showCelebration==="function"&&document.getElementById("celeb-overlay")) _showCelebration(kid,"\u{1F9E9} Every sentence in order!",{noSong:true}); }catch(e){}
}
// GAMEKID → 🎲 GAMEKIT resume: a beat that was mid-way when the kid switched settles here (no render; the caller renders)
function jumbleResume(){ const st=jumbleState; if(!st||st.phase!=="play") return; if(st.lock) _ujStep(st); }
const UJ_CSS='<style>.uj-tile{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:8px 14px;border-radius:14px;border:3px solid #e2ddd6;background:#fff;font-family:\'Fraunces\',serif;font-size:20px;font-weight:800;color:#292524;cursor:pointer;-webkit-tap-highlight-color:transparent;overflow-wrap:anywhere;max-width:100%;line-height:1.1}'+
  '.uj-tile[disabled]{cursor:default}.uj-tile.uj-lock{border-color:#86efac;background:#f0fdf4;color:#15803d}.uj-tile.uj-show{border-color:#f59e0b;background:#fffbeb;color:#b45309}'+
  '.uj-slot{display:inline-flex;min-width:56px;min-height:46px;border-radius:14px;border:3px dashed #d6d3d1;background:#fafaf9}'+
  '.uj-line{display:flex;flex-wrap:wrap;gap:8px;align-items:center;min-height:66px;padding:10px;border-radius:18px;background:#f8f7f4;border:2px solid #e2ddd6;margin:10px 0 14px}.uj-tray{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:16px;min-height:46px}'+
  '.uj-btn{padding:12px 22px;border-radius:999px;border:none;font-size:16px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif;-webkit-tap-highlight-color:transparent}.uj-btn[disabled]{opacity:.45;cursor:default}'+
  '.uj-ghost{padding:10px 16px;border-radius:999px;border:1.5px solid #e2ddd6;background:#fff;color:#57534e;font-size:13px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif}.uj-ghost[disabled]{opacity:.45;cursor:default}</style>';
function buildJumbleHtml(color){
  const q=s=>String(s).replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,"&quot;");
  let h=UJ_CSS+'<div style="padding:4px 14px 24px;max-width:720px;margin:0 auto">';
  const items=_ujItems(), pools=ujPools(items), decks=Object.keys(pools);
  if(!decks.length){ h+='<div class="mast-none">No decks ready for Unjumble yet \u{2014} it needs '+UJ_MIN+' or more sentence cards in a deck.</div></div>'; return h; }
  const st=jumbleState;
  const chip=(dk,lbl)=>{ const sel=st&&st.deck===dk; return '<button onclick="jumbleStart(\''+q(dk)+'\')" style="padding:10px 16px;border-radius:999px;font-size:14px;font-weight:800;border:2px solid '+(sel?color:'#e2ddd6')+';background:'+(sel?color:'#fff')+';color:'+(sel?'#fff':'#57534e')+';cursor:pointer;font-family:\'DM Sans\',sans-serif">'+lbl+'</button>'; };
  if(!st||st.phase==="done"){
    h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 14px">';
    decks.forEach(dk=>{ h+=chip(dk,esc(dk)+' <span style="opacity:.7;font-weight:700">'+pools[dk].length+'</span>'); });
    if(decks.length>1) h+=chip(WHICH_MIX,"\u{1F3B2} "+WHICH_MIX);
    h+='</div>';
  }
  if(!st){ h+='<div style="font-size:15px;font-weight:700;color:#57534e">\u{1F9E9} Pick a deck. The words of a sentence are mixed up \u{2014} tap them into order, then Check!</div></div>'; return h; }
  const s=masteryData[st.kid+"_settings"]||{}, best=(s.match_best||{})[jumbleBestKey(st.deck)];
  if(st.phase==="play"){
    const t=st.turns[st.i], full=!t.line.some(wi=>wi==null);
    if(typeof gameCardShown==="function") gameCardShown(t);   // ⏱ CARDSECS: the card is on screen — its clock starts at the first paint
    h+='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0 4px"><div style="display:flex;gap:6px;flex-wrap:wrap">';
    st.turns.forEach((x,ix)=>{ const cur=ix===st.i; h+='<span style="width:14px;height:14px;border-radius:50%;display:inline-block;'+(x.done?'background:'+(x.first?'#16a34a':'#f59e0b'):cur?'background:#fff;border:3px solid '+color:'background:#e7e5e4')+'"></span>'; });
    h+='</div><span style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--muted)">'+esc(st.deck)+(best!=null?' \u{00B7} \u{1F3C6} '+best:'')+
      '<button onclick="jumbleChangeDeck()" style="padding:6px 12px;border-radius:999px;border:1.5px solid #e2ddd6;background:#fff;color:#57534e;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap;font-family:\'DM Sans\',sans-serif">\u{1F5C2} Change deck</button></span></div>';
    const m=st.msg;
    h+='<div style="text-align:center;font-size:17px;font-weight:800;color:'+(m==="right"?'#16a34a':m==="show"?'#b45309':'#57534e')+';margin:6px 0 4px">'+
      (m==="right"?'\u{2705} That\u2019s it!':m==="show"?'Here\u2019s how it goes \u{2014} we\u2019ll try it again later':m==="back"?'We\u2019ll come back to that one':m==="again"?'Almost \u{2014} the green ones are right. Try again!':t.back?'One more time \u{2014} put it in order':'Put the words in order')+'</div>';
    h+='<div class="uj-line" aria-label="Your sentence">';
    t.line.forEach((wi,p)=>{ if(wi==null) h+='<span class="uj-slot" aria-label="Empty slot"></span>'; else h+='<button class="uj-tile'+(t.locked[p]?' uj-lock':'')+(t.show?' uj-show':'')+'"'+(t.locked[p]||st.lock?' disabled':' onclick="jumbleUntap('+p+')"')+' aria-label="Word '+(p+1)+'">'+esc(t.words[wi])+'</button>'; });
    h+='</div><div class="uj-tray">';
    t.tiles.forEach(wi=>{ if(t.line.indexOf(wi)>=0) return; h+='<button class="uj-tile" onclick="jumbleTap('+wi+')"'+(st.lock?' disabled':'')+'>'+esc(t.words[wi])+'</button>'; });
    h+='</div>';
    h+='<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><button class="uj-btn" onclick="jumbleCheck()"'+(full&&!st.lock?'':' disabled')+' style="background:'+color+';color:#fff">\u{2714} Check</button><button class="uj-ghost" onclick="jumbleClear()"'+(st.lock?' disabled':'')+'>\u{21BA} Clear</button></div>';
    return h+'</div>';
  }
  // Finish: first-try count against the kid's own best, Play again / Mix the decks
  h+='<div style="margin-top:6px;text-align:center;padding:16px;border-radius:18px;background:'+(st.isPB?'#f0fdf4':'#f8f7f4')+';border:2px solid '+(st.isPB?'#16a34a':'#e2ddd6')+'">';
  h+='<div style="font-family:\'Fraunces\',serif;font-size:22px;font-weight:800">\u{1F389} All in order!</div>';
  h+='<div style="font-size:17px;font-weight:800;color:#57534e;margin-top:10px">\u{1F9E9} '+st.first+' of '+st.of+' on the first try'+(st.isPB?' \u{2014} \u{1F3C6} new best!':(st.prevBest!=null?' \u{00B7} best '+st.prevBest:''))+'</div>';
  h+='<div style="display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap">';
  h+='<button onclick="jumbleStart(\''+q(st.deck)+'\')" class="uj-btn" style="background:'+color+';color:#fff;font-size:15px">\u{1F501} Play again</button>';
  if(decks.length>1&&!st.mix) h+='<button onclick="jumbleStart(\''+q(WHICH_MIX)+'\')" class="uj-btn" style="border:2px solid '+color+';background:#fff;color:'+color+';font-size:15px">\u{1F3B2} '+WHICH_MIX+'</button>';
  return h+'</div></div></div>';
}
// UNJUMBLE_END
// KABOOM_START — 💥 "Kaboom" (her go via the hub 2026-11-03; PLAN_practice_games_2026-10-23.md Tier 2 "Kaboom: draw a stick from the jar:
// say the card; a KABOOM stick means put them back (laughter, no loss of progress)" — CR + chance novelty, the open-the-box / random-wheel
// pattern). A jar of sticks: one per card in the round plus KB_BOOMS "KABOOM!" sticks. The kid taps the jar to draw a stick; a card stick
// opens its card and the kid PRODUCES it — Go Fish's three acts: a picture / letter card is said out loud (🗣 honor tap, no mic on a
// tablet, the app says the name back), a number back is typed on the number pad, a word back is picked from three of the deck's own
// backs. Right → the ding, the stick goes in the kid's pile. Wrong → the bonk, one more try; wrong twice → "We'll come back to that
// one" (the answer is never shown — the app never supplies what the kid must produce) and the card comes back once at the end.
//   KABOOM! → the big laugh line, and every stick in the pile goes BACK INTO THE JAR (shuffled into what is left): those cards are
//   asked again — a free second retrieval — but as come-backs (back:true), so the first-try count never drops: no loss of progress,
//   as the plan says. A KABOOM stick is spent once drawn, and never the first stick. The round ends when the jar is empty; then the
//   missed cards come back once, then the finish: "N of M on the first try" and how many kabooms. No lives, no clock, no points.
// Cards: Which one?'s own pool (whichPool / whichDeckModes read RAW, like Go Fish — a deck turned off for Which one? still plays here),
//   then this game's grid cell gameDeckOn(kid,"kaboom",deck); a deck needs KB_MIN+ cards; KB_CARDS a round; 🎲 Mix the decks.
// Writes (only these): <kid>_settings/match_best key "<deck> · kaboom" (first-try rights, only when beaten) and the round's gameLog entry
//   (GAMELOG, game:"kaboom"). NEVER touches the ladder — no scores, no next_due, no study log. db && !_dryRun() only. Per-kid park /
//   restore / resume through its GAMES_LIST entry (🎲 GAMEKIT). A round dropped (Stop, a kid switch) writes nothing.
// ⚖️ GAMEJUDGE (her decision 2026-11-08, from the games audit — a picture deck's 🗣 was 8 of 8 every time): the say act is judged by the
// kid's ONE setting (say it then pick it / type it / Mom judges) — _kbJudgeOpen / _kbJudged below. A wrong judge is a double wrong:
// ok:false, "It's <name>." said (the right one stays lit), no stick for the pile, it comes back once at the end. The honor tap only
// when the deck has no other name. Rounds are stamped (st.judge → gameLog judge).
let kaboomState=null;   // {kid,deck,mix,game:"kaboom",t0,jar:[{pid}|{boom:true}],pile:[pid],open:{t}|null,turns:[{pid,act,done,first,wrong:{},tries,fail,back,opts?,typed?}],booms,phase:"play"|"back"|"done",backs,first,of,isPB,prevBest,lock,seq,msg,say,boomNow,gameLogged}
let _kbRandom=Math.random;   // tests seed it
const KB_CARDS=8, KB_BOOMS=2, KB_MIN=4, KB_TRIES=2, KB_BEAT=900, KB_BEAT_BOOM=2200;
const KB_NUM=/^[-+]?\d+([.,]\d+)?$/;
const KB_LAUGHS=["KABOOM! Back in the jar they go!","KABOOM! Ha! Everything back in the jar!","KABOOM! Whoops \u2014 the jar takes them all back!"];
function _kbItems(kid){ return (typeof _gamesItems==="function")?_gamesItems(kid||masteryKid):[]; }
function _kbShuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(_kbRandom()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function _kbRaw(fn){ const had=(typeof _gdRaw!=="undefined")?_gdRaw:null; try{ if(had!==null) _gdRaw=true; return fn(); } finally{ if(had!==null) _gdRaw=had; } }
function kaboomDeckOn(kid,deck){ return (typeof _gdRaw!=="undefined"&&_gdRaw)||typeof gameDeckOn!=="function"||gameDeckOn(kid,"kaboom",deck); }
function _kbWhichPool(items,kid){ return _kbRaw(()=>whichPool(items,WHICH_MIX,kid)); }
function _kbModes(items,kid){ return _kbRaw(()=>whichDeckModes(items,kid)); }
function _kbIt(st,pid){ return _kbItems(st.kid).find(x=>x&&x.id===pid)||null; }
function kaboomName(it){ return _matchPlain(it&&it.prompt); }
// The decks that can fill a jar: Which one?'s playable decks with KB_MIN+ cards in play, and this game's cell on
function kaboomDecks(items,kid){
  kid=kid||masteryKid;
  const n={}; _kbWhichPool(items,kid).forEach(i=>{ const d=i.subject||"Other"; n[d]=(n[d]||0)+1; });
  return Object.keys(n).filter(d=>n[d]>=KB_MIN&&kaboomDeckOn(kid,d)).sort();
}
function kaboomPool(items,deck,kid){ kid=kid||masteryKid; const ok=kaboomDecks(items,kid); return _kbWhichPool(items,kid).filter(i=>ok.indexOf(i.subject||"Other")>=0&&(deck===WHICH_MIX||(i.subject||"Other")===deck)); }
// What the kid DOES with a card (Go Fish's rule): "say" (picture / symbol), "type" (a number back), "pick" (a word back)
function kaboomKind(it,mode){ if(mode!=="answer") return "say"; return KB_NUM.test(String(_whichBack(it)).trim())?"type":"pick"; }
// PURE: the jar — one stick per card, shuffled, then the KABOOM sticks dropped in at random spots that are never the first draw
function kaboomJar(pids,booms){
  const jar=_kbShuffle(pids.map(p=>({pid:p})));
  for(let b=0;b<booms&&jar.length;b++){ const at=1+Math.floor(_kbRandom()*jar.length); jar.splice(at,0,{boom:true}); }
  return jar;
}
function _kbSay(st,text){ st.say=text||""; if(!text||(typeof mastView!=="undefined"&&mastView!=="kaboom")) return; try{ mastSpeak(text); }catch(e){} }
function kaboomSayAgain(){ const st=kaboomState; if(st&&st.say) try{ mastSpeak(st.say); }catch(e){} }
function kaboomStart(deck){
  try{ if(typeof bbAudioUnlock==="function") bbAudioUnlock(); }catch(e){}   // the deck tap unlocks the ding / bonk (iPad)
  const items=_kbItems(), mix=deck===WHICH_MIX, pool=kaboomPool(items,deck);
  if(pool.length<KB_MIN||(!mix&&!kaboomDeckOn(masteryKid,deck))){ kaboomState=null; _mastRe(); return; }   // 🎮 GAMEGRID: a deck Mom turned off for Kaboom
  const picks=_kbShuffle(pool.slice()).slice(0,KB_CARDS), pids=picks.map(i=>i.id);
  kaboomState={kid:masteryKid,deck:deck,mix:mix,game:"kaboom",t0:Date.now(),jar:kaboomJar(pids,KB_BOOMS),pile:[],open:null,turns:[],booms:0,phase:"play",backs:null,first:0,of:pids.length,isPB:false,prevBest:null,lock:false,seq:0,msg:"Tap the jar to draw a stick!",say:"",boomNow:false};
  if(typeof gameJudgeMode==="function"){ kaboomState.judge=gameJudgeMode(masteryKid); kaboomState.nch=gameJudgeChoices(masteryKid); }   // ⚖️ GAMEJUDGE: the kid's setting, read once a round (stamps the log)
  _mastRe();
}
function kaboomStop(){ kaboomState=null; _mastRe(); }   // drop the round as it stands: nothing written
// Three backs for a pick: the card's own + two different backs from its deck (Which one?'s rule), shuffled
function _kbLures(st,pid){
  const it=_kbIt(st,pid); if(!it) return [];
  const own=_whichBack(it), seen={}; seen[_whichNorm(own)]=1;
  const more=_kbShuffle(_kbWhichPool(_kbItems(st.kid),st.kid).filter(x=>x.id!==pid&&(x.subject||"Other")===(it.subject||"Other"))).map(x=>_whichBack(x)).filter(b=>b&&!seen[_whichNorm(b)]&&(seen[_whichNorm(b)]=1)).slice(0,2);
  return _kbShuffle([own].concat(more));
}
function _kbAct(st,pid){ const it=_kbIt(st,pid), modes=_kbModes(_kbItems(st.kid),st.kid); return kaboomKind(it,modes[(it&&it.subject)||"Other"]); }
// Open a card's stick (back = a come-back: a KABOOM return, or one of the end's)
function _kbOpen(st,pid,back){
  const act=_kbAct(st,pid), t={pid:pid,act:act,done:false,first:false,wrong:{},tries:0,fail:false,back:!!back}; st.turns.push(t);
  if(act==="pick") t.opts=_kbLures(st,pid);
  if(act==="type") t.typed="";
  st.open={t:st.turns.length-1}; st.boomNow=false;
  const it=_kbIt(st,pid), lead=back?"One more time. ":"";
  st.msg=lead+(act==="say"?"Say it out loud, then tap \u{1F5E3}":act==="type"?"Type the answer.":"Tap the answer.");
  if(act==="say") _kbSay(st,lead+"What is it?"); else _kbSay(st,lead+(it&&!whichSilent(it)?kaboomName(it):""));   // a word answer's FRONT is read; a silent language is shown only
  if(st.judge) _kbJudgeOpen(st,t,lead);   // ⚖️ GAMEJUDGE: a say card is judged (pick / type / Mom) instead of the honor tap
}
// 🏺 the draw: the top stick — a card to produce, or KABOOM
function kaboomDraw(){
  const st=kaboomState; if(!st||st.phase!=="play"||st.lock||st.open) return;
  const s=st.jar.shift(); if(!s){ _kbEnd(st); _mastRe(); return; }
  if(s.boom){ _kbBoom(st); _mastRe(); return; }
  _kbOpen(st,s.pid,!!s.back); _mastRe();   // a KABOOM-returned stick is a come-back turn
}
// KABOOM! — the pile goes back into the jar (shuffled into what is left) as come-backs; the first-try count keeps every point it has
function _kbBoom(st){
  st.booms++; st.boomNow=true;
  const back=st.pile.splice(0); back.forEach(p=>{ st.jar.push({pid:p,back:true}); }); _kbShuffle(st.jar);
  try{ matchBonk(); }catch(e){}
  const line=KB_LAUGHS[Math.min(KB_LAUGHS.length-1,st.booms-1)];
  st.msg=line+(back.length?" ("+back.length+" back)":" (your pile was empty \u2014 phew!)"); _kbSay(st,line);
  st.lock=true; const seq=++st.seq;
  setTimeout(()=>{ if(kaboomState===st&&st.lock&&st.seq===seq) kaboomNext(st); },KB_BEAT_BOOM);
}
function _kbTurn(st,act){ if(!st||st.lock||st.phase==="done"||!st.open) return null; const t=st.turns[st.open.t]; return (t&&t.act===act&&!t.done)?t:null; }
function kaboomSaid(){   // 🗣 "I said it" — the honor system: a tablet can't hear; the app says the name back as the confirm
  const st=kaboomState, t=_kbTurn(st,"say"); if(!t) return;
  if(typeof gameCardAnswered==="function") gameCardAnswered(t);   // ⏱ CARDSECS: the first answer on this card stops its clock
  if(t.gj){ gameJudgeSaid(); return; }   // ⚖️ GAMEJUDGE: no self-report — "I said it" opens the choices (pick); type / Mom have their own taps
  t.done=true; t.first=true;
  _kbSettle(st,t,"",kaboomName(_kbIt(st,t.pid))); _mastRe();   // the name is SAID back, never written
}
// ⚖️ GAMEJUDGE: a say card goes to the shared judge. Right → into the pile, as the honor tap was. Wrong → a double wrong (see the header).
function _kbJudgeOpen(st,t,lead){
  if(!st.judge||t.act!=="say"||typeof gameJudgeAct!=="function") return;
  const it=_kbIt(st,t.pid); if(!it) return;
  const deck=it.subject||"Other", names=_kbWhichPool(_kbItems(st.kid),st.kid).filter(x=>x&&x.id!==it.id&&(x.subject||"Other")===deck).map(x=>kaboomName(x));
  if(gameJudgeAct(st,t,{kid:st.kid,deck:deck,right:kaboomName(it),names:names,mode:st.judge,n:st.nch,shuffle:_kbShuffle,
    live:()=>kaboomState===st&&_kbTurn(st,"say")===t, line:s=>{ st.msg=lead+s; },
    onRight:x=>_kbJudged(st,x,true), onWrong:(x,g)=>_kbJudged(st,x,false,g)})) t.judge=st.judge;   // false (no other name) → the honor tap
}
function _kbJudged(st,t,right,given){
  const name=kaboomName(_kbIt(st,t.pid));
  t.done=true; t.first=!!right;
  if(right) return _kbSettle(st,t,"",name);
  t.tries=1; t.fail=true; t.wrong[(given!=null&&String(given)!=="")?String(given):"1"]=1;
  try{ matchBonk(); }catch(e){}
  return _kbSettle(st,t,"It\u2019s "+name+". We\u2019ll come back to that one.");
}
function kaboomKey(ch){   // the number pad
  const st=kaboomState, t=_kbTurn(st,"type"); if(!t) return;
  if(ch==="back") t.typed=t.typed.slice(0,-1); else if(t.typed.length<6) t.typed+=ch;
  _mastRe();
}
function _kbAnsOk(act,given,back){ if(act==="pick") return String(given)===String(back); return (typeof mstTypeAnsOk==="function")?mstTypeAnsOk(given,back):Number(String(given).replace(",","."))===Number(String(back).replace(",",".")); }
// PURE: one answer against the card's back → "right" | "again" | "fail". A picked back that was wrong greys out (t.wrong)
function kaboomJudge(t,given,back){
  if(typeof gameCardAnswered==="function") gameCardAnswered(t);   // ⏱ CARDSECS: the first answer on this card stops its clock
  if(_kbAnsOk(t.act,given,back)){ t.done=true; t.first=t.tries===0; return "right"; }
  t.tries++; t.wrong[t.act==="pick"?String(given):String(t.tries)]=1; t.typed="";
  if(t.tries>=KB_TRIES){ t.done=true; t.first=false; t.fail=true; return "fail"; }
  return "again";
}
function kaboomCheck(){
  const st=kaboomState, t=_kbTurn(st,"type"); if(!t||!t.typed) return;
  _kbAfter(st,t,kaboomJudge(t,t.typed,_whichBack(_kbIt(st,t.pid))));
}
function kaboomPickTap(i){
  const st=kaboomState, t=_kbTurn(st,"pick"); if(!t||!t.opts||t.opts[i]==null||t.wrong[t.opts[i]]) return;
  _kbAfter(st,t,kaboomJudge(t,t.opts[i],_whichBack(_kbIt(st,t.pid))));
}
function _kbAfter(st,t,r){
  if(r==="again"){ try{ matchBonk(); }catch(e){} st.msg="Almost \u2014 try again!"; _mastRe(); return; }
  if(r==="fail") try{ matchBonk(); }catch(e){}
  _kbSettle(st,t,r==="fail"?"We\u2019ll come back to that one.":""); _mastRe();
}
// The card is settled: a right one goes in the pile (a first-try right counts; a come-back counts for nothing), a beat, then the jar again
function _kbSettle(st,t,lead,spoken){
  if(!t.fail){ if(st.phase==="play") st.pile.push(t.pid); if(t.first&&!t.back) st.first++; try{ matchDing(); }catch(e){} }
  st.msg=lead||(t.first?"That\u2019s it! Into your pile.":"Okay \u2014 next one.");
  const pre=spoken?spoken+". ":(lead?lead+" ":"");
  if(t.first) _kbSay(st,pre+"That\u2019s it!"); else _kbSay(st,lead||"Next one.");
  st.lock=true; const seq=++st.seq;
  setTimeout(()=>{ if(kaboomState===st&&st.lock&&st.seq===seq) kaboomNext(st); },KB_BEAT);
}
function kaboomNext(st){
  st=st||kaboomState; if(!st||st!==kaboomState) return;
  st.lock=false; st.open=null; st.boomNow=false;
  if(st.phase==="back"){ _kbBackNext(st); _mastRe(); return; }
  if(!st.jar.length){ _kbEnd(st); _mastRe(); return; }
  st.msg="Tap the jar to draw a stick!"; st.say=""; _mastRe();
}
// ── the end: the jar is empty → the cards missed on their FIRST ask come back once → finish ──
function _kbEnd(st){
  if(st.phase!=="play") return;
  st.phase="back"; st.open=null;
  const seen={}, backs=[];
  st.turns.forEach(t=>{ if(t.back||seen[t.pid]) return; if(Object.keys(t.wrong).length||t.fail){ seen[t.pid]=1; backs.push(t.pid); } });
  st.backs=backs;
  if(!backs.length) return _kbFinish(st);
  st.msg="The jar is empty! Let\u2019s look at a few again."; _kbSay(st,"The jar is empty! Let's look at a few again.");
  st.lock=true; const seq=++st.seq; setTimeout(()=>{ if(kaboomState===st&&st.lock&&st.seq===seq) kaboomNext(st); },KB_BEAT*2);
}
function _kbBackNext(st){
  const pid=st.backs&&st.backs.shift();
  if(pid==null) return _kbFinish(st);
  _kbOpen(st,pid,true);
}
function kaboomBestKey(deck){ return deck+" \u{00B7} kaboom"; }
function _kbFinish(st){
  st.phase="done"; st.open=null; st.lock=false;
  const kid=st.kid||masteryKid;   // GAMEKID
  try{ if(typeof gameLogRound==="function") gameLogRound(st); }catch(e){}   // 🎮 GAMELOG: every act's result, game:"kaboom"
  const s=masteryData[kid+"_settings"]||(masteryData[kid+"_settings"]={});
  if(!s.match_best) s.match_best={};
  const key=kaboomBestKey(st.deck), prev=s.match_best[key];
  st.prevBest=prev==null?null:prev;
  st.isPB=st.first>0&&(prev==null||st.first>prev);
  if(st.isPB){
    s.match_best[key]=st.first;
    if(db&&!_dryRun()) db.ref("mastery/"+kid+"_settings/match_best").update({[(typeof haKey==="function"?haKey(key):key)]:st.first});   // this key only
    try{HA_LS.setItem("ha_mastery",JSON.stringify(masteryData));}catch(e){}
  }
  st.msg="The jar is empty!"; st.say="";
  try{ if(st.of>0&&st.first===st.of&&typeof _showCelebration==="function"&&document.getElementById("celeb-overlay")) _showCelebration(kid,"\u{1F4A5} You emptied the jar!",{noSong:true}); }catch(e){}
}
// GAMEKID → 🎲 GAMEKIT resume: a beat that was mid-way when the kid switched settles here (no render; the caller renders)
function kaboomResume(){
  const st=kaboomState; if(!st||st.phase==="done") return;
  if(st.lock){ st.lock=false; st.open=null; st.boomNow=false; if(st.phase==="back") _kbBackNext(st); else if(!st.jar.length) _kbEnd(st); else { st.msg="Tap the jar to draw a stick!"; st.say=""; } return; }
  if(st.say&&(typeof mastView==="undefined"||mastView==="kaboom")) try{ mastSpeak(st.say); }catch(e){}
}
// ── the screen ──
const KB_CSS='<style>.kb-jar{width:150px;height:170px;margin:0 auto;border-radius:22px 22px 44px 44px;background:linear-gradient(180deg,#c7d2fe,#818cf8);border:4px solid #4f46e5;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:14px;cursor:pointer;position:relative;overflow:visible;-webkit-tap-highlight-color:transparent;box-shadow:0 6px 0 #3730a3}'+
  '.kb-jar[disabled]{cursor:default;opacity:.7}.kb-jar.kb-boom{background:linear-gradient(180deg,#fde68a,#f97316);border-color:#b45309;box-shadow:0 6px 0 #9a3412;animation:kbShake .5s}'+
  '@keyframes kbShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-10px) rotate(-3deg)}40%{transform:translateX(9px) rotate(3deg)}60%{transform:translateX(-7px)}80%{transform:translateX(5px)}}'+
  '.kb-sticks{position:absolute;top:-26px;left:0;right:0;display:flex;justify-content:center;gap:5px;pointer-events:none}.kb-stick{width:9px;height:44px;border-radius:5px;background:#d6b78a;border:2px solid #a16207}'+
  '.kb-lbl{font-family:\'DM Sans\',sans-serif;font-weight:800;color:#fff;font-size:15px;text-shadow:0 1px 0 rgba(0,0,0,.25)}'+
  '.kb-pile{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;min-height:48px;padding:8px;border-radius:16px;background:#f8f7f4;border:2px dashed #e2ddd6;margin:12px 0}'+
  '.kb-won{width:44px;height:44px;border-radius:10px;border:2px solid #86efac;background:#f0fdf4;display:inline-flex;align-items:center;justify-content:center;overflow:hidden}.kb-won .kb-vis{transform:scale(.5);pointer-events:none}.kb-won .kb-txt{font-size:11px;padding:2px}'+
  '.kb-card{width:150px;height:160px;border-radius:14px;border:3px solid #a78bfa;background:#f5f3ff;display:flex;align-items:center;justify-content:center;overflow:hidden;margin:0 auto}.kb-card .kb-vis{pointer-events:none;transform:scale(1.5)}.kb-card .kb-txt{pointer-events:none;font-family:\'Fraunces\',serif;font-weight:800;font-size:34px;line-height:1.1;color:#292524;text-align:center;padding:6px;overflow-wrap:anywhere}'+
  '.kb-btn{padding:12px 22px;border-radius:999px;border:none;font-size:16px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif;-webkit-tap-highlight-color:transparent}.kb-btn[disabled],.kb-key[disabled],.kb-opt[disabled]{opacity:.45;cursor:default}'+
  '.kb-key{width:64px;height:56px;border-radius:14px;border:2px solid #e2ddd6;background:#fff;font-family:\'Fraunces\',serif;font-size:26px;font-weight:800;color:#292524;cursor:pointer}'+
  '.kb-opt{min-width:96px;padding:14px 18px;border-radius:16px;border:3px solid #e2ddd6;background:#fff;font-family:\'Fraunces\',serif;font-size:24px;font-weight:800;color:#292524;cursor:pointer;overflow-wrap:anywhere}.kb-opt.kb-wrong{opacity:.28;filter:grayscale(1);cursor:default}</style>';
function _kbCardVis(st,pid,act){
  const it=_kbIt(st,pid); if(!it) return '';
  if(act==="say"){ const v=_smTileVis(it); if(v) return '<span class="kb-vis">'+v+'</span>'; }
  return '<span class="kb-txt">'+esc(kaboomName(it))+'</span>';   // an answer card shows its FRONT (the kid produces the back)
}
function buildKaboomHtml(color){
  const q=s=>String(s).replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,"&quot;");
  let h=KB_CSS+'<div style="padding:4px 14px 24px;max-width:720px;margin:0 auto">';
  const items=_kbItems(), decks=kaboomDecks(items);
  if(!decks.length){ h+='<div class="mast-none">No decks ready for Kaboom yet \u{2014} it needs '+KB_MIN+' or more cards with a picture (or a short answer on the back).</div></div>'; return h; }
  const st=kaboomState;
  const chip=(dk,lbl)=>{ const sel=st&&st.deck===dk; return '<button onclick="kaboomStart(\''+q(dk)+'\')" style="padding:10px 16px;border-radius:999px;font-size:14px;font-weight:800;border:2px solid '+(sel?color:'#e2ddd6')+';background:'+(sel?color:'#fff')+';color:'+(sel?'#fff':'#57534e')+';cursor:pointer;font-family:\'DM Sans\',sans-serif">'+lbl+'</button>'; };
  if(!st||st.phase==="done"){
    h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 14px">';
    decks.forEach(dk=>{ h+=chip(dk,esc(dk)); });
    if(decks.length>1) h+=chip(WHICH_MIX,"\u{1F3B2} "+WHICH_MIX);
    h+='</div>';
  }
  if(!st){ h+='<div style="font-size:15px;font-weight:700;color:#57534e">\u{1F4A5} Pick a deck. Draw a stick from the jar and answer its card to keep it \u{2014} but watch out for KABOOM!</div></div>'; return h; }
  const s=masteryData[st.kid+"_settings"]||{}, best=(s.match_best||{})[kaboomBestKey(st.deck)];
  if(st.phase==="done"){
    h+='<div style="margin-top:6px;text-align:center;padding:16px;border-radius:18px;background:'+(st.isPB?'#f0fdf4':'#f8f7f4')+';border:2px solid '+(st.isPB?'#16a34a':'#e2ddd6')+'">';
    h+='<div style="font-family:\'Fraunces\',serif;font-size:22px;font-weight:800">\u{1F389} The jar is empty!</div>';
    h+='<div style="font-size:17px;font-weight:800;color:#57534e;margin-top:10px">\u{1F4A5} '+st.first+' of '+st.of+' on the first try'+(st.isPB?' \u{2014} \u{1F3C6} new best!':(st.prevBest!=null?' \u{00B7} best '+st.prevBest:''))+'</div>';
    h+='<div style="font-size:13px;font-weight:700;color:var(--muted);margin-top:6px">'+st.booms+' kaboom'+(st.booms===1?'':'s')+' \u{00B7} '+esc(st.deck)+'</div>';
    h+='<div style="display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap">';
    h+='<button onclick="kaboomStart(\''+q(st.deck)+'\')" class="kb-btn" style="background:'+color+';color:#fff;font-size:15px">\u{1F501} Play again</button>';
    if(decks.length>1&&!st.mix) h+='<button onclick="kaboomStart(\''+q(WHICH_MIX)+'\')" class="kb-btn" style="border:2px solid '+color+';background:#fff;color:'+color+';font-size:15px">\u{1F3B2} '+WHICH_MIX+'</button>';
    return h+'</div></div></div>';
  }
  h+='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0 4px;flex-wrap:wrap"><span style="font-size:13px;font-weight:800;color:#57534e">'+st.pile.length+' in your pile \u{00B7} '+st.jar.length+' stick'+(st.jar.length===1?'':'s')+' left</span>';
  h+='<span style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--muted)">'+esc(st.deck)+(best!=null?' \u{00B7} \u{1F3C6} '+best:'')+
    '<button onclick="kaboomStop()" style="padding:6px 12px;border-radius:999px;border:1.5px solid #e2ddd6;background:#fff;color:#57534e;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap;font-family:\'DM Sans\',sans-serif">\u{21A9} Stop</button></span></div>';
  h+='<div style="display:flex;align-items:center;gap:10px;margin:10px 0 12px;padding:12px 14px;border-radius:18px;background:'+(st.boomNow?'#fff7ed':'#eef2ff')+';border:2px solid '+(st.boomNow?'#fdba74':'#c7d2fe')+'"><span style="font-size:28px;line-height:1">'+(st.boomNow?'\u{1F4A5}':'\u{1F3FA}')+'</span><span style="flex:1;font-size:17px;font-weight:800;color:'+(st.boomNow?'#9a3412':'#312e81')+'">'+esc(st.msg)+'</span>'+
    (st.say?'<button onclick="kaboomSayAgain()" aria-label="Hear it again" style="width:56px;height:56px;flex:none;border-radius:50%;border:3px solid '+color+';background:#fff;color:'+color+';font-size:26px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center">\u{1F50A}</button>':'')+'</div>';
  const o=st.open, t=o?st.turns[o.t]:null, lock=st.lock;
  if(typeof gameCardShown==="function") gameCardShown(t);   // ⏱ CARDSECS: the card is on screen — its clock starts at the first paint
  if(t&&(!t.done||lock)){
    h+='<div style="margin:6px 0 12px"><span class="kb-card">'+_kbCardVis(st,t.pid,t.act)+'</span></div>';
    if(t.act==="say"&&t.gj&&typeof gameJudgeHtml==="function") h+=gameJudgeHtml(t,color,lock);   // ⚖️ GAMEJUDGE: the choices / the typing box / Mom's ✓ ✗
    else if(t.act==="say") h+='<div style="display:flex;justify-content:center"><button class="kb-btn" onclick="kaboomSaid()"'+(lock||t.done?' disabled':'')+' style="background:'+color+';color:#fff;font-size:20px;padding:18px 34px">\u{1F5E3} I said it</button></div>';
    else if(t.act==="type"){
      h+='<div style="display:flex;justify-content:center;margin-bottom:10px"><span style="min-width:120px;height:56px;border-radius:14px;border:3px solid '+color+';background:#fff;font-family:\'Fraunces\',serif;font-size:30px;font-weight:800;color:#292524;display:inline-flex;align-items:center;justify-content:center;padding:0 14px">'+esc(t.typed||"")+'</span></div>';
      h+='<div style="display:grid;grid-template-columns:repeat(3,64px);gap:8px;justify-content:center">';
      ["1","2","3","4","5","6","7","8","9","back","0","ok"].forEach(k=>{ if(k==="back") h+='<button class="kb-key" onclick="kaboomKey(\'back\')"'+(lock?' disabled':'')+' aria-label="Erase">\u{232B}</button>'; else if(k==="ok") h+='<button class="kb-key" onclick="kaboomCheck()"'+(lock||!t.typed?' disabled':'')+' style="background:'+color+';color:#fff;border-color:transparent" aria-label="Check">\u{2714}</button>'; else h+='<button class="kb-key" onclick="kaboomKey(\''+k+'\')"'+(lock?' disabled':'')+'>'+k+'</button>'; });
      h+='</div>';
    } else {
      h+='<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">';
      (t.opts||[]).forEach((op,i)=>{ const w=!!t.wrong[op]; h+='<button class="kb-opt'+(w?' kb-wrong':'')+'" onclick="kaboomPickTap('+i+')"'+(w||lock||t.done?' disabled':'')+'>'+esc(op)+'</button>'; });
      h+='</div>';
    }
  } else if(st.phase==="play"){
    // the jar: tap to draw. The sticks on top are just sticks — never which is next.
    const n=Math.min(8,st.jar.length); let sticks='';
    for(let i=0;i<n;i++) sticks+='<span class="kb-stick" style="height:'+(36+((i*7)%14))+'px"></span>';
    h+='<div style="margin:30px 0 6px"><button class="kb-jar'+(st.boomNow?' kb-boom':'')+'" onclick="kaboomDraw()"'+(lock||!st.jar.length?' disabled':'')+' aria-label="Draw a stick"><span class="kb-sticks">'+sticks+'</span><span class="kb-lbl">'+(st.boomNow?'\u{1F4A5} KABOOM!':'\u{1F3FA} Draw a stick')+'</span></button></div>';
  }
  if(st.phase!=="done"){
    h+='<div class="kb-pile" aria-label="Your pile">'+(st.pile.length?st.pile.map(p=>'<span class="kb-won">'+_kbCardVis(st,p,_kbAct(st,p))+'</span>').join(''):'<span style="font-size:12px;font-weight:700;color:var(--muted);align-self:center">your pile \u{2014} the sticks you keep</span>')+'</div>';
  }
  return h+'</div>';
}
// KABOOM_END
// HANGMAN_START — 🎈 "Hangman" from definitions (her go via the hub 2026-11-03; PLAN_practice_games_2026-10-23.md Tier 3 "Hangman /
// Crossword from definitions — spelling + vocab, demand PROD, the definitions map"). Of the two, Hangman is the one that fits a phone:
// one word, one cue, a letter pad; a crossword needs a grid wider than a phone. The kid sees the card's BACK (its definition / meaning /
// the family's own wording) and a row of blanks, and taps letters to find the FRONT — a vocabulary word, a root, a capital, a term.
// The word is produced letter by letter; the app never shows a spelling the kid has to produce: a word that is not found is never
// written out — "We'll come back to that one", and it comes back once at the end with fresh balloons. After HM_HINT misses a 🔊 "Hear
// it" appears (the word is SAID — hearing it is allowed, seeing it is not; not for a silent language). HM_MISSES balloons; each wrong
// letter pops one (no gallows — balloons). No lives beyond the balloons, no clock, no points.
//   Cards: a card in play whose front is a WORD (letters only after folding accents, spaces / hyphens / apostrophes allowed, HM_LEN_MIN..
//   HM_LEN_MAX letters, up to 3 words) with a text back that is not the front and does not contain it (a cue that spells the answer is
//   no cue). Never spelling / phonogram decks (Which one?'s rule), never a procedure card, never a number. A deck needs HM_MIN+ words;
//   a round is HM_ROUND; 🎲 Mix the decks. Readers at level middle / upper (dcLevel from the roster's grade — never a name).
// Writes (only these): <kid>_settings/match_best key "<deck> · hang" (words found, only when beaten) and the round's gameLog entry
//   (GAMELOG, game:"hang": ok = a CLEAN solve, n = wrong letters + 1, fail = not found, back = the come-back). NEVER touches the ladder — no
//   scores, no next_due, no study log. db && !_dryRun() only. Per-kid park / restore / resume through its GAMES_LIST entry (🎲 GAMEKIT).
//   A round dropped (Change deck, a kid switch) writes nothing. 🎮 GAMEGRID: its own column — gameDeckOn(kid,"hang",deck).
// ⚖️ HMCLEAN (games honesty audit §7 #10, her decision via the hub 2026-11-08: "Hangman counts first-try only for a clean solve"): a word
//   found eventually was logged ok:true however many letters missed, even after 🔊 Hear it SAID the word — "found eventually" read as
//   "knew it". Now `first` (= the log's ok) is true only when the word is found with no Hear it and at most HM_CLEAN wrong letters; a
//   hinted or 2+-miss solve is still found (the ding, "That's it!", it counts in "N of M words found" and the best) but logs ok:false.
//   The balloons and a failed word's come-back are unchanged.
let hangState=null;   // {kid,deck,mix,game:"hang",t0,turns:[{pid,word,cue,letters:[{ch,key}],guessed:{a:1},misses,wrong:{},done,found,first,fail,back,hint}],i,phase,first,of,isPB,prevBest,lock,seq,msg,returned:{},gameLogged}
let _hmRandom=Math.random;   // tests seed it
const HM_MIN=4, HM_ROUND=6, HM_MISSES=6, HM_HINT=3, HM_CLEAN=1, HM_LEN_MIN=3, HM_LEN_MAX=14, HM_BEAT=1100, HM_BEAT_FAIL=1800;
const HM_KEYS="abcdefghijklmnopqrstuvwxyz".split("");
function _hmItems(kid){ return (typeof _gamesItems==="function")?_gamesItems(kid||masteryKid):[]; }
function _hmShuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(_hmRandom()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function _hmPlain(s){ return (typeof _matchPlain==="function")?_matchPlain(s):String(s==null?"":s).replace(/<[^>]*>/g," ").replace(/&nbsp;/g," ").replace(/\s+/g," ").trim(); }
function hangDeckOn(kid,deck){ return (typeof _gdRaw!=="undefined"&&_gdRaw)||typeof gameDeckOn!=="function"||gameDeckOn(kid,"hang",deck); }
// A letter's key: accents folded (é → e, ä → a), lowercase; "" when it is not a plain letter
function hmFold(ch){ const f=String(ch||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase(); return /^[a-z]$/.test(f)?f:""; }
// PURE: the word's letters → [{ch,key}] (key "" for a space / hyphen / apostrophe, shown as is), or null when it can't be a Hangman word
function hmLetters(word){
  const w=_hmPlain(word); if(!w) return null;
  const out=[]; let n=0, words=1;
  for(const ch of w){
    if(ch===" "){ words++; out.push({ch:" ",key:""}); continue; }
    if(ch==="-"||ch==="\u2010"||ch==="'"||ch==="\u2019"){ out.push({ch:ch,key:""}); continue; }
    const k=hmFold(ch); if(!k) return null;
    out.push({ch:ch,key:k}); n++;
  }
  if(n<HM_LEN_MIN||n>HM_LEN_MAX||words>3) return null;
  const seen={}; let distinct=0; out.forEach(l=>{ if(l.key&&!seen[l.key]){ seen[l.key]=1; distinct++; } });
  return distinct>=2?out:null;
}
// The card's back as the cue: the family's own wording, the card's answer, else the definitions map. "" when there is none or it gives the word away.
function hmCue(kid,it){
  let b=""; try{ b=_hmPlain((typeof owRuleBack==="function")?owRuleBack(kid,it):it.answer); }catch(e){ b=_hmPlain(it&&it.answer); }
  if(!b){ try{ if(typeof mastGetDef==="function") b=_hmPlain(mastGetDef(kid,_hmPlain(it.prompt),it.subject)); }catch(e){} }
  if(!b||b.charAt(0)==="/") return "";
  const f=_hmPlain(it.prompt).toLowerCase(), bl=b.toLowerCase();
  if(bl===f||bl.indexOf(f)>=0) return "";   // the cue spells the answer
  return b;
}
function _hmLeftOut(it,kid){
  if(!it||(it.status!=="active"&&it.status!=="introduction")||it.dir==="prod") return true;
  try{ if(typeof _whichLeftOut==="function"&&_whichLeftOut(it,kid)) return true; }catch(e){}   // spelling / phonograms: the app never shows a spelling the child must produce
  try{ if(typeof mastKnowledgeType==="function"&&mastKnowledgeType(it)==="procedure_fluency") return true; }catch(e){}
  try{ if(typeof envtWaitsForCheckin==="function"&&envtWaitsForCheckin(kid,it.subject)) return true; }catch(e){}   // 📝 a station waiting for its check-in
  try{ if(typeof cpceHidItem==="function"&&cpceHidItem(kid,it)) return true; }catch(e){}   // 📚 CPCARDSEDIT
  try{ if(typeof cpSecOffItem==="function"&&cpSecOffItem(kid,it)) return true; }catch(e){}   // 🎚 CPSECTIONS
  return false;
}
// Readers at level middle / upper (3rd grade and up by the roster) — never a name
function hangLevelOk(kid){ if(typeof dcLevel!=="function") return true; try{ const l=dcLevel(kid); return l!=="little"&&l!=="early"; }catch(e){ return true; } }
// PURE: every word this kid can play → {deck:[{pid,word,cue}]} (one card per word), only decks with HM_MIN+ that are on
function hangPools(items,kid){
  kid=kid||masteryKid;
  const by={}, seen={};
  (items||[]).forEach(i=>{
    if(_hmLeftOut(i,kid)) return;
    const word=_hmPlain(i.prompt); if(!hmLetters(word)) return;
    const cue=hmCue(kid,i); if(!cue) return;
    const d=i.subject||"Other", k=d+"|"+word.toLowerCase(); if(seen[k]) return; seen[k]=1;
    (by[d]||(by[d]=[])).push({pid:i.id,word:word,cue:cue});
  });
  const out={}; Object.keys(by).sort().forEach(d=>{ if(by[d].length>=HM_MIN&&hangDeckOn(kid,d)) out[d]=by[d]; });
  return out;
}
function hangDecks(items,kid){ return Object.keys(hangPools(items,kid)); }   // the game's OWN deck list (the games-per-deck grid's preload asks this, raw)
function hangAvail(kid){ return hangLevelOk(kid)&&hangDecks(_hmItems(kid),kid).length>0; }
function hmTurn(c,back){ return {pid:c.pid,word:c.word,cue:c.cue,letters:hmLetters(c.word),guessed:{},misses:0,wrong:{},done:false,found:false,first:false,fail:false,back:!!back,hint:false}; }
function hangStart(deck){
  try{ if(typeof bbAudioUnlock==="function") bbAudioUnlock(); }catch(e){}   // the deck tap unlocks the ding / bonk (iPad)
  const pools=hangPools(_hmItems(),masteryKid), mix=deck===WHICH_MIX, names=Object.keys(pools);
  let cards=[]; if(mix) names.forEach(d=>{ cards=cards.concat(pools[d]); }); else cards=pools[deck]||[];
  if(cards.length<HM_MIN||(mix&&names.length<2)){ hangState=null; _mastRe(); return; }   // 🎮 GAMEGRID: a deck Mom turned off is not in pools
  const picks=_hmShuffle(cards.slice()).slice(0,HM_ROUND);
  hangState={kid:masteryKid,deck:deck,mix:mix,game:"hang",t0:Date.now(),turns:picks.map(c=>hmTurn(c,false)),i:0,phase:"play",first:0,of:picks.length,isPB:false,prevBest:null,lock:false,seq:0,msg:"",returned:{}};
  _mastRe();
}
function hangChangeDeck(){ hangState=null; _mastRe(); }   // drop the round as it stands: nothing written
function _hmCur(st){ return (st&&st.phase==="play"&&!st.lock)?st.turns[st.i]:null; }
// PURE: is every letter of the word revealed?
function hmSolved(t){ return t.letters.every(l=>!l.key||t.guessed[l.key]); }
// ⚖️ HMCLEAN — PURE: a solve counts as a first try only when it was clean: no 🔊 Hear it, at most HM_CLEAN wrong letters
function hmClean(t){ return !!t&&!t.hint&&(t.misses||0)<=HM_CLEAN; }
// PURE: one letter → "hit" | "miss" | "solved" | "fail" | null (already guessed / not a letter)
function hmJudge(t,key){
  key=hmFold(key); if(!key||t.done||t.guessed[key]) return null;
  if(typeof gameCardAnswered==="function") gameCardAnswered(t);   // ⏱ CARDSECS: the first answer on this card stops its clock
  t.guessed[key]=1;
  if(t.letters.some(l=>l.key===key)){ if(hmSolved(t)){ t.done=true; t.found=true; t.first=hmClean(t); return "solved"; } return "hit"; }
  t.misses++; t.wrong[key]=1;
  if(t.misses>=HM_MISSES){ t.done=true; t.first=false; t.fail=true; return "fail"; }
  return "miss";
}
function _hmSilent(st,t){ try{ const it=_hmItems(st.kid).find(x=>x&&x.id===t.pid); return typeof whichSilent==="function"&&whichSilent(it); }catch(e){ return false; } }
function _hmSay(st,t){ if(_hmSilent(st,t)) return; if(typeof mastView==="undefined"||mastView==="hang") try{ mastSpeak(t.word); }catch(e){} }
function hangGuess(key){
  const st=hangState, t=_hmCur(st); if(!t||t.done) return;
  const r=hmJudge(t,key); if(!r) return;
  if(r==="hit"){ try{ matchDing(); }catch(e){} st.msg="hit"; _mastRe(); return; }
  if(r==="miss"){ try{ matchBonk(); }catch(e){} st.msg="miss"; _mastRe(); return; }
  if(r==="solved"){ if(!t.back) st.first++; try{ matchDing(); }catch(e){} st.msg="solved"; _hmSay(st,t); }
  else {
    try{ matchBonk(); }catch(e){}
    st.msg="fail";   // the word is never written out
    if(!t.back&&!st.returned[t.pid]){ st.returned[t.pid]=1; st.turns.push(hmTurn(t,true)); }   // back once, at the end, with fresh balloons
  }
  st.lock=true; const seq=++st.seq;
  _mastRe();
  setTimeout(()=>{ if(hangState===st&&st.lock&&st.seq===seq) hangNext(st); },r==="fail"?HM_BEAT_FAIL:HM_BEAT);   // GAMEKID: never advances a parked / settled turn
}
// 🔊 Hear it — after HM_HINT misses the word may be SAID (never shown); not for a silent language
function hangHear(){ const st=hangState, t=_hmCur(st); if(!t||t.done||t.misses<HM_HINT||_hmSilent(st,t)) return; t.hint=true; try{ mastSpeak(t.word); }catch(e){} }
function _hmStep(st){ st.lock=false; st.msg=""; st.i++; if(st.i>=st.turns.length) hangFinish(st); }
function hangNext(st){ st=st||hangState; if(!st||st!==hangState) return; _hmStep(st); _mastRe(); }
function hangBestKey(deck){ return deck+" \u{00B7} hang"; }
function hangFinish(st){
  st.phase="done"; st.lock=false;
  const kid=st.kid||masteryKid;   // GAMEKID
  try{ if(typeof gameLogRound==="function") gameLogRound(st); }catch(e){}   // 🎮 GAMELOG: every word's result, game:"hang" (ok = a clean solve — ⚖️ HMCLEAN)
  const s=masteryData[kid+"_settings"]||(masteryData[kid+"_settings"]={});
  if(!s.match_best) s.match_best={};
  const key=hangBestKey(st.deck), prev=s.match_best[key];
  st.prevBest=prev==null?null:prev;
  st.isPB=st.first>0&&(prev==null||st.first>prev);
  if(st.isPB){
    s.match_best[key]=st.first;
    if(db&&!_dryRun()) db.ref("mastery/"+kid+"_settings/match_best").update({[(typeof haKey==="function"?haKey(key):key)]:st.first});   // this key only
    try{HA_LS.setItem("ha_mastery",JSON.stringify(masteryData));}catch(e){}
  }
  try{ if(st.of>0&&st.first===st.of&&typeof _showCelebration==="function"&&document.getElementById("celeb-overlay")) _showCelebration(kid,"\u{1F388} You found every word!",{noSong:true}); }catch(e){}
}
// GAMEKID → 🎲 GAMEKIT resume: a beat that was mid-way when the kid switched settles here (no render; the caller renders)
function hangResume(){ const st=hangState; if(!st||st.phase!=="play") return; if(st.lock) _hmStep(st); }
const HM_CSS='<style>.hm-word{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;row-gap:12px;margin:14px 0}.hm-box{width:30px;height:40px;border-bottom:3px solid #a8a29e;display:inline-flex;align-items:flex-end;justify-content:center;font-family:\'Fraunces\',serif;font-size:26px;font-weight:800;color:#292524;line-height:1}'+
  '.hm-box.hm-on{border-color:#16a34a;color:#15803d}.hm-box.hm-gap{border:none;width:14px}.hm-box.hm-mark{border:none;width:14px;color:#78716c}@media(min-width:560px){.hm-box{width:36px;height:46px;font-size:30px}}'+
  '.hm-balloons{display:flex;justify-content:center;gap:6px;font-size:28px;line-height:1;margin:6px 0}.hm-balloons span{transition:opacity .2s,transform .2s}.hm-balloons .hm-pop{opacity:.25;transform:scale(.7)}'+
  '.hm-cue{padding:14px 16px;border-radius:18px;background:#f8f7f4;border:2px solid #e2ddd6;font-size:17px;font-weight:700;color:#292524;text-align:center;line-height:1.35}'+
  '.hm-pad{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;max-width:420px;margin:12px auto 0}.hm-key{height:46px;border-radius:12px;border:2px solid #e2ddd6;background:#fff;font-family:\'DM Sans\',sans-serif;font-size:19px;font-weight:800;color:#292524;cursor:pointer;text-transform:uppercase;-webkit-tap-highlight-color:transparent;padding:0}'+
  '.hm-key[disabled]{cursor:default}.hm-key.hm-used{opacity:.3}.hm-key.hm-good{border-color:#86efac;background:#f0fdf4;color:#15803d;opacity:.8}'+
  '.hm-btn{padding:12px 22px;border-radius:999px;border:none;font-size:16px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif;-webkit-tap-highlight-color:transparent}.hm-btn[disabled]{opacity:.45;cursor:default}'+
  '.hm-ghost{padding:8px 14px;border-radius:999px;border:1.5px solid #e2ddd6;background:#fff;color:#57534e;font-size:13px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif}</style>';
function buildHangHtml(color){
  const q=s=>String(s).replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,"&quot;");
  let h=HM_CSS+'<div style="padding:4px 14px 24px;max-width:720px;margin:0 auto">';
  const items=_hmItems(), pools=hangPools(items), decks=Object.keys(pools);
  if(!decks.length){ h+='<div class="mast-none">No decks ready for Hangman yet \u{2014} it needs '+HM_MIN+' or more word cards with a meaning on the back.</div></div>'; return h; }
  const st=hangState;
  const chip=(dk,lbl)=>{ const sel=st&&st.deck===dk; return '<button onclick="hangStart(\''+q(dk)+'\')" style="padding:10px 16px;border-radius:999px;font-size:14px;font-weight:800;border:2px solid '+(sel?color:'#e2ddd6')+';background:'+(sel?color:'#fff')+';color:'+(sel?'#fff':'#57534e')+';cursor:pointer;font-family:\'DM Sans\',sans-serif">'+lbl+'</button>'; };
  if(!st||st.phase==="done"){
    h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 14px">';
    decks.forEach(dk=>{ h+=chip(dk,esc(dk)+' <span style="opacity:.7;font-weight:700">'+pools[dk].length+'</span>'); });
    if(decks.length>1) h+=chip(WHICH_MIX,"\u{1F3B2} "+WHICH_MIX);
    h+='</div>';
  }
  if(!st){ h+='<div style="font-size:15px;font-weight:700;color:#57534e">\u{1F388} Pick a deck. Read the meaning, then tap letters to find the word before the balloons are gone!</div></div>'; return h; }
  const s=masteryData[st.kid+"_settings"]||{}, best=(s.match_best||{})[hangBestKey(st.deck)];
  if(st.phase==="play"){
    const t=st.turns[st.i], m=st.msg, silent=_hmSilent(st,t);
    if(typeof gameCardShown==="function") gameCardShown(t);   // ⏱ CARDSECS: the card is on screen — its clock starts at the first paint
    h+='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0 4px"><div style="display:flex;gap:6px;flex-wrap:wrap">';
    st.turns.forEach((x,ix)=>{ const cur=ix===st.i; h+='<span style="width:14px;height:14px;border-radius:50%;display:inline-block;'+(x.done?'background:'+(x.first?'#16a34a':'#f59e0b'):cur?'background:#fff;border:3px solid '+color:'background:#e7e5e4')+'"></span>'; });
    h+='</div><span style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--muted)">'+esc(st.deck)+(best!=null?' \u{00B7} \u{1F3C6} '+best:'')+
      '<button onclick="hangChangeDeck()" style="padding:6px 12px;border-radius:999px;border:1.5px solid #e2ddd6;background:#fff;color:#57534e;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap;font-family:\'DM Sans\',sans-serif">\u{1F5C2} Change deck</button></span></div>';
    h+='<div class="hm-balloons" aria-label="'+(HM_MISSES-t.misses)+' balloons left">'; for(let i=0;i<HM_MISSES;i++) h+='<span class="'+(i<t.misses?'hm-pop':'')+'">'+(i<t.misses?'\u{1F4A8}':'\u{1F388}')+'</span>'; h+='</div>';
    h+='<div class="hm-cue">'+(t.back?'<div style="font-size:12px;font-weight:800;color:#b45309;margin-bottom:4px">ONE MORE TIME</div>':'')+esc(t.cue)+'</div>';
    h+='<div class="hm-word" aria-label="'+t.letters.filter(l=>l.key).length+' letters">';
    t.letters.forEach(l=>{ if(!l.key) h+='<span class="hm-box '+(l.ch===" "?'hm-gap':'hm-mark')+'">'+(l.ch===" "?'':esc(l.ch))+'</span>'; else h+='<span class="hm-box'+(t.guessed[l.key]?' hm-on':'')+'">'+(t.guessed[l.key]?esc(l.ch):'')+'</span>'; });
    h+='</div>';
    h+='<div style="text-align:center;font-size:16px;font-weight:800;color:'+(m==="solved"?'#16a34a':m==="fail"?'#b45309':m==="miss"?'#b45309':'#57534e')+';margin:4px 0 6px;min-height:22px">'+
      (m==="solved"?'\u{2705} That\u2019s it!':m==="fail"?'We\u2019ll come back to that one.':m==="miss"?'Pop! Not that one.':m==="hit"?'Yes!':'Tap a letter')+'</div>';
    if(!silent&&t.misses>=HM_HINT&&!t.done) h+='<div style="display:flex;justify-content:center;margin-bottom:4px"><button class="hm-ghost" onclick="hangHear()"'+(st.lock?' disabled':'')+'>\u{1F50A} Hear it</button></div>';
    h+='<div class="hm-pad">';
    HM_KEYS.forEach(k=>{ const used=!!t.guessed[k], good=used&&t.letters.some(l=>l.key===k); h+='<button class="hm-key'+(used?(good?' hm-good':' hm-used'):'')+'" onclick="hangGuess(\''+k+'\')"'+(used||st.lock||t.done?' disabled':'')+' aria-label="'+k.toUpperCase()+'">'+k+'</button>'; });
    h+='</div>';
    return h+'</div>';
  }
  // Finish: words found against the kid's own best, Play again / Mix the decks. No word is written out.
  h+='<div style="margin-top:6px;text-align:center;padding:16px;border-radius:18px;background:'+(st.isPB?'#f0fdf4':'#f8f7f4')+';border:2px solid '+(st.isPB?'#16a34a':'#e2ddd6')+'">';
  h+='<div style="font-family:\'Fraunces\',serif;font-size:22px;font-weight:800">\u{1F389} '+(st.first===st.of?'You found every word!':'Round over!')+'</div>';
  h+='<div style="font-size:17px;font-weight:800;color:#57534e;margin-top:10px">\u{1F388} '+st.first+' of '+st.of+' words found'+(st.isPB?' \u{2014} \u{1F3C6} new best!':(st.prevBest!=null?' \u{00B7} best '+st.prevBest:''))+'</div>';
  h+='<div style="display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap">';
  h+='<button onclick="hangStart(\''+q(st.deck)+'\')" class="hm-btn" style="background:'+color+';color:#fff;font-size:15px">\u{1F501} Play again</button>';
  if(decks.length>1&&!st.mix) h+='<button onclick="hangStart(\''+q(WHICH_MIX)+'\')" class="hm-btn" style="border:2px solid '+color+';background:#fff;color:'+color+';font-size:15px">\u{1F3B2} '+WHICH_MIX+'</button>';
  return h+'</div></div></div>';
}
// HANGMAN_END
// NAMEALL_START — 📋 "Name all N" (her go via the hub 2026-11-03; PLAN_practice_games_2026-10-23.md Tier 4 "Name all N (Sporcle): name the
// 13 colonies / all 14 Greek roots in this deck against a timer, typed — demand FR + FLU; deck with ≥10 items"). The Sporcle shape: a title
// ("Name all 7 World Geography cards" / "Name all 3 Roots that mean write"), a row of N blank slots, a clock counting DOWN, one typing box.
// A name typed and entered fills its slot (the card's own spelling); the count climbs "4 of 7"; nothing is listed, hinted or auto-completed.
// When the clock runs out, every slot is named or the kid taps "I'm done", the round is over: the slots that stayed blank stay blank, grey
// (NAOFF 2026-11-08: no reveal — the finish list was the next round's answer key, since "Play again" asks the same list; the app never
// supplies what a child must produce), and the finish shows named N of M against the kid's own best. Brain Dump is the long form (10+ cards, 5 minutes, misses re-asked); this is the short, quick one: SMALL lists —
//   · a whole deck of NA_MIN..NA_MAX nameable cards (a word or short phrase front: dumpNameable — never a sentence, a math fact, a rule's
//     example line; spelling / phonograms stay out, Which one?'s rule). No back needed: the list's title is the cue.
//   · a CATEGORY inside a deck: NA_CAT_MIN..NA_MAX cards that share one back ("Roots · write": graph, scrib; "Math? no — numbers are not
//     names). The shared back is the title; a back longer than NA_CAT_LABEL letters is no title.
//   Matching is Brain Dump's (dumpMatch: the Study Session's normalizer, a letter of slack, the article / a trailing "(…)" left off).
//   Clock: NA_PER seconds a card, never under NA_SECS_MIN. Time while the kid is switched away (GAMEKID park) is not play time.
//   🏁 NAOFF (games honesty audit #15, 2026-11-08): nor is time while the round is NOT ON SCREEN — another view or game, another tab, the
//   tablet asleep — the clock pauses (st.offAt) and picks up where it was on return, so a round left open no longer runs to 0:00 and
//   logs every card as a miss. A round that ends with NOTHING named is not logged at all (it says so, kindly); it isn't a fair test.
//   Level middle / upper only (dcLevel from the roster's grade — never a name). No lives, no points, no score against the kid.
// Writes (only these): <kid>_settings/match_best key "<list> · nameall" (most named, only when beaten; Firebase's illegal key characters
//   swapped for _) and the round's gameLog entry (GAMELOG, game:"nameall": a card named = ok, missed = wrong; none when 0 named). NEVER the ladder — no
//   scores, no next_due, no study log. db && !_dryRun() only. Per-kid park / restore / resume through its GAMES_LIST entry (🎲 GAMEKIT).
//   A round dropped (Change list, a kid switch) writes nothing. 🎮 GAMEGRID: its own column — gameDeckOn(kid,"nameall",deck) (a
//   category follows its deck's cell); the entry's decks(k) = the real decks the lists come from.
let nameallState=null;   // {kid,deck,list,title,game:"nameall",t0,secs,pausedTotal,pausedAt,offAt,cards:[{pid,front}],named:{pid:{how,text}},typed:[{text,pid,how}],turns,phase:"play"|"done",count,of,isPB,prevBest,gameLogged}
const NA_MIN=5, NA_MAX=15, NA_CAT_MIN=3, NA_CAT_LABEL=40, NA_PER=12, NA_SECS_MIN=60;
function _naItems(kid){ return (typeof _gamesItems==="function")?_gamesItems(kid||masteryKid):[]; }
function _naPlain(s){ return (typeof _matchPlain==="function")?_matchPlain(s):String(s==null?"":s).replace(/<[^>]*>/g," ").replace(/&nbsp;/g," ").replace(/\s+/g," ").trim(); }
function _naE(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function _naQ(s){ return String(s==null?"":s).replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,"&quot;"); }
function _naNorm(s){ return (typeof dumpNorm==="function")?dumpNorm(s):_naPlain(s).toLowerCase(); }
function nameallDeckOn(kid,deck){ return (typeof _gdRaw!=="undefined"&&_gdRaw)||typeof gameDeckOn!=="function"||gameDeckOn(kid,"nameall",deck); }
function _naLeftOut(it,kid){
  if(!it||(it.status!=="active"&&it.status!=="introduction")||it.dir==="prod") return true;
  try{ if(typeof _whichLeftOut==="function"&&_whichLeftOut(it,kid)) return true; }catch(e){}   // spelling / phonograms
  try{ if(typeof mastKnowledgeType==="function"&&mastKnowledgeType(it)==="procedure_fluency") return true; }catch(e){}
  try{ if(typeof envtWaitsForCheckin==="function"&&envtWaitsForCheckin(kid,it.subject)) return true; }catch(e){}   // 📝 a station waiting for its check-in
  try{ if(typeof cpceHidItem==="function"&&cpceHidItem(kid,it)) return true; }catch(e){}   // 📚 CPCARDSEDIT
  try{ if(typeof cpSecOffItem==="function"&&cpSecOffItem(kid,it)) return true; }catch(e){}   // 🎚 CPSECTIONS
  return false;
}
// The card's back as a category title: the family's own wording, the card's answer; "" when none, the front, a sound, or too long
function _naBack(kid,it){
  let b=""; try{ b=_naPlain((typeof owRuleBack==="function")?owRuleBack(kid,it):it.answer); }catch(e){ b=_naPlain(it&&it.answer); }
  if(!b||b.charAt(0)==="/"||b.length>NA_CAT_LABEL||_naNorm(b)===_naNorm(it.prompt)) return "";
  return b;
}
function nameallLevelOk(kid){ if(typeof dcLevel!=="function") return true; try{ const l=dcLevel(kid); return l!=="little"&&l!=="early"; }catch(e){ return true; } }
// PURE: every list this kid can play → [{key,deck,title,label,cards:[{pid,front}]}] — whole small decks first, then the categories, both by name
function nameallLists(items,kid){
  kid=kid||masteryKid;
  if(typeof dumpNameable!=="function"||typeof dumpMatch!=="function") return [];
  const by={}, seen={};
  (items||[]).forEach(i=>{
    if(_naLeftOut(i,kid)) return;
    const front=_naPlain(i.prompt); if(!dumpNameable(front)) return;
    const d=i.subject||"Other", k=d+"|"+_naNorm(front); if(!k||seen[k]) return; seen[k]=1;
    (by[d]||(by[d]=[])).push({pid:i.id,front:front,back:_naBack(kid,i)});
  });
  const out=[];
  Object.keys(by).sort().forEach(d=>{
    if(!nameallDeckOn(kid,d)) return;   // 🎮 GAMEGRID
    const cards=by[d], whole=cards.length>=NA_MIN&&cards.length<=NA_MAX;
    if(whole) out.push({key:d,deck:d,title:"Name all "+cards.length+" "+d+" cards",label:d,cards:cards.map(c=>({pid:c.pid,front:c.front}))});
    const cat={}; cards.forEach(c=>{ if(!c.back) return; const bk=_naNorm(c.back); (cat[bk]||(cat[bk]={label:c.back,cards:[]})).cards.push({pid:c.pid,front:c.front}); });
    Object.keys(cat).sort().forEach(bk=>{ const g=cat[bk]; if(g.cards.length>=NA_CAT_MIN&&g.cards.length<=NA_MAX&&!(whole&&g.cards.length===cards.length)) out.push({key:d+" \u00B7 "+g.label,deck:d,title:"Name all "+g.cards.length+" "+d+" cards that mean \u201C"+g.label+"\u201D",label:d+" \u00B7 "+g.label,cards:g.cards}); });
  });
  return out;
}
function nameallDecks(items,kid){ const o={}; nameallLists(items,kid).forEach(l=>{ o[l.deck]=1; }); return Object.keys(o).sort(); }   // the real decks (the games-per-deck grid's preload asks this, raw)
function nameallAvail(kid){ return nameallLevelOk(kid)&&nameallLists(_naItems(kid),kid).length>0; }
function nameallSecs(n){ return Math.max(NA_SECS_MIN,n*NA_PER); }
function nameallElapsed(st,now){ now=now!=null?now:Date.now(); return Math.max(0,now-st.t0-(st.pausedTotal||0)-(st.pausedAt?now-st.pausedAt:0)-(st.offAt?now-st.offAt:0)); }
// 🏁 NAOFF: is the round on screen? Its clock is in the page and the page isn't hidden (another tab, the tablet asleep).
function nameallShowing(){ try{ if(typeof document==="undefined") return true; if(document.hidden) return false; return !!document.getElementById("na-clock"); }catch(e){ return true; } }
// 🏁 NAOFF: the round went off screen → the clock stops here (the tick folds it back in when the round shows again)
function nameallOffCheck(){ const st=nameallState; if(st&&st.phase==="play"&&!st.pausedAt&&!st.offAt&&!nameallShowing()) st.offAt=Date.now(); }
function _naFoldOff(st,now){ if(st&&st.offAt){ st.pausedTotal=(st.pausedTotal||0)+Math.max(0,(now!=null?now:Date.now())-st.offAt); st.offAt=null; } }
function nameallLeft(st,now){ return Math.max(0,st.secs*1000-nameallElapsed(st,now)); }
function nameallClock(ms){ const s=Math.ceil(ms/1000); return Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); }
function nameallStart(key){
  try{ if(typeof bbAudioUnlock==="function") bbAudioUnlock(); }catch(e){}   // the tap unlocks the ding (iPad)
  const l=nameallLists(_naItems(),masteryKid).find(x=>x.key===key);
  if(!l){ nameallState=null; _mastRe(); return; }   // 🎮 GAMEGRID: a deck Mom turned off is not listed
  nameallState={kid:masteryKid,deck:l.key,list:l.deck,title:l.title,game:"nameall",t0:Date.now(),secs:nameallSecs(l.cards.length),pausedTotal:0,pausedAt:null,offAt:null,cards:l.cards.slice(),named:{},typed:[],turns:[],phase:"play",count:0,of:l.cards.length,isPB:false,prevBest:null,gameLogged:false};
  try{ if(typeof window!=="undefined"&&!window._naVis&&typeof document!=="undefined"&&typeof document.addEventListener==="function"){ window._naVis=1; document.addEventListener("visibilitychange",nameallOffCheck); } }catch(e){}   // 🏁 NAOFF: the tablet sleeping / the tab hidden stops the clock (the tick may not run then)
  _mastRe(); nameallTick(nameallState); nameallFocus();
}
function nameallChangeList(){ nameallState=null; _mastRe(); }   // drop the round as it stands: nothing written
function nameallFocus(){ try{ setTimeout(()=>{ const e=document.getElementById("na-in"); if(e) e.focus(); },0); }catch(e){} }
// The countdown: updates #na-clock each second; ends the round at zero. Clears itself once its round is parked or over.
// 🏁 NAOFF: while the round is off screen it keeps ticking but holds the clock (offAt); back on screen, the time away is folded out.
function nameallTick(st){
  if(typeof setInterval!=="function") return;
  if(window._naTick) clearInterval(window._naTick);
  window._naTick=setInterval(()=>{
    if(nameallState!==st||st.phase!=="play"||st.pausedAt){ clearInterval(window._naTick); window._naTick=null; return; }
    if(!nameallShowing()){ if(!st.offAt) st.offAt=Date.now(); return; }
    _naFoldOff(st);
    const left=nameallLeft(st);
    if(left<=0){ clearInterval(window._naTick); window._naTick=null; nameallStop(st); return; }
    const el=document.getElementById("na-clock"); if(el){ el.textContent=nameallClock(left); if(left<=10000) el.style.color="#b91c1c"; }
  },1000);
}
// PURE over the state: one entered name → "hit" | "close" | "dup" | "miss" | "" (blank)
function nameallEnter(st,text){
  const raw=_naPlain(text); if(!raw||st.phase!=="play") return "";
  const m=dumpMatch(raw,st.cards,st.named);
  if(!m){ if(!st.typed.some(x=>x.pid==null&&_naNorm(x.text)===_naNorm(raw))) st.typed.push({text:raw,pid:null,how:"miss"}); return "miss"; }
  if(m.how==="dup") return "dup";
  st.named[m.card.pid]={how:m.how,text:raw}; st.typed.push({text:raw,pid:m.card.pid,how:m.how}); st.count++;
  return m.how;
}
function nameallAdd(){
  const st=nameallState; if(!st||st.phase!=="play") return;
  const el=document.getElementById("na-in"), text=el?el.value:"";
  const r=nameallEnter(st,text);
  if(el) el.value="";
  if(r==="hit"||r==="close"){ try{ matchDing(); }catch(e){} }
  else if(r==="miss"){ try{ matchBonk(); }catch(e){} }
  // In place when the round is on screen (a re-render would drop the keyboard on an iPad); else the normal redraw.
  const slots=document.getElementById("na-slots"), cnt=document.getElementById("na-count"), note=document.getElementById("na-note");
  if(slots&&cnt&&note){
    if(r==="hit"||r==="close"){ const x=st.typed[st.typed.length-1], ix=st.cards.findIndex(c=>c.pid===x.pid), s=slots.children[ix]; if(s){ s.className="na-slot na-on"; s.textContent=st.cards[ix].front; } cnt.textContent=st.count+" of "+st.of; }
    note.textContent=r==="miss"?"\u201C"+_naPlain(text)+"\u201D is not on this list":r==="dup"?"Already named!":"";
  } else _mastRe();
  if(st.count>=st.of){ nameallStop(st); return; }
  nameallFocus();
}
// "I'm done" / the clock / every slot named: the round is over — the cards' results, then the finish (no re-ask: Brain Dump has that)
function nameallStop(st){
  st=st||nameallState; if(!st||st.phase!=="play") return;
  if(typeof window!=="undefined"&&window._naTick){ clearInterval(window._naTick); window._naTick=null; }
  _naFoldOff(st);   // 🏁 NAOFF
  st.turns=st.cards.map(c=>({pid:c.pid,done:true,first:!!st.named[c.pid],wrong:st.named[c.pid]?{}:{1:1},back:false}));
  nameallFinish(st); _mastRe();
}
function nameallBestKey(list){ return (list+" \u{00B7} nameall").replace(/[.#$\/\[\]]/g,"_"); }   // a category's back may carry a period: Firebase forbids it in a key
function nameallFinish(st){
  st.phase="done";
  const kid=st.kid||masteryKid;   // GAMEKID
  if(st.count>0){ try{ if(typeof gameLogRound==="function") gameLogRound(st); }catch(e){} }   // 🎮 GAMELOG: every card's result, game:"nameall"
  else st.unlogged=true;   // 🏁 NAOFF: nothing named → nothing logged (a round left or given up isn't a test of the cards)
  const s=masteryData[kid+"_settings"]||(masteryData[kid+"_settings"]={});
  if(!s.match_best) s.match_best={};
  const key=nameallBestKey(st.deck), prev=s.match_best[key];
  st.prevBest=prev==null?null:prev;
  st.isPB=st.count>0&&(prev==null||st.count>prev);
  if(st.isPB){
    s.match_best[key]=st.count;
    if(db&&!_dryRun()) db.ref("mastery/"+kid+"_settings/match_best").update({[(typeof haKey==="function"?haKey(key):key)]:st.count});   // this key only
    try{HA_LS.setItem("ha_mastery",JSON.stringify(masteryData));}catch(e){}
  }
  try{ if(st.of>0&&st.count===st.of&&typeof _showCelebration==="function"&&document.getElementById("celeb-overlay")) _showCelebration(kid,"\u{1F4CB} You named them all!",{noSong:true}); }catch(e){}
}
// 🎲 GAMEKIT: park / restore / resume. Time away is not play time (no render here; the caller renders).
function nameallPark(){ const st=nameallState; if(st&&st.phase==="play"&&!st.pausedAt){ st.pausedAt=st.offAt||Date.now(); st.offAt=null; } return st; }   // 🏁 NAOFF: already off screen → the park began then
function nameallRestore(v){ nameallState=v||null; const st=nameallState; if(st&&st.pausedAt){ st.pausedTotal=(st.pausedTotal||0)+(Date.now()-st.pausedAt); st.pausedAt=null; } }
function nameallResume(){ const st=nameallState; if(st&&st.phase==="play"&&(typeof mastView==="undefined"||mastView==="nameall")) nameallTick(st); }
const NA_CSS='<style>.na-slots{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;margin:12px 0}.na-slot{min-height:42px;border-radius:12px;border:2px dashed #d6d3d1;background:#fafaf9;display:flex;align-items:center;justify-content:center;padding:6px 8px;font-size:14px;font-weight:800;color:#292524;text-align:center;overflow-wrap:anywhere;line-height:1.15}'+
  '.na-slot.na-on{border-style:solid;border-color:#16a34a;background:#f0fdf4;color:#15803d}.na-slot.na-miss{border-style:solid;border-color:#e2ddd6;background:#fff;color:#a8a29e}'+
  '.na-in{width:100%;box-sizing:border-box;padding:14px 16px;border-radius:14px;border:3px solid #e2ddd6;font-size:20px;font-family:\'DM Sans\',sans-serif;outline:none}.na-in:focus{border-color:#0ea5e9}'+
  '.na-btn{padding:12px 22px;border-radius:999px;border:none;color:#fff;font-size:15px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif}.na-btn[disabled]{opacity:.45;cursor:default}'+
  '.na-ghost{padding:10px 16px;border-radius:999px;border:1.5px solid #e2ddd6;background:#fff;color:#57534e;font-size:13px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif}'+
  '.na-chip{padding:10px 14px;border-radius:999px;font-size:14px;font-weight:800;border:2px solid #e2ddd6;background:#fff;color:#57534e;cursor:pointer;font-family:\'DM Sans\',sans-serif;text-align:left;line-height:1.2}</style>';
function buildNameallHtml(color){
  let h=NA_CSS+'<div style="padding:4px 14px 24px;max-width:720px;margin:0 auto">';
  const lists=nameallLists(_naItems(),masteryKid);
  if(!lists.length){ h+='<div class="mast-none">No lists ready for Name all yet \u{2014} it needs a small deck of '+NA_MIN+' to '+NA_MAX+' named cards, or '+NA_CAT_MIN+' or more cards that share one answer.</div></div>'; return h; }
  const st=nameallState;
  if(!st||st.phase==="done"){
    h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 14px">';
    lists.forEach(l=>{ const sel=st&&st.deck===l.key; h+='<button class="na-chip" onclick="nameallStart(\''+_naQ(l.key)+'\')" style="'+(sel?'border-color:'+color+';background:'+color+';color:#fff':'')+'">'+_naE(l.label)+' <span style="opacity:.7;font-weight:700">'+l.cards.length+'</span></button>'; });
    h+='</div>';
  }
  if(!st){ h+='<div style="font-size:15px;font-weight:700;color:#57534e">\u{1F4CB} Pick a list, then name every card on it before the clock runs out \u{2014} one at a time, Enter after each.</div></div>'; return h; }
  const s=masteryData[st.kid+"_settings"]||{}, best=(s.match_best||{})[nameallBestKey(st.deck)];
  if(st.phase==="play"){
    if(typeof window!=="undefined"&&!window._naTick&&!st.pausedAt) nameallTick(st);   // back on screen (another view, a parked kid): the clock ticks again
    const left=nameallLeft(st);
    h+='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0 10px;flex-wrap:wrap"><div style="font-family:\'Fraunces\',serif;font-size:20px;font-weight:800;color:#292524">'+_naE(st.title)+'</div>'+
      '<span style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--muted)">'+(best!=null?'\u{1F3C6} '+best:'')+'<button class="na-ghost" onclick="nameallChangeList()">\u{1F5C2} Change list</button></span></div>';
    h+='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><span id="na-count" style="font-size:17px;font-weight:800;color:'+color+'">'+st.count+' of '+st.of+'</span><span id="na-clock" style="font-family:\'Fraunces\',serif;font-size:22px;font-weight:800;color:'+(left<=10000?'#b91c1c':'#292524')+'">\u{23F1} '+nameallClock(left)+'</span></div>';
    h+='<div style="display:flex;gap:8px;align-items:center"><input id="na-in" class="na-in" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Type one, press Enter" aria-label="A name you remember" onkeydown="if(event.key===\'Enter\'){event.preventDefault();nameallAdd();}">'+
      '<button class="na-btn" style="background:'+color+'" onclick="nameallAdd()">Add</button></div>';
    h+='<div id="na-note" style="min-height:20px;font-size:13px;font-weight:700;color:#78716c;margin-top:6px"></div>';
    h+='<div id="na-slots" class="na-slots">';
    st.cards.forEach((c,i)=>{ const n=st.named[c.pid]; h+='<div class="na-slot'+(n?' na-on':'')+'" aria-label="Slot '+(i+1)+'">'+(n?_naE(c.front):'')+'</div>'; });
    h+='</div>';
    h+='<div style="display:flex;justify-content:center"><button class="na-ghost" onclick="nameallStop()">\u{2714} I\u{2019}m done</button></div>';
    return h+'</div>';
  }
  // Finish: the slots as they ended (the named ones in green; the missed ones stay blank — 🏁 NAOFF, no answer key), named N of M, Play again.
  h+='<div style="margin-top:6px;text-align:center;padding:16px;border-radius:18px;background:'+(st.isPB?'#f0fdf4':'#f8f7f4')+';border:2px solid '+(st.isPB?'#16a34a':'#e2ddd6')+'">';
  if(st.count===0) h+='<div style="font-family:\'Fraunces\',serif;font-size:22px;font-weight:800">\u{1F331} Not this time \u{2014} that\u{2019}s okay!</div>'+
    '<div id="na-unsaved" style="font-size:14px;font-weight:700;color:#57534e;margin-top:6px">Nothing was named, so this round isn\u{2019}t saved. Look over your '+_naE(st.list)+' cards, then try again.</div>';
  else h+='<div style="font-family:\'Fraunces\',serif;font-size:22px;font-weight:800">\u{1F389} You named '+st.count+' of '+st.of+(st.isPB?' \u{2014} \u{1F3C6} new best!':(st.prevBest!=null?' \u{00B7} best '+st.prevBest:''))+'</div>';
  h+='<div style="font-size:12px;font-weight:700;color:var(--muted);margin-top:4px">'+_naE(st.title)+' \u{00B7} '+nameallClock(Math.min(st.secs*1000,nameallElapsed(st)))+' used</div>';
  h+='<div class="na-slots" style="text-align:left">';
  st.cards.forEach(c=>{ const n=st.named[c.pid]; h+='<div class="na-slot '+(n?'na-on':'na-miss')+'">'+(n?'\u2713 '+_naE(c.front):'?')+'</div>'; });
  h+='</div>';
  if(st.count>0&&st.count<st.of) h+='<div style="font-size:13px;font-weight:700;color:#78716c;margin-top:4px">'+(st.of-st.count)+' more to find \u{2014} they\u{2019}re in your '+_naE(st.list)+' cards.</div>';
  const outside=st.typed.filter(x=>x.pid==null);
  if(outside.length) h+='<div style="text-align:left;font-size:12px;font-weight:700;color:#a8a29e;margin-top:4px">Not on this list: '+outside.map(x=>_naE(x.text)).join(", ")+'</div>';
  h+='<div style="display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap"><button class="na-btn" style="background:'+color+'" onclick="nameallStart(\''+_naQ(st.deck)+'\')">\u{1F501} Play again</button></div>';
  return h+'</div></div>';
}
// NAMEALL_END
// JPMONEY_START — 💵 Jeopardy with play money (her words 2026-11-08: "I don't know if I really like the daily double jeopardy and the sure
// versus not sure. I like the idea of the fake money and betting to see if they win the game or if they run out of money, kind of like the
// real game … more like Double Jeopardy"; follow the TV show's rules for the bank; Sure / Not sure retired). DESIGN_jeopardy_money_2026-11-08.md
// — where it and the TV rules differ, the TV rules win. A Jeopardy GAME RULE (GAMERULES: GAME_RULES.jeop "mode", default "off" = the plain
// board byte for byte; Mom picks "money" per kid in the games grid's pop-up). Read once when the board is built (st.money), so a flip mid-game
// changes nothing until the next board.
//   · JEOPARDY! — the same board (same columns, same cards, same say / type / pick, same two tries), the rows priced like the show:
//     $200 $400 $600 $800 $1000 (★ → ★★★★★; a smaller deck gets fewer rows, same steps: 3 rows = $200 $400 $600). Bank starts at $0.
//   · THE FIRST ANSWER MOVES THE BANK (the show takes one response): right → + the square's value, wrong → − it. The second try is still
//     there to learn on, worth nothing. The bank CAN go below $0 (the show's rule, both rounds). "I said it" (the honor tap) is right.
//   · DAILY DOUBLES — 1 hidden in round 1, 2 in round 2 (different columns when there are columns enough), never in the top row. Tapping
//     one asks for the bet BEFORE the card shows: a slider from $5 up to the larger of the bank and the round's top value, ±$100, and
//     "True Daily Double" (the whole bank). Right → + the bet, wrong → − the bet, with the louder line ("That was your Daily Double — look
//     again!") kept from the retired Sure / Not sure — free, and it teaches.
//   · DOUBLE JEOPARDY! — when round 1's board is clear: a new board from the same decks (cards not on round 1 first), every value doubled.
//   · FINAL JEOPARDY — after Double Jeopardy, only with more than $0 (the show's rule): the category (deck) is named, the bet is $0 up to the
//     bank, then the card — the least-known card on the board's decks.
//   · THE END — the cards missed on the first try come back once, as on the plain board (worth nothing; the answer is never shown — the app
//     never supplies what the kid must produce), then the finish: "🏆 New record! You won $N" (beat the deck's best bank) / "🎉 You won $N" /
//     "💸 Out of money" (the bank is $0 or less after Double Jeopardy — no Final — or after Final). One "Play again" (the start screen's).
//   · WRITES (only these): the round's gameLog entry (GAMELOG, game:"jeop", right / miss per card as before, plus mode, bank, bets, result —
//     one guarded line in gameLogEntry) and <kid>_settings/match_best key "<board> · jeop money" (the deck's best bank, only when beaten, > $0).
//     Play money exists inside one game only: never the real points economy, never Stars, never the trophy shelf; it resets every game.
//     db && !_dryRun() only. Guarded hooks in the JEOPARDY block, each marked 💵 JPMONEY.
const JPM_BASE=200, JPM_DD_MIN=5, JPM_STEP=5;
function jeopMoneyOn(kid){ return typeof gameRule==="function"&&gameRule(kid,"jeop","mode")==="money"; }
function jpMoneyFmt(n){ n=Math.round(Number(n)||0); return (n<0?"−":"")+"$"+String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g,","); }
// PURE: a row's value — round 1 $200 × (row+1), Double Jeopardy twice that
function jpMoneyVal(st,row){ return JPM_BASE*(row+1)*((st&&st.round===2)?2:1); }
function jpMoneyBestKey(deck){ return deck+" \u{00B7} jeop money"; }
// PURE: a bet held to its bounds, in $5 steps
function jpMoneyClamp(b,v){ v=Math.round((Number(v)||0)/JPM_STEP)*JPM_STEP; return Math.max(b.min,Math.min(b.max,v)); }
// PURE: the bet's bounds — a Daily Double $5 … the larger of the bank and the round's top value; Final $0 … the bank
function jpMoneyBounds(st,kind){ return kind==="final"?{min:0,max:Math.max(0,st.bank)}:{min:JPM_DD_MIN,max:Math.max(st.bank,st.top)}; }
// Hide n Daily Doubles: never the top row ($200 / $400), different columns while there are any left
function jpMoneyDD(st,n){
  const cand=_jpShuffle(st.cells.filter(c=>c.row>0)), took=[], cols={};
  cand.forEach(c=>{ if(took.length<n&&!cols[c.col]){ took.push(c); cols[c.col]=1; } });
  cand.forEach(c=>{ if(took.length<n&&took.indexOf(c)<0) took.push(c); });
  took.forEach(c=>{ c.dd=true; });
}
// jeopStart's hook: Money on → the bank, round 1's values and its one Daily Double (Off adds nothing — and draws no random number)
function jpMoneyStart(st){
  if(!st||!jeopMoneyOn(st.kid)) return;
  st.money=true; st.round=1; st.bank=0; st.bets=[]; st.bet=null; st.final=null; st.result="";
  st.top=jpMoneyVal(st,st.rows-1);
  jpMoneyDD(st,1);
}
// jeopPickCell's hook: a Daily Double asks for the bet first (the card stays hidden, like the show)
function jpMoneyPick(st,ci){
  const c=st&&st.cells[ci]; if(!c||!c.dd) return false;
  const b=jpMoneyBounds(st,"dd"); b.kind="dd"; b.ci=ci; b.val=jpMoneyClamp(b,jpMoneyVal(st,c.row)); st.bet=b;
  st.msg="Daily Double! How much do you bet?"; _jpSay(st,"Daily Double! How much do you bet?");
  return true;
}
function jeopBetSlide(v){   // the slider: no re-draw while the finger moves — the two labels follow
  const st=jeopState; if(!st||!st.bet) return;
  st.bet.val=jpMoneyClamp(st.bet,v);
  try{ const a=document.getElementById("jp-bet-amt"), g=document.getElementById("jp-bet-go"); if(a) a.textContent=jpMoneyFmt(st.bet.val); if(g) g.textContent="Bet "+jpMoneyFmt(st.bet.val); }catch(e){}
}
function jeopBetStep(d){ const st=jeopState; if(!st||!st.bet) return; st.bet.val=jpMoneyClamp(st.bet,st.bet.val+d); _mastRe(); }
function jeopBetAll(){ const st=jeopState; if(!st||!st.bet||st.bank<Math.max(1,st.bet.min)) return; st.bet.val=jpMoneyClamp(st.bet,st.bank); jeopBetGo(); }   // True Daily Double: the whole bank
function jeopBetGo(){
  const st=jeopState; if(!st||!st.money||!st.bet||st.lock||st.open||st.phase!=="play") return;
  const b=st.bet, amt=jpMoneyClamp(b,b.val); st.bet=null;
  if(b.kind==="dd"){ const c=st.cells[b.ci]; if(!c||c.done) return _mastRe(); _jpOpen(st,b.ci,c.pid,c.act,false); }
  else{ if(!st.final) return _mastRe(); _jpOpen(st,null,st.final.pid,st.final.act,false); }
  const t=st.turns[st.open.t]; t.bet=amt; if(b.kind==="dd") t.dd=true; else t.fin=true;
  st.msg="You bet "+jpMoneyFmt(amt)+". "+st.msg;
  _mastRe();
}
// _jpAfter's / jeopSaid's hook: the FIRST answer on a square moves the bank (once per square; a come-back is worth nothing)
function jpMoneyAnswer(st,t){
  if(!st||!st.money||!t||t.back||t.paid!=null) return;
  const right=!!(t.done&&t.first), o=st.open, c=(o&&o.ci!=null)?st.cells[o.ci]:null;
  const amt=t.bet!=null?t.bet:(c?jpMoneyVal(st,c.row):0);
  t.paid=right?amt:-amt; st.bank+=t.paid;
  if(t.bet!=null) st.bets.push({round:st.round,kind:t.fin?"final":"dd",bet:t.bet,ok:right});
}
// the money lines (Off → "", the plain board's lines stand)
function jpMoneyMsg(st,t,r){
  if(!st||!st.money||!t||t.back) return "";
  if(r==="again") return t.dd?"That was your Daily Double — look again!":(t.paid<0?jpMoneyFmt(t.paid)+" · ":"")+"Almost — try again!";
  if(r==="fail") return t.dd?"That was your Daily Double — we’ll come back to that one.":"";
  if(r==="settle"&&t.first&&t.paid>0) return "That’s it! +"+jpMoneyFmt(t.paid);
  return "";
}
// _jpEnd's hook: round 1 clear → Double Jeopardy; Double Jeopardy clear → Final (more than $0 only); else the come-backs and the finish
function jpMoneyRoundEnd(st){
  if(!st||!st.money) return false;
  if(st.round===1){ jpMoneyRound2(st); return true; }
  if(st.round===2&&st.bank>0) return jpMoneyFinal(st);
  return false;
}
function jpMoneyRound2(st){
  const items=_jpItems(st.kid), modes=_jpModes(items,st.kid), pool=_jpWhichPool(items,st.kid), used={}, old=st.cells, cells=[];
  old.forEach(c=>{ used[c.pid]=1; });
  st.decks.forEach((d,col)=>{
    const all=pool.filter(i=>(i.subject||"Other")===d), fresh=all.filter(i=>!used[i.id]), from=fresh.length>=st.rows?fresh:all;
    if(!from.length){ old.filter(c=>c.col===col).forEach(c=>{ cells.push({col:col,row:c.row,pid:c.pid,act:c.act,done:false,first:false,fail:false}); }); return; }   // a deck emptied mid-game keeps its round-1 cards
    jeopColumn(from,st.rows).forEach((it,row)=>{ cells.push({col:col,row:row,pid:it.id,act:jeopKind(it,modes[d]),done:false,first:false,fail:false}); });
  });
  st.cells=cells; st.of+=cells.length; st.round=2; st.top=jpMoneyVal(st,st.rows-1);
  jpMoneyDD(st,2);
  st.msg="Double Jeopardy! Every square is worth double now."; _jpSay(st,"Double Jeopardy! Every square is worth double now.");
  st.lock=true; const seq=++st.seq; setTimeout(()=>{ if(jeopState===st&&st.lock&&st.seq===seq) jeopNext(st); },JP_BEAT*2);
}
// Final Jeopardy's card: the least-known card on the board's decks (one not played yet when there's a tie)
function jpMoneyFinal(st){
  const items=_jpItems(st.kid), modes=_jpModes(items,st.kid), seen={};
  const order=(typeof MAST_TIER_ORDER!=="undefined"&&MAST_TIER_ORDER)||["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"];
  st.turns.forEach(t=>{ seen[t.pid]=1; });
  const pool=_jpShuffle(_jpWhichPool(items,st.kid).filter(i=>st.decks.indexOf(i.subject||"Other")>=0));
  if(!pool.length) return false;
  pool.sort((a,b)=>(order.indexOf(a.tier||"daily")-order.indexOf(b.tier||"daily"))||((seen[a.id]?1:0)-(seen[b.id]?1:0)));
  const it=pool[0], d=it.subject||"Other";
  st.final={pid:it.id,act:jeopKind(it,modes[d]),deck:d}; st.round=3;
  const b=jpMoneyBounds(st,"final"); b.kind="final"; b.val=jpMoneyClamp(b,st.bank/2); st.bet=b;
  st.msg="Final Jeopardy! The category is "+d+". How much do you bet?"; _jpSay(st,"Final Jeopardy! The category is "+d+". How much do you bet?");
  return true;
}
// _jpFinish's hook: the final bank is the result; the deck's best bank is the record to beat
function jpMoneyFinish(st,kid){
  const s=masteryData[kid+"_settings"]||(masteryData[kid+"_settings"]={});
  if(!s.match_best) s.match_best={};
  const key=jpMoneyBestKey(st.deck), prev=s.match_best[key];
  st.prevBest=prev==null?null:prev;
  st.isPB=st.bank>0&&(prev==null||st.bank>prev);
  st.result=st.bank<=0?"out":(st.isPB?"record":"won");
  try{ if(typeof gameLogRound==="function") gameLogRound(st); }catch(e){}   // 🎮 GAMELOG: right / miss per card + the bank, the bets, the result
  if(st.isPB){
    s.match_best[key]=st.bank;
    if(db&&!_dryRun()) db.ref("mastery/"+kid+"_settings/match_best").update({[(typeof haKey==="function"?haKey(key):key)]:st.bank});   // this key only
    try{HA_LS.setItem("ha_mastery",JSON.stringify(masteryData));}catch(e){}
  }
  st.msg=st.result==="out"?"Out of money!":"You won "+jpMoneyFmt(st.bank)+"!"; st.say="";
  try{ if(st.isPB&&typeof _showCelebration==="function"&&document.getElementById("celeb-overlay")) _showCelebration(kid,"\u{1F3C6} New record! You won "+jpMoneyFmt(st.bank),{noSong:true}); }catch(e){}
}
// ── the screen's money parts ──
function jpMoneyIntro(kid){ return jeopMoneyOn(kid)?"\u{1F4B5} Play money, like the TV show! Right adds the square’s dollars, wrong takes them away. Find the Daily Doubles, then it’s Double Jeopardy and Final Jeopardy.":""; }
function jpMoneyBest(st){ const s=masteryData[st.kid+"_settings"]||{}, v=(s.match_best||{})[jpMoneyBestKey(st.deck)]; return v==null?null:jpMoneyFmt(v); }
function jpMoneyCell(st,row){ return jpMoneyFmt(jpMoneyVal(st,row)); }
function jpMoneyBarHtml(st){
  const nm=st.round===3?"\u{1F3C1} Final Jeopardy!":st.round===2?"\u{1F4FA} Double Jeopardy!":"\u{1F4FA} Jeopardy!";
  return '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin:8px 0 0;padding:10px 16px;border-radius:18px;background:#1e3a8a;color:#fff"><span style="font-family:\'Fraunces\',serif;font-size:18px;font-weight:800">'+nm+'</span>'+
    '<span style="font-size:13px;font-weight:800;color:#bfdbfe">Bank <span style="font-family:\'Fraunces\',serif;font-size:28px;font-weight:800;color:'+(st.bank<0?'#fca5a5':'#fde68a')+'">'+jpMoneyFmt(st.bank)+'</span></span></div>';
}
function jpMoneyBetHtml(st,color){
  const b=st.bet; if(!b) return "";
  const dd=b.kind==="dd", c=dd?st.cells[b.ci]:null, cat=dd?(c?st.decks[c.col]:""):(st.final?st.final.deck:"");
  let h='<div style="margin:6px 0 12px;padding:16px;border-radius:18px;background:#fffbeb;border:3px solid #f59e0b;text-align:center">';
  h+='<div style="font-family:\'Fraunces\',serif;font-size:24px;font-weight:800;color:#92400e">'+(dd?'\u{1F3AF} Daily Double!':'\u{1F3C1} Final Jeopardy')+'</div>';
  h+='<div style="font-size:15px;font-weight:800;color:#57534e;margin-top:4px">Category: '+esc(cat)+'</div>';
  h+='<div style="font-size:13px;font-weight:700;color:#78716c;margin-top:4px">Your bank '+jpMoneyFmt(st.bank)+' \u{00B7} bet '+jpMoneyFmt(b.min)+' to '+jpMoneyFmt(b.max)+'</div>';
  h+='<div id="jp-bet-amt" style="font-family:\'Fraunces\',serif;font-size:40px;font-weight:800;color:#292524;margin:8px 0">'+jpMoneyFmt(b.val)+'</div>';
  h+='<input id="jp-bet-range" type="range" min="'+b.min+'" max="'+b.max+'" step="'+JPM_STEP+'" value="'+b.val+'" oninput="jeopBetSlide(this.value)" aria-label="Your bet" style="width:100%;max-width:420px;height:36px;accent-color:'+color+'">';
  h+='<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:8px"><button class="jp-chip" onclick="jeopBetStep(-100)"'+(b.val<=b.min?' disabled':'')+'>− $100</button><button class="jp-chip" onclick="jeopBetStep(100)"'+(b.val>=b.max?' disabled':'')+'>+ $100</button></div>';
  h+='<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:12px"><button id="jp-bet-go" class="jp-btn" onclick="jeopBetGo()" style="background:'+color+';color:#fff;font-size:18px">Bet '+jpMoneyFmt(b.val)+'</button>';
  if(st.bank>0&&st.bank>=b.min) h+='<button class="jp-btn" onclick="jeopBetAll()" style="background:#fff;color:#92400e;border:2px solid #f59e0b">'+(dd?'\u{1F525} True Daily Double':'\u{1F525} Bet it all')+' ('+jpMoneyFmt(st.bank)+')</button>';
  return h+'</div></div>';
}
function jpMoneyFinishHtml(st){
  const out=st.result==="out", rec=st.result==="record";
  let h='<div style="margin-top:6px;text-align:center;padding:16px;border-radius:18px;background:'+(rec?'#f0fdf4':out?'#fffbeb':'#f8f7f4')+';border:2px solid '+(rec?'#16a34a':out?'#f59e0b':'#e2ddd6')+'">';
  h+='<div style="font-family:\'Fraunces\',serif;font-size:24px;font-weight:800">'+(out?'\u{1F4B8} Out of money':rec?'\u{1F3C6} New record! You won '+jpMoneyFmt(st.bank):'\u{1F389} You won '+jpMoneyFmt(st.bank))+'</div>';
  if(out) h+='<div style="font-size:16px;font-weight:800;color:#92400e;margin-top:8px">Bank '+jpMoneyFmt(st.bank)+(st.final?'':' \u{2014} no Final Jeopardy this time')+'. Try again!</div>';
  if(st.prevBest!=null) h+='<div style="font-size:14px;font-weight:800;color:#57534e;margin-top:8px">'+(rec?'Your old record: ':'Record to beat: ')+jpMoneyFmt(st.prevBest)+'</div>';
  if(st.bets&&st.bets.length) h+='<div style="font-size:14px;font-weight:700;color:#57534e;margin-top:8px">'+st.bets.map(x=>(x.kind==="final"?'\u{1F3C1} Final ':'\u{1F3AF} Daily Double ')+(x.ok?'+':'−')+jpMoneyFmt(x.bet)).join(' \u{00B7} ')+'</div>';
  h+='<div style="font-size:14px;font-weight:700;color:var(--muted);margin-top:8px">\u{1F4FA} '+st.first+' of '+st.of+' squares on the first try</div>';
  return h+'</div>';
}
// JPMONEY_END
// JPJUDGE_START — ⚖️ Jeopardy's say-it squares with money on, judged by the kid's ONE judging setting (GAMEJUDGE — her decision
// 2026-11-08: "one setting per kid, not a pill per game"; her finding on the tablet that night: the board asks "What is it?" and the kid
// taps "I said it" — with money on "everybody would win and there's no challenge"). Only the SAY-IT squares (a picture or a letter — Go
// Fish's "say" act) self-reported; a number back is typed and a word back is picked already, and those stay exactly as they are. Off
// mode never reaches this block: the honor tap stays as today, byte for byte.
//   · The kid's setting (gameJudgeMode / gameJudgeChoices) is read once when the board is built (st.judge, st.nch).
//   · The other choices for "pick" = the other names in the SAME deck of Which one?'s pool (a picture deck's pictures, a letter deck's
//     letters). A board's deck always has 3+ names, so at least 3 choices.
//   · ONE RESPONSE (the show's rule): right → + the square's value (or the bet); wrong → − it, "It's <name>." lit and SAID (so the miss
//     still teaches), a longer beat, and the card comes back once at the end like any miss (worth nothing then). The Daily Double and
//     Final Jeopardy open through the same _jpOpen, so they are judged the same way and their bet rides on the same answer.
//   · WRITES: nothing of its own. The round's gameLog entry (gameLogRound, game:"jeop") gains judge:"pick"|"type"|"mom" (GAMEJUDGE's
//     gameJudgeStamp, one guarded line in gameLogEntry — st.judge is set only on a money board), so Scores can tell judged rounds from older ones. Guarded hooks in JEOPARDY, each marked ⚖️ JPJUDGE.
// jeopStart's hook: money boards only (Off adds nothing to the state)
function jpJudgeStart(st){
  if(!st||!st.money||typeof gameJudgeMode!=="function") return;
  st.judge=gameJudgeMode(st.kid); st.nch=gameJudgeChoices(st.kid);
}
// _jpOpen's hook: a say-it square on a money board goes to the shared judging
function jpJudgeOpen(st,t){
  if(!st||!st.money||!st.judge||!t||t.act!=="say"||typeof gameJudgeAct!=="function") return;
  const it=_jpIt(st,t.pid); if(!it) return;
  const lead=t.back?"One more time. ":"", name=jeopName(it), deck=it.subject||"Other";
  const names=_jpWhichPool(_jpItems(st.kid),st.kid).filter(x=>x&&x.id!==it.id&&(x.subject||"Other")===deck).map(x=>jeopName(x));
  if(gameJudgeAct(st,t,{kid:st.kid,deck:deck,right:name,names:names,mode:st.judge,n:st.nch,shuffle:_jpShuffle,
    live:()=>jeopState===st&&_jpTurn(st,"say")===t, line:s=>{ st.msg=lead+s; },
    onRight:x=>jpJudgeSettle(st,x,true), onWrong:(x,g)=>jpJudgeSettle(st,x,false,g)})) t.judge=st.judge;   // false (no other name) → the honor tap
}
// jeopSaid's hook: "I said it" on a pick card shows the choices; on a type / Mom card it does nothing (no self-report with money on)
function jpJudgeSaid(st,t){ if(t.judge==="pick") gameJudgeSaid(); }
function jpJudgeHtml(st,t,color,lock){ return gameJudgeHtml(t,color,lock); }
// One response settles the square: right → the plain board's "That's it!" (+ the dollars); wrong → − the dollars, the right name lit and said
function jpJudgeSettle(st,t,right,given){
  if(typeof gameCardAnswered==="function") gameCardAnswered(t);   // ⏱ CARDSECS: the first answer on this card stops its clock
  const name=jeopName(_jpIt(st,t.pid));
  t.done=true; t.first=!!right; t.verdict=right?"right":"wrong";
  if(!right){ t.tries=1; t.fail=true; t.wrong[(given!=null&&String(given)!=="")?String(given):"1"]=1; }
  if(typeof jpMoneyAnswer==="function") jpMoneyAnswer(st,t);
  if(right){ _jpSettle(st,t,"",name); return; }
  try{ matchBonk(); }catch(e){}
  const lead=(t.dd?"That was your Daily Double! ":t.fin?"That was Final Jeopardy! ":"")+"It’s "+name+".";
  _jpSettle(st,t,lead);   // says the lead: the right name
  if(t.paid<0&&typeof jpMoneyFmt==="function") st.msg=lead+" "+jpMoneyFmt(t.paid);
  const seq=++st.seq; setTimeout(()=>{ if(jeopState===st&&st.lock&&st.seq===seq) jeopNext(st); },JP_BEAT*2);   // a longer beat: the right one stays lit
}
// JPJUDGE_END
// JIGSAW_START — 🧩 "Picture Puzzle" (her design 2026-11-08, PLAN_abc_puzzle_games_2026-11-08.md Game 2; her words: "breaks some of the
// flashcard pictures up into a puzzle, and then they can put the puzzle pieces together").
//   · WHO GETS IT — a kid with picture cards: a card in play (active / introduction, not a production twin) with a real picture —
//     the card's live picture (🖼 UNITPIC's mastLiveImg: the kid's picture for it, else the unit's, else the card's own upload) —
//     and a word to name it. An emoji or a drawn shape is not a picture here (it can't be cut). No such card → the
//     game isn't listed. Found by the cards, never by a deck's or a kid's name; Mom switches it per deck (🎮 GAMEGRID).
//   · THE PICTURE — a card the kid is learning (introduced, or still at the daily tier) when there is one, else any picture card,
//     never the one just played when there's another. Cut into JIG_PIECES[level] pieces: level 1 four (2 × 2), level 2 six (3 × 2),
//     level 3 nine (3 × 3). Each piece is the picture as a CSS background (one image, background-size / -position per piece:
//     jigTiles — the picture covers the square frame, centred, never stretched). No canvas.
//   · PLAY — the pieces scatter (shuffled, a little tilted) in the tray under the frame. Level 1's frame shows the whole picture
//     faintly with the pieces' outlines; levels 2–3 an empty frame. The kid drags a piece (finger or mouse — pointer events, as Sort
//     it; a tap picks a piece and a tap in the frame drops it there): dropped with its corner within JIG_SNAP of a piece's size of its
//     own place it snaps in (the clack); anywhere else it goes back to the tray. No misses for pieces, and never placed for him.
//   · THE FINISH — ASK FIRST (games audit 2026-11-08 §4 #24 / §7 rank 9: the word used to be shown and said 2.6 s BEFORE "What is it?",
//     so the answer came before the question). Now the last piece snaps → the whole picture and "What is it?", the word NOT shown or
//     said, judged by ⚖️ GAMEJUDGE's shared helper with the kid's own setting (gameJudgeMode): say it, then pick it — JIG_CHOICES (3)
//     words for a Pre-K kid, the kid's judgeChoices for the rest, the card's own + other cards' words (its own deck first), each with
//     its 🔊 chip — or type it, or Mom judges. THEN the confirm: the word shown and said; a wrong answer shows the right one (marked on
//     the choices, and "It's <word>"). No honor tap, ever: no other word to judge against → nothing asked and nothing logged. One
//     answer per round (the helper's): right = the card right, wrong = the card's miss. The round is stamped judge (gameJudgeStamp).
//     One Play again (a new picture).
//   · LEVEL — two CLEAN rounds in a row (the right answer when asked) at the kid's level → the next level, read back from the kid's own
//     game log (each round carries its level + clean), as the ABC Train does. Mom's pin (GAME_RULES.jigsaw "pieces": auto / 4 / 6 / 9).
//   · WRITES — only the round's gameLog entry (GAMELOG, game:"jigsaw", one item: the card, ok = the judged answer right, + level /
//     clean + judge). No points, no ladder, no next_due, no study log, no best score. db && !_dryRun() only (gameLogRound's own guard). Per-kid
//     park / restore / resume through its GAMES_LIST entry (🎲 GAMEKIT); a round dropped part-way writes nothing. No names in this block.
let jigState=null;   // {kid,deck,game:"jigsaw",t0,level,pid,word,img,ar,n,tray:[piece i],placed:{i:1},tilt:{i:deg},sel,bounce,snap,phase:"play"|"ask"|"done",names:[word],judge,msg,turns:[{pid,L,wrong,done,first,fail,nolog,gj}],clean,levelBefore,levelAfter,seq,lastPid,gameLogged}
let _jigRandom=Math.random;   // tests seed it
const JIG_PIECES={1:4,2:6,3:9}, JIG_MAX_LEVEL=3, JIG_SNAP=0.45, JIG_CHOICES=3;   // JIG_CHOICES: a Pre-K kid's "What is it?" choices
const _jigLast={};   // kid → the card of this device's last puzzle (so Play again brings a new picture)
function _jigShuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(_jigRandom()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function _jigItems(kid){ return (typeof _gamesItems==="function")?_gamesItems(kid||masteryKid):[]; }
function _jigPlain(p){ return String(p==null?"":p).replace(/<[^>]*>/g,"").replace(/&nbsp;/g," ").trim(); }
function _jigE(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function jigDeckOn(kid,deck){ return (typeof _gdRaw!=="undefined"&&_gdRaw)||typeof gameDeckOn!=="function"||gameDeckOn(kid,"jigsaw",deck); }
// The card's picture to cut — a URL, or "" (an emoji / drawn card has none). 🖼 UNITPIC's one answer: the live picture first
function jigPic(it,kid){ if(!it||typeof mastLiveImg!=="function") return ""; try{ return String(mastLiveImg(it,kid)||""); }catch(e){ return ""; } }
function _jigInPlay(i){ return !!i&&(i.status==="active"||i.status==="introduction")&&i.dir!=="prod"; }
// The kid's picture cards the puzzle may use (deck on, in play, a picture, a word)
function jigPool(items,kid){ kid=kid||masteryKid; return (items||[]).filter(i=>_jigInPlay(i)&&!!_jigPlain(i.prompt)&&!!jigPic(i,kid)&&jigDeckOn(kid,i.subject||"Other")); }
function jigDecks(items,kid){ const o={}; jigPool(items,kid).forEach(i=>{ o[i.subject||"Other"]=1; }); return Object.keys(o).sort(); }
function jigAvail(kid){ return jigPool(_jigItems(kid),kid).length>0; }
// PURE-ish: the card to cut — a learning one (introduced, or at the daily tier) when there is one, never the last one when there's another
function jigPick(pool,lastPid){
  const lrn=(pool||[]).filter(i=>i.status==="introduction"||!i.tier||i.tier==="daily"), from=lrn.length?lrn:(pool||[]);
  const fresh=from.filter(i=>String(i.id)!==String(lastPid)), list=fresh.length?fresh:from;
  return list.length?list[Math.floor(_jigRandom()*list.length)]:null;
}
// PURE: the grid for n pieces
function jigGrid(n){ n=Number(n)||4; if(n===6) return {cols:3,rows:2}; const c=Math.max(1,Math.round(Math.sqrt(n))); return {cols:c,rows:Math.ceil(n/c)}; }
// PURE: the pieces of a square frame for a picture of aspect ar (width / height). Each: i (row by row), col, row, its place x,y,w,h
// (fractions of the frame), and its slice — bgSize / bgPos — the picture covering the frame, centred (the long side cropped, nothing
// stretched). bgPos is "where the piece's own corner sits on the picture", as CSS percentages of (picture − piece).
function jigTiles(n,ar){
  const g=jigGrid(n), C=g.cols, R=g.rows, a=ar>0&&isFinite(ar)?ar:1, iw=a>=1?a:1, ih=a>=1?1:1/a, ox=(iw-1)/2, oy=(ih-1)/2, sw=iw*C, sh=ih*R, r2=x=>Math.round(x*100)/100, out=[];
  for(let r=0;r<R;r++) for(let c=0;c<C;c++)
    out.push({i:r*C+c,col:c,row:r,x:c/C,y:r/R,w:1/C,h:1/R,bgSize:r2(sw*100)+"% "+r2(sh*100)+"%",bgPos:r2(sw>1?(ox*C+c)/(sw-1)*100:0)+"% "+r2(sh>1?(oy*R+r)/(sh-1)*100:0)+"%"});
  return out;
}
// PURE: a piece dropped with its top-left corner at (x,y) — fractions of the frame — snaps when that corner is within JIG_SNAP of a
// piece's width / height of its own place
function jigSnap(tile,x,y){ return !!tile&&Math.abs(x-tile.x)<=JIG_SNAP*tile.w+1e-9&&Math.abs(y-tile.y)<=JIG_SNAP*tile.h+1e-9; }
// PURE-ish: the OTHER words "What is it?" can offer — the kid's cards in play, its own deck first (shuffled), then the other decks
// (shuffled), each word once, never the card's own (case and markup ignored)
function jigNames(it,items){
  const own=_jigPlain(it&&it.prompt), key=w=>w.toLowerCase(), seen={[key(own)]:1}, deck=it&&it.subject, out=[];
  const take=list=>{ _jigShuffle(list.slice()).forEach(i=>{ const w=_jigPlain(i.prompt); if(!w||seen[key(w)]) return; seen[key(w)]=1; out.push(w); }); };
  const live=(items||[]).filter(_jigInPlay);
  take(live.filter(i=>i.subject===deck)); take(live.filter(i=>i.subject!==deck));
  return out;
}
// How many "What is it?" choices: JIG_CHOICES for a Pre-K kid, else the kid's GAMEJUDGE judgeChoices
function jigChoiceN(kid){ return (typeof isPreK==="function"&&isPreK(kid))?JIG_CHOICES:((typeof gameJudgeChoices==="function")?gameJudgeChoices(kid):JIG_CHOICES); }
// The kid's puzzle rounds from the game log (this device's copy and the pushed one count once), oldest first
function jigLogRounds(kid){
  const G=((typeof masteryData!=="undefined"&&masteryData&&masteryData.gameLog)||{})[kid]||{}, seen={}, out=[];
  Object.keys(G).forEach(day=>{ const D=G[day]||{}; Object.keys(D).forEach(k=>{ const e=D[k]; if(!e||e.game!=="jigsaw"||e.level==null) return; const id=(Number(e.at)||0)+"|"+JSON.stringify(e.items||[]); if(seen[id]) return; seen[id]=1; out.push(e); }); });
  return out.sort((a,b)=>(Number(a.at)||0)-(Number(b.at)||0));
}
// PURE: the auto level — two clean rounds in a row at the level → up one (never past JIG_MAX_LEVEL)
function jigLevelFrom(rounds){
  let lvl=1, streak=0;
  (rounds||[]).forEach(e=>{ if(!e||Number(e.level)!==lvl) return; if(e.clean){ streak++; if(streak>=2&&lvl<JIG_MAX_LEVEL){ lvl++; streak=0; } } else streak=0; });
  return lvl;
}
function jigPin(kid){ const v=(typeof gameRule==="function")?gameRule(kid,"jigsaw","pieces"):null, L=Object.keys(JIG_PIECES).find(k=>String(JIG_PIECES[k])===String(v)); return L?Number(L):null; }
function jigLevel(kid){ kid=kid||masteryKid; return jigPin(kid)||jigLevelFrom(jigLogRounds(kid)); }
function _jigSay(text){ if(!text) return; try{ if(typeof mastSpeak==="function") mastSpeak(String(text)); }catch(e){} }
function jigStart(){
  const kid=masteryKid, items=_jigItems(kid), it=jigPick(jigPool(items,kid),_jigLast[kid]);
  if(!it){ jigState=null; _mastRe(); return; }
  _jigLast[kid]=it.id;
  const level=jigLevel(kid), n=JIG_PIECES[level]||4, tray=_jigShuffle(Array.from({length:n},(x,i)=>i)), tilt={};
  tray.forEach(i=>{ tilt[i]=Math.round((_jigRandom()*2-1)*8); });
  if(n>1&&tray.every((x,i)=>x===i)) tray.push(tray.shift());   // never already in order
  const word=_jigPlain(it.prompt);
  jigState={kid:kid,deck:it.subject||"Other",game:"jigsaw",t0:Date.now(),level:level,pid:it.id!=null?String(it.id):null,word:word,img:jigPic(it,kid),ar:1,n:n,tray:tray,placed:{},tilt:tilt,sel:null,bounce:null,snap:null,
    phase:"play",names:jigNames(it,items),judge:null,msg:"",turns:[{pid:it.id!=null?String(it.id):null,L:word,wrong:{},done:false,first:false,fail:false}],clean:null,levelBefore:level,levelAfter:null,seq:0};
  _jigLoadAr(jigState);
  _mastRe();
}
// The picture's own shape, once it loads (until then the pieces are cut as a square) — never redrawn under a finger mid-drag
let _jigDragging=false;
function _jigLoadAr(st){
  try{ if(typeof Image==="undefined"||!st.img) return; const im=new Image();
    im.onload=()=>{ if(jigState!==st||!im.naturalWidth||!im.naturalHeight) return; st.ar=im.naturalWidth/im.naturalHeight; if(!_jigDragging&&(typeof mastView==="undefined"||mastView==="jigsaw")) _mastRe(); };
    im.src=st.img; }catch(e){}
}
// PURE-ish: piece i dropped at (x,y) (its corner, fractions of the frame) → "snap" | "back" | null (not now)
function jigDropJudge(st,i,x,y){
  if(!st||st.phase!=="play"||i==null||i<0||i>=st.n||st.placed[i]) return null;
  st.sel=null;
  const t=jigTiles(st.n,st.ar)[i];
  if(x==null||y==null||!jigSnap(t,x,y)){ st.bounce=i; st.snap=null; return "back"; }
  st.placed[i]=1; st.snap=i; st.bounce=null;
  return "snap";
}
function jigDrop(i,x,y){
  const st=jigState, r=jigDropJudge(st,i,x,y); if(!r) return;
  if(r==="back"){ _mastRe(); return; }
  try{ matchDing(); }catch(e){}
  if(Object.keys(st.placed).length>=st.n) jigAsk(st);   // the whole picture → "What is it?" FIRST (the word not shown, not said)
  _mastRe();
}
// A tap: pick a piece (again = put it down); a tap in the frame drops the picked piece with its corner on the spot tapped's square
function jigTapPiece(i){ const st=jigState; if(!st||st.phase!=="play"||st.placed[i]) return; st.sel=st.sel===i?null:i; st.bounce=null; st.snap=null; _mastRe(); }
function jigFrameTap(ev){
  const st=jigState; if(!st||st.phase!=="play"||st.sel==null||!ev||!ev.currentTarget) return;
  const f=ev.currentTarget, b=f.getBoundingClientRect(), g=jigGrid(st.n), fx=(ev.clientX-b.left-(f.clientLeft||0))/(f.clientWidth||b.width), fy=(ev.clientY-b.top-(f.clientTop||0))/(f.clientHeight||b.height);
  const c=Math.max(0,Math.min(g.cols-1,Math.floor(fx*g.cols))), r=Math.max(0,Math.min(g.rows-1,Math.floor(fy*g.rows)));
  jigDrop(st.sel,c/g.cols,r/g.rows);
}
// Drag a piece with a finger or the mouse: a move under 8px is a tap (jigTapPiece); let go, its corner is measured against the frame
function jigDown(ev,i){
  const st=jigState; if(!st||st.phase!=="play"||!ev||ev.button>0) return;
  const el=ev.currentTarget; if(!el) return;
  if(typeof haDragStart==="function") haDragStart(ev);   // NOSELDRAG: no text selection / image drag
  const x0=ev.clientX, y0=ev.clientY, pid=ev.pointerId; let moved=false;
  try{ el.setPointerCapture(pid); }catch(e){}
  const move=e=>{ const dx=e.clientX-x0, dy=e.clientY-y0; if(!moved&&Math.hypot(dx,dy)<8) return; moved=true; _jigDragging=true; el.classList.add("jig-drag"); el.style.transform="translate("+dx+"px,"+dy+"px)"; };
  const up=e=>{
    el.removeEventListener("pointermove",move); el.removeEventListener("pointerup",up); el.removeEventListener("pointercancel",up);
    try{ el.releasePointerCapture(pid); }catch(x){}
    _jigDragging=false; if(typeof haDragOff==="function") haDragOff();
    if(!moved){ jigTapPiece(i); return; }
    let x=null, y=null;
    try{ const f=document.getElementById("jig-frame"), b=f&&f.getBoundingClientRect(), r=el.getBoundingClientRect(), fw=f&&(f.clientWidth||b.width), fh=f&&(f.clientHeight||b.height); if(b&&fw&&e.type!=="pointercancel"){ x=(r.left-b.left-(f.clientLeft||0))/fw; y=(r.top-b.top-(f.clientTop||0))/fh; } }catch(x2){}
    el.style.transform=""; el.classList.remove("jig-drag");
    jigDrop(i,x,y);
  };
  el.addEventListener("pointermove",move); el.addEventListener("pointerup",up); el.addEventListener("pointercancel",up);
}
// The whole picture, then "What is it?" — through ⚖️ GAMEJUDGE with the kid's own setting; the word is shown and said only AFTER the answer
function jigAsk(st){
  st=st||jigState; if(!st||st.phase!=="play") return;
  st.sel=null; st.bounce=null; st.seq++;
  const t=st.turns[0], kid=st.kid, n=jigChoiceN(kid), mode=(typeof gameJudgeMode==="function")?gameJudgeMode(kid):null;
  st.phase="ask";
  const on=!!t&&typeof gameJudgeAct==="function"&&gameJudgeAct(st,t,{kid:kid,deck:st.deck,right:st.word,names:(st.names||[]).slice(0,Math.max(1,n-1)),mode:mode,n:n,shuffle:_jigShuffle,speakerChips:true,
    live:()=>jigState===st&&st.phase==="ask"&&!t.done, line:x=>{ st.msg=x; },
    onRight:x=>_jigJudged(st,x,true), onWrong:(x,g)=>_jigJudged(st,x,false,g)});
  if(!on){ if(t) t.nolog=true; _jigSay(st.word); jigFinish(st); return; }   // nothing to judge against: no question, no honor tap — nothing logged
  st.judge=t.gj.mode;   // the round says how it was judged (gameLogEntry → gameJudgeStamp)
  _jigSay("What is it?");
}
// The helper's verdict → the confirm: the word shown and said (a wrong answer: "It's <word>", the right choice marked)
function _jigJudged(st,t,right,given){
  t.done=true; t.first=!!right;
  if(right){ try{ matchDing(); }catch(e){} }
  else { t.fail=true; t.wrong[(given!=null&&String(given)!=="")?String(given):"1"]=1; try{ matchBonk(); }catch(e){} }
  _jigSay(right?st.word:"It’s "+st.word+".");
  jigFinish(st);
}
function jigHear(){ const st=jigState; if(!st) return; if(st.phase==="ask") _jigSay("What is it?"); else if(st.phase==="done") _jigSay(st.word); }   // never the answer before it is given
function jigFinish(st){
  st.phase="done"; st.seq++;
  st.clean=st.turns.every(t=>t.done&&t.first);
  try{ if(typeof gameLogRound==="function") gameLogRound(st); }catch(e){}   // 🎮 GAMELOG: the card, its judged answer right or not, + the round's level / clean / judge, game:"jigsaw"
  st.levelAfter=jigLevel(st.kid);
}
// GAMEKID → 🎲 GAMEKIT: resume puts a picked-up piece down; a question asked stays asked (its judging lives on the turn)
function jigPark(){ const st=jigState; if(st) st.seq++; _jigDragging=false; return st; }
function jigResume(){ const st=jigState; if(!st) return; st.sel=null; st.bounce=null; st.snap=null; }
const JIG_CSS='<style>.jig-board{--jig-s:min(84vw,46vh,400px);display:flex;flex-direction:column;align-items:center}'+
  '#jig-frame{position:relative;width:var(--jig-s);height:var(--jig-s);border-radius:14px;border:3px dashed #a8a29e;background:#fafaf9;box-sizing:content-box;touch-action:manipulation}'+
  '.jig-ghost{position:absolute;inset:0;background-image:var(--jig-img);background-size:cover;background-position:center;opacity:.18;border-radius:11px}'+
  '.jig-cell{position:absolute;box-sizing:border-box;border:1.5px dashed rgba(120,113,108,.45)}'+
  '.jig-pc{background-image:var(--jig-img);background-repeat:no-repeat;box-sizing:border-box}'+
  '.jig-in{position:absolute;border-radius:2px}.jig-snap{animation:jigSnap .35s ease-out}@keyframes jigSnap{0%{transform:scale(1.12)}60%{transform:scale(.96)}100%{transform:none}}'+
  '.jig-tray{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;padding:14px 8px;margin-top:14px;border-radius:18px;background:#f5f5f4;width:100%;box-sizing:border-box}'+
  '.jig-tp{border:3px solid #fff;border-radius:8px;box-shadow:0 3px 8px rgba(0,0,0,.18);touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;cursor:grab;transition:box-shadow .15s}'+
  '.jig-tp.jig-sel{box-shadow:0 0 0 4px #2563eb}.jig-tp.jig-drag{transition:none;z-index:30;position:relative;box-shadow:0 14px 28px rgba(0,0,0,.3);pointer-events:none}'+
  '.jig-back{animation:jigBack .45s ease-out}@keyframes jigBack{0%{transform:translateY(-60px) scale(1.05)}70%{transform:translateY(5px)}100%{transform:none}}'+
  '.jig-whole{position:absolute;inset:0;background-image:var(--jig-img);background-size:cover;background-position:center;border-radius:11px;animation:jigSnap .5s ease-out}'+
  '.jig-word{font-family:\'Fraunces\',serif;font-size:clamp(30px,8vw,48px);font-weight:800;color:#292524;margin:14px 0 4px;text-align:center}</style>';
// One CSS url() for the picture (set once on the board as --jig-img; every piece uses it)
function _jigUrl(u){ return 'url(&quot;'+_jigE(String(u||"").replace(/["\\\n\r]/g,ch=>encodeURIComponent(ch)))+'&quot;)'; }
function buildJigHtml(color){
  let h=JIG_CSS+'<div class="ha-nosel" style="padding:4px 14px 24px;max-width:720px;margin:0 auto">';
  const kid=masteryKid;
  if(!jigAvail(kid)){ h+='<div class="mast-none">The Picture Puzzle needs cards with pictures \u{2014} add a picture to a card and it can be a puzzle.</div></div>'; return h; }
  const st=jigState&&jigState.kid===kid?jigState:null, btn=(fn,lbl)=>'<button onclick="'+fn+'" style="padding:14px 30px;border-radius:999px;border:none;background:'+color+';color:#fff;font-size:18px;font-weight:800;cursor:pointer;font-family:\'DM Sans\',sans-serif">'+lbl+'</button>';
  const hear='<button onclick="jigHear()" aria-label="Hear it" style="width:46px;height:46px;flex:none;border-radius:50%;border:3px solid '+color+';background:#fff;color:'+color+';font-size:20px;cursor:pointer">\u{1F50A}</button>';
  if(!st){
    const lvl=jigLevel(kid);
    h+='<div style="text-align:center;margin:18px 0 10px"><div style="font-size:64px;line-height:1">\u{1F9E9}</div><div style="font-family:\'Fraunces\',serif;font-size:24px;font-weight:800;color:#292524;margin:6px 0 4px">Picture Puzzle</div>';
    h+='<div style="font-size:15px;font-weight:700;color:#57534e;margin-bottom:16px">'+(JIG_PIECES[lvl]||4)+' pieces \u{00B7} put the picture back together!</div>'+btn("jigStart()","\u{1F9E9} Let\u{2019}s go!")+'</div></div>';
    return h;
  }
  const tiles=jigTiles(st.n,st.ar), g=jigGrid(st.n), pct=x=>Math.round(x*10000)/100+'%';
  const pc=(t,extra)=>'background-size:'+t.bgSize+';background-position:'+t.bgPos+';'+(extra||'');
  h+='<div class="jig-board" style="--jig-img:'+_jigUrl(st.img)+'">';
  h+='<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;margin:8px 0 8px"><span style="font-size:14px;font-weight:800;color:#57534e">\u{1F9E9} '+Object.keys(st.placed).length+' of '+st.n+' pieces</span><span style="font-size:12px;font-weight:800;color:var(--muted)">'+st.n+' pieces</span></div>';
  h+='<div id="jig-frame"'+(st.phase==="play"?' onclick="jigFrameTap(event)"':'')+' role="img" aria-label="Puzzle frame">';
  if(st.phase==="play"){
    if(st.level===1){ h+='<div class="jig-ghost"></div>'; tiles.forEach(t=>{ h+='<div class="jig-cell" style="left:'+pct(t.x)+';top:'+pct(t.y)+';width:'+pct(t.w)+';height:'+pct(t.h)+'"></div>'; }); }   // level 1: the faint outline
    tiles.forEach(t=>{ if(st.placed[t.i]) h+='<div class="jig-pc jig-in'+(st.snap===t.i?' jig-snap':'')+'" style="'+pc(t,'left:'+pct(t.x)+';top:'+pct(t.y)+';width:'+pct(t.w)+';height:'+pct(t.h))+'"></div>'; });
  } else h+='<div class="jig-whole"></div>';
  h+='</div>';
  if(st.phase==="play"){
    h+='<div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-top:12px"><span style="font-size:17px;font-weight:800;color:#57534e;text-align:center">'+(st.sel!=null?'Now tap where it goes!':'Drag each piece into the frame!')+'</span></div>';
    h+='<div class="jig-tray">';
    st.tray.forEach(i=>{ if(st.placed[i]) return; const t=tiles[i];
      h+='<div class="jig-pc jig-tp'+(st.sel===i?' jig-sel':'')+(st.bounce===i?' jig-back':'')+'" role="button" aria-label="Puzzle piece" onpointerdown="jigDown(event,'+i+')" style="'+pc(t,'width:calc(var(--jig-s) / '+g.cols+');height:calc(var(--jig-s) / '+g.rows+');'+(st.sel===i||st.bounce===i?'':'transform:rotate('+(st.tilt[i]||0)+'deg)'))+'"></div>'; });
    return h+'</div></div></div>';
  }
  const t=st.turns[0];
  if(st.phase==="ask"){
    h+='<div style="display:flex;align-items:center;justify-content:center;gap:10px;margin:14px 0 6px"><span class="jig-word" style="margin:0">What is it?</span>'+hear+'</div>';
    if(st.msg) h+='<div class="jig-msg" style="text-align:center;font-size:15px;font-weight:700;color:#57534e;margin-bottom:10px">'+_jigE(st.msg)+'</div>';
    h+='<div style="width:100%">'+((t&&t.gj&&typeof gameJudgeHtml==="function")?gameJudgeHtml(t,color,false):'')+'</div>';
    return h+'</div></div>';
  }
  // the confirm: the word shown (and said) only now — right, or the right one after a wrong answer
  const right=!!(t&&((t.done&&t.first)||t.nolog));   // nolog: nothing was asked, so nothing was missed
  h+='<div class="jig-word">'+(right?'\u{1F389} '+_jigE(st.word)+'!':'It’s '+_jigE(st.word)+'.')+'</div>';
  if(t&&t.gj&&t.gj.done&&typeof gameJudgeHtml==="function") h+='<div style="width:100%;margin-bottom:10px">'+gameJudgeHtml(t,color,true)+'</div>';
  if(st.levelAfter&&st.levelAfter>st.levelBefore) h+='<div style="font-size:18px;font-weight:800;color:#16a34a;margin-bottom:10px">\u{2B06} '+(JIG_PIECES[st.levelAfter]||"")+' pieces next time!</div>';
  h+='<div style="margin-top:8px">'+btn("jigStart()","\u{1F501} Play again")+'</div>';
  return h+'</div></div>';
}
// JIGSAW_END
// ── end of games.js — the flag below tells index.html the whole file ran (haLazyReady) ──
if(typeof window!=="undefined") window._haLazy_games=true;
