/*
 * Slices the REAL run-window helpers out of index.html and checks the antibiotic case:
 * a step that runs Aug 3–Aug 12 for Lucy and Lincoln, then retires itself.
 *   run: node test_step_window.js
 */
const fs = require("fs");
const src = fs.readFileSync("/Users/adriennehowe/Desktop/howe-academy/index.html", "utf8");

function fn(name) {
  const i = src.indexOf("function " + name + "(");
  if (i < 0) throw new Error("not found: " + name);
  let d = 0;
  for (let k = src.indexOf("{", i); k < src.length; k++) {
    if (src[k] === "{") d++;
    else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); }
  }
}

let pass = 0, fail = 0;
const ok = (n, c, x) => c ? (pass++, console.log("  ok  - " + n))
                          : (fail++, console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")));

// ── env: pin "today" so the test is deterministic ──
const RealDate = Date;
function pin(iso) {
  globalThis.Date = class extends RealDate {
    constructor(...a) { if (!a.length) super(iso + "T09:00:00"); else super(...a); }
    static now() { return new RealDate(iso + "T09:00:00").getTime(); }
  };
}
globalThis.DAY_DT = { monday: "August 3", tuesday: "August 4", wednesday: "August 5",
                      thursday: "August 6", friday: "August 7" };
globalThis._todayDay = "monday";
globalThis.day = "monday";
globalThis.momModeActive = false; globalThis.adminPinUnlocked = false;
globalThis.momHere = () => globalThis.momModeActive || globalThis.adminPinUnlocked;
globalThis.slState = {};
globalThis.activeWk = () => "week16";
globalThis.morningRoutineCfg = {};
globalThis.MORNING_STEPS_DEFAULT = {};

pin("2026-08-03");
eval(fn("routineDateISO"));
eval(fn("stepWindowOk"));
eval(fn("stepWindowLabel"));
eval(fn("morningStepsFor"));
eval(fn("mStepDoneOn"));
eval(fn("morningDueIdx"));
eval(fn("morningComplete"));

// Lincoln: his 8 real steps, plus the antibiotic running Aug 3 → Aug 12
const ANTIBIOTIC = { label: "Take antibiotic", emoji: "💊", from: "2026-08-03", to: "2026-08-12", time: "8 AM" };
globalThis.morningRoutineCfg.lincoln = [
  { label: "Brush Teeth", emoji: "🦷" }, { label: "Take vitamins", emoji: "💊" },
  ANTIBIOTIC,
  { label: "Get clothes on", emoji: "👕" },
];

console.log("Run window — antibiotic Aug 3 → Aug 12\n");

console.log("today = Mon Aug 3 (first day of the course)");
ok("all 4 steps apply", morningDueIdx("lincoln", "monday").length === 4, morningDueIdx("lincoln", "monday"));
ok("label reads 'thru 8/12'", stepWindowLabel(ANTIBIOTIC) === "thru 8/12", stepWindowLabel(ANTIBIOTIC));

console.log("\nmid-course (Wed Aug 5)");
ok("still applies", stepWindowOk(ANTIBIOTIC, "wednesday") === true);

console.log("\nbefore it starts");
const LATER = { label: "Take antibiotic", from: "2026-08-10", to: "2026-08-20" };
ok("not shown before the start date", stepWindowOk(LATER, "monday") === false);
ok("label reads 'starts 8/10'", stepWindowLabel(LATER) === "starts 8/10", stepWindowLabel(LATER));

console.log("\nafter the course ends — jump the clock to Aug 20");
pin("2026-08-20");
globalThis.DAY_DT = { monday: "August 17", tuesday: "August 18", wednesday: "August 19",
                      thursday: "August 20", friday: "August 21" };
globalThis._todayDay = "thursday"; globalThis.day = "thursday";
ok("retires itself", stepWindowOk(ANTIBIOTIC, "thursday") === false);
ok("drops out of the morning list", morningDueIdx("lincoln", "thursday").length === 3, morningDueIdx("lincoln", "thursday"));
ok("label reads '✓ ended 8/12'", stepWindowLabel(ANTIBIOTIC) === "✓ ended 8/12", stepWindowLabel(ANTIBIOTIC));

console.log("\nTHE TRAP: check-off keys are _mstep<i> — indexes must NOT shift");
// Lincoln checked steps 0,1,3 on Aug 20 (the antibiotic at index 2 no longer applies)
globalThis.slState["week16_thursday_lincoln_mstep0"] = { done: true };
globalThis.slState["week16_thursday_lincoln_mstep1"] = { done: true };
globalThis.slState["week16_thursday_lincoln_mstep3"] = { done: true };
ok("'Get clothes on' is still index 3, not 2",
   morningDueIdx("lincoln", "thursday").join(",") === "0,1,3", morningDueIdx("lincoln", "thursday"));
ok("morning completes without the retired step", morningComplete("lincoln", "thursday") === true);

console.log("\ngate safety");
ok("an unchecked in-window step still holds the gate", (() => {
  pin("2026-08-03");
  globalThis.DAY_DT = { monday: "August 3" };
  globalThis._todayDay = "monday"; globalThis.day = "monday";
  globalThis.slState = { "week16_monday_lincoln_mstep0": { done: true },
                         "week16_monday_lincoln_mstep1": { done: true },
                         "week16_monday_lincoln_mstep3": { done: true } };
  return morningComplete("lincoln", "monday") === false;   // antibiotic (idx 2) still unchecked
})());
ok("no window set = always runs", stepWindowOk({ label: "Brush Teeth" }, "monday") === true);
ok("unknown date never hides a step", stepWindowOk(ANTIBIOTIC, "someday") === true);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
