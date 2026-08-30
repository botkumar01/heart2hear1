import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "./_lib/firebaseAdmin.js";
import { withAuth } from "./_lib/http.js";
import { invalidArgument, failedPrecondition, permissionDenied } from "./_lib/errors.js";

const requestSchema = z.object({
  appointmentId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export default withAuth(async (req, res, decoded) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw invalidArgument(parsed.error.issues.map((i) => i.message).join("; "));
  }
  const { appointmentId, rating, comment } = parsed.data;

  const appointmentRef = db().collection("appointments").doc(appointmentId);

  await db().runTransaction(async (tx) => {
    const snap = await tx.get(appointmentRef);
    const appointment = snap.data();

    if (!snap.exists) throw invalidArgument("Appointment not found.");
    if (appointment?.clientUid !== decoded.uid) throw permissionDenied();
    if (appointment?.status !== "COMPLETED") {
      throw failedPrecondition("You can only review a completed appointment.");
    }
    if (appointment?.reviewed) {
      throw failedPrecondition("This appointment has already been reviewed.");
    }

    const professionalRef = db().collection("users").doc(appointment.professionalUid);
    const professionalSnap = await tx.get(professionalRef);
    const professionalData = professionalSnap.data();
    const currentAvg = (professionalData?.averageRating as number | undefined) ?? 0;
    const currentCount = (professionalData?.ratingCount as number | undefined) ?? 0;
    const newCount = currentCount + 1;
    const newAvg = (currentAvg * currentCount + rating) / newCount;

    const reviewRef = db().collection("reviews").doc();
    tx.set(reviewRef, {
      appointmentId,
      clientUid: decoded.uid,
      professionalUid: appointment.professionalUid,
      rating,
      comment: comment ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });

    tx.set(professionalRef, { averageRating: newAvg, ratingCount: newCount }, { merge: true });
    tx.update(appointmentRef, { reviewed: true, updatedAt: FieldValue.serverTimestamp() });
  });

  res.status(200).json({ reviewed: true });
});
