#!/usr/bin/env python3
"""ENVTEST — build envirothon/nc_envirothon_tests.json from the real Area 8 middle-school tests on this Mac.

    python3 -I envirothon/extract_tests.py        # reads ~/Desktop/Envirothon/{club,tests}/..., writes nc_envirothon_tests.json

The .txt files are docx dumps (numbered lists appear as <listId:level:counter>, {B} = bold). They are untrusted downloads,
so run this with -I and never import anything from those folders. The JSON is then compiled into envirothon.js by
build_envirothon_js.py, which also writes PREVIEW_tests.html and TESTS.md. Nothing here touches the app or a database.
"""
import re, sys, json, html, os, datetime

MARK = re.compile(r"^\s*<(\d+):(\d+):(\d+)>\s*")
NUM  = re.compile(r"^\s*(\d{1,2})\s*[.):]\s*")
LET  = re.compile(r"^\s*([A-Ea-e])\s*[.)]\s+")

def clean(s):
    s = s.replace("{B}", "").replace("{U}", "").replace("{H}", "").replace("{C}", "")
    s = html.unescape(s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def split_jammed(line):
    # "A.   rill erosionB.   gully erosionC.   sheet erosionD.   streambank erosion"
    parts = re.split(r"(?:(?<=\S)|^)\s*(?=[A-Da-d][.)]\s+\S)", line)
    parts = [p for p in parts if p.strip()]
    if len(parts) >= 3 and all(re.match(r"^[A-Da-d][.)]\s", p) for p in parts):
        return parts
    # "a) Mature Forestb) Middle-aged Forestc) Young Forest and openings"
    parts = re.split(r"(?<=[a-z])(?=[a-d]\)\s)", line)
    if len(parts) >= 2 and all(re.match(r"^[a-d]\)\s", p) for p in parts):
        return parts
    return [line]

def parse_key_line(s):
    s = clean(s)
    s = MARK.sub("", s); s = NUM.sub("", s)
    s = s.strip()
    m = re.match(r"^([a-e])(?=[A-Z])(.*)$", s)   # "aSpotted Skunk ...", "cMS Wildlife Manual" (Wildlife 2022)
    if m: return [m.group(1).upper()], m.group(2).strip()
    m = re.match(r"^([a-e])(?![A-Za-z])\s*(.*)$", s)   # "b       Wild Notebook"
    if m: return [m.group(1).upper()], m.group(2).strip(" ,;.–-")
    m = re.match(r"^([A-E](?![a-z])(?:\s*(?:,\s*and|,\s*&|,|&|and)\s*[A-E](?![a-z]))*)\s*[.,;:–-]?\s*(.*)$", s)
    if not m: return None, s
    letters = re.findall(r"[A-E]", m.group(1))
    return letters, m.group(2).strip(" ,;.–-")

def parse(path):
    text = open(path, encoding="utf-8").read()
    for a, b in OVERRIDES.get(path.split("/")[-1], []):
        assert a in text, ("override not found", path, a[:40])
        text = text.replace(a, b)
    raw = text.split("\n")
    lines = [l for l in raw]
    # split body / key
    ki = None
    for i, l in enumerate(lines):
        if re.search(r"answer\s*(key|sheet)", l, re.I) and i > 10:
            ki = i; break
    body, key = lines[:ki], lines[ki+1:]
    # key lines
    keys = []
    for l in key:
        c = clean(l)
        if not c or re.match(r"^(20\d\d|Southern Piedmont Envirothon|.*Middle School.*|Answer Sheet)$", c): continue
        letters, cite = parse_key_line(c)
        keys.append({"letters": letters, "cite": cite, "raw": c})
    # body lines → tokens
    toks = []
    for l in body:
        c = l
        if "[IMG]" in c: toks.append(("IMG", "")); continue
        c = c.replace("{B}", "").replace("{U}", "")
        c = html.unescape(c)
        m = MARK.match(c)
        if m:
            lid, lvl, cnt = m.groups(); c = c[m.end():]
            kind = "Q" if (lid == "1" or (lid == "6" and lvl == "0") or (lid=="3" and lvl=="0" and "Wildlife" in path)) else "C"
            # Aquatics 2022: list 6 level 0 = questions, level 1/4 = choices, other lists level 0 = choices
            if "Aquatics" in path and "2022" in path: kind = "Q" if (lid == "6" and lvl == "0") else "C"
            if "Wildlife" in path and "2022" in path: kind = "Q" if (lid == "3" and lvl == "0") else "C"
            if "Soils" in path and "2022" in path: kind = "Q" if lid == "1" else "C"
            if "Forestry" in path and "2022" in path: kind = "Q" if lid == "1" else "C"
            toks.append((kind, clean(c))); continue
        c2 = clean(c)
        if not c2: continue
        for part in split_jammed(c2):
            p = part.strip()
            if LET.match(p): toks.append(("C", LET.sub("", p).strip()))
            elif NUM.match(p): toks.append(("Q", NUM.sub("", p).strip()))
            else: toks.append(("T", p))
    return toks, keys


# Raw-text fixes for lines the .txt dump broke (a wrapped+jammed choice list, a question split over two lines, a chart
# restated in words). Each pair is (text as dumped, text as read). The restated chart is the only wording change in any form.
OVERRIDES = {
  "A8_MS_Forestry_test_2026.txt": [
    ("a) Trees reduce the impact of rain drops slowing them down to allow rain to absorb into\nthe soil.b) Tree roots and forest soil absorb water and slow runoff.c) Fallen tree limbs, leaves, and duff slow water movement across the soil.d) All of the above",
     "a) Trees reduce the impact of rain drops slowing them down to allow rain to absorb into the soil.\nb) Tree roots and forest soil absorb water and slow runoff.\nc) Fallen tree limbs, leaves, and duff slow water movement across the soil.\nd) All of the above"),
    ("13) Many city planners are incorporating greenbelts adjacent to urban areas in their plans.\nWhich of the following",
     "13) Many city planners are incorporating greenbelts adjacent to urban areas in their plans. Which of the following"),
  ],
  "A8_MS_Aquatics_test_2026.txt": [
    ("Complete the chart to determine the biotic index rating of the stream. DO NOT WRITE ON THE CHART.\nGroup 1\nGroup 2\nGroup 3\n# found\n2\n2\n9\nX value\nX 3\nX 2\nX 1\nTotals\nWhat is the biotic index rating of the sampled stream?",
     "Complete the chart to determine the biotic index rating of the stream. The chart: Group 1 \u2014 2 found (\u00d7 3); Group 2 \u2014 2 found (\u00d7 2); Group 3 \u2014 9 found (\u00d7 1). What is the biotic index rating of the sampled stream?"),
  ],
}

HEADER = re.compile(r"^(20\d\d( SOUTHERN PIEDMONT ENVIROTHON)?|Southern Piedmont Envirothon|Middle School .*|.* – Middle School|Select the response.*|Record all answers.*|DO NOT WRITE.*)$", re.I)

def assemble(toks, keys, expect=20):
    """A Q token starts a question. T tokens before the first choice extend the question when its text so far has no
    closing punctuation (a wrapped line); otherwise, in the unnumbered 2026 files, plain lines are the 4 choices, and the
    line after the 4th choice starts the next question."""
    toks = [t for t in toks if not (t[0] == "T" and HEADER.match(t[1]))]
    qs = []; cur = None
    def ends_open(t):
        t = t.rstrip()
        if re.search(r"[?:.\u2026_)!]$", t): return False
        return True
    for kind, txt in toks:
        if kind == "IMG":
            if cur: cur["img"] = True
            continue
        if kind == "Q":
            if cur: qs.append(cur)
            cur = {"q": txt, "choices": [], "img": False}; continue
        if kind == "C":
            if cur is None: cur = {"q": "", "choices": [], "img": False}
            cur["choices"].append(txt); continue
        if cur is None: cur = {"q": txt, "choices": [], "img": False}; continue
        if not cur["choices"] and ends_open(cur["q"]): cur["q"] = (cur["q"] + " " + txt).strip(); continue
        if len(cur["choices"]) < 4: cur["choices"].append(txt); continue
        qs.append(cur); cur = {"q": txt, "choices": [], "img": False}
    if cur: qs.append(cur)
    return qs


# ── ENVTEST: which real items make the forms, and why the rest are left out ───────────────────────────────────────────
# Sources (this Mac only; untrusted downloads read as text): the 2026 Area 8 middle-school tests are the PRE-test forms;
# the 2022 Area 8 MS tests are the POST-test forms (INDEX.md: Soils/Forestry very good fit, Aquatics good, Wildlife medium;
# the past CEI tests do not fit the 2027 topics, so CEI's post-test is the 2026 form again — her "the same test").
CLUB = os.path.expanduser("~/Desktop/Envirothon/club/")
T22 = os.path.expanduser("~/Desktop/Envirothon/tests/2022_NC-A8-SPE_MS/")
PIC = "needs a picture (ENVPICS later)"
TABLE = "needs the Rowan County Soil Survey tables (a handout at the contest) — not a picture; Mom's call"
FORMS = {
  "forestry": {"label": "Forestry", "emoji": "\U0001F332",
    "pre":  {"file": CLUB + "A8_MS_Forestry_test_2026.txt", "form": "2026 Area 8 MS Forestry", "source": "A8_MS_Forestry_test_2026.docx",
             "drop": {16: "tree ID by picture — White Pine (" + PIC + ")", 17: "tree ID by picture — American Beech (" + PIC + ")", 18: "tree ID by picture — Sycamore (" + PIC + ")", 19: "tool ID by picture — Increment Borer (" + PIC + ")", 20: "tool ID by picture — Diameter Tape (" + PIC + ")"}},
    "post": {"file": T22 + "2022_SPE_MS_Forestry_Test.txt", "form": "2022 Area 8 MS Forestry", "source": "2022_SPE_MS_Forestry_Test.docx",
             "drop": {9: "Emerald Ash Borer exit holes by picture (" + PIC + ")", 16: "tool ID by picture — Biltmore Stick (" + PIC + ")", 17: "tree ID by picture — Red Maple (" + PIC + ")", 18: "tree ID by picture — American Beech (" + PIC + ")", 19: "tree ID by picture — Shortleaf pine (" + PIC + ")", 20: "tree ID by picture — Sourwood (" + PIC + ")"}}},
  "soils": {"label": "Soils/Land Use", "emoji": "\U0001FAA8",
    "pre":  {"file": CLUB + "A8_MS_Soils_test_2026.txt", "form": "2026 Area 8 MS Soils", "source": "A8_MS_Soils_test_2026.docx",
             "drop": {7: TABLE, 8: TABLE, 9: TABLE, 10: "soil texture triangle (a diagram; " + PIC + ")", 17: "grassed waterway ‘pictured above’ (" + PIC + ")"}},
    "post": {"file": T22 + "2022_SPE_MS_Soils_Test.txt", "form": "2022 Area 8 MS Soils", "source": "2022_SPE_MS_Soils_Test.docx",
             "drop": {6: "soil texture triangle (a diagram; " + PIC + ")", 15: TABLE, 16: TABLE}}},
  "aquatics": {"label": "Aquatic Ecology", "emoji": "\U0001F30A",
    "pre":  {"file": CLUB + "A8_MS_Aquatics_test_2026.txt", "form": "2026 Area 8 MS Aquatics", "source": "A8_MS_Aquatics_test_2026.docx",
             "drop": {12: "sampling equipment by picture — plankton net (" + PIC + ")", 13: "macroinvertebrate ID by picture — Dobsonfly larva (" + PIC + ")", 14: "pollution tolerance of the pictured macroinvertebrate (" + PIC + ")", 16: "fish ID by picture — American Shad (" + PIC + ")", 17: "fish ID by picture — Largemouth Bass (" + PIC + ")", 19: "aquatic plant ID by picture — Water lily (" + PIC + ")"}},
    "post": {"file": T22 + "2022_SPE_MS_Aquatics_Test.txt", "form": "2022 Area 8 MS Aquatics", "source": "2022_SPE_MS_Aquatics_Test.docx",
             "drop": {10: "benthic zone on a labelled diagram (" + PIC + ")", 14: "sampling device by picture — D-net (" + PIC + ")", 15: "best use of the pictured device (" + PIC + ")", 17: "macroinvertebrate ID by picture — Pouch Snail (" + PIC + ")", 18: "fill-in chart cell (Group 2 count = 5), not multiple choice", 19: "fill-in chart cell (Group 3 count = 2), not multiple choice", 20: "biotic index rating that depends on identifying question 17’s picture"}}},
  "wildlife": {"label": "Wildlife", "emoji": "\U0001F98C",
    "pre":  {"file": CLUB + "A8_MS_Wildlife_test_2026.txt", "form": "2026 Area 8 MS Wildlife", "source": "A8_MS_Wildlife_test_2026.docx",
             "drop": {16: "ID by specimen — Red Fox pelt (" + PIC + ")", 17: "ID by specimen — Great Horned Owl mount (" + PIC + ")", 18: "ID by specimen — Coyote skull (" + PIC + ")", 19: "ID by specimen — Beaver skull (" + PIC + ")", 20: "ID by picture — White-tailed Deer print (" + PIC + ")"}},
    "post": {"file": T22 + "2022_SPE_MS_Wildlife_Test.txt", "form": "2022 Area 8 MS Wildlife", "source": "2022_SPE_MS_Wildlife_Test.docx",
             "drop": {6: "adaptation shown by two pictures (" + PIC + ")", 16: "ID by picture — Raccoon (" + PIC + ")", 17: "ID by picture — Opossum (" + PIC + ")", 18: "ID by picture — Bobcat (" + PIC + ")", 19: "ID by picture — Red fox (" + PIC + ")", 20: "ID by picture — Gray fox (" + PIC + ")"}}},
  "cei": {"label": "Current Environmental Issues", "emoji": "\U0001F4F0",
    "pre":  {"file": CLUB + "A8_MS_CEI_test_2026.txt", "form": "2026 Area 8 MS Current Environmental Issues", "source": "A8_MS_CEI_test_2026.docx", "drop": {}},
    "post": {"same_as_pre": True, "why": "no past CEI test fits the 2027 topics (tests/INDEX.md); her allowance: “the same test”"}},
}

def build_form(spec):
    toks, keys = parse(spec["file"])
    qs = assemble(toks, keys)
    items, dropped = [], []
    for n in range(1, 21):
        q = qs[n - 1] if n - 1 < len(qs) else {"q": "?", "choices": []}
        k = keys[n - 1] if n - 1 < len(keys) else {"letters": None, "cite": ""}
        if n in spec["drop"]:
            dropped.append({"n": n, "q": q["q"][:90], "why": spec["drop"][n]}); continue
        letters = k["letters"] or []
        if not letters or not q["choices"]: raise SystemExit("item %d of %s has no key or no choices" % (n, spec["file"]))
        idx = ["ABCDE".index(l) for l in letters]
        if any(i >= len(q["choices"]) for i in idx): raise SystemExit("key beyond the choices: item %d of %s" % (n, spec["file"]))
        text = re.sub(r"^Reminder: DO NOT WRITE ON TEST!\s*", "", q["q"])
        items.append({"n": n, "q": text, "choices": q["choices"], "ans": idx[0] if len(idx) == 1 else sorted(idx), "cite": k["cite"]})
    return {"form": spec["form"], "source": spec["source"], "n": len(items), "items": items, "dropped": dropped}

def main(out):
    stations = {}
    for sid, st in FORMS.items():
        rec = {"label": st["label"], "emoji": st["emoji"], "pre": build_form(st["pre"])}
        post = st["post"]
        if post.get("same_as_pre"):
            rec["post"] = dict(rec["pre"], note="the pre-test form again — " + post["why"])
        else:
            rec["post"] = build_form(post)
        stations[sid] = rec
    doc = {"version": 1, "built": datetime.date.today().isoformat(),
           "about": "NC Envirothon station check-ins (ENVTEST). pre = the real 2026 Area 8 middle-school test, post = the 2022 Area 8 MS test (CEI: the 2026 form again). Every kept question is verbatim from the source, with its answer key and cite. ans = the index of the keyed choice (0 = A); a list = a 'select all that apply' item (all must be picked). Items that need a picture, a specimen, or the Rowan County Soil Survey tables are listed under dropped.",
           "stations": stations}
    with open(out, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=1)
    for sid, r in stations.items():
        print("%-9s pre %2d kept / %d dropped   post %2d kept / %d dropped" % (sid, r["pre"]["n"], len(r["pre"]["dropped"]), r["post"]["n"], len(r["post"]["dropped"])))

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "nc_envirothon_tests.json"))
