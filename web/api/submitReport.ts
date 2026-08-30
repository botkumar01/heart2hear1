import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "./_lib/firebaseAdmin.js";
import { withAuth } from "./_lib/http.js";
import { invalidArgument, permissionDenied } from "./_lib/errors.js";
import { enforceRateLimit } from "./_lib/rateLimit.js";

const requestSchema = z.object({
  sessionId: z.string().min(1).optional(),
  category: z.enum([
    "inappropriate_behavior",
    "medical_advice",
    "harassment",
    "unsafe_behavior",
    "privacy_violation",
    "impersonation",
    "abuse",
    "threats",
    "other",
  ]),
  description: z.string().trim().min(1).max(1000),
});

export default withAuth(async (req, res, decoded) => {
  await enforceRateLimit({ uid: decoded.uid, action: "submitReport", limit: 10, windowSeconds: 3600 });

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw invalidArgument(parsed.error.issues.map((i) => i.message).join("; "));
  }
  const { sessionId, category, description } = parsed.data;

  let targetUid: string | null = null;
  if (sessionId) {
    const sessionSnap = await db().collection("supportSessions").doc(sessionId).get();
    const session = sessionSnap.data();
    if (!sessionSnap.exists || (session?.clientUid !== decoded.uid && session?.helperUid !== decoded.uid)) {
      throw permissionDenied();
    }
    targetUid = session.clientUid === decoded.uid ? session.helperUid : session.clientUid;
  }

  const reportRef = await db()
    .collection("reports")
    .add({
      reporterUid: decoded.uid,
      targetUid,
      sessionId: sessionId ?? null,
      category,
      description,
      status: "OPEN",
      createdAt: FieldValue.serverTimestamp(),
    });

  res.status(200).json({ reportId: reportRef.id });
});
