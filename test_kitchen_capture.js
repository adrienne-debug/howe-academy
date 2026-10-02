// ✨ Recipe capture (phase 2, 2026-10-02): paste / photos → Claude → a DRAFT Mom reviews. Nothing saves itself.
const fs=require("fs"); const src=fs.readFileSync(__dirname+"/index.html","utf8");
let pass=0, fail=0; const ok=(n,c)=>{ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n);} };
const fn=name=>{ const a=src.indexOf("function "+name+"("); let i=src.indexOf("{",a), d=0, j=i; for(;j<src.length;j++){ if(src[j]==="{")d++; else if(src[j]==="}"){ d--; if(!d) break; } } return src.slice(a,j+1); };
ok("capture doors render inside the editor", /\+kitCaptureHTML\(\)/.test(src));
ok("capture never writes to Firebase itself", !/db\.ref/.test(fn("kitCapApply")+fn("kitCapRunText")+fn("kitCapPhotos")+fn("kitCapAsk")));
ok("the prompt forbids inventing content", /never invent ingredients, amounts or steps/.test(src));
ok("key comes from the family key or the device key", /mastAIKey\)\|\|\(typeof haGetKey/.test(fn("kitCapKey")));
ok("Settings has the family AI key card", /renderAIKeyCard\(\)/.test(src)&&/config\/anthropic_key"\)\.set\(k\)/.test(src));
ok("family key save is Mom-only and dry-run safe", /if\(!momHere\(\)\) return;.*db&&!_dryRun\(\)/.test(fn("haFamilyKeySave")));
// parse helper: extract and run with the tag list + a time parser stub
const KIT_TAGS=[["gf"],["df"],["kid"],["batch"],["juice"]]; const kitWhenMin=s=>/^\d{1,2}:\d{2}$/.test(s)?1:null;
const parse=new Function("KIT_TAGS","kitWhenMin", fn("kitCapParse")+"; return kitCapParse;")(KIT_TAGS,kitWhenMin);
{ const r=parse('Sure! ```json\n{"name":"Granola","ingredients":["4 c oats","1/2 c honey"],"steps":["Mix","Bake 325 for 25 min"],"yield":"8 servings","tags":["GF","DF","batch","nonsense"],"prep":[{"when":"nb","label":"Soak nuts"},{"when":"07:30","label":"Oven on"},{"when":"junk","label":"x"},{"when":"nb","label":""}]}\n```');
  ok("parses JSON inside chatter and code fences", r.name==="Granola"&&r.ingredients.length===2&&r.steps.length===2&&r.yield==="8 servings");
  ok("keeps only known tags, lower-cased", JSON.stringify(r.tags)===JSON.stringify(["gf","df","batch"]));
  ok("prep steps: night-before kept, a clock time kept, junk time becomes night-before, empty label dropped", r.prep.length===3&&r.prep[0].when==="nb"&&r.prep[1].when==="07:30"&&r.prep[2].when==="nb"); }
{ let threw=false; try{ parse("no json here"); }catch(e){ threw=true; } ok("no JSON → a clear error, not a blank recipe", threw); }
console.log(pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
