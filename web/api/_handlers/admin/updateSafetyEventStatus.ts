import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "../../_lib/firebaseAdmin.js";
import { withAuth } from "../../_lib/http.js";
import { assertRole } from "../../_lib/roles.js";
import { invalidArgument } from "../../_lib/errors.js";
import { logAdminAction } from "../../_lib/auditLog.js";

const requestSchema = z.object({
  eventId: z.string().min(1),
  status: z.enum(["OPEN", "UNDER_REVIEW", "RESOLVED"]),
  reviewNote: z.string().trim().max(1000).optional(),
});

export default withAuth(async (req, res, decoded) => {
  assertRole(decoded, "admin");

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw invalidArgument(parsed.error.issues.map((i) => i.message).join("; "));
  }

  await db()
    .collection("safetyEvents")
    .doc(parsed.data.eventId)
    .update({
      status: parsed.data.status,
      reviewNote: parsed.data.reviewNote ?? null,
      reviewedBy: decoded.uid,
      updatedAt: FieldValue.serverTimestamp(),
    });

  await logAdminAction({
    actorUid: decoded.uid,
    action: "SAFETY_EVENT_STATUS_UPDATED",
    targetUid: parsed.data.eventId,
    reason: parsed.data.reviewNote,
    metadata: { status: parsed.data.status },
  });

  res.status(200).json({ status: parsed.data.status });
});
