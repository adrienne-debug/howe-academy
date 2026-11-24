/*
 * Node tests for 🎉 Seasons & Events — SEASONHOLD (her "Yes, add it" 2026-11-23): the 📅 Schedule pop-up gets an "Ends (optional)"
 * box and "⏰ Hold this time — school is planned around it", the calendar form's own rule (index.html EVHOLD).
 *   · a new event gets mins only when start + end make a readable length, hold:true only when ticked AND that length is there
 *   · ticked without a length → the pop-up says why and saves nothing; never hold:false / mins:0
 *   · all three modes (One day · Every week · Pick days) and ↪ Move (pre-filled from the event; change; clear)
 *   · 🤐 shows no boxes and nothing new is written · a ✨ hint's event still only says "A surprise"
 *   · after a REAL write, each event made / changed / removed goes to evHoldRelay(id, was, now) — new day, move, take off,
 *     delete the idea, switch to 🤐 — never in ?dryrun=1
 *   · a HELD day taken off (✕ one · take all off · 🌙): the re-plan's Undo puts the idea's link back too (the REAL relayWeek /
 *     _rlwUndoUpd / _rlwApplyLocal / stApplyLocal from index.html); delete-idea / switch-to-🤐 Undo stays event-only (the hub's call)
 *   · an old index.html without the ev* helpers: no boxes, the pop-up still works, a Move leaves mins/hold alone
 * The calendar's REAL evMin / evHoldMins / evHeld / fromMin / evHoldRelay / relayWeek / _rlwUndoUpd / _rlwApplyLocal / stApplyLocal are
 * cut out of index.html; relayWeek's timer never fires (setTimeout is a stub), so the pending re-plan (_rlwPend) can be read.
 *
 *   run:  node test_seasons_8.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
const MSRC = fs.readFileSync(path.join(__dirname, process.env.SN_SRC || "seasons.js"), "utf8");
const HTML = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function fnSrc(name) {
  const i = HTML.indexOf("\nfunction " + name + "(");
  if (i < 0) throw new Error("not found in index.html: " + name);
  let j = HTML.indexOf("{", i), d = 0, k = j;
  for (; k < HTML.length; k++) { const c = HTML[k]; if (c === "{") d++; else if (c === "}") { d--; if (!d) break; } }
  return HTML.slice(i + 1, k + 1);
}
const EVSRC = ["evMin", "evHoldMins", "evHeld", "fromMin", "evHoldRelay"].map(fnSrc).join("\n");
const RWSRC = "let _rlwPend=null, _rlwTimer=null;\n" + (HTML.match(/\nconst RLW_WAIT_MS=[^\n]*/) || [""])[0] + "\n" + ["relayWeek", "_rlwUndoUpd", "_rlwApplyLocal", "stApplyLocal"].map(fnSrc).join("\n");
const ONBOARD = d => d >= "2026-11-23" && d <= "2026-11-27";   // the built week

function momWorld(withHold, noRelayWeek) {
  const el = id => ({ id, innerHTML: "", value: "", style: {}, focus() {}, appendChild() {} });
  const nodes = {}, root = el("root");
  const o = { writes: [], toasts: [], relays: [], relayed: [], dry: false, mom: true, LS: {}, root, today: "2026-11-20" };   // a Friday
  const document = { getElementById(id) { return nodes[id] || (nodes[id] = el(id)); }, createElement(t) { return el(t); }, head: { appendChild() {} } };
  const db = { ref(p) { const P = p === undefined ? "" : p; return {
    update(v) { o.writes.push({ op: "update", path: P, val: JSON.parse(JSON.stringify(v)) }); }, set(v) { o.writes.push({ op: "set", path: P, val: v }); }, remove() { o.writes.push({ op: "remove", path: P }); },
    on() {}, once() {} }; } };
  const ctx = { console: { log: console.log, warn() {} }, Date, Math, JSON, String, document, db, _todayStr: () => o.today, _dryRun: () => o.dry, momHere: () => o.mom, _kioskD: () => false,
    gwShowToast: m => o.toasts.push(m), HA_LS: { getItem: k => (k in o.LS ? o.LS[k] : null), setItem: (k, v) => { o.LS[k] = String(v); } },
    tab: "moms-plan", mpSubView: "seasons", momSchedView: false, renderMomsPlan() {}, mpGoto() {},
    grData: { items: {} }, momdayData: {}, setTimeout: fn => 0,
    bankDirect: () => "bd1", bankDirectRemove() {}, cuUnpay: () => false, choreVerifyOn: () => false,
    clearTimeout() {}, dbg() {}, _rlwOnBoard: ONBOARD, __rec: o.relays, __rw: o.relayed };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext("const ROSTER_DEF=[{id:'ava',name:'Ava',color:'#2563eb'},{id:'ben',name:'Ben',color:'#16a34a'}]; var calendarData={events:{}}; var daddayData={};", ctx);
  if (withHold) vm.runInContext(EVSRC + "\nvar __realRelay=evHoldRelay; evHoldRelay=function(id,w,n){ const r=__realRelay(id,w,n); __rec.push({id:id,was:w,now:n,ret:r}); return r; };", ctx);
  if (withHold && !noRelayWeek) vm.runInContext(RWSRC + "\nvar __realRW=relayWeek; relayWeek=function(w,i){ __rw.push({why:w,info:JSON.parse(JSON.stringify(i||{}))}); return __realRW(w,i); };", ctx);
  vm.runInContext(MSRC, ctx);
  o.W = ctx; o.T = ctx._snTest; o.cal = () => vm.runInContext("calendarData", ctx);
  o.pend = () => (withHold && !noRelayWeek) ? vm.runInContext("_rlwPend", ctx) : null;
  o.planned = () => o.relayed.filter(r => r.info && r.info.label).length;   // re-plans the door asked for (the link-only call has no label)
  o.run = js => vm.runInContext(js, ctx);
  o.set = (d, sec, ev, today) => { o.today = today || "2026-11-20"; o.writes.length = 0; o.toasts.length = 0; o.relays.length = 0; o.relayed.length = 0; o.dry = false; o.mom = true;
    if (withHold && !noRelayWeek) vm.runInContext("_rlwPend=null;", ctx);
    const cp = x => JSON.parse(JSON.stringify(x || {})); o.T.setData(cp(d), cp(sec)); o.T.reset(); o.cal().events = cp(ev);
    o.T.setJobs({}); o.T.setRoot(root, ""); o.T.ddFresh(true); };
  o.last = () => o.writes[o.writes.length - 1];
  o.html = () => root.innerHTML;
  return o;
}
const SEASON = (ideas) => ({ list: { xmas: { name: "Christmas 2026", emoji: "🎄", kind: "holiday", start: "2026-11-20", end: "2026-12-31", ts: 1 } }, ideas: { xmas: ideas } });
const IDEAS = () => ({
  m1: { t: "Movie night", emoji: "🎬", by: "mom", ts: 2 },                                  // no day yet
  g1: { t: "Gingerbread houses", emoji: "🏠", by: "mom", ts: 3, ev: { e1: true } },        // HELD Tue Nov 24 2:30–4:00
  p1: { t: "Piano party", emoji: "🎹", by: "mom", ts: 4, ev: { e2: true } } });             // a length, not held
const SECRET = () => ({ xmas: {
  h1: { t: "Sleigh ride", by: "mom", ts: 5, hide: "hint", ev: { eh: true } },             // ✨ hint
  z1: { t: "Big present hunt", by: "mom", ts: 6, hide: "none", on: { o1: { d: "2026-12-01" } } } } });   // 🤐
const EV = () => ({
  e1: { title: "Gingerbread houses", date: "2026-11-24", time: "2:30 PM", who: "family", emoji: "🏠", addedBy: "mom", mins: 90, hold: true },
  e2: { title: "Piano party", date: "2026-11-25", time: "2:00 PM", who: "family", emoji: "🎹", addedBy: "mom", mins: 60 },
  eh: { title: "A surprise", date: "2026-11-28", time: "", who: "family", emoji: "✨", addedBy: "mom" } });
const calKeys = v => Object.keys(v).filter(p => /^calendar\/events\/[^\/]+$/.test(p)).sort((a, b) => v[a].date.localeCompare(v[b].date));
const WHY = "To hold the time, give a start and an end like 2:30 PM and 4:00 PM.";
const form = (o, f) => Object.assign(o.T.edit().form, f);

const o = momWorld(true), W = o.W, T = o.T;
const reset = () => o.set(SEASON(IDEAS()), SECRET(), EV());

console.log("\n# nothing new to read, store or guard");
{
  reset();
  const code = MSRC.replace(/^\s*\/\/.*$/gm, "");
  ok("still the same database calls", (code.match(/db\.ref\(/g) || []).length === 5);
  ok("the write guard is unchanged", T.OK.source === "^(seasons\\/(list|ideas|extra)\\/[^\\/]+|seasonSecret\\/[^\\/]+\\/[^\\/]+|calendar\\/events\\/[^\\/]+|(momday|dadday)\\/\\d{4}-\\d{2}-\\d{2}\\/todos\\/sn[^\\/]+|seasonJobs\\/[^\\/]+\\/[^\\/]+)(\\/|$)", T.OK.source);
  ok("never writes hold:false or mins:0 (a path or a record field)", !/["'](hold|mins)["']\]\s*=\s*(false|0)\b|\b(hold|mins):\s*(false|0)\b/.test(code));
  ok("no scheduler code in the planner (packDay / gwBuild*); relayWeek only to add the idea's link to the door's Undo", !/packDay|gwBuild|packAround|relayUndo/.test(code)
    && (code.match(/relayWeek\(/g) || []).length === 1 && /relayWeek\("calendar",\{undo:back\}\)/.test(code));
  ok("no family's names in the code", !/Lincoln|Ellis|Lucy|Julian|Howe|Burris|DeWalt|Dewalt/.test(MSRC));
  ok("the stale 'no scheduler reads them' comment is gone", !/no scheduler, generator or re-lay code reads them/.test(MSRC));
  ok("the record shape names mins? and hold?", /addedBy, mins\?, hold\?\}/.test(MSRC));
}

console.log("\n# the pop-up: Ends + ⏰ Hold, in all three modes");
{
  reset();
  W.snSched("m1"); T.draw();
  const h = o.html();
  ok("an Ends (optional) box with 4:00 PM", /<span>Ends \(optional\)<\/span><input value="" placeholder="4:00 PM" oninput="snSet\('end',this.value\)">/.test(h));
  ok("…right under Time (optional)", h.indexOf("Time (optional)") < h.indexOf("Ends (optional)") && h.indexOf("Ends (optional)") < h.indexOf("<span>For</span>"));
  ok("the ⏰ switch, off", /<input type="checkbox" onchange="snHold\(this\)"> ⏰ Hold this time — school is planned around it/.test(h));
  ok("the calendar form's grey line under it", h.includes('<div class="sn-sub sn-holdwhy">' + WHY + "</div>"));
  W.snMode("week"); T.draw();
  ok("Every week has them too", /Ends \(optional\)/.test(o.html()) && /Hold this time/.test(o.html()));
  W.snMode("pick"); T.draw();
  ok("Pick days has them too", /Ends \(optional\)/.test(o.html()) && /Hold this time/.test(o.html()));
  W.snSched("z1"); T.draw();
  ok("🤐 (no calendar event): no Ends, no ⏰", !/Ends \(optional\)/.test(o.html()) && !/Hold this time/.test(o.html()));
  W.snSched("h1"); T.draw();
  ok("✨ hint: the boxes are there (its event can hold)", /Ends \(optional\)/.test(o.html()) && /Hold this time/.test(o.html()));
  o.mom = false; W.snSched("m1"); T.draw();
  ok("not Mom's lens (as the calendar form): no boxes", !/Ends \(optional\)/.test(o.html()) && !/Hold this time/.test(o.html()));
  o.mom = true;
}

console.log("\n# ticking ⏰ (as evHoldTick)");
{
  reset(); W.snSched("m1");
  form(o, { time: "2:30 PM", end: "" });
  let el = { checked: true }; W.snHold(el);
  ok("no end: it un-ticks itself", el.checked === false && T.edit().form.hold === false);
  ok("…and the line under it turns red and bold", /class="sn-sub sn-holdwhy no"/.test(o.html()));
  form(o, { time: "morning", end: "4:00 PM" }); el = { checked: true }; W.snHold(el);
  ok("a start the app can't read: un-ticks", el.checked === false);
  form(o, { time: "4:00 PM", end: "2:30 PM" }); el = { checked: true }; W.snHold(el);
  ok("an end before the start: un-ticks", el.checked === false);
  form(o, { time: "2:30 PM", end: "4:00 PM" }); el = { checked: true }; W.snHold(el);
  ok("a readable start + end: it stays on", el.checked === true && T.edit().form.hold === true);
  ok("…and the line is grey again", !/sn-holdwhy no/.test(o.html()));
  el = { checked: false }; W.snHold(el);
  ok("un-ticking turns it off", T.edit().form.hold === false);
}

console.log("\n# One day: what goes on the new event");
{
  const one = (f) => { reset(); W.snSched("m1"); form(o, f); W.snPickDay("2026-11-30"); const v = (o.last() || {}).val || {}; const k = calKeys(v)[0]; return k ? v[k] : null; };
  let e = one({ time: "2:30 PM", end: "4:00 PM" });
  ok("start + end, not ticked: mins only", e && e.mins === 90 && !("hold" in e), e);
  e = one({ time: "2:30 PM", end: "4:00 PM", hold: true });
  ok("ticked: mins + hold:true", e && e.mins === 90 && e.hold === true, e);
  ok("…still the calendar's own record", e && e.title === "Movie night" && e.date === "2026-11-30" && e.time === "2:30 PM" && e.who === "family" && e.addedBy === "mom");
  e = one({ time: "", end: "4:00 PM" });
  ok("an end with no start: no mins", e && !("mins" in e) && !("hold" in e), e);
  e = one({ time: "2:30 PM", end: "soon" });
  ok("an end the app can't read: no mins", e && !("mins" in e), e);
  e = one({ time: "2:30 PM", end: "" });
  ok("no end (as today): the same record as before, nothing new", e && JSON.stringify(e) === JSON.stringify({ title: "Movie night", date: "2026-11-30", time: "2:30 PM", who: "family", emoji: "🎬", addedBy: "mom" }), e);
  reset(); W.snSched("m1"); form(o, { time: "2:30 PM", end: "", hold: true }); W.snPickDay("2026-11-30");
  ok("ticked but no length (the time changed after): nothing saved", o.writes.length === 0);
  ok("…the pop-up says why, in its own message line", T.edit() && T.edit().msg === WHY && o.html().includes('<div class="sn-msg">' + WHY + "</div>"));
  ok("…and stays open", T.edit() && T.edit().type === "sched");
}

console.log("\n# Every week and Pick days");
{
  reset(); W.snSched("m1"); W.snMode("week"); W.snDow(1); form(o, { time: "10:00 AM", end: "11:30 AM", hold: true });
  W.snPutWeeks();
  let v = o.last().val, K = calKeys(v);
  ok("every week: 4 new events, each with mins 90 + hold", K.length === 4 && K.every(k => v[k].mins === 90 && v[k].hold === true), K.map(k => v[k]));
  ok("…in ONE update", o.writes.length === 1);
  reset(); W.snSched("m1"); W.snMode("week"); form(o, { time: "10:00 AM", end: "", hold: true });
  ok("every week, ticked without a length: saves nothing and says why", W.snPutWeeks() === 0 && o.writes.length === 0 && T.edit().msg === WHY);
  reset(); W.snSched("m1"); W.snMode("pick"); W.snPickToggle("2026-11-30"); W.snPickToggle("2026-12-02"); form(o, { time: "1:00 PM", end: "3:00 PM" });
  W.snPutPicked();
  v = o.last().val; K = calKeys(v);
  ok("pick days, not ticked: each gets mins 120, no hold", K.length === 2 && K.every(k => v[k].mins === 120 && !("hold" in v[k])), K.map(k => v[k]));
  reset(); W.snSched("m1"); W.snMode("pick"); W.snPickToggle("2026-11-30"); form(o, { time: "1:00 PM", end: "noon", hold: true });
  ok("pick days, ticked without a length: saves nothing and says why", W.snPutPicked() === 0 && o.writes.length === 0 && T.edit().msg === WHY);
}

console.log("\n# ✨ hint and 🤐");
{
  reset(); W.snSched("h1"); form(o, { time: "6:00 PM", end: "8:00 PM", hold: true }); W.snPickDay("2026-12-03");
  const v = o.last().val, k = calKeys(v)[0];
  ok("✨ hint: its new event holds", v[k].mins === 120 && v[k].hold === true);
  ok("…and still only says “A surprise” ✨", v[k].title === "A surprise" && v[k].emoji === "✨");
  ok("…the real words go nowhere new", !JSON.stringify(o.writes).includes("Sleigh ride"));
  reset(); W.snSched("z1"); form(o, { time: "6:00 PM", end: "8:00 PM", hold: true }); W.snPickDay("2026-12-03");
  const w = o.last().val, P = Object.keys(w);
  ok("🤐: its date kept here only — no calendar event, no mins/hold", P.length === 1 && /^seasonSecret\/xmas\/z1\/on\//.test(P[0]) && JSON.stringify(w[P[0]]) === JSON.stringify({ d: "2026-12-03", time: "6:00 PM" }), w);
  ok("…and no re-plan call", o.relays.length === 0);
}

console.log("\n# ↪ Move: pre-filled from the event; change; clear");
{
  reset(); W.snSched("g1", "e1"); T.draw();
  ok("Ends pre-filled = start + mins", T.edit().form.end === "4:00 PM" && /placeholder="4:00 PM"/.test(o.html()) && /<input value="4:00 PM" placeholder="4:00 PM"/.test(o.html()));
  ok("⏰ pre-ticked (it holds)", T.edit().form.hold === true && /<input type="checkbox" checked onchange="snHold\(this\)">/.test(o.html()));
  W.snPickDay("2026-11-25");
  let v = o.last().val;
  ok("moved: date/time/who as before, plus mins 90 + hold", v["calendar/events/e1/date"] === "2026-11-25" && v["calendar/events/e1/time"] === "2:30 PM" && v["calendar/events/e1/who"] === "family"
    && v["calendar/events/e1/mins"] === 90 && v["calendar/events/e1/hold"] === true, v);
  ok("…the event keeps its id and title", o.cal().events.e1.title === "Gingerbread houses" && o.cal().events.e1.hold === true);
  reset(); W.snSched("g1", "e1"); form(o, { end: "5:00 PM" }); W.snPickDay("2026-11-24");
  ok("a new end: the new length", o.last().val["calendar/events/e1/mins"] === 150);
  reset(); W.snSched("g1", "e1"); form(o, { end: "", hold: false }); W.snPickDay("2026-11-24");
  v = o.last().val;
  ok("Ends emptied + ⏰ off: mins and hold are cleared (null), never false/0", "calendar/events/e1/mins" in v && v["calendar/events/e1/mins"] === null && v["calendar/events/e1/hold"] === null, v);
  ok("…gone from the record", !("mins" in o.cal().events.e1) && !("hold" in o.cal().events.e1));
  reset(); W.snSched("g1", "e1"); form(o, { end: "" }); W.snPickDay("2026-11-24");
  ok("Ends emptied but ⏰ still on: nothing saved, says why", o.writes.length === 0 && T.edit().msg === WHY);
  reset(); W.snSched("g1", "e1"); form(o, { time: "5:00 PM" }); W.snPickDay("2026-11-24");
  ok("a new start after the end, ⏰ on: nothing saved, says why", o.writes.length === 0 && T.edit().msg === WHY);
  reset(); W.snSched("p1", "e2");
  ok("a length but not held: Ends pre-filled, ⏰ off", T.edit().form.end === "3:00 PM" && T.edit().form.hold === false);
  W.snPickDay("2026-11-26");
  v = o.last().val;
  ok("…moved: keeps its length, hold stays absent (null)", v["calendar/events/e2/mins"] === 60 && v["calendar/events/e2/hold"] === null, v);
  ok("…and never writes hold:false", !JSON.stringify(o.writes).includes('"hold":false'));
  reset(); W.snSched("z1", "o1");
  ok("moving a 🤐 date: no Ends pre-fill", T.edit().form.end === "" && T.edit().form.hold === false);
}

console.log("\n# the re-plan door: evHoldRelay(id, was, now) after a real write");
{
  reset(); W.snSched("m1"); form(o, { time: "10:00 AM", end: "11:00 AM", hold: true }); W.snPickDay("2026-11-24");
  const k = calKeys(o.last().val)[0].split("/")[2];
  ok("new day: one call, was = null, now = the new held record", o.relays.length === 1 && o.relays[0].id === k && o.relays[0].was === null && o.relays[0].now.hold === true && o.relays[0].now.mins === 60, o.relays);
  ok("…the real door re-plans (a held block on the built week)", o.relayed.length === 1 && o.relayed[0].why === "calendar" && o.planned() === 1);
  reset(); W.snSched("m1"); form(o, { time: "10:00 AM", end: "11:00 AM" }); W.snPickDay("2026-11-24");
  ok("new day, not held: the door is still asked, and decides nothing needs re-planning", o.relays.length === 1 && o.relayed.length === 0 && o.pend() === null);
  reset(); W.snSched("m1"); W.snMode("week"); form(o, { time: "10:00 AM", end: "11:00 AM", hold: true }); W.snPutWeeks();
  ok("every week: one call per new event", o.relays.length === 4 && o.relays.every(r => r.was === null && r.now && r.now.hold === true));

  reset(); W.snSched("g1", "e1"); W.snPickDay("2026-11-26");
  let r = o.relays[0];
  ok("move: one call; was = the record BEFORE (a copy), now = after", o.relays.length === 1 && r.id === "e1" && r.was.date === "2026-11-24" && r.now.date === "2026-11-26" && r.was.hold === true && r.now.hold === true, o.relays);
  ok("…re-planned (and nothing added to its Undo: a move takes no link off)", o.relayed.length === 1);

  reset(); W.snUnsched("g1", "e1");
  r = o.relays[0];
  ok("✕ take a day off: was = the held record, now = null", o.relays.length === 1 && r.id === "e1" && r.was && r.was.hold === true && r.now === null, o.relays);
  ok("…re-planned once (time no longer held)", o.planned() === 1 && /no longer held/.test(o.relayed[0].info.label));

  reset(); W.snOpenIdea("g1"); W.snUnschedAll("g1"); W.snUnschedAll("g1");
  ok("✕ take all off: the same call", o.relays.length === 1 && o.relays[0].id === "e1" && o.relays[0].now === null);

  reset(); W.snOpenIdea("g1"); W.snDelIdea(); W.snDelIdea();
  ok("delete the idea: was = the held record, now = null", o.relays.length === 1 && o.relays[0].id === "e1" && o.relays[0].was.hold === true && o.relays[0].now === null, o.relays);

  reset(); W.snSkip("g1");
  ok("🌙 not this year (its days come off): the same call", o.relays.length === 1 && o.relays[0].now === null);

  reset(); W.snOpenIdea("g1"); W.snHide("none"); W.snSave();
  ok("switched to 🤐 (its event is removed): was = held, now = null", o.relays.length === 1 && o.relays[0].id === "e1" && o.relays[0].was.hold === true && o.relays[0].now === null, o.relays);
  ok("…re-planned", o.planned() === 1);

  reset(); W.snOpenIdea("g1"); T.edit().form.t = "Gingerbread village"; W.snSave();
  ok("a new name only: the door is asked and changes nothing", o.relays.length === 1 && o.relayed.length === 0);

  reset(); o.dry = true; W.snSched("m1"); form(o, { time: "10:00 AM", end: "11:00 AM", hold: true }); W.snPickDay("2026-11-24");
  ok("?dryrun=1: nothing written and the door is never called", o.writes.length === 0 && o.relays.length === 0);
  reset(); o.dry = true; W.snUnsched("g1", "e1");
  ok("?dryrun=1 take-off: no call", o.relays.length === 0);
  o.dry = false;
}

console.log("\n# Undo after a held day is taken off: the event AND the idea's link come back (the REAL relayWeek + _rlwUndoUpd)");
{
  const held = (t, d) => ({ title: t, date: d, time: "10:00 AM", who: "family", emoji: "🎄", addedBy: "mom", mins: 60, hold: true });
  const UI = () => Object.assign(IDEAS(), { g2: { t: "Cookie bake", emoji: "🍪", by: "mom", ts: 7, ev: { e3: true, e4: true } },   // held Wed + Thu (on the board)
    g3: { t: "Lights tour", by: "mom", ts: 8, ev: { e5: true } },
    g4: { t: "Carols", by: "mom", ts: 10, ev: { e6: true, e7: true } } });                                                           // one held day + one not held                                                               // held, but NOT on the built week
  const US = () => { const x = SECRET(); x.xmas.h2 = { t: "Elf visit", by: "mom", ts: 9, hide: "hint", ev: { eh2: true } }; return x; };
  const UE = () => Object.assign(EV(), { e3: held("Cookie bake", "2026-11-25"), e4: held("Cookie bake", "2026-11-26"), e5: held("Lights tour", "2026-12-10"), e6: held("Carols", "2026-11-23"),
    e7: { title: "Carols", date: "2026-11-24", time: "", who: "family", emoji: "🎄", addedBy: "mom" },
    eh2: Object.assign(held("A surprise", "2026-11-27"), { emoji: "✨" }) });
  const ureset = () => o.set(SEASON(UI()), US(), UE());
  const undoOf = () => { const pd = o.pend(); return pd ? pd.undo : []; };
  const byP = U => { const m = {}; U.forEach(u => { m[u.p] = u; }); return m; };

  ureset(); W.snUnsched("g1", "e1");
  let U = byP(undoOf());
  ok("✕ one held day: the Undo list has the event (as it was)…", U["calendar/events/e1"] && U["calendar/events/e1"].was.hold === true && U["calendar/events/e1"].was.date === "2026-11-24", undoOf());
  ok("…AND the idea's link (was true)", U["seasons/ideas/xmas/g1/ev/e1"] && U["seasons/ideas/xmas/g1/ev/e1"].was === true, undoOf());
  ok("…two paths, ONE pending re-plan (the link call carries no label of its own)", undoOf().length === 2 && o.pend().labels.length === 1 && o.relayed.length === 2 && o.relayed[1].info.undo.length === 1 && !o.relayed[1].info.label);
  const r = o.run("JSON.stringify(_rlwUndoUpd({undo:_rlwPend.undo},[],{wk:'week9',now:1}).upd)"), upd = JSON.parse(r);
  ok("the real _rlwUndoUpd writes BOTH back in its one update", upd["calendar/events/e1"] && upd["calendar/events/e1"].hold === true && upd["calendar/events/e1"].mins === 90 && upd["seasons/ideas/xmas/g1/ev/e1"] === true, upd);
  let threw = null;
  try { o.run("(function(){ const u=" + r + "; Object.keys(u).forEach(function(p){ if(p.indexOf('week9/relayLog/')!==0) _rlwApplyLocal(p,u[p]); }); })()"); } catch (e) { threw = String(e); }
  ok("the real _rlwApplyLocal takes the seasons/… path without throwing (stApplyLocal leaves it alone)", threw === null, threw);
  ok("…the calendar event is back on this device", o.cal().events.e1 && o.cal().events.e1.hold === true && o.cal().events.e1.date === "2026-11-24");
  T.data().ideas.xmas.g1.ev = { e1: true };   // what the planner's own listener brings back from the database
  ok("…and with the link back, the idea is scheduled on that day again (no second event)", T.state(T.idea("xmas", "g1")) === "sched" && T.whens(T.idea("xmas", "g1")).length === 1);

  ureset(); W.snOpenIdea("g2"); W.snUnschedAll("g2"); W.snUnschedAll("g2");
  U = byP(undoOf());
  ok("take all off, two held days: both events and both links in the ONE Undo", undoOf().length === 4 && U["calendar/events/e3"] && U["calendar/events/e4"] && U["seasons/ideas/xmas/g2/ev/e3"].was === true && U["seasons/ideas/xmas/g2/ev/e4"].was === true, undoOf());
  ok("…one write, two re-plan calls joined into one pending re-plan", o.writes.length === 1 && o.planned() === 2 && o.pend().labels.length === 1);

  ureset(); W.snOpenIdea("g4"); W.snUnschedAll("g4"); W.snUnschedAll("g4");
  U = byP(undoOf());
  ok("take all off, one held + one not: only the HELD day's event and link go in the Undo", undoOf().length === 2 && U["calendar/events/e6"] && U["seasons/ideas/xmas/g4/ev/e6"] && !U["seasons/ideas/xmas/g4/ev/e7"] && !U["calendar/events/e7"], undoOf());
  ureset(); T.apply({ "calendar/events/e1": null, "seasons/ideas/xmas/m1/ev/e1": null });
  ok("a link that was not there before never comes back on Undo", !byP(undoOf())["seasons/ideas/xmas/m1/ev/e1"] && !!byP(undoOf())["calendar/events/e1"], undoOf());

  ureset(); W.snUnsched("h2", "eh2");
  U = byP(undoOf());
  ok("a ✨ hint's held day: its link in seasonSecret comes back too", U["seasonSecret/xmas/h2/ev/eh2"] && U["seasonSecret/xmas/h2/ev/eh2"].was === true && U["calendar/events/eh2"].was.title === "A surprise", undoOf());

  ureset(); W.snSkip("g1");
  ok("🌙 not this year (offPaths): the link is in the Undo too", !!byP(undoOf())["seasons/ideas/xmas/g1/ev/e1"]);

  ureset(); W.snUnsched("p1", "e2");
  ok("a day with a length but NOT held: the door is asked, says no — no re-plan, no extra call", o.relays.length === 1 && o.relays[0].ret === false && o.relayed.length === 0 && o.pend() === null);
  ureset(); W.snUnsched("g3", "e5");
  ok("a held day NOT on the built week: no re-plan, no extra call", o.relays.length === 1 && o.relays[0].ret === false && o.relayed.length === 0);
  ureset(); W.snUnsched("m1", "nope");
  ok("an unknown day id: nothing written, nothing asked", o.writes.length === 0 && o.relays.length === 0 && o.relayed.length === 0);

  ureset(); W.snOpenIdea("g1"); W.snDelIdea(); W.snDelIdea();
  ok("delete the idea (left as is): its Undo brings back only the event — no link path", undoOf().length === 1 && undoOf()[0].p === "calendar/events/e1" && o.relayed.length === 1, undoOf());
  ureset(); W.snOpenIdea("g1"); W.snHide("none"); W.snSave();
  ok("switch to 🤐 (left as is): its Undo brings back only the event", undoOf().length === 1 && undoOf()[0].p === "calendar/events/e1" && o.relayed.length === 1, undoOf());
  ureset(); o.dry = true; W.snUnsched("g1", "e1");
  ok("?dryrun=1: no door, no extra call", o.relays.length === 0 && o.relayed.length === 0 && o.pend() === null);
  o.dry = false;

  const n = momWorld(true, true);   // an index.html with the ev* helpers but no relayWeek
  n.set(SEASON(UI()), US(), UE());
  let err = null; try { n.W.snUnsched("g1", "e1"); n.W.snOpenIdea("g2"); n.W.snUnschedAll("g2"); n.W.snUnschedAll("g2"); } catch (e) { err = String(e); }
  ok("no relayWeek: taking held days off throws nothing and still writes", err === null && n.writes.length === 2 && !n.cal().events.e1 && !n.cal().events.e3, err);
  ok("…the door was asked and said no (it needs relayWeek)", n.relays.length === 3 && n.relays.every(x => x.ret === false));
}

console.log("\n# an old index.html (no ev* helpers) + this seasons.js");
{
  const q = momWorld(false), QW = q.W, QT = q.T;
  q.set(SEASON(IDEAS()), SECRET(), EV());
  QW.snSched("m1"); QT.draw();
  ok("the pop-up still opens, with no Ends and no ⏰", QT.edit().type === "sched" && !/Ends \(optional\)/.test(q.html()) && !/Hold this time/.test(q.html()) && /Time \(optional\)/.test(q.html()));
  Object.assign(QT.edit().form, { time: "2:30 PM", end: "4:00 PM", hold: true }); QW.snPickDay("2026-11-30");
  const v = q.last().val, k = calKeys(v)[0];
  ok("a day still goes on, as before (no mins, no hold)", k && JSON.stringify(v[k]) === JSON.stringify({ title: "Movie night", date: "2026-11-30", time: "2:30 PM", who: "family", emoji: "🎬", addedBy: "mom" }), v[k]);
  q.set(SEASON(IDEAS()), SECRET(), EV()); QW.snSched("g1", "e1");
  ok("↪ Move: nothing pre-filled", QT.edit().form.end === "" && QT.edit().form.hold === false);
  QW.snPickDay("2026-11-25");
  const P = Object.keys(q.last().val).sort();
  ok("…moved with date/time/who only — its mins/hold left as they were", JSON.stringify(P) === JSON.stringify(["calendar/events/e1/date", "calendar/events/e1/time", "calendar/events/e1/who"]) && q.cal().events.e1.hold === true && q.cal().events.e1.mins === 90, P);
  q.set(SEASON(IDEAS()), SECRET(), EV()); QW.snUnsched("g1", "e1");
  ok("take off still works with no door", q.writes.length === 1 && !("e1" in q.cal().events));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
