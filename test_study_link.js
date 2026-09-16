// 📚 Study sessions on the schedule (slice 3): a subject linked to a study session deep-links its
// task card to the kid's Study view with that session selected, the card shows today's pile, and
// the subject sheets carry the "Study session" picker. Extracts taskDeepLinkView / taskDeepLinkLabel /
// retrSchedGo by brace-matching and runs them over stubs; the sheet/card markup is regex-checked.
const fs = require("fs"), path = require("path"), assert = require("assert");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL- " + name); } }
function extract(startPat) {
  const i = src.indexOf("\n" + startPat); if (i < 0) throw new Error("not found: " + startPat);
  let depth = 0, inS = null, seen = false, k = i + 1;
  for (; k < src.length; k++) { const c = src[k], p = src[k - 1];
    if (inS) { if (c === inS && p !== "\\") inS = null; continue; }
    if (c === '"' || c === "'" || c === "`") { inS = c; continue; }
    if (c === "/" && src[k + 1] === "/") { k = src.indexOf("\n", k) - 1; continue; }
    if (c === "{" || c === "[" || c === "(") { depth++; seen = true; } else if (c === "}" || c === "]" || c === ")") depth--;
    else if (c === "\n" && depth === 0 && seen) break; }
  return src.slice(i + 1, k + 1);
}
const code = ["function taskDeepLinkView(", "function taskDeepLinkLabel(", "function retrSchedGo("].map(extract).join("\n");
const stubs = `
  const SUBJ={lincoln:{study_german:{display:"German cards",tracking:"daily",study:"german"},math:{display:"Math"},drills_l:{display:"Drills"}}};
  function gwGetSubjects(kid){ return SUBJ[kid]||{}; }
  let masteryKid="ellis", mastView="drill", mastLogMode=true, mastLogScores={x:1}, mastLogDeck=[1], mastSessionKey="k", mastSlideIdx=3, mastScoreItemId="q", mastAdminLocal={}, mastAddCat="";
  let mstSid=null, mstKid=null, mstState={queue:[]}, mstFlipped=true, mstDone={};
  const MAST_BANK_MAP={lincoln:{Spelling:[]}};
  let shown=null; function showTab(t){ shown=t; }
`;
const F = new Function(stubs + code + `; return {taskDeepLinkView, taskDeepLinkLabel, retrSchedGo, get:()=>({masteryKid,mastView,mstSid,mstKid,mstState,mstFlipped,mstDone,shown})};`)();

console.log("# deep link");
ok("study subject → 'study'", F.taskDeepLinkView({who:"lincoln",subjectKey:"study_german"}) === "study");
ok("plain subject → null", F.taskDeepLinkView({who:"lincoln",subjectKey:"math"}) === null);
ok("drills still → 'drill'", F.taskDeepLinkView({who:"lincoln",subjectKey:"drills_l"}) === "drill");
ok("unknown kid/subject is safe", F.taskDeepLinkView({who:"nobody",subjectKey:"study_german"}) === null);
ok("label", F.taskDeepLinkLabel("study") === "study cards" && F.taskDeepLinkLabel("drill") === "drills");

console.log("# retrSchedGo with a session id");
F.retrSchedGo("lincoln", "study", "german");
let g = F.get();
ok("lands on Mastery tab, kid + view set", g.shown === "mastery" && g.masteryKid === "lincoln" && g.mastView === "study");
ok("session pre-selected and sitting state cleared", g.mstSid === "german" && g.mstKid === "lincoln" && g.mstState === null && g.mstFlipped === false && g.mstDone === null);
F.retrSchedGo("ellis", "drill");
g = F.get();
ok("no sid → other views untouched by study state", g.mastView === "drill" && g.masteryKid === "ellis");

console.log("# markup wiring");
ok("add sheet has the Study session picker", /Study session<\/div><div class="ce-chips">/.test(src) && /ceAddForm\.study=/.test(src));
ok("ceAddSave stores study + noCarry on a daily subject", /if\(f\.study\)\{ subj\.study=f\.study; subj\.noCarry=true; \}/.test(src));
ok("edit sheet saves study via ceSaveField", /ceSaveField\(\\'study\\'/.test(src) || /ceSaveField\('study'/.test(src));
ok("task card computes the study pile line", /mstPile\(t\.who,_dlSub\.study/.test(src));
ok("card link passes the session id", /retrSchedGo\('"\+t\.who\+"','study','"\+_dlSub\.study\+"'\)/.test(src));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
