/*
 * Node tests — MST_NAV: ✓/✗ grading, ← Back / → Forward, tap lock, and no auto-save on the last card in
 * the 📚 Study session (her ask 2026-10-13, the DeWalt family's math-facts sittings: "they're clicking it
 * too fast for each other and it's causing issues").
 *   1 · the grade buttons read ✗ (again) and ✓ (good), same mstTap onclicks, same 56px buttons
 *   2 · grade two cards → Back twice → Forward once: queue / first / goods match the snapshots exactly
 *   3 · the last grade does NOT call mstSave; the sitting stays (queue empty) with a Back to undo it
 *   4 · the tap lock swallows a second mstTap (and a mstFlip) inside 350 ms of the draw
 *   5 · the stacks ride mstPersist / mstRestoreSitting, and reset on mstPick / mstQuit / kid switch / save
 *   6 · Back / Forward buttons are disabled when their stack is empty; no 🔀 emoji
 * Runs the REAL code sliced from index.html (MST_NAV block + MST_ENGINE block + the touched mst* functions).
 *   run:  node test_study_nav.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

function between(a, b) { const i = src.indexOf(a), j = src.indexOf(b); if (i < 0 || j < 0) throw new Error("missing " + a); return src.slice(i, j); }
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };

const NAV = between("// MST_NAV_START", "// MST_NAV_END");
const ENGINE = between("// ── MST_ENGINE_START ──", "// ── MST_ENGINE_END ──");
const UI = ["mstStorageKey", "mstDateStr", "mstTodayKey", "mstPersist", "mstHasPersisted", "mstRestoreSitting", "mstClearPersist",
  "mstFlip", "mstTap", "mstPick", "mstQuit"].map(slice).join("\n");
const RENDER = slice("renderMastStudy");

function mk() {
  const store = {};
  const ctx = { console, Object, Array, Number, String, JSON, Date, Math,
    now: 100000, renders: 0, saves: 0,
    masteryKid: "lincoln", masteryData: { lincoln: [], lincoln_settings: {} },
    mstSid: "math", mstState: null, mstFlipped: false, mstStartTs: null, mstDone: null, mstKid: "lincoln", mstSaveErr: null, mstTyped: "", mstChecked: null,
    HA_LS: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    store,
    mastDrillSettings: () => ({ ladder: [] }), MAST_TIER_ORDER: [], MAST_TIER_INT: {}, mastIsDue: () => true, mastIsParked: () => false, mastIsNeverDrill: () => false, mastFullBank: () => ({}),
    mstSessions: () => [], mstAutoPlayCurrent: () => {}, mstIsSpellCard: () => false, mstIsRuleCard: () => false, mstCardMode: () => "rec" };
  vm.createContext(ctx);
  vm.runInContext(ENGINE + "\n" + NAV + "\n" + UI + "\nfunction _mastRe(){ renders++; mstLockArm(); }\nfunction mstSave(){ saves++; }\nmstNow=function(){ return now; };", ctx);
  return ctx;
}
const run = (ctx, code) => vm.runInContext(code, ctx);
const tick = (ctx, ms) => run(ctx, "now+=" + ms);
// A fresh sitting of three REVIEW cards (math facts). mstSittingInit comes from the real engine.
function startSitting(ctx) {
  run(ctx, `mstState=mstSittingInit({reviews:[{id:"a",subject:"Math",prompt:"3x3"},{id:"b",subject:"Math",prompt:"4x4"},{id:"c",subject:"Math",prompt:"5x5"}],learning:[],newNames:[]},{passes:2});
    mstNavReset(); mstFlipped=true; mstPersist(); mstLockArm();`);
}
const snap = ctx => run(ctx, "JSON.stringify({queue:mstState.queue,first:Object.keys(mstState.cards).map(k=>mstState.cards[k].first),goods:Object.keys(mstState.cards).map(k=>mstState.cards[k].goods)})");

console.log("1 · labels");
{
  const again = RENDER.match(/<button onclick="mstTap\(\\'again\\'\)"[^>]*>([^<]*)<\/button>/);
  const good = RENDER.match(/<button onclick="mstTap\(\\'good\\'\)"[^>]*>([^<]*)<\/button>/);
  ok("again button reads ✗", again && again[1] === "\\u2717", again && again[1]);
  ok("good button reads ✓", good && good[1] === "\\u2713", good && good[1]);
  ok("again is red, good is green, both 56px", again && good && /#dc2626/.test(again[0]) && /#16a34a/.test(good[0]) && /min-height:56px/.test(again[0]) && /min-height:56px/.test(good[0]));
  ok('the words "Again" / "Good" are gone from the grade buttons', !/>Again<|>Good</.test(RENDER));
  ok("the study screen draws the ← Back / Forward → row and arms the tap lock", /mstNavBtns\(\)/.test(RENDER) && /mstLockArm\(\)/.test(RENDER));
  ok('"No cards left" has ← Back beside Save', /mstNavBtn\("back"\)\+'<button onclick="mstSave\(\)"/.test(RENDER));
  ok("no 🔀 emoji anywhere", src.indexOf("\u{1F500}") < 0);
}

console.log("2 · grade two, back twice, forward once");
{
  const ctx = mk(); startSitting(ctx);
  const s0 = snap(ctx);
  tick(ctx, 400); run(ctx, "mstTap('again')"); const s1 = snap(ctx);
  tick(ctx, 400); run(ctx, "mstTap('good')"); const s2 = snap(ctx);
  ok("two grades changed the queue (a again → back of the line, b good → done)", run(ctx, "JSON.stringify(mstState.queue)") === '["r:c","r:a"]' && run(ctx, "mstState.cards['r:b'].done===true"));
  ok("history holds two snapshots, redo none", run(ctx, "mstHist.length===2&&mstRedo.length===0"));
  ok("a grade clears the flip", run(ctx, "mstFlipped===false"));
  run(ctx, "mstBack()");
  ok("back once → state matches the snapshot after the first grade", snap(ctx) === s1, [snap(ctx), s1]);
  ok("back shows the graded card face-up (mstFlipped=true), redo holds one", run(ctx, "mstFlipped===true&&mstRedo.length===1&&mstHist.length===1"));
  ok("back lands on the card that was graded (b)", run(ctx, "mstCurrent(mstState).key") === "r:b");
  run(ctx, "mstBack()");
  ok("back twice → state matches the fresh sitting", snap(ctx) === s0, [snap(ctx), s0]);
  ok("history empty, redo holds two", run(ctx, "mstHist.length===0&&mstRedo.length===2"));
  run(ctx, "mstBack()");
  ok("back with nothing to undo is a no-op", snap(ctx) === s0 && run(ctx, "mstRedo.length===2"));
  run(ctx, "mstFwd()");
  ok("forward once → state matches the snapshot after the first grade again", snap(ctx) === s1, [snap(ctx), s1]);
  ok("forward re-arms history, card face-down", run(ctx, "mstHist.length===1&&mstRedo.length===1&&mstFlipped===false"));
  ok("every back/forward persisted + re-rendered (2 taps + 2 backs + 1 forward; the no-op back draws nothing)", run(ctx, "renders===5") && JSON.parse(ctx.store["ha_mst_lincoln_math"]).hist.length === 1);
  // a new grade after Back throws the redo away
  tick(ctx, 400); run(ctx, "mstTap('again')");
  ok("a fresh grade after Back clears redo", run(ctx, "mstRedo.length===0&&mstHist.length===2"));
  ok("the fresh grade is a different branch than the old redo (b graded again, not good)", snap(ctx) !== s2 && run(ctx, "mstState.cards['r:b'].first") === "again");
  ok("mstSave never called mid-sitting", run(ctx, "saves") === 0);
}

console.log("3 · last card: no auto-save");
{
  const ctx = mk(); startSitting(ctx);
  tick(ctx, 400); run(ctx, "mstTap('good')");
  tick(ctx, 400); run(ctx, "mstTap('good')");
  tick(ctx, 400); run(ctx, "mstTap('good')");
  ok("queue is empty after the third ✓", run(ctx, "mstState.queue.length===0"));
  ok("mstSave NOT called from mstTap when the queue empties", run(ctx, "saves") === 0);
  ok("the sitting is still there (not nulled), three snapshots to go back through", run(ctx, "mstState!==null&&mstHist.length===3"));
  ok("the re-render happened (lands on the \"No cards left\" screen)", run(ctx, "renders") >= 3);
  run(ctx, "mstBack()");
  ok("Back from \"No cards left\" brings the last card back, face-up, un-done", run(ctx, "mstState.queue.length===1&&mstCurrent(mstState).key==='r:c'&&mstFlipped===true&&mstState.cards['r:c'].done===false"));
  tick(ctx, 400); run(ctx, "mstTap('again')");
  ok("re-graded ✗: card goes back in line instead of finishing", run(ctx, "mstState.queue.length===1&&mstState.cards['r:c'].first==='again'") && run(ctx, "saves") === 0);
  ok("mstTap's source no longer calls mstSave", !/mstSave\(\)/.test(slice("mstTap")));
}

console.log("4 · tap lock");
{
  const ctx = mk(); startSitting(ctx);
  tick(ctx, 400); run(ctx, "mstTap('good')");            // render arms the lock at now
  const s1 = snap(ctx);
  tick(ctx, 100); run(ctx, "mstTap('good')");            // 100 ms later: swallowed
  ok("a second tap 100 ms after the draw is swallowed", snap(ctx) === s1 && run(ctx, "mstHist.length===1"));
  tick(ctx, 200); run(ctx, "mstTap('good')");            // 300 ms: still locked
  ok("…and at 300 ms", snap(ctx) === s1);
  run(ctx, "mstFlip()");
  ok("mstFlip is locked too", run(ctx, "mstFlipped===false"));
  tick(ctx, 60); run(ctx, "mstFlip()");                  // 360 ms: open
  ok("after 350 ms a flip goes through", run(ctx, "mstFlipped===true"));
  tick(ctx, 400); run(ctx, "mstTap('good')");
  ok("after 350 ms a tap goes through", snap(ctx) !== s1 && run(ctx, "mstHist.length===2"));
  ok("lock window is 350 ms", run(ctx, "MST_TAP_LOCK_MS") === 350);
}

console.log("5 · persistence + resets");
{
  const ctx = mk(); startSitting(ctx);
  tick(ctx, 400); run(ctx, "mstTap('again')");
  tick(ctx, 400); run(ctx, "mstTap('good')");
  run(ctx, "mstBack()");
  const saved = JSON.parse(ctx.store["ha_mst_lincoln_math"]);
  ok("mstPersist stores hist and redo", saved.hist.length === 1 && saved.redo.length === 1 && saved.state.queue.length === 3);
  run(ctx, "mstQuit()");
  ok("mstQuit clears the in-memory stacks", run(ctx, "mstHist.length===0&&mstRedo.length===0&&mstState===null"));
  ok("…but the saved sitting still carries them", JSON.parse(ctx.store["ha_mst_lincoln_math"]).hist.length === 1);
  ok("mstRestoreSitting brings them back", run(ctx, "mstRestoreSitting('math')") === true && run(ctx, "mstHist.length===1&&mstRedo.length===1"));
  run(ctx, "mstFwd()");
  ok("Forward works after a Resume", run(ctx, "mstRedo.length===0&&mstHist.length===2&&mstState.cards['r:b'].done===true"));
  run(ctx, "mstPick('other')");
  ok("mstPick resets both stacks", run(ctx, "mstHist.length===0&&mstRedo.length===0"));
  // an old saved sitting without hist/redo restores cleanly
  ctx.store["ha_mst_lincoln_math"] = JSON.stringify({ date: run(ctx, "mstTodayKey()"), sid: "math", state: { queue: [], cards: {}, passes: 2 }, startTs: 1 });
  run(ctx, "mstHist=[1]; mstRedo=[2];");
  ok("a saved sitting from before this change restores with empty stacks", run(ctx, "mstRestoreSitting('math')") === true && run(ctx, "mstHist.length===0&&mstRedo.length===0"));
  // reset sites in source
  ok("kid switch in renderMastStudy resets the stacks", /mstKid!==kid\)\{[^\n]*mstNavReset\(\)/.test(RENDER));
  ok("the study deep link resets the stacks", /view==="study"&&typeof mstKid!=="undefined"\)\{[^\n]*mstNavReset\(\)/.test(src));
  ok("a save resets the stacks", /mstDone=\{correct:correct[^\n]*\n[^\n]*mstNavReset\(\)/.test(src));
  ok("a fresh mstStart resets the stacks", /mstState=state; mstStartTs=Date\.now\(\);[^\n]*mstNavReset\(\)/.test(slice("mstStart")));
  ok("a Resume with an empty queue but grades to undo does not auto-save", /if\(!cur&&!mstHist\.length\)\{ mstSave\(\); return; \}/.test(slice("mstStart")));
}

console.log("6 · nav buttons");
{
  const ctx = mk(); startSitting(ctx);
  let h = run(ctx, "mstNavBtns()");
  ok("fresh sitting: Back and Forward both disabled", /mstBack\(\)" disabled/.test(h) && /mstFwd\(\)" disabled/.test(h));
  ok("labels read ← Back / Forward →", /← Back/.test(h) && /Forward →/.test(h));
  tick(ctx, 400); run(ctx, "mstTap('good')");
  h = run(ctx, "mstNavBtns()");
  ok("after a grade: Back enabled, Forward disabled", !/mstBack\(\)" disabled/.test(h) && /mstFwd\(\)" disabled/.test(h));
  run(ctx, "mstBack()");
  h = run(ctx, "mstNavBtns()");
  ok("after Back: Back disabled, Forward enabled", /mstBack\(\)" disabled/.test(h) && !/mstFwd\(\)" disabled/.test(h));
  ok("mstNavBtn('back') alone (for the No-cards-left screen) is the Back button", /^<button onclick="mstBack\(\)"/.test(run(ctx, "mstNavBtn('back')")));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
