// test_laundry_kidmove.js — AUDIT_laundry_2026-10-15 hole 6 (LAUNDRY_KIDMOVE): a kid's check-off can MOVE a load;
// hole 7 (LAUNDRY_STARTAT): a kid-started load asks "In the washer now?" once, and its clock follows the answer.
const fs=require('fs');const src=fs.readFileSync(process.argv[2]||require("path").join(__dirname,"index.html"),'utf8');
let fail=0;const eq=(a,b,m)=>{if(JSON.stringify(a)!==JSON.stringify(b)){fail++;console.log('FAIL',m,JSON.stringify(a),JSON.stringify(b))}else console.log('ok',m)};
const blk=(n)=>{const a=src.indexOf('// '+n+'_START'),b=src.indexOf('// '+n+'_END');if(a<0||b<0)throw new Error('no block '+n);return src.slice(a,b);};
// one top-level function's source, braces counted (these functions keep their braces out of strings)
const fn=(name)=>{const a=src.indexOf('function '+name+'(');if(a<0)throw new Error('no fn '+name);let i=src.indexOf('{',a),d=0;for(;i<src.length;i++){if(src[i]==='{')d++;else if(src[i]==='}'){d--;if(!d)return src.slice(a,i+1);}}};
const ISO='2026-10-16';
function mk(opts){
  opts=opts||{};
  const ctx={writes:[],laundryData:{},momBlocks:{},cfg:[],gbl:opts.grabs||[]};
  const db={ref:p=>({set:v=>ctx.writes.push(['set',p,v]),update:v=>ctx.writes.push(['update',p,v]),remove:()=>ctx.writes.push(['rm',p])})};
  const code=blk('KIDLAUNDRY')+blk('LAUNDRY_KIDMOVE')+(opts.startAt?blk('LAUNDRY_STARTAT'):'')+[fn('momBlockKey'),fn('momBlockFor'),fn('laundryBlockDone')].join('\n')
    +';function momBlocksOnValue(v){momBlocks=v||{};}'
    +';return {laundryKidHook,laundryStarts,laundryKidMove,laundryKidMovePick,cpSetLaundry,cpLaundryMoveHTML,cpGrabLaundryHTML,cpLaundryBtnHTML,gbLaundryMove,'
    +'setL:v=>{laundryData=v},getL:()=>laundryData,setB:v=>{momBlocks=v},getB:()=>momBlocks,setDay:d=>{day=d},setMomTick:v=>{_rtMomTick=v}'+(opts.startAt?',laundryStartAsk,laundryStartAnswer,laundryStartEarlier,laundryStartAskHTML,askId:()=>_lsaId':'')+'}';
  let mom=true,dry=false;
  const env={db,HA_LS:{setItem(){}},KID_NAME:{taylor:'Taylor'},cap:s=>s,day:'friday',_todayDay:'friday',momHere:()=>L.__mom(),_lbWrite:()=>!L.__dry(),
    mwTodayIso:()=>ISO,_lbNowMin:()=>600,laundryAwayRemember:(id,l)=>{ctx.away=(ctx.away||[]).concat(id)},
    rtCfgSet:(slot,kid,i,f,v)=>ctx.cfg.push([i,f,v]),_rtMomTick:false,document:opts.doc,cpSlot:'chores',cpKid:'taylor',renderAll:()=>{},gbList:()=>ctx.gbl,laundryData:{},momBlocks:{}};
  const L=new Function(...Object.keys(env),code)(...Object.values(env));
  L.__mom=()=>mom;L.__dry=()=>dry;L.setMomFlag=v=>{mom=v};L.setDryFlag=v=>{dry=v};
  return {L,ctx};
}
const T0=Date.parse('2026-10-16T09:00:00');
function pile(){ return {
  wOld:{label:'Towels',stage:'washer',ts:T0,by:'mom'},
  wNew:{label:'Taylor started laundry',stage:'washer',ts:T0+30*60000,by:'taylor'},
  dOld:{label:'Darks',stage:'dryer',ts:T0},
  dNew:{label:'Whites',stage:'dryer',ts:T0+10*60000,by:'dad'},
  fOld:{label:'Sheets',stage:'fold',ts:T0},
  fNew:{label:'Jeans',stage:'fold',ts:T0+5*60000,by:'taylor'},
  bin:{label:'💦 Towels',stage:'bin',ts:T0+99*60000,wet:true},
  pre:{label:'💦 Dog stuff',stage:'prewash',ts:T0+98*60000,wet:true}
};}
const clone=o=>JSON.parse(JSON.stringify(o));
function blocksFor(){ const b={}; [['wNew','washer'],['wOld','washer'],['dNew','dryer'],['fNew','fold']].forEach(([id,st])=>{b[id+'_'+st]={iso:ISO,load:id,stage:st,mins:5,at:'now',startMin:540};}); return b; }

// ── each stage value advances the newest load at the stage before it, and only that one ──
[['dryer','wNew','washer'],['fold','dNew','dryer'],['putaway','fNew','fold']].forEach(([to,id,from])=>{
  const {L,ctx}=mk(); const before=pile(); L.setL(clone(before)); L.setB(blocksFor());
  L.laundryKidHook('taylor',{label:'Move the laundry',laundry:to},'week2_friday_taylor_cstep3',true);
  const after=L.getL();
  if(to==='putaway'){ eq(after[id],undefined,to+': newest fold load put away'); eq(ctx.writes.filter(w=>w[0]==='rm').map(w=>w[1]),['laundry/'+id],to+': one targeted remove'); eq(ctx.away,[id],to+': ↶ ledger remembers it'); }
  else { eq(after[id].stage,to,to+': newest '+from+' load moved'); eq(after[id].by,before[id].by,to+': by kept'); eq(after[id].label,before[id].label,to+': label kept');
    const lw=ctx.writes.filter(w=>w[1].indexOf('laundry/')===0); eq(lw.length,1,to+': one laundry write'); eq(lw[0][0]+' '+lw[0][1],'update laundry/'+id,to+': targeted update');
    eq(Object.keys(lw[0][2]).sort(),['stage','ts'],to+': only stage + ts written'); }
  Object.keys(before).filter(k=>k!==id).forEach(k=>{ if(JSON.stringify(after[k])!==JSON.stringify(before[k])){fail++;console.log('FAIL',to,'touched',k);} });
  eq(L.getB()[id+'_'+from].done,true,to+': that stage\'s block ended');
  const bw=ctx.writes.filter(w=>w[1].indexOf('momBlocks/')===0); eq(bw.map(w=>w[0]+' '+w[1]),['update momBlocks/'+ISO+'/'+id+'_'+from],to+': block write targeted');
  eq(bw[0][2],{done:true,doneMin:600},to+': done + doneMin');
  const other=Object.keys(L.getB()).filter(k=>k!==id+'_'+from&&L.getB()[k].done); eq(other,[],to+': no other block ended');
});
// the newest is by ts, whichever key order
{ const {L}=mk(); L.setL({a:{label:'A',stage:'washer',ts:T0+60000},z:{label:'Z',stage:'washer',ts:T0}}); L.laundryKidMove('taylor','dryer'); eq([L.getL().a.stage,L.getL().z.stage],['dryer','washer'],'newest by ts'); }
// wet loads in prewash/bin are never "the washer"
{ const {L,ctx}=mk(); L.setL({bin:{stage:'bin',ts:T0},pre:{stage:'prewash',ts:T0}}); eq(L.laundryKidMove('taylor','dryer'),null,'prewash/bin not moved'); eq(ctx.writes,[],'prewash/bin no write'); }

// ── no load at that stage → plain check-off: nothing written, nothing created ──
['dryer','fold','putaway'].forEach(to=>{ const {L,ctx}=mk(); const p=pile(); const keep={}; Object.keys(p).filter(k=>p[k].stage!==({dryer:'washer',fold:'dryer',putaway:'fold'})[to]).forEach(k=>keep[k]=p[k]);
  L.setL(clone(keep)); L.laundryKidHook('taylor',{label:'Fold and put away a load of laundry',laundry:to},'k',true);
  eq(ctx.writes,[],to+': no load → no write'); eq(L.getL(),keep,to+': no load → pile unchanged'); });

// ── uncheck is inert, for every stage value ──
['dryer','fold','putaway'].forEach(to=>{ const {L,ctx}=mk(); L.setL(clone(pile())); L.setB(blocksFor());
  L.laundryKidHook('taylor',{label:'x',laundry:to},'k',false); eq(ctx.writes,[],to+': uncheck writes nothing'); eq(L.getL(),pile(),to+': uncheck leaves the pile'); });
// a stage step never starts a load (even when the wording looks like a start)
{ const {L,ctx}=mk(); L.setL({}); L.laundryKidHook('taylor',{label:'Start a load of laundry',laundry:'dryer'},'week2_friday_taylor_mstep8',true); eq(L.getL(),{},'stage step never starts a load'); eq(ctx.writes,[],'…and writes nothing');
  eq(L.laundryStarts({label:'Start a load of laundry',laundry:'fold'}),false,'laundryStarts false for a stage'); eq(L.laundryStarts({label:'Start a load of laundry',laundry:true}),true,'true still starts'); }
// another day's back-fill moves nothing
{ const {L,ctx}=mk(); L.setL(clone(pile())); L.setDay('thursday'); L.laundryKidHook('taylor',{label:'x',laundry:'dryer'},'k',true); eq(ctx.writes,[],'other day: no move'); }
// dry run: local move, no Firebase write
{ const {L,ctx}=mk(); L.setL(clone(pile())); L.setDryFlag(true); L.laundryKidMove('taylor','fold'); eq(ctx.writes,[],'dry run: no write'); eq(L.getL().dNew.stage,'fold','dry run: local move'); }
// a skipped block stays as it was (laundryBlockDone's own rule)
{ const {L,ctx}=mk(); L.setL(clone(pile())); const b=blocksFor(); b.wNew_washer.at='skip'; L.setB(b); L.laundryKidMove('taylor','dryer'); eq(ctx.writes.filter(w=>w[1].indexOf('momBlocks/')===0),[],'skipped block untouched'); }

// ── the picker: Mom only, values widened ──
{ const {L,ctx}=mk();
  L.cpSetLaundry(2,'dryer'); L.cpSetLaundry(2,'fold'); L.cpSetLaundry(2,'putaway'); L.cpSetLaundry(2,''); L.cpSetLaundry(2,'bogus'); L.cpSetLaundry(2,true); L.cpSetLaundry(2,false);
  eq(ctx.cfg,[[2,'laundry','dryer'],[2,'laundry','fold'],[2,'laundry','putaway'],[2,'laundry',null],[2,'laundry',null],[2,'laundry',true],[2,'laundry',false]],'Mom sets each value');
  L.setMomFlag(false); const n=ctx.cfg.length; L.cpSetLaundry(2,'fold'); L.cpSetLaundry(2,true); eq(ctx.cfg.length,n,'not Mom → no change');
  const h=L.cpLaundryMoveHTML({label:'Move laundry to the dryer',laundry:'dryer'},4);
  eq(/cpSetLaundry\(4,this\.value\)/.test(h),true,'row picker calls cpSetLaundry'); eq(/value="dryer" selected/.test(h),true,'row picker shows the stage');
  ['dryer','fold','putaway'].forEach(v=>eq(h.indexOf('value="'+v+'"')>=0,true,'row picker offers '+v));
  eq(L.cpLaundryMoveHTML({label:'Make bed'},0),'','no picker on a non-laundry row');
  eq(/Tell Mom\?/.test(L.cpLaundryBtnHTML({label:'Move laundry to the dryer',laundry:'dryer'},0)),true,'start toggle reads off on a stage step');
  const g=L.cpGrabLaundryHTML({label:'Fold and put away a load of laundry'},6);
  eq(/gbSet\(6,'laundry',this\.value\)/.test(g),true,'grab picker calls gbSet (Mom only)'); eq(/value="" selected/.test(g),true,'grab picker unset by default');
  eq(L.cpGrabLaundryHTML({label:'Wipe the baseboards'},1),'','no picker on a non-laundry grab'); }
// gbSet / cpSetLaundry stay Mom-gated in the source
eq(/function gbSet\(i,f,v\)\{ if\(!momHere\(\)\)return;/.test(src),true,'gbSet checks momHere');
// the Chore Plan rows render the pickers
eq(src.indexOf("cpLaundryMoveHTML(st,i)")>0&&src.indexOf("cpGrabLaundryHTML(st,i)")>0,true,'renderChorePlan shows both pickers');

// ── grabs carry the field: ✓ on a grab moves the load ──
{ const {L,ctx}=mk({grabs:[{label:'Wipe'},{label:'Fold and put away a load of laundry',laundry:'putaway'}]}); L.setL(clone(pile()));
  eq(L.gbLaundryMove('lucy',0),null,'grab without the field moves nothing'); eq(ctx.writes,[],'…no write');
  eq(L.gbLaundryMove('lucy',1),'fNew','grab putaway → newest fold load'); eq(L.getL().fNew,undefined,'…put away'); }
eq(/function gbInstant\([^\n]*gbLaundryMove\(kid,i\)/.test(src)&&/function gbMarkDone\([^\n]*gbLaundryMove\(kid,i\)/.test(src),true,'gbInstant + gbMarkDone call gbLaundryMove');
eq(/function gbLetGo\([^\n]*gbLaundryMove/.test(src),false,'let go moves nothing');


// ── hole 7: "In the washer now?" ──
function fakeDoc(){ const els={}; return {els,body:{appendChild:e=>{els[e.id]=e;}},createElement:()=>({id:'',innerHTML:''}),getElementById:id=>els[id]||null}; }
const START={label:'Start a load of laundry',laundry:true}, SK='week2_friday_taylor_mstep8', LID='lk_'+SK;
{ const doc=fakeDoc(); const {L,ctx}=mk({startAt:true,doc}); L.setL({});
  L.laundryKidHook('taylor',START,SK,true);
  eq(L.askId(),LID,'start step asks about the new load');
  const h=doc.els['lsa-wrap'].innerHTML; eq(/In the washer now\?/.test(h),true,'asks "In the washer now?"');
  eq(/>Yes</.test(h)&&/>Earlier…</.test(h),true,'[Yes] [Earlier…]');
  eq(/answer|spell/i.test(h.replace(/laundryStartAnswer/g,'')),false,'kid-safe text');
  const n=ctx.writes.length; const t=L.laundryStartAnswer(null);
  eq(L.getL()[LID].ts,t,'Yes: ts = the answer time'); eq(ctx.writes.slice(n).map(w=>w[0]+' '+w[1]),['set laundry/'+LID+'/ts'],'Yes: one targeted ts write');
  eq(doc.els['lsa-wrap'].innerHTML,'','prompt closes'); eq(L.askId(),null,'asked once');
  eq(L.laundryStartAnswer(null),null,'a second answer does nothing'); }
// Earlier… opens a time picker; the ts is set from it
{ const doc=fakeDoc(); const {L,ctx}=mk({startAt:true,doc}); L.setL({});
  L.laundryKidHook('taylor',START,SK,true); L.laundryStartEarlier(true);
  const h=doc.els['lsa-wrap'].innerHTML; eq(/type="time"/.test(h)&&/What time did it go in\?/.test(h),true,'Earlier… opens a time picker');
  const now=Date.parse('2026-10-16T09:39:00'); const n=ctx.writes.length;
  const t=L.laundryStartAnswer('08:45',now); eq(t,Date.parse('2026-10-16T08:45:00'),'Earlier: ts = 8:45 today');
  eq(L.getL()[LID].ts,t,'Earlier: load clock moved'); eq(ctx.writes.slice(n),[['set','laundry/'+LID+'/ts',t]],'Earlier: laundry/<id>/ts only'); }
// a time still to come counts as now
{ const doc=fakeDoc(); const {L}=mk({startAt:true,doc}); L.setL({}); L.laundryKidHook('taylor',START,SK,true);
  const now=Date.parse('2026-10-16T09:39:00'); eq(L.laundryStartAnswer('11:00',now),now,'future time → now'); }
// Mom moved it on before the answer → answer dropped
{ const doc=fakeDoc(); const {L,ctx}=mk({startAt:true,doc}); L.setL({}); L.laundryKidHook('taylor',START,SK,true); L.getL()[LID].stage='dryer';
  const n=ctx.writes.length; eq(L.laundryStartAnswer('08:45'),null,'moved-on load: answer dropped'); eq(ctx.writes.length,n,'…no write'); }
// dry run: local only
{ const doc=fakeDoc(); const {L,ctx}=mk({startAt:true,doc}); L.setL({}); L.setDryFlag(true); L.laundryKidHook('taylor',START,SK,true); L.laundryStartAnswer('08:45',Date.parse('2026-10-16T09:39:00')); eq(ctx.writes,[],'dry run: no write'); }
// only laundry-start steps ask: not a stage move, not a plain chore, not a re-check of a load already there, not Mom's own tick, not another day
{ const doc=fakeDoc(); const {L}=mk({startAt:true,doc}); L.setL(clone(pile()));
  L.laundryKidHook('taylor',{label:'Move laundry',laundry:'dryer'},'k1',true); eq(L.askId(),null,'stage move: no question');
  L.laundryKidHook('taylor',{label:'Make bed'},'k2',true); eq(L.askId(),null,'plain chore: no question');
  L.laundryKidHook('taylor',START,'k3',false); eq(L.askId(),null,'uncheck: no question');
  L.setMomTick(true); L.laundryKidHook('taylor',START,'k4',true); eq(L.askId(),null,"Mom's tick: no question"); L.setMomTick(false);
  L.setDay('thursday'); L.laundryKidHook('taylor',START,'k5',true); eq(L.askId(),null,'other day: no question'); L.setDay('friday');
  L.laundryKidHook('taylor',START,'k6',true); eq(L.askId(),'lk_k6','new start: question'); L.laundryStartAnswer(null);
  L.laundryKidHook('taylor',START,'k6',true); eq(L.askId(),null,'load already there: no second question'); }
// the hook calls the prompt only from KIDLAUNDRY's new-load branch
eq(/laundryData\[id\]=\{label:[^\n]*\n[^\n]*\n[^\n]*laundryStartAsk\(id\)/.test(blk('KIDLAUNDRY')),true,'prompt sits right after the new-load write');

console.log(fail?fail+' FAILED':'all pass');process.exit(fail?1:0);
