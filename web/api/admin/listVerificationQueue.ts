import { db } from "../_lib/firebaseAdmin.js";
import { withAuth } from "../_lib/http.js";
import { assertRole } from "../_lib/roles.js";

/**
 * File lives at web/api/admin/listVerificationQueue.ts -> route
 * /api/admin/listVerificationQueue (Vercel mirrors the directory
 * structure under api/ into the URL path).
 */
export default withAuth(async (_req, res, decoded) => {
  assertRole(decoded, "admin");

  const snap = await db()
    .collection("users")
    .where("verificationStatus", "==", "UNDER_REVIEW")
    .limit(100)
    .get();

  const items = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      uid: doc.id,
      role: data.role,
      displayName: data.displayName,
      email: data.email,
      helperPath: data.helperPath ?? null,
      studentVerification: data.studentVerification ?? null,
      trainingCompleted: data.trainingCompleted ?? null,
      testPassed: data.testPassed ?? null,
      professionalVerification: data.professionalVerification ?? null,
    };
  });

  res.status(200).json({ items });
});
