// 🔗 UBKIND — the ✚ Builder's "📓 Notebook activities & field trips" box learns the kind (slice 8 of
//   PLAN_unit_activity_types_2026-11-19, §4 row 8: "accepts the type and a link per line (title | points | a line | https://…)";
//   Adrienne 2026-11-22/23: "go with her answers and build").
//   Runs the REAL UNITBUILD + UBKIND + UACTKIND + UACTLINK blocks (+ UNITTRACK, PUTSCHED) on stubs, and the REAL UTADDACT day editor
//   for the after-Save record it must equal.
//   · a line with an https address in the 4th place → a 🔗 item; on Save the record is the after-Save one, byte for byte; no kidOpen
//   · no address → today's item and today's record, byte for byte: the activities lines of the existing Builder tests and ~400
//     generated lines, against ubParse / ubMessy / ubRecord exactly as they were on main (frozen copies below, so this test does
//     not go red the day it merges)
//   · a bad address (http, www., a bare site, javascript:, a typo) or an address in the wrong column → the line is NOT added and
//     NOT lost: it stays in the box, the box says why; the good lines of the same paste are added
//   · a paste carrying an address is never sent to Claude (its drafts carry no address); a paste without one still is
//   · the box row shows the 🔗 chip + the address; the spread shows 🔗; no duplicate ids; balanced HTML; dry run / not Mom → nothing
//   run: node test_unit_build_kind.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
const fn = name => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("no " + name); let d = 0, j = i, seen = false; for (; j < src.length; j++) { const c = src[j]; if (c === "{") { d++; seen = true; } else if (c === "}") { d--; if (seen && d === 0) break; } } return src.slice(i, j + 1); };
const UB = cut("// UNITBUILD_START", "// UNITBUILD_END"), BLK = cut("// UBKIND_START", "// UBKIND_END") + "// UBKIND_END\n";
const KIND = cut("// UACTKIND_START", "// UACTKIND_END"), LINK = cut("// UACTLINK_START", "// UACTLINK_END");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x).slice(0, 600) : "")); } };
const J = x => JSON.stringify(x);

// ── ubParse, ubMessy and ubRecord exactly as they were on main 2a590dba (before UBKIND), renamed *_main ──
const FROZEN = String.raw`
function ubParse_main(kind,text){
  const out=[]; ubLines(text).forEach(l=>{ const piped=l.indexOf("|")>=0; let b=piped?l.split("|").map(s=>s.trim()):(kind==="videos"?[l]:ubSplitLoose(l));
    if(!piped&&kind==="books"){ const by=/^(.+?)\s+by\s+(.+)$/i.exec(l); if(by) b=[by[1],by[2]]; }
    if(kind==="cards"){ if(b[0]) out.push({id:ubId(),front:ubStr(b[0],120),back:ubStr(b[1]||"",400)}); }
    else if(kind==="books"){ if(b[0]) out.push({id:ubId(),title:ubStr(b[0],120),by:ubStr(b[1]||"",80),url:ubUrl(b[2]||"")}); }
    else if(kind==="videos"){ let u=piped?ubUrl(b[0]):"", lab=b[1]||""; if(!piped){ const m=/https:\/\/\S+/i.exec(l); if(m){ u=ubUrl(m[0].replace(/[).,]+$/,"")); lab=l.replace(m[0],"").replace(/[()]/g,"").replace(/^[\s:\u2013\u2014-]+|[\s:\u2013\u2014-]+$/g,""); } } if(u) out.push({id:ubId(),url:u,label:ubStr(lab,60)}); }
    else if(kind==="acts"){ if(b[0]){ const p=parseInt(b[1],10), num=isFinite(p)&&p>0; out.push({id:ubId(),title:ubStr(b[0],120),points:num?p:5,desc:ubStr((piped||num)?(b[2]||""):(b[1]||""),240)}); } } });
  return out;
}
function ubMessy_main(kind,text){ const L=ubLines(text); if(L.length<2||kind==="videos") return false; return L.some(l=>l.indexOf("|")<0); }
function ubRecord_main(f){
  const id=ubUnitId(f.title), deck=ubStr(f.title,80)||"Cards", ts=Date.now();
  const u={id:id,title:ubStr(f.title,80),emoji:f.emoji||"\u{1F4D8}",desc:ubStr(f.desc,240),kind:f.kind||"topic",version:1,nbInsert:true,addedTs:ts,
    author:{family:ubFamily(),first:f.first||"Mom"},sources:(f.sources||[]).slice()};
  if(f.ages) u.ages=f.ages; if(f.kind==="book") u.familyOnly=true;
  const cards=[], visuals={}, acts=[], days=[]; let order=0;
  const actKeys={};
  f.days.forEach((d,di)=>{
    const n=di+1; const names=[];
    d.cards.forEach(c=>{ if(!c.checked) return; const card={name:c.front,order:++order,ch:n,checked:{by:c.checked.by,at:c.checked.at}}; if(c.back) card.def=c.back; if(c.draft) card.drafted=true; cards.push(card); names.push(c.front); if(c.pic&&c.pic.imageUrl) visuals[deck+"_"+c.front]={imageUrl:c.pic.imageUrl,credit:c.pic.credit||""}; });
    const res={links:[],books:[]};
    d.videos.forEach(v=>{ res.links.push({url:v.url,label:v.label||"Video",kind:"video"}); });
    d.books.forEach(b=>{ const o={title:b.title}; if(b.by) o.by=b.by; res.books.push(o); if(b.url) res.links.push({url:b.url,label:b.title,kind:"site"}); });
    let nb=null;
    d.acts.forEach(a=>{ let key=ubSlug(a.title)||"activity"; let k=2; const base=key; while(actKeys[key]) key=base+"_"+(k++); actKeys[key]=1; const act={key:key,title:a.title,emoji:"\u{1F3A8}",kind:"sheet",points:a.points||5,day:n}; if(a.desc) act.desc=a.desc; acts.push(act); if(!nb) nb={activity:key}; });
    const day={id:"d"+n,n:n,t:d.t||ubAutoTitle(d)||("Day "+n),res:res}; if(names.length) day.cards=[{deck:deck,names:names}]; if(nb) day.nb=nb;
    const craft=ubCraftOf(d); if(craft) day.craft=craft;   // CRAFT (B3)
    days.push((typeof utClean==="function")?utClean(day):day);
  });
  u.decks=[{key:deck,mode:"flip",introCap:3,cards:cards}];
  if(acts.length) u.activities=acts;
  if(Object.keys(visuals).length) u.visuals=visuals;
  u.track={mode:"seq",perWeek:Math.max(1,Math.min(5,parseInt(f.perWeek,10)||4)),days:days};
  return u;
}
`;

function world(o) {
  o = o || {}; const writes = [], tx = [], asks = [], toasts = [];
  class FD extends Date { static now() { return 1764000000000; } }
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date: FD, parseInt, isNaN, isFinite, WeakMap, Promise, setTimeout, clearTimeout,
    unitStudies: {}, ROSTER: ["k1", "k2"], momHere: () => o.mom !== false, _dryRun: () => !!o.dry,
    db: { ref: p => ({ set: v => writes.push([p, v]), update: v => writes.push([p, v]), transaction: f => { const r = f(null); tx.push([p, JSON.parse(J(r))]); return { then: cb => { cb({ committed: r !== undefined }); return { catch: () => {} }; } }; } }) },
    window: { HA_FAMILY: { familyId: "fam", familyName: "Test Academy" } }, HA_LS: { getItem: () => "Mom", setItem: () => {} }, cap: s => s ? s[0].toUpperCase() + s.slice(1) : s,
    renderAll: () => { ctx.repaints = (ctx.repaints || 0) + 1; }, repaints: 0, openUnit: id => { ctx.opened = id; }, gwShowToast: m => toasts.push(m),
    document: { getElementById: () => null }, lrSafeUrl: u => /^https:\/\//i.test(String(u || "").trim()) ? String(u).trim() : "",
    famDefs: () => ({}), famList: x => x || [], famTrack: () => null, famWhoBlockFor: () => null, famWrite: () => true, famItems: () => [], currData: { subjects: {} }, masteryData: {},
    kitCapKey: () => (o.key ? "k" : ""), kitCapAsk: async c => { asks.push(c); return '{"items":[{"title":"Drafted","desc":"by Claude"}]}'; } };
  vm.createContext(ctx);
  vm.runInContext(cut("// UNITTRACK_START", "// UNITTRACK_END") + "\n" + cut("// PUTSCHED_START", "// PUTSCHED_END") + "\n" + KIND + "\n" + LINK + "\n" + UB + "\n" + (o.noBlock ? "" : BLK) + "\n" + FROZEN +
    "\nObject.defineProperty(this,'ubForm',{get:()=>ubForm,set:v=>{ubForm=v;}});", ctx);
  ctx.ubOpen(); ctx.ubSet("title", "Farms"); ctx.ubGo("fill");
  return { ctx, writes, tx, asks, toasts };
}
// type into a box and tap + Add (the textarea is the element the app reads and clears)
const add = (w, di, text) => { const el = { value: text }; w.ctx.document.getElementById = id => id === "ub-in-acts-" + (di == null ? "all" : di) ? el : null; const r = w.ctx.ubAddLines(di, "acts"); return { r, el }; };
const noId = L => L.map(x => { const y = Object.assign({}, x); delete y.id; return y; });
const acts0 = w => w.ctx.ubForm.days[0].acts;

console.log("── the block ──");
ok("UBKIND is a marked block right after UNITBUILD_END", BLK.length > 2000 && src.indexOf("// UBKIND_START") === src.indexOf("// UNITBUILD_END") + "// UNITBUILD_END\n".length);
ok("the block never touches db, Firebase or a listener", !/db\.|\.ref\(|\.set\(|\.update\(|\.remove\(|\.on\(|setInterval|addEventListener/.test(BLK.replace(/^\s*\/\/.*$/mg, "")));
ok("no family names, no 🔀", BLK.indexOf("\u{1F500}") < 0 && !/Lincoln|Ellis|Lucy|Julian|Sara\b|DeWalt|taylor|makenzie|andrew|caleb|kenzie/i.test(BLK));
ok("the 9 hooks in UNITBUILD are each typeof-guarded (the Builder runs as before without the block)",
  UB.split('typeof ubkHold==="function"').length === 3 &&
  ['typeof ubkAny==="function"', 'typeof ubkLine==="function"', 'typeof ubkRecord==="function"', 'typeof ubkRowHTML==="function"', 'typeof ubkHint==="function"', 'typeof ubkLeftText==="function"', 'typeof ubkIcon==="function"']
    .every(h => UB.split(h).length === 2));
ok("the address rule is UACTLINK's own uakUrl — the block has no second https check", /uakUrl\(c\[3\]\)/.test(BLK) && /uakUrl\(a\.url\)/.test(BLK) && !/\^https:/.test(BLK));
ok("kidOpen is never set from the Builder", BLK.replace(/^\s*\/\/.*$/mg, "").indexOf("kidOpen") < 0 && UB.indexOf("kidOpen") < 0);
ok("the box's own label and placeholder in UB_BOXES are untouched", UB.indexOf('["acts","\\u{1F4D3} Notebook activities & field trips","title | points | a line about it"]') > 0);

console.log("\n── no address: read exactly as before ──");
// the activities lines the existing Builder tests type or paste, and every paste of test_unit_any_paste fed to this box too
const FIXTURES = ["Hand turkey | 5 | trace and color", "What I'm thankful for | 10", "Zoo trip | 10\nAnimal mask | 5\nHabitat diorama | 8",
  "Shoebox diorama – build a habitat\nNature walk | 10 | find three homes",
  "Here is your vocabulary list:\n\n1. **Habitat** – the natural home of an animal\n2. **Predator**: an animal that hunts others\n- Prey - an animal that is hunted\n• Erosion\tthe wearing away of rock",
  "| Word | Meaning |\n|---|---|\n| Habitat | home |\n| Prey | hunted |", "1. Over in the Forest by Marianne Berkes\n2. Squanto's Journey – Joseph Bruchac",
  "Farm video | 4 | Watch it, then tell Mom one thing", "Farm video | 4", "Salt crystals | 5", "x"];
// lines carrying an address — the only ones whose reading may change (they are 🔗 or held now)
const WITH_ADDR = ["- Animal homes (https://youtu.be/abc)\nhttps://youtu.be/def – Who lives here?\nftp://no"];
// a few hundred generated lines with no address in them: titles, points (blank, words, 0, negative, "10pts"), lines, a plain 4th and
// 5th column, bullets, numbers, **bold**, table pipes, tabs, dashes, colons, =, quotes, <tags>, &, emoji, times, decimals
function gen(n) {
  let seed = 7; const r = k => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % k; };
  const W = ["Nature walk", "Pet rock", "Corn maze", "Thank-you card", "Draw the Mayflower", "Salt dough map", "Leaf rubbing", "Bird feeder", "Pumpkin count", "Dr. Who's chair", "3.5 cups of oats", "well-known song", "Mom & me", "<b>bold</b> idea", "\"Quoted\" title", "🦃 turkey hands", "e.g. a nest", "Tea at 3:45", "Café visit", "A–Z hunt"];
  const P = ["", "5", "10", "3", "0", "-3", "abc", "10pts", " 7 ", "100", "2.5"];
  const D = ["", "trace and color", "find three homes", "with Mom", "build it: then show", "use 1 = one cup", "say it – then draw it", "outside if dry", "a, b and c", "ask Dad first"];
  const X = ["", "", "", "with Mom", "outside", "two days", "bring a jar"];
  const pre = ["", "", "- ", "1. ", "• ", "**", "| ", "(2) "];
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = W[r(W.length)], p = P[r(P.length)], d = D[r(D.length)], x = X[r(X.length)], s = r(9);
    let l;
    if (s === 0) l = t;
    else if (s === 1) l = t + " – " + d;
    else if (s === 2) l = t + ": " + d;
    else if (s === 3) l = t + "\t" + d;
    else if (s === 4) l = t + " | " + p;
    else if (s === 5) l = t + " | " + p + " | " + d + " | " + x;
    else if (s === 6) l = t + " | " + p + " | " + d + " | " + x + " | " + X[r(X.length)];
    else if (s === 7) l = t + " | " + p + " | " + d + " |";
    else l = t + " | " + p + " | " + d;
    out.push(pre[r(pre.length)] + l);
  }
  return out;
}
const GEN = gen(400);
{
  const w = world(), c = w.ctx;
  ok("the generated lines carry no address", GEN.every(l => !/https?:|www\.|\/\//i.test(l)));
  const lines = FIXTURES.concat(GEN);
  const bad = lines.filter(t => J(noId(c.ubParse("acts", t))) !== J(noId(c.ubParse_main("acts", t))));
  ok("ubParse: the " + FIXTURES.length + " fixture pastes and " + GEN.length + " generated lines → the identical items", bad.length === 0, bad.slice(0, 3));
  const big = GEN.join("\n");
  ok("…and all " + GEN.length + " generated lines pasted at once (identical list, same length)", J(noId(c.ubParse("acts", big))) === J(noId(c.ubParse_main("acts", big))) && c.ubParse("acts", big).length === c.ubParse_main("acts", big).length);
  ok("…nothing is held on any of them", lines.every(t => !c.ubParse("acts", t).ubkHeld));
  const pastes = FIXTURES.concat([big, GEN.slice(0, 20).join("\n"), GEN.slice(100, 103).join("\n")]);
  ok("ubMessy: the same answer as before for every one (so the same pastes still go to Claude)", pastes.every(t => c.ubMessy("acts", t) === c.ubMessy_main("acts", t)));
  // typed through + Add, one day per fixture, then Save's record: identical to main's ubRecord
  const w2 = world(), c2 = w2.ctx; const w3 = world({ noBlock: true }), c3 = w3.ctx;
  FIXTURES.concat(GEN.slice(0, 60)).forEach((t, i) => { if (i) { c2.ubDayAdd(); c3.ubDayAdd(); } add(w2, i, t); add(w3, i, t); });
  ok("through + Add on " + c2.ubForm.days.length + " days: the same items as the Builder without the block, the box cleared, no message",
    J(c2.ubForm.days.map(d => noId(d.acts))) === J(c3.ubForm.days.map(d => noId(d.acts))) && !c2.ubForm.msg && !Object.keys(c2.ubForm.ubkLeft || {}).length);
  const rec = c2.ubRecord(c2.ubForm), recMain = c2.ubRecord_main(c2.ubForm);
  ok("Save's record (" + rec.activities.length + " activities, " + rec.track.days.length + " days) is byte-identical to main's ubRecord", J(rec) === J(recMain) && rec.activities.length > 60);
  ok("…every activity is 📓 (no type, no url)", rec.activities.every(a => !("type" in a) && !("url" in a)));
  // the screens: rows and the spread draw exactly as without the block; only the box's hint grows by its optional link
  const hintless = h => h.split("title | points | a line about it | https:// link (optional)").join("title | points | a line about it");
  ok("the four-box screen draws byte-identical to the Builder without the block (bar the box's placeholder, which now names the optional link)", hintless(c2.ubPageHTML()) === c3.ubPageHTML() && c2.ubPageHTML() !== c3.ubPageHTML());
  c2.ubForm.days.forEach(d => d.acts.forEach(a => { a.checked = true; })); c3.ubForm.days.forEach(d => d.acts.forEach(a => { a.checked = true; }));
  ok("the spread screen draws byte-identical (🎨 on every activity)", c2.ubDaysHTML(c2.ubForm) === c3.ubDaysHTML(c3.ubForm) && /\u{1F3A8}/u.test(c2.ubDaysHTML(c2.ubForm)));
}
{
  const w = world(), c = w.ctx;
  const t = WITH_ADDR[0]; const now = noId(c.ubParse("acts", t)), was = noId(c.ubParse_main("acts", t));
  ok("the one fixture paste that carries addresses: the line with the address only inside its words is read as before; a line that IS an address in the title place is held",
    J(now) === J([was[0]]) && was.length === 3 && J(c.ubParse("acts", t).ubkHeld) === J(["https://youtu.be/def – Who lives here?", "ftp://no"]), { now, was });
}

console.log("\n── a line with an https address → 🔗 ──");
{
  const w = world(), c = w.ctx;
  const { r, el } = add(w, 0, "Farm tour | 3 | what a farm grows | https://example.org/farm");
  ok("one item: title, points, the line, type link, the address; the box cleared, no message", r === 1 && J(noId(acts0(w))) === J([{ title: "Farm tour", points: 3, desc: "what a farm grows", type: "link", url: "https://example.org/farm" }]) && el.value === "" && !c.ubForm.msg);
  add(w, 0, "Pumpkin song | | | https://www.youtube.com/watch?v=abc\n| Barn video | 2 | | https://vimeo.com/1 |");
  ok("blank points → 5, blank line → none; a table row with outer pipes works too", J(noId(acts0(w)).slice(1)) === J([{ title: "Pumpkin song", points: 5, desc: "", type: "link", url: "https://www.youtube.com/watch?v=abc" }, { title: "Barn video", points: 2, desc: "", type: "link", url: "https://vimeo.com/1" }]));
  add(w, 0, "Hay ride | 4 | bring a blanket |  https://example.org/hay  ");
  ok("the address is trimmed (uakUrl's rule)", acts0(w)[3].url === "https://example.org/hay");
}
// the after-Save record for the same input: the REAL day editor box (UTADDACT + UACTKIND + UACTLINK), 🔗 picked, tick off
function afterSave(line, url) {
  const writes = []; const dom = { "utaa-harv-d1-line": { value: line }, "utaa-harv-d1-url": { value: url }, "utaa-harv-d1-kidopen": { checked: false }, "uak-harv-d1-box-link": { style: {} } };
  const ctx = { console, JSON, Object, Array, String, Number, Math, Set, Map, RegExp, Date, parseInt, isNaN, isFinite, WeakMap, Promise,
    unitStudies: { harv: { id: "harv", title: "Harvest", enrolled: { k1: true }, decks: [], track: { mode: "seq", perWeek: 4, days: [{ id: "d1", n: 1, t: "Fields" }] } } },
    ROSTER: ["k1"], momHere: () => true, _dryRun: () => false, gwShowToast: () => {}, renderAll: () => {}, document: { getElementById: id => (id in dom) ? dom[id] : null },
    lrSafeUrl: u => /^https:\/\//i.test(String(u || "").trim()) ? String(u).trim() : "",
    db: { ref: p => ({ update: v => writes.push([p, JSON.parse(J(v))]), set: v => writes.push([p, v]) }) } };
  vm.createContext(ctx);
  vm.runInContext(cut("// UNITTRACK_START", "// UNITTRACK_END") + "\n" + cut("// UTADDACT_START", "// UTADDACT_END") + "\n" + KIND + "\n" + LINK, ctx);
  ctx.uakPick("harv-d1", "link"); const okAdd = ctx.utaaAdd("harv", "d1");
  return okAdd && writes.length === 1 ? writes[0][1]["unitStudies/harv/activities/0"] : null;
}
{
  const cases = [["Farm tour | 3 | what a farm grows", "Farm tour | 3 | what a farm grows | https://example.org/farm", "https://example.org/farm"],
    ["Farm tour | 3", "Farm tour | 3 | | https://example.org/farm", "https://example.org/farm"],
    ["Pumpkin song", "Pumpkin song | | | https://www.youtube.com/watch?v=abc", "https://www.youtube.com/watch?v=abc"]];
  cases.forEach(([dayLine, ubLine, url]) => {
    const after = afterSave(dayLine, url);
    const w = world(), c = w.ctx; add(w, 0, ubLine); const u = c.ubRecord(c.ubForm);
    ok("Save's 🔗 record = the day editor's after-Save record, byte for byte (key order too): " + J(u.activities[0]), after && J(u.activities[0]) === J(after), { builder: u.activities[0], after });
    ok("…and the day points at it (nb), as + Add does", J(u.track.days[0].nb) === J({ activity: u.activities[0].key }));
  });
  ok("the 🔗 record holds exactly key, title, emoji 🎨, kind sheet, points, day, desc?, url, type — no kidOpen",
    J(Object.keys(afterSave("Farm tour | 3 | x", "https://example.org/f"))) === J(["key", "title", "emoji", "kind", "points", "day", "desc", "url", "type"]));
}
{
  const w = world(), c = w.ctx; add(w, 0, "Farm tour | 3 | what a farm grows | https://example.org/farm");
  acts0(w)[0].url = "http://example.org/changed";   // an item whose address no longer checks (nothing in the screens can do this; belt and braces)
  const u = c.ubRecord(c.ubForm);
  ok("an item whose address fails uakUrl at Save → a plain 📓 record, as before", !("type" in u.activities[0]) && !("url" in u.activities[0]));
}

console.log("\n── a bad address is held, never dropped ──");
{
  const BAD = ["Farm tour | 3 | a line | http://example.org/farm", "Farm tour | 3 | a line | www.example.org", "Farm tour | 3 | a line | example.org/farm",
    "Farm tour | 3 | a line | javascript:alert(1)", "Farm tour | 3 | a line | https//example.org", "Farm tour | 3 | a line | https:/example.org",
    "Farm tour | 3 | a line | https://", "Farm tour | 3 | a line | https://localhost", "Farm tour | 3 | a line | data:text/html,x", "Farm tour | 3 | a line | //example.org/x"];
  const c = world().ctx;
  const notHeld = BAD.filter(l => { const o = c.ubParse("acts", l); return o.length !== 0 || J(o.ubkHeld) !== J([l]); });
  ok("each of " + BAD.length + " bad addresses in the 4th place: no item, the line held", notHeld.length === 0, notHeld);
  ok("plain words in the 4th place stay ignored, as before", J(noId(c.ubParse("acts", "Farm tour | 3 | a line | with Mom"))) === J([{ title: "Farm tour", points: 3, desc: "a line" }]));
}
{
  const w = world(), c = w.ctx;
  const { r, el } = add(w, 0, "Corn maze | 5 | draw it\nFarm tour | 3 | a line | http://example.org/farm\nHay ride | 2");
  ok("a paste with one bad line: the good two are added, the bad one is not", r === 2 && J(acts0(w).map(a => a.title)) === J(["Corn maze", "Hay ride"]));
  ok("…the box says why, in plain words", /1 line kept in the box: a web address starts with https:\/\/ and goes last/.test(c.ubForm.msg) && c.ubPageHTML().indexOf("kept in the box") > 0);
  const h = c.ubPageHTML(), m = /<textarea id="ub-in-acts-0"[^>]*>([^<]*)<\/textarea>/.exec(h);
  ok("…and the held line is back in the same box, ready to fix (the other boxes stay empty)", m && m[1] === "Farm tour | 3 | a line | http://example.org/farm" && /<textarea id="ub-in-cards-0"[^>]*><\/textarea>/.test(h), m && m[1]);
  add(w, 0, "Farm tour | 3 | a line | https://example.org/farm");
  ok("fixed and + Add again → the 🔗 is added, the box empties, the held line and its why are gone", acts0(w).length === 3 && acts0(w)[2].type === "link" && !c.ubForm.ubkLeft["0"] && !c.ubForm.msg && /<textarea id="ub-in-acts-0"[^>]*><\/textarea>/.test(c.ubPageHTML()));
  add(w, 0, "x | 1 | y | www.example.org");
  ok("a held line with < & \" in it is escaped in the box", (() => { c.ubForm.ubkLeft["0"] = 'a <b> & "q" | 1 | y | www.x.org'; return c.ubPageHTML().indexOf('a &lt;b&gt; &amp; &quot;q&quot; | 1 | y | www.x.org</textarea>') > 0; })());
}
{
  const w = world(), c = w.ctx; c.ubSet("mode", "boxes"); c.ubGo("fill");
  add(w, null, "Farm tour | 3 | a line | www.example.org");
  ok("the four-box mode (one box for the whole unit) holds the same way", c.ubForm.boxes.acts.length === 0 && /<textarea id="ub-in-acts-all"[^>]*>Farm tour \| 3 \| a line \| www\.example\.org<\/textarea>/.test(c.ubPageHTML()));
}

console.log("\n── an address in the wrong column ──");
{
  const c = world().ctx;
  const WRONG = ["Farm tour | 3 | https://example.org/farm", "Farm tour | https://example.org/farm | a line", "https://example.org/farm | 3 | a line",
    "Farm tour | 3 | a line | | https://example.org/farm", "Farm tour – https://example.org/farm", "Farm tour: www.example.org", "https://example.org/farm"];
  const notHeld = WRONG.filter(l => { const o = c.ubParse("acts", l); return o.length !== 0 || !o.ubkHeld; });
  ok("an address standing alone in the title, points, line or a 5th place (piped or not) → held, not read as words", notHeld.length === 0, notHeld);
  ok("…before, each of those was silently read as an activity (a title or line that is an address, or the address lost)", WRONG.every(l => c.ubParse_main("acts", l).length === 1));
  ok("an address inside a sentence in the line stays words, as before", J(noId(c.ubParse("acts", "Farm tour | 3 | look at https://example.org first"))) === J(noId(c.ubParse_main("acts", "Farm tour | 3 | look at https://example.org first"))));
}

console.log("\n── Claude never sees a paste with an address ──");
(async () => {
  {
    const w = world({ key: true }), c = w.ctx;
    const t = "Corn maze\nFarm tour | 3 | a line | https://example.org/farm";
    ok("a two-line paste, one line without | — before: sent to Claude (the address would be lost); now: read here", c.ubMessy_main("acts", t) === true && c.ubMessy("acts", t) === false);
    add(w, 0, t); await new Promise(r => setTimeout(r, 0));
    ok("…both lines added here, the 🔗 kept, nothing asked", w.asks.length === 0 && J(noId(acts0(w))) === J([{ title: "Corn maze", points: 5, desc: "" }, { title: "Farm tour", points: 3, desc: "a line", type: "link", url: "https://example.org/farm" }]));
    add(w, 0, "Corn maze\nHay ride – bring a blanket\nFarm tour | 3 | a line | http://example.org/farm");
    ok("…a paste with a held line stays here too: two added, one held", w.asks.length === 0 && acts0(w).length === 4 && c.ubForm.ubkLeft["0"] === "Farm tour | 3 | a line | http://example.org/farm");
  }
  {
    const w = world({ key: true }); add(w, 0, "Corn maze\nHay ride | 2 | bring a blanket"); await new Promise(r => setTimeout(r, 0));
    ok("a messy paste with no address still goes to Claude, as before", w.asks.length === 1);
  }
  {
    const w = world({ key: true }), c = w.ctx; add(w, 0, "Farm tour | 3 | a line | www.example.org");
    const held = c.ubForm.ubkLeft["0"]; add(w, 0, "Corn maze\nHay ride | 2 | bring a blanket"); await new Promise(r => setTimeout(r, 0));
    ok("a held line, then Mom pastes something else that goes to Claude → the old held line does not come back into the box", held && w.asks.length === 1 && !c.ubForm.ubkLeft["0"] && /<textarea id="ub-in-acts-0"[^>]*><\/textarea>/.test(c.ubPageHTML()));
  }

  console.log("\n── the screens ──");
  {
    const w = world(), c = w.ctx; add(w, 0, "Farm tour | 3 | what a farm grows | https://example.org/farm\nCorn maze | 5 | draw it");
    const h = c.ubPageHTML();
    const rowOf = id => { const i = h.indexOf('data-ub-item="' + id + '"'); return h.slice(i, h.indexOf("</button></div>", i)); };
    const r1 = rowOf(acts0(w)[0].id), r2 = rowOf(acts0(w)[1].id);
    ok("the box's 🔗 row shows the Units page's own chip (🔗 Web link) and the address", r1.indexOf('data-uak-chip="link"') > 0 && r1.indexOf("\u{1F517} Web link") > 0 && r1.indexOf(">https://example.org/farm</span>") > 0);
    ok("…a 📓 row shows no chip", r2.indexOf("data-uak-chip") < 0 && r2.indexOf("data-ubk-link") < 0);
    const row = c.ubkRowHTML(acts0(w)[0]); const tags = s => (row.match(new RegExp("<" + s + "[ >]", "g")) || []).length;
    ok("the chip row's HTML is balanced", tags("span") === (row.match(/<\/span>/g) || []).length && tags("span") === 3);
    ok("phone width: the address line wraps to its own row and ellipsizes, never widens the row", /flex:1 1 100%;min-width:0/.test(row) && /overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0/.test(row));
    ok("an address with a quote or < is escaped", c.ubkRowHTML({ type: "link", url: 'https://x.org/"<a>' }).indexOf("https://x.org/&quot;&lt;a&gt;") > 0);
    ok("the acts box's placeholder names the optional link; the other boxes' placeholders are unchanged",
      h.indexOf('placeholder="title | points | a line about it | https:// link (optional)"') > 0 && h.indexOf('placeholder="link | label"') > 0 && h.indexOf('placeholder="title | by | link"') > 0);
    const ids = (h.match(/\sid="[^"]+"/g) || []); ok("no duplicate element ids on the screen", ids.length > 3 && new Set(ids).size === ids.length);
    c.ubDayAdd(); add(w, 1, "Barn video | 2 | | https://vimeo.com/1");
    const h2 = c.ubPageHTML(), ids2 = (h2.match(/\sid="[^"]+"/g) || []); ok("…nor with two days of boxes", new Set(ids2).size === ids2.length);
    const d = c.ubDaysHTML(c.ubForm);
    ok("the spread shows 🔗 for a link activity and 🎨 for a notebook one", /<span>\u{1F517}<\/span><span[^>]*>Farm tour<\/span>/u.test(d) && /<span>\u{1F3A8}<\/span><span[^>]*>Corn maze<\/span>/u.test(d));
    c.ubSet("mode", "boxes"); c.ubGo("fill"); add(w, null, "Zoo trip | 10 | | https://example.org/zoo\nAnimal mask | 5"); c.ubSet("nDays", "6"); c.ubGo("days");
    const z = c.ubForm.days.flatMap(x => x.acts).find(a => a.title === "Zoo trip");
    ok("a 🔗 from the one-box mode keeps its type and address through the spread", z && z.type === "link" && z.url === "https://example.org/zoo");
  }

  console.log("\n── Save: one transaction, Mom only, dry run inert ──");
  {
    const w = world(), c = w.ctx; add(w, 0, "Farm tour | 3 | what a farm grows | https://example.org/farm"); c.ubGo("check");
    const u = c.ubSave();
    ok("Save → ONE transaction on unitStudies/<id>, no other write; the record carries the 🔗", w.tx.length === 1 && w.writes.length === 0 && w.tx[0][0] === "unitStudies/farms" && w.tx[0][1].activities[0].type === "link" && w.tx[0][1].activities[0].url === "https://example.org/farm" && u.id === "farms");
    ok("…no kidOpen anywhere in it (Mom ticks that on the day, after Save)", J(w.tx[0][1]).indexOf("kidOpen") < 0);
  }
  {
    const w = world({ dry: true }), c = w.ctx; add(w, 0, "Farm tour | 3 | a | https://example.org/farm"); c.ubGo("check"); const u = c.ubSave();
    ok("dry run: nothing written, the record still built (and the toast says dry run)", w.tx.length === 0 && w.writes.length === 0 && u && u.activities[0].type === "link" && /dry run/.test(w.toasts.join(" ")));
  }
  {
    const w = world({ mom: false }), c = w.ctx;
    ok("not Mom: the Builder is not drawn and Save does nothing", c.ubOpenHTML() === "" && c.ubSave() === null && w.tx.length === 0 && w.writes.length === 0);
  }

  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})();
