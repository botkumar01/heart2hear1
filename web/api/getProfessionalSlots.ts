import { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "./_lib/firebaseAdmin.js";
import { withAuth } from "./_lib/http.js";
import { invalidArgument } from "./_lib/errors.js";

const requestSchema = z.object({ professionalUid: z.string().min(1) });

export default withAuth(async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw invalidArgument(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const snap = await db()
    .collection("professionals")
    .doc(parsed.data.professionalUid)
    .collection("availabilitySlots")
    .where("status", "==", "OPEN")
    .where("startTime", ">", Timestamp.now())
    .orderBy("startTime", "asc")
    .limit(50)
    .get();

  const slots = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      slotId: doc.id,
      startTime: (data.startTime as Timestamp).toDate().toISOString(),
      durationMinutes: data.durationMinutes,
    };
  });

  res.status(200).json({ slots });
});
