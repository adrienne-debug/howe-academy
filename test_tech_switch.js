/*
 * Node tests — 📱 TECHSWITCH (her ask 2026-10-08): Mom's Day tech on/off per kid per day.
 * techOff/{kid}/{wk}/{day} = Mom took it by hand; giving it back clears that AND grants grace if the
 * Morning-by-10 rule had also taken it. Only Mom (momHere) can flip it.
 *   run:  node test_tech_switch.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(name) {
  const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}" && --d === 0) return src.slice(i, k + 1); }
}
const FNS = ["loseTechHour", "techGraced", "techTaken", "techToggle", "techLost", "techBanner", "techGrantGrace"].map(slice).join("\n");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
function world(o) {
  o = o || {};
  const log = { writes: [], toasts: [], renders: 0 };
  const env = {
    routineRules: Object.assign({ loseTechEnabled: false, loseTechHour: 10 }, o.rules || {}),
    activeWk: () => "week26", _todayDay: "thursday", _isPastDay: () => false, breakPause: () => false,
    morningComplete: (k) => !!(o.morn || {})[k], momHere: () => o.mom !== false,
    gwShowToast: m => log.toasts.push(m), renderAll: () => log.renders++, rtFmtHour: h => h + ":00",
    db: { ref: p => ({ set: v => log.writes.push(["set", p, v]), remove: () => log.writes.push(["remove", p]) }) },
    Date: class { getHours() { return o.hour == null ? 9 : o.hour; } },
  };
  const keys = Object.keys(env);
  const api = new Function(...keys, "let techGrace=" + JSON.stringify(o.grace || {}) + ", techOff=" + JSON.stringify(o.off || {}) + ", day='thursday';\n" + FNS +
    "\nreturn {techTaken,techToggle,techLost,techBanner,techGrantGrace,state:()=>({techGrace,techOff})};")(...keys.map(k => env[k]));
  return { api, log };
}
console.log("── take away / give back by hand (rule OFF) ──");
{
  const w = world();
  ok("starts with tech", !w.api.techLost("ava", "thursday"));
  w.api.techToggle("ava", "thursday");
  ok("tap → no tech", w.api.techLost("ava", "thursday") && w.api.techTaken("ava", "thursday"));
  ok("writes ONLY techOff/ava/week26/thursday = true", w.log.writes.length === 1 && w.log.writes[0].join() === "set,techOff/ava/week26/thursday,true", w.log.writes);
  ok("other kids + other days untouched", !w.api.techLost("ben", "thursday") && !w.api.techLost("ava", "friday"));
  ok("kid banner says Mom's call", /Mom\\'s call|Mom's call/.test(w.api.techBanner("ava")));
  w.api.techToggle("ava", "thursday");
  ok("tap again → tech back", !w.api.techLost("ava", "thursday"));
  ok("…by removing that one path (no grace written when the rule isn't on)", w.log.writes.length === 2 && w.log.writes[1].join() === "remove,techOff/ava/week26/thursday", w.log.writes);
  ok("re-renders each tap", w.log.renders === 2);
}
console.log("\n── with the Morning-by-10 rule ──");
{
  const w = world({ rules: { loseTechEnabled: true }, hour: 11 });
  ok("rule took it (Morning not done, past 10)", w.api.techLost("ava", "thursday") && !w.api.techTaken("ava", "thursday"));
  w.api.techToggle("ava", "thursday");
  ok("tap gives it back = grants grace (same as 🙏 Grant grace)", !w.api.techLost("ava", "thursday") && w.log.writes.length === 1 && w.log.writes[0].join() === "set,techGrace/ava/week26/thursday,true", w.log.writes);
  w.api.techToggle("ava", "thursday");
  ok("tap again → Mom takes it by hand even with grace", w.api.techLost("ava", "thursday") && w.api.techTaken("ava", "thursday"));
  w.api.techToggle("ava", "thursday");
  ok("and back again: her flag removed, grace still there", !w.api.techLost("ava", "thursday") && w.log.writes[w.log.writes.length - 1].join() === "remove,techOff/ava/week26/thursday");
}
{
  const w = world({ rules: { loseTechEnabled: true }, hour: 11, off: { ava: { week26: { thursday: true } } } });
  w.api.techToggle("ava", "thursday");
  ok("taken BOTH ways → one tap clears hers and grants grace", !w.api.techLost("ava", "thursday") && w.log.writes.map(x => x[0] + " " + x[1]).join("|") === "remove techOff/ava/week26/thursday|set techGrace/ava/week26/thursday", w.log.writes);
}
{
  const w = world({ rules: { loseTechEnabled: true }, hour: 11, off: { ava: { week26: { thursday: true } } } });
  w.api.techGrantGrace("ava");
  ok("Settings' 🙏 Grant grace also clears Mom's hand flag", !w.api.techLost("ava", "thursday") && !w.api.techTaken("ava", "thursday"));
}
{
  const w = world({ rules: { loseTechEnabled: false } , off: { julian: { week26: { thursday: true } } } });
  ok("Mom's call applies to any kid, rule off or on (no hard-coded exemptions)", w.api.techLost("julian", "thursday"));
}
console.log("\n── Mom only ──");
{
  const w = world({ mom: false });
  w.api.techToggle("ava", "thursday");
  ok("locked → nothing written, a toast says to unlock", w.log.writes.length === 0 && !w.api.techLost("ava", "thursday") && /Unlock Mom/.test(w.log.toasts[0] || ""));
}
console.log("\n── wiring ──");
{
  ok("the tech flag listens live (kid devices update)", /db\.ref\("techOff"\)\.on\("value"/.test(src));
  const kt = slice("mdCardKidsToday");
  ok("Mom's Day row has the switch under the − [5] + box", kt.indexOf("techToggle(") > kt.indexOf("mpBankAdj(\\''+kid+'\\',1)"));
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
