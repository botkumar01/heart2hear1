import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "./_lib/firebaseAdmin.js";
import { withAuth } from "./_lib/http.js";
import { assertRole } from "./_lib/roles.js";
import { invalidArgument, failedPrecondition, permissionDenied } from "./_lib/errors.js";

const requestSchema = z.object({
  appointmentId: z.string().min(1),
  outcome: z.enum(["completed", "no_show"]).default("completed"),
});

export default withAuth(async (req, res, decoded) => {
  assertRole(decoded, "professional");

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw invalidArgument(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const appointmentRef = db().collection("appointments").doc(parsed.data.appointmentId);
  const snap = await appointmentRef.get();
  const appointment = snap.data();

  if (!snap.exists) throw invalidArgument("Appointment not found.");
  if (appointment?.professionalUid !== decoded.uid) throw permissionDenied();
  if (appointment?.status !== "CONFIRMED") {
    throw failedPrecondition("Only a confirmed appointment can be marked complete.");
  }

  const newStatus = parsed.data.outcome === "completed" ? "COMPLETED" : "NO_SHOW";

  await appointmentRef.update({
    status: newStatus,
    completedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  if (newStatus === "COMPLETED") {
    await db()
      .collection("users")
      .doc(decoded.uid)
      .set(
        { completedAppointments: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );
  }

  res.status(200).json({ status: newStatus });
});
