# Testing

## Frontend/backend unit tests (Vitest)

**WHERE**: Terminal, at the repo root

```
npm test
```

Runs `web/api/_lib/safety.test.ts` and `web/api/_lib/rewards.test.ts` — pure-function tests, no
emulator or network needed. Covers:

- **Safety detector** (`safety.test.ts`): every severity tier, multilingual crisis phrases
  (English/Hindi/Tamil), that CRISIS always outranks MEDIUM in the same message, case-insensitivity.
- **Reward eligibility/formula** (`rewards.test.ts`): every eligibility gate individually
  (unverified helper, low rating, too-short session, missing timestamps, daily cap), and that the
  amount calculation has no session-length or message-count input at all — proving by
  construction that rewards can't be gamed by dragging a conversation out.

## Firestore Security Rules tests

**Prerequisite**: Java 21+ (the Firestore emulator's requirement). This machine had Java 17 at the
time of writing — install a newer JDK (e.g. from https://adoptium.net) before running these.

**WHERE**: Terminal, at the repo root

```
npm run test:rules
```

This starts the Firestore emulator, runs `web/firestore.rules.test.ts` against it, then shuts the
emulator down. Covers the highest-value security boundaries directly against the real rules file:

- A user can read their own profile, not anyone else's; an admin can read any profile.
- A client **cannot** create, delete, or write a `role` field onto their own profile (the exact
  privilege-escalation path a broken rule would otherwise allow).
- `safetyEvents` are unreadable by anyone but an admin, even the user the event is about.
- `certificates` are publicly readable (by design) but never client-writable.
- `supportSessions` are readable only by their two participants, not a third party.

## Smart contract tests (Hardhat)

**WHERE**: Terminal, at the repo root

```
npm run test:contracts
```

Covers `Heart2HearRewardToken`: only `MINTER_ROLE` can mint, minting emits `RewardIssued`, pausing
blocks minting, and only `PAUSER_ROLE` can pause.

## Manual end-to-end walkthrough

Automated tests cover logic; they don't replace actually clicking through the app. Before calling
a phase "done," walk the relevant journey from `HEART2HEAR_IMPLEMENTATION_PLAN.md` end to end in a
browser — registration through to whatever that phase added (wellbeing check → AI chat → helper
training → session → review → professional booking → video call → reward). Use two different
browser profiles (or one normal + one incognito) to play both sides of any two-party flow (client +
helper, client + professional).

## What's not automated yet

- No frontend component tests (React Testing Library) — the manual walkthrough is the primary UI
  verification for now.
- No load/concurrency test for the double-booking-prevention transaction in `bookAppointment.ts`,
  though it's the same Firestore-transaction pattern used and tested implicitly by the rules
  tests' data model.
