/*
 * 🔴 Home Base alerts (her ask 2026-10-09) — HBALERT block.
 *  (a) a red number on the "Mom's Day" tab = alerts new since Mom last opened 🏡 Home Base on this device
 *      (I need Mom, a new message, a card sent for checking, close-out items, reminders); opening Home Base clears it.
 *  (b) a ding only on a Mom device (Mom mode really on here) and only when a PERSON is waiting
 *      (I need Mom, a new message, a card sent for checking) — never re-dinged after a reload.
 *  (c) a one-time banner explaining the three levels with "Got it", remembered per device.
 * Nothing here writes to the database.
 *   run:  node test_hb_alerts.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(process.env.HA_INDEX || path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } };
const a = src.indexOf("// HBALERT_START"), b = src.indexOf("// HBALERT_END");
ok("HBALERT block present", a > 0 && b > a);
const block = src.slice(a, b);

// one device's storage, shared across "reloads" (new envs)
function mkLS() { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, _m: m }; }

function mkEnv(st, LS) {
  const els = {}, dings = [];
  const badge = { style: { display: "none" }, textContent: "" };
  els["hb-badge"] = badge;
  const document = { getElementById: id => els[id] || null };
  const osc = () => ({ connect() {}, start() {}, stop() {}, frequency: {}, type: "" });
  const ctx = {
    document, HA_LS: LS, console, Date, Math, Object, String, JSON, Array,
    setTimeout: (f) => { st.timers = (st.timers || 0) + 1; return 1; },
    window: { _kiosk: () => !!st.kiosk, _kioskR: () => false, _kioskD: () => !!st.dad, _kioskK: () => false },
    momHereReal: () => !!st.mom,
    SL_KIDS: ["lincoln", "lucy"], ROSTER: ["lincoln", "lucy"],
    // 🔔 person waiting
    hrOpenList: () => Object.entries(st.hr || {}),
    msgReplyList: () => Object.entries(st.msg || {}),
    msgAdrReplies: m => m.replies,
    wsNoteList: () => Object.entries(st.notes || {}), wsOpenList: () => [],
    weekData: { tasks: [{ id: "t1" }, { id: "t2" }, { id: "t2_c" }] }, displacedResult: null,
    claimed: st.claimed || {}, checked: st.checked || {},
    // 🔴 close-out
    rlBooks: k => (k === "lucy" && st.book) ? [{ id: "bk1", finishClaim: { ts: "x" }, status: "reading" }] : [],
    prPending: k => [], _rwWds: k => [], unitStudies: {}, _unitActs: () => [],
    _mstAlertList: ["keep-me"],
    mstAlertsAll: () => { ctx._mstAlertList = ["clobbered"]; return st.study ? [{ kid: "lincoln", kind: "rushed", sid: "s1", text: "x" }, { kid: "lincoln", kind: "redone", sid: "s2" }] : []; },
    stPendingList: () => [],
    // 🔴 reminders
    _todayStr: () => "2026-10-09", billsData: st.bills || {}, billState: (bb) => ({ state: bb.state, due: bb.due }),
    laundryData: {}, laundryT: () => 60, kitDuePrep: () => [], rmList: () => [], rmState: () => "later",
    bbAlarmCtx: { state: "running", currentTime: 0, destination: {}, createOscillator: () => { dings.push(1); return osc(); }, createGain: () => ({ connect() {}, gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} } }) },
  };
  vm.createContext(ctx);
  new vm.Script(block).runInContext(ctx);
  return { ctx, els, badge, dings };
}

// ── sources → items ──
{ const st = { hr: { hr_1: { kid: "lucy" } }, msg: { m1: { replies: [{ at: 5, text: "hi" }] } }, notes: { n1: {} },
    claimed: { t1: 111, t2_c: 1, gone: 2 }, checked: {}, book: true, study: true, bills: { b1: { state: "due", due: "2026-10-09" }, b2: { state: "later", due: "2026-11-01" } } };
  const E = mkEnv(st, mkLS());
  const items = E.ctx.hbAlertItems(), keys = items.map(x => x.key);
  ok("I need Mom → need", keys.includes("need:hr_1"), keys);
  ok("Adrienne's reply → msg (keyed by the last reply, so a newer reply is new again)", keys.includes("msg:m1@5"));
  ok("a note from Adrienne → msg", keys.includes("msg:ws_n1"));
  ok("a card sent for checking → check (this week's cards only; no _c twin, no stale id)", keys.includes("check:t1@111") && !keys.some(k => /t2_c|gone/.test(k)), keys);
  ok("finished book → close", keys.includes("close:book_lucy_bk1"));
  ok("study flag → close (a redone card is good news, not an alert)", keys.includes("close:study_lincoln_rushed_s1") && !keys.some(k => /redone/.test(k)));
  ok("mstAlertsAll's row list is put back (its buttons index into it)", E.ctx._mstAlertList[0] === "keep-me");
  ok("bill due today → remind; a later bill is not", keys.includes("remind:bill_b1_2026-10-09") && !keys.some(k => /b2/.test(k)));
}

// ── (a) the badge: new since Home Base was last open here; opening Home Base clears it ──
{ const LS = mkLS(), st = { hr: { hr_1: {} }, book: true, bills: { b1: { state: "overdue", due: "2026-10-01" } } };
  let E = mkEnv(st, LS);
  E.ctx.hbAlertsTick();
  ok("three alerts nobody has seen here → red 3", E.badge.textContent === "3" && E.badge.style.display === "inline-block", E.badge);
  E.ctx.hbAlertsSeen();
  ok("Home Base opened → the number clears", E.badge.style.display === "none" && E.badge.textContent === "");
  E.ctx.hbAlertsTick();
  ok("…and stays clear on the next repaint", E.badge.style.display === "none");
  st.hr.hr_2 = {}; st.bills.b3 = { state: "due", due: "2026-10-09" };
  E = mkEnv(st, LS); E.ctx.hbAlertsTick();
  ok("two new alerts after she left (and after a reload) → red 2", E.badge.textContent === "2", E.badge);
  delete st.hr.hr_1; E = mkEnv(st, LS); E.ctx.hbAlertsTick();
  ok("a seen one going away doesn't change the count", E.badge.textContent === "2");
  E.ctx.hbAlertsSeen(); ok("seen again → 0", E.badge.style.display === "none");
  const dad = mkEnv(Object.assign({}, st, { dad: true, hr: { hr_9: {} } }), mkLS()); dad.ctx.hbAlertsTick();
  ok("Dad's link never shows the number", dad.badge.style.display === "none");
  const dadLS = mkLS(), dad2 = mkEnv({ dad: true, hr: { hr_9: {} } }, dadLS); dad2.ctx.hbAlertsSeen();
  ok("…and never marks Mom's alerts seen", dadLS.getItem("ha_hb_seen") === null);
  const big = {}; for (let i = 0; i < 120; i++) big["hr_" + i] = {};
  const E2 = mkEnv({ hr: big }, mkLS()); E2.ctx.hbAlertsTick();
  ok("over 99 → 99+", E2.badge.textContent === "99+");
}

// ── (b) the ding ──
{ const LS = mkLS(), st = { mom: true, hr: { hr_1: {} } };
  let E = mkEnv(st, LS);
  E.ctx.hbAlertsTick();
  ok("Mom device + a kid needs Mom → ding", E.dings.length === 2, E.dings.length);   // two notes
  E.ctx.hbAlertsTick();
  ok("same ask on the next repaint → no second ding", E.dings.length === 2);
  E = mkEnv(st, LS); E.ctx.hbAlertsTick();
  ok("a reload never re-dings", E.dings.length === 0);
  E.ctx.hbAlertsSeen(); st.hr.hr_2 = {}; E.ctx.hbAlertsSeen(); E.ctx.hbAlertsTick();
  ok("dings even while she's on Home Base (seen ≠ heard)", E.dings.length === 2);
  st.book = true; st.bills = { b1: { state: "due", due: "2026-10-09" } }; st.study = true;
  E = mkEnv(st, LS); E.ctx.hbAlertsTick();
  ok("close-out + reminders → red only, no ding", E.dings.length === 0 && Number(E.badge.textContent) >= 3, E.badge.textContent);
  st.msg = { m1: { replies: [{ at: 9 }] } }; E = mkEnv(st, LS); E.ctx.hbAlertsTick();
  ok("new message → ding", E.dings.length === 2);
  st.claimed = { t1: 77 }; E = mkEnv(st, LS); E.ctx.hbAlertsTick();
  ok("card sent for checking → ding", E.dings.length === 2);
}
{ const LS = mkLS(), st = { mom: false, hr: { hr_1: {} } };
  let E = mkEnv(st, LS); E.ctx.hbAlertsTick();
  ok("not in Mom mode → no ding (the red number still shows)", E.dings.length === 0 && E.badge.textContent === "1");
  st.mom = true; E = mkEnv(st, LS); E.ctx.hbAlertsTick();
  ok("Mom mode coming on later doesn't ding for an old ask", E.dings.length === 0);
  const K = mkEnv({ mom: true, kiosk: true, hr: { hr_5: {} } }, mkLS()); K.ctx.hbAlertsTick();
  ok("a kiosk never dings", K.dings.length === 0);
}
{ const E = mkEnv({}, mkLS()); E.ctx.hbDing(); E.ctx.hbDing();
  ok("dings are spaced (one per 4 s at most)", E.dings.length === 2);
}

// ── (c) the one-time banner ──
{ const LS = mkLS(), E = mkEnv({}, LS);
  const h = E.ctx.hbTipHTML();
  ok("banner explains all three levels", /Ding \+ red number/.test(h) && /Red number only/.test(h) && /Neither/.test(h) && /Got it/.test(h) && /Mom mode/.test(h));
  let removed = 0; E.els["hb-tip"] = { remove() { removed++; } };
  E.ctx.hbTipGotIt();
  ok("Got it → remembered on this device and the banner goes", LS.getItem("ha_hb_tip") === "1" && removed === 1);
  ok("…never shows again here", mkEnv({}, LS).ctx.hbTipHTML() === "");
  ok("another device still shows it once", mkEnv({}, mkLS()).ctx.hbTipHTML() !== "");
}

// ── wiring + house rules ──
{ const rmd = src.slice(src.indexOf("function renderMomsDay(el){"), src.indexOf("// ── 🍽 KITCHEN · Phase 2"));
  ok("Home Base shows the banner", rmd.includes("h+=hbTipHTML()"));
  ok("Home Base painting clears the number (after innerHTML)", rmd.indexOf("hbAlertsSeen()") > rmd.indexOf("el.innerHTML=h"));
  const ra = src.slice(src.indexOf("function renderAll(){"), src.indexOf("function _renderAllInner(){"));
  ok("every repaint re-counts (debounced)", ra.includes("hbAlertsSoon()"));
  ok("the Mom's Day tab carries the badge", /data-tab="moms-plan"[^>]*>Mom's Day<span id="hb-badge"/.test(src));
  ok("no database writes in the block", !/\bdb\b|firebase/i.test(block));
  ok("no 🔀 in the block", !block.includes("\u{1F500}"));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
