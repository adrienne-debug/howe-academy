/*
 * 👩 Mom on set days of a multi-day lesson (her ask 2026-10-02 — DeWalt: IEW "with Mom day 1", the rest on
 * her own; AAS 4 lesson day 20 min with Mom, word days 10 min alone). subject.momDays / momDayMin.
 *   run:  node test_lesson_mom_days.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } };
function braceSlice(name) {
  const sig = "function " + name + "("; const i = src.indexOf(sig); if (i < 0) throw new Error("fn " + name);
  let d = 0, j = src.indexOf("{", i);
  for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); } }
  throw new Error("unbalanced " + name);
}
const helpers = ["lessonDayList", "lessonDayFlags", "lessonDayStamp", "lessonDaySpan"].map(braceSlice).join("\n");
const H = new Function(helpers + "\nreturn {lessonDayList,lessonDayFlags,lessonDayStamp,lessonDaySpan};")();

console.log("flags");
const iew = { minutes: 20, mom: "none", momDays: [1] };
const aas = { minutes: 10, mom: "none", momDays: [1], momDayMin: 20 };
const T = (k, n) => "📘 IEW — Lesson 4: The Milkmaid and Her Pail (pp. 31–36) · day " + k + " of " + (n || 4);
ok("IEW day 1 = Mom-required, 20 min", JSON.stringify(H.lessonDayFlags(iew, T(1))) === '{"mom":"required","dur":20}');
ok("IEW day 2–4 = on her own, 20 min", [2, 3, 4].every(k => JSON.stringify(H.lessonDayFlags(iew, T(k))) === '{"mom":"none","dur":20}'));
ok("AAS day 1 runs the Mom-day length (20)", H.lessonDayFlags(aas, "AAS 4 — Lesson 5 · day 1 of 4").dur === 20);
ok("AAS word days run the subject length (10), on her own", JSON.stringify(H.lessonDayFlags(aas, "AAS 4 — Lesson 5 · day 3 of 4")) === '{"mom":"none","dur":10}');
ok("a 3-day lesson works the same (day 1 of 3)", H.lessonDayFlags(aas, "AAS 4 — Lesson 36 · day 1 of 3").mom === "required");
ok("Firebase object form of momDays ({0:1}) reads the same", H.lessonDayFlags({ minutes: 20, momDays: { 0: 1 } }, T(1)).mom === "required");
ok("several Mom days (1 and 2)", H.lessonDayFlags({ minutes: 20, momDays: [1, 2] }, T(2)).mom === "required" && H.lessonDayFlags({ minutes: 20, momDays: [1, 2] }, T(3)).mom === "none");

console.log("nothing changes without the switch");
ok("no momDays → null (every existing subject)", H.lessonDayFlags({ minutes: 25, mom: "required" }, T(1)) === null);
ok("empty momDays → null", H.lessonDayFlags({ minutes: 25, momDays: [] }, T(1)) === null);
ok("a one-sitting lesson (no '· day k of N') → null", H.lessonDayFlags(iew, "📘 IEW — Lesson 4: The Milkmaid and Her Pail") === null);
ok("'day' mid-title is not mistaken for a sitting", H.lessonDayFlags(iew, "Read · day 2 of 4 notes first") === null);
const plain = { title: "Math — L5", mom: "required", dur: 25 };
H.lessonDayStamp(plain, { minutes: 20, mom: "none" });
ok("lessonDayStamp leaves an unflagged card exactly as it was", plain.mom === "required" && plain.dur === 25);

console.log("stamp + span");
const c = { title: T(2), mom: "required", dur: 20 };
H.lessonDayStamp(c, iew);
ok("a card that now holds day 2 drops Mom", c.mom === "none" && c.dur === 20);
const c2 = { title: "AAS 4 — Lesson 6 · day 1 of 4", mom: "none", dur: 10 };
H.lessonDayStamp(c2, aas);
ok("a card that now holds day 1 takes Mom and the 20-min length", c2.mom === "required" && c2.dur === 20);
ok("span = longest lesson (4)", H.lessonDaySpan({ lessonSeq: ["L5 · day 1 of 4", "L36 · day 1 of 3"] }) === 4);
ok("span 0 for a plain list", H.lessonDaySpan({ lessonSeq: ["L1", "L2"] }) === 0);

console.log("re-lay restamps open cards (and only for a Mom-day subject)");
const a = src.indexOf("function _reprojectPlan("); let i = src.indexOf("{", a), d = 0, j = i;
for (; j < src.length; j++) { if (src[j] === "{") d++; else if (src[j] === "}") { d--; if (!d) break; } }
const days = src.match(/const _RP_DAYS=[^;]+;/)[0];
const toMin = s => { const m = /(\d+):(\d+)\s*([AP]M)/.exec(s || ""); if (!m) return 0; return (+m[1] % 12 + (m[3] === "PM" ? 12 : 0)) * 60 + +m[2]; };
const fromMin = n => { let h = Math.floor(n / 60), m = n % 60, ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return h + ":" + String(m).padStart(2, "0") + " " + ap; };
const RP = new Function(helpers + "\n" + days + "\n" + src.slice(a, j + 1) + "\nreturn _reprojectPlan;")();
const base = { who: "makenzie", subjectKey: "aas4", day: "friday", time: "11:30 AM" };
const ID = "makenzie_makenzie__aas4_L0010";
const run = (live, want, o) => RP("makenzie", "aas4", live, want, Object.assign({ todayDay: "wednesday", nowMin: 540, checked: {}, claimed: {}, toMin, fromMin, dayCtx: () => ({}), packAround: null, dayCap: 1, doneLids: [] }, o || {}));
let card = { ...base, id: ID, lid: "L0010", title: "AAS 4 — Lesson 6 · day 1 of 4", mom: "none", dur: 10 };
let r = run([card], [{ ...card }], { lsdSubj: aas });
ok("an open day-1 card takes Mom + 20 min in one targeted write", r.upd[ID + "/mom"] === "required" && r.upd[ID + "/dur"] === 20 && !(ID in r.upd), r.upd);
r = run([card], [{ ...card }], { lsdSubj: aas, checked: { [ID]: "10:00 AM Oct 9" } });
ok("a CHECKED card is never restamped", !(ID + "/mom" in r.upd) && !(ID + "/dur" in r.upd));
r = run([card], [{ ...card }], {});
ok("without lsdSubj (any other subject) the length is never touched", !(ID + "/dur" in r.upd));
const right = { ...base, id: ID, lid: "L0010", title: "AAS 4 — Lesson 6 · day 2 of 4", mom: "none", dur: 10 };
r = run([right], [{ ...right }], { lsdSubj: aas });
ok("a card already right is left alone", !Object.keys(r.upd).length, r.upd);

console.log("wired in");
ok("generator packs with the sitting's flags", /lessonDayFlags\(s,excelVal\)/.test(src));
ok("generator card uses them", /lessonDayFlags\(s,mm\.excelVal\)/.test(src));
ok("seqFill restamps a re-titled slot", /t\.title=_seqFillTitle\(t\.title,a\.text\);\s*\n\s*if\(typeof lessonDayStamp==="function"\) lessonDayStamp\(t,subj\);/.test(src));
ok("pattern-forward restamps its copied card", /lessonDayStamp\(nt,subj\)/.test(src));
ok("master pull restamps", /lessonDayStamp\(card,s\)/.test(src));
ok("catch-up places with each lesson's own flags", /const _lf=x\.lsd\?lessonDayFlags\(x\.lsd/.test(src));
ok("re-lay gets the subject only when it has Mom days", /lsdSubj:\(typeof lessonDayList==="function"&&lessonDayList\(_subj\)\.length\)\?_subj:null/.test(src));
ok("changing Mom days re-lays the week like the Mom setting", /field==="momDays"\|\|field==="momDayMin"/.test(src));
console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
