import { Contract, JsonRpcProvider, Wallet } from "ethers";

// Minimal ABI — just the function/event this backend actually calls.
const REWARD_TOKEN_ABI = [
  "function rewardHelper(address helper, uint256 amount, string reason) external",
  "function balanceOf(address account) view returns (uint256)",
];

export function isBlockchainConfigured(): boolean {
  return Boolean(
    process.env.SEPOLIA_RPC_URL && process.env.REWARD_DISTRIBUTOR_PRIVATE_KEY && process.env.REWARD_TOKEN_ADDRESS,
  );
}

function getDistributorContract() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const privateKey = process.env.REWARD_DISTRIBUTOR_PRIVATE_KEY;
  const contractAddress = process.env.REWARD_TOKEN_ADDRESS;
  if (!rpcUrl || !privateKey || !contractAddress) {
    throw new Error(
      "Blockchain rewards aren't configured yet (SEPOLIA_RPC_URL / REWARD_DISTRIBUTOR_PRIVATE_KEY / " +
        "REWARD_TOKEN_ADDRESS). See docs/BLOCKCHAIN_SETUP.md.",
    );
  }
  const provider = new JsonRpcProvider(rpcUrl);
  const distributor = new Wallet(privateKey, provider);
  return new Contract(contractAddress, REWARD_TOKEN_ABI, distributor);
}

/**
 * Executes the on-chain reward mint. The backend has already decided
 * eligibility and amount before this is ever called (spec §34/§35) — this
 * function's only job is the transaction itself, plus returning the hash
 * for the ledger/explorer link.
 */
export async function sendRewardOnChain(params: {
  helperWalletAddress: string;
  amountTokens: number;
  reason: string;
}): Promise<{ txHash: string }> {
  const contract = getDistributorContract();
  // Reward token has 18 decimals by default (standard ERC20) — whole
  // tokens in, scaled up for the on-chain integer amount.
  const amountWei = BigInt(params.amountTokens) * 10n ** 18n;
  const tx = await contract.rewardHelper(params.helperWalletAddress, amountWei, params.reason);
  const receipt = await tx.wait();
  return { txHash: receipt.hash as string };
}
