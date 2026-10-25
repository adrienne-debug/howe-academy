// PRNOREASON — her ask 2026-10-24: a kid's "Ask Mom for stars" sends even with the reason left blank.
const fs = require("fs"), vm = require("vm");
const src = fs.readFileSync(__dirname + "/index.html", "utf8");
let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; console.log("  ok  - " + name); } else { fail++; console.log("  FAIL - " + name); } };

const a = src.indexOf("// PRNOREASON_START"), b = src.indexOf("function _prSectionHTML(");
ok("block + ask functions found", a > 0 && b > a);
const code = src.slice(a, b);

function run(fields, opts) {
  opts = opts || {};
  const writes = [], toasts = [], logs = [];
  const dom = { "pr-amt": { value: fields.amt }, "pr-why": { value: fields.why } };
  const ctx = {
    pointRequests: {}, bank: {}, ROSTER: ["ellis"], prFormOpen: true,
    db: opts.noDb ? null : { ref: p => ({ key: "k" + writes.length, push() { return this; }, set: v => writes.push([p, "set", v]), update: v => writes.push([p, "update", v]) }) },
    document: { getElementById: id => dom[id] || null },
    gwShowToast: t => toasts.push(t), rlogAppend: (k, s, l) => logs.push(l),
    renderAll() {}, momHere: () => true, nowTs: () => "07:00 PM Oct 24", cap: s => s[0].toUpperCase() + s.slice(1),
    setTimeout() {}, console
  };
  vm.createContext(ctx);
  vm.runInContext(code + "\nthis.prSubmit=prSubmit;this.prApprove=prApprove;this.prPending=prPending;this.prWhy=prWhy;", ctx);
  ctx.prSubmit("ellis");
  return { ctx, writes, toasts, logs };
}

// 1. Ellis's case: 100 stars, reason blank → it sends
let r = run({ amt: "100", why: "" });
const sent = r.writes.find(w => w[1] === "set" && /^pointRequests\/ellis/.test(w[0]));
ok("blank reason still sends to pointRequests/ellis", !!sent);
ok("amount 100, status pending, reason empty", sent && sent[2].amount === 100 && sent[2].status === "pending" && sent[2].reason === "");
ok("kid sees 'Sent to Mom'", r.toasts.includes("Sent to Mom 🙋"));
ok("no 'Say what you did' refusal", !r.toasts.includes("Say what you did"));
ok("log line says (no reason given)", r.logs[0] === "(no reason given) (100 ⭐ asked)");
const pend = r.ctx.prPending("ellis");
ok("shows as pending for Mom", pend.length === 1 && r.ctx.prWhy(pend[0]) === "(no reason given)");

// 2. Mom approves it → statement note reads (no reason given)
r.ctx.prApprove("ellis", pend[0].id);
const adj = r.writes.find(w => /^bank\/ellis\/adjustments/.test(w[0]));
ok("approve pays 100 with note '🙋 (no reason given)'", adj && adj[2].amount === 100 && adj[2].note === "🙋 (no reason given)");

// 3. whitespace-only reason counts as none
r = run({ amt: "5", why: "   " });
ok("spaces-only reason sends, shown as (no reason given)", r.ctx.prWhy(r.ctx.prPending("ellis")[0]) === "(no reason given)");

// 4. amount is still required
r = run({ amt: "", why: "mulched the beds" });
ok("no amount → nothing sent", r.writes.length === 0 && r.toasts.includes("How many stars did you agree on?"));

// 5. with a reason, unchanged
r = run({ amt: "50", why: "gave Julian a bath" });
const s2 = r.writes.find(w => w[1] === "set");
ok("reason kept as typed", s2 && s2[2].reason === "gave Julian a bath" && r.logs[0] === "gave Julian a bath (50 ⭐ asked)");
ok("prWhy returns the reason when there is one", r.ctx.prWhy({ reason: "x" }) === "x");

// 6. no leftover "Extra job" fallbacks for star asks
ok("no r.reason||\"Extra job\" left", src.indexOf('r.reason||"Extra job"') < 0);
ok("no 🔀 in index.html", src.indexOf("\u{1F500}") < 0);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
