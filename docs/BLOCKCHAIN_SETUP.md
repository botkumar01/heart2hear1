# Blockchain Reward Setup (Sepolia testnet)

**ACCOUNTS REQUIRED: MetaMask, a Sepolia faucet, and an RPC provider (Alchemy)**

- **Why**: Helper rewards are transparent, verifiable on-chain tokens (spec §33-35) rather than an
  opaque database counter. This is a testnet/demo feature — Sepolia has no real monetary value.
- **What's already built**: `contracts/contracts/Heart2HearRewardToken.sol` (ERC20 + AccessControl
  + Pausable, OpenZeppelin), compiled and passing 4 tests (`cd contracts && npm test`).
  `web/api/_lib/blockchain.ts` and `_lib/rewards.ts` compute eligibility and execute the mint —
  they're wired into `submitHelperReview.ts` already, and simply leave a reward `PENDING`
  (never blocking the review) until the three env vars below are set.

## Step 1 — Install MetaMask (this is for *you*, to hold the deployer/distributor wallet)

**WHERE**: Browser → https://metamask.io → install the extension → create a new wallet.

**Never share or commit the seed phrase shown during setup.** Store it somewhere offline.

## Step 2 — Switch to the Sepolia test network

**WHERE**: MetaMask extension → network dropdown (top) → enable "Show test networks" in
Settings → General if it's hidden → select **Sepolia**.

## Step 3 — Get free Sepolia test ETH

You need a small amount of test ETH to pay gas for deploying the contract and sending reward
transactions — it has no real value.

**WHERE**: Browser → https://www.alchemy.com/faucets/ethereum-sepolia (or
https://sepoliafaucet.com) → paste your MetaMask address (copy it from the extension) → request.

**EXPECTED RESULT**: A small Sepolia ETH balance appears in MetaMask within a minute or two.

## Step 4 — Create a free Alchemy account (RPC provider)

Your server needs a way to talk to the Sepolia network — Alchemy provides that endpoint for free.

**WHERE**: Browser → https://www.alchemy.com → sign up → **Create new app** → Chain: **Ethereum**,
Network: **Sepolia**.

**STEPS**: Once created, click into the app → **API Key** → copy the **HTTPS** URL (looks like
`https://eth-sepolia.g.alchemy.com/v2/...`).

## Step 5 — Export the deployer/distributor private key

**This is the most sensitive credential in the whole project — it's what lets the backend send
reward transactions.**

**WHERE**: MetaMask extension → account menu (⋮) → **Account details** → **Show private key** →
enter your password.

**Never paste this into frontend code, a public repo, or anywhere but the env var below.**

## Step 6 — Set env vars and deploy the contract

**WHERE**: `web/.env.local`

```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-key
REWARD_DISTRIBUTOR_PRIVATE_KEY=your-metamask-private-key
```

**WHERE**: Terminal, at the repo root

```
cd contracts
npm install
npm run compile
npm test
npm run deploy:sepolia
```

**EXPECTED RESULT**: After a minute, the terminal prints something like:
```
Heart2HearRewardToken deployed to: 0x...
Add this to web/.env.local and Vercel env vars:
REWARD_TOKEN_ADDRESS=0x...
```

Add that address to `web/.env.local` as `REWARD_TOKEN_ADDRESS`, and to Vercel's environment
variables alongside the other two (Settings → Environment Variables) for production. Redeploy (or
push a commit) for Vercel to pick it up.

## Verifying it works

Once configured, completing and reviewing a helper session (rating ≥ 3, session ≥ 3 minutes, once
the helper has linked a MetaMask wallet from their Rewards page) should produce a `DISTRIBUTED`
entry in `rewardLedger` with a real Sepolia transaction, viewable at
`https://sepolia.etherscan.io/tx/<hash>` (linked directly from the Rewards page).
