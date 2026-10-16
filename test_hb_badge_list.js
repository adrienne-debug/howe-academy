/*
 * 📋 The red number on Mom's Day shows what it is (her ask 2026-10-15) — HBLIST block (inside HBALERT).
 *  Tapping the badge (not the tab) opens a Mom-only "Waiting for you" pop-down: exactly the unseen items the number
 *  counts, grouped 🔔 Someone's waiting (need + msg) · ⏳ To check (one line, the count) · 🔴 To close out · ⏰ Reminders,
 *  each a plain-words line that taps through to its Mom's Day section. Opening it marks nothing seen; Home Base
 *  painting still clears the number. Never on a kiosk / kids' or General tablet / Dad's link; outside Mom mode → PIN.
 *  Nothing is written anywhere.
 *   run:  node test_hb_badge_list.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(process.env.HA_INDEX || path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } };
const a = src.indexOf("// HBALERT_START"), b = src.indexOf("// HBALERT_END");
const la = src.indexOf("// HBLIST_START"), lb = src.indexOf("// HBLIST_END");
ok("HBLIST block present inside HBALERT", a > 0 && la > a && lb > la && b > lb);
const block = src.slice(a, b);

function mkLS() { const m = {}, w = []; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { w.push(k); m[k] = String(v); }, _m: m, _w: w }; }

function mkEnv(st, LS) {
  const els = {}, calls = { goto: [], pin: [], scroll: [] };
  const badge = { style: { display: "none" }, textContent: "", getBoundingClientRect: () => ({ bottom: 40, right: 300 }) };
  els["hb-badge"] = badge;
  ["hr-mom-card", "ws-task-card", "st-pending", "rm-week-card"].forEach(id => { els[id] = { id, scrollIntoView: () => calls.scroll.push(id) }; });
  // Mom's Day order: #hr-md-mark → 🙋 #hr-mom-card (when a kid asked) → the 🔴 Now card (no id of its own)
  const now = { id: "", scrollIntoView: () => calls.scroll.push("hb-now") };
  els["hr-md-mark"] = { id: "hr-md-mark", nextElementSibling: st.noAsk ? now : els["hr-mom-card"] };
  els["hr-mom-card"].nextElementSibling = now;
  const document = {
    getElementById: id => els[id] || null,
    createElement: () => { const o = { id: "", _h: "" }; Object.defineProperty(o, "innerHTML", { get() { return o._h; }, set(v) { o._h = v; if (/id="hb-list-pop"/.test(v)) els["hb-list-pop"] = {}; else delete els["hb-list-pop"]; } }); return o; },
    body: { appendChild: o => { els[o.id] = o; } },
  };
  const ctx = {
    document, HA_LS: LS, console, Date, Math, Object, String, JSON, Array,
    setTimeout: f => { f(); return 1; },
    window: { innerWidth: 400, _kiosk: () => !!st.kiosk, _kioskR: () => !!st.general, _kioskD: () => !!st.dad, _kioskK: () => !!st.kidsTab },
    momHereReal: () => !!st.mom, momHere: () => !!st.mom,
    kitPinGate: (then, why) => calls.pin.push({ then, why }),
    mpGoto: v => calls.goto.push(v),
    KID_NAME: { lincoln: "Lincoln", lucy: "Lucy" }, cap: s => String(s).charAt(0).toUpperCase() + String(s).slice(1),
    SL_KIDS: ["lincoln", "lucy"], ROSTER: ["lincoln", "lucy"],
    hrOpenList: () => Object.entries(st.hr || {}),
    msgReplyList: () => Object.entries(st.msg || {}), msgAdrReplies: m => m.replies,
    wsNoteList: () => Object.entries(st.notes || {}), wsOpenList: () => Object.entries(st.ws || {}),
    weekData: { tasks: [{ id: "t1", who: "lincoln", title: "Math 5.3" }, { id: "t2", who: "lucy", title: "Phonics" }] }, displacedResult: null,
    claimed: st.claimed || {}, checked: {},
    rlBooks: k => (k === "lucy" && st.book) ? [{ id: "bk1", title: "Charlotte's Web", finishClaim: { ts: "x" }, status: "reading" }] : [],
    prPending: k => (k === "lincoln" && st.stars) ? [{ id: "p1", amount: 50, reason: "Mulched the beds" }] : [],
    _rwWds: k => (k === "lucy" && st.store) ? [{ id: "w1", status: "owed", note: "Ice cream" }] : [],
    unitStudies: {}, _unitActs: () => [], _mstAlertList: [], mstAlertsAll: () => [],
    stPendingList: () => st.spell ? [{ kid: "lucy", key: "L2_5" }] : [],
    _todayStr: () => "2026-10-15", billsData: st.bills || {}, billState: bb => ({ state: bb.state, due: bb.due }),
    laundryNudgeList: () => st.wash ? [{ id: "ld1", kind: "dryer", l: { label: "Towels", stage: "dryer", ts: 1 } }] : [],
    kitDuePrep: () => [], hhLevelReadyList: () => [],
    rmList: k => (k === "lincoln" && st.road) ? [{ id: "r1", text: "Finish Unit 3" }] : [], rmState: () => "over",
  };
  vm.createContext(ctx);
  new vm.Script(block).runInContext(ctx);
  return { ctx, els, badge, calls };
}
const pop = E => (E.els["hb-list-wrap"] || {})._h || "";

// ── labels + sections, from what each source already knows ──
const ALL = { mom: true, hr: { hr_1: { kid: "lucy", cardTitle: "Spelling" } }, msg: { m1: { replies: [{ at: 5, text: "x" }] } },
  notes: { n1: { title: "Field trip" } }, claimed: { t1: 111, t2: 222 }, book: true, stars: true, store: true, spell: true,
  bills: { b1: { name: "Electric", state: "due", due: "2026-10-15" } }, wash: true, road: true };
{ const E = mkEnv(ALL, mkLS()), items = E.ctx.hbAlertItems(), by = k => items.find(x => x.key === k) || {};
  ok("keys unchanged by the labels", by("need:hr_1").kind === "need" && by("check:t1@111").kind === "check" && by("msg:ws_n1").kind === "msg", items.map(x => x.key));
  ok("I need Mom → names the kid and the card · 🙋 card", by("need:hr_1").label === "Lucy needs you — Spelling" && by("need:hr_1").sec === "hr-mom-card", by("need:hr_1"));
  ok("reply / note → plain words · 📋 From Adrienne", by("msg:m1@5").label === "Adrienne replied to your message" && by("msg:ws_n1").label === "A note from Adrienne: Field trip" && by("msg:ws_n1").sec === "ws-task-card");
  ok("a card to check → kid + card title · 🔴 Now", by("check:t1@111").label === "Lincoln — Math 5.3" && by("check:t1@111").sec === "hb-now");
  ok("finished book / star ask / owed prize → kid + the thing", by("close:book_lucy_bk1").label === "Lucy finished Charlotte's Web"
    && by("close:stars_lincoln_p1").label === "Lincoln asks for 50 ⭐ — Mulched the beds" && by("close:store_lucy_w1_owed").label === "Owed to Lucy: Ice cream");
  ok("spelling → 📝 its own card", by("close:spell_lucy_L2_5").label === "Grade Lucy’s spelling test" && by("close:spell_lucy_L2_5").sec === "st-pending");
  ok("bill / laundry → reminders in 🔴 Now", by("remind:bill_b1_2026-10-15").label === "Bill: Electric — due today" && /Towels is in the dryer/.test(by("remind:wash_ld1_dryer_1").label) && by("remind:bill_b1_2026-10-15").sec === "hb-now");
  ok("roadmap → 📅 roadmap card", by("remind:road_lincoln_r1").label === "Lincoln roadmap: Finish Unit 3 — overdue" && by("remind:road_lincoln_r1").sec === "rm-week-card");
}

// ── the list = the unseen items, grouped ──
{ const LS = mkLS(), E = mkEnv(ALL, LS);
  E.ctx.hbAlertsTick();
  const n = +E.badge.textContent;
  const G = E.ctx.hbListGroups(), cnt = G.reduce((s, g) => s + g.items.length, 0);
  ok("the list holds exactly what the number counts", cnt === n && n === E.ctx.hbAlertItems().length, { n, cnt });
  ok("four groups in order: waiting · to check · close out · reminders", G.map(g => g.g).join() === "need,check,close,remind", G.map(g => g.g));
  ok("🔔 Someone's waiting = need + msg", G[0].items.map(x => x.kind).sort().join() === "msg,msg,need");
  E.ctx.hbListTap({ stopPropagation() { E.calls.stopped = 1; } });
  const h = pop(E);
  ok("tap → pop-down titled Waiting for you", /Waiting for you/.test(h) && !!E.els["hb-list-pop"]);
  ok("the badge tap stops there (no tab switch)", E.calls.stopped === 1 && !E.calls.goto.length);
  ok("group headings shown", /Someone&#39;s waiting/.test(h) && /To check/.test(h) && /To close out/.test(h) && /Reminders/.test(h));
  ok("⏳ To check is ONE line with the count", /2 cards sent to you to check/.test(h) && !/Math 5\.3/.test(h));
  ok("other lines name the kid and the thing (escaped)", /Lucy needs you — Spelling/.test(h) && /Charlotte&#39;s Web/.test(h));
  // seen subset: Home Base painted once, then one new arrival → the list shows only the new one
  E.ctx.hbListClose();
  E.ctx.hbAlertsSeen();
  ok("Home Base paint still clears the number", E.badge.style.display === "none");
  const E2 = mkEnv(Object.assign({}, ALL, { hr: { hr_1: ALL.hr.hr_1, hr_2: { kid: "lincoln" } } }), LS);
  E2.ctx.hbAlertsTick();
  const G2 = E2.ctx.hbListGroups();
  ok("after Home Base, the list is only what's new", E2.badge.textContent === "1" && G2.length === 1 && G2[0].items.length === 1 && G2[0].items[0].label === "Lincoln needs you", G2);
  E2.ctx.hbListOpen();
  ok("tap again closes it", (E2.ctx.hbListTap({ stopPropagation() {} }), !E2.els["hb-list-pop"]));
}

// ── opening the list marks nothing seen; no writes ──
{ const LS = mkLS(), E = mkEnv(ALL, LS);
  E.ctx.hbAlertsTick(); const before = E.badge.textContent, seenBefore = LS._m.ha_hb_seen, writes = LS._w.length;
  E.ctx.hbListTap({ stopPropagation() {} }); E.ctx.hbListClose(); E.ctx.hbListTap({ stopPropagation() {} });
  ok("opening the list leaves ha_hb_seen untouched and writes nothing", LS._m.ha_hb_seen === seenBefore && LS._w.length === writes);
  E.ctx.hbAlertsTick();
  ok("…and the number stays", E.badge.textContent === before && before !== "");
  ok("no database in the block", !/\bdb\.ref|\bdb&&/.test(src.slice(la, lb)));
}

// ── tap-through ──
{ const E = mkEnv(ALL, mkLS());
  E.ctx.hbListTap({ stopPropagation() {} });
  ok("each line taps to its section", /hbListGo\('hr-mom-card'\)/.test(pop(E)) && /hbListGo\('rm-week-card'\)/.test(pop(E)) && /hbListGo\('st-pending'\)/.test(pop(E)) && /hbListGo\('ws-task-card'\)/.test(pop(E)));
  E.ctx.hbListGo("rm-week-card");
  ok("a line → Mom's Day ▸ Home Base, scrolled to the section, list closed", E.calls.goto.join() === "plan" && E.calls.scroll.join() === "rm-week-card" && !E.els["hb-list-pop"], E.calls);
  delete E.els["st-pending"]; E.calls.scroll.length = 0;
  E.ctx.hbListGo("st-pending");
  ok("a section that's gone → the Now card", E.calls.scroll.join() === "hb-now");
  E.calls.scroll.length = 0; E.ctx.hbListGo("hb-now");
  ok("🔴 Now = the card after the 🙋 card", E.calls.scroll.join() === "hb-now");
}
{ const E = mkEnv(Object.assign({}, ALL, { noAsk: true }), mkLS());
  E.ctx.hbListGo("hb-now");
  ok("🔴 Now = the card right after the marker when no kid asked", E.calls.scroll.join() === "hb-now", E.calls.scroll);
}
// the section ids exist on Mom's Day
ok("🔴 Now card sits right after the 🙋 marker on Mom's Day (what hbSecEl relies on)", /h\+=hrMomCardHTML\(null,"md"\); \}catch\(e\)\{\}[^\n]*\n(  \/\/[^\n]*\n)*  h\+='<div style="background:#fff[^\n]*\n  h\+='<div[^\n]*Now — needs you/.test(src));
ok("hrMomCardHTML: the marker, then the 🙋 card", /const mark=\(where==="md"\)\?'<span id="hr-md-mark"/.test(src) && /return mark\+'<div id="hr-mom-card"/.test(src));
ok("🙋 / 📋 / 📝 / 📅 cards carry their ids", /id="hr-mom-card"/.test(src) && /<div id="ws-task-card"[^\n]*\n[^\n]*📋 From Adrienne/.test(src)
  && /<div id="st-pending"/.test(src) && /<div id="rm-week-card"/.test(src));
ok("the badge has its own tap", /<span id="hb-badge" onclick="hbListTap\(event\)"/.test(src));

// ── never off a Mom device; PIN outside Mom mode ──
[["kiosk", { kiosk: true }], ["General tablet", { general: true }], ["kids' tablet", { kidsTab: true }], ["Dad's link", { dad: true }]].forEach(([n, f]) => {
  const E = mkEnv(Object.assign({}, ALL, f), mkLS());
  E.ctx.hbListTap({ stopPropagation() {} }); E.ctx.hbListOpen();
  ok("no list on " + n, !E.els["hb-list-pop"] && !E.calls.pin.length);
});
{ const E = mkEnv(Object.assign({}, ALL, { mom: false }), mkLS());
  E.ctx.hbListTap({ stopPropagation() {} });
  ok("outside Mom mode → Mom's PIN first, no list yet", E.calls.pin.length === 1 && !E.els["hb-list-pop"] && /for Mom/.test(E.calls.pin[0].why));
  E.calls.pin[0].then();
  ok("right PIN → the list opens", !!E.els["hb-list-pop"]);
}
{ const E = mkEnv({ mom: true }, mkLS());
  E.ctx.hbListOpen();
  ok("nothing unseen → a calm empty line", /Nothing new/.test(pop(E)));
}
ok("no 🔀 added", !src.includes("\u{1F500}"));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
