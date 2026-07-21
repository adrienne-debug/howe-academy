/*
 * Node tests for the scheduler write lock (/regen_lock).
 *
 * Slices the REAL lock helpers (haClaimSchedLock, schedLockFresh, lockHeldByOther)
 * out of index.html and runs them against a fake transactional db. Asserts:
 * atomic claim when free, refusal while another device holds a fresh lock,
 * takeover of a stale (expired) lock, release only clears our own claim, and
 * the dry-run / no-db bypass.
 *
 *   run:  node test_sched_lock.js
 */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

function slice(name) {
  const sig = "function " + name + "(";
  const i = src.indexOf(sig);
  if (i < 0) throw new Error("function not found: " + name);
  let d = 0, j = src.indexOf("{", i);
  for (let k = j; k < src.length; k++) {
    if (src[k] === "{") d++;
    else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); }
  }
  throw new Error("unbalanced braces: " + name);
}
const FNS = ["schedLockFresh", "lockHeldByOther", "haClaimSchedLock"].map(slice).join("\n");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}

// Fake RTDB: one node, real transaction semantics (update fn returns undefined = abort).
function mkDb(initial) {
  const state = { val: initial === undefined ? null : initial };
  return {
    state,
    ref: p => {
      if (p !== "regen_lock") throw new Error("unexpected ref " + p);
      return {
        transaction: (up, done) => {
          const next = up(state.val);
          const snap = { val: () => state.val };
          if (next === undefined) { done && done(null, false, snap); return; }
          state.val = next;
          done && done(null, true, snap);
        }
      };
    }
  };
}

function mkEnv(dbi, opts) {
  opts = opts || {};
  const env = {
    db: dbi, _dryRun: () => !!opts.dry,
    HA_DEV_ID: opts.dev || "dev_me",
    SCHED_LOCK_TTL: 90000,
    schedLock: opts.mirror === undefined ? null : opts.mirror,
    Date, Math, Object, JSON,
    _timerCalls: { n: 0 },
  };
  // Immediate fake timer so claim retries run synchronously; opts.onTimer can
  // mutate db state to simulate the holder releasing mid-retry.
  env.setTimeout = f => { env._timerCalls.n++; if (opts.onTimer) opts.onTimer(env._timerCalls.n); f(); };
  return env;
}
function call(env, expr) {
  const keys = Object.keys(env);
  return new Function(...keys, "\"use strict\";" + FNS + "; return (" + expr + ")();")(...keys.map(k => env[k]));
}

console.log("claim + release");
{
  const dbi = mkDb(null);
  const env = mkEnv(dbi);
  const got = call(env, `()=>{ let r=null; haClaimSchedLock("regen",x=>{r=x;}); return {gotRelease:!!r, rel:r}; }`);
  ok("free lock claimed", got.gotRelease === true && dbi.state.val && dbi.state.val.dev === "dev_me" && dbi.state.val.kind === "regen", dbi.state.val);
  // release clears our own claim
  call(mkEnv(dbi), `()=>{ let r; haClaimSchedLock("x",x=>{r=x;}); r(); return null; }`); // same dev reclaims then releases
  ok("release clears own claim", dbi.state.val === null, dbi.state.val);
}
{
  // held FRESH by someone else → refused
  const dbi = mkDb({ dev: "dev_other", ts: Date.now(), kind: "regen" });
  const got = call(mkEnv(dbi), `()=>{ let r="unset"; haClaimSchedLock("cascade",x=>{r=x;}); return r; }`);
  ok("fresh foreign lock refused", got === null && dbi.state.val.dev === "dev_other");
}
{
  // STALE foreign lock → taken over
  const dbi = mkDb({ dev: "dev_other", ts: Date.now() - 120000, kind: "regen" });
  const got = call(mkEnv(dbi), `()=>{ let r=null; haClaimSchedLock("cascade",x=>{r=x;}); return !!r; }`);
  ok("stale foreign lock taken over", got === true && dbi.state.val.dev === "dev_me", dbi.state.val);
}
{
  // our own fresh lock → re-entrant claim allowed (same device wins again)
  const dbi = mkDb({ dev: "dev_me", ts: Date.now(), kind: "regen" });
  const got = call(mkEnv(dbi), `()=>{ let r=null; haClaimSchedLock("cascade",x=>{r=x;}); return !!r; }`);
  ok("own lock re-claimable", got === true);
}
{
  // release never clears someone else's lock
  const dbi = mkDb(null);
  const env = mkEnv(dbi);
  const rel = call(env, `()=>{ let r; haClaimSchedLock("x",x=>{r=x;}); return r; }`);
  dbi.state.val = { dev: "dev_other", ts: Date.now(), kind: "regen" }; // other device took over (we expired)
  rel();
  ok("release leaves a foreign lock alone", dbi.state.val && dbi.state.val.dev === "dev_other", dbi.state.val);
}
{
  // dry-run / no db → immediate noop-release callback (nothing to serialize)
  const got1 = call(mkEnv(null), `()=>{ let r=null; haClaimSchedLock("x",x=>{r=x;}); return typeof r; }`);
  const dbi = mkDb(null);
  const got2 = call(mkEnv(dbi, { dry: true }), `()=>{ let r=null; haClaimSchedLock("x",x=>{r=x;}); return typeof r; }`);
  ok("no db → noop release", got1 === "function");
  ok("dry-run → noop release, no lock written", got2 === "function" && dbi.state.val === null);
}

console.log("regen claim retries through cascade holds");
{
  // A background sweep holds the lock when Mom taps Regenerate: the claim must
  // wait it out, not silently abort (the "button does nothing" bug).
  const dbi = mkDb({ dev: "dev_other", ts: Date.now(), kind: "cascade" });
  const env = mkEnv(dbi, { onTimer: n => { if (n === 3) dbi.state.val = null; } });
  const got = call(env, `()=>{ let r="unset"; haClaimSchedLock("regen",x=>{r=x;}); return {ok:!!r&&r!=="unset", tries:_timerCalls.n}; }`);
  ok("regen waits out a cascade hold and wins", got.ok === true && got.tries === 3, got);
  ok("lock now ours", dbi.state.val && dbi.state.val.dev === "dev_me" && dbi.state.val.kind === "regen", dbi.state.val);
}
{
  // A competing REGEN on another device: abort immediately, no retry spin.
  const dbi = mkDb({ dev: "dev_other", ts: Date.now(), kind: "regen" });
  const env = mkEnv(dbi);
  const got = call(env, `()=>{ let r="unset"; haClaimSchedLock("regen",x=>{r=x;}); return {r:r, tries:_timerCalls.n}; }`);
  ok("competing regen aborts immediately", got.r === null && got.tries === 0, got);
}
{
  // Holder never releases: retries exhaust and the claim reports failure.
  const dbi = mkDb({ dev: "dev_other", ts: Date.now(), kind: "cascade" });
  const env = mkEnv(dbi);
  const got = call(env, `()=>{ let r="unset"; haClaimSchedLock("regen",x=>{r=x;}); return {r:r, tries:_timerCalls.n}; }`);
  ok("stuck cascade hold exhausts retries", got.r === null && got.tries === 16, got);
}
{
  // Plain cascade claims stay single-shot (cheap skip, no retry churn).
  const dbi = mkDb({ dev: "dev_other", ts: Date.now(), kind: "cascade" });
  const env = mkEnv(dbi);
  const got = call(env, `()=>{ let r="unset"; haClaimSchedLock("cascade",x=>{r=x;}); return {r:r, tries:_timerCalls.n}; }`);
  ok("cascade claim does not retry", got.r === null && got.tries === 0, got);
}

console.log("lockHeldByOther");
{
  ok("null mirror → false", call(mkEnv(null, { mirror: null }), `()=>lockHeldByOther()`) === false);
  ok("own fresh lock → false", call(mkEnv(null, { mirror: { dev: "dev_me", ts: Date.now() } }), `()=>lockHeldByOther()`) === false);
  ok("foreign fresh lock → true", call(mkEnv(null, { mirror: { dev: "dev_other", ts: Date.now() } }), `()=>lockHeldByOther()`) === true);
  ok("foreign stale lock → false", call(mkEnv(null, { mirror: { dev: "dev_other", ts: Date.now() - 120000 } }), `()=>lockHeldByOther()`) === false);
}

console.log("");
console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
