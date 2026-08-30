# Security

## Threat model summary and what protects against each

| Threat | Protection |
|---|---|
| XSS | React escapes all rendered content by default; no `dangerouslySetInnerHTML` anywhere in the codebase. |
| Broken access control / IDOR | Every `web/api/*.ts` endpoint re-derives the acting user from a verified Firebase ID token (`web/api/_lib/http.ts`) — never from a client-supplied ID. Ownership is checked against the actual document (`session.clientUid === decoded.uid`, etc.) before any read/write. This is the exact class of bug found in the old prototype's audit (`HEART2HEAR_AUDIT.md`) — any authenticated caller could mutate any user's data by guessing an ID. |
| Privilege escalation | `role` lives only as a Firebase Auth custom claim, set once by `completeRegistration.ts` and never re-writable by the client — `firestore.rules`' `users/{uid}` rule explicitly rejects a client `update` that touches `role`, and this is covered by an automated rules test (`docs/TESTING.md`). |
| Injection | No raw SQL (Firestore has no query-string injection surface). All request bodies are validated with `zod` schemas before use — every `web/api/*.ts` file. |
| Prompt injection (AI chat) | The Gemini system prompt (`_lib/gemini.ts`) explicitly instructs the model never to reveal or override its instructions regardless of how it's asked. User messages are never concatenated into the system prompt — they're passed as separate `user`-role turns, the standard mitigation. |
| Unsafe file uploads | Not applicable yet — file upload (Storage) is deferred (`FIREBASE_SETUP.md`) until Blaze is enabled; no upload endpoint exists to abuse. |
| Rate abuse / cost abuse | `_lib/rateLimit.ts` — a Firestore-backed fixed-window limiter, applied to the endpoints where abuse has real cost or safety impact: `aiChat` (Gemini API cost), `sendSessionMessage`, `submitReport`, `requestHelperSession`. See "Not yet done" below for its limits. |
| Brute-force login | Firebase Authentication has built-in rate limiting on sign-in attempts; not something this codebase needs to reimplement. |
| Duplicate accounts | Firebase Auth enforces unique emails per project natively. |
| Payment manipulation | `razorpayWebhook.ts` is the **only** path that ever confirms an appointment — verified via HMAC signature over the raw request body, never a frontend "payment succeeded" callback. Idempotent against duplicate webhook delivery. |
| Blockchain abuse | The distributor private key never leaves the server (`_lib/blockchain.ts`); reward eligibility (`_lib/rewards.ts`) is computed server-side before any mint is even attempted, with a per-helper daily cap. |
| Wallet/key exposure | Only a wallet **address** is ever stored (`wallets/{uid}`) — ownership proven via a signed nonce, never a private key or seed phrase collected anywhere in this codebase. |
| CORS | Not applicable — `web/api/*` and the frontend are same-origin in both `vercel dev` and production, so no CORS configuration exists to misconfigure. |
| Secrets in the frontend bundle | Every credential beyond the public Firebase web config lives in `web/api/*.ts` server code, reading `process.env` — never imported into anything under `web/src/`. |

## Firebase/Firestore specifics

- **Deny-by-default rules**: `firestore.rules` ends in a catch-all `match /{document=**} { allow read, write: if false; }` — every collection needs an explicit rule to be reachable at all.
- **Backend-only writes**: nearly every collection is written exclusively via the Admin SDK (which bypasses rules), with client rules granting read access only to the owner/participant/admin. This means the *logic* enforcing state transitions, moderation, and eligibility lives in one reviewable place (`web/api/*.ts`), not duplicated/reimplemented in rules syntax.
- **Sensitive-content minimization**: `safetyEvents` stores only a 200-character excerpt, not full conversation history (`_lib/safetyEvents.ts`), and is admin-only readable.

## Dependency hygiene

`npm audit` (all dependencies) reports ~34 findings, the large majority in `hardhat`'s and
`vercel`'s own dev-tooling trees (neither ships in the deployed bundle — `hardhat` only runs
locally for contract development, `vercel` is a CLI dev dependency).

Checked separately with `npm audit --omit=dev` (production dependencies only, i.e. what actually
deploys): **6 moderate-severity findings**, all one chain — `firebase-admin` → `@google-cloud/storage`
→ `teeny-request`/`retry-request` → `uuid` (a buffer-bounds-check issue in `uuid` v3/v5/v6). This
project doesn't call `@google-cloud/storage` directly (Storage itself is deferred, see
`FIREBASE_SETUP.md`) — it's pulled in transitively by `firebase-admin` regardless of whether
Storage is used. `npm audit fix --force` would resolve it by downgrading `firebase-admin` to
`10.3.0`, a major-version downgrade that risks breaking APIs this project relies on (Firestore v2
query methods, current Auth behavior) — not applied blindly. Re-check whether a non-breaking fix
exists (`npm audit --omit=dev`) periodically, particularly once Storage is actually enabled and
this dependency path becomes live rather than dormant.

## Deliberately deferred (documented, not implemented)

- **Firebase App Check**: would add a second layer verifying that requests originate from the real
  app (not a scripted client), via reCAPTCHA. This needs its own account/setup step (a reCAPTCHA
  site key) and meaningfully more integration work than the rate limiter above, which already
  covers the concrete cost/abuse risks identified so far. Worth adding before a genuinely public
  launch; not blocking a demo/college-project deployment. If you want it: Firebase Console → App
  Check → register the web app → add `@firebase/app-check` to `web/src/lib/firebase.ts` → enforce
  in `firestore.rules` via `request.app != null`.
- **Storage security rules**: moot until Storage itself is enabled (deferred, see
  `FIREBASE_SETUP.md`) — `storage.rules` currently denies everything.

## Reporting a vulnerability

This is a project in active development, not a production service handling real user data yet.
If you find a security issue, open it as a private conversation with the project owner rather than
a public GitHub issue until it's confirmed fixed.
