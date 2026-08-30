# Vercel Setup (trusted backend + hosting)

**ACCOUNT REQUIRED: Vercel**

- **Service**: Vercel — hosts `web/` (the React app) and `web/api/*.ts` (the trusted backend that
  holds every secret) together, on one free platform.
- **Why**: Firebase Cloud Functions now requires the paid Blaze plan even for near-zero usage. To
  avoid that cost, the trusted backend moved to Vercel's Hobby (free) tier instead — no card
  required, generous limits for a solo/demo project.
- **Website**: https://vercel.com
- **Cost**: Free (Hobby plan). No credit card needed to sign up or deploy.
- **What to create**: A Vercel account, signed up with the same GitHub account this repo pushes
  to (`botkumar01`) — that lets Vercel auto-deploy on every `git push` to `main`, matching how
  we're already committing after each phase.

## Step 1 — Also generate a Firebase service-account key

The backend on Vercel needs its own way to talk to Firestore/Auth — the Firebase Admin SDK,
authenticated with a **service-account key** (different from the public web app config; this one
is a real secret and must never reach the browser or git).

**WHERE**: Browser → https://console.firebase.google.com/project/heart2hear/settings/serviceaccounts/adminsdk

**STEPS**:
1. Click **Generate new private key** → confirm. A `.json` file downloads.
2. **Encode it as base64** rather than pasting the raw JSON — a multi-line JSON value with quotes
   and `\n` escapes is fragile to paste into an env var UI (this bit us once already: a raw-JSON
   paste crashed the deployed function). Base64 has no special characters, so there's nothing to
   corrupt.

   **WHERE**: Terminal, from the folder the file downloaded to

   **COMMAND** (PowerShell):
   ```
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("heart2hear-firebase-adminsdk-....json")) | Set-Clipboard
   ```
   This reads the file and copies the base64 string straight to your clipboard — nothing to
   select/trim by hand.
3. Open `web/.env.local` in this repo and paste it as the value of `FIREBASE_SERVICE_ACCOUNT_KEY`
   (replace the whole value, it should be one long line of letters/numbers, no `{`, `"`, or spaces).
4. **Delete the downloaded `.json` file** from your Downloads folder once the base64 is pasted in
   — no need for a second copy lying around outside the (gitignored) `.env.local`.

**EXPECTED RESULT**: `web/.env.local` has a `FIREBASE_SERVICE_ACCOUNT_KEY=` line followed by a long
base64 string (starts with `eyJ0eXBlIjoi...`), not empty and not containing `{`.

## Step 2 — Create your Vercel account

**WHERE**: Browser → https://vercel.com/signup

**STEPS**: Choose **Continue with GitHub**, authorize as the `botkumar01` account, skip any
team-creation prompt (use your personal account).

## Step 3 — Import the GitHub repo

**WHERE**: Browser → https://vercel.com/new

**STEPS**:
1. Find `botkumar01/heart2hear1` in the list (authorize Vercel's GitHub App to see it if asked) → **Import**.
2. **Root Directory**: click **Edit** next to it and set it to `web` — this repo keeps the actual
   app inside `web/`, and Vercel needs to know that's where to build from.
3. Framework Preset should auto-detect as **Vite**. Leave build/output settings on their
   defaults.
4. **Don't click Deploy yet** — add the environment variables first (next step), otherwise the
   first build will fail on a missing `FIREBASE_SERVICE_ACCOUNT_KEY`.

## Step 4 — Add environment variables

**WHERE**: Same import screen (or later: Project → Settings → Environment Variables)

Add every value from `web/.env.local` (the real one, not the `.example`) — both the `VITE_*` ones
(needed at build time for the frontend) and the server-only ones (`FIREBASE_SERVICE_ACCOUNT_KEY`,
`GEMINI_API_KEY`, `ZEGOCLOUD_*`, `RESEND_API_KEY`). Apply each to all three environments
(Production, Preview, Development) unless you have a reason not to.

**EXPECTED RESULT**: The environment variables list shows every name from
`web/.env.local.example`, each with a value set.

## Step 5 — Deploy

**WHERE**: Same screen

**STEPS**: Click **Deploy**. Wait for the build to finish.

**EXPECTED RESULT**: A `https://heart2hear1-....vercel.app` URL is shown, and opening it shows the
Heart2Hear landing page. Registration should now fully work end-to-end (it calls
`/api/completeRegistration`, which is live).

From now on, every `git push` to `main` triggers a new deployment automatically — no extra step
needed after future phases.

## Local development (testing `web/api/*.ts` on your own machine)

The Vercel CLI is already installed as a dev dependency (`web/package.json`), but it needs its
own one-time login, and — like `firebase login` — that **must** run in a real terminal window you
opened yourself, not through the chat (the browser hand-off doesn't complete otherwise).

**WHERE**: A terminal window you open yourself, at `web/`

**COMMAND**:
```
cd web
npx vercel login
```
Sign in the same way as Step 2, and watch that terminal for a success message before continuing.

**COMMAND**:
```
npx vercel link
```
Answer the prompts: link to the existing project you just created (search for `heart2hear1` or
whatever it was named), scope = your personal account.

**EXPECTED RESULT**: A `.vercel/` folder appears in `web/` (already gitignored).

Then, any time you want to develop with working API routes locally:

**WHERE**: Terminal, at the repo root

**COMMAND**:
```
npm run dev
```
(this runs `vercel dev` inside `web/`, reading `web/.env.local` automatically)

**EXPECTED RESULT**: A local URL is printed (usually `http://localhost:3000`). The full app,
including `/api/*` routes, works there — this is the command to use once you're testing
registration/login end-to-end, instead of the plain `npm run dev:web`.
