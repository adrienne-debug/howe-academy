// DEFEDIT — her ask 2026-10-24: edit meanings of waiting roots (and "/" names) in the 📖 Flip Definitions box.
const fs = require("fs"), vm = require("vm");
const src = fs.readFileSync(__dirname + "/index.html", "utf8");
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log("  ok  - " + n); } else { fail++; console.log("  FAIL - " + n); } };
const fn = name => { const a = src.indexOf("function " + name + "("); let d = 0, i = src.indexOf("{", a);
  for (; i < src.length; i++) { if (src[i] === "{") d++; else if (src[i] === "}" && --d === 0) break; } return src.slice(a, i + 1); };
const blk = (a, b) => src.slice(src.indexOf(a), src.indexOf(b));

const code = [fn("mastGetDef"), fn("mastDefKeyOk"), blk("// DEFEDIT_START", "// DEFEDIT_END"), fn("mastSaveDef"), fn("mastCustomDef")].join("\n");
function setup() {
  const writes = [];
  const ctx = { masteryKid: "ellis", MAST_MATH_ANS: {}, MAST_VOCAB_DEFS: { "flex/flect": "bend", geo: "earth" },
    WR_DECK: "Greek & Latin Roots", _wrLessonName: ch => ch >= 100 ? "Level " + Math.floor(ch / 100) + " Lesson " + (ch % 100) : "Lesson " + ch,
    masteryData: { ellis_settings: { definitions: { geo: "earth", "in-": "not" } },
      ellis_custom_items: { 3: { cat: "Greek & Latin Roots", name: "in-", ch: 2 }, 7: { cat: "Greek & Latin Roots", name: "ir-", def: "not" },
        9: { cat: "Greek & Latin Roots", name: "il-", ch: 101 }, 11: { cat: "Greek & Latin Roots", name: "bio" } } },
    db: { ref: p => ({ update: v => writes.push([p, "update", v]), set: v => writes.push([p, "set", v]) }) },
    _dryRun: () => false, HA_LS: { setItem() {} }, alert: m => writes.push(["ALERT", m]) };
  vm.createContext(ctx); vm.runInContext(code, ctx); return { ctx, writes };
}

let { ctx, writes } = setup();
ok("plain names keep their plain key", ctx.mastDefKey("in-") === "in-" && ctx.mastDefKey("geo") === "geo");
ok("a / name gets a Firebase-safe coded key", ctx.mastDefKey("flex/flect") === "flex%2Fflect" && ctx.mastDefKeyOk(ctx.mastDefKey("flex/flect")));
ok("periods coded too", ctx.mastDefKey("0.5") === "0%2E5");

// fix in- (a waiting root with no entry copy) → only that one key
ctx.mastSaveWaitingDef("Greek & Latin Roots", "in-", "not; also in, into");
ok("in-: writes only definitions/in-", writes.length === 1 && writes[0][0] === "mastery/ellis_settings/definitions" && JSON.stringify(writes[0][2]) === JSON.stringify({ "in-": "not; also in, into" }));
ok("in- now reads the new meaning", ctx.mastGetDef("ellis", "in-") === "not; also in, into");

// a / name: was refused before, now saved under the coded key and read back everywhere
writes.length = 0;
ok("flex/flect shows the built-in meaning before any edit", ctx.mastGetDef("ellis", "flex/flect") === "bend");
ctx.mastSaveWaitingDef("Greek & Latin Roots", "flex/flect", "bend, bow");
ok("no 'can't be a definition key' alert any more", !writes.some(w => w[0] === "ALERT"));
ok("saved under definitions/flex%2Fflect", writes.length === 1 && JSON.stringify(writes[0][2]) === JSON.stringify({ "flex%2Fflect": "bend, bow" }));
ok("mastGetDef returns the edited meaning for flex/flect", ctx.mastGetDef("ellis", "flex/flect") === "bend, bow");

// an entry carrying its own copy (ir-): both updated, targeted
writes.length = 0;
ctx.mastSaveWaitingDef("Greek & Latin Roots", "ir-", "not (before r)");
ok("ir-: definitions key + that entry's def field only", writes.length === 2 && writes[1][0] === "mastery/ellis_custom_items/7/def" && writes[1][2] === "not (before r)");
ok("ir- entry copy agrees", ctx.mastCustomDef("ellis", "Greek & Latin Roots", "ir-") === "not (before r)");

// clearing a box falls back to the built-in meaning
writes.length = 0;
ctx.mastSaveWaitingDef("Greek & Latin Roots", "flex/flect", "");
ok("clearing removes only that key", JSON.stringify(writes[0][2]) === JSON.stringify({ "flex%2Fflect": null }) && ctx.mastGetDef("ellis", "flex/flect") === "bend");

// lesson labels for the book cross-check
ok("lesson label: Lesson 2", ctx._mastWaitingLesson("Greek & Latin Roots", "in-") === "Lesson 2");
ok("lesson label: Level 1 Lesson 1", ctx._mastWaitingLesson("Greek & Latin Roots", "il-") === "Level 1 Lesson 1");
ok("lesson label: More roots open now", ctx._mastWaitingLesson("Greek & Latin Roots", "bio") === "now");

// dry run: the entry copy isn't written
({ ctx, writes } = setup()); ctx._dryRun = () => true;
ctx.mastSaveWaitingDef("Greek & Latin Roots", "ir-", "x");
ok("dry run: no write to the entry copy", !writes.some(w => /custom_items/.test(w[0])));

// the panel lists waiting names with an edit box
const panel = fn("mastAdminBankCatHtml");
ok("panel has the folded 'Waiting to start' list", /Waiting to start \('\+_fWait\.length\+'\)/.test(panel) && /mastSaveWaitingDef\(/.test(panel));
ok("box shows when a deck has waiting names but no cards yet", /_fCatItems\.length\|\|_fWait\.length/.test(panel));
ok("no 🔀 in index.html", src.indexOf("\u{1F500}") < 0);
console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
