/*
 * Node tests for Stage 4 slice 3: skiplog is legacy-only. Plan-backed subjects never
 * read it (grid strike-through, gvReconcile) and the one-time 🧹 clear (with Undo)
 * removes their inert leftovers. Runs the real LID block + gvReconcile.
 *
 *   run:  node test_skiplog_planbacked.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

const la = src.indexOf("// LID_START"), lb = src.indexOf("// LID_END");
if (la < 0 || lb < 0) { console.error("LID block markers not found"); process.exit(1); }
const block = src.slice(la, lb);
function braceSlice(name) {
  const sig = "function " + name + "("; const i = src.indexOf(sig); if (i < 0) throw new Error("fn not found: " + name);
  let d = 0, j = src.indexOf("{", i);
  for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); } }
  throw new Error("unbalanced: " + name);
}
const fns = [braceSlice("gvReconcile"), 'const _gaNorm=s=>String(s==null?"":s).replace(/[–—−]/g,"-").replace(/\\s+/g," ").trim().toLowerCase();'].join("\n");

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  - " + name); }
  else { fail++; console.log("  FAIL- " + name + (extra !== undefined ? "  (" + JSON.stringify(extra) + ")" : "")); }
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function mkEnv() {
  const env = {
    currData: {
      subjects: { lincoln: {
        ws: { display: "Wordsmith", planId: "lincoln__ws", doneImportedAt: 1, lessonSeq: ["a", "b", "c", "d"], lessonIds: ["L0001", "L0002", "L0003", "L0004"] }, // plan-backed
        aas: { display: "AAS", lessonSeq: ["x", "y", "z"] },                                                                                                    // legacy
      } },
      lessons: { lincoln: {
        1: { date: "2026-08-10", ws: "a", aas: "x" },
        2: { date: "2026-08-20", ws: "c", aas: "z" },
        3: { date: "2026-08-21", ws: "d" },
      } },
      done: { lincoln: { ws: { L0001: { src: "check" } } } },
      skiplog: { lincoln: { ws: [{ lesson: "b", dayNum: 1, date: "2026-08-10" }], aas: [{ lesson: "y", dayNum: 1 }] } },
    },
    lidsFor: (kid, sk) => (env.currData.subjects[kid][sk] || {}).lessonIds || null,
    momModeActive: true, adminPinUnlocked: false, cbMsg: "", toast: null, confirmText: null,
    cbTodayISO: () => "2026-08-17", cap: x => x, renderAll: () => {}, gwShowToast: t => { env.toast = t; },
    gvFilled: v => !!(v && v !== "—" && String(v).trim()),
    updates: [],
    confirm: t => { env.confirmText = t; return env.confirmAnswer !== false; },
    Date, Math, Object, JSON, String, Number, Array, parseInt, console,
  };
  env.db = { ref: p => ({ update: u => { env.updates.push({ p, u: JSON.parse(JSON.stringify(u)) }); return { catch: () => {} }; } }) };
  env.window = env;
  vm.createContext(env);
  new vm.Script(block + "\n" + fns).runInContext(env);
  return env;
}

console.log("skiplogLeftovers — plan-backed subjects only");
{
  const e = mkEnv();
  const l = e.skiplogLeftovers("lincoln");
  ok("only the plan-backed subject's entries are leftovers", l.length === 1 && l[0].sk === "ws" && l[0].n === 1 && eq(l[0].texts, ["b"]), l);
  ok("unknown kid → []", eq(e.skiplogLeftovers("nobody"), []));
  delete e.currData.subjects.lincoln.ws.planId;
  ok("plan flag removed → no leftovers reported", e.skiplogLeftovers("lincoln").length === 0);
}

console.log("gvClearSkiplog / Undo");
{
  const e = mkEnv();
  e.gvClearSkiplog("lincoln");
  const u = e.updates[0] && e.updates[0].u;
  ok("confirm previews subject + lesson text", /Wordsmith: 1 — b/.test(e.confirmText || ""), e.confirmText);
  ok("one curriculum update: skiplog/lincoln/ws=null + lastEdit, nothing else", u && u["skiplog/lincoln/ws"] === null && "lastEdit" in u && Object.keys(u).length === 2, u);
  ok("legacy AAS skiplog untouched", e.currData.skiplog.lincoln.aas && e.currData.skiplog.lincoln.aas.length === 1);
  ok("in-memory cleared", !e.currData.skiplog.lincoln.ws);
  const und = vm.runInContext("_skiplogClearUndo", e);
  ok("undo state set", und && und.n === 1 && und.subjects === 1, und);
  e.gvClearSkiplogUndo();
  const u2 = e.updates[1] && e.updates[1].u;
  ok("undo restores the exact entries", u2 && eq(u2["skiplog/lincoln/ws"], [{ lesson: "b", dayNum: 1, date: "2026-08-10" }]) && eq(e.currData.skiplog.lincoln.ws, [{ lesson: "b", dayNum: 1, date: "2026-08-10" }]), u2);
  ok("undo state cleared", vm.runInContext("_skiplogClearUndo", e) === null);
  // cancel writes nothing
  const e2 = mkEnv(); e2.confirmAnswer = false; e2.gvClearSkiplog("lincoln");
  ok("cancel → no write, entries kept", e2.updates.length === 0 && e2.currData.skiplog.lincoln.ws.length === 1);
  // not mom → nothing
  const e3 = mkEnv(); e3.momModeActive = false; e3.gvClearSkiplog("lincoln");
  ok("kid mode → no-op", e3.updates.length === 0);
  // nothing to clear → no confirm
  const e4 = mkEnv(); delete e4.currData.skiplog.lincoln.ws; e4.gvClearSkiplog("lincoln");
  ok("no leftovers → no confirm, no write", e4.confirmText === null && e4.updates.length === 0);
}

console.log("gvReconcile — skiplog ignored for plan-backed, honoured for legacy");
{
  const e = mkEnv();
  // ws (plan-backed): list a,b,c,d; done a; future cells c,d → b is only-in-list (skiplog must NOT hide it)
  // aas (legacy): list x,y,z; grid x,z; y dismissed → no drift
  const r = e.gvReconcile("lincoln");
  const ws = r.find(x => x.sk === "ws"), aas = r.find(x => x.sk === "aas");
  ok("plan-backed: dismissed 'b' still counts as missing from the grid", ws && eq(ws.onlyInList, ["b"]) && ws.onlyInGrid.length === 0, ws);
  ok("legacy: dismissed 'y' is excluded → no drift row", !aas, aas);
}

console.log("grid render — no strike-through for plan-backed (source assertion)");
{
  const g = src.indexOf("const slk=((currData.skiplog||{})[gvKid])||{};");
  const seg = src.slice(g, g + 600);
  ok("_skipAt loop skips plan-backed subjects", /planBacked\(gvKid,sk\)\) continue;/.test(seg), seg);
  ok("🧹 banner wired to gvClearSkiplog + Undo", src.indexOf("gvClearSkiplog(\\''+gvKid+'\\')") >= 0 && src.indexOf("gvClearSkiplogUndo()") >= 0);
  ok("cbApply skiplog write still gated off for plan-backed", /if\(skAdd\.length&&!_pbApply\)\{/.test(src));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
