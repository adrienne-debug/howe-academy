// 🔑 Admin code (2026-10-03): settings/adminPin opens every PIN door (Mom, Dad, Kitchen, Mastery, Notebook/Units,
// blockouts, points, attendance, plan-week, library, School Room) next to the family's own codes. No code default.
const fs=require("fs"), vm=require("vm");
const src=fs.readFileSync(__dirname+"/index.html","utf8"), libSrc=fs.readFileSync(__dirname+"/library.js","utf8"), playSrc=fs.readFileSync(__dirname+"/play.js","utf8");
let pass=0, fail=0; const ok=(n,c)=>{ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n);} };
const fnIn=(s,name)=>{ const a=s.indexOf("function "+name+"("); if(a<0) throw new Error("missing "+name); let i=s.indexOf("{",a), d=0, j=i; for(;j<s.length;j++){ if(s[j]==="{")d++; else if(s[j]==="}"){ d--; if(!d) break; } } return s.slice(a,j+1); };
const fn=n=>fnIn(src,n);

// ── static: every door goes through pinOk, nothing compares to APP_PIN directly, no default, never displayed
ok("no gate compares straight to APP_PIN any more", !/===\s*APP_PIN/.test(src));
ok("ADMIN_PIN has NO code default (page source is public)", /let ADMIN_PIN=HA_LS\.getItem\("ha_admin_pin"\)\|\|"";/.test(src));
ok("listens on its OWN path settings/adminPin (not settings/pin)", /db\.ref\("settings\/adminPin"\)\.on\("value"/.test(src));
ok("ADMIN_PIN is never rendered into the page", !/'\s*\+\s*ADMIN_PIN|ADMIN_PIN\s*\+\s*'/.test(src));
ok("library.js + play.js doors also accept it", /pinOk\(v\)/.test(libSrc)&&/pinOk\(val\)/.test(playSrc));
ok("blockout dialog door uses pinOk", /if\(pinOk\(this\.value\)\)\{adminPinUnlocked=true;closeBoDialog\(\);/.test(src));

// ── behaviour: run the real door functions in a sandbox
function sandbox(st){
  const els={}; const el=id=>els[id]||(els[id]={value:"",textContent:"",style:{},focus(){},previousElementSibling:null});
  const ctx={ console, String, setTimeout:()=>{}, HA_LS:{getItem:()=>null,setItem(){},removeItem(){}},
    document:{getElementById:el}, window:{}, renderAll(){ctx.rendered++;}, rendered:0, _mastRe(){}, _preserveUI(f){f();},
    renderMomsPlan(){}, renderHistory(){}, pnwStartWizard(){ctx.wiz=1;}, plCloseSheet(){}, plSetMode(m){ctx.plMode=m;}, kitPinClose(){},
    APP_PIN:st.app, DAD_PIN:st.dad, ADMIN_PIN:st.admin, pnwPendingWeek:null,
    momPinUnlocked:false, momModeActive:false, kid:"all", adminPinUnlocked:false, dadUnlocked:false, mastAdminPinOk:false,
    mastListEditMode:false, mastListEditPin:"", ptsEditUnlocked:false, attEditUnlocked:false, els };
  ctx.window=ctx;
  vm.createContext(ctx);
  const names=["_pinStr","_adminPinOk","pinOk","dadPinOk","checkMomPin","checkAdminPin","kitPinCheck","mastAdminCheckPin","mastListEditCheck","checkPtsPin","checkAttPin","pnwCheckPin","dadPinTry"];
  vm.runInContext(names.map(fn).join("\n")+"\n"+fnIn(libSrc,"lbPinTry")+"\n"+fnIn(playSrc,"plMomPinTry"),ctx);
  return ctx;
}
const doors=[
  ["Mom mode",      c=>{c.checkMomPin(c._v);         return c.momPinUnlocked&&c.momModeActive;}],
  ["Admin/Rules/Notebook/Units", c=>{c.checkAdminPin(c._v,"x"); return c.adminPinUnlocked;}],
  ["Kitchen",       c=>{c.kitPinCheck(c._v);         return c.adminPinUnlocked;}],
  ["Mastery admin", c=>{c.mastAdminCheckPin(c._v);   return c.mastAdminPinOk;}],
  ["Mastery list edit", c=>{c.mastListEditCheck(c._v); return c.mastListEditMode;}],
  ["Points edit",   c=>{c.checkPtsPin(c._v);         return c.ptsEditUnlocked;}],
  ["Attendance",    c=>{c.els["att-pin-input"]={value:c._v,style:{}}; c.checkAttPin(); return c.attEditUnlocked;}],
  ["Plan week",     c=>{c.pnwCheckPin(c._v);         return c.adminPinUnlocked&&c.wiz===1;}],
  ["Library",       c=>{c.lbPinTry(c._v);            return c._plMomOk===true;}],
  ["School Room",   c=>{c.plMomPinTry(c._v);         return c._plMomOk===true&&c.plMode==="mom";}],
  ["Dad stars",     c=>{c.els["dad-pin-input"]={value:c._v,style:{}}; c.dadPinTry(); return c.dadUnlocked;}],
];
const fam={app:"1234",dad:"5678",admin:"0329"};
for(const [name,run] of doors){
  const own=name==="Dad stars"?fam.dad:fam.app;
  let c=sandbox(fam); c._v=own;    ok(name+": family's own code still opens", run(c));
  c=sandbox(fam); c._v="0329";     ok(name+": admin code 0329 opens", run(c));
  c=sandbox(fam); c._v="9999";     ok(name+": a wrong code stays shut", !run(c));
  c=sandbox({...fam,admin:""}); c._v="0329"; ok(name+": no admin code set → 0329 does nothing (today's behaviour)", !run(c));
}
let c=sandbox({app:"1234",dad:"",admin:"0329"}); c.els["dad-pin-input"]={value:"0329",style:{}}; c.dadPinTry();
ok("Dad code turned OFF by the family → admin code still opens Dad", c.dadUnlocked);
c=sandbox({app:"1234",dad:"",admin:""}); c.els["dad-pin-input"]={value:"",style:{}}; c.els["dad-pin-err"]={textContent:""}; c.dadPinTry();
ok("Dad off + no admin → same 'no Dad code yet' message as before", /hasn't set a Dad code/.test(c.els["dad-pin-err"].textContent));
c=sandbox({app:"0329",dad:"0726",admin:"0329"}); c._v="0329"; c.checkMomPin("0329");
ok("Howe: Mom PIN == admin code is fine (both just open)", c.momPinUnlocked);
c=sandbox({app:1234,dad:"5678",admin:329}); ok("numbers stored as numbers still compare as text", c.pinOk("1234")&&!c.pinOk("0329"));
ok("short/blank input never opens", !sandbox(fam).pinOk("")&&!sandbox(fam).pinOk("   "));
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail?1:0);
