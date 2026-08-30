import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "./_lib/firebaseAdmin.js";
import { withAuth } from "./_lib/http.js";
import { assertRole } from "./_lib/roles.js";
import { invalidArgument, failedPrecondition } from "./_lib/errors.js";

const requestSchema = z.object({ helperUid: z.string().min(1) });

export default withAuth(async (req, res, decoded) => {
  assertRole(decoded, "client");

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw invalidArgument(parsed.error.issues.map((i) => i.message).join("; "));
  }

  const helperSnap = await db().collection("users").doc(parsed.data.helperUid).get();
  const helper = helperSnap.data();
  if (!helperSnap.exists || helper?.role !== "helper" || helper?.verificationStatus !== "VERIFIED") {
    throw failedPrecondition("This helper isn't currently available.");
  }

  const sessionRef = await db()
    .collection("supportSessions")
    .add({
      clientUid: decoded.uid,
      helperUid: parsed.data.helperUid,
      status: "REQUESTED",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

  res.status(200).json({ sessionId: sessionRef.id });
});
