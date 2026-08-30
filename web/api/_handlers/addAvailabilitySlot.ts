import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "../_lib/firebaseAdmin.js";
import { withAuth } from "../_lib/http.js";
import { assertRole } from "../_lib/roles.js";
import { invalidArgument, failedPrecondition } from "../_lib/errors.js";

const requestSchema = z.object({
  startTime: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(180).default(30),
});

export default withAuth(async (req, res, decoded) => {
  assertRole(decoded, "professional");

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw invalidArgument(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const start = new Date(parsed.data.startTime);
  if (start.getTime() <= Date.now()) {
    throw failedPrecondition("Slot must be in the future.");
  }

  const userSnap = await db().collection("users").doc(decoded.uid).get();
  if (userSnap.data()?.verificationStatus !== "VERIFIED") {
    throw failedPrecondition("You can add availability once you're verified.");
  }

  const slotRef = await db()
    .collection("professionals")
    .doc(decoded.uid)
    .collection("availabilitySlots")
    .add({
      startTime: Timestamp.fromDate(start),
      durationMinutes: parsed.data.durationMinutes,
      status: "OPEN",
      createdAt: FieldValue.serverTimestamp(),
    });

  res.status(200).json({ slotId: slotRef.id });
});
