/*
 * ⏱ Math Sprints end-of-time buzzer (her report 2026-10-07: "the end-of-time sound is slow to start, which gives the
 * kid an extra second"). The minute ends at EXACTLY 60.000 s — even when the browser delivers interval ticks late — and
 * at that moment: the clock reads 0:00, one loud, short, abrupt buzz starts with no fade-in, and input locks (Start
 * can't restart the clock, "Pencils down" shows, a tap in the first moment can't hit Met / Not).
 *   run:  node test_sprint_buzz.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// MSPRINT_START"), b = src.indexOf("// MSPRINT_END");
if (a < 0 || b < 0 || src.indexOf("// MSBUZZ_START") < a || src.indexOf("// MSBUZZ_END") > b) { console.error("MSPRINT / MSBUZZ markers not found"); process.exit(1); }
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }

// A fake world: a controllable clock, timers that fire on that clock (intervals optionally LATE), a recording
// AudioContext, and the few DOM nodes the timer paints.
function world(o) {
  o = o || {};
  let now = 1000; const timers = []; let tid = 0;
  const lag = o.lag || 1;   // 1.25 → every interval tick arrives 25% late (a busy / throttled tab)
  const audio = { made: 0, oscs: [], gains: [] };
  function Ctx() { audio.made++; this.state = "running"; this.destination = {}; }
  Object.defineProperty(Ctx.prototype, "currentTime", { get() { return now / 1000; } });
  Ctx.prototype.resume = function () { this.state = "running"; return Promise.resolve(); };
  Ctx.prototype.createOscillator = function () { const r = { type: "sine", frequency: {}, started: null, stopped: null, connect() {}, disconnect() {}, start(t) { r.started = t === undefined ? now / 1000 : t; }, stop(t) { r.stopped = t === undefined ? now / 1000 : t; } }; audio.oscs.push(r); return r; };
  Ctx.prototype.createGain = function () { const ev = []; const r = { ev, connect() {}, disconnect() {}, gain: { set value(v) { ev.push(["value", v]); }, setValueAtTime(v, t) { ev.push(["set", v, t]); }, linearRampToValueAtTime(v, t) { ev.push(["lin", v, t]); }, exponentialRampToValueAtTime(v, t) { ev.push(["exp", v, t]); } } }; audio.gains.push(r); return r; };
  const els = {};
  ["ms-timer", "ms-timer-bar", "ms-start", "ms-pencils", "ms-mark"].forEach(id => els[id] = { id, textContent: "", disabled: false, style: {} });
  const writes = [];
  const ctx = {
    console, masteryKid: "lincoln", mastView: "sprint", sprintSource: "book", tab: "mastery",
    SL_KLBL: { lincoln: "Lincoln" }, _todayDay: "thursday", weekData: { tasks: [] }, checked: {}, claimed: {},
    momHere: () => o.who !== "kid", nowTs: () => "10:00 AM Oct 7", cbTodayISO: () => "2026-10-07",
    effectiveDay: t => t.day, toMin: () => 0, tsToMin: () => 0, finalizeDone: () => true, showPaceToast: () => {},
    dbg: () => {}, gwShowToast: () => {}, renderAll: () => {}, _mastRe: () => {}, showTab: () => {},
    bbChime: () => { audio.chimed = (audio.chimed || 0) + 1; },
    _dryRun: () => false, db: { ref: p => ({ update: v => writes.push([p, v]), set: v => writes.push([p, v]) }) },
    document: { getElementById: id => els[id] || null },
    performance: { now: () => now },
    window: { AudioContext: Ctx },
    setInterval: (fn, ms) => { const t = { id: ++tid, fn, ms, every: ms * lag, at: now + ms * lag, live: true }; timers.push(t); return t.id; },
    clearInterval: id => timers.forEach(t => { if (t.id === id) t.live = false; }),
    setTimeout: (fn, ms) => { const t = { id: ++tid, fn, ms, at: now + ms, once: true, live: true }; timers.push(t); return t.id; },
    clearTimeout: id => timers.forEach(t => { if (t.id === id) t.live = false; }),
    Object, Array, String, Number, Math, Date, JSON, RegExp, parseInt, Promise,
  };
  vm.createContext(ctx);
  vm.runInContext("let bbAlarmCtx=null;\n" + src.slice(src.indexOf("function bbAudioUnlock("), src.indexOf("\n}", src.indexOf("function bbAudioUnlock(")) + 2) + "\n" + src.slice(a, b), ctx);
  vm.runInContext("lbScansMS=" + JSON.stringify({ "sm-sprints-4": { lessons: ["Sprint 401 · Place Value", "Sprint 402 · Count On"] } }) + "; mathSprints=" + JSON.stringify({ lincoln: { book: "sm-sprints-4", cur: 401 } }) + ";", ctx);
  // run every timer due up to time T, in time order
  function advanceTo(T) {
    for (;;) {
      const due = timers.filter(t => t.live && t.at <= T).sort((x, y) => x.at - y.at)[0];
      if (!due) break;
      now = due.at;
      if (due.once) due.live = false; else due.at += due.every;
      due.fn();
    }
    now = T;
  }
  return { ctx, els, audio, writes, timers, call: e => vm.runInContext(e, ctx), t0: 1000, advanceTo, now: () => now };
}
const buzzOscs = w => w.audio.oscs.filter(x => x.type === "square");

console.log("⏱ the minute ends at exactly 60.000 s");
{
  const w = world();
  w.call("msTimerStart()");
  ok("Start shows 1:00", w.els["ms-timer"].textContent === "1:00", w.els["ms-timer"].textContent);
  w.advanceTo(w.t0 + 30000);
  ok("halfway reads 0:30", w.els["ms-timer"].textContent === "0:30", w.els["ms-timer"].textContent);
  w.advanceTo(w.t0 + 59999);
  ok("one millisecond before the end it still reads 0:01", w.els["ms-timer"].textContent === "0:01", w.els["ms-timer"].textContent);
  ok("…and no buzz yet", buzzOscs(w).length === 0, buzzOscs(w).length);
  ok("…and Mom's Met / Not is still hidden", w.els["ms-mark"].style.display === "none", w.els["ms-mark"].style.display);
  w.advanceTo(w.t0 + 60000);
  ok("at 60.000 s the clock reads 0:00", w.els["ms-timer"].textContent === "0:00", w.els["ms-timer"].textContent);
  ok("…the buzz starts at that same moment", buzzOscs(w).length >= 1 && buzzOscs(w).every(x => Math.abs(x.started - (w.t0 + 60000) / 1000) < 1e-9), buzzOscs(w).map(x => x.started));
  ok("…the timer is marked done", w.call("msTimerDone") === true);
  ok("the old soft chime is not used for the sprint end", !w.audio.chimed, w.audio.chimed);
}
{
  const w = world({ lag: 1.25 });   // every interval tick arrives 25% late
  w.call("msTimerStart()");
  w.advanceTo(w.t0 + 59999);
  ok("late ticks: still no buzz at 59.999 s", buzzOscs(w).length === 0);
  w.advanceTo(w.t0 + 60000);
  ok("late ticks: the end still lands at exactly 60.000 s (the old 60 × setInterval would end at ~75 s)", buzzOscs(w).length >= 1 && w.call("msTimerDone") === true && w.els["ms-timer"].textContent === "0:00");
  const n = buzzOscs(w).length; w.advanceTo(w.t0 + 90000);
  ok("…and it buzzes only once (the late tick doesn't ring it again)", buzzOscs(w).length === n, [n, buzzOscs(w).length]);
}

console.log("🔊 the buzz: loud, short, abrupt");
{
  const w = world();
  w.call("msTimerStart()"); w.advanceTo(w.t0 + 60000);
  const T = (w.t0 + 60000) / 1000, os = buzzOscs(w);
  ok("square-wave tones (a buzzer, not a sine chime)", os.length >= 1 && os.every(x => x.type === "square"), os.map(x => x.type));
  ok("short — over in well under a second", os.every(x => x.stopped - T <= 0.7), os.map(x => +(x.stopped - T).toFixed(3)));
  const g = w.audio.gains.find(gg => gg.ev.some(e => e[0] === "set" && e[2] === T));
  ok("full volume from its first instant — no fade-in", g && g.ev[0][0] === "set" && g.ev[0][2] === T && g.ev[0][1] >= 0.4, g && g.ev);
  ok("no ramp before the peak (the old chime faded in over 50 ms)", g && !g.ev.some(e => (e[0] === "exp" || e[0] === "lin") && e[1] > 0.01));
  const off = g && g.ev.find(e => e[0] === "lin" && e[1] < 0.01);
  ok("a hard stop — the release is ≤ 20 ms", off && off[2] - g.ev[1][2] <= 0.02, g && g.ev);
  ok("the buzz plays on the context the Start tap unlocked (no new context at 0:00)", w.audio.made === 1, w.audio.made);
}
{
  const w = world();
  w.call("msTimerStart()");
  const ka = w.audio.oscs.filter(x => x.type !== "square");
  ok("an inaudible keep-alive tone runs for the minute, so the speaker is awake at 0:00", ka.length === 1 && ka[0].started != null && ka[0].stopped == null);
  const kg = w.audio.gains[0];
  ok("…far below hearing", kg && kg.ev.length === 1 && kg.ev[0][1] <= 0.001, kg && kg.ev);
  w.advanceTo(w.t0 + 60000);
  ok("…and it stops when the minute ends", ka[0].stopped != null);
}

console.log("🔒 input locks the moment time ends");
{
  const w = world();
  w.call("msTimerStart()");
  ok("Start is disabled while running", w.els["ms-start"].disabled === true);
  w.advanceTo(w.t0 + 40000);
  w.call("msTimerStart()");   // a re-tap at 0:20 used to restart the clock at 1:00
  ok("a re-tap mid-run does not restart the clock", w.els["ms-timer"].textContent === "0:20", w.els["ms-timer"].textContent);
  w.advanceTo(w.t0 + 60000);
  ok("…and the run still ends at the original 60 s", w.call("msTimerDone") === true);
  ok("Start is hidden and disabled at 0:00", w.els["ms-start"].style.display === "none" && w.els["ms-start"].disabled === true);
  ok("'Pencils down' shows at 0:00", w.els["ms-pencils"].style.display === "block");
  ok("the clock turns red at 0:00", w.els["ms-timer"].style.color === "#dc2626", w.els["ms-timer"].style.color);
  w.advanceTo(w.t0 + 61000);
  w.call("msTimerStart()");
  ok("Start after 0:00 does nothing — no second minute until Mom marks", w.call("msTimerDone") === true && w.els["ms-timer"].textContent === "0:00" && buzzOscs(w).length === 2);
}
{
  const w = world();
  w.call("msTimerStart()"); w.advanceTo(w.t0 + 60000);
  ok("Mom's Met / Not appears at 0:00", w.els["ms-mark"].style.display === "flex");
  w.advanceTo(w.t0 + 60300);
  ok("a tap 0.3 s after 0:00 can't mark the run", w.call("msRecordRun('lincoln',true)") === null && w.writes.length === 0, w.writes);
  w.advanceTo(w.t0 + 61500);
  const r = w.call("msRecordRun('lincoln',true)");
  ok("Mom's deliberate tap a moment later records it", r && r.met === true && w.writes.length === 1, r);
  ok("…and marking resets the timer for the next run", w.call("msTimerDone") === false);
  w.call("msTimerStart()");
  ok("…so the next run's Start works", w.els["ms-timer"].textContent === "1:00" && w.call("!!msTimer"));
}
{
  const w = world();
  ok("Mom can still mark without running the timer (paper timed elsewhere)", (w.call("msRecordRun('lincoln',false)") || {}).met === false);
}

console.log("🖼 the panel after 0:00");
{
  const w = world();
  w.call("msTimerStart()"); w.advanceTo(w.t0 + 60000);
  const h = w.call("buildSprintBookHtml('#2563eb')");
  ok("a re-render keeps 'Pencils down' showing", /id="ms-pencils" style="display:block/.test(h));
  ok("a re-render keeps Start disabled", /<button id="ms-start" onclick="msTimerStart\(\)" disabled/.test(h));
  ok("a re-render shows 0:00 in red", /color:#dc2626" id="ms-timer">0:00</.test(h));
  const w2 = world(); const h2 = w2.call("buildSprintBookHtml('#2563eb')");
  ok("before a run: Start is live and 'Pencils down' is hidden", /<button id="ms-start" onclick="msTimerStart\(\)" style=/.test(h2) && /id="ms-pencils" style="display:none/.test(h2) && />1:00</.test(h2));
}
console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
