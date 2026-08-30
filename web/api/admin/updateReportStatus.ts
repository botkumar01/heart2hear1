import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "../_lib/firebaseAdmin.js";
import { withAuth } from "../_lib/http.js";
import { assertRole } from "../_lib/roles.js";
import { invalidArgument } from "../_lib/errors.js";
import { logAdminAction } from "../_lib/auditLog.js";

const requestSchema = z.object({
  reportId: z.string().min(1),
  status: z.enum(["OPEN", "UNDER_REVIEW", "RESOLVED", "DISMISSED"]),
  resolutionNote: z.string().trim().max(1000).optional(),
});

export default withAuth(async (req, res, decoded) => {
  assertRole(decoded, "admin");

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw invalidArgument(parsed.error.issues.map((i) => i.message).join("; "));
  }

  await db()
    .collection("reports")
    .doc(parsed.data.reportId)
    .update({
      status: parsed.data.status,
      resolutionNote: parsed.data.resolutionNote ?? null,
      resolvedBy: decoded.uid,
      updatedAt: FieldValue.serverTimestamp(),
    });

  await logAdminAction({
    actorUid: decoded.uid,
    action: "REPORT_STATUS_UPDATED",
    targetUid: parsed.data.reportId,
    reason: parsed.data.resolutionNote,
    metadata: { status: parsed.data.status },
  });

  res.status(200).json({ status: parsed.data.status });
});
