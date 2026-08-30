# Heart2Hear

> Someone to listen. Someone to guide. Someone to help.

Heart2Hear is a stepped mental-wellness support platform: an AI supportive chatbot, trained
human helpers, verified licensed professionals, and crisis escalation — in that order of
availability, never as a substitute for emergency care.

This repository is a from-scratch rebuild on Firebase. See:

- [`docs/HEART2HEAR_AUDIT.md`](docs/HEART2HEAR_AUDIT.md) — audit of the prior prototype and why its
  architecture isn't reused.
- [`docs/HEART2HEAR_IMPLEMENTATION_PLAN.md`](docs/HEART2HEAR_IMPLEMENTATION_PLAN.md) — target
  architecture and the six build phases.
- [`docs/SETUP.md`](docs/SETUP.md) — how to run this project locally, starting from a clean machine.

## Project layout

```
web/            React + Vite + TypeScript + Tailwind frontend, deployed to Vercel
web/api/        Vercel serverless functions (TypeScript) — the only place secrets live
contracts/      Hardhat / Solidity (added in Phase 5)
docs/           Setup guides and architecture docs
firestore.rules, storage.rules, firebase.json  (Firestore/Storage config; Auth + Firestore only — see docs/HEART2HEAR_IMPLEMENTATION_PLAN.md)
```

Firebase provides Auth + Firestore (free Spark plan). The trusted backend and hosting live on
Vercel instead of Firebase Cloud Functions/Hosting — see
[`docs/HEART2HEAR_IMPLEMENTATION_PLAN.md`](docs/HEART2HEAR_IMPLEMENTATION_PLAN.md) for why.

## Status

**Phase 1 — Foundation** is in progress: role-aware auth, design system, landing page, and
role-gated dashboard shells. See the implementation plan for what's next.
