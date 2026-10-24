/*
 * 🎮 Games section in Mastery (her words 2026-10-23: "the games like match and which one and whatever else applies
 * per kid needs to be in a new section called games … a whole nother menu underneath that menu that sticks").
 * One 🎮 Games tab replaces 🎯 Match / 👆 Which one?; a sticky sub-menu lists only this kid's playable games.
 *   run:  node test_games_tab.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const a=src.indexOf("// GAMESTAB_START"), b=src.indexOf("// GAMESTAB_END");
ok("GAMESTAB block exists",a>0&&b>a);
const blk=src.slice(a,b);
// The real sticky header + tab row out of _renderMasteryInner.
const ha=src.indexOf("  // Kid filter + add button (sticky)"), hb=src.indexOf("  // ── ADMIN VIEW (Julian only) ──");
ok("header slice found",ha>0&&hb>ha);
const hdr=src.slice(ha,hb);
const r0=src.indexOf("function _renderMasteryInner(el){"), r1=src.indexOf("  // ── SCORES VIEW ──",r0);
const inner=src.slice(r0,r1);

// Lucy: a picture deck (Which one? + Match). Ellis: word↔meaning cards only (Match/Memory, no Which one?).
// Lincoln: plain flash cards — only "same pair" Match works. Julian: nothing playable.
function data(){
  const pics=["cat","dog","cow","pig","hen","owl"].map((p,i)=>({id:"l"+i,subject:"Frogs",prompt:p,emoji:"E"+i,status:"active"}));
  const defs=["geo","bio","tele","phon"].map((p,i)=>({id:"e"+i,subject:"Roots",prompt:p+"graph",def:"meaning "+i,status:"active"}));
  const flash=["gut","ja","nein","bitte"].map((p,i)=>({id:"n"+i,subject:"German",prompt:p,flat:1,status:"active"}));
  return {lucy:pics,ellis:defs,lincoln:flash,julian:[{id:"j1",subject:"Letters",prompt:"A",status:"graduated"}]};
}
function sandbox(){
  const L={re:0,styleCalls:[]};
  const ctx={
    console, Math, Object, Array, String, JSON,
    masteryData:data(), masteryKid:"lucy", mastView:"drill", matchStyle:"match", matchPairMode:"two", matchState:{x:1},
    mastScoreItemId:"q", mastManualScore:true,
    ROSTER:["lincoln","ellis","lucy","julian"], MAST_KID_COL:{lincoln:"#111",ellis:"#222",lucy:"#e11d48",julian:"#444"},
    MAST_KID_EMOJI:{lincoln:"L",ellis:"E",lucy:"U",julian:"J"}, SL_KLBL:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"},
    momHere:()=>false, mastAdminPinOk:false,
    // Stand-ins with the real rules' shape: "two" needs a picture or meaning, "same" needs any card face.
    mastMatchDecks(){ let it=ctx.masteryData[ctx.masteryKid]||[]; const by={};
      it.forEach(i=>{ if(i.status!=="active"&&i.status!=="introduction") return;
        const okk=ctx.matchPairMode==="same"?!!(i.emoji||i.def||i.flat):!!(i.emoji||i.def); if(okk) (by[i.subject]=by[i.subject]||[]).push(i); });
      return Object.keys(by).filter(k=>by[k].length>=4); },
    whichDecks(items){ const by={}; (items||[]).forEach(i=>{ if(i.emoji&&i.status==="active") by[i.subject]=(by[i.subject]||0)+1; }); return Object.keys(by).filter(d=>by[d]>=3); },
    buildMatchHtml:c=>"[MATCH "+ctx.matchStyle+" "+ctx.matchPairMode+" "+c+"]",
    buildWhichHtml:c=>"[WHICH "+c+"]",
    _mastRe(){ L.re++; },
    mastMatchSetStyle(v){ L.styleCalls.push(v); ctx.matchStyle=v; ctx.matchState=null; ctx._mastRe(); },
  };
  vm.createContext(ctx);
  vm.runInContext(src.match(/function mastSetView\(v\)\{[^\n]*\}/)[0],ctx);
  vm.runInContext(blk+"\n;this.GAMES_LIST=GAMES_LIST;this.gamesLast=gamesLast;"+
    "this._hdr=function(color){ let h=''; const kids=[...ROSTER];\n"+hdr+"\nreturn h; };",ctx);
  return {c:ctx,L};
}
const keys=(c,k)=>c.gamesFor(k).map(g=>g.key).join(",");

console.log("tab row");
{
  const {c}=sandbox();
  const h=c._hdr("#e11d48");
  ok("🎮 Games tab in the main row",h.indexOf('onclick="gamesOpen()">\\u{1F3AE} Games</button>')>=0||h.indexOf('onclick="gamesOpen()">\u{1F3AE} Games</button>')>=0);
  ok("no 🎯 Match tab in the main row",h.indexOf("mastSetView('match')")<0&&h.indexOf("\u{1F3AF} Match</button>")<0);
  ok("no 👆 Which one? tab in the main row",h.indexOf("mastSetView('which')")<0&&h.indexOf("Which one?</button>")<0);
  ok("other tabs stay",["drill","study","sprint","scores","heatmap","admin"].every(v=>h.indexOf("mastSetView('"+v+"')")>=0));
  ok("no sub-menu outside Games",h.indexOf("games-sub")<0);
  c.mastView="match";
  const h2=c._hdr("#e11d48");
  ok("Games tab lit while a game is on",/class="mast-view-tab active" onclick="gamesOpen\(\)"/.test(h2));
  ok("sub-menu sits under the tab row",h2.indexOf("games-sub")>h2.indexOf("mast-view-tabs"));
  // Sticky: the sub-menu is inside the sticky header div (header + nav offset), so it never scrolls away.
  const stickyAt=hdr.indexOf("position:sticky;top:calc(var(--hdr-h) + var(--nav-h))"), subAt=hdr.indexOf("h+=gamesSubHtml(color)");
  const after=hdr.slice(subAt);
  ok("sub-menu is drawn inside the sticky header",stickyAt>=0&&subAt>stickyAt&&/^h\+=gamesSubHtml\(color\);[^\n]*\n\s*h\+='<\/div>';\s*$/.test(after.trim()));
  ok("rendered header: sticky div opens first, sub-menu before it closes",h2.indexOf("position:sticky")<h2.indexOf("games-sub")&&h2.trim().endsWith("</div></div>"));
}

console.log("only this kid's games");
{
  const {c}=sandbox();
  ok("Lucy (picture deck): Match, Memory, Which one?",keys(c,"lucy")==="match,memory,which",keys(c,"lucy"));
  ok("Ellis (meanings, no pictures): Match + Memory, no Which one?",keys(c,"ellis")==="match,memory",keys(c,"ellis"));
  ok("Lincoln (flash cards): Match via same-pair, no Which one?",keys(c,"lincoln")==="match,memory",keys(c,"lincoln"));
  ok("Julian (nothing playable): no games",keys(c,"julian")==="");
  ok("checking another kid leaves masteryKid / matchPairMode alone",c.masteryKid==="lucy"&&c.matchPairMode==="two");
  c.masteryKid="ellis"; c.mastView="match";
  const s=c.gamesSubHtml("#222");
  ok("Ellis's sub-menu: Match + Memory buttons only",s.indexOf("gamesPick('match')")>=0&&s.indexOf("gamesPick('memory')")>=0&&s.indexOf("gamesPick('which')")<0);
  ok("current game is lit in kid color",/class="kid-btn active"[^>]*gamesPick\('match'\)[^>]*background:#222/.test(s));
  ok("list is data-driven (key/label/emoji/available/render each)",c.GAMES_LIST.every(g=>g.key&&g.label&&g.emoji&&typeof g.available==="function"&&typeof g.render==="function"));
  c.masteryKid="julian"; c.mastView="games";
  ok("no games → no sub-menu",c.gamesSubHtml("#444")==="");
  ok("no games → a friendly line",/No games ready yet/.test(c.gamesBodyHtml("#444")));
}

console.log("picking a game");
{
  const {c,L}=sandbox();
  c.gamesPick("memory");
  ok("Memory flip → match view + matchStyle memory",c.mastView==="match"&&c.matchStyle==="memory"&&L.styleCalls.join()==="memory");
  ok("style change goes through mastMatchSetStyle (fresh board)",c.matchState===null);
  ok("score popups cleared",c.mastScoreItemId===null&&c.mastManualScore===false);
  ok("current key is memory",c.gamesCurrentKey()==="memory");
  c.gamesPick("match");
  ok("Match → matchStyle match",c.matchStyle==="match"&&c.gamesCurrentKey()==="match");
  c.matchState={keep:1}; const re=L.re;
  c.gamesPick("match");
  ok("picking the same style again keeps the board",c.matchState&&c.matchState.keep===1&&L.re===re+1);
  c.gamesPick("which");
  ok("Which one? → which view",c.mastView==="which"&&c.gamesCurrentKey()==="which");
  c.gamesPick("nope");
  ok("unknown key does nothing",c.mastView==="which");
  // Lincoln only has same-pair decks: picking Match lands on Same pair so the deck chips show.
  c.masteryKid="lincoln"; c.matchPairMode="two"; c.gamesPick("match");
  ok("flash-only kid lands on Same pair",c.matchPairMode==="same"&&c.mastView==="match");
}

console.log("last game per kid");
{
  const {c}=sandbox();
  c.gamesOpen();
  ok("first visit → first available game (Match)",c.mastView==="match"&&c.matchStyle==="match");
  c.gamesPick("which");
  c.masteryKid="ellis"; c.gamesOpen();
  ok("Ellis's first visit → Match",c.gamesCurrentKey()==="match");
  c.gamesPick("memory");
  c.masteryKid="lucy"; c.mastView="drill"; c.gamesOpen();
  ok("back to Lucy → her Which one?",c.gamesCurrentKey()==="which");
  c.masteryKid="ellis"; c.mastView="drill"; c.gamesOpen();
  ok("back to Ellis → her Memory flip",c.gamesCurrentKey()==="memory"&&c.matchStyle==="memory");
  ok("remembered per kid",c.gamesLast.lucy==="which"&&c.gamesLast.ellis==="memory");
  c.masteryKid="lincoln"; c.gamesLast.lincoln="which"; c.mastView="drill"; c.gamesOpen();
  ok("a remembered game the kid can't play falls back to the first",c.gamesCurrentKey()==="match");
  c.masteryKid="julian"; c.gamesOpen();
  ok("no games → bare Games section",c.mastView==="games"&&c.gamesActive());
  // The in-Match style toggle (or an old caller) also updates the memory when the sub-menu draws.
  c.masteryKid="lucy"; c.mastView="match"; c.matchStyle="memory"; c.gamesSubHtml("#e11d48");
  ok("in-game style toggle is remembered",c.gamesLast.lucy==="memory");
  ok("in memory only — no Firebase in the block",blk.indexOf("db.ref")<0&&blk.indexOf(".set(")<0&&blk.indexOf(".update(")<0);
}

console.log("old views still land");
{
  const {c}=sandbox();
  c.mastSetView("match");
  ok("mastSetView('match') is in Games",c.gamesActive()&&c.gamesCurrentKey()==="match");
  ok("…and draws Match",c.gamesBodyHtml("#e11d48").indexOf("[MATCH match")===0);
  ok("…with the sub-menu",c.gamesSubHtml("#e11d48").indexOf("gamesPick('which')")>=0);
  c.mastSetView("which");
  ok("mastSetView('which') draws Which one?",c.gamesActive()&&c.gamesBodyHtml("#e11d48")==="[WHICH #e11d48]");
  c.mastSetView("games");
  ok("bare Games with games → 'Pick a game above.'",/Pick a game above/.test(c.gamesBodyHtml("#e11d48")));
  c.mastSetView("sprint");
  ok("not Games for other views",!c.gamesActive()&&c.gamesSubHtml("#e11d48")==="");
  ok("renderMastery dispatches games through gamesBodyHtml",/if\(gamesActive\(\)\)\{[^\n]*\n\s*h\+=gamesBodyHtml\(color\);/.test(inner));
  ok("old per-game dispatch blocks are gone",inner.indexOf('if(mastView==="match")')<0&&inner.indexOf('if(mastView==="which")')<0);
  ok("Mom's ▶ Play link still calls mastSetView('match')",src.indexOf("onclick=\"mastSetView(\\'match\\')\"")>=0);
  ok("no 🔀 emoji",blk.indexOf("\u{1F500}")<0&&blk.indexOf("1F500")<0);
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
