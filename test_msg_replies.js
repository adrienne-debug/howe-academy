/*
 * 💬 Replies from Adrienne (2026-10-04) — a dashboard reply pulls the message out of Sent onto the From Adrienne
 * card until Mom taps ✓ Got it (one leaf: messages/<id>/replySeenAt); then it's back in Sent with the reply under it.
 *   run:  node test_msg_replies.js
 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(process.env.HA_INDEX || path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL- " + n + (x !== undefined ? "  (" + JSON.stringify(x) + ")" : "")); } };
const a = src.indexOf("// ── WORKSHEETS_START"), b = src.indexOf("// ── WORKSHEETS_END");
const block = src.slice(a, b);
const escLine = src.match(/function esc\(s\)\{[^\n]*\n/)[0];
function mkEnv(mom) {
  const els = {}, writes = [], renders = [], pinAsks = [];
  const document = {
    body: { appendChild: el => { els[el.id] = el; } },
    getElementById: id => els[id] || (id === "msg-panel-in" && els["msg-panel"] ? (els["msg-panel-in"] = els["msg-panel-in"] || { innerHTML: "" }) : null),
    createElement: () => { const el = { style: {}, dataset: {}, innerHTML: "", remove() { delete els[el.id]; delete els["msg-panel-in"]; } }; return el; },
  };
  const ref = p => ({ set: v => writes.push(["set", p, v]), update: v => writes.push(["update", p, v]), once: () => new Promise(() => {}),
    push: () => ({ key: "pk" + writes.length, set: v => writes.push(["push.set", p, v]) }) });
  const ctx = { HA_IS_HOWE: false, document, db: { ref }, _dryRun: () => !!mom.dry, kitPinGate: f => pinAsks.push(f), momHere: () => mom.v, renderAll: () => renders.push(1), confirm: () => true, setTimeout: f => f(), console, Date };
  vm.createContext(ctx);
  new vm.Script(escLine + block + "\nthis.msgDataGet=()=>msgData;").runInContext(ctx);
  return { ctx, els, writes, renders, pinAsks };
}
const M = extra => ({ m1: Object.assign({ text: "Edit button hides", photoCount: 0, createdAt: 1000, status: "new" }, extra || {}) });
const R1 = { r1: { text: "Fixed! Reload & <try>", at: 2000 } };

// no reply → in Sent, no card row
{ const E = mkEnv({ v: true }); E.ctx.wsOnValue(null); E.ctx.msgOnValue(M());
  ok("no reply → Sent (1), no reply row", E.ctx.wsTaskHTML().includes("Sent (1)") && !E.ctx.wsTaskHTML().includes("Adrienne replied"));
}
// reply → leaves Sent, row on the card (Mom's Day + Mom HQ)
{ const mom = { v: false }, E = mkEnv(mom); E.ctx.wsOnValue(null); E.ctx.msgOnValue(M());
  const r0 = E.renders.length;
  E.ctx.msgOnValue(M({ replies: R1 }));
  ok("a reply arriving repaints", E.renders.length === r0 + 1);
  const card = E.ctx.wsTaskHTML();
  ok("card shows 'Adrienne replied' with the reply (escaped)", card.includes("Adrienne replied") && card.includes("Reload &amp; &lt;try&gt;") && !card.includes("<try>"));
  ok("message left Sent", !card.includes("Sent ("));
  ok("Mom HQ banner shows it too", E.ctx.wsBannerHTML().includes("Adrienne replied"));
  E.ctx.msgReplyTap("m1"); ok("tap outside Mom mode → PIN first", E.pinAsks.length === 1 && !E.els["msg-panel"]);
  mom.v = true; E.pinAsks[0]();
  const h = E.els["msg-panel-in"].innerHTML;
  ok("panel: her message + the reply + ✓ Got it", h.includes("Edit button hides") && h.includes("Fixed! Reload") && h.includes("✓ Got it"));
  mom.v = false; E.ctx.msgGotIt("m1"); ok("✓ Got it outside Mom mode → nothing written", E.writes.length === 0);
  mom.v = true; E.ctx.msgGotIt("m1");
  ok("✓ Got it writes ONE leaf replySeenAt", E.writes.length === 1 && E.writes[0][0] === "set" && E.writes[0][1] === "messages/m1/replySeenAt" && typeof E.writes[0][2] === "number");
  ok("panel closed, row gone, back in Sent", !E.els["msg-panel"] && !E.ctx.wsTaskHTML().includes("Adrienne replied") && E.ctx.wsTaskHTML().includes("Sent (1)"));
  E.ctx.msgSentOpen(); const s = E.els["msg-panel-in"].innerHTML;
  ok("Sent list shows the reply under her message", s.includes("Edit button hides") && s.includes("💬 Adrienne") && s.includes("Fixed! Reload"));
  // echo from Firebase with replySeenAt → stays in Sent
  E.ctx.msgOnValue(M({ replies: R1, replySeenAt: E.writes[0][2] }));
  ok("seen echo keeps it in Sent", !E.ctx.wsTaskHTML().includes("Adrienne replied"));
  // a newer reply brings it back
  E.ctx.msgOnValue(M({ replies: Object.assign({ r2: { text: "One more thing", at: E.writes[0][2] + 5 } }, R1), replySeenAt: E.writes[0][2] }));
  ok("newer reply → back on the card", E.ctx.wsTaskHTML().includes("One more thing") && !E.ctx.wsTaskHTML().includes("Sent ("));
}
// ✓ Fixed and replies are independent
{ const E = mkEnv({ v: true }); E.ctx.wsOnValue(null); E.ctx.msgOnValue(M({ status: "done", replies: R1 }));
  ok("done + unread reply → still on the card", E.ctx.wsTaskHTML().includes("Adrienne replied"));
}
// dry-run writes nothing
{ const E = mkEnv({ v: true, dry: true }); E.ctx.wsOnValue(null); E.ctx.msgOnValue(M({ replies: R1 }));
  E.ctx.msgGotIt("m1"); ok("dry-run ✓ Got it writes nothing", E.writes.length === 0);
}
// Howe app (no ✉ Send) still shows a reply row if one exists; empty stays empty
{ const E = mkEnv({ v: true }); E.ctx.HA_IS_HOWE = true; E.ctx.wsOnValue(null); E.ctx.msgOnValue(null);
  ok("nothing → no card on Howe", E.ctx.wsTaskHTML() === "");
}
// ↩ Mom writes back (10/4)
{ const mom = { v: true }, E = mkEnv(mom); E.ctx.wsOnValue(null); E.ctx.msgOnValue(M({ replies: R1 }));
  E.ctx.msgReplyTap("m1");
  ok("reply panel has a write-back box + Send + Got it", E.els["msg-panel-in"].innerHTML.includes('id="msg-back"') && E.els["msg-panel-in"].innerHTML.includes("↩ Send to Adrienne") && E.els["msg-panel-in"].innerHTML.includes("✓ Got it"));
  E.els["msg-back"] = { value: "   " }; E.els["msg-back-err"] = { textContent: "" };
  E.ctx.msgWriteBack("m1"); ok("empty write-back refused, nothing written", E.writes.length === 0 && E.els["msg-back-err"].textContent.includes("Write something"));
  mom.v = false; E.els["msg-back"].value = "Thanks"; E.ctx.msgWriteBack("m1"); ok("outside Mom mode → nothing written", E.writes.length === 0);
  mom.v = true; E.els["msg-back"].value = "  Thanks! Which <button>?  ";
  E.ctx.msgWriteBack("m1");
  const pw = E.writes.find(w => w[0] === "push.set"), sw = E.writes.find(w => w[1] === "messages/m1/replySeenAt");
  ok("write-back = one new child under replies with from:mom (trimmed)", pw && pw[1] === "messages/m1/replies" && pw[2].text === "Thanks! Which <button>?" && pw[2].from === "mom" && typeof pw[2].at === "number");
  ok("write-back also counts as Got it", sw && sw[2] === pw[2].at && E.writes.length === 2);
  ok("thank-you shown", E.els["msg-panel-in"].innerHTML.includes("Sent to Adrienne"));
  ok("back in Sent, off the card", !E.ctx.wsTaskHTML().includes("Adrienne replied") && E.ctx.wsTaskHTML().includes("Sent (1)"));
  E.ctx.msgSentOpen(); const s = E.els["msg-panel-in"].innerHTML;
  ok("Sent shows the thread: her reply escaped + ↩ Write back", s.includes("↩ You") && s.includes("Which &lt;button&gt;?") && !s.includes("Which <button>") && s.includes("↩ Write back"));
  // her own reply never counts as unread from Adrienne
  E.ctx.msgOnValue(M({ replies: Object.assign({ x: { text: "mine", at: 99999, from: "mom" } }, R1), replySeenAt: 2500 }));
  ok("Mom's own newer message does not bring it back to the card", !E.ctx.wsTaskHTML().includes("Adrienne replied"));
  E.ctx.msgReplyOpen("m1"); const h = E.els["msg-panel-in"].innerHTML;
  ok("opened from Sent: titled Your message, write-back box, no Got it", h.includes("✉ Your message") && h.includes('id="msg-back"') && !h.includes("✓ Got it"));
  const D = mkEnv({ v: true, dry: true }); D.ctx.msgOnValue(M({ replies: R1 })); D.ctx.msgReplyOpen("m1"); D.els["msg-back"] = { value: "hi" };
  D.ctx.msgWriteBack("m1"); ok("dry-run write-back writes nothing", D.writes.length === 0);
}
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
