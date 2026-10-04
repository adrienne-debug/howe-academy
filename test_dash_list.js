/*
 * ➖ "Make consistent" also fixes a plan-backed subject's LESSON LIST (her ask 10/3, DeWalt Kenzie CLE LA 4:
 * the cells got the en-dash, the list kept "Thank-You" / "Run-on" / "How-To"). Only the dash character
 * changes in the list — same length, same order, same ids. A subject that isn't plan-backed is untouched
 * (its list is rebuilt from cells by gvSyncSeqInto, as before).
 *   run:  node test_dash_list.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// GVAUDIT_START"), b = src.indexOf("// GVAUDIT_END");
if (a < 0 || b < 0) { console.error("GVAUDIT markers not found"); process.exit(1); }
const block = src.slice(a, b);
function braceSlice(name) {
  const sig = "function " + name + "("; const i = src.indexOf(sig); if (i < 0) throw new Error("fn " + name);
  let d = 0, j = src.indexOf("{", i);
  for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); } }
}
const TODAY = "2026-10-04";
const prelude = `
  var cbTodayISO=function(){return "${TODAY}";};
  var gvFilled=function(v){return !!(v&&v!=="—"&&v!=="nan"&&String(v).trim());};
  var cap=function(s){return String(s);}; var esc=function(s){return String(s);};
  var gvGrabScroll=function(){}, renderAll=function(){}, buildCurrPaceCum=function(){}, gvRecountTotal=function(){};
  var toasts=[]; var gwShowToast=function(m){toasts.push(m);};
  var confirmMsgs=[]; var confirm=function(m){confirmMsgs.push(m);return true;};
  var momModeActive=true, adminPinUnlocked=true, gvSelUndo=null;
  var writes=[]; var db={ref:function(p){return {update:function(o){writes.push({p:p,o:o});}};}};
  var currData={subjects:{},lessons:{}};
  var PB={}; var planBacked=function(k,s){return !!PB[k+"|"+s];};
  var lidDoneIdx=function(){return new Set();};
  var lidsFor=function(k,s){ var x=(currData.subjects[k]||{})[s]; return x&&x.lessonIds?x.lessonIds.slice():null; };
  var _lidAlign=function(){ throw new Error("ids must be restored, never re-aligned"); };
  var _lidNextFrom=function(ids){ return ids.length+1; };
`;
const api = new Function(prelude + braceSlice("setLessonSeq") + "\n" + braceSlice("gvSyncSeqInto") + "\n" + block +
  "; return {find:gvAuditFindings, fix:gvAuditFixDash, set:function(d){currData=d;}, pb:function(k,s){PB[k+'|'+s]=1;}, data:function(){return currData;}, writes:writes, confirmMsgs:confirmMsgs, toasts:toasts, undo:function(){return gvSelUndo;}};")();
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } };

// Kenzie's live shape after the first tap: every upcoming cell already "–", the list still mixed.
const seq = ["403 L9: Dictionary – Pronunciations", "404 L3: Thank-You Notes", "405 L2: Run-on Sentences", "407 L2: Writing a Report – Choosing", "409 L1: Rhythm – Steady or Active"];
const cells = ["403 L9: Dictionary – Pronunciations", "404 L3: Thank–You Notes", "405 L2: Run–on Sentences", "407 L2: Writing a Report – Choosing", "409 L1: Rhythm – Steady or Active"];
function fixture() {
  const lessons = {}; cells.forEach((t, i) => { lessons[10 + i] = { date: "2026-10-1" + i, la: t }; });
  return { subjects: { kz: { la: { display: "CLE LA 4", tracking: "sequenced", lessonSeq: seq.slice(), lessonIds: ["L0001", "L0002", "L0003", "L0004", "L0005"], nextLid: 6, planId: "p" } } }, lessons: { kz: lessons } };
}

console.log("finding");
api.set(fixture()); api.pb("kz", "la");
let r = api.find("kz"); let f = r.now.filter(x => x.type === "dash")[0];
ok("plan-backed list with the other dash IS offered (cells alone are clean)", !!f, r);
ok("…counts the 2 list lines, 0 cells", f && f.lst === 2 && f.fwd === 0, f);
ok("…and the winner is the en-dash", f && f.win === "–");

console.log("fix");
api.fix("kz", "la");
const s = api.data().subjects.kz.la;
ok("list lines take the dash", s.lessonSeq[1] === "404 L3: Thank–You Notes" && s.lessonSeq[2] === "405 L2: Run–on Sentences", s.lessonSeq);
ok("same length, same order (other lines unchanged)", s.lessonSeq.length === 5 && s.lessonSeq[0] === seq[0] && s.lessonSeq[4] === seq[4]);
ok("ids kept exactly", JSON.stringify(s.lessonIds) === JSON.stringify(["L0001", "L0002", "L0003", "L0004", "L0005"]) && s.nextLid === 6, s.lessonIds);
const w = api.writes[api.writes.length - 1];
ok("ONE targeted curriculum update carries the list", w && w.p === "curriculum" && Array.isArray(w.o["subjects/kz/la/lessonSeq"]) && !("subjects/kz/la/total" in w.o), w && Object.keys(w.o));
ok("the confirm names the list lines", /2 lines of the CLE LA 4 lesson list/.test(api.confirmMsgs[api.confirmMsgs.length - 1] || ""), api.confirmMsgs);
ok("Undo holds the old list + ids", api.undo() && api.undo().seqUndo.la && api.undo().seqUndo.la.seq[1] === "404 L3: Thank-You Notes");
r = api.find("kz");
ok("afterwards nothing is flagged", !r.now.concat(r.past).some(x => x.type === "dash"), r);

console.log("not plan-backed: unchanged behavior");
const g = fixture(); delete g.subjects.kz.la.planId;
const api2 = new Function(prelude + braceSlice("setLessonSeq") + "\n" + braceSlice("gvSyncSeqInto") + "\n" + block +
  "; return {find:gvAuditFindings, set:function(d){currData=d;}};")();
api2.set(g);
r = api2.find("kz");
ok("a non-plan-backed subject never counts list lines (cells clean → no finding)", !r.now.concat(r.past).some(x => x.type === "dash"), r);
console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
