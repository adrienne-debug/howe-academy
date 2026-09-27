# Howe Academy — working rules for any Claude session (cloud or local)

This is a LIVE homeschool app used by one family every school day (four kids: Lincoln, Ellis,
Lucy, Julian; Adrienne = Mom runs it). Read this whole file before touching anything.

## The operating agreement (hard rules, not preferences)

1. **Never write to the live Firebase database.** Not by curl, not by a script, not by running
   the app. Reads are fine if you have a token (cloud sessions don't — don't try). Schedule and
   data changes happen IN THE APP, by Adrienne. If data looks wrong, find the code bug.
2. **Shipping is Adrienne's tap.** Deploy = a push to `main` (GitHub Pages serves it within
   ~60–100 s, and every family device reloads itself at its next idle moment). In a cloud session
   that means: open a pull request and stop. Never merge, never push to `main` yourself.
3. **One change per PR, described first.** Say what changes and why before writing code; only
   what was asked, nothing "while I'm here." Code that changes how the app behaves is never
   written unasked.
4. **When unsure whether something touches the live system, stop and ask.**

## The repo

- `index.html` — the whole app (~50k lines, one file). Everything lives here unless noted.
- `notebooks.js` — the kids' weekly notebooks (generateJulian/Lincoln/Ellis/Lucy).
- `eic.js` (Editor in Chief engine), `library.js` (curriculum library + TOC scans), `play.js`
  (School Room), `esa.js`, `family-config.js`, `sw.js` (service worker).
- `test_*.js` — ~145 Node tests, no framework. Run one with `node test_x.js`; run all with
  `for f in test_*.js; do node "$f" >/dev/null 2>&1 || echo "FAIL $f"; done`.
  **Known pre-existing failures: `test_cell_identity.js` and `test_derived_col.js`.** Everything
  else must pass before a PR. Every feature ships with its own `test_<feature>.js`.
- The generator/scheduler is the most sensitive code (Mom loop `MOMLOOP_*`, day start
  `DAYSTART_*`, school-end guard `SCHOOLEND_*`, re-lay `REPROJ_*`). Change it only when asked,
  and add a replay-style test (see `test_momloop_lay.js`, `test_school_end.js`).

## How features are written here (match this)

- Each feature is a marked block: `// NAME_START — <what and why, her words + date>` … `// NAME_END`,
  so tests can slice it out with `src.indexOf("// NAME_START")`. Comments cite the rule and the date
  it was given ("her rule 2026-09-23: …") and the live incident it fixes.
- **Every Firebase write is targeted** (`ref(path/id).set/update/remove`, multi-path `update`)
  — never a whole-node `set()` of tasks/checked/mastery/etc. Writes go through `db` only when
  `db && !_dryRun()` so `?dryrun=1` stays inert.
- Mom-only actions check `momHere()`; Dad's own link is `_kioskD()`; a kid's device is
  identified by the Kids' Corner selection `kcKid`.
- Points are wages: `bankDirect(kid, pts, note)` banks instantly; spins are the only pool.
- Don't use the 🔀 emoji anywhere in `index.html` (a test asserts it's absent).
- Plain, kid-safe UI text; the app never supplies what a child must produce (answers, spelling).

## Scheduling rules that shape the code (don't break these)

- The Morning Notebook comes first when a kid's day starts; a fixed-time class is the only thing
  ahead of it. Closing Notebook is last.
- No Mom-required lessons on co-op days unless Mom's "get work done later" button is pushed.
- The school day's end (Settings, default 4:15 PM) is respected; a kid's cards never stack.
- The day re-lays from NOW; a finished card shows at the time it was really finished.
- Lessons stay in sequence; re-lays follow each subject's pattern days; work that "didn't fit
  today" sweeps into the rest of the week at 8 PM.
- The day ends (celebration, afternoon chores) when everything on the kid's own timeline is
  done or sent to Mom — not counting cards that fell off the day.

## What a cloud session can and can't do

- CAN: code changes with tests, research from the web, docs. Deliver as a PR with a plain-language
  description (what changes on screen, what data it writes, tests run).
- CAN'T: read or write the family's Firebase, read Adrienne's Mac (Excel, photos, `~/.howe`),
  drive her Chrome, or verify on a real device. Say so in the PR when a change needs her eyes.

## Deploy note

A push to `main` reaches every device automatically; updates wait while a device is mid-workbook,
mid-drill or in Mastery. Adrienne prefers pushes outside school hours (10 AM–4:15 PM ET) unless a
fix is urgent.
