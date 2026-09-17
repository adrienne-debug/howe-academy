// 🔁 Learning pattern + ⌨️ typed-answer check (study sessions). Extracts MST_ENGINE from index.html.
const fs = require("fs"), path = require("path");

const SRC_PATH = process.env.MST_SRC || path.join(__dirname, "index.html");
const src = fs.readFileSync(SRC_PATH, "utf8");
const startMarker = "// ── MST_ENGINE_START ──";
const endMarker = "// ── MST_ENGINE_END ──";
const si = src.indexOf(startMarker);
const ei = src.indexOf(endMarker);
if (si === -1 || ei === -1) throw new Error("markers not found in " + SRC_PATH);
const block = src.slice(si, ei);

const stubs = `
var masteryData = {};
var masteryKid = null;

var MAST_TIER_ORDER = ["daily","every_other_day","every_third_day","weekly","bi_weekly","monthly","learned","graduated"];
var MAST_TIER_INT = {daily:1,every_other_day:2,every_third_day:3,weekly:7,bi_weekly:14,monthly:28,learned:60,graduated:null};

function mastDrillSettings(){
  const kid = masteryKid || "julian";
  const s = masteryData[kid+"_settings"] || {};
  const defaultLadder = ["every_other_day","weekly","bi_weekly","monthly","graduated"];
  return { ladder: s.ladder || defaultLadder };
}

function mastIsDue(item, pn){
  const iv = MAST_TIER_INT[item.tier || "daily"];
  if (iv == null) return false;
  if (item.next_due != null && iv > 1) return pn >= item.next_due;
  const cy = item.cycle || 1;
  return (pn - 1) % iv === (cy - 1) % iv;
}

function mastIsParked(i){ return !!(i && i.status === "parked"); }

function mastIsNeverDrill(item){
  const kt = item && item.knowledge_type;
  return kt === "concept" || kt === "transfer";
}

function mastFullBank(kidArg){
  const kid = kidArg || masteryKid || "julian";
  const base = {};
  const builtIn = (masteryData.__banks && masteryData.__banks[kid]) || {};
  Object.keys(builtIn).forEach(k => { base[k] = builtIn[k].slice(); });
  let custom = masteryData[kid+"_custom_items"] || [];
  if (!Array.isArray(custom)) custom = Object.values(custom);
  custom.forEach(ci => {
    if (!ci) return;
    if (!base[ci.cat]) base[ci.cat] = [];
    if (base[ci.cat].indexOf(ci.name) === -1) base[ci.cat].push(ci.name);
  });
  return base;
}
`;


const factory = new Function(stubs + block + `
return { mstSessions, mstSittingInit, mstSerialize, mstRestore, mstAnswer, mstCurrent, mstOutcomes,
  mstPatternClean, mstPatternMode, mstNormAns, mstTypedOk,
  setMasteryData(d){ masteryData = d; } };
`);
const M = factory();
let pass = 0, fail = 0;
function ok(cond, label) { if (cond) { pass++; console.log("PASS " + label); } else { fail++; console.log("FAIL " + label); } }
const P5 = ["rec","rec","say","say","type"];

// pattern → mode
ok(M.mstPatternMode(null, 2, 5) === "rec", "no pattern = rec");
ok(M.mstPatternMode(["bogus"], 0, 5) === "rec", "junk pattern = rec");
ok([0,1,2,3,4].map(d => M.mstPatternMode(P5, d, 5)).join() === "rec,rec,say,say,type", "5 slots, 5 dots = slot by dots");
ok([0,1,2].map(d => M.mstPatternMode(P5, d, 3)).join() === "rec,say,type", "5 slots stretched to 3 dots: first, middle, last");
ok(M.mstPatternMode(P5, 6, 7) === "type" && M.mstPatternMode(P5, 0, 7) === "rec", "7 dots: first rec, last type");
ok(M.mstPatternMode(P5, 0, 1) === "rec", "1 dot uses slot 1");
ok(M.mstPatternMode(P5, 9, 5) === "type" && M.mstPatternMode(P5, -3, 5) === "rec", "dots clamp into range");
ok(JSON.stringify(M.mstPatternClean(["rec","x","type"])) === '["rec","type"]', "clean drops unknown modes");

// typed check
const T = (a, b) => M.mstTypedOk(a, b);
ok(T("das Papier", "das Papier"), "exact");
ok(T("  DAS papier ", "das Papier"), "case + spaces ignored");
ok(T("Tschues", "Tschüs") && T("tschüs", "Tschüs"), "ue = ü");
ok(T("die Strasse", "die Straße"), "ss = ß");
ok(T("Wie gehts", "Wie geht’s?") && T("wie geht's?", "Wie geht’s?"), "apostrophes + ? ignored");
ok(T("Gut danke", "Gut, danke"), "comma ignored");
ok(T("wie komme ich zum/zur X", "wie komme ich zum⁄zur X?"), "fraction slash = slash");
ok(!T("Papier", "das Papier"), "missing article = miss");
ok(!T("die Papier", "das Papier"), "wrong article = miss");
ok(!T("", "das Papier") && !T("   ", "das Papier"), "blank never passes");
ok(!T("das Papir", "das Papier"), "misspelling = miss");

// sessions carry the pattern; sitting init tags learning/new cards by dots
M.setMasteryData({ lincoln_sessions: { german: { name: "German", decks: ["German"], passes: 3, pattern: P5 }, plain: { name: "Plain", decks: ["X"] } } });
const S = M.mstSessions("lincoln");
const ger = S.find(s => s.sid === "german"), plain = S.find(s => s.sid === "plain");
ok(JSON.stringify(ger.pattern) === JSON.stringify(P5), "mstSessions passes pattern through");
ok(plain.pattern === null, "no pattern = null");
const pile = {
  reviews: [{ id: "r1", subject: "German", prompt: "der Hund", tier: "every_other_day" }],
  learning: [{ id: "l1", subject: "German", prompt: "das Papier", tally_dots: 1 }, { id: "l3", subject: "German", prompt: "der Wind", tally_dots: 4 }],
  newNames: [{ deck: "German", name: "Hallo" }]
};
const st = M.mstSittingInit(pile, ger, { dotsNeeded: () => 5 });
ok(st.cards["l:l1"].mode === "rec", "1 dot → slot 2 = rec");
ok(st.cards["l:l3"].mode === "type", "4 dots → slot 5 = type");
ok(st.cards["n:German|Hallo"].mode === "rec", "new card → slot 1 = rec");
ok(st.cards["r:r1"].mode === undefined, "reviews untouched in slice 1");
const st3 = M.mstSittingInit(pile, ger, { dotsNeeded: () => 3 });
ok(st3.cards["l:l1"].mode === "say" && st3.cards["l:l3"].mode === "type", "3-dot deck stretches the pattern");
const stP = M.mstSittingInit(pile, plain, { dotsNeeded: () => 5 });
ok(Object.values(stP.cards).every(c => c.mode === undefined), "session without pattern: no modes (byte-identical cards)");
const st0 = M.mstSittingInit(pile, ger);
ok(st0.cards["l:l3"].mode === "type", "no opts → assumes 5 dots");
const rt = M.mstRestore(M.mstSerialize(st));
ok(rt.cards["l:l3"].mode === "type", "mode survives serialize/restore (Resume)");
// passes still apply to typed cards
let s2 = M.mstSittingInit({ reviews: [], learning: [pile.learning[1]], newNames: [] }, ger, { dotsNeeded: () => 5 });
M.mstAnswer(s2, "l:l3", "good"); M.mstAnswer(s2, "l:l3", "again"); M.mstAnswer(s2, "l:l3", "good"); M.mstAnswer(s2, "l:l3", "good");
ok(!s2.cards["l:l3"].done, "again resets goods on a typed card");
M.mstAnswer(s2, "l:l3", "good");
ok(s2.cards["l:l3"].done && M.mstOutcomes(s2).shownIds[0] === "l3", "3 typed goods → done → one dot, same as today");

console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
