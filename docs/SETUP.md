# Local Setup

## Prerequisites

- Node.js 20+ (this machine has Node 24, which works fine)
- A Firebase project — see [`FIREBASE_SETUP.md`](FIREBASE_SETUP.md) (already done for `heart2hear`)
- A Vercel account — see [`VERCEL_SETUP.md`](VERCEL_SETUP.md) (hosts both the frontend and the trusted backend)
- (Windows) VS Code with its built-in terminal, set to PowerShell

## Quickstart

**WHERE**: VS Code terminal, at the repo root (`D:\h2h\heart2hear1`)

```
npm run install:all
```

`web/.env.local` should already have your Firebase web config and any secrets filled in (see
`FIREBASE_SETUP.md` / `VERCEL_SETUP.md` if starting fresh — copy `web/.env.local.example`).

**Frontend only, fastest iteration** (no `/api/*` routes — registration/login won't complete):
```
npm run dev:web
```

**Full app, including the backend** (needs `npx vercel login` + `npx vercel link` done once first — see `VERCEL_SETUP.md`):
```
npm run dev
```

**EXPECTED RESULT**: A local URL is printed. Open it — you should see the Heart2Hear landing page.
With `npm run dev` (not `dev:web`), registration and login work end-to-end.

## Running against the Firestore/Auth emulators (optional)

Testing against local emulators instead of your live project avoids burning through quota and
lets you reset data freely.

**WHERE**: two separate terminals, both at the repo root

Terminal 1:
```
firebase emulators:start
```

Terminal 2 — edit `web/.env.local`, set `VITE_USE_FIREBASE_EMULATORS=true`, then:
```
npm run dev
```

**EXPECTED RESULT**: Terminal 1 prints an Emulator UI URL (usually `http://localhost:4000`) where
you can inspect Auth users and Firestore documents created while you use the app.

## Common issues

| Symptom | Likely cause | Fix |
|---|---|---|
| Blank page, console error about Firebase config | `web/.env.local` missing or incomplete | Re-check all 6 `VITE_FIREBASE_*` values against Firebase Console → Project settings |
| Registration hangs / fails on "Creating account…" | Ran `npm run dev:web` instead of `npm run dev`, or `FIREBASE_SERVICE_ACCOUNT_KEY` is empty | Use `npm run dev` (runs `vercel dev`); check `web/.env.local` |
| `vercel: command not found` | Use `npx vercel ...` — it's a local dev dependency, not global | — |
| `firebase: command not found` | Firebase CLI not installed | `npm install -g firebase-tools` |
| A CLI login command hangs forever | It needs a real interactive terminal — the chat's `!` prefix and any captured/piped session won't complete an OAuth browser hand-off | Open a plain terminal window yourself and run the login command there |
