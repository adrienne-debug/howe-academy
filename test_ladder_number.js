// 🔢 Number-thinking ladder (study §25, 2026-11-23): the missing rungs, as reviewable content — nothing loaded or live.
// Checks ladders/number_thinking.json: shape, counts, stages, uniqueness, one right answer per item (by the
// independent blind checker), answer letters spread out, and that the generator still makes the same file.
// Run: node test_ladder_number.js
const fs = require("fs"), path = require("path");
const DIR = path.join(__dirname, "ladders");
const data = JSON.parse(fs.readFileSync(path.join(DIR, "number_thinking.json"), "utf8"));
const { build } = require(path.join(DIR, "gen_number_thinking.js"));
const { check } = require(path.join(DIR, "check_number_thinking.js"));
let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : (fail++, console.log("FAIL", m)); };

const LEVELS = ["prek", "k", "g1", "g2", "g3", "g5", "g7", "g8"];
const NCH = { prek: 3, k: 3, g1: 4, g2: 4, g3: 5, g5: 5, g7: 5, g8: 5 };
const KINDS = { prek: ["RP", "BD", "GP", "MF", "MS"], k: ["RP", "BD", "GP", "MF", "MS"], g1: ["NS", "NP", "NA", "NE"], g2: ["NS", "NP", "NA", "NE"],
  g3: ["NS", "NA", "NP"], g5: ["NS", "NA", "NP"], g7: ["NS", "NA", "NP"], g8: ["NS", "NA", "NP"] };
const PICTURE = ["RP", "BD", "GP", "MF", "MS"];
const OPTIONAL = { g5: 12, g7: 12, g8: 12 };   // Mom 2026-11-23: "add the stage" — an optional harder stage 6, off unless switched on
const num = s => Number(String(s).replace(/−/g, "-"));

// the file is exactly what the generator makes (deterministic, seeded)
ok(JSON.stringify(build()) === JSON.stringify(data), "generator re-run makes the same file");
ok(/Nothing here is loaded or live yet/.test(data.note), "file says it is not live");
ok(JSON.stringify(Object.keys(data.levels)) === JSON.stringify(LEVELS), "levels are exactly " + LEVELS.join(", ") + " (4th and 6th stay the boys' banks)");
ok(data.haveElsewhere.g4 === "ellis_quant_bank.json" && data.haveElsewhere.g6 === "lincoln_quant_bank.json", "4th/6th point at the boys' banks");
ok(fs.existsSync(path.join(__dirname, "ellis_quant_bank.json")) && fs.existsSync(path.join(__dirname, "lincoln_quant_bank.json")), "the boys' banks are still there");

const seenKey = new Set(), seenId = new Set();
for (const lv of LEVELS) {
  const L = data.levels[lv], ids = Object.keys(L.items), items = ids.map(k => L.items[k]);
  const core = items.filter(x => !x.opt), opt = items.filter(x => x.opt), nCore = L.stages.length - (L.optStages || []).length;
  ok(core.length === 60, `${lv}: 60 core items (got ${core.length})`);
  ok(opt.length === (OPTIONAL[lv] || 0), `${lv}: ${OPTIONAL[lv] || 0} optional items (got ${opt.length})`);
  if (OPTIONAL[lv]) {
    ok(JSON.stringify(L.optStages) === "[6]" && L.stages.length === 6 && /^optional: /.test(L.stages[5]), `${lv}: stage 6 is the one optional stage, named so`);
    ok(opt.every(x => x.opt === true && x.st === 6) && opt.every((x, i) => x.o === 61 + i), `${lv}: optional items are stage 6, o 61…72, opt:true`);
    ok(new Set(opt.map(x => x.type)).size === 3, `${lv}: the kinds take turns in the optional stage too`);
  } else ok(L.optStages === undefined, `${lv}: nothing optional`);
  ok(core.every(x => x.opt === undefined && x.st <= nCore), `${lv}: core items carry no opt flag`);
  ok(L.choices === NCH[lv], `${lv}: ${NCH[lv]} choices`);
  ok(nCore >= 4 && nCore <= 5 && L.stages.every(s => typeof s === "string" && s.length > 3), `${lv}: 4–5 named core stages`);
  ok(items.every((x, i) => x.o === i + 1), `${lv}: o runs 1…${items.length} in order`);
  ok(items.every((x, i) => i === 0 || x.st >= items[i - 1].st), `${lv}: stages only go up (easy → hard)`);
  ok(L.stages.every((_, s) => items.some(x => x.st === s + 1)), `${lv}: every stage has items`);
  const perStage = L.stages.map((_, s) => items.filter(x => x.st === s + 1).length);
  ok(perStage.every(n => n === perStage[0]), `${lv}: stages are the same size ${JSON.stringify(perStage)}`);
  for (const id of ids) {
    const x = L.items[id], tag = `${lv} ${id} "${x.text}"`;
    ok(/^nt_[a-z0-9]+_[0-9a-z]{7}$/.test(id) && id.startsWith(`nt_${lv}_`) && !seenId.has(id), `${tag}: stable, unique id`); seenId.add(id);
    const key = x.type + "|" + x.text; ok(!seenKey.has(key), `${tag}: not a duplicate anywhere in the file`); seenKey.add(key);
    ok(x.lv === lv, `${tag}: lv set`);
    ok(KINDS[lv].includes(x.type), `${tag}: kind ${x.type} belongs at ${lv}`);
    ok(Array.isArray(x.c) && x.c.length === NCH[lv] && x.c.every(c => typeof c === "string" && c.length) && new Set(x.c).size === x.c.length, `${tag}: ${NCH[lv]} different choices`);
    ok(typeof x.ans === "string" && "ABCDE".slice(0, NCH[lv]).includes(x.ans), `${tag}: answer letter`);
    ok(typeof x.rule === "string" && x.rule.length > 3 && !/undefined|NaN/.test(x.rule + x.text + x.c.join()), `${tag}: a plain rule, no undefined/NaN`);
    if (PICTURE.includes(x.type)) ok(x.pic && x.pic.kind && x.pic.choicesAs && typeof x.say === "string", `${tag}: picture item carries pic + say`);
    if (x.pic && (x.pic.kind === "pattern" || x.pic.kind === "beads" || x.pic.kind === "grow")) ok(x.pic.seq.filter(t => t === null).length === 1, `${tag}: one gap in the picture`);
    if (["prek", "k", "g1", "g2"].includes(lv)) ok(typeof x.say === "string", `${tag}: spoken prompt for the read-aloud years`);
    if (x.type === "NP") ok((x.text.match(/\?/g) || []).length === 1, `${tag}: one ? (the notebook boxes the first one)`);
    if (x.type === "NS") ok(/^\S+( {2}\S+)+$/.test(x.text) && x.text.split("  ").filter(t => t === "?").length === 1, `${tag}: series terms two spaces apart, one ?`);
    if (x.type === "NA") ok(/^(\[[^\]]+ → [^\]]+\]( {2}|$))+$/.test(x.text) && (x.text.match(/\?/g) || []).length === 1, `${tag}: pairs format`);
    if (["NS", "NA", "NP", "GP", "MS"].includes(x.type) || (x.type === "NE")) {
      const v = x.c.map(num);
      ok(v.every(Number.isFinite) && v.every((n, i) => i === 0 || n > v[i - 1]), `${tag}: number choices sorted low → high`);
      ok(x.c.every(c => !/\.\d{3,}/.test(c)), `${tag}: no long decimals`);
    }
    ok(!/\b(Lincoln|Ellis|Lucy|Julian|Taylor|Zuri|Mom|Dad)\b/.test(x.text + x.rule + (x.say || "")), `${tag}: no family names`);
  }
  if (NCH[lv] === 5) { const used = new Set(items.map(x => x.ans)); ok(used.size === 5, `${lv}: every answer letter is used`); }
  const cnt = {}; items.forEach(x => (cnt[x.ans] = (cnt[x.ans] || 0) + 1));
  ok(Math.max(...Object.values(cnt)) <= items.length / 2, `${lv}: no letter is the answer more than half the time ${JSON.stringify(cnt)}`);
}

// the 480 core items (and their ids) are frozen as reviewed — the optional stage was added without moving any of them
{ const core = []; for (const [lv, L] of Object.entries(data.levels)) for (const [id, x] of Object.entries(L.items)) if (!x.opt) core.push([id, x]);
  const fp = require("crypto").createHash("sha256").update(JSON.stringify(core)).digest("hex").slice(0, 16);
  ok(core.length === 480 && fp === "8f5520a77296133a", "core items unchanged since review (fingerprint " + fp + ") — if a change is intended, re-review and update this");
}
// one right answer, found blind
const rep = check(data);
ok(rep.total === 516 && rep.agree === rep.total, `blind checker agrees on ${rep.agree}/${rep.total}` + (rep.problems.length ? "\n  " + rep.problems.slice(0, 5).join("\n  ") : ""));
// the checker is not a copy of the generator: it doesn't load it, and it never reads the key while solving
const chk = fs.readFileSync(path.join(DIR, "check_number_thinking.js"), "utf8");
ok(!/gen_number_thinking/.test(chk.replace(/^\/\/.*$/gm, "")), "checker does not load the generator");
const solveBody = chk.slice(chk.indexOf("// ── pictures"), chk.indexOf("// ── run"));
ok(!/\.ans\b|\.rule\b/.test(solveBody), "solvers never read ans or rule");
// a planted wrong key is caught
const bad = JSON.parse(JSON.stringify(data)), k0 = Object.keys(bad.levels.g3.items)[0];
bad.levels.g3.items[k0].ans = bad.levels.g3.items[k0].ans === "A" ? "B" : "A";
ok(check(bad).agree === rep.total - 1, "a wrong answer letter is caught");
// a planted second right answer is caught (series where two rules fit)
const amb = JSON.parse(JSON.stringify(data)), k1 = Object.keys(amb.levels.g5.items).find(k => amb.levels.g5.items[k].type === "NA");
amb.levels.g5.items[k1].text = "[2 → 4]  [4 → ?]"; amb.levels.g5.items[k1].c = ["6", "8", "9", "10", "16"];
ok(check(amb).agree === rep.total - 1, "an item with too few clues to pin one rule is caught");

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
