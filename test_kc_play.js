/*
 * 📚🎮 KC_PLAY — Drills · Games beside Today / My Lists / Month in Kids' Corner, and mastery links that open in place from
 * Dad's Day and Mom's Day (her ask 2026-11-02: "The kids need to access their study sessions, and their games; the rest they
 * don't need. Keep the header at the top … Put another little spot beside Today, My list and Month with Drills and Games, and
 * it opens up below … The same for Mom: whatever she needs reachable, but not too much.")
 *   run:  node test_kc_play.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const slice=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b); if(i<0||j<i) throw new Error("missing "+a); return src.slice(i,j); };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const block=slice("// KC_PLAY_START","// KC_PLAY_END");

console.log("No new writes, no kid names");
ok("the block is marked", block.length>100);
ok("no db.ref( / .set( / .update( / .remove( / .push( / .transaction( in the block", block.indexOf("db.ref(")<0&&!/\.(set|update|remove|push|transaction)\(/.test(block));
ok("no localStorage of its own (Drills / Games are page state; a sitting rides mstPersist)", !/localStorage|HA_LS\./.test(block)&&/mstPersist\(\)/.test(block));
ok("no kid names as literals", !/lincoln|ellis|lucy|julian|taylor|kenzie|andrew/i.test(block));
ok("the views are the Mastery tab's own (renderMastStudy({noCheckup:true}), gamesSubHtml + gamesBodyHtml)", /renderMastStudy\(\{noCheckup:true\}\)/.test(block)&&/gamesSubHtml\(col\)/.test(block)&&/gamesBodyHtml\(col\)/.test(block));
ok("no 🔀 anywhere", src.indexOf("🔀")<0);

// ── sandbox: KC_PLAY + KC_MASTERY + the real Corner toggle / body / header, retrSchedGo, retrOpenSprint, showTab, GAMESTAB ──
const GAMES=slice("// GAMESTAB_START","// GAMESTAB_END");
const KCM=slice("// KC_MASTERY_START","// KC_MASTERY_END");
function mk(o){
  o=o||{}; const calls=[], ls={};
  const sessions=[{sid:"s1",name:"Math facts",kind:"deck"},{sid:"ck1",name:"Facts check-up",kind:"checkup"}];
  const navBtns=["schedule","moms-plan","kids","mastery"].map(t=>({dataset:{tab:t},on:false,classList:{toggle(c,v){ this._b.on=!!v; }}}));
  navBtns.forEach(b=>b.classList._b=b);
  const ctx={console,Object,Array,String,Number,Math,JSON,Date,RegExp,Error,Set,
    calls, ls, navBtns, window:{scrollTo:()=>{}},
    document:{querySelectorAll:q=>q===".nav-tab"?navBtns:[], getElementById:()=>null},
    HA_LS:{getItem:k=>(k in ls)?ls[k]:null, setItem:(k,v)=>{ ls[k]=String(v); calls.push(["ls",k]); }},
    tab:o.tab||"kids", kcKid:("kcKid" in o)?o.kcKid:"kidA", _mom:!!o.mom, momDayIn:!!o.momDayIn, mpSubView:o.mpSubView||"plan",
    momSchedView:false, _kd:!!o.kioskD, _kk:!!o.kioskK,
    momHere:()=>ctx._mom, _kioskD:()=>ctx._kd, _kioskK:()=>ctx._kk, _kioskR:()=>false, _kiosk:()=>false, haMomOff:()=>{ ctx._mom=false; calls.push(["momOff"]); },
    msvExit:()=>calls.push(["msvExit"]), _kcLoadKid:()=>{}, _todayDay:"Monday", day:"Monday",
    ROSTER:["kidA","kidB"], KID_COLOR:{kidA:"#d946ef",kidB:"#0ea5e9"}, KID_NAME:{kidA:"Ava",kidB:"Bo"},
    cap:s=>s.charAt(0).toUpperCase()+s.slice(1), esc:s=>String(s).replace(/</g,"&lt;"), kcLittle:()=>false, kcEmoji:()=>"🦄", _kcTint:()=>"#eee",
    kcTodayHTML:()=>"TODAYBODY", kcListsHTML:()=>"LISTSBODY", calRenderMonthPreview:()=>"MONTHBODY",
    kcOtherKidsHTML:k=>'<button onclick="kcPick(\'kidB\')">Bo</button>',
    _haMastReady:true, masteryData:{kidA:[{id:"a"}],kidB:[{id:"b"}]},
    masteryKid:"kidB", mastView:"scores", mastLogMode:true, mastLogScores:{a:1}, mastLogDeck:"x", mastSessionKey:"k", mastSlideIdx:3, mastScoreItemId:"i", mastAdminLocal:{}, mastAddCat:"", mastManualScore:false,
    mstKid:"kidB", mstSid:"old", mstState:o.running?{run:1}:null, mstFlipped:true, mstDone:{total:1}, mstStartTs:5, mstTyped:"9", mstChecked:{ok:1},
    mstNavReset:()=>calls.push(["navReset"]), mstPersist:()=>calls.push(["persist",ctx.masteryKid,ctx.mstSid]),
    mstSessions:k=>k==="kidA"?sessions:[], renderAll:()=>calls.push(["render"]),
    renderMastStudy:opts=>{ calls.push(["study",ctx.masteryKid,JSON.stringify(opts||null)]); return "STUDYPAGE("+ctx.masteryKid+")"; },
    renderDadsDay:el=>{ el.innerHTML="DADSDAY"; },
    matchState:null, matchStyle:"match", matchPairMode:"two", whichState:null,
    gameKidSwitch:k=>calls.push(["gks",k]), mastMatchDecks:()=>[1], whichDecks:()=>[1], envFlashAvail:()=>false,
    buildMatchHtml:()=>"MATCHGAME", buildWhichHtml:()=>"WHICHGAME", _mastRe:()=>calls.push(["mastRe"]), mastSetView:v=>{ ctx.mastView=v; },
    mastMatchSetStyle:v=>{ ctx.matchStyle=v; },
    MAST_BANK_MAP:{}, retrTodayQueue:()=>[], retrTracks:()=>[], sprintSource:"", mdJumped:false,
    // 🎴 KC_CARD: the Mastery page itself, as a stand-in that says what it drew (view, bare or not, Mom mode while drawing)
    _renderMasteryInner:el=>{ el.innerHTML="MASTPAGE("+ctx.masteryKid+","+ctx.mastView+","+(ctx.get("mastBare")?"bare":"full")+","+(ctx._mom?"mom":"kid")+")"+(ctx.mastView==="drill"?'<button onclick="mastStartLog()">Log</button>':''); },
    setTimeout:()=>0, mastLockSlideHeight:()=>{}, _dad:!!o.dad, dadAwardOk:()=>ctx._dad,
    pinOk:v=>v==="1111", dadPinOk:v=>v==="2222",
    _momSusp:null, _momSuspend:()=>{ ctx._momSusp={m:ctx._mom}; ctx._mom=false; }, _momResume:()=>{ ctx._mom=ctx._momSusp.m; ctx._momSusp=null; },
    mastStartLog:()=>{ if(!ctx.kcLogGate()) return; ctx.mastLogMode=true; calls.push(["log"]); }};
  ctx.document.createElement=()=>({innerHTML:""});
  vm.createContext(ctx);
  const code=GAMES+"\n"+KCM+"\n"+block+"\nlet kcModeMap=null; const KC_MODES=['today','lists','month'];\n"
    +["_kcModeMap","kcCalGet","kcCalSet","kcCalToggleHTML","kcModeBodyHTML","kcPick","renderKidsCorner","retrSchedGo","retrOpenSprint","showTab"].map(fn).join("\n");
  vm.runInContext(code,ctx);
  ctx.get=e=>vm.runInContext(e,ctx); ctx.set=(k,v)=>{ ctx.__v=v; vm.runInContext(k+"=__v",ctx); };
  ctx.shown=()=>ctx.get("tab")==="mastery"?[1]:[];   // showTab is the real one: "shown" = it reached the Mastery tab
  return ctx;
}
const draw=c=>{ const el={innerHTML:""}; c.renderKidsCorner(el); return el.innerHTML; };

console.log("Kids' Corner: the buttons");
{ const c=mk(); const h=draw(c);
  ok("📚 Drills and 🎮 Games sit beside Today / My Lists / Month", /kcCalSet\('today'[^]*kcCalSet\('lists'[^]*kcCalSet\('month'[^]*kcPlayOpen\('drills','kidA','corner'\)[^]*kcPlayOpen\('games','kidA','corner'\)/.test(h), h.slice(0,900));
  ok("…in a row that wraps (their own line on a phone)", /flex-wrap:wrap/.test(c.kcCalToggleHTML("kidA")));
  c.set("tab","schedule");
  ok("the General tablet's My Day (same toggle, not the Corner) gets only the three pages", !/kcPlayOpen/.test(c.kcCalToggleHTML("kidA")));
}
console.log("Kids' Corner: 📚 Drills");
{ const c=mk({running:true}); c.kcCalSet("drills","kidA"); const h=draw(c);
  ok("the kid's own header and kid buttons stay on top", h.indexOf("Ava’s Corner")>0&&h.indexOf("kcPick('kidB')")>0, h.slice(0,400));
  ok("…the buttons row stays, Drills lit", h.indexOf("kcPlayOpen('drills','kidA','corner')\" style=\"flex:1;padding:8px 6px;border-radius:20px;border:2px dashed #d946ef;background:#d946ef")>0);
  ok("below: the kid's study sessions — renderMastStudy({noCheckup:true}) for THIS kid", h.indexOf("STUDYPAGE(kidA)")>0&&c.calls.some(x=>x[0]==="study"&&x[1]==="kidA"&&x[2]==='{"noCheckup":true}'));
  ok("…and not the Today body", h.indexOf("TODAYBODY")<0);
  ok("the old kid's sitting was kept on the device before the switch (persist under kidB)", c.calls.some(x=>x[0]==="persist"&&x[1]==="kidB"), c.calls);
  ok("…a fresh landing for this kid: no stale sitting, flip, typed answer", c.get("mstKid")==="kidA"&&c.get("mstState")===null&&c.get("mstFlipped")===false&&c.get("mstTyped")===""&&c.get("mastLogMode")===false);
  ok("Drills is page state — nothing saved to ha_kc_mode", !("ha_kc_mode" in c.ls));
  ok("the header line says what this page is", h.indexOf("Your study cards")>0);
  ok("the Mastery tab's own view is untouched by Drills", c.get("mastView")==="scores");
  c.set("mstState",{run:2}); c.calls.length=0;
  c.kcCalSet("today","kidA");
  ok("📆 Today: the sitting in progress is kept (persist), the page goes back to Today", c.calls.some(x=>x[0]==="persist"&&x[1]==="kidA")&&c.get("kcPlay")===null&&draw(c).indexOf("TODAYBODY")>0);
}
console.log("Kids' Corner: 🎮 Games");
{ const c=mk(); c.kcCalSet("games","kidA"); const h=draw(c);
  ok("the games row lists this kid's games", /class="games-sub"/.test(h)&&h.indexOf("gamesPick('match')")>0&&h.indexOf("gamesPick('which')")>0, h.slice(0,1200));
  ok("…and lands on a game (the first one)", c.get("mastView")==="match"&&h.indexOf("MATCHGAME")>0);
  ok("header kept, Games lit", h.indexOf("Ava’s Corner")>0&&h.indexOf("kcPlayOpen('games','kidA','corner')\" style=\"flex:1;padding:8px 6px;border-radius:20px;border:2px dashed #d946ef;background:#d946ef")>0);
  ok("park/switch rounds per kid (gameKidSwitch kidA)", c.calls.some(x=>x[0]==="gks"&&x[1]==="kidA"));
  ok("no Mom's drill, Sprint, Scores, Heat Map, Admin, +, Problem words in the Corner", !/mastSetView\('(drill|sprint|scores|heatmap|admin)'\)|mastOpenAdd|pwOpen|eicPanelOpen|Heat Map/.test(h));
  c.set("matchState",{startTs:1,endTs:0,pausedAt:0,gate:null});
  c.kcPick("kidB");
  ok("switching kids from the header closes Games, pauses a running Match clock", c.get("kcPlay")===null&&c.get("matchState").pausedAt>0);
  ok("…and gives the Mastery tab its own view back", c.get("mastView")==="scores");
  ok("…the other kid lands on their own usual page", draw(c).indexOf("TODAYBODY")>0);
}
console.log("Kids' Corner: links on the kid's cards");
{ const c=mk(); c.retrSchedGo("kidA","study","s1");
  ok("a study link opens 📚 Drills under the header (no showTab)", c.shown().length===0&&c.get("kcPlay.mode")==="drills"&&c.get("mstSid")==="s1"&&draw(c).indexOf("Ava’s Corner")>0);
  ok("…the old header-less study bar is not used", c.get("kcStudyKid")===null&&draw(c).indexOf("kc-study-bar")<0);
  const g=mk(); g.retrSchedGo("kidA","match");
  ok("a Match link opens that Match in place — no games row (🎴 KC_CARD)", g.shown().length===0&&g.get("kcPlay.mode")==="card"&&g.get("kcPlay.view")==="match"&&draw(g).indexOf("MATCHGAME")>0&&!/class="games-sub"/.test(draw(g)));
  const d=mk(); d.retrSchedGo("kidA","drill");
  ok("a drill link opens that drill in place, drawn bare (🎴 KC_CARD)", d.shown().length===0&&d.get("kcPlay.mode")==="card"&&draw(d).indexOf("MASTPAGE(kidA,drill,bare,kid)")>0);
  const k=mk(); k.retrSchedGo("kidA","study","ck1");
  ok("a check-up link keeps the old path", k.get("kcPlay")===null);
  const o=mk(); o.retrSchedGo("kidB","study","s1");
  ok("another kid's link keeps the old path", o.get("kcPlay")===null);
  const m=mk({mom:true}); m.retrSchedGo("kidA","study","s1");
  ok("Mom switch on in the Corner → still the kid's page (🎴 KC_CARD, like KCLENS)", m.shown().length===0&&m.get("kcPlay.mode")==="drills");
  const t=mk(); t.kcCalSet("drills","kidA"); t.showTab("kids");
  ok("any tab tap closes Drills", t.get("kcPlay")===null);
}
console.log("🎴 KC_CARD: a schedule card opens its one thing in the Corner");
{ const c=mk(); const h0=draw(c);
  ok("the 📚 Drills button is now 📚 Study", h0.indexOf("\u{1F4DA} Study")>0&&h0.indexOf("\u{1F4DA} Drills")<0);
  c.retrSchedGo("kidA","drill"); const h=draw(c);
  ok("the kid's header and buttons stay on top", h.indexOf("Ava’s Corner")>0&&h.indexOf("kcPick('kidB')")>0&&h.indexOf("kcCalSet('today'")>0);
  ok("then only that drill — the Mastery page drawn bare (no kid row, view tabs, game row)", h.indexOf("MASTPAGE(kidA,drill,bare,kid)")>0&&!/class="games-sub"/.test(h));
  ok("no Study / Games button lit for a card", h.indexOf("border:2px dashed #d946ef;background:#d946ef")<0);
  c.set("mastView","scores"); const h2=draw(c);
  ok("a tap inside that changes the view can't move it off its drill", h2.indexOf("MASTPAGE(kidA,drill,bare,kid)")>0&&c.get("mastView")==="drill");
  ok("the header line says it came from the school day", h.indexOf("From your school day")>0);
  const s=mk(); s.retrOpenSprint("kidA");
  ok("a Sprint card opens that sprint in place", s.shown().length===0&&s.get("kcPlay.view")==="sprint"&&draw(s).indexOf("MASTPAGE(kidA,sprint,bare,kid)")>0);
  const m=mk({mom:true}); m.retrSchedGo("kidA","drill");
  ok("with the Mom switch on, the Corner still opens it in place, drawn as the kid", m.shown().length===0&&m.get("kcPlay.mode")==="card"&&draw(m).indexOf("MASTPAGE(kidA,drill,bare,kid)")>0);
  ok("…and the switch is straight back on after the draw", m._mom===true&&m._momSusp===null);
  const o=mk(); o.retrSchedGo("kidB","drill");
  ok("another kid's card keeps the old path", o.get("kcPlay")===null);
  const t=mk(); t.retrSchedGo("kidA","drill"); t.showTab("kids");
  ok("any tab tap closes the card", t.get("kcPlay")===null);
  const p=mk(); p.retrSchedGo("kidA","drill"); p.kcCalSet("today","kidA");
  ok("📆 Today closes it", p.get("kcPlay")===null&&draw(p).indexOf("TODAYBODY")>0);
}
console.log("🎴 KC_CARD: 📝 Log needs Mom's or Dad's code on the Corner");
{ const c=mk(); c.retrSchedGo("kidA","drill"); c.mastStartLog();
  ok("Log on a kid's Corner asks for the code — the drill doesn't start", c.get("mastLogMode")===false&&c.get("kcPlay.askLog")===true&&draw(c).indexOf('id="kc-log-pin"')>0);
  c.kcLogCode("9999");
  ok("a wrong code does nothing", c.get("mastLogMode")===false&&c.get("kcPlay.askLog")===true);
  c.kcLogCode("1111");
  ok("Mom's code starts the Log", c.get("mastLogMode")===true&&c.get("kcPlay.askLog")===false&&c.get("kcPlay.logOk")===true);
  ok("…and never turns Mom mode on", c._mom===false&&!c.calls.some(x=>x[0]==="momOn"));
  c.set("mastLogMode",false); c.mastStartLog();
  ok("…good for this page: a second Log doesn't ask again", c.get("mastLogMode")===true);
  c.kcCalSet("today","kidA"); c.retrSchedGo("kidA","drill"); c.set("mastLogMode",false); c.mastStartLog();
  ok("…but leaving and coming back asks again", c.get("mastLogMode")===false&&c.get("kcPlay.askLog")===true);
  c.kcLogCancel();
  ok("Cancel closes the code box", c.get("kcPlay.askLog")===false&&draw(c).indexOf('id="kc-log-pin"')<0);
  const d=mk(); d.retrSchedGo("kidA","drill"); d.kcLogCode("2222");
  ok("a code typed with no box open does nothing", d.get("mastLogMode")===false);
  d.mastStartLog(); d.kcLogCode("2222");
  ok("Dad's code works too", d.get("mastLogMode")===true);
  const m=mk({mom:true}); m.retrSchedGo("kidA","drill"); m.mastStartLog();
  ok("with the Mom switch on, Log doesn't ask", m.get("mastLogMode")===true&&!m.get("kcPlay.askLog"));
  const dd=mk({dad:true}); dd.retrSchedGo("kidA","drill"); dd.mastStartLog();
  ok("with Dad's code already in, Log doesn't ask", dd.get("mastLogMode")===true);
  const x=mk({tab:"mastery"}); x.mastStartLog();
  ok("off the Corner Log is unchanged (no code)", x.get("mastLogMode")===true);
}
console.log("Dad's Day");
{ const c=mk({tab:"moms-plan",mpSubView:"dadall",kcKid:""}); c.retrSchedGo("kidB","study","x");
  ok("a study link on Dad's page opens that kid's Drills inside Dad's Day (no showTab)", c.shown().length===0&&c.get("mpSubView")==="dadmast"&&c.get("kcPlay.from")==="dad"&&c.get("kcPlay.who")==="kidB");
  const el={innerHTML:""}; c.renderDadMast(el); const h=el.innerHTML;
  ok("his page: the kid's name, ← Dad's Day, Drills · Games, the study page", h.indexOf("Bo")>0&&h.indexOf("kcPlayBack()")>0&&h.indexOf("← Dad’s Day")>0&&h.indexOf("kcPlayOpen('games','kidB','dad')")>0&&h.indexOf("STUDYPAGE(kidB)")>0, h.slice(0,600));
  ok("…its top row is the sticky #mp-subnav, like his other pages", /id="mp-subnav"/.test(h));
  c.kcPlayBack();
  ok("← Dad's Day goes back to the page he came from (▸ Everyone today)", c.get("mpSubView")==="dadall"&&c.get("kcPlay")===null);
  const d=mk({tab:"moms-plan",mpSubView:"dad",kioskD:true,kcKid:""}); d.retrSchedGo("kidA","drill");
  ok("on his link, a Mom's-drill link lands on the kid's 📚 Drills (no Mom's drill for Dad)", d.get("kcPlay.mode")==="drills"&&d.shown().length===0);
  const k=mk({tab:"moms-plan",mpSubView:"dad",kcKid:""}); k.retrSchedGo("kidA","study","ck1");
  ok("a check-up link opens Drills on the list, never the check-up", k.get("mstSid")===null&&k.get("kcPlay.mode")==="drills");
  const s=mk({tab:"moms-plan",mpSubView:"dad",kcKid:""}); s.retrOpenSprint("kidA");
  ok("a Sprint link → Drills, the sprint plan isn't loaded", s.get("kcPlay.mode")==="drills"&&s.get("mastView")==="scores");
  const w=mk({tab:"moms-plan",mpSubView:"dad",kcKid:""}); w.retrSchedGo("kidA","which");
  ok("a Which one? link → Games", w.get("kcPlay.mode")==="games");
  const n=mk({tab:"moms-plan",mpSubView:"plan",kcKid:""}); n.retrSchedGo("kidA","study","s1");
  ok("off Dad's side without Mom's Day's code → the old path", n.get("kcPlay")===null&&n.shown().length===1);
}
console.log("Mom's Day");
{ const c=mk({tab:"moms-plan",mpSubView:"plan",mom:true,momDayIn:true,kcKid:""}); c.retrSchedGo("kidA","drill");
  ok("a mastery link opens the full Mastery page — Mom mode stays on", c.get("tab")==="mastery"&&c.get("mdFrameTab")==="mastery"&&c._mom===true&&!c.calls.some(x=>x[0]==="momOff"), c.calls);
  ok("…the top menu shows Mom's Day lit, not Mastery", c.navBtns.find(b=>b.dataset.tab==="moms-plan").on===true&&c.navBtns.find(b=>b.dataset.tab==="mastery").on===false);
  ok("…and it is the real view she asked for (Mom's drill)", c.get("mastView")==="drill"&&c.get("masteryKid")==="kidA");
  ok("mdFrameOn('mastery') is true there", c.mdFrameOn("mastery")===true);
  c.retrSchedGo("kidB","study","s9");
  ok("a second link from inside stays inside", c.get("mdFrameTab")==="mastery"&&c._mom===true);
  c.showTab("schedule");
  ok("the top menu's Schedule leaves the frame — Mom mode stays on (MOMSWITCH: the switch is the only off), no Mom's Day banner", c.get("mdFrameTab")===null&&c._mom===true&&!c.calls.some(x=>x[0]==="momOff")&&c.mdFrameOn("mastery")===false&&c.get("tab")==="schedule");
  const p=mk({tab:"mastery",mom:true,momDayIn:false,kcKid:""}); p.showTab("mastery");
  ok("the plain Mastery tab never draws the Mom's Day banner", p.get("mdFrameTab")===null&&p.mdFrameOn("mastery")===false);
  const s=mk({tab:"moms-plan",mpSubView:"plan",mom:true,momDayIn:true,kcKid:""}); s.set("momSchedView",true); s.set("tab","schedule"); s.retrOpenSprint("kidA");
  ok("from Mom's Day ▸ Schedule: a Sprint card opens there too, ▸ Schedule left cleanly (msvExit)", s.get("tab")==="mastery"&&s.get("mdFrameTab")==="mastery"&&s.calls.some(x=>x[0]==="msvExit")&&s._mom===true);
  const sw=mk({tab:"moms-plan",mpSubView:"plan",mom:true,momDayIn:false,kcKid:""}); sw.retrSchedGo("kidA","study","s1");
  ok("Mom mode on by the header switch (no code at the door this visit) → framed the same way", sw.get("mdFrameTab")==="mastery"&&sw.get("tab")==="mastery");
  const r=mk({tab:"moms-plan",mpSubView:"plan",mom:true,momDayIn:true,kioskK:true,kcKid:""});
  ok("on a Kids' Corner link the Mom's Day door is never used", r.mdFrameWanted()===false);
}
console.log("Wiring in the page");
{ const ri=fn("_renderMasteryInner");
  ok("Mastery draws Mom's banner + menu only when mdFrameOn('mastery')", /\(typeof mdFrameOn==="function"&&mdFrameOn\("mastery"\)\)\?\(mwBanner\([^)]*\)\+mpSubnav\('mastery'\)\):''/.test(ri));
  ok("its sticky header sits under her menu (body.md-frame)", /body\.md-frame \.mast-sticky\{top:calc\(var\(--hdr-h\) \+ var\(--nav-h\) \+ var\(--mp-h\)\)!important\}/.test(src)&&/class="mast-sticky" style="position:sticky/.test(ri)&&/classList\.toggle\("md-frame"/.test(fn("_renderAllInner")));
  const mv=fn("renderMomsPlanView");
  ok("Dad's Day routes dadmast to renderDadMast, and the Mom gate lets his page through", /mpSubView==='dadmast'\)\{ return renderDadMast\(el\); \}/.test(mv)&&/mpSubView==='dadmast'\) return true;/.test(fn("momGateOpen")));
  ok("no Today jump row on his Drills page", /"dadall","dadmast"\]/.test(src));
  ok("🎮 Games opens through GAMESTAB's own gamesOpen() — no second games entry", /if\(mode==="games"\) gamesOpen\(\);/.test(fn("kcPlayOpen"))&&!/function gamesOpen|GAMES_LIST/.test(block));
  ok("🎴 a direct Mastery redraw while the Corner / Dad's page shows it repaints that page, not the Mastery page", /function renderMastery\(el\)\{\n  if\(typeof kcPlay!=="undefined"&&kcPlay&&typeof tab!=="undefined"&&tab!=="mastery"\)\{ renderAll\(\); return; \}/.test(src));
  ok("🎴 bare: the Mastery header is cut back off, the Mom's Day banner never drawn, the Sprint source toggle hidden", /const _mbAt=h\.length;/.test(ri)&&/if\(typeof mastBare!=="undefined"&&mastBare\) h=h\.slice\(0,_mbAt\);/.test(ri)&&/let h=\(!_bare&&/.test(ri)&&/if\(!\(typeof mastBare!=="undefined"&&mastBare\)\) h\+=buildSprintSourceToggle\(color\);/.test(fn("buildSprintHtml")));
  ok("🎴 the real mastStartLog asks kcLogGate first", /^function mastStartLog\(\)\{ if\(typeof kcLogGate==="function"&&!kcLogGate\(\)\) return;/m.test(src));
  ok("msOpenFor (book sprint) goes through the same doors", /function msOpenFor\(kid\)\{ if\(typeof mastLinkRoute==="function"&&mastLinkRoute\(kid,"sprint"\)\) return;[^\n]*mastShowTab\(\);/.test(src));
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
