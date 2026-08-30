# Heart2Hear

> Someone to listen. Someone to guide. Someone to help.

Heart2Hear is a stepped mental-wellness support platform: an AI supportive chatbot, trained
human helpers, verified licensed professionals, and crisis escalation — in that order of
availability, never as a substitute for emergency care.

This repository is a from-scratch rebuild on Firebase + Vercel. Live at:
https://heart2hear1.vercel.app

## Documentation

- [`docs/HEART2HEAR_AUDIT.md`](docs/HEART2HEAR_AUDIT.md) — audit of the prior prototype and why its architecture isn't reused.
- [`docs/HEART2HEAR_IMPLEMENTATION_PLAN.md`](docs/HEART2HEAR_IMPLEMENTATION_PLAN.md) — architecture and the six build phases.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system overview, request flow, data model.
- [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md) — every `web/api/*` endpoint.
- [`docs/SETUP.md`](docs/SETUP.md) — run this project locally, starting from a clean machine.
- [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md) — every environment variable, what it's for, where it comes from.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — what's deployed where and how to redeploy.
- [`docs/SECURITY.md`](docs/SECURITY.md) — threat model, what protects against each, what's deliberately deferred.
- [`docs/TESTING.md`](docs/TESTING.md) — unit tests, Firestore rules tests, contract tests, manual QA.
- [`docs/HELPER_VERIFICATION.md`](docs/HELPER_VERIFICATION.md) / [`docs/PROFESSIONAL_VERIFICATION.md`](docs/PROFESSIONAL_VERIFICATION.md) — verification workflows.
- Per-integration setup guides: [`FIREBASE_SETUP.md`](docs/FIREBASE_SETUP.md), [`VERCEL_SETUP.md`](docs/VERCEL_SETUP.md), [`GEMINI_SETUP.md`](docs/GEMINI_SETUP.md), [`RESEND_SETUP.md`](docs/RESEND_SETUP.md), [`RAZORPAY_SETUP.md`](docs/RAZORPAY_SETUP.md), [`VIDEO_SETUP.md`](docs/VIDEO_SETUP.md), [`BLOCKCHAIN_SETUP.md`](docs/BLOCKCHAIN_SETUP.md).

## Project layout

```
web/            React + Vite + TypeScript + Tailwind frontend, deployed to Vercel
web/api/        Vercel serverless functions (TypeScript) — the only place secrets live
contracts/      Hardhat / Solidity — Heart2HearRewardToken (Sepolia testnet)
docs/           All documentation
firestore.rules, storage.rules, firebase.json   (Firestore config — Auth + Firestore only, see ARCHITECTURE.md)
```

Firebase provides Auth + Firestore (free Spark plan). The trusted backend and hosting live on
Vercel instead of Firebase Cloud Functions/Hosting — see `docs/ARCHITECTURE.md` for why.

## Quickstart

```
npm run install:all
npm test
```

See `docs/SETUP.md` for the full local-dev walkthrough (env vars, running against real Firebase
vs. emulators, `vercel dev` for testing `web/api/*` locally).

## Status

All six planned phases have real, working code:

1. **Foundation** — role-aware auth, design system, landing page, dashboards. ✅
2. **Wellbeing & AI** — wellbeing check, safety detector, Gemini chatbot. ✅
3. **Helper ecosystem** — training, verification, matching, chat + moderation, ratings, certificates. ✅
4. **Professional track** — verification, booking, payments, video. ✅ (Razorpay account still needed to test payments live)
5. **Blockchain rewards** — reward token contract, wallet linking, eligibility engine. ✅ (deployment accounts still needed to test on-chain)
6. **Admin, security, testing, docs** — this document set, admin dashboard, rate limiting, unit + Firestore-rules tests. ✅

See `docs/HEART2HEAR_IMPLEMENTATION_PLAN.md` for the detailed per-phase breakdown and exactly
which accounts still need to be created to fully exercise Phases 4 and 5.
