# Local Setup

## Prerequisites

- Node.js 20+ (this machine has Node 24, which works fine)
- A Firebase project — see [`FIREBASE_SETUP.md`](FIREBASE_SETUP.md) if you haven't created one yet
- (Windows) VS Code with its built-in terminal, set to PowerShell

## Quickstart

**WHERE**: VS Code terminal, at the repo root (`D:\h2h\heart2hear1`)

```
npm run install:all
copy web\.env.example web\.env
```

Fill in `web/.env` with your Firebase web app config (see `FIREBASE_SETUP.md` Step 5), then:

```
npm run dev:web
```

**EXPECTED RESULT**: A local URL is printed (e.g. `http://localhost:5173`). Open it — you should see
the Heart2Hear landing page.

## Running against the Firebase Emulator Suite (recommended while developing)

Testing against local emulators instead of your live project avoids burning through Firestore/Auth
quotas and lets you reset data freely.

**WHERE**: two separate terminals, both at the repo root

Terminal 1:
```
npm run emulators
```

Terminal 2 — edit `web/.env`, set `VITE_USE_FIREBASE_EMULATORS=true`, then:
```
npm run dev:web
```

**EXPECTED RESULT**: Terminal 1 prints an Emulator UI URL (usually `http://localhost:4000`) where you
can inspect Auth users, Firestore documents, and Storage files created while you use the app in
Terminal 2's browser tab.

## Common issues

| Symptom | Likely cause | Fix |
|---|---|---|
| Blank page, console error about Firebase config | `web/.env` missing or incomplete | Re-check all 6 `VITE_FIREBASE_*` values against Firebase Console → Project settings |
| Registration hangs on "Creating account…" | `completeRegistration` Cloud Function not deployed | See `FIREBASE_SETUP.md` → "Deploying Cloud Functions" |
| `firebase: command not found` | Firebase CLI not installed | `npm install -g firebase-tools` |
| Deploy fails asking to upgrade plan | Cloud Functions require Blaze | See `FIREBASE_SETUP.md` billing note |
