# Helper Verification

Two paths, per the spec's Path A (student) / Path B (general volunteer) distinction.

## Path A — Psychology/psychiatry student

1. Registers with role `helper`, `helperPath: "student"` (`completeRegistration.ts`).
2. Fills out `submitStudentVerification.ts`: name, college, degree/program, year, college email,
   languages, code-of-conduct agreement.
3. The college email's domain is checked against an educational-domain pattern (`.edu`,
   `.ac.<cc>`, `.edu.<cc>`) — this is a **signal for the admin, not proof**. The spec is explicit
   that a college email alone doesn't prove someone is a legitimate student.
4. Status becomes `UNDER_REVIEW` immediately — there is no auto-approve path.
5. An admin reviews the submission in the Admin dashboard's verification queue and approves or
   rejects.
6. **Document/ID upload is not available yet** — it needs Firebase Storage, which is deferred
   (see `FIREBASE_SETUP.md`). Until then, review is based on the submitted text fields.

## Path B — General volunteer

1. Registers with role `helper`, `helperPath: "volunteer"`.
2. Works through the training curriculum (`getTrainingContent.ts` / `submitLessonQuiz.ts`) —
   active listening, boundaries/prohibited advice, confidentiality & cultural sensitivity, crisis
   recognition (full content in `web/api/_lib/trainingContent.ts`).
3. Takes the scenario-based final test (`submitFinalTest.ts`), graded server-side, answer keys
   never sent to the client until after grading. Passing score is admin-configurable (Admin
   dashboard → Platform settings), defaulting to 80%.
4. Failing enforces a 24-hour retry cooldown, checked server-side against the last attempt's
   timestamp — not just a frontend disable.
5. On passing, `trainingCompleted`/`testPassed` are set, status becomes `UNDER_REVIEW`, and a
   "Training Completed" (Level 1) certificate is issued automatically.
6. An admin reviews and approves/rejects in the Admin dashboard.

## Verification statuses

Both paths share the same status field on `users/{uid}`:

```
PENDING → UNDER_REVIEW → VERIFIED
                       → VERIFICATION_FAILED
```

`SUSPENDED` can also be reached automatically — `sendSessionMessage.ts` auto-suspends a helper
after 3 chat-moderation violations, ending the active session and flagging it for admin review.

## After verification

A `VERIFIED` helper can toggle availability (`toggleAvailability.ts`) and appears in
`browseHelpers.ts`'s directory. Nothing else — specifically, a helper's own claims about being
"verified" are never trusted anywhere except this server-set field; the frontend badge reads it
directly from the profile document, not from anything the helper can edit.

## Certificates and milestones

Beyond Level 1 (training completed), session-count milestones (25/50/100 completed sessions) issue
further certificates automatically after each `endSession.ts` call
(`web/api/_lib/certificates.ts`). Every certificate is publicly verifiable at
`/certificates/:certificateId` without needing to sign in.
