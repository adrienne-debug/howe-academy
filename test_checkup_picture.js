// CKPIC — her report 2026-11-10: a Shapes check-up "writes the word but doesnt show the picture for mom to say if it is
// right or not". The check-up card now shows the deck's picture first (Shapes / Colors / Counting / unit pictures) with
// the name on the flip; letters, words and math facts are unchanged.
const fs=require("fs"), path=require("path");
const src=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
let pass=0, fail=0; const ok=(n,c,x)=>{ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n+(x!==undefined?"  "+JSON.stringify(x):""));} };
const cut=(a,b)=>{ const i=src.indexOf(a), j=src.indexOf(b,i); if(i<0||j<0) throw new Error("markers "+a); return src.slice(i,j); };
ok("CKPIC block exists", src.indexOf("// CKPIC_START")>0 && src.indexOf("// CKPIC_END")>src.indexOf("// CKPIC_START"));
ok("the card render calls ckPicFirst once", (cut("// CHECKUP_START","// CHECKUP_END").match(/ckPicFirst\(c,ckRun\.kid\)/g)||[]).length===1);
ok("no new Firebase write in the block", !/\.ref\(|\.set\(|\.update\(/.test(cut("// CKPIC_START","// CKPIC_END")));
// run the helper with stubs
const stubs={ calls:[] };
const sandbox="var MAST_ANIMAL_EMOJI={Lion:'\\u{1F981}'}; var _kidArg=null;"
 +"function ckSlug(s){return String(s==null?'':s).replace(/[^a-z0-9]/gi,'_');}"
 +"function mastLiveVisual(it,kid){ _kidArg=kid; return it.subject==='Sharks'?{emoji:'\\u{1F988}'}:null; }"
 +"function mastItemVis(it){ if(it.subject==='Colors') return '<div style=\"width:36px;height:36px;border-radius:50%;background:red\"></div>'; if(it.subject==='Counting') return '<span style=\"font-size:14px\">\\u{1F995}\\u{1F995}</span>'; if(it.subject==='Sharks') return '\\u{1F988}'; if(MAST_ANIMAL_EMOJI[it.prompt]) return MAST_ANIMAL_EMOJI[it.prompt]; return it.prompt; }"
 +"function mastShapeVis(name,px){ return '<svg data-shape=\"'+name+'\" width=\"'+px+'\"></svg>'; }"
 +cut("// CKPIC_START","// CKPIC_END")+"; return {ckPicFirst:ckPicFirst, kidArg:function(){return _kidArg;}};";
const S=new Function(sandbox)();
const sh=S.ckPicFirst({_dk:"Shapes",name:"triangle"},"k1");
ok("Shapes → the shape drawing, big", /data-shape="triangle"/.test(sh)&&/width="120"/.test(sh), sh);
ok("Shapes picture does not contain the word as text", !/>triangle</.test(sh));
const co=S.ckPicFirst({_dk:"Colors",name:"red"},"k1");
ok("Colors → the swatch, enlarged", /width:110px;height:110px/.test(co), co);
ok("Counting → the counting pictures", /\u{1F995}/u.test(S.ckPicFirst({_dk:"Counting",name:"2"},"k1")));
const an=S.ckPicFirst({_dk:"Animals",name:"Lion"},"k1");
ok("an animal emoji card → the emoji wrapped big", /font-size:96px/.test(an)&&/\u{1F981}/u.test(an), an);
const un=S.ckPicFirst({_dk:"Sharks",name:"Great White Shark"},"k1");
ok("a unit picture deck (live visual) → its picture", /\u{1F988}/u.test(un), un);
ok("the kid is passed to the live-visual lookup", S.kidArg()==="k1");
ok("Math Facts → null (unchanged card)", S.ckPicFirst({_dk:"Math Facts",name:"6 × 7"},"k1")===null);
ok("Letters → null (the letter is the prompt)", S.ckPicFirst({_dk:"Letters",name:"B"},"k1")===null);
ok("a word deck → null", S.ckPicFirst({_dk:"Spelling",name:"house"},"k1")===null);
ok("no deck → null, no throw", S.ckPicFirst({name:"x"},"k1")===null && S.ckPicFirst(null,"k1")===null);
console.log(pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
