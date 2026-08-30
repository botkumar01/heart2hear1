import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "./_lib/firebaseAdmin.js";
import { withAuth } from "./_lib/http.js";
import { invalidArgument, failedPrecondition, permissionDenied } from "./_lib/errors.js";
import { evaluateHelperSessionReward } from "./_lib/rewards.js";

const requestSchema = z.object({
  sessionId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
  feltHeard: z.boolean().optional(),
  wantsProfessionalSupport: z.boolean().optional(),
});

export default withAuth(async (req, res, decoded) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw invalidArgument(parsed.error.issues.map((i) => i.message).join("; "));
  }
  const { sessionId, rating, comment, feltHeard, wantsProfessionalSupport } = parsed.data;

  const sessionRef = db().collection("supportSessions").doc(sessionId);
  let helperUid = "";

  // Server-computed aggregate rating (spec §32) — done inside a
  // transaction so concurrent reviews can't race each other, and the
  // session's own status is the guard against duplicate/pre-completion/
  // self review (a client can never be the helper of their own session).
  await db().runTransaction(async (tx) => {
    const sessionSnap = await tx.get(sessionRef);
    const session = sessionSnap.data();

    if (!sessionSnap.exists) throw invalidArgument("Session not found.");
    if (session?.clientUid !== decoded.uid) throw permissionDenied();
    if (session?.status !== "COMPLETED") {
      throw failedPrecondition("You can only review a session after it's completed.");
    }

    const helperRef = db().collection("users").doc(session.helperUid);
    const helperSnap = await tx.get(helperRef);
    const helperData = helperSnap.data();
    const currentAvg = (helperData?.averageRating as number | undefined) ?? 0;
    const currentCount = (helperData?.ratingCount as number | undefined) ?? 0;
    const newCount = currentCount + 1;
    const newAvg = (currentAvg * currentCount + rating) / newCount;

    const reviewRef = db().collection("reviews").doc();
    tx.set(reviewRef, {
      sessionId,
      clientUid: decoded.uid,
      helperUid: session.helperUid,
      rating,
      comment: comment ?? null,
      feltHeard: feltHeard ?? null,
      wantsProfessionalSupport: wantsProfessionalSupport ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });

    tx.set(helperRef, { averageRating: newAvg, ratingCount: newCount }, { merge: true });
    tx.update(sessionRef, { status: "REVIEWED", updatedAt: FieldValue.serverTimestamp() });
    helperUid = session.helperUid as string;
  });

  await evaluateHelperSessionReward({ sessionId, helperUid, rating }).catch((err) =>
    console.error("Reward evaluation failed", err),
  );

  res.status(200).json({ status: "REVIEWED" });
});
