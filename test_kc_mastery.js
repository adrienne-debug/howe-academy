/*
 * 🧒📚 KC_MASTERY — a kid's study cards from Kids' Corner (her ask 2026-10-15, DeWalt family, Taylor): "she wants to click to
 * go to her study lessons and it will not allow her to … a 'go back to Kids' Corner' bar in her color, saying whatever kid,
 * and below that all her studies." On the Kids' Corner tab, for the picked kid, Mom mode off, a study link opens that kid's
 * 📚 Study INSIDE the Corner — no app menus, no Match, no Mom controls, no check-ups. Mom mode and every other path unchanged.
 *   run:  node test_kc_mastery.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const A=src.indexOf("// KC_MASTERY_START"), B=src.indexOf("// KC_MASTERY_END");
ok("the block is marked", A>0&&B>A);
const block=src.slice(A,B);
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };

console.log("No new writes");
ok("no db.ref( inside the block", block.indexOf("db.ref(")<0);
ok("no .set( / .update( / .remove( / .push( / .transaction( inside the block", !/\.(set|update|remove|push|transaction)\(/.test(block));
ok("no localStorage of its own (a paused sitting rides mstPersist, as Quit for now does)", !/localStorage|HA_LS\.setItem/.test(block)&&/mstPersist\(\)/.test(fn("kcStudyClose")));
ok("the study view is the existing renderMastStudy (not rebuilt)", /renderMastStudy\(\{noCheckup:true\}\)/.test(block)&&!/mstTap\(|mstStart\(|mstSave\(/.test(block));
ok("var, not let — showTab / renderAll read kcStudyKid from earlier in the file (no TDZ throw)", /\nvar kcStudyKid=null;/.test(block));
ok("no 🔀 anywhere", src.indexOf("🔀")<0);

// ── a sandbox with the block + the real retrSchedGo / renderKidsCorner / renderMastStudy, everything else stubbed ──
function mk(o){
  o=o||{}; const calls=[];
  const sessions=o.sessions||[{sid:"s1",name:"Math facts",emoji:"➕",kind:"deck"},{sid:"s2",name:"Spelling",emoji:"🔤",kind:"deck"},{sid:"ck1",name:"Facts check-up",kind:"checkup"}];
  const ctx={console,Object,Array,String,Number,Math,JSON,Date,RegExp,Error,Set,
    calls, window:{scrollTo:()=>{}},
    tab:o.tab||"kids", kcKid:("kcKid" in o)?o.kcKid:"taylor", _mom:!!o.mom,
    momHere:()=>ctx._mom, _kcLoadKid:()=>{},
    KID_COLOR:{taylor:"#d946ef",kenzie:"#0ea5e9"}, KID_NAME:{taylor:"Taylor",kenzie:"Kenzie"}, cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    esc:s=>String(s).replace(/</g,"&lt;"), kcLittle:()=>false,
    masteryKid:"kenzie", mastView:"drill", mastLogMode:true, mastLogScores:{a:1}, mastLogDeck:"x", mastSessionKey:"k", mastSlideIdx:3, mastScoreItemId:"i", mastAdminLocal:{}, mastAddCat:"",
    mstKid:"kenzie", mstSid:"old", mstState:o.running?{run:1}:null, mstFlipped:true, mstDone:{total:1}, mstStartTs:5, mstTyped:"9", mstChecked:{ok:1}, mstHist:[1], mstRedo:[2], mstSaveErr:null,
    mstNavReset:()=>{ ctx.mstHist=[]; ctx.mstRedo=[]; calls.push(["navReset"]); },
    mstPersist:()=>calls.push(["persist",ctx.masteryKid,ctx.mstSid]),
    mstSessions:k=>{ calls.push(["sessions",k]); return k==="taylor"?sessions:[{sid:"k1",name:"Kenzie deck",kind:"deck"}]; },
    renderAll:()=>calls.push(["render"]), showTab:t=>calls.push(["showTab",t]),
    MAST_BANK_MAP:{},
    // renderMastStudy's own helpers — the real function runs on these
    mstEsc:s=>String(s), mstEscJs:s=>String(s), mastGetPrintNum:()=>1, mstLogGet:()=>null,
    mstPile:()=>({reviews:[{id:"r"}],learning:[],newNames:[{deck:"d",name:"n"}]}),
    mstSentBackPending:()=>false, mstHowtoHtml:()=>"", mstControlsHtml:()=>"<i>controls</i>", mstHasPersisted:()=>false,
    ckRenderHtml:()=>'<button onclick="ckMomStart()">🔒 Mom or Dad: start the check-up</button>',
    kcCalToggleHTML:k=>"TOGGLE", kcModeBodyHTML:k=>"CORNERBODY", kcCalGet:()=>"today", kcEmoji:()=>"🦄", _kcTint:()=>"#eee", ROSTER:["taylor","kenzie"]};
  vm.createContext(ctx);
  vm.runInContext(block+"\n"+fn("retrSchedGo")+"\n"+fn("renderMastStudy")+"\n"+fn("renderKidsCorner"),ctx);
  ctx.get=e=>vm.runInContext(e,ctx); ctx.set=(k,v)=>{ ctx.__v=v; vm.runInContext(k+"=__v",ctx); };
  return ctx;
}

console.log("The gate");
{ const c=mk();
  ok("Kids' Corner tab, her own study, Mom mode off → opens in the Corner", c.kcStudyIntercept("taylor","s1")===true);
  ok("…with no session named (the card's subject has none) → still hers", c.kcStudyIntercept("taylor")===true);
  ok("another kid's study → not intercepted (old path)", c.kcStudyIntercept("kenzie","k1")===false);
  ok("a 🩺 check-up → not intercepted (Mom runs those; old path)", c.kcStudyIntercept("taylor","ck1")===false);
  c._mom=true; ok("Mom mode on → not intercepted (nothing changes for Mom)", c.kcStudyIntercept("taylor","s1")===false);
  const d=mk({tab:"schedule"}); ok("off the Kids' Corner tab (Schedule, General tablet's My Day) → not intercepted", d.kcStudyIntercept("taylor","s1")===false);
  const e=mk({kcKid:""}); ok("no kid picked → not intercepted", e.kcStudyIntercept("taylor","s1")===false);
}
console.log("retrSchedGo — the tap that used to be refused");
{ const c=mk();
  c.retrSchedGo("taylor","study","s2");
  ok("from Kids' Corner: no showTab('mastery') (the Corner link refused it)", !c.calls.some(x=>x[0]==="showTab"), c.calls);
  ok("…the Corner now shows Taylor's study, landing on the session the card named", c.get("kcStudyKid")==="taylor"&&c.get("mstSid")==="s2"&&c.get("masteryKid")==="taylor"&&c.get("mstKid")==="taylor");
  ok("…a fresh landing: no other kid's sitting, flip, done banner, typed answer or Back stack", c.get("mstState")===null&&c.get("mstFlipped")===false&&c.get("mstDone")===null&&c.get("mstTyped")===""&&c.get("mstChecked")===null&&c.get("mstHist").length===0);
  ok("…Mom's log mode is cleared, and the Mastery page's own view is left alone", c.get("mastLogMode")===false&&c.get("mastView")==="drill");
  ok("…and it re-renders", c.calls.some(x=>x[0]==="render"));
  ok("kcStudyOn() is true now", c.kcStudyOn()===true);
  const m=mk({mom:true}); m.retrSchedGo("taylor","study","s2");
  ok("Mom mode: retrSchedGo still goes to the Mastery tab exactly as before", m.calls.some(x=>x[0]==="showTab"&&x[1]==="mastery")&&m.get("kcStudyKid")===null&&m.get("mastView")==="study");
  const d=mk(); d.retrSchedGo("taylor","drill");
  ok("a Drills link (not study) keeps the old path", d.calls.some(x=>x[0]==="showTab"&&x[1]==="mastery")&&d.get("kcStudyKid")===null);
  const k=mk(); k.retrSchedGo("taylor","study","ck1");
  ok("a check-up link keeps the old path", k.calls.some(x=>x[0]==="showTab"&&x[1]==="mastery")&&k.get("kcStudyKid")===null);
  const s=mk({tab:"schedule"}); s.retrSchedGo("taylor","study","s1");
  ok("from the Schedule tab it keeps the old path", s.calls.some(x=>x[0]==="showTab"&&x[1]==="mastery")&&s.get("kcStudyKid")===null);
}
console.log("The bar and the kid-only scope");
{ const c=mk(); c.kcStudyOpen("taylor","s1");
  const el={innerHTML:""}; c.renderKidsCorner(el); const h=el.innerHTML;
  ok("the Corner draws the study page, not the Corner body", h.indexOf("CORNERBODY")<0&&h.indexOf("TOGGLE")<0&&/kc-study-bar/.test(h), h.slice(0,300));
  ok("a bar in her colour reading ← Kids’ Corner · Taylor", /class="kc-study-bar" style="[^"]*background:#d946ef/.test(h)&&h.indexOf("← Kids’ Corner · Taylor")>0, h.slice(0,500));
  ok("the bar's tap goes back to the Corner (kcStudyClose)", /onclick="kcStudyClose\(\)"[^>]*>← Kids/.test(h));
  ok("the bar sticks to the top", /class="kc-study-bar" style="position:sticky;top:0/.test(h));
  ok("all her study sessions to work through (both decks as pills)", h.indexOf("mstPick('s1')")>0&&h.indexOf("mstPick('s2')")>0&&/Start<\/button>/.test(h));
  ok("only Taylor's sessions are read — never another kid's", c.calls.filter(x=>x[0]==="sessions").every(x=>x[1]==="taylor"), c.calls);
  ok("no kid switcher (mastSetKid / kid-btn)", !/mastSetKid|kid-btn/.test(h));
  ok("no Match, Drills, Sprint, Scores, Heat Map or Admin tabs (mastSetView)", !/mastSetView|Match|Heat Map|Admin/.test(h));
  console.log("No Mom controls rendered");
  ok("no Problem words, + add, Editor in Chief", !/pwOpen|mastOpenAdd|eicPanelOpen/.test(h));
  ok("no log/scoring mode (mastLog / Add Past Score)", !/mastLog|mastOpenManualScore|Add Past Score/.test(h));
  ok("no check-up: its pill is gone and the Mom-or-Dad start button never draws", h.indexOf("mstPick('ck1')")<0&&!/ckMomStart|check-up/.test(h));
  ok("masteryKid is pinned to the Corner's kid on every draw", (()=>{ c.set("masteryKid","kenzie"); const e2={innerHTML:""}; c.renderKidsCorner(e2); return c.get("masteryKid")==="taylor"; })());
  const only=mk({sessions:[{sid:"ck1",name:"Facts check-up",kind:"checkup"}]}); only.kcStudyOpen("taylor"); const e3={innerHTML:""}; only.renderKidsCorner(e3);
  ok("a kid whose only session is a check-up sees “No study sessions yet.”, not Mom's button", /No study sessions yet/.test(e3.innerHTML)&&!/ckMomStart/.test(e3.innerHTML));
  const real=mk({tab:"mastery"}); real.set("masteryKid","taylor");
  ok("the Mastery tab (no opts) still lists the check-up as before", real.renderMastStudy().indexOf("mstPick('ck1')")>0);
}
console.log("Leaving, and Mom mode");
{ const c=mk(); c.kcStudyOpen("taylor","s1"); c.set("mstState",{run:1}); c.calls.length=0;
  c.kcStudyClose();
  ok("← Kids' Corner keeps a sitting in progress on the device (Resume next time), like Quit for now", c.calls.some(x=>x[0]==="persist"&&x[1]==="taylor"&&x[2]==="s1"), c.calls);
  ok("…closes the study view and re-renders the Corner", c.get("kcStudyKid")===null&&c.get("mstState")===null&&c.calls.some(x=>x[0]==="render"));
  const el={innerHTML:""}; c.renderKidsCorner(el); ok("…the Corner body is back", el.innerHTML.indexOf("CORNERBODY")>0);
  const m=mk(); m.kcStudyOpen("taylor","s1"); m._mom=true;
  const e2={innerHTML:""}; m.renderKidsCorner(e2);
  ok("Mom mode switched on mid-study → the normal Corner, and the study flag is dropped", e2.innerHTML.indexOf("CORNERBODY")>0&&m.get("kcStudyKid")===null&&m.kcStudyOn()===false);
  const p=mk(); p.kcStudyOpen("taylor","s1"); p.set("kcKid","kenzie");
  const e3={innerHTML:""}; p.renderKidsCorner(e3);
  ok("“Not Taylor?” → a different kid picked never inherits Taylor's study view", e3.innerHTML.indexOf("CORNERBODY")>0&&p.get("kcStudyKid")===null);
  const q=mk({mom:true}); q.kcStudyOpen("taylor","s1"); ok("kcStudyOpen itself refuses in Mom mode", q.get("kcStudyKid")===null);
}
console.log("The menus and the wiring");
{ const css=src.slice(src.indexOf("/* ── 🧒📚 KC_MASTERY"),src.indexOf("/* 🔢 Build fingerprint."));
  ok("body.kc-study hides the app header and the top tabs (and the other bars)", /body\.kc-study #app-header/.test(css)&&/body\.kc-study #nav-tabs/.test(css)&&/body\.kc-study #mom-pin-bar/.test(css)&&/\{display:none!important\}/.test(css));
  ok("renderAll toggles body.kc-study from kcStudyOn() on every draw (so it comes off when the view ends)", /document\.body\.classList\.toggle\("kc-study",typeof kcStudyOn==="function"&&kcStudyOn\(\)\)/.test(fn("_renderAllInner")));
  ok("showTab: any tab tap leaves the Corner's study view", /tab=t;\n\s*if\(typeof kcStudyKid!=="undefined"\) kcStudyKid=null;/.test(fn("showTab")));
  ok("the Corner link lock in showTab is unchanged", /if\(_kioskK\(\)&&t!=="kids"\) return;/.test(fn("showTab")));
  ok("retrSchedGo's hook is study-only and asks the gate first", /^function retrSchedGo\(kid,view,sid\)\{\n\s*if\(view==="study"&&typeof kcStudyIntercept==="function"&&kcStudyIntercept\(kid,sid\)\)\{ kcStudyOpen\(kid,sid\); return; \}/.test(fn("retrSchedGo")));
  ok("the Mastery page still calls renderMastStudy() with no options", /\(typeof renderMastStudy==="function"\)\?renderMastStudy\(\):''/.test(src));
}

console.log("\n"+pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
