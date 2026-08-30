import { ethers } from "hardhat";

/**
 * Deploys Heart2HearRewardToken with the deployer wallet as the initial
 * admin/minter/pauser. That deployer wallet becomes the backend's reward
 * distributor (its private key goes into REWARD_DISTRIBUTOR_PRIVATE_KEY
 * server-side, never in this repo or the frontend) — see
 * docs/BLOCKCHAIN_SETUP.md.
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  const Token = await ethers.getContractFactory("Heart2HearRewardToken");
  const token = await Token.deploy(deployer.address);
  await token.waitForDeployment();

  const address = await token.getAddress();
  const network = await ethers.provider.getNetwork();

  console.log("\nHeart2HearRewardToken deployed to:", address);
  console.log("Network:", network.name, `(chainId ${network.chainId})`);
  console.log("\nAdd this to web/.env.local and Vercel env vars:");
  console.log(`REWARD_TOKEN_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
