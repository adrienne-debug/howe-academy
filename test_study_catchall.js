// 📚 Daily Study catch-all (kind:"all") — ownership tests. Runs against mst_engine.js or, with
// MST_SRC=index.html, against the real app file. No deps.
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
`;
const E = new Function(stubs + block + `; return {mstSessions,mstOwns,mstOwnedIds,mstMixOwns,mstTierIdx,mstPile,
  set:d=>{ masteryData=d; }, get:()=>masteryData};`)();

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n); } };
const LADDER = ["every_other_day", "weekly", "bi_weekly", "monthly", "graduated"];

function world(sessions, extraItems) {
  return {
    lincoln: [
      { id: "g1", subject: "German", status: "introduction", tier: "daily", prompt: "der Hund" },
      { id: "g2", subject: "German", status: "active", tier: "every_other_day", next_due: 1 },
      { id: "s1", subject: "Spelling", status: "introduction", tier: "daily", prompt: "which" },
      { id: "s2", subject: "Spelling", status: "active", tier: "weekly", next_due: 1 },
      { id: "s3", subject: "Spelling", status: "active", tier: "monthly", next_due: 1 },
      { id: "p1", subject: "Phonograms", status: "introduction", tier: "daily", prompt: "ough" },
      { id: "x1", subject: "OnlyItems", status: "introduction", tier: "daily", prompt: "no bank entry" },
      { id: "pk", subject: "Spelling", status: "parked", tier: "daily" },
      { id: "cn", subject: "Spelling", status: "active", tier: "weekly", next_due: 1, knowledge_type: "concept" }
    ].concat(extraItems || []),
    lincoln_custom_items: [{ cat: "German", name: "die Katze" }, { cat: "Spelling", name: "there" }, { cat: "Empty", name: "unstarted" }],
    lincoln_settings: { ladder: LADDER },
    lincoln_sessions: sessions
  };
}
const ALL = { name: "Daily Study", emoji: "📚", kind: "all", who: "solo", mixInAt: "weekly", handOffAt: "bi_weekly" };

console.log("# derived decks");
E.set(world({ ds: ALL }));
let s = E.mstSessions("lincoln").find(x => x.sid === "ds");
ok("claims every deck, from the bank AND from item subjects", JSON.stringify(s.decks) === JSON.stringify(["Empty", "German", "OnlyItems", "Phonograms", "Spelling"]));
ok("decks are sorted", JSON.stringify(s.decks) === JSON.stringify([...s.decks].sort()));

E.set(world({ ger: { name: "German", kind: "deck", decks: ["German"], mixInAt: "weekly", handOffAt: "bi_weekly" }, ds: ALL }));
s = E.mstSessions("lincoln").find(x => x.sid === "ds");
ok("a named session's deck is not double-claimed", s.decks.indexOf("German") === -1 && s.decks.indexOf("Spelling") >= 0);

E.set(world({ ds: Object.assign({}, ALL, { skipDecks: ["Phonograms"] }) }));
s = E.mstSessions("lincoln").find(x => x.sid === "ds");
ok("skipDecks (learn with Mom) removes a deck", s.decks.indexOf("Phonograms") === -1 && s.decks.indexOf("Spelling") >= 0);
ok("skipDecks is returned for the UI", JSON.stringify(s.skipDecks) === JSON.stringify(["Phonograms"]));
E.set(world({ ds: ALL }));
ok("missing skipDecks is safe", Array.isArray(E.mstSessions("lincoln")[0].skipDecks));

console.log("# ownership");
E.set(world({ ds: ALL }));
let owned = E.mstOwnedIds("lincoln");
ok("learning cards leave Mom's drill", owned.has("g1") && owned.has("s1") && owned.has("p1") && owned.has("x1"));
ok("a below-mix-in review is owned", owned.has("g2"));
ok("a card at hand-off stays with Mom", !owned.has("s3"));
ok("a weekly card with no Daily Mix stays with Mom", !owned.has("s2"));
ok("parked is never owned", !owned.has("pk"));
ok("never-drill is never owned", !owned.has("cn"));

E.set(world({ ds: Object.assign({}, ALL, { skipDecks: ["Phonograms"] }) }));
owned = E.mstOwnedIds("lincoln");
ok("a kept-with-Mom deck's learning card stays with Mom", !owned.has("p1") && owned.has("s1"));

console.log("# regression: no catch-all changes nothing");
E.set(world({}));
ok("no sessions → nothing owned", E.mstOwnedIds("lincoln").size === 0);
E.set(world({ ger: { name: "German", kind: "deck", decks: ["German"], mixInAt: "weekly", handOffAt: "bi_weekly" } }));
owned = E.mstOwnedIds("lincoln");
ok("named session only → other decks untouched", owned.has("g1") && !owned.has("s1") && !owned.has("p1"));

console.log("# all three kinds together");
E.set(world({ ger: { name: "German", kind: "deck", decks: ["German"], mixInAt: "weekly", handOffAt: "bi_weekly" }, ds: ALL, mix: { name: "Daily Mix", kind: "mix" } }));
const sessions = E.mstSessions("lincoln");
const items = E.get().lincoln;
owned = E.mstOwnedIds("lincoln");
let partitionOk = true, why = "";
items.forEach(i => {
  if (i.status === "parked" || i.knowledge_type === "concept") return;
  const deckOwned = sessions.some(x => E.mstOwns(x, i, LADDER));
  const mixOwned = E.mstMixOwns(sessions, i, LADDER);
  const mom = !deckOwned && !mixOwned;
  const n = (deckOwned ? 1 : 0) + (mixOwned ? 1 : 0) + (mom ? 1 : 0);
  if (n !== 1) { partitionOk = false; why = i.id + " owned by " + n; }
  if (deckOwned || mixOwned) { if (!owned.has(i.id)) { partitionOk = false; why = i.id + " missing from mstOwnedIds"; } }
});
ok("every card has exactly one owner across deck/catch-all/mix/Mom" + (why ? " (" + why + ")" : ""), partitionOk);
ok("the mix now takes the weekly Spelling card", E.mstMixOwns(sessions, items.find(i => i.id === "s2"), LADDER));
ok("the monthly card still belongs to Mom", !E.mstMixOwns(sessions, items.find(i => i.id === "s3"), LADDER) && !owned.has("s3"));

console.log("# the catch-all's pile");
const pile = E.mstPile("lincoln", "ds", 1, null);
ok("pile has the catch-all's learning cards", pile.learning.some(i => i.id === "s1") && pile.learning.some(i => i.id === "p1"));
ok("pile excludes a named session's deck", !pile.learning.some(i => i.id === "g1"));
ok("pile offers new cards from the catch-all's decks", pile.newNames.some(n => n.deck === "Empty" || n.deck === "Spelling"));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
