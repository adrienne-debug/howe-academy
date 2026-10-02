// 📥 Recipe import (phase 3, 2026-10-02): Paprika export (zip of gzipped JSON) / .csv → preview items. Pure parts only.
const fs=require("fs"), zlib=require("zlib"); const src=fs.readFileSync(__dirname+"/index.html","utf8");
let pass=0, fail=0; const ok=(n,c)=>{ if(c){pass++;console.log("  ok  - "+n);} else {fail++;console.log("  FAIL- "+n);} };
const fn=name=>{ const a=src.indexOf("function "+name+"("); if(a<0) throw new Error("missing "+name); const pre=src.slice(Math.max(0,a-6),a); let i=src.indexOf("{",a), d=0, j=i; for(;j<src.length;j++){ if(src[j]==="{")d++; else if(src[j]==="}"){ d--; if(!d) break; } } return (pre.endsWith("async ")?"async ":"")+src.slice(a,j+1); };
const lib=new Function(fn("kitInflate")+fn("kitZipEntries")+fn("kitImpFromPaprika")+fn("kitCsvParse")+fn("kitImpFromCsv")+"; return {kitInflate,kitZipEntries,kitImpFromPaprika,kitCsvParse,kitImpFromCsv};")();
// build a real .paprikarecipes: a zip whose entries are deflated, each holding a gzipped recipe JSON
function zip(entries){ const parts=[], cd=[]; let off=0;
  entries.forEach(([name,data])=>{ const nb=Buffer.from(name), comp=zlib.deflateRawSync(data);
    const lh=Buffer.alloc(30); lh.writeUInt32LE(0x04034b50,0); lh.writeUInt16LE(20,4); lh.writeUInt16LE(8,8); lh.writeUInt32LE(comp.length,18); lh.writeUInt32LE(data.length,22); lh.writeUInt16LE(nb.length,26);
    parts.push(lh,nb,comp);
    const ch=Buffer.alloc(46); ch.writeUInt32LE(0x02014b50,0); ch.writeUInt16LE(20,4); ch.writeUInt16LE(20,6); ch.writeUInt16LE(8,10); ch.writeUInt32LE(comp.length,20); ch.writeUInt32LE(data.length,24); ch.writeUInt16LE(nb.length,28); ch.writeUInt32LE(off,42);
    cd.push(ch,nb); off+=30+nb.length+comp.length; });
  const cdb=Buffer.concat(cd), e=Buffer.alloc(22); e.writeUInt32LE(0x06054b50,0); e.writeUInt16LE(entries.length,8); e.writeUInt16LE(entries.length,10); e.writeUInt32LE(cdb.length,12); e.writeUInt32LE(off,16);
  return Buffer.concat([...parts,cdb,e]); }
const r1={name:"Turkey Chili",ingredients:"1 lb ground turkey\n1 can beans\n\n1 onion",directions:"Brown turkey\nSimmer 30 min",servings:"6",source_url:"https://example.com/chili",categories:["Gluten-Free","Freezer meals"],prep_time:"10 min",cook_time:"40 min",notes:"Kids like it mild",photo_data:""};
const r2={name:"Green Smoothie",ingredients:"spinach\nbanana",directions:"Blend",servings:"2",categories:["Smoothies","Dairy free"]};
(async()=>{
  const buf=zip([["Turkey Chili.paprikarecipe",zlib.gzipSync(Buffer.from(JSON.stringify(r1)))],["Green Smoothie.paprikarecipe",zlib.gzipSync(Buffer.from(JSON.stringify(r2)))]]);
  const ab=buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.length);
  const ents=await lib.kitZipEntries(ab); ok("zip: finds both entries", ents.length===2&&ents[0].name==="Turkey Chili.paprikarecipe");
  const recs=[]; for(const en of ents) recs.push(lib.kitImpFromPaprika(JSON.parse(new TextDecoder().decode(await lib.kitInflate(en.data,"gzip")))));
  const c=recs[0];
  ok("Paprika: name, ingredients (blank lines dropped), yield, link", c.name==="Turkey Chili"&&c.ing==="1 lb ground turkey\n1 can beans\n1 onion"&&c.yield==="6"&&c.url==="https://example.com/chili");
  ok("Paprika: steps keep directions, then times and notes as Note lines", c.steps==="Brown turkey\nSimmer 30 min\nNote: Prep 10 min · Cook 40 min\nNote: Kids like it mild");
  ok("Paprika: categories become tags (gluten-free → gf, freezer → batch)", JSON.stringify(c.tags)===JSON.stringify(["gf","batch"]));
  ok("Paprika: smoothie + dairy free → juice, df", JSON.stringify(recs[1].tags.sort())===JSON.stringify(["df","juice"]));
  let threw=false; try{ await lib.kitZipEntries(new ArrayBuffer(40)); }catch(e){ threw=/Paprika export/.test(e.message); } ok("not a zip → a clear message", threw);
  const csv='name,ingredients,steps,yield,url,tags\n"Pancakes","1 c flour\n1 egg","Mix | Cook",4,https://x.y/p,"GF; kid"\n"Say ""Cheese"" Toast",bread | cheese,Toast,,,\n,,,,,\n';
  const cr=lib.kitImpFromCsv(csv);
  ok("CSV: two recipes, blank row skipped", cr.length===2);
  ok("CSV: quoted multi-line cell and ' | ' both split lines", cr[0].ing==="1 c flour\n1 egg"&&cr[0].steps==="Mix\nCook"&&cr[1].ing==="bread\ncheese");
  ok("CSV: escaped quotes, tags mapped", cr[1].name==='Say "Cheese" Toast'&&JSON.stringify(cr[0].tags)===JSON.stringify(["gf","kid"]));
  threw=false; try{ lib.kitImpFromCsv("title only\n"); }catch(e){ threw=true; } ok("CSV without recipes → error", threw);
  ok("save writes one path per recipe, never the whole box", /db\.ref\('kitchen\/meals\/'\+id\)\.set\(m\)/.test(fn("kitImpSave"))&&!/db\.ref\('kitchen\/meals'\)\.set/.test(src));
  ok("device copy of the recipe box drops pictures", /delete c\.photo/.test(fn("kitMealsLSSave"))&&!/HA_LS\.setItem\('ha_kit_meals',JSON\.stringify\(kitMeals\)\)/.test(src));
  ok("link door uses Claude web fetch and continues a paused turn", /web_fetch_20260209/.test(fn("kitCapRunLink"))&&/pause_turn/.test(fn("kitCapAsk")));
  console.log(pass+" passed, "+fail+" failed"); process.exit(fail?1:0);
})();
