/*
 * 🎹 Keyboard as a shared device (her ask 2026-10-02, DeWalt piano: "only one kid can use at a time").
 * A subject's device can be Keyboard; the family sets how many (Settings ▸ Devices, default 1); the day
 * packer, the write-time guard, the same-day float and the audit all keep kids off one keyboard.
 *   run:  node test_keyboard_lane.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(process.env.HA_INDEX || path.join(__dirname, "index.html"), "utf8");
function extractFn(name) {
  const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("not found: " + name);
  let d = 0, s = false;
  for (let k = src.indexOf("{", i); k < src.length; k++) { const c = src[k]; if (c === "{") { d++; s = true; } else if (c === "}") { d--; if (s && !d) return src.slice(i, k + 1); } }
  throw new Error("unbalanced " + name);
}
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } };

// 1. the day packer: keyboard is a default contended lane, cap 1 unless the family says more
const packDay = new Function(extractFn("packDay") + "; return packDay;")();
const kb = (id, who) => ({ id, who, lane: "keyboard", durMin: 20 });
const run = (items, ctx) => { const p = packDay(items, Object.assign({ start: 540, end: 900, lunchStart: 0, lunchEnd: 0 }, ctx)); const m = {}; p.placed.forEach(x => { m[x.id] = x.start; }); return m; };
{ const m = run([kb("a", "andrew"), kb("k", "makenzie"), kb("t", "taylor")]);
  ok("one keyboard (default lanes): three kids' piano never overlap — 9:00, 9:20, 9:40", [m.a, m.k, m.t].sort((x, y) => x - y).join() === "540,560,580", m); }
{ const m = run([kb("a", "andrew"), kb("k", "makenzie")], { laneCap: { keyboard: 2 } });
  ok("two keyboards: two kids practise at once", m.a === 540 && m.k === 540, m); }
{ const m = run([kb("a", "andrew"), { id: "p", who: "makenzie", durMin: 20 }]);
  ok("a paper card next to piano is not held up", m.a === 540 && m.p === 540, m); }

// 2. how many: default 1, the family's number, never below 1
{ const ctx = { rulesData: null }; vm.createContext(ctx); vm.runInContext(extractFn("gwDeviceCaps") + ";this.f=gwDeviceCaps;", ctx);
  ok("no setting → 1 keyboard", ctx.f().keyboard === 1);
  ctx.rulesData = { devices: { keyboard: "2" } }; ok("Settings ▸ Devices = 2 → 2", ctx.f().keyboard === 2);
  ctx.rulesData = { devices: { keyboard: 0 } }; ok("never below 1", ctx.f().keyboard === 1);
  ok("computers/screens unchanged", ctx.f().computer === 1 && ctx.f().screen === 2); }

// 3. the write-time guard's lane helpers see the keyboard, with the family's count
{ const ctx = { taskDevice: () => "paper", gwDeviceCaps: () => ({ computer: 1, screen: 2, keyboard: 3 }) }; vm.createContext(ctx);
  vm.runInContext(extractFn("_efLane") + extractFn("_efLaneCap") + ";this.L=_efLane;this.C=_efLaneCap;", ctx);
  ok("_efLane: a keyboard card is on the keyboard lane", ctx.L({ device: "keyboard", who: "andrew" }) === "keyboard");
  ok("_efLaneCap reads the keyboard count", ctx.C("keyboard") === 3);
  ok("guard ctx passes keyboard through as a lane", /return \(l==="computer"\|\|l==="screen"\|\|l==="ipadLucy"\|\|l==="keyboard"\)\?l:null;/.test(src)); }

// 4. the choices + wiring
ok("Add Subject offers 🎹 Keyboard", /\["paper","computer","ipad\/phone","book","keyboard"\]\.forEach\(d=>\{/.test(src));
ok("Rules table device pill cycles through Keyboard", src.includes('_cyc(sk,"device",["paper","computer","ipad/phone","book","keyboard"],dev,false)'));
ok("label + emoji", src.includes('book:"Book",keyboard:"Keyboard"};') && src.includes('book:"\\u{1F4D6}",keyboard:"\\u{1F3B9}"};'));
ok("Settings ▸ Devices has a Keyboards row", src.includes("rulesUpdateDevice(\\'keyboard\\',this.value)"));
ok("generator passes keyboard as a lane with the family caps", src.includes('lanes:["computer","screen","ipadLucy","keyboard"],laneCap:gwDeviceCaps()'));
ok("same-day float knows the keyboard lane", src.includes('if(dv==="keyboard") return "keyboard"; return '));
ok("audit flags two kids on one keyboard", src.includes('keyboard task(s) at once'));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
