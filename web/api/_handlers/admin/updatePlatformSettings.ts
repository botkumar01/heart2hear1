import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "../../_lib/firebaseAdmin.js";
import { withAuth } from "../../_lib/http.js";
import { assertRole } from "../../_lib/roles.js";
import { invalidArgument } from "../../_lib/errors.js";
import { logAdminAction } from "../../_lib/auditLog.js";

const requestSchema = z.object({
  training: z.object({ passScore: z.number().int().min(1).max(100) }).optional(),
  rewards: z
    .object({
      baseRewardTokens: z.number().min(0).max(1000),
      qualityBonusRatingThreshold: z.number().min(1).max(5),
      qualityBonusTokens: z.number().min(0).max(1000),
      minSessionDurationMinutes: z.number().min(0).max(180),
      minRatingForEligibility: z.number().min(1).max(5),
      dailyRewardCapPerHelper: z.number().int().min(0).max(1000),
    })
    .optional(),
});

/** Admin-configurable knobs (spec: pass score and reward formula must never be hard-coded). */
export default withAuth(async (req, res, decoded) => {
  assertRole(decoded, "admin");

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw invalidArgument(parsed.error.issues.map((i) => i.message).join("; "));
  }

  if (parsed.data.training) {
    await db()
      .collection("platformSettings")
      .doc("training")
      .set({ ...parsed.data.training, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  }
  if (parsed.data.rewards) {
    await db()
      .collection("platformSettings")
      .doc("rewards")
      .set({ ...parsed.data.rewards, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  }

  await logAdminAction({
    actorUid: decoded.uid,
    action: "PLATFORM_SETTINGS_UPDATED",
    metadata: parsed.data,
  });

  res.status(200).json({ updated: true });
});
