/*
 * 🧺 BREAK_LAUNDRY — per-break laundry setting (her ask 2026-10-16: "we need to have a setting for the different breaks because
 * some breaks laundry will happen"). The holiday/vacation form's 🧺 Laundry pick (Keeps going / Pauses), saved as laundry:"on"|"off"
 * on the break; a break saved before it follows its pause. The laundry line honors it.  run: node test_break_laundry.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
function mk(cal){
  const writes=[], els={};
  const ctx={console,Object,Array,String,Number,parseInt,Math,JSON,Date,alert:()=>{},
    BREAK_PAUSE_LBL:{school:"School only",chores:"School + chores",all:"Everything"},
    calendarData:cal||{holidays:{},vacations:{}}, calEditId:null, calAddMode:null, calNormDate:s=>s, calGenId:n=>"id_"+n.toLowerCase().replace(/\W+/g,""), renderAll:()=>{},
    document:{getElementById:id=>els[id]||null}, els,
    db:{ref:p=>({set:v=>writes.push(["set",p,v]),update:v=>writes.push(["update",p,v])})}, writes,
    HA_LS:{getItem:()=>null,setItem:()=>{}}, KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    _hhIsoLocal:ms=>iso(new Date(ms)), esc:s=>String(s==null?"":s), momHere:()=>true, _lbWrite:()=>true, hhRender:()=>{}};
  vm.createContext(ctx);
  vm.runInContext(cut("// BREAK_LAUNDRY_START","// BREAK_LAUNDRY_END")+"\n"+fn("calRenderAddForm")+"\n"+fn("calSave")+"\n"+cut("// LAUNDRYLINE_START","// LAUNDRYLINE_END"),ctx);
  return ctx;
}
const sel=(h,id)=>{ const i=h.indexOf('id="'+id+'"'); const seg=h.slice(i,h.indexOf("</select>",i)); const m=seg.match(/value="(\w+)" selected/); return m&&m[1]; };

console.log("1. The rule");
{ const c=mk();
  ok("a saved pick wins", c.breakLaundryOn({pause:"all",laundry:"on"})===true&&c.breakLaundryOn({pause:"school",laundry:"off"})===false);
  ok("no pick: school-only keeps going, chores/everything pause (the old rule)", c.breakLaundryOn({pause:"school"})&&c.breakLaundryOn({})&&!c.breakLaundryOn({pause:"chores"})&&!c.breakLaundryOn({pause:"all"}));
}
console.log("2. The form");
{ const c=mk({holidays:{t:{name:"Thanksgiving",start:"2026-11-26",end:"2026-11-27",pause:"all"}},vacations:{b:{name:"Beach",start:"2026-12-01",end:"2026-12-05",pause:"all",laundry:"on"}}});
  const add=c.calRenderAddForm("holiday"); ok("Add: a 🧺 Laundry row, Keeps going selected (pause starts at school only)", /🧺 Laundry/.test(add)&&sel(add,"cal-add-laundry")==="on"&&/Keeps going/.test(add)&&/Pauses</.test(add));
  ok("the Pauses select moves Laundry with it", /id="cal-add-pause" onchange="calLaundryFollow\(\)"/.test(add));
  c.calEditId="t"; const ed=c.calRenderAddForm("holiday"); ok("Edit an old everything-break with no pick: Pauses selected", sel(ed,"cal-add-laundry")==="off");
  c.calEditId="b"; const eb=c.calRenderAddForm("vacation"); ok("Edit the Beach break she set to keep going: Keeps going selected", sel(eb,"cal-add-laundry")==="on");
}
console.log("3. Follow the pause until she picks");
{ const c=mk(); c.els["cal-add-pause"]={value:"all"}; c.els["cal-add-laundry"]={value:"on",dataset:{}};
  c.calLaundryFollow(); ok("pause → Everything: Laundry → Pauses", c.els["cal-add-laundry"].value==="off");
  c.els["cal-add-pause"].value="school"; c.calLaundryFollow(); ok("pause → School only: Laundry → Keeps going", c.els["cal-add-laundry"].value==="on");
  c.els["cal-add-laundry"].dataset.touched="1"; c.els["cal-add-pause"].value="all"; c.calLaundryFollow(); ok("after she picks Laundry herself it stays", c.els["cal-add-laundry"].value==="on");
}
console.log("4. Save");
{ const c=mk(); Object.assign(c.els,{"cal-add-name":{value:"Fall break"},"cal-add-start":{value:"2026-10-22"},"cal-add-end":{value:"2026-10-23"},"cal-add-pause":{value:"all"},"cal-add-laundry":{value:"on"}});
  c.calSave("holiday"); const w=c.writes[0];
  ok("one write, the same calendar/holidays/<id> the form always made, now with laundry:on", c.writes.length===1&&w[1]==="calendar/holidays/id_fallbreak"&&w[2].pause==="all"&&w[2].laundry==="on"&&w[2].name==="Fall break", c.writes);
  delete c.els["cal-add-laundry"]; c.writes.length=0; c.calSave("holiday"); ok("no Laundry select on screen: no laundry field written", c.writes.length===1&&!("laundry" in c.writes[0][2]));
}
console.log("5. The laundry line honors it");
{ const c=mk({holidays:{f:{name:"Fall break",start:"2026-10-20",end:"2026-10-20",pause:"all",laundry:"on"},t:{name:"Teacher day",start:"2026-10-21",end:"2026-10-21",pause:"school",laundry:"off"}},vacations:{}});
  const p=c.llProject("2026-10-19",4);
  ok("Mon Lincoln; Tue everything-break but laundry keeps going → Ellis, tagged; Wed school-only but laundry paused → none; Thu Lucy", p[0].loads.join()==="lincoln"&&p[1].loads.join()==="ellis"&&p[1].tag==="Fall break"&&!p[1].brk&&p[2].brk==="Teacher day"&&!p[2].loads.length&&p[3].loads.join()==="lucy", p.map(r=>[r.brk,r.tag,r.loads]));
  const g=c.llWeekGridHTML("2026-10-19"); ok("the grid: 🏖 Fall break tag over Ellis; ⏸ Teacher day", /🏖 Fall break<\/div><div[^>]*><div[^>]*>👕<\/div><div[^>]*>Ellis</.test(g)&&/⏸<br>Teacher day/.test(g));
}
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
