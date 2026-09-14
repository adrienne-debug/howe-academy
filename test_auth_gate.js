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
  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})();
