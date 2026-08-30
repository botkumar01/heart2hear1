import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "./_lib/firebaseAdmin.js";
import { withAuth } from "./_lib/http.js";
import { assertRole } from "./_lib/roles.js";
import { invalidArgument } from "./_lib/errors.js";

const requestSchema = z.object({ available: z.boolean() });

export default withAuth(async (req, res, decoded) => {
  assertRole(decoded, "helper");

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw invalidArgument(parsed.error.issues.map((i) => i.message).join("; "));
  }

  await db()
    .collection("users")
    .doc(decoded.uid)
    .set({ availability: parsed.data.available, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

  res.status(200).json({ availability: parsed.data.available });
});
