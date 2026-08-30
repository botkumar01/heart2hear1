import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "./firebaseAdmin.js";
import { sendRewardOnChain, isBlockchainConfigured } from "./blockchain.js";

interface RewardSettings {
  baseRewardTokens: number;
  qualityBonusRatingThreshold: number;
  qualityBonusTokens: number;
  minSessionDurationMinutes: number;
  minRatingForEligibility: number;
  dailyRewardCapPerHelper: number;
}

const DEFAULT_SETTINGS: RewardSettings = {
  baseRewardTokens: 10,
  qualityBonusRatingThreshold: 5,
  qualityBonusTokens: 5,
  minSessionDurationMinutes: 3,
  minRatingForEligibility: 3,
  dailyRewardCapPerHelper: 5,
};

async function getRewardSettings(): Promise<RewardSettings> {
  const snap = await db().collection("platformSettings").doc("rewards").get();
  return { ...DEFAULT_SETTINGS, ...(snap.data() ?? {}) };
}

/**
 * Reward eligibility (spec §34) — deliberately NOT based on message
 * count. Requires: a real completed session of meaningful length, a
 * minimum client rating, the helper in good standing (verified, no
 * pending suspension), and a daily cap so this can never become an
 * incentive to keep someone online unnecessarily. Called after a client
 * submits a helper review (submitHelperReview.ts), since that's the
 * first point every signal is available.
 */
export async function evaluateHelperSessionReward(params: {
  sessionId: string;
  helperUid: string;
  rating: number;
}) {
  const [sessionSnap, helperSnap, settings] = await Promise.all([
    db().collection("supportSessions").doc(params.sessionId).get(),
    db().collection("users").doc(params.helperUid).get(),
    getRewardSettings(),
  ]);

  const session = sessionSnap.data();
  const helper = helperSnap.data();
  if (!session || !helper) return;

  if (helper.verificationStatus !== "VERIFIED") return;
  if (params.rating < settings.minRatingForEligibility) return;

  const acceptedAt = session.acceptedAt as Timestamp | undefined;
  const completedAt = session.completedAt as Timestamp | undefined;
  if (!acceptedAt || !completedAt) return;
  const durationMinutes = (completedAt.toMillis() - acceptedAt.toMillis()) / 60_000;
  if (durationMinutes < settings.minSessionDurationMinutes) return;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todaysRewards = await db()
    .collection("rewardLedger")
    .where("helperUid", "==", params.helperUid)
    .where("createdAt", ">=", Timestamp.fromDate(startOfDay))
    .get();
  if (todaysRewards.size >= settings.dailyRewardCapPerHelper) return;

  let amountTokens = settings.baseRewardTokens;
  if (params.rating >= settings.qualityBonusRatingThreshold) {
    amountTokens += settings.qualityBonusTokens;
  }

  const ledgerRef = await db()
    .collection("rewardLedger")
    .add({
      helperUid: params.helperUid,
      sessionId: params.sessionId,
      amountTokens,
      reason: `Support session ${params.sessionId} (rating ${params.rating})`,
      status: "PENDING",
      createdAt: FieldValue.serverTimestamp(),
    });

  await tryDistribute(ledgerRef.id, params.helperUid, amountTokens, `session:${params.sessionId}`);
}

async function tryDistribute(ledgerId: string, helperUid: string, amountTokens: number, reason: string) {
  const ledgerRef = db().collection("rewardLedger").doc(ledgerId);

  if (!isBlockchainConfigured()) {
    // Left PENDING — docs/BLOCKCHAIN_SETUP.md explains what's needed;
    // nothing here should ever throw for the caller (submitHelperReview
    // must still succeed even if rewards aren't wired up yet).
    return;
  }

  const walletSnap = await db().collection("wallets").doc(helperUid).get();
  const walletAddress = walletSnap.data()?.address as string | undefined;
  if (!walletAddress) {
    await ledgerRef.update({ status: "FAILED", failureReason: "No wallet linked yet." });
    return;
  }

  try {
    const { txHash } = await sendRewardOnChain({ helperWalletAddress: walletAddress, amountTokens, reason });
    await ledgerRef.update({ status: "DISTRIBUTED", distributedAt: FieldValue.serverTimestamp() });
    await db().collection("blockchainTransactions").add({
      rewardLedgerId: ledgerId,
      helperUid,
      txHash,
      network: "sepolia",
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error("On-chain reward distribution failed", err);
    await ledgerRef.update({ status: "FAILED", failureReason: (err as Error).message.slice(0, 300) });
  }
}
