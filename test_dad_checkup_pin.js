/*
 * Node tests — 🔒 DADPIN: Dad's code opens the check-up door too (her ask 2026-10-13: "dad could do these different study
 * sessions that need pin — let's make his pin work for these as well"). Only a door opened with {dad:true} takes it;
 * every other kitPinGate door stays Mom-only. Runs the real kitPinGate / kitPinClose / kitPinCheck with stubs.
 *   run:  node test_dad_checkup_pin.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
function slice(name) { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("missing " + name);
  let d = 0; for (let k = src.indexOf("{", i); k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (!d) return src.slice(i, k + 1); } } }
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  " + JSON.stringify(x) : "")); } };
function world() {
  const els = {}, calls = [];
  const document = { body: { appendChild: e => { els[e.id] = e; } }, getElementById: id => els[id] || null, createElement: () => ({ id: "", style: {}, innerHTML: "", textContent: "", value: "" }) };
  const ctx = { console, String, Object, document, setTimeout: () => {}, esc: s => String(s), calls,
    momHere: () => false, pinOk: v => v === "1111", dadPinOk: v => v === "0726", haMomOn: () => { calls.push("momOn"); } };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext([slice("kitPinGate"), slice("kitPinClose"), slice("kitPinCheck")].join("\n"), ctx);
  return { ctx, els, calls };
}
console.log("── a door opened with {dad:true} (the check-up) ──");
{ const w = world(), c = w.ctx; let ran = 0;
  c.kitPinGate(() => { ran++; }, "run the check-up", { dad: true });
  ok("the box says Mom or Dad PIN", /Mom or Dad PIN/.test(w.els["kit-pin-wrap"].innerHTML));
  c.kitPinCheck("0726");
  ok("Dad's code opens it, Mom mode on for the sitting, the door runs", ran === 1 && w.calls.includes("momOn"));
  ok("…and the box is closed with the dad flag cleared", w.els["kit-pin-wrap"].innerHTML === "" && c._kitPinDad === false);
  c.kitPinGate(() => { ran++; }, "x", { dad: true }); c.kitPinCheck("1111");
  ok("Mom's code still opens the same door", ran === 2);
  c.kitPinGate(() => { ran++; }, "x", { dad: true }); c.kitPinCheck("9999");
  ok("a wrong code does nothing", ran === 2 && w.els["kit-pin-wrap"].innerHTML !== "");
}
console.log("\n── every other door stays Mom-only ──");
{ const w = world(), c = w.ctx; let ran = 0;
  c.kitPinGate(() => { ran++; }, "Laundry times are for Mom.");
  ok("the box says Mom PIN", /Mom PIN/.test(w.els["kit-pin-wrap"].innerHTML) && !/Mom or Dad/.test(w.els["kit-pin-wrap"].innerHTML));
  c.kitPinCheck("0726");
  ok("Dad's code is refused on a Mom-only door", ran === 0);
  c.kitPinCheck("1111");
  ok("Mom's code opens it", ran === 1);
}
console.log("\n── wiring ──");
ok("the check-up's start button opens the door with {dad:true}", /kitPinGate\(go,"Mom or Dad types their code to run the check-up on this screen\."\+\(spell\?" "\+CK_SPELL_HOWTO:""\),\{dad:true\}\)/.test(src));
ok("the kid's screen says Mom or Dad", /🔒 Mom or Dad: start the check-up/.test(src) && /Ask Mom or Dad when they’re ready\./.test(src));
ok("the check-up still relocks after the sitting (ckRelock → haMomOff)", /function ckRelock\(\)\{ if\(!ckKidUnlock\) return; ckKidUnlock=false; if\(typeof haMomOff==="function"\) haMomOff\(\);/.test(src));
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
