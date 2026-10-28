#!/usr/bin/env python3
"""
ENVPICS — shrink the ID Flash pictures into the repo (step 6 of the Envirothon plan, 2026-10-27).

  python3 -I envirothon/build_pics.py [source-folder] [--pillow DIR]      (default ~/Desktop/Envirothon/pics;
                                                        --pillow adds a folder holding Pillow to sys.path, since -I ignores PYTHONPATH)

Reads the source folder's pics_index.json (treated as data: nothing in it is executed), keeps only pictures whose
licence is free to reuse (CC BY / CC BY-SA / CC0 / public domain), and writes a small web copy of each one to
    envirothon/pics/<deck>/<item-slug>/<n>.jpg         (longest side MAX_SIDE px, JPEG quality QUALITY, no metadata,
                                                        aspect kept; <deck> = forestry_id | wildlife_id | aquatic_id)
plus
    envirothon/pics/index.json   = { "<card name exactly as in nc_envirothon_unit.json>": [ {url, credit, shot}, … ] }
    envirothon/pics/CREDITS.md   = every picture's author, licence and source link, and what was left out and why.

Pictures are per ITEM (species / tool) and shared by every card of that item, so the index repeats an item's list under
each of its card names (the app looks a card up by name; gzip on GitHub Pages makes the repetition nearly free).
The build is idempotent: rerun it and every output is rewritten from the source. Needs Pillow
(`python3 -m pip install --user pillow`); without it the script says so and writes nothing.
"""
import json, os, re, sys, io

MAX_SIDE = 600      # px, longest side — a drill card shows ≈330 px and a full-screen flash ≈600 px; 1200 px would be 60 MB
QUALITY = 70        # JPEG quality; with MAX_SIDE this lands the 361 free pictures near 15 MB (target: well under 20 MB)
FREE = re.compile(r"^(CC BY(-SA)?( \d(\.\d)?( [a-z]{2})?)?|CC0( 1\.0)?|Public domain)$", re.I)

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "pics")
ARGS = sys.argv[1:]
if "--pillow" in ARGS:
    i = ARGS.index("--pillow"); sys.path.insert(0, ARGS[i + 1]); del ARGS[i:i + 2]
SRC = ARGS[0] if ARGS else os.path.expanduser("~/Desktop/Envirothon/pics")
DECK_DIR = {"Forestry · ID": "forestry_id", "Wildlife · ID": "wildlife_id", "Aquatic Ecology · ID": "aquatic_id"}


def main():
    try:
        from PIL import Image, ImageOps
    except ImportError:
        print("Pillow is not installed: python3 -m pip install --user pillow   (nothing written)")
        return 2
    with open(os.path.join(SRC, "pics_index.json"), "r", encoding="utf-8") as f:
        src = json.load(f)
    cards = src.get("cards") or {}
    if not isinstance(cards, dict) or not cards:
        print("no cards in pics_index.json"); return 2

    # Group the source pictures by item; every card of an item lists the same pictures.
    items = {}          # (deck, item) -> {"slug", "pics": [src picture dicts]}
    card_item = {}      # card name -> (deck, item)
    for name, rec in cards.items():
        if not isinstance(rec, dict) or not isinstance(rec.get("pictures"), list):
            continue
        deck, item = str(rec.get("deck", "")), str(rec.get("item", ""))
        if deck not in DECK_DIR:
            continue
        key = (deck, item)
        card_item[name] = key
        if key not in items:
            pics = [p for p in rec["pictures"] if isinstance(p, dict) and isinstance(p.get("file"), str)]
            pics.sort(key=lambda p: p["file"])
            slug = pics[0]["file"].split("/")[1] if pics and len(pics[0]["file"].split("/")) == 3 else re.sub(r"[^a-z0-9]+", "_", item.lower()).strip("_")
            items[key] = {"slug": slug, "pics": pics}

    index = {}
    credits = []        # (deck, item, n, author, licence, source_url, shot)
    left_out = []       # (deck, item, file, licence, note)
    total_bytes = 0; n_files = 0; per_deck = {}
    for (deck, item), it in sorted(items.items()):
        ddir = DECK_DIR[deck]
        folder = os.path.join(OUT, ddir, it["slug"])
        os.makedirs(folder, exist_ok=True)
        # clear stale numbered copies so a rerun never leaves extras behind
        for old in os.listdir(folder):
            if re.fullmatch(r"\d+\.jpg", old):
                os.remove(os.path.join(folder, old))
        out_list = []
        n = 0
        for p in it["pics"]:
            lic = str(p.get("license", "")).strip()
            note = str(p.get("note", ""))
            parts = [x.strip() for x in note.split(";")]
            shot = parts[0] if parts and parts[0] else "photo"
            if not FREE.match(lic):
                left_out.append((deck, item, p["file"], lic, note[:160]))
                continue
            srcfile = os.path.normpath(os.path.join(SRC, p["file"]))
            if not srcfile.startswith(os.path.normpath(SRC) + os.sep) or not os.path.isfile(srcfile):
                left_out.append((deck, item, p["file"], lic, "file missing or outside the source folder"))
                continue
            n += 1
            im = Image.open(srcfile)
            im = ImageOps.exif_transpose(im).convert("RGB")
            im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
            buf = io.BytesIO()
            im.save(buf, "JPEG", quality=QUALITY, optimize=True, progressive=True)   # no exif / icc → metadata stripped
            data = buf.getvalue()
            rel = "envirothon/pics/%s/%s/%d.jpg" % (ddir, it["slug"], n)
            with open(os.path.join(folder, "%d.jpg" % n), "wb") as f:
                f.write(data)
            total_bytes += len(data); n_files += 1; per_deck[deck] = per_deck.get(deck, 0) + 1
            provider = parts[1] if len(parts) > 1 else ""
            author = str(p.get("author", "")).strip() or "unknown"
            credit = " · ".join(x for x in [author, provider, lic] if x)
            out_list.append({"url": rel, "credit": credit, "shot": shot})
            credits.append((deck, item, rel, author, lic, str(p.get("source_url", "")), shot))
        it["out"] = out_list

    for name, key in sorted(card_item.items()):
        index[name] = items[key]["out"]
    with open(os.path.join(OUT, "index.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, separators=(",", ":"), sort_keys=True)

    short = [(d, i, len(it["out"])) for (d, i), it in sorted(items.items()) if len(it["out"]) < 3]
    md = ["# ID Flash pictures — credits", "",
          "Built by `envirothon/build_pics.py` from `~/Desktop/Envirothon/pics/pics_index.json`. %d pictures, %.1f MB, longest side %d px, JPEG quality %d, metadata stripped. Pictures are per item (species / tool) and shared by every card of that item." % (n_files, total_bytes / 1048576, MAX_SIDE, QUALITY), ""]
    for deck in DECK_DIR:
        md += ["## %s — %d pictures" % (deck, per_deck.get(deck, 0)), "", "| picture | item | shot | author | licence | source |", "|---|---|---|---|---|---|"]
        for (d, item, rel, author, lic, url, shot) in credits:
            if d == deck:
                md.append("| %s | %s | %s | %s | %s | %s |" % (rel.replace("envirothon/pics/", ""), item, shot, author.replace("|", "/"), lic, ("[link](%s)" % url) if url else ""))
        md.append("")
    md += ["## Left out — not shown to be free to reuse (%d)" % len(left_out), "",
           "These are the pictures extracted from the official NCWRC species profiles. Their licence line reads \"rights per credit line, educational use\" and the credit lines name individual photographers, so they are not free to republish on a public site. They stay in the Desktop folder; Adrienne can add any she has rights to by hand.", "",
           "| deck | item | source file | licence |", "|---|---|---|---|"]
    for (d, item, file, lic, note) in left_out:
        md.append("| %s | %s | %s | %s |" % (d, item, file, lic))
    md += ["", "## Items under three pictures after the cut (%d)" % len(short), ""]
    md += ["- %s · %s — %d picture%s" % (d, i, n, "" if n == 1 else "s") for (d, i, n) in short] or ["- none"]
    md.append("")
    with open(os.path.join(OUT, "CREDITS.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(md))

    print("wrote %d pictures, %.1f MB, into %s" % (n_files, total_bytes / 1048576, OUT))
    for deck in DECK_DIR:
        print("  %-22s %d" % (deck, per_deck.get(deck, 0)))
    print("  cards in index: %d, items: %d, left out: %d, items under 3: %s" % (len(index), len(items), len(left_out), short or "none"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
