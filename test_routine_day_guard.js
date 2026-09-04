/*
 * Slices the REAL routineEditable + toggleMorningStep + toggleRtStep + toggleSlot out of
 * index.html and asserts a kid can no longer file a routine under a day they're only viewing.
 * Reproduces the 2026-08-03 case: day tab = wednesday, actual today = monday.
 *   run: node test_routine_day_guard.js
 */
const fs = require("fs");
const src = fs.readFileSync("/Users/adriennehowe/Desktop/howe-academy/index.html", "utf8");

function slice(name) {
  const sig = "function " + name + "(";
  const i = src.indexOf(sig);
  if (i < 0) throw new Error("not found: " + name);
  let d = 0;
  for (let k = src.indexOf("{", i); k < src.length; k++) {
    if (src[k] === "{") d++;
    else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); }
  }
  throw new Error("unbalanced: " + name);
}

const FNS = ["routineEditable", "toggleMorningStep", "toggleSlot", "slKey", "getSlot",
             "morningStepsFor", "_mrLegacySteps", "morningComplete", "mStepDoneOn",
             // a blocked tap now explains itself (toast) — the helper and its `cap` come along
             "_rtBlockedToast", "cap",
             // morningComplete now masks by run-window, so its helpers come along
             "morningDueIdx", "stepWindowOk", "routineDateISO"].map(slice).join("\n");

let pass = 0, fail = 0;
const ok = (n, c, x) => c ? (pass++, console.log("  ok  - " + n))
                          : (fail++, console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")));

function scenario({ dayTab, today, mom }) {
  const env = {
    day: dayTab, _todayDay: today,
    momModeActive: !!mom, adminPinUnlocked: false,
    slState: {}, mrOpen: {}, morningRoutineCfg: {}, db: null, tab: "skylight",
    DAY_DT: { monday: "August 3", wednesday: "August 5", friday: "August 7" },
    dbWrites: [], localWrites: [],
    MORNING_STEPS_DEFAULT: { lincoln: [{ label: "Brush Teeth" }, { label: "Take vitamins" }] },
    activeWk: () => "week16",
    momHere: function () { return this.momModeActive || this.adminPinUnlocked; },
    nowTs: () => "10:23 AM Aug 3",
    rlogAppend: () => {},
    gwShowToast: () => {},
    rtBonusSettle: () => {},   // list-bonus side effect, not under test here
    renderSkylight: () => {},
    renderSchedule: () => {},
    document: { getElementById: () => null },
  };
  env.momHere = () => env.momModeActive || env.adminPinUnlocked;
  env.sv = (k, v) => env.localWrites.push(k);

  const names = Object.keys(env);
  // eslint-disable-next-line no-new-func
  new Function(...names, FNS + "\n; toggleMorningStep('lincoln',0);")(...names.map(n => env[n]));
  return env;
}

console.log("routine check-offs bind to the day you're ON, not the day you're viewing\n");

// 1. The actual bug: viewing Wednesday, today is Monday, kid taps.
let e = scenario({ dayTab: "wednesday", today: "monday", mom: false });
ok("kid on a non-today tab writes nothing", Object.keys(e.slState).length === 0, e.slState);
ok("  ...and no Wednesday key is created",
   !Object.keys(e.slState).some(k => k.includes("wednesday")), Object.keys(e.slState));

// 2. Normal case must still work.
e = scenario({ dayTab: "monday", today: "monday", mom: false });
ok("kid on today's tab still checks off",
   e.slState["week16_monday_lincoln_mstep0"] &&
   e.slState["week16_monday_lincoln_mstep0"].done === true, e.slState);

// 3. Mom keeps the ability to back-fill a missed day.
e = scenario({ dayTab: "wednesday", today: "monday", mom: true });
ok("Mom can still back-fill another day",
   e.slState["week16_wednesday_lincoln_mstep0"] &&
   e.slState["week16_wednesday_lincoln_mstep0"].done === true, e.slState);

// 4. The derived slot must not be written either (it gated the schedule unlock).
e = scenario({ dayTab: "friday", today: "monday", mom: false });
ok("locked tap leaves the derived _morning slot alone",
   e.slState["week16_friday_lincoln_morning"] === undefined, e.slState);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
