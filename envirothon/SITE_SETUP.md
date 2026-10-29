# 🌿 The Envirothon site — what Adrienne does once, when the Firebase project exists (ENVSITE, 2026-10-28)

The code is in `index.html` (blocks `ENVSITE` and `ENVCONSOLE`, right after `ENVMIRROR`) and ships to the class as the
stripped build (`envirothon/build/`, output `envirothon/dist/`). Nothing below has been checked against a real project —
there is none yet. **See the page first:** double-click `envirothon/DEMO_site.html` (no project, no network; sample data;
nothing is saved). Then, when you are ready:

## 1. The Firebase project (≈ 20 minutes)
1. Firebase console → **Add project** (suggested id `howe-envirothon`; the id becomes part of every family's instance name,
   so pick it once). **Blaze** with a budget alert at $5 (your decision 8.1; expected ≈ $0). No Storage bucket.
2. **Authentication → Sign-in method → Email/Password → Enable.** (Nothing else: no Google, no anonymous.)
   Also under Authentication → Settings → **User actions: turn OFF "Email enumeration protection"** is NOT needed — leave defaults.
3. **Realtime Database → Create database** (us-central1, locked mode). This is the DEFAULT instance: roster, logins,
   releases, scores, teacher cards, boards. **Rules** → paste the `rules` object from `envirothon/SITE_RULES.json`.
4. **Project settings → Your apps → Add web app** → copy the config (apiKey, authDomain, databaseURL, projectId, appId).
5. **Your own login**: Authentication → Add user → the Howe family email + a password (your decision 8.2). Copy its **uid**.
   Realtime Database → Data → add `admins/<that uid>: true` by hand (the only record you ever type into the data tab).
6. Also by hand, once: `settings/edition: "envirothon"` on the default instance (the lock's record there), and
   `release/locked: {locked:false, at:<now ms>, by:"<your uid>"}` (or leave it absent — absent = open until 2027-04-24).

## 2. The host site (the class's web address)
The build README names the host repo **`howe-academy-micro`** — confirm the name you want (it becomes the address
`https://adrienne-debug.github.io/<repo>/`). Make it the DeWalt way, but push **`envirothon/dist/`**, never the readable file:
- its `family-config.js` is the Envirothon site's own (not Howe's):
  ```js
  window.HA_FAMILY = {
    familyId: "envirothon",            // the site's id (each family's own id comes from their login record)
    familyName: "Envirothon",
    edition: "envirothon",             // ← THE switch: this is what turns the site on (ENVSITE envEdition)
    className: "MS Science 2026-27",   // the © line: "licensed to <className> for the 2026-27 season"
    firebase: { apiKey:"…", authDomain:"…", databaseURL:"https://<projectId>-default-rtdb.firebaseio.com", projectId:"<projectId>", appId:"…" },
    envirothon: { firebase: { …the same config… } },   // the mirror block publishes each family's summary into this same project
    roster: [{id:"student", name:"Student", color:"#2d6a4f", badge:"#dcfce7", schoolAge:true}]   // never shown; a kid's real name comes from the family instance
  };
  ```
- build: `cd envirothon/build && npm ci && node --max-old-space-size=8192 build_envirothon.js`, copy `envirothon/dist/*`
  into the host repo, replace its `family-config.js` with the one above, push, enable Pages.
- `envirothon.js` and `envirothon/pics/` must be beside `index.html` on the host too (the cards and the ID pictures).
- Later (not now): **App Check** with a reCAPTCHA v3 key tied to the host domain; `domainLock` in `strip_list.json`.

## 3. The teacher
1. Authentication → Add user → the teacher's email + a temporary password; tell her to use "Forgot the password" on the
   sign-in card to set her own. Copy her uid.
2. Sign in to the site as yourself → **🔑 Admin** → **+ Class** (id like `ms-science-2026`, the class name, her uid) →
   **+ Teacher** (her uid, her name). That writes `classes/<cid>`, `teachers/<uid>`, `classes/<cid>/teacher`.
3. She signs in → Roster → **+ Student** for each family (first name, last initial, parent email). The site creates the parent
   user (a password-reset email goes to the parent), the student user (a code on a printable card), and the records:
   `logins/<uidP>`, `logins/<uidK>`, `students/<sid>/{meta,class,app,logins}`, `classes/<cid>/students/<sid>`.
   **Lincoln**: Roster → "+ A student who already has Howe Academy at home" with the sid `howe_lincoln` (his row then fills
   from the Howe mirror, marked "Howe app"). Howe's `family-config.js` gets the `envirothon` block from
   `envirothon/MIRROR_SETUP.md` with this project's config and `classId`; his `logins/<your Howe uid in this project>` =
   `{role:"parent", familyId:"howe", kid:"lincoln", cid}` so the mirror's writes pass the rules (you are the Howe family here).

## 4. Each family's instance (you, ≈ 5 minutes per family — the console shows you exactly what to paste)
A family's study lives in its OWN database instance inside the project, named **`<projectId>-<familyId>`** (the site derives
the URL from the family id in the login record: `https://<projectId>-<familyId>.firebaseio.com`; `envirothon.familyDbPattern`
in the host config overrides the pattern if the console names instances differently).
1. Realtime Database → **Create database** → name `<projectId>-<familyId>` (the Admin ▸ Families row shows the name), us-central1.
2. **Rules** → paste the `family.rules` object from `envirothon/SITE_RULES.json`.
3. **Import JSON** → the seed the Admin ▸ Families row shows for that student ("seed JSON"): `allowed/{uidP, uidK}` (the two
   logins the teacher created), `settings/edition`, `settings/family` (one kid), `settings/pages`, a random `settings/pin`,
   `settings/envirothon` (classId, sid, kid, unit). Never `config/anthropic_key`.
4. Done. The first time either login opens the page, the app enrolls the kid in the unit by itself, every deck held
   (your decision 8.4); the teacher's Send out opens stations; stars and the mirror run from there.

## 5. What a login sees
| login | opens | from |
|---|---|---|
| kid (code) | Study · Games · Scores · Team · Star Store (closed) · Tips · ⚙️ | the family instance + `boards/<cid>` |
| parent | How <kid> is doing · Team · Tips · ⚙️ (PIN, colour, sign out) | the same |
| teacher | Class grid · Roster · Send out · Who is strong where · Teacher cards · Boards · Who drills · 🏫 Class setup · ⚙️ Class settings | the default instance |
| you (admin) | everything the teacher sees for every class + Master lock · Classes · Teachers · Families | the default instance |

**Open the final** (2026-10-28): a station's final opens by itself once the kid has learned every core card; the teacher (or you)
can open it sooner — the student page's "📝 Open the final · <station>" (one student) or Send out's "📝 Open the final" (whole class
or picked students). It writes `release/<cid>/final/all/<station>` or `release/<cid>/final/students/<sid>/<station>` =
`{date, ts, by}` (covered by the `release/<cid>` rules; `final` validates the shape); each family's app copies it to its own
`mastery/<kid>_tests/<station>/postOpen` — the teacher still never touches a family instance. There is no Undo for a final.

**⚙️ Class settings** (2026-10-28): the teacher's (and your) "⚙️ Class settings" chip sets how the class studies — New cards a
day, Cards a sitting, How cards are learned, Passes, Decks at once, and under Advanced the mix-in / hand-off levels and the drill
ladder and limits — saved at `classes/<cid>/settings/{study,drill}`; a student page's "⚙️ Settings for this student" overrides one
student at `students/<sid>/settings/{study,drill}`. As admin you see a 🔒 Lock on each setting (`settings/locks/<name>`): the teacher
then sees it greyed, "set by Adrienne". A kid's app reads the class's and its own settings once when it opens and uses them in
memory; nothing is written into the family instance. Lincoln's Howe app keeps your own settings.

**🧭 Where new cards come from** (2026-10-29): in ⚙️ Class settings (and on the 📅 Pace bar, every choice's effect side by side) the
teacher picks how New cards a day are shared once more than one section is open — Deck by deck (as now; nothing saved) · Newest +
catch-up (default 30 %, 0–50) · Newest only · A little of everything · Teacher's mix (a % per section). Saved at
`classes/<cid>/settings/study/{newFrom, catchUp, mix/<section>}`; your 🔒 `settings/locks/newFrom` greys it for the teacher, and the
rules check each value's shape. The kid's app works the split out in memory each sitting; nothing goes into the family instance, and
Lincoln's Howe app is untouched.

**🏫 Class setup** (2026-10-28): the teacher's (and your) "🏫 Class setup" chip sets the class's **look** — the title under
"Howe Academy" on every bar, its emoji and the bar color (42 swatches or any color; the words turn black or white by themselves so
they stay readable) — with a live preview of the student's and the parent's bar; kids and parents see it and can't change it. The
same screen holds the season, the first study day, the goal dates (and which one the pace aims at), the study days and days off, and
the class's own words and optional features. Each card's Save is one update at `classes/<cid>`; the rules let the teacher write only
those fields (title, emoji and color are refused while `classes/<cid>/locks/brand` is true). The class's **name** and **when it
closes** (`lockAt`) are yours: set them in the same screen as admin, or in Admin ▸ + Class (which also takes the title, season, start,
a goal date and the closing date).

**🔒 Your locks, per class** (2026-10-29): as admin, 🏫 Class setup opens with **🔒 Locks for the teacher**, one switch for each of
`classes/<cid>/locks/{brand, units, cards, tests, plan}` (📚 Cards, 📝 Tests, 📅 Pace and 📦 Units each carry their own switch too).
Each tap is one update of `classes/<cid>/locks`, with `locks/byName` = your display name, so the teacher reads "🔒 Set by <your
name>". She still sees everything; a locked part is greyed or its edit buttons don't show, and the rules refuse her write: the look
(title, emoji, color), `classCards/<cid>` (cards), `classTests/<cid>` (tests) and `classes/<cid>/plan` (plan). Units were already
yours only. Your own changes always go through.

**📦 Units** (2026-10-28): a class studies the **units attached to it**, and their sections become the class's sections (for NC
Envirothon, the six stations exactly as before). Your console's **📦 Units** chip lists every unit with its sections, cards and core
cards, the classes using it, and **Publish**, which writes the unit's catalog entry to `units/<id>/index` (admin only; every login may
read it). In **🏫 Class setup ▸ 📦 Units** you attach or detach a unit (`classes/<cid>/units/<id>: true | false`, one update); the
teacher sees the list but can't change it. **+ Class** ticks the units to attach. A class with no units record studies NC Envirothon.
Detaching hides the unit's sections; it deletes nothing. A family's first boot enrolls the kid in every attached unit (a unit
attached later is enrolled at the next paint). New units come through the repo: `units/<id>/unit.json` + `tests.json`, then
`node units/build/compile_unit.js <id>` (it checks every rule and writes the counts), a PR, your merge, then Publish.

**📋 The section plan** (2026-10-28, class platform PR 7): **🏫 Class setup ▸ Station plan** (the class's own word for a section)
sets, per section, when its final opens by itself (**85 % of the core cards learned** unless changed; "every card" never fired,
because a miss sends a card back down), the pass mark (80 %), the wait before trying again (24 h), when a card counts as learned
(every 2 weeks), and whether the section starts with its check-in. Save writes only the changed fields, one update at
`classes/<cid>/plan/<section>/<field>`; the rules let the class's teacher write `plan` and check each field's shape. The teacher's
"Open the final" still opens it early. Lincoln's own final in Howe keeps "every core card" until L1.

**📝 The tests** (2026-10-29, class platform PR 11): **📝 Tests** in the teacher's and your console shows every check-in and final
question, folded (station → check-in / final → the question; tap one for its choices, ✓ answer, cite and the cards that cover it).
✏️ Edit (incl. "Select all that apply"), 🙈 Remove / ↩ Put back, ↑ ↓ and ＋ Add a question change the form **for that class only**:
one update at `classTests/<cid>/<section>/<pre|post>` (the item or the order, and `ver`), never the unit. Students who already took the
form keep their score; each new attempt saves `ans` (the answers by question id) and `formVer`, so results split by version. The kid's
and parent's app reads `classTests/<cid>` once at boot. "Left out of the form" (needs a picture or a handout) is read-only. CEI's final is
the check-in's form, so it is edited under the check-in. The rules let the class's teacher (and you) write it and check the shapes.
Lincoln's check-ins in Howe stay the unit's until L2.
**🧩 Skills** (2026-10-29, class platform PR 25): a unit can list skills next to its decks (a worksheet, a chart, a table …). The
student practices each in three stages (a worked example, then finishing the last steps, then alone); learned = 4 of the last 5
solo tries right, on 2 days. A sitting saves once, in the family's own instance (`mastery/<kid>_skills/…` + the day's study log).
**🏫 Class setup ▸ 🧩 Skills** hides a skill or makes it optional for the class (`classSkills/<cid>/<skill>`, the class's teacher or
an admin; the class's logins read it) and sets "the final waits for the core skills too" (`classes/<cid>/plan/<section>/skillsForFinal`,
off unless ticked). Publish the rules file again so the `classSkills` node is live.
**⏱️ Team mocks** (2026-10-29, class platform, research §4.12): with **🏫 Class setup ▸ ⏱️ Mock run** ticked, the console's
**⏱️ Mock** starts a timed run for one team on one device: who is here, the captain (breaks ties), the section, the class's own
check-in or final form (her 📝 Tests edits included) and the time (25 min). The team hands in one shared sheet; it sees its score
and which numbers it missed, never the answers. One write per run at `teams/<cid>/<team>/mocks/m<ts>`; the results by team and
question by question sit under the start card, and 🖨 prints the paper version (form, answer sheet, key). Only the class's teacher
and you read or write `teams/<cid>`. Publish the rules file again so the `teams` node is live.


**Master lock**: Admin → "Close the season now" writes `release/locked = {locked:true, at, by}`; every family and the teacher
then land on the "season closed" card; nothing is deleted. It also closes **by itself after 2027-04-24** (State), or after the class's own closing date (`classes/<cid>/lockAt`) when you set one. To reopen
for the next season, "Reopen the season" after that date writes `{locked:false, at:<then>}`, which the page honours.

## 6. Still yours to write / decide
- the six tips lines + the contact line (`ENVS_TIPS`, `ENVS_CONTACT` in the ENVSITE block — marked PLACEHOLDER on the card);
- the teacher's agreement text (the © line on the card reads "© 2026 Howe Academy · licensed to <className> for the 2026-27 season · not for redistribution");
- the host repo name; the project id; App Check (later).
