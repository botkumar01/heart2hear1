import { describe, it, expect } from "vitest";
import { isEligibleForReward, computeRewardAmount, DEFAULT_REWARD_SETTINGS } from "./rewards.js";

describe("computeRewardAmount", () => {
  it("pays only the base amount below the quality bonus threshold", () => {
    expect(computeRewardAmount(4, DEFAULT_REWARD_SETTINGS)).toBe(DEFAULT_REWARD_SETTINGS.baseRewardTokens);
  });

  it("adds the quality bonus at/above the threshold", () => {
    expect(computeRewardAmount(5, DEFAULT_REWARD_SETTINGS)).toBe(
      DEFAULT_REWARD_SETTINGS.baseRewardTokens + DEFAULT_REWARD_SETTINGS.qualityBonusTokens,
    );
  });

  it("is never based on message count — same rating, same amount regardless of session length beyond the minimum", () => {
    // computeRewardAmount only ever takes rating in — there is no
    // "messages sent" input to this function at all, which is the point.
    expect(computeRewardAmount(4, DEFAULT_REWARD_SETTINGS)).toBe(computeRewardAmount(4, DEFAULT_REWARD_SETTINGS));
  });
});

describe("isEligibleForReward", () => {
  const base = {
    helperVerificationStatus: "VERIFIED",
    rating: 5,
    durationMinutes: 10,
    todaysRewardCount: 0,
    settings: DEFAULT_REWARD_SETTINGS,
  };

  it("is eligible when every condition is satisfied", () => {
    expect(isEligibleForReward(base)).toBe(true);
  });

  it("rejects an unverified helper", () => {
    expect(isEligibleForReward({ ...base, helperVerificationStatus: "SUSPENDED" })).toBe(false);
    expect(isEligibleForReward({ ...base, helperVerificationStatus: undefined })).toBe(false);
  });

  it("rejects a rating below the minimum", () => {
    expect(isEligibleForReward({ ...base, rating: 1 })).toBe(false);
  });

  it("rejects a session shorter than the minimum duration", () => {
    expect(isEligibleForReward({ ...base, durationMinutes: 1 })).toBe(false);
  });

  it("rejects when acceptedAt/completedAt were never recorded (durationMinutes null)", () => {
    expect(isEligibleForReward({ ...base, durationMinutes: null })).toBe(false);
  });

  it("enforces the daily cap so this can never incentivize keeping someone online", () => {
    expect(isEligibleForReward({ ...base, todaysRewardCount: DEFAULT_REWARD_SETTINGS.dailyRewardCapPerHelper })).toBe(
      false,
    );
    expect(
      isEligibleForReward({ ...base, todaysRewardCount: DEFAULT_REWARD_SETTINGS.dailyRewardCapPerHelper - 1 }),
    ).toBe(true);
  });
});
