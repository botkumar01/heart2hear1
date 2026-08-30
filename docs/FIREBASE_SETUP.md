# Firebase Setup

**ACCOUNT REQUIRED: Firebase**

- **Service**: Firebase (Google)
- **Why**: Firebase is the entire backend — authentication, database (Firestore), file storage, and
  the Cloud Functions that hold every secret (Gemini, Razorpay, ZEGOCLOUD, blockchain keys, email).
- **Website**: https://console.firebase.google.com
- **Cost**: Free to create the project and use Auth/Firestore/Storage within generous free-tier
  limits. **One important catch**: Cloud Functions (2nd generation, which this project uses)
  requires the **Blaze (pay-as-you-go)** plan even for near-zero usage — Google removed the
  functions-on-free-tier option. Blaze still has a free monthly allowance baked in; for a
  college-project/demo level of traffic you should not be charged, but you must attach a
  billing method (a card) to enable it. If you'd rather not attach a card yet, everything up
  through the frontend + Auth + Firestore (no Cloud Functions) still works — we'll flag exactly
  when we first need a real function deployed.

## Step 1 — Create the Firebase project

**WHERE**: Browser

1. Go to https://console.firebase.google.com and sign in with a Google account.
2. Click **Add project**.
3. Name it `heart2hear` (or anything you like — the name shown to you, not a technical ID).
4. You can disable Google Analytics for this project (not needed) — click **Continue**/**Create project**.
5. Wait for it to finish provisioning, then click **Continue**.

**EXPECTED RESULT**: You land on the Firebase project dashboard (an empty "Get started" screen).

## Step 2 — Register a Web app

**WHERE**: Firebase Console, inside your new project

1. On the project overview page, click the **`</>`** (Web) icon to add a web app.
2. Nickname it `heart2hear-web`. Leave "Also set up Firebase Hosting" **checked** (we'll use it later) or unchecked — either is fine, we configure Hosting via `firebase.json` regardless.
3. Click **Register app**.
4. You'll see a code block with a `firebaseConfig` object — **keep this tab open**, you'll copy values from it in Step 5.
5. Click **Continue to console**.

## Step 3 — Enable Authentication

**WHERE**: Firebase Console → left sidebar → **Build → Authentication**

1. Click **Get started**.
2. Under **Sign-in method**, click **Email/Password**, toggle it **Enabled**, click **Save**.

**EXPECTED RESULT**: "Email/Password" shows as "Enabled" in the providers list.

## Step 4 — Create Firestore and Storage

**WHERE**: Firebase Console → left sidebar

1. **Build → Firestore Database** → **Create database**.
   - Choose a location close to India, e.g. `asia-south1` (Mumbai) — this cannot be changed later.
   - Start in **production mode** (we deploy our own `firestore.rules` from this repo either way).
2. **Build → Storage** → **Get started** → keep the same location → **Done**.
   - If Storage asks you to upgrade to Blaze, that's the same billing requirement as Cloud
     Functions above; Storage itself has a free tier, the prompt is just Google bundling the
     upgrade flow.

## Step 5 — Copy your web app config into `web/.env`

**WHERE**: VS Code terminal, at the repo root

**COMMAND**:
```
copy web\.env.example web\.env
```

Then open `web/.env` in the editor and fill in the six `VITE_FIREBASE_*` values from the
`firebaseConfig` object you saw in Step 2 (Firebase Console → Project settings ⚙️ → General tab →
scroll to "Your apps" → click the web app → the config is shown there too if you closed the tab).

**EXPECTED RESULT**: `web/.env` has all six values filled in, `VITE_USE_FIREBASE_EMULATORS=false`.

> These values are safe to have in a frontend `.env` — they identify your project, they are not
> secret credentials. `web/.env` is still gitignored as a matter of good hygiene and because
> you'll eventually add local emulator toggles you don't want to commit.

## Step 6 — Install the Firebase CLI and connect this repo

**WHERE**: VS Code terminal (PowerShell), at the repo root

**COMMAND**:
```
npm install -g firebase-tools
firebase login
```

**EXPECTED RESULT**: `firebase login` opens a browser window to sign in with the same Google
account, then the terminal prints "✔ Success! Logged in as you@example.com".

**COMMAND**:
```
firebase use --add
```

**EXPECTED RESULT**: A list of your Firebase projects appears; pick `heart2hear`, then give it the
alias `default` when prompted. This creates a `.firebaserc` file in the repo root (gitignored is
not necessary for this one since it holds no secrets, but we'll leave it out of git anyway to keep
the repo project-agnostic for now).

## Step 7 — Deploy security rules (safe to do anytime, no functions needed yet)

**WHERE**: VS Code terminal, at the repo root

**COMMAND**:
```
firebase deploy --only firestore:rules,storage
```

**EXPECTED RESULT**: Terminal prints "✔ Deploy complete!". Your Firestore and Storage now enforce
`firestore.rules` / `storage.rules` from this repo instead of the Console's default.

## Step 8 — Run the frontend

**WHERE**: VS Code terminal, at the repo root

**COMMAND**:
```
npm run install:all
npm run dev:web
```

**EXPECTED RESULT**: Terminal prints a local URL (usually `http://localhost:5173`). Open it in a
browser — you should see the Heart2Hear landing page. Try **Get started** → pick a role → create an
account. If registration hangs on "Creating account…", it almost always means a Cloud Function
(`completeRegistration`) hasn't been deployed yet — see the next section.

## Deploying Cloud Functions (needed for registration to fully work)

Registration calls a Cloud Function (`completeRegistration`) to set your role securely. That
function needs to be deployed, which needs the Blaze plan from the note at the top of this doc.

**WHERE**: Firebase Console

1. Left sidebar → click the gear ⚙️ next to "Project Overview" → **Usage and billing** → **Details & settings** → **Modify plan** → choose **Blaze**.

**WHERE**: VS Code terminal, at the repo root

**COMMAND**:
```
npm run build:functions
firebase deploy --only functions
```

**EXPECTED RESULT**: Terminal lists `completeRegistration` and `sendLoginNotification` as deployed.
Registration on the running frontend now completes and lands you on your role's dashboard.

(`sendLoginNotification` will fail silently — by design, it never blocks login — until you've set
up Resend; see `docs/RESEND_SETUP.md`.)
