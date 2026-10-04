// 🧠 Family-time item → each kid's own drills (FAM_DRILLS block, her ask 2026-10-04: "linked to their shared
// time … with a button to point them to the right drills"). DeWalt's Fact Review: Andrew + Kenzie quiz each
// other; Andrew's card opens his ➕ session, Kenzie's her ✖️ one.
//  · items[i].study[kid] = "drill" | "s:<sid>"; nothing set → no button (every other family block unchanged);
//  · the button names the session; a deleted session falls back to Drills; done cards hide it;
//  · Mom's picker writes ONE leaf (config/rules/familyBlocks/<b>/items/<i>/study/<kid>) and rejects junk.
// UNITS_SRC=<path> runs it against another copy of index.html.
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(process.env.UNITS_SRC || path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name); } }
const a = src.indexOf("// FAM_DRILLS_START"), b = src.indexOf("// FAM_DRILLS_END");
ok("FAM_DRILLS block present", a > 0 && b > a);
const block = src.slice(a, b);
const BLOCK_ID = "fbmut07y5c", ITEM = "imut07y5h";
function world(study, sessions) {
  const G = { writes: [], go: [] };
  const defs = { [BLOCK_ID]: { name: "Fact Review", items: [{ key: ITEM, name: "Fact Review", minutes: 15, from: { andrew: "fact_review_with_kenzie", makenzie: "fact_review_with_andrew" }, study }] } };
  const api = new Function("G", "defs", "sessions", `
    function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;"); }
    function cap(s){ return s[0].toUpperCase()+s.slice(1); }
    function famDefs(){ return defs; } function famList(x){ return Array.isArray(x)?x:Object.values(x||{}); }
    function famItemOf(t){ const bb=defs[t.famBlock]; return bb?famList(bb.items).find(function(it){ return it.key===t.famItem; }):null; }
    function famItems(id){ return famList(defs[id].items).map(function(x){ return Object.assign({},x); }); }
    function famWrite(p,v){ G.writes.push([p,v]); return true; }
    function mstSessions(k){ return sessions[k]||[]; }
    function retrSchedGo(k,view,sid){ G.go.push([k,view,sid]); }
    ${block}
    return { famDrillPick, famDrillBtnHTML, famOpenDrills, famItemStudy, famDrillEditorHTML };`)(G, defs, sessions || {});
  api.G = G; return api;
}
const card = kid => ({ famBlock: BLOCK_ID, famItem: ITEM, who: kid });
const SESS = { andrew: [{ sid: "fact_study", name: "Fact Study", emoji: "➕" }], makenzie: [{ sid: "fs", name: "Fact Study", emoji: "✖️" }] };
{ const w = world(undefined, SESS);
  ok("nothing set → no button (other blocks unchanged)", w.famDrillBtnHTML(card("andrew"), true) === ""); }
{ const w = world({ andrew: "s:fact_study", makenzie: "s:fs" }, SESS);
  const h = w.famDrillBtnHTML(card("andrew"), true);
  ok("Andrew's card: 🧠 Open ➕ Fact Study", /🧠|\u{1F9E0}/u.test(h) && /Open ➕ Fact Study/.test(h));
  ok("Kenzie's card: her own ✖️ session", /Open ✖️ Fact Study/.test(w.famDrillBtnHTML(card("makenzie"), true)));
  w.famOpenDrills(BLOCK_ID, ITEM, "andrew"); w.famOpenDrills(BLOCK_ID, ITEM, "makenzie");
  ok("tap → each kid's own study session", JSON.stringify(w.G.go) === JSON.stringify([["andrew", "study", "fact_study"], ["makenzie", "study", "fs"]]));
  ok("button can't bubble into the card tap", /event\.stopPropagation\(\);famOpenDrills\('fbmut07y5c','imut07y5h','andrew'\)/.test(h)); }
{ const w = world({ andrew: "drill" }, SESS);
  ok("'drill' → Open my drills / Andrew’s drills", /Open my drills/.test(w.famDrillBtnHTML(card("andrew"), true)) && /Open Andrew’s drills/.test(w.famDrillBtnHTML(card("andrew"), false)));
  w.famOpenDrills(BLOCK_ID, ITEM, "andrew"); ok("tap → Drills view", JSON.stringify(w.G.go[0]) === JSON.stringify(["andrew", "drill", undefined])); }
{ const w = world({ andrew: "s:gone" }, SESS);
  w.famOpenDrills(BLOCK_ID, ITEM, "andrew");
  ok("deleted session → falls back to Drills", JSON.stringify(w.G.go[0]) === JSON.stringify(["andrew", "drill", undefined]) && /drills/.test(w.famDrillBtnHTML(card("andrew"), true))); }
{ const w = world(undefined, SESS);
  w.famItemStudy(BLOCK_ID, 0, "andrew", "s:fact_study"); w.famItemStudy(BLOCK_ID, 0, "makenzie", "drill"); w.famItemStudy(BLOCK_ID, 0, "andrew", ""); w.famItemStudy(BLOCK_ID, 0, "andrew", "javascript:x");
  ok("picker writes one leaf per kid; none/junk clear it", JSON.stringify(w.G.writes) === JSON.stringify([[BLOCK_ID + "/items/0/study/andrew", "s:fact_study"], [BLOCK_ID + "/items/0/study/makenzie", "drill"], [BLOCK_ID + "/items/0/study/andrew", null], [BLOCK_ID + "/items/0/study/andrew", null]]));
  w.famItemStudy(BLOCK_ID, 5, "andrew", "drill"); ok("bad item index → no write", w.G.writes.length === 4); }
{ const w = world({ andrew: "s:fact_study" }, SESS);
  const it = { key: ITEM, study: { andrew: "s:fact_study" } };
  const h = w.famDrillEditorHTML(BLOCK_ID, it, 0, true, ["andrew", "makenzie"]);
  ok("editor: a picker per kid with none / Drills / each session", (h.match(/<select/g) || []).length === 2 && /<option value="s:fact_study" selected>➕ Fact Study/.test(h) && /<option value="drill">Drills \(all decks\)/.test(h));
  ok("editor read-only for kids", !/<select/.test(w.famDrillEditorHTML(BLOCK_ID, it, 0, false, ["andrew"])) && /Andrew: ➕ Fact Study/.test(w.famDrillEditorHTML(BLOCK_ID, it, 0, false, ["andrew"]))); }
// wiring in the real file
ok("card row appends the button only while not done", /\(\(!done&&typeof famDrillBtnHTML==="function"\)\?famDrillBtnHTML\(t,me\):''\)/.test(src));
ok("editor row sits in the item editor (kids = from-keys or item kids)", /famDrillEditorHTML\(id,it,i,ed,it\.from\?Object\.keys\(it\.from\):iks\)/.test(src));
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
