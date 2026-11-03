// ✅ NBT_AUTOCHK (her yes 2026-11-03: "yes for notebook auto check, kid, but don't allow to change answer — leave it for Mom to
// talk about"): on a kid's device the tablet notebook's bank items with lettered choices take one tap on a printed letter circle;
// the tap is checked against the rebuilt item (the Grade sheet's own nbChkItems), lands in the sheet's per-day record as
// {t,ok,pick,auto:true,ts}, is final, and the right answer is never shown. Mom's sheet opens pre-filled and her mark wins.
// Run: node test_nb_autochk.js
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
let pass = 0, fail = 0;
function ok(c, name) { if (c) { pass++; console.log("  ✓ " + name); } else { fail++; console.log("  ✗ " + name); } }

const tb = src.indexOf("// NBTABLET_START"), te = src.indexOf("// NBTABLET_END");
const bs = src.indexOf("// NBT_AUTOCHK_START"), be = src.indexOf("// NBT_AUTOCHK_END");
const blk = src.slice(bs, be);
ok(bs > tb && be > bs && be < te, "NBT_AUTOCHK block found once, inside NBTABLET");
ok(src.split("// NBT_AUTOCHK_START").length === 2 && src.split("// NBT_AUTOCHK_END").length === 2, "block markers appear once each");
try { new Function(blk); ok(true, "block parses as JavaScript"); } catch (e) { ok(false, "block parses as JavaScript: " + e.message); }
ok(!/\b(lincoln|ellis|lucy|julian|caleb|taylor|makenzie|andrew)\b/i.test(blk), "no kid names in the block");
ok(blk.indexOf("\u{1F500}") < 0, "no 🔀");
const fn = name => { const i = blk.indexOf("function " + name + "("); if (i < 0) return ""; let d = 0, j = blk.indexOf("{", i); for (let k = j; k < blk.length; k++) { if (blk[k] === "{") d++; else if (blk[k] === "}") { d--; if (!d) return blk.slice(i, k + 1); } } return ""; };

// who taps, what is checked
ok(/function nbtAcCanTap\(v\)\{ return !!\(v&&v\.ready&&v\.ac&&!wbMomEyes\(\)\); \}/.test(blk), "taps only on a device that is not Mom's (her door is Grade)");
const prep = fn("nbtAcPrep");
ok(prep.indexOf("nbChkItems(v.kid,v.wk,d)") > 0, "the items are the Grade sheet's own (nbChkItems — same planners, same cursors)");
ok(prep.indexOf("NB_WB_KIDS[v.kid]") > 0, "only the kids with the sheet (bank kids)");
ok(/if\(!item\|\|!item\.bank\|\|!item\.ans\|\|!\(item\.choices\|\|\[\]\)\.length\) return;/.test(prep), "an item with no choices or no answer (BK day, built-in Q3) arms nothing");
ok(prep.indexOf("blocks.find(x=>nbtAcMatch(x,item))") > 0, "a block is armed only when its printed choices match the rebuilt item");
ok(prep.indexOf("haLoadNotebooksLib()") > 0, "the notebook library loads on demand (a kid's device usually hasn't got it)");
ok(/if\(NBT_DAYS\.indexOf\(d\)<0\) return;/.test(prep), "only day pages are armed");

// the tap and its record
const pick = fn("nbtAcPick");
ok(/^function nbtAcPick\(v,hit\)\{\s*const a=hit\.arm; if\(nbtAcRec\(v,a\)\) return;/.test(pick), "a block with a mark takes no second tap (final)");
ok(pick.indexOf('const ok=hit.l===String(a.item.ans||"").toUpperCase()') > 0, "right/wrong = the tapped letter against the item's answer letter");
ok(pick.indexOf("rec={t:a.t,ok:ok,pick:hit.l,auto:true,ts:Date.now()}") > 0, "record = {t, ok, pick, auto:true, ts} — the sheet's shape plus the tap");
ok(pick.indexOf('db.ref("notebookSettings/"+v.kid+"/checks/"+v.wk+"/"+a.day+"/"+a.slot).set(rec)') > 0, "one targeted write to the sheet's own per-day record, the slot only");
ok(/if\(db&&!_dryRun\(\)\)\{ try\{ db\.ref\("notebookSettings\/"/.test(pick), "the write is inert without db / under ?dryrun=1");
ok(pick.indexOf("nbBankSave(") < 0 && (pick.match(/\.set\(/g) || []).length === 1 && pick.indexOf(".update(") < 0, "no other write, no whole-node set");
ok(pick.indexOf('"✓ Right!"') > 0 && pick.indexOf("Not that one") > 0 && pick.indexOf("a.item.ans") === pick.lastIndexOf("a.item.ans"), "the kid sees ✓ or ✗ and a plain line — the answer itself is never in the toast");
ok(/function nbtAcRec\(v,a\)\{[^\n]*\(r&&\(r\.pick\|\|r\.ok!=null\)\)\?r:null/.test(blk), "a slot Mom already marked by hand is closed too (her mark wins)");
ok(/function nbtAcType\(slot,item\)\{ return slot==="q1"\?\(item\.type\|\|""\):slot==="q2"\?\(item\.qtype\|\|""\):\(item\.ctype\|\|""\); \}/.test(blk), "t per slot = the sheet's (type / qtype / ctype)");

// what is drawn: rings and ✓ / ✗ on the ink canvas, never into the page, never the answer
const paint = fn("nbtAcPaint");
ok(paint && paint.indexOf(".ans") < 0 && paint.indexOf("item") < 0, "the painter never touches the answer");
ok(paint.indexOf("if(!rec.pick||rec.pick!==r.l) return;") > 0, "the ring and mark sit on the tapped letter only");
ok(paint.indexOf('rec.ok?"✓":"✗"') > 0, "✓ for right, ✗ for wrong, from the stored record (Mom's flip shows)");
ok(/else if\(tap\)\{ g\.setLineDash/.test(paint), "dashed rings on open circles only where taps work");
ok(blk.split("innerHTML").length === 2 && blk.indexOf("d.innerHTML=String(h==null") > 0 && blk.indexOf("appendChild") < 0 && blk.indexOf("insertAdjacentHTML") < 0 && blk.indexOf(".style.") < 0, "nothing is written into the page document (no reflow, no clipping)");
ok(src.indexOf("  nbtAcPaint(g,cv);   // NBT_AUTOCHK") > 0, "nbtPaint paints the marks over the ink");
ok(src.indexOf("nbtAcDraw();   // NBT_AUTOCHK: this page's circles") > 0, "a page change re-measures the circles");
ok(src.indexOf("nbtLoadInk(); nbtAcPrep(v); }") > 0, "the pages are armed once the document is up");

// pointer plumbing: a tap on an open circle is a pick, not a stroke; lift on the same circle within 0.7 s
const pd = src.slice(src.indexOf('document.addEventListener("pointerdown",e=>{', tb), src.indexOf('document.addEventListener("pointermove"', tb));
ok(pd.indexOf("nbtAcHit(nbtView,p0)") > 0 && pd.indexOf("nbtAcHit(nbtView,p0)") < pd.indexOf('if(nbtView.penOnly&&e.pointerType!=="pen") return;'), "the hit test runs before the pencil-only rule — a finger can tap a letter");
ok(/if\(hit\)\{ e\.preventDefault\(\); nbtView\._tap=\{hit:hit,p:p0,t:Date\.now\(\)\};[^\n]*return; \}/.test(pd), "a hit starts a tap, not a stroke");
const pm = src.slice(src.indexOf('document.addEventListener("pointermove"', tb), src.indexOf("const end=(e)=>{", tb));
ok(pm.indexOf("nbtView._tap=null; return; }") > 0, "a drag off the circle cancels the tap (nothing drawn either)");
const en = src.slice(src.indexOf("const end=(e)=>{", tb), src.indexOf('document.addEventListener("pointerup",end)', tb));
ok(en.indexOf("Date.now()-tp.t<700") > 0 && en.indexOf("h2.arm===tp.hit.arm&&h2.l===tp.hit.l) nbtAcPick(nbtView,h2)") > 0, "the pick lands on lift, same circle, within 0.7 s");

// the sheet: pre-filled from the tap (it already reads ok), shows the tap, keeps it on save; a flip makes the mark hers
const sh = src.slice(src.indexOf("function nbChkOpen("), src.indexOf("// results in date order"));
ok(sh.indexOf("if(p&&p.pick){ nbChkState[q].pick=p.pick; nbChkState[q].auto=!!p.auto; nbChkState[q].aok=p.ok; }") > 0, "nbChkOpen: the tap, auto and its mark ride into the sheet state");
ok(sh.indexOf("if(rec[q]&&s[q].pick){ rec[q].pick=s[q].pick; if(s[q].auto&&s[q].ok===s[q].aok) rec[q].auto=true; }") > 0, "nbChkSave: the tap stays with the row; auto only while the mark is unchanged");
ok(sh.indexOf("📱 Tapped '+esc(s[q].pick)") > 0 && sh.indexOf("inner+tapped(q)+rw(q,ok)") > 0, "nbChkRender: the row says what was tapped");
ok(sh.indexOf('nbBankSave(s.kid,"checks",s.wk+"/"+s.day,rec)') > 0, "nbChkSave: the same storage as before");
ok(/function nbChkOpen\(kid,wk,day,opts\)\{[^\n]*\n  if\(!momHere\(\)\|\|!NB_WB_KIDS\[kid\]\) return;/.test(sh), "the sheet stays Mom-only");
ok(/if\(typeof nbtView!=="undefined"&&nbtView&&typeof nbtAcDraw==="function"\) nbtAcDraw\(\);/.test(src.slice(src.indexOf('db.ref("notebookSettings").on("value"'), src.indexOf('db.ref("together").on("value"'))), "a mark from another device repaints an open notebook");
ok(src.indexOf("tapping a letter on a question checks it on the spot") > 0, "the Notebook tab blurb says it");

// the matching, run: entities and whitespace normalised, same letters in the same order, same count
const pure = ["nbtAcText", "nbtAcDomText", "nbtAcMatch"].map(fn).join("\n");
const g = { document: { createElement: () => ({ set innerHTML(h) { this.textContent = h.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'"); } }) } };
vm.createContext(g); vm.runInContext(pure + "\nthis.T=nbtAcText; this.M=nbtAcMatch;", g);
const row = (l, t) => ({ l, t });
const item = { choices: [{ l: "A", t: "Tom &amp; Jerry" }, { l: "B", t: "the  dog&#39;s bowl" }, { l: "C", t: "No mistake" }] };
ok(g.M({ rows: [row("A", "tom & jerry"), row("B", "the dog's bowl"), row("C", "no mistake")] }, item), "match: entities, double spaces and case normalised");
ok(!g.M({ rows: [row("A", "tom & jerry"), row("B", "the dog's bowl")] }, item), "no match: a block with fewer rows");
ok(!g.M({ rows: [row("A", "tom & jerry"), row("C", "the dog's bowl"), row("B", "no mistake")] }, item), "no match: letters out of order");
ok(!g.M({ rows: [row("A", "tom & jerry"), row("B", "the dog's bowls"), row("C", "no mistake")] }, item), "no match: one word different");
ok(!g.M({ rows: [] }, { choices: [] }), "no match: an item with no choices");

// every builder with banks: each bank item's printed choices are found on its day page, exactly once (the mapping the viewer does, on the HTML)
try {
  const nb = fs.readFileSync(path.join(__dirname, "notebooks.js"), "utf8");
  const w = { window: {}, console: console, setTimeout: setTimeout, Promise: Promise }; w.self = w.window; vm.createContext(w); vm.runInContext(nb, w);
  const lib = w.window.HoweNotebooks;
  const dates = { monday: "November 2", tuesday: "November 3", wednesday: "November 4", thursday: "November 5", friday: "November 6" }, days = Object.keys(dates);
  const cogatBank = { cursor: null, items: [
    { type: "A", text: "hot : cold :: up : ?", c: ["down", "over", "left", "high", "warm"], ans: "A" },
    { type: "S", text: "The river was so ___ that we could see the stones on the bottom.", c: ["muddy", "clear", "deep", "fast"], ans: "B" },
    { type: "C", text: "oak · maple · pine", c: ["flower", "birch", "grass", "leaf", "root"], ans: "B" },
    { type: "A", text: "bird : nest :: bee : ?", c: ["honey", "hive", "sting", "flower"], ans: "B" },
    { type: "S", text: "She ___ the door so the cat wouldn't get out.", c: ["opened", "painted", "closed", "found"], ans: "C" } ] };
  const quantBank = { cursor: null, items: [
    { type: "NS", text: "2  4  8  16  ?", c: ["18", "24", "32", "30", "20"], ans: "C", rule: "double it" },
    { type: "BK", text: "CogAT book pages 12–13", c: [], ans: "" },
    { type: "NA", text: "[3 → 9]  [4 → 12]  [6 → ?]", c: ["12", "15", "18", "21", "24"], ans: "C", rule: "times 3" },
    { type: "NP", text: "? + 4 = 11 / ? = ", c: ["5", "6", "7", "8", "9"], ans: "C", rule: "" },
    { type: "CO", text: "48 ÷ 6 = ?", c: ["6", "7", "8", "9", "12"], ans: "C", rule: "" } ] };
  const convBank = { cursor: null, items: [
    { type: "SP", text: "Which word is spelled wrong?", c: ["because", "freind", "little", "water", "No mistake"], ans: "B", rule: "i before e" },
    { type: "US", text: "Which line has a mistake?", c: ["Me and Sam went", "to the park", "after lunch.", "No mistake"], ans: "A", rule: "Sam and I" },
    { type: "CP", text: "Which line has a mistake?", c: ["On monday we", "will visit Aunt May", "in Ohio.", "No mistake"], ans: "A", rule: "days get a capital" },
    { type: "SP", text: "Which word is spelled wrong?", c: ["Tom &amp; Jerry", "thier", "apple", "house", "No mistake"], ans: "B", rule: "" },
    { type: "US", text: "Which line has a mistake?", c: ["The dogs barks", "all night long", "at the moon.", "No mistake"], ans: "A", rule: "" } ] };
  const ctx = k => ({ nbKidName: k[0].toUpperCase() + k.slice(1), weekData: { dates, tasks: [] }, weekNum: "week12", weekDates: "Nov 2–6", masteryItems: [], reviewCap: 2, personal: null, prevSummary: null, prevStats: null, pace: null, units: [], extraPages: {}, bindingMargin: false, spelling: null, wordBank: null, cogatBank, quantBank, convBank, dailyGrams: null, loe: null, juPicks: null, numberCursor: null, letterCursor: null, countEmoji: null, letterSounds: null, coloring: null, dotdot: null, symmetry: null, maze: null, pattern: null, dolls: null, passage: null });
  // the viewer's reading of a page, done on the HTML: every <div class="choices"> → its rows (letter circle + text)
  const strip = h => h.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim().toLowerCase();
  const divEnd = (h, i) => { let d = 0; const re = /<div\b|<\/div>/g; re.lastIndex = i; let m; while ((m = re.exec(h))) { if (m[0] === "<div") d++; else { d--; if (!d) return m.index; } } return -1; };
  const blocksOf = pg => { const out = []; const re = /<div class="choices[" ]/g; let m; while ((m = re.exec(pg))) { const e = divEnd(pg, m.index); const inner = pg.slice(pg.indexOf(">", m.index) + 1, e); const rows = []; const rr = /<div class="choice[-" ]/g; let r; while ((r = rr.exec(inner))) { const re2 = divEnd(inner, r.index); const rh = inner.slice(inner.indexOf(">", r.index) + 1, re2); const lm = rh.match(/^\s*<div class="(c-letter|choice-letter[^"]*)"[^>]*>([^<]*)<\/div>/); if (!lm) continue; const l = lm[2].trim().toUpperCase(); rows.push({ l, t: strip(rh.slice(lm[0].length)) }); rr.lastIndex = re2; } out.push(rows); re.lastIndex = e; } return out; };
  const same = (rows, ch) => rows.length === ch.length && ch.every((c, i) => rows[i].l === c.l && rows[i].t === strip(c.t));
  ["lincoln", "ellis"].forEach(k => {
    const o = lib.generate(k, ctx(k));
    const toks = []; const re = /<div class="page-label">[^<]*<\/div>|<div class="page[" ][^>]*>/g; let m;
    while ((m = re.exec(o.student))) toks.push({ i: m.index, s: m[0] });
    const pages = {};   // the viewer's rule: the builder's label names the day; no label → the page text
    for (let i = 0; i < toks.length; i++) { if (!/^<div class="page[" ]/.test(toks[i].s)) continue; const lbl = i > 0 && toks[i - 1].s.indexOf("page-label") > 0 ? toks[i - 1].s : ""; const next = toks.slice(i + 1).find(t => /^<div class="page[" ]/.test(t.s)); const html = o.student.slice(toks[i].i, next ? next.i : undefined); const dm = (lbl ? strip(lbl) : strip(html).slice(0, 400)).match(/monday|tuesday|wednesday|thursday|friday/i); if (dm) pages[dm[0].toLowerCase()] = (pages[dm[0].toLowerCase()] || []).concat(html); }   // a day may have several pages (an overview labelled "Monday kick-off" + the daily page)
    const plans = { q1: lib.cogatBankPlan(cogatBank, 12, days), q2: lib.quantBankPlan(quantBank, 12, days), q3: lib.convBankPlan(convBank, 12, days) };
    let armed = 0, want = 0, extra = 0;
    days.forEach((d, di) => { const pg = pages[d]; if (!pg) { fail++; console.log("  ✗ " + k + ": no " + d + " page"); return; } const blocks = [].concat.apply([], pg.map(blocksOf));
      ["q1", "q2", "q3"].forEach(s => { const it = plans[s].items[di]; if (!it || !it.ans || !(it.choices || []).length) return; want++; const n = blocks.filter(b => same(b, it.choices)).length; if (n === 1) armed++; else if (n > 1) extra++; }); });
    ok(want > 0 && armed === want && !extra, k + ": every lettered bank item is found on its day page exactly once (" + armed + "/" + want + ")");
    ok(plans.q2.items[1].qtype === "BK" && !plans.q2.items[1].choices.length && !plans.q2.items[1].ans, k + ": a CogAT-book day has no choices and no answer — nothing to tap");
  });
} catch (e) { ok(false, "builders: " + e.message); }

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
