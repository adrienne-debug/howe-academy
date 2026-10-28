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
| teacher | Class grid · Roster · Send out · Who is strong where · Teacher cards · Boards · Who drills | the default instance |
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

**Master lock**: Admin → "Close the season now" writes `release/locked = {locked:true, at, by}`; every family and the teacher
then land on the "season closed" card; nothing is deleted. It also closes **by itself after 2027-04-24** (State). To reopen
for the next season, "Reopen the season" after that date writes `{locked:false, at:<then>}`, which the page honours.

## 6. Still yours to write / decide
- the six tips lines + the contact line (`ENVS_TIPS`, `ENVS_CONTACT` in the ENVSITE block — marked PLACEHOLDER on the card);
- the teacher's agreement text (the © line on the card reads "© 2026 Howe Academy · licensed to <className> for the 2026-27 season · not for redistribution");
- the host repo name; the project id; App Check (later).
