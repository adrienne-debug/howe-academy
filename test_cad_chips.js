/*
 * 📅 CAD_CHIPS (her ask 2026-10-18: "when adding a chore you can select more than one day like mon wed fri"). The Household ＋ Add
 * (animal chores live there), Mom's ✎ card add, her 🏡 My day quick add, Dad's add and Dad's ✎ row: Mon + Wed + Fri saves "wk:0,2,4".
 * run: node test_cad_chips.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,300)+")":"")); } };
const fn=name=>{ const i=src.indexOf("function "+name+"("); if(i<0) throw new Error("missing "+name); let d=0; for(let k=src.indexOf("{",i);k<src.length;k++){ if(src[k]==="{") d++; else if(src[k]==="}"&&--d===0) return src.slice(i,k+1); } throw new Error("unbalanced "+name); };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const CC=cut("// 📅 CAD_CHIPS (her ask 2026-10-18: \"when adding a chore","const HH_ADD_CADS=");
function mk(){ const els={}, writes=[];
  const doc={getElementById:id=>els[id]||null};
  const ctx={console,Object,Array,String,Number,parseInt,Math,JSON,Date,document:doc,els,writes,HA_LS:{setItem:()=>{}},
    momChoresData:{_seeded:true}, dadChoresData:{}, mcEnsure:()=>{}, _mcDb:(who,id,f,v)=>writes.push([who,id,f,v]), dcRepaint:()=>{}, renderMomsPlan:()=>{}, mcRepaint:()=>{}};
  vm.createContext(ctx); vm.runInContext(CC+"\n"+fn("mcAdd")+"\n"+fn("dcAdd")+"\n"+fn("dcSetCad"),ctx);
  // a tiny DOM for the chips: buttons by id with setAttribute
  ctx.mount=html=>{ const re=/<(input|button)[^>]*id="([^"]+)"[^>]*?(?:value="([^"]*)")?[^>]*>/g; let m; while((m=re.exec(html))){ els[m[2]]={id:m[2],value:m[3]||"",setAttribute:function(k,v){ this[k]=v; }}; } };
  return ctx; }

console.log("1. The chips");
{ const c=mk();
  ok("Mon + Wed + Fri → wk:0,2,4; tap Wed again → wk:0,4", c.cadChipNext(c.cadChipNext(c.cadChipNext("daily","0"),"2"),"4")==="wk:0,2,4"&&c.cadChipNext("wk:0,2,4","2")==="wk:0,4");
  ok("the last day off → Daily; all seven → Daily; 2 wks → 2w; a day from 2w → that day", c.cadChipNext("wk:3","3")==="daily"&&c.cadChipNext("wk:0,1,2,3,4,5","6")==="daily"&&c.cadChipNext("wk:1","2w")==="2w"&&c.cadChipNext("2w","5")==="wk:5");
  const h=c.cadChipsHTML("mc-cad","daily",[["2w","2 wks"]]); ok("Daily, Mon…Sun, 2 wks; a hidden value; Daily lit", /type="hidden" id="mc-cad" value="daily"/.test(h)&&/>Mon</.test(h)&&/>Sun</.test(h)&&/>2 wks</.test(h)&&/id="mc-cad-c-daily"[^>]*background:#2B7A78/.test(h));
  c.mount(h); c.cadChipTap("mc-cad","0"); c.cadChipTap("mc-cad","2"); c.cadChipTap("mc-cad","4");
  ok("tapping updates the value in place (no repaint) and lights the chips", c.els["mc-cad"].value==="wk:0,2,4"&&/#2B7A78/.test(c.els["mc-cad-c-2"].style)&&!/#2B7A78/.test(c.els["mc-cad-c-daily"].style));
}
console.log("2. Mom's adds");
{ const c=mk(); c.mount(c.cadChipsHTML("mc-cad-q","daily",[["2w","2 wks"]])); c.els["mc-new"]={id:"mc-new",value:"Feed Greg + Sunny"};
  c.cadChipTap("mc-cad-q","0"); c.cadChipTap("mc-cad-q","2"); c.cadChipTap("mc-cad-q","4"); c.mcAdd();
  const row=Object.values(c.momChoresData).find(r=>r&&r.label==="Feed Greg + Sunny"); ok("🏡 My day quick add: Mon/Wed/Fri chore saved as wk:0,2,4", row&&row.cad==="wk:0,2,4", row);
  const e=mk(); e.mount(e.cadChipsHTML("mc-cad","daily",[["2w","2 wks"]])); e.els["mc-new-edit"]={id:"mc-new-edit",value:"Wipe counters"}; e.cadChipTap("mc-cad","1"); e.cadChipTap("mc-cad","3"); e.mcAdd();
  ok("✎ card add: Tue/Thu", Object.values(e.momChoresData).some(r=>r&&r.label==="Wipe counters"&&r.cad==="wk:1,3"));
  const n=mk(); n.mount(n.cadChipsHTML("mc-cad-q","daily",[["2w","2 wks"]])); n.els["mc-new"]={id:"mc-new",value:"Water plants"}; n.mcAdd(); ok("no days tapped: Daily, as before", Object.values(n.momChoresData).some(r=>r&&r.label==="Water plants"&&r.cad==="daily"));
}
console.log("3. Dad's add and ✎");
{ const c=mk(); c.mount(c.cadChipsHTML("dc-cad","daily",[["2w","2 wks"]])); c.els["dc-new"]={id:"dc-new",value:"Bunny bedding"}; c.els["dc-slot"]={value:"morning"};
  c.cadChipTap("dc-cad","5"); c.cadChipTap("dc-cad","6"); c.dcAdd();
  ok("Dad's add: Sat + Sun → wk:5,6", Object.values(c.dadChoresData).some(r=>r&&r.label==="Bunny bedding"&&r.cad==="wk:5,6"&&r.slot==="morning"));
  ok("Dad's ✎ row: chips call dcSetCad with the next value (several days)", /dcSetCad\(\\''\+id\+'\\',cadChipNext\(\\''\+cur\+'\\',\\''\+cv\[0\]\+'\\'\)\)/.test(fn("ddPopHTML")));
}
console.log("4. Household ＋ Add (animal chores)");
{ const H=fn("hhAddHTML"), S=fn("hhAddSave");
  ok("Days: Daily · Pick days · Every 2/4/6 weeks · As needed; Pick days opens Mon–Sun", /HH_ADD_MODES\.map/.test(H)&&/hhAddDay\('\+i\+'\)/.test(H)&&/\["days","Pick days"\]/.test(src));
  ok("save accepts several days (wk:0,2,4)", /\/\^wk:\[0-6\]\(,\[0-6\]\)\*\$\/\.test\(hhAdd\.cad\|\|""\)/.test(S));
}
ok("cadDueOn already reads wk:0,2,4 (Mon, Wed, Fri)", /wk:/.test(fn("cadDueOn")));
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
