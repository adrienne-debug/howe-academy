/*
 * Node tests for SEQTAGS (her yes 2026-10-09, out-of-sequence step 2): a plan card's id names its lesson.
 * Real week26 shape (Lincoln conventions, Ellis read_detect, read-only from Firebase 10/8) is embedded below.
 *   run:  node test_seq_tags.js
 */
const FX = {"meta":{"friday":"October 9","monday":"October 5","thursday":"October 8","tuesday":"October 6","wednesday":"October 7"},"tasks":[{"cascade":true,"day":"monday","detail":"Ipad. May need Mom. Max 1 per day.","device":"ipad","dur":15,"id":"lincoln_lincoln__conventions_L0017","lid":"L0017","mom":"maybe","subjectKey":"conventions","time":"10:30 AM","title":"📱 Editor in Chief — Sitting 1","who":"lincoln"},{"cascade":true,"cascadedFrom":"monday","day":"tuesday","detail":"Ipad. May need Mom. Max 1 per day.","device":"ipad","dur":15,"id":"lincoln_lincoln__conventions_L0018","lid":"L0018","mom":"maybe","subjectKey":"conventions","time":"10:50 AM","title":"📱 Editor in Chief — Sitting 2","who":"lincoln"},{"cascade":true,"cascadedFrom":"thursday","day":"friday","detail":"Ipad. May need Mom. Max 1 per day.","device":"ipad","dur":15,"id":"lincoln_lincoln__conventions_L0019","lid":"L0020","mom":"maybe","subjectKey":"conventions","time":"11:56 AM","title":"📱 Editor in Chief — Sitting 4","who":"lincoln"},{"cascade":true,"catchUp":true,"day":"wednesday","detail":"Ipad. May need Mom. Max 1 per day.","device":"ipad","dur":15,"id":"lincoln_lincoln__conventions_L0020","lid":"L0019","mom":"maybe","pulledFrom":"thursday","subjectKey":"conventions","time":"2:45 PM","title":"📱 Editor in Chief — Sitting 3","who":"lincoln"},{"cascade":true,"day":"tuesday","detail":"Paper. May need Mom. Sequential. Max 1 per day.","device":"paper","dur":15,"id":"ellis_ellis__read_detect_L0026","lid":"L0026","mom":"maybe","subjectKey":"read_detect","time":"10:20 AM","title":"📄 Reading Detective — Ex. 45–46","who":"ellis"},{"cascade":true,"cascadedFrom":"monday","day":"saturday","detail":"Paper. May need Mom. Sequential. Max 1 per day.","device":"paper","dur":15,"id":"ellis_ellis__read_detect_L0027","lid":"L0029","mom":"maybe","subjectKey":"read_detect","time":"10:15 AM","title":"📄 Reading Detective — Ex. 51–52","who":"ellis"},{"cascade":true,"catchUp":true,"day":"wednesday","detail":"Paper. May need Mom. Sequential. Max 1 per day.","device":"paper","dur":15,"id":"ellis_ellis__read_detect_L0028","lid":"L0027","mom":"maybe","subjectKey":"read_detect","time":"10:05 AM","title":"📄 Reading Detective — Ex. 47–48","who":"ellis"},{"cascade":true,"catchUp":true,"day":"friday","detail":"Paper. May need Mom. Sequential. Max 1 per day.","device":"paper","dur":15,"id":"ellis_ellis__read_detect_L0029","lid":"L0028","mom":"maybe","subjectKey":"read_detect","time":"10:05 AM","title":"📄 Reading Detective — Ex. 49–50","who":"ellis"},{"_eowOverflow":true,"cascade":true,"cascadedFrom":"monday","catchUp":true,"day":"thursday","detail":"Paper. May need Mom. Sequential. Max 1 per day.","device":"paper","dur":15,"id":"ellis_ellis__read_detect_L0030","lid":"L0030","mom":"maybe","subjectKey":"read_detect","time":"2:05 PM","title":"📄 Reading Detective — Posttest / Review","who":"ellis"}],"checked":{"ellis_ellis__read_detect_L0026":"12:16 PM Oct 6","ellis_ellis__read_detect_L0028":"11:54 AM Oct 7","lincoln_lincoln__conventions_L0017":"12:50 PM Oct 5","lincoln_lincoln__conventions_L0018":"11:29 AM Oct 6","lincoln_lincoln__conventions_L0020":"02:45 PM Oct 7"},"subjects":{"lincoln":{"conventions":{"planId":"lincoln__conventions","lessonIds":["L0001","L0002","L0154","L0155","L0156","L0157","L0158","L0159","L0003","L0004","L0005","L0006","L0007","L0008","L0009","L0010","L0011","L0012","L0013","L0014","L0015","L0016","L0017","L0018","L0019","L0020","L0021","L0022","L0023","L0024","L0025","L0026","L0027","L0028","L0029","L0030","L0031","L0032","L0033","L0034","L0035","L0036","L0037","L0038","L0039","L0040","L0041","L0042","L0043","L0044","L0045","L0046","L0047","L0048","L0049","L0050","L0051","L0052","L0053","L0054","L0055","L0056","L0057","L0058","L0059","L0060","L0061","L0062","L0063","L0064","L0065","L0066","L0067","L0068","L0069","L0070","L0071","L0072","L0073","L0074","L0075","L0076","L0077","L0078","L0079","L0080","L0081","L0082","L0083","L0084","L0085","L0086","L0087","L0088","L0089","L0090","L0091","L0092","L0093","L0094","L0095","L0096","L0097","L0098","L0099","L0100","L0101","L0102","L0103","L0104","L0105","L0106","L0107","L0108","L0109","L0110","L0111","L0112","L0113","L0114","L0115","L0116","L0117","L0118","L0119","L0120","L0121","L0122","L0123","L0124","L0125","L0126","L0127","L0128","L0129","L0130","L0131","L0132","L0133","L0134","L0135","L0136","L0137","L0138","L0139","L0140","L0141","L0142","L0143","L0144","L0145","L0146","L0147","L0148","L0149","L0150","L0151","L0152","L0153"],"lessonSeq":["B2 pg 9","B2 pg 10","B2 pg 11","B2 pg 12","B2 pg 13","B2 pg 14","B2 pg 15","B2 pg 16","B2 pg 17","B2 pg 18","B2 pg 19","B2 pg 20","B2 pg 21","B2 pg 22","B2 pg 23","B2 pg 24","B2 pg 27","B2 pg 25","B2 pg 26","B2 pg 29","B2 pg 30","B2 pg 31","Sitting 1","Sitting 2","Sitting 3","Sitting 4","Sitting 5","Sitting 6","Sitting 7","Sitting 8","Sitting 9","Sitting 10","Sitting 11","Sitting 12","Sitting 13","Sitting 14","Sitting 15","Sitting 16","Sitting 17","Sitting 18","Sitting 19","Sitting 20","Sitting 21","Sitting 22","Sitting 23","Sitting 24","Sitting 25","Sitting 26","Sitting 27","Sitting 28","Sitting 29","Sitting 30","Sitting 31","Sitting 32","Sitting 33","Sitting 34","Sitting 35","Sitting 36","Sitting 37","Sitting 38","Sitting 39","Sitting 40","Sitting 41","Sitting 42","Sitting 43","Sitting 44","Sitting 45","Sitting 46","Sitting 47","Sitting 48","Sitting 49","Sitting 50","Sitting 51","Sitting 52","Sitting 53","Sitting 54","Sitting 55","Sitting 56","Sitting 57","Sitting 58","Sitting 59","Sitting 60","Sitting 61","Sitting 62","Sitting 63","Sitting 64","Sitting 65","Sitting 66","Sitting 67","Sitting 68","Sitting 69","Sitting 70","Sitting 71","Sitting 72","Sitting 73","Sitting 74","Sitting 75","Sitting 76","Sitting 77","Sitting 78","Sitting 79","Sitting 80","Sitting 81","Sitting 82","Sitting 83","Sitting 84","Sitting 85","Sitting 86","Sitting 87","Sitting 88","Sitting 89","Sitting 90","Sitting 91","Sitting 92","Sitting 93","Sitting 94","Sitting 95","Sitting 96","Sitting 97","Sitting 98","Sitting 99","Sitting 100","Sitting 101","Sitting 102","Sitting 103","Sitting 104","Sitting 105","Sitting 106","Sitting 107","Sitting 108","Sitting 109","Sitting 110","Sitting 111","Sitting 112","Sitting 113","Sitting 114","Sitting 115","Sitting 116","Sitting 117","Sitting 118","Sitting 119","Sitting 120","Sitting 121","Sitting 122","Sitting 123","Sitting 124","Sitting 125","Sitting 126","Sitting 127","Sitting 128","Sitting 129","Sitting 130","Sitting 131","Sitting 132","Sitting 133","Sitting 134","Sitting 135","Sitting 136","Sitting 137"]}},"ellis":{"read_detect":{"planId":"ellis__read_detect","lessonIds":["L0001","L0002","L0003","L0004","L0005","L0006","L0007","L0008","L0009","L0010","L0011","L0012","L0013","L0014","L0015","L0016","L0017","L0018","L0019","L0020","L0021","L0022","L0023","L0024","L0025","L0026","L0027","L0028","L0029","L0030","L0031","L0032","L0033","L0034","L0035","L0036"],"lessonSeq":["pg14-17","pg 18-21","pg22-25","pg26-29","pg30-35","pg36-39","pg40-43","pg44-49","pg50-53","pg54-57","pg58-61","pg62-66","pg67-71","pg72-75","pg76-79","pg84-89","Ex. 29–30","Ex. 31–32","Ex. 33–34","Ex. 37–38","Ex. 35–36","pg80-83","Ex. 39–40","Ex. 41–42","Ex. 43–44","Ex. 45–46","Ex. 47–48","Ex. 49–50","Ex. 51–52","Posttest / Review","Posttest / Review","Posttest / Review","Posttest / Review","Posttest / Review","Posttest / Review","Posttest / Review"]}}},"done":{"lincoln":{"conventions":{"L0001":{"taskId":"2026d158_23"},"L0002":{"taskId":"2026d160_85"},"L0003":{"taskId":"2026d162_146"},"L0004":{"taskId":"2026d165_19"},"L0005":{"taskId":"2026d166_60"},"L0006":{"taskId":"2026d167_82"},"L0007":{"taskId":"2026d179_29"},"L0008":{"taskId":"2026d180_66"},"L0009":{"taskId":"2026d181_96"},"L0010":{"taskId":"2026d214_323"},"L0011":{"taskId":"2026d216_97"},"L0012":{},"L0013":{},"L0014":{"taskId":"lincoln_lincoln__conventions_L0014"},"L0015":{"taskId":"lincoln_lincoln__conventions_L0015"},"L0016":{"taskId":"lincoln_lincoln__conventions_L0016"},"L0017":{"taskId":"lincoln_lincoln__conventions_L0017"},"L0018":{"taskId":"lincoln_lincoln__conventions_L0018"},"L0019":{"taskId":"lincoln_lincoln__conventions_L0020"},"L0154":{},"L0155":{},"L0156":{},"L0157":{},"L0158":{},"L0159":{}}},"ellis":{"read_detect":{"L0001":{"taskId":"2026d158_9"},"L0002":{"taskId":"2026d159_52"},"L0003":{"taskId":"2026d160_69"},"L0004":{"taskId":"2026d161_113"},"L0005":{"taskId":"2026d162_127"},"L0006":{"taskId":"2026d165_9"},"L0007":{"taskId":"2026d167_75"},"L0008":{"taskId":"2026d168_102"},"L0009":{"taskId":"2026d169_130"},"L0010":{"taskId":"2026d169_133"},"L0011":{"taskId":"2026d179_14"},"L0012":{"taskId":"2026d180_44"},"L0013":{"taskId":"2026d181_79"},"L0014":{"taskId":"2026d182_117"},"L0015":{"taskId":"2026d183_147"},"L0016":{"taskId":"2026d187_59"},"L0017":{"taskId":"2026d194_73"},"L0018":{"taskId":"2026d195_119"},"L0019":{"taskId":"2026d196_159"},"L0020":{"taskId":"2026d214_26"},"L0021":{"taskId":"2026d216_373"},"L0022":{"taskId":"ellis_ellis__read_detect_L0022"},"L0023":{"taskId":"ellis_ellis__read_detect_L0023"},"L0024":{"taskId":"ellis_ellis__read_detect_L0024"},"L0025":{"taskId":"ellis_ellis__read_detect_L0025"},"L0026":{"taskId":"ellis_ellis__read_detect_L0026"},"L0027":{"taskId":"ellis_ellis__read_detect_L0028"}}}}};

const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function sliceBlock(a, b) { const ia = src.indexOf(a), ib = src.indexOf(b);
  if (ia < 0 || ib < 0) { console.error("markers not found: " + a + " / " + b); process.exit(1); } return src.slice(ia, ib); }
const SEQ_BLOCK = sliceBlock("// SEQFILL_START", "// SEQFILL_END");
const MATCH_BLOCK = sliceBlock("// GWC_MATCH_START", "// GWC_MATCH_END");
const TS_FN = sliceBlock("function gwCheckTsMs(", "function gwCommit(");
const gwCheckTsMs = new Function(TS_FN + "\n return gwCheckTsMs;")();

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}
const clone = x => JSON.parse(JSON.stringify(x));
const LIN = "lincoln_lincoln__conventions_", ELL = "ellis_ellis__read_detect_";
const card = (tasks, id) => tasks.find(t => t.id === id);
const byKid = (tasks, who, sk) => tasks.filter(t => t.who === who && t.subjectKey === sk);

// A SEQFILL sandbox: the real block, real week26 subjects + done lids, "now" = isoNow.
function mkNorm(o) {
  o = o || {};
  const subj = clone(FX.subjects);
  const doneLids = {}; Object.keys(FX.done).forEach(k => Object.keys(FX.done[k]).forEach(sk => {
    doneLids[k + "|" + sk] = new Set(Object.keys(FX.done[k][sk]).concat((o.extraDone || {})[k + "|" + sk] || [])); }));
  const NOW = o.now || "2026-10-08T08:00:00";
  const e = { console, JSON, Object, Array, String, Number, Math, Set, RegExp,
    Date: class extends Date { constructor(...a) { if (!a.length) super(NOW); else super(...a); } },
    checked: o.checked || {}, claimed: o.claimed || {},
    currData: { subjects: subj, done: {} }, DAY_DT: Object.assign({}, FX.meta, { saturday: undefined }),
    _todayStr: () => NOW.slice(0, 10),
    toMin: x => { const m = /^(\d+):(\d+)\s*(AM|PM)/i.exec(x || ""); if (!m) return 9999; let h = +m[1] % 12; if (/pm/i.test(m[3])) h += 12; return h * 60 + +m[2]; },
    planBacked: (k, sk) => !!(subj[k] && subj[k][sk]), lidsFor: (k, sk) => subj[k][sk].lessonIds,
    lidDoneSet: (k, sk) => doneLids[k + "|" + sk], dbg: m => { (e._log = e._log || []).push(m); } };
  delete e.DAY_DT.saturday;
  vm.createContext(e); vm.runInContext(SEQ_BLOCK, e); return e;
}
function norm(e, tasks) { e.__t = tasks; return vm.runInContext("seqFillNormalize(__t,'test')", e); }
// the order check exactly as seqFillNormalize runs it, per subject
function ascending(e, tasks, who, sk) {
  e.__a = { kid: who, sk, planId: FX.subjects[who][sk].planId, lessonIds: FX.subjects[who][sk].lessonIds,
    lessonSeq: FX.subjects[who][sk].lessonSeq, done: e.lidDoneSet(who, sk), cards: byKid(tasks, who, sk), toMin: e.toMin,
    isLocked: t => !!e.checked[t.id] };
  return vm.runInContext("seqFillSlots(__a)", e).ascending;
}
// every check-off sits on a card whose LESSON is the one curriculum/done recorded for it
function checksOnTheirLesson(tasks, checkedMap) {
  const bad = [];
  Object.keys(checkedMap).forEach(id => { const t = card(tasks, id); if (!t || !t.lid) return;
    const rec = ((FX.done[t.who] || {})[t.subjectKey] || {})[t.lid];
    if (!rec) bad.push(id + " → lid " + t.lid + " has no done record"); });
  return bad;
}

console.log("── 1. how the drift was made (10/7): a pulled card swaps lessons with the card that holds its id ──");
{
  // Lincoln Wed 10/7 morning, before the check: Thursday's …_L0020 was pulled onto Wednesday 2:45 PM,
  // Friday still holds …_L0019. seqfill re-stamps the two slots in order (Wed=L0019, Fri=L0020).
  const e = mkNorm({ now: "2026-10-07T09:00:00", checked: { [LIN + "L0017"]: "x", [LIN + "L0018"]: "x" } });
  e.lidDoneSet("lincoln", "conventions").delete("L0019");
  const base = FX.tasks.filter(t => t.who === "lincoln");
  const tasks = clone(base);
  card(tasks, LIN + "L0020").lid = "L0020"; card(tasks, LIN + "L0020").title = "📱 Editor in Chief — Sitting 4";
  card(tasks, LIN + "L0019").lid = "L0019"; card(tasks, LIN + "L0019").title = "📱 Editor in Chief — Sitting 3";
  norm(e, tasks);
  const wed = tasks.find(t => t.day === "wednesday"), fri = tasks.find(t => t.day === "friday");
  ok("Wednesday's slot takes Sitting 3 (L0019)", wed.lid === "L0019", wed);
  ok("…and its id follows its lesson (…_L0019), even though Friday held that id", wed.id === LIN + "L0019", wed.id);
  ok("Friday's slot takes Sitting 4 (L0020) under …_L0020", fri.lid === "L0020" && fri.id === LIN + "L0020", fri);
  ok("ids stay unique", new Set(tasks.map(t => t.id)).size === tasks.length);
  ok("order check ascending", ascending(e, tasks, "lincoln", "conventions"));
  // Now Lincoln checks Wednesday's card: the check is saved under the id that NAMES the lesson he did.
  ok("a check on Wednesday's card would be saved under …_L0019 = the lesson done", wed.id.endsWith(wed.lid));
}
{
  // Ellis' three-way rotation, same morning: Wed holds …_L0028, Fri …_L0029, Sat …_L0027, box …_L0030.
  const e = mkNorm({ now: "2026-10-07T09:00:00", checked: { [ELL + "L0026"]: "x" } });
  e.lidDoneSet("ellis", "read_detect").delete("L0027");
  const tasks = clone(FX.tasks.filter(t => t.who === "ellis"));
  tasks.forEach(t => { const m = t.id.match(/_(L\d+)$/); t.lid = m[1]; });   // before the drift: id = lid everywhere
  norm(e, tasks);
  const at = d => tasks.find(t => t.day === d && !t._eowOverflow);
  ok("Wed = L0027 under …_L0027", at("wednesday").lid === "L0027" && at("wednesday").id === ELL + "L0027", at("wednesday"));
  ok("Fri = L0028 under …_L0028", at("friday").lid === "L0028" && at("friday").id === ELL + "L0028", at("friday"));
  ok("Sat = L0029 under …_L0029", at("saturday").lid === "L0029" && at("saturday").id === ELL + "L0029", at("saturday"));
  ok("every Ellis card's id names its lesson", tasks.every(t => t.id.endsWith("_" + t.lid)), tasks.map(t => t.id + "/" + t.lid));
  ok("ids stay unique", new Set(tasks.map(t => t.id)).size === tasks.length);
}

console.log("── 2. seqfill on the LIVE week26 (Thu 10/8 8 AM): checked cards never move ──");
{
  const e = mkNorm({ checked: clone(FX.checked) });
  const tasks = clone(FX.tasks), before = clone(FX.tasks);
  norm(e, tasks);
  Object.keys(FX.checked).forEach(id => {
    const a = card(before, id), b = card(tasks, id);
    ok("checked " + id.replace(/^.*__/, "") + " keeps its id + lesson + title", b && b.lid === a.lid && b.title === a.title, b);
  });
  ok("check-off map untouched (seqfill never writes checks)", JSON.stringify(e.checked) === JSON.stringify(FX.checked));
  ok("no check lands on a lesson that wasn't done", checksOnTheirLesson(tasks, e.checked).length === 0, checksOnTheirLesson(tasks, e.checked));
  ok("ids unique", new Set(tasks.map(t => t.id)).size === tasks.length);
  ok("Lincoln order ascending", ascending(e, tasks, "lincoln", "conventions"));
  ok("Ellis order ascending", ascending(e, tasks, "ellis", "read_detect"));
  const fri = tasks.find(t => t.who === "lincoln" && t.day === "friday");
  ok("Lincoln Fri still Sitting 4 (L0020); its id can't take …_L0020 (the checked card holds it)", fri.lid === "L0020" && fri.id === LIN + "L0019", fri);
  ok("no unchecked card sits on an id that has a check entry", tasks.every(t => !e.checked[t.id] || FX.checked[t.id]));
}

console.log("── 3. an id with a stale check entry is never handed to an open card ──");
{
  // a check is left under …_L0019 with no card (e.g. a card removed earlier); an open card re-stamped to L0019 must not take that id
  const e = mkNorm({ now: "2026-10-07T09:00:00", checked: { [LIN + "L0017"]: "x", [LIN + "L0018"]: "x", [LIN + "L0019"]: "09:00 AM Oct 7" } });
  e.lidDoneSet("lincoln", "conventions").delete("L0019");
  const tasks = [Object.assign(clone(card(FX.tasks, LIN + "L0019")), { id: LIN + "L0021", lid: "L0021", day: "friday" })];
  norm(e, tasks);
  ok("the open card does NOT take …_L0019 (it would be born checked)", tasks[0].id !== LIN + "L0019", tasks[0]);
}

console.log("── 4. Regenerate on the LIVE week26: the stale id can't lock the wrong lesson ──");
// A regenerate on Thu 10/8: the generator advances past done work and serves the open lessons under deterministic ids.
function regen(newServe, oldTasks, checkedMap) {
  const weekData = { tasks: clone(oldTasks) };
  const snapChecked = clone(checkedMap), snapHist = {};
  Object.keys(checkedMap).forEach(id => { const t = card(oldTasks, id); snapHist[id] = { id, title: t && t.title, who: t && t.who, day: t && t.day, ts: checkedMap[id], checkedOnDay: t && t.day }; });
  const d = { tasks: newServe.map(t => clone(t)), week: "week26" };
  const NOW = Date.parse("2026-10-08T08:00:00");
  const run = new Function("weekData", "snapChecked", "snapHist", "d", "claimed", "lidForTask", "Date", "_gwConsumedCard", "gwCheckTsMs",
    MATCH_BLOCK + "\n return {oldLookup, oldByLid};");
  run(weekData, snapChecked, snapHist, d, {}, t => t.lid || null, { now: () => NOW }, () => false, gwCheckTsMs);
  const commitIds = new Set(d.tasks.map(t => t.id));
  for (const id in snapChecked) if (!commitIds.has(id)) delete snapChecked[id];
  for (const id in snapHist) if (!commitIds.has(id)) delete snapHist[id];
  return { tasks: d.tasks, checked: snapChecked, hist: snapHist };
}
const NT = (who, sk, lid, day, time, extra) => { const s = FX.subjects[who][sk]; const pre = who === "lincoln" ? LIN : ELL;
  return Object.assign({ id: pre + lid, who, subjectKey: sk, lid, day, time, title: (who === "lincoln" ? "📱 Editor in Chief — " : "📄 Reading Detective — ") + s.lessonSeq[s.lessonIds.indexOf(lid)] }, extra || {}); };
const SERVE = [NT("lincoln", "conventions", "L0020", "friday", "11:56 AM"),
  NT("ellis", "read_detect", "L0028", "friday", "10:05 AM"), NT("ellis", "read_detect", "L0029", "saturday", "10:15 AM"),
  NT("ellis", "read_detect", "L0030", "thursday", "2:05 PM", { _eowOverflow: true })];
// keep the untouched (already aligned) checked cards in the served week like the keep-pass does
{
  const out = regen(SERVE, FX.tasks, FX.checked);
  const L20 = card(out.tasks, LIN + "L0020");
  ok("Lincoln's new Sitting 4 card (…_L0020) is NOT born checked", L20 && L20.lid === "L0020" && !out.checked[LIN + "L0020"], { card: L20, ts: out.checked[LIN + "L0020"] });
  const L19 = card(out.tasks, LIN + "L0019");
  ok("Sitting 3 (L0019) keeps its check, now under …_L0019", L19 && L19.lid === "L0019" && out.checked[LIN + "L0019"] === FX.checked[LIN + "L0020"], { card: L19, ck: out.checked });
  ok("…still on Wednesday, title unchanged", L19 && L19.day === "wednesday" && L19.title === "📱 Editor in Chief — Sitting 3");
  ok("…its history travels with it (checkedOnDay wednesday)", out.hist[LIN + "L0019"] && out.hist[LIN + "L0019"].id === LIN + "L0019" && out.hist[LIN + "L0019"].checkedOnDay === "wednesday");
  const E28 = card(out.tasks, ELL + "L0028"), E27 = card(out.tasks, ELL + "L0027");
  ok("Ellis' new Ex. 49–50 card (…_L0028) is NOT born checked", E28 && E28.lid === "L0028" && !out.checked[ELL + "L0028"], { card: E28 });
  ok("Ex. 47–48 (L0027) keeps its check under …_L0027", E27 && E27.lid === "L0027" && out.checked[ELL + "L0027"] === FX.checked[ELL + "L0028"], E27);
  ok("no check-off lost: same number of checks, same times", Object.keys(out.checked).length === Object.keys(FX.checked).length &&
    JSON.stringify(Object.values(out.checked).sort()) === JSON.stringify(Object.values(FX.checked).sort()), out.checked);
  ok("every check sits on the lesson curriculum/done recorded", checksOnTheirLesson(out.tasks, out.checked).length === 0, checksOnTheirLesson(out.tasks, out.checked));
  ok("every plan card's id names its lesson", out.tasks.every(t => t.id.endsWith("_" + t.lid)), out.tasks.map(t => t.id.replace(/^.*__/, "") + "/" + t.lid));
  ok("ids unique", new Set(out.tasks.map(t => t.id)).size === out.tasks.length);
  // then the normal write: seqfill over the committed week, with the committed checks
  const e = mkNorm({ checked: out.checked });
  const r = norm(e, out.tasks);
  ok("seqfill after the regenerate: no ⚠ out-of-sequence", !(r.notes || []).some(n => /⚠/.test(n)), r.notes);
  ok("Lincoln order ascending", ascending(e, out.tasks, "lincoln", "conventions"));
  ok("Ellis order ascending", ascending(e, out.tasks, "ellis", "read_detect"));
  ok("still every id = its lesson after seqfill", out.tasks.every(t => t.id.endsWith("_" + t.lid)));
  const out2 = regen(SERVE, out.tasks, out.checked);
  ok("idempotent: a second regenerate keeps the same checks", JSON.stringify(out2.checked) === JSON.stringify(out.checked), out2.checked);
}
{
  // the generator happens to re-serve the done lesson too: the check lands on that card, the stale id stays clean
  const out = regen(SERVE.concat([NT("lincoln", "conventions", "L0019", "wednesday", "2:45 PM")]), FX.tasks, FX.checked);
  ok("re-served L0019 card carries the check; …_L0020 unchecked", out.checked[LIN + "L0019"] && !out.checked[LIN + "L0020"], out.checked);
  ok("no duplicate L0019 card", out.tasks.filter(t => t.who === "lincoln" && t.lid === "L0019").length === 1, out.tasks.filter(t => t.who === "lincoln").map(t => t.id + "/" + t.lid));
}
{
  // fallback: the lesson's own id is ALREADY checked by another card → nothing moves (old behaviour, never a lost check)
  const chk = Object.assign(clone(FX.checked), { [LIN + "L0019"]: "01:00 PM Oct 7" });
  const old = FX.tasks.map(t => t.id === LIN + "L0019" ? Object.assign(clone(t), { lid: "L0019", day: "wednesday" }) : clone(t));
  const out = regen(SERVE, old, chk);
  ok("both checks still present when the true home is taken", out.checked[LIN + "L0019"] === "01:00 PM Oct 7" && Object.values(out.checked).indexOf(FX.checked[LIN + "L0020"]) >= 0, out.checked);
}

console.log("── 5. wiring ──");
ok("SEQTAGS marker in SEQFILL", /🏷 SEQTAGS \(her yes 2026-10-09, out-of-sequence step 2\)/.test(SEQ_BLOCK));
ok("SEQTAGS marker in gwCommit's re-attach block", /🏷 SEQTAGS/.test(MATCH_BLOCK));
ok("re-key runs BEFORE pass 0", MATCH_BLOCK.indexOf("🏷 SEQTAGS") < MATCH_BLOCK.indexOf("Pass 0 (Stage 3c)"));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
