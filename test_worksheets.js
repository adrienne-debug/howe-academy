/*
 * 📋 Worksheets from Adrienne — popup, saving, submit, Mom-only, inert when empty.
 *   run:  node test_worksheets.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(process.env.HA_INDEX || path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } };
const a = src.indexOf("// ── WORKSHEETS_START"), b = src.indexOf("// ── WORKSHEETS_END");
ok("block present", a > 0 && b > a);
const block = src.slice(a, b);
const escLine = src.match(/function esc\(s\)\{[^\n]*\n/)[0];

// ── tiny fake DOM + db ────────────────────────────────────────────────────
function mkEnv(mom) {
  const els = {}, writes = [], renders = [];
  const body = { appendChild: el => { els[el.id] = el; } };
  const document = {
    body,
    getElementById: id => {
      if (els[id]) return els[id];
      if (id === "ws-panel-in" && els["ws-panel"]) return (els["ws-panel-in"] = { innerHTML: "" });
      return null;
    },
    createElement: () => { const el = { style: {}, dataset: {}, innerHTML: "", remove() { delete els[el.id]; delete els["ws-panel-in"]; } }; return el; },
  };
  const ref = p => ({ set: v => writes.push(["set", p, v]), update: v => writes.push(["update", p, v]) });
  const ctx = { document, db: { ref }, _dryRun: () => false, momHere: () => mom.v, renderAll: () => renders.push(1), confirm: () => mom.confirm !== false, setTimeout: f => f(), console };
  vm.createContext(ctx);
  new vm.Script(escLine + block + "\nthis.wsDataGet=()=>wsData;").runInContext(ctx);
  return { ctx, els, writes, renders };
}
const WS = () => ({
  andrew_setup: { title: "Andrew setup", intro: "A few questions", createdAt: 1, status: "open",
    questions: [{ q: "Co-op Thursdays?", options: ["Both", "Off"] }, { q: "Piano?", options: ["10", "20"] }] },
  old_done: { title: "Old", createdAt: 0, status: "submitted", questions: [{ q: "x", options: ["y"] }] },
});

// 1. inert when there is nothing
{ const mom = { v: true }, E = mkEnv(mom);
  E.ctx.wsOnValue(null);
  ok("no worksheets → no card", E.ctx.wsBannerHTML() === "");
  E.ctx.wsMaybePop(); ok("no worksheets → no popup", !E.els["ws-panel"]);
  ok("no worksheets → no repaint", E.renders.length === 0);
}
// 2. Mom-only
{ const mom = { v: false }, E = mkEnv(mom);
  E.ctx.wsOnValue(WS());
  ok("kid view → no card", E.ctx.wsBannerHTML() === "");
  E.ctx.wsMaybePop(); ok("kid view → no popup", !E.els["ws-panel"]);
  E.ctx.wsOpen("andrew_setup"); ok("kid view → wsOpen refuses", !E.els["ws-panel"]);
}
// 3. card + popup once
{ const mom = { v: true }, E = mkEnv(mom);
  E.ctx.wsOnValue(WS());
  const card = E.ctx.wsBannerHTML();
  ok("Mom sees a card for the OPEN worksheet only", card.includes("Andrew setup") && !card.includes(">Old<"));
  ok("card counts questions", card.includes("2 questions"));
  ok("open set changed → one repaint", E.renders.length === 1);
  E.ctx.wsOnValue(WS()); ok("same open set → no extra repaint", E.renders.length === 1);
  E.ctx.wsMaybePop(); ok("first Mom HQ visit pops it", !!E.els["ws-panel"] && E.els["ws-panel"].dataset.ws === "andrew_setup");
  const html = E.els["ws-panel-in"].innerHTML;
  ok("popup shows title, intro, questions, options", ["Andrew setup", "A few questions", "Co-op Thursdays?", "Piano?", ">Off<", ">20<"].every(s => html.includes(s)), html.slice(0, 200));
  ok("popup has notes boxes", (html.match(/<textarea/g) || []).length === 2);
  E.ctx.wsClose(); E.ctx.wsMaybePop(); ok("popped once per session (closing doesn't re-pop)", !E.els["ws-panel"]);
}
// 4. picks + notes save as single leaves
{ const mom = { v: true }, E = mkEnv(mom);
  E.ctx.wsOnValue(WS()); E.ctx.wsOpen("andrew_setup");
  E.ctx.wsPick("andrew_setup", 0, 1);
  ok("pick writes ONE leaf with the option text", JSON.stringify(E.writes.at(-1)) === JSON.stringify(["set", "worksheets/andrew_setup/answers/0/pick", "Off"]), E.writes);
  ok("pick re-renders as chosen", E.els["ws-panel-in"].innerHTML.includes("#dcfce7"));
  E.ctx.wsNote("andrew_setup", 1, "she prefers mornings");
  ok("note writes ONE leaf", JSON.stringify(E.writes.at(-1)) === JSON.stringify(["set", "worksheets/andrew_setup/answers/1/note", "she prefers mornings"]));
  ok("card shows progress", E.ctx.wsBannerHTML().includes("1 answered"));
  E.ctx.wsPick("andrew_setup", 0, 9); ok("bad option index → no write", E.writes.length === 2);
  ok("no whole-node writes anywhere", E.writes.every(w => w[1].split("/").length >= 4 || w[0] === "update"));
}
// 5. submit
{ const mom = { v: true, confirm: false }, E = mkEnv(mom);
  E.ctx.wsOnValue(WS()); E.ctx.wsOpen("andrew_setup"); E.ctx.wsPick("andrew_setup", 0, 0);
  E.ctx.wsSubmit("andrew_setup");
  ok("unanswered + Mom cancels → nothing sent", !E.writes.some(w => w[0] === "update"));
  mom.confirm = true; E.ctx.wsSubmit("andrew_setup");
  const u = E.writes.find(w => w[0] === "update");
  ok("submit = targeted update of status + submittedAt", u && u[1] === "worksheets/andrew_setup" && u[2].status === "submitted" && typeof u[2].submittedAt === "number" && Object.keys(u[2]).length === 2, u);
  ok("thank-you screen shown", E.els["ws-panel-in"].innerHTML.includes("Sent to Adrienne"));
  ok("submitted worksheet leaves the card", E.ctx.wsBannerHTML() === "");
}
// 6. hostile text is escaped
{ const mom = { v: true }, E = mkEnv(mom);
  E.ctx.wsOnValue({ x: { title: "<img src=x onerror=alert(1)>", status: "open", createdAt: 1, questions: [{ q: "<b>q</b>", options: ["<script>"] }] } });
  E.ctx.wsOpen("x"); const h = E.els["ws-panel-in"].innerHTML;
  ok("title/question/option text escaped", !h.includes("<img") && !h.includes("<script>") && !h.includes("<b>q"));
}
// 7. wiring in the real file
ok("listener wired beside config/rules", /db\.ref\("worksheets"\)\.on\("value",s=>\{ wsOnValue\(s\.val\(\)\); \}\);[^\n]*\n\s*db\.ref\("config\/rules"\)/.test(src));
ok("card + popup wired into Mom HQ", /function renderMomHQ\(el,ah\)\{[\s\S]{0,400}h\+=wsBannerHTML\(\); setTimeout\(wsMaybePop,0\);/.test(src));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
