/*
 * 📋 Worksheets from Adrienne — Mom's Day task, tap to open (never pops by itself), saving, submit → ✓, Mom-only answering, inert when empty.
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
  const els = {}, writes = [], renders = [], pinAsks = [];
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
  const ctx = { HA_IS_HOWE: mom.howe !== false, document, db: { ref }, _dryRun: () => false, kitPinGate: f => { pinAsks.push(f); },  momHere: () => mom.v, renderAll: () => renders.push(1), confirm: () => mom.confirm !== false, setTimeout: f => f(), console };
  vm.createContext(ctx);
  new vm.Script(escLine + block + "\nthis.wsDataGet=()=>wsData;this.msgDraftGet=()=>msgDraft;").runInContext(ctx);
  return { ctx, els, writes, renders, pinAsks };
}
const WS = () => ({
  andrew_setup: { title: "Andrew setup", intro: "A few questions", createdAt: 1, status: "open",
    questions: [{ q: "Co-op Thursdays?", options: ["Both", "Off"] }, { q: "Piano?", options: ["10", "20"] }] },
  old_done: { title: "Old", createdAt: 0, status: "submitted", questions: [{ q: "x", options: ["y"] }] },
});

// 1. inert when there is nothing
{ const mom = { v: true }, E = mkEnv(mom);
  E.ctx.wsOnValue(null);
  ok("no worksheets → no card", E.ctx.wsBannerHTML() === "" && E.ctx.wsTaskHTML() === "");
  ok("no worksheets → no repaint", E.renders.length === 0);
}
// 2. Mom-only
{ const mom = { v: false }, E = mkEnv(mom);
  E.ctx.wsOnValue(WS());
  ok("Mom's Day shows the task even before the PIN", E.ctx.wsTaskHTML().includes("Andrew setup"));
  E.ctx.wsOpen("andrew_setup"); ok("outside Mom mode → wsOpen refuses", !E.els["ws-panel"]);
  E.ctx.wsTap("andrew_setup"); ok("tap outside Mom mode → asks for the PIN, opens nothing", E.pinAsks.length === 1 && !E.els["ws-panel"]);
  mom.v = true; E.pinAsks[0](); ok("right PIN → the worksheet opens", !!E.els["ws-panel"]);
}
// 3. card + popup once
{ const mom = { v: true }, E = mkEnv(mom);
  E.ctx.wsOnValue(WS());
  const card = E.ctx.wsBannerHTML();
  ok("open worksheet = a tap-to-answer task", card.includes("Andrew setup") && card.includes("tap to answer"));
  ok("long-ago sent worksheet is not listed", !card.includes(">Old<"));
  ok("Mom's Day task card titled From Adrienne", E.ctx.wsTaskHTML().includes("From Adrienne"));
  ok("nothing pops up by itself", !E.els["ws-panel"] && typeof E.ctx.wsMaybePop === "undefined");
  ok("card counts questions", card.includes("2 questions"));
  ok("open set changed → one repaint", E.renders.length === 1);
  E.ctx.wsOnValue(WS()); ok("same open set → no extra repaint", E.renders.length === 1);
  E.ctx.wsTap("andrew_setup"); ok("Mom's tap opens it", !!E.els["ws-panel"] && E.els["ws-panel"].dataset.ws === "andrew_setup" && E.pinAsks.length === 0);
  const html = E.els["ws-panel-in"].innerHTML;
  ok("popup shows title, intro, questions, options", ["Andrew setup", "A few questions", "Co-op Thursdays?", "Piano?", ">Off<", ">20<"].every(s => html.includes(s)), html.slice(0, 200));
  ok("popup has notes boxes", (html.match(/<textarea/g) || []).length === 2);
  E.ctx.wsClose(); ok("close shuts it", !E.els["ws-panel"]);
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
  const after = E.ctx.wsTaskHTML();
  ok("sent worksheet leaves the card — no ✓ row", !after.includes("Andrew setup") && !after.includes("tap to answer") && !after.includes("wsTap("));
  ok("…and is counted under Sent (n), old ones included", after.includes("Sent (2)"));
}
// 6. hostile text is escaped
{ const mom = { v: true }, E = mkEnv(mom);
  E.ctx.wsOnValue({ x: { title: "<img src=x onerror=alert(1)>", status: "open", createdAt: 1, questions: [{ q: "<b>q</b>", options: ["<script>"] }] } });
  E.ctx.wsOpen("x"); const h = E.els["ws-panel-in"].innerHTML;
  ok("title/question/option text escaped", !h.includes("<img") && !h.includes("<script>") && !h.includes("<b>q"));
}
// 6b. folded plan info + per-question hints (v3)
{ const mom = { v: true }, E = mkEnv(mom);
  const W = WS(); W.andrew_setup.info = ["Starts Monday: Lesson 35", "Finish: May 21"]; W.andrew_setup.infoTitle = "Andrew's plan at a glance";
  W.andrew_setup.questions[1].hint = "Your times sheet said 30";
  E.ctx.wsOnValue(W); E.ctx.wsOpen("andrew_setup"); const h = E.els["ws-panel-in"].innerHTML;
  ok("plan info is a folded <details>, closed by default", /<details style=[^>]*>/.test(h) && !/<details[^>]*open/.test(h) && h.includes("Andrew&#39;s plan at a glance") || h.includes("Andrew's plan at a glance"));
  ok("each info line listed", h.includes("Starts Monday: Lesson 35") && h.includes("Finish: May 21"));
  ok("hint shown under its question only", h.includes("Your times sheet said 30") && (h.match(/#64748b;line-height:1.4;margin-bottom:8px/g) || []).length === 1);
  const E2 = mkEnv(mom); E2.ctx.wsOnValue(WS()); E2.ctx.wsOpen("andrew_setup");
  ok("no info / no hints → nothing extra drawn", !E2.els["ws-panel-in"].innerHTML.includes("<details"));
}
// 8. ✉ Send to Adrienne (10/3)
{ const mom = { v: true, howe: false }, E = mkEnv(mom);
  E.ctx.wsOnValue(null); E.ctx.msgOnValue(null);
  const card = E.ctx.wsTaskHTML();
  ok("family app: card always there with ✉ Send", card.includes("From Adrienne") && card.includes("✉ Send to Adrienne"));
  ok("nothing sent → no Sent link", !card.includes("Sent ("));
  const H = mkEnv({ v: true }); H.ctx.wsOnValue(null); H.ctx.msgOnValue(null);
  ok("Howe app: no ✉ Send, no card", H.ctx.wsTaskHTML() === "" && H.ctx.wsBannerHTML() === "");
  ok("Mom HQ banner carries the button too", E.ctx.wsBannerHTML().includes("✉ Send to Adrienne"));
}
{ const mom = { v: false, howe: false }, E = mkEnv(mom);
  E.ctx.msgGate(E.ctx.msgCompose);
  ok("outside Mom mode → PIN first, no pop-up", E.pinAsks.length === 1 && !E.els["msg-panel"]);
  mom.v = true; E.pinAsks[0](); ok("right PIN → compose opens", !!E.els["msg-panel"]);
}
(async () => {
  const mom = { v: true, howe: false }, E = mkEnv(mom);
  E.ctx.document.getElementById = (orig => id => { if (id === "msg-panel-in" && E.els["msg-panel"]) return E.els["msg-panel-in"] || (E.els["msg-panel-in"] = { innerHTML: "" }); if (id === "msg-text") return null; return orig(id); })(E.ctx.document.getElementById);
  E.ctx.kitCapShrink = async (f, max, q) => "data:image/jpeg;base64,AAAA" + f.n;
  E.ctx.msgCompose();
  await E.ctx.msgSend();
  ok("empty send refused, nothing written", E.writes.length === 0 && E.els["msg-panel-in"].innerHTML.includes("Write a note or add a photo first"));
  const files = Array.from({ length: 8 }, (_, i) => ({ n: i }));
  await E.ctx.msgAddPhotos({ files, value: "x" });
  ok("photos capped at 6, Mom told why", E.ctx.msgDraftGet().photos.length === 6 && E.els["msg-panel-in"].innerHTML.includes("Only 6 photos fit"));
  E.ctx.msgDropPhoto(0); ok("✕ removes one", E.ctx.msgDraftGet().photos.length === 5);
  E.ctx.msgDraftGet().text = "The edit button hides <b>below</b>";
  await E.ctx.msgSend();
  const w = E.writes;
  ok("photos written first, one node", w[0] && w[0][0] === "set" && /^messagePhotos\/m\w+$/.test(w[0][1]) && w[0][2].length === 5);
  ok("then the small message record", w[1] && w[1][1] === w[0][1].replace("messagePhotos/", "messages/") && w[1][2].text === "The edit button hides <b>below</b>" && w[1][2].photoCount === 5 && w[1][2].status === "new");
  ok("thank-you shown, draft cleared", E.els["msg-panel-in"].innerHTML.includes("Sent to Adrienne") && E.ctx.msgDraftGet().photos.length === 0 && E.ctx.msgDraftGet().text === "");
  // dry-run: nothing written
  const D = mkEnv({ v: true, howe: false }); D.ctx._dryRun = () => true;
  D.ctx.msgDraftGet().text = "hi"; await D.ctx.msgSend();
  ok("dry-run sends nothing", D.writes.length === 0);
  // sent list
  const id = w[1][1].split("/")[1];
  const S = mkEnv({ v: true, howe: false });
  S.ctx.wsOnValue(WS()); S.ctx.msgOnValue({ [id]: Object.assign({}, w[1][2]) });
  ok("Sent (n) counts messages + answered worksheets", S.ctx.wsTaskHTML().includes("Sent (2)"));
  S.ctx.document.getElementById = id2 => S.els[id2] || (id2 === "msg-panel-in" && S.els["msg-panel"] ? (S.els["msg-panel-in"] = S.els["msg-panel-in"] || { innerHTML: "" }) : null);
  S.ctx.db.ref = p => ({ once: () => new Promise(() => {}) });
  S.ctx.msgSentOpen(); const list = S.els["msg-panel-in"].innerHTML;
  ok("Sent pop-up lists the message (escaped) and the worksheet", list.includes("&lt;b&gt;below") && !list.includes("<b>below") && list.includes("Old") && list.includes("Loading 5 photos"));
  const before = S.renders.length;
  S.ctx.msgOnValue({ [id]: Object.assign({}, w[1][2], { status: "done" }) });
  ok("✓ Done on the dashboard → repaint + Fixed tag", S.renders.length === before + 1 && (S.ctx.msgSentOpen(), S.els["msg-panel-in"].innerHTML.includes("✓ Fixed")));
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
// 7. wiring in the real file
ok("listener wired beside config/rules", /db\.ref\("worksheets"\)\.on\("value",s=>\{ wsOnValue\(s\.val\(\)\); \}\);[^\n]*\n\s*db\.ref\("messages"\)\.on\("value",s=>\{ msgOnValue\(s\.val\(\)\); \}\);[^\n]*\n\s*db\.ref\("config\/rules"\)/.test(src));
ok("card wired into Mom HQ, no auto-pop", /function renderMomHQ\(el,ah\)\{[\s\S]{0,400}h\+=wsBannerHTML\(\);/.test(src) && !/wsMaybePop/.test(src));
ok("task wired into Mom's Day under her own day", /h\+=momDayStripHTML\(iso,today\); \}catch\(e\)\{\}\n  try\{ h\+=wsTaskHTML\(\); \}catch\(e\)\{\}/.test(src));

