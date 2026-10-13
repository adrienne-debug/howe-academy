// ✎ Rotation editor (2026-10-12, her ask: "make where I can trade out things / edit the rotations, specifically
//   the fall rotation"). Pure diff → targeted writes; the first edit of a code-shipped default seeds it first.
const fs=require("fs"); const src=fs.readFileSync(__dirname+"/index.html","utf8");
let pass=0, fail=0; const ok=(n,c)=>{ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n);} };
const fn=name=>{ const a=src.indexOf("function "+name+"("); if(a<0) throw new Error("missing "+name); let i=src.indexOf("{",a), d=0, j=i; for(;j<src.length;j++){ if(src[j]==="{")d++; else if(src[j]==="}"){ d--; if(!d) break; } } return src.slice(a,j+1); };
const blockA=src.indexOf("// KIT_ROT_EDIT_START"), blockZ=src.indexOf("// KIT_ROT_EDIT_END");
ok("marked block exists", blockA>0&&blockZ>blockA);
const block=src.slice(blockA,blockZ);

// ── a tiny app: one code-shipped default (like 🍂 Fall), nothing stored yet ──
const DEF={fall:{name:"Fall",emoji:"🍂",weeks:[[{d:"Tacos",b:"Pancakes",l:"PB&J",s:"Popcorn"},{d:"Chili",b:"Oatmeal"}]],ts:0}};
const env=`
  let kitRotations={}, kitMeals={m1:{name:"Gluten-Free Waffles"},m2:{name:"Tacos"}}, kitRotOpen=null, toasts=[], writes=[], ls={};
  const KIT_ROT_DEFAULT=${JSON.stringify(DEF)};
  const HA_LS={setItem:(k,v)=>{ls[k]=v;},getItem:k=>ls[k]||null};
  const db={ref:p=>({set:v=>writes.push(["set",p,JSON.parse(JSON.stringify(v))]),update:v=>writes.push(["update",p,JSON.parse(JSON.stringify(v))]),remove:()=>writes.push(["remove",p])})};
  const mwToast=t=>toasts.push(t); const esc=s=>String(s); const kitRotRender=()=>{}; const kitPinGate=(then)=>then();
  const KIT_ROT_DAYS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  ${fn("kitRotAll")} ${fn("kitRotEnsure")} ${block}
  return {get rot(){return kitRotations;}, get edit(){return kitRotEdit;}, writes, toasts, start:kitRotEditStart, set:kitRotEditSet, save:kitRotEditSave, cancel:kitRotEditCancel, diff:kitRotEditDiff, html:kitRotEditHTML, all:kitRotAll};
`;
const A=new Function(env)();

// diff is pure and only lists changed slots
const same=A.diff(DEF.fall,[[{d:"Tacos",sd:"",b:"Pancakes",l:"PB&J",s:"Popcorn"},{d:"Chili",sd:"",b:"Oatmeal",l:"",s:""}]]);
ok("diff: an untouched grid writes nothing", Object.keys(same).length===0);
const one=A.diff(DEF.fall,[[{d:"Tacos",sd:"",b:"Gluten-Free Waffles ",l:"PB&J",s:"Popcorn"},{d:"Chili",sd:"",b:"Oatmeal",l:"",s:""}]]);
ok("diff: one traded slot → one path, trimmed", JSON.stringify(one)==='{"weeks/0/0/b":"Gluten-Free Waffles"}');
const clr=A.diff(DEF.fall,[[{d:"Tacos",sd:"",b:"",l:"PB&J",s:"Popcorn"},{d:"Chili",sd:"Rice",b:"Oatmeal",l:"",s:""}]]);
ok("diff: blank clears (null), a new side is added", clr["weeks/0/0/b"]===null&&clr["weeks/0/1/sd"]==="Rice"&&Object.keys(clr).length===2);

// edit → save on the code-shipped default: seed first, then ONE targeted update
A.start("fall");
ok("start: working copy has 7 days per week, every slot a string", A.edit&&A.edit.id==="fall"&&A.edit.weeks[0].length===7&&A.edit.weeks[0].every(d=>["d","sd","b","l","s"].every(k=>typeof d[k]==="string")));
ok("start: the stored rotation is untouched until Save", Object.keys(A.rot).length===0&&A.writes.length===0);
A.set(0,0,"b","Gluten-Free Waffles");
A.set(0,1,"b","Oatmeal");   // typed the same thing back — not a change
A.save();
const w=A.writes;
ok("save: seeds the default into kitchen/rotations first (rotation, then _seeded)", w[0]&&w[0][0]==="set"&&w[0][1]==="kitchen/rotations/fall"&&w[1]&&w[1][1]==="kitchen/rotations/_seeded");
const up=w.find(x=>x[0]==="update");
ok("save: one multi-path update under the rotation, not a whole-node set", !!up&&up[1]==="kitchen/rotations/fall"&&!w.some(x=>x[0]==="set"&&x[1]==="kitchen/rotations/fall"&&w.indexOf(x)>w.indexOf(up)));
ok("save: only the traded slot (+ts) is in the update", up&&Object.keys(up[2]).sort().join(",")==="ts,weeks/0/0/b"&&up[2]["weeks/0/0/b"]==="Gluten-Free Waffles");
ok("save: local copy updated, other slots kept, editor closed", A.rot.fall.weeks[0][0].b==="Gluten-Free Waffles"&&A.rot.fall.weeks[0][0].d==="Tacos"&&A.rot.fall.weeks[0][1].b==="Oatmeal"&&A.edit===null);
ok("save: the default constant itself was not mutated", DEF.fall.weeks[0][0].b==="Pancakes");
ok("save: toast names the rotation and the count", /Fall · 1 slot changed/.test(A.toasts[A.toasts.length-1]));

// a second edit with nothing changed writes nothing
const before=A.writes.length;
A.start("fall"); A.save();
ok("save: no change → no write, 'Nothing changed'", A.writes.length===before&&/Nothing changed/.test(A.toasts[A.toasts.length-1]));

// cancel discards
A.start("fall"); A.set(0,0,"d","Pizza"); A.cancel();
ok("cancel: discards the working copy", A.edit===null&&A.rot.fall.weeks[0][0].d==="Tacos");

// UI wiring
ok("card: ✎ Edit button on every rotation row", /kitRotEditStart\(\\''\+id\+'\\'\)/.test(fn("kitRotationsCardHTML"))&&/✎ Edit/.test(fn("kitRotationsCardHTML")));
ok("card: the edit grid replaces the preview while editing", /kitRotEdit&&kitRotEdit\.id===id\) h\+=kitRotEditHTML/.test(fn("kitRotationsCardHTML")));
ok("edit is behind the Mom PIN like recipe changes", /kitPinGate\(/.test(fn("kitRotEditStart")));
ok("inputs update the copy in place (no repaint mid-typing)", /oninput="kitRotEditSet\(/.test(fn("kitRotEditHTML")));
A.start("fall"); const html=A.html(A.edit); A.cancel();
ok("grid offers the library's meal names as a pick-list", /<datalist id="kit-rot-meal-names">/.test(html)&&/value="Gluten-Free Waffles"/.test(html)&&/list="kit-rot-meal-names"/.test(html));
ok("grid: 7 days × 5 slots per week", (html.match(/<input type="text" list="kit-rot-meal-names"/g)||[]).length===35);
ok("delete closes an open editor on that rotation", /kitRotEdit&&kitRotEdit\.id===id\) kitRotEdit=null/.test(fn("kitRotDel")));
ok("no 🔀 in index.html", src.indexOf("🔀")<0);

console.log(pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
