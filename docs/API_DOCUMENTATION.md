# API Documentation

All endpoint URLs below are `POST /api/<name>` using the flat name in each table (e.g.
`POST /api/aiChat`, `POST /api/adminListReports` — admin endpoints are prefixed `admin`, not
nested under `/admin/`). Under the hood they're all implemented in `web/api/_handlers/` and
dispatched through one shared `web/api/[action].ts` route, not one Vercel function per file — see
`ARCHITECTURE.md` for why (the Vercel Hobby plan's 12-function limit, and why the route names are
flat rather than nested).

**Every endpoint except `razorpayWebhook`** requires `Authorization: Bearer <Firebase ID token>`
and is `POST`-only, verified by `web/api/_lib/http.ts` before the handler runs — see `ARCHITECTURE.md`.
The exact request/response shape for each is defined by its `zod` schema in the source file; that
schema is the authoritative contract, this doc is the map of what exists and why.

Errors are always `{ "error": "human-readable message" }` with an appropriate HTTP status (400
invalid input, 401 unauthenticated, 403 permission denied, 404/`invalidArgument` not found, 409
failed precondition, 429 rate-limited, 500 unexpected).

## Auth & profile

| Endpoint | Purpose |
|---|---|
| `completeRegistration` | Sets the account's role as a Firebase custom claim (client/helper/professional — never admin) and creates the `users/{uid}` profile. One-time; refuses if a role is already set. |
| `sendLoginNotification` | Best-effort security email after sign-in. Never blocks login. |

## Client wellbeing & AI (Phase 2)

| Endpoint | Purpose |
|---|---|
| `submitWellbeingAssessment` | Scores the Quick Wellbeing Check server-side into a routing signal (`LOW/MODERATE/PROFESSIONAL_SUPPORT_RECOMMENDED/SAFETY_ESCALATION`) — never a diagnosis. |
| `aiChat` | Rate-limited (20/5min). Pre-filters the user's message for crisis language before ever calling Gemini; post-filters the model's reply. |
| `deleteAiConversation` | User-initiated deletion of their entire AI chat history. |

## Helper ecosystem (Phase 3)

| Endpoint | Purpose |
|---|---|
| `submitStudentVerification` | Student-path helper registration; always routes to admin review. |
| `getTrainingContent` | Serves lesson/quiz content with answer keys stripped. |
| `submitLessonQuiz` | Grades a lesson quiz server-side, records progress. |
| `submitFinalTest` | Grades the final assessment server-side; 24h retry cooldown on failure; issues the Level 1 certificate on pass. |
| `toggleAvailability` | Helper goes online/offline in the directory. |
| `browseHelpers` | Public directory of verified, available helpers. |
| `requestHelperSession` | Rate-limited (10/hr). Client requests a session with a specific helper. |
| `respondToSessionRequest` | Helper accepts/declines a request. |
| `sendSessionMessage` | Rate-limited (60/5min). Runs the helper's outgoing message through the safety moderator; a violation is never delivered, 3 violations auto-suspend the helper. A CRISIS-level *client* message escalates the session instead of being censored. |
| `endSession` | Ends an active session; increments the helper's completed-session count and checks certificate milestones. |
| `submitHelperReview` | Client review after completion; server-computed aggregate rating (transaction); triggers reward eligibility evaluation. |

## Professional track (Phase 4)

| Endpoint | Purpose |
|---|---|
| `submitProfessionalVerification` | Professional registration; always routes to admin review (see `PROFESSIONAL_VERIFICATION.md`). |
| `addAvailabilitySlot` / `removeAvailabilitySlot` | Professional manages their bookable slots. |
| `getProfessionalSlots` | Open, future slots for a given professional. |
| `browseProfessionals` | Public directory of verified professionals. |
| `bookAppointment` | Transaction-safe double-booking prevention; creates a `PENDING_PAYMENT` appointment. |
| `cancelUnpaidAppointment` | Client backs out of an unpaid booking, freeing the slot. |
| `createRazorpayOrder` | Creates the payment order server-side. |
| `razorpayWebhook` | **Not Bearer-authenticated** (Razorpay calls it directly) — verified via HMAC signature over the raw body instead. The only thing that ever confirms an appointment. |
| `completeAppointment` | Professional marks a confirmed appointment completed or no-show. |
| `submitProfessionalReview` | Client review after a completed appointment; same aggregate-rating pattern as helper reviews. |
| `generateVideoToken` | Mints a ZEGOCLOUD token, only for a `CONFIRMED` appointment inside a join window. |

## Blockchain rewards (Phase 5)

| Endpoint | Purpose |
|---|---|
| `requestWalletNonce` | Issues a signed-nonce challenge for wallet linking. |
| `linkWallet` | Verifies the signature, stores only the wallet address, enforces one wallet per account. |

(Reward evaluation/distribution isn't a client-callable endpoint — it's triggered internally by
`submitHelperReview` via `_lib/rewards.ts`.)

## Moderation & reporting

| Endpoint | Purpose |
|---|---|
| `submitReport` | Rate-limited (10/hr). Client/helper files a concern, optionally tied to a session. |

## Admin (all require the `admin` role)

| Endpoint | Purpose |
|---|---|
| `adminListVerificationQueue` / `adminReviewVerification` | Approve/reject pending helpers and professionals; writes an audit log entry. |
| `adminListSafetyEvents` / `adminUpdateSafetyEventStatus` | Review flagged crisis/moderation events. |
| `adminListReports` / `adminUpdateReportStatus` | Review and resolve user-filed reports. |
| `adminGetPlatformSettings` / `adminUpdatePlatformSettings` | Read/write the training pass score and reward formula (never hard-coded). |
| `adminListAuditLogs` | Every sensitive admin action, most recent first. |
