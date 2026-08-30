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
3. `web/src/pages/shared/VideoCallPage.tsx` calls that endpoint, then wraps the raw token into a
   **kit token** — `rawToken + "#" + base64(JSON.stringify({userID, roomID, userName, appID}))` —
   before handing it to `@zegocloud/zego-uikit-prebuilt`. `ZegoUIKitPrebuilt.create()` does **not**
   accept the raw token004 string on its own; this two-part format is what its own
   `generateKitTokenForProduction()` builds (confirmed by reading the SDK's bundled source —
   `node_modules/@zegocloud/zego-uikit-prebuilt/zego-uikit-prebuilt.js`, searching for
   `"kitToken error"`, the exact message it logs when there's no `#`). Room/user metadata is
   attached client-side since it's not secret; the token itself (the part before `#`) is still
   entirely server-generated.
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
