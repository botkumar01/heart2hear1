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

**Phase 4 — Professional track** *(done — Razorpay account still needed to test payments live)*
Separate professional registration (`submitProfessionalVerification.ts`) — researched first (see `docs/PROFESSIONAL_VERIFICATION.md`): no legitimate India verification API exists for NMC or RCI registrations, so this always routes to admin review, which now gets a direct link to the correct official public register. Verified public directory (`browseProfessionals.ts`) with slot-based availability (`addAvailabilitySlot.ts`/`getProfessionalSlots.ts`) and transaction-safe double-booking prevention (`bookAppointment.ts`). Razorpay payment: order creation server-side, only a signature-verified webhook (`razorpayWebhook.ts`, raw-body HMAC check, idempotent against duplicate delivery) ever confirms an appointment — never a frontend "success" callback. ZEGOCLOUD video (`_lib/zegoToken.ts`, ported from ZEGOCLOUD's own reference implementation rather than written from memory, token minted only for a CONFIRMED appointment within a join window). Appointment completion, professional reviews, and a client-cancel path for abandoned checkouts.
Accounts needed: **Razorpay** (not yet created — payments/confirmation untestable until then). **ZEGOCLOUD** already configured and wired up end-to-end.

**Phase 5 — Blockchain rewards** *(code complete — deployment accounts still needed)*
`contracts/contracts/Heart2HearRewardToken.sol` — ERC20 + AccessControl (MINTER_ROLE for the backend distributor) + Pausable, OpenZeppelin, 4 passing tests. Reward eligibility (`web/api/_lib/rewards.ts`) is deliberately NOT message-count based: requires a real completed+reviewed session of minimum duration, a minimum client rating, the helper in good standing, and a per-helper daily cap — triggered from `submitHelperReview.ts`, never blocking the review if blockchain isn't configured (left `PENDING`). Wallet linking (`requestWalletNonce.ts` → `linkWallet.ts`) stores only an address, proven via a signed-nonce challenge, never a key — and enforces one wallet per account. `_lib/blockchain.ts` executes the on-chain mint via ethers.js once configured. Reward history + Sepolia Etherscan links on a new helper Rewards page.
Accounts needed: **MetaMask**, a **Sepolia faucet**, and an **RPC provider** (Alchemy) — see `docs/BLOCKCHAIN_SETUP.md`. Nothing is live-testable on-chain until the contract is actually deployed.

**Phase 6 — Admin, hardening, testing, docs** *(done — Firestore rules tests need a local Java 21+ upgrade to actually run)*
Admin dashboard completed: safety-incident review, report review, platform settings (training pass score + reward formula, admin-editable, never hard-coded), audit log viewer, alongside the verification queue from Phase 3. Rate limiting (`_lib/rateLimit.ts`, Firestore-backed fixed window) on the endpoints where abuse has real cost/safety impact (`aiChat`, `sendSessionMessage`, `submitReport`, `requestHelperSession`). Firebase App Check documented as a deliberate follow-up, not implemented (`docs/SECURITY.md` explains why). Real unit tests (Vitest) for the safety detector and reward eligibility/formula, Firestore Security Rules tests (`@firebase/rules-unit-testing`) covering the exact privilege-escalation and cross-user-read paths the old prototype's audit flagged, contract tests already in place from Phase 5. Full documentation set — see `README.md` for the index.

Each phase ends with: what was implemented, what was fixed, files touched, database/security changes, integrations added, tests run, current status, and the next required account (if any).

## Firestore collections (introduced progressively, not all at once)

`users`, `wellbeingAssessments`, `aiConversations`, `helperTraining`, `trainingModules`, `trainingAttempts`, `verificationRequests`, `supportSessions` (+ `messages` subcollection), `reviews`, `helperCertifications`, `appointments`, `payments`, `safetyEvents`, `reports`, `rewardLedger`, `blockchainTransactions`, `wallets`, `crisisResources`, `adminAuditLogs`, `platformSettings`.

## Security non-negotiables

- No secret ever appears in `web/` source. Every credential is a Cloud Functions env var / Secret Manager entry, mirrored in a `.env.example` with placeholders.
- `role` is never trusted from client input — always the Auth custom claim.
- Every sensitive admin action writes an `adminAuditLogs` entry.
- Firestore Rules default-deny; access is granted explicitly per collection based on ownership or role claim.
