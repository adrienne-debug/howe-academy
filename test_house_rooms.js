/*
 * 🚪 HH_ROOMDATA + 🗺 HH_ROOMPAGE — Household by room, step 1 (DESIGN_household_rooms_2026-11-15 §9): rooms as data with the code
 * list as the fallback, 🚪 Edit rooms (Mom only, the first edit seeds the list in one update with today's ids, then one path per
 * edit, never a chore), and the read-only Rooms page (lanes, past days from loaded history, today from the lists, Whole house).
 * Made-up family, rooms and chores only.
 *   run: node test_house_rooms.js
 *   BASE_HTML=/path/to/main/index.html node test_house_rooms.js  → the "nothing stored" checks compare against that file instead
 *   of this file with the step undone by hand.
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const fnOf=s=>name=>{ const i=s.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=s.indexOf("{",i);k<s.length;k++){ if(s[k]==="{") d++; else if(s[k]==="}"&&--d===0) return s.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cutOf=s=>(a,b)=>{ const i=s.indexOf(a), j=s.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a+" / "+b); return s.slice(i,j); };
const fn=fnOf(src), cut=cutOf(src);
const BLOCK=cut("// HOUSEHOLD_START","// HH_ROOMPAGE_END");
// The code before this step: the given base file, else this file with the two new blocks taken out and every reader put back on HH_ROOMS.
let OLD;
if(process.env.BASE_HTML){ const b=fs.readFileSync(process.env.BASE_HTML,"utf8"); OLD=cutOf(b)("// HOUSEHOLD_START","// HH_EDITOR_END"); console.log("(base: "+process.env.BASE_HTML+")"); }
else { OLD=cut("// HOUSEHOLD_START","// HH_EDITOR_END"); const a=OLD.indexOf("// HH_ROOMDATA_START"), z=OLD.indexOf("// HH_ROOMDATA_END\n");
  OLD=OLD.slice(0,a)+OLD.slice(z+"// HH_ROOMDATA_END\n".length);
  OLD=OLD.replace('function hhRoomOf(j){ const R=(typeof hhRoomList==="function")?hhRoomList():HH_ROOMS; return (j&&j.room&&R.some(','function hhRoomOf(j){ return (j&&j.room&&HH_ROOMS.some(').replace(/   \/\/ HH_ROOMDATA: the family's rooms/,"").split("hhRoomList().").join("HH_ROOMS."); }
const CAD=cut("const _CAD_DOW=","function cadLabel(")+fn("cadLabel");
const ROT="let rotationPeriod={};\n"+fn("_rotKey")+"\n"+fn("rtRotPeriod")+"\n"+fn("_rtRotHop");
const isoD=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const DN=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
const dayNum=s=>{ const p=s.split("-").map(Number); return Math.round(Date.UTC(p[0],p[1]-1,p[2])/864e5); };
const isoOf=n=>new Date(n*864e5).toISOString().slice(0,10);
const dow=s=>(new Date(s+"T12:00:00Z").getUTCDay()+6)%7;   // Mon=0
const TODAY=isoD(new Date()), T=dayNum(TODAY), MON=T-dow(TODAY);
const atOf=s=>new Date(s+"T12:00:00").getTime();
const CODE_IDS=["living","entry","bathdown","kitchen","school","boys","lj","playroom","ours","bathup","stairs","any"];

// ── the made-up family: kids Ava, Ben, Cal; a table of chores of every timing shape ──
const JOBS=()=>({
  w_daily:{label:"Wipe the counters",emoji:"🧽",who:"ava",slot:"chores",cad:"daily",area:"cleaning",room:"kitchen",minutes:5,src:{kind:"new"},status:"active",order:0},
  w_days:{label:"Mop the floor",who:"ben",slot:"chores",cad:"wk:1,4",area:"cleaning",room:"kitchen",minutes:15,src:{kind:"new"},status:"active",order:1},
  w_cyc:{label:"Clean the oven racks",who:"mom",slot:"",cad:"wk:2",cycW:2,cycN:4,cycStart:isoOf(MON-28),area:"cleaning",room:"kitchen",minutes:20,src:{kind:"momChore",id:"oven"},status:"active",order:2},
  w_10d:{label:"Descale the kettle",who:"cal",slot:"chores",cad:"10d",area:"cleaning",room:"kitchen",src:{kind:"new"},status:"active",order:3},
  w_2w:{label:"Wash the bins",who:"ben",slot:"chores",cad:"2w",area:"cleaning",room:"kitchen",src:{kind:"new"},status:"active",order:4},
  w_42d:{label:"Wipe the cupboard doors",who:"ava",slot:"chores",cad:"42d",area:"cleaning",room:"kitchen",src:{kind:"new"},status:"active",order:5},
  w_90d:{label:"Pull out the fridge",who:"dad",slot:"",cad:"90d",area:"cleaning",room:"kitchen",src:{kind:"dadChore",id:"fridge"},status:"active",order:6},
  w_3d:{label:"Shake the mats",who:"cal",slot:"chores",cad:"3d",area:"cleaning",room:"kitchen",src:{kind:"new"},status:"active",order:7},
  w_sat:{label:"Sort the junk drawer",who:"ben",slot:"chores",cad:"sat",area:"cleaning",room:"kitchen",src:{kind:"new"},status:"active",order:8},
  w_all7:{label:"Run the dishwasher",who:"ava",slot:"chores",cad:"wk:0,1,2,3,4,5,6",area:"cleaning",room:"kitchen",src:{kind:"new"},status:"active",order:9},
  w_once:{label:"Fix the shelf",who:"mom",slot:"",cad:"once",hold:true,area:"cleaning",room:"kitchen",src:{kind:"momChore",id:"shelf"},status:"active",order:10},
  w_need:{label:"Clean up spills",who:"cal",slot:"chores",cad:"asneeded",area:"cleaning",room:"kitchen",src:{kind:"new"},status:"active",order:11},
  w_proj:{label:"Paint the pantry",who:"mom",slot:"",cad:"asneeded",layer:"project",area:"cleaning",room:"kitchen",src:{kind:"momChore",id:"paint"},status:"active",order:12},
  w_lvl3:{label:"Scrub the grout",who:"ava",slot:"chores",cad:"daily",level:3,area:"cleaning",room:"kitchen",src:{kind:"new"},status:"active",order:13},
  w_old:{label:"Old job",who:"ava",slot:"chores",cad:"daily",area:"cleaning",room:"kitchen",src:{kind:"new"},status:"retired",order:14},
  r_ava:{label:"Pickup the den",who:"ava",slot:"afternoon",cad:"daily",rot:"pick",area:"pickup",room:"living",src:{kind:"routine",slot:"afternoon",kid:"ava",i:0},status:"active",order:0},
  r_ben:{label:"Pickup the porch",who:"ben",slot:"afternoon",cad:"daily",rot:"pick",area:"pickup",room:"entry",src:{kind:"routine",slot:"afternoon",kid:"ben",i:0},status:"active",order:0},
  g_hall:{label:"Sweep the hallway",who:"cal",slot:"chores",cad:"wk:5",area:"cleaning",src:{kind:"new"},status:"active",order:2},          // no stored room → the guess (entry)
  g_teeth:{label:"Brush teeth",who:"ava",slot:"morning",cad:"daily",area:"health",src:{kind:"new"},status:"active",order:0},           // health → "any"
  o_lost:{label:"Dust the attic",who:"ben",slot:"chores",cad:"wk:3",area:"cleaning",room:"attic_gone",src:{kind:"new"},status:"active",order:3},   // a stored room that is not a room
  b_tub:{label:"Scrub the tub",who:"cal",slot:"chores",cad:"wk:6",area:"cleaning",room:"bathup",src:{kind:"new"},status:"active",order:4}
});
// History: Ava wiped the counters every day but 2 and 3 days ago; the den/porch pickups were done by whoever had the den that day;
// Mom did the oven racks 9 days ago; a cleaning day 5 days ago: Cal had the mop and did it.
const CLEAN=isoOf(T-5);
function LOG(){ const L={ava:{},ben:{},cal:{}}; const put=(kid,s,id,e)=>{ const sun=dayNum(s)-new Date(s+"T12:00:00Z").getUTCDay(), w="w"+sun, d=DN[new Date(s+"T12:00:00Z").getUTCDay()]; L[kid][w]=L[kid][w]||{}; L[kid][w][d]=L[kid][w][d]||{}; L[kid][w][d][id]=Object.assign({ts:"",at:atOf(s),act:"on"},e); };
  for(let n=T-20;n<T;n++){ const s=isoOf(n); if(n!==T-2&&n!==T-3) put("ava",s,"a"+n,{label:"Wipe the counters",slot:"chores"}); }
  return {L:L,put:put}; }
function mk(o){
  o=o||{}; const writes=[], ls={}, toasts=[];
  const lg=LOG(); if(o.doneToday) lg.put("ava",TODAY,"t",{label:"Wipe the counters",slot:"chores"});
  const ctx={console,Object,Array,String,Number,parseInt,isNaN,Math,JSON,Date,RegExp,Error,Set,Infinity,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:o.nodb?null:{ref:p=>({set:v=>writes.push(["set",p===undefined?"":p,v===null?null:JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p===undefined?"":p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["rm",p])})},
    _dryRun:o.dry?()=>true:()=>false, isMom:!o.noMom, momHere:()=>ctx.isMom, confirm:()=>true, rulesData:{}, calendarData:{holidays:{},vacations:{}},
    ROSTER:["ava","ben","cal"], SL_KIDS:["ava","ben","cal"], SL_SLOTS:["morning","afternoon","chores","evening"], SL_SLBL:{morning:"Morning",afternoon:"Afternoon",chores:"Chores",evening:"Evening"},
    KID_NAME:{ava:"Ava",ben:"Ben",cal:"Cal"}, KID_COLOR:{ava:"#aa1111",ben:"#11aa11",cal:"#1111aa"}, MC_DEFAULT:{}, HA_IS_HOWE:false,
    routineCfg2:{afternoon:{ava:[{label:"Pickup the den",rot:"pick",cad:"daily"}],ben:[{label:"Pickup the porch",rot:"pick",cad:"daily"}]}}, morningRoutineCfg:{}, RT_DEFAULT:{afternoon:{},chores:{},evening:{}}, _mrLegacySteps:()=>[],
    rtApplyRot:(s,k,st)=>st, stepWindowOk:()=>true, rtDoneOn:()=>false, mStepDoneOn:()=>false, mcDoneOn:()=>false, dcDoneOn:()=>false, gbList:()=>[],
    routineLog:lg.L, momdayData:{[isoOf(T-9)]:{chores:{oven:{at:1}}}}, daddayData:{}, momChoresData:{}, dadChoresData:{}, activeWk:()=>"week9", _todayDay:DN[new Date().getDay()], _todayStr:()=>TODAY,
    cap:s=>s.charAt(0).toUpperCase()+s.slice(1), esc:s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"), mwBanner:s=>"", mpSubnav:v=>"", mwToast:t=>toasts.push(t), renderAll:()=>{}, renderMomsPlan:()=>{},
    document:{getElementById:()=>null}, writes, toasts};
  vm.createContext(ctx);
  vm.runInContext(fn("toMin")+"\n"+fn("to12h")+"\n"+fn("ampmTo24")+"\n"+CAD+"\n"+ROT+"\n"+fn("stepCycleOk")+"\n"+fn("rtStepsFor")+"\n"+fn("mcAll")+"\n"+fn("dcAll")+"\n"+(o.old?OLD:BLOCK), ctx);
  ctx.get=e=>vm.runInContext(e,ctx);
  const hd={jobs:JOBS(),cleanday:{[CLEAN]:{sent:1,plan:{w_days:{who:"cal",order:0,mins:15}},done:{w_days:{who:"cal",ts:atOf(CLEAN),min:15,pts:0}}}}};
  if(o.rooms) Object.assign(hd,JSON.parse(JSON.stringify(o.rooms)));
  ctx.householdOnValue(hd); ctx.writes.length=0; return ctx;
}
const keys=w=>Object.keys(w[2]).sort();
const oneUpd=(c,p)=>c.writes.length===1&&c.writes[0][0]==="update"&&c.writes[0][1]===""&&Object.keys(c.writes[0][2]).length===1&&Object.keys(c.writes[0][2])[0]===p;

console.log("1. Nothing stored: the room list, hhRoomOf and the old views come out exactly as before");
{ const c=mk(), b=mk({old:true});
  ok("hhRoomList() is the code list itself (same array)", c.get("hhRoomList()===HH_ROOMS")&&JSON.stringify(c.get("hhRoomList()"))===JSON.stringify(b.get("HH_ROOMS")));
  ok("the code list still has today's 12 ids in today's order", JSON.stringify(c.get("HH_ROOMS.map(function(r){ return r[0]; })"))===JSON.stringify(CODE_IDS));
  const ids=Object.keys(JOBS()), ro=x=>ids.map(id=>x.hhRoomOf(x.hhJobs()[id])).join(",");
  ok("hhRoomOf: the same room for every chore (stored, guessed, health, a stored room that is not a room)", ro(c)===ro(b), [ro(c),ro(b)]);
  ok("…the guess is still there (no stored room → entry; health → any; unknown stored room → guess)", c.hhRoomOf(c.hhJobs().g_hall)==="entry"&&c.hhRoomOf(c.hhJobs().g_teeth)==="any"&&c.hhRoomOf(c.hhJobs().o_lost)===c.hhGuessRoom(c.hhJobs().o_lost));
  ok("hhRoomName for every id + an unknown one", CODE_IDS.concat(["zz"]).every(id=>c.hhRoomName(id)===b.hhRoomName(id)));
  const same=(name,expr,prep)=>{ [c,b].forEach(x=>{ if(prep) x.get(prep); }); const A=c.get(expr), B=b.get(expr); ok(name+" HTML identical ("+A.length+" chars)", A===B&&A.length>0, A===B?"":[A.slice(0,200),B.slice(0,200)]); };
  const openAll='Object.keys(hhJobs()).forEach(function(id){ const j=hhJobs()[id]; ["room|"+hhRoomOf(j),"area|"+(j.area||"cleaning")].forEach(function(k){ hhOpenPerson[k+"|"+j.who]=true; const sl=hhSlotsFor(j.who); hhOpenPerson[k+"|"+j.who+"|"+(sl.indexOf(j.slot||"")>=0?(j.slot||""):sl[0])]=true; }); });';
  same("🗂 Area view (kitchen open)","hhAreaHTML()",openAll+'hhOpenArea="cleaning";');
  CODE_IDS.forEach(r=>same("🚪 Room view, "+r+" open","hhRoomHTML()",openAll+'hhOpenRoom="'+r+'";'));
  same("🚪 Room view with ⏳ sort","hhRoomHTML()",'hhSortNeed=true;hhOpenRoom="kitchen";');
  same("☑️ Once pile","hhOnceHTML()",'hhSortNeed=false;');
  same("＋ Add a chore form (Room picker)","hhAddHTML()",'hhAddOpen=true;');
  same("row Room picker","hhPickHTML(\"w_days\",\"room\")",'hhPick="w_days|room";');
  same("✎ Edit Room chips","hhEditHTML(\"o_lost\")",'hhEditId="o_lost";');
  same("cleaning panel rows by room (Mom)","JSON.stringify(hhCleanRows(\"ava\",\""+TODAY+"\",_todayDay).map(function(r){ return r.id; }))","");
  ok("＋ Add saves room \"any\" when none is picked, same floor as before", (()=>{ c.get('hhAdd.room="nowhere";hhAdd.label="Wash the van";'); b.get('hhAdd.room="nowhere";hhAdd.label="Wash the van";'); const a=c.hhAddSave(), z=b.hhAddSave(); const A=c.hhJobs()[a], B=b.hhJobs()[z]; return A.room==="any"&&B.room==="any"&&A.floor===B.floor; })());
  ok("the one new chip is the only change to the chip row", (()=>{ const el1={}, el2={}; c.renderHousehold(el1); b.renderHousehold(el2); return el1.innerHTML.replace(/<button onclick="hhGo\('rooms'\)"[^>]*>🗺 Rooms<\/button>/,"")===el2.innerHTML&&/hhGo\('rooms'\)/.test(el1.innerHTML); })());
  ok("nothing was written by any of that but the two adds", c.writes.filter(w=>!/^household\/jobs\/hh/.test(w[1])).length===0&&b.writes.filter(w=>!/^household\/jobs\/hh/.test(w[1])).length===0, c.writes); }

console.log("2. The first edit seeds the list in ONE multi-path update with today's ids");
{ const c=mk(); const ro0=Object.keys(JOBS()).map(id=>c.hhRoomOf(c.hhJobs()[id])).join(",");
  const u=c.hhRoomSet("kitchen","name","Cook room"); const w=c.writes;
  ok("one update", w.length===1&&w[0][0]==="update"&&w[0][1]==="", w.length);
  const exp=CODE_IDS.map(id=>"household/rooms/"+id).concat(["household/floors/down","household/floors/up"]).sort();
  ok("exactly 12 rooms + 2 groups, today's ids, nothing else", JSON.stringify(keys(w[0]))===JSON.stringify(exp), keys(w[0]));
  const v=w[0][2];
  ok("each room = {name, emoji, floor, order}, today's names and order; the rename is in it", CODE_IDS.every((id,i)=>v["household/rooms/"+id].order===i&&typeof v["household/rooms/"+id].emoji==="string"&&v["household/rooms/"+id].emoji&&Object.keys(v["household/rooms/"+id]).sort().join()==="emoji,floor,name,order")&&v["household/rooms/kitchen"].name==="Cook room"&&v["household/rooms/living"].name===c.get("HH_ROOMS[0][1]"), v["household/rooms/kitchen"]);
  ok("groups: Downstairs 0, Upstairs 1; rooms keep down/up; Not a room has no group", v["household/floors/down"].name==="Downstairs"&&v["household/floors/up"].order===1&&v["household/rooms/kitchen"].floor==="down"&&v["household/rooms/stairs"].floor==="up"&&v["household/rooms/any"].floor==="");
  ok("no path under household/jobs, no whole-node write", keys(w[0]).every(k=>/^household\/(rooms|floors)\/[^/]+$/.test(k)));
  ok("the list now comes from the data, same ids in the same order", JSON.stringify(c.get("hhRoomList().map(function(r){ return r[0]; })"))===JSON.stringify(CODE_IDS)&&c.hhRoomName("kitchen")==="Cook room");
  ok("every chore is in the same room as before", Object.keys(JOBS()).map(id=>c.hhRoomOf(c.hhJobs()[id])).join(",")===ro0);
  ok("the return value is the update", JSON.stringify(u)===JSON.stringify(v)); }

console.log("3. Every later edit is one targeted path");
{ const c=mk(); c.hhRoomSet("kitchen","name","Cook room"); c.writes.length=0;
  c.hhRoomSet("kitchen","name","Kitchen"); ok("rename → rooms/kitchen/name", oneUpd(c,"household/rooms/kitchen/name")&&c.writes[0][2]["household/rooms/kitchen/name"]==="Kitchen");
  c.writes.length=0; c.hhRoomSet("kitchen","emoji","🥄"); ok("emoji → rooms/kitchen/emoji", oneUpd(c,"household/rooms/kitchen/emoji")&&c.hhRoomEmoji("kitchen")==="🥄");
  c.writes.length=0; c.hhRoomSet("kitchen","floor","up"); ok("move to Upstairs → rooms/kitchen/floor", oneUpd(c,"household/rooms/kitchen/floor")&&c.get('hhRoomList().find(function(r){ return r[0]==="kitchen"; })[2]')==="up");
  c.writes.length=0; ok("a group that does not exist is refused", c.hhRoomSet("kitchen","floor","moon")===null&&c.writes.length===0);
  c.hhRoomSet("kitchen","floor","down"); c.writes.length=0;
  c.hhRoomStep("kitchen",-1); const L=c.get("hhRoomList().map(function(r){ return r[0]; })");
  ok("▲ → rooms/kitchen/order only, and it moves one up", oneUpd(c,"household/rooms/kitchen/order")&&L.indexOf("kitchen")===L.indexOf("bathdown")-1, L);
  c.writes.length=0; c.hhRoomStep("kitchen",1); const L2=c.get("hhRoomList().map(function(r){ return r[0]; })"); ok("▼ moves it back", oneUpd(c,"household/rooms/kitchen/order")&&L2.indexOf("kitchen")===L2.indexOf("bathdown")+1, L2);
  c.writes.length=0; ok("▲ on the first room does nothing", c.hhRoomStep("living",-1)===null&&c.writes.length===0);
  c.writes.length=0; c.hhRoomAdd("Garage bay","up"); const ak=Object.keys(c.writes[0][2])[0], av=c.writes[0][2][ak];
  ok("+ Add room → one path rooms/<new id> = {name, emoji, floor, order}", c.writes.length===1&&/^household\/rooms\/rm[a-z0-9]+$/.test(ak)&&av.name==="Garage bay"&&av.floor==="up"&&av.order>10&&av.emoji, av);
  c.writes.length=0; ok("+ Add room with no name is refused", c.hhRoomAdd("  ","up")===null&&c.writes.length===0);
  c.writes.length=0; c.hhGroupAdd("Outside"); const gk=Object.keys(c.writes[0][2])[0];
  ok("+ Add group → one path floors/<new id> = {name, order}", c.writes.length===1&&/^household\/floors\/fl[a-z0-9]+$/.test(gk)&&c.writes[0][2][gk].name==="Outside"&&c.writes[0][2][gk].order===2);
  const gid=gk.split("/")[2];
  c.writes.length=0; c.hhGroupSet(gid,"name","Yard"); ok("rename group → floors/<id>/name", oneUpd(c,"household/floors/"+gid+"/name"));
  c.writes.length=0; c.hhGroupStep(gid,-1); ok("▲ group → floors/<id>/order, now between Downstairs and Upstairs", oneUpd(c,"household/floors/"+gid+"/order")&&c.get("hhRoomGroups().map(function(g){ return g[0]; })").join()==="down,"+gid+",up");
  c.writes.length=0; c.hhRoomSet("school","floor",gid); c.writes.length=0;
  c.hhGroupRemove(gid); ok("remove group → floors/<id> = null; its rooms are not written", oneUpd(c,"household/floors/"+gid)&&c.writes[0][2]["household/floors/"+gid]===null&&c.get('hhRoomList().find(function(r){ return r[0]==="school"; })[2]')===gid);
  ok("…and that room now sits with No group, after every grouped room", (()=>{ const L=c.get("hhRoomList()"), G=c.get("hhRoomGroups().map(function(g){ return g[0]; })"), i=L.findIndex(r=>r[0]==="school"); return G.indexOf(L[i][2])<0&&L.slice(0,i).every(r=>G.indexOf(r[2])>=0||r[0]==="any")&&L.slice(i).every(r=>G.indexOf(r[2])<0); })());
  c.writes.length=0; c.hhRoomRemove("kitchen");
  ok("remove room → rooms/kitchen = null, nothing under household/jobs", oneUpd(c,"household/rooms/kitchen")&&c.writes[0][2]["household/rooms/kitchen"]===null&&c.writes.every(w=>Object.keys(w[2]).every(k=>!/household\/jobs/.test(k))));
  ok("the chores filed there keep room \"kitchen\" (untouched)", c.hhJobs().w_daily.room==="kitchen");
  ok("on the Rooms page they show under No room", c.get("hhRoomChores().__none").indexOf("w_daily")>=0&&c.hhRoomOn(c.hhJobs().w_daily)==="");
  ok("a group named in a chore's room-of guess that was removed is No room too", (()=>{ c.hhRoomRemove("entry"); return c.hhRoomOn(c.hhJobs().g_hall)===""; })()); }

console.log("4. Mom only, inert under dry run, never the whole node");
{ const d=mk({dry:true}); d.hhRoomSet("kitchen","name","Cook room"); d.hhRoomAdd("Shed",""); d.hhGroupAdd("Outside"); d.hhRoomRemove("living");
  ok("?dryrun=1: nothing written by seed, add, group or remove", d.writes.length===0);
  const n=mk({noMom:true}); const r=[n.hhRoomSet("kitchen","name","Cook room"),n.hhRoomAdd("Shed","down"),n.hhGroupAdd("Outside"),n.hhRoomRemove("living"),n.hhRoomStep("kitchen",1),n.hhGroupSet("down","name","Lower")];
  ok("not Mom: every edit returns null, nothing written, nothing stored", r.every(x=>x===null)&&n.writes.length===0&&!n.get("hhRoomsStored()"));
  ok("not Mom: no 🚪 Edit rooms button and no tap-to-edit on the page", (()=>{ n.get('hhView="rooms"; hhRmSel="kitchen"; hhRmLane["kitchen|daily"]=true;'); const el={}; n.renderHousehold(el); return !/Edit rooms/.test(el.innerHTML)&&!/hhEditToggle\(/.test(el.innerHTML)&&/Wipe the counters/.test(el.innerHTML); })());
  const z=mk(); const bad=[z.hhRoomEdit("jobs/w_daily/room","x"),z.hhRoomEdit("",1),z.hhRoomEdit("rooms",{}),z.hhRoomEdit("rooms/a/b/c",1)];
  ok("hhRoomEdit refuses any path outside rooms/<id> and floors/<id>", bad.every(x=>x===null)&&z.writes.length===0);
  const s=src.slice(src.indexOf("// HH_ROOMDATA_START"),src.indexOf("// HH_ROOMDATA_END"))+src.slice(src.indexOf("// HH_ROOMPAGE_START"),src.indexOf("// HH_ROOMPAGE_END"));
  ok("the new code writes only through db.ref().update behind _hhWrite(), never .set / .remove / a listener", (s.match(/db\.ref\(/g)||[]).length===1&&/if\(_hhWrite\(\)\) db\.ref\(\)\.update\(upd\)/.test(s)&&!/\.on\(|\.once\(|\.set\(|\.remove\(/.test(s));
  ok("keeping at least one room", (()=>{ const k=mk({rooms:{rooms:{solo:{name:"Solo",floor:"",order:0}},floors:{}}}); return k.hhRoomRemove("solo")===null&&k.writes.length===0&&/at least one room/.test(k.toasts[0]); })()); }

console.log("5. Moving a chore to a room: the existing ✎ Edit Room picker, family rooms, the existing setter");
{ const c=mk({rooms:{rooms:{den:{name:"Den",emoji:"📺",floor:"g1",order:0},shed:{name:"Shed",emoji:"🛠",floor:"",order:0}},floors:{g1:{name:"Main floor",order:0}}}});
  c.get('hhEditId="w_daily";'); const h=c.hhEditHTML("w_daily");
  ok("the picker lists the family's rooms (Den, Shed), not the code list", /hhEditSet\('w_daily','room','den'\)/.test(h)&&/hhEditSet\('w_daily','room','shed'\)/.test(h)&&!/'room','kitchen'/.test(h));
  c.hhEditSet("w_daily","room","shed"); ok("a pick writes household/jobs/<id>/room only", c.writes.length===1&&c.writes[0][0]==="set"&&c.writes[0][1]==="household/jobs/w_daily/room"&&c.writes[0][2]==="shed"&&c.hhRoomOn(c.hhJobs().w_daily)==="shed", c.writes); }

console.log("6. Lanes from each chore's own timing");
{ const c=mk(), J=c.hhJobs(), L=id=>c.hhLaneOf(J[id]);
  [["w_daily","daily"],["w_all7","daily"],["w_days","weekly"],["w_sat","weekly"],["w_3d","weekly"],["w_cyc","few"],["w_10d","few"],["w_2w","few"],["w_42d","few"],["w_90d","season"],["w_need","season"],["w_once","once"],["w_proj","once"],["r_ava","daily"]]
    .forEach(p=>ok(J[p[0]].cad+(J[p[0]].cycW?" (4-week cycle)":"")+(J[p[0]].layer?" (project)":"")+" → "+p[1], L(p[0])===p[1], L(p[0])));
  ok("a moved weekday (planCad) is still Weekly", c.hhLaneOf(Object.assign({},J.w_daily,{planCad:"wk:3"}))==="weekly");
  ok("times a week: daily 7 · Mon+Thu 2 · Sat 1 · 2w ½ · cycle week 1 in 4 = ¼ · once/as needed 0", c.hhTimesAWeek(J.w_daily)===7&&c.hhTimesAWeek(J.w_days)===2&&c.hhTimesAWeek(J.w_sat)===1&&c.hhTimesAWeek(J.w_2w)===.5&&c.hhTimesAWeek(J.w_cyc)===.25&&c.hhTimesAWeek(J.w_once)===0&&c.hhTimesAWeek(J.w_need)===0); }

console.log("7. The grid: past squares from the history already loaded, today from the lists now");
{ const c=mk(), S=c.hhLogState(), rc={}, cell=(id,n)=>c.hhRmCell(id,isoOf(n),TODAY,S,rc);
  ok("yesterday: Ava did the counters → Ava ✓", JSON.stringify(cell("w_daily",T-1))===JSON.stringify({who:"ava",done:true}));
  ok("2 days ago: hers and not checked → Ava, pale", JSON.stringify(cell("w_daily",T-2))===JSON.stringify({who:"ava",done:false}));
  ok("today, not yet checked → Ava has it", JSON.stringify(cell("w_daily",T))===JSON.stringify({who:"ava",done:false}));
  ok("today, checked → Ava ✓", (()=>{ const d=mk({doneToday:true}); return JSON.stringify(d.hhRmCell("w_daily",TODAY,TODAY,d.hhLogState(),{}))===JSON.stringify({who:"ava",done:true}); })());
  const notMop=[1,2,3,4,5,6,7].map(k=>T-k).find(n=>dow(isoOf(n))!==0&&dow(isoOf(n))!==3&&n!==T-5);
  ok("a day the mop is not due and not done → empty", cell("w_days",notMop)===null);
  ok("the cleaning day: Cal had the mop and did it → Cal ✓ (not Ben)", JSON.stringify(cell("w_days",T-5))===JSON.stringify({who:"cal",done:true}));
  ok("Mom's oven racks 9 days ago → Mom ✓ (from her day stamps)", JSON.stringify(cell("w_cyc",T-9))===JSON.stringify({who:"mom",done:true}));
  const hop=n=>c._rtRotHop("pick",n), denKid=n=>["ava","ben"][(((0-hop(n))%2)+2)%2];
  ok("a rotation row: the den is whoever had the den that day (today)", cell("r_ava",T).who===denKid(T)&&cell("r_ben",T).who===["ava","ben"][(((1-hop(T))%2)+2)%2]&&cell("r_ava",T).who!==cell("r_ben",T).who);
  ok("…and done when THAT kid checked the den (a log line under them)", (()=>{ const k=denKid(T-1), d=mk(); const L=d.get("routineLog"), sun=dayNum(isoOf(T-1))-new Date(isoOf(T-1)+"T12:00:00Z").getUTCDay(), dk=DN[new Date(isoOf(T-1)+"T12:00:00Z").getUTCDay()]; L[k]=L[k]||{}; L[k]["w"+sun]=L[k]["w"+sun]||{}; L[k]["w"+sun][dk]=Object.assign(L[k]["w"+sun][dk]||{},{z:{label:"Pickup the den",slot:"afternoon",act:"on",ts:"",at:atOf(isoOf(T-1))}}); d.get("_hhLogCache=null"); const r=d.hhRmCell("r_ava",isoOf(T-1),TODAY,d.hhLogState(),{}); return r.who===k&&r.done; })());
  ok("past days: an every-N chore not done → empty (its old due dates are not trusted, DESIGN §2.3 #1)", [1,2,3,4,5,6,7,8].every(k=>cell("w_3d",T-k)===null&&cell("w_2w",T-k)===null&&cell("w_10d",T-k)===null));
  ok("…but done shows ✓ (Ben washed the bins 6 days ago)", (()=>{ const d=mk(), L=d.get("routineLog"), s6=isoOf(T-6), sun=dayNum(s6)-new Date(s6+"T12:00:00Z").getUTCDay(), dk=DN[new Date(s6+"T12:00:00Z").getUTCDay()]; L.ben["w"+sun]={[dk]:{q:{label:"Wash the bins",slot:"chores",act:"on",ts:"",at:atOf(s6)}}}; d.get("_hhLogCache=null"); return JSON.stringify(d.hhRmCell("w_2w",s6,TODAY,d.hhLogState(),{}))===JSON.stringify({who:"ben",done:true}); })());
  ok("4-week cycle: Wednesday of an off week → empty; of its week → Mom, pale", (MON-5===T-9||cell("w_cyc",MON-5)===null)&&JSON.stringify(cell("w_cyc",MON-19))===JSON.stringify({who:"mom",done:false}));
  ok("past days: a chore above the level (not on any list) → empty", [1,2,3].every(k=>cell("w_lvl3",T-k)===null));
  ok("today: a held one-time job → nothing (it is in the pile)", cell("w_once",T)===null);
  ok("today: above the level → nothing (not on the list)", cell("w_lvl3",T)===null);
  ok("today: as needed → nothing", cell("w_need",T)===null);
  const el={}; c.get('hhView="rooms"; hhRmSel="kitchen";'); c.renderHousehold(el); const H=el.innerHTML;
  ok("room header: 14 chores · minutes a week · on time %", /🍳 [^<]*<\/span><span[^>]*>14 chores · \d+ min a week · on time (\d+%|–)/.test(H), H.slice(H.indexOf("chores ·")-80,H.indexOf("chores ·")+60));
  ok("lanes folded by default, in order, with counts", /Daily · 3 ▸.*Weekly · 3 ▸.*Every few weeks · 4 ▸.*Seasonal · 2 ▸.*One-time · 2 ▸/.test(H));
  ok("15 date rows (14 past days + today), today last and marked; no future rows", (H.match(/<tr style="/g)||[]).length===15&&H.lastIndexOf("background:#e6f4f3")>H.lastIndexOf("<tr style=\"\">"));
  ok("folded Daily lane squares show the person (Av ✓) in Ava's colour", /color:#aa1111">Av ✓/.test(H));
  ok("no late badge, no future, no long lines", !/days late|late<\/span>|▏/.test(H.slice(H.indexOf("<table"))));
  c.hhRmLaneToggle("kitchen|daily"); c.renderHousehold(el); const H2=el.innerHTML;
  ok("an unfolded lane = one column per chore, titles open ✎ Edit", /colspan="3"/.test(H2)&&/hhEditToggle\('w_daily'\)"[^>]*title="Wipe the counters">🧽 Wipe the counters/.test(H2));
  ok("its squares open ✎ Edit and show the full name", /<td onclick="hhEditToggle\('w_daily'\)"[^>]*><span[^>]*color:#aa1111">Ava ✓<\/span>/.test(H2));
  c.hhEditToggle("w_daily"); c.renderHousehold(el); ok("tapping opens the EXISTING editor under the grid", el.innerHTML.indexOf(c.hhEditHTML("w_daily"))>0&&c.hhEditHTML("w_daily").length>100);
  c.hhRmLongToggle(); c.renderHousehold(el); ok("Show 8 weeks = 56 past days + today", (el.innerHTML.match(/<tr style="/g)||[]).length===57);
  ok("nothing was written by drawing", c.writes.length===0); }

console.log("8. 🏠 Whole house");
{ const c=mk(), by=c.hhRoomChores(), ord=c.hhHouseOrder(by).map(x=>x.id);
  ok("every room is a row, plus No room when a chore has none", ord.length===13&&ord.indexOf("__none")>=0&&CODE_IDS.every(id=>ord.indexOf(id)>=0));
  const st=id=>c.hhRoomStats(by[id]||[]);
  const P=x=>x.pct===null?101:x.pct, LI=id=>CODE_IDS.concat(["__none"]).indexOf(id);
  const before=(a,b)=>{ const A=st(a), B=st(b); if(A.late!==B.late) return A.late>B.late; if(P(A)!==P(B)) return P(A)<P(B); return LI(a)<LI(b); };
  ok("most late first, then lowest on time, then the list's order", ord.every((id,i)=>!i||before(ord[i-1],id)), ord.map(id=>id+":"+st(id).late+"/"+st(id).pct));
  ok("the kitchen has late chores and comes before an empty room", st("kitchen").late>0&&ord.indexOf("kitchen")<ord.indexOf("playroom"));
  ok("empty rooms come last, in list order", ord.slice(-7).join()==="bathdown,school,boys,lj,playroom,ours,stairs", ord);
  ok("minutes a week add up (counters 5×7 + mop 15×2 + …) and once/as-needed add 0", st("kitchen").mins===Math.round(by.kitchen.reduce((a,id)=>a+c.hhMinutesOf(c.hhJobs()[id])*c.hhTimesAWeek(c.hhJobs()[id]),0))&&st("kitchen").mins>=65);
  const el={}; c.get('hhView="rooms"; hhRmSel="";'); c.renderHousehold(el); const H=el.innerHTML;
  ok("the page opens on Whole house: a row per room with a bar, late count and min/wk; tap opens the room", /🏠 Whole house/.test(H)&&/hhRmGo\('kitchen'\)/.test(H)&&/\d+ late/.test(H)&&/min\/wk/.test(H));
  ok("top row: Downstairs open (its rooms), Upstairs folded, No room, Whole house, Edit rooms (Mom)", /⬇️ Downstairs ▾/.test(H)&&/⬆️ Upstairs ▸/.test(H)&&/hhRmGo\('living'\)/.test(H)&&!/hhRmGo\('boys'\)" style/.test(H.slice(0,H.indexOf("🏠 Whole house")))&&/❔ No room/.test(H)&&/🚪 Edit rooms/.test(H));
  ok("no buttons for what is not built (By person, Cleaning…, More, Checks, Rules)", !/By person|Cleaning…|⋯ More|🔍 Checks|⚙ Rules/.test(H));
  c.hhRmFoldToggle("up",false); c.renderHousehold(el); ok("Upstairs unfolds to its rooms", /⬆️ Upstairs ▾/.test(el.innerHTML)&&/hhRmGo\('boys'\)/.test(el.innerHTML));
  c.hhRmEditToggle(); c.renderHousehold(el); const E=el.innerHTML;
  ok("🚪 Edit rooms: every room with emoji, name, group, ▲ ▼ 🗑; groups with name ▲ ▼ 🗑; + Add room / group", CODE_IDS.every(id=>E.indexOf("hhRoomSet('"+id+"','name',this.value)")>0&&E.indexOf("hhRoomRemove('"+id+"')")>0)&&/hhGroupSet\('down','name'/.test(E)&&/\+ Add room/.test(E)&&/\+ Add group/.test(E)&&/No group/.test(E));
  ok("…and drawing it wrote nothing (the copy-in waits for her first change)", c.writes.length===0&&!c.get("hhRoomsStored()")); }

console.log("9. Wiring and weight");
{ ok("no 🔀 anywhere in index.html", src.indexOf("🔀")<0);
  ok("every reader of the room list goes through hhRoomList() (HH_ROOMS only in its definition, the accessor, the seed and hhRoomOf's fallback)", (src.match(/HH_ROOMS\b/g)||[]).length===(src.slice(src.indexOf("// HH_ROOMDATA_START"),src.indexOf("// HH_ROOMDATA_END")).match(/HH_ROOMS\b/g)||[]).length+2);
  ok("one new chip beside the old ones; every old chip still there", /chip\('rooms','🗺 Rooms'\)/.test(src)&&["review','📋 Review","habits','📈 Habits","week','📆 Week","area','🗂 Area","room','🚪 Room'","levels','🪜 Levels","today','📅 Today"].every(s=>src.indexOf("chip('"+s)>0));
  ok("the new view only runs when its chip is open (no boot code, no listener)", (()=>{ const s=src.slice(src.indexOf("// HH_ROOMPAGE_START"),src.indexOf("// HH_ROOMPAGE_END")); return !/addEventListener|setInterval|setTimeout|\.on\(/.test(s); })()); }

console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
