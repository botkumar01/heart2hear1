# Architecture

## System overview

```
                     ┌─────────────────────────────┐
  Browser  ────────► │   Vercel (web/)              │
                     │   React SPA + web/api/*.ts   │
                     │   (the only place secrets    │
                     │    live)                     │
                     └───────────┬───────────────────┘
                                 │ Admin SDK (service account)
                                 ▼
                     ┌─────────────────────────────┐
                     │ Firebase (Spark/free plan)   │
                     │  - Authentication             │
                     │  - Firestore                  │
                     └─────────────────────────────┘
                                 │
              ┌──────────────────┼──────────────────┬────────────────┐
              ▼                  ▼                  ▼                ▼
         Gemini API         Razorpay            ZEGOCLOUD        Sepolia (via
      (AI chatbot)      (payments)           (video calls)      Alchemy RPC)
```

Everything the browser talks to directly is either Firebase's public client SDK (Auth, Firestore —
governed by `firestore.rules`) or `web/api/*` (same origin, no CORS). Every third-party service
with a secret (Gemini, Razorpay, ZEGOCLOUD, Resend, the blockchain distributor wallet) is called
only from `web/api/*.ts`, never from the browser.

## Why Vercel instead of Firebase Cloud Functions

Documented in full in `HEART2HEAR_IMPLEMENTATION_PLAN.md`'s "Architecture" section — short
version: Firebase now requires the paid Blaze plan for Cloud Functions and Storage, and the
project owner asked to avoid that. Firebase Auth + Firestore stay on the free Spark plan (using
them from an external server via the Admin SDK is unaffected by the Blaze requirement); the
trusted backend moved to Vercel's free Hobby tier instead.

## Request flow: how `web/api/*.ts` is protected

1. Client calls `callApi(path, body)` (`web/src/lib/api.ts`), which attaches the current Firebase
   ID token as `Authorization: Bearer <token>`.
2. `withAuth` (`web/api/_lib/http.ts`) verifies that token server-side via the Admin SDK before the
   handler runs at all. An invalid/missing token never reaches application code.
3. The handler reads `decoded.uid` (and `decoded.role`, the custom claim) from the *verified*
   token — never from anything the client sent in the request body.
4. Firestore reads/writes inside the handler use the Admin SDK, which bypasses `firestore.rules` —
   so every authorization check that matters happens in the handler itself (ownership checks like
   `session.clientUid === decoded.uid`), not just in the rules file. The rules file is the second,
   independent layer protecting direct client-SDK reads (chat listeners, etc.), not the only layer.

## Data model

See `HEART2HEAR_IMPLEMENTATION_PLAN.md` for the full collection list and `firestore.rules` for
exactly who can read what. A few structural decisions worth calling out:

- **Subcollections over arrays**: chat messages (`supportSessions/{id}/messages`), AI conversation
  turns (`aiConversations/{uid}/messages`), and availability slots
  (`professionals/{uid}/availabilitySlots`) are all subcollections, not arrays on a parent
  document — Firestore documents have a 1MB size limit and arrays don't paginate.
- **`role` lives only as an Auth custom claim**, never as a plain Firestore field the client could
  edit — see `SECURITY.md`.
- **State machines are enforced in code, not data**: `supportSessions.status` and
  `appointments.status` only move through valid transitions because each `web/api/*.ts` endpoint
  checks the current status before writing the next one (e.g. `endSession.ts` only accepts
  `ACTIVE → COMPLETED`) — there's no separate "state machine" abstraction, the transition guards
  are inline and are what `TESTING.md` covers via the Firestore rules tests' data model.

## Frontend structure

```
web/src/
  components/       shared UI (design system in ui/, feature components at top level, admin/ subfolder)
  contexts/          AuthContext (Firebase user + decoded role claim)
  hooks/              Firestore-listener hooks (useMySessions, useMyAppointments, ...)
  lib/                firebase.ts (client SDK init), api.ts (callApi wrapper), crisisResources.ts, ...
  pages/
    client/ helper/ professional/ admin/ shared/   route-level pages, grouped by role
  routes/            ProtectedRoute (role-gated routing)
```

## Backend structure

```
web/api/
  _lib/              shared server code: firebaseAdmin, http (auth wrapper), errors, roles,
                      safety (moderation detector), safetyEvents, auditLog, rateLimit,
                      trainingContent, certificates, gemini, zegoToken, blockchain, rewards
  admin/             admin-only endpoints (role-gated via assertRole)
  *.ts               one file per endpoint, routed by Vercel to /api/<filename>
```

## Extending it

- **New endpoint**: add `web/api/yourThing.ts`, default-export `withAuth(async (req, res, decoded) => {...})`,
  validate `req.body` with `zod`, throw the typed errors from `_lib/errors.ts` for anything that
  isn't success. It's automatically routed to `/api/yourThing`.
- **New Firestore collection**: add an explicit `match` block to `firestore.rules` *before* the
  catch-all — nothing is ever implicitly open.
- **New admin action**: call `logAdminAction()` (`_lib/auditLog.ts`) so it shows up in the audit
  log viewer.
