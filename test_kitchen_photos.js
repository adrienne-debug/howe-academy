// 📸 Recipe photos (2026-10-02): front + back of one card stay together (DeWalt report: the back wiped the front),
// and a stack of photos becomes several recipes in the Import preview. Nothing saves itself.
const fs=require("fs"); const src=fs.readFileSync(__dirname+"/index.html","utf8");
let pass=0, fail=0; const ok=(n,c)=>{ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n);} };
const fn=name=>{ const a=src.indexOf("function "+name+"("); let i=src.indexOf("{",a), d=0, j=i; for(;j<src.length;j++){ if(src[j]==="{")d++; else if(src[j]==="}"){ d--; if(!d) break; } } return (src.slice(a-6,a)==="async "?"async ":"")+src.slice(a,j+1); };
const slice=(a,z)=>src.slice(src.indexOf(a),src.indexOf(z));

ok("📸 door adds to the tray (does not read at once)", /onchange="kitCapAddPhotos\(this\)"[^<]*>📸 Photos of a recipe/.test(src));
ok("the editor shows the tray", /kitCap\.mode==='photos'&&kitCap\.photos\.length\) h\+=kitCapTrayHTML\(\)/.test(src));
ok("each recipe opens with an empty tray", /kitCap=\{mode:null,busy:false,msg:"",photos:\[\]\};/.test(fn("_kitEditMealGo")));
ok("tray + batch never write to Firebase", !/db\.ref/.test(slice("// RECIPE_PHOTO_TRAY_START","// RECIPE_PHOTO_TRAY_END")+slice("// RECIPE_PHOTO_BATCH_START","// RECIPE_PHOTO_BATCH_END")));
ok("the several-recipes prompt forbids inventing content", /KIT_CAP_MULTI_PROMPT=[\s\S]{0,400}never invent ingredients, amounts or steps/.test(src));
ok("Import panel shows the photo section", /h\+=kitImpPhotosHTML\(\);/.test(fn("kitImportHTML")));
ok("a photo-read recipe keeps its prep steps on Save", /prep:Array\.isArray\(r\.prep\)\?r\.prep\.slice\(\):\[\]/.test(fn("kitImpSave")));

// ── run the tray against stubs
const KIT_TAGS=[["gf"],["df"],["kid"],["batch"],["juice"]]; const kitWhenMin=s=>/^\d{1,2}:\d{2}$/.test(s)?1:null;
const tray=slice("// RECIPE_PHOTO_TRAY_START","// RECIPE_PHOTO_TRAY_END"), batch=slice("// RECIPE_PHOTO_BATCH_START","// RECIPE_PHOTO_BATCH_END");
function harness(answer){
  const env={calls:[],renders:0};
  const body=`let kitCap={mode:null,busy:false,msg:"",photos:[]}; let kitEditDraft={name:"",photo:""}; let kitImp={open:true,busy:false,msg:"",items:[],src:"",photos:[]};
    let kitMeals={a:{name:"Granola"}};
    const document={getElementById:()=>({})}; function renderMomsPlan(){ env.renders++; } function kitImpRender(){ env.renders++; } function _kitStash(){}
    function kitCapKey(){ return "k"; } const KIT_CAP_PROMPT="ONE RECIPE";
    let _n=0; async function kitCapShrink(f,max,q){ return "data:image/jpeg;base64,"+f+"@"+max; }
    async function kitCapAsk(content,tools,opt){ env.calls.push({content,opt}); return (opt&&opt.raw)?answer:answer; }
    function kitCapApply(r){ kitEditDraft.ing=(r.ingredients||[]).join("\\n"); kitEditDraft.applied=(kitEditDraft.applied||0)+1; }
    ${fn("kitCapParse")}
    ${tray}
    ${batch}
    return {get cap(){return kitCap;}, get draft(){return kitEditDraft;}, get imp(){return kitImp;}, kitCapAddPhotos,kitCapDropPhoto,kitCapPhotos,kitCapTrayHTML,kitImpParsePhotos,kitImpAddPhotos,kitImpReadPhotos,kitImpDropPhoto,kitImpPhotosHTML,KIT_CAP_MAX,KIT_IMP_PHOTO_MAX};`;
  return Object.assign(new Function("env","KIT_TAGS","kitWhenMin","esc","answer",body)(env,KIT_TAGS,kitWhenMin,s=>String(s),answer),{env});
}
const inp=(...f)=>({files:f,value:"x"});

(async()=>{
  { const h=harness({name:"Pie",ingredients:["2 c flour"],steps:["Bake"],yield:"",tags:[],prep:[]});
    await h.kitCapAddPhotos(inp("front"));
    ok("snapping the front does NOT call Claude yet", h.env.calls.length===0&&h.cap.photos.length===1&&h.cap.mode==="photos");
    ok("tray offers '＋ Add the back' and 'Read this photo'", /Add the back/.test(h.kitCapTrayHTML())&&/Read this photo/.test(h.kitCapTrayHTML())&&/>Front</.test(h.kitCapTrayHTML()));
    await h.kitCapAddPhotos(inp("back"));
    ok("snapping the back KEEPS the front", h.cap.photos.length===2&&/front/.test(h.cap.photos[0].big)&&/back/.test(h.cap.photos[1].big));
    ok("tray labels Front / Back and offers 'Read these 2 photos'", /Front/.test(h.kitCapTrayHTML())&&/Back/.test(h.kitCapTrayHTML())&&/these 2 photos/.test(h.kitCapTrayHTML()));
    await h.kitCapPhotos();
    const c=h.env.calls[0].content; const imgs=c.filter(x=>x.type==="image");
    ok("ONE Claude call carries both photos, front first", h.env.calls.length===1&&imgs.length===2&&/front/.test(imgs[0].source.data)&&/back/.test(imgs[1].source.data));
    ok("the call is labelled as one recipe's front + back", /front/i.test(c[0].text)&&/back/i.test(c[2].text)&&/ONE recipe card/.test(c[c.length-1].text));
    ok("draft filled once; the front becomes the picture", h.draft.applied===1&&/front@480/.test(h.draft.photo));
    ok("tray clears after reading", h.cap.photos.length===0&&h.cap.mode===null&&!h.cap.busy); }
  { const h=harness({}); await h.kitCapAddPhotos(inp("a","b","c","d","e","f","g","h"));
    ok("tray caps at 6 with a message", h.cap.photos.length===6&&/Up to 6/.test(h.cap.msg)&&!/Add the/.test(h.kitCapTrayHTML()));
    h.kitCapDropPhoto(0); ok("✕ removes one photo", h.cap.photos.length===5&&/b@/.test(h.cap.photos[0].big));
    for(let i=0;i<5;i++) h.kitCapDropPhoto(0); ok("removing the last photo closes the tray", h.cap.mode===null); }
  { // an existing recipe picture is kept
    const h2=harness({name:"X",ingredients:["1"],steps:[],yield:"",tags:[],prep:[]}); h2.draft.photo="data:keep"; await h2.kitCapAddPhotos(inp("z")); await h2.kitCapPhotos();
    ok("a recipe that already has a picture keeps it", h2.draft.photo==="data:keep"); }

  // ── several recipes
  { const h=harness("");
    const r=h.kitImpParsePhotos('Here: {"recipes":[{"photos":[1,2],"name":"Pie","ingredients":["2 c flour"],"steps":["Bake"],"yield":"8","tags":["GF","x"],"prep":[{"when":"nb","label":"Chill dough"}]},{"photos":[3],"name":"","ingredients":["eggs"],"steps":[]},{"photos":[9],"name":"","ingredients":[],"steps":[]}]}',3);
    ok("groups into recipes; empty records dropped", r.length===2);
    ok("fields mapped (lines, tags whitelisted, prep kept)", r[0].name==="Pie"&&r[0].ing==="2 c flour"&&r[0].steps==="Bake"&&r[0].yield==="8"&&JSON.stringify(r[0].tags)==='["gf"]'&&r[0].prep.length===1);
    ok("photo index = the recipe's first photo; nameless recipe gets a placeholder name", r[0].photoIdx===0&&r[1].photoIdx===2&&r[1].name==="Recipe from photo 3");
    let threw=false; try{ h.kitImpParsePhotos("nothing",2); }catch(e){ threw=true; } ok("no JSON → clear error", threw);
    threw=false; try{ h.kitImpParsePhotos('{"recipes":[]}',2); }catch(e){ threw=true; } ok("no recipes → clear error", threw); }
  { const ans='{"recipes":[{"photos":[1,2],"name":"Pie","ingredients":["a"],"steps":["b"]},{"photos":[3],"name":"granola","ingredients":["oats"],"steps":["mix"]}]}';
    const h=harness(ans);
    await h.kitImpAddPhotos(inp("p1","p2")); await h.kitImpAddPhotos(inp("p3"));
    ok("stack keeps every photo, no Claude call yet", h.imp.photos.length===3&&h.env.calls.length===0&&/Read 3 photos/.test(h.kitImpPhotosHTML()));
    await h.kitImpReadPhotos();
    const call=h.env.calls[0];
    ok("ONE call with all 3 photos, a bigger answer, raw text", call.content.filter(x=>x.type==="image").length===3&&call.opt.maxTokens>=8000&&call.opt.raw===true);
    ok("preview lists 2 recipes with their pictures", h.imp.items.length===2&&/p1@480/.test(h.imp.items[0].photo)&&/p3@480/.test(h.imp.items[1].photo));
    ok("a recipe already in the library is unticked", h.imp.items[0].on===true&&h.imp.items[1].on===false&&h.imp.items[1].dupe===true);
    ok("stack clears; message says nothing is saved until Save", h.imp.photos.length===0&&/tap Save/.test(h.imp.msg)); }
  { const h=harness(""); await h.kitImpAddPhotos(inp(...Array.from({length:25},(_, i)=>"q"+i)));
    ok("stack caps at 20 with a message", h.imp.photos.length===20&&/Up to 20/.test(h.imp.msg)); }

  console.log(pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
})();
