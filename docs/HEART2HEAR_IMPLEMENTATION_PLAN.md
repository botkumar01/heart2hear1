# Heart2Hear — Implementation Plan

See `HEART2HEAR_AUDIT.md` for the audit of the prior prototype this plan replaces.

## Architecture

> **Revised during Phase 1**: the original plan used Firebase Cloud Functions as the trusted
> backend. Firebase now requires the paid Blaze plan for Cloud Functions and for Storage (Google
> removed the free tier for both), and the project owner asked to avoid that cost. The trusted
> backend was moved to **Vercel** instead — Firebase Auth and Firestore stay on the free Spark
> plan (Admin SDK access to them from an external server is free and unaffected by this), Storage
> is deferred until it's actually needed (Phase 3/4) and revisited then.

- **Frontend + trusted backend, one platform**: `web/` — React + Vite + TypeScript + Tailwind, deployed to **Vercel**. `web/api/*.ts` are Vercel serverless functions (Node.js) living alongside it — this is the *only* place secrets live (Gemini key, Razorpay secret, ZEGOCLOUD server secret, blockchain distributor private key, email API key, the Firebase service-account key). Same origin as the frontend in both `vercel dev` and production, so no CORS configuration is needed.
- **Database**: Cloud Firestore only (Spark/free plan). No MongoDB. Subcollections (e.g. `supportSessions/{id}/messages`) instead of unbounded arrays.
- **Real-time**: Firestore `onSnapshot` listeners for chat, typing indicators, and presence — no Socket.IO.
- **Auth & roles**: Firebase Authentication (email/password), with `role` (`client | helper | professional | admin`) set as a **custom claim** by `web/api/completeRegistration.ts` (via firebase-admin, authenticated with a service-account key), never trusted from the client. The frontend calls `web/api/*` with the user's Firebase ID token as a Bearer header; each function verifies it server-side before doing anything. Firestore Security Rules check `request.auth.token.role`.
- **Storage**: deferred. Firebase Storage now requires Blaze too; when Phase 3/4 needs document/image storage, re-evaluate Firebase Storage (if Blaze is acceptable by then) vs. a free alternative (e.g. Cloudflare R2, Supabase Storage).
- **Blockchain**: `contracts/` — Hardhat + OpenZeppelin, deployed to Ethereum Sepolia testnet. A server-held distributor wallet (a `web/api/*` function only) executes reward transactions; MetaMask is used client-side only to connect and sign, never to hold platform funds.

```
web/            React + Vite + TS + Tailwind, deployed to Vercel
web/api/        Vercel serverless functions (Node/TS) — the trusted backend
contracts/      Hardhat: contracts/, scripts/, test/
docs/           this plan, audit, and setup guides
firestore.rules, storage.rules, firebase.json  (Firestore/Storage config only — no more Functions/Hosting here)
```

## Phases

**Phase 1 — Foundation** *(done)*
Repo scaffold, design system, landing page, role-aware registration/login with email verification, role-gated dashboards, Firestore rules v1, login-notification email.
Accounts needed: **Firebase** (done), **Vercel** (done), **Resend** (for the login-notification email; optional, no-ops without it).

**Phase 2 — Client wellbeing, AI, safety core** *(done)*
Wellbeing Check → non-diagnostic routing signal (`web/api/submitWellbeingAssessment.ts`). Shared safety detector (`web/api/_lib/safety.ts`, multilingual EN/TA/HI keyword patterns) reused by the AI chat now and helper-chat moderation in Phase 3. Gemini-backed supportive chatbot (`web/api/aiChat.ts` + `_lib/gemini.ts`) with the guardrail system prompt, pre-filtering user messages for crisis language before ever calling Gemini, and post-filtering the model's own replies. Crisis resources panel (`web/src/components/SafetyPanel.tsx`, India-first + country-extensible) and a support-routing result screen after the wellbeing check.
Accounts needed: **Gemini API key** (already have one from the project owner's friend — add it to Vercel env vars if not already there).

**Phase 3 — Helper ecosystem** *(done)*
Student vs. general-volunteer registration paths (`submitStudentVerification.ts` — college-email domain heuristic, always routed to admin review since document upload needs Storage, still deferred). Training curriculum + quizzes + scenario-based final test, graded server-side only, answer keys never shipped to the client (`getTrainingContent.ts` / `submitLessonQuiz.ts` / `submitFinalTest.ts`, content in `_lib/trainingContent.ts`), 24h retry cooldown on failure. Minimal admin verification queue (approve/reject + audit log) — pulled forward from Phase 6 since it's a hard dependency for the helper journey to be testable at all. Language/availability matching (`browseHelpers.ts`). Firestore-based private chat replacing Socket.IO (`requestHelperSession.ts` → `respondToSessionRequest.ts` → `sendSessionMessage.ts` → `endSession.ts`), full state machine (REQUESTED/ACTIVE/COMPLETED/CANCELLED/SAFETY_ESCALATED/REVIEWED). Server-side chat moderation on the helper's outgoing messages reuses Phase 2's `_lib/safety.ts` unchanged — a violation is never delivered to the client, and 3 violations auto-suspend the helper. Ratings (`submitHelperReview.ts`, server-computed aggregate, transaction-safe) and milestone certificates (`_lib/certificates.ts`, publicly verifiable at `/certificates/:id`). Basic reporting (`submitReport.ts`).

**Phase 4 — Professional track** *(current — Razorpay account still needed)*
Separate professional registration (`submitProfessionalVerification.ts`) — researched first (see `docs/PROFESSIONAL_VERIFICATION.md`): no legitimate India verification API exists for NMC or RCI registrations, so this always routes to admin review, which now gets a direct link to the correct official public register. Verified public directory (`browseProfessionals.ts`) with slot-based availability (`addAvailabilitySlot.ts`/`getProfessionalSlots.ts`) and transaction-safe double-booking prevention (`bookAppointment.ts`). Razorpay payment: order creation server-side, only a signature-verified webhook (`razorpayWebhook.ts`, raw-body HMAC check, idempotent against duplicate delivery) ever confirms an appointment — never a frontend "success" callback. ZEGOCLOUD video (`_lib/zegoToken.ts`, ported from ZEGOCLOUD's own reference implementation rather than written from memory, token minted only for a CONFIRMED appointment within a join window). Appointment completion, professional reviews, and a client-cancel path for abandoned checkouts.
Accounts needed: **Razorpay** (not yet created — payments/confirmation untestable until then). **ZEGOCLOUD** already configured and wired up end-to-end.

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
