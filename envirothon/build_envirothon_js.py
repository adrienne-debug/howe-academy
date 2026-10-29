#!/usr/bin/env python3
"""Build envirothon.js (the lazy-loaded card file the app reads) from nc_envirothon_unit.json.

    python3 envirothon/build_envirothon_js.py        # writes ../envirothon.js next to index.html

The JSON stays the source of truth (merge.py rebuilds it from parts/*.json). This script only:
  * keeps every card field exactly as the JSON has it (name, def, group, concept, station, kind, order,
    src, stage, core, info, item) — nothing dropped, nothing reworded;
  * adds `family` = `group` (the Key Concept name) on each card, because the staged-enroll engine
    (`_ustFamilies`, `unitStageStatus`) reads `card.family` for its "already knows through …" list;
  * wraps the unit as a classic script registering window.HoweEnvirothon (and module.exports for the
    node tests), the same pattern as notebooks.js / eic.js.
No database is touched. test_env_unit.js checks envirothon.js against the JSON, so a stale build fails.

ENVTEST (2026-10-27): the station check-ins ride along. nc_envirothon_tests.json (built by extract_tests.py from the real
Area 8 middle-school tests) is compiled in as window.HoweEnvirothon.tests = { <station>: { label, emoji, pre:{form,
source, n, items:[{n,q,choices,ans,cite}]}, post:{…} } } — questions never go into index.html. The same run writes
PREVIEW_tests.html (every form, a Show-answers toggle, the kept/dropped table) and TESTS.md (the counts and drop list in
text) beside the JSON, for Adrienne to read before anything is merged. test_env_tests.js checks the compiled tests
against the JSON.

📚 CPCARDSSEE (2026-10-28, class platform PR 9, DESIGN §8.4): each question also carries `cards` — the cards that teach it, as
"<deckKey>#o<order>" — read from units/nc_envirothon/LINKS.json, which `node units/build/compile_unit.js nc_envirothon` works out
(run that first, then this). The teacher's 📚 Cards browser reads them for "On the tests" and its Not-on-any-test filter; nothing
in Howe reads them. compile_unit.js --check fails while this file's links differ from LINKS.json.
"""
import json, os, sys, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "nc_envirothon_unit.json")
TESTS_SRC = os.path.join(HERE, "nc_envirothon_tests.json")
PREVIEW = os.path.join(HERE, "PREVIEW_tests.html")
TESTS_MD = os.path.join(HERE, "TESTS.md")
LINKS = os.path.join(os.path.dirname(HERE), "units", "nc_envirothon", "LINKS.json")   # 📚 CPCARDSSEE
OUT = os.path.join(os.path.dirname(HERE), "envirothon.js")

def load_tests():
    """The compiled shape: station → {label, emoji, pre, post}; a form keeps form/source/n/items (+ note), not the drop list."""
    if not os.path.exists(TESTS_SRC):
        return None
    with open(TESTS_SRC, encoding="utf-8") as f:
        doc = json.load(f)
    links = {}
    if os.path.exists(LINKS):
        with open(LINKS, encoding="utf-8") as f:
            links = json.load(f)
    out = {}
    for sid, st in doc["stations"].items():
        rec = {"label": st["label"], "emoji": st["emoji"]}
        for w in ("pre", "post"):
            fm = st[w]
            r = {"form": fm["form"], "source": fm["source"], "n": fm["n"],
                 "items": [{"n": it["n"], "q": it["q"], "choices": it["choices"], "ans": it["ans"], "cite": it["cite"]} for it in fm["items"]]}
            if links:   # 📚 CPCARDSSEE: the question's cards (§8.4), [] when none
                for it in r["items"]:
                    it["cards"] = links.get(sid, {}).get(w + "-" + str(it["n"]), [])
            if fm.get("note"): r["note"] = fm["note"]
            rec[w] = r
        out[sid] = rec
    return doc, out

def esc(v):
    return str(v).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")

def pass_mark(n):
    return -(-n * 4 // 5)   # ceil(0.8 n): 16 of 20, 12 of 15, 12 of 14, 11 of 13, 14 of 17

def write_preview(doc):
    S = doc["stations"]
    h = ["<!doctype html><html lang=en><head><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'>",
         "<title>Envirothon check-ins — preview</title>",
         "<style>body{font-family:-apple-system,'DM Sans',Helvetica,Arial,sans-serif;max-width:760px;margin:0 auto;padding:18px 16px;color:#1f2937;line-height:1.45;background:#faf8f5}",
         "h1{font-size:22px;margin:0 0 4px}h2{font-size:18px;margin:28px 0 6px;padding-top:10px;border-top:2px solid #e5e0d8}h3{font-size:15px;margin:18px 0 6px;color:#2d6a4f}",
         "table{border-collapse:collapse;width:100%;font-size:13px;margin:10px 0}td,th{border:1px solid #e5e0d8;padding:5px 7px;text-align:left;vertical-align:top}th{background:#f3f1ee}",
         ".q{background:#fff;border:1.5px solid #e5e0d8;border-radius:12px;padding:10px 12px;margin:8px 0}.q .t{font-weight:700}.q ol{list-style:none;padding:0;margin:6px 0 0}.q li{padding:4px 8px;border-radius:8px;margin:2px 0}",
         ".q li b{display:inline-block;width:1.4em;color:#6b7280}.cite{display:none;font-size:12px;color:#6b7280;margin-top:5px}.n{color:#9ca3af;font-weight:700}",
         "body.ans .q li.k{background:#dcfce7;font-weight:700}body.ans .cite{display:block}.tog{position:sticky;top:0;background:#faf8f5;padding:8px 0;z-index:2;border-bottom:1px solid #e5e0d8;font-size:14px}",
         ".drop td:first-child{white-space:nowrap}.tag{display:inline-block;font-size:11px;font-weight:700;border-radius:8px;padding:1px 7px;background:#fef3c7;color:#92400e;margin-left:6px}.muted{color:#6b7280;font-size:13px}</style></head><body>",
         "<h1>🌿 NC Envirothon — station check-ins (preview)</h1>",
         "<div class=muted>Built " + esc(doc["built"]) + " from envirothon/nc_envirothon_tests.json. Nothing on this page is live: it is the exact text the app's ENVTEST block will show, for reading before the merge.</div>",
         "<div class=tog><label><input type=checkbox id=sh onchange=\"document.body.classList.toggle('ans',this.checked)\"> <b>Show answers</b> (marks the keyed choice and shows each source cite)</label></div>",
         "<h2>The forms</h2>",
         "<div class=muted>Pre-test = the real 2026 Area 8 middle-school test for that station. Post-test = the 2022 Area 8 MS test (Current Environmental Issues: the 2026 form again — no past CEI test fits the 2027 topics). Items needing a picture, a specimen, or the Rowan County Soil Survey tables are left out and listed; a form keeps whatever remains. Pass mark 80 %: the pass column shows how many right that is.</div>",
         "<table><tr><th>Station</th><th>Pre-test</th><th>kept / dropped</th><th>pass</th><th>Post-test</th><th>kept / dropped</th><th>pass</th></tr>"]
    for sid, st in S.items():
        pre, post = st["pre"], st["post"]
        h.append("<tr><td>%s %s</td><td>%s</td><td>%d / %d</td><td>%d of %d</td><td>%s</td><td>%d / %d</td><td>%d of %d</td></tr>" % (
            st["emoji"], esc(st["label"]), esc(pre["form"]), pre["n"], len(pre["dropped"]), pass_mark(pre["n"]), pre["n"],
            esc(post["form"]) + (" <span class=tag>same as pre</span>" if post.get("note") else ""), post["n"], len(post["dropped"]), pass_mark(post["n"]), post["n"]))
    h.append("</table>")
    h.append("<h3>Left out, and why</h3><table class=drop><tr><th>Form</th><th>#</th><th>Question</th><th>Why</th></tr>")
    for sid, st in S.items():
        for w in ("pre", "post"):
            fm = st[w]
            if w == "post" and fm.get("note"): continue
            for d in fm["dropped"]:
                h.append("<tr><td>%s %s</td><td>%d</td><td>%s</td><td>%s</td></tr>" % (esc(st["label"]), w, d["n"], esc(d["q"]), esc(d["why"])))
    h.append("</table>")
    h.append("<h3>Odd-shaped items kept</h3><ul class=muted>")
    for sid, st in S.items():
        for w in ("pre", "post"):
            fm = st[w]
            if w == "post" and fm.get("note"): continue
            for it in fm["items"]:
                if isinstance(it["ans"], list): h.append("<li>%s %s #%d — <b>select all that apply</b> (%s); scored right only when exactly those are picked.</li>" % (esc(st["label"]), w, it["n"], ", ".join("ABCDE"[i] for i in it["ans"])))
                elif len(it["choices"]) != 4: h.append("<li>%s %s #%d — %d choices (kept as the test has it).</li>" % (esc(st["label"]), w, it["n"], len(it["choices"])))
                if "The chart:" in it["q"]: h.append("<li>%s %s #%d — the test's biotic-index chart is restated in words (the only wording change in any form).</li>" % (esc(st["label"]), w, it["n"]))
    h.append("</ul>")
    for sid, st in S.items():
        h.append("<h2>%s %s</h2>" % (st["emoji"], esc(st["label"])))
        for w in ("pre", "post"):
            fm = st[w]
            h.append("<h3>%s — %s · %d questions <span class=muted>(%s)</span></h3>" % ("Pre-test" if w == "pre" else "Post-test", esc(fm["form"]), fm["n"], esc(fm["source"])))
            if fm.get("note"):
                h.append("<div class=muted>" + esc(fm["note"]) + " — the questions are the pre-test's above.</div>"); continue
            for it in fm["items"]:
                keyed = set(it["ans"]) if isinstance(it["ans"], list) else {it["ans"]}
                h.append("<div class=q><div class=t><span class=n>%d.</span> %s</div><ol>" % (it["n"], esc(it["q"])))
                for i, c in enumerate(it["choices"]):
                    h.append("<li%s><b>%s</b>%s</li>" % (" class=k" if i in keyed else "", "ABCDE"[i], esc(c)))
                h.append("</ol><div class=cite>Key: %s · %s</div></div>" % (", ".join("ABCDE"[i] for i in sorted(keyed)), esc(it["cite"])))
    h.append("</body></html>")
    with open(PREVIEW, "w", encoding="utf-8") as f:
        f.write("\n".join(h))

def write_tests_md(doc):
    S = doc["stations"]
    L = ["# NC Envirothon — station check-ins (ENVTEST)", "",
         "Built " + doc["built"] + " by `envirothon/extract_tests.py` → `nc_envirothon_tests.json` → `build_envirothon_js.py` (compiled into `envirothon.js` as `HoweEnvirothon.tests`; this file and `PREVIEW_tests.html` come out of the same build).", "",
         "Pre-test = the real 2026 Area 8 middle-school test for the station (`~/Desktop/Envirothon/club/A8_MS_*_test_2026.docx`). Post-test = the 2022 Area 8 MS test (`~/Desktop/Envirothon/tests/2022_NC-A8-SPE_MS/`; tests/INDEX.md: Soils/Forestry very good fit, Aquatics good, Wildlife medium). Current Environmental Issues has no usable past test for the 2027 topics, so its post-test is the 2026 form again (her allowance: \u201cthe same test\u201d). The 2021 forms were not used (a second post-test form was optional and would cost another round of re-keying).", "",
         "Every kept question is verbatim from its source with the key and the source cite. Items that need a picture, a specimen or the Rowan County Soil Survey tables are dropped and listed here; a form keeps whatever remains. Pass mark 80 % (my pick, see below).", "",
         "| Station | Pre-test form | kept / dropped | pass | Post-test form | kept / dropped | pass |", "|---|---|---|---|---|---|---|"]
    for sid, st in S.items():
        pre, post = st["pre"], st["post"]
        L.append("| %s %s (`%s`) | %s | %d / %d | %d of %d | %s | %d / %d | %d of %d |" % (st["emoji"], st["label"], sid, pre["form"], pre["n"], len(pre["dropped"]), pass_mark(pre["n"]), pre["n"],
                 post["form"] + (" (same as pre)" if post.get("note") else ""), post["n"], len(post["dropped"]), pass_mark(post["n"]), post["n"]))
    L += ["", "## Left out, and why", "", "| Form | # | Question | Why |", "|---|---|---|---|"]
    for sid, st in S.items():
        for w in ("pre", "post"):
            fm = st[w]
            if w == "post" and fm.get("note"): continue
            for d in fm["dropped"]:
                L.append("| %s %s | %d | %s | %s |" % (st["label"], w, d["n"], d["q"].replace("|", "/"), d["why"].replace("|", "/")))
    L += ["", "## Odd-shaped items kept", ""]
    for sid, st in S.items():
        for w in ("pre", "post"):
            fm = st[w]
            if w == "post" and fm.get("note"): continue
            for it in fm["items"]:
                if isinstance(it["ans"], list): L.append("- %s %s #%d — select all that apply (%s); right only when exactly those are picked (all-or-nothing)." % (st["label"], w, it["n"], ", ".join("ABCDE"[i] for i in it["ans"])))
                elif len(it["choices"]) != 4: L.append("- %s %s #%d — %d choices, kept as the test has it (the app shows A–E letters on every choice)." % (st["label"], w, it["n"], len(it["choices"])))
                if "The chart:" in it["q"]: L.append("- %s %s #%d — the biotic-index chart is restated in words; the only wording change in any form." % (st["label"], w, it["n"]))
    L += ["", "## Decisions that need Adrienne", "",
          "1. **Pass mark 80 %** (16 of 20; a shorter form rounds up: 12 of 15, 12 of 14, 11 of 13, 14 of 17). My pick — the contest publishes no pass mark.",
          "2. **Select-all-that-apply items** (10 of them) are scored all-or-nothing. The contest's own scoring of these is not stated in the tests.",
          "3. **Rowan County Soil Survey table items** (Soils pre 7–9, post 15–16) are dropped: they need the survey's tables, not a picture. They could come back with the tables as a picture (ENVPICS) or stay out.",
          "4. **Aquatics post #20** (biotic index from counts) is dropped because it depends on identifying question 17's picture; one line of rewording (count the pouch snail as the Group 3 member) would bring it back.",
          "5. **The 2021/22 keys cite the older manuals** (tests/INDEX.md). The cites are kept as written; a re-key against the Aug-2024 manuals was not done here.",
          "6. **Timer**: the test shows time counting up (the contest allows 25 minutes for 20 questions); it never cuts a kid off.",
          "7. **Cards do not wait for the pre-test** in this PR (the design's \u201ccards open after it\u201d): nothing in drills or sessions changes here. The release step (PR 3) can gate on the pre-test record if she wants it.", ""]
    with open(TESTS_MD, "w", encoding="utf-8") as f:
        f.write("\n".join(L))

def build():
    with open(SRC, encoding="utf-8") as f:
        unit = json.load(f)
    n = 0
    for d in unit["decks"]:
        for c in d["cards"]:
            if "family" not in c:
                c["family"] = c.get("group", "")
            n += 1
    body = json.dumps(unit, ensure_ascii=False, separators=(",", ":"))
    tl = load_tests()
    tests_js = ""
    if tl:
        doc, tests = tl
        tbody = json.dumps(tests, ensure_ascii=False, separators=(",", ":")).replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
        tests_js = "  lib.tests = " + tbody + ";   // ENVTEST: the station check-ins (nc_envirothon_tests.json)\n"
        write_preview(doc); write_tests_md(doc)
    # U+2028 / U+2029 are legal in JSON strings but were line terminators in older JS engines.
    body = body.replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    today = datetime.date.today().isoformat()
    js = (
        "/* ============================================================================\n"
        " * Howe Academy — 🌿 NC Envirothon card set  (lazy-loaded, classic script)\n"
        " * ----------------------------------------------------------------------------\n"
        " * GENERATED by envirothon/build_envirothon_js.py from envirothon/nc_envirothon_unit.json\n"
        " * — do not hand-edit; fix the JSON (merge.py) and rebuild. Every card comes from the official\n"
        " * 2026-27 NC Envirothon study documents (see envirothon/REVIEW_cards.md, COUNTS.md).\n"
        " * Loaded on demand by index.html (ENVUNIT block) only when a family has added the unit, the same\n"
        " * way notebooks.js / eic.js load — never on the page-load path, never in the database.\n"
        " * Exposes window.HoweEnvirothon = { version, built, unit, tests }. unit.decks[].cards hold " + str(n) + " cards;\n"
        " * tests = the station check-ins (ENVTEST, from envirothon/nc_envirothon_tests.json).\n"
        " * ========================================================================== */\n"
        "(function () {\n"
        "  \"use strict\";\n"
        "  var UNIT = " + body + ";\n"
        "  var lib = { version: 1, built: \"" + today + "\", unit: UNIT };\n"
        + tests_js +
        "  if (typeof window !== \"undefined\") window.HoweEnvirothon = lib;\n"
        "  if (typeof module !== \"undefined\" && module.exports) module.exports = lib;\n"
        "})();\n"
    )
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(js)
    print("wrote %s: %d cards, %d bytes%s" % (OUT, n, len(js.encode("utf-8")), (", tests for %d stations (+ PREVIEW_tests.html, TESTS.md)" % len(tl[1])) if tl else ""))

if __name__ == "__main__":
    build()
