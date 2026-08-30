import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "../_lib/firebaseAdmin.js";
import { withAuth } from "../_lib/http.js";
import { assertRole } from "../_lib/roles.js";
import { invalidArgument, failedPrecondition, permissionDenied } from "../_lib/errors.js";

const requestSchema = z.object({
  sessionId: z.string().min(1),
  decision: z.enum(["accept", "decline"]),
});

/** Session lifecycle (spec §54): REQUESTED -> ACTIVE or CANCELLED. No other transition is valid from here. */
export default withAuth(async (req, res, decoded) => {
  assertRole(decoded, "helper");

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw invalidArgument(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const sessionRef = db().collection("supportSessions").doc(parsed.data.sessionId);
  const snap = await sessionRef.get();
  const session = snap.data();

  if (!snap.exists) throw invalidArgument("Session not found.");
  if (session?.helperUid !== decoded.uid) throw permissionDenied();
  if (session?.status !== "REQUESTED") {
    throw failedPrecondition(`This session is already ${session?.status}.`);
  }

  const newStatus = parsed.data.decision === "accept" ? "ACTIVE" : "CANCELLED";

  await sessionRef.update({
    status: newStatus,
    acceptedAt: newStatus === "ACTIVE" ? FieldValue.serverTimestamp() : null,
    updatedAt: FieldValue.serverTimestamp(),
  });

  res.status(200).json({ status: newStatus });
});
