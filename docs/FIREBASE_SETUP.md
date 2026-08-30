# Firebase Setup

Firebase provides **Authentication** and **Firestore** for this project (Spark/free plan — no
card required for these two). The trusted backend that used to be Cloud Functions is now hosted
on Vercel instead — see `VERCEL_SETUP.md`. Firebase Storage is deferred until Phase 3/4 (it now
requires the paid Blaze plan, same as Cloud Functions did).

**Status for `heart2hear`**: project created, web app registered, Firestore database created,
`firestore.rules` deployed. What's confirmed done vs. still to check:

- [x] Firebase project `heart2hear` created
- [x] Web app registered, config in `web/.env.local`
- [x] Firestore database created (`asia-south1`... or whichever region you picked)
- [x] `firestore.rules` deployed
- [ ] **Confirm Email/Password sign-in is enabled** (see Step 3 below — please double check this)
- [ ] Storage — intentionally not set up yet (needs Blaze; deferred)

## Step 1 — Create the Firebase project *(done for `heart2hear`)*

**WHERE**: Browser → https://console.firebase.google.com

1. **Add project** → name it → Analytics not needed → **Create project**.

## Step 2 — Register a Web app *(done — see the "Your apps" section of Project settings)*

**WHERE**: Firebase Console → project → the **`</>`** (Web) icon → register → copy the
`firebaseConfig` values into `web/.env.local` as `VITE_FIREBASE_*` (see `web/.env.local.example`
for the exact names).

## Step 3 — Confirm Email/Password sign-in is enabled

**WHERE**: Browser → https://console.firebase.google.com/project/heart2hear/authentication/providers

**CHECK**: **Email/Password** should show as **Enabled**. If not: click it → toggle **Enable** →
**Save**.

## Step 4 — Firestore database *(done)*

**WHERE**: Browser → https://console.firebase.google.com/project/heart2hear/firestore

Already created. If you ever need to recreate it: **Create database** → pick a region close to
India → **production mode** (this repo's own `firestore.rules` govern access either way).

## Step 5 — Install the Firebase CLI and connect this repo *(done)*

Already set up: `firebase login` (as `harishff2020@gmail.com`, the account with access to this
project) and `.firebaserc` pointing at `heart2hear`.

If you ever need to redo this on a different machine:

**WHERE**: A real terminal window you open yourself (not the chat) — the Firebase CLI's browser
login flow needs a genuine interactive terminal.

**COMMAND**:
```
npm install -g firebase-tools
firebase login
```
Sign in with the Google account that has access to the `heart2hear` project, and watch that same
terminal for `✔ Success! Logged in as ...` before doing anything else.

## Step 6 — Deploy Firestore rules *(done; re-run anytime `firestore.rules` changes)*

**WHERE**: Terminal, at the repo root

**COMMAND**:
```
firebase deploy --only firestore:rules
```
or, from the repo root: `npm run deploy:rules` (also attempts Storage rules — harmless to run
even before Storage is enabled; it'll just skip that part).

**EXPECTED RESULT**: "✔ Deploy complete!"

## Storage — deferred

Enabling Storage now prompts for the Blaze (pay-as-you-go) plan, same as Cloud Functions did. We
decided to hold off rather than attach a card before it's actually needed. When Phase 3 (helper
document verification) or Phase 4 (professional KYC) arrives, we'll revisit: either upgrade to
Blaze then (free tier still covers a demo project's usage), or use a free alternative object
store instead.

## A Firebase service-account key is also needed — see `VERCEL_SETUP.md`

The Vercel-hosted backend (`web/api/*.ts`) talks to Firestore/Auth using the Firebase **Admin
SDK**, which needs a service-account key (different from the web app config above, and never
exposed to the browser). Generating and configuring that key is covered in `VERCEL_SETUP.md`.
