#!/usr/bin/env node
// Builds the spoken-text list for the pre-generated speech files (tts/<hash>.m4a).
// Extracts _ttsFileUrl + the definition maps VERBATIM from index.html (no drift),
// pulls every kid's live deck (reads only), and emits "<hash>\t<clean text>" lines
// for gen_tts.sh to synthesize. Idempotent — re-run whenever decks change.
const fs=require("fs"), https=require("https"), path=require("path");
const ROOT=path.join(__dirname,"..");
const HTML=fs.readFileSync(path.join(ROOT,"index.html"),"utf8");

function slice(startMark,endMark){
  const a=HTML.indexOf(startMark); if(a<0) throw new Error("marker missing: "+startMark);
  const b=HTML.indexOf(endMark,a); if(b<0) throw new Error("end missing after "+startMark);
  return HTML.slice(a,b+endMark.length);
}
eval(slice("function _ttsFileUrl(text)","return \"tts/\"+h.toString(16)+\".m4a\"; }"));
eval(slice("const MAST_VOCAB_DEFS=","};").replace("const MAST_VOCAB_DEFS=","globalThis.MAST_VOCAB_DEFS="));
eval(slice("const MAST_MATH_ANS={","};").replace("const MAST_MATH_ANS={","globalThis.MAST_MATH_ANS={"));

function get(p){ return new Promise((res,rej)=>{
  https.get("https://howeacademy-default-rtdb.firebaseio.com"+p,r=>{
    let d=""; r.on("data",c=>d+=c); r.on("end",()=>{ try{res(JSON.parse(d));}catch(e){rej(e);} });
  }).on("error",rej);
});}

(async()=>{
  const kids=["julian","lucy","ellis","lincoln"];
  const texts=new Set();
  for(const kid of kids){
    const items=Object.values(await get("/mastery/"+kid+".json")||{}).filter(Boolean);
    const defs=(await get("/mastery/"+kid+"_settings/definitions.json"))||{};
    items.forEach(it=>{
      if(!it.prompt) return;
      texts.add(String(it.prompt));                       // match "say the word" + show-me speak the PROMPT
      // mirror of mastGetDef + mastSpeakItem: definition/answer read-aloud for flip cards
      const d=defs[it.prompt]||MAST_MATH_ANS[it.prompt]||MAST_VOCAB_DEFS[String(it.prompt).toLowerCase()]||"";
      const spoken=d||((it.answer&&it.answer!==it.prompt)?it.answer:"")||it.definition||"";
      if(spoken) texts.add(String(spoken));
    });
  }
  const out=[];
  texts.forEach(t=>{
    const hash=_ttsFileUrl(t).replace(/^tts\/|\.m4a$/g,"");
    // speak a CLEANED version (rule-deck defs carry <u>/<span> markup; TTS text is hashed RAW)
    const clean=t.replace(/<[^>]*>/g,"").replace(/\s+/g," ").trim();
    if(clean) out.push(hash+"\t"+clean.replace(/\t/g," "));
  });
  fs.writeFileSync(path.join(ROOT,"scripts","tts_list.tsv"),out.join("\n")+"\n");
  console.log(out.length+" unique texts → scripts/tts_list.tsv");
})().catch(e=>{ console.error(e); process.exit(1); });
