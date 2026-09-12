/*
 * Node tests for the fixed-time-class DOOR and its day-bound rule.
 *
 *  - fxDoorSetDates: the paste box. Real calendar validation, sorted, de-duplicated, and
 *    unreadable tokens REPORTED rather than dropped (a silently missing date = a missed class).
 *  - fxDoorToggle: turning a class off must clear the date list too, so a half-configured
 *    subject can never be left holding a window.
 *  - subjNoCarry: a class is day-bound — a missed class cannot cascade to the next day.
 *
 *   run:  node test_fixed_class_door.js
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

function extractFn(name) {
  const i = src.indexOf("function " + name + "(");
  if (i < 0) throw new Error("not found: " + name);
  let depth = 0, started = false;
  for (let k = src.indexOf("{", i); k < src.length; k++) {
    const c = src[k];
    if (c === "{") { depth++; started = true; }
    else if (c === "}") { depth--; if (started && depth === 0) return src.slice(i, k + 1); }
  }
  throw new Error("unbalanced: " + name);
}

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra ? "  (" + extra + ")" : "")); }
}

console.log("\nA) The meeting-dates paste box\n");

const SINK = { saved: {} };
const setDates = new Function("SINK", `
  let fxDoorMsg="";
  function ceSaveField(f,v){ SINK.saved[f]=v; }
  function ceRenderEditSheet(){}
  function renderAll(){}
  ${extractFn("fxParseDates")}
  ${extractFn("fxDatesMsg")}
  ${extractFn("fxDoorSetDates")}
  return function(t){ SINK.saved={}; fxDoorSetDates(t); return {saved:SINK.saved,msg:fxDoorMsg}; };
`)(SINK);

const GERMAN = ["2026-09-16","2026-09-23","2026-09-30","2026-10-07","2026-10-14","2026-10-21",
  "2026-10-28","2026-11-04","2026-11-11","2026-11-18","2026-12-02","2026-12-09","2026-12-16",
  "2027-01-06","2027-01-13","2027-01-20"];

(() => {
  const r = setDates(GERMAN.join("\n"));
  ok("all 16 German dates parse", JSON.stringify(r.saved.fixedDates) === JSON.stringify(GERMAN),
    (r.saved.fixedDates || []).length + "");
  ok("16 dates reported back to her", /16 meeting dates saved/.test(r.msg), r.msg);
})();

(() => {
  const r = setDates("2026-09-16, 2026-09-23,2026-09-30");
  ok("comma separated works", (r.saved.fixedDates || []).length === 3, JSON.stringify(r.saved));
})();

(() => {
  const r = setDates("2026-09-30\n2026-09-16\n2026-09-23");
  ok("sorted regardless of paste order",
    r.saved.fixedDates[0] === "2026-09-16" && r.saved.fixedDates[2] === "2026-09-30", JSON.stringify(r.saved));
})();

(() => {
  const r = setDates("2026-09-16\n2026-09-16\n2026-09-23");
  ok("duplicates collapse", r.saved.fixedDates.length === 2, JSON.stringify(r.saved));
})();

(() => {
  ok("empty clears to null", setDates("").saved.fixedDates === null);
  ok("whitespace only clears to null", setDates("  \n \n ").saved.fixedDates === null);
})();

(() => {
  // Note: input is split on whitespace too (so "2026-09-16 2026-09-23" works), which
  // means a prose date like "Sept 23" is reported as its separate fragments. Noisier,
  // but it still puts the bad input in front of her instead of dropping it.
  const r = setDates("2026-09-16\nSept 23\n2026-13-45");
  ok("unreadable tokens are named, not silently dropped",
    r.saved.fixedDates.length === 1 && /could not read/.test(r.msg) &&
    /Sept/.test(r.msg) && /2026-13-45/.test(r.msg), JSON.stringify(r.saved) + " | " + r.msg);
})();

(() => {
  // Real calendar validation, not just a regex.
  ok("Feb 30 rejected", setDates("2026-02-30").saved.fixedDates === null);
  ok("non-leap Feb 29 rejected", setDates("2027-02-29").saved.fixedDates === null);
  ok("leap-year Feb 29 accepted", (setDates("2028-02-29").saved.fixedDates || [])[0] === "2028-02-29");
  ok("ambiguous slashed format rejected", setDates("16/09/2026").saved.fixedDates === null);
})();

console.log("\nB) Turning a class off leaves nothing behind\n");

(() => {
  const S = { saved: {}, rendered: 0 };
  const toggle = new Function("S", `
    let currData={subjects:{lincoln:{german:{fixedTime:"10:00 AM",fixedDates:["2026-09-16"],minutes:45}}}};
    let ceEditKid="lincoln", ceEditKey="german";
    function ceSaveField(f,v){ S.saved[f]=v; currData.subjects.lincoln.german[f]=v; }
    function ceRenderEditSheet(){ S.rendered++; }
    function renderAll(){}
    ${extractFn("fxIsClass")}
    ${extractFn("fxDoorToggle")}
    return function(){ fxDoorToggle(); return S.saved; };
  `)(S);
  const saved = toggle();
  ok("toggling off clears fixedTime", saved.fixedTime === null, JSON.stringify(saved));
  ok("toggling off ALSO clears the date list", saved.fixedDates === null, JSON.stringify(saved));
})();

(() => {
  const S = { saved: {} };
  const toggle = new Function("S", `
    let currData={subjects:{lincoln:{aas:{minutes:30}}}};
    let ceEditKid="lincoln", ceEditKey="aas";
    function ceSaveField(f,v){ S.saved[f]=v; currData.subjects.lincoln.aas[f]=v; }
    function ceRenderEditSheet(){}
    function renderAll(){}
    ${extractFn("fxIsClass")}
    ${extractFn("fxDoorToggle")}
    return function(){ fxDoorToggle(); return S.saved; };
  `)(S);
  const saved = toggle();
  ok("toggling ON seeds a sensible default time", saved.fixedTime === "10:00 AM", JSON.stringify(saved));
})();

console.log("\nC) A class is day-bound — a missed class never cascades\n");

(() => {
  const mk = (subs) => new Function("SUBS", `
    const currData={subjects:SUBS};
    ${extractFn("fxIsClass")}
    ${extractFn("subjNoCarry")}
    return subjNoCarry;
  `)(subs);

  const subs = {
    lincoln: {
      german: { display:"German", fixedTime:"10:00 AM", minutes:45, allowedDays:["Wed"] },
      aas:    { display:"AAS Lesson", minutes:30, tracking:"sequenced" },
      nb:     { display:"Closing Notebook", minutes:5, tracking:"daily" },
    }
  };
  const noCarry = mk(subs);

  ok("the German class is day-bound",
    noCarry({ who:"lincoln", subjectKey:"german", id:"x" }) === true);
  ok("an ordinary sequenced subject still carries",
    noCarry({ who:"lincoln", subjectKey:"aas", id:"y" }) === false);
  ok("a daily notebook is still day-bound (unchanged)",
    noCarry({ who:"lincoln", subjectKey:"nb", id:"z" }) === true);
  ok("an unknown subject still carries (no accidental day-binding)",
    noCarry({ who:"lincoln", subjectKey:"nope", id:"w" }) === false);
})();

console.log("\nD) The ADD sheet can set up a class in one pass\n");

(() => {
  // The Add sheet writes the FORM (nothing exists in the db yet), so these handlers must
  // mutate ceAddForm — and ceAddSubject must then carry the fields onto the saved subject.
  const S = { form: null, rendered: 0 };
  const api = new Function("S", `
    let ceAddForm={name:"",minutes:25,allowedDays:[],days:"",total:50,fixedTime:"",fixedDates:[],joinUrl:""};
    let ceAddMsg="";
    function ceRenderAddSheet(){ S.rendered++; S.form=JSON.parse(JSON.stringify(ceAddForm)); S.msg=ceAddMsg; }
    function to12h(s){ if(!s)return""; const p=s.split(":"); if(p.length!==2)return s; let h=parseInt(p[0]);
      const mn=p[1]; const ap=h>=12?"PM":"AM"; if(h===0)h=12; else if(h>12)h-=12; return h+":"+mn+" "+ap; }
    ${extractFn("fxParseDates")}
    ${extractFn("fxDatesMsg")}
    ${extractFn("ceAddSetTotal")}
    ${extractFn("ceAddToggleClass")}
    ${extractFn("ceAddSetClassTime")}
    ${extractFn("ceAddSetClassDates")}
    return { total:(v)=>{ceAddSetTotal(v);return S.form;}, toggle:()=>{ceAddToggleClass();return S.form;},
             time:(v)=>{ceAddSetClassTime(v);return S.form;}, dates:(t)=>{ceAddSetClassDates(t);return {f:S.form,msg:S.msg};} };
  `)(S);

  // The ±10-only stepper could never reach 16. A typed value must land exactly.
  ok("Total accepts a typed 16 exactly", api.total("16").total === 16, JSON.stringify(api.total("16")));
  ok("Total clamps at 1, never 0 or negative", api.total("0").total === 1 && api.total("-5").total === 1);
  ok("Total clamps at 500", api.total("9999").total === 500);
  ok("Total ignores junk rather than becoming NaN", api.total("abc").total === 1, JSON.stringify(api.total("abc")));

  ok("toggling on seeds a default time", api.toggle().fixedTime === "10:00 AM");
  ok("a 24h time input is stored as 12h", api.time("10:00").fixedTime === "10:00 AM");
  ok("an afternoon time converts correctly", api.time("14:30").fixedTime === "2:30 PM");

  const d = api.dates("2026-09-16\n2026-09-23\n2026-09-30");
  ok("dates parse into the form", JSON.stringify(d.f.fixedDates) === JSON.stringify(["2026-09-16","2026-09-23","2026-09-30"]), JSON.stringify(d.f.fixedDates));
  ok("the form reports the count back", /3 meeting dates saved/.test(d.msg || ""), d.msg);
  const bad = api.dates("2026-09-16\nnope");
  ok("bad dates are named on the add sheet too", /could not read/.test(bad.msg || ""), bad.msg);

  // Toggling OFF must clear the dates, so a half-configured class can't be saved with a
  // date list but no time.
  api.time("10:00");
  const off = api.toggle();
  ok("toggling off clears time AND dates", off.fixedTime === "" && off.fixedDates.length === 0, JSON.stringify(off));
})();

(() => {
  // ceAddSubject must persist the three fields. Asserted against source: the write block
  // has to sit AFTER both tracking branches build `subj`, or the values are dropped.
  const i = src.indexOf("if(f.fixedTime&&String(f.fixedTime).trim()){");
  ok("ceAddSubject has a class-field write block", i > 0);
  const blk = src.slice(i, i + 520);
  ok("it writes fixedTime", /subj\.fixedTime=f\.fixedTime/.test(blk));
  ok("it writes fixedDates only when non-empty", /f\.fixedDates\.length\) subj\.fixedDates=/.test(blk));
  ok("it sanitises joinUrl through fxSafeUrl", /fxSafeUrl\(f\.joinUrl\)/.test(blk), blk.slice(0, 200));
  const after = src.indexOf("currData.subjects[kid][key]=subj;", i);
  ok("the write happens BEFORE the subject is stored", after > i && after - i < 600, "i=" + i + " store=" + after);
})();

console.log("\n" + pass + " passed, " + fail + " failed\n");
process.exit(fail ? 1 : 0);
