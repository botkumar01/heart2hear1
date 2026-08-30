# Resend Setup (login-notification & transactional email)

**ACCOUNT REQUIRED: Resend**

- **Service**: Resend (transactional email API)
- **Why**: Firebase Auth sends its own emails for signup verification and password reset, but it
  cannot send custom emails like "you just logged in from a new device." Resend sends those.
- **Website**: https://resend.com
- **Cost**: Free tier (100 emails/day, 3,000/month at time of writing) — more than enough for
  development and a demo.
- **What to create**: A free Resend account.
- **What credential you need**: An API key.
- **Where it goes**: A Cloud Functions secret, **never** in `web/` frontend code.

## Step 1 — Create an account and API key

**WHERE**: Browser

1. Go to https://resend.com and sign up (email or GitHub).
2. Left sidebar → **API Keys** → **Create API Key**.
3. Name it `heart2hear-functions`, permission **Sending access**, click **Add**.
4. Copy the key shown (starts with `re_`) — it's only shown once.

## Step 2 — (Optional but recommended) verify a sending domain

Without a verified domain, Resend only lets you send from `onboarding@resend.dev`, which is fine
for local testing but looks unprofessional and can land in spam. If you own a domain, add it under
**Domains** in the Resend dashboard and follow its DNS instructions, then update the `FROM_ADDRESS`
constant in `functions/src/notifications/sendLoginNotification.ts` to use it. If you don't have a
domain yet, skip this — use `Heart2Hear <onboarding@resend.dev>` for now and revisit later.

## Step 3 — Store the key as a Cloud Functions secret

**WHERE**: VS Code terminal, at the repo root

**COMMAND**:
```
firebase functions:secrets:set RESEND_API_KEY
```

**EXPECTED RESULT**: You're prompted to paste the key; after pasting, it prints "✔ Created a new
secret version". This stores it in Google Secret Manager — it never touches your source code or
git history.

**COMMAND** (redeploy so the function picks up the secret):
```
npm run build:functions
firebase deploy --only functions:sendLoginNotification
```

## Local development

To test `sendLoginNotification` against the emulator without hitting the real Resend API cost:

```
copy functions\.secret.local.example functions\.secret.local
```

Then edit `functions/.secret.local` and paste your real key (this file is gitignored). Running
`npm run emulators` will pick it up automatically.
