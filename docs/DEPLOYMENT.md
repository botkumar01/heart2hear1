# Deployment

Everything is already deployed continuously — this doc explains what's live where and how to
redeploy manually if needed.

## What's deployed and where

| Piece | Where | How it deploys |
|---|---|---|
| Frontend + `web/api/*` | Vercel (`https://heart2hear1.vercel.app`) | Automatic on every `git push` to `main` (GitHub integration) |
| Firestore rules & indexes | Firebase project `heart2hear` | Manual: `npm run deploy:rules` (or `firebase deploy --only firestore:rules,firestore:indexes`) |
| Storage rules | Firebase project `heart2hear` | Not live — Storage itself isn't enabled yet (`FIREBASE_SETUP.md`) |
| `Heart2HearRewardToken` contract | Ethereum Sepolia testnet | Manual, one-time: `cd contracts && npm run deploy:sepolia` (`BLOCKCHAIN_SETUP.md`) |

## Redeploying the frontend/backend manually

Normally unnecessary (pushing to `main` handles it), but if needed:

**WHERE**: Terminal, at the repo root

```
npm run deploy:web
```

## Redeploying Firestore rules/indexes

**Do this any time `firestore.rules` or `firestore.indexes.json` changes** — unlike the Vercel
app, these do **not** deploy automatically on push.

```
npm run deploy:rules
```

## Environment variables checklist

See `ENVIRONMENT.md` for the full list. In short: everything in `web/.env.local` needs a matching
entry in Vercel's dashboard (Settings → Environment Variables) for production — local `.env.local`
is never read in the deployed environment.

## Rolling back

Vercel keeps every previous deployment. To roll back: Vercel dashboard → project → **Deployments**
→ find a previous "Ready" deployment → **⋯** → **Promote to Production**. This does not touch
Firestore data or rules — only which frontend/API build is served.

## Custom domain (not yet configured)

The app currently lives at the default `*.vercel.app` domain. To add a custom domain later:
Vercel dashboard → project → **Settings → Domains** → add the domain → follow its DNS instructions.
No code changes needed — the app doesn't hard-code its own origin anywhere.
