/*
 * test_house_todo_tap.js — a one-time job's row opens its chore card (ONCETAP in house.js; DESIGN_household_rooms_2026-11-15 §14,
 * her rule 2026-11-18 "whenever there is a [chore], it to be clickable and editable, and that edit reflects everywhere that it is";
 * her "all go" 2026-11-18, piece 1). Made-up family (Ada, Ben, Cal, Mom, Dad).
 *   · the four places — a room's 📝 To do, 🏠 Whole house's 📝 To do, 👤 By person's 📝 To do, the ☑️ pile under ⋯ More: every row's
 *     emoji and name open hcOpen(<that job>) for Mom (waiting, sent, ticked today, retired), none for not Mom;
 *   · the tap opens the card for that exact job, on that page, and writes nothing (also under ?dryrun=1);
 *   · no button or drop-down sits inside a tap, and every button in the rows writes what its function writes, without opening the card;
 *   · an edit on the card (name, emoji) shows on all four;
 *   · apart from the tap, every row and the rest of each page is byte-for-byte as before: the same pages with the tap taken out,
 *     and (when git has it) the very pages main's house.js (d0673ec3) draws.
 *   run: node test_house_todo_tap.js
 */
"use strict";
const path = require("path"), vm = require("vm"), cp = require("child_process"), V = require(path.join(__dirname, "test_fixtures", "house_vm.js"));
const { K, TODAY, ago, mk, roomPage, handlers } = V;
let pass = 0, fail = 0; const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x).slice(0, 600) + ")" : "")); } };
const J = x => JSON.stringify(x);
const O = (id, o) => K(Object.assign({ who: "mom", slot: "", cad: "once", hold: true, src: { kind: "momChore", id } }, o));
const JOBS = () => ({
  k_counter: K({ label: "Wipe the counters", emoji: "🧽", who: "ada", slot: "chores", cad: "daily", room: "kitchen", minutes: 10, can: ["ada", "ben"] }),
  o_shelf: O("o_shelf", { label: "Fix the shelf", emoji: "🔨", who: "ben", slot: "chores", room: "kitchen", from: ago(2), can: ["ben", "ada"], src: { kind: "new" }, ts: 2 }),
  o_drawer: O("o_drawer", { label: "Sort the junk drawer", room: "kitchen", from: ago(9), can: ["mom", "ada", "ben", "dad"], ts: 1 }),
  o_sent: K({ label: "Boxes to the curb", who: "cal", slot: "chores", cad: "once", room: "kitchen", from: ago(1), ts: 4 }),
  o_gone: K({ label: "Hang the hooks", who: "ben", slot: "chores", cad: "once", room: "kitchen", status: "retired", done: ago(3), ts: 5 }),
  o_bath: O("o_bath", { label: "New shower curtain", room: "bathdown", from: ago(1), can: ["mom", "dad"] }),
  o_lost: O("o_lost", { label: "Box up the old toys", room: "attic_gone", from: ago(3), can: ["mom", "cal"] }),
  o_dad: K({ label: "Fix the gate", who: "dad", slot: "", cad: "once", room: "entry", from: ago(1), src: { kind: "dadChore", id: "gate" } }),
  o_liv: O("o_liv", { label: "Hang the picture", room: "living", from: ago(4), can: ["mom", "ada"], ts: 7 })
});
const PEOPLE = ["ada", "ben", "cal", "mom", "dad"];
const mkT = o => { o = o || {}; const c = mk(Object.assign({ jobs: JOBS() }, o)); c.event = { stopPropagation: () => {} }; return c; };
const ticked = o => { const c = mkT(o); c.rtdTick("o_shelf"); c.writes.length = 0; return c; };   // Fix the shelf: ✓ today
const person = (c, who) => { c.get('hhView="person"; hpSel=' + J(who)); return c.hpPersonHTML(); };
// The four places, as drawn: a room's To do (on its page), Whole house's To do, a person's To do, the pile.
const PLACES = {
  "a room's 📝 To do": c => c.rtdHTML("kitchen") + c.rtdHTML("bathdown") + c.rtdHTML("living") + c.rtdHTML("entry") + c.rtdHTML(""),
  "🏠 Whole house 📝 To do": c => c.htdHTML(),
  "👤 By person 📝 To do": c => PEOPLE.map(w => c.htdPersonHTML(w)).join(""),
  "☑️ the pile under ⋯ More": c => c.hhOnceHTML()
};
// Each tapped span: [id, the span's text]. A tapped span is <span onclick="hcOpen('<id>')" style="cursor:pointer…">…</span> (nested spans inside).
const taps = h => { const out = [], re = /<span onclick="hcOpen\('([^']*)'\)" style="cursor:pointer[^"]*">/g; let m;
  while ((m = re.exec(h))) { let d = 1, k = re.lastIndex; const t = /<(\/?)span\b[^>]*>/g; t.lastIndex = k; let x; while (d && (x = t.exec(h))) { d += x[1] ? -1 : 1; if (!d) out.push([m[1], h.slice(k, x.index)]); } }
  return out; };
// Any button / drop-down / field with an hcOpen tap above it (a click there would also open the card)?
const inside = h => { const re = /<(\/?)([a-z]+)([^>]*)>/g, st = []; let m, n = 0; const bad = [];
  while ((m = re.exec(h))) { const [, cl, tag, at] = m; if (cl) { for (let i = st.length - 1; i >= 0; i--) if (st[i].tag === tag) { st.length = i; break; } continue; }
    if (/^(button|select|input|textarea)$/.test(tag)) { n++; if (st.some(e => e.tap)) bad.push(tag + at.slice(0, 60)); }
    if (!/^(input|br|img)$/.test(tag)) st.push({ tag, tap: /onclick="hcOpen\(/.test(at) }); }
  return { n, bad }; };
// The tap taken out: the span exactly as before.
const untap = h => h.replace(/<span onclick="hcOpen\('[^']*'\)" style="cursor:pointer(?:;([^"]*))?">/g, (m, css) => css === undefined ? "<span>" : '<span style="' + css + '">');
const runIn = (c, t, val) => c.get(t.replace(/this\.value/g, J(val === undefined ? "ada" : val)).replace(/\bthis\b/g, J({ value: val === undefined ? "ada" : val })));

console.log("\n── the tap is on every row of the four places, Mom only ──");
for (const [name, draw] of Object.entries(PLACES)) {
  const c = mkT(), h = draw(c), T = taps(h), ids = [...new Set(T.map(x => x[0]))];
  const want = { "a room's 📝 To do": ["o_drawer", "o_shelf", "o_sent", "o_bath", "o_liv", "o_dad", "o_lost"], "🏠 Whole house 📝 To do": ["o_drawer", "o_shelf", "o_sent", "o_bath", "o_liv", "o_dad", "o_lost"],
    "👤 By person 📝 To do": ["o_drawer", "o_shelf", "o_sent", "o_bath", "o_liv", "o_dad", "o_lost"], "☑️ the pile under ⋯ More": ["o_drawer", "o_shelf", "o_sent", "o_gone", "o_bath", "o_liv", "o_dad", "o_lost"] }[name];
  ok(name + ": every one-time job's row has the tap (" + want.length + " jobs)", want.every(id => ids.includes(id)) && ids.every(id => want.includes(id)), ids);
  const rows = (h.match(/<span onclick="hcOpen\('/g) || []).length, J0 = c.hhJobs();
  ok(name + ": on its emoji and its name — two spans per row, nothing else", T.every(x => x[1] === (J0[x[0]].emoji || "☑️") || x[1].indexOf(c.esc(J0[x[0]].label)) === 0) && T.filter(x => x[1] === (J0[x[0]].emoji || "☑️")).length === rows / 2, T.map(x => x[1].slice(0, 30)));
  ok(name + ": the only new handler is hcOpen(<that row's job>)", handlers(h).filter(x => /^hcOpen/.test(x)).every(x => /^hcOpen\('o_\w+'\)$/.test(x)) && handlers(h).filter(x => /^hcOpen/.test(x)).length === T.length);
  const k = mkT({ noMom: true }), kh = draw(k);
  ok(name + ": not Mom — the same rows, no tap at all", /Fix the shelf/.test(kh) && !/hcOpen/.test(kh) && taps(kh).length === 0);
  const t = ticked(), th = draw(t);
  if (name !== "👤 By person 📝 To do") ok(name + ": a row ticked today keeps the tap", taps(th).some(x => x[0] === "o_shelf" && /Fix the shelf/.test(x[1])), taps(th).map(x => x[0]));
}
{ const c = mkT(), h = c.htdPersonHTML("cal"), T = taps(h).map(x => x[0]);
  ok("By person: a sent row (on Cal's list) and a waiting row (Cal can do) both have it", T.includes("o_sent") && T.includes("o_lost"), T); }
{ const c = mkT(), h = c.rtdHTML("kitchen"), T = taps(h).map(x => x[0]);
  ok("a room's To do: waiting, sent rows have it", T.includes("o_drawer") && T.includes("o_shelf") && T.includes("o_sent"), T); }
{ const c = mkT(), h = c.hhOnceHTML(), i = h.indexOf("✓ Done");
  ok("the pile: the ✓ Done (retired) row has it too", i > 0 && taps(h.slice(i)).some(x => x[0] === "o_gone")); }

console.log("\n── the tap opens that job's card and writes nothing ──");
const VIEWS = { "a room's 📝 To do": ['hhView="rooms"; hhRmSel="kitchen";', c => c.rtdHTML("kitchen")], "🏠 Whole house 📝 To do": ['hhView="rooms"; hhRmSel="";', c => c.htdHTML()],
  "👤 By person 📝 To do": ['hhView="person"; hpSel="ben";', c => c.htdPersonHTML("ben")], "☑️ the pile under ⋯ More": ['hhView="once";', c => c.hhOnceHTML()] };
for (const [name, [view, draw]] of Object.entries(VIEWS)) for (const mode of ["", "ticked", "dry"]) {
  const mkc = () => mode === "ticked" ? ticked() : mkT({ dry: mode === "dry" });
  const c0 = mkc(), list = [...new Set(handlers(draw(c0)).filter(x => /^hcOpen/.test(x)))]; let good = list.length > 0; const bad = [];
  for (const t of list) { const c = mkc(), id = t.slice(8, -2), s0 = J(c.get("householdData")); c.get(view); c.get(t); const el = {}; c.renderHousehold(el);
    const card = c.hcCardHTML(), j = c.hhJobs()[id];
    if (!(c.get("hcId") === id && card.indexOf(c.esc((j.emoji || "☐") + " " + j.label)) > 0 && el.innerHTML.indexOf(card) > 0 && c.writes.length === 0 && J(c.get("householdData")) === s0)) { good = false; bad.push(t); } }
  ok(name + (mode ? " (" + mode + ")" : "") + ": each of " + list.length + " taps opens the card for that exact job, on that page, and writes nothing", good, bad);
}
{ const k = mkT({ noMom: true }); k.hcOpen("o_shelf"); ok("not Mom: hcOpen itself refuses (no card)", k.get("hcId") === "" && k.hcCardHTML() === "" && k.writes.length === 0); }

console.log("\n── the row's buttons do only their own thing ──");
for (const [name, draw] of Object.entries(PLACES)) for (const mode of ["", "ticked"]) {
  const c = mode ? ticked() : mkT(), h = draw(c), I = inside(h);
  ok(name + (mode ? " (ticked)" : "") + ": none of its " + I.n + " buttons sits inside a tap", I.n > 0 && I.bad.length === 0, I.bad);
}
{ // every button of the four places, from the row, against the same call made directly — and the card stays shut
  const all = new Set(); for (const draw of Object.values(PLACES)) for (const mk2 of [mkT, ticked]) handlers(draw(mk2())).forEach(t => all.add(J([mk2 === ticked, t])));
  const btns = [...all].map(x => JSON.parse(x)).filter(([, t]) => /^(rtdTick|hhOnceSend|hhOnceHold)\(/.test(t));
  let good = btns.length >= 20; const bad = [];
  for (const [tk, t] of btns) { const x = tk ? ticked() : mkT(), y = tk ? ticked() : mkT(); runIn(x, t); y.get(t);
    if (!(x.writes.length > 0 && J(x.writes) === J(y.writes) && x.get("hcId") === "")) { good = false; bad.push([t, x.writes, y.writes]); } }
  ok("each ✓ / Send to… / ⏸ Back to the pile / Give to <Name> (" + btns.length + ") writes exactly its function's write and opens no card", good, bad);
  const kinds = new Set(btns.map(([, t]) => t.split("(")[0]));
  ok("…all four kinds are covered (✓ and un-✓, Send to, ⏸, Give to <Name> = hhOnceSend(id, who))", ["rtdTick", "hhOnceSend", "hhOnceHold"].every(k => kinds.has(k)) && btns.some(([tk, t]) => tk && t === "rtdTick('o_shelf')"), [...kinds]);
  const other = [...all].map(x => JSON.parse(x)[1]).filter(t => !/^(rtdTick|hhOnceSend|hhOnceHold|hcOpen|hhRmGo|htdFold|rtdToggleForm|htdToggleForm)\(/.test(t));
  ok("…and the four places have no other handler than before plus hcOpen", other.length === 0, other);
}

console.log("\n── an edit on the card shows in all four places ──");
{ const c = mkT(); c.hcOpen("o_shelf"); const lab = handlers(c.hcCardHTML()).find(t => t === "hhEditField('o_shelf','label',this)");
  runIn(c, lab, "Fix the tall shelf");
  ok("the card's name field writes only the name (one update)", J(c.writes) === J([["update", "", { "household/jobs/o_shelf/label": "Fix the tall shelf" }]]), c.writes);
  const all = [c.rtdHTML("kitchen"), c.htdHTML(), c.htdPersonHTML("ben"), c.hhOnceHTML()];
  ok("…and the new name is on the room To do, Whole house, By person (Ben) and the pile; the old one nowhere", all.every(h => taps(h).some(x => x[0] === "o_shelf" && x[1].indexOf("Fix the tall shelf") === 0)) && all.every(h => !/>Fix the shelf</.test(h) && !/>Fix the shelf<span/.test(h)), all.map(h => taps(h).filter(x => x[0] === "o_shelf").map(x => x[1].slice(0, 25))));
  const e = handlers(c.hcCardHTML()).find(t => t === "hhEditSet('o_sent','emoji','🧹')") || "hhEditSet('o_sent','emoji','🧹')"; c.hcOpen("o_sent"); c.writes.length = 0;
  c.get(handlers(c.hcCardHTML()).find(t => t === "hhEditSet('o_sent','emoji','🧹')"));
  const all2 = [c.rtdHTML("kitchen"), c.htdHTML(), c.htdPersonHTML("cal"), c.hhOnceHTML()];
  ok("an emoji picked on the card (a sent job) shows on all four", c.writes.length === 1 && all2.every(h => taps(h).some(x => x[0] === "o_sent" && x[1] === "🧹")), [e, c.writes]); }

console.log("\n── apart from the tap, every row and page is as before ──");
const pages = c => { const x = h => h.replace(c.hoCardHTML ? c.hoCardHTML() : "", ""), o = { "kitchen page": x(roomPage(c, "kitchen")), "living page": x(roomPage(c, "living")), "❔ No room page": roomPage(c, "__none"), "🏠 Whole house": x(roomPage(c, "")) };
  PEOPLE.forEach(w => { o["👤 " + w] = x(person(c, w)); }); o["☑️ pile"] = c.hhOnceHTML(); return o; };
const STATES = [["as is", () => mkT()], ["ticked today", () => ticked()], ["after Send to Ada", () => { const c = mkT(); c.hhOnceSend("o_drawer", "ada"); c.writes.length = 0; return c; }]];
for (const [sname, make] of STATES) {
  const c = make(), A = pages(c), keep = c.hoTap; c.hoTap = (id, mom, css) => keep(id, false, css); const B = pages(c); c.hoTap = keep;
  const diff = Object.keys(A).filter(k => untap(A[k]) !== B[k]);
  ok(sname + ": the " + Object.keys(A).length + " pages, tap taken out = the same pages drawn with no tap", diff.length === 0 && Object.keys(A).some(k => A[k] !== B[k]), diff);
  const k = make.call(null); k.isMom = false; const P = pages(k);
  ok(sname + ": not Mom — no hcOpen anywhere on a To do or the pile", Object.keys(P).every(n => /^👤|page|house/.test(n) ? !taps(P[n]).length : !/hcOpen/.test(P[n])));
  ok(sname + ": drawing all of it wrote nothing", c.writes.length === 0 && k.writes.length === 0);
}
{ // main's own house.js, when git has it: the branch pages with the tap taken out are byte for byte main's, Mom and not Mom
  let MAIN = null; try { MAIN = cp.execSync("git show d0673ec3:house.js", { cwd: __dirname, encoding: "utf8", maxBuffer: 1 << 26, stdio: ["ignore", "pipe", "ignore"] }); } catch (e) {}
  if (!MAIN) console.log("  (main's house.js not in git here — the byte check against main is skipped)");
  else for (const [sname, make] of STATES) for (const noMom of [false, true]) {
    // HOUSEQUIET (slice B of the missed-chores design, 2026-11-23) changes on purpose what the Household pages draw (test_house_quiet.js);
    // every caller asks typeof first, so the branch side here is house.js with that block cut out, set up exactly as main's side.
    const a0 = make(), a = mk({ house: false }), b = mk({ house: false }), noQ = s => { const i = s.indexOf("// HOUSEQUIET_START"); return i < 0 ? s : s.slice(0, i) + s.slice(s.indexOf("\n", s.indexOf("// HOUSEQUIET_END")) + 1); };
    a.event = { stopPropagation: () => {} }; vm.runInContext(noQ(V.HJS), a, { filename: "house.js" }); a.householdOnValue(JSON.parse(J(a0.get("householdData")))); a.writes.length = 0;
    b.event = { stopPropagation: () => {} }; vm.runInContext(MAIN, b, { filename: "house_main.js" }); b.householdOnValue(JSON.parse(J(a0.get("householdData")))); b.writes.length = 0;
    if (noMom) { a.isMom = false; b.isMom = false; }
    const A = pages(a), B = pages(b), diff = Object.keys(A).filter(k => untap(A[k]) !== B[k]);
    ok("vs main d0673ec3, " + sname + (noMom ? ", not Mom" : ", Mom") + ": " + Object.keys(A).length + " pages identical apart from the tap" + (noMom ? " (none)" : ""), diff.length === 0 && (!noMom || Object.keys(A).every(k => A[k] === B[k])), diff.map(k => { const x = untap(A[k]), y = B[k]; let i = 0; while (x[i] === y[i]) i++; return [k, x.slice(i - 60, i + 80), y.slice(i - 60, i + 80)]; }));
  }
}

console.log("\n" + pass + " passed, " + fail + " failed"); process.exit(fail ? 1 : 0);
