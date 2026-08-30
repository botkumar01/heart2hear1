import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "../../_lib/firebaseAdmin.js";
import { withAuth } from "../../_lib/http.js";
import { assertRole } from "../../_lib/roles.js";
import { invalidArgument } from "../../_lib/errors.js";
import { logAdminAction } from "../../_lib/auditLog.js";

const requestSchema = z.object({
  targetUid: z.string().min(1),
  decision: z.enum(["approve", "reject"]),
  reason: z.string().trim().max(500).optional(),
});

export default withAuth(async (req, res, decoded) => {
  assertRole(decoded, "admin");

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw invalidArgument(parsed.error.issues.map((i) => i.message).join("; "));
  }
  const { targetUid, decision, reason } = parsed.data;

  const targetSnap = await db().collection("users").doc(targetUid).get();
  const targetRole = targetSnap.data()?.role as string | undefined;

  const newStatus = decision === "approve" ? "VERIFIED" : "VERIFICATION_FAILED";

  await db()
    .collection("users")
    .doc(targetUid)
    .set({ verificationStatus: newStatus, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

  const isProfessional = targetRole === "professional";
  const action =
    decision === "approve"
      ? isProfessional
        ? "ADMIN_VERIFIED_PROFESSIONAL"
        : "ADMIN_APPROVED_HELPER"
      : isProfessional
        ? "ADMIN_REJECTED_PROFESSIONAL"
        : "ADMIN_REJECTED_HELPER";

  await logAdminAction({ actorUid: decoded.uid, action, targetUid, reason });

  res.status(200).json({ verificationStatus: newStatus });
});
