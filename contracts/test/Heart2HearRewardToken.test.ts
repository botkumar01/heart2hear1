import { expect } from "chai";
import { ethers } from "hardhat";
import type { Heart2HearRewardToken } from "../typechain-types";

describe("Heart2HearRewardToken", () => {
  async function deployFixture() {
    const [admin, helper, stranger] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("Heart2HearRewardToken");
    const token = (await Token.deploy(admin.address)) as unknown as Heart2HearRewardToken;
    await token.waitForDeployment();
    return { token, admin, helper, stranger };
  }

  it("only lets an address with MINTER_ROLE reward a helper", async () => {
    const { token, helper, stranger } = await deployFixture();
    await expect(token.connect(stranger).rewardHelper(helper.address, ethers.parseEther("10"), "test"))
      .to.be.reverted;
  });

  it("mints reward tokens to the helper and emits RewardIssued", async () => {
    const { token, admin, helper } = await deployFixture();
    const amount = ethers.parseEther("15");

    await expect(token.connect(admin).rewardHelper(helper.address, amount, "session:abc"))
      .to.emit(token, "RewardIssued")
      .withArgs(helper.address, amount, "session:abc");

    expect(await token.balanceOf(helper.address)).to.equal(amount);
  });

  it("blocks minting while paused", async () => {
    const { token, admin, helper } = await deployFixture();
    await token.connect(admin).pause();
    await expect(
      token.connect(admin).rewardHelper(helper.address, ethers.parseEther("1"), "test"),
    ).to.be.reverted;
  });

  it("only PAUSER_ROLE can pause", async () => {
    const { token, stranger } = await deployFixture();
    await expect(token.connect(stranger).pause()).to.be.reverted;
  });
});
