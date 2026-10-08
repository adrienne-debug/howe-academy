/*
 * Node tests — ⭐ BANKWHY (her ask 2026-10-08): Mom's Day + / − open a "what for?" pop-up; the reason is
 * optional ("Skip — no reason"). Same write as before: bankGiveDock(kid,sign,amt,note).
 *   run:  node test_bank_why.js
 */
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(name) {
  const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}" && --d === 0) return src.slice(i, k + 1); }
}
const FNS = ["mpBankAskClose", "mpBankAsk", "mpBankAskDone", "esc"].map(slice).join("\n");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
function world(o) {
  o = o || {};
  const log = { gd: [], toasts: [] }; const els = {}; let body = "";
  const doc = {
    getElementById: id => {
      if (id === "mpbank-ask") return body.indexOf('id="mpbank-ask"') >= 0 ? { remove: () => { body = ""; } } : null;
      if (id === "mpbank-why") return body.indexOf('id="mpbank-why"') >= 0 ? { value: o.why || "", focus() {} } : null;
      return els[id] || null;
    },
    body: { insertAdjacentHTML: (w, h) => { body += h; } },
  };
  els["mpbank-ava"] = { value: o.amt == null ? "5" : o.amt };
  const env = { document: doc, momHere: () => o.mom !== false, dadAwardOk: () => !!o.dad, gwShowToast: m => log.toasts.push(m),
    bankGiveDock: (k, s, a, n) => log.gd.push([k, s, a, n]), cap: s => s.charAt(0).toUpperCase() + s.slice(1), SL_KCOL: { ava: "#e11d48" },
    setTimeout: f => f(), String, parseInt, Math };
  const keys = Object.keys(env);
  const api = new Function(...keys, FNS + "\nreturn {mpBankAsk,mpBankAskDone,mpBankAskClose};")(...keys.map(k => env[k]));
  return { api, log, html: () => body };
}
{
  const w = world();
  w.api.mpBankAsk("ava", 1);
  const h = w.html();
  ok("+ opens the pop-up, nothing given yet", /id="mpbank-ask"/.test(h) && w.log.gd.length === 0);
  ok("says who + how many", /Give <span style="color:#e11d48">Ava<\/span> 5 stars/.test(h));
  ok("asks what for, optional, shows on the statement", /What\\'s it for\?|What's it for\?/.test(h) && /Star Bank statement/.test(h));
  ok("two choices: Skip — no reason, and +5 ⭐", /Skip — no reason/.test(h) && />\+5 ⭐</.test(h));
}
{
  const w = world({ why: "  helped Lucy  " }); w.api.mpBankAsk("ava", 1); w.api.mpBankAskDone("ava", 1, 5, true);
  ok("+5 with a reason → bankGiveDock(ava,+1,5,'helped Lucy') and the pop-up closes", JSON.stringify(w.log.gd) === JSON.stringify([["ava", 1, 5, "helped Lucy"]]) && w.html() === "");
}
{
  const w = world({ why: "typed but skipped" }); w.api.mpBankAsk("ava", -1); w.api.mpBankAskDone("ava", -1, 5, false);
  ok("Skip → no note (bankGiveDock's default 'Mom docked stars' applies)", JSON.stringify(w.log.gd) === JSON.stringify([["ava", -1, 5, ""]]));
}
{
  const w = world(); w.api.mpBankAsk("ava", -1);
  ok("− says Take 5 stars from Ava, red button", /Take 5 stars from <span style="color:#e11d48">Ava/.test(w.html()) && /background:#b91c1c;color:#fff">−5 ⭐/.test(w.html()));
  w.api.mpBankAskClose();
  ok("✕ / tap outside = cancel, nothing written", w.log.gd.length === 0 && w.html() === "");
}
{
  const w = world({ amt: "" }); w.api.mpBankAsk("ava", 1);
  ok("empty amount → toast, no pop-up", !w.html() && /amount/.test(w.log.toasts[0] || ""));
  const w2 = world({ mom: false }); w2.api.mpBankAsk("ava", 1);
  ok("locked → toast, no pop-up", !w2.html() && /Unlock/.test(w2.log.toasts[0] || ""));
  const w3 = world({ amt: "1" }); w3.api.mpBankAsk("ava", 1);
  ok("1 star reads 'star' not 'stars'", /Ava<\/span> 1 star</.test(w3.html()));
}
{
  const w = world(); w.api.mpBankAsk("ava", 1); w.api.mpBankAsk("ava", 1);
  ok("tapping twice still shows one pop-up", (w.html().match(/id="mpbank-ask"/g) || []).length === 1);
}
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
