# ENVBUILD — the Envirothon edition's protected build

The Envirothon site gets a **stripped, minified and lightly obfuscated** copy of Howe Academy. The readable
`index.html` in this repo is never changed: this folder *reads* it and *writes* `envirothon/dist/`, which is
what gets pushed to the host repo (`howe-academy-micro`) by hand. Design: `DESIGN_envirothon_code_protection_2026-10-27.md` §5;
the doors it closes come from `DESIGN_envirothon_micro_academy_2026-10-27.md` §2.

Plainly: this raises the bar against casual copying (View Source shows one long line of `_0x…` names and no
comments, with the scheduler, Mom loop, chores, laundry, meals, grocery and builder code simply not there). It does
not stop a determined programmer; nothing short of a server rewrite does.

## Run it

```bash
cd envirothon/build
npm ci                      # once; pins terser 5.51.2, javascript-obfuscator 5.9.0, acorn (git-ignored node_modules)
node --max-old-space-size=8192 build_envirothon.js
```

About 16 seconds. It prints the before/after byte sizes, the blocks stripped, any listed block it had to keep, and
writes `envirothon/dist/`. Tonight's numbers (2026-10-27, commit 736f1b4):

| stage | bytes |
|---|---|
| `index.html` before | 6,196,507 |
| big script after the strip | 4,168,692 |
| after terser | 2,781,982 |
| after the obfuscator (string array at 0.25) | 4,452,396 |
| `index.html` after | 4,608,941 (74 % of before) |

The string array is what grows the file back (every string becomes a lookup call): at threshold 0.5 the page is
4.83 MB, with `stringArray:false` it would be about 2.9 MB. The knob is `obfuscator.stringArrayThreshold` in
`strip_list.json`; 0.25 is the pick for the class device.

| file | what |
|---|---|
| `index.html` | the built page (head HTML as-is, the big script stripped → terser → obfuscator, tail as-is), with a build banner and the copyright line |
| `BUILD_REPORT.md` | sizes, stripped vs kept, every dangling reference and who calls it, the reserved names |
| `family-config.js`, `sw.js`, `vendor-firebase-*.js` (4) | copied unchanged |

`envirothon/dist/` and `envirothon/build/node_modules/` are git-ignored (`envirothon/.gitignore`).

Options: `--out <dir>` (default `envirothon/dist`), `--src <index.html>`, `--no-obfuscate` (terser only; readable
stack traces for debugging), `--no-minify`, `--quiet`, and `--force-dryrun` (verification only, below).

## What it does

1. **Split** `index.html` into head HTML / the one big `<script>` / tail HTML (the largest `<script>` pair).
2. **Strip** every `// NAME_START … // NAME_END` block named in `strip_list.json` → `strip`. A marker counts only as a
   whole line, and only when the name has exactly one START and one END (so `LIVINGDAY`, which has five, can never be
   stripped). Blocks nested inside a stripped block go with it and are listed in the report.
3. **Check for dangling references** (acorn). Every name the stripped blocks declared is looked for in the kept code:
   - read **at the top level** of the script → would throw at boot → the block that declared it is *kept* and the strip
     is redone (the report says "Kept although listed"). Tonight that is `FIXEDCLASS` (`fxClassRestore` runs at boot).
   - read **inside a function** → only throws if that function runs. The report lists each name with its callers, in
     two groups: *guarded* (every use sits in a `try` or behind a `typeof` test, so it never throws) and *bare*.
     The edition lock (`settings/edition`, a later PR) is what keeps the bare callers off the screen.
4. **terser**: comments and whitespace gone, locals mangled. **Top-level names are not mangled** on purpose: this app
   calls its globals by name from HTML it builds at runtime (`onclick="…"` inside template strings, ~1,400 distinct
   names) and through `window[f]`. Every such name is also passed as `reserved`, so turning `mangle.toplevel` on later
   is a one-line change that stays safe — but it is not safe today and nothing here does it.
5. **javascript-obfuscator**, light: hexadecimal identifiers, string array on (threshold in `strip_list.json` →
   `obfuscator`), NO self-defending, NO debug protection, NO control-flow flattening, NO dead-code injection, NO string
   rotation or encoding, console left alone. The heavy settings make code 15–80 % slower and freeze DevTools; the class
   device must stay fast and Adrienne must still be able to read a console. `renameGlobals` is off for the reason in 4.
   `domainLock` is `[]` until the host domain exists (then put it in `strip_list.json`; `localhost` must stay in the
   list or the verification build goes blank).
6. **Reassemble** and write; `</script` inside the built script is escaped (`<\/script`) because the obfuscator re-emits
   it raw and the HTML parser would end the script there — the build checks the page has the same number of
   `</script>` tags as the source.

## What is stripped, what is kept

`strip_list.json` is the whole truth; the headline (2026-10-27, 132 blocks, 19,716 lines):

- **Stripped**: the week generator and packer (`GWGEN`, `GWRETR`, `GWC_MATCH`, `WBREGEN`, `GWPJ`, `LID_SERVE`), re-lay
  (`REPROJ`, `PROJ`, `PLANMAT`, `EFPULL`, `MOMPEND`, `GETAHEAD`, `REVIEW`, `MINMINUTES`, `SETTIME_TODAY`, `MOMNOTTODAY`,
  `MOVETODAY`), the Curriculum Builder (`CBGEN`, `GVAUDIT`, `GVDER`, `GVIDENT`, `GVMARK`, `GRIDEND`, `GRIDPRUNE`,
  `CBTODAYNOTE`, `FALLBEHIND`, `DAILYMISS`, `FBRENDER`, lanes, `SO`, `WFEDIT`, `CAP`, `ROADMAP`, `RMX`, `RMXS`,
  `LRPLANNER`, `XLSXLAZY`), lesson map and resources (`LESSONLINK*`, `LESSONRES`, `LESSONDAY`, `EGGQUIZ`), co-op,
  family time (`FAM*`), Mom's Day (`KIDROWS2`, `MDBANNER`, `MDSMOOTH`, `STICKYSTACK`, `MYDAY_WIDGETS`, `TOGETHER`,
  `CKLOG`, `HBALERT`, `HBLIST`, `MOMNEWS`, `HELPERGIVE`, `SPOTCHECK`), notebooks (`NBANS`, `NBSPELL`, `WB_ASSIGN`,
  `FIRST_TIPS`), chores and household (`WAVE`, `LATE_CYCLE`, `GRAB_*`, `HOUSEHOLD*`, `HH_*`, `CLEANINGDAY`,
  `HOUSECARDS`, `LEVELREADY`, `KITCHEN_TAB`, `KITCHEN_ASK`, `CHOREUNDO`, `RLWIN`), laundry (`HH_LAUNDRY` with the
  whole laundry line inside it, `LAUNDRY_*`, `KIDLAUNDRY`, `WASHTODAY`, `QUICKLOADS`, `LAUNDRYUNDO`, `LAUNDRYEDIT`,
  `BREAK_LAUNDRY`, `MOMSCHED_LAUNDRY`, `MEALPREP_BLOCK`), meals/kitchen/grocery (`GROCERY_LIST`, `GROSYNC`, `KIT*`,
  `RECIPE_PHOTO_*`), Purchases (`PURCHASES`, the esa.js loader) and Editor in Chief (`EIC`, the eic.js loader),
  the one-time picture tools (`PICMOVE`, `PICSWITCH`).
- **Kept although listed** (the build decided): `FIXEDCLASS` (boot reads `fxClassRestore`).
- **Kept after the boot test** (moved to `keep` by hand on 2026-10-27, each with its reason in the file): `DAYSTART`
  (`renderAll → renderDayTabs → getActiveTasks → dsRetime`), `KIDBAR` (`renderSkylight → slDotHTML`), `MOMLOOP`
  (`mlQueueLay` lays every card list and `renderMomLoopCard` sits in Settings, which stays open), `MEALS` (routine
  paint helpers).
- **Kept on purpose**: everything the sneak peek needs — `STARTER_UNITS` (the micro academy enrolls itself with
  `starterUnitAdd("nc_envirothon")`), `UNIT_STAGES`, `UNITATTACH`, the whole study/mastery engine, games, sprints,
  check-ups, Scores, TTS, Kids' Corner, `AUTH_GATE`, spins and stars, `LID`, `WKB`, `ONECAL`.
- **Not strippable by marker**: most of the big features are older than the marker convention. `renderKitchen`,
  `renderGrocery`'s callers, `renderChorePlan`, `renderNotebook`, `renderMomsDay`, `renderDadsDay`, `renderSitter`,
  `renderHistory`, `generateWeek`, `cbUnitAdd`, the play.js loader and the notebooks.js loader have no
  `// NAME_START` block, so they are still in the build (minified and obfuscated). Closing them is the edition lock's
  job; removing them is a later, larger cut that needs its own markers.

Adding a block: put its name in `strip` with its door and why, run the build, read the "Kept although listed" and
"Dangling references" sections of `BUILD_REPORT.md`, then do the boot check below. `node test_env_build.js` (repo
root) fails if a listed name is not exactly one START/END pair.

## ENVSITE (2026-10-28): the site's own blocks and the demo file

`ENVSITE` and `ENVCONSOLE` (right after `ENVMIRROR` in `index.html`) are the Envirothon site itself — the role router, the
sign-in card with the © line, the master lock, the kid / parent / teacher / admin parts, and the demo. Like every `ENV*` block
they are **not** in `strip` (an unlisted block is kept), so the build carries them; `test_env_site.js` asserts no `ENV*` name is
ever stripped. The site is turned on by the HOST's `family-config.js` (`edition:"envirothon"`), never by the build: the same
`dist/index.html` boots as a plain (stripped) Howe Academy for any family file without that key — see `envirothon/SITE_SETUP.md`.

`make_demo.js` writes `envirothon/DEMO_site.html`: the readable `index.html` with an inline config (`edition:"envirothon"`,
`demo:true`), the cache-bust redirect removed and the Firebase tags pointed one folder up, so Adrienne can double-click one
file and see every part on sample data with no project and no network. Regenerate it after any change to `index.html`
(`node envirothon/build/make_demo.js`); it is committed, unlike `dist/`.

## Verify a build (never on the live site, never without dry-run)

The rules in `reference_howe_safe_app_testing`: never `preview_start` this app, never open it without `?dryrun=1`,
serve a copy whose dry-run is forced on so no URL can switch it off. The build has that switch:

```bash
cd envirothon/build
node --max-old-space-size=8192 build_envirothon.js --force-dryrun --out /tmp/envirothon-verify
python3 -m http.server 8793 --directory /tmp/envirothon-verify --bind 127.0.0.1
```

Then open `http://localhost:8793/index.html?dryrun=1` in a browser (localhost also skips the `settings/codeVersion`
publish and the cache-bust redirect). Expect: the sign-in card, `_dryRun()` → `true` in the console, and **no**
`[HA] boot paint failed` line. A `401` on one REST request is the signed-out auth probe and is normal. A
`ReferenceError: X is not defined` in a paint means a stripped block is on a kept path: find `X` in
`BUILD_REPORT.md`'s dangling list, move its block to `keep` with the reason, rebuild. Never ship a `--force-dryrun`
build (its banner says `VERIFICATION BUILD`; `test_env_build.js` checks a normal build has none).

Signed-in walk (Adrienne, with the test family's config in `dist/family-config.js`): sign-in → Units → enroll → a
study sitting → a game → Scores → ⚙️. Until the edition lock ships, the built page still shows every tab, so Mom HQ,
the Schedule and the Kitchen will throw where their code was stripped — that is expected, not a build fault.

## Tests

`node test_env_build.js` from the repo root (part of the `test_*.js` suite): the list parses, every listed marker is
one START/END pair in `index.html`, the reserved scan finds the kiosk names and `HA_FAMILY`/`HoweNotebooks`, the
dist and node_modules folders are git-ignored, and — when `envirothon/build/node_modules` is installed — the build
runs into a temp folder, the output exists, every reserved top-level function survives by name, no marker or dated
comment survives, the size dropped, `index.html` is byte-for-byte unchanged. Without node_modules the build run is
skipped with a printed note and the static checks still run.
