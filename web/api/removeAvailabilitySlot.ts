import { z } from "zod";
import { db } from "./_lib/firebaseAdmin.js";
import { withAuth } from "./_lib/http.js";
import { assertRole } from "./_lib/roles.js";
import { invalidArgument, failedPrecondition } from "./_lib/errors.js";

const requestSchema = z.object({ slotId: z.string().min(1) });

export default withAuth(async (req, res, decoded) => {
  assertRole(decoded, "professional");

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw invalidArgument(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const slotRef = db()
    .collection("professionals")
    .doc(decoded.uid)
    .collection("availabilitySlots")
    .doc(parsed.data.slotId);
  const snap = await slotRef.get();

  if (!snap.exists) throw invalidArgument("Slot not found.");
  if (snap.data()?.status !== "OPEN") {
    throw failedPrecondition("Only an open (unbooked) slot can be removed.");
  }

  await slotRef.delete();
  res.status(200).json({ removed: true });
});
