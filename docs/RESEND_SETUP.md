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
- **Where it goes**: A `RESEND_API_KEY` environment variable read by `web/api/sendLoginNotification.ts` — **never** in frontend code, never committed.

## Step 1 — Create an account and API key

**WHERE**: Browser

1. Go to https://resend.com and sign up (email or GitHub).
2. Left sidebar → **API Keys** → **Create API Key**.
3. Name it `heart2hear`, permission **Sending access**, click **Add**.
4. Copy the key shown (starts with `re_`) — it's only shown once.

## Step 2 — (Optional but recommended) verify a sending domain

Without a verified domain, Resend only lets you send from `onboarding@resend.dev`, which is fine
for local testing but looks unprofessional and can land in spam. If you own a domain, add it under
**Domains** in the Resend dashboard and follow its DNS instructions, then update the `FROM_ADDRESS`
constant in `web/api/sendLoginNotification.ts` to use it. If you don't have a domain yet, skip
this — use `Heart2Hear <onboarding@resend.dev>` for now and revisit later.

## Step 3 — Add the key

**Local dev**: open `web/.env.local` and set `RESEND_API_KEY=re_...`. `npm run dev` (which runs
`vercel dev`) picks it up automatically.

**Production**: Vercel dashboard → your project → **Settings → Environment Variables** → add
`RESEND_API_KEY` with the same value, applied to Production (and Preview if you want). Redeploy
(or just push a commit — Vercel auto-deploys) for it to take effect.

**EXPECTED RESULT**: Logging in sends a "New sign-in to your Heart2Hear account" email. Without
this key set, `sendLoginNotification` silently no-ops (by design — a missing email integration
should never block login).
