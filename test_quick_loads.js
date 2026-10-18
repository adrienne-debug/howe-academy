/*
 * ⚡ QUICKLOADS — custom wash cycles part 2 (her ask 2026-10-17: quick buttons with pre wash / wash / dry / air dry / custom and a time
 * for each; "typically mom and dad but make it part of the customization"; "on dewalt u erase my custom buttons … edit custom button
 * area on the laundry tab but they show up on whoevers page"). Howe defaults = her five; other families none; a tap makes a cycle
 * load (LAUNDRY_CYCLE), bin first or straight in, a line slot, the to-do.  run: node test_quick_loads.js
 */
const fs=require("fs"), path=require("path"), vm=require("vm");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){ pass++; console.log("  ok  - "+n); } else { fail++; console.log("  FAIL- "+n+(x!==undefined?"  ("+JSON.stringify(x).slice(0,400)+")":"")); } };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("missing "+a); return src.slice(i,j); };
const QL=cut("// QUICKLOADS_START","// QUICKLOADS_END"), LC=cut("const LC_KINDS=","// LAUNDRY_CYCLE_END");
function mk(o){
  o=o||{}; const writes=[], toasts=[], ls={}, jumps=[];
  const ctx={console,Object,Array,String,Number,parseInt,Math,JSON,Date,
    HA_LS:{getItem:k=>ls[k]||null,setItem:(k,v)=>{ ls[k]=v; }},
    db:{ref:p=>({set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))])})},
    _dryRun:()=>!!o.dry, HA_IS_HOWE:o.howe!==false, isMom:!o.noMom, momHere:()=>ctx.isMom, kitPinGate:()=>{ ctx.gated=true; }, gated:false, confirm:()=>true,
    laundryData:{}, momdayData:{}, daddayData:{}, laundryTimes:{}, laundryT:k=>({wash:60,dry:60,grace:30})[k],
    _wtIso:()=>"2026-10-17", mwTodayIso:()=>"2026-10-17", _todayDay:"saturday",
    llJumpAdd:(id,label)=>{ jumps.push([id,label]); return " · Lucy's clothes moves to tomorrow"; },
    ROSTER:["lincoln","ellis","lucy","julian"], KID_NAME:{lincoln:"Lincoln",ellis:"Ellis",lucy:"Lucy",julian:"Julian"}, cap:s=>s.charAt(0).toUpperCase()+s.slice(1),
    esc:s=>String(s==null?"":s), mwToast:t=>toasts.push(t), hhRender:()=>{}, llRerender:()=>{}, writes, toasts, jumps};
  vm.createContext(ctx); vm.runInContext(LC+"\n"+QL+"\nthis.__d=()=>qlDraft; this.__e=()=>qlEdit;",ctx);
  if(o.saved) ctx.quickLoadsOnValue(o.saved);
  ctx.get=e=>vm.runInContext(e,ctx); return ctx;
}

console.log("1. Per family");
{ const h=mk();
  ok("Howe, never saved: her five, in order", h.qlIds().join()==="towels,sheets_king,sheets_queen,dog,blanket");
  ok("…each Prewash → Wash → Dry, Mom + Dad, bin first, a slot; the sheets carry the spare-sheets to-do", h.qlIds().every(id=>h.qlStepsTxt(h.qlAll()[id])==="Prewash 60m → Wash 60m → Dry 60m"&&h.qlAll()[id].bin&&h.qlAll()[id].slot&&h.qlAll()[id].who.mom&&h.qlAll()[id].who.dad&&!h.qlAll()[id].who.lincoln)&&/king/.test(h.qlAll().sheets_king.todo));
  const d=mk({howe:false});
  ok("DeWalt (any other family), never saved: none — the row hides", d.qlIds().length===0&&d.qlRowHTML("mom")==="");
  const s=mk({saved:{_set:true}}); ok("Howe after she deleted them all: none (her choice sticks)", s.qlIds().length===0);
}
console.log("2. Whose page");
{ const c=mk({saved:{_set:true,towels:{emoji:"🧻",label:"Towels",steps:[{k:"wash"}],who:{mom:true,dad:true},order:0},rug:{emoji:"🧶",label:"Rug",steps:[{k:"wash"}],who:{lucy:true,mom:true},order:1}}});
  ok("Mom: Towels + Rug; Dad: Towels; Lucy: Rug; Lincoln: nothing", c.qlFor("mom").join()==="towels,rug"&&c.qlFor("dad").join()==="towels"&&c.qlFor("lucy").join()==="rug"&&c.qlFor("lincoln").length===0);
  ok("Mom's row: ⚡ Quick loads with both, taps as mom", /⚡ Quick loads:/.test(c.qlRowHTML("mom"))&&/qlTap\('rug','mom'\)/.test(c.qlRowHTML("mom")));
  ok("Lucy's Day page today: her Rug button; another day: nothing", /qlTap\('rug','lucy'\)/.test(c.qlKidRowHTML("lucy","saturday"))&&c.qlKidRowHTML("lucy","monday")==="");
  c.qlTap("towels","lucy"); ok("a button not given to Lucy can't be tapped as her", c.writes.length===0);
}
console.log("3. A tap");
{ const c=mk(); const lid=c.qlTap("sheets_king","mom"); const w=c.writes.find(x=>x[1]==="laundry/"+lid)[2];
  ok("Sheets (king): a laundry/<id> load in the bin, wet, with its three steps", w.stage==="bin"&&w.bin===true&&w.wet===true&&w.cycle.map(x=>x.k).join()==="prewash,wash,dry"&&/^💦 Sheets \(king\) · /.test(w.label)&&w.by==="mom"&&w.quick==="sheets_king", w);
  ok("a slot on today's line (jumpDay + llJumpAdd), the toast says what slid", w.jumpDay==="2026-10-17"&&c.jumps[0][0]===lid&&/in the wash-today bin · Lucy's clothes moves to tomorrow/.test(c.toasts[0]));
  ok("the spare-sheets to-do on Mom's list", c.writes.some(x=>x[1]==="momday/2026-10-17/todos/"+lid&&/spare sheets on the king/.test(x[2].text)));
  const d=mk(); const dl=d.qlTap("towels","dad"); ok("Dad's tap: by dad, 'started by Dad'", d.writes[0][2].by==="dad"&&/started by Dad$/.test(d.writes[0][2].label));
  const r=mk({saved:{_set:true,rug:{emoji:"🧶",label:"Rug",steps:[{k:"custom",n:"Soak",m:20},{k:"wash",m:40},{k:"airdry",m:300}],who:{lucy:true},slot:false,bin:false,order:0}}});
  const rl=r.qlTap("rug","lucy"), rw=r.writes[0][2];
  ok("not bin-first: straight into its first step (Soak, custom, step 0), by Lucy, no slot, no to-do", rw.stage==="custom"&&rw.step===0&&rw.cycle[0].n==="Soak"&&rw.cycle[0].m===20&&rw.by==="lucy"&&!rw.jumpDay&&r.jumps.length===0&&r.writes.length===1&&/Rug — soak started/.test(r.toasts[0]), rw);
  const y=mk({dry:true}); y.qlTap("towels","mom"); ok("dry run: nothing written", y.writes.length===0);
}
console.log("4. Editing on the laundry tab (Mom)");
{ const c=mk(); c.qlOpen("new"); ok("＋ New opens a draft: Wash → Dry, Mom + Dad, a slot, not bin", c.__e()==="new"&&c.__d().steps.map(x=>x.k).join()==="wash,dry"&&c.__d().slot&&!c.__d().bin);
  c.qlSet("label","Rugs"); c.qlSet("emoji","🧶"); c.qlStepSet(0,"k","custom"); c.qlStepSet(0,"n","Soak"); c.qlStepSet(0,"m","20"); c.qlStepAdd(); c.qlStepSet(2,"k","airdry"); c.qlStepSet(2,"m","300"); c.qlStepDel(1); c.qlWho("dad"); c.qlWho("lucy"); c.qlSet("slot",false);
  c.qlSave(); const u=c.writes[0][2];
  ok("the first save on Howe writes her five + _set + the new one — one update, one path each", c.writes.length===1&&c.writes[0][1]==="settings/quickLoads"&&u._set===true&&["towels","sheets_king","sheets_queen","dog","blanket"].every(k=>u[k]&&u[k].label)&&u.q_rugs, Object.keys(u));
  ok("Rugs: Soak 20 → Air dry 300, Mom + Lucy (not Dad), no slot, after the five", c.qlStepsTxt(u.q_rugs)==="Soak 20m → Air dry 300m"&&u.q_rugs.who.mom&&u.q_rugs.who.lucy&&!u.q_rugs.who.dad&&u.q_rugs.slot===false&&u.q_rugs.order===5, u.q_rugs);
  c.writes.length=0; c.qlOpen("towels"); c.qlStepSet(2,"k","airdry"); c.qlSave();
  ok("✎ Towels → Air dry last: only settings/quickLoads/towels written", JSON.stringify(Object.keys(c.writes[0][2]))==='["towels"]'&&c.writes[0][2].towels.steps[2].k==="airdry");
  c.writes.length=0; c.qlDel("dog"); ok("✕ Dog stuff: dog = null only", JSON.stringify(c.writes[0][2])==='{"dog":null}'&&c.qlIds().indexOf("dog")<0);
  c.writes.length=0; c.qlMove("q_rugs",-1); ok("↑ Rugs: above Blanket; only the orders that changed are written", c.qlIds().join()==="towels,sheets_king,sheets_queen,q_rugs,blanket"&&Object.keys(c.writes[0][2]).every(k=>/\/order$/.test(k)), [c.qlIds(),c.writes[0][2]]);
  c.writes.length=0; c.qlOpen("new"); c.qlSave(); ok("no name: not saved", c.writes.length===0&&/Give it a name/.test(c.toasts[c.toasts.length-1]));
  c.qlSet("label","X"); c.__d().steps=[]; c.qlSave(); ok("no steps: not saved", c.writes.length===0&&/at least one step/.test(c.toasts[c.toasts.length-1]));
}
console.log("5. The card");
{ const c=mk(); const h=c.qlCardHTML();
  ok("⚡ Quick buttons: each with its steps and who, ↑ ↓ ✎ ✕, ＋ New", /⚡ Quick buttons/.test(h)&&/Prewash 60m → Wash 60m → Dry 60m · Mom, Dad · bin first · uses a slot/.test(h)&&/qlOpen\('towels'\)/.test(h)&&/qlDel\('blanket'\)/.test(h)&&/qlOpen\('new'\)/.test(h));
  c.qlOpen("sheets_king"); const e=c.qlCardHTML(); ok("✎ opens the editor: steps with times, Shows on, the two switches, the to-do", /＋ Step/.test(e)&&/Shows on/.test(e)&&/Starts in the wash-today bin/.test(e)&&/Uses a slot on the laundry line/.test(e)&&/spare sheets on the king/.test(e));
  const k=mk({noMom:true}); const kh=k.qlCardHTML(); ok("a kid's device: the list, no buttons", /Towels/.test(kh)&&!/qlOpen\(|qlDel\(|qlMove\(/.test(kh));
  k.qlOpen("new"); k.qlDel("towels"); ok("…and no edits from it", k.gated&&k.writes.length===0);
}
console.log("6. Wiring");
ok("the old row hands over to her buttons", /if\(typeof qlRowHTML==="function"\) return qlRowHTML\(who\);/.test(src));
ok("the card is on Household ▸ 🧺 Laundry", /h\+=qlCardHTML\(\)/.test(cut("function hhLaundryHTML(","// HH_LAUNDRY_END")));
ok("a kid's Day page gets their row", /h\+=qlKidRowHTML\(kid,day\)/.test(src));
ok("the listener reads settings/quickLoads", /db\.ref\("settings\/quickLoads"\)\.on\("value"/.test(src));
ok("no 🔀", src.indexOf("🔀")<0);
console.log("\n"+pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
