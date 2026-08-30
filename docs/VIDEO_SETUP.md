# Video Consultation Setup (ZEGOCLOUD)

**Status: already configured** — `ZEGOCLOUD_APP_ID` and `ZEGOCLOUD_SERVER_SECRET` are already in
`web/.env.local` (from credentials the project owner already had). This doc explains how it works
and how to add them to Vercel for production.

- **Service**: ZEGOCLOUD — one-to-one video consultations between a client and a verified professional.
- **Why**: Real-time video without running our own media server.
- **Website**: https://www.zegocloud.com (console: https://console.zegocloud.com)

## How it works

1. `web/api/_lib/zegoToken.ts` implements ZEGOCLOUD's "token004" protocol server-side (ported
   from their own reference implementation, not written from memory — a byte-layout mistake here
   would silently break every call).
2. `web/api/generateVideoToken.ts` mints a token for a specific `(appointmentId, userId)` pair,
   only once the appointment is `CONFIRMED` and only within a join window (15 minutes before the
   scheduled time through 60 minutes after) — never a permanent/reusable credential.
3. `web/src/pages/shared/VideoCallPage.tsx` calls that endpoint, then hands the token to
   `@zegocloud/zego-uikit-prebuilt`, which renders the actual call UI.
4. `ZEGOCLOUD_SERVER_SECRET` never reaches the browser — only the short-lived token does.

## Adding the credentials to Vercel (production)

**WHERE**: Vercel dashboard → project → **Settings → Environment Variables**

Add, from `web/.env.local`:
```
ZEGOCLOUD_APP_ID
ZEGOCLOUD_SERVER_SECRET
```
Apply to Production (and Preview). Redeploy for it to take effect.

## Testing it

Once an appointment is `CONFIRMED` (see `RAZORPAY_SETUP.md`), open it from either the client's or
professional's Appointments page within the join window and click **Join call**. Test in two
different browser profiles (or one normal + one incognito window) signed in as the client and the
professional respectively, to see both sides of the call.
