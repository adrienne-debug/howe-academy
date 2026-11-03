/*
 * 👍👎 "Did you like it?" after a game (her words 2026-11-03). One line under every game's finish card, one tap, skippable, once per
 * round; saved at mastery/<kid>_settings/gameLikes/<game>/<ts> = {v, deck, at} (one targeted set); the games grid's header shows the
 * tally, the rules pop-up the last answers. Nothing moves on its own. Runs the REAL block (+ GAMEGRID + GAMERULES for Mom's view).
 *   run:  node test_game_like.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
let pass=0, fail=0;
function ok(n,c,x){ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x)+")":""));} }
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
function fnText(name){ const i=src.indexOf("function "+name+"("); if(i<0) return ""; const j=src.indexOf("\nfunction ",i+10); return src.slice(i,j<0?undefined:j); }

// ── by text ──
const a=src.indexOf("// GAMELIKE_START"), b=src.indexOf("// GAMELIKE_END"), sp=src.indexOf("// SPELLBUILD_END"), sc=src.indexOf("// STUDYCOUNTS_START");
ok("one GAMELIKE block among the game blocks: after SPELLBUILD_END, before STUDYCOUNTS_START, straight after another block's _END line",sp>0&&a>sp&&b>a&&sc>b&&/^\/\/ [A-Z_]+_END$/m.test(src.slice(sp,a).trim().split("\n").pop()||"")&&src.indexOf("// GAMELIKE_START",a+1)<0&&src.indexOf("// GAMELIKE_END",b+1)<0);
const blk=src.slice(a,b), code=blk.replace(/^\s*\/\/.*$/gm,"");
ok("no kid's or family's name in the block",!/lincoln|ellis|lucy|julian|caleb|taylor|makenzie|kenzie|andrew|dewalt|burris|howe/i.test(blk));
ok("no 🔀 anywhere in index.html",src.indexOf("\u{1F500}")<0);
ok("writes: ONE targeted set of mastery/<kid>_settings/gameLikes/<game>/<ts>, guarded; no update / remove / push; no points, nothing moves",(code.match(/db\.ref\(/g)||[]).length===1&&/db\.ref\("mastery\/"\+kid\+"_settings\/gameLikes\/"\+key\+"\/"\+ts\)\.set\(rec\)/.test(code)&&/typeof db!=="undefined"&&db&&!\(typeof _dryRun==="function"&&_dryRun\(\)\)/.test(code)&&!/\.update\(|\.remove\(|\.push\(\{|bankDirect|points|gameDeckSet|\.tier\b|next_due/.test(code.replace(/last\.push/g,"")));
ok("hooks, one guarded line each: GAMESTAB's gamesBodyHtml, GAMERULES' gameRulesBtnHtml (tally) and gameRulesHtml (list)",/if\(g\) return g\.render\(color\)\+\(\(typeof gameLikeHtml==="function"\)\?gameLikeHtml\(masteryKid,g\.key,color\):""\);/.test(fnText("gamesBodyHtml"))&&/\(typeof gameLikeTallyHtml==="function"\)\?gameLikeTallyHtml\(kid,g\.key\):''/.test(fnText("gameRulesBtnHtml"))&&/if\(typeof gameLikeListHtml==="function"\) h\+=gameLikeListHtml\(kid,game\);/.test(fnText("gameRulesHtml")));
{ const list=cut("const GAMES_LIST=[","\n];"), keys=[...list.matchAll(/\{key:"([a-z]+)"/g)].map(m=>m[1]), tbl=cut("const GAME_LIKE_STATE={","\n};"), inTbl=k=>new RegExp("(^|[\\s,{])"+k+":\\(\\)=>").test(tbl);
  const missing=keys.filter(k=>k!=="idflash"&&!inTbl(k));
  ok("GAME_LIKE_STATE covers every GAMES_LIST game but ID Flash (the class site's): "+keys.join(" "),missing.length===0&&!inTbl("idflash"),missing); }

// ── a sandbox: GAMEGRID + GAMERULES + GAMELIKE, a few game states, a fake document ──
function world(o){
  o=o||{};
  const writes=[], nodes={};
  const mk=()=>({style:{},_h:"",id:"",set innerHTML(v){ this._h=v; },get innerHTML(){ return this._h; },remove(){ delete nodes[this.id]; },onclick:null});
  const CODE=cut("// GAMELOG_START","// GAMELOG_END")+"\n"+cut("// GAMEGRID_START","// GAMEGRID_END")+"\n"+cut("// GAMERULES_START","// GAMERULES_END")+"\n"+cut("// GAMELIKE_START","// GAMELIKE_END");
  const VARS=[...new Set([...cut("const GAME_LIKE_STATE={","\n};").matchAll(/:\(\)=>(\w+)/g)].map(m=>m[1]))];   // every state variable the table names
  const ctx={console,JSON,Object,Array,String,Number,Math,Set,Map,RegExp,Date,parseInt,isNaN,setTimeout:()=>0,
    document:{getElementById:id=>nodes[id]||null,createElement:()=>mk(),body:{appendChild(n){ nodes[n.id]=n; }}},
    momHere:()=>o.mom!==false,_dryRun:()=>!!o.dry,HA_LS:{setItem(){}},_mastRe(){ ctx._renders=(ctx._renders||0)+1; },renderAll(){},cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    _gamesItems:k=>(k==="k"?[{id:"x1",subject:"Animals",prompt:"cat",status:"active",tier:"weekly"}]:[]),   // one deck, so the grid draws its header
    GAMES_LIST:[{key:"which",emoji:"\u{1F446}",label:"Which one?",view:"which",available:()=>true,render:()=>""},{key:"spell",emoji:"\u{1F524}",label:"Build it",view:"spell",available:()=>true,render:()=>""},{key:"match",emoji:"\u{1F3AF}",label:"Match",view:"match",style:"match",available:()=>true,render:()=>""}],
    masteryKid:"k",masteryData:{k:[],k_settings:o.settings||{}},
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v]),push:v=>writes.push(["push",p,v]),remove:()=>writes.push(["remove",p])})}};
  vm.createContext(ctx);
  // the game states the table reads, as `let`s like the real ones (others stay undefined → no line)
  ctx.masteryData.gameLog={}; ctx.mstTodayKey=()=>"20261103";
  vm.runInContext("let "+VARS.map(v=>v+"=null").join(", ")+";\n"+CODE+"\n"+VARS.map(v=>"Object.defineProperty(this,'"+v+"',{get:()=>"+v+",set:x=>{"+v+"=x;}});").join(" ")+" this.gameLikeSeen=gameLikeSeen; this.VARS="+JSON.stringify(VARS)+";",ctx);
  return {c:ctx,writes,nodes};
}

{ const w=world(), c=w.c;
  ok("no round on screen → no line; a running round → no line; a game not in the table → no line",c.gameLikeHtml("k","which","#000")===""&&(c.whichState={kid:"k",deck:"Animals",t0:100,phase:"play",turns:[{pid:"p1",done:true,first:true,wrong:{}}],gameLogged:true},c.gameLikeHtml("k","which","#000")==="")&&c.gameLikeHtml("k","idflash","#000")==="");
  c.whichState.phase="done";
  let h=c.gameLikeHtml("k","which","#000");
  ok("a finished round → 'Did you like it?' with 👍 👎 and skip",/Did you like it\?/.test(h)&&/gameLike\('k','which',1\)/.test(h)&&/gameLike\('k','which',-1\)/.test(h)&&/gameLikeSkip\('k','which'\)/.test(h)&&/\u{1F44D}/u.test(h)&&/\u{1F44E}/u.test(h));
  ok("👍 → ONE targeted set {v:1, deck, at} under gameLikes/which/<ts>, in memory too, the screen re-drawn",c.gameLike("k","which",1)===true&&w.writes.length===1&&w.writes[0][0]==="set"&&/^mastery\/k_settings\/gameLikes\/which\/\d+$/.test(w.writes[0][1])&&w.writes[0][2].v===1&&w.writes[0][2].deck==="Animals"&&typeof w.writes[0][2].at==="number"&&Object.keys(c.masteryData.k_settings.gameLikes.which).length===1&&c._renders===1);
  h=c.gameLikeHtml("k","which","#000");
  ok("after the answer the line says 'You said 👍 — thanks!' and the thumbs are gone; a second tap on the same round writes nothing",/You said \u{1F44D}/u.test(h)&&!/gameLike\('k'/.test(h)&&c.gameLike("k","which",-1)===false&&w.writes.length===1);
  c.whichState={kid:"k",deck:"Animals",t0:200,phase:"done",turns:[{pid:"p1",done:true,first:false,wrong:{x:1}}],gameLogged:true};
  ok("a NEW round (new start time) asks again, and the kid may answer differently",/Did you like it\?/.test(c.gameLikeHtml("k","which","#000"))&&c.gameLike("k","which",-1)===true&&w.writes.length===2&&w.writes[1][2].v===-1);
  c.whichState={kid:"k",deck:"Shapes",t0:300,phase:"done",turns:[{pid:"p2",done:true,first:true,wrong:{}}],gameLogged:true};
  ok("skip: nothing written, the line goes away for that round only",c.gameLikeSkip("k","which")===true&&w.writes.length===2&&c.gameLikeHtml("k","which","#000")===""&&(c.whichState={kid:"k",deck:"Shapes",t0:301,phase:"done",turns:[{pid:"p2",done:true,first:true,wrong:{}}],gameLogged:true},/Did you like it\?/.test(c.gameLikeHtml("k","which","#000"))));
  const t=c.gameLikeTally("k","which");
  ok("the tally: 👍 1 · 👎 1, newest first with the deck",t.up===1&&t.down===1&&t.last.length===2&&t.last[0].v===-1&&t.last[0].deck==="Animals");
  ok("Mom's grid header: the tally beside the game's name; nothing for a game with no answers",/\u{1F44D} 1 · \u{1F44E} 1/u.test(c.gameLikeTallyHtml("k","which"))&&c.gameLikeTallyHtml("k","spell")===""&&/glike-tally/.test(c.gameDecksHtml("k")));
  ok("the rules pop-up lists the last answers with dates (and the no-rules line still shows for Which one?)",/Did they like it\? \u{1F44D} 1 · \u{1F44E} 1/u.test(c.gameRulesHtml("k","which"))&&(c.gameRulesHtml("k","which").match(/\u{1F44D} |\u{1F44E} /gu)||[]).length>=2&&/Animals/.test(c.gameRulesHtml("k","which"))&&/no rules yet/.test(c.gameRulesHtml("k","which")));
}
{ const w=world(), c=w.c;
  c.matchState={kid:"k",deck:"Roots",startTs:500,endTs:null,style:"match",tiles:[{pid:"a",matched:true},{pid:"a",matched:true},{pid:"b",matched:false}]};
  ok("Match / Memory flip: no line until the board is done (endTs)",c.gameLikeHtml("k","match","#000")===""&&(c.matchState.endTs=900,/Did you like it\?/.test(c.gameLikeHtml("k","match","#000"))));
  ok("…and the answer lands under the key of the game being played (memory shares Match's state)",c.gameLike("k","memory",1)===true&&/gameLikes\/memory\//.test(w.writes[0][1]));
}
{ const w=world({dry:true}), c=w.c;
  c.spellState={kid:"k",deck:"AAS Words",t0:7,phase:"done",turns:[{pid:"w1",done:true,first:true,wrong:{}}],gameLogged:true};
  ok("?dryrun=1: the answer is kept in memory, nothing is written",c.gameLike("k","spell",1)===true&&w.writes.length===0&&c.gameLikeTally("k","spell").up===1);
}
{ const w=world({settings:{gameLikes:{spell:{"1762100000000":{v:1,deck:"AAS Words",at:1762100000000},"1762200000000":{v:-1,deck:"Spelling",at:1762200000000},"bad":{v:5}}}}}), c=w.c;
  const t=c.gameLikeTally("k","spell");
  ok("stored answers read back (a bad record ignored), newest first",t.up===1&&t.down===1&&t.last[0].deck==="Spelling"&&/Spelling/.test(c.gameLikeListHtml("k","spell")));
  ok("another kid's answers are their own",c.gameLikeTally("z","spell").up===0);
}
{ const w=world(), c=w.c;   // her word 2026-11-03: "they had to actually play the game to score it"
  const keys=[...cut("const GAMES_LIST=[","\n];").matchAll(/\{key:"([a-z]+)"/g)].map(m=>m[1]).filter(k=>k!=="idflash"), tbl=cut("const GAME_LIKE_STATE={","\n};");
  const varOf=k=>(tbl.match(new RegExp("(?:^|[\\s,{])"+k+":\\(\\)=>(\\w+)"))||[])[1];
  const unplayed=k=>k==="match"||k==="memory"?{kid:"k",deck:"D",startTs:1,endTs:2,tiles:[{pid:"a",matched:false},{pid:"a",matched:false}]}:{kid:"k",deck:"D",t0:1,phase:"done",turns:[],gameLogged:false};
  const played=k=>k==="match"||k==="memory"?{kid:"k",deck:"D",startTs:1,endTs:2,tiles:[{pid:"a",matched:true},{pid:"a",matched:true}]}:{kid:"k",deck:"D",t0:1,phase:"done",turns:[{pid:"c1",done:true,first:true,wrong:{}}],gameLogged:true};
  const bad=keys.filter(k=>{ const v=varOf(k); c[v]=unplayed(k); const h0=c.gameLikeHtml("k",k,"#000"); const s0=c.gameLikeSkip("k",k); const l0=c.gameLike("k",k,1); c[v]=played(k); const h1=c.gameLikeHtml("k",k,"#000"); c[v]=null; return !(h0===""&&s0===false&&l0===false&&/Did you like it\?/.test(h1)); });
  ok("every game: a round done with NOTHING answered (or a timed-out / bailed round) shows no line and takes no skip or answer; one answered card shows it — "+keys.length+" keys",bad.length===0&&w.writes.length===0,bad);
  c.whichState={kid:"k",deck:"D",t0:5,phase:"done",turns:[{pid:"c1",done:false,first:false,wrong:{}}],gameLogged:true};
  ok("a logged flag with no ANSWERED card (gameLogEntry counts none) still shows nothing",c.gameLikeHtml("k","which","#000")==="");
  c.matchState={kid:"k",deck:"D",startTs:1,endTs:2,tiles:[]};
  ok("Match with no pair matched: nothing",c.gameLikeHtml("k","match","#000")===""&&c.gameLikeHtml("k","memory","#000")==="");
  ok("gameLikePlayed is pure and guarded: null / odd states are 'not played'",c.gameLikePlayed("which",null)===false&&c.gameLikePlayed("which",{phase:"done"})===false&&c.gameLikePlayed("match",{tiles:"x"})===false);
}
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
