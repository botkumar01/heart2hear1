# Heart2Hear — Implementation Plan

See `HEART2HEAR_AUDIT.md` for the audit of the prior prototype this plan replaces.

## Architecture

- **Frontend**: `web/` — React + Vite + TypeScript + Tailwind CSS, deployed to Firebase Hosting. Single-page app; no server rendering, since every page is behind authentication and reads live from Firestore.
- **Trusted backend**: `functions/` — Firebase Cloud Functions (2nd gen, TypeScript). This is the *only* place secrets live (Gemini key, Razorpay secret, ZEGOCLOUD server secret, blockchain distributor private key, email API key). No standalone Express server — one deploy target, tied to the Firebase project.
- **Database**: Cloud Firestore only. No MongoDB. Subcollections (e.g. `supportSessions/{id}/messages`) instead of unbounded arrays.
- **Real-time**: Firestore `onSnapshot` listeners for chat, typing indicators, and presence — no Socket.IO.
- **Auth & roles**: Firebase Authentication (email/password), with `role` (`client | helper | professional | admin`) set as a **custom claim** by a Cloud Function, never trusted from the client. Firestore Security Rules and every Cloud Function check `request.auth.token.role`.
- **Storage**: Firebase Storage for KYC/verification documents and profile images, locked down by Security Rules — never public.
- **Blockchain**: `contracts/` — Hardhat + OpenZeppelin, deployed to Ethereum Sepolia testnet. A server-held distributor wallet (Cloud Functions only) executes reward transactions; MetaMask is used client-side only to connect and sign, never to hold platform funds.

```
web/            React + Vite + TS + Tailwind
functions/      auth/ ai/ chat/ payments/ verification/ rewards/ notifications/ safety/
contracts/      Hardhat: contracts/, scripts/, test/
docs/           this plan, audit, and setup guides
firestore.rules, storage.rules, firebase.json
```

## Phases

**Phase 1 — Foundation** *(current)*
Repo scaffold, design system, landing page, role-aware registration/login with email verification, role-gated dashboards, Firestore rules v1, login-notification email.
Accounts needed: **Firebase** (now), **Resend** (for the login-notification email).

**Phase 2 — Client wellbeing, AI, safety core**
Wellbeing Check → non-diagnostic routing signal. Shared safety/moderation detector (multilingual: English, Tamil, Hindi). Gemini-backed supportive chatbot behind a Cloud Function, with the guardrail system prompt and safety filtering. Crisis resources panel and support-routing screen.
Accounts needed: **Gemini API key**.

**Phase 3 — Helper ecosystem**
Student vs. general-volunteer registration paths, training modules + quizzes + scenario-based final test, admin manual verification, language/availability matching, Firestore-based private chat replacing Socket.IO, server-side chat moderation reusing Phase 2's safety module, session lifecycle state machine, ratings, milestone certificates.

**Phase 4 — Professional track**
Separate professional registration and verification workflow (manual/admin-reviewed unless a real India registration-verification API is confirmed to exist), verified public directory, appointment booking with double-booking prevention, Razorpay payment + webhook verification, ZEGOCLOUD video consultations.
Accounts needed: **Razorpay**, **ZEGOCLOUD**.

**Phase 5 — Blockchain rewards**
Hardhat reward-token contract (OpenZeppelin AccessControl + Pausable), Sepolia deployment, server-computed reward eligibility, MetaMask wallet linking (address + signature only), reward ledger with transaction hash / explorer link.
Accounts needed: **MetaMask**, **Sepolia faucet**, an **RPC provider** (e.g. Alchemy).

**Phase 6 — Admin, hardening, testing, docs**
Full admin dashboard with audit logging, security hardening (rate limiting, App Check, input validation, no wildcard CORS), Cloud Functions + Firestore Rules unit tests, complete documentation set, end-to-end demo run-through with clearly labeled demo accounts.

Each phase ends with: what was implemented, what was fixed, files touched, database/security changes, integrations added, tests run, current status, and the next required account (if any).

## Firestore collections (introduced progressively, not all at once)

`users`, `wellbeingAssessments`, `aiConversations`, `helperTraining`, `trainingModules`, `trainingAttempts`, `verificationRequests`, `supportSessions` (+ `messages` subcollection), `reviews`, `helperCertifications`, `appointments`, `payments`, `safetyEvents`, `reports`, `rewardLedger`, `blockchainTransactions`, `wallets`, `crisisResources`, `adminAuditLogs`, `platformSettings`.

## Security non-negotiables

- No secret ever appears in `web/` source. Every credential is a Cloud Functions env var / Secret Manager entry, mirrored in a `.env.example` with placeholders.
- `role` is never trusted from client input — always the Auth custom claim.
- Every sensitive admin action writes an `adminAuditLogs` entry.
- Firestore Rules default-deny; access is granted explicitly per collection based on ownership or role claim.
