/*
 * ⚖️ Jeopardy judging with money on (her finding on the tablet 2026-11-08: the board asks "What is it?" and the kid taps "I said it" —
 * with money on "everybody would win and there's no challenge"; her yes to the design the same night). A Jeopardy GAME RULE "judge"
 * (shown only with Money on): Say it, then pick it (default; "choices" 3 / 4 / 5, default 4, each with a 🔊 chip) / Type it (the study
 * session's typed match) / Mom judges (the answer behind the Mom gate, ✓ / ✗). One response: right + the value, wrong − it and the right
 * name lit + said. Daily Double and Final Jeopardy go through the same judging. Off mode: "I said it" exactly as on main.
 * Runs the REAL code (WHICHONE + GAMELOG + GAMEGRID + GAMERULES + JEOPARDY + JPMONEY + JPJUDGE + SAIDPICK's lures / TTS check +
 * the study session's typed match).
 *   run:  node test_jeop_judge.js
 *   the Off snapshot was taken from main 2026-11-08 (6605417):  JP_SNAP_SRC=<main's index.html> node test_jeop_judge.js --snap
 */
const fs=require("fs"), path=require("path"), vm=require("vm"), crypto=require("crypto");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const SNAP_ONLY=process.argv.indexOf("--snap")>=0;
const src=fs.readFileSync(process.env.JP_SNAP_SRC||path.join(__dirname,"index.html"),"utf8");
const cutIn=(s,a,b)=>{ const i=s.indexOf(a), j=s.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return s.slice(i,j); };
function fnIn(S,name){ const i=S.indexOf("function "+name+"("); if(i<0) throw new Error("no function "+name); const j=S.indexOf("\nfunction ",i+10), k=S.indexOf("\n// ",i+10); return S.slice(i,Math.min(j<0?1e9:j,k<0?1e9:k)); }
const seeded=seed=>{ let x=seed||7; return ()=>{ x=(x*1103515245+12345)&0x7fffffff; return (x%10000)/10000; }; };

const P=(n,emoji,tier)=>({id:"p_"+n,subject:"Animals",prompt:n,emoji:emoji,status:"active",tier:tier||"weekly"});
const ANIMALS=[P("cat","🐱","graduated"),P("dog","🐶","monthly"),P("cow","🐮","bi_weekly"),P("pig","🐷","weekly"),P("fox","🦊","every_other_day"),P("owl","🦉","daily"),P("hen","🐔","daily"),P("ant","🐜","weekly")];
const M=(f,ans,tier)=>({id:"m_"+f,subject:"Math Facts",prompt:f,answer:ans,status:"active",tier:tier||"weekly"});
const MATH=[M("7+8","15","monthly"),M("6+6","12","bi_weekly"),M("9+4","13","weekly"),M("5+5","10","every_other_day"),M("8+3","11","daily")];
const TINY=[P("bee","🐝"),P("yak","🐃"),P("elk","🦌")].map(x=>Object.assign({},x,{id:"t_"+x.prompt,subject:"Tiny"}));

function world(items,o){
  o=o||{};
  const writes=[], said=[], dings=[], timers=[], nodes={};
  const S=o.src||src, opt=(a,b)=>S.indexOf(a)>=0?"\n"+cutIn(S,a,b):"";
  const extra=["_matchLures","_matchTtsOk","mstNormMath","mstTypeAnsOk"].filter(n=>S.indexOf("function "+n+"(")>=0).map(n=>fnIn(S,n)).join("\n");
  const CODE=cutIn(S,"// WHICHONE_START","// WHICHONE_END")+"\n"+cutIn(S,"// GAMELOG_START","// GAMELOG_END")+"\n"+cutIn(S,"// GAMEGRID_START","// GAMEGRID_END")+"\n"+cutIn(S,"// GAMERULES_START","// GAMERULES_END")+"\n"+cutIn(S,"// JEOPARDY_START","// JEOPARDY_END")+opt("// JPMONEY_START","// JPMONEY_END")+opt("// JPJUDGE_START","// JPJUDGE_END")+
    "\n"+(S.indexOf("const MST_TYPEANS_FRAC=")>=0?S.slice(S.indexOf("const MST_TYPEANS_FRAC="),S.indexOf("\n",S.indexOf("const MST_TYPEANS_FRAC="))):"")+"\n"+extra;
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date,parseInt,isNaN,setTimeout:(f,ms)=>{ timers.push(f); return timers.length; },
    window:{speechSynthesis:o.noTts?null:{}},
    document:{getElementById:id=>nodes[id]||null,createElement:()=>({style:{},remove(){}}),body:{appendChild(){}}},
    _dryRun:()=>!!o.dry,HA_LS:{setItem(){}},_mastRe(){},bbAudioUnlock(){},momHere:()=>!!o.mom,renderAll(){},cap:s=>s,
    pinOk:v=>v==="1234",dadPinOk:v=>v==="5678",
    _gamesItems:k=>(k==="k"?items||[]:[]),
    _smTileVis:it=>(it&&it.emoji?'<span class="memoji">'+it.emoji+'</span>':null),
    _matchPlain:h=>String(h||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(),
    esc:s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),
    mastSpeak:(t)=>said.push(t),matchDing:()=>dings.push("ding"),matchBonk:()=>dings.push("bonk"),_showCelebration:(k,t)=>dings.push("celeb:"+t),
    MAST_TIER_ORDER:["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"],
    mstTodayKey:()=>"20261108",mastView:"jeop",masteryKid:"k",
    masteryData:{k:items||[],k_settings:o.settings||{}},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v]),remove:()=>writes.push(["remove",p])})}};
  ctx.Math=Object.create(Math); ctx.Math.random=seeded((o.seed||3)+100);   // _matchLures' shuffle, seeded
  vm.createContext(ctx);
  vm.runInContext(CODE+"\nObject.defineProperty(this,'jeopState',{get:()=>jeopState,set:v=>{jeopState=v;}}); Object.defineProperty(this,'jeopPickDecks',{get:()=>jeopPickDecks,set:v=>{jeopPickDecks=v;}}); Object.defineProperty(this,'_jpRandom',{get:()=>_jpRandom,set:v=>{_jpRandom=v;}}); this.GAME_RULES=GAME_RULES;",ctx);
  ctx._jpRandom=seeded(o.seed||3);
  const flush=()=>{ while(timers.length){ const f=timers.shift(); f(); } };
  return {c:ctx,writes,said,dings,timers,nodes,flush};
}
const nameOf=(c,pid)=>c.masteryData.k.find(x=>x.id===pid).prompt;

// ── OFF = main byte for byte: a scripted say-it afternoon (every screen, write, word said, sound), hashed ──
function offSession(S){
  const log=[], snap=(w,tag)=>log.push(tag+"\n"+w.c.buildJeopHtml("#123456"));
  const w=world(ANIMALS.concat(MATH),{src:S}), c=w.c;
  c.jeopPickDecks=["Animals","Math Facts"]; c.jeopStart(); snap(w,"board"); const st=c.jeopState; let g=0, step=0;
  while(st.phase!=="done"&&g++<80){
    if(st.phase==="play"&&!st.open&&!st.lock){ c.jeopPickCell(st.cells.findIndex(x=>!x.done)); snap(w,"open"); }
    if(st.open&&!st.lock){ const t=st.turns[st.open.t];
      if(t.act==="say") c.jeopSaid(); else if(t.act==="type"){ for(const ch of (step++%3===1?"99":c._whichBack(c.masteryData.k.find(x=>x.id===t.pid)))) c.jeopKey(ch); c.jeopCheck(); }
      snap(w,"ans"); }
    w.flush(); snap(w,"beat");
  }
  log.push("writes "+JSON.stringify(w.writes.map(x=>[x[0],x[1],x[0]==="push"?Object.assign({},x[2],{at:0,secs:0}):x[2]])));
  log.push("said "+JSON.stringify(w.said)); log.push("dings "+JSON.stringify(w.dings)); log.push("state "+JSON.stringify(Object.keys(st).sort()));
  return crypto.createHash("sha256").update(log.join("\n──\n")).digest("hex");
}
if(SNAP_ONLY){ console.log(offSession(src)); process.exit(0); }
const OFF_MAIN="6facd0553a7efd3796f9a368efb6d33c26454b3a55633b0ab9f8fa6056065151";   // offSession(main 6605417's index.html), 2026-11-08

// ── by text ──
const a=src.indexOf("// JPJUDGE_START"), b=src.indexOf("// JPJUDGE_END"), jm=src.indexOf("// JPMONEY_END"), gl=src.indexOf("// GAMELIKE_START");
ok("one JPJUDGE block, straight after JPMONEY_END, before GAMELIKE_START",a>jm&&src.slice(jm,a).trim()==="// JPMONEY_END"&&b>a&&gl>b&&src.indexOf("// JPJUDGE_START",a+1)<0);
const blk=src.slice(a,b), code=blk.replace(/^\s*\/\/.*$/gm,""), JP=cutIn(src,"// JEOPARDY_START","// JEOPARDY_END"), RULES=cutIn(src,"const GAME_RULES={","\n};");
const JR=(RULES.match(/  jeop:[\s\S]*?\]\]\}\],/)||[""])[0];
const NAMES=/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew|adrienne|dewalt|burris|howe/i;
ok("no kid's or family's name in the block, the rules or this test's cards",!NAMES.test(blk)&&!NAMES.test(JR)&&!NAMES.test(JSON.stringify(ANIMALS.concat(MATH,TINY))));
ok("no 🔀 anywhere in index.html",src.indexOf("\u{1F500}")<0);
ok("writes nothing of its own: no db, no points / Stars",!/db\.ref|\.set\(|\.update\(|\.push\(\{|bankDirect|starBank/.test(code));
ok("the JEOPARDY hooks: 4 lines, each guarded (typeof jpJudge… === \"function\") and marked ⚖️ JPJUDGE, none with a $ or 'bank' (the plain board's test)",(JP.match(/⚖️ JPJUDGE/g)||[]).length===4&&(JP.match(/typeof jpJudge\w+==="function"/g)||[]).length===4&&!/bank|\$/.test(JP.split("\n").filter(l=>/⚖️ JPJUDGE/.test(l)).join("\n").replace(/\$\{|\$\//g,"")));
ok("GAMELOG: one guarded line adds judge on a money round",/if\(st\.game==="jeop"&&st\.money&&st\.judge\) e\.judge=st\.judge;/.test(fnIn(src,"gameLogEntry")));
ok("reuses Say-it's pieces: _matchLures for the other names, _matchTtsOk for the 🔊 chips, mastSpeak; the typed match is mstTypeAnsOk; the gate is momHere / pinOk / dadPinOk",/_matchLures\(/.test(code)&&/_matchTtsOk\(/.test(code)&&/mastSpeak\(c\.text\)/.test(code)&&/mstTypeAnsOk\(t\.typed,name\)/.test(code)&&/momHere\(\)/.test(code)&&/pinOk\(v\)/.test(code)&&/dadPinOk\(v\)/.test(code));

// ── the rules ──
const MON=(judge,ch)=>{ const r={mode:"money"}; if(judge) r.judge=judge; if(ch) r.choices=ch; return {settings:{gameRules:{jeop:r}}}; };
{ const w=world(ANIMALS), c=w.c, d=c.gameRuleDefs("jeop");
  ok("GAME_RULES.jeop: mode, judge, choices — in that order",d.map(r=>r.key).join()==="mode,judge,choices");
  const J=d[1], C=d[2];
  ok("judge: 'How is the answer judged?', default pick, options pick / type / mom",J.label==="How is the answer judged?"&&J.def==="pick"&&J.opts.map(o=>o[0]).join()==="pick,type,mom"&&J.opts[0][1]==="Say it, then pick it"&&J.opts[1][1]==="Type it"&&J.opts[2][1]==="Mom judges");
  ok("choices: default 4, options 3 / 4 / 5",C.def==="4"&&C.opts.map(o=>o[0]).join()==="3,4,5");
  ok("defaults: nothing stored → pick, 4",c.gameRule("k","jeop","judge")==="pick"&&c.jeopJudgeMode("k")==="pick"&&c.jeopJudgeChoices("k")===4);
  const off=c.gameRulesHtml("k","jeop");
  ok("Off: the pop-up shows only 'Play money?' (judging is a money rule)",/Play money\?/.test(off)&&!/How is the answer judged|How many choices/.test(off));
  const m=world(ANIMALS,MON()), mh=m.c.gameRulesHtml("k","jeop");
  ok("Money: the pop-up adds 'How is the answer judged?' (✓ Say it, then pick it) and 'How many choices?' (✓ 4)",/How is the answer judged\?/.test(mh)&&/✓ Say it, then pick it/.test(mh)&&/How many choices\?/.test(mh)&&/✓ 4</.test(mh));
  const t=world(ANIMALS,MON("type")), th=t.c.gameRulesHtml("k","jeop");
  ok("Type it: no 'How many choices?' (a pick-only rule)",/✓ Type it/.test(th)&&!/How many choices/.test(th));
  const s=world(ANIMALS,Object.assign({mom:true},MON())); s.c.gameRuleSet("k","jeop","judge","mom");
  ok("Mom picks Mom judges: one targeted set at mastery/<kid>_settings/gameRules/jeop/judge",s.writes.length===1&&JSON.stringify(s.writes[0])==='["set","mastery/k_settings/gameRules/jeop/judge","mom"]'&&s.c.jeopJudgeMode("k")==="mom");
  const bad=world(ANIMALS,{settings:{gameRules:{jeop:{mode:"money",judge:"nope",choices:"9"}}}});
  ok("a stored value that isn't an option falls back to pick / 4",bad.c.jeopJudgeMode("k")==="pick"&&bad.c.jeopJudgeChoices("k")===4);
}

// ── Off: byte for byte ──
ok("Off = main: a scripted say-it board (every screen, write, word said, sound and the state's keys) hashes to main's snapshot",offSession(src)===OFF_MAIN,offSession(src));
{ const w=world(ANIMALS,{settings:{gameRules:{jeop:{judge:"mom",choices:"5"}}}}), c=w.c; c.jeopStart(); const st=c.jeopState;
  c.jeopPickCell(0); const t=st.turns[0];
  ok("Off with a judge stored: no judge on the board or the card, the honor tap '🗣 I said it' and 'What is it?'",st.judge===undefined&&!t.judge&&/I said it/.test(c.buildJeopHtml("#000"))&&!/Show Mom|jp-judge|said-ch/.test(c.buildJeopHtml("#000"))&&w.said.slice(-1)[0]==="What is it?");
  c.jeopSaid(); ok("…and the tap is right, as today",t.done&&t.first); }

// helpers for money games
const val=(c,st)=>{ const o=st.open, cell=o&&o.ci!=null?st.cells[o.ci]:null; return cell?c.jpMoneyVal(st,cell.row):0; };
function openPlain(w){ const c=w.c, st=c.jeopState; const ci=st.cells.findIndex(x=>!x.done&&!x.dd); c.jeopPickCell(ci); return st.turns[st.open.t]; }

// ── Say it, then pick it ──
{ const w=world(ANIMALS,MON()), c=w.c; c.jeopStart(); const st=c.jeopState;
  ok("a money board reads the rules once: judge pick, 4 choices",st.judge==="pick"&&st.nch===4&&st.momOk===false);
  const t=openPlain(w), name=nameOf(c,t.pid); let h=c.buildJeopHtml("#000");
  ok("the card opens with 'Say it out loud… then tap what you said.' and 🗣 I said it — no choices yet (recall first)",t.judge==="pick"&&t.step==="say"&&st.msg==="Say it out loud… then tap what you said."&&/I said it/.test(h)&&!/said-ch/.test(h)&&w.said.slice(-1)[0]==="What is it?");
  ok("4 choices: the right name once + 3 others from the same deck, no text twice",t.ch.length===4&&t.ch.filter(x=>x.ok).length===1&&t.ch.find(x=>x.ok).text===name&&new Set(t.ch.map(x=>x.text.toLowerCase())).size===4&&t.ch.every(x=>ANIMALS.some(p=>p.prompt===x.text)));
  c.jeopPickTap&&c.jeopJudgePick(0); ok("a choice can't be tapped before 'I said it'",!t.done);
  c.jeopSaid(); h=c.buildJeopHtml("#000");
  ok("🗣 I said it → the choices, 'Tap what you said.', each with a 🔊 chip; nothing scored yet",t.step==="pick"&&!t.done&&st.msg==="Tap what you said."&&(h.match(/class="said-ch"/g)||[]).length===4&&(h.match(/class="said-hear"/g)||[]).length===4&&st.bank===0);
  const n0=w.said.length; c.jeopJudgeHear(1,{stopPropagation(){}});
  ok("🔊 says that choice only — never picks",w.said.length===n0+1&&w.said[n0]===t.ch[1].text&&!t.done);
  const v=val(c,st); c.jeopJudgePick(t.ch.findIndex(x=>x.ok));
  ok("right → + the square's value, 'That's it! +$N', the name said, the ding",t.done&&t.first&&st.bank===v&&st.msg==="That’s it! +"+c.jpMoneyFmt(v)&&w.said.slice(-1)[0]===name+". That’s it!"&&w.dings.slice(-1)[0]==="ding");
  w.flush();
  const t2=openPlain(w), n2=nameOf(c,t2.pid), v2=val(c,st), before=st.bank; c.jeopSaid(); const wi=t2.ch.findIndex(x=>!x.ok); c.jeopJudgePick(wi); h=c.buildJeopHtml("#000");
  ok("wrong → − the value at once (one response), the bonk, 'It's <name>.' said, the right one lit green ✓ and the tapped one red",t2.done&&!t2.first&&t2.fail&&st.bank===before-v2&&w.dings.slice(-1)[0]==="bonk"&&w.said.slice(-1)[0]==="It’s "+n2+"."&&st.msg==="It’s "+n2+". "+c.jpMoneyFmt(-v2)&&/#16a34a[^>]*>[^<]*<span[^>]*>✓ /.test(h)&&/#dc2626/.test(h));
  c.jeopJudgePick(t2.ch.findIndex(x=>x.ok)); ok("…a second tap does nothing",st.bank===before-v2);
  ok("the miss holds a longer beat (the first timer is stale)",w.timers.length===2);
  w.flush(); ok("then the board",!st.open&&st.msg==="Pick a square!");
}
{ // choice count + small decks
  const counts=["3","4","5"].map(n=>{ const w=world(ANIMALS,MON("pick",n)); w.c.jeopStart(); return openPlain(w).ch.length; });
  ok("choices 3 / 4 / 5 → 3 / 4 / 5 choices",counts.join()==="3,4,5",counts);
  const w=world(TINY,MON("pick","5")); w.c.jeopStart(); const t=openPlain(w);
  ok("a 3-card deck with 5 asked: 3 choices (all it has), the right one among them",t.ch.length===3&&t.ch.filter(x=>x.ok).length===1);
  let distinct=true, okOnce=true;
  for(let seed=1;seed<=30;seed++){ const x=world(ANIMALS.concat(MATH),Object.assign({seed:seed},MON("pick","5"))); x.c.jeopStart(); const st=x.c.jeopState;
    st.cells.filter(cl=>cl.act==="say").forEach(cl=>{ const ch=x.c.jpJudgeChoices(st,x.c.masteryData.k.find(i=>i.id===cl.pid),5); if(new Set(ch.map(y=>y.text.toLowerCase())).size!==ch.length) distinct=false; if(ch.filter(y=>y.ok).length!==1||!ch.every(y=>ANIMALS.some(p=>p.prompt===y.text))) okOnce=false; }); }
  ok("30 boards: never one text twice; the right name exactly once; only names from the same deck (no math answers)",distinct&&okOnce);
  const q=world(ANIMALS,Object.assign({noTts:true},MON())); q.c.jeopStart(); openPlain(q); q.c.jeopSaid();
  ok("TTS dead on this device: the choices are plain (no 🔊 chips)",/class="said-ch"/.test(q.c.buildJeopHtml("#000"))&&!/said-hear/.test(q.c.buildJeopHtml("#000")));
  const m=world(MATH,MON()); m.c.jeopStart(); const tm=openPlain(m);
  ok("a number-back square is untouched by judging (its number pad, as before)",tm.act==="type"&&!tm.judge&&/jp-key/.test(m.c.buildJeopHtml("#000")));
}

// ── Type it ──
{ const w=world(ANIMALS,MON("type")), c=w.c; c.jeopStart(); const st=c.jeopState;
  const t=openPlain(w), name=nameOf(c,t.pid); let h=c.buildJeopHtml("#000");
  ok("Type it: a text box + Check, 'Type what it is, then Check.', no 'I said it', no choices",t.judge==="type"&&/id="jp-judge-in"/.test(h)&&/>Check</.test(h)&&!/I said it|said-ch/.test(h)&&st.msg==="Type what it is, then Check.");
  c.jeopSaid(); ok("the honor tap does nothing on a typed card",!t.done);
  c.jeopJudgeCheck(); ok("Check with nothing typed does nothing",!t.done);
  w.nodes["jp-judge-in"]={value:"  "+name.toUpperCase()+" "}; const v=val(c,st); c.jeopJudgeCheck();
  ok("typed with capitals and spaces → right, + the value (the study session's match)",t.done&&t.first&&st.bank===v);
  w.flush(); delete w.nodes["jp-judge-in"];
  const t2=openPlain(w), n2=nameOf(c,t2.pid), v2=val(c,st), b2=st.bank; c.jeopJudgeTyped("zebra"); c.jeopJudgeCheck(); h=c.buildJeopHtml("#000");
  ok("typed wrong → − the value, 'It's <name>.' said, the screen shows what was typed and the right name",t2.done&&!t2.first&&st.bank===b2-v2&&w.said.slice(-1)[0]==="It’s "+n2+"."&&/You typed “zebra”/.test(h)&&h.indexOf(n2)>=0);
  const T=c.mstTypeAnsOk;
  ok("the match: accepts case / spaces / number forms; rejects a different word, a misspelling, a blank",T("Cat","cat")&&T(" cat ","cat")&&T("ice  cream","Ice Cream")&&T("4.0","4")&&T("1,000","1000")&&!T("cats","cat")&&!T("dgo","dog")&&!T("","dog")&&!T("cow","owl"));
}

// ── Mom judges ──
{ const w=world(ANIMALS,MON("mom")), c=w.c; c.jeopStart(); const st=c.jeopState;
  const t=openPlain(w), name=nameOf(c,t.pid); let h=c.buildJeopHtml("#000");
  ok("Mom judges: 'Say it out loud to Mom.' and '🔒 Show Mom the answer' — the answer is NOT on the screen",t.judge==="mom"&&st.msg==="Say it out loud to Mom."&&/Show Mom the answer/.test(h)&&!/I said it/.test(h)&&h.indexOf(">"+name+"<")<0);
  c.jeopSaid(); c.jeopJudgeMom(true); ok("no honor tap, and ✓ does nothing before the gate",!t.done&&st.bank===0);
  c.jeopJudgeMomShow(); h=c.buildJeopHtml("#000");
  ok("no Mom here → the code box (Mom or Dad), still no answer",t.momAsk&&!t.momShow&&/id="jp-mom-pin"/.test(h)&&h.indexOf(">"+name+"<")<0);
  c.jeopJudgeCode("0000"); c.jeopJudgeMom(true); ok("a wrong code opens nothing",!t.momShow&&!t.done&&!st.momOk);
  c.jeopJudgeCode("1234"); h=c.buildJeopHtml("#000");
  ok("Mom's code → the answer for Mom with ✓ / ✗ (good for this game only — Mom mode never turned on)",t.momShow&&st.momOk&&h.indexOf(">"+name+"<")>=0&&/jeopJudgeMom\(true\)/.test(h)&&/jeopJudgeMom\(false\)/.test(h));
  const v=val(c,st); c.jeopJudgeMom(true);
  ok("✓ → + the value",t.done&&t.first&&st.bank===v);
  w.flush();
  const t2=openPlain(w), v2=val(c,st), n2=nameOf(c,t2.pid); c.jeopJudgeMomShow();
  ok("the next square: the gate stays open for this game (no code again)",t2.momShow&&!t2.momAsk);
  c.jeopJudgeMom(false);
  ok("✗ → − the value, the right name said",t2.done&&!t2.first&&st.bank===v-v2&&w.said.slice(-1)[0]==="It’s "+n2+".");
  const d=world(ANIMALS,MON("mom")); d.c.jeopStart(); const td=openPlain(d); d.c.jeopJudgeMomShow(); d.c.jeopJudgeCode("5678");
  ok("Dad's code opens it too",td.momShow);
  const m=world(ANIMALS,Object.assign({mom:true},MON("mom"))); m.c.jeopStart(); const tm=openPlain(m); m.c.jeopJudgeMomShow();
  ok("the Mom switch on: the answer opens with no code",tm.momShow&&!tm.momAsk);
  const n=world(ANIMALS,MON("mom")); n.c.jeopStart(); const tn=openPlain(n); n.c.jeopJudgeMomShow(); n.c.jeopJudgeMomCancel();
  ok("Cancel closes the code box",!tn.momAsk&&!tn.momShow&&/Show Mom the answer/.test(n.c.buildJeopHtml("#000")));
}

// ── a whole game: Daily Doubles, Final Jeopardy and the come-backs go through judging; the log carries judge ──
function play(judge,rightFn,seed){
  const w=world(ANIMALS,Object.assign({seed:seed||5,mom:true},MON(judge))), c=w.c; c.jeopStart(); const st=c.jeopState; let g=0; const seenJ=[];
  while(st.phase!=="done"&&g++<400){
    if(st.bet){ c.jeopBetSlide(st.bet.kind==="final"?st.bank:100); c.jeopBetGo(); continue; }
    if(st.open&&!st.lock){ const t=st.turns[st.open.t], name=nameOf(c,t.pid), r=rightFn(st,t); seenJ.push({j:t.judge,dd:!!t.dd,fin:!!t.fin,back:!!t.back});
      if(t.judge==="pick"){ c.jeopSaid(); c.jeopJudgePick(t.ch.findIndex(x=>!!x.ok===r)); }
      else if(t.judge==="type"){ c.jeopJudgeTyped(r?name:"nope"); c.jeopJudgeCheck(); }
      else if(t.judge==="mom"){ c.jeopJudgeMomShow(); c.jeopJudgeMom(r); }
      else c.jeopSaid();
      continue; }
    if(st.phase==="play"&&!st.open&&!st.lock){ const ci=st.cells.findIndex(x=>!x.done); if(ci>=0){ c.jeopPickCell(ci); continue; } }
    w.flush();
  }
  return {w,c,st,seenJ};
}
["pick","type","mom"].forEach(j=>{
  const {w,st,seenJ}=play(j,(s,t)=>!(s.round===1&&t===s.turns[1]));
  const e=(w.writes.find(x=>x[0]==="push")||[])[2]||{};
  ok(j+": every square judged — round 1's Daily Double, both of Double Jeopardy's, Final and the come-back",st.phase==="done"&&seenJ.every(x=>x.j===j)&&seenJ.filter(x=>x.dd).length===3&&seenJ.filter(x=>x.fin).length===1&&seenJ.filter(x=>x.back).length===1,seenJ.filter(x=>x.j!==j));
  ok(j+": the bets ride on the judged answer (right adds the bet)",st.bets.length===4&&st.bets.every(x=>x.ok));
  ok(j+": ONE gameLog push, game jeop, mode money, judge '"+j+"', the miss and its come-back per card as before",e.game==="jeop"&&e.mode==="money"&&e.judge===j&&e.items.filter(i=>!i.ok&&!i.back&&i.fail).length===1&&e.items.filter(i=>i.back).length===1&&e.items.every(i=>Object.keys(i).every(k=>/^(id|ok|n|back|fail)$/.test(k))));
});
{ // Daily Double + Final wrong: − the bet
  const {st}=play("pick",(s,t)=>!t.dd&&!t.fin,9);
  ok("pick: a wrong Daily Double / Final takes the bet away",st.bets.length>=3&&st.bets.filter(x=>x.kind==="dd").every(x=>!x.ok));
  const w=world(ANIMALS,Object.assign({seed:11},MON("pick"))), c=w.c; c.jeopStart(); const st2=c.jeopState;
  c.jeopPickCell(st2.cells.findIndex(x=>x.dd)); c.jeopBetSlide(300); c.jeopBetGo(); const t=st2.turns[st2.open.t];
  ok("a Daily Double card opens judged, its bet on the line",t.dd&&t.bet===300&&t.judge==="pick"&&/You bet \$300\. Say it out loud… then tap what you said\./.test(st2.msg));
  c.jeopSaid(); c.jeopJudgePick(t.ch.findIndex(x=>!x.ok));
  ok("…wrong: − $300, 'That was your Daily Double! It's <name>.'",st2.bank===-300&&st2.msg==="That was your Daily Double! It’s "+nameOf(c,t.pid)+". −$300");
}
{ // dry run
  const d=world(ANIMALS,Object.assign({dry:true,mom:true},MON("mom"))); d.c.jeopStart(); const st=d.c.jeopState; let g=0;
  while(st.phase!=="done"&&g++<400){ if(st.bet){ d.c.jeopBetGo(); continue; } if(st.open&&!st.lock){ d.c.jeopJudgeMomShow(); d.c.jeopJudgeMom(true); continue; } if(st.phase==="play"&&!st.open&&!st.lock){ d.c.jeopPickCell(st.cells.findIndex(x=>!x.done)); continue; } d.flush(); }
  ok("?dryrun=1: a judged game plays to the end, nothing written",st.phase==="done"&&d.writes.length===0);
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
