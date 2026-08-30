import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "./_lib/firebaseAdmin.js";
import { withAuth } from "./_lib/http.js";
import { assertRole } from "./_lib/roles.js";
import { invalidArgument, failedPrecondition } from "./_lib/errors.js";

const requestSchema = z.object({
  professionalUid: z.string().min(1),
  slotId: z.string().min(1),
});

/**
 * Prevents double-booking with a Firestore transaction: the slot's
 * status is read and flipped to BOOKED atomically with the appointment
 * being created, so two clients racing for the same slot can't both
 * succeed (spec §64 edge case).
 */
export default withAuth(async (req, res, decoded) => {
  assertRole(decoded, "client");

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw invalidArgument(parsed.error.issues.map((i) => i.message).join("; "));
  }
  const { professionalUid, slotId } = parsed.data;

  const professionalRef = db().collection("users").doc(professionalUid);
  const slotRef = db().collection("professionals").doc(professionalUid).collection("availabilitySlots").doc(slotId);
  const appointmentRef = db().collection("appointments").doc();

  await db().runTransaction(async (tx) => {
    const [professionalSnap, slotSnap] = await Promise.all([tx.get(professionalRef), tx.get(slotRef)]);
    const professional = professionalSnap.data();

    if (!professionalSnap.exists || professional?.role !== "professional" || professional?.verificationStatus !== "VERIFIED") {
      throw failedPrecondition("This professional isn't currently accepting bookings.");
    }
    if (!slotSnap.exists || slotSnap.data()?.status !== "OPEN") {
      throw failedPrecondition("That slot is no longer available.");
    }

    tx.update(slotRef, { status: "BOOKED", appointmentId: appointmentRef.id });
    tx.set(appointmentRef, {
      clientUid: decoded.uid,
      professionalUid,
      slotId,
      startTime: slotSnap.data()!.startTime as Timestamp,
      durationMinutes: slotSnap.data()!.durationMinutes,
      feeInr: professional.consultationFeeInr ?? 0,
      status: "PENDING_PAYMENT",
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  res.status(200).json({ appointmentId: appointmentRef.id });
});
