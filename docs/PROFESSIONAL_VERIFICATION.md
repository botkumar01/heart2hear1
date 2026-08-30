# Professional Verification

## Why there's no automated API

Researched before building this (per the project's explicit "don't fabricate an API" rule):

- **Doctors/psychiatrists** are registered under the National Medical Commission's National
  Medical Register (NMR) / State Medical Councils. NMC provides a *public web lookup*, not a
  documented, licensed third-party verification API. The only "APIs" found are unofficial
  scrapers of that public search page — not something to build production reliance on (fragile,
  ToS-risk, and exactly the kind of unreliable integration the project spec warns against).
- **Clinical psychologists** register with the Rehabilitation Council of India (RCI)'s Central
  Rehabilitation Register, also via a public web search tool, not a partner API.

If a legitimate verification API provider becomes available later, this is the place to integrate
it — but as of writing, none exists for either body.

## What we built instead

`web/api/submitProfessionalVerification.ts` collects the professional's details (registration
number, council, qualification, etc.) and **always** routes to admin manual review — there is no
"auto-approve" path.

`web/api/admin/listVerificationQueue.ts` surfaces, for each pending professional, a direct link to
the correct official public register based on which council they selected:

- NMC / State Medical Council → https://www.nmc.org.in/information-desk/indian-medical-register/
- RCI → https://rehabcouncil.nic.in/

An admin manually looks up the registration number there before approving. This is slower than an
automated check would be, but it's honest about what's actually verifiable right now — the
alternative (a fake or unreliable automated check) would be worse than no automation at all.

## What's deferred

Document/KYC upload (spec §16) needs Firebase Storage, which is deferred until Blaze (see
`docs/FIREBASE_SETUP.md`). Until then, verification is based on the submitted text fields plus the
admin's manual register lookup — not document images. `submitProfessionalVerification.ts` already
notes this limitation to the professional at submission time.

## Enforcement

A professional cannot receive bookings until `verificationStatus === 'VERIFIED'` —
`bookAppointment.ts` checks this server-side on every booking attempt, not just in the UI.
