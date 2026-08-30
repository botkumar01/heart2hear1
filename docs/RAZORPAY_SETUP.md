# Razorpay Setup (professional consultation payments)

**ACCOUNT REQUIRED: Razorpay**

- **Service**: Razorpay — payment gateway for professional consultation fees.
- **Why**: The platform never trusts a frontend "payment successful" message (spec §19) — Razorpay
  creates a server-verified order, and only a signature-verified webhook confirms an appointment.
- **Website**: https://razorpay.com
- **Cost**: Free to create an account and use **Test Mode** (fake cards, no real money) for as long
  as you like — this is what you want for development/demo. Going live later requires KYC/business
  verification, which isn't needed yet.
- **What to create**: A free Razorpay account, in **Test Mode**.
- **What credentials you need**: a Key ID + Key Secret (for creating orders), and a separate
  Webhook Secret (for verifying payment confirmations).
- **Where they go**: `web/.env.local` locally, and Vercel's environment variables in production —
  **never** in frontend code (only the Key ID, which is safe to expose, is ever sent to the
  browser, via the `createRazorpayOrder` API response).

## Step 1 — Create an account

**WHERE**: Browser → https://dashboard.razorpay.com/signup

Sign up, verify your email/phone. You'll land on the dashboard already in **Test Mode** (toggle in
the top bar) — leave it there.

## Step 2 — Get API keys

**WHERE**: Browser → Dashboard → **Settings → API Keys** (or **Account & Settings → API Keys**)

**STEPS**: Click **Generate Test Key**. Copy both the **Key Id** and **Key Secret** (the secret is
shown once).

## Step 3 — Set up the webhook

Razorpay needs to tell your app when a payment succeeds. That's `web/api/razorpayWebhook.ts`, live
at `https://heart2hear1.vercel.app/api/razorpayWebhook` once deployed.

**WHERE**: Browser → Dashboard → **Settings → Webhooks**

**STEPS**:
1. Click **Add New Webhook**.
2. **Webhook URL**: `https://heart2hear1.vercel.app/api/razorpayWebhook` (or your actual Vercel domain).
3. **Active Events**: check `payment.captured`.
4. Set a **Secret** (any strong random string you generate) — copy it, this is your
   `RAZORPAY_WEBHOOK_SECRET`.
5. Save.

## Step 4 — Add the three values

**Local (`web/.env.local`)**:
```
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

**Production**: Vercel dashboard → project → **Settings → Environment Variables** → add all
three, applied to Production (and Preview if useful). Redeploy (or push a commit) for it to take
effect.

**EXPECTED RESULT**: Booking a paid slot as a client now opens a real Razorpay checkout widget
(Test Mode). Use a Razorpay test card (any values work, e.g. card `4111 1111 1111 1111`, any
future expiry, any CVV) to simulate a successful payment — the appointment should flip to
"Confirmed" within a few seconds once the webhook fires.
