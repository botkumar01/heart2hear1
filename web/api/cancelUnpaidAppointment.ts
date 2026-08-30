import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "./_lib/firebaseAdmin.js";
import { withAuth } from "./_lib/http.js";
import { invalidArgument, failedPrecondition, permissionDenied } from "./_lib/errors.js";

const requestSchema = z.object({ appointmentId: z.string().min(1) });

/**
 * Lets a client back out of checkout and free the slot for someone else,
 * rather than it staying locked forever (spec §64: "payment succeeds but
 * browser closes" and similar abandonment cases).
 */
export default withAuth(async (req, res, decoded) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw invalidArgument(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const appointmentRef = db().collection("appointments").doc(parsed.data.appointmentId);

  await db().runTransaction(async (tx) => {
    const snap = await tx.get(appointmentRef);
    const appointment = snap.data();
    if (!snap.exists) throw invalidArgument("Appointment not found.");
    if (appointment?.clientUid !== decoded.uid) throw permissionDenied();
    if (appointment?.status !== "PENDING_PAYMENT") {
      throw failedPrecondition("Only an unpaid appointment can be cancelled this way.");
    }

    const slotRef = db()
      .collection("professionals")
      .doc(appointment.professionalUid)
      .collection("availabilitySlots")
      .doc(appointment.slotId);

    tx.update(appointmentRef, { status: "CANCELLED", updatedAt: FieldValue.serverTimestamp() });
    tx.update(slotRef, { status: "OPEN", appointmentId: FieldValue.delete() });
  });

  res.status(200).json({ status: "CANCELLED" });
});
