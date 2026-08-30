# Heart2Hear — Existing Project Audit

This audit covers the prior Heart2Hear prototype (`Heart2Hear-master.zip`, dated 2024‑09‑25) that this repository replaces. It exists to satisfy the "audit before building" requirement in the project brief, and to record *why* specific old decisions are not being carried forward.

## 1. Stack (old prototype)

| Layer | Tech |
|---|---|
| Frontend | Create React App, MUI v5 + Emotion, styled-components, react-router-dom v6, react-toastify, `web3` v4, `@zegocloud/zego-uikit-prebuilt` |
| Backend | Node.js + Express 4 |
| Database | MongoDB Atlas via Mongoose |
| Real-time | Socket.IO v4 |
| Auth | bcryptjs + jsonwebtoken (JWT) |

## 2. What existed and worked

- Registration / login split by role (`client` / `helper`) with a single `user` Mongoose model.
- Helper discovery, language + availability fields used for informal matching.
- One-to-one chat via Socket.IO, message persistence in a `message` collection.
- A rudimentary "coins/tokens" concept tied to ratings, meant to reward helpers.
- ZEGOCLOUD was wired in on the client for video calls; `web3` was present for a future blockchain feature.
- A presentation (`Heart-2-hear-pre final1.pdf`) documents the original concept, register→role choice→dashboard→matching→session flow, and the pastel/off-white/teal/coral visual identity.

## 3. Critical problems found (why the old backend is not reused)

1. **Leaked live database credential.** `server/server.js` hard-codes a full MongoDB Atlas connection string including a real username and password, committed to source. `server/.env` exists but is unused by the code — the connection string bypasses it entirely. This credential must be treated as burned; it should be rotated in the Atlas dashboard regardless of what we build next.
2. **No server-side authorization on mutating routes.** `updateController.js` (`updateAvailablity`, `updateToken`, `updateRating`) takes a MongoDB `_id` straight from the URL param and mutates that document — there is no JWT check anywhere in the Express app. Any client can toggle any user's availability or rewrite their tokens/coins/rating by guessing or enumerating an ID (IDOR / broken access control).
3. **Socket.IO has no authentication.** The server keeps a single global `Map<userId, socketId>` populated by a client-supplied `add-user` event with no verification that the caller is actually that user. Any socket connection can claim any identity and receive that user's messages.
4. **Flat, merged role model.** `userModel.js` has one schema for both clients and helpers (`role: 'client' | 'helper'`), no `professional` or `admin` role, no verification/status fields, and reward logic (`coins += rating`) baked directly into the rating-update handler instead of being a separate, auditable process.
5. **CORS hard-coded to `http://localhost:3000`** with no environment-based configuration, and no rate limiting, no input validation library, and no distinction between demo and production data.

## 4. What is being preserved

- **Identity**: the name "Heart2Hear", the tagline concept, and the three-tier idea (AI → trained helper → verified professional).
- **Visual language**: off-white background, pastel teal / coral / soft-yellow accents, calm and trustworthy tone — recreated as design tokens in the new frontend rather than copying the old image assets.
- **Matching concept**: language + availability + topic-based helper matching, rebuilt on Firestore queries with proper authorization.
- **User journey shape**: register → choose role → complete profile → find support → session → rating — evolved into the fuller journey (wellbeing check, safety escalation, verification, payments, rewards) described in the implementation plan.

## 5. What is not being carried forward, and the replacement

| Old | Problem | Replacement |
|---|---|---|
| MongoDB + Mongoose | Leaked credential, no schema-level access control | Firestore + Security Rules |
| Express + JWT auth | No auth actually enforced on mutating routes | Firebase Authentication + custom role claims, enforced in Firestore Rules and Cloud Functions |
| Socket.IO | Unauthenticated identity claims | Firestore `onSnapshot` listeners on authorized documents |
| Flat `coins`/`tokens` reward field | Manually incremented, no audit trail, easy to abuse | Server-computed reward eligibility → `rewardLedger` → on-chain Sepolia transaction with a stored tx hash |
| CRA client | Unmaintained tooling, tightly coupled to the old auth/data model | Vite + React + TypeScript + Tailwind |

No code from the old server is reused as-is; conceptually validated ideas (matching, roles, chat) are rebuilt against the new Firebase-based architecture described in `HEART2HEAR_IMPLEMENTATION_PLAN.md`.
