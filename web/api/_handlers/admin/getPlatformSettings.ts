import { db } from "../../_lib/firebaseAdmin.js";
import { withAuth } from "../../_lib/http.js";
import { assertRole } from "../../_lib/roles.js";
import { DEFAULT_REWARD_SETTINGS } from "../../_lib/rewards.js";

const TRAINING_DEFAULTS = { passScore: 80 };

export default withAuth(async (_req, res, decoded) => {
  assertRole(decoded, "admin");

  const [trainingSnap, rewardsSnap] = await Promise.all([
    db().collection("platformSettings").doc("training").get(),
    db().collection("platformSettings").doc("rewards").get(),
  ]);

  res.status(200).json({
    training: { ...TRAINING_DEFAULTS, ...(trainingSnap.data() ?? {}) },
    rewards: { ...DEFAULT_REWARD_SETTINGS, ...(rewardsSnap.data() ?? {}) },
  });
});
