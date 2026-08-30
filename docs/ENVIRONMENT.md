# Environment Variables

All environment variables live in `web/.env.local` locally (gitignored — see
`web/.env.local.example` for the template) and in Vercel's dashboard (Settings → Environment
Variables) for production. Nothing here is duplicated anywhere else — there is no `functions/.env`
or `contracts/.env`; the Hardhat config reads `web/.env.local` directly via `dotenv`.

## Client-side (`VITE_*` — safe to expose, ships in the browser bundle)

| Variable | From | Notes |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project settings | Identifies the project; not a secret — `firestore.rules` is what protects data |
| `VITE_FIREBASE_AUTH_DOMAIN` | same | |
| `VITE_FIREBASE_PROJECT_ID` | same | |
| `VITE_FIREBASE_STORAGE_BUCKET` | same | |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | same | |
| `VITE_FIREBASE_APP_ID` | same | |
| `VITE_USE_FIREBASE_EMULATORS` | you set this | `"true"` to use local Firestore/Auth emulators instead of production |

## Server-only (`web/api/*.ts` only — never sent to the browser)

| Variable | From | Used by |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase Console → Service accounts, base64-encoded | `_lib/firebaseAdmin.ts` — every backend Firestore/Auth call |
| `GEMINI_API_KEY` | Google AI Studio (`GEMINI_SETUP.md`) | `aiChat.ts` |
| `GEMINI_MODEL` (optional) | — | Overrides the default `gemini-2.0-flash` |
| `ZEGOCLOUD_APP_ID` / `ZEGOCLOUD_SERVER_SECRET` | ZEGOCLOUD console (`VIDEO_SETUP.md`) | `generateVideoToken.ts` |
| `ZEGOCLOUD_APP_SIGN` / `ZEGOCLOUD_CALLBACK_SECRET` | same | Held for reference; not currently used by any code path |
| `RESEND_API_KEY` | Resend (`RESEND_SETUP.md`) | `sendLoginNotification.ts`, appointment confirmation email in `razorpayWebhook.ts` |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay (`RAZORPAY_SETUP.md`) | `createRazorpayOrder.ts` |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook settings | `razorpayWebhook.ts` |
| `SEPOLIA_RPC_URL` | Alchemy (`BLOCKCHAIN_SETUP.md`) | `_lib/blockchain.ts`, `contracts/hardhat.config.ts` |
| `REWARD_DISTRIBUTOR_PRIVATE_KEY` | MetaMask account export | `_lib/blockchain.ts`, `contracts/hardhat.config.ts` — **the most sensitive value in this project** |
| `REWARD_TOKEN_ADDRESS` | printed by `npm run deploy:sepolia` | `_lib/blockchain.ts` |
| `ETHERSCAN_API_KEY` (optional) | Etherscan | Only needed to verify the contract's source code publicly |

## Rules

- Never commit a real value for any of the above — `.gitignore` excludes `.env`/`.env.local`
  everywhere in the repo; only `.env.local.example` (placeholders) is tracked.
- A missing/invalid server-only var should fail loudly with a specific error message the first
  time it's needed, not silently misbehave — that's the pattern every `_lib/*.ts` in this repo
  follows (e.g. `_lib/firebaseAdmin.ts`'s `loadServiceAccount()`).
- When adding a new one: add it to `web/.env.local.example` with a comment pointing at the setup
  doc, and to this table.
