// test_helpers.js — 🙋 Helper profiles (slice 1). Extracts the HELPERS block + PAGE lines from index.html
// and runs them against a fake db. Usage: node test_helpers.js [index.html]
const fs=require("fs"), vm=require("vm");
const file=process.argv[2]||"index.html";
const src=fs.readFileSync(file,"utf8");
let pass=0, fail=0;
function ok(c,m){ if(c) pass++; else { fail++; console.log("FAIL:",m); } }

const a=src.indexOf("// ── HELPERS_START"), b=src.indexOf("// ── HELPERS_END");
ok(a>0&&b>a,"HELPERS block present");
const block=src.slice(a,b);
const pageLines=src.split("\n").filter(l=>/^const PAGE_KEYS=|^const PAGE_DEFAULT=/.test(l)).join("\n");
ok(/"helpers"/.test(pageLines),"helpers is a page key");
ok(src.includes('db.ref("config/helpers").on("value",s=>{ helpersOnValue(s.val()); });'),"listener wired");
ok(src.includes('if(pageOn("helpers")) h+=helpersCardHTML();'),"card wired under Babysitter");

function makeEnv(opts){
  const writes=[];
  const db={ ref(p){ return { set(v){ writes.push(["set",p,v]); }, remove(){ writes.push(["remove",p]); }, update(v){ writes.push(["update",p,v]); } }; } };
  const ctx={
    console, writes, renders:0,
    window:{HA_FAMILY:opts.family||null},
    document:{activeElement:null},
    db:opts.noDb?null:db,
    _dryRun:()=>!!opts.dry,
    momHere:()=>opts.mom!==false,
    rulesOpen:{},
    DAYS:["monday","tuesday","wednesday","thursday","friday","saturday"],
    DAY_LBL:{monday:"Monday",tuesday:"Tuesday",wednesday:"Wednesday",thursday:"Thursday",friday:"Friday",saturday:"Saturday"},
    ROSTER:["andrew","makenzie","taylor"],
    currData:{subjects:{andrew:{phonics:{name:"Phonics",mom:"required"},spelling:{name:"Spelling",mom:"required"},math:{name:"Math"}},makenzie:{spelling:{name:"Spelling"}},taylor:{}}},
    cap:s=>s[0].toUpperCase()+s.slice(1),
    esc:s=>String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),
    to12h:s=>{const p=s.split(":");let h=+p[0];const ap=h>=12?"PM":"AM";if(h===0)h=12;else if(h>12)h-=12;return h+":"+p[1]+" "+ap;},
    ampmTo24:s=>{const m=String(s).match(/(\d+):(\d+)\s*(AM|PM)/i);if(!m)return s;let h=+m[1];if(m[3].toUpperCase()==="PM"&&h!==12)h+=12;if(m[3].toUpperCase()==="AM"&&h===12)h=0;return String(h).padStart(2,"0")+":"+m[2];},
    prompt:()=>opts.promptAns===undefined?"Grandma":opts.promptAns,
    confirm:()=>opts.confirmAns!==false,
    Date
  };
  ctx.renderAll=()=>{ ctx.renders++; };
  vm.createContext(ctx);
  vm.runInContext(pageLines+"\n"+block+"\nthis.__get=()=>({helpersData,helpersOpen,PAGE_DEFAULT});",ctx);
  return ctx;
}

// Page defaults: OFF for Howe and for other families; other keys unchanged.
let e=makeEnv({}); let pd=e.__get().PAGE_DEFAULT;
ok(pd.helpers===false,"Howe: helpers off by default"); ok(pd.notebook===true,"Howe: notebook still on");
e=makeEnv({family:{familyId:"dewalt"}}); pd=e.__get().PAGE_DEFAULT;
ok(pd.helpers===false,"Dewalt: helpers off by default"); ok(pd["moms-plan"]===true&&pd.notebook===false,"Dewalt: other defaults unchanged");

// Add a helper → only leaf writes under its own id.
e=makeEnv({});
e.helpersAdd();
let st=e.__get(); const id=Object.keys(st.helpersData)[0];
ok(/^h[0-9a-z]+$/.test(id),"id shape "+id);
ok(st.helpersData[id].name==="Grandma"&&st.helpersData[id].pick===false&&st.helpersData[id].icon==="🙋","local profile");
ok(e.writes.length===4&&e.writes.every(w=>w[0]==="set"&&w[1].startsWith("config/helpers/"+id+"/")),"add = 4 leaf sets under own id");
ok(e.writes.every(w=>w[1]!=="config/helpers"&&w[1]!=="config"),"never whole-node write");

// Help toggles, pick, icon, name, days, times
e.writes.length=0;
e.helpersToggleHelp(id,"andrew","phonics");
e.helpersToggleHelp(id,"andrew","spelling");
e.helpersToggleHelp(id,"makenzie","spelling");
st=e.__get();
ok(st.helpersData[id].help.andrew.phonics===true&&st.helpersData[id].help.makenzie.spelling===true,"help stored");
ok(e.writes[0][1]==="config/helpers/"+id+"/help/andrew/phonics"&&e.writes[0][2]===true,"help leaf path");
e.helpersToggleHelp(id,"andrew","spelling");
ok(!st.helpersData[id].help.andrew.spelling,"help toggles off locally");
ok(e.writes[e.writes.length-1][0]==="remove"&&e.writes[e.writes.length-1][1]==="config/helpers/"+id+"/help/andrew/spelling","help off = remove leaf");
e.helpersTogglePick(id); ok(st.helpersData[id].pick===true,"pick on");
e.helpersTogglePick(id); ok(st.helpersData[id].pick===false,"pick off");
e.helpersSetIcon(id,"👵"); ok(st.helpersData[id].icon==="👵","icon set");
e.helpersSetIcon(id,"<b>"); ok(st.helpersData[id].icon==="👵","bad icon rejected");
e.helpersSetName(id,"  Grandma Dee  "); ok(st.helpersData[id].name==="Grandma Dee","name trimmed");
e.helpersSetName(id,"   "); ok(st.helpersData[id].name==="Grandma Dee","blank name ignored");
e.helpersToggleDay(id,"wednesday"); ok(st.helpersData[id].days.wednesday.start==="9:00 AM","day on w/ default");
e.helpersSetTime(id,"wednesday","start","09:30"); ok(st.helpersData[id].days.wednesday.start==="9:30 AM","start set");
e.helpersSetTime(id,"wednesday","end","12:00"); ok(st.helpersData[id].days.wednesday.end==="12:00 PM","end set");
e.helpersToggleDay(id,"sunday"); ok(!st.helpersData[id].days.sunday,"non-school day rejected");
ok(e.writes.every(w=>w[1].startsWith("config/helpers/"+id+"/")),"all writes under own id");

// Card renders
e.rulesOpen.helpers=true; ok(e.__get().helpersOpen[id]===true,"new helper opens"); e.helpersToggleOpen(id); ok(!e.__get().helpersOpen[id],"toggle closes"); ok(!e.helpersCardHTML().includes("Remove helper"),"closed hides body"); e.helpersToggleOpen(id);
let html=e.helpersCardHTML();
ok(html.includes("Grandma Dee")&&html.includes("👵"),"card shows name+icon");
ok(html.includes("2 subjects")&&html.includes("Wed 9:30 AM–12:00 PM"),"summary line");
ok(html.includes("Phonics")&&html.includes("Makenzie")&&!html.includes(">Taylor<"),"subjects listed, kid with none skipped");
ok(html.includes("+ Add helper")&&html.includes("Remove helper"),"buttons");
// XSS-ish name
e.helpersSetName(id,'<img src=x onerror=alert(1)>"');
html=e.helpersCardHTML(); ok(!html.includes("<img src=x"),"name escaped");

// Delete removes only own node
e.writes.length=0; e.helpersDelete(id);
ok(e.writes.length===1&&e.writes[0][0]==="remove"&&e.writes[0][1]==="config/helpers/"+id,"delete = remove own node");
ok(!e.__get().helpersData[id],"gone locally");

// Delete cancelled
e=makeEnv({confirmAns:false}); e.helpersAdd(); const id2=Object.keys(e.__get().helpersData)[0]; e.writes.length=0;
e.helpersDelete(id2); ok(e.writes.length===0&&e.__get().helpersData[id2],"cancelled delete writes nothing");

// Add cancelled
e=makeEnv({promptAns:null}); e.helpersAdd(); ok(e.writes.length===0&&!Object.keys(e.__get().helpersData).length,"cancelled add writes nothing");

// Not Mom → nothing
e=makeEnv({mom:false}); e.helpersAdd(); ok(e.writes.length===0,"not Mom: add blocked");
e.__get().helpersData.hx={name:"X"}; e.helpersToggleHelp("hx","andrew","math"); e.helpersDelete("hx");
ok(e.writes.length===0,"not Mom: toggles/delete blocked");

// Dry-run → UI works, no db writes
e=makeEnv({dry:true}); e.helpersAdd(); const id3=Object.keys(e.__get().helpersData)[0];
e.helpersToggleHelp(id3,"andrew","phonics");
ok(e.writes.length===0&&e.__get().helpersData[id3].help.andrew.phonics,"dry-run: local only");

// Bad id rejected
e=makeEnv({}); e.helpersToggleHelp("../rules","andrew","x"); ok(e.writes.length===0,"bad id rejected");

// Listener replaces data; empty → {}
e=makeEnv({}); e.helpersOnValue({ha:{name:"Dad",createdAt:1}}); ok(e.__get().helpersData.ha.name==="Dad"&&e.renders===1,"listener loads + renders");
e.document.activeElement={tagName:"INPUT"}; e.helpersOnValue(null); ok(Object.keys(e.__get().helpersData).length===0&&e.renders===1,"null → {}, no render while typing");

console.log(pass+" passed, "+fail+" failed");
process.exit(fail?1:0);
