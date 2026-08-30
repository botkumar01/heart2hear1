import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "./_lib/firebaseAdmin.js";
import { withAuth } from "./_lib/http.js";
import { invalidArgument, failedPrecondition, permissionDenied } from "./_lib/errors.js";
import { issueSessionMilestoneCertificates } from "./_lib/certificates.js";

const requestSchema = z.object({ sessionId: z.string().min(1) });

export default withAuth(async (req, res, decoded) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw invalidArgument(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const sessionRef = db().collection("supportSessions").doc(parsed.data.sessionId);
  const snap = await sessionRef.get();
  const session = snap.data();

  if (!snap.exists) throw invalidArgument("Session not found.");
  if (session?.clientUid !== decoded.uid && session?.helperUid !== decoded.uid) throw permissionDenied();
  if (session?.status !== "ACTIVE") {
    throw failedPrecondition("Only an active session can be completed.");
  }

  await sessionRef.update({
    status: "COMPLETED",
    completedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  if (session.helperUid) {
    const helperRef = db().collection("users").doc(session.helperUid);
    const newCount = await db().runTransaction(async (tx) => {
      const helperSnap = await tx.get(helperRef);
      const current = (helperSnap.data()?.completedSessions as number | undefined) ?? 0;
      const next = current + 1;
      tx.set(helperRef, { completedSessions: next, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      return next;
    });
    await issueSessionMilestoneCertificates(session.helperUid, newCount);
  }

  res.status(200).json({ status: "COMPLETED" });
});
