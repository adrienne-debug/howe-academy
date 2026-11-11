/*
 * Node tests — 🏫 CPMYCLASS, "My class" on Lincoln's 🌿 tile (2026-11-10). Her words: Lincoln is "missing out on seeing how many stars he
 * gets for this, how the team scores are and what his scores are like", and a way to play games on JUST Envirothon while all his sessions
 * stay mixed as they are.
 *   · where the block sits (classes.js beside CPLINCOLN*, its marker in index.html) and its six typeof-guarded hook lines; it writes nothing
 *   · the strip: drawn for a mirrored kid with the class layer in, on his own 📚 Study page; "" for everything else (the page as before)
 *   · ⭐ the class stars are CPPOINTS' own numbers (envSummary → cpPtsSum) for a sample memo + game log
 *   · Team: one boards/<cid> listener with the mirror's subs (envmRelAttach), off with them (envmDetach); refused → "Boards aren't posted yet"
 *   · My scores: the class site's station rows, released stations only
 *   · 🎮 the door's filter: _gamesItems / gameDeckOn keep the Envirothon decks while that Games page is up; ✕ or leaving clears it
 *   · 0 Firebase writes                                                                               run: node test_cp_myclass.js
 */
const fs=require("fs"), path=require("path");
const {world,src}=require("./test_env_site.js");
let pass=0, fail=0;
const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x).slice(0,600):"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a); if(i<0) throw new Error("missing "+a); const j=src.indexOf(b,i); return src.slice(i,j+b.length); };
function fn(name){ const i=src.indexOf("\nfunction "+name+"("); if(i<0) throw new Error("missing "+name);
  let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"){ d--; if(!d) return src.slice(i+1,k+1); } } }
const MC=cut("// CPMYCLASS_START","// CPMYCLASS_END"), LN=cut("// CPLINCOLN_START","// CPLINCOLN_END"), PTS=cut("// CPPOINTS_START","// CPPOINTS_END");
const raw=fs.readFileSync(path.join(__dirname,"index.html"),"utf8"), CJS=fs.readFileSync(path.join(__dirname,"classes.js"),"utf8"), EJS=fs.readFileSync(path.join(__dirname,"env.js"),"utf8");
const T="🏫 CPMYCLASS";

console.log("── the block, where it sits, how it is hooked ──");
{ ok("one CPMYCLASS block in classes.js, right after CPLINCOLNPARITY_END", CJS.indexOf("// CPLINCOLNPARITY_END\n// CPMYCLASS_START")>0&&CJS.split("// CPMYCLASS_START").length===2&&raw.indexOf("// CPMYCLASS_START")<0);
  ok("its marker in index.html right after CPLINCOLNPARITY's", raw.indexOf("// ⇢ classes.js: CPLINCOLNPARITY\n// ⇢ classes.js: CPMYCLASS\n")>0);
  ok("the header has her words and the date", /2026-11-10/.test(MC.slice(0,400))&&/missing out on seeing how many stars he gets/.test(MC)&&/JUST Envirothon/.test(MC));
  ok("the block only declares (nothing runs at load)", MC.split("\n").every(l=>!l.trim()||/^(\/\/|function |const | |})/.test(l)));
  const code=MC.split("\n").filter(l=>!/^\s*\/\//.test(l)).join("\n");
  ok("it writes nothing: no set / update / remove / transaction, no push on a ref, no db, no envsWrite", !/\.(set|update|remove|transaction)\(|\.ref\([^)]*\)\.push\(|\br\.push\(|\bdb\b|envsWrite\(|envcWrite\(|bankDirect\(/.test(code));
  ok("its only read is ONE on(\"value\") listener on boards/<cid>", (code.match(/\.on\(/g)||[]).length===1&&(code.match(/\.ref\(/g)||[]).length===1&&/edb\.ref\("boards\/"\+cid\)/.test(code)&&!/\.once\(/.test(code));
  ok("its only storage is HA_LS ha_cpmc_open_<kid>", (code.match(/HA_LS\.(setItem|getItem)\(/g)||[]).length===2&&/"ha_cpmc_open_"\+kid/.test(code)&&!/localStorage|sessionStorage/.test(code));
  ok("no Howe kid name as a code literal; no 🔀", !/["'`](lincoln|ellis|lucy|julian)["'`]/i.test(MC)&&MC.indexOf("\u{1F500}")<0);
  const hooks=(raw+"\n"+EJS).split("\n").filter(l=>l.indexOf(T)>=0&&!/^\/\/ /.test(l.trim()));
  ok("six hook lines outside the block, each typeof-guarded and tagged "+T, hooks.length===6&&hooks.filter(l=>/typeof cp[mM]\w*==="function"/.test(l)).length===5&&hooks.some(l=>/^if\(opts\.released&&!s\.released\) return;/.test(l.trim())), hooks.map(l=>l.trim().slice(0,90)));
  ok("…renderMastStudy: the strip under the 🌿 start, never under a running sitting, right before its return", /\n  if\(!running&&typeof cpMyClassHtml==="function"\) h\+=cpMyClassHtml\(kid,session\);[^\n]*\n  return h;\n}/.test(fn("renderMastStudy")+"\n}")||/if\(!running&&typeof cpMyClassHtml==="function"\) h\+=cpMyClassHtml\(kid,session\);[^\n]*\n  return h;\n$/.test(fn("renderMastStudy").slice(0,-1)));
  ok("…_gamesItems: the filter, the same array when it's off", /if\(typeof cpmcItems==="function"\) it=cpmcItems\(k,it\); return it; }/.test(raw));
  ok("…gameDeckOn: its first line", /function gameDeckOn\(kid,game,deck\)\{\n  if\(typeof cpmcDeckOff==="function"&&cpmcDeckOff\(kid,deck\)\) return false;/.test(raw));
  ok("…kcPlayBodyHTML: the chip tops the Games page", /body=\(\(typeof cpmcGamesChip==="function"\)\?cpmcGamesChip\(k\):""\)\+gamesSubHtml\(col\)/.test(fn("kcPlayBodyHTML")));
  ok("…envmRelAttach: the boards listener with the mirror's subs", /cpmcAttach\(kid,cid,_envm\.edb,_envm\.subs,envmSid\(kid\)\)/.test(fn("envmRelAttach")));
  ok("…envsStationRowsHtml: released only when asked (every other caller passes no such opt)", /if\(opts\.released&&!s\.released\) return;/.test(fn("envsStationRowsHtml"))&&!/released:true/.test(src.replace(MC,"")));
  const names=(MC.match(/^(?:function|const) (\w+)/gm)||[]).map(x=>x.split(" ")[1]), rest=src.replace(MC,"");
  ok("none of its top-level names is declared anywhere else (one global scope)", names.length>15&&names.every(n=>!new RegExp("(function|const|let|var)\\s+"+n.replace(/\$/g,"\\$")+"\\b").test(rest)), names.filter(n=>new RegExp("(function|const|let|var)\\s+"+n+"\\b").test(rest)));
  ok("the normal 🎮 Games button is untouched (kcPlayToggleHTML, gamesOpen, gamesFor carry no CPMYCLASS line)", !/cpmc/.test(fn("kcPlayToggleHTML"))&&!/cpmc/.test(fn("gamesOpen"))&&!/cpmc/.test(src.slice(src.indexOf("function gamesFor("),src.indexOf("\n",src.indexOf("function gamesFor(")))));
  ok("judged rounds: GAMELOG → mastery/gameLog, and CPPOINTS' cpPtsSum counts them per day (nothing added here)", /cpPtsGamesByDay\(kid,M,mp\.isDeck,mp\.subjOf\)/.test(PTS)&&/mastery\/gameLog\//.test(fn("gameLogRound"))&&!/gameLog/.test(MC.split("\n").filter(l=>!/^\s*\/\//.test(l)).join("\n"))); }

// ── the world: the class site's harness (ENVMIRROR, ENVSITE, …) as Howe with the class link, + CPLINCOLN, CPPOINTS, this block and
//    the real _gamesItems / gameDeckOn / envDrillDecks; a stand-in kcPlayOpen (KC_PLAY's: a NEW page object each open, then gamesOpen)
const FAM={familyId:"howe",roster:[],envirothon:{firebase:{databaseURL:"https://howe-envirothon.example"},classId:"c1"}};
const STUBS='var kcPlay=null; function kcPlayOpen(mode,k,from){ kcPlay={who:k,mode:mode,from:from||"corner"}; if(mode==="games") gamesOpen(); else renderAll(); }';
const REV=[LN,PTS,MC,fn("envDrillDecks"),fn("_gamesItems"),"let _gdRaw=false;",fn("gdKey"),fn("_gdMD"),fn("gameDeckOn"),STUBS,
  "G.mc={ _cpmc, _cpln, cplnOn, cplnDecks, cpMyClassHtml, cpmcStars, cpmcRule, cpmcGames, cpmcGamesOn, cpmcItems, cpmcDeckOff, cpmcGamesChip, cpmcGamesOff, cpmcAttach, cpmcToggle, cpmcIsOpen, _gamesItems, gameDeckOn, envDrillDecks, cpPtxDay, cpPtsWould, CPPTS, envSummary, envsStationRowsHtml, envsBoardsHtml, envmRelAttach, envmDetach, ENV_DECKS, ENV_UNIT_ID, get kcPlay(){ return kcPlay; }, set kcPlay(v){ kcPlay=v; } };"].join("\n");
function W(o){ o=o||{};
  const w=world({fam:JSON.parse(JSON.stringify(FAM)),rev:REV,unitStudies:{},masteryData:{}});
  const m=w.G.mc; w.m=m;
  const decks=m.ENV_DECKS.map(d=>({key:d[0],stage:d[2],station:d[3],n:d[5]}));
  w.unitStudies[m.ENV_UNIT_ID]={id:m.ENV_UNIT_ID,decks:decks,enrolled:{lincoln:true}};
  w.D=decks.map(d=>d.key);
  if(o.signedIn!==false) w._envm.user={uid:"u1",email:"mom@x"};
  w._envm.classOf.lincoln="c1";   // envmAuthChanged sets it from the config's classId
  if(o.layer!==false) m._cpln.kids.lincoln={cid:"c1",sid:"howe_lincoln",cls:{},plan:{},stu:{},ok:true};
  if(o.page!==false) m.kcPlay={who:"lincoln",mode:"drills",from:"corner"};
  // the mirror's app: on/off recorded, a refused read when asked, every write recorded (there must be none)
  w.E={on:[],off:[],writes:[]}; const bd=o.boards;
  w._envm.edb={ref:p=>({ on(ev,f,bad){ w.E.on.push(p); if(o.refuse&&bad){ bad(new Error("permission_denied")); return; } if(bd!==undefined&&p==="boards/c1") f({val:()=>bd}); },
    off(ev,f){ w.E.off.push(p); }, once(ev,f){ f({val:()=>null}); }, set(v){ w.E.writes.push(["set",p]); }, update(v){ w.E.writes.push(["update",p]); }, push(v){ w.E.writes.push(["push",p]); }, remove(){ w.E.writes.push(["remove",p]); }, transaction(){ w.E.writes.push(["transaction",p]); } })};
  return w; }
const ENV={sid:"envirothon",name:"Envirothon",emoji:"🌿"};
const B={at:1,teams:[{name:"Otters",members:["howe_lincoln","x_maya"],memberNames:["Lincoln","Maya"],gain:12,ready:{},badges:{}}],effort:[{sid:"x_maya",name:"Maya",score:30,reviews:24,streak:2},{sid:"howe_lincoln",name:"Lincoln",score:20,reviews:14,streak:2},{sid:"x_ana",name:"Ana",score:5,reviews:5,streak:0}],stations:[]};

console.log("\n── the strip: who sees it ──");
{ const w=W({boards:B}); w.m.envmRelAttach("lincoln");
  const h=w.m.cpMyClassHtml("lincoln",ENV);
  ok("a mirrored kid, his class layer in, on his own 📚 Study page → the strip", /data-cpmc="strip"/.test(h)&&/🏫 My class/.test(h));
  const at=k=>h.indexOf('data-cpmc="'+k+'"');
  ok("…four parts in order: ⭐ stars · Team · My scores · 🎮 the door", at("stars")>0&&at("stars")<at("boards")&&at("boards")<at("scores")&&at("scores")<at("gamesdoor"));
  ok("…the class site's card styles are put on the page (envsCss, once)", w.G.created.some(e=>e&&e.id==="envs-css"));
  ok("…the door is 🎮 Games, just Envirothon", /🎮 Games, just Envirothon/.test(h)&&/cpmcGames\('lincoln'\)/.test(h));
  const same=s=>s==="";
  ok("class layer not in (reads not arrived) → \"\"", same(W({layer:false}).m.cpMyClassHtml("lincoln",ENV)));
  ok("signed out of the class link → \"\"", same(W({signedIn:false}).m.cpMyClassHtml("lincoln",ENV)));
  ok("not his own 📚 Study page (Mom's Mastery tab: no kcPlay) → \"\"", same(W({page:false}).m.cpMyClassHtml("lincoln",ENV)));
  { const x=W(); x.m.kcPlay={who:"lincoln",mode:"games",from:"corner"}; ok("…nor his Games page → \"\"", same(x.m.cpMyClassHtml("lincoln",ENV))); }
  ok("another session (Daily Mix) → \"\"", same(w.m.cpMyClassHtml("lincoln",{sid:"daily_mix",name:"Daily Mix"})));
  { const x=W(); x.m.kcPlay={who:"ellis",mode:"drills",from:"corner"}; ok("another kid (not mirrored, no class layer) → \"\"", same(x.m.cpMyClassHtml("ellis",ENV))); }
  { const x=W(); x._envs.css=false; const before=x.G.created.length; x.m._cpln.pause=1; ok("the class layer paused (cplnRaw) → \"\" and nothing put on the page", same(x.m.cpMyClassHtml("lincoln",ENV))&&x.G.created.length===before); }
  // renderMastStudy's line: h + "" === h — the page is byte for byte what it was
  const line=fn("renderMastStudy").split("\n").find(l=>/cpMyClassHtml/.test(l));
  const run=(cpm)=>{ let h="<div>START</div>"; const running=false, kid="lincoln", session=ENV; const cpMyClassHtml=cpm; eval(line.replace(/\/\/.*$/,"")); return h; };
  ok("renderMastStudy's own line: the class layer off → the same HTML as before, byte for byte", run(W({layer:false}).m.cpMyClassHtml)==="<div>START</div>");
  ok("…and the block not loaded at all (classes.js not here) → the same HTML", (()=>{ let h="<div>START</div>"; const running=false, kid="lincoln", session=ENV; eval(line.replace(/\/\/.*$/,"").replace(/cpMyClassHtml/g,"cpMyClassHtml_absent")); return h; })()==="<div>START</div>");
  ok("…and under a running sitting nothing is drawn", (()=>{ let h="x"; const running=true, kid="lincoln", session=ENV; const cpMyClassHtml=w.m.cpMyClassHtml; eval(line.replace(/\/\/.*$/,"")); return h; })()==="x");
  ok("not on the class site: the boards listener never attaches there, the strip is \"\"", (()=>{ const x=W(); x.G.fam.edition="envirothon"; const subs={}; return x.envSiteOn()&&x.m.cpmcAttach("lincoln","c1",x._envm.edb,subs,"s")===false&&!Object.keys(subs).length&&x.m.cpMyClassHtml("lincoln",ENV)===""; })()); }

console.log("\n── ⭐ the class stars are CPPOINTS' numbers ──");
{ const w=W(); const m=w.m, M=w.masteryData, d0=w.D[0], d1=w.D[3];
  const today=m.cpPtxDay(), yms=Date.UTC(+today.slice(0,4),+today.slice(4,6)-1,+today.slice(6,8))-86400000, yday=new Date(yms).toISOString().slice(0,10).replace(/-/g,"");
  const its=(n,deck)=>({items:Array.from({length:n},(_,i)=>({deck,name:"c"+i,result:i%4?"c":"m"}))});
  M.studyLog={lincoln:{envirothon:{[today]:its(17,d0),[yday]:its(5,d1)}}};
  // his memo on this device (CPPOINTS' cpPtsMemo): today cleared at 12 with 17 studied (5 past the pile), yesterday part of the day
  w.HA_LS.setItem("ha_cppts_howe_lincoln",JSON.stringify({[today]:{cards:17,done:true,base:12,due:12},[yday]:{cards:5,done:false,base:null,due:14}}));
  M.lincoln=Array.from({length:10},(_,i)=>({id:"e"+i,subject:d0,prompt:"c"+i,status:"active",tier:"weekly"})).concat([{id:"g1",subject:"German",prompt:"Hund",status:"active",tier:"weekly"}]);
  M.gameLog={lincoln:{[today]:{local_1:{game:"match",deck:d0,at:1,items:Array.from({length:10},(_,i)=>({id:"e"+i,ok:i<9}))},
    local_2:{game:"match",deck:"German",at:2,items:[{id:"g1",ok:true}]},local_3:{game:"gofish",deck:d0,at:3,items:[{id:"e1",ok:true}]}}}};
  const sm=m.envSummary("lincoln");
  const exp=3+1+2, expY=1;   // Day done 3 + Extra 1 (5 past) + Match 9/10 → 2 · the German round and the unjudged Go Fish give nothing · yesterday Part 1
  ok("the sample: CPPOINTS gives today "+exp+" and the season "+(exp+expY)+" (informational: starsInfo)", sm.days[today].stars===exp&&sm.days[yday].stars===expY&&sm.stars===exp+expY&&sm.starsInfo===true, {t:sm.days[today],y:sm.days[yday],s:sm.stars});
  const s=m.cpmcStars(sm,today,null);
  ok("cpmcStars reads exactly those numbers (today, season)", s.today===sm.days[today].stars&&s.season===sm.stars);
  ok("…today's how in CPPOINTS' words: 🌿 Day done · 🌿 Extra · 5 cards · 🎮 1 round, 90% right", JSON.stringify(s.how)===JSON.stringify(["🌿 Day done","🌿 Extra · 5 cards","🎮 Games · 1 round, 90% right"]), s.how);
  ok("…yesterday-shaped day: 🌿 Part of the day", JSON.stringify(m.cpmcStars(sm,yday,null).how)===JSON.stringify(["🌿 Part of the day"]));
  ok("…a day with nothing → 0 and no how", m.cpmcStars(sm,"19990101",null).today===0&&m.cpmcStars(sm,"19990101",null).how.length===0);
  const h=m.cpMyClassHtml("lincoln",ENV);
  ok("the strip shows ⭐ "+exp+" class stars today and ⭐ "+(exp+expY)+" this season, labelled class stars", h.indexOf("⭐ "+exp+" <span style=\"font-size:13px;font-weight:800\">class stars today")>0&&h.indexOf("⭐ "+(exp+expY)+" <span style=\"font-size:12px\">this season")>0);
  ok("…the week in cpPtsWeekLine's own line", /This week: ⭐ \d+ · days done \d+ · extra \d+ cards? · /.test(h));
  ok("…the rule from CPPTS, and the Star Bank line", h.indexOf(m.cpmcRule().replace(/’/g,"’"))>0&&/Stars: 3 for a day’s cards all done \(1 for part of them\), 1 per 5 extra cards \(3 a day at most\), 1–2 a game round at 70% right or better \(4 a day at most\)\./.test(h)&&/not in your Star Bank/.test(h));
  ok("…his Star Bank untouched (no bankDirect)", !(w.G.bankWrites||[]).length);
  ok("the memo is CPPOINTS' own HA_LS key on this device (no database)", w.E.writes.length===0&&w.G.writes.length===0); }

console.log("\n── 🏆 Team: the boards through the mirror ──");
{ const w=W({boards:B}); const m=w.m;
  m.envmRelAttach("lincoln");
  ok("envmRelAttach attaches ONE boards/c1 listener, kept in _envm.subs with the mirror's others", w.E.on.filter(p=>p==="boards/c1").length===1&&!!w._envm.subs["lincoln|cpmcBoards"]&&!!w._envm.subs["lincoln|all"]);
  m.envmRelAttach("lincoln");
  ok("…attaching again adds none", w.E.on.filter(p=>p==="boards/c1").length===1);
  const h=m.cpMyClassHtml("lincoln",ENV), want=m.envsBoardsHtml(B,"howe_lincoln");
  ok("the boards exactly as the class site's Team tab draws them (envsBoardsHtml with his sid)", h.indexOf(want)>0);
  ok("…his effort row marked (you)", /Lincoln \(you\)/.test(h));
  m.envmDetach();
  ok("envmDetach (signed out) takes it off with the others", w.E.off.indexOf("boards/c1")>=0&&!w._envm.subs["lincoln|cpmcBoards"]);
  const r=W({refuse:true}); r.m.envmRelAttach("lincoln");
  ok("a refused read → \"Boards aren't posted yet\"", /Boards aren’t posted yet/.test(r.m.cpMyClassHtml("lincoln",ENV))&&!/data-cpmc="boards"/.test(r.m.cpMyClassHtml("lincoln",ENV)));
  ok("no listener at all → the same line", /Boards aren’t posted yet/.test(W().m.cpMyClassHtml("lincoln",ENV)));
  const n=W({boards:null}); n.m.envmRelAttach("lincoln");
  ok("nothing posted (null) → the site's own empty-boards card", n.m.cpMyClassHtml("lincoln",ENV).indexOf(n.m.envsBoardsHtml(null,"howe_lincoln"))>0);
  ok("no writes on either app", w.E.writes.length===0&&w.G.writes.length===0&&r.E.writes.length===0); }

console.log("\n── 📊 My scores: released stations only ──");
{ const w=W(); const m=w.m, st=w.envsStations(), M=w.masteryData;
  const heldSt=st[st.length-1], hold={}; heldSt.decks.forEach(d=>{ hold[d.key]=true; });
  M.lincoln_settings={cat_hold:hold};
  M.lincoln_tests={[st[0].id]:{pre:{right:6,n:10,date:"2026-10-01"},post:{best:{right:9,n:10,date:"2026-10-20"}}}};
  const sm=m.envSummary("lincoln"), h=m.cpMyClassHtml("lincoln",ENV), sc=h.slice(h.indexOf('data-cpmc="scores"'),h.indexOf('data-cpmc="gamesdoor"'));
  ok("the class site's station rows, his summary, released only", sc.indexOf(m.envsStationRowsHtml(sm,{kid:"lincoln",released:true}))>0);
  ok("…a held station is left out (no 🔒 not sent out yet), a released one is in", sc.indexOf(">"+heldSt.label)<0&&sc.indexOf("not sent out yet")<0&&sc.indexOf(st[0].label)>0);
  ok("…check-in / final on the row", /check-in 6\/10 · final 9\/10/.test(sc));
  ok("the site's own callers (no opt) still list every station, held ones as 🔒", /not sent out yet/.test(m.envsStationRowsHtml(sm,{}))); }

console.log("\n── 🎮 Games, just Envirothon: the filter ──");
{ const w=W(); const m=w.m, M=w.masteryData, D=w.D;
  M.lincoln=D.map((d,i)=>({id:"e"+i,subject:d,prompt:"c"+i,status:"active"})).concat([{id:"g1",subject:"German",prompt:"Hund",status:"active"},{id:"s1",subject:"Science",prompt:"cell",status:"active"}]);
  M.ellis=[{id:"x1",subject:"German",prompt:"Katze",status:"active"}];
  ok("his Envirothon decks are the unit's fifteen", m.cplnDecks("lincoln").length===15&&D.length===15);
  const all=m._gamesItems("lincoln");
  ok("before the door: every deck, mixed", all.length===17&&m.gameDeckOn("lincoln","match","German")===true);
  const page=m.kcPlay; m.cpmcGames("lincoln");
  ok("the door opens his Games page (KC_PLAY's kcPlayOpen, a new page) and the filter binds to it", m.kcPlay!==page&&m.kcPlay.mode==="games"&&m._cpmc.gf&&m._cpmc.gf.play===m.kcPlay&&!m._cpmc.gf.pending&&w.mastView==="match");
  const its=m._gamesItems("lincoln");
  ok("_gamesItems → the 15 Envirothon decks' cards only", its.length===15&&its.every(i=>D.indexOf(i.subject)>=0));
  ok("gameDeckOn: German / Science off, an Envirothon deck on (every game reads this rule)", m.gameDeckOn("lincoln","match","German")===false&&m.gameDeckOn("lincoln","which","Science")===false&&m.gameDeckOn("lincoln","match",D[2])===true);
  M.lincoln_settings={gameDecks:{[D[2].replace(/[.#$\/\[\]]/g,"_")]:{match:false}}};
  ok("…Mom's own per-deck switch still counts inside it (her off stays off)", m.gameDeckOn("lincoln","match",D[2])===false&&m.gameDeckOn("lincoln","which",D[2])===true);
  delete M.lincoln_settings;
  ok("another kid's games are untouched while it is on", m._gamesItems("ellis").length===1&&m.gameDeckOn("ellis","match","German")===true);
  ok("the chip \"🌿 Envirothon only · ✕\" tops the section", /data-cpmc="chip"/.test(m.cpmcGamesChip("lincoln"))&&/🌿 Envirothon only · ✕/.test(m.cpmcGamesChip("lincoln"))&&/cpmcGamesOff\(\)/.test(m.cpmcGamesChip("lincoln")));
  m.cpmcGamesOff();
  ok("✕ clears it: every deck again, no chip", m._cpmc.gf===null&&m._gamesItems("lincoln").length===17&&m.cpmcGamesChip("lincoln")===""&&m.gameDeckOn("lincoln","match","German")===true);
  // leaving the section: 📚 Study (a new page), another kid, ← back (kcPlay gone), the normal 🎮 button (a new games page)
  const leave=(go,label)=>{ m.kcPlay={who:"lincoln",mode:"drills",from:"corner"}; m.cpmcGames("lincoln"); const on=m._gamesItems("lincoln").length===15; go();
    ok("leaving by "+label+" clears it by itself", on&&m._gamesItems("lincoln").length===17&&m._cpmc.gf===null&&m.cpmcGamesChip("lincoln")===""); };
  leave(()=>{ m.kcPlay={who:"lincoln",mode:"drills",from:"corner"}; },"📚 Study");
  leave(()=>{ m.kcPlay=null; },"← Kids' Corner / another tab (kcPlayClose)");
  leave(()=>{ m.kcPlay={who:"ellis",mode:"games",from:"corner"}; },"another kid");
  leave(()=>{ m.kcPlay={who:"lincoln",mode:"games",from:"corner"}; },"his normal 🎮 Games button (a fresh page)");
  leave(()=>{ m._cpln.kids.lincoln.ok=false; },"the class layer going away");
  m._cpln.kids.lincoln.ok=true;
  ok("his normal 🎮 Games (no door): mixed, the same array back", (()=>{ m.kcPlay={who:"lincoln",mode:"games",from:"corner"}; const a=M.lincoln; return m.cpmcItems("lincoln",a)===a&&m._gamesItems("lincoln").length===17; })());
  ok("the door does nothing without his class layer", (()=>{ const x=W({layer:false}); return x.m.cpmcGames("lincoln")===false&&x.m._cpmc.gf===null; })());
  ok("from Dad's Day the door keeps Dad's page (from: dad)", (()=>{ const x=W(); x.m.kcPlay={who:"lincoln",mode:"drills",from:"dad"}; x.m.cpmcGames("lincoln"); return x.m.kcPlay.from==="dad"&&x.m.kcPlay.mode==="games"; })());
  ok("no writes", w.E.writes.length===0&&w.G.writes.length===0); }

console.log("\n── collapsible, remembered on this device ──");
{ const w=W(); const m=w.m;
  ok("open by default", m.cpmcIsOpen("lincoln")&&/data-cpmc="stars"/.test(m.cpMyClassHtml("lincoln",ENV)));
  const r0=w.G.renders; m.cpmcToggle("lincoln");
  ok("one tap closes it: HA_LS ha_cpmc_open_lincoln = 0, a repaint, only the bar left", w.HA_LS.getItem("ha_cpmc_open_lincoln")==="0"&&w.G.renders>r0&&/data-cpmc="toggle"/.test(m.cpMyClassHtml("lincoln",ENV))&&!/data-cpmc="stars"/.test(m.cpMyClassHtml("lincoln",ENV)));
  m.cpmcToggle("lincoln");
  ok("…and opens again", w.HA_LS.getItem("ha_cpmc_open_lincoln")==="1"&&/data-cpmc="stars"/.test(m.cpMyClassHtml("lincoln",ENV)));
  ok("0 Firebase writes in the whole run", w.E.writes.length===0&&w.G.writes.length===0); }

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
