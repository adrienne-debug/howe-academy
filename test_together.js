/*
 * 🤝 Together (her design 2026-09-24 — "the first point that we interlink kids"): two kids share one live session at
 * together/active/<id>. Pair: one starts, the other accepts/declines on their device. Lottery (Julian's bath): a spin
 * picks a helper; a decline spins again without them. Done → each rates the OTHER; both in → each banks max × rating
 * (wages, logged). Mom's list is editable. Targeted writes; dry-run inert.
 *   run:  node test_together.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const a = src.indexOf("// TOGETHER_START"), b = src.indexOf("// TOGETHER_END");
if (a < 0 || b < 0) { console.error("TOGETHER markers not found"); process.exit(1); }
let pass = 0, fail = 0;
function ok(n, c, x) { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } }
function world(o) {
  o = o || {};
  const writes = [], banks = [], logs = [], toasts = [];
  const ctx = {
    console, kcKid: o.device || null, momHere: () => o.device === "mom", _kioskK: () => false, KID_COLOR: {}, tab: "kids",
    bankDirect: (k, p, n) => { banks.push([k, p, n]); return "bd"; }, rlogAppend: (k, slot, label, act, pts) => logs.push([k, slot, label, pts]),
    cap: s => s.charAt(0).toUpperCase() + s.slice(1), nowTs: () => "7:30 PM Sep 24", dbg: () => {}, gwShowToast: m => toasts.push(m), renderAll: () => {},
    _dryRun: () => !!o.dry, db: { ref: p => ({ set: v => writes.push(["set", p, v]), update: v => writes.push(["update", p, v]), remove: () => writes.push(["remove", p]) }) },
    document: { getElementById: () => null }, Math: o.rand != null ? { floor: Math.floor, max: Math.max, min: Math.min, round: Math.round, random: () => o.rand } : Math,
    Object, Array, String, Number, Date, JSON, parseInt,
  };
  vm.createContext(ctx); vm.runInContext(src.slice(a, b), ctx);
  if (o.state) vm.runInContext("together=" + JSON.stringify(o.state) + ";", ctx);
  const w = { ctx, writes, banks, logs, toasts, call: e => vm.runInContext(e, ctx), as: dev => { o.device = dev; ctx.kcKid = dev === "mom" ? null : dev; return w; } };
  return w;
}
// the same session seen from another device: copy the shared state over
const sync = (from, to) => { to.call("together=" + JSON.stringify(from.call("together")) + ";"); };

console.log("── a pair: Ellis teaches Lucy ──");
{
  const E = world({ device: "ellis" });
  const rec = E.call("tgStart('math_teach','ellis')");
  ok("Ellis starts → invited, waiting for Lucy", rec.status === "invited" && rec.invitee === "lucy" && rec.a.kid === "ellis" && rec.b.kid === "lucy");
  ok("the session is written for every device to watch", E.writes.some(x => x[0] === "set" && x[1] === "together/active/math_teach"));
  const L = world({ device: "lucy" }); sync(E, L);
  ok("Lucy's Kids' Corner shows Let's go / Not now", /wants to do this with <b>you<\/b>/.test(L.call("tgKidHTML('lucy')")) && /Let’s go/.test(L.call("tgKidHTML('lucy')")));
  ok("Ellis's shows waiting", /Waiting for Lucy/.test(E.call("tgKidHTML('ellis')")));
  L.call("tgAccept('math_teach','lucy')"); sync(L, E);
  ok("Lucy accepts → live on both", L.call("tgActive('math_teach').status") === "live" && /● Live with Lucy/.test(E.call("tgKidHTML('ellis')")) && /You are the Teacher/.test(E.call("tgKidHTML('ellis')")));
  E.call("tgDone('math_teach','ellis')"); sync(E, L);
  ok("either kid taps We're done → rating on both", L.call("tgActive('math_teach').status") === "rating" && /How did Ellis do as your Teacher/.test(L.call("tgKidHTML('lucy')")) && /How did Lucy do as your Learner/.test(E.call("tgKidHTML('ellis')")));
  L.call("tgRate('math_teach','lucy',4)"); sync(L, E);
  ok("Lucy rated 4 stars; waiting on Ellis; nothing paid yet", E.call("tgActive('math_teach').ratings.lucy") === 4 && E.banks.length === 0 && /Waiting for Ellis to rate/.test(L.call("tgKidHTML('lucy')")));
  E.call("tgRate('math_teach','ellis',5)");
  ok("both in → Ellis banks 28 (35×4/5), Lucy banks 35, session cleared, logged", E.banks.length === 2 && E.banks.find(x => x[0] === "ellis")[1] === 28 && E.banks.find(x => x[0] === "lucy")[1] === 35 && E.call("tgActive('math_teach')") === null && E.logs.length === 2 && E.writes.some(x => x[0] === "remove" && x[1] === "together/active/math_teach") && E.writes.some(x => x[1].indexOf("together/log/") === 0 && x[2].status === "done"));
  ok("the bank note says who rated", /🧮 Math teaching · Teacher · ★★★★☆ from Lucy/.test(E.banks.find(x => x[0] === "ellis")[2]));
}
{
  const E = world({ device: "ellis" }); E.call("tgStart('math_teach','ellis')");
  const L = world({ device: "lucy" }); sync(E, L); L.call("tgDecline('math_teach','lucy')");
  ok("Not now ends it, nothing paid", L.call("tgActive('math_teach')") === null && L.banks.length === 0 && L.writes.some(x => x[1].indexOf("together/log/") === 0 && x[2].status === "declined"));
}
{
  const X = world({ device: "lincoln" }); X.call("tgStart('math_teach','ellis')"); sync(X, X);
  X.call("tgAccept('math_teach','lucy')");
  ok("a device that isn't Lucy's (or Mom's) can't accept for her", X.call("tgActive('math_teach').status") === "invited");
  const M = world({ device: "mom" }); M.call("tgStart('math_teach','mom')");
  ok("Mom starting a pair goes live at once", M.call("tgActive('math_teach').status") === "live");
}
console.log("\n── the bath lottery ──");
{
  const J = world({ device: "julian", rand: 0.5 });
  J.call("tgStart('bath','julian')");
  let a = J.call("tgActive('bath')");
  ok("Julian spins → a helper is picked from Lincoln/Ellis/Lucy and invited", a.status === "invited" && ["lincoln", "ellis", "lucy"].indexOf(a.b.kid) >= 0 && a.invitee === a.b.kid, a);
  const first = a.b.kid;
  const H = world({ device: first }); sync(J, H);
  ok("the helper's device says Julian picked you", /picked <b>you<\/b> to help with the bath/.test(H.call("tgKidHTML('" + first + "')")));
  H.call("tgDecline('bath','" + first + "')"); sync(H, J);
  a = J.call("tgActive('bath')");
  ok("decline → spins again without them", a.status === "invited" && a.b.kid !== first && a.declined.indexOf(first) >= 0, a);
  const second = a.b.kid; const H2 = world({ device: second }); sync(J, H2);
  H2.call("tgAccept('bath','" + second + "')"); sync(H2, J);
  J.call("tgDone('bath','julian')"); sync(J, H2);
  ok("Julian's side rates with faces", /😀/.test(J.call("tgKidHTML('julian')")) && /😞/.test(J.call("tgKidHTML('julian')")));
  J.call("tgRate('bath','julian',5)"); sync(J, H2);
  H2.call("tgRate('bath','" + second + "',3)");
  ok("😀 = 50 for the helper; Julian gets 30 (50×3/5)", H2.banks.find(x => x[0] === second)[1] === 50 && H2.banks.find(x => x[0] === "julian")[1] === 30, H2.banks);
  ok("the helper's note carries Julian's face", /😀 from Julian/.test(H2.banks.find(x => x[0] === second)[2]));
}
{
  const J = world({ device: "julian", state: { active: { bath: { id: "bath", name: "x", kind: "lottery", max: 50, faces: true, status: "spinning", a: { kid: "julian" }, b: null, ratings: {}, declined: ["lincoln", "ellis", "lucy"] } } } });
  J.call("tgSpinPick('bath')");
  ok("everyone declined → 'nobody could help'", J.call("tgActive('bath').status") === "nohelper");
}
console.log("\n── Mom's list, guards ──");
{
  const M = world({ device: "mom" });
  M.call("tgSaveDef('math_teach',{max:40,b:{kid:'julian',role:'Learner'}})");
  const d = M.call("tgDef('math_teach')");
  ok("Mom edits a def (max, who); defaults fill the rest", d.max === 40 && d.b.kid === "julian" && d.a.kid === "ellis" && d.emoji === "🧮" && M.writes.some(x => x[1] === "together/defs/math_teach"));
  ok("the Mom's Plan card lists everything with Start / Spin", /Math teaching/.test(M.call("mdCardTogether()")) && /🎰 Spin/.test(M.call("mdCardTogether()")) && /▶ Start/.test(M.call("mdCardTogether()")));
  const K = world({ device: "lucy" }); K.call("tgSaveDef('math_teach',{max:999})");
  ok("a kid can't edit the list", K.writes.length === 0 && K.call("tgDef('math_teach').max") === 35);
  const D = world({ device: "mom", dry: true }); D.call("tgStart('math_teach','mom')");
  ok("dry-run writes nothing", D.writes.length === 0);
}
console.log("\n── the wiring ──");
ok("Kids' Corner today view opens with the Together section", /let h=\(typeof tgKidHTML==="function"\)\?tgKidHTML\(k\):"";/.test(src));
ok("Mom's Plan renders the Together card", /try\{ h\+=mdCardTogether\(\); \}catch\(e\)\{\}/.test(src));
ok("every device follows together/active", /db\.ref\("together"\)\.on\("value"/.test(src));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
