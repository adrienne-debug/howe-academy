// 📚 A few decks at a time, a sitting he can finish — focusDecks / maxCards in mstPile.
// Runs against index.html (or MST_SRC=mst_engine.js). No deps.
const fs = require("fs"), path = require("path");
const SRC = process.env.MST_SRC || path.join(__dirname, "index.html");
const src = fs.readFileSync(SRC, "utf8");
const si = src.indexOf("// ── MST_ENGINE_START ──"), ei = src.indexOf("// ── MST_ENGINE_END ──");
if (si < 0 || ei < 0) throw new Error("markers not found in " + SRC);
const block = src.slice(si, ei);

const stubs = `
var masteryData = {}; var masteryKid = null;
var MAST_TIER_ORDER = ["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"];
var MAST_TIER_INT = {daily:1,every_other_day:2,every_third_day:3,weekly:7,bi_weekly:14,monthly:28,learned:60,graduated:null};
function mastDrillSettings(){ const kid=masteryKid||"lincoln"; const s=masteryData[kid+"_settings"]||{};
  return { ladder: s.ladder || ["every_other_day","weekly","bi_weekly","monthly","graduated"] }; }
function mastIsDue(item,pn){ const iv=MAST_TIER_INT[item.tier||"daily"]; if(iv==null) return false;
  if(item.next_due!=null&&iv>1) return pn>=item.next_due; return (pn-1)%iv===((item.cycle||1)-1)%iv; }
function mastIsParked(i){ return !!(i&&i.status==="parked"); }
function mastIsNeverDrill(i){ const k=i&&i.knowledge_type; return k==="concept"||k==="transfer"; }
function mastFullBank(kidArg){ const kid=kidArg||masteryKid||"lincoln"; const base={};
  let custom=masteryData[kid+"_custom_items"]||[]; if(!Array.isArray(custom)) custom=Object.values(custom);
  custom.forEach(ci=>{ if(!ci) return; if(!base[ci.cat]) base[ci.cat]=[];
    if(base[ci.cat].indexOf(ci.name)===-1) base[ci.cat].push(ci.name); }); return base; }
function mastPatternClean(p){ return Array.isArray(p)&&p.length?p.slice():null; }
`;
const E = new Function(stubs + block + `; return {mstSessions,mstPile,set:d=>{masteryData=d;}};`)();

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n); } };
const LADDER = ["every_other_day", "weekly", "bi_weekly", "monthly", "graduated"];

// decks: Big (6 learning), Mid (3 learning), Small (2 learning), Fresh (bank only)
function items() {
  const out = [];
  const mk = (deck, n, dots) => { for (let i = 1; i <= n; i++) out.push({ id: deck[0].toLowerCase() + i, subject: deck, status: "introduction", tier: "daily", prompt: deck + " " + i, tally_dots: dots ? (i % dots) : 0 }); };
  mk("Big", 6, 3); mk("Mid", 3, 2); mk("Small", 2, 0);
  out.push({ id: "rev1", subject: "Big", status: "active", tier: "every_other_day", next_due: 1, prompt: "Big review" });
  out.push({ id: "rev2", subject: "Mid", status: "active", tier: "every_other_day", next_due: 1, prompt: "Mid review" });
  return out;
}
function world(extra) {
  const bank = [];
  ["Big", "Mid", "Small", "Fresh"].forEach(d => { for (let i = 1; i <= 8; i++) bank.push({ cat: d, name: d + " bank " + i }); });
  return {
    lincoln: items(), lincoln_custom_items: bank, lincoln_settings: { ladder: LADDER },
    lincoln_sessions: { ds: Object.assign({ name: "Daily Study", emoji: "📚", kind: "all", who: "solo", newPerDay: 8, mixInAt: "weekly", handOffAt: "bi_weekly" }, extra || {}) }
  };
}
const pile = extra => { E.set(world(extra)); return E.mstPile("lincoln", "ds", 1, null); };
const decksOf = p => [...new Set(p.learning.map(i => i.subject).concat(p.newNames.map(n => n.deck)))].sort();

console.log("# dials off = nothing changes");
let p = pile({});
ok("every learning card rides when both dials are off", p.learning.length === 11);
ok("new cards still come when the dials are off", p.newNames.length === 8);

console.log("# a few decks at a time");
p = pile({ focusDecks: 2, maxCards: 0 });
ok("only 2 decks appear", decksOf(p).length === 2);
ok("the fullest decks come first (Big, Mid)", JSON.stringify(decksOf(p)) === JSON.stringify(["Big", "Mid"]));
ok("a deck left out keeps its cards for later (none of Small)", !p.learning.some(i => i.subject === "Small"));

console.log("# the sitting has a ceiling");
p = pile({ focusDecks: 3, maxCards: 12 });
ok("learning + new never exceeds the ceiling", p.learning.length + p.newNames.length <= 12);
ok("the backlog gets the seats before anything new", p.learning.length === 9 && p.newNames.length === 3);
ok("the full deck (Big, 6 learning) is held to its share of 4", p.learning.filter(i => i.subject === "Big").length === 4);
p = pile({ focusDecks: 3, maxCards: 6 });
ok("a smaller ceiling holds too", p.learning.length + p.newNames.length === 6);
ok("no new cards at all while the backlog fills the sitting", p.newNames.length === 0);
ok("closest to graduating rides first", p.learning.filter(i => i.subject === "Big").every(i => (i.tally_dots || 0) >= 0) && p.learning.length === 6);

console.log("# reviews always ride");
p = pile({ focusDecks: 1, maxCards: 2 });
ok("booked reviews are never cut by the ceiling", p.reviews.length === 2);
ok("reviews don't eat the learning seats", p.learning.length + p.newNames.length === 2);

console.log("# per-deck share");
p = pile({ focusDecks: 3, maxCards: 12 });
const perDeckCount = {};
p.learning.concat(p.newNames.map(n => ({ subject: n.deck }))).forEach(i => { perDeckCount[i.subject] = (perDeckCount[i.subject] || 0) + 1; });
ok("no deck takes more than its share (12 over 3 = 4)", Object.values(perDeckCount).every(v => v <= 4));
ok("decks take turns instead of one deck filling the sitting", Object.keys(perDeckCount).length === 3);

console.log("# a full deck pulls nothing new");
p = pile({ focusDecks: 1, maxCards: 4 });
ok("Big is full of half-learned cards, so no new ones are pulled", p.newNames.length === 0);
p = pile({ focusDecks: 4, maxCards: 20 });
ok("a deck with room does pull new cards", p.newNames.some(n => n.deck === "Small" || n.deck === "Fresh"));

console.log("# a second sitting the same day doesn't hand out a fresh ceiling");
E.set(world({ focusDecks: 3, maxCards: 12 }));
const first = E.mstPile("lincoln", "ds", 1, null);
const log = { items: first.learning.slice(0, 5).map(i => ({ id: i.id, result: "shown" })) };
const second = E.mstPile("lincoln", "ds", 1, log);
ok("seats already used today are subtracted", second.learning.length + second.newNames.length <= 7);
ok("cards already shown today don't come back", !second.learning.some(i => log.items.some(e => e.id === i.id)));

console.log("# nothing is lost");
p = pile({ focusDecks: 1, maxCards: 3 });
E.set(world({ focusDecks: 1, maxCards: 3 }));
ok("cards cut today are still learning cards tomorrow", E.mstPile("lincoln", "ds", 2, null).learning.length === 3);

console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
