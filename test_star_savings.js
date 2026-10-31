/*
 * Node tests — 🐷 Star Savings (Ellis's ask 2026-10-31; Adrienne's yes to the recommended answers the same day):
 * opens once the Star Bank reaches 5,000 · 1% every Sunday, compounding, rounded down · interest is calculated,
 * never written · taking stars out waits for Mom's yes · a rate change only reaches later Sundays · docks never
 * touch savings · Mom's settings need the store PIN.
 *   run:  node test_star_savings.js
 */
process.env.TZ = "America/New_York";
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error("markers " + a); return src.slice(i, j); };
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
const CODE = cut("// SAVINGS_START", "// SAVINGS_END") + "\n" + ["_bankTsDate", "bankLedger", "bankBalance"].map(slice).join("\n") +
  "\nfunction __cfg(c){ savingsCfg=c; }";
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
const iso = s => new Date(s).toISOString();

function world(o) {
  o = o || {}; const writes = [], els = {}, toasts = [];
  const mkEl = id => { const e = { id, innerHTML: "", value: "", onclick: null, className: "", remove() { delete els[this.id]; delete els["kk-confirm-yes"]; delete els["kk-confirm-no"]; } }; return e; };
  const ctx = { console, JSON, Object, Array, String, Number, Math, Date, parseInt, parseFloat, isFinite, isNaN,
    bank: o.bank || {}, pointClaims: o.claims || {},
    esc: s => String(s), cap: s => s[0].toUpperCase() + s.slice(1), nowTs: () => "Sat 10:00 AM Oct 31",
    momHere: () => !!o.mom, storeEditCan: () => !!o.pin, renderAll: () => {}, gwShowToast: t => toasts.push(t),
    SL_KIDS: ["lincoln", "ellis", "lucy", "julian"],
    obSet: (p, v) => writes.push(["set", p, JSON.parse(JSON.stringify(v))]), obRemove: p => writes.push(["remove", p]),
    db: { ref: p => ({ set: v => writes.push(["set", p, v]) }) },
    document: { getElementById: id => els[id] || null, createElement: () => mkEl("kk-confirm"),
      body: { appendChild(e) { els[e.id] = e; els["kk-confirm-yes"] = { onclick: null }; els["kk-confirm-no"] = { onclick: null }; } } } };
  vm.createContext(ctx);
  vm.runInContext(CODE, ctx);
  if (o.cfg) ctx.__cfg(o.cfg);
  const yes = () => { const b = els["kk-confirm-yes"]; if (b && b.onclick) b.onclick(); };
  return { c: ctx, writes, els, toasts, yes };
}
// Ellis's spending balance comes from one cashed day-claim worth `n`.
const claims = n => ({ ellis: { week30: { mon: { status: "cashed", earned: n, cashedTs: "x", claimedTs: "x" } } } });
const dep = (amt, when, extra) => Object.assign({ amount: amt, dir: "in", iso: iso(when), ts: "t", status: "done" }, extra || {});
const out = (amt, when, status, extra) => Object.assign({ amount: amt, dir: "out", iso: iso(when), ts: "t", status }, extra || {});

console.log("── locked until the Star Bank reaches 5,000 ──");
{
  const { c, writes } = world({ claims: claims(3840) });
  ok("3,840 ⭐ → savings is not open", c.savOpen("ellis") === false);
  const h = c._savSectionHTML("ellis", false);
  ok("the card shows the progress line: opens at 5,000 · 1,160 to go", /opens at <b>5,000/.test(h) && /1,160 to go/.test(h), h);
  ok("…with a progress bar about 77% full", /width:77%/.test(h));
  c.savMoveIn("ellis", 100);
  ok("a move in while locked writes nothing", writes.length === 0);
}
console.log("\n── 5,000 ⭐ → he saves it ──");
{
  const { c, writes, yes } = world({ claims: claims(5000) });
  ok("5,000 ⭐ → savings is open", c.savOpen("ellis") === true);
  c.savMoveIn("ellis", 5000);
  ok("the 'Is this Ellis?' check comes first — nothing written yet", writes.length === 0);
  yes();
  ok("one targeted write under bank/ellis/savings/<id>", writes.length === 1 && /^bank\/ellis\/savings\/sv/.test(writes[0][1]), writes);
  ok("…a done move in of 5,000", writes[0][2].dir === "in" && writes[0][2].amount === 5000 && writes[0][2].status === "done");
  ok("spending drops to 0", c.bankBalance("ellis") === 0, c.bankBalance("ellis"));
  const line = c.bankLedger("ellis")[0];
  ok("the spending statement shows 'To savings' −5,000", line.kind === "sav" && line.signed === -5000 && line.note === "To savings", line);
  ok("savings stays open after spending drops", c.savOpen("ellis") === true);
  ok("savings holds 5,000 (no Sunday yet)", c.savBalance("ellis", new Date()) === 5000);
}
console.log("\n── interest: 1% every Sunday, compounding, rounded down, never written ──");
{
  const { c, writes } = world({ claims: claims(5000), bank: { ellis: { savings: { a: dep(5000, "2026-10-31T10:00:00-04:00") } } } });
  const sun1 = new Date(2026, 10, 1, 9), sun2 = new Date(2026, 10, 8, 9);
  ok("Sun Nov 1 pays +50 → 5,050", c.savBalance("ellis", sun1) === 5050, c.savBalance("ellis", sun1));
  ok("Sun Nov 8 pays 1% of 5,050 = 50 (rounded down) → 5,100", c.savBalance("ellis", sun2) === 5100, c.savBalance("ellis", sun2));
  const ten = new Date(2026, 0 + 12, 3 + 7 * 0, 9); // Sun Jan 3 2027 = 10th Sunday
  ok("after 10 Sundays → 5,520 (the design's table)", c.savBalance("ellis", ten) === 5520, c.savBalance("ellis", ten));
  ok("savGrow agrees: 52 weeks of 5,000 at 1% → 8,356", c.savGrow(5000, 52, 1) === 8356);
  const led = c.savLedger("ellis", sun2);
  ok("the passbook lists Interest (1%) lines, newest first", led[0].kind === "int" && led[0].pct === 1 && led[0].amount === 50 && led.length === 3, led);
  ok("Saturday night has not paid yet", c.savBalance("ellis", new Date(2026, 10, 7, 23, 59)) === 5050);
  ok("calculating interest wrote nothing", writes.length === 0);
  const nx = c.savNext("ellis", new Date(2026, 10, 2, 12));
  ok("next interest on Mon Nov 2: +50 on Sun Nov 8", nx.amount === 50 && nx.dt.getDate() === 8 && nx.dt.getDay() === 0, nx);
  ok("spending is untouched by interest", c.bankBalance("ellis") === 0);
}
console.log("\n── a deposit starts earning the NEXT Sunday ──");
{
  const { c } = world({ bank: { ellis: { savings: {
    a: dep(5000, "2026-10-31T10:00:00-04:00"), b: dep(1000, "2026-11-04T15:00:00-05:00"), z: dep(500, "2026-11-08T00:00:00-05:00") } } } });
  // Nov 1: 5000→5050 · Nov 8: (5050+1000)=6050 → +60 → 6110, then the 12:00 AM Sunday deposit lands after → 6610
  ok("mid-week 1,000 earns on Sun Nov 8; the deposit made AT Sunday 12:00 AM waits a week", c.savBalance("ellis", new Date(2026, 10, 8, 12)) === 6610, c.savBalance("ellis", new Date(2026, 10, 8, 12)));
}
console.log("\n── taking stars out waits for Mom ──");
{
  const W = world({ claims: claims(5000), bank: { ellis: { savings: { a: dep(5000, "2026-10-25T10:00:00-04:00") } } } });
  const { c, writes, yes } = W;
  const bal = c.savBalance("ellis");
  c.savMoveOut("ellis", bal + 1);
  ok("more than savings holds is refused", writes.length === 0);
  c.savMoveOut("ellis", 2000); yes();
  ok("asking writes ONE pending move out", writes.length === 1 && writes[0][2].dir === "out" && writes[0][2].status === "pending", writes);
  const id = writes[0][1].split("/").pop();
  ok("…savings drops right away (waiting stars don't earn)", c.savBalance("ellis") === bal - 2000);
  ok("…and spending does NOT go up yet", c.bankBalance("ellis") === 0, c.bankBalance("ellis"));
  ok("it shows as waiting for Mom on the card", /waiting for Mom/.test(c._savSectionHTML("ellis", false)));
  ok("…with no Yes/No buttons for the kid", !/savApprove/.test(c._savSectionHTML("ellis", false)));
  c.savApprove("ellis", id);
  ok("a kid can't approve it (no Mom) — nothing written", writes.length === 1);
  c.savDecline("ellis", id);
  ok("…or decline it", writes.length === 1);
}
{
  const { c, writes } = world({ mom: true, claims: claims(5000), bank: { ellis: { savings: {
    a: dep(5000, "2026-10-25T10:00:00-04:00"), p: out(2000, "2026-10-28T10:00:00-04:00", "pending") } } } });
  ok("Mom's card has ✓ Yes / ✗ No", /savApprove\('ellis','p'\)/.test(c._savSectionHTML("ellis", true)));
  c.savApprove("ellis", "p");
  ok("Mom's yes writes status done at the same path", writes.length === 1 && writes[0][1] === "bank/ellis/savings/p" && writes[0][2].status === "done" && writes[0][2].doneIso);
  ok("…and the 2,000 lands in spending", c.bankBalance("ellis") === 2000, c.bankBalance("ellis"));
  ok("…shown as 'From savings' +2,000", c.bankLedger("ellis")[0].note === "From savings" && c.bankLedger("ellis")[0].signed === 2000);
}
{
  const { c, writes } = world({ mom: true, bank: { ellis: { savings: {
    a: dep(5000, "2026-10-25T10:00:00-04:00"), p: out(2000, "2026-10-28T10:00:00-04:00", "pending") } } } });
  const sun = new Date(2026, 10, 1, 12);
  ok("while waiting, Sun Nov 1 pays on 3,000 only", c.savBalance("ellis", sun) === 3030, c.savBalance("ellis", sun));
  const spendBefore = c.bankBalance("ellis");
  c.savDecline("ellis", "p");
  ok("Mom's no writes status declined", writes.length === 1 && writes[0][2].status === "declined");
  ok("…and it counts as if it never happened: 5,000 earned Sun Nov 1", c.savBalance("ellis", sun) === 5050, c.savBalance("ellis", sun));
  ok("…spending unchanged", c.bankBalance("ellis") === spendBefore, [spendBefore, c.bankBalance("ellis")]);
}
console.log("\n── a rate change only reaches later Sundays ──");
{
  const { c } = world({ cfg: { rates: { "2026-11-14": 2 } }, bank: { ellis: { savings: { a: dep(5000, "2026-10-31T10:00:00-04:00") } } } });
  const l = c.savLedger("ellis", new Date(2026, 10, 15, 12)).filter(e => e.kind === "int").reverse();
  ok("Nov 1 and Nov 8 paid 1%; Nov 15 pays 2%", l.length === 3 && l[0].pct === 1 && l[1].pct === 1 && l[2].pct === 2, l);
  ok("…2% of 5,100 = 102 → 5,202", c.savBalance("ellis", new Date(2026, 10, 15, 12)) === 5202);
}
{
  const { c, writes } = world({ pin: false });
  c.savSetRate("2"); c.savSetUnlock("ellis", "100"); c.savToggleKid("ellis");
  ok("without the store PIN, settings change nothing", writes.length === 0 && c.savUnlockAt("ellis") === 5000 && c.savOn("ellis"));
}
{
  const { c, writes } = world({ pin: true });
  c.savSetRate("2");
  const t = new Date(), tm = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1);
  const key = tm.getFullYear() + "-" + String(tm.getMonth() + 1).padStart(2, "0") + "-" + String(tm.getDate()).padStart(2, "0");
  ok("with the PIN, a new rate is written for TOMORROW, one key", writes.length === 1 && writes[0][1] === "config/savingsCfg/rates/" + key && writes[0][2] === 2, writes);
  ok("…today's rate is still 1%", c.savRateOn(new Date()) === 1);
  c.savSetUnlock("lucy", "1000");
  ok("each kid has their own unlock amount", c.savUnlockAt("lucy") === 1000 && c.savUnlockAt("ellis") === 5000 && writes[1][1] === "config/savingsCfg/unlock/lucy");
  c.savToggleKid("julian");
  ok("Mom can turn savings off for one kid", c.savOn("julian") === false && writes[2][1] === "config/savingsCfg/off/julian" && writes[2][2] === true);
  ok("…and that kid's card shows no savings box", c._savSectionHTML("julian", false) === "");
  ok("the store editor lists the rate and every kid", /savSetRate/.test(c._savEditorHTML()) && c.SL_KIDS.every(k => c._savEditorHTML().indexOf("savSetUnlock('" + k + "'") >= 0));
}
console.log("\n── docks and the store never touch savings ──");
{
  const { c } = world({ claims: claims(5000), bank: { ellis: {
    savings: { a: dep(5000, "2026-10-30T10:00:00-04:00") },
    adjustments: { d: { amount: -100, note: "dock", iso: iso("2026-10-31T09:00:00-04:00"), ts: "t" } } } } });
  ok("a −100 dock comes out of spending (−100), savings keeps 5,000", c.bankBalance("ellis") === -100 && c.savBalance("ellis", new Date(2026, 9, 31, 12)) === 5000, [c.bankBalance("ellis")]);
}
console.log("\n── double taps and too much ──");
{
  const { c, writes, yes } = world({ claims: claims(6000) });
  c.savMoveIn("ellis", 7000);
  ok("saving more than spending is refused", writes.length === 0);
  c.savMoveIn("ellis", 1000); yes();
  c.savMoveIn("ellis", 1000); yes();
  ok("the same move twice inside 30 seconds is written once", writes.length === 1, writes.length);
}
console.log("\n── wiring in index.html ──");
{
  ok("the Star Bank card shows the savings box", /h\+=_savSectionHTML\(kid,momView\)/.test(src));
  ok("Mom's yes/no queue lists savings asks", /savApprove\('"\+k\+"','"\+esc\(r\.id\)\+"'\)","✓ Yes"/.test(src));
  ok("the close-out count includes savings asks", /add\("close","sav_"\+k\+"_"\+r\.id/.test(src));
  ok("savings settings load from config/savingsCfg", /db\.ref\("config\/savingsCfg"\)\.on\("value"/.test(src));
  ok("the PIN-locked store editor carries the savings settings", /h\+=_savEditorHTML\(\)/.test(slice("_storeEditorHTML")));
  ok("no 🔀 in index.html", src.indexOf("\u{1F500}") < 0);
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
