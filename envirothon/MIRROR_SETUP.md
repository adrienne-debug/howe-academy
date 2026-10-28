# 🌿 Envirothon mirror (ENVMIRROR) — what Adrienne sets up, once

The code in `index.html` (block `ENVMIRROR`, after `NUDGE_ROLLUP_END`) does nothing at all until the
`envirothon` block below is in `family-config.js`. Until then every family's boot is exactly as before.
Nothing here was checked against a real project: the Envirothon Firebase project does not exist yet.

## 1. The `envirothon` block for `family-config.js`

Paste it inside `window.HA_FAMILY = { … }`, after the `roster` list (add a comma after the roster's `]`).
Every value comes from the Envirothon project's Firebase console → Project settings → Your apps → Web app → "Config".

```js
  envirothon: {
    // the ENVIROTHON project's public web config (an identifier, not a secret — the rules are the lock)
    firebase: {
      apiKey:            "PASTE_API_KEY",
      authDomain:        "PASTE_PROJECT_ID.firebaseapp.com",
      databaseURL:       "https://PASTE_PROJECT_ID-default-rtdb.firebaseio.com",
      projectId:         "PASTE_PROJECT_ID",
      appId:             "PASTE_APP_ID"
    },
    familyId: "howe",          // optional — the sid is <familyId>_<kid> (default: HA_FAMILY.familyId)
    classId:  "PASTE_CLASS_ID" // optional — the teacher's class; if left out the app reads students/<sid>/class once after sign-in
    // kids: ["kidId"]         // optional — mirror only these of the unit's enrolled kids (default: every enrolled kid)
  }
```

What the app does with it: boots a second, NAMED Firebase app (`"envirothon"`) after its own; signs in to it only when
Mom taps the Settings card; sends one summary per enrolled kid to `students/<sid>` (sid = `howe_<kid>`); listens to the
teacher's releases and clears the matching `cat_hold` in Howe's own database. No card text leaves except the ≤ 5 weakest
fronts per deck; no roster, schedule, points or other decks.

## 2. Database rules the mirror needs on the Envirothon project

Realtime Database → Rules. These are the parts the mirror touches; the console's own rules (teachers, classes, logins,
teacher cards, scores) are added alongside from `DESIGN_envirothon_console_2026-10-27.md` §2.2. The family's login
record is `logins/<uid> = { role:"parent", familyId:"howe", kid:"<kid>" }` (the DECISIONS block); the mirror's writes are
allowed when the signed-in login's `familyId` is the prefix of the sid it writes.

```json
{ "rules": {
  ".read": false, ".write": false,

  "admins":  { ".read": "auth != null && data.child(auth.uid).exists()", ".write": false },
  "logins":  { "$uid": { ".read": "auth != null && (auth.uid == $uid || root.child('admins/'+auth.uid).val() == true)",
                         ".write": "root.child('admins/'+auth.uid).val() == true" } },

  "students": { "$sid": {
      ".read":  "auth != null && ($sid.beginsWith(root.child('logins/'+auth.uid+'/familyId').val() + '_') || root.child('admins/'+auth.uid).val() == true || root.child('classes/'+data.child('class').val()+'/teacher').val() == auth.uid)",
      "summary": { ".write": "auth != null && ($sid.beginsWith(root.child('logins/'+auth.uid+'/familyId').val() + '_') || root.child('admins/'+auth.uid).val() == true)" },
      "meta":    { ".write": "auth != null && ($sid.beginsWith(root.child('logins/'+auth.uid+'/familyId').val() + '_') || root.child('admins/'+auth.uid).val() == true)",
                   ".validate": "newData.hasChildren(['familyId','kid','name','at']) && newData.child('familyId').isString() && newData.child('kid').isString() && newData.child('name').isString() && newData.child('name').val().length <= 40" },
      "class":   { ".write": "auth != null && (root.child('admins/'+auth.uid).val() == true || root.child('classes/'+newData.val()+'/teacher').val() == auth.uid)" } } },

  "release": {
      "locked": { ".read": "auth != null", ".write": "root.child('admins/'+auth.uid).val() == true" },
      "$cid": {
        ".read":  "auth != null",
        ".write": "auth != null && (root.child('classes/'+$cid+'/teacher').val() == auth.uid || root.child('admins/'+auth.uid).val() == true)" } }
} }
```

In words:
- the family's signed-in user writes `students/howe_<kid>/summary` and `…/meta` (one `update` on `students/<sid>`
  carrying both children — Firebase checks each child's rule), reads its own student rows, and nothing else;
- `students/<sid>/class` is set by the teacher or Adrienne, never by the family app;
- `release/<classId>/all/<deck or station>` and `release/<classId>/students/<sid>/<deck or station>` are written by the
  teacher (console) and read by every signed-in user — the mirror listens to both for each mirrored kid;
- `release/locked = true` is admin-only (Adrienne): every student app stops sending; summaries stay; nothing in Howe
  changes. Set it back to `false` (or remove it) to reopen.

A release value is anything truthy, e.g. `{ "openedAt": 1761580800000, "by": "<teacher uid>" }`. A key is a station id
(`general`, `forestry`, `soils`, `aquatics`, `wildlife`, `cei` — opens every deck of the station) or one deck key exactly
as the unit names it (`"Forestry · Terms"`, `"Soils and Land Use · ID"`, `"Current Issue · 2027"`). The mirror only ever
REMOVES a hold; taking a release away never re-holds a deck.

## 3. The two taps

1. **Paste** the block above into `family-config.js` and push it (your deploy). Create the Howe family's user in the
   Envirothon project (Authentication → Email/Password → Add user) and its `logins/<uid>` record with `familyId: "howe"`.
2. **Sign in once per device Lincoln studies on**: Settings → 🌿 Envirothon → email + password → "🌿 Envirothon: sign in".
   The status line turns to "signed in as … · last mirrored …". The password goes to the Envirothon project's auth and
   is not kept anywhere in the app; the SDK remembers the session on that device like the family login.

Then it runs by itself: a study sitting, a Mom drill or an enroll sends the summary (at most once a minute, only when
something changed); a device that boots sends whatever changed since its last publish; the teacher's send-out opens
the station here and the card shows "🌿 <deck> released by your teacher". "Send now" on the card forces a publish.

## What this build did not do

- Nothing was written to any database; no project exists to test against. The whole block ran only in the node harness
  (`test_env_mirror.js`, 103 checks: inert without the block, the exact summary record, one `update`, debounce, dry run,
  release, lock, the hooks).
- The mirror does not write the claim rows the console design mentions (`students/<sid>/uid`, `uidToSid/<uid>`): the
  DECISIONS block replaced them with `logins/<uid>`, which the teacher/Adrienne creates. If the console's final rules
  need a different claim, the write goes in this block (one `set`), not in the hooks.
- `?dryrun=1` keeps the mirror silent too: the named app opens and listens, nothing is sent, no hold is written.
