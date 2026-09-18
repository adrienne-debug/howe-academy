/*
 * Node tests for 🔒 the auth gate — Stage 0 (2026-09-13).
 *   · a device with a saved session boots straight through (no card)
 *   · no session + rules still open (probe 200) → boots as before, no card  ← today's state, INERT
 *   · no session + rules locked (probe 401/403) → sign-in card, boot waits
 *   · sign-in OK → card gone, boot continues; wrong password → message, card stays
 *   · probe network failure → boots anyway (never strands a device)
 *   · auth SDK missing → boots as before
 *   · initFb's first line is the gate; initializeApp is guarded; the auth script tag exists
 *
 *   run:  node test_auth_gate.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
const a = src.indexOf("// AUTH_GATE_START"), z = src.indexOf("// AUTH_GATE_END");
ok("AUTH_GATE block present", a > 0 && z > a);
const block = src.slice(a, z);

function mk(opts) {
  const els = {}; let authCb = null, authErrCb = null;
  const node = id => ({ id, value: "", textContent: "", disabled: false, style: {}, parentNode: null, focus() {} });
  const body = { children: [], appendChild(n) { n.parentNode = body; body.children.push(n); els[n.id] = n; }, removeChild(n) { body.children = body.children.filter(x => x !== n); delete els[n.id]; n.parentNode = null; } };
  const listeners = {}; const timers = [];
  const document = {
    visibilityState: "visible", addEventListener(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); },
    body, getElementById(id) { if (els[id]) return els[id]; if (/^ha-auth-(e|p|b|m)$/.test(id) && els["ha-auth"]) { return els[id] = node(id); } return null; },
    createElement(t) { const n = node(""); n.style = {}; Object.defineProperty(n, "innerHTML", { set() {}, get() { return ""; } }); return n; },
  };
  const calls = { initFb: 0, renderAll: 0, signIn: [] };
  const firebase = { apps: [], initializeApp() { firebase.apps.push(1); },
    auth: opts.noAuth ? undefined : function () { return { currentUser: opts.user || null,
      onAuthStateChanged(cb, err) { authCb = cb; authErrCb = err; setTimeout(() => cb(opts.user || null), 0); return () => {}; },
      signInWithEmailAndPassword(e, p) { calls.signIn.push([e, p]); return opts.signInOk ? Promise.resolve({ user: { email: e } }) : Promise.reject({ code: opts.signInErr || "auth/wrong-password" }); },
      signOut() { return Promise.resolve(); },
    }; } };
  let reloads = 0; const ctx = { console, setTimeout, Promise, String, document, firebase, FB_CFG: { databaseURL: "https://x.firebaseio.com" }, db: null, setInterval(fn, ms) { timers.push({ fn, ms }); return 1; },
    fetch: opts.fetchFail ? () => Promise.reject(new Error("offline")) : () => Promise.resolve({ status: opts.probe || 200 }),
    initFb() { calls.initFb++; ctx.db = {}; }, renderAll() { calls.renderAll++; }, location: { reload() { reloads++; } } };
  ctx.window = ctx; vm.createContext(ctx); vm.runInContext(block, ctx);
  return { ctx, calls, els, listeners, timers, reloads: () => reloads, setProbe(v) { opts.probe = v; }, T: n => vm.runInContext(n, ctx) };
}
const tick = () => new Promise(r => setTimeout(r, 5));

(async () => {
  console.log("\n# saved session");
  { const m = mk({ user: { email: "fam@x" } }); m.T("haAuthGate")(); await tick();
    ok("boots straight through, no card", m.calls.initFb === 1 && m.calls.renderAll === 1 && !m.els["ha-auth"] && m.T("_haAuthOk") === true && m.T("_haAuthUser").email === "fam@x"); }
  console.log("\n# no session, rules OPEN (today) → inert");
  { const m = mk({ probe: 200 }); m.T("haAuthGate")(); await tick(); await tick();
    ok("probe 200 → boots as before, no card", m.calls.initFb === 1 && !m.els["ha-auth"] && m.T("_haAuthOk") === true);
    ok("initializeApp called once by the gate", m.ctx.firebase.apps.length === 1); }
  console.log("\n# no session, rules LOCKED");
  { const m = mk({ probe: 401, signInOk: false }); m.T("haAuthGate")(); await tick(); await tick();
    ok("probe 401 → sign-in card, boot waits", !!m.els["ha-auth"] && m.calls.initFb === 0 && m.T("_haAuthOk") === false);
    m.els["ha-auth-e"] = Object.assign({ id: "ha-auth-e", value: " fam@x ", focus() {} }, {}); m.els["ha-auth-p"] = { id: "ha-auth-p", value: "pw" }; m.els["ha-auth-b"] = { id: "ha-auth-b", disabled: false, textContent: "" }; m.els["ha-auth-m"] = { id: "ha-auth-m", textContent: "" };
    m.T("haAuthSubmit")({ preventDefault() {} }); await tick(); await tick();
    ok("wrong password → message, card stays, email trimmed", /isn't right/.test(m.els["ha-auth-m"].textContent) && !!m.els["ha-auth"] && m.calls.signIn[0][0] === "fam@x" && m.calls.initFb === 0, m.els["ha-auth-m"].textContent);
    ok("button re-enabled after the failure", m.els["ha-auth-b"].disabled === false && m.els["ha-auth-b"].textContent === "Sign in"); }
  { const m = mk({ probe: 403, signInOk: true }); m.T("haAuthGate")(); await tick(); await tick();
    ok("probe 403 → card", !!m.els["ha-auth"]);
    m.els["ha-auth-e"] = { id: "ha-auth-e", value: "fam@x", focus() {} }; m.els["ha-auth-p"] = { id: "ha-auth-p", value: "pw" };
    m.T("haAuthSubmit")({ preventDefault() {} }); await tick(); await tick();
    ok("sign-in OK → card gone, boot continues once", !m.els["ha-auth"] && m.calls.initFb === 1 && m.calls.renderAll === 1 && m.T("_haAuthOk") === true && m.T("_haAuthUser").email === "fam@x"); }
  console.log("\n# never strand a device");
  { const m = mk({ fetchFail: true }); m.T("haAuthGate")(); await tick(); await tick();
    ok("probe can't reach the network → boots anyway", m.calls.initFb === 1 && !m.els["ha-auth"]); }
  { const m = mk({ noAuth: true }); m.T("haAuthGate")(); await tick();
    ok("auth SDK missing → boots as before", m.calls.initFb === 1 && m.T("_haAuthOk") === true); }
  { const m = mk({ probe: 200 }); m.T("haAuthGate")(); m.T("haAuthGate")(); await tick(); await tick();
    ok("probe is shared (one fetch), boot runs once", m.calls.initFb === 1); }
  console.log("\n# locked out mid-session");
  { const m = mk({ probe: 200, signInOk: true }); m.T("haAuthGate")(); await tick(); await tick();
    ok("booted open; watcher armed (visibility + 5-min timer)", m.calls.initFb === 1 && (m.listeners.visibilitychange || []).length === 1 && m.timers.length === 1 && m.timers[0].ms === 300000);
    m.setProbe(401); m.listeners.visibilitychange[0](); await tick(); await tick();
    ok("rules flipped → coming to the foreground shows the card with the signed-out message", !!m.els["ha-auth"] && /signed out/.test(m.els["ha-auth-m"] ? m.els["ha-auth-m"].textContent : (m.ctx.document.getElementById("ha-auth-m") || {}).textContent || ""));
    m.listeners.visibilitychange[0](); await tick();
    ok("a second check does not stack a second card", m.ctx.document.body.children.filter(n => n.id === "ha-auth").length === 1);
    m.els["ha-auth-e"] = { id: "ha-auth-e", value: "fam@x", focus() {} }; m.els["ha-auth-p"] = { id: "ha-auth-p", value: "pw" };
    m.T("haAuthSubmit")({ preventDefault() {} }); await tick(); await tick();
    ok("mid-session sign-in → page reload (listeners re-attach), not a second initFb", m.reloads() === 1 && m.calls.initFb === 1 && !m.els["ha-auth"]);
    const t2 = mk({ probe: 200, user: { email: "fam@x" } }); t2.T("haAuthGate")(); await tick();
    t2.setProbe(401); t2.timers[0].fn(); await tick(); await tick();
    ok("a signed-in device is never nagged by the timer", !t2.els["ha-auth"]); }
  console.log("\n# wiring in index.html");
  { ok("auth SDK script tag after database", src.indexOf('<script src="vendor-firebase-auth-v8.js">') > src.indexOf('<script src="vendor-firebase-database-v8.js">') && src.indexOf('<script src="vendor-firebase-auth-v8.js">') < src.indexOf("<script src=\"vendor-firebase-storage-v8.js\">"));
    ok("vendored auth SDK exists (8.10.1 compat)", fs.existsSync(path.join(__dirname, "vendor-firebase-auth-v8.js")) && fs.statSync(path.join(__dirname, "vendor-firebase-auth-v8.js")).size > 100000);
    const i = src.indexOf("function initFb() {");
    ok("initFb's first line is the gate", /^function initFb\(\) \{\n  if\(!_haAuthOk\)\{ haAuthGate\(\); return; \}/.test(src.slice(i, i + 90)), src.slice(i, i + 90));
    ok("initializeApp guarded against the gate's earlier init", /if\(!\(firebase\.apps&&firebase\.apps\.length\)\) firebase\.initializeApp\(FB_CFG\);\s*\/\/ haAuthGate may already have/.test(src));
    ok("boot tail unchanged", /\ninitFb\(\); renderAll\(\);\n/.test(src));
    ok("no bare column-0 brace inside the block", !/\n\}\n(?!function|const|let|\/\/|$)/.test(block)); }

  // ── Where the sign-in is KEPT (2026-09-17) ──────────────────────────────────
  // The auth SDK stores the session in IndexedDB when window.indexedDB exists, else in
  // localStorage. webOS (the LG) and iOS (a home-screen web app) both keep IndexedDB alive at
  // RUNTIME — so the SDK's write-read probe passes — but empty it between launches, while
  // localStorage survives. Both devices therefore asked for the password after every full close
  // and never on a refresh. This was once gated on a webOS-only user-agent sniff, which missed
  // iOS entirely; a sniff can only ever guess which devices have durable IndexedDB, so the hide
  // is now unconditional. Nothing else in the app touches IndexedDB (only the auth SDK does).
  console.log("\n# the sign-in is kept in localStorage, on every device");
  { const gate = src.slice(src.indexOf("function haAuthGate()"), src.indexOf("function haAuthProbe()"));
    const hide = /Object\.defineProperty\(window,"indexedDB",\{value:undefined,configurable:true\}\)/;
    ok("IndexedDB is hidden from the auth SDK", hide.test(gate));
    ok("…with no user-agent sniff gating it",
       !/(if\s*\(|&&|\|\|)[^\n]*navigator\.userAgent[^\n]*\n?\s*Object\.defineProperty\(window,"indexedDB"/.test(gate)
       && !/Web0S|SmartTV|NetCast/.test(gate), gate.match(/.*userAgent.*/)||null);
    const iHide = gate.search(hide), iAuth = gate.indexOf("firebase.auth");
    ok("…and it runs BEFORE firebase.auth is first touched", iHide >= 0 && iAuth >= 0 && iHide < iAuth, {iHide, iAuth});
    ok("the hide is wrapped so a locked-down window can't break boot",
       /try\{\s*Object\.defineProperty\(window,"indexedDB"[\s\S]{0,80}?\}catch/.test(gate));
    // The webOS POLLING TRANSPORT is a different concern and is still correctly UA-gated.
    ok("the webOS polling-transport sniff is left alone", /Web0S\|SmartTV\|NetCast/.test(src) && /ha_lp/.test(src)); }

  // ── A FULL localStorage (2026-09-17, her iPhone: 5,313 KB, every write threw) ──
  console.log("\n# localStorage full: prune stale week caches, and only move the session if a save works");
  { const PB = src.slice(src.indexOf("// LSPRUNE_START"), src.indexOf("// LSPRUNE_END"));
    const vm2 = require("vm");
    // A localStorage with iOS's ~5 MB cap: a write that would push it over throws QuotaExceededError.
    function mkLS(init, capKB) {
      const st = Object.assign({}, init);
      const size = () => Object.keys(st).reduce((a, k) => a + (k.length + String(st[k]).length) * 2, 0);
      return { st, size, get length() { return Object.keys(st).length; }, key: i => Object.keys(st)[i],
        getItem: k => (k in st ? st[k] : null), removeItem: k => { delete st[k]; },
        setItem: (k, v) => { const prev = k in st ? st[k] : undefined; st[k] = String(v);
          if (size() > capKB * 1024) { if (prev === undefined) delete st[k]; else st[k] = prev;
            const e = new Error("The quota has been exceeded."); e.name = "QuotaExceededError"; throw e; } } };
    }
    function env(ls, wk, fam) { const e = { localStorage: ls, WK: wk, window: { HA_FAMILY: fam ? { familyId: fam } : null }, String, parseInt };
      vm2.createContext(e); vm2.runInContext(PB, e); return e; }
    const KB = n => "x".repeat(Math.round(n * 1024 / 2));
    {
      const ls = mkLS({ week3_tasks: "a", week20_history: "b", week21_tasks: "c", week22_tasks: "d", week23_tasks: "e", week24_tasks: "f",
                        ha_mastery: "g", ha_active_wk: "week23", "burris:week3_tasks": "h" }, 5120);
      const e = env(ls, "week23");
      const n = vm2.runInContext("haPruneWeekCaches()", e);
      ok("weeks before LAST week are removed", !("week3_tasks" in ls.st) && !("week20_history" in ls.st) && !("week21_tasks" in ls.st), Object.keys(ls.st));
      ok("last week, this week and next week are KEPT", "week22_tasks" in ls.st && "week23_tasks" in ls.st && "week24_tasks" in ls.st);
      ok("ha_* keys are never touched", "ha_mastery" in ls.st && "ha_active_wk" in ls.st);
      ok("another family's keys are never touched", "burris:week3_tasks" in ls.st);
      ok("reports how many it removed", n === 3, n);
    }
    {
      const ls = mkLS({ "burris:week3_tasks": "a", "burris:week23_tasks": "b", week3_tasks: "c" }, 5120);
      const e = env(ls, "week23", "burris"); vm2.runInContext("haPruneWeekCaches()", e);
      ok("a beta family prunes only its OWN prefixed keys", !("burris:week3_tasks" in ls.st) && "burris:week23_tasks" in ls.st && "week3_tasks" in ls.st, Object.keys(ls.st));
    }
    {
      const ls = mkLS({ week3_tasks: "a" }, 5120);
      const e = env(ls, ""); vm2.runInContext("haPruneWeekCaches()", e);
      ok("an unknown active week prunes nothing", "week3_tasks" in ls.st);
    }
    // The iPhone's real shape (its ten biggest keys as reported), model filler for the rest.
    {
      const init = { ha_mastery: KB(2392), ha_archive: KB(1168), week5_history: KB(197), week4_tasks: KB(98), week5_tasks: KB(91),
        week4_history: KB(87), week3_history: KB(85), week12_tasks: KB(83), week6_history: KB(79), week11_tasks: KB(73) };
      for (let w = 3; w <= 23; w++) ["_meta", "_checked", "_sl", "_claimed"].forEach(x => { if (!init["week" + w + x]) init["week" + w + x] = KB(6); });
      for (let i = 0; i < 40; i++) init["ha_misc" + i] = KB(1);
      const ls = mkLS(init, 999999); const before = ls.size() / 1024;
      const cap = mkLS(init, before - 1);                         // ~full, as on the phone
      const e = env(cap, "week23");
      const okBefore = vm2.runInContext("_haLsWritable()", e);
      vm2.runInContext("haPruneWeekCaches()", e);
      const okAfter = vm2.runInContext("_haLsWritable()", e);
      console.log("      model: " + Math.round(before) + " KB before, " + Math.round(cap.size() / 1024) + " KB after prune");
      ok("on a full store the test save FAILS before pruning", okBefore === false);
      ok("…and SUCCEEDS after pruning stale weeks", okAfter === true);
      ok("the mastery and archive mirrors are left in place", "ha_mastery" in cap.st && "ha_archive" in cap.st);
    }
    const gate = src.slice(src.indexOf("function haAuthGate()"), src.indexOf("function haAuthProbe()"));
    ok("the gate prunes BEFORE it tests the store", gate.indexOf("haPruneWeekCaches()") >= 0 && gate.indexOf("haPruneWeekCaches()") < gate.indexOf("_haLsWritable()"));
    ok("IndexedDB is hidden ONLY when a test save succeeds", /if\(_haLsOk\)\{\s*try\{\s*Object\.defineProperty\(window,"indexedDB"/.test(gate));
    ok("both run before firebase.auth is first touched", gate.indexOf("_haLsWritable()") < gate.indexOf("firebase.auth"));
    ok("the pruner and the probe are try-wrapped so boot can never break", /try\{\s*_haPruned=haPruneWeekCaches\(\);\s*\}catch/.test(gate) && /catch\(e\)\{\s*return false;\s*\}/.test(PB)); }
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})();
